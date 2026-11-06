import type { Metadata } from "next";
import { TestRunner } from "@/components/mindcode/test-runner";
import { TESTS } from "@/components/mindcode/data";

export function generateStaticParams() {
  return TESTS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = TESTS.find((x) => x.id === id);
  return {
    title: t ? `${t.title} — The Test Lab` : "Test — The Mind Code",
    description: t ? `${t.questions.length} practice questions · ${t.minutes} minutes · instant explanations. No pressure, just signal.` : "Test mission",
  };
}

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TestRunner id={id} />;
}
