# Why order matters

- **Slide ID:** `square-noncommutativity`
- **Status:** Implemented
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

The concept was approved for implementation. The slide starts with `A = r`, `B = s` and offers explicit A/B selectors above the fixed preview grid.

## Implemented behavior

- Selecting an A or B slot and then an element tile updates that element while keeping every preview fixed relative to the identity.
- The two large squares show the selected `AB` and `BA` products, with the right-hand factor applied first. Their element labels and equality/inequality badge update with the selection.
- The slide states the general commutativity takeaway directly and announces whether the selected pair commutes.
- Narrow layouts place the two results above the two-row preview grid.

## Narration reminder — do not update yet

When narration is revised later, explain that `E` is the identity, `R` is a rotation, and `S` is a reflection. Also say that rotations commute with each other, while rotations and reflections generally do not. Preserve the existing narration until the user approves a script update.

## Draft chat message

Here is a concept for **Why order matters**. The eight previews stay fixed at the identity square while you choose `A` and `B`; the two large squares then show `AB` and `BA`. With the sample `A = r`, `B = s`, the results are `rs` and `r³s`, so `AB ≠ BA`. The takeaway states the general pattern directly instead of asking the learner to discover it. I’ve also recorded your narration reminder without changing the script. Would you like to start with that `r`/`s` pair, and how should the learner choose which slot to replace?
