# Why order matters

- **Slide ID:** `square-noncommutativity`
- **Status:** Needs user review
- **Current slide screenshot:** [`assets/why-order-matters-source.png`](assets/why-order-matters-source.png)
- **Style reference:** [`assets/symmetries-of-a-square-source.png`](assets/symmetries-of-a-square-source.png)
- **Concept mockup:** [`assets/why-order-matters-mockup.png`](assets/why-order-matters-mockup.png)

## Current slide

The existing slide shows two large squares and controls for changing the turn, replaying, and changing the mirror. Its current example compares `r · s = rs` with `s · r = r³s`.

## Proposed slide direction

Make this a close visual relative of **Symmetries of a square**:

- Keep a fixed 4-by-2 grid of all eight element previews on the right. Each preview always shows that element acting on the identity square; selecting elements does not alter the grid.
- Let the user assign two elements to `A` and `B`. Mark those choices on their preview tiles.
- Show two large result squares on the left, labeled `AB` and `BA`, for the selected pair. For the sample `A = r`, `B = s`, show `AB = rs`, `BA = r³s`, and `AB ≠ BA`.
- State the takeaway directly: rotations commute with each other; rotations and reflections generally do not. Do not make this a discovery puzzle.
- Make the composition order clear: `AB` applies `B` first and then `A`; `BA` applies `A` first and then `B`.

The generated image is an exploratory mockup, not an approved design. Its `A = r`, `B = s` example is a suggested starting pair.

## Narration reminder — do not update yet

When narration is revised later, explain that `E` is the identity, `R` is a rotation, and `S` is a reflection. Also say that rotations commute with each other, while rotations and reflections generally do not. Preserve the existing narration until the user approves a script update.

## Open decisions

- Should the slide start with `A = r`, `B = s`, or begin with both choices empty?
- What should the selection flow be after the first two picks: explicit `Choose A` / `Choose B` selectors, or first click assigns `A` and second click assigns `B`?
- Does the `AB` / `BA` convention need a visible “apply right-hand element first” hint?

## Draft chat message

Here is a concept for **Why order matters**. The eight previews stay fixed at the identity square while you choose `A` and `B`; the two large squares then show `AB` and `BA`. With the sample `A = r`, `B = s`, the results are `rs` and `r³s`, so `AB ≠ BA`. The takeaway states the general pattern directly instead of asking the learner to discover it. I’ve also recorded your narration reminder without changing the script. Would you like to start with that `r`/`s` pair, and how should the learner choose which slot to replace?
