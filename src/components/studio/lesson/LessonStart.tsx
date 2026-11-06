"use client";

/* ============================================================
   LESSON MODE — start screen
   Curriculum picker + topic + personality + exam/voice toggles.
   Full-screen overlay on the board; the only doorway to a lesson.
   ============================================================ */

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Mic, MicOff, GraduationCap, BookOpen, Target } from "lucide-react";
import { PERSONALITIES, type Curriculum, type LessonConfig, type Personality } from "./types";
import { useStudio } from "../store";

const CURRICULA: Curriculum[] = ["CBSE", "ICSE", "State Board", "IB", "Custom"];
const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "Science", "History", "Geography", "English"];

const SUGGESTIONS = [
  "Light: Reflection and Refraction",
  "Newton's Laws of Motion",
  "Ohm's Law and Electricity",
  "Chemical Reactions and Equations",
  "Trigonometry — basics",
  "Photosynthesis",
  "The French Revolution",
  "Quadratic Equations",
];

export function LessonStart({ onStart, onClose }: { onStart: (c: LessonConfig) => void; onClose: () => void }) {
  const student = useStudio((s) => s.lesson.student);
  const [topic, setTopic] = useState("");
  const [curriculum, setCurriculum] = useState<Curriculum>("CBSE");
  const [klass, setKlass] = useState(10);
  const [subject, setSubject] = useState("Physics");
  const [personality, setPersonality] = useState<Personality>("friendly");
  const [examMode, setExamMode] = useState(false);
  const [voice, setVoice] = useState(true);

  const go = () => {
    const t = topic.trim() || SUGGESTIONS[0];
    onStart({ topic: t, curriculum, klass, subject, personality, examMode, voice });
  };

  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-center justify-center bg-[#04101F]/72 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="ls-panel st-ui w-[min(680px,92vw)] max-h-[92vh] overflow-auto st-scroll rounded-3xl border border-[var(--st-line)] bg-[#081426]/95 p-7 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
        initial={{ y: 26, scale: 0.97, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-[family-name:var(--font-code-mono)] text-[10px] uppercase tracking-[0.3em] text-[#7FA7E8]">
              CODE STUDIO · LESSON MODE
            </div>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight text-[#F5EFE3]">
              Your whiteboard teacher is ready
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[#9FB4D8]">
              CODE plans the lesson, writes and draws on the board while explaining out loud, asks you questions and adapts to your answers.
            </p>
          </div>
          <button onClick={onClose} className="ls-chipbtn shrink-0" aria-label="Close">
            ✕
          </button>
        </div>

        {/* topic */}
        <label className="ls-label mt-6 block">What should I teach you today?</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder='e.g. "Teach me Class 10 CBSE — Light: Reflection and Refraction"'
          className="ls-input mt-2 w-full"
          autoFocus
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => setTopic(s)} className="ls-suggestion">
              {s}
            </button>
          ))}
        </div>

        {/* curriculum row */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="ls-label flex items-center gap-1.5">
              <GraduationCap size={12} /> Board
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {CURRICULA.map((c) => (
                <button key={c} onClick={() => setCurriculum(c)} className={`ls-pill ${curriculum === c ? "on" : ""}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="ls-label flex items-center gap-1.5">
              <BookOpen size={12} /> Subject
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {SUBJECTS.slice(0, 5).map((s) => (
                <button key={s} onClick={() => setSubject(s)} className={`ls-pill ${subject === s ? "on" : ""}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="ls-label">Class</label>
          <div className="mt-2 flex flex-wrap gap-1">
            {[6, 7, 8, 9, 10, 11, 12].map((k) => (
              <button key={k} onClick={() => setKlass(k)} className={`ls-pill ls-pill-num ${klass === k ? "on" : ""}`}>
                {k}
              </button>
            ))}
          </div>
        </div>

        {/* personalities */}
        <label className="ls-label mt-6 block">Choose your teacher</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonality(p.id)}
              className={`ls-persona ${personality === p.id ? "on" : ""}`}
            >
              <span className="block text-[13.5px] font-semibold text-[#F0E9DD]">{p.name}</span>
              <span className="mt-0.5 block text-[11.5px] text-[#9FB4D8]">{p.line}</span>
            </button>
          ))}
        </div>

        {/* toggles */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button onClick={() => setExamMode(!examMode)} className={`ls-toggle ${examMode ? "on" : ""}`}>
            <Target size={13} /> Exam mode {examMode ? "ON" : "OFF"}
          </button>
          <button onClick={() => setVoice(!voice)} className={`ls-toggle ${voice ? "on" : ""}`}>
            {voice ? <Mic size={13} /> : <MicOff size={13} />} Voice {voice ? "ON" : "OFF"}
          </button>
          {(student.answered > 0 || student.understanding !== 55) && (
            <span className="ls-chipbtn ml-auto cursor-default" title="CODE adapts to this">
              🧠 understanding ≈ {student.understanding}/100 · {student.correct}/{student.answered} correct
            </span>
          )}
        </div>

        <button onClick={go} className="ls-start mt-7 flex w-full items-center justify-center gap-2">
          <Sparkles size={15} /> Start the lesson
        </button>
      </motion.div>
    </motion.div>
  );
}
