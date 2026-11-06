"use client";

/* LaTeX editor popover for equation objects: live preview, symbol
   palette, and a local "Solve" that animates steps onto the canvas
   even offline. Screen-space overlay anchored to the object. */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CanvasObject , ObjectPatch} from "./types";
import { useStudio } from "./store";
import { solveEquation } from "./lib/math-engine";
import { Tex } from "./objects/KaTex";

const SYMBOLS: { label: string; insert: string }[] = [
  { label: "a/b", insert: "\\frac{}{}" },
  { label: "x²", insert: "^{2}" },
  { label: "xⁿ", insert: "^{}" },
  { label: "√", insert: "\\sqrt{}" },
  { label: "±", insert: "\\pm" },
  { label: "×", insert: "\\times" },
  { label: "÷", insert: "\\div" },
  { label: "≤", insert: "\\leq" },
  { label: "≥", insert: "\\geq" },
  { label: "≠", insert: "\\neq" },
  { label: "π", insert: "\\pi" },
  { label: "θ", insert: "\\theta" },
  { label: "Δ", insert: "\\Delta" },
  { label: "∑", insert: "\\sum" },
  { label: "∞", insert: "\\infty" },
  { label: "→", insert: "\\rightarrow" },
];

export function EquationEditor({ obj, anchor }: { obj: Extract<CanvasObject, { kind: "equation" }>; anchor: { x: number; y: number } }) {
  const patch = useStudio((s) => s.patchObject);
  const setEditing = useStudio((s) => s.setEditing);
  const [value, setValue] = useState(obj.latex);
  const [solved, setSolved] = useState<string | null>(null);

  const preview = useMemo(() => value, [value]);

  function insert(snippet: string) {
    setValue((v) => {
      const next = v.includes("{}") ? v.replace("{}", snippet) : v + snippet;
      return next;
    });
  }

  function commit() {
    patch(obj.id, { latex: value } as ObjectPatch);
    useStudio.getState().persistNow();
    setEditing(null);
  }

  function solveLocal() {
    // attempt to read plain math from the latex
    const plain = value
      .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
      .replace(/[{}]/g, "")
      .replace(/\\times|\\cdot/g, "*")
      .replace(/\\div/g, "/")
      .replace(/\\pm/g, "+")
      .trim();
    const res = solveEquation(plain);
    setSolved(res ? `${res.answer}` : null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      className="st-glass st-ui absolute z-40 w-[330px] rounded-[16px] p-3"
      style={{ left: anchor.x, top: anchor.y + 12 }}
      onPointerDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Equation editor"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.24em] text-[var(--st-faint)]">
          equation · latex
        </span>
        <button type="button" className="st-btn px-2 py-0.5 text-[10px]" onClick={commit}>
          Done ⏎
        </button>
      </div>
      <input
        className="st-input w-full px-3 py-2 font-[family-name:var(--font-code-mono)] text-[12.5px]"
        value={value}
        autoFocus
        placeholder="x^2 - 5x + 6 = 0"
        aria-label="LaTeX source"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(null);
          e.stopPropagation();
        }}
      />
      <div className="mt-2 flex min-h-[54px] items-center justify-center overflow-x-auto rounded-[10px] bg-[rgba(12,13,18,0.65)] px-3 py-2 text-[#F0E9DD]">
        {value.trim() ? <Tex tex={preview} /> : <span className="text-[11px] text-[var(--st-faint)]">live preview</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-1">
        {SYMBOLS.map((s) => (
          <button
            key={s.label}
            type="button"
            className="st-btn h-6 min-w-7 px-1.5 font-[family-name:var(--font-code-mono)] text-[10.5px]"
            onClick={() => insert(s.insert)}
            aria-label={`Insert ${s.label}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        <button type="button" className="st-btn st-btn-ai px-2.5 py-1.5 text-[10.5px]" onClick={solveLocal}>
          ⚡ Solve here
        </button>
        {solved && <span className="font-[family-name:var(--font-code-mono)] text-[10.5px] text-[var(--st-emerald)]">{solved}</span>}
      </div>
    </motion.div>
  );
}
