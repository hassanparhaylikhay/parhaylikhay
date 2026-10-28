/**
 * Trigonometry: finding an angle, one tiny idea per beat.
 *
 * The student makes the triangle again, and this time two sides are known
 * and the angle is not. First they find it by hand: the hypotenuse stays 8
 * while they turn the angle until the opposite is exactly 4 (30°), then 5
 * (38.7°). Then the calculator does it for them. A function machine shows
 * what sin⁻¹ is: sin takes 30° and gives 0.5; sin⁻¹ takes 0.5 back to 30°.
 *
 * Getting θ on its own is the same kind of move as before: sin⁻¹ is dragged
 * onto the equation and lands on both sides, and two machines in a row
 * show why sin⁻¹ and sin cancel. The answer is given to 1 decimal place
 * (27.0, keeping the 0). Then cos⁻¹ and tan⁻¹, a shortcut (the tan crosses
 * the = and becomes tan⁻¹), the five steps, and two common mistakes: the
 * fraction upside down (Math ERROR, because the opposite could never be
 * longer than the hypotenuse) and a missed SHIFT.
 *
 * Angles of elevation and depression: the student lifts a line of sight up
 * to the top of a tower, then looks back down from the top; the two angles
 * are alternate angles, so they are equal. Five real exam questions finish
 * it, the last two with the right-angled triangle hidden until the student
 * draws it in.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { applyParts } from "../chapter"
import { type ENode, atom, op, row, frac } from "../equation"
import type { Vec } from "../geometry"
import {
  type Scene, type Role, type AngSpec,
  GREEN, PINK, CHALK, ORANGE, YELLOW, ROLE_COL, RAD, DEG,
  say, later, thText, legText, hText, triFrame, poseUnmap, startInput, boxNode, labAt, machineTime, layout,
} from "./scene"
import {
  type Beat, watch, look, base, madeTri, armsBoard, triBoard, UPRIGHT, inputRight, c, TRI, ALL, cardsTap, angleOnly,
} from "./common"
import {
  type AngleQ, fnA, truthA, answerTextA, nameA, triOf, putNumbersA, numbersInA, startSolveA, solvedA,
  askCalcA, calcWalkA, showAnswerA, solvedNodeA, startNode,
} from "./solve-angle"

// ── the questions ────────────────────────────────────────────────────────

const qa = (id: string, at: "V" | "P", known: Partial<Record<Role, number>>, more: Partial<AngleQ> = {}): AngleQ => ({ id, at, known, ...more })

/** The first one solved on the board: sin θ = 5 / 11. */
const Q11 = qa("q11", "V", { O: 5, H: 11 })
/** The adjacent and the hypotenuse (cos), the triangle turned. */
const QC = qa("qc", "V", { A: 6, H: 11 }, { pose: { phi: 180, s: -1, at: [0, 0] } })
/** The opposite and the adjacent (tan), θ at the top. */
const QT = qa("qt", "P", { O: 7, A: 4 }, { pose: { phi: 90, s: -1, at: [0, 0] } })
const QP1 = qa("qp1", "P", { O: 3.2, H: 9 }, { pose: { phi: -25, s: 1, at: [0, 0] } })
const QP2 = qa("qp2", "V", { A: 3.4, H: 5 }, { pose: { phi: 180, s: 1, at: [0, 0] } })

// ── exam questions (from the past papers) ────────────────────────────────

/** A point given on the board (world units) in a pose's flat frame. */
const flatOf = (pose: { phi: number; s: number; at: Vec }, w: Vec): Vec => poseUnmap({ ...pose }, w)

/** 4024/22/M/J/20 Q3(a): a light L is 8 m up a building; P is 12 m from its base B. Angle of elevation of L from P. */
const EX1: AngleQ = qa("ex1", "V", { O: 8, A: 12 }, {
  unit: "m", letters: { V: "P", F: "B", P: "L" },
  extra: {
    pts: { G0: [-3, 0], W2: [17, 0], W1: [17, 11], W0: [12, 11], WM: [14.5, 5.5] },
    segs: [["G0", "V"], ["F", "W2"], ["W2", "W1"], ["W1", "W0"], ["W0", "P"]],
    fills: [{ pts: ["F", "W2", "W1", "W0"], col: CHALK, op: 0.07 }],
    texts: [{ at: "WM", tex: "\\text{Building}" }],
  },
  slips: [{ v: 90 - Math.atan(8 / 12) * DEG, say: "That's the angle at $L$. The angle of elevation is at $P$." }],
})

/** 4024/21/M/J/16 Q5(a): AB is vertical (31 m), CB is horizontal (115 m). Angle of depression of C from A. */
const EX2: AngleQ = qa("ex2", "V", { O: 31, A: 115 }, {
  unit: "m", letters: { V: "C", F: "B", P: "A" },
  extra: { pts: { H: [23, 31] }, segs: [], fills: [] },
  slips: [{ v: 90 - Math.atan(31 / 115) * DEG, say: "That's the angle from the vertical. Measure from the horizontal." }],
})

/** 4024/21/M/J/18 Q10(c): a cliff DC is 105 m high; B is 2 km from its base C. Angle of elevation of D from B. */
const EX3: AngleQ = (() => {
  // the paper's figure is not to scale either; drawn steeper so it can be read on a phone
  const draw = 12
  const h = Math.hypot(105, 2000)
  const fx = h * Math.cos(draw * RAD), py = h * Math.sin(draw * RAD)
  return qa("ex3", "V", { O: 105, A: 2000 }, {
    unit: "m", drawTh: draw, letters: { V: "B", F: "C", P: "D" }, inside: ["O"],
    label: { O: "105\\text{ m}", A: "2\\text{ km}" },
    extra: {
      pts: { K1: [fx + 330, 0], K2: [fx + 330, py], KM: [fx + 200, py / 2] },
      segs: [["F", "K1"], ["K1", "K2"], ["K2", "P"]],
      fills: [{ pts: ["F", "K1", "K2", "P"], col: CHALK, op: 0.12 }],
      texts: [{ at: "KM", tex: "\\text{cliff}" }],
    },
    slips: [{ v: Math.atan(105 / 2) * DEG, say: "Check the units first. $2$ km is $2000$ m." }],
  })
})()

/** 4024/21/M/J/24 Q7(b)(i): pentagon ABCDE, AE ∥ BD, AE = 21, BD = 16, DE = 8, angle DEA = 90°. Angle BAE. */
const C4: Vec = [5 + 9 * Math.cos(65 * RAD), 8 + 9 * Math.sin(65 * RAD)]
const EX4: AngleQ = qa("ex4", "V", { O: 8, A: 5 }, {
  letters: { V: "A", P: "B", E: "E", D: "D", C: "C" },
  extra: {
    pts: { E: [21, 0], D: [21, 8], C: C4 },
    segs: [["V", "E"], ["E", "D"], ["D", "P"], ["P", "C"], ["C", "D"], ["V", "P"]],
    fills: [],
    labels: [{ a: "V", b: "E", tex: "21" }, { a: "P", b: "D", tex: "16", inside: true }, { a: "E", b: "D", tex: "8" }],
    arrows: [["V", "E"], ["P", "D"]],
  },
})

/**
 * 4024/21/M/J/23 Q11(a): an open container whose cross-section is trapezium
 * ABCD: AB = 28, DC = 24, AD = 16, angles ADC and DAB right angles.
 * Angle DCB. The line from C straight up to AB (at X) makes the triangle:
 * V = B, F = X, P = C, and the angle we find is at C.
 */
const POSE5 = { phi: 180, s: 1, at: [28, 16] as Vec }
const EX5: AngleQ = qa("ex5", "P", { O: 4, A: 16 }, {
  pose: POSE5,
  letters: { V: "B", P: "C", A: "A", D: "D" },
  extra: {
    pts: { A: flatOf(POSE5, [0, 16]), D: flatOf(POSE5, [0, 0]) },
    segs: [["A", "V"], ["A", "D"], ["D", "P"], ["V", "P"]],
    fills: [],
    labels: [{ a: "A", b: "V", tex: "28" }, { a: "D", b: "P", tex: "24" }, { a: "A", b: "D", tex: "16" }],
  },
})

