"use client";

/* ============================================================
   CODE TUTOR — AI Whiteboard Classroom
   Board-first teaching loop: plan → beats (speech synced with
   board actions) → questions → answers → adaptation → quiz.
   The teacher is CODE, the mascot of The Mind Code.
   ============================================================ */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SignInButton } from "@clerk/nextjs";
import {
  ArrowUpRight, BookOpenText, Eraser, Hand, Highlighter, Layers, Maximize,
  Mic, MicOff, Minus, Pen, Plus, Redo2, Sparkles,
  Square, Type, Underline as UnderlineIcon, Undo2, Circle, MoveUpRight,
  Volume2, VolumeX, X, Radio,
} from "lucide-react";
import "./tutor.css";
import Board from "./Board";
import { BoardEngine, BOARD_H, BOARD_W, elBBox } from "./engine";
import {
  Beat, BoardAction, CURRICULA, El, EXAMPLE_TOPICS, LessonPlan, PERSONAS,
  PersonaId, Pt, Scene, StudentModel, SUBJECTS,
} from "./types";

const CLERK_ON = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

type Tool = "select" | "pen" | "marker" | "text" | "rect" | "ellipse" | "line" | "arrow" | "eraser" | "pan";
const INK_COLORS = ["#eef3fb", "#ffd75e", "#6fa8ff", "#3ddc97", "#ff7a93", "#b7a4ff"];

type SavedLesson = {
  plan: LessonPlan;
  conceptIndex: number;
  elements: El[];
  camera: { x: number; y: number; zoom: number };
  scenes: Scene[];
  student: StudentModel;
  config: StartConfig;
  at: number;
};

type StartConfig = {
  topic: string;
  curriculum: string;
  grade: string;
  subject: string;
  persona: PersonaId;
  examMode: boolean;
};

/* ---------- speech (TTS) ---------- */

function useSpeech(enabled: boolean, persona: PersonaId) {
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const pick = () => {
      const vs = window.speechSynthesis.getVoices();
      const v =
        vs.find((x) => /en[-_]IN/i.test(x.lang) && /female|neha|heera/i.test(x.name)) ??
        vs.find((x) => /Google UK English Female/i.test(x.name)) ??
        vs.find((x) => /en[-_]GB/i.test(x.lang)) ??
        vs.find((x) => /^en/i.test(x.lang)) ??
        null;
      setVoice(v);
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);
  const pitch = persona === "professor" ? 0.94 : persona === "coach" ? 1.0 : 1.06;
  const say = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text.replace(/✦/g, ""));
        if (voice) u.voice = voice;
        u.rate = 1.02;
        u.pitch = pitch;
        window.speechSynthesis.speak(u);
      } catch { /* silent */ }
    },
    [enabled, voice, pitch]
  );
  const hush = useCallback(() => {
    try { window.speechSynthesis?.cancel(); } catch { /* silent */ }
  }, []);
  return { say, hush };
}

/* ---------- mic (STT) ---------- */

type SpeechRec = { start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null; continuous: boolean; interimResults: boolean; lang: string };

function micSupported() {
  return typeof window !== "undefined" && Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
}

/* ============================================================ */

