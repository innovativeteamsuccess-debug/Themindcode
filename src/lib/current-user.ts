import { db } from "./db";
import { getSessionUser, isAdminEmail, type SessionUser } from "./auth";

/* ============================================================
   One identity adapter for the whole site.

   • Clerk mode  — when Clerk keys are present in the environment,
     the signed-in Clerk user is mirrored into our Prisma User table
     (matched by email, so Google sign-ups and future methods all
     land on one row). Prisma id remains the foreign key for tests
     and attempts.
   • Fallback mode — the original signed-cookie flow, kept so the
     Student Zone keeps working until the Clerk keys land.
   ============================================================ */

export const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export async function getCurrentUser(): Promise<SessionUser | null> {
  if (CLERK_ENABLED) {
    const { currentUser } = await import("@clerk/nextjs/server");
    const cu = await currentUser();
    if (!cu) return null;
    const email = cu.primaryEmailAddress?.emailAddress;
    if (!email) return null;

    const user = await db.user.upsert({
      where: { email },
      update: {
        name: cu.fullName ?? cu.firstName ?? null,
        image: cu.imageUrl || null,
        googleId: cu.id,
      },
      create: {
        email,
        name: cu.fullName ?? cu.firstName ?? null,
        image: cu.imageUrl || null,
        googleId: cu.id,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      admin: isAdminEmail(user.email),
    };
  }

  return getSessionUser();
}
