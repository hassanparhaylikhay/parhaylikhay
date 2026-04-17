# MANIPULATIVE_SKILL.md
# Parhaylikhay — HTML5 Canvas Manipulative Skill

This skill governs every interactive widget that is NOT built with CindyJS — specifically, any widget where sliders, buttons, or other HTML controls drive a mathematical drawing. Read this before building any such widget.

Also read CLAUDE.md for brand colors, tone, and marking-scheme rules.
Also read CINDY_PATTERNS.md for the decision of when to use CindyJS vs Canvas.

---

## When to Use This Skill vs CindyJS

| Widget type | Use |
|-------------|-----|
| Student drags points directly on canvas | CindyJS |
| HTML sliders/buttons control a function plot | **Canvas (this skill)** |
| Free-form geometry constructions | CindyJS |
| Graph explorer, equation plotter, parameter sweep | **Canvas (this skill)** |

The rule: if the primary interaction is HTML controls outside the canvas, use Canvas. If the primary interaction is dragging inside the canvas, use CindyJS.

---

## HTML5 Canvas — Standard Setup

Every canvas widget must start with this boilerplate. Do not skip the HiDPI fix — on Retina/Mac screens the canvas will look blurry without it.

```javascript
var canvas = document.getElementById('graph');
var ctx    = canvas.getContext('2d');
var W = 560, H = 360;   // logical CSS size

// ── HiDPI / Retina fix — ALWAYS do this ────────────────────────────
// Without this, canvas looks blurry on Mac/Retina screens
var DPR = window.devicePixelRatio || 1;
canvas.width        = W * DPR;   // physical pixels
canvas.height       = H * DPR;
canvas.style.width  = W + 'px';  // CSS display size
canvas.style.height = H + 'px';
ctx.scale(DPR, DPR);             // all drawing uses logical coords after this
// ────────────────────────────────────────────────────────────────────

// Math coordinate space — adjust per widget
var X_MIN = -6, X_MAX = 6, Y_MIN = -5, Y_MAX = 5;

// Map math coordinates → canvas CSS pixels
function toCanvas(mx, my) {
  return {
    x: (mx - X_MIN) / (X_MAX - X_MIN) * W,
    y: (Y_MAX - my) / (Y_MAX - Y_MIN) * H   // y flipped: math up = canvas up
  };
}

// Map canvas CSS pixels → math coordinates
function fromCanvas(cx, cy) {
  return {
    mx: X_MIN + (cx / W) * (X_MAX - X_MIN),
    my: Y_MAX - (cy / H) * (Y_MAX - Y_MIN)
  };
}
```

---

## Standard Draw Function Structure

Every widget has a single `draw()` function that redraws everything from scratch. Call it on page load and on every interaction.

```javascript
function draw() {
  ctx.clearRect(0, 0, W, H);

  // 1. Background
  ctx.fillStyle = '#0d1216';
  ctx.fillRect(0, 0, W, H);

  // 2. Grid (batch into ONE path — do not call stroke() per line)
  ctx.strokeStyle = '#111f2c';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (var ky = Y_MIN; ky <= Y_MAX; ky++) {
    ctx.moveTo(toCanvas(X_MIN, ky).x, toCanvas(X_MIN, ky).y);
    ctx.lineTo(toCanvas(X_MAX, ky).x, toCanvas(X_MAX, ky).y);
  }
  for (var kx = X_MIN; kx <= X_MAX; kx++) {
    ctx.moveTo(toCanvas(kx, Y_MIN).x, toCanvas(kx, Y_MIN).y);
    ctx.lineTo(toCanvas(kx, Y_MAX).x, toCanvas(kx, Y_MAX).y);
  }
  ctx.stroke();   // ONE stroke call for the entire grid

  // 3. Axes
  ctx.strokeStyle = '#3a5060';
  ctx.lineWidth = 1.5;
  var ax = [toCanvas(X_MIN, 0), toCanvas(X_MAX, 0)];
  ctx.beginPath(); ctx.moveTo(ax[0].x, ax[0].y); ctx.lineTo(ax[1].x, ax[1].y); ctx.stroke();
  var ay = [toCanvas(0, Y_MIN), toCanvas(0, Y_MAX)];
  ctx.beginPath(); ctx.moveTo(ay[0].x, ay[0].y); ctx.lineTo(ay[1].x, ay[1].y); ctx.stroke();

  // 4. Tick labels — use a visible color (#6a8898), not white, not too bright
  ctx.fillStyle   = '#6a8898';
  ctx.font        = '11px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'top';
  for (var kx = X_MIN + 1; kx < X_MAX; kx++) {
    if (kx === 0) continue;
    var p = toCanvas(kx, 0);
    ctx.fillText(kx, p.x, p.y + 4);
  }
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (var ky = Y_MIN + 1; ky < Y_MAX; ky++) {
    if (ky === 0) continue;
    var p = toCanvas(0, ky);
    ctx.fillText(ky, p.x + 5, p.y);
  }

  // 5. Your widget content here
  // ...
}
```

