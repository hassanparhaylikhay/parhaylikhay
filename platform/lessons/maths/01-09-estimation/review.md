---
title: Review & practice
checks:
  - q: 'Round $0.039\,75$ to $3$ decimal places.'
    options: ["$0.040$", "$0.039$", "$0.04$", "$0.039\\,8$"]
    correct: 0
    explain: 'Cut at 3 d.p.: $0.039\,|\,75$. Decider $= 7$ ($\ge 5$). Round up the $9$, which carries: $0.039 \to 0.040$. Keep the trailing zero.'
  - q: 'Round $7\,398$ to $2$ significant figures.'
    options: ["$7\\,300$", "$7\\,400$", "$74$", "$7\\,000$"]
    correct: 1
    explain: 'Cut at 2 s.f.: $73\,|\,98$. Decider $= 9$ ($\ge 5$). Round up: $73 \to 74$. Pad: $7\,400$.'
  - q: 'Round $0.000\,508\,3$ to $2$ s.f.'
    options: ["$0.000\\,5$", "$0.000\\,51$", "$0.000\\,50$", "$0.000\\,508$"]
    correct: 1
    explain: '1st s.f. is $5$, 2nd is $0$. Cut: $0.000\,50\,|\,83$. Decider $= 8$ ($\ge 5$). Round up: $0.00050 \to 0.00051$.'
  - q: 'Estimate $\dfrac{38.7 \times 4.21}{1.97}$ by rounding to $1$ s.f.'
    options: ["$\\approx 60$", "$\\approx 80$", "$\\approx 160$", "$\\approx 200$"]
    correct: 1
    explain: '$38.7 \approx 40$, $4.21 \approx 4$, $1.97 \approx 2$. So $\tfrac{40 \times 4}{2} = \tfrac{160}{2} = 80$.'
  - q: 'A student computes $\sqrt{40.7}$ as $63.8$. What estimate exposes the error?'
    options: ["$\\sqrt{40.7} \\approx 6$", "$\\sqrt{40.7} \\approx 20$", "$\\sqrt{40.7} \\approx 0.6$", "Cannot tell"]
    correct: 0
    explain: '$40.7 \approx 36$ or $49$. $\sqrt{36} = 6$, $\sqrt{49} = 7$. So $\sqrt{40.7} \approx 6$ (actually $6.38$). The student likely typed $40.7^2$ or similar.'
  - q: 'A length is $2.4673$ cm. Round it to give an answer reasonable for a ruler measurement.'
    options: ["$2.4673$ cm", "$2.47$ cm or $2.5$ cm", "$2$ cm", "$2.46\\,73 \\times 10^0$ cm"]
    correct: 1
    explain: 'A ruler reads to 1 mm = 1 d.p., or 0.5 mm = 2 d.p. So $2.5$ or $2.47$ cm. More d.p. claims more precision than the instrument provides.'
---

You've now covered the three rounding contexts Cambridge tests: decimal places, significant figures, and estimation. Plus the meta-skill of rounding to a reasonable degree of accuracy in context (e.g. "to the nearest $1\,000$" or "give a sensible answer for a length measurement").

## The skills you should have

- **Decimal places**: count digits after the decimal point; decider rule.
- **Significant figures**: count from the first non-zero digit; pad with zeros for size.
- **Carrying** when rounding up causes a $9$ to become $10$.
- **Estimation**: round every input to $1$ s.f., compute, give answer with $\approx$.
- **Sensible accuracy**: don't claim more precision than the source data provides.

## Marking patterns

| Question style | Marks | Notes |
|---|---|---|
| "Write $5\,764$ to the nearest thousand" | 1 | B1 for $6\,000$ |
| "Round $3.847$ to 2 d.p." | 1 | B1 for $3.85$ |
| "Round $0.004\,67$ to 2 s.f." | 1 | B1 for $0.0047$ |
| "Estimate $\dots$ giving each value to 1 s.f." | 2 | M1 for the rounded values, A1 for the final estimate |
| "Round to a sensible accuracy" | 1 | B1 for any reasonable answer matching context |

## The single biggest mistake

**Successive rounding.** $12.4949$ to 2 d.p. is **$12.49$**, not $12.50$. Look at the SINGLE digit immediately after the cut; never chain $12.4949 \to 12.495 \to 12.50$. This catches students every year.

## Final check

Six mixed problems covering d.p., s.f., estimation, and sensible-accuracy judgement.
