---
title: '7.2 review: vectors in two dimensions'
checks:
  - q: 'Given $A(-1, 2)$ and $B(3, -1)$, the vector $\vec{AB}$ is...'
    options: ["$\\begin{pmatrix} 4 \\\\ -3 \\end{pmatrix}$", "$\\begin{pmatrix} -4 \\\\ 3 \\end{pmatrix}$", "$\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$", "$\\begin{pmatrix} 3 \\\\ -1 \\end{pmatrix}$"]
    correct: 0
    explain: '$\vec{AB} = B - A = (3 - (-1), -1 - 2) = (4, -3)$. End minus start.'
  - q: 'If $\mathbf{p} = \begin{pmatrix} 2 \\ -3 \end{pmatrix}$ and $\mathbf{q} = \begin{pmatrix} -5 \\ 1 \end{pmatrix}$, then $\mathbf{p} - \mathbf{q} = $...'
    options: ["$\\begin{pmatrix} 7 \\\\ -4 \\end{pmatrix}$", "$\\begin{pmatrix} -3 \\\\ -2 \\end{pmatrix}$", "$\\begin{pmatrix} -7 \\\\ 4 \\end{pmatrix}$", "$\\begin{pmatrix} 3 \\\\ 2 \\end{pmatrix}$"]
    correct: 0
    explain: 'Top: $2 - (-5) = 2 + 5 = 7$. Bottom: $-3 - 1 = -4$. So $\mathbf{p} - \mathbf{q} = \begin{pmatrix} 7 \\ -4 \end{pmatrix}$.'
  - q: 'If $\mathbf{a} = \begin{pmatrix} 1 \\ 2 \end{pmatrix}$, then $-3\mathbf{a} = $...'
    options: ["$\\begin{pmatrix} -3 \\\\ -6 \\end{pmatrix}$", "$\\begin{pmatrix} 3 \\\\ 6 \\end{pmatrix}$", "$\\begin{pmatrix} -3 \\\\ 6 \\end{pmatrix}$", "$\\begin{pmatrix} -2 \\\\ -1 \\end{pmatrix}$"]
    correct: 0
    explain: 'Multiply each component by $-3$: $(-3)(1) = -3$ and $(-3)(2) = -6$. The negative sign flips direction, the $3$ triples the length.'
  - q: 'Which pair of vectors is parallel?'
    options: ["$\\begin{pmatrix} 2 \\\\ 5 \\end{pmatrix}$ and $\\begin{pmatrix} 4 \\\\ 10 \\end{pmatrix}$", "$\\begin{pmatrix} 1 \\\\ 3 \\end{pmatrix}$ and $\\begin{pmatrix} 3 \\\\ 6 \\end{pmatrix}$", "$\\begin{pmatrix} 2 \\\\ 1 \\end{pmatrix}$ and $\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$", "$\\begin{pmatrix} 4 \\\\ 2 \\end{pmatrix}$ and $\\begin{pmatrix} 6 \\\\ 4 \\end{pmatrix}$"]
    correct: 0
    explain: 'Divide matching components and check both ratios match. For $(2, 5)$ and $(4, 10)$: $4/2 = 2$ and $10/5 = 2$. Same ratio, so they are parallel (the second is $2$ times the first).'
  - q: '$\vec{AB} + \vec{BC} = $ ...'
    options: ["$\\vec{AC}$", "$\\vec{CA}$", "$\\vec{AB} + \\vec{AC}$", "$\\vec{BC} - \\vec{AB}$"]
    correct: 0
    explain: 'Head-to-tail: go from $A$ to $B$, then from $B$ to $C$. The net journey is $A$ to $C$. This is the head-to-tail rule written with point names; it underpins almost all of 7.4.'
---

## What you learned in 7.2

A short walkthrough of the unit:

- **What a vector is**: a quantity with magnitude AND direction. Written as $\vec{AB}$, $\mathbf{a}$, or as a column $\begin{pmatrix} a \\ b \end{pmatrix}$.
- **Find $\vec{AB}$ from points**: $\vec{AB} = B - A$. End minus start.
- **Reverse**: $\vec{BA} = -\vec{AB}$. Flip both signs.
- **Add and subtract** by adding/subtracting top to top, bottom to bottom.
- **Head-to-tail**: $\vec{AB} + \vec{BC} = \vec{AC}$. This identity is the engine of 7.4.
- **Scalar multiplication**: $k\mathbf{a}$ multiplies each component by $k$. Positive $k$ keeps direction; negative flips it; $|k|$ controls length.
- **Parallel**: $\mathbf{b} = k\mathbf{a}$ for some non-zero $k$. Check by dividing matching components: the ratios must agree.

