"use client";

/* Tool system: bottom dock (desktop/tablet), compact mobile dock,
   adaptive floating context toolbar for the current selection,
   and the pen colour/size popover. */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  MousePointer2, Pen, Highlighter, Eraser, Type, Pi, Shapes, ArrowUpRight,
  Image as ImageIcon, StickyNote, Network, Sparkles, Mic, Hand, Undo2, Redo2,
  Copy, Trash2, Group, Lock, Unlock, Check, TrendingUp, MoreHorizontal, X,
} from "lucide-react";
import { useStudio } from "./store";
import type { AIMode, CanvasObject, ToolId } from "./types";
import { parseEquation, sampleGraph } from "./lib/math-engine";

const PEN_COLORS = ["#7FB0FF", "#A78BFA", "#3DDC97", "#F5B83D", "#FF7A93", "#39C4F0", "#F4EFE9", "#F2A7FF"];

const TOOLS: { id: ToolId; icon: typeof Pen; label: string; kbd: string; mobile?: boolean }[] = [
  { id: "select", icon: MousePointer2, label: "Select", kbd: "V", mobile: true },
  { id: "pen", icon: Pen, label: "Pen", kbd: "P", mobile: true },
  { id: "highlighter", icon: Highlighter, label: "Highlighter", kbd: "H" },
  { id: "eraser", icon: Eraser, label: "Eraser", kbd: "E" },
  { id: "text", icon: Type, label: "Text", kbd: "T", mobile: true },
  { id: "equation", icon: Pi, label: "Equation", kbd: "F" },
  { id: "shape", icon: Shapes, label: "Shape", kbd: "S" },
  { id: "arrow", icon: ArrowUpRight, label: "Arrow", kbd: "A" },
  { id: "image", icon: ImageIcon, label: "Image", kbd: "I" },
  { id: "sticky", icon: StickyNote, label: "Sticky note", kbd: "N" },
  { id: "diagram", icon: Network, label: "Diagram", kbd: "D" },
  { id: "ai", icon: Sparkles, label: "Ask Canvas AI", kbd: "⌘/", mobile: true },
  { id: "voice", icon: Mic, label: "Voice", kbd: "M" },
  { id: "hand", icon: Hand, label: "Pan", kbd: "Space" },
];

/* ---------------- main dock ---------------- */

