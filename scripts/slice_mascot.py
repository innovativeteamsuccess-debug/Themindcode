#!/usr/bin/env python3
"""Slice CODE mascot poses from the uploaded character sheet.

Stage 1: raw crops + corner color samples + calibration grid + contact sheet.
"""
from PIL import Image, ImageDraw
import os

SRC = "/home/z/my-project/upload/pasted_image_1793888942537.png"
OUT = "/tmp/mascot_raw"
os.makedirs(OUT, exist_ok=True)

im = Image.open(SRC).convert("RGBA")
W, H = im.size
print("sheet:", W, H)

# name -> (l, t, r, b)  in 658x431 space
CROPS = {
    "hero":       (4, 18, 176, 292),
    "happy":      (280, 31, 352, 123),
    "thinking":   (353, 31, 425, 123),
    "confident":  (425, 31, 497, 123),
    "confused":   (280, 122, 352, 208),
    "excited":    (353, 122, 425, 208),
    "tired":      (425, 122, 497, 208),
    "wow":        (280, 209, 352, 292),
    "focused":    (353, 209, 425, 292),
    "relieved":   (425, 209, 497, 292),
    "solving":    (500, 31, 592, 122),
    "practicing": (500, 122, 592, 208),
    "mastered":   (500, 209, 652, 298),
    "maths":      (200, 325, 283, 424),
    "science":    (284, 325, 367, 424),
    "sst":        (368, 325, 451, 424),
    "revise":     (452, 325, 536, 424),
}

for name, box in CROPS.items():
    c = im.crop(box)
    c.save(f"{OUT}/{name}.png")
    px = c.load()
    w, h = c.size
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    print(f"{name:10s} {c.size}  corners={corners}")

# grid overlay for calibration
g = im.copy()
d = ImageDraw.Draw(g)
for x in range(0, W, 50):
    d.line([(x, 0), (x, H)], fill=(255, 0, 0, 140), width=1)
    d.text((x + 2, 2), str(x), fill=(255, 0, 0, 255))
for y in range(0, H, 50):
    d.line([(0, y), (W, y)], fill=(0, 130, 255, 140), width=1)
    d.text((2, y + 2), str(y), fill=(0, 130, 255, 255))
g.save(f"{OUT}/_grid.png")

# contact sheet of crops on dark slate (mirrors the site bg)
cols = 5
rows = (len(CROPS) + cols - 1) // cols
cs = Image.new("RGBA", (cols * 150, rows * 165), (10, 22, 40, 255))
dd = ImageDraw.Draw(cs)
for i, name in enumerate(CROPS):
    c = Image.open(f"{OUT}/{name}.png")
    c.thumbnail((140, 140), Image.LANCZOS)
    x = (i % cols) * 150 + 5
    y = (i // cols) * 165 + 5
    cs.paste(c, (x, y), c)
    dd.text((x, y + 145), name, fill=(255, 255, 255, 255))
cs.save(f"{OUT}/_contact.png")
print("done ->", OUT)
