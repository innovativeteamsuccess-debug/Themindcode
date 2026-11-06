#!/usr/bin/env python3
"""Regenerate brand assets from the official uploaded logo (v2).

v1 flaw: density profiling pulled in laurel columns and clipped tagline
text at the bottom. v2 finds the SHIELD-ONLY bounding box via gap
detection (shield rows end before the tagline band starts).

Produces:
  public/logo-mark.png  — clean, centered shield emblem (transparent, 512x512)
  src/app/icon.png      — favicon (same emblem, 512x512)
"""
from PIL import Image

SRC = "/home/z/my-project/upload/White_Elegant_Minimalistic_Background_Twitter_Profile_Picture-removebg-preview.png"

im = Image.open(SRC).convert("RGBA")
W, H = im.size
px = im.getchannel("A").load()

# --- row density in the central band (shield zone, laurels excluded) ---
BAND_L, BAND_R = 118, 282
row_d = [sum(1 for x in range(BAND_L, BAND_R) if px[x, y] > 40) / (BAND_R - BAND_L) for y in range(H)]
max_d = max(row_d)

# shield top: first dense row
top = next(y for y in range(H // 3, H) if row_d[y] > 0.45 * max_d)

# shield bottom: first run of >=4 consecutive sparse rows after y=240 (gap
# between the shield pedestal and the tagline) -> crop ends in that gap
bottom = None
run = 0
for y in range(240, H):
    if row_d[y] < 0.18 * max_d:
        run += 1
        if run >= 4:
            bottom = y - run + 1  # last dense row before the gap
            break
    else:
        run = 0
assert bottom, "no gap found"
print(f"shield rows {top}..{bottom}  (tagline starts after gap at y={bottom+1}+)")

# --- column extent: measured dense-run profile of this exact image ---
# dense runs within shield rows: (74,114)=left laurel · (125,142)+(154,247)+
# (257,275)=shield walls & book · (285,325)=right laurel  →  shield = 125..275
left, right = 125, 275
print(f"shield cols {left}..{right}")

# --- crop, pad to square with 8% margin, save 512x512 ---
crop = im.crop((left, top, right + 1, bottom + 1))
cw, ch = crop.size
side = int(max(cw, ch) * 1.16) + 8
canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
canvas.paste(crop, ((side - cw) // 2, (side - ch) // 2), crop)
out = canvas.resize((512, 512), Image.LANCZOS)

out.save("/home/z/my-project/public/logo-mark.png", optimize=True)
out.save("/home/z/my-project/src/app/icon.png", optimize=True)
print(f"saved 512x512 emblem from shield crop {cw}x{ch}")
