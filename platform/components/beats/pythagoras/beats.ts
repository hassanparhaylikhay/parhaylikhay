/**
 * Pythagoras' theorem, one tiny idea per beat. The student pulls out the
 * two sides of a right angle and joins them: a right-angled triangle, with
 * the hypotenuse opposite the right angle. Squares grow on its sides; the
 * two small areas add up to the big one, whatever the triangle. Four copies
 * of the triangle in a big square show why. Let go of the right angle and
 * the rule breaks. Then the hypotenuse, a shorter side, real exam
 * questions, building to order, and three sides that cannot fit.
 *
 * World units are grid squares, y up. The right angle C sits at the origin,
 * A straight up from it and B straight across, so side CA is a (blue), CB
 * is b (orange) and AB is the hypotenuse c (green).
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import type { BeatOf } from "../beat"
import { applyParts } from "../chapter"
import { type Vec } from "../geometry"
import type { WalkStep } from "../walk"
import {
  type Scene, type EqPart, type VisKey, type AngSpec, type Sq,
  BLUE, ORANGE, PINK, GREEN, NEUTRAL,
  resetBeat, show, say, startInput, place, setSegs, squareOn, joined, squareCorners,
  wOf, sq2, angleAt, numText, clamp,
} from "./scene"

export type Beat = BeatOf<Scene>

const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const CM = "\\text{ cm}"
const A2 = c(BLUE, "a^2"), B2 = c(ORANGE, "b^2"), C2 = c(GREEN, "c^2")

// ── small builders ───────────────────────────────────────────────────────

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

const inputRight = (S: Scene) => S.input?.state === "right"
const guessIn = (S: Scene) => S.input?.state === "right" || S.input?.state === "guessed"

function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

/** Start a beat: clean the board down. Squares keep their growth so they never regrow. */
function base(S: Scene) {
  resetBeat(S)
  S.showPts = []
  S.segs = []
  S.letters = new Set()
}

function ask(S: Scene, parts: EqPart[], answer: number, opts: { guess?: boolean; onRight?: (S: Scene) => void; help?: (S: Scene, tries: number) => void } = {}) {
  startInput(S, { parts, answer, hints: [], guess: opts.guess, onRight: opts.onRight, help: opts.help })
}

/** A reminder line under the equation, never the worked answer. */
function remind(S: Scene, tex: string) {
  if (S.input) S.input.hints = [tex]
}

/** A right-angle mark at V. */
const rightMark = (id: string, V: string, X: string, Y: string): AngSpec => ({ id, at: V, from: X, to: Y, value: () => 90, colour: NEUTRAL, mark: true })

// ── the student's triangle ───────────────────────────────────────────────

/** Its two short sides, from where A and B are. */
const legA = (S: Scene) => Math.round(wOf(S, "A", false)[1])
const legB = (S: Scene) => Math.round(wOf(S, "B", false)[0])

/** A straight up from C, at least 1 and at most `max` squares. */
const upFrom = (max: number) => (_S: Scene, w: Vec): Vec => [0, clamp(Math.round(w[1]), 1, max)]
/** B straight across from C. */
const acrossFrom = (max: number) => (_S: Scene, w: Vec): Vec => [clamp(Math.round(w[0]), 1, max), 0]

/** The student's triangle if it is on the axes and fits, otherwise a 3-4 one. */
function ensureTri(S: Scene, max = 6, min = 1) {
  const A = S.pts.A, B = S.pts.B
  const ok = A && B && A[0] === 0 && B[1] === 0 && A[1] >= min && A[1] <= max && B[0] >= min && B[0] <= max
  if (!ok) place(S, { A: [0, 3], B: [4, 0] })
  place(S, { C: [0, 0] })
}

/** Set the triangle's two short sides (it glides there). */
function setLegs(S: Scene, a: number, b: number) {
  place(S, { C: [0, 0], A: [0, a], B: [b, 0] })
}

/** The triangle on the board: its three sides, the right angle, letters if asked. */
function triBoard(S: Scene, opts: { colours?: boolean; letters?: boolean; squares?: boolean; max?: number } = {}) {
  base(S)
  ensureTri(S, opts.max ?? 6)
  S.showPts = ["C", "A", "B"]
  setSegs(S, [["C", "A"], ["C", "B"], ["A", "B"]], opts.colours ? { CA: BLUE, CB: ORANGE, AB: GREEN } : {})
  S.angles = [rightMark("rC", "C", "A", "B")]
  if (opts.letters) S.letters = new Set(["A", "B", "C"])
  S.squares = opts.squares ? allSquares(S) : []
  S.frameFn = opts.squares ? squaresFrame : triFrame
}

/** The three squares, keeping how far each has grown. */
function allSquares(S: Scene): Sq[] {
  return [
    squareOn(S, "C", "A", "B", BLUE),
    squareOn(S, "C", "B", "A", ORANGE),
    squareOn(S, "A", "B", "C", GREEN),
  ]
}

/** Room for the triangle and all three squares. */
function squaresFrame(S: Scene) {
  const a = Math.max(1, wOf(S, "A", false)[1]), b = Math.max(1, wOf(S, "B", false)[0])
  return { x0: -a - 0.6, x1: a + b + 0.6, y0: -b - 0.6, y1: a + b + 0.6 }
}

/** Room for the triangle alone. */
function triFrame(S: Scene) {
  const a = Math.max(1, wOf(S, "A", false)[1]), b = Math.max(1, wOf(S, "B", false)[0])
  return { x0: -1.4, x1: b + 1.4, y0: -1.4, y1: a + 1.4 }
}

/** Lengths on the sides: the short ones whole, the hypotenuse to one place. */
function lengths(S: Scene) {
  S.segText = { CA: s => String(legA(s)), CB: s => String(legB(s)), AB: s => numText(Math.sqrt(sq2(s, "A", "B"))) }
}

/** The three areas, live, for the sum at the bottom. */
const areas = (S: Scene): [number, number, number] => [sq2(S, "C", "A"), sq2(S, "C", "B"), sq2(S, "A", "B")]

/** The side names a, b, c in their colours. */
function sideNames(S: Scene) {
  S.segText = { CA: () => "a", CB: () => "b", AB: () => "c" }
  S.segTextColour = { CA: BLUE, CB: ORANGE, AB: GREEN }
}

