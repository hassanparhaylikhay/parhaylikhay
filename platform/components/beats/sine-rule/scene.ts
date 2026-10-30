/**
 * The board for the sine rule (and the other two 6.3 lessons to come): a
 * triangle with no right angle needed. Its corners A, B, C go anywhere;
 * each angle and the side across from it make a pair, and a pair shares a
 * colour: a and A yellow, b and B blue, c and C red (Hassan, 29 Oct 2026:
 * green, orange and blue "don't go well together to visualise triangles").
 *
 * World units are centimetres, y UP; a view fits what the beat wants to show
 * into the room the board has, and holds still under a dragging finger.
 * `P` is where things are, `D` what is drawn, eased toward it.
 *
 * The student drags corners (free, or by a beat's own rule: turning about a
 * corner, sliding along a line), taps angles and sides, pulls a height down,
 * swings a side of fixed length until it meets a line, drags numbers off the
 * triangle into an empty rule, and makes the algebra moves on the shared
 * equation board (../equation.ts). Typed answers use the calculator
 * (../calc.ts), with SHIFT and Ans.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp, turn, DEG, RAD } from "../geometry"
import { createBoard, eqSet, eqStep, eqHit, extent, measure, type EqBoard, type ENode, type Eqn, type Fac } from "../equation"
import { calcType, calcTex, judge, isCalculation, slipMatches, setAns, calcValue, INV_KEY } from "../calc"

export const YELLOW = "#fff067"
export const BLUE = "#00abfa"
export const RED = "#ff4670"
export const GREEN = "#0fee89"
export const CHALK = "#e8e6e0"
export const NEUTRAL = "#c9c7bf"
export const QUIET = "#7a7875"
export { DEG, RAD }

export type Corner = "A" | "B" | "C"
export const CORNERS: Corner[] = ["A", "B", "C"]
/** Each pair's colour: the angle and the side across from it. */
export const PAIR_COL: Record<Corner, string> = { A: YELLOW, B: BLUE, C: RED }
/** The side across from a corner, by its two ends. */
export const ENDS: Record<Corner, [Corner, Corner]> = { A: ["B", "C"], B: ["C", "A"], C: ["A", "B"] }

