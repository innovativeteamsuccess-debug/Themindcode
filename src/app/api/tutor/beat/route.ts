/* ============================================================
   CODE TUTOR — POST /api/tutor/beat
   One teaching beat: board actions + speech + question.
   Modes: teach | answer | interrupt | quiz.
   Requires sign-in (Clerk session or fallback cookie).
   ============================================================ */

import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import { tutorUser, unauthorized, generateJson, beatMessages } from "@/components/tutor/ai";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
import type { Beat } from "@/components/tutor/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  mode: z.enum(["teach", "answer", "interrupt", "quiz"]).default("teach"),
  plan: z.object({
    title: z.string().max(140),
    topic: z.string().max(200),
    subject: z.string().max(60).optional(),
    grade: z.string().max(40).optional(),
    concepts: z.array(z.object({
      id: z.string().max(20),
      title: z.string().max(100),
      goal: z.string().max(240),
      keyTerms: z.array(z.string().max(40)).max(6).optional(),
    })).min(1).max(6),
    quiz: z.array(z.object({
      q: z.string().max(300),
      options: z.array(z.string().max(90)).max(4),
      answer: z.number().int().min(0).max(3),
      why: z.string().max(220).optional(),
    })).max(5).optional(),
  }),
  conceptIndex: z.number().int().min(0).max(5).default(0),
  quizIndex: z.number().int().min(0).max(4).optional(),
  persona: z.string().max(20).default("friendly"),
  examMode: z.boolean().default(false),
  board: z.string().max(4000).default(""),
  recent: z.array(z.object({
    role: z.enum(["teacher", "student"]),
    text: z.string().max(600),
  })).max(8).default([]),
  student: z.object({
    understanding: z.number().min(0).max(1).optional(),
    confidence: z.string().max(10).optional(),
    note: z.string().max(300).optional(),
    mistakes: z.array(z.string().max(160)).max(6).optional(),
  }).default({}),
  studentInput: z.string().max(600).optional(),
  lastQuestion: z.string().max(400).optional(),
});

export async function POST(req: Request) {
  const user = await tutorUser();
  if (!user) return unauthorized();

  /* token-burn guard: 30 teaching beats per 10 minutes per student */
  if (!rateLimit(`tutor-beat:${user.id}`, 30, 10 * 60_000)) {
    return tooMany(10 * 60_000);
  }

  let input: z.infer<typeof BodySchema>;
  try {
    input = BodySchema.parse(await readJson(req));
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid teaching request." }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();
    const parsed = await generateJson<Partial<Beat>>(zai, beatMessages(input));
    const beat: Beat = {
      speech: String(parsed.speech ?? "Let's look at the board.").slice(0, 600),
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 12) : [],
      question: parsed.question
        ? {
            text: String(parsed.question.text ?? "").slice(0, 400),
            expect: parsed.question.expect === "choice" ? "choice" : "short",
            choices: (parsed.question.choices ?? []).slice(0, 4).map((c) => String(c).slice(0, 90)),
          }
        : null,
      clear: !!parsed.clear,
      section: parsed.section ? String(parsed.section).slice(0, 90) : undefined,
      studentModel: parsed.studentModel
        ? {
            understanding: Math.min(1, Math.max(0, Number(parsed.studentModel.understanding ?? 0.5))),
            confidence: (["low", "medium", "high"] as const).includes(parsed.studentModel.confidence as "low")
              ? (parsed.studentModel.confidence as "low" | "medium" | "high")
              : "medium",
            note: parsed.studentModel.note ? String(parsed.studentModel.note).slice(0, 200) : undefined,
          }
        : undefined,
      mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes.slice(0, 4).map((m) => String(m).slice(0, 160)) : undefined,
      done: !!parsed.done,
    };
    return NextResponse.json({ ok: true, beat });
  } catch (err) {
    console.error("[tutor/beat] failed:", err);
    return NextResponse.json(
      { ok: false, error: "The teacher lost the chalk for a second. Ask again." },
      { status: 502 }
    );
  }
}
