"use client";

import { useMemo, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CLASSES,
  SUBJECTS,
  CLASS10_CHAPTERS,
  CHAPTER_ACTIONS,
  RESOURCES,
  STATS,
  type SubjectKey,
  type Subject,
  type Chapter,
} from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { useUniverse } from "./store";

/* ------------------------------------------------------------------ */
/* Subject scenes — elegant per-subject visuals                        */
/* ------------------------------------------------------------------ */

function MathScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g stroke={color} strokeOpacity="0.16">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 22} y1="10" x2={20 + i * 22} y2="130" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={12 + i * 22} x2="196" y2={12 + i * 22} />
        ))}
      </g>
      <line x1="20" y1="80" x2="196" y2="80" stroke={color} strokeOpacity="0.55" />
      <line x1="60" y1="10" x2="60" y2="130" stroke={color} strokeOpacity="0.55" />
      <path
        d="M 40 20 Q 110 190 180 30"
        stroke={color}
        strokeWidth="1.6"
        className="dash-draw"
        strokeDasharray="300"
        style={{ strokeDashoffset: 300, animation: "dash-draw 1.6s ease-out forwards" }}
      />
      <circle cx="110" cy="103" r="3" fill={color} />
      <circle cx="145" cy="66" r="3" fill={color} />
      <circle cx="70" cy="51" r="3" fill={color} />
      <text x="150" y="34" fill={color} fontSize="11" fontFamily="'Space Grotesk', sans-serif" opacity="0.9">
        y = ax² + bx + c
      </text>
      <text x="26" y="22" fill={color} fontSize="10" opacity="0.6">Δ &lt; 0</text>
    </svg>
  );
}

function ScienceScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g transform="translate(110 70)">
        <circle r="5" fill={color} />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" transform="rotate(60)" />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" transform="rotate(-60)" />
        <circle cx="46" cy="0" r="2.6" fill={color} />
        <circle cx="-23" cy="40" r="2.6" fill={color} />
        <circle cx="-23" cy="-40" r="2.6" fill={color} />
      </g>
      {/* molecule */}
      <g transform="translate(36 108)">
        <line x1="0" y1="0" x2="26" y2="-16" stroke={color} strokeOpacity="0.6" />
        <line x1="26" y1="-16" x2="52" y2="0" stroke={color} strokeOpacity="0.6" />
        <circle r="4.5" fill={color} fillOpacity="0.9" />
        <circle cx="26" cy="-16" r="3.4" fill={color} fillOpacity="0.7" />
        <circle cx="52" r="4.5" fill={color} fillOpacity="0.9" />
      </g>
      <text x="150" y="120" fill={color} fontSize="10" opacity="0.7" fontFamily="'Space Grotesk', sans-serif">
        2H₂ + O₂ → 2H₂O
      </text>
    </svg>
  );
}

function SstScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g transform="translate(64 58)">
        <circle r="34" stroke={color} strokeOpacity="0.8" />
        <ellipse rx="34" ry="12" stroke={color} strokeOpacity="0.5" />
        <ellipse rx="14" ry="34" stroke={color} strokeOpacity="0.5" />
        <line x1="-34" y1="0" x2="34" y2="0" stroke={color} strokeOpacity="0.5" />
        <path d="M -12 8 Q 0 22 14 10" stroke={color} strokeOpacity="0.7" fill="none" />
      </g>
      {/* timeline */}
      <line x1="118" y1="112" x2="204" y2="112" stroke={color} strokeOpacity="0.55" />
      {[124, 148, 172, 196].map((x, i) => (
        <circle key={x} cx={x} cy="112" r={i === 2 ? 4 : 2.6} fill={color} fillOpacity={i === 2 ? 1 : 0.65} />
      ))}
      <text x="118" y="128" fill={color} fontSize="9" opacity="0.65" fontFamily="'Space Grotesk', sans-serif">1857</text>
      <text x="184" y="128" fill={color} fontSize="9" opacity="0.65" fontFamily="'Space Grotesk', sans-serif">1947</text>
      <path d="M 150 70 l 10 12 -10 12" stroke={color} strokeOpacity="0.4" />
    </svg>
  );
}

function EnglishScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="26"
        y="86"
        fill={color}
        fillOpacity="0.9"
        fontSize="64"
        fontWeight="300"
        fontFamily="'Space Grotesk', sans-serif"
      >
        Aa
      </text>
      <g stroke={color} strokeOpacity="0.4" strokeLinecap="round">
        <line x1="110" y1="42" x2="196" y2="42" />
        <line x1="110" y1="58" x2="186" y2="58" />
        <line x1="110" y1="74" x2="196" y2="74" />
        <line x1="110" y1="90" x2="172" y2="90" />
      </g>
      <text x="196" y="34" fill={color} fontSize="24" opacity="0.75" fontFamily="Georgia, serif">”</text>
      <text x="104" y="118" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">
        metaphor · imagery · tone
      </text>
    </svg>
  );
}

function HindiScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="30"
        y="88"
        fill={color}
        fillOpacity="0.92"
        fontSize="58"
        fontWeight="400"
        fontFamily="'Noto Sans Devanagari', 'Mangal', sans-serif"
      >
        अ
      </text>
      <g stroke={color} strokeOpacity="0.4" strokeLinecap="round">
        <path d="M 116 48 q 18 -12 36 0" />
        <path d="M 116 66 q 26 -16 52 0" />
        <path d="M 116 84 q 34 -20 68 0" />
      </g>
      <text x="150" y="118" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">
        भाषा · व्याकरण · साहित्य
      </text>
    </svg>
  );
}

function SanskritScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="66"
        y="94"
        fill={color}
        fillOpacity="0.92"
        fontSize="60"
        fontFamily="'Noto Sans Devanagari', 'Mangal', sans-serif"
      >
        ॐ
      </text>
      <circle cx="110" cy="70" r="52" stroke={color} strokeOpacity="0.3" strokeDasharray="3 6" className="mc-spin-slower" style={{ transformOrigin: "110px 70px" }} />
      <text x="150" y="40" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">शुभम्</text>
    </svg>
  );
}

const SCENES: Record<SubjectKey, (p: { color: string }) => ReactNode> = {
  math: MathScene,
  science: ScienceScene,
  sst: SstScene,
  english: EnglishScene,
  hindi: HindiScene,
  sanskrit: SanskritScene,
};

function subjectColor(s: Subject) {
  return `var(${s.varName})`;
}

/* ------------------------------------------------------------------ */
/* Constellation layout                                                */
/* ------------------------------------------------------------------ */

function constellationPositions(n: number) {
  const pts: { x: number; y: number }[] = [];
  const cx = 500;
  const cy = 258;
  const maxR = 150 + Math.min(n, 16) * 7;
  for (let i = 0; i < n; i++) {
    const angle = i * 2.39996; // golden angle
    const r = 40 + (i / Math.max(n - 1, 1)) * maxR;
    pts.push({
      x: cx + r * Math.cos(angle) * 1.42,
      y: cy + r * Math.sin(angle) * 0.8,
    });
  }
  return pts;
}

/** Wrap a chapter name into at most two ~16-char lines. */
function wrapLabel(name: string): string[] {
  if (name.length <= 17) return [name];
  const words = name.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= 17) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= 2) return lines;
  // join overflow into second line with ellipsis
  return [lines[0], lines.slice(1).join(" ").slice(0, 16) + "…"];
}

function StatusGlyph({ status, size = 14 }: { status: Chapter["status"]; size?: number }) {
  if (status === "done")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="5.5" fill="var(--mc-accent)" />
      </svg>
    );
  if (status === "progress")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--mc-ink)" strokeOpacity="0.75" />
        <path d="M 7 1.5 A 5.5 5.5 0 0 1 12.5 7 L 7 7 Z" fill="var(--mc-ink)" fillOpacity="0.75" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--mc-faint)" strokeOpacity="0.8" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Main explorer                                                       */
/* ------------------------------------------------------------------ */

