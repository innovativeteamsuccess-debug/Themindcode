#!/usr/bin/env python3
"""Stage 2: recalibrated crops -> upscale -> rembg cutout -> trim -> contact sheet.

Outputs transparent PNGs to /tmp/mascot_cut/ and a review sheet on dark navy.
"""
from PIL import Image, ImageDraw, ImageFilter
import os, sys

SRC = "/home/z/my-project/upload/pasted_image_1793888942537.png"
RAW = "/tmp/mascot_raw2"
OUT = "/tmp/mascot_cut"
os.makedirs(RAW, exist_ok=True)
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGBA")

# name -> (l, t, r, b) recalibrated from grid overlay
CROPS = {
    "hero":       (6, 30, 152, 290),
    "happy":      (290, 36, 358, 114),
    "thinking":   (361, 36, 429, 114),
    "confident":  (432, 36, 500, 114),
    "confused":   (290, 117, 358, 195),
    "excited":    (361, 117, 429, 195),
    "tired":      (432, 117, 500, 195),
    "wow":        (290, 200, 358, 280),
    "focused":    (361, 200, 429, 280),
    "relieved":   (432, 200, 500, 280),
    "solving":    (503, 36, 600, 112),
    "practicing": (503, 118, 600, 194),
    "mastered":   (503, 200, 652, 294),
    "maths":      (200, 328, 283, 422),
    "science":    (284, 328, 367, 422),
    "sst":        (368, 328, 451, 422),
    "revise":     (452, 328, 536, 422),
}

UP = 3  # upscale factor before segmentation

for name, box in CROPS.items():
    c = im.crop(box)
    c = c.resize((c.width * UP, c.height * UP), Image.LANCZOS)
    c.save(f"{RAW}/{name}.png")
print("upscaled crops saved")

# ---- rembg session ----
from rembg import remove, new_session
try:
    session = new_session("isnet-general-use")
    print("session: isnet-general-use")
except Exception as e:
    print("isnet unavailable, falling back to u2net:", e)
    session = new_session("u2net")

def clean_alpha(img):
    """Ramp the alpha to kill halos, keep smooth edges."""
    r, g, b, a = img.split()
    lut = []
    for v in range(256):
        if v < 100:
            lut.append(0)
        elif v > 190:
            lut.append(255)
        else:
            lut.append(int((v - 100) * 255 / 90))
    a = a.point(lut)
    return Image.merge("RGBA", (r, g, b, a))

cut = {}
for name in CROPS:
    src = Image.open(f"{RAW}/{name}.png")
    res = remove(src, session=session)
    res = clean_alpha(res)
    # trim to content bbox with a little padding
    bbox = res.getbbox()
    if bbox:
        l, t, r, b = bbox
        pad = 6
        l = max(0, l - pad); t = max(0, t - pad)
        r = min(res.width, r + pad); b = min(res.height, b + pad)
        res = res.crop((l, t, r, b))
    res.save(f"{OUT}/{name}.png")
    cut[name] = res
    print(f"{name:10s} -> {res.size}")

# ---- contact sheet on dark navy ----
names = list(CROPS.keys())
cols = 5
cell_w, cell_h = 190, 230
rows = (len(names) + cols - 1) // cols
cs = Image.new("RGBA", (cols * cell_w, rows * cell_h), (7, 26, 51, 255))
dd = ImageDraw.Draw(cs)
for i, name in enumerate(names):
    c = cut[name]
    scale = min((cell_w - 20) / c.width, (cell_h - 34) / c.height, 1.0)
    c2 = c.resize((max(1, int(c.width * scale)), max(1, int(c.height * scale))), Image.LANCZOS)
    x = (i % cols) * cell_w + (cell_w - c2.width) // 2
    y = (i // cols) * cell_h + 6
    cs.paste(c2, (x, y), c2)
    dd.text(((i % cols) * cell_w + 8, (i // cols) * cell_h + cell_h - 24), name, fill=(255, 255, 255, 255))
cs.convert("RGB").save(f"{OUT}/_review.png")
print("review sheet ->", f"{OUT}/_review.png")
