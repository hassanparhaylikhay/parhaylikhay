/**
 * What the two scale-drawing lessons share: their maps from the papers (one
 * world unit is a centimetre of the drawing, so the ruler measures it
 * exactly at any screen size), the board a map is drawn on, the ruler and
 * the protractor, and the beats made from them.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import { row, op, atom, frac, type ENode } from "../equation"
import type { Vec } from "../geometry"
import {
  type Scene, type VisKey, BLUE, GREEN, ORANGE, PINK,
  resetBeat, show, later, say, places, along, addSeg, startInput, boxNode, dirW, brgText, dist, ptS, toWorld, protGeom,
} from "./scene"

export type Beat = BeatOf<Scene>

export const LOOK: VisKey[] = ["board", "fig", "letters", "marks"]
export const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
export const DEC_KEYS = [["1", "2", "3", "4", "5", "6", "back"], ["7", "8", "9", "0", ".", "go"]]

/** Where a line from p on bearing b1 crosses a line from q on bearing b2. */
export function cross(p: Vec, b1: number, q: Vec, b2: number): Vec {
  const d1 = dirW(b1), d2 = dirW(b2)
  const det = d1[0] * -d2[1] - d1[1] * -d2[0]
  const r: Vec = [q[0] - p[0], q[1] - p[1]]
  const t = (r[0] * -d2[1] - r[1] * -d2[0]) / det
  return [p[0] + d1[0] * t, p[1] + d1[1] * t]
}

// ── the maps (one world unit is a centimetre of the drawing) ─────────────

export interface MapSpec {
  pts: Record<string, Vec>
  names: Record<string, string>
  norths: string[]
  segs: [string, string][]
  scale: string
  ruler: { zero: Vec; len: number }
  /** where the protractor lies before it is picked up (inside the page) */
  prot: Vec
  /** more room on the page: where lines the student will rule end */
  room?: Vec[]
}

/** 4024/12/M/J/25 Q6: villages A and B, 6.0 cm apart on a bearing of 110°; scale 1 cm to 5 km. */
export const S25_B = along([0, 0], 110, 6)
export const S25_C = cross([0, 0], 60, S25_B, 320)
export const S25: MapSpec = {
  pts: { A: [0, 0], B: S25_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }5\\text{ km}",
  ruler: { zero: [-1, -3.9], len: 8 },
  prot: [3.2, -1.0],
  room: [along([0, 0], 60, 4.2), along(S25_B, 320, 5.4)],
}
/** 4024/11/O/N/22 Q4: ships A and B, 5.6 cm apart on a bearing of 125°; scale 1 cm to 30 m. */
export const W22_B = along([0, 0], 125, 5.6)
export const W22_C = cross([0, 0], 164, W22_B, 252)
export const W22: MapSpec = {
  pts: { A: [0, 0], B: W22_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }30\\text{ m}",
  ruler: { zero: [-1.6, -5.1], len: 8 },
  prot: [2.0, -2.4],
  room: [along([0, 0], 164, 5.2), along(W22_B, 252, 4.6)],
}
/** 4024/12/M/J/23 Q6: villages A and B; B is 9.5 cm from A on a bearing of 240°; scale 1 cm to 2 km. */
export const S23_B = along([0, 0], 240, 9.5)
export const S23: MapSpec = {
  pts: { A: [0, 0], B: S23_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }2\\text{ km}",
  ruler: { zero: [-9.0, -6.0], len: 11 },
  prot: [-3.6, -1.2],
}
/** 4024/12/M/J/24 Q10: A due South of B (4 cm), C 7.07 cm from B on a bearing of 070°; scale 1 cm to 50 m. */
export const S24: MapSpec = {
  pts: { A: [0, -4], B: [0, 0], C: along([0, 0], 70, 7.07) }, names: { A: "A", B: "B", C: "C" }, norths: ["B"], segs: [["A", "B"], ["B", "C"]],
  scale: "\\text{Scale: }1\\text{ cm to }50\\text{ m}",
  ruler: { zero: [1.0, -4.6], len: 8 },
  prot: [3.4, -1.8],
}

