"use client";

/* ============================================================
   LESSON MODE — board action interpreter
   Deterministic mapping: BoardAction → canvas objects + timing.
   Also owns the hand-writing ink animation (objects are created
   with ink:0 and patched to ink:1 while the renderer reveals
   them progressively) and animated camera moves.
   ============================================================ */

import type {
  CanvasObject,
  ObjectInput,
  StrokeObj,
} from "../types";
import type { BoardAction, SketchStroke, TextStyle } from "./types";
import { useStudio } from "../store";

/* ---------------- style table ---------------- */

const STYLE: Record<TextStyle, { size: number; color: string }> = {
  heading: { size: 34, color: "#F5EFE3" },
  sub: { size: 24, color: "#EAE2D2" },
  term: { size: 21, color: "#FFC96B" },
  body: { size: 19, color: "#DCE6F5" },
  note: { size: 16, color: "#93A9CE" },
};

const MARKER = "rgba(255,196,0,0.32)";
const CHALK = "#F0E9DD";
const AMBER = "#FFB84D";

/* deterministic pseudo-random — stable jitter, no re-render drift */
function jitter(seed: number, amp = 2): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return (x - Math.floor(x) - 0.5) * 2 * amp;
}

function textW(text: string, size: number): number {
  const lines = text.split("\n");
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return Math.min(1480, Math.max(60, Math.round(longest * size * 0.58) + 26));
}

function estH(text: string, size: number): number {
  const lines = text.split("\n").length;
  return Math.round(lines * size * 1.55) + 8;
}

export interface PreparedObject {
  input: ObjectInput & { ink?: number };
  drawMs: number;
}

export interface InterpreterResult {
  objects: PreparedObject[];
  camera: { x: number; y: number; z: number } | null;
  eraseIds: string[];
  checkpointName: string | null;
  quizObjId: string | null;
}

/* ---------------- target lookup ---------------- */

function objectText(o: CanvasObject): string {
  switch (o.kind) {
    case "text":
    case "sticky":
      return o.text;
    case "equation":
      return o.latex;
    case "ainote":
      return o.title;
    case "diagram":
      return o.title;
    case "quiz":
      return o.title;
    default:
      return "";
  }
}

function findTargets(target: string): CanvasObject[] {
  const b = useStudio.getState().boards[useStudio.getState().activeBoardId];
  if (!b) return [];
  const t = target.trim().toLowerCase();
  if (!t) return [];
  const exact = Object.values(b.objects).filter((o) => objectText(o).toLowerCase() === t);
  if (exact.length) return exact;
  return Object.values(b.objects).filter((o) => objectText(o).toLowerCase().includes(t));
}

function bboxOf(o: CanvasObject): { x: number; y: number; w: number; h: number } {
  return { x: o.x, y: o.y, w: Math.max(o.w, 40), h: Math.max(o.h, 24) };
}

/* stroke builders for emphasis marks */

function ellipsePoints(w: number, h: number, pad = 14): [number, number][] {
  const pts: [number, number][] = [];
  const rx = w / 2 + pad;
  const ry = h / 2 + pad * 0.75;
  const steps = 22;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2 - Math.PI / 2 + jitter(i, 0.04);
    pts.push([rx + Math.cos(a) * rx, ry + Math.sin(a) * ry]);
  }
  return pts;
}

function boxPoints(w: number, h: number, pad = 12): [number, number][] {
  return [
    [-pad + jitter(1), -pad + jitter(2)],
    [w + pad + jitter(3), -pad + jitter(4)],
    [w + pad + jitter(5), h + pad + jitter(6)],
    [-pad + jitter(7), h + pad + jitter(8)],
    [-pad + jitter(9), -pad + jitter(10)],
  ];
}

function linePoints(w: number, y: number): [number, number][] {
  return [[-6 + jitter(1), y + jitter(2)], [w + 10 + jitter(3), y + jitter(4)]];
}

