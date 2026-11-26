# Wallpaper translation diagnostics

This isolated pipeline reads the [Wikimedia source SVG](https://upload.wikimedia.org/wikipedia/commons/e/ed/Primitive_cells_of_the_wallpaper_groups.svg).
The wallpaper explorer, gallery, and matching previews consume the generated `cells.json` for all seventeen groups. Five source cells have only a green fill. Their previews show cell outlines as a guide, and the explorer labels them as plain source cells.

From `markdown_based`, with Playwright Chromium and Python Shapely installed:

```sh
node diagnostics/wallpaper/extract.mjs
node diagnostics/wallpaper/check.mjs
```

The extractor resolves path coordinates through the SVG's browser-computed
transformation matrix. It preserves the source colors, path order, and
vertices. The black cell outline is a diagram annotation, so it is omitted
from the repeating artwork. The three source groups have identity
transformation matrices in the downloaded file.

The checker runs full diagnostics for p4, p1, and p6. It compares the painter's coordinates with separately transcribed
source vertices and lattice vectors for 1×1, 2×2, and 5×5 patches. Shapely
checks coverage, disjoint interiors, and that neighboring bases cannot
cover blue polygons. The central period is checked independently of the
ragged outside boundary of a finite oblique or hexagonal patch.
