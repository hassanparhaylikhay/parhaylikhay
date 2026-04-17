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

1. **Never rush — but not for YouTube reasons.** Minimum 2 seconds of `self.wait()` after every significant animation. The reason is not contemplation — it's so students can pause, copy working, and check their understanding before moving on.
2. **Three worked examples minimum.** Simple → medium → exam-level. Never fewer.
3. **Marking scheme is the frame, not a bonus scene.** Annotate M1/A1/B1 marks *as you build each example*, not just at the end.
4. **Build up, don't dump.** Never show a full equation at once. Reveal term by term, left to right, with pauses between each part.
5. **Voiceover gaps.** Every animation must have at least 1.5× the time it would take to speak about it. Hassan is adding voiceover — give him room.
6. **Target length: 8–10 minutes.** Long enough for 3 examples with full mark-scheme walkthrough. Anything beyond 12 minutes should be split into two videos.

### Scene Structure

```
Scene 1: Exam Opener*   — The actual Cambridge question, marks available, how often it appears.
Scene 2: Concept Build  — The maths, built slowly with visual intuition. Term by term.
Scene 3: Example 1      — Simple worked example, annotated with M1/A1/B1 as you go.
Scene 4: Example 2      — Harder variation or common twist on the same topic.
Scene 5: Example 3      — Cambridge past paper question, full mark scheme walkthrough.
Scene 6: Traps & Fixes  — The 2–3 mistakes that cost marks most. Show wrong working, then correct it.
Scene 7: Summary Card   — One screen: the key formula/method, the mark-scheme rule, the trap to avoid.
```

*Scene 1 (Exam Opener) is **conditional**:
- **Include it** if there is a specific Cambridge past paper question that directly illustrates why this topic matters — show the question exactly as printed, state the marks available, mention how frequently it appears.
- **Skip it** if no clean past paper question is available, or if the topic needs the concept explained before any question makes sense. In that case, start directly with Scene 2 (Concept Build).

Never fabricate or paraphrase a past paper question for the Exam Opener. Only use real, verified questions from the marking knowledge base.

### Exam Opener Requirements (when included)

- Show the Cambridge question exactly as it appears — no paraphrasing
- State marks available (e.g., "This question is worth 3 marks")
- State frequency (e.g., "This type appears in roughly 80% of Paper 2 exams")
- Do NOT solve it yet — let it sit on screen as a goal for the video
- Use PL_YELLOW for the mark allocation, PL_BLUE for the question text

### Mark Scheme Annotation (in every example scene)

This is Parhaylikhay's core USP — not a separate scene, woven into every example:
- Annotate each step with its mark type as it appears: M1, A1, B1, ECF
- Use PL_GREEN for mark-awarded steps
- Use PL_PINK for the step students most often skip (the one that loses the M1)
- End each example with the total mark tally shown clearly

### Traps & Fixes Scene Requirements

Show the wrong working first — rendered in PL_PINK — then cross it out and show the correction in PL_GREEN. The most common traps for Cambridge 4024:
- Correct answer, no method shown → M1 not awarded, A1 lost
- Right formula, wrong substitution → ECF may apply, explain when
- Forgetting units or the % sign → B1 lost
- Not simplifying a final answer when the question says "simplify"

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
