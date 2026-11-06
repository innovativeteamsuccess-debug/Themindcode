"use client";

/* CODE STUDIO — app shell.
   Composition root: chrome + canvas + AI layer + overlays,
   global keyboard shortcuts, settings side-effects. */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import "./studio.css";
import { useStudio } from "./store";
import { StudioMark } from "./brand";
import TopBar from "./TopBar";
import WorkspaceSidebar from "./WorkspaceSidebar";
import Canvas from "./Canvas";
import { ToolDock, ContextToolbar } from "./Toolbar";
import AIPanel from "./AIPanel";
import AICommandBar from "./AICommandBar";
import CommandPalette from "./CommandPalette";
import { GenerateDialog, ExportDialog } from "./GenerateDialog";
import { Overlays } from "./SettingsPanel";
import VoiceOverlay from "./VoiceOverlay";
import { useLesson } from "./lesson/useLesson";
import { LessonStart } from "./lesson/LessonStart";
import { AskBar, LessonHUD, TeacherPresence } from "./lesson/LessonChrome";
import type { ToolId } from "./types";

const TOOL_KEYS: Record<string, ToolId> = {
  v: "select",
  p: "pen",
  h: "highlighter",
  e: "eraser",
  t: "text",
  f: "equation",
  s: "shape",
  a: "arrow",
  i: "image",
  n: "sticky",
  d: "diagram",
  m: "voice",
};

