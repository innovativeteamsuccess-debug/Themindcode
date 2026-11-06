"use client";

import { SignOutButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

/* Clerk-mode sign out for the Student Zone header — clears the real
   Clerk session (the custom /api/auth/signout only clears the
   fallback cookie, so it must NOT be used when Clerk is on). */
export function ClerkSignOut() {
  return (
    <SignOutButton redirectUrl="/">
      <button
        type="button"
        data-cursor="interactive"
        className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
      >
        <LogOut size={12} />
        SIGN OUT
      </button>
    </SignOutButton>
  );
}
