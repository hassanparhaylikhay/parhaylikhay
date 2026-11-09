/**
 * The area of a triangle, one tiny idea per beat.
 *
 * Half the base times the height, as the student knows it: they pull the
 * height down and work it out. Then a triangle with no height given: two
 * sides and the angle between them. The height comes from the small
 * right-angled triangle (sin C = h/a, a moved across: h = a sin C), and goes
 * into half the base times the height: ½ab sin C. Turning the angle, the
 * area is biggest at 90°, the height lands outside past 90°, and 30° and
 * 150° give the same area.
 *
 * Using it: tap the angle between the two sides, drag them into the rule,
 * type it (× 0.5 for the half). Working backwards from an area, everything
 * multiplying the unknown moves across the = together, the bottom is worked
 * out, then the area is divided by it. The shortest distance from a point to
 * a line is found by sliding a point until it meets at a right angle: the
 * height, found from the area worked out two ways. Five real exam questions
 * finish it, four of them going on from the sine and cosine rule lessons.
 */

import type { BeatOf } from "../beat"
import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { type ENode, op, row, frac, eqSlow } from "../equation"
import { setAns, sigText } from "../calc"
import {
  type Scene, type Corner, type VisKey, CORNERS, CHALK, GREEN, YELLOW, BLUE, RED, RAD, DEG,
  resetBeat, show, later, say, angleAt, numText, figFrame, labAt, startInput, boxNode, heightFoot, dist, clamp,
} from "./scene"
import { type Look, pc, stack, startCross, crossDone, degT, dots, startCosFill, cosFilled, askSquare, crossSquare, askRoot, squareWalk, rootWalk, sideQ } from "./cos"
import {
  type AQ, areaQ, sv, av, nameOf, unitTex, unit2Tex, sideTex, answerText, areaOf,
  areaRule, blockIds, startAreaFill, areaFilled, askArea, askBlock, askSideFromArea, crossBlock, areaWalk, blockWalk, sideFromAreaWalk,
} from "./area"

export type Beat = BeatOf<Scene>

const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat => ({ id, say: text, enter, cta: "", ctaAfter })
const inputRight = (S: Scene) => S.input?.state === "right"
const look = (S: Scene, keys: VisKey[]) => show(S, ["board", ...keys])
const QLOOK: VisKey[] = ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]
const at = (r: number, deg: number): Vec => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)]
const HALF = "\\tfrac{1}{2}"

function setTri(S: Scene, P: Record<Corner, Vec>) {
  for (const k of CORNERS) S.P[k] = [P[k][0], P[k][1]]
}

// ── part 1: the area you know ────────────────────────────────────────────

const KNOWN: Record<Corner, Vec> = { C: [0, 0], A: [8, 0], B: [3, 5] }

function knownBoard(S: Scene, o: { dropped?: boolean } = {}) {
  resetBeat(S)
  setTri(S, KNOWN)
  S.coloured = new Set(CORNERS)
  S.names = {}
  S.arcsOnly = []
  S.sideText = { B: () => "8" }
  S.height = { from: "B", drop: o.dropped ? 1 : 0, since: S.time, glow: null }
  if (o.dropped) {
    S.P.H = heightFoot(S, false)
    S.extra = { segs: [], labels: [{ a: "B", b: "H", tex: "5" }] }
  }
  S.frameFn = () => figFrame(S, ["A", "B", "C"])
}

// ── the turning triangle: a = 6, b = 8, side a turning about C ───────────

const TA = 6, TB = 8
const turnTri = (deg: number): Record<Corner, Vec> => ({ C: [0, 0], A: [TB, 0], B: at(TA, deg) })
const TURN_FRAME = { x0: -6.9, x1: 8.9, y0: -0.9, y1: 6.9 }
const shownC = (S: Scene) => Math.round(angleAt(S, "C"))
const turnArea = (S: Scene) => 0.5 * TA * TB * Math.sin(shownC(S) * RAD)

/** The 6, 8 triangle; `deg` sets angle C, "keep" leaves it where it was. */
function turnBoard(S: Scene, deg: number | "keep", o: { h?: boolean; hLabel?: string; fit?: boolean } = {}) {
  const keep = deg === "keep" && S.P.B && Math.abs(Math.hypot(S.P.B[0], S.P.B[1]) - TA) < 0.01 && Math.abs(S.P.A[0] - TB) < 0.01
  const d0 = keep ? Math.atan2(S.P.B[1], S.P.B[0]) * DEG : deg === "keep" ? 40 : deg
  resetBeat(S)
  setTri(S, turnTri(d0))
  S.coloured = new Set(CORNERS)
  S.sideText = { A: () => String(TA), B: () => String(TB) }
  S.angText = { C: s => `${shownC(s)}^\\circ` }
  S.arcsOnly = ["C"]
  if (o.h) {
    S.height = { from: "B", drop: 1, since: S.time, glow: null }
    S.P.H = heightFoot(S, false)
    S.extra = { segs: [], labels: o.hLabel ? [{ a: "B", b: "H", tex: o.hLabel }] : [] }
    // the foot follows B as it turns
    S.tick = S2 => { S2.P.H = heightFoot(S2, false) }
  }
  // nothing turns yet: fit the triangle itself (the turning beats keep one still frame for every angle)
  S.frame = TURN_FRAME
  S.frameFn = o.fit ? () => figFrame(S, ["A", "B", "C"]) : () => TURN_FRAME
}

/** B turns about C, keeping CB = 6; with `want` it clicks there and stays. */
function turnB(S: Scene, want?: number, note?: (S: Scene) => string | null) {
  S.mode = "rule"
  S.lockOnSnap = want !== undefined
  S.rule = {
    pt: "B",
    place: (_S, w) => { let a = Math.atan2(w[1], w[0]) * DEG; if (a < -90) a += 360; return at(TA, clamp(a, 10, 170)) },
    snap: want === undefined ? undefined : (_S, p) => (Math.abs(Math.atan2(p[1], p[0]) * DEG - want) < 3 ? at(TA, want) : null),
  }
  if (want !== undefined) {
    S.releaseNote = note ?? (S2 => {
      const a = shownC(S2)
      return Math.abs(a - want) < 9 ? `Close. Make angle $C$ exactly $${want}^\\circ$.` : a > want ? "Too big. Turn it back a little." : "Too small. Turn it out a little."
    })
  }
}

/** Keep track of how far angle C has turned from where the beat began. */
function trackTurn(S: Scene) {
  const start = shownC(S)
  let far = 0
  const prev = S.tick
  S.tick = S2 => { prev?.(S2); far = Math.max(far, Math.abs(shownC(S2) - start)); if (far >= 20) S2.got.add("turned") }
}

/** Area = ½ × 6 × 8 × sin C = …, live. */
const liveArea = (S: Scene): ENode =>
  row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("s1v", String(TA), YELLOW), op("t1", "\\times"), pc("s2v", String(TB), BLUE), op("t2", "\\times"), pc("sin", "\\sin"), pc("angv", `${shownC(S)}^\\circ`, RED), op("eq2", "="), pc("res", numText(turnArea(S), 1), GREEN)])

// ── the questions ────────────────────────────────────────────────────────

/** A question's board: what it gives, the unknown in its pair's colour. */
function aBoard(S: Scene, q: AQ, o: { quiet?: boolean; hideC?: boolean; sideC?: string } = {}) {
  resetBeat(S)
  setTri(S, q.P)
  S.coloured = new Set(CORNERS)
  if (q.names) S.names = { ...q.names }
  for (const [n, v] of Object.entries(q.pts ?? {})) S.P[n] = [v[0], v[1]]
  S.extra = q.extra ? { ...q.extra, quiet: o.quiet || undefined } : null
  S.sideText = { A: () => sideTex(q, "A"), B: () => sideTex(q, "B") }
  if (o.sideC) S.sideText.C = () => o.sideC!
  if (!o.hideC) S.angText.C = () => degT(av(q, "C"))
  for (const [k, d] of Object.entries(q.angles ?? {})) S.angText[k as Corner] = () => degT(d!)
  S.sideInside = new Set(q.inside ?? [])
  if (o.quiet && q.regions && q.region) { S.regions = q.regions; S.regionLit = q.region }
  S.frameFn = () => figFrame(S)
}