export default function StudioApp() {
  const hydrated = useStudio((s) => s.hydrated);
  const settings = useStudio((s) => s.settings);
  const lessonPhase = useStudio((s) => s.lesson.phase);
  const authRequired = useStudio((s) => s.lesson.authRequired);
  const lesson = useLesson();
  const [startOpen, setStartOpen] = useState(false);
  const nudgeRef = useRef(0);

  /* boot store from persistence */
  useEffect(() => {
    useStudio.getState().init();
  }, []);

  /* global keyboard map */
  useEffect(() => {
    function isTyping(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      return Boolean(
        t &&
          (t.tagName === "INPUT" ||
            t.tagName === "TEXTAREA" ||
            t.isContentEditable ||
            t.closest(".st-ui input, .st-ui textarea"))
      );
    }

    async function onKey(e: KeyboardEvent) {
      const st = useStudio.getState();
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // palette works even while typing
      if (mod && key === "k") {
        e.preventDefault();
        st.toggle("paletteOpen");
        return;
      }
      if (isTyping(e)) return;

      if (mod) {
        switch (key) {
          case "z":
            e.preventDefault();
            if (e.shiftKey) st.redo();
            else st.undo();
            return;
          case "d":
            e.preventDefault();
            st.duplicateObjects(st.selection);
            return;
          case "c":
            st.copySelection();
            return;
          case "x":
            st.cutSelection();
            return;
          case "v":
            st.paste();
            return;
          case "g":
            e.preventDefault();
            if (e.shiftKey) st.ungroupSelection();
            else st.groupSelection();
            return;
          case "l":
            e.preventDefault();
            if (st.selection[0]) st.toggleLock(st.selection[0]);
            return;
          case "a":
            e.preventDefault();
            st.selectAll();
            return;
          case "/":
            e.preventDefault();
            st.toggle("aiBarOpen");
            return;
          case "s":
            e.preventDefault();
            st.persistNow();
            return;
          default:
            return;
        }
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (st.selection.length) {
          e.preventDefault();
          st.removeObjects(st.selection);
        }
        return;
      }

      if (e.key.startsWith("Arrow") && st.selection.length) {
        e.preventDefault();
        const step = e.shiftKey ? 1 : 12;
        const now = Date.now();
        if (now - nudgeRef.current > 700) st.beginGesture();
        nudgeRef.current = now;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const b = st.boards[st.activeBoardId];
        if (!b) return;
        for (const id of st.selection) {
          const o = b.objects[id];
          if (o && !o.locked) st.patchObject(id, { x: o.x + dx, y: o.y + dy } as never);
        }
        st.persistNow();
        return;
      }

      if (e.key === "?") {
        st.toggle("shortcutsOpen");
        return;
      }
      if (e.key === "+" || e.key === "=") {
        st.zoomBy(1.18);
        return;
      }
      if (e.key === "-") {
        st.zoomBy(1 / 1.18);
        return;
      }
      if (e.key === "0") {
        st.setCamera({ x: st.viewport.w / 2, y: st.viewport.h / 2, z: 0.9 });
        return;
      }
      if (e.key === "!" && e.shiftKey) {
        st.zoomToFit();
        return;
      }
      if (e.key === "Escape") {
        st.clearSelection();
        st.setEditing(null);
        if (st.aiBarOpen) st.toggle("aiBarOpen");
        return;
      }

      const tool = TOOL_KEYS[key];
      if (tool && !mod) st.setTool(tool);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!hydrated) {
    return (
      <div className="st-scope fixed inset-0 flex items-center justify-center bg-[#050C18]">
        <StudioMark size={40} pulse />
      </div>
    );
  }

  return (
    <div
      className={`st-scope st-screen fixed inset-0 z-[100] flex flex-col overflow-hidden ${settings.reduceMotion ? "st-rm" : ""} ${settings.highContrast ? "st-hc" : ""}`}
    >
      <TopBar onLesson={() => setStartOpen(true)} />
      <div className="relative flex min-h-0 flex-1">
        <WorkspaceSidebar />
        <main className="relative min-w-0 flex-1">
          <Canvas />
          <ContextToolbar />
          <ToolDock />
          <AICommandBar />

          {/* ---------- lesson mode (the Whiteboard Tutor) ---------- */}
          <AnimatePresence>
            {startOpen && lessonPhase === "idle" && (
              <LessonStart
                key="lesson-start"
                onStart={(c) => {
                  setStartOpen(false);
                  void lesson.start(c);
                }}
                onClose={() => setStartOpen(false)}
              />
            )}
          </AnimatePresence>

          {lessonPhase !== "idle" && (
            <>
              <LessonHUD
                onPause={lesson.pause}
                onResume={lesson.resume}
                onEnd={lesson.end}
                onVoice={lesson.setVoice}
                onNew={() => {
                  lesson.end();
                  useStudio.getState().lessonPatch({ phase: "idle" });
                  setStartOpen(true);
                }}
              />
              <AnimatePresence>{lessonPhase !== "error" && <TeacherPresence key="teacher" />}</AnimatePresence>
              <AskBar onSend={lesson.answer} disabled={lessonPhase === "planning"} />
              {authRequired && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#04101F]/78 backdrop-blur-md">
                  <div className="ls-panel st-ui w-[min(430px,90vw)] rounded-3xl border border-[var(--st-line)] bg-[#081426]/95 p-7 text-center shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]">
                    <div className="text-[19px] font-semibold text-[#F5EFE3]">One quick step — log in</div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-[#9FB4D8]">
                      CODE's lessons are free, but your account keeps the teacher running for every student. Log in and continue exactly where you stopped.
                    </p>
                    <a href="/sign-in?redirect_url=%2Fstudio" className="ls-start mt-5 flex items-center justify-center gap-2 no-underline">
                      LOG IN TO CONTINUE
                    </a>
                    <button
                      className="ls-chipbtn mt-3"
                      onClick={() => useStudio.getState().lessonPatch({ phase: "idle", authRequired: false })}
                    >
                      Back to the studio
                    </button>
                  </div>
                </div>
              )}
              {lessonPhase === "error" && !authRequired && useStudio.getState().lesson.error && (
                <div className="ls-errtoast st-ui">{useStudio.getState().lesson.error}</div>
              )}
            </>
          )}
        </main>
        <AIPanel />
      </div>

      <CommandPalette />
      <GenerateDialog />
      <ExportDialog />
      <Overlays />
      <VoiceOverlay />
    </div>
  );
}
