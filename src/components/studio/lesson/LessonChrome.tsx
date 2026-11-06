"use client";

/* ============================================================
   LESSON MODE — teacher presence + HUD + ask bar.

   TeacherPresence: small corner card (mascot face + live subtitle
   + state pulse). The board stays the hero.
   LessonHUD: lesson title, step progress, pause/resume, voice,
   checkpoints menu, end lesson.
   AskBar: bottom input with mic dictation + quick chips; every
   utterance becomes either the awaited answer or a soft interrupt.
   ============================================================ */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff, Pause, Play, Flag, Volume2, VolumeX, Bookmark, ChevronDown, Send, Sparkles } from "lucide-react";
import { useStudio } from "../store";
import { listen, sttAvailable } from "./voice";
import type { Verdict } from "./types";

/* ---------------- teacher presence ---------------- */

const FACE = {
  planning: "/mascot/code-face-thinking.png",
  teaching: "/mascot/code-focused.png",
  question: "/mascot/code-face-thinking.png",
  paused: "/mascot/code-face.png",
  done: "/mascot/code-face.png",
  error: "/mascot/code-face.png",
} as const;

export function TeacherPresence() {
  const lesson = useStudio((s) => s.lesson);
  const face = FACE[(lesson.phase as keyof typeof FACE) in FACE ? (lesson.phase as keyof typeof FACE) : "teaching"];
  const stateLabel =
    lesson.phase === "planning" ? "Planning the lesson…" :
    lesson.phase === "question" ? "Waiting for your answer" :
    lesson.phase === "paused" ? "Paused" :
    lesson.phase === "done" ? "Lesson complete" :
    lesson.phase === "error" ? "Something hiccupped" : "Teaching";

  return (
    <motion.div
      className="ls-teacher st-ui"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 14 }}
    >
      <div className="relative shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={face} alt="CODE, your AI teacher" className="ls-teacher-face" draggable={false} />
        {(lesson.phase === "teaching" || lesson.phase === "planning") && (
          <span className="ls-teacher-pulse" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.24em] text-[#7FA7E8]">
            CODE · {stateLabel}
          </span>
          {lesson.verdict && lesson.phase !== "teaching" && <VerdictBadge v={lesson.verdict} />}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            key={lesson.say.slice(0, 24) + lesson.say.length}
            className="ls-teacher-say"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.22 }}
          >
            {lesson.say}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function VerdictBadge({ v }: { v: Verdict }) {
  const map: Record<Verdict, { t: string; c: string }> = {
    good: { t: "Correct! ✓", c: "#3DDC97" },
    partly: { t: "Almost — let's fix it", c: "#F5B83D" },
    wrong: { t: "Not quite", c: "#FF7A93" },
    ack: { t: "Good question", c: "#7FA7E8" },
  };
  const s = map[v];
  return (
    <span className="ls-verdict" style={{ color: s.c, borderColor: `${s.c}55` }}>
      {s.t}
    </span>
  );
}

/* ---------------- lesson HUD ---------------- */

export function LessonHUD({
  onPause, onResume, onEnd, onVoice, onNew,
}: {
  onPause: () => void; onResume: () => void; onEnd: () => void; onVoice: (v: boolean) => void; onNew: () => void;
}) {
  const lesson = useStudio((s) => s.lesson);
  const [cpOpen, setCpOpen] = useState(false);
  const progress = lesson.stepTotal ? Math.round((lesson.stepIndex / lesson.stepTotal) * 100) : 0;
  const running = lesson.phase === "teaching" || lesson.phase === "question" || lesson.phase === "planning";

  return (
    <div className="ls-hud st-ui">
      <div className="ls-hud-left">
        <Sparkles size={13} className="text-[#FFB84D]" />
        <span className="ls-hud-title">{lesson.title || "Lesson"}</span>
        <span className="ls-hud-step">
          {lesson.stepTotal ? `${Math.min(lesson.stepIndex + 1, lesson.stepTotal)} / ${lesson.stepTotal}` : "…"}
        </span>
      </div>

      <div className="ls-hud-progress" aria-hidden>
        <span style={{ width: `${progress}%` }} />
      </div>

      <div className="ls-hud-right">
        <button className="ls-hudbtn" onClick={() => onVoice(!lesson.voice)} title={lesson.voice ? "Voice on" : "Voice off"}>
          {lesson.voice ? <Volume2 size={14} /> : <VolumeX size={14} />}
        </button>
        <button className="ls-hudbtn" onClick={running ? onPause : onResume} title={running ? "Pause" : "Resume"}>
          {running ? <Pause size={14} /> : <Play size={14} />}
        </button>

        <div className="relative">
          <button className="ls-hudbtn" onClick={() => setCpOpen(!cpOpen)} title="Board checkpoints">
            <Bookmark size={14} />
            {lesson.checkpoints.length > 0 && <span className="ls-hudbadge">{lesson.checkpoints.length}</span>}
          </button>
          {cpOpen && (
            <div className="ls-cpmenu">
              {lesson.checkpoints.length === 0 && <div className="px-3 py-2 text-[11.5px] text-[#9FB4D8]">No checkpoints yet — they appear as the lesson progresses.</div>}
              {[...lesson.checkpoints].reverse().map((c) => (
                <button
                  key={c.name}
                  className="ls-cpitem"
                  onClick={() => {
                    useStudio.getState().restoreCheckpoint(c.name);
                    setCpOpen(false);
                  }}
                >
                  <Flag size={11} className="text-[#FFB84D]" /> {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="ls-hudbtn ls-hudbtn-new" onClick={onNew} title="New lesson">
          New
        </button>
        <button className="ls-hudbtn ls-hudbtn-end" onClick={onEnd} title="End lesson">
          End
        </button>
      </div>
    </div>
  );
}

/* ---------------- ask bar ---------------- */

const CHIPS = ["Explain simpler", "Why is that so?", "Another example", "Continue"];

export function AskBar({ onSend, disabled }: { onSend: (msg: string) => void; disabled?: boolean }) {
  const lesson = useStudio((s) => s.lesson);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const recRef = useRef<{ stop: () => void } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const canListen = sttAvailable();

  useEffect(() => () => recRef.current?.stop(), []);

  useEffect(() => {
    if (lesson.phase === "question") inputRef.current?.focus();
  }, [lesson.phase]);

  const submit = (msg?: string) => {
    const m = (msg ?? text).trim();
    if (!m || disabled) return;
    onSend(m);
    setText("");
    recRef.current?.stop();
    setListening(false);
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const handle = listen({
      onText: (t, final) => {
        setText(t);
        if (final) {
          submit(t);
          setListening(false);
        }
      },
      onEnd: () => setListening(false),
    });
    recRef.current = handle;
    setListening(Boolean(handle));
  };

  return (
    <div className="ls-askbar st-ui">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={
              lesson.phase === "question"
                ? "Type your answer — or just speak…"
                : "Ask anything, anytime — the teacher hears you mid-lesson…"
            }
            className="ls-askinput w-full"
            disabled={disabled}
            aria-label="Ask the teacher"
          />
          {lesson.phase === "question" && <span className="ls-askhint">answer awaited</span>}
        </div>
        {canListen && (
          <button className={`ls-mic ${listening ? "on" : ""}`} onClick={toggleMic} title="Speak">
            {listening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        )}
        <button className="ls-send" onClick={() => submit()} disabled={disabled || !text.trim()} title="Send">
          <Send size={14} />
        </button>
      </div>
      <div className="ls-chips">
        {CHIPS.map((c) => (
          <button key={c} className="ls-chip" onClick={() => submit(c)} disabled={disabled}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
