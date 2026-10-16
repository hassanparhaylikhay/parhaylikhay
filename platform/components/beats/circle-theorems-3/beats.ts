/**
 * Circle theorems III: chords and the centre, one tiny idea per beat. The
 * student draws a circle and a chord, finds its middle, and draws the line
 * through the middle at 90°: it runs through the centre (and the fold of
 * isosceles triangle OAB shows why). They find a hidden centre with two
 * chords, measure how far a chord is from the centre, and find that equal
 * chords are the same distance away (turn one onto the other). Pythagoras
 * links half the chord, the distance and the radius. Practice from past
 * papers, build to order, and one chord that cannot exist.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { RAD, DEG } from "../geometry"
import type { WalkStep } from "../walk"
import {
  type Scene, type EqPart, type VisKey, type AngSpec, type Bisector,
  BLUE, ORANGE, PINK, GREEN, NEUTRAL, CHALK,
  resetBeat, show, say, startInput, ensureCircle, place, setSegs, layout, joined,
  turn, midOf, slideOn, chordArc, chordCm, distCm, cmText, arcForLength, arcForDist, cmBetween, sliderAngle,
} from "./scene"

export interface Beat {
  id: string
  /** This beat starts a new part of the lesson: its title comes up first (chapter.ts). */
  chapter?: string
  /** The one phrase on screen. $...$ is KaTeX. */
  say: string
  enter: (S: Scene) => void
  /** A doing beat finishes itself when this turns true. */
  done?: (S: Scene) => boolean
  /** Continue button: "" is a plain arrow; undefined means none. */
  cta?: string
  /** Seconds before the button appears. */
  ctaAfter?: number
  /** A playing beat: when done, the arrow appears and the student chooses when to go on. */
  free?: boolean
  /** Seconds of play before a playing beat offers to move on. */
  minPlay?: number
  /** Milliseconds a finished doing beat waits before moving on (default 1800). */
  advanceAfter?: number
  restart?: boolean
  /** "Show me how": the worked solution, one step at a time, for a student who is stuck */
  walk?: WalkStep<Scene>[]
}

const deg = (n: number) => `${n}^\\circ`
const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const Q = c(PINK, "?")
const CM = "\\text{ cm}"

// ── small builders ───────────────────────────────────────────────────────

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

const inputRight = (S: Scene) => S.input?.state === "right"
const movedAll = (d: number) => (S: Scene) => !S.drag && S.moved >= d

function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

/** Start a beat: clean the board down, keep the student's circle. */
function base(S: Scene, letters: string[] = ["O"]) {
  resetBeat(S)
  ensureCircle(S)
  S.at = {}
  S.slider = null
  S.bisectors = []
  S.letters = new Set(letters)
  S.oVis.t = 1
}

function ask(S: Scene, parts: EqPart[], answer: number, opts: { deg?: boolean; onRight?: (S: Scene) => void; help?: (S: Scene, tries: number) => void } = {}) {
  startInput(S, { parts, answer, hints: [], deg: opts.deg, onRight: opts.onRight, help: opts.help })
}

/** A reminder line under the equation, never the worked answer. */
function remind(S: Scene, tex: string) {
  if (S.input) S.input.hints = [tex]
}

function only(S: Scene, ids: string[]) {
  S.show = new Set(ids)
}
function reveal(S: Scene, id: string) {
  if (S.show !== "all") S.show.add(id)
}

/** Givens in their colours, the unknown pink and breathing. */
function given(S: Scene, known: Record<string, string>, unknown: string) {
  only(S, [...Object.keys(known), unknown])
  S.fixed = { ...S.fixed, ...known, [unknown]: PINK }
  S.label = { ...S.label, [unknown]: "?" }
  S.pulse = new Set([unknown])
}

function solved(S: Scene, id: string) {
  delete S.label[id]
  S.fixed[id] = GREEN
  S.pulse = new Set()
}

/** Show the true value where the "?" was (the walkthrough's last step). */
function uncover(S: Scene, id: string) {
  delete S.label[id]
  S.pulse = new Set([id])
}

/** A right angle at V, between the lines to X and Y (no number: the square says it). */
function rightAt(S: Scene, id: string, V: string, X: string, Y: string): AngSpec {
  S.label[id] = ""
  S.fixed[id] = S.fixed[id] ?? NEUTRAL
  return { id, at: V, from: X, to: Y, value: () => 90 }
}

/** An angle at the centre between the lines to X and Y, the small way round. */
const atO = (id: string, X: string, Y: string, value: (S: Scene) => number = S => Math.round(chordArc(S, X, Y) * DEG)): AngSpec =>
  ({ id, at: "O", from: X, to: Y, value })

function addSegs(S: Scene, segs: [string, string][]) {
  S.segs = [...S.segs, ...segs.map(([a, b]) => ({ id: a + b, a, b }))]
}

/** The perpendicular bisector of chord a-b. */
function bisector(a: string, b: string, extra: Partial<Bisector> = {}): Bisector {
  return { a, b, colour: CHALK, grow: null, ...extra }
}

const lenOf = (X: string, Y: string) => (S: Scene) => cmText(chordCm(S, X, Y))
const distOf = (X: string, Y: string) => (S: Scene) => (distCm(S, X, Y) < 0.05 ? "" : cmText(distCm(S, X, Y)))

// ── the student's chord ──────────────────────────────────────────────────

/** The student's chord AB if it is a comfortable one, otherwise a good one below the centre. */
function ensureChord(S: Scene, minDeg = 50, maxDeg = 150) {
  const a = S.pts.A !== undefined && S.pts.B !== undefined ? chordArc(S, "A", "B") * DEG : -1
  if (a < minDeg || a > maxDeg) place(S, { A: 150, B: 30 })
}

/** Where the middle of chord XY points from the centre (radians). */
function midDir(S: Scene, X: string, Y: string) {
  return S.pts[Y] + turn(S.pts[Y], S.pts[X]) / 2
}

/** Set chord XY round its own middle to a centre angle of `arc` (radians); it glides there. */
function setArc(S: Scene, X: string, Y: string, arc: number) {
  const m = midDir(S, X, Y)
  const s = Math.sign(turn(S.pts[Y], S.pts[X])) || 1
  S.pts[X] = m + (s * arc) / 2
  S.pts[Y] = m - (s * arc) / 2
}

/** The chord AB on the board. `mid`: its midpoint M is marked. `halves`: drawn as AM and MB. */
function chordBoard(S: Scene, opts: { mid?: boolean; halves?: boolean; letters?: string[] } = {}) {
  base(S, opts.letters ?? ["O", "A", "B", ...(opts.mid ? ["M"] : [])])
  ensureChord(S)
  S.showPts = ["A", "B"]
  setSegs(S, [["A", "B"]])
  if (opts.mid || opts.halves) {
    S.at.M = midOf("A", "B")
    S.showPts = ["A", "B", "M"]
  }
  if (opts.halves) setSegs(S, [["A", "M"], ["M", "B"]])
}

/** The chord, its midpoint, the right angle there, and the whole perpendicular bisector. */
function perpBoard(S: Scene) {
  chordBoard(S, { mid: true, halves: true })
  S.ticks = ["AM", "MB"]
  S.angles = [rightAt(S, "rM", "M", "O", "A")]
  S.bisectors = [bisector("A", "B")]
}

