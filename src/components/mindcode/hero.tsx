"use client";

/* ============================================================
   HOME HERO — "Crack the Concept. Own the Exam."
   Split stage: message on the left, the Mind Core cube on the
   right, learning pillars + proof bar beneath, all floating in
   a starfield above a planet horizon. Deterministic star
   positions (seeded LCG, module scope) — hydration-safe.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  ClipboardList,
  Download,
  GraduationCap,
  Infinity as InfinityIcon,
  Layers,
  Play,
  Sparkles,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { HeroCube } from "./hero-cube";
import { Magnetic } from "./magnetic";
import { Moon, ShootingStars } from "./night-sky";
import { useWarpNavigate } from "./store";
import { APP_URL } from "./data";

/* ---------------- deterministic starfield ---------------- */

function seededStars(count: number, seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  return Array.from({ length: count }, () => ({
    x: rnd() * 100,
    y: rnd() * 100,
    o: 0.12 + rnd() * 0.5,
    big: rnd() > 0.88,
  }));
}

const STARS = seededStars(110, 20260207);

function Starfield() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {STARS.map((st, i) => (
        <span
          key={i}
          className={st.big ? "mc-twinkle absolute rounded-full bg-[#bfdbfe]" : "absolute rounded-full bg-[#93c5fd]"}
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.big ? 2.5 : 1.5,
            height: st.big ? 2.5 : 1.5,
            opacity: st.o,
            boxShadow: st.big ? "0 0 8px rgba(147,197,253,0.9)" : undefined,
            animationDelay: st.big ? `${(i % 7) * 0.55}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

/* ---------------- entrance helpers ---------------- */

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
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function MaskLine({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className="block"
        initial={{ y: "112%" }}
        animate={{ y: 0 }}
        transition={{ duration: 1.0, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/* ---------------- content data ---------------- */

const PILLARS = [
  {
    glyph: Zap,
    title: "Concepts",
    line: "Learn faster, remember longer",
    href: "/classes",
    featured: true,
  },
  { glyph: Target, title: "Practice", line: "From basic to board-level", href: "/code", featured: false },
  { glyph: ClipboardList, title: "Tests", line: "Real exam experience", href: "/tests", featured: false },
  { glyph: Layers, title: "Revision", line: "One place, everything covered", href: "/resources", featured: false },
];

const PROOF = [
  { glyph: GraduationCap, value: "1.2L+", label: "Learners" },
  // [V] owner-reported Play Store installs, Nov 2026 — added on request
  { glyph: Download, value: "500+", label: "App Downloads" },
  { glyph: Trophy, value: "98%", label: "Concept Clarity" },
  { glyph: BarChart3, value: "10K+", label: "Practice Questions" },
  { glyph: InfinityIcon, value: "100% Free", label: "Core Resources" },
];

/* ---------------- trust row bits ---------------- */

function AvatarStack() {
  return (
    <span className="flex -space-x-2" aria-hidden>
      {[
        "linear-gradient(140deg,#60a5fa,#1d4ed8)",
        "linear-gradient(140deg,#34d399,#0d8a5f)",
        "linear-gradient(140deg,#f0abfc,#7452d9)",
      ].map((bg, i) => (
        <span
          key={i}
          className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0b2345]"
          style={{ background: bg }}
        >
          <User size={12} className="text-white/90" />
        </span>
      ))}
    </span>
  );
}

/* ---------------- the hero ---------------- */

export function Hero() {
  const warpTo = useWarpNavigate();

  return (
    <section
      id="top"
      data-cursor="core"
      className="mc-hero-stage relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 70% 44% at 72% 30%, rgba(59,130,246,0.14), transparent 66%), radial-gradient(ellipse 90% 60% at 50% 108%, rgba(29,78,216,0.16), transparent 60%), var(--mc-bg)",
      }}
    >
      {/* atmosphere: stars + meteors + moon + horizon */}
      <Starfield />
      <ShootingStars />
      <Moon className="right-[4%] top-[5%] h-20 w-20 sm:h-24 sm:w-24 lg:right-[6%] lg:top-[6%] lg:h-28 lg:w-28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[42vh] overflow-hidden" aria-hidden>
        <div
          className="absolute left-1/2 top-[26%] h-[190vw] w-[190vw] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 10%, rgba(96,165,250,0.32) 0%, rgba(29,78,216,0.14) 9%, rgba(9,28,54,0.94) 22%, #071a33 34%)",
            boxShadow: "0 -14px 110px rgba(96,165,250,0.38), inset 0 2px 0 rgba(191,219,254,0.4)",
          }}
        />
      </div>
      {/* soft nebulas */}
      <div
        className="pointer-events-none absolute -left-40 top-24 h-[420px] w-[420px] rounded-full opacity-70"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.16), transparent 65%)", filter: "blur(30px)" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-5 md:px-8">
        {/* ---------- split stage ---------- */}
        <div className="grid gap-6 pb-2 pt-28 sm:pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-4 lg:pt-32">
          {/* left — the message */}
          <div className="max-w-2xl">
            <Rise delay={0.12}>
              <span className="mc-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] text-dim">
                <Sparkles size={13} className="text-[var(--mc-accent-2)]" aria-hidden />
                A Learning Universe
                <span className="text-faint" aria-hidden>·</span>
                <span className="text-[var(--mc-ink)]">Classes 6 – 10</span>
              </span>
            </Rise>

            <h1 className="mt-6 text-[clamp(2.6rem,4.4vw,4.05rem)] font-bold leading-[1.04] tracking-[-0.03em]">
              <MaskLine delay={0.28}>Crack the Concept.</MaskLine>
              <MaskLine delay={0.42}>
                <span className="accent-serif pr-1">Own the</span>{" "}
                <span className="relative inline-block">
                  <span
                    className="accent-serif"
                    style={{
                      background: "linear-gradient(100deg,#93c5fd 8%,#60a5fa 55%,#3b82f6 96%)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                      filter: "drop-shadow(0 0 20px rgba(96,165,250,0.45))",
                    }}
                  >
                    Exam.
                  </span>
                  {/* hand-drawn underline */}
                  <svg
                    viewBox="0 0 190 12"
                    className="absolute -bottom-1.5 left-1 w-[104%]"
                    aria-hidden
                  >
                    <motion.path
                      d="M4 9 C 52 3, 138 2, 186 7"
                      fill="none"
                      stroke="#60a5fa"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.7, delay: 1.15, ease: "easeOut" }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(96,165,250,0.8))" }}
                    />
                  </svg>
                </span>
              </MaskLine>
            </h1>

            <Rise delay={0.7}>
              <p className="mt-6 max-w-lg text-pretty text-[15px] leading-relaxed text-dim md:text-[16.5px]">
                Clear notes. Real practice. Expert learning. Everything you need to move
                from confused to confident — free, forever.
              </p>
            </Rise>

            <Rise delay={0.85} className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Magnetic strength={0.2}>
                  <button
                    onClick={() => warpTo("/classes")}
                    className="group flex items-center gap-2.5 rounded-full bg-[var(--mc-cta-bg)] py-3.5 pl-4 pr-6 text-[13.5px] font-semibold text-[var(--mc-cta-fg)] shadow-[0_0_44px_-8px_var(--mc-glow)] transition-transform duration-300 hover:scale-[1.03]"
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in srgb, var(--mc-accent) 16%, transparent)" }}
                      aria-hidden
                    >
                      <Play size={12} className="ml-0.5 fill-[var(--mc-accent)] text-[var(--mc-accent)]" />
                    </span>
                    Explore The Mind Code
                    <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                </Magnetic>

                <Magnetic strength={0.14}>
                  <Link
                    href="/resources"
                    className="mc-glass group flex items-center gap-2.5 rounded-full px-6 py-3.5 text-[13.5px] font-semibold text-[var(--mc-ink)] transition-all duration-300 hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                  >
                    <BookOpen size={16} aria-hidden />
                    Explore Free Resources
                  </Link>
                </Magnetic>
              </div>
            </Rise>

            <Rise delay={1.0}>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
                <span className="flex items-center gap-2.5">
                  <AvatarStack />
                  <span className="text-[13px] text-dim">
                    <span className="font-semibold text-[var(--mc-ink)]">1.2L+ learners</span> already with us
                  </span>
                </span>
                <span className="hidden h-5 w-px bg-[var(--mc-line)] sm:block" aria-hidden />
                <span className="flex items-center gap-2 text-[13px] text-dim">
                  <Award size={15} className="text-[var(--mc-accent-2)]" aria-hidden />
                  Trusted by students across India
                </span>
                {/* [V] owner-reported Play Store installs, Nov 2026 — added on request */}
                <span className="hidden h-5 w-px bg-[var(--mc-line)] sm:block" aria-hidden />
                <a
                  href={APP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="interactive"
                  className="group flex items-center gap-2 text-[13px] text-dim transition-colors duration-300 hover:text-[var(--mc-accent)]"
                >
                  <Download
                    size={15}
                    className="text-[var(--mc-accent-2)] transition-transform duration-300 group-hover:translate-y-0.5"
                    aria-hidden
                  />
                  <span className="font-semibold text-[var(--mc-ink)]">500+</span> app downloads
                </a>
              </div>
            </Rise>
          </div>

          {/* right — the Mind Core cube */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <HeroCube />
          </motion.div>
        </div>

        {/* ---------- learning pillars ---------- */}
        <div className="grid grid-cols-2 gap-3 pt-7 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={p.href}
                data-cursor="interactive"
                className={
                  p.featured
                    ? "group flex h-full items-center gap-3.5 rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5 md:p-5"
                    : "mc-glass group flex h-full items-center gap-3.5 rounded-2xl p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)] md:p-5"
                }
                style={
                  p.featured
                    ? {
                        background:
                          "linear-gradient(135deg, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0.05) 55%, rgba(12,36,64,0.7) 100%)",
                        border: "1px solid color-mix(in srgb, var(--mc-accent) 55%, transparent)",
                        boxShadow: "0 0 34px -6px var(--mc-glow), inset 0 1px 0 rgba(191,219,254,0.18)",
                      }
                    : undefined
                }
              >
                <span
                  className={
                    p.featured
                      ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                      : "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-[var(--mc-accent-2)]"
                  }
                  style={
                    p.featured
                      ? {
                          background: "linear-gradient(140deg,#60a5fa,#2563eb)",
                          boxShadow: "0 8px 22px -6px rgba(59,130,246,0.7)",
                        }
                      : undefined
                  }
                  aria-hidden
                >
                  <p.glyph size={17} strokeWidth={2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold leading-tight">{p.title}</span>
                  <span className="mt-0.5 block truncate text-[12px] leading-snug text-dim">{p.line}</span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ---------- proof bar ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.5, ease: [0.22, 1, 0.36, 1] }}
          className="mc-glass mx-auto mt-3 grid max-w-5xl grid-cols-2 gap-y-4 rounded-2xl px-2 py-3.5 sm:px-4 lg:grid-cols-5"
        >
          {PROOF.map((s, i) => (
            <div
              key={s.label}
              className={
                "flex items-center justify-center gap-3 px-2 " +
                (i > 0 ? "lg:border-l lg:border-[var(--mc-line-soft)] " : "") +
                (i === PROOF.length - 1 ? "col-span-2 lg:col-span-1" : "")
              }
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card-2)] text-[var(--mc-accent-2)]"
                aria-hidden
              >
                <s.glyph size={16} strokeWidth={1.9} />
              </span>
              <span>
                <span className="block text-[17px] font-bold leading-tight">{s.value}</span>
                <span className="block text-[11.5px] leading-tight text-dim">{s.label}</span>
              </span>
            </div>
          ))}
        </motion.div>

        {/* ---------- scroll cue ---------- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.9, duration: 0.9 }}
          className="flex flex-col items-center gap-2.5 pb-6 pt-5"
        >
          <span
            className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-[var(--mc-ghost)] p-1.5"
            aria-hidden
          >
            <span className="mc-scroll-dot h-2 w-1 rounded-full bg-[var(--mc-accent-2)]" />
          </span>
          <span
            className="text-[11.5px] tracking-wide"
            style={{ color: "#cdddf5", textShadow: "0 1px 10px rgba(7,26,51,0.9)" }}
          >
            Scroll to Explore
          </span>
        </motion.div>
      </div>

      {/* fade into next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16"
        style={{ background: "linear-gradient(to top, var(--mc-bg), transparent)" }}
        aria-hidden
      />
    </section>
  );
}
