"use client";

/* ============================================================
   /tests/[id] — the test runner.
   Minimal distraction: question, options, progress, submit.
   Then a calm, honest debrief.
   ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESOURCES, SUBJECTS, testById, type TestQuestion } from "./data";
import { WorldBody } from "./world-shell";

export function TestRunner({ id }: { id: string }) {
  const test = testById(id);
  const [step, setStep] = useState(-1); // -1 = briefing
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    if (!test) return null;
    const total = test.questions.length;
    let correct = 0;
    const wrongConcepts: string[] = [];
    test.questions.forEach((q, i) => {
      if (answers[i] === q.a) correct += 1;
      else if (answers[i] !== undefined) wrongConcepts.push(q.concept);
    });
    const accuracy = Math.round((correct / total) * 100);
    return { total, correct, accuracy, wrongConcepts: [...new Set(wrongConcepts)] };
  }, [test, answers]);

  if (!test) {
    return (
      <main className="flex-1">
        <WorldBody className="pb-24 pt-40">
          <div className="mc-card p-10 text-center">
            <p className="font-display text-2xl">This mission does not exist — yet.</p>
            <p className="mt-3 text-sm text-dim">The lab is quiet. Pick a test and make some noise.</p>
            <Link
              href="/tests"
              className="btn-mono mt-6 inline-flex rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
            >
              BACK TO THE LAB
            </Link>
          </div>
        </WorldBody>
      </main>
    );
  }

  const subject = SUBJECTS.find((s) => s.key === test.subject)!;
  const color = `var(${subject.varName})`;
  const q: TestQuestion | undefined = test.questions[step];

  const pick = (i: number) => {
    if (submitted) return;
    setAnswers((a) => ({ ...a, [step]: i }));
  };

  /* ---------------- briefing ---------------- */
  if (step === -1) {
    return (
      <main className="flex-1">
        <WorldBody className="pb-24 pt-28 md:pt-36">
          <Link href="/tests" className="btn-mono inline-flex items-center gap-2 text-[10px] text-dim hover:text-[var(--mc-accent)]">
            <ArrowLeft size={12} /> THE TEST LAB
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mc-card mx-auto mt-8 max-w-2xl p-8 text-center md:p-12"
          >
            <p className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
              CLASS {test.cls} · {subject.name.toUpperCase()} · {test.chapter.toUpperCase()}
            </p>
            <h1 className="font-display mt-4 text-[clamp(1.7rem,4.4vw,2.8rem)] font-semibold leading-tight">
              {test.title}
            </h1>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-dim">
              <span>{test.questions.length} questions</span>
              <span className="h-1 w-1 rounded-full bg-[var(--mc-line)]" />
              <span>~{test.minutes} minutes</span>
              <span className="h-1 w-1 rounded-full bg-[var(--mc-line)]" />
              <span>practice set</span>
            </div>
            <p className="mx-auto mt-6 max-w-md text-[13.5px] leading-relaxed text-dim">
              No leaderboard, no countdown pressure. Answer at your pace — every question gets a
              one-line explanation, and wrong turns are just information.
            </p>
            <button
              onClick={() => setStep(0)}
              className="btn-mono mt-8 rounded-full bg-[var(--mc-cta-bg)] px-8 py-4 text-[11px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-10px_var(--mc-glow)] transition-transform hover:scale-[1.03]"
            >
              BEGIN THE MISSION
            </button>
          </motion.div>
        </WorldBody>
      </main>
    );
  }

  /* ---------------- results ---------------- */
  if (submitted && result) {
    const recommended = RESOURCES.filter((r) => r.cls === test.cls && r.subject === test.subject).slice(0, 3);
    return (
      <main className="flex-1">
        <WorldBody className="pb-24 pt-28 md:pt-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="eyebrow">MISSION DEBRIEF</p>
            <h1 className="font-display mt-4 text-[clamp(2.2rem,6vw,3.6rem)] font-semibold leading-tight">
              Test <span className="accent-serif text-[var(--mc-accent)]">complete.</span>
            </h1>
            <p className="mt-3 text-[14px] text-dim">
              {result.correct === result.total
                ? "A clean sweep. Every question cracked."
                : `${result.correct} of ${result.total} — every mistake is a map.`}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mc-card mx-auto mt-10 max-w-2xl p-6 md:p-8"
          >
            {/* accuracy ring */}
            <div className="flex items-center gap-7">
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
                    animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - result.accuracy / 100) }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl">{result.accuracy}%</span>
                  <span className="font-code text-[8px] uppercase tracking-[0.18em] text-faint">ACCURACY</span>
                </div>
              </div>
              <div className="grid flex-1 grid-cols-2 gap-4">
                <div>
                  <div className="font-display text-2xl text-[var(--mc-accent)]">{result.correct}</div>
                  <div className="font-code text-[8.5px] uppercase tracking-[0.18em] text-faint">CRACKED</div>
                </div>
                <div>
                  <div className="font-display text-2xl">{result.total - result.correct}</div>
                  <div className="font-code text-[8.5px] uppercase tracking-[0.18em] text-faint">TO REVISIT</div>
                </div>
              </div>
            </div>

            {/* concept mastery */}
            <div className="mt-7">
              <h2 className="font-code text-[9.5px] uppercase tracking-[0.26em] text-faint">
                Concept mastery
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set(test.questions.map((q) => q.concept))].map((c) => {
                  const missed = result.wrongConcepts.includes(c);
                  return (
                    <span
                      key={c}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px]",
                        missed
                          ? "border-[color-mix(in_srgb,var(--sub-sst)_55%,transparent)] text-[var(--sub-sst)]"
                          : "border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)] text-[var(--mc-accent)]"
                      )}
                    >
                      {missed ? <XCircle size={11} /> : <CheckCircle2 size={11} />}
                      {c}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* recommended next */}
            <div className="mt-7 rounded-2xl border border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] p-5">
              <div className="font-code text-[9px] uppercase tracking-[0.24em] text-[var(--mc-accent)]">
                Next suggested action
              </div>
              <p className="mt-2 text-[13.5px] leading-relaxed">
                {result.wrongConcepts.length > 0 ? (
                  <>
                    Revisit <strong>{result.wrongConcepts[0]}</strong> — then try a 10-minute resource
                    from the vault and re-run this mission.
                  </>
                ) : (
                  <>
                    Perfect run. Level up: try a <strong>full test</strong> or a{" "}
                    <strong>PYQ set</strong> to keep the edge.
                  </>
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href="/tests"
                  className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-5 py-2.5 text-[9.5px] text-[var(--mc-cta-fg)]"
                >
                  NEXT MISSION
                </Link>
                {recommended[0] && (
                  <Link
                    href={`/resources/${recommended[0].id}`}
                    className="btn-mono rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[9.5px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                  >
                    RECOMMENDED RESOURCE
                  </Link>
                )}
              </div>
            </div>
          </motion.div>

          {/* question review */}
          <div className="mx-auto mt-8 max-w-2xl">
            <h2 className="font-code mb-4 text-[10px] uppercase tracking-[0.26em] text-faint">
              EVERY QUESTION, HONESTLY
            </h2>
            <div className="flex flex-col gap-3">
              {test.questions.map((q, i) => {
                const chosen = answers[i];
                const ok = chosen === q.a;
                return (
                  <div key={i} className={cn("mc-card p-5", !ok && "border-[color-mix(in_srgb,var(--sub-sst)_40%,transparent)]")}>
                    <div className="flex items-start gap-3">
                      {ok ? (
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
                      ) : (
                        <XCircle size={16} className="mt-0.5 shrink-0 text-[var(--sub-sst)]" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-medium leading-snug">{q.q}</p>
                        <p className="mt-1.5 text-[12px] text-dim">
                          <span className="text-[var(--mc-accent)]">{q.options[q.a]}</span>
                          {!ok && chosen !== undefined && (
                            <span className="text-[var(--sub-sst)]"> · you chose {q.options[chosen]}</span>
                          )}
                        </p>
                        <p className="mt-1.5 text-[12px] italic leading-relaxed text-faint">{q.why}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </WorldBody>
      </main>
    );
  }

  /* ---------------- running ---------------- */
  const answeredCount = Object.keys(answers).length;
  const last = step === test.questions.length - 1;

  return (
    <main className="flex-1">
      {/* minimal runner chrome */}
      <div className="fixed inset-x-0 top-0 z-[97] border-b border-[var(--mc-line)] bg-[color-mix(in_srgb,var(--mc-bg)_92%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
          <Link
            href="/tests"
            className="font-code text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:text-[var(--mc-accent)]"
          >
            ← EXIT
          </Link>
          <span className="font-code text-[10px] uppercase tracking-[0.2em] text-dim">
            Question {step + 1} / {test.questions.length}
          </span>
          <span className="font-code hidden text-[10px] uppercase tracking-[0.2em] text-faint sm:block">
            {answeredCount} answered
          </span>
        </div>
        <div className="h-[3px] w-full bg-[var(--mc-line-soft)]">
          <motion.div
            className="h-full"
            style={{ background: color }}
            animate={{ width: `${((step + 1) / test.questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      <WorldBody className="pb-24 pt-28 md:pt-36">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              {q && (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="font-code rounded-full border px-2.5 py-1 text-[8.5px] uppercase tracking-[0.18em]"
                      style={{ borderColor: color, color }}
                    >
                      {q.concept}
                    </span>
                  </div>
                  <h1 className="font-display mt-5 text-[clamp(1.35rem,3.4vw,1.9rem)] font-medium leading-snug">
                    {q.q}
                  </h1>

                  <div className="mt-7 flex flex-col gap-2.5" role="radiogroup" aria-label="Answer options">
                    {q.options.map((opt, i) => {
                      const chosen = answers[step] === i;
                      return (
                        <button
                          key={i}
                          role="radio"
                          aria-checked={chosen}
                          onClick={() => pick(i)}
                          className={cn(
                            "group flex items-center gap-4 rounded-2xl border px-5 py-4 text-left transition-all duration-300",
                            chosen
                              ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)]"
                              : "border-[var(--mc-line)] bg-[var(--mc-card)] hover:border-[var(--mc-ink)]"
                          )}
                        >
                          <span
                            className={cn(
                              "font-code flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
                              chosen
                                ? "border-[var(--mc-accent)] bg-[var(--mc-accent)] text-white"
                                : "border-[var(--mc-line)] text-faint group-hover:text-[var(--mc-ink)]"
                            )}
                          >
                            {String.fromCharCode(65 + i)}
                          </span>
                          <span className="text-[14.5px] leading-snug">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* nav */}
          <div className="mt-9 flex items-center justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-5 py-3 text-[10px] text-dim transition-all enabled:hover:border-[var(--mc-accent)] enabled:hover:text-[var(--mc-accent)] disabled:opacity-35"
            >
              <ArrowLeft size={12} /> PREVIOUS
            </button>

            {last ? (
              <button
                onClick={() => setSubmitted(true)}
                disabled={answeredCount < test.questions.length}
                className="btn-mono inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-7 py-3.5 text-[10.5px] text-[var(--mc-cta-fg)] shadow-[0_0_36px_-8px_var(--mc-glow)] transition-all enabled:hover:scale-[1.03] disabled:opacity-40"
              >
                <Target size={13} />
                {answeredCount < test.questions.length
                  ? `${test.questions.length - answeredCount} LEFT`
                  : "SUBMIT MISSION"}
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(test.questions.length - 1, s + 1))}
                className="btn-mono group inline-flex items-center gap-2 rounded-full border border-[var(--mc-ghost)] px-6 py-3.5 text-[10.5px] text-[var(--mc-ink)] transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
              >
                NEXT
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>

          {last && answeredCount < test.questions.length && (
            <p className="mt-4 text-center text-[11.5px] text-faint">
              Answer everything to submit — skipping is allowed, just not for the record.
            </p>
          )}
        </div>
      </WorldBody>
    </main>
  );
}

/* keep tree-shaking honest */
void RotateCcw;
