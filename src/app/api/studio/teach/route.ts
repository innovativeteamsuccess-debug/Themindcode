/* ============================================================
   THE TEACHING ENGINE — /api/studio/teach

   Behaves like a real teacher preparing and delivering a lesson
   on an infinite whiteboard. Two modes:

     plan    → topic + student model  → LessonPlan (9–13 TeachSteps,
               each = spoken narration + deterministic BoardActions)
     respond → student utterance (answer / question / interrupt)
               → TeachTurn (verdict + corrective actions + pacing)

   The LLM never renders the board directly: it emits actions from
   a CLOSED vocabulary; the client interpreter maps them onto real
   canvas objects. Everything is zod-validated; malformed output
   degrades gracefully instead of breaking the lesson.
   ============================================================ */

import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import JSON5 from "json5";
import { getRequestUser, unauthorized } from "@/lib/session";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

/* ---------------- schemas ---------------- */

const StyleEnum = z.enum(["heading", "sub", "body", "term", "note"]);

const StrokeSchema = z.object({
  pts: z.array(z.tuple([z.number(), z.number()])).min(2).max(120),
  color: z.string().max(40).optional(),
  width: z.number().min(1).max(8).optional(),
});

const ActionSchema = z.object({
  a: z.enum(["write", "equation", "sketch", "diagram", "emphasize", "arrow", "erase", "camera", "checkpoint", "quiz"]),
  text: z.string().max(220).optional(),
  x: z.number().min(-40).max(1700).optional(),
  y: z.number().min(-40).max(1100).optional(),
  style: StyleEnum.optional(),
  latex: z.string().max(400).optional(),
  scale: z.number().min(0.6).max(2.2).optional(),
  w: z.number().min(40).max(1500).optional(),
  h: z.number().min(40).max(1000).optional(),
  strokes: z.array(StrokeSchema).max(24).optional(),
  labels: z.array(z.object({ text: z.string().max(60), x: z.number(), y: z.number() })).max(12).optional(),
  nodes: z
    .array(
      z.object({
        id: z.string().max(30),
        label: z.string().max(60),
        text: z.string().max(160).optional(),
        x: z.number().min(0).max(900),
        y: z.number().min(0).max(700),
        w: z.number().min(60).max(300),
        h: z.number().min(36).max(200),
        shape: z.enum(["rect", "rounded", "pill", "ellipse", "diamond"]).optional(),
        fill: z.string().max(60).optional(),
      })
    )
    .min(2)
    .max(9)
    .optional(),
  edges: z.array(z.object({ from: z.string().max(30), to: z.string().max(30), label: z.string().max(40).optional(), dashed: z.boolean().optional() })).max(14).optional(),
  title: z.string().max(140).optional(),
  target: z.string().max(120).optional(),
  mode: z.enum(["highlight", "circle", "underline", "box"]).optional(),
  from: z.tuple([z.number(), z.number()]).optional(),
  to: z.tuple([z.number(), z.number()]).optional(),
  label: z.string().max(60).optional(),
  z: z.number().min(0.35).max(1.6).optional(),
  questions: z
    .array(
      z.object({
        q: z.string().max(300),
        options: z.array(z.string().max(120)).min(2).max(6),
        answer: z.number().int().min(0).max(5),
        why: z.string().max(240).optional(),
      })
    )
    .min(1)
    .max(5)
    .optional(),
});

const PhaseEnum = z.enum(["intro", "prereq", "concept", "visual", "example", "question", "correction", "application", "recap", "quiz"]);

const StepSchema = z.object({
  phase: PhaseEnum,
  say: z.string().min(2).max(400),
  actions: z.array(ActionSchema).max(6).default([]),
  question: z.object({ text: z.string().max(240), expect: z.string().max(240) }).optional(),
  pauseMs: z.number().int().min(0).max(4000).optional(),
});

const PlanSchema = z.object({ title: z.string().min(2).max(140), steps: z.array(StepSchema).min(4).max(24) });

const TurnSchema = z.object({
  say: z.string().min(2).max(500),
  actions: z.array(ActionSchema).max(6).default([]),
  verdict: z.enum(["ack", "good", "partly", "wrong"]).optional(),
  understandingDelta: z.number().min(-20).max(20).optional(),
  pace: z.union([z.literal(-1), z.literal(0), z.literal(1)]).optional(),
  question: z.object({ text: z.string().max(240), expect: z.string().max(240) }).optional(),
});

const ConfigSchema = z.object({
  topic: z.string().min(2).max(160),
  curriculum: z.enum(["CBSE", "ICSE", "State Board", "IB", "Custom"]),
  klass: z.number().int().min(4).max(12),
  subject: z.string().max(60),
  personality: z.enum(["professor", "friendly", "coach", "socratic", "visual"]),
  examMode: z.boolean(),
  voice: z.boolean(),
});

