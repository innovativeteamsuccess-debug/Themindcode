"use client";

/* Top chrome: brand, board title (inline rename), save state,
   zoom cluster, generate/export/settings, AI panel toggle. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  PanelLeft, Check, Loader2, ZoomIn, ZoomOut, Maximize,
  Wand2, Download, Settings2, Keyboard, Sparkles, ChevronDown,
  ArrowUpLeft, MessageCircleCode, GraduationCap,
} from "lucide-react";
import { useStudio } from "./store";
import { StudioWordmark } from "./brand";

export default function TopBar({ onLesson }: { onLesson?: () => void }) {
  const board = useStudio((s) => s.boards[s.activeBoardId]);
  const saved = useStudio((s) => s.saved);
  const camera = useStudio((s) => s.camera);
  const sidebarOpen = useStudio((s) => s.sidebarOpen);
  const aiPanelOpen = useStudio((s) => s.aiPanelOpen);

  const zoomPct = Math.round(camera.z * 100);

  return (
    <header className="st-glass relative z-40 flex h-[54px] shrink-0 items-center gap-2 rounded-none border-x-0 border-t-0 px-3 md:px-4">
      <button type="button" className="st-btn h-8 w-8 shrink-0" onClick={() => useStudio.getState().toggle("sidebarOpen")} aria-label="Toggle workspace sidebar" aria-pressed={sidebarOpen}>
        <PanelLeft size={15} />
      </button>

      <div className="hidden md:block">
        <StudioWordmark />
      </div>
      <div className="md:hidden">
        <StudioWordmark compact />
      </div>

      <span className="st-dock-divider mx-1 hidden md:block" style={{ height: 22 }} />

      {/* board title — remounts per board so state never syncs via effect */}
      <BoardTitle key={board?.id ?? "none"} initial={board?.title ?? ""} boardId={board?.id ?? ""} />

      {/* save state */}
      <span className="hidden items-center gap-1.5 sm:flex" aria-live="polite">
        {saved === "saving" ? (
          <>
            <Loader2 size={11} className="animate-spin text-[var(--st-faint)]" />
            <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] uppercase tracking-[0.18em] text-[var(--st-faint)]">saving</span>
          </>
        ) : (
          <>
            <Check size={11} className="text-[var(--st-emerald)]" />
            <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] uppercase tracking-[0.18em] text-[var(--st-faint)]">saved</span>
          </>
        )}
      </span>

      <div className="flex-1" />

      {/* zoom cluster */}
      <div className="st-ui hidden items-center gap-0.5 rounded-full border border-[var(--st-line)] px-1 py-0.5 md:flex">
        <button type="button" className="st-btn h-7 w-7 border-none" onClick={() => useStudio.getState().zoomBy(1 / 1.18)} aria-label="Zoom out">
          <ZoomOut size={13} />
        </button>
        <span className="w-[46px] text-center font-[family-name:var(--font-code-mono)] text-[10px] text-[var(--st-dim)]" aria-live="polite">
          {zoomPct}%
        </span>
        <button type="button" className="st-btn h-7 w-7 border-none" onClick={() => useStudio.getState().zoomBy(1.18)} aria-label="Zoom in">
          <ZoomIn size={13} />
        </button>
        <button type="button" className="st-btn h-7 w-7 border-none" onClick={() => useStudio.getState().zoomToFit()} aria-label="Zoom to fit">
          <Maximize size={12} />
        </button>
      </div>

      <button
        type="button"
        className="st-btn st-btn-ai h-8 px-2.5 text-[11.5px]"
        onClick={onLesson}
        aria-label="Start a whiteboard lesson"
        data-cursor="interactive"
      >
        <GraduationCap size={13} />
        <span className="hidden lg:inline">Lesson</span>
      </button>
      <button type="button" className="st-btn h-8 px-2.5 text-[11.5px]" onClick={() => useStudio.getState().setGenerate("notes")} aria-label="Generate study material">
        <Wand2 size={13} />
        <span className="hidden lg:inline">Generate</span>
      </button>
      {/* CODE — the mascot companion, woven into the studio */}
      <Link
        href="/code"
        className="st-btn st-btn-ai hidden h-8 px-2.5 text-[11.5px] sm:flex"
        aria-label="Ask CODE, the AI companion"
        data-cursor="interactive"
      >
        <MessageCircleCode size={13} />
        <span className="hidden lg:inline">Ask CODE</span>
      </Link>
      <Link
        href="/"
        className="st-btn hidden h-8 w-8 md:flex"
        aria-label="Back to The Mind Code"
        data-cursor="interactive"
      >
        <ArrowUpLeft size={14} />
      </Link>

      <button type="button" className="st-btn h-8 w-8" onClick={() => useStudio.getState().toggle("exportOpen")} aria-label="Export board">
        <Download size={14} />
      </button>
      <button type="button" className="st-btn st-btn-ai h-8 w-8" onClick={() => useStudio.getState().toggle("aiPanelOpen")} aria-label="Toggle AI panel" aria-pressed={aiPanelOpen}>
        <Sparkles size={14} />
      </button>
      <button type="button" className="st-btn hidden h-8 w-8 sm:flex" onClick={() => useStudio.getState().toggle("shortcutsOpen")} aria-label="Keyboard shortcuts">
        <Keyboard size={14} />
      </button>
      <button type="button" className="st-btn h-8 w-8" onClick={() => useStudio.getState().toggle("settingsOpen")} aria-label="Settings">
        <Settings2 size={14} />
      </button>
    </header>
  );
}

function BoardTitle({ initial, boardId }: { initial: string; boardId: string }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initial);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    setEditing(false);
    if (boardId && title.trim() && title.trim() !== initial) {
      useStudio.getState().renameBoard(boardId, title.trim());
    } else {
      setTitle(initial);
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="st-input min-w-0 max-w-[260px] flex-1 px-2.5 py-1 text-[13px] font-medium"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setTitle(initial);
            setEditing(false);
          }
        }}
        aria-label="Board name"
        autoFocus
      />
    );
  }
  return (
    <button
      type="button"
      className="group flex min-w-0 items-center gap-1.5 rounded-lg px-2.5 py-1 transition-colors hover:bg-[rgba(255,171,98,0.08)]"
      onClick={() => setEditing(true)}
      aria-label={`Rename board ${initial}`}
    >
      <span className="truncate text-[13px] font-medium text-[var(--st-ink)]">{initial || "—"}</span>
      <ChevronDown size={12} className="shrink-0 text-[var(--st-faint)] opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}