/** The labels on the figure that can be dragged into the rule. */
function areaLabels(q: AQ, more: Record<string, string> = {}): Record<string, string> {
  const n = (k: Corner) => (q.find === "side" && q.unknown === k ? nameOf(q) : numText(sv(q, k), 2))
  return { "side-A": n("A"), "side-B": n("B"), "ang-C": degT(av(q, "C")), ...more }
}

/** Tap the angle between the two sides. */
function tapBetween(id: string, text: string, q: AQ, o: { quiet?: boolean; sideC?: string } = {}): Beat {
  return {
    id, say: text,
    enter: S => {
      aBoard(S, q, o)
      S.mode = "tapAngle"
      S.onAngle = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === "C") { S2.got.add("tap"); S2.glowAng = new Set(["C"]); S2.glowSide = new Set(["A", "B"]); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1; S2.note = null; return }
        say(S2, "That angle is at the end of only one of them. Find where they meet.", "wrong", 3.8)
        S2.glowSide = new Set(["A", "B"])
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

function fillArea(id: string, text: string, q: AQ, o: { quiet?: boolean; sideC?: string; more?: Record<string, string> } = {}): Beat {
  return {
    id, say: text,
    enter: S => {
      aBoard(S, q, o)
      S.glowAng = new Set(["C"])
      startAreaFill(S, q, areaLabels(q, o.more))
      look(S, [...QLOOK, "eq"])
    },
    done: areaFilled,
    advanceAfter: 1400,
  }
}

function calcArea(id: string, text: string, q: AQ, o: { quiet?: boolean; sideC?: string; then?: (S: Scene) => void } = {}): Beat {
  return {
    id, say: text,
    enter: S => {
      aBoard(S, q, o)
      askArea(S, q, S2 => {
        S2.extra = { ...(S2.extra ?? { segs: [] }), texts: [...(S2.extra?.texts ?? []), { at: centroid(q), tex: `${answerText(q)}${unit2Tex(q)}`, col: GREEN }] }
        S2.touched = { kind: "tri" }
        S2.flashGood = 1.2
        o.then?.(S2)
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: areaWalk(q),
  }
}

const centroid = (q: AQ): Vec => [(q.P.A[0] + q.P.B[0] + q.P.C[0]) / 3, (q.P.A[1] + q.P.B[1] + q.P.C[1]) / 3]

/** Working backwards: tap every piece that multiplies the unknown. */
function tapBlock(id: string, text: string, q: AQ, o: { quiet?: boolean } = {}): Beat {
  return {
    id, say: text,
    enter: S => {
      aBoard(S, q, o)
      const want = blockIds(q)
      const lit = new Set<string>()
      const x = want.includes("s1v") ? "s2v" : "s1v"
      S.mode = "tapEq"
      S.tapAtoms = [...want, x, "ar"]
      S.onAtom = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === x) { say(S2, `That's $${nameOf(q)}$ itself. Tap what multiplies it.`, "wrong", 3.4); return }
        if (a === "ar") { say(S2, "That's on the other side of the $=$.", "wrong", 3.4); return }
        // sin and its angle go together
        if (a === "sin" || a === "angv") { lit.add("sin"); lit.add("angv") } else lit.add(a)
        S2.touched = { kind: "eq" }
        if (want.every(w => lit.has(w))) { S2.got.add("tap"); S2.note = null; say(S2, `All of that multiplies $${nameOf(q)}$.`, "calm", 600) } else say(S2, "Yes. What else multiplies it?", "calm", 600)
      }
      S.eqFn = () => areaRule(q, { pulse: new Set(lit) })
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

/** The working-backwards steps after the fill. */
function backSteps(p: string, q: AQ, o: { quiet?: boolean; rootSay?: string } = {}): Beat[] {
  const board = (S: Scene) => aBoard(S, q, o)
  return [
    tapBlock(`${p}-tap`, `What is multiplying $${nameOf(q)}$? Tap all of it.`, q, o),
    { id: `${p}-cross`, say: "Move it all across the $=$.", enter: S => { board(S); crossBlock(S, q); look(S, [...QLOOK, "eq", "chips"]) }, done: crossDone, advanceAfter: 900 },
    { id: `${p}-bottom`, say: "Work out the bottom first.", enter: S => { board(S); askBlock(S, q); look(S, [...QLOOK, "eq", "keypad"]) }, done: inputRight, advanceAfter: 1700, walk: blockWalk(q) },
    {
      id: `${p}-divide`, say: o.rootSay ?? "Now divide.",
      enter: S => {
        board(S)
        askSideFromArea(S, q, S2 => { S2.sideText[q.unknown!] = () => `${answerText(q)}${unitTex(q)}`; S2.touched = { kind: "side", c: q.unknown! }; S2.flashGood = 1.2 })
        look(S, [...QLOOK, "eq", "keypad"])
      },
      done: inputRight, advanceAfter: 2200, walk: sideFromAreaWalk(q),
    },
  ]
}

/** A number worked out on the keypad (a sum of lengths, a missing angle). */
function askNumber(S: Scene, answer: number, lead: ENode[], o: { dp?: number; sf?: number; typed?: string; slips?: { v: number; say: string }[]; unit?: string; onRight?: (S: Scene) => void } = {}) {
  startInput(S, { answer, dp: o.dp, sf: o.sf, typed: o.typed, slips: o.slips, onRight: o.onRight, max: 24 })
  const shown = o.dp !== undefined ? answer.toFixed(o.dp) : o.sf ? sigText(answer, o.sf) : numText(answer, 2)
  S.eqFn = S2 => row([...lead, S2.input?.state === "right" ? pc("ans", `${shown}${o.unit ?? ""}`, GREEN) : boxNode(S2)])
}

const Q1 = areaQ("q1", 7, 9, 50, { unit: "cm" })
const Q2 = (() => { const q = areaQ("q2", 7, 10, 80, { unit: "cm" }); q.angles = { A: Math.round(q.angle.A) }; return q })()
const Q3 = (() => { const q = areaQ("q3", 8, 6, 65, { unit: "cm" }); q.angles = { A: Math.round(q.angle.A), B: Math.round(q.angle.B) }; return q })()
const Q4 = areaQ("q4", 5, 6, 130, { unit: "cm" })
/** Working backwards: the area is 30 cm², a = 8, angle C = 40°; b is x. */
const Q5 = (() => {
  const b = 30 / (0.5 * 8 * Math.sin(40 * RAD))
  const q = areaQ("q5", 8, b, 40, { find: "side", unknown: "B", area: 30, unit: "cm" })
  q.extra = { segs: [], texts: [{ at: centroid(q), tex: "\\text{Area} = 30\\text{ cm}^{2}" }] }
  return q
})()

// ── the exam questions ───────────────────────────────────────────────────

/** 4024/22/O/N/24 Q8(d): area of triangle ABC (ADB, AEC straight, DE ∥ BC), angle DAE = 76.7° from (c). */
const EX1 = (() => {
  const C = Math.acos((3.6 ** 2 + 5.2 ** 2 - 5.6 ** 2) / (2 * 3.6 * 5.2)) * DEG
  const q = areaQ("ex1", 6.3, 9.1, C, { unit: "cm", given: { "ang-C": 76.7 }, names: { C: "A", A: "C", B: "B", Dp: "D", Ep: "E" } })
  q.P = { C: [0, 0], B: at(6.3, 216), A: at(9.1, 216 + C) }
  q.pts = { Dp: at(3.6, 216), Ep: at(5.2, 216 + C) }
  q.extra = {
    segs: [["Dp", "Ep"]],
    arrows: [["Dp", "Ep"], ["B", "A"]],
    labels: [{ a: "C", b: "Dp", tex: "3.6" }, { a: "Dp", b: "B", tex: "2.7" }, { a: "C", b: "Ep", tex: "5.2" }, { a: "Ep", b: "A", tex: "3.9" }, { a: "Dp", b: "Ep", tex: "5.6", inside: true }],
  }
  return q
})()

/** 4024/22/M/J/17 Q8(c): area of the cross-section ABCDE; DC = 14.97 from (a), angle EAB = 97.5° from (b). */
const EX2 = (() => {
  const DC = Math.sqrt(15.1 * 15.1 - 4)
  const E: Vec = [0, 6], B: Vec = [DC, 4]
  const d = Math.hypot(B[0] - E[0], B[1] - E[1])
  const along = (81 - 121 + d * d) / (2 * d), up = Math.sqrt(81 - along * along)
  const u: Vec = [(B[0] - E[0]) / d, (B[1] - E[1]) / d]
  const A: Vec = [E[0] + u[0] * along - u[1] * up, E[1] + u[1] * along + u[0] * up]
  const C = Math.acos((81 + 121 - 15.1 * 15.1) / 198) * DEG
  const q = areaQ("ex2", 11, 9, C, { unit: "m", given: { "ang-C": 97.5 }, names: { C: "A", A: "E", B: "B", Dp: "D", Cp: "C" } })
  q.P = { C: A, A: E, B }
  q.pts = { Dp: [0, 0], Cp: [DC, 0] }
  q.extra = {
    segs: [["A", "Dp"], ["Dp", "Cp"], ["Cp", "B"]],
    rts: [{ at: "Dp", a: "A", b: "Cp" }, { at: "Cp", a: "Dp", b: "B" }],
    labels: [{ a: "A", b: "Dp", tex: "6" }, { a: "Cp", b: "B", tex: "4" }, { a: "Dp", b: "Cp", tex: "14.97" }],
  }
  q.regions = [{ id: "EAB", pts: ["A", "C", "B"] }, { id: "EBCD", pts: ["A", "B", "Cp", "Dp"] }]
  q.region = "EAB"
  return q
})()
/** The trapezium, from DC = 14.97 as part (a) gives it (what the student types) */
const TRAP = 0.5 * (6 + 4) * 14.97

/** 4024/21/O/N/23 Q9(a)(ii): a triangular prism; AB = 6 cm, angle BAC = 55°, area ABC = 34.4 cm². Show that AC = 14.0 cm. */
const EX3 = (() => {
  const b = 34.4 / (0.5 * 6 * Math.sin(55 * RAD))
  const q = areaQ("ex3", 6, b, 55, { find: "side", unknown: "B", area: 34.4, unit: "cm", name: "AC", sf: 4, names: { C: "A", A: "C", B: "B" } })
  const d: Vec = [10.2, 3.6]
  const add = (p: Vec): Vec => [p[0] + d[0], p[1] + d[1]]
  q.pts = { A2: add(q.P.A), B2: add(q.P.B), C2: add(q.P.C) }
  q.extra = {
    segs: [["B", "B2"], ["A", "A2"], ["B2", "A2"]],
    dash: [["C", "C2"], ["C2", "B2"], ["C2", "A2"]],
    labels: [{ a: "A", b: "A2", tex: "20" }],
    texts: [{ at: centroid(q), tex: "34.4\\text{ cm}^{2}" }],
  }
  return q
})()

/**
 * 4024/21/M/J/23 Q7(b)(ii): quadrilateral PQRS (SQ = 15 cm, angle SPQ = 67°,
 * angle PQS = 74°); angle PSR = 96°, area QRS = 63 cm². (a) Show that
 * SR = 10.0 cm. (b) QR (the cosine rule).
 */
const EX4G = (() => {
  const PS = (15 * Math.sin(74 * RAD)) / Math.sin(67 * RAD)
  const PQ = (15 * Math.sin(39 * RAD)) / Math.sin(67 * RAD)
  const P: Vec = [0, 0], S: Vec = [PS, 0], Q = at(PQ, 67)
  const SR = 63 / (0.5 * 15 * Math.sin(57 * RAD))
  const R: Vec = [S[0] + SR * Math.cos(84 * RAD), S[1] + SR * Math.sin(84 * RAD)]
  return { P, Q, R, S, SR }
})()
const ex4Look = {
  names: { C: "S", A: "R", B: "Q", Pp: "P" },
  pts: { Pp: EX4G.P },
  extra: {
    segs: [["Pp", "B"], ["Pp", "C"]] as [string, string][],
    arcs: [{ at: "Pp", a: "C", b: "B", tex: "67^\\circ" }, { at: "B", a: "Pp", b: "C", tex: "74^\\circ" }],
  },
  regions: [{ id: "QRS", pts: ["B", "A", "C"] }, { id: "PQS", pts: ["Pp", "B", "C"] }],
  region: "QRS",
}
const EX4 = (() => {
  const q = areaQ("ex4", 15, EX4G.SR, 57, { find: "side", unknown: "B", area: 63, unit: "cm", name: "SR", dp: 2, ...ex4Look })
  q.P = { C: EX4G.S, A: EX4G.R, B: EX4G.Q }
  q.extra = { ...ex4Look.extra, texts: [{ at: centroid({ ...q, P: q.P }), tex: "63\\text{ cm}^{2}" }] }
  return q
})()
/** Part (b): QR across the 57°, by the cosine rule, with SR = 10.0 as found. */
const EX4B = (() => {
  const q = sideQ("ex4b", 15, EX4G.SR, 57, { name: "QR", unit: "cm", given: { "side-B": 10 }, names: ex4Look.names, pts: ex4Look.pts, extra: ex4Look.extra })
  q.P = { C: EX4G.S, A: EX4G.R, B: EX4G.Q }
  return q
})()

/** 4024/21/O/N/25 Q20(c): the field (AB = 65 m, AC = 75 m, angle CAB = 125°, BC = 124.3 m); the shortest distance from A to BC. */
const EX5 = (() => {
  const q = areaQ("ex5", 65, 75, 125, { unit: "m", names: { C: "A", A: "C", B: "B" } })
  q.P = { C: [0, 0], A: at(75, -10), B: at(65, -135) }
  return q
})()
const EX5_AREA = areaOf(EX5)

// ── the beats ────────────────────────────────────────────────────────────

const PART_A: Beat[] = [
  // ── 1. The area you know ──
  watch("base", "Here's a triangle with a base of $8$.", S => {
    knownBoard(S)
    S.glowSide = new Set(["B"])
    look(S, ["tri", "fill", "sideLabs"])
  }, 2.0),
  {
    id: "drop-top",
    say: "Pull a line straight down from the top.",
    enter: S => { knownBoard(S); S.mode = "drop"; look(S, ["tri", "fill", "sideLabs"]) },
    done: S => !!S.height && S.height.drop === 1,
    advanceAfter: 1400,
  },
  watch("height-5", "This is its height. It's $5$.", S => { knownBoard(S, { dropped: true }); look(S, ["tri", "fill", "sideLabs", "extra"]) }, 2.0),
  watch("half-bh", "The area is half the base times the height.", S => {
    knownBoard(S, { dropped: true })
    const from: Record<string, Vec> = {}
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("b", "8", BLUE, { from, fly: 1.1 }), op("t1", "\\times"), pc("h", "5", CHALK, { from, fly: 1.1 })])
    from.b = labAt(S, "side-B") ?? [S.w / 2, S.h / 2]
    from.h = labAt(S, "X-BH") ?? [S.w / 2, S.h / 2]
    look(S, ["tri", "fill", "sideLabs", "extra", "eq"])
  }, 2.6),
  {
    id: "type-20",
    say: "Work it out.",
    enter: S => {
      knownBoard(S, { dropped: true })
      askNumber(S, 20, [pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("b", "8", BLUE), op("t1", "\\times"), pc("h", "5"), op("eq2", "=")], { typed: "0.5*8*5", slips: [{ v: 40, say: "Don't forget the half." }] })
      look(S, ["tri", "fill", "sideLabs", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1700,
    walk: [{ say: "Half of $8 \\times 5$.", tex: "\\tfrac{1}{2} \\times 8 \\times 5" }, { say: "That's $20$.", tex: `= ${c(GREEN, "20")}` }],
  },
  watch("no-height", "What if we don't know the height?", S => {
    turnBoard(S, 40, { fit: true })
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.2),

  // ── 2. Finding the height ──
  {
    id: "drop-B",
    say: "Pull the height down from $B$.",
    enter: S => {
      turnBoard(S, 40, { fit: true })
      S.height = { from: "B", drop: 0, since: S.time, glow: null }
      S.mode = "drop"
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
    },
    done: S => !!S.height && S.height.drop === 1,
    advanceAfter: 1400,
  },
  watch("call-h", "We don't know it. Let's call it $h$.", S => { turnBoard(S, 40, { h: true, hLabel: "h", fit: true }); look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]) }, 2.0),
  watch("small-tri", "Look at this right-angled triangle.", S => {
    turnBoard(S, 40, { h: true, hLabel: "h", fit: true })
    S.height!.glow = "C"
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"])
  }, 2.2),
  {
    id: "tap-hyp",
    say: "Tap its hypotenuse.",
    enter: S => {
      turnBoard(S, 40, { h: true, hLabel: "h", fit: true })
      S.height!.glow = "C"
      S.mode = "tapSide"
      S.onSide = (S2, sd) => {
        if (S2.got.has("tap")) return
        if (sd === "A") { S2.got.add("tap"); S2.glowSide = new Set(["A"]); S2.touched = { kind: "side", c: "A" }; S2.flashGood = 1; S2.note = null; return }
        say(S2, sd === "B" ? "That side has the right angle on it. The hypotenuse is across from the right angle." : "That side isn't in this right-angled triangle.", "wrong", 4)
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  {
    id: "tap-across-h",
    say: "Tap the angle across from $h$.",
    enter: S => {
      turnBoard(S, 40, { h: true, hLabel: "h", fit: true })
      S.height!.glow = "C"
      S.arcsOnly = null
      S.mode = "tapAngle"
      S.onAngle = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === "C") { S2.got.add("tap"); S2.glowAng = new Set(["C"]); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1; S2.note = null; S2.arcsOnly = ["C"]; return }
        say(S2, a === "B" ? "That angle touches $h$. Go across from it." : "That angle isn't in this right-angled triangle.", "wrong", 3.6)
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("sin-h", "So $\\sin C = \\dfrac{h}{a}$.", S => {
    turnBoard(S, 40, { h: true, hLabel: "h", fit: true })
    S.height!.glow = "C"
    const from: Record<string, Vec> = {}
    S.eqFn = () => row([pc("sin", "\\sin"), pc("angC", "C", RED, { from, fly: 1.1 }), op("eq", "="), frac("bar", pc("h", "h", CHALK, { from, fly: 1.2 }), pc("a", "a", YELLOW, { from, fly: 1.3 }))])
    from.angC = labAt(S, "ang-C") ?? [S.w / 2, S.h / 2]
    from.h = labAt(S, "X-BH") ?? [S.w / 2, S.h / 2]
    from.a = labAt(S, "side-A") ?? [S.w / 2, S.h / 2]
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
  }, 2.8),
  {
    id: "move-a",
    say: "Move $a$ across to get $h$ on its own.",
    enter: S => {
      turnBoard(S, 40, { h: true, hLabel: "h", fit: true })
      startCross(S, {
        ids: ["a"], label: c(YELLOW, "a"), from: "right",
        options: ["$\\times\\,a$", "$\\div\\,a$"], answer: 0,
        notes: { 1: "It was dividing. Across, it multiplies." },
        ask: "What does $a$ become over there?",
        before: L => row([pc("sin", "\\sin", undefined, L), pc("angC", "C", RED, L), op("eq", "="), frac("bar", pc("h", "h", CHALK, L), pc("a", "a", YELLOW, L))]),
        after: () => row([pc("a", "a", YELLOW), pc("sin", "\\sin"), pc("angC", "C", RED), op("eq", "="), pc("h", "h")], 0.1),
      })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: crossDone,
    advanceAfter: 900,
  },
  watch("h-is", "The height is $a\\sin C$.", S => {
    turnBoard(S, 40, { h: true, hLabel: "a\\sin C", fit: true })
    eqSlow(S.eq, 1.2)
    S.eqFn = () => row([pc("h", "h"), op("eq", "="), pc("a", "a", YELLOW), pc("sin", "\\sin"), pc("angC", "C", RED)], 0.1)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
  }, 2.4),
  watch("area-bh", "The area is half the base times the height.", S => {
    turnBoard(S, 40, { h: true, hLabel: "a\\sin C", fit: true })
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("b", "b", BLUE), op("t1", "\\times"), pc("h", "h")])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
  }, 2.4),
  {
    id: "put-in",
    say: "Put $a\\sin C$ in place of $h$.",
    enter: S => {
      turnBoard(S, 40, { h: true, hLabel: "a\\sin C", fit: true })
      let landed: Vec | null = null
      S.fill = {
        slots: [{ id: "h", want: "X-BH", kind: "side" }],
        filled: {},
        items: { "X-BH": { id: "X-BH", kind: "side", tex: "a\\sin C", col: CHALK } },
        onDrop: (S2, item, slot, p) => {
          if (slot !== "h" || item !== "X-BH") { say(S2, "Drop it on $h$.", "calm", 2.6); return }
          S2.fill!.filled.h = item
          landed = p
          S2.touched = { kind: "eq" }
          S2.flashGood = 0.6
          later(S2, 1.2, S3 => S3.got.add("in"))
        },
      }
      S.mode = "fill"
      S.eqFn = () => {
        if (!landed) return row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("b", "b", BLUE), op("t1", "\\times"), pc("h", "h", CHALK, {}, { pulse: true })])
        const from = { a: landed, sin: landed, angC: landed }
        return row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("b", "b", BLUE), op("t1", "\\times"), row([pc("a", "a", YELLOW, { from, fly: 0.8 }), pc("sin", "\\sin", undefined, { from, fly: 0.8 }), pc("angC", "C", RED, { from, fly: 0.8 })], 0.1)])
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
    },
    done: S => S.got.has("in"),
    advanceAfter: 600,
  },
  watch("half-ab", "So the area is $\\tfrac{1}{2}ab\\sin C$.", S => {
    turnBoard(S, 40, { h: true, hLabel: "a\\sin C", fit: true })
    eqSlow(S.eq, 1.3)
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), row([pc("half", HALF), pc("a", "a", YELLOW), pc("b", "b", BLUE), pc("sin", "\\sin"), pc("angC", "C", RED)], 0.1)])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
  }, 2.6),
  watch("page", "It's on your exam's formula page, just like this.", S => {
    turnBoard(S, 40, { fit: true })
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), row([pc("half", HALF), pc("a", "a", YELLOW), pc("b", "b", BLUE), pc("sin", "\\sin"), pc("angC", "C", RED)], 0.1)])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.2),
  watch("between", "$a$ and $b$ are two sides. $C$ is the angle between them.", S => {
    turnBoard(S, 40, { fit: true })
    S.glowSide = new Set(["A", "B"])
    S.pulseAng = new Set(["C"])
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), row([pc("half", HALF), pc("a", "a", YELLOW, {}, { pulse: true }), pc("b", "b", BLUE, {}, { pulse: true }), pc("sin", "\\sin"), pc("angC", "C", RED, {}, { pulse: true })], 0.1)])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.6),

  // ── 3. Turning the angle ──
  {
    id: "turn",
    say: "Turn side $a$ and watch the area.",
    enter: S => {
      turnBoard(S, "keep", { h: true })
      turnB(S)
      trackTurn(S)
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => S.got.has("turned"),
    free: true,
    minPlay: 4,
  },
  {
    id: "biggest",
    say: "Make the area as big as you can.",
    enter: S => {
      turnBoard(S, "keep", { h: true })
      if (shownC(S) > 70 && shownC(S) < 110) turnBoard(S, 55, { h: true })
      turnB(S, 90, S2 => (turnArea(S2) < 23.9 ? "It can be bigger. Keep turning and watch the area." : null))
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("at-90", "It's biggest at $90^\\circ$, where $\\sin C$ is $1$.", S => {
    turnBoard(S, 90, { h: true })
    S.eqFn = liveArea
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.4),
  {
    id: "past-90",
    say: "Now turn it past $90^\\circ$.",
    enter: S => {
      turnBoard(S, 90, { h: true })
      turnB(S)
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => shownC(S) > 90,
    free: true,
    minPlay: 3,
  },
  watch("outside", "The height now lands outside the triangle.", S => {
    turnBoard(S, "keep", { h: true })
    if (shownC(S) < 110) turnBoard(S, 125, { h: true })
    S.eqFn = liveArea
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.2),
  watch("still", "The rule still works.", S => {
    turnBoard(S, "keep", { h: true })
    if (shownC(S) <= 90) turnBoard(S, 125, { h: true })
    S.eqFn = liveArea
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 1.8),
  {
    id: "make-30",
    say: "Make angle $C$ $30^\\circ$.",
    enter: S => {
      turnBoard(S, "keep", { h: true })
      turnB(S, 30)
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => S.locked,
    advanceAfter: 1400,
  },
  watch("is-12", "The area is $12$.", S => {
    turnBoard(S, 30, { h: true })
    S.eqFn = liveArea
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 1.8),
  {
    id: "make-150",
    say: "Now make it $150^\\circ$.",
    enter: S => {
      turnBoard(S, 30, { h: true })
      S.P.G = at(TA, 30)
      S.ghost = ["A", "G", "C"]
      turnB(S, 150)
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => S.locked,
    advanceAfter: 1400,
  },
  watch("same", "It's the same area, because $\\sin 150^\\circ$ is the same as $\\sin 30^\\circ$.", S => {
    turnBoard(S, 150, { h: true })
    S.P.G = at(TA, 30)
    S.ghost = ["A", "G", "C"]
    S.eqFn = liveArea
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.8),

  // ── 4. Finding the area ──
  watch("q1", "Find the area of this triangle.", S => { aBoard(S, Q1); look(S, QLOOK) }, 1.8),
  tapBetween("q1-angle", "Tap the angle between the two sides.", Q1),
  fillArea("q1-fill", "Drag the sides and the angle into the rule.", Q1),
  calcArea("q1-calc", "Work it out. The half is $\\times\\,0.5$.", Q1),
  watch("q1-units", "Area is in square units.", S => {
    aBoard(S, Q1)
    S.extra = { segs: [], texts: [{ at: centroid(Q1), tex: `${answerText(Q1)}\\text{ cm}^{2}`, col: GREEN, pulse: true }] }
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), pc("res", `${answerText(Q1)}\\text{ cm}^{2}`, GREEN, {}, { pulse: true })])
    look(S, [...QLOOK, "eq"])
  }, 2.0),
  tapBetween("q2-angle", "This one shows two angles. Tap the one between the sides.", Q2),
  fillArea("q2-fill", "Fill the rule.", Q2, { more: { "ang-A": degT(Q2.angles!.A!) } }),
  calcArea("q2-calc", "Work it out.", Q2),
  watch("q3", "Here the angle between them isn't given.", S => { aBoard(S, Q3, { hideC: true }); S.pulseAng = new Set(["C"]); look(S, QLOOK) }, 2.2),
  {
    id: "q3-angle",
    say: "Work out angle $C$ first.",
    enter: S => {
      aBoard(S, Q3, { hideC: true })
      S.angText.C = () => c(RED, "?")
      S.pulseAng = new Set(["C"])
      const A = Q3.angles!.A!, B = Q3.angles!.B!, v = 180 - A - B
      askNumber(S, v, [pc("n", `\\angle ${c(RED, "C")}`), op("eq", "=")], {
        unit: "^\\circ", typed: `180-${A}-${B}`,
        slips: [
          { v: A + B, say: "That's the two angles added. Take them away from $180^\\circ$." },
          { v: 180 - A, say: `Take $${B}^\\circ$ away too.` },
          { v: 180 - B, say: `Take $${A}^\\circ$ away too.` },
        ],
        onRight: S2 => { S2.angText.C = () => degT(v); S2.pulseAng = new Set(); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1700,
    walk: [{ say: "The three angles add up to $180^\\circ$.", tex: `180 - ${Q3.angles!.A} - ${Q3.angles!.B}` }, { say: "That leaves the angle between them.", tex: `= ${c(GREEN, `${180 - Q3.angles!.A! - Q3.angles!.B!}^\\circ`)}` }],
  },
  fillArea("q3-fill", "Fill the rule.", Q3, { more: { "ang-A": degT(Q3.angles!.A!), "ang-B": degT(Q3.angles!.B!) } }),
  calcArea("q3-calc", "Work it out.", Q3),
  watch("q4", "This angle is obtuse. The rule works the same.", S => { aBoard(S, Q4); look(S, QLOOK) }, 2.2),
  fillArea("q4-fill", "Fill the rule.", Q4),
  calcArea("q4-calc", "Work it out.", Q4),

  // ── 5. Working backwards ──
  watch("back", "This time we know the area. We want $x$.", S => { aBoard(S, Q5); S.pulseSide = new Set(["B"]); look(S, QLOOK) }, 2.4),
  fillArea("back-fill", "Fill the rule.", Q5),
  ...backSteps("back", Q5),
]

// ── 6. The shortest distance ─────────────────────────────────────────────

/** A triangle with A (here corner C) at the top; P slides along BC (here AB). */
const SH: Record<Corner, Vec> = { A: [0, 0], B: [10, 0], C: [3.6, 5.4] }
function slideBoard(S: Scene, o: { p?: number; locked?: boolean } = {}) {
  resetBeat(S)
  setTri(S, SH)
  S.coloured = new Set()
  S.names = { C: "A", A: "B", B: "C", P: "P" }
  S.arcsOnly = []
  const foot = heightFoot(S, false)
  const tFoot = foot[0] / SH.B[0]
  const t = o.locked ? tFoot : o.p ?? 0.82
  S.P.P = [SH.B[0] * t, 0]
  const live = (S2: Scene) => {
    const d = dist(S2.P.P, S2.P.C)
    const at90 = Math.abs(S2.P.P[0] - foot[0]) < 1e-6
    S2.extra = { segs: [["C", "P"]], labels: [{ a: "C", b: "P", tex: numText(d, 2), col: at90 ? GREEN : YELLOW }], rts: at90 ? [{ at: "P", a: "B", b: "C" }] : [] }
  }
  live(S)
  S.tick = live
  S.frameFn = () => figFrame(S, ["A", "B", "C"])
  return { foot, tFoot }
}

const PART_B: Beat[] = [
  watch("how-far", "How far is $A$ from the line $BC$?", S => { slideBoard(S); look(S, ["tri", "fill", "letters", "extra"]) }, 2.2),
  {
    id: "slide-P",
    say: "Slide $P$ along $BC$ until $AP$ is as short as it can be.",
    enter: S => {
      const { foot } = slideBoard(S)
      S.mode = "rule"
      S.lockOnSnap = true
      S.rule = {
        pt: "P",
        place: (_S, w) => [clamp(w[0], 0.4, SH.B[0] - 0.4), 0],
        snap: (_S, p) => (Math.abs(p[0] - foot[0]) < 0.35 ? [foot[0], 0] : null),
      }
      S.releaseNote = () => "Can it be shorter? Keep sliding."
      look(S, ["tri", "fill", "letters", "extra"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("right-angle", "It's shortest when it meets $BC$ at a right angle.", S => { slideBoard(S, { locked: true }); look(S, ["tri", "fill", "letters", "extra"]) }, 2.4),
  watch("its-height", "It's the height from $A$.", S => { slideBoard(S, { locked: true }); look(S, ["tri", "fill", "letters", "extra"]) }, 2.0),
  watch("area-base", "So the area is half of $BC$ times this height.", S => {
    slideBoard(S, { locked: true })
    S.eqFn = () => row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("bc", "BC"), op("t1", "\\times"), pc("h", "\\text{height}", GREEN)])
    look(S, ["tri", "fill", "letters", "extra", "eq"])
  }, 2.6),
  watch("area-two", "It's also $\\tfrac{1}{2} \\times AB \\times AC \\times \\sin A$. Both give the same area.", S => {
    slideBoard(S, { locked: true })
    S.eqFn = () => stack("stk",
      row([pc("ar", "\\text{Area}"), op("eq", "="), pc("half", HALF), op("t0", "\\times"), pc("bc", "BC"), op("t1", "\\times"), pc("h", "\\text{height}", GREEN)]),
      row([pc("ar2", "\\text{Area}"), op("eq2", "="), pc("half2", HALF), op("u0", "\\times"), pc("ab", "AB"), op("u1", "\\times"), pc("ac", "AC"), op("u2", "\\times"), pc("sin", "\\sin A")]))
    look(S, ["tri", "fill", "letters", "extra", "eq"])
  }, 3.0),
]

// ── 7. Exam questions ────────────────────────────────────────────────────

/** Tap the part of the figure (a triangle, a trapezium) the question is about. */
function tapPart(id: string, text: string, q: AQ, part: string, wrong: string): Beat {
  return {
    id, say: text,
    enter: S => {
      aBoard(S, q)
      S.regions = q.regions ?? null
      S.mode = "tapRegion"
      S.onRegion = (S2, r) => {
        if (S2.got.has("tap")) return
        if (r === part) { S2.got.add("tap"); S2.regionLit = r; S2.mode = "none"; S2.touched = { kind: "tri" }; S2.flashGood = 1; S2.note = null; return }
        say(S2, wrong, "wrong", 3.6)
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

const EX1_LABELS = { A: "9.1", B: "6.3" }
function ex1Board(S: Scene, o: { ab?: boolean; ac?: boolean } = {}) {
  aBoard(S, EX1, { sideC: "9.8" })
  S.sideText.A = () => (o.ab ? EX1_LABELS.B : "")
  S.sideText.B = () => (o.ac ? EX1_LABELS.A : "")
  // once a side's total is found, its two parts have done their job
  const gone = [...(o.ab ? ["C-Dp", "Dp-B"] : []), ...(o.ac ? ["C-Ep", "Ep-A"] : [])]
  if (S.extra?.labels) S.extra = { ...S.extra, labels: S.extra.labels.filter(l => !gone.includes(`${l.a}-${l.b}`)) }
}
/** Once AB and AC are added up, the parts of them (and D and E) have done their job: only the totals stay. */
function ex1Totals(S: Scene) {
  if (S.extra) S.extra = { ...S.extra, labels: [], quiet: true }
  S.names = { C: "A", A: "C", B: "B" }
}

const PART_C: Beat[] = [
  // 4024/22/O/N/24 Q8(d)
  watch("ex1", "This is the parallel lines question from the cosine rule lesson. Angle $DAE$ was $76.7^\\circ$.", S => { ex1Board(S); look(S, QLOOK) }, 2.8),
  watch("ex1-q", "Now calculate the area of triangle $ABC$.", S => { ex1Board(S); S.regions = [{ id: "ABC", pts: ["A", "B", "C"] }]; S.regionLit = "ABC"; look(S, QLOOK) }, 2.0),
  {
    id: "ex1-ab",
    say: "What is $AB$?",
    enter: S => {
      ex1Board(S)
      S.glowSide = new Set(["A"])
      askNumber(S, 6.3, [pc("n", "AB", YELLOW), op("eq", "=")], {
        typed: "3.6+2.7",
        slips: [{ v: 3.6, say: "That's only $AD$. $AB$ goes on to $B$." }, { v: 2.7, say: "That's only $DB$. $AB$ starts at $A$." }],
        onRight: S2 => { S2.sideText.A = () => "6.3"; S2.touched = { kind: "side", c: "A" }; S2.flashGood = 1 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1500,
    walk: [{ say: "$AB$ is $AD$ and $DB$ together.", tex: "3.6 + 2.7" }, { say: "So", tex: `AB = ${c(GREEN, "6.3")}` }],
  },
  {
    id: "ex1-ac",
    say: "What is $AC$?",
    enter: S => {
      ex1Board(S, { ab: true })
      S.glowSide = new Set(["B"])
      askNumber(S, 9.1, [pc("n", "AC", BLUE), op("eq", "=")], {
        typed: "5.2+3.9",
        slips: [{ v: 5.2, say: "That's only $AE$. $AC$ goes on to $C$." }, { v: 3.9, say: "That's only $EC$. $AC$ starts at $A$." }],
        onRight: S2 => { S2.sideText.B = () => "9.1"; S2.touched = { kind: "side", c: "B" }; S2.flashGood = 1 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1500,
    walk: [{ say: "$AC$ is $AE$ and $EC$ together.", tex: "5.2 + 3.9" }, { say: "So", tex: `AC = ${c(GREEN, "9.1")}` }],
  },
  withTotals(tapBetween("ex1-angle", "Tap the angle between $AB$ and $AC$.", EX1, { sideC: "9.8" })),
  withTotals(fillArea("ex1-fill", "Fill the rule.", EX1, { sideC: "9.8", more: { "side-C": "9.8" } })),
  withTotals(calcArea("ex1-calc", "Work it out.", EX1, { sideC: "9.8" })),

  // 4024/22/M/J/17 Q8(c)
  watch("ex2", "This is the building from the cosine rule lesson. Calculate the area of its cross-section.", S => { aBoard(S, EX2, { sideC: "15.1" }); look(S, QLOOK) }, 2.8),
  watch("ex2-parts", "From parts (a) and (b), $DC = 14.97\\text{ m}$ and angle $EAB = 97.5^\\circ$.", S => { aBoard(S, EX2, { sideC: "15.1" }); look(S, QLOOK) }, 2.6),
  tapPart("ex2-tri", "It's a triangle and a trapezium. First tap the triangle.", EX2, "EAB", "That's the trapezium. Tap the triangle on top."),
  fillArea("ex2-fill", "Fill the rule for the triangle.", EX2, { quiet: true, sideC: "15.1", more: { "side-C": "15.1" } }),
  calcArea("ex2-calc", "Work it out.", EX2, { quiet: true, sideC: "15.1" }),
  {
    id: "ex2-trap",
    say: "Next is the trapezium. Work out its area.",
    enter: S => {
      aBoard(S, EX2, { sideC: "15.1" })
      S.regions = EX2.regions!
      S.regionLit = "EBCD"
      askNumber(S, TRAP, [pc("n", "\\text{Area}"), op("eq", "=")], {
        sf: 3, typed: "0.5*10*14.97", unit: "\\text{ m}^{2}",
        slips: [{ v: 10 * 14.97, say: "Don't forget the half." }, { v: 6 * 14.97, say: "That's a rectangle as tall as $6\\text{ m}$. The trapezium's top slopes down to $4\\text{ m}$." }, { v: 4 * 14.97, say: "That's a rectangle as tall as $4\\text{ m}$. The trapezium's top slopes up to $6\\text{ m}$." }],
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1700,
    walk: [{ say: "Half the two parallel sides added, times the distance between them.", tex: "\\tfrac{1}{2} \\times (6 + 4) \\times 14.97" }, { say: "So", tex: `= ${c(GREEN, `${sigText(TRAP, 3)}\\text{ m}^{2}`)}` }],
  },
  {
    id: "ex2-total",
    say: "What is the area of the whole cross-section?",
    enter: S => {
      aBoard(S, EX2)
      // the two areas found, written on their parts
      const tri = areaOf(EX2)
      const top = centroid(EX2), base = EX2.pts!.Cp
      S.extra = { ...S.extra!, texts: [{ at: [top[0], top[1] - 0.2], tex: `${sigText(tri, 3)}\\text{ m}^{2}`, col: GREEN }, { at: [base[0] / 2, 2.1], tex: `${sigText(TRAP, 3)}\\text{ m}^{2}`, col: GREEN }] }
      askNumber(S, tri + TRAP, [pc("n", "\\text{Area}"), op("eq", "=")], {
        sf: 3, typed: `${sigText(tri, 3)}+${sigText(TRAP, 3)}`, unit: "\\text{ m}^{2}",
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2000,
    walk: [{ say: "The triangle and the trapezium together.", tex: `${sigText(areaOf(EX2), 3)} + ${sigText(TRAP, 3)}` }, { say: "So the cross-section is", tex: `${c(GREEN, `${sigText(areaOf(EX2) + TRAP, 3)}\\text{ m}^{2}`)}` }],
  },

  // 4024/21/O/N/23 Q9(a)(ii)
  watch("ex3", "The diagram shows a triangular prism. $AB = 6\\text{ cm}$ and angle $BAC = 55^\\circ$.", S => { aBoard(S, EX3); look(S, QLOOK) }, 2.6),
  watch("ex3-q", "The area of triangle $ABC$ is $34.4\\text{ cm}^2$. Show that $AC = 14.0\\text{ cm}$.", S => { aBoard(S, EX3); S.pulseSide = new Set(["B"]); look(S, QLOOK) }, 2.8),
  fillArea("ex3-fill", "Fill the rule.", EX3),
  ...backSteps("ex3", EX3, { rootSay: "A *show that* needs more figures than the answer it gives. Give $4$ significant figures." }),
  watch("ex3-shown", "$14.00$ is $14.0$ to $3$ significant figures. That shows it.", S => {
    aBoard(S, EX3)
    S.sideText.B = () => "14.00\\text{ cm}"
    S.eqFn = () => row([pc("x", "AC", BLUE), op("eq", "="), pc("ans", "14.00", GREEN), op("ap", "="), pc("r", "14.0\\text{ cm}", GREEN)])
    look(S, [...QLOOK, "eq"])
  }, 2.6),

  // 4024/21/M/J/23 Q7(b)(ii)
  watch("ex4", "This is the quadrilateral from the sine rule lesson.", S => { aBoard(S, EX4, { hideC: true }); S.sideText.B = () => ""; look(S, QLOOK) }, 2.2),
  watch("ex4-q", "Angle $PSR = 96^\\circ$ and the area of triangle $QRS$ is $63\\text{ cm}^2$. Show that $SR = 10.0\\text{ cm}$.", S => { aBoard(S, EX4, { hideC: true }); look(S, QLOOK) }, 3.0),
  {
    id: "ex4-psq",
    say: "First, work out angle $PSQ$.",
    enter: S => {
      aBoard(S, EX4, { hideC: true })
      S.extra = { ...S.extra!, arcs: [...(S.extra!.arcs ?? []), { at: "C", a: "Pp", b: "B", tex: "?", pulse: true }] }
      askNumber(S, 39, [pc("n", "\\angle PSQ"), op("eq", "=")], {
        unit: "^\\circ", typed: "180-67-74",
        slips: [{ v: 141, say: "That's the two angles added. Take them away from $180^\\circ$." }, { v: 113, say: "Take $74^\\circ$ away too." }, { v: 106, say: "Take $67^\\circ$ away too." }],
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1500,
    walk: [{ say: "Triangle $PQS$'s angles add up to $180^\\circ$.", tex: "180 - 67 - 74" }, { say: "So", tex: `= ${c(GREEN, "39^\\circ")}` }],
  },
  {
    id: "ex4-qsr",
    say: "What is angle $QSR$?",
    enter: S => {
      aBoard(S, EX4, { hideC: true })
      // angle PSR is split by SQ into the 39° just found and angle QSR
      // the 96° is written round the outside, over the part that is angle QSR (lit red)
      S.extra = { ...S.extra!, arcs: [...(S.extra!.arcs ?? []), { at: "C", a: "Pp", b: "B", tex: "39^\\circ" }, { at: "C", a: "Pp", b: "A", tex: "96^\\circ", scale: 1.9, along: 0.72 }] }
      S.glowAng = new Set(["C"])
      askNumber(S, 57, [pc("n", `\\angle QSR`), op("eq", "=")], {
        unit: "^\\circ", typed: "96-39",
        slips: [{ v: 135, say: "Angle $QSR$ is part of the $96^\\circ$, so it's smaller." }],
        onRight: S2 => { S2.angText.C = () => "57^\\circ"; S2.glowAng = new Set(); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1500,
    walk: [{ say: "Angle $PSR$ is split into $39^\\circ$ and angle $QSR$.", tex: "96 - 39" }, { say: "So", tex: `= ${c(GREEN, "57^\\circ")}` }],
  },
  tapPart("ex4-tri", "Tap triangle $QRS$.", EX4, "QRS", "That's triangle $PQS$. Tap $QRS$."),
  fillArea("ex4-fill", "Fill the rule.", EX4, { quiet: true }),
  ...backSteps("ex4", EX4, { quiet: true, rootSay: "Work it out. Give $2$ decimal places, so it shows $10.0$." }),
  watch("ex4-b", "Now calculate $QR$. It's across from the $57^\\circ$, so we use the cosine rule.", S => {
    aBoard(S, EX4, { quiet: true })
    S.sideText.B = () => "10.0"
    S.sideText.C = () => "QR"
    S.pulseSide = new Set(["C"])
    look(S, QLOOK)
  }, 2.8),
  {
    id: "ex4-fill-cos",
    say: "Fill the cosine rule.",
    enter: S => {
      ex4bBoard(S)
      startCosFill(S, EX4B, "side", ["sx", "ang", "s1", "s2"], { "side-A": "15", "side-B": "10", "side-C": "QR", "ang-C": "57^\\circ" })
      look(S, [...QLOOK, "eq"])
    },
    done: S => cosFilled(S, ["sx", "ang", "s1", "s2"]),
    advanceAfter: 1500,
  },
  {
    id: "ex4-cos-calc",
    say: "Work out the right side.",
    enter: S => { ex4bBoard(S); askSquare(S, EX4B); look(S, [...QLOOK, "eq", "keypad"]) },
    done: inputRight,
    advanceAfter: 1700,
    walk: squareWalk(EX4B),
  },
  { id: "ex4-cos-cross", say: "Now move the square across the $=$.", enter: S => { ex4bBoard(S); crossSquare(S, EX4B); look(S, [...QLOOK, "eq", "chips"]) }, done: crossDone, advanceAfter: 900 },
  {
    id: "ex4-cos-root",
    say: "Work it out.",
    enter: S => { ex4bBoard(S); askRoot(S, EX4B, S2 => { S2.sideText.C = () => "12.7\\text{ cm}"; S2.touched = { kind: "side", c: "C" }; S2.flashGood = 1.2 }); look(S, [...QLOOK, "eq", "keypad"]) },
    done: inputRight,
    advanceAfter: 2200,
    walk: rootWalk(EX4B),
  },

  // 4024/21/O/N/25 Q20(c)
  watch("ex5", "This is the field from the other two lessons. Calculate the shortest distance from $A$ to $BC$.", S => { aBoard(S, EX5, { sideC: "124.3\\text{ m}" }); look(S, QLOOK) }, 2.8),
  {
    id: "ex5-drop",
    say: "The shortest distance is the height. Pull it down from $A$.",
    enter: S => {
      aBoard(S, EX5, { sideC: "124.3\\text{ m}" })
      S.height = { from: "C", drop: 0, since: S.time, glow: null }
      S.mode = "drop"
      look(S, QLOOK)
    },
    done: S => !!S.height && S.height.drop === 1,
    advanceAfter: 1400,
  },
  fillArea("ex5-fill", "First we need the area. Fill the rule.", EX5, { sideC: "124.3\\text{ m}", more: { "side-C": "124.3" } }),
  calcArea("ex5-calc", "Work it out.", EX5, { sideC: "124.3\\text{ m}" }),
  watch("ex5-also", "The area is also $\\tfrac{1}{2} \\times 124.3 \\times h$.", S => { ex5hBoard(S); S.eqFn = () => ex5Line(); look(S, [...QLOOK, "eq"]) }, 2.6),
  {
    id: "ex5-tap",
    say: "What is multiplying $h$? Tap all of it.",
    enter: S => {
      ex5hBoard(S)
      const lit = new Set<string>()
      S.mode = "tapEq"
      S.tapAtoms = ["half", "bc", "h", "ar"]
      S.onAtom = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === "h") { say(S2, "That's $h$ itself. Tap what multiplies it.", "wrong", 3.4); return }
        if (a === "ar") { say(S2, "That's on the other side of the $=$.", "wrong", 3.4); return }
        lit.add(a)
        if (lit.has("half") && lit.has("bc")) { S2.got.add("tap"); say(S2, "Both multiply $h$.", "calm", 600) } else say(S2, "Yes. What else multiplies it?", "calm", 600)
      }
      S.eqFn = () => ex5Line({ pulse: lit })
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  },
  {
    id: "ex5-cross",
    say: "Move it all across the $=$.",
    enter: S => {
      ex5hBoard(S)
      startCross(S, {
        ids: ["half", "bc"], label: "\\tfrac{1}{2} \\times 124.3", from: "left",
        options: ["$\\div \\left(\\tfrac{1}{2} \\times 124.3\\right)$", "$-\\,\\tfrac{1}{2} \\times 124.3$"], answer: 0,
        notes: { 1: "It was multiplying. Across, it divides." },
        before: L => ex5Line(L),
        after: () => ex5Solved(),
      })
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: crossDone,
    advanceAfter: 900,
  },
  {
    id: "ex5-bottom",
    say: "Work out the bottom first.",
    enter: S => {
      ex5hBoard(S)
      askNumber(S, 62.15, [pc("k.half", HALF), op("k.t0", "\\times"), pc("k.bc", "124.3", RED), op("k.eq", "=")], { typed: "0.5*124.3", slips: [{ v: 124.3, say: "Don't forget the half." }] })
      const inner = S.eqFn!
      S.eqFn = S2 => stack("stk", ex5Solved(), inner(S2)!)
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1500,
    walk: [{ say: "Half of $124.3$.", tex: "\\tfrac{1}{2} \\times 124.3" }, { say: "So", tex: `= ${c(GREEN, "62.15")}` }],
  },
  {
    id: "ex5-divide",
    say: "Now divide.",
    enter: S => {
      ex5hBoard(S)
      setAns(62.15)
      const v = EX5_AREA / 62.15
      startInput(S, { answer: v, sf: 3, max: 24, typed: `${dots(EX5_AREA).replace("\\ldots", "")}/a`, slips: [{ v: 62.15 / EX5_AREA, say: "It's the area divided by the bottom." }], onRight: S2 => { S2.extra = { ...(S2.extra ?? { segs: [] }), labels: [{ a: "C", b: "H", tex: `${sigText(v, 3)}\\text{ m}`, col: GREEN }] }; S2.flashGood = 1.2 } })
      S.eqFn = S2 => row([pc("h", "h", GREEN), op("eq", "="), frac("bar", pc("ar", dots(EX5_AREA)), pc("botv", "62.15")), op("eq2", "="), S2.input?.state === "right" ? pc("ans", `${sigText(v, 3)}\\text{ m}`, GREEN) : boxNode(S2)])
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: [{ say: "Divide the area by the bottom.", tex: `${dots(EX5_AREA)} \\div 62.15` }, { say: "So the shortest distance is", tex: `h = ${c(GREEN, `${sigText(EX5_AREA / 62.15, 3)}\\text{ m}`)}` }],
  },

  // ── 8. The end ──
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      turnBoard(S, 70, { h: true })
      turnB(S)
      S.eqFn = liveArea
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

/** A beat on the parallel-lines figure once AB and AC are known (enter, then tidy the figure). */
function withTotals(b: Beat): Beat {
  return { ...b, enter: S => { b.enter(S); ex1Totals(S) } }
}

/** Part (b) of the quadrilateral: triangle QRS with SR = 10.0, for the cosine rule. */
function ex4bBoard(S: Scene) {
  aBoard(S, EX4, { quiet: true })
  S.sideText = { A: () => "15", B: () => "10", C: () => "QR" }
  S.angText.C = () => "57^\\circ"
}

/** The field with its height dropped, labelled h. */
function ex5hBoard(S: Scene) {
  aBoard(S, EX5, { sideC: "124.3\\text{ m}" })
  S.height = { from: "C", drop: 1, since: S.time, glow: null }
  S.P.H = heightFoot(S, false)
  S.extra = { segs: [], labels: [{ a: "C", b: "H", tex: "h" }] }
}
/** ½ × 124.3 × h = 1996.6… */
const ex5Line = (L: Look = {}) => row([pc("half", HALF, undefined, L), op("t0", "\\times"), pc("bc", "124.3", RED, L), op("t1", "\\times"), pc("h", "h", CHALK, L), op("eq", "="), pc("ar", dots(EX5_AREA), CHALK, L)])
/** h = 1996.6… / (½ × 124.3) */
const ex5Solved = () => row([pc("h", "h"), op("eq", "="), frac("bar", pc("ar", dots(EX5_AREA)), row([pc("half", HALF), op("t0", "\\times"), pc("bc", "124.3", RED)]))])

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C]

const PARTS: [string, string][] = [
  ["base", "The area you know"],
  ["drop-B", "Finding the height"],
  ["turn", "Turning the angle"],
  ["q1", "Finding the area"],
  ["back", "Working backwards"],
  ["how-far", "The shortest distance"],
  ["ex1", "Exam questions"],
]
applyParts(BEATS, PARTS)

