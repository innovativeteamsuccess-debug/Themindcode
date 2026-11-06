/* ============================================================
   CODE STUDIO — state
   One zustand store: workspace, board objects, camera, tools,
   selection, history, clipboard, AI orchestration, settings.
   Board mutations are immutable; history = object snapshots.
   ============================================================ */

import { create } from "zustand";
import type {
  AIMode,
  AIContext,
  Board,
  CanvasObject,
  ConversationTurn,
  DiagramObj,
  FlashcardsObj,
  Folder,
  GeneratedItem,
  Guide,
  ObjectInput,
  ObjectPatch,
  ShapeObj,
  StickyColor,
  ToolId,
  Vec2,
} from "./types";
import { uid } from "./lib/geometry";
import { runAI } from "./lib/ai-client";
import { buildStarterBoards } from "./lib/starter-boards";
import { loadPersisted, schedulePersist, type StudioPersisted } from "./lib/persistence";
import { emptyStudentModel, type LessonConfig, type LessonPlan, type StudentModel, type Verdict } from "./lesson/types";

type Snapshot = { objects: Record<string, CanvasObject>; zTop: number };

export interface StudioSettings {
  grid: "dots" | "lines" | "none";
  snap: boolean;
  minimap: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
}

export type GenerateKind = "notes" | "flashcards" | "quiz" | "practice" | "summary";

interface StudioState {
  /* workspace */
  folders: Folder[];
  boards: Record<string, Board>;
  activeBoardId: string;
  hydrated: boolean;

  /* canvas */
  camera: { x: number; y: number; z: number };
  viewport: { w: number; h: number };
  tool: ToolId;
  selection: string[];
  editingId: string | null;
  guides: Guide[];
  penColor: string;
  penSize: number;
  stickyColor: StickyColor;
  shapeKind: ShapeObj["shape"];

  /* history */
  past: Snapshot[];
  future: Snapshot[];

  /* clipboard */
  clipboard: CanvasObject[];

  /* ai */
  aiBusy: boolean;
  aiBarOpen: boolean;
  aiPanelOpen: boolean;
  aiPanelTab: "context" | "chat" | "actions" | "generated";
  conversation: ConversationTurn[];
  generated: GeneratedItem[];
  aiCascade: number;

  /* chrome */
  sidebarOpen: boolean;
  paletteOpen: boolean;
  settingsOpen: boolean;
  generateOpen: GenerateKind | null;
  exportOpen: boolean;
  shortcutsOpen: boolean;
  voiceOpen: boolean;
  saved: "idle" | "saving" | "saved";

  settings: StudioSettings;

  /* ---------- lesson mode (the Whiteboard Tutor) ---------- */
  lesson: {
    phase: "idle" | "planning" | "teaching" | "question" | "paused" | "done" | "error";
    config: LessonConfig | null;
    plan: LessonPlan | null;
    title: string;
    stepIndex: number;
    stepTotal: number;
    say: string;
    question: string | null;
    verdict: Verdict | null;
    voice: boolean;
    authRequired: boolean;
    error: string | null;
    checkpoints: { name: string; objects: Record<string, CanvasObject>; zTop: number; camera: { x: number; y: number; z: number } }[];
    student: StudentModel;
  };
  lessonPatch: (p: Partial<StudioState["lesson"]>) => void;
  pushCheckpoint: (name: string) => void;
  restoreCheckpoint: (name: string) => void;
  applyStudent: (u: { understandingDelta?: number; pace?: -1 | 0 | 1; verdict?: Verdict | null }) => void;

  /* ---------- actions ---------- */
  init: () => void;

  createBoard: (folderId: string | null, title?: string, objects?: Record<string, CanvasObject>) => string;
  openBoard: (id: string) => void;
  renameBoard: (id: string, title: string) => void;
  duplicateBoard: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setArchived: (id: string, archived: boolean) => void;
  deleteBoard: (id: string) => void;
  createFolder: (name: string) => void;

