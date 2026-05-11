---
title: '3D Pythagoras and trigonometry: review and comprehensive worked example'
checks:
  - q: 'A cuboid is $8 \times 6 \times 4$. Its space diagonal is...'
    options: ["$\\sqrt{116}\\approx 10.77$", "$\\sqrt{100}=10$", "$8+6+4=18$", "$\\sqrt{52}\\approx 7.21$"]
    correct: 0
    explain: '$\sqrt{8^{2}+6^{2}+4^{2}} = \sqrt{64+36+16} = \sqrt{116} \approx 10.77$. The $\sqrt{100}=10$ is just the base diagonal.'
  - q: 'For the same cuboid, the angle the space diagonal makes with the base is...'
    options: ["$45°$", "$21.8°$", "$68.2°$", "$33.7°$"]
    correct: 1
    explain: 'Projection on base = base diagonal = $\sqrt{100}=10$. $\tan\theta = 4/10 = 0.4$, so $\theta \approx 21.8°$.'
  - q: 'A square pyramid has base side $10$ and height $12$. The slant edge length is...'
    options: ["$\\sqrt{50+144}=\\sqrt{194}\\approx 13.93$", "$\\sqrt{100+144}\\approx 15.62$", "$\\sqrt{25+144}=13$", "$22$"]
    correct: 0
    explain: 'Horizontal from corner to centre = half diagonal = $\tfrac{10\sqrt{2}}{2} = 5\sqrt{2}$. Slant$^{2} = 50 + 144 = 194$, slant $\approx 13.93$.'
  - q: 'The first step in any 3D Pythagoras / trig problem is...'
    options: ["compute a formula directly", "find the right 2D triangle and draw it flat", "use the cosine rule", "rotate the diagram"]
    correct: 1
    explain: 'Every 3D problem reduces to one or more 2D right triangles. Find them, draw them flat with all sides labelled, then use Pythagoras or sin/cos/tan as normal.'
  - q: 'When the question asks for the angle between a line and a plane, you build a right triangle from...'
    options: ["the line, two random points, and a perpendicular", "the line, its projection onto the plane, and the perpendicular drop", "any three sides of the solid", "the plane''s normal vector"]
    correct: 1
    explain: 'Line = hypotenuse, projection = adjacent (lying in the plane), perpendicular drop = opposite (vertical). $\tan\theta = $ drop / projection.'
---

## What you learned in 6.4

A short walkthrough of the unit:

- Every 3D Pythagoras / trigonometry problem reduces to **one or more 2D right triangles** hidden inside the 3D shape. The skill is spotting them.
- **Cuboid space diagonal**: $d = \sqrt{l^{2}+w^{2}+h^{2}}$. Built by Pythagoras twice, first across the base, then up to the opposite corner.
- **Angle between a line and a plane**: project the line onto the plane, build a right triangle from the line (hyp), the projection (adj), and the perpendicular drop (opp). Use $\tan$.
- **Pyramid slant edge** (apex to a base corner): the horizontal leg is half the base diagonal. Apply Pythagoras with the pyramid's height.
- **Pyramid slant face height** (apex to a base-edge midpoint): the horizontal leg is half the base side. Different right triangle, different answer.

## The decision tree

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 16px 24px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:16px;text-transform:uppercase;text-align:center">3D PROBLEM RECIPE</div>
  <div style="display:flex;flex-direction:column;gap:10px;font-family:'Geist Mono',monospace;font-size:13px">
    <div style="display:flex;align-items:center;justify-content:center;gap:14px"><div style="padding:8px 14px;border:1.5px solid #fff067;border-radius:6px;background:rgba(255,240,103,0.08);color:#fff067;font-weight:700">Find the right 2D triangle inside the 3D shape</div></div>
    <div style="text-align:center;color:#3a4a5a;font-size:14px">↓</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:14px"><div style="padding:8px 14px;border:1.5px solid #fff067;border-radius:6px;background:rgba(255,240,103,0.08);color:#fff067;font-weight:700">Draw it flat on rough paper, label all sides and the known angle</div></div>
    <div style="text-align:center;color:#3a4a5a;font-size:14px">↓</div>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><div style="flex:1;min-width:140px;padding:10px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;text-align:center;line-height:1.3">Want a length?<br/><span style="color:#7a7875;font-weight:500;font-size:11px">Use Pythagoras</span></div><div style="flex:1;min-width:140px;padding:10px;border:1.5px solid #00abfa;border-radius:6px;background:rgba(0,171,250,0.08);color:#00abfa;font-weight:700;text-align:center;line-height:1.3">Want an angle?<br/><span style="color:#7a7875;font-weight:500;font-size:11px">Use SOH-CAH-TOA</span></div></div>
  </div>