export type VisKey = "board" | "tri" | "fill" | "arcs" | "angLabs" | "sideLabs" | "letters" | "extra" | "eq" | "keypad" | "chips" | "hint" | "line"
const VIS_KEYS: VisKey[] = ["board", "tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "keypad", "chips", "hint", "line"]
type Spring = { v: number; t: number }

/** A label laid over the board this frame. */
export interface Lab { key: string; tex: string; col: string; at: Vec; size: number; op: number; pulse?: boolean; drag?: boolean }

export interface Chip { id: string; tex: string; kind: "mul" | "div" | "inv"; fac: Fac }

/** How a corner follows a finger in a beat: where the finger puts it, and what it clicks onto. */
export interface DragRule {
  pt: string
  place: (S: Scene, w: Vec) => Vec
  snap?: (S: Scene, p: Vec) => Vec | null
}

/** A side of fixed length swinging about a point, clicking where it meets a line. */
export interface Swing {
  pivot: string
  len: number
  /** where it points now, degrees (0 right, 90 up) */
  ang: number
  /** where its end can land, and which of them it has landed on */
  lands: Vec[]
  landed: number[]
  /** the landings still to find (the others are done) */
  want: number[]
}

/** An empty rule being filled: which piece of the triangle each place wants, and what is there. */
export interface Fill {
  slots: { id: string; want: string; kind: "side" | "angle" }[]
  filled: Record<string, string>
  /** figure labels that can be dragged, by key, with what each stands for */
  items: Record<string, { id: string; kind: "side" | "angle"; tex: string; col: string }>
  onDrop: (S: Scene, item: string, slot: string | null, at: Vec) => void
}

export interface CalcInput {
  value: string
  answer: number
  sf?: number
  dp?: number
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  slips?: { v: number; say: string }[]
  shift?: boolean
  fresh?: boolean
  calcOnly?: string
  /** the most characters it takes (a plain number needs few; long rows would run off a phone) */
  max?: number
  /** the keys that answer it, for test scripts */
  typed?: string
  onRight?: (S: Scene) => void
  help?: (S: Scene, tries: number) => void
}

export type Mode = "none" | "drag" | "rule" | "tapAngle" | "tapSide" | "tapPair" | "tapEq" | "solve" | "drop" | "swing" | "fill"

export type Drag =
  | { kind: "corner"; pt: string }
  | { kind: "drop" }
  | { kind: "swing" }
  | { kind: "chip"; id: string; p: Vec }
  | { kind: "atom"; id: string; p: Vec }
  | { kind: "label"; key: string; p: Vec }

export interface View { cx: number; cy: number; wx: number; wy: number; u: number }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  /** points in world units: A, B, C and any others a figure needs */
  P: Record<string, Vec>
  D: Record<string, Vec>
  /** the letter shown at each point (exam figures rename them) */
  names: Partial<Record<string, string>>
  frame: Rect
  frameFn: ((S: Scene) => Rect) | null
  view: View | null
  viewD: View | null

  /** pairs drawn in their colour */
  coloured: Set<Corner>
  /** angles already in their pair's colour while their side is not yet */
  angColoured: Set<Corner>
  /** what each angle and each side (named by the corner across from it) says */
  angText: Partial<Record<Corner, (S: Scene) => string | null>>
  sideText: Partial<Record<Corner, (S: Scene) => string | null>>
  /** a colour for a side or angle whatever its pair (an unknown in its pair's colour is the default) */
  pulseAng: Set<Corner>
  pulseSide: Set<Corner>
  glowSide: Set<Corner>
  glowAng: Set<Corner>
  /** light spreading from an angle across to its side */
  light: { from: Corner; since: number } | null
  /** the biggest angle and the longest side light up, live */
  biggest: "max" | "min" | null
  /** shown angles: whole degrees (adding to 180), or this many places */
  angDp: number

  /** other lines on a figure, by point names */
  extra: {
    segs: [string, string][]
    dash?: [string, string][]
    fills?: { pts: string[]; col: string; op?: number }[]
    labels?: { a: string; b: string; tex: string; col?: string; inside?: boolean }[]
    /** right-angle squares: at a point, between two others */
    rts?: { at: string; a: string; b: string }[]
    /** angle arcs at other points, with a label */
    arcs?: { at: string; a: string; b: string; tex?: string; col?: string; pulse?: boolean }[]
  } | null
  /** a faint second triangle, through these points */
  ghost: string[] | null
  /** the line from C straight down to AB: how far it has come (1: down) */
  height: { drop: number; since: number; glow: "left" | "right" | null } | null
  swing: Swing | null

  movable: string[]
  rule: DragRule | null
  /** let go on a target: it stays there */
  lockOnSnap: boolean
  releaseNote: ((S: Scene) => string | null) | null

  eq: EqBoard
  eqFn: ((S: Scene) => ENode | null) | null
  alg: Eqn | null
  /** the moves being made (solve.ts) */
  solve: unknown
  chips: Chip[]
  onChip: ((S: Scene, id: string, at: Vec) => void) | null
  tapAtoms: string[]
  onAtom: ((S: Scene, id: string) => void) | null
  dragAtoms: string[]
  onAtomDrop: ((S: Scene, id: string, onto: string | null, at: Vec) => void) | null
  fill: Fill | null

  tapAngles: Corner[] | null
  onAngle: ((S: Scene, c: Corner) => void) | null
  tapSides: Corner[] | null
  onSide: ((S: Scene, c: Corner) => void) | null
  choice: { options: string[]; answer: number; picked: number | null; state: "idle" | "wrong" | "right"; wrongAt: number; guess: boolean } | null

  tick: ((S: Scene) => void) | null
  timers: { at: number; fn: (S: Scene) => void }[]
  vis: Record<VisKey, Spring>
  labs: Lab[]
  labD: Record<string, Vec>
  walkTex: string | null
  input: CalcInput | null
  drag: Drag | null
  touch: boolean
  moved: number
  releases: number
  snapped: boolean
  locked: boolean
  got: Set<string>
  touched: { kind: "angle" | "side"; c: Corner } | { kind: "tri" } | { kind: "eq" } | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  const P: Record<string, Vec> = { A: [0, 0], B: [9, 0], C: [3.2, 5] }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    P, D: copyPts(P), names: {}, frame: { x0: -1, y0: -1, x1: 10, y1: 6 }, frameFn: null, view: null, viewD: null,
    coloured: new Set(), angColoured: new Set(), angText: {}, sideText: {}, pulseAng: new Set(), pulseSide: new Set(), glowSide: new Set(), glowAng: new Set(),
    light: null, biggest: null, angDp: 0, extra: null, ghost: null, height: null, swing: null,
    movable: [], rule: null, lockOnSnap: false, releaseNote: null,
    eq: createBoard(), eqFn: null, alg: null, solve: null, chips: [], onChip: null, tapAtoms: [], onAtom: null, dragAtoms: [], onAtomDrop: null, fill: null,
    tapAngles: null, onAngle: null, tapSides: null, onSide: null, choice: null,
    tick: null, timers: [], vis, labs: [], labD: {}, walkTex: null, input: null, drag: null, touch: false, moved: 0, releases: 0,
    snapped: false, locked: false, got: new Set(), touched: null, flashGood: 0, note: null,
  }
}

const copyPts = (P: Record<string, Vec>): Record<string, Vec> => Object.fromEntries(Object.entries(P).map(([k, v]) => [k, [v[0], v[1]] as Vec]))

// ── the triangle ─────────────────────────────────────────────────────────

/** A point, true or as drawn. */
export const pt = (S: Scene, n: string, drawn = true): Vec => (drawn ? S.D[n] ?? S.P[n] : S.P[n]) ?? [0, 0]

/** The angle at a corner, degrees (true sizes). */
export function angleAt(S: Scene, c: Corner, drawn = false): number {
  const [p, q] = ENDS[c]
  const C = pt(S, c, drawn), a = sub(pt(S, p, drawn), C), b = sub(pt(S, q, drawn), C)
  const cos = dot(a, b) / Math.max(1e-9, Math.hypot(...a) * Math.hypot(...b))
  return Math.acos(clamp(cos, -1, 1)) * DEG
}

/** The side across from a corner: its length (true). */
export function sideLen(S: Scene, c: Corner, drawn = false): number {
  const [p, q] = ENDS[c]
  return dist(pt(S, p, drawn), pt(S, q, drawn))
}

/**
 * The angles as shown: whole degrees that add up to exactly 180 (the
 * largest remainders round up), or `angDp` places when a beat wants them.
 */
