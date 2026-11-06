"use client";

/* ============================================================
   WORLD SHELL — shared primitives for every dedicated screen.
   Breadcrumb trail, world header, and playful empty states.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[11px] text-faint">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight size={11} className="opacity-50" />}
          {c.href ? (
            <Link href={c.href} className="link-sweep transition-colors hover:text-[var(--mc-accent)]">
              {c.label}
            </Link>
          ) : (
            <span className="text-dim" aria-current="page">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** The standard header of every world screen. */
export function WorldHeader({
  glyph,
  world,
  title,
  titleAccent,
  sub,
  meta,
  children,
}: {
  glyph?: string;
  world: string;
  title: string;
  titleAccent?: string;
  sub: string;
  meta?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 20% 0%, var(--mc-accent-soft), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-28 md:px-8 md:pt-36">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="eyebrow flex items-center gap-3"
        >
          {glyph && <span className="text-base leading-none" aria-hidden>{glyph}</span>}
          {world}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-4xl text-[clamp(2.3rem,6.2vw,4.6rem)] font-semibold leading-[1.0] tracking-[-0.03em]"
        >
          {title}
          {titleAccent && (
            <>
              {" "}
              <span className="accent-serif text-[var(--mc-accent)]">{titleAccent}</span>
            </>
          )}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.14 }}
          className="mt-4 max-w-xl text-[15px] leading-relaxed text-dim md:text-base"
        >
          {sub}
        </motion.p>
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {children}
          </motion.div>
        )}
        {meta && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.26 }}
            className="mt-6"
          >
            {meta}
          </motion.div>
        )}
      </div>
    </header>
  );
}

/** A page body wrapper with the standard max width. */
export function WorldBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("mx-auto max-w-6xl px-5 md:px-8", className)}>{children}</div>;
}

/* ------------------------------------------------------------------ */
/* Playful empty states — never "No data available."                   */
/* ------------------------------------------------------------------ */

export function EmptyState({
  glyph = "✦",
  title,
  body,
  action,
}: {
  glyph?: string;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="mc-card relative flex flex-col items-center gap-4 overflow-hidden px-6 py-14 text-center"
    >
      <span
        className="pointer-events-none absolute -top-16 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full opacity-30"
        style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
      />
      <span className="font-display flex h-14 w-14 items-center justify-center rounded-full border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-xl" aria-hidden>
        {glyph}
      </span>
      <p className="font-display text-xl md:text-2xl">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-dim">{body}</p>
      {action}
    </motion.div>
  );
}
