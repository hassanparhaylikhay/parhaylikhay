#!/usr/bin/env node
/**
 * Build the tappable figures for `tapDiagram` slides and convert the slides
 * that used to ask the student to NAME a part of the figure from a word list.
 *
 * Rule this encodes: when the answer is a thing you can point at, the figure
 * is the answer surface. A word list makes the student translate the picture
 * into prose, pick the prose, and never touch the picture.
 *
 * Every tappable part is:
 *
 *   <g data-region="id">
 *     <... class="pl-tap-vis" />   the highlight: breathes until first tap,
 *                                  turns yellow on hover, green when right,
 *                                  pink when wrong (all via CSS in _shared)
 *     <... class="pl-tap-hit" />   a fat invisible target, pointer-events=all
 *   </g>
 *
 * Run: node scripts/lesson-tap-diagrams.js
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")
const RAD = Math.PI / 180
const f = n => (Math.round(n * 10) / 10).toString()

// ── region primitives ────────────────────────────────────────────────────

/** A tappable straight edge. `dash` marks a candidate the student is judging. */
function regionLine(id, x1, y1, x2, y2, colour, hit = 26, dash = null) {
  return (
    `<g data-region='${id}'>` +
    `<line class='pl-tap-vis' x1='${f(x1)}' y1='${f(y1)}' x2='${f(x2)}' y2='${f(y2)}' ` +
    `stroke='${colour}' stroke-width='${dash ? 3 : 4}'${dash ? ` stroke-dasharray='${dash}'` : ""} stroke-linecap='round' fill='none' opacity='0.28'/>` +
    `<line class='pl-tap-hit' x1='${f(x1)}' y1='${f(y1)}' x2='${f(x2)}' y2='${f(y2)}' ` +
    `stroke='#000' stroke-opacity='0' stroke-width='${hit}' stroke-linecap='round' fill='none' pointer-events='all'/>` +
    `</g>`
  )
}

/** A tappable filled area (an angle wedge, a face). */
function regionPath(id, d, colour) {
  return (
    `<g data-region='${id}'>` +
    `<path class='pl-tap-vis pl-tap-fill' d='${d}' fill='${colour}22' stroke='${colour}' ` +
    `stroke-width='2' stroke-linejoin='round' opacity='0.4'/>` +
    `<path class='pl-tap-hit' d='${d}' fill='#000' fill-opacity='0' stroke='#000' stroke-opacity='0' ` +
    `stroke-width='16' pointer-events='all'/>` +
    `</g>`
  )
}

/** Angle wedge as a sampled polyline. Never SVG arc sweep flags. */
function wedge(cx, cy, a0, a1, r, steps = 18) {
  let d = `M ${f(cx)} ${f(cy)} L ${f(cx + r * Math.cos(a0 * RAD))} ${f(cy + r * Math.sin(a0 * RAD))}`
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps
    d += ` L ${f(cx + r * Math.cos(a * RAD))} ${f(cy + r * Math.sin(a * RAD))}`
  }
  return d + " Z"
}

/** Clip the infinite line through p with direction d to a box. */
function clipToBox(px, py, dx, dy, box) {
  let tmin = -1e9, tmax = 1e9
  for (const [p, d, lo, hi] of [[px, dx, box.x0, box.x1], [py, dy, box.y0, box.y1]]) {
    if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return null; continue }
    let t1 = (lo - p) / d, t2 = (hi - p) / d
    if (t1 > t2) [t1, t2] = [t2, t1]
    tmin = Math.max(tmin, t1)
    tmax = Math.min(tmax, t2)
  }
  if (tmin > tmax) return null
  return [px + tmin * dx, py + tmin * dy, px + tmax * dx, py + tmax * dy]
}

function label(x, y, text, colour, anchor = "middle") {
  return (
    `<text x='${f(x)}' y='${f(y)}' font-family='Geist Mono,monospace' font-size='12' ` +
    `font-weight='600' fill='${colour}' text-anchor='${anchor}' dominant-baseline='middle' ` +
    `pointer-events='none'>${text}</text>`
  )
}