export function shownAngles(S: Scene): Record<Corner, number> {
  const t = CORNERS.map(c => angleAt(S, c))
  if (S.angDp > 0) {
    const f = 10 ** S.angDp
    return { A: Math.round(t[0] * f) / f, B: Math.round(t[1] * f) / f, C: Math.round(t[2] * f) / f }
  }
  const fl = t.map(Math.floor)
  let left = 180 - fl.reduce((a, b) => a + b, 0)
  const order = [0, 1, 2].sort((i, j) => (t[j] - fl[j]) - (t[i] - fl[i]))
  for (const i of order) if (left > 0) { fl[i]++; left-- }
  return { A: fl[0], B: fl[1], C: fl[2] }
}

export const angText = (S: Scene, c: Corner) => `${fmt(shownAngles(S)[c], S.angDp)}^\\circ`
export const fmt = (x: number, dp: number) => (dp > 0 ? x.toFixed(dp) : String(Math.round(x)))

/** A length for the board: never made to look whole when it is not, otherwise to `d` places. */
export function numText(x: number, d = 2): string {
  if (Math.abs(x - Math.round(x)) < 1e-6) return String(Math.round(x))
  const trim = (t: string) => t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
  for (let k = d; k <= 6; k++) {
    const t = trim(x.toFixed(k))
    if (t.includes(".")) return t
  }
  return String(Math.round(x))
}
export const lenText = (S: Scene, c: Corner) => numText(sideLen(S, c), 2)

/** Whether a triangle is a fair one to show: corners in order round it, no angle or side too small. */
export function goodTri(P: Record<string, Vec>): boolean {
  const A = P.A, B = P.B, C = P.C
  const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0])
  if (cross <= 0) return false
  for (const [p, q] of [[A, B], [B, C], [C, A]] as [Vec, Vec][]) if (dist(p, q) < 1.2) return false
  const S = { P, D: P } as unknown as Scene
  return CORNERS.every(c => angleAt(S, c) >= 10)
}

/**
 * Where a free corner settles when let go: the nearby point where all three
 * angles are whole degrees, so every side ÷ sin angle shown agrees to the
 * rounding of its side. Null if that point would not be a fair triangle on the board.
 */
function wholeDegrees(S: Scene, k: Corner): Vec | null {
  const [p, q] = ENDS[k].map(n => S.P[n]) as [Vec, Vec]
  const K = S.P[k]
  const ap = Math.round(angleAt(S, ENDS[k][0])), aq = Math.round(angleAt(S, ENDS[k][1]))
  // which way round from p→q the corner sits
  const side = Math.sign((q[0] - p[0]) * (K[1] - p[1]) - (q[1] - p[1]) * (K[0] - p[0])) || 1
  const rot = (v: Vec, a: number): Vec => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)]
  const u = rot(sub(q, p), side * ap * RAD), v = rot(sub(p, q), -side * aq * RAD)
  // p + s·u = q + t·v
  const det = u[0] * -v[1] - u[1] * -v[0]
  if (Math.abs(det) < 1e-9) return null
  const d = sub(q, p)
  const t0 = (d[0] * -v[1] - d[1] * -v[0]) / det
  const np: Vec = [p[0] + t0 * u[0], p[1] + t0 * u[1]]
  const f = S.frame
  if (dist(np, K) > 0.6 || np[0] < f.x0 + 0.3 || np[0] > f.x1 - 0.3 || np[1] < f.y0 + 0.3 || np[1] > f.y1 - 0.3) return null
  return goodTri({ ...S.P, [k]: np }) ? np : null
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  eqY: number
  eqSize: number
  chipsY: number
  keypadTop: number
  lineY: number
  lineSize: number
  labelSize: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 136
  const eqSize = compact ? (w < 400 ? 22 : 24) : 30
  const lineSize = compact ? 20 : 24
  let y = h - (compact ? 80 : 94)
  let keypadTop = y
  if (on(S, "keypad")) { y -= 3 * 46 + 2 * 8 + 14; keypadTop = y }
  let lineY = y
  if (S.walkTex) { lineY = y - lineSize * 0.9; y -= lineSize * 2.2 }
  let chipsY = y
  if (on(S, "chips")) { chipsY = y - 26; y -= 62 }
  let eqY = y
  if (on(S, "eq")) { const band = eqSize * 3.6; eqY = y - band / 2; y -= band }
  const side = compact ? 16 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 14, y1: Math.max(phraseBottom + 150, y - 8) }
  return { compact, phraseBottom, board, eqY, eqSize, chipsY, keypadTop, lineY, lineSize, labelSize: compact ? 16 : 20 }
}

export const screenScale = (S: Scene) => clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
export function resize(S: Scene, w: number, h: number) { S.w = w; S.h = h }

// ── world and screen ─────────────────────────────────────────────────────

export function toScreen(S: Scene, p: Vec, drawn = true): Vec {
  const v = (drawn ? S.viewD : S.view) ?? S.view
  if (!v) return [0, 0]
  return [v.cx + (p[0] - v.wx) * v.u, v.cy - (p[1] - v.wy) * v.u]
}
export function toWorld(S: Scene, q: Vec): Vec {
  const v = S.viewD ?? S.view
  if (!v) return [0, 0]
  return [v.wx + (q[0] - v.cx) / v.u, v.wy - (q[1] - v.cy) / v.u]
}
export const ptS = (S: Scene, n: string, drawn = true) => toScreen(S, pt(S, n, drawn), drawn)

