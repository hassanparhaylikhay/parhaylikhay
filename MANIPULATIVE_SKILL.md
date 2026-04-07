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

## Codepen Deployment Checklist

- [ ] Canvas DPR scaling applied (HiDPI fix)
- [ ] Background `#0d1216` in both CSS and `ctx.fillRect`
- [ ] Grid drawn as a single batched path (not per-line stroke)
- [ ] Tick labels are visible (`#6a8898` or similar, NOT white)
- [ ] Slider labels have fixed width (no layout shift on value change)
- [ ] All sliders continuous (`step="0.1"`, not `step="1"`)
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
