#!/usr/bin/env node
/**
 * Hassan's classroom method, wired into Unit 6.
 *
 * "I asked students to show me 'what we are given' and 'what we need to find
 * out', we circle them, and then see which trig equation covers them to know
 * which trig equation to use."
 *
 * Three parts:
 *   1. Both steps cards rewritten around given / find / circle / match.
 *   2. A given-then-find slide in each lesson, where the student marks the
 *      two things on the diagram before any formula appears.
 *   3. The "pick the formula" hints reworded to name the given and the find.
 *
 * Run: node scripts/lesson-given-find.js
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")
const f = n => (Math.round(n * 10) / 10).toString()

// ── figure pieces (same region convention as lesson-tap-diagrams.js) ──────

function regionLine(id, x1, y1, x2, y2, colour, hit = 26) {
  return (
    `<g data-region='${id}'>` +
    `<line class='pl-tap-vis' x1='${f(x1)}' y1='${f(y1)}' x2='${f(x2)}' y2='${f(y2)}' ` +
    `stroke='${colour}' stroke-width='4' stroke-linecap='round' fill='none' opacity='0.28'/>` +
    `<line class='pl-tap-hit' x1='${f(x1)}' y1='${f(y1)}' x2='${f(x2)}' y2='${f(y2)}' ` +
    `stroke='#000' stroke-opacity='0' stroke-width='${hit}' stroke-linecap='round' fill='none' pointer-events='all'/>` +
    `</g>`
  )
}
const txt = (x, y, s, colour, anchor = "middle", size = 14) =>
  `<text x='${f(x)}' y='${f(y)}' font-family='Geist Mono,monospace' font-size='${size}' font-weight='600' ` +
  `fill='${colour}' text-anchor='${anchor}' dominant-baseline='middle' pointer-events='none'>${s}</text>`

const RAD = Math.PI / 180
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
const unit = (p, q) => { const d = [q[0] - p[0], q[1] - p[1]], L = Math.hypot(...d); return [d[0] / L, d[1] / L] }
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k]

/** Angle wedge as a sampled polyline. Never SVG arc sweep flags. */
function wedge(c, a0, a1, r, steps = 18) {
  let d = `M ${f(c[0])} ${f(c[1])}`
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    d += ` L ${f(c[0] + r * Math.cos(a * RAD))} ${f(c[1] + r * Math.sin(a * RAD))}`
  }
  return d + " Z"
}

/**
 * Right-angled triangle: right angle at the bottom left, the marked angle at
 * the bottom right. Drawn TRUE to whatever it is labelled with. Pass either
 * angleDeg (and the shape is built from it) or a ratio of the two legs, so a
 * side marked 12 is never drawn shorter than a side marked 9.
 */
