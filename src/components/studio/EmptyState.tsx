"use client";

/* The anti-blank-canvas. Appears only when a board is truly empty. */

import { motion } from "framer-motion";
import { PenLine, Type, Sparkles, Mic } from "lucide-react";
import { useStudio } from "./store";
import { StudioMark } from "./brand";
import { STARTER_LABELS } from "./lib/starter-boards";
import { buildStarterBoards } from "./lib/starter-boards";

const QUICK = [
  { icon: Type, label: "Write something", action: () => quickCreate("text") },
  { icon: PenLine, label: "Draw something", action: () => useStudio.getState().setTool("pen") },
  { icon: Sparkles, label: "Ask Canvas AI", action: () => useStudio.getState().setAI({ aiBarOpen: true }) },
  { icon: Mic, label: "Speak to the canvas", action: () => useStudio.getState().setVoiceOpen(true) },
] as const;

function quickCreate(kind: "text") {
  const s = useStudio.getState();
  const center = {
    x: (-s.camera.x + s.viewport.w / 2) / s.camera.z,
    y: (-s.camera.y + s.viewport.h / 2) / s.camera.z,
  };
  if (kind === "text") {
    const id = s.addObject({ kind: "text", x: center.x - 120, y: center.y - 22, w: 260, h: 44, text: "", color: "#F4EFE9", size: 16 });
    s.select([id]);
    s.setEditing(id);
    s.setTool("select");
  }
}

export default function EmptyState() {
  function loadStarter(title: string) {
    const s = useStudio.getState();
    const folderId = s.folders[0]?.id ?? null;
    const starters = buildStarterBoards("f-math", "f-sci", "f-proj");
    const match = starters.find((b) => b.title === title);
    if (match) {
      s.createBoard(match.folderId ?? folderId, match.title, match.objects);
    }
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto flex max-w-[520px] flex-col items-center px-6 text-center"
      >
        <StudioMark size={46} pulse />
        <h2 className="mt-5 font-[family-name:var(--font-serif-display)] text-[30px] leading-tight text-[var(--st-ink)]">
          Start building your lesson
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--st-faint)]">
          An infinite canvas for thinking. Write, sketch, drop an equation — and CODE,
          the studio's tutor, teaches right here on the board.
        </p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
          {QUICK.map((q) => (
            <button key={q.label} type="button" className="st-btn px-3.5 py-2 text-[12px]" onClick={q.action}>
              <q.icon size={13} />
              {q.label}
            </button>
          ))}
        </div>

        <div className="mt-9">
          <p className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.28em] text-[var(--st-faint)]">
            or open a starter board
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {Object.keys(STARTER_LABELS).map((title) => {
              const meta = STARTER_LABELS[title];
              return (
                <button
                  key={title}
                  type="button"
                  onClick={() => loadStarter(title)}
                  className="group flex items-center gap-2.5 rounded-full border border-[var(--st-line)] bg-[rgba(21,22,28,0.6)] px-3.5 py-2 transition-all hover:-translate-y-0.5 hover:border-[var(--st-line-2)]"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: meta.hue }} />
                  <span className="text-[12px] font-medium text-[var(--st-dim)] group-hover:text-[var(--st-ink)]">{meta.title}</span>
                  <span className="hidden text-[10.5px] text-[var(--st-faint)] sm:inline">{meta.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-9 hidden items-center gap-1.5 text-[10.5px] text-[var(--st-faint)] sm:flex">
          <span>tip — press</span>
          <span className="st-kbd">P</span>
          <span>to draw,</span>
          <span className="st-kbd">T</span>
          <span>to write,</span>
          <span className="st-kbd">⌘K</span>
          <span>for everything</span>
        </div>
      </motion.div>
    </div>
  );
}