  addObject: (obj: ObjectInput & { id?: string; z?: number }) => string;
  addObjects: (objs: (ObjectInput & { id?: string })[]) => string[];
  patchObject: (id: string, patch: ObjectPatch) => void;
  beginGesture: () => void;
  removeObjects: (ids: string[]) => void;
  duplicateObjects: (ids: string[]) => void;
  copySelection: () => void;
  cutSelection: () => void;
  paste: (at?: Vec2) => void;
  groupSelection: () => void;
  ungroupSelection: () => void;
  toggleLock: (id: string) => void;
  bringToFront: (id: string) => void;

  setTool: (t: ToolId) => void;
  setPenColor: (c: string) => void;
  setPenSize: (s: number) => void;
  setStickyColor: (c: StickyColor) => void;
  setShapeKind: (k: ShapeObj["shape"]) => void;

  setCamera: (cam: { x: number; y: number; z: number }) => void;
  zoomBy: (factor: number, cx?: number, cy?: number) => void;
  setViewport: (w: number, h: number) => void;
  zoomToFit: () => void;

  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setEditing: (id: string | null) => void;
  setGuides: (g: Guide[]) => void;

  undo: () => void;
  redo: () => void;

  setAI: (patch: Partial<Pick<StudioState, "aiBusy" | "aiPanelOpen" | "aiPanelTab" | "aiBarOpen" | "aiCascade">>) => void;
  addTurn: (t: Omit<ConversationTurn, "id" | "at">) => void;
  addGenerated: (objId: string, title: string) => void;
  askAI: (mode: AIMode, prompt?: string) => Promise<void>;
  setVoiceOpen: (v: boolean) => void;

  toggle: (k: "sidebarOpen" | "paletteOpen" | "settingsOpen" | "exportOpen" | "shortcutsOpen" | "aiPanelOpen" | "aiBarOpen") => void;
  setGenerate: (k: GenerateKind | null) => void;
  setSetting: <K extends keyof StudioSettings>(k: K, v: StudioSettings[K]) => void;
  markSaving: () => void;
  markSaved: () => void;
  persistNow: () => void;
}

function emptyBoard(title: string, folderId: string | null): Board {
  const now = Date.now();
  return {
    id: uid(),
    title,
    folderId,
    created: now,
    updated: now,
    favorite: false,
    archived: false,
    camera: { x: 0, y: 0, z: 0.9 },
    objects: {},
    zTop: 1,
  };
}

function seedWorkspace(): { folders: Folder[]; boards: Record<string, Board>; activeBoardId: string } {
  const folders: Folder[] = [
    { id: "f-math", name: "Mathematics" },
    { id: "f-sci", name: "Science" },
    { id: "f-proj", name: "Projects" },
  ];
  const starters = buildStarterBoards("f-math", "f-sci", "f-proj");
  const welcome = emptyBoard("Welcome to CODE Studio", null);
  const boards: Record<string, Board> = { [welcome.id]: welcome };
  for (const b of starters) boards[b.id] = b;
  return { folders, boards, activeBoardId: welcome.id };
}

function summarizeObject(o: CanvasObject): string {
  switch (o.kind) {
    case "text":
      return o.text;
    case "sticky":
      return o.text;
    case "equation":
      return o.latex;
    case "ainote":
      return `${o.title}. ${o.body}`;
    case "diagram":
      return `${o.title}: ${o.nodes.map((n) => n.label || n.text.split("\n")[0]).join(", ")}`;
    case "quiz":
      return `${o.title}: ${o.questions.map((q) => q.q).join(" | ")}`;
    case "flashcards":
      return `${o.title}: ${o.cards.map((c) => c.front).join(" | ")}`;
    case "code":
      return `${o.lang} code block`;
    case "table":
      return o.rows.map((r) => r.join(" / ")).join(" | ").slice(0, 200);
    case "image":
      return o.alt || "an image";
    case "shape":
      return `a ${o.shape} shape`;
    case "arrow":
      return o.label ? `an arrow labelled ${o.label}` : "an arrow";
    case "stroke":
      return "(hand-drawn sketch)";
    default:
      return "(object)";
  }
}

