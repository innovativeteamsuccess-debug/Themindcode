/* ============================================================
   CODE STUDIO — geometry helpers
   Bounding boxes, hit-testing, viewport math, magnetic snapping.
   ============================================================ */

import type { CanvasObject, Guide, Vec2 } from "../types";

export function bboxOf(o: CanvasObject): { x: number; y: number; w: number; h: number } {
  if (o.kind === "stroke") {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of o.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    const pad = o.size + 2;
    return {
      x: o.x + minX - pad,
      y: o.y + minY - pad,
      w: Math.max(maxX - minX, 4) + pad * 2,
      h: Math.max(maxY - minY, 4) + pad * 2,
    };
  }
  if (o.kind === "arrow") {
    const x = Math.min(o.x, o.x + o.x2);
    const y = Math.min(o.y, o.y + o.y2);
    return { x, y, w: Math.abs(o.x2) + 8, h: Math.abs(o.y2) + 8 };
  }
  return { x: o.x, y: o.y, w: o.w, h: o.h };
}

export function rectsIntersect(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number }
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(p: Vec2, r: { x: number; y: number; w: number; h: number }): boolean {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

export function worldViewport(
  camera: { x: number; y: number; z: number },
  vw: number,
  vh: number
): { x: number; y: number; w: number; h: number } {
  return {
    x: -camera.x / camera.z,
    y: -camera.y / camera.z,
    w: vw / camera.z,
    h: vh / camera.z,
  };
}

export function screenToWorld(
  px: number,
  py: number,
  camera: { x: number; y: number; z: number }
): Vec2 {
  return { x: (px - camera.x) / camera.z, y: (py - camera.y) / camera.z };
}

/* ---------------- snapping ---------------- */

const EDGE_EPS = 1e-6;

export interface SnapResult {
  dx: number;
  dy: number;
  guides: Guide[];
}

/**
 * Magnetic alignment: try to align the moving rect's edges & centres with
 * other objects' edges & centres (and the world origin). Returns the snap
 * delta plus the guide lines to draw.
 */
export function computeSnap(
  moving: { x: number; y: number; w: number; h: number },
  others: { x: number; y: number; w: number; h: number }[],
  threshold: number,
  includeOrigin = true
): SnapResult {
  const mvXs = [moving.x, moving.x + moving.w / 2, moving.x + moving.w];
  const mvYs = [moving.y, moving.y + moving.h / 2, moving.y + moving.h];

  const candX: { at: number; delta: number; span: [number, number] }[] = [];
  const candY: { at: number; delta: number; span: [number, number] }[] = [];

  const targets = includeOrigin
    ? [{ x: 0, y: 0, w: 0, h: 0 }, ...others]
    : others;

  for (const t of targets) {
    const tXs = [t.x, t.x + t.w / 2, t.x + t.w];
    const tYs = [t.y, t.y + t.h / 2, t.y + t.h];
    for (const mv of mvXs) {
      for (const tv of tXs) {
        const delta = tv - mv;
        if (Math.abs(delta) <= threshold)
          candX.push({ at: tv, delta, span: [Math.min(t.y, moving.y), Math.max(t.y + t.h, moving.y + moving.h)] });
      }
    }
    for (const mv of mvYs) {
      for (const tv of tYs) {
        const delta = tv - mv;
        if (Math.abs(delta) <= threshold)
          candY.push({ at: tv, delta, span: [Math.min(t.x, moving.x), Math.max(t.x + t.w, moving.x + moving.w)] });
      }
    }
  }

  let dx = 0,
    dy = 0;
  const guides: Guide[] = [];
  if (candX.length) {
    const best = candX.reduce((p, c) => (Math.abs(c.delta) < Math.abs(p.delta) ? c : p));
    dx = best.delta;
    guides.push({ axis: "x", at: best.at, from: best.span[0] - 24, to: best.span[1] + 24 });
  }
  if (candY.length) {
    const best = candY.reduce((p, c) => (Math.abs(c.delta) < Math.abs(p.delta) ? c : p));
    dy = best.delta;
    guides.push({ axis: "y", at: best.at, from: best.span[0] - 24, to: best.span[1] + 24 });
  }
  void EDGE_EPS;
  return { dx, dy, guides };
}

/** Anchor point on an object's side — used to glue connectors. */
export function anchorOf(o: CanvasObject, side: "left" | "right" | "top" | "bottom"): Vec2 {
  const b = bboxOf(o);
  switch (side) {
    case "left":
      return { x: b.x, y: b.y + b.h / 2 };
    case "right":
      return { x: b.x + b.w, y: b.y + b.h / 2 };
    case "top":
      return { x: b.x + b.w / 2, y: b.y };
    default:
      return { x: b.x + b.w / 2, y: b.y + b.h };
  }
}

export function nearestSide(from: Vec2, target: { x: number; y: number; w: number; h: number }): "left" | "right" | "top" | "bottom" {
  const cx = target.x + target.w / 2;
  const cy = target.y + target.h / 2;
  const dx = from.x - cx;
  const dy = from.y - cy;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "bottom" : "top";
}

export function uid(): string {
  return `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
