import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "CODE Tutor — AI Whiteboard Classroom · The Mind Code",
  description:
    "A real AI teacher at a whiteboard: lessons planned, written and drawn live — diagrams, formulas, step-by-step solving, questions and a mini quiz. By The Mind Code.",
};

export const viewport: Viewport = {
  themeColor: "#070D18",
  width: "device-width",
  initialScale: 1,
};

export default function TutorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen">{children}</div>;
}
