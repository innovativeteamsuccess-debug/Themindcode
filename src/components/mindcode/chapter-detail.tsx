"use client";

/* ============================================================
   /classes/[cls]/[subject]/[chapter] — the learning screen.
   Tabs: LEARN · NOTES · PRACTICE · PYQs · TEST · QUICK REVISION
   Everything the chapter needs, in one place.
   ============================================================ */

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Download,
  FileText,
  FlaskConical,
  Sparkles,
  StickyNote,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  chaptersFor,
  FOUNDER,
  RESOURCES,
  SUBJECTS,
  slugify,
  TESTS,
  type Chapter,
  type SubjectKey,
} from "./data";
import { subjectColor } from "./subject-scenes";
import { Crumbs, EmptyState, WorldBody, WorldHeader } from "./world-shell";
import { useUniverse } from "./store";
import { APP_URL } from "./data";

const TABS = [
  { key: "learn", label: "LEARN", icon: Brain },
  { key: "notes", label: "NOTES", icon: StickyNote },
  { key: "practice", label: "PRACTICE", icon: Target },
  { key: "pyqs", label: "PYQs", icon: FileText },
  { key: "test", label: "TEST", icon: FlaskConical },
  { key: "revision", label: "QUICK REVISION", icon: Sparkles },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ChapterDetail({
  cls,
  subjectKey,
  chapterSlug,
}: {
  cls: number;
  subjectKey: SubjectKey;
  chapterSlug: string;
}) {
  const subject = SUBJECTS.find((s) => s.key === subjectKey)!;
  const chapters = chaptersFor(cls, subjectKey);
  const index = chapters.findIndex((c) => slugify(c.name) === chapterSlug);
  const chapter: Chapter | undefined = chapters[index];
  const [tab, setTab] = useState<TabKey>("learn");
  const color = subjectColor(subject);
  const setCodeOpen = useUniverse((s) => s.setCodeOpen);

  function matchChapter(r: (typeof RESOURCES)[number]) {
    if (!chapter || r.cls !== cls || r.subject !== subjectKey) return false;
    const n = chapter.name.toLowerCase();
    const head = n.split(/[\s—:&?]+/)[0] ?? n;
    const c = r.chapter.toLowerCase();
    const t = r.title.toLowerCase();
    return c.includes(head) || n.includes(c) || t.includes(n);
  }

  const chapterResources: (typeof RESOURCES)[number][] = chapter
    ? RESOURCES.filter(matchChapter)
    : [];

  const chapterTest =
    TESTS.find(
      (t) =>
        t.cls === cls &&
        t.subject === subjectKey &&
        slugify(t.chapter).includes(chapterSlug) &&
        chapterSlug.length > 4
    ) ?? TESTS.find((t) => t.cls === cls && t.subject === subjectKey);

  const relatedTests = TESTS.filter((t) => t.cls === cls && t.subject === subjectKey);

  if (!chapter) {
    return (
      <main className="flex-1">
        <WorldHeader
          glyph="✦"
          world={`CLASS ${cls} · ${subject.name.toUpperCase()}`}
          title="Chapter not"
          titleAccent="found."
          sub="That star is not in this constellation — it may have been renamed. Pick it from the map instead."
        />
        <WorldBody className="pb-24">
          <EmptyState
            glyph="🔭"
            title="Nothing here yet."
            body="Even the smartest minds start with an empty page. Head back to the constellation and pick a star."
            action={
              <Link
                href={`/classes/${cls}/${subjectKey}`}
                className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
              >
                BACK TO {subject.name.toUpperCase()}
              </Link>
            }
          />
        </WorldBody>
      </main>
    );
  }

  const notes = chapterResources.filter((r) => r.type === "Study Notes" || r.type === "Mind Map" || r.type === "Revision");
  const practice = chapterResources.filter((r) => r.type === "Worksheet" || r.type === "Practice Paper");
  const pyqs = chapterResources.filter((r) => r.type === "PYQs");
  const revision = chapterResources.filter((r) => r.type === "Formula Sheet" || r.type === "Sample Paper");

  return (
    <main className="flex-1">
      <WorldHeader
        glyph={subject.glyph}
        world={`CLASS ${cls} · ${subject.name.toUpperCase()} · CHAPTER ${String(index + 1).padStart(2, "0")}`}
        title={chapter.name}
        titleAccent={undefined}
        sub={`Your mission: turn this chapter from a name in the syllabus into a concept you own. Everything you need is on this screen.`}
      >
        <Crumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Classes", href: "/classes" },
            { label: `Class ${cls}`, href: `/classes/${cls}` },
            { label: subject.name, href: `/classes/${cls}/${subjectKey}` },
            { label: chapter.name },
          ]}
        />
      </WorldHeader>

      <WorldBody className="pb-24">
        {/* chapter progress strip */}
        <div className="mb-8 flex items-center gap-3" aria-hidden>
          <div className="flex flex-1 gap-1.5">
            {chapters.map((c, i) => (
              <span
                key={c.name}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  i === index ? "bg-[var(--mc-accent)]" : c.status === "done" ? "bg-[var(--mc-accent)] opacity-40" : "bg-[var(--mc-line)]"
                )}
              />
            ))}
          </div>
          <span className="font-code shrink-0 text-[9px] uppercase tracking-[0.2em] text-faint">
            {index + 1}/{chapters.length}
          </span>
        </div>

        {/* tabs */}
        <div className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label="Chapter resources">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={cn(
                  "btn-mono flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] transition-all duration-300",
                  active
                    ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] text-[var(--mc-accent)]"
                    : "border-[var(--mc-line)] text-dim hover:border-[var(--mc-ink)] hover:text-[var(--mc-ink)]"
                )}
              >
                <t.icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {tab === "learn" && (
              <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                <div className="mc-card relative overflow-hidden p-6 md:p-8">
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-25"
                    style={{ background: `radial-gradient(circle, ${color}, transparent 70%)` }}
                  />
                  <h3 className="font-display text-2xl md:text-[1.7rem]">How this chapter clicks</h3>
                  <ol className="mt-6 flex flex-col gap-5">
                    {[
                      ["See the idea", "One clean explanation of the core concept — no jargon walls."],
                      ["Work an example", "A worked example you can follow line by line, every step justified."],
                      ["Try it yourself", "A small set of practice questions, from gentle to spicy."],
                      ["Prove it in a test", "A short mission that turns 'I understood it' into 'I own it'."],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex gap-4">
                        <span
                          className="font-code flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold"
                          style={{ borderColor: color, color }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="block text-[14.5px] font-semibold leading-snug">{t}</span>
                          <span className="mt-0.5 block text-[13px] leading-relaxed text-dim">{d}</span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-7 border-t border-[var(--mc-line-soft)] pt-5 text-[12px] leading-relaxed text-faint">
                    Full concept notes for this chapter live in the vault below — and CODE can walk
                    you through the idea right now, in plain words.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="mc-card flex flex-1 flex-col p-6">
                    <span className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                      ASK CODE
                    </span>
                    <h4 className="font-display mt-3 text-xl leading-snug">
                      Stuck anywhere in {chapter.name}?
                    </h4>
                    <p className="mt-2 flex-1 text-[13px] leading-relaxed text-dim">
                      CODE explains step by step, quizzes you, and never makes you feel slow.
                    </p>
                    <button
                      onClick={() => setCodeOpen(true)}
                      className="btn-mono mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-5 py-3 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]"
                    >
                      <Sparkles size={12} /> EXPLAIN THIS CHAPTER
                    </button>
                  </div>
                  <div className="mc-card p-6">
                    <span className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                      PREFER A HUMAN?
                    </span>
                    <p className="mt-3 text-[13px] leading-relaxed text-dim">
                      {FOUNDER.name} teaches {subject.name} in person and online.
                    </p>
                    <Link
                      href="/tuition"
                      className="btn-mono mt-4 inline-flex items-center gap-2 text-[10px] text-[var(--mc-accent)]"
                    >
                      REQUEST A DEMO <ArrowUpRight size={11} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {(tab === "notes" || tab === "practice" || tab === "pyqs" || tab === "revision") &&
              renderArtifactTab(
                tab === "notes" ? notes : tab === "practice" ? practice : tab === "pyqs" ? pyqs : revision,
                tab === "notes"
                  ? "NOTES"
                  : tab === "practice"
                    ? "PRACTICE SETS"
                    : tab === "pyqs"
                      ? "PREVIOUS-YEAR QUESTIONS"
                      : "QUICK REVISION",
                tab === "pyqs"
                  ? "PYQ sets for this chapter are being curated from board archives."
                  : "This shelf is being stocked. Meanwhile CODE can quiz you on this chapter right now.",
                setCodeOpen,
                color
              )}

            {tab === "test" && (
              <div className="grid gap-4 md:grid-cols-2">
                {relatedTests.length > 0 ? (
                  relatedTests.map((t) => (
                    <Link
                      key={t.id}
                      href={`/tests/${t.id}`}
                      className="mc-card group flex flex-col p-6 transition-all hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
                    >
                      <span className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                        {t.chapter.toUpperCase()}
                      </span>
                      <span className="font-display mt-2.5 text-xl leading-snug">{t.title}</span>
                      <span className="mt-1.5 text-[12.5px] text-dim">
                        {t.questions.length} questions · {t.minutes} minutes · instant feedback
                      </span>
                      <span className="btn-mono mt-5 inline-flex items-center gap-2 text-[10px] text-[var(--mc-accent)]">
                        START MISSION <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    glyph="🧪"
                    title="The lab is quiet."
                    body="Pick a test and make some noise. Missions for this subject are on their way."
                    action={
                      <Link href="/tests" className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]">
                        OPEN THE TEST LAB
                      </Link>
                    }
                  />
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* neighbours */}
        <div className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--mc-line-soft)] pt-8">
          {index > 0 ? (
            <Link
              href={`/classes/${cls}/${subjectKey}/${slugify(chapters[index - 1].name)}`}
              className="btn-mono group inline-flex items-center gap-2 text-[10px] text-dim hover:text-[var(--mc-accent)]"
            >
              <ArrowUpRight size={11} className="rotate-180 transition-transform group-hover:-translate-x-0.5" />
              {chapters[index - 1].name}
            </Link>
          ) : <span />}
          {index < chapters.length - 1 && (
            <Link
              href={`/classes/${cls}/${subjectKey}/${slugify(chapters[index + 1].name)}`}
              className="btn-mono group inline-flex items-center gap-2 text-[10px] text-dim hover:text-[var(--mc-accent)]"
            >
              {chapters[index + 1].name}
              <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </WorldBody>
    </main>
  );
}

function renderArtifactTab(
  items: typeof RESOURCES,
  title: string,
  emptyBody: string,
  setCodeOpen: (v: boolean) => void,
  color: string
) {
  if (items.length === 0) {
    return (
      <EmptyState
        glyph="📚"
        title="Nothing here yet."
        body={emptyBody}
        action={
          <button
            onClick={() => setCodeOpen(true)}
            className="btn-mono inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]"
          >
            <Sparkles size={12} /> QUIZ ME INSTEAD
          </button>
        }
      />
    );
  }
  return (
    <div>
      <h3 className="font-code mb-5 text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
        {title}
      </h3>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((r) => (
          <Link
            key={r.id}
            href={`/resources/${r.id}`}
            className="mc-card group flex items-center gap-4 p-5 transition-all hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)]"
          >
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--mc-line)]"
              style={{ color }}
            >
              <BookOpen size={17} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold">{r.title}</span>
              <span className="font-code mt-1 block text-[9px] uppercase tracking-[0.16em] text-faint">
                {r.type} · {r.pages} pages · {r.size}
              </span>
            </span>
            <ArrowUpRight size={14} className="shrink-0 text-faint transition-colors group-hover:text-[var(--mc-accent)]" />
          </Link>
        ))}
      </div>
      <p className="font-code mt-6 flex items-center gap-2 text-[9px] uppercase tracking-[0.16em] text-faint">
        <Download size={11} /> PDF downloads live in the Mind Core app
        <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="link-sweep text-[var(--mc-accent)] normal-case">
          Google Play ↗
        </a>
      </p>
    </div>
  );
}