</div>

The two old tools cover every 3D problem at this level. The "find the right 2D triangle" step is the one to practise.

## Comprehensive Worked example

A wooden box is a cuboid measuring $AB = 8$ cm, $BC = 6$ cm, and $BF = 5$ cm (where $A$, $B$, $C$, $D$ are the bottom face and $E$, $F$, $G$, $H$ are the top face, with $F$ directly above $B$).

(a) Find the length of the base diagonal $AC$.

(b) Find the length of the space diagonal $AG$ (from a bottom corner to the opposite top corner).

(c) Find the angle that $AG$ makes with the base $ABCD$.

<iframe src="/widgets/3d-step-explorer.html?preset=comprehensive-cuboid" style="width:100%;max-width:696px;height:620px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): base diagonal $AC$.** Plain 2D Pythagoras on the rectangular base:

$$AC^{2} = AB^{2} + BC^{2} = 8^{2} + 6^{2} = 64 + 36 = 100$$

$$AC = 10\;\text{cm}$$

(This is the $(6, 8, 10)$ Pythagorean triple, $(3, 4, 5)$ doubled.)

**[M1 for $AC^{2} = 8^{2}+6^{2}$; A1 for $AC = 10$]**

**Part (b): space diagonal $AG$.** Now use the right triangle in the vertical plane through $A$, $C$, $G$. The base diagonal $AC = 10$ is horizontal, $CG = 5$ is vertical (the height), and $AG$ is the hypotenuse:

$$AG^{2} = AC^{2} + CG^{2} = 10^{2} + 5^{2} = 100 + 25 = 125$$

$$AG = \sqrt{125} = 5\sqrt{5} \approx 11.18\;\text{cm}$$

**[M1 for $AG^{2} = AC^{2} + CG^{2}$ or $\sqrt{l^{2}+w^{2}+h^{2}}$; A1 for $AG \approx 11.18$]**

**Part (c): angle $AG$ makes with the base.** In the same vertical right triangle, the angle at $A$ is the angle between $AG$ (hypotenuse, the space diagonal) and $AC$ (adjacent, the projection onto the base). The opposite side is the vertical height $CG = 5$:

$$\tan\theta = \dfrac{CG}{AC} = \dfrac{5}{10} = 0.5$$

$$\theta = \tan^{-1}(0.5) \approx 26.6°$$

**[M1 for $\tan\theta = 5/10$ (ECF on $AC$); A1 for $\theta \approx 26.6°$]**

Full marks $= 7$.

The marking pattern to notice: each part has a method mark (M1) for setting up the formula or trig equation, plus an accuracy mark (A1) for the value. ECF (error carried forward) means even if your $AC$ in part (a) is slightly off, you still earn the part (c) M1 for setting up $\tan\theta = CG / \text{your AC}$ correctly.

## Common mistakes (across the unit)

- **Skipping the flat sketch.** A 3D diagram is messy. Always re-draw the relevant 2D right triangle on rough paper before substituting numbers.
- **Using the wrong horizontal leg in a pyramid problem.** Slant edge → half-diagonal. Slant face → half-side. Different.
- **Confusing the space diagonal with the base diagonal** in cuboid problems. The space diagonal is longer; it includes the height.
- **Plugging the line itself into the wrong slot** when finding line-plane angle. The line is the HYPOTENUSE. The projection (its shadow) is adjacent. The vertical drop is opposite.
- **Calculator in radians.** Same problem as in 2D. DEG mode for Cambridge.
- **Premature rounding.** Keep $\sqrt{52}$ or $3\sqrt{2}$ as exact forms through the working; only round at the end.

## Where this goes next

Trigonometry, Pythagoras, and 3D problem-solving are the bread and butter of Cambridge paper 2. Combined with the 2D right-triangle and non-right-triangle tools from earlier in this unit, you now have a complete toolkit for any triangle-based question.

Beyond this unit, 3D problem-solving shows up in Unit 7 (vectors in 3D, briefly) and in any cross-section / cone-frustum problem you've already seen in Unit 5. The "find the right 2D triangle" reflex is permanently useful.
