"use client";

/* ============================================================
   CODE TUTOR — the whiteboard (SVG)
   Renders committed elements with chalk-ink motion: text
   writes itself left→right, diagrams draw stroke-by-stroke,
   highlights sweep like a real marker.
   ============================================================ */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { El, Shape } from "./types";
import { BOARD_H as BH, BOARD_W as BW } from "./engine";

const CHAR_W = 0.52; // hand-font width factor (matches engine)

function textW(el: Extract<El, { kind: "text" }>) {
  return Math.max(4, ...el.lines.map((l) => l.length)) * el.size * CHAR_W;
}
function textH(el: Extract<El, { kind: "text" }>) {
  return el.lines.length * el.size * 1.38 + 10;
}

/* deterministic jitter from id — same element always jitters the same */
function jitter(id: string, i: number, amt = 0.5) {
  let h = 0;
  for (let k = 0; k < id.length; k++) h = (h * 31 + id.charCodeAt(k)) | 0;
  return (((h >> (i * 3)) & 7) / 7 - 0.5) * 2 * amt;
}

/* ---------- shape → svg path ---------- */

function shapePath(s: Shape): { d: string; head?: { x: number; y: number; a: number }; label?: { x: number; y: number; t: string } } {
  switch (s.kind) {
    case "line": case "ray":
      return { d: `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`, label: s.label ? { x: s.lx ?? (s.x1 + s.x2) / 2, y: s.ly ?? (s.y1 + s.y2) / 2 - 8, t: s.label } : undefined };
    case "arrow": {
      const a = Math.atan2(s.y2 - s.y1, s.x2 - s.x1);
      return { d: `M ${s.x1} ${s.y1} L ${s.x2} ${s.y2}`, head: { x: s.x2, y: s.y2, a }, label: s.label ? { x: s.lx ?? (s.x1 + s.x2) / 2, y: s.ly ?? (s.y1 + s.y2) / 2 - 8, t: s.label } : undefined };
    }
    case "rect":
      return { d: `M ${s.x} ${s.y} h ${s.w} v ${s.h} h ${-s.w} Z`, label: s.label ? { x: s.x + s.w / 2, y: s.y + s.h / 2, t: s.label } : undefined };
    case "ellipse": {
      const cx = s.x + s.w / 2, cy = s.y + s.h / 2, rx = s.w / 2, ry = s.h / 2;
      return { d: `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`, label: s.label ? { x: cx, y: cy, t: s.label } : undefined };
    }
    case "circle": {
      const { x, y, r } = s;
      return { d: `M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y}`, label: s.label ? { x, y: y, t: s.label } : undefined };
    }
    case "polyline":
      return { d: `M ${s.pts.map((p) => `${p.x} ${p.y}`).join(" L ")}` + (s.closed ? " Z" : ""), label: s.label ? { x: s.pts[0]?.x ?? 0, y: (s.pts[0]?.y ?? 0) - 8, t: s.label } : undefined };
    case "curve": {
      const pts = s.pts;
      if (pts.length < 2) return { d: "" };
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
        d += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
      }
      d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
      return { d, label: s.label ? { x: pts[0].x, y: pts[0].y - 10, t: s.label } : undefined };
    }
    case "arc": {
      const rad = (deg: number) => (deg * Math.PI) / 180;
      const x1 = s.x + s.r * Math.cos(rad(s.start)), y1 = s.y - s.r * Math.sin(rad(s.start));
      const x2 = s.x + s.r * Math.cos(rad(s.end)), y2 = s.y - s.r * Math.sin(rad(s.end));
      const large = Math.abs(s.end - s.start) > 180 ? 1 : 0;
      const sweep = s.end > s.start ? 0 : 1; // svg y-down
      return { d: `M ${x1} ${y1} A ${s.r} ${s.r} 0 ${large} ${sweep} ${x2} ${y2}`, label: s.label ? { x: s.lx ?? s.x, y: s.ly ?? s.y, t: s.label } : undefined };
    }
    case "mirror": {
      const { x, y, aperture: ap, orientation } = s;
      const b = ap * 0.16;
      if (orientation === "plane") return { d: `M ${x} ${y - ap / 2} L ${x} ${y + ap / 2}` };
      if (orientation === "concave")
        return { d: `M ${x} ${y - ap / 2} A ${ap} ${ap} 0 0 1 ${x} ${y + ap / 2}`, label: s.label ? { x: x - 16, y: y - ap / 2 - 12, t: s.label } : undefined };
      return { d: `M ${x} ${y - ap / 2} A ${ap * 2.4} ${ap * 2.4} 0 0 0 ${x} ${y + ap / 2}`, label: s.label ? { x: x - 16, y: y - ap / 2 - 12, t: s.label } : undefined };
    }
    case "lens": {
      const { x, y, h, w = 34 } = s;
      const rx = Math.max(w, h * 0.16);
      return { d: `M ${x} ${y - h / 2} A ${rx} ${rx * 1.15} 0 0 1 ${x} ${y + h / 2} A ${rx} ${rx * 1.15} 0 0 1 ${x} ${y - h / 2}`, label: s.label ? { x: x - 12, y: y - h / 2 - 12, t: s.label } : undefined };
    }
    case "battery": {
      const { x, y } = s;
      return { d: `M ${x - 30} ${y} L ${x - 6} ${y} M ${x + 6} ${y} L ${x + 30} ${y} M ${x - 6} ${y - 16} L ${x - 6} ${y + 16} M ${x + 6} ${y - 8} L ${x + 6} ${y + 8}`, label: s.label ? { x: x + 6, y: y - 24, t: s.label } : undefined };
    }
    case "resistor": {
      const { x, y, w = 90 } = s;
      const seg = w / 6, h = 12;
      let d = `M ${x} ${y}`;
      for (let i = 0; i < 6; i++) d += ` L ${x + seg * i + seg / 2} ${y + (i % 2 === 0 ? -h : h)} L ${x + seg * (i + 1)} ${y}`;
      return { d, label: s.label ? { x: x + w / 2, y: y - 22, t: s.label } : undefined };
    }
    case "bulb": {
      const { x, y, r = 16 } = s;
      return {
        d: `M ${x - 30} ${y} L ${x - r} ${y} M ${x + r} ${y} L ${x + 30} ${y} M ${x - r} ${y} A ${r} ${r} 0 1 0 ${x + r} ${y} A ${r} ${r} 0 1 0 ${x - r} ${y} M ${x - r * 0.5} ${y - r * 0.5} L ${x + r * 0.5} ${y + r * 0.5} M ${x - r * 0.5} ${y + r * 0.5} L ${x + r * 0.5} ${y - r * 0.5}`,
        label: s.label ? { x: x, y: y - r - 14, t: s.label } : undefined,
      };
    }
    case "axis": {
      const { x, y, w, h, xlabel, ylabel } = s;
      return { d: `M ${x} ${y} L ${x + w} ${y} M ${x} ${y} L ${x} ${y - h}`, label: xlabel ? { x: x + w + 8, y: y + 4, t: xlabel } : undefined };
    }
    case "label":
      return { d: "" , label: { x: s.x, y: s.y, t: s.text } };
    default:
      return { d: "" };
  }
}

