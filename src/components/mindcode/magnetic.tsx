"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Magnetic — subtle magnetic pull toward the cursor on fine pointers.
 */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (reduced || !ref.current) return;
    const el = ref.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }

  function onLeave() {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0px, 0px)";
  }

  return (
    <motion.div
      ref={ref}
      className={`inline-block will-change-transform ${className ?? ""}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)" }}
    >
      {children}
    </motion.div>
  );
}
