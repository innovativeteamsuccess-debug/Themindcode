#!/usr/bin/env python3
"""Chroma-key the green background out of the edited founder portrait.

Produces:
  public/founder-figure.png  — transparent subject layer (for 3D depth card)
  public/founder.jpg         — the untouched original (poster / fallback)
"""
from PIL import Image, ImageFilter
import numpy as np
import os

SRC_GREEN = "/home/z/my-project/scripts/founder_green.png"
SRC_ORIG = "/home/z/my-project/upload/pasted_image_1793876301348.png"
OUT_FIGURE = "/home/z/my-project/public/founder-figure.png"
OUT_ORIG = "/home/z/my-project/public/founder.jpg"

# ---------- 1. load & inspect ----------
img = Image.open(SRC_GREEN).convert("RGB")
print("green edit size:", img.size)
arr = np.asarray(img).astype(np.float32)
h, w, _ = arr.shape
r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
corners = {
    "top-left": arr[5, 5],
    "top-right": arr[5, -5],
    "bottom-left": arr[-5, 5],
    "bottom-right": arr[-5, -5],
}
print("corners:", {k: v.tolist() for k, v in corners.items()})

# ---------- 2. green-dominance mask ----------
# background is expected pure-ish green; subject is pure grayscale
# (r ~= g ~= b), so green dominance is a clean discriminator.
dominant = g > 90
strong = (g > 1.25 * np.maximum(r, 1)) & (g > 1.25 * np.maximum(b, 1))
mask_bg = dominant & strong  # True = background

coverage = mask_bg.mean()
print(f"background coverage: {coverage:.2%}")
if coverage < 0.15:
    raise SystemExit("ERROR: green background not detected — edit failed, do not ship")

# ---------- 3. alpha from mask, with soft edges ----------
alpha = np.where(mask_bg, 0.0, 255.0)

# soften: blur the binary alpha a little, then push mid values to keep
# crisp subject edge but feathered outer boundary
alpha_img = Image.fromarray(alpha.astype(np.uint8), "L")
alpha_soft = alpha_img.filter(ImageFilter.GaussianBlur(1.2))
a = np.asarray(alpha_soft).astype(np.float32)
# gamma trick: keep full opacity for mostly-solid, ramp near the edge
a = np.clip((a - 60) * (255.0 / (255.0 - 60.0)), 0, 255)

# ---------- 4. green decontamination on edges ----------
# where alpha is partial, pull green channel toward the grayscale average
gray = (r + g + b) / 3.0
edge = (a > 0) & (a < 250)
g_clean = g.copy()
g_clean[edge] = gray[edge] * 0.35 + g[edge] * 0.65
# also handle fully opaque pixels that kept a green cast (fringe spill)
spill = (~mask_bg) & (g > 1.12 * np.maximum(r, 1)) & (g > 1.12 * np.maximum(b, 1)) & (g > 70)
g_clean[spill] = gray[spill]
print(f"edge px: {edge.mean():.2%}, spill px: {spill.mean():.2%}")

rgba = np.dstack([
    r.astype(np.uint8),
    np.clip(g_clean, 0, 255).astype(np.uint8),
    b.astype(np.uint8),
    a.astype(np.uint8),
])
figure = Image.fromarray(rgba, "RGBA")

# ---------- 5. crop to subject with padding ----------
ys, xs = np.where(a > 8)
if len(xs) == 0:
    raise SystemExit("ERROR: no subject pixels found")
pad = 14
x0, x1 = max(int(xs.min()) - pad, 0), min(int(xs.max()) + pad, w)
y0, y1 = max(int(ys.min()) - pad, 0), min(int(ys.max()) + pad, h)
figure = figure.crop((x0, y0, x1, y1))
print("figure crop:", figure.size)

figure.save(OUT_FIGURE, optimize=True)
print("saved", OUT_FIGURE, os.path.getsize(OUT_FIGURE) // 1024, "KB")

# ---------- 6. original as optimized jpg (base/poster layer) ----------
orig = Image.open(SRC_ORIG).convert("RGB")
orig.save(OUT_ORIG, quality=88, optimize=True)
print("saved", OUT_ORIG, os.path.getsize(OUT_ORIG) // 1024, "KB")

# ---------- 7. quick sanity render: composite over dark bg ----------
bg = Image.new("RGB", figure.size, (10, 10, 14))
bg.paste(figure, (0, 0), figure)
bg.save("/home/z/my-project/scripts/founder_check.jpg", quality=80)
print("sanity composite saved to scripts/founder_check.jpg")
