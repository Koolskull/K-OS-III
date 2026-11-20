#!/usr/bin/env python3
"""Cut the 64-cell teef sheet and the SMILE / slime marks into LOD squares.

Source pixels only. Smaller slots are integer nearest-neighbor reductions.
Slots above the source size stay empty in the catalog.
"""

from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
SHEET_SRC = Path(
    "/Users/koolskull/.grok/sessions/%2FUsers%2Fkoolskull/01a1e81c-1e73-7b11-88fc-89fddf92f250/assets/image-dd493e21-fa44-499b-85ff-e7cac2c201ad.png"
)
TEEF_LOGO_SRC = Path(
    "/Users/koolskull/.grok/sessions/%2FUsers%2Fkoolskull/01a1e81c-1e73-7b11-88fc-89fddf92f250/assets/image-1c4bd301-7d37-4bf3-890d-c0531545176f.jpg"
)
SMILE_SRC = Path(
    "/Users/koolskull/.grok/sessions/%2FUsers%2Fkoolskull/01a1e81c-1e73-7b11-88fc-89fddf92f250/assets/image-9f2be648-5f4f-4414-a3a4-a76d797e77cd.jpg"
)
GLYPHS = PUBLIC / "sprites"


def knock_black(image):
    image = image.convert("RGBA")
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            red, green, blue, alpha = pixels[x, y]
            if red < 8 and green < 8 and blue < 8:
                pixels[x, y] = (0, 0, 0, 0)
    return image


