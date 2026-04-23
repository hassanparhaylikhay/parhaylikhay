---
topic: Types of number
syllabus_ref: Cambridge 4024 Unit 1.1
last_updated: 2026-04-23
word_count: 2100
---

## Why this matters

Before you can do anything else in maths — solve an equation, simplify a fraction, prove something is rational — you need to know what kind of number you are looking at. Cambridge examiners test this on almost every paper. A typical question gives you a list like $\{52, \sqrt{169}, 27, \sqrt{8}, \tfrac{12}{23}, 49\}$ and asks "which is irrational?", "which is a cube number?", "which is a factor of 26?". Each part is one mark, and students lose them by rushing. If you know that $\sqrt{169} = 13$ is a whole number but $\sqrt{8}$ is not, those marks are free.

## The core idea

Numbers come in families, and the families sit inside each other like Russian dolls. Every natural number ($1, 2, 3, \ldots$) is also an integer. Every integer is also rational. Every rational number is also real. The biggest family is the real numbers — everything you can plot on a number line — and inside it sits a smaller family called rational, and inside that a smaller one called integers, and inside that natural numbers.

On top of this grouping, some numbers have **extra labels** based on their shape: square numbers, cube numbers, primes, triangular numbers. A number can carry many labels at once. $9$ is natural, an integer, rational, real, **and** a square number. Your job is to know which labels each number deserves.

## The mathematics

**Natural numbers** are the counting numbers: $1, 2, 3, 4, \ldots$ (Some textbooks include $0$. Cambridge 4024 follows the convention that natural numbers start from $1$.) Symbol: $\mathbb{N}$.

**Integers** are the naturals plus zero plus the negatives: $\ldots, -3, -2, -1, 0, 1, 2, 3, \ldots$. Symbol: $\mathbb{Z}$. Every integer is a whole number — no fractional part.

**Rational numbers** are numbers you can write as a fraction $\frac{p}{q}$ where $p$ and $q$ are integers and $q \neq 0$. Symbol: $\mathbb{Q}$. Every rational number has a decimal that either terminates (e.g. $\tfrac{3}{4} = 0.75$) or repeats forever in a pattern (e.g. $\tfrac{1}{3} = 0.\overline{3}$). Every integer is rational — you can always write $5$ as $\tfrac{5}{1}$.

**Irrational numbers** are real numbers that **cannot** be written as a fraction of integers. Their decimals go on forever with no repeating block. The three you meet most often at O-Level:

- $\pi = 3.14159\ldots$
- $\sqrt{2} = 1.41421\ldots$ (or any square root of a number that is not a perfect square)
- $e = 2.71828\ldots$ (rare at this level but worth knowing the name)

**Real numbers** are everything you can put on the number line: all the rationals plus all the irrationals. Symbol: $\mathbb{R}$.

$$\mathbb{N} \subset \mathbb{Z} \subset \mathbb{Q} \subset \mathbb{R}$$

Read that as: naturals sit inside integers, which sit inside rationals, which sit inside reals.

Now the **special labels** — these describe a number's shape, not which family it belongs to.

**Prime number**: a natural number greater than $1$ whose only factors are $1$ and itself. The primes start $2, 3, 5, 7, 11, 13, 17, 19, 23, \ldots$. Note that $1$ is **not** prime (one factor is not two), and $2$ is the only even prime.

**Composite number**: a natural number greater than $1$ that is not prime — it has at least one factor other than $1$ and itself. $4, 6, 8, 9, 10, 12, \ldots$.

**Square number**: an integer you get by squaring another integer. $1, 4, 9, 16, 25, 36, 49, 64, 81, 100, \ldots$.

**Cube number**: an integer you get by cubing another integer. $1, 8, 27, 64, 125, 216, \ldots$.

**Triangular number**: the sum $1 + 2 + 3 + \cdots + n$. They go $1, 3, 6, 10, 15, 21, 28, \ldots$.

**Factor of $n$**: a whole number that divides $n$ exactly. Factors of $26$ are $\{1, 2, 13, 26\}$.

**Multiple of $n$**: any number you get by multiplying $n$ by an integer. Multiples of $7$ are $7, 14, 21, 28, \ldots$.

**Prime factorisation**: writing a number as a product of primes, using index notation. For example, $360 = 2^3 \times 3^2 \times 5$. This is the key tool behind HCF (Highest Common Factor) and LCM (Lowest Common Multiple).

**HCF**: from two prime factorisations, take the **lowest** power of each common prime. **LCM**: take the **highest** power of every prime that appears in either number. If you only remember one line from this topic, make it that one.

## Worked examples

### Example 1 — classifying from a list (simple)

