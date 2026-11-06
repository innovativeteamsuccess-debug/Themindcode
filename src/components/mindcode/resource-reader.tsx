"use client";

/* ============================================================
   /resources/[id] — the reader.
   Left: document navigation. Centre: the document. Right:
   quick tools. A real learning-platform reading experience.
   ============================================================ */

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Check,
  CheckCircle2,
  Download,
  FlaskConical,
  Save,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  APP_URL,
  RESOURCES,
  SUBJECTS,
  type Resource,
} from "./data";
import { Crumbs, WorldBody } from "./world-shell";
import { useUniverse } from "./store";

/** The reader's document outline — generated from the artifact's shape. */
function outlineFor(r: Resource): string[] {
  switch (r.type) {
    case "Formula Sheet":
      return ["The formulas at a glance", "When to use which", "One-line proofs", "Common traps"];
    case "Mind Map":
      return ["Central idea", "Main branches", "Connections", "Recall prompts"];
    case "Worksheet":
      return ["Warm-up questions", "Core practice", "Challenge corner", "Answer key"];
    case "Sample Paper":
    case "Practice Paper":
      return ["Instructions", "Section A — objective", "Section B — short answer", "Section C — long answer"];
    case "PYQs":
      return ["How to read a PYQ", "Questions by year", "Marks distribution", "Pattern notes"];
    default:
      return ["The core idea", "Step-by-step explanation", "Worked examples", "Quick self-check"];
  }
}

