# CLAUDE.md — Master Instructions for Parhaylikhay

> Read this file before starting any task in this project.

---

## Session-tested conventions (read these BEFORE editing lessons or widgets)

The user's auto-memory at `~/.claude/projects/-Users-hassanahmad-Desktop-ParhayLikhay/memory/` has four durable convention files. Read whichever applies before making changes:

- **`preflight-checklist.md`** — single entry point with the three most common bug categories and audit greps. Read this first every session.
- **`design-philosophy.md`** — the AMBITION. Smooth widgets via spring lerp (params/display state, SPRING_FACTOR 0.22; every state change animates). Apple-style focused decluttered UI; hide controls/labels until they're relevant. Aggressive colour coding — every variable gets a consistent brand colour across diagram, formula, and prose; reference cards use a different colour per row; `\textcolor{}` inside inline math for prose-level highlighting. Step-explorer recipe: step 1 = build the shape, each later step highlights ONE thing visually with a pulsing drop-shadow keyed to stroke colour; equations cascade in. Go overboard with visuals — multi-widget pages are good ("when in doubt, ship one more visual"); 600-line widgets for one worked example are fine. Expert-pedagogy lesson arc: why-this-matters → what-it-actually-is → see-it → build-the-formula → worked-example with mark scheme → common-mistakes → summary. Inspiring curiosity: lead with questions, callout surprising results, no fake enthusiasm.
- **`lesson-conventions.md`** — worked-example regex rules (WE heading must start `## Worked example`; body must end with `Full marks $= N$.` with period right after `$`); YAML JSON-array vs single-quoted escape rules; em dashes banned; `\sum` not allowed; `\(...\)` for math inside HTML diagram blocks; Cambridge paper references in plain English.
- **`widget-conventions.md`** — SVG arc sweep flag (`sweep = 0` for an apex-up fan); math angles use `90 ± θ/2` not `270` for screen-down sectors in y-down SVG; svgKaTeXLabel alignment anchors text edges at `x ± 50`, NOT at x; auto-fit pattern for figures that overflow; KaTeX everywhere via foreignObject; step explorer pattern; cuboid depth `(dx, dy)` MUST scale with W; frustum back-half ellipse for 3D look.

When a user reports a buggy widget by screenshot, check first:
1. SVG arc sweep flag (arc bulging the wrong direction → bow-tie / arrow shape)
2. Hardcoded dimension that doesn't respond to a slider
3. Label alignment misanchored (text inside the shape vs outside)

When the user says "make it visual" / "more like a video" / "needs to be smoother": don't just add text — every state change needs a visible animation, every step needs a visual highlight, every shape transformation should morph continuously rather than swap.

**ALL math renders via KaTeX, including numbers and units.** This is non-negotiable across lessons, widgets, diagrams, quizzes, and graphs. Plain Unicode `π θ ² ³ ½` in monospace text reads as ugly fallback. So does plain SVG `<text>` showing `r = 5` or `cm²` next to a KaTeX formula. Use `\pi`, `\theta`, `^{2}`, `^{3}`, `\tfrac{1}{2}` inside `\(...\)` or `$...$`. Use `\text{cm}^{2}` not `cm²`. In widgets, route every numeric label through the `svgKaTeXLabel` foreignObject helper — even live values like `r = 5.4` must render as `r = " + fmtNum(r)` inside KaTeX, not as plain `<text>`. The full rule and rationale: see `feedback-katex-everywhere.md`.

---

## Platform Overview

**Name:** Parhaylikhay
**Audience:** Cambridge O-Level students in Pakistan (typically ages 14–16)
**Subjects:** Mathematics and Physics
**Hosting:** Next.js and Vercel
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

## Cambridge 4024 Syllabus — Authoritative Sub-Topics

Transcribed from `4024-syllabus.pdf` at the repo root (Syllabus D, versions used for exams 2025/2026/2027, published Feb 2024). This replaces any earlier summary that was guessed from general O-level knowledge — those versions were structurally wrong (missing topics, renumbered incorrectly). When authoring new lessons, this is the source of truth. If this and the PDF ever disagree, re-verify against the PDF.

