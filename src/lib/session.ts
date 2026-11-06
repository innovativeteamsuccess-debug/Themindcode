/* ============================================================
   Unified request identity for API routes.
   Order: Clerk session (when enabled) → signed cookie session.
   Returns null when the visitor is signed out.
   ============================================================ */

import { getSessionUser, isAdminEmail, type SessionUser } from "./auth";

const clerkOn = () =>
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);

export async function getRequestUser(): Promise<SessionUser | null> {
  if (clerkOn()) {
    try {
      const clerk = await import("@clerk/nextjs/server");
      const cu = await clerk.currentUser();
      if (cu) {
        const email = cu.primaryEmailAddress?.emailAddress ?? cu.emailAddresses[0]?.emailAddress ?? "";
        return {
          id: `clerk:${cu.id}`,
          email,
          name: cu.fullName ?? cu.firstName ?? null,
          image: cu.imageUrl ?? null,
          admin: isAdminEmail(email),
        };
      }
      /* Clerk is on but this visitor has no Clerk session — still allow
         the legacy signed-cookie session to count (migration window). */
      const cookieUser = await getSessionUser();
      if (cookieUser) return cookieUser;
      return null;
    } catch (err) {
      console.error("[session] clerk currentUser failed:", err instanceof Error ? err.message : err);
      /* Clerk hiccup → fall through to cookie */
    }
  }
  return getSessionUser();
}

export function unauthorized() {
  return Response.json(
    { ok: false, error: "Please log in to use CODE — it's free, and it keeps your lessons safe.", code: "auth_required" },
    { status: 401 }
  );
}
