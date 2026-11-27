# Introduction to Group Theory {#group-theory}
## Cyclic Groups and Modular Arithmetic {#additive-clock}
### Definition of a group {#group-definition}
::scene[clock]
:::display
Groups provide an algebraic language for describing symmetry.

A group is a set $G$ equipped with a binary operation $G\times G\to G$ satisfying three laws:

Associativity — $(ab)c=a(bc)$

Identity — $ea=ae=a$

Inverses — $aa^{-1}=a^{-1}a=e$
:::
:::narration[group-definition-intro]
Groups give us an algebraic way of describing geometric transformations and symmetries of objects, such as Platonic solids, including cubes and tetrahedra, as well as wallpaper patterns.

We give each transformation a symbol, typically a letter of the Latin or Greek alphabet. We compose transformations by writing their symbols next to one another, reading from right to left. For example, ab means that we perform b first and then a.

The group operation satisfies three properties: associativity, the existence of an identity, and the existence of inverses. Groups give us a language for describing symmetry.
:::
::pause

### Addition on a clock {#clock-addition}
::scene[clock]

:::display
The additive cyclic group: integers modulo 12.

$\mathbb{Z}/12\mathbb{Z}$

Drag the hour hand to see the residue class change. After a full turn, it wraps around.
:::
:::narration[clock-addition-intro]
One of the simplest examples of a group is the integers modulo twelve under addition. You already use modular arithmetic when you read an analog clock. Twelve and zero name the same position. After one full turn, the hand returns to where it started. If you move one tick past twelve, you land on one instead of counting to thirteen.

Now drag the hour hand to different values. Watch how the corresponding element of the integers modulo twelve changes. Try dragging through a full turn and see what happens to the residue class.
:::
::pause

:::display
Click and drag either input clock hand to explore addition modulo 12.
:::
:::narration[clock-addition-operation]
Let's try adding two numbers on a clock. Five plus eight is thirteen, but because our clock wraps around after twelve, we end up at one.

Click and drag the hands on either of the first two clock faces to see the group operation of addition in action. Try several different combinations and observe the result on the third clock.

Whenever we combine two elements of our group, we obtain another element of the same group. This rule for combining two group elements is called the group operation. In this example, the group operation is addition modulo twelve.
:::
::pause

### Associativity {#clock-associativity}
::scene[clock]

:::display
Drag the colored arcs on either clock to change their lengths.

$(a+b)+c=a+(b+c)$

Does changing the grouping change the final position?
:::
:::narration[clock-associativity-intro]
Now, let's illustrate what associativity means with the cyclic group. Each of these colored arcs represents a movement around the clock. You can drag the arcs on either clock to change their lengths.

We have two clocks on the left and right and three group elements a, b, and c represented by the red, blue, and yellow arcs. Associativity means that no matter how we group the three arcs, we are still left with the same final brown arc.

On the left, we combine the red and blue arcs first to form a purple arc before adding the yellow arc.
On the right, we combine the blue and yellow arcs first to form a green arc before adding the red arc.

Once again, associativity is the fundamental observation that the way we group the intermediate computations does not change the final answer. The brown arc, which represents the sum of a, b, and c is the same on both sides.

Try a few different values and observe what happens to the final position of the clock hand on each clock. Does the way we group the arcs change the result?
:::
::pause

### Identity {#clock-identity}
::scene[clock]

:::display
$12\mathbb{Z}=\{\ldots,-24,-12,0,12,24,\ldots\}$

Drag the dot on the number line to make full rotations of the clock.

$a+12k\equiv a\pmod{12}$
:::
:::narration[clock-identity-intro]
Intuitively, making a full rotation around the clock, either clockwise or counterclockwise, doesn't change where the hand is. So all the numbers that are multiples of twelve are identified with zero, and they represent the identity.

Drag the dot on the number line above to see that the reading of the clock below is unchanged after a full rotation.

Now drag the hour hand to any value. This chooses a new starting hour and resets the number line to zero. Then drag the dot on the number line below to add a multiple of twelve hours. The hand makes full turns and comes back to the same hour.
:::
::pause

### Additive inverses {#clock-inverses}
::scene[clock]

