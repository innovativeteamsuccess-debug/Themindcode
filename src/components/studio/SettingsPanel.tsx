"use client";

/* Settings + keyboard shortcuts overlay. */

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useStudio } from "./store";
import { Modal } from "./GenerateDialog";

const SHORTCUTS: { group: string; items: [string, string][] }[] = [
  {
    group: "Tools",
    items: [
      ["V / P / H / E", "Select · Pen · Highlighter · Eraser"],
      ["T / F / S / A", "Text · Equation · Shape · Arrow"],
      ["I / N / D", "Image · Sticky · Diagram(AI)"],
      ["M", "Voice mode"],
      ["Space + drag", "Pan the canvas"],
    ],
  },
  {
    group: "Objects",
    items: [
      ["⌘Z / ⇧⌘Z", "Undo · Redo"],
      ["⌘D", "Duplicate selection"],
      ["⌘C / ⌘V", "Copy · Paste"],
      ["⌘G", "Group selection"],
      ["⌘L", "Lock / unlock"],
      ["⌫", "Delete selection"],
      ["Arrows", "Nudge selection"],
      ["⌘A", "Select all"],
      ["Double-click", "Edit text · equation"],
    ],
  },
  {
    group: "Canvas & studio",
    items: [
      ["⌘K", "Command palette"],
      ["⌘/", "Ask Canvas AI"],
      ["+ / − / 0", "Zoom in · out · reset"],
      ["⇧1", "Zoom to fit"],
      ["⌥ drag", "Pan from anywhere"],
      ["Esc", "Deselect / close"],
    ],
  },
];

export function SettingsPanel() {
  const open = useStudio((s) => s.settingsOpen);
  const settings = useStudio((s) => s.settings);
  const st = useStudio.getState;

  return (
    <Modal open={open} onClose={() => st().toggle("settingsOpen")}>
      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        <h2 className="text-[15px] font-semibold text-[var(--st-ink)]">Studio settings</h2>
        <button type="button" className="st-btn h-8 w-8" onClick={() => st().toggle("settingsOpen")} aria-label="Close settings">
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-col gap-1 px-5 py-3">
        <Row label="Background grid" hint="Dot grid, line grid, or clean">
          <div className="flex gap-1">
            {(["dots", "lines", "none"] as const).map((g) => (
              <button key={g} type="button" className="st-btn px-2.5 py-1 text-[10.5px] capitalize" data-active={settings.grid === g} onClick={() => st().setSetting("grid", g)}>
                {g}
              </button>
            ))}
          </div>
        </Row>
        <Toggle label="Magnetic snapping" hint="Align to nearby edges & centres" value={settings.snap} onChange={(v) => st().setSetting("snap", v)} />
        <Toggle label="Minimap" hint="Board overview, bottom-right" value={settings.minimap} onChange={(v) => st().setSetting("minimap", v)} />
        <Toggle label="Reduce motion" hint="Calmer transitions everywhere" value={settings.reduceMotion} onChange={(v) => st().setSetting("reduceMotion", v)} />
        <Toggle label="High contrast" hint="Brighter lines & text" value={settings.highContrast} onChange={(v) => st().setSetting("highContrast", v)} />
      </div>
      <div className="flex items-center justify-between px-5 pb-4 pt-1">
        <button type="button" className="st-btn px-3 py-1.5 text-[11.5px]" onClick={() => st().toggle("shortcutsOpen")}>
          Keyboard shortcuts
        </button>
        <span className="font-[family-name:var(--font-code-mono)] text-[9px] uppercase tracking-[0.2em] text-[var(--st-faint)]">
          CODE Studio v1
        </span>
      </div>
    </Modal>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[13px] px-1 py-2.5">
      <div>
        <p className="text-[12.5px] font-medium text-[var(--st-ink)]">{label}</p>
        <p className="text-[10.5px] text-[var(--st-faint)]">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ label, hint, value, onChange }: { label: string; hint: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label} hint={hint}>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className="relative h-[22px] w-[38px] shrink-0 rounded-full border transition-colors"
        style={{
          background: value ? "rgba(255,158,61,0.4)" : "rgba(255,171,98,0.09)",
          borderColor: value ? "rgba(255,158,61,0.65)" : "var(--st-line)",
        }}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 32 }}
          className="absolute top-1/2 h-[16px] w-[16px] -translate-y-1/2 rounded-full bg-[var(--st-ink)]"
          style={{ left: value ? 19 : 3 }}
        />
      </button>
    </Row>
  );
}

export function ShortcutsOverlay() {
  const open = useStudio((s) => s.shortcutsOpen);
  const st = useStudio.getState;
  return (
    <Modal open={open} onClose={() => st().toggle("shortcutsOpen")} wide>
      <div className="flex items-center justify-between px-5 pb-2 pt-4">
        <h2 className="text-[15px] font-semibold text-[var(--st-ink)]">Keyboard shortcuts</h2>
        <button type="button" className="st-btn h-8 w-8" onClick={() => st().toggle("shortcutsOpen")} aria-label="Close shortcuts">
          <X size={14} />
        </button>
      </div>
      <div className="grid gap-5 px-5 pb-5 sm:grid-cols-3">
        {SHORTCUTS.map((g) => (
          <div key={g.group}>
            <p className="pb-1.5 font-[family-name:var(--font-code-mono)] text-[8.5px] uppercase tracking-[0.24em] text-[var(--st-faint)]">{g.group}</p>
            <div className="flex flex-col gap-1.5">
              {g.items.map(([k, label]) => (
                <div key={k} className="flex items-center justify-between gap-2 text-[11.5px]">
                  <span className="text-[var(--st-dim)]">{label}</span>
                  <span className="st-kbd shrink-0">{k}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function Overlays() {
  return (
    <>
      <SettingsPanel />
      <ShortcutsOverlay />
    </>
  );
}
