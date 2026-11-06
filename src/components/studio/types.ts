/* ============================================================
   CODE STUDIO — core types
   ============================================================ */

export type Vec2 = { x: number; y: number };

export type ToolId =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "text"
  | "equation"
  | "shape"
  | "arrow"
  | "image"
  | "sticky"
  | "diagram"
  | "ai"
  | "voice"
  | "hand";

export type AIMode =
  | "explain"
  | "solve"
  | "hint"
  | "simplify"
  | "visualize"
  | "check"
  | "quiz"
  | "revise"
  | "practice"
  | "summary"
  | "ask";

export const AI_MODES: { id: AIMode; label: string; verb: string; hint: string }[] = [
  { id: "explain", label: "Explain", verb: "Explain this", hint: "Step-by-step teaching for the selection" },
  { id: "solve", label: "Solve", verb: "Solve this", hint: "Solve with animated intermediate steps" },
  { id: "hint", label: "Hint", verb: "Give me a hint", hint: "Only the next useful hint — no answers" },
  { id: "simplify", label: "Simplify", verb: "Make this easier", hint: "Rewrite it in simpler language" },
  { id: "visualize", label: "Visualize", verb: "Draw it", hint: "Turn the concept into a diagram" },
  { id: "check", label: "Check", verb: "Check my work", hint: "Find and explain mistakes" },
  { id: "quiz", label: "Quiz", verb: "Quiz me", hint: "Questions built from this board" },
  { id: "revise", label: "Revise", verb: "Make revision notes", hint: "Structured revision material" },
];

export interface BaseObj {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  locked?: boolean;
  groupId?: string;
  /** 0..1 progressive reveal — the lesson player hand-writes objects.
      Undefined/1 = fully visible (free-canvas tools unaffected). */
  ink?: number;
}

export interface StrokeObj extends BaseObj {
  kind: "stroke";
  points: Vec2[]; // relative to x,y
  color: string;
  size: number;
  opacity: number;
  highlighter: boolean;
}

export interface TextObj extends BaseObj {
  kind: "text";
  text: string;
  color: string;
  size: number;
}

export interface EquationObj extends BaseObj {
  kind: "equation";
  latex: string;
  scale: number;
}

export interface ShapeObj extends BaseObj {
  kind: "shape";
  shape: "rect" | "ellipse" | "triangle" | "diamond";
  fill: string;
  stroke: string;
  dash?: boolean;
}

export interface Attach {
  id: string; // object id the end is glued to
  side: "left" | "right" | "top" | "bottom";
}

export interface ArrowObj extends BaseObj {
  kind: "arrow";
  x2: number; // relative to x,y
  y2: number;
  color: string;
  label?: string;
  elbow?: boolean;
  fromAttach?: Attach;
  toAttach?: Attach;
}

export interface ImageObj extends BaseObj {
  kind: "image";
  src: string;
  alt?: string;
}

export type StickyColor = "amber" | "blue" | "emerald" | "violet" | "rose";

export interface StickyObj extends BaseObj {
  kind: "sticky";
  text: string;
  color: StickyColor;
}

export interface MathStep {
  t: string;
  d?: string;
  latex?: string;
}

export type AITone = "violet" | "blue" | "emerald" | "rose" | "amber";

export interface AINoteObj extends BaseObj {
  kind: "ainote";
  mode: AIMode;
  title: string;
  body: string;
  steps?: MathStep[];
  latex?: string[];
  tone: AITone;
}

export interface DiagramNode {
  id: string;
  label: string;
  x: number; // relative to the diagram object
  y: number;
  w: number;
  h: number;
  shape: "rect" | "rounded" | "pill" | "ellipse" | "diamond";
  fill: string;
  text: string;
}

export interface DiagramEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

export interface DiagramObj extends BaseObj {
  kind: "diagram";
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** optional real curve to plot inside the node named "plot" */
  poly?: { a: number; b: number; c: number };
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why?: string;
}

export interface QuizObj extends BaseObj {
  kind: "quiz";
  title: string;
  questions: QuizQuestion[];
  picked: Record<string, number>;
}

export interface CodeObj extends BaseObj {
  kind: "code";
  code: string;
  lang: string;
}

export interface TableObj extends BaseObj {
  kind: "table";
  rows: string[][];
  header: boolean;
}

export interface FlashcardsObj extends BaseObj {
  kind: "flashcards";
  title: string;
  cards: { front: string; back: string }[];
  index: number;
  flipped: boolean;
}

export type CanvasObject =
  | StrokeObj
  | TextObj
  | EquationObj
  | ShapeObj
  | ArrowObj
  | ImageObj
  | StickyObj
  | AINoteObj
  | DiagramObj
  | QuizObj
  | CodeObj
  | TableObj
  | FlashcardsObj;

export type ObjectKind = CanvasObject["kind"];

/* Distributive Omit/Partial — keeps the union intact for object literals */
export type DistOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type DistPartial<T> = T extends unknown ? Partial<T> : never;
/** a fresh object (id optional, z omitted) */
export type ObjectNew = DistOmit<CanvasObject, "z">;
/** a fresh object without id/z */
export type ObjectInput = DistOmit<CanvasObject, "id" | "z">;
/** a partial patch of any object */
export type ObjectPatch = DistPartial<CanvasObject>;

/* ---------------- workspace ---------------- */

export interface Folder {
  id: string;
  name: string;
}

export interface Board {
  id: string;
  title: string;
  folderId: string | null;
  created: number;
  updated: number;
  favorite: boolean;
  archived: boolean;
  camera: { x: number; y: number; z: number };
  objects: Record<string, CanvasObject>;
  zTop: number;
}

export interface ConversationTurn {
  id: string;
  role: "user" | "assistant";
  mode?: AIMode;
  text: string;
  at: number;
}

export interface GeneratedItem {
  id: string;
  kind: "note" | "diagram" | "quiz" | "flashcards" | "summary";
  title: string;
  at: number;
  objId: string;
}

/* ---------------- AI result contract ---------------- */

export interface AIResult {
  title: string;
  body?: string;
  steps?: MathStep[];
  latex?: string[];
  diagram?: { title: string; nodes: DiagramNode[]; edges: DiagramEdge[] };
  quiz?: QuizQuestion[];
  flashcards?: { front: string; back: string }[];
  sections?: { heading: string; points: string[] }[];
  problems?: { prompt: string; answer: string; hint?: string }[];
}

export interface AISelectionContext {
  id: string;
  kind: ObjectKind;
  text: string;
  latex?: string;
}

export interface AIContext {
  boardTitle: string;
  objects: { kind: ObjectKind; text: string }[];
  selection: AISelectionContext[];
  prompt?: string;
}

/* ---------------- guides / snapping ---------------- */

export interface Guide {
  axis: "x" | "y";
  at: number; // world coord
  from: number;
  to: number;
}
