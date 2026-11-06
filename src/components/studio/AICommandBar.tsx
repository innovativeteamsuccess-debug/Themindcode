"use client";

/* "Ask Canvas AI…" command bar — floats above the dock.
   Free-text ask + mode chips + voice. */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Mic, Sparkles, X } from "lucide-react";
import { useStudio } from "./store";
import { AI_MODES, type AIMode } from "./types";

export default function AICommandBar() {
  const open = useStudio((s) => s.aiBarOpen);
  const busy = useStudio((s) => s.aiBusy);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(prompt?: string, mode: AIMode = "ask") {
    const text = (prompt ?? value).trim();
    if (!text || busy) return;
    // intent sniffing → route to the best mode
    const q = text.toLowerCase();
    let m: AIMode = mode;
    if (mode === "ask") {
      if (/^(solve|simplify|solved)/.test(q) || /solve (this|it)/.test(q)) m = "solve";
      else if (/^(explain|why|how)/.test(q)) m = "explain";
      else if (/quiz/.test(q)) m = "quiz";
      else if (/diagram|draw|visuali/.test(q)) m = "visualize";
      else if (/hint|stuck/.test(q)) m = "hint";
      else if (/simpler|simplify|easier/.test(q)) m = "simplify";
      else if (/check|wrong|mistake/.test(q)) m = "check";
      else if (/revis|notes/.test(q)) m = "revise";
      else if (/summar/.test(q)) m = "summary";
      else if (/practice|similar question/.test(q)) m = "practice";
    }
    useStudio.getState().askAI(m, text);
    setValue("");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="st-glass st-ui absolute bottom-[76px] left-1/2 z-30 w-[min(620px,calc(100vw-24px))] -translate-x-1/2 rounded-[22px] p-2.5"
          role="form"
          aria-label="Ask Canvas AI"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--st-accent-soft)]">
              <Sparkles size={14} className="text-[var(--st-accent)]" />
            </span>
            <input
              ref={inputRef}
              className="min-w-0 flex-1 bg-transparent text-[13.5px] text-[var(--st-ink)] outline-none placeholder:text-[var(--st-faint)]"
              placeholder="Ask Canvas AI…  e.g.  Why is my answer wrong?"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
                if (e.key === "Escape") useStudio.getState().toggle("aiBarOpen");
                e.stopPropagation();
              }}
              aria-label="Ask Canvas AI"
            />
            <button
              type="button"
              className="st-btn h-8 w-8 shrink-0"
              onClick={() => useStudio.getState().setVoiceOpen(true)}
              aria-label="Speak instead"
            >
              <Mic size={14} />
            </button>
            <button
              type="button"
              className="st-btn st-btn-primary h-8 w-8 shrink-0 rounded-full"
              onClick={() => submit()}
              disabled={busy || !value.trim()}
              style={{ opacity: busy || !value.trim() ? 0.5 : 1 }}
              aria-label="Send to CODE"
            >
              <ArrowUp size={14} />
            </button>
            <button type="button" className="st-btn h-8 w-8 shrink-0" onClick={() => useStudio.getState().toggle("aiBarOpen")} aria-label="Close ask bar">
              <X size={13} />
            </button>
          </div>
          <div className="st-scroll mt-2 flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {AI_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                className="st-chip shrink-0 transition-colors hover:border-[rgba(255,158,61,0.5)] hover:text-[#ffd9ae]"
                onClick={() => submit(undefined, m.id)}
                title={m.hint}
              >
                {m.label}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
