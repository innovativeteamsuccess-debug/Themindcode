import type { Metadata } from "next";
import { TutorProfile } from "@/components/mindcode/tutors";
import { TUTORS } from "@/components/mindcode/data";

export function generateStaticParams() {
  return TUTORS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = TUTORS.find((x) => x.id === id);
  return {
    title: t ? `${t.name} — ${t.role}` : "Teacher — The Mind Code",
    description: t ? `${t.name}: ${t.subjects.join(", ")} for Classes ${t.classes[0]}–${t.classes[t.classes.length - 1]}. Verified profile, request a demo.` : "Tutor profile",
  };
}

export default async function TutorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TutorProfile id={id} />;
}
