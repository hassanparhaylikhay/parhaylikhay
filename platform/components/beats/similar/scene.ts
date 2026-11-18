/**
 * The board for similarity (4.4): shapes that can be moved, turned, flipped,
 * scaled and stretched, each easing smoothly to where it is told to go.
 *
 * World: x right, y up, in the question's own units. A shape has corners in
 * its own coordinates (its pivot at the origin: it scales and turns about
 * that point) and a pose that places it: where its origin is, how far it is
 * turned, whether it is flipped, its scale factor, and a stretch along its
 * own x (to show a shape that is NOT similar). `pose` is where it is going,
 * `D` what is drawn.
 *
 * On a shape: angle marks counted in arcs as the papers mark matching angles
 * (one arc, two arcs), side lengths with a "×k" tag, parallel arrows, sides
 * lit in a colour when they are matched (blue: the pair that gives the scale
 * factor; orange: the pair that gives the length), and the letters. Over it:
 * lines (an F or a Z drawn glowing), a bar model, and the working with the
 * calculator below.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp } from "../geometry"
import { createBoard, eqSet, eqStep, extent, row, type EqBoard, type ENode } from "../equation"
import { calcType, calcTex, judge, slipMatches } from "../calc"

export const CHALK = "#e8e6e0"
export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const QUIET = "#7a7875"

const RAD = Math.PI / 180, DEG = 180 / Math.PI

// ── what a board holds ───────────────────────────────────────────────────

type Spring = { v: number; t: number }

export type VisKey = "board" | "shapes" | "letters" | "marks" | "sides" | "lines" | "eq" | "keypad" | "chips" | "hint" | "line" | "bars"
const VIS_KEYS: VisKey[] = ["board", "shapes", "letters", "marks", "sides", "lines", "eq", "keypad", "chips", "hint", "line", "bars"]

/** Where a shape is: its origin, its turn (degrees, anticlockwise), a flip of its own x, its scale factor and a stretch of its own x. */
export interface Pose { x: number; y: number; rot: number; flip: 1 | -1; k: number; sx: number }
export const pose = (o: Partial<Pose> = {}): Pose => ({ x: 0, y: 0, rot: 0, flip: 1, k: 1, sx: 1, ...o })

export interface Shape {
  id: string
  /** corners in its own coordinates; its origin is the point it scales and turns about */
  pts: Record<string, Vec>
  /** the corners in order round it */
  order: string[]
  /** the letter shown at each corner (none: no letter) */
  names: Record<string, string>
  pose: Pose
  D: Pose
  /** a faint dashed outline (where a shape was, or will be) */
  ghost?: boolean
  /** drawn faint (the student is looking at another shape) */
  quiet?: boolean
  /** not drawn: only its marks and letters show (an angle on a part of another shape) */
  hidden?: boolean
  /** a prism: this shape is its front face, pushed back this far (own units, times its scale factor). A corner's back copy is named with a ' ("B'"). */
  depth?: number
  /** unit squares drawn over its faces (a square or a cube grown to a whole scale factor) */
  grid?: boolean
  /** a triangle cut into this many rows of small copies of itself (2: four copies) */
  split?: number
  /** a cube filled with unit cubes: how many are in so far */
  cubes?: number
  /** drawn as a mug: its rectangle is the body, with a round top and a handle */
  mug?: boolean
  /** its face shaded in a colour (a cross-section, a shaded region) */
  fill?: string
  fillOp?: number
}

/** An angle mark at a corner: arcs counted as the papers count them, and what it says. */
export interface Mark { sh: string; at: string; count: number; col?: string; tex?: string; pulse?: boolean; square?: boolean }
/** A side's label: its length (or "?"), with a "×k" tag beside it if it has one. */
export interface SideLab { sh: string; a: string; b: string; tex: string; col?: string; pulse?: boolean; tag?: string }
/** A label in the middle of a shape's face (its area). */
export interface InLab { sh: string; tex: string; col?: string; pulse?: boolean; dy?: number; loc?: Vec }
/** Parallel arrows on a side (one or two arrowheads). */
export interface Arrow { sh: string; a: string; b: string; n: number }
/** A line drawn over the figure through world points (the F or Z of a reason). */
export interface Line { pts: Vec[]; col: string; glow?: boolean; dash?: boolean; w?: number }
/** A bar of parts, for comparing lengths ("1 part" against "1.75 parts"). */
export interface BarRow { label: string; parts: { w: number; col: string; tex?: string; dash?: boolean }[] }

