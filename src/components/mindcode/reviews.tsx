"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, ChevronDown, ThumbsUp } from "lucide-react";
import {
  GOOGLE_REVIEWS,
  GOOGLE_REVIEW_LIST,
  JUSTDIAL,
  VERIFIED_REVIEW,
  FAQS,
} from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";

function Star({ delay }: { delay: number }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className="h-5 w-5 md:h-6 md:w-6"
      initial={{ opacity: 0, scale: 0.3, rotate: -30 }}
      whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden
    >
      <path
        d="M12 2l2.9 6.26 6.6.57-5 4.36 1.5 6.45L12 16.9l-6 3.74 1.5-6.45-5-4.36 6.6-.57L12 2z"
        fill="var(--mc-accent)"
      />
    </motion.svg>
  );
}

function GoogleMark({ size = "h-4 w-4" }: { size?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={size} aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2.05 3.5-5.05 3.5-8.77z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.07 7.9-2.9l-3.76-2.9c-1 .7-2.36 1.2-4.1 1.2a7.1 7.1 0 0 1-6.7-4.9l-.14.01-3.1 2.4-.04.14A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.5A7.4 7.4 0 0 1 4.9 12c0-.9.16-1.7.44-2.5l-.01-.16-3.13-2.43-.1.05A12 12 0 0 0 0 12c0 1.9.47 3.7 1.3 5.4l4-3.9z"
      />
      <path
        fill="#EA4335"
        d="M12 4.6c2.3 0 3.9 1 4.8 1.8l3.5-3.4C18.1 1.2 15.2 0 12 0A12 12 0 0 0 1.3 6.6l4 3.9A7.1 7.1 0 0 1 12 4.6z"
      />
    </svg>
  );
}

/* Static five-star row for the wall cards. */
function StarRow() {
  return (
    <span className="flex gap-0.5" aria-label="Rated 5 out of 5">
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5" aria-hidden>
          <path
            d="M12 2l2.9 6.26 6.6.57-5 4.36 1.5 6.45L12 16.9l-6 3.74 1.5-6.45-5-4.36 6.6-.57L12 2z"
            fill="var(--mc-accent)"
          />
        </svg>
      ))}
    </span>
  );
}

/**
 * FaqRow — a hand-built accordion row.
 *
 * Deliberately NOT Radix: Radix IDs come from React useId, whose value
 * depends on tree position — any server/client structure difference
 * anywhere above (reduced-motion branches, HMR, extensions) shifts them
 * and triggers hydration mismatches. Here we use static string IDs and
 * a pure-CSS grid-rows height animation: identical output on server and
 * client, always.
 */
function FaqRow({
  q,
  a,
  index,
  open,
  onToggle,
}: {
  q: string;
  a: string;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[var(--mc-line)] last:border-b-0">
      <h3 className="flex">
        <button
          type="button"
          id={`faq-trigger-${index}`}
          aria-expanded={open}
          aria-controls={`faq-panel-${index}`}
          onClick={onToggle}
          className="flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-[15px] font-medium transition-colors outline-none hover:text-[var(--mc-accent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <span>{q}</span>
          <ChevronDown
            size={16}
            aria-hidden
            className={`mt-0.5 shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              open ? "rotate-180 text-[var(--mc-accent)]" : "text-dim"
            }`}
          />
        </button>
      </h3>
      <div
        id={`faq-panel-${index}`}
        role="region"
        aria-labelledby={`faq-trigger-${index}`}
        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 pr-8 text-sm leading-relaxed text-dim">{a}</p>
        </div>
      </div>
    </div>
  );
}

