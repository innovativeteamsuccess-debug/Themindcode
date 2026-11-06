"use client";

/* Interactive study objects: quiz cards and flashcard decks.
   Fully functional on-canvas — answers, explanations, scoring,
   card flipping. Marked .st-ui so the canvas never drags them. */

import { useState } from "react";
import { motion } from "framer-motion";
import type { CanvasObject, FlashcardsObj, QuizObj , ObjectPatch} from "../types";
import { useStudio } from "../store";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizView({ obj }: { obj: QuizObj }) {
  const patch = useStudio((s) => s.patchObject);
  const [idx, setIdx] = useState(0);
  const q = obj.questions[idx];
  if (!q) return null;
  const picked = obj.picked[String(idx)];
  const answeredCount = Object.keys(obj.picked).length;
  const score = obj.questions.reduce((acc, qq, i) => (obj.picked[String(i)] === qq.answer ? acc + 1 : acc), 0);
  const done = answeredCount === obj.questions.length;

  function pick(opt: number) {
    if (picked !== undefined) return;
    patch(obj.id, { picked: { ...obj.picked, [String(idx)]: opt } } as ObjectPatch);
    useStudio.getState().persistNow();
  }

  return (
    <div className="st-card st-obj-bare flex h-full w-full flex-col" style={{ padding: 0 }}>
      <div className="flex items-center justify-between border-b border-[var(--st-line)] px-4 py-2.5">
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.22em] text-[var(--st-faint)]">
          {obj.title} · quiz
        </span>
        <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] text-[var(--st-dim)]">
          {done ? `score ${score}/${obj.questions.length}` : `${idx + 1} / ${obj.questions.length}`}
        </span>
      </div>
      <div className="st-scroll st-ui flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3.5">
        <p className="text-[13.5px] font-medium leading-snug text-[var(--st-ink)]">{q.q}</p>
        <div className="flex flex-col gap-1.5">
          {q.options.map((opt, oi) => {
            const state =
              picked === undefined ? "idle" : oi === q.answer ? "right" : picked === oi ? "wrong" : "idle";
            return (
              <button key={oi} type="button" className="st-quiz-opt" data-state={state} onClick={() => pick(oi)}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-[var(--st-line)] bg-[rgba(12,13,18,0.5)] font-[family-name:var(--font-code-mono)] text-[9px]">
                  {LETTERS[oi]}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {picked !== undefined && q.why && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-[var(--st-line)] bg-[rgba(12,13,18,0.5)] px-3 py-2 text-[11.5px] leading-relaxed text-[var(--st-dim)]"
          >
            {q.why}
          </motion.p>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-[var(--st-line)] px-4 py-2">
        <div className="flex gap-1">
          {obj.questions.map((_, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  obj.picked[String(i)] === obj.questions[i].answer
                    ? "var(--st-emerald)"
                    : obj.picked[String(i)] !== undefined
                      ? "var(--st-rose)"
                      : "rgba(255,171,98,0.28)",
              }}
            />
          ))}
        </div>
        <div className="st-ui flex gap-1.5">
          <button type="button" className="st-btn px-2.5 py-1 text-[10.5px]" disabled={idx === 0} onClick={() => setIdx((v) => Math.max(0, v - 1))}>
            Prev
          </button>
          <button
            type="button"
            className="st-btn px-2.5 py-1 text-[10.5px]"
            disabled={idx === obj.questions.length - 1}
            onClick={() => setIdx((v) => Math.min(obj.questions.length - 1, v + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function FlashcardsView({ obj }: { obj: FlashcardsObj }) {
  const patch = useStudio((s) => s.patchObject);
  const reduce = useStudio((s) => s.settings.reduceMotion);
  const card = obj.cards[obj.index];
  if (!card) return null;

  return (
    <div className="st-card st-obj-bare flex h-full w-full flex-col" style={{ padding: 0 }}>
      <div className="flex items-center justify-between border-b border-[var(--st-line)] px-4 py-2.5">
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.22em] text-[var(--st-faint)]">
          {obj.title} · cards
        </span>
        <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] text-[var(--st-dim)]">
          {obj.index + 1} / {obj.cards.length}
        </span>
      </div>
      <div className="st-ui flex flex-1 items-center justify-center px-5">
        <motion.button
          type="button"
          onClick={() => {
            patch(obj.id, { flipped: !obj.flipped } as ObjectPatch);
            useStudio.getState().persistNow();
          }}
          animate={{ rotateY: obj.flipped ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d", perspective: 900 }}
          className="relative flex min-h-[110px] w-full items-center justify-center rounded-[14px] border border-[var(--st-line-2)] bg-[rgba(12,13,18,0.55)] px-5 py-4 text-center"
          aria-label={obj.flipped ? "Show question side" : "Reveal answer"}
        >
          <span
            style={{ transform: obj.flipped ? "rotateY(180deg)" : undefined, backfaceVisibility: "hidden", position: obj.flipped ? "absolute" : "relative", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 20px" }}
            className="whitespace-pre-wrap text-[13.5px] font-medium leading-relaxed text-[var(--st-ink)]"
          >
            {card.front}
          </span>
          <span
            style={{ transform: obj.flipped ? undefined : "rotateY(180deg)", backfaceVisibility: "hidden", position: obj.flipped ? "relative" : "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px 20px" }}
            className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--st-emerald)]"
          >
            {card.back}
          </span>
        </motion.button>
      </div>
      <div className="st-ui flex items-center justify-center gap-2 border-t border-[var(--st-line)] px-4 py-2">
        <button
          type="button"
          className="st-btn px-3 py-1 text-[10.5px]"
          onClick={() => {
            patch(obj.id, { index: Math.max(0, obj.index - 1), flipped: false } as ObjectPatch);
          }}
        >
          ← Back
        </button>
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.18em] text-[var(--st-faint)]">
          tap card to flip
        </span>
        <button
          type="button"
          className="st-btn px-3 py-1 text-[10.5px]"
          onClick={() => {
            patch(obj.id, { index: Math.min(obj.cards.length - 1, obj.index + 1), flipped: false } as ObjectPatch);
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
