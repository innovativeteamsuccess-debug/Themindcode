/* ============================================================
   CODE TUTOR — Whiteboard Scene Model
   The AI never generates arbitrary UI. It emits typed BOARD
   ACTIONS; the client interprets them deterministically.
   Logical board space: 1600 × 900, origin top-left.
   ============================================================ */

export type Pt = { x: number; y: number };

export type TextStyle =
  | "heading"   // big section title
  | "sub"       // concept sub-title
  | "body"      // explanation line
  | "formula"   // boxed emphasis formula
  | "note"      // small aside
  | "label";    // tiny diagram label

export type WriteAction = {
  a: "write";
  id?: string;
  text: string;
  x: number;
  y: number;
  style?: TextStyle;
  align?: "left" | "center";
  color?: string;
  w?: number; // wrap width (logical px)
};

export type HighlightAction = {
  a: "highlight";
  id?: string;
  targetId?: string;      // highlight an existing text element
  x?: number; y?: number; // …or a free rect (logical space)
  w?: number; h?: number;
  color?: string;         // marker color
};

export type UnderlineAction = { a: "underline"; id?: string; targetId: string; color?: string };
export type CircleAction = { a: "circle"; id?: string; targetId: string; color?: string };

export type ArrowAction = {
  a: "arrow";
  id?: string;
  from: Pt;
  to: Pt;
  label?: string;
  color?: string;
  curved?: boolean;
};

/* ---------- diagram primitives (deterministic renderer) ---------- */

export type Shape =
  | { kind: "line" | "arrow" | "ray"; x1: number; y1: number; x2: number; y2: number; dashed?: boolean; label?: string; lx?: number; ly?: number; color?: string }
  | { kind: "rect" | "ellipse"; x: number; y: number; w: number; h: number; fill?: string; dashed?: boolean; label?: string; color?: string }
  | { kind: "circle"; x: number; y: number; r: number; fill?: string; dashed?: boolean; label?: string; color?: string }
  | { kind: "polyline"; pts: Pt[]; closed?: boolean; dashed?: boolean; label?: string; color?: string }
  | { kind: "arc"; x: number; y: number; r: number; start: number; end: number; dashed?: boolean; label?: string; lx?: number; ly?: number; color?: string } // degrees, 0=east, CCW positive
  | { kind: "mirror"; x: number; y: number; aperture: number; orientation: "concave" | "convex" | "plane"; label?: string; color?: string } // vertical mirror at x, centered on y
  | { kind: "lens"; x: number; y: number; h: number; w?: number; label?: string; color?: string } // biconvex, vertical at x centered on y
  | { kind: "battery"; x: number; y: number; label?: string; color?: string }
  | { kind: "resistor"; x: number; y: number; w?: number; label?: string; color?: string }
  | { kind: "bulb"; x: number; y: number; r?: number; label?: string; color?: string }
  | { kind: "axis"; x: number; y: number; w: number; h: number; xlabel?: string; ylabel?: string; color?: string }
  | { kind: "curve"; pts: Pt[]; dashed?: boolean; label?: string; color?: string }
  | { kind: "label"; x: number; y: number; text: string; color?: string; size?: number };

export type DiagramAction = {
  a: "diagram";
  id?: string;
  title?: string;
  x: number; // logical anchor (top-left of diagram box)
  y: number;
  shapes: Shape[];
  caption?: string;
};

/* ---------- structured solve card ---------- */

export type SolveLine = { text: string; note?: string; result?: boolean };

export type SolveAction = {
  a: "solve";
  id?: string;
  title: string;
  given?: string[];
  lines: SolveLine[];
  x: number;
  y: number;
  w?: number;
};

/* ---------- panels, questions, control ---------- */

export type PanelAction = {
  a: "panel";
  id?: string;
  kind: "question" | "example" | "recap" | "checkpoint" | "mistake" | "objective";
  title: string;
  items?: string[];
  x?: number;
  y?: number;
};

export type AskAction = {
  a: "ask";
  question: string;
  expect?: "short" | "choice";
  choices?: string[];
};

export type CameraAction = { a: "camera"; x?: number; y?: number; zoom?: number; animate?: boolean };
export type WaitAction = { a: "wait"; ms: number };
export type ClearAction = { a: "clear" };
export type SceneMarkAction = { a: "sceneMark"; title: string };