/** A fixed triangle with short sides p (up) and q (across), for the questions. */
function qTri(S: Scene, p: number, q: number, known: { CA?: string; CB?: string; AB?: string }, unknown: "CA" | "CB" | "AB") {
  base(S)
  setLegs(S, p, q)
  S.showPts = ["C", "A", "B"]
  setSegs(S, [["C", "A"], ["C", "B"], ["A", "B"]], { CA: BLUE, CB: ORANGE, AB: GREEN })
  S.angles = [rightMark("rC", "C", "A", "B")]
  S.squares = []
  S.frameFn = triFrame
  S.segText = {}
  for (const [k, v] of Object.entries(known)) S.segText[k] = () => v as string
  S.segText[unknown] = () => "?"
  S.segTextColour = { CA: BLUE, CB: ORANGE, AB: GREEN, [unknown]: PINK }
}

// ── turned triangles, for tapping the hypotenuse ─────────────────────────

const TURNED: Record<string, Vec>[] = [
  { C: [0, 0], A: [3, 3], B: [2, -2] },
  { C: [4, 4], A: [0, 1], B: [7, 0] },
  { C: [0, 3], A: [0, 0], B: [5, 3] },
]

function tapHyp(id: string, k: number): Beat {
  return {
    id,
    say: "Tap the hypotenuse.",
    enter: S => {
      base(S)
      place(S, TURNED[k])
      S.showPts = ["C", "A", "B"]
      setSegs(S, [["C", "A"], ["C", "B"], ["A", "B"]])
      S.angles = [rightMark("rC", "C", "A", "B")]
      S.squares = []
      const ps = Object.values(TURNED[k])
      S.frame = { x0: Math.min(...ps.map(p => p[0])) - 1.5, x1: Math.max(...ps.map(p => p[0])) + 1.5, y0: Math.min(...ps.map(p => p[1])) - 1.5, y1: Math.max(...ps.map(p => p[1])) + 1.5 }
      S.mode = "tapSeg"
      S.onTapSeg = (S2, sid) => {
        if (S2.got.size) return
        if (sid === "AB") { S2.got.add("AB"); S2.touched = { kind: "seg", id: "AB" }; S2.flashGood = 1.2; S2.note = null; return }
        say(S2, "That side touches the right angle. The hypotenuse is opposite it.")
      }
      look(S, ["grid", "arcs"])
    },
    done: S => S.got.has("AB"),
    advanceAfter: 1300,
  }
}

// ── the proof ────────────────────────────────────────────────────────────

/** The big square with four copies of the student's triangle (a and b kept between 2 and 5). */
function proofBoard(S: Scene, moved: boolean, twin = false) {
  base(S)
  ensureTri(S)
  const a = clamp(legA(S), 2, 5)
  let b = clamp(legB(S), 2, 5)
  if (a === b) b = a === 5 ? 3 : a + 1
  const s = a + b
  S.squares = []
  S.proof = { a, b, at: [0, 0], moved: moved ? [-9, -9, -9, -9] : [null, null, null, null], breathe: false }
  S.proofTwin = twin
  const gap = Math.max(1.2, s * 0.25)
  S.frame = { x0: -1.4, x1: (twin ? 2 * s + gap : s) + 0.8, y0: -1.4, y1: s + 0.6 }
}

// ── exam figures ─────────────────────────────────────────────────────────

/** w15_11 Q5: square PQRS on PS, right-angled triangle PST, ST = √34, PT = 4. */
function examPQRS(S: Scene) {
  base(S)
  const r34 = Math.sqrt(34)
  place(S, { T: [0, 0], P: [4, 0], S: [0, -r34] })
  S.showPts = ["T", "P", "S", "Q", "R"]
  setSegs(S, [["T", "P"], ["T", "S"]])
  const sq = squareOn(S, "P", "S", "T", GREEN, true)
  S.squares = [sq]
  const [, , q3, q4] = squareCorners(S, sq, false)
  place(S, { R: q3, Q: q4 })
  S.letters = new Set(["T", "P", "S", "Q", "R"])
  S.letterAway = { P: [0, -r34 / 2], S: [2, -r34 / 2], T: [2, -r34 / 2] }
  S.angles = [rightMark("rT", "T", "P", "S")]
  S.areaText = { PS: () => `50${CM}^2` }
  S.segText = { TS: () => "\\sqrt{34}", TP: () => "?" }
  S.segTextColour = { TS: BLUE, TP: PINK }
  const ps = [[0, 0], [4, 0], [0, -r34], q3, q4] as Vec[]
  S.frame = { x0: Math.min(...ps.map(p => p[0])) - 1.2, x1: Math.max(...ps.map(p => p[0])) + 1.2, y0: Math.min(...ps.map(p => p[1])) - 1, y1: Math.max(...ps.map(p => p[1])) + 1 }
}

/** s18_11 Q17: square ABCD on BC, right-angled triangle BEC with BE = 6, EC = 7. */
function examABECD(S: Scene) {
  base(S)
  const u: Vec = [-0.94, 0.342], v: Vec = [-0.342, -0.94]
  place(S, { E: [0, 0], B: [6 * u[0], 6 * u[1]], C: [7 * v[0], 7 * v[1]] })
  S.showPts = ["A", "B", "E", "C", "D"]
  setSegs(S, [["B", "E"], ["E", "C"]])
  const sq = squareOn(S, "B", "C", "E", GREEN, true)
  S.squares = [sq]
  const [, , q3, q4] = squareCorners(S, sq, false)
  place(S, { D: q3, A: q4 })
  S.letters = new Set(["A", "B", "E", "C", "D"])
  S.angles = [rightMark("rE", "E", "B", "C")]
  S.areaText = { BC: () => "" }
  S.segText = { BE: () => "6", EC: () => "7" }
  S.segTextColour = { BE: BLUE, EC: ORANGE }
  const ps = [[0, 0], S.pts.B, S.pts.C, q3, q4] as Vec[]
  S.letterAway = { A: centreOf(ps), B: centreOf(ps), E: centreOf(ps), C: centreOf(ps), D: centreOf(ps) }
  S.frame = { x0: Math.min(...ps.map(p => p[0])) - 1.2, x1: Math.max(...ps.map(p => p[0])) + 1.2, y0: Math.min(...ps.map(p => p[1])) - 1, y1: Math.max(...ps.map(p => p[1])) + 1 }
}

const centreOf = (ps: Vec[]): Vec => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length]

