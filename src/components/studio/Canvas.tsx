"use client";

/* ============================================================
   CODE STUDIO — Canvas
   Infinite pannable/zoomable world. DOM objects + SVG connector
   layer. Pointer state machine: pan / draw / erase / create /
   rubber-band / move / resize / diagram-node drag. Magnetic
   snapping, arrow gluing, pinch & wheel camera, context menu.
   Rendering is virtualised by viewport culling.
   ============================================================ */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStudio } from "./store";
import {
  anchorOf, bboxOf, computeSnap, nearestSide, rectsIntersect, screenToWorld, uid,
} from "./lib/geometry";
import type { CanvasObject, Guide, Vec2 , ObjectPatch} from "./types";
import { ObjectView } from "./objects/ObjectView";
import ContextMenu, { type CtxItem } from "./ContextMenu";
import EmptyState from "./EmptyState";
import MiniMap from "./MiniMap";
import { EquationEditor } from "./EquationEditor";

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

type Gesture =
  | { type: "pan"; sx: number; sy: number; cx: number; cy: number }
  | { type: "draw"; id: string; min: Vec2; max: Vec2 }
  | { type: "erase" }
  | { type: "create"; id: string; origin: Vec2; kind: "shape" | "arrow" }
  | { type: "band"; sx: number; sy: number }
  | { type: "move"; start: Vec2; orig: Record<string, Vec2>; threshold: boolean }
  | { type: "resize"; id: string; handle: Handle; start: Vec2; orig: CanvasObject }
  | { type: "node"; objId: string; nodeId: string; grab: Vec2 };

const CURSORS: Record<string, string> = {
  select: "default",
  pen: "crosshair",
  highlighter: "crosshair",
  eraser: "cell",
  text: "text",
  equation: "text",
  shape: "crosshair",
  arrow: "crosshair",
  image: "copy",
  sticky: "copy",
  ai: "pointer",
  voice: "pointer",
  hand: "grab",
};

