/* ============================================================
   CODE TUTOR — server-side AI layer helpers
   Auth gate (Clerk first, fallback cookie second) + the two
   teaching prompts (plan & beat) + strict-JSON extraction.
   ============================================================ */

import { getSessionUser } from "@/lib/auth";

export type TutorUser = { id: string; email?: string; engine: "clerk" | "fallback" };

export async function tutorUser(): Promise<TutorUser | null> {
  const clerkOn = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
  if (clerkOn) {
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const { userId } = await auth();
      if (userId) return { id: `clerk:${userId}`, engine: "clerk" };
    } catch {
      /* clerk not ready — fall through */
    }
  }
  const fb = await getSessionUser();
  if (fb) return { id: fb.id, email: fb.email, engine: "fallback" };
  return null;
}

export const unauthorized = () =>
  new Response(
    JSON.stringify({ ok: false, error: "Sign in to use CODE Tutor — it's free." }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );

/* ---------- strict JSON out of an LLM reply ---------- */

export function extractJson<T>(raw: string): T {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```\s*$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  const body = s.slice(start, end + 1);
  try {
    return JSON.parse(body) as T;
  } catch {
    // common LLM slips: trailing commas, smart quotes, stray line breaks
    const repaired = body
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[\u2018\u2019]/g, "'");
    return JSON.parse(repaired) as T;
  }
}

/* ask the model for JSON, with one clean retry on malformed output */
export async function generateJson<T>(
  zai: { chat: { completions: { create: (args: Record<string, unknown>) => Promise<{ choices: { message?: { content?: string } }[] }> } } },
  messages: { role: "assistant" | "user"; content: string }[],
  maxAttempts = 2
): Promise<T> {
  let lastErr: unknown = null;
  let convo = [...messages];
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const completion = await zai.chat.completions.create({
        messages: convo,
        thinking: { type: "disabled" },
      });
      const raw = completion.choices[0]?.message?.content ?? "";
      if (!raw.trim()) throw new Error("empty");
      return extractJson<T>(raw);
    } catch (err) {
      lastErr = err;
      convo = [
        ...messages,
        { role: "user", content: "Your previous reply was not valid JSON. Respond again with ONLY the JSON object — compact, single line, no prose, no markdown fences." },
      ];
    }
  }
  throw lastErr;
}

/* ---------- personas ---------- */

const PERSONA_VOICE: Record<string, string> = {
  professor: "Calm, precise, rigorous. Full sentences. Never rushed. Praise is understated.",
  friendly: "Warm and simple. Relatable everyday examples (cricket, chai, buses). Encouraging.",
  coach: "Marks-focused. Names the formula, the common mistake, and the exam shortcut. crisp.",
  socratic: "Teaches by asking. Every beat nudges the student to reason one step themselves.",
  visual: "Draw-first. Nearly every beat puts a diagram or sketch on the board, then explains it.",
};

/* ---------- lesson plan prompt ---------- */

export type PlanInput = {
  topic: string;
  curriculum: string;
  grade: string;
  subject: string;
  persona: string;
  examMode: boolean;
};

export function planMessages(input: PlanInput) {
  const system = `You are CODE TUTOR, a master teacher for Indian school students who plans whiteboard lessons.
Design a lesson plan for the request below.

Rules:
- 2-4 concepts, each teachable in 2-4 board beats.
- "goal" = what the board must establish (definition/formula/diagram/example).
- Quiz: 3-4 questions, 4 options each, "answer" = index (0-3) of the correct option, "why" = one-line explanation.
- Respect the requested curriculum, class/grade and subject. Use Indian conventions (SI units, NCERT vocabulary).
- Keep every string short and board-friendly (headings under 48 chars).
${input.examMode ? "EXAM MODE: include an exam-strategy angle per concept (common mistake / marks-scoring step)." : ""}
Return STRICT JSON only:
{"title": string, "subject": string, "grade": string,
 "prerequisites": string[], "objectives": string[],
 "concepts": [{"id": "c1", "title": string, "goal": string, "keyTerms": string[]}],
 "quiz": [{"q": string, "options": [string,string,string,string], "answer": 0, "why": string}]}`;

  const user = `TOPIC: ${input.topic}
CURRICULUM: ${input.curriculum} | CLASS/GRADE: ${input.grade} | SUBJECT: ${input.subject}
TEACHING STYLE: ${PERSONA_VOICE[input.persona] ?? PERSONA_VOICE.friendly}`;

  return [
    { role: "assistant" as const, content: system },
    { role: "user" as const, content: user },
  ];
}

/* ---------- teaching beat prompt ---------- */

export type BeatInput = {
  mode: "teach" | "answer" | "interrupt" | "quiz";
  plan: {
    title: string; topic: string; subject?: string; grade?: string;
    concepts: { id: string; title: string; goal: string; keyTerms?: string[] }[];
    quiz?: { q: string; options: string[]; answer: number; why?: string }[];
  };
  conceptIndex: number;
  quizIndex?: number;
  persona: string;
  examMode: boolean;
  board: string;            // engine.summary()
  recent: { role: "teacher" | "student"; text: string }[];
  student: { understanding?: number; confidence?: string; note?: string; mistakes?: string[] };
  studentInput?: string;    // answer / interrupt text
  lastQuestion?: string;
};

const BOARD_CONTRACT = `BOARD ACTIONS (JSON objects inside "actions", coordinates in a 1600x900 logical space, origin top-left, keep 60px margins, never place below y=820):
{"a":"write","text":string,"x":n,"y":n,"style":"heading"|"sub"|"body"|"formula"|"note","w"?:wrapWidth,"color"?}
{"a":"diagram","x":n,"y":n,"title"?:string,"caption"?:string,"shapes":[ ... ]}
  shapes (each also supports "label","color","dashed"):
   {"kind":"line"|"arrow"|"ray","x1":n,"y1":n,"x2":n,"y2":n}
   {"kind":"rect","x":n,"y":n,"w":n,"h":n}  {"kind":"ellipse","x":n,"y":n,"w":n,"h":n}  {"kind":"circle","x":n,"y":n,"r":n}
   {"kind":"polyline"|"curve","pts":[{"x":n,"y":n}, ...]}
   {"kind":"arc","x":n,"y":n,"r":n,"start":deg,"end":deg}
   {"kind":"mirror","x":n,"y":n,"aperture":n,"orientation":"concave"|"convex"|"plane"}
   {"kind":"lens","x":n,"y":n,"h":n}
   {"kind":"battery"|"bulb","x":n,"y":n}  {"kind":"resistor","x":n,"y":n,"w"?:n}
   {"kind":"axis","x":n,"y":n,"w":n,"h":n,"xlabel"?:string,"ylabel"?:string}
   {"kind":"label","x":n,"y":n,"text":string}
{"a":"solve","title":string,"given":[string],"lines":[{"text":string,"note"?:string,"result"?:boolean}],"x":n,"y":n}
{"a":"panel","kind":"question"|"example"|"recap"|"checkpoint"|"mistake"|"objective","title":string,"items":[string],"x":n,"y":n}
{"a":"highlight","targetId":existingId}   {"a":"underline","targetId":existingId}   {"a":"circle","targetId":existingId}
{"a":"arrow","from":{"x":n,"y":n},"to":{"x":n,"y":n},"label"?:string,"curved"?:bool}
{"a":"camera","zoom"?:n}   {"a":"wait","ms":n}   {"a":"clear"}   {"a":"sceneMark","title":string}

TEACHING RULES:
- 3-7 actions per beat. NEVER dump the whole section at once — one idea per beat.
- Every new concept starts with {"a":"clear"} then {"a":"sceneMark","title":"..."} then a heading write.
- Give every write/diagram an "id" (like "t1","d1") when you may highlight/underline it later.
- Diagrams: use the primitives, place labels, keep 560x360-ish boxes. Physics: rays/mirrors/lenses/circuits. Bio: flow parts. Math: axes/curves.
- When solving: use "solve" with given[] then step lines, result:true only on the final line. Build up — never reveal the answer in the first beat.
- examMode: add a "panel" with kind "mistake" (common exam mistake) or exam shortcut when it matters.
- If the student is confused (low understanding), SLOW DOWN: simplify, add an analogy, ask a checkpoint question.
- If the student is strong (high understanding), raise difficulty: application or challenge question.`;

export function beatMessages(input: BeatInput) {
  const concept = input.plan.concepts[input.conceptIndex];
  const last = input.recent.slice(-6).map((m) => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

  let task: string;
  if (input.mode === "teach") {
    task = `Teach the NEXT small step of the current concept. Concept goal: ${concept?.goal ?? "(recap)"}`;
  } else if (input.mode === "answer") {
    task = `The student answered your question ("${input.lastQuestion ?? ""}") with: "${input.studentInput ?? ""}". Evaluate it warmly but honestly: if wrong, correct the misconception ON THE BOARD (highlight/underline the key part, or add a small fix diagram/panel); if right, celebrate briefly and deepen. Then continue the lesson.`;
  } else if (input.mode === "interrupt") {
    task = `The student interrupted with: "${input.studentInput ?? ""}". Address EXACTLY this — explain on the board (you may add a small diagram or highlight an existing element), then resume the lesson where you left off.`;
  } else {
    task = `QUIZ. Question ${((input.quizIndex ?? 0) + 1)}/${input.plan.quiz?.length ?? 0}: "${input.plan.quiz?.[input.quizIndex ?? 0]?.q ?? ""}". Write the question on the board with a panel, then ASK it (choices from the plan).`;
  }

  const system = `You are CODE TUTOR, a brilliant Indian school teacher standing at a whiteboard, teaching a live lesson.
Style: ${PERSONA_VOICE[input.persona] ?? PERSONA_VOICE.friendly}
${input.examMode ? "EXAM MODE: emphasise NCERT wording, marks-scoring steps, common mistakes and shortcuts." : ""}

${BOARD_CONTRACT}

Return STRICT JSON only — one teaching beat:
{"speech": string (1-3 sentences you SAY while writing — classroom voice, refer to the board),
 "actions": [ ...board actions... ],
 "question": {"text": string, "expect": "short"|"choice", "choices"?: string[]} | null,
 "clear"?: boolean, "section"?: string,
 "studentModel": {"understanding": 0.0-1.0, "confidence": "low"|"medium"|"high", "note": string, "mistakes"?: string[]},
 "done"?: boolean}`;

  const user = `LESSON: ${input.plan.title} (${input.plan.grade ?? ""} ${input.plan.subject ?? ""})
CONCEPT ${input.conceptIndex + 1}/${input.plan.concepts.length}: ${concept?.title ?? "recap"}
PROGRESS: understanding=${input.student.understanding ?? 0.5}, confidence=${input.student.confidence ?? "medium"}${input.student.note ? `, note: ${input.student.note}` : ""}${input.student.mistakes?.length ? `, mistakes: ${input.student.mistakes.slice(-3).join("; ")}` : ""}

BOARD RIGHT NOW:
${input.board}

RECENT CLASSROOM TALK:
${last || "(lesson just started)"}

TASK: ${task}`;

  return [
    { role: "assistant" as const, content: system },
    { role: "user" as const, content: user },
  ];
}
