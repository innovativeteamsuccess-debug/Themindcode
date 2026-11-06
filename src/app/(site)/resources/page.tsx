import type { Metadata } from "next";
import { Vault } from "@/components/mindcode/vault";

export const metadata: Metadata = {
  title: "The Free Knowledge Vault — The Mind Code",
  description: "2,500+ free resources — notes, mind maps, formula sheets, worksheets, PYQs and sample papers for CBSE Classes 6–10.",
};

export default function ResourcesPage() {
  return (
    <main className="flex-1">
      <div className="h-16 md:h-24" aria-hidden />
      <Vault />
    </main>
  );
}
