---
title: '8.3 review: probability of combined events'
checks:
  - q: 'Two fair dice are rolled. The probability the sum is $6$ is...'
    options: ["$\\tfrac{5}{36}$", "$\\tfrac{1}{6}$", "$\\tfrac{6}{36}$", "$\\tfrac{1}{2}$"]
    correct: 0
    explain: 'Pairs adding to $6$: $(1,5), (2,4), (3,3), (4,2), (5,1)$ - five pairs. So $\tfrac{5}{36}$. Different from sum $= 7$ (which gives $\tfrac{6}{36}$).'
  - q: 'A fair coin is tossed three times. $P(\text{three heads})$ equals...'
    options: ["$\\tfrac{1}{2} \\times \\tfrac{1}{2} \\times \\tfrac{1}{2} = \\tfrac{1}{8}$", "$3 \\times \\tfrac{1}{2}$", "$\\tfrac{3}{2}$", "$\\tfrac{1}{2}$"]
    correct: 0
    explain: 'Three independent tosses, each $\tfrac{1}{2}$, multiplied: $\tfrac{1}{8}$. This is the with-replacement / independent-events case.'
  - q: 'A bag has $5$ green and $4$ blue. Two drawn without replacement. $P(\text{both blue})$ equals...'
    options: ["$\\tfrac{4}{9} \\times \\tfrac{3}{8} = \\tfrac{1}{6}$", "$\\tfrac{4}{9} \\times \\tfrac{4}{9}$", "$\\tfrac{4}{9} \\times \\tfrac{4}{8}$", "$\\tfrac{1}{2}$"]
    correct: 0
    explain: 'First blue: $\tfrac{4}{9}$. After taking out a blue, $3$ blues remain in $8$ counters: $\tfrac{3}{8}$. Multiply: $\tfrac{12}{72} = \tfrac{1}{6}$.'
  - q: 'Of $30$ students, $18$ play cricket, $14$ play football, $6$ play both. $P(\text{plays at least one})$ equals...'
    options: ["$\\tfrac{26}{30} = \\tfrac{13}{15}$", "$\\tfrac{18}{30}$", "$\\tfrac{6}{30}$", "$\\tfrac{32}{30}$"]
    correct: 0
    explain: 'Inclusion-exclusion: $n(A \cup B) = n(A) + n(B) - n(A \cap B) = 18 + 14 - 6 = 26$. So $P = \tfrac{26}{30} = \tfrac{13}{15}$.'
  - q: 'For three counters drawn without replacement from a bag of $4$ red and $5$ blue, $P(\text{at least one red})$ is fastest by...'
    options: ["the complement: $1 - P(\\text{all three blue})$", "directly summing the three multi-path cases", "always $1$", "$\\tfrac{4}{9} \\times 3$"]
    correct: 0
    explain: 'Direct: three cases. Complement: ONE case (BBB) = $\tfrac{5}{9} \times \tfrac{4}{8} \times \tfrac{3}{7} = \tfrac{60}{504} = \tfrac{5}{42}$. So $P(\text{at least one red}) = 1 - \tfrac{5}{42} = \tfrac{37}{42}$.'
---

## What you learned in 8.3

- **Sample space diagrams** lay out every combination of two events in a grid. Total $= $ rows $\times$ columns. Probability $= $ matching cells / total.
- **Tree diagrams** branch through multi-stage experiments. **Multiply along a path** (AND), **add across paths** (OR).
- **With replacement** $\Rightarrow$ independent events. Branch labels stay the SAME at every stage.
- **Without replacement** $\Rightarrow$ dependent events. The denominator drops by $1$ on each draw; the numerator drops if you drew that colour.
- **Complement shortcut**: $P(\text{at least one X}) = 1 - P(\text{no X})$. Always faster.
- **Venn diagrams** for combined events. $\cap$ AND, $\cup$ OR, $'$ NOT.
- **Inclusion-exclusion**: $P(A \cup B) = P(A) + P(B) - P(A \cap B)$.

