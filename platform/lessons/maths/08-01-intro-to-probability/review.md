---
title: '8.1 review: introduction to probability'
checks:
  - q: 'A bag has $4$ red, $3$ blue, and $5$ yellow marbles. $P(\text{red})$ equals...'
    options: ["$\\tfrac{1}{3}$", "$\\tfrac{4}{8} = \\tfrac{1}{2}$", "$\\tfrac{4}{5}$", "$\\tfrac{1}{4}$"]
    correct: 0
    explain: 'Total $= 4 + 3 + 5 = 12$. $P(\text{red}) = \tfrac{4}{12} = \tfrac{1}{3}$. Always add ALL the groups for the denominator, then simplify.'
  - q: 'Using the same bag, $P(\text{not yellow})$ equals...'
    options: ["$\\tfrac{7}{12}$", "$\\tfrac{5}{12}$", "$\\tfrac{5}{7}$", "$\\tfrac{12}{5}$"]
    correct: 0
    explain: '$P(\text{yellow}) = \tfrac{5}{12}$, so $P(\text{not yellow}) = 1 - \tfrac{5}{12} = \tfrac{7}{12}$. Direct count agrees: $4 + 3 = 7$ non-yellow marbles out of $12$.'
  - q: 'If $P(A) = 0.62$, then $P(A'')$ equals...'
    options: ["$0.38$", "$0.62$", "$1.62$", "$-0.62$"]
    correct: 0
    explain: '$P(A'') = 1 - 0.62 = 0.38$. Decimal complement works identically: $1$ minus the given decimal.'
  - q: 'A two-way table totals $50$ students. The cricket row totals $30$. $P(\text{plays cricket})$ equals...'
    options: ["$\\tfrac{30}{50} = \\tfrac{3}{5}$", "$\\tfrac{50}{30}$", "$\\tfrac{20}{50}$", "$30$"]
    correct: 0
    explain: 'The row TOTAL gives the count for the single category. Divide by the grand total: $\tfrac{30}{50} = \tfrac{3}{5}$. Reading a single cell would give a conditional probability (an 8.3 idea).'
  - q: 'The complement method is fastest when...'
    options: ["the favourable event is hard to count directly but 'not it' is easy", "the question uses fractions", "the answer has to be more than $\\tfrac{1}{2}$", "always; never use direct counting"]
    correct: 0
    explain: '"At least one", "no greens", "fails" all mean the favourable event is a big collection of cases while the complement is tidy. Subtract from $1$ and the answer falls out fast.'
---

## What you learned in 8.1

- **Probability scale**: a number between $0$ (impossible) and $1$ (certain). Five landmark values: $0$, $\tfrac{1}{4}$, $\tfrac{1}{2}$, $\tfrac{3}{4}$, $1$.
- **Three forms**: fraction, decimal, percentage. All correct unless the question specifies.
- **Counting**: $P(A) = \dfrac{\text{favourable}}{\text{total}}$. Add ALL groups for the denominator.
- **Reading**: from a list, a table, a Venn diagram. Underline the qualifier ("at least", "more than", "not").
- **Complement**: $P(A) + P(A') = 1$. Use $1 - P(A')$ when $A'$ is easier to count.
- **Notation**: $P(A)$ for the probability of event $A$; $A'$ for the complement.

## A decision tree for single-event probability

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHAT IS THE QUESTION GIVING YOU?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">A list, table, or diagram?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">COUNT, COUNT, DIVIDE</div><div style="color:#7a7875;font-size:11px;margin-top:4px">favourable / total, then simplify</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Words like "not" / "at least" / "none"?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">USE THE COMPLEMENT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(1 - P(\text{the easier event})\)</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center;min-width:320px"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">PLACE ON THE SCALE</div><div style="color:#7a7875;font-size:11px;margin-top:4px">describe verbally and as a fraction / decimal / percent</div></div>
  </div>
</div>

Three different question shapes, three clean responses. Almost every $1$- to $3$-mark probability question on the paper sits in one of these branches.