/** Something the student drags. */
export interface Handle {
  id: string
  sh: string
  /** the corner it sits on (the whole shape for "move") */
  at: string
  kind: "scale" | "stretch" | "turn" | "move"
  /** values it clicks onto (a scale factor, a stretch, a turn in degrees, a place) */
  snap?: number[]
  place?: Vec
  min?: number
  max?: number
  /** clicked onto a value it stays there (no more dragging) */
  lock?: boolean
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
  fresh?: boolean
  max?: number
  typed?: string
  onRight?: (S: Scene) => void
}

export type Mode = "none" | "tapSide" | "tapAngle"

export type Drag = { kind: "handle"; id: string; off: Vec; grab: number; moved: number; home?: Vec } | { kind: "pan"; start: Vec; moved: number }

export interface Lab { key: string; tex: string; col: string; at: Vec; size: number; op: number; pulse?: boolean }

export interface Act { dur: number; begin?: (S: Scene) => void; run?: (S: Scene, e: number, t: number) => void; end?: (S: Scene) => void }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  shapes: Shape[]
  marks: Mark[]
  sideLabs: SideLab[]
  inLabs: InLab[]
  /** sides drawn in a colour (matched), by key "shape:ab" */
  sideCol: Record<string, string>
  /** sides glowing (tapped, or to look at) */
  sideGlow: Set<string>
  arrows: Arrow[]
  lines: Line[]
  bars: BarRow[] | null
  handles: Handle[]
  /** the handle that has clicked onto a value, and the value */
  snapped: { id: string; v: number } | null
  locked: Set<string>
  /** the view keeps this world rect in room (else every shape, where it is and where it is going) */
  frame: Rect | null
  fit: { cx: number; cy: number; u: number; c: Vec } | null
  fitD: { cx: number; cy: number; u: number; c: Vec } | null
  holdFit: boolean

  tapSides: string[] | null
  onSide: ((S: Scene, key: string) => void) | null
  tapAngles: string[] | null
  onAngle: ((S: Scene, key: string) => void) | null

  eq: EqBoard
  eqFn: ((S: Scene) => ENode | null) | null
  eqRoom: Spring
  input: CalcInput | null
  choice: { options: string[]; answer: number; picked: number | null; state: "idle" | "wrong" | "right"; wrongAt: number; guess: boolean; onPick?: (S: Scene, k: number, right: boolean) => void } | null

  acts: Act[]
  act: { a: Act; t0: number } | null
  tick: ((S: Scene) => void) | null
  timers: { at: number; fn: (S: Scene) => void }[]
  vis: Record<VisKey, Spring>
  labs: Lab[]
  labD: Record<string, Vec>
  walkTex: string | null
  drag: Drag | null
  touch: boolean
  /** how far the student has dragged this beat (px) */
  moved: number
  got: Set<string>
  vals: Record<string, number>
  keyRows: string[][] | null
  touched: string | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    shapes: [], marks: [], sideLabs: [], inLabs: [], sideCol: {}, sideGlow: new Set(), arrows: [], lines: [], bars: null, handles: [],
    snapped: null, locked: new Set(), frame: null, fit: null, fitD: null, holdFit: false,
    tapSides: null, onSide: null, tapAngles: null, onAngle: null,
    eq: createBoard(), eqFn: null, eqRoom: { v: 0, t: 0 }, input: null, choice: null,
    acts: [], act: null, tick: null, timers: [], vis, labs: [], labD: {}, walkTex: null,
    drag: null, touch: false, moved: 0, got: new Set(), vals: {}, keyRows: null, touched: null, flashGood: 0, note: null,
  }
}

// ── shapes ───────────────────────────────────────────────────────────────

export const shapeOf = (S: Scene, id: string) => S.shapes.find(s => s.id === id)

/** Which way a prism goes back, in the world, for each unit of depth (drawn at half length, as the papers draw them). */
export const BACK: Vec = [0.5 * Math.cos(40 * RAD), 0.5 * Math.sin(40 * RAD)]

