---
title: 'Review and practice'
checks:
  - q: 'An L-shape is a $12 \times 8$ rectangle with a $5 \times 3$ corner cut out. Its area is...'
    options: ["$96$ cm²", "$81$ cm²", "$111$ cm²", "$87$ cm²"]
    correct: 1
    explain: '$12 \times 8 - 5 \times 3 = 96 - 15 = 81$ cm².'
  - q: 'A semicircle of radius $6$ has perimeter...'
    options: ["$6\\pi$ cm", "$6\\pi + 12$ cm", "$12\\pi$ cm", "$6\\pi + 6$ cm"]
    correct: 1
    explain: 'Arc $= 6\pi$ + diameter $= 12$. Total $= 6\pi + 12$ cm. Forgetting the diameter is the classic slip.'
  - q: 'A "running track" shape has a $30 \times 20$ rectangle with a semicircle on each short side (radius $10$). Total area, in terms of π, is...'
    options: ["$600$ cm²", "$600 + 100\\pi$ cm²", "$600 + 50\\pi$ cm²", "$600 + 200\\pi$ cm²"]
    correct: 1
    explain: 'Rectangle $= 600$. Two semicircles $=$ one circle $= \pi(10)^2 = 100\pi$. Total $= 600 + 100\pi$ cm².'
  - q: 'A hemisphere + cone composite (same radius $r$, cone slant $l$). Total SA is...'
    options: ["$3\\pi r^2 + \\pi r l$", "$2\\pi r^2 + \\pi r l$", "$2\\pi r^2 + \\pi r l + \\pi r^2$", "$4\\pi r^2$"]
    correct: 1
    explain: 'Curved hemisphere ($2\pi r^2$) + curved cone ($\pi r l$). The hemisphere''s flat side and cone''s base are joined: they cancel.'
  - q: 'A frustum is formed by removing the top $14$ of a cone of height $21$ and radius $9$. The small cone removed has radius...'
    options: ["$9$", "$6$", "$5$", "$3$"]
    correct: 1
    explain: 'Similar triangles: small radius $= \frac{14}{21} \times 9 = 6$.'
  - q: 'For the same frustum (large $r=9, h=21$, small $r=6, h=14$), the volume is...'
    options: ["$399\\pi$ cm³", "$567\\pi$ cm³", "$168\\pi$ cm³", "$735\\pi$ cm³"]
    correct: 0
    explain: '$\tfrac{1}{3}\pi(81)(21) - \tfrac{1}{3}\pi(36)(14) = 567\pi - 168\pi = 399\pi$ cm³.'
  - q: 'A cuboid $10 \times 8 \times 6$ with a cylindrical hole of radius $2$ drilled through (along the $6$ side). Its volume is...'
    options: ["$480\\pi$ cm³", "$480 + 24\\pi$ cm³", "$480 - 24\\pi$ cm³", "$480 - 4\\pi$ cm³"]
    correct: 2
    explain: 'Cuboid $= 480$. Hole $= \pi(2)^2(6) = 24\pi$. Subtract.'
  - q: 'For a drilled solid, drilling a hole...'
    options: ["always reduces SA", "always increases SA", "depends on whether the inner wall is bigger than the two end-circles removed", "leaves SA unchanged"]
    correct: 2
    explain: 'The two end-circles are REMOVED ($2\pi r^2$); the inner cylindrical wall is ADDED ($2\pi r h$). For a hole that goes all the way through and is reasonably long, the wall is BIGGER than the two circles, so SA increases.'
  - q: 'For 2D compound shapes, the "trace the outline" rule means...'
    options: ["sum every edge of every part shape", "include only the outside boundary; internal joins do not count", "double-count the joins", "use the bounding rectangle"]
    correct: 1
    explain: 'Perimeter is the outside boundary only. Internal join lines between parts are inside the shape, not on the boundary.'
---

## What you should know by now

If you've worked through P1 to P4 you can:

- Find area and perimeter of a 2D compound shape by splitting or subtracting.
- Trace an outline carefully, distinguishing outline edges from internal joins.
- Compute area and perimeter of semicircles, quadrants, sectors, and segments.
- Add the volumes and carefully count surface areas of joined 3D solids.
- Use similar triangles to find missing dimensions on a frustum, then subtract.
- Handle drilled / hollow solids by subtracting volumes and adjusting surface areas.

## All formulas at a glance

