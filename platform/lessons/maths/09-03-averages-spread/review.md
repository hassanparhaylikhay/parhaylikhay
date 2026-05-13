---
title: '9.3 review: averages and measures of spread'
checks:
  - q: 'For data $2, 3, 5, 7, 9, 9, 10$, the mean is...'
    options: ["$45 / 7 \\approx 6.43$", "$7$", "$9$", "$10$"]
    correct: 0
    explain: 'Sum = $45$. $n = 7$. Mean $= 45 / 7 \approx 6.43$.'
  - q: 'For the same data ($2, 3, 5, 7, 9, 9, 10$), the median is...'
    options: ["$7$", "$5$", "$9$", "$6.43$"]
    correct: 0
    explain: 'Sorted: $2, 3, 5, 7, 9, 9, 10$. $n=7$, middle = 4th value = $7$.'
  - q: 'For the same data, the mode is...'
    options: ["$9$ (appears twice)", "$7$ (the median)", "$2$ (smallest)", "no mode"]
    correct: 0
    explain: '$9$ appears twice; every other value appears once. So mode = $9$.'
  - q: 'Range of the same data...'
    options: ["$8$", "$10$", "$2$", "$45$"]
    correct: 0
    explain: 'Range $= 10 - 2 = 8$.'
  - q: 'Estimated mean from a grouped table with $\sum fx = 540$ and $\sum f = 30$ is...'
    options: ["$18$", "$30$", "$540$", "$\\tfrac{30}{540}$"]
    correct: 0
    explain: 'Estimated mean $= \dfrac{\sum fx}{\sum f} = \dfrac{540}{30} = 18$.'
---

## What you learned in 9.3

- **Mean** $= \dfrac{\sum x}{n}$. Sensitive to outliers.
- **Median** = middle of sorted data; for even $n$, average the two middles.
- **Mode** = most common value. None if every value is unique.
- **Range** = max $-$ min. Measures spread.
- **Estimated mean from grouped data**: $\dfrac{\sum f \cdot x}{\sum f}$ where $x$ is the class midpoint.
- **Modal class** = the class (interval) with the highest frequency.

## Comprehensive worked example

A frequency table shows the time (in minutes) taken by $40$ students to finish a maths puzzle:

| Time ($t$, min) | Midpoint | Frequency |
|--|--|--|
| $0 \leq t < 10$ | $5$ | $4$ |
| $10 \leq t < 20$ | $15$ | $9$ |
| $20 \leq t < 30$ | $25$ | $14$ |
| $30 \leq t < 40$ | $35$ | $8$ |
| $40 \leq t < 50$ | $45$ | $5$ |

(a) Write the modal class.

(b) Calculate the estimated mean.

(c) Two students who finished in $0$-$10$ minutes are added (raising their class to $6$). Without recalculating, describe what happens to the mean: does it go UP, DOWN, or stay the same?

**Part (a).** Modal class = $20 \leq t < 30$ (frequency $14$, the largest). $\boxed{20 \leq t < 30}$. **[B1]**

**Part (b).** Compute $f \cdot x$:

$5 \times 4 = 20$, $15 \times 9 = 135$, $25 \times 14 = 350$, $35 \times 8 = 280$, $45 \times 5 = 225$.

$\sum f \cdot x = 20 + 135 + 350 + 280 + 225 = 1010$. $\sum f = 40$.

Estimated mean $= 1010 / 40 = 25.25$ minutes. $\boxed{25.25}$ minutes. **[M1 for $\sum fx$; M1 for dividing by $\sum f$; A1 for $25.25$]**

**Part (c).** Two extra students at the LOW end of the data set means the new mean will be LOWER than $25.25$. Adding short times below the mean drags the average down. $\boxed{\text{the mean goes DOWN}}$. **[B1]**

Full marks $= 5$.

## Comparison-of-averages flowchart

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">PICK AN AVERAGE</div>
  <div style="display:flex;gap:10px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:140px;padding:12px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04)">
      <div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:6px">MEAN</div>
      <div style="font-size:13px;color:#f0eeea;line-height:1.5">numeric · no outliers · need every value</div>
    </div>
    <div style="flex:1;min-width:140px;padding:12px;border:1.5px solid rgba(255,70,112,0.4);border-radius:8px;background:rgba(255,70,112,0.04)">
      <div style="color:#ff4670;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:6px">MEDIAN</div>
      <div style="font-size:13px;color:#f0eeea;line-height:1.5">numeric · has outliers · need a robust typical value</div>
    </div>
    <div style="flex:1;min-width:140px;padding:12px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04)">
      <div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:6px">MODE</div>
      <div style="font-size:13px;color:#f0eeea;line-height:1.5">categorical · most popular question</div>
    </div>
  </div>
</div>

## Quick summary

- Three averages: mean, median, mode. Pick the one that matches the data and the question.
- Range = max $-$ min, the simplest measure of spread.
- For grouped data: estimated mean = $\sum fx / \sum f$, modal class = highest-frequency interval.
