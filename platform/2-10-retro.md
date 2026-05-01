# 2.10 retrospective + 2.11 plan

This file is a one-time post-mortem for sub-topic 2.10 (Graphs of functions). It exists so the build of 2.11 doesn't repeat the same mistakes.

---

## Mistakes made during 2.10 (in roughly the order they happened)

### A. Markdown / YAML / KaTeX rendering pipeline

1. **`\\` vs `\` in single-quoted YAML.** I wrote `q: 'For $y = \\dfrac{1}{x^2}$ ...'` in `checks:`. Single-quoted YAML doesn't process backslash escapes — `\\` is two literal backslashes — so KaTeX received `\\dfrac` and the page rendered the raw text "dfracax". Affected ~11 lines across p2/p3/p5/review. Single-quoted strings need ONE backslash; double-quoted strings (and JSON-array option lists) need TWO.
2. **`\$` inside `$...$` math.** Wrote `$\$20{,}000$` and `$\$10{,}240$` in the p3 worked example. `\$` inside math eats the closing delimiter as far as remark-math is concerned, so the rest of the line renders as raw TeX. Same trap appeared earlier in p3 of 2.9 — I should have learnt the first time.
3. **`Full marks $= ... = N$.` breakdown on the closing line.** p4 used `Full marks $= M2A2 = 4$.` and review used `$= B3 + B1 + M1 + A2 + M2 + A2 = 11$.`. The WE preprocessor regex captures `(\d+)` only — anything else means the whole `## Worked example ... Full marks` block silently falls out of the yellow card. The mark codes belong on the `**Answer:**` line as `**[M2 for ...; A2 for ...]**`, not on the Full marks line.
4. **LaTeX inside raw HTML in markdown doesn't render.** Wrote `<p>Example: $y = \dfrac{2}{x}$</p>` as a centred caption above a section SVG. KaTeX (rehype-katex) walks the parsed-markdown math AST; it doesn't reach text content inside HTML elements. Caption appeared as literal `$y = ...$` text.

### B. Worked example correctness

5. **Mathematically false generic identity.** p4 introduced the rearrangement technique with
   `x³ − 3x + 2 = (x³ − 3x + 2) − (x³ − 7x + 1)`
   as if it were a universal identity. It isn't — it only holds at the roots of the second cubic. Students reading carefully will see a broken equation. The correct framing is "add `4x + 1` to both sides of `x³ − 7x + 1 = 0` so the LHS becomes the curve expression."
6. **Listing repeated roots as `1.0, 1.0`.** p4 part (a) listed roots as `x ≈ -2.0, 1.0, 1.0`. Cleaner: "$x = -2$ and $x = 1$ (repeated)".

### C. Widget sizing & layout

7. **"Equal units" misread as "equal range".** Built power-graph-explorer with a SQUARE viewBox 460×460, x ∈ [-4, 4] AND y ∈ [-4, 4]. When rendered at lesson body width (696 px), the SVG was 696 px wide × 696 px tall, total widget ≈ 880 px — overflowed any reasonable viewport. The MANIPULATIVE rule says equal *pixels per unit*, not equal range. Fix: x range 8 units, y range 5 units, both at 50 px/unit → 400×250 plot, viewBox 480×320, fits.
8. **Widget capped narrower than lesson body.** When fixing #7 I overshot by capping `.wrap` at `max-width:480px`, leaving the widget looking shrunken inside a 696 px lesson body. Widgets should match the lesson body width.
9. **Mini-card viewBox inconsistency.** In the static-graph gallery, `firstQuadrantOnly` shapes (sqrt) had a smaller plot rect (70×48) than the centred-axis shapes (140×80). Each card scaled its SVG to fill its grid cell, so the smaller viewBox scaled up ~1.7× more — making the sqrt curve stroke look ~1.7× thicker even though `stroke-width` was the same constant.
10. **Inline SVG instead of iframe widget.** I spent multiple edit cycles hand-typing SVG paths in p2.md (gallery + 3 section graphs). The result looked hand-drawn (piecewise linear), the LaTeX captions didn't render (#4), and the styling kept drifting from brand. The correct pattern in this codebase is iframe widgets with their own KaTeX + JS — not inline SVG.

### D. Graph rendering quality (when I was still doing inline SVG)