/** Room for the triangle and every other point of the figure, with a margin for labels. */
export function figFrame(S: Scene, names?: string[]): Rect {
  const ns = names ?? Object.keys(S.P)
  const ps = ns.map(n => S.P[n]).filter(Boolean)
  const xs = ps.map(p => p[0]), ys = ps.map(p => p[1])
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1)
  const m = size * 0.12
  return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, y0: Math.min(...ys) - m, y1: Math.max(...ys) + m }
}

function fitView(S: Scene, L: Layout): View {
  const f = S.frame
  const pad = Math.min(L.compact ? 30 : 46, (L.board.y1 - L.board.y0) * 0.12)
  const bw = L.board.x1 - L.board.x0 - 2 * pad, bh = L.board.y1 - L.board.y0 - 2 * pad
  const fw = Math.max(0.05, f.x1 - f.x0), fh = Math.max(0.05, f.y1 - f.y0)
  const u = Math.max(0.05, Math.min(bw / fw, bh / fh, 420))
  return { cx: (L.board.x0 + L.board.x1) / 2, cy: (L.board.y0 + L.board.y1) / 2, wx: (f.x0 + f.x1) / 2, wy: (f.y0 + f.y1) / 2, u }
}

// ── labels ───────────────────────────────────────────────────────────────

/** The middle of the triangle on screen. */
export function triMiddle(S: Scene): Vec {
  const a = ptS(S, "A"), b = ptS(S, "B"), c = ptS(S, "C")
  return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]
}

/** Roughly how wide a short label is (what is seen, not the TeX). */
export function labelWidth(tex: string, size: number): number {
  const seen = tex.replace(/\\textcolor\{[^}]*\}/g, "").replace(/\\text\{([^}]*)\}/g, "$1").replace(/\\circ/g, "o").replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_\\ ]/g, "")
  return seen.length * size * 0.5
}

/** The arc at a corner: its radius on screen (labels keep clear of it). */
export function arcRadius(S: Scene, c: Corner): number {
  const [p, q] = ENDS[c]
  const C = ptS(S, c)
  return Math.min(36, dist(C, ptS(S, p)) * 0.28, dist(C, ptS(S, q)) * 0.28)
}

/** Where an angle's label goes: along its bisector, clear of the arc and of both arms. */
export function angleLabelAt(S: Scene, c: Corner, size: number, tex: string): Vec {
  const [p, q] = ENDS[c]
  const C = ptS(S, c), a = ptS(S, p), b = ptS(S, q)
  const a1 = Math.atan2(a[1] - C[1], a[0] - C[0]), a2 = Math.atan2(b[1] - C[1], b[0] - C[0])
  const sw = turn(a1, a2), half = Math.abs(sw) / 2, bis = a1 + sw / 2
  const need = Math.max(size * 0.95, labelWidth(tex, size) * 0.55 + 4)
  const r = Math.max(clamp(need / Math.max(0.2, Math.sin(half)), size * 1.9, size * 4.4), arcRadius(S, c) + size * 0.9)
  return add(C, mul([Math.cos(bis), Math.sin(bis)], r))
}

/** Where a side's label goes: outside the triangle by its middle, clear by half its own size. */
export function sideLabelAt(S: Scene, c: Corner, size: number, tex: string): Vec {
  const [p, q] = ENDS[c]
  return segLabelAt(S, ptS(S, p), ptS(S, q), size, tex, triMiddle(S), false)
}

function segLabelAt(S: Scene, a: Vec, b: Vec, size: number, tex: string, mid: Vec, inside: boolean): Vec {
  void S
  const m = lerpV(a, b, 0.5)
  const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if ((dot(n, sub(mid, m)) > 0) !== inside) n = mul(n, -1)
  const halfW = labelWidth(tex, size) / 2, halfH = size * 0.55
  const off = Math.max(size * 0.75 + 6, Math.abs(n[0]) * (halfW + 8) + Math.abs(n[1]) * (halfH + 7))
  return add(m, mul(n, off))
}

/** The pair colour of an angle or side, if its pair is coloured. */
export const pairCol = (S: Scene, c: Corner) => (S.coloured.has(c) ? PAIR_COL[c] : CHALK)
export const angCol = (S: Scene, c: Corner) => (S.coloured.has(c) || S.angColoured.has(c) ? PAIR_COL[c] : CHALK)

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  const big = S.biggest ? biggestCorner(S, S.biggest) : null
  if (S.vis.angLabs.v > 0.01) {
    for (const c of CORNERS) {
      const tex = S.angText[c]?.(S)
      if (!tex) continue
      out.push({ key: `ang-${c}`, tex, col: angCol(S, c), at: angleLabelAt(S, c, size, tex), size, op: S.vis.angLabs.v, pulse: S.pulseAng.has(c) || big === c, drag: !!S.fill?.items[`ang-${c}`] })
    }
  }
  if (S.vis.sideLabs.v > 0.01) {
    for (const c of CORNERS) {
      const tex = S.sideText[c]?.(S)
      if (!tex) continue
      out.push({ key: `side-${c}`, tex, col: pairCol(S, c), at: sideLabelAt(S, c, size, tex), size: size + 1, op: S.vis.sideLabs.v, pulse: S.pulseSide.has(c) || big === c, drag: !!S.fill?.items[`side-${c}`] })
    }
  }
  if (S.extra?.labels && S.vis.extra.v > 0.01) {
    const mid = triMiddle(S)
    for (const e of S.extra.labels) {
      const tex = e.tex
      out.push({ key: `X-${e.a}${e.b}`, tex, col: e.col ?? CHALK, at: segLabelAt(S, ptS(S, e.a), ptS(S, e.b), size, tex, mid, !!e.inside), size, op: S.vis.extra.v })
    }
  }
  if (S.extra?.arcs && S.vis.extra.v > 0.01) {
    for (const g of S.extra.arcs) {
      if (!g.tex) continue
      out.push({ key: `XA-${g.at}${g.a}${g.b}`, tex: g.tex, col: g.col ?? CHALK, at: extraArcGeom(S, g, size).labelAt, size, op: S.vis.extra.v, pulse: g.pulse })
    }
  }
  if (S.vis.letters.v > 0.01) {
    const mid = triMiddle(S)
    for (const [n, letter] of Object.entries(S.names)) {
      if (!letter || !S.P[n]) continue
      const p = ptS(S, n)
      const d = sub(p, mid), l = Math.hypot(d[0], d[1]) || 1
      out.push({ key: `L-${n}`, tex: letter, col: CORNERS.includes(n as Corner) && S.coloured.has(n as Corner) ? PAIR_COL[n as Corner] : CHALK, at: add(p, mul(d, (size * 0.95 + 4) / l)), size: size + 1, op: S.vis.letters.v })
    }
  }
  return out
}

