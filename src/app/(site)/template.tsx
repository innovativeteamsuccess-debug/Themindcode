"use client";

/**
 * template.tsx — re-mounts on every route change, so each world
 * slides in with one calm motion. Short (≤400ms): continuity
 * without waiting. Reduced-motion users get an instant cut via
 * MotionConfig reducedMotion="user".
 */
import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
