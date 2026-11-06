import { NextFetchEvent, NextRequest, NextResponse } from "next/server";

/* Next.js 16 middleware = proxy.ts (src/ directory).
   Until Clerk keys are present the site runs on its fallback auth,
   so the middleware simply passes through. Once keys land, Clerk
   takes over and /zone becomes a protected route. */

/* The public preview link is proxied TWICE:
     browser → preview-chat-….space-z.ai → ws-….fcapp.run (gateway) → sandbox
   so the app receives x-forwarded-host = the INTERNAL gateway host.
   Clerk's dev-mode handshake (and auth.protect redirects) then bounce
   browsers to that internal host, breaking the preview. Rewrite the
   forwarded host/proto to the true public origin before Clerk builds
   any URL. Override with APP_URL; default to this chat's preview host. */
const INTERNAL_GW_MARK = "fcapp.run";
const PUBLIC_HOST =
  process.env.APP_URL?.replace(/^https?:\/\//, "").replace(/\/+$/, "") ||
  "preview-chat-8689c798-d0d5-4eff-bd4c-e90f0fbd78f9.space-z.ai";

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  /* both keys must be present — a publishable key alone would make
     clerkMiddleware throw on every request */
  if (!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY)) {
    return NextResponse.next();
  }

  const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
  const isProtected = createRouteMatcher(["/zone(.*)"]);
  const handler = clerkMiddleware(async (auth, req) => {
    if (isProtected(req)) await auth.protect();
  });

  /* normalize forwarded headers behind the preview proxy (GET/HEAD only:
     no body to rebuild, and Clerk's handshake/protect redirects are all
     navigations). Space-z hosts are already public — leave them alone. */
  const fwdHost = request.headers.get("x-forwarded-host") ?? "";
  const isNavigation = request.method === "GET" || request.method === "HEAD";
  const alreadyPublic = /\.space-z\.ai/.test(fwdHost);
  if (isNavigation && !alreadyPublic && fwdHost.includes(INTERNAL_GW_MARK)) {
    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", PUBLIC_HOST);
    headers.set("x-forwarded-proto", "https");
    return handler(new NextRequest(request.url, { method: request.method, headers }), event);
  }

  return handler(request, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