export const useStudio = create<StudioState>((set, get) => {
  /* ---------- helpers ---------- */

  const activeBoard = (): Board | undefined => get().boards[get().activeBoardId];

  const withBoard = (fn: (b: Board) => Board) =>
    set((s) => {
      const b = s.boards[s.activeBoardId];
      if (!b) return s;
      const nb = { ...fn(b), updated: Date.now() };
      return { boards: { ...s.boards, [s.activeBoardId]: nb } };
    });

  const snapshot = (): Snapshot => {
    const b = activeBoard();
    return { objects: { ...(b?.objects ?? {}) }, zTop: b?.zTop ?? 1 };
  };

  const commit = () =>
    set((s) => ({
      past: [...s.past.slice(-59), snapshot()],
      future: [],
    }));

  const persist = () => {
    schedulePersist(
      () => {
        const s = get();
        return {
          version: 3,
          folders: s.folders,
          boards: s.boards,
          activeBoardId: s.activeBoardId,
          settings: s.settings as unknown as Record<string, unknown>,
        } satisfies StudioPersisted;
      },
      () => get().markSaved()
    );
    get().markSaving();
  };

  /* ---------- ai orchestration ---------- */

  async function askAIMode(mode: AIMode, prompt?: string) {
    const s = get();
    if (s.aiBusy) return;
    const b = activeBoard();
    if (!b) return;

    const selectionObjs = s.selection.map((id) => b.objects[id]).filter(Boolean);
    const objects = Object.values(b.objects).filter((o) => o.kind !== "stroke");
    const ctx: AIContext = {
      boardTitle: b.title,
      objects: objects.map((o) => ({ kind: o.kind, text: summarizeObject(o) })),
      selection: selectionObjs.map((o) => ({
        id: o.id,
        kind: o.kind,
        text: summarizeObject(o).slice(0, 400),
        latex: o.kind === "equation" ? o.latex : undefined,
      })),
      prompt,
    };

    get().addTurn({ role: "user", mode, text: prompt || modeLabel(mode) });
    get().setAI({ aiBusy: true });

    // placement anchor: selection centre or viewport centre
    const sel =
      selectionObjs.length > 0
        ? selectionObjs.reduce(
            (acc, o) => ({
              x0: Math.min(acc.x0, o.x),
              y0: Math.min(acc.y0, o.y),
              x1: Math.max(acc.x1, o.x + o.w),
              y1: Math.max(acc.y1, o.y + o.h),
            }),
            { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
          )
        : null;
    const worldCenter = sel
      ? { x: (sel.x0 + sel.x1) / 2, y: (sel.y0 + sel.y1) / 2 }
      : {
          x: (-s.camera.x + s.viewport.w / 2) / s.camera.z,
          y: (-s.camera.y + s.viewport.h / 2) / s.camera.z,
        };

    try {
      const { result } = await runAI(mode, ctx);
      const k = get().aiCascade;
      get().setAI({ aiCascade: k + 1 });
      const dropX = worldCenter.x + 340 + (k % 3) * 60;
      const dropY = worldCenter.y - 40 + (k % 2) * 40;

      const created: string[] = [];
      if (result.diagram) {
        const maxX = Math.max(...result.diagram.nodes.map((n) => n.x + n.w), 400);
        const maxY = Math.max(...result.diagram.nodes.map((n) => n.y + n.h), 300);
        created.push(
          get().addObject({
            kind: "diagram",
            x: Math.round(dropX - 160),
            y: Math.round(dropY),
            w: maxX + 40,
            h: maxY + 40,
            title: result.diagram.title,
            nodes: result.diagram.nodes,
            edges: result.diagram.edges ?? [],
          })
        );
      } else if (mode === "practice" && result.problems?.length) {
        created.push(
          get().addObject({
            kind: "flashcards",
            x: Math.round(dropX),
            y: Math.round(dropY),
            w: 320,
            h: 360,
            title: result.title,
            cards: result.problems.map((p) => ({ front: p.prompt, back: `${p.answer}${p.hint ? `\n— ${p.hint}` : ""}` })),
            index: 0,
            flipped: false,
          })
        );
      } else if (result.quiz?.length) {
        created.push(
          get().addObject({
            kind: "quiz",
            x: Math.round(dropX),
            y: Math.round(dropY),
            w: 380,
            h: 420,
            title: result.title,
            questions: result.quiz,
            picked: {},
          })
        );
      } else {
        const steps =
          result.sections?.map((sec) => ({ t: sec.heading, d: sec.points.join("  •  ") })) ?? result.steps;
        created.push(
          get().addObject({
            kind: "ainote",
            x: Math.round(sel ? Math.min(sel.x1 + 80, dropX) : dropX),
            y: Math.round(dropY),
            w: 400,
            h: steps?.length ? Math.min(560, 190 + steps.length * 84) : 250,
            mode,
            title: result.title,
            body: result.body ?? "",
            steps,
            tone: mode === "check" ? "rose" : mode === "hint" ? "amber" : mode === "visualize" ? "blue" : "violet",
          })
        );
      }

      const summary = result.body ?? result.steps?.[0]?.d ?? result.title;
      get().addTurn({ role: "assistant", mode, text: `${result.title} — placed on the canvas. ${summary}`.slice(0, 400) });
      const first = created[0];
      if (first) {
        get().select([first]);
        get().addGenerated(first, result.title);
      }
      get().setAI({ aiBusy: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "AI hit turbulence.";
      get().addTurn({ role: "assistant", text: `⚠ ${msg}` });
      get().setAI({ aiBusy: false });
    }
  }

  function modeLabel(mode: AIMode): string {
    const labels: Record<AIMode, string> = {
      explain: "Explain this",
      solve: "Solve this",
      hint: "Give me a hint",
      simplify: "Make this easier",
      visualize: "Draw it on the canvas",
      check: "Check my work",
      quiz: "Quiz me on this",
      revise: "Turn this into revision notes",
      practice: "Give me practice problems",
      summary: "Summarize everything on this board",
      ask: "Ask",
    };
    return labels[mode];
  }

  return {
    folders: [],
    boards: {},
    activeBoardId: "",
    hydrated: false,

    camera: { x: 0, y: 0, z: 0.9 },
    viewport: { w: 1200, h: 800 },
    tool: "select",
    selection: [],
    editingId: null,
    guides: [],
    penColor: "#7FB0FF",
    penSize: 3,
    stickyColor: "amber",
    shapeKind: "rect",

    past: [],
    future: [],
    clipboard: [],

    aiBusy: false,
    aiBarOpen: false,
    aiPanelOpen: true,
    aiPanelTab: "context",
    conversation: [],
    generated: [],
    aiCascade: 0,

    sidebarOpen: true,
    paletteOpen: false,
    settingsOpen: false,
    generateOpen: null,
    exportOpen: false,
    shortcutsOpen: false,
    voiceOpen: false,
    saved: "idle",

    settings: { grid: "dots", snap: true, minimap: true, reduceMotion: false, highContrast: false },

    lesson: {
      phase: "idle",
      config: null,
      plan: null,
      title: "",
      stepIndex: 0,
      stepTotal: 0,
      say: "",
      question: null,
      verdict: null,
      voice: true,
      authRequired: false,
      error: null,
      checkpoints: [],
      student: emptyStudentModel(),
    },

    /* ---------- init ---------- */
    init: () => {
      const saved = loadPersisted();
      if (saved) {
        set({
          folders: saved.folders,
          boards: saved.boards,
          activeBoardId: saved.activeBoardId,
          settings: { ...get().settings, ...(saved.settings as unknown as StudioSettings) },
          hydrated: true,
          camera: saved.boards[saved.activeBoardId]?.camera ?? { x: 0, y: 0, z: 0.9 },
        });
      } else {
        const seed = seedWorkspace();
        set({ ...seed, hydrated: true });
      }
    },

    /* ---------- workspace ---------- */
    createBoard: (folderId, title, objects) => {
      const b = emptyBoard(title || "Untitled board", folderId);
      if (objects) {
        let z = 1;
        for (const o of Object.values(objects)) {
          b.objects[o.id] = { ...o, z: z++ };
        }
        b.zTop = z;
      }
      set((s) => ({
        boards: { ...s.boards, [b.id]: b },
        activeBoardId: b.id,
        camera: b.camera,
        selection: [],
        past: [],
        future: [],
      }));
      persist();
      return b.id;
    },

    openBoard: (id) => {
      const b = get().boards[id];
      if (!b) return;
      set(() => ({
        activeBoardId: id,
        camera: b.camera,
        selection: [],
        editingId: null,
        past: [],
        future: [],
      }));
    },

    renameBoard: (id, title) => {
      set((s) => {
        const b = s.boards[id];
        if (!b) return s;
        return { boards: { ...s.boards, [id]: { ...b, title, updated: Date.now() } } };
      });
      persist();
    },

    duplicateBoard: (id) => {
      const src = get().boards[id];
      if (!src) return;
      const copy = emptyBoard(`${src.title} (copy)`, src.folderId);
      const map: Record<string, string> = {};
      for (const [oid, o] of Object.entries(src.objects)) {
        const nid = uid();
        map[oid] = nid;
        copy.objects[nid] = JSON.parse(JSON.stringify({ ...o, id: nid }));
      }
      // remap diagram edges & arrow attaches
      for (const o of Object.values(copy.objects)) {
        if (o.kind === "diagram") {
          o.nodes = o.nodes.map((n) => ({ ...n, id: map[n.id] ?? n.id }));
          o.edges = o.edges.map((e) => ({ ...e, id: uid(), from: map[e.from] ?? e.from, to: map[e.to] ?? e.to }));
        }
      }
      set((s) => ({ boards: { ...s.boards, [copy.id]: copy } }));
      persist();
    },

    toggleFavorite: (id) => {
      set((s) => {
        const b = s.boards[id];
        if (!b) return s;
        return { boards: { ...s.boards, [id]: { ...b, favorite: !b.favorite } } };
      });
      persist();
    },

    setArchived: (id, archived) => {
      set((s) => {
        const b = s.boards[id];
        if (!b) return s;
        return { boards: { ...s.boards, [id]: { ...b, archived } } };
      });
      persist();
    },

    deleteBoard: (id) => {
      set((s) => {
        const boards = { ...s.boards };
        delete boards[id];
        const rest = Object.values(boards).filter((b) => !b.archived);
        const nextActive = s.activeBoardId === id ? rest[0]?.id ?? "" : s.activeBoardId;
        return { boards, activeBoardId: nextActive, camera: boards[nextActive]?.camera ?? s.camera };
      });
      persist();
    },

    createFolder: (name) => {
      set((s) => ({ folders: [...s.folders, { id: uid(), name }] }));
      persist();
    },

    /* ---------- objects ---------- */
    addObject: (obj) => {
      const id = obj.id ?? uid();
      commit();
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const z = obj.z ?? b.zTop;
        const full = { ...obj, id, z } as CanvasObject;
        return {
          boards: {
            ...s.boards,
            [s.activeBoardId]: {
              ...b,
              objects: { ...b.objects, [id]: full },
              zTop: Math.max(b.zTop, z) + 1,
              updated: Date.now(),
            },
          },
        };
      });
      persist();
      return id;
    },

    addObjects: (objs) => {
      commit();
      const ids: string[] = [];
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const next = { ...b.objects };
        let z = b.zTop;
        for (const o of objs) {
          const id = o.id ?? uid();
          ids.push(id);
          next[id] = { ...o, id, z } as CanvasObject;
          z += 1;
        }
        return {
          boards: { ...s.boards, [s.activeBoardId]: { ...b, objects: next, zTop: z + 1, updated: Date.now() } },
        };
      });
      persist();
      return ids;
    },

    patchObject: (id, patch) => {
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const cur = b.objects[id];
        if (!cur) return s;
        return {
          boards: {
            ...s.boards,
            [s.activeBoardId]: {
              ...b,
              objects: { ...b.objects, [id]: { ...cur, ...patch } as CanvasObject },
              updated: Date.now(),
            },
          },
        };
      });
    },

    beginGesture: () => {
      commit();
      persist();
    },

    removeObjects: (ids) => {
      if (!ids.length) return;
      commit();
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const next = { ...b.objects };
        for (const id of ids) delete next[id];
        return {
          boards: { ...s.boards, [s.activeBoardId]: { ...b, objects: next, updated: Date.now() } },
          selection: s.selection.filter((x) => !ids.includes(x)),
        };
      });
      persist();
    },

    duplicateObjects: (ids) => {
      const b = activeBoard();
      if (!b) return;
      const clones: ObjectInput[] = [];
      const map: Record<string, string> = {};
      for (const id of ids) {
        const o = b.objects[id];
        if (!o) continue;
        const nid = uid();
        map[id] = nid;
        clones.push({ ...JSON.parse(JSON.stringify(o)), id: nid, x: o.x + 26, y: o.y + 26 });
      }
      for (const o of clones) {
        if (o.kind === "diagram") {
          const d = o as unknown as DiagramObj;
          d.nodes = d.nodes.map((n) => ({ ...n, id: map[n.id] ?? n.id }));
          d.edges = d.edges.map((e) => ({ ...e, id: uid(), from: map[e.from] ?? e.from, to: map[e.to] ?? e.to }));
        }
      }
      const newIds = get().addObjects(clones.map((c) => ({ ...c })));
      get().select(newIds);
    },

    copySelection: () => {
      const b = activeBoard();
      if (!b) return;
      const sel = get().selection.map((id) => b.objects[id]).filter(Boolean);
      if (sel.length) set({ clipboard: JSON.parse(JSON.stringify(sel)) });
    },

    cutSelection: () => {
      get().copySelection();
      get().removeObjects(get().selection);
    },

    paste: (at) => {
      const clip = get().clipboard;
      if (!clip.length) return;
      const s = get();
      const center = at ?? {
        x: (-s.camera.x + s.viewport.w / 2) / s.camera.z,
        y: (-s.camera.y + s.viewport.h / 2) / s.camera.z,
      };
      const minX = Math.min(...clip.map((o) => o.x));
      const minY = Math.min(...clip.map((o) => o.y));
      const dx = center.x - minX - 30;
      const dy = center.y - minY - 30;
      const clones = clip.map((o) => ({ ...JSON.parse(JSON.stringify(o)), x: o.x + dx, y: o.y + dy }));
      const ids = get().addObjects(clones);
      get().select(ids);
    },

    groupSelection: () => {
      const sel = get().selection;
      if (sel.length < 2) return;
      const gid = `g${uid()}`;
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const next = { ...b.objects };
        for (const id of sel) {
          const o = next[id];
          if (o) next[id] = { ...o, groupId: gid } as CanvasObject;
        }
        return { boards: { ...s.boards, [s.activeBoardId]: { ...b, objects: next, updated: Date.now() } } };
      });
      persist();
    },

    ungroupSelection: () => {
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const next = { ...b.objects };
        for (const id of s.selection) {
          const o = next[id];
          if (o?.groupId) next[id] = { ...o, groupId: undefined } as CanvasObject;
        }
        return { boards: { ...s.boards, [s.activeBoardId]: { ...b, objects: next, updated: Date.now() } } };
      });
      persist();
    },

    toggleLock: (id) => {
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const o = b.objects[id];
        if (!o) return s;
        return {
          boards: {
            ...s.boards,
            [s.activeBoardId]: { ...b, objects: { ...b.objects, [id]: { ...o, locked: !o.locked } as CanvasObject }, updated: Date.now() },
          },
        };
      });
      persist();
    },

    bringToFront: (id) => {
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return s;
        const o = b.objects[id];
        if (!o) return s;
        return {
          boards: {
            ...s.boards,
            [s.activeBoardId]: { ...b, objects: { ...b.objects, [id]: { ...o, z: b.zTop } as CanvasObject }, zTop: b.zTop + 1 },
          },
        };
      });
      persist();
    },

    /* ---------- tools ---------- */
    setTool: (t) => {
      set({ tool: t, editingId: null });
      if (t !== "select") set({ selection: get().selection });
    },
    setPenColor: (c) => set({ penColor: c }),
    setPenSize: (v) => set({ penSize: v }),
    setStickyColor: (c) => set({ stickyColor: c }),
    setShapeKind: (k) => set({ shapeKind: k }),

    /* ---------- camera ---------- */
    setCamera: (cam) => {
      const z = Math.min(2.6, Math.max(0.18, cam.z));
      set({ camera: { x: cam.x, y: cam.y, z } });
      withBoard((b) => ({ ...b, camera: { x: cam.x, y: cam.y, z } }));
    },

    zoomBy: (factor, cx, cy) => {
      const s = get();
      const { x, y, z } = s.camera;
      const nz = Math.min(2.6, Math.max(0.18, z * factor));
      const px = cx ?? s.viewport.w / 2;
      const py = cy ?? s.viewport.h / 2;
      const wx = (px - x) / z;
      const wy = (py - y) / z;
      get().setCamera({ x: px - wx * nz, y: py - wy * nz, z: nz });
    },

    setViewport: (w, h) => set({ viewport: { w, h } }),

    zoomToFit: () => {
      const s = get();
      const b = s.boards[s.activeBoardId];
      if (!b) return;
      const objs = Object.values(b.objects);
      if (!objs.length) {
        get().setCamera({ x: 0, y: 0, z: 0.9 });
        return;
      }
      let x0 = Infinity,
        y0 = Infinity,
        x1 = -Infinity,
        y1 = -Infinity;
      for (const o of objs) {
        x0 = Math.min(x0, o.x);
        y0 = Math.min(y0, o.y);
        x1 = Math.max(x1, o.x + o.w);
        y1 = Math.max(y1, o.y + o.h);
      }
      const pad = 90;
      const w = x1 - x0 + pad * 2;
      const h = y1 - y0 + pad * 2;
      const z = Math.min(2.2, Math.max(0.18, Math.min(s.viewport.w / w, s.viewport.h / h)));
      get().setCamera({
        x: s.viewport.w / 2 - (x0 + (x1 - x0) / 2) * z,
        y: s.viewport.h / 2 - (y0 + (y1 - y0) / 2) * z,
        z,
      });
    },

    /* ---------- selection ---------- */
    select: (ids, additive) => {
      set((s) => ({
        selection: additive ? Array.from(new Set([...s.selection, ...ids])) : ids,
        editingId: null,
      }));
    },
    clearSelection: () => set({ selection: [], editingId: null }),
    selectAll: () => {
      const b = activeBoard();
      if (!b) return;
      set({ selection: Object.keys(b.objects) });
    },
    setEditing: (id) => set({ editingId: id }),
    setGuides: (g) => set({ guides: g }),

    /* ---------- history ---------- */
    undo: () => {
      const s = get();
      if (!s.past.length) return;
      const prev = s.past[s.past.length - 1];
      const cur = snapshot();
      set((st) => ({
        past: st.past.slice(0, -1),
        future: [...st.future.slice(-59), cur],
        selection: st.selection.filter((id) => prev.objects[id]),
      }));
      withBoard((b) => ({ ...b, objects: prev.objects, zTop: prev.zTop }));
      persist();
    },

    redo: () => {
      const s = get();
      if (!s.future.length) return;
      const next = s.future[s.future.length - 1];
      const cur = snapshot();
      set((st) => ({
        future: st.future.slice(0, -1),
        past: [...st.past.slice(-59), cur],
        selection: st.selection.filter((id) => next.objects[id]),
      }));
      withBoard((b) => ({ ...b, objects: next.objects, zTop: next.zTop }));
      persist();
    },

    /* ---------- ai ---------- */
    setAI: (patch) => set(patch),
    addTurn: (t) =>
      set((s) => ({
        conversation: [...s.conversation.slice(-39), { ...t, id: uid(), at: Date.now() }],
      })),

    addGenerated: (objId, title) =>
      set((s) => {
        const kind = s.boards[s.activeBoardId]?.objects[objId]?.kind;
        const k: "note" | "diagram" | "quiz" | "flashcards" | "summary" =
          kind === "diagram" ? "diagram" : kind === "quiz" ? "quiz" : kind === "flashcards" ? "flashcards" : kind === "ainote" ? "note" : "summary";
        return { generated: [...s.generated.slice(-19), { id: uid(), kind: k, title, at: Date.now(), objId }] };
      }),

    askAI: async (mode, prompt) => {
      await askAIMode(mode, prompt);
    },
    setVoiceOpen: (v) => set({ voiceOpen: v }),

    /* ---------- chrome ---------- */
    toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<StudioState>),
    setGenerate: (k) => set({ generateOpen: k }),
    setSetting: (k, v) => {
      set((s) => ({ settings: { ...s.settings, [k]: v } }));
      persist();
    },
    markSaving: () => set((s) => (s.saved === "saving" ? s : { saved: "saving" })),
    markSaved: () => set({ saved: "saved" }),
    persistNow: () => {
      persist();
    },

    /* ---------- lesson mode ---------- */
    lessonPatch: (p) => set((s) => ({ lesson: { ...s.lesson, ...p } })),
    pushCheckpoint: (name) =>
      set((s) => {
        const b = s.boards[s.activeBoardId];
        if (!b) return {};
        const cp = {
          name,
          objects: JSON.parse(JSON.stringify(b.objects)) as Record<string, CanvasObject>,
          zTop: b.zTop,
          camera: { ...s.camera },
        };
        return { lesson: { ...s.lesson, checkpoints: [...s.lesson.checkpoints.slice(-8), cp] } };
      }),
    restoreCheckpoint: (name) =>
      set((s) => {
        const cp = s.lesson.checkpoints.find((c) => c.name === name);
        const b = s.boards[s.activeBoardId];
        if (!cp || !b) return {};
        return {
          boards: {
            ...s.boards,
            [b.id]: { ...b, objects: JSON.parse(JSON.stringify(cp.objects)), zTop: cp.zTop, updated: Date.now() },
          },
          camera: cp.camera,
          past: [...s.past, { objects: b.objects, zTop: b.zTop }].slice(-40),
          future: [],
          selection: [],
        };
      }),
    applyStudent: (u) =>
      set((s) => {
        const st = { ...s.lesson.student };
        if (typeof u.understandingDelta === "number") {
          st.understanding = Math.max(0, Math.min(100, st.understanding + u.understandingDelta));
        }
        if (u.pace === -1 || u.pace === 0 || u.pace === 1) st.pace = u.pace;
        if (u.verdict === "good" || u.verdict === "partly" || u.verdict === "wrong") {
          st.answered += 1;
          if (u.verdict === "good") st.correct += 1;
        }
        try {
          window.localStorage.setItem("tmc-student-model-v1", JSON.stringify(st));
        } catch { /* noop */ }
        return { lesson: { ...s.lesson, student: st } };
      }),
  };
});

/* ---------- derived helpers ---------- */

export function useActiveBoard(): Board | undefined {
  return useStudio((s) => s.boards[s.activeBoardId]);
}

export function selectionBBox(objs: Record<string, CanvasObject>, ids: string[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const id of ids) {
    const o = objs[id];
    if (!o) continue;
    x0 = Math.min(x0, o.x);
    y0 = Math.min(y0, o.y);
    x1 = Math.max(x1, o.x + o.w);
    y1 = Math.max(y1, o.y + o.h);
  }
  if (x0 === Infinity) return null;
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export type { FlashcardsObj };
