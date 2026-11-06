"use client";

import { useRef, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { BOOK, BOOK_URL } from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal } from "./reveal";

/* ============================================================
   THE BOOK — a real photograph, staged as a physical 3D object.

   The actual cover of "Unlock the Infinite Code" (verified,
   unretouched) is mounted on a preserve-3d body with a spine,
   a paper block and a cast shadow that swings with the tilt.
   Pointer-driven tilt + glass glare, resting in a 3/4 stance.

   Hydration-safe by construction:
   - no useId, no browser APIs during render, no tree branching
     (useReducedMotion only guards event handlers — the tree is
     identical on server and client).
   ============================================================ */

const TILT = { stiffness: 140, damping: 16, mass: 0.6 };

/* Exported for the /about/founder page — the book as a physical 3D object. */
export function BookObject() {
  const wrapRef = useRef<HTMLDivElement>(null);

  /* pointer offsets in [-0.5, 0.5] — written only from events */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, TILT);
  const sy = useSpring(py, TILT);

  /* resting pose echoes the hero's 3/4 stance; pointer leans it around */
  const rotateY = useTransform(sx, (v) => v * 20 - 18);
  const rotateX = useTransform(sy, (v) => -v * 14 + 4);

  /* depth parallax — cast shadow swings away from the lean */
  const shadowX = useTransform(sx, (v) => v * -34);
  const shadowR = useTransform(sx, (v) => v * -4);
  const liftZ = useTransform(sx, [0, 0.5], [0, 14]);

  /* glass glare follows the pointer across the cover */
  const glareX = useTransform(sx, (v) => (v + 0.5) * 100);
  const glareY = useTransform(sy, (v) => (v + 0.5) * 100);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.16), transparent 52%)`;

  /* value-only check — never branches the rendered tree */
  const reduced = useReducedMotion();

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType === "touch") return;
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.set(Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5)));
    py.set(Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5)));
  }

  function onPointerLeave() {
    px.set(0);
    py.set(0);
  }

  return (
    <div
      ref={wrapRef}
      data-cursor="interactive"
      className="mc-float relative mx-auto select-none py-6"
      style={{ perspective: "1300px" }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* ambient room glow behind the object (doesn't tilt) */}
      <div
        aria-hidden
        className="absolute inset-x-6 bottom-8 top-10 rounded-full opacity-60 blur-3xl"
        style={{ background: "var(--mc-accent-soft)" }}
      />

      <motion.div
        className="relative h-[420px] w-[290px] md:h-[470px] md:w-[325px]"
        style={{ rotateX, rotateY, z: liftZ, transformStyle: "preserve-3d" }}
      >
        {/* L0 · cast shadow — swings opposite the tilt, grounds the book */}
        <motion.div
          aria-hidden
          className="absolute -bottom-7 left-1/2 h-9 w-[86%] -translate-x-1/2 rounded-[50%] blur-xl"
          style={{ x: shadowX, rotate: shadowR, background: "rgba(0,0,0,0.42)" }}
        />

        {/* L1 · paper block (pages) behind the cover */}
        <div
          aria-hidden
          className="absolute inset-0 rounded-r-lg rounded-l-[3px]"
          style={{
            transform: "translateZ(-20px) translateX(9px)",
            background: "linear-gradient(to right, #efe9dc, #d9d2c2)",
            boxShadow: "34px 44px 80px -22px rgba(0,0,0,0.55)",
          }}
        />

        {/* L2 · spine — hinged off the left edge */}
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-[28px] rounded-l-[3px]"
          style={{
            transform: "rotateY(-90deg) translateZ(14px)",
            transformOrigin: "left center",
            background:
              "linear-gradient(to right, #04101f 0%, #0a2038 55%, #14304f 100%)",
          }}
        >
          {/* spine imprint */}
          <span
            className="absolute left-1/2 top-1/2 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
            style={{
              height: "72%",
              background: "linear-gradient(to bottom, transparent, var(--mc-accent), transparent)",
            }}
          />
        </div>

        {/* L3 · THE COVER — the real photograph */}
        <div
          className="relative h-full w-full overflow-hidden rounded-r-lg rounded-l-[3px] border border-white/10"
          style={{
            transform: "translateZ(0)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset -14px 0 26px -18px rgba(0,0,0,0.7)",
            background: "#0a1412",
          }}
        >
          <motion.img
            src="/book-cover.jpg"
            alt="Unlock the Infinite Code — book by Pankaj Malik. A lone figure stands in a glowing ring at the centre of a maze."
            width={382}
            height={552}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />

          {/* glass glare — tracks the pointer */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: glare }}
          />

          {/* periodic sheen sweep */}
          <div
            aria-hidden
            className="mc-sheen pointer-events-none absolute inset-y-0 w-1/3"
            style={{
              background:
                "linear-gradient(105deg, transparent, rgba(255,255,255,0.13), transparent)",
            }}
          />
        </div>

        {/* L4 · floating index chip in front of the glass (over dark maze, clear of the title) */}
        <div
          aria-hidden
          className="absolute -right-5 bottom-28 md:-right-9"
          style={{ transform: "translateZ(44px)" }}
        >
          <span className="font-code inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] bg-[var(--mc-card)] px-3.5 py-2 text-[9px] uppercase tracking-[0.2em] text-dim shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            <BookOpen size={11} className="text-[var(--mc-accent)]" />
            {BOOK.pages} pages · {BOOK.format}
          </span>
        </div>

        {/* L5 · floating author chip, mid left over the dark maze, deeper in space */}
        <div
          aria-hidden
          className="absolute -left-5 top-[36%] md:-left-9"
          style={{ transform: "translateZ(30px)" }}
        >
          <span className="btn-mono inline-flex items-center rounded-full border border-[var(--mc-line)] bg-[var(--mc-card)] px-3.5 py-2 text-[10px] text-[var(--mc-ink)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.5)]">
            Pankaj Malik
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function BookSection() {
  return (
    <section id="book" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 80% 50%, var(--mc-accent-soft), transparent 62%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="09"
          eyebrow="FROM THE FOUNDER'S DESK"
          title={
            <>
              Unlock the <span className="accent-serif">Infinite Code</span>
            </>
          }
        />

        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal variant="core">
            <BookObject />
          </Reveal>

          <div>
            <Reveal variant="editorial">
              <p className="font-code flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-faint">
                <BookOpen size={13} className="text-[var(--mc-accent)]" />
                {BOOK.format} · {BOOK.publisher}
              </p>
              <h3 className="font-display mt-4 text-3xl leading-tight md:text-4xl">
                {BOOK.tagline}
              </h3>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-dim">
                {BOOK.blurb}
              </p>
            </Reveal>

            <Reveal variant="rise" delay={0.12}>
              <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-line)] sm:grid-cols-4">
                {[
                  ["Author", BOOK.author],
                  ["Pages", `${BOOK.pages}`],
                  ["Format", BOOK.format],
                  ["Published", BOOK.published],
                ].map(([k, v]) => (
                  <div key={k} className="bg-[var(--mc-card)] p-4">
                    <dt className="font-code text-[8.5px] uppercase tracking-[0.22em] text-faint">{k}</dt>
                    <dd className="mt-2 text-[13px] font-semibold leading-tight">{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal variant="rise" delay={0.2}>
              <a
                href={BOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-mono group mt-9 inline-flex items-center gap-2.5 rounded-full bg-[var(--mc-cta-bg)] px-8 py-4 text-[12px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-10px_var(--mc-glow)] transition-transform hover:scale-[1.04]"
              >
                GET THE BOOK
                <ArrowUpRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>
              <p className="font-code mt-3 text-[9.5px] uppercase tracking-[0.14em] text-faint">
                Available on Amazon Kindle — verified listing.
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
