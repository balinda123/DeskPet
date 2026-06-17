from __future__ import annotations

from collections import deque
from pathlib import Path
import math
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


FRAME_W = 360
FRAME_H = 300
FLOOR_Y = 280


def component_mask(mask: np.ndarray) -> np.ndarray:
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    best: list[tuple[int, int]] = []

    for y in range(height):
        for x in range(width):
            if seen[y, x] or not mask[y, x]:
                continue
            pixels: list[tuple[int, int]] = []
            queue: deque[tuple[int, int]] = deque([(x, y)])
            seen[y, x] = True
            while queue:
                px, py = queue.popleft()
                pixels.append((px, py))
                for nx, ny in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if 0 <= nx < width and 0 <= ny < height and not seen[ny, nx] and mask[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((nx, ny))
            if len(pixels) > len(best):
                best = pixels

    output = np.zeros_like(mask, dtype=np.uint8)
    for x, y in best:
        output[y, x] = 255
    return output


def extract_white_cat(path: Path, crop: tuple[int, int, int, int], threshold: int = 132) -> Image.Image:
    source = Image.open(path).convert("RGB").crop(crop)
    rgb = np.asarray(source).astype(np.int16)
    gray = rgb.mean(axis=2)
    maxc = rgb.max(axis=2)
    minc = rgb.min(axis=2)
    saturation = (maxc - minc) / np.maximum(maxc, 1)
    mask = (gray > threshold) & (saturation < 0.34)
    mask_img = Image.fromarray(component_mask(mask), mode="L")
    mask_img = mask_img.filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(2.2))

    rgba = source.convert("RGBA")
    rgba.putalpha(mask_img)
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    return rgba.crop(bbox)


def fit_size(image: Image.Image, max_w: float, max_h: float) -> tuple[int, int]:
    ratio = image.width / image.height
    if ratio > max_w / max_h:
        width = int(max_w)
        height = int(width / ratio)
    else:
        height = int(max_h)
        width = int(height * ratio)
    return max(1, width), max(1, height)


def paste_cutout(
    frame: Image.Image,
    cutout: Image.Image,
    action: str,
    index: int,
    frame_count: int,
) -> None:
    phase = (index / frame_count) * math.tau
    image = cutout
    if action == "sleep":
        image = ImageOps.mirror(cutout).rotate(-7, expand=True, resample=Image.Resampling.BICUBIC)

    if action == "walk":
        max_w, max_h = FRAME_W * 0.82, FRAME_H * 0.72
        bob = math.sin(phase) * 4
        sway = math.sin(phase) * 10
    elif action == "playBall":
        max_w, max_h = FRAME_W * 0.76, FRAME_H * 0.72
        bob = math.sin(phase) * 3
        sway = math.sin(phase) * 5
    elif action == "sleep":
        max_w, max_h = FRAME_W * 0.8, FRAME_H * 0.54
        bob = math.sin(phase) * 1.5
        sway = 0
    else:
        max_w, max_h = FRAME_W * 0.72, FRAME_H * 0.74
        bob = math.sin(phase) * 2
        sway = math.sin(phase) * 2

    width, height = fit_size(image, max_w, max_h)
    resized = image.resize((width, height), Image.Resampling.LANCZOS)
    x = int((FRAME_W - width) / 2 + sway)
    y = int(FLOOR_Y - height + bob)
    frame.alpha_composite(resized, (x, y))

    if action == "playBall":
        draw = ImageDraw.Draw(frame)
        ball_x = int(FRAME_W * 0.75 + math.sin(phase) * 18)
        ball_y = FLOOR_Y - 18
        draw.ellipse((ball_x - 15, ball_y - 15, ball_x + 15, ball_y + 15), fill=(217, 92, 129, 255))
        draw.arc((ball_x - 9, ball_y - 9, ball_x + 9, ball_y + 9), 20, 250, fill=(255, 235, 242, 220), width=2)


def make_sheet(cutout: Image.Image, action: str, frame_count: int) -> Image.Image:
    sheet = Image.new("RGBA", (FRAME_W * frame_count, FRAME_H), (0, 0, 0, 0))
    for index in range(frame_count):
        frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))
        paste_cutout(frame, cutout, action, index, frame_count)
        sheet.alpha_composite(frame, (index * FRAME_W, 0))
    return sheet


def main() -> int:
    if len(sys.argv) != 5:
        print("Usage: generate_photo_cat_template.py <image1> <image2> <image3> <out-dir>")
        return 2

    image1 = Path(sys.argv[1])
    image2 = Path(sys.argv[2])
    image3 = Path(sys.argv[3])
    out_dir = Path(sys.argv[4])
    out_dir.mkdir(parents=True, exist_ok=True)

    side = extract_white_cat(image2, (0, 0, 726, 461), threshold=138)
    sitting = extract_white_cat(image3, (80, 520, 980, 1560), threshold=122)
    belly = extract_white_cat(image1, (0, 250, 600, 1120), threshold=145)

    assets = {
        "photo-cat-idle.png": make_sheet(sitting, "idle", 4),
        "photo-cat-walk.png": make_sheet(side, "walk", 8),
        "photo-cat-play.png": make_sheet(side, "playBall", 6),
        "photo-cat-sleep.png": make_sheet(belly if belly.getbbox() else side, "sleep", 4),
    }

    for filename, image in assets.items():
        image.save(out_dir / filename)
        print(out_dir / filename)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
