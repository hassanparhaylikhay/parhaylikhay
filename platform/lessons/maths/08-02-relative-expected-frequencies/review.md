---
title: '8.2 review: relative and expected frequencies'
checks:
  - q: 'A coin is tossed $200$ times. Heads come up $112$ times. The relative frequency of heads is...'
    options: ["$\\tfrac{112}{200} = \\tfrac{14}{25} = 0.56$", "$\\tfrac{200}{112}$", "$0.5$", "$112$"]
    correct: 0
    explain: 'Relative frequency $= \dfrac{\text{count}}{\text{total trials}} = \dfrac{112}{200}$. $\gcd(112, 200) = 8$, so it simplifies to $\tfrac{14}{25} = 0.56$.'
  - q: 'A spinner has $P(\text{red}) = 0.4$. In $250$ spins, the expected number of reds is...'
    options: ["$100$", "$40$", "$10$", "$0.4$"]
    correct: 0
    explain: 'Expected count $= p \times n = 0.4 \times 250 = 100$. Always multiply $p$ by $n$.'
  - q: 'A die is rolled $300$ times. If the die is FAIR, the expected number of sixes is...'
    options: ["$50$", "$6$", "$300$", "$60$"]
    correct: 0
    explain: '$P(\text{six on a fair die}) = \tfrac{1}{6}$. Expected sixes $= \tfrac{1}{6} \times 300 = 50$.'
  - q: 'In a sample of $400$ spins, a four-sector spinner gives counts $95, 105, 102, 98$. The expected count assuming fair is $100$ each. The data...'
    options: ["is consistent with a fair spinner; counts are within $5$ of $100$", "shows the spinner is biased", "shows the experiment failed", "is impossible"]
    correct: 0
    explain: 'All four counts are within $5\%$ of $100$. That is well within normal random variation for a fair spinner. No reason to suspect bias.'
  - q: 'A drawing pin is dropped $50$ times and lands point-up $32$ times. Estimate $P(\text{point-up})$ and predict the count in the next $500$ drops.'
    options: ["$P \\approx 0.64$, expect $320$", "$P = 0.5$, expect $250$", "$P \\approx 0.32$, expect $160$", "$P = 1$, expect $500$"]
    correct: 0
    explain: 'Relative frequency $= \tfrac{32}{50} = 0.64$. Use this as our estimate of $p$. Then expected $= 0.64 \times 500 = 320$ point-up landings in $500$ drops.'
---

## What you learned in 8.2

- **Relative frequency** $= \dfrac{\text{count of the outcome}}{\text{total trials}}$.
- **Law of large numbers**: relative frequency converges to the theoretical probability as the number of trials grows.
- **Expected frequency** $= p \times n$.
- $p$ is the single-trial probability; $n$ is the number of trials.
- **Expected counts can be non-integer**, and that is fine.
- **Fair** $=$ outcomes equally likely. **Biased** $=$ outcomes NOT equally likely. **Random** $=$ each item equally likely to be picked.
- **To test fairness**: compute expected counts, compare with observed, write a one-sentence verdict.
- Small samples wobble a lot; declare bias only when differences are big OR trials are many.

## A decision tree for 8.2 questions

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHAT IS THE QUESTION ASKING?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Given a results table, find a frequency?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">RELATIVE FREQUENCY</div><div style="color:#7a7875;font-size:11px;margin-top:4px">count / total, then simplify</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Predict from probability \(p\)?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">EXPECTED \(= p \times n\)</div><div style="color:#7a7875;font-size:11px;margin-top:4px">multiply, no rounding</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center;min-width:340px"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">FAIR OR BIASED?</div><div style="color:#7a7875;font-size:11px;margin-top:4px">expected counts + comparison + one-sentence verdict</div></div>
  </div>
</div>

