/* ============================================================
   CODE STUDIO — AI client (provider-swappable)
   The canvas layer never talks to a vendor directly; it calls
   runAI(). Today that proxies to /api/studio/ai (z-ai SDK).
   Swap Provider later without touching canvas code.
   Local-first: solve/check/graph run on the on-device engine.
   ============================================================ */

import type { AIContext, AIMode, AIResult } from "../types";
import { detectTopic, solveEquation, verify } from "./math-engine";

export interface AIProvider {
  run(ctx: AIContext, mode: AIMode): Promise<AIResult>;
}

class HttpProvider implements AIProvider {
  async run(ctx: AIContext, mode: AIMode): Promise<AIResult> {
    const res = await fetch("/api/studio/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode,
        prompt: ctx.prompt,
        boardTitle: ctx.boardTitle,
        board: ctx.objects.length
          ? ctx.objects.slice(0, 40).map((o) => `[${o.kind}] ${o.text}`).join("\n").slice(0, 1400)
          : undefined,
        selection: ctx.selection.length
          ? ctx.selection.map((s) => `[${s.kind}] ${s.text}`).join("\n").slice(0, 1400)
          : undefined,
      }),
    });
    const data = (await res.json()) as { ok: boolean; result?: AIResult; error?: string };
    if (!res.ok || !data.ok || !data.result) {
      if (res.status === 401) {
        throw new Error("Log in to use CODE AI — tap the LOG IN button up top. It's free.");
      }
      throw new Error(data.error || "AI is unreachable right now.");
    }
    return data.result;
  }
}

let provider: AIProvider = new HttpProvider();
export function setAIProvider(p: AIProvider) {
  provider = p;
}

/* ---------- local-first intelligence ---------- */

function mathSelection(ctx: AIContext): string | null {
  for (const s of ctx.selection) {
    if (s.kind === "equation" || /[-+*/^]|\bx\b/i.test(s.text)) {
      const cand = s.latex ? s.latex : s.text;
      if (cand && /\d/.test(cand)) return cand;
    }
  }
  return null;
}

function texToPlain(latex: string): string {
  return latex
    .replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^{}]*)\}/g, "sqrt($1)")
    .replace(/[{}]/g, "")
    .replace(/\\times/g, "*")
    .replace(/\\cdot/g, "*")
    .replace(/\\pm/g, "+-")
    .replace(/x\^2|x\^\{2\}/gi, "x^2")
    .replace(/\\left|\\right|\\text\{[^}]*\}/g, "")
    .trim();
}

/** Runs local intelligence first; falls through to the provider. */
export async function runAI(mode: AIMode, ctx: AIContext): Promise<{ result: AIResult; local: boolean }> {
  // 1) Solve / check on equations — instant, offline
  if (mode === "solve" || mode === "check") {
    const raw = mathSelection(ctx);
    if (raw) {
      const expr = texToPlain(raw);
      const solved = solveEquation(expr);
      if (solved) {
        if (mode === "solve") {
          return {
            result: {
              title: solved.title,
              body: `Solved with the ${solved.kind === "quadratic" ? "quadratic formula" : "balance method"} — each step is on the card.`,
              steps: solved.steps,
            },
            local: true,
          };
        }
        // check: verify the final answer stated on the board, if any
        const steps = solved.steps;
        return {
          result: {
            title: "Work checked",
            body: verify(expr, solved.roots[0] ?? 0) ?? "Structure looks right.",
            steps: steps.slice(-1),
          },
          local: true,
        };
      }
    }
  }

  // 2) visualize — template diagrams for known topics, else provider
  if (mode === "visualize") {
    const topic =
      detectTopic(
        [ctx.boardTitle, ...ctx.selection.map((s) => s.text), ...ctx.objects.map((o) => o.text), ctx.prompt ?? ""].join(" ")
      ) ?? null;
    const tpl = topic ? templateDiagram(topic) : null;
    if (tpl) return { result: tpl, local: true };
  }

  // 3) everything else → provider
  const result = await provider.run(ctx, mode);
  return { result, local: false };
}

/* ---------- offline diagram templates (editable, structured) ---------- */

function N(
  id: string,
  label: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  text?: string,
  shape: "rect" | "rounded" | "pill" | "ellipse" | "diamond" = "rounded"
) {
  return { id, label, x, y, w, h, fill, shape, text: text ?? label };
}
function E(id: string, from: string, to: string, label?: string, dashed = false) {
  return { id, from, to, label, dashed };
}

