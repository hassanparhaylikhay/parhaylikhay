# CINDY_SKILL.md
# Parhaylikhay — CindyJS Interactive Manipulative Skill

Read this file completely before writing any CindyJS widget. Every manipulative built for Parhaylikhay must follow these rules without exception.

> **Also read:** `CINDY_PATTERNS.md` — verified, documentation-sourced patterns for every CindyJS operation. If there is any conflict between CINDY_SKILL.md and CINDY_PATTERNS.md, CINDY_PATTERNS.md wins.
>
> **For non-CindyJS widgets** (slider-driven, Canvas-based): read `MANIPULATIVE_SKILL.md` instead.

---

## CRITICAL: When NOT to Use CindyJS

> This section exists because of a real mistake. Read it before deciding to use CindyJS at all.

**CindyJS is the wrong tool when the widget is "plot a function based on HTML sliders."**

If the interaction pattern is:
- HTML slider changes → redraw a graph/curve → repeat

Use a **plain HTML5 Canvas** instead. CindyJS's draw script only re-executes when:
1. A geometry element (draggable point) is moved, OR
2. A CindyJS-managed animation timer ticks

Neither of these is triggered by an HTML `oninput` event. `evokeCS()` from JavaScript sets variables but does NOT trigger a canvas redraw. `animation: {running: true}` may not reliably loop the draw script for non-geometry widgets.

### Use CindyJS when:
- The widget has **draggable points** the student moves directly on the canvas (vectors, geometry constructions, free-body diagrams, locus exploration)
- The interactivity lives *inside* the canvas, not in HTML controls

### Use plain HTML5 Canvas when:
- The widget has **HTML sliders/buttons** that control a mathematical function plot
- You need to redraw on demand from JavaScript events
- Examples: quadratic explorer, straight-line gradient, Ohm's law V=IR plotter, speed-time graph builder

---

## HTML5 Canvas — Standard Template

Use this when the widget is slider-driven. Keeps the same brand, same layout, no CindyJS.

```javascript
var canvas = document.getElementById('graph');
var ctx    = canvas.getContext('2d');
var W = 560, H = 360;

// ── HiDPI / Retina fix — ALWAYS do this, or the canvas looks blurry ──
var DPR = window.devicePixelRatio || 1;
canvas.width  = W * DPR;
canvas.height = H * DPR;
canvas.style.width  = W + 'px';
canvas.style.height = H + 'px';
ctx.scale(DPR, DPR);

// Math coordinate space — adjust per widget
var X_MIN = -6, X_MAX = 6, Y_MIN = -5, Y_MAX = 5;

function toCanvas(mx, my) {
  return {
    x: (mx - X_MIN) / (X_MAX - X_MIN) * W,
    y: (Y_MAX - my) / (Y_MAX - Y_MIN) * H
  };
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#0d1216';
  ctx.fillRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = '#111f2c';
  ctx.lineWidth = 0.8;
  for (var ky = Y_MIN; ky <= Y_MAX; ky++) {
    var p1 = toCanvas(X_MIN, ky), p2 = toCanvas(X_MAX, ky);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }
  for (var kx = X_MIN; kx <= X_MAX; kx++) {
    var p1 = toCanvas(kx, Y_MIN), p2 = toCanvas(kx, Y_MAX);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = '#3a5060';
  ctx.lineWidth = 1.5;
  var ax = [toCanvas(X_MIN, 0), toCanvas(X_MAX, 0)];
  ctx.beginPath(); ctx.moveTo(ax[0].x, ax[0].y); ctx.lineTo(ax[1].x, ax[1].y); ctx.stroke();
  var ay = [toCanvas(0, Y_MIN), toCanvas(0, Y_MAX)];
  ctx.beginPath(); ctx.moveTo(ay[0].x, ay[0].y); ctx.lineTo(ay[1].x, ay[1].y); ctx.stroke();

  // Tick labels — use '#6a8898' so they're visible on dark background
  ctx.fillStyle = '#6a8898';
  ctx.font = '11px -apple-system, sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (var kx = X_MIN+1; kx < X_MAX; kx++) {
    if (kx === 0) continue;
    var p = toCanvas(kx, 0);
    ctx.fillText(kx, p.x, p.y + 4);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (var ky = Y_MIN+1; ky < Y_MAX; ky++) {
    if (ky === 0) continue;
    var p = toCanvas(0, ky);
    ctx.fillText(ky, p.x + 5, p.y);
  }

  // === YOUR WIDGET CONTENT HERE ===
  // Plot a curve: 400 steps, ctx.beginPath() + lineTo loop + ctx.stroke()
  // Mark special points: ctx.arc() + ctx.fill()
}

// Call draw() initially and on every slider oninput
draw();
```

