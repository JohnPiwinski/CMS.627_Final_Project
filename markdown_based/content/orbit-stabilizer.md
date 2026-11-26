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
Mark the original vertex in yellow and render the rest of the solid in gray.

Keep track of every distinct spatial vertex position
to which the marked vertex has been transported.

Count visited positions while highlighting only the current feature.

Display a discovered-positions counter.
Do not reveal the total before exploration.
-->

:::narration[orbit-introduction]
Use the rotation tool to convince yourself that the yellow vertex can reach any vertex position. Try the same experiment with an edge or a face, and switch among the Platonic solids.

When a rotation can send any vertex to any other vertex, we say that the action on vertices is transitive. The rotations act transitively on edges and on faces too. The set of positions a feature can reach is its orbit.
:::
::pause

### Stabilizers {#discover-stabilizers}
::scene[solids]

<!--
Mark a selected feature in yellow and render the rest of the solid in gray.

Record distinct group transformations that return
the feature to its original spatial position.

For edges and faces, preservation is setwise.
Their individual vertices may be permuted.

Include the identity transformation.
Do not count repeated applications yielding the same
transformation as additional group elements.
-->

:::narration[stabilizer-introduction]
Now follow the yellow face. The rotations can take it to any face position, but which rotations leave it where it started? Use the rotation tool and select the yellow face to turn around the axis through its center.

The rotations that leave the chosen feature in its original position form its stabilizer. A face or edge can stay in the same position even when its corners swap. Try a vertex or an edge, then switch to another Platonic solid.
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

### Moving cosets {#moving-cosets}
::scene[solids]

:::display
A coset is a block of moves that sends the starting feature to the same destination. Try a symmetry and watch the blocks move with the solid.
:::
::pause
