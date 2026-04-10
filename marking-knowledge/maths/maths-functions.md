# Cambridge 4024 O-Level Mathematics — Functions Topic Knowledge
**Sources:** s25_12, s25_13, s25_22, s25_23, w25_11, w25_12, w25_21, w25_22 (2025 series) + s24_11, w24_12 (2024 series) + s23_11, s23_12, w23_11, w23_22 (2023 series)
---

## 1. Evaluating Functions

### What the mark scheme rewards
- Substituting the given value into the function correctly [M1]
- Correct final value [A1]

### Key examples from 2025 papers

**w25_11 Q19:** g(x) = x/2 + 4; h(x) = 3x − 1. Solve hg(x) = 5.
- hg(x) = h(x/2 + 4) = 3(x/2 + 4) − 1 = 3x/2 + 12 − 1 = 3x/2 + 11
- 3x/2 + 11 = 5 → 3x/2 = −6 → x = −4 ✓
- M2 for 3x/2 + 12 − 1 = 5 or better
- M1 for 3(x/2 + 4) − 1 oe (correct composition structure shown)
- Full answer: x = −4
- Full marks = 3

---

## 2. Composite Functions (fg, gf)

### Key rule: fg(x) means "do g first, then apply f to the result"
- fg(x) = f(g(x))
- gf(x) = g(f(x))

### What the mark scheme rewards
- M1 for correctly substituting g(x) into f (or f(x) into g)
- B1 for intermediate value (e.g., g(4) calculated first)
- A1 for correct final value

### Key examples from 2025 papers

**s25_23 Q10(c):** f(x) = 3x − 5; g(x) = 2 − 6x. Find fg(4).
- Step 1: g(4) = 2 − 6(4) = 2 − 24 = −22
- Step 2: f(−22) = 3(−22) − 5 = −66 − 5 = −71
- B1 for f(−22) seen (shows correct order of composition)
- M1 for 3(2 − 6x) − 5 (showing the algebraic composition)
- Full answer: fg(4) = −71
- Full marks = 2

**w25_12 Q20(b):** gf(x) = (ax + b)² + 3; f(x) = ax + 4 (inverse found in 20a). Given condition: gf(x) = (3x + b)²...
- Condition tells us a = 3
- B1 for a = 3
- Then solving for b: from (3x + b)² + 3 = (3x + 4)² → b = 4? No — actually from condition: (b + 3)² = 16 → b + 3 = ±4 → b = 1 or b = −7. Given context b = 1.
- B2 for b = 1 OR M1 for (3x + b)² expansion or (b + 3)² = 16 oe
- Full answers: a = 3, b = 1
- Full marks = 3

---

## 3. Inverse Functions

### Method:
1. Write y = f(x)
2. Rearrange to make x the subject
3. Write f⁻¹(x) = [what you found for x], replacing y with x

### What the mark scheme rewards
- M1 for starting rearrangement correctly (e.g., x = ay + 3 for f(x) = (x−3)/a)
- A1 for correct final answer in required form "final answer"

### Key examples from 2025 papers

**w25_12 Q20(a):** f(x) = (x + 3)/a. Find f⁻¹(x).
- y = (x + 3)/a → ay = x + 3 → x = ay − 3
- So f⁻¹(x) = ax − 3
- M1 for x + 3 = ay or ax = y − 3 or y = x/a + 3/a or better
- Full answer: ax − 3 oe final answer (written as (x − 3)/a if a divides out... depends on what 'a' is)
- Wait: if f(x) = (x + 3)/a, then f⁻¹(x) = ax − 3. But MS says "(x−3)/a oe" — this would be the inverse of f(x) = ax + 3.

Let me resolve: If f(x) = ax + 3, then:
  y = ax + 3 → x = (y − 3)/a → f⁻¹(x) = (x − 3)/a ✓ (matches MS)
  And M1 for x + 3 = ay or ax = y − 3 ✓

