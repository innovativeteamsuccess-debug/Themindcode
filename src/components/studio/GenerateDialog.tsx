"use client";

/* Generate dialog: Canvas → Notes / Summary / Flashcards / Quiz / Practice.
   Also hosts the Export tab (PDF print / Markdown / JSON).
   Generation runs through runAI (local-first), previews inline,
   then places real interactive objects on the canvas. */

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Wand2, FileText, Layers, ListChecks, Dumbbell, ScanText, Printer, FileJson, FileDown, Check } from "lucide-react";
import { useStudio, type GenerateKind } from "./store";
import { runAI } from "./lib/ai-client";
import type { AIResult, CanvasObject, DiagramNode, QuizQuestion, Vec2 } from "./types";

const KINDS: { id: GenerateKind; icon: typeof FileText; label: string; blurb: string }[] = [
  { id: "notes", icon: FileText, label: "Notes", blurb: "Structured notes from the whole board" },
  { id: "summary", icon: ScanText, label: "Summary", blurb: "One-glance revision sheet" },
  { id: "flashcards", icon: Layers, label: "Flashcards", blurb: "Flip-card deck for recall" },
  { id: "quiz", icon: ListChecks, label: "Quiz", blurb: "Interactive multiple-choice" },
  { id: "practice", icon: Dumbbell, label: "Practice", blurb: "Similar problems, flipped cards" },
];

