"use client";

/* Right-click menu — object actions + AI shortcuts on the spot. */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CanvasObject, Vec2 } from "./types";
import { useStudio } from "./store";

export interface CtxItem {
  label: string;
  kbd?: string;
  danger?: boolean;
  onSelect: () => void;
}

export default function ContextMenu({
  info,
  onClose,
  hitTest,
}: {
  info: { x: number; y: number; target?: string } | null;
  onClose: () => void;
  hitTest: (p: Vec2) => CanvasObject | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!info) return;
    const close = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as HTMLElement)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", esc);
    };
  }, [info, onClose]);

  const selCount = useStudio((st) => st.selection.length);

  if (!info) return null;
  const st = useStudio.getState();
  const board = st.boards[st.activeBoardId];
  const target = info.target ? board?.objects[info.target] : null;
  const selIds = st.selection;
  void selCount;

  const items: CtxItem[] = [];
  if (target) {
    const id = target.id;
    items.push(
      { label: "Duplicate", kbd: "⌘D", onSelect: () => st.duplicateObjects([id]) },
      { label: "Copy", kbd: "⌘C", onSelect: () => { st.select([id]); st.copySelection(); } },
      { label: target.locked ? "Unlock" : "Lock", kbd: "⌘L", onSelect: () => st.toggleLock(id) },
      { label: "Bring to front", onSelect: () => st.bringToFront(id) },
      { label: "Delete", kbd: "⌫", danger: true, onSelect: () => st.removeObjects([id]) }
    );
    if (selIds.length > 1) {
      items.splice(4, 0, {
        label: `Group ${selIds.length}`,
        kbd: "⌘G",
        onSelect: () => st.groupSelection(),
      });
    }
  } else {
    items.push(
      { label: "Paste", kbd: "⌘V", onSelect: () => st.paste() },
      { label: "Select all", kbd: "⌘A", onSelect: () => st.selectAll() },
      { label: "Zoom to fit", kbd: "⇧1", onSelect: () => st.zoomToFit() }
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, scale: 0.95, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.13 }}
        className="st-glass fixed z-[90] min-w-[190px] rounded-[14px] p-1.5"
        style={{ left: Math.min(info.x, window.innerWidth - 220), top: Math.min(info.y, window.innerHeight - 260) }}
        role="menu"
        aria-label="Canvas context menu"
      >
        {items.map((item) => (
          <button
            key={item.label}
            type="button"
            role="menuitem"
            className={`flex w-full items-center justify-between rounded-[9px] px-3 py-2 text-left text-[12.5px] transition-colors ${
              item.danger ? "text-[var(--st-rose)] hover:bg-[var(--st-rose-soft)]" : "text-[var(--st-dim)] hover:bg-[rgba(255,171,98,0.09)] hover:text-[var(--st-ink)]"
            }`}
            onClick={() => {
              item.onSelect();
              onClose();
            }}
          >
            {item.label}
            {item.kbd && <span className="st-kbd">{item.kbd}</span>}
          </button>
        ))}
        {target && (
          <div className="mt-1 border-t border-[var(--st-line)] pt-1.5">
            <div className="px-3 pb-1 font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.2em] text-[var(--st-faint)]">
              ask CODE
            </div>
            {(["explain", "visualize", "quiz"] as const).map((m) => (
              <button
                key={m}
                type="button"
                className="flex w-full items-center gap-2 rounded-[9px] px-3 py-2 text-left text-[12.5px] capitalize text-[var(--st-dim)] transition-colors hover:bg-[rgba(255,158,61,0.12)] hover:text-[#ffd9ae]"
                onClick={() => {
                  st.askAI(m);
                  onClose();
                }}
              >
                <span className="h-1 w-1 rounded-full bg-[var(--st-accent)]" />
                {m} this
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
