"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { SignInButton, Show, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

/* ============================================================
   Navbar auth — one control, two engines.

   • Clerk mode  — when Clerk keys are present the env var is
     inlined into the client bundle and Clerk's own SignInButton
     (modal) + UserButton take over, unchanged.
   • Fallback    — the site's real Google OAuth flow
     (/api/auth/google → consent screen → signed session cookie →
     Student Zone). Signed out: a LOG IN pill. Signed in: the
     student's avatar with a small menu (Student Zone · My
     Progress · Sign out). A tiny /api/auth/me probe on mount
     keeps every marketing page fully static.
   ============================================================ */

const CLERK_ON =
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) &&
  process.env.NEXT_PUBLIC_STATIC !== "1";
/* Static export (GoDaddy): no server, no auth — hide the control. */
const STATIC = process.env.NEXT_PUBLIC_STATIC === "1";

export function NavAuthControls() {
  if (STATIC) return null;
  if (!CLERK_ON) return <GoogleAuthControl />;

  return (
    <Suspense fallback={<span className="h-9 w-9 rounded-full border border-[var(--mc-line)]" />}>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            data-cursor="interactive"
            className="btn-mono flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mc-line)] px-0 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)] sm:w-auto sm:gap-1.5 sm:px-4"
          >
            <LogIn size={13} aria-hidden />
            <span className="hidden sm:inline">LOG IN</span>
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </Suspense>
  );
}

/* ------------------------------------------------------------------
   Fallback engine — real Google OAuth + signed session cookie.
   ------------------------------------------------------------------ */

type Me = {
  signedIn: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  } | null;
};

function GoogleAuthControl() {
  /* optimistic signed-out pill: the vast majority of visits are
     anonymous, so they get the button with zero flicker; signed-in
     students see it upgrade to their avatar a beat later */
  const [me, setMe] = useState<Me | null>(null);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  /* probe the session on mount and again after in-app navigations
     (cheap, and self-heals if any flow changed the session) */
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setMe(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  /* close on route change */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  /* Escape + outside pointer-down */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* ---- signed out: the LOG IN button (real Google OAuth) ---- */
  if (!me?.signedIn || !me.user) {
    return (
      <a
        href="/api/auth/google"
        data-cursor="interactive"
        aria-label="Log in with Google"
        title="Log in with Google"
        className="btn-mono flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mc-line)] px-0 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)] sm:w-auto sm:gap-1.5 sm:px-4"
      >
        <LogIn size={13} aria-hidden />
        <span className="hidden sm:inline">LOG IN</span>
      </a>
    );
  }

  /* ---- signed in: avatar chip + mini menu ---- */
  const user = me.user;
  const displayName = user.name ?? user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls="nav-auth-panel"
        aria-label={`Account — ${displayName}`}
        onClick={() => setOpen((v) => !v)}
        data-cursor="interactive"
        className="flex h-9 items-center gap-2 rounded-full border border-[var(--mc-line)] pl-1 pr-2.5 transition-colors hover:border-[var(--mc-accent)]"
      >
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-7 w-7 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="font-display flex h-7 w-7 items-center justify-center rounded-full bg-[var(--mc-accent-soft)] text-[12px] font-semibold text-[var(--mc-accent)]">
            {initial}
          </span>
        )}
        <span className="hidden max-w-[6.5rem] truncate text-[12px] font-medium text-[var(--mc-ink)] md:inline">
          {displayName}
        </span>
        <svg
          viewBox="0 0 24 24"
          width="11"
          height="11"
          aria-hidden
          className={cn("text-faint transition-transform duration-300", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="nav-auth-panel"
            role="menu"
            aria-label="Account"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="mc-glass absolute right-0 top-full z-50 mt-3 w-60 overflow-hidden rounded-2xl p-1.5 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.5)]"
          >
            {/* who's signed in */}
            <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5">
              {user.image ? (
                <img
                  src={user.image}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-display flex h-9 w-9 items-center justify-center rounded-full bg-[var(--mc-accent-soft)] text-[14px] font-semibold text-[var(--mc-accent)]">
                  {initial}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold text-[var(--mc-ink)]">
                  {displayName}
                </span>
                <span className="font-code block truncate text-[9px] uppercase tracking-[0.14em] text-faint">
                  {user.email}
                </span>
              </span>
            </div>

            <div className="mt-1 border-t border-[var(--mc-line-soft)] pt-1">
              <Link
                href="/zone"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-dim transition-colors hover:bg-[var(--mc-accent-soft)] hover:text-[var(--mc-ink)]"
              >
                <GraduationCap size={14} className="text-faint" />
                Student Zone
              </Link>
              <Link
                href="/dashboard"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-dim transition-colors hover:bg-[var(--mc-accent-soft)] hover:text-[var(--mc-ink)]"
              >
                <LayoutDashboard size={14} className="text-faint" />
                My Progress
              </Link>
            </div>

            <div className="mt-1 border-t border-[var(--mc-line-soft)] p-1.5">
              <a
                href="/api/auth/signout"
                role="menuitem"
                className="btn-mono flex items-center justify-center gap-2 rounded-xl border border-[var(--mc-line)] px-3 py-2.5 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
              >
                <LogOut size={12} />
                SIGN OUT
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