export function GenerateDialog() {
  const openKind = useStudio((s) => s.generateOpen);
  const board = useStudio((s) => s.boards[s.activeBoardId]);
  const busy = useStudio((s) => s.aiBusy);
  const [result, setResult] = useState<AIResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const objects = board?.objects ?? {};
  const summary = useMemo(
    () =>
      Object.values(objects)
        .filter((o) => o.kind !== "stroke")
        .map((o) => summarize(o))
        .filter(Boolean)
        .join("\n")
        .slice(0, 1400),
    [objects]
  );

  async function generate(kind: GenerateKind) {
    setError(null);
    setResult(null);
    const modeMap: Record<GenerateKind, "revise" | "summary" | "quiz" | "practice"> = {
      notes: "revise",
      summary: "summary",
      flashcards: "revise",
      quiz: "quiz",
      practice: "practice",
    };
    try {
      const s = useStudio.getState();
      const { result: r } = await runAI(modeMap[kind], {
        boardTitle: board?.title ?? "Board",
        objects: Object.values(objects).map((o) => ({ kind: o.kind, text: summarize(o) })),
        selection: [],
        prompt: kind === "flashcards" ? "Create flashcards (front = question/term, back = crisp answer)." : undefined,
      });
      setResult(r);
      // persist generated artifact metadata
      const s2 = useStudio.getState();
      s2.addTurn({ role: "assistant", text: `Generated ${kind}: ${r.title}` });
      void s2;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    }
  }

  function place() {
    if (!result) return;
    const s = useStudio.getState();
    const center: Vec2 = {
      x: (-s.camera.x + s.viewport.w / 2) / s.camera.z,
      y: (-s.camera.y + s.viewport.h / 2) / s.camera.z,
    };
    const k = s.aiCascade;
    s.setAI({ aiCascade: k + 1 });
    let ids: string[] = [];
    if (result.quiz?.length) {
      ids = s.addObjects([{ kind: "quiz", x: center.x - 190 + (k % 3) * 40, y: center.y - 210 + (k % 2) * 30, w: 380, h: 430, title: result.title, questions: result.quiz, picked: {} }]);
    } else if (result.flashcards?.length || (result.problems?.length)) {
      const cards = result.flashcards ?? result.problems!.map((p) => ({ front: p.prompt, back: `${p.answer}${p.hint ? `\n— ${p.hint}` : ""}` }));
      ids = s.addObjects([{ kind: "flashcards", x: center.x - 160 + (k % 3) * 40, y: center.y - 180 + (k % 2) * 30, w: 320, h: 360, title: result.title, cards, index: 0, flipped: false }]);
    } else {
      const steps = result.sections?.map((sec) => ({ t: sec.heading, d: sec.points.join("  •  ") })) ?? result.steps;
      ids = s.addObjects([{ kind: "ainote", x: center.x + 80 + (k % 3) * 40, y: center.y - 160 + (k % 2) * 30, w: 400, h: 380, mode: result.sections ? "revise" : "explain", title: result.title, body: result.body ?? "", steps, tone: "amber" }]);
    }
    s.addGenerated(ids[0], result.title);
    s.select(ids);
    s.setGenerate(null);
  }

  return (
    <Modal open={openKind !== null} onClose={() => useStudio.getState().setGenerate(null)} wide>
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <div className="flex items-center gap-2.5">
          <Wand2 size={15} className="text-[var(--st-accent)]" />
          <h2 className="text-[15px] font-semibold text-[var(--st-ink)]">Turn this board into study material</h2>
        </div>
        <button type="button" className="st-btn h-8 w-8" onClick={() => useStudio.getState().setGenerate(null)} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <p className="px-5 pb-3 text-[11.5px] text-[var(--st-faint)]">
        CODE reads the {Object.keys(objects).length} objects on “{board?.title}” and builds the artifact with you.
      </p>

      <div className="grid grid-cols-2 gap-2 px-5 sm:grid-cols-5">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className="st-btn flex-col gap-1.5 rounded-[14px] px-2 py-3.5 text-center"
            data-active={openKind === k.id}
            onClick={() => generate(k.id)}
            disabled={busy}
          >
            <k.icon size={16} />
            <span className="text-[11.5px] font-semibold">{k.label}</span>
            <span className="hidden text-[9px] leading-tight text-[var(--st-faint)] sm:block">{k.blurb}</span>
          </button>
        ))}
      </div>

      <div className="st-scroll mx-5 mt-4 max-h-[36vh] overflow-y-auto rounded-[14px] border border-[var(--st-line)] bg-[rgba(12,13,18,0.5)] p-4">
        {busy && (
          <div className="flex flex-col gap-2.5">
            {[80, 95, 70].map((w, i) => (
              <div key={i} className="st-gen-shimmer h-3.5 rounded-full" style={{ width: `${w}%` }} />
            ))}
            <p className="mt-1 font-[family-name:var(--font-code-mono)] text-[9.5px] uppercase tracking-[0.2em] text-[var(--st-faint)]">
              CODE is reading the board…
            </p>
          </div>
        )}
        {!busy && error && <p className="text-[12px] text-[var(--st-rose)]">{error}</p>}
        {!busy && !error && !result && (
          <p className="py-4 text-center text-[12px] text-[var(--st-faint)]">
            Pick an artifact above. Notes &amp; summaries land as beautiful cards; quizzes &amp; flashcards are interactive right on the canvas.
          </p>
        )}
        {!busy && result && (
          <div className="flex flex-col gap-2.5">
            <p className="text-[13.5px] font-semibold text-[var(--st-ink)]">{result.title}</p>
            {result.body && <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--st-dim)]">{result.body}</p>}
            {result.sections?.map((sec, i) => (
              <div key={i}>
                <p className="text-[12px] font-semibold text-[var(--st-ink)]">{sec.heading}</p>
                <ul className="mt-1 list-disc pl-4">
                  {sec.points.map((p, j) => (
                    <li key={j} className="text-[11.5px] leading-relaxed text-[var(--st-dim)]">{p}</li>
                  ))}
                </ul>
              </div>
            ))}
            {result.steps?.map((s, i) => (
              <div key={i}>
                <p className="text-[12px] font-semibold text-[var(--st-ink)]">{s.t}</p>
                {s.d && <p className="text-[11.5px] text-[var(--st-dim)]">{s.d}</p>}
              </div>
            ))}
            {result.quiz?.length && <p className="text-[11.5px] text-[var(--st-dim)]">{result.quiz.length} questions ready.</p>}
            {result.problems?.length && <p className="text-[11.5px] text-[var(--st-dim)]">{result.problems.length} practice cards ready.</p>}
            {(result.flashcards?.length || result.problems?.length) && (
              <p className="text-[11.5px] text-[var(--st-dim)]">{(result.flashcards ?? result.problems)!.length} cards ready.</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <button type="button" className="st-btn px-3.5 py-2 text-[12px]" onClick={() => useStudio.getState().setGenerate(null)}>
          Close
        </button>
        <button type="button" className="st-btn st-btn-primary px-4 py-2 text-[12px]" disabled={!result || busy} style={{ opacity: result && !busy ? 1 : 0.45 }} onClick={place}>
          <Check size={13} />
          Place on canvas
        </button>
      </div>
    </Modal>
  );
}

/* ---------------- export ---------------- */

export function ExportDialog() {
  const open = useStudio((s) => s.exportOpen);
  const board = useStudio((s) => s.boards[s.activeBoardId]);

  function download(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toMarkdown(): string {
    const lines: string[] = [`# ${board?.title ?? "Board"}`, ""];
    for (const o of Object.values(board?.objects ?? {}).sort((a, b) => a.z - b.z)) {
      switch (o.kind) {
        case "text": lines.push(o.text, ""); break;
        case "sticky": lines.push(`> ${o.text}`, ""); break;
        case "equation": lines.push("$$" + o.latex + "$$", ""); break;
        case "ainote":
          lines.push(`## ${o.title}`, "", o.body, "");
          for (const s of o.steps ?? []) {
            lines.push(`- **${s.t}** ${s.d ?? ""}`);
            if (s.latex) lines.push(`  $$${s.latex}$$`);
          }
          lines.push("");
          break;
        case "diagram":
          lines.push(`### ${o.title}`, "");
          for (const n of o.nodes) if (n.text || n.label) lines.push(`- ${n.label || n.text.split("\n")[0]}`);
          lines.push("");
          break;
        case "quiz":
          lines.push(`### ${o.title}`, "");
          o.questions.forEach((q, i) => {
            lines.push(`${i + 1}. ${q.q}`);
            q.options.forEach((op, j) => lines.push(`   ${String.fromCharCode(65 + j)}. ${op}`));
            lines.push(`   _Answer: ${String.fromCharCode(65 + q.answer)}${q.why ? ` — ${q.why}` : ""}_`);
          });
          lines.push("");
          break;
        case "flashcards":
          lines.push(`### ${o.title}`, "");
          for (const c of o.cards) lines.push(`- **${c.front}** → ${c.back}`);
          lines.push("");
          break;
        case "code": lines.push("```" + o.lang, o.code, "```", ""); break;
        case "table":
          if (o.rows[0]) lines.push(`| ${o.rows[0].join(" | ")} |`, `| ${o.rows[0].map(() => "---").join(" | ")} |`);
          for (const r of o.rows.slice(1)) lines.push(`| ${r.join(" | ")} |`);
          lines.push("");
          break;
        case "image": lines.push(`_(image: ${o.alt ?? "canvas image"})_`, ""); break;
        default: break;
      }
    }
    lines.push("---", "_Exported from CODE Studio — The Mind Code._");
    return lines.join("\n");
  }

  function printPDF() {
    const b = board;
    if (!b) return;
    // build a print-only document, then print
    const host = document.getElementById("st-print-doc");
    if (!host) return;
    const parts: string[] = [`<h1 style="margin:0 0 4px">${escapeHtml(b.title)}</h1><p style="color:#5B6B85;font-size:12px;margin:0 0 24px">CODE Studio · The Mind Code · ${new Date().toLocaleDateString()}</p>`];
    for (const o of Object.values(b.objects).sort((a, c) => a.z - c.z)) {
      if (o.kind === "text") parts.push(`<p style="font-size:14px;line-height:1.55">${escapeHtml(o.text)}</p>`);
      if (o.kind === "sticky") parts.push(`<blockquote style="border-left:3px solid #F5B83D;margin:10px 0;padding:4px 12px">${escapeHtml(o.text)}</blockquote>`);
      if (o.kind === "equation") parts.push(`<p class="eq" data-tex="${escapeHtml(o.latex)}"></p>`);
      if (o.kind === "ainote") {
        parts.push(`<h3 style="margin:18px 0 4px">${escapeHtml(o.title)}</h3><p style="font-size:13px;line-height:1.5">${escapeHtml(o.body)}</p>`);
        for (const s of o.steps ?? []) parts.push(`<p style="margin:6px 0 0;font-size:13px"><b>${escapeHtml(s.t)}</b> ${escapeHtml(s.d ?? "")}${s.latex ? ` <span class="eq" data-tex="${escapeHtml(s.latex)}"></span>` : ""}</p>`);
      }
      if (o.kind === "diagram") {
        parts.push(`<h3 style="margin:18px 0 4px">${escapeHtml(o.title)}</h3><ul style="font-size:13px">${o.nodes.filter((n: DiagramNode) => n.text || n.label).map((n: DiagramNode) => `<li>${escapeHtml(n.label || n.text.split("\n")[0])}</li>`).join("")}</ul>`);
      }
      if (o.kind === "quiz") {
        parts.push(`<h3 style="margin:18px 0 4px">${escapeHtml(o.title)}</h3>`);
        o.questions.forEach((q: QuizQuestion, i: number) => {
          parts.push(`<p style="margin:8px 0 2px;font-size:13px"><b>${i + 1}.</b> ${escapeHtml(q.q)}</p><p style="font-size:12px;color:#42506B">Answer: ${escapeHtml(q.options[q.answer])}${q.why ? ` — ${escapeHtml(q.why)}` : ""}</p>`);
        });
      }
      if (o.kind === "flashcards") {
        parts.push(`<h3 style="margin:18px 0 4px">${escapeHtml(o.title)}</h3><ul style="font-size:13px">${o.cards.map((c) => `<li><b>${escapeHtml(c.front)}</b> — ${escapeHtml(c.back)}</li>`).join("")}</ul>`);
      }
      if (o.kind === "table") {
        parts.push('<table style="border-collapse:collapse;font-size:12px">' + o.rows.map((r) => `<tr>${r.map((c) => `<td style="border:1px solid #C9D4E8;padding:4px 10px">${escapeHtml(c)}</td>`).join("")}</tr>`).join("") + "</table>");
      }
      if (o.kind === "code") parts.push(`<pre style="background:#F1F5FB;border-radius:8px;padding:12px;font-size:12px">${escapeHtml(o.code)}</pre>`);
    }
    host.innerHTML = parts.join("");
    // render equations with KaTeX (client)
    import("katex").then((katex) => {
      host.querySelectorAll<HTMLElement>(".eq").forEach((el) => {
        const tex = el.getAttribute("data-tex") ?? "";
        try {
          el.innerHTML = katex.renderToString(tex, { throwOnError: false });
        } catch {
          el.textContent = tex;
        }
      });
      window.print();
    });
  }

  const safeName = (board?.title ?? "board").toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <Modal open={open} onClose={() => useStudio.getState().toggle("exportOpen")}>
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-[var(--st-ink)]">Export “{board?.title}”</h2>
        <button type="button" className="st-btn h-8 w-8" onClick={() => useStudio.getState().toggle("exportOpen")} aria-label="Close">
          <X size={14} />
        </button>
      </div>
      <p className="px-5 pb-4 text-[11.5px] text-[var(--st-faint)]">Everything the board holds, taken out in a useful shape.</p>
      <div className="flex flex-col gap-2 px-5">
        <button type="button" className="st-btn justify-start gap-3 px-4 py-3 text-left" onClick={printPDF}>
          <Printer size={15} className="text-[var(--st-accent)]" />
          <span>
            <span className="block text-[12.5px] font-semibold text-[var(--st-ink)]">Polished PDF</span>
            <span className="block text-[10.5px] text-[var(--st-faint)]">Print-optimised document with rendered equations</span>
          </span>
        </button>
        <button type="button" className="st-btn justify-start gap-3 px-4 py-3 text-left" onClick={() => download(`${safeName}.md`, toMarkdown(), "text/markdown")}>
          <FileDown size={15} className="text-[var(--st-emerald)]" />
          <span>
            <span className="block text-[12.5px] font-semibold text-[var(--st-ink)]">Markdown notes</span>
            <span className="block text-[10.5px] text-[var(--st-faint)]">Paste into Notion, Docs, Obsidian…</span>
          </span>
        </button>
        <button
          type="button"
          className="st-btn justify-start gap-3 px-4 py-3 text-left"
          onClick={() => download(`${safeName}.json`, JSON.stringify(board, null, 2), "application/json")}
        >
          <FileJson size={15} className="text-[var(--st-amber)]" />
          <span>
            <span className="block text-[12.5px] font-semibold text-[var(--st-ink)]">Board data (JSON)</span>
            <span className="block text-[10.5px] text-[var(--st-faint)]">Full backup — re-importable later</span>
          </span>
        </button>
      </div>
      <div className="h-4" />
    </Modal>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function summarize(o: CanvasObject): string {
  switch (o.kind) {
    case "text": return o.text;
    case "sticky": return o.text;
    case "equation": return o.latex;
    case "ainote": return `${o.title}: ${o.body}`;
    case "diagram": return `${o.title}: ${o.nodes.map((n) => n.label || n.text.split("\n")[0]).join(", ")}`;
    case "quiz": return o.questions.map((q) => q.q).join(" | ");
    case "flashcards": return o.cards.map((c) => c.front).join(" | ");
    case "code": return `${o.lang} code`;
    case "table": return o.rows.map((r) => r.join(" / ")).join(" | ");
    default: return "";
  }
}

/* ---------------- shared modal shell ---------------- */

export function Modal({ open, onClose, children, wide }: { open: boolean; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="st-ui absolute inset-0 z-[75] flex items-center justify-center bg-[rgba(3,8,18,0.62)] p-4 backdrop-blur-[4px]"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className={`st-glass st-scroll max-h-[86vh] w-full overflow-y-auto rounded-[22px] ${wide ? "max-w-[640px]" : "max-w-[460px]"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
