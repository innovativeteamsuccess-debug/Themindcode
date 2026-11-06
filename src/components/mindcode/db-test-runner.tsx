"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Loader2,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react";

/* ============================================================
   DBTestRunner — take a test that was built from a real PDF and
   lives in the database. Answers are graded SERVER-SIDE
   (/api/tests/attempt); the correct answers reach this component
   only after submission, with the saved attempt id.
   ============================================================ */

export type RunnerQuestion = {
  q: string;
  options: string[];
};

export type AttemptResult = {
  attemptId: string;
  score: number;
  total: number;
  perQuestion: {
    index: number;
    chosen: number | null;
    answerIndex: number;
    correct: boolean;
    explanation?: string;
  }[];
};

export function DBTestRunner({
  testId,
  title,
  subject,
  cls,
  minutes,
  questions,
  signedIn,
}: {
  testId: string;
  title: string;
  subject: string;
  cls: number;
  minutes: number;
  questions: RunnerQuestion[];
  signedIn: boolean;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(() => answers.filter((a) => a !== null).length, [answers]);
  const pct = result && result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/tests/attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testId, answers }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string } & AttemptResult;
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Submission failed");
      setResult({
        attemptId: data.attemptId,
        score: data.score,
        total: data.total,
        perQuestion: data.perQuestion,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- result view ---------- */
  if (result) {
    return (
      <div className="flex flex-col gap-6">
        <div className="mc-card relative overflow-hidden p-8 text-center md:p-12">
          <span
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[30rem] -translate-x-1/2 rounded-full opacity-25"
            style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
            aria-hidden
          />
          <p className="font-code text-[10px] uppercase tracking-[0.22em] text-faint">
            Mission complete · saved as {result.attemptId.slice(-6).toUpperCase()}
          </p>
          <div className="mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-full border-2 border-[var(--mc-accent)]">
            <span className="font-display text-4xl">{pct}%</span>
          </div>
          <p className="font-display mt-6 text-2xl">
            {result.score} of {result.total}{" "}
            <span className="accent-serif">correct.</span>
          </p>
          <p className="mt-2 text-[13px] text-dim">
            {pct === 100
              ? "Perfect. This goes in your attempt log forever."
              : pct >= 60
                ? "Strong. Read the explanations below, then retry to beat it."
                : "Every score is a starting line. Read each explanation below — then retry."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setResult(null);
                setAnswers(questions.map(() => null));
                setCurrent(0);
              }}
              className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
            >
              RETRY THIS TEST
            </button>
            <a
              href="/zone"
              className="btn-mono rounded-full border border-[var(--mc-line)] px-6 py-3 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              BACK TO ZONE
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {result.perQuestion.map((pq) => {
            const q = questions[pq.index];
            return (
              <div key={pq.index} className="mc-card flex flex-col gap-2.5 p-5">
                <span className="flex items-start gap-3">
                  {pq.correct ? (
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
                  ) : (
                    <XCircle size={17} className="mt-0.5 shrink-0 text-red-500" />
                  )}
                  <span className="text-[14px] font-semibold leading-snug">{q.q}</span>
                </span>
                <div className="ml-6 flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => (
                    <span
                      key={oi}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] ${
                        oi === pq.answerIndex
                          ? "border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] font-semibold"
                          : oi === pq.chosen
                            ? "border-red-300/50 text-dim line-through"
                            : "border-[var(--mc-line)] text-dim"
                      }`}
                    >
                      <span className="font-code text-[8.5px] text-faint">
                        {String.fromCharCode(65 + oi)}
                      </span>
                      {opt}
                      {oi === pq.answerIndex && (
                        <BadgeCheck size={12} className="ml-auto text-[var(--mc-accent)]" />
                      )}
                    </span>
                  ))}
                  {pq.explanation && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-dim">
                      <Sparkles size={12} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
                      {pq.explanation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ---------- question flow ---------- */
  const q = questions[current];
  return (
    <div className="flex flex-col gap-5">
      {/* progress */}
      <div className="flex items-center gap-4">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--mc-line)]">
          <motion.div
            className="h-full rounded-full bg-[var(--mc-accent)]"
            animate={{ width: `${(answeredCount / questions.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <span className="font-code shrink-0 text-[9px] uppercase tracking-[0.18em] text-faint">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      {/* question card */}
      <div className="mc-card p-6 md:p-8">
        <p className="font-code text-[9.5px] uppercase tracking-[0.22em] text-faint">
          Q{current + 1} of {questions.length} · {subject} · Class {cls}
        </p>
        <h2 className="mt-3 text-[clamp(1.1rem,2.4vw,1.5rem)] font-semibold leading-snug">{q.q}</h2>
        <div className="mt-6 grid gap-2.5">
          {q.options.map((opt, oi) => {
            const chosen = answers[current] === oi;
            return (
              <button
                key={oi}
                type="button"
                onClick={() =>
                  setAnswers((prev) => prev.map((a, i) => (i === current ? oi : a)))
                }
                aria-pressed={chosen}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-[14px] transition-all duration-300 ${
                  chosen
                    ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] font-semibold"
                    : "border-[var(--mc-line)] hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
                }`}
              >
                <span
                  className={`font-code flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[9px] ${
                    chosen
                      ? "border-[var(--mc-accent)] text-[var(--mc-accent)]"
                      : "border-[var(--mc-line)] text-faint"
                  }`}
                >
                  {String.fromCharCode(65 + oi)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-red-300/40 px-4 py-3 text-[12.5px] text-dim">{error}</p>
      )}

      {/* nav */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] text-dim transition-colors enabled:hover:border-[var(--mc-accent)] enabled:hover:text-[var(--mc-accent)] disabled:opacity-40"
        >
          <ArrowLeft size={12} />
          PREV
        </button>

        {current < questions.length - 1 ? (
          <button
            type="button"
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            className="btn-mono inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
          >
            NEXT
            <ArrowRight size={12} />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !signedIn}
            className="btn-mono inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            {submitting ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {submitting ? "GRADING…" : "SUBMIT TEST"}
          </button>
        )}
      </div>

      {!signedIn && (
        <p className="font-code rounded-xl border border-[var(--mc-line)] px-4 py-3 text-[9.5px] uppercase leading-relaxed tracking-[0.16em] text-faint">
          Sign in from the Student Zone to submit — your score needs a real account.
        </p>
      )}
    </div>
  );
}
