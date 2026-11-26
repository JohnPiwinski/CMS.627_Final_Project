---
title: The Orbit-Stabilizer Theorem
theme: default
layout: workspace
---

# The Orbit-Stabilizer Theorem {#orbit-stabilizer}

## Group Actions {#group-actions}

### Groups acting on geometric objects {#geometric-actions}
::scene[solids]

<!--
Reuse the existing Chapter 0 Platonic solids workspace.

Allow the student to mark a vertex, edge, or face in gold.
The marker must travel with the solid when a transformation
is applied.

Distinguish the marked feature from the feature selected
to define a rotation axis or reflection plane.
-->

:::narration[action-introduction]
So far, we have studied groups as collections of
transformations. Now we are going to study what those
transformations actually do to geometric objects.

Select a vertex of the cube and then use the rotation
and reflection tools to move it around.

When a group transforms the elements of a set in this
way, we say that the group acts on that set.
:::
::pause

## Orbits and Stabilizers {#orbits-and-stabilizers}

### Orbits {#discover-orbits}
::scene[solids]

<!--
Mark the original vertex in gold.

Keep track of every distinct spatial vertex position
to which the marked vertex has been transported.

Previously visited positions remain highlighted in blue.
The current position is highlighted in gold.

Display a discovered-positions counter.
Do not reveal the total before exploration.
-->

:::narration[orbit-introduction]
Select a vertex of the cube. How many different positions
can you move this vertex to using rotations of the cube?

The collection of all positions to which we can move
a particular object using elements of a group is called
its orbit.

Try the same experiment with an edge or a face.
:::
::pause

### Stabilizers {#discover-stabilizers}
::scene[solids]

<!--
Mark a selected feature in gold.

Record distinct group transformations that return
the feature to its original spatial position.

For edges and faces, preservation is setwise.
Their individual vertices may be permuted.

Include the identity transformation.
Do not count repeated applications yielding the same
transformation as additional group elements.
-->

:::narration[stabilizer-introduction]
Now let's ask a slightly different question.

How many transformations can we perform without
changing the position of our selected feature?

Click a face and explore rotations around the axis
passing through its center.

The elements of a group that leave a particular object
unchanged form a subgroup called its stabilizer.
:::
::pause

## Discovering the Orbit-Stabilizer Theorem {#discover-theorem}

### Counting rotational symmetries {#rotation-counting}
::scene[solids]

<!--
Enable rotational transformations only.

Place the 3D solid on the left and an editable
experiment table on the right.

Allow the student to switch among all five Platonic
solids and select vertices, edges, and faces.

Do not reveal the theorem or automatically calculate
the missing entries.
-->

:::narration[rotation-table]
Let's investigate whether there is a relationship
between the size of an orbit, the size of its stabilizer,
and the number of elements in the group.

Use the solid selector to explore the five Platonic
solids. Click vertices, edges, and faces to investigate
their orbits and stabilizers.

Record your observations in the table.
:::
::pause

### Including reflections {#full-symmetry-counting}
::scene[solids]

<!--
Retain the previous experiment and its recorded entries.

Enable the reflection tool alongside the rotation tool.

Count elements of the full symmetry group, including
orientation-reversing transformations that are not
necessarily individual plane reflections.
-->

:::narration[reflection-table]
Now let's include reflections as well as rotations.

Use the reflection tool and click a vertex, edge, or
face to reveal the available reflection planes.

How does including reflections change the size of
the orbit? How does it change the size of the stabilizer?

Record these new observations in the table.
:::
::pause

### Discovering the relationship {#orbit-stabilizer-discovery}
::scene[solids]

<!--
Present the completed experiment tables.

Ask students to conjecture the relationship between
group order, orbit size, and stabilizer size.

Use progressive hint cards and a solution reveal.
Play a reward sound on successful discovery.

Only reveal the theorem after the student's attempt
or an explicit request for the solution.
-->

:::narration[theorem-discovery]
Examine the numbers that you have collected.

Can you find a relationship between the size of a
group, the size of an orbit, and the size of its
stabilizer?

Does the same relationship hold for every Platonic
solid that you investigated?
:::
::pause

## Bonus Challenges {#stabilizer-challenges}

### Finding a triangle inside a cube {#cube-s3}
::scene[solids]

<!--
Use the orientation-preserving symmetry group
of the cube.

Provide optional overlays for body diagonals and
equilateral triangles.

Let students discover the geometric object whose
setwise stabilizer is isomorphic to S_3.

Reveal the body diagonal as an unoriented line
in a progressive hint.
-->

:::narration[cube-s3-challenge]
The rotational symmetry group of the cube contains
a subgroup isomorphic to the symmetry group of
an equilateral triangle.

Can you discover where this subgroup comes from
geometrically?

Explore the vertices, edges, and diagonals of the cube.
Use the hint card if you would like some help.
:::
::pause

### Stabilizing multiple features {#multiple-feature-stabilizer}
::scene[solids]

<!--
Allow multiple features to be marked simultaneously,
using distinct colors.

A transformation belongs to the desired stabilizer
only if it preserves every marked feature.

Use the exact geometric configuration specified
in the storyboard for the first challenge.
-->

:::narration[multiple-feature-challenge]
What happens when we require a transformation to
preserve more than one geometric object?

Consider the highlighted edge and vertex of the cube.

Can you determine the subgroup consisting of all
rotations that preserve both of these features?
:::
::pause
