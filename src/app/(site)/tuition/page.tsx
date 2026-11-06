import type { Metadata } from "next";
import { PrivateLearning } from "@/components/mindcode/private-learning";

export const metadata: Metadata = {
  title: "Home Tuition — Find Your Learning Fit",
  description: "Personalised learning: home tuition, online 1:1, small group and hybrid modes for CBSE Classes 6–10. Request a demo with a verified founder-teacher.",
};

export default function TuitionPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <PrivateLearning />
    </main>
  );
}
