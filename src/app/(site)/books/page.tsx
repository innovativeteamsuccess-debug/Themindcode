import type { Metadata } from "next";
import { BookSection } from "@/components/mindcode/book";

export const metadata: Metadata = {
  title: "The Mind Code Library — Unlock the Infinite Code",
  description: "Unlock the Infinite Code by Pankaj Malik — Rewire Your Brain, Master Your Emotions, Redesign Your Destiny. Kindle edition, verified Amazon listing.",
};

export default function BooksPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <BookSection />
    </main>
  );
}
