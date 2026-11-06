"use client";

import { useMemo, useState, type MouseEvent } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Download, ArrowUpRight, SlidersHorizontal, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RESOURCES,
  RESOURCE_TYPES,
  SUBJECTS,
  SITE_URL,
  STATS,
  type Resource,
  type ResourceType,
  type SubjectKey,
} from "./data";
import { SectionHeading } from "./section-heading";
import { Reveal, Stagger, StaggerItem } from "./reveal";
import { useUniverse } from "./store";

/* ------------------------------------------------------------------ */
/* Artifact card with perspective tilt                                 */
/* ------------------------------------------------------------------ */

export function ArtifactCard({ r, featured }: { r: Resource; featured?: boolean }) {
  const subject = SUBJECTS.find((s) => s.key === r.subject)!;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${px * 7}deg) rotateX(${py * -7}deg) translateY(-4px)`;
    el.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(py + 0.5) * 100}%`);
  }

  function onLeave(e: MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = "";
  }

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border bg-[var(--mc-card)] transition-transform duration-300 will-change-transform",
        "border-[var(--mc-line)] hover:border-[color-mix(in_srgb,var(--mc-accent)_55%,transparent)]"
      )}
      style={{ ["--mx" as string]: "50%", ["--my" as string]: "50%" }}
    >
      {/* cursor-follow sheen */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx) var(--my), var(--mc-accent-soft), transparent 60%)",
        }}
      />

      <div className={cn("p-5", featured && "p-6 md:p-7")}>
        <div className="flex items-center justify-between gap-3">
          <span className="artifact-meta">
            CLASS {r.cls} · {subject.name.toUpperCase()}
          </span>
          <span className="font-display text-[10px] tracking-[0.25em] text-faint">
            {r.index}
          </span>
        </div>

        <h3
          className={cn(
            "font-display mt-3 text-xl leading-snug tracking-tight md:text-[1.35rem]",
            featured && "text-2xl md:text-[1.7rem]"
          )}
        >
          {r.title}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 text-xs text-dim">
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: `var(${subject.varName})` }}
          />
          {r.chapter}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-faint">
          <span className="rounded-full border border-[var(--mc-line)] px-2 py-0.5">
            {r.type}
          </span>
          <span>PDF · {r.size}</span>
          <span>{r.pages} pages</span>
          {r.verified && (
            <span className="text-[var(--mc-accent)]" title="Featured on themindcode.in">
              ★ site favourite
            </span>
          )}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--mc-line-soft)] px-5 py-3.5 md:px-6">
        <span className="btn-mono text-[10px] text-[var(--mc-accent)]">
          FREE
        </span>
        <Link
          href={`/resources/${r.id}`}
          className="btn-mono flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3.5 py-1.5 text-[10px] transition-all duration-300 hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
          aria-label={`Open ${r.title} in the reader`}
        >
          <BookOpen size={12} />
          OPEN
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vault                                                               */
/* ------------------------------------------------------------------ */

const DIFFICULTIES = ["Beginner", "Core", "Advanced"] as const;
const CLASS_OPTIONS = [6, 7, 8, 9, 10] as const;

