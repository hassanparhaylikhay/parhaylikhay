/**
 * The board for geometrical terms (4.1): named points that ease to where
 * they are told, with lines, shapes and a circle drawn between them.
 *
 * World: x right, y up, in grid units. Every line, side and shape refers to
 * points by name, so moving a point moves everything on it. A point has
 * `p` (where it is) and `D` (where it is drawn, easing to p; at once under a
 * finger).
 *
 * The student can: drag a corner (freely, onto grid points, or clicking
 * into a special triangle), turn a line about a point, slide a line, draw a
 * line from a point to the circle's edge, tap a shape, side, region or arc,
 * pick a word, and add or take away sides. A shape with `marks` shows its
 * equal sides (ticks), parallel sides (arrows) and right angles (squares),
 * worked out from where its corners are.
 */

import { type Vec, type Rect, add, sub, mul, dot, cross, dist, lerpV, clamp, unit, len } from "../geometry"
import { createBoard, eqSet, eqStep, extent, row, type EqBoard, type ENode } from "../equation"

export const CHALK = "#e8e6e0"
export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const QUIET = "#7a7875"
export const BG = "#0d1216"

const RAD = Math.PI / 180, DEG = 180 / Math.PI

// ── what a board holds ───────────────────────────────────────────────────

type Spring = { v: number; t: number }

export type VisKey = "board" | "grid" | "shapes" | "letters" | "marks" | "labels" | "eq" | "keypad" | "chips" | "stepper" | "hint" | "line"
const VIS_KEYS: VisKey[] = ["board", "grid", "shapes", "letters", "marks", "labels", "eq", "keypad", "chips", "stepper", "hint", "line"]

export interface Pt { p: Vec; D: Vec }

/** A shape through named points. `marks`: its equal sides, parallel sides and right angles show. `lens`: each side's length. */
export interface Poly { id: string; pts: string[]; marks?: boolean | "ticks"; lens?: boolean; fill?: string; fillOp?: number; col?: string; ghost?: boolean; glow?: string; lit?: boolean }
/** A straight line between two points (`ext`: carried on past both, to the edge of the board, as a line goes on for ever). */
export interface Seg { id: string; a: string; b: string; ext?: boolean; col?: string; w?: number; dash?: boolean; glow?: boolean; arrows?: number; ticks?: number }
export interface Dot { pt: string; col?: string; r?: number; pulse?: boolean }
/** A right-angle square at a point, between its lines to two other points. */
export interface Sq { at: string; a: string; b: string; col?: string; pulse?: boolean }
/** A region shaded: a sector or segment of the circle (angles in degrees, anticlockwise from a1 to a2), or a shape. */
export interface Shade { id: string; kind: "sector" | "segment" | "poly"; a1?: number; a2?: number; pts?: string[]; col: string; op?: number; pulse?: boolean }
/** Part of the circle's edge, anticlockwise from a1 to a2 (degrees). */
export interface ArcEl { id: string; a1: number; a2: number; col: string; w?: number; glow?: boolean }
/** A label at a point (by name or in the world), nudged in pixels. */
export interface FreeLab { key: string; at: string | Vec; tex: string; col?: string; size?: number; dx?: number; dy?: number; pulse?: boolean }

export type Handle =
  | { id: string; kind: "point"; pt: string; grid?: boolean; snap?: (S: Scene, q: Vec) => Vec | null; ok?: (S: Scene) => boolean; lock?: boolean }
  | { id: string; kind: "turn"; pivot: string; pts: string[]; grab: string; snaps?: number[]; lock?: boolean }
  | { id: string; kind: "slide"; pts: string[]; grab: string; dir: Vec; min: number; max: number; snaps?: number[]; lock?: boolean }
  | { id: string; kind: "draw"; from: string; accept: (S: Scene, end: Vec) => { ok: boolean; note?: string; to?: Vec }; then: (S: Scene, to: Vec) => void }

/** Something to tap: how far a screen point is from it (Infinity: a miss), and where a test should tap it. */
export interface Tap { id: string; hit: (S: Scene, p: Vec) => number; spot: (S: Scene) => Vec }

export interface Lab { key: string; tex: string; col: string; at: Vec; size: number; op: number; pulse?: boolean }
export interface Act { dur: number; begin?: (S: Scene) => void; run?: (S: Scene, e: number, t: number) => void; end?: (S: Scene) => void }

