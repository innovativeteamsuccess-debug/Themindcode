"use client";

import StudioApp from "@/components/studio/StudioApp";

/* Hydration-safe: StudioApp renders a branded splash until the store
   hydrates from local persistence (inside its own effect). SSR and
   the client render the identical splash — no mismatch. */
export default function StudioPage() {
  return <StudioApp />;
}