11. **Piecewise-linear paths.** Sampled at 50–100 points and emitted `M ... L ... L ...`. Visible kinks at default zoom on a 696-px-wide viewport. The right approach for smooth curves: Catmull-Rom-to-cubic-Bezier conversion, where the path is `C1`-continuous regardless of sample density.
12. **Equation labels merging with the curve.** Placed `y = 2/x` text inside the SVG at coordinates that overlapped with the right branch as it swept up. Should have been outside the SVG (KaTeX caption) or in genuinely empty space.
13. **Hand-drawn-looking grid.** First pass had no gridlines and free-floating axes; second pass added them but the 7 mini-cards had no gridlines and the section graphs did, breaking visual consistency.
14. **Centred axes in a first-quadrant-only graph.** First sqrt SVG centred axes at (170, 120), so the curve lived in the right half and the left half was empty. Sqrt is `x ≥ 0` only — origin should be at the bottom-left of the plot.

### E. Trainer / question generation

15. **`s.tex.replace("a", ...)` mutating TeX commands.** In the original power-graph-explorer, the per-shape TeX template was a single string with `a` as a placeholder. Doing `s.tex.replace("a", "(2)")` on `y = \\dfrac{a}{x}` matches the FIRST `a` — which is the `a` inside `\dfrac`. Result: `y = \dfr(2)c{a}{x}` rendered as the literal `y = \dfr(2)cax²`. Use a placeholder that can't appear in TeX commands, or build the TeX per-shape with a function.
16. **Mixed text + math option strings sent to a pure-TeX renderer.** In the practical-graphs trainer I wrote one option as `"$0°\\text{C}$ corresponds to $32°\\text{F}$ (water freezes)"` — which is text+math+text+math+text. The option-rendering branch only handled either pure-text or pure-TeX (via `tryRender`), not mixed. Output: literal `$0°\text{C}$ corresponds to $32°\text{F}$`. Either route every option through `renderMixed` or pre-strip the math to plain Unicode.
17. **Distractors that teach nothing.** Conversion trainer's `(rate.x / rate.k)` distractor produced `0.017857... PKR` — so absurdly far from the correct answer that no student would even consider it. Distractors must reflect believable mistakes (factor-of-10 slip, sign error, wrong direction).

### F. SVG diagram layout (separate from #10–14)

18. **SVG overlap in p1's SAMPLE JOURNEY.** y-axis tick labels at `x=35` overlapped the rotated "distance (km)" title at `x=22`; "time (hours)" axis title at `y=225` overlapped x-tick labels at `y=218`. Manually-positioned text in SVG needs explicit collision math.

### G. Wider behavioural mistakes

19. **Drifted from established pattern.** The codebase already had a working iframe-widget pattern (KaTeX rendering, brand styling, postMessage resize). Instead of using it for static graphs from the start, I rolled inline SVGs and burned several iterations re-discovering why iframe widgets exist.
20. **Repeated the same trap across files.** The `\\dfrac` YAML escape mistake appeared in p2, p3, p5, AND review — I copy-pasted the bug across 4 files without testing once.
21. **Didn't reach for the dev server / page render.** Many of these (LaTeX-in-HTML, rendering of `\$` inside math, the `\dfr(2)cax²` formula) would have been caught immediately by loading the page in a browser. I leaned too hard on YAML/markdown parse checks alone.

---

## Plan for 2.11 (Sketching curves)

2.11 covers sketching linear, quadratic, cubic, reciprocal, and exponential functions. Per `app/dashboard/maths/data.ts`:

- p1: Sketching linear and quadratic curves
- p2: Sketching cubics and reciprocals
- p3: Sketching exponentials
- review

### Pre-flight checklist (before writing any lesson markdown)

- [ ] **Re-read the three relevant memory files** — `feedback-yaml-tex-escapes.md`, `feedback-widget-dimensions.md`, `worked-example-rendering.md`.
- [ ] **Re-use the existing `static-graph.html` widget** for any graph display in 2.11 unless the topic genuinely needs a new widget. Add new shapes via URL params, not new SVG files.
- [ ] **Plan widget heights** before embedding iframes. Pick viewBox aspect ~1.4–1.5 so total widget at 696 wide stays under ~650 px tall.