// ── boards ───────────────────────────────────────────────────────────────

/** The student's triangle in its angle: hypotenuse 8, the angle as given. */
function eightBoard(S: Scene, th = 30) {
  base(S)
  armsBoard(S, 10)
  madeTri(S, { th, h: 8 })
  S.angText = thText
  S.roleLabels = { H: () => ({ tex: "8" }) }
  S.roleColours = new Set(["O", "H"])
}

/** The same triangle framed on its own (the machine or the keypad takes room). */
function eightFramed(S: Scene, th = 30) {
  eightBoard(S, th)
  triBoard(S)
  S.roleLabels.O = s => ({ tex: legText(s, "O") })
}

/** A question's triangle: the two sides it gives, and θ in pink. */
function qBoardA(S: Scene, q: AngleQ, o: { colours?: boolean; named?: boolean } = {}) {
  triBoard(S)
  const t = S.tri
  const { th, h } = triOf(q)
  t.drop = 1
  t.at = q.at
  t.th = th
  t.h = h
  t.pose = q.pose ? { ...q.pose, at: [q.pose.at[0], q.pose.at[1]] } : { ...UPRIGHT, at: [0, 0] }
  S.extra = q.extra ?? null
  S.regions = q.regions ?? []
  S.letters = { ...(q.letters ?? {}) }
  S.angText = () => c(PINK, nameA(q))
  S.roleLabels = {}
  const unit = q.unit ? `\\text{ ${q.unit}}` : ""
  for (const [r, v] of Object.entries(q.known) as [Role, number][]) {
    // until the sides are named, a number is not in its side's colour (that would give the side away)
    S.roleLabels[r] = s => ({ tex: q.label?.[r] ?? `${v}${unit}`, col: s.roleColours.has(r) ? undefined : CHALK, inside: q.inside?.includes(r) })
  }
  S.roleColours = o.colours === false ? new Set() : new Set(Object.keys(q.known) as Role[])
}

function boardA(S: Scene, q: AngleQ, o: { colours?: boolean } = {}) {
  base(S)
  qBoardA(S, q, o)
}

// ── beat makers ──────────────────────────────────────────────────────────

/** Which rule? The cards come up; the right one comes down and the numbers go in. */
function ruleBeatA(id: string, text: string, q: AngleQ, o: { colours?: boolean; boardFn?: (S: Scene) => void; put?: boolean; after?: (S: Scene) => void } = {}): Beat {
  const put = o.put !== false
  return {
    id,
    say: text,
    enter: S => {
      if (o.boardFn) o.boardFn(S)
      else boardA(S, q, { colours: o.colours })
      cardsTap(S, fnA(q), S2 => {
        S2.roleColours = new Set(["O", "A", "H"])
        if (put) later(S2, 0.5, S3 => { S3.got.add("putting"); const t = putNumbersA(S3, q, 0.9); later(S3, t, S4 => S4.got.add("put")) })
      }, S2 => { S2.roleColours = new Set(["O", "A", "H"]); S2.roleLabels = { ...S2.roleLabels, ...nameHints(q) } })
      look(S, [...TRI, "letters", "extra", "cards"])
      o.after?.(S)
    },
    done: S => S.got.has("rule") && (!put || S.got.has("put")),
    advanceAfter: put ? 1400 : 1200,
  }
}

/** After a wrong card: each side says its name beside its number. */
function nameHints(q: AngleQ): Scene["roleLabels"] {
  const unit = q.unit ? `\\text{ ${q.unit}}` : ""
  const out: Scene["roleLabels"] = {}
  for (const [r, v] of Object.entries(q.known) as [Role, number][]) out[r] = () => ({ tex: `${c(ROLE_COL[r], r)}: ${q.label?.[r] ?? `${v}${unit}`}` })
  return out
}

/** Get θ on its own: the student drags an inverse on (or, with the shortcut, the function across). */
function solveBeatA(id: string, text: string, q: AngleQ, o: { boardFn?: (S: Scene) => void; shortcut?: boolean; note?: string; after?: (S: Scene) => void } = {}): Beat {
  return {
    id,
    say: text,
    enter: S => {
      if (o.boardFn) o.boardFn(S)
      else boardA(S, q)
      S.roleColours = new Set(["O", "A", "H"])
      numbersInA(S, q)
      startSolveA(S, q, { shortcut: o.shortcut })
      if (o.note) say(S, o.note, "calm", 600)
      look(S, [...TRI, "letters", "extra", "eq", "chips"])
      o.after?.(S)
    },
    done: solvedA,
    advanceAfter: 1500,
  }
}

