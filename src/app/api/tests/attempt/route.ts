import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { rateLimit, tooMany } from "@/lib/rate-limit";

/* ============================================================
   Submit a test attempt.
   Requires a signed-in student. Grading happens HERE, from the
   answers stored in the database — the browser never receives the
   key before submission. The attempt is saved permanently.
   ============================================================ */

const Body = z.object({
  testId: z.string().min(1),
  answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(60),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sign in from the Student Zone to submit." },
      { status: 401 }
    );
  }

  /* flood + answer-key farming guard: 12 submissions per minute per student */
  if (!rateLimit(`attempt:${user.id}`, 12, 60_000)) {
    return tooMany(60_000, "Too many submissions in a minute — take a breath and review your answers.");
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid answers payload." }, { status: 400 });
  }
  const { testId, answers } = parsed.data;

  const test = await db.test.findUnique({ where: { id: testId } });
  if (!test || !test.published) {
    return NextResponse.json({ ok: false, error: "Test not found." }, { status: 404 });
  }

  type Q = { q: string; options: string[]; answerIndex: number; explanation?: string };
  const questions = JSON.parse(test.questions as string) as Q[];

  const perQuestion = questions.map((q, i) => {
    const chosen = answers[i] ?? null;
    return {
      index: i,
      chosen,
      answerIndex: q.answerIndex,
      correct: chosen === q.answerIndex,
      explanation: q.explanation,
    };
  });
  const score = perQuestion.filter((r) => r.correct).length;

  const attempt = await db.testAttempt.create({
    data: {
      userId: user.id,
      testId: test.id,
      answers: JSON.stringify(answers),
      score,
      total: questions.length,
    },
  });

  return NextResponse.json({
    ok: true,
    attemptId: attempt.id,
    score,
    total: questions.length,
    perQuestion,
  });
}
