---
title: '7.3 review: magnitude of a vector'
checks:
  - q: 'For $\mathbf{a} = \begin{pmatrix} 5 \\ -12 \end{pmatrix}$, $|\mathbf{a}|$ equals...'
    options: ["$13$", "$17$", "$\\sqrt{17}$", "$-7$"]
    correct: 0
    explain: 'Square the components: $5^{2} = 25$ and $(-12)^{2} = 144$. So $|\mathbf{a}| = \sqrt{25 + 144} = \sqrt{169} = 13$. The $5,\, 12,\, 13$ triple shows up often. Worth memorising alongside $3,\, 4,\, 5$.'
  - q: 'For $A(1, -2)$ and $B(7, 6)$, the distance $|\vec{AB}|$ equals...'
    options: ["$10$", "$14$", "$\\sqrt{14}$", "$8$"]
    correct: 0
    explain: '$\vec{AB} = (6, 8)$, then $|\vec{AB}| = \sqrt{36 + 64} = \sqrt{100} = 10$. Another classic Pythagorean triple, scaled up: $6,\, 8,\, 10 = 2 \times (3,\, 4,\, 5)$.'
  - q: 'If $\mathbf{a} = \begin{pmatrix} 3 \\ -4 \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} -1 \\ 1 \end{pmatrix}$, then $|\mathbf{a} + \mathbf{b}|$ equals...'
    options: ["$\\sqrt{13} \\approx 3.61$", "$5$", "$7$", "$|\\mathbf{a}| + |\\mathbf{b}|$"]
    correct: 0
    explain: 'First add: $\mathbf{a} + \mathbf{b} = (2, -3)$. Then the magnitude: $\sqrt{4 + 9} = \sqrt{13}$. Note that $|\mathbf{a} + \mathbf{b}| \neq |\mathbf{a}| + |\mathbf{b}|$ in general; you cannot just add the lengths.'
  - q: 'If $|\vec{AB}| = 10$ then $|\vec{BA}|$ equals...'
    options: ["$10$", "$-10$", "$5$", "$0$"]
    correct: 0
    explain: '$\vec{BA}$ is $\vec{AB}$ with every sign flipped, but squaring throws away the sign. So both have the same magnitude. Distance does not care which direction you measured it.'
  - q: 'Forgetting the square root in $|\mathbf{a}|$ gives a number that is...'
    options: ["the SQUARE of the magnitude, not the magnitude itself", "the magnitude doubled", "the magnitude halved", "always negative"]
    correct: 0
    explain: 'Pythagoras gives $|\mathbf{a}|^{2} = x^{2} + y^{2}$. The magnitude itself is the square root. Single most common single-mark loss on the magnitude question.'
---

## What you learned in 7.3

A short walkthrough of the unit:

- **The magnitude $|\mathbf{a}|$** is the length of the arrow, computed with Pythagoras on the column: $|\mathbf{a}| = \sqrt{x^{2} + y^{2}}$.
- **The notation** $|\mathbf{a}|$ or $|\vec{AB}|$ uses the same vertical bars as the absolute value of a number: it means "length of" or "size of".
- **Negatives disappear** when you square. $(-3)^{2} = 9$, so the sign of a component never affects the length.
- **Distance between two points** $A$ and $B$ is the same as $|\vec{AB}|$: find $\vec{AB} = B - A$ first, then apply Pythagoras.
- **Order does not matter for distance**: $|\vec{AB}| = |\vec{BA}|$. Going from $A$ to $B$ is the same length as going from $B$ to $A$.
- **Method mark** is earned by writing the $\sqrt{(\text{top})^{2} + (\text{bottom})^{2}}$ expression in full BEFORE pressing equals on the calculator. Lock it in early.