---

## Drawing a Smooth Curve

400 steps is enough for any curve in a [-6,6] x-range. More is not needed.

```javascript
function drawCurve(fn, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth   = lineWidth || 2.5;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  var STEPS = 400;
  for (var i = 0; i <= STEPS; i++) {
    var mx = X_MIN + i * (X_MAX - X_MIN) / STEPS;
    var my = fn(mx);
    var cp = toCanvas(mx, my);
    i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
  }
  ctx.stroke();
}

// Usage
drawCurve(function(x) { return a_val * x*x + b_val * x + c_val; }, '#00abfa');
```

---

## Drawing a Point with Glow (Hover/Drag State)

```javascript
function drawDot(mx, my, color, radius, glowing) {
  var p = toCanvas(mx, my);
  if (glowing) {
    ctx.fillStyle = color.replace(')', ', 0.15)').replace('rgb', 'rgba');
    // Simpler: hardcode a glow color per use case
    ctx.fillStyle = 'rgba(15,238,137,0.15)';
    ctx.beginPath(); ctx.arc(p.x, p.y, radius + 8, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
}
```

---

## Slider Wiring Pattern

Always use a data-driven loop. Never write three identical event handlers.

```javascript
// State — one variable per slider
var a_val = 1.0, b_val = 0.0, c_val = 0.0;

// Format: always fixed width so label never shifts
function fmt(v) {
  return (v < 0 ? '−' : ' ') + Math.abs(Math.round(v * 10) / 10).toFixed(1);
}

// Slider config — maps slider id to state variable
var params = [
  { id: 'a', set: function(v) { a_val = v; } },
  { id: 'b', set: function(v) { b_val = v; } },
  { id: 'c', set: function(v) { c_val = v; } }
];

params.forEach(function(p) {
  document.getElementById('slider-' + p.id).oninput = function() {
    p.set(parseFloat(this.value));
    document.getElementById('label-' + p.id).textContent = p.id + ' =' + fmt(parseFloat(this.value));
    draw();
  };
});
```

---

## Drag Interaction Pattern (for draggable canvas points)

```javascript
var dragging = false;
var hovering = false;
var HIT_RADIUS = 14;   // px hit radius — generous for touch/click

// Check if canvas position (px, py) is near a math point
function isNear(px, py, mx, my) {
  var p = toCanvas(mx, my);
  var dx = px - p.x, dy = py - p.y;
  return Math.sqrt(dx*dx + dy*dy) < HIT_RADIUS;
}

// Get canvas-local CSS coordinates from a mouse or touch event
function getPos(e) {
  var rect = canvas.getBoundingClientRect();
  var clientX = e.touches ? e.touches[0].clientX : e.clientX;
  var clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * (W / rect.width),
    y: (clientY - rect.top)  * (H / rect.height)
  };
}

// Mouse events
canvas.addEventListener('mousedown', function(e) {
  var p = getPos(e);
  if (isNear(p.x, p.y, 0, c_val)) { dragging = true; e.preventDefault(); }
});

canvas.addEventListener('mousemove', function(e) {
  var p = getPos(e);
  if (dragging) {
    var math = fromCanvas(p.x, p.y);
    c_val = Math.max(Y_MIN, Math.min(Y_MAX, Math.round(math.my * 10) / 10));
    // Sync back to slider
    document.getElementById('slider-c').value = c_val;
    document.getElementById('label-c').textContent = 'c =' + fmt(c_val);
    draw();
  } else {
    var was = hovering;
    hovering = isNear(p.x, p.y, 0, c_val);
    canvas.style.cursor = hovering ? 'grab' : 'default';
    if (hovering !== was) draw();
  }
});

canvas.addEventListener('mouseup',    function() { dragging = false; });
canvas.addEventListener('mouseleave', function() {
  if (dragging || hovering) { dragging = hovering = false; canvas.style.cursor = 'default'; draw(); }
});

// Touch events (same logic, different events)
canvas.addEventListener('touchstart', function(e) {
  var p = getPos(e);
  if (isNear(p.x, p.y, 0, c_val)) { dragging = true; e.preventDefault(); }
}, { passive: false });

canvas.addEventListener('touchmove', function(e) {
  if (!dragging) return;
  e.preventDefault();
  var p = getPos(e);
  var math = fromCanvas(p.x, p.y);
  c_val = Math.max(Y_MIN, Math.min(Y_MAX, Math.round(math.my * 10) / 10));
  document.getElementById('slider-c').value = c_val;
  document.getElementById('label-c').textContent = 'c =' + fmt(c_val);
  draw();
}, { passive: false });

canvas.addEventListener('touchend', function() { dragging = false; });
```