/** A corner in the world, as drawn or as it will be. "B'" is B's copy on a prism's back face. */
export function at(sh: Shape, n: string, drawn = true): Vec {
  const P = drawn ? sh.D : sh.pose
  if (n.endsWith("'")) {
    const f = at(sh, n.slice(0, -1), drawn), L = (sh.depth ?? 0) * P.k
    return [f[0] + BACK[0] * L, f[1] + BACK[1] * L]
  }
  return localAt(sh, sh.pts[n], drawn)
}
/** Any point in a shape's own coordinates, in the world. */
export function localAt(sh: Shape, l: Vec, drawn = true): Vec {
  const P = drawn ? sh.D : sh.pose
  const x = l[0] * P.sx * P.flip * P.k, y = l[1] * P.k
  const c = Math.cos(P.rot * RAD), s = Math.sin(P.rot * RAD)
  return [P.x + c * x - s * y, P.y + s * x + c * y]
}
/** Every corner of a shape, a prism's back ones too. */
export const cornersOf = (sh: Shape) => (sh.depth ? [...sh.order, ...sh.order.map(n => n + "'")] : sh.order)
/** A corner on the screen. */
export const atS = (S: Scene, sh: Shape, n: string, drawn = true) => toScreen(S, at(sh, n, drawn), drawn)
/** A corner of a shape by id, on the screen ("ABC:A"). */
export function ptS(S: Scene, key: string): Vec {
  const [id, n] = key.split(":")
  const sh = shapeOf(S, id)
  return sh ? atS(S, sh, n) : [0, 0]
}

/** The corners on either side of a corner, in order round the shape. */
function neighbours(sh: Shape, n: string): [string, string] {
  const i = sh.order.indexOf(n), m = sh.order.length
  return [sh.order[(i + m - 1) % m], sh.order[(i + 1) % m]]
}

/** The angle at a corner, degrees (as drawn). */
export function angleAt(sh: Shape, n: string, drawn = true): number {
  const [p, q] = neighbours(sh, n)
  const C = at(sh, n, drawn), a = sub(at(sh, p, drawn), C), b = sub(at(sh, q, drawn), C)
  return Math.acos(clamp(dot(a, b) / Math.max(1e-9, Math.hypot(...a) * Math.hypot(...b)), -1, 1)) * DEG
}
/** A side's length in the world (as drawn). */
export const sideLen = (sh: Shape, a: string, b: string, drawn = true) => dist(at(sh, a, drawn), at(sh, b, drawn))

/** A number for the board: never made to look whole when it is not. */
export function numText(x: number, d = 1): string {
  if (Math.abs(x - Math.round(x)) < 1e-6) return String(Math.round(x))
  const trim = (t: string) => t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
  for (let k = d; k <= 6; k++) {
    const t = trim(x.toFixed(k))
    if (t.includes(".")) return t
  }
  return String(Math.round(x))
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  eqY: number
  eqSize: number
  chipsY: number
  barsY: number
  keypadTop: number
  lineY: number
  lineSize: number
  labelSize: number
  midX: number
  eqW: number
  keypadCx?: number
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
  const rows = S.keyRows?.length ?? 2
  const cols = S.keyRows ? Math.max(...S.keyRows.map(r => r.length)) : 6
  const padH = rows * 46 + (rows - 1) * 8
  const beside = on(S, "keypad") && w >= 960
  const side = compact ? 16 : 28
  let midX = w / 2, eqW = w, keypadCx: number | undefined
  if (beside) {
    const padW = cols * 46 + (cols - 1) * 8
    const x1 = w - side - 12, x0 = x1 - padW
    keypadCx = (x0 + x1) / 2
    keypadTop = y - padH - 4
    midX = (side + x0 - 36) / 2
    eqW = x0 - 36 - side
  } else if (on(S, "keypad")) { y -= padH + 14; keypadTop = y }
  let lineY = y
  if (S.walkTex) { lineY = y - lineSize * 0.9; y -= lineSize * 2.2 }
  let chipsY = y
  if (on(S, "chips")) { chipsY = y - 26; y -= 62 }
  let eqY = y
  if (on(S, "eq")) { const band = Math.max(eqSize * 3.2, S.eqRoom.v); eqY = y - band / 2; y -= band }
  let barsY = y
  if (on(S, "bars") && S.bars) { const band = S.bars.length * (compact ? 34 : 42) + 16; barsY = y - band; y -= band }
  const least = on(S, "keypad") ? 110 : 160
  const board: Rect = { x0: side, x1: beside ? side + eqW : w - side, y0: phraseBottom + 10, y1: Math.max(phraseBottom + least, y - 6) }
  return { compact, phraseBottom, board, eqY, eqSize, chipsY, barsY, keypadTop, lineY, lineSize, labelSize: compact ? 16 : 20, midX, eqW, keypadCx }
}

