import type { Metadata } from "next";
import { HomeGateway } from "@/components/mindcode/home-gateway";

export const metadata: Metadata = {
  title: "The Mind Code — Crack the concept. Own the exam.",
  description: "A playful multi-screen learning universe for Classes 6–10 — free notes, worksheets, PYQs, the Test Lab, CODE AI and home tuition. Free, forever.",
};

export default function Home() {
  return <HomeGateway />;
}