export function ToolDock() {
  const tool = useStudio((s) => s.tool);
  const setTool = useStudio((s) => s.setTool);
  const undo = useStudio((s) => s.undo);
  const redo = useStudio((s) => s.redo);
  const past = useStudio((s) => s.past.length);
  const future = useStudio((s) => s.future.length);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="pointer-events-none absolute bottom-5 left-1/2 z-30 -translate-x-1/2">
      <motion.nav
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
        className="st-glass st-dock pointer-events-auto hidden sm:flex"
        role="toolbar"
        aria-label="Canvas tools"
      >
        {TOOLS.slice(0, 11).map((t) => (
          <ToolButton key={t.id} t={t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}
        <span className="st-dock-divider" />
        <ToolButton t={{ id: "ai", icon: Sparkles, label: "Ask Canvas AI", kbd: "⌘/" }} active={tool === "ai"} onClick={() => setTool("ai")} violet />
        <ToolButton t={{ id: "voice", icon: Mic, label: "Voice", kbd: "M" }} active={tool === "voice"} onClick={() => setTool("voice")} />
        <ToolButton t={{ id: "hand", icon: Hand, label: "Pan", kbd: "Space" }} active={tool === "hand"} onClick={() => setTool("hand")} />
        <span className="st-dock-divider" />
        <button type="button" className="st-tool" onClick={undo} disabled={!past} aria-label="Undo" title="Undo — ⌘Z" style={{ opacity: past ? 1 : 0.35 }}>
          <Undo2 size={17} />
        </button>
        <button type="button" className="st-tool" onClick={redo} disabled={!future} aria-label="Redo" title="Redo — ⇧⌘Z" style={{ opacity: future ? 1 : 0.35 }}>
          <Redo2 size={17} />
        </button>
      </motion.nav>

      {/* mobile dock */}
      <motion.nav
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
        className="st-glass st-dock pointer-events-auto flex sm:hidden"
        role="toolbar"
        aria-label="Canvas tools"
      >
        {TOOLS.filter((t) => t.mobile).slice(0, 5).map((t) => (
          <ToolButton key={t.id} t={t} active={tool === t.id} onClick={() => setTool(t.id)} />
        ))}
        <ToolButton
          t={{ id: "more", icon: MoreHorizontal, label: "More tools", kbd: "" }}
          active={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        />
      </motion.nav>

      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            className="st-glass pointer-events-auto absolute bottom-[64px] left-1/2 grid -translate-x-1/2 grid-cols-4 gap-1 rounded-[18px] p-2 sm:hidden"
          >
            {TOOLS.filter((t) => !t.mobile).map((t) => (
              <button
                key={t.id}
                type="button"
                className="st-tool h-11 w-11 rounded-[12px]"
                data-active={tool === t.id}
                onClick={() => {
                  setTool(t.id);
                  setMoreOpen(false);
                }}
                aria-label={t.label}
              >
                <t.icon size={18} />
                <span className="sr-only">{t.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <PenPopover tool={tool} />
    </div>
  );
}

function ToolButton({
  t,
  active,
  onClick,
  violet,
}: {
  t: { id: string; icon: typeof Pen; label: string; kbd: string };
  active: boolean;
  onClick: () => void;
  violet?: boolean;
}) {
  return (
    <button type="button" className="st-tool" data-active={active} onClick={onClick} aria-label={`${t.label}${t.kbd ? ` — ${t.kbd}` : ""}`} aria-pressed={active}>
      <t.icon size={17} style={violet ? { color: active ? "#fff" : "var(--st-accent)" } : undefined} />
      {t.kbd && (
        <span className="st-tip">
          {t.label}
          <span className="st-kbd">{t.kbd}</span>
        </span>
      )}
    </button>
  );
}

/* ---------------- pen popover ---------------- */

function PenPopover({ tool }: { tool: ToolId }) {
  const open = tool === "pen" || tool === "highlighter";
  const color = useStudio((s) => s.penColor);
  const size = useStudio((s) => s.penSize);
  const setColor = useStudio((s) => s.setPenColor);
  const setSize = useStudio((s) => s.setPenSize);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="st-glass st-ui pointer-events-auto absolute bottom-[64px] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2.5"
          role="group"
          aria-label="Pen colour and size"
        >
          <div className="flex gap-1.5">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded-full transition-transform hover:scale-110"
                style={{ background: c, outline: color === c ? "2px solid #fff" : "none", outlineOffset: 2 }}
                onClick={() => setColor(c)}
                aria-label={`Colour ${c}`}
                aria-pressed={color === c}
              >
                {color === c && <Check size={11} color="#241104" />}
              </button>
            ))}
          </div>
          <span className="st-dock-divider" />
          <div className="flex gap-1">
            {[2, 3.5, 6].map((s) => (
              <button
                key={s}
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: size === s ? "rgba(255,171,98,0.2)" : "transparent" }}
                onClick={() => setSize(s)}
                aria-label={`Size ${s}`}
                aria-pressed={size === s}
              >
                <span className="rounded-full bg-[var(--st-ink)]" style={{ width: s + 2.5, height: s + 2.5 }} />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- floating context toolbar ---------------- */

export function ContextToolbar() {
  const selection = useStudio((s) => s.selection);
  const board = useStudio((s) => s.boards[s.activeBoardId]);
  const st = useStudio.getState;
  const [closed, setClosed] = useState(false);

  const info = useMemo(() => {
    const objs = selection.map((id) => board?.objects[id]).filter(Boolean) as CanvasObject[];
    if (!objs.length) return { math: false, concept: false };
    const math = objs.some(
      (o) =>
        o.kind === "equation" ||
        (o.kind === "text" && /\d\s*[+\-*/^=]|=\s*\d|[a-z]\s*[\+\-\*/]\s*\d/i.test(o.text))
    );
    const concept = objs.some((o) =>
      ["text", "sticky", "ainote", "diagram", "image", "code", "table"].includes(o.kind)
    );
    return { math, concept };
  }, [selection, board]);

  if (!selection.length || closed) {
    if (closed && selection.length) return <DismissChip onReopen={() => setClosed(false)} />;
    return null;
  }

  const runMode = (m: AIMode) => st().askAI(m);
  const count = selection.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="st-glass st-ui absolute left-1/2 top-[68px] z-30 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-1.5"
      role="toolbar"
      aria-label="Selection actions"
    >
      {(info.math || info.concept) && (
        <>
          <span className="st-chip mr-1 border-[rgba(255,158,61,0.4)] text-[#ffd9ae]">code</span>
          {info.math && (
            <>
              <Chip label="Solve" onClick={() => runMode("solve")} />
              <Chip label="Check" onClick={() => runMode("check")} />
              <Chip label="Graph" onClick={graphSelection} icon={<TrendingUp size={11} />} />
            </>
          )}
          {info.concept && (
            <>
              {info.math && <span className="st-dock-divider" />}
              <Chip label="Explain" onClick={() => runMode("explain")} />
              <Chip label="Simplify" onClick={() => runMode("simplify")} />
              <Chip label="Visualize" onClick={() => runMode("visualize")} />
              <Chip label="Quiz me" onClick={() => runMode("quiz")} />
            </>
          )}
          <span className="st-dock-divider" />
        </>
      )}
      <IconAct icon={Copy} label={`Duplicate (${count})`} onClick={() => st().duplicateObjects(st().selection)} />
      {count > 1 && <IconAct icon={Group} label="Group" onClick={() => st().groupSelection()} />}
      {count === 1 && <IconAct icon={Unlock} label="Lock" onClick={() => st().toggleLock(st().selection[0])} />}
      <IconAct icon={Trash2} label="Delete" danger onClick={() => st().removeObjects(st().selection)} />
      <button type="button" className="st-tool h-7 w-7" onClick={() => setClosed(true)} aria-label="Hide actions">
        <X size={13} />
      </button>
    </motion.div>
  );
}

function DismissChip({ onReopen }: { onReopen: () => void }) {
  return (
    <button type="button" className="st-glass absolute left-1/2 top-[68px] z-30 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] text-[var(--st-faint)]" onClick={onReopen}>
      selection actions ↑
    </button>
  );
}

function Chip({ label, onClick, icon }: { label: string; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button type="button" className="rounded-full px-3 py-1.5 text-[11.5px] font-medium text-[#ffd9ae] transition-colors hover:bg-[rgba(255,158,61,0.18)]" onClick={onClick}>
      {icon}
      {label}
    </button>
  );
}

function IconAct({ icon: Icon, label, onClick, danger }: { icon: typeof Copy; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      type="button"
      className="st-tool h-7 w-7"
      style={danger ? { color: "var(--st-rose)" } : undefined}
      onClick={onClick}
      aria-label={label}
    >
      <Icon size={13.5} />
      <span className="st-tip st-tip-top">{label}</span>
    </button>
  );
}

/* ---------------- graph action (real plotting, offline) ---------------- */

function graphSelection() {
  const st = useStudio.getState();
  const b = st.boards[st.activeBoardId];
  if (!b) return;
  const sel = st.selection.map((id) => b.objects[id]).filter(Boolean);
  let latex: string | null = null;
  for (const o of sel) {
    if (o.kind === "equation") latex = o.latex;
    else if (o.kind === "text" && /\band|=/i.test(o.text)) latex = o.text;
  }
  if (!latex) return;
  const parsed = parseEquation(latex);
  if (!parsed || parsed.kind === "identity" || parsed.kind === "none") return;
  const g = sampleGraph(parsed.poly);
  if (!g) return;
  const PAD = 26;
  const W = 380;
  const H = 260;
  const ys = g.points.map((p) => p.y);
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const px = (x: number) => PAD + ((x - g.xMin) / (g.xMax - g.xMin)) * (W - PAD * 2);
  const py = (y: number) => H - PAD - ((y - yMin) / (yMax - yMin || 1)) * (H - PAD * 2);
  const nodes = [
    { id: "plot", label: "", x: 0, y: 0, w: W, h: H, shape: "rounded" as const, fill: "rgba(21,22,28,0.92)", text: "" },
    ...g.roots.map((r, i) => ({
      id: `root${i}`, label: "", x: Math.max(2, px(r) - 36), y: Math.max(2, py(0) - 30), w: 72, h: 26, shape: "pill" as const, fill: "rgba(61,220,151,0.16)", text: `x = ${Math.round(r * 100) / 100}`,
    })),
    ...(g.vertex
      ? [{ id: "vtx", label: "", x: Math.max(2, px(g.vertex.x) - 46), y: Math.max(2, py(g.vertex.y) - 30), w: 92, h: 26, shape: "pill" as const, fill: "rgba(167,139,250,0.14)", text: `vertex ${Math.round(g.vertex.x * 100) / 100}, ${Math.round(g.vertex.y * 100) / 100}` }]
      : []),
  ];
  st.addObject({
    kind: "diagram",
    x: Math.round((-st.camera.x + st.viewport.w / 2) / st.camera.z) - W / 2,
    y: Math.round((-st.camera.y + st.viewport.h / 2) / st.camera.z) - H / 2,
    w: W, h: H,
    title: latex.slice(0, 40),
    nodes,
    edges: [],
    poly: parsed.poly,
  });
}
