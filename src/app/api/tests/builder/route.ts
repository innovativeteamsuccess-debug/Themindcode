import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import { PDFParse } from "pdf-parse";
import { getCurrentUser } from "@/lib/current-user";
import { isAdminEmail } from "@/lib/auth";

/* ============================================================
   Test Builder — step 1.
   Admin uploads a real question-bank PDF → the server extracts the
   text with pdf-parse → the LLM drafts MCQs strictly from that
   text. Nothing is saved yet; the founder reviews, edits, then
   publishes via /api/tests/publish.
   ============================================================ */

const DraftQuestion = z.object({
  q: z.string().min(3).max(500),
  options: z.array(z.string().min(1).max(300)).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(600).optional(),
});

const MAX_CHARS = 18_000;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ ok: false, error: "Admins only." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Expected multipart form with a PDF." }, { status: 400 });
  }

  const file = form.get("file");
  const subject = String(form.get("subject") ?? "Science").slice(0, 40);
  const cls = Number(form.get("cls") ?? 10);
  const count = Math.min(Math.max(Number(form.get("count") ?? 10), 1), 30);

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "Attach a PDF file." }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "PDF too large (max 15 MB)." }, { status: 400 });
  }
  if (!Number.isInteger(cls) || cls < 6 || cls > 12) {
    return NextResponse.json({ ok: false, error: "Class must be 6–12." }, { status: 400 });
  }

  /* ---- real text extraction (pdf-parse v2, node runtime) ---- */
  let text = "";
  let parser: PDFParse | null = null;
  try {
    parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
    const out = await parser.getText();
    text = (out.text ?? "").replace(/\s+/g, " ").trim();
  } catch (e) {
    console.error("[tests/builder] extraction failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error:
          e instanceof Error && /password/i.test(e.message)
            ? "This PDF is password-protected — unlock it and upload again."
            : "Could not read that PDF. Is it a valid, text-based PDF (not a scan)?",
      },
      { status: 422 }
    );
  } finally {
    await parser?.destroy().catch(() => {});
  }

  if (text.length < 80) {
    return NextResponse.json(
      { ok: false, error: "Almost no text found — this looks like a scanned image PDF. Upload a text-based PDF." },
      { status: 422 }
    );
  }
  const clipped = text.slice(0, MAX_CHARS);

  /* ---- real draft generation from the extracted text ---- */
  const system =
    `You are an exam setter for CBSE Class ${cls} ${subject} in India. ` +
    "You create multiple-choice questions STRICTLY from the provided source text — never invent facts outside it. " +
    "Distractors must be plausible but clearly wrong to a student who knows the concept. " +
    "Reply with ONLY a JSON array, no prose, no markdown fences. " +
    'Each item: {"q": question text, "options": [exactly 4 short strings], "answerIndex": 0-3, "explanation": one line why}.';

  const userMsg =
    `Source text (may be truncated):\n"""\n${clipped}\n"""\n\n` +
    `Create exactly ${count} MCQs from this text, ordered easy to hard.`;

  try {
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: system },
        { role: "user", content: userMsg },
      ],
      thinking: { type: "disabled" },
    });

    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) throw new Error("empty_llm_reply");

    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const arr = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(arr)) throw new Error("not_an_array");

    const draft = arr
      .map((x) => DraftQuestion.safeParse(x))
      .filter((r) => r.success)
      .map((r) => r.data);

    if (draft.length === 0) {
      return NextResponse.json(
        { ok: false, error: "The draft came back malformed. Try again or lower the question count." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      draft,
      extractedChars: text.length,
      usedChars: clipped.length,
      fileName: file.name,
    });
  } catch (e) {
    console.error("[tests/builder] failed:", e);
    return NextResponse.json(
      { ok: false, error: "Draft generation failed. Check the AI service and try again." },
      { status: 502 }
    );
  }
}
