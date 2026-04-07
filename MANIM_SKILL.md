# MANIM_SKILL.md
# Parhaylikhay — Manim Video Generation Skill

This skill governs every Manim video generated for Parhaylikhay. Read this file completely before writing any code. It extends the base manim-skill workflow with Parhaylikhay-specific requirements.

---

## Platform Context

- **Platform**: Parhaylikhay — Cambridge O-Level Maths and Physics for Pakistani students
- **Exam board**: Cambridge International (NOT GCSE, NOT Matric)
- **Language**: English
- **Voiceover**: Hassan records his own voiceover separately. Videos must be generated WITHOUT audio — leave breathing room in timing for voiceover to be added in post.
- **Style reference**: 3Blue1Brown (3b1b) — slow, deliberate, beautiful animations and meaningful transformations. Never rush.

---

## Project Structure

Follow the base manim-skill structure exactly:

```
<topic-name>/
├── plan.md
├── script.py
├── concat.txt
├── final.mp4
└── media/
    └── videos/
        └── script/
            └── 1080p60/
```

Always render at **1080p60** (`-qh` flag). These are production videos for paying students, not drafts.

---

## Brand Identity

### Color Palette

```python
# Parhaylikhay brand colors
BG_COLOR      = "#0d1216"   # Near-black background — always the scene background
WHITE_TEXT    = "#f5f5f3"   # Primary text, titles, equations
MUTED_TEXT    = "#b4b2a9"   # Secondary text, labels, hints
PL_BLUE       = "#3b9ef5"   # Primary accent — key terms, important lines, highlights
PL_YELLOW     = "#f5c842"   # Secondary accent — worked examples, "watch this" moments
PL_PINK       = "#ff4670"   # Warnings, common mistakes, "exam trap" moments
PL_GREEN      = "#3ecf7a"   # Correct answers, confirmed steps, mark scheme points
GRID_COLOR    = "#2a2a28"   # Subtle grid lines, axes background
AXES_COLOR    = "#888780"   # Coordinate axes
```

### Typography

```python
# Always use these font sizes — never deviate
TITLE_SIZE    = 48   # Scene titles, topic names
HEADING_SIZE  = 36   # Sub-headings within a scene
BODY_SIZE     = 30   # Explanations, working steps
SMALL_SIZE    = 24   # Labels, annotations, footnotes
EQUATION_SIZE = 40   # All LaTeX equations
```

### Scene Background

Every scene must start with:
```python
self.camera.background_color = "#0d1216"
```

---

## Video Structure Rules

### General Principles — Non-Negotiable

1. **Never rush.** Every concept gets time to breathe. Minimum 2 seconds of `self.wait()` after every significant animation. If in doubt, wait longer.
2. **Multiple examples always.** Every concept must be demonstrated with at least 3 worked examples, going from simple to exam-level difficulty.
3. **Marking scheme awareness.** At least one scene per video must explicitly show how Cambridge examiners award marks. Use PL_GREEN to highlight mark-worthy steps.
4. **Build up, don't dump.** Never show a full equation at once. Reveal it term by term, left to right, with pauses between each part.
5. **Voiceover gaps.** Every animation must have at least 1.5× the time it would take to speak about it. Hassan is adding voiceover — give him room.

### Scene Types to Include in Every Video

Every Parhaylikhay video must have these scene types in this order:

```
Scene 1: Hook          — A surprising or relatable question that creates curiosity
Scene 2: Foundation    — What you need to know first (prerequisites, quick recap)
Scene 3: Core Concept  — The main idea, built up slowly with visual intuition
Scene 4: Example 1     — Simple worked example, step by step
Scene 5: Example 2     — Medium difficulty, introduces a twist or variation
Scene 6: Example 3     — Exam-level difficulty, Cambridge past paper style
Scene 7: Exam Insight  — How the examiner marks this. What earns marks. Common mistakes.
Scene 8: Summary       — Concise recap of key rules, shown as clean visual cards
```

For longer topics, add Example 4 and Example 5 between Scene 6 and 7. More examples are always better.

### Hook Scene Requirements

The hook must feel like a genuine question, not a textbook intro. Examples:
- "A ball is thrown — how far will it go?"
- "If I double the speed, does the kinetic energy double?" (Answer: no, it quadruples — show why)
- Show a relatable graph or scenario FIRST, then ask what it means

### Marking Scheme Scene Requirements

This is Parhaylikhay's core USP. Every video must include:
- A Cambridge-style question shown exactly as it appears in a past paper
- A worked answer shown step by step
- Each step annotated with its mark value (e.g., "M1 — for correct method", "A1 — for correct answer")
- Use PL_GREEN for mark-awarded steps, PL_PINK for common mistakes that lose marks
- End with the total mark count

---

## Animation Style — 3b1b Inspired

### Movement Principles

