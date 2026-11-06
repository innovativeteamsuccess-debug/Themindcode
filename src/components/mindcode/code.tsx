"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CODE_SUGGESTIONS } from "./data";
import { useUniverse } from "./store";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type Msg = { role: "user" | "assistant"; content: string };

/* ------------------------------------------------------------------ */
/* CODE — the official mascot of The Mind Code.                        */
/* Rendered from the character sheet: headphones, glasses, </> hoodie. */
/* ------------------------------------------------------------------ */

const FACE_SRC = {
  happy: "/mascot/code-face.png",
  thinking: "/mascot/code-face-thinking.png",
} as const;

export function CodeEntity({
  size = 34,
  mood = "happy",
  className,
}: {
  size?: number;
  mood?: keyof typeof FACE_SRC;
  className?: string;
}) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      {/* breathing glow disc */}
      <span
        className="mc-breathe absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, #ffffff 0%, #e8f1fe 34%, #9cc6fd 62%, #3b82f6 96%)",
          boxShadow: "0 0 22px var(--mc-glow), inset 0 -3px 8px rgba(7,26,51,0.18)",
        }}
      />
      {/* the mascot himself */}
      <img
        src={FACE_SRC[mood]}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className="relative z-10 h-full w-full scale-[1.14] object-contain"
        style={{ filter: "drop-shadow(0 3px 6px rgba(7,26,51,0.35))" }}
      />
      {/* thin halo ring */}
      <span className="absolute inset-[-3px] rounded-full border border-[var(--mc-line)]" />
    </span>
  );
}

