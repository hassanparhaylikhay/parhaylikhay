# MARKING_SKILL.md — Annotating Student Papers

> How to produce a marked JPEG from a photo of a student's handwritten answer sheet.

---

## Workflow

1. **Receive the image** — student sends a photo (JPEG/PNG). Find it in `~/Downloads/` (most recent file).
2. **Analyse the work** — read the image visually, identify which questions are answered, load the relevant KB topic files + `maths-marking-principles.md`, apply the mark scheme.
3. **Calibrate coordinates** — run a quick grid overlay (see below) to map exact pixel positions before placing any marks. Never guess coordinates blind.
4. **Annotate** — produce `marked_answer.jpeg` in the project root.

---

## Calibration Step (always do this first)

```python
from PIL import Image, ImageDraw, ImageFont

img = Image.open(source).convert('RGBA')
ov  = Image.new('RGBA', img.size, (0,0,0,0))
d   = ImageDraw.Draw(ov)
fnt = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 18)

for y in range(0, img.size[1], 50):
    d.line([(0, y), (80, y)], fill=(255,0,0,180), width=1)
    d.text((82, y-10), str(y), font=fnt, fill=(255,0,0,230))

Image.alpha_composite(img, ov).convert('RGB').save('/tmp/calibration.jpeg')
```

Read `/tmp/calibration.jpeg` to get exact y values for every line of the student's working before writing the real annotation script.

---

## Design Rules — Non-Negotiable

### On the paper itself
- **Mark badges only**: small filled pills (`B1`, `M1`, `A1 FT`, `A0`, `B0`) placed in the right margin at the y-level of the corresponding step.
- **No error boxes or annotation text on the paper.** The paper stays clean. The panel does all the explaining.
- Right-margin x position: around `x = 1260` for a 1536px-wide image (between student work and the printed `[3]`/`[2]`/`[4]` marks).
- For questions with a left column and a right column (e.g. Q24(b)), place left-column marks at the right edge of the left column (`x ≈ 580`) and right-column marks at the right margin (`x ≈ 1260`).

### Annotation panel
- **Extend the canvas to the right** by ~500px. Fill the new area with a warm cream background (`#f8f4ec`).
- Draw a subtle separator line at `x = original_width`.
- Organise panel by question section, each with:
  - Coloured section header (`Q23 — 2/3`, `Q24(a) — 1/2`, etc.)
  - Row-per-mark: coloured badge + brief description
  - Error explanation box (red wash) with correct working shown
  - FT note box (blue wash) where follow-through applies
- Total score badge at the bottom of the panel.

---

## Canvas Setup

```python
from PIL import Image, ImageDraw, ImageFont

img = Image.open(source).convert('RGBA')
W, H = img.size

PANEL = 500
canvas = Image.new('RGBA', (W + PANEL, H), (248, 244, 236, 255))  # cream
canvas.paste(img, (0, 0))

ov   = Image.new('RGBA', (W + PANEL, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(ov)

# separator
draw.line([(W, 0), (W, H)], fill=(170, 160, 145, 210), width=2)

result = Image.alpha_composite(canvas, ov)
result.convert('RGB').save(output_path, 'JPEG', quality=95)
```

---

## Fonts

```python
FD = '/System/Library/Fonts/Supplemental/'

def f(sz, bold=False):
    return ImageFont.truetype(FD + ('Arial Bold.ttf' if bold else 'Arial.ttf'), sz)

FS = f(18);  FSB = f(18, bold=True)   # small — panel body text
FM = f(22);  FMB = f(22, bold=True)   # medium — badges, inline marks
FL = f(28, bold=True)                 # large — section headers
FX = f(40, bold=True)                 # extra large — total score
```

---

## Colour Palette

| Role | RGBA |
|------|------|
| Green (correct) | `(10, 140, 50, 255)` |
| Green wash | `(10, 140, 50, 55)` |
| Red (error) | `(195, 28, 28, 255)` |
| Red wash | `(195, 28, 28, 55)` |
| Orange (score/warning) | `(180, 88, 0, 255)` |
| Orange wash | `(180, 88, 0, 50)` |
| Blue (FT/note) | `(25, 78, 178, 255)` |
| Blue wash | `(25, 78, 178, 45)` |
| White text | `(255, 255, 255, 255)` |
| Panel cream bg | `(248, 244, 236, 255)` |

---

## Badge Helper

```python
def badge(x, y, text, fill, tc=(255,255,255,255), fnt=None, pad=6):
    fnt = fnt or FM
    bb  = draw.textbbox((0, 0), text, font=fnt)
    tw, th = bb[2]-bb[0], bb[3]-bb[1]
    draw.rounded_rectangle([x, y, x+tw+2*pad, y+th+2*pad], radius=7, fill=fill)
    draw.text((x+pad, y+pad), text, font=fnt, fill=tc)
```

---

## Panel Row Helper

```python
def row(x, y, mark, mark_color, text, fnt=None):
    """Coloured mark badge + description text on one line."""
    fnt = fnt or FS
    x2, _ = badge(x, y, mark, mark_color, fnt=f(16, bold=True), pad=5)
    draw.text((x2 + 8, y + 2), text, font=fnt, fill=(20, 20, 20, 255))
    return y + 27  # returns next y
```

---

## Output

- File: `marked_answer.jpeg` saved to the project root (`/Users/hassanahmad/Desktop/ParhayLikhay/`)
- Quality: `95`
- Dimensions: `(original_width + 500) × original_height`

---

## What NOT to Do

- Do **not** place annotation text boxes or error callouts directly on the student's paper — they overlap with the working and look messy.
- Do **not** guess y-coordinates — always run the calibration grid first.
- Do **not** use white backgrounds anywhere — the cream panel background keeps it consistent with the Parhaylikhay aesthetic.
- Do **not** draw error highlight rectangles on the paper — the red boxes around specific errors were tried and caused clutter. The panel explanation is sufficient.
