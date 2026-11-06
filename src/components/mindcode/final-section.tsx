"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useWarpNavigate } from "./store";
import { Magnetic } from "./magnetic";
import { Reveal } from "./reveal";
import { Moon, ShootingStars } from "./night-sky";

/** CSS mind core — the quiet return. */
function ReturningCore() {
  return (
    <div className="relative mx-auto h-52 w-52 md:h-64 md:w-64" aria-hidden>
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <g className="mc-breathe" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="30" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.7" />
          <circle cx="100" cy="100" r="30" fill="var(--mc-accent)" fillOpacity="0.06" />
          <circle
            cx="100"
            cy="100"
            r="52"
            fill="none"
            stroke="var(--mc-accent)"
            strokeOpacity="0.4"
            strokeDasharray="2 7"
          />
        </g>
        <g className="mc-spin-slow" style={{ transformOrigin: "100px 100px" }}>
          <ellipse cx="100" cy="100" rx="86" ry="33" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.35" transform="rotate(-16 100 100)" />
          <ellipse cx="100" cy="100" rx="86" ry="33" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.35" transform="rotate(16 100 100)" />
          <circle cx="183" cy="71" r="2.2" fill="var(--mc-accent)" />
          <circle cx="17" cy="129" r="2.2" fill="var(--mc-accent)" />
        </g>
        <circle cx="100" cy="100" r="3" fill="var(--mc-accent)" />
      </svg>
      <span
        className="mc-ping absolute inset-0 m-auto h-24 w-24 rounded-full border border-[var(--mc-accent)]"
        style={{ width: 96, height: 96 }}
      />
    </div>
  );
}

export function FinalSection() {
  const warpTo = useWarpNavigate();

  return (
    <section
      id="finale"
      className="mc-section relative flex flex-col items-center overflow-hidden text-center"
      style={{
        background:
          "radial-gradient(ellipse 70% 60% at 50% 60%, var(--mc-bg-2), var(--mc-bg) 75%)",
      }}
      data-cursor="core"
    >
      {/* the sky returns to close the story: meteors + a rising moon */}
      <ShootingStars />
      <Moon small className="left-[5%] top-[13%] h-14 w-14 opacity-90 sm:h-16 sm:w-16 lg:left-[7%] lg:h-20 lg:w-20" />

      <Reveal variant="core" className="mb-12">
        <ReturningCore />
      </Reveal>

      <Reveal variant="editorial">
        <p className="eyebrow">EVERYTHING CONVERGES HERE</p>
        <h2 className="mt-7 max-w-3xl text-[clamp(2.4rem,6.6vw,4.9rem)] font-semibold leading-[1.0] tracking-[-0.03em]">
          Your next chapter{" "}
          <span className="accent-serif glow-accent text-[var(--mc-accent)]">
            starts here.
          </span>
        </h2>
      </Reveal>

      <Reveal variant="editorial" delay={0.12}>
        <p className="mt-6 text-balance text-[15px] text-dim md:text-[17px]">
          One concept. One question. One small step at a time.
        </p>
      </Reveal>

      <Reveal variant="rise" delay={0.2}>
        <div className="mt-10 flex flex-col items-center gap-3.5 sm:flex-row">
          <Magnetic strength={0.22}>
            <button
              onClick={() => warpTo("/classes")}
              className="btn-mono group flex items-center gap-2.5 rounded-full bg-[var(--mc-cta-bg)] px-8 py-4 text-[12px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-8px_var(--mc-glow)] transition-transform hover:scale-[1.04]"
            >
              ENTER THE MIND CORE
              <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
            </button>
          </Magnetic>
          <Magnetic strength={0.16}>
            <Link
              href="/resources"
              className="btn-mono rounded-full border border-[var(--mc-ghost)] px-8 py-4 text-[12px] text-[var(--mc-ink)]/90 transition-all duration-300 hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              EXPLORE FREE RESOURCES
            </Link>
          </Magnetic>
        </div>
      </Reveal>
    </section>
  );
}
