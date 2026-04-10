# Cambridge 4024 O-Level Mathematics — Probability Topic Knowledge
**Sources:** s25_12, s25_13, s25_22, s25_23, w25_11, w25_12, w25_21, w25_22 (2025 series) + s24_21, s24_22, w24_21, w24_22 (2024 series) + s23_12, s23_21, w23_11 (2023 series)
---

## 1. Basic Probability — Single Event

### What the mark scheme rewards
- Correct fraction: favourable outcomes / total outcomes
- Must be expressed as a fraction (decimal or percentage also accepted unless "fraction" specified)

### Key examples from 2025 papers

**s23_12 Q23(a):** 10 cards: 3 green squares, 1 red square, 4 green triangles, 2 red triangles. Ken takes one card, notes colour, replaces it, then takes another. Find P(both cards show a green shape).
- 7 green cards out of 10. With replacement, events are independent.
- P(both green) = (7/10) × (7/10) = 49/100
- B1 for 7/10 seen
- Full answer: 49/100
- Full marks = 2

**s23_12 Q23(b):** Same set of 10 cards. Irina takes two cards without replacement. Find P(both cards show the same shape).
- 4 square cards (3+1=4) and 6 triangle cards (4+2=6)
- P(both square) = 4/10 × 3/9 = 12/90
- P(both triangle) = 6/10 × 5/9 = 30/90
- P(same shape) = 12/90 + 30/90 = 42/90
- M2 for 4/10 × 3/9 + 6/10 × 5/9 oe (both products correctly formed and added)
- M1 for one correct product: 4/10 × 3/9 oe or 6/10 × 5/9 oe
- SC1 for 52/100 (with replacement: (4/10)² + (6/10)²)
- Full answer: 42/90 oe
- Full marks = 3

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

### 6b. Completing a Three-Circle Venn Diagram from Given Data

**w23_11 Q18(a):** A sports club has 40 members. Given: n(R) = 22 run, n(C) = 24 cycle, n(S) = 14 sail, n(C∩S∩R') = 3, n(R∩C∩S') = 9, n(R∩S∩C') = 5, n(R only) = 6. Complete the three-circle Venn diagram.
- Find n(R∩C∩S): n(R) = 6 + 9 + 5 + n(R∩C∩S) = 22 → n(R∩C∩S) = 2
- Find n(C only): n(C) = 9 + 3 + 2 + n(C only) = 24 → n(C only) = 10
- Find n(S only): n(S) = 5 + 3 + 2 + n(S only) = 14 → n(S only) = 4
- Total in circles = 6+9+5+3+2+10+4 = 39; outside all circles = 40−39 = 1
- B1 for n(R∩C∩S) = 2 soi; B1 for n(C only) = 10 and n(S only) = 4; B1 for all 8 regions correct
- Full marks = 3

### 6c. Set Notation for a Shaded Venn Diagram Region

**w23_11 Q18(b):** Three sets F, G, H. The shaded region is inside G and H but outside F. Express in set notation.
- The shaded region is in the G∩H overlap but excludes F
- Answer: G ∩ H ∩ F' oe (equivalently written as (G ∩ H) \ F)
- B1 for G ∩ H ∩ F' oe
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

## 6. Probability Equation → "Show That" Quadratic

### When this appears
A without-replacement probability P(two specific values) is given as a fraction. An unknown frequency r appears in the total, making the probability equation produce a quadratic. Cambridge asks you to "show that" the quadratic equals zero — all steps must be shown explicitly.

### What the mark scheme rewards
- M1 for the correct probability expression for one draw (e.g., 9/(88+r))
- M1 for the complete without-replacement equation set up correctly
- A1 for correctly expanding and simplifying to reach the required quadratic (no errors)

### Key example from 2023 papers

**s23_21 Q10(b)(i):** A box of sweets has frequencies 12, 28, 39, r, 9 for 11–15 sweets respectively (total = 88 + r). Two bags drawn without replacement. P(both contain 15 sweets) = 4/539. Show that r² + 175r − 2046 = 0.
- P(both 15) = 9/(88+r) × 8/(87+r) = 4/539
- 72 × 539 = 4(88+r)(87+r)
- 38808 = 4(7656 + 175r + r²)
- 9702 = 7656 + 175r + r²
- r² + 175r − 2046 = 0 ✓
- M1 for 9/(88+r) oe seen (P(first bag = 15) set up)
- M1 for 9/(88+r) × 8/(87+r) = 4/539 oe (full equation)
- A1 for correctly reaching r² + 175r − 2046 = 0 (all algebra shown)
- Full marks = 3

**s23_21 Q10(b)(ii):** Solve r² + 175r − 2046 = 0 to find r. Show working.
- (r + 186)(r − 11) = 0 → r = −186 or r = 11
- r = 11 (cao — frequency must be positive; reject r = −186)
- M1 for (r + 186)(r − 11) = 0 oe or quadratic formula applied correctly
- A1 for r = 11 and r = −186 seen
- A1 cao for r = 11 (cao means must reject the negative root explicitly or by context)
- Full answer: r = 11
- Full marks = 3

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