### Slider label anti-jump rule

Always use a **fixed-width label** for slider values. If the label width changes as the value changes (e.g. "1" → "1.2"), the layout shifts and looks unprofessional.

```css
.slider-label {
  font-family: 'Courier New', monospace;
  width: 72px;        /* wide enough for "a = −3.0" — never change this */
  flex-shrink: 0;
}
```

Always display values with a fixed number of decimal places and an explicit sign placeholder:
```javascript
// WRONG — width changes between "1" and "1.2"
label.textContent = 'a = ' + value;

// RIGHT — always same width: "a =  1.0" / "a = −1.0"
label.textContent = 'a = ' + (v < 0 ? '−' : ' ') + Math.abs(v).toFixed(1);
```

---

## CindyJS — Known Gotchas

> Full verified patterns are in `CINDY_PATTERNS.md`. This section summarises the most critical mistakes.

If you ARE using CindyJS (draggable-point widgets), avoid these mistakes:

### 1. `def()` does not exist. `:=` is NOT the right loop assignment either.

CindyScript has two assignment operators with very different behaviour:
- `x = val` — **immediate assignment**, value is computed now. Use this in loops and draw scripts.
- `x := val` — **lazy/deferred**, re-evaluates every time x is read. Use only for function-like macros.

`def()` does not exist in CindyScript at all.

```cindyscript
// WRONG — def() does not exist
def(t1, -6.0 + i * 0.05);

// WRONG — := is lazy, causes wrong values inside loops
t1 := -6.0 + i * 0.05;

// RIGHT — = gives immediate evaluated value
forall(0..239, i,
  t1 = -6.0 + i * 0.05;
  y1 = gl_a * t1 * t1 + gl_b * t1 + gl_c;
  draw([t1, y1], [t1 + 0.05, gl_a*(t1+0.05)^2 + gl_b*(t1+0.05) + gl_c]);
);
```

### 2. `drawtext` does NOT inherit the current `color()` setting

Always pass color explicitly as a named parameter:

```cindyscript
// WRONG — text renders black/invisible on dark background
color([0.4, 0.46, 0.52]);
drawtext((k, -0.4), text(k), size->9);

// RIGHT — pass color directly to drawtext
drawtext((k, -0.4), text(k), color->[0.4, 0.46, 0.52], size->9);
```

### 3. Use `plot()` for function curves — it's built in

```cindyscript
// BEST — plot() is built in, handles adaptive sampling
plot(gl_a * x^2 + gl_b * x + gl_c,
     color->[0.0, 0.671, 0.98],
     size->2.5,
     start->-6, stop->6);

// ALSO FINE — apply + connect for custom curves
pts = apply(0..240, i,
  t = -6.0 + i * 0.05;
  [t, gl_a * t * t + gl_b * t + gl_c]
);
connect(pts, color->[0.0, 0.671, 0.98], size->2.5);
```

### 4. `animation: {autoplay: true}` — not `{running: true}`

```javascript
// WRONG
animation: { running: true }

// RIGHT
animation: { autoplay: true }
```

The tick script (not the draw script) runs on each animation frame. For slider-driven widgets: set variables via `evokeCS`, use `tick` script to redraw, use `animation: {autoplay: true}`.

### 5. `background()` is not a CindyScript function

Set background via port config or `fill(screen(), ...)`:

```javascript
// RIGHT — port config
ports: [{ id: "CSCanvas", background: "#0d1216" }]
```

```cindyscript
// RIGHT — CindyScript
clrscr();   // clears to port background color
// or:
fill(screen(), color->[0.051, 0.071, 0.086]);
```

### 6. Color format is `[r, g, b]` — square brackets, not parentheses

```cindyscript
// Both work (both create vectors in CindyScript)
// but [r,g,b] matches the documentation
color([0.0, 0.671, 0.98]);           // preferred
draw([0,0], [1,1], color->[0.0, 0.671, 0.98]);
```

### 7. HiDPI applies to CindyJS canvases too

CindyJS does not handle `devicePixelRatio` automatically. On Retina/Mac screens the canvas looks blurry without this fix. Apply after init:

```javascript
var cdyCanvas = document.querySelector('#CSCanvas canvas');
if (cdyCanvas && window.devicePixelRatio > 1) {
  var DPR = window.devicePixelRatio;
  var w = cdyCanvas.width, h = cdyCanvas.height;
  cdyCanvas.width  = w * DPR;
  cdyCanvas.height = h * DPR;
  cdyCanvas.style.width  = w + 'px';
  cdyCanvas.style.height = h + 'px';
}
```