def fit_square(image, size):
    image = knock_black(image)
    long_side = max(image.size)
    if long_side == size:
        scaled = image
    elif long_side > size:
        factor = long_side / size
        scaled = image.resize(
            (max(1, round(image.width / factor)), max(1, round(image.height / factor))),
            Image.NEAREST,
        )
    else:
        scale = size // long_side
        scaled = image.resize((image.width * scale, image.height * scale), Image.NEAREST)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.paste(scaled, ((size - scaled.width) // 2, (size - scaled.height) // 2), scaled)
    return canvas


def save_sizes(image, directory, sizes):
    directory.mkdir(parents=True, exist_ok=True)
    for size in sizes:
        fit_square(image, size).save(directory / f"{size}.png")


def teef_cells():
    sheet = Image.open(SHEET_SRC).convert("RGBA")
    width, height = sheet.size
    mask = Image.new("L", sheet.size, 0)
    mask_pixels = mask.load()
    source = sheet.load()
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = source[x, y]
            if alpha >= 16 and not (red < 12 and green < 12 and blue < 12):
                mask_pixels[x, y] = 255
    # Radius 2 joins eyes and small accessories without bridging the gap between teef.
    dilated = mask.filter(ImageFilter.MaxFilter(5))
    dilated_pixels = dilated.load()
    seen = bytearray(width * height)
    components = []
    for y in range(height):
        for x in range(width):
            index = y * width + x
            if seen[index] or dilated_pixels[x, y] == 0:
                continue
            queue = deque([(x, y)])
            seen[index] = 1
            pixels = []
            min_x = max_x = x
            min_y = max_y = y
            while queue:
                current_x, current_y = queue.popleft()
                pixels.append((current_x, current_y))
                min_x = min(min_x, current_x)
                max_x = max(max_x, current_x)
                min_y = min(min_y, current_y)
                max_y = max(max_y, current_y)
                for next_x, next_y in (
                    (current_x - 1, current_y),
                    (current_x + 1, current_y),
                    (current_x, current_y - 1),
                    (current_x, current_y + 1),
                ):
                    next_index = next_y * width + next_x
                    if (
                        0 <= next_x < width
                        and 0 <= next_y < height
                        and not seen[next_index]
                        and dilated_pixels[next_x, next_y]
                    ):
                        seen[next_index] = 1
                        queue.append((next_x, next_y))
            components.append((min_y, min_x, pixels))
    if len(components) != 64:
        raise SystemExit(f"expected 64 teef, found {len(components)}")
    components.sort()
    out_dir = PUBLIC / "stardrain/art/teefz"
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet.save(out_dir / "sheet.png")
    for index, (_min_y, _min_x, pixels) in enumerate(components):
        cell = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        xs = [point[0] for point in pixels]
        ys = [point[1] for point in pixels]
        offset_x = (64 - (max(xs) - min(xs) + 1)) // 2 - min(xs)
        offset_y = (64 - (max(ys) - min(ys) + 1)) // 2 - min(ys)
        cell_pixels = cell.load()
        for x, y in pixels:
            red, green, blue, alpha = source[x, y]
            if alpha < 16 or (red < 12 and green < 12 and blue < 12):
                continue
            target_x = x + offset_x
            target_y = y + offset_y
            if 0 <= target_x < 64 and 0 <= target_y < 64:
                cell_pixels[target_x, target_y] = (red, green, blue, alpha)
        folder = out_dir / "cells" / f"{index:02d}"
        folder.mkdir(parents=True, exist_ok=True)
        cell.save(folder / "64.png")
        cell.resize((32, 32), Image.NEAREST).save(folder / "32.png")
        cell.resize((16, 16), Image.NEAREST).save(folder / "16.png")
        cell.resize((8, 8), Image.NEAREST).save(folder / "8.png")
    print(f"teef cells: {len(components)}")


def teef_logo():
    """The ghost is the TEEFZ logo and the default TEEF face. The sheet is not."""
    image = Image.open(TEEF_LOGO_SRC)
    directory = PUBLIC / "stardrain/art/teefz/img"
    directory.mkdir(parents=True, exist_ok=True)
    logo = fit_square(image, 64)
    logo.save(PUBLIC / "stardrain/art/teefz/logo.png")
    logo.save(directory / "64.png")
    logo.resize((32, 32), Image.NEAREST).save(directory / "32.png")
    logo.resize((16, 16), Image.NEAREST).save(directory / "16.png")
    logo.resize((8, 8), Image.NEAREST).save(directory / "8.png")
    print("teef logo")


def smile_mark():
    image = Image.open(SMILE_SRC)
    directory = PUBLIC / "stardrain/art/smile/img"
    directory.mkdir(parents=True, exist_ok=True)
    mark = fit_square(image, 64)
    mark.save(PUBLIC / "stardrain/art/smile/mark.png")
    mark.save(PUBLIC / "stardrain/art/smile/logo.png")
    mark.save(directory / "64.png")
    mark.resize((32, 32), Image.NEAREST).save(directory / "32.png")
    mark.resize((16, 16), Image.NEAREST).save(directory / "16.png")
    mark.resize((8, 8), Image.NEAREST).save(directory / "8.png")
    print("smile mark")


def slime_marks():
    singles = {
        "SLIME-S1": "ST1",
        "SLIME-S2": "ST2",
        "SLIME-S3": "ST3",
        "SLIME-S4": "ST4",
        "SLIME-S5": "ST5",
        "SLIME-S6": "ST6",
        "SLIME-S7": "ST7",
    }
    for code, glyph in singles.items():
        save_sizes(Image.open(GLYPHS / f"{glyph}.png"), PUBLIC / "stardrain/art/slime" / code / "img", (8, 16, 32, 64))
    pair = Image.new("RGBA", (32, 16), (0, 0, 0, 0))
    pair.paste(knock_black(Image.open(GLYPHS / "ST1.png")), (0, 0))
    pair.paste(knock_black(Image.open(GLYPHS / "ST0.png")), (16, 0))
    save_sizes(pair, PUBLIC / "stardrain/art/slime/SLIME-S10/img", (8, 16, 32, 64))
    print("slime marks")


if __name__ == "__main__":
    teef_cells()
    teef_logo()
    smile_mark()
    slime_marks()