export default function TutorApp() {
  const [scenes, setScenes] = useState<Scene[]>([]);
  /* ---------- lifecycle ---------- */
  const engine = useMemo(
    () =>
      new BoardEngine({
        onElements: (els) => setElements(els),
        onCamera: (cam) => setCamera({ ...cam }),
        onStatus: (st) => setTeacherStatus(st),
        onSceneMark: () => setScenes(engine.scenesList().slice()),
      }),
    []
  );

  /* ---------- phase & config ---------- */
  const [phase, setPhase] = useState<"start" | "teaching" | "done">("start");
  const [cfg, setCfg] = useState<StartConfig>({
    topic: "", curriculum: "CBSE", grade: "Class 10", subject: "Physics",
    persona: "friendly", examMode: false,
  });
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [conceptIndex, setConceptIndex] = useState(0);
  const [lastSection, setLastSection] = useState("");
  const [quizIndex, setQuizIndex] = useState(0);
  const [designing, setDesigning] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLesson, setSavedLesson] = useState<SavedLesson | null>(null);

  /* ---------- board state ---------- */
  const [elements, setElements] = useState<El[]>([]);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [teacherStatus, setTeacherStatus] = useState<{ playing: boolean; currentLabel: string | null }>({ playing: false, currentLabel: null });

  /* ---------- conversation ---------- */
  const [say, setSay] = useState("");
  const [thinking, setThinking] = useState(false);
  const [question, setQuestion] = useState<{ text: string; expect: "short" | "choice"; choices: string[] } | null>(null);
  const [answer, setAnswer] = useState("");
  const [student, setStudent] = useState<StudentModel>({ understanding: 0.5, confidence: "medium" });
  const recent = useRef<{ role: "teacher" | "student"; text: string }[]>([]);
  const busy = useRef(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* live refs for the teaching loop (immune to stale closures) */
  const planRef = useRef<LessonPlan | null>(null);
  const studentRef = useRef<StudentModel>({ understanding: 0.5, confidence: "medium" });
  const sectionRef = useRef("");
  const conceptRef = useRef(0);

  /* ---------- voice ---------- */
  const [voiceOn, setVoiceOn] = useState(true);
  const { say: speak, hush } = useSpeech(voiceOn, cfg.persona);
  const [recOn, setRecOn] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  /* ---------- tools ---------- */
  const [tool, setTool] = useState<Tool>("select");
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [showScenes, setShowScenes] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawing = useRef<{ active: boolean; pts: Pt[]; start: Pt; cur: Pt }>({ active: false, pts: [], start: { x: 0, y: 0 }, cur: { x: 0, y: 0 } });
  const [, forceTick] = useState(0);

  const refreshHistoryButtons = useCallback(() => {
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());
  }, [engine]);

  /* ---------- restore saved lesson ---------- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("tmc.tutor.v1");
      if (raw) {
        const saved = JSON.parse(raw) as SavedLesson;
        if (saved?.plan?.title && Date.now() - saved.at < 1000 * 60 * 60 * 24 * 3) {
          setSavedLesson(saved);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const persist = useCallback(() => {
    if (!plan) return;
    try {
      const data: SavedLesson = {
        plan, conceptIndex, elements, camera, scenes: engine.scenesList().slice(),
        student, config: cfg, at: Date.now(),
      };
      localStorage.setItem("tmc.tutor.v1", JSON.stringify(data));
    } catch { /* quota — ignore */ }
  }, [plan, conceptIndex, elements, camera, engine, student, cfg]);
  useEffect(() => { const t = setTimeout(persist, 1200); return () => clearTimeout(t); }, [persist]);

  /* ---------- lesson driving ---------- */

  const callBeat = useCallback(
    async (body: Record<string, unknown>): Promise<Beat | null> => {
      setThinking(true);
      try {
        const res = await fetch("/api/tutor/beat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { setNeedsAuth(true); return null; }
        if (!res.ok || !data.ok) {
          setError(data.error || "The teacher needs a second. Try again.");
          return null;
        }
        return data.beat as Beat;
      } catch {
        setError("Connection wobble — ask again.");
        return null;
      } finally {
        setThinking(false);
      }
    },
    []
  );

  const playBeat = useCallback(
    async (beat: Beat) => {
      hush();
      setSay(beat.speech);
      speak(beat.speech);
      recent.current.push({ role: "teacher", text: beat.speech });
      if (recent.current.length > 8) recent.current = recent.current.slice(-8);

      if (beat.studentModel) {
        studentRef.current = {
          ...studentRef.current,
          understanding: beat.studentModel.understanding ?? studentRef.current.understanding,
          confidence: beat.studentModel.confidence ?? studentRef.current.confidence,
          note: beat.studentModel.note ?? studentRef.current.note,
        };
        setStudent(studentRef.current);
      }
      if (beat.mistakes?.length) {
        studentRef.current = { ...studentRef.current, mistakes: beat.mistakes };
        setStudent(studentRef.current);
      }

      if (beat.clear) { engine.clearBoard(); await new Promise((r) => setTimeout(r, 300)); }
      if (beat.actions.length) {
        const withIds = beat.actions.map((a) => (a.a === "write" && !a.id ? { ...a, id: `t${Math.random().toString(36).slice(2, 7)}` } : a));
        await engine.playActions(withIds, "beat");
      }
      refreshHistoryButtons();

      if (beat.section && beat.section !== sectionRef.current) {
        sectionRef.current = beat.section;
        conceptRef.current = Math.min(conceptRef.current + 1, (planRef.current?.concepts.length ?? 1) - 1);
        setConceptIndex(conceptRef.current);
      }
      if (beat.question && beat.question.text) {
        setQuestion({ text: beat.question.text, expect: beat.question.expect ?? "short", choices: beat.question.choices ?? [] });
        return "question" as const;
      }
      if (beat.done) { setPhase("done"); return "done" as const; }
      return "ok" as const;
    },
    [engine, hush, speak, refreshHistoryButtons]
  );

  const teachNext = useCallback(
    async (conceptIdx: number) => {
      const p = planRef.current;
      if (!p || busy.current) return;
      busy.current = true;
      try {
        const beat = await callBeat({
          mode: "teach", plan: p, conceptIndex: conceptIdx, persona: cfg.persona, examMode: cfg.examMode,
          board: engine.summary(), recent: recent.current.slice(-6), student: studentRef.current,
        });
        if (!beat) return;
        const r = await playBeat(beat);
        if (r === "ok") {
          autoTimer.current = setTimeout(() => { busy.current = false; teachNext(conceptRef.current); }, 1200);
          return;
        }
        if (r === "done") { /* lesson finished */ }
      } finally {
        busy.current = false;
      }
    },
    [callBeat, playBeat, engine, cfg]
  );

  const startLesson = useCallback(
    async (topicOverride?: string) => {
      const topic = (topicOverride ?? cfg.topic).trim();
      if (topic.length < 3 || designing) return;
      if (autoTimer.current) clearTimeout(autoTimer.current);
      setError(null);
      setDesigning(true);
      setNeedsAuth(false);
      hush();
      try {
        const res = await fetch("/api/tutor/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...cfg, topic }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { setNeedsAuth(true); return; }
        if (!res.ok || !data.ok) { setError(data.error || "Could not start the lesson."); return; }
        const p = data.plan as LessonPlan;
        planRef.current = p;
        conceptRef.current = 0;
        sectionRef.current = "";
        studentRef.current = { understanding: 0.5, confidence: "medium" };
        setPlan(p);
        setConceptIndex(0);
        setLastSection("");
        setQuizIndex(0);
        setPhase("teaching");
        engine.clearBoard(false);
        recent.current = [];
        const intro = `Alright! Today we crack ${p.title}. ${p.objectives[0] ? `By the end you will be able to ${p.objectives[0].toLowerCase()}.` : "Let's begin."}`;
        setSay(intro);
        speak(intro);
        recent.current.push({ role: "teacher", text: intro });
        engine.playActions(
          [
            { a: "write", id: "t-title", text: p.title, x: 130, y: 110, style: "heading" },
            { a: "panel", kind: "objective", title: "Today's mission", items: p.objectives.slice(0, 3), x: 130, y: 170 },
          ],
          "intro"
        ).then(refreshHistoryButtons);
        autoTimer.current = setTimeout(() => { busy.current = false; teachNext(0); }, 1600);
      } finally {
        setDesigning(false);
      }
    },
    [cfg, designing, engine, hush, speak, teachNext, refreshHistoryButtons]
  );

  const resumeLesson = useCallback(() => {
    if (!savedLesson) return;
    planRef.current = savedLesson.plan;
    conceptRef.current = savedLesson.conceptIndex;
    sectionRef.current = "";
    studentRef.current = savedLesson.student;
    setPlan(savedLesson.plan);
    setConceptIndex(savedLesson.conceptIndex);
    setStudent(savedLesson.student);
    setCfg(savedLesson.config);
    setLastSection("");
    engine.restore({ elements: savedLesson.elements, camera: savedLesson.camera });
    for (const s of savedLesson.scenes.slice().reverse()) {
      // replay scene marks so the drawer is populated (snapshots are not restored — board is live)
    }
    setPhase("teaching");
    setSay("Welcome back — let's pick up right where we left off.");
    speak("Welcome back — let's pick up right where we left off.");
  }, [savedLesson, engine, speak]);

  const submitAnswer = useCallback(
    async (text: string) => {
      const t = text.trim();
      if (!t || !plan || busy.current) return;
      setAnswer("");
      recent.current.push({ role: "student", text: t });
      hush();

      if (question) {
        // answering the teacher's question
        const q = question;
        setQuestion(null);
        busy.current = true;
        try {
          const beat = await callBeat({
            mode: "answer", plan: planRef.current!, conceptIndex, persona: cfg.persona, examMode: cfg.examMode,
            board: engine.summary(), recent: recent.current.slice(-6), student: studentRef.current,
            studentInput: t, lastQuestion: q.text,
          });
          if (beat) {
            const r = await playBeat(beat);
            // if the teacher asked a NEW question — wait for the student, no auto-continue
            if (r !== "question") {
              const idx = conceptRef.current;
              autoTimer.current = setTimeout(() => { busy.current = false; teachNext(idx); }, 1400);
              return;
            }
          }
        } finally { busy.current = false; }
        return;
      }

      // free interruption
      busy.current = true;
      try {
        const beat = await callBeat({
          mode: "interrupt", plan: planRef.current!, conceptIndex, persona: cfg.persona, examMode: cfg.examMode,
          board: engine.summary(), recent: recent.current.slice(-6), student: studentRef.current, studentInput: t,
        });
        if (beat) {
          const r = await playBeat(beat);
          if (r !== "question") {
            const idx = conceptRef.current;
            autoTimer.current = setTimeout(() => { busy.current = false; teachNext(idx); }, 1400);
          }
        }
      } finally { busy.current = false; }
    },
    [plan, question, callBeat, playBeat, engine, cfg, student, conceptIndex, teachNext, hush]
  );

  /* ---------- quiz ---------- */

  const [quizQ, setQuizQ] = useState<{ i: number; picked: number | null } | null>(null);

  const startQuiz = useCallback(() => {
    if (!plan?.quiz?.length) return;
    if (autoTimer.current) clearTimeout(autoTimer.current);
    engine.stop();
    busy.current = true; // the quiz owns the room now — pause the teaching loop
    setQuestion(null);
    setQuizIndex(0);
    setQuizQ({ i: 0, picked: null });
    const q = plan.quiz[0];
    hush();
    const speech = `Time for a quick check — ${plan.quiz.length} questions. No pressure, this is how marks are made.`;
    setSay(speech);
    speak(speech);
    engine.playActions(
      [
        { a: "clear" }, { a: "sceneMark", title: "Mini quiz" },
        { a: "write", text: "MINI QUIZ", x: 130, y: 110, style: "heading" },
        { a: "panel", kind: "question", title: `Q1. ${q.q}`, items: q.options.map((o, i) => `${"ABCD"[i]}. ${o}`), x: 130, y: 180 },
      ],
      "quiz"
    ).then(refreshHistoryButtons);
  }, [plan, engine, hush, speak, refreshHistoryButtons]);

  const pickChoice = useCallback(
    (idx: number) => {
      if (!plan || !quizQ) return;
      const q = plan.quiz[quizQ.i];
      const correct = idx === q.answer;
      setQuizQ({ ...quizQ, picked: idx });
      const speech = correct
        ? `Correct! ${q.why ?? ""}`
        : `Not quite. The answer is ${"ABCD"[q.answer]}. ${q.why ?? ""}`;
      setSay(speech);
      speak(speech);
      engine.playActions(
        [
          { a: "write", text: correct ? `✓ ${"ABCD"[idx]} — correct!` : `✗ The answer is ${"ABCD"[q.answer]}`, x: 700, y: 200 + idx * 40, style: "body", color: correct ? "#3ddc97" : "#ff7a93" },
          ...(q.why ? [{ a: "write" as const, text: q.why, x: 700, y: 420, style: "note", w: 700 }] : []),
        ],
        "quiz"
      ).then(refreshHistoryButtons);
      setTimeout(() => {
        if (quizQ.i + 1 < plan.quiz.length) {
          const nq = plan.quiz[quizQ.i + 1];
          setQuizQ({ i: quizQ.i + 1, picked: null });
          engine.playActions(
            [
              { a: "clear" },
              { a: "panel", kind: "question", title: `Q${quizQ.i + 2}. ${nq.q}`, items: nq.options.map((o, i) => `${"ABCD"[i]}. ${o}`), x: 130, y: 180 },
            ],
            "quiz"
          ).then(refreshHistoryButtons);
        } else {
          setQuizQ(null);
          setPhase("done");
          busy.current = false; // hand the room back
          const done = "Brilliant work today. You did not just watch a video — you took a real class.";
          setSay(done);
          speak(done);
          engine.playActions([{ a: "panel", kind: "recap", title: "Lesson complete", items: ["You earned this. Review the scenes any time.", "Try another topic from the classroom!"] }], "quiz").then(refreshHistoryButtons);
        }
      }, 4200);
    },
    [plan, quizQ, engine, speak, refreshHistoryButtons]
  );

  /* ---------- board pointer handling (draw / pan / text) ---------- */

  const toLogical = useCallback((e: React.PointerEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>): Pt => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    return { x: pt.x, y: pt.y };
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (e.button === 1 || tool === "pan" || (tool === "select" && e.button === 1)) {
        drawing.current = { ...drawing.current, active: true, start: toLogical(e) };
        (e.target as Element).setPointerCapture?.(e.pointerId);
        return;
      }
      if (tool === "select") return;
      const p = toLogical(e);
      if (tool === "eraser") { engine.eraseAt(p); refreshHistoryButtons(); return; }
      if (tool === "text") return; // handled on double click
      drawing.current = { active: true, pts: [p], start: p, cur: p };
      (e.target as Element).setPointerCapture?.(e.pointerId);
    },
    [tool, toLogical, engine, refreshHistoryButtons]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const d = drawing.current;
      if (!d.active) return;
      const p = toLogical(e);
      d.cur = p;
      if (tool === "pen" || tool === "marker") {
        d.pts.push(p);
        forceTick((t) => t + 1);
      } else {
        forceTick((t) => t + 1);
      }
    },
    [tool, toLogical]
  );

  const onPointerUp = useCallback(() => {
    const d = drawing.current;
    if (!d.active) return;
    d.active = false;
    if (tool === "pen" || tool === "marker") {
      engine.addStroke(d.pts, inkColor, 0, tool);
    } else if (tool === "rect" || tool === "ellipse" || tool === "line" || tool === "arrow") {
      engine.addShape(tool, d.start, d.cur, inkColor);
    }
    refreshHistoryButtons();
    forceTick((t) => t + 1);
  }, [tool, inkColor, engine, refreshHistoryButtons]);

  const [freeText, setFreeText] = useState<{ x: number; y: number; value: string } | null>(null);
  const onDoubleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool !== "text" && tool !== "select") return;
      const p = toLogical(e);
      setFreeText({ x: p.x, y: p.y, value: "" });
    },
    [tool, toLogical]
  );

  /* live preview of the shape being dragged */
  const preview = useMemo(() => {
    const d = drawing.current;
    if (!d.active) return null;
    if (tool === "pen" || tool === "marker") {
      if (d.pts.length < 2) return null;
      return <path d={`M ${d.pts.map((p) => `${p.x} ${p.y}`).join(" L ")}`} fill="none" stroke={inkColor} strokeWidth={tool === "marker" ? 12 : 2.8} strokeLinecap="round" opacity={tool === "marker" ? 0.32 : 0.9} />;
    }
    if (tool === "rect" || tool === "ellipse" || tool === "line" || tool === "arrow") {
      const { start: f, cur: t } = d;
      let dd = "";
      if (tool === "rect") dd = `M ${f.x} ${f.y} L ${t.x} ${f.y} L ${t.x} ${t.y} L ${f.x} ${t.y} Z`;
      if (tool === "line" || tool === "arrow") dd = `M ${f.x} ${f.y} L ${t.x} ${t.y}`;
      if (tool === "ellipse") {
        const cx = (f.x + t.x) / 2, cy = (f.y + t.y) / 2;
        dd = `M ${cx - Math.abs(t.x - f.x) / 2} ${cy} A ${Math.abs(t.x - f.x) / 2} ${Math.abs(t.y - f.y) / 2} 0 1 0 ${cx + Math.abs(t.x - f.x) / 2} ${cy} A ${Math.abs(t.x - f.x) / 2} ${Math.abs(t.y - f.y) / 2} 0 1 0 ${cx - Math.abs(t.x - f.x) / 2} ${cy}`;
      }
      return <path d={dd} fill="none" stroke={inkColor} strokeWidth={2.4} strokeDasharray="6 6" />;
    }
    return null;
  }, [tool, inkColor]);

  /* ---------- mic ---------- */

  const toggleMic = useCallback(() => {
    if (recOn) { recRef.current?.stop(); setRecOn(false); return; }
    if (!micSupported()) { setError("Voice input is not supported in this browser — type instead."); return; }
    const Ctor = (window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition: new () => SpeechRec }).webkitSpeechRecognition;
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = "en-IN";
    rec.onresult = (e) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      if (t) submitAnswer(t);
    };
    rec.onend = () => setRecOn(false);
    rec.onerror = () => setRecOn(false);
    recRef.current = rec;
    try { rec.start(); setRecOn(true); } catch { setRecOn(false); }
  }, [recOn, submitAnswer]);

  /* ---------- cleanup ---------- */
  useEffect(() => () => { engine.stop(); hush(); if (autoTimer.current) clearTimeout(autoTimer.current); }, [engine, hush]);

  /* ============================================================ */
  /* RENDER                                                        */
  /* ============================================================ */

  const grasp = Math.round((student.understanding ?? 0.5) * 4);
  const personaName = PERSONAS.find((p) => p.id === cfg.persona)?.name ?? "Teacher";

  return (
    <div className="tb-root">
      {/* ================= top bar ================= */}
      <header className="tb-top">
        <a href="/" className="tb-btn" aria-label="Back to The Mind Code">
          <X size={12} /> Exit class
        </a>
        {phase === "teaching" || phase === "done" ? (
          <>
            <div className="tb-chip"><b>{plan?.title ?? "Lesson"}</b></div>
            <div className="tb-chip">{cfg.curriculum} · {cfg.grade}{cfg.examMode ? " · EXAM MODE" : ""}</div>
            <div className="tb-chip tb-grasp" title={`Understanding: ${Math.round((student.understanding ?? 0.5) * 100)}%`}>
              GRASP {[0, 1, 2, 3].map((i) => <i key={i} className={i < grasp ? "f" : ""} />)}
            </div>
            <div style={{ flex: 1 }} />
            <button className={`tb-btn ${voiceOn ? "on" : ""}`} onClick={() => { setVoiceOn((v) => !v); hush(); }} title="Teacher voice">
              {voiceOn ? <Volume2 size={13} /> : <VolumeX size={13} />} VOICE
            </button>
            <button className="tb-btn" onClick={() => setShowScenes((s) => !s)} title="Board memory — scenes & bookmarks">
              <Layers size={13} /> SCENES {scenes.length ? `(${scenes.length})` : ""}
            </button>
          </>
        ) : (
          <>
            <div className="tb-chip"><b>CODE TUTOR</b> · AI whiteboard classroom</div>
            <div style={{ flex: 1 }} />
            <div className="tb-chip">The Mind Code</div>
          </>
        )}
      </header>

      {/* ================= stage ================= */}
      <div className="tb-stage">
        {phase === "start" ? (
          <StartScreen
            cfg={cfg} setCfg={setCfg} designing={designing} error={error}
            needsAuth={needsAuth} saved={savedLesson}
            onBegin={(t) => startLesson(t)} onResume={resumeLesson}
          />
        ) : (
          <>
            <Board
              elements={elements}
              camera={camera}
              svgRef={svgRef}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onDoubleClick={onDoubleClick}
            />
            {/* live draw preview overlay */}
            {preview && (
              <svg className="tb-board" style={{ pointerEvents: "none" }} viewBox={`${camera.x} ${camera.y} ${BOARD_W / camera.zoom} ${BOARD_H / camera.zoom}`} preserveAspectRatio="xMidYMid meet">
                {preview}
              </svg>
            )}

            {/* free text editor */}
            {freeText && (
              <div style={{ position: "absolute", left: `calc(50% + ${(freeText.x - camera.x - (BOARD_W / camera.zoom) / 2) * (1 / 1)}px)`, top: "50%", display: "none" }} />
            )}
            {freeText && (
              <div
                style={{ position: "absolute", left: "18%", top: "38%", zIndex: 40 }}
                className="tb-card"
              >
                <div className="tb-field-label">Write on the board</div>
                <input
                  autoFocus
                  className="tb-input"
                  value={freeText.value}
                  onChange={(e) => setFreeText({ ...freeText, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && freeText.value.trim()) {
                      engine.addFreeText(freeText.value.trim(), freeText.x, freeText.y);
                      refreshHistoryButtons();
                      setFreeText(null);
                    }
                    if (e.key === "Escape") setFreeText(null);
                  }}
                  placeholder="Type and press Enter…"
                />
              </div>
            )}

            {/* ---------- toolbar ---------- */}
            <div className="tb-tools">
              <button className={`tb-tool ${tool === "pen" ? "on" : ""}`} onClick={() => setTool("pen")} title="Pen"><Pen size={15} /></button>
              <button className={`tb-tool ${tool === "marker" ? "on" : ""}`} onClick={() => setTool("marker")} title="Highlighter"><Highlighter size={15} /></button>
              <button className={`tb-tool ${tool === "text" ? "on" : ""}`} onClick={() => setTool("text")} title="Text (double-click board)"><Type size={15} /></button>
              <div className="tb-tool-sep" />
              <button className={`tb-tool ${tool === "line" ? "on" : ""}`} onClick={() => setTool("line")} title="Line"><Minus size={15} /></button>
              <button className={`tb-tool ${tool === "arrow" ? "on" : ""}`} onClick={() => setTool("arrow")} title="Arrow"><MoveUpRight size={15} /></button>
              <button className={`tb-tool ${tool === "rect" ? "on" : ""}`} onClick={() => setTool("rect")} title="Rectangle"><Square size={15} /></button>
              <button className={`tb-tool ${tool === "ellipse" ? "on" : ""}`} onClick={() => setTool("ellipse")} title="Circle"><Circle size={15} /></button>
              <button className={`tb-tool ${tool === "eraser" ? "on" : ""}`} onClick={() => setTool("eraser")} title="Eraser"><Eraser size={15} /></button>
              <div className="tb-tool-sep" />
              <div className="tb-swatches">
                {INK_COLORS.map((c) => (
                  <button key={c} className={`tb-sw ${inkColor === c ? "on" : ""}`} style={{ background: c }} onClick={() => setInkColor(c)} aria-label={`ink ${c}`} />
                ))}
              </div>
              <div className="tb-tool-sep" />
              <button className="tb-tool" disabled={!canUndo} onClick={() => { engine.undo(); refreshHistoryButtons(); }} title="Undo"><Undo2 size={15} /></button>
              <button className="tb-tool" disabled={!canRedo} onClick={() => { engine.redo(); refreshHistoryButtons(); }} title="Redo"><Redo2 size={15} /></button>
              <button className="tb-tool" onClick={() => { engine.setCamera({ zoom: camera.zoom * 1.25 }); }} title="Zoom in"><Plus size={15} /></button>
              <button className="tb-tool" onClick={() => { engine.setCamera({ zoom: camera.zoom / 1.25 }); }} title="Zoom out"><Minus size={15} /></button>
              <button className="tb-tool" onClick={() => { engine.setCamera({ x: 0, y: 0, zoom: 1 }); }} title="Fit board"><Maximize size={15} /></button>
              <button className={`tb-tool ${tool === "pan" ? "on" : ""}`} onClick={() => setTool("pan")} title="Pan"><Hand size={15} /></button>
            </div>

            {/* ---------- scenes drawer ---------- */}
            {showScenes && (
              <div className="tb-scenes">
                <div className="tb-field-label" style={{ padding: "0 8px" }}>Board memory</div>
                {scenes.length === 0 && (
                  <div style={{ padding: "4px 10px 10px", fontSize: 12, color: "rgba(238,243,251,0.5)" }}>
                    Sections you cover will be bookmarked here automatically.
                  </div>
                )}
                {scenes.slice().reverse().map((s, i) => (
                  <button
                    key={`${s.at}-${i}`}
                    className={`tb-scene-item ${i === 0 ? "now" : ""}`}
                    onClick={() => { engine.restore(s.snapshot); refreshHistoryButtons(); }}
                  >
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                    <BookOpenText size={12} style={{ flexShrink: 0 }} />
                  </button>
                ))}
                <div className="tb-tool-sep" />
                <button
                  className="tb-scene-item"
                  onClick={() => { engine.markScene(`Bookmark ${scenes.length + 1}`); setScenes(engine.scenesList().slice()); }}
                >
                  <span>Bookmark this moment</span>
                  <Sparkles size={12} />
                </button>
              </div>
            )}

            {/* ---------- teacher card ---------- */}
            <div className="tb-teacher">
              <div className="tb-teacher-row">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thinking ? "/mascot/code-face-thinking.png" : teacherStatus.playing ? "/mascot/code-focused.png" : "/mascot/code-face.png"}
                  alt="CODE, your AI teacher"
                  className={`tb-teacher-pic ${teacherStatus.playing ? "tb-wave" : ""}`}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="tb-teacher-name">CODE · {personaName.toUpperCase()}</div>
                  <div className="tb-teacher-say">
                    {thinking ? <span style={{ color: "rgba(238,243,251,0.55)" }}>thinking…</span> : <>{say}{teacherStatus.playing && <span className="cap-caret" />}</>}
                  </div>
                </div>
              </div>
            </div>

            {/* ---------- ask bar ---------- */}
            <div className="tb-ask">
              {quizQ && plan?.quiz?.[quizQ.i] && quizQ.picked === null && (
                <div className="tb-q">
                  <b>Q{quizQ.i + 1}.</b> {plan.quiz[quizQ.i].q}
                  <div className="tb-chips" style={{ justifyContent: "flex-start", marginTop: 8 }}>
                    {plan.quiz[quizQ.i].options.map((o, i) => (
                      <button key={i} className="tb-chipbtn" onClick={() => pickChoice(i)}>{o}</button>
                    ))}
                  </div>
                </div>
              )}
              {question && (
                <div className="tb-q">
                  <b>Your teacher asks:</b> {question.text}
                  {question.choices.length > 0 && (
                    <div className="tb-chips" style={{ justifyContent: "flex-start", marginTop: 8 }}>
                      {question.choices.map((c, i) => (
                        <button key={i} className="tb-chipbtn" onClick={() => submitAnswer(c)}>{c}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="tb-ask-inner">
                <button className={`tb-mic ${recOn ? "rec" : ""}`} onClick={toggleMic} title={micSupported() ? "Speak to your teacher" : "Voice input unsupported"}>
                  {recOn ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(answer); }}
                  placeholder={question ? "Type your answer…" : "Ask anything — “why did you divide by 3?”, “simpler please”, “another example”…"}
                  disabled={thinking}
                />
                <button className="tb-send" onClick={() => submitAnswer(answer)} disabled={thinking || !answer.trim()} title="Send">
                  <Radio size={15} />
                </button>
              </div>
              <div className="tb-chips">
                <button className="tb-chipbtn" onClick={() => submitAnswer("I don't understand this part. Can you explain it simpler?")}>Simpler please</button>
                <button className="tb-chipbtn" onClick={() => submitAnswer("Give me another example.")}>Another example</button>
                <button className="tb-chipbtn" onClick={() => submitAnswer("Wait, why? Explain that step again.")}>Why?</button>
                <button className="tb-chipbtn" onClick={() => submitAnswer("Can you draw that on the board?")}>Draw it</button>
                {phase === "teaching" && plan?.quiz?.length ? (
                  <button className="tb-chipbtn" style={{ color: "#ffd75e", borderColor: "rgba(255,215,94,0.4)" }} onClick={startQuiz}>Quiz me</button>
                ) : null}
              </div>
            </div>

            {error && (
              <div className="tb-q" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", bottom: 120, zIndex: 35, borderColor: "rgba(255,122,147,0.5)", background: "rgba(255,122,147,0.08)" }}>
                {error}
                <button className="tb-chipbtn" style={{ marginLeft: 10 }} onClick={() => setError(null)}>dismiss</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   START SCREEN — pick the lesson like picking a class
   ============================================================ */

function StartScreen({
  cfg, setCfg, designing, error, needsAuth, saved, onBegin, onResume,
}: {
  cfg: StartConfig;
  setCfg: (c: StartConfig) => void;
  designing: boolean;
  error: string | null;
  needsAuth: boolean;
  saved: SavedLesson | null;
  onBegin: (topic: string) => void;
  onResume: () => void;
}) {
  const [topic, setTopic] = useState(cfg.topic);
  const set = (patch: Partial<StartConfig>) => setCfg({ ...cfg, ...patch });
  const ready = topic.trim().length >= 3 && !designing;

  return (
    <div className="tb-start">
      <div style={{ fontFamily: "var(--tb-ui)", fontSize: 10, letterSpacing: "0.3em", color: "var(--tb-accent)" }}>
        THE MIND CODE PRESENTS
      </div>
      <h1 className="tb-hw" style={{ marginTop: 10 }}>
        Your own <em>AI teacher</em>, standing at a whiteboard.
      </h1>
      <p className="tb-sub">
        Tell CODE what to teach. A lesson is planned, written and drawn on the board step by step —
        with questions, corrections and a mini quiz, just like a real class.
      </p>

      {saved && (
        <div className="tb-card" style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <div className="tb-field-label" style={{ marginBottom: 4 }}>Unfinished class</div>
            <div style={{ fontSize: 14.5 }}>{saved.plan.title}</div>
          </div>
          <button className="tb-btn on" onClick={onResume}><BookOpenText size={13} /> RESUME LESSON</button>
        </div>
      )}

      <div className="tb-card">
        <div className="tb-field-label">What should CODE teach you today?</div>
        <input
          className="tb-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && ready) { set({ topic }); onBegin(topic); } }}
          placeholder="e.g. Teach me Class 10 CBSE — Light: Reflection and Refraction"
        />
        <div className="tb-chips" style={{ justifyContent: "flex-start", marginTop: 10 }}>
          {EXAMPLE_TOPICS.map((t) => (
            <button key={t} className="tb-chipbtn" onClick={() => setTopic(t)}>{t}</button>
          ))}
        </div>
      </div>

      <div className="tb-card">
        <div className="tb-optrow" style={{ marginBottom: 12 }}>
          {CURRICULA.map((c) => (
            <button key={c} className={`tb-opt ${cfg.curriculum === c ? "on" : ""}`} onClick={() => set({ curriculum: c })}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <select className="tb-select" value={cfg.grade} onChange={(e) => set({ grade: e.target.value })} aria-label="Class">
            {["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"].map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <select className="tb-select" value={cfg.subject} onChange={(e) => set({ subject: e.target.value })} aria-label="Subject">
            {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className={`tb-btn ${cfg.examMode ? "on" : ""}`} onClick={() => set({ examMode: !cfg.examMode })} title="NCERT wording, marks strategy, common mistakes">
            <UnderlineIcon size={12} /> EXAM MODE {cfg.examMode ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      <div className="tb-card">
        <div className="tb-field-label">Pick your teacher</div>
        <div className="tb-optrow">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              className={`tb-opt ${cfg.persona === p.id ? "on" : ""}`}
              onClick={() => set({ persona: p.id })}
              title={p.blurb}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 12.5, color: "rgba(238,243,251,0.55)" }}>
          {PERSONAS.find((p) => p.id === cfg.persona)?.blurb}
        </div>
      </div>

      {needsAuth && (
        <div className="tb-gate">
          <div style={{ fontSize: 15, marginBottom: 6 }}>One step first — <b>sign in to start your class</b></div>
          <div style={{ fontSize: 12.5, color: "rgba(238,243,251,0.6)", marginBottom: 14 }}>
            CODE Tutor is free. Your sign-in keeps your lessons, progress and board history safe.
          </div>
          {CLERK_ON ? (
            <SignInButton mode="modal">
              <button className="tb-go" style={{ width: "auto", padding: "12px 26px", margin: "0 auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
                LOG IN TO START <ArrowUpRight size={14} />
              </button>
            </SignInButton>
          ) : (
            <a href="/sign-in?redirect_url=/tutor" className="tb-go" style={{ width: "auto", padding: "12px 26px", display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              LOG IN TO START <ArrowUpRight size={14} />
            </a>
          )}
        </div>
      )}

      {error && !needsAuth && (
        <div className="tb-q" style={{ marginTop: 16 }}>{error}</div>
      )}

      <button className="tb-go" disabled={!ready} onClick={() => { set({ topic }); onBegin(topic); }}>
        {designing ? "DESIGNING YOUR LESSON…" : "BEGIN THE CLASS"}
      </button>
      <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, fontFamily: "var(--tb-ui)", letterSpacing: "0.14em", color: "rgba(238,243,251,0.4)" }}>
        SHAPES · RAYS · CIRCUITS · FORMULAS · QUESTIONS — ALL DRAWN LIVE
      </div>
    </div>
  );
}
