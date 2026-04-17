# CLAUDE.md — Master Instructions for Parhaylikhay

> Read this file before starting any task in this project.

---

## Platform Overview

**Name:** Parhaylikhay
**Audience:** Cambridge O-Level students in Pakistan (typically ages 14–16)
**Subjects:** Mathematics and Physics
**Hosting:** Circle.so
**Widgets hosted on:** Codepen, embedded into Circle.so via Iframely
**Goal:** Deliver marking-scheme-aware lessons that help students score marks — not just understand concepts.

---

## Brand Colors

| Role       | Hex       |
|------------|-----------|
| Background | `#0d1216` |
| Blue       | `#00abfa` |
| Yellow     | `#fff067` |
| Orange     | `#ff822c` |
| Green      | `#0fee89` |
| Pink       | `#ff4670` |

All UI, animations, and manipulatives must use these colors. Dark background is the base. Never use white backgrounds. Use best judgement for neutral extras (e.g. `#888780` for axes, `#1a3350` for faint grid lines).

---

## Tone

- English only — no Urdu/English mixing
- Never stiff or purely formal — respectful but friendly
- Encourage students the way a teacher would
- Explanations should feel like a teacher sitting next to the student, not a textbook

**Example tone:**
> "The marking scheme says you must write F = ma with units — without units, you lose that mark. We don't want that."

---

## Marking-Scheme Awareness — Non-Negotiable

Every explanation, worked example, and answer must be marking-scheme aware. This means:

- Always reference what the actual Cambridge mark scheme awards marks for
- Explicitly call out which steps earn marks (e.g. "this is your method mark", "write the formula first — that earns M1")
- Never hallucinate mark scheme points — if unsure, say so and tell the student to verify in the official mark scheme
- Distinguish between:
  - **M marks** — method marks, awarded for correct approach
  - **A marks** — accuracy marks, awarded for correct answer (usually depends on M mark)
  - **B marks** — independent marks, awarded regardless of method
  - **ECF** — error carried forward, student can still earn marks using a wrong earlier answer if applied correctly
  - **nfww** — not from wrong working, correct answer must come from valid method
  - **SC** — special case marks for partially valid alternative approaches
- When writing model answers, annotate each line with its mark type where possible

---

## Content Structure

### Manipulatives (Interactive Widgets)
Built in **HTML5 Canvas** — see `MANIPULATIVE_SKILL.md`

CindyJS is available for true geometric constructions — see `CINDY_SKILL.md` and `CINDY_PATTERNS.md`

**Decision rule:**
- Sliders driving a graph → Canvas
- Draggable points driving geometry updates → Canvas
- True ruler-and-compass style constraint solving → CindyJS

### Animated Videos
Built in **Manim Community v0.19.0** (Cairo renderer) — see `MANIM_SKILL.md`

### Platform
Circle.so — content is embedded or linked within Circle spaces

---

## Project File Structure

```
ParhayLikhay/
├── CLAUDE.md                          ← this file
├── MANIM_SKILL.md                     ← Manim video rules
├── CINDY_SKILL.md                     ← CindyJS rules
├── CINDY_PATTERNS.md                  ← ground-truth CindyJS patterns
├── MANIPULATIVE_SKILL.md              ← HTML5 Canvas widget rules
├── MARKING_SKILL.md                   ← annotating student answer sheets → marked_answer.jpeg
│
├── maths-quadratic-explorer.html      ← widget: y = ax² + bx + c
├── maths-circle-angle-centre.html     ← widget: angle at centre theorem
│
├── quadratic-graphs/                  ← Manim video: quadratic graphs
│   ├── script.py                      ← 8 scenes
│   ├── plan.md
│   ├── concat.txt
│   └── final.mp4                      ← rendered output (5m 7s, 1080p60)
│
├── marking-knowledge/
│   └── maths/                         ← Cambridge 4024 marking patterns
│       ├── maths-marking-principles.md
│       ├── maths-algebra.md
│       ├── maths-number.md
│       ├── maths-geometry.md
│       ├── maths-trigonometry.md
│       ├── maths-statistics.md
│       ├── maths-probability.md
│       ├── maths-vectors.md
│       ├── maths-graphs.md
│       ├── maths-transformations.md
│       ├── maths-mensuration.md
│       ├── maths-sequences.md
│       ├── maths-functions.md
│       ├── maths-surds.md
│       └── maths-matrices.md             ← new topic (first appears 2024)
│
└── maths-past-papers/
    └── 2025/
        ├── Summer/                    ← s25 variants 12, 13, 22, 23
        └── Winter/                    ← w25 variants 11, 12, 21, 22
```