export type BoardAction =
  | WriteAction | HighlightAction | UnderlineAction | CircleAction
  | ArrowAction | DiagramAction | SolveAction | PanelAction
  | AskAction | CameraAction | WaitAction | ClearAction | SceneMarkAction;

/* ---------- a teaching beat: one breath of the lesson ---------- */

export type Beat = {
  speech: string;
  actions: BoardAction[];
  question?: { text: string; expect?: "short" | "choice"; choices?: string[] } | null;
  clear?: boolean;          // wipe the board for a fresh section (archived to history)
  section?: string;         // section label shown as a checkpoint chip
  studentModel?: StudentModel;
  mistakes?: string[];
  done?: boolean;           // lesson complete
};

export type StudentModel = {
  understanding?: number; // 0..1
  confidence?: "low" | "medium" | "high";
  note?: string;
  mistakes?: string[];
};

/* ---------- lesson plan ---------- */

export type Concept = {
  id: string;
  title: string;
  goal: string;          // what the board should establish
  keyTerms?: string[];
  beats?: string[];      // suggested beat sequence for this concept
};

export type QuizQ = { q: string; options: string[]; answer: number; why?: string };

export type LessonPlan = {
  title: string;
  subject?: string;
  grade?: string;
  prerequisites: string[];
  objectives: string[];
  concepts: Concept[];
  quiz: QuizQ[];
  persona?: PersonaId;
  examMode?: boolean;
  topic: string;
  curriculum?: string;
};

/* ---------- teacher personalities ---------- */

export type PersonaId = "professor" | "friendly" | "coach" | "socratic" | "visual";

export const PERSONAS: { id: PersonaId; name: string; blurb: string }[] = [
  { id: "professor", name: "The Professor", blurb: "Calm, rigorous, thorough" },
  { id: "friendly", name: "The Friendly Teacher", blurb: "Simple words, relatable examples" },
  { id: "coach", name: "The Exam Coach", blurb: "Marks, formulas, common mistakes" },
  { id: "socratic", name: "The Socratic Guide", blurb: "Leads you to answers with questions" },
  { id: "visual", name: "The Visual Teacher", blurb: "Draws everything on the board" },
];

export const CURRICULA = ["CBSE", "ICSE", "State Board", "IB", "Custom"] as const;
export const SUBJECTS = ["Physics", "Chemistry", "Biology", "Mathematics", "Other"] as const;

export const EXAMPLE_TOPICS = [
  "Teach me Class 10 CBSE — Light: Reflection and Refraction",
  "Teach me Newton's Laws of Motion",
  "Explain Ohm's Law with a circuit",
  "Photosynthesis — Class 7",
  "Quadratic Equations — Class 10",
];

/* ---------- board element model (what the renderer commits) ---------- */

export type El =
  | { id: string; kind: "text"; beatId?: string; text: string; lines: string[]; x: number; y: number; size: number; style: TextStyle; color: string; align: "left" | "center"; w: number }
  | { id: string; kind: "diagram"; beatId?: string; title?: string; x: number; y: number; shapes: Shape[]; caption?: string }
  | { id: string; kind: "solve"; beatId?: string; title: string; given: string[]; lines: SolveLine[]; x: number; y: number; w: number }
  | { id: string; kind: "panel"; beatId?: string; panelKind: PanelAction["kind"]; title: string; items: string[]; x: number; y: number; w: number }
  | { id: string; kind: "arrow"; beatId?: string; from: Pt; to: Pt; label?: string; color: string; curved?: boolean }
  | { id: string; kind: "highlight"; beatId?: string; x: number; y: number; w: number; h: number; color: string }
  | { id: string; kind: "stroke"; beatId?: string; pts: Pt[]; color: string; width: number; tool: "pen" | "marker" }
  | { id: string; kind: "shape"; beatId?: string; tool: "rect" | "ellipse" | "line" | "arrow"; from: Pt; to: Pt; color: string };

export type BoardSnapshot = { elements: El[]; camera: { x: number; y: number; zoom: number } };

export type Scene = { title: string; at: number; snapshot: BoardSnapshot };
