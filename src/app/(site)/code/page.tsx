import type { Metadata } from "next";
import { CodeWorkspace } from "@/components/mindcode/code-workspace";

export const metadata: Metadata = {
  title: "Meet CODE — Your AI Learning Companion",
  description:
    "Explain, quiz, hint, plan. CODE — the mascot of The Mind Code — lives inside the Mind Core and makes hard things feel simple — CBSE Classes 6–10.",
};

export default function CodePage() {
  return <CodeWorkspace />;
}