function triangle({ angleDeg, angleLabel, legRatio, base, left, hyp }) {
  // The figure shares the canvas with a column of tappable chips on the
  // right, so it is fitted into a box rather than given a fixed leg. A fixed
  // vertical leg made the base long enough to run into the chips.
  const A = [48, 248]                       // right angle
  const MAX_W = 196, MAX_H = 168            // room before the chip column
  const ratio = angleDeg ? 1 / Math.tan(angleDeg * RAD) : legRatio   // base ÷ left
  const LEFT = Math.min(MAX_H, MAX_W / ratio)
  const baseLen = LEFT * ratio
  const B = [A[0] + baseLen, A[1]]
  const C = [A[0], A[1] - LEFT]

  const cen = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3]
  const inward = m => unit(m, cen)
  const outward = m => { const u = inward(m); return [-u[0], -u[1]] }

  const mBase = mid(A, B), mLeft = mid(A, C), mHyp = mid(C, B)
  const lBase = add(mBase, outward(mBase), 22)
  const lLeft = add(mLeft, outward(mLeft), 22)
  const lHyp = add(mHyp, outward(mHyp), 24)

  let svg =
    `<svg viewBox='0 0 480 320' preserveAspectRatio='xMidYMid meet' style='display:block;width:100%;height:100%' xmlns='http://www.w3.org/2000/svg'>` +
    `<polygon points='${f(A[0])},${f(A[1])} ${f(B[0])},${f(B[1])} ${f(C[0])},${f(C[1])}' fill='rgba(240,238,234,0.05)' stroke='#c8c6be' stroke-width='2.2' stroke-linejoin='round'/>` +
    `<path d='M ${f(A[0] + 13)} ${f(A[1])} L ${f(A[0] + 13)} ${f(A[1] - 13)} L ${f(A[0])} ${f(A[1] - 13)}' fill='none' stroke='#fff067' stroke-width='1.6' opacity='0.9'/>`

  if (angleDeg) {
    // interior wedge at B, from the base (pointing left) round to the hypotenuse
    const a0 = 180
    const a1 = Math.atan2(C[1] - B[1], C[0] - B[0]) / RAD + 360   // ~220 for 40 degrees
    svg += `<path d='${wedge(B, a0, a1, 26)}' fill='rgba(255,240,103,0.18)' stroke='#fff067' stroke-width='1.2'/>`
    const bis = (a0 + a1) / 2
    const t = add(B, [Math.cos(bis * RAD), Math.sin(bis * RAD)], 44)
    svg += txt(t[0], t[1], angleLabel, "#fff067", "middle", 15)
  }

  svg +=
    txt(lBase[0], lBase[1], base, "#00abfa") +
    txt(lLeft[0], lLeft[1], left, "#ff822c", "end") +
    txt(lHyp[0], lHyp[1], hyp, "#ff4670") +
    `</svg>`

  /**
   * Where a "given" / "find" tag sits for one side. Offsetting every tag the
   * same distance toward the centroid piles them all in the middle of the
   * triangle, so a tag stops looking like it belongs to any side. Instead
   * each tag sits at its own point ALONG its side (different t per side so
   * they never line up) and is pushed off the line by exactly enough to
   * clear the tag box.
   */
  function tagPoint(P, Q, t, tagText = "H") {
    const m = [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]
    const u = unit(P, Q)
    let n = [-u[1], u[0]]
    if ((cen[0] - m[0]) * n[0] + (cen[1] - m[1]) * n[1] < 0) n = [-n[0], -n[1]]
    // Clearance depends on how wide the marker actually is: a single letter
    // needs far less room than a word, and one fixed offset pushed the
    // letters off their own side into a huddle in the middle.
    const HW = 11 + 4.5 * tagText.length, HH = 13, PAD = 6
    const d = HW * Math.abs(n[0]) + HH * Math.abs(n[1]) + PAD
    return add(m, n, d).map(v => Math.round(v * 10) / 10)
  }

  return {
    svg:
      svg.replace("</svg>", "") +
      regionLine("base", A[0], A[1], B[0], B[1], "#00abfa") +
      regionLine("left", C[0], C[1], A[0], A[1], "#ff822c") +
      regionLine("hyp", C[0], C[1], B[0], B[1], "#ff4670") +
      `</svg>`,
    // tags sit inside the triangle, the value labels sit outside it
    // Spread along each side as well as off it, so two markers never end up
    // shoulder to shoulder near the middle.
    tagAt: (side, tagText) => ({
      base: () => tagPoint(A, B, 0.40, tagText),
      left: () => tagPoint(C, A, 0.75, tagText),
      hyp: () => tagPoint(C, B, 0.50, tagText),
    })[side](),
  }
}


/** A tappable rounded chip drawn on the canvas: the choice happens on the board. */
function regionChip(id, x, y, w, h, colour) {
  return (
    `<g data-region='${id}'>` +
    `<rect class='pl-tap-vis pl-tap-fill' x='${f(x)}' y='${f(y)}' width='${f(w)}' height='${f(h)}' rx='8' ` +
    `fill='${colour}22' stroke='${colour}' stroke-width='2' opacity='0.4'/>` +
    `<rect class='pl-tap-hit' x='${f(x)}' y='${f(y)}' width='${f(w)}' height='${f(h)}' rx='8' ` +
    `fill='#000' fill-opacity='0' stroke='#000' stroke-opacity='0' stroke-width='2' pointer-events='all'/>` +
    `</g>`
  )
}

/** Stack chips down the right-hand side of the canvas, beside the figure. */
function chipColumn(items, { x = 272, w = 192, h = 58, top = 52, gap = 18, size = 17 } = {}) {
  let out = ""
  const labels = []
  const at = {}
  items.forEach((it, i) => {
    const y = top + i * (h + gap)
    out += regionChip(it.id, x, y, w, h, it.colour ?? "#fff067")
    // The formula is a KaTeX label over the chip, so a divide is a real
    // fraction bar rather than a forward slash.
    labels.push({ x: x + w / 2, y: y + h / 2, tex: it.tex, color: "#f0eeea", size })
    at[it.id] = [x + w / 2, y + h / 2]
  })
  return { svg: out, labels, at }
}

// ── the two new slides ───────────────────────────────────────────────────

