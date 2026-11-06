/* ============================================================
   CODE STUDIO — local math engine
   A real, offline solver: parses linear & quadratic equations in
   one variable, produces teaching steps (with LaTeX), verifies
   solutions, evaluates arithmetic, and samples graphs.
   Runs entirely on-device so Solve/Check/Graph work instantly
   and even when the AI service is unreachable.
   ============================================================ */

import type { MathStep } from "../types";

export type Poly = { a: number; b: number; c: number }; // a·x² + b·x + c

/* ---------------- parsing ---------------- */

const clean = (s: string) =>
  s
    .toLowerCase()
    .replace(/[·×]/g, "*")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, "")
    .replace(/,(?=\d{3}\b)/g, "");

/** Parse a polynomial (degree ≤ 2) from one side of an equation. */
function parseSide(raw: string): Poly | null {
  const s = clean(raw);
  if (!s) return null;
  let a = 0,
    b = 0,
    c = 0;
  // tokenise into signed chunks
  const chunks = s.match(/[+-]?[^+-]+/g);
  if (!chunks) return null;
  for (const chunk of chunks) {
    const m = chunk.match(/^([+-]?)(\d*\.?\d*)(?:\*?)(x(?:\^2)?|\*)?$/);
    if (!m) return null;
    const sign = m[1] === "-" ? -1 : 1;
    const coefStr = m[2];
    const vpart = m[3];
    if (!coefStr && !vpart) return null;
    let coef = coefStr === "" || coefStr === undefined ? 1 : parseFloat(coefStr);
    if (Number.isNaN(coef)) return null;
    coef *= sign;
    if (!vpart) c += coef;
    else if (vpart === "x") b += coef;
    else if (vpart === "x^2" || vpart === "x²") a += coef;
    else return null;
  }
  return { a, b, c };
}

export type MathKind = "linear" | "quadratic" | "identity" | "none";

export interface ParsedEquation {
  kind: MathKind;
  poly: Poly;
  original: string;
}

/** Detect and parse an equation in one variable (x). */
export function parseEquation(input: string): ParsedEquation | null {
  const s = clean(input);
  if (!s.includes("=")) return null;
  if (!/x/.test(s)) return null;
  const parts = s.split("=");
  if (parts.length !== 2) return null;
  const L = parseSide(parts[0]);
  const R = parseSide(parts[1]);
  if (!L || !R) return null;
  const poly: Poly = {
    a: L.a - R.a,
    b: L.b - R.b,
    c: L.c - R.c,
  };
  const kind: MathKind =
    Math.abs(poly.a) > 1e-9 ? "quadratic" : Math.abs(poly.b) > 1e-9 ? "linear" : "identity";
  return { kind, poly, original: input.trim() };
}

export function isLikelyEquation(text: string): boolean {
  return parseEquation(text) !== null;
}

/* ---------------- formatting ---------------- */

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}

function texNum(n: number): string {
  if (Number.isInteger(n)) return String(n);
  const frac = toFraction(n, 1e-6);
  if (frac) return `\\frac{${frac[0]}}{${frac[1]}}`;
  return fmt(n);
}