## A decision tree for magnitude questions

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHAT DOES THE QUESTION HAND YOU?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">A ready-made column $\begin{pmatrix} x \\ y \end{pmatrix}$?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">PYTHAGORAS</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(\sqrt{x^{2} + y^{2}}\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Two points $A$ and $B$?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff822c;border-radius:8px;background:rgba(255,130,44,0.06);text-align:center"><div style="color:#ff822c;font-weight:700;font-size:14px;letter-spacing:0.5px">SUBTRACT, THEN ROOT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">column $= B - A$, then Pythagoras</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center;min-width:340px"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">COMBINE FIRST</div><div style="color:#7a7875;font-size:11px;margin-top:4px">build the column ($\mathbf{a} + \mathbf{b}$, $2\mathbf{a} - \mathbf{b}$, etc.), then Pythagoras on that column</div></div>
  </div>
</div>

Three flavours of magnitude question. All three end in the same final step: square the components, add, take the root.

## Small Pythagorean triples worth memorising

A handful of integer triples come up over and over. When you see them, you can write the magnitude as a whole number without reaching for the calculator.

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">FIVE TRIPLES THAT SHOW UP</div>
  <div style="display:flex;gap:10px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:110px;padding:12px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04);text-align:center"><div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">3, 4, 5</div><div style="font-size:13px;color:#f0eeea">\(\sqrt{9 + 16} = 5\)</div></div>
    <div style="flex:1;min-width:110px;padding:12px;border:1.5px solid rgba(255,240,103,0.4);border-radius:8px;background:rgba(255,240,103,0.04);text-align:center"><div style="color:#fff067;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">5, 12, 13</div><div style="font-size:13px;color:#f0eeea">\(\sqrt{25 + 144} = 13\)</div></div>
    <div style="flex:1;min-width:110px;padding:12px;border:1.5px solid rgba(255,130,44,0.4);border-radius:8px;background:rgba(255,130,44,0.04);text-align:center"><div style="color:#ff822c;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">8, 15, 17</div><div style="font-size:13px;color:#f0eeea">\(\sqrt{64 + 225} = 17\)</div></div>
    <div style="flex:1;min-width:110px;padding:12px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04);text-align:center"><div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">7, 24, 25</div><div style="font-size:13px;color:#f0eeea">\(\sqrt{49 + 576} = 25\)</div></div>
    <div style="flex:1;min-width:110px;padding:12px;border:1.5px solid rgba(255,70,112,0.4);border-radius:8px;background:rgba(255,70,112,0.04);text-align:center"><div style="color:#ff4670;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">6, 8, 10</div><div style="font-size:13px;color:#f0eeea">\(\sqrt{36 + 64} = 10\)</div></div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875;text-align:center;margin-top:12px;line-height:1.5">if your components match a triple, the magnitude is the third number, no calculator needed</div>
</div>

When the column is $\begin{pmatrix} 5 \\ -12 \end{pmatrix}$ you can write $|\mathbf{a}| = 13$ in one line, because $5^{2} + 12^{2} = 25 + 144 = 169 = 13^{2}$. Spotting these saves time and reduces calculator errors.

## Comprehensive worked example

Points $A(-3, 5)$ and $B(1, -3)$ lie on a coordinate grid.

(a) Find the column vector $\vec{AB}$.

(b) Find $|\vec{AB}|$, giving your answer correct to $3$ significant figures.

<iframe src="/widgets/magnitude-step-explorer.html?preset=review-comprehensive" style="width:100%;max-width:696px;height:700px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): the column vector $\vec{AB}$.** Image minus object, top then bottom. Take care with the double negative on the top:

$$\vec{AB} = \begin{pmatrix} 1 - (-3) \\ -3 - 5 \end{pmatrix} = \begin{pmatrix} 4 \\ -8 \end{pmatrix}$$

So $\vec{AB} = \boxed{\begin{pmatrix} 4 \\ -8 \end{pmatrix}}$. **[B2 for both components correct; B1 for one]**

**Part (b): the magnitude of $\vec{AB}$.** Square each component, add, take the root.

$$|\vec{AB}| = \sqrt{4^{2} + (-8)^{2}} = \sqrt{16 + 64} = \sqrt{80}$$

Either leave the answer as $\sqrt{80}$ (or simplified: $\sqrt{80} = \sqrt{16 \cdot 5} = 4\sqrt{5}$), or convert: $\sqrt{80} = 8.944\ldots$, which rounds to $8.94$ to $3$ s.f.

**Answer:** $|\vec{AB}| = \boxed{8.94}$. **[M1 for $\sqrt{4^{2} + (-8)^{2}}$; A1 for $8.94$ or $\sqrt{80}$ or $4\sqrt{5}$]**

Full marks $= 4$.

## Worked example: magnitude of a sum

Given $\mathbf{a} = \begin{pmatrix} -3 \\ 4 \end{pmatrix}$ and $\mathbf{b} = \begin{pmatrix} 8 \\ -2 \end{pmatrix}$, find $|\mathbf{a} + \mathbf{b}|$, correct to $3$ significant figures.

**Step 1: Combine first.** Add tops and bottoms.

$$\mathbf{a} + \mathbf{b} = \begin{pmatrix} -3 + 8 \\ 4 + (-2) \end{pmatrix} = \begin{pmatrix} 5 \\ 2 \end{pmatrix}$$

**Step 2: Pythagoras on that column.**

$$|\mathbf{a} + \mathbf{b}| = \sqrt{5^{2} + 2^{2}} = \sqrt{25 + 4} = \sqrt{29}$$

**Step 3: Round.** $\sqrt{29} = 5.385\ldots \approx 5.39$ to $3$ s.f.

**Answer:** $|\mathbf{a} + \mathbf{b}| = \boxed{5.39}$. **[M1 for the addition; M1 for the square root expression with the resulting components; A1 for $5.39$ or $\sqrt{29}$]**

Full marks $= 3$.

Notice the trap: $|\mathbf{a} + \mathbf{b}|$ is NOT $|\mathbf{a}| + |\mathbf{b}|$. Here $|\mathbf{a}| = 5$ and $|\mathbf{b}| = \sqrt{68} \approx 8.25$, so their sum is about $13.25$, much bigger than $\sqrt{29} \approx 5.39$. The two vectors pointed in roughly opposite directions, so they mostly cancelled out.

## Common mistakes across the unit

- **Forgetting the square root.** Stopping at $80$ instead of $\sqrt{80}$. The single biggest one-mark loss.
- **Keeping the negative.** Writing $\sqrt{1 + (-36)} = \sqrt{-35}$ instead of $\sqrt{1 + 36}$. Always square BEFORE adding.
- **Adding the magnitudes.** $|\mathbf{a} + \mathbf{b}| \neq |\mathbf{a}| + |\mathbf{b}|$. The lengths only add when the two vectors point in the same direction (and even then it is only equal, not generally true).
- **Sign flip in the subtraction.** $1 - (-3)$ is $4$, not $-2$. Bracket negative coordinates before subtracting.
- **Mismatched answer form.** Giving a decimal when surds were asked, or surds when $3$ s.f. was asked. Re-read the question wording before circling the answer.
- **Writing the column as a row.** Vectors live in columns; coordinates live in rows. A row in a vector answer can cost the B mark.

## Quick summary

- $|\mathbf{a}| = \sqrt{x^{2} + y^{2}}$. Pythagoras on the column. That is the entire unit in one line.
- For two points: $|\vec{AB}| = \sqrt{(x_{B} - x_{A})^{2} + (y_{B} - y_{A})^{2}}$. Subtract first, then root.
- For a sum or difference: combine first, magnitude second.
- Memorise the small Pythagorean triples ($3,4,5$; $5,12,13$; $6,8,10$; $8,15,17$; $7,24,25$) so the answer falls out without a calculator.
- The method mark comes from writing the square root expression in full. Always show that line.

The next topic, 7.4, finally puts vectors to work proving things about geometric figures: triangles, parallelograms, ratios, and points lying on the same line. Magnitude is no longer the headline act, but everything you learned here still applies whenever the question asks for a length.
