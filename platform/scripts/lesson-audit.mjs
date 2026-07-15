#!/usr/bin/env node
/**
 * Lesson Mode content audit.
 *
 *   npm run lesson:audit             audit every content/lessons/<id>/lesson.json
 *   npm run lesson:audit -- 07-01    audit one lesson
 *
 * Encodes the authoring invariants from the 07-01 build so every future
 * topic starts with the guard rails installed. ERRORS fail the run (exit 1);
 * WARNINGS are printed but do not fail.
 *
 * Invariants checked:
 *   structure    ids unique, kinds valid, chapters contiguous and complete
 *   help         hint on every interaction except verify (exam conditions:
 *                no hint allowed there) and stepThrough (next is always live)
 *   MCQs         exactly one correct option, whyWrong on every wrong option,
 *                correct answers spread across positions
 *   builders     every part has exactly one correct option + whyWrong
 *   grids        clickOnGrid targets and scene geometry inside the ranges
 *   diagrams     contextHtml polygons inside the 480x320 plot bounds
 *   widgets      referenced widget files exist; stepThrough URLs carry
 *                lessonMode=1 and extChrome=1 and the file supports it;
 *                widgetCanvas src must not hardcode params the component adds
 *   language     no em dashes, no shouty caps, no fragment chains, balanced
 *                $...$ delimiters, Cambridge-as-authority phrasing (warning)
 */

import fs from "node:fs"
import path from "node:path"

const ROOT = path.join(import.meta.dirname, "..")
const LESSONS_DIR = path.join(ROOT, "content", "lessons")
const WIDGETS_DIR = path.join(ROOT, "public", "widgets")

const SLIDE_KINDS = new Set(["hook", "concept", "interaction", "verify", "recap", "examLink"])
const INTERACTION_KINDS = new Set([
  "clickToIdentify", "dragToPosition", "manipulateAndVerify", "selectFromOptions",
  "placeLabel", "orderSteps", "adjustSlider", "widgetCanvas", "clickOnGrid",
  "answerBuilder", "stepThrough", "stepSolve", "markScript",
])
// Interactions whose hint requirement is waived (see header).
const NO_HINT_REQUIRED = new Set(["stepThrough"])
// Whole-word caps that read as shouting in student-facing prose.
const CAPS_RE = /\b(LEFT|RIGHT|UP|DOWN|AND|NOT|BOTH|SAME|MUST|NEVER|ALWAYS)\b/
// Plot bounds of the standard 480x320 manipulative canvas (28px/unit).
const PLOT = { x0: 16, x1: 464, y0: 20, y1: 300 }

// ── collect targets ──────────────────────────────────────────────────────
const only = process.argv[2]
const lessonIds = fs.existsSync(LESSONS_DIR)
  ? fs.readdirSync(LESSONS_DIR).filter(d => fs.existsSync(path.join(LESSONS_DIR, d, "lesson.json")))
  : []
const targets = only ? lessonIds.filter(id => id === only) : lessonIds
if (targets.length === 0) {
  console.error(only ? `No lesson found for "${only}"` : "No lessons found")
  process.exit(1)
}

let totalErrors = 0
let totalWarnings = 0

