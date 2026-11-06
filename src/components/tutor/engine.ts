/* ============================================================
   CODE TUTOR — board engine
   Deterministically interprets BoardActions into committed
   elements. Owns: timing/cadence, undo/redo, scene snapshots,
   camera. No React inside — the renderer subscribes.
   ============================================================ */

import {
  BoardAction, El, BoardSnapshot, Scene, Pt, Shape, TextStyle, WriteAction,
} from "./types";

export const BOARD_W = 1600;
export const BOARD_H = 900;

const STYLE_SIZE: Record<TextStyle, number> = {
  heading: 34, sub: 24, body: 18, formula: 23, note: 15, label: 14,
};

export function uid(prefix = "e"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/* approximate hand-font width factor for wrapping */
function charW(size: number) { return size * 0.52; }

export function wrapText(text: string, size: number, maxW: number): string[] {
  if (!maxW || maxW >= BOARD_W) maxW = BOARD_W - 120;
  const max = Math.max(10, Math.floor(maxW / charW(size)));
  const out: string[] = [];
  for (const para of text.split("\n")) {
    if (para.length <= max) { out.push(para); continue; }
    let line = "";
    for (const word of para.split(/\s+/)) {
      if ((line + " " + word).trim().length > max) {
        if (line) out.push(line.trim());
        line = word;
      } else line = (line + " " + word).trim();
    }
    if (line) out.push(line);
  }
  return out.length ? out : [""];
}

export function textHeight(el: Extract<El, { kind: "text" }>): number {
  return el.lines.length * el.size * 1.38 + 10;
}

export function elBBox(el: El): { x: number; y: number; w: number; h: number } {
  switch (el.kind) {
    case "text": {
      const w = Math.max(...el.lines.map((l) => l.length), 4) * charW(el.size);
      return { x: el.x, y: el.y, w, h: textHeight(el) };
    }
    case "diagram": return { x: el.x, y: el.y, w: 560, h: 360 };
    case "solve": return { x: el.x, y: el.y, w: el.w || 520, h: 90 + (el.given.length + el.lines.length) * 30 };
    case "panel": return { x: el.x, y: el.y, w: el.w || 480, h: 74 + el.items.length * 26 };
    case "arrow": {
      const x = Math.min(el.from.x, el.to.x), y = Math.min(el.from.y, el.to.y);
      return { x, y, w: Math.abs(el.to.x - el.from.x) + 8, h: Math.abs(el.to.y - el.from.y) + 8 };
    }
    case "highlight": return { x: el.x, y: el.y, w: el.w, h: el.h };
    case "stroke": {
      const xs = el.pts.map((p) => p.x), ys = el.pts.map((p) => p.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case "shape": {
      const x = Math.min(el.from.x, el.to.x), y = Math.min(el.from.y, el.to.y);
      return { x, y, w: Math.abs(el.to.x - el.from.x), h: Math.abs(el.to.y - el.from.y) };
    }
  }
}

export type EngineEvents = {
  onElements: (els: El[]) => void;              // full replacement
  onCamera: (cam: { x: number; y: number; zoom: number }) => void;
  onStatus: (st: EngineStatus) => void;
  onSceneMark: (title: string) => void;
};

export type EngineStatus = {
  playing: boolean;
  currentLabel: string | null;   // e.g. "writing", "drawing", "waiting"
};

export class BoardEngine {
  elements: El[] = [];
  camera = { x: 0, y: 0, zoom: 1 };
  scenes: Scene[] = [];
  private undoStack: El[][] = [];
  private redoStack: El[][] = [];
  private ev: EngineEvents;
  private runToken = 0;
  private nextId = 0;

  constructor(ev: EngineEvents) { this.ev = ev; }

  private commit(next: El[]) {
    this.undoStack.push(this.elements);
    if (this.undoStack.length > 120) this.undoStack.shift();
    this.redoStack = [];
    this.elements = next;
    this.ev.onElements(next);
  }
  private add(els: El[]) { this.commit([...this.elements, ...els]); }

  private status(playing: boolean, label: string | null = null) {
    this.ev.onStatus({ playing, currentLabel: label });
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }

  undo() {
    const prev = this.undoStack.pop();
    if (!prev) return;
    this.redoStack.push(this.elements);
    this.elements = prev;
    this.ev.onElements(prev);
  }
  redo() {
    const nxt = this.redoStack.pop();
    if (!nxt) return;
    this.undoStack.push(this.elements);
    this.elements = nxt;
    this.ev.onElements(nxt);
  }

  snapshot(): BoardSnapshot {
    return { elements: structuredClone(this.elements), camera: { ...this.camera } };
  }
  restore(s: BoardSnapshot) {
    this.commit(structuredClone(s.elements));
    this.camera = { ...s.camera };
    this.ev.onCamera(this.camera);
  }
  markScene(title: string) {
    this.scenes.push({ title, at: Date.now(), snapshot: this.snapshot() });
    if (this.scenes.length > 30) this.scenes.shift();
    this.ev.onSceneMark(title);
  }
  clearBoard(keepHistory = true) {
    if (keepHistory) this.commit([]);
    else { this.elements = []; this.ev.onElements([]); }
  }

  setCamera(c: { x?: number; y?: number; zoom?: number }) {
    this.camera = {
      x: c.x ?? this.camera.x,
      y: c.y ?? this.camera.y,
      zoom: Math.min(2.4, Math.max(0.5, c.zoom ?? this.camera.zoom)),
    };
    this.ev.onCamera(this.camera);
  }

  /* user free-draw */
  addStroke(pts: Pt[], color: string, width: number, tool: "pen" | "marker") {
    if (pts.length < 2) return;
    this.add([{ id: uid("s"), kind: "stroke", pts, color, width, tool }]);
  }
  addShape(tool: "rect" | "ellipse" | "line" | "arrow", from: Pt, to: Pt, color: string) {
    this.add([{ id: uid("sh"), kind: "shape", tool, from, to, color }]);
  }
  addFreeText(text: string, x: number, y: number) {
    const el = this.makeText({ a: "write", text, x, y, style: "body" }, "free");
    this.add([el]);
  }
  eraseAt(p: Pt, r = 18) {
    const keep = this.elements.filter((el) => {
      if (el.kind === "highlight") return false || true; // highlights erased only via undo
      const b = elBBox(el);
      const inside =
        p.x >= b.x - r && p.x <= b.x + b.w + r && p.y >= b.y - r && p.y <= b.y + b.h + r;
      return !(inside && (el.kind === "stroke" || el.kind === "shape"));
    });
    if (keep.length !== this.elements.length) this.commit(keep);
  }

  /* stop any running beat playback */
  stop() { this.runToken++; this.status(false); }

  /* ---------- the action interpreter ---------- */

  async playActions(actions: BoardAction[], beatId: string): Promise<void> {
    const token = ++this.runToken;
    const alive = () => token === this.runToken;
    this.status(true);

    for (const act of actions) {
      if (!alive()) return;
      switch (act.a) {
        case "clear": {
          this.status(true, "turning the page");
          this.clearBoard();
          await sleep(350); if (!alive()) return;
          break;
        }
        case "sceneMark": {
          this.markScene(act.title);
          break;
        }
        case "write": {
          this.status(true, "writing");
          const el = this.makeText(act, beatId);
          // progressive reveal: commit first line hidden, then reveal lines
          this.add([el]);
          await sleep(Math.min(1500, 240 + el.text.length * 22)); if (!alive()) return;
          break;
        }
        case "highlight": {
          this.status(true, "highlighting");
          const b = act.targetId
            ? (() => { const t = this.elements.find((e) => e.id === act.targetId); return t ? elBBox(t) : null; })()
            : null;
          const el: El = {
            id: act.id ?? uid("h"), kind: "highlight", beatId,
            x: b ? b.x - 8 : (act.x ?? 0), y: b ? b.y + 2 : (act.y ?? 0),
            w: b ? b.w + 16 : (act.w ?? 160), h: b ? b.h - 4 : (act.h ?? 34),
            color: act.color ?? "#ffd75e",
          };
          this.add([el]);
          await sleep(650); if (!alive()) return;
          break;
        }
        case "underline": {
          this.status(true, "underlining");
          const t = this.elements.find((e) => e.id === act.targetId);
          if (t) {
            const b = elBBox(t);
            const el: El = {
              id: act.id ?? uid("u"), kind: "arrow", beatId,
              from: { x: b.x, y: b.y + b.h - 4 }, to: { x: b.x + b.w, y: b.y + b.h - 2 },
              color: act.color ?? "#ff7a93",
            };
            this.add([el]);
          }
          await sleep(600); if (!alive()) return;
          break;
        }
        case "circle": {
          this.status(true, "circling");
          const t = this.elements.find((e) => e.id === act.targetId);
          if (t) {
            const b = elBBox(t);
            const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
            const el: El = {
              id: act.id ?? uid("c"), kind: "diagram", beatId,
              x: b.x, y: b.y,
              shapes: [{ kind: "ellipse", x: cx - b.w / 2 - 14, y: cy - b.h / 2 - 10, w: b.w + 28, h: b.h + 20, color: act.color ?? "#ffd75e" }],
            };
            this.add([el]);
          }
          await sleep(700); if (!alive()) return;
          break;
        }
        case "arrow": {
          this.status(true, "drawing");
          const el: El = {
            id: act.id ?? uid("a"), kind: "arrow", beatId,
            from: act.from, to: act.to, label: act.label,
            color: act.color ?? "#6fa8ff", curved: act.curved,
          };
          this.add([el]);
          await sleep(650); if (!alive()) return;
          break;
        }
        case "diagram": {
          this.status(true, "drawing");
          const el: El = {
            id: act.id ?? uid("d"), kind: "diagram", beatId,
            title: act.title, x: act.x, y: act.y,
            shapes: this.sanitizeShapes(act.shapes),
            caption: act.caption,
          };
          this.add([el]);
          await sleep(Math.min(2600, 500 + el.shapes.length * 260)); if (!alive()) return;
          break;
        }
        case "solve": {
          this.status(true, "solving");
          const el: El = {
            id: act.id ?? uid("v"), kind: "solve", beatId,
            title: act.title, given: act.given ?? [], lines: act.lines,
            x: act.x, y: act.y, w: act.w ?? 520,
          };
          this.add([el]);
          await sleep(Math.min(3200, 600 + (el.given.length + el.lines.length) * 420)); if (!alive()) return;
          break;
        }
        case "panel": {
          this.status(true, "writing");
          const el: El = {
            id: act.id ?? uid("p"), kind: "panel", beatId,
            panelKind: act.kind, title: act.title, items: act.items ?? [],
            x: act.x ?? 120, y: act.y ?? 160, w: act.w ?? 520,
          };
          this.add([el]);
          await sleep(900); if (!alive()) return;
          break;
        }
        case "camera": {
          this.setCamera({ x: act.x, y: act.y, zoom: act.zoom });
          await sleep(act.animate === false ? 0 : 450); if (!alive()) return;
          break;
        }
        case "wait": {
          this.status(true, null);
          await sleep(Math.min(4000, Math.max(200, act.ms))); if (!alive()) return;
          break;
        }
      }
    }
    if (alive()) this.status(false);
  }

  /* keep AI shapes inside the board and with sane numbers */
  private sanitizeShapes(shapes: Shape[]): Shape[] {
    const ok = (n: unknown, d = 0) => (typeof n === "number" && isFinite(n) ? n : d);
    return shapes.slice(0, 26).map((s) => {
      switch (s.kind) {
        case "line": case "arrow": case "ray":
          return { ...s, x1: ok(s.x1), y1: ok(s.y1), x2: ok(s.x2), y2: ok(s.y2), dashed: !!s.dashed };
        case "rect": case "ellipse":
          return { ...s, x: ok(s.x), y: ok(s.y), w: ok(s.w, 80), h: ok(s.h, 50), dashed: !!s.dashed };
        case "circle":
          return { ...s, x: ok(s.x), y: ok(s.y), r: ok(s.r, 40), dashed: !!s.dashed };
        case "polyline": case "curve":
          return { ...s, pts: (s.pts ?? []).slice(0, 40).map((p) => ({ x: ok(p.x), y: ok(p.y) })), dashed: !!s.dashed };
        case "arc":
          return { ...s, x: ok(s.x), y: ok(s.y), r: ok(s.r, 40), start: ok(s.start), end: ok(s.end) };
        case "mirror":
          return { ...s, x: ok(s.x), y: ok(s.y), aperture: ok(s.aperture, 160), orientation: s.orientation ?? "concave" };
        case "lens":
          return { ...s, x: ok(s.x), y: ok(s.y), h: ok(s.h, 160), w: ok(s.w, 34) };
        case "battery": case "bulb":
          return { ...s, x: ok(s.x), y: ok(s.y) };
        case "resistor":
          return { ...s, x: ok(s.x), y: ok(s.y), w: ok(s.w, 90) };
        case "axis":
          return { ...s, x: ok(s.x), y: ok(s.y), w: ok(s.w, 300), h: ok(s.h, 220) };
        case "label":
          return { ...s, x: ok(s.x), y: ok(s.y), text: String(s.text ?? ""), size: ok(s.size, 14) };
        default:
          return s;
      }
    });
  }

  private makeText(act: WriteAction, beatId: string): Extract<El, { kind: "text" }> {
    const style: TextStyle = act.style ?? "body";
    const size = STYLE_SIZE[style];
    const w = act.w ?? (style === "heading" ? 900 : 640);
    return {
      id: act.id ?? uid("t"), kind: "text", beatId,
      text: act.text, lines: wrapText(act.text, size, w),
      x: act.x, y: act.y, size, style,
      color: act.color ?? "#eef3fb",
      align: act.align ?? "left", w,
    };
  }

  /* compact summary for the AI: what is currently on the board */
  summary(): string {
    const items = this.elements.slice(-34).map((el) => {
      switch (el.kind) {
        case "text": return `${el.id} text(${el.style}): ${el.text.slice(0, 70)}`;
        case "diagram": return `${el.id} diagram: ${el.title ?? "untitled"} (${el.shapes.length} parts)`;
        case "solve": return `${el.id} solve: ${el.title}`;
        case "panel": return `${el.id} panel(${el.panelKind}): ${el.title}`;
        case "arrow": return `${el.id} arrow${el.label ? ` "${el.label}"` : ""}`;
        case "highlight": return `${el.id} highlight`;
        default: return `${el.id} ${el.kind}`;
      }
    });
    if (!items.length) return "(the board is empty)";
    return items.join("\n");
  }

  scenesList(): Scene[] { return this.scenes; }
}