---

## requestAnimationFrame Loop + Spring Animation

For any widget with animated state (sliders that drive a moving dot, a growing bar, a hand on a clock), use a continuous `tick()` loop with spring interpolation. This gives silky-smooth movement without any CSS transitions.

**The pattern — three parts:**

### 1. Split state: target vs. display variables

```javascript
// Target values — set by sliders/clicks instantly
var a_val = 1.0, b_val = 0.0;

// Display values — animated toward target each frame
var a_D = 1.0, b_D = 0.0;

var SPRING = 0.13;  // 0.10–0.15 = smooth; 0.25+ = snappy
```

### 2. The tick() loop

```javascript
function tick() {
  // Spring each display value toward its target
  a_D += (a_val - a_D) * SPRING;
  b_D += (b_val - b_D) * SPRING;

  draw();   // redraw using display values, NOT target values
  requestAnimationFrame(tick);
}

// Start the loop once on page load — never call it again
tick();
```

### 3. Sliders update targets only

```javascript
document.getElementById('sliderA').addEventListener('input', function() {
  a_val = parseFloat(this.value);   // update TARGET, not display
  // do NOT call draw() here — tick() handles it
});
```

**When to use rAF vs. static draw:**
- Use `tick()` loop when any value is animated (slider-driven curves, draggable dots, clock hands, bar widths)
- Use static `draw()` on events only if the widget has zero animation and a canvas that is only redrawn on user interaction (e.g. a click-driven diagram with no moving parts)

---

## Draggable Probe on a Curve

A probe is a dot locked to a curve: the user drags it horizontally, and the y-value follows the function. This is different from a free draggable point.

```javascript
var xProbe = 2.0;    // current probe x (math coords)
var xProbeT = 2.0;   // target probe x (spring toward this)
var draggingProbe = false;

function probeY() { return fn(xProbeT); }  // y on the curve

// In tick():
// xProbe += (xProbeT - xProbe) * SPRING;

// In draw() — draw the probe dot at (xProbe, fn(xProbe))
function drawProbe() {
  var p = toCanvas(xProbe, fn(xProbe));
  // Glow ring
  var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
  g.addColorStop(0, 'rgba(255,240,103,0.3)');
  g.addColorStop(1, 'rgba(255,240,103,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(p.x, p.y, 18, 0, Math.PI*2); ctx.fill();
  // Dot
  ctx.fillStyle = '#fff067';
  ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI*2); ctx.fill();
}

// Mouse/touch: only update x from drag (y is always from function)
canvas.addEventListener('mousedown', function(e) {
  var p = getPos(e);
  var cp = toCanvas(xProbeT, fn(xProbeT));
  var dx = p.x - cp.x, dy = p.y - cp.y;
  if (Math.sqrt(dx*dx + dy*dy) < 18) { draggingProbe = true; e.preventDefault(); }
});

canvas.addEventListener('mousemove', function(e) {
  if (!draggingProbe) return;
  var p = getPos(e);
  var math = fromCanvas(p.x, p.y);
  xProbeT = Math.max(X_MIN, Math.min(X_MAX, math.mx));  // clamp to x-range
  canvas.style.cursor = 'grabbing';
});

canvas.addEventListener('mouseup',    function() { draggingProbe = false; canvas.style.cursor = 'default'; });
canvas.addEventListener('mouseleave', function() { draggingProbe = false; canvas.style.cursor = 'default'; });
// Mirror for touch events (same pattern as Drag Interaction Pattern section)
```

---