:::narration[clock-inverses-explore]
Every element of a group has an inverse. In our additive clock group, the inverse of a number is the number we can add to it to get zero.

The lines on this clock connect each number to its additive inverse. Change the number of positions on the clock. Use the View multiple clocks button to compare the additive inverses of many different clocks at once. What geometric pattern do you notice? Can you explain why it occurs?
:::
::pause
:::narration[clock-inverses-explain]
Notice that the lines are parallel. Each number and its inverse are reflections of one another across the vertical axis. Zero is its own inverse. When the modulus is even, the number halfway around the clock is also its own inverse.
:::
::pause

### Commutativity {#clock-commutativity}
::scene[clock]

:::narration[clock-commutativity-intro]
There is another property that our clock group has. We can add two numbers in either order and obtain the same result.

On the first clock we add the red arc and then the blue arc. On the second clock we add them in the opposite order. Drag the arcs to change their lengths and compare the results.

A group in which the order of two elements does not affect their product is called commutative, or abelian, in honor of the Norwegian mathematician Niels Henrik Abel. Abel made foundational contributions to the study of algebraic equations, but tragically died at the age of twenty-six. Many of the groups we will encounter are not abelian.
:::
::pause

## Modular multiplication {#modular-multiplication}
### Multiplication and units {#clock-units}
::scene[clock]

:::narration[clock-units-explore]
Instead of adding numbers on our clock, what happens if we multiply them?

Each arrow connects a number to the result of multiplying it by the selected multiplier, modulo the number of positions on the clock. Change the multiplier and the modulus. Multiplication by a number is invertible exactly when no two arrows end at the same point.

Use the View multiplication maps button to compare many clocks at once. Each row uses the same modulus, and each clock in that row uses a different multiplier.

Remember that every element of a group must have an inverse. Can you tell which moduli have the property that every nonzero number is invertible under multiplication?
:::
::pause

:::narration[clock-units-explain]
When the multiplier and the modulus are relatively prime, every position receives exactly one arrow. In particular, exactly one number is sent to one. That number is the multiplicative inverse of our multiplier.

When the modulus is prime, every nonzero number is invertible. For composite moduli, some nonzero numbers are not invertible.

The numbers relatively prime to the modulus form a group under modular multiplication. We call these numbers units. The identity of this group is one.

Euler's totient function counts the number of units for a given modulus. Change the modulus and observe how the number of units changes.
:::
::pause

### Wilson's theorem {#wilson-theorem}
::scene[clock]

:::narration[wilson-explore]
Now let's see an example of group theory in action. Let's calculate factorials in modular arithmetic.

Remember that n factorial is the product of all the integers from one to n. Something interesting happens if we calculate p minus one factorial modulo a prime p, using the multiplicative group of nonzero residues.

Can you explain why p minus one factorial is always congruent to minus one modulo p, using group theory?

At first, p equals two might seem like an exception, because the answer is one rather than minus one. But modulo two, one and minus one are identified with each other. This is not really an exception, and it gives us a hint as to how to explain the result.

When you are ready, click the card to reveal a hint. Once you feel confident in your answer, click to reveal the solution.
:::
::pause

:::display
Pair each nonzero residue with its multiplicative inverse. Each pair of **distinct** inverses contributes a factor of $1$, so the only factors left are $1$ and $-1$, whose product is $-1$ (they are the same residue when $p=2$).
:::
:::narration[wilson-explain]
Pair each nonzero residue with its multiplicative inverse. Each pair of distinct inverses contributes a factor of one, so the only factors left are one and minus one, whose product is minus one. For p equals two, they are the same residue.
:::
::pause

## The Dihedral Group {#dihedral-group}
### Symmetries of a square {#square-symmetries}
::scene[square]

:::narration[square-symmetries-intro]
So far, we have explored groups using modular arithmetic. Let's return to our original motivation for group theory: describing geometric symmetries.

Consider a square. Use the rotation and reflection tools to discover its symmetries. How many different transformations can you find?
:::
::pause
:::narration[square-symmetries-reveal]
There are eight transformations that preserve the square: four rotations, including the identity, and four reflections. Together, these transformations form a group called the dihedral group of the square, which we denote by D four.