---

## What Is a Manipulative?

A manipulative is an interactive visual tool embedded inside a Circle lesson that lets a student *feel* a concept rather than just read about it. It is not a quiz. It is not a video. It is a sandbox where dragging, sliding, or clicking reveals mathematical truth visually.

The goal is always: **student moves something → something meaningful changes → they understand why.**

---

## Platform Context

- **Hosted on**: Codepen (embedded in Circle course lessons via Iframely)
- **Students**: Cambridge O-Level Maths and Physics, Pakistani students aged 14–17
- **Device**: Assume desktop first, mobile second
- **Language**: English — friendly and direct, like a teacher talking, not a textbook
- **No audio**: Widgets are silent. All communication is visual + text.

---

## Brand Identity

### Colors — Use from CLAUDE.md

```
BG_COLOR  = "#0d1216"   // Dark background
PL_BLUE   = "#00abfa"   // Primary accent
PL_YELLOW = "#fff067"   // Secondary accent
PL_ORANGE = "#ff822c"   // Tertiary accent
PL_GREEN  = "#0fee89"   // Correct / confirmed
PL_PINK   = "#ff4670"   // Warning / common mistake
```

For CindyJS `color()` calls, convert hex to 0–1 RGB:
```
PL_BLUE   → (0.0, 0.671, 0.980)
PL_YELLOW → (1.0, 0.941, 0.404)
PL_ORANGE → (1.0, 0.510, 0.173)
PL_GREEN  → (0.059, 0.933, 0.537)
PL_PINK   → (1.0, 0.275, 0.439)
MUTED     → (0.706, 0.706, 0.659)
AXES      → (0.533, 0.533, 0.502)
GRID      → (0.165, 0.165, 0.157)
```

### Layout

```
┌─────────────────────────────────────┐
│  Title (15px, PL_BLUE)              │
│  Instruction text (13px, muted)     │
├─────────────────────────────────────┤
│                                     │
│         CANVAS AREA                 │
│    (CindyJS renders here)           │
│                                     │
├─────────────────────────────────────┤
│  Cambridge tip (11px, PL_GREEN)     │
└─────────────────────────────────────┘
```

The Cambridge tip at the bottom is mandatory — it directly links the visual to how the examiner marks this topic.

---

## File Structure

Every widget is a **single self-contained HTML file**. No external CSS files, no external JS files except CindyJS from CDN.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Parhaylikhay · [Widget Name]</title>
  <!-- Open Graph tags for Iframely/Circle embed detection -->
  <meta property="og:title" content="[Widget Name]"/>
  <meta property="og:type" content="video.other"/>
  <meta property="og:video" content="[DEPLOYED_URL]"/>
  <meta property="og:video:type" content="text/html"/>
  <meta property="og:video:width" content="600"/>
  <meta property="og:video:height" content="520"/>
  <style>
    /* All CSS inline here */
  </style>
</head>
<body>
  <!-- Header: title + instructions -->
  <div class="header">
    <div class="title">[Widget Title]</div>
    <div class="instruction">[Instruction text — friendly English, like a teacher talking]</div>
  </div>

  <!-- CindyJS canvas -->
  <div id="CSCanvas"></div>

  <!-- Footer: Cambridge tip -->
  <div class="footer">
    <div class="tip">[Cambridge mark scheme tip]</div>
  </div>

  <!-- CindyJS -->
  <script src="https://cindyjs.org/dist/latest/Cindy.js"></script>
  <script>
    /* CindyJS initialisation */
  </script>
</body>
</html>
```

---

## CSS Template — Always Start From This

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body {
  background: #0d1216;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 10px 14px 8px;
  flex-shrink: 0;
}

.title {
  color: #00abfa;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 3px;
}

.instruction {
  color: #b4b2a9;
  font-size: 12px;
  line-height: 1.5;
}

#CSCanvas {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

#CSCanvas canvas {
  display: block;
  touch-action: none;
  pointer-events: all;
  cursor: pointer;
}

.footer {
  padding: 8px 14px 10px;
  flex-shrink: 0;
  border-top: 0.5px solid #1e2a35;
}

.tip {
  color: #0fee89;
  font-size: 11px;
  line-height: 1.5;
}

.tip span {
  font-weight: 500;
}
```

---

## CindyJS Initialisation Template

