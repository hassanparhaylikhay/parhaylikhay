---
title: Review and practice
checks:
  - q: 'A regular octagon has how many lines of symmetry and what order of rotational symmetry?'
    options: ["$4$ lines, order $4$", "$8$ lines, order $4$", "$8$ lines, order $8$", "$4$ lines, order $8$"]
    correct: 2
    explain: 'A regular $n$-gon has $n$ lines of symmetry and rotational order $n$. So $8$ lines, order $8$.'
  - q: 'Which letter has rotational symmetry of order $2$ but $0$ lines of symmetry?'
    options: ["$A$", "$H$", "$N$", "$T$"]
    correct: 2
    explain: 'The letter $N$ rotates onto itself after $180°$ but has no mirror line. $H$ has both kinds; $A$ and $T$ have $1$ line and order $1$.'
  - q: 'A cuboid with two square faces (e.g. $5 \times 5 \times 8$) has how many planes of symmetry?'
    options: ["$3$", "$4$", "$5$", "$9$"]
    correct: 2
    explain: '$3$ planes through midpoints of opposite faces, plus $2$ diagonal planes through the square faces, giving $5$ planes.'
  - q: 'The order of rotational symmetry of a sphere about a line through its centre is:'
    options: ["$2$", "$6$", "Finite but large", "Infinite"]
    correct: 3
    explain: 'A sphere is symmetric under any rotation about any line through its centre, so the order is infinite.'
  - q: 'A general (slanted) parallelogram has:'
    options: ["$2$ lines of symmetry, order $2$", "$0$ lines of symmetry, order $1$", "$0$ lines of symmetry, order $2$", "$2$ lines of symmetry, order $1$"]
    correct: 2
    explain: 'A parallelogram has $0$ mirror lines (the diagonals are NOT lines of symmetry) but rotates onto itself after $180°$, giving order $2$.'
  - q: 'Which 2D shape has exactly $1$ line of symmetry and order of rotational symmetry $1$?'
    options: ["Equilateral triangle", "Isosceles trapezium", "Rectangle", "Rhombus"]
    correct: 1
    explain: 'An isosceles trapezium has $1$ mirror line (vertical through midpoints of the parallel sides) and order $1$.'
  - q: 'A cone (right circular) has how many planes of symmetry and what is the order of rotational symmetry of its axis?'
    options: ["$1$ plane, order $1$", "$1$ plane, infinite order", "Infinite planes, infinite order", "$2$ planes, order $2$"]
    correct: 2
    explain: 'A right circular cone has infinitely many planes of symmetry through its axis, and infinite-order rotational symmetry about that axis.'
---

You have now seen the three pieces of this topic: line symmetry of 2D shapes, rotational symmetry of 2D shapes, and the symmetry properties of common 3D solids. Cambridge mixes these freely. Most questions are short, $1$ to $3$ marks each, and reward students who have memorised the standard cases.

## Recap diagram: parallelogram trap

<div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:center;background:#0b1118;border:1px solid #141e2a;border-radius:10px;padding:18px;margin:18px auto;max-width:560px">
  <div style="font-family:'Geist Mono',monospace;font-size:10px;font-weight:600;color:#7a7875;letter-spacing:0.4px;width:100%;text-align:center">PARALLELOGRAM: 0 LINES OF SYMMETRY BUT ORDER 2</div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:200px">
    <div style="width:140px;height:60px;background:#00abfa20;border:2px solid #00abfa;transform:skewX(-25deg)"></div>
    <div style="font-family:'Geist Mono',monospace;font-size:10px;font-weight:600;color:#ff4670;text-align:center">DIAGONALS: NOT mirror lines</div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:10px;width:200px">
    <div style="position:relative;width:140px;height:60px"><div style="width:140px;height:60px;background:#fff06720;border:2px solid #fff067;transform:skewX(-25deg)"></div><div style="position:absolute;top:50%;left:50%;width:8px;height:8px;background:#ff4670;border-radius:50%;transform:translate(-50%,-50%)"></div></div>
    <div style="font-family:'Geist Mono',monospace;font-size:10px;font-weight:600;color:#0fee89;text-align:center">ROTATE 180°: lands on itself</div>
  </div>
  <div style="font-family:'Geist Mono',monospace;font-size:10px;color:#7a7875;text-align:center;width:100%">ORDER 2 ROTATIONAL, 0 MIRROR LINES</div>
</div>

## What you should know by now

