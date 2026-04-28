---
title: Review & practice
checks:
  - q: 'A mass is $5.6$ kg correct to $1$ d.p. State the lower bound.'
    options: ["$5.0$ kg", "$5.5$ kg", "$5.55$ kg", "$5.6$ kg"]
    correct: 2
    explain: '$1$ d.p. means $\pm 0.05$. Lower: $5.6 - 0.05 = 5.55$ kg.'
  - q: 'A length is $20$ m to the nearest $5$ m. State the upper bound.'
    options: ["$20$ m", "$22.5$ m", "$25$ m", "$22$ m"]
    correct: 1
    explain: 'To nearest $5$ means $\pm 2.5$. Upper: $20 + 2.5 = 22.5$ m.'
  - q: 'For $a = 30$ and $b = 12$ (both to nearest cm), what is the upper bound of $a + b$?'
    options: ["$42$ cm", "$42.5$ cm", "$43$ cm", "$43.5$ cm"]
    correct: 2
    explain: 'Upper of a sum uses both upper bounds. $30.5 + 12.5 = 43$ cm.'
  - q: 'For $a = 30$ and $b = 12$ (both to nearest cm), what is the upper bound of $a - b$?'
    options: ["$17.5$ cm", "$18$ cm", "$18.5$ cm", "$19$ cm"]
    correct: 3
    explain: 'Upper of a difference uses $a_{\max} - b_{\min} = 30.5 - 11.5 = 19$ cm.'
  - q: 'A rectangle has $L = 6$ cm and $W = 4$ cm, both to nearest cm. What is the LOWER bound of the area?'
    options: ["$19.25$ cm²", "$24$ cm²", "$24.25$ cm²", "$29.25$ cm²"]
    correct: 0
    explain: 'Lower of product uses both at lower bound. $L_{\min} \times W_{\min} = 5.5 \times 3.5 = 19.25$ cm².'
  - q: 'Distance $= 200$ m to nearest m, time $= 25$ s to nearest s. What is the UPPER bound of speed?'
    options: ["$8.0$ m/s", "$8.18$ m/s", "$8.20$ m/s", "$8.25$ m/s"]
    correct: 1
    explain: 'Upper speed = $\tfrac{D_{\max}}{T_{\min}} = \tfrac{200.5}{24.5} = 8.18$ m/s (3 s.f.).'
---

You've now seen all four operations and their bounds rules. Cambridge mixes these freely: a question might give you the bounds of measured values and ask for the bound of a derived quantity (perimeter, area, volume, speed, density).

## The skills you should have

- **Identify the rounding unit** from the precision (nearest cm, $1$ d.p., $2$ s.f., nearest $10$).
- **Compute upper and lower bounds** of a single rounded value: stated $\pm \tfrac{u}{2}$.
- **Combine bounds for $+$ and $\times$**: same extreme on both.
- **Combine bounds for $-$ and $\div$**: opposite extreme on $b$.
- **Apply to formulae**: $L \times W$, $\tfrac{D}{T}$, $L + W$ etc.

## Marking patterns

| Question style | Marks | Notes |
|---|---|---|
| "Write the upper bound of $5.4$ cm to 1 d.p." | 1 | B1 for $5.45$ |
| "Find the lower bound of $L + W$" | 2 | M1 for $L_{\min} + W_{\min}$, A1 for the answer |
| "Find the upper bound of speed $D/T$" | 2 | M1 for $D_{\max} / T_{\min}$, A1 for the answer |
| "Find the upper and lower bounds of perimeter" | 3 | M1 for using both $L$ and $W$ at extremes; A1 each for upper and lower |

## The single biggest mistake

**Using the same extreme on the second value in subtraction or division.** For $\tfrac{D}{T}$ upper, the time must be at its **minimum**, not maximum. The intuition: dividing by a smaller number makes the result bigger. Re-read the operation and ask: "to maximise this, do I want $b$ big or small?"

## Final check

Six mixed problems covering single-value bounds, sums, differences, products, and quotients across cm, m/s, kg, and other units.
