"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpenCheck, CircleCheck, Clock3 } from "lucide-react";

/* The zone dashboard's test-mission list — server data, client links. */
export type ZoneTestItem = {
  id: string;
  title: string;
  subject: string;
  cls: number;
  minutes: number;
  count: number;
  attempted: boolean;
};

export function DBTestRunnerLauncher({ tests }: { tests: ZoneTestItem[] }) {
  if (tests.length === 0) {
    return (
      <div className="mc-card mt-5 flex flex-col items-center gap-3 p-10 text-center">
        <Clock3 size={20} className="text-[var(--mc-accent)]" />
        <p className="text-[14px] font-semibold">No tests published yet.</p>
        <p className="max-w-sm text-[13px] text-dim">
          The founder builds these from real question PDFs. The moment one is
          published, it appears here — for every student, instantly.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tests.map((t) => (
        <Link
          key={t.id}
          href={`/zone/test/${t.id}`}
          data-cursor="interactive"
          className="mc-card group flex h-full flex-col gap-2 p-5 transition-all duration-500 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)]"
        >
          <span className="flex items-center justify-between">
            <span className="font-code rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[8px] uppercase tracking-[0.16em] text-faint">
              {t.subject} · CL {t.cls}
            </span>
            {t.attempted ? (
              <span className="font-code inline-flex items-center gap-1 text-[8.5px] uppercase tracking-[0.16em] text-[var(--mc-accent)]">
                <CircleCheck size={10} />
                Attempted
              </span>
            ) : (
              <span className="font-code text-[8.5px] uppercase tracking-[0.16em] text-faint">
                New
              </span>
            )}
          </span>
          <span className="mt-2 block text-[14.5px] font-semibold leading-snug">{t.title}</span>
          <span className="font-code text-[9px] uppercase tracking-[0.18em] text-faint">
            {t.count} questions · {t.minutes} min
          </span>
          <span className="btn-mono mt-3 inline-flex items-center gap-1.5 text-[10px] text-[var(--mc-accent)]">
            <BookOpenCheck size={12} />
            {t.attempted ? "RETRY MISSION" : "START MISSION"}
            <ArrowUpRight
              size={11}
              className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </Link>
      ))}
    </div>
  );
}
