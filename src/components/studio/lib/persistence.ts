/* ============================================================
   CODE STUDIO — persistence
   Debounced autosave to localStorage with versioned recovery.
   ============================================================ */

import type { Board, Folder } from "../types";

export interface StudioPersisted {
  version: 3;
  folders: Folder[];
  boards: Record<string, Board>;
  activeBoardId: string;
  settings: Record<string, unknown>;
}

const KEY = "code-studio-v3";

export function loadPersisted(): StudioPersisted | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StudioPersisted;
    if (data.version !== 3 || !data.boards || !data.folders) return null;
    return data;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let lastPayload: string = "";

/** Debounced save — called from the store subscription. */
export function schedulePersist(snapshot: () => StudioPersisted, onSaved: () => void) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const data = JSON.stringify(snapshot());
      if (data === lastPayload) {
        onSaved();
        return;
      }
      window.localStorage.setItem(KEY, data);
      lastPayload = data;
      onSaved();
    } catch {
      // storage full / unavailable — stay silent, canvas keeps working
    }
  }, 650);
}

export function clearPersisted() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
