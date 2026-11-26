# Wallpaper chapter scenes

The chapter has an overview, one dual-collection explorer, a half-fleur domain
introduction, a one-bite puzzle, and a visual explanation. The explorer imports
the chapter's actual ToolDock, lattice gesture controller, and affine geometry.
Its scene exposes setGroup, setCollection, setPattern, selectTool, reset, dispose.
Collection-aware IDs are artin:<group> and wikipedia:<group>.

Artin geometry is bundled in artin-patterns.json from Wallpaper_Groups/wallpaper-study.
The standalone app remains independent. Wikipedia uses the existing registered
source cells through catalog.ts; no remote images or CDN scripts are required.

Regenerate the dissection with `python3 scripts/wallpaper/build_dissection.py`
(requires NumPy and Shapely 2). The generator checks connectivity, area, coverage,
overlap, and the one-piece construction. It uses a 2e-6 vertex snap to account
for the six-decimal authored path coordinates. The chosen move is a 120-degree
rotation in screen coordinates about (sqrt(3)/6, 1/2). Domain data and hit targets
share the same generated points; clipping never runs in the browser.

`npm test` includes domain geometry and both-collection regressions. The browser
wallpaper controls spec follows the new five-slide flow. Narration is authored in
content/wallpaper.md and generated through the standard M2 pipeline.
