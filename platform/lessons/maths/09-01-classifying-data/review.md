---
title: '9.1 review: classifying statistical data'
checks:
  - q: 'In a frequency table with categories A, B, C, D and frequencies $5, 8, 12, 5$, the sample size is...'
    options: ["$30$", "$5$", "$12$", "$25$"]
    correct: 0
    explain: 'Add all frequencies: $5 + 8 + 12 + 5 = 30$. That total IS the sample size.'
  - q: 'A grouped frequency table has classes $0$-$10$, $10$-$20$, $20$-$30$, $30$-$40$. The midpoint of the third class is...'
    options: ["$25$", "$20$", "$30$", "$15$"]
    correct: 0
    explain: 'Midpoint = average of bounds = $(20 + 30) / 2 = 25$. Midpoints are crucial in 9.3 for estimating the mean.'
  - q: 'A two-way table has $40$ students. Row totals (Year 10 and Year 11) are $22$ and $18$. Column totals (cricket, football) are $25$ and $15$. The grand total appears in...'
    options: ["the bottom-right corner: $40$", "the sample size column: $22$", "the cricket-Year 10 cell: $25$", "the top-left corner"]
    correct: 0
    explain: 'Grand total = bottom-right corner = sum of any margin. Here $22 + 18 = 40$ and $25 + 15 = 40$. Both work.'
  - q: 'In a two-way table, if you know any TWO of (row total, cell A, cell B in same row), you can find the third by...'
    options: ["subtraction (cell sums to row total)", "addition", "multiplication", "guessing"]
    correct: 0
    explain: 'Each row has the form: cell + cell + ... = row total. Knowing all but one means subtracting from the row total.'
  - q: 'A frequency table for "shoe size" lists sizes $5, 6, 7, 8, 9$ with frequencies $3, 5, 7, 4, 1$. The most popular shoe size is...'
    options: ["$7$ (frequency 7)", "$5$ (smallest size)", "$8$ (frequency 4)", "$3$ (smallest frequency)"]
    correct: 0
    explain: 'The MOST POPULAR (or MODAL) value is the one with the highest frequency. Size $7$ has frequency $7$, which is the largest. The mode of this data set is $7$.'
---

## What you learned in 9.1

- **Tally marks** group counts in fives. Five strokes (with diagonal) = $5$.
- **Frequency table** = categories + counts, with a total row. The total IS the sample size.
- **Grouped frequency tables** use class intervals; midpoint = $(\text{lo} + \text{hi}) / 2$.
- **Two-way tables** group items by two characteristics at once. Cells are intersections; margins are single-category totals; the corner is the grand total.
- To complete a two-way table: use row and column subtraction chains.

## Comprehensive worked example

In a school of $50$ students, the table shows preferences for cricket vs football across two age groups:

| | Cricket | Football | Total |
|-|---------|----------|-------|
| Year 10 | $11$ | $9$ | $?$ |
| Year 11 | $?$ | $?$ | $30$ |
| Total | $?$ | $24$ | $50$ |

(a) Complete the table.

(b) A student is chosen at random. Find $P(\text{plays football})$.

(c) Find $P(\text{in Year 11 AND plays cricket})$.

**Part (a).** Year 10 total = $11 + 9 = 20$. Cricket total = $50 - 24 = 26$. Year 11 cricket = $26 - 11 = 15$. Year 11 football = $24 - 9 = 15$. Check: $15 + 15 = 30$ $\checkmark$.

| | Cricket | Football | Total |
|-|---------|----------|-------|
| Year 10 | $11$ | $9$ | $20$ |
| Year 11 | $15$ | $15$ | $30$ |
| Total | $26$ | $24$ | $50$ |

**[B2 for the completed table; B1 for partial]**

**Part (b).** $P(\text{football}) = \dfrac{24}{50} = \boxed{\dfrac{12}{25}}$. **[B1]**

**Part (c).** Year 11 cricket = $15$. $P(\text{Year 11 AND cricket}) = \dfrac{15}{50} = \boxed{\dfrac{3}{10}}$. **[B1]**

Full marks $= 4$.

## Common mistakes

- **Skipping the total check.** Always confirm rows and columns add to their margins, and that both margins agree on the grand total.
- **Using the row total in $P(A)$.** Probabilities for a single category use the GRAND total, not a row total.
- **Mixing midpoint with class width.** Midpoint = average of bounds. Width = upper $-$ lower.

## Quick summary

- Frequency tables: count each category, sum to the sample size.
- Two-way tables: subtract from row/column totals to fill blanks.
- Probabilities: cell / grand total (or row total for conditional).
