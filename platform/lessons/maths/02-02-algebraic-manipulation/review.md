---
title: Review & practice
checks:
  - q: 'Simplify $4x + 7y - x + 2y - 3y$.'
    options: ["$3x + 6y$", "$3x + 12y$", "$5x + 6y$", "$3x + y$"]
    correct: 0
    explain: '$x$-terms: $4x - x = 3x$. $y$-terms: $7y + 2y - 3y = 6y$. Combined: $3x + 6y$.'
  - q: 'Expand $-3(2x - 5)$.'
    options: ["$-6x + 15$", "$-6x - 15$", "$6x - 15$", "$-6x + 5$"]
    correct: 0
    explain: '$-3 \times 2x = -6x$. $-3 \times (-5) = +15$. Result: $-6x + 15$.'
  - q: 'Expand $(x - 4)(x + 2)$.'
    options: ["$x^2 - 2x - 8$", "$x^2 + 2x - 8$", "$x^2 - 6x - 8$", "$x^2 - 8$"]
    correct: 0
    explain: '$x \times x + x \times 2 - 4 \times x - 4 \times 2 = x^2 + 2x - 4x - 8 = x^2 - 2x - 8$.'
  - q: 'Factorise $4x^2 - 25$.'
    options: ["$(2x - 5)(2x + 5)$", "$(4x - 5)(x + 5)$", "$(2x - 5)^2$", "Cannot factorise"]
    correct: 0
    explain: 'Difference of squares: $(2x)^2 - 5^2 = (2x - 5)(2x + 5)$.'
  - q: 'Factorise $x^2 - 11x + 24$.'
    options: ["$(x - 3)(x - 8)$", "$(x + 3)(x - 8)$", "$(x - 4)(x - 6)$", "$(x - 11)(x + 24)$"]
    correct: 0
    explain: 'Multiply to $24$, add to $-11$. Both negative: $-3$ and $-8$. So $(x - 3)(x - 8)$.'
  - q: 'Factorise fully $3x^2 + 6x - 24$.'
    options: ["$3(x + 4)(x - 2)$", "$3(x - 4)(x + 2)$", "$(3x + 12)(x - 2)$", "$(x + 4)(x - 2)$"]
    correct: 0
    explain: 'Common factor $3$: $3(x^2 + 2x - 8)$. Then factor inside: numbers multiplying to $-8$, adding to $2$ are $4$ and $-2$. So $3(x + 4)(x - 2)$.'
  - q: 'Write $x^2 - 6x + 11$ in completed-square form.'
    options: ["$(x - 3)^2 + 11$", "$(x - 3)^2 + 2$", "$(x - 6)^2 + 2$", "$(x + 3)^2 + 2$"]
    correct: 1
    explain: 'Halve $-6$: $-3$. $(-3)^2 = 9$. So $x^2 - 6x = (x - 3)^2 - 9$. Add the $+11$: $(x - 3)^2 - 9 + 11 = (x - 3)^2 + 2$.'
  - q: 'The minimum value of $2(x + 1)^2 - 7$ is...'
    options: ["$-1$", "$-7$", "$1$", "$2$"]
    correct: 1
    explain: '$(x + 1)^2 \ge 0$, multiplied by the positive $2$ stays $\ge 0$. So minimum of $2(x+1)^2 - 7$ is $0 - 7 = -7$, reached at $x = -1$.'
---

## What you should know by now

If you've worked through P1 to P5 you can:

- Combine **like terms** across multi-letter, multi-power expressions.
- Expand single, double and triple brackets, watching every sign.
- Factor out a common factor, recognising the **HCF** of every term.
- Apply **DOTS** ($a^2 - b^2 = (a-b)(a+b)$) and the **perfect square** pattern $a^2 \pm 2ab + b^2 = (a \pm b)^2$.
- Factorise quadratics $x^2 + bx + c$ by the "two numbers" rule, and $ax^2 + bx + c$ by the AC method.
- Complete the square for $x^2 + bx + c$ and for $ax^2 + bx + c$ with $a \ne 1$.
- Read off the **minimum or maximum** of a quadratic from completed-square form.

## Marking patterns at a glance

This sub-topic is rarely a single big question; it surfaces inside almost every algebra question on Paper 1 and Paper 2. The marks usually look like:

- **B1** for a clean factorisation or expansion in a 1-mark question.
- **M1 + A1** for "expand and simplify": M for the expansion, A for the simplified form.
- **M1 (M1) A1** for completing the square: M for halving $b$, M for the constant adjustment, A for the final form.
- Always **factor fully**: a partial factorisation gets only an M1, not the full mark.

The trap markers Cambridge uses repeatedly:

- A negative sign in front of a bracket. Distribute it carefully.
- A common factor sitting inside a quadratic. Always check first.
- A "show that" question where you must complete the square to reveal a specific form.

## Worked example: a multi-step factorisation

Factorise fully $2x^3 - 8x$.

**Step 1: Common factor.** Both terms share $2x$.

$$2x^3 - 8x \;=\; 2x(x^2 - 4)$$

**Step 2: Recognise DOTS on the bracket.**

$$x^2 - 4 \;=\; (x - 2)(x + 2)$$

**Step 3: Combine.**

$$2x^3 - 8x \;=\; 2x(x - 2)(x + 2)$$

**Answer:** $\boxed{2x(x - 2)(x + 2)}$. **[M1 for the common factor; A1 for the DOTS step]**

Full marks $= 2$.

## Quick reference

- **Like terms:** identical letter parts; combine coefficients.
- **Expand:** every term in the first bracket meets every term in the second.
- **Factor common pieces FIRST**, then look for DOTS / quadratic patterns.
- **DOTS:** $a^2 - b^2 = (a - b)(a + b)$.
- **Quadratic** $x^2 + bx + c$: two numbers multiplying to $c$, adding to $b$.
- **Quadratic** $ax^2 + bx + c$: split middle term using AC method.
- **Completing the square:** $\left(x + \tfrac{b}{2}\right)^2 - \left(\tfrac{b}{2}\right)^2 + c$.

## Your turn: full quiz

The widget below is a mixed quiz drawing from all five parts: simplifying, expanding, factorising and completing the square.
