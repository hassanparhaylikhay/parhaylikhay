---
title: 'Transformations: review and comprehensive practice'
checks:
  - q: 'Which transformation needs a centre AND a scale factor?'
    options: ["enlargement", "translation", "rotation", "reflection"]
    correct: 0
    explain: 'Enlargement is the one transformation defined by centre + scale factor. Rotation also needs a centre but takes an angle (not a scale factor).'
  - q: 'The point $(3, -2)$ reflected in $y = x$ becomes...'
    options: ["$(-2, 3)$", "$(3, 2)$", "$(2, 3)$", "$(-3, 2)$"]
    correct: 0
    explain: 'Reflecting in $y = x$ swaps the two coordinates: $(x, y) \to (y, x)$. So $(3, -2)$ becomes $(-2, 3)$.'
  - q: 'A rotation of $180°$ about the origin sends $(4, -5)$ to...'
    options: ["$(-4, 5)$", "$(-5, 4)$", "$(5, -4)$", "$(4, 5)$"]
    correct: 0
    explain: '$180°$ about the origin flips the sign of both coordinates: $(x, y) \to (-x, -y)$. So $(4, -5) \to (-4, 5)$.'
  - q: 'An enlargement with scale factor $-2$, centre $(0, 0)$, sends $(1, 3)$ to...'
    options: ["$(-2, -6)$", "$(2, 6)$", "$(-2, 6)$", "$(2, -6)$"]
    correct: 0
    explain: 'Multiply each coordinate by $-2$: $(1, 3) \to (-2, -6)$. The negative scale factor sends the image to the opposite side of the centre.'
  - q: 'Reflecting in $y = 0$ then in $y = 1$ is equivalent to...'
    options: ["a translation by $\\begin{pmatrix} 0 \\\\ 2 \\end{pmatrix}$", "a rotation $90°$ about the origin", "a reflection in $y = 0.5$", "an enlargement with $k = 2$"]
    correct: 0
    explain: 'Two parallel mirrors give a translation. The vector is twice the perpendicular gap, from the first mirror to the second. From $y = 0$ to $y = 1$ is $1$ unit up; doubled is $2$ up. So translation by $\begin{pmatrix} 0 \\ 2 \end{pmatrix}$.'
---

## What you learned in 7.1

A short walkthrough of the unit:

- **Translation** by $\begin{pmatrix} a \\ b \end{pmatrix}$. Every point slides the same amount. Image is congruent.
- **Reflection** in a mirror line (given as an equation). Every point flips to the same distance on the other side. Image is congruent but orientation reverses.
- **Rotation** about a centre, through an angle, in a direction. Every point sweeps a circular arc. Image is congruent, orientation preserved.
- **Enlargement** with a centre and a scale factor $k$. Image distance from centre $= k \times$ object distance. Image is similar; size scales by $|k|$, area by $k^2$.
- **Combining** two transformations: order matters. Two reflections in parallel mirrors give a translation; two reflections in intersecting mirrors give a rotation about the intersection.

## The decision tree for "describe fully"

When a Cambridge question gives you an object and an image and asks for the single transformation, work through these questions in order:

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">DESCRIBE FULLY · DECISION TREE</div>
  <div style="display:flex;align-items:stretch;gap:10px;margin-bottom:0;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Is the image the same SIZE as the object?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">NO →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">ENLARGEMENT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">scale factor + centre</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ YES</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Has the orientation FLIPPED?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff822c;border-radius:8px;background:rgba(255,130,44,0.06);text-align:center"><div style="color:#ff822c;font-weight:700;font-size:14px;letter-spacing:0.5px">REFLECTION</div><div style="color:#7a7875;font-size:11px;margin-top:4px">mirror as an equation</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Does every vertex shift by the SAME amount?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">TRANSLATION</div><div style="color:#7a7875;font-size:11px;margin-top:4px">the column vector</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center;min-width:260px"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">ROTATION</div><div style="color:#7a7875;font-size:11px;margin-top:4px">centre + angle + direction</div></div>
  </div>
</div>

Four questions, four possible transformations. If you can answer them in order, you can tackle any "describe fully" question Cambridge throws at you.

