"use client";

/* ============================================================
   HeroCube — the hero's signature object.
   A glass "mind core" cube with an orbit ring and floating
   learning chips. Pure CSS 3D + framer-motion loops — no
   canvas, no random values at render (hydration-safe: every
   position below is a fixed constant).
   ============================================================ */

import { motion } from "framer-motion";
import { Atom, BarChart3, BookOpen, CodeXml, Play } from "lucide-react";

/* floating glass chips — fixed positions, per-chip drift timing */
const CHIPS = [
  { icon: BookOpen, top: "4%", left: "6%", size: 60, rotate: -8, dur: 6.2, delay: 0 },
  { icon: Play, top: "0%", left: "76%", size: 64, rotate: 7, dur: 7.1, delay: 0.6 },
  { icon: CodeXml, top: "58%", left: "0%", size: 62, rotate: -6, dur: 6.8, delay: 1.1 },
  { icon: BarChart3, top: "56%", left: "84%", size: 58, rotate: 9, dur: 6.4, delay: 1.7 },
] as const;

/* tiny ambient particles — fixed positions only */
const DUST = [
  { top: "18%", left: "30%", s: 3, d: 0 },
  { top: "8%", left: "52%", s: 2, d: 0.8 },
  { top: "34%", left: "88%", s: 3, d: 1.6 },
  { top: "72%", left: "18%", s: 2, d: 2.2 },
  { top: "82%", left: "66%", s: 3, d: 1.2 },
  { top: "44%", left: "8%", s: 2, d: 2.8 },
] as const;

const FACE_STYLE: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  borderRadius: 26,
  border: "1px solid rgba(147, 197, 253, 0.45)",
  background:
    "linear-gradient(135deg, rgba(96,165,250,0.30) 0%, rgba(59,130,246,0.10) 48%, rgba(23,72,142,0.16) 100%)",
  boxShadow: "inset 0 0 34px rgba(96,165,250,0.22)",
  backdropFilter: "blur(2px)",
};

