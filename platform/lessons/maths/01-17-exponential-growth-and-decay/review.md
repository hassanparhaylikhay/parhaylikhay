---
title: Review & practice
checks:
  - q: 'A population of $30\,000$ grows $3\%$ per year. After $4$ years (to nearest whole)?'
    options: ["$33\\,600$", "$33\\,765$", "$34\\,000$", "$120\\,000$"]
    correct: 1
    explain: '$30\,000 \times 1.03^4 = 30\,000 \times 1.12551 \approx 33\,765$.'
  - q: '\$10\,000 invested at $5\%$ compound interest for $6$ years. Final value?'
    options: ["\\$13\\,000.00", "\\$13\\,400.96", "\\$13\\,500.00", "\\$60\\,000.00"]
    correct: 1
    explain: '$10\,000 \times 1.05^6 = 10\,000 \times 1.34010 = 13\,400.96$, i.e. \$13\,400.96.'
  - q: 'A car worth \$25\,000 depreciates $15\%$ per year. Value after $3$ years (to nearest dollar)?'
    options: ["\\$15\\,353", "\\$17\\,000", "\\$18\\,750", "\\$21\\,250"]
    correct: 0
    explain: '$25\,000 \times 0.85^3 = 25\,000 \times 0.614125 \approx 15\,353$, i.e. \$15\,353.'
  - q: 'A radioactive sample halves every $2$ years. From $128$ g, how much remains after $10$ years?'
    options: ["$0$ g", "$2$ g", "$4$ g", "$8$ g"]
    correct: 2
    explain: '$10$ years $= 5$ half-lives. $128 \times (\tfrac{1}{2})^5 = 128 \times \tfrac{1}{32} = 4$ g.'
  - q: 'A bacteria culture of $200$ doubles every hour. After $5$ hours?'
    options: ["$1\\,000$", "$3\\,200$", "$6\\,400$", "$10\\,000$"]
    correct: 2
    explain: '$200 \times 2^5 = 200 \times 32 = 6\,400$.'
  - q: 'A medicine clears $25\%$ from the bloodstream each hour. From $400$ mg, how much remains after $4$ hours?'
    options: ["$0$ mg", "$100$ mg", "$127$ mg", "$300$ mg"]
    correct: 2
    explain: 'Multiplier $0.75$. $400 \times 0.75^4 = 400 \times 0.31641 \approx 127$ mg.'
---

You've now covered exponential growth and decay across the main contexts: investment, population, depreciation, half-life, doubling, and medicine clearance. The single formula $\textcolor{#0fee89}{A} = \textcolor{#fff067}{P}(1 \pm \tfrac{\textcolor{#00abfa}{r}}{100})^{\textcolor{#ff822c}{T}}$ handles them all.

## The skills you should have

- **Identify growth or decay** from the question wording.
- **Apply the formula** in one step, not period by period.
- **Use the right multiplier**: $1 + \tfrac{r}{100}$ for growth, $1 - \tfrac{r}{100}$ for decay.
- **Doubling and half-life** problems: count the periods first, then use $A = P \times d^N$ where $d$ is the multiplier per period.
- **"After how long?" questions**: try whole-number $T$ values until the inequality flips.

## Marking patterns

| Question style | Marks | Notes |
|---|---|---|
| "Find $A$ after $T$ periods" | 2 | M1 for the formula with values, A1 for the answer |
| "Compound interest after $T$ years" | 2 | M1 for $1.0R^T$ form, A1 for the value to 2 d.p. |
| "Depreciation after $T$ years" | 2 | M1 for $0.85^T$ (or similar), A1 for the value |
| "How much remains after $N$ half-lives" | 1–2 | M1 for $(\tfrac{1}{2})^N$, A1 for the answer |
| "When does it first exceed/drop below $X$" | 2 | M1 for trying values, A1 for the right whole period |

## The single biggest mistake

**Computing period by period instead of using the power.** For $T = 10$ years, students sometimes multiply by $1.05$ ten times. That works but is slow and prone to rounding errors. Use $1.05^{10}$ in one step and let the calculator do it.

## Final check

Six mixed problems covering growth, decay, half-life, doubling, depreciation, and medicine clearance.
