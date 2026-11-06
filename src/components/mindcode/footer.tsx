"use client";

import { Instagram, Youtube, Mail, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  SITE_URL,
  EMAIL,
  INSTAGRAM_URL,
  LINKTREE_URL,
  APP_URL,
} from "./data";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { label: "Classes", href: "/classes" },
      { label: "Free Resources", href: "/resources" },
      { label: "Test Lab", href: "/tests" },
      { label: "CODE Studio — AI canvas", href: "/studio" },
      { label: "AI Classroom — whiteboard tutor", href: "/tutor" },
    ],
  },
  {
    title: "The Mind Code",
    links: [
      { label: "CODE AI", href: "/code" },
      { label: "Home Tuition", href: "/tuition" },
      { label: "Books", href: "/books" },
      { label: "Our story", href: "/about" },
    ],
  },
  {
    title: "Find us",
    links: [
      { label: "Instagram", href: INSTAGRAM_URL, external: true, icon: Instagram },
      { label: "YouTube", href: LINKTREE_URL, external: true, icon: Youtube },
      { label: "hello@themindcode.in", href: `mailto:${EMAIL}`, icon: Mail },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-[var(--mc-line)]">
      <div className="mx-auto max-w-6xl px-5 pb-28 pt-14 md:px-8 md:pb-16">
        <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
          {/* brand */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-[#f6f1e8] p-3 shadow-[0_2px_14px_rgba(0,0,0,0.14)] transition-transform hover:scale-[1.02]"
              aria-label="The Mind Code — Dream to Destiny Blueprint"
            >
              {/* official logo — shield, open book, bulb & brain */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="The Mind Code — Dream to Destiny Blueprint"
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
                draggable={false}
              />
            </Link>
            <p className="mt-4 max-w-[240px] text-[13px] leading-relaxed text-dim">
              Crack the concept. Own the exam. A learning universe for Classes 6–10 —
              free, forever.
            </p>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-mono group mt-5 inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-4 py-2 text-[10px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
            >
              Get the app — Google Play
              <ArrowUpRight size={11} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-code text-[9.5px] uppercase tracking-[0.28em] text-faint">
                {col.title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {col.links.map((l) => {
                  const inner = (
                    <>
                      {"icon" in l && l.icon && <l.icon size={13} className="text-faint" />}
                      {l.label}
                    </>
                  );
                  return (
                    <li key={l.label}>
                      {"external" in l && l.external ? (
                        <a
                          href={l.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link-sweep inline-flex items-center gap-2 text-[13px] text-dim transition-colors hover:text-[var(--mc-ink)]"
                        >
                          {inner}
                        </a>
                      ) : l.href.startsWith("/") ? (
                        <Link
                          href={l.href}
                          className="link-sweep inline-flex items-center gap-2 text-[13px] text-dim transition-colors hover:text-[var(--mc-ink)]"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <a
                          href={l.href}
                          className="link-sweep inline-flex items-center gap-2 text-[13px] text-dim transition-colors hover:text-[var(--mc-ink)]"
                        >
                          {inner}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="font-code mt-12 flex flex-col items-center justify-between gap-3 border-t border-[var(--mc-line-soft)] pt-6 text-[10px] uppercase tracking-[0.14em] text-faint md:flex-row">
          <span>© 2026 the mind code Learning. Made for your next chapter.</span>
          <span className="flex gap-5">
            <Link href="/reviews" className="link-sweep">
              Wall of Trust
            </Link>
            <Link href="/about" className="link-sweep">
              About
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
