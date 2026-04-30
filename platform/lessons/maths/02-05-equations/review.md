---
title: Review & practice
checks:
  - q: 'Solve $5x - 2 = 3x + 8$.'
    options: ["$x = 5$", "$x = 3$", "$x = 4$", "$x = -3$"]
    correct: 0
    explain: 'Subtract $3x$: $2x - 2 = 8$. Add $2$: $2x = 10$. Divide: $x = 5$.'
  - q: 'Solve $\dfrac{x}{x + 1} = 2$.'
    options: ["$x = -1$", "$x = -2$", "$x = 2$", "$x = 1$"]
    correct: 1
    explain: 'Multiply by $(x + 1)$: $x = 2(x + 1) = 2x + 2$. So $-x = 2$, $x = -2$. Check: $-2 / (-2 + 1) = -2 / -1 = 2$ ✓.'
  - q: 'Solve $2x + y = 8$, $x - y = 1$.'
    options: ["$x = 3, \\;y = 2$", "$x = 4, \\;y = 0$", "$x = 2, \\;y = 4$", "$x = 1, \\;y = 0$"]
    correct: 0
    explain: 'Add the equations: $3x = 9$, $x = 3$. Then $y = 3 - 1 = 2$.'
  - q: 'Solve $x^2 + 4x - 5 = 0$.'
    options: ["$x = 1, \\;5$", "$x = 1, \\;-5$", "$x = -1, \\;5$", "$x = -1, \\;-5$"]
    correct: 1
    explain: 'Factorise: $(x - 1)(x + 5) = 0$. So $x = 1$ or $x = -5$.'
  - q: 'Solve $x^2 - 6x + 4 = 0$ using the quadratic formula. Give exact form.'
    options: ["$x = 3 \\pm \\sqrt{5}$", "$x = 6 \\pm \\sqrt{5}$", "$x = 3 \\pm 2\\sqrt{5}$", "$x = -3 \\pm \\sqrt{5}$"]
    correct: 0
    explain: '$a = 1, b = -6, c = 4$. $x = \dfrac{6 \pm \sqrt{36 - 16}}{2} = \dfrac{6 \pm \sqrt{20}}{2} = \dfrac{6 \pm 2\sqrt{5}}{2} = 3 \pm \sqrt{5}$.'
  - q: 'Make $r$ the subject of $C = 2\pi r$.'
    options: ["$r = \\dfrac{C}{2\\pi}$", "$r = \\dfrac{2\\pi}{C}$", "$r = \\dfrac{C}{\\pi}$", "$r = 2\\pi C$"]
    correct: 0
    explain: 'Divide both sides by $2\pi$: $r = \dfrac{C}{2\pi}$.'
  - q: 'How many real solutions does $x^2 + 4x + 4 = 0$ have?'
    options: ["two distinct", "one repeated", "none", "infinite"]
    correct: 1
    explain: 'Discriminant: $b^2 - 4ac = 16 - 16 = 0$. One repeated root: $(x + 2)^2 = 0$, $x = -2$.'
  - q: 'Make $h$ the subject of $V = \dfrac{1}{3}\pi r^2 h$.'
    options: ["$h = \\dfrac{3V}{\\pi r^2}$", "$h = \\dfrac{V}{3\\pi r^2}$", "$h = \\dfrac{V}{\\pi r}$", "$h = 3V \\pi r^2$"]
    correct: 0
    explain: 'Multiply by $3$: $3V = \pi r^2 h$. Divide by $\pi r^2$: $h = \dfrac{3V}{\pi r^2}$.'
---

## What you should know by now

If you've worked through P1 to P5 you can:

- Solve **linear equations** in one unknown using the four basic moves.
- Solve **fractional equations** by clearing the denominators (and check for extraneous roots).
- Solve **simultaneous equations** by elimination or substitution; recognise the geometric meaning as line intersections.
- Solve **quadratic equations** by factorising, completing the square, or the quadratic formula; classify by discriminant.
- **Change the subject** of a formula, including cases where the new subject appears twice.

## Marking patterns at a glance

This sub-topic is the spine of every algebra-flavoured Cambridge question. Marks usually run:

- **B1** for a single-step linear equation.
- **M1 + A1** for a 2-mark equation (one method step, one accuracy).
- **M1, M1, A1** for simultaneous equations (set-up, solve for one variable, full pair).
- **M1, A1** for "make $X$ the subject" (method step, final form).
- **M1, M1, A1** for the quadratic formula (correct discriminant, correct numerator, simplified surd answer).

The trap markers Cambridge uses repeatedly:

- A negative or fractional solution that students round or reject.
- Forgetting the $\pm$ on a square root.
- Stopping at one variable in simultaneous equations.
- Failing to factor when the new subject appears twice in a "change the subject" problem.

## Worked example: across multiple parts

A rectangle has perimeter $20$ cm and area $24$ cm². Find the dimensions.

Let length $= L$, width $= W$.

**Step 1: Set up two equations.**

$$2L + 2W = 20 \quad\Rightarrow\quad L + W = 10$$

$$LW = 24$$

**Step 2: Substitute.** From the first, $W = 10 - L$. Plug into the second:

$$L(10 - L) = 24$$

**Step 3: Rearrange to standard quadratic form.**

$$10L - L^2 = 24$$

$$L^2 - 10L + 24 = 0$$

**Step 4: Factorise.**

$$(L - 4)(L - 6) = 0$$

$$L = 4 \;\;\text{or}\;\; L = 6$$

**Step 5: Find $W$ for each.** $L = 4 \Rightarrow W = 6$; $L = 6 \Rightarrow W = 4$. Same rectangle, just labelled differently.

**Answer:** dimensions $\boxed{4 \text{ cm} \times 6 \text{ cm}}$. **[M1 for the equations; M1 for the substitution; A1 for the values]**

Full marks $= 3$.

## Quick reference

- **Linear:** isolate $x$ via four moves.
- **Fractional:** multiply by denominators to clear, then solve.
- **Simultaneous:** elimination, substitution, or scale-and-eliminate.
- **Quadratic:** factorise, complete the square, or formula. Discriminant tells you the number of roots.
- **Change subject:** undo operations in reverse order; factor when the subject appears twice.

## Your turn: full quiz

The widget below is a mixed quiz drawing from all five parts.