## A decision tree for combined-event questions

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:22px 18px 22px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:18px;text-transform:uppercase;text-align:center">WHICH TOOL DO YOU NEED?</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Two events with small equal-likely sets each (dice, spinners)?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #00abfa;border-radius:8px;background:rgba(0,171,250,0.06);text-align:center"><div style="color:#00abfa;font-weight:700;font-size:14px;letter-spacing:0.5px">SAMPLE SPACE GRID</div><div style="color:#7a7875;font-size:11px;margin-top:4px">count matching cells</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">A multi-stage experiment (draws, tosses, repeated trials)?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #0fee89;border-radius:8px;background:rgba(15,238,137,0.06);text-align:center"><div style="color:#0fee89;font-weight:700;font-size:14px;letter-spacing:0.5px">TREE DIAGRAM</div><div style="color:#7a7875;font-size:11px;margin-top:4px">multiply along, add across</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ NO</div>
  <div style="display:flex;align-items:stretch;gap:10px;font-family:'Geist Mono',monospace">
    <div style="flex:1.5;padding:12px 14px;border:1.5px solid #fff067;border-radius:8px;background:rgba(255,240,103,0.06);color:#fff067;font-weight:700;font-size:13px;text-align:center;display:flex;align-items:center;justify-content:center">Sets of objects with overlap, given counts in a diagram?</div>
    <div style="display:flex;align-items:center;color:#7a7875;font-size:10.5px;letter-spacing:0.5px;font-weight:700;white-space:nowrap">YES →</div>
    <div style="flex:1;padding:12px 14px;border:1.5px solid #ff4670;border-radius:8px;background:rgba(255,70,112,0.06);text-align:center"><div style="color:#ff4670;font-weight:700;font-size:14px;letter-spacing:0.5px">VENN DIAGRAM</div><div style="color:#7a7875;font-size:11px;margin-top:4px">count region(s), divide by total</div></div>
  </div>
  <div style="text-align:center;color:#3a4a5a;font-size:10.5px;font-family:'Geist Mono',monospace;letter-spacing:0.5px;padding:8px 0;font-weight:700">↓ wording is "at least one X"</div>
  <div style="display:flex;justify-content:center;font-family:'Geist Mono',monospace">
    <div style="padding:12px 18px;border:1.5px solid #ff822c;border-radius:8px;background:rgba(255,130,44,0.06);text-align:center;min-width:340px"><div style="color:#ff822c;font-weight:700;font-size:14px;letter-spacing:0.5px">USE THE COMPLEMENT</div><div style="color:#7a7875;font-size:11px;margin-top:4px">\(1 - P(\text{no X})\) on the chosen tool</div></div>
  </div>
</div>

## Five formulas to lock in

