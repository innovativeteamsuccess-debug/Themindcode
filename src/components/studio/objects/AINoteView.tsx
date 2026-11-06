"use client";

/* AI response card — lives ON the canvas, not in a chat gutter.
   Progressive reveal: title → body → steps, each blooming in. */

import { motion } from "framer-motion";
import type { AINoteObj } from "../types";
import { useStudio } from "../store";
import { Tex } from "./KaTex";

const MODE_LABEL: Record<string, string> = {
  explain: "explained",
  solve: "solved",
  hint: "hint",
  simplify: "simplified",
  check: "checked",
  ask: "answered",
  quiz: "quiz",
  revise: "revision",
  visualize: "diagram",
  summary: "summary",
  practice: "practice",
};

const TONE_DOT: Record<string, string> = {
  violet: "var(--st-violet)",
  blue: "var(--st-sky)",
  emerald: "var(--st-emerald)",
  rose: "var(--st-rose)",
  amber: "var(--st-amber)",
};

export function AINoteView({ obj }: { obj: AINoteObj }) {
  const reduce = useStudio((s) => s.settings.reduceMotion);
  const steps = obj.steps ?? [];

  return (
    <div className="st-ainote st-obj-bare flex h-full w-full flex-col" data-tone={obj.tone}>
      <div className="flex items-center gap-2.5 px-4 pt-3.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: TONE_DOT[obj.tone] }} />
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.24em] text-[var(--st-faint)]">
          CODE · {MODE_LABEL[obj.mode] ?? obj.mode}
        </span>
      </div>
      <div className="st-scroll flex-1 overflow-y-auto px-4 pb-4 pt-2">
        <motion.h3
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-[family-name:var(--font-body-sans)] text-[15.5px] font-semibold leading-snug text-[var(--st-ink)]"
        >
          {obj.title}
        </motion.h3>
        {obj.body && (
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.06 }}
            className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-relaxed text-[var(--st-dim)]"
          >
            {obj.body}
          </motion.p>
        )}
        {steps.length > 0 && (
          <ol className="mt-3 space-y-2.5">
            {steps.map((s, i) => (
              <motion.li
                key={i}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.34, delay: reduce ? 0 : 0.12 + i * 0.11 }}
                className="flex gap-2.5"
              >
                <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[rgba(255,171,98,0.1)] font-[family-name:var(--font-code-mono)] text-[8.5px] text-[var(--st-dim)]">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-[var(--st-ink)]">{s.t}</p>
                  {s.d && <p className="mt-0.5 text-[11.5px] leading-relaxed text-[var(--st-dim)]">{s.d}</p>}
                  {s.latex && (
                    <div className="mt-1.5 overflow-x-auto rounded-lg bg-[rgba(12,13,18,0.65)] px-3 py-2 text-[#F0E9DD]">
                      <Tex tex={s.latex} />
                    </div>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        )}
        {obj.latex && obj.latex.length > 0 && (
          <div className="mt-3 space-y-2">
            {obj.latex.map((l, i) => (
              <div key={i} className="overflow-x-auto rounded-lg bg-[rgba(12,13,18,0.65)] px-3 py-2 text-[#F0E9DD]">
                <Tex tex={l} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