export type Drag =
  | { kind: "handle"; id: string; off: Vec; start: Vec; base?: Record<string, Vec>; t0?: number; moved: number }
  | { kind: "draw"; id: string; end: Vec; moved: number }
  | { kind: "pan"; start: Vec; moved: number }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number

  pts: Record<string, Pt>
  names: Record<string, string>
  /** where a point's letter is pushed away from (a point's name or a world point) */
  nameFrom: Record<string, string | Vec>
  polys: Poly[]
  segs: Seg[]
  circle: { c: string; r: number } | null
  arcs: ArcEl[]
  shades: Shade[]
  dots: Dot[]
  squares: Sq[]
  freeLabs: FreeLab[]
  grid: { x0: number; x1: number; y0: number; y1: number; axes?: boolean; dotted?: boolean } | null
  /** the world rect the view keeps in room */
  frame: Rect
  fit: { cx: number; cy: number; u: number; c: Vec } | null
  fitD: { cx: number; cy: number; u: number; c: Vec } | null

  handles: Handle[]
  snapped: string | null
  locked: Set<string>
  taps: Tap[] | null
  onTap: ((S: Scene, id: string) => void) | null

  eq: EqBoard
  eqFn: ((S: Scene) => ENode | null) | null
  eqRoom: Spring
  choice: { options: string[]; answer: number; picked: number | null; state: "idle" | "wrong" | "right"; wrongAt: number; onPick?: (S: Scene, k: number, right: boolean) => void } | null
  /** the − / + sides stepper */
  stepper: { n: number; min: number; max: number; onStep: (S: Scene, n: number) => void } | null
  input: { state: string; tries: number; value: string } | null

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
  moved: number
  got: Set<string>
  vals: Record<string, number>
  touched: string | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0,
    pts: {}, names: {}, nameFrom: {}, polys: [], segs: [], circle: null, arcs: [], shades: [], dots: [], squares: [], freeLabs: [], grid: null,
    frame: { x0: -5, y0: -4, x1: 5, y1: 4 }, fit: null, fitD: null,
    handles: [], snapped: null, locked: new Set(), taps: null, onTap: null,
    eq: createBoard(), eqFn: null, eqRoom: { v: 0, t: 0 }, choice: null, stepper: null, input: null,
    acts: [], act: null, tick: null, timers: [], vis, labs: [], labD: {}, walkTex: null,
    drag: null, touch: false, moved: 0, got: new Set(), vals: {}, touched: null, flashGood: 0, note: null,
  }
}

// ── points ───────────────────────────────────────────────────────────────

export const P = (S: Scene, n: string): Vec => S.pts[n]?.p ?? [0, 0]
export const PD = (S: Scene, n: string): Vec => S.pts[n]?.D ?? [0, 0]

/** Put points on the board. A point already there glides to its new place; a new one starts there (or at `from`). */
export function place(S: Scene, pts: Record<string, Vec>, from?: Record<string, Vec>) {
  for (const [n, p] of Object.entries(pts)) {
    const was = S.pts[n]
    S.pts[n] = { p: [p[0], p[1]], D: was ? was.D : [...(from?.[n] ?? p)] as Vec }
  }
}
/** Only these points stay on the board (the rest are dropped). */
export function keepOnly(S: Scene, names: string[]) {
  for (const n of Object.keys(S.pts)) if (!names.includes(n)) delete S.pts[n]
}

// ── layout and view ──────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  eqY: number
  eqSize: number
  chipsY: number
  stepperY: number
  keypadTop: number
  lineY: number
  lineSize: number
  labelSize: number
  midX: number
  eqW: number
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
  if (on(S, "keypad")) { y -= 2 * 46 + 8 + 14; keypadTop = y }
  let stepperY = y
  if (on(S, "stepper")) { stepperY = y - 56; y -= 70 }
  const lineY = y
  let chipsY = y
  if (on(S, "chips")) { chipsY = y - 26; y -= 62 }
  let eqY = y
  if (on(S, "eq")) { const band = Math.max(eqSize * 2.4, S.eqRoom.v); eqY = y - band / 2; y -= band }
  const side = compact ? 16 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 10, y1: Math.max(phraseBottom + 160, y - 6) }
  return { compact, phraseBottom, board, eqY, eqSize, chipsY, stepperY, keypadTop, lineY, lineSize, labelSize: compact ? 16 : 20, midX: w / 2, eqW: w - 2 * side }
}

export function resize(S: Scene, w: number, h: number) { S.w = w; S.h = h }