export function resize(S: Scene, w: number, h: number) { S.w = w; S.h = h }

/** The view: the frame (or every shape, drawn and where it is going) with room for labels, filling the board. */
function fitFor(S: Scene, L: Layout) {
  const b = L.board
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  const take = (p: Vec) => { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]) }
  if (S.frame) { take([S.frame.x0, S.frame.y0]); take([S.frame.x1, S.frame.y1]) }
  else for (const sh of S.shapes) for (const n of cornersOf(sh)) { take(at(sh, n, false)); take(at(sh, n, true)) }
  if (!isFinite(x0)) return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, u: 30, c: [0, 0] as Vec }
  // a frame already leaves room round its shapes
  const pad = L.labelSize * (S.frame ? 1.2 : 2.6)
  const W = b.x1 - b.x0 - 2 * pad, H = b.y1 - b.y0 - 2 * pad
  const u = Math.max(0.02, Math.min(W / Math.max(1e-6, x1 - x0), H / Math.max(1e-6, y1 - y0)))
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, u, c: [(x0 + x1) / 2, (y0 + y1) / 2] as Vec }
}

export function toScreen(S: Scene, p: Vec, drawn = true): Vec {
  const f = (drawn ? S.fitD : S.fit) ?? S.fit
  if (!f) return [0, 0]
  return [f.cx + (p[0] - f.c[0]) * f.u, f.cy - (p[1] - f.c[1]) * f.u]
}
export function toWorld(S: Scene, q: Vec): Vec {
  const f = S.fitD ?? S.fit
  if (!f) return [0, 0]
  return [f.c[0] + (q[0] - f.cx) / f.u, f.c[1] - (q[1] - f.cy) / f.u]
}

// ── labels ───────────────────────────────────────────────────────────────

/** Roughly how wide a short label is. */
export function labelWidth(tex: string, size: number): number {
  const seen = tex.replace(/\\text\{([^}]*)\}/g, "$1").replace(/\\circ/g, "o").replace(/\\times/g, "x").replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_\\ ]/g, "")
  return seen.length * size * 0.52
}

/** The middle of a shape on the screen. */
function middleS(S: Scene, sh: Shape): Vec {
  const P = cornersOf(sh).map(n => atS(S, sh, n))
  return [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]
}

/** An angle mark's arc radius at a corner (the arcs nest outward for a second and third). */
export function markRadius(S: Scene, sh: Shape, n: string): number {
  const [p, q] = neighbours(sh, n)
  const C = atS(S, sh, n)
  return Math.max(10, Math.min(28, dist(C, atS(S, sh, p)) * 0.22, dist(C, atS(S, sh, q)) * 0.22))
}

/** A side's middle on the screen and its normal pointing out of the shape. */
function sideOut(S: Scene, sh: Shape, a: string, b: string): { m: Vec; n: Vec } {
  const A = atS(S, sh, a), B = atS(S, sh, b), m = lerpV(A, B, 0.5)
  const d = sub(B, A), l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (dot(n, sub(middleS(S, sh), m)) > 0) n = mul(n, -1)
  return { m, n }
}
/** How far along a normal a label's centre must sit for its box to clear a point. */
const clearBy = (n: Vec, w: number, h: number) => Math.abs(n[0]) * w / 2 + Math.abs(n[1]) * h / 2

/** Where a side's label goes: outside the shape by its middle, clear by its own size. */
function sideLabelAt(S: Scene, sh: Shape, a: string, b: string, size: number, tex: string): Vec {
  const { m, n } = sideOut(S, sh, a, b)
  const w = labelWidth(tex, size)
  // a mug's bottom is curved: its label goes below the curve
  const curve = sh.mug && [a, b].sort().join("") === "AB" ? dist(atS(S, sh, a), atS(S, sh, b)) * 0.14 : 0
  return add(m, mul(n, Math.max(size * 0.8, Math.abs(n[0]) * (w / 2 + 8) + Math.abs(n[1]) * size * 0.7) + curve))
}
/** A side's tag ("×2"): further out than its label, clear of it. */
function sideTagAt(S: Scene, sh: Shape, a: string, b: string, size: number, tex: string, tagSize: number, tag: string): Vec {
  const { n } = sideOut(S, sh, a, b)
  const main = sideLabelAt(S, sh, a, b, size, tex)
  return add(main, mul(n, clearBy(n, labelWidth(tex, size), size * 1.1) + clearBy(n, labelWidth(tag, tagSize), tagSize * 1.1) + 4))
}

