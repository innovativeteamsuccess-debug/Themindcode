"use client";

/* ============================================================
   Subject scenes + constellation helpers.
   Extracted from the original universe explorer so the
   class / subject / chapter screens can share one visual
   language. Same art, now reused across worlds.
   ============================================================ */

import type { ReactNode } from "react";
import type { Chapter, Subject, SubjectKey } from "./data";

export function MathScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g stroke={color} strokeOpacity="0.16">
        {Array.from({ length: 9 }).map((_, i) => (
          <line key={`v${i}`} x1={20 + i * 22} y1="10" x2={20 + i * 22} y2="130" />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={`h${i}`} x1="20" y1={12 + i * 22} x2="196" y2={12 + i * 22} />
        ))}
      </g>
      <line x1="20" y1="80" x2="196" y2="80" stroke={color} strokeOpacity="0.55" />
      <line x1="60" y1="10" x2="60" y2="130" stroke={color} strokeOpacity="0.55" />
      <path
        d="M 40 20 Q 110 190 180 30"
        stroke={color}
        strokeWidth="1.6"
        className="dash-draw"
        strokeDasharray="300"
        style={{ strokeDashoffset: 300, animation: "dash-draw 1.6s ease-out forwards" }}
      />
      <circle cx="110" cy="103" r="3" fill={color} />
      <circle cx="145" cy="66" r="3" fill={color} />
      <circle cx="70" cy="51" r="3" fill={color} />
      <text x="150" y="34" fill={color} fontSize="11" fontFamily="'Space Grotesk', sans-serif" opacity="0.9">
        y = ax² + bx + c
      </text>
      <text x="26" y="22" fill={color} fontSize="10" opacity="0.6">Δ &lt; 0</text>
    </svg>
  );
}

export function ScienceScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g transform="translate(110 70)">
        <circle r="5" fill={color} />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" transform="rotate(60)" />
        <ellipse rx="46" ry="16" stroke={color} strokeOpacity="0.7" transform="rotate(-60)" />
        <circle cx="46" cy="0" r="2.6" fill={color} />
        <circle cx="-23" cy="40" r="2.6" fill={color} />
        <circle cx="-23" cy="-40" r="2.6" fill={color} />
      </g>
      <g transform="translate(36 108)">
        <line x1="0" y1="0" x2="26" y2="-16" stroke={color} strokeOpacity="0.6" />
        <line x1="26" y1="-16" x2="52" y2="0" stroke={color} strokeOpacity="0.6" />
        <circle r="4.5" fill={color} fillOpacity="0.9" />
        <circle cx="26" cy="-16" r="3.4" fill={color} fillOpacity="0.7" />
        <circle cx="52" r="4.5" fill={color} fillOpacity="0.9" />
      </g>
      <text x="150" y="120" fill={color} fontSize="10" opacity="0.7" fontFamily="'Space Grotesk', sans-serif">
        2H₂ + O₂ → 2H₂O
      </text>
    </svg>
  );
}

export function SstScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <g transform="translate(64 58)">
        <circle r="34" stroke={color} strokeOpacity="0.8" />
        <ellipse rx="34" ry="12" stroke={color} strokeOpacity="0.5" />
        <ellipse rx="14" ry="34" stroke={color} strokeOpacity="0.5" />
        <line x1="-34" y1="0" x2="34" y2="0" stroke={color} strokeOpacity="0.5" />
        <path d="M -12 8 Q 0 22 14 10" stroke={color} strokeOpacity="0.7" fill="none" />
      </g>
      <line x1="118" y1="112" x2="204" y2="112" stroke={color} strokeOpacity="0.55" />
      {[124, 148, 172, 196].map((x, i) => (
        <circle key={x} cx={x} cy="112" r={i === 2 ? 4 : 2.6} fill={color} fillOpacity={i === 2 ? 1 : 0.65} />
      ))}
      <text x="118" y="128" fill={color} fontSize="9" opacity="0.65" fontFamily="'Space Grotesk', sans-serif">1857</text>
      <text x="184" y="128" fill={color} fontSize="9" opacity="0.65" fontFamily="'Space Grotesk', sans-serif">1947</text>
      <path d="M 150 70 l 10 12 -10 12" stroke={color} strokeOpacity="0.4" />
    </svg>
  );
}

