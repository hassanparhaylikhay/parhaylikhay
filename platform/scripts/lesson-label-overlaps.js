#!/usr/bin/env node
/**
 * Find figure labels that collide.
 *
 * KaTeX labels are wider and (for a fraction) much taller than the SVG text
 * they replaced, so positions that were clear before can now overlap. This
 * estimates each label's box and reports every overlapping pair.
 *
 * Run: node scripts/lesson-label-overlaps.js
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")

/**
 * Rough box for a label, in figure units. KaTeX widths cannot be measured
 * without a browser, so this errs on the generous side: better to look at a
 * pair that turns out fine than to miss a real collision.
 */
function box(l) {
  const size = l.size ?? 14
  const src = l.tex ?? l.text ?? ""
  const frac = /\\dfrac|\\frac/.test(src)
  // strip TeX control words and braces to count visible characters
  const visible = src
    .replace(/\\(?:dfrac|frac|text|mathrm|textcolor|left|right)/g, "")
    .replace(/\\[a-zA-Z]+/g, "x")
    .replace(/[{}$\\]/g, "")
  let chars = visible.length
  if (frac) {
    // a fraction stacks, so the width is the longer of the two halves
    const parts = visible.split(/(?<=\S)\s*(?=\S)/)
    chars = Math.max(...visible.split(/[^\w., ]/).map(p => p.length), 3)
  }
  const w = Math.max(size * 0.62, chars * size * 0.52)
  const h = frac ? size * 2.4 : size * 1.25
  const ax = l.anchor === "start" ? 0 : l.anchor === "end" ? -1 : -0.5
  return { x0: l.x + ax * w, x1: l.x + ax * w + w, y0: l.y - h / 2, y1: l.y + h / 2, w, h }
}

const overlap = (a, b) => {
  const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const oy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return ox > 0 && oy > 0 ? Math.min(ox, oy) : 0
}

const label = l => JSON.stringify(l.tex ?? l.text ?? "")

/** Every straight segment drawn in the figure: polygon edges and lines. */
function segments(svg) {
  const segs = []
  for (const m of String(svg).matchAll(/<polygon[^>]*points='([^']+)'/g)) {
    const pts = m[1].trim().split(/\s+/).map(p => p.split(",").map(Number))
    for (let i = 0; i < pts.length; i++) segs.push([pts[i], pts[(i + 1) % pts.length]])
  }
  // Match the WHOLE tag: matching only as far as y2 left the stroke colour
  // outside the match, so the reference-line filter never fired.
  for (const m of String(svg).matchAll(/<line\b[^>]*\/?>/g)) {
    // Grid and axes are reference lines. Tick numbers are MEANT to sit
    // against them, so only shape edges count as a collision.
    if (/#141e2a|#3a4a5a/.test(m[0])) continue
    const at = n => { const r = m[0].match(new RegExp(`${n}='([\\d.-]+)'`)); return r ? +r[1] : null }
    const x1 = at("x1"), y1 = at("y1"), x2 = at("x2"), y2 = at("y2")
    if ([x1, y1, x2, y2].some(v => v === null)) continue
    segs.push([[x1, y1], [x2, y2]])
  }
  return segs
}

/** Does a segment cross the interior of a box? */
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

let pairs = 0, figures = 0
for (const id of fs.readdirSync(LESSONS)) {
  const p = path.join(LESSONS, id, "lesson.json")
  if (!fs.existsSync(p)) continue
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  const seen = []
  const collect = (where, labels) => { if (labels?.length) seen.push([where, labels]) }
  const visuals = (v, out = []) => {
    if (!v) return out
    if (v.kind === "html" && v.labels) out.push(v)
    for (const c of v.children ?? []) visuals(c, out)
    return out
  }
  const svgOf = new Map()
  for (const s of L.slides) {
    const c = s.interaction?.config
    if (c?.figureLabels?.length) { collect(`${s.id}`, c.figureLabels); svgOf.set(`${s.id}`, c.contextHtml) }
    for (const v of visuals(s.visual)) { collect(`${s.id} (visual)`, v.labels); svgOf.set(`${s.id} (visual)`, v.content) }
  }
  for (const [where, labels] of seen) {
    const boxes = labels.map(box)
    let hit = false
    // a label sitting on a drawn line is just as unreadable as one sitting
    // on another label
    const segs = segments(svgOf.get(where) ?? "")
    for (let i = 0; i < labels.length; i++) {
      if (segs.some(sg => segHitsBox(sg, boxes[i]))) {
        if (!hit) { console.log(`\n■ ${id} ${where}`); hit = true; figures++ }
        console.log(`   ${label(labels[i])} at (${labels[i].x},${labels[i].y})   sits ON a drawn line`)
        pairs++
      }
    }
    for (let i = 0; i < labels.length; i++) {
      for (let j = i + 1; j < labels.length; j++) {
        const d = overlap(boxes[i], boxes[j])
        if (d > 3) {
          if (!hit) { console.log(`\n■ ${id} ${where}`); hit = true; figures++ }
          console.log(`   ${label(labels[i])} at (${labels[i].x},${labels[i].y})  x  ${label(labels[j])} at (${labels[j].x},${labels[j].y})   overlap ${d.toFixed(1)}`)
          pairs++
        }
      }
    }
  }
}
console.log(`\n${pairs} overlapping pair(s) across ${figures} figure(s)`)
