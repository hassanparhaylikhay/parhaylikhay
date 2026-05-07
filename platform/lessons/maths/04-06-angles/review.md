---
title: Review & practice
checks:
  - q: 'In the diagram, $AB \parallel CD$ and a transversal cuts both. The angle on $AB$ above the transversal on the left is $115°$. The alternate angle on $CD$ is...'
    options: ["$65°$", "$75°$", "$115°$", "$245°$"]
    correct: 2
    explain: 'Alternate angles are equal when lines are parallel. So $115°$.'
  - q: 'A regular polygon has each exterior angle $40°$. The number of sides is...'
    options: ["$8$", "$9$", "$10$", "$12$"]
    correct: 1
    explain: '$n = \dfrac{360}{40} = 9$.'
  - q: 'In triangle $PQR$, $PQ = PR$ and angle $QPR = 50°$. Find angle $PQR$.'
    options: ["$50°$", "$65°$", "$75°$", "$130°$"]
    correct: 1
    explain: 'Isosceles triangle: base angles equal. Sum $= 180°$, so $2 \times \text{angle } PQR = 180 - 50 = 130°$, giving angle $PQR = 65°$.'
  - q: 'Three angles meet at a point: $x$, $2x$, and $3x$. Find $x$.'
    options: ["$30°$", "$45°$", "$60°$", "$90°$"]
    correct: 2
    explain: 'Angles at a point sum to $360°$. So $6x = 360°$, giving $x = 60°$.'
  - q: 'Each interior angle of a regular polygon is $150°$. The number of sides is...'
    options: ["$8$", "$10$", "$12$", "$15$"]
    correct: 2
    explain: 'Exterior angle $= 180 - 150 = 30°$. So $n = \dfrac{360}{30} = 12$.'
  - q: 'Two parallel lines cut by a transversal. Co-interior angles are $(2x + 10)°$ and $(3x + 30)°$. Find $x$.'
    options: ["$28$", "$30$", "$32$", "$48$"]
    correct: 0
    explain: 'Co-interior angles sum to $180°$: $2x + 10 + 3x + 30 = 180$, so $5x = 140$, $x = 28$.'
  - q: 'For a Cambridge "give a reason" mark, which is BEST?'
    options: ["F-angles", "the lines are parallel", "corresponding angles, parallel lines", "they look the same"]
    correct: 2
    explain: 'Cambridge wants the rule named in full: "corresponding angles" plus the parallel-line condition. "F-angles" is informal and the others are too vague.'
---

## What you should know by now

If you've worked through P1 to P3 you can:

- Use the **basic angle rules**: angles at a point ($360°$), angles on a straight line ($180°$), vertically opposite angles equal, angles in a triangle ($180°$), angles in a quadrilateral ($360°$).
- Apply the **parallel-line rules**: corresponding angles equal, alternate angles equal, co-interior angles sum to $180°$.
- Use the **polygon formulas**: interior sum $(n - 2) \times 180°$, regular interior $\dfrac{(n - 2) \times 180°}{n}$, regular exterior $\dfrac{360°}{n}$, exterior sum $= 360°$.
- Use **three-letter notation** (vertex letter in the middle) for any angle you name.
- Quote the rule **by full name** when giving a reason: "co-interior angles sum to $180°$", not "co-interior" alone.

## Recap: the parallel-line trio

Three rules, one transversal. Drag either line and the three relationships update live. Use the dropdown to focus on one rule at a time.

<iframe src="/widgets/angle-rules-explorer.html?mode=all" style="width:100%;max-width:696px;height:540px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Marking patterns at a glance

For "find the angle" questions, marks usually split as:

- **M1** for choosing the correct rule and writing the equation.
- **A1** for the correct value.
- **B1 (often separate)** for stating the reason in full ("alternate angles, $AB \parallel CD$").

A 3-mark question typically has structure M1 + A1 + B1. Lose the reason and you lose a third of the marks.

For polygon questions:

- **M1** for $(n - 2) \times 180$ or $\dfrac{360}{n}$ used correctly.
- **M1** for an intermediate step (e.g. dividing by $n$, or solving for $n$).
- **A1** for the final value.

## Recap: regular polygons

Slide $n$ to step from triangle to dodecagon. Both interior and exterior angles update at every vertex, and the bottom row shows how the formulas land for that $n$.

<iframe src="/widgets/polygon-angle-explorer.html" style="width:100%;max-width:696px;height:660px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Worked example: combining several rules

In the figure, $AB$ is parallel to $CD$. A transversal cuts $AB$ at $E$ and $CD$ at $F$, with $C$ to the left of $F$ on line $CD$ and $B$ to the right of $E$ on line $AB$. The angle $BEF = 40°$ (the angle on the lower-right of $E$). Below $CD$, a point $G$ is placed so that triangle $EFG$ is isosceles with $FE = FG$ and angle $EFG = 70°$.

(a) Find angle $EFC$.

(b) Find angle $FEG$.

(c) Separately, find the size of one interior angle of a regular polygon with 12 sides.