export function Vault() {
  const vaultClass = useUniverse((s) => s.vaultClass);
  const vaultSubject = useUniverse((s) => s.vaultSubject);
  const setVaultFilter = useUniverse((s) => s.setVaultFilter);

  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "all">("all");
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTIES)[number] | "all">("all");

  const featured = RESOURCES.filter((r) => r.verified);

  const filtered = useMemo(() => {
    return RESOURCES.filter((r) => {
      if (vaultClass !== "all" && r.cls !== vaultClass) return false;
      if (vaultSubject !== "all" && r.subject !== vaultSubject) return false;
      if (type !== "all" && r.type !== type) return false;
      if (difficulty !== "all" && r.difficulty !== difficulty) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${r.title} ${r.chapter} ${r.type} ${SUBJECTS.find((s) => s.key === r.subject)?.name}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [vaultClass, vaultSubject, type, difficulty, query]);

  const activeFilters =
    (vaultClass !== "all" ? 1 : 0) +
    (vaultSubject !== "all" ? 1 : 0) +
    (type !== "all" ? 1 : 0) +
    (difficulty !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function reset() {
    setVaultFilter("all", "all");
    setType("all");
    setDifficulty("all");
    setQuery("");
  }

  return (
    <section id="vault" className="mc-section relative">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeading
          index="02"
          eyebrow="THE FREE KNOWLEDGE VAULT"
          title={
            <>
              Collect knowledge,{" "}
              <span className="accent-serif">artifact</span> by artifact.
            </>
          }
          lede={`${STATS[0].value} free resources — teacher-reviewed, syllabus-aligned, ready to print. Download once, learn anywhere. Yours forever.`}
        />

        {/* featured — a few student favourites */}
        <Reveal variant="rise">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              A few student favourites
            </h3>
            <span className="font-code hidden text-[9.5px] uppercase tracking-[0.18em] text-faint sm:block">
              TEACHER-REVIEWED · SYLLABUS-ALIGNED · READY TO PRINT
            </span>
          </div>
        </Reveal>
        <Stagger className="no-scrollbar -mx-5 mb-20 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0" gap={0.08}>
          {featured.map((r) => (
            <StaggerItem key={r.id} className="w-[300px] shrink-0 snap-start md:w-auto">
              <ArtifactCard r={r} featured />
            </StaggerItem>
          ))}
        </Stagger>

        {/* the vault */}
        <Reveal variant="rise">
          <div className="mb-6 flex items-baseline justify-between">
            <h3 className="font-code text-[10.5px] font-bold uppercase tracking-[0.32em] text-dim">
              The full vault
            </h3>
            <span className="font-code text-[10px] uppercase tracking-[0.2em] text-faint">
              {filtered.length} ARTIFACT{filtered.length === 1 ? "" : "S"} IN VIEW
            </span>
          </div>
        </Reveal>

        {/* controls */}
        <Reveal variant="rise" className="mb-8">
          <div className="mc-card p-4 md:p-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label className="relative flex-1">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint"
                  />
                  <span className="sr-only">Search resources</span>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search chapters, subjects, types…"
                    className="w-full rounded-full border border-[var(--mc-line)] bg-[var(--mc-bg)] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-faint focus:border-[var(--mc-accent)]"
                  />
                </label>
                {activeFilters > 0 && (
                  <button
                    onClick={reset}
                    className="shrink-0 rounded-full border border-[var(--mc-line)] px-4 py-2.5 text-xs font-medium text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                  >
                    Clear {activeFilters} filter{activeFilters > 1 ? "s" : ""}
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <FilterGroup label="Class">
                  <Chip active={vaultClass === "all"} onClick={() => setVaultFilter("all", vaultSubject)}>
                    All
                  </Chip>
                  {CLASS_OPTIONS.map((c) => (
                    <Chip
                      key={c}
                      active={vaultClass === c}
                      onClick={() => setVaultFilter(c, vaultSubject)}
                    >
                      {c}
                    </Chip>
                  ))}
                </FilterGroup>

                <FilterGroup label="Subject">
                  <Chip active={vaultSubject === "all"} onClick={() => setVaultFilter(vaultClass, "all")}>
                    All
                  </Chip>
                  {SUBJECTS.filter((s) => s.key !== "sanskrit").map((s) => (
                    <Chip
                      key={s.key}
                      active={vaultSubject === s.key}
                      onClick={() => setVaultFilter(vaultClass, s.key)}
                      dot={`var(${s.varName})`}
                    >
                      {s.name}
                    </Chip>
                  ))}
                </FilterGroup>

                <FilterGroup label="Type">
                  <Chip active={type === "all"} onClick={() => setType("all")}>
                    All
                  </Chip>
                  {RESOURCE_TYPES.map((t) => (
                    <Chip key={t} active={type === t} onClick={() => setType(t)}>
                      {t}
                    </Chip>
                  ))}
                </FilterGroup>

                <FilterGroup label="Level">
                  <Chip active={difficulty === "all"} onClick={() => setDifficulty("all")}>
                    All
                  </Chip>
                  {DIFFICULTIES.map((d) => (
                    <Chip key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                      {d}
                    </Chip>
                  ))}
                </FilterGroup>
              </div>
            </div>
          </div>
        </Reveal>

        {/* grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length > 0 ? (
            <motion.div
              key="grid"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((r) => (
                <ArtifactCard key={r.id} r={r} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mc-card flex flex-col items-center gap-4 px-6 py-16 text-center"
            >
              <SlidersHorizontal size={22} className="text-faint" />
              <p className="max-w-sm text-sm leading-relaxed text-dim">
                No artifacts match this corner of the universe. Loosen a filter — or
                open the full library on themindcode.in.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={reset}
                  className="btn-mono rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                >
                  RESET FILTERS
                </button>
                <a
                  href={SITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mono flex items-center gap-1.5 rounded-full bg-[var(--mc-cta-bg)] px-5 py-2.5 text-[10px] text-[var(--mc-cta-fg)]"
                >
                  FULL LIBRARY <ArrowUpRight size={12} />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-[0.2em] text-faint">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  dot,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-300",
        active
          ? "border-[var(--mc-accent)] bg-[var(--mc-accent-soft)] text-[var(--mc-accent)]"
          : "border-[var(--mc-line)] text-dim hover:border-[color:var(--mc-ink)] hover:text-[var(--mc-ink)]"
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: active ? dot : `color-mix(in srgb, ${dot} 55%, transparent)` }}
        />
      )}
      {children}
    </button>
  );
}
