---
title: Introduction to Group Theory
theme: default
layout: workspace
---
<!--
CHAPTER-WIDE RENDERING REQUIREMENTS

Reserve display blocks for purely slide-based beats. For interactive clock scenes, render mathematical labels within Konva. A possible bottom-of-screen instructional label is not yet designed. Existing display blocks in earlier interactive beats are provisional and should be reviewed separately.

Interactive Konva.js and Three.js scenes should occupy essentially the entire slide. Render mathematical expressions within the scene itself rather than relying on Slidev's KaTeX rendering outside the scene.

Provide a reusable KaTeX-based math rendering utility for Konva.js. Convert the typeset output into a canvas-compatible image or equivalent drawable representation and integrate it into the Konva scene graph. Preserve mathematical layout, alignment, and legibility at the current display resolution. Support updating expressions dynamically as students manipulate scene objects.

For Three.js scenes requiring mathematical labels, reuse the typesetting pipeline with an appropriate texture or scene-integrated representation. The precise conversion implementation is left to the coding agent; KaTeX does not directly draw onto a canvas.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 155"><rect width="100%" height="100%" fill="#fffdf7"/><circle cx="75" cy="72" r="49" fill="none" stroke="#526070"/><text x="75.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="75.0" cy="23.0" r="2" fill="#526070"/><text x="105.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="99.5" cy="29.564755214562503" r="2" fill="#526070"/><text x="127.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="117.43524478543749" cy="47.49999999999999" r="2" fill="#526070"/><text x="136.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="124.0" cy="72.0" r="2" fill="#526070"/><text x="127.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="117.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="105.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="99.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="75.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="75.0" cy="121.0" r="2" fill="#526070"/><text x="44.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="50.500000000000014" cy="114.4352447854375" r="2" fill="#526070"/><text x="22.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="32.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="14.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="26.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="22.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="32.56475521456251" cy="47.49999999999999" r="2" fill="#526070"/><text x="44.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="50.49999999999998" cy="29.564755214562517" r="2" fill="#526070"/><path d="M 75 72 L 94.6 105.94819582835001" stroke="#263344" stroke-width="3"/><circle cx="75" cy="72" r="4"/><circle cx="220" cy="72" r="49" fill="none" stroke="#526070"/><text x="220.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="220.0" cy="23.0" r="2" fill="#526070"/><text x="250.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="244.5" cy="29.564755214562503" r="2" fill="#526070"/><text x="272.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="262.4352447854375" cy="47.49999999999999" r="2" fill="#526070"/><text x="281.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="269.0" cy="72.0" r="2" fill="#526070"/><text x="272.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="262.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="250.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="244.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="220.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="220.0" cy="121.0" r="2" fill="#526070"/><text x="189.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="195.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="167.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="177.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="159.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="171.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="167.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="177.56475521456252" cy="47.49999999999999" r="2" fill="#526070"/><text x="189.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="195.49999999999997" cy="29.564755214562517" r="2" fill="#526070"/><path d="M 220 72 L 186.05180417165002 91.60000000000002" stroke="#263344" stroke-width="3"/><circle cx="220" cy="72" r="4"/><circle cx="365" cy="72" r="49" fill="none" stroke="#526070"/><text x="365.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="365.0" cy="23.0" r="2" fill="#526070"/><text x="395.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="389.5" cy="29.564755214562503" r="2" fill="#526070"/><text x="417.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="407.4352447854375" cy="47.49999999999999" r="2" fill="#526070"/><text x="426.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="414.0" cy="72.0" r="2" fill="#526070"/><text x="417.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="407.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="395.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="389.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="365.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="365.0" cy="121.0" r="2" fill="#526070"/><text x="334.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="340.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="312.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="322.5647552145625" cy="96.50000000000003" r="2" fill="#526070"/><text x="304.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="316.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="312.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="322.5647552145625" cy="47.49999999999999" r="2" fill="#526070"/><text x="334.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="340.5" cy="29.564755214562517" r="2" fill="#526070"/><path d="M 365 72 L 384.6 38.05180417165" stroke="#263344" stroke-width="3"/><circle cx="365" cy="72" r="4"/><text x="148" y="76" text-anchor="middle" font-size="13" fill="#263344">+</text><text x="292" y="76" text-anchor="middle" font-size="13" fill="#263344">=</text><text x="220" y="145" text-anchor="middle" font-size="13" fill="#263344">5 + 8 ≡ 1 (mod 12)</text></svg>
-->
<!--
Reuse the existing Konva.js clock face and draggable hand. Initially display a single clock. During narration, animate a simulated mouse pointer approaching the hand, visibly pressing it, dragging it clockwise across eleven to zero, and releasing it. Remove the pointer afterward and allow direct manipulation. Do not add sliders or buttons.
-->
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