// 6.2: circle the given side and the side we want, each marked with its ROLE
// letter, then pick the formula that carries those same two letters. The
// letters are what makes the decision visual rather than verbal.
const trig = triangle({ angleDeg: 40, angleLabel: "40°", base: "", left: "x", hyp: "9 cm" })
const trigChips = chipColumn([
  { id: "f-sin", tex: "\\sin\\theta = \\dfrac{\\text{O}}{\\text{H}}" },
  { id: "f-cos", tex: "\\cos\\theta = \\dfrac{\\text{A}}{\\text{H}}" },
  { id: "f-tan", tex: "\\tan\\theta = \\dfrac{\\text{O}}{\\text{A}}" },
])
const TRIG_SLIDE = {
  id: "07b3-given-find",
  kind: "interaction",
  chapter: "side",
  title: "What are we given, what do we need?",
  advance: "onSuccess",
  interaction: {
    kind: "tapDiagram",
    config: {
      prompt: "Mark the two sides the question is about, then pick the formula that uses them.",
      contextHtml: trig.svg.replace("</svg>", trigChips.svg + "</svg>"),
      figureLabels: trigChips.labels,
      sequence: [
        {
          regionId: "hyp",
          tag: "H",
          tagAt: trig.tagAt("hyp", "H"),
          prompt: "Tap the side you are given. It is the one with a number on it.",
          hint: "One side has a length written on it. That is the side you are given.",
        },
        {
          regionId: "left",
          tag: "O",
          tagAt: trig.tagAt("left", "O"),
          prompt: "That side is opposite the right angle, so it is the hypotenuse, H. Now tap the side you need to find.",
          hint: "The side you need is the one labelled with a letter instead of a number.",
        },
        {
          regionId: "f-sin",
          prompt: "That side is across from the $40°$ angle, so it is the opposite, O. You have O and H. Tap the formula that uses those two.",
          hint: "Look for the formula with O on top and H underneath.",
        },
      ],
      regions: [
        { id: "hyp", whyWrong: "Not that one right now. Read the instruction above the diagram." },
        { id: "left", whyWrong: "Not that one right now. Read the instruction above the diagram." },
        { id: "base", whyWrong: "Nothing is written on that side, so the question is not about it." },
        { id: "f-sin", whyWrong: "Not yet. Mark the two sides on the triangle first." },
        { id: "f-cos", whyWrong: "Cos uses A and H. You marked O and H, so cos is not the one." },
        { id: "f-tan", whyWrong: "Tan uses O and A. You have no A here, and you do have H, so tan is not the one." },
      ],
      successText: "You marked O and H, and sin is the formula with O and H in it. So $\\sin 40° = \\dfrac{x}{9}$.",
    },
  },
}

// 6.1: same idea, and the H marker is what decides add against subtract.
const pyth = triangle({ legRatio: 12 / 9, base: "12 cm", left: "x", hyp: "15 cm" })
const pythChips = chipColumn([
  { id: "e-add", tex: "x^{2} = 15^{2} + 12^{2}" },
  { id: "e-sub", tex: "x^{2} = 15^{2} - 12^{2}" },
], { top: 88, gap: 26, w: 192, x: 272, size: 16 })
const PYTH_SLIDE = {
  id: "05d-given-find",
  kind: "interaction",
  chapter: "rule",
  title: "What are we given, what do we need?",
  advance: "onSuccess",
  interaction: {
    kind: "tapDiagram",
    config: {
      prompt: "Mark the hypotenuse and the side you want, then decide whether to add or subtract.",
      contextHtml: pyth.svg.replace("</svg>", pythChips.svg + "</svg>"),
      figureLabels: pythChips.labels,
      sequence: [
        {
          regionId: "hyp",
          tag: "H",
          tagAt: pyth.tagAt("hyp", "H"),
          prompt: "Tap the hypotenuse. It is the side opposite the right angle.",
          hint: "The hypotenuse is opposite the right angle, and it is the longest side.",
        },
        {
          regionId: "left",
          tag: "find",
          tagAt: pyth.tagAt("left", "find"),
          prompt: "Now tap the side you need to find.",
          hint: "The side you need is the one labelled with a letter instead of a number.",
        },
        {
          regionId: "e-sub",
          prompt: "The side you want is not the H, so it is a shorter side. Tap the equation that gives you it.",
          hint: "You add the squares only when the side you want is the hypotenuse. This one is not, so the squares come apart.",
        },
      ],
      regions: [
        { id: "hyp", whyWrong: "Not that one right now. Read the instruction above the diagram." },
        { id: "left", whyWrong: "Not that one right now. Read the instruction above the diagram." },
        { id: "base", whyWrong: "Not that one right now. Read the instruction above the diagram." },
        { id: "e-add", whyWrong: "You add the squares when the side you want is the hypotenuse. Here the H is already given, so this is the other case." },
        { id: "e-sub", whyWrong: "Not yet. Mark the hypotenuse and the side you want first." },
      ],
      successText: "The H is given and you want a shorter side, so you take one square away from the other: $x^2 = 15^2 - 12^2$.",
    },
  },
}

