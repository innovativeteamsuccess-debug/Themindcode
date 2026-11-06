import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/auth";

/* ============================================================
   Publish a test to the Student Zone.
   Admin-only (ADMIN_EMAILS in .env). Questions arrive already
   drafted (usually from /api/tests/builder) and optionally edited
   by the founder. Stored as JSON, served to students immediately.
   ============================================================ */

const Question = z.object({
  q: z.string().min(3).max(500),
  options: z.array(z.string().min(1).max(300)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(600).optional(),
});

const Body = z.object({
  title: z.string().min(3).max(160),
  subject: z.string().min(2).max(40),
  cls: z.number().int().min(6).max(12),
  minutes: z.number().int().min(5).max(180).default(20),
  sourceName: z.string().max(200).optional(),
  questions: z.array(Question).min(1).max(60),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid test payload — check title, class and questions." },
      { status: 400 }
    );
  }

  const { title, subject, cls, minutes, sourceName, questions } = parsed.data;

  const test = await db.test.create({
    data: {
      title,
      subject,
      cls,
      minutes,
      source: "pdf",
      sourceName: sourceName ?? null,
      questions: JSON.stringify(questions),
      published: true,
    },
  });

  return NextResponse.json({ ok: true, id: test.id });
}
