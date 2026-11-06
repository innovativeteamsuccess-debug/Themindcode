/* ============================================================
   CODE TUTOR — POST /api/tutor/plan
   Topic → lesson plan (concepts, objectives, quiz).
   Requires sign-in (Clerk session or fallback cookie).
   ============================================================ */

import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import { tutorUser, unauthorized, generateJson, planMessages } from "@/components/tutor/ai";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";
import type { LessonPlan } from "@/components/tutor/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  topic: z.string().min(3).max(200),
  curriculum: z.string().max(40).default("CBSE"),
  grade: z.string().max(40).default("Class 10"),
  subject: z.string().max(40).default("Physics"),
  persona: z.string().max(20).default("friendly"),
  examMode: z.boolean().default(false),
});

export async function POST(req: Request) {
  const user = await tutorUser();
  if (!user) return unauthorized();

  /* token-burn guard: 8 full lesson plans per 10 minutes per student */
  if (!rateLimit(`tutor-plan:${user.id}`, 8, 10 * 60_000)) {
    return tooMany(10 * 60_000, "Lesson planning is heavy — take a short break before starting another lesson.");
  }

  let input: z.infer<typeof BodySchema>;
  try {
    input = BodySchema.parse(await readJson(req));
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid lesson request." }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();
    const parsed = await generateJson<Partial<LessonPlan>>(zai, planMessages(input));
    if (!parsed.title || !Array.isArray(parsed.concepts) || parsed.concepts.length === 0) {
      throw new Error("bad plan");
    }

    const plan: LessonPlan = {
      title: String(parsed.title).slice(0, 120),
      topic: input.topic,
      subject: String(parsed.subject ?? input.subject).slice(0, 60),
      grade: String(parsed.grade ?? input.grade).slice(0, 40),
      curriculum: input.curriculum,
      prerequisites: (parsed.prerequisites ?? []).slice(0, 6).map((s) => String(s).slice(0, 120)),
      objectives: (parsed.objectives ?? []).slice(0, 6).map((s) => String(s).slice(0, 140)),
      concepts: parsed.concepts.slice(0, 5).map((c, i) => ({
        id: String(c.id ?? `c${i + 1}`).slice(0, 20),
        title: String(c.title ?? `Concept ${i + 1}`).slice(0, 90),
        goal: String(c.goal ?? "").slice(0, 220),
        keyTerms: (c.keyTerms ?? []).slice(0, 6).map((s) => String(s).slice(0, 40)),
      })),
      quiz: (parsed.quiz ?? []).slice(0, 5).map((q) => ({
        q: String(q.q ?? "").slice(0, 300),
        options: (q.options ?? []).slice(0, 4).map((o) => String(o).slice(0, 90)),
        answer: Math.min(3, Math.max(0, Number(q.answer) || 0)),
        why: q.why ? String(q.why).slice(0, 220) : undefined,
      })),
      persona: input.persona as LessonPlan["persona"],
      examMode: input.examMode,
    };
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[tutor/plan] failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not design the lesson right now. Try again in a moment." },
      { status: 502 }
    );
  }
}
