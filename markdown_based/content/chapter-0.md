---
title: Interactive Accompaniment to Art and Algebra
theme: default
layout: workspace
transition: none
download: false
wakeLock: false
drawings:
  enabled: false
---

# Chapter Zero {#chapter-zero}

## Lattices {#lattices}

### Square lattice {#square-lattice}
::scene[square]
::enable[translate,rotate,reflect,glide]

:::display
Chapter Zero is about learning the controls. The square lattice is a repeating grid whose dots represent pairs of integers.
:::

:::narration[square-intro,auto]
Welcome to Chapter Zero. For now, we will focus on how to use the game controls. This is a square lattice. It is a repeating grid of dots, and each dot represents a pair of integer coordinates. Look for the triangle with three labeled corners. Those labels will help you see what moves.
:::
::pause

::cue[translate]
:::display
**Translate.** Select the four-arrow icon in the bottom toolbar. Drag from one lattice dot to another, or click the two dots in order.
:::
:::narration[square-translate]
Select the highlighted Translate tool in the bottom toolbar. Drag from one lattice dot to another, or click the two dots in order. Watch the grid and the marked triangle move together.
:::
::wait[translated]

::cue[rotate]
:::display
**Rotate.** Select the circular arrow in the toolbar. Click a lattice dot, then drag around the dial clockwise or counterclockwise. Each step is $90^\circ$.
:::
:::narration[square-rotate]
Great. Now try the highlighted Rotate tool. Click a lattice dot to pick a center, then drag around the dial clockwise or counterclockwise. On this grid, one step turns the triangle a quarter turn.
:::
::wait[rotated]

::cue[reflect]
:::display
**Reflect.** Select the mirror icon. Press a lattice dot and drag horizontally or vertically to choose the mirror axis.
:::
:::narration[square-reflect]
Now select the highlighted Reflect tool. Press a lattice dot and drag horizontally or vertically to choose the mirror line. Release and watch the marked triangle flip across that line.
:::
::wait[reflected]

::cue[glide]
:::display
**Glide.** Select Glide just to the right of Reflect. Drag to choose a mirror line, then drag from that line along it to choose the slide.
:::
:::narration[square-glide]
A glide reflection flips across a line and then slides along that same line. Select the highlighted Glide icon, just to the right of Reflect in the bottom toolbar. Drag from a lattice dot to choose a mirror line. Then drag along that line to choose how far to slide.
:::
::pause

:::display
Use the bottom toolbar to switch tools and line up A, B, and C with the dashed target triangle. Match all three corners to unlock the next subsection.
:::
:::narration[square-match]
Can you line up the two triangles? Use the bottom toolbar to switch between tools. Match A with A, B with B, and C with C on the dashed target. Once all three corners overlap, you can continue.
:::
::wait[matched]

:::display
All three corners matched. Continue to try the Eisenstein lattice.
:::

### Eisenstein lattice {#eisenstein-lattice}
::scene[triangular]

::enable[translate,rotate,reflect]
:::display
Try all three tools on the triangular lattice. What changes when you rotate one step?
:::
:::narration[eisenstein-intro]
This is the triangular lattice, also called the Eisenstein lattice. Translation still moves between dots. A single turn is now sixty degrees, and the mirror axis snaps to the directions of the triangular grid.
:::
::wait[rotated]

:::display
Try a translation or reflection, or match the dashed target triangle.
:::

## Platonic solids {#solids}

### Orbit the cube {#orbit-cube}
::scene[solids]

::enable[orbit]
:::display
Drag the solid to look around. Use **Reset view** to return to the starting angle. The **Solid** menu changes the shape, and the bottom toolbar contains Rotate and Reflect.
:::
:::narration[orbit-cube-guide]
Drag to look around the cube. You are moving your viewpoint. The cube itself keeps its orientation.
:::
::wait[orbited]

:::display
Try viewing the cube from another angle before continuing.
:::

### Select a feature {#select-feature}
::scene[solids]

::enable[orbit,face]
:::display
Click a flat face, or use **Select face**.
:::
:::narration[select-face-guide]
Click a flat face of the cube. The highlight shows which face you chose.
:::
::wait[face-selected]

::enable[orbit,edge]
:::display
Click an edge where two faces meet, or use **Select edge**.
:::
:::narration[select-edge-guide]
Now pick an edge, where two faces meet. You can orbit if an edge is hard to see.
:::
::wait[edge-selected]

::enable[orbit,vertex]
:::display
Click a corner, or use **Select vertex**.
:::
:::narration[select-vertex-guide]
Pick a vertex. A vertex is a corner where edges meet.
:::
::wait[vertex-selected]

:::display
Continue to use those features to choose a symmetry.
:::

### Turn and reflect {#solid-symmetry}
::scene[solids]

::enable[orbit,face,edge,vertex,rotate]
::cue[rotate]
:::display
Choose **Rotate** in the bottom toolbar, select a feature, then drag the dial to turn the solid. On the dial, use arrow keys and Enter as a keyboard alternative.
:::
:::narration[solid-turn-guide]
Select Rotate in the bottom toolbar. Then pick a face, edge, or vertex for the rotation axis. The camera pauses while you turn the dial. Watch the colored features to see where the rotation takes them.
:::
::wait[rotated]

::enable[orbit,face,edge,vertex,reflect]
::cue[reflect]
:::display
Choose **Reflect** in the bottom toolbar, select a feature, then click a colored mirror plane or its numbered button.
:::
:::narration[solid-mirror-guide]
Select Reflect in the bottom toolbar and pick a feature again. Orbit to inspect the colored mirror planes, then choose one. Watch the solid reflect across it.
:::
::wait[reflected]

::enable[orbit,face,edge,vertex,rotate,reflect,choose-solid]
:::display
Choose another Platonic solid. Compare which turns and reflections you can make.
:::
:::narration[solid-gallery-guide]
Try any of the five Platonic solids. The cube and octahedron are duals, as are the dodecahedron and icosahedron. The tetrahedron is its own dual. Compare how their features move when you turn or reflect them.
:::