From the list $\{8, \sqrt{9}, \pi, \tfrac{7}{2}, 27\}$, identify:

(a) a cube number, (b) an irrational number, (c) a rational non-integer.

**Working.**

(a) A cube number is $n^3$ for some integer $n$. $27 = 3^3$, so **$27$** is the cube.

(b) $\pi$ has a non-terminating, non-repeating decimal. $\sqrt{9} = 3$ (an integer), so that is rational. The irrational is **$\pi$**.

(c) A rational non-integer is a fraction that does not simplify to a whole number. $\tfrac{7}{2} = 3.5$ — rational but not a whole number. Answer: **$\tfrac{7}{2}$**.

> **Examiner tip:** When a question says "from this list, find the irrational number", evaluate each square root first. $\sqrt{169}$ looks irrational until you notice $13^2 = 169$. w25_21 Q1 had exactly this trap.

### Example 2 — prime factorisation and HCF (standard)

$P = x^n y^2$ and $Q = x^{n-1} y^4$, where $x$ and $y$ are prime. Find the HCF of $P$ and $Q$ in terms of $x$, $y$ and $n$.

**Working.** HCF takes the **lowest** power of each prime.

For $x$: the powers are $n$ and $n-1$. Lowest is $n-1$. So the $x$ part of the HCF is $x^{n-1}$. **[B1 for this component alone]**

For $y$: the powers are $2$ and $4$. Lowest is $2$. So the $y$ part is $y^2$. **[B1 for this component alone]**

HCF $= \boxed{x^{n-1} y^2}$. **[B2 total: both components correct]**

Full marks $= 2$. This is exactly s23_12 Q14(b).

### Example 3 — LCM word problem (a standard twist)

Two flashing lights: a green light flashes every $12$ minutes, a red light flashes every $45$ minutes. They flash together at $11{:}00$. At what time do they next flash together?

**Working.** They next flash together after LCM$(12, 45)$ minutes.

$12 = 2^2 \times 3$ **[prime factorisation shown]**

$45 = 3^2 \times 5$

LCM takes the **highest** power of each prime across both: $2^2 \times 3^2 \times 5 = 4 \times 9 \times 5 = 180$ minutes. **[M1 for a valid method — factor trees or listing multiples both accepted]**

$180$ minutes $= 3$ hours. **[B2 for LCM $= 180$ seen]**

Next simultaneous flash: $11{:}00 + 3$ h $= \boxed{14{:}00}$. **[Final A mark]**

Full marks $= 3$. This is s25_13 Q11.

### Example 4 — exam-level LCM with unknowns

$N = 2^3 \times 3^x \times 5^y$. The LCM of $N$ and $360$ is $16{,}200$. Find $x$ and $y$.

**Working.** Factorise the constants that appear.

$360 = 2^3 \times 3^2 \times 5^1$

$16{,}200 = 2^3 \times 3^4 \times 5^2$ **[M1 for either of these prime factorisations — both often needed]**

The LCM takes the highest power of each prime. For the factor of $3$: the higher of $x$ and $2$ must equal $4$. Since $2 < 4$, we need $x = 4$. For the factor of $5$: the higher of $y$ and $1$ must equal $2$. Since $1 < 2$, we need $y = 2$.

$\boxed{x = 4, \ y = 2}$. **[A1 — both correct]**

Full marks $= 2$. This is w25_22 Q14(a), exactly as written on the 2025 paper.

### Example 5 — the hard case that catches students out

Write the recurring decimal $0.\overline{14}$ as a fraction in its simplest form.

**Working.** Let $x = 0.141414\ldots$.

Two digits repeat, so multiply by $100$:

$100x = 14.141414\ldots$

Subtract the original equation:

$100x - x = 14.141414\ldots - 0.141414\ldots$

$99x = 14$ **[M1 for the algebraic setup — the recurring tails cancel]**

Hmm — the denominator should be $99$, not $90$. Let me check.

Looking at the w25_11 Q18 answer of $\tfrac{13}{90}$ tells us the original decimal is actually $0.1\overline{4}$ (only the $4$ recurs, not "$14$"). So:

Let $x = 0.1444\ldots$. Multiply by $10$: $10x = 1.444\ldots$. Multiply by $100$: $100x = 14.444\ldots$.

Subtract: $100x - 10x = 14.444\ldots - 1.444\ldots$

