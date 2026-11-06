"use client";

/* Voice mode — Web Speech API (browser-native).
   Voice → transcript → intent → AI action or canvas text.
   Graceful unsupported state; Esc cancels.
   Structured as an outer gate + keyed session so no effect ever
   calls setState synchronously (session state resets by remount). */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, X } from "lucide-react";
import { useStudio } from "./store";
import { StudioMark } from "./brand";

/* minimal typings for the vendor-prefixed webkitSpeechRecognition */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: unknown) => void) | null;
}

function getRecognizer(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function intentOf(t: string): "explain" | "quiz" | "visualize" | "summary" | "solve" | "ask" {
  const q = t.toLowerCase();
  if (/quiz|test me/.test(q)) return "quiz";
  if (/draw|diagram|visuali/.test(q)) return "visualize";
  if (/summar/.test(q)) return "summary";
  if (/solve/.test(q)) return "solve";
  if (/explain|what is|who|why|how/.test(q)) return "explain";
  return "ask";
}

export default function VoiceOverlay() {
  const open = useStudio((s) => s.voiceOpen);
  const supported = useMemo(() => Boolean(getRecognizer()), [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-[rgba(3,8,18,0.82)] backdrop-blur-[6px]"
          role="dialog"
          aria-label="Voice mode"
          onClick={() => useStudio.getState().setVoiceOpen(false)}
        >
          <button type="button" className="st-btn st-ui absolute right-5 top-5 h-9 w-9 rounded-full" aria-label="Stop voice mode">
            <X size={15} />
          </button>
          <VoiceSession key={`v-${String(open)}`} supported={supported} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function VoiceSession({ supported }: { supported: boolean }) {
  const [transcript, setTranscript] = useState("");
  const [phase, setPhase] = useState<"listening" | "thinking">("listening");

  const finish = useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setTranscript(t);
    setPhase("thinking");
    const s = useStudio.getState();
    s.addTurn({ role: "user", text: `🎙 “${t}”` });
    window.setTimeout(() => {
      s.setVoiceOpen(false);
      s.setAI({ aiPanelOpen: true, aiPanelTab: "chat" });
      s.askAI(intentOf(t), t);
    }, 500);
  }, []);

  useEffect(() => {
    if (!supported) return;
    const Ctor = getRecognizer();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    let timer = 0;
    rec.onresult = (e) => {
      let final = "";
      for (let i = 0; i < e.results.length; i++) final += e.results[i][0]?.transcript ?? "";
      setTranscript(final); // async SDK callback — allowed
      window.clearTimeout(timer);
      timer = window.setTimeout(() => finish(final), 900);
    };
    rec.onerror = () => setPhase("listening");
    try {
      rec.start();
    } catch {
      /* already started */
    }
    return () => {
      window.clearTimeout(timer);
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
  }, [supported, finish]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-28 w-28 items-center justify-center">
        {phase === "listening" && (
          <>
            <span className="st-voice-ring" />
            <span className="st-voice-ring" style={{ animationDelay: "0.65s" }} />
            <span className="st-voice-ring" style={{ animationDelay: "1.3s" }} />
          </>
        )}
        <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--st-accent-soft)] shadow-[0_0_60px_-10px_rgba(255,158,61,0.55)]">
          <StudioMark size={38} pulse />
        </span>
      </div>

      <p className="mt-8 font-[family-name:var(--font-code-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--st-faint)]">
        {phase === "thinking" ? "routing to CODE…" : "listening — try “explain newton's third law”"}
      </p>
      <p className="mt-3 max-w-[420px] px-6 text-center text-[15px] leading-relaxed text-[var(--st-ink)]" aria-live="polite">
        {transcript || (supported ? "Speak now…" : "Voice input is not available in this browser — Chrome or Edge support it. Type into Ask Canvas AI instead.")}
      </p>

      <div className="mt-8 flex items-center gap-2 text-[10.5px] text-[var(--st-faint)]">
        <Mic size={11} />
        voice → text → canvas · CODE replies on the board
      </div>
    </div>
  );
}