<!--
Transition to three instances of the existing Konva.js clock component, arranged as Clock A + Clock B = Clock C. Initialize their hands to 5, 8, and 1. The first two hands are independently draggable directly on their clock faces, snapping to integer ticks. The third hand is read-only and updates immediately to (a+b) mod 12 whenever either input changes. Show the current numerical equation beneath the clocks; it must update with the hands rather than remain fixed at the initial example.
Animate a simulated mouse pointer hovering over an input hand, visibly pressing it, dragging it to another tick, and releasing it. Demonstrate both input hands, then remove the pointer and allow unrestricted experimentation. Synchronize the demonstration with the narration. No sliders or separate operand controls. Preserve the existing Konva.js renderer and clock styling. Use the existing Continue mechanism for progression.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 190"><rect width="100%" height="100%" fill="#fffdf7"/><circle cx="85" cy="85" r="49" fill="none" stroke="#526070"/><text x="85.0" y="28.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="85.0" cy="36.0" r="2" fill="#526070"/><text x="115.5" y="36.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="109.5" cy="42.5647552145625" r="2" fill="#526070"/><text x="137.83" y="58.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="127.43524478543749" cy="60.49999999999999" r="2" fill="#526070"/><text x="146.0" y="89.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="134.0" cy="85.0" r="2" fill="#526070"/><text x="137.83" y="119.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="127.4352447854375" cy="109.49999999999999" r="2" fill="#526070"/><text x="115.5" y="141.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="109.5" cy="127.4352447854375" r="2" fill="#526070"/><text x="85.0" y="150.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="85.0" cy="134.0" r="2" fill="#526070"/><text x="54.5" y="141.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="60.500000000000014" cy="127.4352447854375" r="2" fill="#526070"/><text x="32.17" y="119.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="42.56475521456252" cy="109.50000000000003" r="2" fill="#526070"/><text x="24.0" y="89.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="36.0" cy="85.00000000000001" r="2" fill="#526070"/><text x="32.17" y="58.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="42.56475521456251" cy="60.49999999999999" r="2" fill="#526070"/><text x="54.5" y="36.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="60.49999999999998" cy="42.56475521456252" r="2" fill="#526070"/><path d="M 85 85 L 65.4 118.94819582835001" stroke="#263344" stroke-width="3"/><circle cx="85" cy="85" r="4"/><path d="M 85.0 45.0 A 40 40 0 0 1 119.64101615137754 65.0" fill="none" stroke="#dc5555" stroke-width="5"/><circle cx="119.64101615137754" cy="65.0" r="4" fill="#dc5555"/><path d="M 119.64101615137754 65.0 A 40 40 0 0 1 105.0 119.64101615137756" fill="none" stroke="#4686da" stroke-width="5"/><circle cx="105.0" cy="119.64101615137756" r="4" fill="#4686da"/><path d="M 105.0 119.64101615137756 A 40 40 0 0 1 65.00000000000001 119.64101615137756" fill="none" stroke="#daa93d" stroke-width="5"/><circle cx="65.00000000000001" cy="119.64101615137756" r="4" fill="#daa93d"/><path d="M 85.0 54.0 A 31 31 0 0 1 100.5 111.84678751731761" fill="none" stroke="#8753a0" stroke-width="5"/><circle cx="100.5" cy="111.84678751731761" r="4" fill="#8753a0"/><path d="M 85.0 63.0 A 22 22 0 1 1 74.0 104.05255888325766" fill="none" stroke="#895d40" stroke-width="5"/><circle cx="74.0" cy="104.05255888325766" r="4" fill="#895d40"/><circle cx="255" cy="85" r="49" fill="none" stroke="#526070"/><text x="255.0" y="28.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="255.0" cy="36.0" r="2" fill="#526070"/><text x="285.5" y="36.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="279.5" cy="42.5647552145625" r="2" fill="#526070"/><text x="307.83" y="58.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="297.4352447854375" cy="60.49999999999999" r="2" fill="#526070"/><text x="316.0" y="89.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="304.0" cy="85.0" r="2" fill="#526070"/><text x="307.83" y="119.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="297.4352447854375" cy="109.49999999999999" r="2" fill="#526070"/><text x="285.5" y="141.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="279.5" cy="127.4352447854375" r="2" fill="#526070"/><text x="255.0" y="150.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="255.0" cy="134.0" r="2" fill="#526070"/><text x="224.5" y="141.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="230.5" cy="127.4352447854375" r="2" fill="#526070"/><text x="202.17" y="119.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="212.56475521456252" cy="109.50000000000003" r="2" fill="#526070"/><text x="194.0" y="89.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="206.0" cy="85.00000000000001" r="2" fill="#526070"/><text x="202.17" y="58.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="212.56475521456252" cy="60.49999999999999" r="2" fill="#526070"/><text x="224.5" y="36.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="230.49999999999997" cy="42.56475521456252" r="2" fill="#526070"/><path d="M 255 85 L 235.4 118.94819582835001" stroke="#263344" stroke-width="3"/><circle cx="255" cy="85" r="4"/><path d="M 255.0 45.0 A 40 40 0 0 1 289.6410161513775 65.0" fill="none" stroke="#dc5555" stroke-width="5"/><circle cx="289.6410161513775" cy="65.0" r="4" fill="#dc5555"/><path d="M 289.6410161513775 65.0 A 40 40 0 0 1 275.0 119.64101615137756" fill="none" stroke="#4686da" stroke-width="5"/><circle cx="275.0" cy="119.64101615137756" r="4" fill="#4686da"/><path d="M 275.0 119.64101615137756 A 40 40 0 0 1 235.0 119.64101615137756" fill="none" stroke="#daa93d" stroke-width="5"/><circle cx="235.0" cy="119.64101615137756" r="4" fill="#daa93d"/><path d="M 281.8467875173176 69.5 A 31 31 0 0 1 239.5 111.84678751731761" fill="none" stroke="#38a078" stroke-width="5"/><circle cx="239.5" cy="111.84678751731761" r="4" fill="#38a078"/><path d="M 255.0 63.0 A 22 22 0 1 1 244.0 104.05255888325766" fill="none" stroke="#895d40" stroke-width="5"/><circle cx="244.0" cy="104.05255888325766" r="4" fill="#895d40"/><text x="85" y="160" text-anchor="middle" font-size="13" fill="#263344">(2 + 3) + 2</text><text x="255" y="160" text-anchor="middle" font-size="13" fill="#263344">2 + (3 + 2)</text></svg>
-->
<!--
Learning objective: discover associativity by experimenting with different arc lengths.
Reuse the existing Konva.js clock component. Display two clocks side by side, labeled (a+b)+c and a+(b+c). Both clocks share the same three operand values.
Show three consecutive arcs colored red, blue and yellow on each clock. Each arc represents an additive displacement. Give each arc a directly draggable endpoint that snaps to clock ticks. Dragging changes that arc's displacement; subsequent arcs move with it while retaining their own lengths. Dragging an arc on either clock updates both clocks immediately. Do not introduce sliders or separate grouping controls.
On the left clock, visually combine red and blue into purple, then combine purple and yellow into brown. On the right clock, visually combine blue and yellow into green, then combine red and green into brown. Keep the original arcs and their draggable endpoints accessible while displaying the combined arcs. Use symbolic colors rather than physical paint mixing. Preserve the order and lengths of the original arcs.
Show both numerical parenthesizations and their results modulo the clock size. Both final brown arcs and clock hand positions must agree. Allow repeated experimentation without resetting the activity.
Initial arc lengths remain open. The earlier red-blue-yellow palette is retained provisionally because it supports the proposed purple/green combinations.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220"><rect width="100%" height="100%" fill="#fffdf7"/><path d="M20 35 H320" stroke="#526070"/><text x="50" y="23" text-anchor="middle" font-size="13" fill="#263344">-24</text><path d="M50 30 v10" stroke="#526070"/><text x="110" y="23" text-anchor="middle" font-size="13" fill="#263344">-12</text><path d="M110 30 v10" stroke="#526070"/><text x="170" y="23" text-anchor="middle" font-size="13" fill="#263344">0</text><path d="M170 30 v10" stroke="#526070"/><text x="230" y="23" text-anchor="middle" font-size="13" fill="#263344">12</text><path d="M230 30 v10" stroke="#526070"/><text x="290" y="23" text-anchor="middle" font-size="13" fill="#263344">24</text><path d="M290 30 v10" stroke="#526070"/><circle cx="170" cy="35" r="6" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="170" y="39" text-anchor="middle" font-size="13" fill="#263344"></text><circle cx="170" cy="135" r="49" fill="none" stroke="#526070"/><text x="170.0" y="78.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="170.0" cy="86.0" r="2" fill="#526070"/><text x="200.5" y="86.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="194.5" cy="92.5647552145625" r="2" fill="#526070"/><text x="222.83" y="108.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="212.43524478543748" cy="110.5" r="2" fill="#526070"/><text x="231.0" y="139.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="219.0" cy="135.0" r="2" fill="#526070"/><text x="222.83" y="169.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="212.4352447854375" cy="159.5" r="2" fill="#526070"/><text x="200.5" y="191.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="194.5" cy="177.4352447854375" r="2" fill="#526070"/><text x="170.0" y="200.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="170.0" cy="184.0" r="2" fill="#526070"/><text x="139.5" y="191.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="145.5" cy="177.4352447854375" r="2" fill="#526070"/><text x="117.17" y="169.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="127.56475521456252" cy="159.50000000000003" r="2" fill="#526070"/><text x="109.0" y="139.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="121.0" cy="135.0" r="2" fill="#526070"/><text x="117.17" y="108.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="127.56475521456251" cy="110.5" r="2" fill="#526070"/><text x="139.5" y="86.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="145.49999999999997" cy="92.56475521456252" r="2" fill="#526070"/><path d="M 170 135 L 203.94819582835 154.6" stroke="#263344" stroke-width="3"/><circle cx="170" cy="135" r="4"/><text x="170" y="210" text-anchor="middle" font-size="13" fill="#263344">4 + 12k ≡ 4 (mod 12)</text></svg>
-->
<!--
Reuse the existing Konva.js clock component. Place a horizontal number line labeled 12Z above the clock, with equally spaced ticks labeled ..., -24, -12, 0, 12, 24, ... extending in both directions. Render the label as $12\mathbb{Z}$ using the scene's math-rendering utility. Do not introduce cosets yet.

Place a directly draggable dot initially at zero. Snap the dot to multiples of twelve. Each tick traversed to the right produces one full clockwise rotation of the clock hand; each tick traversed to the left produces one full counterclockwise rotation. Animate every full rotation slowly enough for the learner to see the hand traverse the entire clock face. Do not reduce the animation to its final position modulo twelve, which would make the movement invisible. If several ticks are traversed, preserve the corresponding number and direction of rotations.

