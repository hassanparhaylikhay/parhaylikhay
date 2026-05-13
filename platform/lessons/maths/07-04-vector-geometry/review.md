---
title: '7.4 review: vector geometry'
checks:
  - q: 'If $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OB} = 4\mathbf{b}$, then $\overrightarrow{AB}$ equals...'
    options: ["$4\\mathbf{b} - \\mathbf{a}$", "$\\mathbf{a} - 4\\mathbf{b}$", "$\\mathbf{a} + 4\\mathbf{b}$", "$\\tfrac{1}{4}\\mathbf{b} - \\mathbf{a}$"]
    correct: 0
    explain: 'End minus start: $\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB} = -\mathbf{a} + 4\mathbf{b} = 4\mathbf{b} - \mathbf{a}$. The scalar attached to $\mathbf{b}$ stays with it through the subtraction.'
  - q: '$T$ is on $AB$ with $AT : TB = 3 : 2$. Then $\overrightarrow{AT}$ equals...'
    options: ["$\\tfrac{3}{5}\\overrightarrow{AB}$", "$\\tfrac{3}{2}\\overrightarrow{AB}$", "$\\tfrac{2}{5}\\overrightarrow{AB}$", "$3\\overrightarrow{AB}$"]
    correct: 0
    explain: 'Ratio $3 : 2$ has total $5$ parts. $T$ sits $3$ of those $5$ from $A$, so $\overrightarrow{AT} = \tfrac{3}{5}\overrightarrow{AB}$.'
  - q: 'In a parallelogram $OABC$ with $\overrightarrow{OA} = \mathbf{a}$ and $\overrightarrow{OC} = \mathbf{c}$, the diagonal $\overrightarrow{OB}$ equals...'
    options: ["$\\mathbf{a} + \\mathbf{c}$", "$\\mathbf{a} - \\mathbf{c}$", "$\\mathbf{c} - \\mathbf{a}$", "$2\\mathbf{a}$"]
    correct: 0
    explain: 'Route $O \to A \to B$ uses $\overrightarrow{AB} = \overrightarrow{OC} = \mathbf{c}$ (opposite sides equal in a parallelogram). So $\overrightarrow{OB} = \mathbf{a} + \mathbf{c}$. The other diagonal is $\overrightarrow{AC} = \mathbf{c} - \mathbf{a}$.'
  - q: 'Vectors $\mathbf{u} = 2\mathbf{a} - 6\mathbf{b}$ and $\mathbf{v} = 3\mathbf{a} - 9\mathbf{b}$. They are parallel because...'
    options: ["$\\mathbf{v} = \\tfrac{3}{2}\\mathbf{u}$", "they have the same first component", "they have the same magnitude", "they are perpendicular to each other"]
    correct: 0
    explain: 'Factor: $\mathbf{v} = 3\mathbf{a} - 9\mathbf{b} = \tfrac{3}{2}(2\mathbf{a} - 6\mathbf{b}) = \tfrac{3}{2}\mathbf{u}$. Coefficient ratios: $3/2 = 1.5$ and $(-9)/(-6) = 1.5$. Both agree, so they are parallel.'
  - q: 'Three points $P, Q, R$ are collinear if $\overrightarrow{PQ}$ and $\overrightarrow{PR}$ are...'
    options: ["parallel (one is a scalar multiple of the other)", "perpendicular", "of equal length", "from different starting points"]
    correct: 0
    explain: 'Same starting point AND parallel directions force the three points onto a single line through $P$. The exam answer must state both conditions in words.'
---

## What you learned in 7.4

- **Position vector** of $A$: $\overrightarrow{OA} = \mathbf{a}$. The arrow from the origin.
- **End minus start**: $\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$. The single identity behind the entire unit.
- **Head-to-tail**: route any vector through known points. $\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB}$.
- **Parallelogram**: opposite sides are EQUAL vectors. Diagonals are $\mathbf{a} + \mathbf{c}$ and $\mathbf{c} - \mathbf{a}$ when $\overrightarrow{OA} = \mathbf{a}, \overrightarrow{OC} = \mathbf{c}$.
- **Midpoint**: position vector is the average. $\overrightarrow{OM} = \tfrac{1}{2}(\mathbf{a} + \mathbf{b})$ for the midpoint of $AB$.
- **Ratio split** $AT : TB = m : n$: gives $\overrightarrow{AT} = \dfrac{m}{m+n}\overrightarrow{AB}$ and $\overrightarrow{OT} = \dfrac{n}{m+n}\mathbf{a} + \dfrac{m}{m+n}\mathbf{b}$. Coefficients flip and sum to $1$.
- **Parallel**: $\mathbf{v} = k\mathbf{u}$ for some non-zero $k$. Coefficient ratios of $\mathbf{a}$ and $\mathbf{b}$ must match.
- **Collinear**: parallel arrows AND a shared starting point.