## ctx.setTransform Inside draw() (Re-applying DPR Each Frame)

When a canvas needs to re-establish the DPR scale inside the draw function itself (e.g. a canvas that is resized or whose context may be reset), use `setTransform` instead of relying on a one-time `ctx.scale` call:

```javascript
function draw() {
  var DPR = window.devicePixelRatio || 1;
  var W = 280, H = 160;
  // Resize canvas physical pixels if needed
  if (canvas.width !== W * DPR) {
    canvas.width = W * DPR; canvas.height = H * DPR;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  }
  // Re-apply DPR transform — use setTransform so it always starts fresh
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  // ... draw in logical CSS coords as normal
}
```

Use `setTransform` (not `ctx.scale`) here because `ctx.scale` accumulates — calling it every frame would multiply the scale. `setTransform` sets it absolutely.

---

## ImageData + DPR (Pixel-by-Pixel Shading)

`putImageData` ignores the canvas transform, including the DPR scale set by `ctx.scale`. If you use it after `ctx.scale(DPR,DPR)`, the image lands at the wrong position/size. Fix:

```javascript
function shadeRegion() {
  var DPR = window.devicePixelRatio || 1;
  var pw = W * DPR;  // physical pixel width
  var ph = H * DPR;

  // Create ImageData at PHYSICAL pixel dimensions
  var idata = ctx.createImageData(pw, ph);

  for (var y = 0; y < ph; y++) {
    for (var x = 0; x < pw; x++) {
      // Convert physical pixels → logical coords for your math test
      var lx = x / DPR;
      var ly = y / DPR;

      var idx = (y * pw + x) * 4;  // index into physical-size buffer
      if (yourMathTest(lx, ly)) {
        idata.data[idx]   = r;
        idata.data[idx+1] = g;
        idata.data[idx+2] = b;
        idata.data[idx+3] = alpha;
      }
    }
  }

  // Bypass the DPR transform before putImageData
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(idata, 0, 0);
  ctx.restore();
  // ctx.scale(DPR,DPR) is now back in effect for subsequent drawing
}
```

**Key rules:**
- ImageData size = physical pixels (`W*DPR × H*DPR`)
- Math test uses logical coords (`lx = x/DPR`)
- Index uses `(y * pw + x) * 4` where `pw = W*DPR`
- Call `ctx.setTransform(1,0,0,1,0,0)` before `putImageData`, then `ctx.restore()`

---

## Dashed Guide Lines and Adaptive Probe Labels

When a probe dot is active, draw dashed lines from the dot to the axes and place a coordinate label that repositions left/right to stay inside the canvas.

```javascript
// Dashed guide lines from probe to axes
function drawGuideLines(px, py) {
  // px, py are canvas coords of the probe
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#ffffff22';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px, py); ctx.lineTo(px, toCanvas(0, Y_MIN).y);  // down to x-axis
  ctx.moveTo(px, py); ctx.lineTo(toCanvas(X_MIN, 0).x, py);  // left to y-axis
  ctx.stroke();
  ctx.setLineDash([]);  // always reset after dashed drawing
}

// Adaptive label — flip to right side if probe is in left half of canvas
function drawProbeLabel(px, py, text) {
  var onLeft = px < W / 2;
  ctx.font = 'bold 11px -apple-system, sans-serif';
  ctx.fillStyle = '#fff067';
  ctx.textAlign = onLeft ? 'left' : 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText(text, px + (onLeft ? 6 : -6), py - 6);
  ctx.textAlign = 'left';  // always reset
}
```

**Key rule:** always call `ctx.setLineDash([])` after drawing dashed lines — if you forget, everything drawn afterwards will also be dashed.

---

## Region Shading

### Inequality half-plane (shade above or below a line/curve)

```javascript
// Shade the region below a curve (area between curve and x-axis)
function shadeBelow(fn, color) {
  var axisY = toCanvas(0, 0).y;  // y-coordinate of the x-axis on canvas
  ctx.beginPath();
  var STEPS = 400;
  for (var i = 0; i <= STEPS; i++) {
    var mx = X_MIN + i * (X_MAX - X_MIN) / STEPS;
    var cp = toCanvas(mx, fn(mx));
    i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
  }
  // Close the path along the x-axis
  ctx.lineTo(toCanvas(X_MAX, 0).x, axisY);
  ctx.lineTo(toCanvas(X_MIN, 0).x, axisY);
  ctx.closePath();
  ctx.fillStyle = color;  // e.g. '#00abfa18' for a faint fill
  ctx.fill();
}

// For a linear inequality y < mx + b: shade the region y < line
// Use ctx.rect to clip to canvas bounds, then fill a rectangle below the line
function shadeInequalityBelow(m, b, color) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);  // clip to canvas
  ctx.clip();
  ctx.beginPath();
  var left  = toCanvas(X_MIN, m * X_MIN + b);
  var right = toCanvas(X_MAX, m * X_MAX + b);
  ctx.moveTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.lineTo(right.x, H);
  ctx.lineTo(left.x, H);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}
```