/** Where an angle's label goes: along its bisector, past its arcs. */
function angleLabelAt(S: Scene, sh: Shape, n: string, count: number, size: number, tex: string): Vec {
  const [p, q] = neighbours(sh, n)
  const C = atS(S, sh, n), u1 = sub(atS(S, sh, p), C), u2 = sub(atS(S, sh, q), C)
  const n1 = mul(u1, 1 / (Math.hypot(...u1) || 1)), n2 = mul(u2, 1 / (Math.hypot(...u2) || 1))
  let bis = add(n1, n2)
  const bl = Math.hypot(...bis)
  bis = bl < 1e-6 ? [-n1[1], n1[0]] : mul(bis, 1 / bl)
  const half = Math.acos(clamp(dot(n1, n2), -1, 1)) / 2
  const need = (labelWidth(tex, size) * 0.5 + 5) / Math.max(0.25, Math.sin(half))
  const r = markRadius(S, sh, n) + (count - 1) * 5
  return add(C, mul(bis, Math.min(Math.max(r + size * 0.95, need), r + size * 3.2)))
}

const sideKey = (sh: string, a: string, b: string) => `${sh}:${[a, b].sort().join("")}`
export { sideKey }

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  if (S.vis.letters.v > 0.01) {
    for (const sh of S.shapes) {
      if (sh.ghost) continue
      const mid = middleS(S, sh)
      for (const n of sh.order) {
        const tex = sh.names[n]
        if (!tex) continue
        const p = atS(S, sh, n), d = sub(p, mid), l = Math.hypot(d[0], d[1]) || 1
        out.push({ key: `L-${sh.id}:${n}`, tex, col: CHALK, at: add(p, mul(d, (size * 0.95 + 4) / l)), size: size + 1, op: S.vis.letters.v * (sh.quiet ? 0.45 : 1) })
      }
    }
  }
  if (S.vis.sides.v > 0.01) {
    for (const s of S.sideLabs) {
      const sh = shapeOf(S, s.sh)
      if (!sh) continue
      out.push({ key: `S-${sideKey(s.sh, s.a, s.b)}`, tex: s.tex, col: s.col ?? CHALK, at: sideLabelAt(S, sh, s.a, s.b, size, s.tex), size, op: S.vis.sides.v * (sh.quiet ? 0.45 : 1), pulse: s.pulse })
      if (s.tag) out.push({ key: `T-${sideKey(s.sh, s.a, s.b)}`, tex: s.tag, col: BLUE, at: sideTagAt(S, sh, s.a, s.b, size, s.tex, size - 2, s.tag), size: size - 2, op: S.vis.sides.v })
    }
  }
  if (S.vis.sides.v > 0.01) {
    for (const l of S.inLabs) {
      const sh = shapeOf(S, l.sh)
      if (!sh) continue
      const P = sh.order.map(n => atS(S, sh, n))
      // beside a shape too small to hold it (at a point in its own coordinates), or in its middle
      const c: Vec = l.loc ? toScreen(S, localAt(sh, l.loc)) : [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length + (l.dy ?? 0) * size]
      out.push({ key: `I-${l.sh}`, tex: l.tex, col: l.col ?? CHALK, at: c, size: size + 2, op: S.vis.sides.v, pulse: l.pulse })
    }
  }
  if (S.vis.marks.v > 0.01) {
    for (const m of S.marks) {
      const sh = shapeOf(S, m.sh)
      if (!sh || !m.tex) continue
      out.push({ key: `A-${m.sh}:${m.at}`, tex: m.tex, col: m.col ?? CHALK, at: angleLabelAt(S, sh, m.at, m.count, size, m.tex), size, op: S.vis.marks.v * (sh.quiet ? 0.45 : 1), pulse: m.pulse })
    }
  }
  return out
}

// ── animation ────────────────────────────────────────────────────────────

function runActs(S: Scene) {
  for (let guard = 0; guard < 8; guard++) {
    if (!S.act) {
      const a = S.acts.shift()
      if (!a) return
      S.act = { a, t0: S.time }
      a.begin?.(S)
    }
    const { a, t0 } = S.act
    const t = clamp((S.time - t0) / Math.max(0.01, a.dur), 0, 1)
    a.run?.(S, t * t * (3 - 2 * t), t)
    if (t < 1) return
    S.act = null
    a.end?.(S)
  }
}
export const acting = (S: Scene) => !!S.act || S.acts.length > 0

