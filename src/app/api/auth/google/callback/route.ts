import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  createSessionToken,
  exchangeCodeForProfile,
  publicOrigin,
  upsertGoogleUser,
} from "@/lib/auth";
import { rateLimit, tooMany, clientIp } from "@/lib/rate-limit";

/* Step 2 of Google sign-in: verify state, exchange the code for a
   real Google profile, upsert the user in SQLite, set the signed
   session cookie and land in the Student Zone. */
export async function GET(req: Request) {
  /* anonymous endpoint that talks to Google — per-IP flood guard */
  if (!rateLimit(`oauth-cb:${clientIp(req)}`, 15, 60_000)) {
    return tooMany(60_000, "Too many sign-in attempts — give it a minute.");
  }

  const url = new URL(req.url);
  const origin = publicOrigin(req);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(`${origin}/zone?error=missing_code`);
  }

  const store = await cookies();
  const saved = store.get("tmc_oauth_state")?.value;
  /* timing-safe compare: never leak the state byte-by-byte */
  const a = Buffer.from(saved ?? "");
  const b = Buffer.from(state ?? "");
  if (!saved || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.redirect(`${origin}/zone?error=bad_state`);
  }

  // replay protection: one state, one use
  store.delete("tmc_oauth_state");

  try {
    const profile = await exchangeCodeForProfile(code, origin);
    const user = await upsertGoogleUser(profile);

    const res = NextResponse.redirect(`${origin}/zone`);
    res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (e) {
    const reason = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(
      `${origin}/zone?error=google_failed&reason=${encodeURIComponent(reason)}`
    );
  }
}