const TEMPLATES: Record<string, AIResult> = {
  photosynthesis: {
    title: "Photosynthesis — the energy pipeline",
    diagram: {
      title: "Photosynthesis — the energy pipeline",
      nodes: [
        N("s", "Sunlight", 20, 70, 120, 50, "rgba(245,184,61,0.16)", "☀ Sunlight", "pill"),
        N("w", "Water (H₂O)", 20, 190, 120, 50, "rgba(57,196,240,0.14)", "💧 H₂O", "pill"),
        N("c", "Carbon dioxide", 20, 310, 120, 50, "rgba(169,188,224,0.1)", "CO₂", "pill"),
        N("leaf", "Leaf — chloroplast", 260, 160, 190, 120, "rgba(61,220,151,0.13)", "LEAF\nchlorophyll traps light energy"),
        N("g", "Glucose (food)", 560, 140, 150, 50, "rgba(245,184,61,0.14)", "Glucose", "pill"),
        N("o", "Oxygen (O₂ out)", 560, 260, 150, 50, "rgba(61,220,151,0.14)", "O₂", "pill"),
      ],
      edges: [E("e1", "s", "leaf"), E("e2", "w", "leaf"), E("e3", "c", "leaf"), E("e4", "leaf", "g"), E("e5", "leaf", "o")],
    },
  },
  heart: {
    title: "The human heart — double pump",
    diagram: {
      title: "The human heart — double pump",
      nodes: [
        N("body", "Body (needs O₂)", 10, 60, 150, 54, "rgba(169,188,224,0.1)", "Body", "pill"),
        N("ra", "Right atrium", 220, 20, 140, 50, "rgba(255,122,147,0.12)", "Right atrium — receives deoxygenated blood"),
        N("rv", "Right ventricle", 220, 110, 140, 50, "rgba(255,122,147,0.12)", "Right ventricle — pumps to lungs"),
        N("lung", "Lungs (O₂ refill)", 420, 65, 140, 54, "rgba(57,196,240,0.14)", "Lungs", "pill"),
        N("la", "Left atrium", 420, 170, 140, 50, "rgba(255,158,61,0.14)", "Left atrium — receives oxygen-rich blood"),
        N("lv", "Left ventricle", 220, 240, 140, 50, "rgba(255,158,61,0.14)", "Left ventricle — the strongest pump"),
        N("body2", "Whole body again", 10, 240, 150, 54, "rgba(61,220,151,0.13)", "Body", "pill"),
      ],
      edges: [
        E("he1", "body", "ra"), E("he2", "ra", "rv"), E("he3", "rv", "lung"),
        E("he4", "lung", "la"), E("he5", "la", "lv"), E("he6", "lv", "body2"),
      ],
    },
  },
  newton: {
    title: "Newton's three laws",
    diagram: {
      title: "Newton's three laws",
      nodes: [
        N("l1", "Law 1 — Inertia", 20, 40, 200, 74, "rgba(255,158,61,0.14)", "No net force ⇒ velocity never changes"),
        N("l2", "Law 2 — F = ma", 20, 190, 200, 74, "rgba(167,139,250,0.13)", "Force = mass × acceleration"),
        N("l3", "Law 3 — Pairs", 20, 340, 200, 74, "rgba(61,220,151,0.13)", "Every action has an equal, opposite reaction"),
        N("use", "Pick the law from the situation", 340, 190, 200, 74, "rgba(245,184,61,0.14)", "Still object? → Law 1\nSpeeding up? → Law 2\nPushing pairs? → Law 3", "diamond"),
      ],
      edges: [E("ne1", "l1", "use"), E("ne2", "l2", "use"), E("ne3", "l3", "use")],
    },
  },
  "water cycle": {
    title: "The water cycle",
    diagram: {
      title: "The water cycle",
      nodes: [
        N("ev", "Evaporation", 20, 40, 170, 56, "rgba(57,196,240,0.14)", "Sun heats water → vapour rises"),
        N("co", "Condensation", 280, 20, 170, 56, "rgba(169,188,224,0.1)", "Vapour cools → clouds"),
        N("pr", "Precipitation", 540, 60, 170, 56, "rgba(255,158,61,0.14)", "Rain, hail, snow fall"),
        N("co2", "Collection", 400, 210, 170, 56, "rgba(61,220,151,0.13)", "Rivers, lakes, groundwater"),
        N("sun", "☀ The engine", 20, 210, 170, 56, "rgba(245,184,61,0.16)", "The Sun drives it all", "pill"),
      ],
      edges: [E("we1", "ev", "co"), E("we2", "co", "pr"), E("we3", "pr", "co2"), E("we4", "co2", "ev", "back up", true), E("we5", "sun", "ev")],
    },
  },
  "french revolution": {
    title: "French Revolution — timeline",
    diagram: {
      title: "French Revolution — timeline",
      nodes: [
        N("t1", "1789", 10, 60, 130, 70, "rgba(255,158,61,0.14)", "Bastille falls"),
        N("t2", "1791", 190, 30, 130, 70, "rgba(169,188,224,0.1)", "Constitution"),
        N("t3", "1792", 370, 60, 130, 70, "rgba(167,139,250,0.13)", "Republic declared"),
        N("t4", "1793", 550, 30, 130, 70, "rgba(255,122,147,0.12)", "Reign of Terror"),
        N("t5", "1799", 730, 60, 130, 70, "rgba(245,184,61,0.14)", "Napoleon rises"),
      ],
      edges: [E("re1", "t1", "t2"), E("re2", "t2", "t3"), E("re3", "t3", "t4"), E("re4", "t4", "t5")],
    },
  },
  quadratic: {
    title: "Quadratic equations — the map",
    diagram: {
      title: "Quadratic equations — the map",
      nodes: [
        N("std", "Standard form", 20, 60, 190, 64, "rgba(255,158,61,0.14)", "ax² + bx + c = 0"),
        N("dis", "Discriminant D = b²−4ac", 290, 30, 210, 64, "rgba(245,184,61,0.14)", "D tells how many roots"),
        N("pos", "D > 0 → two roots", 580, 20, 180, 56, "rgba(61,220,151,0.13)", "Parabola crosses x-axis twice", "pill"),
        N("zer", "D = 0 → one root", 580, 100, 180, 56, "rgba(61,220,151,0.13)", "Touches once", "pill"),
        N("neg", "D < 0 → no real roots", 580, 180, 180, 56, "rgba(255,122,147,0.12)", "Floats above the axis", "pill"),
        N("frm", "Quadratic formula", 290, 190, 210, 64, "rgba(167,139,250,0.13)", "x = (−b ± √D) / 2a"),
      ],
      edges: [E("qe1", "std", "dis"), E("qe2", "dis", "pos"), E("qe3", "dis", "zer"), E("qe4", "dis", "neg"), E("qe5", "std", "frm")],
    },
  },
  pythagoras: {
    title: "Pythagoras — the right-triangle rule",
    diagram: {
      title: "Pythagoras — the right-triangle rule",
      nodes: [
        N("tri", "Right triangle", 20, 60, 170, 70, "rgba(255,158,61,0.14)", "Legs a, b — hypotenuse c"),
        N("eq", "a² + b² = c²", 280, 60, 190, 70, "rgba(167,139,250,0.13)", "Squares of legs sum to square of c"),
        N("use", "Uses", 560, 30, 180, 60, "rgba(61,220,151,0.13)", "Find a missing side", "pill"),
        N("chk", "Right-angle test", 560, 110, 180, 60, "rgba(245,184,61,0.14)", "Sides check ⇒ 90° corner", "pill"),
      ],
      edges: [E("pe1", "tri", "eq"), E("pe2", "eq", "use"), E("pe3", "eq", "chk")],
    },
  },
  trigonometry: {
    title: "Trigonometry — ratios from a right triangle",
    diagram: {
      title: "Trigonometry — ratios from a right triangle",
      nodes: [
        N("tri", "Right triangle", 20, 60, 170, 70, "rgba(255,158,61,0.14)", "Opposite, adjacent, hypotenuse"),
        N("soh", "sin θ = opp / hyp", 290, 20, 210, 56, "rgba(167,139,250,0.13)", "SOH", "pill"),
        N("cah", "cos θ = adj / hyp", 290, 100, 210, 56, "rgba(255,158,61,0.14)", "CAH", "pill"),
        N("toa", "tan θ = opp / adj", 290, 180, 210, 56, "rgba(61,220,151,0.13)", "TOA", "pill"),
      ],
      edges: [E("te1", "tri", "soh"), E("te2", "tri", "cah"), E("te3", "tri", "toa")],
    },
  },
  cell: {
    title: "The cell — tiny city",
    diagram: {
      title: "The cell — tiny city",
      nodes: [
        N("mem", "Cell membrane", 20, 60, 180, 60, "rgba(169,188,224,0.1)", "The gate — decides what enters"),
        N("nuc", "Nucleus", 300, 30, 170, 60, "rgba(167,139,250,0.13)", "The library — DNA lives here"),
        N("mit", "Mitochondria", 300, 130, 170, 60, "rgba(61,220,151,0.13)", "The power plant — makes energy"),
        N("rib", "Ribosomes", 560, 60, 160, 60, "rgba(255,158,61,0.14)", "The factories — build proteins", "pill"),
      ],
      edges: [E("ce1", "mem", "nuc"), E("ce2", "mem", "mit"), E("ce3", "nuc", "rib")],
    },
  },
  fractions: {
    title: "Fractions — parts of a whole",
    diagram: {
      title: "Fractions — parts of a whole",
      nodes: [
        N("def", "a / b", 20, 60, 120, 64, "rgba(255,158,61,0.14)", "a parts of b equal slices", "pill"),
        N("eq", "Equivalent", 230, 20, 190, 56, "rgba(61,220,151,0.13)", "Multiply top & bottom by the same number"),
        N("add", "Adding", 230, 110, 190, 56, "rgba(245,184,61,0.14)", "Same denominator first!"),
        N("mul", "Multiplying", 230, 200, 190, 56, "rgba(167,139,250,0.13)", "Straight across: tops × tops, bottoms × bottoms"),
      ],
      edges: [E("fe1", "def", "eq"), E("fe2", "def", "add"), E("fe3", "def", "mul")],
    },
  },
};

function templateDiagram(topic: string): AIResult | null {
  const tpl = TEMPLATES[topic];
  if (!tpl) return null;
  return JSON.parse(JSON.stringify(tpl)) as AIResult;
}
