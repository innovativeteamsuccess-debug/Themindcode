import { NextResponse } from "next/server";
import { SESSION_COOKIE, publicOrigin } from "@/lib/auth";

/* Sign out — clear the session cookie, return to the homepage. */
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const res = NextResponse.redirect(`${origin}/`);
  /* overwrite-then-expire: guaranteed to match how the cookie was set
     (path + flags) so every browser actually drops it */
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function POST(req: Request) {
  return GET(req);
}