Allow the learner to drag the clock hand directly to any integer hour before manipulating the dot. Full rotations must return the hand to the selected starting hour, not necessarily zero. Allow repeated experimentation. No sliders or separate hour controls. Exact animation duration and number-line scrolling implementation are left to the coding agent.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 160"><rect width="100%" height="100%" fill="#fffdf7"/><circle cx="85" cy="72" r="49" fill="none" stroke="#526070"/><text x="85.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="85.0" cy="23.0" r="2" fill="#526070"/><circle cx="85.0" cy="23.0" r="5" fill="none" stroke="#4686da"/><text x="115.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="109.5" cy="29.564755214562503" r="2" fill="#526070"/><path d="M 109.5 29.564755214562503 Q 84.99999999999999 29.56475521456251 60.49999999999998 29.564755214562517" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="137.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="127.43524478543749" cy="47.49999999999999" r="2" fill="#526070"/><path d="M 127.43524478543749 47.49999999999999 Q 85.0 47.49999999999999 42.56475521456251 47.49999999999999" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="146.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="134.0" cy="72.0" r="2" fill="#526070"/><path d="M 134.0 72.0 Q 85.0 72.0 36.0 72.00000000000001" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="137.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="127.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><path d="M 127.4352447854375 96.49999999999999 Q 85.00000000000001 96.5 42.56475521456252 96.50000000000003" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="115.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="109.5" cy="114.4352447854375" r="2" fill="#526070"/><path d="M 109.5 114.4352447854375 Q 85.0 114.4352447854375 60.500000000000014 114.4352447854375" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="85.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="85.0" cy="121.0" r="2" fill="#526070"/><circle cx="85.0" cy="121.0" r="5" fill="none" stroke="#4686da"/><text x="54.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="60.500000000000014" cy="114.4352447854375" r="2" fill="#526070"/><text x="32.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="42.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="24.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="36.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="32.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="42.56475521456251" cy="47.49999999999999" r="2" fill="#526070"/><text x="54.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="60.49999999999998" cy="29.564755214562517" r="2" fill="#526070"/><circle cx="255" cy="72" r="49" fill="none" stroke="#526070"/><text x="255.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="255.0" cy="23.0" r="2" fill="#526070"/><circle cx="255.0" cy="23.0" r="5" fill="none" stroke="#4686da"/><text x="302.69" y="37.97" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="293.30974264093345" cy="41.44899970892205" r="2" fill="#526070"/><path d="M 293.30974264093345 41.44899970892205 Q 255.0 41.44899970892206 216.69025735906655 41.44899970892207" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="314.47" y="89.57" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="302.7714676969093" cy="82.9035257638594" r="2" fill="#526070"/><path d="M 302.7714676969093 82.9035257638594 Q 255.0 82.90352576385942 207.22853230309065 82.90352576385942" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="281.47" y="130.96" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="276.26030321676035" cy="116.14747452721853" r="2" fill="#526070"/><path d="M 276.26030321676035 116.14747452721853 Q 255.0 116.14747452721855 233.73969678323965 116.14747452721855" fill="none" stroke="#4686da" stroke-opacity=".65"/><text x="228.53" y="130.96" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="233.73969678323965" cy="116.14747452721855" r="2" fill="#526070"/><text x="195.53" y="89.57" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="207.22853230309065" cy="82.90352576385942" r="2" fill="#526070"/><text x="207.31" y="37.97" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="216.69025735906655" cy="41.44899970892207" r="2" fill="#526070"/><text x="85" y="145" text-anchor="middle" font-size="13" fill="#263344">n = 12</text><text x="255" y="145" text-anchor="middle" font-size="13" fill="#263344">n = 7</text></svg>
-->
<!--
Reuse the Konva clock. Draw one straight chord for each unordered pair of additive inverses x and -x modulo n. Mark self-inverse residues with a ring rather than a zero-length chord. Allow the learner to vary n using a draggable integer control. Selecting a residue highlights its partner and displays their sum modulo n inside the scene. Start at n=12. Keep the discovery question open until the next narration beat. The chords are parallel and the pairing is reflection across the vertical axis. Do not reveal these observations prematurely.
Add a button directly inside the Konva scene labeled "View multiple clocks". Toggle between the single interactive clock and a responsive tiled comparison of clocks for every modulus from 2 through 20. Each tile displays its modulus, all additive inverse chords, and self-inverse markers using the same conventions as the single clock. Shrink the clocks to fit while preserving legibility; allow scrolling if necessary. Provide a way to return to the single-clock view.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 165"><rect width="100%" height="100%" fill="#fffdf7"/><circle cx="85" cy="72" r="49" fill="none" stroke="#526070"/><text x="85.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="85.0" cy="23.0" r="2" fill="#526070"/><text x="115.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="109.5" cy="29.564755214562503" r="2" fill="#526070"/><text x="137.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="127.43524478543749" cy="47.49999999999999" r="2" fill="#526070"/><text x="146.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="134.0" cy="72.0" r="2" fill="#526070"/><text x="137.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="127.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="115.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="109.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="85.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="85.0" cy="121.0" r="2" fill="#526070"/><text x="54.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="60.500000000000014" cy="114.4352447854375" r="2" fill="#526070"/><text x="32.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="42.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="24.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="36.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="32.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="42.56475521456251" cy="47.49999999999999" r="2" fill="#526070"/><text x="54.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="60.49999999999998" cy="29.564755214562517" r="2" fill="#526070"/><path d="M 85 72 L 104.6 105.94819582835001" stroke="#263344" stroke-width="3"/><circle cx="85" cy="72" r="4"/><path d="M 85.0 32.0 A 40 40 0 0 1 119.64101615137754 52.0" fill="none" stroke="#dc5555" stroke-width="5"/><circle cx="119.64101615137754" cy="52.0" r="4" fill="#dc5555"/><path d="M 119.64101615137754 52.0 A 40 40 0 0 1 105.0 106.64101615137756" fill="none" stroke="#4686da" stroke-width="5"/><circle cx="105.0" cy="106.64101615137756" r="4" fill="#4686da"/><circle cx="255" cy="72" r="49" fill="none" stroke="#526070"/><text x="255.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="255.0" cy="23.0" r="2" fill="#526070"/><text x="285.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="279.5" cy="29.564755214562503" r="2" fill="#526070"/><text x="307.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="297.4352447854375" cy="47.49999999999999" r="2" fill="#526070"/><text x="316.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="304.0" cy="72.0" r="2" fill="#526070"/><text x="307.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="297.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="285.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="279.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="255.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">6</text><circle cx="255.0" cy="121.0" r="2" fill="#526070"/><text x="224.5" y="128.83" text-anchor="middle" font-size="9" fill="#263344">7</text><circle cx="230.5" cy="114.4352447854375" r="2" fill="#526070"/><text x="202.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">8</text><circle cx="212.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="194.0" y="76.0" text-anchor="middle" font-size="9" fill="#263344">9</text><circle cx="206.0" cy="72.00000000000001" r="2" fill="#526070"/><text x="202.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">10</text><circle cx="212.56475521456252" cy="47.49999999999999" r="2" fill="#526070"/><text x="224.5" y="23.17" text-anchor="middle" font-size="9" fill="#263344">11</text><circle cx="230.49999999999997" cy="29.564755214562517" r="2" fill="#526070"/><path d="M 255 72 L 274.6 105.94819582835001" stroke="#263344" stroke-width="3"/><circle cx="255" cy="72" r="4"/><path d="M 255.0 32.0 A 40 40 0 0 1 295.0 72.0" fill="none" stroke="#4686da" stroke-width="5"/><circle cx="295.0" cy="72.0" r="4" fill="#4686da"/><path d="M 295.0 72.0 A 40 40 0 0 1 275.0 106.64101615137756" fill="none" stroke="#dc5555" stroke-width="5"/><circle cx="275.0" cy="106.64101615137756" r="4" fill="#dc5555"/><text x="85" y="145" text-anchor="middle" font-size="13" fill="#263344">2 + 3</text><text x="255" y="145" text-anchor="middle" font-size="13" fill="#263344">3 + 2</text></svg>
-->
<!--
Reuse the synchronized two-clock associativity layout, but show two draggable arcs, red and blue, in opposite orders on the two clocks. Both clocks share the same operands. Dragging either arc updates both clocks. Display a+b and b+a with their current values using scene-integrated math rendering. Preserve arc lengths when reversing their order. Both final hands must agree. No separate grouping controls.
-->
:::narration[clock-commutativity-intro]
There is another property that our clock group has. We can add two numbers in either order and obtain the same result.

On the first clock we add the red arc and then the blue arc. On the second clock we add them in the opposite order. Drag the arcs to change their lengths and compare the results.

A group in which the order of two elements does not affect their product is called commutative, or abelian, in honor of the Norwegian mathematician Niels Henrik Abel. Abel made foundational contributions to the study of algebraic equations, but tragically died at the age of twenty-six. Many of the groups we will encounter are not abelian.
:::
::pause

## Modular multiplication {#modular-multiplication}
### Multiplication and units {#clock-units}
::scene[clock]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 250"><rect width="100%" height="100%" fill="#fffdf7"/><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#4686da"/></marker></defs><circle cx="75" cy="65" r="35" fill="none" stroke="#526070"/><text x="75.0" y="22.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="75.0" cy="30.0" r="2" fill="#526070"/><circle cx="75.0" cy="30.0" r="5" fill="none" stroke="#4686da"/><text x="115.7" y="92.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="105.31088913245536" cy="82.5" r="2" fill="#526070"/><path d="M 105.31088913245536 82.5 Q 75 65 75.0 30.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="34.3" y="92.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="44.689110867544656" cy="82.50000000000001" r="2" fill="#526070"/><path d="M 44.689110867544656 82.50000000000001 Q 75 65 75.0 30.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="75" y="115" text-anchor="middle" font-size="13" fill="#263344">n=3, a=0</text><circle cx="220" cy="65" r="35" fill="none" stroke="#526070"/><text x="220.0" y="22.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="220.0" cy="30.0" r="2" fill="#526070"/><circle cx="220.0" cy="30.0" r="5" fill="none" stroke="#4686da"/><text x="260.7" y="92.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="250.31088913245534" cy="82.5" r="2" fill="#526070"/><circle cx="250.31088913245534" cy="82.5" r="5" fill="none" stroke="#4686da"/><text x="179.3" y="92.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="189.68911086754466" cy="82.50000000000001" r="2" fill="#526070"/><circle cx="189.68911086754466" cy="82.50000000000001" r="5" fill="none" stroke="#4686da"/><text x="220" y="115" text-anchor="middle" font-size="13" fill="#263344">n=3, a=1</text><circle cx="365" cy="65" r="35" fill="none" stroke="#526070"/><text x="365.0" y="22.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="365.0" cy="30.0" r="2" fill="#526070"/><circle cx="365.0" cy="30.0" r="5" fill="none" stroke="#4686da"/><text x="405.7" y="92.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="395.3108891324554" cy="82.5" r="2" fill="#526070"/><path d="M 395.3108891324554 82.5 Q 365 65 334.6891108675446 82.50000000000001" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="324.3" y="92.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="334.6891108675446" cy="82.50000000000001" r="2" fill="#526070"/><path d="M 334.6891108675446 82.50000000000001 Q 365 65 395.3108891324554 82.5" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="365" y="115" text-anchor="middle" font-size="13" fill="#263344">n=3, a=2</text><circle cx="75" cy="185" r="35" fill="none" stroke="#526070"/><text x="75.0" y="142.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="75.0" cy="150.0" r="2" fill="#526070"/><circle cx="75.0" cy="150.0" r="5" fill="none" stroke="#4686da"/><text x="122.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="110.0" cy="185.0" r="2" fill="#526070"/><path d="M 110.0 185.0 Q 75 185 75.0 150.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="75.0" y="236.0" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="75.0" cy="220.0" r="2" fill="#526070"/><path d="M 75.0 220.0 Q 75 185 75.0 150.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="28.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="40.0" cy="185.0" r="2" fill="#526070"/><path d="M 40.0 185.0 Q 75 185 75.0 150.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="75" y="235" text-anchor="middle" font-size="13" fill="#263344">n=4, a=0</text><circle cx="220" cy="185" r="35" fill="none" stroke="#526070"/><text x="220.0" y="142.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="220.0" cy="150.0" r="2" fill="#526070"/><circle cx="220.0" cy="150.0" r="5" fill="none" stroke="#4686da"/><text x="267.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="255.0" cy="185.0" r="2" fill="#526070"/><circle cx="255.0" cy="185.0" r="5" fill="none" stroke="#4686da"/><text x="220.0" y="236.0" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="220.0" cy="220.0" r="2" fill="#526070"/><circle cx="220.0" cy="220.0" r="5" fill="none" stroke="#4686da"/><text x="173.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="185.0" cy="185.0" r="2" fill="#526070"/><circle cx="185.0" cy="185.0" r="5" fill="none" stroke="#4686da"/><text x="220" y="235" text-anchor="middle" font-size="13" fill="#263344">n=4, a=1</text><circle cx="365" cy="185" r="35" fill="none" stroke="#526070"/><text x="365.0" y="142.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="365.0" cy="150.0" r="2" fill="#526070"/><circle cx="365.0" cy="150.0" r="5" fill="none" stroke="#4686da"/><text x="412.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="400.0" cy="185.0" r="2" fill="#526070"/><path d="M 400.0 185.0 Q 365 185 365.0 220.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="365.0" y="236.0" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="365.0" cy="220.0" r="2" fill="#526070"/><path d="M 365.0 220.0 Q 365 185 365.0 150.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="318.0" y="189.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="330.0" cy="185.0" r="2" fill="#526070"/><path d="M 330.0 185.0 Q 365 185 365.0 220.0" fill="none" stroke="#4686da" stroke-opacity=".65" marker-end="url(#arrow)"/><text x="365" y="235" text-anchor="middle" font-size="13" fill="#263344">n=4, a=2</text></svg>
-->
<!--
Show a clock with n residues and directed arrows x -> ax mod n for every residue x. Let learners vary a and n using draggable integer controls. Start with n=12 and a=5. Use curved arrows where necessary to distinguish directions and loops. Highlight destinations receiving multiple arrows and destinations receiving none without relying on color alone. Display the current multiplier and modulus in the scene. Allow comparison of a=5 and a=4 modulo 12. Do not reveal the coprimality criterion until after the discovery beat.
Add a Konva button labeled "View multiplication maps" that toggles a tiled comparison matrix. Each row has a fixed modulus n, provisionally 2 through 20; label the row with n. Columns correspond to multipliers a=0,1,...,n-1, with unused cells blank. Each cell contains a miniature clock showing all directed arrows x -> ax mod n, including x=0 and self-loops. Label each multiplier. Preserve arrowheads and distinguish overlapping arrows and shared destinations. Allow horizontal and vertical scrolling or zooming as needed for legibility. Provide a return to the single-clock view. Do not initially highlight prime rows or reveal the answer. The zero multiplier is included for comparison but excluded from the question about nonzero elements. The intended discovery is that all nonzero multipliers are invertible exactly for prime moduli; do not conflate this with cyclicity of the unit group.
-->
:::narration[clock-units-explore]
Instead of adding numbers on our clock, what happens if we multiply them?

