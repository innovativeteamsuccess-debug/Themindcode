"use client";

/* Editable diagram: HTML nodes + an SVG edge layer underneath.
   Nodes drag (gesture handled by Canvas via [data-node-id]);
   double-click edits a label. Edges re-route live. */

import { useState } from "react";
import { motion } from "framer-motion";
import type { CanvasObject, DiagramEdge, DiagramNode, DiagramObj , ObjectPatch} from "../types";
import { useStudio } from "../store";

function edgeGeometry(a: DiagramNode, b: DiagramNode) {
  const acx = a.x + a.w / 2;
  const acy = a.y + a.h / 2;
  const bcx = b.x + b.w / 2;
  const bcy = b.y + b.h / 2;
  const dx = bcx - acx;
  const dy = bcy - acy;
  // trim to the border of each node along the centre line (approx)
  const trim = (n: DiagramNode, towardX: number, towardY: number) => {
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const ex = towardX - cx;
    const ey = towardY - cy;
    if (ex === 0 && ey === 0) return { x: cx, y: cy };
    const tx = ex !== 0 ? (n.w / 2 + 4) / Math.abs(ex) : Infinity;
    const ty = ey !== 0 ? (n.h / 2 + 4) / Math.abs(ey) : Infinity;
    const t = Math.min(tx, ty);
    return { x: cx + ex * t, y: cy + ey * t };
  };
  const start = trim(a, bcx, bcy);
  const end = trim(b, acx, acy);
  // gentle curve
  const mx = (start.x + end.x) / 2 + dy * 0.08;
  const my = (start.y + end.y) / 2 - dx * 0.08;
  return { start, end, mid: { x: mx, y: my } };
}

export function DiagramView({ obj }: { obj: DiagramObj }) {
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const reduce = useStudio((s) => s.settings.reduceMotion);
  const byId = new Map(obj.nodes.map((n) => [n.id, n]));
  const plotNode = obj.poly ? byId.get("plot") : undefined;
  const curve = plotNode && obj.poly ? buildCurve(plotNode, obj.poly) : null;

  return (
    <div className="st-obj-bare relative h-full w-full">
      <svg className="absolute inset-0 overflow-visible" width={obj.w} height={obj.h} aria-hidden>
        {/* real curve plot (math diagrams) */}
        {plotNode && curve && (
          <g>
            {curve.axes}
            <motion.path
              initial={reduce ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduce ? 0 : 0.9, ease: "easeOut" }}
              d={curve.d}
              fill="none"
              stroke="#7FB0FF"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </g>
        )}
        {obj.edges.map((e: DiagramEdge, i) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const { start, end, mid } = edgeGeometry(a, b);
          return (
            <g key={e.id}>
              <motion.path
                initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.15 + i * 0.12 }}
                d={`M ${start.x} ${start.y} Q ${mid.x} ${mid.y} ${end.x} ${end.y}`}
                fill="none"
                stroke="rgba(255,171,98,0.42)"
                strokeWidth="1.6"
                strokeDasharray={e.dashed ? "5 6" : undefined}
              />
              <motion.circle
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: reduce ? 0 : 0.5 + i * 0.12 }}
                cx={end.x}
                cy={end.y}
                r="3.2"
                fill="#7FA8FF"
              />
              {e.label && (
                <text x={mid.x} y={mid.y - 6} textAnchor="middle" fontSize="10.5" fill="rgba(169,188,224,0.75)" fontFamily="var(--font-body-sans)">
                  {e.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {obj.nodes.map((n, i) => {
        const radius =
          n.shape === "pill" ? 999 : n.shape === "ellipse" ? "50%" : n.shape === "rect" ? 6 : n.shape === "diamond" ? 4 : 12;
        const diamond = n.shape === "diamond";
        return (
          <motion.div
            key={n.id}
            data-node-id={n.id}
            className="st-diagram-node st-ui"
            initial={reduce ? false : { opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: reduce ? 0 : i * 0.07 }}
            style={{
              left: n.x,
              top: n.y,
              width: n.w,
              height: n.h,
              background: n.fill,
              borderRadius: radius,
              border: "1px solid rgba(255,171,98,0.3)",
              color: "#F4EFE9",
              fontSize: Math.max(10, Math.min(13, n.w / 12)),
              padding: "6px 10px",
              clipPath: diamond ? "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)" : undefined,
              whiteSpace: "pre-line",
              cursor: "grab",
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setEditingNode(n.id);
            }}
          >
            {editingNode === n.id ? (
              <textarea
                className="st-textarea st-ui text-center"
                style={{ fontSize: Math.max(10, Math.min(13, n.w / 12)), color: "inherit" }}
                defaultValue={n.text}
                autoFocus
                onBlur={(e) => {
                  const text = e.target.value;
                  useStudio.getState().patchObject(obj.id, {
                    nodes: obj.nodes.map((nn) => (nn.id === n.id ? { ...nn, text } : nn)),
                  } as ObjectPatch);
                  useStudio.getState().persistNow();
                  setEditingNode(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => e.stopPropagation()}
              />
            ) : (
              <span>{n.text || n.label}</span>
            )}
          </motion.div>
        );
      })}

      <div className="pointer-events-none absolute -top-6 left-1 font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.22em] text-[var(--st-faint)]">
        {obj.title}
      </div>
    </div>
  );
}

/** Sample a real polynomial curve into a node's local box + axes. */
function buildCurve(node: DiagramNode, poly: { a: number; b: number; c: number }) {
  const PAD = 22;
  const W = node.w;
  const H = node.h;
  const N = 56;
  const span = 8;
  const cxW = -poly.b / (2 * poly.a || 1);
  const xMin = cxW - span;
  const xMax = cxW + span;
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) {
    const x = xMin + ((xMax - xMin) * i) / N;
    ys.push(poly.a * x * x + poly.b * x + poly.c);
  }
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const px = (x: number) => PAD + ((x - xMin) / (xMax - xMin)) * (W - PAD * 2);
  const py = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - PAD * 2);
  let d = "";
  for (let i = 0; i <= N; i++) {
    const x = xMin + ((xMax - xMin) * i) / N;
    const y = poly.a * x * x + poly.b * x + poly.c;
    d += `${i === 0 ? "M" : "L"} ${node.x + px(x)} ${node.y + py(y)} `;
  }
  const zeroY = node.y + py(0);
  const axes = (
    <g opacity={0.5}>
      <line x1={node.x + PAD} y1={zeroY} x2={node.x + W - PAD} y2={zeroY} stroke="rgba(255,171,98,0.36)" strokeWidth="1" />
      <line x1={node.x + W / 2} y1={node.y + PAD} x2={node.x + W / 2} y2={node.y + H - PAD} stroke="rgba(255,171,98,0.24)" strokeWidth="1" strokeDasharray="3 5" />
    </g>
  );
  return { d, axes };
}
