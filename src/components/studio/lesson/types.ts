/* ============================================================
   CODE STUDIO — LESSON MODE (the Whiteboard Tutor)
   Typed contract between the teaching engine (server LLM) and
   the deterministic board player (client).

   The LLM never draws free-form HTML. It emits BoardActions from
   a closed vocabulary; the interpreter maps them onto real canvas
   objects with hand-writing animation. This keeps the board
   model stable, editable, undoable and safe.
   ============================================================ */

import type { AIMode } from "../types";

/* ---------------- curriculum config ---------------- */

export type Curriculum = "CBSE" | "ICSE" | "State Board" | "IB" | "Custom";

export type Personality = "professor" | "friendly" | "coach" | "socratic" | "visual";

export const PERSONALITIES: { id: Personality; name: string; line: string }[] = [
  { id: "professor", name: "The Professor", line: "Calm, detailed, rigorous" },
  { id: "friendly", name: "The Friendly Teacher", line: "Simple words, relatable examples" },
  { id: "coach", name: "The Exam Coach", line: "Marks, formulas, common mistakes" },
  { id: "socratic", name: "The Socratic", line: "Guides you with questions" },
  { id: "visual", name: "The Visual Teacher", line: "Diagrams for everything" },
];

export interface LessonConfig {
  topic: string;
  curriculum: Curriculum;
  klass: number; // 6..12
  subject: string;
  personality: Personality;
  examMode: boolean;
  voice: boolean;
}

/* ---------------- board actions (closed vocabulary) ---------------- */

export type TextStyle = "heading" | "sub" | "body" | "term" | "note";

export interface SketchStroke {
  /** polyline points RELATIVE to the sketch origin, integers */
  pts: [number, number][];
  color?: string;
  width?: number;
}

export interface BoardAction {
  a: "write" | "equation" | "sketch" | "diagram" | "emphasize" | "arrow" | "erase" | "camera" | "checkpoint" | "quiz";
  /* write */
  text?: string;
  x?: number;
  y?: number;
  style?: TextStyle;
  /* equation */
  latex?: string;
  scale?: number;
  /* sketch */
  w?: number;
  h?: number;
  strokes?: SketchStroke[];
  labels?: { text: string; x: number; y: number }[];
  /* diagram */
  nodes?: { id: string; label: string; text?: string; x: number; y: number; w: number; h: number; shape?: "rect" | "rounded" | "pill" | "ellipse" | "diamond"; fill?: string }[];
  edges?: { from: string; to: string; label?: string; dashed?: boolean }[];
  title?: string;
  /* emphasize */
  target?: string; // text to find on the board
  mode?: "highlight" | "circle" | "underline" | "box";
  /* arrow */
  from?: [number, number];
  to?: [number, number];
  label?: string;
  /* camera */
  z?: number;
  /* quiz */
  questions?: { q: string; options: string[]; answer: number; why?: string }[];
}

/* ---------------- teaching steps ---------------- */

export type LessonPhase =
  | "intro" | "prereq" | "concept" | "visual" | "example"
  | "question" | "correction" | "application" | "recap" | "quiz";

export interface TeachStep {
  phase: LessonPhase;
  /** what the teacher SAYS while writing — 1–2 short spoken sentences */
  say: string;
  /** board actions executed in order while speaking */
  actions: BoardAction[];
  /** after the actions, hold for a student answer (Socratic checkpoint) */
  question?: { text: string; expect: string };
  /** extra dwell time after speech+actions (ms, ≤ 4000) */
  pauseMs?: number;
}

export interface LessonPlan {
  title: string;
  steps: TeachStep[];
}

/* ---------------- teacher turns (respond mode) ---------------- */

export type Verdict = "ack" | "good" | "partly" | "wrong";

export interface TeachTurn {
  say: string;
  actions: BoardAction[];
  verdict?: Verdict;
  /** student-model updates */
  understandingDelta?: number; // -20..+20
  pace?: -1 | 0 | 1; // slower / same / faster
  question?: { text: string; expect: string };
}

/* ---------------- student model ---------------- */

export interface StudentModel {
  understanding: number; // 0..100
  pace: -1 | 0 | 1;
  struggles: string[];
  wins: string[];
  answered: number;
  correct: number;
}

export const emptyStudentModel = (): StudentModel => ({
  understanding: 55,
  pace: 0,
  struggles: [],
  wins: [],
  answered: 0,
  correct: 0,
});

/* ---------------- transport payloads ---------------- */

export interface TeachPlanRequest {
  mode: "plan";
  config: LessonConfig;
  student: StudentModel;
}

export interface TeachRespondRequest {
  mode: "respond";
  config: LessonConfig;
  student: StudentModel;
  lesson: { title: string; done: { phase: string; say: string }[]; next: { phase: string; say: string } | null };
  board: string; // text snapshot of the board
  message: string;
}

export type TeachResponse =
  | { ok: true; plan: LessonPlan }
  | { ok: true; turn: TeachTurn }
  | { ok: false; error: string; code?: string };

/* keep the old AIMode import referenced for re-exports used elsewhere */
export type { AIMode };
