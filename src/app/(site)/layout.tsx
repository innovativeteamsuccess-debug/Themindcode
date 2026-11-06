import { BootIntro } from "@/components/mindcode/boot-intro";
import { CustomCursor } from "@/components/mindcode/custom-cursor";
import { Navbar } from "@/components/mindcode/navbar";
import { CoreWarp } from "@/components/mindcode/core-warp";
import { Footer } from "@/components/mindcode/footer";
import { CodeChat } from "@/components/mindcode/code";
import "../globals.css";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="grain relative flex min-h-screen flex-col bg-[var(--mc-bg)]">
      <BootIntro />
      <CustomCursor />
      <Navbar />
      <CoreWarp />
      {children}
      <Footer />
      <CodeChat />
    </div>
  );
}