/** Work it out on the calculator, to 1 decimal place. */
function calcBeatA(id: string, text: string, q: AngleQ, o: { boardFn?: (S: Scene) => void; after?: (S: Scene) => void; then?: (S: Scene) => void } = {}): Beat {
  return {
    id,
    say: text,
    enter: S => {
      const inv = S.asolve?.q.id === q.id ? S.asolve.invId : "invR"
      if (o.boardFn) o.boardFn(S)
      else boardA(S, q)
      S.frameFn = triFrame
      S.roleColours = new Set(["O", "A", "H"])
      askCalcA(S, q, inv)
      const right = S.input!.onRight
      S.input!.onRight = S2 => { right?.(S2); o.after?.(S2) }
      look(S, [...TRI, "letters", "extra", "eq", "keypad"])
      o.then?.(S)
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: calcWalkA(q),
  }
}

/** Three beats for one question: which rule, get θ on its own, work it out. */
function questionA(prefix: string, q: AngleQ, ruleText: string, o: { shortcut?: boolean; colours?: boolean; boardFn?: (S: Scene) => void; after?: (S: Scene) => void } = {}): Beat[] {
  return [
    ruleBeatA(`${prefix}-rule`, ruleText, q, { colours: o.colours, boardFn: o.boardFn, after: o.after }),
    solveBeatA(`${prefix}-solve`, `Get $${nameA(q)}$ on its own.`, q, { shortcut: o.shortcut, boardFn: o.boardFn, after: o.after }),
    calcBeatA(`${prefix}-calc`, "Work it out.", q, { boardFn: o.boardFn, then: o.after }),
  ]
}

/** Type a calculation on the angle calculator: the box shows it, then its answer. */
function askTyped(S: Scene, answer: number, shown: string, o: { onRight?: (S: Scene) => void; calcOnly?: string; wantError?: boolean; typed?: string } = {}) {
  startInput(S, { answer, dp: 1, calcOnly: o.calcOnly, wantError: o.wantError, onRight: o.onRight, typed: o.typed })
  S.eqFn = S2 => {
    const inp = S2.input
    const items: ENode[] = [boxNode(S2)]
    if (inp?.state === "right" && !o.wantError) items.push(op("eq", "="), atom("res", shown, { col: GREEN }))
    return row(items)
  }
}

/** A number typed in (a length, a sum of angles). */
function askNumber(S: Scene, answer: number, o: { dp?: number; slips?: { v: number; say: string }[]; onRight?: (S: Scene) => void; lead?: ENode[]; unit?: string } = {}) {
  startInput(S, { answer, dp: o.dp, slips: o.slips, onRight: o.onRight })
  S.eqFn = S2 => {
    const inp = S2.input
    const ans = o.dp ? answer.toFixed(o.dp) : String(answer)
    const items: ENode[] = [...(o.lead ?? [])]
    items.push(inp?.state === "right" ? atom("ans", `${ans}${o.unit ?? ""}`, { col: GREEN }) : boxNode(S2))
    return row(items)
  }
}

/** The digits of an answer being rounded to 1 decimal place: kept ones green, the next one yellow. */
function roundingNode(name: string, digits: string, keep: number, phase: number, shown: string): ENode {
  const items: ENode[] = []
  const chars = digits.split("")
  const point = chars.indexOf(".")
  chars.forEach((d, i) => {
    const kept = i <= point + keep
    const next = i === point + keep + 1
    if (phase >= 3 && i > point + keep) return
    let col = CHALK
    if (phase >= 1 && kept) col = GREEN
    if (phase >= 2 && next) col = YELLOW
    items.push(atom(`d${i}`, d, { col, pulse: phase === 2 && next }))
  })
  if (phase < 3) items.push(atom("dots", "\\ldots", { col: CHALK }))
  else items.push(atom("deg", "^\\circ", { col: GREEN }))
  void shown
  return row([atom("th", name, { col: PINK }), op("eq", "="), row(items, 0)])
}

/** The angle at a corner of the student's triangle, as a figure angle (for pointing at). */
const triAngle = (id: string, at: "V" | "P", tex: string, more: Partial<AngSpec> = {}): AngSpec =>
  at === "V" ? { id, at: "V", a: "F", b: "P", tex, ...more } : { id, at: "P", a: "F", b: "V", tex, ...more }

// ── the line of sight board (elevation and depression) ───────────────────

const TOWER_D = 10, TOWER_H = 6
const SIGHT_ANG = Math.atan2(TOWER_H, TOWER_D) * DEG
const SIGHT_LEN = Math.hypot(TOWER_D, TOWER_H)
const SIGHT_SHOWN = `${Math.round(SIGHT_ANG)}^\\circ`

/** A point P on flat ground, a tower, and the triangle between them (not drawn until wanted). */
function towerBoard(S: Scene) {
  base(S)
  triBoard(S)
  madeTri(S, { th: SIGHT_ANG, h: SIGHT_LEN })
  S.extra = {
    pts: { G0: [-1, 0], G1: [13.4, 0], W2: [12, 0], W1: [12, TOWER_H], HZ: [2.5, TOWER_H], GZ: [7.5, 0] },
    segs: [["G0", "G1"], ["F", "P"], ["W2", "W1"], ["W1", "P"]],
    fills: [{ pts: ["F", "W2", "W1", "P"], col: CHALK, op: 0.09 }],
  }
  S.letters = { V: "P", P: "T" }
  S.angText = null
  S.frameFn = () => ({ x0: -1.7, x1: 13.6, y0: -1.1, y1: TOWER_H + 1.4 })
}

/** Looking from P along the ground (the horizontal), turned up by `ang`. */
function sightUp(S: Scene, ang: number, o: { ray?: boolean; want?: number | null; since?: number; pulseBase?: boolean } = {}) {
  S.sight = {
    from: "V", base: 0, s: 1, ang, want: o.want ?? null, len: SIGHT_LEN, since: o.since ?? S.time - 10, ray: o.ray ?? true,
    tex: s => `${Math.round(s.sight!.ang)}^\\circ`, eye: true, pulseBase: o.pulseBase,
    // below the top it stops at the tower's wall; above it, it goes on past, but no higher than the board
    lenAt: a => (a < SIGHT_ANG - 1e-9 ? TOWER_D / Math.cos(a * RAD) : Math.min(SIGHT_LEN, (TOWER_H + 1.2) / Math.sin(a * RAD))),
  }
}

/** Looking from the top of the tower along the horizontal there, turned down by `ang`. */
function sightDown(S: Scene, ang: number, o: { ray?: boolean; want?: number | null; since?: number } = {}) {
  S.sight = {
    from: "P", base: 180, s: 1, ang, want: o.want ?? null, len: SIGHT_LEN, since: o.since ?? S.time - 10, ray: o.ray ?? true,
    tex: s => `${Math.round(s.sight!.ang)}^\\circ`, eye: true,
    // it stops where it meets the ground (and at the edge of the board)
    lenAt: a => Math.min(TOWER_H / Math.sin(Math.max(1, a) * RAD), SIGHT_LEN * 1.04),
  }
}

const ELEV: AngSpec = { id: "elev", at: "V", a: 0, b: "P", tex: SIGHT_SHOWN }

/** Let go short of the target: close, or which way to go (the line of sight). */
function sightNote(S: Scene, where: string): string {
  const d = S.sight!.ang - SIGHT_ANG
  if (Math.abs(d) < 9) return `Close. Look right at ${where}.`
  // looking up from P: more angle is higher. Looking down from the top: more angle lands nearer the tower
  if (S.sight!.base === 0) return d > 0 ? `That's above ${where}. Bring it down.` : `That's below ${where}. Lift it up.`
  return d > 0 ? `That lands before ${where}. Raise it a little.` : `That goes past ${where}. Lower it.`
}

/** Let go short of the target angle: close, or whether the opposite is too long or too short. */
function oppNote(S: Scene, want: number, len: string): string {
  if (Math.abs(S.tri.th - want) < 9) return `Close. Make the opposite exactly $${len}$.`
  return S.tri.th > want ? "The opposite is too long. Turn the arm down." : "The opposite is too short. Turn the arm up."
}

// ── the lesson ───────────────────────────────────────────────────────────

export const BEATS: Beat[] = []

const RATIO_5_8 = Math.asin(5 / 8) * DEG

/** sin(5 ÷ 11) with SHIFT missed, as a calculator shows it: 7.932946915 × 10⁻³. */
const NO_SHIFT = (() => {
  const v = Math.sin((5 / 11) * RAD)
  const e = Math.floor(Math.log10(v))
  return `${(v / 10 ** e).toPrecision(10)} \\times 10^{${e}}`
})()

const STEPS_A = [
  "Name the sides.",
  "Pick the rule.",
  "Put the numbers in.",
  "Undo the $\\sin$, $\\cos$ or $\\tan$.",
  "Work it out to $1$ decimal place.",
]

/** sin 30° = 4 / 8 = 0.5, the numbers coming up from the triangle one at a time. */
function sinIsNode(S: Scene, phase: number, from: Record<string, Vec>): ENode {
  const top = atom("kt", "4", { col: ORANGE, from: from.kt, fly: 1.2 })
  const bot = phase >= 2 ? atom("kb", "8", { col: GREEN, from: from.kb, fly: 1.2 }) : atom("ph", "\\phantom{8}")
  const items: ENode[] = [atom("fn", "\\sin"), atom("ang", "30^\\circ"), op("eq", "=")]
  if (phase >= 1) items.push(frac("bar", top, bot))
  if (phase >= 3) items.push(op("eq2", "="), atom("val", "0.5", { col: GREEN }))
  void S
  return row(items)
}

const sinInv = (top: string, bot: string, tc = ORANGE, bc = GREEN) => `\\sin^{-1}\\left(\\dfrac{${c(tc, top)}}{${c(bc, bot)}}\\right)`

BEATS.push(
  // ── 1. Finding an angle ──
  {
    id: "open",
    say: "Let's make a right-angled triangle again. Turn the arm to $30^\\circ$.",
    enter: S => {
      angleOnly(S, 52, 8, 10)
      S.mode = "turn"
      S.magnet = { th: 30, within: 2.5 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - 30) < 9 ? "Close. Make it exactly $30^\\circ$." : null)
      look(S, ["arms", "arc", "labels"])
    },
    done: S => S.locked,
    advanceAfter: 1200,
  },
  {
    id: "drop",
    say: "Pull a line straight down to make the right angle.",
    enter: S => {
      angleOnly(S, 30, 8, 10)
      S.mode = "drop"
      // the right angle it makes lights up as the line lands
      S.tick = S2 => { if (S2.tri.drop === 1 && !S2.got.has("rt")) { S2.got.add("rt"); S2.pulseRt = true } }
      look(S, ["arms", "tri", "rt", "arc", "labels"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1800,
  },
  watch("so-far", "So far we knew the angle and found a side.", S => {
    eightBoard(S, 30)
    S.roleLabels.O = s => (s.got.has("found") ? { tex: "4" } : { tex: "x", col: PINK })
    S.eqFn = s => row([
      atom("x", "x", { col: PINK }), op("eq", "="), atom("k", "8", { col: GREEN }), op("tm", "\\times"), atom("fn", "\\sin"), atom("ang", "30^\\circ"),
      ...(s.got.has("found") ? [op("eq2", "="), atom("ans", "4", { col: GREEN })] : []),
    ])
    later(S, 1.4, S2 => { S2.got.add("found"); S2.touched = { kind: "side", id: "FP" }; S2.flashGood = 1 })
    look(S, [...ALL, "eq"])
  }, 2.6),
  watch("two-known", "What if we know two sides, but not the angle?", S => {
    eightBoard(S, 30)
    S.roleLabels.O = () => ({ tex: "4" })
    S.angText = () => c(PINK, "?")
    S.pulseArc = true
    look(S, ALL)
  }, 2.4),
  {
    id: "turn-4",
    say: "Let's find it by turning. Make the opposite exactly $4$.",
    enter: S => {
      eightBoard(S, 52)
      S.roleLabels.O = s => ({ tex: legText(s, "O") })
      S.mode = "turn"
      S.magnet = { th: 30, within: 2.5 }
      S.releaseNote = S2 => oppNote(S2, 30, "4")
      look(S, ALL)
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("found-30", "When the opposite is $4$, $\\theta$ is $30^\\circ$.", S => {
    eightBoard(S, 30)
    S.roleLabels.O = () => ({ tex: "4", pulse: true })
    S.pulseArc = true
    look(S, ALL)
  }, 2.2),
  {
    id: "turn-5",
    say: "Now make the opposite $5$.",
    enter: S => {
      eightBoard(S, 30)
      S.roleLabels.O = s => ({ tex: legText(s, "O") })
      S.mode = "turn"
      S.magnet = { th: RATIO_5_8, within: 2.5 }
      S.releaseNote = S2 => oppNote(S2, RATIO_5_8, "5")
      S.tick = S2 => {
        // said on clicking in, and again once it is let go (letting go clears notes)
        if (!S2.locked || S2.got.has("said")) return
        S2.got.add("said")
        say(S2, "$\\theta$ is about $38.7^\\circ$.", "calm", 600)
      }
      look(S, ALL)
    },
    done: S => S.locked,
    advanceAfter: 2600,
  },
  watch("calc-can", "Your calculator can find this angle for you.", S => {
    eightBoard(S, RATIO_5_8)
    S.thExact = RATIO_5_8
    S.roleLabels.O = () => ({ tex: "5" })
    look(S, ALL)
  }, 2.2),

  // ── 2. Undoing sin ──
  watch("machine", "$\\sin$ takes an angle and gives a number.", S => {
    eightFramed(S, 30)
    S.machines = [{ boxes: [{ tex: "\\sin" }], vals: [{ tex: "30^\\circ" }, { tex: "0.5", col: GREEN }], dir: 1, since: S.time + 0.6 }]
    look(S, [...TRI, "eq"])
  }, 0.6 + machineTime({ boxes: [{ tex: "" }], vals: [], dir: 1, since: null }) + 0.2),
  watch("sin-is", "Here, $\\sin 30^\\circ = \\frac{4}{8} = 0.5$.", S => {
    eightFramed(S, 30)
    let phase = 0
    const from: Record<string, Vec> = {}
    S.eqFn = S2 => sinIsNode(S2, phase, from)
    later(S, 0.5, S2 => { S2.pulseLabs = new Set(["O"]) })
    later(S, 1.0, S2 => { from.kt = labAt(S2, "role-O") ?? [S2.w / 2, S2.h / 2]; phase = 1 })
    later(S, 2.3, S2 => { S2.pulseLabs = new Set(["H"]) })
    later(S, 2.8, S2 => { from.kb = labAt(S2, "role-H") ?? [S2.w / 2, S2.h / 2]; phase = 2 })
    later(S, 4.3, S2 => { S2.pulseLabs = new Set(); phase = 3 })
    look(S, [...TRI, "eq"])
  }, 4.8),
  watch("backwards", "What if we start with $0.5$ and want the angle?", S => {
    eightFramed(S, 30)
    S.angText = () => c(PINK, "?")
    S.machines = [{ boxes: [{ tex: "\\sin" }], vals: [{ tex: "0.5", col: GREEN }, { tex: "?" }], dir: -1, since: null, ask: true, arrows: 1 }]
    look(S, [...TRI, "eq"])
  }, 2.4),
  watch("inverse", "$\\sin^{-1}$ goes the other way. It turns $0.5$ back into $30^\\circ$.", S => {
    eightFramed(S, 30)
    S.angText = s => (s.got.has("back") ? "30^\\circ" : c(PINK, "?"))
    S.machines = [{ boxes: [{ tex: "\\sin^{-1}", col: YELLOW }], vals: [{ tex: "0.5", col: GREEN }, { tex: "30^\\circ" }], dir: -1, since: S.time + 0.8 }]
    later(S, 0.8 + 2.0, S2 => { S2.got.add("back"); S2.pulseArc = true })
    say(S, "$\\sin^{-1}$ is said \"inverse sine\".", "calm", 600)
    look(S, [...TRI, "eq"])
  }, 3.4),
  {
    id: "type-inv",
    say: "Let's try it. Type $\\sin^{-1} 0.5$ and press $=$.",
    enter: S => {
      eightFramed(S, 30)
      S.angText = () => c(PINK, "?")
      askTyped(S, 30, "30", {
        calcOnly: "Use $\\sin^{-1}$ on the calculator: press SHIFT, then $\\sin$.", typed: "S0.5",
        onRight: S2 => { S2.angText = () => c(GREEN, "30^\\circ"); S2.touched = { kind: "tri" }; S2.flashGood = 1 },
      })
      say(S, "On most calculators, press SHIFT and then $\\sin$.", "calm", 600)
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2000,
    walk: [
      { say: "Press SHIFT, then $\\sin$. The screen shows $\\sin^{-1}($.", tex: "\\sin^{-1}(" },
      { say: "Then press $0$, $.$, $5$ and $=$. It shows $30$.", tex: `\\sin^{-1}(0.5) = ${c(GREEN, "30")}` },
    ],
  },
  {
    id: "type-58",
    say: "Now try $\\sin^{-1}$ of $\\frac{5}{8}$.",
    enter: S => {
      eightFramed(S, RATIO_5_8)
      S.thExact = RATIO_5_8
      S.roleLabels.O = () => ({ tex: "5" })
      S.angText = () => c(PINK, "?")
      askTyped(S, RATIO_5_8, String(Number(RATIO_5_8.toPrecision(10))), {
        calcOnly: "Type it as a calculation: SHIFT, $\\sin$, $5$, $\\div$, $8$.", typed: "S5/8",
        onRight: S2 => { S2.angText = () => c(GREEN, "38.7^\\circ"); S2.touched = { kind: "tri" }; S2.flashGood = 1 },
      })
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: [
      { say: "Press SHIFT, then $\\sin$.", tex: "\\sin^{-1}(" },
      { say: "Then $5$, $\\div$, $8$ and $=$.", tex: `${sinInv("5", "8")} = ${c(GREEN, "38.68\\ldots")}` },
    ],
  },
  watch("same-38", "That's the $38.7^\\circ$ we found by turning.", S => {
    eightBoard(S, RATIO_5_8)
    S.thExact = RATIO_5_8
    S.roleLabels.O = () => ({ tex: "5" })
    S.pulseArc = true
    S.eqFn = () => row([atom("inv", "\\sin^{-1}"), atom("lp", "\\Bigg("), frac("bar", atom("kt", "5", { col: ORANGE }), atom("kb", "8", { col: GREEN })), atom("rp", "\\Bigg)"), op("eq", "="), atom("ans", "38.7^\\circ", { col: GREEN })], 0.08)
    look(S, [...ALL, "eq"])
  }, 2.4),
  watch("cos-tan", "$\\cos^{-1}$ and $\\tan^{-1}$ work the same way.", S => {
    base(S)
    S.machinesAt = "board"
    S.machines = [
      { boxes: [{ tex: "\\cos^{-1}", col: YELLOW }], vals: [{ tex: "0.5" }, { tex: "60^\\circ" }], dir: 1, since: S.time + 0.5 },
      { boxes: [{ tex: "\\tan^{-1}", col: YELLOW }], vals: [{ tex: "1" }, { tex: "45^\\circ" }], dir: 1, since: S.time + 1.7 },
    ]
    look(S, [])
  }, 4.0),

  // ── 3. Getting θ on its own ──
  watch("q11", "Now the opposite is $5$ and the hypotenuse is $11$.", S => {
    boardA(S, Q11)
    S.pulseArc = true
    look(S, TRI)
  }, 2.4),
  {
    id: "rule-11",
    say: "Which rule uses $O$ and $H$? Tap it.",
    enter: S => {
      boardA(S, Q11)
      cardsTap(S, "sin")
      look(S, [...TRI, "cards"])
    },
    done: S => S.got.has("rule"),
    advanceAfter: 1200,
  },
  watch("put-11", "Put the numbers into the rule.", S => {
    boardA(S, Q11)
    putNumbersA(S, Q11, 1.0, true)
    look(S, [...TRI, "eq"])
  }, 6.0),
  watch("undo-11", "To get $\\theta$ on its own, we undo the $\\sin$.", S => {
    boardA(S, Q11)
    S.eqFn = () => startNode(Q11, { pulse: new Set(["fn"]) })
    look(S, [...TRI, "eq"])
  }, 2.2),
  watch("why-11", "$\\sin^{-1}$ undoes $\\sin$.", S => {
    boardA(S, Q11)
    S.eqFn = () => startNode(Q11)
    S.machinesAt = "board"
    S.machines = [{
      boxes: [{ tex: "\\sin" }, { tex: "\\sin^{-1}", col: YELLOW }],
      vals: [{ tex: "\\theta", col: PINK }, { tex: "\\sin\\theta" }, { tex: "\\theta", col: PINK }],
      dir: 1, since: S.time + 0.6,
    }]
    look(S, ["eq"])
  }, 0.6 + 2 * 2.0 + 0.3),
  {
    id: "drag-11",
    say: "Drag $\\sin^{-1}$ onto the equation.",
    enter: S => {
      boardA(S, Q11)
      startSolveA(S, Q11, { single: true, tapCancel: true })
      look(S, [...TRI, "eq", "chips"])
    },
    done: S => S.asolve?.stage === "wrapped",
    advanceAfter: 2600,
  },
  {
    id: "cancel-11",
    say: "Tap $\\sin^{-1}$ and $\\sin$ to cancel them.",
    enter: S => {
      boardA(S, Q11)
      startSolveA(S, Q11, { tapCancel: true, wrapped: true })
      look(S, [...TRI, "eq"])
    },
    done: solvedA,
    advanceAfter: 1400,
  },
  watch("alone-11", "Now $\\theta$ is on its own.", S => {
    boardA(S, Q11)
    S.eqFn = () => solvedNodeA(Q11, { pulse: new Set(["th"]) })
    look(S, [...TRI, "eq"])
  }),
  calcBeatA("calc-11", "Type the right side into the calculator.", Q11),
  {
    id: "round-11",
    say: "Angles are given to $1$ decimal place.",
    enter: S => {
      boardA(S, Q11)
      showAnswerA(S, Q11)
      S.flashGood = 0
      const digits = String(Number(truthA(Q11).toPrecision(7)))
      let phase = 0
      later(S, 0.9, S2 => { phase = 1; say(S2, "Keep one figure after the point.", "calm", 2.4) })
      later(S, 2.4, S2 => { phase = 2; say(S2, "The next figure is $3$, so the $0$ stays.", "calm", 3) })
      later(S, 4.0, () => { phase = 3 })
      S.eqFn = () => roundingNode("\\theta", digits, 1, phase, answerTextA(Q11))
      look(S, [...TRI, "eq"])
    },
    cta: "",
    ctaAfter: 4.6,
  },
  watch("zero-11", "Write $27.0$, not $27$. The $0$ counts.", S => {
    boardA(S, Q11)
    showAnswerA(S, Q11)
    S.flashGood = 0
    S.eqFn = () => row([atom("th", "\\theta", { col: PINK }), op("eq", "="), atom("ans", "27.0^\\circ", { col: GREEN })])
    look(S, [...TRI, "eq"])
  }, 2.2),
)

// ── exam figures, as they are on each beat ───────────────────────────────

/** The light on the building: the angle at P found once it is tapped. */
function ex1Board(S: Scene, o: { found?: boolean } = {}) {
  boardA(S, EX1, { colours: !!o.found })
  if (!o.found) S.angText = null
}

/** AB and CB, with the horizontal at A drawn in (after "Tap A"), and the angle of depression marked. */
function ex2Board(S: Scene, o: { horizontal?: boolean; dep?: boolean; colours?: boolean } = {}) {
  boardA(S, EX2, { colours: o.colours ?? false })
  S.angText = null
  if (o.horizontal) S.sight = { from: "P", base: 180, s: 1, ang: 0, want: null, len: 92, since: S.time - 10, ray: false, tex: null }
  if (o.dep) S.angs = [{ id: "dep", at: "P", a: 180, b: "V", tex: c(PINK, "\\theta") }]
}

/** The cliff, in km or (once converted) in m. */
const EX3M: AngleQ = { ...EX3, label: { O: "105\\text{ m}", A: "2000\\text{ m}" } }

/** The pentagon, before and after the line down from B. */
function ex4Board(S: Scene, o: { dropped?: boolean; eight?: boolean; five?: boolean; colours?: boolean } = {}) {
  boardA(S, EX4, { colours: false })
  if (!o.dropped) S.tri.drop = 0
  S.angs = [{ id: "b65", at: "P", a: "C", b: "D", tex: "65^\\circ" }, { id: "e90", at: "E", a: "D", b: "V", square: true }]
  S.roleLabels = {}
  if (o.eight) S.roleLabels.O = () => ({ tex: "8" })
  if (o.five) S.roleLabels.A = () => ({ tex: "5" })
  S.roleColours = o.colours ? new Set(["O", "A", "H"]) : new Set()
  if (o.dropped) S.letters.F = "X"
}

/** The trapezium, before and after the line up from C. */
function ex5Board(S: Scene, o: { dropped?: boolean; sixteen?: boolean; four?: boolean; colours?: boolean } = {}) {
  boardA(S, EX5, { colours: false })
  if (!o.dropped) { S.tri.drop = 0; S.angText = null }
  S.angs = [{ id: "a90", at: "A", a: "D", b: "V", square: true }, { id: "d90", at: "D", a: "A", b: "P", square: true }]
  S.roleLabels = {}
  if (o.sixteen) S.roleLabels.A = () => ({ tex: "16" })
  if (o.four) S.roleLabels.O = () => ({ tex: "4" })
  S.roleColours = o.colours ? new Set(["O", "A", "H"]) : new Set()
  if (o.dropped) S.letters.F = "X"
}

/** A length flies across from one line's label to a side of the triangle. */
function flyLabel(S: Scene, fromKey: string, role: Role, tex: string, delay = 0.5) {
  later(S, delay, S2 => {
    const p = S2.labD[fromKey]
    if (p) S2.labD[`role-${role}`] = [p[0], p[1]]
    S2.roleLabels[role] = () => ({ tex, pulse: true })
  })
}

const EXAM_LOOK = [...TRI, "letters", "extra"] as const

BEATS.push(
  // ── 4. Which rule? ──
  watch("adj-hyp", "Now we know the adjacent and the hypotenuse.", S => {
    boardA(S, QC)
    S.pulseLabs = new Set(["A", "H"])
    look(S, TRI)
  }, 2.2),
  ruleBeatA("rule-c", "Which rule? Tap it.", QC),
  solveBeatA("solve-c", "Get $\\theta$ on its own.", QC),
  calcBeatA("calc-c", "Work it out.", QC),
  watch("opp-adj", "Now the opposite and the adjacent.", S => {
    boardA(S, QT)
    S.pulseLabs = new Set(["O", "A"])
    look(S, TRI)
  }, 2.2),
  ruleBeatA("rule-t", "Which rule? Tap it.", QT),
  watch("shortcut", "Here's a shortcut.", S => {
    boardA(S, QT)
    S.eqFn = () => startNode(QT, { pulse: new Set(["fn"]) })
    look(S, [...TRI, "eq"])
  }, 1.8),
  watch("cross", "The $\\tan$ crosses the $=$ and becomes $\\tan^{-1}$.", S => {
    boardA(S, QT)
    let stage = 0
    S.eqFn = () => (stage === 0 ? startNode(QT, { pulse: new Set(["fn"]) }) : solvedNodeA(QT, {}, "fn", stage === 1))
    later(S, 1.0, () => { stage = 1 })
    later(S, 2.0, S2 => { stage = 2; S2.touched = { kind: "eq" }; S2.flashGood = 0.8 })
    look(S, [...TRI, "eq"])
  }, 2.8),
  watch("same-t", "It gives the same line as dragging $\\tan^{-1}$ onto both sides.", S => {
    boardA(S, QT)
    S.eqFn = () => solvedNodeA(QT, {}, "fn")
    look(S, [...TRI, "eq"])
  }, 2.4),
  solveBeatA("solve-t", "Get $\\theta$ on its own.", QT, { shortcut: true, note: "Drag $\\tan^{-1}$ on, or drag the $\\tan$ across the $=$." }),
  calcBeatA("calc-t", "Work it out.", QT),
  watch("steps", "Questions like this all follow the same five steps.", S => {
    boardA(S, QT)
    S.stepsList = STEPS_A
    S.stepsCard = S.time
    look(S, [])
    S.vis.board.t = 0
  }, 3.2),
  ...questionA("p1", QP1, "Find $\\theta$. Which rule?", { shortcut: true }),
  ...questionA("p2", QP2, "Find $\\theta$. Which rule?", { shortcut: true, colours: false }),

  // ── 5. Two common mistakes ──
  watch("upside", "A common mistake is to put the fraction upside down.", S => {
    boardA(S, Q11)
    S.eqFn = () => row([atom("fn", "\\sin"), atom("th", "\\theta", { col: PINK }), op("eq", "="), frac("bar-R", atom("kt", "11", { col: PINK }), atom("kb", "5", { col: PINK }))])
    look(S, [...TRI, "eq"])
  }, 2.2),
  {
    id: "try-upside",
    say: "Try it. Type $\\sin^{-1}$ of $\\frac{11}{5}$.",
    enter: S => {
      boardA(S, Q11)
      askTyped(S, 0, "", {
        wantError: true, typed: "S11/5",
        onRight: S2 => say(S2, "The calculator can't do it.", "calm", 600),
      })
      S.input!.help = (S2, t) => { if (t >= 1) say(S2, "Type it the wrong way up: SHIFT, $\\sin$, $11 \\div 5$.", "calm", 4) }
      look(S, [...TRI, "eq", "keypad"])
    },
    done: S => S.input?.state === "guessed",
    advanceAfter: 2600,
    walk: [
      { say: "Press SHIFT, then $\\sin$.", tex: "\\sin^{-1}(" },
      { say: "Then $1$, $1$, $\\div$, $5$ and $=$.", tex: "\\sin^{-1}(11 \\div 5)" },
    ],
  },
  watch("why-error", "That would make the opposite longer than the hypotenuse.", S => {
    reachBoard(S)
    S.reach = { want: 11, since: S.time + 0.3 }
    S.tick = S2 => { const t = S2.time - S2.beatStart; if (t > 1.0) S2.tri.th = Math.min(80, 30 + (t - 1.0) * 22) }
    later(S, 3.8, S2 => say(S2, "However far it turns, it never reaches $11$.", "calm", 600))
    look(S, TRI)
  }, 4.4),
  watch("no-angle", "No angle can do that, so the calculator says no.", S => {
    reachBoard(S)
    S.tri.th = 80
    S.reach = { want: 11, since: S.time - 10 }
    S.calcScreen = [{ q: "\\sin^{-1}(11 \\div 5)", a: "\\text{Math ERROR}" }]
    look(S, [...TRI, "eq"])
  }, 2.4),
  watch("no-shift", "Another mistake is to forget SHIFT.", S => {
    boardA(S, Q11)
    S.calcScreen = [{ q: "\\sin(5 \\div 11)", a: NO_SHIFT }]
    look(S, [...TRI, "eq"])
  }, 2.2),
  watch("too-small", "An answer this small means you pressed $\\sin$, not $\\sin^{-1}$.", S => {
    boardA(S, Q11)
    S.calcScreen = [{ q: "\\sin(5 \\div 11)", a: c(PINK, NO_SHIFT) }]
    look(S, [...TRI, "eq"])
  }, 2.6),

  // ── 6. Looking up and looking down ──
  watch("look-ahead", "Imagine standing at $P$, looking straight ahead.", S => {
    towerBoard(S)
    sightUp(S, 0, { ray: false, since: S.time + 0.3, pulseBase: true })
    look(S, ["extra", "letters"])
  }, 2.4),
  {
    id: "look-up",
    say: "Now look up at the top. Lift your line of sight.",
    enter: S => {
      towerBoard(S)
      sightUp(S, 4, { want: SIGHT_ANG })
      S.mode = "sight"
      S.magnet = { within: 2.5 }
      S.releaseNote = S2 => sightNote(S2, "the top, $T$")
      look(S, ["extra", "letters"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("elev-name", "The angle you looked up through is the *angle of elevation*.", S => {
    towerBoard(S)
    sightUp(S, SIGHT_ANG)
    S.sight!.pulseArc = true
    look(S, ["extra", "letters"])
  }, 2.6),
  watch("from-horiz", "It starts from the horizontal.", S => {
    towerBoard(S)
    sightUp(S, SIGHT_ANG)
    S.sight!.pulseBase = true
    look(S, ["extra", "letters"])
  }, 2.2),
  watch("stand-top", "Now stand at the top and look down at $P$.", S => {
    towerBoard(S)
    S.angs = [ELEV]
    sightDown(S, 0, { ray: false, since: S.time + 0.3 })
    look(S, ["extra", "letters"])
  }, 2.4),
  {
    id: "look-down",
    say: "Lower your line of sight to $P$.",
    enter: S => {
      towerBoard(S)
      S.angs = [ELEV]
      sightDown(S, 4, { want: SIGHT_ANG })
      S.mode = "sight"
      S.magnet = { within: 2.5 }
      S.releaseNote = S2 => sightNote(S2, "$P$")
      look(S, ["extra", "letters"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("dep-name", "This is the *angle of depression*.", S => {
    towerBoard(S)
    S.angs = [ELEV]
    sightDown(S, SIGHT_ANG)
    S.sight!.pulseArc = true
    look(S, ["extra", "letters"])
  }, 2.2),
  watch("same-size", "Look at the two angles. Are they the same size?", S => {
    towerBoard(S)
    S.angs = [{ ...ELEV, pulse: true }]
    sightDown(S, SIGHT_ANG)
    S.sight!.pulseArc = true
    look(S, ["extra", "letters"])
  }, 2.6),
  watch("parallel", "The two horizontal lines are parallel.", S => {
    towerBoard(S)
    S.angs = [ELEV]
    sightDown(S, SIGHT_ANG)
    S.sight!.arrows = true
    S.sight!.pulseBase = true
    S.extra!.arrows = [["G0", "GZ"]]
    look(S, ["extra", "letters"])
  }, 2.4),
  watch("alternate", "So these are alternate angles, and they're equal.", S => {
    towerBoard(S)
    S.angs = [{ ...ELEV, pulse: true }]
    sightDown(S, SIGHT_ANG)
    S.sight!.arrows = true
    S.sight!.pulseArc = true
    S.extra!.arrows = [["G0", "GZ"]]
    S.zpath = { pts: ["HZ", "P", "V", "GZ"], since: S.time + 0.3 }
    look(S, ["extra", "letters"])
  }, 2.8),
  watch("not-vertical", "Be careful not to measure from the vertical.", S => {
    towerBoard(S)
    S.angs = [ELEV, { id: "vert", at: "P", a: "F", b: "V", tex: c(PINK, `${90 - Math.round(SIGHT_ANG)}^\\circ`), col: PINK }]
    sightDown(S, SIGHT_ANG)
    say(S, "The pink angle starts from the tower, not from the horizontal.", "calm", 600)
    look(S, ["extra", "letters"])
  }, 2.6),

  // ── 7. Exam questions ──
  watch("ex1", "A light $L$ is $8$ m up a building. $P$ is $12$ m from its base.", S => {
    ex1Board(S)
    look(S, ["tri", "fill", "rt", "labels", "letters", "extra"])
  }, 2.8),
  {
    id: "ex1-tap",
    say: "Tap the angle of elevation of $L$ from $P$.",
    enter: S => {
      ex1Board(S)
      S.angs = [triAngle("atP", "V", "", { quiet: true }), triAngle("atL", "P", "", { quiet: true })]
      S.mode = "tapAngle"
      S.onAng = (S2, id) => {
        if (S2.got.has("tap")) return
        if (id === "atP") {
          S2.got.add("tap")
          S2.angs = []
          S2.angText = () => c(PINK, "\\theta")
          S2.vis.arc.t = 1
          S2.touched = { kind: "tri" }
          S2.flashGood = 1
          S2.note = null
          return
        }
        say(S2, "That angle is at $L$. You look up from $P$, so the angle is at $P$.", "wrong", 3.8)
      }
      look(S, ["tri", "fill", "rt", "labels", "letters", "extra"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  },
  ...questionA("ex1", EX1, "Which rule do you need?", { shortcut: true, boardFn: S => ex1Board(S, { found: true }) }),

  watch("ex2", "$AB$ is vertical and $CB$ is horizontal.", S => {
    ex2Board(S)
    look(S, ["tri", "fill", "rt", "labels", "letters"])
  }, 2.4),
  {
    id: "ex2-tapA",
    say: "We want the angle of depression of $C$ from $A$. Tap $A$.",
    enter: S => {
      ex2Board(S)
      S.mode = "tapPoint"
      S.tapPts = ["P"]
      S.onPt = S2 => {
        if (S2.got.has("tap")) return
        S2.got.add("tap")
        S2.sight = { from: "P", base: 180, s: 1, ang: 0, want: null, len: 92, since: S2.time, ray: false, tex: null }
        S2.touched = { kind: "tri" }
        S2.flashGood = 0.6
        say(S2, "The angle of depression starts from the horizontal at $A$.", "calm", 600)
      }
      look(S, ["tri", "fill", "rt", "labels", "letters"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 2400,
  },
  {
    id: "ex2-dep",
    say: "Tap the angle of depression.",
    enter: S => {
      ex2Board(S, { horizontal: true })
      S.angs = [
        { id: "dep", at: "P", a: 180, b: "V", quiet: true },
        { id: "vert", at: "P", a: "F", b: "V", quiet: true },
        { id: "atC", at: "V", a: "F", b: "P", quiet: true },
      ]
      S.mode = "tapAngle"
      S.onAng = (S2, id) => {
        if (S2.got.has("tap")) return
        if (id === "dep") {
          S2.got.add("tap")
          S2.angs = [{ id: "dep", at: "P", a: 180, b: "V", tex: c(PINK, "\\theta") }]
          S2.touched = { kind: "tri" }
          S2.flashGood = 1
          S2.note = null
          return
        }
        say(S2, id === "vert" ? "That one starts from the vertical line $AB$. Start from the horizontal." : "That angle is at $C$. You look down from $A$.", "wrong", 3.8)
      }
      look(S, ["tri", "fill", "rt", "labels", "letters"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  },
  watch("ex2-alt", "It is the same as angle $ACB$, its alternate angle.", S => {
    ex2Board(S, { horizontal: true, dep: true })
    S.zpath = { pts: ["H", "P", "V", "F"], since: S.time + 0.4 }
    later(S, 1.8, S2 => { S2.angText = () => c(PINK, "\\theta"); S2.vis.arc.t = 1 })
    look(S, ["tri", "fill", "rt", "labels", "letters"])
  }, 3.0),
  ...questionA("ex2", EX2, "Which rule?", {
    shortcut: true,
    boardFn: S => { ex2Board(S, { horizontal: true, dep: true, colours: true }); S.angText = () => c(PINK, "\\theta") },
  }),

  watch("ex3", "The cliff is $105$ m high. $B$ is $2$ km from its base.", S => {
    boardA(S, EX3, { colours: false })
    look(S, EXAM_LOOK as unknown as Parameters<typeof look>[1])
  }, 2.6),
  watch("ex3-units", "These two lengths are in different units.", S => {
    boardA(S, EX3, { colours: false })
    S.pulseLabs = new Set(["O", "A"])
    look(S, EXAM_LOOK as unknown as Parameters<typeof look>[1])
  }, 2.2),
  {
    id: "ex3-m",
    say: "How many metres is $2$ km?",
    enter: S => {
      boardA(S, EX3, { colours: false })
      S.frameFn = triFrame
      askNumber(S, 2000, {
        lead: [atom("two", "2\\text{ km}"), op("eq", "=")], unit: "\\text{ m}",
        slips: [{ v: 200, say: "$1$ km is $1000$ m." }, { v: 20000, say: "$1$ km is $1000$ m." }, { v: 2, say: "That's still in km. How many metres?" }],
        onRight: S2 => { S2.roleLabels.A = () => ({ tex: "2000\\text{ m}", pulse: true }); S2.touched = { kind: "side", id: "VF" }; S2.flashGood = 1 },
      })
      look(S, [...EXAM_LOOK, "eq", "keypad"] as unknown as Parameters<typeof look>[1])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: [
      { say: "There are $1000$ m in $1$ km.", tex: "1\\text{ km} = 1000\\text{ m}" },
      { say: "So $2$ km is $2 \\times 1000 = 2000$ m.", tex: `2\\text{ km} = ${c(GREEN, "2000")}\\text{ m}` },
    ],
  },
  ...questionA("ex3", EX3M, "Which rule?", { shortcut: true, colours: false }),

  watch("ex4", "$ABCDE$ is a pentagon. $AE$ is parallel to $BD$.", S => {
    ex4Board(S)
    look(S, ["tri", "letters", "extra"])
  }, 2.6),
  watch("ex4-want", "We want angle $BAE$.", S => {
    ex4Board(S)
    S.pulseArc = true
    look(S, ["tri", "arc", "labels", "letters", "extra"])
  }, 2.0),
  watch("ex4-no-rt", "It isn't in a right-angled triangle yet.", S => {
    ex4Board(S)
    look(S, ["tri", "arc", "labels", "letters", "extra"])
  }, 2.0),
  {
    id: "ex4-drop",
    say: "Draw a line straight down from $B$ to $AE$.",
    enter: S => {
      ex4Board(S)
      S.mode = "drop"
      S.dropNote = "Pull it all the way down to $AE$."
      look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1400,
  },
  watch("ex4-eight", "This line is $8$, the same as $DE$.", S => {
    ex4Board(S, { dropped: true })
    flyLabel(S, "X-ED", "O", "8")
    look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra"])
  }, 2.4),
  {
    id: "ex4-five",
    say: "How long is $AX$?",
    enter: S => {
      ex4Board(S, { dropped: true, eight: true })
      S.roleLabels.A = () => ({ tex: "?", col: PINK })
      askNumber(S, 5, {
        lead: [atom("ax", "AX"), op("eq", "=")],
        slips: [{ v: 37, say: "That adds them. $AX$ is what is left of $21$ after $16$." }, { v: 13, say: "Use $16$, the length of $BD$." }],
        onRight: S2 => { S2.roleLabels.A = () => ({ tex: "5" }); S2.touched = { kind: "side", id: "VF" }; S2.flashGood = 1 },
      })
      look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1600,
    walk: [
      { say: "The whole of $AE$ is $21$.", show: S => { S.pulseLabs = new Set(["X-VE"]) } },
      { say: "The part under $BD$ is $16$, the same as $BD$.", show: S => { S.extra!.labels = [...(EX4.extra!.labels ?? []), { a: "F", b: "E", tex: "16" }] } },
      { say: "So $AX = 21 - 16 = 5$.", tex: `AX = 21 - 16 = ${c(GREEN, "5")}` },
    ],
  },
  ...questionA("ex4", EX4, "Which rule?", { shortcut: true, boardFn: S => ex4Board(S, { dropped: true, eight: true, five: true, colours: true }) }),

  watch("ex5", "$ABCD$ is a trapezium. Angles $ADC$ and $DAB$ are right angles.", S => {
    ex5Board(S)
    look(S, ["tri", "letters", "extra"])
  }, 2.6),
  watch("ex5-want", "We want angle $DCB$. It is more than $90^\\circ$.", S => {
    ex5Board(S)
    S.angs.push({ id: "dcb", at: "P", a: "D", b: "V", tex: c(PINK, "?"), col: PINK, pulse: true })
    look(S, ["tri", "labels", "letters", "extra"])
  }, 2.4),
  {
    id: "ex5-drop",
    say: "Draw a line straight up from $C$ to $AB$.",
    enter: S => {
      ex5Board(S)
      S.angs.push({ id: "dcb", at: "P", a: "D", b: "V", tex: c(PINK, "?"), col: PINK })
      S.mode = "drop"
      S.dropNote = "Pull it all the way up to $AB$."
      look(S, ["tri", "fill", "rt", "labels", "letters", "extra"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1400,
  },
  watch("ex5-split", "This line splits angle $DCB$ into two parts.", S => {
    ex5Board(S, { dropped: true })
    S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true, pulse: true })
    S.pulseArc = true
    look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra"])
  }, 2.6),
  watch("ex5-right", "One part is a right angle.", S => {
    ex5Board(S, { dropped: true })
    S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true, pulse: true })
    look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra"])
  }, 2.2),
  watch("ex5-cx", "$CX$ is $16$, the same as $AD$.", S => {
    ex5Board(S, { dropped: true })
    S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true })
    flyLabel(S, "X-AD", "A", "16")
    look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra"])
  }, 2.4),
  {
    id: "ex5-xb",
    say: "How long is $XB$?",
    enter: S => {
      ex5Board(S, { dropped: true, sixteen: true })
      S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true })
      S.roleLabels.O = () => ({ tex: "?", col: PINK })
      askNumber(S, 4, {
        lead: [atom("xb", "XB"), op("eq", "=")],
        slips: [{ v: 52, say: "That adds them. $XB$ is what is left of $28$ after $24$." }, { v: 12, say: "Use $24$, the length of $DC$." }],
        onRight: S2 => { S2.roleLabels.O = () => ({ tex: "4" }); S2.touched = { kind: "side", id: "VF" }; S2.flashGood = 1 },
      })
      look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1600,
    walk: [
      { say: "The whole of $AB$ is $28$.", show: S => { S.pulseLabs = new Set(["X-AV"]) } },
      { say: "$AX$ is $24$, the same as $DC$.", show: S => { S.extra!.labels = [...(EX5.extra!.labels ?? []), { a: "A", b: "F", tex: "24", inside: true }] } },
      { say: "So $XB = 28 - 24 = 4$.", tex: `XB = 28 - 24 = ${c(GREEN, "4")}` },
    ],
  },
  ...questionA("ex5", EX5, "Find $\\theta$. Which rule?", {
    shortcut: true,
    boardFn: S => { ex5Board(S, { dropped: true, sixteen: true, four: true, colours: true }); S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true }) },
  }),
  watch("ex5-add", "So angle $DCB$ is $90^\\circ$ plus $14.0^\\circ$.", S => {
    ex5Board(S, { dropped: true, sixteen: true, four: true, colours: true })
    S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true, pulse: true })
    showAnswerA(S, EX5)
    S.flashGood = 0
    S.eqFn = () => row([atom("dcb", "\\text{Angle } DCB"), op("eq", "="), atom("n90", "90^\\circ"), op("plus", "+"), atom("n14", "14.0^\\circ", { col: GREEN })])
    look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra", "eq"])
  }, 2.6),
  {
    id: "ex5-total",
    say: "Work it out.",
    enter: S => {
      ex5Board(S, { dropped: true, sixteen: true, four: true, colours: true })
      S.angs.push({ id: "c90", at: "P", a: "D", b: "F", square: true })
      showAnswerA(S, EX5)
      S.flashGood = 0
      const total = 90 + truthA(EX5)
      askNumber(S, total, {
        dp: 1, unit: "^\\circ",
        lead: [atom("dcb", "\\text{Angle } DCB"), op("eq", "="), atom("n90", "90^\\circ"), op("plus", "+"), atom("n14", "14.0^\\circ", { col: GREEN }), op("eq2", "=")],
        // as typed: the part found, rounded to 1 place
        slips: [{ v: 90 - Number(answerTextA(EX5)), say: "Add the two parts together." }, { v: Number(answerTextA(EX5)), say: "That is only one part. Add the $90^\\circ$." }],
        onRight: S2 => { S2.angs = [...S2.angs.filter(g => g.id !== "dcb"), { id: "dcb", at: "P", a: "D", b: "V", tex: c(GREEN, `${total.toFixed(1)}^\\circ`), col: GREEN, r: 54 }]; S2.touched = { kind: "tri" }; S2.flashGood = 1 },
      })
      look(S, ["tri", "fill", "rt", "arc", "labels", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2400,
    walk: [
      { say: "The two parts are $90^\\circ$ and $14.0^\\circ$.", tex: "90^\\circ + 14.0^\\circ" },
      { say: "Together they make $104.0^\\circ$.", tex: `90^\\circ + 14.0^\\circ = ${c(GREEN, "104.0^\\circ")}` },
    ],
  },

  // ── 8. Play ──
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      base(S)
      armsBoard(S, 10)
      madeTri(S, { th: 38, h: 7 })
      S.angText = thText
      S.roleLabels = { O: s => ({ tex: legText(s, "O") }), A: s => ({ tex: legText(s, "A") }), H: s => ({ tex: hText(s) }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "turnSlide"
      S.calcScreen = s => {
        const O = legText(s, "O"), A = legText(s, "A"), H = hText(s)
        // one line on a small screen, so the button below stays clear
        const lines = [
          { q: `\\sin^{-1}\\left(\\dfrac{${c(ORANGE, O)}}{${c(GREEN, H)}}\\right)`, a: (Math.asin(Number(O) / Number(H)) * DEG).toFixed(1) },
          { q: `\\tan^{-1}\\left(\\dfrac{${c(ORANGE, O)}}{${c(ROLE_COL.A, A)}}\\right)`, a: (Math.atan(Number(O) / Number(A)) * DEG).toFixed(1) },
        ]
        return layout(s).compact ? lines.slice(0, 1) : lines
      }
      look(S, [...ALL, "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
)

/** A hypotenuse of 5 asked for an opposite of 11. */
function reachBoard(S: Scene) {
  base(S)
  triBoard(S)
  madeTri(S, { th: 30, h: 5 })
  S.frameFn = () => ({ x0: -1.6, x1: 7.4, y0: -1, y1: 12 })
  S.angText = thText
  S.roleLabels = { H: () => ({ tex: "5" }), O: s => ({ tex: legText(s, "O") }) }
  S.roleColours = new Set(["O", "H"])
}

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["open", "Finding an angle"],
  ["machine", "Undoing $\\sin$"],
  ["q11", "Getting $\\theta$ on its own"],
  ["adj-hyp", "Which rule?"],
  ["upside", "Two common mistakes"],
  ["look-ahead", "Looking up and looking down"],
  ["ex1", "Exam questions"],
]
applyParts(BEATS, PARTS)
