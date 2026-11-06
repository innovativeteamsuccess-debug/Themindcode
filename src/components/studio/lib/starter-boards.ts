/* ============================================================
   CODE STUDIO — starter boards
   Five example boards with genuine educational content.
   Math is solved by the local engine; diagrams are structured
   and editable. Content follows CBSE-friendly framing.
   ============================================================ */

import type { Board, CanvasObject, DiagramEdge, DiagramNode, ObjectNew } from "../types";
import { sampleGraph, solveEquation } from "./math-engine";

let seq = 0;
function nid(): string {
  seq += 1;
  return `s${Date.now().toString(36)}${seq}`;
}

function board(title: string, folderId: string | null, objects: ObjectNew[]): Board {
  const rec: Record<string, CanvasObject> = {};
  let z = 1;
  for (const o of objects) {
    const id = o.id || nid();
    rec[id] = { ...o, id, z: z++ } as CanvasObject;
  }
  const now = Date.now();
  return {
    id: nid(),
    title,
    folderId,
    created: now,
    updated: now,
    favorite: false,
    archived: false,
    camera: { x: 271, y: 20, z: 0.72 },
    objects: rec,
    zTop: z,
  };
}

const BLUE = "#FF9E3D";
const VIOLET = "#A78BFA";
const CYAN = "#39C4F0";
const EMERALD = "#3DDC97";
const AMBER = "#F5B83D";
const ROSE = "#FF7A93";

/* ---------------- Quadratic Equations ---------------- */

function quadraticBoard(folderId: string | null): Board {
  const solved = solveEquation("x^2 - 5x + 6 = 0")!;
  const g = sampleGraph(solved.poly)!;
  // map sample into a 360×240 plot area with padding
  const PAD = 26;
  const ys = g.points.map((p) => p.y);
  const yMin = Math.min(...ys),
    yMax = Math.max(...ys);
  const pts = g.points.map((p) => ({
    x: PAD + ((p.x - g.xMin) / (g.xMax - g.xMin)) * (360 - PAD * 2),
    y: 240 - PAD - ((p.y - yMin) / (yMax - yMin || 1)) * (240 - PAD * 2),
  }));
  const px = (x: number) => PAD + ((x - g.xMin) / (g.xMax - g.xMin)) * (360 - PAD * 2);
  const py = (y: number) => 240 - PAD - ((y - yMin) / (yMax - yMin || 1)) * (240 - PAD * 2);

  const nodes: DiagramNode[] = [
    { id: "n-plot", label: "", x: 0, y: 0, w: 360, h: 240, shape: "rounded", fill: "rgba(21,22,28,0.9)", text: "" },
    { id: "n-root1", label: "", x: px(g.roots[0]) - 34, y: py(0) - 30, w: 68, h: 26, shape: "pill", fill: "rgba(61,220,151,0.16)", text: `x = ${g.roots[0]}` },
    { id: "n-root2", label: "", x: px(g.roots[1]) - 34, y: py(0) - 30, w: 68, h: 26, shape: "pill", fill: "rgba(61,220,151,0.16)", text: `x = ${g.roots[1]}` },
    { id: "n-vx", label: "", x: px(g.vertex!.x) - 44, y: Math.max(6, py(g.vertex!.y) - 30), w: 88, h: 26, shape: "pill", fill: "rgba(167,139,250,0.14)", text: `vertex (${g.vertex!.x}, ${g.vertex!.y})` },
  ];
  const edges: DiagramEdge[] = [
    { id: "e1", from: "n-root1", to: "n-root2", dashed: true },
  ];

  return board("Quadratic Equations", folderId, [
    {
      id: nid(),
      kind: "text",
      x: 40,
      y: 40,
      w: 420,
      h: 90,
      text: "A quadratic is any equation that can be written ax² + bx + c = 0. The graph is always a parabola — the roots are exactly where it crosses the x-axis.",
      color: "#F4EFE9",
      size: 15,
    },
    { id: nid(), kind: "equation", x: 40, y: 160, w: 300, h: 74, latex: "x^{2} - 5x + 6 = 0", scale: 1 },
    {
      id: nid(),
      kind: "ainote",
      x: 40,
      y: 260,
      w: 420,
      h: 470,
      mode: "solve",
      title: "Solved step by step",
      body: solved.title,
      steps: solved.steps,
      tone: "blue",
    },
    { id: nid(), kind: "diagram", x: 540, y: 160, w: 360, h: 240, title: "y = x² − 5x + 6", nodes, edges, poly: solved.poly },
    { id: nid(), kind: "sticky", x: 560, y: 460, w: 210, h: 170, color: "amber", text: "D = b² − 4ac tells you how many roots exist before you solve anything." },
    { id: nid(), kind: "sticky", x: 800, y: 460, w: 210, h: 170, color: "emerald", text: "Roots multiply to c/a and add to −b/a. Quick sanity check!" },
    { id: nid(), kind: "quiz", x: 540, y: 40, w: 380, h: 96, title: "Quick check", picked: {}, questions: [
      { q: "What is the discriminant of x² − 5x + 6 = 0?", options: ["1", "25", "−1", "49"], answer: 0, why: "D = (−5)² − 4·1·6 = 25 − 24 = 1." },
    ] },
  ]);
}

