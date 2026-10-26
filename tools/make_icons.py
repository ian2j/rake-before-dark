"""Draw the home-screen icons: a maple leaf over a dusk sky with a setting sun."""
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "icons"
S = 1024


def leaf_points(cx, cy, r):
    pts = []
    for i in range(240):
        a = i / 240 * 2 * math.pi
        rr = r * (0.48 + 0.52 * abs(math.cos(a * 2.5)) ** 2.2)
        pts.append((cx + math.sin(a) * rr, cy - math.cos(a) * rr))
    return pts


def draw(pad):
    img = Image.new("RGB", (S, S))
    d = ImageDraw.Draw(img)
    top, bottom = (28, 21, 48), (163, 70, 27)
    for y in range(S):
        t = (y / S) ** 1.6
        d.line([(0, y), (S, y)], fill=tuple(round(a + (b - a) * t) for a, b in zip(top, bottom)))
    d.ellipse([S * 0.5 - S * 0.3, S * 0.72 - S * 0.3, S * 0.5 + S * 0.3, S * 0.72 + S * 0.3], fill=(255, 210, 122))
    d.rectangle([0, S * 0.8, S, S], fill=(85, 116, 58))
    r = S * 0.3 * (1 - pad)
    cx, cy = S * 0.5, S * 0.47
    d.line([(cx, cy), (cx + r * 0.08, cy + r * 1.25)], fill=(110, 26, 15), width=round(S * 0.025))
    d.polygon(leaf_points(cx, cy, r), fill=(210, 78, 28))
    d.line([(cx, cy - r * 0.75), (cx, cy + r * 0.6)], fill=(134, 47, 18), width=round(S * 0.012))
    return img


def main():
    OUT.mkdir(exist_ok=True)
    plain, maskable = draw(0), draw(0.25)
    for name, img, size in [("icon-192.png", plain, 192), ("icon-512.png", plain, 512),
                            ("apple-touch-icon.png", plain, 180), ("maskable-512.png", maskable, 512)]:
        img.resize((size, size), Image.LANCZOS).save(OUT / name, optimize=True)


if __name__ == "__main__":
    main()