Each arrow connects a number to the result of multiplying it by the selected multiplier, modulo the number of positions on the clock. Change the multiplier and the modulus. Multiplication by a number is invertible exactly when no two arrows end at the same point.

Use the View multiplication maps button to compare many clocks at once. Each row uses the same modulus, and each clock in that row uses a different multiplier.

Remember that every element of a group must have an inverse. Can you tell which moduli have the property that every nonzero number is invertible under multiplication?
:::
::pause
<!--
Reveal the greatest common divisor of a and n. Highlight all residues coprime to n and show their count as phi(n). Keep the multiplication map interactive. Allow selecting a highlighted residue to inspect its multiplicative inverse; highlight the arrow ending at 1. Render equations inside Konva. For n=12 the units are 1,5,7,11. Use n>=2.
-->
:::narration[clock-units-explain]
When the multiplier and the modulus are relatively prime, every position receives exactly one arrow. In particular, exactly one number is sent to one. That number is the multiplicative inverse of our multiplier.

When the modulus is prime, every nonzero number is invertible. For composite moduli, some nonzero numbers are not invertible.

The numbers relatively prime to the modulus form a group under modular multiplication. We call these numbers units. The identity of this group is one.

Euler's totient function counts the number of units for a given modulus. Change the modulus and observe how the number of units changes.
:::
::pause

### Wilson's theorem {#wilson-theorem}
::scene[clock]
<!--
Show Wilson’s congruence and ask why it holds for primes. Hint one shows clocks
for 2, 3, and 5. Hint two connects inverse pairs on a clock modulo 7 and loops
at 1 and 6 (minus one). Reveal the solution on a separate Slidev slide using
the display block in the second beat.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220"><rect width="100%" height="100%" fill="#fffdf7"/><rect x="20" y="21" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(45 46) rotate(0) scale(1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="45" y="89" text-anchor="middle" font-size="13" fill="#263344">e</text><rect x="103" y="21" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(128 46) rotate(90) scale(1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="128" y="89" text-anchor="middle" font-size="13" fill="#263344">r</text><rect x="186" y="21" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(211 46) rotate(180) scale(1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="211" y="89" text-anchor="middle" font-size="13" fill="#263344">r²</text><rect x="269" y="21" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(294 46) rotate(270) scale(1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="294" y="89" text-anchor="middle" font-size="13" fill="#263344">r³</text><rect x="20" y="126" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(45 151) rotate(0) scale(-1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="45" y="194" text-anchor="middle" font-size="13" fill="#263344">s</text><rect x="103" y="126" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(128 151) rotate(90) scale(-1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="128" y="194" text-anchor="middle" font-size="13" fill="#263344">rs</text><rect x="186" y="126" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(211 151) rotate(180) scale(-1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="211" y="194" text-anchor="middle" font-size="13" fill="#263344">r²s</text><rect x="269" y="126" width="50" height="50" fill="none" stroke="#263344"/><g transform="translate(294 151) rotate(270) scale(-1 1)"><circle cx="-18.0" cy="-18.0" r="5" fill="#dc5555"/><circle cx="18.0" cy="-18.0" r="5" fill="#4686da"/><circle cx="18.0" cy="18.0" r="5" fill="#daa93d"/><circle cx="-18.0" cy="18.0" r="5" fill="#38a078"/></g><text x="294" y="194" text-anchor="middle" font-size="13" fill="#263344">r³s</text></svg>
-->
<!--
Reuse Chapter 0's square rotation and reflection tools. Main workspace: a large square with four differently colored vertex markers (red, blue, yellow, green, clockwise from upper left). Markers track the action; the underlying unmarked square is the figure whose symmetries are being studied. Snap to valid square symmetries. Collect each distinct transformation once, based on its permutation of vertices, not the gesture used.
Diagram specification: arrange eight small square tiles in a two-row, four-column gallery. Each tile has the same axis-aligned square outline and four inset colored vertex dots. Top row: e, r, r², r³; bottom row: s, rs, r²s, r³s. Define r as a clockwise quarter-turn and s as reflection across the vertical axis. For tile r^k s, reflect the original markers first, then rotate clockwise by k quarter-turns. Label beneath each tile using scene-integrated KaTeX. Initially show undiscovered slots without revealing their transformations; populate as students discover them. Selecting a collected tile replays its transformation from the reference square. Show a count of distinct discoveries out of eight. Allow optional hints and replay without penalty.
-->
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
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 178"><rect width="100%" height="100%" fill="#fffdf7"/><rect x="41" y="34" width="88" height="88" fill="none" stroke="#263344"/><g transform="translate(85 78) rotate(90) scale(-1 1)"><circle cx="-31.68" cy="-31.68" r="5" fill="#dc5555"/><circle cx="31.68" cy="-31.68" r="5" fill="#4686da"/><circle cx="31.68" cy="31.68" r="5" fill="#daa93d"/><circle cx="-31.68" cy="31.68" r="5" fill="#38a078"/></g><rect x="211" y="34" width="88" height="88" fill="none" stroke="#263344"/><g transform="translate(255 78) rotate(270) scale(-1 1)"><circle cx="-31.68" cy="-31.68" r="5" fill="#dc5555"/><circle cx="31.68" cy="-31.68" r="5" fill="#4686da"/><circle cx="31.68" cy="31.68" r="5" fill="#daa93d"/><circle cx="-31.68" cy="31.68" r="5" fill="#38a078"/></g><text x="85" y="20" text-anchor="middle" font-size="13" fill="#263344">Reflect, then rotate</text><text x="255" y="20" text-anchor="middle" font-size="13" fill="#263344">Rotate, then reflect</text><text x="85" y="145" text-anchor="middle" font-size="13" fill="#263344">rs</text><text x="255" y="145" text-anchor="middle" font-size="13" fill="#263344">sr</text></svg>
-->
<!--
Place two equally sized squares side by side, each with the same reference vertex colors. Left panel: Reflect, then rotate, labeled rs. Right panel: Rotate, then reflect, labeled sr. Animate each operation separately with a short hold between steps. Use the vertical reflection s and clockwise quarter-turn r initially. Both panels share the selected operations; changing a valid rotation or reflection in either panel updates both sequences, in reversed order. Provide replay and reset. Display final colored vertex arrangements simultaneously. For the initial example they differ: rs = r s, sr = r³s. Do not imply every pair of elements fails to commute. Keep the rightmost-first algebraic convention consistent with the earlier narration.
-->
:::narration[square-order-explore]
Try rotating the square and then reflecting it. Now perform the same transformations in the opposite order.

Unlike addition on a clock, changing the order of our transformations can change the result. The dihedral group is therefore an example of a non-abelian group.
:::
::pause

