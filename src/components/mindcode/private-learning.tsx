"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Monitor,
  MapPin,
  Users,
  Layers,
  ArrowRight,
  Check,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUBJECTS, type SubjectKey } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";
import { useToast } from "@/hooks/use-toast";

const MODES = [
  { key: "HOME", icon: Home, label: "Home", desc: "Personalised teaching at your home." },
  { key: "ONLINE", icon: Monitor, label: "Online", desc: "Learn from anywhere." },
  { key: "OFFLINE", icon: MapPin, label: "Offline", desc: "Face-to-face learning." },
  { key: "SMALL GROUP", icon: Users, label: "Small Group", desc: "Focused collaborative learning." },
  { key: "HYBRID", icon: Layers, label: "Hybrid", desc: "The best of both worlds." },
] as const;

const SCHEDULES = [
  "Weekday evenings",
  "Weekends",
  "Early mornings",
  "Flexible — you decide",
];

export function PrivateLearning() {
  const [mode, setMode] = useState<(typeof MODES)[number]["key"]>("HOME");
  const [cls, setCls] = useState("10");
  const [subjects, setSubjects] = useState<SubjectKey[]>(["math"]);
  const [location, setLocation] = useState("");
  const [schedule, setSchedule] = useState(SCHEDULES[0]);
  const [goal, setGoal] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const { toast } = useToast();

  function toggleSubject(key: SubjectKey) {
    setSubjects((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    if (!location.trim() || !goal.trim() || subjects.length === 0) {
      toast({
        title: "A few details are missing",
        description: "Add your location, at least one subject and your learning goal.",
      });
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/tuition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentClass: Number(cls),
          subject: subjects.map((s) => SUBJECTS.find((x) => x.key === s)?.name).join(", "),
          location: location.trim(),
          mode,
          schedule,
          goal: goal.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Request failed");
      setReference(data.id ?? null);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("idle");
      toast({
        title: "Couldn't send your request",
        description: "The universe hiccuped. Please try again in a moment.",
      });
    }
  }

  return (
    <section id="tuition" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 45% at 85% 20%, var(--mc-accent-soft), transparent 60%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="03"
          eyebrow="THE MIND CODE PRIVATE LEARNING"
          title={
            <>
              Expert learning.{" "}
              <span className="accent-serif">At your home.</span>
            </>
          }
          lede="Tell us how you learn — class, subjects, place, pace and goal. We match you with a guide who fits, not just a tutor who teaches."
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          {/* modes */}
          <div>
            <Reveal variant="rise">
              <h3 className="font-code mb-5 text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
                Choose your mode
              </h3>
            </Reveal>
            <div className="flex flex-col gap-3">
              {MODES.map((m, i) => {
                const active = m.key === mode;
                return (
                  <Reveal key={m.key} variant="rise" delay={i * 0.05}>
                    <button
                      onClick={() => setMode(m.key)}
                      aria-pressed={active}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-400",
                        active
                          ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)]"
                          : "border-[var(--mc-line)] bg-[var(--mc-card)] hover:border-[color:var(--mc-ink)]"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-all duration-400",
                          active
                            ? "border-[var(--mc-accent)] text-[var(--mc-accent)]"
                            : "border-[color:var(--mc-dim)] text-[var(--mc-ink)]"
                        )}
                      >
                        <m.icon size={18} />
                      </span>
                      <span className="flex-1">
                        <span className="btn-mono block text-[11px] text-[var(--mc-ink)]">
                          {m.label.toUpperCase()}
                        </span>
                        <span className="block text-xs text-dim">{m.desc}</span>
                      </span>
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full transition-all duration-400",
                          active ? "bg-[var(--mc-accent)] shadow-[0_0_12px_var(--mc-glow)]" : "bg-transparent border border-[var(--mc-line)]"
                        )}
                      />
                    </button>
                  </Reveal>
                );
              })}
            </div>

            <Reveal variant="rise" delay={0.2} className="mt-6">
              <p className="flex items-start gap-2.5 rounded-xl border border-dashed border-[var(--mc-line)] p-4 text-xs leading-relaxed text-dim">
                <Compass size={14} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
                Every guide is vetted for concept clarity first — because a teacher who
                truly understands can make any student understand.
              </p>
            </Reveal>
          </div>

          {/* form / success */}
          <Reveal variant="rise" delay={0.1}>
            <div className="mc-card relative overflow-hidden p-6 md:p-8">
              <AnimatePresence mode="wait">
                {status === "done" ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex min-h-[420px] flex-col items-center justify-center text-center"
                  >
                    <span className="mc-breathe relative flex h-16 w-16 items-center justify-center rounded-full border border-[var(--mc-accent)]">
                      <Check size={26} className="text-[var(--mc-accent)]" />
                      <span className="mc-ping absolute inset-0 rounded-full border border-[var(--mc-accent)]" />
                    </span>
                    <h3 className="font-display mt-6 text-3xl leading-tight">
                      Guide matching initiated.
                    </h3>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-dim">
                      Your learning profile is saved. A learning guide for{" "}
                      <strong className="text-[var(--mc-ink)]">
                        Class {cls} · {subjects.map((s) => SUBJECTS.find((x) => x.key === s)?.name).join(", ")}
                      </strong>{" "}
                      in <strong className="text-[var(--mc-ink)]">{mode}</strong> mode
                      will reach out soon.
                    </p>
                    {reference && (
                      <p className="font-code mt-4 text-[10px] tracking-[0.2em] text-faint">
                        REF · {reference.slice(0, 8).toUpperCase()}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setStatus("idle");
                        setGoal("");
                        setLocation("");
                      }}
                      className="btn-mono mt-8 rounded-full border border-[var(--mc-line)] px-6 py-2.5 text-[10px] transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                    >
                      SUBMIT ANOTHER REQUEST
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    onSubmit={submit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -14 }}
                    className="flex flex-col gap-5"
                  >
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Class">
                        <select
                          value={cls}
                          onChange={(e) => setCls(e.target.value)}
                          className="mc-input"
                        >
                          {[6, 7, 8, 9, 10, 11, 12].map((c) => (
                            <option key={c} value={c}>
                              Class {c}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Preferred schedule">
                        <select
                          value={schedule}
                          onChange={(e) => setSchedule(e.target.value)}
                          className="mc-input"
                        >
                          {SCHEDULES.map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Subjects">
                      <div className="flex flex-wrap gap-2">
                        {SUBJECTS.filter((s) => s.key !== "sanskrit").map((s) => {
                          const active = subjects.includes(s.key);
                          return (
                            <button
                              type="button"
                              key={s.key}
                              onClick={() => toggleSubject(s.key)}
                              aria-pressed={active}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-medium transition-all duration-300",
                                active
                                  ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] text-[var(--mc-accent)]"
                                  : "border-[var(--mc-line)] text-dim hover:text-[var(--mc-ink)]"
                              )}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: `var(${s.varName})` }}
                              />
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </Field>

                    <Field label="Location">
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Indirapuram, Ghaziabad"
                        className="mc-input"
                      />
                    </Field>

                    <Field label="Your learning goal">
                      <textarea
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={3}
                        placeholder="e.g. I want to stop fearing Maths before pre-boards and score 85+ in Science."
                        className="mc-input resize-none"
                      />
                    </Field>

                    <button
                      type="submit"
                      disabled={status === "sending"}
                      className="group relative flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-[var(--mc-cta-bg)] py-4 text-sm font-semibold tracking-wide text-[var(--mc-cta-fg)] shadow-[0_0_40px_-10px_var(--mc-glow)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-60"
                    >
                      {status === "sending" ? (
                        <>
                          <span className="mc-spin-slow h-4 w-4 rounded-full border-2 border-[var(--mc-cta-fg)]/30 border-t-[var(--mc-cta-fg)]" style={{ animationDuration: "0.8s" }} />
                          MATCHING…
                        </>
                      ) : (
                        <>
                          FIND MY TEACHER
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[11px] text-faint">
                      No spam. No obligation. Just a careful match.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-faint">
        {label}
      </span>
      {children}
    </label>
  );
}
