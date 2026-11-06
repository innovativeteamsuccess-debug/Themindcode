/* ============================================================
   CODE STUDIO — AI endpoint
   Mode-structured tutor over the canvas. The model must answer
   with strict JSON matching the mode's schema. The studio's
   local math engine handles solve/check offline — this route
   powers explain / hint / simplify / visualize / quiz / revise /
   practice / summary / ask.
   ============================================================ */

import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import type { AIMode, AIResult } from "@/components/studio/types";
import { getRequestUser, unauthorized } from "@/lib/session";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

const BodySchema = z.object({
  mode: z.enum([
    "explain", "solve", "hint", "simplify", "visualize",
    "check", "quiz", "revise", "practice", "summary", "ask",
  ]),
  prompt: z.string().max(1200).optional(),
  boardTitle: z.string().max(120).optional(),
  board: z.string().max(1500).optional(), // text snapshot of the board
  selection: z.string().max(1500).optional(), // text snapshot of selection
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
    .max(8)
    .optional(),
});

const BASE_RULES = `You are CODE, the AI tutor woven into CODE Studio, an infinite learning canvas for CBSE students (Classes 6–12) by The Mind Code.
You receive a snapshot of what the student has on their canvas and what they selected.
Teach like a brilliant, warm human tutor: precise, encouraging, never condescending. Use India-friendly examples where natural.
Respond with STRICT JSON only — no markdown fences, no commentary outside the JSON.`;

const MODE_SPECS: Record<AIMode, string> = {
  explain: `Teach the selected content step by step.
JSON: {"title": short title, "body": 2-4 sentence overview, "steps": [{"t": "step name", "d": "1-2 sentence explanation", "latex": "optional LaTeX"}]}`,
  solve: `Solve the given problem showing every intermediate step. Emphasise the method, not just the answer.
JSON: {"title": "the final answer, short", "body": "one sentence naming the method used", "steps": [{"t": "step name", "d": "why this step", "latex": "the equation/line in LaTeX"}]}`,
  hint: `Give ONLY the next useful hint — a nudge, never the full solution.
JSON: {"title": "Next hint", "body": "1-3 sentences of hint."}`,
  simplify: `Rewrite the content in plain, simple language a younger student understands. Keep every idea.
JSON: {"title": "Simpler version", "body": "the simplified explanation"}`,
  visualize: `Convert the concept into a clean educational diagram (concept map / flow / process / timeline).
JSON: {"title": "diagram title", "diagram": {"title": "...", "nodes": [{"id":"n1","label":"short label","text":"1-2 line detail","x":0,"y":0,"w":150,"h":64,"shape":"rounded|pill|rect|ellipse|diamond","fill":"one of rgba(77,141,255,0.14) rgba(61,220,151,0.13) rgba(167,139,250,0.13) rgba(245,184,61,0.14) rgba(255,122,147,0.12) rgba(169,188,224,0.1)"}], "edges": [{"id":"e1","from":"n1","to":"n2","label":"optional","dashed":false}]}}
LAYOUT RULES: place nodes on a tidy grid: x from 0..800, y from 0..420, no overlaps, flows left→right or top→down, 3-9 nodes. Node w 110-190, h 46-96.`,
  check: `Review the student's work. Find mistakes (conceptual or arithmetic), explain WHY each is wrong and how to fix it. If it is fully correct, say so warmly.
JSON: {"title": "Check complete", "body": "verdict in one sentence", "steps": [{"t": "issue or confirmation", "d": "explanation + fix"}]}`,
  quiz: `Write a short quiz (3-5 questions) strictly from the board content. Each question: 4 options, exactly one correct.
JSON: {"title": "Quiz title", "quiz": [{"q": "question", "options": ["a","b","c","d"], "answer": 0, "why": "one-line explanation"}]}`,
  revise: `Turn the board into compact revision notes: sections with crisp bullet points.
JSON: {"title": "Revision notes", "sections": [{"heading": "section", "points": ["point", "point"]}]}`,
  practice: `Create 4-6 practice problems of graduated difficulty on this topic, with answers and hints.
JSON: {"title": "Practice set", "problems": [{"prompt": "problem", "answer": "answer", "hint": "nudge"}]}`,
  summary: `Write a one-glance revision sheet for the board: the absolute essentials only.
JSON: {"title": "Revision sheet", "sections": [{"heading": "core idea", "points": ["point"]}]}`,
  ask: `Answer the student's question about their canvas. Be concrete and refer to what is on the board.
JSON: {"title": "short answer title", "body": "the answer, may be several sentences"}`,
};

const ResultSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(4000).optional(),
  steps: z.array(z.object({ t: z.string().max(300), d: z.string().max(1200).optional(), latex: z.string().max(1200).optional() })).max(24).optional(),
  latex: z.array(z.string().max(600)).max(24).optional(),
  diagram: z
    .object({
      title: z.string().max(200),
      nodes: z
        .array(
          z.object({
            id: z.string().max(40),
            label: z.string().max(120).default(""),
            text: z.string().max(400).default(""),
            x: z.number(),
            y: z.number(),
            w: z.number().min(60).max(420),
            h: z.number().min(30).max(300),
            shape: z.enum(["rect", "rounded", "pill", "ellipse", "diamond"]).default("rounded"),
            fill: z.string().max(80).default("rgba(77,141,255,0.14)"),
          })
        )
        .min(2)
        .max(12),
      edges: z
        .array(
          z.object({
            id: z.string().max(40),
            from: z.string().max(40),
            to: z.string().max(40),
            label: z.string().max(80).optional(),
            dashed: z.boolean().optional(),
          })
        )
        .max(16)
        .optional(),
    })
    .optional(),
  quiz: z.array(z.object({ q: z.string().max(400), options: z.array(z.string().max(200)).min(2).max(6), answer: z.number().int().min(0).max(5), why: z.string().max(400).optional() })).max(8).optional(),
  flashcards: z.array(z.object({ front: z.string().max(300), back: z.string().max(600) })).max(16).optional(),
  sections: z.array(z.object({ heading: z.string().max(200), points: z.array(z.string().max(400)).max(10) })).max(8).optional(),
  problems: z.array(z.object({ prompt: z.string().max(400), answer: z.string().max(400), hint: z.string().max(300).optional() })).max(8).optional(),
});

function extractJson(raw: string): unknown {
  let s = raw.trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json");
  return JSON.parse(s.slice(start, end + 1));
}

export async function POST(req: Request) {
  /* AI costs real compute — usage requires a (free) account. */
  const user = await getRequestUser();
  if (!user) return unauthorized();

  /* token-burn guard: 30 studio AI actions per 10 minutes per student */
  if (!rateLimit(`studio-ai:${user.id}`, 30, 10 * 60_000)) {
    return tooMany(10 * 60_000);
  }

  const rawBody = await readJson(req);
  const parsedBody = BodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const body = parsedBody.data;

  const contextLines: string[] = [];
  if (body.boardTitle) contextLines.push(`BOARD: ${body.boardTitle}`);
  if (body.board) contextLines.push(`ON THE CANVAS:\n${body.board}`);
  if (body.selection) contextLines.push(`SELECTED BY STUDENT:\n${body.selection}`);
  if (body.prompt) contextLines.push(`STUDENT ASKS: ${body.prompt}`);

  const system = [BASE_RULES, MODE_SPECS[body.mode], "CONTEXT:", ...contextLines].join("\n\n");

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        ...(body.history ?? []),
        { role: "user", content: contextLines.join("\n\n") || "Explain what a learning canvas is." },
      ],
      thinking: { type: "disabled" },
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    if (!raw.trim()) throw new Error("empty");

    let parsed: AIResult;
    try {
      parsed = ResultSchema.parse(extractJson(raw)) as AIResult;
    } catch {
      // model replied with prose — wrap it as a plain note rather than failing
      parsed = {
        title: body.mode === "ask" ? "Answer" : `${body.mode[0].toUpperCase()}${body.mode.slice(1)}`,
        body: raw.slice(0, 2800),
      };
    }
    return NextResponse.json({ ok: true, result: parsed });
  } catch (err) {
    console.error("[studio/ai] failed:", err);
    return NextResponse.json(
      { ok: false, error: "The tutor link dropped for a moment. Try again — or use Solve, which works offline." },
      { status: 502 }
    );
  }
}