/** An arc at a point of a figure that is not one of the triangle's angles. */
export function extraArcGeom(S: Scene, g: { at: string; a: string; b: string; tex?: string }, size: number) {
  const C = ptS(S, g.at), a = ptS(S, g.a), b = ptS(S, g.b)
  const a1 = Math.atan2(a[1] - C[1], a[0] - C[0]), a2 = Math.atan2(b[1] - C[1], b[0] - C[0])
  const sw = turn(a1, a2), half = Math.abs(sw) / 2, bis = a1 + sw / 2
  const r = Math.min(36, dist(C, a) * 0.28, dist(C, b) * 0.28)
  const need = Math.max(size * 0.95, labelWidth(g.tex ?? "", size) * 0.55 + 4)
  const lr = Math.max(clamp(need / Math.max(0.2, Math.sin(half)), size * 1.9, size * 4.4), r + size * 0.9)
  return { C, a1, sweep: sw, r, labelAt: add(C, mul([Math.cos(bis), Math.sin(bis)], lr)) }
}

/** The corner with the biggest (or smallest) angle, as shown. */
export function biggestCorner(S: Scene, which: "max" | "min"): Corner {
  const a = shownAngles(S)
  return CORNERS.reduce((best, c) => ((which === "max" ? a[c] > a[best] : a[c] < a[best]) ? c : best), "A" as Corner)
}

// ── animation ────────────────────────────────────────────────────────────

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  const fp = k(S.drag ? 0.5 : 0.14)
  for (const [n, p] of Object.entries(S.P)) {
    const d = S.D[n]
    if (!d) { S.D[n] = [p[0], p[1]]; continue }
    S.D[n] = lerpV(d, p, fp)
  }
  for (const n of Object.keys(S.D)) if (!S.P[n]) delete S.D[n]
  if (S.height) S.height.drop = clamp(S.height.drop, 0, 1)

  const L = layout(S)
  if (S.frameFn && !S.drag) S.frame = S.frameFn(S)
  if (!S.drag || !S.view) S.view = fitView(S, L)
  if (!S.viewD) S.viewD = { ...S.view }
  const f = k(0.1)
  const V = S.view, W = S.viewD
  S.viewD = { cx: W.cx + (V.cx - W.cx) * f, cy: W.cy + (V.cy - W.cy) * f, wx: W.wx + (V.wx - W.wx) * f, wy: W.wy + (V.wy - W.wy) * f, u: W.u + (V.u - W.u) * f }

  let node = S.eqFn ? S.eqFn(S) : null
  let size = L.eqSize
  const fits = (n: ENode, sz: number) => extent(n, sz).w <= S.w - 32
  if (node) while (size > 14 && !fits(node, size)) size -= 1
  // still too wide with a long calculation typed: the box scrolls like a calculator's display, showing the end
  const typed = S.input?.value ?? ""
  if (node && !fits(node, size) && typed.length > 1) {
    for (let k = 1; k < typed.length; k++) {
      const n2 = withBoxTex(node, `\\cdots ${calcTex(typed.slice(k))}`)
      if (fits(n2, size)) { node = n2; break }
    }
  }
  S.eq.size = size
  S.eq.cx = S.w / 2
  S.eq.cy = L.eqY
  eqSet(S.eq, node, S.eq.goneTo)
  eqStep(S.eq, dt)
  S.tick?.(S)

  S.labs = computeLabels(S, L)
  const fl = k(S.drag ? 0.6 : 0.16)
  const keep = new Set<string>()
  for (const l of S.labs) {
    keep.add(l.key)
    const d = S.labD[l.key]
    S.labD[l.key] = d ? lerpV(d, l.at, fl) : [l.at[0], l.at[1]]
  }
  for (const key of Object.keys(S.labD)) if (!keep.has(key)) delete S.labD[key]

  if (S.timers.length) {
    const due = S.timers.filter(t => S.time >= t.at)
    S.timers = S.timers.filter(t => S.time < t.at)
    for (const t of due) t.fn(S)
  }
  S.flashGood = Math.max(0, S.flashGood - dt)
  if (S.note && S.time > S.note.until) S.note = null
}

// ── beat helpers ─────────────────────────────────────────────────────────

