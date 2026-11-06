import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenCheck,
  FileUp,
  FlaskConical,
  GraduationCap,
  ListChecks,
  LogOut,
  Sparkles,
  Target,
  Trophy,
  Wand2,
} from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser, CLERK_ENABLED } from "@/lib/current-user";
import { googleConfigured } from "@/lib/auth";
import { TestBuilder } from "@/components/mindcode/test-builder";
import { DBTestRunnerLauncher } from "@/components/mindcode/zone-test-list";
import { ClerkSignOut } from "@/components/mindcode/clerk-sign-out";

export const metadata: Metadata = {
  title: "Student Zone — The Mind Code",
  description:
    "Sign in with Google, take real tests built from the founder's question PDFs, and track every score. Your progress, one dashboard.",
};

export const dynamic = "force-dynamic";

/* ------------------------------------------------------------------ */
/* Signed out — the real Google sign-up.                               */
/* ------------------------------------------------------------------ */

function SignInHero({ configured, error }: { configured: boolean; error?: string }) {
  const signInHref = CLERK_ENABLED ? "/sign-in?redirect_url=/zone" : "/api/auth/google";
  return (
    <section className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 42% at 50% 30%, var(--mc-accent-soft), transparent 64%)",
        }}
      />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center px-5 pb-24 pt-24 text-center md:px-8 md:pt-36">
        <span className="font-code inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-3.5 py-1.5 text-[9px] uppercase tracking-[0.2em] text-faint">
          <GraduationCap size={12} className="text-[var(--mc-accent)]" />
          Student Zone
        </span>
        <h1 className="mt-7 text-[clamp(2.4rem,6.4vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.03em]">
          Your scores,
          <br />
          <span className="accent-serif">your universe.</span>
        </h1>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-dim">
          Sign in with Google to take tests built straight from Pankaj sir&apos;s
          question PDFs — then keep every attempt, score and improvement in one
          place.
        </p>

        {error && (
          <p className="mt-6 rounded-2xl border border-[color-mix(in_srgb,var(--mc-accent)_40%,transparent)] bg-[var(--mc-card)] px-4 py-3 text-[12.5px] leading-relaxed text-dim">
            {error === "google_not_configured" ? (
              <>
                Google sign-in is almost live — one step left: the founder
                adds the Google OAuth client keys to the server (Google Cloud
                Console → OAuth client → Web application, redirect URI{" "}
                <span className="text-[var(--mc-ink)]">/api/auth/google/callback</span>).
                Everything else is ready.
              </>
            ) : (
              <>
                Sign-in didn&apos;t finish ({error}). Please try again — if it
                keeps failing, ask the founder to check the Google sign-in
                setup.
              </>
            )}
          </p>
        )}

        <a
          href={signInHref}
          data-cursor="interactive"
          className="group mt-9 inline-flex items-center gap-3 rounded-full border border-[var(--mc-line)] bg-[var(--mc-card)] px-7 py-3.5 transition-all duration-500 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] hover:shadow-[0_10px_40px_-12px_var(--mc-glow)]"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.02.15 3.5 2.7.24.02c2.2-2.05 3.5-5.05 3.5-8.77z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.07 7.9-2.9l-3.76-2.9c-1 .7-2.36 1.2-4.1 1.2a7.1 7.1 0 0 1-6.7-4.9l-.14.01-3.1 2.4-.04.14A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.5A7.4 7.4 0 0 1 4.9 12c0-.9.16-1.7.44-2.5l-.01-.16-3.13-2.43-.1.05A12 12 0 0 0 0 12c0 1.9.47 3.7 1.3 5.4l4-3.9z"
            />
            <path
              fill="#EA4335"
              d="M12 4.6c2.3 0 3.9 1 4.8 1.8l3.5-3.4C18.1 1.2 15.2 0 12 0A12 12 0 0 0 1.3 6.6l4 3.9A7.1 7.1 0 0 1 12 4.6z"
            />
          </svg>
          <span className="btn-mono text-[11px]">CONTINUE WITH GOOGLE</span>
          <ArrowUpRight
            size={13}
            className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </a>

        {!CLERK_ENABLED && (
          <p className="font-code mt-5 max-w-md text-[9px] uppercase leading-relaxed tracking-[0.18em] text-faint">
            One-time setup: the founder adds the Google OAuth client keys to the
            server, then this button signs every student in for real.
          </p>
        )}

        <p className="font-code mt-8 text-[9px] uppercase tracking-[0.2em] text-faint">
          Free forever · No password stored · Only your Google profile
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Signed in — the dashboard.                                          */
/* ------------------------------------------------------------------ */