/** Append region markup just before </svg> so it paints on top. */
function appendRegions(svg, markup) {
  return svg.replace("</svg>", markup + "</svg>")
}

/** Every vertex of every polygon already drawn in the figure. */
function shapePoints(svg) {
  const pts = []
  for (const m of String(svg).matchAll(/<polygon[^>]*points='([^']+)'/g)) {
    for (const pair of m[1].trim().split(/\s+/)) {
      const [x, y] = pair.split(",").map(Number)
      if (Number.isFinite(x) && Number.isFinite(y)) pts.push([x, y])
    }
  }
  return pts
}

/**
 * The four mirrors a student is expected to recognise, drawn as dashed
 * candidates. Dashed because none of them is the mirror yet: the student
 * decides which one is, and taps it.
 */
function mirrorCandidates(ox, oy, box, correct, svg) {
  const LINES = [
    { id: "m-xaxis", dx: 1, dy: 0, tex: "y = 0" },
    { id: "m-yaxis", dx: 0, dy: 1, tex: "x = 0" },
    { id: "m-yx", dx: 1, dy: -1, tex: "y = x" },
    { id: "m-ynegx", dx: 1, dy: 1, tex: "y = -x" },
  ]
  if (!LINES.some(l => l.id === correct)) throw new Error(`bad correct id ${correct}`)
  const shapes = shapePoints(svg)
  const placed = []

  /**
   * How much room a label has at p. Tick numbers occupy a whole column just
   * left of the y-axis and a whole row just below the x-axis, so those are
   * scored as lines, not as points. Treating them as points was why "x = 0"
   * landed on top of a tick number twice.
   */
  const room = ([px, py]) => Math.min(
    Math.abs(px - (ox - 12)),                                   // y-tick column
    Math.abs(py - (oy + 11)),                                   // x-tick row
    ...[...shapes, ...placed].map(([qx, qy]) => Math.hypot(px - qx, py - qy)),
  )

  let out = ""
  for (const L of LINES) {
    const seg = clipToBox(ox, oy, L.dx, L.dy, box)
    if (!seg) continue
    const [x1, y1, x2, y2] = seg
    out += regionLine(L.id, x1, y1, x2, y2, "#7a7875", 22, "7 6")

    // Name each candidate: mapping an equation to a line on the grid is the
    // skill this chapter teaches, so the names have to be readable. Try both
    // ends and both sides of the line, and keep whichever position has the
    // most room. The perpendicular offset is what keeps the dashes from
    // running straight through the text.
    const len = Math.hypot(L.dx, L.dy)
    const ux = L.dx / len, uy = L.dy / len
    const perp = [-uy, ux]
    const ALONG = 40, OFF = 14, HALF = 26
    const cands = []
    for (const [ex, ey, dir] of [[x1, y1, -1], [x2, y2, 1]]) {
      for (const side of [1, -1]) {
        const offx = side * perp[0] * OFF, offy = side * perp[1] * OFF
        // Anchor the text AWAY from the line so the dashes never run through
        // it. A centred label with a 14 px offset still has the line cutting
        // its first glyph, which is what the render showed.
        const anchor = Math.abs(offx) > 6 ? (offx > 0 ? "start" : "end") : "middle"
        const lo = anchor === "start" ? box.x0 + 14 : anchor === "end" ? box.x0 + 2 * HALF : box.x0 + HALF
        const hi = anchor === "start" ? box.x1 - 2 * HALF : anchor === "end" ? box.x1 - 14 : box.x1 - HALF
        cands.push([
          clamp(ex - dir * ux * ALONG + offx, lo, hi),
          clamp(ey - dir * uy * ALONG + offy, box.y0 + 14, box.y1 - 14),
          anchor,
        ])
      }
    }
    const best = cands.reduce((a, b) => (room(b) > room(a) ? b : a))
    placed.push(best)
    out += label(best[0], best[1], L.tex, "#7a7875", best[2])
  }
  return out
}

function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi) }

// ── the conversions ──────────────────────────────────────────────────────

const EDITS = []

