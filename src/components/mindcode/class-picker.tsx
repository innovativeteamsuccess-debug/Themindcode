"use client";

/* ============================================================
   /classes — CHOOSE YOUR CLASS. Huge playful world cards.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CLASS_WORLDS, CLASSES } from "./data";
import { WorldHeader, WorldBody } from "./world-shell";
import { subjectColor } from "./subject-scenes";

const ALL_IDS = [6, 7, 8, 9, 10, 11, 12];

const ACCENTS: Record<number, string> = {
  6: "--sub-science", 7: "--sub-hindi", 8: "--sub-english",
  9: "--sub-sst", 10: "--sub-math", 11: "--sub-sanskrit", 12: "--sub-math",
};

export function ClassPicker() {
  return (
    <main className="flex-1">
      <WorldHeader
        glyph="🎓"
        world="CLASSES · WORLDS"
        title="Choose your"
        titleAccent="class."
        sub="Every class is a world with its own subjects, chapters, resources and missions. Pick yours."
      />
      <WorldBody className="pb-24 pt-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_IDS.map((id, i) => {
            const w = CLASS_WORLDS[id];
            const open = w.status === "open";
            const accent = `var(${ACCENTS[id]})`;
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: 0.05 * (i % 3), ease: [0.22, 1, 0.36, 1] }}
              >
                <ClassCard id={id} open={open} accent={accent} />
              </motion.div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-[12px] text-faint">
          A universe for Classes 6–12. Class 11 and 12 are still forming — free notes
          today:{" "}
          <span className="text-[var(--mc-accent)]">Classes 6–10, CBSE aligned.</span>
        </p>
      </WorldBody>
    </main>
  );
}

function ClassCard({ id, open, accent }: { id: number; open: boolean; accent: string }) {
  const w = CLASS_WORLDS[id];
  const legacy = CLASSES.find((c) => c.id === id);

  const inner = (
    <>
      {/* generative orbit art */}
      <div className="relative h-36 overflow-hidden" aria-hidden>
        <svg viewBox="0 0 300 150" className="h-full w-full">
          <circle cx="150" cy="150" r={open ? 60 : 44} fill={accent} fillOpacity="0.06" />
          {Array.from({ length: legacy?.rings ?? 3 }).map((_, i) => (
            <circle
              key={i}
              cx="150"
              cy="150"
              r={64 + i * 20}
              fill="none"
              stroke={accent}
              strokeOpacity={0.16 + i * 0.06}
              strokeDasharray={i % 2 ? "3 7" : undefined}
            />
          ))}
          <circle cx="150" cy="150" r="34" fill="none" stroke={accent} strokeOpacity="0.5" />
          <text
            x="150"
            y="162"
            textAnchor="middle"
            fill={accent}
            fontSize="26"
            fontFamily="var(--font-serif-display), Georgia, serif"
          >
            {id}
          </text>
        </svg>
        {!open && (
          <span className="font-code absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[8.5px] uppercase tracking-[0.18em] text-faint">
            <Lock size={9} /> forming
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6 pt-2">
        <span className="font-code text-[9.5px] uppercase tracking-[0.3em]" style={{ color: accent }}>
          CLASS {id}
        </span>
        <h3 className="font-display mt-2.5 text-[1.55rem] leading-tight md:text-2xl">{w.title}</h3>
        <p className="mt-2 text-[13px] text-dim">{w.sub}</p>

        <span
          className={cn(
            "btn-mono mt-auto inline-flex items-center gap-2 pt-6 text-[10px]",
            open ? "text-[var(--mc-accent)]" : "text-faint"
          )}
        >
          {open ? "ENTER THE WORLD" : "JOIN THE WAITLIST"}
          <ArrowRight
            size={12}
            className={cn("transition-transform", open && "group-hover:translate-x-1")}
          />
        </span>
      </div>
    </>
  );

  const shell = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-500",
    open
      ? "border-[var(--mc-line)] bg-[var(--mc-card)] hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_55%,transparent)] hover:shadow-[0_24px_60px_-24px_var(--mc-glow)]"
      : "border-[var(--mc-line)] bg-[var(--mc-card)] opacity-70 hover:opacity-90"
  );

  if (open) {
    return (
      <Link href={`/classes/${id}`} data-cursor="interactive" className={shell}>
        {inner}
      </Link>
    );
  }
  return (
    <div className={shell} aria-disabled>
      {inner}
    </div>
  );
}

/* colour import guard (kept for tree-shaking symmetry) */
void subjectColor;