/**
 * Put a map on the board: its places, North arrows, lines, and the page
 * wrapped round them (with room where the ruler starts), its scale written
 * on it. `prot`: room round a place for the protractor to sit there.
 */
export function mapBoard(S: Scene, M: MapSpec, o: { prot?: string } = {}) {
  resetBeat(S)
  const z = M.ruler.zero
  const pts: Record<string, Vec> = { ...M.pts, r0: z, r1: [z[0] + M.ruler.len, z[1]] }
  ;(M.room ?? []).forEach((q, i) => { pts[`m${i}`] = q })
  if (o.prot) {
    // a phone draws the protractor bigger for the map, so it needs more room
    const c = M.pts[o.prot], k = S.w < 560 ? 3.8 : 2.9
    Object.assign(pts, { q0: [c[0], c[1] + k], q1: [c[0] + k, c[1]], q2: [c[0], c[1] - k], q3: [c[0] - k, c[1]] })
  }
  places(S, pts)
  S.names = { ...M.names }
  S.norths = [...M.norths]
  S.fitPts = Object.keys(pts)
  S.fitPad = 0.25
  S.page = { caption: M.scale }
  for (const [a, b] of M.segs) addSeg(S, a, b)
}

/**
 * The ruler, ready to be laid along a line (it starts off the figure), or
 * lying along one. A line measures the same from either end: `follow` lays
 * it the way the student laid it in the beat before (its 0 on B, if that is
 * where they put it).
 */
export function withRuler(S: Scene, M: MapSpec, o: { on?: string; along?: string; fixed?: boolean; follow?: boolean } = {}) {
  if (o.on && o.along) {
    const flip = o.follow && S.keep.rulerFrom === 1
    const from = flip ? o.along : o.on, to = flip ? o.on : o.along
    const z = S.P[from], t = S.P[to]
    const b = (Math.atan2(t[0] - z[0], t[1] - z[1]) * 180) / Math.PI
    S.ruler = { zero: [...z] as Vec, dir: ((b % 360) + 360) % 360, len: M.ruler.len, on: from, along: to, pen: null, turn: !o.fixed, move: !o.fixed }
    return
  }
  S.ruler = { zero: [...M.ruler.zero] as Vec, dir: 90, len: M.ruler.len, on: null, along: null, pen: null, turn: true, move: true }
}

/**
 * The protractor: placed on a place with its 0 along a bearing, or lying off
 * the figure. `goal`: the place it is to be put on (a ring waits there);
 * `want`: the turn that puts the right 0 on North (that end glows).
 */
export function withProt(S: Scene, M: MapSpec, o: { on?: string; rot?: number; fixed?: boolean; pen?: number; lit?: boolean; goal?: string; want?: number; turn?: boolean; move?: boolean; spot?: number; find?: number } = {}) {
  const on = o.on ?? null
  const rot = o.rot ?? 40
  S.prot = {
    c: on ? ([...S.P[on]] as Vec) : ([...M.prot] as Vec), rot, on, pen: o.pen ?? null,
    lit: o.lit ? (rot === 0 ? "outer" : "inner") : null,
    turn: !o.fixed && o.turn !== false, move: !o.fixed && o.move !== false, magnets: [0, 180],
    goal: o.goal, want: o.want, spot: o.spot, find: o.find,
  }
}

// ── beat makers ──────────────────────────────────────────────────────────

export function watch(id: string, say0: string, enter: (S: Scene) => void, after = 1.8): Beat {
  return { id, say: say0, enter, cta: "", ctaAfter: after }
}

