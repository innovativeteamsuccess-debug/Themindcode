"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/*
 * NOTE: do NOT branch the tree on useReducedMotion() here.
 * framer-motion reads matchMedia synchronously during the first
 * client render (but not on the server), so `if (reduced) return <div>`
 * produces a different tree on the client than was server-rendered —
 * shifting every useId-based ID (Radix) and triggering hydration
 * mismatches. MotionConfig reducedMotion="user" (see universe.tsx)
 * already disables transform animations for reduced-motion users
 * while keeping the component tree identical on server and client.
 */

export type RevealVariant = "core" | "world" | "rise" | "editorial" | "orbit";

const variants: Record<RevealVariant, Variants> = {
  core: {
    hidden: { opacity: 0, scale: 0.9, filter: "blur(10px)" },
    show: {
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
    },
  },
  world: {
    hidden: { opacity: 0, scale: 0.82, rotate: -4 },
    show: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
    },
  },
  rise: {
    hidden: { opacity: 0, y: 44 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  },
  editorial: {
    hidden: { opacity: 0, y: 28, filter: "blur(6px)" },
    show: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: { duration: 1.0, ease: [0.22, 1, 0.36, 1] },
    },
  },
  orbit: {
    hidden: { opacity: 0, y: 30, rotate: 3 },
    show: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] },
    },
  },
};

export function Reveal({
  children,
  variant = "rise",
  delay = 0,
  className,
  once = true,
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={variants[variant]}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({
  children,
  className,
  gap = 0.09,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  gap?: number;
  once?: boolean;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: gap } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 34, filter: "blur(4px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
