"""Crop the book-cover photo to the book itself, upscale 2x, save optimized assets."""
from PIL import Image, ImageFilter, ImageChops

SRC = "/home/z/my-project/upload/pasted_image_1793884184920.png"
OUT_JPG = "/home/z/my-project/public/book-cover.jpg"

im = Image.open(SRC).convert("RGB")

# Precise non-white bbox (scan against pure white, tolerance for jpeg-ish noise)
bg = Image.new("RGB", im.size, (255, 255, 255))
diff = ImageChops.difference(im, bg).convert("L")
mask = diff.point(lambda p: 255 if p > 18 else 0)
bbox = mask.getbbox()
print("raw bbox:", bbox, "src size:", im.size)

# Trim a hair inside the bbox to kill the soft white halo at the edges
l, t, r, b = bbox
l, t, r, b = l + 1, t + 1, r - 3, b - 4
cover = im.crop((l, t, r, b))
w, h = cover.size
print("cropped:", cover.size, "aspect:", round(h / w, 3))

# Upscale 2x with Lanczos + gentle unsharp so it stays crisp at ~320px render width
cover2x = cover.resize((w * 2, h * 2), Image.LANCZOS).filter(
    ImageFilter.UnsharpMask(radius=1.6, percent=70, threshold=2)
)
cover2x.save(OUT_JPG, "JPEG", quality=90, optimize=True, progressive=True)
print("saved:", OUT_JPG, cover2x.size)

import os
print("bytes:", os.path.getsize(OUT_JPG))