### Authoring rules (apply while writing)

- [ ] Single-quoted YAML: ONE backslash for TeX (`\dfrac`, not `\\dfrac`). Double-quoted (option arrays): TWO backslashes (`\\dfrac`).
- [ ] Never write `\$` inside `$...$`. Use plain prose for currency, or write `$\text{Rs.}$` in math mode.
- [ ] WE closing line is exactly `Full marks $= <digits>$.`. Mark-code breakdown lives on the `**Answer:**` line above as `**[M1 for ...; A1 for ...]**`.
- [ ] No raw HTML wrappers around `$...$` for captions. KaTeX won't render. Use plain markdown paragraphs, OR put the equation inside the iframe widget.
- [ ] Verify worked-example math: every `=` you write must hold for all values, not just at the answer. If it only holds at a specific value, say "at the roots", "at the intersection", etc.
- [ ] List repeated roots as "X (repeated)", not "X, X".

### Widget rules (apply when building/embedding graphs)

- [ ] Static graphs go through `static-graph.html` via URL params. Don't hand-author SVG paths in markdown.
- [ ] If a new shape is needed (e.g., quadratic with vertex offset), extend `static-graph.html`'s `SHAPES` map — don't duplicate the file.
- [ ] Widget iframe `max-width: 696px` to match lesson body.
- [ ] Widget total height ≤ 650 px (set initial iframe height; postMessage refines).
- [ ] Curves must be smooth: use the existing Catmull-Rom-to-Bezier path in `static-graph.html`. Do not paste hand-typed `M ... L ... L ...` paths.
- [ ] Mini cards in a gallery layout must share identical viewBox dimensions across all cards (otherwise stroke thickness varies).
- [ ] Equation labels go in a KaTeX-rendered area (in the iframe widget header), not floating inside the SVG over the curve.

### Trainer rules (when extending or building trainers)

- [ ] Distractors must be believable wrong answers (factor-of-10 slip, sign error, swapped variables) — not numerically absurd.
- [ ] Option text containing both prose and `$...$` math goes through `renderMixed`, not `tryRender` (pure-TeX) or plain `textContent`.
- [ ] When building TeX strings, never `.replace("a", ...)` a placeholder that can also appear inside command names. Use a placeholder like `__A__` or build TeX per-shape with a function.

### Verification before commit

- [ ] Run `npm run dev` and open every lesson page (p1, p2, p3, review) in the browser. Inspect by eye: equations rendered, no raw `$...$` showing, WE wrapped in yellow card, widgets fit width and don't overflow viewport.
- [ ] Run the three audit subagents (see below) over the new files.

---

## Audit subagents for 2.11

After writing 2.11 lessons + widgets, spawn these three agents in parallel. Each has a single focused mandate; their reports tell me what to fix before pushing.

### Agent 1: Markdown / KaTeX / YAML auditor

```
You are auditing newly-written 2.11 lesson markdown files at
platform/lessons/maths/02-11-sketching-curves/{p1,p2,p3,review}.md
against this codebase's rendering pipeline. Do not run anything; read
the files and report issues only.

Check for these specific bugs (each has bitten the codebase before):

1. YAML escape mismatch. In single-quoted YAML strings (q:, explain:,
   etc.), backslashes are literal — so `\\dfrac` parses as TWO
   backslashes and KaTeX renders it as raw text. Single-quoted needs
   ONE backslash; double-quoted strings (including options arrays in
   JSON-list form) need TWO. Flag every `\\<command>` inside a single-
   quoted YAML scalar.

2. Escaped dollar inside math. `\$` inside a `$...$` segment breaks the
   remark-math delimiter matcher. Flag every `\$` that appears between
   two unescaped `$` on the same line.

3. WE Full marks line. The lesson-body preprocessor regex requires
   `Full marks $= (\d+)$.` exactly. Flag any line that matches
   `^Full marks` but whose `$=...$` content is not pure digits.

4. LaTeX inside HTML. KaTeX won't render `$...$` inside text content of
   raw HTML elements (e.g., `<p>...$y=x$...</p>`). Flag any HTML element
   whose text content contains `$...$` math segments.

5. Repeated-root listing. Flag any "Roots: ..., X, X" where the same
   value appears twice — should be "X (repeated)".

6. False generic identity. Flag every `$$...$$` block that asserts
   `f(x) = g(x)` where g(x) != f(x) algebraically. Specifically watch
   for "x³ - 3x + 2 = (x³ - 3x + 2) - (...)" style derivations that
   only hold at specific values, not universally.

Report format: file:line — issue — suggested fix. Cap report at 400
words. If clean, say so explicitly.
```