---

## Cambridge 4024 Syllabus — Unit Sub-Topics

Pre-loaded so future sessions never need to open the PDF. Source: Cambridge 4024 syllabus.

### Unit 1 — Number
- **1.1** Types of number: natural, integer, rational, irrational, real; prime, square, cube, triangular numbers; HCF, LCM; prime factorisation
- **1.2** Sets: notation, Venn diagrams, union, intersection, complement, subsets, empty set
- **1.3** Fractions, decimals, percentages: conversions, rounding, significant figures, decimal places, standard form (a × 10ⁿ), estimation
- **1.4** Ratio and proportion: simplifying, dividing quantities, scale, map distances, direct and inverse proportion
- **1.5** Rates: speed/distance/time, unit rates, currency conversion, density, pressure
- **1.6** Percentage calculations: percentage increase/decrease, reverse percentage, profit/loss, simple interest, compound interest
- **1.7** Time: 12h/24h clocks, durations, timetables
- **1.8** Money: bills, best-buy comparisons, exchange rates

### Unit 2 — Algebra and Graphs
- **2.1** Algebraic manipulation: expanding brackets (including (a+b)²), factorising (common factor, difference of squares, trinomials), simplifying expressions, algebraic fractions
- **2.2** Solving equations: linear, quadratic (factorising, formula, completing the square), simultaneous (elimination, substitution, graphical), inequalities (number line notation)
- **2.3** Indices: laws of indices, zero and negative indices, fractional indices, surds (simplify, rationalise denominator)
- **2.4** Sequences: nth term of arithmetic and geometric sequences, recognising patterns
- **2.5** Functions: notation f(x), composite fg(x), inverse f⁻¹(x), domain and range
- **2.6** Graphs of functions: y = mx + c (gradient, intercepts), y = ax² + bx + c (vertex, roots, axis of symmetry), y = axⁿ for n = −2, −1, 0, 1, 2, 3; y = aˣ, y = |x|
- **2.7** Graphical methods: reading gradients/intercepts, drawing tangents to find gradient, areas under velocity-time graphs, travel graphs, rates of change

### Unit 3 — Coordinate Geometry
- **3.1** Gradient: m = (y₂−y₁)÷(x₂−x₁); positive/negative/zero/undefined gradient
- **3.2** Straight-line equation: y = mx + c; equation from two points or gradient + point; finding gradient and intercepts from equation
- **3.3** Midpoint and distance: M = ((x₁+x₂)/2, (y₁+y₂)/2); d = √((x₂−x₁)²+(y₂−y₁)²)
- **3.4** Parallel and perpendicular lines: parallel → same gradient; perpendicular → m₁×m₂ = −1

### Unit 4 — Geometry
- **4.1** Geometrical terms: triangles (equilateral/isosceles/scalene/right-angled/obtuse); quadrilaterals (square/rectangle/kite/rhombus/parallelogram/trapezium); polygons; solids; circle parts (centre/radius/diameter/circumference/semicircle/chord/tangent/arc/sector/segment)
- **4.2** Geometrical constructions: drawing and measuring lines and angles; constructing triangles with ruler and compasses; nets of 3D solids
- **4.3** Scale drawings and bearings: three-figure bearings measured clockwise from North (000°–360°); scale drawings; back-bearing = bearing ± 180°
- **4.4** Similarity: similar shapes have equal angles and proportional sides; scale factor k → lengths ×k, areas ×k², volumes ×k³
- **4.5** Symmetry: line symmetry (count lines of symmetry); rotational symmetry (order of rotation); planes of symmetry and axes of symmetry in 3D solids
- **4.6** Angles: angles at a point = 360°; angles on a straight line = 180°; vertically opposite angles equal; parallel lines → corresponding angles equal, alternate angles equal, co-interior angles = 180°; interior angle sum of polygon = (n−2)×180°; exterior angles sum = 360°
- **4.7** Circle theorems I: angle in semicircle = 90°; tangent ⊥ radius = 90°; angle at centre = 2 × angle at circumference; angles in same segment equal; opposite angles of cyclic quadrilateral = 180°; alternate segment theorem
- **4.8** Circle theorems II: equal chords equidistant from centre; perpendicular from centre bisects chord; tangents from external point are equal in length

