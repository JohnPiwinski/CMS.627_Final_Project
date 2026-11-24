# Introductory Group Theory {#group-theory}

## Groups {#groups}

### What is a group? {#group-definition}
::scene[clock]

:::display
A group is a set with a closed operation, an associative law, an identity, and an inverse for every element.
Associativity — $(ab)c = a(bc)$
Identity — $ea = ae = a$
Inverse — $aa^{-1} = a^{-1}a = e$
:::

:::narration[group-definition-voice]
A group is a way to describe symmetries and transformations algebraically. Instead of holding up a physical object and turning it around, give each transformation a symbolic name. Write two symbols next to each other to compose their transformations. Read them from right to left: in R S, apply S first, then R. A group is closed under its operation. The operation is associative, so grouping three moves differently gives the same result. There is an identity that leaves things unchanged, and every element has an inverse that undoes it.
:::

## Modular arithmetic {#modular-arithmetic}

### Inverses {#clock-inverse}
::scene[clock]

:::display
The hand starts at 5. Drag it back to 12 / 0 to undo the five-hour shift.
:::

:::narration[group-clock-inverse]
A clock gives us a simple example of a group under addition. The hand has moved five hours forward. What move undoes that shift? Drag the hand back to twelve.
:::

### Identity {#clock-identity}
::scene[clock]

:::display
Which move leaves the hand where it started? Drag it around the clock once.
:::

:::narration[group-clock-identity]
The identity leaves the hand where it started. Doing nothing is the identity. So is any whole number of full turns, clockwise or counterclockwise.
:::

### Associativity {#clock-associativity}
::scene[clock]

:::display
(a + b) + c = a + (b + c). The same three shifts reach the same position regardless of how they are grouped.
:::

:::narration[group-clock-associativity]
Associativity means regrouping three moves does not change their result. Add the first two shifts, then the third, or add the last two first. The final position is the same. Clock addition is also commutative, so the order of two shifts can be exchanged. This makes the clock group abelian.
:::

### Around the clock {#around-the-clock}
::scene[clock]

:::display
Start at 11. Drag the hand forward two ticks. Where does it land?
:::

:::narration[group-clock-around]
Adding on a clock gives us one of the simplest examples of a group: modular arithmetic. You already use it when you read an analog clock. After twelve, the clock wraps around to one instead of counting to thirteen. That's because twelve and zero name the same position. Try moving the hand forward two hours from eleven and see where it lands.
:::

### Two names for twelve {#two-names-for-twelve}
::scene[clock]

:::display
12 and 0 name the same tick. Drag the hand forward one tick from there.
:::

:::narration[group-clock-zero]
Look at the top tick. On a clock we call it twelve, and when we count remainders we call it zero. They name the same spot. Start there and move the hand forward one tick. Whether you start by saying twelve or zero, you land on one.
:::

### Multiply on the clock {#clock-multiply}
::scene[clock]

:::display
Modulo 8, drag 3 onto the clock. Then try 2. Which multiplier keeps every residue distinct?
:::

:::narration[group-clock-multiply]
Multiplication also wraps around the clock. On this eight-position dial, drag three onto the face. Each residue has its own destination. Now drag two onto the dial. Some paths join at the same destination. Three is reversible modulo eight: multiply by three again and you get back to where you started. Two has no inverse modulo eight.
:::

## Investigation {#investigation}

### Wilson’s theorem {#clock-wilson}
::scene[clock]

:::display
Scrub to 6 factorial modulo 7. Then drag two factors together when their product leaves remainder 1.
:::

:::narration[group-clock-wilson]
Let’s see why six factorial is one less than seven, modulo seven. Pair two with four, and three with five: each pair has product one, modulo seven. One and six are left over. This works for every odd prime: each nonzero residue has an inverse, and only one and minus one are their own inverses. If a square is one modulo a prime, the prime divides either the number minus one or the number plus one. So all the other factors cancel in pairs, leaving minus one. For the prime two, one and minus one name the same residue. Conversely, if the modulus is composite, a proper divisor greater than one appears among the factors. It divides the factorial, so the remainder cannot be minus one.
:::