export function Reviews() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <section id="reviews" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 45% at 50% 55%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 md:px-8">
        <SectionHeading
          index="07"
          eyebrow="REAL PEOPLE. REAL EXPERIENCES."
          title={
            <>
              Verified words,{" "}
              <span className="accent-serif">straight from Google</span>.
            </>
          }
          lede="We only show reviews we can verify. Every star below is real — nothing invented, nothing bought."
          align="center"
        />

        {/* the verified review — cinematic spotlight */}
        <Reveal variant="core">
          <figure className="mc-card relative overflow-hidden p-8 text-center md:p-14">
            <span
              className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
            />
            <div className="flex justify-center gap-1.5" aria-label="5 out of 5 stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} delay={0.2 + i * 0.12} />
              ))}
            </div>
            <blockquote className="editorial-quote mx-auto mt-8 max-w-2xl text-[clamp(1.35rem,3.4vw,2.1rem)]">
              “{VERIFIED_REVIEW.quote}”
            </blockquote>
            <figcaption className="mt-8 flex flex-col items-center gap-2">
              <span className="btn-mono text-[12px] text-[var(--mc-ink)]">
                {VERIFIED_REVIEW.name}
              </span>
              <span className="text-xs text-dim">{VERIFIED_REVIEW.meta}</span>
              <span className="font-code mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
                <GoogleMark />
                Verified Google review
                <BadgeCheck size={11} className="text-[var(--mc-accent)]" />
              </span>
            </figcaption>
          </figure>
        </Reveal>

        {/* rating summary + Justdial likes */}
        <Reveal variant="rise" className="mt-14">
          <div className="grid gap-3 lg:grid-cols-[1fr_1.2fr]">
            {/* Google summary */}
            <div className="mc-card flex flex-col items-center justify-center gap-2 p-8 text-center">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-6xl leading-none tracking-tight">5.0</span>
                <span className="font-code text-[10px] uppercase tracking-[0.2em] text-faint">/ 5</span>
              </div>
              <div className="mt-1 flex justify-center gap-1.5" aria-label="5 out of 5 stars">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} delay={0.1 + i * 0.08} />
                ))}
              </div>
              <p className="mt-2 flex items-center gap-2 text-[13px] text-dim">
                <GoogleMark />
                {GOOGLE_REVIEWS.rating.toFixed(1)} from {GOOGLE_REVIEWS.total} reviews on Google
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {GOOGLE_REVIEWS.topics.map((t) => (
                  <span
                    key={t.label}
                    className="font-code rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[8.5px] uppercase tracking-[0.14em] text-faint"
                  >
                    {t.label} · {t.count}
                  </span>
                ))}
                <span className="font-code rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[8.5px] uppercase tracking-[0.14em] text-faint">
                  +{GOOGLE_REVIEWS.moreTopics} more
                </span>
              </div>
            </div>

            {/* Justdial — what users liked */}
            <a
              href={JUSTDIAL.url}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="mc-card group flex flex-col gap-3 p-8 transition-all duration-500 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
            >
              <span className="flex items-center justify-between">
                <span className="font-code flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-faint">
                  <ThumbsUp size={13} className="text-[var(--mc-accent)]" />
                  What users liked · Justdial
                </span>
                <ArrowUpRight
                  size={14}
                  className="text-faint transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--mc-accent)]"
                />
              </span>
              <ul className="flex flex-col gap-2.5">
                {JUSTDIAL.likes.map((like) => (
                  <li key={like} className="flex gap-2.5 text-[13.5px] leading-snug text-dim">
                    <BadgeCheck size={14} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
                    {like}
                  </li>
                ))}
              </ul>
              <span className="font-code mt-auto pt-2 text-[8.5px] uppercase tracking-[0.2em] text-faint">
                Source: justdial.com · listing {JUSTDIAL.listingId.slice(-12)}
              </span>
            </a>
          </div>
        </Reveal>

        {/* the review wall — every real Google review */}
        <Stagger className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3" gap={0.05}>
          {GOOGLE_REVIEW_LIST.map((r) => (
            <StaggerItem key={r.name} className="h-full">
              <figure className="mc-card flex h-full flex-col gap-3 p-6">
                <span className="flex items-center gap-3">
                  <span
                    className="font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-[15px]"
                    aria-hidden
                  >
                    {r.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13.5px] font-semibold">{r.name}</span>
                    <span className="truncate text-[11px] text-dim">
                      {r.badge ? `${r.badge} · ` : ""}{r.meta}
                    </span>
                  </span>
                </span>
                <StarRow />
                {r.text ? (
                  <blockquote className="text-[13px] leading-relaxed text-dim">“{r.text}”</blockquote>
                ) : (
                  <blockquote className="font-code text-[10px] uppercase tracking-[0.16em] text-faint">
                    Rated 5 stars on Google
                  </blockquote>
                )}
                <span className="font-code mt-auto inline-flex items-center gap-1.5 pt-1 text-[8px] uppercase tracking-[0.18em] text-faint">
                  <GoogleMark size="h-3 w-3" />
                  Google review
                  <BadgeCheck size={9} className="text-[var(--mc-accent)]" />
                </span>
              </figure>
            </StaggerItem>
          ))}
        </Stagger>

        {/* FAQ */}
        <Reveal variant="rise" className="mt-20">
          <h3 className="font-display text-center text-3xl md:text-4xl">
            Good questions. <span className="accent-serif">Straight answers.</span>
          </h3>
          <p className="mt-3 text-center text-sm text-dim">
            Everything parents and students ask us first.
          </p>
        </Reveal>

        <Stagger className="mx-auto mt-10 max-w-2xl" gap={0.07}>
          {FAQS.map((f, i) => (
            <StaggerItem key={f.q}>
              <FaqRow
                q={f.q}
                a={f.a}
                index={i}
                open={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
