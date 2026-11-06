"use client";

/* ============================================================
   /about/founder — THE FOUNDER, in full.

   One page, everything verified:
   hero (text left · 3D portrait right) → quick facts → philosophy
   → story + timeline → the book (3D object) → the universe he
   built → verified ways to connect.

   Hydration-safe by construction: no useId, no browser APIs during
   render, no tree branching — useReducedMotion guards handlers only.
   ============================================================ */

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  ExternalLink,
  Instagram,
  Linkedin,
  Link2,
  Play,
  Radio,
  Youtube,
} from "lucide-react";
import {
  BOOK,
  BOOK_URL,
  FOUNDER,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  LINKTREE_URL,
  MIND_CUTS,
  PODCAST,
  PODCAST_EPISODES,
  STATS,
  TUTORS,
  WORLDS,
  YOUTUBE_CHANNEL_URL,
} from "./data";
import { FounderPortrait } from "./founder";
import { BookObject } from "./book";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";

/* Rise — masked line entrance, same grammar as the homepage hero. */
function Rise({
  children,
  delay,
  className,
}: {
  children: React.ReactNode;
  delay: number;
  className?: string;
}) {
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span
        className={`inline-block ${className ?? ""}`}
        initial={{ y: "112%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Hero — text LEFT, the 3D portrait RIGHT (photo first on phones).    */
/* ------------------------------------------------------------------ */

const HERO_GLASS: React.CSSProperties = {
  background:
    "radial-gradient(ellipse 55% 42% at 18% 22%, var(--mc-accent-soft), transparent 66%), radial-gradient(ellipse 80% 60% at 72% 38%, var(--mc-bg-2), transparent 78%)",
};

function FounderHero() {
  return (
    <section className="relative overflow-hidden" style={HERO_GLASS}>
      <div className="relative mx-auto grid max-w-6xl items-center gap-4 px-5 pb-20 pt-28 md:px-8 md:pt-40 lg:grid-cols-[1.15fr_auto] lg:gap-10">
        {/* portrait — visually FIRST on phones, RIGHT on desktop */}
        <Reveal variant="core" className="order-1 flex justify-center lg:order-2 lg:justify-end">
          <FounderPortrait />
        </Reveal>

        {/* text — LEFT on desktop */}
        <div className="order-2 lg:order-1">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="eyebrow flex items-center gap-3"
          >
            <span className="inline-block h-px w-8 bg-[var(--mc-accent)]" aria-hidden />
            THE FOUNDER · SINCE {FOUNDER.since.toUpperCase()}
          </motion.p>

          <h1 className="mt-6 text-[clamp(2.6rem,7.4vw,5.4rem)] font-semibold leading-[0.99] tracking-[-0.035em]">
            <Rise delay={0.22}>Crack the concept.</Rise>
            <br />
            <Rise delay={0.36}>
              <span className="accent-serif hero-editorial pr-[0.06em]">Own&nbsp;the&nbsp;exam.</span>
            </Rise>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-7 flex flex-wrap items-baseline gap-x-3"
          >
            <span className="font-display text-2xl md:text-[1.7rem]">{FOUNDER.name}</span>
            <span className="text-[13px] text-dim">{FOUNDER.role}</span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.58 }}
            className="mt-4 max-w-xl text-[15px] leading-relaxed text-dim"
          >
            Founder-teacher for Mathematics and Science, Classes 6–10. He built The
            Mind Code around one promise — a student who understands the concept
            never fears the exam. Based in {FOUNDER.location}.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.66 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mono group flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[11px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
            >
              <Linkedin size={14} />
              FOLLOW ON LINKEDIN
              <ArrowUpRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
            <a
              href={BOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mono flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-6 py-3 text-[11px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              <BookOpen size={14} />
              READ HIS BOOK
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.8 }}
            className="mt-8 flex flex-wrap gap-2"
          >
            <li className="font-code inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
              <BadgeCheck size={11} className="text-[var(--mc-accent)]" />
              LinkedIn · verified profile
            </li>
            <li className="font-code inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
              <BadgeCheck size={11} className="text-[var(--mc-accent)]" />
              World School Summit · featured awardee
            </li>
            <li className="font-code inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
              <BadgeCheck size={11} className="text-[var(--mc-accent)]" />
              Author · {BOOK.title}
            </li>
          </motion.ul>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Quick facts — the card the visitor can quote.                       */
/* ------------------------------------------------------------------ */

function QuickFacts() {
  const tutor = TUTORS[0];
  const facts = [
    { k: "FOUNDED", v: FOUNDER.since.replace("August ", "Aug "), note: "The Mind Code" },
    { k: "BASED IN", v: "Ghaziabad, IN", note: FOUNDER.location },
    { k: "TEACHES", v: "Maths · Science", note: `Classes ${tutor.classes[0]}–${tutor.classes[tutor.classes.length - 1]}` },
    { k: "MODES", v: tutor.modes.length + " formats", note: tutor.modes.join(" · ") },
  ];
  return (
    <section aria-label="Founder quick facts" className="relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <Stagger className="grid gap-px overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-line)] sm:grid-cols-2 lg:grid-cols-4" gap={0.06}>
          {facts.map((f) => (
            <StaggerItem key={f.k} className="h-full">
              <div className="flex h-full flex-col bg-[var(--mc-card)] p-6">
                <span className="font-code text-[9px] uppercase tracking-[0.24em] text-faint">{f.k}</span>
                <span className="font-display mt-2.5 text-xl leading-snug">{f.v}</span>
                <span className="mt-1 text-[12px] text-dim">{f.note}</span>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Philosophy — the belief, in his own words.                          */
/* ------------------------------------------------------------------ */

function Philosophy() {
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 40% at 85% 30%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="01"
          eyebrow="THE PHILOSOPHY"
          title={
            <>
              One belief,{" "}
              <span className="accent-serif">said out loud.</span>
            </>
          }
        />
        <Reveal variant="editorial">
          <figure className="mc-card relative max-w-4xl overflow-hidden p-8 md:p-12">
            <span
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
              aria-hidden
            />
            <blockquote className="editorial-quote text-[clamp(1.3rem,2.9vw,2rem)] leading-snug">
              “{FOUNDER.philosophy}”
            </blockquote>
            <figcaption className="font-code mt-7 text-[10px] uppercase tracking-[0.22em] text-faint">
              — {FOUNDER.name}, {FOUNDER.role}
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Story + timeline — four beats, no invented colour.                  */
/* ------------------------------------------------------------------ */

function Story() {
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="02"
          eyebrow="THE STORY"
          title={
            <>
              From one teacher to a{" "}
              <span className="accent-serif">learning universe.</span>
            </>
          }
        />

        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          {/* narrative — every fact traceable to the timeline */}
          <Reveal variant="editorial">
            <div className="flex max-w-xl flex-col gap-5 text-[15px] leading-relaxed text-dim">
              <p>
                In {FOUNDER.since}, {FOUNDER.name} started The Mind Code in{" "}
                {FOUNDER.location} — not as a coaching brand, but as a learning home
                built around a single method: <strong className="font-semibold text-[var(--mc-ink)]">understand
                first, memorise never</strong>. A founder-teacher for Mathematics and
                Science across Classes 6–10, he teaches the way he built this site:
                start from where the student actually is, rebuild the concept until it
                clicks, close with practice that makes it stick.
              </p>
              <p>
                The work travelled. He was recognised as a featured awardee at the
                34th World School Summit for contributions to learning. And in{" "}
                {BOOK.published}, he carried the classroom into print —{" "}
                <em className="text-[var(--mc-ink)] not-italic underline decoration-[var(--mc-accent)] decoration-1 underline-offset-4">
                  {BOOK.title}
                </em>
                , published by {BOOK.publisher} — on how thought, intention and mental
                frequency shape what a person becomes.
              </p>
              <p>
                Today The Mind Code is what the students needed all along:{" "}
                {STATS[0].value} free resources across {STATS[1].value.toLowerCase()}{" "}
                class worlds, a test lab that practises without pressure, private
                tuition for those who want a mentor, and CODE — an AI companion that
                never lets a doubt sleep overnight.
              </p>
            </div>
          </Reveal>

          {/* timeline */}
          <Stagger className="relative flex flex-col" gap={0.09}>
            <span className="absolute bottom-2 left-[15px] top-3 w-px bg-[var(--mc-line)]" aria-hidden />
            {FOUNDER.timeline.map((t, i) => (
              <StaggerItem key={t.title}>
                <div className="relative flex gap-5 pb-9 last:pb-0">
                  <span className="font-code relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--mc-accent)] bg-[var(--mc-bg)] text-[9px] font-bold text-[var(--mc-accent)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="font-code text-[9px] uppercase tracking-[0.22em] text-faint">{t.year}</div>
                    <div className="font-display mt-1.5 text-lg leading-snug">{t.title}</div>
                    <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-dim">{t.desc}</p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The book — text left, the 3D object right.                          */
/* ------------------------------------------------------------------ */

function FounderBook() {
  const meta = [
    { k: "Publisher", v: BOOK.publisher },
    { k: "Pages", v: String(BOOK.pages) },
    { k: "Format", v: BOOK.format },
    { k: "Published", v: BOOK.published },
  ];
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 42% 38% at 70% 45%, var(--mc-accent-soft), transparent 64%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="03"
          eyebrow="THE BOOK"
          title={
            <>
              The method,{" "}
              <span className="accent-serif">between covers.</span>
            </>
          }
          lede={BOOK.tagline}
        />

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto] lg:gap-16">
          <div>
            <Reveal variant="editorial">
              <h3 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] leading-tight">
                {BOOK.title}
              </h3>
              <p className="font-code mt-2 text-[10px] uppercase tracking-[0.22em] text-faint">
                {BOOK.author} · {BOOK.publisher}
              </p>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-dim">{BOOK.blurb}</p>
            </Reveal>

            <Reveal variant="rise" delay={0.1}>
              <dl className="mt-8 grid max-w-md grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-line)]">
                {meta.map((m) => (
                  <div key={m.k} className="bg-[var(--mc-card)] px-5 py-4">
                    <dt className="font-code text-[8.5px] uppercase tracking-[0.22em] text-faint">{m.k}</dt>
                    <dd className="mt-1 text-[14px] font-semibold">{m.v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal variant="rise" delay={0.16}>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-mono group mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[11px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
              >
                VIEW ON AMAZON
                <ExternalLink
                  size={12}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
            </Reveal>
          </div>

          <Reveal variant="core" className="flex justify-center lg:justify-end">
            <BookObject />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* The podcast — THE MIND CODE UNIVERSE, on air. Featured teaser        */
/* card left · episode rows right · daily cuts strip below.             */
/* All titles, links and stats are the creator's own published data.    */
/* ------------------------------------------------------------------ */

/* Five audio bars — silent when the visitor prefers reduced motion. */
function Equalizer() {
  const reduce = useReducedMotion();
  const bars = [0.55, 0.95, 0.7, 1, 0.8];
  return (
    <span className="flex h-5 items-end gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-[3px] origin-bottom rounded-full bg-[var(--mc-accent)]"
          style={{ height: `${h * 100}%` }}
          animate={reduce ? undefined : { scaleY: [1, 0.3, 1] }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 0.9 + i * 0.14,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.09,
                }
          }
        />
      ))}
    </span>
  );
}

function Podcast() {
  const episodes = PODCAST_EPISODES.filter((e) => e.index !== "EP.00");
  const teaser = PODCAST_EPISODES[0];
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 46% 40% at 82% 24%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="04"
          eyebrow="ON AIR · THE PODCAST"
          title={
            <>
              Mind science,{" "}
              <span className="accent-serif">out loud.</span>
            </>
          }
          lede="He hosts The Mind Code Universe — quantum physics and mind science, one episode at a time — and cuts the daily versions for Instagram."
        />

        <div className="grid gap-3 lg:grid-cols-[1.15fr_1fr]">
          {/* featured — the series teaser */}
          <Reveal variant="editorial">
            <a
              href={teaser.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="interactive"
              className="mc-card group relative flex h-full flex-col overflow-hidden p-7 transition-all duration-500 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] md:p-9"
            >
              <span
                className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-25"
                style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
                aria-hidden
              />
              <span className="flex items-center justify-between gap-4">
                <span className="font-code inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-faint">
                  <Equalizer />
                  {teaser.index} · {PODCAST.handle}
                </span>
                <span className="font-code rounded-full border border-[var(--mc-line)] px-3 py-1 text-[8.5px] uppercase tracking-[0.18em] text-faint">
                  {teaser.tag}
                </span>
              </span>
              <h3 className="font-display mt-7 text-[clamp(1.35rem,2.6vw,1.85rem)] leading-snug">
                {teaser.title}
              </h3>
              <p className="mt-3 max-w-lg text-[14px] leading-relaxed text-dim">{teaser.blurb}</p>
              <span className="mt-auto flex flex-wrap items-center gap-4 pt-8">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--mc-cta-bg)] text-[var(--mc-cta-fg)] transition-transform duration-500 group-hover:scale-110">
                  <Play size={17} className="ml-0.5" fill="currentColor" />
                </span>
                <span className="flex flex-col">
                  <span className="btn-mono text-[10px] text-[var(--mc-cta-fg)]">PLAY THE TEASER</span>
                  <span className="font-code mt-1 text-[8.5px] uppercase tracking-[0.2em] text-faint">
                    {PODCAST.subscribers} subscribers · {PODCAST.videos} videos · YouTube
                  </span>
                </span>
              </span>
            </a>
          </Reveal>

          {/* episode rows */}
          <Stagger className="flex flex-col gap-3" gap={0.07}>
            {episodes.map((ep) => (
              <StaggerItem key={ep.index} className="flex-1">
                <a
                  href={ep.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="interactive"
                  className="mc-card group flex h-full items-start gap-4 p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
                >
                  <span className="font-code mt-0.5 shrink-0 text-[9px] uppercase tracking-[0.2em] text-[var(--mc-accent)]">
                    {ep.index}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[14px] font-semibold leading-snug">{ep.title}</span>
                    <span className="mt-1 block text-[12.5px] leading-snug text-dim">{ep.blurb}</span>
                    <span className="font-code mt-2 block text-[8px] uppercase tracking-[0.2em] text-faint">
                      {ep.tag}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="mt-1 shrink-0 text-faint opacity-0 transition-all duration-300 group-hover:opacity-100"
                  />
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        {/* daily cuts — Instagram strip */}
        <Reveal variant="rise" delay={0.1}>
          <div className="mt-10">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="font-code flex items-center gap-2.5 text-[10px] uppercase tracking-[0.22em] text-faint">
                <Radio size={13} className="text-[var(--mc-accent)]" />
                Daily cuts · {PODCAST.instagramBio}
              </p>
              <p className="font-code text-[10px] uppercase tracking-[0.22em] text-faint">
                {PODCAST.instagramFollowers} followers · {PODCAST.instagramPosts} posts
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MIND_CUTS.map((cut) => (
                <a
                  key={cut.index}
                  href={cut.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="interactive"
                  className="mc-card group flex flex-col gap-1.5 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
                >
                  <span className="flex items-center justify-between">
                    <span className="font-code text-[8.5px] uppercase tracking-[0.2em] text-[var(--mc-accent)]">
                      {cut.index}
                    </span>
                    <Instagram
                      size={13}
                      className="text-faint transition-colors duration-300 group-hover:text-[var(--mc-accent)]"
                    />
                  </span>
                  <span className="mt-1 text-[13.5px] font-semibold leading-snug">{cut.title}</span>
                  <span className="text-[12px] leading-snug text-dim">{cut.blurb}</span>
                </a>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal variant="rise" delay={0.14}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mono group inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[11px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
            >
              <Youtube size={14} />
              LISTEN ON YOUTUBE — {PODCAST.handle}
              <ArrowUpRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-6 py-3 text-[11px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              <Instagram size={14} />
              FOLLOW THE DAILY CUTS
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* What he built — the universe today, every world one tap away.       */
/* ------------------------------------------------------------------ */

function Universe() {
  return (
    <section className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="05"
          eyebrow="WHAT HE BUILT"
          title={
            <>
              The universe{" "}
              <span className="accent-serif">so far.</span>
            </>
          }
          lede={`${STATS[0].value} free resources · ${STATS[1].value.toLowerCase()} class worlds · ${STATS[2].value} syllabus-aligned. Every door below is open.`}
        />
        <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {WORLDS.map((w) => (
            <StaggerItem key={w.href}>
              <Link
                href={w.href}
                data-cursor="interactive"
                className="mc-card group flex h-full flex-col gap-2 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
              >
                <span className="flex items-center justify-between">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-base"
                    aria-hidden
                  >
                    {w.glyph}
                  </span>
                  <ArrowUpRight size={14} className="text-faint opacity-0 transition-all duration-300 group-hover:opacity-100" />
                </span>
                <span className="mt-2 text-[14.5px] font-semibold leading-tight">{w.label}</span>
                <span className="font-code text-[8.5px] uppercase tracking-[0.2em] text-faint">{w.job}</span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Connect — verified links only, then the hand-raiser.                */
/* ------------------------------------------------------------------ */

const CONNECT = [
  {
    href: LINKEDIN_URL,
    icon: Linkedin,
    label: "LinkedIn",
    note: "Professional profile — verified",
    external: true,
  },
  {
    href: INSTAGRAM_URL,
    icon: Instagram,
    label: "Instagram",
    note: "The Mind Code universe, daily",
    external: true,
  },
  {
    href: LINKTREE_URL,
    icon: Link2,
    label: "Linktree",
    note: "Everything, one directory",
    external: true,
  },
] as const;

function Connect() {
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 55%, var(--mc-accent-soft), transparent 64%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="06"
          eyebrow="CONNECT"
          title={
            <>
              Find him{" "}
              <span className="accent-serif">where he actually is.</span>
            </>
          }
          lede="No ghost profiles, no borrowed trust — every link below is his own."
          align="center"
        />

        <Stagger className="mx-auto mt-4 grid max-w-3xl gap-3 sm:grid-cols-3" gap={0.07}>
          {CONNECT.map((c) => (
            <StaggerItem key={c.label}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="interactive"
                className="mc-card group flex h-full flex-col items-center gap-2 p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-[var(--mc-accent)]">
                  <c.icon size={18} />
                </span>
                <span className="mt-1 text-[14.5px] font-semibold">{c.label}</span>
                <span className="text-[12px] leading-snug text-dim">{c.note}</span>
                <span className="font-code mt-1 inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[0.2em] text-faint">
                  <BadgeCheck size={10} className="text-[var(--mc-accent)]" />
                  Verified
                </span>
              </a>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal variant="rise" delay={0.12}>
          <div className="mx-auto mt-12 max-w-3xl">
            <Link
              href="/tuition"
              data-cursor="interactive"
              className="mc-card group flex flex-col items-center gap-4 p-8 text-center transition-all duration-500 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] md:flex-row md:text-left"
            >
              <span className="font-display flex-1 text-[clamp(1.2rem,2.6vw,1.7rem)] leading-snug">
                Want the founder himself teaching your child?
                <span className="mt-1 block text-[13px] font-normal text-dim">
                  Private learning with Pankaj — limited seats each term.
                </span>
              </span>
              <span className="btn-mono flex shrink-0 items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[11px] text-[var(--mc-cta-fg)] transition-transform group-hover:scale-[1.03]">
                BOOK A DEMO
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

export function FounderPage() {
  return (
    <main className="flex-1">
      <FounderHero />
      <div className="h-2" aria-hidden />
      <QuickFacts />
      <Philosophy />
      <Story />
      <FounderBook />
      <Podcast />
      <Universe />
      <Connect />
    </main>
  );
}
