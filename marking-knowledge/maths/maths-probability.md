# Cambridge 4024 O-Level Mathematics — Probability Topic Knowledge
**Sources:** s25_12, s25_13, s25_22, s25_23, w25_11, w25_12, w25_21, w25_22 (2025 series) + s24_21, s24_22, w24_21, w24_22 (2024 series)
---

## 1. Basic Probability — Single Event

### What the mark scheme rewards
- Correct fraction: favourable outcomes / total outcomes
- Must be expressed as a fraction (decimal or percentage also accepted unless "fraction" specified)

### Key examples from 2025 papers

**w25_11 Q2(b):** 9 children, hours watching TV: 1, 2, 2, 2, 6, 7, 7, 8, 10. Probability of more than 6 hours.
- Children spending more than 6 hours: 7, 7, 8, 10 → 4 children
- Answer: 4/9 [B1]
- Full marks = 1

---

**s24_22 Q2(a)(i):** Probability from table (single event).
- Answer: 1/5 oe [B1]
- Full marks = 1

**s24_22 Q2(a)(ii):** Second probability from same table.
- Answer: 2/5 oe [B1]
- Full marks = 1

---

## 2. Sample Space Diagrams

### What the mark scheme rewards
- Complete and correct sample space diagram
- Probability read correctly from the diagram

### Key examples from 2025 papers

**w25_12 Q12(a)(i):** Spinners A (2,4,6,8) and B (1,1,3,5) — add scores. Complete sample space.

Spinner B has values {1, 1, 3, 5} (two sectors showing 1, one showing 3, one showing 5). Spinner A has values {2, 4, 6, 8}.

Completed sample space (all 16 outcomes):
```
         Spinner A
+    2    4    6    8
1    3    5    7    9
1    3    5    7    9
3    5    7    9   11
5    7    9   11   13
```
- Full marks = 1 [B1]

**w25_12 Q12(a)(ii):** P(score is greater than 10)
- Scores > 10: 11 (once), 11 (once), 13 (once) = 3 outcomes out of 16
- Full answer: 3/16
- B1 FT for 3/(their k) or k/16 dependent on fraction < 1
- Full marks = 2

**s24_22 Q2(b)(i):** Two spinners, each with values 5–9. Complete the possibility diagram.
- Answer: correct grid with sums — partial grid given, B1 for at least 7 values correct in an incomplete grid
- Full marks = 2

**s24_22 Q2(b)(ii):** P(sum = a specific value) from the completed diagram.
- Answer: 3/25 oe [B1]
- Full marks = 1

**s24_22 Q2(b)(iii):** P(sum ≥ some threshold) FT their complete possibility diagram.
- Answer: 10/25 oe
- B1FT for answer (their count)/25 where their count = 10; or (their count)/k where k = 35 or 36 [different denominator error]
- Full marks = 2

**w25_12 Q12(b):** Probability both scores are odd
- M1 for correct sample space diagram OR listing all 6 correct combinations OR identifying 6 successful outcomes
- Full answer: 6/16 (= 3/8) oe
- Full marks = 2

---

## 3. Tree Diagrams — Independent Events (With Replacement / Decimal Probabilities)

### What the mark scheme rewards
- M1 for 2 or 3 probabilities correctly placed on the tree
- A1 for correct product along a specific branch
- Multiplying probabilities for AND; adding for OR

### Key examples from 2024 papers

**s24_21 Q11(a)(ii)(a):** Tree diagram for two independent events. P(pass) = 0.65, P(fail) = 0.35.
- Correct tree: 0.65, 0.65, 0.35, 0.65 oe
- M1 for 2 or 3 probabilities completed correctly
- Full marks = 2

**s24_21 Q11(a)(ii)(b):** P(both fail) = 0.35 × 0.35 = 0.1225
- Answer: 0.1225 oe e.g. 49/400 [B1]
- Full marks = 1

**s24_21 Q11(a)(ii)(c):** P(exactly one passes) = 2 × 0.35 × 0.65
- Answer: 0.455 oe e.g. 91/200
- M1 for [2 ×] 0.35 × 0.65
- Full marks = 2
- Key pattern: P(exactly one) = 2 × P(pass) × P(fail) — the factor of 2 for the two orders

---

## 4. Tree Diagrams — Without Replacement

### What the mark scheme rewards
- M marks for each correct combination (multiply along branches)
- M2 for all correct combinations; M1 for fewer; M0 for one
- SC1 for "with replacement" method when "without replacement" is required
- **Complement method**: P(at least one from each colour) = 1 − P(all same colour) — often more efficient for complex questions

### Key examples from 2025 papers

**s25_23 Q23:** Bag contains counters: red, blue, green (specific numbers). Three drawn without replacement.
- M3 for all three colour combinations correctly identified and multiplied
- M2 for two correct combinations
- M1 for one correct combination
- SC1 for 100/169 (with replacement — wrong method but recognisable attempt)
- Full answer: 100/156
- Full marks = 4

**w25_21 Q17(b):** Two people selected at random (without replacement) from 80 race participants (20 in one group, 5 in another). Find probability one is from each group.
- M2 for (20/80) × (5/79) × 2 oe (two orders: group A then B, or B then A)
- M1 for 20/80 or 5/79 or one correct probability fraction seen
- SC1 for 1/32 oe (with-replacement error: (20/80) × (5/80) × 2)
- Full answer: 5/158 oe
- Full marks = 3

