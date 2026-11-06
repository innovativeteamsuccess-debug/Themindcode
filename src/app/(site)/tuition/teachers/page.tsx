import type { Metadata } from "next";
import { TeacherDiscovery } from "@/components/mindcode/tutors";

export const metadata: Metadata = {
  title: "Meet Your Guides — The Mind Code Tuition",
  description: "Verified teachers only — no paid listings, no inflated profiles. Browse guides and request a demo.",
};

export default function TeachersPage() {
  return <TeacherDiscovery />;
}
