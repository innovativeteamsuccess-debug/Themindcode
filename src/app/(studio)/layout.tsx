import type { Metadata, Viewport } from "next";
import "../globals.css";
import "katex/dist/katex.min.css";

export const metadata: Metadata = {
  title: "CODE Studio — The AI Learning Canvas · The Mind Code",
  description:
    "An infinite AI-native learning canvas. Write, sketch, solve and visualise — with an AI tutor woven into the board itself. Part of The Mind Code universe.",
};

export const viewport: Viewport = {
  themeColor: "#050C18",
  width: "device-width",
  initialScale: 1,
};

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="st-body min-h-screen">{children}</div>;
}
