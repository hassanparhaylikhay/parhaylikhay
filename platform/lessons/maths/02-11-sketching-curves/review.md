---
title: Review & practice
checks:
  - q: 'For $y = -3x^2 + 12x - 9$, the parabola opens...'
    options: ["upward", "downward", "sideways", "depends"]
    correct: 1
    explain: 'Coefficient of $x^2$ is $-3 < 0$, so opens downward.'
  - q: 'The y-intercept of $y = 2x^3 - 5x^2 + 4$ is at...'
    options: ["$(0, 0)$", "$(0, 2)$", "$(0, -5)$", "$(0, 4)$"]
    correct: 3
    explain: 'Set $x = 0$: $y = 4$. Y-intercept is the constant term.'
  - q: 'In completed-square form $y = 2(x + 3)^2 - 7$, the turning point is at...'
    options: ["$(3, -7)$", "$(-3, -7)$", "$(-3, 7)$", "$(3, 7)$"]
    correct: 1
    explain: '$y = a(x - h)^2 + k$ has turning point $(h, k)$. Here $h = -3$, $k = -7$.'
  - q: 'A cubic $y = (x - 1)(x + 2)^2$ at $x = -2$ does what to the x-axis?'
    options: ["crosses through", "touches and bounces back", "becomes vertical", "has an asymptote"]
    correct: 1
    explain: 'Repeated root → curve touches the x-axis and bounces back, instead of crossing through.'
  - q: 'The asymptotes of $y = \dfrac{1}{x - 2} + 4$ are at...'
    options: ["$x = 2, y = 4$", "$x = -2, y = 4$", "$x = 2, y = -4$", "$x = 0, y = 0$"]
    correct: 0
    explain: 'Vertical asymptote where denominator = 0, so $x = 2$. Horizontal asymptote at the constant shift, $y = 4$.'
  - q: 'For $y = 5 \times 0.8^x + 2$, the asymptote is at...'
    options: ["$y = 0$", "$y = 2$", "$y = 5$", "$y = 0.8$"]
    correct: 1
    explain: 'The shift $b = 2$ moves the horizontal asymptote from $y = 0$ to $y = 2$.'
  - q: 'For $y = 3 \times 2^x$, as $x \to -\infty$, $y$ tends to...'
    options: ["$\\infty$", "$-\\infty$", "$0$", "$3$"]
    correct: 2
    explain: '$2^x \to 0$ as $x \to -\infty$, so $y = 3 \times 2^x \to 0$.'
  - q: 'A quadratic $y = ax^2 + bx + c$ has no real roots when...'
    options: ["$b^2 - 4ac > 0$", "$b^2 - 4ac = 0$", "$b^2 - 4ac < 0$", "$a = 0$"]
    correct: 2
    explain: 'Negative discriminant → no real roots. Curve doesn''t touch the x-axis.'
---

## What you should know by now

If you've worked through P1 to P3 you can:

- Sketch a linear graph from two intercepts.
- Sketch a quadratic showing shape, y-intercept, x-intercepts (or "no real roots"), and turning point via completing the square.
- Sketch a cubic from factored form, identifying roots (including repeated roots that touch the axis), and the y-intercept.
- Sketch a reciprocal $y = \dfrac{a}{x} + b$ with the asymptotes $x = 0$ and $y = b$ and the single x-intercept.
- Sketch an exponential $y = a \times r^x + b$ identifying the y-intercept $(0, a+b)$, the horizontal asymptote $y = b$, and growth vs decay from $r$.

## Marking patterns at a glance

A typical Cambridge sketch question awards a separate mark per feature:

- **B1** for the correct shape (U / ∩ / S / hyperbola / exponential).
- **B1** for each intercept marked (x or y).
- **B1** for the turning point of a quadratic (from completing the square).
- **B1** for each asymptote (reciprocal or exponential).
- **Max 3 marks** typically if the sketch shape is wrong (Cambridge caps the awarded marks).

The features take priority over precision. A neat freehand sketch with all features clearly labelled scores full marks; a precisely-plotted sketch with no labels scores zero.

## Worked example: complete sketch

Sketch $y = (x - 1)(x + 3)$, showing y-intercept, x-intercepts, and turning point.

**Step 1: shape.** Expand: $y = x^2 + 2x - 3$. Coefficient of $x^2$ is $+1$, so U-shape.

**Step 2: y-intercept.** $x = 0 \Rightarrow y = -3$. Point $(0, -3)$.

**Step 3: x-intercepts.** Already factored. Roots: $x = 1$ and $x = -3$.

**Step 4: turning point by completing the square.**

$$y = x^2 + 2x - 3 = (x + 1)^2 - 1 - 3 = (x + 1)^2 - 4$$

Turning point: $(-1, -4)$.

**Sketch.** A U-shape passing through $(-3, 0)$, $(1, 0)$, $(0, -3)$, with minimum at $(-1, -4)$.

**Answer:** Shape: U. Y-intercept $(0, -3)$. X-intercepts $(-3, 0)$ and $(1, 0)$. Turning point $(-1, -4)$. **[B1 shape; B1 y-intercept; B1 x-intercepts; B1 turning point]**

Full marks $= 4$.

## Quick reference

- **Linear**: two intercepts, ruler.
- **Quadratic**: shape from sign of $a$; y-intercept = $c$; x-intercepts by factoring/formula; turning point by completing the square.
- **Cubic** (factored): roots from each bracket; repeated root → touches; y-intercept by multiplying constants.
- **Reciprocal** $\dfrac{a}{x} + b$: asymptotes $x = 0$ and $y = b$; one x-intercept.
- **Exponential** $a \times r^x + b$: y-intercept $(0, a + b)$; asymptote $y = b$; $r > 1$ growth, $r < 1$ decay.

## Practice: match the parabola

The faded yellow parabola has its turning point at some $(h, k)$. Slide your $h$ and $k$ until the blue parabola sits on top. Once you can read the vertex off the graph quickly, sketching one in an exam takes seconds.

<iframe src="/widgets/match-trainer.html?mode=quad" style="width:100%;max-width:696px;height:560px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

## Your turn: full quiz

The widget below is a mixed quiz drawing from all three parts.
