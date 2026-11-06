import { NextResponse } from "next/server";
import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { googleAuthUrl, googleConfigured, publicOrigin } from "@/lib/auth";
import { rateLimit, tooMany, clientIp } from "@/lib/rate-limit";

/* Step 1 of Google sign-in: bounce to the consent screen.
   State is HMAC-signed and stored in a short-lived cookie so the
   callback can verify it came from this flow. */
export async function GET(req: Request) {
  /* anonymous endpoint — per-IP flood guard (state forging attempts,
     consent-screen hammering) */
  if (!rateLimit(`oauth-start:${clientIp(req)}`, 10, 60_000)) {
    return tooMany(60_000, "Too many sign-in attempts — give it a minute.");
  }

  const origin = publicOrigin(req);
  if (!googleConfigured()) {
    /* no raw JSON for humans — land them on the styled Student Zone,
       which explains the one-time setup honestly */
    return NextResponse.redirect(`${origin}/zone?error=google_not_configured`);
  }
  const state = randomBytes(16).toString("hex");
  const signed = `${state}.${createHmac("sha256", process.env.AUTH_SECRET ?? "").update(state).digest("base64url")}`;

  const store = await cookies();
  store.set("tmc_oauth_state", signed, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(googleAuthUrl(origin, signed));
}