```javascript
var W = 560, H = 360; // Adjust per widget

var cdy = CindyJS({
  ports: [{
    id: "CSCanvas",
    width: W,
    height: H,
    transform: [{ visibleRect: [-6, -4, 6, 4] }] // Adjust coordinate space per widget
  }],
  geometry: [
    // Draggable points go here
    // { name:"A", kind:"P", type:"Free", pos:[x, y], color:[r,g,b], size:10 }
  ],
  scripts: {
    init: `
      // Lock x or y positions if needed
      // Set initial state
    `,
    draw: `
      // Background
      background((0.051, 0.071, 0.086));

      // Grid (always draw first)
      linesize(0.3);
      color((0.165, 0.165, 0.157));
      forall(-6..6, k,
        draw((-6, k), (6, k));
        draw((k, -4), (k, 4));
      );

      // Axes (draw over grid)
      linesize(1.5);
      color((0.533, 0.533, 0.502));
      draw((-6, 0), (6, 0));
      draw((0, -4), (0, 4));

      // Axis labels
      color((0.533, 0.533, 0.502));
      drawtext((5.6, 0.2), "x", size->11);
      drawtext((0.15, 3.7), "y", size->11);

      // === YOUR WIDGET CONTENT HERE ===

    `
  }
});
```

---

## Widget Types

### Type 1: Exploratory

Student drags points and observes changes. No goal, no completion state. Pure visual intuition.

**When to use**: Introducing a concept for the first time. Examples: exploring how changing `a` in `y = ax²` changes the parabola, seeing how gradient changes affect a straight line, visualising vectors.

**Rules**:
- Always show the equation updating live as the student drags
- Show numerical values of key parameters (e.g., "gradient = 2.5")
- Never show "correct" or "wrong" — there is no wrong state
- Must have at least 1 draggable point
- Equation display updates every frame

**Equation display pattern**:
```
// In draw script — always show live equation
color((0.961, 0.961, 0.949));
def(m_val, round(slope * 10) / 10);
drawtext((-5.8, 3.6), "y = " + m_val + "x + " + c_val, size->14);
```

### Type 2: Guided

Student works toward a visual goal — place a point, match a curve, construct a shape. The widget shows visual confirmation when correct (not a message — just the visual snapping into place or changing color).

**When to use**: Practising a skill after it's been introduced. Examples: placing the vertex of a parabola, drawing the correct tangent, identifying the y-intercept.

**Rules**:
- Show the target state clearly (e.g., a ghost/outline of the correct answer)
- When student matches the target within a tolerance, animate a subtle visual change (color shift to PL_GREEN, a brief pulse)
- Never show "Wrong!" — just don't give the success visual until they're close
- Always show distance/error as a visual cue (e.g., the line changes from pink to green as they get closer)

**Visual confirmation pattern**:
```
// Check if student's answer is close enough
def(error, |A - target_point|);
if(error < 0.3,
  // Correct state — green
  color((0.059, 0.933, 0.537));
  pointsize(12);
  draw(A);
,
  // Not yet — blue
  color((0.0, 0.671, 0.980));
  pointsize(10);
  draw(A);
);
```

---

## Draggable Point Standards

```javascript
// Standard draggable point
{ name:"A", kind:"P", type:"Free", pos:[0, 0], color:[0.0, 0.671, 0.980], size:10 }

// Colors by role:
// [0.0, 0.671, 0.980]    — Blue   (PL_BLUE)   — primary draggable (the "hero" point)
// [1.0, 0.941, 0.404]    — Yellow (PL_YELLOW) — secondary draggable
// [1.0, 0.510, 0.173]    — Orange (PL_ORANGE) — tertiary draggable
// [1.0, 0.275, 0.439]    — Pink   (PL_PINK)   — warning / exam trap point
// [0.059, 0.933, 0.537]  — Green  (PL_GREEN)  — fixed reference / target (pinned: true)
// [0.533, 0.533, 0.502]  — Gray               — locked/constrained point

// Fixed reference point (student cannot drag)
{ name:"Target", kind:"P", type:"Free", pos:[2, 3], color:[0.059, 0.933, 0.537], size:8, pinned: true }
```

Always label draggable points in the canvas:
```
// Label a point
color((0.706, 0.706, 0.659));
drawtext(A + (0.2, 0.2), "A", size->11);
```

---

## Constraint Patterns

### Lock a point to one axis (slider)
```
// In draw script — force x position
A.x := -3.5;   // Locked to x = -3.5, student can only move vertically
```

### Lock a point to a line
```
// Project A onto the line y = 2x
def(t, (A.x + 2 * A.y) / 5);
A := (t, 2*t);
```