### Unit 5 — Mensuration
- **5.1** Perimeter and area: rectangle, triangle, parallelogram, trapezium, circle (C = 2πr, A = πr²), arc length, sector area
- **5.2** Surface area and volume: cuboid, prism, cylinder, cone, sphere, pyramid; composite solids; converting units (cm²↔m², cm³↔m³)

### Unit 6 — Trigonometry
- **6.1** Right-angled triangles: sin/cos/tan ratios (SOH-CAH-TOA); finding sides and angles; Pythagoras' theorem
- **6.2** Non-right-angled triangles: sine rule (a/sinA = b/sinB), cosine rule (a² = b²+c²−2bc cosA), area = ½ab sinC; ambiguous case of sine rule
- **6.3** Angles of elevation and depression; 3D trigonometry (identify right-angled triangles in 3D)

### Unit 7 — Transformations and Vectors
- **7.1** Transformations: reflection (mirror line), rotation (centre, angle, direction), translation (vector), enlargement (centre, scale factor including negative); combined transformations; finding the transformation given object and image
- **7.2** Vectors: column vector notation, adding/subtracting vectors, scalar multiplication, magnitude |v| = √(x²+y²); position vectors; geometric proofs using vectors

### Unit 8 — Probability
- **8.1** Basic probability: P(event) = favourable/total; complementary events; mutually exclusive events; P(A∪B) = P(A)+P(B)−P(A∩B)
- **8.2** Combined events: tree diagrams; two-way tables; independent events P(A∩B) = P(A)×P(B); conditional probability P(A|B)
- **8.3** Relative frequency; experimental vs theoretical probability

### Unit 9 — Statistics
- **9.1** Data collection and display: bar charts, pie charts, pictograms, stem-and-leaf, scatter diagrams, line graphs, histograms (frequency density = frequency ÷ class width), frequency polygons
- **9.2** Averages and spread: mean, median, mode, range; quartiles and interquartile range; mean and modal class from grouped frequency tables; reading median from cumulative frequency curve
- **9.3** Cumulative frequency: draw and read cumulative frequency curve, median, quartiles, interquartile range, percentiles
- **9.4** Correlation: positive/negative/no correlation; line of best fit; using line of best fit to predict

---

## Marking Knowledge Base

The `marking-knowledge/maths/` folder contains marking patterns extracted from Cambridge 4024 past papers. Before writing any marked worked example, check the relevant topic file first.

**Years processed:** 2025 (8 papers, fully verified) + 2024 (8 papers, processed + systematically verified for diagram-dependent errors April 2026) + 2023 (8 papers: s23_11, s23_12, s23_21, s23_22, w23_11, w23_12, w23_21, w23_22 — processed using Read tool directly on PDFs)

---

### KB Entry Format — Non-Negotiable

Every entry in a topical .md file must follow this structure:

```
**[paper_code] Q[number]([part]):** [1–2 sentence description of what is being asked — the question context]
- [Key working or formula used]
- [Mark scheme annotation: M1 for..., B1 for..., A1 for...]
- Full answer: [answer]
- Full marks = [N]
```

**The question description (first line) is mandatory.** Without it, the KB is useless for marking — when you are called to mark a student's paper and the KB is loaded, you need to recognise the question type immediately from the stub. Bare answers with no context fail this purpose.

Examples of BAD entries (do not write these):
```
**w25_12 Q7:** Answer: 5n − 2. B1 for 5n + k.
```