/** s17_21 Q6(a): B 12 km north of A, C 8 km east of A, D 15 km west of B. */
function examTowns(S: Scene) {
  base(S)
  place(S, { A: [0, 0], B: [0, 12], C: [8, 0], D: [-15, 12] })
  S.showPts = ["A", "B", "C", "D"]
  setSegs(S, [["D", "B"], ["B", "A"], ["A", "C"]])
  S.segs.push({ id: "BC", a: "B", b: "C", dash: true })
  S.letters = new Set(["A", "B", "C", "D"])
  S.letterAway = { A: [3, 6], B: [-2, 6], C: [3, 6], D: [-6, 6] }
  S.segText = { DB: () => "15", BA: () => "12", AC: () => "8" }
  S.squares = []
  S.frame = { x0: -16.5, x1: 9.5, y0: -2, y1: 13.5 }
}

/** Two points on the grid: A(1, 2) and B(7, 10). */
function gridPoints(S: Scene, legs: boolean) {
  base(S)
  place(S, { A: [1, 2], B: [7, 10], K: [7, 2] })
  S.showPts = legs ? ["A", "B", "K"] : ["A", "B"]
  setSegs(S, [["A", "B"]], { AB: GREEN })
  if (legs) {
    S.segs.push({ id: "AK", a: "A", b: "K", colour: ORANGE, dash: true }, { id: "KB", a: "K", b: "B", colour: BLUE, dash: true })
    S.angles = [rightMark("rK", "K", "A", "B")]
    S.segText = { AK: () => "6", KB: () => "8" }
    S.segTextColour = { AK: ORANGE, KB: BLUE }
  }
  S.letters = new Set(["A", "B"])
  S.squares = []
  S.frame = { x0: -0.5, x1: 9, y0: 0, y1: 11.5 }
}

// ── worked walkthroughs ──────────────────────────────────────────────────

function hypWalk(p: number, q: number): WalkStep<Scene>[] {
  const s = p * p + q * q, r = Math.round(Math.sqrt(s))
  return [
    { say: `Square the two short sides. $${p}^2 = ${p * p}$ and $${q}^2 = ${q * q}$.`, tex: `${c(BLUE, `${p}^2`)} = ${p * p}, \\quad ${c(ORANGE, `${q}^2`)} = ${q * q}`, show: S => { S.pulseSegs = new Set(["CA", "CB"]) } },
    { say: `Add them. $${p * p} + ${q * q} = ${s}$.`, tex: `${c(GREEN, "c^2")} = ${p * p} + ${q * q} = ${s}`, show: S => { S.pulseSegs = new Set(["AB"]) } },
    { say: `The hypotenuse is $\\sqrt{${s}}$, which is $${r}$.`, tex: `c = \\sqrt{${s}} = ${c(GREEN, String(r))}`, show: S => { S.segText.AB = () => String(r); S.segTextColour.AB = GREEN } },
  ]
}

function legWalk(h: number, p: number, side: "CA" | "CB"): WalkStep<Scene>[] {
  const d = h * h - p * p, r = Math.round(Math.sqrt(d))
  return [
    { say: `The hypotenuse is $${h}$, so the big square is $${h}^2 = ${h * h}$.`, tex: `${c(GREEN, `${h}^2`)} = ${h * h}`, show: S => { S.pulseSegs = new Set(["AB"]) } },
    { say: `Take away the small square. $${h * h} - ${p * p} = ${d}$.`, tex: `${h * h} - ${p * p} = ${d}`, show: S => { S.pulseSegs = new Set([side === "CA" ? "CB" : "CA"]) } },
    { say: `So the missing side is $\\sqrt{${d}}$, which is $${r}$.`, tex: `\\sqrt{${d}} = ${c(GREEN, String(r))}`, show: S => { S.pulseSegs = new Set([side]); S.segText[side] = () => String(r); S.segTextColour[side] = GREEN } },
  ]
}

/** A wrong answer that shows a known slip gets a note naming it. */
function slips(S: Scene, h: number, p: number) {
  const v = Number(S.input?.value ?? "")
  if (v === h - p) say(S, "Square the sides first, then subtract.")
  else if (v === h + p) say(S, "The hypotenuse is the longest side. Subtract the squares.")
}