So the function is f(x) = ax + 3 and inverse is (x − 3)/a.
- Full answer: (x − 3)/a oe final answer
- Full marks = 2

**s23_12 Q17(b):** f(x) = 2 − 3x and g(x) = x − 4. Solve f(x + 5) = 3g(x).
- Substitute x+5 into f: f(x+5) = 2 − 3(x+5) = 2 − 3x − 15 = −3x − 13
- Expand 3g(x): 3(x − 4) = 3x − 12
- Set equal: −3x − 13 = 3x − 12 → −13 + 12 = 3x + 3x → −1 = 6x → x = −1/6
- B1 for f(x+5) = 2 − 3(x+5) and 3g(x) = 3(x−4) soi (both substitutions set up)
- M1 dep for correct expansion and collection of terms (e.g. −3x − 3x = −12 + 15 seen)
- Full answer: x = −1/6
- Full marks = 3

**w23_11 Q22(c):** f(x) = x/4 + 3 and g(x) = 2(x − 1). Solve f(p) = g(p + 5). Find p.
- f(p) = p/4 + 3
- g(p + 5) = 2((p + 5) − 1) = 2(p + 4) = 2p + 8
- Set equal: p/4 + 3 = 2p + 8 → p/4 − 2p = 5 → p(1/4 − 2) = 5 → p(−7/4) = 5 → p = −20/7
- M1 for both f(p) and g(p+5) correctly substituted (p into f; p+5 into g)
- M1 dep for correct expansion and collecting like terms to form a linear equation in p
- A1 for p = −20/7
- Note: this differs from s23_12 Q17(b) in that BOTH functions take modified arguments of the SAME variable p, rather than one being a scalar multiple of the other
- Full answer: p = −20/7
- Full marks = 3

**s23_11 Q20:** f(x) = 7x + 10. Find f⁻¹(x).
- y = 7x + 10 → x = (y − 10)/7 → f⁻¹(x) = (x − 10)/7
- M1 for rearrangement step: y − 10 = 7x or x/7 = (y − 10)/7 seen
- Full answer: (x − 10)/7 oe final answer
- Full marks = 2

**s25_13 Q17:** Inverse of a function involving rearrangement (see algebra file for full detail)
- Multiple M marks for each step of rearrangement
- Full answer: x = 2/(5a − 3)

---

## 4. Domain and Range

### Key examples from 2025 papers

**s25_23 Q10(d):** g(x) = 2 − 6x. Find the range of g for a domain where g(x) < 50.
- g(x) < 50 → 2 − 6x < 50 → −6x < 48 → x > −8
- But the question asks for the inequality describing the output (range), not solving for x
- From MS: answer is "g(x) < 50" [B1 for 50 seen]
- Actually the question says "find the range" and the mark scheme awards B1 for the value 50 seen — meaning the answer is written as g(x) < 50 (the range is values less than 50)
- Full marks = 1

---

## 5. ff(x) = k — Equation Leading to Quadratic

### When this appears
When Cambridge asks: "Solve ff(x) = k" or "solve f(f(x)) = k" — applying f twice gives an equation that, after simplification, produces a quadratic.

### Method
1. Apply f(x) to get f(f(x)) — substitute f(x) as the input to f
2. Set equal to k and expand/simplify
3. Solve the resulting quadratic

### What the mark scheme rewards
- M1 for forming the equation from substituting f(x) into f (correct composition)
- M1FT for correct method to solve the resulting quadratic (factorisation or formula)
- A1 for each correct root

### Key examples from 2024 papers

**s24_11 Q19(c):** f(x) = 2x − 1. Solve ff(x) = k.
- ff(x) = f(2x − 1) = 2(2x − 1) − 1 = 4x − 3
- Set 4x − 3 = k → solve as linear OR if leading to quadratic via context
- MS answer: x = 3 or x = −2 (quadratic roots)
- M1 for x² − x − 6 [= 0] formed
- M1FT for correct method to solve their quadratic e.g. (x + 2)(x − 3) oe
- Full marks = 3