/** Full mascot figure for feature slots (homepage section, workspace header). */
export function CodeFigure({ height = 150 }: { height?: number }) {
  return (
    <span
      className="relative inline-flex flex-col items-center"
      style={{ height }}
      aria-hidden
    >
      {/* grounded glow */}
      <span
        className="absolute rounded-[50%]"
        style={{
          bottom: "-4%",
          width: "78%",
          height: "12%",
          background:
            "radial-gradient(ellipse at center, rgba(59,130,246,0.4), rgba(59,130,246,0.08) 55%, transparent 75%)",
          filter: "blur(6px)",
        }}
      />
      {/* hero figure */}
      <img
        src="/mascot/code-hero.png"
        alt=""
        draggable={false}
        className="mc-float relative h-full w-auto object-contain"
        style={{
          filter: "drop-shadow(0 14px 28px rgba(7,26,51,0.45)) drop-shadow(0 0 34px rgba(59,130,246,0.22))",
          maskImage: "linear-gradient(to bottom, black 88%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 88%, transparent 100%)",
        }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */

export function CodeSection() {
  const setCodeOpen = useUniverse((s) => s.setCodeOpen);

  return (
    <section id="code-anchor" className="mc-section relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 45% at 50% 45%, var(--mc-accent-soft), transparent 65%)",
        }}
      />
      <div className="relative mx-auto max-w-4xl px-5 text-center md:px-8">
        <SectionHeading
          index="05"
          eyebrow="MEET CODE"
          title={
            <>
              Your learning{" "}
              <span className="accent-serif">companion</span>.
            </>
          }
          lede="CODE is the mascot of The Mind Code — a curious study buddy who explains, quizzes, hints and revises with you. Ask him to make learning simple, visual and fun."
          align="center"
        />

        <Reveal variant="core" className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 -m-10 rounded-full border border-dashed border-[var(--mc-line)] mc-spin-slower" />
            <CodeFigure height={168} />
          </div>
        </Reveal>

        <Reveal variant="rise" delay={0.15}>
          <div className="mx-auto mt-8 grid max-w-2xl gap-2.5 sm:grid-cols-2">
            {CODE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setCodeOpen(true)}
                className="group flex items-center justify-between gap-3 rounded-full border border-[var(--mc-line)] px-5 py-3 text-left text-[13px] text-dim transition-all duration-300 hover:border-[var(--mc-accent)] hover:text-[var(--mc-ink)]"
              >
                “{s}”
                <Send size={12} className="shrink-0 -rotate-45 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal variant="rise">
          <button
            onClick={() => setCodeOpen(true)}
            className="btn-mono mt-10 rounded-full bg-[var(--mc-cta-bg)] px-8 py-4 text-[12px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-10px_var(--mc-glow)] transition-transform duration-300 hover:scale-[1.04]"
          >
            TALK TO CODE
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Floating chat                                                       */
/* ------------------------------------------------------------------ */

export function CodeChat() {
  const open = useUniverse((s) => s.codeOpen);
  const setOpen = useUniverse((s) => s.setCodeOpen);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm CODE — the mascot of The Mind Code. Stuck on a chapter? Want a quiz? Or shall I build you a tiny revision plan? ✦",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [teaser, setTeaser] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setTeaser(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Msg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.slice(-12).map(({ role, content: c }) => ({ role, content: c })),
        }),
      });
      const data = await res.json();
      const reply =
        res.ok && data.ok
          ? data.reply
          : res.status === 401
            ? "Log in first — tap the LOG IN button up top. It's free, and then we can talk all you want ✦"
            : "I drifted out of orbit for a second — ask me again?";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Signal lost inside the core. Give it another try ✦",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {/* floating trigger */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, scale: 0.6, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 16 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(true)}
            aria-label="Open CODE, your AI learning companion"
            className="fixed bottom-[86px] right-4 z-[95] hidden items-center gap-2.5 rounded-full border border-[var(--mc-line)] bg-[var(--mc-card)] py-2 pl-2 pr-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] md:bottom-24 md:right-6 md:flex"
          >
            <CodeEntity size={34} />
            <span className="btn-mono text-[11px] text-[var(--mc-ink)]">
              CODE
            </span>
            {teaser && (
              <span className="absolute -left-1 -top-1 flex h-3 w-3">
                <span className="mc-ping absolute inset-0 rounded-full bg-[var(--mc-accent)]" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-[var(--mc-accent)]" />
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-label="CODE chat"
            className="mc-glass fixed inset-x-3 bottom-[86px] z-[96] flex max-h-[70vh] flex-col overflow-hidden rounded-3xl shadow-[0_30px_90px_-20px_rgba(0,0,0,0.6)] md:inset-x-auto md:bottom-6 md:right-6 md:h-[560px] md:max-h-[76vh] md:w-[400px]"
          >
            {/* header */}
            <div className="flex items-center gap-3 border-b border-[var(--mc-line)] px-5 py-4">
              <CodeEntity size={38} mood={busy ? "thinking" : "happy"} />
              <div className="flex-1">
                <div className="btn-mono text-[13px] text-[var(--mc-ink)]">
                  CODE
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-dim">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--mc-accent)]" />
                  {busy ? "thinking hard…" : "inside the Mind Core — awake"}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mc-line)] text-dim transition-colors hover:text-[var(--mc-ink)]"
                aria-label="Close chat"
              >
                <X size={14} />
              </button>
            </div>

            {/* messages */}
            <div
              ref={scrollRef}
              className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 py-5"
            >
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed",
                    m.role === "user"
                      ? "self-end rounded-br-md bg-[var(--mc-accent-deep)] text-white"
                      : "self-start rounded-bl-md border border-[var(--mc-line)] bg-[var(--mc-card)]"
                  )}
                >
                  {m.content}
                </motion.div>
              ))}

              {busy && (
                <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-[var(--mc-line)] bg-[var(--mc-card)] px-4 py-3.5">
                  {[0, 1, 2].map((d) => (
                    <motion.span
                      key={d}
                      className="h-1.5 w-1.5 rounded-full bg-[var(--mc-accent)]"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                    />
                  ))}
                </div>
              )}

              {messages.length <= 1 && !busy && (
                <div className="mt-1 flex flex-wrap gap-2">
                  {CODE_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-3 py-1.5 text-[11px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
                    >
                      <Sparkles size={10} /> {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-[var(--mc-line)] p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask CODE anything about your studies…"
                className="flex-1 rounded-full border border-[var(--mc-line)] bg-[var(--mc-bg)] px-4 py-2.5 text-[13px] outline-none transition-colors placeholder:text-faint focus:border-[var(--mc-accent)]"
                aria-label="Message CODE"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--mc-accent-deep)] text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
              >
                <Send size={15} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