export default async function ZonePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await getCurrentUser();

  if (!user) return <SignInHero configured={googleConfigured() || CLERK_ENABLED} error={error} />;

  const [attempts, tests] = await Promise.all([
    db.testAttempt.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { test: { select: { id: true, title: true, subject: true, cls: true } } },
    }),
    db.test.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const attemptedTestIds = new Set(attempts.map((a) => a.testId));
  const scores = attempts.map((a) => (a.total > 0 ? (a.score / a.total) * 100 : 0));
  const avg = scores.length ? Math.round(scores.reduce((s, x) => s + x, 0) / scores.length) : null;
  const best = scores.length ? Math.round(Math.max(...scores)) : null;
  const freshTests = tests.filter((t) => !attemptedTestIds.has(t.id));

  return (
    <main className="flex-1">
      {/* header */}
      <section className="relative overflow-hidden pt-28 md:pt-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 42% at 80% 20%, var(--mc-accent-soft), transparent 64%)",
          }}
        />
        <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-5 md:px-8">
          <div>
            <p className="eyebrow flex items-center gap-3">
              <span className="inline-block h-px w-8 bg-[var(--mc-accent)]" aria-hidden />
              Student Zone
            </p>
            <h1 className="font-display mt-4 text-[clamp(2rem,5vw,3.4rem)] leading-tight tracking-[-0.02em]">
              {user.name ?? "Student"}
              <span className="accent-serif">&apos;s lab.</span>
            </h1>
            <p className="mt-2 text-[13px] text-dim">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {user.image && (
              <img
                src={user.image}
                alt=""
                className="h-11 w-11 rounded-full border border-[var(--mc-line)] object-cover"
              />
            )}
            {CLERK_ENABLED ? (
              <ClerkSignOut />
            ) : (
              <a
                href="/api/auth/signout"
                className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-5 py-2.5 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
              >
                <LogOut size={12} />
                SIGN OUT
              </a>
            )}
          </div>
        </div>
      </section>

      {/* stats */}
      <section className="mx-auto mt-10 max-w-6xl px-5 md:px-8">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-line)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-[var(--mc-card)] p-5">
            <StatCardLike icon={<ListChecks size={12} />} label="TESTS TAKEN" value={String(attempts.length)} note="Every attempt is saved" />
          </div>
          <div className="bg-[var(--mc-card)] p-5">
            <StatCardLike icon={<Target size={12} />} label="AVERAGE SCORE" value={avg !== null ? `${avg}%` : "—"} note={attempts.length ? "Across all attempts" : "Take your first test"} />
          </div>
          <div className="bg-[var(--mc-card)] p-5">
            <StatCardLike icon={<Trophy size={12} />} label="BEST SCORE" value={best !== null ? `${best}%` : "—"} note="Your personal record" />
          </div>
          <div className="bg-[var(--mc-card)] p-5">
            <StatCardLike icon={<FlaskConical size={12} />} label="FRESH TESTS" value={String(freshTests.length)} note="Not attempted yet" />
          </div>
        </div>
      </section>

      {/* tests */}
      <section className="mx-auto mt-14 max-w-6xl px-5 md:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl md:text-3xl">
            Test <span className="accent-serif">missions.</span>
          </h2>
          <p className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">
            Built from sir&apos;s PDFs · graded instantly
          </p>
        </div>
        <DBTestRunnerLauncher
          tests={tests.map((t) => ({
            id: t.id,
            title: t.title,
            subject: t.subject,
            cls: t.cls,
            minutes: t.minutes,
            count: JSON.parse(t.questions as string).length as number,
            attempted: attemptedTestIds.has(t.id),
          }))}
        />
      </section>

      {/* attempts history */}
      <section className="mx-auto mt-14 max-w-6xl px-5 pb-24 md:px-8">
        <h2 className="font-display text-2xl md:text-3xl">
          Attempt <span className="accent-serif">log.</span>
        </h2>
        {attempts.length === 0 ? (
          <div className="mc-card mt-5 flex flex-col items-center gap-3 p-10 text-center">
            <Sparkles size={20} className="text-[var(--mc-accent)]" />
            <p className="text-[14px] font-semibold">No attempts yet.</p>
            <p className="max-w-sm text-[13px] text-dim">
              Pick a test mission above. Your score lands here the moment you
              submit — and it never gets deleted.
            </p>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2">
            {attempts.map((a) => {
              const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
              return (
                <div
                  key={a.id}
                  className="mc-card flex flex-wrap items-center gap-x-5 gap-y-2 p-5"
                >
                  <span
                    className={`font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-[15px] ${
                      pct >= 80
                        ? "border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] text-[var(--mc-accent)]"
                        : "border-[var(--mc-line)] text-dim"
                    }`}
                  >
                    {pct}%
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold">{a.test.title}</span>
                    <span className="font-code mt-0.5 block text-[9px] uppercase tracking-[0.18em] text-faint">
                      {a.test.subject} · Class {a.test.cls} · {a.score}/{a.total} correct ·{" "}
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(a.createdAt)}
                    </span>
                  </span>
                  <Link
                    href={`/zone/test/${a.testId}`}
                    className="btn-mono inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                  >
                    <BookOpenCheck size={11} />
                    RETRY
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* admin — the real Test Builder */}
      {user.admin && (
        <section className="mx-auto max-w-6xl px-5 pb-28 md:px-8">
          <div className="mc-card relative overflow-hidden p-7 md:p-10">
            <span
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-25"
              style={{ background: "radial-gradient(circle, var(--mc-glow), transparent 70%)" }}
              aria-hidden
            />
            <p className="font-code flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-faint">
              <Wand2 size={13} className="text-[var(--mc-accent)]" />
              Test Builder · admin {user.email}
            </p>
            <h2 className="font-display mt-3 text-[clamp(1.5rem,3.2vw,2.2rem)] leading-tight">
              Upload the PDF. <span className="accent-serif">Get a real test.</span>
            </h2>
            <p className="mt-2 flex max-w-2xl items-start gap-2 text-[13.5px] leading-relaxed text-dim">
              <FileUp size={15} className="mt-0.5 shrink-0 text-[var(--mc-accent)]" />
              Drop a question-bank PDF below — the server reads it, drafts MCQs
              from the actual text, you edit and publish. Students see it here,
              instantly.
            </p>
            <TestBuilder />
          </div>
        </section>
      )}
    </main>
  );
}

/* Local presentational wrapper so the four stat blocks share one shape
   without dragging framer-motion into this server component. */
function StatCardLike({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-code flex items-center gap-2 text-[9px] uppercase tracking-[0.22em] text-faint">
        {icon}
        {label}
      </span>
      <span className="font-display mt-1 text-3xl leading-none">{value}</span>
      <span className="text-[12px] text-dim">{note}</span>
    </div>
  );
}
