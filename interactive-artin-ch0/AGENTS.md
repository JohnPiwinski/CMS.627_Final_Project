# Project conventions for AI coding agents

This project is a TypeScript/Three.js/Konva implementation of an interactive mathematical tutorial.

## Design invariants

- Treat `src/lib/geometry.ts` as the authoritative mathematical representation. Do not duplicate transformation formulas inside the renderers.
- A square-lattice rotation is counterclockwise through 90 degrees; the triangular/Eisenstein rotation is counterclockwise through 60 degrees.
- Reflection directions must snap to 4 cardinal rays (square) or 6 nearest-neighbor rays (triangular). Opposite rays describe the same mirror line.
- Mathematical +y is upward; Konva screen +y is downward.
- Three.js camera orbit does not rotate the cube object.
- Square rotations affect the corner markers even when the square outline is unchanged.
- The first three exercises are instructional; do not silently introduce Chapter 1 material.

## Engineering safeguards

- Run `npm test` and `npm run build` after changing code.
- Add a regression test when changing mathematical geometry or a previously working feature.
- Inspect all users of changed public methods. Do not refactor unrelated components.
- Keep canvas, WebGL, DOM listeners, and animation-frame cleanup correct when navigating between lessons.
- Maintain strict TypeScript; do not use `any` to silence compiler errors.
- Do not claim verification that wasn't executed. Report untested runtime behavior explicitly.
- Prefer changes that can be implemented and verified in one subsystem at a time.
