"""Navy-brand sweep: replace remaining gold-era CTA fills + hardcodes."""
import pathlib

R = [
    # (file, old, new)
    ("src/components/mindcode/final-section.tsx",
     'bg-[var(--mc-accent)] px-8 py-4 text-[12px] text-[#08080b] shadow-[0_0_44px_-8px_var(--mc-glow)]',
     'bg-[var(--mc-cta-bg)] px-8 py-4 text-[12px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-8px_var(--mc-glow)]'),
    ("src/components/mindcode/command-centre.tsx",
     '? "bg-[var(--mc-accent)] text-[#08080b]"',
     '? "bg-[var(--mc-accent-deep)] text-white"'),
    ("src/components/mindcode/command-centre.tsx",
     'bg-[var(--mc-accent)] px-5 py-2.5 text-[10px] text-[#08080b] transition-transform hover:scale-[1.04]',
     'bg-[var(--mc-cta-bg)] px-5 py-2.5 text-[10px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.04]'),
    ("src/components/mindcode/vault.tsx",
     'bg-[var(--mc-accent)] px-5 py-2.5 text-[10px] text-[#08080b]',
     'bg-[var(--mc-cta-bg)] px-5 py-2.5 text-[10px] text-[var(--mc-cta-fg)]'),
    ("src/components/mindcode/private-learning.tsx",
     'bg-[var(--mc-accent)] py-4 text-sm font-semibold tracking-wide text-[#08080b] shadow-[0_0_40px_-10px_var(--mc-glow)]',
     'bg-[var(--mc-cta-bg)] py-4 text-sm font-semibold tracking-wide text-[var(--mc-cta-fg)] shadow-[0_0_40px_-10px_var(--mc-glow)]'),
    ("src/components/mindcode/private-learning.tsx",
     'border-[#08080b]/30 border-t-[#08080b]',
     'border-[var(--mc-cta-fg)]/30 border-t-[var(--mc-cta-fg)]'),
    ("src/components/mindcode/founder.tsx",
     'bg-[var(--mc-accent)] px-6 py-3 text-[11px] text-[#08080b] transition-transform hover:scale-[1.03]',
     'bg-[var(--mc-cta-bg)] px-6 py-3 text-[11px] text-[var(--mc-cta-fg)] transition-transform hover:scale-[1.03]'),
    ("src/components/mindcode/universe-explorer.tsx",
     'hover:bg-[var(--mc-accent)] hover:text-[#08080b]',
     'hover:bg-[var(--mc-cta-bg)] hover:text-[var(--mc-cta-fg)]'),
    ("src/components/mindcode/book.tsx",
     'bg-[var(--mc-accent)] px-8 py-4 text-[12px] text-[#08080b] shadow-[0_0_44px_-10px_var(--mc-glow)]',
     'bg-[var(--mc-cta-bg)] px-8 py-4 text-[12px] text-[var(--mc-cta-fg)] shadow-[0_0_44px_-10px_var(--mc-glow)]'),
    # book spine: teal-black -> deep navy ramp
    ("src/components/mindcode/book.tsx",
     '"linear-gradient(to right, #07110f 0%, #0e201c 55%, #16302a 100%)"',
     '"linear-gradient(to right, #04101f 0%, #0a2038 55%, #14304f 100%)"'),
    # canvas fallback colors (CSS vars are re-read at runtime; defaults follow brand)
    ("src/components/mindcode/mind-core-canvas.tsx",
     'let ink = "#f1ede2";',
     'let ink = "#f7f9fc";'),
    ("src/components/mindcode/mind-core-canvas.tsx",
     'let dim = "#9a958a";',
     'let dim = "#9db2d0";'),
    ("src/components/mindcode/mind-core-canvas.tsx",
     'let accent = "#ffb224";',
     'let accent = "#3b82f6";'),
    ("src/components/mindcode/mind-core-canvas.tsx",
     'let accentSoft = "rgba(255,178,36,0.28)";',
     'let accentSoft = "rgba(59,130,246,0.28)";'),
    ("src/app/layout.tsx",
     'themeColor: "#08080B"',
     'themeColor: "#071A33"'),
]

for f, old, new in R:
    p = pathlib.Path(f)
    s = p.read_text()
    n = s.count(old)
    if n == 0:
        print(f"MISS  {f} :: {old[:60]}")
        continue
    p.write_text(s.replace(old, new))
    print(f"OK({n}) {f} :: {old[:48]} -> {new[:48]}")
