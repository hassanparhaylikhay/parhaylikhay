# CINDY_PATTERNS.md
# Parhaylikhay — CindyJS Verified Patterns Reference

> All patterns here are derived from the official CindyJS documentation and real working source examples.
> Do not deviate from these patterns. They are ground-truth.

---

## 1. How the Draw Script Works

### What triggers a redraw

CindyJS does NOT continuously redraw. The draw script runs when:

| Trigger | Script that runs |
|---------|-----------------|
| A geometry point is dragged | `move` script |
| Animation is playing (tick loop) | `tick` script every frame |
| Scene needs redrawing | `draw` script |
| `evokeCS()` called from JS | Just executes that code — does NOT trigger a redraw |

**Critical:** `evokeCS()` sets variables but does NOT cause a redraw. If you set `gl_a` via evokeCS but the draw/tick script isn't running, nothing updates on screen.

### Correct animation config

```javascript
CindyJS({
  ports: [{ id: "CSCanvas", width: 560, height: 360 }],
  scripts: { init: "...", tick: "..." },
  animation: { autoplay: true }   // ← correct: autoplay, NOT "running"
});
```

- `animation: {autoplay: true}` → starts the tick loop immediately
- `animation: {running: true}` → WRONG, this property does not exist
- `cdy.play()` → can also start animation after init

### draw vs tick vs move

- **`init`** — runs once on startup. Set initial variable values here.
- **`draw`** — runs when the scene needs to be redrawn. Does NOT run on a timer.
- **`tick`** — runs every animation frame when animation is playing. Use this for anything that needs to update continuously (slider-driven widgets, animations).
- **`move`** — runs when a geometry point is dragged. Use for drag-interactive widgets.

**For slider-driven widgets: use `tick` + `animation: {autoplay: true}`.** The tick script reads current variable values and redraws everything.

---

## 2. Variable Assignment: `=` vs `:=`

This is the most common source of bugs. They are NOT interchangeable.

| Operator | Meaning | When to use |
|----------|---------|-------------|
| `x = 5` | Immediate assignment — evaluates now | Inside loops, for intermediate values |
| `x := 5` | Lazy/deferred — re-evaluates every time x is read | Defining function-like macros |
| `f(x) := x^2` | Function definition | Named functions |

**In loops and draw scripts, use `=` for local variables.**

```cindyscript
// WRONG — := inside a loop re-evaluates lazily, causes bugs
forall(0..100, i,
  t := -6 + i * 0.12;
  y := a * t * t + b * t + c;
  draw([t, y], [t + 0.12, y]);
);

// RIGHT — = gives immediate evaluated value
forall(0..100, i,
  t = -6 + i * 0.12;
  y = a * t * t + b * t + c;
  draw([t, y]);
);
```

**`def()` does not exist in CindyScript. Never use it.**

---

## 3. Passing Values from JavaScript into CindyScript

### The evokeCS + tick pattern (for slider-driven widgets)

```javascript
// JS: set global CindyScript variables when sliders change
var cdy = CindyJS({
  ports: [{ id: "CSCanvas", width: 560, height: 360,
            transform: [{ visibleRect: [-6, -5, 6, 5] }] }],
  scripts: {
    init: "gl_a = 1; gl_b = 0; gl_c = 0;",
    tick: `
      // use gl_a, gl_b, gl_c — set from JS via evokeCS
      clrscr();
      // ... draw grid, axes, curve using gl_a, gl_b, gl_c
    `
  },
  animation: { autoplay: true }
});

// On slider input, push new value into CindyScript scope
document.getElementById('slider-a').oninput = function() {
  cdy.evokeCS("gl_a = " + parseFloat(this.value) + ";");
};
```

The tick script runs every animation frame and always reads the latest values of `gl_a`, `gl_b`, `gl_c` because evokeCS has already updated them in the shared CindyScript scope.

### The js() function

`js()` is **not documented** in the official CindyJS API. Do not rely on it. Use the evokeCS pattern above instead.

---

## 4. Background Color

`background()` is NOT a CindyScript function. Background color is set two ways:

### Option A: Port config (preferred)
```javascript
CindyJS({
  ports: [{
    id: "CSCanvas",
    width: 560,
    height: 360,
    background: "#0d1216"   // CSS color string
  }]
});
```

### Option B: Fill the screen shape in tick/draw script
```cindyscript
fill(screen(), color->[0.051, 0.071, 0.086]);
```

`screen()` is a shape covering the entire canvas. `fill()` fills it.

### Option C: clrscr()
```cindyscript
clrscr();   // clears to the port's configured background color
```

---

## 5. Color Format

Colors are **vectors of three real numbers in 0–1 range**.

In CindyScript, `[r, g, b]` and `(r, g, b)` both create vectors and both work. Use `[r, g, b]` (square brackets) as it matches the documentation.

```cindyscript
// Global setter — affects all subsequent draw calls
color([0.0, 0.671, 0.98]);
linesize(2.5);
draw([0, 0], [1, 1]);

// Per-call modifier — only affects this draw call
draw([0, 0], [1, 1], color->[0.0, 0.671, 0.98], size->2.5);
```