/* ---------- one committed element ---------- */

function ElementView({ el }: { el: El }) {
  if (el.kind === "text") {
    const w = textW(el), h = textH(el);
    const clipId = `clip-${el.id}`;
    const dur = Math.min(1.6, 0.28 + el.text.length * 0.022);
    return (
      <g>
        <clipPath id={clipId}>
          <motion.rect
            x={el.align === "center" ? el.x - w / 2 - 4 : el.x - 4}
            y={el.y - el.size}
            initial={{ width: 0 }}
            animate={{ width: w + 10 }}
            transition={{ duration: dur, ease: "linear" }}
            height={h + el.size}
          />
        </clipPath>
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          style={{ clipPath: `url(#${clipId})` }}
        >
          {el.style === "formula" && (
            <rect
              x={(el.align === "center" ? el.x - w / 2 : el.x) - 14}
              y={el.y - el.size - 2}
              width={w + 28}
              height={h - 6}
              rx={8}
              fill="rgba(111,168,255,0.08)"
              stroke="rgba(111,168,255,0.45)"
              strokeWidth={1.4}
            />
          )}
          <text
            className={`tb-text ${el.style}`}
            x={el.x}
            y={el.y}
            fontSize={el.size}
            fill={el.color}
            textAnchor={el.align === "center" ? "middle" : "start"}
          >
            {el.lines.map((ln, i) => (
              <tspan
                key={i}
                x={el.align === "center" ? el.x : el.x + jitter(el.id, i, 2)}
                dy={i === 0 ? 0 : el.size * 1.38}
                transform={`rotate(${jitter(el.id, i)} ${el.x} ${el.y + i * el.size * 1.38})`}
                style={el.style === "note" || el.style === "label" ? { opacity: 0.85 } : undefined}
              >
                {ln}
              </tspan>
            ))}
          </text>
        </motion.g>
      </g>
    );
  }

  if (el.kind === "highlight") {
    return (
      <motion.rect
        x={el.x} y={el.y} height={el.h} rx={7}
        initial={{ width: 0, opacity: 0.4 }}
        animate={{ width: el.w, opacity: 0.34 }}
        transition={{ width: { duration: 0.55, ease: "easeOut" }, opacity: { duration: 0.3 } }}
        fill={el.color}
        style={{ mixBlendMode: "screen" }}
      />
    );
  }

  if (el.kind === "arrow") {
    const { from, to, color, label } = el;
    const a = Math.atan2(to.y - from.y, to.x - from.x);
    const hx1 = to.x - 12 * Math.cos(a - 0.42), hy1 = to.y - 12 * Math.sin(a - 0.42);
    const hx2 = to.x - 12 * Math.cos(a + 0.42), hy2 = to.y - 12 * Math.sin(a + 0.42);
    const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
    const nx = -(to.y - from.y), ny = to.x - from.x;
    const nl = Math.hypot(nx, ny) || 1;
    const cpx = mx + (nx / nl) * (el.curved ? Math.min(90, Math.hypot(to.x - from.x, to.y - from.y) * 0.25) : 0);
    const cpy = my + (ny / nl) * (el.curved ? Math.min(90, Math.hypot(to.x - from.x, to.y - from.y) * 0.25) : 0);
    const d = el.curved ? `M ${from.x} ${from.y} Q ${cpx} ${cpy} ${to.x} ${to.y}` : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        <motion.path
          d={d}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        <motion.path
          d={`M ${hx1} ${hy1} L ${to.x} ${to.y} L ${hx2} ${hy2}`}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.15 }}
        />
        {label && (
          <motion.text className="tb-text" fontSize={15} fill={color} x={(cpx + mx) / 2} y={my - 10} textAnchor="middle"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
            {label}
          </motion.text>
        )}
      </motion.g>
    );
  }

  if (el.kind === "diagram") {
    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
        {el.shapes.map((s, i) => {
          const { d, head, label } = shapePath(s);
          const color = ("color" in s && s.color) || "rgba(238,243,251,0.92)";
          const delay = i * 0.22;
          return (
            <g key={i}>
              {d && (
                <motion.path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth={s.kind === "ray" ? 2 : 2.2}
                  strokeLinecap="round"
                  strokeDasharray={("dashed" in s && s.dashed) ? "7 7" : undefined}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ pathLength: { delay, duration: 0.55, ease: "easeInOut" }, opacity: { delay, duration: 0.15 } }}
                />
              )}
              {head && (
                <motion.path
                  d={`M ${head.x - 11 * Math.cos(head.a - 0.44)} ${head.y - 11 * Math.sin(head.a - 0.44)} L ${head.x} ${head.y} L ${head.x - 11 * Math.cos(head.a + 0.44)} ${head.y - 11 * Math.sin(head.a + 0.44)}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: delay + 0.45 }}
                />
              )}
              {label && (
                <motion.text className="tb-text" fontSize={15} fill={color} x={label.x} y={label.y} textAnchor="middle"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.95 }} transition={{ delay: delay + 0.4 }}>
                  {label.t}
                </motion.text>
              )}
              {s.kind === "rect" && s.fill && (
                <motion.rect x={s.x} y={s.y} width={s.w} height={s.h} rx={6} fill={s.fill}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }} />
              )}
              {s.kind === "circle" && s.fill && (
                <motion.circle cx={s.x} cy={s.y} r={s.r} fill={s.fill}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.3 }} />
              )}
            </g>
          );
        })}
        {el.caption && (
          <motion.text className="tb-text" fontSize={16} fill="rgba(238,243,251,0.6)" x={el.x} y={el.y - 14}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {el.caption}
          </motion.text>
        )}
      </motion.g>
    );
  }

  if (el.kind === "solve") {
    const w = el.w, lineH = 30;
    const h = 52 + el.given.length * 26 + el.lines.length * (lineH + 8) + 18;
    return (
      <motion.g initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <rect x={el.x} y={el.y} width={w} height={h} rx={14} fill="rgba(238,243,251,0.045)" stroke="rgba(148,176,220,0.25)" strokeWidth={1.3} />
        <text className="tb-text" x={el.x + 18} y={el.y + 34} fontSize={20} fill="#eef3fb">{el.title}</text>
        {el.given.map((g, i) => (
          <motion.text key={`g${i}`} className="tb-text" x={el.x + 22} y={el.y + 62 + i * 26} fontSize={16} fill="rgba(238,243,251,0.75)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 + i * 0.28 }}>
            {g}
          </motion.text>
        ))}
        {el.lines.map((ln, i) => {
          const y = el.y + 74 + el.given.length * 26 + i * (lineH + 8);
          return (
            <motion.g key={`l${i}`} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 + i * 0.42, duration: 0.25 }}>
              <text className="tb-text" x={el.x + 24} y={y} fontSize={ln.result ? 21 : 18} fill={ln.result ? "#ffd75e" : "#eef3fb"}>
                {ln.text}
              </text>
              {ln.note && <text className="tb-text" x={el.x + 24} y={y + 16} fontSize={12.5} fill="rgba(238,243,251,0.5)">{ln.note}</text>}
              {ln.result && (
                <rect x={el.x + 14} y={y - 21} width={Math.max(90, ln.text.length * 10.5)} height={30} rx={7}
                  fill="none" stroke="rgba(255,215,94,0.5)" strokeWidth={1.4} />
              )}
            </motion.g>
          );
        })}
      </motion.g>
    );
  }

  if (el.kind === "panel") {
    const w = el.w;
    const h = 64 + el.items.length * 28 + 16;
    const tint: Record<string, string> = {
      question: "rgba(255,215,94,0.5)", example: "rgba(111,168,255,0.5)",
      recap: "rgba(61,220,151,0.5)", checkpoint: "rgba(183,164,255,0.5)",
      mistake: "rgba(255,122,147,0.55)", objective: "rgba(169,188,224,0.5)",
    };
    return (
      <motion.g initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <rect x={el.x} y={el.y} width={w} height={h} rx={14} fill="rgba(238,243,251,0.04)" stroke="rgba(148,176,220,0.22)" strokeWidth={1.2} />
        <rect x={el.x} y={el.y} width={4.5} height={h} rx={2} fill={tint[el.panelKind] ?? tint.objective} />
        <text className="tb-text" x={el.x + 20} y={el.y + 34} fontSize={19} fill="#eef3fb">{el.title}</text>
        {el.items.map((it, i) => (
          <motion.text key={i} className="tb-text" x={el.x + 24} y={el.y + 64 + i * 28} fontSize={16} fill="rgba(238,243,251,0.82)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.24 }}>
            {it}
          </motion.text>
        ))}
      </motion.g>
    );
  }

  if (el.kind === "stroke") {
    const d = `M ${el.pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`;
    return (
      <motion.path
        d={d}
        fill="none"
        stroke={el.color}
        strokeWidth={el.tool === "marker" ? 12 : 2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={el.tool === "marker" ? 0.32 : 0.95}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: Math.min(0.8, 0.15 + el.pts.length * 0.012) }}
      />
    );
  }

  // shape (user-drawn rect/ellipse/line/arrow)
  const { from, to, color, tool } = el;
  let d = "";
  let head = "";
  if (tool === "line" || tool === "arrow") d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  if (tool === "rect") d = `M ${from.x} ${from.y} L ${to.x} ${from.y} L ${to.x} ${to.y} L ${from.x} ${to.y} Z`;
  if (tool === "ellipse") {
    const cx = (from.x + to.x) / 2, cy = (from.y + to.y) / 2;
    const rx = Math.abs(to.x - from.x) / 2, ry = Math.abs(to.y - from.y) / 2;
    d = `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`;
  }
  const a = Math.atan2(to.y - from.y, to.x - from.x);
  if (tool === "arrow") {
    head = `M ${to.x - 11 * Math.cos(a - 0.44)} ${to.y - 11 * Math.sin(a - 0.44)} L ${to.x} ${to.y} L ${to.x - 11 * Math.cos(a + 0.44)} ${to.y - 11 * Math.sin(a + 0.44)}`;
  }
  return (
    <motion.g>
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4 }}
      />
      {head && <motion.path d={head} fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} />}
    </motion.g>
  );
}

const MemoEl = memo(ElementView);

/* ---------- the board ---------- */

export default function Board({
  elements,
  camera,
  svgRef,
  onPointerDown, onPointerMove, onPointerUp, onDoubleClick,
}: {
  elements: El[];
  camera: { x: number; y: number; zoom: number };
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onDoubleClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}) {
  const vw = BW / camera.zoom, vh = BH / camera.zoom;
  return (
    <svg
      ref={svgRef}
      className="tb-board"
      viewBox={`${camera.x} ${camera.y} ${vw} ${vh}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
    >
      {/* soft vignette frame */}
      <rect x={-4000} y={-4000} width={BW + 8000} height={BH + 8000} fill="transparent" />
      {elements.map((el) => <MemoEl key={el.id} el={el} />)}
    </svg>
  );
}