Structure below: **code · title** followed by the syllabus requirement and (where given) the syllabus's own "Notes and examples". Anything marked *(not in syllabus)* should NOT be taught — it adds load without earning marks.

### Unit 1 — Number (18 sub-topics)
- **1.1 Types of number** — identify and use: natural numbers, integers (positive/zero/negative), prime numbers, square numbers, cube numbers, common factors, common multiples, rational and irrational numbers, reciprocals. *Example tasks:* convert between numbers and words (e.g. six billion = 6 000 000 000); express 72 as a product of its prime factors; find HCF of two numbers; find LCM of two numbers.
- **1.2 Sets** — understand and use set language, notation and Venn diagrams to describe sets and represent relationships between sets. *Venn diagrams limited to two or three sets.* Notation: `n(A)`, `∈`, `∉`, `A'`, `∅`, `ξ`, `A ⊆ B`, `A ⊈ B`, `A ∪ B`, `A ∩ B`. Example set definitions: `A = {x : x is a natural number}`, `B = {(x,y) : y = mx + c}`, `C = {x : a ≤ x ≤ b}`, `D = {a, b, c, …}`. *(Proper subset `⊂`, set difference `\`, De Morgan's laws, "number of subsets = 2ⁿ" — NOT in syllabus.)*
- **1.3 Powers and roots** — calculate with squares, square roots, cubes, cube roots, other powers and roots. *Recall expected:* squares and their roots from 1 to 15; cubes and their roots of 1, 2, 3, 4, 5, 10. Example: write the value of √169; work out 5² × ∛8.
- **1.4 Fractions, decimals and percentages** — use language/notation of proper fractions, improper fractions, mixed numbers, decimals, percentages. Convert between forms. *Recurring-decimal notation is required*, e.g. 0.1̇7 = 0.1777…, 0.1̇2̇3 = 0.1232323…, 0.12̇3̇ = 0.123123…. Candidates expected to write fractions in simplest form; convert between recurring decimals and fractions.
- **1.5 Ordering** — order quantities by magnitude; use the symbols `=, ≠, >, <, ≥, ≤`.
- **1.6 The four operations** — use the four operations on integers, fractions and decimals with correct order of operations and brackets. Includes negative numbers, improper fractions, mixed numbers, practical situations (e.g. temperature changes).
- **1.7 Indices I** — understand and use indices (positive, zero, negative, fractional); understand and use the rules of indices. Examples: 6^(1/2) = √6; 16^(1/4) = ⁴√16; find value of 7⁻², 81^(1/2), 8^(−2/3); find value of 2⁻³ × 2⁴, (2³)², 2³ ÷ 2⁴.
- **1.8 Standard form** — use `A × 10ⁿ` where `n` is a positive or negative integer and `1 ≤ A < 10`. Convert into and out of standard form; calculate with values in standard form.
- **1.9 Estimation** — round values to a specified degree of accuracy (decimal places, significant figures, e.g. write 5764 correct to the nearest thousand); make estimates for calculations (e.g. by writing each number correct to 1 sf, estimate 41.3 ÷ (9.79 × 0.765)); round answers to a reasonable degree of accuracy in context.
- **1.10 Limits of accuracy** — give upper and lower bounds for data rounded to a specified accuracy (e.g. upper bound of a length measured to the nearest metre). Find upper and lower bounds of calculated results using rounded data (e.g. upper bound of perimeter or area of a rectangle; lower bound of speed given distance/time).
- **1.11 Ratio and proportion** — give ratios in simplest form; divide a quantity in a given ratio; use proportional reasoning and ratios in context (e.g. 20:30:40 simplifies to 2:3:4; adapt recipes; use map scales; determine best value).
- **1.12 Rates** — use common measures of rate (hourly pay, exchange rates, flow rates, fuel consumption); apply other measures (pressure, density, population density — *formulas given in the question*); solve problems involving average speed (*speed/distance/time formula knowledge required*; e.g. 45 km in 3 h 45 min). Rate notation in forms like m/s, g/cm³.
- **1.13 Percentages** — calculate a given percentage of a quantity; express one quantity as a percentage of another; calculate percentage increase or decrease; calculate with simple and compound interest (*formulas NOT given*; problems may include repeated percentage change); reverse percentages (e.g. find cost price given selling price and profit %). Percentage calculations may include: deposit, discount, profit/loss (amount or %), earnings, percentages over 100%.
- **1.14 Using a calculator** — use a calculator efficiently (e.g. don't round within a calculation — only round the final answer); enter values appropriately (e.g. 2h 30min as 2.5 hours or 2°30'0''); interpret the display (e.g. 4.8 in money means $4.80; 3.25 in time means 3h 15min).
- **1.15 Time** — calculate with seconds, minutes, hours, days, weeks, months, years (1 year = 365 days); calculate times in 24-hour and 12-hour clocks (e.g. 3.15 a.m. = 03 15, 3.15 p.m. = 15 15); read clocks and timetables (includes time zones, local times, time differences).
- **1.16 Money** — calculate with money; convert from one currency to another.
- **1.17 Exponential growth and decay** — use exponential growth and decay (e.g. depreciation, population change). *Knowledge of `e` NOT required.*
- **1.18 Surds** — understand and use surds, including simplifying (e.g. √20 = 2√5; √200 − √32 = 6√2); rationalise the denominator (e.g. 10/√5 = 2√5; 1/(−1+√3) = (1+√3)/2).

### Unit 2 — Algebra and graphs (12 sub-topics)
- **2.1 Introduction to algebra** — letters represent generalised numbers; substitute numbers into expressions and formulas.
- **2.2 Algebraic manipulation** — simplify by collecting like terms (e.g. 2a² + 3ab − 1 + 5a² − 9ab + 4 = 7a² − 6ab + 3); expand products, including three brackets (e.g. (x−2)(x+3)(2x+1)); factorise by extracting common factors (*fully*, e.g. 9x² + 15xy = 3x(3x + 5y)); factorise expressions of the form `ax + bx + kay + kby`, `a²x² − b²y²`, `a² + 2ab + b²`, `ax² + bx + c`, `ax³ + bx² + cx`; complete the square for `ax² + bx + c`.
- **2.3 Algebraic fractions** — manipulate algebraic fractions (e.g. `x/3 + (x−4)/2`; `2x/3 − 3(x−5)/2`; `3a/4 × 9a/10`; `3a/4 ÷ 9a/10`; `1/(x−2) + (x+1)/(x−3)`); factorise and simplify rational expressions (e.g. `(x²−2x)/(x²−5x+6)`).
- **2.4 Indices II** — understand and use indices (positive, zero, negative, fractional); rules of indices. Examples: solve 32^x = 2, 5^(x+1) = 25^x; simplify 3x⁻⁴ × (2/3)x^(1/2), (2/5)x^(1/2) ÷ 2x⁻², ((2x⁵)/3)³. *Logarithms NOT required.*
- **2.5 Equations** — construct expressions, equations and formulas (including simultaneous equations); solve linear equations in one unknown (e.g. 3x+4=10; 5−2x=3(x+7)); solve fractional equations with numerical and linear algebraic denominators (e.g. `x/(2x+1) = 4`; `2/(x+2) + 3/(2x−1) = 1`; `x/(x+2) = 3/(x−6)`); solve simultaneous linear equations in two unknowns; solve quadratic equations by factorisation, completing the square, and the quadratic formula (*formula given*; includes writing in completed-square form; solutions may be in surd form); change the subject of formulas (including where the subject appears twice, or involves a power/root).
- **2.6 Inequalities** — represent and interpret inequalities on a number line (*open circles for strict `<, >`; closed circles for inclusive `≤, ≥`*, e.g. −3 ≤ x < 1); construct, solve and interpret linear inequalities (e.g. 3x < 2x+4; −3 ≤ 3x−2 < 7); represent linear inequalities in two variables graphically (*broken lines for strict; solid for inclusive; shade unwanted regions unless otherwise directed*); list inequalities that define a given region. *Linear programming NOT included.*
- **2.7 Sequences** — continue a sequence or pattern; recognise patterns including term-to-term rules and relationships between sequences (includes linear, quadratic, cubic, exponential and simple combinations); find and use the nth term. Subscript notation may be used (e.g. Tₙ).
- **2.8 Proportion** — express direct and inverse proportion algebraically; use it to find unknown quantities. Includes linear, square, square root, cube and cube root proportion. *Knowledge of `∝` required.*
- **2.9 Graphs in practical situations** — use and interpret graphs in practical situations, including travel graphs and conversion graphs; draw graphs from given data; apply rate of change to kinematics (distance–time, speed–time, acceleration, deceleration); calculate distance travelled as area under a speed–time graph (*linear sections only*). Includes estimation and interpretation of the gradient of a tangent at a point.
- **2.10 Graphs of functions** — construct tables of values, draw, recognise and interpret graphs of: `axⁿ` (sums of no more than three) and `abˣ + c`, for `n = −2, −1, −½, 0, ½, 1, 2, 3`, `a` and `c` rational, `b` positive integer. Examples: `y = x³+x−4`; `y = 2x + 3/x²`; `y = (1/4) × 2ˣ`. Solve associated equations graphically, including roots and intersection of a line and a curve. Draw and interpret exponential growth/decay graphs. Estimate gradients of curves by drawing tangents.
- **2.11 Sketching curves** — sketch and interpret linear, quadratic, cubic, reciprocal, and exponential functions. Equivalent forms: `ax + by = c`, `y = ax² + bx + c`, `y = ax³ + b`, `y = ax³ + bx² + cx`, `y = a/x + b`, `y = arˣ + b`, with `a, b, c` rational and `r` a positive rational. Knowledge required: turning points, roots and symmetry; vertical and horizontal asymptotes; completing the square to find turning points of quadratics.
- **2.12 Functions** — function notation and domain/range (e.g. f(x) = 3x−5; g(x) = 3(x+4)/5; h(x) = 2x² + 3); inverse functions `f⁻¹(x)`; composite functions `gf(x) = g(f(x))` (e.g. f(x) = 3/(x+2) and g(x) = (3x+5)²; find fg(x) as a simplified fraction). *Candidates are NOT expected to find domains and ranges of composite functions.* May include mapping diagrams.

### Unit 3 — Coordinate geometry (7 sub-topics)
- **3.1 Coordinates** — use and interpret Cartesian coordinates in two dimensions.
- **3.2 Drawing linear graphs** — draw straight-line graphs for linear equations (e.g. `y = −2x + 5`; `y = 7 − 4x`; `3x + 2y = 5`).
- **3.3 Gradient of linear graphs** — find the gradient of a straight line; calculate gradient from the coordinates of two points on it.
- **3.4 Length and midpoint** — calculate length of a line segment; find the coordinates of the midpoint.
- **3.5 Equations of linear graphs** — interpret and obtain the equation of a straight-line graph. Forms expected: `ax + by = c`, `y = mx + c`, `x = k`. May include finding the equation when the graph is given, or finding gradient/y-intercept from an equation (e.g. for 5x + 4y = 8). Equations should be given in fully simplified form.
- **3.6 Parallel lines** — find gradient and equation of a line parallel to a given line (e.g. parallel to `y = 4x − 1` through (1, −3)).
- **3.7 Perpendicular lines** — find gradient and equation of a line perpendicular to a given line (e.g. perpendicular to `2y = 3x + 1`; perpendicular bisector of the line joining (−3, 8) and (9, −2)).

### Unit 4 — Geometry (8 sub-topics)
- **4.1 Geometrical terms** — use and interpret: point, vertex, line, plane, parallel, perpendicular, perpendicular bisector, bearing, right angle, acute/obtuse/reflex angles, interior/exterior angles, similar, congruent, scale factor. Vocabulary of triangles (equilateral, isosceles, scalene, right-angled), quadrilaterals (square, rectangle, kite, rhombus, parallelogram, trapezium), polygons (regular and irregular; pentagon, hexagon, octagon, decagon), solids (cube, cuboid, prism, cylinder, pyramid, cone, sphere, hemisphere, frustum, face, surface, edge), and circles (centre, radius, diameter, circumference, semicircle, chord, tangent, major and minor arc, sector, segment). *Candidates are NOT expected to show that two shapes are congruent.*
- **4.2 Geometrical constructions** — measure and draw lines and angles (*ruler for all straight edges*; constructions of perpendicular bisectors and angle bisectors are NOT required); construct a triangle given all three side lengths using ruler and compasses (*construction arcs must be shown*; e.g. construct a rhombus by drawing two triangles); draw, use and interpret nets (cubes, cuboids, prisms, pyramids; use measurements from nets to calculate volumes/surface areas).
- **4.3 Scale drawings** — draw and interpret scale drawings; use and interpret three-figure bearings. Bearings measured clockwise from north (000° to 360°); e.g. find bearing of A from B given bearing of B from A is 025°. Understanding of north/east/south/west (e.g. point D is due east of point C).
- **4.4 Similarity** — calculate lengths of similar shapes; use relationships between lengths and areas of similar shapes and lengths, surface areas and volumes of similar solids (`Vol_A / Vol_B = (Len_A / Len_B)³`); solve problems involving similarity (includes showing two triangles are similar using geometric reasons).
- **4.5 Symmetry** — recognise line symmetry and order of rotational symmetry in 2D (properties of triangles, quadrilaterals and polygons directly related to their symmetries); recognise symmetry properties of prisms, cylinders, pyramids and cones (e.g. identify planes and axes of symmetry).
- **4.6 Angles** — calculate unknown angles and give simple explanations using: sum of angles at a point = 360°; angles on a straight line = 180°; vertically opposite angles equal; angle sum of a triangle = 180°, quadrilateral = 360°. Parallel-line rules: corresponding angles equal; alternate angles equal; co-interior angles sum to 180°. Angle properties of regular and irregular polygons (exterior and interior angles, angle sum). *Three-letter notation for angles required (e.g. angle ABC). Correct geometrical terminology required when giving reasons.*
- **4.7 Circle theorems I** — calculate unknown angles and give explanations using: angle in a semicircle = 90°; angle between tangent and radius = 90°; angle at centre = twice angle at circumference; angles in the same segment are equal; opposite angles of a cyclic quadrilateral sum to 180°; alternate segment theorem.
- **4.8 Circle theorems II** — use symmetry properties of circles: equal chords equidistant from centre; perpendicular bisector of a chord passes through the centre; tangents from an external point are equal in length.

### Unit 5 — Mensuration (5 sub-topics)
- **5.1 Units of measure** — use metric units of mass, length, area, volume and capacity; convert between units. Units: mm, cm, m, km; mm², cm², m², km²; mm³, cm³, m³; ml, l; g, kg. Conversions include between area units (cm² ↔ m²) and between volume and capacity (m³ ↔ litres).
- **5.2 Area and perimeter** — calculate perimeter and area of rectangle, triangle, parallelogram, trapezium. *Except for area of a triangle, formulas are NOT given.*
- **5.3 Circles, arcs and sectors** — calculate circumference and area of a circle (*formulas given*); arc length and sector area as fractions of circumference and area (*includes minor and major sectors*). Answers may be asked in terms of π.
- **5.4 Surface area and volume** — surface area and volume of: cuboid, prism, cylinder, sphere, pyramid, cone. *Formulas given:* curved surface area of a cylinder and cone, surface area of a sphere, volume of prism/pyramid/cylinder/cone/sphere. "Prism" refers to any solid with uniform cross-section (e.g. a cylindrical sector).
- **5.5 Compound shapes and parts of shapes** — perimeters and areas of compound shapes and parts of shapes; surface areas and volumes of compound solids and parts of solids (e.g. find the surface area and volume of a frustum). Answers may be asked in terms of π.

### Unit 6 — Trigonometry (4 sub-topics)
- **6.1 Pythagoras' theorem** — know and use Pythagoras' theorem.
- **6.2 Right-angled triangles** — sin/cos/tan ratios for acute angles (sides and angles of right-angled triangles; *angles given in degrees, answers in degrees to 1 decimal place*); solve 2D problems using Pythagoras and trigonometry (may require bearings); perpendicular distance from a point to a line is the shortest; angles of elevation and depression.
- **6.3 Non-right-angled triangles** — sine rule and cosine rule (includes obtuse angles and the ambiguous case); area of triangle = ½ ab sin C. *Sine rule, cosine rule and area formula given.*
- **6.4 Pythagoras' theorem and trigonometry in 3D** — solve 3D problems using Pythagoras and trigonometry, including the angle between a line and a plane.

### Unit 7 — Transformations and vectors (4 sub-topics)
- **7.1 Transformations** — recognise, describe and draw: reflection in a straight line; rotation about a centre through multiples of 90°; enlargement from a centre by a scale factor (positive, fractional, negative allowed); translation by a column vector. Combinations of transformations possible. *Ruler for all straight edges.*
- **7.2 Vectors in two dimensions** — describe a translation using column vector notation, `AB→`, or `a` bold (*vectors will be printed as AB→ or a*). Add and subtract vectors; multiply a vector by a scalar.
- **7.3 Magnitude of a vector** — calculate magnitude as `√(x² + y²)`. Magnitudes denoted by modulus signs (e.g. `|a|`, `|AB→|`).
- **7.4 Vector geometry** — represent vectors by directed line segments; use position vectors; use sum/difference of two or more vectors to express given vectors in terms of two coplanar vectors; use vectors to reason and solve geometric problems (e.g. show vectors are parallel; show 3 points are collinear; solve problems involving ratio and similarity).

### Unit 8 — Probability (3 sub-topics)
- **8.1 Introduction to probability** — probability scale from 0 to 1; probability notation `P(A)`, `P(A')` = 1 − P(A); calculate probability of a single event. *Probabilities should be given as a fraction, decimal or percentage.* Problems may require information from tables, graphs or Venn diagrams (e.g. given P(B) = 0.8, find P(B')).
- **8.2 Relative and expected frequencies** — relative frequency as an estimate of probability (e.g. spinner experiments); calculate expected frequencies (includes understanding fair, biased, random).
- **8.3 Probability of combined events** — calculate probability of combined events (with or without replacement) using: sample space diagrams, Venn diagrams (`P(A ∩ B)`, `P(A ∪ B)` notation may be used), tree diagrams (*outcomes at ends of branches; probabilities by the side*).