/** The short way round from one turn to another (degrees). */
const turnDiff = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  S.eqRoom.v += (S.eqRoom.t - S.eqRoom.v) * k(0.12)
  runActs(S)
  S.tick?.(S)

  // each shape eases to where it is going (at once under a finger)
  const held = S.drag?.kind === "handle" ? S.handles.find(h => h.id === (S.drag as { id: string }).id)?.sh : null
  for (const sh of S.shapes) {
    const f = sh.id === held ? 1 : k(0.12)
    const A = sh.D, B = sh.pose
    A.x += (B.x - A.x) * f; A.y += (B.y - A.y) * f
    A.rot += turnDiff(A.rot, B.rot) * f
    A.k += (B.k - A.k) * f; A.sx += (B.sx - A.sx) * f
    A.flip = B.flip
  }

  const L = layout(S)
  if (!S.holdFit || !S.fit) S.fit = fitFor(S, L)
  if (!S.fitD) S.fitD = { ...S.fit, c: [...S.fit.c] as Vec }
  const ff = k(0.1)
  const Fd = S.fitD, F = S.fit
  S.fitD = { cx: Fd.cx + (F.cx - Fd.cx) * ff, cy: Fd.cy + (F.cy - Fd.cy) * ff, u: Fd.u + (F.u - Fd.u) * ff, c: lerpV(Fd.c, F.c, ff) }

  let node = S.eqFn ? S.eqFn(S) : null
  let size = L.eqSize
  const fits = (n: ENode, sz: number) => extent(n, sz).w <= L.eqW - 32
  if (node) while (size > 14 && !fits(node, size)) size -= 1
  if (node && !fits(node, size)) node = row([node])
  if (node) { const e = extent(node, size); S.eqRoom.t = e.up + e.down + size * 1.1 } else S.eqRoom.t = 0
  S.eq.size = size
  S.eq.cx = L.midX
  S.eq.cy = L.eqY
  eqSet(S.eq, node, S.eq.goneTo)
  eqStep(S.eq, dt)

  S.labs = computeLabels(S, L)
  const fl = k(S.drag ? 0.6 : 0.2)
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
  for (const key of VIS_KEYS) S.vis[key].t = keys.includes(key) ? 1 : 0
}
export function later(S: Scene, seconds: number, fn: (S: Scene) => void) {
  S.timers.push({ at: S.time + seconds, fn })
}
export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

/** Clear everything a beat sets. Shapes the next board keeps (same id) glide from where they were. */
export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drag = null
  S.marks = []
  S.sideLabs = []
  S.inLabs = []
  S.sideCol = {}
  S.sideGlow = new Set()
  S.arrows = []
  S.lines = []
  S.bars = null
  S.handles = []
  S.snapped = null
  S.locked = new Set()
  S.frame = null
  S.holdFit = false
  S.tapSides = null
  S.onSide = null
  S.tapAngles = null
  S.onAngle = null
  S.eqFn = null
  S.eq.goneTo = {}
  S.eq.goneFade = {}
  S.eq.slow = null
  S.input = null
  S.choice = null
  S.acts = []
  S.act = null
  S.tick = null
  S.timers = []
  S.walkTex = null
  S.moved = 0
  S.got = new Set()
  S.vals = {}
  S.keyRows = null
  S.touched = null
  S.note = null
}

/**
 * Put shapes on the board. A shape already there with the same id keeps its
 * drawn pose, so it glides to the new one; a new shape starts where it is
 * going (or `from`, to come in from somewhere).
 */
export function setShapes(S: Scene, shapes: (Omit<Shape, "D"> & { from?: Pose })[]) {
  const old = new Map(S.shapes.map(s => [s.id, s]))
  S.shapes = shapes.map(s => {
    const was = old.get(s.id)
    const D = was ? { ...was.D } : { ...(s.from ?? s.pose) }
    const { from: _from, ...rest } = s
    void _from
    return { ...rest, pose: { ...s.pose }, D }
  })
}

