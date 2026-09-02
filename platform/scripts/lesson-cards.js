#!/usr/bin/env node
/**
 * The reference cards in Unit 6: the three formulas, and the steps lists.
 *
 * Checked in because they are part of the regenerable pipeline. Run order:
 *   lesson-given-find.js  →  lesson-cards.js  →  lesson-katex-labels.js
 *
 * Layout note: each card centres its BLOCK while keeping the rows left
 * aligned inside it. Left-aligning the rows against a full-width parent left
 * the equations hugging the left edge under a centred title, which is what
 * Hassan flagged.
 */

const fs = require("node:fs")
const path = require("node:path")

const LESSONS = path.join(__dirname, "..", "content", "lessons")

// Side colours match the diagrams the student has just been looking at.
const OPP = "#ff822c", ADJ = "#00abfa", HYP = "#ff4670", ANG = "#fff067"

/** Centre a block of rows without centring the rows themselves. */
const centred = inner =>
  `<div style='display:flex;justify-content:center;width:100%;padding:10px 0'>` +
  `<div style='display:flex;flex-direction:column;align-items:flex-start;gap:20px'>${inner}</div>` +
  `</div>`

const formulaRow = (chip, tex) =>
  `<div style='display:flex;align-items:center;gap:18px'>` +
  `<span style="flex:none;font-family:Geist Mono,monospace;font-size:12px;font-weight:600;letter-spacing:1.5px;color:${ANG};` +
  `background:rgba(255,240,103,0.10);border:1px solid rgba(255,240,103,0.32);border-radius:6px;padding:5px 9px">${chip}</span>` +
  `<span style='font-size:22px'>${tex}</span></div>`

const FORMULA_CARD = centred(
  formulaRow("SOH", `\\(\\sin\\theta = \\dfrac{\\textcolor{${OPP}}{\\text{opposite}}}{\\textcolor{${HYP}}{\\text{hypotenuse}}}\\)`) +
  formulaRow("CAH", `\\(\\cos\\theta = \\dfrac{\\textcolor{${ADJ}}{\\text{adjacent}}}{\\textcolor{${HYP}}{\\text{hypotenuse}}}\\)`) +
  formulaRow("TOA", `\\(\\tan\\theta = \\dfrac{\\textcolor{${OPP}}{\\text{opposite}}}{\\textcolor{${ADJ}}{\\text{adjacent}}}\\)`),
)

const stepsCard = steps => centred(
  steps.map((t, i) =>
    `<div style='display:flex;align-items:center;gap:16px;max-width:34em'>` +
    `<span style="flex:none;width:30px;height:30px;border-radius:50%;background:rgba(0,171,250,0.12);` +
    `border:1px solid rgba(0,171,250,0.42);color:#00abfa;font-family:Geist Mono,monospace;font-size:13px;` +
    `font-weight:600;display:flex;align-items:center;justify-content:center">${i + 1}</span>` +
    `<span style='font-size:18px;color:#f0eeea;line-height:1.45'>${t}</span></div>`).join(""),
)

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

const CARDS = {
  "06-02": { "04c-formulas": FORMULA_CARD, "07b2-steps": stepsCard(TRIG_STEPS) },
  "06-01": { "05c-steps": stepsCard(PYTH_STEPS) },
}

for (const [lessonId, cards] of Object.entries(CARDS)) {
  const p = path.join(LESSONS, lessonId, "lesson.json")
  const L = JSON.parse(fs.readFileSync(p, "utf8"))
  for (const [slideId, content] of Object.entries(cards)) {
    const s = L.slides.find(x => x.id === slideId)
    if (!s) throw new Error(`${lessonId}: no slide ${slideId}`)
    if (s.visual?.kind !== "html") throw new Error(`${lessonId}/${slideId}: not an html visual`)
    s.visual.content = content
    console.log(`${lessonId} ${slideId}: card rebuilt`)
  }
  fs.writeFileSync(p, JSON.stringify(L, null, 2) + "\n")
  JSON.parse(fs.readFileSync(p, "utf8"))
}