/** A number typed: a length (a decimal, right to the nearest tenth) or a bearing (three figures). */
export function askNum(id: string, say0: string, enter: (S: Scene) => void, o: {
  name: string
  answer: number
  unit?: string
  dec?: boolean
  three?: boolean
  /** an angle: a degree sign after the box (not a bearing's three figures) */
  deg?: boolean
  measured?: boolean
  /** a measured answer's own tolerance and "Close" band (an angle: within a degree) */
  tol?: number
  near?: number
  nearSay?: string
  max?: number
  slips?: { v: number; say: string }[]
  above?: () => ENode
  walk: WalkStep<Scene>[]
  then?: (S: Scene) => void
  /** how long to stay after the right answer (ms), for what it sets going */
  after?: number
}): Beat {
  const shown = o.three ? `${brgText(o.answer)}^\\circ` : o.deg ? `${o.answer}^\\circ` : `${o.answer}${o.unit ? `\\text{ ${o.unit}}` : ""}`
  const lead = () => [atom("qn", o.name), op("qe", "=")]
  const tail = o.three || o.deg ? [atom("qd", "{}^\\circ")] : o.unit ? [atom("qu", `\\text{${o.unit}}`)] : []
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      if (o.dec) S.keyRows = DEC_KEYS
      startInput(S, {
        answer: o.answer, three: o.three, dec: o.dec, max: o.max ?? (o.three ? 3 : 7), typed: o.three ? brgText(o.answer) : String(o.answer), slips: o.slips,
        tol: o.tol ?? (o.measured ? 0.05 : undefined), near: o.near ?? (o.measured ? (o.three ? 2.5 : 0.25) : undefined), nearSay: o.nearSay,
        onRight: S2 => o.then?.(S2),
      })
      S.eqFn = S2 => {
        // a measured answer shows the student's own reading once it is right
        const got = o.tol !== undefined && S2.input ? `${S2.input.value}${o.deg ? "^\\circ" : o.unit ? `\\text{ ${o.unit}}` : ""}` : shown
        const line = row(S2.input?.state === "right" ? [...lead(), atom("ans", got, { col: GREEN })] : [...lead(), boxNode(S2), ...tail])
        return o.above ? frac("work", o.above(), line, "rgba(0,0,0,0)") : line
      }
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: o.after ?? 2000,
    walk: o.walk,
  }
}

/**
 * Lay the ruler along a line, its 0 on either end (the line is as long
 * either way). Which end the student chose is kept for the reading after.
 */
export function layBeat(id: string, say0: string, M: MapSpec, a: string, b: string, more?: (S: Scene) => void): Beat {
  const laid = (S: Scene) => !!S.ruler && S.drag === null && ((S.ruler.on === a && S.ruler.along === b) || (S.ruler.on === b && S.ruler.along === a))
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M); more?.(S); withRuler(S, M)
      S.tick = S2 => { if (laid(S2)) S2.keep.rulerFrom = S2.ruler!.on === b ? 1 : 0 }
      look(S)
    },
    done: laid,
    advanceAfter: 1400,
  }
}

/**
 * The protractor, one job at a time. "place": put its centre on a place (it
 * does not turn yet). "turn": it sits on the place; turn it until the 0 that
 * counts from North lies on the North line (rot 0: its scale runs round to
 * the right of North; 180: turned round to the left). "both", in the exam
 * questions: the two in turn (it can be turned once it is on the place).
 */
export function protBeat(id: string, say0: string, M: MapSpec, on: string, rot: 0 | 180, o: { job?: "place" | "turn" | "both"; startRot?: number; more?: (S: Scene) => void } = {}): Beat {
  const job = o.job ?? "both"
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: on })
      o.more?.(S)
      const r0 = o.startRot ?? 40
      if (job === "turn") withProt(S, M, { on, rot: r0, move: false, want: rot })
      else withProt(S, M, { rot: r0, goal: on, turn: job === "both", want: job === "both" ? rot : undefined })
      const start = { rot: S.prot!.rot, c: [...S.prot!.c] }
      S.tick = S2 => {
        const P = S2.prot
        if (!P || S2.drag) return
        // once it is on the place, the next job
        if (job === "both" && P.on === on && P.rot !== rot && !S2.got.has("next")) { S2.got.add("next"); say(S2, "Now turn it, so its $0$ lies on the North line.", "calm", 3.6) }
        if (job === "place" || S2.got.has("said")) return
        // the side the place is on says which way round the protractor goes (only once the student has moved it)
        if (P.rot === start.rot && P.c[0] === start.c[0] && P.c[1] === start.c[1]) return
        if (P.on === on && P.rot === (rot === 0 ? 180 : 0)) {
          S2.got.add("said")
          say(S2, rot === 0 ? "The line is on the right of North. Turn the protractor back round to that side." : "The line is on the left of North. Turn the protractor round to that side.", "wrong", 4)
          later(S2, 4, S3 => S3.got.delete("said"))
        }
      }
      look(S)
    },
    done: S => S.prot?.on === on && (job === "place" || S.prot.rot === rot) && S.drag === null,
    advanceAfter: 1400,
  }
}