Examples of GOOD entries:
```
**w25_12 Q7:** A sequence 3, 8, 13, 18, 23... Find the nth term.
- Common difference = 5 → coefficient is 5
- Full answer: 5n − 2
- B1 for 5n + k (any k) or jn − 2 (any j)
- Full marks = 2
```

---

### KB Population Rules

- **Intelligently, not exhaustively**: Do not add every question from a paper. Add entries that have a meaningfully different question context or marking pattern compared to what's already there.
- **Different context = different entry**: Two questions testing the same skill but with different structures (e.g., compound interest with one period vs. two periods) both deserve entries.
- **Same context = update or skip**: If a new paper has the same question type with the same marking structure, update the existing entry's "Key examples" rather than duplicating.
- **Don't overpopulate**: A KB that has 40 entries per topic becomes noise. Aim for coverage of distinct patterns, not complete coverage of all questions.

---

### When Processing More Past Paper PDFs

**Correct approach (2023 series and earlier, or any future papers):**
Use the Read tool directly on the PDF with page ranges — it renders pages visually, exactly as a human would see them:
```
Read tool → file.pdf → pages: "1-5"
Read tool → file.pdf → pages: "6-10"
```
This gives full visibility of √ symbols, matrix layouts with unknown elements, diagrams, graphs, fractions — everything. No conversion step needed. Produces clean entries with no uncertainty flags on the first pass.

**Legacy approach (used for 2024 and 2025 — do not repeat):**
pdftotext was used for these papers. Known failure modes from that approach:
- √ symbols silently dropped (√169 → 169)
- Matrix unknown elements indistinguishable from fixed values — led to wrong question type reconstruction (e.g., "find k given det=10" misread as "find det of [[4,2],[1,−3]]")
- Diagrams invisible — question context had to be guessed from mark scheme intermediates
- Stacked fractions concatenated oddly
- Entries from these papers with "*Note: verify against QP*" flags are the direct result of this approach

When a value is uncertain in an existing entry: write "*Note: pdftotext may have affected this — verify against QP*"

**Verifying existing 2024/2025 entries against QPs (the pdftoppm workflow):**
Since the Read tool can render PDFs as images, use pdftoppm to pre-convert pages to PNG first, then read the PNG:
```bash
/opt/homebrew/bin/pdftoppm -png -r 150 -f [start_page] -l [end_page] file.pdf /tmp/qp_verify/prefix
# Then: Read tool → /tmp/qp_verify/prefix-XX.png
```
When verifying a flagged entry: check BOTH the QP (for question context and diagram) AND the MS (for exact mark breakdown and answer). QP alone tells you the question; MS alone tells you the answer — you need both to write a complete correct entry. After verifying and fixing, remove any "(pdftotext may have dropped...)" or "check QP" flags from the entry.

---

### How to Use the KB When Marking

When asked to mark a student's answer on a specific topic:
1. Load `maths-marking-principles.md` — this gives universal marking conventions
2. Load the relevant topical file (e.g., `maths-trigonometry.md`) — this gives question-specific marking patterns
3. Match the student's question to an entry in the topical file by reading the question stubs
4. Apply the mark scheme from the matching entry, using the mark types from the principles file
5. Use FT (follow through) to award partial marks where appropriate
6. If the question doesn't match any entry: apply general principles conservatively; do not hallucinate specific mark scheme allocations

---

## Environment

**Manim:**
- Version: Community v0.19.0
- Binary: `/Users/hassanahmad/Library/Python/3.9/bin/manim`
- Add to PATH: `export PATH="$PATH:/Users/hassanahmad/Library/Python/3.9/bin"`

**LaTeX (required for Manim MathTex):**
- BasicTeX installed at `/Library/TeX/texbin`
- Add to PATH: `export PATH="$PATH:/Library/TeX/texbin"`

**Render command for Manim videos:**
```bash
export PATH="$PATH:/Library/TeX/texbin:/Users/hassanahmad/Library/Python/3.9/bin"
manim -qh script.py SceneName
ffmpeg -f concat -safe 0 -i concat.txt -c copy final.mp4
```

