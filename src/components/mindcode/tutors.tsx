"use client";

/* ============================================================
   /tuition/teachers + /tuition/teachers/[id]
   Tutor discovery & profile — verified teachers only.
   ============================================================ */

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  GraduationCap,
  Linkedin,
  MapPin,
  Sparkles,
} from "lucide-react";
import { TUTORS, tutorById, FOUNDER, LINKEDIN_URL } from "./data";
import { Crumbs, EmptyState, WorldBody, WorldHeader } from "./world-shell";

/* ---------------- discovery ---------------- */

export function TeacherDiscovery() {
  return (
    <main className="flex-1">
      <WorldHeader
        glyph="👨‍🏫"
        world="TUTOR DISCOVERY"
        title="Meet your"
        titleAccent="guides."
        sub="Every teacher here is real and verified — no paid listings, no inflated profiles. The network grows one careful hand-pick at a time."
      >
        <Crumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Home Tuition", href: "/tuition" },
            { label: "Teachers" },
          ]}
        />
      </WorldHeader>

      <WorldBody className="pb-24">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TUTORS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.06 * i }}
            >
              <Link
                href={`/tuition/teachers/${t.id}`}
                data-cursor="interactive"
                className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--mc-line)] bg-[var(--mc-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-[color-mix(in_srgb,var(--mc-accent)_50%,transparent)] hover:shadow-[0_24px_60px_-24px_var(--mc-glow)]"
              >
                <div className="relative h-44 overflow-hidden">
                              <img
                    src={t.photo}
                    alt={t.name}
                    className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  {t.verified && (
                    <span className="font-code absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--mc-bg)_85%,transparent)] px-2.5 py-1.5 text-[8.5px] uppercase tracking-[0.16em] text-[var(--mc-accent)] backdrop-blur">
                      <BadgeCheck size={10} /> verified
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-xl">{t.name}</h3>
                  <p className="mt-0.5 text-[12px] text-dim">{t.role}</p>
                  <p className="mt-3 flex flex-wrap gap-1.5">
                    {t.subjects.map((s) => (
                      <span key={s} className="rounded-full border border-[var(--mc-line)] px-2.5 py-1 text-[10.5px] text-dim">
                        {s}
                      </span>
                    ))}
                  </p>
                  <p className="font-code mt-3 flex items-center gap-1.5 text-[9px] uppercase tracking-[0.16em] text-faint">
                    <GraduationCap size={11} /> Classes {t.classes[0]}–{t.classes[t.classes.length - 1]}
                    <span className="opacity-40">·</span>
                    <MapPin size={11} /> {t.location}
                  </p>
                  <span className="btn-mono mt-auto inline-flex items-center gap-2 pt-5 text-[9.5px] text-[var(--mc-accent)]">
                    VIEW PROFILE
                    <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* honest growth card */}
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--mc-line)] p-8 text-center">
            <span className="font-display flex h-12 w-12 items-center justify-center rounded-full border border-[var(--mc-line)] text-lg text-faint" aria-hidden>
              ✦
            </span>
            <p className="font-display mt-4 text-lg leading-snug">More guides are being hand-picked.</p>
            <p className="mt-2 max-w-xs text-[12.5px] leading-relaxed text-dim">
              Teachers join The Mind Code network only after a real demo and syllabus deep-dive.
            </p>
            <Link href="/tuition" className="btn-mono mt-5 text-[9.5px] text-[var(--mc-accent)]">
              REQUEST A TEACHER →
            </Link>
          </div>
        </div>
      </WorldBody>
    </main>
  );
}

/* ---------------- profile ---------------- */

