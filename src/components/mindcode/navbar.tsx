"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Book,
  ChevronDown,
  FlaskConical,
  GraduationCap,
  Heart,
  Home,
  LayoutDashboard,
  Moon,
  Search,
  Sparkles,
  Star,
  Sun,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Magnetic } from "./magnetic";
import { QuickSearch } from "./quick-search";
import { NavAuthControls } from "./nav-auth-controls";

/* ------------------------------------------------------------------
   Navigation model — mirrors the campus map:
     Home · Classes ▾ · Resources · Practice ▾ · Community ▾
   Every world stays one tap away; dropdowns keep the bar clean.
   On phones the single Menu dropdown owns ALL routes.
   ------------------------------------------------------------------ */

type NavItem = { label: string; href: string; icon?: React.ComponentType<{ size?: number; className?: string }> };
type NavGroup = { label: string; items: readonly NavItem[] };
type NavLink =
  | { label: string; href: string; groups?: undefined }
  | { label: string; href?: string; groups: readonly NavGroup[] };

const CLASSES_GROUP: readonly NavGroup[] = [
  {
    label: "CLASSES",
    items: [
      { label: "All Class Worlds", href: "/classes", icon: GraduationCap },
      { label: "CODE AI", href: "/code", icon: Sparkles },
      { label: "Books", href: "/books", icon: Book },
    ],
  },
];

const PRACTICE_GROUP: readonly NavGroup[] = [
  {
    label: "PRACTICE",
    items: [
      { label: "Test Lab", href: "/tests", icon: FlaskConical },
      { label: "My Progress", href: "/dashboard", icon: LayoutDashboard },
      { label: "Student Zone", href: "/zone", icon: GraduationCap },
    ],
  },
];

const COMMUNITY_GROUP: readonly NavGroup[] = [
  {
    label: "COMMUNITY",
    items: [
      { label: "Home Tuition", href: "/tuition", icon: Home },
      { label: "Parent Zone", href: "/parents", icon: Users },
      { label: "Wall of Trust", href: "/reviews", icon: Star },
      { label: "About", href: "/about", icon: Heart },
      { label: "The Founder", href: "/about/founder", icon: Users },
    ],
  },
];

const PRIMARY: readonly NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Classes", groups: CLASSES_GROUP },
  { label: "Resources", href: "/resources" },
  { label: "AI Classroom", href: "/tutor" },
  { label: "Studio", href: "/studio" },
  { label: "Practice", groups: PRACTICE_GROUP },
  { label: "Community", groups: COMMUNITY_GROUP },
];

const MENU_GROUPS: readonly NavGroup[] = [
  {
    label: "LEARN",
    items: [
      { label: "Home", href: "/", icon: Home },
      { label: "Classes", href: "/classes", icon: GraduationCap },
      { label: "Resources", href: "/resources", icon: Book },
      { label: "Test Lab", href: "/tests", icon: FlaskConical },
      { label: "CODE AI", href: "/code", icon: Sparkles },
      { label: "CODE Studio — AI canvas", href: "/studio", icon: Sparkles },
      { label: "Home Tuition", href: "/tuition", icon: Home },
    ],
  },
  {
    label: "MORE",
    items: [
      { label: "Student Zone", href: "/zone", icon: GraduationCap },
      { label: "Progress", href: "/dashboard", icon: LayoutDashboard },
      { label: "Parent Zone", href: "/parents", icon: Users },
      { label: "Books", href: "/books", icon: Book },
      { label: "Reviews", href: "/reviews", icon: Star },
      { label: "About", href: "/about", icon: Heart },
      { label: "The Founder", href: "/about/founder", icon: Users },
    ],
  },
];

const isActive = (href: string, pathname: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

const emptySubscribe = () => () => {};

export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    /* official brand emblem — shield, open book, bulb & brain */
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src="/logo-mark.png"
      alt=""
      width={size}
      height={size}
      className="inline-block object-contain"
      style={{ width: size, height: size }}
      draggable={false}
    />
  );
}

/* ------------------------------------------------------------------
   NavDropdown — one down-arrow, all options.
   Opens on hover (mouse only), toggles on click/tap, closes on
   Escape, outside pointer-down, route change or leaving the wrapper.
   ------------------------------------------------------------------ */

