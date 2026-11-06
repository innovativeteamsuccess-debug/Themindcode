import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

/* ============================================================
   Real Google OAuth 2.0 + signed session cookie.

   No third-party auth SDK, no mock: the /api/auth/google route
   redirects to Google's consent screen with PKCE-less state
   (HMAC-verified), the callback exchanges the code at
   oauth2.googleapis.com, upserts the user in SQLite and sets an
   HMAC-SHA256-signed session cookie.

   Required env (see .env):
     GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — from Google Cloud
       Console (Web application client; redirect URI:
       <origin>/api/auth/google/callback)
     AUTH_SECRET — random 32-byte hex, signs the session cookie
     ADMIN_EMAILS — comma-separated emails that may open the
       Test Builder (the founder)
   ============================================================ */

export const SESSION_COOKIE = "tmc_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  admin: boolean;
};

/* ---------- signing ---------- */

function sign(payload: string): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createSessionToken(userId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_SECONDS * 1000 })
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sign(payload), sig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      uid: string;
      exp: number;
    };
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return data.uid;
  } catch {
    return null;
  }
}

/* ---------- session helpers (server components / routes) ---------- */

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const uid = verifySessionToken(token);
  if (!uid) return null;
  const user = await db.user.findUnique({ where: { id: uid } });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    admin: isAdminEmail(user.email),
  };
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/* ---------- public origin (proxy-aware) ---------- */

/* Behind the preview/production reverse proxy the app receives
   requests addressed to localhost, so `new URL(req.url).origin`
   would redirect browsers to a dead localhost. The proxy (Caddy)
   forwards the real Host and X-Forwarded-Proto — rebuild the public
   origin from those, with an optional explicit APP_URL override. */
export function publicOrigin(req: Request): string {
  const configured = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim();
  if (configured) return configured.replace(/\/+$/, "");

  const h = req.headers;
  const proto =
    h.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    (h.get("host")?.includes("localhost") ? "http" : "https");
  const host =
    h.get("x-forwarded-host")?.split(",")[0]?.trim() || h.get("host");
  if (host) return `${proto}://${host}`;

  return new URL(req.url).origin;
}

/* ---------- Google endpoints ---------- */

export function googleAuthUrl(origin: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

export async function exchangeCodeForProfile(
  code: string,
  origin: string
): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) throw new Error(`token_exchange_failed_${res.status}`);
  const tokens = (await res.json()) as { access_token?: string };
  if (!tokens.access_token) throw new Error("no_access_token");

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) throw new Error(`userinfo_failed_${infoRes.status}`);
  const profile = (await infoRes.json()) as GoogleProfile;
  if (!profile.email) throw new Error("no_email");
  return profile;
}

export async function upsertGoogleUser(profile: GoogleProfile) {
  return db.user.upsert({
    where: { email: profile.email },
    update: {
      name: profile.name ?? null,
      image: profile.picture ?? null,
      googleId: profile.sub,
    },
    create: {
      email: profile.email,
      name: profile.name ?? null,
      image: profile.picture ?? null,
      googleId: profile.sub,
    },
  });
}