### Agent 2: Widget / graph aesthetics auditor

```
You are auditing widgets and inline graphs for 2.11 at
platform/public/widgets/ (any new files) and inside
platform/lessons/maths/02-11-sketching-curves/*.md.

Check these specific rules:

1. Static graphs go through static-graph.html iframes (or any other
   existing widget). Flag every inline `<svg>` with hand-typed
   `<path d="M ... L ...">` data inside a 2.11 markdown file —
   inline SVG with manual paths is forbidden in this codebase.

2. Iframe widgets: max-width must be 696px (match lesson body). Flag
   any iframe with max-width below 696 or above 696.

3. Iframe total height: widget chrome + plot must fit in a typical
   viewport, target ≤ 650px tall. Flag any iframe with `height:` over
   700px.

4. Equal pixels-per-unit on plots: in any new widget, axis x and y
   ranges must use the same px/unit. Square plot (equal range) is NOT
   required; rectangular plots with equal scale are correct. Flag any
   widget where the plot's x and y px/unit differ.

5. Smooth curves: any new graph code must use Catmull-Rom-to-Bezier
   (see catmullRomPath in static-graph.html) for curve paths. Flag any
   new code that emits piecewise-linear `L`-only paths for curves.

6. Equation labels: KaTeX-rendered, not plain text inside the SVG. Flag
   any `<text>` element in a widget whose content looks like
   "y = ..." or contains math symbols that should be in TeX.

7. Mini-card viewBox consistency: in any gallery-style layout, all
   cards must share the same total viewBox dimensions. Flag any
   gallery where firstQuadrantOnly shapes use a smaller viewBox than
   centred-axis shapes.

Report format: file:line — issue — suggested fix. Cap report at 350
words.
```

### Agent 3: Trainer logic auditor

```
You are auditing the 2.11 trainer widget (and its question generation)
at platform/public/widgets/<2.11 trainer>.html if one exists.

Check these specific rules:

1. Option rendering: any option string that contains BOTH plain text
   AND `$...$` math segments must be rendered through a renderMixed-
   style helper (one that splits on $ and only KaTeX-renders odd
   indices). Flag any option containing both `$` and non-`$` text
   that is sent to a pure-TeX renderer (katex.render / tryRender).

2. TeX placeholder substitution: never use `.replace("a", ...)` (or any
   single-letter that appears inside TeX command names like \dfrac,
   \frac, \alpha) on a TeX template string. Flag any `.replace("a", `
   or similar single-letter replace on a string containing a backslash
   command.

3. Distractor sanity: every distractor must be a believable wrong
   answer reflecting a real student error (factor-of-10, sign error,
   wrong direction, swapped operands). Flag any distractor whose
   numerical value is more than 100× off from the correct answer
   without a clear pedagogical reason.

4. Option de-duplication: distractors must not duplicate the correct
   answer. If x/3 happens to equal y/2 for some seed, the trainer must
   skip or replace. Flag any genQuestion path that doesn't dedupe.

Report format: file:line — issue — suggested fix. Cap report at 250
words.
```

---

## Memory updates

The durable lessons (the rules that apply across sessions, not just 2.10) are already in three memory files:

- `feedback-yaml-tex-escapes.md` — rule #1 above
- `feedback-widget-dimensions.md` — rules #7, #8 above
- `worked-example-rendering.md` — rule #3 above (closing line digits-only)

This retro file additionally needs to land in memory:
- A new feedback memory for **rule #4** (LaTeX inside HTML doesn't render)
- A new feedback memory for **rule #10** (static graphs go through iframe widgets, not inline SVG)
- A new feedback memory for **rules #15/#16** (TeX-template substitution + mixed-content options)
- A small project memory listing the three audit subagent prompts so I can re-spawn them on demand for any future sub-topic.

(See companion files added to `~/.claude/projects/.../memory/` in the same commit.)