<div class="diagram" style="border:1px solid #141e2a;border-radius:10px;padding:14px 16px;margin:14px 0;background:#0b1118">
  <div style="font-family:'Geist Mono',monospace;font-size:11px;color:#7a7875;letter-spacing:0.4px;margin-bottom:14px;text-transform:uppercase;text-align:center">FIVE FORMULAS, MEMORISE</div>
  <div style="display:flex;gap:10px;align-items:stretch;flex-wrap:wrap">
    <div style="flex:1;min-width:160px;padding:12px;border:1.5px solid rgba(0,171,250,0.4);border-radius:8px;background:rgba(0,171,250,0.04);text-align:center">
      <div style="color:#00abfa;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">SAMPLE SPACE</div>
      <div style="font-size:14px;color:#f0eeea">\(\dfrac{\text{matching cells}}{\text{total cells}}\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:12px;border:1.5px solid rgba(15,238,137,0.4);border-radius:8px;background:rgba(15,238,137,0.04);text-align:center">
      <div style="color:#0fee89;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">AND (path)</div>
      <div style="font-size:14px;color:#f0eeea">\(P(A) \times P(B)\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:12px;border:1.5px solid rgba(255,130,44,0.4);border-radius:8px;background:rgba(255,130,44,0.04);text-align:center">
      <div style="color:#ff822c;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">COMPLEMENT</div>
      <div style="font-size:14px;color:#f0eeea">\(1 - P(\text{none})\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:12px;border:1.5px solid rgba(255,70,112,0.4);border-radius:8px;background:rgba(255,70,112,0.04);text-align:center">
      <div style="color:#ff4670;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">INCL-EXCL</div>
      <div style="font-size:14px;color:#f0eeea">\(P(A) + P(B) - P(A \cap B)\)</div>
    </div>
    <div style="flex:1;min-width:160px;padding:12px;border:1.5px solid rgba(255,240,103,0.4);border-radius:8px;background:rgba(255,240,103,0.04);text-align:center">
      <div style="color:#fff067;font-family:'Geist Mono',monospace;font-size:10px;letter-spacing:0.5px;margin-bottom:6px">"EXACTLY ONE"</div>
      <div style="font-size:14px;color:#f0eeea">\(2 \times p \times (1-p)\)</div>
    </div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:11.5px;color:#7a7875;text-align:center;margin-top:12px;line-height:1.5">five short lines that, together, generate every answer in this unit</div>
</div>

## Comprehensive worked example

A bag contains $4$ red and $6$ blue marbles. Three marbles are drawn at random without replacement.

(a) Find $P(\text{first red})$.

(b) Find $P(\text{all three red})$.

(c) Find $P(\text{at least one red})$ using the complement.

<iframe src="/widgets/probability-step-explorer.html?preset=review-8p3-comprehensive" style="width:100%;max-width:696px;height:620px;border:0;border-radius:10px;display:block;margin:18px auto" loading="lazy"></iframe>

**Part (a): $P(\text{first red})$.** Reds: $4$. Total: $10$.

$$P(\text{first red}) = \dfrac{4}{10} = \dfrac{2}{5}$$

$P(\text{first red}) = \boxed{\dfrac{2}{5}}$. **[B1]**

**Part (b): $P(\text{all three red})$.** Without replacement, each new draw reduces both numerator (reds remaining) and denominator (total remaining) by $1$.

$$P(\text{RRR}) = \dfrac{4}{10} \times \dfrac{3}{9} \times \dfrac{2}{8} = \dfrac{24}{720} = \dfrac{1}{30}$$

$P(\text{all three red}) = \boxed{\dfrac{1}{30}}$. **[M1 for $\tfrac{4}{10} \times \tfrac{3}{9} \times \tfrac{2}{8}$; A1 for $\tfrac{1}{30}$]**

**Part (c): $P(\text{at least one red})$ via the complement.**

$$P(\text{at least one red}) = 1 - P(\text{no reds})$$

$P(\text{no reds})$ is the single path BBB:

$$P(\text{BBB}) = \dfrac{6}{10} \times \dfrac{5}{9} \times \dfrac{4}{8} = \dfrac{120}{720} = \dfrac{1}{6}$$

So:

$$P(\text{at least one red}) = 1 - \dfrac{1}{6} = \dfrac{5}{6}$$

$P(\text{at least one red}) = \boxed{\dfrac{5}{6}}$. **[M1 for $1 - \tfrac{6}{10} \times \tfrac{5}{9} \times \tfrac{4}{8}$; A1 for $\tfrac{5}{6}$]**

Full marks $= 5$.

The structure of this question is the exact shape of the longest probability question on most papers. Part (a) is a single fraction; (b) extends to three multiplied fractions; (c) brings in the complement.

## Worked example: combine sample space with complement

Two fair six-sided dice are rolled. Find $P(\text{sum is at least } 4)$.

**Method (a) Direct.** Count cells with sum $\geq 4$: that means sums $4, 5, 6, 7, 8, 9, 10, 11, 12$. That is everything except sums $2$ and $3$. Tedious to enumerate.

**Method (b) Complement.** $P(\text{sum} < 4) = P(\text{sum} = 2) + P(\text{sum} = 3) = \dfrac{1}{36} + \dfrac{2}{36} = \dfrac{3}{36} = \dfrac{1}{12}$.

$$P(\text{sum} \geq 4) = 1 - \dfrac{1}{12} = \dfrac{11}{12}$$

$P(\text{sum} \geq 4) = \boxed{\dfrac{11}{12}}$. **[M1 for $1 - \tfrac{3}{36}$; A1 for $\tfrac{11}{12}$]**

Full marks $= 2$.

The complement turned a $33$-cell counting problem into a $3$-cell counting problem.

## Common mistakes across the unit

- **Wrong tool**: building a tree diagram for two dice when a sample-space grid is faster, or vice versa.
- **Keeping denominators constant** in a without-replacement problem.
- **Multiplying when you should add** (or vice versa) on a tree diagram.
- **Forgetting the factor of $2$ (or $n$)** when computing "exactly one in two stages" (or "exactly one in $n$ stages").
- **Double-counting overlap** when finding $P(A \cup B)$ from $P(A) + P(B)$ without subtracting $P(A \cap B)$.
- **Skipping the complement** on "at least one" questions and doing the long way.
- **Confusing "at least" with "more than".** "At least $2$" includes $2$. "More than $2$" does not.

## Quick summary

- **Choose the right tool**: sample space, tree, or Venn, based on the problem shape.
- **AND multiplies** along a path; **OR adds** across paths.
- **Without replacement**: denominators (and sometimes numerators) decrease.
- **Complement shortcut**: $1 - P(\text{opposite})$ when "at least one" or "none" wording appears.
- **Inclusion-exclusion**: $P(A \cup B) = P(A) + P(B) - P(A \cap B)$.
- **Method marks** are typically for setting up the calculation correctly; **accuracy marks** are for the simplified numerical answer.

That completes Unit 8 on probability. You now have every tool needed for the probability questions on your exam: the scale and direct counting from 8.1, the relative-frequency / expected-frequency / fairness ideas from 8.2, and the combined-events toolkit from 8.3. The next unit, 9, switches to statistics: tabulating data, computing averages, and drawing the charts that visualise both.
