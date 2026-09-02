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
 *                $...$ delimiters, Cambridge-as-authority phrasing (warning),
 *                no AI-essay voice (rhetorical antithesis, meta-commentary,
 *                inflated words), and a warning on any sentence too long or
 *                too subordinated to read in one pass
 */

import fs from "node:fs"
import path from "node:path"

const ROOT = path.join(import.meta.dirname, "..")
const LESSONS_DIR = path.join(ROOT, "content", "lessons")
const WIDGETS_DIR = path.join(ROOT, "public", "widgets")

const SLIDE_KINDS = new Set(["hook", "concept", "interaction", "verify", "recap", "examLink"])
const INTERACTION_KINDS = new Set([
  "tapDiagram", "clickToIdentify", "dragToPosition", "manipulateAndVerify", "selectFromOptions",
  "placeLabel", "orderSteps", "adjustSlider", "widgetCanvas", "clickOnGrid",
  "answerBuilder", "stepThrough", "stepSolve", "markScript",
])

/**
 * Words that name a part of a figure. When EVERY option of a diagram MCQ is
 * one of these, the student is being asked to name something they can point
 * at, and the answer belongs on the diagram (kind: tapDiagram), not in a
 * list. Flagged by Hassan, September 2026: picking "Side 2, up the left"
 * from a list makes the student translate the picture into prose and never
 * touch the picture.
 */
const FIGURE_PART_RE = /\b(side|angle|line|point|vertex|edge|arc|axis|mirror)\b/i
// Interactions whose hint requirement is waived (see header).
const NO_HINT_REQUIRED = new Set(["stepThrough", "stepSolve"])
// Whole-word caps that read as shouting in student-facing prose.
const CAPS_RE = /\b(LEFT|RIGHT|UP|DOWN|AND|NOT|BOTH|SAME|MUST|NEVER|ALWAYS)\b/

/**
 * AI-essay voice. Hassan's rule: plain textbook English, one idea per
 * sentence, no rhetorical shapes. These patterns are the mechanical tells;
 * each one has a plain replacement, so they are errors, not warnings.
 */
