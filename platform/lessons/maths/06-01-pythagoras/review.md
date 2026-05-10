---
title: 'Pythagoras: review and comprehensive worked example'
checks:
  - q: 'A right triangle has hypotenuse $20$ cm and one leg $12$ cm. The other leg is...'
    options: ["$16$ cm", "$8$ cm", "$\\sqrt{544}$ cm", "$32$ cm"]
    correct: 0
    explain: '$a^{2} = 400 - 144 = 256$, $a = 16$ cm. This is the $(12, 16, 20)$ triple, $(3, 4, 5)$ scaled by $4$.'
  - q: 'A rectangular field is $30$ m by $40$ m. Its diagonal is...'
    options: ["$50$ m", "$70$ m", "$35$ m", "$\\sqrt{2500}$ m which is the same as $50$"]
    correct: 3
    explain: '$d^{2} = 30^{2} + 40^{2} = 2500$, $d = 50$ m. Both 1 and 4 say the same thing.'
  - q: 'Without using a calculator: an equilateral triangle of side $4$ cm has altitude...'
    options: ["$2\\sqrt{3}$ cm", "$2\\sqrt{2}$ cm", "$4$ cm", "$\\sqrt{12}$ cm and $2\\sqrt{3}$ cm both equal"]
    correct: 3
    explain: 'Drop perpendicular: half-base $= 2$, slant $= 4$. $h^{2} = 16 - 4 = 12$, $h = \sqrt{12} = 2\sqrt{3}$. Options 1 and 4 are equal.'
  - q: 'A triangle has sides $7, 24, 25$. Is it right-angled?'
    options: ["No", "Yes, with hypotenuse $25$", "Yes, with hypotenuse $24$", "Cannot tell without more info"]
    correct: 1
    explain: 'Check: $7^{2} + 24^{2} = 49 + 576 = 625 = 25^{2}$. ✓ Right-angled with hypotenuse $25$. The largest side, when squared, equals the sum of the other two squared.'
  - q: 'A point is at $(-1, 2)$ and another at $(2, 6)$. Distance between them is...'
    options: ["$5$", "$7$", "$\\sqrt{13}$", "$\\sqrt{17}$"]
    correct: 0
    explain: '$\Delta x = 3, \Delta y = 4$. Distance $= \sqrt{9 + 16} = 5$.'
---

## What you learned in 6.1

A short walkthrough of the unit. Each part built on the last:

- **[p1](p1)** introduced the theorem visually with three squares on the sides of a right triangle. The blue square plus orange square always equals the pink square, no matter how the triangle is shaped, as long as one angle stays at $90°$.
- **[p2](p2)** locked in the routine for finding the hypotenuse: $c = \sqrt{a^{2} + b^{2}}$. Four steps: write, substitute, square and add, square root.
- **[p3](p3)** showed the leg-finding case: $a = \sqrt{c^{2} - b^{2}}$. The sign flip from add to subtract is where students lose marks.
- **[p4](p4)** put Pythagoras into context. Real Cambridge questions hide the right triangle inside a rectangle, isosceles, ladder, or coordinate grid. Spot it, draw it, label it, then apply.