<div class="diagram">
<div class="diagram-caption">COMPOUND SHAPES · REFERENCE</div>
<div style="font-size:14px;line-height:1.85;padding:14px 18px">

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#00abfa;font-weight:700">2D COMPOUND</span> &nbsp;
\({\color{#00abfa}A_\text{total} = \text{(sum of parts)}}\) &nbsp;or&nbsp; \({\color{#00abfa}A_\text{big} - A_\text{cut}}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">split or subtract · perimeter = outside outline only</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#fff067;font-weight:700">SEMICIRCLE</span> &nbsp;
\({\color{#fff067}A = \tfrac{1}{2}\pi r^{2}}\) &nbsp;·&nbsp;
\({\color{#fff067}P = \pi r + 2r}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">perimeter = arc + diameter (don't forget the diameter)</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#ff822c;font-weight:700">QUADRANT</span> &nbsp;
\({\color{#ff822c}A = \tfrac{1}{4}\pi r^{2}}\) &nbsp;·&nbsp;
\({\color{#ff822c}P = \tfrac{\pi r}{2} + 2r}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">arc + two radii</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#ff4670;font-weight:700">SEGMENT</span> &nbsp;
\({\color{#ff4670}A = \text{sector} - \text{triangle}}\)
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">the area between a chord and the arc</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#0fee89;font-weight:700">3D COMPOUND</span> &nbsp;
\({\color{#0fee89}V = \text{(sum of parts)}}\) · SA = sum of EXPOSED faces
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">faces at the join cancel · count carefully</div>
</div>

<div style="margin-bottom:10px"><span style="font-family:var(--font-geist-mono),monospace;color:#00abfa;font-weight:700">FRUSTUM</span> &nbsp;
\({\color{#00abfa}V = V_\text{large} - V_\text{small}}\) · SA includes annular ring
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">small cone radius from similar triangles: \(r = R \times \tfrac{h_\text{small}}{H_\text{large}}\)</div>
</div>

<div><span style="font-family:var(--font-geist-mono),monospace;color:#ff822c;font-weight:700">DRILLED / HOLLOW</span> &nbsp;
\({\color{#ff822c}V = V_\text{block} - V_\text{hole}}\) · SA: remove old face, add inner wall
<div style="font-family:var(--font-geist-mono),monospace;font-size:11px;color:#7a7875;margin-top:2px">drilling a hole usually INCREASES surface area</div>
</div>

</div>
</div>

## Marking patterns at a glance

For a typical 2D compound area question:

- **M1** for the split or subtract structure (e.g., $10 \times 8 - 5 \times 3$).
- **A1** for the value with the correct unit.

For a 2D compound perimeter:

- **M1** for tracing the outline correctly.
- **A1** for the sum.

For a 3D composite SA:

- **M1** for identifying exposed faces (often this is the make-or-break mark).
- **M1** for each formula (curved cone, curved cylinder, etc.).
- **A1** for the value, in terms of π or as a decimal.

For a frustum:

- **M1** for similar triangles to find the small dimensions.
- **M1** for the large volume / SA.
- **M1** for the small volume / SA to subtract.
- **A1** for the final answer with units.

The single most expensive slip across this unit: **forgetting that internal join lines aren't part of the outline (2D)** or **forgetting that the join faces cancel (3D)**. Both come from the same idea: only the outside counts.

## Comprehensive worked example

A solid is formed by joining a hemisphere to the bottom of a cylinder, then drilling a small cylindrical hole all the way through the centre of the cylinder (the hole stops at the hemisphere's flat side; it doesn't go into the dome).

Outer cylinder: radius $5$ cm, height $8$ cm.
Hemisphere: radius $5$ cm (matches the cylinder).
Drilled hole: radius $1$ cm, height $8$ cm (the full cylinder length).

(a) Find the volume of the solid, in terms of π.
(b) Find the total surface area, in terms of π.

**Step a: total volume.**

$$V = V_\text{cyl} + V_\text{hemi} - V_\text{hole}$$

$$= \pi(5)^2(8) + \tfrac{2}{3}\pi(5)^3 - \pi(1)^2(8)$$

$$= 200\pi + \tfrac{250}{3}\pi - 8\pi$$

$$= \tfrac{600\pi + 250\pi - 24\pi}{3} = \tfrac{826\pi}{3}\;\text{cm}^3$$

$$\approx \boxed{275.3\pi}\;\text{cm}^3 \;\;\text{(decimal coefficient)}$$

**[M1 for cylinder; M1 for hemisphere; M1 for hole; A1 for value]**

**Step b: surface area.** The hole goes through the cylinder ($8$ cm) but stops at the hemisphere's flat side. Walk through every exposed face:

- Cylinder curved (exposed): $2\pi(5)(8) = 80\pi$.
- Cylinder top (with the hole's circle removed): $\pi(5)^2 - \pi(1)^2 = 24\pi$.
- Cylinder bottom: glued to the hemisphere's flat side; cancels with it.
- Hemisphere curved (exposed): $2\pi(5)^2 = 50\pi$.
- Inner wall of the drilled hole: $2\pi(1)(8) = 16\pi$.
- Hole bottom (the small disc on the hemisphere's flat side, now exposed inside the well): $\pi(1)^2 = \pi$.

$$\text{SA} = 80\pi + 24\pi + 50\pi + 16\pi + \pi = \boxed{171\pi}\;\text{cm}^2$$

**[M3 for the four exposed-face terms; M1 for the hole-bottom disc; A1 for $171\pi$]**

Full marks $= 9$.

(Three for volume, six for surface area.)

The lesson: when a feature crosses an internal join, walk through every face slowly. Drawing a cross-section helps.

## Practice

The trainer at the bottom of this page mixes problems from all four sub-units: 2D compound area, 2D perimeter (with curves), 3D composite, frustum, drilled solid. Pick one topic for focused drill or "mixed" to practise the recognition step.

## Quick reference (memorise these)

- 2D compound area = sum of parts (or big − cut)
- 2D compound perimeter = trace the outside ONLY
- Semicircle perimeter = $\pi r + 2r$ (arc + diameter)
- Quadrant perimeter = $\tfrac{\pi r}{2} + 2r$ (arc + two radii)
- Composite 3D volume = sum (no cancellation)
- Composite 3D SA = sum of EXPOSED faces (joined faces cancel)
- Frustum volume = $V_\text{large} - V_\text{small}$ via similar triangles
- Drilled SA = original SA − removed end faces + inner wall

The whole unit collapses to **decompose, then add or subtract**. The simple-shape formulas from 5.2 and 5.4 do all the heavy lifting. The skill is the bookkeeping.
