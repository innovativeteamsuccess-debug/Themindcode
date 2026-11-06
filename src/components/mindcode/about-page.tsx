"use client";

/* ============================================================
   /about — trust screen. Story, stats, worlds, FAQ, founder.
   ============================================================ */

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQS, FOUNDER, STATS, WORLDS } from "./data";
import { Reveal } from "./reveal";
import { WorldBody, WorldHeader } from "./world-shell";

export function AboutPage() {
  return (
    <main className="flex-1">
      <WorldHeader
        glyph="🧠"
        world="ABOUT THE MIND CODE"
        title="Not another tuition website."
        titleAccent=""
        sub="A learning universe built around one belief: every concept can crack. Founded by a teacher, kept free on principle, powered by AI that respects students."
      />

      <WorldBody className="pb-24">
        {/* stats strip */}
        <div className="grid gap-px overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-line)] sm:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.label} className="bg-[var(--mc-card)] p-7 text-center">
              <div className="font-display text-4xl text-[var(--mc-accent)]">{s.value}</div>
              <div className="mt-1.5 text-[13px] font-semibold">{s.label}</div>
              <div className="font-code mt-1 text-[8.5px] uppercase tracking-[0.2em] text-faint">{s.note}</div>
            </div>
          ))}
        </div>

        {/* story */}
        <div className="mt-16 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
          <Reveal variant="editorial">
            <h2 className="font-display text-[clamp(1.7rem,4vw,2.6rem)] font-semibold leading-tight">
              The story, in <span className="accent-serif text-[var(--mc-accent)]">four beats</span>.
            </h2>
            <div className="mt-8 flex flex-col gap-0">
              {FOUNDER.timeline.map((t, i) => (
                <div key={t.title} className="relative flex gap-5 pb-8 last:pb-0">
                  {i < FOUNDER.timeline.length - 1 && (
                    <span className="absolute left-[13px] top-8 h-[calc(100%-2rem)] w-px bg-[var(--mc-line)]" aria-hidden />
                  )}
                  <span className="font-code relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--mc-accent)] text-[9px] font-bold text-[var(--mc-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-code text-[9px] uppercase tracking-[0.22em] text-faint">{t.year}</div>
                    <div className="font-display mt-1 text-lg leading-snug">{t.title}</div>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-dim">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal variant="rise" delay={0.1}>
            <div className="flex h-full flex-col gap-4">
              <div className="mc-card p-7">
                <h3 className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                  THE PHILOSOPHY
                </h3>
                <p className="editorial-quote mt-4 text-[clamp(1.15rem,2.4vw,1.5rem)] leading-snug">
                  “{FOUNDER.philosophy}”
                </p>
                <p className="mt-4 text-[12px] text-faint">— {FOUNDER.name}, {FOUNDER.role}</p>
              </div>
              <Link
                href="/about/founder"
                className="mc-card group flex items-center gap-4 p-6 transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
              >
                <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--mc-line)]">
                  <img src="/founder.jpg" alt={FOUNDER.name} className="h-full w-full object-cover object-top" loading="lazy" />
                </span>
                <span className="flex-1">
                  <span className="block text-[14.5px] font-semibold">The person behind the code</span>
                  <span className="mt-0.5 block text-[12.5px] text-dim">
                    Story, timeline and philosophy — on one page.
                  </span>
                </span>
              </Link>
            </div>
          </Reveal>
        </div>

        {/* worlds index */}
        <div className="mt-20">
          <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.3rem)] font-semibold">
            Every world, <span className="accent-serif text-[var(--mc-accent)]">one tap away</span>.
          </h2>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORLDS.map((w, i) => (
              <motion.div
                key={w.href}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.04 * i }}
              >
                <Link
                  href={w.href}
                  className="mc-card group flex items-center gap-3.5 p-4 transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-base" aria-hidden>
                    {w.glyph}
                  </span>
                  <span>
                    <span className="block text-[13.5px] font-semibold">{w.label}</span>
                    <span className="font-code block text-[8px] uppercase tracking-[0.2em] text-faint">{w.job}</span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.3rem)] font-semibold">
            Honest <span className="accent-serif text-[var(--mc-accent)]">answers</span>.
          </h2>
          <div className="mx-auto mt-7 max-w-2xl">
            {FAQS.map((f, i) => (
              <FaqRow key={f.q} q={f.q} a={f.a} index={i} />
            ))}
          </div>
        </div>
      </WorldBody>
    </main>
  );
}

function FaqRow({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="border-b border-[var(--mc-line)] last:border-b-0">
      <h3 className="flex">
        <button
          type="button"
          id={`about-faq-trigger-${index}`}
          aria-expanded={open}
          aria-controls={`about-faq-panel-${index}`}
          onClick={() => setOpen((v) => !v)}
          className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-[15px] font-medium transition-colors outline-none hover:text-[var(--mc-accent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span>{q}</span>
          <ChevronDown
            size={16}
            aria-hidden
            className={cn(
              "mt-0.5 shrink-0 transition-transform duration-300",
              open ? "rotate-180 text-[var(--mc-accent)]" : "text-dim"
            )}
          />
        </button>
      </h3>
      <div
        id={`about-faq-panel-${index}`}
        role="region"
        aria-labelledby={`about-faq-trigger-${index}`}
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-dim">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* animatepresence guard */
void AnimatePresence;
