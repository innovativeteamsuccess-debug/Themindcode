"use client";

/* ============================================================
   /code — the AI workspace, home of CODE the mascot.
   A dedicated screen that deliberately does NOT look like the
   rest of the site: big canvas, big type, one conversation.
   ============================================================ */

import { useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CODE_SUGGESTIONS } from "./data";
import { CodeFigure } from "./code";

type Msg = { role: "user" | "assistant"; content: string };

const OPENING: Msg = {
  role: "assistant",
  content:
    "Hey! I'm CODE — your study buddy inside the Mind Core. Ask me to explain a concept, quiz you, or build a revision plan. What are we cracking today? ✦",
};

const PROMPT_IDEAS = [
  "Explain quadratic equations simply.",
  "Quiz me on electricity.",
  "Help me revise nationalism.",
  "Make me a 20-minute revision plan.",
  "Why do we need the number line?",
  "Give me a hint, not the answer.",
];

export function CodeWorkspace() {
  const [messages, setMessages] = useState<Msg[]>([OPENING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
            ? "I need you to log in first — tap the LOG IN button up top. It's free, and then we can talk all you want ✦"
            : "I drifted out of orbit for a second — ask me again?";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Signal lost inside the core. Give it another try ✦" },
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
    <main className="relative flex min-h-[100svh] flex-1 flex-col">
      {/* the workspace backdrop — quieter, deeper */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% -10%, var(--mc-accent-soft), transparent 60%), radial-gradient(ellipse 50% 40% at 100% 100%, var(--mc-accent-soft), transparent 65%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-10 pt-24 md:px-8 md:pt-28">
        {/* header */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <CodeFigure height={116} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-5 text-[clamp(2.2rem,6vw,3.8rem)] font-semibold leading-[1.0] tracking-[-0.03em]"
          >
            Meet <span className="accent-serif text-[var(--mc-accent)]">CODE.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-3 max-w-md text-[14.5px] leading-relaxed text-dim"
          >
            Your personal learning companion. He explains, quizzes, hints and plans — and never,
            ever makes you feel slow.
          </motion.p>
        </div>

        {/* conversation canvas */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mc-card mt-9 flex min-h-[440px] flex-1 flex-col overflow-hidden"
        >
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 md:px-8"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32 }}
                className={cn(
                  "max-w-[86%] whitespace-pre-wrap rounded-3xl px-5 py-3.5 text-[14px] leading-relaxed",
                  m.role === "user"
                    ? "self-end rounded-br-lg bg-[var(--mc-accent-deep)] text-white"
                    : "self-start rounded-bl-lg border border-[var(--mc-line)] bg-[var(--mc-card-2)]"
                )}
              >
                {m.content}
              </motion.div>
            ))}

            {busy && (
              <div className="flex items-center gap-2 self-start rounded-3xl rounded-bl-lg border border-[var(--mc-line)] bg-[var(--mc-card-2)] px-5 py-4">
                {[0, 1, 2].map((d) => (
                  <motion.span
                    key={d}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--mc-accent)]"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18 }}
                  />
                ))}
                <span className="font-code ml-2 text-[9px] uppercase tracking-[0.2em] text-faint">
                  thinking
                </span>
              </div>
            )}
          </div>

          {/* composer */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2.5 border-t border-[var(--mc-line)] p-3.5 md:p-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask CODE anything about your studies…"
              className="flex-1 rounded-full border border-[var(--mc-line)] bg-[var(--mc-bg)] px-5 py-3.5 text-[14px] outline-none transition-colors placeholder:text-faint focus:border-[var(--mc-accent)]"
              aria-label="Message CODE"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--mc-accent-deep)] text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
            >
              <Send size={16} />
            </button>
          </form>
        </motion.div>

        {/* prompt ideas */}
        <div className="mt-5">
          <p className="font-code mb-3 text-center text-[9px] uppercase tracking-[0.24em] text-faint">
            TRY ASKING
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {PROMPT_IDEAS.map((p) => (
              <button
                key={p}
                onClick={() => send(p.replace(">", "").trim())}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-4 py-2 text-[12px] text-dim transition-all hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)] disabled:opacity-40"
              >
                <Sparkles size={10} className="text-[var(--mc-accent)]" />
                {p}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[10.5px] text-faint">
            {CODE_SUGGESTIONS.length + PROMPT_IDEAS.length} ways in — or type anything, in your own words.
          </p>
        </div>
      </div>
    </main>
  );
}