## The three forms of Pythagoras at a glance

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:8px;text-transform:uppercase">PYTHAGORAS · ALL FORMS</div>
  <div style="display:flex;flex-direction:column;gap:6px">
    <div>· theorem: \({\color{#00abfa}a^{2}} + {\color{#ff822c}b^{2}} = {\color{#ff4670}c^{2}}\), only for right triangles.</div>
    <div>· find hypotenuse: \({\color{#ff4670}c} = \sqrt{{\color{#00abfa}a^{2}} + {\color{#ff822c}b^{2}}}\).</div>
    <div>· find a leg: \({\color{#00abfa}a} = \sqrt{{\color{#ff4670}c^{2}} - {\color{#ff822c}b^{2}}}\).</div>
    <div>· test for right angle: largest side squared = sum of other two squared.</div>
    <div>· distance formula: \(AB = \sqrt{(\Delta x)^{2} + (\Delta y)^{2}}\) (Pythagoras on coordinates).</div>
  </div>
</div>

## Pythagorean triples to know on sight

| Triple | Useful multiples |
|---|---|
| $(3, 4, 5)$ | $(6, 8, 10)$, $(9, 12, 15)$, $(15, 20, 25)$ |
| $(5, 12, 13)$ | $(10, 24, 26)$ |
| $(8, 15, 17)$ | $(16, 30, 34)$ |
| $(7, 24, 25)$ | $(14, 48, 50)$ |
| $(9, 40, 41)$ | less common, occasionally appears |

If two sides of your triangle match a triple's pattern, the third side will too. Always verify with the formula though: similarity, not certainty.

## Comprehensive Worked example

A vertical pole stands at point $P$ on horizontal ground. A wire runs from the top of the pole $T$ to a point $A$ on the ground, and another wire from $T$ to a point $B$ on the ground. $PA = 9$ m, $PB = 12$ m, and $A$, $P$, $B$ lie in a straight line with $P$ between $A$ and $B$. The wire $TA$ is $15$ m long.

(a) Find the height of the pole.

(b) Find the length of wire $TB$.

(c) Find the length $AB$.

<iframe src="/widgets/pythagoras-step-explorer.html?preset=pole-with-wires" style="width:100%;max-width:696px;height:580px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

---

**Part (a)**: We have a right triangle $TPA$ with the right angle at $P$ (the pole is vertical, the ground is horizontal). The wire $TA = 15$ is the hypotenuse, $PA = 9$ is one leg, and the height $TP$ is the other leg.

$$TP^{2} + 9^{2} = 15^{2}$$

$$TP^{2} = 225 - 81 = 144$$

$$TP = 12\;\text{m}$$

(M1 for $TP^{2} + 9^{2} = 15^{2}$; A1 for $TP = 12$ m.)

---

**Part (b)**: Now use the right triangle $TPB$, with the right angle at $P$. We know $TP = 12$ from part (a), and $PB = 12$.

$$TB^{2} = TP^{2} + PB^{2} = 12^{2} + 12^{2} = 144 + 144 = 288$$

$$TB = \sqrt{288} = 12\sqrt{2} \approx 16.97\;\text{m}$$

In surd form, $TB = 12\sqrt{2}$ m. As a decimal, $TB \approx 16.97$ m.

(M1 for $TB^{2} = 12^{2} + 12^{2}$ (ECF on $TP$ from part (a)); A1 for $TB = 12\sqrt{2}$ m or $16.97$ m.)

---

**Part (c)**: $A$, $P$, $B$ are collinear, with $P$ between $A$ and $B$, so $AB = AP + PB = 9 + 12 = 21$ m.

(B1 for $AB = 21$ m.)

---

Full marks $= 5$.

The marking sequence to notice: each part reuses an answer from the previous one. **ECF (error carried forward)** means even if your $TP$ in part (a) is wrong, you can still earn the M1 in (b) for using YOUR value correctly. So always show the formula step, even if you are unsure of an earlier number.

## Common mistakes (across the unit)

- **Pythagoras on a non-right triangle.** It only works when there is a $90°$ angle. For other triangles, use the sine or cosine rule (covered in [Unit 6.3](../06-03-non-right-triangles/p1)).
- **Adding when subtracting**, or vice versa. Always identify the hypotenuse first.
- **Premature rounding.** Keep the calculator value full to the final step.
- **Missing the hidden right triangle.** Train your eye to spot rectangles, isosceles altitudes, walls, and coordinate grids.
- **Forgetting units.** A length needs cm, m, km. An area needs cm², m². Match the units in the question.

## Where Pythagoras goes next

Pythagoras is the foundation of [Unit 6.2](../06-02-right-angled-triangles/p1) (sin, cos, tan), where you will need it whenever a right triangle is missing one side AND one angle. It is also the spine of [Unit 6.4](../06-04-3d-trigonometry/p1) (3D problems), where space diagonals and slant heights are found by applying Pythagoras twice.

Hold this unit's recipe steady, and the rest of trigonometry rests on solid ground.