export function TutorProfile({ id }: { id: string }) {
  const t = tutorById(id);

  if (!t) {
    return (
      <main className="flex-1">
        <WorldHeader
          glyph="✦"
          world="TUTOR PROFILE"
          title="Guide not"
          titleAccent="found."
          sub="This profile does not exist — and we never list anyone unverified."
        />
        <WorldBody className="pb-24">
          <EmptyState
            glyph="🧭"
            title="Nothing here yet."
            body="Browse the verified teachers who are live on the platform today."
            action={
              <Link href="/tuition/teachers" className="btn-mono rounded-full bg-[var(--mc-cta-bg)] px-6 py-3 text-[10.5px] text-[var(--mc-cta-fg)]">
                MEET THE GUIDES
              </Link>
            }
          />
        </WorldBody>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-6xl px-5 pb-24 pt-24 md:px-8 md:pt-28">
        <Crumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Home Tuition", href: "/tuition" },
            { label: "Teachers", href: "/tuition/teachers" },
            { label: t.name },
          ]}
        />

        {/* hero card */}
        <div className="mc-card relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 55% 70% at 85% 10%, var(--mc-accent-soft), transparent 65%)",
            }}
          />
          <div className="relative grid gap-8 p-6 md:grid-cols-[280px_1fr] md:p-10">
            <div>
              <div
                className="overflow-hidden rounded-3xl border border-[var(--mc-line)]"
                style={{ boxShadow: "0 24px 70px -28px var(--mc-glow)" }}
              >
                          <img src={t.photo} alt={t.name} className="aspect-[4/5] w-full object-cover object-top" />
              </div>
              {t.verified && (
                <p className="font-code mt-4 flex items-center justify-center gap-2 text-[9px] uppercase tracking-[0.2em] text-[var(--mc-accent)]">
                  <BadgeCheck size={12} /> IDENTITY & CREDENTIALS VERIFIED
                </p>
              )}
            </div>

            <div className="flex flex-col">
              <p className="eyebrow">{t.role.toUpperCase()}</p>
              <h1 className="font-display mt-3 text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
                {t.name}
              </h1>

              <div className="mt-5 flex flex-wrap gap-2">
                {t.subjects.map((s) => (
                  <span key={s} className="rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[12px] text-dim">
                    {s}
                  </span>
                ))}
                <span className="rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[12px] text-dim">
                  Classes {t.classes[0]}–{t.classes[t.classes.length - 1]}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[12px] text-dim">
                  <MapPin size={11} /> {t.location}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[12px] text-dim">
                  <Clock size={11} /> Teaching since {t.experience.replace("Since ", "")}
                </span>
              </div>

              <div className="mt-7">
                <h2 className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">ABOUT</h2>
                <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-dim">{t.about}</p>
              </div>

              <div className="mt-6">
                <h2 className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                  TEACHING APPROACH
                </h2>
                <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-dim">{t.approach}</p>
              </div>

              <div className="mt-6">
                <h2 className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">MODES</h2>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {t.modes.map((m) => (
                    <span
                      key={m}
                      className="rounded-full border border-[color-mix(in_srgb,var(--mc-accent)_40%,transparent)] bg-[var(--mc-accent-soft)] px-3 py-1.5 text-[12px] text-[var(--mc-accent)]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-8">
                <Link
                  href="/tuition#request"
                  className="btn-mono group inline-flex items-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-7 py-4 text-[11px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-10px_var(--mc-glow)] transition-transform hover:scale-[1.03]"
                >
                  <Sparkles size={13} /> REQUEST A DEMO
                  <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
                <a
                  href={t.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-mono inline-flex items-center gap-2 rounded-full border border-[var(--mc-line)] px-6 py-4 text-[10.5px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                >
                  <Linkedin size={13} /> VERIFIED LINKEDIN
                </a>
              </div>

              <p className="mt-5 text-[12px] leading-relaxed text-faint">
                Availability: {t.availability}
              </p>
            </div>
          </div>
        </div>

        {/* honest note on reviews */}
        <div className="mc-card mt-6 flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:p-7">
          <span className="font-display flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--mc-line)] text-lg text-faint" aria-hidden>
            ★
          </span>
          <p className="flex-1 text-[13.5px] leading-relaxed text-dim">
            <span className="font-semibold text-[var(--mc-ink)]">About reviews:</span> we only
            publish feedback we can verify — so this profile carries none yet. Ask real families in a
            demo, or read the one review we have verified on the{" "}
            <Link href="/reviews" className="link-sweep text-[var(--mc-accent)]">
              Wall of Trust
            </Link>
            .
          </p>
        </div>

        <Link
          href="/tuition/teachers"
          className="btn-mono mt-8 inline-flex items-center gap-2 text-[10px] text-dim transition-colors hover:text-[var(--mc-accent)]"
        >
          <ArrowLeft size={12} /> ALL TEACHERS
        </Link>
      </div>
    </main>
  );
}

/* founders-referenced guard */
void FOUNDER;
void LINKEDIN_URL;