// 1. 06-02 04-q-swap — which side is opposite theta (theta at the top vertex)
EDITS.push({
  lesson: "06-02", slide: "04-q-swap",
  build(ctx) {
    // triangle (100,259) (380,259) (100,49); theta at (100,49)
    return appendRegions(ctx,
      regionLine("s1", 100, 259, 380, 259, "#00abfa") +
      regionLine("s2", 100, 49, 100, 259, "#ff822c") +
      regionLine("s3", 100, 49, 380, 259, "#ff4670"))
  },
  prompt: "Now $\\theta$ has moved to the top. Tap the side opposite it.",
  regions: [
    { id: "s1", isCorrect: true },
    { id: "s2", whyWrong: "Side 2 runs into the corner where $\\theta$ sits, so it touches the angle. The opposite side never touches it." },
    { id: "s3", whyWrong: "Side 3 also meets the corner where $\\theta$ sits. It is the hypotenuse here, not the opposite." },
  ],
  successText: "Side 1 is the only side that does not touch the corner where $\\theta$ sits, so it is the opposite. Move $\\theta$ and the opposite side moves with it.",
})

// 2. 06-01 11-q-spot-roles — which side is the hypotenuse
EDITS.push({
  lesson: "06-01", slide: "11-q-spot-roles",
  build(ctx) {
    // triangle (195,268) (285,268) (195,52); right angle at (195,268)
    return appendRegions(ctx,
      regionLine("bottom", 195, 268, 285, 268, "#00abfa") +
      regionLine("left", 195, 52, 195, 268, "#fff067") +
      regionLine("hyp", 195, 52, 285, 268, "#ff4670"))
  },
  prompt: "Tap the hypotenuse of this triangle.",
  regions: [
    { id: "hyp", isCorrect: true },
    { id: "left", whyWrong: "That side runs into the right angle, so it is a leg. It is also the side you are being asked to find." },
    { id: "bottom", whyWrong: "That side runs into the right angle too, so it is the other leg." },
  ],
  successText: "The $13$ cm side sits opposite the right angle, so its square stands alone in the equation. That decides whether you add or subtract.",
})

// 3. 06-01 03-spot-hypotenuse — was three separate mini-triangle cards
EDITS.push({
  lesson: "06-01", slide: "03-spot-hypotenuse",
  build() {
    // Fresh figure: right angle at the BOTTOM RIGHT so the hypotenuse is not
    // in the position the student saw a moment ago. No side labels: the
    // right-angle marker is the only cue, which is the whole skill.
    const A = [140, 254], B = [340, 254], C = [340, 96]
    const svg =
      `<svg viewBox='0 0 480 320' preserveAspectRatio='xMidYMid meet' style='display:block;width:100%;height:100%' xmlns='http://www.w3.org/2000/svg'>` +
      `<polygon points='${A[0]},${A[1]} ${B[0]},${B[1]} ${C[0]},${C[1]}' fill='rgba(240,238,234,0.05)' stroke='#c8c6be' stroke-width='2.2' stroke-linejoin='round'/>` +
      // right-angle marker inside the corner at B
      `<path d='M 327 254 L 327 241 L 340 241' fill='none' stroke='#fff067' stroke-width='1.6' opacity='0.9'/>` +
      `</svg>`
    return appendRegions(svg,
      regionLine("base", A[0], A[1], B[0], B[1], "#fff067") +
      regionLine("upright", B[0], B[1], C[0], C[1], "#fff067") +
      regionLine("hyp", A[0], A[1], C[0], C[1], "#fff067"))
  },
  prompt: "The hypotenuse is the side opposite the right angle. Tap it.",
  regions: [
    { id: "hyp", isCorrect: true },
    { id: "base", whyWrong: "That side runs into the right angle, so it is a leg." },
    { id: "upright", whyWrong: "That side runs into the right angle too, so it is the other leg." },
  ],
  successText: "That is the only side that never touches the right angle. It is the hypotenuse, and it is always the longest of the three.",
})

