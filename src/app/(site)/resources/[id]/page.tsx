import type { Metadata } from "next";
import { ResourceReader } from "@/components/mindcode/resource-reader";
import { RESOURCES } from "@/components/mindcode/data";

export function generateStaticParams() {
  return RESOURCES.map((r) => ({ id: r.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = RESOURCES.find((x) => x.id === id);
  return {
    title: r ? `${r.title} — The Mind Code` : "Resource — The Mind Code",
    description: r ? `${r.type} · Class ${r.cls} · ${r.pages} pages · free PDF preview and study tools.` : "Resource reader",
  };
}

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ResourceReader id={id} />;
}