/* ---------------- Photosynthesis ---------------- */

function photosynthesisBoard(folderId: string | null): Board {
  const nodes: DiagramNode[] = [
    { id: "p-sun", label: "Sunlight", x: 30, y: 60, w: 110, h: 46, shape: "pill", fill: "rgba(245,184,61,0.16)", text: "☀ Sunlight" },
    { id: "p-water", label: "Water", x: 30, y: 190, w: 110, h: 46, shape: "pill", fill: "rgba(57,196,240,0.14)", text: "💧 H₂O" },
    { id: "p-co2", label: "CO₂", x: 30, y: 320, w: 110, h: 46, shape: "pill", fill: "rgba(169,188,224,0.12)", text: "CO₂" },
    { id: "p-leaf", label: "Leaf", x: 250, y: 170, w: 190, h: 120, shape: "rounded", fill: "rgba(61,220,151,0.13)", text: "LEAF\nchloroplast — chlorophyll traps light energy" },
    { id: "p-glu", label: "Glucose", x: 550, y: 140, w: 130, h: 46, shape: "pill", fill: "rgba(245,184,61,0.14)", text: "Glucose (food)" },
    { id: "p-o2", label: "Oxygen", x: 550, y: 260, w: 130, h: 46, shape: "pill", fill: "rgba(61,220,151,0.14)", text: "O₂ (out)" },
  ];
  const edges: DiagramEdge[] = [
    { id: "pe1", from: "p-sun", to: "p-leaf" },
    { id: "pe2", from: "p-water", to: "p-leaf" },
    { id: "pe3", from: "p-co2", to: "p-leaf" },
    { id: "pe4", from: "p-leaf", to: "p-glu" },
    { id: "pe5", from: "p-leaf", to: "p-o2" },
  ];
  return board("Photosynthesis", folderId, [
    {
      id: nid(),
      kind: "text",
      x: 40,
      y: 40,
      w: 470,
      h: 80,
      text: "Photosynthesis — how plants turn light into food. Inputs, the factory, and the outputs, all in one diagram.",
      color: "#F4EFE9",
      size: 15,
    },
    { id: nid(), kind: "equation", x: 40, y: 140, w: 380, h: 80, latex: "6CO_2 + 6H_2O \\xrightarrow{\\text{light}} C_6H_{12}O_6 + 6O_2", scale: 0.9 },
    { id: nid(), kind: "diagram", x: 40, y: 250, w: 710, h: 410, title: "The photosynthesis pipeline", nodes, edges },
    { id: nid(), kind: "ainote", x: 800, y: 250, w: 360, h: 360, mode: "explain", title: "Why it matters", tone: "emerald",
      body: "Every bite of food traces back to this reaction. The chloroplast captures light energy and uses it to glue CO₂ and water into glucose — releasing the oxygen you just breathed in as a by-product.",
      steps: [
        { t: "Capture", d: "Chlorophyll absorbs light energy." },
        { t: "Split", d: "Water molecules are split — oxygen escapes." },
        { t: "Build", d: "CO₂ is assembled into glucose (food)." },
      ] },
    { id: nid(), kind: "sticky", x: 800, y: 640, w: 220, h: 150, color: "blue", text: "Exam lens: label inputs vs outputs, and name the organelle — chloroplast." },
  ]);
}

/* ---------------- Newton's Laws ---------------- */

