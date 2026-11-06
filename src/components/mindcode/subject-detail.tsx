"use client";

/* ============================================================
   /classes/[cls]/[subject] — CHAPTER CONSTELLATION.
   The subject screen: chapters plotted as a living star map.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  chaptersFor,
  RESOURCES,
  SUBJECTS,
  SUBJECT_TAGLINES,
  slugify,
  TESTS,
  type SubjectKey,
} from "./data";
import { constellationPositions, SCENES, StatusGlyph, subjectColor, wrapLabel } from "./subject-scenes";
import { Crumbs, EmptyState, WorldBody, WorldHeader } from "./world-shell";

export function SubjectDetail({ cls, subjectKey }: { cls: number; subjectKey: SubjectKey }) {
  const subject = SUBJECTS.find((s) => s.key === subjectKey)!;
  const chapters = chaptersFor(cls, subjectKey);
  const Scene = SCENES[subjectKey];
  const color = subjectColor(subject);
  const subjectTests = TESTS.filter((t) => t.cls === cls && t.subject === subjectKey);
  const subjectResources = RESOURCES.filter((r) => r.cls === cls && r.subject === subjectKey);

  const positions = constellationPositions(chapters.length);
  const W = 1000;
  const H = 516;

  return (
    <main className="flex-1">
      <WorldHeader
        glyph={subject.glyph}
        world={`CLASS ${cls} · ${subject.name.toUpperCase()}`}
        title={subject.name.toUpperCase()}
        titleAccent={undefined}
        sub={SUBJECT_TAGLINES[subjectKey]}
      >
        <Crumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Classes", href: "/classes" },
            { label: `Class ${cls}`, href: `/classes/${cls}` },
            { label: subject.name },
          ]}
        />
      </WorldHeader>

      <WorldBody className="pb-24">
        {/* subject banner art */}
        <div
          className="relative mb-12 h-40 overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)] md:h-48"
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-[0.55]"
            style={{
              background:
                "radial-gradient(ellipse 60% 90% at 50% 100%, color-mix(in srgb, " +
                color +
                " 22%, transparent), transparent 70%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-full max-w-xl">
              <Scene color={color} />
            </div>
          </div>
        </div>

        {/* CHAPTER CONSTELLATION */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] font-semibold tracking-[-0.02em]">
            Chapter{" "}
            <span className="accent-serif text-[var(--mc-accent)]">constellation</span>
          </h2>
          <span className="font-code text-[9.5px] uppercase tracking-[0.2em] text-faint">
            {chapters.length} CHAPTERS · CLICK A STAR
          </span>
        </div>

        {chapters.length > 0 ? (
          <>
            {/* desktop constellation */}
            <div className="relative hidden overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)] lg:block">
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="list" aria-label={`${subject.name} chapters map`}>
                {/* connective lines */}
                <g stroke="var(--mc-line)" strokeOpacity="0.6">
                  {positions.slice(1).map((p, i) => {
                    const prev = positions[i];
                    return <line key={i} x1={prev.x} y1={prev.y} x2={p.x} y2={p.y} />;
                  })}
                </g>
                {positions.map((p, i) => {
                  const ch = chapters[i];
                  const href = `/classes/${cls}/${subjectKey}/${slugify(ch.name)}`;
                  const [l1, l2] = wrapLabel(ch.name);
                  return (
                    <g key={ch.name} role="listitem">
                      <a href={href} className="group">
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="7"
                          fill={ch.status === "done" ? "var(--mc-accent)" : "var(--mc-card)"}
                          stroke={ch.status === "todo" ? "var(--mc-faint)" : "var(--mc-accent)"}
                          strokeWidth="1.4"
                        />
                        {ch.status === "progress" && (
                          <circle cx={p.x} cy={p.y} r="3.2" fill="var(--mc-ink)" fillOpacity="0.75" />
                        )}
                        <text
                          x={p.x}
                          y={p.y - 16}
                          textAnchor="middle"
                          fontSize="11.5"
                          fill="var(--mc-ink)"
                          className="constellation-label"
                        >
                          {l1}
                        </text>
                        {l2 && (
                          <text x={p.x} y={p.y - 4} textAnchor="middle" fontSize="11.5" fill="var(--mc-ink)" className="constellation-label">
                            {l2}
                          </text>
                        )}
                        <text x={p.x} y={p.y + 22} textAnchor="middle" fontSize="9" fill="var(--mc-faint)" fontFamily="'Space Mono', monospace">
                          {String(i + 1).padStart(2, "0")}
                        </text>
                      </a>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* chapter list — tablet & mobile */}
            <div className="grid gap-2.5 lg:hidden">
              {chapters.map((ch, i) => (
                <motion.div
                  key={ch.name}
                  initial={{ opacity: 0, x: -14 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.03 * i }}
                >
                  <Link
                    href={`/classes/${cls}/${subjectKey}/${slugify(ch.name)}`}
                    className="mc-card flex items-center gap-3.5 px-4 py-3.5 transition-colors active:border-[var(--mc-accent)]"
                  >
                    <StatusGlyph status={ch.status} />
                    <span className="flex-1 text-[13.5px] font-medium leading-snug">{ch.name}</span>
                    <span className="font-code text-[9px] text-faint">{String(i + 1).padStart(2, "0")}</span>
                    <ArrowUpRight size={13} className="text-faint" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            glyph="🗺"
            title="The map is still being drawn."
            body={`Chapter constellations for Class ${cls} ${subject.name} are being charted with care.`}
            action={
              <Link href="/classes" className="btn-mono rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] text-dim">
                BACK TO CLASSES
              </Link>
            }
          />
        )}

        {/* subject test + resources */}
        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          <div className="mc-card p-6">
            <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              Test missions for this subject
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {subjectTests.length > 0 ? (
                subjectTests.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tests/${t.id}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--mc-line)] px-4 py-3 transition-all hover:border-[var(--mc-accent)]"
                  >
                    <span className="text-[13.5px] font-medium">{t.title}</span>
                    <span className="btn-mono flex shrink-0 items-center gap-1.5 text-[9px] text-faint group-hover:text-[var(--mc-accent)]">
                      <FlaskConical size={11} /> {t.questions.length}Q · {t.minutes}m
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-[13px] leading-relaxed text-dim">
                  Missions for this subject are being brewed. The lab already runs daily quizzes and
                  Class 10 simulations.
                </p>
              )}
            </div>
          </div>

          <div className="mc-card p-6">
            <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              Artifacts in the vault
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {subjectResources.length > 0 ? (
                subjectResources.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={`/resources/${r.id}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-[var(--mc-line)] px-4 py-3 transition-all hover:border-[var(--mc-accent)]"
                  >
                    <span className="text-[13.5px] font-medium leading-snug">{r.title}</span>
                    <span className="font-code shrink-0 text-[9px] uppercase tracking-[0.14em] text-faint group-hover:text-[var(--mc-accent)]">
                      {r.type}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-[13px] leading-relaxed text-dim">
                  Nothing filed under this subject yet — the vault grows every week.
                </p>
              )}
            </div>
            <Link
              href={`/resources?class=${cls}&subject=${subjectKey}`}
              className="btn-mono mt-5 inline-flex items-center gap-2 text-[10px] text-[var(--mc-accent)]"
            >
              SEE ALL IN THE VAULT <ArrowUpRight size={11} />
            </Link>
          </div>
        </div>
      </WorldBody>
    </main>
  );
}

/* legend */
export function ChapterLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-4 text-[10.5px] text-faint", className)}>
      <span className="flex items-center gap-1.5">
        <StatusGlyph status="done" size={11} /> mastered
      </span>
      <span className="flex items-center gap-1.5">
        <StatusGlyph status="progress" size={11} /> in progress
      </span>
      <span className="flex items-center gap-1.5">
        <StatusGlyph status="todo" size={11} /> unexplored
      </span>
    </div>
  );
}
