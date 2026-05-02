---
title: 'Review and practice'
checks:
  - q: 'Two chords in a circle are each $14$ cm long. Their distances from the centre are...'
    options: ["unequal in general", "equal", "always $7$ cm", "always equal to the radius"]
    correct: 1
    explain: 'Equal chords are equidistant from the centre.'
  - q: 'A chord is $16$ cm long and the circle has radius $10$ cm. The perpendicular distance from the centre to the chord is...'
    options: ["$3$ cm", "$6$ cm", "$8$ cm", "$12$ cm"]
    correct: 1
    explain: 'Half-chord $= 8$. $r^2 = d^2 + 8^2 \Rightarrow 100 = d^2 + 64 \Rightarrow d = 6$ cm.'
  - q: 'The perpendicular bisector of a chord passes through which point?'
    options: ["the chord midpoint only", "the centre of the circle", "a tangent contact point", "any external point"]
    correct: 1
    explain: 'It passes through the centre. This is the basis for finding the centre from three points.'
  - q: 'Tangents $PA$ and $PB$ from $P$ to a circle have $PA = 11$ cm. What is $PB$?'
    options: ["$5.5$ cm", "$11$ cm", "$22$ cm", "Cannot tell"]
    correct: 1
    explain: 'Tangents from external point are equal: $PB = 11$ cm.'
  - q: 'Tangents from $P$ touch a circle at $A$ and $B$ with centre $O$. Triangle $OAP$ has the right angle at...'
    options: ["$P$", "$A$", "$O$", "the midpoint of $AP$"]
    correct: 1
    explain: 'Tangent perpendicular to radius at the point of contact - so the right angle is at $A$.'
  - q: 'Tangents from $P$ to a circle make angle $APB = 70°$. The line $OP$ bisects this angle, giving angle $OPA = $...'
    options: ["$20°$", "$35°$", "$70°$", "$110°$"]
    correct: 1
    explain: 'Bisected: $70 \div 2 = 35°$.'
  - q: 'In tangents-from-external-point setup, triangle $PAB$ is...'
    options: ["scalene", "right-angled", "isosceles", "equilateral always"]
    correct: 2
    explain: '$PA = PB$, so $PAB$ is isosceles. Equilateral only when angle $APB = 60°$.'
  - q: 'You are asked to find the centre of a circle from three points $A$, $B$, $C$ on it. The minimum work is to draw...'
    options: ["one tangent", "one perpendicular bisector", "two perpendicular bisectors", "three angle bisectors"]
    correct: 2
    explain: 'Two perpendicular bisectors meet at the centre. A third is a useful check but not strictly needed.'
---

## What you should know by now

If you have worked through P1 and P2 you can:

- Use "equal chords are equidistant from the centre" both directions.
- Drop a perpendicular from the centre to a chord and apply Pythagoras with the half-chord.
- Find the centre of a circle given three points on it (intersect two perpendicular bisectors).
- Use "tangents from an external point are equal" to mark $PA = PB$.
- Spot the two right-angled triangles $OAP$ and $OBP$ inside a two-tangent diagram.
- Use the bisecting property of $OP$ to find angles inside the kite-shaped configuration.

## Marking patterns at a glance

For chord-distance Pythagoras questions:

- **M1** for setting up the right triangle with half-chord, distance, and radius.
- **A1** for the correct value.

For "find the centre" questions:

- **M1** for finding the midpoint of a chord.
- **M1** for finding the perpendicular gradient.
- **A1** for the equation of one perpendicular bisector (and again for the second).
- **A1** for solving the two equations to give the centre coordinates.

For tangent length questions:

- **B1** for stating $PA = PB$ (with reason "tangents from external point are equal").
- **M1**, **A1** for any further trigonometry inside one of the right triangles $OAP$ or $OBP$.

## Comprehensive worked example

The points $A(2, 1)$, $B(8, 1)$, $C(8, 9)$ all lie on a circle.

(a) Find the coordinates of the centre $O$ of the circle.

(b) Find the radius.

(c) From an external point $P$, the tangent length to this circle is $12$ cm. Find $OP$.

**Step 1 (a): perpendicular bisector of $AB$.**

$A$ and $B$ have the same $y$-coordinate, so $AB$ is horizontal. Midpoint of $AB$:

$$M_{AB} = \left(\dfrac{2+8}{2}, \dfrac{1+1}{2}\right) = (5, 1)$$

The perpendicular bisector of a horizontal chord is vertical, so it has equation $x = 5$.

**Step 2 (a): perpendicular bisector of $BC$.**

$B$ and $C$ have the same $x$-coordinate, so $BC$ is vertical. Midpoint:

$$M_{BC} = \left(\dfrac{8+8}{2}, \dfrac{1+9}{2}\right) = (8, 5)$$

The perpendicular bisector of a vertical chord is horizontal, so it has equation $y = 5$.

**Step 3 (a): intersect the two bisectors.**

The two bisectors meet at $(5, 5)$. So the centre is $O = (5, 5)$.

**Step 4 (b): radius from centre to any of the three points.**

Use $A(2, 1)$ and $O(5, 5)$:

$$r = \sqrt{(5-2)^2 + (5-1)^2} = \sqrt{9 + 16} = \sqrt{25} = 5$$

So radius $= 5$ units.

**Step 5 (c): right triangle $OTP$ with $OT = r$ and $TP = 12$.**

$T$ is the contact point of the tangent. The tangent is perpendicular to the radius at $T$, so triangle $OTP$ is right-angled at $T$.

$$OP^2 = OT^2 + TP^2 = 5^2 + 12^2 = 25 + 144 = 169$$

$$OP = 13$$

**Answer:**

(a) Centre $O = (5, 5)$ (intersection of perpendicular bisectors of two chords). **[M1 midpoint of $AB$; M1 midpoint of $BC$; A1 centre coordinates]**

(b) Radius $= 5$. **[M1 distance formula; A1 value]**

(c) $OP = 13$ (Pythagoras with tangent perpendicular to radius). **[M1 right-triangle setup; A1 value]**

Full marks $= 7$.

## Quick reference

- Equal chords $\Leftrightarrow$ equidistant from centre.
- Perpendicular bisector of a chord passes through the centre.
- $r^2 = d^2 + (\text{half-chord})^2$, where $d$ is the distance from the centre to the chord.
- Tangents from an external point are equal: $PA = PB$.
- Tangent perpendicular to radius at the contact point.
- $OP$ bisects angle $APB$ (the angle between the two tangents).

When you see three points on a circle, head straight for **midpoints + perpendicular gradients**. When you see two tangents from a single external point, head straight for **two right triangles sharing hypotenuse $OP$**.

## Your turn: full quiz

The widget below is a mixed quiz pulling from both parts of 4.8. It also includes a few questions that combine 4.7 and 4.8 - that is what real exam questions do.

<iframe src="/widgets/geometry-trainer.html?topic=circles" style="width:100%;max-width:696px;height:540px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>
