---
title: Review & practice
checks:
  - q: 'Simplify $\dfrac{x}{4} + \dfrac{x}{6}$.'
    options: ["$\\dfrac{2x}{10}$", "$\\dfrac{5x}{12}$", "$\\dfrac{x^2}{24}$", "$\\dfrac{x}{12}$"]
    correct: 1
    explain: 'Common denominator $12$. $\dfrac{x}{4} = \dfrac{3x}{12}$, $\dfrac{x}{6} = \dfrac{2x}{12}$. Sum: $\dfrac{5x}{12}$.'
  - q: 'Simplify $\dfrac{2}{x} - \dfrac{1}{x + 1}$.'
    options: ["$\\dfrac{1}{x(x+1)}$", "$\\dfrac{x + 2}{x(x+1)}$", "$\\dfrac{2 - x}{x(x+1)}$", "$\\dfrac{1}{2x + 1}$"]
    correct: 1
    explain: 'Common denominator $x(x+1)$. Top: $2(x+1) - 1 \cdot x = 2x + 2 - x = x + 2$. So $\dfrac{x+2}{x(x+1)}$.'
  - q: 'Simplify $\dfrac{4x}{5} \times \dfrac{15}{8x}$.'
    options: ["$\\dfrac{60x}{40x}$", "$\\dfrac{3}{2}$", "$\\dfrac{60}{40}$", "$\\dfrac{x}{2}$"]
    correct: 1
    explain: 'Multiply: $\dfrac{4x \cdot 15}{5 \cdot 8x} = \dfrac{60x}{40x} = \dfrac{60}{40} = \dfrac{3}{2}$ after cancelling $x$ and simplifying.'
  - q: 'Simplify $\dfrac{x^2}{6} \div \dfrac{x}{3}$.'
    options: ["$\\dfrac{x^3}{18}$", "$\\dfrac{x}{2}$", "$2x$", "$\\dfrac{x^2}{2}$"]
    correct: 1
    explain: 'Keep, flip, multiply: $\dfrac{x^2}{6} \times \dfrac{3}{x} = \dfrac{3x^2}{6x} = \dfrac{x}{2}$ after cancelling.'
  - q: 'Simplify $\dfrac{x^2 - 9}{x - 3}$.'
    options: ["$x - 3$", "$x + 3$", "$x^2 - 6$", "Cannot simplify"]
    correct: 1
    explain: 'DOTS on top: $x^2 - 9 = (x - 3)(x + 3)$. Cancel $(x - 3)$: $x + 3$.'
  - q: 'Simplify $\dfrac{2x^2 - 8}{x^2 + 4x + 4}$.'
    options: ["$\\dfrac{2(x - 2)}{x + 2}$", "$\\dfrac{x - 2}{x + 2}$", "$\\dfrac{2(x - 2)(x + 2)}{(x + 2)^2}$", "$\\dfrac{2}{x + 2}$"]
    correct: 0
    explain: 'Top: $2(x^2 - 4) = 2(x - 2)(x + 2)$. Bottom: $(x + 2)^2$. Cancel one $(x + 2)$: $\dfrac{2(x - 2)}{x + 2}$.'
  - q: 'Simplify $\dfrac{x + 1}{x} \times \dfrac{x^2}{x + 1}$.'
    options: ["$x$", "$x^2$", "$\\dfrac{x^2 + x}{x^2 + x}$", "$1$"]
    correct: 0
    explain: '$\dfrac{(x+1) \cdot x^2}{x \cdot (x+1)}$. Cancel $(x + 1)$ and one $x$: $\dfrac{x^2}{x} = x$.'
  - q: 'Simplify $\dfrac{x}{2} + \dfrac{x - 1}{4} - \dfrac{x}{8}$.'
    options: ["$\\dfrac{5x - 2}{8}$", "$\\dfrac{4x + (x - 1) \\cdot 2 - x}{8}$", "$\\dfrac{x}{8}$", "$\\dfrac{x - 1}{4}$"]
    correct: 0
    explain: 'Common denominator $8$: $\dfrac{4x}{8} + \dfrac{2(x - 1)}{8} - \dfrac{x}{8} = \dfrac{4x + 2x - 2 - x}{8} = \dfrac{5x - 2}{8}$.'
---

## What you should know by now

If you've worked through P1 to P3 you can:

- **Add or subtract** algebraic fractions by finding a common denominator and scaling each fraction up.
- **Multiply** algebraic fractions: top times top, bottom times bottom, then cancel any common factor.
- **Divide** algebraic fractions using **keep, flip, multiply**.
- **Simplify** rational expressions by factorising top and bottom fully, then cancelling.
- Recognise that you can only cancel a **factor** of the whole top or bottom, never a single term inside a sum.
- Use brackets around multi-term tops when scaling for a common denominator.

## Marking patterns at a glance

This sub-topic is heavily used inside Paper 2 algebra questions. Marks usually run:

- **B1** for a single-step simplification (one factor cancelled).
- **M1 + A1** for a 2-mark "simplify" question: M for the factorisation, A for the result.
- **M1, M1, A1** for a 3-mark "simplify and combine" question: M for each factor step, A for the simplified expression.

The trap markers Cambridge uses repeatedly:

- A 4-term top in addition that students forget to bracket when scaling.
- A factorisable top that students fail to factor before cancelling, declaring "cannot simplify" wrongly.
- Cancelling a TERM rather than a factor (the most common 0-mark mistake on the topic).

## Worked example: combine then simplify

Simplify $\dfrac{1}{x - 1} + \dfrac{1}{x + 1}$.

**Step 1: Common denominator.** $(x - 1)(x + 1)$.

**Step 2: Scale.**

$$\dfrac{1}{x - 1} \;=\; \dfrac{x + 1}{(x-1)(x+1)} \qquad \dfrac{1}{x + 1} \;=\; \dfrac{x - 1}{(x-1)(x+1)}$$

**Step 3: Add the tops.**

$$\dfrac{(x + 1) + (x - 1)}{(x-1)(x+1)} \;=\; \dfrac{2x}{(x-1)(x+1)} \;=\; \dfrac{2x}{x^2 - 1}$$

**Answer:** $\boxed{\dfrac{2x}{x^2 - 1}}$. **[M1 for the common denominator; M1 for the scaled tops; A1 for the simplified result]**

Full marks $= 3$.

## Quick reference

- **Add or subtract**: common denominator first, then add the tops over the shared bottom.
- **Multiply**: top times top, bottom times bottom; cancel diagonally where possible.
- **Divide**: keep, flip, multiply.
- **Simplify rational**: factor top and bottom fully, cancel shared factors.
- Cancel only **factors**, never terms inside a sum.

## Your turn: full quiz

The widget below is a mixed quiz drawing from all three parts: combining, multiplying/dividing, and simplifying.
