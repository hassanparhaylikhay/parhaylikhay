/**
 * Bearings in triangles (6.3, after the sine rule, the cosine rule and the
 * area of a triangle; the Bearings lessons of 4.3 come first).
 *
 * Two moves, each seen on the figure as arcs from North:
 *  - two bearings from one place give the angle between them: the smaller
 *    bearing's arc and the angle inside the triangle together make the
 *    bigger one's;
 *  - an angle inside the triangle turns a bearing you know into the one you
 *    want: add it or take it away. From the other end, the bearing back comes
 *    first (the line carries on past the point; half a turn faces back).
 *
 * The rules run exactly as in their own lessons (the same beats, from
 * beats.ts and beats-cos.ts). Bearings are orange here, because yellow, blue
 * and red belong to the rules' pairs. A half turn is chalk.
 *
 * Questions from the papers: 4024/21/M/J/24 Q9(b), 4024/21/M/J/19 Q11(a),
 * 4024/21/O/N/21 Q4(a), 4024/21/O/N/22 Q10(a), 4024/21/M/J/22 Q9,
 * 4024/21/O/N/19 Q9(b), 4024/22/O/N/23 Q9(a)(ii).
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { op, row, atom, frac, type ENode } from "../equation"
import {
  type Scene, type Corner, type VisKey, type BrgArc, CORNERS, CHALK, GREEN, PAIR_COL, RAD, DEG,
  show, later, say, startInput, boxNode, choose, angleAt,
} from "./scene"
import { type CRQ, sideQ, angleQ } from "./cos"
import { type QSpec, qBoard, tapFullPair, fillBeat, flipBeat, moveBeat, sinCalc, undoBeat, angleCalc } from "./beats"
import { type Beat, cqBoard, tapTwoSides, tapSideAcross, fillCos, ALL, sideSteps, angleSteps } from "./beats-cos"

const ORANGE = "#ff822c"
const LOOK: VisKey[] = ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]
const look = (S: Scene, more: VisKey[] = []) => show(S, ["board", ...LOOK, ...more])
/** The paper's figure before its triangle is drawn in (a construction line still to come). */
const lookNoTri = (S: Scene) => show(S, ["board", "letters", "extra", "sideLabs"])
const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 2.0): Beat => ({ id, say: text, enter, cta: "", ctaAfter })
const inputRight = (S: Scene) => S.input?.state === "right"

/** A point a bearing and distance from another (world: x east, y north). */
const along = (p: Vec, b: number, d: number): Vec => [p[0] + d * Math.sin(b * RAD), p[1] + d * Math.cos(b * RAD)]
const O: Vec = [0, 0]
const deg = (d: number, dp = 0) => `${dp ? d.toFixed(dp) : String(Math.round(d))}^\\circ`
/** A number as a slip is matched (to the places the student would type). */
const r1 = (x: number) => Number(x.toFixed(1))

/** Arc radii (as multiples of the usual): a first bearing, and a second one round it. */
const R1 = 1.75, R2 = 2.4

/** An arc at a point: a bearing (from North), or an angle turned clockwise from one. */
function arc(at: string, from: number, sweep: number, o: { id?: string; col?: string; tex?: string; r?: number; pulse?: boolean; dash?: boolean; grow?: boolean; noTap?: boolean } = {}): BrgArc {
  return { id: o.id ?? `${at}:${from}:${Math.round(sweep * 10)}`, at, from, sweep, col: o.col ?? ORANGE, tex: o.tex, r: o.r, pulse: o.pulse, dash: o.dash, grow: o.grow ? { v: 0, t: 1 } : undefined, noTap: o.noTap }
}
/** A bearing: orange, from North. */
const brg = (at: string, b: number, tex: string, o: { r?: number; pulse?: boolean; grow?: boolean; id?: string; noTap?: boolean; inside?: boolean } = {}): BrgArc => ({ ...arc(at, 0, b, { ...o, tex }), inside: o.inside ?? o.r === R1 })
/** Half a turn on from a bearing (chalk). */
const halfTurn = (at: string, from: number, o: { grow?: boolean } = {}) => arc(at, from, 180, { id: `${at}:half`, col: CHALK, tex: "180^\\circ", r: R1, grow: o.grow, dash: true })
/** An angle inside the triangle laid on after a bearing, at the bearing's radius, so the two make the next bearing. */
const stackArc = (at: string, from: number, sweep: number, c: Corner, r = R1) => arc(at, from, sweep, { id: `${at}:stack`, col: PAIR_COL[c], r, grow: true })

/** What a board adds to a question's figure. */
interface Dress {
  norths?: string[]
  brgs?: BrgArc[]
  /** dashed lines (a line carried on past a point) */
  dash?: [string, string][]
  pts?: Record<string, Vec>
  ring?: { at: string; r: number }
  /** only these corners get an arc */
  arcs?: Corner[]
  ang?: Partial<Record<Corner, string | null>>
  side?: Partial<Record<Corner, string | null>>
  glowAng?: Corner[]
  pulseAng?: Corner[]
  pulseSide?: Corner[]
  glowSide?: Corner[]
  /** these arcs in place of the figure's own */
  only?: boolean
}

function dress(S: Scene, d: Dress) {
  for (const [n, p] of Object.entries(d.pts ?? {})) S.P[n] = [p[0], p[1]]
  const e = S.extra ?? { segs: [] }
  S.extra = { ...e, norths: d.norths ?? e.norths, brgs: [...(d.only ? [] : e.brgs ?? []), ...(d.brgs ?? [])], dash: [...(e.dash ?? []), ...(d.dash ?? [])], ring: d.ring ?? e.ring }
  if (d.arcs) S.arcsOnly = d.arcs
  for (const [k, t] of Object.entries(d.ang ?? {})) S.angText[k as Corner] = () => t ?? null
  for (const [k, t] of Object.entries(d.side ?? {})) S.sideText[k as Corner] = () => t ?? null
  if (d.glowAng) S.glowAng = new Set(d.glowAng)
  if (d.pulseAng) S.pulseAng = new Set(d.pulseAng)
  if (d.pulseSide) S.pulseSide = new Set(d.pulseSide)
  if (d.glowSide) S.glowSide = new Set(d.glowSide)
}

/** A cosine rule question's board, dressed. */
const onCos = (q: CRQ, d: Dress = {}) => (S: Scene) => { cqBoard(S, q); dress(S, d) }
/** A sine rule question's board, dressed. */
const onSine = (q: QSpec, d: Dress = {}) => (S: Scene) => { qBoard(S, q); dress(S, d) }