export function UniverseExplorer() {
  const [selectedClass, setSelectedClass] = useState<number>(10);
  const [selectedSubject, setSelectedSubject] = useState<SubjectKey | null>(null);
  const [hoveredSubject, setHoveredSubject] = useState<SubjectKey | null>(null);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const setVaultFilter = useUniverse((s) => s.setVaultFilter);

  const cls = CLASSES.find((c) => c.id === selectedClass)!;
  const classSubjects = useMemo(
    () => SUBJECTS.filter((s) => (selectedClass <= 8 ? true : s.key !== "sanskrit")),
    [selectedClass]
  );
  const stageSubject =
    SUBJECTS.find((s) => s.key === (hoveredSubject ?? selectedSubject)) ?? null;

  const chapters = selectedClass === 10 && selectedSubject
    ? CLASS10_CHAPTERS[selectedSubject]
    : null;
  const doneCount = chapters
    ? chapters.filter((c) => c.status === "done").length
    : 0;

  function openInVault(subject: SubjectKey) {
    setVaultFilter(selectedClass, subject);
    document
      .getElementById("vault")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const vaultCount = (subject: SubjectKey) =>
    RESOURCES.filter((r) => r.cls === selectedClass && r.subject === subject).length;

  return (
    <section id="universe" className="mc-section relative overflow-hidden">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 0%, var(--mc-accent-soft), transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="01"
          eyebrow="YOUR LEARNING UNIVERSE"
          title={
            <>
              Choose your <span className="accent-serif">world</span>.
            </>
          }
          lede="Classes are worlds. Subjects are planets. Chapters are constellations. From first discoveries to board-exam confidence — find your next step."
        />

        {/* stats */}
        <Stagger className="mb-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-line)] sm:grid-cols-3">
          {STATS.map((s) => (
            <StaggerItem key={s.label} className="bg-[var(--mc-card)] p-6">
              <div className="font-display text-4xl text-[var(--mc-accent)] md:text-5xl">
                {s.value}
              </div>
              <div className="mt-2 text-sm font-medium">{s.label}</div>
              <div className="font-code mt-0.5 text-[10px] text-dim">{s.note}</div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* STEP 1 — class worlds */}
        <Reveal variant="world">
          <div className="mb-5 flex items-baseline justify-between">
            <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              01 — Class worlds
            </h3>
            <span className="font-code text-[10px] uppercase tracking-[0.2em] text-faint">
              {selectedClass ? `ORBITING CLASS ${selectedClass}` : "SELECT A WORLD"}
            </span>
          </div>

          <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:flex-wrap md:justify-center md:px-0">
            {CLASSES.map((c) => {
              const active = c.id === selectedClass;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedClass(c.id);
                    setSelectedSubject(null);
                    setActiveChapter(null);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "group flex w-[104px] shrink-0 snap-center flex-col items-center gap-3 rounded-2xl p-3 transition-all duration-500 md:w-[118px]",
                    active && "bg-[var(--mc-accent-soft)]"
                  )}
                >
                  <span className="relative flex h-[84px] w-[84px] items-center justify-center">
                    {/* generative rings */}
                    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                      {Array.from({ length: c.rings }).map((_, i) => (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r={16 + i * (30 / Math.max(c.rings, 1))}
                          fill="none"
                          stroke={active ? "var(--mc-accent)" : "var(--mc-faint)"}
                          strokeOpacity={active ? 0.75 : 0.4}
                          strokeWidth="1"
                          strokeDasharray={c.status === "forming" ? "2 5" : undefined}
                        />
                      ))}
                      <circle
                        cx="50"
                        cy="50"
                        r="44"
                        fill="none"
                        stroke={active ? "var(--mc-accent)" : "var(--mc-line)"}
                        strokeWidth={active ? 1.4 : 1}
                      />
                      <circle
                        cx="50"
                        cy="6"
                        r="3"
                        fill={active ? "var(--mc-accent)" : "var(--mc-faint)"}
                        /* no reduced-motion branch: the global CSS media
                           query already disables mc-spin-slow for RM users,
                           and branching here breaks hydration */
                        className={active ? "mc-spin-slow" : ""}
                        style={{ transformOrigin: "50px 50px" }}
                      />
                    </svg>
                    <span
                      className={cn(
                        "font-display text-2xl font-medium transition-colors duration-300",
                        active ? "text-[var(--mc-accent)]" : "text-dim group-hover:text-[var(--mc-ink)]",
                        c.status === "forming" && "text-faint"
                      )}
                    >
                      {c.id}
                    </span>
                  </span>
                  <span className="flex flex-col items-center gap-0.5 text-center">
                    <span className="text-[11px] font-medium tracking-wide">
                      {c.name}
                    </span>
                    <span className="text-[10px] leading-tight text-dim">
                      {c.status === "forming" ? "New world — forming" : c.tagline}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* STEP 2 — subject planets */}
        <AnimatePresence mode="wait">
          {selectedClass && (
            <motion.div
              key={`subs-${selectedClass}`}
              initial={{ opacity: 0, y: 34 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10"
            >
              <div className="mb-5 flex items-baseline justify-between">
                <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                  02 — Subject planets
                </h3>
                <span className="font-code text-[10px] uppercase tracking-[0.2em] text-faint">
                  {cls.status === "forming"
                    ? "WORLD FORMING — RESOURCES ON THE WAY"
                    : "HOVER TO PREVIEW · CLICK TO ENTER"}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
                {/* planets */}
                <div className="flex flex-col gap-2.5">
                  {classSubjects.map((s) => {
                    const active = s.key === selectedSubject;
                    const color = subjectColor(s);
                    return (
                      <button
                        key={s.key}
                        onClick={() => {
                          setSelectedSubject(active ? null : s.key);
                          setActiveChapter(null);
                        }}
                        onMouseEnter={() => setHoveredSubject(s.key)}
                        onMouseLeave={() => setHoveredSubject(null)}
                        onFocus={() => setHoveredSubject(s.key)}
                        onBlur={() => setHoveredSubject(null)}
                        aria-pressed={active}
                        className={cn(
                          "group flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all duration-400",
                          active
                            ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)]"
                            : "border-[var(--mc-line)] hover:border-[color:var(--mc-ink)]"
                        )}
                      >
                        <span
                          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-base"
                          style={{
                            borderColor: color,
                            color: color,
                            background: "color-mix(in srgb, currentColor 8%, transparent)",
                          }}
                        >
                          <span className="mc-ping absolute inset-0 rounded-full border" style={{ borderColor: active ? color : "transparent" }} />
                          {s.glyph}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2 text-sm font-semibold">
                            {s.name}
                            {selectedClass === 10 && (
                              <span className="rounded-full border border-[var(--mc-line)] px-1.5 py-0.5 text-[9px] font-normal uppercase tracking-widest text-faint">
                                {CLASS10_CHAPTERS[s.key]?.length ?? 0} chapters
                              </span>
                            )}
                          </span>
                          <span className="block truncate text-xs text-dim">{s.tagline}</span>
                        </span>
                        <span className="font-display text-[10px] uppercase tracking-[0.2em] text-faint transition-colors group-hover:text-[var(--mc-accent)]">
                          {selectedClass === 10 ? "ENTER" : `${vaultCount(s.key)} ARTIFACTS`}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* stage */}
                <div className="mc-card relative min-h-[220px] overflow-hidden p-5 md:p-6">
                  <AnimatePresence mode="wait">
                    {stageSubject ? (
                      <motion.div
                        key={stageSubject.key}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.45 }}
                        className="flex h-full flex-col"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-display text-lg font-semibold" style={{ color: subjectColor(stageSubject) }}>
                              {stageSubject.name}
                            </div>
                            <div className="text-xs text-dim">{stageSubject.tagline}</div>
                          </div>
                          {selectedSubject === stageSubject.key && selectedClass === 10 && (
                            <span className="flex items-center gap-1.5 rounded-full border border-[var(--mc-accent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--mc-accent)]">
                              <Sparkles size={10} /> In focus
                            </span>
                          )}
                        </div>
                        <div className="relative mt-2 flex-1">
                          {SCENES[stageSubject.key]({ color: subjectColor(stageSubject) })}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full flex-col items-center justify-center gap-4 text-center"
                      >
                        <svg viewBox="0 0 100 100" className="h-20 w-20 opacity-50">
                          <circle cx="50" cy="50" r="6" fill="var(--mc-faint)" />
                          <ellipse cx="50" cy="50" rx="40" ry="16" stroke="var(--mc-faint)" fill="none" transform="rotate(-22 50 50)" />
                          <ellipse cx="50" cy="50" rx="40" ry="16" stroke="var(--mc-faint)" fill="none" transform="rotate(22 50 50)" />
                        </svg>
                        <p className="max-w-[240px] text-xs leading-relaxed text-faint">
                          Hover a subject planet — its world will materialise here.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3A — chapter constellation (class 10) */}
        <AnimatePresence mode="wait">
          {chapters && selectedSubject && (
            <motion.div
              key={`const-${selectedSubject}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="mt-12"
            >
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                  03 — {SUBJECTS.find((s) => s.key === selectedSubject)?.name} universe
                </h3>
                <div className="flex items-center gap-3 text-xs text-faint">
                  <span className="hidden items-center gap-3 sm:flex">
                    <span className="flex items-center gap-1.5"><StatusGlyph status="done" size={10} /> Mastered</span>
                    <span className="flex items-center gap-1.5"><StatusGlyph status="progress" size={10} /> In progress</span>
                    <span className="flex items-center gap-1.5"><StatusGlyph status="todo" size={10} /> Not started</span>
                  </span>
                </div>
              </div>

              {/* progress */}
              <div className="mc-card mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl text-[var(--mc-accent)]">
                    {doneCount}
                  </span>
                  <span className="font-code text-[11px] text-dim">
                    / {chapters.length} constellations charted
                  </span>
                </div>
                <div className="h-1 flex-1 min-w-[120px] overflow-hidden rounded-full bg-[var(--mc-line)]">
                  <motion.div
                    className="h-full rounded-full bg-[var(--mc-accent)]"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${(doneCount / chapters.length) * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
                <span className="font-code text-[10px] text-faint">Hover a node to open its systems</span>
              </div>

              {/* desktop constellation */}
              <ConstellationSvg
                chapters={chapters}
                activeChapter={activeChapter}
                setActiveChapter={setActiveChapter}
              />

              {/* mobile vertical constellation */}
              <div className="relative ml-3 flex flex-col md:hidden">
                {chapters.map((ch, i) => (
                  <button
                    key={ch.name}
                    onClick={() => setActiveChapter(activeChapter === i ? null : i)}
                    className="relative flex items-center gap-4 py-2.5 text-left"
                  >
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                      {i < chapters.length - 1 && (
                        <span className="absolute left-1/2 top-4 h-[calc(100%+4px)] w-px -translate-x-1/2 bg-[var(--mc-line)]" />
                      )}
                      <StatusGlyph status={ch.status} />
                    </span>
                    <span
                      className={cn(
                        "flex-1 border-b border-[var(--mc-line-soft)] pb-2.5 text-sm",
                        activeChapter === i ? "text-[var(--mc-accent)]" : ""
                      )}
                    >
                      {ch.name}
                    </span>
                  </button>
                ))}
                {activeChapter !== null && (
                  <ChapterActions
                    chapter={chapters[activeChapter]}
                    onClose={() => setActiveChapter(null)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3B — vault deep link (classes 6–9) */}
        <AnimatePresence mode="wait">
          {selectedClass && selectedClass !== 10 && selectedSubject && (
            <motion.div
              key={`vaultlink-${selectedClass}-${selectedSubject}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.55 }}
              className="mt-10"
            >
              <div className="mc-card flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
                <div>
                  <div
                    className="font-display text-xl font-semibold"
                    style={{ color: subjectColor(SUBJECTS.find((s) => s.key === selectedSubject)!) }}
                  >
                    {SUBJECTS.find((s) => s.key === selectedSubject)?.name}
                    <span className="ml-2 text-sm font-normal text-dim">
                      · Class {selectedClass}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-md text-sm leading-relaxed text-dim">
                    {SUBJECTS.find((s) => s.key === selectedSubject)?.tagline}. Notes,
                    worksheets and practice artifacts for this world live in the Free
                    Knowledge Vault.
                  </p>
                </div>
                <button
                  onClick={() => openInVault(selectedSubject)}
                  className="btn-mono group flex shrink-0 items-center gap-2 rounded-full border border-[var(--mc-accent)] px-6 py-3 text-[11px] text-[var(--mc-accent)] transition-all duration-300 hover:bg-[var(--mc-cta-bg)] hover:text-[var(--mc-cta-fg)]"
                >
                  OPEN IN THE VAULT
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 11/12 forming note */}
        <AnimatePresence>
          {selectedClass && selectedClass > 10 && (
            <motion.p
              key="forming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-6 text-center text-xs text-faint"
            >
              Classes 11 &amp; 12 are new worlds still forming. Your journey there begins soon.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Desktop constellation SVG                                           */
/* ------------------------------------------------------------------ */

function ConstellationSvg({
  chapters,
  activeChapter,
  setActiveChapter,
}: {
  chapters: Chapter[];
  activeChapter: number | null;
  setActiveChapter: (i: number | null) => void;
}) {
  const pts = useMemo(() => constellationPositions(chapters.length), [chapters.length]);

  return (
    <div className="relative hidden md:block">
      <svg viewBox="0 0 1000 520" className="w-full" role="img" aria-label="Chapter constellation map">
        {/* connecting lines */}
        <polyline
          points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="var(--mc-line)"
          strokeWidth="1"
          strokeDasharray="3 6"
        />
        {/* nodes */}
        {pts.map((p, i) => {
          const ch = chapters[i];
          const active = activeChapter === i;
          const color =
            ch.status === "done"
              ? "var(--mc-accent)"
              : ch.status === "progress"
              ? "var(--mc-ink)"
              : "var(--mc-faint)";
          return (
            <g
              key={ch.name}
              transform={`translate(${p.x} ${p.y})`}
              onClick={() => setActiveChapter(active ? null : i)}
              onMouseEnter={() => setActiveChapter(i)}
              className="cursor-pointer"
              tabIndex={0}
              role="button"
              aria-label={`${ch.name} — ${ch.status}`}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveChapter(active ? null : i);
                }
              }}
              onFocus={() => setActiveChapter(i)}
            >
              {active && (
                <circle r="22" fill="var(--mc-accent-soft)" className="mc-breathe" />
              )}
              {ch.status === "done" && <circle r="8" fill="var(--mc-accent)" />}
              {ch.status === "progress" && (
                <>
                  <circle r="8" fill="none" stroke="var(--mc-ink)" strokeWidth="1.2" />
                  <path d="M 0 -8 A 8 8 0 0 1 8 0 L 0 0 Z" fill="var(--mc-ink)" />
                </>
              )}
              {ch.status === "todo" && (
                <circle r="8" fill="none" stroke="var(--mc-dim)" strokeWidth="1.2" />
              )}
              {wrapLabel(ch.name).map((line, li, arr) => (
                <text
                  key={line + li}
                  y={ch.status === "todo" ? 24 : 22}
                  dy={li === 0 ? 0 : 12}
                  textAnchor="middle"
                  fontSize="11.5"
                  fill={active ? "var(--mc-accent)" : "var(--mc-dim)"}
                  fontFamily="'Space Grotesk', 'Inter', sans-serif"
                  fontWeight={active ? 600 : 400}
                >
                  {line}
                  {li === arr.length - 1 && arr.length === 2 && ch.name.length > 30 ? "" : ""}
                </text>
              ))}
            </g>
          );
        })}
      </svg>

      {/* action card */}
      {activeChapter !== null && (
        <ChapterActions
          chapter={chapters[activeChapter]}
          onClose={() => setActiveChapter(null)}
          floating
        />
      )}
    </div>
  );
}

function ChapterActions({
  chapter,
  onClose,
  floating,
}: {
  chapter: Chapter;
  onClose: () => void;
  floating?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "z-20 rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-card)] p-5 shadow-[0_18px_60px_-18px_rgba(0,0,0,0.6)]",
        floating
          ? "absolute bottom-4 left-1/2 w-[min(92%,560px)] -translate-x-1/2"
          : "my-4"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <StatusGlyph status={chapter.status} />
          <div>
            <div className="font-display text-sm font-semibold">{chapter.name}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-faint">
              Chapter systems
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-faint transition-colors hover:text-[var(--mc-ink)]"
          aria-label="Close chapter actions"
        >
          ✕
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {CHAPTER_ACTIONS.map((a) => (
          <a
            key={a.label}
            href="#vault"
            className="group flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3.5 py-2 text-xs font-medium transition-all duration-300 hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
          >
            {a.label}
            <ArrowUpRight size={11} className="opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
