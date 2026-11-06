import type { Metadata } from "next";
import { AboutPage } from "@/components/mindcode/about-page";

export const metadata: Metadata = {
  title: "About The Mind Code — Not Another Tuition Website",
  description: "The story, philosophy and people behind The Mind Code — a learning universe for CBSE Classes 6–10, founded by Pankaj Malik.",
};

export default function About() {
  return <AboutPage />;
}
