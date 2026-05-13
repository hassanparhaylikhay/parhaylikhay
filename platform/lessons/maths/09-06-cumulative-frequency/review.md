---
title: '9.6 review: cumulative frequency diagrams'
checks:
  - q: 'A CF curve is plotted at points...'
    options: ["(upper class boundary, cumulative frequency)", "(midpoint, frequency)", "(lower class boundary, cumulative frequency)", "(midpoint, cumulative frequency)"]
    correct: 0
    explain: 'CF up to the upper boundary includes the entire class. Plot at the UPPER boundary; midpoints are for the estimated mean (9.3), not for CF.'
  - q: 'For $n = 80$, the lower quartile is read off at CF = ...'
    options: ["$20$", "$40$", "$60$", "$80$"]
    correct: 0
    explain: '$Q_1$ at $n/4 = 20$.'
  - q: 'For $n = 80$, the median is read off at CF = ...'
    options: ["$40$", "$20$", "$60$", "$80$"]
    correct: 0
    explain: 'Median at $n/2 = 40$.'
  - q: 'A CF curve''s ending point is always at...'
    options: ["(upper bound of last class, $n$)", "$(n, n)$", "$(0, 0)$", "the median"]
    correct: 0
    explain: 'By the upper bound of the last class, all data is counted. CF = $n$ at that point.'
  - q: 'The IQR is robust against outliers because it...'
    options: ["uses only the middle 50\\% of the data", "ignores the data altogether", "always equals the range", "averages the quartiles"]
    correct: 0
    explain: 'IQR = $Q_3 - Q_1$ ignores top and bottom 25\\%. Outliers at either extreme don''t change it.'
---

## What you learned in 9.6

- **Cumulative frequency** = running total of frequencies up to a point.
- **Plot** at (upper class boundary, CF). Start at (lower bound, $0$). End at (upper bound, $n$).
- **Smooth curve** through the points, only ever rising.
- **Median** at CF $= n/2$; $Q_1$ at $n/4$; $Q_3$ at $3n/4$.
- **IQR** $= Q_3 - Q_1$, robust to outliers.
- Read the curve: across from y-axis to curve, down to x-axis (or reverse for "how many less than X").

## Comprehensive worked example

The CF curve in the widget shows test scores for $60$ students.

(a) Find the median score.

(b) Find $Q_1$ and $Q_3$.

(c) Find the IQR.

(d) Estimate the number of students who scored less than $50$.

<iframe src="/widgets/cumulative-frequency-explorer.html" style="width:100%;max-width:696px;height:680px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a).** $n = 60$, median at CF $= 30$. Reading off the curve: score $\approx 38$. $\boxed{38}$. **[B1]**

**Part (b).** $Q_1$ at CF $= 15$ → score $\approx 26$. $Q_3$ at CF $= 45$ → score $\approx 49$. $\boxed{Q_1 \approx 26, Q_3 \approx 49}$. **[B1 each]**

**Part (c).** IQR $= 49 - 26 = 23$. $\boxed{23}$. **[B1]**

**Part (d).** Find $50$ on the x-axis; read up to the curve, then across to the y-axis: CF $\approx 46$. So about $46$ students scored less than $50$. $\boxed{46}$. **[B1, allowing tolerance]**

Full marks $= 5$.

The mark scheme accepts a tolerance band of about $\pm 1$ on each reading. Drawing clean lines on the diagram is essential, markers want to see the construction lines.

## Quick summary

- Build the CF column, plot at upper class boundaries, draw a smooth rising curve.
- Read median, quartiles at $n/2$, $n/4$, $3n/4$.
- IQR = $Q_3 - Q_1$, the middle-50\\% spread.