export function show(S: Scene, keys: VisKey[]) {
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
}
export function later(S: Scene, seconds: number, fn: (S: Scene) => void) {
  S.timers.push({ at: S.time + seconds, fn })
}
export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drag = null
  S.moved = 0
  S.releases = 0
  S.snapped = false
  S.locked = false
  S.frameFn = null
  S.names = { A: "A", B: "B", C: "C" }
  S.coloured = new Set()
  S.angColoured = new Set()
  S.angText = {}
  S.sideText = {}
  S.pulseAng = new Set()
  S.pulseSide = new Set()
  S.glowSide = new Set()
  S.glowAng = new Set()
  S.light = null
  S.biggest = null
  S.angDp = 0
  S.extra = null
  S.ghost = null
  S.height = null
  S.swing = null
  S.movable = []
  S.rule = null
  S.lockOnSnap = false
  S.releaseNote = null
  S.eqFn = null
  S.alg = null
  S.solve = null
  S.eq.goneTo = {}
  S.eq.goneFade = {}
  S.eq.slow = null
  S.chips = []
  S.onChip = null
  S.tapAtoms = []
  S.onAtom = null
  S.dragAtoms = []
  S.onAtomDrop = null
  S.fill = null
  S.tapAngles = null
  S.onAngle = null
  S.tapSides = null
  S.onSide = null
  S.choice = null
  S.tick = null
  S.timers = []
  S.walkTex = null
  S.input = null
  S.got = new Set()
  S.touched = null
  S.note = null
  // points other than the triangle's belong to the beat that made them
  for (const n of Object.keys(S.P)) if (!CORNERS.includes(n as Corner)) delete S.P[n]
}

/** A label's place on screen right now (for things that fly from it). */
export const labAt = (S: Scene, key: string): Vec | undefined => (S.labD[key] ? [S.labD[key][0], S.labD[key][1]] : undefined)

export function startInput(S: Scene, spec: Omit<CalcInput, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

/** The same equation with the answer box showing other text. */
function withBoxTex(n: ENode, tex: string): ENode {
  if (n.k === "box") return n.slot ? n : { ...n, tex }
  if (n.k === "row") return { ...n, items: n.items.map(i => withBoxTex(i, tex)) }
  if (n.k === "frac") return { ...n, num: withBoxTex(n.num, tex), den: withBoxTex(n.den, tex) }
  if (n.k === "paren") return { ...n, child: withBoxTex(n.child, tex) }
  return n
}

/** The answer box, for an equation's tail. */
export function boxNode(S: Scene): ENode {
  const inp = S.input
  return { k: "box", id: "box", tex: inp ? calcTex(inp.value) : "", state: inp?.state ?? "idle", wrongAt: inp?.wrongAt ?? -9 }
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 40 : 28)

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

/** The far end of the swinging side, world units. */
export function swingEnd(S: Scene): Vec | null {
  const g = S.swing
  if (!g) return null
  const p = pt(S, g.pivot, false)
  return [p[0] + Math.cos(g.ang * RAD) * g.len, p[1] + Math.sin(g.ang * RAD) * g.len]
}

/** The foot of the height from C, on AB (world). */
export function heightFoot(S: Scene, drawn = true): Vec {
  const A = pt(S, "A", drawn), B = pt(S, "B", drawn), C = pt(S, "C", drawn)
  const ab = sub(B, A)
  const t = dot(sub(C, A), ab) / Math.max(1e-9, dot(ab, ab))
  return add(A, mul(ab, t))
}

/** The point the angle hit-test aims at: a little inside the corner, along its bisector. */
function angleSpot(S: Scene, c: Corner): Vec {
  const [p, q] = ENDS[c]
  const C = ptS(S, c), a = ptS(S, p), b = ptS(S, q)
  const u = (v: Vec) => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l] as Vec }
  const bis = u(add(u(sub(a, C)), u(sub(b, C))))
  return add(C, mul(bis, Math.min(34, arcRadius(S, c) + 8)))
}

/** The angle nearest a tap (its arc or its label), and how far. */
function nearestAngle(S: Scene, p: Vec): [Corner | null, number] {
  let best: Corner | null = null, bd = Infinity
  for (const c of S.tapAngles ?? CORNERS) {
    const d = Math.min(dist(p, angleSpot(S, c)), S.labD[`ang-${c}`] ? dist(p, S.labD[`ang-${c}`]) : Infinity)
    if (d < bd) { bd = d; best = c }
  }
  return [best, bd]
}

/** The side nearest a tap (the line or its label), and how far. */
function nearestSide(S: Scene, p: Vec): [Corner | null, number] {
  let best: Corner | null = null, bd = Infinity
  for (const c of S.tapSides ?? CORNERS) {
    const [a, b] = ENDS[c]
    const d = Math.min(distToSeg(p, ptS(S, a), ptS(S, b)), S.labD[`side-${c}`] ? dist(p, S.labD[`side-${c}`]) : Infinity)
    if (d < bd) { bd = d; best = c }
  }
  return [best, bd]
}