## A decision tree for vector questions

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHICH OPERATION DO YOU NEED?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Two points (e.g. $A$ and $B$)?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">SUBTRACT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(\vec{AB} = B - A\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Two vectors, asked to combine?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff822c;border-radius:8px;background:rgba(255,130,44,0.06);text-align:center"><div style="color:#ff822c;font-weight:700;font-size:14px;letter-spacing:0.5px">ADD / SUBTRACT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">tops with tops, bottoms with bottoms</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">A vector times a number?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">SCALE</div><div style="color:#7a7875;font-size:11px;margin-top:4px">multiply each component by \(k\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center;min-width:300px"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">PARALLEL CHECK</div><div style="color:#7a7875;font-size:11px;margin-top:4px">divide matching components; ratios must agree</div></div>
  </div>
</div>

Four operations, four colours. Almost every vector question on a paper is one of these, sometimes chained two or three at a time.

## Comprehensive worked example

Vectors $\mathbf{a} = \begin{pmatrix} 4 \\ 1 \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} -1 \\ 3 \end{pmatrix}$.

(a) Find $\mathbf{a} + \mathbf{b}$ as a column vector.

(b) Find $2\mathbf{a} - \mathbf{b}$ as a column vector.

(c) Vector $\mathbf{c} = \begin{pmatrix} 12 \\ 3 \end{pmatrix}$. Show that $\mathbf{c}$ is parallel to $\mathbf{a}$.

<iframe src="/widgets/transformations-step-explorer.html?preset=7p2-review-comprehensive" style="width:100%;max-width:696px;height:680px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): $\mathbf{a} + \mathbf{b}$.** Add component by component.

$$\mathbf{a} + \mathbf{b} = \begin{pmatrix} 4 + (-1) \\ 1 + 3 \end{pmatrix} = \begin{pmatrix} 3 \\ 4 \end{pmatrix}$$

So $\mathbf{a} + \mathbf{b} = \boxed{\begin{pmatrix} 3 \\ 4 \end{pmatrix}}$. **[B2 for both components correct; B1 if only one is right]**

**Part (b): $2\mathbf{a} - \mathbf{b}$.** First scale $\mathbf{a}$ by $2$:

$$2\mathbf{a} = \begin{pmatrix} 8 \\ 2 \end{pmatrix}$$

Then subtract $\mathbf{b}$:

$$2\mathbf{a} - \mathbf{b} = \begin{pmatrix} 8 - (-1) \\ 2 - 3 \end{pmatrix} = \begin{pmatrix} 9 \\ -1 \end{pmatrix}$$

So $2\mathbf{a} - \mathbf{b} = \boxed{\begin{pmatrix} 9 \\ -1 \end{pmatrix}}$. **[B2 for both correct; B1 if only one is right]**

**Part (c): show $\mathbf{c}$ is parallel to $\mathbf{a}$.** Try $\mathbf{c} = k\mathbf{a}$. Compare matching components:

$$\frac{12}{4} = 3, \quad \frac{3}{1} = 3$$

Both ratios are $3$, so $\mathbf{c} = 3\mathbf{a}$. Since $\mathbf{c}$ is a scalar multiple of $\mathbf{a}$, $\mathbf{c}$ is **parallel** to $\mathbf{a}$ (three times as long, same direction).

$$\boxed{\mathbf{c} = 3\mathbf{a}, \ \text{so } \mathbf{c} \text{ is parallel to } \mathbf{a}}$$

**[B1 for finding $k = 3$; B1 for stating parallel]**

Full marks $= 6$.

## Common mistakes across the unit

- **Doing $A - B$ instead of $B - A$** when finding $\vec{AB}$. End MINUS start.
- **Forgetting to flip signs when subtracting a negative.** $5 - (-3) = 8$, not $2$.
- **Mixing components**. Tops always with tops; bottoms always with bottoms. Never combine an $x$-component with a $y$-component.
- **Saying "parallel" after only checking one ratio.** Both must give the same $k$.
- **Calling something "the same vector" because it starts at the origin.** Vectors don't care where they start; only the components matter.
- **Writing the column as a row $(a, b)$.** Row form is for coordinates, not vectors.
- **Forgetting that $\mathbf{a} - \mathbf{b}$ and $\mathbf{b} - \mathbf{a}$ differ in sign**, even though $\mathbf{a} + \mathbf{b} = \mathbf{b} + \mathbf{a}$.

## Quick summary

- $\vec{AB} = B - A$. End minus start.
- Add or subtract: tops with tops, bottoms with bottoms.
- $\mathbf{a} - \mathbf{b} = \mathbf{a} + (-\mathbf{b})$.
- $k\mathbf{a}$: multiply each component by $k$. Sign of $k$ matters.
- Parallel iff one is a scalar multiple of the other.
- Head-to-tail identity: $\vec{AB} + \vec{BC} = \vec{AC}$.

That wraps up 7.2. The next topic, 7.3, asks the question we have been ignoring so far: how LONG is a vector? That length is the **magnitude**, and Pythagoras on the column gives you the answer in a single step.