export function EnglishScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="26"
        y="86"
        fill={color}
        fillOpacity="0.9"
        fontSize="64"
        fontWeight="300"
        fontFamily="'Space Grotesk', sans-serif"
      >
        Aa
      </text>
      <g stroke={color} strokeOpacity="0.4" strokeLinecap="round">
        <line x1="110" y1="42" x2="196" y2="42" />
        <line x1="110" y1="58" x2="186" y2="58" />
        <line x1="110" y1="74" x2="196" y2="74" />
        <line x1="110" y1="90" x2="172" y2="90" />
      </g>
      <text x="196" y="34" fill={color} fontSize="24" opacity="0.75" fontFamily="Georgia, serif">”</text>
      <text x="104" y="118" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">
        metaphor · imagery · tone
      </text>
    </svg>
  );
}

export function HindiScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="30"
        y="88"
        fill={color}
        fillOpacity="0.92"
        fontSize="58"
        fontWeight="400"
        fontFamily="'Noto Sans Devanagari', 'Mangal', sans-serif"
      >
        अ
      </text>
      <g stroke={color} strokeOpacity="0.4" strokeLinecap="round">
        <path d="M 116 48 q 18 -12 36 0" />
        <path d="M 116 66 q 26 -16 52 0" />
        <path d="M 116 84 q 34 -20 68 0" />
      </g>
      <text x="150" y="118" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">
        भाषा · व्याकरण · साहित्य
      </text>
    </svg>
  );
}

export function SanskritScene({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 220 140" className="h-full w-full" fill="none">
      <text
        x="66"
        y="94"
        fill={color}
        fillOpacity="0.92"
        fontSize="60"
        fontFamily="'Noto Sans Devanagari', 'Mangal', sans-serif"
      >
        ॐ
      </text>
      <circle cx="110" cy="70" r="52" stroke={color} strokeOpacity="0.3" strokeDasharray="3 6" className="mc-spin-slower" style={{ transformOrigin: "110px 70px" }} />
      <text x="150" y="40" fill={color} fontSize="10" opacity="0.6" fontFamily="'Space Grotesk', sans-serif">शुभम्</text>
    </svg>
  );
}

export const SCENES: Record<SubjectKey, (p: { color: string }) => ReactNode> = {
  math: MathScene,
  science: ScienceScene,
  sst: SstScene,
  english: EnglishScene,
  hindi: HindiScene,
  sanskrit: SanskritScene,
};

export function subjectColor(s: Subject) {
  return `var(${s.varName})`;
}

/* ------------------------------------------------------------------ */
/* Constellation layout                                                */
/* ------------------------------------------------------------------ */

export function constellationPositions(n: number) {
  const pts: { x: number; y: number }[] = [];
  const cx = 500;
  const cy = 258;
  const maxR = 150 + Math.min(n, 16) * 7;
  for (let i = 0; i < n; i++) {
    const angle = i * 2.39996; // golden angle
    const r = 40 + (i / Math.max(n - 1, 1)) * maxR;
    pts.push({
      x: cx + r * Math.cos(angle) * 1.42,
      y: cy + r * Math.sin(angle) * 0.8,
    });
  }
  return pts;
}

/** Wrap a chapter name into at most two ~16-char lines. */
export function wrapLabel(name: string): string[] {
  if (name.length <= 17) return [name];
  const words = name.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= 17) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length <= 2) return lines;
  return [lines[0], lines.slice(1).join(" ").slice(0, 16) + "…"];
}

export function StatusGlyph({ status, size = 14 }: { status: Chapter["status"]; size?: number }) {
  if (status === "done")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="5.5" fill="var(--mc-accent)" />
      </svg>
    );
  if (status === "progress")
    return (
      <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
        <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--mc-ink)" strokeOpacity="0.75" />
        <path d="M 7 1.5 A 5.5 5.5 0 0 1 12.5 7 L 7 7 Z" fill="var(--mc-ink)" fillOpacity="0.75" />
      </svg>
    );
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden>
      <circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--mc-faint)" strokeOpacity="0.8" />
    </svg>
  );
}
