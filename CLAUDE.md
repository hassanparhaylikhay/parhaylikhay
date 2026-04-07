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

## Marking Knowledge Base

The `marking-knowledge/maths/` folder contains marking patterns extracted from Cambridge 4024 past papers. Before writing any marked worked example, check the relevant topic file first.

**Years processed:** 2025 (8 papers, fully verified) + 2024 (8 papers, processed + systematically verified for diagram-dependent errors April 2026)

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
