"use client";

/* Right-side AI panel — Context / Chat / Actions / Generated.
   Collapsible, never wider than 360px; overlays as a drawer < 1024px. */

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Eye, MessageSquare, Zap, FolderDown, Sparkles, ScanSearch } from "lucide-react";
import { useStudio } from "./store";
import { AI_MODES, type AIMode } from "./types";
import { Tex } from "./objects/KaTex";

export default function AIPanel() {
  const open = useStudio((s) => s.aiPanelOpen);
  const tab = useStudio((s) => s.aiPanelTab);
  const board = useStudio((s) => s.boards[s.activeBoardId]);

  const stats = useMemo(() => {
    const objs = Object.values(board?.objects ?? {});
    const byKind: Record<string, number> = {};
    for (const o of objs) byKind[o.kind] = (byKind[o.kind] ?? 0) + 1;
    return { total: objs.length, byKind };
  }, [board]);

  const topics = useMemo(() => {
    const texts = Object.values(board?.objects ?? {})
      .filter((o) => o.kind === "text" || o.kind === "sticky" || o.kind === "ainote" || o.kind === "diagram")
      .map((o) => (o.kind === "diagram" ? o.title : o.kind === "ainote" ? o.title : (o as { text?: string }).text ?? ""))
      .join(" ");
    const stops = new Set(["the", "and", "for", "with", "this", "that", "from", "into", "your", "are", "you", "how", "why", "what", "when", "it's", "its"]);
    const freq = new Map<string, number>();
    for (const w of texts.toLowerCase().match(/[a-zà-ÿ0-9']{4,}/g) ?? []) {
      if (stops.has(w)) continue;
      freq.set(w, (freq.get(w) ?? 0) + 1);
    }
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  }, [board]);

  const st = useStudio.getState;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => st().toggle("aiPanelOpen")}
            aria-hidden
          />
          <motion.aside
            key="panel"
            initial={{ x: 364 }}
            animate={{ x: 0 }}
            exit={{ x: 364 }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="st-glass absolute bottom-0 right-0 top-0 z-40 flex w-[340px] flex-col rounded-none border-y-0 border-r-0 lg:z-10 lg:w-[352px]"
            aria-label="CODE AI panel"
          >
            <div className="flex items-center justify-between px-4 pb-1 pt-4">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[var(--st-violet)]" />
                <span className="font-[family-name:var(--font-code-mono)] text-[9.5px] uppercase tracking-[0.28em] text-[var(--st-dim)]">
                  canvas ai
                </span>
              </div>
              <button type="button" className="st-btn h-7 w-7" onClick={() => st().toggle("aiPanelOpen")} aria-label="Close AI panel">
                <X size={13} />
              </button>
            </div>

            {/* tabs */}
            <div className="flex gap-1 px-3.5 pb-2 pt-1.5" role="tablist" aria-label="AI panel sections">
              {(
                [
                  ["context", "Context", Eye],
                  ["chat", "Chat", MessageSquare],
                  ["actions", "Actions", Zap],
                  ["generated", "Made", FolderDown],
                ] as const
              ).map(([id, label, Icon]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  className="st-btn flex-1 justify-center gap-1.5 py-1.5 text-[10.5px]"
                  data-active={tab === id}
                  onClick={() => st().setAI({ aiPanelTab: id })}
                >
                  <Icon size={11} />
                  {label}
                </button>
              ))}
            </div>

            <div className="st-scroll flex-1 overflow-y-auto px-4 pb-5">
              {tab === "context" && (
                <ContextTab total={stats.total} byKind={stats.byKind} topics={topics} title={board?.title ?? ""} />
              )}
              {tab === "chat" && <ChatTab />}
              {tab === "actions" && <ActionsTab />}
              {tab === "generated" && <GeneratedTab />}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------------- tabs ---------------- */

function ContextTab({ total, byKind, topics, title }: { total: number; byKind: Record<string, number>; topics: string[]; title: string }) {
  const selCount = useStudio((s) => s.selection.length);
  const KIND_LABEL: Record<string, string> = {
    text: "text", sticky: "stickies", equation: "equations", ainote: "AI cards",
    diagram: "diagrams", quiz: "quizzes", flashcards: "card decks", image: "images",
    stroke: "sketches", shape: "shapes", arrow: "arrows", code: "code", table: "tables",
  };
  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div className="st-card rounded-[16px] p-4">
        <p className="font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.26em] text-[var(--st-faint)]">what CODE sees</p>
        <p className="mt-1.5 text-[13px] font-medium text-[var(--st-ink)]">{title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--st-dim)]">
          {total} objects on the board{selCount ? ` · ${selCount} selected` : ""}. Every response uses the whole board as context — selection sharpens it.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(byKind).map(([k, n]) => (
            <span key={k} className="st-chip">
              {KIND_LABEL[k] ?? k} × {n}
            </span>
          ))}
          {total === 0 && <span className="st-chip">empty board</span>}
        </div>
      </div>
      {topics.length > 0 && (
        <div className="st-card rounded-[16px] p-4">
          <p className="font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.26em] text-[var(--st-faint)]">detected topics</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {topics.map((t) => (
              <span key={t} className="rounded-full bg-[rgba(255,158,61,0.14)] px-2.5 py-1 text-[11px] capitalize text-[#ffd9ae]">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
      <p className="px-1 text-[10.5px] leading-relaxed text-[var(--st-faint)]">
        Tip — select an equation and the panel offers Solve &amp; Check; select a concept and it offers Explain &amp; Visualize.
      </p>
    </div>
  );
}

function ChatTab() {
  const conversation = useStudio((s) => s.conversation);
  if (!conversation.length) {
    return (
      <div className="flex flex-col items-center gap-2.5 pt-12 text-center">
        <ScanSearch size={22} className="text-[var(--st-faint)]" />
        <p className="text-[12px] leading-relaxed text-[var(--st-faint)]">
          No conversation yet. Select something on the canvas and run an action — or ask from the command bar below the board.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 pt-1">
      {conversation.map((t) => (
        <div key={t.id} className={`max-w-[92%] rounded-[14px] px-3.5 py-2.5 text-[12px] leading-relaxed ${t.role === "user" ? "self-end bg-[rgba(255,158,61,0.15)] text-[var(--st-ink)]" : "self-start border border-[var(--st-line)] bg-[rgba(21,22,28,0.7)] text-[var(--st-dim)]"}`}>
          {t.mode && (
            <span className="mb-1 block font-[family-name:var(--font-code-mono)] text-[8px] uppercase tracking-[0.22em] text-[var(--st-accent)]">
              {t.role === "user" ? "you · " : "code · "}
              {t.mode}
            </span>
          )}
          {t.text}
        </div>
      ))}
    </div>
  );
}

function ActionsTab() {
  const st = useStudio.getState;
  return (
    <div className="flex flex-col gap-2 pt-1">
      {AI_MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className="group flex items-center gap-3 rounded-[14px] border border-[var(--st-line)] bg-[rgba(21,22,28,0.55)] px-3.5 py-3 text-left transition-all hover:border-[rgba(255,158,61,0.45)] hover:bg-[rgba(255,158,61,0.1)]"
          onClick={() => st().askAI(m.id as AIMode)}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--st-accent-soft)]">
            <Zap size={13} className="text-[var(--st-accent)]" />
          </span>
          <span className="min-w-0">
            <span className="block text-[12.5px] font-semibold text-[var(--st-ink)]">{m.label}</span>
            <span className="block truncate text-[10.5px] text-[var(--st-faint)]">{m.hint}</span>
          </span>
        </button>
      ))}
      <div className="mt-1 grid grid-cols-2 gap-1.5">
        <button type="button" className="st-btn py-2 text-[11px]" onClick={() => st().setGenerate("notes")}>
          → Notes
        </button>
        <button type="button" className="st-btn py-2 text-[11px]" onClick={() => st().setGenerate("flashcards")}>
          → Flashcards
        </button>
        <button type="button" className="st-btn py-2 text-[11px]" onClick={() => st().setGenerate("quiz")}>
          → Quiz
        </button>
        <button type="button" className="st-btn py-2 text-[11px]" onClick={() => st().setGenerate("summary")}>
          → Summary
        </button>
      </div>
    </div>
  );
}

function GeneratedTab() {
  const generated = useStudio((s) => s.generated);
  const st = useStudio.getState;
  if (!generated.length) {
    return (
      <div className="flex flex-col items-center gap-2.5 pt-12 text-center">
        <FolderDown size={22} className="text-[var(--st-faint)]" />
        <p className="text-[12px] leading-relaxed text-[var(--st-faint)]">
          Diagrams, quizzes and notes CODE makes for you will collect here.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 pt-1">
      {generated.map((g) => (
        <button
          key={g.id}
          type="button"
          className="flex items-center gap-3 rounded-[13px] border border-[var(--st-line)] bg-[rgba(21,22,28,0.55)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--st-line-2)]"
          onClick={() => {
            const b = st().boards[st().activeBoardId];
            const o = b?.objects[g.objId];
            if (!o) return;
            const s2 = st();
            s2.setCamera({
              x: s2.viewport.w / 2 - (o.x + o.w / 2) * s2.camera.z,
              y: s2.viewport.h / 2 - (o.y + o.h / 2) * s2.camera.z,
              z: s2.camera.z,
            });
            s2.select([g.objId]);
          }}
        >
          <span className="st-chip shrink-0 border-[rgba(255,158,61,0.32)] text-[#ffd9ae]">{g.kind}</span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--st-dim)]">{g.title}</span>
          <Eye size={12} className="shrink-0 text-[var(--st-faint)]" />
        </button>
      ))}
    </div>
  );
}

/* shared: inline latex snippets in chat use Tex */
export function ChatTex({ text }: { text: string }) {
  if (!text.includes("\\")) return <span>{text}</span>;
  return <Tex tex={text} display={false} />;
}
