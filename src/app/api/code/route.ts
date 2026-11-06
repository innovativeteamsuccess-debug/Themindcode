import { NextResponse } from "next/server";
import { z } from "zod";
import ZAI from "z-ai-web-dev-sdk";
import { CODE_SYSTEM_PROMPT } from "@/components/mindcode/data";
import { getRequestUser, unauthorized } from "@/lib/session";
import { rateLimit, tooMany } from "@/lib/rate-limit";
import { readJson } from "@/lib/http";

const ChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(24),
});

const FALLBACK_REPLY =
  "I drifted out of orbit for a second. Try asking me again — maybe start with a chapter name, like *Trigonometry* or *Chemical Reactions*.";

export async function POST(req: Request) {
  /* CODE's brain costs real compute — usage requires a (free) account. */
  const user = await getRequestUser();
  if (!user) return unauthorized();

  /* token-burn guard: 20 tutor replies per 10 minutes per student */
  if (!rateLimit(`code:${user.id}`, 20, 10 * 60_000)) {
    return tooMany(10 * 60_000, "CODE needs a breath — you've sent 20 questions in 10 minutes. Take a short orbit and come back.");
  }

  try {
    const rawBody = await readJson(req);
    const parsed = ChatSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid message." },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        { role: "assistant", content: CODE_SYSTEM_PROMPT },
        ...parsed.data.messages,
      ],
      thinking: { type: "disabled" },
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    if (!reply) {
      return NextResponse.json({ ok: true, reply: FALLBACK_REPLY });
    }

    return NextResponse.json({ ok: true, reply });
  } catch (err) {
    console.error("[code] failed:", err);
    return NextResponse.json(
      { ok: false, error: "CODE is recharging. Please try again shortly." },
      { status: 500 }
    );
  }
}