function Cube() {
  return (
    <div
      className="relative h-[210px] w-[210px] sm:h-[236px] sm:w-[236px]"
      style={{ transformStyle: "preserve-3d" }}
      aria-hidden
    >
      {/* orbiting cube — six translucent faces */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <div style={{ ...FACE_STYLE, transform: "translateZ(105px)" }} />
        <div
          style={{
            ...FACE_STYLE,
            transform: "translateZ(-105px) rotateY(180deg)",
            opacity: 0.55,
          }}
        />
        <div style={{ ...FACE_STYLE, transform: "rotateY(90deg) translateZ(105px)", opacity: 0.8 }} />
        <div style={{ ...FACE_STYLE, transform: "rotateY(-90deg) translateZ(105px)", opacity: 0.8 }} />
        <div
          style={{
            ...FACE_STYLE,
            transform: "rotateX(90deg) translateZ(105px)",
            background:
              "linear-gradient(135deg, rgba(147,197,253,0.4) 0%, rgba(59,130,246,0.12) 100%)",
          }}
        />
        <div style={{ ...FACE_STYLE, transform: "rotateX(-90deg) translateZ(105px)", opacity: 0.6 }} />
      </motion.div>

      {/* the atom — steady at the core while glass turns around it */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          className="mc-breathe flex h-[104px] w-[104px] items-center justify-center rounded-full sm:h-[116px] sm:w-[116px]"
          style={{
            background:
              "radial-gradient(circle at 34% 28%, rgba(191,219,254,0.5), rgba(59,130,246,0.24) 58%, transparent 78%)",
            boxShadow: "0 0 46px rgba(96,165,250,0.5), inset 0 0 26px rgba(147,197,253,0.3)",
          }}
        >
          <Atom
            size={62}
            strokeWidth={1.4}
            className="text-white"
            style={{ filter: "drop-shadow(0 0 14px rgba(147,197,253,0.9))" }}
          />
        </div>
      </div>
    </div>
  );
}

export function HeroCube() {
  return (
    <div
      className="relative mx-auto h-[380px] w-full max-w-[540px] select-none sm:h-[440px] lg:h-[520px]"
      style={{ perspective: "1200px" }}
    >
      {/* deep glow behind everything */}
      <div
        className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full sm:h-[500px] sm:w-[500px]"
        style={{
          background:
            "radial-gradient(circle, rgba(59,130,246,0.30) 0%, rgba(37,99,235,0.12) 42%, transparent 68%)",
          filter: "blur(6px)",
        }}
        aria-hidden
      />

      {/* orbit ring — back half */}
      <svg
        viewBox="0 0 560 300"
        className="absolute left-1/2 top-1/2 w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2"
        aria-hidden
      >
        <defs>
          <linearGradient id="hc-ring" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.1" />
            <stop offset="45%" stopColor="#93c5fd" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <ellipse
          cx="280"
          cy="150"
          rx="252"
          ry="74"
          fill="none"
          stroke="url(#hc-ring)"
          strokeWidth="2"
          transform="rotate(-12 280 150)"
        />
        {/* satellites riding the back of the ring */}
        <circle cx="42" cy="196" r="4" fill="#93c5fd" opacity="0.9" />
        <circle cx="520" cy="96" r="3" fill="#60a5fa" opacity="0.8" />
      </svg>

      {/* the cube, tilted */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          style={{
            transform: "rotateX(-16deg) rotateZ(-7deg)",
            transformStyle: "preserve-3d",
          }}
        >
          <Cube />
        </div>
      </div>

      {/* orbit ring — front arc (clipped lower half, sits above the cube) */}
      <svg
        viewBox="0 0 560 300"
        className="absolute left-1/2 top-1/2 z-20 w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2"
        style={{ clipPath: "inset(52% 0 0 0)" }}
        aria-hidden
      >
        <ellipse
          cx="280"
          cy="150"
          rx="252"
          ry="74"
          fill="none"
          stroke="url(#hc-ring)"
          strokeWidth="2.5"
          transform="rotate(-12 280 150)"
        />
        <circle cx="500" cy="204" r="5" fill="#bfdbfe" />
        <circle cx="500" cy="204" r="10" fill="#60a5fa" opacity="0.35" />
      </svg>

      {/* slow dashed halo */}
      <div
        className="mc-spin-slower pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[rgba(96,165,250,0.22)] sm:h-[360px] sm:w-[360px]"
        aria-hidden
      />

      {/* floating learning chips */}
      {CHIPS.map((c) => (
        <motion.div
          key={c.left + c.top}
          className="absolute z-30"
          style={{ top: c.top, left: c.left }}
          initial={{ opacity: 0, scale: 0.6, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.9 + c.delay * 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="mc-float flex items-center justify-center rounded-2xl"
            style={{
              width: c.size,
              height: c.size,
              rotate: `${c.rotate}deg`,
              animationDuration: `${c.dur}s`,
              animationDelay: `${c.delay}s`,
              background:
                "linear-gradient(150deg, rgba(191,219,254,0.22) 0%, rgba(59,130,246,0.10) 55%, rgba(23,72,142,0.18) 100%)",
              border: "1px solid rgba(191,219,254,0.38)",
              boxShadow:
                "0 18px 40px -14px rgba(37,99,235,0.55), inset 0 1px 0 rgba(255,255,255,0.28)",
              backdropFilter: "blur(8px)",
            }}
          >
            <c.icon size={c.size * 0.42} strokeWidth={1.7} className="text-[#dbeafe]" />
          </div>
        </motion.div>
      ))}

      {/* ambient dust */}
      {DUST.map((p, i) => (
        <span
          key={i}
          className="mc-twinkle absolute rounded-full bg-[#93c5fd]"
          style={{
            top: p.top,
            left: p.left,
            width: p.s,
            height: p.s,
            animationDelay: `${p.d}s`,
            boxShadow: "0 0 8px rgba(147,197,253,0.9)",
          }}
          aria-hidden
        />
      ))}
    </div>
  );
}