**s24_21 Q11(b):** Bag with 14 counters: 8 red, 1 blue, 5 green. Two drawn without replacement. Find P(different colours).
- Method: complement: 1 − P(both red) − P(both blue) − P(both green)
- = 1 − (8/14 × 7/13) − (1/14 × 0/13) − (5/14 × 4/13)
- = 1 − 56/182 − 0 − 20/182 = 1 − 76/182 = 106/182 = 53/91
- M2 for 1 − [(8×7 + 1×0 + 5×4)/(14×13)] oe — all three same-colour combinations subtracted
- M1 for identifying the three same-colour products (8×7, 1×0, 5×4) or 3 correct products
- After 0 scored, SC1 for 106/196 = 53/98 (with replacement)
- Full answer: 106/182 = 53/91
- Full marks = 3

**w24_22 Q5(a):** Bag with 9 counters. P(first counter is red) = 4/9 oe [B1]. Full marks = 1

**w24_22 Q5(b):** P(both red) with replacement = (2/9)² = 4/81.
- M1 for (2/9) × (2/9) oe
- Full marks = 2

**w24_22 Q5(c):** P(different colours) without replacement, bag has 2 red, 3 blue, 4 other.
- Answer: 5/18 oe
- M2 for (5/9) × (4/8) oe [identifying the 5 non-matching cases after first draw]
- Alternatively: 2×[(3/9 × 2/8) + (3/9 × 2/8) + (2/9 × 1/8)] oe for each specific pair
- M1 for (k/(k−1))/(9/8) structure where k = 2, 3, or 4
- SC1 for 25/81 (with replacement)
- Full marks = 3

**w25_22 Q19(c):** Three counters drawn without replacement from 22 counters (9 of one colour)
- M2 for (9/22) × (8/21) × (7/20) oe
- M1 for 9/22 oe (decimal/%) seen OR for (9 × 8 × 7) / (1 − 1/k − 1/(k-1)) type expression
- Full answer: 3/55 oe
- Full marks = 3

---

## 5. Three Draws Without Replacement — Selecting Specific Types

**w24_21 Q11(c):** 25 marbles: 4 red, 21 others. Three selected without replacement. P(exactly one red).
- = 3 × (4/25) × (21/24) × (20/23) [three orders: RNN, NRN, NNR]
- M2 for k × (4/25) × (21/24) × (20/23) oe where k = 1, 2 or 3
- M1 for (4/25) × (21/24) × (20/23) or (a/25) × (b/24) × (c/23) seen
- Full answer: 42/115 oe
- Full marks = 3

---

## 6. Probability from Venn Diagrams

**w24_21 Q4(c):** Given Venn diagram of two sets A and B, find n(A ∩ B) or similar count.
- Answer: 4 [B1 FT their Venn diagram]
- Full marks = 1

**w24_21 Q4(d):** P(element is in A ∪ B only) from diagram.
- Answer: 2 [B1 FT their Venn diagram]
- Full marks = 1

**w24_21 Q11(a):** P(selecting a marble from set of n) = 4/9.
- B1 for answer n/9 or 4/n (partial) before cancelling
- Full answer: 4/9
- Full marks = 2

**w24_21 Q11(b):** P(both same colour) with replacement = (4/5)⁴ style.
- Answer: 256/625
- B1 for 16/25 seen (intermediate)
- Full marks = 2

---

## 4. Combined Events — Two Events

### Key examples from 2025 papers

**w25_11 Q2(b):** Single probability from a data set [above]

**w25_22 Q19(a):** P(specific outcome) = 1/5 oe [B1]
**w25_22 Q19(b):** Related probability = 7 [B1] — likely "find n such that P = ..."

---

## 5. Ordering Probabilities / Fractions

### Key examples from 2025 papers

**w25_12 Q5:** Order: 0.8, 7/9, 20/17, 84.5%
- Convert all to decimals: 0.8, 0.777..., 0.850..., 0.845...
- Wait: 20/17 = 1.176... that's greater than 1, so ordering would include values > 1
- Actually from QP: "0.8, 7/9, 17/20, 84.5%" (17/20 not 20/17)
- Correct order: 7/9 (0.777) < 0.8 < 17/20 (0.85) = 84.5% ... but 17/20 = 85% > 84.5%
- Correct order: 7/9, 0.8, 84.5%, 17/20
- MS answer: 7/9, 0.8, 84.5%, 17/20 [B2 for all correct; B1 for 3 correct when one covered]
- "SC1 for 17/20, 84.5%, 0.8, 7/9" (reverse order)
- Full marks = 2

---

## Marking Traps — Probability Topic

1. **Without replacement**: Denominators decrease as counters are removed. 9/22 × 8/21 × 7/20, NOT (9/22)³. SC1 for with-replacement method (denominators stay same).
2. **Sample space diagrams**: Must show ALL outcomes systematically — missed outcomes = wrong denominator = wrong probability.
3. **Tree diagrams**: Must multiply along branches (AND) and add across branches (OR). Reversing this = M0.
4. **"Fraction" required**: When question says "express as a fraction", decimal or percentage answers lose B marks. When "fraction" is not specified, any form accepted.
5. **Probability scale**: Must be between 0 and 1 inclusive. Any answer > 1 is automatically wrong.
6. **SC1 for with-replacement**: This mark is awarded as a consolation only — if the student shows they understand the multiplication principle but used the wrong denominators (kept them constant).
7. **P(exactly one) = 2pq**: Only works when there are exactly two outcomes. For more outcomes, list all valid orders explicitly.
8. **Complement method**: For "different colours" or "at least one of type X", the complement 1 − P(all same) is usually the most efficient route. Cambridge awards M marks for identifying the correct complement products.
9. **Decimal tree diagrams**: Work identically to fraction trees — multiply along branches, add across. The answer 0.455 is accepted oe (91/200).