## Subgroups and Quotient Groups {#subgroups-quotients}
### Subgroups {#subgroups}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 170"><rect width="100%" height="100%" fill="#fffdf7"/><rect x="8" y="8" width="324" height="154" rx="10" fill="#526070" fill-opacity=".07" stroke="#526070" /><rect x="20" y="38" width="300" height="55" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><text x="35" y="28" text-anchor="middle" font-size="13" fill="#263344">D₄</text><circle cx="57" cy="65" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="57" y="69" text-anchor="middle" font-size="13" fill="#263344">e</text><circle cx="132" cy="65" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="132" y="69" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="207" cy="65" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="207" y="69" text-anchor="middle" font-size="13" fill="#263344">r²</text><circle cx="282" cy="65" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="282" y="69" text-anchor="middle" font-size="13" fill="#263344">r³</text><circle cx="57" cy="127" r="17" fill="#888888" fill-opacity=".16" stroke="#888888"/><text x="57" y="131" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="132" cy="127" r="17" fill="#888888" fill-opacity=".16" stroke="#888888"/><text x="132" y="131" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="207" cy="127" r="17" fill="#888888" fill-opacity=".16" stroke="#888888"/><text x="207" y="131" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="282" cy="127" r="17" fill="#888888" fill-opacity=".16" stroke="#888888"/><text x="282" y="131" text-anchor="middle" font-size="13" fill="#263344">r³s</text></svg>
-->
<!--
Diagram: a large rounded rectangular boundary labeled G = D₄ contains eight circular beads or miniature symmetry tiles, arranged in two rows of four. Top row e,r,r²,r³; bottom row s,rs,r²s,r³s. Draw a blue rounded enclosure around the top row, labeled H. The enclosure represents a subset, not a new group element. Use the same transformation thumbnails and notation as the previous scene. Selecting a bead previews its action on a separate square. Allow students to select or deselect beads to define a candidate subset; update the enclosure to surround selected beads (rearrange into a selected tray if needed). Provide a product tester: choose two selected elements in stated rightmost-first order, animate their transformations, then highlight the resulting bead. If outside the subset, animate a copy traveling outside its boundary. Provide an inverse tester and an identity check. A complete validation checks every product and inverse and identity membership, not just sampled pairs. Offer presets for rotations, {e,s}, and a failing subset, without prematurely revealing answers. Use labels and outlines in addition to color. Render equations inside Konva.
-->
:::narration[subgroups-intro]
Sometimes, within a group, we can find a smaller collection of elements that forms a group of its own.

For example, consider only the rotations of a square. Composing two rotations gives us another rotation, and the inverse of a rotation is also a rotation.

This smaller group is called a subgroup. It contains the identity, and it is closed under products and inverses. Try selecting other collections of symmetries and see whether they form subgroups.
:::
::pause

### A subgroup on the clock {#clock-subgroup}
::scene[clock]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 150"><rect width="100%" height="100%" fill="#fffdf7"/><circle cx="85" cy="72" r="49" fill="none" stroke="#526070"/><text x="85.0" y="15.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="85.0" cy="23.0" r="2" fill="#526070"/><text x="137.83" y="45.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="127.43524478543749" cy="47.49999999999999" r="2" fill="#526070"/><text x="137.83" y="106.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="127.4352447854375" cy="96.49999999999999" r="2" fill="#526070"/><text x="85.0" y="137.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="85.0" cy="121.0" r="2" fill="#526070"/><text x="32.17" y="106.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="42.56475521456252" cy="96.50000000000003" r="2" fill="#526070"/><text x="32.17" y="45.5" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="42.56475521456251" cy="47.49999999999999" r="2" fill="#526070"/><rect x="170" y="35" width="155" height="70" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><circle cx="195" cy="70" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="195" y="74" text-anchor="middle" font-size="13" fill="#263344">0</text><circle cx="247" cy="70" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="247" y="74" text-anchor="middle" font-size="13" fill="#263344">2</text><circle cx="299" cy="70" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="299" y="74" text-anchor="middle" font-size="13" fill="#263344">4</text></svg>
-->
<!--
Reuse the clock with modulus six. Highlight 0,2,4 with blue rings. Animate repeated addition of two, cycling 0→2→4→0. Allow selection of two highlighted residues and display their sum modulo six. Let learners inspect additive inverses. The highlighted subset is a subgroup under the original addition operation. Keep this brief and reuse existing clock controls where practical.
-->
:::narration[clock-subgroup-intro]
We can find subgroups in our clock groups as well. On a clock with six positions, start at zero and repeatedly add two. Which positions can you reach? Try adding two numbers from this collection. Do you ever leave it?
:::
::pause

### Cosets {#cosets}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 200"><rect width="100%" height="100%" fill="#fffdf7"/><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#4686da"/></marker></defs><rect x="15" y="10" width="310" height="60" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><rect x="15" y="130" width="310" height="60" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><circle cx="53" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="53" y="44" text-anchor="middle" font-size="13" fill="#263344">e</text><path d="M53 60 V138" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="53" cy="160" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="53" y="164" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="131" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="131" y="44" text-anchor="middle" font-size="13" fill="#263344">r</text><path d="M131 60 V138" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="131" cy="160" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="131" y="164" text-anchor="middle" font-size="13" fill="#263344">sr</text><circle cx="209" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="209" y="44" text-anchor="middle" font-size="13" fill="#263344">r²</text><path d="M209 60 V138" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="209" cy="160" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="209" y="164" text-anchor="middle" font-size="13" fill="#263344">sr²</text><circle cx="287" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="287" y="44" text-anchor="middle" font-size="13" fill="#263344">r³</text><path d="M287 60 V138" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="287" cy="160" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="287" y="164" text-anchor="middle" font-size="13" fill="#263344">sr³</text><text x="170" y="100" text-anchor="middle" font-size="13" fill="#263344">Multiply by s</text></svg>
-->
<!--
Diagram: two horizontal rounded trays, each wide enough for four evenly spaced circular beads. Upper blue tray H contains e,r,r²,r³. Lower amber tray is the destination coset. Put a multiplier slot between them, with downward arrows from each upper bead to its image. Drag a symmetry tile g into the slot to animate copies h→gh; preserve the original H tray. For g=s the lower tray initially shows s,sr,sr²,sr³ in correspondence order; also show canonical labels s,r³s,r²s,rs respectively. Do not confuse pairing order with set equality. Maintain a separate overview of all eight elements, outlining each distinct coset as it is discovered. Repeated choices yielding the same coset reuse its boundary, even when the internal correspondence changes. Allow undo and representative changes. Include a preset H={e,s} so learners can discover four cosets of size two. Keep all group elements distinct and never duplicate them in the partition overview. Use a draggable tile or accessible selection equivalent.
-->
:::narration[cosets-intro]
What happens if we take every element of a subgroup and multiply it on the left by the same group element?

We obtain a collection of elements called a left coset. Let's see what happens when we multiply all the rotations of our square by a reflection.

Try choosing other multipliers. Can two different cosets partially overlap? How does the number of elements in a coset compare with the number in the original subgroup?
:::
::pause

### Lagrange's theorem {#lagrange-theorem}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 170"><rect width="100%" height="100%" fill="#fffdf7"/><rect x="15" y="10" width="310" height="60" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><rect x="15" y="80" width="310" height="60" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><circle cx="53" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="53" y="44" text-anchor="middle" font-size="13" fill="#263344">e</text><circle cx="131" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="131" y="44" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="209" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="209" y="44" text-anchor="middle" font-size="13" fill="#263344">r²</text><circle cx="287" cy="40" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="287" y="44" text-anchor="middle" font-size="13" fill="#263344">r³</text><circle cx="53" cy="110" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="53" y="114" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="131" cy="110" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="131" y="114" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="209" cy="110" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="209" y="114" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="287" cy="110" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="287" y="114" text-anchor="middle" font-size="13" fill="#263344">r³s</text><text x="170" y="160" text-anchor="middle" font-size="13" fill="#263344">2 × 4 = 8</text></svg>
-->
<!--
Reuse the coset partition overview. Initially show two outlined trays of four elements each for the rotation subgroup. Let students count trays and beads per tray before revealing 2 × 4 = 8. Switch to H={e,s}, showing four trays of two. Display |G|=[G:H]|H| with scene-integrated math; define the index as the number of left cosets. Ask which subgroup sizes are impossible for a group of order eight. Divisibility is necessary, not sufficient in general. No formal proof required; optionally replay multiplication by g and g^{-1} to illustrate equal sizes.
-->
:::narration[lagrange-intro]
The left cosets partition our group into collections of equal size. Each collection has as many elements as the subgroup itself.

Count the number of cosets and the number of elements in each coset. Multiply these two numbers together. Now try another subgroup.

This is Lagrange's theorem: the order of a subgroup of a finite group divides the order of the group.
:::
::pause

### Normal subgroups {#normal-subgroups}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 190"><rect width="100%" height="100%" fill="#fffdf7"/><text x="85" y="18" text-anchor="middle" font-size="13" fill="#263344">sH</text><text x="255" y="18" text-anchor="middle" font-size="13" fill="#263344">Hs</text><rect x="10" y="28" width="150" height="60" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><circle cx="32" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="32" y="62" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="69" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="69" y="62" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="106" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="106" y="62" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="143" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="143" y="62" text-anchor="middle" font-size="13" fill="#263344">r³s</text><rect x="180" y="28" width="150" height="60" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><circle cx="202" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="202" y="62" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="239" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="239" y="62" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="276" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="276" y="62" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="313" cy="58" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="313" y="62" text-anchor="middle" font-size="13" fill="#263344">r³s</text><text x="170" y="105" text-anchor="middle" font-size="13" fill="#263344">Rotation subgroup: equal</text><rect x="10" y="120" width="150" height="55" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><rect x="180" y="120" width="150" height="55" rx="10" fill="#38a078" fill-opacity=".07" stroke="#38a078" /><circle cx="50" cy="147" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="50" y="151" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="115" cy="147" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="115" y="151" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="220" cy="147" r="17" fill="#38a078" fill-opacity=".16" stroke="#38a078"/><text x="220" y="151" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="285" cy="147" r="17" fill="#38a078" fill-opacity=".16" stroke="#38a078"/><text x="285" y="151" text-anchor="middle" font-size="13" fill="#263344">r³s</text></svg>
-->
<!--
Diagram: two equally sized panels labeled gH and Hg, each containing an outlined tray of beads. A shared multiplier tile g and subgroup selector control both. Animate left multiplication h→gh on the left and right multiplication h→hg on the right. Compare sets, not positions or pairing order; highlight unmatched beads. Preset H=<r>, g=s: both trays contain s,rs,r²s,r³s. Preset H=<s>, g=r: left tray contains r,rs; right tray contains r,r³s. Use blue matching outlines for equal sets and distinct amber/green outlines plus explicit inequality for different sets. Allow every g to be tested and provide a complete check before declaring normality. After exploration introduce conjugation: animate h→ghg^{-1} and show whether the resulting subgroup boundary agrees with H. For the reflection example, conjugating s by r rotates its reflection axis by a quarter-turn, giving r²s. Do not require classification of all subgroups. Preserve square previews and rightmost-first composition.
-->
:::narration[normal-subgroups-intro]
Because the dihedral group is not abelian, multiplying a subgroup on the left might produce a different collection of elements than multiplying it on the right.