### Unit 9 — Statistics (7 sub-topics)
- **9.1 Classifying statistical data** — classify and tabulate data (e.g. tally tables, two-way tables).
- **9.2 Interpreting statistical data** — read, interpret and draw inferences from tables and statistical diagrams; compare sets of data using tables, graphs and statistical measures (e.g. compare averages and spreads); appreciate restrictions on drawing conclusions.
- **9.3 Averages and measures of spread** — mean, median, mode, range for individual data; distinguish their purposes; estimate mean for grouped discrete/continuous data; identify modal class from grouped frequency distribution.
- **9.4 Statistical charts and diagrams** — draw and interpret: bar charts (including composite/stacked and dual/side-by-side), pie charts, pictograms, simple frequency distributions.
- **9.5 Scatter diagrams** — draw and interpret scatter diagrams (*points clearly marked, e.g. as small crosses*); understand positive/negative/zero correlation; draw by eye, interpret and use a line of best fit (*single ruled line by inspection; extends across the full data set; need not coincide exactly with any points, but roughly even distribution of points either side over its entire length*).
- **9.6 Cumulative frequency diagrams** — draw and interpret cumulative frequency tables and diagrams (*points clearly marked as crosses; joined with a smooth curve*); estimate and interpret median, percentiles, quartiles, interquartile range.
- **9.7 Histograms** — draw and interpret histograms. Vertical axis labelled "Frequency density". Frequency density = frequency ÷ class width.

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