### Open vs. closed endpoint markers (number line inequalities)

```javascript
function drawEndpoint(cx, cy, closed, color) {
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  if (closed) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Erase interior
    ctx.fillStyle = '#0d1216';
    ctx.fill();
  }
}
```

---

## Per-Element Spring Animation (Animated Bar Array)

For sequences or bar charts where each element animates independently:

```javascript
var targetValues = [3, 7, 2, 9, 5];   // set by slider or data
var displayValues = [3, 7, 2, 9, 5];  // spring toward target

// In tick():
for (var i = 0; i < targetValues.length; i++) {
  displayValues[i] += (targetValues[i] - displayValues[i]) * SPRING;
}

// In draw() — draw bars using displayValues
function drawBars() {
  var BAR_W = W / (displayValues.length * 2);
  var zeroY = toCanvas(0, 0).y;
  displayValues.forEach(function(val, i) {
    var x = toCanvas(X_MIN + (i + 0.5) * (X_MAX - X_MIN) / displayValues.length, 0).x;
    var y = toCanvas(0, val).y;
    // Color by sign
    ctx.fillStyle = val >= 0 ? '#00abfa44' : '#ff467044';
    ctx.strokeStyle = val >= 0 ? '#00abfa' : '#ff4670';
    ctx.lineWidth = 1.5;
    var barH = Math.abs(y - zeroY);
    ctx.fillRect(x - BAR_W/2, Math.min(y, zeroY), BAR_W, barH);
    ctx.strokeRect(x - BAR_W/2, Math.min(y, zeroY), BAR_W, barH);
  });
}
```

---

## Asymptote Lines and Key Feature Dots

For any rational, exponential, or reciprocal curve — draw asymptotes and label key features before drawing the curve itself.

```javascript
// Vertical asymptote
function drawVAsymptote(x, label) {
  var cp = toCanvas(x, 0);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cp.x, 0); ctx.lineTo(cp.x, H);
  ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = '#888780';
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, cp.x, 14);
  }
}

// Horizontal asymptote
function drawHAsymptote(y, label) {
  var cp = toCanvas(0, y);
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#ffffff33';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cp.y); ctx.lineTo(W, cp.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Key feature dot (vertex, root, intercept)
function drawFeatureDot(mx, my, color, label) {
  var p = toCanvas(mx, my);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
  if (label) {
    ctx.fillStyle = color;
    ctx.font = '11px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, p.x, p.y - 10);
  }
}
```

---

## Pen-Lifting for Discontinuous Curves

Curves like y = 1/x or tan(x) have vertical asymptotes where the function jumps to ±∞. Do NOT connect across the discontinuity — lift the pen instead.

```javascript
function drawCurveWithGaps(fn, asymptotes) {
  // asymptotes: array of x values where the curve is undefined/discontinuous
  var GAP = 0.08;  // don't draw within this math-unit distance of an asymptote
  ctx.strokeStyle = '#00abfa';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  var penDown = false;
  var STEPS = 600;
  for (var i = 0; i <= STEPS; i++) {
    var mx = X_MIN + i * (X_MAX - X_MIN) / STEPS;
    // Check proximity to any asymptote
    var nearAsymptote = asymptotes.some(function(ax) { return Math.abs(mx - ax) < GAP; });
    var y = fn(mx);
    var inRange = isFinite(y) && y > Y_MIN - 1 && y < Y_MAX + 1;
    if (nearAsymptote || !inRange) {
      penDown = false;
    } else {
      var cp = toCanvas(mx, y);
      if (!penDown) { ctx.moveTo(cp.x, cp.y); penDown = true; }
      else { ctx.lineTo(cp.x, cp.y); }
    }
  }
  ctx.stroke();
}

// Usage: y = 1/x, asymptote at x=0
drawCurveWithGaps(function(x) { return 1/x; }, [0]);
// Usage: y = 1/(x-2), asymptote at x=2
drawCurveWithGaps(function(x) { return 1/(x-2); }, [2]);
```