**PDF extraction:**
- pdftotext installed at `/opt/homebrew/bin/pdftotext` (poppler) — no longer used for new papers
- For new papers: use the Read tool directly on the PDF with `pages: "1-5"` etc.
- For spot-checking specific pages in legacy (2024/2025) PDFs: pdftoppm at `/opt/homebrew/bin/pdftoppm`

---

## KB Maintenance — How to Update the Knowledge Base

### Adding entries for a new paper series

When new past papers become available (e.g., 2026 series):
1. Use the Read tool directly on the QP PDF (pages: "1-5", "6-10" etc.) — it renders pages visually. No pdftotext. For the MS, do the same.
2. For each question, identify which topical .md file it belongs to
3. Check if the marking pattern is already covered — if yes, skip or add as a brief additional example
4. If new pattern: write a full entry with question stub + all mark annotations
5. Update the Sources line at the top of each modified file
6. Update CLAUDE.md "Years processed" line
7. Check `maths-marking-principles.md` for any new universal patterns or abbreviations

### Checking an existing entry for quality

A good entry has ALL of these:
- ✓ Paper code and question number (e.g., `**w25_22 Q13(a)(ii):**`)
- ✓ 1-2 sentence question description (what is being asked, with key numbers/context)
- ✓ Key working or formula step
- ✓ M/A/B mark annotations for each scoring step
- ✓ Full answer stated clearly
- ✓ Full marks = N (number of marks the question is worth)

A bad entry is missing the question description, or has answer/marks with no context. Fix these on sight.

### Cross-topic entries

Some questions span two topics (e.g., a cone problem uses both mensuration formulas and algebra). These appear in both relevant topic files — this is correct and intentional. Each file covers the question from its own topic's perspective.

### Known pdftotext failure patterns (from 2024/2025 verification)

These are the categories of errors pdftotext introduced. Watch for these in any entry from the legacy period:

| Category | Example of error | Fix |
|---|---|---|
| **Diagram completely misread** | w24_21 Q9: "circle diagram" when it was a triangle with parallel lines | Re-read QP |
| **Scale factor sign lost** | s24_21 Q6(b): SF = 1/2 when it was −1/2 (negative enlargement) | Check image position relative to centre |
| **SA formula incomplete** | w24_21 Q6(c): missing base circle πr² in cylinder+cone SA | Account for all exposed faces |
| **"Check QP" flags** | s24_22 Q8(a)(i): "pdftotext may have dropped cone term" — the equation was actually correct | Verify then remove flag |
| **Angle/dimension labels swapped** | s24_22 Q8(b): "radius = 0.8r, angle = 1.2θ" was backwards | Re-read problem statement |
| **Shape misidentified** | w24_22 Q3(a): "trapezoid" when it was a cuboid | Re-read QP |
| **Wrong graph equation** | w25_11 Q22(b): y = x³ − 2x + 3 instead of y = x³ − 3x + 2 | Check all parts use same equation |
| **Wrong circle theorem** | s25_22 Q14(a): "angles in same segment" instead of alternate segment theorem | Re-read QP for tangent details |

### Duplicate detection

If the same question (same paper code, same Q number) appears twice in the same file, keep the better-described version and remove the duplicate. This can happen when sections were added incrementally.

---

## General Rules

1. Read this file before starting any task.
2. Do not introduce new brand colors — use only the palette above, with best judgement for neutral extras.
3. All code (Canvas, Manim, HTML/CSS) must match the dark brand aesthetic.
4. When generating worked examples, always prefer real Cambridge past paper questions over made-up ones.
5. Keep explanations at the right level — O-Level, not A-Level, not primary school.
6. If a task touches marking, always be conservative and accurate. A student's marks matter.
7. Before writing any worked example for a topic, check the relevant file in `marking-knowledge/maths/` first.
8. Every KB entry must have a question stub (description of what is being asked) — never add bare answers without context.
9. When uncertain about a value in an existing entry (especially 2024/2025 legacy entries from pdftotext era), flag it explicitly rather than guessing silently. For new papers (2023 and earlier), the Read tool on PDF renders visually so uncertainty should be minimal.
