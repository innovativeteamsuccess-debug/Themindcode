#!/usr/bin/env python3
"""Stage 3: re-cut the expression cells with u2net, component-filter, review.

Also builds tight head-crop flood-fill fallbacks for happy/thinking.
"""
from PIL import Image, ImageDraw, ImageFilter
from collections import deque
import os

RAW = "/tmp/mascot_raw2"   # 3x upscaled crops from stage 2
OUT = "/tmp/mascot_cut2"
os.makedirs(OUT, exist_ok=True)

CELLS = ["happy", "thinking", "confident", "confused", "excited", "relieved", "tired", "wow", "focused"]

from rembg import remove, new_session
session = new_session("u2net")

def clean_alpha(img):
    r, g, b, a = img.split()
    lut = []
    for v in range(256):
        if v < 100: lut.append(0)
        elif v > 190: lut.append(255)
        else: lut.append(int((v - 100) * 255 / 90))
    return Image.merge("RGBA", (r, g, b, a.point(lut)))

def keep_big_components(img, min_frac=0.02):
    """Drop connected alpha components smaller than min_frac of the largest."""
    a = img.split()[3]
    w, h = a.size
    ap = a.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if ap[x, y] > 30 and not seen[y][x]:
                q = deque([(x, y)]); seen[y][x] = True
                pts = []
                while q:
                    cx, cy = q.popleft(); pts.append((cx, cy))
                    for nx, ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1),(cx+1,cy+1),(cx-1,cy-1),(cx+1,cy-1),(cx-1,cy+1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and ap[nx, ny] > 30:
                            seen[ny][nx] = True; q.append((nx, ny))
                comps.append(pts)
    if not comps:
        return img
    comps.sort(key=len, reverse=True)
    biggest = len(comps[0])
    keep = set()
    for pts in comps:
        if len(pts) >= max(200, biggest * min_frac):
            keep.update(pts)
    a2 = Image.new("L", (w, h), 0)
    ap2 = a2.load()
    for (x, y) in keep:
        ap2[x, y] = ap[x, y]
    a2 = a2.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(3))
    out = img.copy(); out.putalpha(a2)
    return out

results = {}
for name in CELLS:
    src = Image.open(f"{RAW}/{name}.png")
    res = clean_alpha(remove(src, session=session))
    res = keep_big_components(res)
    bbox = res.getbbox()
    if bbox:
        l, t, r, b = bbox
        pad = 6
        res = res.crop((max(0,l-pad), max(0,t-pad), min(res.width,r+pad), min(res.height,b+pad)))
    res.save(f"{OUT}/{name}.png")
    results[name] = res
    print(f"{name:10s} u2net -> {res.size}")

# ---- flood-fill head crops (fallback / alternative avatars) ----
def flood_cut(img, tol=16, feather=1.2):
    """Remove near-white bg connected to the borders."""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    # sample bg from corners
    corners = [px[3,3], px[w-4,3], px[3,h-4], px[w-4,h-4]]
    br = sum(c[0] for c in corners)//4; bg_ = sum(c[1] for c in corners)//4; bb = sum(c[2] for c in corners)//4
    def is_bg(x, y):
        r, g, b = px[x, y][:3]
        return (r-br)**2 + (g-bg_)**2 + (b-bb)**2 <= tol*tol
    mask = [[False]*w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h-1):
            if is_bg(x, y) and not mask[y][x]: mask[y][x] = True; q.append((x,y))
    for y in range(h):
        for x in (0, w-1):
            if is_bg(x, y) and not mask[y][x]: mask[y][x] = True; q.append((x,y))
    while q:
        cx, cy = q.popleft()
        for nx, ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1)):
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and is_bg(nx, ny):
                mask[ny][nx] = True; q.append((nx,ny))
    a = Image.new("L", (w, h), 255)
    ap = a.load()
    for y in range(h):
        for x in range(w):
            if mask[y][x]: ap[x, y] = 0
    a = a.filter(ImageFilter.GaussianBlur(feather))
    out = img.copy(); out.putalpha(a)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out

# head boxes inside the 3x-upscaled expression crops (204x234 / 204x234)
HEADS = {
    "face-happy":    ("happy",    (14, 8, 196, 178)),
    "face-thinking": ("thinking", (16, 6, 200, 178)),
}
for name, (cell, hbox) in HEADS.items():
    src = Image.open(f"{RAW}/{cell}.png").crop(hbox)
    res = flood_cut(src)
    res.save(f"{OUT}/{name}.png")
    results[name] = res
    print(f"{name:14s} flood -> {res.size}")

# ---- review sheet ----
names = list(results.keys())
cols = 4
cw, ch = 200, 240
rows = (len(names) + cols - 1) // cols
cs = Image.new("RGBA", (cols*cw, rows*ch), (7, 26, 51, 255))
dd = ImageDraw.Draw(cs)
for i, name in enumerate(names):
    c = results[name]
    scale = min((cw-20)/c.width, (ch-34)/c.height, 1.0)
    c2 = c.resize((max(1,int(c.width*scale)), max(1,int(c.height*scale))), Image.LANCZOS)
    x = (i % cols)*cw + (cw-c2.width)//2
    y = (i // cols)*ch + 6
    cs.paste(c2, (x, y), c2)
    dd.text(((i % cols)*cw + 8, (i//cols)*ch + ch - 24), name, fill=(255,255,255,255))
cs.convert("RGB").save(f"{OUT}/_review2.png")
print("review2 ->", f"{OUT}/_review2.png")