export function startInput(S: Scene, spec: Omit<CalcInput, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

/** The answer box, for an equation's tail. */
export function boxNode(S: Scene): ENode {
  const inp = S.input
  return { k: "box", id: "box", tex: inp ? calcTex(inp.value) : "", state: inp?.state ?? "idle", wrongAt: inp?.wrongAt ?? -9 }
}

export function choose(S: Scene, options: string[], answer: number, guess = true, onPick?: (S: Scene, k: number, right: boolean) => void) {
  S.choice = { options, answer, picked: null, state: "idle", wrongAt: -9, guess, onPick }
}

export function pick(S: Scene, k: number) {
  const ch = S.choice
  if (!ch || ch.state === "right" || (ch.guess && ch.picked !== null)) return
  ch.picked = k
  if (k === ch.answer) {
    ch.state = "right"
    if (ch.onPick) ch.onPick(S, k, true)
    else say(S, ch.guess ? "Spot on." : "Yes.", "calm", 2.4)
    return
  }
  if (ch.guess) { ch.state = "wrong"; say(S, "Let's see.", "calm", 2.4); ch.onPick?.(S, k, false); return }
  ch.state = "wrong"
  ch.wrongAt = S.time
  ch.onPick?.(S, k, false)
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 34 : 24)

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

export function inPoly(p: Vec, P: Vec[]): boolean {
  let inside = false
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, yi] = P[i], [xj, yj] = P[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Where a handle sits on the screen. */
export function handleAt(S: Scene, h: Handle): Vec {
  const sh = shapeOf(S, h.sh)!
  if (h.kind === "move") return middleS(S, sh)
  return atS(S, sh, h.at)
}

/** Where on the screen a tap on an angle aims: a little inside the corner. */
export function angleSpot(S: Scene, key: string): Vec {
  const [id, n] = key.split(":")
  const sh = shapeOf(S, id)!
  const [p, q] = neighbours(sh, n)
  const C = atS(S, sh, n), u1 = sub(atS(S, sh, p), C), u2 = sub(atS(S, sh, q), C)
  const b = add(mul(u1, 1 / (Math.hypot(...u1) || 1)), mul(u2, 1 / (Math.hypot(...u2) || 1)))
  const bl = Math.hypot(...b) || 1
  return add(C, mul(b, (markRadius(S, sh, n) + 8) / bl))
}
/** The middle of a side on the screen. */
export function sideSpot(S: Scene, key: string): Vec {
  const [id, ab] = key.split(":")
  const sh = shapeOf(S, id)!
  return lerpV(atS(S, sh, ab[0]), atS(S, sh, ab[1]), 0.5)
}

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const t = tol(S)
  // a handle on a corner first, then a shape to move
  let best: Handle | null = null, bd = Infinity
  for (const h of S.handles) {
    if (S.locked.has(h.id) || h.kind === "move") continue
    const d = dist(p, handleAt(S, h))
    if (d < bd) { bd = d; best = h }
  }
  if (best && bd < t + 14) { S.drag = { kind: "handle", id: best.id, off: sub(handleAt(S, best), p), grab: 0, moved: 0 }; S.holdFit = true; return true }
  for (const h of S.handles) {
    if (S.locked.has(h.id) || h.kind !== "move") continue
    const sh = shapeOf(S, h.sh)!
    if (inPoly(p, sh.order.map(n => atS(S, sh, n)))) { S.drag = { kind: "handle", id: h.id, off: sub(toScreen(S, [sh.pose.x, sh.pose.y]), p), grab: 0, moved: 0, home: [sh.pose.x, sh.pose.y] }; S.holdFit = true; return true }
  }
  S.drag = { kind: "pan", start: p, moved: 0 }
  return true
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  if (d.kind === "pan") { d.moved = Math.max(d.moved, dist(p, d.start)); return }
  const h = S.handles.find(x => x.id === d.id)
  const sh = h && shapeOf(S, h.sh)
  if (!h || !sh) return
  d.moved += 1
  const P = sh.pose
  const O: Vec = [P.x, P.y]
  const w = toWorld(S, p)
  const before = { ...P }
  S.snapped = null
  if (h.kind === "scale") {
    // the finger's distance from the shape's origin sets the scale factor
    const l = Math.hypot(sh.pts[h.at][0] * P.sx, sh.pts[h.at][1]) || 1
    let k = clamp(dist(w, O) / l, h.min ?? 0.4, h.max ?? 3)
    const near = h.snap?.find(v => Math.abs(v - k) < 0.07)
    if (near !== undefined) { k = near; S.snapped = { id: h.id, v: near } }
    P.k = k
  } else if (h.kind === "stretch") {
    // the finger along the shape's own x axis sets the stretch
    const ex: Vec = [Math.cos(P.rot * RAD), Math.sin(P.rot * RAD)]
    const lx = sh.pts[h.at][0] * P.flip * P.k || 1
    let sx = clamp(dot(sub(w, O), ex) / lx, h.min ?? 0.5, h.max ?? 2.5)
    const near = h.snap?.find(v => Math.abs(v - sx) < 0.06)
    if (near !== undefined) { sx = near; S.snapped = { id: h.id, v: near } }
    P.sx = sx
  } else if (h.kind === "turn") {
    // the corner follows the finger round the origin
    const l = sh.pts[h.at]
    const own = Math.atan2(l[1], l[0] * P.flip * P.sx) * DEG
    let rot = Math.atan2(w[1] - O[1], w[0] - O[0]) * DEG - own
    rot = ((rot % 360) + 360) % 360
    const near = h.snap?.find(v => Math.abs(turnDiff(rot, v)) < 7)
    if (near !== undefined) { rot = near; S.snapped = { id: h.id, v: near } }
    P.rot = rot
  } else if (h.kind === "move") {
    const q = toWorld(S, add(p, d.off))
    P.x = q[0]; P.y = q[1]
    if (h.place && dist(toScreen(S, h.place), toScreen(S, q)) < (S.touch ? 40 : 30)) { P.x = h.place[0]; P.y = h.place[1]; S.snapped = { id: h.id, v: 1 } }
  }
  S.moved += Math.abs(P.k - before.k) * 200 + Math.abs(P.sx - before.sx) * 200 + Math.abs(turnDiff(before.rot, P.rot)) * 2 + Math.hypot(P.x - before.x, P.y - before.y) * (S.fitD?.u ?? 30)
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  S.holdFit = false
  if (d.kind === "pan") { if (d.moved <= 10) tapAt(S, d.start); return }
  const h = S.handles.find(x => x.id === d.id)
  if (h && S.snapped && S.snapped.id === h.id && h.lock) { S.locked.add(h.id); S.flashGood = 1; S.touched = h.sh; return }
  // a shape carried towards a place and let go short of it slides back to where it was
  const sh = h && shapeOf(S, h.sh)
  if (h?.kind === "move" && h.place && d.home && sh) { sh.pose.x = d.home[0]; sh.pose.y = d.home[1] }
}

function tapAt(S: Scene, p: Vec) {
  if (S.mode === "tapSide" && S.tapSides) {
    let best: string | null = null, bd = Infinity
    for (const key of S.tapSides) {
      const [id, ab] = key.split(":")
      const sh = shapeOf(S, id)
      if (!sh) continue
      const dd = Math.min(distToSeg(p, atS(S, sh, ab[0]), atS(S, sh, ab[1])), S.labD[`S-${sideKey(id, ab[0], ab[1])}`] ? dist(p, S.labD[`S-${sideKey(id, ab[0], ab[1])}`]) : Infinity)
      if (dd < bd) { bd = dd; best = key }
    }
    if (best && bd < tol(S)) S.onSide?.(S, best)
    return
  }
  if (S.mode === "tapAngle" && S.tapAngles) {
    let best: string | null = null, bd = Infinity
    for (const key of S.tapAngles) {
      const dd = Math.min(dist(p, angleSpot(S, key)), S.labD[`A-${key}`] ? dist(p, S.labD[`A-${key}`]) : Infinity)
      if (dd < bd) { bd = dd; best = key }
    }
    if (best && bd < tol(S) + 16) S.onAngle?.(S, best)
  }
}

// ── typed answers ────────────────────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "go") { check(S); return }
  if ((inp.state === "wrong" || inp.fresh) && key !== "back") inp.value = ""
  inp.fresh = false
  inp.value = calcType(inp.value, key, inp.max ?? 12)
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const { verdict, v } = judge(inp.value, inp.answer, { sf: inp.sf, dp: inp.dp })
  if (verdict === "unfinished") { say(S, "That calculation is not finished.", "calm", 2.6); return }
  if (verdict === "rough") { inp.fresh = true; say(S, inp.sf ? `Nearly. Give it to $${inp.sf}$ significant figures.` : `Nearly. Give it to $${inp.dp ?? 1}$ decimal place${(inp.dp ?? 1) > 1 ? "s" : ""}.`, "calm", 3.4); return }
  if (verdict === "right") {
    inp.state = "right"
    S.note = null
    S.touched = "eq"
    S.flashGood = 1
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  const slip = v !== null ? inp.slips?.find(s => slipMatches(inp.value, v, s.v)) : undefined
  if (slip) say(S, slip.say, "wrong", 4.5)
}

export { dist, lerpV, clamp, add, sub, mul, dot, RAD, DEG }