// 4. 06-02 14-elevation-concept — which angle is the elevation
EDITS.push({
  lesson: "06-02", slide: "14-elevation-concept",
  build(ctx) {
    const O = [96, 276]       // observer
    const W = [356, 276]      // foot of the wall
    const T = [356, 116]      // top of the wall
    const aSight = Math.atan2(T[1] - O[1], T[0] - O[0]) / RAD    // ~ -31.6
    const aBack = Math.atan2(O[1] - T[1], O[0] - T[0]) / RAD     // ~ 148.4
    return appendRegions(ctx,
      regionPath("a-elev", wedge(O[0], O[1], 0, aSight, 40), "#fff067") +
      regionPath("a-right", wedge(W[0], W[1], 180, 270, 30), "#fff067") +
      regionPath("a-top", wedge(T[0], T[1], 90, aBack, 38), "#fff067"))
  },
  prompt: "Stand at the blue point and look at the top of the wall. Tap the angle of elevation.",
  regions: [
    { id: "a-elev", isCorrect: true },
    { id: "a-right", whyWrong: "That is the right angle where the wall meets the ground. It is always $90°$, so it is never the elevation." },
    { id: "a-top", whyWrong: "That is the angle at the top, the depression looking back down. Elevation is measured from where you stand." },
  ],
  successText: "Elevation is measured up from the flat horizontal to your line of sight. The height and the horizontal distance are then opposite and adjacent, which is why elevation questions are nearly always tan.",
})

// 5. 07-01 19-which-mirror — tap the mirror line itself
EDITS.push({
  lesson: "07-01", slide: "19-which-mirror",
  build(ctx) {
    // widget geometry: origin (213.5, 160), plot x 28..452, y 28..292
    return appendRegions(ctx, mirrorCandidates(213.5, 160, { x0: 28, x1: 452, y0: 28, y1: 292 }, "m-yx", ctx))
  },
  prompt: "The blue triangle was reflected onto the pink one. Tap the mirror line it used.",
  regions: [
    { id: "m-yx", isCorrect: true },
    { id: "m-xaxis", whyWrong: "The $x$-axis flips top to bottom only. Pink would still be on the left." },
    { id: "m-yaxis", whyWrong: "The $y$-axis flips left to right only. Pink would still be near the bottom." },
    { id: "m-ynegx", whyWrong: "$y = -x$ would send the image to the bottom right, not up to the top." },
  ],
  successText: "The mirror is $y = x$, the diagonal through the origin going up to the right. Fold the page along it and blue lands exactly on pink.",
})

// 6. 07-01 25b-flashback-reflection — same skill, one chapter later
EDITS.push({
  lesson: "07-01", slide: "25b-flashback-reflection",
  build(ctx) {
    // card geometry: origin (212, 160), plot x 16..464, y 20..300
    return appendRegions(ctx, mirrorCandidates(212, 160, { x0: 16, x1: 464, y0: 20, y1: 300 }, "m-ynegx", ctx))
  },
  prompt: "One from the mirror chapter. Tap the line that reflects blue onto pink.",
  regions: [
    { id: "m-ynegx", isCorrect: true },
    { id: "m-yx", whyWrong: "Reflecting in $y = x$ swaps the coordinates and keeps their signs. Here the signs have flipped as well." },
    { id: "m-yaxis", whyWrong: "The $y$-axis only swaps left and right. Pink has also dropped below the $x$-axis." },
    { id: "m-xaxis", whyWrong: "The $x$-axis only swaps up and down. Pink has also crossed to the left side." },
  ],
  successText: "The mirror is $y = -x$. Each point $(x, y)$ maps to $(-y, -x)$: the coordinates swap and both signs flip.",
})

/**
 * placeLabel slides whose slots are parts of the figure. Same region markup;
 * the names get dropped onto the drawing instead of into boxes in the aside.
 */