function fitFor(S: Scene, L: Layout) {
  const b = L.board, f = S.frame
  const pad = L.labelSize * 1.4
  const W = b.x1 - b.x0 - 2 * pad, H = b.y1 - b.y0 - 2 * pad
  const u = Math.max(4, Math.min(W / Math.max(1e-6, f.x1 - f.x0), H / Math.max(1e-6, f.y1 - f.y0)))
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, u, c: [(f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2] as Vec }
}

export function toScreen(S: Scene, p: Vec): Vec {
  const f = S.fitD ?? S.fit
  if (!f) return [0, 0]
  return [f.cx + (p[0] - f.c[0]) * f.u, f.cy - (p[1] - f.c[1]) * f.u]
}
export function toWorld(S: Scene, q: Vec): Vec {
  const f = S.fitD ?? S.fit
  if (!f) return [0, 0]
  return [f.c[0] + (q[0] - f.cx) / f.u, f.c[1] - (q[1] - f.cy) / f.u]
}
/** A point on the screen, as drawn. */
export const ptS = (S: Scene, n: string) => toScreen(S, PD(S, n))
/** One world unit in pixels. */
export const unitPx = (S: Scene) => (S.fitD ?? S.fit)?.u ?? 30

// ── what a shape is ──────────────────────────────────────────────────────

const near0 = (x: number, scale: number) => Math.abs(x) <= 1e-4 * Math.max(1, scale)

/** A shape's sides (each from one corner to the next) as world vectors. */
function sidesOf(Q: Vec[]): Vec[] { return Q.map((a, i) => sub(Q[(i + 1) % Q.length], a)) }

/** Which sides are equal, which are parallel and where the right angles are, from the corners as they will be. */
export function marksOf(Q: Vec[]) {
  const s = sidesOf(Q), n = Q.length
  const L = s.map(len), scale = Math.max(...L) ** 2
  const group = (same: (i: number, j: number) => boolean) => {
    const g: number[] = Array(n).fill(0)
    let next = 1
    for (let i = 0; i < n; i++) {
      if (g[i]) continue
      const mates = [i]
      for (let j = i + 1; j < n; j++) if (!g[j] && same(i, j)) mates.push(j)
      if (mates.length > 1) { for (const m of mates) g[m] = next; next++ }
    }
    return g
  }
  const ticks = group((i, j) => near0(L[i] * L[i] - L[j] * L[j], scale))
  const arrows = group((i, j) => near0(cross(s[i], s[j]), scale))
  const rights = Q.map((_, i) => near0(dot(s[(i + n - 1) % n], s[i]), scale))
  return { ticks, arrows, rights }
}

/** The most exact name of a quadrilateral (corners in order). */
export function quadName(Q: Vec[]): string {
  if (Q.length !== 4) return ""
  const s = sidesOf(Q), L = s.map(v => dot(v, v)), scale = Math.max(...L)
  const eq = (a: number, b: number) => near0(a - b, scale)
  const par02 = near0(cross(s[0], s[2]), scale), par13 = near0(cross(s[1], s[3]), scale)
  const right = near0(dot(s[0], s[1]), scale)
  const allEq = eq(L[0], L[1]) && eq(L[1], L[2]) && eq(L[2], L[3])
  if (par02 && par13) {
    if (allEq) return right ? "square" : "rhombus"
    return right ? "rectangle" : "parallelogram"
  }
  if ((eq(L[0], L[1]) && eq(L[2], L[3])) || (eq(L[1], L[2]) && eq(L[3], L[0]))) return "kite"
  if (par02 || par13) return "trapezium"
  return "quadrilateral"
}

/** A triangle's name by its sides, and whether it has a right angle. */
export function triName(Q: Vec[]): { sides: "equilateral" | "isosceles" | "scalene"; right: boolean } {
  const { ticks, rights } = marksOf(Q)
  const same = ticks.filter(t => t > 0).length
  return { sides: same === 3 ? "equilateral" : same === 2 ? "isosceles" : "scalene", right: rights.some(Boolean) }
}

