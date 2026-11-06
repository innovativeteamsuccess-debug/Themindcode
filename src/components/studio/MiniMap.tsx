"use client";

/* Board overview: object rectangles + viewport window.
   Click or drag to steer the camera. Desktop only. */

import { useRef } from "react";
import { useStudio } from "./store";
import { bboxOf } from "./lib/geometry";
import type { CanvasObject } from "./types";

const W = 188;
const H = 122;

export default function MiniMap({ objects }: { objects: Record<string, CanvasObject> }) {
  const enabled = useStudio((s) => s.settings.minimap);
  const camera = useStudio((s) => s.camera);
  const viewport = useStudio((s) => s.viewport);
  const dragging = useRef(false);

  if (!enabled) return null;

  // board bounds (union of objects), padded
  const list = Object.values(objects);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const o of list) {
    const b = bboxOf(o);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  if (x0 === Infinity) {
    x0 = -400; y0 = -300; x1 = 800; y1 = 600;
  }
  const pad = 260;
  const bx = x0 - pad;
  const by = y0 - pad;
  const bw = Math.max(x1 - x0 + pad * 2, 600);
  const bh = Math.max(y1 - y0 + pad * 2, 400);
  const s = Math.min(W / bw, H / bh);

  const toMini = (x: number, y: number) => ({ x: (x - bx) * s, y: (y - by) * s });

  const steer = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const wx = mx / s + bx;
    const wy = my / s + by;
    useStudio.getState().setCamera({
      x: viewport.w / 2 - wx * camera.z,
      y: viewport.h / 2 - wy * camera.z,
      z: camera.z,
    });
  };

  const viewTL = toMini(-camera.x / camera.z, -camera.y / camera.z);

  return (
    <div
      className="st-minimap absolute bottom-5 right-5 z-20 hidden md:block"
      style={{ width: W, height: H }}
      role="navigation"
      aria-label="Board minimap"
      onPointerDown={(e) => {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        dragging.current = true;
        steer(e);
      }}
      onPointerMove={(e) => dragging.current && steer(e)}
      onPointerUp={() => (dragging.current = false)}
    >
      <svg width={W} height={H} className="absolute inset-0">
        {list.slice(0, 400).map((o) => {
          const b = bboxOf(o);
          const p = toMini(b.x, b.y);
          const color =
            o.kind === "ainote" ? "#A78BFA" : o.kind === "diagram" ? "#39C4F0" : o.kind === "quiz" || o.kind === "flashcards" ? "#3DDC97" : o.kind === "stroke" ? "rgba(127,176,255,0.5)" : "#7FA8FF";
          return (
            <rect
              key={o.id}
              x={p.x}
              y={p.y}
              width={Math.max(2.5, b.w * s)}
              height={Math.max(2.5, b.h * s)}
              rx="1.5"
              fill={color}
              opacity={0.4}
            />
          );
        })}
        <rect
          x={viewTL.x}
          y={viewTL.y}
          width={Math.max(6, (viewport.w / camera.z) * s)}
          height={Math.max(6, (viewport.h / camera.z) * s)}
          fill="rgba(255,158,61,0.12)"
          stroke="#FF9E3D"
          strokeWidth="1.2"
          rx="2"
        />
      </svg>
    </div>
  );
}
