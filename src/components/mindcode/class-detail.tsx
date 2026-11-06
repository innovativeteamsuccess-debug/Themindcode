"use client";

/* ============================================================
   /classes/[cls] — the class world: subject planets.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BookOpen, FlaskConical } from "lucide-react";
import { CLASS_WORLDS, CLASSES, RESOURCES, SUBJECTS, SUBJECT_TAGLINES, type SubjectKey } from "./data";
import { SCENES, subjectColor } from "./subject-scenes";
import { Crumbs, EmptyState, WorldBody, WorldHeader } from "./world-shell";

export function ClassDetail({ cls }: { cls: number }) {
  const world = CLASS_WORLDS[cls] ?? {
    title: `Class ${cls}.`,
    sub: "A world in the Mind Code universe",
    status: "open" as const,
  };
  const open = world.status === "open";
  const klass = CLASSES.find((c) => c.id === cls);

  return (
    <main className="flex-1">
      <WorldHeader
        glyph={open ? "🎓" : "✦"}
        world={`CLASS ${cls} · ${open ? "OPEN WORLD" : "FORMING"}`}
        title={open ? `Class ${cls}` : `Class ${cls} — forming`}
        titleAccent={open ? undefined : "soon."}
        sub={open ? world.sub : "This world is still being built. Classes 6–10 are open today — every subject, every chapter, free."}
      >
        <Crumbs items={[{ label: "Home", href: "/" }, { label: "Classes", href: "/classes" }, { label: `Class ${cls}` }]} />
      </WorldHeader>

      <WorldBody className="pb-24">
        {open ? (
          <>
            <div className="mb-10 grid gap-3 sm:grid-cols-3">
              <MiniStat value={String(SUBJECTS.length)} label="Subject worlds" />
              <MiniStat
                value={String(RESOURCES.filter((r) => r.cls === cls).length)}
                label="Artifacts in the vault"
              />
              <MiniStat value="100%" label="CBSE aligned" small />
            </div>

            <h2 className="font-code mb-6 text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              Subject worlds
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {SUBJECTS.map((s, i) => {
                const Scene = SCENES[s.key];
                const color = subjectColor(s);
                return (
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 22 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: 0.05 * (i % 3), ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={`/classes/${cls}/${s.key}`}
                      data-cursor="interactive"
                      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] hover:shadow-[0_24px_60px_-24px_var(--mc-glow)]"
                    >
                      <div className="h-32 border-b border-[var(--mc-line-soft)] p-3" aria-hidden>
                        <Scene color={color} />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                          <h3 className="font-display text-xl leading-tight">{s.name}</h3>
                        </div>
                        <p className="mt-1.5 text-[12.5px] text-dim">{SUBJECT_TAGLINES[s.key]}</p>
                        <span className="btn-mono mt-auto inline-flex items-center gap-2 pt-5 text-[9.5px] text-faint transition-colors group-hover:text-[var(--mc-accent)]">
                          EXPLORE SUBJECT
                          <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* quick jumps */}
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              <Link
                href={`/resources?class=${cls}`}
                className="mc-card group flex items-center gap-4 p-5 transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--mc-line)] text-[var(--mc-accent)]">
                  <BookOpen size={18} />
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold">Class {cls} resources</span>
                  <span className="block text-[12px] text-dim">Notes, worksheets, PYQs — free</span>
                </span>
              </Link>
              <Link
                href="/tests"
                className="mc-card group flex items-center gap-4 p-5 transition-all hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--mc-line)] text-[var(--mc-accent)]">
                  <FlaskConical size={18} />
                </span>
                <span>
                  <span className="block text-[14.5px] font-semibold">Test missions</span>
                  <span className="block text-[12px] text-dim">Quizzes and simulations for Class {cls}</span>
                </span>
              </Link>
            </div>
          </>
        ) : (
          <EmptyState
            glyph="🚧"
            title="This world is still forming."
            body="We build worlds carefully — concept by concept. Meanwhile, Classes 6–10 are fully open."
            action={
              <Link
                href="/classes"
                className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
              >
                PICK AN OPEN WORLD
              </Link>
            }
          />
        )}
      </WorldBody>
    </main>
  );
}

function MiniStat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="mc-card px-5 py-4">
      <div className={small ? "text-[14px] font-semibold" : "font-display text-2xl text-[var(--mc-accent)]"}>
        {value}
      </div>
      <div className="font-code mt-1 text-[8.5px] uppercase tracking-[0.22em] text-faint">{label}</div>
    </div>
  );
}

/** helper for typed subject keys (avoids any leakage in slugs) */
export function isSubjectKey(v: string): v is SubjectKey {
  return SUBJECTS.some((s) => s.key === v);
}
