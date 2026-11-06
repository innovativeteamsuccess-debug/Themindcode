import type { Metadata } from "next";
import { CommandCentre } from "@/components/mindcode/command-centre";

export const metadata: Metadata = {
  title: "Your Mind Core — Student Dashboard",
  description: "Today's missions, knowledge map, progress and AI recommendations — a personal command centre for CBSE students.",
};

export default function DashboardPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <CommandCentre view="student" />
    </main>
  );
}