/** The chord with O joined to both ends: triangle OAB. */
function triBoard(S: Scene) {
  chordBoard(S, { mid: true, halves: true })
  addSegs(S, [["O", "A"], ["O", "B"]])
}

/** Triangle OAM folding over OM onto OBM. */
function foldBoard(S: Scene) {
  triBoard(S)
  addSegs(S, [["O", "M"]])
  S.segDash = new Set(["OM"])
  S.ticks = ["OA", "OB"]
  S.fold = { axis: ["O", "M"], tri: ["O", "A", "M"], moving: "A", colour: BLUE }
  S.foldAt = S.time
}

/** X on the chord, joined to O. Keeps where the student left X unless told otherwise. */
function sliderBoard(S: Scene, t: number, snapMid: boolean, force = false) {
  const keep = !force && S.slider?.name === "X" ? S.slider.t : null
  chordBoard(S, { letters: ["O", "A", "B", "X"] })
  slideOn(S, "X", "A", "B", keep ?? t, snapMid)
  S.showPts = ["A", "B", "X"]
  setSegs(S, [["A", "X"], ["X", "B"], ["O", "X"]])
  S.segDash = new Set(["OX"])
}

/** The angle at X between XO and XA: exactly 90 in the middle. */
const xAngle = (S: Scene) => (S.slider && S.slider.t === 0.5 ? 90 : Math.round(sliderAngle(S, S.slider?.t ?? 0.5)))

/** X with its angle live and the two pieces of the chord in cm. */
function xBoard(S: Scene, t: number, snapMid: boolean, force = false) {
  sliderBoard(S, t, snapMid, force)
  S.angles = [{ id: "X", at: "X", from: "O", to: "A", value: xAngle }]
  S.fixed = { X: BLUE }
  S.segText = { AX: S2 => cmText(cmBetween(S2, "A", "X")), XB: S2 => cmText(cmBetween(S2, "X", "B")) }
}

/** X on the chord with the length OX live. */
function oxBoard(S: Scene, t: number, snapMid: boolean, force = false) {
  sliderBoard(S, t, snapMid, force)
  S.segColour = { OX: BLUE }
  S.segText = { OX: S2 => cmText(cmBetween(S2, "O", "X")) }
  S.segTextColour = { OX: BLUE }
}

/** The chord with its length and its distance from the centre, both live. */
function lengthBoard(S: Scene) {
  chordBoard(S, { mid: true, letters: ["O", "A", "B"] })
  addSegs(S, [["O", "M"]])
  S.segDash = new Set(["OM"])
  S.segColour = { OM: BLUE }
  S.angles = [rightAt(S, "rM", "M", "O", "A")]
  S.segText = { AB: lenOf("A", "B"), OM: distOf("A", "B") }
  S.segTextColour = { AB: CHALK, OM: BLUE }
  S.segTextAt = { AB: 0.78 }
  S.segTextIn = new Set(["AB"])
}

// ── two chords ───────────────────────────────────────────────────────────

/** Put chord CD opposite AB, with a centre angle of `arcDeg`. */
function cdOpposite(S: Scene, arcDeg: number) {
  const m = midDir(S, "A", "B") + Math.PI
  S.pts.C = m + (arcDeg * RAD) / 2
  S.pts.D = m - (arcDeg * RAD) / 2
  if (S.ptsD.C === undefined) S.ptsD.C = S.pts.C
  if (S.ptsD.D === undefined) S.ptsD.D = S.pts.D
}

/** CD where the student left it, unless it is missing or sits on AB. */
function ensureCD(S: Scene, arcDeg = 80) {
  const near = (n: string) => ["A", "B"].some(o => Math.abs(turn(S.pts[n], S.pts[o])) < 8 * RAD)
  if (S.pts.C === undefined || S.pts.D === undefined || near("C") || near("D")) cdOpposite(S, arcDeg)
}

/** Make CD exactly as long as AB, keeping C where it is. */
function matchCD(S: Scene) {
  const arc = chordArc(S, "A", "B")
  const cur = turn(S.pts.C, S.pts.D)
  if (Math.abs(Math.abs(cur) - arc) > 0.05 * RAD) S.pts.D = S.pts.C + (Math.sign(cur) || -1) * arc
}

/** Both chords, AB blue and CD orange, with their lengths. */
function twoChords(S: Scene, letters = ["O", "A", "B", "C", "D"]) {
  base(S, letters)
  ensureChord(S, 60, 140)
  ensureCD(S)
  S.showPts = ["A", "B", "C", "D"]
  setSegs(S, [["A", "B"], ["C", "D"]])
  S.segColour = { AB: BLUE, CD: ORANGE }
  S.segText = { AB: lenOf("A", "B"), CD: lenOf("C", "D") }
  S.segTextColour = { AB: BLUE, CD: ORANGE }
  S.segTextAt = { AB: 0.78, CD: 0.78 }
  S.segTextIn = new Set(["AB", "CD"])
}

/** Two equal chords with their distances from the centre. */
function equalBoard(S: Scene) {
  twoChords(S)
  matchCD(S)
  S.at.M = midOf("A", "B")
  S.at.N = midOf("C", "D")
  S.showPts = ["A", "B", "C", "D", "M", "N"]
  addSegs(S, [["O", "M"], ["O", "N"]])
  S.segDash = new Set(["OM", "ON"])
  S.segColour = { ...S.segColour, OM: BLUE, ON: ORANGE }
  S.segText = { ...S.segText, OM: distOf("A", "B"), ON: distOf("C", "D") }
  S.segTextColour = { ...S.segTextColour, OM: BLUE, ON: ORANGE }
  S.angles = [rightAt(S, "rM", "M", "O", "A"), rightAt(S, "rN", "N", "O", "C")]
  S.ticks = ["AB", "CD"]
}

/** Where CD was before the student turned it onto AB. */
let beforeTurn: { C: number; D: number } | null = null

/** Which end of CD lands on which end of AB: the way the chord already points. */
function landing(S: Scene): Record<string, string> {
  const same = Math.sign(turn(S.pts.C, S.pts.D)) === Math.sign(turn(S.pts.A, S.pts.B))
  return same ? { C: "A", D: "B" } : { C: "B", D: "A" }
}

/** A magnet that clicks chord XY to a given centre angle, on the side the moved end is on. */
const arcSnap = (arc: number, X: string, Y: string) => (S: Scene, name: string, a: number) => {
  if (name !== X && name !== Y) return null
  const other = name === X ? Y : X
  const side = Math.sign(turn(S.pts[other], S.pts[name])) || 1
  const t = S.pts[other] + side * arc
  if (Math.abs(turn(a, t)) > 2.5 * RAD) return null
  // never onto another point
  const clash = S.showPts.some(n => n !== name && n !== other && S.pts[n] !== undefined && !S.at[n] && Math.abs(turn(t, S.pts[n])) < 8 * RAD)
  return clash ? null : t
}

