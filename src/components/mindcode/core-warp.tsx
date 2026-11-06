"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useUniverse } from "./store";

/**
 * CoreWarp — the "ENTER THE MIND CORE" cinematic transition.
 * The core expands outward like a camera diving inward, a soft flash,
 * then the universe section is revealed.
 */
export function CoreWarp() {
  const warp = useUniverse((s) => s.warp);

  return (
    <AnimatePresence>
      {warp && (
        <motion.div
          key="warp"
          className="pointer-events-none fixed inset-0 z-[130]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeOut" } }}
        >
          {/* expanding core */}
          <motion.div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 120,
              height: 120,
              marginLeft: -60,
              marginTop: -60,
              background:
                "radial-gradient(circle, var(--mc-accent) 0%, var(--mc-accent-soft) 42%, transparent 70%)",
            }}
            initial={{ scale: 0.2, opacity: 0.9 }}
            animate={{ scale: 26, opacity: 1 }}
            transition={{ duration: 1.15, ease: [0.6, 0.02, 0.35, 1] }}
          />
          {/* flash */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--mc-accent)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.28, 0] }}
            transition={{ duration: 0.9, times: [0, 0.35, 1], ease: "easeOut" }}
          />
          {/* vignette darkening */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--mc-bg)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.65, 0] }}
            transition={{ duration: 1.3, times: [0, 0.5, 1], ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
