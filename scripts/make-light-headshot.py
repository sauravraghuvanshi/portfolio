"""Generate a transparent-background cutout of the hero headshot for light mode.

Strips the dark backdrop with rembg and saves a PNG with full alpha so the
subject sits directly on the page gradient (no rectangular "card" outline).
"""
from pathlib import Path
from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "images" / "headshot.jpg"
OUT = ROOT / "public" / "images" / "headshot-light.png"

print(f"Reading: {SRC}")
src = Image.open(SRC).convert("RGBA")
w, h = src.size
print(f"Size: {w}x{h}")

print("Removing background...")
cutout = remove(src)

print(f"Writing: {OUT}")
cutout.save(OUT, "PNG", optimize=True)
print(f"Done. Output size: {OUT.stat().st_size // 1024} KB")