const StudentSchema = z.object({
  understanding: z.number().min(0).max(100),
  pace: z.union([z.literal(-1), z.literal(0), z.literal(1)]),
  struggles: z.array(z.string().max(80)).max(8),
  wins: z.array(z.string().max(80)).max(8),
  answered: z.number().int().min(0).max(999),
  correct: z.number().int().min(0).max(999),
});

/* ---------------- prompt building ---------------- */

const PERSONA_LINES: Record<string, string> = {
  professor: "Speak calmly and precisely, like a seasoned professor. Rigorous definitions, clean sequencing, no slang.",
  friendly: "Speak like a warm, friendly teacher. Simple words, everyday Indian examples (cricket, chai, trains). Encouraging.",
  coach: "Speak like an exam coach. Constantly connect to marks: 'this carries 3 marks', quote common mistakes, give exam shortcuts.",
  socratic: "Mostly guide with questions — but still write on the board. Ask small leading questions before revealing each idea.",
  visual: "Be diagram-obsessed: nearly every concept step must also draw (sketch or diagram). Narrate what you draw.",
};

const BOARD_DOC = `BOARD ACTIONS (closed vocabulary — emit ONLY these):
{"a":"write","text":"OHM'S LAW","x":600,"y":90,"style":"heading"}          styles: heading(34px)|sub(24px)|body(19px)|term(21px amber)|note(16px italic grey)
{"a":"equation","latex":"V = I \\\\times R","x":640,"y":170,"scale":1.15}    LaTeX only in latex field, never inside write
{"a":"sketch","x":900,"y":260,"w":420,"h":300,"strokes":[{"pts":[[0,150],[420,150]],"width":3}],"labels":[{"text":"R","x":200,"y":120}]}
     — pts are RELATIVE to x,y. Build circuits/rays/graphs from 2-14 straight strokes; add labels separately. A box = 4 strokes.
{"a":"diagram","x":80,"y":300,"w":560,"h":360,"title":"Water cycle","nodes":[{"id":"n1","label":"Evaporation","text":"sun heats water","x":20,"y":40,"w":150,"h":56,"shape":"pill"}],"edges":[{"from":"n1","to":"n2","label":"rises"}]}
     — node coords RELATIVE to the diagram origin; 2-9 nodes, flows left→right; use for processes/mind-maps/classifications.
{"a":"emphasize","target":"V = I × R","mode":"circle"}                     modes: highlight(marker band)|circle|underline|box — target = exact existing board text
{"a":"arrow","from":[820,300],"to":[980,260],"label":"current I"}
{"a":"erase","target":"wrong line text"}                                   removes matching board text (use for correcting mistakes)
{"a":"camera","z":0.9}                                                     gentle refocus (omit usually)
{"a":"checkpoint","name":"Ohm's law — concept"}                            bookmark the scene
{"a":"quiz","title":"Quick check","questions":[{"q":"...","options":["A","B","C","D"],"answer":2,"why":"..."}]}

LAYOUT RULES on the 1600×1000 board:
- Heading near x 520-620, y 70-120. Two working columns: LEFT x 70-760, RIGHT x 860-1530.
- Work TOP→DOWN inside a column; a text block ≈ 46-90px tall per line, equations ≈ 80px, keep ≥ 24px gaps.
- One idea per write; break long lines into 2-3 writes. Never overlap existing blocks — move down or across.
- Diagram/sketch boxes: give generous w/h so labels fit (a pill needs w≥150, h≥52).`;

