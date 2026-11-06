"use client";

import { useMemo } from "react";
import katex from "katex";

/** Renders LaTeX via KaTeX (CSS imported in the studio layout). */
export function Tex({ tex, display = true, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex && tex.trim() ? tex : "\\;\\dots", {
        displayMode: display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return '<span style="opacity:.45">invalid latex</span>';
    }
  }, [tex, display]);
  return <span className={`st-equation ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}