const LABEL_EDITS = [
  {
    lesson: "06-02", slide: "03-place-sides",
    build(ctx) {
      // triangle (100,259) (380,259) (100,49); right angle bottom left, theta bottom right
      return appendRegions(ctx,
        regionLine("s-base", 100, 259, 380, 259, "#00abfa") +
        regionLine("s-vert", 100, 49, 100, 259, "#ff822c") +
        regionLine("s-hyp", 100, 49, 380, 259, "#ff4670"))
    },
    prompt: "Name the three sides of this triangle. The angle $\\theta$ is at the bottom right.",
    // labelAt sits inside the triangle, clear of the existing "side N" labels
    slots: [
      { id: "s-base", hint: "side 1", correctLabelId: "lab-adj", region: "s-base", labelAt: [250, 240] },
      { id: "s-vert", hint: "side 2", correctLabelId: "lab-opp", region: "s-vert", labelAt: [140, 150] },
      // perpendicular inward from the hypotenuse midpoint (240,154), so the
      // name sits the same distance off its own side as the other two
      { id: "s-hyp", hint: "side 3", correctLabelId: "lab-hyp", region: "s-hyp", labelAt: [226, 176] },
    ],
  },
]

// ── apply ────────────────────────────────────────────────────────────────

const byLesson = {}
for (const e of EDITS) (byLesson[e.lesson] ??= []).push(e)

for (const [lessonId, edits] of Object.entries(byLesson)) {
  const p = path.join(LESSONS, lessonId, "lesson.json")
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  for (const e of edits) {
    const s = L.slides.find(x => x.id === e.slide)
    if (!s) throw new Error(`no slide ${lessonId}/${e.slide}`)
    const oldCfg = s.interaction.config ?? {}
    // Regions are appended to the source figure, so a second run would stack
    // a duplicate set on top. Re-run from a clean checkout instead.
    if (/data-region=/.test(oldCfg.contextHtml ?? "")) {
      throw new Error(`${e.slide}: figure already has regions; git checkout the lesson.json and re-run`)
    }
    const contextHtml = e.build(oldCfg.contextHtml)
    if (!/data-region=/.test(contextHtml)) throw new Error(`${e.slide}: no regions emitted`)
    for (const r of e.regions) {
      if (!contextHtml.includes(`data-region='${r.id}'`)) {
        throw new Error(`${e.slide}: region "${r.id}" is not in the figure`)
      }
    }
    if (e.regions.filter(r => r.isCorrect).length !== 1) {
      throw new Error(`${e.slide}: needs exactly one correct region`)
    }
    s.interaction.kind = "tapDiagram"
    s.interaction.config = {
      prompt: e.prompt,
      contextHtml,
      regions: e.regions,
      successText: e.successText,
    }
    console.log(`${lessonId} ${e.slide}: tapDiagram, ${e.regions.length} regions`)
  }
  fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
  JSON.parse(fs.readFileSync(p, "utf8"))
}

for (const e of LABEL_EDITS) {
  const p = path.join(LESSONS, e.lesson, "lesson.json")
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  const s = L.slides.find(x => x.id === e.slide)
  if (!s) throw new Error(`no slide ${e.lesson}/${e.slide}`)
  const cfg = s.interaction.config
  if (/data-region=/.test(cfg.contextHtml ?? "")) {
    throw new Error(`${e.slide}: figure already has regions; git checkout the lesson.json and re-run`)
  }
  cfg.contextHtml = e.build(cfg.contextHtml)
  cfg.prompt = e.prompt
  // Keep the authored tile ids and success text; only the slots move onto
  // the figure.
  const byId = Object.fromEntries((cfg.slots ?? []).map(x => [x.id, x]))
  cfg.slots = e.slots.map(sl => ({ ...byId[sl.id], ...sl }))
  for (const sl of cfg.slots) {
    if (!cfg.contextHtml.includes(`data-region='${sl.region}'`)) {
      throw new Error(`${e.slide}: slot region "${sl.region}" is not in the figure`)
    }
    if (!(cfg.labels ?? []).some(l => l.id === sl.correctLabelId)) {
      throw new Error(`${e.slide}: slot "${sl.id}" points at a missing tile`)
    }
  }
  fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
  JSON.parse(fs.readFileSync(p, "utf8"))
  console.log(`${e.lesson} ${e.slide}: placeLabel slots moved onto the figure`)
}

console.log(`\n${EDITS.length} slides converted to tapDiagram, ${LABEL_EDITS.length} placeLabel slides moved onto the figure`)
