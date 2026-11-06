"use client";

import type { ReactNode } from "react";
import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

export function SectionHeading({
  index,
  eyebrow,
  title,
  lede,
  align = "left",
  children,
  className,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  align?: "left" | "center";
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative z-10 mb-12 md:mb-16",
        align === "center" && "text-center",
        className
      )}
    >
      <Reveal variant="editorial">
        <div
          className={cn(
            "flex items-center gap-4",
            align === "center" && "justify-center"
          )}
        >
          {index && (
            <span className="font-code flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-[var(--mc-accent)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--mc-accent)]" />
              {index}
            </span>
          )}
          <span className="eyebrow">{eyebrow}</span>
        </div>
      </Reveal>
      <Reveal variant="editorial" delay={0.08}>
        <h2
          className={cn(
            "mt-6 text-[clamp(2.1rem,5.4vw,4.1rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-balance",
            "[&_.accent-serif]:text-[var(--mc-accent)] [&_.accent-serif]:font-normal",
            "[&_.accent-serif]:text-[1.06em]"
          )}
        >
          {title}
        </h2>
      </Reveal>
      {lede && (
        <Reveal variant="editorial" delay={0.16}>
          <p
            className={cn(
              "mt-5 max-w-xl text-[15px] leading-relaxed text-dim md:text-base",
              align === "center" && "mx-auto"
            )}
          >
            {lede}
          </p>
        </Reveal>
      )}
      {children}
    </div>
  );
}