**Parhaylikhay brand colors as CindyScript vectors:**
```
PL_BLUE   → [0.0,   0.671, 0.980]
PL_YELLOW → [1.0,   0.941, 0.404]
PL_ORANGE → [1.0,   0.510, 0.173]
PL_GREEN  → [0.059, 0.933, 0.537]
PL_PINK   → [1.0,   0.275, 0.439]
MUTED     → [0.706, 0.706, 0.659]
AXES      → [0.533, 0.533, 0.502]
GRID      → [0.1,   0.16,  0.2  ]
```

---

## 6. Drawing Functions — Verified Syntax

### draw a point
```cindyscript
draw([x, y]);
draw([x, y], color->[r, g, b], size->8);
```

### draw a line segment
```cindyscript
draw([x1, y1], [x2, y2]);
draw([x1, y1], [x2, y2], color->[r, g, b], size->2);
```

### draw a line (infinite, through two points)
```cindyscript
draw(join([x1, y1], [x2, y2]));
```

### draw a circle
```cindyscript
drawcircle([cx, cy], radius);
drawcircle([cx, cy], radius, color->[r, g, b], size->1.5);
fillcircle([cx, cy], radius, color->[r, g, b]);
```

### draw text
`drawtext` does NOT inherit the current `color()` setting. Always pass color explicitly.
```cindyscript
// WRONG — text may render black on dark backgrounds
color([0.6, 0.7, 0.8]);
drawtext((x, y), "hello");

// RIGHT — pass color directly
drawtext((x, y), "hello", color->[0.6, 0.7, 0.8], size->14);
drawtext((x, y), "hello", color->[0.6, 0.7, 0.8], size->14, align->"left");
drawtext((x, y), "hello", color->[0.6, 0.7, 0.8], size->14, bold->true);
```

Available drawtext modifiers: `size`, `color`, `alpha`, `xoffset`, `yoffset`, `offset`, `align` ("left"/"right"/"mid"), `bold`, `italics`, `family` ("serif"/"sansserif"/"monospaced")

### draw an arrow
```cindyscript
// Arrow from [x1,y1] to [x2,y2]
draw([x1, y1], [x2, y2], size->2);
// CindyJS doesn't have a dedicated arrow function.
// Draw arrowhead manually as two short lines at the tip.
```

### connect a list of points (smooth curve)
```cindyscript
pts = apply(0..240, i,
  t = -6 + i * (12 / 240);
  [t, a * t * t + b * t + c]
);
connect(pts, color->[0.0, 0.671, 0.98], size->2.5);
```

### plot a function directly (simplest for curves)
```cindyscript
// plot() uses x as running variable by default
plot(gl_a * x^2 + gl_b * x + gl_c,
     color->[0.0, 0.671, 0.98],
     size->2.5);

// With explicit range
plot(gl_a * x^2 + gl_b * x + gl_c,
     color->[0.0, 0.671, 0.98],
     size->2.5,
     start->-6,
     stop->6);
```

`plot()` is the cleanest way to draw a mathematical function. It handles adaptive sampling automatically.

### fill a polygon
```cindyscript
fillpoly([[x1,y1],[x2,y2],[x3,y3]], color->[r, g, b], alpha->0.5);
```

---

## 7. Loops — Verified Syntax

### forall with multiple statements
```cindyscript
// Use = for assignment, semicolons between statements
forall(0..99, i,
  x = -5 + i * 0.1;
  y = sin(x);
  draw([x, y], color->[0.0, 0.671, 0.98]);
);
```

### apply to generate a list of points
```cindyscript
// Single expression
pts = apply(0..240, i, [-6 + i * 0.05, sin(-6 + i * 0.05)]);

// Multi-statement (last expression is the list element)
pts = apply(0..240, i,
  t = -6 + i * 0.05;
  [t, gl_a * t * t + gl_b * t + gl_c]
);
connect(pts);
```

### forall on a list of values
```cindyscript
// Draw grid lines
forall(-5..5, k, draw([-6, k], [6, k], color->[0.1, 0.16, 0.2]));
forall(-6..6, k, draw([k, -5], [k, 5], color->[0.1, 0.16, 0.2]));
```

---

## 8. Geometry Points (Draggable Points)

### Defining in the config
```javascript
geometry: [
  // Free draggable point — pos uses homogeneous [x, y, w] where w=1 for Euclidean
  { name: "A", kind: "P", type: "Free", pos: [2, 1, 1],
    color: [0.0, 0.671, 0.98], size: 10 },

  // Fixed point (not draggable)
  { name: "Origin", kind: "P", type: "Free", pos: [0, 0, 1],
    color: [0.059, 0.933, 0.537], size: 8, pinned: true }
]
```

### Accessing point position in CindyScript
```cindyscript
// Read coordinates
A.x          // x coordinate
A.y          // y coordinate
A.xy         // [x, y] vector

// Move a point programmatically
A.xy = [2, 3];
A.x = 5;
```