/** Is a tap inside a corner's arc (between its arms, a little past the arc)? */
function inArc(S: Scene, c: Corner, p: Vec): boolean {
  const [q1, q2] = ENDS[c]
  const C = ptS(S, c), v = sub(p, C)
  if (Math.hypot(v[0], v[1]) > arcRadius(S, c) + 14) return false
  const ang = (w: Vec) => Math.atan2(w[1], w[0])
  const a1 = ang(sub(ptS(S, q1), C)), sw = turn(a1, ang(sub(ptS(S, q2), C))), t = turn(a1, ang(v))
  return sw > 0 ? t >= 0 && t <= sw : t <= 0 && t >= sw
}

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const L = layout(S)
  if (S.mode === "drag" || S.mode === "rule") {
    if (S.locked) return false
    const names = S.mode === "rule" && S.rule ? [S.rule.pt] : S.movable
    let best: string | null = null, bd = Infinity
    for (const n of names) { const d = dist(p, ptS(S, n)); if (d < bd) { bd = d; best = n } }
    if (best && bd < tol(S) + 16) { S.drag = { kind: "corner", pt: best }; S.touched = { kind: "tri" }; return true }
    return false
  }
  if (S.mode === "drop") {
    const top = ptS(S, "C")
    if (dist(p, top) < tol(S) + 14) { S.drag = { kind: "drop" }; return true }
    return false
  }
  if (S.mode === "swing") {
    if (S.locked) return false
    const e = swingEnd(S)
    if (!e) return false
    const E = toScreen(S, e), Pv = ptS(S, S.swing!.pivot)
    if (dist(p, E) < tol(S) + 16 || (distToSeg(p, Pv, E) < tol(S) && dist(p, Pv) > 40)) { S.drag = { kind: "swing" }; return true }
    return false
  }
  if (S.mode === "tapAngle") {
    const [c, d] = nearestAngle(S, p)
    if (c && d < tol(S) + 22) S.onAngle?.(S, c)
    return false
  }
  if (S.mode === "tapSide") {
    const [c, d] = nearestSide(S, p)
    if (c && d < tol(S)) S.onSide?.(S, c)
    return false
  }
  // a side or an angle, in either order: inside a corner's arc it is the angle, elsewhere the nearer one
  if (S.mode === "tapPair") {
    const [ac, ad] = nearestAngle(S, p), [sc, sd] = nearestSide(S, p)
    const angOk = !!ac && ad < tol(S) + 22, sideOk = !!sc && sd < tol(S)
    if (ac && angOk && (!sideOk || inArc(S, ac, p) || ad <= sd)) S.onAngle?.(S, ac)
    else if (sc && sideOk) S.onSide?.(S, sc)
    return false
  }
  if (S.mode === "fill" && S.fill) {
    let best: string | null = null, bd = Infinity
    for (const key of Object.keys(S.fill.items)) {
      const at = S.labD[key]
      if (!at) continue
      const d = dist(p, at)
      if (d < bd) { bd = d; best = key }
    }
    if (best && bd < tol(S) + 10) { S.drag = { kind: "label", key: best, p }; return true }
    return false
  }
  if (S.mode === "solve" || S.mode === "tapEq") {
    for (const c of chipRects(S, L)) if (inRect(p, c.r, 8)) { S.drag = { kind: "chip", id: c.id, p }; return true }
    if (S.dragAtoms.length) {
      const id = eqHit(S.eq, p, S.dragAtoms)
      if (id) { S.drag = { kind: "atom", id, p }; return true }
    }
    if (S.tapAtoms.length) {
      const id = eqHit(S.eq, p, S.tapAtoms)
      if (id) S.onAtom?.(S, id)
    }
    return false
  }
  return false
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  if (d.kind === "chip" || d.kind === "atom" || d.kind === "label") { S.moved += dist(p, d.p); d.p = p; return }
  const w = toWorld(S, p)
  if (d.kind === "corner") {
    const old = S.P[d.pt]
    let np: Vec = S.rule && S.rule.pt === d.pt ? S.rule.place(S, w) : w
    S.snapped = false
    const sn = S.rule && S.rule.pt === d.pt ? S.rule.snap?.(S, np) : null
    if (sn) { np = sn; S.snapped = true }
    // a free corner keeps the triangle a fair one (it never folds flat or turns inside out)
    if (S.mode === "drag") {
      // a free corner stays on the board and keeps the triangle a fair one (it never folds flat or turns inside out)
      const f = S.frame
      np = [clamp(np[0], f.x0 + 0.3, f.x1 - 0.3), clamp(np[1], f.y0 + 0.3, f.y1 - 0.3)]
      if (!goodTri({ ...S.P, [d.pt]: np })) return
    }
    S.moved += dist(old, np) * (S.viewD?.u ?? 30)
    S.P[d.pt] = np
    return
  }
  if (d.kind === "drop" && S.height) {
    const C = pt(S, "C", false), H = heightFoot(S, false)
    const total = dist(C, H)
    const along = dot(sub(w, C), sub(H, C)) / Math.max(1e-9, total * total)
    S.height.drop = clamp(along, 0, 1) > 0.9 ? 1 : clamp(along, 0, 1)
    return
  }
  if (d.kind === "swing" && S.swing) {
    const g = S.swing
    const P0 = pt(S, g.pivot, false)
    let a = Math.atan2(w[1] - P0[1], w[0] - P0[0]) * DEG
    S.snapped = false
    for (const i of g.want) {
      const L = g.lands[i]
      const la = Math.atan2(L[1] - P0[1], L[0] - P0[0]) * DEG
      if (Math.abs(turn(a * RAD, la * RAD)) * DEG < 4) { a = la; S.snapped = true }
    }
    S.moved += Math.abs(turn(g.ang * RAD, a * RAD)) * g.len * (S.viewD?.u ?? 30)
    g.ang = a
  }
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  S.releases++
  if (d.kind === "chip") {
    const L = layout(S)
    if (d.p[1] < L.chipsY - 26) S.onChip?.(S, d.id, d.p)
    return
  }
  if (d.kind === "atom") {
    const onto = eqHit(S.eq, d.p, undefined, 6)
    S.onAtomDrop?.(S, d.id, onto && onto !== d.id ? onto : null, d.p)
    return
  }
  if (d.kind === "label") {
    const slots = S.fill?.slots.filter(s => !S.fill!.filled[s.id]).map(s => s.id) ?? []
    const onto = eqHit(S.eq, d.p, slots, 14)
    S.fill?.onDrop(S, d.key, onto, d.p)
    return
  }
  if (d.kind === "drop") {
    if (S.height && S.height.drop < 1) { S.height.drop = 0; say(S, "Pull it all the way down to $AB$.", "calm", 3) }
    return
  }
  if (d.kind === "corner" && S.mode === "drag" && (CORNERS as string[]).includes(d.pt)) {
    const np = wholeDegrees(S, d.pt as Corner)
    if (np) S.P[d.pt] = np
  }
  if (S.snapped && S.lockOnSnap) {
    S.locked = true
    S.flashGood = 1
    S.note = null
    if (d.kind === "swing" && S.swing) {
      const g = S.swing, P0 = pt(S, g.pivot, false)
      const i = g.want.find(j => Math.abs(turn(g.ang * RAD, Math.atan2(g.lands[j][1] - P0[1], g.lands[j][0] - P0[0]))) < 1e-6)
      if (i !== undefined) { g.landed.push(i); g.want = g.want.filter(j => j !== i) }
    }
    return
  }
  const n = S.releaseNote?.(S)
  if (n) say(S, n, "calm", 3.2)
}

