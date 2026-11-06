"use client";

/* ============================================================
   /tests — THE TEST LAB. Practice. Discover. Improve.
   Its own playful identity: flasks, missions, zero pressure.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, FlaskConical, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { MISSION_CATEGORIES, TESTS, SUBJECTS } from "./data";
import { WorldBody, WorldHeader } from "./world-shell";

const MISSION_HUE: Record<string, string> = {
  daily: "--sub-science",
  chapter: "--sub-math",
  full: "--sub-sst",
  pyq: "--sub-english",
  sample: "--sub-hindi",
};

export function TestLabPage() {
  return (
    <main className="flex-1">
      <WorldHeader
        glyph="🧪"
        world="THE TEST LAB"
        title="Practice. Discover."
        titleAccent="Improve."
        sub="Quizzes, chapter missions, board simulations and PYQ runs — playful on the surface, serious underneath. No leaderboards, no pressure. Just honest signal."
      >
        <div className="mt-8 flex flex-wrap gap-2">
          {MISSION_CATEGORIES.map((m) => (
            <a
              key={m.id}
              href={`#mission-${m.id}`}
              className="btn-mono rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9.5px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              {m.glyph} {m.name.toUpperCase()}
            </a>
          ))}
        </div>
      </WorldHeader>

      <WorldBody className="pb-24">
        {MISSION_CATEGORIES.map((m, mi) => {
          const tests = TESTS.filter((t) => t.mission === m.id);
          const hue = `var(${MISSION_HUE[m.id]})`;
          return (
            <section key={m.id} id={`mission-${m.id}`} className="mb-12 scroll-mt-28">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.04 * mi }}
                className="mb-5 flex flex-wrap items-center gap-4"
              >
                <span
                  className="font-display flex h-11 w-11 items-center justify-center rounded-2xl border text-lg"
                  style={{ borderColor: hue, color: hue }}
                  aria-hidden
                >
                  {m.glyph}
                </span>
                <div className="flex-1">
                  <h2 className="font-display text-xl md:text-2xl">{m.name}</h2>
                  <p className="text-[12.5px] text-dim">{m.desc}</p>
                </div>
                <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">
                  {tests.length} MISSION{tests.length === 1 ? "" : "S"} LIVE
                </span>
              </motion.div>

              {tests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {tests.map((t, i) => {
                    const subject = SUBJECTS.find((s) => s.key === t.subject)!;
                    return (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.45, delay: 0.05 * (i % 3) }}
                      >
                        <Link
                          href={`/tests/${t.id}`}
                          data-cursor="interactive"
                          className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] hover:shadow-[0_24px_60px_-24px_var(--mc-glow)]"
                        >
                          <div
                            className="h-2 w-full"
                            style={{ background: `var(${MISSION_HUE[m.id]})`, opacity: 0.75 }}
                            aria-hidden
                          />
                          <div className="flex flex-1 flex-col p-6">
                            <span className="font-code text-[9px] uppercase tracking-[0.24em] text-faint">
                              CLASS {t.cls} · {subject.name.toUpperCase()}
                            </span>
                            <h3 className="font-display mt-2.5 text-xl leading-snug">{t.title}</h3>
                            <p className="mt-1.5 flex-1 text-[12.5px] text-dim">
                              {t.chapter} · practice set with instant explanations.
                            </p>
                            <div className="mt-5 flex items-center justify-between">
                              <span className="font-code inline-flex items-center gap-3 text-[9px] uppercase tracking-[0.16em] text-faint">
                                <span className="inline-flex items-center gap-1.5">
                                  <FlaskConical size={10} /> {t.questions.length}Q
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                  <Timer size={10} /> {t.minutes}m
                                </span>
                              </span>
                              <span className="btn-mono inline-flex items-center gap-1.5 text-[9px] text-[var(--mc-accent)]">
                                START
                                <ArrowUpRight size={10} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="mc-card px-6 py-8 text-center">
                  <p className="text-[13.5px] leading-relaxed text-dim">
                    The {m.name.toLowerCase()} shelf is being stocked. Daily quizzes and chapter
                    missions are live today.
                  </p>
                </div>
              )}
            </section>
          );
        })}

        {/* the promise */}
        <div className="mc-card relative overflow-hidden p-6 text-center md:p-8">
          <span
            className="pointer-events-none absolute -top-16 left-1/2 h-40 w-[30rem] -translate-x-1/2 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
            aria-hidden
          />
          <p className="font-display mx-auto max-w-xl text-xl leading-snug md:text-2xl">
            Tests here measure <span className="accent-serif text-[var(--mc-accent)]">growth</span>,
            not worth. Wrong answers are just the next chapter of the plan.
          </p>
        </div>
      </WorldBody>
    </main>
  );
}

/* hue guard */
void cn;
