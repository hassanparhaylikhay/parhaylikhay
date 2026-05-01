---
title: Review & practice
checks:
  - q: 'Simplify $5x^3 \times 4x^2$.'
    options: ["$9x^6$", "$20x^5$", "$20x^6$", "$9x^5$"]
    correct: 1
    explain: 'Multiply coefficients ($5 \times 4 = 20$), add indices ($3 + 2 = 5$): $20x^5$.'
  - q: 'Simplify $\dfrac{12 x^7}{3 x^4}$.'
    options: ["$4x^3$", "$9x^3$", "$4x^{11}$", "$\\dfrac{12}{3x^3}$"]
    correct: 0
    explain: 'Divide coefficients ($\tfrac{12}{3} = 4$), subtract indices ($7 - 4 = 3$): $4x^3$.'
  - q: 'Simplify $(3x^4)^2$.'
    options: ["$3x^8$", "$6x^8$", "$9x^6$", "$9x^8$"]
    correct: 3
    explain: 'Power of a power: $3^2 = 9$ and $x^{4 \times 2} = x^8$. So $9x^8$.'
  - q: 'Write $7x^{-3}$ without a negative index.'
    options: ["$\\dfrac{7}{x^3}$", "$\\dfrac{1}{7x^3}$", "$-7x^3$", "$\\dfrac{7}{x}$"]
    correct: 0
    explain: 'Negative index moves $x$ to the bottom: $7x^{-3} = \dfrac{7}{x^3}$. The $7$ stays as a coefficient.'
  - q: 'Solve $3^{x} = 81$.'
    options: ["$x = 3$", "$x = 4$", "$x = 27$", "$x = 9$"]
    correct: 1
    explain: '$81 = 3^4$. Equating indices: $x = 4$.'
  - q: 'Solve $4^{x + 1} = 16$.'
    options: ["$x = 1$", "$x = 2$", "$x = 4$", "$x = 0$"]
    correct: 0
    explain: '$16 = 4^2$, so $4^{x+1} = 4^2$, giving $x + 1 = 2$ and $x = 1$.'
  - q: 'Evaluate $25^{1/2}$.'
    options: ["$5$", "$12.5$", "$50$", "$\\dfrac{1}{25}$"]
    correct: 0
    explain: 'A power of $\tfrac{1}{2}$ is a square root. $\sqrt{25} = 5$.'
  - q: 'Simplify $\dfrac{(2x^3)^2}{x^4}$.'
    options: ["$2x^2$", "$4x^2$", "$4x^{10}$", "$2x^{10}$"]
    correct: 1
    explain: '$(2x^3)^2 = 4x^6$. Divide: $\dfrac{4x^6}{x^4} = 4x^{6 - 4} = 4x^2$.'
---

## What you should know by now

If you've worked through P1 to P3 you can:

- Apply all four index rules (multiply, divide, power, negative) to terms with letters and coefficients.
- Convert between negative indices and reciprocals; between fractional indices and roots.
- Solve index equations like $32^x = 2$ by rewriting both sides on the same base.
- Combine rules cleanly in multi-step problems: power of a quotient, fractional indices in evaluations, division through negative indices.
- Distinguish a fractional **index** (a root) from a fractional **coefficient** (a multiplier).

## Marking patterns at a glance

This sub-topic appears in many forms. Marks usually run:

- **B1** for a single-rule simplification.
- **M1 + A1** for "simplify" or "solve" with one method step.
- **M1, M1, A1** for combined-rule work or for index equations needing a base rewrite plus a linear-equation solve.

The trap markers Cambridge uses repeatedly:

- A negative index that should NOT pull a coefficient under the bar.
- A fractional index treated as a coefficient ($x^{1/2}$ as $\tfrac{x}{2}$).
- An equation like $32^x = 2$ where the bases must be matched first.
- A bracket whose power must distribute to every factor inside.

## Worked example: combined rules across the lesson

Simplify $\dfrac{(3x^2)^3 \times x^{-1}}{9x^4}$.

**Step 1: Apply the power to the bracket.** $(3x^2)^3 = 27 x^6$.

**Step 2: Multiply on the top.**

$$27 x^6 \times x^{-1} \;=\; 27 x^{6 - 1} \;=\; 27 x^5$$

**Step 3: Divide.**

$$\dfrac{27 x^5}{9 x^4} \;=\; \dfrac{27}{9} \times x^{5 - 4} \;=\; 3 x$$

**Answer:** $\boxed{3x}$. **[M1 for the bracket; M1 for combining indices; A1 for the result]**

Full marks $= 3$.

## Quick reference

- $a^m \times a^n = a^{m+n}$
- $\dfrac{a^m}{a^n} = a^{m-n}$
- $(a^m)^n = a^{mn}$
- $a^{-n} = \dfrac{1}{a^n}$
- $a^{1/n} = \sqrt[n]{a}$, $a^{m/n} = \sqrt[n]{a^m}$
- For index equations: rewrite both sides as powers of a common base, equate the indices.

## Your turn: full quiz

The widget below is a mixed quiz drawing from all three parts: simplifying, solving, and combined rule work.