---

## Multi-Curve Config Object Pattern

When a widget needs to switch between different curve families (linear, quadratic, reciprocal, exponential), use a config object per family rather than giant if/else blocks.

```javascript
var CURVES = {
  linear: {
    label: 'y = mx + c',
    sliders: [
      { id: 'm', label: 'm', min: -5, max: 5, value: 1, step: 0.1 },
      { id: 'c', label: 'c', min: -5, max: 5, value: 0, step: 0.1 }
    ],
    fn: function(x, p) { return p.m * x + p.c; },
    color: '#00abfa',
    features: function(p) {
      // Return array of {x, y, label} for key feature dots
      return [{ x: 0, y: p.c, label: '(0,' + p.c + ')' }];
    }
  },
  quadratic: {
    label: 'y = ax² + bx + c',
    sliders: [
      { id: 'a', label: 'a', min: -3, max: 3, value: 1, step: 0.1 },
      { id: 'b', label: 'b', min: -5, max: 5, value: 0, step: 0.1 },
      { id: 'c', label: 'c', min: -5, max: 5, value: 0, step: 0.1 }
    ],
    fn: function(x, p) { return p.a*x*x + p.b*x + p.c; },
    color: '#0fee89',
    features: function(p) {
      var xv = -p.b / (2*p.a);
      var yv = p.fn ? p.fn(xv, p) : p.a*xv*xv + p.b*xv + p.c;
      return [{ x: xv, y: yv, label: 'vertex' }];
    }
  }
  // add more families as needed
};

var activeCurve = 'linear';
var params = {};  // current slider values, keyed by slider id

function buildSliders() {
  var cfg = CURVES[activeCurve];
  var container = document.getElementById('sliders');
  container.innerHTML = '';
  cfg.sliders.forEach(function(s) {
    params[s.id] = s.value;
    // create label + input[range] elements here
  });
}
```

---

## Expression Parsing via Function() Constructor

For widgets where the user types a function (e.g. "x^2 + 3*x - 1"):

```javascript
function parseExpr(str) {
  // Convert ^ to ** for JS exponentiation, then wrap in a Function
  var expr = str
    .replace(/\^/g, '**')
    .replace(/(\d)(x)/g, '$1*$2');  // handle implicit multiply: 2x → 2*x
  try {
    var fn = new Function('x', '"use strict"; return (' + expr + ');');
    fn(0);  // test with x=0 to catch immediate errors
    return fn;
  } catch(e) {
    return null;  // invalid expression
  }
}

// Usage
var userFn = parseExpr(document.getElementById('exprInput').value);
if (userFn) {
  drawCurve(userFn, '#00abfa');
} else {
  showError('Invalid expression');
}
```

**Safety note:** `new Function()` evaluates arbitrary JavaScript. This is acceptable for a single-user local/embedded tool. Do not use this in a multi-user server-side context.

---

## Slider CSS — Brand-Matching Template

```css
.sliders {
  width: 560px;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 10px 4px;
  border-top: 1px solid #1a2535;
  border-bottom: 1px solid #1a2535;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Fixed-width — prevents layout shift when value changes */
.slider-label {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  width: 72px;
  flex-shrink: 0;
}

input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: #1e2e3e;
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

/* Thumb color per parameter — a=blue, b=yellow, c=green */
#slider-a::-webkit-slider-thumb {
  -webkit-appearance: none; width:15px; height:15px;
  border-radius:50%; background:#00abfa; cursor:pointer;
}
#slider-b::-webkit-slider-thumb {
  -webkit-appearance: none; width:15px; height:15px;
  border-radius:50%; background:#fff067; cursor:pointer;
}
#slider-c::-webkit-slider-thumb {
  -webkit-appearance: none; width:15px; height:15px;
  border-radius:50%; background:#0fee89; cursor:pointer;
}
```

---

## Full Widget HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Parhaylikhay · [Widget Name]</title>
  <!-- Open Graph tags required for Iframely/Circle embed -->
  <meta property="og:title" content="[Widget Name]"/>
  <meta property="og:type" content="video.other"/>
  <meta property="og:video:type" content="text/html"/>
  <meta property="og:video:width" content="600"/>
  <meta property="og:video:height" content="580"/>
  <style>
    /* brand + layout CSS here */
  </style>
