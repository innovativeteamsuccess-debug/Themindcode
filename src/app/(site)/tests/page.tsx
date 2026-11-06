import type { Metadata } from "next";
import { TestLabPage } from "@/components/mindcode/test-lab-page";

export const metadata: Metadata = {
  title: "The Test Lab — Practice. Discover. Improve.",
  description: "Daily quizzes, chapter missions, full board simulations, PYQ mode and sample papers — playful practice with honest feedback.",
};

export default function TestsPage() {
  return <TestLabPage />;
}
