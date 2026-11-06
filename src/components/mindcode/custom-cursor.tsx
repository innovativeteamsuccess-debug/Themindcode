"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

function subscribeFine() {
  const mq = window.matchMedia("(pointer: fine)");
  const cb = () => {
    /* re-evaluated by useSyncExternalStore */
  };
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function isFinePointer() {
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * CustomCursor — a small luminous point that expands on interactive
 * elements and becomes an orbital ring over the Mind Core.
 * Desktop (fine pointer) only. Disabled for reduced motion.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(subscribeFine, isFinePointer, () => false);
  const state = useRef({ x: -100, y: -100, rx: -100, ry: -100, visible: false });

  useEffect(() => {
    if (!enabled) return;
    document.body.classList.add("mc-cursor-on");

    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const s = state.current;
      s.x = e.clientX;
      s.y = e.clientY;
      if (!s.visible) {
        s.visible = true;
        s.rx = s.x;
        s.ry = s.y;
        if (dotRef.current) dotRef.current.style.opacity = "1";
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }

      const target = e.target as HTMLElement | null;
      const interactive = target?.closest(
        "a, button, [role='button'], input, textarea, select, label, [data-cursor='interactive']"
      );
      const core = target?.closest("[data-cursor='core']");

      const ring = ringRef.current;
      if (ring) {
        if (core) {
          ring.dataset.mode = "core";
        } else if (interactive) {
          ring.dataset.mode = "interactive";
        } else {
          ring.dataset.mode = "idle";
        }
      }
    };

    const onLeave = () => {
      state.current.visible = false;
      if (dotRef.current) dotRef.current.style.opacity = "0";
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const loop = () => {
      const s = state.current;
      s.rx += (s.x - s.rx) * 0.16;
      s.ry += (s.y - s.ry) * 0.16;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${s.rx}px, ${s.ry}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      document.body.classList.remove("mc-cursor-on");
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[120] h-[5px] w-[5px] rounded-full opacity-0 transition-opacity duration-300"
        style={{
          background: "var(--mc-accent)",
          boxShadow: "0 0 10px var(--mc-glow), 0 0 22px var(--mc-glow)",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        data-mode="idle"
        className="pointer-events-none fixed left-0 top-0 z-[119] opacity-0 transition-opacity duration-300"
      >
        <div
          className="cursor-ring h-8 w-8 rounded-full border"
          style={{
            borderColor: "color-mix(in srgb, var(--mc-ink) 38%, transparent)",
          }}
        />
      </div>
    </>
  );
}