/** The pair for building: AB fixed at 8 cm, CD the student's to move, with lengths and distances. */
function buildTwo(S: Scene, cdArcDeg: number) {
  twoChords(S, ["O", "A", "B", "C", "D", "N"])
  setArc(S, "A", "B", arcForLength(8))
  ensureCD(S, cdArcDeg)
  S.at.M = midOf("A", "B")
  S.at.N = midOf("C", "D")
  S.showPts = ["A", "B", "C", "D", "M", "N"]
  addSegs(S, [["O", "M"], ["O", "N"]])
  S.segDash = new Set(["OM", "ON"])
  S.segColour = { ...S.segColour, OM: BLUE, ON: ORANGE }
  S.segText = { ...S.segText, OM: distOf("A", "B"), ON: distOf("C", "D") }
  S.segTextColour = { ...S.segTextColour, OM: BLUE, ON: ORANGE }
  S.angles = [rightAt(S, "rM", "M", "O", "A"), rightAt(S, "rN", "N", "O", "C")]
}

// ── the right-angled triangle inside ─────────────────────────────────────

/** An 8 cm chord below the centre: half of it 4, its distance 3, the radius 5. */
function pythBoard(S: Scene) {
  base(S, ["O", "A", "B", "M"])
  const half = Math.asin(0.8) * DEG
  place(S, { A: 90 + half, B: 90 - half })
  S.at.M = midOf("A", "B")
  S.showPts = ["A", "B", "M"]
  setSegs(S, [["M", "B"], ["A", "M"], ["O", "M"], ["O", "A"]])
  S.segColour = { OM: BLUE, AM: ORANGE, OA: GREEN }
  S.segText = { OM: () => cmText(3), AM: () => cmText(4), OA: () => cmText(5) }
  S.segTextColour = { OM: BLUE, AM: ORANGE, OA: GREEN }
  S.fills = [{ pts: ["O", "M", "A"], color: BLUE }]
  S.angles = [rightAt(S, "rM", "M", "O", "A")]
}

// ── exam figures ─────────────────────────────────────────────────────────

/** s13_11 Q5: chord PQ, X its midpoint, OX = 6, radius 10. */
function examPQ(S: Scene) {
  base(S, ["O", "P", "Q", "X"])
  const half = Math.acos(0.6) * DEG
  place(S, { P: 72 + half, Q: 72 - half })
  S.at.X = midOf("P", "Q")
  S.showPts = ["P", "Q", "X"]
  setSegs(S, [["P", "X"], ["X", "Q"], ["O", "X"]])
  S.ticks = ["PX", "XQ"]
  S.segColour = { OX: BLUE }
  S.segText = { OX: () => `6${CM}` }
  S.segTextColour = { OX: BLUE }
  S.angles = [rightAt(S, "rX", "X", "O", "P")]
  only(S, [])
}

/** The radius OP (10 cm) and the right-angled triangle OXP, for the help. */
function pqTriangle(S: Scene) {
  if (!S.segs.some(s => s.id === "OP")) addSegs(S, [["O", "P"]])
  S.segColour = { ...S.segColour, OP: GREEN }
  S.segText = { ...S.segText, OP: () => `10${CM}` }
  S.segTextColour = { ...S.segTextColour, OP: GREEN }
  S.fills = [{ pts: ["O", "X", "P"], color: BLUE }]
  reveal(S, "rX")
}

/** w13_22 Q4(a): chords AB and BC, D and E their midpoints, angle ABC = 108. */
function examDOE(S: Scene) {
  base(S, ["O", "A", "B", "C", "D", "E"])
  place(S, { A: 138, B: -120, C: -78 })
  S.at.D = midOf("A", "B")
  S.at.E = midOf("B", "C")
  S.showPts = ["A", "B", "C", "D", "E"]
  setSegs(S, [["A", "B"], ["B", "C"], ["O", "D"], ["O", "E"]])
  S.angles = [
    { id: "ABC", at: "B", from: "A", to: "C", value: () => 108 },
    rightAt(S, "ODB", "D", "O", "B"),
    rightAt(S, "OEB", "E", "O", "B"),
    atO("DOE", "D", "E", () => 72),
  ]
}

/** s19_12 Q24: A, B, C on the circle, AB = BC, P and Q the midpoints. */
function examABC(S: Scene) {
  base(S, ["O", "A", "B", "C", "P", "Q"])
  place(S, { A: -110, B: 0, C: 110 })
  S.at.P = midOf("A", "B")
  S.at.Q = midOf("B", "C")
  S.showPts = ["A", "B", "C", "P", "Q"]
  setSegs(S, [["A", "B"], ["B", "C"], ["O", "A"], ["O", "B"], ["O", "C"], ["O", "P"], ["O", "Q"]])
  S.ticks = ["AB", "BC"]
  S.angles = [
    { id: "COA", at: "O", from: "C", to: "A", avoid: "B", value: () => 140 },
    { id: "AOB", at: "O", from: "A", to: "B", avoid: "C", value: () => 110, r: 0.8 },
    { id: "BOC", at: "O", from: "B", to: "C", avoid: "A", value: () => 110, r: 0.8 },
    { id: "QCO", at: "C", from: "Q", to: "O", value: () => 35 },
  ]
}

/** w19_12 Q7(a): two equal chords; the line of symmetry runs halfway between them. */
const SYM = { E: -138, F: -56, G: 7, H: 89 }
const SYM_DIR = ((-97 + 48) / 2) * RAD

