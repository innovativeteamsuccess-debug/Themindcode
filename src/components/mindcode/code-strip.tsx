"use client";

import { CORE_SYMBOLS } from "./data";

const WORDS = [
  "Curiosity",
  "Understanding",
  "Practice",
  "Mastery",
  "Growth",
];

/**
 * CodeStrip — an infinite marquee of subject symbols and the
 * learning philosophy. The "code" of the mind, scrolling forever.
 */
export function CodeStrip() {
  const items = [
    ...CORE_SYMBOLS.map((s) => ({ kind: "symbol" as const, text: s })),
    ...WORDS.map((w) => ({ kind: "word" as const, text: w })),
  ];
  // doubled for the seamless -50% loop
  const doubled = [...items, ...items];

  return (
    <div
      aria-hidden
      className="relative overflow-hidden border-y border-[var(--mc-line-soft)] py-4 select-none"
      style={{
        maskImage:
          "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <div className="mc-marquee flex w-max items-center gap-10">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            <span
              className={
                item.kind === "symbol"
                  ? "font-code text-[15px] text-[var(--mc-faint)]"
                  : "font-code text-[10px] uppercase tracking-[0.42em] text-[var(--mc-accent)]"
              }
            >
              {item.text}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--mc-line)]" />
          </span>
        ))}
      </div>
    </div>
  );
}