for (const lessonId of targets) {
  const errors = []
  const warnings = []
  const err = (m) => errors.push(m)
  const warn = (m) => warnings.push(m)

  const file = path.join(LESSONS_DIR, lessonId, "lesson.json")
  let L
  try {
    L = JSON.parse(fs.readFileSync(file, "utf8"))
  } catch (e) {
    console.error(`\n■ ${lessonId}: lesson.json does not parse: ${e.message}`)
    totalErrors++
    continue
  }

  // ── lesson-level structure ─────────────────────────────────────────────
  if (!L.lessonId) err("lesson: missing lessonId")
  if (!L.source?.unit || !L.source?.topic) err("lesson: missing source.unit/topic")
  if (!L.title) err("lesson: missing title")
  if (!Array.isArray(L.slides) || L.slides.length === 0) {
    err("lesson: no slides")
    report(lessonId, errors, warnings)
    continue
  }
  if (!L.estimatedMinutes) warn("lesson: missing estimatedMinutes")

  const seenIds = new Set()
  for (const s of L.slides) {
    if (!s.id) err("slide with no id")
    else if (seenIds.has(s.id)) err(`${s.id}: duplicate slide id`)
    seenIds.add(s.id)
    if (!SLIDE_KINDS.has(s.kind)) err(`${s.id}: unknown kind "${s.kind}"`)
    if (s.advance === undefined) err(`${s.id}: missing advance`)
    if (s.marks !== undefined && (!Number.isInteger(s.marks) || s.marks <= 0)) err(`${s.id}: marks must be a positive integer`)
  }

  // ── chapters: every slide tagged, ids valid, blocks contiguous ─────────
  if (L.chapters?.length) {
    const chapterIds = new Set(L.chapters.map(c => c.id))
    let prevChapter = null
    const closed = new Set()
    for (const s of L.slides) {
      if (!s.chapter) { err(`${s.id}: missing chapter tag`); continue }
      if (!chapterIds.has(s.chapter)) err(`${s.id}: chapter "${s.chapter}" not in lesson.chapters`)
      if (s.chapter !== prevChapter) {
        if (closed.has(s.chapter)) err(`${s.id}: chapter "${s.chapter}" is non-contiguous (chapter bar assumes blocks)`)
        if (prevChapter) closed.add(prevChapter)
        prevChapter = s.chapter
      }
    }
    for (const c of L.chapters) {
      if (!L.slides.some(s => s.chapter === c.id)) warn(`chapter "${c.id}" has no slides`)
    }
  } else {
    warn("lesson has no chapters (progress falls back to a plain bar)")
  }

  // ── per-slide interaction checks ───────────────────────────────────────
  const mcqPositions = {}
  for (const s of L.slides) {
    const i = s.interaction
    if ((s.kind === "interaction" || s.kind === "verify") && !i) err(`${s.id}: ${s.kind} slide without interaction`)
    if (!i) continue

    if (!INTERACTION_KINDS.has(i.kind)) { err(`${s.id}: unknown interaction kind "${i.kind}"`); continue }

    // help rules
    if (s.kind === "verify" && i.hint) err(`${s.id}: verify slides run exam conditions; remove the hint`)
    if (s.kind !== "verify" && !NO_HINT_REQUIRED.has(i.kind) && !i.hint) err(`${s.id}: interaction missing hint`)

    const c = i.config ?? {}

    if (i.kind === "selectFromOptions") {
      const opts = c.options ?? []
      if (opts.length < 2) err(`${s.id}: MCQ needs at least 2 options`)
      const correct = opts.filter(o => o.isCorrect)
      if (correct.length !== 1) err(`${s.id}: MCQ has ${correct.length} correct options (needs exactly 1)`)
      for (const o of opts) if (!o.isCorrect && !o.whyWrong) err(`${s.id}: option "${o.id}" missing whyWrong`)
      const idx = opts.findIndex(o => o.isCorrect)
      if (idx >= 0) mcqPositions[idx] = (mcqPositions[idx] ?? 0) + 1
    }

    if (i.kind === "answerBuilder") {
      const parts = c.parts ?? []
      if (parts.length === 0) err(`${s.id}: answerBuilder has no parts`)
      for (const p of parts) {
        const correct = (p.options ?? []).filter(o => o.isCorrect)
        if (correct.length !== 1) err(`${s.id}/${p.id}: ${correct.length} correct options (needs exactly 1)`)
        for (const o of p.options ?? []) if (!o.isCorrect && !o.whyWrong) err(`${s.id}/${p.id}: option "${o.id}" missing whyWrong`)
        if (!p.label) err(`${s.id}/${p.id}: part missing label`)
      }
      if (c.revealSvgInside && !c.contextHtml) err(`${s.id}: revealSvgInside without contextHtml`)
    }

    if (i.kind === "stepSolve") {
      const lines = c.lines ?? []
      if (lines.length === 0) err(`${s.id}: stepSolve has no lines`)
      for (const ln of lines) {
        if (!ln.label) err(`${s.id}/${ln.id}: line missing label`)
        if (ln.kind === "pick") {
          const correct = (ln.options ?? []).filter(o => o.isCorrect)
          if (correct.length !== 1) err(`${s.id}/${ln.id}: ${correct.length} correct options (needs exactly 1)`)
          for (const o of ln.options ?? []) if (!o.isCorrect && !o.whyWrong) err(`${s.id}/${ln.id}: option "${o.id}" missing whyWrong`)
        } else if (ln.kind === "numeric") {
          if (typeof ln.answer !== "number" || !Number.isFinite(ln.answer)) err(`${s.id}/${ln.id}: numeric line missing answer`)
          if (typeof ln.display !== "string" || !ln.display.includes("{v}")) err(`${s.id}/${ln.id}: numeric display must contain {v}`)
          if (s.kind !== "verify" && !ln.nudge) warn(`${s.id}/${ln.id}: numeric line has no nudge (student stuck after 2 wrong tries gets nothing)`)
        } else {
          err(`${s.id}/${ln.id}: unknown line kind "${ln.kind}"`)
        }
      }
    }

    if (i.kind === "markScript") {
      const script = c.script ?? []
      const judgments = c.judgments ?? []
      if (script.length < 2) err(`${s.id}: markScript needs at least 2 script lines`)
      if (judgments.length === 0) err(`${s.id}: markScript has no judgments`)
      for (const j of judgments) {
        for (const k of ["code", "label", "explain", "whyWrong"]) {
          if (!j[k]) err(`${s.id}/${j.id}: judgment missing ${k}`)
        }
        if (typeof j.award !== "boolean") err(`${s.id}/${j.id}: judgment missing award verdict`)
      }
      const anyWithheld = judgments.some(j => j.award === false)
      if (anyWithheld) {
        if (!c.faultLineId) err(`${s.id}: a mark is withheld but no faultLineId is set`)
        else if (!script.some(l => l.id === c.faultLineId)) err(`${s.id}: faultLineId "${c.faultLineId}" not in script`)
        if (!c.faultExplain) warn(`${s.id}: withheld mark has no faultExplain`)
      } else if (c.faultLineId) {
        err(`${s.id}: faultLineId set but every mark is awarded`)
      }
    }

    if (i.kind === "clickOnGrid") {
      const [xMin, xMax] = c.xRange ?? [NaN, NaN]
      const [yMin, yMax] = c.yRange ?? [NaN, NaN]
      const inR = (x, y) => x >= xMin && x <= xMax && y >= yMin && y <= yMax
      if (!c.target || !inR(c.target.x, c.target.y)) err(`${s.id}: clickOnGrid target missing or off-grid`)
      for (const p of c.scene?.points ?? []) if (!inR(p.x, p.y)) err(`${s.id}: scene point (${p.x}, ${p.y}) off-grid`)
      for (const l of c.scene?.lines ?? []) {
        if (!inR(l.from[0], l.from[1]) || !inR(l.to[0], l.to[1])) err(`${s.id}: scene line off-grid`)
      }
    }

    if (i.kind === "widgetCanvas") {
      checkWidgetFile(s.id, c.src, err)
      if (/[?&](lessonMode|target|noOutline)=/.test(c.src ?? "")) {
        err(`${s.id}: widgetCanvas src hardcodes params the component adds (use config fields)`)
      }
      if (!c.target) warn(`${s.id}: widgetCanvas without target (no way to complete except manual advance)`)
    }

    if (i.kind === "stepThrough") {
      if (!c.title) err(`${s.id}: stepThrough missing title`)
      if (!/[?&]lessonMode=1\b/.test(c.src ?? "")) err(`${s.id}: stepThrough src missing lessonMode=1`)
      if (!/[?&]extChrome=1\b/.test(c.src ?? "")) err(`${s.id}: stepThrough src missing extChrome=1`)
      const widgetPath = checkWidgetFile(s.id, c.src, err)
      if (widgetPath && fs.existsSync(widgetPath)) {
        const html = fs.readFileSync(widgetPath, "utf8")
        if (!html.includes("pl-step-state")) err(`${s.id}: widget ${path.basename(widgetPath)} lacks the extChrome step protocol`)
      }
      if (s.advance !== "onSuccess") err(`${s.id}: stepThrough must be advance:"onSuccess" (walkthroughs must not be skippable)`)
    }

    // contextHtml geometry: polygons inside plot bounds, single closing svg
    const ctx = c.contextHtml
    if (typeof ctx === "string") {
      if ((ctx.match(/<\/svg>/g) ?? []).length !== 1) err(`${s.id}: contextHtml must contain exactly one </svg>`)
      for (const m of ctx.matchAll(/points=.([0-9., -]+)./g)) {
        for (const pair of m[1].trim().split(/\s+/)) {
          const [px, py] = pair.split(",").map(Number)
          if (px < PLOT.x0 || px > PLOT.x1 || py < PLOT.y0 || py > PLOT.y1) {
            err(`${s.id}: contextHtml polygon point ${pair} outside plot bounds`)
          }
        }
      }
    }
  }

  // visual iframes must point at real widget files
  for (const s of L.slides) {
    const visuals = []
    if (s.visual) visuals.push(s.visual)
    if (s.visual?.children) visuals.push(...s.visual.children)
    for (const v of visuals) if (v?.kind === "iframe") checkWidgetFile(s.id, v.src, err)
  }

  // MCQ position spread: elimination-proof answers require variety
  {
    const counts = Object.values(mcqPositions)
    const total = counts.reduce((a, b) => a + b, 0)
    const max = Math.max(0, ...counts)
    if (total >= 4 && max / total > 0.5) warn(`MCQ correct answers cluster on one position (${max}/${total}); run the shuffle`)
  }

  // ── language sweep over every student-visible string ───────────────────
  for (const s of L.slides) {
    for (const [label, v] of studentStrings(s)) {
      if (v.includes("—")) err(`${s.id} ${label}: em dash`)
      if (CAPS_RE.test(v)) err(`${s.id} ${label}: shouty caps: "${v.slice(0, 60)}"`)
      if ((v.match(/\$/g) ?? []).length % 2 !== 0) err(`${s.id} ${label}: unbalanced $ delimiters`)
      const sents = v.split(/(?<=[.?!])\s+/).filter(Boolean)
      for (let j = 0; j + 2 < sents.length; j++) {
        if (sents[j].length < 25 && sents[j + 1].length < 25 && sents[j + 2].length < 25) {
          err(`${s.id} ${label}: fragment chain: "${v.slice(0, 60)}"`)
          break
        }
      }
      // Cambridge-as-authority (paper attributions like "Cambridge Winter 2025" are fine)
      if (/\bCambridge\b/.test(v) && !/Cambridge\s+(Summer|Winter|[sw]\d\d)/.test(v)) {
        warn(`${s.id} ${label}: check Cambridge-as-authority phrasing: "${v.slice(0, 60)}"`)
      }
    }
  }

  report(lessonId, errors, warnings, L)
  totalErrors += errors.length
  totalWarnings += warnings.length
}

