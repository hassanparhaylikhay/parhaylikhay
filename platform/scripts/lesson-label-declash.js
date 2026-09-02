#!/usr/bin/env node
/**
 * Push figure labels off the lines they sit on.
 *
 * KaTeX labels are wider than the SVG text they replaced, so a side name
 * positioned for mono can now straddle the line it names ("hypotenuse"
 * lying across the hypotenuse). This slides each offending label along the
 * perpendicular, away from the line, until its box is clear.
 *
 * Pipeline: given-find → cards → katex-labels → declash.
 * Run: node scripts/lesson-label-declash.js
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")
const CLEAR = 7          // units of daylight to leave between label and line
const MAX_PUSH = 34      // never shove a label so far it stops naming its side

// ── boxes (same estimate as lesson-label-overlaps.js) ────────────────────
function box(l) {
  const size = l.size ?? 14
  const src = l.tex ?? l.text ?? ""
  const frac = /\\dfrac|\\frac/.test(src)
  const visible = src
    .replace(/\\(?:dfrac|frac|text|mathrm|textcolor|left|right)/g, "")
    .replace(/\\[a-zA-Z]+/g, "x")
    .replace(/[{}$\\]/g, "")
  const chars = frac ? Math.max(...visible.split(/[^\w., ]/).map(p => p.length), 3) : visible.length
  const w = Math.max(size * 0.62, chars * size * 0.52)
  const h = frac ? size * 2.4 : size * 1.25
  const ax = l.anchor === "start" ? 0 : l.anchor === "end" ? -1 : -0.5
  return { x0: l.x + ax * w, x1: l.x + ax * w + w, y0: l.y - h / 2, y1: l.y + h / 2, w, h }
}

function shapeSegments(svg) {
  const segs = []
  for (const m of String(svg).matchAll(/<polygon[^>]*points='([^']+)'/g)) {
    const pts = m[1].trim().split(/\s+/).map(p => p.split(",").map(Number))
    for (let i = 0; i < pts.length; i++) segs.push([pts[i], pts[(i + 1) % pts.length]])
  }
  for (const m of String(svg).matchAll(/<line\b[^>]*\/?>/g)) {
    if (/#141e2a|#3a4a5a/.test(m[0])) continue          // grid and axes are reference lines
    const at = n => { const r = m[0].match(new RegExp(`${n}='([\\d.-]+)'`)); return r ? +r[1] : null }
    const v = ["x1", "y1", "x2", "y2"].map(at)
    if (v.some(x => x === null)) continue
    segs.push([[v[0], v[1]], [v[2], v[3]]])
  }
  return segs
}

function segHitsBox(seg, b) {
  const [[x1, y1], [x2, y2]] = seg
  const inside = (x, y) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1
  if (inside(x1, y1) || inside(x2, y2)) return true
  const edges = [
    [[b.x0, b.y0], [b.x1, b.y0]], [[b.x1, b.y0], [b.x1, b.y1]],
    [[b.x1, b.y1], [b.x0, b.y1]], [[b.x0, b.y1], [b.x0, b.y0]],
  ]
  const cross = (o, a, bb) => (a[0] - o[0]) * (bb[1] - o[1]) - (a[1] - o[1]) * (bb[0] - o[0])
  for (const [p, q] of edges) {
    const d1 = cross(p, q, [x1, y1]), d2 = cross(p, q, [x2, y2])
    const d3 = cross([x1, y1], [x2, y2], p), d4 = cross([x1, y1], [x2, y2], q)
    if (((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0))) return true
  }
  return false
}

/** Signed perpendicular distance from a point to a segment's infinite line. */
function signedDist(p, [a, b]) {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const L = Math.hypot(dx, dy) || 1
  return ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / L
}

let moved = 0, skipped = 0
for (const id of fs.readdirSync(LESSONS)) {
  const p = path.join(LESSONS, id, "lesson.json")
  if (!fs.existsSync(p)) continue
  const L = JSON.parse(fs.readFileSync(p, "utf8"))

  const targets = []
  const visuals = (v, out = []) => {
    if (!v) return out
    if (v.kind === "html" && v.labels) out.push(v)
    for (const c of v.children ?? []) visuals(c, out)
    return out
  }
  for (const s of L.slides) {
    const c = s.interaction?.config
    if (c?.figureLabels?.length && c.contextHtml) targets.push([s.id, c.figureLabels, c.contextHtml])
    for (const v of visuals(s.visual)) targets.push([`${s.id} (visual)`, v.labels, v.content])
  }

  const boxOverlap = (a, b) => {
    const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
    const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
    return ox > 0 && oy > 0 ? Math.min(ox, oy) : 0
  }

  let touched = 0
  for (const [where, labels, svg] of targets) {
    const segs = shapeSegments(svg)
    if (!segs.length) continue
    for (const l of labels) {
      let b = box(l)
      const hits = segs.filter(sg => segHitsBox(sg, b))
      if (!hits.length) continue
      // Push away from the nearest offending line, on the side the label is
      // already on, so it moves outward instead of through the shape.
      const seg = hits.reduce((best, sg) =>
        Math.abs(signedDist([l.x, l.y], sg)) < Math.abs(signedDist([l.x, l.y], best)) ? sg : best)
      const d = signedDist([l.x, l.y], seg)
      if (Math.abs(d) < 2) { skipped++; continue }   // sitting on the line: direction is ambiguous
      const dx = seg[1][0] - seg[0][0], dy = seg[1][1] - seg[0][1]
      const Ln = Math.hypot(dx, dy) || 1
      const n = [(dy / Ln) * Math.sign(d), (-dx / Ln) * Math.sign(d)]
      // how far to go: half the box along the normal, plus daylight
      const reach = Math.abs(n[0]) * (b.w / 2) + Math.abs(n[1]) * (b.h / 2)
      const push = Math.min(MAX_PUSH, reach + CLEAR - Math.abs(d))
      if (push <= 0) { skipped++; continue }
      // Try the natural direction, then the opposite. Reject a move that
      // solves a line collision by creating a label collision: pushing a
      // caption off a shape edge and straight into the tick numbers is not
      // an improvement.
      const others = labels.filter(o => o !== l).map(box)
      const clashesNow = others.filter(o => boxOverlap(b, o) > 3).length
      let placed = false
      for (const dir of [1, -1]) {
        const nx = Math.round((l.x + dir * n[0] * push) * 10) / 10
        const ny = Math.round((l.y + dir * n[1] * push) * 10) / 10
        if (nx < 6 || nx > 474 || ny < 8 || ny > 312) continue      // would leave the canvas
        const trial = box({ ...l, x: nx, y: ny })
        if (others.some(o => boxOverlap(trial, o) > 3) && clashesNow === 0) continue
        if (segs.some(sg => segHitsBox(sg, trial))) continue
        l.x = nx; l.y = ny
        placed = true
        break
      }
      if (!placed) { skipped++; continue }
      moved++; touched++
    }
  }
  if (touched) {
    fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
    JSON.parse(fs.readFileSync(p, "utf8"))
    console.log(`${id}: ${touched} label(s) pushed clear`)
  }
}
console.log(`\n${moved} label(s) moved, ${skipped} left alone`)
