"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flame,
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  MessageSquareHeart,
  AlertCircle,
  GraduationCap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_URL } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

const TODAY = [
  { subject: "Mathematics", task: "Quadratic Equations — discriminant drill", mins: 20, color: "var(--sub-math)" },
  { subject: "Science", task: "Chemical Reactions — quick mission", mins: 10, color: "var(--sub-science)" },
  { subject: "Revision", task: "AP formula sheet — recall run", mins: 15, color: "var(--sub-sst)" },
  { subject: "Practice", task: "5 PYQs — Real Numbers", mins: 25, color: "var(--sub-english)" },
];

const KNOWLEDGE_AXES = [
  { label: "Numbers", v: 0.92 },
  { label: "Algebra", v: 0.78 },
  { label: "Geometry", v: 0.71 },
  { label: "Trigonometry", v: 0.61 },
  { label: "Statistics", v: 0.66 },
  { label: "Probability", v: 0.54 },
];

export function CommandCentre({ view = "both" }: { view?: "both" | "student" | "parent" }) {
  const [tab, setTab] = useState<"student" | "parent">(view === "parent" ? "parent" : "student");
  const single = view !== "both";

  return (
    <section id="command" className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index={single ? undefined : "06"}
          eyebrow={view === "parent" ? "THE PARENT ZONE" : "THE COMMAND CENTRE"}
          title={
            view === "parent" ? (
              <>
                See the progress.{" "}
                <span className="accent-serif">Understand the journey.</span>
              </>
            ) : (
              <>
                Your progress,{" "}
                <span className="accent-serif">mission control</span>.
              </>
            )
          }
          lede={
            view === "parent"
              ? "A calm, readable view of how your child is really doing — attendance, performance, feedback and what comes next. No vanity statistics, ever."
              : "A glimpse inside the Mind Core app — one dashboard for students, one calm view for parents. Meaningful progress, never vanity statistics."
          }
        />

        {/* tabs — only on the combined preview */}
        {!single && (
          <Reveal variant="rise">
            <div className="mb-8 inline-flex rounded-full border border-[var(--mc-line)] p-1">
            {(
              [
                { key: "student", label: "Student · Your Mind Core" },
                { key: "parent", label: "Parent View" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-pressed={tab === t.key}
                className={cn(
                  "rounded-full px-5 py-2.5 text-[13px] font-medium transition-all duration-400",
                  tab === t.key
                    ? "bg-[var(--mc-accent-deep)] text-white"
                    : "text-dim hover:text-[var(--mc-ink)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Reveal>
        )}

        <AnimatePresence mode="wait">
          {tab === "student" ? (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="grid gap-5 lg:grid-cols-3"
            >
              {/* TODAY */}
              <div className="mc-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                    Today
                  </h3>
                  <span className="font-code text-[9px] uppercase tracking-[0.18em] text-faint">TUE · 4 MISSIONS</span>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  {TODAY.map((t, i) => (
                    <motion.div
                      key={t.task}
                      initial={{ opacity: 0, x: -14 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08 * i, duration: 0.5 }}
                      className="group flex items-start gap-3"
                    >
                      <span
                        className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                        style={{ background: t.color, boxShadow: `0 0 10px ${t.color}` }}
                      />
                      <div className="flex-1">
                        <div className="text-[13px] font-medium leading-snug">{t.subject}</div>
                        <div className="text-[12px] leading-snug text-dim">{t.task}</div>
                      </div>
                      <span className="font-display shrink-0 text-[11px] text-faint">
                        {t.mins}m
                      </span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-6 border-t border-[var(--mc-line-soft)] pt-4">
                  <div className="flex items-center gap-2 text-[11px] text-dim">
                    <Flame size={13} className="text-[var(--mc-accent)]" />
                    12-day streak — your longest yet. Keep it gentle, keep it going.
                  </div>
                </div>
              </div>

              {/* KNOWLEDGE MAP */}
              <div className="mc-card p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                    Knowledge map
                  </h3>
                  <span className="font-code text-[9px] uppercase tracking-[0.18em] text-faint">CONCEPT MASTERY</span>
                </div>
                <div className="mt-4 flex justify-center">
                  <KnowledgeRadar />
                </div>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-faint">
                  Each axis is a concept family. The map grows as you do.
                </p>
              </div>

              {/* PROGRESS + NEXT MOVE */}
              <div className="flex flex-col gap-5">
                <div className="mc-card p-6">
                  <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                    Progress
                  </h3>
                  <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                    <div>
                      <div className="font-display text-2xl text-[var(--mc-accent)]">68</div>
                      <div className="font-code text-[8.5px] leading-tight text-faint">CONCEPTS MASTERED</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl">9/14</div>
                      <div className="font-code text-[8.5px] leading-tight text-faint">CHAPTERS CHARTED</div>
                    </div>
                    <div>
                      <div className="font-display text-2xl">86%</div>
                      <div className="font-code text-[8.5px] leading-tight text-faint">MISSION ACCURACY</div>
                    </div>
                  </div>
                </div>

                <div className="relative flex-1 overflow-hidden rounded-2xl border border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] p-6">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-40"
                    style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
                  />
                  <div className="font-code text-[9.5px] uppercase tracking-[0.26em] text-[var(--mc-accent)]">
                    Next move — AI recommended
                  </div>
                  <p className="mt-2.5 text-[15px] font-medium leading-relaxed">
                    Revise Arithmetic Progressions for{" "}
                    <span className="text-[var(--mc-accent)]">18 minutes</span>.
                  </p>
                  <p className="mt-1.5 text-[12px] text-dim">
                    Your recall dips after 3 days — today is the sweet spot.
                  </p>
                  <a
                    href={APP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-mono group mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-5 py-2.5 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.04]"
                  >
                    CONTINUE LEARNING
                    <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="parent"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5 }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              <ParentCard
                icon={TrendingIcon}
                title="Progress"
                main="On track"
                note="86% this month · 4 chapters ahead of schedule"
                tone="good"
              />
              <ParentCard
                icon={CalendarDays}
                title="Attendance"
                main="96%"
                note="Next class: Tue 6:00 PM · Mathematics · 60 min"
              />
              <ParentCard
                icon={ClipboardCheck}
                title="Upcoming tests"
                main="Unit test — Friday"
                note="Light: Reflection & Refraction · 20 marks"
              />
              <ParentCard
                icon={MessageSquareHeart}
                title="Teacher feedback"
                quote="Algebra confidence is rising beautifully. She now attempts proofs on her own."
                tone="good"
                wide
              />
              <ParentCard
                icon={AlertCircle}
                title="Needs gentle attention"
                main="Trigonometry basics"
                note="10 minutes of recall practice on alternate days is enough — no pressure."
                tone="warn"
              />
              <ParentCard
                icon={GraduationCap}
                title="This term's goal"
                main="Concept clarity first"
                note="Marks follow understanding — and understanding is compounding."
                wide
              />
            </motion.div>
          )}
        </AnimatePresence>

        <Reveal variant="rise" delay={0.1}>
          <p className="mt-8 text-center text-[11px] text-faint">
            Preview of The Mind Code app experience —{" "}
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="link-sweep text-[var(--mc-accent)]"
            >
              available on Google Play
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

const TrendingIcon = ({ size, className }: { size?: number; className?: string }) => (
  <svg width={size ?? 16} height={size ?? 16} viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M3 17 L9 11 L13 15 L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 7 H21 V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function KnowledgeRadar() {
  const cx = 105;
  const cy = 105;
  const R = 78;
  const n = KNOWLEDGE_AXES.length;
  const pt = (i: number, r: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = KNOWLEDGE_AXES.map((ax, i) => pt(i, R * ax.v).join(",")).join(" ");

  return (
    <svg viewBox="0 0 210 210" className="h-52 w-52" role="img" aria-label="Knowledge map radar">
      {[0.33, 0.66, 1].map((f) => (
        <polygon
          key={f}
          points={KNOWLEDGE_AXES.map((_, i) => pt(i, R * f).join(",")).join(" ")}
          fill="none"
          stroke="var(--mc-line)"
        />
      ))}
      {KNOWLEDGE_AXES.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--mc-line)" />;
      })}
      <motion.polygon
        points={poly}
        fill="var(--mc-accent-soft)"
        stroke="var(--mc-accent)"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.6 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: "105px 105px" }}
      />
      {KNOWLEDGE_AXES.map((ax, i) => {
        const [x, y] = pt(i, R * ax.v);
        return <circle key={ax.label} cx={x} cy={y} r="3" fill="var(--mc-accent)" />;
      })}
      {KNOWLEDGE_AXES.map((ax, i) => {
        const [x, y] = pt(i, R + 15);
        return (
          <text
            key={ax.label}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="9.5"
            fill="var(--mc-dim)"
            fontFamily="'Space Grotesk', 'Inter', sans-serif"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

function ParentCard({
  icon: Icon,
  title,
  main,
  note,
  quote,
  tone,
  wide,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  main?: string;
  note?: string;
  quote?: string;
  tone?: "good" | "warn";
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "mc-card flex flex-col p-6",
        wide && "md:col-span-1"
      )}
    >
      <div className="flex items-center gap-2.5 font-code text-[9.5px] uppercase tracking-[0.24em] text-faint">
        <Icon size={13} className={cn(tone === "warn" ? "text-[var(--sub-sst)]" : tone === "good" ? "text-[var(--mc-accent)]" : "")} />
        {title}
      </div>
      {main && (
        <div
          className={cn(
            "font-display mt-3 text-2xl",
            tone === "warn" ? "text-[var(--sub-sst)]" : ""
          )}
        >
          {main}
        </div>
      )}
      {quote && (
        <p className="editorial-quote mt-3 text-[16px]">“{quote}”</p>
      )}
      {note && <p className="mt-1.5 text-[12px] leading-relaxed text-dim">{note}</p>}
    </div>
  );
}