/** A shape whose sides do not cross and whose corners are not in a straight line with their neighbours. */
export function simpleShape(Q: Vec[]): boolean {
  const n = Q.length
  for (let i = 0; i < n; i++) {
    const a = Q[(i + n - 1) % n], b = Q[i], c = Q[(i + 1) % n]
    if (Math.abs(cross(sub(b, a), sub(c, b))) < 1e-6) return false
    if (dist(a, b) < 1e-6) return false
  }
  const crosses = (p: Vec, q: Vec, r: Vec, s: Vec) => {
    const d1 = cross(sub(q, p), sub(r, p)), d2 = cross(sub(q, p), sub(s, p)), d3 = cross(sub(s, r), sub(p, r)), d4 = cross(sub(s, r), sub(q, r))
    return d1 * d2 < 0 && d3 * d4 < 0
  }
  for (let i = 0; i < n; i++) for (let j = i + 2; j < n; j++) {
    if (i === 0 && j === n - 1) continue
    if (crosses(Q[i], Q[(i + 1) % n], Q[j], Q[(j + 1) % n])) return false
  }
  return true
}

export const polyPts = (S: Scene, pl: Poly, drawn = false) => pl.pts.map(n => (drawn ? PD(S, n) : P(S, n)))
export const polyOf = (S: Scene, id: string) => S.polys.find(p => p.id === id)

// ── labels ───────────────────────────────────────────────────────────────

export function labelWidth(tex: string, size: number): number {
  const seen = tex.replace(/\\text\{([^}]*)\}/g, "$1").replace(/\\circ/g, "o").replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_\\ ]/g, "")
  return seen.length * size * 0.52
}

const centroidS = (S: Scene, names: string[]): Vec => {
  const Q = names.map(n => ptS(S, n))
  return [Q.reduce((s, p) => s + p[0], 0) / Q.length, Q.reduce((s, p) => s + p[1], 0) / Q.length]
}

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  // letters, pushed away from what they belong to
  if (S.vis.letters.v > 0.01) {
    for (const [n, tex] of Object.entries(S.names)) {
      if (!S.pts[n] || !tex) continue
      const p = ptS(S, n)
      const fromSpec = S.nameFrom[n]
      let from: Vec
      if (typeof fromSpec === "string") from = ptS(S, fromSpec)
      else if (fromSpec) from = toScreen(S, fromSpec)
      else {
        const pl = S.polys.find(q => q.pts.includes(n) && !q.ghost)
        from = pl ? centroidS(S, pl.pts) : S.circle ? ptS(S, S.circle.c) : [p[0] - 1, p[1] + 1]
      }
      let d = sub(p, from)
      if (len(d) < 1e-6) d = [1, -1]
      out.push({ key: `L-${n}`, tex, col: CHALK, at: add(p, mul(unit(d), size * 0.95 + 4)), size: size + 1, op: S.vis.letters.v })
    }
  }
  // side lengths
  if (S.vis.labels.v > 0.01) {
    for (const pl of S.polys) {
      if (!pl.lens || pl.ghost) continue
      const Q = pl.pts.map(n => ptS(S, n)), mid = centroidS(S, pl.pts)
      pl.pts.forEach((n, i) => {
        const a = Q[i], b = Q[(i + 1) % Q.length], m = lerpV(a, b, 0.5)
        const d = sub(b, a), l = len(d) || 1
        let nn: Vec = [-d[1] / l, d[0] / l]
        if (dot(nn, sub(mid, m)) > 0) nn = mul(nn, -1)
        const tex = numText(dist(P(S, n), P(S, pl.pts[(i + 1) % pl.pts.length])))
        const w = labelWidth(tex, size)
        out.push({ key: `S-${pl.id}:${i}`, tex, col: CHALK, at: add(m, mul(nn, Math.max(size * 0.8, Math.abs(nn[0]) * (w / 2 + 10) + Math.abs(nn[1]) * size * 0.75))), size, op: S.vis.labels.v })
      })
    }
    for (const f of S.freeLabs) {
      const p = typeof f.at === "string" ? ptS(S, f.at) : toScreen(S, f.at)
      out.push({ key: `F-${f.key}`, tex: f.tex, col: f.col ?? CHALK, at: [p[0] + (f.dx ?? 0), p[1] + (f.dy ?? 0)], size: f.size ?? size, op: S.vis.labels.v, pulse: f.pulse })
    }
  }
  return out
}