However, some subgroups have a remarkable property: their left and right cosets always agree. We call these normal subgroups.

Soon we will define a notion of dividing one group by a subgroup. Normality is exactly the condition that allows a subgroup to serve as the denominator in this construction. We cannot divide a group by an arbitrary subgroup in this way.

Try the rotation subgroup and then the subgroup consisting of the identity and a single reflection. Compare the left and right cosets for different multipliers.
:::
::pause
<!-- Render gH=Hg for every g in G, equivalently gHg^{-1}=H. Introduce conjugation only after the left/right comparison. -->
:::narration[normal-subgroups-conjugation]
Another way to describe normality is through conjugation. Multiply each element of the subgroup on the left by a group element and on the right by its inverse. A normal subgroup is unchanged as a set by every such conjugation.
:::
::pause

### Quotient groups {#quotient-groups}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 240"><rect width="100%" height="100%" fill="#fffdf7"/><rect x="15" y="10" width="140" height="100" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><rect x="185" y="10" width="140" height="100" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><circle cx="52" cy="35" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="52" y="39" text-anchor="middle" font-size="13" fill="#263344">e</text><circle cx="118" cy="35" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="118" y="39" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="52" cy="83" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="52" y="87" text-anchor="middle" font-size="13" fill="#263344">r²</text><circle cx="118" cy="83" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="118" y="87" text-anchor="middle" font-size="13" fill="#263344">r³</text><circle cx="222" cy="35" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="222" y="39" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="288" cy="35" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="288" y="39" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="222" cy="83" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="222" y="87" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="288" cy="83" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="288" y="87" text-anchor="middle" font-size="13" fill="#263344">r³s</text><text x="170" y="135" text-anchor="middle" font-size="13" fill="#263344">↓ Collapse each coset ↓</text><circle cx="85" cy="185" r="32" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="85" y="189" text-anchor="middle" font-size="13" fill="#263344">H</text><circle cx="255" cy="185" r="32" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="255" y="189" text-anchor="middle" font-size="13" fill="#263344">sH</text><text x="170" y="235" text-anchor="middle" font-size="13" fill="#263344">D₄/H ≅ ℤ/2ℤ</text></svg>
-->
<!--
Diagram: two side-by-side rounded rectangular enclosures, blue for rotations and amber for reflections. Each contains four beads arranged in a two-by-two grid. Blue: e,r,r²,r³; amber: s,rs,r²s,r³s. Label the enclosures H and sH and caption them Rotations and Reflections. A Collapse cosets control animates the four beads in each enclosure toward its center, shrinking or fading them into a single larger circular token labeled H or sH. Never merge the two different cosets. Expand cosets reverses the animation, restoring all original beads and labels. The tokens are quotient elements, not original transformations. Show D₄/H ≅ Z/2Z after collapse. H is the quotient identity.
Next, provide two operand trays and a product tray. Select two cosets, then choose one representative from each; animate the product in rightmost-first order and highlight its destination coset. Changing either representative leaves the destination coset unchanged for H=<r>. Allow all four pairs of quotient elements, including two reflection cosets whose product is H. Show (aH)(bH)=abH. Then offer a non-normal comparison H={e,s}: use operands H and rH. Representatives e,r give rH, whereas s,r give srH=r³H, a different left coset. Animate the distinct destinations and explain why the proposed multiplication is not well-defined. Do not collapse the non-normal cosets into a purported group. All labels and equations are scene-integrated; exact timing and styling are implementation decisions.
-->
:::narration[quotient-groups-intro]
Imagine that we are no longer interested in distinguishing the individual rotations of a square. Instead, we only want to distinguish rotations from reflections.

We can identify all the rotations with one another and all the reflections with one another. In doing so, we obtain a new group with only two elements. This is an example of a quotient group. Division here means forgetting certain information: we identify elements that belong to the same coset. A representative can name its coset, but it is the entire coset that is an element of the quotient.

Collapse the cosets to see the two elements of our new group. Expand them again to see which original transformations they represent.
:::
::pause
:::narration[quotient-groups-products]
Choose two cosets and multiply a representative from each. Now change the representatives while keeping the same cosets. Does the product still belong to the same coset?

For a normal subgroup, the answer is always yes. This allows us to define multiplication on the cosets themselves. Try the same experiment with the non-normal reflection subgroup and see why normality matters.
:::
::pause


## Bonus: Group Homomorphisms {#homomorphisms-bonus}
### Homomorphisms and generators {#homomorphisms-generators}
::scene[clock]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 150"><rect width="100%" height="100%" fill="#fffdf7"/><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#4686da"/></marker></defs><circle cx="75" cy="70" r="49" fill="none" stroke="#526070"/><text x="75.0" y="13.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="75.0" cy="21.0" r="2" fill="#526070"/><text x="127.83" y="43.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="117.43524478543749" cy="45.49999999999999" r="2" fill="#526070"/><text x="127.83" y="104.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="117.4352447854375" cy="94.49999999999999" r="2" fill="#526070"/><text x="75.0" y="135.0" text-anchor="middle" font-size="9" fill="#263344">3</text><circle cx="75.0" cy="119.0" r="2" fill="#526070"/><text x="22.17" y="104.5" text-anchor="middle" font-size="9" fill="#263344">4</text><circle cx="32.56475521456252" cy="94.50000000000003" r="2" fill="#526070"/><text x="22.17" y="43.5" text-anchor="middle" font-size="9" fill="#263344">5</text><circle cx="32.56475521456251" cy="45.49999999999999" r="2" fill="#526070"/><path d="M 75 70 L 108.94819582835 50.39999999999999" stroke="#263344" stroke-width="3"/><circle cx="75" cy="70" r="4"/><circle cx="265" cy="70" r="49" fill="none" stroke="#526070"/><text x="265.0" y="13.0" text-anchor="middle" font-size="9" fill="#263344">0</text><circle cx="265.0" cy="21.0" r="2" fill="#526070"/><text x="317.83" y="104.5" text-anchor="middle" font-size="9" fill="#263344">1</text><circle cx="307.4352447854375" cy="94.49999999999999" r="2" fill="#526070"/><text x="212.17" y="104.5" text-anchor="middle" font-size="9" fill="#263344">2</text><circle cx="222.56475521456252" cy="94.50000000000003" r="2" fill="#526070"/><path d="M 265 70 L 298.94819582835 89.6" stroke="#263344" stroke-width="3"/><circle cx="265" cy="70" r="4"/><path d="M140 70 H200" stroke="#4686da" marker-end="url(#arrow)"/><text x="170" y="55" text-anchor="middle" font-size="13" fill="#263344">f</text><text x="170" y="145" text-anchor="middle" font-size="13" fill="#263344">Choose the image of 1</text></svg>
-->
<!--
Konva full-slide scene. Place input and output clocks side by side, labeled G and H, with f:G→H between them. Default additive example Z/12Z→Z/6Z, f(x)=x mod 6. A generator selector chooses the image of 1; permit only values a satisfying 12a=0 mod 6 when committing a homomorphism. Animate successive input ticks and corresponding output steps of a, drawing arrows or highlighting matched residues. For configurable moduli n,m, validate na=0 mod m; invalid candidates show the wraparound inconsistency, not a purported map. Let learners select two input residues and compare f(x+y) with f(x)+f(y). Optional square example uses orientation map D₄→Z/2Z, r↦0,s↦1; show that the two generator images determine all eight outputs. Use scene-integrated KaTeX and accessible equivalents for all controls.
-->
:::narration[homomorphisms-generators-intro]
A homomorphism is a map from one group to another that preserves the group operation. If f maps G to H, then f of a product is the product of the images. For additive groups, this means f of a sum is the sum of the images.

A homomorphism is determined entirely by where it sends the generators of the input group. Once we know where one goes on an additive clock, we know where every other number goes. Not every choice of generator images is possible, because the relations in the input group must still hold.

Choose the image of one on the output clock and watch the other images appear. Select two input numbers to compare mapping their sum with adding their images. Change the clock sizes to explore which choices are possible.
:::
::pause

