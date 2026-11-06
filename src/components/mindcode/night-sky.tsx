"use client";

/* ============================================================
   NIGHT SKY — the hero's living ceiling.

   · ShootingStars — a constellation of meteors on long, staggered
     CSS loops: each one streaks toward the lower-left for ~1.2s,
     then its sky stays quiet for the rest of an 11–19s cycle.
     One seeded PAIR fires twice ~0.5s apart from the same origin,
     so every minute or so a twin meteor moment crosses the sky.
     All positions are deterministic (seeded LCG, module scope)
     so server and client markup match — hydration-safe.

   · Moon — a glowing full moon with soft craters, a breathing
     halo and a slow celestial drift. Pure CSS painting; no
     images, no scripts.

   Both are decorative: pointer-events-none + aria-hidden, and
   every animation respects prefers-reduced-motion.
   ============================================================ */

/* ---------------- deterministic meteor params ---------------- */

function seededMeteors(seed: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  const make = (x: number, y: number, speed: number) => {
    const dx = -(260 + rnd() * 170 * speed); // travels left…
    const dy = 150 + rnd() * 90 * speed; // …and down
    return {
      x,
      y,
      dx,
      dy,
      len: 90 + rnd() * 80,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      dur: 11 + rnd() * 8, // full cycle incl. quiet time
      delay: 0,
    };
  };

  const meteors: ReturnType<typeof make>[] = [];

  /* nine solo wanderers spread across the upper sky */
  for (let i = 0; i < 9; i++) {
    const m = make(14 + rnd() * 68, 3 + rnd() * 26, 1);
    m.delay = rnd() * 21; // everyone on a private clock
    meteors.push(m);
  }

  /* the twin: two meteors, same neighbourhood, half a second apart */
  const tx = 22 + rnd() * 40;
  const ty = 6 + rnd() * 14;
  const twinA = make(tx, ty, 0.8);
  twinA.delay = 6 + rnd() * 10; // the anchor moment
  const twinB = make(tx + 2.4, ty + 1.6, 0.8);
  twinB.delay = twinA.delay + 0.55; // the echo
  meteors.push(twinA, twinB);

  return meteors;
}

const METEORS = seededMeteors(884422);

export function ShootingStars() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {METEORS.map((m, i) => (
        <span
          key={i}
          className="mc-shoot-star"
          style={
            {
              left: `${m.x}%`,
              top: `${m.y}%`,
              "--mc-shoot-dx": `${m.dx}px`,
              "--mc-shoot-dy": `${m.dy}px`,
              "--mc-shoot-dur": `${m.dur.toFixed(2)}s`,
              "--mc-shoot-delay": `${m.delay.toFixed(2)}s`,
            } as React.CSSProperties
          }
        >
          {/* sprite: rotated to align with the motion vector */}
          <span
            className="absolute left-0 top-0 block"
            style={{ transform: `rotate(${m.angle.toFixed(2)}deg)`, transformOrigin: "0 0" }}
          >
            <span
              className="mc-shoot-tail"
              style={{ width: m.len, top: -1 }}
            />
            <span className="mc-shoot-head" style={{ left: m.len }} />
          </span>
        </span>
      ))}
    </div>
  );
}

/* ---------------- the moon ---------------- */

const CRATERS = [
  { size: 24, left: 28, top: 54, o: 0.5 },
  { size: 15, left: 60, top: 26, o: 0.42 },
  { size: 12, left: 66, top: 62, o: 0.38 },
  { size: 9, left: 42, top: 20, o: 0.34 },
  { size: 8, left: 20, top: 34, o: 0.3 },
];

export function Moon({ className, small }: { className?: string; small?: boolean }) {
  return (
    <div className={`pointer-events-none absolute ${className ?? ""}`} aria-hidden>
      <div className="mc-moon-float relative h-full w-full">
        {/* breathing halo — `small` keeps the glow inside short sections */}
        <div
          className={`mc-moon-halo absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            small ? "h-[240px] w-[240px]" : "h-[340px] w-[340px]"
          }`}
          style={{
            background:
              "radial-gradient(circle, rgba(244,241,225,0.32) 0%, rgba(244,241,225,0.11) 40%, rgba(217,212,194,0.05) 57%, transparent 70%)",
          }}
        />
        {/* the disc */}
        <div
          className="relative h-full w-full rounded-full"
          style={{
            background:
              "radial-gradient(circle at 36% 32%, #fffdf5 0%, #f6f1df 34%, #e7e1cb 58%, #d3ccb4 78%, #c2baa1 92%, #b7ae94 100%)",
            boxShadow:
              small
                ? "0 0 34px rgba(244,239,221,0.5), 0 0 90px rgba(217,212,194,0.22), inset -8px -10px 24px rgba(148,140,116,0.42), inset 4px 5px 10px rgba(255,253,245,0.5)"
                : "0 0 54px rgba(244,239,221,0.55), 0 0 150px rgba(217,212,194,0.30), inset -12px -14px 34px rgba(148,140,116,0.42), inset 5px 6px 14px rgba(255,253,245,0.5)",
          }}
        >
          {/* maria / craters */}
          {CRATERS.map((c, i) => (
            <span
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${c.size}%`,
                height: `${c.size}%`,
                left: `${c.left}%`,
                top: `${c.top}%`,
                opacity: c.o,
                background:
                  "radial-gradient(circle at 42% 36%, rgba(146,138,114,0.55), rgba(146,138,114,0.22) 68%, transparent 76%)",
                boxShadow: "inset 1px 2px 4px rgba(120,112,90,0.45)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