function NavDropdown({
  id,
  label,
  groups,
  panelClassName,
}: {
  id: string;
  label: string;
  groups: readonly NavGroup[];
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  /* timestamp of the last mouse-driven open — lets a tap's trailing
     click pass through without immediately re-closing the panel */
  const hoverOpenedAt = useRef(0);
  const pathname = usePathname();

  /* route changes always dismiss the panel — React's render-time
     state-adjustment pattern (no effect, no cascading render) */
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  /* outside pointer-down + Escape */
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

  const anyActive = groups.some((g) => g.items.some((i) => isActive(i.href, pathname)));

  return (
    <div
      ref={wrapRef}
      className="relative"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") {
          setOpen(true);
          hoverOpenedAt.current = performance.now();
        }
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setOpen(false);
      }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        onClick={() => {
          if (performance.now() - hoverOpenedAt.current < 650) return;
          setOpen((v) => !v);
        }}
        className={cn(
          "flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] transition-colors duration-300 hover:bg-[var(--mc-accent-soft)] hover:text-[var(--mc-ink)]",
          anyActive ? "text-[var(--mc-ink)]" : "text-dim"
        )}
      >
        {label}
        <ChevronDown
          size={13}
          aria-hidden
          className={cn("transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={id}
            role="menu"
            aria-label={label}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "mc-glass absolute right-0 top-full z-50 mt-3 w-56 overflow-hidden rounded-2xl p-1.5 shadow-[0_20px_60px_-16px_rgba(0,0,0,0.5)]",
              panelClassName
            )}
          >
            {groups.map((g, gi) => (
              <div key={g.label} className={cn(gi > 0 && "mt-1 border-t border-[var(--mc-line-soft)] pt-1.5")}>
                {groups.length > 1 && (
                  <span className="font-code block px-3 pb-1.5 pt-2 text-[8.5px] uppercase tracking-[0.26em] text-faint">
                    {g.label}
                  </span>
                )}
                {g.items.map((m) => {
                  const active = isActive(m.href, pathname);
                  return (
                    <Link
                      key={m.href}
                      href={m.href}
                      role="menuitem"
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition-colors hover:bg-[var(--mc-accent-soft)] hover:text-[var(--mc-ink)]",
                        active ? "text-[var(--mc-accent)]" : "text-dim"
                      )}
                    >
                      {m.icon && <m.icon size={14} className={active ? "" : "text-faint"} />}
                      {m.label}
                      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--mc-accent)]" aria-hidden />}
                    </Link>
                  );
                })}
              </div>
            ))}

            {/* phones hide the navbar CTA below sm — keep booking one tap away */}
            <div className="mt-1.5 border-t border-[var(--mc-line-soft)] p-1.5 sm:hidden">
              <Link
                href="/tuition"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="btn-mono flex items-center justify-center gap-2 rounded-xl bg-[var(--mc-cta-bg)] px-3 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
              >
                BOOK A DEMO <ArrowUpRight size={13} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { theme, setTheme } = useTheme();

  /* distraction-free mode: the test runner owns the whole screen */
  const isRunner = /^\/tests\/[^/]+/.test(pathname ?? "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isRunner) return null;

  return (
    <>
      <ScrollProgress />
      <QuickSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <motion.header
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-[100] flex justify-center px-3 pt-3 md:px-6 md:pt-5"
      >
        <nav
          aria-label="Primary"
          className={cn(
            "flex w-full max-w-6xl items-center gap-2 rounded-full border px-3 py-2 transition-all duration-500 md:px-4",
            scrolled
              ? "border-[var(--mc-line)] bg-[color-mix(in_srgb,var(--mc-card)_94%,transparent)] shadow-[0_10px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl"
              : "mc-glass"
          )}
        >
          <Link
            href="/"
            className="group flex items-center gap-2.5 pr-2"
            aria-label="The Mind Code — home"
          >
            <span
              className="relative flex h-9 w-9 items-center justify-center rounded-full transition-shadow group-hover:shadow-[0_0_22px_-2px_var(--mc-glow)]"
              style={{
                background:
                  "radial-gradient(circle at 34% 26%, #fdfaf4, #f1e9da 72%)",
                boxShadow:
                  "0 0 16px -4px var(--mc-glow), 0 2px 8px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(120,53,15,0.14)",
              }}
              aria-hidden
            >
              <LogoMark size={25} />
            </span>
            <span
              className={cn(
                "font-bold tracking-[0.18em] transition-all duration-500",
                scrolled ? "text-[11px]" : "text-[12.5px]"
              )}
            >
              THE MIND CODE
            </span>
          </Link>

          {/* desktop — Home · Classes ▾ · Resources · Practice ▾ · Community ▾ */}
          <div className="mx-auto hidden items-center gap-0.5 lg:flex">
            {PRIMARY.map((l) => {
              if (l.groups) {
                return (
                  <NavDropdown
                    key={l.label}
                    id={`nav-${l.label.toLowerCase()}-panel`}
                    label={l.label}
                    groups={l.groups}
                  />
                );
              }
              const active = isActive(l.href, pathname);
              return (
                <Link
                  key={l.label}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[13px] transition-colors duration-300",
                    active
                      ? "bg-[var(--mc-accent)] font-semibold text-white shadow-[0_0_18px_-4px_var(--mc-glow)]"
                      : "text-dim hover:bg-[var(--mc-accent-soft)] hover:text-[var(--mc-ink)]"
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mc-line)] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
              aria-label="Search the campus (Ctrl+K)"
              data-cursor="interactive"
            >
              <Search size={15} />
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--mc-line)] text-dim transition-colors hover:text-[var(--mc-accent)]"
              aria-label="Toggle light and dark mode"
              data-cursor="interactive"
            >
              {mounted && theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <NavAuthControls />

            <span className="hidden sm:inline-block">
              <Magnetic strength={0.18}>
                <Link
                  href="/tuition"
                  className="btn-mono group flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[var(--mc-cta-bg)] px-4 py-2 text-[10.5px] text-[var(--mc-cta-fg)] shadow-[0_0_24px_-6px_var(--mc-glow)] transition-transform duration-300 hover:scale-[1.03]"
                >
                  BOOK A DEMO
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </Magnetic>
            </span>

            {/* phone — one down arrow, every option on hover/tap */}
            <div className="lg:hidden">
              <NavDropdown
                id="nav-menu-panel"
                label="Menu"
                groups={MENU_GROUPS}
                panelClassName="w-64 max-w-[calc(100vw-1.5rem)] max-h-[calc(100svh-5.5rem)] overflow-y-auto"
              />
            </div>
          </div>
        </nav>
      </motion.header>
    </>
  );
}

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[105] h-[2px]">
      <div
        className="h-full origin-left bg-[var(--mc-accent)] transition-transform duration-150"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}