</head>
<body>
  <!-- 1. Header: title + instruction -->
  <div class="header">
    <div class="title">[Widget Title]</div>
    <div class="instruction">[Instruction in plain English — friendly, like a teacher talking. e.g. "Move the slider and watch how the parabola changes"]</div>
  </div>

  <!-- 2. Live equation display (HTML, not canvas) -->
  <div class="equation-bar" id="eq-display">y = x²</div>

  <!-- 3. Canvas -->
  <canvas id="graph" width="560" height="360"></canvas>

  <!-- 4. Sliders -->
  <div class="sliders">
    <!-- one .slider-row per parameter -->
  </div>

  <!-- 5. Footer: Cambridge tip -->
  <div class="footer">
    <div class="tip">Cambridge tip: <strong>[mark-scheme point]</strong> — [explanation].</div>
  </div>

  <script>
    // All JS here: HiDPI setup, toCanvas/fromCanvas,
    // draw(), slider wiring, drag events, initial draw()
  </script>
</body>
</html>
```

---

## Widget Types

Every widget is either Exploratory or Guided. Decide which type before building.

### Exploratory
Student drags or adjusts something and observes how the maths changes. No goal, no completion state. Pure visual intuition.

**When to use:** Introducing a concept for the first time — e.g. "what does changing `a` in y = ax² actually do?"

**Rules:**
- Always show the equation updating live as the student interacts
- Show the key numerical value prominently (gradient, discriminant, scale factor, etc.) in `#fff067`
- Never show "correct" or "wrong" — there is no wrong state in exploratory mode
- Must have at least one interactive element (slider, draggable dot, or clickable)

### Guided
Student works toward a visual target — match a curve, place a point correctly, produce a specific output.

**When to use:** Practising a skill after it's been introduced.

**Rules:**
- Show the target state clearly (ghost shape, dotted target line, or labelled goal)
- Give continuous visual feedback as the student gets closer — e.g. colour shifts from `#ff4670` toward `#0fee89` as error decreases
- Never show "Wrong!" — just withhold the success visual until they're close
- Tolerance for "correct" should be generous (match the level of precision Cambridge asks for)

---

## Instruction Text Rules

Instructions must feel like a teacher speaking, not a textbook. English only. Friendly and direct. Never stiff or formal.

```
// WRONG — sounds like a textbook
"Manipulate the parameter to observe the resulting transformation."

// WRONG — too vague
"Use the sliders."

// RIGHT — teacher voice
"Drag the point and watch how the gradient changes."
"Move the sliders — notice how 'a' controls the shape and 'c' lifts the whole curve up or down."
"Try making 'a' negative — what happens to the parabola?"
"Click the quantity you want to find, then enter the other two."
```

**Formula for a good instruction line:** tell the student *what to do* (the action) and *what to notice* (the mathematical payoff), in one sentence.

---

## What Every Widget Must Show

These four elements are mandatory in every widget, regardless of type:

1. **Live equation or value display** — updates every time the student interacts. Never show a static formula.
2. **Coordinate or parameter labels** — the most important number on screen (gradient, y-intercept, discriminant, scale factor) displayed in `#fff067` at a readable size.
3. **Axis tick labels** — x and y axis with numbers every 1 unit (or appropriate interval), colour `#6a8898`.
4. **Cambridge tip footer** — one sentence connecting the visual to how examiners test this topic, in `#0fee89`. This is what turns a nice animation into a revision tool.

---

## Codepen Deployment Checklist

- [ ] Canvas DPR scaling applied (HiDPI fix)
- [ ] Background `#0d1216` in both CSS and `ctx.fillRect`
- [ ] Grid drawn as a single batched path (not per-line stroke)
- [ ] Tick labels are visible (`#6a8898` or similar, NOT white)
- [ ] Slider labels have fixed width (no layout shift on value change)
- [ ] All sliders continuous (`step="0.01"`, not `step="1"`)
- [ ] Draggable canvas points work on both mouse and touch
- [ ] Cambridge tip in footer
- [ ] Open Graph meta tags present
- [ ] `draw()` called on page load (initial state visible immediately)
- [ ] Equation display updates on every interaction

---

## Naming Convention

```
[subject]-[concept]-[type].html

maths-quadratic-explorer.html
maths-straight-line-gradient.html
physics-ohms-law-explorer.html
physics-speed-time-graph.html
```