// ── the beats ────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. The middle of a chord ──
  {
    id: "place",
    say: "Tap to place the centre.",
    enter: S => {
      resetBeat(S)
      S.O = null; S.OD = null; S.drawn = false; S.sweep = null; S.R = 0; S.RD = 0
      S.pts = {}; S.ptsD = {}; S.at = {}; S.slider = null; S.bisectors = []; S.showPts = []; S.segs = []; S.letters = new Set()
      S.oVis.t = 1
      S.mode = "place"
      look(S, [])
    },
    done: S => S.O !== null,
    advanceAfter: 700,
  },
  {
    id: "compass",
    say: "Now drag out to draw your circle.",
    enter: S => {
      resetBeat(S)
      const L = layout(S)
      if (!S.O) { S.O = [L.centre[0], L.centre[1]]; S.OD = [L.centre[0], L.centre[1]] }
      S.drawn = false; S.sweep = null; S.R = 0; S.RD = 0
      S.at = {}; S.slider = null; S.bisectors = []; S.showPts = []; S.segs = []; S.letters = new Set()
      S.oVis.t = 1
      S.drewOnce = false
      S.mode = "compass"
      look(S, [])
    },
    done: S => S.drawn,
    advanceAfter: 900,
  },
  {
    id: "draw-chord",
    say: "Draw a line across the circle that misses $O$.",
    enter: S => {
      base(S, ["O"])
      S.showPts = []; S.segs = []
      delete S.pts.A; delete S.pts.B; delete S.ptsD.A; delete S.ptsD.B
      S.chordNames = ["A", "B"]
      S.drewOnce = false
      S.mode = "drawChord"
      look(S, ["letters"])
    },
    done: S => S.segs.some(s => s.id === "AB"),
  },
  watch("ends", "That's a chord. Its ends are $A$ and $B$.", S => {
    chordBoard(S)
    look(S, ["letters"])
  }),
  {
    id: "tap-mid",
    say: "Tap the middle of the chord.",
    enter: S => {
      chordBoard(S)
      S.chordOf = ["A", "B"]
      S.pulseSegs = new Set(["AB"])
      S.mode = "tapMid"
      look(S, ["letters"])
    },
    done: S => S.got.has("mid"),
    advanceAfter: 1200,
  },
  watch("midpoint", "This is the *midpoint*, $M$. The two halves are equal.", S => {
    chordBoard(S, { mid: true, halves: true })
    S.ticks = ["AM", "MB"]
    look(S, ["letters", "ticks"])
  }, 2.2),
  {
    id: "draw-perp",
    say: "Draw a line through $M$ at $90^\\circ$ to the chord.",
    enter: S => {
      chordBoard(S, { mid: true, halves: true })
      S.ticks = ["AM", "MB"]
      S.chordOf = ["A", "B"]
      S.drewOnce = false
      S.mode = "drawPerp"
      look(S, ["letters", "ticks"])
    },
    done: S => S.got.has("perp"),
    advanceAfter: 1000,
  },
  watch("where", "Watch where it goes.", S => {
    chordBoard(S, { mid: true, halves: true })
    S.ticks = ["AM", "MB"]
    S.angles = [rightAt(S, "rM", "M", "O", "A")]
    S.bisectors = [bisector("A", "B", { grow: S.time + 0.4, ringOnReach: true })]
    look(S, ["letters", "ticks", "arcs"])
  }, 2.8),
  watch("through-O", "It goes through the centre.", S => {
    perpBoard(S)
    S.pulseO = true
    look(S, ["letters", "ticks", "arcs"])
  }),
  {
    id: "move-AB",
    say: "Move $A$ and $B$. Watch the line.",
    enter: S => {
      perpBoard(S)
      S.movable = ["A", "B"]; S.minGap = 24; S.mode = "slide"
      look(S, ["letters", "ticks", "arcs"])
    },
    done: movedAll(120), free: true, minPlay: 7,
  },
  watch("perpendicular", "It meets the chord at $90^\\circ$. It's *perpendicular* to the chord.", S => {
    perpBoard(S)
    S.pulse = new Set(["rM"])
    look(S, ["letters", "ticks", "arcs"])
  }, 2.2),
  watch("bisects", "It cuts the chord in half. It *bisects* the chord.", S => {
    perpBoard(S)
    S.pulseSegs = new Set(["AM", "MB"])
    say(S, "Bisect means cut into two equal parts.", "calm", 600)
    look(S, ["letters", "ticks", "arcs"])
  }, 2.2),
  watch("perp-bisector", "So it's the *perpendicular bisector* of the chord.", S => {
    perpBoard(S)
    S.bisectors[0].pulse = true
    look(S, ["letters", "ticks", "arcs"])
  }, 2.2),
  watch("rule-centre", "The perpendicular bisector of a chord passes through the centre.", S => {
    perpBoard(S)
    S.pulseO = true
    look(S, ["letters", "ticks", "arcs"])
  }, 2.4),

  // ── 2. Why it goes through the centre ──
  {
    id: "join-OAB",
    say: "Join $O$ to $A$ and to $B$.",
    enter: S => {
      chordBoard(S, { mid: true, halves: true })
      S.joinNeed = [["O", "A"], ["O", "B"]]
      S.joinHint = "Join $O$ to $A$, then $O$ to $B$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters"])
    },
    done: joined,
  },
  watch("radii", "$OA$ and $OB$ are both radii, so they're equal.", S => {
    triBoard(S)
    S.ticks = ["OA", "OB"]
    S.pulseSegs = new Set(["OA", "OB"])
    say(S, "Radii means more than one radius.", "calm", 600)
    look(S, ["letters", "ticks"])
  }, 2.2),
  watch("isosceles", "So triangle $OAB$ is isosceles.", S => {
    triBoard(S)
    S.ticks = ["OA", "OB"]
    S.fills = [{ pts: ["O", "A", "B"], color: BLUE }]
    look(S, ["letters", "ticks"])
  }),
  watch("fold", "Fold it along $OM$.", S => {
    foldBoard(S)
    look(S, ["letters", "ticks"])
  }, 3.4),
  watch("lands", "$A$ lands on $B$, and the two halves match.", S => {
    foldBoard(S)
    S.ticks = ["OA", "OB", "AM:2", "MB:2"]
    look(S, ["letters", "ticks"])
  }, 2.6),
  watch("so-90", "So $OM$ meets the chord at $90^\\circ$ and cuts it in half.", S => {
    triBoard(S)
    addSegs(S, [["O", "M"]])
    S.segDash = new Set(["OM"])
    S.ticks = ["AM:2", "MB:2"]
    S.angles = [rightAt(S, "rM", "M", "O", "A")]
    S.pulse = new Set(["rM"])
    look(S, ["letters", "ticks", "arcs"])
  }, 2.4),
  {
    id: "fold-play",
    say: "Move $A$ and $B$. The halves always match.",
    enter: S => {
      foldBoard(S)
      S.ticks = ["OA", "OB", "AM:2", "MB:2"]
      S.movable = ["A", "B"]; S.minGap = 30; S.mode = "slide"
      look(S, ["letters", "ticks"])
    },
    done: movedAll(100), free: true, minPlay: 6,
  },
  watch("point-X", "Here's a point $X$ on the chord, joined to $O$.", S => {
    xBoard(S, 0.25, false, true)
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "slide-X",
    say: "Slide $X$ until the angle at $X$ is $90^\\circ$.",
    enter: S => {
      xBoard(S, 0.25, true)
      if (S.slider && S.slider.t === 0.5) S.slider.t = 0.25
      S.movable = ["X"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.locked,
  },
  watch("middle", "At $90^\\circ$, $X$ is exactly in the middle.", S => {
    xBoard(S, 0.5, true, true)
    S.ticks = ["AX", "XB"]
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  watch("rule-half", "A line from $O$ at $90^\\circ$ to a chord cuts it in half.", S => {
    xBoard(S, 0.5, true, true)
    S.ticks = ["AX", "XB"]
    S.pulse = new Set(["X"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.4),
  watch("rule-90", "A line from $O$ to the middle of a chord meets it at $90^\\circ$.", S => {
    xBoard(S, 0.5, true, true)
    S.ticks = ["AX", "XB"]
    S.pulseSegs = new Set(["AX", "XB"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.4),
  {
    id: "q-OMA",
    say: "$M$ is the midpoint of $AB$. Find angle $OMA$.",
    enter: S => {
      base(S, ["O", "A", "B", "M"])
      place(S, { A: 146, B: 34 })
      S.at.M = midOf("A", "B")
      S.showPts = ["A", "B", "M"]
      setSegs(S, [["A", "M"], ["M", "B"], ["O", "M"]])
      S.ticks = ["AM", "MB"]
      S.angles = [{ id: "OMA", at: "M", from: "O", to: "A", value: () => 90 }]
      look(S, ["letters", "arcs", "values", "ticks", "line", "keypad"])
      given(S, {}, "OMA")
      ask(S, [Q, "=", { box: true }], 90, {
        deg: true,
        help: S2 => { S2.pulseSegs = new Set(["OM"]) },
        onRight: S2 => solved(S2, "OMA"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$M$ is the middle of chord $AB$.", show: S => { S.pulseSegs = new Set(["AM", "MB"]) } },
      { say: "A line from $O$ to the middle of a chord meets it at $90^\\circ$.", show: S => { S.pulseSegs = new Set(["OM"]) } },
      { say: "So angle $OMA$ is $90^\\circ$.", tex: `${Q} = ${c(GREEN, deg(90))}`, show: S => uncover(S, "OMA") },
    ],
  },
  {
    id: "q-AOM",
    say: "Angle $OAB$ is $34^\\circ$. Find angle $AOM$.",
    enter: S => {
      base(S, ["O", "A", "B", "M"])
      place(S, { A: 146, B: 34 })
      S.at.M = midOf("A", "B")
      S.showPts = ["A", "B", "M"]
      setSegs(S, [["A", "M"], ["M", "B"], ["O", "M"], ["O", "A"]])
      S.ticks = ["AM", "MB"]
      S.angles = [
        { id: "OAM", at: "A", from: "O", to: "M", value: () => 34 },
        rightAt(S, "OMA", "M", "O", "A"),
        atO("AOM", "A", "M", () => 56),
      ]
      look(S, ["letters", "arcs", "values", "ticks", "line", "keypad"])
      given(S, { OAM: BLUE }, "AOM")
      ask(S, [Q, "=", { box: true }], 56, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "OMA"); S2.pulse = new Set(["OMA", "AOM"])
          S2.fills = [{ pts: ["O", "A", "M"], color: BLUE }]
          if (t >= 2) remind(S2, `${c(BLUE, deg(34))} + 90^\\circ + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "AOM"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$OM$ goes to the middle of the chord, so angle $OMA$ is $90^\\circ$.", show: S => { reveal(S, "OMA"); S.pulse = new Set(["OMA"]) } },
      { say: "The angles of triangle $OAM$ add up to $180^\\circ$.", tex: `${c(BLUE, deg(34))} + 90^\\circ + ${Q} = ${c(GREEN, deg(180))}`, show: S => { S.fills = [{ pts: ["O", "A", "M"], color: BLUE }]; S.pulse = new Set(["OAM", "OMA", "AOM"]) } },
      { say: "So angle $AOM$ is $56^\\circ$.", tex: `${Q} = 180^\\circ - 90^\\circ - 34^\\circ = ${c(GREEN, deg(56))}`, show: S => { S.fills = []; uncover(S, "AOM") } },
    ],
  },

  // ── 3. Finding a lost centre ──
  watch("hide-O", "Let's hide the centre.", S => {
    base(S, [])
    S.showPts = []; S.segs = []
    S.oVis.t = 0
    look(S, [])
  }, 2),
  {
    id: "chord-1",
    say: "Draw a chord.",
    enter: S => {
      base(S, [])
      S.oVis.t = 0
      S.showPts = []; S.segs = []
      for (const n of ["E", "F", "G", "H"]) { delete S.pts[n]; delete S.ptsD[n] }
      S.chordNames = ["E", "F"]; S.chordFree = true
      S.drewOnce = false
      S.mode = "drawChord"
      look(S, [])
    },
    done: S => S.segs.some(s => s.id === "EF"),
    advanceAfter: 900,
  },
  watch("bis-1", "The centre is somewhere on its perpendicular bisector.", S => {
    lostBoard(S, 1)
    S.bisectors = [bisector("E", "F", { colour: BLUE, dashed: true, grow: S.time + 0.3 })]
    look(S, [])
  }, 2.6),
  {
    id: "chord-2",
    say: "Draw another chord, pointing a different way.",
    enter: S => {
      lostBoard(S, 1)
      S.bisectors = [bisector("E", "F", { colour: BLUE, dashed: true })]
      delete S.pts.G; delete S.pts.H; delete S.ptsD.G; delete S.ptsD.H
      S.chordNames = ["G", "H"]; S.chordFree = true; S.chordDiffer = ["E", "F"]
      S.drewOnce = false
      S.mode = "drawChord"
      look(S, [])
    },
    done: S => S.segs.some(s => s.id === "GH"),
    advanceAfter: 900,
  },
  watch("bis-2", "The centre is on this line too.", S => {
    lostBoard(S, 2)
    S.bisectors = [
      bisector("E", "F", { colour: BLUE, dashed: true }),
      bisector("G", "H", { colour: ORANGE, dashed: true, grow: S.time + 0.3 }),
    ]
    look(S, [])
  }, 2.6),
  watch("found", "So the centre is where they cross.", S => {
    lostBoard(S, 2)
    S.bisectors = [bisector("E", "F", { colour: BLUE, dashed: true }), bisector("G", "H", { colour: ORANGE, dashed: true })]
    S.oVis.t = 1
    S.oRing = S.time + 0.3
    S.pulseO = true
    S.letters = new Set(["O"])
    look(S, ["letters"])
  }, 2.4),
  {
    id: "move-chords",
    say: "Move the chords. They always cross at the centre.",
    enter: S => {
      lostBoard(S, 2)
      S.bisectors = [bisector("E", "F", { colour: BLUE, dashed: true }), bisector("G", "H", { colour: ORANGE, dashed: true })]
      S.oVis.t = 1
      S.letters = new Set(["O"])
      S.movable = ["E", "F", "G", "H"]; S.crossOK = new Set(["E", "F", "G", "H"]); S.minGap = 6; S.mode = "slide"
      look(S, ["letters"])
    },
    done: movedAll(150), free: true, minPlay: 7,
  },

  // ── 4. How far a chord is from the centre ──
  watch("how-far", "Here's a chord. How far is it from $O$?", S => {
    chordBoard(S)
    addSegs(S, [["O", "A"]])
    S.segText = { OA: () => cmText(5) }
    look(S, ["letters"])
  }, 2.2),
  {
    id: "slide-OX",
    say: "Slide $X$ along the chord. Watch the length $OX$.",
    enter: S => {
      oxBoard(S, 0.2, false, true)
      S.movable = ["X"]; S.mode = "slide"
      look(S, ["letters"])
    },
    done: S => !S.drag && (S.movedBy.X ?? 0) > 120, free: true, minPlay: 6,
  },
  {
    id: "shortest",
    say: "Make $OX$ as short as you can.",
    enter: S => {
      oxBoard(S, 0.2, true)
      if (S.slider && Math.abs(S.slider.t - 0.5) < 0.12) S.slider.t = 0.2
      S.movable = ["X"]; S.mode = "slide"
      look(S, ["letters"])
    },
    done: S => S.locked,
  },
  watch("shortest-is", "The shortest is at the middle, at $90^\\circ$.", S => {
    oxBoard(S, 0.5, true, true)
    S.angles = [rightAt(S, "rX", "X", "O", "A")]
    S.ticks = ["AX", "XB"]
    S.pulse = new Set(["rX"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.2),
  watch("distance", "That's the chord's distance from the centre.", S => {
    lengthBoard(S)
    S.segText = { OM: distOf("A", "B") }
    S.pulseSegs = new Set(["OM"])
    say(S, "Distance always means the shortest way.", "calm", 600)
    look(S, ["letters", "arcs"])
  }, 2.2),
  {
    id: "longer",
    say: "Make the chord longer. Watch the distance.",
    enter: S => {
      lengthBoard(S)
      S.movable = ["A", "B"]; S.minGap = 12; S.mode = "slide"
      look(S, ["letters", "arcs"])
    },
    done: movedAll(80), free: true, minPlay: 6,
  },
  {
    id: "longest",
    say: "Make it as long as you can.",
    enter: S => {
      lengthBoard(S)
      if (chordArc(S, "A", "B") * DEG > 165) setArc(S, "A", "B", 120 * RAD)
      S.movable = ["A", "B"]; S.minGap = 12; S.mode = "slide"
      // a diameter is a magnet: close to straight across, the moved end clicks there
      S.snapFn = (S2, name, a) => {
        const other = name === "A" ? "B" : "A"
        const t = S2.pts[other] + Math.PI
        return Math.abs(turn(a, t)) < 7 * RAD ? t : null
      }
      look(S, ["letters", "arcs"])
    },
    done: S => S.locked,
  },
  watch("diameter", "The longest chord is a diameter. It goes through $O$.", S => {
    lengthBoard(S)
    if (Math.abs(chordArc(S, "A", "B") - Math.PI) > 0.01) S.pts.B = S.pts.A + Math.PI
    S.pulseSegs = new Set(["AB"])
    look(S, ["letters", "arcs"])
  }, 2.2),
  {
    id: "short",
    say: "Now make it really short.",
    enter: S => {
      lengthBoard(S)
      if (chordCm(S, "A", "B") < 5) setArc(S, "A", "B", 150 * RAD)
      S.movable = ["A", "B"]; S.minGap = 8; S.mode = "slide"
      look(S, ["letters", "arcs"])
    },
    done: S => !S.drag && chordCm(S, "A", "B") <= 2.2,
  },
  watch("closer", "Longer chords are closer to the centre.", S => {
    lengthBoard(S)
    const forward = turn(S.pts.B, S.pts.A) >= 0
    S.breathe = { a: forward ? "A" : "B", b: forward ? "B" : "A", mid: midDir(S, "A", "B"), min: 30, max: 172, t0: S.time }
    look(S, ["letters", "arcs"])
  }, 3.2),

  // ── 5. Equal chords ──
  watch("second", "Here's a second chord.", S => {
    twoChords(S)
    look(S, ["letters"])
  }),
  {
    id: "same-length",
    say: "Make it the same length as the first.",
    enter: S => {
      twoChords(S)
      if (Math.abs(chordCm(S, "A", "B") - chordCm(S, "C", "D")) < 0.4) cdOpposite(S, chordArc(S, "A", "B") * DEG > 100 ? 70 : 130)
      S.movable = ["C", "D"]; S.minGap = 12; S.mode = "slide"
      S.snapFn = (S2, name, a) => arcSnap(chordArc(S2, "A", "B"), "C", "D")(S2, name, a)
      look(S, ["letters"])
    },
    done: S => S.locked,
  },
  watch("distances", "Now look at their distances.", S => {
    equalBoard(S)
    S.pulseSegs = new Set(["OM", "ON"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.4),
  {
    id: "slide-round",
    say: "Slide it round the circle. It keeps its length.",
    enter: S => {
      equalBoard(S)
      S.linked = { C: "D", D: "C" }; S.crossOK = new Set(["C", "D"])
      S.movable = ["C", "D"]; S.mode = "slide"
      look(S, ["letters", "arcs", "ticks"])
    },
    done: movedAll(120), free: true, minPlay: 6,
  },
  watch("never-changes", "Its distance never changes.", S => {
    equalBoard(S)
    S.linked = { C: "D", D: "C" }; S.crossOK = new Set(["C", "D"])
    S.movable = ["C", "D"]; S.mode = "slide"
    S.pulseSegs = new Set(["ON"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.2),
  watch("rule-equal", "Equal chords are the same distance from the centre.", S => {
    equalBoard(S)
    S.pulseSegs = new Set(["OM", "ON"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.4),
  watch("equidistant", "We say they are *equidistant* from the centre.", S => {
    equalBoard(S)
    say(S, "Equidistant means the same distance.", "calm", 600)
    look(S, ["letters", "arcs", "ticks"])
  }, 2.2),
  {
    id: "turn-onto",
    say: "Turn the second chord until it lands on the first.",
    enter: S => {
      equalBoard(S)
      const land = landing(S)
      // a chord already sitting on AB (going back) starts again from where it was
      if (Math.abs(turn(S.pts.C, S.pts[land.C])) < 2 * RAD && beforeTurn) { S.pts.C = beforeTurn.C; S.pts.D = beforeTurn.D }
      beforeTurn = { C: S.pts.C, D: S.pts.D }
      S.linked = { C: "D", D: "C" }; S.crossOK = new Set(["C", "D"])
      S.snapFn = (S2, name, a) => {
        const t = S2.pts[land[name]]
        return Math.abs(turn(a, t)) < 5 * RAD ? t : null
      }
      S.movable = ["C", "D"]; S.mode = "slide"
      look(S, ["letters", "arcs", "ticks"])
    },
    done: S => S.locked,
  },
  watch("fits", "It fits exactly, and so does its distance line.", S => {
    equalBoard(S)
    const land = landing(S)
    if (!beforeTurn) beforeTurn = { C: S.pts.C, D: S.pts.D }
    S.pts.C = S.pts[land.C]
    S.pts.D = S.pts[land.D]
    S.letters = new Set(["O", "A", "B"])
    S.segText = { AB: lenOf("A", "B"), OM: distOf("A", "B") }
    S.pulseSegs = new Set(["OM"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.4),
  watch("turning", "Turning round $O$ never changes a distance from $O$.", S => {
    equalBoard(S)
    if (beforeTurn) { S.pts.C = beforeTurn.C; S.pts.D = beforeTurn.D }
    S.pulseSegs = new Set(["ON"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.6),
  watch("equal-angles", "Equal chords make equal angles at the centre, too.", S => {
    twoChords(S)
    if (beforeTurn) { S.pts.C = beforeTurn.C; S.pts.D = beforeTurn.D }
    matchCD(S)
    addSegs(S, [["O", "A"], ["O", "B"], ["O", "C"], ["O", "D"]])
    S.segText = {}
    S.angles = [atO("AOB", "A", "B"), atO("COD", "C", "D")]
    S.fixed = { AOB: BLUE, COD: ORANGE }
    S.ticks = ["AB", "CD"]
    S.pulse = new Set(["AOB", "COD"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.4),
  watch("right-tri", "Half the chord, the distance and a radius make a right-angled triangle.", S => {
    pythBoard(S)
    look(S, ["letters", "arcs"])
  }, 2.6),
  watch("pythagoras", `By Pythagoras, $${c(BLUE, "3")}^2 + ${c(ORANGE, "4")}^2 = ${c(GREEN, "5")}^2$.`, S => {
    pythBoard(S)
    S.lineTex = `${c(BLUE, "3")}^2 + ${c(ORANGE, "4")}^2 = 9 + 16 = 25 = ${c(GREEN, "5")}^2`
    look(S, ["letters", "arcs", "line"])
  }, 2.6),

  // ── 6. Finding missing angles and lengths ──
  {
    id: "q-dist",
    say: "The radius is $5$ cm and the chord is $8$ cm. Find its distance from $O$.",
    enter: S => {
      base(S, ["O", "A", "B", "M"])
      const half = Math.asin(0.8) * DEG
      place(S, { A: 90 + half, B: 90 - half })
      S.at.M = midOf("A", "B")
      S.showPts = ["A", "B", "M"]
      setSegs(S, [["A", "B"], ["O", "M"]])
      S.segDash = new Set(["OM"])
      S.segColour = { OM: BLUE }
      S.segText = { AB: () => `8${CM}`, OM: () => "d" }
      S.segTextColour = { AB: CHALK, OM: PINK }
      S.segTextAt = { AB: 0.8 }
      S.angles = [rightAt(S, "rM", "M", "O", "A")]
      only(S, [])
      look(S, ["letters", "arcs", "line", "keypad"])
      ask(S, ["d =", { box: true }, CM], 3, {
        help: (S2, t) => {
          halfAndRadius(S2)
          if (t >= 2) remind(S2, `${c(BLUE, "d")}^2 + ${c(ORANGE, "4")}^2 = ${c(GREEN, "5")}^2`)
        },
        onRight: S2 => { S2.segText.OM = () => cmText(3); S2.segTextColour.OM = GREEN },
      })
    },
    done: inputRight,
    walk: [
      { say: "The line from $O$ to the middle meets the chord at $90^\\circ$.", show: S => { reveal(S, "rM"); S.pulse = new Set(["rM"]); S.pulseSegs = new Set(["OM"]) } },
      { say: "$M$ cuts the chord in half, so $AM = 4$ cm.", tex: `AM = 8 \\div 2 = ${c(ORANGE, "4")}${CM}`, show: S => { S.pulseSegs = new Set(); halfOnly(S) } },
      { say: "$OA$ is a radius, so it is $5$ cm.", show: S => halfAndRadius(S) },
      { say: `By Pythagoras, $${c(BLUE, "d")}^2 + ${c(ORANGE, "4")}^2 = ${c(GREEN, "5")}^2$.`, tex: `${c(BLUE, "d")}^2 = 25 - 16 = 9` },
      { say: "So $d = 3$ cm.", tex: `d = \\sqrt{9} = ${c(GREEN, "3")}${CM}`, show: S => { S.segText.OM = () => cmText(3); S.segTextColour.OM = GREEN } },
    ],
  },
  watch("exam-PQ", "$X$ is the midpoint of chord $PQ$.", S => {
    examPQ(S)
    look(S, ["letters", "ticks"])
  }),
  {
    id: "q-PQ",
    say: "$OX = 6$ cm and the radius is $10$ cm. Find $PQ$.",
    enter: S => {
      examPQ(S)
      look(S, ["letters", "ticks", "arcs", "line", "keypad"])
      ask(S, ["PQ =", { box: true }, CM], 16, {
        help: (S2, t) => {
          if (S2.input?.value === "8") say(S2, "That's $PX$, half the chord. $PQ$ is the whole chord.")
          pqTriangle(S2)
          if (t >= 2) remind(S2, `PX^2 + ${c(BLUE, "6")}^2 = ${c(GREEN, "10")}^2`)
        },
      })
    },
    done: inputRight,
    walk: [
      { say: "$X$ is the middle of $PQ$, so $OX$ meets $PQ$ at $90^\\circ$.", show: S => { reveal(S, "rX"); S.pulse = new Set(["rX"]) } },
      { say: "Join $O$ to $P$. It's a radius, so it is $10$ cm.", show: S => pqTriangle(S) },
      { say: `By Pythagoras, $PX^2 + ${c(BLUE, "6")}^2 = ${c(GREEN, "10")}^2$, so $PX = 8$ cm.`, tex: `PX^2 = 100 - 36 = 64, \\quad PX = 8${CM}` },
      { say: "$PQ$ is twice $PX$, so $PQ = 16$ cm.", tex: `PQ = 2 \\times 8 = ${c(GREEN, "16")}${CM}` },
    ],
  },
  watch("exam-DOE", "$D$ and $E$ are the midpoints of chords $AB$ and $BC$.", S => {
    examDOE(S)
    only(S, [])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "q-DOE",
    say: "Angle $ABC$ is $108^\\circ$. Find angle $DOE$.",
    enter: S => {
      examDOE(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      given(S, { ABC: BLUE }, "DOE")
      ask(S, [Q, "=", { box: true }], 72, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "ODB"); reveal(S2, "OEB"); S2.pulse = new Set(["ODB", "OEB", "DOE"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(108))} + 90^\\circ + 90^\\circ + ${Q} = ${c(GREEN, deg(360))}`)
        },
        onRight: S2 => solved(S2, "DOE"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$D$ is the middle of chord $AB$, so angle $ODB$ is $90^\\circ$.", show: S => { reveal(S, "ODB"); S.pulse = new Set(["ODB"]) } },
      { say: "$E$ is the middle of chord $BC$, so angle $OEB$ is $90^\\circ$.", show: S => { reveal(S, "OEB"); S.pulse = new Set(["OEB"]) } },
      { say: "The four angles of $ODBE$ add up to $360^\\circ$.", tex: `${c(BLUE, deg(108))} + 90^\\circ + 90^\\circ + ${Q} = ${c(GREEN, deg(360))}`, show: S => { S.fills = [{ pts: ["O", "D", "B", "E"], color: BLUE }]; S.pulse = new Set(["DOE"]) } },
      { say: "So angle $DOE$ is $72^\\circ$.", tex: `${Q} = 360^\\circ - 288^\\circ = ${c(GREEN, deg(72))}`, show: S => { S.fills = []; uncover(S, "DOE") } },
    ],
  },
  watch("exam-ABC", "$A$, $B$ and $C$ are on the circle, and $AB = BC$.", S => {
    examABC(S)
    only(S, [])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  {
    id: "q-BOC",
    say: "Angle $COA$ is $140^\\circ$. Find angle $BOC$.",
    enter: S => {
      examABC(S)
      look(S, ["letters", "arcs", "values", "ticks", "line", "keypad"])
      given(S, { COA: BLUE }, "BOC")
      ask(S, [Q, "=", { box: true }], 110, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "AOB"); S2.fixed.AOB = PINK; S2.label.AOB = "?"; S2.pulse = new Set(["AOB", "BOC"])
          S2.pulseSegs = new Set(["AB", "BC"])
          if (t >= 2) remind(S2, `${Q} + ${Q} = 360^\\circ - ${c(BLUE, deg(140))}`)
        },
        onRight: S2 => solved(S2, "BOC"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$AB$ and $BC$ are equal chords.", show: S => { S.pulseSegs = new Set(["AB", "BC"]) } },
      { say: "Equal chords make equal angles at the centre. So angles $AOB$ and $BOC$ are equal.", show: S => { S.pulseSegs = new Set(); reveal(S, "AOB"); S.fixed.AOB = PINK; S.label.AOB = "?"; S.pulse = new Set(["AOB", "BOC"]) } },
      { say: "Together they make $360^\\circ - 140^\\circ = 220^\\circ$.", tex: `${Q} + ${Q} = 360^\\circ - ${c(BLUE, deg(140))} = ${deg(220)}` },
      { say: "So each one is $110^\\circ$.", tex: `${Q} = 220^\\circ \\div 2 = ${c(GREEN, deg(110))}`, show: S => { delete S.label.AOB; S.fixed.AOB = NEUTRAL; uncover(S, "BOC") } },
    ],
  },
  {
    id: "q-QCO",
    say: "Now find angle $QCO$.",
    enter: S => {
      examABC(S)
      look(S, ["letters", "arcs", "values", "ticks", "line", "keypad"])
      given(S, { BOC: GREEN }, "QCO")
      ask(S, [Q, "=", { box: true }], 35, {
        deg: true,
        help: (S2, t) => {
          S2.fills = [{ pts: ["O", "B", "C"], color: BLUE }]
          S2.ticks = ["AB", "BC", "OB:2", "OC:2"]
          if (t >= 2) remind(S2, `${Q} + ${Q} + ${c(GREEN, deg(110))} = 180^\\circ`)
        },
        onRight: S2 => solved(S2, "QCO"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$OB$ and $OC$ are radii, so triangle $OBC$ is isosceles.", show: S => { S.fills = [{ pts: ["O", "B", "C"], color: BLUE }]; S.ticks = ["AB", "BC", "OB:2", "OC:2"] } },
      { say: "Its two base angles share $180^\\circ - 110^\\circ = 70^\\circ$.", tex: `${Q} + ${Q} = 180^\\circ - ${c(GREEN, deg(110))} = ${deg(70)}` },
      { say: "So angle $QCO$ is $35^\\circ$.", tex: `${Q} = 70^\\circ \\div 2 = ${c(GREEN, deg(35))}`, show: S => { S.fills = []; uncover(S, "QCO") } },
    ],
  },
  {
    id: "q-sym",
    say: "These two chords are equal. Draw the line of symmetry.",
    enter: S => {
      base(S, ["O"])
      place(S, SYM)
      S.showPts = []
      setSegs(S, [["E", "F"], ["G", "H"]])
      S.symWant = SYM_DIR
      S.drewOnce = false
      S.mode = "drawSym"
      look(S, ["letters"])
    },
    done: S => S.got.has("sym"),
    advanceAfter: 1400,
  },
  watch("sym-why", "It goes through the centre, halfway between the two chords.", S => {
    base(S, ["O"])
    place(S, SYM)
    S.showPts = []
    setSegs(S, [["E", "F"], ["G", "H"]])
    S.symLine = SYM_DIR
    S.ticks = ["EF", "GH"]
    S.pulseO = true
    look(S, ["letters", "ticks"])
  }, 2.4),

  // ── 7. Make the chords ──
  {
    id: "make-8",
    say: "Make a chord $8$ cm long.",
    enter: S => {
      lengthBoard(S)
      // never open already done
      if (Math.abs(chordCm(S, "A", "B") - 8) < 1) setArc(S, "A", "B", 70 * RAD)
      S.movable = ["A", "B"]; S.minGap = 12; S.mode = "slide"
      S.snapFn = arcSnap(arcForLength(8), "A", "B")
      look(S, ["letters", "arcs"])
    },
    done: S => S.locked,
  },
  {
    id: "make-4",
    say: "Now make this chord $4$ cm from the centre.",
    enter: S => {
      buildTwo(S, 120)
      if (Math.abs(distCm(S, "C", "D") - 4) < 0.6) setArc(S, "C", "D", 120 * RAD)
      S.movable = ["C", "D"]; S.minGap = 12; S.mode = "slide"
      S.snapFn = arcSnap(arcForDist(4), "C", "D")
      look(S, ["letters", "arcs"])
    },
    done: S => S.locked,
  },
  {
    id: "make-impossible",
    say: "Make this chord $8$ cm long and $2$ cm from the centre.",
    enter: S => {
      buildTwo(S, 74)
      // a chip lights only when the board shows exactly that number; magnets make each one reachable
      S.chips = [
        { tex: `CD = 8${CM}`, test: S2 => cmText(chordCm(S2, "C", "D")) === cmText(8) },
        { tex: `ON = 2${CM}`, test: S2 => cmText(distCm(S2, "C", "D")) === cmText(2) },
      ]
      S.snapFn = (S2, name, a) => arcSnap(arcForLength(8), "C", "D")(S2, name, a) ?? arcSnap(arcForDist(2), "C", "D")(S2, name, a)
      S.lockOnSnap = false
      S.movable = ["C", "D"]; S.minGap = 12; S.mode = "slide"
      look(S, ["letters", "arcs", "line"])
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    buildTwo(S, 74)
    look(S, ["letters", "arcs"])
  }),
  watch("must-3", "An $8$ cm chord is always $3$ cm from the centre.", S => {
    buildTwo(S, 74)
    setArc(S, "C", "D", arcForLength(8))
    S.ticks = ["AB", "CD"]
    S.pulseSegs = new Set(["OM", "ON"])
    look(S, ["letters", "arcs", "ticks"])
  }, 2.2),
  watch("always-equal", "Equal chords are always the same distance from the centre.", S => {
    buildTwo(S, 74)
    setArc(S, "C", "D", arcForLength(8))
    S.ticks = ["AB", "CD"]
    look(S, ["letters", "arcs", "ticks"])
  }, 2.4),
  {
    id: "end",
    say: "Move anything you like. It still follows the rules.",
    enter: S => {
      buildTwo(S, 74)
      S.bisectors = [bisector("A", "B", { colour: BLUE, dashed: true }), bisector("C", "D", { colour: ORANGE, dashed: true })]
      S.movable = ["A", "B", "C", "D"]; S.minGap = 10; S.mode = "slide"
      look(S, ["letters", "arcs"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── boards used by several beats ─────────────────────────────────────────

/** The lost-centre circle: chord EF (and GH), the centre hidden. */
function lostBoard(S: Scene, n: 1 | 2) {
  base(S, [])
  S.oVis.t = 0
  const okEF = S.pts.E !== undefined && S.pts.F !== undefined && chordArc(S, "E", "F") > 25 * RAD
  if (!okEF) place(S, { E: 200, F: 285 })
  if (n === 2) {
    const okGH = S.pts.G !== undefined && S.pts.H !== undefined && chordArc(S, "G", "H") > 25 * RAD
    if (!okGH) place(S, { G: -20, H: 70 })
  }
  S.showPts = n === 1 ? ["E", "F"] : ["E", "F", "G", "H"]
  setSegs(S, n === 1 ? [["E", "F"]] : [["E", "F"], ["G", "H"]])
  S.segColour = { EF: BLUE, GH: ORANGE }
}

/** Half the chord, AM = 4 cm. */
function halfOnly(S: Scene) {
  if (!S.segs.some(s => s.id === "AM")) addSegs(S, [["A", "M"]])
  S.segColour = { ...S.segColour, AM: ORANGE }
  S.segText = { ...S.segText, AM: () => cmText(4) }
  S.segTextColour = { ...S.segTextColour, AM: ORANGE }
  S.segTextAt = { ...S.segTextAt, AB: 0.85 }
  reveal(S, "rM")
}

/** Half the chord and the radius OA: the right-angled triangle OMA. */
function halfAndRadius(S: Scene) {
  halfOnly(S)
  if (!S.segs.some(s => s.id === "OA")) addSegs(S, [["O", "A"]])
  S.segColour = { ...S.segColour, OA: GREEN }
  S.segText = { ...S.segText, OA: () => cmText(5) }
  S.segTextColour = { ...S.segTextColour, OA: GREEN }
  S.fills = [{ pts: ["O", "M", "A"], color: BLUE }]
}

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["place", "The middle of a chord"],
  ["join-OAB", "Why it goes through the centre"],
  ["hide-O", "Finding a lost centre"],
  ["how-far", "How far a chord is from the centre"],
  ["second", "Equal chords"],
  ["q-dist", "Finding missing angles and lengths"],
  ["make-8", "Make the chords"],
]
for (const [id, title] of PARTS) {
  const b = BEATS.find(x => x.id === id)
  if (!b) throw new Error(`no beat called ${id}`)
  b.chapter = title
}