export function dragAt(S: Scene): Vec | null {
  const d = S.drag
  return d && (d.kind === "chip" || d.kind === "atom" || d.kind === "label") ? d.p : null
}

// ── chips ────────────────────────────────────────────────────────────────

export function chipRects(S: Scene, L: Layout): { id: string; r: Rect }[] {
  if (!S.chips.length) return []
  const size = L.eqSize * 0.9
  const gap = 18
  const ws = S.chips.map(c => measure(c.tex, size).w + size * 1.3)
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)
  let x = S.w / 2 - total / 2
  const hgt = size * 1.9
  return S.chips.map((c, i) => {
    const r = { x0: x, x1: x + ws[i], y0: L.chipsY - hgt / 2, y1: L.chipsY + hgt / 2 }
    x += ws[i] + gap
    return { id: c.id, r }
  })
}

const inRect = (p: Vec, r: Rect, pad = 0) => p[0] >= r.x0 - pad && p[0] <= r.x1 + pad && p[1] >= r.y0 - pad && p[1] <= r.y1 + pad

// ── typed answers: the calculator ────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "go") { check(S); return }
  if (key === "SHIFT") { inp.shift = !inp.shift; return }
  if ((inp.state === "wrong" || inp.fresh) && key !== "back") inp.value = ""
  inp.fresh = false
  const k = inp.shift && INV_KEY[key] ? INV_KEY[key] : key
  inp.shift = false
  inp.value = calcType(inp.value, k, inp.max)
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const { verdict, v } = judge(inp.value, inp.answer, { sf: inp.sf, dp: inp.dp })
  if (verdict === "error") {
    inp.tries++; inp.state = "wrong"; inp.wrongAt = S.time
    say(S, "Math ERROR. Is the fraction the right way up?", "wrong", 4.5)
    inp.help?.(S, inp.tries)
    return
  }
  if (verdict === "unfinished") { say(S, "That calculation is not finished.", "calm", 2.6); return }
  if (inp.calcOnly && !isCalculation(inp.value)) { inp.fresh = true; inp.tries++; say(S, inp.calcOnly, "calm", 3.4); return }
  if (verdict === "rough") {
    inp.fresh = true
    say(S, inp.sf ? `Nearly. Give it to $${inp.sf}$ significant figures.` : `Nearly. Give it to $${inp.dp ?? 1}$ decimal place.`, "calm", 3.4)
    return
  }
  if (verdict === "right") {
    inp.state = "right"
    // Ans is what this sum gave, as a calculator keeps it
    const val = calcValue(inp.value)
    setAns(val ?? inp.answer)
    S.note = null
    S.touched = { kind: "eq" }
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  inp.help?.(S, inp.tries)
  const slip = v !== null ? inp.slips?.find(s => slipMatches(inp.value, v, s.v)) : undefined
  if (slip) say(S, slip.say, "wrong", 4.5)
}

// ── word choices ─────────────────────────────────────────────────────────

/** A few words to pick from. A guess is never wrong: "Spot on." or "Let's see." */
export function choose(S: Scene, options: string[], answer: number, guess = true) {
  S.choice = { options, answer, picked: null, state: "idle", wrongAt: -9, guess }
}

export function pick(S: Scene, k: number) {
  const ch = S.choice
  if (!ch || ch.state === "right" || (ch.guess && ch.picked !== null)) return
  ch.picked = k
  if (k === ch.answer) { ch.state = "right"; say(S, ch.guess ? "Spot on." : "Yes.", "calm", 2.4); return }
  if (ch.guess) { ch.state = "wrong"; say(S, "Let's see.", "calm", 2.4); return }
  ch.state = "wrong"
  ch.wrongAt = S.time
}

export { dist, lerpV, clamp, turn, add, sub, mul, dot }