const INK = "#F4EFE9";

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export default function Canvas() {
  const camera = useStudio((s) => s.camera);
  const tool = useStudio((s) => s.tool);
  const settings = useStudio((s) => s.settings);
  const boardId = useStudio((s) => s.activeBoardId);
  const board = useStudio((s) => s.boards[s.activeBoardId]);
  const selection = useStudio((s) => s.selection);
  const guides = useStudio((s) => s.guides);
  const aiBusy = useStudio((s) => s.aiBusy);
  const editingId = useStudio((s) => s.editingId);
  const viewport = useStudio((s) => s.viewport);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const pointers = useRef<Map<number, Vec2>>(new Map());
  const pinch = useRef<{ dist: number; z: number; cx: number; cy: number } | null>(null);
  const spaceRef = useRef(false);
  const rafPending = useRef(false);
  const pendingMove = useRef<{ e: PointerEvent } | null>(null);
  const [band, setBand] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [ctx, setCtx] = useState<{ x: number; y: number; target?: string } | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);

  const objects = board?.objects ?? {};

  /* ---------------- viewport size ---------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      useStudio.getState().setViewport(r.width, r.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ---------------- space-to-pan ---------------- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === "Space" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        spaceRef.current = true;
        setSpaceHeld(true);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceRef.current = false;
        setSpaceHeld(false);
      }
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  /* ---------------- wheel: zoom / pan ---------------- */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const s = useStudio.getState();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0022);
        s.zoomBy(factor, px, py);
      } else {
        s.setCamera({ x: s.camera.x - e.deltaX, y: s.camera.y - (e.shiftKey ? e.deltaY : 0) - (e.shiftKey ? 0 : e.deltaY), z: s.camera.z });
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  /* ---------------- helpers ---------------- */

  const worldPoint = useCallback(
    (clientX: number, clientY: number): Vec2 => {
      const rect = wrapRef.current!.getBoundingClientRect();
      return screenToWorld(clientX - rect.left, clientY - rect.top, useStudio.getState().camera);
    },
    []
  );

  const hitObject = useCallback(
    (p: Vec2, exclude?: Set<string>): CanvasObject | null => {
      const s = useStudio.getState();
      const b = s.boards[s.activeBoardId];
      if (!b) return null;
      const list = Object.values(b.objects).sort((a, c) => c.z - a.z);
      for (const o of list) {
        if (exclude?.has(o.id)) continue;
        if (o.kind === "stroke") {
          if (strokeHit(o, p)) return o;
          continue;
        }
        const bb = bboxOf(o);
        if (p.x >= bb.x - 4 && p.x <= bb.x + bb.w + 4 && p.y >= bb.y - 4 && p.y <= bb.y + bb.h + 4) return o;
      }
      return null;
    },
    []
  );

  const startPan = useCallback((sx: number, sy: number) => {
    const s = useStudio.getState();
    gesture.current = { type: "pan", sx, sy, cx: s.camera.x, cy: s.camera.y };
  }, []);

  /* ---------------- create helpers ---------------- */

  const createAt = useCallback(
    (p: Vec2, kind: "text" | "equation" | "sticky" | "diagram") => {
      const s = useStudio.getState();
      if (kind === "text") {
        const id = s.addObject({ kind: "text", x: p.x, y: p.y - 14, w: 240, h: 44, text: "", color: INK, size: 16 });
        s.select([id]);
        s.setEditing(id);
        s.setTool("select");
      } else if (kind === "equation") {
        const id = s.addObject({ kind: "equation", x: p.x, y: p.y - 20, w: 240, h: 64, latex: "", scale: 1 });
        s.select([id]);
        s.setEditing(id);
        s.setTool("select");
      } else if (kind === "diagram") {
        const id = s.addObject({
          kind: "diagram",
          x: p.x - 40,
          y: p.y - 30,
          w: 420,
          h: 240,
          title: "Sketch your idea — or ask CODE",
          nodes: [
            { id: "a", label: "Start here", x: 24, y: 84, w: 150, h: 68, shape: "rounded", fill: "rgba(255,158,61,0.14)", text: "Start here\ndouble-click to edit" },
            { id: "b", label: "Next", x: 240, y: 24, w: 150, h: 60, shape: "pill", fill: "rgba(61,220,151,0.13)", text: "Add a step" },
            { id: "c", label: "Next", x: 240, y: 150, w: 150, h: 60, shape: "pill", fill: "rgba(167,139,250,0.13)", text: "Or a branch" },
          ],
          edges: [
            { id: "e1", from: "a", to: "b" },
            { id: "e2", from: "a", to: "c", dashed: true },
          ],
        });
        s.select([id]);
        s.setTool("select");
      } else {
        const id = s.addObject({ kind: "sticky", x: p.x - 12, y: p.y - 12, w: 210, h: 170, text: "", color: s.stickyColor });
        s.select([id]);
        s.setEditing(id);
        s.setTool("select");
      }
    },
    []
  );


  function eraseAt(p: Vec2) {
    const s = useStudio.getState();
    const b = s.boards[s.activeBoardId];
    if (!b) return;
    const victims: string[] = [];
    for (const o of Object.values(b.objects)) {
      if (o.locked) continue;
      if (o.kind === "stroke" ? strokeHit(o, p) : (() => { const bb = bboxOf(o); return p.x >= bb.x && p.x <= bb.x + bb.w && p.y >= bb.y && p.y <= bb.y + bb.h; })()) {
        victims.push(o.id);
      }
    }
    if (victims.length) s.removeObjects(victims);
  }

  /* ---------------- pointer down ---------------- */

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 2) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      // pinch start (two fingers)
      if (pointers.current.size === 2) {
        const [a, b] = Array.from(pointers.current.values());
        pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), z: useStudio.getState().camera.z, cx: 0, cy: 0 };
        gesture.current = null;
        setBand(null);
        return;
      }

      const s = useStudio.getState();
      const p = worldPoint(e.clientX, e.clientY);
      setCtx(null);

      const wantsPan =
        s.tool === "hand" || spaceRef.current || e.button === 1;
      if (wantsPan) {
        startPan(e.clientX, e.clientY);
        return;
      }

      const target = e.target as HTMLElement;
      const interactive = target.closest(".st-ui") as HTMLElement | null;

      // diagram node drag
      const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
      const objEl = target.closest("[data-obj-id]") as HTMLElement | null;

      if (s.tool === "select") {
        // diagram node drag takes priority
        const nodeId = nodeEl?.getAttribute("data-node-id");
        const diagId = nodeEl?.closest("[data-obj-id]")?.getAttribute("data-obj-id");
        if (nodeId && diagId) {
          const diag = objects[diagId];
          const node = diag?.kind === "diagram" ? diag.nodes.find((n) => n.id === nodeId) : null;
          if (node) {
            s.select([diagId]);
            gesture.current = { type: "node", objId: diagId, nodeId, grab: { x: p.x - (diag.x + node.x), y: p.y - (diag.y + node.y) } };
            return;
          }
        }
        const objId = objEl?.getAttribute("data-obj-id");
        if (objId && !interactive) {
          const obj = objects[objId];
          if (obj?.locked) {
            s.select([objId]);
            return;
          }
          // select or add
          if (e.shiftKey) {
            s.select([objId], true);
          } else if (!s.selection.includes(objId)) {
            s.select([objId]);
          }
          const sel = useStudio.getState().selection;
          const orig: Record<string, Vec2> = {};
          for (const id of sel) {
            const o = s.boards[s.activeBoardId]?.objects[id];
            if (o && !o.locked) orig[id] = { x: o.x, y: o.y };
          }
          gesture.current = { type: "move", start: p, orig, threshold: false };
          return;
        }
        if (!objEl) {
          gesture.current = { type: "band", sx: e.clientX, sy: e.clientY };
          s.clearSelection();
        }
        return;
      }

      if (s.tool === "pen" || s.tool === "highlighter") {
        s.beginGesture();
        const id = s.addObject({
          kind: "stroke",
          x: p.x,
          y: p.y,
          w: 2,
          h: 2,
          points: [{ x: 0, y: 0 }],
          color: s.penColor,
          size: s.tool === "highlighter" ? Math.max(10, s.penSize * 3.2) : s.penSize,
          opacity: s.tool === "highlighter" ? 0.32 : 1,
          highlighter: s.tool === "highlighter",
        });
        gesture.current = { type: "draw", id, min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
        return;
      }

      if (s.tool === "eraser") {
        s.beginGesture();
        gesture.current = { type: "erase" };
        eraseAt(p);
        return;
      }

      if (s.tool === "shape") {
        s.beginGesture();
        const id = s.addObject({
          kind: "shape",
          x: p.x,
          y: p.y,
          w: 2,
          h: 2,
          shape: s.shapeKind,
          fill: "rgba(255,158,61,0.11)",
          stroke: "#FF9E3D",
        });
        gesture.current = { type: "create", id, origin: p, kind: "shape" };
        return;
      }

      if (s.tool === "arrow") {
        s.beginGesture();
        const id = s.addObject({
          kind: "arrow",
          x: p.x,
          y: p.y,
          w: 2,
          h: 2,
          x2: 2,
          y2: 2,
          color: "#BAB3A8",
        });
        gesture.current = { type: "create", id, origin: p, kind: "arrow" };
        return;
      }

      if (s.tool === "text") return createAt(p, "text");
      if (s.tool === "equation") return createAt(p, "equation");
      if (s.tool === "sticky") return createAt(p, "sticky");
      if (s.tool === "diagram") return createAt(p, "diagram");
      if (s.tool === "image") return void fileRef.current?.click();
      if (s.tool === "ai") {
        s.setAI({ aiBarOpen: true });
        s.setTool("select");
        return;
      }
      if (s.tool === "voice") {
        s.setVoiceOpen(true);
        s.setTool("select");
        return;
      }
    },
     
    [objects, worldPoint, startPan, createAt]
  );



  function applyResize(g: Extract<Gesture, { type: "resize" }>, p: Vec2, s: ReturnType<typeof useStudio.getState>) {
    const dx = p.x - g.start.x;
    const dy = p.y - g.start.y;
    const o = g.orig;
    const min = 28;
    if (o.kind === "stroke") {
      const scale = Math.max(0.2, (o.w + dx) / (o.w || 1));
      s.patchObject(g.id, {
        w: Math.max(12, o.w + dx),
        h: Math.max(12, o.h + dy),
        points: o.points.map((pt) => ({ x: pt.x * scale, y: pt.y * ((o.h + dy) / (o.h || 1)) })),
        size: Math.max(1, o.size * scale),
      } as ObjectPatch);
      return;
    }
    if (o.kind === "text") {
      // side handles: width only; corners: scale font
      const w = Math.max(60, o.w + (g.handle.includes("e") ? dx : g.handle.includes("w") ? -dx : 0));
      if (g.handle.length === 2) {
        const ratio = Math.max(0.4, (o.h + dy) / (o.h || 1));
        s.patchObject(g.id, { w, h: Math.max(28, o.h + dy), size: Math.max(10, Math.round(o.size * ratio)) } as ObjectPatch);
      } else {
        s.patchObject(g.id, { w } as ObjectPatch);
      }
      return;
    }
    if (o.kind === "equation") {
      const ratio = clamp((o.h + dy) / (o.h || 1), 0.4, 3);
      s.patchObject(g.id, {
        w: Math.max(60, o.w + dx),
        h: Math.max(30, o.h + dy),
        scale: clamp(o.scale * ratio, 0.35, 3),
      } as ObjectPatch);
      return;
    }
    let nx = o.x;
    let ny = o.y;
    let nw = o.w;
    let nh = o.h;
    if (g.handle.includes("e")) nw = Math.max(min, o.w + dx);
    if (g.handle.includes("w")) { nw = Math.max(min, o.w - dx); nx = o.x + (o.w - nw); }
    if (g.handle.includes("s")) nh = Math.max(min, o.h + dy);
    if (g.handle.includes("n")) { nh = Math.max(min, o.h - dy); ny = o.y + (o.h - nh); }
    if (o.kind === "diagram") {
      const rx = nw / (o.w || 1);
      const ry = nh / (o.h || 1);
      s.patchObject(g.id, {
        x: nx, y: ny, w: nw, h: nh,
        nodes: o.nodes.map((n) => ({ ...n, x: Math.round(n.x * rx), y: Math.round(n.y * ry), w: Math.round(n.w * rx), h: Math.round(n.h * ry) })),
      } as ObjectPatch);
      return;
    }
    s.patchObject(g.id, { x: nx, y: ny, w: nw, h: nh } as ObjectPatch);
  }

  /* ---------------- pointer move (rAF throttled) ---------------- */

  const applyMove = useCallback(
    (e: PointerEvent) => {
      const g = gesture.current;
      if (!g) {
        // pinch update
        if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.current.size === 2 && pinch.current) {
          const [a, b] = Array.from(pointers.current.values());
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const s = useStudio.getState();
          const rect = wrapRef.current!.getBoundingClientRect();
          const cx = (a.x + b.x) / 2 - rect.left;
          const cy = (a.y + b.y) / 2 - rect.top;
          s.zoomBy(dist / (pinch.current.dist || 1), cx, cy);
          pinch.current.dist = dist;
        }
        return;
      }
      if (pointers.current.has(e.pointerId)) pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      const s = useStudio.getState();
      const p = worldPoint(e.clientX, e.clientY);

      if (g.type === "pan") {
        s.setCamera({ x: g.cx + (e.clientX - g.sx), y: g.cy + (e.clientY - g.sy), z: s.camera.z });
        return;
      }

      if (g.type === "draw") {
        const obj = s.boards[s.activeBoardId]?.objects[g.id];
        if (obj?.kind !== "stroke") return;
        const rel = { x: p.x - obj.x, y: p.y - obj.y };
        const pts = [...obj.points, rel];
        const minX = Math.min(g.min.x, rel.x);
        const minY = Math.min(g.min.y, rel.y);
        const maxX = Math.max(g.max.x, rel.x);
        const maxY = Math.max(g.max.y, rel.y);
        gesture.current = { ...g, min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
        s.patchObject(g.id, {
          points: pts,
          w: Math.max(4, maxX - minX),
          h: Math.max(4, maxY - minY),
        } as ObjectPatch);
        return;
      }

      if (g.type === "erase") {
        eraseAt(p);
        return;
      }

      if (g.type === "create") {
        const dx = p.x - g.origin.x;
        const dy = p.y - g.origin.y;
        if (g.kind === "shape") {
          s.patchObject(g.id, {
            x: Math.min(g.origin.x, p.x),
            y: Math.min(g.origin.y, p.y),
            w: Math.abs(dx),
            h: Math.abs(dy),
          } as ObjectPatch);
        } else {
          s.patchObject(g.id, { x2: dx, y2: dy, w: Math.abs(dx), h: Math.abs(dy) } as ObjectPatch);
        }
        return;
      }

      if (g.type === "band") {
        const rect = wrapRef.current!.getBoundingClientRect();
        const x0 = g.sx - rect.left;
        const y0 = g.sy - rect.top;
        const x1 = e.clientX - rect.left;
        const y1 = e.clientY - rect.top;
        setBand({ x: Math.min(x0, x1), y: Math.min(y0, y1), w: Math.abs(x1 - x0), h: Math.abs(y1 - y0) });
        // live-select
        const w0 = screenToWorld(Math.min(x0, x1), Math.min(y0, y1), s.camera);
        const w1 = screenToWorld(Math.max(x0, x1), Math.max(y0, y1), s.camera);
        const bandRect = { x: w0.x, y: w0.y, w: w1.x - w0.x, h: w1.y - w0.y };
        const hits = Object.values(objects)
          .filter((o) => rectsIntersect(bandRect, bboxOf(o)))
          .map((o) => o.id);
        s.select(hits);
        return;
      }

      if (g.type === "move") {
        const dx = p.x - g.start.x;
        const dy = p.y - g.start.y;
        if (!g.threshold) {
          if (Math.hypot(dx, dy) * s.camera.z < 4) return;
          g.threshold = true;
          s.beginGesture();
        }
        const sel = s.selection;
        const movingRect = unionRect(sel.map((id) => objects[id]).filter(Boolean));
        if (!movingRect) return;
        let sdx = dx;
        let sdy = dy;
        if (s.settings.snap) {
          const others = Object.values(objects)
            .filter((o) => !sel.includes(o.id) && !o.locked)
            .map((o) => bboxOf(o));
          const moved = { ...movingRect, x: movingRect.x + dx, y: movingRect.y + dy };
          const snap = computeSnap(moved, others, 7 / s.camera.z);
          sdx += snap.dx;
          sdy += snap.dy;
          s.setGuides(snap.guides);
        }
        for (const [id, orig] of Object.entries(g.orig)) {
          s.patchObject(id, { x: orig.x + sdx, y: orig.y + sdy } as ObjectPatch);
        }
        syncArrows(s, Object.keys(g.orig));
        return;
      }

      if (g.type === "resize") {
        applyResize(g, p, s);
        return;
      }

      if (g.type === "node") {
        const obj = s.boards[s.activeBoardId]?.objects[g.objId];
        if (obj?.kind !== "diagram") return;
        const node = obj.nodes.find((n) => n.id === g.nodeId);
        if (!node) return;
        const nx = clamp(p.x - g.grab.x, 0, obj.w - node.w);
        const ny = clamp(p.y - g.grab.y, 0, obj.h - node.h);
        s.patchObject(g.objId, {
          nodes: obj.nodes.map((n) => (n.id === g.nodeId ? { ...n, x: Math.round(nx), y: Math.round(ny) } : n)),
        } as ObjectPatch);
        return;
      }
    },
     
    [objects, worldPoint, eraseAt]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      pendingMove.current = { e: e.nativeEvent };
      if (rafPending.current) return;
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        const pm = pendingMove.current;
        if (pm) applyMove(pm.e);
      });
    },
    [applyMove]
  );

  /* ---------------- pointer up ---------------- */

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      const g = gesture.current;
      const s = useStudio.getState();
      if (!g) return;
      gesture.current = null;
      setBand(null);
      s.setGuides([]);

      if (g.type === "pan" || g.type === "draw" || g.type === "erase" || g.type === "move" || g.type === "resize" || g.type === "node") {
        s.persistNow();
        return;
      }

      if (g.type === "create") {
        const obj = s.boards[s.activeBoardId]?.objects[g.id];
        if (!obj) return;
        const tiny = Math.abs(obj.w) < 8 && Math.abs(obj.h) < 8;
        if (g.kind === "shape") {
          if (tiny) {
            s.patchObject(g.id, { x: g.origin.x, y: g.origin.y, w: 160, h: 120 } as ObjectPatch);
          }
          s.select([g.id]);
          s.setTool("select");
        } else {
          if (tiny) {
            s.removeObjects([g.id]);
          } else {
            // magnetic glue: attach ends to nearby objects
            const startPt = g.origin;
            const endPt = { x: g.origin.x + (obj as { x2: number; y2: number }).x2, y: g.origin.y + (obj as { x2: number; y2: number }).y2 };
            const patch: Record<string, unknown> = {};
            const nearA = findAttachTarget(objects, startPt, [g.id]);
            const nearB = findAttachTarget(objects, endPt, [g.id]);
            if (nearA) {
              const anchor = anchorOf(nearA.obj, nearA.side);
              patch.fromAttach = { id: nearA.obj.id, side: nearA.side };
              patch.x = anchor.x;
              patch.y = anchor.y;
              patch.x2 = (endPt.x - anchor.x);
              patch.y2 = (endPt.y - anchor.y);
            }
            if (nearB) {
              const anchor = anchorOf(nearB.obj, nearB.side);
              patch.toAttach = { id: nearB.obj.id, side: nearB.side };
              patch.x2 = anchor.x - (patch.x as number ?? obj.x);
              patch.y2 = anchor.y - (patch.y as number ?? obj.y);
            }
            s.patchObject(g.id, patch as ObjectPatch);
            s.select([g.id]);
            s.setTool("select");
          }
        }
        s.persistNow();
        return;
      }

      if (g.type === "band") {
        s.persistNow();
        return;
      }
    },
     
    [objects]
  );

  /* ---------------- resize ---------------- */

  const startResize = useCallback((id: string, handle: Handle, e: React.PointerEvent) => {
    e.stopPropagation();
    const s = useStudio.getState();
    const obj = s.boards[s.activeBoardId]?.objects[id];
    if (!obj || obj.locked) return;
    s.beginGesture();
    const p = worldPoint(e.clientX, e.clientY);
    gesture.current = { type: "resize", id, handle, start: p, orig: JSON.parse(JSON.stringify(obj)) as CanvasObject };
  }, [worldPoint]);


  /* ---------------- context menu ---------------- */

  const onContext = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const p = worldPoint(e.clientX, e.clientY);
      const hit = hitObject(p);
      const s = useStudio.getState();
      if (hit && !s.selection.includes(hit.id)) s.select([hit.id]);
      setCtx({ x: e.clientX, y: e.clientY, target: hit?.id });
    },
    [worldPoint, hitObject]
  );

  /* ---------------- double click ---------------- */

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const p = worldPoint(e.clientX, e.clientY);
      const s = useStudio.getState();
      const target = e.target as HTMLElement;
      const objId = target.closest("[data-obj-id]")?.getAttribute("data-obj-id");
      if (objId) {
        const obj = objects[objId];
        if (!obj) return;
        if (obj.kind === "text" || obj.kind === "sticky") s.setEditing(objId);
        if (obj.kind === "equation") s.setEditing(objId);
        return;
      }
      // empty canvas: quick text
      const id = s.addObject({ kind: "text", x: p.x, y: p.y - 14, w: 240, h: 44, text: "", color: INK, size: 16 });
      s.select([id]);
      s.setEditing(id);
    },
    [worldPoint, objects]
  );

  /* ---------------- image upload ---------------- */

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = await downscale(reader.result as string, 1200);
      const s = useStudio.getState();
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 420 / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const center = {
          x: (-s.camera.x + s.viewport.w / 2) / s.camera.z,
          y: (-s.camera.y + s.viewport.h / 2) / s.camera.z,
        };
        const id = s.addObject({ kind: "image", x: center.x - w / 2, y: center.y - h / 2, w, h, src: dataUrl, alt: file.name });
        s.select([id]);
        s.setTool("select");
        s.persistNow();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, []);

  /* ---------------- render ---------------- */

  const visible = useMemo(() => {
    const vp = {
      x: -camera.x / camera.z - 240,
      y: -camera.y / camera.z - 240,
      w: viewport.w / camera.z + 480,
      h: viewport.h / camera.z + 480,
    };
    return Object.values(objects)
      .filter((o) => rectsIntersect(vp, bboxOf(o)))
      .sort((a, b) => a.z - b.z);
  }, [objects, camera, viewport]);

  const cursor = spaceHeld || tool === "hand" ? "grab" : CURSORS[tool] ?? "default";

  const arrows = visible.filter((o): o is Extract<CanvasObject, { kind: "arrow" }> => o.kind === "arrow");

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 overflow-hidden"
      style={{ touchAction: "none", cursor, background: "var(--st-bg)" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={onContext}
      onDoubleClick={onDoubleClick}
      role="application"
      aria-label="Infinite learning canvas. Draw, write and place objects. Press question-mark for shortcuts."
    >
      {/* dot / line grid */}
      {settings.grid !== "none" && (
        <div
          className="pointer-events-none absolute inset-0"
          style={
            settings.grid === "dots"
              ? {
                  backgroundImage: "radial-gradient(circle, rgba(255,171,98,0.16) 1px, transparent 1.4px)",
                  backgroundSize: `${28 * camera.z}px ${28 * camera.z}px`,
                  backgroundPosition: `${camera.x}px ${camera.y}px`,
                }
              : {
                  backgroundImage:
                    "linear-gradient(rgba(255,171,98,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,171,98,0.08) 1px, transparent 1px)",
                  backgroundSize: `${28 * camera.z}px ${28 * camera.z}px`,
                  backgroundPosition: `${camera.x}px ${camera.y}px`,
                }
          }
        />
      )}
      {/* origin axes */}
      <div className="pointer-events-none absolute inset-y-0 w-px bg-[rgba(255,171,98,0.13)]" style={{ left: camera.x }} />
      <div className="pointer-events-none absolute inset-x-0 h-px bg-[rgba(255,171,98,0.13)]" style={{ top: camera.y }} />

      {/* world */}
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate3d(${camera.x}px, ${camera.y}px, 0) scale(${camera.z})` }}
      >
        {/* connector layer */}
        <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1">
          <defs>
            <marker id="st-arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9" fill="none" stroke="context-stroke" strokeWidth="1.8" strokeLinecap="round" />
            </marker>
          </defs>
          {arrows.map((a) => (
            <ArrowPath key={a.id} a={a} />
          ))}
        </svg>

        {visible.map((o) => (
          <ObjectView key={o.id} obj={o} selected={selection.includes(o.id)} editing={editingId === o.id} />
        ))}

        {/* snap guides */}
        {guides.map((g: Guide, i) =>
          g.axis === "x" ? (
            <div key={i} className="st-guide" style={{ left: g.at, top: g.from, width: 1, height: g.to - g.from }} />
          ) : (
            <div key={i} className="st-guide" style={{ left: g.from, top: g.at, width: g.to - g.from, height: 1 }} />
          )
        )}
      </div>

      {/* selection chrome (screen space) */}
      <SelectionChrome
        objects={objects}
        selection={selection}
        camera={camera}
        startResize={startResize}
      />

      {/* rubber band */}
      {band && (
        <div
          className="pointer-events-none absolute rounded-[4px] border border-[var(--st-accent)] bg-[rgba(255,158,61,0.1)]"
          style={{ left: band.x, top: band.y, width: band.w, height: band.h }}
        />
      )}

      {/* empty state */}
      {board && Object.keys(board.objects).length === 0 && <EmptyState />}

      {/* AI thinking chip */}
      {aiBusy && (
        <div className="st-glass pointer-events-none absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2.5 rounded-full px-4 py-2.5">
          <span className="st-gen-shimmer h-2 w-2 rounded-full bg-[var(--st-accent)]" />
          <span className="font-[family-name:var(--font-body-sans)] text-[12px] text-[var(--st-dim)]">
            CODE is thinking on it…
          </span>
        </div>
      )}

      <MiniMap objects={objects} />

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} aria-hidden />

      <ContextMenu info={ctx} onClose={() => setCtx(null)} hitTest={(p) => hitObject(p)} />

      {/* equation editor popover */}
      {editingId && objects[editingId]?.kind === "equation" && (
        <EquationEditorAnchor obj={objects[editingId] as Extract<CanvasObject, { kind: "equation" }>} camera={camera} />
      )}
    </div>
  );
}

/* ================= sub-components ================= */

function EquationEditorAnchor({
  obj,
  camera,
}: {
  obj: Extract<CanvasObject, { kind: "equation" }>;
  camera: { x: number; y: number; z: number };
}) {
  const viewport = useStudio((s) => s.viewport);
  const x = obj.x * camera.z + camera.x;
  const y = obj.y * camera.z + camera.y;
  const anchor = {
    x: Math.min(Math.max(x, 12), Math.max(12, viewport.w - 350)),
    y: Math.min(y, Math.max(12, viewport.h - 320)),
  };
  return <EquationEditor obj={obj} anchor={anchor} />;
}

const SelectionChrome = memo(function SelectionChrome({
  objects,
  selection,
  camera,
  startResize,
}: {
  objects: Record<string, CanvasObject>;
  selection: string[];
  camera: { x: number; y: number; z: number };
  startResize: (id: string, h: Handle, e: React.PointerEvent) => void;
}) {
  if (!selection.length) return null;
  const z = camera.z;
  const toScreen = (x: number, y: number) => ({ x: x * z + camera.x, y: y * z + camera.y });

  if (selection.length === 1) {
    const o = objects[selection[0]];
    if (!o) return null;
    const bb = bboxOf(o);
    const p = toScreen(bb.x, bb.y);
    const w = bb.w * z;
    const h = bb.h * z;
    const handles: { h: Handle; x: number; y: number; c: string }[] = [
      { h: "nw", x: 0, y: 0, c: "nwse-resize" },
      { h: "n", x: w / 2, y: 0, c: "ns-resize" },
      { h: "ne", x: w, y: 0, c: "nesw-resize" },
      { h: "e", x: w, y: h / 2, c: "ew-resize" },
      { h: "se", x: w, y: h, c: "nwse-resize" },
      { h: "s", x: w / 2, y: h, c: "ns-resize" },
      { h: "sw", x: 0, y: h, c: "nesw-resize" },
      { h: "w", x: 0, y: h / 2, c: "ew-resize" },
    ];
    return (
      <>
        <div className="st-sel-box" style={{ left: p.x - 3, top: p.y - 3, width: w + 6, height: h + 6 }} />
        {!o.locked &&
          handles.map((hd) => (
            <div
              key={hd.h}
              className="st-handle"
              style={{ left: p.x + hd.x - 5.5, top: p.y + hd.y - 5.5, cursor: hd.c }}
              onPointerDown={(e) => startResize(o.id, hd.h, e)}
              role="presentation"
            />
          ))}
        {o.locked && (
          <div
            className="absolute -top-7 left-0 rounded-md border border-[var(--st-line-2)] bg-[#17181f] px-2 py-0.5 font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.16em] text-[var(--st-faint)]"
          >
            locked
          </div>
        )}
      </>
    );
  }

  // group bbox
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const id of selection) {
    const o = objects[id];
    if (!o) continue;
    const bb = bboxOf(o);
    x0 = Math.min(x0, bb.x);
    y0 = Math.min(y0, bb.y);
    x1 = Math.max(x1, bb.x + bb.w);
    y1 = Math.max(y1, bb.y + bb.h);
  }
  if (x0 === Infinity) return null;
  const p = toScreen(x0, y0);
  return (
    <div
      className="absolute rounded-[10px] border border-dashed border-[var(--st-accent)]"
      style={{ left: p.x - 5, top: p.y - 5, width: (x1 - x0) * z + 10, height: (y1 - y0) * z + 10, pointerEvents: "none" }}
    />
  );
});

function ArrowPath({ a }: { a: Extract<CanvasObject, { kind: "arrow" }> }) {
  const s = useStudio.getState();
  const b = s.boards[s.activeBoardId];
  let x1 = a.x;
  let y1 = a.y;
  let x2 = a.x + a.x2;
  let y2 = a.y + a.y2;
  if (b && a.fromAttach) {
    const t = b.objects[a.fromAttach.id];
    if (t) {
      const p = anchorOf(t, a.fromAttach.side);
      x2 -= x1 - p.x;
      y2 -= y1 - p.y;
      x1 = p.x;
      y1 = p.y;
    }
  }
  if (b && a.toAttach) {
    const t = b.objects[a.toAttach.id];
    if (t) {
      const p = anchorOf(t, a.toAttach.side);
      x2 = p.x;
      y2 = p.y;
    }
  }
  const d = a.elbow
    ? `M ${x1} ${y1} L ${(x1 + x2) / 2} ${y1} L ${(x1 + x2) / 2} ${y2} L ${x2} ${y2}`
    : `M ${x1} ${y1} L ${x2} ${y2}`;
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={a.color}
        strokeWidth={2}
        strokeLinecap="round"
        markerEnd="url(#st-arrowhead)"
        opacity={0.9}
      />
      {a.label && (
        <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 8} textAnchor="middle" fill={a.color} fontSize={12} fontFamily="var(--font-body-sans)">
          {a.label}
        </text>
      )}
    </g>
  );
}

/* ================= utilities ================= */

function strokeHit(o: Extract<CanvasObject, { kind: "stroke" }>, p: Vec2): boolean {
  const r = Math.max(8, o.size + 3);
  const pts = o.points;
  if (pts.length === 1) return Math.hypot(p.x - (o.x + pts[0].x), p.y - (o.y + pts[0].y)) <= r;
  for (let i = 1; i < pts.length; i++) {
    const a = { x: o.x + pts[i - 1].x, y: o.y + pts[i - 1].y };
    const b = { x: o.x + pts[i].x, y: o.y + pts[i].y };
    if (distToSeg(p, a, b) <= r) return true;
  }
  return false;
}

function distToSeg(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / len2, 0, 1) : 0;
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function unionRect(list: { x: number; y: number; w: number; h: number }[]) {
  if (!list.length) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const r of list) {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function findAttachTarget(
  objects: Record<string, CanvasObject>,
  p: Vec2,
  exclude: string[]
): { obj: CanvasObject; side: "left" | "right" | "top" | "bottom" } | null {
  let best: { obj: CanvasObject; side: "left" | "right" | "top" | "bottom"; d: number } | null = null;
  for (const o of Object.values(objects)) {
    if (exclude.includes(o.id) || o.kind === "stroke" || o.kind === "arrow") continue;
    const bb = bboxOf(o);
    const cx = clamp(p.x, bb.x, bb.x + bb.w);
    const cy = clamp(p.y, bb.y, bb.y + bb.h);
    const d = Math.hypot(p.x - cx, p.y - cy);
    if (d < 22 && (!best || d < best.d)) best = { obj: o, side: nearestSide(p, bb), d };
  }
  return best ? { obj: best.obj, side: best.side } : null;
}

function syncArrows(s: ReturnType<typeof useStudio.getState>, movedIds: string[]) {
  const b = s.boards[s.activeBoardId];
  if (!b) return;
  for (const o of Object.values(b.objects)) {
    if (o.kind !== "arrow") continue;
    const from = o.fromAttach && movedIds.includes(o.fromAttach.id) ? b.objects[o.fromAttach.id] : null;
    const to = o.toAttach && movedIds.includes(o.toAttach.id) ? b.objects[o.toAttach.id] : null;
    if (!from && !to) continue;
    const patch: Record<string, number> = {};
    if (from) {
      const p = anchorOf(from, o.fromAttach!.side);
      patch.x = p.x;
      patch.y = p.y;
    }
    if (to) {
      const p = anchorOf(to, o.toAttach!.side);
      patch.x2 = p.x - (patch.x ?? o.x);
      patch.y2 = p.y - (patch.y ?? o.y);
    }
    s.patchObject(o.id, patch as ObjectPatch);
  }
}

async function downscale(dataUrl: string, maxW: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= maxW) return resolve(dataUrl);
      const scale = maxW / img.width;
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      const g = c.getContext("2d");
      if (!g) return resolve(dataUrl);
      g.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
