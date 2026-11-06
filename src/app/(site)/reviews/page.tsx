import type { Metadata } from "next";
import { Reviews } from "@/components/mindcode/reviews";

export const metadata: Metadata = {
  title: "The Wall of Trust — Verified Google Reviews",
  description: "Real people, real experiences. Every review on this wall is verified — nothing invented, nothing bought.",
};

export default function ReviewsPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <Reviews />
    </main>
  );
}
