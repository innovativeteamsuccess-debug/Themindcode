/* CODE Studio — original brand mark for The Mind Code universe.
   An open canvas frame holding a thinking node. Pure SVG, no external assets. */

export function StudioMark({
  size = 28,
  pulse = false,
}: {
  size?: number;
  pulse?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden
      className={pulse ? "st-mark-pulse" : undefined}
    >
      {/* open canvas frame */}
      <path
        d="M15 6H9a3 3 0 0 0-3 3v27a3 3 0 0 0 3 3h6"
        stroke="url(#stg)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M33 6h6a3 3 0 0 1 3 3v27a3 3 0 0 1-3 3h-6"
        stroke="url(#stg)"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* thinking node */}
      <circle cx="24" cy="21" r="5.5" fill="#FF9E3D" />
      <circle cx="24" cy="21" r="9" stroke="#FF9E3D" strokeOpacity="0.35" strokeWidth="1.6" />
      <path d="M24 26.5V33" stroke="#BAB3A8" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M19.5 37h9"
        stroke="#A78BFA"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="stg" x1="6" y1="6" x2="42" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD9AE" />
          <stop offset="1" stopColor="#FF9E3D" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function StudioWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 select-none">
      <StudioMark size={compact ? 24 : 27} />
      <span className="flex flex-col leading-none">
        <span className="font-[family-name:var(--font-body-sans)] text-[13.5px] font-bold tracking-[0.18em] text-[#F4EFE9]">
          CODE&nbsp;STUDIO
        </span>
        {!compact && (
          <span className="font-[family-name:var(--font-code-mono)] mt-1 text-[8.5px] uppercase tracking-[0.28em] text-[#7E776D]">
            the ai learning canvas
          </span>
        )}
      </span>
    </span>
  );
}
