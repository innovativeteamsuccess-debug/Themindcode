"use client";

/* Basic canvas objects: text, sticky, shape, stroke, image, code, table.
   All renderers are pure views over immutable objects; the Canvas
   handles gestures via delegation on [data-obj-id]. Editing overlays
   carry the .st-ui class so the canvas ignores them. */

import { memo, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type {
  CanvasObject,
  CodeObj,
  ImageObj,
  ObjectPatch,
  ShapeObj,
  StickyObj,
  StrokeObj,
  TableObj,
  TextObj,
} from "../types";
import { useStudio } from "../store";
import { Tex } from "./KaTex";
import { AINoteView } from "./AINoteView";
import { DiagramView } from "./DiagramView";
import { QuizView, FlashcardsView } from "./Interactive";

function useHeightSync(
  ref: React.RefObject<HTMLElement | null>,
  obj: { id: string; h: number },
  active: boolean
) {
  const raf = useRef(0);
  useLayoutEffect(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const measured = Math.ceil(el.scrollHeight) + 2;
      if (Math.abs(measured - obj.h) > 3) {
        useStudio.getState().patchObject(obj.id, { h: measured } as ObjectPatch);
      }
    });
  }, [ref, obj.h, obj.id, obj, active]);
}

/* ---------------- text ---------------- */

