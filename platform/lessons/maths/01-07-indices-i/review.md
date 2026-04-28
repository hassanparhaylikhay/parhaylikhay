---
title: Review & practice
checks:
  - q: 'Simplify $4^3 \times 4^{-5}$.'
    options: ["$4^{-2}$", "$4^{15}$", "$4^8$", "$16^{-2}$"]
    correct: 0
    explain: 'Same base, multiply, add indices: $4^{3+(-5)} = 4^{-2}$.'
  - q: 'Compute $5^0 + 5^{-1}$.'
    options: ["$\\tfrac{1}{5}$", "$\\tfrac{6}{5}$", "$0$", "$5\\tfrac{1}{5}$"]
    correct: 1
    explain: '$5^0 = 1$ and $5^{-1} = \tfrac{1}{5}$. Sum is $1 + \tfrac{1}{5} = \tfrac{6}{5}$.'
  - q: 'Compute $64^{1/3}$.'
    options: ["$8$", "$32$", "$16$", "$4$"]
    correct: 3
    explain: 'Cube root: $4^3 = 64$, so $64^{1/3} = 4$.'
  - q: 'Compute $16^{3/4}$.'
    options: ["$8$", "$12$", "$48$", "$2$"]
    correct: 0
    explain: 'Fourth root first: $\sqrt[4]{16} = 2$. Then cube: $2^3 = 8$.'
  - q: 'Simplify $(2^3)^2 \div 2^{-1}$.'
    options: ["$2^5$", "$2^7$", "$2^{12}$", "$2^4$"]
    correct: 1
    explain: 'Power-of-power first: $(2^3)^2 = 2^6$. Then divide: $2^{6-(-1)} = 2^7$.'
  - q: 'Compute $\left(\dfrac{3}{2}\right)^{-2}$.'
    options: ["$\\tfrac{4}{9}$", "$\\tfrac{9}{4}$", "$-\\tfrac{9}{4}$", "$\\tfrac{6}{4}$"]
    correct: 0
    explain: 'Flip the fraction (negative index), then square: $\left(\tfrac{2}{3}\right)^2 = \tfrac{4}{9}$.'
---

You've now covered every type of index that Cambridge tests at this level: positive integers, zero, negatives, and fractions. The three core rules ($\times$ adds, $\div$ subtracts, power-of-power multiplies) work for all of them, as long as the bases are the same.

## The skills you should have

- **Reading powers**: identifying base and index, knowing they don't commute.
- **Three rules**: $a^m \times a^n = a^{m+n}$, $a^m \div a^n = a^{m-n}$, $(a^m)^n = a^{mn}$.
- **Special cases**: $a^0 = 1$, $a^{-n} = \tfrac{1}{a^n}$, $a^{1/n} = \sqrt[n]{a}$.
- **Fractional indices**: $a^{m/n} = (\sqrt[n]{a})^m$. Root first, then power.
- **Combining**: simplify with the rules first, then evaluate.

## Marking patterns

| Question style | Marks | Notes |
|---|---|---|
| "Find the value of $7^{-2}$" | 1 | B1 for $\tfrac{1}{49}$ |
| "Find the value of $81^{1/2}$" | 1 | B1 for $9$ |
| "Find the value of $8^{-2/3}$" | 2 | M1 for $\tfrac{1}{8^{2/3}}$ or $\tfrac{1}{(\sqrt[3]{8})^2}$, A1 for $\tfrac{1}{4}$ |
| "Simplify $2^{-3} \times 2^4$" | 1–2 | M1 for $2^1$ form, A1 for $2$ |
| "Simplify $(2^3)^2$" | 1 | B1 for $2^6$ or $64$ |

## The single biggest mistake

**Confusing "negative index" with "negative answer".** $2^{-3} = \tfrac{1}{8}$, a positive fraction. The minus in the index reciprocates; it does not flip the sign of the value. The only way to get a negative result from a power is if the BASE is negative.

## Final check

Six mixed-rule problems covering positive, zero, negative, and fractional indices.
