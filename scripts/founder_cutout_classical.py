#!/usr/bin/env python3
"""Classical, pixel-faithful background removal for the founder portrait.

The AI edit regenerated the man's face/details -> rejected (no-fabrication
constraint). This pipeline cuts the subject out of the ORIGINAL photo:

  1. GrabCut (rect init, studio backdrop is a smooth light gradient)
  2. largest-component + small-hole cleanup
  3. backdrop-color deviation guard on the edge band (kills gray fringe)
  4. feathered alpha, 2x LANCZOS upscale for retina sharpness

Output: public/founder-figure.png (transparent, original pixels only)
"""
import cv2
import numpy as np
from PIL import Image, ImageFilter

SRC = "/home/z/my-project/upload/pasted_image_1793876301348.png"
OUT = "/home/z/my-project/public/founder-figure.png"
CHECK = "/home/z/my-project/scripts/founder_check2.jpg"

img = cv2.imread(SRC, cv2.IMREAD_COLOR)  # BGR
h, w = img.shape[:2]
print("original:", w, "x", h)

# ---------- 1. GrabCut with a generous subject rectangle ----------
# light blur first: reduces suit-texture noise leaking into the BG model
blurred = cv2.GaussianBlur(img, (3, 3), 0)

rect = (int(w * 0.10), int(h * 0.03), int(w * 0.80), int(h * 0.97))
mask = np.zeros((h, w), np.uint8)  # GC_BGD
bgd_model = np.zeros((1, 65), np.float64)
fgd_model = np.zeros((1, 65), np.float64)
cv2.grabCut(blurred, mask, rect, bgd_model, fgd_model, 8, cv2.GC_INIT_WITH_RECT)

fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
print(f"grabcut fg coverage: {fg.mean():.2%}")

# ---------- 2. cleanup: largest component + fill small holes ----------
n, labels, stats, _ = cv2.connectedComponentsWithStats(fg, 8)
if n > 2:
    # keep the largest component plus any component >= 8% of the largest
    areas = stats[1:, cv2.CC_STAT_AREA]
    biggest = areas.max()
    keep_ids = [i + 1 for i, a in enumerate(areas) if a >= biggest * 0.08]
    fg = np.isin(labels, keep_ids).astype(np.uint8)

# fill holes smaller than 600px (noise); keep larger genuine gaps open
inv = 1 - fg
n2, labels2, stats2, _ = cv2.connectedComponentsWithStats(inv, 8)
for i in range(1, n2):
    if stats2[i, cv2.CC_STAT_AREA] < 600:
        inv[labels2 == i] = 0
fg = 1 - inv

# close 1px slivers, then erode 1px to pull the matte inside the suit edge
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, kernel, iterations=2)
fg = cv2.erode(fg, kernel, iterations=1)
print(f"cleaned fg coverage: {fg.mean():.2%}")

# ---------- 3. backdrop fringe guard ----------
# model the smooth backdrop from a 6px border ring; any FG-edge pixel close
# to the local backdrop tone is pushed to background
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
ring = np.zeros((h, w), bool)
ring[:6, :] = ring[-6:, :] = True
ring[:, :6] = ring[:, -6:] = True
# fit a smooth plane to the border ring tones (backdrop is a gentle gradient)
ys, xs = np.mgrid[0:h, 0:w]
ry, rx = ys[ring], xs[ring]
vals = gray[ring]
A = np.stack([ry, rx, np.ones_like(ry)], 1)
coef, *_ = np.linalg.lstsq(A, vals, rcond=None)
bg_field = coef[0] * ys + coef[1] * xs + coef[2]
resid_ring = np.abs(vals - (coef[0] * ry + coef[1] * rx + coef[2]))
tol = max(12.0, 3.5 * resid_ring.std())
deviation = np.abs(gray - bg_field)

edge_band = cv2.dilate(fg, kernel, iterations=2) - cv2.erode(fg, kernel, iterations=2)
fringe = (edge_band > 0) & (fg > 0) & (deviation < tol)
fg[fringe] = 0
print(f"fringe pixels removed: {int(fringe.sum())} (tol {tol:.1f})")

# ---------- 4. feathered alpha + 2x upscale ----------
alpha = cv2.GaussianBlur((fg * 255).astype(np.uint8), (3, 3), 0.8)
alpha = np.clip((alpha.astype(np.float32) - 70) * (255.0 / 185.0), 0, 255).astype(np.uint8)

bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
bgra[..., 3] = alpha

# crop to subject + margin, then upscale 2x for retina
ys2, xs2 = np.where(alpha > 8)
pad = 8
x0, x1 = max(int(xs2.min()) - pad, 0), min(int(xs2.max()) + pad, w)
y0, y1 = max(int(ys2.min()) - pad, 0), min(int(ys2.max()) + pad, h)
crop = bgra[y0:y1, x0:x1]

up = cv2.resize(crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(OUT, up)
print("figure:", up.shape[1], "x", up.shape[0], "->", OUT)

# ---------- sanity composite on the site's dark background ----------
fig_pil = Image.open(OUT).convert("RGBA")
bg = Image.new("RGB", fig_pil.size, (9, 9, 13))
bg.paste(fig_pil, (0, 0), fig_pil)
bg.save(CHECK, quality=85)
print("sanity composite ->", CHECK)
