"use client";

import { useRef, useState } from "react";
import {
  BadgeCheck,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
} from "lucide-react";

/* ============================================================
   TestBuilder — the founder's PDF → test pipeline (admin only).
   1. Pick a real PDF + set meta.
   2. Server extracts the text and drafts MCQs from it.
   3. Founder edits the draft right here.
   4. Publish → the test appears in every student's Zone, live.
   ============================================================ */

type Draft = {
  q: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

const SUBJECTS = ["Mathematics", "Science", "Physics", "Chemistry", "Biology", "Social Science"];

export function TestBuilder() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Science");
  const [cls, setCls] = useState(10);
  const [count, setCount] = useState(10);
  const [minutes, setMinutes] = useState(20);

  const [draft, setDraft] = useState<Draft[] | null>(null);
  const [meta, setMeta] = useState<{ extractedChars: number; fileName: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  async function extract() {
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("subject", subject);
      fd.set("cls", String(cls));
      fd.set("count", String(count));
      const res = await fetch("/api/tests/builder", { method: "POST", body: fd });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        draft?: Draft[];
        extractedChars?: number;
        fileName?: string;
      };
      if (!res.ok || !data.ok || !data.draft) throw new Error(data.error ?? "Extraction failed");
      setDraft(data.draft);
      setMeta({ extractedChars: data.extractedChars ?? 0, fileName: data.fileName ?? file.name });
      if (!title) setTitle(file.name.replace(/\.pdf$/i, "").slice(0, 120) || "Untitled test");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setBusy(false);
    }
  }

  function patchQuestion(i: number, patch: Partial<Draft>) {
    setDraft((d) => (d ? d.map((q, qi) => (qi === i ? { ...q, ...patch } : q)) : d));
  }

  async function publish() {
    if (!draft?.length) return;
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/tests/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim() || "Untitled test",
          subject,
          cls,
          minutes,
          sourceName: meta?.fileName,
          questions: draft,
        }),
      });
      const data = (await res.json()) as { ok: boolean; id?: string; error?: string };
      if (!res.ok || !data.ok || !data.id) throw new Error(data.error ?? "Publish failed");
      setPublishedId(data.id);
      setDraft(null);
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="mt-7">
      {publishedId && (
        <p className="font-code mb-5 flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--mc-accent)_45%,transparent)] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-[var(--mc-accent)]">
          <BadgeCheck size={13} />
          Published — live in every student&apos;s Zone (id {publishedId.slice(-6).toUpperCase()})
        </p>
      )}

      {/* inputs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Light — Chapter drill"
            className="rounded-xl border border-[var(--mc-line)] bg-transparent px-3.5 py-2.5 text-[13.5px] outline-none transition-colors focus:border-[var(--mc-accent)]"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">Subject</span>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card)] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[var(--mc-accent)]"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">Class</span>
          <select
            value={cls}
            onChange={(e) => setCls(Number(e.target.value))}
            className="rounded-xl border border-[var(--mc-line)] bg-[var(--mc-card)] px-3.5 py-2.5 text-[13.5px] outline-none focus:border-[var(--mc-accent)]"
          >
            {[6, 7, 8, 9, 10].map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="font-code text-[9px] uppercase tracking-[0.2em] text-faint">
            Questions · {count} · {minutes} min
          </span>
          <div className="flex gap-2">
            <input
              type="range"
              min={4}
              max={25}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-[var(--mc-accent)]"
              aria-label="Number of questions"
            />
            <input
              type="number"
              min={5}
              max={120}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="w-20 rounded-xl border border-[var(--mc-line)] bg-transparent px-2.5 py-2 text-[13px] outline-none focus:border-[var(--mc-accent)]"
              aria-label="Minutes"
            />
          </div>
        </label>
      </div>

      {/* drop zone */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label
          data-cursor="interactive"
          className="group flex flex-1 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-[var(--mc-line)] px-5 py-4 transition-colors hover:border-[var(--mc-accent)]"
        >
          <UploadCloud size={18} className="shrink-0 text-[var(--mc-accent)]" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-dim">
            {file ? file.name : "Drop or choose the question-bank PDF (text-based, ≤ 15 MB)"}
          </span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          onClick={extract}
          disabled={busy || !file}
          className="btn-mono inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--mc-cta-bg)] px-6 py-3.5 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          {busy ? "READING PDF…" : "EXTRACT & DRAFT"}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-xl border border-red-300/40 px-4 py-3 text-[12.5px] text-dim">{error}</p>
      )}

      {/* draft editor */}
      {draft && (
        <div className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="font-code text-[10px] uppercase tracking-[0.2em] text-faint">
              Draft · {draft.length} questions · from {meta?.extractedChars.toLocaleString("en-IN")} chars of{" "}
              {meta?.fileName}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDraft((d) => (d ? [...d, { q: "", options: ["", "", "", ""], answerIndex: 0 }] : d))}
                className="btn-mono inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9px] text-dim transition-colors hover:border-[var(--mc-accent)] hover:text-[var(--mc-accent)]"
              >
                <Plus size={11} />
                ADD QUESTION
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={publishing}
                className="btn-mono inline-flex items-center gap-1.5 rounded-full bg-[var(--mc-cta-bg)] px-5 py-2 text-[9px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.02] disabled:opacity-50"
              >
                {publishing ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                {publishing ? "PUBLISHING…" : "PUBLISH TEST"}
              </button>
            </div>
          </div>

          <div className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-1">
            {draft.map((q, i) => (
              <div key={i} className="rounded-2xl border border-[var(--mc-line)] p-4">
                <div className="flex items-start gap-2">
                  <span className="font-code mt-3 shrink-0 text-[9px] uppercase tracking-[0.18em] text-[var(--mc-accent)]">
                    Q{i + 1}
                  </span>
                  <textarea
                    value={q.q}
                    onChange={(e) => patchQuestion(i, { q: e.target.value })}
                    rows={2}
                    placeholder="Question text…"
                    className="min-h-[2.6rem] flex-1 resize-y rounded-lg border border-[var(--mc-line)] bg-transparent px-3 py-2 text-[13px] outline-none focus:border-[var(--mc-accent)]"
                  />
                  <button
                    type="button"
                    onClick={() => setDraft((d) => (d ? d.filter((_, qi) => qi !== i) : d))}
                    aria-label={`Delete question ${i + 1}`}
                    className="mt-2 rounded-lg p-2 text-faint transition-colors hover:text-red-500"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`correct-${i}`}
                        checked={q.answerIndex === oi}
                        onChange={() => patchQuestion(i, { answerIndex: oi })}
                        className="accent-[var(--mc-accent)]"
                        aria-label={`Mark option ${oi + 1} correct`}
                      />
                      <input
                        value={opt}
                        onChange={(e) =>
                          patchQuestion(i, {
                            options: q.options.map((o, x) => (x === oi ? e.target.value : o)),
                          })
                        }
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="w-full rounded-lg border border-[var(--mc-line)] bg-transparent px-2.5 py-1.5 text-[12.5px] outline-none focus:border-[var(--mc-accent)]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={extract}
            disabled={busy || !file}
            className="btn-mono mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--mc-line)] px-4 py-2 text-[9px] text-dim transition-colors enabled:hover:border-[var(--mc-accent)] enabled:hover:text-[var(--mc-accent)] disabled:opacity-40"
          >
            <RefreshCw size={11} />
            RE-DRAFT FROM PDF
          </button>
        </div>
      )}
    </div>
  );
}