function newtonBoard(folderId: string | null): Board {
  return board("Newton's Laws", folderId, [
    { id: nid(), kind: "text", x: 40, y: 40, w: 430, h: 60, text: "Three laws that explain every push, pull and orbit you will ever meet.", color: "#F4EFE9", size: 15 },
    { id: nid(), kind: "ainote", x: 40, y: 130, w: 330, h: 300, mode: "explain", tone: "blue", title: "First law — Inertia",
      body: "An object keeps doing what it is doing — resting or moving straight at constant speed — until a net external force acts on it.",
      steps: [{ t: "No net force ⇒ no change in velocity" }] },
    { id: nid(), kind: "ainote", x: 400, y: 130, w: 330, h: 300, mode: "explain", tone: "violet", title: "Second law — F = ma",
      body: "Force equals mass times acceleration. Double the force, double the acceleration; double the mass, halve it.",
      steps: [{ t: "F = ma", d: "Force in newtons, mass in kg, acceleration in m/s²" }] },
    { id: nid(), kind: "ainote", x: 760, y: 130, w: 330, h: 300, mode: "explain", tone: "emerald", title: "Third law — Action–reaction",
      body: "Forces come in pairs. You push the wall, the wall pushes you back — equal strength, opposite direction, different objects.",
      steps: [{ t: "A on B = −B on A" }] },
    { id: nid(), kind: "equation", x: 400, y: 470, w: 220, h: 74, latex: "F = m \\cdot a", scale: 1.1 },
    { id: nid(), kind: "arrow", x: 300, y: 320, w: 60, h: 30, x2: 80, y2: 0, color: "#BAB3A8" },
    { id: nid(), kind: "arrow", x: 660, y: 320, w: 60, h: 30, x2: 80, y2: 0, color: "#BAB3A8" },
    { id: nid(), kind: "sticky", x: 40, y: 470, w: 220, h: 160, color: "amber", text: "Rocket logic: gas pushed down (action), rocket pushed up (reaction)." },
    { id: nid(), kind: "quiz", x: 660, y: 470, w: 380, h: 240, title: "Test yourself", picked: {}, questions: [
      { q: "A book rests on a table. The reaction force to the book's weight is…", options: ["Friction from the table", "The table pushing the book up", "The book pushing Earth", "Air resistance"], answer: 1, why: "Weight (Earth pulls book) pairs with the table pushing the book up." },
      { q: "Doubling the mass with the same force does what to acceleration?", options: ["Doubles it", "Halves it", "Squares it", "No change"], answer: 1, why: "a = F/m — twice the m means half the a." },
    ] },
  ]);
}

/* ---------------- French Revolution ---------------- */

function revolutionBoard(folderId: string | null): Board {
  const nodes: DiagramNode[] = [
    { id: "f-89", label: "1789", x: 10, y: 120, w: 118, h: 74, shape: "rounded", fill: "rgba(255,158,61,0.14)", text: "1789\nStorming of the Bastille" },
    { id: "f-91", label: "1791", x: 158, y: 60, w: 118, h: 74, shape: "rounded", fill: "rgba(169,188,224,0.1)", text: "1791\nConstitution — limited monarchy" },
    { id: "f-92", label: "1792", x: 306, y: 120, w: 118, h: 74, shape: "rounded", fill: "rgba(167,139,250,0.13)", text: "1792\nRepublic declared" },
    { id: "f-93", label: "1793", x: 454, y: 60, w: 118, h: 74, shape: "rounded", fill: "rgba(255,122,147,0.12)", text: "1793\nReign of Terror begins" },
    { id: "f-94", label: "1794", x: 602, y: 120, w: 118, h: 74, shape: "rounded", fill: "rgba(169,188,224,0.1)", text: "1794\nThermidor — Terror ends" },
    { id: "f-99", label: "1799", x: 750, y: 60, w: 118, h: 74, shape: "rounded", fill: "rgba(245,184,61,0.13)", text: "1799\nNapoleon takes power" },
  ];
  const edges: DiagramEdge[] = [
    { id: "fe1", from: "f-89", to: "f-91" },
    { id: "fe2", from: "f-91", to: "f-92" },
    { id: "fe3", from: "f-92", to: "f-93" },
    { id: "fe4", from: "f-93", to: "f-94" },
    { id: "fe5", from: "f-94", to: "f-99" },
  ];
  return board("French Revolution", folderId, [
    { id: nid(), kind: "text", x: 40, y: 40, w: 470, h: 80, text: "1789–1799: how a bread crisis and big ideas about equality rewired a kingdom — and modern politics.", color: "#F4EFE9", size: 15 },
    { id: nid(), kind: "diagram", x: 40, y: 150, w: 880, h: 210, title: "Ten years that changed everything", nodes, edges },
    { id: nid(), kind: "ainote", x: 40, y: 400, w: 400, h: 320, mode: "explain", tone: "rose", title: "Why did it explode?",
      body: "Three pressures converged: financial ruin from wars, an unfair tax system resting on the Third Estate, and Enlightenment ideas that made inequality look like a choice, not fate.",
      steps: [
        { t: "Money", d: "Bankruptcy after costly wars." },
        { t: "Fairness", d: "Clergy & nobles paid almost no tax." },
        { t: "Ideas", d: "Liberty, equality, fraternity — everywhere in print." },
      ] },
    { id: nid(), kind: "sticky", x: 480, y: 400, w: 220, h: 170, color: "rose", text: "Remember the order: Estates-General → Bastille → Declaration of Rights → Terror → Napoleon." },
  ]);
}