function strokeInput(origin: { x: number; y: number }, pts: [number, number][], o: Partial<StrokeObj> = {}): ObjectInput {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return {
    kind: "stroke",
    x: origin.x + Math.min(...xs),
    y: origin.y + Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs),
    h: Math.max(...ys) - Math.min(...ys),
    points: pts,
    color: o.color ?? CHALK,
    size: o.size ?? 3,
    opacity: o.opacity ?? 1,
    highlighter: o.highlighter ?? false,
  } as ObjectInput;
}

function addJitter(pts: [number, number][], amp = 2): [number, number][] {
  return pts.map((p, i) => [Math.round(p[0] + jitter(i + 1, amp)), Math.round(p[1] + jitter(i + 2, amp))]);
}

/* ---------------- main interpreter ---------------- */

export function interpret(action: BoardAction): InterpreterResult {
  const out: InterpreterResult = { objects: [], camera: null, eraseIds: [], checkpointName: null, quizObjId: null };
  const st = useStudio.getState();

  switch (action.a) {
    case "write": {
      const text = (action.text ?? "").slice(0, 220);
      if (!text) break;
      const style = STYLE[action.style ?? "body"];
      const size = style.size;
      const lines = text.split("\n").length;
      const input: ObjectInput = {
        kind: "text",
        x: Math.max(10, Math.round(action.x ?? 80)),
        y: Math.max(10, Math.round(action.y ?? 80)),
        w: textW(text, size),
        h: estH(text, size),
        text,
        color: style.color,
        size,
      } as ObjectInput;
      const ms = Math.min(2600, Math.max(500, text.length * 34 + lines * 160));
      out.objects.push({ input: { ...input, ink: 0 }, drawMs: ms });
      break;
    }

    case "equation": {
      const latex = (action.latex ?? "").slice(0, 400);
      if (!latex) break;
      const scale = action.scale ?? 1;
      const w = Math.min(1200, Math.round(latex.length * 15 * scale) + 60);
      const input: ObjectInput = {
        kind: "equation",
        x: Math.max(10, Math.round(action.x ?? 80)),
        y: Math.max(10, Math.round(action.y ?? 80)),
        w,
        h: Math.round(64 * scale),
        latex,
        scale,
      } as ObjectInput;
      out.objects.push({ input: { ...input, ink: 0 }, drawMs: Math.min(1600, 420 + latex.length * 12) });
      break;
    }

    case "sketch": {
      const ox = Math.max(10, Math.round(action.x ?? 80));
      const oy = Math.max(10, Math.round(action.y ?? 80));
      const strokes = (action.strokes ?? []).slice(0, 24);
      for (const s of strokes) {
        const pts = addJitter(s.pts, 2.2);
        const minX = Math.min(...pts.map((p) => p[0]));
        const minY = Math.min(...pts.map((p) => p[1]));
        const input: ObjectInput = {
          kind: "stroke",
          x: ox + minX,
          y: oy + minY,
          w: Math.max(...pts.map((p) => p[0])) - minX,
          h: Math.max(...pts.map((p) => p[1])) - minY,
          points: pts.map((p) => [p[0] - minX, p[1] - minY]) as [number, number][],
          color: s.color ?? CHALK,
          size: s.width ?? 3,
          opacity: 1,
          highlighter: false,
        } as ObjectInput;
        const ms = Math.min(2200, Math.max(260, pts.length * 14));
        out.objects.push({ input: { ...input, ink: 0 }, drawMs: ms });
      }
      for (const l of (action.labels ?? []).slice(0, 12)) {
        const size = 17;
        out.objects.push({
          input: {
            kind: "text",
            x: ox + Math.round(l.x),
            y: oy + Math.round(l.y),
            w: textW(l.text, size),
            h: estH(l.text, size),
            text: l.text,
            color: AMBER,
            size,
            ink: 0,
          } as ObjectInput,
          drawMs: Math.min(900, 260 + l.text.length * 22),
        });
      }
      break;
    }

    case "diagram": {
      if (!action.nodes || action.nodes.length < 2) break;
      const w = Math.round(action.w ?? 560);
      const h = Math.round(action.h ?? 360);
      const input: ObjectInput = {
        kind: "diagram",
        x: Math.max(10, Math.round(action.x ?? 80)),
        y: Math.max(10, Math.round(action.y ?? 80)),
        w,
        h,
        title: (action.title ?? "Diagram").slice(0, 140),
        nodes: action.nodes.map((n) => ({
          id: n.id,
          label: n.label,
          text: n.text ?? n.label,
          x: Math.round(n.x),
          y: Math.round(n.y),
          w: Math.round(n.w),
          h: Math.round(n.h),
          shape: n.shape ?? "rounded",
          fill: n.fill ?? "rgba(77,141,255,0.14)",
        })),
        edges: (action.edges ?? []).map((e, i) => ({ id: `e${i}`, from: e.from, to: e.to, label: e.label, dashed: e.dashed })),
      } as ObjectInput;
      out.objects.push({ input: { ...input, ink: 0 }, drawMs: 500 + action.nodes.length * 260 });
      break;
    }

    case "emphasize": {
      const targets = findTargets(action.target ?? "");
      const t = targets[0];
      if (!t) break;
      const bb = bboxOf(t);
      const mode = action.mode ?? "highlight";
      if (mode === "highlight") {
        out.objects.push({
          input: {
            ...strokeInput({ x: bb.x, y: bb.y }, linePoints(bb.w, bb.h * 0.52), {
              color: MARKER,
              size: Math.max(18, bb.h * 0.66),
              opacity: 1,
              highlighter: true,
            }),
            ink: 0,
          } as ObjectInput,
          drawMs: 620,
        });
      } else if (mode === "underline") {
        out.objects.push({
          input: { ...strokeInput({ x: bb.x, y: bb.y }, addJitter(linePoints(bb.w, bb.h + 4), 1.5), { color: AMBER, size: 3.4 }), ink: 0 } as ObjectInput,
          drawMs: 460,
        });
      } else if (mode === "circle") {
        out.objects.push({
          input: { ...strokeInput({ x: bb.x, y: bb.y }, ellipsePoints(bb.w, bb.h), { color: AMBER, size: 3 }), ink: 0 } as ObjectInput,
          drawMs: 950,
        });
      } else {
        out.objects.push({
          input: { ...strokeInput({ x: bb.x, y: bb.y }, boxPoints(bb.w, bb.h), { color: AMBER, size: 3 }), ink: 0 } as ObjectInput,
          drawMs: 950,
        });
      }
      break;
    }

    case "arrow": {
      /* hand-drawn arrow: shaft + two head strokes (gets ink animation
         and the teacher's hand feel, unlike the rigid vector arrow) */
      const from = action.from ?? [0, 0];
      const to = action.to ?? [100, 0];
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const len = Math.max(1, Math.hypot(dx, dy));
      const ux = dx / len;
      const uy = dy / len;
      const hx = -uy;
      const hy = ux;
      const head = Math.min(22, 8 + len * 0.08);
      const shaft: [number, number][] = [
        [from[0] + jitter(1, 1.5), from[1] + jitter(2, 1.5)],
        [to[0] - ux * head + jitter(3, 1.5), to[1] - uy * head + jitter(4, 1.5)],
      ];
      const head1: [number, number][] = [
        [to[0] - ux * head - hx * head * 0.5, to[1] - uy * head - hy * head * 0.5],
        [to[0], to[1]],
      ];
      const head2: [number, number][] = [
        [to[0] - ux * head + hx * head * 0.5, to[1] - uy * head + hy * head * 0.5],
        [to[0], to[1]],
      ];
      for (const pts of [shaft, head1, head2]) {
        const minX = Math.min(...pts.map((p) => p[0]));
        const minY = Math.min(...pts.map((p) => p[1]));
        out.objects.push({
          input: {
            kind: "stroke",
            x: minX,
            y: minY,
            w: Math.max(...pts.map((p) => p[0])) - minX,
            h: Math.max(...pts.map((p) => p[1])) - minY,
            points: pts.map((p) => [p[0] - minX, p[1] - minY]) as [number, number][],
            color: CHALK,
            size: 3,
            opacity: 1,
            highlighter: false,
            ink: 0,
          } as ObjectInput,
          drawMs: 380,
        });
      }
      if (action.label) {
        const size = 16;
        const lx = (from[0] + to[0]) / 2 + hy * 14;
        const ly = (from[1] + to[1]) / 2 - hx * 14;
        out.objects.push({
          input: { kind: "text", x: lx, y: ly, w: textW(action.label, size), h: estH(action.label, size), text: action.label, color: AMBER, size, ink: 0 } as ObjectInput,
          drawMs: 520,
        });
      }
      break;
    }

    case "erase": {
      out.eraseIds = findTargets(action.target ?? "").map((o) => o.id);
      break;
    }

    case "camera": {
      out.camera = {
        x: Math.round(action.x ?? st.camera.x),
        y: Math.round(action.y ?? st.camera.y),
        z: action.z ? Math.min(1.5, Math.max(0.4, action.z)) : st.camera.z,
      };
      break;
    }

    case "checkpoint": {
      out.checkpointName = (action.text ?? action.title ?? "Checkpoint").slice(0, 60);
      break;
    }

    case "quiz": {
      const qs = (action.questions ?? []).slice(0, 5);
      if (!qs.length) break;
      const input: ObjectInput = {
        kind: "quiz",
        x: Math.max(10, Math.round(action.x ?? 420)),
        y: Math.max(10, Math.round(action.y ?? 320)),
        w: Math.round(action.w ?? 620),
        h: Math.round(action.h ?? 60 + qs.length * 96),
        title: (action.title ?? "Quick check").slice(0, 140),
        questions: qs.map((q) => ({ q: q.q, options: q.options, answer: q.answer, why: q.why })),
        picked: {},
      } as ObjectInput;
      out.objects.push({ input: { ...input, ink: 0 }, drawMs: 800 });
      break;
    }
  }

  return out;
}