## Comprehensive worked example

Triangle $T$ has vertices $A(1, 1), B(4, 1), C(1, 3)$.

(a) Reflect $T$ in the line $y = x$. Label the image $T_1$. Write down the coordinates of $T_1$.

(b) Triangle $T_1$ is rotated $90°$ clockwise about the origin to give triangle $T_2$. Write down the coordinates of $T_2$.

(c) Describe fully the single transformation that maps $T$ onto $T_2$.

<iframe src="/widgets/transformations-step-explorer.html?preset=review-comprehensive" style="width:100%;max-width:696px;height:680px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): reflect in $y = x$.** Swap the coordinates of each vertex:

$$A(1, 1) \to A_1(1, 1), \quad B(4, 1) \to B_1(1, 4), \quad C(1, 3) \to C_1(3, 1)$$

So $T_1$ has vertices $A_1(1, 1), B_1(1, 4), C_1(3, 1)$. **[B2 for all three correct (B1 if two are right)]**

**Part (b): rotate $90°$ clockwise about $(0, 0)$.** Use the rule $(x, y) \to (y, -x)$:

$$A_1(1, 1) \to A_2(1, -1), \quad B_1(1, 4) \to B_2(4, -1), \quad C_1(3, 1) \to C_2(1, -3)$$

So $T_2$ has vertices $A_2(1, -1), B_2(4, -1), C_2(1, -3)$. **[B2 for all three correct (B1 if two are right)]**

**Part (c): single transformation from $T$ to $T_2$.** Compare each pair:

$$A(1, 1) \to A_2(1, -1): \ x \text{ stays}, \ y \text{ flips sign}$$

$$B(4, 1) \to B_2(4, -1): \ \text{same pattern}$$

$$C(1, 3) \to C_2(1, -3): \ \text{same pattern}$$

Every $y$ has its sign flipped while $x$ is unchanged. That is exactly the rule for reflection in the line $y = 0$ (the $x$-axis).

$$\boxed{\text{Reflection in the line } y = 0}$$

**[B1 for "reflection"; B1 for the mirror line $y = 0$]**

Full marks $= 6$.

The big takeaway: two transformations applied in a row often collapse to one transformation, but the type of that one can be surprising. Here, a reflection followed by a rotation gave back a different reflection. Try the same chain in the OPPOSITE order (rotate first, then reflect in $y = x$) and you would get a different result; order matters.

## Common mistakes across the unit

- **Skipping a required fact**. Rotations need centre + angle + direction. Enlargements need centre + scale factor. Translations need a column vector. Reflections need a mirror equation. Drop any one and Cambridge takes a mark off.
- **Mirror line as words, not an equation**. "The diagonal" earns zero. $y = x$ earns the mark.
- **Forgetting the sign of $k$ in an enlargement**. Negative scale factors send the image to the OPPOSITE side of the centre. Always check.
- **Using area scale factor instead of length scale factor (or vice versa)**. Lengths $\times k$, areas $\times k^2$, volumes $\times k^3$. Match the question.
- **Applying two transformations in the wrong order**. "$A$ then $B$" is usually different from "$B$ then $A$". Re-read the question.
- **Writing more than one transformation** when the question asks for ONE. "Describe fully the single transformation" wants one. If you write a chain, you lose the mark.
- **Mixing up clockwise and anticlockwise**. Clockwise matches the hands of a clock. Anticlockwise is the opposite. Cambridge sometimes calls anticlockwise "counterclockwise".

## Quick summary

- Four transformations: translation, reflection, rotation, enlargement. Plus their combinations.
- "Describe fully" always means TYPE + RULE. Type is one word; rule is the column vector, mirror equation, centre + angle + direction, or scale factor + centre.
- Translation, reflection, rotation preserve length and angle (image is congruent). Enlargement preserves angles but scales lengths.
- Two reflections combine into a translation (parallel mirrors) or a rotation (intersecting mirrors).

The next unit (7.2) introduces vectors in their own right. A column vector is no longer just a translation rule, it becomes the foundation for describing position, direction, and the geometry of any straight line.
