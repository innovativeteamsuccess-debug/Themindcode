#!/usr/bin/env python3
"""Pixel-faithful founder cutout, v3 — inpainted-backdrop deviation.

Key insight: the subject never matches the SMOOTH studio backdrop —
dark parts (suit, shadow face, tie) are far darker, bright parts
(shirt, pocket square, head shine) are far brighter. The v2 failure
came from a contaminated polynomial backdrop fit. Here the backdrop
is reconstructed by inpainting the subject away:

  1. subject seed (high precision): gray < 135  OR  gray > 243
  2. dilate + add textured regions (edge map) -> inpaint mask
  3. B = cv2.inpaint(...)  -> smooth, uncontaminated backdrop field
  4. dev = |gray - B| ; hysteresis thresholds from clean backdrop stats
  5. close/fill/feather ; 2x LANCZOS upscale ; original pixels only

Output: public/founder-figure.png (+ white & dark composites for review)
"""
import cv2
import numpy as np
from PIL import Image

SRC = "/home/z/my-project/upload/pasted_image_1793876301348.png"
OUT = "/home/z/my-project/public/founder-figure.png"
CHK_DARK = "/home/z/my-project/scripts/founder_check3.jpg"
CHK_WHITE = "/home/z/my-project/scripts/founder_check_white.jpg"

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
h, w = img.shape[:2]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)

# ---------- 1. high-precision subject seed ----------
dark = gray < 135          # suit, shadow face, tie, watch, eyes
bright = gray > 243        # shirt highlights, pocket square, head shine
seed = ((dark | bright).astype(np.uint8)) * 255
print(f"seed coverage: dark={dark.mean():.1%} bright={bright.mean():.1%}")

# textured regions: lapels, face features, tie dots, edges
gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
edge = np.sqrt(gx * gx + gy * gy)
textured = (edge > 14).astype(np.uint8) * 255

# ---------- 2. inpaint mask: seed + texture + transition band ----------
k5 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
inpaint_mask = cv2.dilate(seed, k5, iterations=3)
inpaint_mask = cv2.bitwise_or(inpaint_mask, cv2.dilate(textured, k5, iterations=2))
# the whole torso center column is subject — protect the middle generously
inpaint_mask = cv2.dilate(inpaint_mask, k5, iterations=1)
print(f"inpaint mask coverage: {(inpaint_mask > 0).mean():.1%}")

# ---------- 3. inpainted backdrop field ----------
bgr8 = img.astype(np.uint8)
B = cv2.inpaint(bgr8, inpaint_mask, 15, cv2.INPAINT_TELEA)
B_gray = cv2.cvtColor(B, cv2.COLOR_BGR2GRAY).astype(np.float32)

# smooth it further: the true backdrop has no high frequencies
B_gray = cv2.GaussianBlur(B_gray, (31, 31), 0)

dev = np.abs(gray - B_gray)
# clean backdrop stats = pixels we did NOT inpaint
clean = inpaint_mask == 0
dmean, dstd = dev[clean].mean(), dev[clean].std()
print(f"clean backdrop dev: mean={dmean:.2f} std={dstd:.2f} max={dev[clean].max():.1f}")

t_low = max(14.0, dmean + 4 * dstd)
t_high = t_low + 10.0
print(f"thresholds: t_low={t_low:.1f} t_high={t_high:.1f}")

# ---------- 4. hysteresis mask ----------
strong = (dev > t_high).astype(np.uint8)
weak = (dev > t_low).astype(np.uint8)
n, labels, stats, _ = cv2.connectedComponentsWithStats(weak, 8)
strong_labels = set(np.unique(labels[strong > 0])) - {0}
mask = np.isin(labels, list(strong_labels)).astype(np.uint8)
print(f"mask after hysteresis: {mask.mean():.2%}")

# despeckle + close
k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
mask = cv2.medianBlur(mask * 255, 5)
mask = (mask > 127).astype(np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, k3, iterations=3)

# ---------- 5. hole policy ----------
# enclosed holes: fill unless they look like genuine see-through gaps
# (backdrop-like AND reasonably large)
inv = 1 - mask
n2, labels2, stats2, _ = cv2.connectedComponentsWithStats(inv, 8)
subject_area = mask.sum()
for i in range(1, n2):
    area = stats2[i, cv2.CC_STAT_AREA]
    if area < 4:
        inv[labels2 == i] = 0
        continue
    if area > subject_area * 0.25:
        continue  # outer backdrop
    hole_dev = dev[labels2 == i]
    backdrop_like = np.median(hole_dev) < t_low * 0.8
    real_gap = backdrop_like and area > subject_area * 0.004
    if not real_gap:
        inv[labels2 == i] = 0
mask = 1 - inv
print(f"mask after hole policy: {mask.mean():.2%}")

# ---------- 6. edge tuck + feather ----------
mask = cv2.erode(mask, k3, iterations=1)
alpha = cv2.GaussianBlur((mask * 255).astype(np.uint8), (3, 3), 0.8)
alpha = np.clip((alpha.astype(np.float32) - 70) * (255.0 / 185.0), 0, 255).astype(np.uint8)

bgra = cv2.cvtColor(bgr8, cv2.COLOR_BGR2BGRA)
bgra[..., 3] = alpha
ys2, xs2 = np.where(alpha > 8)
pad = 8
x0, x1 = max(int(xs2.min()) - pad, 0), min(int(xs2.max()) + pad, w)
y0, y1 = max(int(ys2.min()) - pad, 0), min(int(ys2.max()) + pad, h)
crop = bgra[y0:y1, x0:x1]
up = cv2.resize(crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(OUT, up)

fig = Image.open(OUT).convert("RGBA")
a = np.asarray(fig)
al = a[..., 3].astype(float)
hh, ww = al.shape
rows = np.where((al > 200).mean(axis=1) > 0.05)[0]
cols = np.where((al > 200).mean(axis=0) > 0.05)[0]
top, bot, left, right = rows.min(), rows.max(), cols.min(), cols.max()
fz = al[top + int((bot-top)*0.06):top + int((bot-top)*0.30), left + (right-left)//4: right - (right-left)//4]
print(f"figure {ww}x{hh} | face-zone opacity: {np.mean(fz>200):.1%} (target > 80%)")

for path, col in [(CHK_DARK, (9, 9, 13)), (CHK_WHITE, (245, 245, 242))]:
    bg = Image.new("RGB", fig.size, col)
    bg.paste(fig, (0, 0), fig)
    bg.save(path, quality=88)
print("composites saved:", CHK_DARK, CHK_WHITE)
