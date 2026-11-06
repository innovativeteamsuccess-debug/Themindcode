import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SubjectDetail } from "@/components/mindcode/subject-detail";
import { SUBJECTS } from "@/components/mindcode/data";

function isSubjectKey(v: string): v is (typeof SUBJECTS)[number]["key"] {
  return SUBJECTS.some((s) => s.key === v);
}

/* Pre-render every class × subject at build time (needed for output: export). */
export async function generateStaticParams() {
  const out: { cls: string; subject: string }[] = [];
  for (let cls = 6; cls <= 12; cls++) {
    for (const s of SUBJECTS) out.push({ cls: String(cls), subject: s.key });
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cls: string; subject: string }>;
}): Promise<Metadata> {
  const { cls, subject } = await params;
  const s = SUBJECTS.find((x) => x.key === subject);
  return {
    title: s ? `Class ${cls} ${s.name} — The Mind Code` : `Class ${cls} — The Mind Code`,
    description: s ? `Class ${cls} ${s.name}: chapter constellation, free resources and test missions.` : "Subject world",
  };
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ cls: string; subject: string }>;
}) {
  const { cls, subject } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 6 || n > 12 || !isSubjectKey(subject)) notFound();
  return <SubjectDetail cls={n} subjectKey={subject} />;
}
