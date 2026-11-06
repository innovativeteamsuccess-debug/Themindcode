"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { CORE_SYMBOLS } from "./data";

type Star = {
  x: number; y: number; r: number; a: number; tw: number; depth: number;
};
type Node = {
  orbit: 0 | 1;
  phase: number;
  speed: number;
  symbol: string;
  size: number;
  glow: number; // eased proximity glow 0..1
};
type Ping = { r: number; alpha: number };

/**
 * MindCoreCanvas — the visual signature of The Mind Code.
 * Layered mathematical curves (rose petals + Lissajous scatter),
 * orbiting knowledge nodes, drifting particles and expanding data
 * streams. The core breathes and responds to the cursor.
 * Canvas 2D only — GPU-friendly, no 3D libraries.
 */
export function MindCoreCanvas({
  className,
  symbols = CORE_SYMBOLS,
  interactive = true,
}: {
  className?: string;
  symbols?: string[];
  interactive?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const cvEl = canvasRef.current;
    if (!cvEl) return;
    const cv: HTMLCanvasElement = cvEl;
    const g: CanvasRenderingContext2D = cv.getContext("2d")!;
    // non-null annotations (not just narrowing) so hoisted inner
    // functions see definite types — TS drops narrowing across
    // function-declaration boundaries.

    const theme = resolvedTheme === "light" ? "light" : "dark";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let running = true;
    let inView = true;
    const t0 = performance.now();

    const stars: Star[] = [];
    const nodes: Node[] = [];
    const pings: Ping[] = [];
    const mouse = { x: 0, y: 0, active: false };
    const pointer = { x: 0, y: 0 }; // eased cursor offset from centre

    // theme colors (read from CSS vars, re-read on theme change)
    let ink = "#f7f9fc";
    let dim = "#9db2d0";
    let accent = "#3b82f6";
    let accentSoft = "rgba(59,130,246,0.28)";

    function readColors() {
      const cs = getComputedStyle(document.documentElement);
      ink = cs.getPropertyValue("--mc-ink").trim() || ink;
      dim = cs.getPropertyValue("--mc-dim").trim() || dim;
      accent = cs.getPropertyValue("--mc-accent").trim() || accent;
      accentSoft = cs.getPropertyValue("--mc-accent-soft").trim() || accentSoft;
    }
    readColors();

    function seed() {
      stars.length = 0;
      const count = Math.min(110, Math.floor((w * h) / 16000));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random(),
          y: Math.random(),
          r: Math.random() * 1.3 + 0.3,
          a: Math.random() * 0.5 + 0.15,
          tw: Math.random() * Math.PI * 2,
          depth: Math.random() * 0.8 + 0.2,
        });
      }
      nodes.length = 0;
      const orbitCount = symbols.length;
      for (let i = 0; i < orbitCount; i++) {
        nodes.push({
          orbit: i % 2 === 0 ? 0 : 1,
          phase: (i / orbitCount) * Math.PI * 2,
          speed: 0.00022 + Math.random() * 0.00016,
          symbol: symbols[i % symbols.length],
          size: 9 + Math.random() * 3,
          glow: 0,
        });
      }
    }

    function resize() {
      const rect = cv.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw(t0);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries[0]?.isIntersecting ?? true;
        if (inView && !reduced && !running) {
          running = true;
          raf = requestAnimationFrame(loop);
        }
      },
      { threshold: 0.02 }
    );
    io.observe(cv);

    function onMove(e: PointerEvent) {
      if (!interactive) return;
      const rect = cv.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active =
        mouse.x >= 0 && mouse.y >= 0 && mouse.x <= rect.width && mouse.y <= rect.height;
    }
    window.addEventListener("pointermove", onMove, { passive: true });

    let lastPing = 0;

    function hexToRgb(hex: string): [number, number, number] {
      const m = hex.replace("#", "");
      if (m.length === 6) {
        return [
          parseInt(m.slice(0, 2), 16),
          parseInt(m.slice(2, 4), 16),
          parseInt(m.slice(4, 6), 16),
        ];
      }
      return [255, 178, 36];
    }

    function draw(now: number) {
      const t = now - t0;
      const cx = w / 2;
      const cy = h / 2;

      // eased cursor parallax
      const tx = mouse.active ? (mouse.x - cx) * 0.045 : 0;
      const ty = mouse.active ? (mouse.y - cy) * 0.045 : 0;
      pointer.x += (tx - pointer.x) * 0.04;
      pointer.y += (ty - pointer.y) * 0.04;

      const R = Math.min(w, h) * 0.3;
      const breathe = 1 + 0.032 * Math.sin(t * 0.00042);
      const Rc = R * breathe;

      g.clearRect(0, 0, w, h);

      const [ar, ag, ab] = hexToRgb(accent);

      /* ---- particles ---- */
      for (const s of stars) {
        const tw = 0.6 + 0.4 * Math.sin(t * 0.001 + s.tw);
        const px = s.x * w - pointer.x * s.depth * 2.2;
        const py = s.y * h - pointer.y * s.depth * 2.2;
        g.beginPath();
        g.arc(px, py, s.r, 0, Math.PI * 2);
        g.fillStyle = `rgba(${ar},${ag},${ab},${(s.a * tw * 0.5).toFixed(3)})`;
        g.fill();
      }

      /* ---- data stream pings ---- */
      if (!reduced && t - lastPing > 2600) {
        lastPing = t;
        pings.push({ r: Rc * 0.32, alpha: 0.32 });
      }
      for (let i = pings.length - 1; i >= 0; i--) {
        const p = pings[i];
        p.r += 0.9;
        p.alpha *= 0.985;
        if (p.alpha < 0.01) {
          pings.splice(i, 1);
          continue;
        }
        g.beginPath();
        g.arc(cx + pointer.x, cy + pointer.y, p.r, 0, Math.PI * 2);
        g.strokeStyle = `rgba(${ar},${ag},${ab},${p.alpha.toFixed(3)})`;
        g.lineWidth = 1;
        g.stroke();
      }

      const coreX = cx + pointer.x;
      const coreY = cy + pointer.y;

      /* ---- orbit rings (tilt subtly toward cursor) ---- */
      const tilt = pointer.x * 0.004;
      for (const [idx, rf] of [1.42, 1.78].entries()) {
        g.beginPath();
        g.ellipse(
          coreX,
          coreY,
          Rc * rf,
          Rc * rf * 0.42,
          -0.42 + tilt + idx * 0.06,
          0,
          Math.PI * 2
        );
        g.strokeStyle =
          theme === "dark"
            ? `rgba(${ar},${ag},${ab},0.13)`
            : `rgba(${ar},${ag},${ab},0.18)`;
        g.lineWidth = 1;
        g.stroke();
      }

      /* ---- the core: layered rose curves ---- */
      const layers: Array<[number, number, number, number]> = [
        // [petals k, rotation speed, alpha, lineWidth]
        [5, 0.00006, 0.34, 1.2],
        [8, -0.00004, 0.2, 1],
        [12, 0.000025, 0.12, 0.8],
      ];
      for (const [k, speed, alpha, lw] of layers) {
        const rot = t * speed;
        g.save();
        g.translate(coreX, coreY);
        g.rotate(rot);
        g.beginPath();
        const steps = 420;
        for (let i = 0; i <= steps; i++) {
          const th = (i / steps) * Math.PI * 2;
          const r = Rc * Math.cos(k * th) * 0.86;
          const x = r * Math.cos(th);
          const y = r * Math.sin(th);
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.strokeStyle =
          theme === "dark"
            ? `rgba(${ar},${ag},${ab},${alpha})`
            : `rgba(${ar},${ag},${ab},${alpha + 0.1})`;
        g.lineWidth = lw;
        g.stroke();
        g.restore();
      }

      /* ---- lissajous scatter (sacred-geometry dots) ---- */
      g.save();
      g.translate(coreX, coreY);
      const lp = t * 0.00018;
      for (let i = 0; i < 64; i++) {
        const tt = (i / 64) * Math.PI * 2;
        const x = Rc * 1.12 * Math.sin(3 * tt + lp);
        const y = Rc * 1.12 * Math.sin(4 * tt);
        g.beginPath();
        g.arc(x, y, 0.9, 0, Math.PI * 2);
        g.fillStyle = `rgba(${ar},${ag},${ab},0.4)`;
        g.fill();
      }
      g.restore();

      /* ---- centre glow ---- */
      const glow = g.createRadialGradient(coreX, coreY, 0, coreX, coreY, Rc * 0.62);
      glow.addColorStop(0, `rgba(${ar},${ag},${ab},${theme === "dark" ? 0.3 : 0.22})`);
      glow.addColorStop(0.45, `rgba(${ar},${ag},${ab},0.05)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(coreX, coreY, Rc * 0.62, 0, Math.PI * 2);
      g.fill();

      // bright nucleus
      g.beginPath();
      g.arc(coreX, coreY, 2.6, 0, Math.PI * 2);
      g.fillStyle = accent;
      g.shadowColor = accentSoft;
      g.shadowBlur = 22;
      g.fill();
      g.shadowBlur = 0;

      /* ---- orbiting knowledge nodes ---- */
      g.font = "500 11px 'Space Mono', monospace";
      g.textAlign = "center";
      g.textBaseline = "middle";
      for (const n of nodes) {
        const rf = n.orbit === 0 ? 1.42 : 1.78;
        const rot = -0.42 + pointer.x * 0.004 + (n.orbit === 0 ? 0 : 0.06);
        const th = n.phase + t * n.speed * (n.orbit === 0 ? 1 : -0.8);
        const orx = Rc * rf * Math.cos(th);
        const ory = Rc * rf * 0.42 * Math.sin(th);
        const x = coreX + orx * Math.cos(rot) - ory * Math.sin(rot);
        const y = coreY + orx * Math.sin(rot) + ory * Math.cos(rot);

        // proximity glow
        let target = 0;
        if (mouse.active) {
          const d = Math.hypot(mouse.x - x, mouse.y - y);
          if (d < 130) target = 1 - d / 130;
        }
        n.glow += (target - n.glow) * 0.1;

        // trail
        g.beginPath();
        for (let s = 1; s <= 5; s++) {
          const th2 = th - s * 0.05 * (n.orbit === 0 ? 1 : -1);
          const rx = Rc * rf * Math.cos(th2);
          const ry = Rc * rf * 0.42 * Math.sin(th2);
          const px = coreX + rx * Math.cos(rot) - ry * Math.sin(rot);
          const py = coreY + rx * Math.sin(rot) + ry * Math.cos(rot);
          if (s === 1) g.moveTo(px, py);
          else g.lineTo(px, py);
        }
        g.strokeStyle = `rgba(${ar},${ag},${ab},${(0.14 + n.glow * 0.5).toFixed(3)})`;
        g.lineWidth = 1;
        g.stroke();

        // node
        g.beginPath();
        g.arc(x, y, n.size * (0.85 + n.glow * 0.5), 0, Math.PI * 2);
        g.fillStyle =
          theme === "dark"
            ? `rgba(16,17,22,${0.9})`
            : `rgba(252,251,247,0.95)`;
        g.fill();
        g.strokeStyle = `rgba(${ar},${ag},${ab},${(0.55 + n.glow * 0.45).toFixed(3)})`;
        g.lineWidth = 1;
        g.stroke();

        // symbol
        g.fillStyle = n.glow > 0.25 ? accent : dim;
        g.fillText(n.symbol, x, y + 0.5);
      }
    }

    function loop(now: number) {
      if (!running) return;
      if (inView && !document.hidden) draw(now);
      raf = requestAnimationFrame(loop);
    }

    resize();
    if (!reduced) {
      running = true;
      raf = requestAnimationFrame(loop);
    } else {
      draw(t0);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [interactive, symbols, resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