/** A length for the board, to 1 decimal place (a whole number without one). */
export function numText(x: number): string {
  const r = Math.round(x * 10) / 10
  return Math.abs(r - Math.round(r)) < 1e-9 ? String(Math.round(r)) : r.toFixed(1)
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

  // points ease to where they are going (at once under a finger)
  const held = new Set<string>()
  const d = S.drag
  if (d?.kind === "handle") {
    const h = S.handles.find(x => x.id === d.id)
    if (h?.kind === "point") held.add(h.pt)
    if (h?.kind === "turn" || h?.kind === "slide") for (const n of h.pts) held.add(n)
  }
  for (const [n, pt] of Object.entries(S.pts)) {
    const f = held.has(n) ? 1 : k(0.16)
    pt.D = [pt.D[0] + (pt.p[0] - pt.D[0]) * f, pt.D[1] + (pt.p[1] - pt.D[1]) * f]
  }

  const L = layout(S)
  S.fit = fitFor(S, L)
  if (!S.fitD) S.fitD = { ...S.fit, c: [...S.fit.c] as Vec }
  const ff = k(0.1), Fd = S.fitD, F = S.fit
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
  const fl = k(S.drag ? 0.6 : 0.22)
  const keep = new Set<string>()
  for (const l of S.labs) {
    keep.add(l.key)
    const dd = S.labD[l.key]
    S.labD[l.key] = dd ? lerpV(dd, l.at, fl) : [l.at[0], l.at[1]]
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
export function later(S: Scene, seconds: number, fn: (S: Scene) => void) { S.timers.push({ at: S.time + seconds, fn }) }
export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) { S.note = { text, until: S.time + seconds, tone } }

/** Clear everything a beat sets. Points stay, so the next board's points glide from where they were. */
export function resetBeat(S: Scene) {
  S.names = {}
  S.nameFrom = {}
  S.polys = []
  S.segs = []
  S.circle = null
  S.arcs = []
  S.shades = []
  S.dots = []
  S.squares = []
  S.freeLabs = []
  S.grid = null
  S.handles = []
  S.snapped = null
  S.locked = new Set()
  S.taps = null
  S.onTap = null
  S.eqFn = null
  S.eq.goneTo = {}
  S.choice = null
  S.stepper = null
  S.input = null
  S.acts = []
  S.act = null
  S.tick = null
  S.timers = []
  S.walkTex = null
  S.drag = null
  S.moved = 0
  S.got = new Set()
  S.vals = {}
  S.touched = null
  S.note = null
}

export function choose(S: Scene, options: string[], answer: number, onPick?: (S: Scene, k: number, right: boolean) => void) {
  S.choice = { options, answer, picked: null, state: "idle", wrongAt: -9, onPick }
}
export function pick(S: Scene, k: number) {
  const ch = S.choice
  if (!ch || ch.state === "right") return
  ch.picked = k
  if (k === ch.answer) { ch.state = "right"; ch.onPick?.(S, k, true); return }
  ch.state = "wrong"
  ch.wrongAt = S.time
  ch.onPick?.(S, k, false)
}

/** The − / + stepper moved: within its range, the beat redraws the shape. */
export function stepBy(S: Scene, d: number) {
  const st = S.stepper
  if (!st) return
  const n = clamp(st.n + d, st.min, st.max)
  if (n === st.n) return
  st.n = n
  st.onStep(S, n)
}

// ── the circle ───────────────────────────────────────────────────────────

/** A point on the circle at an angle (degrees, anticlockwise from the right). */
export function onCircle(S: Scene, deg: number): Vec {
  const c = P(S, S.circle!.c), r = S.circle!.r
  return [c[0] + r * Math.cos(deg * RAD), c[1] + r * Math.sin(deg * RAD)]
}
/** The angle of a world point seen from the circle's centre, 0 to 360. */
export function angleOn(S: Scene, w: Vec): number {
  const c = P(S, S.circle!.c)
  return (((Math.atan2(w[1] - c[1], w[0] - c[0]) * DEG) % 360) + 360) % 360
}
/** Whether an angle lies on the arc from a1 anticlockwise to a2. */
export function onArc(a: number, a1: number, a2: number): boolean {
  const span = (((a2 - a1) % 360) + 360) % 360
  return (((a - a1) % 360) + 360) % 360 <= span
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 36 : 26)

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}
export function inPoly(p: Vec, Q: Vec[]): boolean {
  let inside = false
  for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) {
    const [xi, yi] = Q[i], [xj, yj] = Q[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

/** Where a handle is held on the screen. */
export function handleAt(S: Scene, h: Handle): Vec {
  if (h.kind === "point") return ptS(S, h.pt)
  if (h.kind === "draw") return ptS(S, h.from)
  return ptS(S, h.grab)
}

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  let best: Handle | null = null, bd = Infinity
  for (const h of S.handles) {
    if (S.locked.has(h.id)) continue
    const d = dist(p, handleAt(S, h))
    if (d < bd) { bd = d; best = h }
  }
  if (best && bd < tol(S) + 14) {
    const w = toWorld(S, p)
    if (best.kind === "draw") { S.drag = { kind: "draw", id: best.id, end: w, moved: 0 }; return true }
    const off = sub(best.kind === "point" ? P(S, best.pt) : P(S, best.grab), w)
    const base: Record<string, Vec> = {}
    if (best.kind === "slide" || best.kind === "turn") for (const n of best.pts) base[n] = [...P(S, n)] as Vec
    S.drag = { kind: "handle", id: best.id, off, start: w, base, t0: best.kind === "slide" ? S.vals[`t-${best.id}`] ?? 0 : 0, moved: 0 }
    return true
  }
  S.drag = { kind: "pan", start: p, moved: 0 }
  return true
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  if (d.kind === "pan") { d.moved = Math.max(d.moved, dist(p, d.start)); return }
  const w = toWorld(S, p)
  if (d.kind === "draw") { d.end = w; d.moved += 1; return }
  const h = S.handles.find(x => x.id === d.id)
  if (!h) return
  d.moved += 1
  const f = S.frame
  if (h.kind === "point") {
    let q = add(w, d.off)
    q = [clamp(q[0], f.x0, f.x1), clamp(q[1], f.y0, f.y1)]
    if (h.grid) q = [Math.round(q[0]), Math.round(q[1])]
    const was = P(S, h.pt)
    S.snapped = null
    const s = h.snap?.(S, q)
    if (s) { q = s; S.snapped = h.id }
    S.pts[h.pt].p = q
    if (h.ok && !h.ok(S)) { S.pts[h.pt].p = was; S.snapped = null; return }
    S.moved += dist(was, q) * unitPx(S)
  } else if (h.kind === "turn") {
    const c = P(S, h.pivot), g0 = d.base![h.grab]
    const a0 = Math.atan2(g0[1] - c[1], g0[0] - c[0])
    let a = Math.atan2(w[1] - c[1], w[0] - c[0])
    // the line keeps its direction mod a half turn: snap the angle of the grabbed end
    S.snapped = null
    const deg = ((a * DEG) % 360 + 360) % 360
    const near = h.snaps?.find(v => Math.abs(((deg - v) % 360 + 540) % 360 - 180) < 5)
    if (near !== undefined) { a = near * RAD; S.snapped = h.id }
    const t = a - a0
    for (const n of h.pts) {
      const b = sub(d.base![n], c)
      S.pts[n].p = add(c, [b[0] * Math.cos(t) - b[1] * Math.sin(t), b[0] * Math.sin(t) + b[1] * Math.cos(t)])
    }
    S.moved += 2
  } else if (h.kind === "slide") {
    let t = clamp(d.t0! + dot(sub(w, d.start), h.dir), h.min, h.max)
    S.snapped = null
    const near = h.snaps?.find(v => Math.abs(v - t) * unitPx(S) < (S.touch ? 22 : 16))
    if (near !== undefined) { t = near; S.snapped = h.id }
    for (const n of h.pts) S.pts[n].p = add(d.base![n], mul(h.dir, t - d.t0!))
    S.vals[`t-${h.id}`] = t
    S.moved += 2
  }
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  if (d.kind === "pan") { if (d.moved <= 10) tapAt(S, d.start); return }
  if (d.kind === "draw") {
    const h = S.handles.find(x => x.id === d.id)
    if (!h || h.kind !== "draw") return
    const r = h.accept(S, d.end)
    if (r.ok) { h.then(S, r.to ?? d.end); S.locked.add(h.id); S.flashGood = 1 }
    else if (r.note) say(S, r.note, "wrong", 3.6)
    return
  }
  const h = S.handles.find(x => x.id === d.id)
  if (h && "lock" in h && h.lock && S.snapped === h.id) { S.locked.add(h.id); S.flashGood = 1 }
}

function tapAt(S: Scene, p: Vec) {
  if (!S.taps || !S.onTap) return
  let best: string | null = null, bd = Infinity
  for (const t of S.taps) {
    const d = t.hit(S, p)
    if (d < bd) { bd = d; best = t.id }
  }
  if (best !== null && bd < tol(S)) S.onTap(S, best)
}

export function typeKey(S: Scene, key: string) { void S; void key }

export { dist, lerpV, clamp, add, sub, mul, dot, cross, len, unit, RAD, DEG }