```python
# Slow, deliberate animations — use these run_times
FAST    = 0.5   # Only for minor position adjustments
NORMAL  = 1.0   # Standard animations
SLOW    = 2.0   # For key concept reveals — use this most often
PATIENT = 3.0   # For the most important moment in a scene
```

Always use `rate_func=smooth` for educational animations. Never use `rate_func=linear` — it feels mechanical.

### Equation Animations

Never use `Write()` for equations all at once. Build term by term:

```python
# WRONG — never do this
eq = MathTex(r"y = mx + c")
self.play(Write(eq))

# RIGHT — reveal term by term
eq = MathTex(r"y", r"=", r"m", r"x", r"+", r"c")
for part in eq:
    self.play(Write(part), run_time=0.6)
    self.wait(0.3)
self.wait(2)
```

### Highlighting Technique

Use `Indicate` and `Circumscribe` generously — they direct the student's eye exactly like a teacher pointing at a board:

```python
# Highlight a key term
self.play(Indicate(equation[2], color=PL_YELLOW, scale_factor=1.3))
self.wait(1.5)

# Draw attention to a result
self.play(Circumscribe(answer, color=PL_GREEN, run_time=2))
self.wait(2)
```

### Transition Between Scenes

Always fade out cleanly. Never hard-cut between scenes:

```python
# End every scene with this
self.play(FadeOut(*self.mobjects), run_time=1.5)
self.wait(0.5)
```

### Coordinate Axes Style

```python
axes = Axes(
    x_range=[-5, 5, 1],
    y_range=[-4, 4, 1],
    axis_config={
        "color": AXES_COLOR,
        "stroke_width": 2,
        "include_tip": True,
        "tip_length": 0.2,
    },
    x_axis_config={"numbers_to_include": range(-4, 5)},
    y_axis_config={"numbers_to_include": range(-3, 4)},
)
axes.add_coordinates(color=MUTED_TEXT, font_size=20)
```

---

## Phase 1: Planning Requirements

When writing `plan.md` for a Parhaylikhay video, always include:

- **Cambridge syllabus reference** — which syllabus point this covers (e.g., "C2.5 — Factorisation")
- **Common student misconceptions** — what Pakistani O-Level students typically get wrong
- **Past paper frequency** — how often this topic appears (e.g., "appears in ~80% of Paper 2 exams")
- **Mark scheme patterns** — what Cambridge typically awards marks for on this topic

---

## Phase 2: Code Requirements

Additional rules on top of base manim-skill:

1. Add `self.camera.background_color = "#0d1216"` as the first line of every `construct()` method
2. Every scene must have a `scene_title` shown for the first 3 seconds then faded to a small corner label
3. Use `VGroup()` to group related elements — makes animations cleaner
4. Add `## [ClassName].[element_name]` comments throughout (from base skill — keep this)
5. Never use Manim's default blue (`BLUE`) — always use `PL_BLUE` instead

### Scene Title Pattern

```python
def construct(self):
    self.camera.background_color = "#0d1216"

    ## Scene1_Hook.title
    title = Text("Quadratic Equations", font_size=TITLE_SIZE, color=PL_BLUE)
    self.add_subcaption("Quadratic Equations", duration=2)
    self.play(Write(title), run_time=SLOW)
    self.wait(2)

    # Shrink title to top-left corner label for rest of scene
    corner_label = Text("Quadratics", font_size=18, color=MUTED_TEXT)
    corner_label.to_corner(UL, buff=0.3)
    self.play(
        Transform(title, corner_label),
        run_time=NORMAL
    )
```

---

## Phase 3: Render Settings

Always render at high quality for production:

```bash
manim -qh script.py Scene1_Hook Scene2_Foundation Scene3_Core ...
```

Render all scenes in one command. If a scene fails, fix and re-render only that scene.

Stitch with ffmpeg exactly as in base skill. Final output: `final.mp4`.

---

## Quality Checklist

Before declaring a video complete, verify:

- [ ] Background is `#0d1216` in every scene
- [ ] At least 3 worked examples included
- [ ] Marking scheme scene included with M1/A1 annotations
- [ ] No animation faster than `run_time=0.5`
- [ ] `self.wait()` of at least 1.5s after every key reveal
- [ ] Every equation built term by term, not all at once
- [ ] Final scene is a clean summary with key rules
- [ ] Video renders without errors at 1080p60
- [ ] `final.mp4` created and playable

---

## Example Topics and Their Expected Scene Count

| Topic | Scenes | Examples |
|-------|--------|----------|
| Solving quadratics (factorisation) | 8 | 4 |
| Quadratic formula | 9 | 5 |
| Simultaneous equations | 8 | 4 |
| Straight line graphs | 8 | 4 |
| Newton's laws of motion | 9 | 4 |
| Ohm's law and circuits | 8 | 4 |

When in doubt, more scenes and more examples is always better. A 12-minute video with 5 examples is far more valuable than an 8-minute video with 2.