function TextView({ obj, editing }: { obj: TextObj; editing: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  useHeightSync(ref, obj, editing);

  useEffect(() => {
    if (editing) taRef.current?.focus();
  }, [editing]);

  const ink = obj.ink ?? 1;
  return (
    <div className="st-obj-bare h-full w-full" style={{ position: "relative" }}>
      <div
        ref={ref}
        style={{
          fontSize: obj.size,
          lineHeight: 1.5,
          color: obj.color,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          visibility: editing ? "hidden" : "visible",
          /* hand-written reveal: ink sweeps left→right like a marker */
          clipPath: ink < 1 ? `inset(0 ${Math.max(0, (1 - ink) * 100)}% 0 0)` : undefined,
        }}
        data-text={obj.text}
      >
        {obj.text || <span style={{ color: "var(--st-faint)", fontSize: Math.min(14, obj.size) }}>Write…</span>}
      </div>
      {editing && (
        <textarea
          ref={taRef}
          className="st-textarea st-ui absolute inset-0"
          value={obj.text}
          placeholder="Write…"
          aria-label="Edit text"
          onChange={(e) => useStudio.getState().patchObject(obj.id, { text: e.target.value } as ObjectPatch)}
          onBlur={() => {
            useStudio.getState().setEditing(null);
            if (!obj.text.trim()) useStudio.getState().removeObjects([obj.id]);
            useStudio.getState().persistNow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

/* ---------------- sticky ---------------- */

function StickyView({ obj, editing }: { obj: StickyObj; editing: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useHeightSync(ref, obj, editing);
  return (
    <div className="st-sticky st-obj-bare h-full w-full" data-color={obj.color} style={{ position: "relative", padding: 13 }}>
      <div
        ref={ref}
        style={{
          fontSize: 13.5,
          lineHeight: 1.45,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          visibility: editing ? "hidden" : "visible",
        }}
      >
        {obj.text || <span style={{ opacity: 0.55 }}>Idea…</span>}
      </div>
      {editing && (
        <textarea
          className="st-textarea st-ui absolute inset-0"
          style={{ padding: 13, fontSize: 13.5, lineHeight: 1.45, color: "inherit" }}
          value={obj.text}
          placeholder="Idea…"
          aria-label="Edit sticky note"
          onChange={(e) => useStudio.getState().patchObject(obj.id, { text: e.target.value } as ObjectPatch)}
          onBlur={() => {
            useStudio.getState().setEditing(null);
            if (!obj.text.trim()) useStudio.getState().removeObjects([obj.id]);
            useStudio.getState().persistNow();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") (e.target as HTMLTextAreaElement).blur();
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}

/* ---------------- shape ---------------- */

function ShapeView({ obj }: { obj: ShapeObj }) {
  const { w, h } = obj;
  return (
    <svg width={w} height={h} className="st-obj-bare" aria-hidden>
      {obj.shape === "rect" && (
        <rect x="1.5" y="1.5" width={w - 3} height={h - 3} rx="10" fill={obj.fill} stroke={obj.stroke} strokeWidth="1.6" strokeDasharray={obj.dash ? "6 6" : undefined} />
      )}
      {obj.shape === "ellipse" && (
        <ellipse cx={w / 2} cy={h / 2} rx={w / 2 - 2} ry={h / 2 - 2} fill={obj.fill} stroke={obj.stroke} strokeWidth="1.6" strokeDasharray={obj.dash ? "6 6" : undefined} />
      )}
      {obj.shape === "triangle" && (
        <polygon points={`${w / 2},2 ${w - 2},${h - 2} 2,${h - 2}`} fill={obj.fill} stroke={obj.stroke} strokeWidth="1.6" strokeLinejoin="round" strokeDasharray={obj.dash ? "6 6" : undefined} />
      )}
      {obj.shape === "diamond" && (
        <polygon points={`${w / 2},2 ${w - 2},${h / 2} ${w / 2},${h - 2} 2,${h / 2}`} fill={obj.fill} stroke={obj.stroke} strokeWidth="1.6" strokeLinejoin="round" strokeDasharray={obj.dash ? "6 6" : undefined} />
      )}
    </svg>
  );
}

/* ---------------- stroke ---------------- */

function StrokeView({ obj }: { obj: StrokeObj }) {
  const ink = obj.ink ?? 1;
  const d = useMemo(() => {
    const all = obj.points;
    const pts = ink < 1 ? all.slice(0, Math.max(2, Math.ceil(all.length * ink))) : all;
    if (!pts.length) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} l 0.01 0`;
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2;
      const my = (pts[i].y + pts[i + 1].y) / 2;
      path += ` Q ${pts[i].x} ${pts[i].y} ${mx} ${my}`;
    }
    const last = pts[pts.length - 1];
    path += ` L ${last.x} ${last.y}`;
    return path;
  }, [obj.points, ink]);

  const pad = obj.size + 3;
  return (
    <svg
      className="st-obj-bare overflow-visible"
      width={Math.max(obj.w, 2) + pad * 2}
      height={Math.max(obj.h, 2) + pad * 2}
      style={{ position: "absolute", left: -pad, top: -pad }}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={obj.color}
        strokeWidth={obj.size}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={obj.opacity}
      />
    </svg>
  );
}

/* ---------------- image ---------------- */

function ImageView({ obj }: { obj: ImageObj }) {
  return (
    <img
      src={obj.src}
      alt={obj.alt ?? "canvas image"}
      draggable={false}
      className="st-obj-bare h-full w-full select-none rounded-[14px] border border-[var(--st-line)] object-cover"
      style={{ boxShadow: "0 14px 34px -14px rgba(1,5,14,0.7)" }}
    />
  );
}

/* ---------------- equation (view half; editor lives with the toolbar) ---------------- */

function EquationView({ obj, editing }: { obj: Extract<CanvasObject, { kind: "equation" }>; editing: boolean }) {
  const ink = obj.ink ?? 1;
  return (
    <div className="st-obj-bare flex h-full w-full items-center justify-center overflow-visible" style={{ padding: 6, opacity: ink, transform: `translateY(${(1 - ink) * 6}px)`, transition: "opacity 90ms linear" }}>
      {obj.latex ? (
        <div style={{ transform: `scale(${obj.scale})`, transformOrigin: "center", color: "#F0E9DD" }}>
          <Tex tex={obj.latex} />
        </div>
      ) : (
        !editing && (
          <span className="font-[family-name:var(--font-code-mono)] text-[11px] tracking-[0.14em] text-[var(--st-faint)]">
            ƒ — TYPE AN EQUATION
          </span>
        )
      )}
    </div>
  );
}

/* ---------------- code ---------------- */

function CodeView({ obj }: { obj: CodeObj }) {
  return (
    <div className="st-obj-bare flex h-full w-full flex-col overflow-hidden rounded-[14px] border border-[var(--st-line)] bg-[#081426]">
      <div className="flex items-center justify-between border-b border-[var(--st-line)] px-3.5 py-2">
        <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] uppercase tracking-[0.2em] text-[var(--st-faint)]">
          {obj.lang || "code"}
        </span>
        <span className="flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-[#FF7A93]/70" />
          <span className="h-2 w-2 rounded-full bg-[#F5B83D]/70" />
          <span className="h-2 w-2 rounded-full bg-[#3DDC97]/70" />
        </span>
      </div>
      <pre className="st-scroll flex-1 overflow-auto px-4 py-3 font-[family-name:var(--font-code-mono)] text-[12px] leading-relaxed text-[#C7DBFF]">
        {obj.code}
      </pre>
    </div>
  );
}

/* ---------------- table ---------------- */

function TableView({ obj }: { obj: TableObj }) {
  const cols = obj.rows[0]?.length ?? 0;
  return (
    <div
      className="st-obj-bare grid h-full w-full overflow-hidden rounded-[14px] border border-[var(--st-line)] bg-[#081426]/85"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(60px, 1fr))`, gridTemplateRows: `repeat(${obj.rows.length}, 1fr)` }}
    >
      {obj.rows.flatMap((row, ri) =>
        row.map((cell, ci) => (
          <div
            key={`${ri}-${ci}`}
            className="flex items-center border-b border-r border-[var(--st-line)] px-3 py-2 text-[12px] text-[var(--st-dim)] last:border-r-0"
            style={
              ri === 0 && obj.header
                ? { background: "rgba(255,158,61,0.12)", color: "var(--st-ink)", fontWeight: 600, fontSize: 11.5, letterSpacing: "0.04em" }
                : undefined
            }
          >
            <span className="truncate">{cell}</span>
          </div>
        ))
      )}
    </div>
  );
}

/* ---------------- dispatcher ---------------- */

export const ObjectView = memo(function ObjectView({
  obj,
  editing,
}: {
  obj: CanvasObject;
  selected: boolean;
  editing: boolean;
}) {
  if (obj.kind === "stroke") {
    return (
      <div className="st-obj" data-obj-id={obj.id} style={{ left: obj.x, top: obj.y, width: 1, height: 1, zIndex: obj.z, pointerEvents: obj.locked ? "none" : "auto" }}>
        <StrokeView obj={obj} />
      </div>
    );
  }
  return (
    <div
      className="st-obj"
      data-obj-id={obj.id}
      style={{ left: obj.x, top: obj.y, width: obj.w, height: obj.h, zIndex: obj.z, pointerEvents: obj.locked ? "none" : "auto" }}
    >
      {obj.kind === "text" && <TextView obj={obj} editing={editing} />}
      {obj.kind === "sticky" && <StickyView obj={obj} editing={editing} />}
      {obj.kind === "shape" && <ShapeView obj={obj} />}
      {obj.kind === "image" && <ImageView obj={obj} />}
      {obj.kind === "code" && <CodeView obj={obj} />}
      {obj.kind === "table" && <TableView obj={obj} />}
      {obj.kind === "equation" && <EquationView obj={obj} editing={editing} />}
      {obj.kind === "ainote" && <AINoteView obj={obj} />}
      {obj.kind === "diagram" && <DiagramView obj={obj} />}
      {obj.kind === "quiz" && <QuizView obj={obj} />}
      {obj.kind === "flashcards" && <FlashcardsView obj={obj} />}
    </div>
  );
});

export { Tex };