## Three formulas to lock in

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">THREE FORMULAS, MEMORISE</div>
  <div style="display:flex;gap:12px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04);text-align:center">
      <div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">RELATIVE FREQ.</div>
      <div style="font-size:15px;color:#f0eeea">\(\dfrac{\text{count}}{\text{total trials}}\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04);text-align:center">
      <div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">EXPECTED COUNT</div>
      <div style="font-size:15px;color:#f0eeea">\(p \times n\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:14px;border:1.5px solid rgba(255,70,112,0.4);border-radius:8px;background:rgba(255,70,112,0.04);text-align:center">
      <div style="color:#ff4670;font-family:'Geist Mono',monospace;font-size:10.5px;letter-spacing:0.5px;margin-bottom:8px">FAIR P(EACH)</div>
      <div style="font-size:15px;color:#f0eeea">\(\dfrac{1}{n}\) \(\text{for } n\) \(\text{equal sectors}\)</div>
    </div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875;text-align:center;margin-top:12px;line-height:1.5">three short lines that generate every answer on this paper</div>
</div>

## Comprehensive worked example

Aisha designs a five-section spinner. She spins it $200$ times and records:

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">SPINNER RESULTS · 200 SPINS</div>
  <div style="display:grid;grid-template-columns:repeat(6, 1fr);gap:1px;background:#141e2a;border:1px solid #141e2a;border-radius:6px;overflow:hidden;font-size:13px;text-align:center;max-width:520px;margin:0 auto">
    <div style="background:#070b10;padding:10px 6px;color:#7a7875;font-family:'Geist Mono',monospace;font-size:11px">COLOUR</div>
    <div style="background:#070b10;padding:10px 6px;color:#ff4670;font-family:'Geist Mono',monospace;font-size:11px">RED</div>
    <div style="background:#070b10;padding:10px 6px;color:#00abfa;font-family:'Geist Mono',monospace;font-size:11px">BLUE</div>
    <div style="background:#070b10;padding:10px 6px;color:#0fee89;font-family:'Geist Mono',monospace;font-size:11px">GREEN</div>
    <div style="background:#070b10;padding:10px 6px;color:#fff067;font-family:'Geist Mono',monospace;font-size:11px">YELLOW</div>
    <div style="background:#070b10;padding:10px 6px;color:#ff822c;font-family:'Geist Mono',monospace;font-size:11px">ORANGE</div>
    <div style="background:#070b10;padding:10px 6px;color:#fff067;font-family:'Geist Mono',monospace;font-size:11px">COUNT</div>
    <div style="background:#0b1118;padding:10px;color:#f0eeea">48</div>
    <div style="background:#0b1118;padding:10px;color:#f0eeea">50</div>
    <div style="background:#0b1118;padding:10px;color:#f0eeea">42</div>
    <div style="background:#0b1118;padding:10px;color:#f0eeea">30</div>
    <div style="background:#0b1118;padding:10px;color:#f0eeea">30</div>
  </div>
</div>

(a) Find the relative frequency of red.

(b) Estimate the probability of yellow on the next spin.

(c) If the spinner is spun a further $500$ times, how many yellows do we expect?

(d) Aisha thinks the spinner is biased against yellow and orange. Do you agree?

<iframe src="/widgets/probability-step-explorer.html?preset=p2-review-comprehensive" style="width:100%;max-width:696px;height:620px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): Relative frequency of red.**

$$\text{rel freq}(\text{red}) = \dfrac{48}{200}$$

Simplify: $\gcd(48, 200) = 8$, so $\dfrac{48}{200} = \dfrac{6}{25}$. Decimal: $0.24$.

So rel freq $= \boxed{\dfrac{6}{25}}$. **[B1]**

**Part (b): Estimate $P(\text{yellow})$.** With no other information, our best estimate is the relative frequency:

$$P(\text{yellow}) \approx \dfrac{30}{200} = \dfrac{3}{20} = 0.15$$

$P(\text{yellow}) \approx \boxed{0.15}$. **[B1]**

**Part (c): Expected yellows in $500$ further spins.**

$$\text{expected} = p \times n = 0.15 \times 500 = 75$$

Expected yellows $= \boxed{75}$. **[M1 for $0.15 \times 500$; A1 for $75$]**

**Part (d): Judge the spinner.** If the spinner is FAIR, each colour has probability $\tfrac{1}{5} = 0.2$. Expected count per colour $= 0.2 \times 200 = 40$. Compare with observed:

- Red: $48$ (observed) vs $40$ (expected), so $8$ above.
- Blue: $50$ vs $40$, so $10$ above.
- Green: $42$ vs $40$, very close.
- Yellow: $30$ vs $40$, so $10$ below.
- Orange: $30$ vs $40$, so $10$ below.

Yellow and orange are both well below the fair expected count of $40$, by $25\%$. Red and blue are both above. These differences are large enough to suggest the spinner IS biased: yellow and orange come up less often than they should. Aisha is probably right.

$\boxed{\text{Yes, the spinner appears biased against yellow and orange}}$. **[B1 for the expected count of $40$ per colour; B1 for the comparison and conclusion]**

Full marks $= 7$.

This $7$-mark structure is exactly the long question on a typical probability paper for this unit. Each part is one or two marks; the trick is to keep the working clean and to write a one-sentence verdict on part (d) instead of just the conclusion.

## Common mistakes across the unit

- **Confusing relative frequency with frequency.** Relative frequency is the FRACTION; frequency alone is the count.
- **Forgetting to multiply by $n$** in the expected-frequency formula.
- **Rounding expected counts too early.** $\tfrac{1}{3} \times 50 = 16.67$, not $17$, unless the question asks for a whole number.
- **Declaring bias from a small sample.** Random variation is too big at $n = 10$ or $n = 20$ to be sure.
- **Writing "looks fair" without showing expected counts.** The marker wants the calculation $\tfrac{1}{n} \times N$ explicitly written.
- **Comparing observed to total trials** rather than to expected counts. The reference value is the expected count, not the grand total.

## Quick summary

- **Relative frequency** $= \dfrac{\text{count}}{\text{total trials}}$. Simplify and you have the answer.
- **Expected count** $= p \times n$. One product, no rounding.
- **Fair** = equal probability for each outcome. Expected count $= \tfrac{N}{n}$ per outcome for $N$ trials and $n$ equal sectors.
- **Fairness verdict**: expected counts written out + a one-sentence comparison + a clear conclusion.
- **Sanity check**: relative frequencies of all outcomes in an experiment sum to $1$; expected counts sum to the total number of trials.

The next topic, 8.3, deals with what happens when you string TWO events together: sample-space diagrams, tree diagrams (with replacement and without), and the probability of "both" or "at least one" of two events.