/**
 * An angle or a bearing typed, worked out from what is on the figure. The
 * equation is just "name = □" (the parts are on the figure); `above` keeps
 * the step just made over it.
 */
function ask(id: string, text: string, board: (S: Scene) => void, o: {
  lead: string
  answer: number
  dp?: number
  slips?: { v: number; say: string }[]
  walk: WalkStep<Scene>[]
  then?: (S: Scene) => void
  above?: () => ENode
  rightNote?: string
  typed?: string
  after?: number
}): Beat {
  const shown = deg(o.answer, o.dp)
  return {
    id, say: text,
    enter: S => {
      board(S)
      startInput(S, {
        answer: o.answer, dp: o.dp, slips: o.slips, max: 16,
        typed: o.typed ?? (o.dp ? o.answer.toFixed(o.dp) : String(Math.round(o.answer))),
        onRight: S2 => {
          S2.flashGood = 1
          S2.touched = { kind: "eq" }
          o.then?.(S2)
          if (o.rightNote) later(S2, 0.6, S3 => { if (!S3.note) say(S3, o.rightNote!, "calm", 600) })
        },
      })
      S.eqFn = S2 => {
        const done = S2.input?.state === "right"
        const line = row([atom("lead", o.lead), op("eq", "="), done ? atom("ans", shown, { col: GREEN }) : boxNode(S2), ...(done ? [] : [atom("dg", "{}^\\circ")])])
        return o.above ? frac("work", o.above(), line, "rgba(0,0,0,0)") : line
      }
      look(S, ["eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: o.after ?? 2400,
    walk: o.walk,
  }
}

/** Tap the angle inside the triangle at a corner; other corners and a bearing's arc get their own notes. */
function tapInside(id: string, text: string, board: (S: Scene) => void, right: Corner, notes: { corner: string; brg?: string }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.mode = "tapAngle"
      S.onAngle = (S2, c) => {
        if (S2.got.has("tap")) return
        if (c === right) { S2.got.add("tap"); S2.glowAng = new Set([c]); S2.pulseAng = new Set(); S2.touched = { kind: "angle", c }; S2.flashGood = 1; S2.note = null; return }
        say(S2, notes.corner, "wrong", 3.6)
      }
      if (notes.brg) S.onBrg = S2 => { if (!S2.got.has("tap")) say(S2, notes.brg!, "wrong", 3.8) }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1400,
  }
}

// ── the questions ────────────────────────────────────────────────────────

/** 4024/21/M/J/24 Q9: ports A, B, C; B on 107° from A (176 km), C on 192° (132 km). Angle BAC is the rule's C. */
const Q1: CRQ = (() => {
  const q = sideQ("b1", 132, 176, 85, { name: "BC", names: { C: "A", A: "B", B: "C" } })
  q.P = { C: O, A: along(O, 107, 176), B: along(O, 192, 132) }
  q.extra = { segs: [], norths: ["C"] }
  return q
})()
const q1Brgs = (pulse = false): BrgArc[] => [brg("C", 107, "107^\\circ", { r: R1 }), brg("C", 192, "192^\\circ", { r: R2, pulse })]
/** The rule's beats see the bearings stay on the figure. */
const Q1R: CRQ = Q1
/** The paper's figure: North at A, the two lengths, no angles yet. */
const q1Plain = (d: Dress = {}) => onCos(Q1, { arcs: [], ang: { C: null }, side: { C: null }, ...d })

/** 4024/21/M/J/19 Q11(a): lighthouse L; B on 062° from L; LB = 14, LA = 8, AB = 13 km. Angle BLA is the rule's C. */
const BLA = Math.acos((14 * 14 + 8 * 8 - 13 * 13) / (2 * 14 * 8)) * DEG
const Q2: CRQ = (() => {
  const q = angleQ("b2", 8, 14, 13, { names: { C: "L", A: "B", B: "A" } })
  q.P = { C: O, A: along(O, 62, 14), B: along(O, 62 + BLA, 8) }
  q.extra = { segs: [], norths: ["C"], brgs: [brg("C", 62, "62^\\circ", { r: R1 })] }
  return q
})()
const q2Plain = (d: Dress = {}) => onCos(Q2, { arcs: [], ang: { C: null }, ...d })
/** The rule's beats: the 62° waits off the figure until the bearing is worked out. */
const Q2R: CRQ = { ...Q2, extra: { segs: [], norths: ["C"] } }
const q2Want = (tex = "?", o: { pulse?: boolean; grow?: boolean } = {}) => brg("C", 62 + BLA, tex, { r: R2, id: "b2-want", noTap: true, ...o })

/** 4024/21/O/N/21 Q4(a): villages P, Q, R; R due west of P (3.8 km), Q on 140° from P, QR = 7.5 km. The sine rule's want is Q, its pair P. */
const W_Q = Math.asin((3.8 * Math.sin(130 * RAD)) / 7.5) * DEG
const W_R = 180 - 130 - W_Q
const W_PQ = (7.5 * Math.sin(W_R * RAD)) / Math.sin(130 * RAD)
const Q3: QSpec = {
  id: "b3", want: "B", find: "angle", pair: "A",
  side: { A: 7.5, B: 3.8, C: W_PQ }, angle: { A: 130, B: W_Q, C: W_R },
  P: { A: O, B: along(O, 140, W_PQ), C: along(O, 270, 3.8) },
  names: { A: "P", B: "Q", C: "R" },
  knownSides: ["A", "B"], knownAngles: ["A"],
  extra: { segs: [], norths: ["A"], brgs: [brg("A", 140, "140^\\circ", { r: R1 })] },
}
/** The rule's beats: the 140° waits off the figure, so the triangle has the room. */
const Q3R: QSpec = { ...Q3, extra: { segs: [], norths: ["A"] } }
/** The paper's figure: North and 140° at P, PR and QR; no angles inside yet. */
const q3Plain = (d: Dress = {}) => onSine(Q3, { arcs: [], ang: { A: null, B: null }, ...d })
/** At Q, after part (i): every angle known, North at Q too, and the line PQ carried on past Q. */
const QX = "Qx"
const q3AtQ = (d: Dress = {}) => onSine(Q3, {
  arcs: ["B"], ang: { A: null, B: deg(W_Q, 1), C: null },
  norths: ["A", "B"], pts: { [QX]: along(Q3.P.B, 140, 2.6) }, ...d,
})

/** 4024/21/O/N/22 Q10(a): towns P, Q, R; Q on 052° from P; PQ = 11.5, QR = 14.6, PR = 17.2 km. Angle PQR is the rule's C. */
const PQR = Math.acos((11.5 * 11.5 + 14.6 * 14.6 - 17.2 * 17.2) / (2 * 11.5 * 14.6)) * DEG
const Q4: CRQ = (() => {
  const q = angleQ("b4", 11.5, 14.6, 17.2, { names: { C: "Q", A: "R", B: "P" } })
  const Qp = along(O, 52, 11.5)
  q.P = { B: O, C: Qp, A: along(Qp, 232 - PQR, 14.6) }
  q.extra = { segs: [], norths: ["B"], brgs: [brg("B", 52, "52^\\circ", { r: R1 })] }
  return q
})()
const q4Board = (d: Dress = {}) => onCos(Q4, { arcs: [], ang: { C: null }, ...d })
const QX4 = "Qx4"
/** At Q: North, the line from P carried on (52°), and half a turn to face P. */
const q4Back = (): Dress => ({
  norths: ["B", "C"], pts: { [QX4]: along(Q4.P.C, 52, 5) }, dash: [["C", QX4]],
  brgs: [brg("C", 52, "52^\\circ", { r: R1, id: "q52" }), halfTurn("C", 52)],
})

/** 4024/21/M/J/22 Q9: towns A, B, C; B on 072° from A (300 km), C on 150° (280 km). Angle BAC is the rule's C. */
const X1: CRQ = (() => {
  const q = sideQ("x1", 280, 300, 78, { name: "BC", names: { C: "A", A: "B", B: "C" } })
  q.P = { C: O, A: along(O, 72, 300), B: along(O, 150, 280) }
  q.extra = { segs: [], norths: ["C"] }
  return q
})()
const x1Brgs = (): BrgArc[] => [brg("C", 72, "72^\\circ", { r: R1 }), brg("C", 150, "150^\\circ", { r: R2 })]
const X1R: CRQ = X1
const x1Plain = (d: Dress = {}) => onCos(X1, { arcs: [], ang: { C: null }, side: { C: null }, ...d })
const CX1 = "Cx1"

/** Part (c): D is 145 km from B and angle ADB is 120°: two places. The sine rule's want is A, its pair D (the rule's C). */
const XB: Vec = along(O, 72, 300)
const X_DAB = Math.asin((145 * Math.sin(120 * RAD)) / 300) * DEG
const X_AD = (300 * Math.sin((180 - 120 - X_DAB) * RAD)) / Math.sin(120 * RAD)
const D1 = along(O, 72 + X_DAB, X_AD), D2 = along(O, 72 - X_DAB, X_AD)
/** Where D starts: on the circle, well away from both places. */
const D0 = along(XB, 150, 145)
const XD: QSpec = {
  id: "x2", want: "A", find: "angle", pair: "C",
  side: { A: 145, B: X_AD, C: 300 }, angle: { A: X_DAB, B: 180 - 120 - X_DAB, C: 120 },
  P: { A: O, B: XB, C: D1 },
  names: { A: "A", B: "B", C: "D" },
  knownSides: ["A", "C"], knownAngles: ["C"],
  extra: { segs: [], norths: ["A"] },
}
/** The circle's edge, so the view keeps it all in room. */
const RING_PTS: Record<string, Vec> = { rg0: [XB[0] + 150, XB[1]], rg1: [XB[0] - 150, XB[1]], rg2: [XB[0], XB[1] + 150], rg3: [XB[0], XB[1] - 150] }

/** The board for part (c): A, B, the circle, D where it is (angle ADB live, or 120°). */
function dBoard(S: Scene, at: Vec, o: { live?: boolean; ghost?: Vec } = {}) {
  qBoard(S, XD)
  S.P.C = [at[0], at[1]]
  dress(S, { pts: RING_PTS, arcs: ["C"], ring: { at: "B", r: 145 }, side: { B: null } })
  S.angText.C = o.live ? s => `${Math.round(angleAt(s, "C"))}^\\circ` : () => "120^\\circ"
  delete S.angText.A
  if (o.ghost) { S.P.Dg = [o.ghost[0], o.ghost[1]]; S.ghost = ["A", "B", "Dg"] }
}
/** D slides on the circle round B; it clicks onto a place where angle ADB is 120° and stays. */
function dOnCircle(S: Scene, targets: Vec[]) {
  S.mode = "rule"
  S.lockOnSnap = true
  S.rule = {
    pt: "C",
    place: (_S, w) => { const v: Vec = [w[0] - XB[0], w[1] - XB[1]], l = Math.hypot(v[0], v[1]) || 1; return [XB[0] + (v[0] / l) * 145, XB[1] + (v[1] / l) * 145] },
    snap: (S2, p) => {
      const near = targets.find(t => Math.hypot(t[0] - p[0], t[1] - p[1]) < 145 * 0.16)
      if (!near) return null
      const tmp = { ...S2, P: { ...S2.P, C: p } } as Scene
      return Math.abs(angleAt(tmp, "C") - 120) < 5 ? [near[0], near[1]] : null
    },
  }
  S.releaseNote = S2 => `Angle $ADB$ is $${Math.round(angleAt(S2, "C"))}^\\circ$ here. Keep sliding until it's $120^\\circ$.`
}

/** 4024/21/O/N/19 Q9(b): B on 125° from A (950 m); AC = 520, BC = 680 m; angle BAC = 44.0°. */
const W19_BAC = Math.acos((950 * 950 + 520 * 520 - 680 * 680) / (2 * 950 * 520)) * DEG
const X3: CRQ = (() => {
  const q = angleQ("x3", 520, 950, 680, { names: { C: "A", A: "B", B: "C" } })
  q.P = { C: O, A: along(O, 125, 950), B: along(O, 125 + W19_BAC, 520) }
  q.extra = { segs: [], norths: ["C"], brgs: [brg("C", 125, "125^\\circ", { r: R1 })] }
  return q
})()
const x3Board = (d: Dress = {}) => onCos(X3, { arcs: ["C"], ang: { C: "44.0^\\circ" }, ...d })
const CX = "Cx"

/**
 * 4024/22/O/N/23 Q9(a)(ii): rectangle ABCD, C due south of A; AB = 450,
 * BC = 210 m. Triangle ADC, right-angled at D: angle DAC is the rule's C,
 * DC = 450 across it (side C), AD = 210 next to it (side B).
 */
const DAC = Math.atan(450 / 210) * DEG
const AC = Math.hypot(450, 210)
const X4: CRQ = (() => {
  const q = angleQ("x4", AC, 210, 450, { names: { C: "A", A: "D", B: "C", Bp: "B" } })
  q.P = { C: O, A: along(O, 180 + DAC, 210), B: [0, -AC] }
  q.pts = { Bp: along(O, 180 - (90 - DAC), 450) }
  q.extra = { segs: [["C", "Bp"], ["Bp", "B"]], norths: ["C"], rts: [{ at: "A", a: "C", b: "B" }] }
  return q
})()
/** The field as the paper draws it (no diagonal); with `diag`, the diagonal AC and triangle ADC. */
function x4Board(S: Scene, d: Dress & { diag?: boolean } = {}) {
  cqBoard(S, X4)
  S.sideText = {}
  S.angText = {}
  S.arcsOnly = []
  S.extra = { ...S.extra!, labels: [{ a: "C", b: "Bp", tex: "450" }, { a: "Bp", b: "B", tex: "210" }] }
  // before the diagonal, the rectangle's own two sides at D are lines of the figure
  if (!d.diag) S.extra.segs = [...S.extra.segs, ["C", "A"], ["A", "B"]]
  dress(S, d)
}

// ── 1. The angle between two bearings ────────────────────────────────────

const PART_1: Beat[] = [
  watch("b1", "Three ports, $A$, $B$ and $C$.", S => { q1Plain()(S); look(S) }),
  watch("b1-q", "Calculate $BC$.", S => { q1Plain({ side: { C: "?" }, pulseSide: ["C"] })(S); look(S) }, 1.8),
  tapInside("b1-tap", "Tap the angle across from $BC$.", q1Plain({ arcs: [...CORNERS], side: { C: "?" } }), "C", { corner: "That angle touches $BC$. Go across from it." }),
  watch("b1-none", "We don't know this angle. The question gives two bearings instead.", S => { q1Plain({ arcs: ["C"], ang: { C: "?" }, glowAng: ["C"], side: { C: "?" } })(S); look(S) }, 2.6),
  watch("b1-107", "$B$ is on a bearing of $107^\\circ$ from $A$.", S => {
    q1Plain({ arcs: ["C"], ang: { C: "?" }, side: { C: "?" }, brgs: [brg("C", 107, "107^\\circ", { r: R1, grow: true })] })(S)
    look(S)
  }, 2.4),
  watch("b1-192", "$C$ is on a bearing of $192^\\circ$ from $A$.", S => {
    q1Plain({ arcs: ["C"], ang: { C: "?" }, side: { C: "?" }, brgs: [brg("C", 107, "107^\\circ", { r: R1 }), brg("C", 192, "192^\\circ", { r: R2, grow: true })] })(S)
    look(S)
  }, 2.4),
  ask("b1-ang", "So what is angle $BAC$?", q1Plain({ arcs: ["C"], ang: { C: "?" }, side: { C: "?" }, brgs: q1Brgs() }), {
    lead: "\\angle BAC", answer: 85,
    slips: [
      { v: 299, say: "That's both bearings added. The $107^\\circ$ is part of the $192^\\circ$." },
      { v: 107, say: "That's the bearing of $B$. Angle $BAC$ is between $AB$ and $AC$." },
      { v: 192, say: "That's the bearing of $C$. Angle $BAC$ is between $AB$ and $AC$." },
    ],
    walk: [
      { say: "Both bearings start at North. The $192^\\circ$ turns past $AB$, on to $AC$.", tex: "192^\\circ", show: S => { S.extra!.brgs = q1Brgs(true) } },
      { say: "The first $107^\\circ$ of it reaches $AB$. What is left is angle $BAC$.", tex: "192^\\circ - 107^\\circ", show: S => { S.extra!.brgs = q1Brgs(); S.glowAng = new Set(["C"]) } },
    ],
    // the angle sits on after the 107°: together they make the 192°
    then: S => { S.angText.C = () => "85^\\circ"; S.extra!.brgs = [...q1Brgs(), stackArc("C", 107, 85, "C")] },
    after: 3200,
  }),
  watch("b1-diff", "The angle between two bearings from one place is the bigger one take away the smaller.", S => {
    q1Plain({ arcs: ["C"], ang: { C: "85^\\circ" }, side: { C: "?" }, brgs: [...q1Brgs(), arc("C", 107, 85, { col: PAIR_COL.C, r: R1 })] })(S)
    look(S)
  }, 2.8),
  // the cosine rule, as in its own lesson; the bearings stay on the figure
  watch("b1-rule", "Now we have two sides and the angle between them. That's the cosine rule.", S => { cqBoard(S, Q1R); look(S) }, 2.6),
  tapTwoSides("b1-sides", "Tap the two sides that make angle $BAC$.", Q1R),
  fillCos("b1-fill", "Fill the rule.", Q1R, ALL),
  ...sideSteps("b1", Q1R, "Work out the right side."),
]

// ── 2. From an angle to a bearing ────────────────────────────────────────

const PART_2: Beat[] = [
  watch("b2", "A lighthouse $L$ and two ports, $A$ and $B$. $B$ is on a bearing of $062^\\circ$ from $L$.", S => { q2Plain()(S); look(S) }, 3.0),
  watch("b2-q", "Calculate the bearing of $A$ from $L$.", S => { q2Plain({ brgs: [q2Want("?", { grow: true })] })(S); look(S) }, 2.4),
  tapInside("b2-tap", "The bearing is the $62^\\circ$ and one more angle. Tap it.", q2Plain({ arcs: [...CORNERS], brgs: [q2Want()] }), "C", {
    corner: "That angle isn't at $L$. The bearing turns at $L$.",
    brg: "That's the $62^\\circ$ itself. Tap the angle that comes after it.",
  }),
  watch("b2-all", "We know all three sides. So the cosine rule finds this angle.", S => { cqBoard(S, Q2R); dress(S, { glowAng: ["C"] }); look(S) }, 2.6),
  tapSideAcross("b2-side", "Tap the side across from the angle.", Q2R),
  fillCos("b2-fill", "Fill the rule.", Q2R, ALL),
  ...angleSteps("b2", Q2R),
  ask("b2-brg", "So what is the bearing of $A$ from $L$?", onCos(Q2, { arcs: ["C"], ang: { C: deg(BLA, 1) }, brgs: [q2Want()] }), {
    lead: "\\text{Bearing}", answer: 62 + BLA,
    slips: [
      { v: Math.round(BLA), say: "That's angle $BLA$. A bearing starts at North." },
      { v: Math.round(BLA - 62), say: "Angle $BLA$ comes after the $62^\\circ$, going clockwise. They add up." },
    ],
    walk: [
      { say: "From North, the bearing turns $62^\\circ$ to $LB$.", tex: "62^\\circ", show: S => { S.extra!.brgs = [brg("C", 62, "62^\\circ", { r: R1, pulse: true }), q2Want()] } },
      { say: "Then on through angle $BLA$ to $LA$.", tex: `62^\\circ + ${deg(BLA, 1)}`, show: S => { S.extra!.brgs = [brg("C", 62, "62^\\circ", { r: R1 }), q2Want()]; S.glowAng = new Set(["C"]) } },
    ],
    then: S => { S.extra!.brgs = [brg("C", 62, "62^\\circ", { r: R1 }), q2Want(deg(62 + BLA)), stackArc("C", 62, BLA, "C")] },
    after: 3200,
  }),
]

// ── 3. Due north, south, east or west ────────────────────────────────────

const PART_3: Beat[] = [
  watch("b3", "Three villages, $P$, $Q$ and $R$. $Q$ is on a bearing of $140^\\circ$ from $P$.", S => { q3Plain()(S); look(S) }, 3.0),
  watch("b3-west", "$R$ is due west of $P$.", S => { q3Plain({ glowSide: ["B"] })(S); look(S) }),
  ask("b3-270", "Due west is a bearing too. What is it?", q3Plain(), {
    lead: "\\text{West}", answer: 270,
    slips: [
      { v: 90, say: "That's due east. West is on the left of North." },
      { v: 180, say: "That's due south. Keep turning clockwise to West." },
    ],
    walk: [
      { say: "Turn clockwise from North. East is $90^\\circ$, and South is $180^\\circ$.", tex: "\\text{E}\\; 90^\\circ \\qquad \\text{S}\\; 180^\\circ" },
      { say: "West is a quarter turn on from South.", tex: "180^\\circ + 90^\\circ" },
    ],
    then: S => { S.extra!.brgs = [...(S.extra!.brgs ?? []), brg("A", 270, "270^\\circ", { r: R2, grow: true })] },
    after: 3000,
  }),
  ask("b3-ang", "So what is angle $RPQ$?", q3Plain({ arcs: ["A"], ang: { A: "?" }, brgs: [brg("A", 270, "270^\\circ", { r: R2 })] }), {
    lead: "\\angle RPQ", answer: 130,
    slips: [
      { v: 410, say: "That's both added. The $140^\\circ$ is part of the $270^\\circ$." },
      { v: 40, say: "That's $180^\\circ - 140^\\circ$, to South. $R$ is due west." },
      { v: 140, say: "That's the bearing of $Q$. Angle $RPQ$ is between $PQ$ and $PR$." },
    ],
    walk: [
      { say: "Both start at North. The $270^\\circ$ turns past $PQ$, on to $PR$.", tex: "270^\\circ" },
      { say: "The first $140^\\circ$ reaches $PQ$. What is left is angle $RPQ$.", tex: "270^\\circ - 140^\\circ", show: S => { S.glowAng = new Set(["A"]) } },
    ],
    then: S => { S.angText.A = () => "130^\\circ"; S.extra!.brgs = [...(S.extra!.brgs ?? []), stackArc("A", 140, 130, "A")] },
    after: 3200,
  }),
  watch("b3-prq", "Now calculate angle $PRQ$.", S => { q3Plain({ arcs: ["A", "C"], ang: { A: "130^\\circ", C: "?" }, pulseAng: ["C"] })(S); look(S) }),
  tapFullPair("b3-pair", "Find a full pair.", Q3R),
  watch("b3-q", "With the full pair, the sine rule finds angle $Q$ first. It's across from $3.8$.", S => { qBoard(S, Q3R); dress(S, { glowAng: ["B"], glowSide: ["B"] }); look(S) }, 3.0),
  fillBeat("b3-fill", "Fill the rule: $\\theta$'s pair on the left.", Q3R, "both"),
  flipBeat("b3-flip", "Turn the rule over.", Q3R),
  moveBeat("b3-mul", "Get $\\sin\\theta$ on its own.", Q3R),
  sinCalc("b3-sin", "Work out the right side.", Q3R),
  undoBeat("b3-undo", "Undo the $\\sin$.", Q3R),
  angleCalc("b3-th", "Work it out.", Q3R),
  ask("b3-r", "So what is angle $PRQ$?", onSine(Q3, { arcs: [...CORNERS], ang: { B: deg(W_Q, 1), C: "?" } }), {
    lead: "\\angle PRQ", answer: W_R, dp: 1,
    slips: [{ v: r1(180 - W_Q), say: "Take the $130^\\circ$ away too." }, { v: 50, say: "Take $\\theta$ away too." }],
    walk: [
      { say: "The three angles of a triangle add up to $180^\\circ$.", tex: `130^\\circ + ${deg(W_Q, 1)} + \\angle PRQ = 180^\\circ`, show: S => { S.glowAng = new Set(["A", "B"]) } },
      { say: "So take the two you know from $180^\\circ$.", tex: `180 - 130 - ${W_Q.toFixed(1)}` },
    ],
    then: S => { S.angText.C = () => deg(W_R, 1) },
  }),
]

// ── 4. A bearing from the other end ──────────────────────────────────────

const PART_4: Beat[] = [
  watch("b4", "Now the bearing of $R$ from $Q$. We stand at $Q$.", S => { q3AtQ()(S); look(S) }, 2.4),
  watch("b4-on", "The line from $P$ carries on through $Q$, still on $140^\\circ$.", S => {
    q3AtQ({ dash: [["B", QX]], brgs: [brg("B", 140, "140^\\circ", { r: R1, grow: true, id: "q140" })] })(S)
    look(S)
  }, 2.8),
  watch("b4-turn", "To face $P$, turn round. That's half a turn, $180^\\circ$.", S => {
    q3AtQ({ dash: [["B", QX]], brgs: [brg("B", 140, "140^\\circ", { r: R1, id: "q140" }), halfTurn("B", 140, { grow: true })] })(S)
    look(S)
  }, 2.8),
  ask("b4-320", "So what is the bearing of $P$ from $Q$?", q3AtQ({ dash: [["B", QX]], brgs: [brg("B", 140, "140^\\circ", { r: R1, id: "q140" }), halfTurn("B", 140)] }), {
    lead: "\\text{Bearing}", answer: 320,
    slips: [
      { v: 40, say: "That's $180^\\circ - 140^\\circ$. Turn on from the $140^\\circ$: add the half turn." },
      { v: 140, say: "That's the bearing of $Q$ from $P$. We stand at $Q$ now." },
    ],
    walk: [
      { say: "From North, $140^\\circ$ reaches the line carried on.", tex: "140^\\circ" },
      { say: "Then half a turn faces $P$.", tex: "140^\\circ + 180^\\circ" },
    ],
    then: S => { S.extra!.brgs = [...(S.extra!.brgs ?? []), brg("B", 320, "320^\\circ", { r: R2, grow: true, id: "q320" })] },
    after: 3000,
  }),
  ask("b4-297", "Angle $PQR$ is $22.8^\\circ$. So what is the bearing of $R$ from $Q$?", q3AtQ({ only: true, norths: ["B"], brgs: [brg("B", 320, "320^\\circ", { r: R2, id: "q320" })], glowAng: ["B"] }), {
    lead: "\\text{Bearing}", answer: 320 - W_Q, dp: 1,
    slips: [
      { v: r1(320 + W_Q), say: "Going clockwise from North, we reach $QR$ before $QP$. Take it away." },
      { v: r1(W_Q), say: "That's angle $PQR$. A bearing starts at North." },
    ],
    walk: [
      { say: "Clockwise from North, the $320^\\circ$ reaches $QP$.", tex: "320^\\circ", show: S => { S.extra!.brgs = [brg("B", 320, "320^\\circ", { r: R2, id: "q320", pulse: true })] } },
      { say: "$QR$ comes before $QP$, by angle $PQR$. Stop short by that much.", tex: `320^\\circ - ${deg(W_Q, 1)}`, show: S => { S.extra!.brgs = [brg("B", 320, "320^\\circ", { r: R2, id: "q320" })]; S.glowAng = new Set(["B"]) } },
    ],
    then: S => { S.extra!.brgs = [brg("B", 320, "320^\\circ", { r: R2, id: "q320" }), brg("B", 320 - W_Q, deg(320 - W_Q, 1), { r: R1, grow: true, id: "q297" })] },
    after: 3200,
  }),

  // 4024/21/O/N/22 Q10(a)
  watch("b5", "Three towns, $P$, $Q$ and $R$. $Q$ is on a bearing of $052^\\circ$ from $P$.", S => { q4Board()(S); look(S) }, 3.0),
  watch("b5-q", "Calculate the bearing of $R$ from $Q$.", S => { q4Board({ norths: ["B", "C"], brgs: [brg("C", 232 - PQR, "?", { r: R2, grow: true, id: "q4want" })] })(S); look(S) }, 2.4),
  tapInside("b5-tap", "We'll need the angle inside the triangle at $Q$. Tap it.", q4Board({ norths: ["B", "C"], arcs: [...CORNERS] }), "C", { corner: "That angle isn't at $Q$." }),
  watch("b5-all", "We know all three sides, so it's the cosine rule.", S => { cqBoard(S, Q4); dress(S, { glowAng: ["C"] }); look(S) }, 2.4),
  tapSideAcross("b5-side", "Tap the side across from angle $PQR$.", Q4),
  fillCos("b5-fill", "Fill the rule.", Q4, ALL),
  ...angleSteps("b5", Q4),
  ask("b5-232", "First, what is the bearing of $P$ from $Q$?", onCos(Q4, { arcs: ["C"], ang: { C: deg(PQR, 1) }, ...q4Back() }), {
    lead: "\\text{Bearing}", answer: 232,
    slips: [{ v: 128, say: "That's $180^\\circ - 52^\\circ$. Turn on from the $52^\\circ$: add the half turn." }, { v: 52, say: "That's the bearing of $Q$ from $P$. We stand at $Q$." }],
    walk: [
      { say: "The line from $P$ carries on through $Q$, on $52^\\circ$.", tex: "52^\\circ" },
      { say: "Half a turn more faces $P$.", tex: "52^\\circ + 180^\\circ" },
    ],
    then: S => { S.extra!.brgs = [...(S.extra!.brgs ?? []), brg("C", 232, "232^\\circ", { r: R2, grow: true, id: "q232" })] },
    after: 3000,
  }),
  ask("b5-brg", "So what is the bearing of $R$ from $Q$?", onCos(Q4, { only: true, arcs: ["C"], ang: { C: deg(PQR, 1) }, norths: ["C"], brgs: [brg("C", 232, "232^\\circ", { r: R2, id: "q232" })], glowAng: ["C"] }), {
    lead: "\\text{Bearing}", answer: 232 - PQR, dp: 1,
    slips: [
      { v: r1(232 + PQR), say: "Going clockwise from North, we reach $QR$ before $QP$. Take it away." },
      { v: r1(PQR), say: "That's angle $PQR$. A bearing starts at North." },
    ],
    walk: [
      { say: "Clockwise from North, the $232^\\circ$ reaches $QP$.", tex: "232^\\circ" },
      { say: "$QR$ comes before $QP$, by angle $PQR$.", tex: `232^\\circ - ${deg(PQR, 1)}`, show: S => { S.glowAng = new Set(["C"]) } },
    ],
    then: S => { S.extra!.brgs = [brg("C", 232, "232^\\circ", { r: R2, id: "q232" }), brg("C", 232 - PQR, deg(232 - PQR, 1), { r: R1, grow: true, id: "q150" })] },
    after: 3200,
  }),
]

// ── 5. Exam questions ────────────────────────────────────────────────────

const PART_X: Beat[] = [
  // 4024/21/M/J/22 Q9
  watch("x1", "The diagram shows three towns, $A$, $B$ and $C$.", S => { x1Plain()(S); look(S) }),
  watch("x1-b", "$B$ is on a bearing of $072^\\circ$ from $A$. $C$ is on a bearing of $150^\\circ$ from $A$.", S => {
    x1Plain({ brgs: [brg("C", 72, "72^\\circ", { r: R1, grow: true }), brg("C", 150, "150^\\circ", { r: R2, grow: true })] })(S)
    look(S)
  }, 3.0),
  ask("x1-a", "Find the bearing of $A$ from $C$.", x1Plain({
    norths: ["C", "B"], pts: { [CX1]: along(X1.P.B, 150, 110) }, dash: [["B", CX1]],
    brgs: [brg("B", 150, "150^\\circ", { r: R1, id: "c150" }), halfTurn("B", 150)],
  }), {
    lead: "\\text{Bearing}", answer: 330,
    slips: [{ v: 30, say: "That's $180^\\circ - 150^\\circ$. Turn on from the $150^\\circ$: add the half turn." }, { v: 150, say: "That's the bearing of $C$ from $A$. We stand at $C$." }],
    walk: [
      { say: "The line from $A$ carries on past $C$, on $150^\\circ$.", tex: "150^\\circ" },
      { say: "Half a turn more faces $A$.", tex: "150^\\circ + 180^\\circ" },
    ],
  }),
  watch("x1-bc", "Now calculate $BC$.", S => { x1Plain({ brgs: x1Brgs(), side: { C: "?" }, pulseSide: ["C"] })(S); look(S) }, 1.8),
  ask("x1-ang", "First, what is angle $BAC$?", x1Plain({ arcs: ["C"], ang: { C: "?" }, side: { C: "?" }, brgs: x1Brgs() }), {
    lead: "\\angle BAC", answer: 78,
    slips: [{ v: 222, say: "That's both bearings added. The $72^\\circ$ is part of the $150^\\circ$." }],
    walk: [
      { say: "Both bearings start at North. The $150^\\circ$ turns past $AB$, on to $AC$.", tex: "150^\\circ" },
      { say: "Take away the part that reaches $AB$.", tex: "150^\\circ - 72^\\circ" },
    ],
    then: S => { S.angText.C = () => "78^\\circ"; S.extra!.brgs = [...x1Brgs(), stackArc("C", 72, 78, "C")] },
    after: 3000,
  }),
  tapTwoSides("x1-sides", "Tap the two sides that make angle $BAC$.", X1R),
  fillCos("x1-fill", "Fill the rule.", X1R, ALL),
  ...sideSteps("x1", X1R, "Work out the right side."),

  // part (c)
  watch("x2", "Town $D$ is $145$ km from town $B$. So $D$ is somewhere on this circle.", S => {
    dBoard(S, D0)
    S.names = { A: "A", B: "B" }
    S.angText = {}
    S.sideText = { C: () => "300" }
    S.P.R0 = along(XB, 150, 145)
    S.extra = { ...S.extra!, segs: [["A", "B"]], dash: [["B", "R0"]], labels: [{ a: "B", b: "R0", tex: "145" }] }
    lookNoTri(S)
  }, 2.8),
  {
    id: "x2-drag",
    say: "Angle $ADB$ is $120^\\circ$. Slide $D$ round the circle until it is.",
    enter: S => { dBoard(S, D0, { live: true }); dOnCircle(S, [D1, D2]); look(S) },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  {
    id: "x2-other",
    say: "There's a second place on the circle where it's $120^\\circ$. Find it.",
    enter: S => {
      // the place found stays, faint; D starts from it
      const first = S.P.C && Math.hypot(S.P.C[0] - D2[0], S.P.C[1] - D2[1]) < 1 ? D2 : D1
      dBoard(S, first, { live: true, ghost: first })
      dOnCircle(S, [first === D1 ? D2 : D1])
      look(S)
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("x2-two", "So $D$ could be in two places. Each gives a bearing from $A$.", S => { dBoard(S, D1, { ghost: D2 }); look(S) }, 2.6),
  watch("x2-first", "Let's take this one first. The sine rule finds angle $DAB$.", S => { dBoard(S, D1); S.angText.A = () => "\\theta"; S.arcsOnly = ["A", "C"]; S.pulseAng = new Set(["A"]); look(S) }, 2.6),
  tapFullPair("x2-pair", "Find a full pair.", XD),
  fillBeat("x2-fill", "Fill the rule: $\\theta$'s pair on the left.", XD, "both"),
  flipBeat("x2-flip", "Turn the rule over.", XD),
  moveBeat("x2-mul", "Get $\\sin\\theta$ on its own.", XD),
  sinCalc("x2-sin", "Work out the right side.", XD),
  undoBeat("x2-undo", "Undo the $\\sin$.", XD),
  angleCalc("x2-th", "Work it out.", XD),
  ask("x2-b1", "So what is the bearing of $D$ from $A$, with $D$ here?", S => {
    dBoard(S, D1)
    dress(S, { arcs: ["A", "C"], ang: { A: deg(X_DAB, 1) }, brgs: [brg("A", 72, "72^\\circ", { r: R1 })], glowAng: ["A"] })
  }, {
    lead: "\\text{Bearing}", answer: 72 + X_DAB, dp: 1,
    slips: [{ v: r1(72 - X_DAB), say: "Here $AD$ comes after $AB$, going clockwise. Add the angle." }],
    walk: [
      { say: "From North, $72^\\circ$ reaches $AB$.", tex: "72^\\circ" },
      { say: "$AD$ is further round, by angle $DAB$.", tex: `72^\\circ + ${deg(X_DAB, 1)}` },
    ],
    then: S => { S.extra!.brgs = [brg("A", 72, "72^\\circ", { r: R1 }), brg("A", 72 + X_DAB, deg(72 + X_DAB, 1), { r: R2, grow: true })] },
    after: 3000,
  }),
  ask("x2-b2", "And with $D$ on the other side of $AB$?", S => {
    dBoard(S, D2, { ghost: D1 })
    dress(S, { arcs: ["A", "C"], ang: { A: deg(X_DAB, 1) }, brgs: [brg("A", 72, "72^\\circ", { r: R2 })], glowAng: ["A"] })
  }, {
    lead: "\\text{Bearing}", answer: 72 - X_DAB, dp: 1,
    slips: [{ v: r1(72 + X_DAB), say: "That's the first one. Here $AD$ comes before $AB$. Take the angle away." }],
    walk: [
      { say: "From North, $72^\\circ$ reaches $AB$.", tex: "72^\\circ" },
      { say: "$AD$ comes before it, by angle $DAB$.", tex: `72^\\circ - ${deg(X_DAB, 1)}` },
    ],
    then: S => { S.extra!.brgs = [brg("A", 72, "72^\\circ", { r: R2 }), brg("A", 72 - X_DAB, deg(72 - X_DAB, 1), { r: R1, grow: true })] },
    after: 3000,
  }),

  // 4024/21/O/N/19 Q9(b)
  watch("x3", "Farm $B$ is on a bearing of $125^\\circ$ from farm $A$. Angle $BAC$ is $44.0^\\circ$.", S => { x3Board()(S); look(S) }, 3.0),
  ask("x3-c", "What is the bearing of $C$ from $A$?", x3Board({ brgs: [brg("C", 125 + W19_BAC, "?", { r: R2, noTap: true })] }), {
    lead: "\\text{Bearing}", answer: 169,
    slips: [{ v: 81, say: "$AC$ comes after $AB$, going clockwise. Add the angle." }],
    walk: [
      { say: "From North, $125^\\circ$ reaches $AB$.", tex: "125^\\circ" },
      { say: "Angle $BAC$ turns on to $AC$.", tex: "125^\\circ + 44^\\circ" },
    ],
    then: S => { S.extra!.brgs = [brg("C", 125, "125^\\circ", { r: R1 }), brg("C", 169, "169^\\circ", { r: R2 }), stackArc("C", 125, W19_BAC, "C")] },
  }),
  ask("x3-a", "So what is the bearing of $A$ from $C$?", x3Board({
    only: true, arcs: [], ang: { C: null },
    norths: ["C", "B"], pts: { [CX]: along(X3.P.B, 169, 260) }, dash: [["B", CX]],
    brgs: [brg("B", 169, "169^\\circ", { r: R1, id: "c169" }), halfTurn("B", 169)],
  }), {
    lead: "\\text{Bearing}", answer: 349,
    slips: [{ v: 11, say: "That's $180^\\circ - 169^\\circ$. Turn on from the $169^\\circ$: add the half turn." }, { v: 169, say: "That's the bearing of $C$ from $A$. We stand at $C$." }],
    walk: [
      { say: "The line from $A$ carries on past $C$, on $169^\\circ$.", tex: "169^\\circ" },
      { say: "Half a turn more faces $A$.", tex: "169^\\circ + 180^\\circ" },
    ],
  }),

  // 4024/22/O/N/23 Q9(a)(ii)
  watch("x4", "$ABCD$ is a rectangular field. $C$ is due south of $A$.", S => { x4Board(S); lookNoTri(S) }, 2.4),
  watch("x4-q", "Show that the bearing of $D$ from $A$ is $245^\\circ$, to $3$ significant figures.", S => { x4Board(S, { brgs: [brg("C", 180 + DAC, "?", { r: R2, grow: true })] }); lookNoTri(S) }, 3.0),
  watch("x4-ac", "$C$ is due south, so $AC$ is on a bearing of $180^\\circ$.", S => { x4Board(S, { diag: true, brgs: [brg("C", 180, "180^\\circ", { r: R1, grow: true })] }); look(S) }, 2.8),
  tapInside("x4-tap", "The bearing of $D$ is $180^\\circ$ and one more angle. Tap it.", S => { x4Board(S, { diag: true, arcs: [...CORNERS], brgs: [brg("C", 180, "180^\\circ", { r: R1 })] }) }, "C", {
    corner: "That angle isn't at $A$. The bearing turns at $A$.",
    brg: "That's the $180^\\circ$. Tap the angle that comes after it.",
  }),
  {
    id: "x4-ratio",
    say: "Angle $DAC$ is in a right-angled triangle. $DC$ is across from it and $AD$ is next to it. Which ratio do we use?",
    enter: S => {
      x4Board(S, { diag: true, arcs: ["C"], ang: { C: "?" }, side: { C: "450", B: "210" }, glowSide: ["C", "B"] })
      choose(S, ["$\\sin$", "$\\cos$", "$\\tan$"], 2, false, (S2, k, right) => {
        if (right) { S2.got.add("tan"); say(S2, "Yes. Opposite over adjacent is $\\tan$.", "calm", 600); return }
        say(S2, `$${k === 0 ? "\\sin" : "\\cos"}$ needs the hypotenuse, $AC$. We aren't given it.`, "wrong", 4)
      })
      look(S, ["chips"])
    },
    done: S => S.got.has("tan"),
    advanceAfter: 1600,
  },
  ask("x4-dac", "Work out angle $DAC$. Give $2$ decimal places.", S => { x4Board(S, { diag: true, arcs: ["C"], ang: { C: "?" }, side: { C: "450", B: "210" } }) }, {
    lead: "\\angle DAC", answer: DAC, dp: 2, typed: "T450/210",
    above: () => row([atom("tn", "\\tan"), atom("an", "\\angle DAC"), op("e1", "="), frac("fr", atom("o", "450"), atom("a", "210"))]),
    slips: [{ v: Number((Math.atan(210 / 450) * DEG).toFixed(2)), say: "That's upside down. The opposite, $450$, goes on top." }],
    walk: [
      { say: "$\\tan$ of the angle is $450 \\div 210$. Undo $\\tan$ with $\\tan^{-1}$.", tex: "\\angle DAC = \\tan^{-1}(450 \\div 210)" },
      { say: "Press SHIFT, $\\tan$, $450$, $\\div$, $210$, then $=$." },
    ],
    then: S => { S.angText.C = () => deg(DAC, 2) },
  }),
  ask("x4-brg", "So what is the bearing of $D$ from $A$?", S => { x4Board(S, { diag: true, arcs: ["C"], ang: { C: deg(DAC, 2) }, brgs: [brg("C", 180, "180^\\circ", { r: R1 })] }) }, {
    lead: "\\text{Bearing}", answer: 180 + DAC, dp: 2,
    slips: [{ v: Number((180 - DAC).toFixed(2)), say: "$AD$ comes after $AC$, going clockwise. Add the angle." }],
    walk: [
      { say: "From North, $180^\\circ$ reaches $AC$.", tex: "180^\\circ" },
      { say: "Angle $DAC$ turns on to $AD$.", tex: `180^\\circ + ${deg(DAC, 2)}` },
    ],
    rightNote: `$${(180 + DAC).toFixed(2)}^\\circ$ is $245^\\circ$ to $3$ significant figures.`,
    then: S => { S.extra!.brgs = [brg("C", 180, "180^\\circ", { r: R1 }), brg("C", 180 + DAC, "245^\\circ", { r: R2, grow: true }), stackArc("C", 180, DAC, "C")] },
    after: 3600,
  }),

  {
    id: "end",
    say: "In summary, the angle between two bearings is one take away the other. To get a bearing, we add or take away the angle inside.",
    enter: S => {
      q1Plain({ arcs: ["C"], ang: { C: "85^\\circ" }, side: { C: null }, brgs: [...q1Brgs(), arc("C", 107, 85, { col: PAIR_COL.C, r: R1 })] })(S)
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4, ...PART_X]

applyParts(BEATS, [
  ["b1", "The angle between two bearings"],
  ["b2", "From an angle to a bearing"],
  ["b3", "Due north, south, east or west"],
  ["b4", "From the other end"],
  ["x1", "Exam questions"],
])
