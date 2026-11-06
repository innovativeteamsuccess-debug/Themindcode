"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Target, Timer, TrendingUp, ListTodo, Sparkles, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { MISSIONS } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";

const MASTERY = [
  { label: "Number systems", v: 92, color: "var(--sub-math)" },
  { label: "Algebra", v: 78, color: "var(--sub-math)" },
  { label: "Geometry", v: 71, color: "var(--sub-science)" },
  { label: "Trigonometry", v: 61, color: "var(--sub-english)" },
];

const TOPICS_TO_REVISE = ["Discriminant cases", "AP nth term", "Heights & distances"];

export function TestLab() {
  const [selected, setSelected] = useState("daily");
  const mission = MISSIONS.find((m) => m.id === selected)!;

  return (
    <section id="testlab" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 40% at 12% 30%, var(--mc-accent-soft), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="04"
          eyebrow="THE MIND CORE TEST LAB"
          title={
            <>
              Tests become <span className="accent-serif">missions</span>.
            </>
          }
          lede="Practice with purpose — warm-ups, chapter runs, full board simulations and the occasional boss level. Progress over pressure, always."
        />

        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          {/* missions */}
          <div>
            <Stagger className="grid gap-3.5 sm:grid-cols-2" gap={0.07}>
              {MISSIONS.map((m) => {
                const active = m.id === selected;
                return (
                  <StaggerItem key={m.id}>
                    <button
                      onClick={() => setSelected(m.id)}
                      aria-pressed={active}
                      className={cn(
                        "group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500",
                        active
                          ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] shadow-[0_0_50px_-18px_var(--mc-glow)]"
                          : "border-[var(--mc-line)] bg-[var(--mc-card)] hover:border-[color:var(--mc-ink)]"
                      )}
                    >
                      {m.id === "boss" && (
                        <span className="font-code absolute right-4 top-4 text-[8.5px] uppercase tracking-[0.18em] text-[var(--mc-accent)]">
                          LOCKED · 80% MASTERY
                        </span>
                      )}
                      <span className="font-code text-[9.5px] uppercase tracking-[0.26em] text-faint">
                        {m.level}
                      </span>
                      <span className="font-display mt-2.5 text-2xl leading-none">
                        {m.name}
                      </span>
                      <span className="mt-1.5 text-[13px] text-dim">{m.desc}</span>
                      <span className="mt-4 flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-1.5 w-5 rounded-full transition-colors",
                              i < m.intensity
                                ? "bg-[var(--mc-accent)]"
                                : "bg-[var(--mc-line)]"
                            )}
                          />
                        ))}
                      </span>
                    </button>
                  </StaggerItem>
                );
              })}
            </Stagger>

            {/* selected mission detail */}
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mc-card mt-4 flex items-start gap-4 p-5"
            >
              <Rocket size={18} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
              <p className="text-sm leading-relaxed text-dim">{mission.detail}</p>
            </motion.div>
          </div>

          {/* debrief */}
          <Reveal variant="rise" delay={0.12}>
            <div className="mc-card flex h-full flex-col p-6 md:p-7">
              <div className="flex items-center justify-between">
                <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                  Mission debrief
                </h3>
                <span className="font-code rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-faint">
                  Last daily mission
                </span>
              </div>

              <div className="mt-6 flex items-center gap-6">
                {/* accuracy ring */}
                <div className="relative h-28 w-28 shrink-0">
                  <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--mc-line)" strokeWidth="7" />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="var(--mc-accent)"
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      whileInView={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - 0.86) }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display text-3xl">86%</span>
                    <span className="font-code text-[8.5px] uppercase tracking-[0.2em] text-faint">
                      ACCURACY
                    </span>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-2 gap-4">
                  <Stat icon={Timer} label="Time" value="7:42" note="target 10:00" />
                  <Stat icon={Target} label="Solved" value="4/5" note="1 silly mistake" />
                  <Stat icon={TrendingUp} label="Streak" value="12 days" note="personal best" />
                  <Stat icon={Sparkles} label="XP" value="+240" note="concept energy" />
                </div>
              </div>

              {/* mastery bars */}
              <div className="mt-7">
                <div className="mb-3 font-code text-[9.5px] uppercase tracking-[0.26em] text-faint">
                  Concept mastery
                </div>
                <div className="flex flex-col gap-3">
                  {MASTERY.map((m, i) => (
                    <div key={m.label}>
                      <div className="mb-1 flex justify-between text-[11px]">
                        <span className="text-dim">{m.label}</span>
                        <span className="text-faint">{m.v}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-[var(--mc-line)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: m.color }}
                          initial={{ width: 0 }}
                          whileInView={{ width: `${m.v}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.15 * i, ease: [0.22, 1, 0.36, 1] }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* revise + next */}
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="font-code flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.2em] text-faint">
                  <ListTodo size={11} /> Revise:
                </span>
                {TOPICS_TO_REVISE.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[var(--mc-line)] px-3 py-1 text-[11px] text-dim"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-6">
                <div className="rounded-xl border border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] p-4">
                  <div className="font-code text-[9.5px] uppercase tracking-[0.26em] text-[var(--mc-accent)]">
                    Recommended next action
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed">
                    Revisit discriminant cases in Quadratic Equations — a focused{" "}
                    <strong>12-minute</strong> run should push algebra mastery past 80%.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 font-code text-[9.5px] uppercase tracking-[0.18em] text-faint">
        <Icon size={11} /> {label}
      </div>
      <div className="font-display mt-1 text-xl">{value}</div>
      <div className="text-[10px] text-faint">{note}</div>
    </div>
  );
}
