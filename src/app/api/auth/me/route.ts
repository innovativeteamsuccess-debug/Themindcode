import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

/* Who am I? — the navbar asks this on mount so its LOG IN button can
   become the student's avatar WITHOUT forcing every marketing page
   into dynamic rendering. Works for both engines (Clerk + fallback
   Google OAuth) because getCurrentUser is the one identity adapter. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json(
      { signedIn: Boolean(user), user },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    /* never let a session hiccup break the navbar */
    return NextResponse.json(
      { signedIn: false, user: null },
      { headers: { "cache-control": "no-store" } }
    );
  }
}
