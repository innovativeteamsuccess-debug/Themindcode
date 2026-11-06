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
import { FOUNDER } from "./data";

/* ============================================================
   FOUNDER PORTRAIT — a real 3D depth card.

   The photograph (verified, unretouched) is split into physical
   layers inside a preserve-3d scene: cinematic backdrop, orbit
   rings, a cast shadow that swings with the tilt, the cut-out
   figure floating in front, a floating frame, glare and caption.

   Hydration-safe by construction:
   - no useId, no browser APIs during render, no tree branching
     (useReducedMotion only guards event handlers — the tree is
     identical on server and client).
   ============================================================ */

const TILT = { stiffness: 150, damping: 17, mass: 0.6 };

/* tiny drifting knowledge motes, scattered in the depth field */
const MOTES = [
  { left: "12%", top: "22%", size: 3, delay: "0s", opacity: 0.7 },
  { left: "84%", top: "18%", size: 2, delay: "1.4s", opacity: 0.5 },
  { left: "20%", top: "58%", size: 2, delay: "2.6s", opacity: 0.45 },
  { left: "78%", top: "64%", size: 3, delay: "0.9s", opacity: 0.6 },
  { left: "62%", top: "12%", size: 2, delay: "3.4s", opacity: 0.5 },
];

/* Exported for the dedicated /about/founder page hero (text left, portrait right). */
export function FounderPortrait() {
  const wrapRef = useRef<HTMLDivElement>(null);

  /* pointer offsets in [-0.5, 0.5] — written only from events */
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, TILT);
  const sy = useSpring(py, TILT);

  /* card tilt — resting pose echoes the book's 3/4 stance */
  const rotateY = useTransform(sx, (v) => v * 12 - 6);
  const rotateX = useTransform(sy, (v) => -v * 9 + 4);

  /* layer parallax — the figure is closest, the shadow swings away */
  const figX = useTransform(sx, (v) => v * 8);
  const figY = useTransform(sy, (v) => v * 5);
  const shadowX = useTransform(sx, (v) => v * -26);
  const shadowY = useTransform(sy, (v) => v * -8);

  /* glare follows the pointer across the glass */
  const glareX = useTransform(sx, (v) => (v + 0.5) * 100);
  const glareY = useTransform(sy, (v) => (v + 0.5) * 100);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, var(--mc-glow), transparent 58%)`;

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
      className="group relative select-none pb-8"
      style={{ perspective: "1200px" }}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      {/* ambient room glow behind the whole scene (doesn't tilt) */}
      <div
        aria-hidden
        className="absolute inset-x-8 bottom-4 top-10 rounded-full opacity-50 blur-3xl"
        style={{ background: "var(--mc-accent-soft)" }}
      />

      <motion.div
        className="relative h-[490px] w-[300px] md:h-[570px] md:w-[350px]"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        {/* L0 · cinematic backdrop panel */}
        <div
          className="absolute inset-0 overflow-hidden rounded-2xl border border-[var(--mc-line)]"
          style={{
            transform: "translateZ(0px)",
            background:
              "linear-gradient(180deg, var(--mc-card-2) 0%, var(--mc-bg) 90%)",
          }}
        >
          <div
            className="absolute left-1/2 top-[13%] h-60 w-60 -translate-x-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--mc-accent-soft), transparent 68%)",
            }}
          />
          {/* baseboard + floor light */}
          <div className="absolute inset-x-6 bottom-14 h-px bg-[var(--mc-line)]" />
          <div
            className="absolute inset-x-12 bottom-8 h-20"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, var(--mc-accent-soft), transparent 72%)",
            }}
          />
          {/* faint constellation dust on the backdrop */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 350 570" aria-hidden>
            {[
              [46, 96], [296, 132], [70, 210], [312, 268], [38, 342], [286, 388],
            ].map(([cx, cy]) => (
              <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.1" fill="var(--mc-faint)" opacity="0.5" />
            ))}
          </svg>
        </div>

        {/* L1 · gyroscope orbit rings — the Mind Core signature */}
        <svg
          className="absolute inset-0 h-full w-full"
          style={{ transform: "translateZ(20px)" }}
          viewBox="0 0 350 570"
          aria-hidden
        >
          <g className="mc-spin-slow" style={{ transformOrigin: "175px 190px" }}>
            <ellipse
              cx="175" cy="190" rx="132" ry="42"
              fill="none" stroke="var(--mc-accent)" strokeOpacity="0.34"
              transform="rotate(-12 175 190)"
            />
            <circle cx="298" cy="152" r="2.6" fill="var(--mc-accent)" />
          </g>
          <g className="mc-spin-slower" style={{ transformOrigin: "175px 190px" }}>
            <ellipse
              cx="175" cy="190" rx="118" ry="150"
              fill="none" stroke="var(--mc-accent)" strokeOpacity="0.16"
              strokeDasharray="2 7"
            />
            <circle cx="175" cy="34" r="1.8" fill="var(--mc-accent)" opacity="0.8" />
          </g>
        </svg>

        {/* L2 · drifting knowledge motes between the rings and the man */}
        {MOTES.map((m) => (
          <span
            key={`${m.left}-${m.top}`}
            aria-hidden
            className="mc-float absolute rounded-full bg-[var(--mc-accent)]"
            style={{
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              opacity: m.opacity,
              animationDelay: m.delay,
              transform: "translateZ(34px)",
            }}
          />
        ))}

        {/* L3 · cast shadow — swings opposite the tilt, grounding the figure */}
        <div
          className="absolute inset-x-0 bottom-1 mx-auto"
          style={{ width: "72%", transform: "translateZ(10px)" }}
        >
          <motion.img
            src="/founder-figure.png"
            alt=""
            aria-hidden
            width={620}
            height={1092}
            draggable={false}
            className="w-full"
            style={{
              x: shadowX,
              y: shadowY,
              filter: "brightness(0) blur(7px)",
              opacity: 0.4,
            }}
          />
        </div>

        {/* L4 · THE MAN — real photograph, floating in front of the frame */}
        <div
          className="absolute inset-x-0 bottom-0 mx-auto"
          style={{ width: "72%", transform: "translateZ(58px)" }}
        >
          <motion.img
            src="/founder-figure.png"
            alt={`${FOUNDER.name} — ${FOUNDER.role}`}
            width={620}
            height={1092}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="w-full transition-[filter] duration-500 group-hover:brightness-[1.06]"
            style={{
              x: figX,
              y: figY,
              filter: "drop-shadow(0 0 14px var(--mc-glow))",
            }}
          />
        </div>

        {/* L5 · floating editorial frame in front of the figure */}
        <div
          className="absolute inset-3 rounded-xl border border-[var(--mc-line)]"
          style={{ transform: "translateZ(88px)" }}
          aria-hidden
        >
          {[
            "left-0 top-0 border-l border-t",
            "right-0 top-0 border-r border-t",
            "bottom-0 left-0 border-b border-l",
            "bottom-0 right-0 border-b border-r",
          ].map((pos) => (
            <span
              key={pos}
              className={`absolute h-6 w-6 border-[var(--mc-accent)] ${pos}`}
            />
          ))}
        </div>

        {/* L6 · glare that tracks the pointer */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-70"
          style={{ transform: "translateZ(104px)", background: glare }}
        />

        {/* L7 · caption plate — the deepest layer toward the viewer */}
        <div
          className="absolute -bottom-3 left-5 right-5 flex items-center justify-between border border-[var(--mc-line)] bg-[var(--mc-card)] px-4 py-2.5"
          style={{ transform: "translateZ(122px)" }}
        >
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">
            FIG. 01 — FOUNDER
          </span>
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-[var(--mc-accent)]">
            {FOUNDER.location.toUpperCase()}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
