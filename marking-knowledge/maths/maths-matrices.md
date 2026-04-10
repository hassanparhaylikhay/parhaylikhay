# Cambridge 4024 O-Level Mathematics — Matrices Topic Knowledge
**Sources:** s24_11, s24_12, w24_11, w24_12 (2024 series — new topic first appearing) + s23_12, w23_12 (2023 series)
---

## 1. Matrix Operations — Addition, Subtraction, Multiplication

### What the mark scheme rewards
- B1 per correct element for addition/subtraction
- B1 for two or three correct elements (partial credit)
- M1 for correct method of matrix multiplication (row × column)

### Key examples from 2024 papers

**s23_12 Q18(b)(i):** Matrix C = [[6, 4], [2, 1]] gives the contents of a large and small gift bag (soaps, candles). Matrix M = column vector (120, 60) gives the mass in grams of a soap and a candle. Find N = CM.
- N = CM: row 1 × M: 6(120) + 4(60) = 720 + 240 = 960; row 2 × M: 2(120) + 1(60) = 240 + 60 = 300
- N = column vector (960, 300)
- B1 for (960, k) or (k, 300) or both 960 and 300 seen in final answer (partial if one element correct)
- Full answer: N = (960, 300) [column vector]
- Full marks = 2

**s23_12 Q18(b)(ii):** Explain what each element of N represents.
- Each element is the total mass (in grams) of the contents of each bag type: 960 g for the large bag, 300 g for the small bag
- Answer: mass [of contents] of a large bag, and mass [of contents] of a small bag [B1]
- Full marks = 1
- Key point: "explain what the elements represent" questions test understanding of the context, not calculation. Must explicitly link the matrix elements to the real-world quantities.

**s24_11 Q20:** Matrix N satisfies the equation 3N = N + 5[[4, 0], [6, −2]]. Find N.
- 3N − N = 5[[4, 0], [6, −2]] → 2N = [[20, 0], [30, −10]] → N = [[10, 0], [15, −5]]
- M1 for 3 correct elements in their 2N or for [[20, 0], [30, −10]] seen
- Full answer: N = [[10, 0], [15, −5]]
- Full marks = 2

**w24_11 Q16(a):** Given two 2×2 matrices, find their difference (A − B or similar).
- Full answer: [[5, −5], [6, 3]]
- B1 for two or three correct elements
- Full marks = 2

**w24_12 Q21:** Matrix A has unknown elements k (top-left) and m (bottom-right). Matrix B is given. Given that A × B = [[13, ...], [1, 1]] (or a specific product), find k and m.
- Full answer: A = [[13, −7], [1, 1]] (or equivalent)
- M1 for setting up the correct row × column equation: e.g., 20 = k×(−1) − 7×(−1) or equivalent element equation
- B1 for identifying the structure of A (which elements are unknown)
- B2 for partially correct answer (e.g., one row correct)
- Full marks = 3

---

## 2. Determinant of a 2×2 Matrix

### Formula
For matrix M = [[a, b], [c, d]], det(M) = ad − bc

### What the mark scheme rewards
- B1 for correct determinant value (when computing it)
- M1 for setting det = given value and solving for unknown element (when working backwards)
- If det = 0, the matrix has no inverse (mention this explicitly)

### Two question types:
1. **Given full matrix → find det**: apply ad − bc directly
2. **Given det and matrix with unknown k → find k**: set ad − bc = det and solve (linear equation in k)

### Key examples from 2024 papers

**w24_11 Q16(b)(i):** A = [[4, k], [2, 1]]. The determinant of A is given as 10. Find k.
- det = (4)(1) − (k)(2) = 4 − 2k = 10 → 2k = −6 → k = −3
- M1 for setting up 4 − 2k = 10 oe (or det formula applied correctly)
- Full answer: k = −3
- Full marks = 1 [B1]

---

## 3. Inverse of a 2×2 Matrix

### Formula
For M = [[a, b], [c, d]], M⁻¹ = (1/det) × [[d, −b], [−c, a]]

Steps:
1. Find det(M) = ad − bc
2. Swap main diagonal: a ↔ d
3. Negate off-diagonal: b → −b, c → −c
4. Multiply entire matrix by 1/det

### What the mark scheme rewards
- M1 for finding the correct determinant
- B1 for correct adjugate matrix (the swapped/negated matrix before dividing by det)
- A1 for correct final inverse matrix

### Key examples from 2024 papers

**s24_12 Q23(a):** Given matrix M = [[3, 1], [−2, 1]] (or similar — 2×2 matrix with det = 2), find M⁻¹.
- det(M) = 2; adjugate = [[1, −1], [2, 3]]; M⁻¹ = (1/2) × [[1, −1], [2, 3]]
- Full answer: M⁻¹ = (1/2) × [[1, −1], [2, 3]] oe
- B1 for correct adjugate (swapped diagonal, negated off-diagonal)
- B1 for correct 1/det factor
- Full marks = 2

