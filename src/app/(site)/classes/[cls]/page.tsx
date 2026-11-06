import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClassDetail } from "@/components/mindcode/class-detail";

export function generateStaticParams() {
  return [6, 7, 8, 9, 10, 11, 12].map((cls) => ({ cls: String(cls) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cls: string }>;
}): Promise<Metadata> {
  const { cls } = await params;
  return {
    title: `Class ${cls} — The Mind Code`,
    description: `Class ${cls} subject worlds: Mathematics, Science, Social Science, English, Hindi and Sanskrit — chapters, resources and test missions.`,
  };
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ cls: string }>;
}) {
  const { cls } = await params;
  const n = Number(cls);
  if (!Number.isInteger(n) || n < 6 || n > 12) notFound();
  return <ClassDetail cls={n} />;
}