// ── steps cards rebuilt around the method ────────────────────────────────

const stepsCard = steps =>
  `<div style='display:flex;flex-direction:column;gap:14px;padding:10px 0;max-width:36em'>` +
  steps.map((t, i) =>
    `<div style='display:flex;align-items:center;gap:16px'>` +
    `<span style="flex:none;width:30px;height:30px;border-radius:50%;background:rgba(0,171,250,0.12);` +
    `border:1px solid rgba(0,171,250,0.42);color:#00abfa;font-family:Geist Mono,monospace;font-size:13px;` +
    `font-weight:600;display:flex;align-items:center;justify-content:center">${i + 1}</span>` +
    `<span style='font-size:18px;color:#f0eeea;line-height:1.45'>${t}</span></div>`).join("") +
  `</div>`

const TRIG_STEPS = [
  "Circle what you are given.",
  "Circle what you need to find.",
  "Name those two sides: opposite, adjacent or hypotenuse.",
  "Pick the formula that has both of those names in it.",
  "Put the numbers in and work out the answer.",
]
const PYTH_STEPS = [
  "Circle what you are given.",
  "Circle what you need to find.",
  "Find the hypotenuse. It is the side opposite the right angle.",
  "If you need the hypotenuse, add the squares. If not, subtract.",
  "Take the square root at the end.",
]

// ── apply ────────────────────────────────────────────────────────────────

function edit(lessonId, fn) {
  const p = path.join(LESSONS, lessonId, "lesson.json")
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  fn(L, id => {
    const s = L.slides.find(x => x.id === id)
    if (!s) throw new Error(`${lessonId}: missing slide ${id}`)
    return s
  })
  fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
  JSON.parse(fs.readFileSync(p, "utf8"))
}

function insertAfter(L, anchorId, slide) {
  if (L.slides.some(s => s.id === slide.id)) throw new Error(`${slide.id} exists; re-run from a clean checkout`)
  const i = L.slides.findIndex(s => s.id === anchorId)
  if (i < 0) throw new Error(`missing anchor ${anchorId}`)
  L.slides.splice(i + 1, 0, slide)
}

edit("06-02", (L, S) => {
  S("07b2-steps").visual.content = stepsCard(TRIG_STEPS)
  S("07b2-steps").prompt =
    "Every question from here on uses the same five steps. The first two are the ones that decide everything else."
  insertAfter(L, "07b2-steps", TRIG_SLIDE)
  // Name the given and the find in the formula-choice hints.
  const H = {
    "08-solve-side-1": "You are given the hypotenuse and you need the side opposite the angle. Which formula has opposite and hypotenuse in it?",
    "09-solve-side-2": "You are given the side next to the angle and you need the hypotenuse. Which formula has adjacent and hypotenuse in it?",
    "09b-pp-cos": "You are given $AC$, the hypotenuse, and you need $AD$, the side touching the $25°$ angle. Which formula has adjacent and hypotenuse in it?",
    "12-solve-angle-1": "You are given the side opposite $\\theta$ and the hypotenuse. Which formula has both of those in it?",
    "13-solve-angle-2": "You are given the two short sides and neither of them is the hypotenuse. Which formula leaves the hypotenuse out?",
  }
  for (const [id, hint] of Object.entries(H)) {
    const line = S(id).interaction.config.lines.find(l => l.kind === "pick")
    if (!line) throw new Error(`${id}: no pick line`)
    line.hint = hint
  }
  console.log("06-02: steps card rebuilt, given-find slide added, 5 formula hints reworded")
})

edit("06-01", (L, S) => {
  S("05c-steps").visual.content = stepsCard(PYTH_STEPS)
  S("05c-steps").prompt =
    "Every Pythagoras question uses the same five steps. Circling the two things first is what tells you whether to add or subtract."
  insertAfter(L, "05c-steps", PYTH_SLIDE)
  console.log("06-01: steps card rebuilt, given-find slide added")
})
