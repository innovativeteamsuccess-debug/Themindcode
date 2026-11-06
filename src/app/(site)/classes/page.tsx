import type { Metadata } from "next";
import { ClassPicker } from "@/components/mindcode/class-picker";

export const metadata: Metadata = {
  title: "Choose Your Class — The Mind Code",
  description: "Class worlds for Classes 6–12. Free notes for Classes 6–10 are live today — CBSE aligned, playful, free.",
};

export default function ClassesPage() {
  return <ClassPicker />;
}
