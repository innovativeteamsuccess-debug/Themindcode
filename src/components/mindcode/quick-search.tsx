"use client";

/* ============================================================
   QuickSearch — the campus search lens.
   One overlay, every destination: worlds, resources, trust
   pages. Opens from the navbar lens icon or ⌘K / Ctrl+K.
   Arrow keys + Enter fully keyboard drivable.
   ============================================================ */

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, CornerDownLeft, Search } from "lucide-react";
import { RESOURCES, WORLDS } from "./data";

type Hit = { label: string; hint: string; kind: string; href: string };

const INDEX: Hit[] = [
  ...WORLDS.map((w) => ({ label: w.label, hint: w.job, kind: "World", href: w.href })),
  { label: "Wall of Trust", hint: "Reviews", kind: "World", href: "/reviews" },
  { label: "Parent Zone", hint: "For families", kind: "World", href: "/parents" },
  { label: "The Founder", hint: "The person behind the code", kind: "World", href: "/about/founder" },
  ...RESOURCES.map((r) => ({
    label: r.title,
    hint: `Class ${r.cls} · ${r.chapter}`,
    kind: r.type,
    href: `/resources/${r.id}`,
  })),
];

export function QuickSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  /* reset the query each time the lens opens — React's render-time
     state-adjustment pattern (no effect, no cascading render) */
  const [lastOpen, setLastOpen] = useState(open);
  if (lastOpen !== open) {
    setLastOpen(open);
    if (open) {
      setQ("");
      setActive(0);
    }
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = needle
      ? INDEX.filter(
          (h) =>
            h.label.toLowerCase().includes(needle) ||
            h.hint.toLowerCase().includes(needle) ||
            h.kind.toLowerCase().includes(needle)
        )
      : INDEX.filter((h) => h.kind === "World");
    return base.slice(0, 9);
  }, [q]);

  /* shortcut: ⌘K / Ctrl+K toggles the lens */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  /* focus on open; scroll lock while open */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onOpenChange(false);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    }
    if (e.key === "Enter" && hits[active]) go(hits[active].href);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[210] flex items-start justify-center bg-[rgba(4,14,30,0.72)] px-4 pt-[14vh] backdrop-blur-sm"
          onClick={() => onOpenChange(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search The Mind Code"
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="mc-glass w-full max-w-xl overflow-hidden rounded-2xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-[var(--mc-line-soft)] px-4 py-3.5">
              <Search size={16} className="shrink-0 text-[var(--mc-accent-2)]" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
                placeholder="Search worlds, notes, practice papers…"
                aria-label="Search worlds, notes, practice papers"
                className="w-full bg-transparent text-[14.5px] text-[var(--mc-ink)] outline-none placeholder:text-[var(--mc-faint)]"
              />
              <kbd className="font-code hidden rounded-md border border-[var(--mc-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-widest text-faint sm:block">
                esc
              </kbd>
            </div>

            <div className="max-h-[46vh] overflow-y-auto p-1.5">
              {hits.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-dim">
                  Nothing matches “{q}” — try a chapter, a subject, a world.
                </p>
              )}
              {hits.map((h, i) => (
                <button
                  key={h.href + h.label}
                  onClick={() => go(h.href)}
                  onMouseEnter={() => setActive(i)}
                  aria-current={i === active}
                  className={
                    "flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors " +
                    (i === active ? "bg-[var(--mc-accent-soft)]" : "")
                  }
                >
                  <span className="font-code min-w-0 flex-1">
                    <span
                      className={
                        "block truncate text-[13.5px] font-semibold " +
                        (i === active ? "text-[var(--mc-accent)]" : "text-[var(--mc-ink)]")
                      }
                    >
                      {h.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-faint">
                      {h.kind} · {h.hint}
                    </span>
                  </span>
                  {i === active ? (
                    <CornerDownLeft size={13} className="shrink-0 text-[var(--mc-accent)]" aria-hidden />
                  ) : (
                    <ArrowUpRight size={13} className="shrink-0 text-faint" aria-hidden />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