const AI_VOICE = [
  ["rhetorical antithesis", /\b(?:it|this|that|they)'?(?:s| is| are|re)\s+not\s+just\b/i],
  ["rhetorical antithesis", /\bnot\s+just\s+[^.!?;]{2,50}?\s+but\b/i],
  ["rhetorical antithesis", /\bless\s+(?:a|about)\b[^.!?]{2,60}\bthan\s+(?:a|about)\b/i],
  ["meta-commentary", /\bhere'?s\s+the\s+(?:thing|catch|key|trick|clever\s+bit)\b/i],
  ["meta-commentary", /\bthe\s+(?:key|real|core)\s+insight\b/i],
  ["meta-commentary", /\bwhat'?s\s+(?:really|actually)\s+(?:happening|going\s+on)\b/i],
  ["meta-commentary", /\bat\s+its\s+(?:core|heart)\b|\bin\s+essence\b/i],
  ["meta-commentary", /\bthis\s+is\s+where\s+it\s+gets\b/i],
  ["meta-commentary", /\bthe\s+(?:beauty|magic|elegance)\s+of\b/i],
  ["inflated word", /\b(?:delve|delves|leverage|leverages|nuanced|pivotal|seamless|seamlessly|underscore|underscores|testament|realm|realms|myriad|plethora|moreover|furthermore|additionally|intricate|holistic|paradigm|empowers?|harnesses?|fosters?|elevates?|profound|profoundly|cornerstone|multifaceted|underpins?)\b/i],
  ["hedge adverb", /\b(?:fundamentally|essentially|ultimately|arguably|crucially|inherently|invariably)\b/i],
  ["rhythm over clarity", /\bNo\s+\w+\.\s+No\s+\w+\./],
]
// Soft tell: teacher-ish enough to keep sometimes, worth a second look.
const AI_VOICE_SOFT = [
  ["framing", /\bthink\s+of\s+(?:it|this|them)\s+as\b/i],
  ["framing", /\bthat'?s\s+the\s+(?:whole\s+)?(?:point|magic|beauty)\b/i],
]
// Clause joints that make a sentence need a second read.
const SUBORD_RE = /\b(?:which|that|where|when|while|although|though|because|since|whereas|whether|unless|before|after|so that|such that|rather than|instead of)\b/gi
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
    if (s.altExplain?.prompt) err(`${s.id}: altExplain must be a demonstration (demoSvg), not re-worded prose`)
    if (i.kind === "stepSolve" && i.hint) err(`${s.id}: stepSolve help lives on lines (hint per line), not the interaction`)
    if (i.kind === "stepSolve" && s.altExplain) err(`${s.id}: stepSolve alt lives on lines (altDemo per line), not the slide`)
    // Multi-stage frames carry their help per stage, so they have no
    // slide-level hint to require.
    const multiStage = !!(i.config?.sequence)
    if (s.kind !== "verify" && !NO_HINT_REQUIRED.has(i.kind) && !multiStage && !i.hint) err(`${s.id}: interaction missing hint`)

    const c = i.config ?? {}

    if (i.kind === "selectFromOptions") {
      const opts = c.options ?? []
      if (opts.length < 2) err(`${s.id}: MCQ needs at least 2 options`)
      const correct = opts.filter(o => o.isCorrect)
      if (correct.length !== 1) err(`${s.id}: MCQ has ${correct.length} correct options (needs exactly 1)`)
      for (const o of opts) if (!o.isCorrect && !o.whyWrong) err(`${s.id}: option "${o.id}" missing whyWrong`)
      const idx = opts.findIndex(o => o.isCorrect)
      if (idx >= 0) mcqPositions[idx] = (mcqPositions[idx] ?? 0) + 1
      // If every option names a part of the accompanying figure, the answer
      // is a thing the student can point at, so it belongs on the figure.
      if (c.contextHtml && opts.length >= 2 && opts.every(o => FIGURE_PART_RE.test(o.text ?? ""))) {
        err(`${s.id}: every option names a part of the figure; use kind "tapDiagram" so the student taps the diagram instead of picking words`)
      }
    }

    if (i.kind === "placeLabel") {
      const slots = c.slots ?? []
      const onFigure = slots.length > 0 && slots.every(sl => sl.region)
      // Same principle as the MCQ rule above, one interaction kind over.
      // Slots named after parts of the drawing ("side 1", "side 2") must BE
      // those parts, or the student answers in the side panel and never
      // touches the drawing.
      if (c.contextHtml && !onFigure && slots.length >= 2 &&
          slots.every(sl => FIGURE_PART_RE.test(sl.hint ?? ""))) {
        err(`${s.id}: every slot names a part of the figure; give each slot a "region" + "labelAt" so the names drop onto the drawing`)
      }
      if (onFigure) {
        if (!c.contextHtml) err(`${s.id}: figure-mode placeLabel needs a contextHtml figure`)
        for (const sl of slots) {
          if (!String(c.contextHtml ?? "").includes(`data-region='${sl.region}'`)) {
            err(`${s.id}: slot "${sl.id}" targets region "${sl.region}", which is not in the figure`)
          }
          if (!Array.isArray(sl.labelAt) || sl.labelAt.length !== 2) {
            err(`${s.id}: slot "${sl.id}" needs labelAt [x, y] so the placed name has somewhere to sit`)
          }
        }
      }
    }

    // Every label on a figure renders through KaTeX, positioned over the
    // SVG. A raw <text> means maths drawn in the UI font, with a slash for a
    // divide instead of a fraction bar.
    if (c.contextHtml && /<text\b/.test(c.contextHtml)) {
      err(`${s.id}: figure still has SVG <text>; run scripts/lesson-katex-labels.js so labels render as KaTeX`)
    }
    for (const l of c.figureLabels ?? []) {
      if (!Number.isFinite(l.x) || !Number.isFinite(l.y)) err(`${s.id}: figure label has no position`)
      if (!l.tex && !l.text) err(`${s.id}: figure label has neither tex nor text`)
      if (l.tex && /[^\\]\//.test(l.tex)) err(`${s.id}: figure label "${l.tex}" uses a slash for a divide; use \\dfrac`)
    }

    if (i.kind === "tapDiagram") {
      const regions = c.regions ?? []
      const seq = c.sequence
      if (!c.contextHtml) err(`${s.id}: tapDiagram needs a contextHtml figure`)
      if (regions.length < 2) err(`${s.id}: tapDiagram needs at least 2 regions`)
      if (seq) {
        // given-then-find: the student marks several parts in order, so there
        // is no single correct region.
        if (seq.length < 2) err(`${s.id}: a tapDiagram sequence needs at least 2 stages`)
        for (const st of seq) {
          if (!regions.some(r => r.id === st.regionId)) err(`${s.id}: stage targets region "${st.regionId}", which is not declared`)
          if (!st.prompt) err(`${s.id}: stage "${st.regionId}" has no prompt`)
          // A stage may skip the tag when its target already reads as a
          // label (a formula chip), but tag and tagAt travel together.
          if (!!st.tag !== Array.isArray(st.tagAt)) err(`${s.id}: stage "${st.regionId}" needs tag AND tagAt, or neither`)
          if (st.tagAt && st.tagAt.length !== 2) err(`${s.id}: stage "${st.regionId}" tagAt must be [x, y]`)
          if (s.kind !== "verify" && !st.hint) err(`${s.id}: stage "${st.regionId}" needs a hint (multi-stage help lives on the stage)`)
        }
        // Help on a multi-stage frame belongs to the stage, never the slide,
        // or the chrome serves the wrong stage's hint.
        if (i.hint) err(`${s.id}: sequence tapDiagram must not carry a slide-level hint; put hints on each stage`)
        if (regions.some(r => r.isCorrect)) err(`${s.id}: sequence tapDiagram regions must not set isCorrect; the sequence decides order`)
      } else {
        const correct = regions.filter(r => r.isCorrect)
        if (correct.length !== 1) err(`${s.id}: tapDiagram has ${correct.length} correct regions (needs exactly 1)`)
      }
      for (const r of regions) {
        if (!seq && !r.isCorrect && !r.whyWrong) err(`${s.id}: region "${r.id}" missing whyWrong`)
        if (seq && !r.whyWrong) err(`${s.id}: region "${r.id}" missing whyWrong`)
        // Every declared region must actually be tappable in the figure, or
        // the student can never reach it.
        if (c.contextHtml && !c.contextHtml.includes(`data-region='${r.id}'`)) {
          err(`${s.id}: region "${r.id}" has no data-region group in the figure`)
        }
      }
      // Every tappable group in the figure must be declared, or a tap on it
      // silently does nothing.
      for (const m of String(c.contextHtml ?? "").matchAll(/data-region='([^']+)'/g)) {
        if (!regions.some(r => r.id === m[1])) err(`${s.id}: figure has an undeclared tappable region "${m[1]}"`)
      }
      if (c.contextHtml && !/pl-tap-hit/.test(c.contextHtml)) {
        err(`${s.id}: figure has no .pl-tap-hit targets; taps will be hard to land on a phone`)
      }
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
          // Help is stage-level in stepSolve: every pick line on a teaching
          // slide needs its own hint (numeric lines fall back to their nudge).
          if (s.kind !== "verify" && !ln.hint) err(`${s.id}/${ln.id}: pick line missing stage hint`)
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

  // ── demonstrations: well-formed, animated, no parse artefacts ──────────
  {
    const demos = []
    for (const s of L.slides) {
      if (s.altExplain?.demoSvg) demos.push([s.id, s.altExplain.demoSvg])
      for (const ln of s.interaction?.config?.lines ?? []) {
        if (ln.altDemo) demos.push([`${s.id}/${ln.id}`, ln.altDemo])
        if (ln.alt) err(`${s.id}/${ln.id}: line alt must be a demonstration (altDemo), not re-worded prose`)
      }
    }
    for (const [where, svg] of demos) {
      if (!svg.startsWith("<svg") || !svg.endsWith("</svg>")) err(`${where}: demo is not a complete <svg> document`)
      if ((svg.match(/<svg/g) ?? []).length !== 1) err(`${where}: demo must contain exactly one <svg>`)
      if (/NaN|undefined|Infinity/.test(svg)) err(`${where}: demo contains a bad coordinate (NaN/undefined)`)
      if (!/<animate|<animateMotion/.test(svg)) err(`${where}: demo has no animation; a demonstration must move`)
      // every windowed opacity must hold at zero before its window (learned bug)
      for (const m of svg.matchAll(/<animate attributeName="opacity" values="([^"]+)"/g)) {
        const v = m[1].split(";")
        if (v[0] !== "0" || v[1] !== "0") err(`${where}: opacity window ramps from t=0 instead of holding at 0`)
      }
    }
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
      // AI-essay voice: plain textbook English only
      for (const [why, re] of AI_VOICE) {
        const m = v.match(re)
        if (m) err(`${s.id} ${label}: ${why} ("${m[0]}") in "${v.slice(0, 60)}"`)
      }
      for (const [why, re] of AI_VOICE_SOFT) {
        const m = v.match(re)
        if (m) warn(`${s.id} ${label}: ${why} ("${m[0]}") reads like an AI essay; consider plainer wording`)
      }
      // Sentences that need a second read. TeX is stripped so the word count
      // reflects prose, not markup.
      for (const sent of v.replace(/\$[^$]*\$/g, "N").split(/(?<=[.?!])\s+/)) {
        const words = sent.split(/\s+/).filter(Boolean).length
        if (words < 12) continue
        const joints = (sent.match(/,/g) ?? []).length * 6
          + (sent.match(SUBORD_RE) ?? []).length * 7
          + (sent.match(/[;:]/g) ?? []).length * 5
        if (words >= 26 || words + joints >= 46) {
          warn(`${s.id} ${label}: hard to read in one pass (${words} words), split it: "${sent.slice(0, 70)}"`)
        }
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
  for (const r of c.regions ?? []) {
    if (r.label) yield [`region ${r.id}`, r.label]
    if (r.whyWrong) yield [`whyWrong ${r.id}`, r.whyWrong]
  }
  for (const st of c.sequence ?? []) {
    if (st.prompt) yield [`stage ${st.regionId}`, st.prompt]
    if (st.hint) yield [`stage hint ${st.regionId}`, st.hint]
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
    if (ln.hint) yield [`hint ${ln.id}`, ln.hint]
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
  // Manipulative frames count as doing: an iframe concept slide (a live
  // widget the student drags) is interactive in substance even though it
  // has no interaction config.
  const doing = L ? L.slides.filter(s => s.interaction || s.visual?.kind === "iframe").length : 0
  const pct = L ? Math.round((100 * doing) / L.slides.length) : 0
  console.log(`\n■ ${lessonId}: ${L ? L.slides.length : "?"} slides · ${marks} marks · ${pct}% interactive`)
  if (L && pct < 60) warnings.push(`interactive ratio ${pct}% is below the 60% bar`)
  for (const e of errors) console.log(`  ERROR   ${e}`)
  for (const w of warnings) console.log(`  warning ${w}`)
  if (errors.length === 0 && warnings.length === 0) console.log("  clean")
}