### Keep a point within bounds
```
A.x := clamp(A.x, -5, 5);
A.y := clamp(A.y, -3, 3);
```

---

## What to Always Show in Every Widget

These elements are mandatory in every single widget regardless of type:

1. **Live equation** — updates as student interacts. Never static.
2. **Coordinate labels** — x and y axis labels, numbered tick marks every 1 unit
3. **Key numerical value** — the most important number (gradient, y-intercept, discriminant etc.) displayed prominently in PL_YELLOW
4. **Cambridge tip** in the footer — one sentence connecting the visual to how examiners test this

---

## Instruction Text Rules

Instructions must feel like a teacher speaking, not a textbook. English only — friendly and direct. Never stiff or formal.

```
// WRONG — sounds like a textbook
"Manipulate the parameter to observe the resulting transformation."

// WRONG — too casual
"Drag stuff around lol"

// RIGHT — friendly teacher voice
"Drag point A and watch how the gradient changes"
"Move the sliders — notice how 'a' controls the shape and 'c' lifts the whole curve up or down"
"Try making 'a' negative — what happens to the parabola?"
```

---

## Cambridge Tip Footer Examples

These go in the `.tip` div at the bottom. Always connect to marks:

```html
<!-- Straight line graphs -->
<div class="tip">
  Cambridge tip: <span>y-intercept is always (0, c)</span> — state this explicitly for 1 mark. Gradient = rise ÷ run.
</div>

<!-- Quadratics -->
<div class="tip">
  Cambridge tip: Vertex form <span>y = a(x−h)² + k</span> gives vertex (h, k) directly — examiner awards 1 mark for correct vertex coordinates.
</div>

<!-- Forces -->
<div class="tip">
  Cambridge tip: When two forces are in equilibrium, their resultant = 0. Draw your triangle of forces to earn the M1 mark.
</div>
```

---

## Sizing Guidelines

```javascript
// Standard lesson embed (Codepen in Circle)
W = 560, H = 340
visibleRect: [-6, -4, 6, 4]

// Wide widget (for graphs needing more x-range)
W = 580, H = 320
visibleRect: [-8, -3.5, 8, 3.5]

// Square widget (for geometry, vectors)
W = 460, H = 400
visibleRect: [-5, -5, 5, 5]
```

---

## Codepen Deployment Checklist

Before uploading to Codepen and embedding in Circle:

- [ ] Background is `#0d1216` in both CSS body and CindyJS `background()` call
- [ ] Title is in PL_BLUE (`#00abfa`)
- [ ] Instructions are in plain English (friendly tone, not formal)
- [ ] Cambridge tip is in footer in PL_GREEN
- [ ] Live equation updates every frame
- [ ] All draggable points use brand colors
- [ ] Canvas has `touch-action: none` and `pointer-events: all`
- [ ] Widget works at Codepen's embed width (~560px) without horizontal scroll
- [ ] Open Graph meta tags included for Iframely detection
- [ ] Tested in Codepen preview — all dragging works
- [ ] Tested in Circle lesson embed — renders inline

---

## Widget Library — Topics to Build

Build in this order (highest Cambridge past paper frequency first):

### O-Level Maths
1. `quadratic-explorer` — drag a, b, c sliders → parabola updates live
2. `straight-line-gradient` — drag two points → gradient and equation update
3. `simultaneous-equations` — drag two lines → intersection point shown
4. `circle-equation` — drag center and radius → circle and equation update
5. `vector-addition` — drag two vectors → resultant shown with triangle law
6. `transformation-reflection` — drag a shape → reflection appears across chosen line
7. `trigonometry-unit-circle` — drag angle → sin/cos/tan values update live
8. `factorisation-roots` — drag roots → factorised form and expanded form shown

### O-Level Physics
1. `forces-equilibrium` — drag force vectors → resultant updates, equilibrium shown
2. `ohms-law` — drag voltage/resistance sliders → current updates with V=IR live
3. `speed-time-graph` — drag points on graph → area (distance) and gradient (acceleration) shown
4. `wave-properties` — drag wavelength/frequency → speed shown with v=fλ
5. `moments` — drag force and distance → moment calculated, balance shown
6. `refraction` — drag incident ray angle → refracted ray updates with Snell's law

---

## Naming Convention

```
[subject]-[concept]-[type].html

Examples:
maths-quadratic-explorer.html
maths-straight-line-gradient.html
physics-forces-equilibrium.html
physics-ohms-law-explorer.html
```

All files live in the `parhaylikhay-widgets` GitHub repository.
