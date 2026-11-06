import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterDetail } from "@/components/mindcode/chapter-detail";
import { SUBJECTS, chaptersFor, slugify } from "@/components/mindcode/data";

type Params = Promise<{ cls: string; subject: string; chapter: string }>;

function isSubjectKey(v: string): v is (typeof SUBJECTS)[number]["key"] {
  return SUBJECTS.some((s) => s.key === v);
}

/* Pre-render every class × subject × chapter at build time so the page
   works with `output: export` (static hosts) as well as standalone. */
export async function generateStaticParams() {
  const out: { cls: string; subject: string; chapter: string }[] = [];
  for (let cls = 6; cls <= 12; cls++) {
    for (const s of SUBJECTS) {
      for (const ch of chaptersFor(cls, s.key)) {
        out.push({ cls: String(cls), subject: s.key, chapter: slugify(ch.name) });
      }
    }
  }
  return out;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { cls, subject, chapter } = await params;
  const s = SUBJECTS.find((x) => x.key === subject);
  const ch = s ? chaptersFor(Number(cls), s.key).find((c) => slugify(c.name) === chapter) : undefined;
  return {
    title: ch ? `${ch.name} — Class ${cls} ${s?.name} — The Mind Code` : `Chapter — The Mind Code`,
    description: ch ? `Learn, practise and test ${ch.name} — notes, practice, PYQs and quick revision in one screen.` : "Chapter screen",
  };
}

export default async function ChapterPage({ params }: { params: Params }) {
  const { cls, subject, chapter } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 6 || n > 12 || !isSubjectKey(subject)) notFound();
  const exists = chaptersFor(n, subject).some((c) => slugify(c.name) === chapter);
  if (!exists) notFound();
  return <ChapterDetail cls={n} subjectKey={subject} chapterSlug={chapter} />;
}