We use r to denote a quarter-turn and s to denote a reflection.
:::
::pause

### Why order matters {#square-noncommutativity}
::scene[square]

:::narration[square-order-explore]
Try rotating the square and then reflecting it. Now perform the same transformations in the opposite order.

Unlike addition on a clock, changing the order of our transformations can change the result. The dihedral group is therefore an example of a non-abelian group.
:::
::pause

## Subgroups and Quotient Groups {#subgroups-quotients}
### A subgroup on the clock {#clock-subgroup}
::scene[clock]

:::display
Click 8 and then 5 on the 12-position clock. Count the hops until the first return to zero.

The order of a step $n$ is the least positive number of hops that make a whole number of laps. With $m$ positions, the order is $m/\gcd(m,n)$. If $m$ and $n$ share no factor larger than 1, the path visits every position.
:::

:::narration[clock-subgroup-intro]
We can find subgroups in our clock groups as well. On a clock with six positions, start at zero and repeatedly add two. Which positions can you reach? Try adding two numbers from this collection. Do you ever leave it?
:::
::pause

### Clock subgroup diagram {#clock-subgroup-diagram}
::scene[clock]

:::display
Click a clock position to trace the subgroup it generates. Change the modulus to compare subgroup diagrams.
:::
::pause

### Subgroups {#subgroups}
::scene[square]

:::narration[subgroups-intro]
Sometimes, within a group, we can find a smaller collection of elements that forms a group of its own.

For example, consider only the rotations of a square. Composing two rotations gives us another rotation, and the inverse of a rotation is also a rotation.

This smaller group is called a subgroup. It contains the identity, and it is closed under products and inverses. Start with three guided questions. The gold outline marks a move given in the question. To answer, click the picture you think is the result in the highlighted subgroup. For the first question, which picture shows two quarter-turns? After the third question, choose Free exploration to try the Compose and Inverse tools on any subgroup.

In free exploration, click a subgroup card to highlight it. With Compose, click two pictures in the same card to form their product. The square plays the right-hand move first, and the result lights up in the card. With Inverse, click one picture to highlight the move that undoes it.
:::
::pause

### Cosets {#cosets}
::scene[square]

:::narration[cosets-intro]
What happens if we take every element of a subgroup and multiply it on the left by the same group element?

We obtain a collection of elements called a left coset. Let's see what happens when we multiply all the rotations of our square by a reflection.

Try choosing other multipliers. Can two different cosets partially overlap? How does the number of elements in a coset compare with the number in the original subgroup?
:::
::pause

### Lagrange's theorem {#lagrange-theorem}
::scene[square]

:::narration[lagrange-intro]
The left cosets partition our group into collections of equal size. Each collection has as many elements as the subgroup itself.

Count the number of cosets and the number of elements in each coset. Multiply these two numbers together. Now try another subgroup.

This is Lagrange's theorem: the order of a subgroup of a finite group divides the order of the group.
:::
::pause

### Normal subgroups {#normal-subgroups}
::scene[square]

:::narration[normal-subgroups-intro]
Because the dihedral group is not abelian, multiplying a subgroup on the left might produce a different collection of elements than multiplying it on the right.

However, some subgroups have a remarkable property: their left and right cosets always agree. We call these normal subgroups.

Soon we will define a notion of dividing one group by a subgroup. Normality is exactly the condition that allows a subgroup to serve as the denominator in this construction. We cannot divide a group by an arbitrary subgroup in this way.

Try the rotation subgroup and then the subgroup consisting of the identity and a single reflection. Compare the left and right cosets for different multipliers.
:::
::pause

:::narration[normal-subgroups-conjugation]
Another way to describe normality is through conjugation. Multiply each element of the subgroup on the left by a group element and on the right by its inverse. A normal subgroup is unchanged as a set by every such conjugation.
:::
::pause

### Quotient groups {#quotient-groups}
::scene[square]

:::narration[quotient-groups-intro]
Imagine that we are no longer interested in distinguishing the individual rotations of a square. Instead, we only want to distinguish rotations from reflections.

We can identify all the rotations with one another and all the reflections with one another. In doing so, we obtain a new group with only two elements. This is an example of a quotient group. Division here means forgetting certain information: we identify elements that belong to the same coset. A representative can name its coset, but it is the entire coset that is an element of the quotient.

