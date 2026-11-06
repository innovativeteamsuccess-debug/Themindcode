"use client";

import { create } from "zustand";
import { useRouter } from "next/navigation";
import type { SubjectKey } from "./data";

type UniverseState = {
  /* vault filters (shared with the universe explorer) */
  vaultClass: number | "all";
  vaultSubject: SubjectKey | "all";
  setVaultFilter: (cls: number | "all", subject: SubjectKey | "all") => void;

  /* code (mascot assistant) */
  codeOpen: boolean;
  codeTeaser: number;
  setCodeOpen: (open: boolean) => void;

  /* core warp transition */
  warp: boolean;
  setWarp: (w: boolean) => void;
};

export const useUniverse = create<UniverseState>((set) => ({
  vaultClass: "all",
  vaultSubject: "all",
  setVaultFilter: (cls, subject) =>
    set({ vaultClass: cls, vaultSubject: subject }),
  codeOpen: false,
  codeTeaser: 0,
  setCodeOpen: (open) => set({ codeOpen: open }),
  warp: false,
  setWarp: (w) => set({ warp: w }),
}));

/**
 * The signature "ENTER THE MIND CORE" transition — now a router
 * navigation. The core expands, then the next world loads.
 */
export function useWarpNavigate() {
  const router = useRouter();
  return function warpTo(href: string) {
    const { warp, setWarp } = useUniverse.getState();
    if (warp) return;
    setWarp(true);
    window.setTimeout(() => router.push(href), 420);
    window.setTimeout(() => setWarp(false), 1600);
  };
}
