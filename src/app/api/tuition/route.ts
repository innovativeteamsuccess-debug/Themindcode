import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit, tooMany, clientIp } from "@/lib/rate-limit";

const EnquirySchema = z.object({
  studentClass: z.coerce.number().int().min(6).max(12),
  subject: z.string().min(1).max(60),
  location: z.string().min(2).max(120),
  mode: z.enum(["HOME", "ONLINE", "OFFLINE", "SMALL GROUP", "HYBRID"]),
  schedule: z.string().min(1).max(80),
  goal: z.string().min(4).max(600),
});

export async function POST(req: Request) {
  /* this form is anonymous — per-IP spam guard: 5 enquiries per 10 minutes */
  if (!rateLimit(`tuition:${clientIp(req)}`, 5, 10 * 60_000)) {
    return tooMany(10 * 60_000, "We already have your recent request — our team will reach out shortly.");
  }

  try {
    const body = await req.json();
    const parsed = EnquirySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: "Please complete every field of your learning profile." },
        { status: 400 }
      );
    }

    const enquiry = await db.tuitionEnquiry.create({
      data: parsed.data,
    });

    return NextResponse.json({
      ok: true,
      id: enquiry.id,
      message: "Guide matching initiated.",
    });
  } catch (err) {
    console.error("[tuition] failed:", err);
    return NextResponse.json(
      { ok: false, error: "The universe hiccuped. Please try again in a moment." },
      { status: 500 }
    );
  }
}