### Geometry points vs draw-script points

| Geometry point | Draw-script point |
|---------------|------------------|
| Defined in `geometry:[]` config | Created by `draw([x,y])` in script |
| Draggable by mouse | Not interactive |
| Triggers `move` script when dragged | No events |
| Persists between frames | Redrawn every frame |
| Named (A, B, C...) | Anonymous |

---

## 9. Coordinate Space

The `visibleRect` transform defines what math coordinates map to the canvas:

```javascript
transform: [{ visibleRect: [left, top, right, bottom] }]
// Example: visibleRect: [-6, -5, 6, 5]
// means x ∈ [-6, 6], y ∈ [-5, 5]
// Origin (0,0) is at center of canvas
// y increases UPWARD (opposite to CSS/Canvas)
```

**y-axis is NOT flipped** — positive y is up, like standard math. This is different from HTML Canvas where y increases downward.

---

## 10. Complete Working Template — Slider-Driven Widget

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #0d1216; display: flex; flex-direction: column; align-items: center; }
    #CSCanvas canvas { display: block; }
  </style>
</head>
<body>
  <div id="CSCanvas"></div>

  <script src="https://cindyjs.org/dist/latest/Cindy.js"></script>
  <script>
    var cdy = CindyJS({
      ports: [{
        id: "CSCanvas",
        width: 560,
        height: 360,
        background: "#0d1216",
        transform: [{ visibleRect: [-6, -5, 6, 5] }]
      }],
      scripts: {
        init: `
          gl_a = 1;
          gl_b = 0;
          gl_c = 0;
        `,
        tick: `
          // Clear background
          clrscr();

          // Grid
          linesize(0.5);
          forall(-5..5, k, draw([-6, k], [6, k], color->[0.1, 0.16, 0.2]));
          forall(-6..6, k, draw([k, -5], [k, 5], color->[0.1, 0.16, 0.2]));

          // Axes
          linesize(1.5);
          draw([-6, 0], [6, 0],  color->[0.3, 0.4, 0.48]);
          draw([0, -5], [0, 5],  color->[0.3, 0.4, 0.48]);

          // Axis labels
          forall([-5,-4,-3,-2,-1,1,2,3,4,5], k,
            drawtext((k, -0.4), text(k), color->[0.45, 0.52, 0.58], size->9)
          );

          // Parabola — using plot() for clean adaptive rendering
          linesize(2.5);
          plot(gl_a * x^2 + gl_b * x + gl_c,
               color->[0.0, 0.671, 0.98],
               start->-6, stop->6);

          // Y-intercept
          fillcircle([0, gl_c], 0.15, color->[0.059, 0.933, 0.537]);
          drawtext((0.2, gl_c + 0.25),
                   "(0, " + round(gl_c * 10) / 10 + ")",
                   color->[0.059, 0.933, 0.537], size->11);
        `
      },
      animation: { autoplay: true }
    });

    // Wire sliders
    document.getElementById('slider-a').oninput = function() {
      cdy.evokeCS("gl_a = " + parseFloat(this.value) + ";");
    };
  </script>
</body>
</html>
```

---

## 11. Common Mistakes That Cause Blank Canvas

| Mistake | Fix |
|---------|-----|
| `def(x, val)` for variable assignment | Use `x = val` |
| `x := val` inside a loop | Use `x = val` (`:=` is lazy, causes wrong values) |
| `animation: {running: true}` | Use `animation: {autoplay: true}` |
| Using `drawscript` instead of `tick` for animation | Use `tick` script |
| Calling `evokeCS` and expecting a redraw | Pair with `animation: {autoplay: true}` so tick runs |
| `background((r,g,b))` to set bg color | Set `background: "#hex"` in port config, or use `fill(screen(), color->[r,g,b])` |
| `color([r,g,b]); drawtext(...)` (text ignores global color) | Pass `color->[r,g,b]` directly to drawtext |
| `js("varName")` to read JS variable | Not a reliable API — use evokeCS to push values in |
| `draw((x,y),(x2,y2))` with parens for points | Use `draw([x,y],[x2,y2])` with square brackets |
| Setting `steps` higher than 240 in apply | 240 segments is enough for smooth curves at this scale |

---

## 12. Script Formats (Both Are Valid)

### Inline scripts object
```javascript
CindyJS({
  scripts: {
    init: "gl_a = 1;",
    tick: "plot(gl_a * x^2, color->[0,0.67,0.98]);"
  }
});
```

### External script tags (cleaner for long scripts)
```html
<script id="csinit" type="text/x-cindyscript">
  gl_a = 1;
  gl_b = 0;
</script>

<script id="cstick" type="text/x-cindyscript">
  clrscr();
  plot(gl_a * x^2 + gl_b * x + gl_c, color->[0, 0.671, 0.98]);
</script>

<script>
  CindyJS({
    scripts: "cs*",   // auto-loads <script id="cs[eventname]"> tags
    animation: { autoplay: true }
  });
</script>
```