## A decision tree for vector geometry questions

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHAT IS THE QUESTION ASKING?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">"Find \(\overrightarrow{XY}\) in terms of \(\mathbf{a}\) and \(\mathbf{b}\)"</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">HEAD-TO-TAIL ROUTE</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(\overrightarrow{XY} = \overrightarrow{X?} + \overrightarrow{?Y}\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">"Show vectors are parallel"</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff822c;border-radius:8px;background:rgba(255,130,44,0.06);text-align:center"><div style="color:#ff822c;font-weight:700;font-size:14px;letter-spacing:0.5px">FACTOR OUT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(\mathbf{v} = k\mathbf{u}\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">"Show three points are collinear"</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">PARALLEL + SHARED START</div><div style="color:#7a7875;font-size:11px;margin-top:4px">state BOTH in the answer</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center;min-width:340px"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">RATIO / POINT ON A SIDE</div><div style="color:#7a7875;font-size:11px;margin-top:4px">use \(\overrightarrow{AT} = \tfrac{m}{m+n}\overrightarrow{AB}\), then route to \(O\)</div></div>
  </div>
</div>

Almost every vector geometry question on the paper is one of these four flavours, sometimes chained two or three at a time.

## Three identities to lock in before walking into the exam

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">THREE IDENTITIES, MEMORISE</div>
  <div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04);text-align:center">
      <div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">DISPLACEMENT</div>
      <div style="font-size:15px;color:#f0eeea">\(\overrightarrow{AB} = \mathbf{b} - \mathbf{a}\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04);text-align:center">
      <div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">MIDPOINT</div>
      <div style="font-size:15px;color:#f0eeea">\(\overrightarrow{OM} = \tfrac{1}{2}(\mathbf{a} + \mathbf{b})\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(255,130,44,0.4);border-radius:8px;background:rgba(255,130,44,0.04);text-align:center">
      <div style="color:#ff822c;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">RATIO SPLIT</div>
      <div style="font-size:15px;color:#f0eeea">\(\overrightarrow{OT} = \tfrac{n}{m+n}\mathbf{a} + \tfrac{m}{m+n}\mathbf{b}\)</div>
    </div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875;text-align:center;margin-top:12px;line-height:1.5">three lines that, together, generate every answer in this part of the paper</div>
</div>

## Comprehensive worked example

This is the structure of the longest vector question that shows up on a paper. Triangle $OAB$, $\overrightarrow{OA} = \mathbf{a}$, $\overrightarrow{OB} = 4\mathbf{b}$. $T$ is on $AB$ with $AT : TB = 3 : 2$.

(a) Find $\overrightarrow{AB}$ in terms of $\mathbf{a}$ and $\mathbf{b}$.

(b) Show that the position vector of $T$ is $\tfrac{2}{5}(\mathbf{a} + 6\mathbf{b})$.

(c) Point $Q$ lies on $OB$. Given $\overrightarrow{QT} = \tfrac{1}{5}(2\mathbf{a} - 3\mathbf{b})$, find $OQ : QB$.

<iframe src="/widgets/vector-geometry-step-explorer.html?preset=review-comprehensive" style="width:100%;max-width:696px;height:720px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): $\overrightarrow{AB}$.** Route via $O$.

$$\overrightarrow{AB} = \overrightarrow{AO} + \overrightarrow{OB} = -\mathbf{a} + 4\mathbf{b} = 4\mathbf{b} - \mathbf{a}$$

So $\overrightarrow{AB} = \boxed{4\mathbf{b} - \mathbf{a}}$. **[B1]**

**Part (b): position vector of $T$.** $T$ sits $\tfrac{3}{5}$ of the way from $A$ to $B$, so $\overrightarrow{AT} = \tfrac{3}{5}\overrightarrow{AB} = \tfrac{3}{5}(4\mathbf{b} - \mathbf{a})$.

Then route via $A$:

$$\overrightarrow{OT} = \overrightarrow{OA} + \overrightarrow{AT} = \mathbf{a} + \tfrac{3}{5}(4\mathbf{b} - \mathbf{a})$$

Expand and collect:

$$\overrightarrow{OT} = \mathbf{a} + \tfrac{12}{5}\mathbf{b} - \tfrac{3}{5}\mathbf{a} = \tfrac{2}{5}\mathbf{a} + \tfrac{12}{5}\mathbf{b}$$

Factor out $\tfrac{1}{5}$:

$$\overrightarrow{OT} = \tfrac{1}{5}(2\mathbf{a} + 12\mathbf{b}) = \tfrac{2}{5}(\mathbf{a} + 6\mathbf{b}) \ \checkmark$$

Shown. $\overrightarrow{OT} = \boxed{\tfrac{2}{5}(\mathbf{a} + 6\mathbf{b})}$. **[M1 for $\overrightarrow{OA} + \overrightarrow{AT}$ route; M1 for $\tfrac{3}{5}(4\mathbf{b} - \mathbf{a})$; A1 for the tidy form leading to the answer with no errors]**

**Part (c): the ratio $OQ : QB$.** $Q$ lies on $OB$, so $\overrightarrow{OQ}$ is a pure multiple of $\mathbf{b}$ (zero $\mathbf{a}$-component). Find it by routing through $T$:

$$\overrightarrow{OQ} = \overrightarrow{OT} - \overrightarrow{QT}$$

Substitute:

$$\overrightarrow{OQ} = \tfrac{2}{5}\mathbf{a} + \tfrac{12}{5}\mathbf{b} - \tfrac{1}{5}(2\mathbf{a} - 3\mathbf{b})$$

Expand the subtracted bracket:

$$\overrightarrow{OQ} = \tfrac{2}{5}\mathbf{a} + \tfrac{12}{5}\mathbf{b} - \tfrac{2}{5}\mathbf{a} + \tfrac{3}{5}\mathbf{b} = \tfrac{15}{5}\mathbf{b} = 3\mathbf{b}$$

The $\mathbf{a}$-component is zero, confirming $Q$ really does sit on $OB$ (a useful sanity check). Now, $\overrightarrow{OB} = 4\mathbf{b}$, so:

$$\overrightarrow{QB} = \overrightarrow{OB} - \overrightarrow{OQ} = 4\mathbf{b} - 3\mathbf{b} = \mathbf{b}$$

Therefore $OQ : QB = 3\mathbf{b} : \mathbf{b} = \boxed{3 : 1}$. **[M1 for $\overrightarrow{OQ} = \overrightarrow{OT} - \overrightarrow{QT}$ route; M1 for $\overrightarrow{OQ} = 3\mathbf{b}$; A1 for the ratio]**

Full marks $= 7$.

That single question, written out in full, is worth $7$ marks. Each step lands a mark, so showing the working in clean lines is the difference between full marks and partial marks.

## Common mistakes across the unit

- **Skipping the head-to-tail route**. Jumping straight to $\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$ without showing the workings loses method marks in $4$+ mark questions.
- **Sign errors when reversing arrows**. $\overrightarrow{AO} = -\mathbf{a}$, not $\mathbf{a}$. Sign errors here propagate through every later step.
- **Forgetting opposite sides of a parallelogram are equal**. Re-deriving via the head-to-tail route works but wastes time when a one-line property is available.
- **Missing the FLIP in ratio splits**. $AT : TB = 3 : 2$ gives $\overrightarrow{OT} = \tfrac{2}{5}\mathbf{a} + \tfrac{3}{5}\mathbf{b}$. The $3$ pairs with the $\mathbf{b}$ side, the $2$ pairs with the $\mathbf{a}$ side.
- **Stopping at an un-tidied expression**. The accuracy mark is for the simplest form. Always expand brackets and collect like terms before circling the final answer.
- **Forgetting the second line of a collinearity proof**. $\overrightarrow{PY} = 2\overrightarrow{PX}$ alone is not enough; you also need "both start at $P$".
- **Computing magnitudes when the question asks for terms in $\mathbf{a}$ and $\mathbf{b}$**. The magnitude formula is for 7.3 questions. Here you stay symbolic.

## Quick summary

- **Foundation**: $\overrightarrow{AB} = \mathbf{b} - \mathbf{a}$.
- **Routes**: $\overrightarrow{XY} = \overrightarrow{X?} + \overrightarrow{?Y}$ through any known point.
- **Parallelogram shortcut**: opposite sides equal.
- **Midpoint shortcut**: average of position vectors.
- **Ratio split**: $\overrightarrow{AT} = \tfrac{m}{m+n}\overrightarrow{AB}$; coefficients of $\mathbf{a}$ and $\mathbf{b}$ in $\overrightarrow{OT}$ flip and sum to $1$.
- **Parallel**: scalar multiple.
- **Collinear**: parallel AND shared start.

That wraps up Unit 7. You can now read a vector question, sketch the figure, mark $\mathbf{a}$ and $\mathbf{b}$, and write every other vector in the figure as a clean expression in $\mathbf{a}$ and $\mathbf{b}$. The same toolkit covers transformations (7.1), column vectors (7.2), magnitudes and distances (7.3), and the geometric proofs above. That is the entire vector + transformation chapter of your O-Level course.
