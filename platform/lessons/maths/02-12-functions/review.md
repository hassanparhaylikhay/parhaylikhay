---
title: Review & practice
checks:
  - q: 'For $f(x) = 2x + 9$, what is $f(-3)$?'
    options: ["$3$", "$-15$", "$15$", "$-3$"]
    correct: 0
    explain: '$f(-3) = 2(-3) + 9 = -6 + 9 = 3$.'
  - q: 'The domain of $f(x) = \sqrt{x - 4}$ is...'
    options: ["all real $x$", "$x \\geq 4$", "$x > 4$", "$x \\geq 0$"]
    correct: 1
    explain: 'Need $x - 4 \geq 0$, i.e. $x \geq 4$, for the square root to be real.'
  - q: 'For $f(x) = 5x - 2$, what is $f^{-1}(x)$?'
    options: ["$\\dfrac{x + 2}{5}$", "$\\dfrac{x - 2}{5}$", "$5x + 2$", "$\\dfrac{1}{5x - 2}$"]
    correct: 0
    explain: 'Swap and solve: $x = 5y - 2 \Rightarrow y = \dfrac{x + 2}{5}$.'
  - q: 'For $f(x) = x + 4$ and $g(x) = 2x - 1$, what is $gf(x)$?'
    options: ["$2x + 3$", "$2x + 7$", "$2x - 1$", "$2(x + 4)$"]
    correct: 1
    explain: '$gf(x) = g(x + 4) = 2(x + 4) - 1 = 2x + 8 - 1 = 2x + 7$.'
  - q: 'For $f(x) = 3x$ and $g(x) = x + 1$, what is $fg(2)$?'
    options: ["$7$", "$9$", "$5$", "$6$"]
    correct: 1
    explain: '$fg(2) = f(g(2)) = f(3) = 9$.'
  - q: 'In $gf(x)$, which function is applied first?'
    options: ["$g$", "$f$", "both at once", "neither"]
    correct: 1
    explain: 'The function CLOSEST to $x$ goes first. So $f$ is applied first, then $g$.'
  - q: 'The graph of $f^{-1}$ is the reflection of the graph of $f$ in...'
    options: ["the x-axis", "the y-axis", "the line $y = x$", "the origin"]
    correct: 2
    explain: 'Inverse swaps x and y, which is the geometric reflection in $y = x$.'
  - q: 'For $f(x) = \dfrac{1}{x + 1}$, the domain excludes...'
    options: ["$x = 0$", "$x = 1$", "$x = -1$", "no value"]
    correct: 2
    explain: 'Denominator zero when $x + 1 = 0 \Rightarrow x = -1$.'
---

## What you should know by now

If you've worked through P1 to P3 you can:

- Read function notation $f(x)$ and evaluate $f(a)$ by substitution.
- State the domain (allowed inputs) and range (resulting outputs) of standard functions, including domain restrictions from $\dfrac{1}{0}$ and $\sqrt{\text{negative}}$.
- Find $f^{-1}(x)$ using the recipe: write $y = f(x)$, swap $x$ and $y$, solve, relabel.
- Read composite-function notation correctly: in $gf(x)$, the function next to $x$ ($f$) is applied first.
- Compute $gf(x)$, $fg(x)$, $ff(x)$ by careful substitution.

## Marking patterns at a glance

A typical Cambridge function question looks like:

- **B1** for evaluating $f(a)$ correctly (single substitution).
- **M1 + A1** for finding $f^{-1}(x)$ (M1 for swapping or for solving, A1 for the final form).
- **M1 + A1** for $gf(x)$ (M1 for substituting $f(x)$ into $g$, A1 for simplification).
- **M1 + A1** for stating a domain restriction with reason.

The traps Cambridge uses repeatedly:

- Reading $gf(x)$ as "apply $g$ then $f$". The function next to $x$ goes first.
- Treating $f^{-1}(x)$ as $\dfrac{1}{f(x)}$. They are not the same.
- Computing $g(f(x))$ but writing the answer for $f(g(x))$ (reading-order slip).
- Forgetting brackets when substituting. $g(f(x)) = g(x+3)$ becomes $2(x+3)$, not $2x+3$.

## Worked example

$f(x) = 2x - 1$ and $g(x) = \dfrac{x + 4}{3}$.

(a) Find $f(5)$ and $g(2)$.

(b) Find $f^{-1}(x)$.

(c) Find $fg(x)$, simplifying.

(d) Show that $f(f^{-1}(x)) = x$.

**Step 1 (a, first).** $f(5) = 2(5) - 1 = 9$.

**Step 2 (a, second).** $g(2) = \dfrac{2 + 4}{3} = \dfrac{6}{3} = 2$.

**Step 3 (b, write).** Set $y = 2x - 1$.

**Step 4 (b, swap).** Swap $x$ and $y$: $x = 2y - 1$.

**Step 5 (b, solve).** $2y = x + 1$, so $y = \dfrac{x + 1}{2}$.

**Step 6 (c, substitute).** $fg(x) = f(g(x)) = f\!\left(\dfrac{x + 4}{3}\right) = 2 \times \dfrac{x + 4}{3} - 1$.

**Step 7 (c, simplify).** $\dfrac{2x + 8}{3} - 1 = \dfrac{2x + 8 - 3}{3} = \dfrac{2x + 5}{3}$.

**Step 8 (d, verify).** $f(f^{-1}(x)) = f\!\left(\dfrac{x + 1}{2}\right) = 2 \times \dfrac{x + 1}{2} - 1 = (x + 1) - 1 = x$. ✓

**Answer (a):** $f(5) = 9$ and $g(2) = 2$. **[B1; B1]**

**Answer (b):** $f^{-1}(x) = \dfrac{x + 1}{2}$. **[M1 swap; A1]**

**Answer (c):** $fg(x) = \dfrac{2x + 5}{3}$. **[M1 substitute; A1]**

**Answer (d):** Verified. **[B1]**

Full marks $= 7$.

## Quick reference

- $f(x) =$ rule. $f(a)$ = substitute $a$ for $x$.
- Domain = inputs; range = outputs. Watch for $\dfrac{1}{0}$ and $\sqrt{\text{negative}}$.
- $f^{-1}$: write $y = f(x)$ → swap $x$ and $y$ → solve → relabel.
- $gf(x) = g(f(x))$: apply $f$ first, $g$ second. Brackets when substituting.
- Graph of $f^{-1}$: reflection of $f$ in $y = x$.

## Practice: match the inverse

The yellow line is $f(x)$. Slide $m$ and $c$ in your blue $g(x) = mx + c$ until $g$ equals $f^{-1}$ — the blue line should be the mirror image of the yellow one across the dashed $y = x$ line.

<iframe src="/widgets/match-trainer.html?mode=inverse" style="width:100%;max-width:696px;height:560px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Your turn: full quiz

The widget below is a mixed quiz drawing from all three parts.
