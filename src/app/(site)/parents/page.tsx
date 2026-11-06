import type { Metadata } from "next";
import { CommandCentre } from "@/components/mindcode/command-centre";

export const metadata: Metadata = {
  title: "Parent Zone — See the Progress. Understand the Journey.",
  description: "A calm, readable view of attendance, performance, teacher feedback and upcoming classes. Meaningful progress, never vanity statistics.",
};

export default function ParentsPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <CommandCentre view="parent" />
    </main>
  );
}