/** Mark a bearing on the placed protractor with the pencil; then the line is ruled through the mark. */
export function markBeat(id: string, say0: string, M: MapSpec, at: string, rot: 0 | 180, target: number, far: number, extra: (S: Scene) => void = () => {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: at })
      extra(S)
      // the number to find on the row that starts at 0 on North breathes
      withProt(S, M, { on: at, rot, fixed: true, pen: rot + 15, lit: true, find: rot === 0 ? target : 360 - target })
      S.prot!.penAt = target
      S.tick = S2 => {
        if (S2.got.has("marked") || S2.drag || S2.prot?.pen !== target) return
        // marked: the protractor lifts away and the line is ruled from the place through the mark
        S2.got.add("marked")
        // the pencil's dot stays on the map, and the line is ruled through it
        const mark = `m${at}${target}`
        S2.P[mark] = toWorld(S2, protGeom(S2).penAt!)
        S2.dots = [...S2.dots, mark]
        const end = `${at}${target}`
        S2.P[end] = along(S2.P[at], target, far)
        later(S2, 0.5, S3 => { S3.prot = null; addSeg(S3, at, end, { col: BLUE, grown: false }) })
      }
      look(S)
    },
    // done once the line through the mark has been ruled all the way
    done: S => S.got.has("marked") && (S.segs.find(sg => sg.b === `${at}${target}` && sg.grow.v > 0.97) !== undefined),
    advanceAfter: 1200,
  }
}

/** The lines from both places, ruled. */
export function ruled(S: Scene, a: string, b1: number, l1: number, b: string, b2: number, l2: number) {
  S.P[`${a}${b1}`] = along(S.P[a], b1, l1)
  S.P[`${b}${b2}`] = along(S.P[b], b2, l2)
  addSeg(S, a, `${a}${b1}`, { col: BLUE })
  addSeg(S, b, `${b}${b2}`, { col: BLUE })
}

/** A place where lines pass through (none end there): its name goes in the widest gap between them. */
export function nameBetween(S: Scene, name: string, brgs: number[]) {
  const dirs = [...new Set(brgs.flatMap(b => [b, b + 180]).map(b => ((b % 360) + 360) % 360))].sort((x, y) => x - y)
  let best = 225, gap = -1
  dirs.forEach((d, i) => { const e = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + 360; if (e - d > gap) { gap = e - d; best = (d + gap / 2) % 360 } })
  S.labSide[`L-${name}`] = best
}