function toFraction(n: number, eps: number): [number, number] | null {
  for (let d = 2; d <= 64; d++) {
    const num = n * d;
    if (Math.abs(num - Math.round(num)) < eps) {
      const p = Math.round(num);
      const g = gcd(Math.abs(p), d);
      return [p / g, d / g];
    }
  }
  return null;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function polyToTex(p: Poly, rhs = 0): string {
  const terms: string[] = [];
  if (Math.abs(p.a) > 1e-9) terms.push(`${fmt(p.a) === "1" ? "" : fmt(p.a) === "-1" ? "-" : fmt(p.a)}x^{2}`);
  if (Math.abs(p.b) > 1e-9)
    terms.push(`${terms.length ? (p.b < 0 ? "-" : "+") : p.b < 0 ? "-" : ""}${Math.abs(p.b) === 1 ? "" : fmt(Math.abs(p.b))}x`);
  if (Math.abs(p.c) > 1e-9 || terms.length === 0)
    terms.push(`${terms.length ? (p.c < 0 ? "-" : "+") : ""}${Math.abs(p.c) === 0 ? "0" : fmt(Math.abs(p.c))}`);
  const lhs = terms.join("");
  if (rhs === 0) return `${lhs} = 0`;
  return `${lhs} = ${texNum(rhs)}`;
}

/* ---------------- solving ---------------- */

export interface SolveResult {
  title: string;
  steps: MathStep[];
  latex: string[];
  answer: string;
  roots: number[];
  poly: Poly;
  kind: MathKind;
}

export function solveEquation(input: string): SolveResult | null {
  const parsed = parseEquation(input);
  if (!parsed) return null;
  const { poly, original } = parsed;

  if (parsed.kind === "identity") {
    return {
      title: "Every value works",
      steps: [
        { t: "Start with the equation", latex: clean(original) },
        { t: "Both sides simplify to the same expression", d: "The variable cancels out, so the equation is true for every x." },
      ],
      latex: [clean(original)],
      answer: "All real numbers",
      roots: [],
      poly,
      kind: "identity",
    };
  }

  if (parsed.kind === "linear") {
    const b = poly.b,
      c = poly.c;
    const x = -c / b;
    const steps: MathStep[] = [
      { t: "Start with the equation", latex: clean(original) },
      {
        t: `Move the constant ${c >= 0 ? "away" : "across"}`,
        d: Math.abs(c) < 1e-9 ? undefined : `Subtract ${fmt(c)} from both sides.`,
        latex: `${fmt(b)}x = ${fmt(-c)}`,
      },
    ];
    if (Math.abs(b - 1) > 1e-9) {
      steps.push({
        t: `Divide both sides by ${fmt(b)}`,
        d: "The coefficient of x becomes 1.",
        latex: `x = \\frac{${fmt(-c)}}{${fmt(b)}}`,
      });
    }
    steps.push({ t: "Solution", latex: `x = ${texNum(x)}` });
    const check = verify(original, x);
    if (check) steps.push({ t: "Check the answer", d: check, latex: `\\text{LHS} = \\text{RHS} \\;\\checkmark` });
    return {
      title: `x = ${texNum(x)}`,
      steps,
      latex: steps.map((s) => s.latex).filter((v): v is string => Boolean(v)),
      answer: `x = ${fmt(x)}`,
      roots: [x],
      poly,
      kind: "linear",
    };
  }

  // quadratic
  const a = poly.a,
    b = poly.b,
    c = poly.c;
  const D = b * b - 4 * a * c;
  const steps: MathStep[] = [
    { t: "Standard form", d: "Everything on one side, zero on the other.", latex: polyToTex(poly) },
    {
      t: "Identify the coefficients",
      d: `a = ${fmt(a)}, b = ${fmt(b)}, c = ${fmt(c)}`,
      latex: `a = ${fmt(a)},\\;\\; b = ${fmt(b)},\\;\\; c = ${fmt(c)}`,
    },
  ];
  if (D < -1e-9) {
    steps.push({
      t: "Compute the discriminant",
      d: `D = b² − 4ac = ${fmt(b)}² − 4·${fmt(a)}·${fmt(c)} = ${fmt(D)}. Negative — no real roots; the parabola never touches the x-axis.`,
      latex: `D = b^{2} - 4ac = ${texNum(D)}`,
    });
    return {
      title: "No real roots",
      steps,
      latex: steps.map((s) => s.latex).filter((v): v is string => Boolean(v)),
      answer: "No real solutions (D < 0)",
      roots: [],
      poly,
      kind: "quadratic",
    };
  }
  steps.push({
    t: "Compute the discriminant",
    d: `D = b² − 4ac = ${fmt(D)}. ${Math.abs(D) < 1e-9 ? "Zero — one repeated root." : "Positive — two real roots."}`,
    latex: `D = b^{2} - 4ac = ${texNum(D)}`,
  });
  steps.push({
    t: "Apply the quadratic formula",
    latex: `x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{${texNum(-b)} \\pm \\sqrt{${texNum(D)}}}{${texNum(2 * a)}}`,
  });
  const sq = Math.sqrt(D);
  const r1 = (-b + sq) / (2 * a);
  const r2 = (-b - sq) / (2 * a);
  if (Math.abs(D) < 1e-9) {
    steps.push({ t: "One repeated root", latex: `x = ${texNum(r1)}` });
    return {
      title: `x = ${texNum(r1)}`,
      steps,
      latex: steps.map((s) => s.latex).filter((v): v is string => Boolean(v)),
      answer: `x = ${fmt(r1)} (double root)`,
      roots: [r1],
      poly,
      kind: "quadratic",
    };
  }
  steps.push({ t: "The two roots", latex: `x_1 = ${texNum(r1)},\\;\\; x_2 = ${texNum(r2)}` });
  if (Number.isInteger(r1) && Number.isInteger(r2) && Math.abs(a) === 1) {
    steps.push({
      t: "Factor check",
      d: "Integer roots mean it factors cleanly.",
      latex: `(x ${r1 >= 0 ? "-" : "+"} ${Math.abs(r1)})(x ${r2 >= 0 ? "-" : "+"} ${Math.abs(r2)}) = 0`,
    });
  }
  return {
    title: `x = ${texNum(r1)} or x = ${texNum(r2)}`,
    steps,
    latex: steps.map((s) => s.latex).filter((v): v is string => Boolean(v)),
    answer: `x = ${fmt(r1)}, x = ${fmt(r2)}`,
    roots: [r1, r2],
    poly,
    kind: "quadratic",
  };
}

/** Substitute x back into the original equation; returns a sentence or null. */
export function verify(original: string, x: number): string | null {
  const s = clean(original);
  const parts = s.split("=");
  if (parts.length !== 2) return null;
  const lhs = evalWithX(parts[0], x);
  const rhs = evalWithX(parts[1], x);
  if (lhs === null || rhs === null) return null;
  const ok = Math.abs(lhs - rhs) < 1e-6;
  return `Substitute x = ${fmt(x)}: left side becomes ${fmt(lhs)}, right side is ${fmt(rhs)} — ${ok ? "they match" : "they do not match"}.`;
}

/** Evaluate a polynomial-ish expression at a value of x (safe, no eval). */
export function evalWithX(exprRaw: string, x: number): number | null {
  const s = clean(exprRaw).replace(/\^/g, "**");
  // Restrict to safe characters; supports * / + - ( ) . digits, x, **
  if (!/^[-+*/().0-9x**]*$/.test(s)) return null;
  try {
    const js = s.replace(/x/g, `(${x})`);
    const fn = new Function(`"use strict"; return (${js || "0"});`);
    const v = fn();
    return typeof v === "number" && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Evaluate plain arithmetic (no variables). */
export function evalArithmetic(exprRaw: string): number | null {
  if (/x/i.test(exprRaw)) return null;
  const v = evalWithX(exprRaw, 0);
  return v;
}

/* ---------------- graph sampling ---------------- */

export interface GraphSample {
  points: { x: number; y: number }[];
  roots: number[];
  vertex?: { x: number; y: number };
  xMin: number;
  xMax: number;
  kind: MathKind;
}

/** Sample the polynomial around its interesting region for plotting. */
export function sampleGraph(poly: Poly, original?: string): GraphSample | null {
  if (Math.abs(poly.a) < 1e-9 && Math.abs(poly.b) < 1e-9) return null;
  const isQuad = Math.abs(poly.a) > 1e-9;
  let roots: number[] = [];
  let cx = 0;
  if (isQuad) {
    const D = poly.b * poly.b - 4 * poly.a * poly.c;
    if (D >= 0) {
      const sq = Math.sqrt(D);
      roots = [(-poly.b + sq) / (2 * poly.a), (-poly.b - sq) / (2 * poly.a)];
    }
    cx = -poly.b / (2 * poly.a);
  } else {
    roots = Math.abs(poly.b) > 1e-9 ? [-poly.c / poly.b] : [];
    cx = roots[0] ?? 0;
  }
  const span = isQuad ? Math.max(6, Math.abs(roots[0] - roots[1]) * 1.6 || 8) : 10;
  const xMin = cx - span;
  const xMax = cx + span;
  const N = 48;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + ((xMax - xMin) * i) / N;
    const y = poly.a * x * x + poly.b * x + poly.c;
    points.push({ x, y });
  }
  const vertex = isQuad ? { x: cx, y: poly.a * cx * cx + poly.b * cx + poly.c } : undefined;
  return { points, roots, vertex, xMin, xMax, kind: isQuad ? "quadratic" : "linear" };
}

/* ---------------- smart-content detection ---------------- */

const CONCEPT_HINTS: { re: RegExp; topic: string }[] = [
  { re: /photosynth/i, topic: "photosynthesis" },
  { re: /newton|inertia|f\s*=\s*ma|third law/i, topic: "newton" },
  { re: /heart|circulat|blood/i, topic: "heart" },
  { re: /water cycle|evaporat|condensat/i, topic: "water cycle" },
  { re: /french revolution|bastille/i, topic: "french revolution" },
  { re: /quadratic|parabola|discriminant/i, topic: "quadratic" },
  { re: /pythag/i, topic: "pythagoras" },
  { re: /trigonometry|sin|cos|tan\b/i, topic: "trigonometry" },
  { re: /cell|mitochondr|nucleus/i, topic: "cell" },
  { re: /fraction/i, topic: "fractions" },
];

export function detectTopic(text: string): string | null {
  for (const h of CONCEPT_HINTS) if (h.re.test(text)) return h.topic;
  return null;
}
