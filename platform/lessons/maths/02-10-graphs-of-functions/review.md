---
title: Review & practice
checks:
  - q: 'For $y = x^3 - 2x + 1$ at $x = -1$, what is $y$?'
    options: ["$2$", "$0$", "$-2$", "$4$"]
    correct: 0
    explain: '$y = (-1)^3 - 2(-1) + 1 = -1 + 2 + 1 = 2$.'
  - q: 'When joining plotted points on a cubic curve, you should...'
    options: ["use a ruler between consecutive points", "join with a single smooth curve", "use dashed lines", "leave them disconnected"]
    correct: 1
    explain: '"Smooth curve" — never a ruler. Cambridge mark scheme awards a separate B1 for smoothness.'
  - q: 'The graph of $y = \dfrac{a}{x}$ (with $a > 0$) has branches in...'
    options: ["all four quadrants", "Q1 and Q2", "Q1 and Q3", "Q2 and Q4"]
    correct: 2
    explain: 'When $x > 0$, $y > 0$ (Q1). When $x < 0$, $y < 0$ (Q3). Diagonal branches.'
  - q: 'For $y = 3 \times 2^x$ at $x = 0$, what is $y$?'
    options: ["$0$", "$2$", "$3$", "$6$"]
    correct: 2
    explain: '$2^0 = 1$, so $y = 3 \times 1 = 3$. The $y$-intercept is always at $a$ for $y = a \times b^x$.'
  - q: 'A graph of $y = x^2 - 2x - 3$ is drawn. The roots of $x^2 - 2x - 3 = 0$ are read from where the curve crosses...'
    options: ["the $y$-axis", "the line $y = x$", "the $x$-axis", "the origin"]
    correct: 2
    explain: 'Roots of $f(x) = 0$ are where $y = 0$, i.e. crossings of the $x$-axis.'
  - q: 'To solve $f(x) = 5$ using a graph of $y = f(x)$, draw the line...'
    options: ["$y = 5$ horizontally", "$x = 5$ vertically", "$y = x + 5$", "$y = 5x$"]
    correct: 0
    explain: 'Solutions of $f(x) = 5$ are where the curve meets the horizontal line $y = 5$.'
  - q: 'A tangent at a point on $y = x^2$ passes through $(1, -1)$ and $(3, 7)$. The gradient at that point is...'
    options: ["$2$", "$4$", "$6$", "$8$"]
    correct: 1
    explain: 'Gradient = $(7 - (-1)) / (3 - 1) = \dfrac{8}{2} = 4$.'
  - q: 'On a distance-time graph that curves, the speed at a single moment is read from the...'
    options: ["chord between two points", "tangent at that point", "$y$-intercept", "horizontal line at $y = 0$"]
    correct: 1
    explain: 'Tangent gradient = instantaneous rate. Chords give average rate over an interval.'
---

## What you should know by now

If you've worked through P1 to P5 you can:

- Build a table of values for a polynomial, plot the points correctly, and join with a single smooth curve.
- Recognise the shapes of $y = ax^n$ for $n = -2, -1, -\frac{1}{2}, \frac{1}{2}, 1, 2, 3$, and know their asymptotes.
- Sketch and interpret exponential growth and decay graphs $y = a \times b^x + c$.
- Read the roots of $f(x) = 0$ from where the curve crosses the $x$-axis.
- Solve $f(x) = k$ by drawing a horizontal line $y = k$.
- Solve a different equation $g(x) = 0$ by rearranging it into "curve = line" form, drawing the line, and reading intersections.
- Estimate the gradient at a point by drawing a tangent and computing rise/run.

## Marking patterns at a glance

This sub-topic appears on Paper 2 every series:

- **B1** for each correct missing $y$-value in a table.
- **B3FT** for plotting all points correctly (B2 for 4, B1 for 2).
- **B1** for drawing a smooth curve through correctly plotted points.
- **M2** for drawing a correctly identified line on the same axes (M1 for short or unruled).
- **A2** for all 3 intersection $x$-values within tolerance (A1 for 2 correct).
- **M1 + A1** for tangent drawn and gradient computed.

The most marks-rich pattern: **table → graph → solve via line**. A single Q22 part can be worth 8 to 10 marks.

The traps Cambridge uses:

- A ruler instead of a smooth curve : loses the smooth-curve B1.
- Wrong line drawn for a rearranged equation : usually a sign error in the rearrangement.
- Missing the third intersection on a cubic : check the entire visible domain, not just the centre.
- Gradient read from a chord, not a tangent : zero credit for that step.

## Worked example: a complete plot-and-solve problem

The function $y = x^3 - 4x^2 + 12$ is given.

(a) Complete the table:

| $x$ | $-2$ | $-1$ | $0$ | $1$ | $2$ | $3$ | $4$ |
|---|---|---|---|---|---|---|---|
| $y$ | $-12$ | $7$ | $12$ | $9$ | $4$ | $3$ | $12$ |

(All values given : in a real exam, $1$ or $2$ would be blank.)

(b) Draw the graph for $-2 \leq x \leq 4$.

(c) Use the graph to solve $x^3 - 4x^2 + 12 = 8$.

(d) Use the graph to solve $x^3 - 4x^2 + x + 4 = 0$ by drawing a suitable line.

**Step 1 (a).** Already complete. ($x = 0: y = 12$ confirms; $x = 3: y = 27 - 36 + 12 = 3$ confirms.)

**Step 2 (b).** Plot all 7 points and join smoothly. **[B3FT for plots; B1 for smooth curve]**

**Step 3 (c).** Draw $y = 8$ horizontally. Read intersections : approximately $x \approx 0.7$, $x \approx 1.6$, and $x \approx 3.7$. **[M1 for line; A2 for solutions]**

**Step 4 (d): rearrange.**

$$x^3 - 4x^2 + 12 \;=\; (x^3 - 4x^2 + 12) - (x^3 - 4x^2 + x + 4) \;=\; 8 - x$$

Draw $y = 8 - x$. Intersections give the solutions of $x^3 - 4x^2 + x + 4 = 0$.

Reading from the graph: $x \approx -0.8$, $x \approx 1.5$, $x \approx 3.3$. **[M2 for line drawn; A2 for solutions]**

**Answer:** **(c)** $x \approx 0.7, 1.6, 3.7$. **(d)** $x \approx -0.8, 1.5, 3.3$.

Full marks $= 11$.

## Quick reference

- **Tables of values**: substitute every $x$ into $y = f(x)$. Show working.
- **Plotting**: read scale; plot every point as a small cross; join with **one smooth curve**.
- **Roots of $f(x) = 0$**: $x$-axis crossings of the curve.
- **Solve $f(x) = k$**: draw $y = k$; read intersections.
- **Solve $g(x) = 0$**: rearrange to "curve = line", draw the line, read intersections.
- **Gradient at a point**: draw tangent, compute rise/run with widely-spaced points.

## Practice: match the cubic

Slide $b$ and $c$ in $y = x^3 + bx + c$ until your blue cubic covers the faded yellow target. The wiggle pattern tells you about $b$ (controls how the middle bends); the height tells you about $c$ (controls vertical shift).

<iframe src="/widgets/match-trainer.html?mode=cubic" style="width:100%;max-width:696px;height:560px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Your turn: full quiz

The widget below is a mixed quiz drawing from all five parts.