function planPrompt(config: z.infer<typeof ConfigSchema>, student: z.infer<typeof StudentSchema>): string {
  const exam = config.examMode
    ? `EXAM MODE ON: follow NCERT terminology strictly; include one "board-style question" application step with mark-weighted steps, one step on the single most common mistake students make in ${config.topic}, and one exam shortcut.`
    : `Normal learning mode: prioritise intuition and confidence.`;
  const paceLine =
    student.pace === -1
      ? "The student has been struggling — keep steps smaller, one idea per step, more analogies."
      : student.pace === 1
        ? "The student is doing well — include a harder application/challenge near the end."
        : "Keep a steady, comfortable pace.";
  const history =
    student.struggles.length || student.wins.length
      ? `Student profile — struggles: ${student.struggles.slice(0, 4).join("; ") || "none"}. Wins: ${student.wins.slice(0, 4).join("; ") || "none"}. Understanding estimate: ${student.understanding}/100.`
      : `New student — assume the standard prerequisite level for Class ${config.klass}.`;

  return `You are CODE, a brilliant human teacher standing in front of a large whiteboard, teaching a Class ${config.klass} ${config.curriculum} student ${config.subject}.
Today's topic: "${config.topic}".

PERSONA: ${PERSONA_LINES[config.personality]}
${exam}
${paceLine}
${history}

TEACH LIKE A REAL TEACHER — the golden rules:
- FIRST decide the 4-6 key ideas of this topic and the single best prerequisite to recall. Then decompose into a lesson plan.
- NEVER dump the whole lesson at once. Each step = you SAY one or two short sentences while you WRITE/DRAW 1-4 board actions that appear progressively.
- Narrate in second person, spoken tone ("Notice how…", "Look at the left side…"). Reference what you just wrote ("this amber term", "the circuit on the right").
- Arc: intro(title+hook) → prereq(quick recall) → 2-4 concept/visual steps (definitions, formulas, diagrams: use sketch for ray/circuit/graph pictures, diagram for processes) → worked example solved progressively line-by-line (never jump to the answer) → ONE question step (MANDATORY — a check-for-understanding a Class ${config.klass} student can answer in a sentence; phase "question" with question.text and question.expect=ideal short answer) → application → recap (bullet summary) [+ quiz with 2-3 questions if examMode].
- 9-13 steps total. At least one sketch or diagram in the lesson. End most major shifts with a checkpoint action.
- say = what the teacher SPEAKS. Keep each under 40 words. No LaTeX inside say (spell formulas out: "V equals I times R").
- The final answer of the worked example must appear only in its own last step.

${BOARD_DOC}

OUTPUT: STRICT JSON only, no markdown fences:
{"title":"<lesson title>","steps":[{"phase":"intro|prereq|concept|visual|example|question|application|recap|quiz","say":"...","actions":[...],"question":{"text":"...","expect":"..."},"pauseMs":600}]}`;
}

function respondPrompt(
  config: z.infer<typeof ConfigSchema>,
  student: z.infer<typeof StudentSchema>,
  lesson: { title: string; done: { phase: string; say: string }[]; next: { phase: string; say: string } | null },
  board: string,
  message: string
): string {
  const doneLines = lesson.done.slice(-6).map((d) => `- [${d.phase}] ${d.say}`).join("\n");
  return `You are CODE, the teacher mid-lesson on the whiteboard. Lesson: "${lesson.title}" (Class ${config.klass} ${config.curriculum} ${config.subject}, topic: ${config.topic}).
Persona: ${PERSONA_LINES[config.personality]}

RECENT TEACHING:
${doneLines || "(lesson just started)"}
${lesson.next ? `NEXT UP: [${lesson.next.phase}] ${lesson.next.say}` : "The planned lesson steps are complete."}

CURRENT BOARD:
${board.slice(0, 1800) || "(empty board)"}

STUDENT MODEL: understanding ${student.understanding}/100, answered ${student.answered} (${student.correct} correct), struggles: ${student.struggles.slice(0, 3).join("; ") || "none"}.

THE STUDENT JUST SAID: "${message}"

Decide what a great teacher does:
- If it's an answer to your question → verdict: good (essentially right) / partly (right direction, fix the gap) / wrong (gently correct). Teach the correction ON THE BOARD (write the right line, circle/underline the key part). Celebrate briefly when good.
- If it's a question or confusion ("why did you divide by 3?") → verdict "ack", answer precisely WITH a small board action (write the reason, annotate the exact line, or draw a tiny sketch).
- If they ask for simpler/another example → give it on the board, keep it short.
- If they're ahead of pace → verdict "ack" with understandingDelta +8..+12.
- Then hand control back: usually NO question (the lesson resumes); only add question if you asked something new.

1-4 short steps worth of content compressed into ONE turn: say = 1-3 spoken sentences (under 55 words), actions = up to 6 board actions (same closed vocabulary as before: write/equation/sketch/diagram/emphasize/arrow/erase/camera/checkpoint).
Also return understandingDelta (-20..+20) and pace (-1 slower | 0 same | +1 faster) reflecting this exchange.

OUTPUT: STRICT JSON only:
{"say":"...","actions":[...],"verdict":"ack|good|partly|wrong","understandingDelta":5,"pace":0,"question":{"text":"...","expect":"..."}}`;
}

/* ---------------- LLM plumbing ---------------- */

const DANGEROUS = /(require|import|fetch|process|globalThis|eval|constructor|__proto__|prototype|while|for\s*\(|function|=>)/i;

function strictParse(s: string): unknown {
  return JSON.parse(s);
}

/** Tolerant parse for the model's occasional loose JSON (unquoted
    keys, trailing commas, single quotes). JSON5 is a declarative
    parser — unlike `new Function`, model output can never execute. */
function looseParse(s: string): unknown {
  if (DANGEROUS.test(s)) throw new Error("unsafe json");
  return JSON5.parse(s);
}

function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  s = s.slice(start, end + 1);
  try {
    return strictParse(s);
  } catch { /* fall through */ }
  const cleaned = s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([}\]])/g, "$1");
  try {
    return strictParse(cleaned);
  } catch { /* fall through */ }
  return looseParse(cleaned);
}