**w24_11 Q16(b)(ii):** Using k = −3 from (b)(i), find A⁻¹ where A = [[4, −3], [2, 1]].
- det = 10 (given); adjugate = [[1, 3], [−2, 4]]
- A⁻¹ = (1/10) × [[1, 3], [−2, 4]] oe
- B1 FT their k (using k = −3 from b(i) to construct the adjugate correctly)
- Full marks = 1

---

## 4. Solving Simultaneous Equations by Matrix Method

### Method
If AX = B, then X = A⁻¹B

For system: ax + by = p, cx + dy = q:
- Write as [[a, b], [c, d]] × [[x], [y]] = [[p], [q]]
- Multiply both sides by inverse of coefficient matrix
- Read off x and y from resulting column vector

### What the mark scheme rewards
- M1 for writing the correct matrix equation (coefficient matrix × variable vector = constant vector)
- M1 for multiplying by the inverse correctly
- A1 for correct x and A1 for correct y (or A2 for both)
- SC1 for getting one value correct (x or y) without showing full method

### Key examples from 2024 papers

**s24_12 Q23(b):** Two simultaneous equations are given (e.g., 3x + y = 7 and −2x + y = 4). Use the matrix inverse from Q23(a) to solve for x and y.
- M1 for M⁻¹ × [[7], [4]] oe (multiplying their inverse by the constant vector)
- Full answer: x = 2, y = 1
- SC1 for (2, −1) only [common sign error in inverse matrix]
- Full marks = 2

**w24_12 Q21:** Two simultaneous equations given; find the unknown elements of the coefficient matrix, then solve using the matrix method.
- Combined with the matrix structure question above (same question number)
- Full marks = 3 (M1A1 structure with B marks for partial credit)

---

## 5. Matrix Multiplication with Unknown Elements → Quadratic Equation

### New pattern from 2023: matrices with variable entries; multiply and equate elements to form and solve a quadratic

### What the mark scheme rewards
- M1 for correctly computing the top-left element of the product (must show row × column multiplication)
- A1 for reaching the target quadratic "with no errors or omissions" (A0 if any errors)
- M1 for factorisation/quadratic formula when solving
- A1 for both solutions
- Further marks (M1A1 or B2) for finding y when a specific root is substituted back

### Key example from 2023 papers

**w23_12 Q22:** [[x, 3], [2, x+1]] × [[x−1], [2]] = [[2x+6], [y]]
- (a) Show that x² − 3x = 0:
  Top-left product: x(x−1) + 3(2) = x² − x + 6. Set equal to 2x + 6: x² − x + 6 = 2x + 6 → x² − 3x = 0 ✓
  M1 for x(x−1) + 3×2 [= 2x+6] (top row multiplication set up correctly)
  A1 for x² − x + 6 = 2x + 6 leading to x² − 3x = 0 with brackets expanded and no errors
  Full marks = 2

- (b)(i) Solve x² − 3x = 0: x(x−3) = 0 → x = 0 or x = 3
  M1 for x(x−3) [= 0] seen OR for (3 ± √9)/2 OR for 3/2 ± √(9/4)
  Full answer: x = 0 or x = 3
  Full marks = 2

- (b)(ii) Find y when x > 0 (so x = 3):
  Bottom row: 2(x−1) + (x+1)(2) = 2(3−1) + (3+1)(2) = 4 + 8 = 12
  Equivalently: 2(x−1) + 2(x+1) = 4x = 4(3) = 12
  M1 for 2(x−1) + 2(x+1) [= y] oe or for substitution of their x>0 into 2(their x−1) + 2(their x+1)
  Full answer: y = 12
  Full marks = 2

---

## Marking Traps — Matrices Topic

1. **Row × column rule**: Matrix multiplication is NOT commutative — AB ≠ BA. Always multiply row of left matrix by column of right matrix.
2. **Determinant sign**: det = ad − bc, NOT ad + bc. A missing minus sign costs the B mark.
3. **Inverse formula**: The off-diagonal elements get negated AND the diagonal elements get swapped. Forgetting to negate = wrong inverse.
4. **1/det in front**: Students often write the adjugate correctly but forget to divide by the determinant.
5. **SC1 for one correct value**: If both x and y are asked and method is wrong, SC1 applies if one is correct — but ONLY if the answer comes from some recognisable attempt at the matrix method.
6. **No inverse if det = 0**: If the determinant is zero, the matrix is singular and has no inverse. Cambridge may test this understanding.