// ── the beats ────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. Right-angled triangles ──
  watch("corner", "This corner is a right angle.", S => {
    base(S)
    place(S, { C: [0, 0], A: [0, 1], B: [1, 0] })
    S.pts.A = [0, 1]; S.pts.B = [1, 0]
    S.showPts = ["C"]
    setSegs(S, [["C", "A"], ["C", "B"]])
    S.angles = [rightMark("rC", "C", "A", "B")]
    S.squares = []
    S.frame = { x0: -1.5, x1: 8.5, y0: -1.5, y1: 7.5 }
    look(S, ["grid", "arcs"])
  }),
  {
    id: "pull",
    say: "Pull out its two sides.",
    enter: S => {
      base(S)
      const a = S.pts.A && S.pts.A[0] === 0 ? S.pts.A[1] : 1, b = S.pts.B && S.pts.B[1] === 0 ? S.pts.B[0] : 1
      place(S, { C: [0, 0], A: [0, Math.min(a, 1)], B: [Math.min(b, 1), 0] })
      S.pts.A = [0, Math.min(a, 1)]; S.pts.B = [Math.min(b, 1), 0]
      S.showPts = ["C", "A", "B"]
      setSegs(S, [["C", "A"], ["C", "B"]])
      S.angles = [rightMark("rC", "C", "A", "B")]
      S.squares = []
      S.frame = { x0: -1.5, x1: 8.5, y0: -1.5, y1: 7.5 }
      S.segText = { CA: s => String(legA(s)), CB: s => String(legB(s)) }
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(7) }; S.mode = "slide"
      look(S, ["grid", "arcs", "lengths"])
    },
    done: S => !S.drag && legA(S) >= 2 && legB(S) >= 2,
  },
  {
    id: "join",
    say: "Join their ends.",
    enter: S => {
      base(S)
      ensureTri(S, 7, 2)
      S.showPts = ["C", "A", "B"]
      setSegs(S, [["C", "A"], ["C", "B"]])
      S.angles = [rightMark("rC", "C", "A", "B")]
      S.squares = []
      S.frame = { x0: -1.5, x1: 8.5, y0: -1.5, y1: 7.5 }
      S.joinNeed = [["A", "B"]]
      S.joinHint = "Start at one end and finish at the other."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["grid", "arcs"])
    },
    done: joined,
  },
  watch("rt-name", "It's a *right-angled triangle*.", S => {
    triBoard(S)
    S.fills = [{ pts: ["C", "A", "B"], color: BLUE }]
    look(S, ["grid", "arcs"])
  }, 2.2),
  {
    id: "move",
    say: "Move the corners. The right angle stays.",
    enter: S => {
      triBoard(S, { max: 7 })
      S.frameFn = null
      S.frame = { x0: -1.5, x1: 8.5, y0: -1.5, y1: 7.5 }
      lengths(S)
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(7) }; S.mode = "slide"
      look(S, ["grid", "arcs", "lengths"])
    },
    done: S => !S.drag && S.moved >= 5, free: true, minPlay: 6,
  },
  {
    id: "thin",
    say: "Make it long and thin.",
    enter: S => {
      triBoard(S, { max: 7 })
      S.frameFn = null
      S.frame = { x0: -1.5, x1: 8.5, y0: -1.5, y1: 7.5 }
      lengths(S)
      if (Math.max(legA(S), legB(S)) >= 3 * Math.min(legA(S), legB(S))) setLegs(S, 3, 4)
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(7) }; S.mode = "slide"
      look(S, ["grid", "arcs", "lengths"])
    },
    done: S => !S.drag && S.moved > 0 && Math.max(legA(S), legB(S)) >= 3 * Math.min(legA(S), legB(S)),
  },
  watch("longest", "The longest side is opposite the right angle.", S => {
    triBoard(S, { max: 7 })
    lengths(S)
    S.pulseSegs = new Set(["AB"])
    S.pulse = new Set(["rC"])
    look(S, ["grid", "arcs", "lengths"])
  }, 2.2),
  watch("hyp-name", "It's called the *hypotenuse*.", S => {
    triBoard(S, { max: 7 })
    S.segs = S.segs.map(s => (s.id === "AB" ? { ...s, colour: GREEN } : s))
    S.pulseSegs = new Set(["AB"])
    look(S, ["grid", "arcs"])
  }, 2.2),
  tapHyp("tap-hyp-1", 0),
  tapHyp("tap-hyp-2", 1),
  tapHyp("tap-hyp-3", 2),

  // ── 2. Squares on the sides ──
  {
    id: "build-squares",
    say: "Tap each side to build a square on it.",
    enter: S => {
      triBoard(S, { colours: true })
      S.squares = []
      S.frameFn = squaresFrame
      S.mode = "tapSeg"
      S.onTapSeg = (S2, sid) => {
        const want: Record<string, () => Sq> = {
          CA: () => squareOn(S2, "C", "A", "B", BLUE),
          CB: () => squareOn(S2, "C", "B", "A", ORANGE),
          AB: () => squareOn(S2, "A", "B", "C", GREEN),
        }
        if (!want[sid] || S2.squares.some(q => q.id === sid)) return
        S2.squares = [...S2.squares, want[sid]()]
        S2.touched = { kind: "sq", id: sid }
        S2.flashGood = 0.8
      }
      look(S, ["grid", "arcs"])
    },
    done: S => S.squares.length === 3,
    advanceAfter: 1400,
  },
  watch("areas", "Each square has an area. Count its small squares.", S => {
    triBoard(S, { colours: true, squares: true })
    look(S, ["grid", "arcs", "areas"])
  }, 2.4),
  {
    id: "move-areas",
    say: "Move the corners. Watch the three areas.",
    enter: S => {
      triBoard(S, { colours: true, squares: true })
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(6) }; S.mode = "slide"
      look(S, ["grid", "arcs", "areas"])
    },
    done: S => !S.drag && S.moved >= 4, free: true, minPlay: 6,
  },
  {
    id: "set-34",
    say: "Make the short sides $3$ and $4$.",
    enter: S => {
      triBoard(S, { colours: true, squares: true })
      lengths(S)
      if ((legA(S) === 3 && legB(S) === 4) || (legA(S) === 4 && legB(S) === 3)) setLegs(S, 2, 2)
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(6) }; S.mode = "slide"
      S.lockWhen = S2 => (legA(S2) === 3 && legB(S2) === 4) || (legA(S2) === 4 && legB(S2) === 3)
      look(S, ["grid", "arcs", "areas", "lengths"])
    },
    done: S => S.locked,
  },
  {
    id: "guess",
    say: "Guess: what do the two small areas add up to?",
    enter: S => {
      triBoard(S, { colours: true, squares: true })
      if (!((legA(S) === 3 && legB(S) === 4) || (legA(S) === 4 && legB(S) === 3))) setLegs(S, 3, 4)
      S.areaText = { AB: () => "?" }
      look(S, ["grid", "arcs", "areas", "line", "keypad"])
      ask(S, [c(BLUE, String(sq2(S, "C", "A"))), "+", c(ORANGE, String(sq2(S, "C", "B"))), "=", { box: true }], 25, { guess: true })
    },
    done: guessIn,
  },
  watch("add", "Add them.", S => {
    triBoard(S, { colours: true, squares: true })
    if (!((legA(S) === 3 && legB(S) === 4) || (legA(S) === 4 && legB(S) === 3))) setLegs(S, 3, 4)
    S.sumVals = areas
    S.sumFly = S.time + 0.4
    look(S, ["grid", "arcs", "areas", "sum"])
  }, 3),
  {
    id: "again",
    say: "Move the corners again.",
    enter: S => {
      triBoard(S, { colours: true, squares: true })
      S.sumVals = areas
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(6) }; S.mode = "slide"
      look(S, ["grid", "arcs", "areas", "sum"])
    },
    done: S => !S.drag && S.moved >= 4, free: true, minPlay: 7,
  },
  watch("always", "The two small squares always add up to the big one.", S => {
    triBoard(S, { colours: true, squares: true })
    S.sumVals = areas
    S.pulseSquares = new Set(["CA", "CB", "AB"])
    look(S, ["grid", "arcs", "areas", "sum"])
  }, 2.4),
  watch("theorem", "This is *Pythagoras' theorem*.", S => {
    triBoard(S, { colours: true, squares: true })
    sideNames(S)
    S.areaText = { CA: () => "a^2", CB: () => "b^2", AB: () => "c^2" }
    S.lineTex = `${A2} + ${B2} = ${C2}`
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.4),

  // ── 3. Why it works ──
  watch("copies", "Here are four copies of your triangle, in a big square.", S => {
    proofBoard(S, false)
    look(S, ["grid"])
  }, 2.4),
  watch("big-square", "Each side of the big square is $a + b$.", S => {
    proofBoard(S, false)
    look(S, ["grid", "lengths"])
  }, 2.2),
  watch("gap-c", "The gap in the middle is a square on the hypotenuse. Its area is $c^2$.", S => {
    proofBoard(S, false)
    look(S, ["grid", "lengths"])
  }, 2.4),
  {
    id: "move-tris",
    say: "Tap each glowing triangle to move it.",
    enter: S => {
      proofBoard(S, false)
      S.mode = "tapProof"
      look(S, ["grid", "lengths"])
    },
    done: S => !!S.proof && [0, 2, 3].every(k => S.proof!.moved[k] !== null && S.time - (S.proof!.moved[k] as number) > 1.2),
    advanceAfter: 900,
  },
  watch("gaps-ab", "Now the gaps are two squares, $a^2$ and $b^2$.", S => {
    proofBoard(S, true)
    look(S, ["grid", "lengths"])
  }, 2.4),
  watch("same", "It's the same big square, with the same four triangles.", S => {
    proofBoard(S, false, true)
    look(S, ["grid", "lengths"])
  }, 2.4),
  watch("so-equal", `So the gaps are equal. $${A2} + ${B2} = ${C2}$.`, S => {
    proofBoard(S, false, true)
    S.lineTex = `${A2} + ${B2} = ${C2}`
    look(S, ["grid", "lengths", "line"])
  }, 2.4),
  watch("any", "It works the same way for any right-angled triangle.", S => {
    proofBoard(S, false, true)
    S.proof!.breathe = true
    S.frame = { ...S.frame, x1: S.frame.x1 + 2.2, y1: S.frame.y1 + 1.2 }
    look(S, ["lengths"])
  }, 3),

  // ── 4. Only with a right angle ──
  {
    id: "unlock",
    say: "Now let corner $C$ move.",
    enter: S => {
      unlockBoard(S)
      S.movable = ["C"]; S.mode = "slide"
      look(S, ["grid", "arcs", "areas", "sum", "letters"])
    },
    done: S => !S.drag && Math.abs(angleAt(S, "C", "A", "B") - 90) > 5,
  },
  {
    id: "bigger",
    say: "Make the angle at $C$ bigger than $90^\\circ$.",
    enter: S => {
      unlockBoard(S)
      S.movable = ["C"]; S.mode = "slide"
      look(S, ["grid", "arcs", "areas", "sum", "letters"])
    },
    done: S => !S.drag && angleAt(S, "C", "A", "B") > 100,
  },
  watch("too-big", "Now the big square is more than the two small ones.", S => {
    unlockBoard(S)
    if (angleAt(S, "C", "A", "B") <= 100) place(S, { C: [1, 1] })
    S.pulseSquares = new Set(["AB"])
    look(S, ["grid", "arcs", "areas", "sum", "letters"])
  }, 2.4),
  {
    id: "smaller",
    say: "Now make it smaller than $90^\\circ$.",
    enter: S => {
      unlockBoard(S)
      S.movable = ["C"]; S.mode = "slide"
      look(S, ["grid", "arcs", "areas", "sum", "letters"])
    },
    done: S => !S.drag && angleAt(S, "C", "A", "B") < 80,
  },
  watch("too-small", "Now the big square is less than the two small ones.", S => {
    unlockBoard(S)
    if (angleAt(S, "C", "A", "B") >= 80) place(S, { C: [-1, -2] })
    S.pulseSquares = new Set(["AB"])
    look(S, ["grid", "arcs", "areas", "sum", "letters"])
  }, 2.4),
  watch("only-right", "Pythagoras only works in right-angled triangles.", S => {
    unlockBoard(S)
    place(S, { C: [0, 0] })
    S.pts.C = [0, 0]
    look(S, ["grid", "arcs", "areas", "sum", "letters"])
  }, 2.4),

  // ── 5. Finding the hypotenuse ──
  watch("six-eight", "Here the two short sides are $6$ and $8$.", S => {
    sixEight(S)
    S.areaText = { AB: () => "?" }
    look(S, ["grid", "arcs", "areas", "lengths"])
  }, 2.2),
  watch("add-squares", "Square them and add. $36 + 64 = 100$.", S => {
    sixEight(S)
    S.sumVals = areas
    S.sumFly = S.time + 0.3
    look(S, ["grid", "arcs", "areas", "lengths", "sum"])
  }, 3),
  watch("root", "The hypotenuse is the side of a square with area $100$.", S => {
    sixEight(S)
    S.sumVals = areas
    S.pulseSquares = new Set(["AB"])
    look(S, ["grid", "arcs", "areas", "lengths", "sum"])
  }, 2.4),
  watch("root-10", "So it is the *square root* of $100$, which is $10$.", S => {
    sixEight(S)
    S.segText.AB = () => "10"
    S.pulseSegs = new Set(["AB"])
    S.lineTex = `\\sqrt{100} = ${c(GREEN, "10")}`
    say(S, "The square root of $100$ is the number that makes $100$ when you square it. $10 \\times 10 = 100$.", "calm", 600)
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.6),
  hypQ("q-13", 5, 12),
  hypQ("q-17", 8, 15),
  {
    id: "q-PQR",
    say: "Triangle $PQR$ has a right angle at $Q$. Find $PR$.",
    enter: S => {
      base(S)
      place(S, { Q: [0, 0], P: [-5.4, 7.2], R: [9.6, 7.2] })
      S.showPts = ["P", "Q", "R"]
      setSegs(S, [["P", "Q"], ["Q", "R"], ["P", "R"]], { PQ: BLUE, QR: ORANGE, PR: GREEN })
      S.angles = [rightMark("rQ", "Q", "P", "R")]
      S.letters = new Set(["P", "Q", "R"])
      S.squares = []
      S.segText = { PQ: () => "9", QR: () => "12", PR: () => "?" }
      S.segTextColour = { PQ: BLUE, QR: ORANGE, PR: PINK }
      S.frame = { x0: -7, x1: 11, y0: -1.5, y1: 9 }
      look(S, ["arcs", "lengths", "letters", "line", "keypad"])
      ask(S, ["PR =", { box: true }], 15, {
        help: (S2, t) => { S2.pulse = new Set(["rQ"]); S2.pulseSegs = new Set(["PR"]); if (t >= 2) remind(S2, `PR^2 = ${c(BLUE, "9")}^2 + ${c(ORANGE, "12")}^2`) },
        onRight: S2 => { S2.segText.PR = () => "15"; S2.segTextColour.PR = GREEN },
      })
    },
    done: inputRight,
    walk: [
      { say: "The right angle is at $Q$, so the hypotenuse is $PR$, opposite it.", show: S => { S.pulse = new Set(["rQ"]); S.pulseSegs = new Set(["PR"]) } },
      { say: "$PR^2 = 9^2 + 12^2 = 81 + 144 = 225$.", tex: `PR^2 = ${c(BLUE, "9")}^2 + ${c(ORANGE, "12")}^2 = 81 + 144 = 225`, show: S => { S.pulseSegs = new Set(["PQ", "QR"]) } },
      { say: "So $PR$ is $\\sqrt{225}$, which is $15$.", tex: `PR = \\sqrt{225} = ${c(GREEN, "15")}`, show: S => { S.pulseSegs = new Set(["PR"]); S.segText.PR = () => "15"; S.segTextColour.PR = GREEN } },
    ],
  },

  // ── 6. Finding a shorter side ──
  watch("ten-six", "Now the hypotenuse is $10$ and one short side is $6$.", S => {
    sixEight(S)
    S.segText = { CA: () => "6", CB: () => "?", AB: () => "10" }
    S.segTextColour = { CA: BLUE, CB: PINK, AB: GREEN }
    S.areaText = { CB: () => "?" }
    look(S, ["grid", "arcs", "areas", "lengths"])
  }, 2.2),
  watch("take-away", "Take the small square from the big one. $100 - 36 = 64$.", S => {
    sixEight(S)
    S.segText = { CA: () => "6", CB: () => "?", AB: () => "10" }
    S.segTextColour = { CA: BLUE, CB: PINK, AB: GREEN }
    S.pulseSquares = new Set(["CB"])
    S.lineTex = `${c(GREEN, "100")} - ${c(BLUE, "36")} = ${c(ORANGE, "64")}`
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.6),
  watch("root-8", "So the missing side is $\\sqrt{64}$, which is $8$.", S => {
    sixEight(S)
    S.segText = { CA: () => "6", CB: () => "8", AB: () => "10" }
    S.pulseSegs = new Set(["CB"])
    S.lineTex = `\\sqrt{64} = ${c(ORANGE, "8")}`
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.4),
  watch("subtract", "To find a short side, subtract the squares.", S => {
    sixEight(S)
    sideNames(S)
    S.areaText = { CA: () => "a^2", CB: () => "b^2", AB: () => "c^2" }
    S.lineTex = `${B2} = ${C2} - ${A2}`
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.4),
  legQ("q-12", 5, 13, 12),
  legQ("q-7", 24, 25, 7),
  legQ("q-15", 8, 17, 15),

  // ── 7. Exam questions ──
  watch("exam-PQRS", "The diagram shows a square $PQRS$ and a right-angled triangle $PST$.", S => {
    examPQRS(S)
    look(S, ["arcs", "areas", "lengths", "letters"])
  }, 2.4),
  {
    id: "q-PT",
    say: `The square's area is $50${CM}^2$ and $ST = \\sqrt{34}$ cm. Find $PT$.`,
    enter: S => {
      examPQRS(S)
      look(S, ["arcs", "areas", "lengths", "letters", "line", "keypad"])
      ask(S, ["PT =", { box: true }, CM], 4, {
        help: (S2, t) => {
          S2.pulseSquares = new Set(["PS"])
          if (t >= 2) remind(S2, `PT^2 + ${c(BLUE, "34")} = ${c(GREEN, "50")}`)
        },
        onRight: S2 => { S2.segText.TP = () => `4${CM}`; S2.segTextColour.TP = GREEN },
      })
    },
    done: inputRight,
    walk: [
      { say: "The square stands on $PS$, so $PS^2$ is its area, $50$.", tex: `PS^2 = ${c(GREEN, "50")}`, show: S => { S.pulseSquares = new Set(["PS"]) } },
      { say: "$ST = \\sqrt{34}$, so $ST^2 = 34$.", tex: `ST^2 = ${c(BLUE, "34")}`, show: S => { S.pulseSquares = new Set(); S.pulseSegs = new Set(["TS"]) } },
      { say: "$PS$ is the hypotenuse of triangle $PST$. So $PT^2 = 50 - 34 = 16$.", tex: `PT^2 = ${c(GREEN, "50")} - ${c(BLUE, "34")} = 16`, show: S => { S.pulseSegs = new Set(["TP"]) } },
      { say: "So $PT$ is $\\sqrt{16}$, which is $4$ cm.", tex: `PT = \\sqrt{16} = ${c(GREEN, "4")}${CM}`, show: S => { S.segText.TP = () => `4${CM}`; S.segTextColour.TP = GREEN } },
    ],
  },
  watch("exam-ABECD", "A square $ABCD$ is joined to a right-angled triangle $BEC$.", S => {
    examABECD(S)
    look(S, ["arcs", "lengths", "letters"])
  }, 2.4),
  {
    id: "q-pentagon",
    say: "$BE = 6$ cm and $EC = 7$ cm. Find the area of $ABECD$.",
    enter: S => {
      examABECD(S)
      look(S, ["arcs", "areas", "lengths", "letters", "line", "keypad"])
      ask(S, ["\\text{Area} =", { box: true }, `${CM}^2`], 106, {
        help: (S2, t) => {
          S2.pulseSquares = new Set(["BC"])
          if (t >= 2) remind(S2, `BC^2 = ${c(BLUE, "6")}^2 + ${c(ORANGE, "7")}^2`)
        },
      })
    },
    done: inputRight,
    walk: [
      { say: "The square stands on $BC$, so its area is $BC^2$.", show: S => { S.pulseSquares = new Set(["BC"]) } },
      { say: "$BC$ is the hypotenuse of triangle $BEC$. $BC^2 = 6^2 + 7^2 = 85$.", tex: `BC^2 = ${c(BLUE, "6")}^2 + ${c(ORANGE, "7")}^2 = 36 + 49 = ${c(GREEN, "85")}`, show: S => { S.areaText.BC = () => "85" } },
      { say: "The triangle's area is $\\tfrac{1}{2} \\times 6 \\times 7 = 21$.", tex: `\\tfrac{1}{2} \\times 6 \\times 7 = 21`, show: S => { S.pulseSquares = new Set(); S.fills = [{ pts: ["B", "E", "C"], color: BLUE }] } },
      { say: "So the area of $ABECD$ is $85 + 21 = 106$ cm².", tex: `85 + 21 = ${c(GREEN, "106")}${CM}^2`, show: S => { S.fills = [{ pts: ["A", "B", "E", "C", "D"], color: GREEN }] } },
    ],
  },
  watch("exam-towns", "$B$ is $12$ km north of $A$, and $C$ is $8$ km east of $A$.", S => {
    examTowns(S)
    look(S, ["lengths", "letters"])
  }, 2.4),
  {
    id: "q-BC2",
    say: "Find $BC^2$ first.",
    enter: S => {
      examTowns(S)
      look(S, ["arcs", "lengths", "letters", "line", "keypad"])
      ask(S, ["BC^2 =", { box: true }], 208, {
        help: (S2, t) => {
          S2.angles = [rightMark("rA", "A", "B", "C")]
          S2.pulse = new Set(["rA"])
          if (t >= 2) remind(S2, `BC^2 = ${c(BLUE, "12")}^2 + ${c(ORANGE, "8")}^2`)
        },
      })
    },
    done: inputRight,
    walk: [
      { say: "North and east are at $90^\\circ$, so angle $BAC$ is a right angle.", show: S => { S.angles = [rightMark("rA", "A", "B", "C")]; S.pulse = new Set(["rA"]) } },
      { say: "$BC$ is the hypotenuse. $BC^2 = 12^2 + 8^2$.", tex: `BC^2 = ${c(BLUE, "12")}^2 + ${c(ORANGE, "8")}^2`, show: S => { S.pulse = new Set(); S.pulseSegs = new Set(["BC"]) } },
      { say: "$144 + 64 = 208$.", tex: `BC^2 = 144 + 64 = ${c(GREEN, "208")}` },
    ],
  },
  watch("calc", "With a calculator, $BC = \\sqrt{208} = 14.4$ km.", S => {
    examTowns(S)
    S.angles = [rightMark("rA", "A", "B", "C")]
    S.segText.BC = () => "14.4"
    S.segTextColour = { BC: GREEN }
    S.lineTex = `BC = \\sqrt{208} = 14.42\\ldots = ${c(GREEN, "14.4")}\\text{ km}`
    look(S, ["arcs", "lengths", "letters", "line"])
  }, 2.6),
  watch("grid-points", "How far apart are $A$ and $B$?", S => {
    gridPoints(S, false)
    look(S, ["grid", "letters"])
  }),
  watch("grid-legs", "Go across $6$ and up $8$. That makes a right-angled triangle.", S => {
    gridPoints(S, true)
    look(S, ["grid", "letters", "arcs", "lengths"])
  }, 2.4),
  {
    id: "q-AB",
    say: "Find the length $AB$.",
    enter: S => {
      gridPoints(S, true)
      S.segText.AB = () => "?"
      S.segTextColour.AB = PINK
      look(S, ["grid", "letters", "arcs", "lengths", "line", "keypad"])
      ask(S, ["AB =", { box: true }], 10, {
        help: (S2, t) => { S2.pulseSegs = new Set(["AK", "KB"]); if (t >= 2) remind(S2, `AB^2 = ${c(ORANGE, "6")}^2 + ${c(BLUE, "8")}^2`) },
        onRight: S2 => { S2.segText.AB = () => "10"; S2.segTextColour.AB = GREEN },
      })
    },
    done: inputRight,
    walk: [
      { say: "$AB$ is the hypotenuse. The short sides are $6$ and $8$.", show: S => { S.pulseSegs = new Set(["AK", "KB"]) } },
      { say: "$AB^2 = 6^2 + 8^2 = 36 + 64 = 100$.", tex: `AB^2 = ${c(ORANGE, "6")}^2 + ${c(BLUE, "8")}^2 = 100`, show: S => { S.pulseSegs = new Set(["AB"]) } },
      { say: "So $AB$ is $\\sqrt{100}$, which is $10$.", tex: `AB = \\sqrt{100} = ${c(GREEN, "10")}`, show: S => { S.segText.AB = () => "10"; S.segTextColour.AB = GREEN } },
    ],
  },

  // ── 8. Make the triangle ──
  makeTo("make-5", "Make the hypotenuse $5$.", 25, 6),
  makeTo("make-13", "Now make it $13$.", 169, 12),
  {
    id: "make-234",
    say: "Make the sides $2$, $3$ and $4$.",
    enter: S => {
      buildBoard(S, 6)
      S.chips = [2, 3, 4].map(n => ({ tex: String(n), test: (S2: Scene) => sidesShown(S2).includes(n) }))
      look(S, ["grid", "arcs", "lengths", "line"])
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    buildBoard(S, 6)
    S.movable = []
    look(S, ["grid", "arcs", "lengths"])
  }),
  watch("not-equal", "The short sides would be $2$ and $3$. But $2^2 + 3^2 = 13$, and $4^2 = 16$.", S => {
    triBoard(S, { colours: true, squares: true })
    setLegs(S, 2, 3)
    lengths(S)
    S.lineTex = `${c(BLUE, "2")}^2 + ${c(ORANGE, "3")}^2 = 13 \\neq 16 = ${c(PINK, "4")}^2`
    look(S, ["grid", "arcs", "areas", "lengths", "line"])
  }, 2.6),
  watch("must", "In a right-angled triangle, $a^2 + b^2$ always equals $c^2$.", S => {
    triBoard(S, { colours: true, squares: true })
    S.sumVals = areas
    look(S, ["grid", "arcs", "areas", "sum"])
  }, 2.4),
  {
    id: "end",
    say: "Move anything you like. It still follows the rule.",
    enter: S => {
      triBoard(S, { colours: true, squares: true })
      S.sumVals = areas
      S.movable = ["A", "B"]; S.constrain = { A: upFrom(6), B: acrossFrom(6) }; S.mode = "slide"
      look(S, ["grid", "arcs", "areas", "sum"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── boards and beat makers used above ────────────────────────────────────

/** The student's triangle with C free to move: the right angle may go. */
function unlockBoard(S: Scene) {
  const keepC = S.pts.C && (S.pts.C[0] !== 0 || S.pts.C[1] !== 0) ? S.pts.C : null
  triBoard(S, { colours: true, squares: true, letters: true })
  if (keepC) place(S, { C: keepC })
  S.angles = [{ id: "C", at: "C", from: "A", to: "B", value: S2 => angleAt(S2, "C", "A", "B"), colour: NEUTRAL }]
  S.sumVals = areas
  const a = legA(S), b = legB(S)
  S.constrain = { C: (S2, w) => {
    const p: Vec = [clamp(Math.round(w[0]), -3, b + 1), clamp(Math.round(w[1]), -3, a + 1)]
    // never on the line through A and B, so it stays a triangle
    const A = S2.pts.A, B = S2.pts.B
    const cr = (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0])
    return Math.abs(cr) < 0.5 ? S2.pts.C : p
  } }
  S.frameFn = s => {
    const C = s.pts.C, A = s.pts.A, B = s.pts.B
    const sq = (p: Vec, q: Vec, r: Vec) => squareCornersOf(p, q, r)
    const all = [A, B, C, ...sq(C, A, B), ...sq(C, B, A), ...sq(A, B, C)]
    return { x0: Math.min(...all.map(p => p[0])) - 0.6, x1: Math.max(...all.map(p => p[0])) + 0.6, y0: Math.min(...all.map(p => p[1])) - 0.6, y1: Math.max(...all.map(p => p[1])) + 0.6 }
  }
}

/** The far corners of the square on p-q, away from r. */
function squareCornersOf(p: Vec, q: Vec, r: Vec): Vec[] {
  const d: Vec = [q[0] - p[0], q[1] - p[1]], l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (n[0] * (r[0] - p[0]) + n[1] * (r[1] - p[1]) > 0) n = [-n[0], -n[1]]
  return [[q[0] + n[0] * l, q[1] + n[1] * l], [p[0] + n[0] * l, p[1] + n[1] * l]]
}

/** The 6-8-10 triangle with its squares. */
function sixEight(S: Scene) {
  base(S)
  setLegs(S, 6, 8)
  S.showPts = ["C", "A", "B"]
  setSegs(S, [["C", "A"], ["C", "B"], ["A", "B"]], { CA: BLUE, CB: ORANGE, AB: GREEN })
  S.angles = [rightMark("rC", "C", "A", "B")]
  S.squares = allSquares(S)
  S.frameFn = squaresFrame
  S.segText = { CA: () => "6", CB: () => "8", AB: () => "?" }
  S.segTextColour = { CA: BLUE, CB: ORANGE, AB: PINK }
}

/** Find the hypotenuse of a triangle with short sides p and q. */
function hypQ(id: string, p: number, q: number): Beat {
  const ans = Math.round(Math.sqrt(p * p + q * q))
  return {
    id,
    say: "Find the hypotenuse.",
    enter: S => {
      qTri(S, p, q, { CA: String(p), CB: String(q) }, "AB")
      look(S, ["grid", "arcs", "lengths", "line", "keypad"])
      ask(S, ["c =", { box: true }], ans, {
        help: (S2, t) => {
          S2.pulseSegs = new Set(["CA", "CB"])
          if (t >= 2) remind(S2, `c^2 = ${c(BLUE, String(p))}^2 + ${c(ORANGE, String(q))}^2`)
        },
        onRight: S2 => { S2.segText.AB = () => String(ans); S2.segTextColour.AB = GREEN },
      })
    },
    done: inputRight,
    walk: hypWalk(p, q),
  }
}

/** Find a short side, given the hypotenuse h and the other short side p. The longer short side runs across. */
function legQ(id: string, p: number, h: number, ans: number): Beat {
  const unknown: "CA" | "CB" = ans >= p ? "CB" : "CA"
  const known: "CA" | "CB" = unknown === "CB" ? "CA" : "CB"
  const name = unknown === "CA" ? "a" : "b"
  return {
    id,
    say: "Find the missing side.",
    enter: S => {
      qTri(S, unknown === "CA" ? ans : p, unknown === "CB" ? ans : p, { [known]: String(p), AB: String(h) }, unknown)
      look(S, ["grid", "arcs", "lengths", "line", "keypad"])
      ask(S, [`${name} =`, { box: true }], ans, {
        help: (S2, t) => {
          slips(S2, h, p)
          S2.pulseSegs = new Set(["AB"])
          if (t >= 2) remind(S2, `${name}^2 = ${c(GREEN, String(h))}^2 - ${c(known === "CA" ? BLUE : ORANGE, String(p))}^2`)
        },
        onRight: S2 => { S2.segText[unknown] = () => String(ans); S2.segTextColour[unknown] = GREEN },
      })
    },
    done: inputRight,
    walk: legWalk(h, p, unknown),
  }
}

/** Every side length the student can see, rounded as shown. */
function sidesShown(S: Scene): number[] {
  return [legA(S), legB(S), Number(numText(Math.sqrt(sq2(S, "A", "B"))))]
}

/** The triangle for building: corners on whole squares, lengths showing. */
function buildBoard(S: Scene, max: number) {
  triBoard(S, { colours: true, max })
  S.frameFn = null
  S.frame = { x0: -1.5, x1: max + 1.5, y0: -1.5, y1: max + 1.2 }
  lengths(S)
  S.movable = ["A", "B"]; S.constrain = { A: upFrom(max), B: acrossFrom(max) }; S.mode = "slide"
}

/** Make the hypotenuse's square come to `c2` (it clicks there). */
function makeTo(id: string, text: string, c2: number, max: number): Beat {
  return {
    id,
    say: text,
    enter: S => {
      buildBoard(S, max)
      // never open already done
      if (sq2(S, "A", "B") === c2) setLegs(S, 2, 2)
      S.chips = [{ tex: `c = ${Math.round(Math.sqrt(c2))}`, test: S2 => sq2(S2, "A", "B") === c2 }]
      S.lockWhen = S2 => sq2(S2, "A", "B") === c2
      // close but not there: say so, so a near miss never looks like a broken board
      S.releaseNote = S2 => {
        const d = Math.sqrt(sq2(S2, "A", "B")) - Math.sqrt(c2)
        return Math.abs(d) < 0.35 && d !== 0 ? `Close. The hypotenuse must be exactly $${Math.round(Math.sqrt(c2))}$.` : null
      }
      look(S, ["grid", "arcs", "lengths", "line"])
    },
    done: S => S.locked,
  }
}

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["corner", "Right-angled triangles"],
  ["build-squares", "Squares on the sides"],
  ["copies", "Why it works"],
  ["unlock", "Only with a right angle"],
  ["six-eight", "Finding the hypotenuse"],
  ["ten-six", "Finding a shorter side"],
  ["exam-PQRS", "Exam questions"],
  ["make-5", "Make the triangle"],
]
applyParts(BEATS, PARTS)
