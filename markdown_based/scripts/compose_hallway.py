#!/usr/bin/env python3
"""Bake the three portrait sources into the hallway illustration.

Replace any PNG under ``public/menu/source/portraits`` and rerun this script
to refresh the single hallway image used by the game. The original hallway
and portrait files are left untouched.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from shutil import copy2

from PIL import Image, ImageOps


APP_ROOT = Path(__file__).resolve().parents[1]
SOURCE_ROOT = APP_ROOT / "assets" / "menu-source"
DEFAULT_OUTPUT = APP_ROOT / "public" / "menu" / "hallway-with-portraits.webp"

# Insets inside the gold frames in hallway-background.png, in its 1672 x 941
# reference coordinate system. The frame edges stay visible around each image.
REFERENCE_SIZE = (1672, 941)
PLACEMENTS = (
    ("portraits/emmy-noether.png", (558, 296, 127, 195)),
    ("portraits/alexander-grothendieck.png", (1012, 296, 127, 195)),
    ("portraits/heisuke-hironaka.png", (1468, 296, 127, 195)),
)


def composite(source_root: Path, output_path: Path) -> None:
    background_path = source_root / "hallway-background.png"
    with Image.open(background_path) as source:
        canvas = source.convert("RGB")

    ref_width, ref_height = REFERENCE_SIZE
    scale_x = canvas.width / ref_width
    scale_y = canvas.height / ref_height

    for relative_path, (x, y, width, height) in PLACEMENTS:
        portrait_path = source_root / relative_path
        with Image.open(portrait_path) as source:
            portrait = ImageOps.fit(
                source.convert("RGB"),
                (round(width * scale_x), round(height * scale_y)),
                method=Image.Resampling.LANCZOS,
                centering=(0.5, 0.38),
            )

        position = (round(x * scale_x), round(y * scale_y))
        canvas.paste(portrait, position)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, format="WEBP", quality=91, method=6)
    copy2(source_root / "library-title.png", output_path.parent / "library-title.png")
    copy2(source_root / "iaaa-logo.png", output_path.parent / "iaaa-logo.png")
    print(f"Wrote {output_path} ({canvas.width} x {canvas.height})")
    print(f"Copied title background and IAAA mark to {output_path.parent}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--source-dir",
        type=Path,
        default=SOURCE_ROOT,
        help=f"directory containing hallway-background.png and portraits/ (default: {SOURCE_ROOT})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help=f"composite WebP destination (default: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()
    composite(args.source_dir, args.output)


if __name__ == "__main__":
    main()