/** Tap where the two lines cross: that's the place (`brgs`: the lines' bearings, to keep its name off them). */
export function crossBeat(id: string, say0: string, board: (S: Scene) => void, at: Vec, name = "C", brgs: number[] = []): Beat {
  return {
    id, say: say0,
    enter: S => {
      board(S)
      S.mode = "tapAny"
      S.onTap = (S2, p) => {
        if (S2.got.has("tap")) return
        S2.P[`${name}x`] = at
        const near = dist(p, ptS(S2, `${name}x`)) < (S2.touch ? 40 : 28)
        delete S2.P[`${name}x`]
        if (!near) { say(S2, `$${name}$ is on both lines. Where do they cross?`, "wrong", 3.4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.P[name] = at
        S2.names = { ...S2.names, [name]: name }
        nameBetween(S2, name, brgs)
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1600,
  }
}

// ── walkthroughs ─────────────────────────────────────────────────────────

/** Reading the ruler: its 0 is on one end; read the other end in the lens. */
export const readWalk = (): WalkStep<Scene>[] => [
  { say: "The ruler's $0$ is on one end of the line.", tex: "0\\text{ cm}", show: S => { S.walkLit = "zero" } },
  { say: "Read the number at the other end, in the lens. Each small mark is a millimetre, $0.1$ cm.", tex: "\\;?\\text{ cm}", show: S => { S.walkLit = "lens" } },
]
/** Map to real: each cm stands for so much (its centimetres marked along `line`, or along the line already marked). */
export const realWalk = (cm: string, per: string, unit: string, line?: [string, string]): WalkStep<Scene>[] => {
  const pieces = (S: Scene, lit: number) => {
    if (line) S.along = { a: line[0], b: line[1], step: 1, tex: `${per}\\text{ ${unit}}`, lit }
    else if (S.along) S.along = { ...S.along, lit }
  }
  return [
    { say: `Each cm on the map stands for $${per}$ ${unit}.`, tex: `1\\text{ cm} \\to ${per}\\text{ ${unit}}`, show: S => pieces(S, 1) },
    { say: `So $${cm}$ cm stands for $${cm}$ lots of $${per}$.`, tex: `${cm} \\times ${per}`, show: S => pieces(S, 99) },
  ]
}
/** Reading the protractor: the row of numbers that starts at 0 on North, up to where the line crosses. */
export const protWalk = (line: string): WalkStep<Scene>[] => [
  { say: "Find the row of numbers that starts at $0$ on the North line.", tex: "\\text{Start at } 0 \\text{ on North}", show: S => { if (S.prot) S.prot.find = 0 } },
  { say: `Follow that row round to where $${line}$ crosses the edge.`, tex: `\\text{Read where } ${line} \\text{ crosses}`, show: S => { if (S.prot) S.prot.find = undefined } },
]
/** Angle arcs by id pulse (the rest stop). */
export const pulseArcs = (S: Scene, ...ids: string[]) => { S.arcs = S.arcs.map(a => ({ ...a, pulse: ids.includes(a.id) })) }

// ── angles on the map ────────────────────────────────────────────────────

/** Angles on a map are drawn bigger than the usual arc, to be seen beside a big protractor. */
const ARC_R = 1.6

/** A bearing at a place, as in the Bearings lesson: blue, clockwise from North, sweeping in. */
export function brgArc(S: Scene, at: string, brg: number, tex: string, o: { id?: string; col?: string; grow?: boolean; pulse?: boolean; r?: number } = {}) {
  S.arcs.push({ id: o.id ?? `b-${at}`, at, from: 0, sweep: brg, col: o.col ?? BLUE, tex, r: o.r ?? ARC_R, pulse: o.pulse, grow: o.grow ? { v: 0, t: 1 } : undefined })
}
/** The angle on the left of North: from the line round to North (orange; it and the bearing make a full turn). */
export function leftArc(S: Scene, at: string, brg: number, tex: string, o: { grow?: boolean; pulse?: boolean } = {}) {
  // the same circle as the bearing's: the two make one full turn, in two colours
  S.arcs.push({ id: `l-${at}`, at, from: brg, sweep: 360 - brg, col: ORANGE, tex, r: ARC_R, pulse: o.pulse, grow: o.grow ? { v: 0, t: 1 } : undefined })
}

/**
 * A place not found yet: a pink letter that slides to and fro along a line
 * ruled from `at` to `end` (it is somewhere on it). Its name keeps to one
 * side of the line.
 */
export function slideOn(S: Scene, at: string, end: string, name = "C") {
  const g = `${name}g`
  const A = S.P[at], E = S.P[end]
  S.names = { ...S.names, [g]: name }
  S.nameCol[g] = PINK
  const b = Math.atan2(E[0] - A[0], E[1] - A[1]) * 180 / Math.PI
  S.labSide[`L-${g}`] = ((b - 90) % 360 + 360) % 360
  const t0 = S.time
  const at0 = (t: number): Vec => { const k = 0.3 + 0.55 * (0.5 - 0.5 * Math.cos((t - t0) * 1.3)); return [A[0] + (E[0] - A[0]) * k, A[1] + (E[1] - A[1]) * k] }
  S.P[g] = at0(S.time)
  S.D[g] = at0(S.time)
  const before = S.tick
  S.tick = S2 => { before?.(S2); if (S2.P[g]) S2.P[g] = at0(S2.time) }
}