<div class="diagram">
<div class="diagram-caption">AB ∥ CD · ∠BEF = 40° · △EFG: FE = FG, ∠EFG = 70°</div>
<div style="display:flex;justify-content:center;padding:14px 0">
<div style="position:relative;width:480px;height:340px;max-width:100%">

  <!-- AB line -->
  <div style="position:absolute;left:30px;right:30px;top:80px;height:2.5px;background:#00abfa"></div>
  <div style="position:absolute;left:8px;top:64px;font:700 13px 'Geist Mono',monospace;color:#00abfa">A</div>
  <div style="position:absolute;right:8px;top:64px;font:700 13px 'Geist Mono',monospace;color:#00abfa">B</div>

  <!-- CD line -->
  <div style="position:absolute;left:30px;right:30px;top:240px;height:2.5px;background:#00abfa"></div>
  <div style="position:absolute;left:8px;top:248px;font:700 13px 'Geist Mono',monospace;color:#00abfa">C</div>
  <div style="position:absolute;right:8px;top:248px;font:700 13px 'Geist Mono',monospace;color:#00abfa">D</div>

  <!-- Transversal through E (130, 80) and F (321, 240); 40° below horizontal.
       Drawn from 70px before E to 70px past F so it pokes through both lines. -->
  <div style="position:absolute;left:76.4px;top:33.75px;width:389px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(40deg)"></div>

  <!-- FG line: F (321, 240) to G (217, 300), length 120 at math angle 150° (down-left). -->
  <div style="position:absolute;left:321px;top:238.75px;width:120px;height:2.5px;background:#7a7875;transform-origin:0 50%;transform:rotate(150deg)"></div>

  <!-- Vertices -->
  <div style="position:absolute;left:130px;top:80px;width:10px;height:10px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:118px;top:60px;font:700 13px 'Geist Mono',monospace;color:#fff067">E</div>

  <div style="position:absolute;left:321px;top:240px;width:10px;height:10px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:330px;top:248px;font:700 13px 'Geist Mono',monospace;color:#fff067">F</div>

  <div style="position:absolute;left:217px;top:300px;width:10px;height:10px;border-radius:50%;background:#fff067;transform:translate(-50%,-50%)"></div>
  <div style="position:absolute;left:225px;top:308px;font:700 13px 'Geist Mono',monospace;color:#fff067">G</div>

  <!-- 40° wedge at E: between EB (east) and EF (40° below horizontal).
       Conic-gradient is N-CW; east = 90°, EF = 130°, fill 40° from 90°. -->
  <div style="position:absolute;left:130px;top:80px;width:60px;height:60px;border-radius:50%;background:conic-gradient(from 90deg, #fff067 0deg 40deg, transparent 40deg);-webkit-mask:radial-gradient(circle, transparent 21px, #000 22px, #000 24px, transparent 25px);mask:radial-gradient(circle, transparent 21px, #000 22px, #000 24px, transparent 25px);transform:translate(-50%,-50%);pointer-events:none"></div>
  <div style="position:absolute;left:158px;top:96px;font:700 13px 'Geist Mono',monospace;color:#fff067">40°</div>

  <!-- 70° wedge at F: between FG (math 150°, conic 240°) and FE (math 220°, conic 310°), fill 70° from 240°. -->
  <div style="position:absolute;left:321px;top:240px;width:50px;height:50px;border-radius:50%;background:conic-gradient(from 240deg, #fff067 0deg 70deg, transparent 70deg);-webkit-mask:radial-gradient(circle, transparent 16px, #000 17px, #000 19px, transparent 20px);mask:radial-gradient(circle, transparent 16px, #000 17px, #000 19px, transparent 20px);transform:translate(-50%,-50%);pointer-events:none"></div>
  <div style="position:absolute;left:278px;top:218px;font:700 13px 'Geist Mono',monospace;color:#fff067">70°</div>

</div>
</div>
</div>

**Step a: Angle $EFC$.** Angles $BEF$ and $EFC$ sit on opposite sides of the transversal between the parallels: they are alternate angles, so $\angle EFC = 40°$ (alternate angles, $AB \parallel CD$). **[B1 for $40°$; B1 for the reason]**

**Step b: Angle $FEG$.** $\triangle EFG$ is isosceles with $FE = FG$, so the base angles satisfy $\angle FEG = \angle FGE$. By the triangle-sum rule:

$$2 \times \angle FEG + 70 = 180 \;\Rightarrow\; \angle FEG = \dfrac{110}{2} = 55°$$

**[M1 for the isosceles triangle equation; A1 for $55°$]**

**Step c: One interior angle of a regular 12-gon.** Use the exterior route: exterior $= \dfrac{360}{12} = 30°$, so interior $= 180 - 30 = 150°$. **[M1 for the exterior route; A1 for $150°$; B1 for $30°$ along the way]**

**Answer:** (a) $\boxed{40°}$  ·  (b) $\boxed{55°}$  ·  (c) $\boxed{150°}$.

Full marks $= 7$.

## Quick reference

| Rule | Wording for reason | Formula |
|---|---|---|
| Angles at a point | "angles at a point sum to $360°$" | sum $= 360°$ |
| Straight line | "angles on a straight line sum to $180°$" | sum $= 180°$ |
| Vertically opposite | "vertically opposite angles" | equal |
| Triangle | "angles in a triangle sum to $180°$" | sum $= 180°$ |
| Quadrilateral | "angles in a quadrilateral sum to $360°$" | sum $= 360°$ |
| Corresponding | "corresponding angles, $AB \parallel CD$" | equal |
| Alternate | "alternate angles, $AB \parallel CD$" | equal |
| Co-interior | "co-interior angles, $AB \parallel CD$" | sum $= 180°$ |
| Polygon interior sum | (use polygon formula) | $(n - 2) \times 180°$ |
| Regular interior | (use polygon formula) | $\dfrac{(n - 2) \times 180°}{n}$ |
| Regular exterior | (use polygon formula) | $\dfrac{360°}{n}$ |
| Exterior sum | (always) | $360°$ |

## Common pitfalls (recap)

- Two-letter angle names when several angles share a vertex: use three letters.
- "Co-interior" without saying "$180°$": state the rule fully.
- Using regular polygon formulas on irregular shapes: only $(n-2) \times 180$ works for irregular.
- Forgetting the parallel-line condition in the reason: "alternate angles" alone is half a reason.