console.log()
if (totalErrors > 0) {
  console.log(`✗ ${totalErrors} error(s), ${totalWarnings} warning(s)`)
  process.exit(1)
}
console.log(`✓ all lessons clean (${totalWarnings} warning(s))`)

// ── helpers ──────────────────────────────────────────────────────────────

function checkWidgetFile(slideId, src, err) {
  if (typeof src !== "string") { err(`${slideId}: missing src`); return null }
  const m = src.match(/^\/widgets\/([A-Za-z0-9_-]+\.html)/)
  if (!m) { err(`${slideId}: src "${src.slice(0, 50)}" is not a /widgets/*.html URL`); return null }
  const p = path.join(WIDGETS_DIR, m[1])
  if (!fs.existsSync(p)) err(`${slideId}: widget file missing: ${m[1]}`)
  return p
}

/** Every string a student can read on a slide, labelled. */
function* studentStrings(s) {
  if (s.title) yield ["title", s.title]
  if (s.prompt) yield ["prompt", s.prompt]
  if (s.altExplain?.prompt) yield ["altExplain", s.altExplain.prompt]
  for (const b of s.bullets ?? []) yield ["bullet", b]
  const i = s.interaction
  if (!i) return
  if (i.hint) yield ["hint", i.hint]
  const c = i.config ?? {}
  for (const k of ["prompt", "successText", "taskText", "title", "goalLabel"]) {
    if (typeof c[k] === "string") yield [k, c[k]]
  }
  for (const o of c.options ?? []) {
    if (o.text) yield [`option ${o.id}`, o.text]
    if (o.whyWrong) yield [`whyWrong ${o.id}`, o.whyWrong]
  }
  for (const p of c.parts ?? []) {
    if (p.label) yield [`part ${p.id}`, p.label]
    for (const o of p.options ?? []) {
      if (o.text) yield [`option ${p.id}/${o.id}`, o.text]
      if (o.whyWrong) yield [`whyWrong ${p.id}/${o.id}`, o.whyWrong]
    }
  }
  for (const st of c.steps ?? []) if (st.text) yield [`step ${st.id}`, st.text]
  if (c.question) yield ["question", c.question]
  if (c.faultExplain) yield ["faultExplain", c.faultExplain]
  for (const j of c.judgments ?? []) {
    if (j.label) yield [`judgment ${j.id}`, j.label]
    if (j.explain) yield [`explain ${j.id}`, j.explain]
    if (j.whyWrong) yield [`whyWrong ${j.id}`, j.whyWrong]
  }
  for (const ln of c.lines ?? []) {
    if (ln.label) yield [`line ${ln.id}`, ln.label]
    if (ln.nudge) yield [`nudge ${ln.id}`, ln.nudge]
    for (const o of ln.options ?? []) {
      if (o.text) yield [`option ${ln.id}/${o.id}`, o.text]
      if (o.whyWrong) yield [`whyWrong ${ln.id}/${o.id}`, o.whyWrong]
    }
  }
  for (const sl of c.slots ?? []) if (sl.hint) yield [`slot ${sl.id}`, sl.hint]
  for (const lb of c.labels ?? []) if (lb.text) yield [`label ${lb.id}`, lb.text]
}

function report(lessonId, errors, warnings, L) {
  const marks = L ? L.slides.reduce((a, s) => a + (s.marks ?? 0), 0) : 0
  const doing = L ? L.slides.filter(s => s.interaction).length : 0
  const pct = L ? Math.round((100 * doing) / L.slides.length) : 0
  console.log(`\n■ ${lessonId}: ${L ? L.slides.length : "?"} slides · ${marks} marks · ${pct}% interactive`)
  if (L && pct < 60) warnings.push(`interactive ratio ${pct}% is below the 60% bar`)
  for (const e of errors) console.log(`  ERROR   ${e}`)
  for (const w of warnings) console.log(`  warning ${w}`)
  if (errors.length === 0 && warnings.length === 0) console.log("  clean")
}
