"use client";

/* ⌘K — every action in the studio, grouped, fuzzy-searchable. */


import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Type, StickyNote, Pi, Shapes, ArrowUpRight, Image as ImageIcon, Pen, Highlighter,
  Eraser, MousePointer2, Hand, Mic, Sparkles, Table, Code2, Network,
  Copy, FileDown, FileJson, Printer, Search, Maximize, Grid3x3,
  Star, Settings2, Keyboard, Wand2, ZoomIn, ZoomOut,
} from "lucide-react";
import { useStudio } from "./store";

export default function CommandPalette() {
  const open = useStudio((s) => s.paletteOpen);
  const st = useStudio.getState;

  function run(fn: () => void) {
    fn();
    st().toggle("paletteOpen");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[80] flex items-start justify-center bg-[rgba(3,8,18,0.6)] pt-[14vh] backdrop-blur-[4px]"
          onClick={() => st().toggle("paletteOpen")}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className="st-glass w-[min(580px,calc(100vw-32px))] overflow-hidden rounded-[18px]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Command palette"
          >
            <Command label="Command palette" className="st-palette">
              <div className="flex items-center gap-2.5 border-b border-[var(--st-line)] px-4">
                <Search size={14} className="text-[var(--st-faint)]" />
                <Command.Input
                  autoFocus
                  placeholder="Search commands…"
                  className="w-full bg-transparent py-3.5 text-[13.5px] text-[var(--st-ink)] outline-none placeholder:text-[var(--st-faint)]"
                />
              </div>
              <Command.List className="st-scroll max-h-[52vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-[12px] text-[var(--st-faint)]">
                  Nothing matches that.
                </Command.Empty>

                <Group heading="Ask CODE">
                  {(
                    [
                      ["Explain the selection", Sparkles, () => run(() => st().askAI("explain"))],
                      ["Solve the selection", Sparkles, () => run(() => st().askAI("solve"))],
                      ["Check my work", Sparkles, () => run(() => st().askAI("check"))],
                      ["Give me a hint", Sparkles, () => run(() => st().askAI("hint"))],
                      ["Make this easier", Sparkles, () => run(() => st().askAI("simplify"))],
                      ["Draw a diagram", Sparkles, () => run(() => st().askAI("visualize"))],
                      ["Quiz me on this board", Sparkles, () => run(() => st().askAI("quiz"))],
                      ["Make revision notes", Sparkles, () => run(() => st().askAI("revise"))],
                      ["Summarize the board", Sparkles, () => run(() => st().askAI("summary"))],
                    ] as const
                  ).map(([label, Icon, fn]) => (
                    <Item key={label} icon={Icon} label={label} onSelect={fn} />
                  ))}
                </Group>

                <Group heading="Place on canvas">
                  <Item icon={Type} label="Text" kbd="T" onSelect={() => run(() => st().setTool("text"))} />
                  <Item icon={StickyNote} label="Sticky note" kbd="N" onSelect={() => run(() => st().setTool("sticky"))} />
                  <Item icon={Pi} label="Equation" kbd="F" onSelect={() => run(() => st().setTool("equation"))} />
                  <Item icon={Shapes} label="Shape" kbd="S" onSelect={() => run(() => st().setTool("shape"))} />
                  <Item icon={ArrowUpRight} label="Arrow / connector" kbd="A" onSelect={() => run(() => st().setTool("arrow"))} />
                  <Item icon={ImageIcon} label="Image upload" kbd="I" onSelect={() => run(() => st().setTool("image"))} />
                  <Item icon={Pen} label="Pen" kbd="P" onSelect={() => run(() => st().setTool("pen"))} />
                  <Item icon={Highlighter} label="Highlighter" kbd="H" onSelect={() => run(() => st().setTool("highlighter"))} />
                  <Item icon={Eraser} label="Eraser" kbd="E" onSelect={() => run(() => st().setTool("eraser"))} />
                  <Item icon={MousePointer2} label="Select" kbd="V" onSelect={() => run(() => st().setTool("select"))} />
                  <Item icon={Hand} label="Pan" onSelect={() => run(() => st().setTool("hand"))} />
                  <Item icon={Mic} label="Voice mode" kbd="M" onSelect={() => run(() => st().setVoiceOpen(true))} />
                  <Item icon={Network} label="Ask CODE to diagram a topic" onSelect={() => run(() => st().setAI({ aiBarOpen: true }))} />
                  <Item icon={Table} label="Table (from Generate dialog)" onSelect={() => run(() => st().setGenerate("notes"))} />
                  <Item icon={Code2} label="Code block (from Notes export)" onSelect={() => run(() => st().setGenerate("notes"))} />
                  <Item icon={Copy} label="Duplicate selection" kbd="⌘D" onSelect={() => run(() => st().duplicateObjects(st().selection))} />
                </Group>

                <Group heading="Board">
                  <Item icon={Wand2} label="Generate notes / quiz / flashcards…" onSelect={() => run(() => st().setGenerate("notes"))} />
                  <Item icon={Printer} label="Export as PDF (print)" onSelect={() => run(() => window.print())} />
                  <Item icon={FileDown} label="Export as Markdown" onSelect={() => run(() => st().toggle("exportOpen"))} />
                  <Item icon={FileJson} label="Export board data (JSON)" onSelect={() => run(() => st().toggle("exportOpen"))} />
                  <Item icon={Star} label="Star this board" onSelect={() => run(() => st().toggleFavorite(st().activeBoardId))} />
                </Group>

                <Group heading="View">
                  <Item icon={ZoomIn} label="Zoom in" onSelect={() => run(() => st().zoomBy(1.2))} />
                  <Item icon={ZoomOut} label="Zoom out" onSelect={() => run(() => st().zoomBy(1 / 1.2))} />
                  <Item icon={Maximize} label="Zoom to fit" kbd="⇧1" onSelect={() => run(() => st().zoomToFit())} />
                  <Item icon={Grid3x3} label="Toggle grid style" onSelect={() => run(() => st().setSetting("grid", st().settings.grid === "dots" ? "lines" : st().settings.grid === "lines" ? "none" : "dots"))} />
                  <Item icon={Keyboard} label="Keyboard shortcuts" kbd="?" onSelect={() => run(() => st().toggle("shortcutsOpen"))} />
                  <Item icon={Settings2} label="Settings" onSelect={() => run(() => st().toggle("settingsOpen"))} />
                </Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group heading={heading} className="st-cmd-group">
      <div className="px-3 pb-1 pt-2.5 font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.24em] text-[var(--st-faint)] st-cmd-heading">
        {heading}
      </div>
      {children}
    </Command.Group>
  );
}

function Item({ icon: Icon, label, kbd, onSelect }: { icon: typeof Type; label: string; kbd?: string; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[12.5px] text-[var(--st-dim)] data-[selected=true]:bg-[rgba(255,171,98,0.12)] data-[selected=true]:text-[var(--st-ink)]"
    >
      <Icon size={13.5} className="shrink-0 text-[var(--st-faint)]" />
      <span className="flex-1">{label}</span>
      {kbd && <span className="st-kbd">{kbd}</span>}
    </Command.Item>
  );
}