/* ---------------- Geometry ---------------- */

function geometryBoard(folderId: string | null): Board {
  return board("Geometry", folderId, [
    { id: nid(), kind: "text", x: 40, y: 40, w: 430, h: 70, text: "Right triangles run the world — roofs, ramps, screens, and every Pythagoras proof.", color: "#F4EFE9", size: 15 },
    { id: nid(), kind: "shape", x: 60, y: 170, w: 260, h: 200, shape: "triangle", fill: "rgba(255,158,61,0.11)", stroke: "#FF9E3D" },
    { id: nid(), kind: "text", x: 168, y: 380, w: 60, h: 26, text: "a", color: "#FF9E3D", size: 16 },
    { id: nid(), kind: "text", x: 330, y: 260, w: 60, h: 26, text: "b", color: "#FF9E3D", size: 16 },
    { id: nid(), kind: "text", x: 165, y: 120, w: 70, h: 26, text: "c", color: "#A78BFA", size: 16 },
    { id: nid(), kind: "equation", x: 420, y: 190, w: 260, h: 80, latex: "a^{2} + b^{2} = c^{2}", scale: 1.2 },
    { id: nid(), kind: "ainote", x: 420, y: 300, w: 380, h: 240, mode: "explain", tone: "violet", title: "Read it like this",
      body: "The two shorter sides (legs) square to exactly the square of the longest side (hypotenuse). If a triangle's sides satisfy this, the angle between the legs is exactly 90°.",
      steps: [{ t: "Legs", d: "a and b touch the right angle." }, { t: "Hypotenuse", d: "c is always the longest side, opposite the right angle." }] },
    { id: nid(), kind: "equation", x: 60, y: 440, w: 300, h: 74, latex: "3^{2} + 4^{2} = 5^{2}", scale: 1 },
    { id: nid(), kind: "sticky", x: 860, y: 190, w: 210, h: 160, color: "violet", text: "Common triplets: 3-4-5, 5-12-13, 8-15-17. Spot them and save minutes." },
  ]);
}

export function buildStarterBoards(mathFolderId: string, scienceFolderId: string, projectsFolderId: string): Board[] {
  return [
    quadraticBoard(mathFolderId),
    photosynthesisBoard(scienceFolderId),
    newtonBoard(scienceFolderId),
    revolutionBoard(projectsFolderId),
    geometryBoard(mathFolderId),
  ];
}

export const STARTER_LABELS: Record<string, { title: string; blurb: string; hue: string }> = {
  "Quadratic Equations": { title: "Quadratic Equations", blurb: "Parabolas, roots & the discriminant", hue: "#FF9E3D" },
  Photosynthesis: { title: "Photosynthesis", blurb: "Inputs, factory, outputs — mapped", hue: "#3DDC97" },
  "Newton's Laws": { title: "Newton's Laws", blurb: "Inertia, F = ma, action–reaction", hue: "#A78BFA" },
  "French Revolution": { title: "French Revolution", blurb: "A decade, drawn as a timeline", hue: "#FF7A93" },
  Geometry: { title: "Geometry", blurb: "Right triangles & Pythagoras", hue: "#F5B83D" },
};

export const STARTER_COLORS = { BLUE, VIOLET, CYAN, EMERALD, AMBER, ROSE };