## Three identities to lock in

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">THREE IDENTITIES, MEMORISE</div>
  <div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04);text-align:center">
      <div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">DEFINITION</div>
      <div style="font-size:15px;color:#f0eeea">\(P(A) = \dfrac{\text{favourable}}{\text{total}}\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(255,70,112,0.4);border-radius:8px;background:rgba(255,70,112,0.04);text-align:center">
      <div style="color:#ff4670;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">COMPLEMENT</div>
      <div style="font-size:15px;color:#f0eeea">\(P(A') = 1 - P(A)\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04);text-align:center">
      <div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">RANGE</div>
      <div style="font-size:15px;color:#f0eeea">\(0 \leq P(A) \leq 1\)</div>
    </div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875;text-align:center;margin-top:12px;line-height:1.5">three lines that, together, generate every answer on this page</div>
</div>

## Comprehensive worked example

A bag contains $12$ marbles: $5$ red, $4$ blue, $3$ green. A marble is chosen at random.

(a) Find $P(\text{red})$.

(b) Find $P(\text{green})$.

(c) Find $P(\text{not red})$, using the complement.

(d) Show that $P(\text{red}) + P(\text{blue}) + P(\text{green}) = 1$ and explain why this had to be true.

<iframe src="/widgets/probability-step-explorer.html?preset=review-comprehensive" style="width:100%;max-width:696px;height:620px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): $P(\text{red})$.** Total marbles $= 5 + 4 + 3 = 12$. Red marbles $= 5$.

$$P(\text{red}) = \dfrac{5}{12}$$

$\gcd(5, 12) = 1$, so this is already in lowest terms. $P(\text{red}) = \boxed{\dfrac{5}{12}}$. **[B1]**

**Part (b): $P(\text{green})$.** Green marbles $= 3$ out of $12$.

$$P(\text{green}) = \dfrac{3}{12} = \dfrac{1}{4}$$

Simplifying gives $\boxed{\dfrac{1}{4}}$. **[B1 for $\tfrac{1}{4}$ or $\tfrac{3}{12}$]**

**Part (c): $P(\text{not red})$ using the complement.**

$$P(\text{not red}) = 1 - P(\text{red}) = 1 - \dfrac{5}{12} = \dfrac{12}{12} - \dfrac{5}{12} = \dfrac{7}{12}$$

Sanity check by direct counting: non-red marbles are $4$ blue $+$ $3$ green $= 7$ out of $12$. Both methods agree. $P(\text{not red}) = \boxed{\dfrac{7}{12}}$. **[B1 for $1 - \tfrac{5}{12}$ or $\tfrac{7}{12}$]**

**Part (d): show the three sum to $1$.**

$$P(\text{red}) + P(\text{blue}) + P(\text{green}) = \dfrac{5}{12} + \dfrac{4}{12} + \dfrac{3}{12} = \dfrac{12}{12} = 1$$

Why this must be true: every marble in the bag is exactly one of red, blue, or green. The three events cover the whole sample space and have no overlap. So their probabilities have to add to $1$ (the probability of "definitely some colour"). **[B1 for the sum to $1$ with a one-line justification]**

Full marks $= 4$.

This four-part structure is the most common $4$-mark probability question on the paper. Every part is a single mark, so every part needs its working shown cleanly. No part requires more than two lines of arithmetic.

## Worked example: a fair eight-sided die

A fair eight-sided die is rolled (faces $1$ through $8$). Find:

(a) $P(\text{rolling a } 7)$.

(b) $P(\text{rolling an even number})$.

(c) $P(\text{rolling a prime number})$.

(d) $P(\text{NOT rolling a } 1)$, using the complement.

**Part (a).** One favourable face out of $8$. $P(7) = \boxed{\tfrac{1}{8}}$. **[B1]**

**Part (b).** Even faces: $2, 4, 6, 8$. Four favourable out of $8$. $P(\text{even}) = \tfrac{4}{8} = \boxed{\tfrac{1}{2}}$. **[B1]**

**Part (c).** Primes from $1$ to $8$: $2, 3, 5, 7$ ($1$ is NOT prime). Four favourable out of $8$. $P(\text{prime}) = \tfrac{4}{8} = \boxed{\tfrac{1}{2}}$. **[B1]**

**Part (d).** $P(1) = \tfrac{1}{8}$, so $P(\text{not } 1) = 1 - \tfrac{1}{8} = \tfrac{7}{8}$. So $P(\text{not 1}) = \boxed{\tfrac{7}{8}}$. **[B1]**

Full marks $= 4$.

The trap in part (c): forgetting that $1$ is not prime. Recall the definition: a prime number has exactly two distinct factors, $1$ and itself. $1$ has only one factor.

## Common mistakes across the unit

- **Answer greater than $1$**. Automatic zero. Always check the value is in $[0, 1]$.
- **Misreading the qualifier**. "At least", "more than", "less than", "at most" are NOT interchangeable.
- **Wrong denominator** (forgetting one group when adding the total).
- **Wrong subtraction direction** in the complement ($P(A) - 1$ instead of $1 - P(A)$).
- **Not simplifying** the fraction at the end.
- **Reading a single cell** in a two-way table when the question asks for a row or column total.
- **Confusing "1 is prime"** (it is not).
- **Using a percentage when "fraction" was asked for**.

## Quick summary

- **Definition**: $P(A) = \dfrac{\text{favourable}}{\text{total}}$.
- **Complement**: $P(A') = 1 - P(A)$.
- **Range**: every probability lives in $[0, 1]$.
- **The whole sample space**: $P(\Omega) = 1$.
- **All groups added** for the denominator.
- **Simplify** before circling.

Next, 8.2 looks at what happens when you actually carry out an experiment many times. The relative frequency you observe approaches the theoretical probability the more trials you do. That convergence is one of the most beautiful ideas in maths, and the next unit's spinner widget lets you SEE it happen.
