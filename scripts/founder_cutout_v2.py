#!/usr/bin/env python3
"""Pixel-faithful founder cutout, v2 — deviation-from-backdrop priors.

The studio backdrop is a smooth light gradient; the whole subject (dark
suit, shadow-side face, bright shirt) deviates from it. So:

  1. robustly fit a quadratic backdrop surface (iterative outlier rejection)
  2. subject = pixels deviating from the surface (hysteresis threshold)
  3. GrabCut WITH MASK INIT only refines the boundary
  4. holes filled only where their pixels are NOT backdrop-like
  5. feathered alpha, 2x LANCZOS upscale — original pixels throughout

Output: public/founder-figure.png + diagnostics for VLM review.
"""
import cv2
import numpy as np
from PIL import Image

SRC = "/home/z/my-project/upload/pasted_image_1793876301348.png"
OUT = "/home/z/my-project/public/founder-figure.png"
CHECK = "/home/z/my-project/scripts/founder_check3.jpg"
DEV_PREVIEW = "/home/z/my-project/scripts/founder_dev_preview.jpg"

img = cv2.imread(SRC, cv2.IMREAD_COLOR)
h, w = img.shape[:2]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)

# ---------- 1. robust quadratic backdrop fit ----------
# start from a border ring, iteratively drop outliers (subject pixels that
# touch the border, e.g. torso reaching the bottom edge)
sel = np.zeros((h, w), bool)
sel[:8, :] = sel[-8:, :] = True
sel[:, :8] = sel[:, -8:] = True

for it in range(6):
    ry, rx, rv = ys[sel], xs[sel], gray[sel]
    A = np.stack([ry, rx, ry * rx, rx * rx, ry * rx, np.ones_like(ry)], 1)
    coef, *_ = np.linalg.lstsq(A, rv, rcond=None)
    resid = np.abs(gray - (coef[0] * ys + coef[1] * xs + coef[2] * ys * ys
                           + coef[3] * xs * xs + coef[4] * ys * xs + coef[5]))
    ring_resid = resid[sel]
    thr = ring_resid.std() * 2.0 + 2.0
    # candidate backdrop pixels = smooth & consistent with the fit
    new_sel = (resid < max(thr, 8.0)) & (gray > 120)  # backdrop is light
    # keep the ring seed, grow/shrink within light tones only
    sel = new_sel | (sel & (gray > 120))
    sel[:1, :] = sel[-1:, :] = True
    sel[:, :1] = sel[:, -1:] = True

bg_field = (coef[0] * ys + coef[1] * xs + coef[2] * ys * ys
            + coef[3] * xs * xs + coef[4] * ys * xs + coef[5])
dev = np.abs(gray - bg_field)
print(f"backdrop fit: ring std={ring_resid.std():.1f}, dev range in ring={dev[sel].max():.1f}")

# preview the deviation map (helps VLM diagnostics)
dev_u8 = np.clip(dev * 2.2, 0, 255).astype(np.uint8)
cv2.imwrite(DEV_PREVIEW, dev_u8)

# ---------- 2. hysteresis subject mask ----------
ring_std = dev[sel].std()
t_high = max(24.0, 5 * ring_std)   # definite subject
t_low = max(13.0, 3 * ring_std)    # possible subject
strong = (dev > t_high).astype(np.uint8)
weak = (dev > t_low).astype(np.uint8)
print(f"thresholds: low={t_low:.1f} high={t_high:.1f}, strong={strong.mean():.2%}")

# connect weak to strong (hysteresis): keep weak components touching strong
n, labels, stats, _ = cv2.connectedComponentsWithStats(weak, 8)
strong_labels = set(np.unique(labels[strong > 0])) - {0}
keep = np.isin(labels, list(strong_labels)).astype(np.uint8)
print(f"hysteresis mask: {keep.mean():.2%}")

# kill speckle, close pinholes
k3 = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
keep = cv2.medianBlur(keep * 255, 5)
keep = (keep > 127).astype(np.uint8)
keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, k3, iterations=2)

# ---------- 3. GrabCut refinement with mask init ----------
gc_mask = np.full((h, w), cv2.GC_BGD, np.uint8)
gc_mask[keep > 0] = cv2.GC_PR_FGD
gc_mask[dev > t_high * 1.6] = cv2.GC_FGD
gc_mask[dev < t_low * 0.55] = cv2.GC_BGD
blurred = cv2.GaussianBlur(img, (3, 3), 0)
bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(blurred, gc_mask, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
fg = np.where((gc_mask == cv2.GC_FGD) | (gc_mask == cv2.GC_PR_FGD), 1, 0).astype(np.uint8)
print(f"after grabcut refine: {fg.mean():.2%}")

# ---------- 4. fill holes only where pixels are subject-like ----------
inv = 1 - fg
n2, labels2, stats2, _ = cv2.connectedComponentsWithStats(inv, 8)
filled = 0
for i in range(1, n2):
    area = stats2[i, cv2.CC_STAT_AREA]
    if area < 4:
        inv[labels2 == i] = 0
        continue
    if area > h * w * 0.2:  # the outer backdrop — keep
        continue
    hole_px = dev[labels2 == i]
    if np.median(hole_px) > t_low:  # not backdrop-like -> real subject
        inv[labels2 == i] = 0
        filled += 1
fg = 1 - inv
print(f"holes filled (subject-like): {filled}")

# final erosion to tuck the matte inside the true edge, then feather
fg = cv2.erode(fg, k3, iterations=1)
alpha = cv2.GaussianBlur((fg * 255).astype(np.uint8), (3, 3), 0.8)
alpha = np.clip((alpha.astype(np.float32) - 70) * (255.0 / 185.0), 0, 255).astype(np.uint8)

# ---------- 5. crop + 2x upscale ----------
bgra = cv2.cvtColor(img, cv2.COLOR_BGR2BGRA)
bgra[..., 3] = alpha
ys2, xs2 = np.where(alpha > 8)
pad = 8
x0, x1 = max(int(xs2.min()) - pad, 0), min(int(xs2.max()) + pad, w)
y0, y1 = max(int(ys2.min()) - pad, 0), min(int(ys2.max()) + pad, h)
crop = bgra[y0:y1, x0:x1]
up = cv2.resize(crop, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_LANCZOS4)
cv2.imwrite(OUT, up)

fig = Image.open(OUT).convert("RGBA")
bg = Image.new("RGB", fig.size, (9, 9, 13))
bg.paste(fig, (0, 0), fig)
bg.save(CHECK, quality=85)
print("figure:", fig.size, "->", OUT)
print("composites ->", CHECK, DEV_PREVIEW)
