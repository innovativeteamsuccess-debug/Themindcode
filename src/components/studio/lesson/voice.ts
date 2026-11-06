"use client";

/* ============================================================
   LESSON MODE — voice layer
   TTS: browser speechSynthesis (instant, offline, free) with an
   en-IN voice preference. STT: webkitSpeechRecognition when the
   browser supports it. Everything degrades silently to text.
   ============================================================ */

let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const n = v.name.toLowerCase();
    let s = 0;
    if (v.lang?.toLowerCase().startsWith("en-in")) s += 6;
    else if (v.lang?.toLowerCase().startsWith("en-gb")) s += 4;
    else if (v.lang?.toLowerCase().startsWith("en")) s += 2;
    if (/google/.test(n)) s += 3;
    if (/neerja|heera|veena|kalpana|ravi|female/.test(n)) s += 2;
    if (/natural|neural/.test(n)) s += 2;
    return s;
  };
  cachedVoice = voices.sort((a, b) => score(b) - score(a))[0] ?? null;
  return cachedVoice;
}

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Warm the voice list (Chrome loads it async). */
export function warmVoice() {
  if (!ttsAvailable()) return;
  pickVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null;
    pickVoice();
  };
}

export interface Spoken {
  done: Promise<void>;
  cancel: () => void;
}

/** Speak narration; resolves when speech ends (or via fallback timer). */
export function speak(text: string, opts?: { rate?: number }): Spoken {
  const minMs = Math.min(9000, Math.max(1600, text.length * 58));
  const fallback = new Promise<void>((r) => setTimeout(r, minMs));

  if (!ttsAvailable()) return { done: fallback, cancel: () => {} };

  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = opts?.rate ?? 1.02;
    u.pitch = 1.04;
    u.volume = 1;

    const done = new Promise<void>((resolve) => {
      let settled = false;
      const finish = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      /* if the engine stalls, the fallback timer still resolves */
      setTimeout(finish, minMs + 6000);
    });

    window.speechSynthesis.speak(u);
    return {
      done: Promise.race([done, fallback]),
      cancel: () => window.speechSynthesis.cancel(),
    };
  } catch {
    return { done: fallback, cancel: () => {} };
  }
}

export function stopSpeaking() {
  try {
    if (ttsAvailable()) window.speechSynthesis.cancel();
  } catch {
    /* noop */
  }
}

/* ---------------- speech recognition ---------------- */

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function sttAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export interface ListenHandle {
  stop: () => void;
}

export function listen(opts: { onText: (text: string, final: boolean) => void; onEnd?: () => void }): ListenHandle | null {
  if (!sttAvailable()) return null;
  const w = window as unknown as Record<string, unknown>;
  const Ctor = (w.SpeechRecognition || w.webkitSpeechRecognition) as new () => Recognition;
  try {
    const rec = new Ctor();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0]?.transcript ?? "";
      }
      opts.onText(text.trim(), iFinalSafe(e));
    };
    rec.onend = () => opts.onEnd?.();
    rec.onerror = () => opts.onEnd?.();
    rec.start();
    return { stop: () => { try { rec.stop(); } catch { /* noop */ } } };
  } catch {
    return null;
  }
}

function iFinalSafe(e: { results: ArrayLike<{ isFinal?: boolean }> }): boolean {
  const last = e.results[e.results.length - 1];
  return Boolean(last?.isFinal);
}