### The first isomorphism theorem: clocks {#first-isomorphism-clock}
::scene[clock]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 220"><rect width="100%" height="100%" fill="#fffdf7"/><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#4686da"/></marker></defs><rect x="10" y="20" width="190" height="55" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><circle cx="32" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="32" y="51" text-anchor="middle" font-size="13" fill="#263344">0</text><circle cx="78" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="78" y="51" text-anchor="middle" font-size="13" fill="#263344">3</text><path d="M200 47 H270" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="300" cy="47" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="300" y="51" text-anchor="middle" font-size="13" fill="#263344">0</text><rect x="10" y="85" width="190" height="55" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><circle cx="32" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="32" y="116" text-anchor="middle" font-size="13" fill="#263344">1</text><circle cx="78" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="78" y="116" text-anchor="middle" font-size="13" fill="#263344">4</text><path d="M200 112 H270" stroke="#d99436" marker-end="url(#arrow)"/><circle cx="300" cy="112" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="300" y="116" text-anchor="middle" font-size="13" fill="#263344">1</text><rect x="10" y="150" width="190" height="55" rx="10" fill="#38a078" fill-opacity=".07" stroke="#38a078" /><circle cx="32" cy="177" r="15" fill="#38a078" fill-opacity=".16" stroke="#38a078"/><text x="32" y="181" text-anchor="middle" font-size="13" fill="#263344">2</text><circle cx="78" cy="177" r="15" fill="#38a078" fill-opacity=".16" stroke="#38a078"/><text x="78" y="181" text-anchor="middle" font-size="13" fill="#263344">5</text><path d="M200 177 H270" stroke="#38a078" marker-end="url(#arrow)"/><circle cx="300" cy="177" r="17" fill="#38a078" fill-opacity=".16" stroke="#38a078"/><text x="300" y="181" text-anchor="middle" font-size="13" fill="#263344">2</text></svg>
-->
<!--
Use two clocks with default n=12,m=6 and f(x)=x mod 6. Show f(x+y)=f(x)+f(y), ker f={x∈G:f(x)=e_H}, im f={f(x):x∈G}, and G/ker f≅im f using Konva-integrated math. Below the input clock, arrange all input residues as distinct beads in disjoint rounded coset boundaries; default blocks {0,6},{1,7},...,{5,11}. Output clock retains every residue, including any outside the image for non-surjective examples. Hover, focus or tap an output residue to highlight its entire preimage boundary and corresponding input clock ticks; empty fibers explicitly say Not in the image. Use consistent colors and labels, with the kernel emphasized at output zero. Reverse highlighting when selecting an input coset. Provide modulus selectors and a generator-image selector restricted to valid homomorphisms as above. Include a non-surjective preset Z/6Z→Z/12Z, x↦2x. Collapse control animates each nonempty fiber into a distinct quotient token, then aligns it with its output; expand reverses. Never merge different fibers. Display coset representative labels x+ker f, not bare x unless clearly marked as a representative. No formal proof required.
-->
:::narration[first-isomorphism-clock-intro]
The kernel of a homomorphism consists of all the elements that are sent to the identity of the output group. On our additive clocks, that identity is zero. The image consists of all elements in the output group that occur as outputs of some element of the input group.

Hover over a number on the output clock, or tap it, to see all the input numbers that are sent there. Notice that each nonempty collection is a coset of the kernel. Try changing the clock sizes and the image of the generator.

Click Collapse cosets to identify the elements in each coset. The resulting quotient has exactly the same group structure as the image. This is the first isomorphism theorem. Click Expand cosets to recover the original diagram.
:::
::pause

### The first isomorphism theorem: square symmetries {#first-isomorphism-square}
::scene[square]
<!--
STATIC SVG REFERENCE: representative state only; implement behavior using the adjacent scene instructions.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 155"><rect width="100%" height="100%" fill="#fffdf7"/><defs><marker id="arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto"><path d="M0 0 L5 2.5 L0 5 Z" fill="#4686da"/></marker></defs><rect x="10" y="20" width="190" height="55" rx="10" fill="#4686da" fill-opacity=".07" stroke="#4686da" /><circle cx="32" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="32" y="51" text-anchor="middle" font-size="13" fill="#263344">e</text><circle cx="78" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="78" y="51" text-anchor="middle" font-size="13" fill="#263344">r</text><circle cx="124" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="124" y="51" text-anchor="middle" font-size="13" fill="#263344">r²</text><circle cx="170" cy="47" r="15" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="170" y="51" text-anchor="middle" font-size="13" fill="#263344">r³</text><path d="M200 47 H270" stroke="#4686da" marker-end="url(#arrow)"/><circle cx="300" cy="47" r="17" fill="#4686da" fill-opacity=".16" stroke="#4686da"/><text x="300" y="51" text-anchor="middle" font-size="13" fill="#263344">0</text><rect x="10" y="85" width="190" height="55" rx="10" fill="#d99436" fill-opacity=".07" stroke="#d99436" /><circle cx="32" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="32" y="116" text-anchor="middle" font-size="13" fill="#263344">s</text><circle cx="78" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="78" y="116" text-anchor="middle" font-size="13" fill="#263344">rs</text><circle cx="124" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="124" y="116" text-anchor="middle" font-size="13" fill="#263344">r²s</text><circle cx="170" cy="112" r="15" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="170" y="116" text-anchor="middle" font-size="13" fill="#263344">r³s</text><path d="M200 112 H270" stroke="#d99436" marker-end="url(#arrow)"/><circle cx="300" cy="112" r="17" fill="#d99436" fill-opacity=".16" stroke="#d99436"/><text x="300" y="116" text-anchor="middle" font-size="13" fill="#263344">1</text></svg>
-->
<!--
Reuse the eight square symmetry beads and two coset boundaries from the quotient scene. Input G=D₄, output H=Z/2Z, orientation homomorphism f(r^k)=0, f(r^ks)=1. Output tokens labeled 0 (orientation preserving) and 1 (orientation reversing). Hover/focus/tap 0 highlights all rotations; 1 highlights all reflections. Selecting a bead previews its transformation on the square and highlights its output. Collapse each boundary to its own token and align with the corresponding output; expand reverses. Show kernel <r>, image Z/2Z, D₄/<r>≅Z/2Z. Provide two input selection slots and compare the image of their product with the sum of their outputs modulo two. Two reflections map to 1+1=0. Do not describe the reflections alone as a subgroup or the quotient as consisting solely of reflections.
-->
:::narration[first-isomorphism-square-intro]
We can do the same thing with the symmetries of a square. Send every rotation to zero and every reflection to one, using addition modulo two in the output group.

Hover over zero or one to see the corresponding coset, or select a symmetry to see its output. The kernel is the rotation subgroup. When we divide the dihedral group by this subgroup, all rotations become the identity and all reflections become a single other element.

Click Collapse cosets to see the quotient. Try composing two symmetries and compare their output with the sum of their individual outputs. We have forgotten the particular motion but retained whether it preserves or reverses orientation.
:::
::pause

### The correspondence theorem: clocks {#correspondence-clock}
::scene[clock]
<!--
Full-slide Konva. Default G=Z/12Z, N={0,6}. Modulus dropdown and normal subgroup dropdown (all subgroups of cyclic groups are normal). Compute subgroups as multiples of divisors of n, including trivial and whole group. Show all residues as beads, with N highlighted; use nested boundaries only for genuinely nested subgroups. For incomparable subgroups use separate selectable overlays or a branching inclusion diagram, never force a concentric chain. Left panel shows G and selectable subgroups K containing N; right panel shows G/N and its subgroups. Default eligible K: {0,6}, {0,3,6,9}, {0,2,4,6,8,10}, G. Animate N collapsing into the quotient identity 0 and every other N-coset into its own token simultaneously; show quotient Z/6Z. A selected K boundary maps to the boundary around K/N. Highlight matching subgroup nodes on both sides; selecting a quotient subgroup expands to its full preimage. Show inclusion edges only for actual inclusion, preserving branching. Ineligible subgroups may be inspected but labeled Does not contain N. Recompute on modulus or N change. Provide Collapse/Expand and accessible click/focus equivalents. Group selector can navigate to the square version if supported by existing scene architecture; otherwise use the next subsection, not a new manuscript directive.

