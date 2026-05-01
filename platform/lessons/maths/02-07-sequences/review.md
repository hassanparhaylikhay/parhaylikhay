---
title: Review & practice
checks:
  - q: 'Continue the sequence $7, 11, 15, 19, \dots$.'
    options: ["$23$", "$22$", "$25$", "$27$"]
    correct: 0
    explain: 'Common difference $4$. Next term: $19 + 4 = 23$.'
  - q: 'Find the nth term of $1, 4, 7, 10, \dots$.'
    options: ["$3n - 2$", "$3n + 1$", "$n + 3$", "$4n - 3$"]
    correct: 0
    explain: 'Common difference $3$, first term $1$. nth term: $3n + k$ at $n=1$ gives $3 + k = 1$, so $k = -2$. Answer: $3n - 2$.'
  - q: 'Find the nth term of $0, 3, 8, 15, 24, \dots$.'
    options: ["$n^2 - 1$", "$n^2 + 1$", "$2n^2$", "$n^2 + n$"]
    correct: 0
    explain: 'Differences: $3, 5, 7, 9$. Second differences: $2$ : constant. $a = 1$. $T_1 = 1 + b + c = 0$ → $b + c = -1$. $T_2 = 4 + 2b + c = 3$ → $2b + c = -1$. Solving: $b = 0$, $c = -1$. nth term: $n^2 - 1$.'
  - q: 'The 6th term of the geometric sequence $5, 10, 20, 40, \dots$ is...'
    options: ["$80$", "$160$", "$200$", "$320$"]
    correct: 1
    explain: '$a = 5$, $r = 2$. $T_6 = 5 \cdot 2^{6-1} = 5 \cdot 32 = 160$.'
  - q: 'In a Fibonacci-like sequence $1, 4, 5, 9, 14, \dots$, the next term is...'
    options: ["$23$", "$19$", "$28$", "$20$"]
    correct: 0
    explain: 'Each term is the sum of the previous two. $9 + 14 = 23$.'
  - q: 'The 12th triangular number is...'
    options: ["$66$", "$72$", "$78$", "$90$"]
    correct: 2
    explain: '$T_n = \dfrac{n(n+1)}{2}$. $T_{12} = \dfrac{12 \cdot 13}{2} = 78$.'
  - q: 'A linear sequence has nth term $4n - 1$. Which position has the term $99$?'
    options: ["$n = 25$", "$n = 24$", "$n = 26$", "$n = 100$"]
    correct: 0
    explain: 'Set $4n - 1 = 99$, so $4n = 100$ and $n = 25$.'
  - q: 'A quadratic sequence has constant second difference of $4$. The coefficient of $n^2$ in its nth term is...'
    options: ["$4$", "$2$", "$8$", "$\\dfrac{1}{2}$"]
    correct: 1
    explain: 'For $T_n = an^2 + bn + c$, the second difference is $2a$. So $2a = 4$ and $a = 2$.'
---

## What you should know by now

If you've worked through P1 to P4 you can:

- Continue any sequence by spotting its term-to-term rule.
- Classify a sequence as **linear**, **quadratic**, **geometric**, or **Fibonacci-like** from its differences or ratios.
- Find the nth term of a linear sequence as $T_n = jn + k$.
- Find the nth term of a quadratic sequence as $T_n = an^2 + bn + c$ via second-difference + simultaneous equations.
- Use the geometric formula $T_n = ar^{n-1}$ to compute any term.
- Recognise standard sequences: square ($n^2$), cube ($n^3$), triangular ($\tfrac{n(n+1)}{2}$).

## Marking patterns at a glance

This sub-topic is tested on Paper 1 and Paper 2 directly:

- **B1** for "next term" or "term-to-term rule".
- **M1 + A1** for nth-term of a linear sequence.
- **M1, M1, A1** for nth-term of a quadratic sequence (find $a$ from second differences, set up simultaneous, solve).
- **M1 + A1** for "find the $k$-th term" using a given formula (substitute and evaluate).
- **M1 + A1** for "find the position of term value $V$" (set formula = V, solve).

The trap markers Cambridge uses repeatedly:

- Confusing first and second differences.
- Off-by-one in geometric formula ($r^{n-1}$ vs $r^n$).
- Forgetting the formula must give $T_1$ at $n = 1$.

## Worked example: a Cambridge-style 3-marker

The sequence $4, 11, 22, 37, 56, \dots$ has nth term $T_n = an^2 + bn + c$. Find $a$, $b$, and $c$.

**Step 1: Differences.**
- First: $7, 11, 15, 19$.
- Second: $4, 4, 4$. Constant.

$a = 4 / 2 = 2$.

**Step 2: Set up the simultaneous equations.**
- $T_1 = 2 + b + c = 4$, so $b + c = 2$.
- $T_2 = 8 + 2b + c = 11$, so $2b + c = 3$.

**Step 3: Solve.** Subtract: $b = 1$. Then $c = 1$.

**Answer:** $a = 2$, $b = 1$, $c = 1$. So $\boxed{T_n = 2n^2 + n + 1}$. **[M1 for $a$; M1 for the simultaneous; A1 for the formula]**

Full marks $= 3$.

## Quick reference

- **Linear**: constant 1st difference. $T_n = jn + k$.
- **Quadratic**: constant 2nd difference $D_2$. $a = D_2 / 2$. Two simultaneous for $b, c$.
- **Geometric**: constant ratio $r$. $T_n = ar^{n-1}$.
- **Fibonacci**: each = sum of previous two. Work term-by-term.
- Standard forms: $n^2$, $n^3$, $\dfrac{n(n+1)}{2}$.

## Your turn: full quiz

The widget below is a mixed quiz drawing from all four parts.