export function ResourceReader({ id }: { id: string }) {
  const r = RESOURCES.find((x) => x.id === id);
  const setCodeOpen = useUniverse((s) => s.setCodeOpen);

  const [saved, setSaved] = useState(false);
  const [done, setDone] = useState(false);
  const [section, setSection] = useState(0);

  if (!r) {
    return (
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-5 pb-24 pt-40 md:px-8">
          <div className="mc-card p-10 text-center">
            <p className="font-display text-2xl">That artifact drifted out of orbit.</p>
            <p className="mt-3 text-sm text-dim">
              The vault it belonged to is still right where you left it.
            </p>
            <Link
              href="/resources"
              className="btn-mono mt-6 inline-flex rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
            >
              BACK TO THE VAULT
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const subject = SUBJECTS.find((s) => s.key === r.subject)!;
  const color = `var(${subject.varName})`;
  const outline = outlineFor(r);
  const related = RESOURCES.filter(
    (x) => x.id !== r.id && x.subject === r.subject && x.cls === r.cls
  ).slice(0, 4);

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-7xl px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <Crumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Resources", href: "/resources" },
            { label: r.title },
          ]}
        />

        {/* masthead */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="font-code flex items-center gap-2 text-[9.5px] uppercase tracking-[0.24em] text-faint">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
              CLASS {r.cls} · {subject.name.toUpperCase()} · {r.type.toUpperCase()}
            </p>
            <h1 className="font-display mt-3 max-w-2xl text-[clamp(1.8rem,4.4vw,3rem)] font-semibold leading-[1.05] tracking-[-0.02em]">
              {r.title}
            </h1>
            <p className="mt-2 text-[13px] text-dim">
              {r.chapter} · PDF · {r.pages} pages · {r.size} ·{" "}
              <span className="font-semibold text-[var(--mc-accent)]">FREE</span>
              {r.verified && (
                <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-[var(--mc-accent)]">
                  <BadgeCheck size={11} /> site favourite
                </span>
              )}
            </p>
          </div>
          <Link
            href={`/classes/${r.cls}/${r.subject}`}
            className="btn-mono group hidden items-center gap-2 rounded-full border border-[var(--mc-line)] px-4 py-2.5 text-[9.5px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)] sm:inline-flex"
          >
            GO TO THE SUBJECT <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        {/* the reader: nav | document | tools */}
        <div className="grid gap-5 lg:grid-cols-[240px_1fr_260px]">
          {/* left — document navigation */}
          <aside className="mc-card h-fit p-4 lg:sticky lg:top-28">
            <h2 className="font-code px-1 text-[9px] uppercase tracking-[0.24em] text-faint">
              In this document
            </h2>
            <nav className="mt-3 flex flex-col gap-0.5" aria-label="Document sections">
              {outline.map((o, i) => (
                <button
                  key={o}
                  onClick={() => setSection(i)}
                  aria-current={section === i ? "true" : undefined}
                  className={cn(
                    "rounded-xl px-3 py-2.5 text-left text-[12.5px] transition-colors",
                    section === i
                      ? "bg-[var(--mc-accent-soft)] font-medium text-[var(--mc-accent)]"
                      : "text-dim hover:bg-[var(--mc-card-2)] hover:text-[var(--mc-ink)]"
                  )}
                >
                  <span className="font-code mr-2 text-[9px] opacity-60">{String(i + 1).padStart(2, "0")}</span>
                  {o}
                </button>
              ))}
            </nav>

            {related.length > 0 && (
              <>
                <h2 className="font-code mt-6 px-1 text-[9px] uppercase tracking-[0.24em] text-faint">
                  Pairs well with
                </h2>
                <div className="mt-3 flex flex-col">
                  {related.map((x) => (
                    <Link
                      key={x.id}
                      href={`/resources/${x.id}`}
                      className="rounded-xl px-3 py-2.5 text-[12.5px] leading-snug text-dim transition-colors hover:bg-[var(--mc-card-2)] hover:text-[var(--mc-ink)]"
                    >
                      {x.title}
                    </Link>
                  ))}
                </div>
              </>
            )}
          </aside>

          {/* centre — the document */}
          <article>
            <motion.div
              key={`${r.id}-${section}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="relative overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)]"
            >
              {/* document page head */}
              <div
                className="border-b border-[var(--mc-line-soft)] p-6 md:p-8"
                style={{
                  background: `linear-gradient(160deg, color-mix(in srgb, ${color} 10%, transparent), transparent 60%)`,
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-code text-[9px] uppercase tracking-[0.26em]" style={{ color }}>
                      THE MIND CODE · {r.type.toUpperCase()}
                    </p>
                    <h2 className="font-display mt-2 text-xl leading-snug md:text-2xl">{r.title}</h2>
                  </div>
                  <span
                    className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg"
                    style={{ borderColor: color, color }}
                    aria-hidden
                  >
                    {r.index}
                  </span>
                </div>
              </div>

              {/* the "page" — a calm typographic preview of the artifact */}
              <div className="px-6 py-8 md:px-10 md:py-10">
                <h3 className="font-display text-lg text-[var(--mc-ink)]">{outline[section]}</h3>
                <div className="mt-6 flex flex-col gap-3.5" aria-hidden>
                  {[96, 88, 92, 60, 0, 90, 84, 40].slice(section % 2, (section % 2) + 6).map((w, i) => (
                    <span
                      key={i}
                      className="h-2.5 rounded-full bg-[var(--mc-line)]"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
                <p className="mt-8 border-t border-[var(--mc-line-soft)] pt-5 text-[12.5px] leading-relaxed text-dim">
                  This is the in-app preview of{" "}
                  <span className="font-semibold text-[var(--mc-ink)]">{r.title}</span>. The full
                  {r.pages}-page PDF — printable, shareable, free — lives in the Mind Core app.
                </p>
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mono mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-4 py-2.5 text-[9.5px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                >
                  <Download size={11} /> GET IT ON GOOGLE PLAY
                </a>
              </div>

              {/* page footer */}
              <div className="flex items-center justify-between border-t border-[var(--mc-line-soft)] px-6 py-4 text-[10.5px] text-faint md:px-8">
                <span>
                  Page {section + 1} of {outline.length}
                </span>
                <span className="font-code uppercase tracking-[0.18em]">
                  {r.pages} pages in the full PDF
                </span>
              </div>
            </motion.div>

            {/* pager */}
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setSection((s) => Math.max(0, s - 1))}
                disabled={section === 0}
                className="btn-mono rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9.5px] text-dim transition-all enabled:hover:border-[var(--mc-accent)] enabled:hover:text-[var(--mc-accent)] disabled:opacity-35"
              >
                ← PREVIOUS
              </button>
              <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">
                {outline[section]}
              </span>
              <button
                onClick={() => setSection((s) => Math.min(outline.length - 1, s + 1))}
                disabled={section === outline.length - 1}
                className="btn-mono rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9.5px] text-dim transition-all enabled:hover:border-[var(--mc-accent)] enabled:hover:text-[var(--mc-accent)] disabled:opacity-35"
              >
                NEXT →
              </button>
            </div>
          </article>

          {/* right — quick tools */}
          <aside className="flex flex-col gap-3 lg:sticky lg:top-28 lg:h-fit">
            <h2 className="font-code px-1 text-[9px] uppercase tracking-[0.24em] text-faint">
              Quick tools
            </h2>

            <ToolButton
              icon={saved ? Check : Save}
              label={saved ? "Saved to your shelf" : "Save for later"}
              active={saved}
              onClick={() => setSaved((v) => !v)}
            />
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mc-card group flex items-center gap-3 p-4 text-left transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)] text-[var(--mc-accent)]">
                <Download size={15} />
              </span>
              <span className="text-[13px] font-medium">Download PDF</span>
              <ArrowUpRight size={12} className="ml-auto text-faint" />
            </a>
            <ToolButton
              icon={Sparkles}
              label="Ask CODE"
              onClick={() => setCodeOpen(true)}
            />
            <Link
              href="/tests"
              className="mc-card group flex items-center gap-3 p-4 text-left transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)] text-[var(--mc-accent)]">
                <FlaskConical size={15} />
              </span>
              <span className="text-[13px] font-medium">Take a quiz</span>
              <ArrowUpRight size={12} className="ml-auto text-faint" />
            </Link>
            <ToolButton
              icon={done ? CheckCircle2 : BookOpen}
              label={done ? "Completed ✓" : "Mark as complete"}
              active={done}
              onClick={() => setDone((v) => !v)}
            />

            {done && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] px-4 py-3 text-[12px] leading-relaxed text-[var(--mc-accent)]"
              >
                Nicely done. One artifact at a time — that is how vaults get emptied.
              </motion.p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "mc-card flex w-full items-center gap-3 p-4 text-left transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]",
        active && "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)]"
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)]",
          active ? "text-[var(--mc-accent)]" : "text-[var(--mc-accent)]"
        )}
      >
        <Icon size={15} />
      </span>
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  );
}
