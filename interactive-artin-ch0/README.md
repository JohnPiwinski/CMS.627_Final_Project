# Interactive Artin Algebra

A TypeScript workshop for group theory, symmetry, and periodic patterns. The three **Chapter Zero** activities introduce the controls.

- **Exercise 0.1**: Square and Eisenstein/triangular lattices rendered with **Konva**; translate by dragging between lattice points or clicking two dots, rotate using a bidirectional dial (90° or 60° steps), reflect by dragging from a lattice point to a snapped mirror axis. The grid and the lattice-aligned triangle animate together.
- **Exercise 0.2**: All five **Three.js** Platonic solids, grouped by duality. Orbit the camera to inspect a solid, then pick a feature to choose a symmetry. The rotation dial locks the view, and mirror planes can be inspected from any angle.
- **Exercise 0.3**: A Konva-rendered marked square; rotate the whole square 90° in either direction, then undo the last turn.

## Run locally

Requirements: Node.js 20.19+ or 22.12+, npm, and a browser with WebGL support.

```sh
npm install
npm run dev
```

Open the **local URL** printed by Vite (usually `http://localhost:5173`).

Tests and production build:

```sh
npm test
npm run build
npm run preview
```

The production-ready static assets appear in `dist/`, which can be deployed to any static web host. Deploy from `dist/`, not by opening the TypeScript files with `file://`.

## Controls

| Exercise | Mouse/touch | Keyboard alternative |
|---|---|---|
| Lattices | Choose tool; drag between dots to translate; click a dot and drag the dial to rotate; press a dot and drag to reflect | `1`, `2`, `3` select tools; buttons are keyboard accessible |
| Platonic solids | Drag the scene to orbit; click a feature to open the dial; drag and release to turn or click a colored mirror plane | Use **Select current feature without mouse**, then use arrow keys and Enter on the rotation dial or select a numbered mirror plane |
| Square | +90°, −90°, and Undo buttons | `R` for +90°, `Shift+R` for −90°, `Z` to undo |

A text transcript is always visible. Optional narration uses the browser's Speech Synthesis API and may vary across browsers or systems. Progress is stored in `localStorage`. Reset restores the **scene** without deleting completed objectives.

## Layout and code

- `src/lib/geometry.ts`: mathematical operations, lattice snapping, and transformation functions, independent of rendering.
- `src/labs/LatticeLab.ts`: Konva lattice scene, snapping, animations, pointer interactions.
- `src/labs/CubeLab.ts`: Three.js scene and raycasting, OrbitControls, 3D picking.
- `src/labs/SquareLab.ts`: Konva square animation and undo history.
- `src/lib/lesson.ts`: chapter metadata, progress tracking.
- `src/main.ts`: lightweight DOM-based lesson shell, navigation and narration.
- `tests/geometry.test.ts`: mathematical invariants tested with Vitest.

## Scope and limitations

The three new chapters follow Chapter Zero in the sidebar. The storyboards supply ideas; the lessons lead with interactive experiments. It has no remote backend, user accounts, prerecorded narration, or unverified mathematical diagrams. After each animation the lattice lines and dots realign with their original positions. The browser-speech feature is optional.

## Engineering notes

- Coordinate convention: mathematical `y` points **up**, while Konva screen `y` points **down**.
- Reflection directions are quantized to square-lattice cardinal rays (4 sectors) or Eisenstein-lattice directions (6 sectors). Opposite rays describe the same line.
- Camera orbit and object rotation are intentionally separate exercises.
- Three.js geometries and materials, listeners, and animation loops are disposed of on navigation.
- The module's `build` script runs a strict TypeScript check before bundling; changing code should be followed by `npm test` and `npm run build`.

This implementation was prepared as source for local execution; depending on the sandbox's network access, dependencies may need to be installed on the recipient machine.

## Orbit Stabilizer chapter

The Symmetry Laboratory uses the same Platonic solid viewer and geometric tools as Chapter Zero. Pick a feature to track, apply turns or reflections, and record the distinct positions and symmetries you discover. Use the notebook to check observations across solids and test a conjecture. The investigation is saved separately in the browser.

- `src/lib/symmetry.ts` builds the finite symmetry groups and identifies each element by its vertex permutation.
- `src/lib/discovery.ts` records destinations, stabilizer elements, and trial history.
- `src/lib/orbitLesson.ts` contains the scene prompts, narration, and hints.
- `src/labs/OrbitLab.ts` connects the viewer to the notebook and lesson progression.

## Group Theory and Wallpaper Groups

- **Introductory Group Theory** uses the square as a laboratory for composition, subgroups, cosets, normality, quotients, and the orientation homomorphism. The final activity links to Orbit Stabilizer. The curiosity cabinet includes optional activities and labeled previews.
- **Wallpaper Groups** shares one pannable canvas for exploration, the 17-group gallery, and the exact classification game. Separate activities introduce plane isometries, lattice vectors, rotation orders, fundamental regions, and a toy 3D arrangement.
- Edit the short slide and spoken transcript sections in `src/content/groups.md` and `src/content/wallpaper.md`. Section ids identify activities and file order determines navigation.
- `src/lib/group.ts` handles square products and set operations. `src/lib/wallpaper.ts` stores lattice bases and exact fractional-coordinate generators. The wallpaper canvas constructs the full orbit of a separated asymmetric motif. Matching the complete colored motif determines an isometry, so an additional isometry cannot stabilize the glyph while changing the group.
- `src/content/wallpaper-assets.json` records local media, authors, licensing, modifications, and remaining references. The scanned diagrams are annotations, and the ornament images are approximate study material. The exact constructions never depend on the source crops.
- Run `npm run validate:content` to check editable scene structure and bundled references.
