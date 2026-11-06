"use client";

/* ============================================================
   HOME — the campus entrance.
   One job: welcome, then hand you to a world. Everything else
   lives on its own screen.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, BadgeCheck, Sparkles } from "lucide-react";
import { Hero } from "./hero";
import { CodeStrip } from "./code-strip";
import { FinalSection } from "./final-section";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { SectionHeading } from "./section-heading";
import { ArtifactCard } from "./vault";
import { CodeSection } from "./code";
import { WORLDS, RESOURCES, STATS, VERIFIED_REVIEW, FOUNDER } from "./data";

/* ------------------------------------------------------------------ */
/* World map — the Mind Core with floating destinations                */
/* ------------------------------------------------------------------ */

const ORBIT: Record<string, { top: string; left: string }> = {
  "/classes": { top: "2%", left: "50%" },
  "/resources": { top: "16%", left: "84%" },
  "/tests": { top: "50%", left: "94%" },
  "/tuition": { top: "82%", left: "78%" },
  "/code": { top: "94%", left: "50%" },
  "/dashboard": { top: "82%", left: "22%" },
  "/books": { top: "50%", left: "6%" },
  "/about": { top: "16%", left: "16%" },
};

function WorldMap() {
  return (
    <section aria-label="Explore the worlds of The Mind Code" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 45%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="01"
          eyebrow="PICK A WORLD"
          title={
            <>
              One campus. <span className="accent-serif">Eight worlds.</span>
            </>
          }
          lede="Everything has its own home here — learn, practise, get help, ask CODE, track progress. The Mind Core keeps it all connected."
          align="center"
        />

        {/* orbital map — desktop */}
        <div className="relative mx-auto hidden h-[480px] max-w-4xl md:block" aria-hidden={false}>
          {/* connecting rings */}
          <div aria-hidden className="absolute inset-0 flex items-center justify-center">
            <div className="h-[340px] w-[340px] rounded-full border border-[var(--mc-line-soft)]" />
            <div className="absolute h-[520px] w-[520px] rounded-full border border-dashed border-[var(--mc-line-soft)] mc-spin-slower" />
          </div>

          {/* the mind core */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <CoreOrb />
          </div>

          {/* destination chips */}
          {WORLDS.map((w, i) => (
            <motion.div
              key={w.href}
              initial={{ opacity: 0, scale: 0.7 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.06 * i, ease: [0.22, 1, 0.36, 1] }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: ORBIT[w.href].top, left: ORBIT[w.href].left }}
            >
              <Link
                href={w.href}
                data-cursor="interactive"
                className="mc-glass group flex items-center gap-3 rounded-2xl px-4 py-3 transition-all duration-300 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_60%,transparent)] hover:shadow-[0_16px_44px_-16px_var(--mc-glow)]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card)] text-base" aria-hidden>
                  {w.glyph}
                </span>
                <span>
                  <span className="block text-[13.5px] font-semibold leading-tight">{w.label}</span>
                  <span className="font-code block text-[8.5px] uppercase tracking-[0.22em] text-faint">
                    {w.job}
                  </span>
                </span>
                <ArrowUpRight size={13} className="text-faint opacity-0 transition-all duration-300 group-hover:opacity-100" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* world grid — mobile */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:hidden">
          {WORLDS.map((w) => (
            <Link
              key={w.href}
              href={w.href}
              className="mc-card flex flex-col items-start gap-2 p-4 transition-transform active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-base" aria-hidden>
                {w.glyph}
              </span>
              <span className="text-[13.5px] font-semibold leading-tight">{w.label}</span>
              <span className="font-code text-[8.5px] uppercase tracking-[0.2em] text-faint">{w.job}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function CoreOrb() {
  return (
    <div className="relative h-40 w-40" aria-hidden>
      <div
        className="mc-breathe absolute inset-6 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--mc-accent-2) 70%, white), var(--mc-accent) 62%, transparent 82%)",
          boxShadow: "0 0 60px var(--mc-glow)",
          opacity: 0.85,
        }}
      />
      <svg viewBox="0 0 200 200" className="absolute inset-0 h-full w-full">
        <g className="mc-spin-slow" style={{ transformOrigin: "100px 100px" }}>
          <ellipse cx="100" cy="100" rx="92" ry="36" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.4" transform="rotate(-18 100 100)" />
          <ellipse cx="100" cy="100" rx="92" ry="36" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.4" transform="rotate(18 100 100)" />
          <circle cx="188" cy="72" r="2.4" fill="var(--mc-accent)" />
          <circle cx="12" cy="128" r="2.4" fill="var(--mc-accent)" />
        </g>
        <g className="mc-spin-slower" style={{ transformOrigin: "100px 100px" }}>
          <circle cx="100" cy="100" r="70" fill="none" stroke="var(--mc-accent)" strokeOpacity="0.35" strokeDasharray="2 8" />
        </g>
        <circle cx="100" cy="100" r="4" fill="var(--mc-accent)" />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Why The Mind Code                                                   */
/* ------------------------------------------------------------------ */

const WHY = [
  {
    glyph: "◎",
    title: "Understand first. Memorise never.",
    body: "Every note, worksheet and test is built to make the concept click — then stick. That is the whole method.",
  },
  {
    glyph: "∞",
    title: "Free, forever.",
    body: `${STATS[0].value} resources for Classes 6–10, open to everyone. No paywalls, no trials that expire on you.`,
  },
  {
    glyph: "✦",
    title: "AI plus a real teacher.",
    body: "CODE explains and quizzes any time. And when a human touch matters, founder-teachers are one tap away.",
  },
];

function WhyMindCode() {
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="02"
          eyebrow="WHY THE MIND CODE"
          title={
            <>
              Built on one belief:{" "}
              <span className="accent-serif">every concept can crack.</span>
            </>
          }
        />
        <Stagger className="grid gap-4 md:grid-cols-3" gap={0.08}>
          {WHY.map((w) => (
            <StaggerItem key={w.title}>
              <div className="mc-card group h-full p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]">
                <span className="font-display flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-lg text-[var(--mc-accent)]" aria-hidden>
                  {w.glyph}
                </span>
                <h3 className="font-display mt-5 text-xl leading-snug">{w.title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-dim">{w.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Featured resources + learning modes                                 */
/* ------------------------------------------------------------------ */

function FeaturedResources() {
  const featured = RESOURCES.filter((r) => r.verified).slice(0, 3);
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            index="03"
            eyebrow="FRESH FROM THE VAULT"
            title={
              <>
                Featured <span className="accent-serif">artifacts</span>.
              </>
            }
            className="mb-0"
          />
          <Link
            href="/resources"
            className="btn-mono group flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
          >
            OPEN THE VAULT
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.08}>
          {featured.map((r) => (
            <StaggerItem key={r.id}>
              <ArtifactCard r={r} featured />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

const MODES = [
  {
    href: "/classes",
    glyph: "🎓",
    name: "Self-study",
    line: "Class worlds → subject planets → chapter constellations. Learn at your pace, free.",
    cta: "Choose your class",
  },
  {
    href: "/tests",
    glyph: "🧪",
    name: "Test Lab",
    line: "Daily quizzes, chapter missions, board simulations. Practice without pressure.",
    cta: "Enter the lab",
  },
  {
    href: "/tuition",
    glyph: "🏠",
    name: "Home Tuition",
    line: "Founder-led personal teaching — at your place, your pace, your goals.",
    cta: "Find your fit",
  },
];

function LearningModes() {
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="04"
          eyebrow="THREE WAYS TO LEARN"
          title={
            <>
              Your move, <span className="accent-serif">your mode</span>.
            </>
          }
        />
        <Stagger className="grid gap-4 md:grid-cols-3" gap={0.08}>
          {MODES.map((m) => (
            <StaggerItem key={m.href}>
              <Link
                href={m.href}
                data-cursor="interactive"
                className="mc-card group flex h-full flex-col p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
              >
                <span className="text-2xl" aria-hidden>{m.glyph}</span>
                <h3 className="font-display mt-4 text-2xl">{m.name}</h3>
                <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-dim">{m.line}</p>
                <span className="btn-mono mt-6 inline-flex items-center gap-2 text-[10px] text-[var(--mc-accent)]">
                  {m.cta.toUpperCase()}
                  <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Review spotlight + founder teaser                                   */
/* ------------------------------------------------------------------ */

function ReviewSpotlight() {
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 55%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 md:px-8">
        <Reveal variant="core">
          <figure className="mc-card relative overflow-hidden p-8 text-center md:p-14">
            <span
              className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
            />
            <div className="flex justify-center gap-1.5" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <StarGlyph key={i} />
              ))}
            </div>
            <blockquote className="editorial-quote mx-auto mt-8 max-w-2xl text-[clamp(1.3rem,3.2vw,2rem)]">
              “{VERIFIED_REVIEW.quote}”
            </blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-2">
              <span className="btn-mono text-[12px] text-[var(--mc-ink)]">{VERIFIED_REVIEW.name}</span>
              <span className="text-xs text-dim">{VERIFIED_REVIEW.meta}</span>
              <span className="font-code mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
                <BadgeCheck size={11} className="text-[var(--mc-accent)]" />
                Verified Google review
              </span>
            </figcaption>
          </figure>
        </Reveal>
        <Reveal variant="rise" delay={0.1}>
          <p className="mt-6 text-center">
            <Link href="/reviews" className="link-sweep text-sm text-[var(--mc-accent)]">
              Read the Wall of Trust →
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function StarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path
        d="M12 2l2.9 6.26 6.6.57-5 4.36 1.5 6.45L12 16.9l-6 3.74 1.5-6.45-5-4.36 6.6-.57L12 2z"
        fill="var(--mc-accent)"
      />
    </svg>
  );
}

function FounderTeaser() {
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Reveal variant="rise">
          <Link
            href="/about/founder"
            data-cursor="interactive"
            className="mc-card group grid items-center gap-8 p-6 transition-all duration-500 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)] md:grid-cols-[auto_1fr_auto] md:p-8"
          >
            <span
              className="mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-full border border-[var(--mc-line)] md:mx-0"
              style={{ boxShadow: "0 0 40px -8px var(--mc-glow)" }}
            >
                      <img src="/founder.jpg" alt={FOUNDER.name} className="h-full w-full object-cover" loading="lazy" />
            </span>
            <span>
              <span className="eyebrow block">THE PERSON BEHIND THE CODE</span>
              <span className="font-display mt-3 block text-2xl md:text-3xl">{FOUNDER.name}</span>
              <span className="mt-2 block max-w-xl text-[13.5px] leading-relaxed text-dim">
                {FOUNDER.role} · {FOUNDER.location} · teaching since {FOUNDER.since.replace("August ", "Aug ")}.
              </span>
            </span>
            <span className="btn-mono hidden items-center gap-2 text-[10px] text-[var(--mc-accent)] md:inline-flex">
              MEET THE FOUNDER
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function HomeGateway() {
  return (
    <main className="flex-1">
      <Hero />
      <CodeStrip />
      <WorldMap />
      <WhyMindCode />
      <FeaturedResources />
      <LearningModes />
      <CodeSection />
      <ReviewSpotlight />
      <FounderTeaser />
      <FinalSection />
      {/* tiny easter egg for the curious */}
      <span className="sr-only">
        <Sparkles aria-hidden /> psst — try selecting text anywhere. The mind notices.
      </span>
    </main>
  );
}