/* ---------------- animation helpers ---------------- */

export function animateInk(
  objs: { id: string; drawMs: number; isStroke?: boolean }[],
  reduceMotion: boolean
): Promise<void> {
  if (reduceMotion) {
    for (const o of objs) useStudio.getState().patchObject(o.id, { ink: 1 } as never);
    return Promise.resolve();
  }
  const total = objs.reduce((m, o) => m + o.drawMs, 0);
  return new Promise((resolve) => {
    const t0 = performance.now();
    const tick = (t: number) => {
      const el = t - t0;
      let acc = 0;
      const st = useStudio.getState();
      for (const o of objs) {
        const local = Math.min(1, Math.max(0, (el - acc) / Math.max(1, o.drawMs)));
        const eased = local * local * (3 - 2 * local); // smoothstep
        st.patchObject(o.id, { ink: eased } as never);
        acc += o.drawMs;
      }
      if (el < total) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

export function animateCamera(target: { x: number; y: number; z: number }, reduceMotion: boolean): Promise<void> {
  const st = useStudio.getState();
  if (reduceMotion) {
    st.setCamera(target);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const from = { ...st.camera };
    const t0 = performance.now();
    const ms = 700;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const e = k * k * (3 - 2 * k);
      useStudio.getState().setCamera({
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        z: from.z + (target.z - from.z) * e,
      });
      if (k < 1) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });
}

/* board text snapshot for the respond API */
export function boardSnapshot(): string {
  const b = useStudio.getState().boards[useStudio.getState().activeBoardId];
  if (!b) return "";
  return Object.values(b.objects)
    .sort((a, c) => a.y - c.y || a.x - c.x)
    .map((o) => objectText(o))
    .filter(Boolean)
    .join(" | ")
    .slice(0, 1800);
}