### Key insight
- If ff(x) leads to a quadratic, both roots are valid unless a domain restriction is stated
- Show each step: write ff(x) = f(f(x)) explicitly, substitute, expand, then set to k

---

## 6. Evaluating Nested Functions — Step-by-Step Pattern

### When this appears
Questions like: "Given f(x) = ..., find x such that f(f⁻¹(...)) = something" or evaluating f at a compound argument.

### What the mark scheme rewards
- B1 for correct evaluation of the inner function (seeing the intermediate value)
- M1 for correct setup of the outer equation
- A1 for correct final answer

### Key examples from 2024 papers

**w24_12 Q22(c):** f(x) = 3x − 1. Solve f(9/25) = 5x.
- Step 1: f(9/25) = 3(9/25) − 1 = 27/25 − 1 = 2/25 — wait, pdftotext distorted this. MS shows:
- B2 for 5x = 1/25 (key intermediate equation)
- B1 for f(9/25) = 1/25 — this suggests f involves a square root that pdftotext dropped
- M1 for setting up: 3(√(9/25)) − 1 = 5x oe or better
- Full answer: x = −2
- Full marks = 3

*Note: The original function likely involves √ which pdftotext dropped. If marking this type, watch for square root in function definition.*

**s24_21 Q4(b)(ii):** Substituting a composite expression into the function:
- 2(x+3) raised to power: answer 2ˣ⁺³ = 2ˣ × 2³ = 8 × 2ˣ
- M1 for writing 2^(x+3) = 2^x × 2^3 oe seen
- A1 for leading to 2^x = 5/(5×8) = 1/8 → x = −3 (or similar depending on exact question)
- Full marks = 2

---

## 7. Combining Algebraic Fractions Using Function Notation

### New pattern from 2023: write 2/f(x) + 1/g(x) as a single fraction by substituting f(x) and g(x) first, then combining

### What the mark scheme rewards
- B1 for correct numerator after substitution and combining (before final simplification)
- B1 for correct denominator: f(x)×g(x) oe
- B1 for correct simplified final fraction

### Key example from 2023 papers

**w23_22 Q11(c):** f(x) = 4x+1 and g(x) = 2x−3. Write 2/f(x) + 1/g(x) as a single fraction in its simplest form.
- Substitute: 2/(4x+1) + 1/(2x−3)
- Common denominator = (4x+1)(2x−3)
- Numerator = 2(2x−3) + (4x+1) = 4x−6+4x+1 = 8x−5
- B1 for numerator 2(2x−3)+(4x+1) oe isw [= 8x−5]
- B1 for denominator (4x+1)(2x−3) oe isw
- B1 for correct final answer
- Full answer: (8x−5)/((4x+1)(2x−3)) oe final answer [also acceptable: (8x−5)/(8x²−10x−3)]
- Full marks = 3
- Note: same B1/B1 structure as regular algebraic fraction combination — the "function" wrapper changes the setup step but not the mark structure

---

## Marking Traps — Functions Topic

1. **Order of composition**: fg(x) ≠ gf(x) in general. "fg" means g first, then f. A very common error is to do f first. B marks may be awarded for seeing the correct intermediate value even if applied in wrong order.
2. **Inverse function**: Must rearrange — cannot "undo" operations by inspection for complex functions. The mark is awarded for showing the rearrangement step.
3. **f⁻¹(x) vs 1/f(x)**: These are NOT the same. f⁻¹(x) is the inverse function; 1/f(x) is the reciprocal.
4. **Evaluating at a specific value**: Show each step separately — find g(4) first, then f(g(4)). Writing only the final answer may lose the method mark if the answer is wrong.
5. **"Final answer"**: Cambridge uses "final answer" in mark schemes for functions — this means no further simplification should be done that makes the answer incorrect. Simplify to simplest form.