Collapse the cosets to see the two elements of our new group. Expand them again to see which original transformations they represent.
:::
::pause
:::narration[quotient-groups-products]
Choose a subgroup from the diagram on the left. If it is normal, click Collapse cosets. Each box shrinks to one dot, and the label at the bottom tells you which quotient group you made. Try the half-turn subgroup and compare it with the rotations.

Now try the subgroup made of the identity and one reflection. Its left and right cosets partition the moves differently. This subgroup is not normal, so the quotient group does not exist.
:::
::pause

<!--
## Bonus: Group Homomorphisms {#homomorphisms-bonus}
### Homomorphisms and generators {#homomorphisms-generators}
::scene[clock]

:::narration[homomorphisms-generators-intro]
A homomorphism is a map from one group to another that preserves the group operation. If f maps G to H, then f of a product is the product of the images. For additive groups, this means f of a sum is the sum of the images.

A homomorphism is determined entirely by where it sends the generators of the input group. Once we know where one goes on an additive clock, we know where every other number goes. Not every choice of generator images is possible, because the relations in the input group must still hold.

Choose the image of one on the output clock and watch the other images appear. Select two input numbers to compare mapping their sum with adding their images. Change the clock sizes to explore which choices are possible.
:::
::pause

### The first isomorphism theorem: clocks {#first-isomorphism-clock}
::scene[clock]

:::narration[first-isomorphism-clock-intro]
The kernel of a homomorphism consists of all the elements that are sent to the identity of the output group. On our additive clocks, that identity is zero. The image consists of all elements in the output group that occur as outputs of some element of the input group.

Hover over a number on the output clock, or tap it, to see all the input numbers that are sent there. Notice that each nonempty collection is a coset of the kernel. Try changing the clock sizes and the image of the generator.

Click Collapse cosets to identify the elements in each coset. The resulting quotient has exactly the same group structure as the image. This is the first isomorphism theorem. Click Expand cosets to recover the original diagram.
:::
::pause

### The first isomorphism theorem: square symmetries {#first-isomorphism-square}
::scene[square]

:::narration[first-isomorphism-square-intro]
We can do the same thing with the symmetries of a square. Send every rotation to zero and every reflection to one, using addition modulo two in the output group.

Hover over zero or one to see the corresponding coset, or select a symmetry to see its output. The kernel is the rotation subgroup. When we divide the dihedral group by this subgroup, all rotations become the identity and all reflections become a single other element.

Click Collapse cosets to see the quotient. Try composing two symmetries and compare their output with the sum of their individual outputs. We have forgotten the particular motion but retained whether it preserves or reverses orientation.
:::
::pause

### The correspondence theorem: clocks {#correspondence-clock}
::scene[clock]

:::narration[correspondence-clock-intro]
Dividing by a normal subgroup also gives us a way to understand the subgroups of the quotient. Every subgroup of the original group that contains the denominator corresponds to exactly one subgroup of the quotient, and every subgroup of the quotient arises this way.

Choose the number of positions on the clock and then choose the subgroup you want to divide by. Select a subgroup containing it to see its boundary. Click Collapse to identify the elements of each coset. The denominator becomes the identity, and the selected subgroup becomes a subgroup of the quotient.

Select another boundary, or select a subgroup on the quotient side to see its full preimage in the original group. Notice that containment relationships are preserved. This is the correspondence theorem.
:::
::pause

### The correspondence theorem: square symmetries {#correspondence-square}
::scene[square]

:::narration[correspondence-square-intro]
Now try the same experiment with the dihedral group. Choose a normal subgroup to divide by. Select a subgroup containing it, and click Collapse to see its corresponding subgroup in the quotient. The normal subgroup itself becomes the identity, which we can label one when using multiplicative notation.

Try selecting subgroups on either side of the diagram. Expand the quotient to see which original elements each boundary represents. Notice that the subgroups need not form a single chain: several different subgroups can contain the same normal subgroup without containing one another.

The correspondence theorem lets us study the subgroups above a normal subgroup by studying the smaller quotient group instead.
:::
::pause
-->
