"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const BOOT_LINES = [
  "initialising the mind core",
  "loading 2,500+ knowledge artifacts",
  "calibrating curiosity engine",
  "welcome, learner",
];

const emptySubscribe = () => () => {};

function firstVisitSnapshot() {
  try {
    return sessionStorage.getItem("mc-booted") !== "1";
  } catch {
    return false;
  }
}

/**
 * BootIntro — a one-per-session cinematic ignition sequence.
 * Mono type-on lines + expanding core, then the universe opens.
 * Skipped entirely for reduced motion or repeat visits.
 */
export function BootIntro() {
  const firstVisit = useSyncExternalStore(
    emptySubscribe,
    firstVisitSnapshot,
    () => false
  );
  const [done, setDone] = useState(false);
  const [line, setLine] = useState(0);
  const reduced = useReducedMotion();

  const show = firstVisit && !reduced && !done;

  useEffect(() => {
    if (!show) return;

    document.body.style.overflow = "hidden";
    try {
      sessionStorage.setItem("mc-booted", "1");
    } catch {
      /* private mode — intro simply replays */
    }

    const lineTimer = window.setInterval(() => {
      setLine((l) => Math.min(l + 1, BOOT_LINES.length - 1));
    }, 620);
    const exitTimer = window.setTimeout(() => setDone(true), 2600);

    return () => {
      window.clearInterval(lineTimer);
      window.clearTimeout(exitTimer);
      document.body.style.overflow = "";
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="boot"
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "var(--mc-bg)" }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.7, ease: "easeInOut" } }}
        >
          {/* expanding core flash behind */}
          <motion.div
            className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                "radial-gradient(circle, var(--mc-accent) 0%, var(--mc-accent-soft) 40%, transparent 70%)",
            }}
            initial={{ scale: 0.1, opacity: 0 }}
            animate={{ scale: [0.1, 1.6, 30], opacity: [0, 0.9, 0] }}
            transition={{ duration: 2.4, times: [0, 0.55, 1], ease: [0.4, 0, 0.2, 1] }}
          />

          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* orbit mark */}
            <motion.svg
              width="86"
              height="86"
              viewBox="0 0 40 40"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <circle cx="20" cy="20" r="4" fill="var(--mc-accent)" />
              <circle cx="20" cy="20" r="9" stroke="var(--mc-accent)" strokeOpacity="0.55" fill="none" />
              <ellipse cx="20" cy="20" rx="17" ry="7" stroke="var(--mc-accent)" strokeOpacity="0.4" fill="none" transform="rotate(-24 20 20)" />
              <ellipse cx="20" cy="20" rx="17" ry="7" stroke="var(--mc-accent)" strokeOpacity="0.4" fill="none" transform="rotate(24 20 20)" />
              <circle cx="33" cy="12.5" r="1.6" fill="var(--mc-accent)" />
            </motion.svg>

            <div className="flex flex-col items-center gap-2.5">
              <span className="font-code text-[10px] uppercase tracking-[0.5em] text-[var(--mc-ink)]">
                the mind code
              </span>
              <div className="font-code h-5 text-[12px] text-[var(--mc-accent)]">
                <span>&gt;&nbsp;{BOOT_LINES[line]}</span>
                <span className="boot-cursor ml-0.5 inline-block h-[14px] w-[7px] translate-y-[2px] bg-[var(--mc-accent)]" />
              </div>
            </div>

            {/* loading bar */}
            <div className="h-px w-40 overflow-hidden bg-[var(--mc-line)]">
              <motion.div
                className="h-full bg-[var(--mc-accent)]"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.3, ease: "easeInOut" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
