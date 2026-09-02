#!/usr/bin/env node
/**
 * Move every math label out of the figure SVGs and into KaTeX.
 *
 * Hassan, September 2026: "The fonts here aren't math friendly. I require you
 * to completely change this particular font used here in this diagram (and
 * many others across lesson mode) into Katex. Also NO INLINE Math style like
 * the forward slash for divide, it should be proper."
 *
 * Labels cannot be KaTeX INSIDE the SVG, because iOS Safari places
 * <foreignObject> content at unscaled CSS coordinates and the labels drift.
 * So each `<text>` is lifted out of the SVG into a `figureLabels` array on the
 * interaction config, and the components render them as real DOM positioned
 * over the figure, scaled with container query units.
 *
 * Words stay words: a label like "adjacent" or "side 1" is not maths and is
 * rendered in the UI face, not in KaTeX italics.
 *
 * Run: node scripts/lesson-katex-labels.js
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")

const UNITS = ["cm", "mm", "km", "m"]
const FUNCS = ["sin", "cos", "tan"]

/**
 * Decide whether a label is maths or a phrase, and convert maths to TeX.
 * Rule: a run of three or more letters that is not a unit and not a trig
 * function means the label is prose ("adjacent", "side 1", "horizontal
 * distance"). Everything else is maths.
 */
function decode(s) {
  return s
    .replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
}

function convert(raw) {
  const s = decode(raw).replace(/\s+/g, " ").trim()
  if (!s) return null

  const words = s.match(/[A-Za-z]{3,}/g) ?? []
  const prose = words.some(w => !UNITS.includes(w) && !FUNCS.includes(w.toLowerCase()))
  if (prose) {
    // A phrase can still contain maths ("side 1 (k = 1/2)"). Wrap those bits
    // in $...$ so the component renders them through KaTeX and the rest in
    // the UI face.
    const mixed = s
      .replace(/½/g, "$\\tfrac{1}{2}$")
      .replace(/(\d+(?:\.\d+)?)\s*°/g, "$$$1^\\circ$")
    return { text: mixed }
  }

  let t = s
  t = t.replace(/θ/g, "\\theta")
  t = t.replace(/π/g, "\\pi")
  t = t.replace(/²/g, "^{2}").replace(/³/g, "^{3}")
  t = t.replace(/°/g, "^\\circ")
  t = t.replace(/×/g, "\\times").replace(/÷/g, "\\div")
  t = t.replace(/−/g, "-")
  t = t.replace(/√/g, "\\surd ")
  for (const u of UNITS) t = t.replace(new RegExp(`(\\d)\\s*\\b${u}\\b`, "g"), `$1\\,\\text{${u}}`)
  for (const fn of FUNCS) t = t.replace(new RegExp(`\\b${fn}\\b`, "g"), `\\${fn}`)
  return { tex: t }
}

/**
 * Character ranges of <g> groups that carry SMIL animation. A label inside
 * one of these is riding a morph (a corner letter travelling with the shape),
 * so it must stay in the SVG where the animation can move it.
 */
function animatedRanges(svg) {
  const ranges = []
  const stack = []
  const re = /<(\/?)g\b[^>]*?(\/?)>/g
  let m
  while ((m = re.exec(svg))) {
    const closing = m[1] === "/", selfClose = m[2] === "/"
    if (!closing && !selfClose) stack.push(m.index)
    else if (closing) {
      const start = stack.pop()
      if (start !== undefined) ranges.push([start, re.lastIndex])
    }
  }
  return ranges.filter(([a, b]) => /<animate|<set\b/.test(svg.slice(a, b)))
}

/** Pull every static <text> out of an SVG string, returning svg + labels. */
function extract(svg) {
  const labels = []
  const frozen = animatedRanges(svg)
  let kept = 0
  const stripped = svg.replace(
    /<text\b([^>]*)>([\s\S]*?)<\/text>/g,
    (_m, attrs, body, offset) => {
      // leave anything the animation drives exactly where it is
      if (/<animate|<set\b/.test(body) || frozen.some(([a, b]) => offset >= a && offset < b)) {
        kept++
        return _m
      }
      const at = n => {
        const m = attrs.match(new RegExp(`${n}='([^']*)'`)) || attrs.match(new RegExp(`${n}="([^"]*)"`))
        return m ? m[1] : undefined
      }
      const content = body.replace(/<[^>]*>/g, "").trim()
      const conv = convert(content)
      if (!conv) return ""
      const anchorRaw = at("text-anchor")
      labels.push({
        x: Number(at("x") ?? 0),
        y: Number(at("y") ?? 0),
        ...conv,
        color: at("fill"),
        size: at("font-size") ? Number(at("font-size")) : undefined,
        anchor: anchorRaw === "start" ? "start" : anchorRaw === "end" ? "end" : undefined,
      })
      return ""
    },
  )
  // drop keys that are undefined so the JSON stays tidy
  return {
    svg: stripped,
    kept,
    labels: labels.map(l => Object.fromEntries(Object.entries(l).filter(([, v]) => v !== undefined))),
  }
}

/** Every html visual on a slide, including ones nested in stack/row. */
function htmlVisuals(v, out = []) {
  if (!v) return out
  if (v.kind === "html" && typeof v.content === "string") out.push(v)
  for (const c of v.children ?? []) htmlVisuals(c, out)
  return out
}

let files = 0, moved = 0, prose = 0, animKept = 0
for (const id of fs.readdirSync(LESSONS)) {
  const p = path.join(LESSONS, id, "lesson.json")
  if (!fs.existsSync(p)) continue
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  let touched = 0
  for (const s of L.slides) {
    const c = s.interaction?.config
    if (c?.contextHtml && /<text/.test(c.contextHtml)) {
      const { svg, labels, kept } = extract(c.contextHtml)
      animKept += kept
      if (labels.length) {
        c.contextHtml = svg
        // Generators may already have emitted their own labels (formula chips
        // written as proper fractions), so append rather than replace.
        c.figureLabels = [...(c.figureLabels ?? []), ...labels]
        moved += labels.length
        prose += labels.filter(l => l.text).length
        touched++
      }
    }
    // Concept-slide diagrams are figures too: same fonts, same rule.
    for (const v of htmlVisuals(s.visual)) {
      if (!/<text/.test(v.content)) continue
      const { svg, labels, kept } = extract(v.content)
      animKept += kept
      if (!labels.length) continue
      v.content = svg
      v.labels = [...(v.labels ?? []), ...labels]
      moved += labels.length
      prose += labels.filter(l => l.text).length
      touched++
    }
  }
  if (touched) {
    fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
    JSON.parse(fs.readFileSync(p, "utf8"))
    console.log(`${id}: ${touched} figures, labels lifted to KaTeX`)
    files++
  }
}
console.log(`\n${moved} labels moved out of ${files} lesson files (${moved - prose} maths, ${prose} phrases)`)
if (animKept) console.log(`${animKept} labels left in the SVG because animation moves them`)