- The **lines of symmetry** of: equilateral triangle ($3$), isosceles ($1$), scalene ($0$), square ($4$), rectangle ($2$), rhombus ($2$), parallelogram ($\textcolor{#ff4670}{0}$), kite ($1$), regular $n$-gon ($n$), circle (infinite).
- The **order of rotational symmetry** of common shapes. A parallelogram has order $2$, even though it has $0$ lines of symmetry.
- For a regular $n$-gon, lines of symmetry = $n$ and rotational order = $n$.
- The **planes of symmetry** of: general cuboid ($3$), cube ($9$), right square pyramid ($4$), right regular $n$-pyramid ($n$), cylinder (infinite), cone (infinite), sphere (infinite).
- The **rotational axis** order of a prism through the ends matches the rotational order of its cross-section.
- Order $1$ means "no rotational symmetry"; the minimum is $1$, never $0$.

## Recap diagram: 3D solids at a glance

<svg viewBox="0 0 480 220" style="display:block;width:100%;max-width:520px;height:auto;margin:18px auto;background:#0b1118;border:1px solid #141e2a;border-radius:10px;padding:8px" xmlns="http://www.w3.org/2000/svg">
  <text x="240" y="18" text-anchor="middle" font-family="'Geist Mono',monospace" font-size="10" fill="#7a7875" letter-spacing="0.4px">PLANES OF SYMMETRY: CUBOID 3, CUBE 9, CYLINDER INFINITE</text>
  <g transform="translate(40,40)">
    <polygon points="0,80 80,80 100,60 20,60" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <polygon points="80,80 100,60 100,140 80,160" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <polygon points="0,80 0,160 80,160 80,80" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <text x="50" y="180" text-anchor="middle" font-family="'Geist Mono',monospace" font-size="10" font-weight="600" fill="#fff067">CUBOID: 3</text>
  </g>
  <g transform="translate(170,40)">
    <polygon points="0,60 60,60 80,40 20,40" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <polygon points="60,60 80,40 80,120 60,140" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <polygon points="0,60 0,140 60,140 60,60" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <line x1="30" y1="40" x2="30" y2="140" stroke="#fff067" stroke-width="1.5" stroke-dasharray="3,3"/>
    <line x1="0" y1="100" x2="80" y2="80" stroke="#fff067" stroke-width="1.5" stroke-dasharray="3,3"/>
    <text x="40" y="180" text-anchor="middle" font-family="'Geist Mono',monospace" font-size="10" font-weight="600" fill="#fff067">CUBE: 9</text>
  </g>
  <g transform="translate(310,40)">
    <ellipse cx="50" cy="40" rx="50" ry="12" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <line x1="0" y1="40" x2="0" y2="120" stroke="#00abfa" stroke-width="2"/>
    <line x1="100" y1="40" x2="100" y2="120" stroke="#00abfa" stroke-width="2"/>
    <ellipse cx="50" cy="120" rx="50" ry="12" fill="#1a2330" stroke="#00abfa" stroke-width="2"/>
    <line x1="50" y1="28" x2="50" y2="132" stroke="#fff067" stroke-width="1.5" stroke-dasharray="3,3"/>
    <ellipse cx="50" cy="80" rx="50" ry="12" fill="none" stroke="#0fee89" stroke-width="1.5" stroke-dasharray="3,3"/>
    <text x="50" y="180" text-anchor="middle" font-family="'Geist Mono',monospace" font-size="10" font-weight="600" fill="#fff067">CYLINDER: INF</text>
  </g>
</svg>

## Marking patterns at a glance

| Question style | Marks | What earns the marks |
|---|---|---|
| "Draw the lines of symmetry on this shape" | $1$ to $2$ | B1 for each correct line; lines must be ruled and extend through the shape |
| "Write down the number of lines of symmetry" | $1$ | B1 for the correct integer |
| "State the order of rotational symmetry" | $1$ | B1 for the correct integer (remember order $1$ = none) |
| "Number of planes of symmetry of this cuboid" | $1$ | B1 for $3$ if all sides different |
| "Number of planes of symmetry of a cube" | $1$ to $2$ | B1 for $9$; method might be implicit |
| "Order of rotational symmetry about an axis" | $1$ | B1 for the correct integer based on the cross-section |

## The two single biggest mistakes

1. **Parallelogram**. Saying it has $2$ lines of symmetry along its diagonals. The answer is $0$ lines of symmetry but order $2$ rotational symmetry.
2. **Order $0$**. There is no such thing. The minimum order is $1$, and order $1$ means no rotational symmetry. Cambridge expects "$1$" not "$0$" or "none".

## Comprehensive worked example

A solid is made of a cube of side $4$ cm with a square-based pyramid stacked on top, where the apex of the pyramid sits directly above the centre of the cube and the base of the pyramid coincides with the top face of the cube.

**(a)** State the number of planes of symmetry of this solid.

**(b)** State the order of rotational symmetry about the vertical axis through the apex of the pyramid and the centre of the base of the cube.

**(c)** Looking at the solid from directly above, you see a square. State the number of lines of symmetry of this 2D view.

**Step 1: Visualise.**

A cube with a square pyramid on top. The vertical axis through the apex and the centre of the cube is the principal symmetry axis. The shape has the same rotational symmetry about this axis as a square has about its centre.

**Step 2: Planes of symmetry of the solid (a).**

The cube alone has $9$ planes. The pyramid alone has $4$. The combined solid keeps only the planes that are planes of symmetry for **both** parts: the $4$ planes of the pyramid that contain the vertical axis. (The horizontal planes of the cube are broken by the pyramid; the diagonal planes of the cube that do not contain the vertical axis are also broken.)

These $4$ planes are: $2$ vertical planes through the midpoints of opposite vertical faces of the cube, and $2$ vertical diagonal planes through opposite vertical edges.

**Answer (a):** $4$ planes of symmetry. **[B1]**

**Step 3: Rotational order about the vertical axis (b).**

A $90°$ rotation about the vertical axis maps the cube onto itself and the pyramid onto itself. So the combined solid lands on itself after every $90°$. The order is $4$.

**Answer (b):** Order $4$. **[B1]**

**Step 4: View from above (c).**

From directly above you see the apex of the pyramid in the centre of a square, with the four triangular faces sloping down. The view is a square with its two diagonals visible (or just the square, depending on shading). Either way the outline is a square.

A square has $4$ lines of symmetry: $2$ through midpoints of opposite sides and $2$ along the diagonals.

**Answer (c):** $4$ lines of symmetry. **[B1]**

Full marks $= 3$.
