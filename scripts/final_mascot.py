#!/usr/bin/env python3
"""Stage 4: final mascot assets -> public/mascot/.

- hero: from stage-2 isnet cutout (already clean)
- face / face-thinking: flood cutouts, halo fixed via erode+blur, stray specks dropped
- excited / focused: u2net cutouts, label residue below the body dropped
All padded to square, optimized PNG.
"""
from PIL import Image, ImageDraw, ImageFilter
from collections import deque
import os

CUT1 = "/tmp/mascot_cut"    # isnet results
CUT2 = "/tmp/mascot_cut2"   # u2net + flood results
DEST = "/home/z/my-project/public/mascot"
os.makedirs(DEST, exist_ok=True)

def components(alpha_img, thresh=30):
    w, h = alpha_img.size
    ap = alpha_img.load()
    seen = [[False] * w for _ in range(h)]
    comps = []
    for y in range(h):
        for x in range(w):
            if ap[x, y] > thresh and not seen[y][x]:
                q = deque([(x, y)]); seen[y][x] = True; pts = []
                while q:
                    cx, cy = q.popleft(); pts.append((cx, cy))
                    for nx, ny in ((cx+1,cy),(cx-1,cy),(cx,cy+1),(cx,cy-1),(cx+1,cy+1),(cx-1,cy-1),(cx+1,cy-1),(cx-1,cy+1)):
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and ap[nx, ny] > thresh:
                            seen[ny][nx] = True; q.append((nx, ny))
                comps.append(pts)
    return comps

def drop_specks(img, min_frac=0.02):
    a = img.split()[3]
    comps = components(a)
    if not comps:
        return img
    comps.sort(key=len, reverse=True)
    biggest = len(comps[0])
    keep = set()
    for pts in comps:
        if len(pts) >= max(150, biggest * min_frac):
            keep.update(pts)
    a2 = Image.new("L", a.size, 0)
    ap2 = a2.load(); ap = a.load()
    for (x, y) in keep:
        ap2[x, y] = ap[x, y]
    out = img.copy(); out.putalpha(a2)
    return out

def drop_below_body(img, frac=0.12):
    """Remove components whose top edge sits in the bottom band of the main body."""
    a = img.split()[3]
    comps = components(a)
    if not comps:
        return img
    comps.sort(key=len, reverse=True)
    main = comps[0]
    my = [p[1] for p in main]
    top, bot = min(my), max(my)
    band = bot - frac * (bot - top)
    keep = set()
    for pts in comps:
        cy = [p[1] for p in pts]
        if min(cy) >= band and len(pts) < len(main) * 0.5:
            continue  # below-body residue
        keep.update(pts)
    a2 = Image.new("L", a.size, 0)
    ap2 = a2.load(); ap = a.load()
    for (x, y) in keep:
        ap2[x, y] = ap[x, y]
    out = img.copy(); out.putalpha(a2)
    return out

def fix_halo(img, erode=1, blur=0.8):
    a = img.split()[3]
    if erode:
        a = a.filter(ImageFilter.MinFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(blur))
    out = img.copy(); out.putalpha(a)
    return out

def trim(img, pad=8):
    bbox = img.getbbox()
    if not bbox:
        return img
    l, t, r, b = bbox
    return img.crop((max(0, l - pad), max(0, t - pad), min(img.width, r + pad), min(img.height, b + pad)))

def squareify(img):
    s = max(img.size)
    out = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    out.paste(img, ((s - img.width) // 2, (s - img.height) // 2), img)
    return out

def save(img, name):
    img.save(f"{DEST}/{name}", optimize=True)
    kb = os.path.getsize(f"{DEST}/{name}") / 1024
    print(f"{name:24s} {img.size}  {kb:.1f} KB")

# 1. hero — straight from stage 2 (already excellent)
hero = Image.open(f"{CUT1}/hero.png")
save(trim(hero, 4), "code-hero.png")

# 2. face avatars — flood cutouts, halo fixed, specks dropped
for src_name, out_name in [("face-happy", "code-face.png"), ("face-thinking", "code-face-thinking.png")]:
    img = Image.open(f"{CUT2}/{src_name}.png")
    img = drop_specks(img, 0.04)
    img = fix_halo(img, erode=1, blur=0.7)
    img = trim(img)
    img = squareify(img)
    save(img, out_name)

# 3. excited / focused — drop label residue below body
for name, frac in [("excited", 0.28), ("focused", 0.28)]:
    img = Image.open(f"{CUT2}/{name}.png")
    img = drop_below_body(img, frac)
    img = drop_specks(img, 0.03)
    img = trim(img)
    save(img, f"code-{name}.png")

# ---- final review sheet on navy ----
names = ["code-hero", "code-face", "code-face-thinking", "code-excited", "code-focused"]
cw, ch = 220, 300
cs = Image.new("RGBA", (len(names) * cw, ch), (7, 26, 51, 255))
dd = ImageDraw.Draw(cs)
for i, name in enumerate(names):
    c = Image.open(f"{DEST}/{name}.png")
    scale = min((cw - 24) / c.width, (ch - 40) / c.height, 1.0)
    c2 = c.resize((int(c.width * scale), int(c.height * scale)), Image.LANCZOS)
    x = i * cw + (cw - c2.width) // 2
    y = (ch - 30 - c2.height) // 2 + 4
    cs.paste(c2, (x, y), c2)
    dd.text((i * cw + 10, ch - 22), name, fill=(255, 255, 255, 255))
cs.convert("RGB").save(f"{CUT2}/_final.png")
print("final review ->", f"{CUT2}/_final.png")