async function callModel(system: string, user: string, retryNote?: string): Promise<unknown> {
  const zai = await ZAI.create();
  const messages = [
    { role: "assistant", content: system },
    ...(retryNote ? [{ role: "user", content: `Your previous reply was not valid JSON. ${retryNote}` }] : []),
    { role: "user", content: user },
  ] as { role: "assistant" | "user"; content: string }[];
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: "disabled" },
  });
  const raw = completion.choices[0]?.message?.content ?? "";
  if (!raw.trim()) throw new Error("empty");
  return extractJson(raw);
}

const json = (data: unknown, status = 200) => NextResponse.json(data, { status });

/* ---------------- model-output normalization ----------------
   The model is creative about shapes. Accept the natural variants
   (strokes as bare point-arrays, missing optionals) and coerce to
   the strict schema BEFORE validating. */
type AnyRec = Record<string, unknown>;

function normalizeAction(a: AnyRec): AnyRec {
  if (Array.isArray(a.strokes)) {
    a = {
      ...a,
      strokes: (a.strokes as unknown[]).map((st) =>
        Array.isArray(st) ? { pts: st } : st
      ),
    };
  }
  return a;
}

function normalizePayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const p = raw as AnyRec;
  if (Array.isArray(p.actions)) {
    return { ...p, actions: (p.actions as AnyRec[]).map(normalizeAction) };
  }
  if (Array.isArray(p.steps)) {
    return {
      ...p,
      steps: (p.steps as AnyRec[]).map((s) =>
        s && Array.isArray(s.actions)
          ? { ...s, actions: (s.actions as AnyRec[]).map(normalizeAction) }
          : s
      ),
    };
  }
  return p;
}

/** one polite retry — bad JSON or schema violations get a second chance */
async function withRetry(run: () => Promise<unknown>): Promise<unknown> {
  try {
    return await run();
  } catch (first) {
    console.warn("[studio/teach] first attempt failed, retrying:", first instanceof Error ? first.message : first);
    return await run();
  }
}

/* ---------------- handler ---------------- */

export async function POST(req: Request) {
  const user = await getRequestUser();
  if (!user) return unauthorized();

  /* token-burn guard: the teaching engine is the heaviest call —
     18 planning/respond turns per 10 minutes per student */
  if (!rateLimit(`teach:${user.id}`, 18, 10 * 60_000)) {
    return tooMany(10 * 60_000, "The teaching engine needs a moment to catch its breath. Try again in a bit.");
  }

  let parsed: {
    mode: string;
    config?: z.infer<typeof ConfigSchema>;
    student?: z.infer<typeof StudentSchema>;
    lesson?: { title?: string; done?: { phase: string; say: string }[]; next?: { phase: string; say: string } | null };
    board?: string;
    message?: string;
  };
  const rawBody = await readJson(req);
  if (rawBody === null || typeof rawBody !== "object") {
    return json({ ok: false, error: "Invalid request." }, 400);
  }
  parsed = rawBody as typeof parsed;

  const cfg = ConfigSchema.safeParse(parsed.config);
  const stu = StudentSchema.safeParse(parsed.student ?? {});
  if (!cfg.success || !stu.success) return json({ ok: false, error: "Invalid lesson config." }, 400);
  const config = cfg.data;
  const student = stu.data;

  try {
    if (parsed.mode === "plan") {
      const data = PlanSchema.parse(
        normalizePayload(
          await withRetry(() => callModel(planPrompt(config, student), `Begin the lesson on: ${config.topic}`))
        ) as AnyRec
      );
      /* clamp an over-eager planner while preserving the lesson arc:
         keep the opening + the closing recap/quiz steps */
      if (data.steps.length > 14) {
        data.steps = [...data.steps.slice(0, 11), ...data.steps.slice(-3)];
      }
      return json({ ok: true, plan: data });
    }

    if (parsed.mode === "respond") {
      const lesson = {
        title: String(parsed.lesson?.title ?? config.topic).slice(0, 140),
        done: (parsed.lesson?.done ?? []).slice(-8),
        next: parsed.lesson?.next ?? null,
      };
      const board = String(parsed.board ?? "").slice(0, 2000);
      const message = String(parsed.message ?? "").slice(0, 600);
      if (!message) return json({ ok: false, error: "Empty message." }, 400);
      const data = TurnSchema.parse(
        normalizePayload(
          await withRetry(() => callModel(respondPrompt(config, student, lesson, board, message), "Respond as the teacher now."))
        ) as AnyRec
      );
      return json({ ok: true, turn: data });
    }

    return json({ ok: false, error: "Unknown mode." }, 400);
  } catch (err) {
    console.error("[studio/teach] failed:", err);
    return json({ ok: false, error: "The teacher lost the chalk for a second. Try again." }, 502);
  }
}