$90x = 13$ **[M1 — this is the mark scheme's key setup: $14.444 - 1.444 = 13$ with denominator $90$]**

$x = \boxed{\dfrac{13}{90}}$. **[A1 — answer]**

Full marks $= 2$.

> **Examiner tip:** Read the dot notation carefully. $0.\overline{14}$ (both digits recur) and $0.1\overline{4}$ (only the $4$ recurs) are different numbers with different fraction forms. Miss this and the whole question goes wrong.

## How Cambridge marks this

The marking patterns for the Number topic are tight and predictable if you know what to look for.

**For HCF/LCM questions**: the method must be visible. Cambridge routinely awards **B1 or M1 for the prime factorisation being shown** — even if the final HCF or LCM is wrong. A student who writes "$360 = 2^3 \times 3^2 \times 5$, $N = 2^3 \times 3^x \times 5^y$" and then muddles the comparison still earns the M1 for factorising. Skipping straight to the answer forfeits it. This pattern appears on w25_22 Q14, s23_21 Q5, w23_12 Q9 — every year.

**For recurring decimals**: the mark scheme says things like "M1 for $14.444\ldots - 1.444\ldots$ oe or for $90x = 13$ oe". The A1 is the fraction itself. A correct final fraction without the algebraic setup can fail to earn the M1 — Cambridge wants to see the process. (w25_11 Q18.)

**For type-identification questions** (e.g. "which of these is irrational?"): each part is usually **one B1 mark, cao** (correct answer only). No method marks, because there is no method to show. Either the student identifies the right number or they do not. On these questions, care and clarity of presentation matter more than working.

**For estimation** ("write each to 1 s.f. and estimate"): Cambridge awards **B1 for at least two of the values correctly rounded**, even if the final calculation is wrong. So if the question has three numbers to round and a student rounds two correctly but then slips on the arithmetic, they still get $1/2$ marks. Seen on w25_11 Q9 and s23_12 Q11.

**For standard form**: the answer must be in **strict** standard form, $a \times 10^n$ with $1 \le a < 10$. Writing $12.9 \times 10^{2n-1}$ when the answer should be $1.29 \times 10^{2n}$ loses the B2 — this exact trap sits in s23_22 Q5(b).

## Common mistakes and exam traps

**Mistake 1: Calling $\sqrt{\text{something}}$ irrational without checking.** Students see a square root and write "irrational" automatically. But $\sqrt{169} = 13$, $\sqrt{0.25} = 0.5$, $\sqrt{\tfrac{1}{9}} = \tfrac{1}{3}$ — all rational. **How to avoid it**: evaluate every square root first. If the number under the root is a perfect square (or a ratio of perfect squares), it is rational. If not, it is irrational. This exact trap was set on w25_21 Q1.

**Mistake 2: Confusing factor and multiple.** "Factor of $26$" means a number that divides $26$ ($\{1, 2, 13, 26\}$). "Multiple of $26$" means $26, 52, 78, \ldots$. Students mix them up under exam pressure. **How to avoid it**: **F**actors are **F**ewer, multiples are many.

**Mistake 3: Saying $1$ is prime.** The definition requires two factors: $1$ and itself. $1$ has only one factor ($1$). So $1$ is neither prime nor composite. **How to avoid it**: memorise the first ten primes ($2, 3, 5, 7, 11, 13, 17, 19, 23, 29$) — and notice $1$ is not on the list.

**Mistake 4: Taking the wrong powers when finding HCF vs LCM.** HCF = **lowest** powers of **common** primes. LCM = **highest** powers of **all** primes. Students reliably flip these. **How to avoid it**: HC**F**ew (take less), LC**M**ore (take more). Also, always write out both prime factorisations first — the comparison becomes mechanical.

**Mistake 5: Leaving $0.034$ as the final answer instead of $3.4 \times 10^{-2}$.** The question asked for standard form; your decimal is not in standard form. **How to avoid it**: underline the words "standard form" in the question. Check your final answer has exactly one non-zero digit before the decimal point. w25_22 Q12(b) punished this.

## Try it yourself

Below the lesson there is a **classification quiz**. You will be shown a number — sometimes plain, sometimes under a square root — and asked which labels apply: natural, integer, rational, irrational, square, cube, or prime. Aim for ten correct answers in a row. Watch especially for the square-root traps and the labels that stack ($9$ is natural **and** a square number **and** rational).

## Quick summary

- **Naturals $\subset$ integers $\subset$ rationals $\subset$ reals** — the families nest inside each other.
- **Irrational** means the decimal goes on forever with no pattern: $\pi$, $\sqrt{2}$, $\sqrt{8}$ — but $\sqrt{169} = 13$ is rational.
- **HCF** = lowest powers of common primes. **LCM** = highest powers of all primes.
- A recurring decimal converts to a fraction by setting $x$ equal to the decimal, multiplying by $10^{\text{(length of repeat)}}$, subtracting, and solving.
- In standard form, the coefficient $a$ must satisfy $1 \le a < 10$ — always.
