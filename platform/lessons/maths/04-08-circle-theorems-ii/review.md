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

## Visual recap

The chord-distance relationship and the perpendicular bisector both come from circle symmetry.

<div class="diagram">
<div class="diagram-caption">RECAP: EQUAL CHORDS + PERPENDICULAR FROM CENTRE</div>
<svg viewBox="0 0 500 220" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;max-width:520px;height:auto" xmlns="http://www.w3.org/2000/svg">
<circle cx="120" cy="110" r="80" fill="none" stroke="#3a4a5a" stroke-width="1.5"/>
<line x1="60" y1="70" x2="180" y2="70" stroke="#00abfa" stroke-width="2"/>
<line x1="60" y1="150" x2="180" y2="150" stroke="#00abfa" stroke-width="2"/>
<line x1="120" y1="110" x2="120" y2="70" stroke="#00abfa" stroke-width="1.5" stroke-dasharray="4 3"/>
<line x1="120" y1="110" x2="120" y2="150" stroke="#00abfa" stroke-width="1.5" stroke-dasharray="4 3"/>
<line x1="116" y1="62" x2="122" y2="74" stroke="#0fee89" stroke-width="2"/>
<line x1="122" y1="62" x2="128" y2="74" stroke="#0fee89" stroke-width="2"/>
<line x1="116" y1="142" x2="122" y2="154" stroke="#0fee89" stroke-width="2"/>
<line x1="122" y1="142" x2="128" y2="154" stroke="#0fee89" stroke-width="2"/>
<circle cx="120" cy="110" r="3" fill="#7a7875"/>
<text x="126" y="106" font-family="Geist Mono,monospace" font-size="11" fill="#7a7875">O</text>
<circle cx="370" cy="110" r="80" fill="none" stroke="#3a4a5a" stroke-width="1.5"/>
<line x1="290" y1="170" x2="450" y2="170" stroke="#00abfa" stroke-width="2"/>
<line x1="370" y1="110" x2="370" y2="170" stroke="#00abfa" stroke-width="2"/>
<polyline points="358,158 358,170 370,170" fill="none" stroke="#ff4670" stroke-width="1.5"/>
<line x1="328" y1="162" x2="334" y2="174" stroke="#0fee89" stroke-width="2"/>
<line x1="334" y1="162" x2="340" y2="174" stroke="#0fee89" stroke-width="2"/>
<line x1="406" y1="162" x2="412" y2="174" stroke="#0fee89" stroke-width="2"/>
<line x1="412" y1="162" x2="418" y2="174" stroke="#0fee89" stroke-width="2"/>
<circle cx="370" cy="110" r="3" fill="#7a7875"/>
<circle cx="370" cy="170" r="4" fill="#fff067"/>
<text x="376" y="106" font-family="Geist Mono,monospace" font-size="11" fill="#7a7875">O</text>
<text x="376" y="186" font-family="Geist Mono,monospace" font-size="11" fill="#fff067">M</text>
</svg>
</div>

The two-tangent picture: two right angles, two equal tangent lengths, kite shape with $OP$ as axis of symmetry.

<div class="diagram">
<div class="diagram-caption">RECAP: TWO TANGENTS, TWO RIGHT ANGLES, KITE</div>
<svg viewBox="0 0 460 240" preserveAspectRatio="xMidYMid meet" style="display:block;width:100%;max-width:520px;height:auto" xmlns="http://www.w3.org/2000/svg">
<circle cx="120" cy="120" r="70" fill="none" stroke="#3a4a5a" stroke-width="1.5"/>
<line x1="120" y1="120" x2="170" y2="70" stroke="#00abfa" stroke-width="2"/>
<line x1="120" y1="120" x2="170" y2="170" stroke="#00abfa" stroke-width="2"/>
<line x1="170" y1="70" x2="410" y2="120" stroke="#ff822c" stroke-width="2.5"/>
<line x1="170" y1="170" x2="410" y2="120" stroke="#ff822c" stroke-width="2.5"/>
<line x1="120" y1="120" x2="410" y2="120" stroke="#fff067" stroke-width="2" stroke-dasharray="6 4"/>
<polyline points="163,77 170,84 177,77" fill="none" stroke="#ff4670" stroke-width="1.5"/>
<polyline points="163,163 170,156 177,163" fill="none" stroke="#ff4670" stroke-width="1.5"/>
<line x1="284" y1="86" x2="290" y2="98" stroke="#0fee89" stroke-width="2"/>
<line x1="290" y1="86" x2="296" y2="98" stroke="#0fee89" stroke-width="2"/>
<line x1="284" y1="142" x2="290" y2="154" stroke="#0fee89" stroke-width="2"/>
<line x1="290" y1="142" x2="296" y2="154" stroke="#0fee89" stroke-width="2"/>
<circle cx="120" cy="120" r="3" fill="#7a7875"/>
<circle cx="170" cy="70" r="4" fill="#fff067"/>
<circle cx="170" cy="170" r="4" fill="#fff067"/>
<circle cx="410" cy="120" r="4" fill="#fff067"/>
<text x="104" y="124" font-family="Geist Mono,monospace" font-size="13" fill="#7a7875">O</text>
<text x="176" y="64" font-family="Geist Mono,monospace" font-size="14" fill="#fff067">A</text>
<text x="176" y="184" font-family="Geist Mono,monospace" font-size="14" fill="#fff067">B</text>
<text x="418" y="124" font-family="Geist Mono,monospace" font-size="14" fill="#fff067">P</text>
</svg>
</div>

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

**Step a: Coordinates of the centre.** Build the perpendicular bisector of two chords and intersect them.

$AB$ is horizontal: midpoint $\left(\tfrac{2+8}{2}, \tfrac{1+1}{2}\right) = (5, 1)$. Its perpendicular bisector is vertical: $x = 5$.

$BC$ is vertical: midpoint $\left(\tfrac{8+8}{2}, \tfrac{1+9}{2}\right) = (8, 5)$. Its perpendicular bisector is horizontal: $y = 5$.

The two bisectors meet at $\boxed{O = (5, 5)}$. **[M1 for midpoint of $AB$; M1 for midpoint of $BC$; A1 for the centre]**

**Step b: Radius.** Distance from $O(5, 5)$ to $A(2, 1)$:

$$r = \sqrt{(5-2)^2 + (5-1)^2} = \sqrt{9 + 16} = \sqrt{25} = \boxed{5}$$

**[M1 for the distance formula; A1 for $5$]**

**Step c: Length $OP$.** Tangent ⟂ radius at the contact point $T$, so $\triangle OTP$ is right-angled at $T$ with legs $OT = r = 5$ and $TP = 12$:

$$OP^2 = 5^2 + 12^2 = 169 \;\Rightarrow\; OP = \boxed{13}$$

**[M1 for the right-triangle setup; A1 for $13$]**

Full marks $= 7$.

## Quick reference

- Equal chords $\Leftrightarrow$ equidistant from centre.
- Perpendicular bisector of a chord passes through the centre.
- $r^2 = d^2 + (\text{half-chord})^2$, where $d$ is the distance from the centre to the chord.
- Tangents from an external point are equal: $PA = PB$.
- Tangent perpendicular to radius at the contact point.
- $OP$ bisects angle $APB$ (the angle between the two tangents).

When you see three points on a circle, head straight for **midpoints + perpendicular gradients**. When you see two tangents from a single external point, head straight for **two right triangles sharing hypotenuse $OP$**.
