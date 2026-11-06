#!/usr/bin/env python3
"""Verify the AI edit kept the man faithful to the original photo.

Compares the subject region of the green-screen edit against the
original photograph (structural similarity + PSNR). High values mean
the edit preserved the man and we can ship the cutout as-is.
"""
from PIL import Image
import numpy as np

orig = Image.open("/home/z/my-project/upload/pasted_image_1793876301348.png").convert("L")
green = Image.open("/home/z/my-project/scripts/founder_green.png").convert("RGB")

# scale green edit (768x1344) to the original's size (359x564)
gw = green.resize(orig.size, Image.LANCZOS)
ga = np.asarray(gw).astype(np.float32)
oa = np.asarray(orig).astype(np.float32)

r, g, b = ga[..., 0], ga[..., 1], ga[..., 2]
mask = ~((g > 90) & (g > 1.25 * np.maximum(r, 1)) & (g > 1.25 * np.maximum(b, 1)))

subj_orig = oa[mask]
subj_green = g[mask]  # grayscale approximation of the edit

mse = ((subj_orig - subj_green) ** 2).mean()
psnr = 10 * np.log10(255.0 ** 2 / mse) if mse > 0 else float("inf")

# normalized cross-correlation (structural agreement, robust to brightness shift)
a = subj_orig - subj_orig.mean()
bb = subj_green - subj_green.mean()
ncc = (a * bb).sum() / (np.sqrt((a * a).sum()) * np.sqrt((bb * bb).sum()) + 1e-9)

print(f"subject pixels compared: {mask.sum()} ({mask.mean():.1%} of frame)")
print(f"PSNR in subject region: {psnr:.1f} dB")
print(f"normalized cross-correlation: {ncc:.4f}")
print(f"mean brightness shift: {subj_green.mean() - subj_orig.mean():+.1f}")
