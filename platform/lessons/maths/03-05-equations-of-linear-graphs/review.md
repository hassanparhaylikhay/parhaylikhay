---
title: Review & practice
checks:
  - q: 'Find the equation of the line through $(0, 4)$ with gradient $-2$.'
    options: ["$y = -2x + 4$", "$y = 2x - 4$", "$y = -2x - 4$", "$y = 4x - 2$"]
    correct: 0
    explain: 'Point on y-axis → $c = 4$. So $y = -2x + 4$.'
  - q: 'Find the equation of the line through $(2, 7)$ with gradient $3$.'
    options: ["$y = 3x + 1$", "$y = 3x + 7$", "$y = 3x - 1$", "$y = 7x + 3$"]
    correct: 0
    explain: '$7 = 3(2) + c \Rightarrow c = 1$. So $y = 3x + 1$.'
  - q: 'Find the equation of the line through $(1, -2)$ and $(4, 4)$.'
    options: ["$y = 2x - 4$", "$y = 2x + 2$", "$y = -2x$", "$y = 3x - 5$"]
    correct: 0
    explain: '$m = \dfrac{4 - (-2)}{4 - 1} = \dfrac{6}{3} = 2$. Then $-2 = 2(1) + c \Rightarrow c = -4$. So $y = 2x - 4$.'
  - q: 'Find the equation of the line through $(2, 5)$ and $(2, -1)$.'
    options: ["$x = 2$", "$y = 2$", "$y = 5$", "$y = -x + 7$"]
    correct: 0
    explain: 'Both points have $x = 2$ - vertical line $x = 2$.'
  - q: 'A line passes through $(3, 5)$ with gradient $0$. Its equation is...'
    options: ["$y = 5$", "$x = 3$", "$y = 3x + 5$", "$y = 3$"]
    correct: 0
    explain: 'Gradient $0$ → horizontal line. Through $(3, 5)$ means $y = 5$.'
  - q: 'A line passes through $(-2, 4)$ and is undefined in gradient. Its equation is...'
    options: ["$y = 4$", "$x = -2$", "$y = -2x$", "undefined"]
    correct: 1
    explain: 'Undefined gradient → vertical line. Through $(-2, 4)$ means $x = -2$.'
---

## What you should know by now

If you've worked through P1 to P2 you can:

- Find the equation of a line given **gradient + point** (substitute into $y = mx + c$, solve for $c$).
- Find the equation of a line given **two points** (compute $m$ first, then $c$).
- Recognise vertical and horizontal special cases ($x = k$ and $y = k$).

## Marking patterns at a glance

For "gradient + point":

- **M1** for substituting into $y = mx + c$.
- **A1** for the final equation.

For "two points":

- **M1** for the gradient calculation.
- **M1** for substituting into $y = mx + c$.
- **A1** for the final equation.

## Worked example

A line passes through $A(-2, -1)$ and $B(4, 11)$.

(a) Find the gradient of $AB$.

(b) Find the equation of $AB$ in the form $y = mx + c$.

**Step 1 (a, gradient).**

$$m = \dfrac{11 - (-1)}{4 - (-2)} = \dfrac{12}{6} = 2$$

**Step 2 (b, substitute point $A$).**

$$-1 = 2(-2) + c$$

**Step 3 (b, solve for $c$).**

$$-1 = -4 + c \;\Rightarrow\; c = 3$$

**Answer (a):** $m = 2$. **[M1 substitute; A1 simplify]**

**Answer (b):** $y = 2x + 3$. **[M1 substitute; A1 final]**

Full marks $= 4$.

## Quick reference

- Gradient + point: substitute into $y = mx + c$ → solve for $c$.
- Two points: gradient first, then substitute → solve for $c$.
- Vertical: $x = k$. Horizontal: $y = k$.

## Practice: build the line that fits

The yellow dot below is the point your line must pass through, and the target gradient is given. Slide $m$ and $c$ until the blue line has the right gradient AND covers the dot. Hit "New challenge" for a fresh target.

<iframe src="/widgets/match-trainer.html?mode=line_grad" style="width:100%;max-width:696px;height:560px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Your turn: full quiz

The widget below is a mixed quiz drawing from both parts.