Preferred primary visualization: simultaneous overlapping rounded rectangular subgroup regions, rather than a lattice as the primary view. Solid blue and amber boundaries represent two incomparable subgroups, dashed gray boxes represent denominator cosets, green emphasizes the denominator, and the outer frame represents G. Use a branching lattice only as an optional secondary view. Every boundary must enclose exactly its members; use unions of rounded rectilinear regions for other subgroup layouts, with selectable overlays if needed. Animate each coset to its own center, then contract the enclosing subgroup regions around the resulting quotient tokens; preserve membership and inclusion throughout. Hover/focus/tap a boundary to highlight its matching region in the other panel. The following standalone SVGs are static layout references, not runtime assets. Rebuild with Konva primitives and computed membership. Colors are illustrative; provide labels and accessible contrast.
Clock reference: N={0,6}; blue=even residues; amber=multiples of 3. After collapse the labels are residues modulo 6.
Before collapse SVG:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 260">
<rect x="8" y="8" width="324" height="244" rx="12" fill="none" stroke="#777"/>
<rect x="20" y="35" width="300" height="101" rx="12" fill="#4686da" fill-opacity=".06" stroke="#4686da"/>
<rect x="30" y="43" width="91" height="190" rx="10" fill="#d99436" fill-opacity=".06" stroke="#d99436"/>
<rect x="39" y="49" width="73" height="85" rx="9" fill="#38a078" fill-opacity=".08" stroke="#38a078" stroke-dasharray="3 3"/>
<circle cx="75.5" cy="71" r="16" fill="#38a078" fill-opacity=".18"/><text x="75.5" y="76" text-anchor="middle" font-size="14" fill="#333">0</text>
<circle cx="75.5" cy="107" r="16" fill="#38a078" fill-opacity=".18"/><text x="75.5" y="112" text-anchor="middle" font-size="14" fill="#333">6</text>
<rect x="138" y="49" width="73" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="174.5" cy="71" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="76" text-anchor="middle" font-size="14" fill="#333">2</text>
<circle cx="174.5" cy="107" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="112" text-anchor="middle" font-size="14" fill="#333">8</text>
<rect x="237" y="49" width="73" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="273.5" cy="71" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="76" text-anchor="middle" font-size="14" fill="#333">4</text>
<circle cx="273.5" cy="107" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="112" text-anchor="middle" font-size="14" fill="#333">10</text>
<rect x="39" y="154" width="73" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="75.5" cy="176" r="16" fill="#888888" fill-opacity=".18"/><text x="75.5" y="181" text-anchor="middle" font-size="14" fill="#333">3</text>
<circle cx="75.5" cy="212" r="16" fill="#888888" fill-opacity=".18"/><text x="75.5" y="217" text-anchor="middle" font-size="14" fill="#333">9</text>
<rect x="138" y="154" width="73" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="174.5" cy="176" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="181" text-anchor="middle" font-size="14" fill="#333">1</text>
<circle cx="174.5" cy="212" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="217" text-anchor="middle" font-size="14" fill="#333">7</text>
<rect x="237" y="154" width="73" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="273.5" cy="176" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="181" text-anchor="middle" font-size="14" fill="#333">5</text>
<circle cx="273.5" cy="212" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="217" text-anchor="middle" font-size="14" fill="#333">11</text>
</svg>
After collapse SVG:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 180">
<rect x="8" y="8" width="324" height="164" rx="12" fill="none" stroke="#777"/>
<rect x="20" y="35" width="300" height="62" rx="12" fill="#4686da" fill-opacity=".06" stroke="#4686da"/>
<rect x="30" y="43" width="91" height="111" rx="10" fill="#d99436" fill-opacity=".06" stroke="#d99436"/>
<circle cx="75.5" cy="72" r="16" fill="#38a078" fill-opacity=".18"/><text x="75.5" y="77" text-anchor="middle" font-size="14" fill="#333">0</text>
<circle cx="174.5" cy="72" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="77" text-anchor="middle" font-size="14" fill="#333">2</text>
<circle cx="273.5" cy="72" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="77" text-anchor="middle" font-size="14" fill="#333">4</text>
<circle cx="75.5" cy="137" r="16" fill="#888888" fill-opacity=".18"/><text x="75.5" y="142" text-anchor="middle" font-size="14" fill="#333">3</text>
<circle cx="174.5" cy="137" r="16" fill="#888888" fill-opacity=".18"/><text x="174.5" y="142" text-anchor="middle" font-size="14" fill="#333">1</text>
<circle cx="273.5" cy="137" r="16" fill="#888888" fill-opacity=".18"/><text x="273.5" y="142" text-anchor="middle" font-size="14" fill="#333">5</text>
</svg>
-->
:::narration[correspondence-clock-intro]
Dividing by a normal subgroup also gives us a way to understand the subgroups of the quotient. Every subgroup of the original group that contains the denominator corresponds to exactly one subgroup of the quotient, and every subgroup of the quotient arises this way.

Choose the number of positions on the clock and then choose the subgroup you want to divide by. Select a subgroup containing it to see its boundary. Click Collapse to identify the elements of each coset. The denominator becomes the identity, and the selected subgroup becomes a subgroup of the quotient.

Select another boundary, or select a subgroup on the quotient side to see its full preimage in the original group. Notice that containment relationships are preserved. This is the correspondence theorem.
:::
::pause

### The correspondence theorem: square symmetries {#correspondence-square}
::scene[square]
<!--
Reuse square bead diagram and quotient collapse. Default N=<r²>={e,r²}, normal in D₄. Four quotient tokens N,rN,sN,rsN, forming the Klein four group. Eligible subgroups are N,<r>,<r²,s>,<r²,rs>,D₄. Draw a branching inclusion diagram with N at bottom, three order-four subgroups in middle, D₄ at top; quotient diagram mirrors it with identity, three order-two subgroups, whole quotient. Selected subgroup boundaries highlight exactly its beads; overlapping incomparable subgroups use separate overlays, not falsely nested circles. Animate each N-coset collapsing into one token, N into identity labeled e or 1. Offer normal subgroup selector including <r> for simpler two-element quotient, and other verified normal subgroups if desired. Recompute quotient and subgroup correspondence from actual group multiplication. Selecting quotient subgroup highlights full preimage; selecting eligible input subgroup highlights its image. Show K↦K/N and L↦π⁻¹(L), where π:G→G/N. Keep controls and math inside Konva; allow expand/replay. Optional group selector links clock and square scenes only if existing navigation supports it. No formal proof required.

Preferred primary visualization: simultaneous overlapping rounded rectangular subgroup regions, rather than a lattice as the primary view. Solid blue and amber boundaries represent two incomparable subgroups, dashed gray boxes represent denominator cosets, green emphasizes the denominator, and the outer frame represents G. Use a branching lattice only as an optional secondary view. Every boundary must enclose exactly its members; use unions of rounded rectilinear regions for other subgroup layouts, with selectable overlays if needed. Animate each coset to its own center, then contract the enclosing subgroup regions around the resulting quotient tokens; preserve membership and inclusion throughout. Hover/focus/tap a boundary to highlight its matching region in the other panel. The following standalone SVGs are static layout references, not runtime assets. Rebuild with Konva primitives and computed membership. Colors are illustrative; provide labels and accessible contrast.
Square reference: N={e,r²}; blue=<r>; amber=<r²,s>. The third intermediate subgroup <r²,rs> requires a composite region or selectable overlay enclosing the first and fourth cosets.
Before collapse SVG:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 260">
<rect x="8" y="8" width="324" height="244" rx="12" fill="none" stroke="#777"/>
<rect x="20" y="35" width="300" height="101" rx="12" fill="#4686da" fill-opacity=".06" stroke="#4686da"/>
<rect x="30" y="43" width="140" height="190" rx="10" fill="#d99436" fill-opacity=".06" stroke="#d99436"/>
<rect x="39" y="49" width="122" height="85" rx="9" fill="#38a078" fill-opacity=".08" stroke="#38a078" stroke-dasharray="3 3"/>
<circle cx="100.0" cy="71" r="16" fill="#38a078" fill-opacity=".18"/><text x="100.0" y="76" text-anchor="middle" font-size="14" fill="#333">e</text>
<circle cx="100.0" cy="107" r="16" fill="#38a078" fill-opacity=".18"/><text x="100.0" y="112" text-anchor="middle" font-size="14" fill="#333">r²</text>
<rect x="189" y="49" width="122" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="250.0" cy="71" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="76" text-anchor="middle" font-size="14" fill="#333">r</text>
<circle cx="250.0" cy="107" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="112" text-anchor="middle" font-size="14" fill="#333">r³</text>
<rect x="39" y="154" width="122" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="100.0" cy="176" r="16" fill="#888888" fill-opacity=".18"/><text x="100.0" y="181" text-anchor="middle" font-size="14" fill="#333">s</text>
<circle cx="100.0" cy="212" r="16" fill="#888888" fill-opacity=".18"/><text x="100.0" y="217" text-anchor="middle" font-size="14" fill="#333">r²s</text>
<rect x="189" y="154" width="122" height="85" rx="9" fill="#888888" fill-opacity=".08" stroke="#888888" stroke-dasharray="3 3"/>
<circle cx="250.0" cy="176" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="181" text-anchor="middle" font-size="14" fill="#333">rs</text>
<circle cx="250.0" cy="212" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="217" text-anchor="middle" font-size="14" fill="#333">r³s</text>
</svg>
After collapse SVG:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 180">
<rect x="8" y="8" width="324" height="164" rx="12" fill="none" stroke="#777"/>
<rect x="20" y="35" width="300" height="62" rx="12" fill="#4686da" fill-opacity=".06" stroke="#4686da"/>
<rect x="30" y="43" width="140" height="111" rx="10" fill="#d99436" fill-opacity=".06" stroke="#d99436"/>
<circle cx="100.0" cy="72" r="16" fill="#38a078" fill-opacity=".18"/><text x="100.0" y="77" text-anchor="middle" font-size="14" fill="#333">N</text>
<circle cx="250.0" cy="72" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="77" text-anchor="middle" font-size="14" fill="#333">rN</text>
<circle cx="100.0" cy="137" r="16" fill="#888888" fill-opacity=".18"/><text x="100.0" y="142" text-anchor="middle" font-size="14" fill="#333">sN</text>
<circle cx="250.0" cy="137" r="16" fill="#888888" fill-opacity=".18"/><text x="250.0" y="142" text-anchor="middle" font-size="14" fill="#333">rsN</text>
</svg>
-->
:::narration[correspondence-square-intro]
Now try the same experiment with the dihedral group. Choose a normal subgroup to divide by. Select a subgroup containing it, and click Collapse to see its corresponding subgroup in the quotient. The normal subgroup itself becomes the identity, which we can label one when using multiplicative notation.

Try selecting subgroups on either side of the diagram. Expand the quotient to see which original elements each boundary represents. Notice that the subgroups need not form a single chain: several different subgroups can contain the same normal subgroup without containing one another.

The correspondence theorem lets us study the subgroups above a normal subgroup by studying the smaller quotient group instead.
:::
::pause
