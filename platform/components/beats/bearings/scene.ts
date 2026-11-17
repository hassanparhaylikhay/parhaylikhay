/**
 * The map board for bearings (4.3): places seen from above, North up the
 * screen. World: x east, y north (y up), in any unit; the view fits the
 * places it is told to keep in room. A bearing is an angle in degrees,
 * measured clockwise from North; on the screen North is up, so a bearing θ
 * points along (sin θ, −cos θ).
 *
 * What it can show: North arrows printed like the papers' (a line, an
 * arrowhead, the word North), the North line carried on down past a point
 * (dashed, for the angle at South), lines between places, a line from a
 * place the student turns (its bearing swept out clockwise from North in
 * blue), angle arcs anywhere, a marker that stands at a place and faces a
 * way (it turns and walks), a clock hand and a compass rose, and the bearing
 * on a three-digit display. Colours: North lines chalk, a bearing blue, a
 * half turn orange, an unknown pink, what the student can drag or tap
 * yellow, a right answer green.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp } from "../geometry"
import { createBoard, eqSet, eqStep, extent, row, type EqBoard, type ENode } from "../equation"
import { calcTex } from "../calc"

export const CHALK = "#e8e6e0"
export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const QUIET = "#7a7875"

// ── bearings ─────────────────────────────────────────────────────────────

/** A bearing kept in 0 to 360 (360 itself is 0). */
export const norm = (b: number) => ((b % 360) + 360) % 360
/** The turn from one bearing to another, the short way (−180 to 180). */
export const diff = (a: number, b: number) => ((((b - a) % 360) + 540) % 360) - 180
/** The way a bearing points, in the world (x east, y north). */
export const dirW = (b: number): Vec => [Math.sin((b * Math.PI) / 180), Math.cos((b * Math.PI) / 180)]
/** The bearing of one world point from another. */
export const brgOf = (from: Vec, to: Vec) => norm((Math.atan2(to[0] - from[0], to[1] - from[1]) * 180) / Math.PI)
/** A bearing as the exam writes it: three figures (072), or as a plain angle (72). */
export const brgText = (b: number, three = true) => {
  const n = Math.round(norm(b)) % 360
  return three ? String(n).padStart(3, "0") : String(n)
}

// ── what a board holds ───────────────────────────────────────────────────

type Spring = { v: number; t: number }

export type VisKey = "board" | "fig" | "letters" | "marks" | "readout" | "eq" | "keypad" | "chips" | "hint" | "line"
const VIS_KEYS: VisKey[] = ["board", "fig", "letters", "marks", "readout", "eq", "keypad", "chips", "hint", "line"]

/** A line between two places. */
export interface Seg { a: string; b: string; col?: string; dash?: boolean; grow: Spring; glow?: boolean; lab?: { tex: string; col?: string } }

/** A line out from a place on a bearing: `brg` is where it points, `d` where it is drawn (it turns there smoothly). */
export interface Ray {
  id: string
  at: string
  brg: number
  d: number
  /** its length in world units, or up to this place */
  len: number
  to?: string
  col?: string
  /** the student turns it by its end */
  handle?: boolean
  /** its bearing is swept out from North, with its value */
  arc?: boolean
  dash?: boolean
}

/** An angle at a place: from one bearing, turning clockwise through `sweep` degrees. */
export interface Arc {
  id: string
  at: string
  from: number
  sweep: number
  col: string
  tex?: string
  pulse?: boolean
  /** radius as a multiple of the usual */
  r?: number
  /** how it grows in (0 to 1) */
  grow?: Spring
}

/** A small arrowhead that stands somewhere and faces a way (a ship, or "you"). */
export interface Marker { id: string; at: Vec; heading: number; col?: string; ghost?: boolean; op?: number; size?: number }

/** A curved arrow round a marker: it turned from one heading to another. */
export interface Curl { at: string; from: number; to: number; col: string; r?: number }

/** A timed piece of choreography; acts play one after another. */
export interface Act { dur: number; begin?: (S: Scene) => void; run?: (S: Scene, e: number, t: number) => void; end?: (S: Scene) => void }

export interface CalcInput {
  value: string
  answer: number
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  /** a bearing: three figures, and nothing past 360 */
  three?: boolean
  max?: number
  slips?: { v: number; say: string }[]
  typed?: string
  fresh?: boolean
  onRight?: (S: Scene) => void
}

export type Mode = "none" | "tapPoint" | "tapArc"

export type Drag =
  | { kind: "ray"; id: string; last: number; moved: number }
  | { kind: "point"; n: string; off: Vec; moved: number }
  | { kind: "pan"; start: Vec; moved: number }

export interface Lab { key: string; tex: string; col: string; at: Vec; anchor: Vec; size: number; op: number; pulse?: boolean; word?: boolean }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  P: Record<string, Vec>
  D: Record<string, Vec>
  /** what each place is called (TeX: a letter, or \text{Foxby}) */
  names: Partial<Record<string, string>>
  dots: string[]
  /** places with a North arrow */
  norths: string[]
  /** places whose North line carries on down past them, dashed (to show South) */
  souths: string[]
  /** North lines that glow, and whether they carry the parallel marks */
  northGlow: string[]
  parallel: boolean
  /** how long a North arrow is, in world units (else a length on the screen) */
  northLen: number | null
  segs: Seg[]
  rays: Ray[]
  arcs: Arc[]
  markers: Marker[]
  curls: Curl[]
  /** a faint clock face round a place, its hand turning */
  clock: { at: string; t0: number } | null
  /** North, East, South and West round a place */
  rose: { at: string; t0: number; three: boolean } | null
  /** the bearing on the three-digit display (live from a ray, or set) */
  readout: { ray?: string; brg?: number; three: boolean; col: string } | null
  /** bearings a turning line clicks onto */
  magnets: number[]
  /** places the student can drag */
  dragPts: string[]
  /** where a dragged place may go: within this distance of a place */
  dragRing: { at: string; min: number; max: number } | null
  /** how far the student has turned a line this beat (degrees) */
  turned: number

  fitPts: string[]
  /** room kept round the fitted places (world units) */
  fitPad: number
  fit: { cx: number; cy: number; u: number; c: Vec } | null
  fitD: { cx: number; cy: number; u: number; c: Vec } | null

  tapPoints: string[] | null
  onPoint: ((S: Scene, n: string) => void) | null
  tapArcs: string[] | null
  onArc: ((S: Scene, id: string) => void) | null

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
  labOff: Record<string, Vec>
  labSide: Record<string, number>
  walkTex: string | null
  drag: Drag | null
  touch: boolean
  got: Set<string>
  /** numbers a beat keeps (how far a North arrow has grown, how far a place has been dragged) */
  vals: Record<string, number>
  /** numbers carried from beat to beat (where the student left the line) */
  keep: Record<string, number>
  touched: string | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    P: {}, D: {}, names: {}, dots: [], norths: [], souths: [], northGlow: [], parallel: false, northLen: null,
    segs: [], rays: [], arcs: [], markers: [], curls: [], clock: null, rose: null, readout: null,
    magnets: [], dragPts: [], dragRing: null, turned: 0,
    fitPts: [], fitPad: 1, fit: null, fitD: null,
    tapPoints: null, onPoint: null, tapArcs: null, onArc: null,
    eq: createBoard(), eqFn: null, eqRoom: { v: 0, t: 0 }, input: null, choice: null,
    acts: [], act: null, tick: null, timers: [], vis, labs: [], labD: {}, labOff: {}, labSide: {}, walkTex: null,
    drag: null, touch: false, got: new Set(), vals: {}, keep: {}, touched: null, flashGood: 0, note: null,
  }
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  readY: number
  readSize: number
  eqY: number
  eqSize: number
  chipsY: number
  keypadTop: number
  lineY: number
  lineSize: number
  labelSize: number
  midX: number
  eqW: number
  keypadCx?: number
  /** screen sizes that do not change with the map: a North arrow, an angle's arc */
  northPx: number
  arcPx: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 136
  const eqSize = compact ? (w < 400 ? 22 : 24) : 30
  const lineSize = compact ? 20 : 24
  const readSize = compact ? 30 : 38
  let y = h - (compact ? 80 : 94)
  let keypadTop = y
  const rows = 2
  const padH = rows * 46 + (rows - 1) * 8
  const beside = on(S, "keypad") && w >= 960
  const side = compact ? 16 : 28
  let midX = w / 2, eqW = w, keypadCx: number | undefined
  if (beside) {
    const padW = 6 * 46 + 5 * 8
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
  let readY = y
  if (on(S, "readout")) { readY = y - readSize * 0.95; y -= readSize * 1.9 }
  const least = on(S, "keypad") ? 110 : 160
  const board: Rect = { x0: side, x1: beside ? side + eqW : w - side, y0: phraseBottom + 10, y1: Math.max(phraseBottom + least, y - 6) }
  const m = Math.min(w, h)
  return {
    compact, phraseBottom, board, readY, readSize, eqY, eqSize, chipsY, keypadTop, lineY, lineSize,
    labelSize: compact ? 16 : 20, midX, eqW, keypadCx,
    northPx: clamp(m * 0.11, 44, 84), arcPx: w < 560 ? 26 : 34,
  }
}

export const screenScale = (S: Scene) => clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
export function resize(S: Scene, w: number, h: number) { S.w = w; S.h = h }

/** The view: the fitted places, with room round them (and above, for the North arrows), filling the board. */
function fitFor(S: Scene, L: Layout) {
  const names = (S.fitPts.length ? S.fitPts : Object.keys(S.P)).filter(n => S.P[n])
  const b = L.board
  if (!names.length) return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2, u: 30, c: [0, 0] as Vec }
  const P = names.map(n => S.P[n])
  const pad = S.fitPad
  const x0 = Math.min(...P.map(p => p[0])) - pad, x1 = Math.max(...P.map(p => p[0])) + pad
  const y0 = Math.min(...P.map(p => p[1])) - pad, y1 = Math.max(...P.map(p => p[1])) + pad
  // room above for a North arrow drawn on the screen, and for labels round the edge
  const top = S.northLen === null && S.norths.length ? L.northPx + L.labelSize * 1.6 : L.labelSize
  const edge = L.labelSize * 1.6
  const W = b.x1 - b.x0 - 2 * edge, H = b.y1 - b.y0 - top - edge
  const u = Math.max(0.02, Math.min(W / Math.max(1e-6, x1 - x0), H / Math.max(1e-6, y1 - y0)))
  const c: Vec = [(x0 + x1) / 2, (y0 + y1) / 2]
  return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + top + b.y1 - edge) / 2, u, c }
}

/** A world point on the screen. */
export function toScreen(S: Scene, p: Vec, drawn = true): Vec {
  const f = (drawn ? S.fitD : S.fit) ?? S.fit
  if (!f) return [0, 0]
  return [f.cx + (p[0] - f.c[0]) * f.u, f.cy - (p[1] - f.c[1]) * f.u]
}
/** A screen point in the world. */
export function toWorld(S: Scene, q: Vec): Vec {
  const f = S.fitD ?? S.fit
  if (!f) return [0, 0]
  return [f.c[0] + (q[0] - f.cx) / f.u, f.c[1] - (q[1] - f.cy) / f.u]
}
export const ptS = (S: Scene, n: string) => toScreen(S, S.D[n] ?? S.P[n] ?? [0, 0])
/** The way a bearing points on the screen. */
export const dirS = (b: number): Vec => { const d = dirW(b); return [d[0], -d[1]] }

/** How long a North arrow is on the screen. */
export function northPx(S: Scene, L: Layout) {
  const f = S.fitD ?? S.fit
  return S.northLen !== null && f ? S.northLen * f.u : L.northPx
}

/** Where a ray ends on the screen. */
export function rayEnd(S: Scene, r: Ray): Vec {
  const A = ptS(S, r.at)
  if (r.to) {
    // a ray to a place reaches it only once it points at it
    const T = ptS(S, r.to)
    const l = dist(A, T)
    return add(A, mul(dirS(r.d), l))
  }
  const f = S.fitD ?? S.fit
  return add(A, mul(dirS(r.d), r.len * (f?.u ?? 30)))
}

// ── angles on the screen ─────────────────────────────────────────────────

/** Points round an arc at a place, from a bearing turning clockwise. */
export function arcPts(c: Vec, from: number, sweep: number, r: number): Vec[] {
  const n = Math.max(6, Math.ceil(Math.abs(sweep) / 6))
  const out: Vec[] = []
  for (let k = 0; k <= n; k++) out.push(add(c, mul(dirS(from + (sweep * k) / n), r)))
  return out
}

/** Where an arc's label goes: out along the middle of the angle, clear of the arc. */
export function arcLabelAt(c: Vec, from: number, sweep: number, r: number, size: number, tex: string): Vec {
  const w = labelWidth(tex, size)
  const d = (b: number) => dirS(b)
  // how far out a label of this size must be to clear a line at this many degrees from its middle
  const clear = (deg: number) => (w * 0.5 + 5) / Math.max(0.2, Math.sin((Math.min(90, deg) * Math.PI) / 180))
  // a thin angle: the label sits just past the arc's far end, outside the angle (else it would be pushed far out, onto other things)
  if (Math.abs(sweep) < 44) {
    const b = from + sweep + 26 * Math.sign(sweep || 1)
    return add(c, mul(d(b), r + Math.max(size * 0.9, w * 0.45)))
  }
  const mid = from + sweep / 2
  return add(c, mul(d(mid), Math.min(r + Math.max(size * 0.95, clear(Math.abs(sweep) / 2)), r + size * 2.2)))
}

/** Roughly how wide a short label is. */
export function labelWidth(tex: string, size: number): number {
  const seen = tex.replace(/\\textcolor\{[^}]*\}/g, "").replace(/\\text\{([^}]*)\}/g, "$1").replace(/\^\\circ/g, "o").replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_\\ ]/g, "")
  return seen.length * size * 0.52
}

// ── labels ───────────────────────────────────────────────────────────────

/**
 * Where a place's name goes: in the widest gap between the lines that leave
 * it (its North arrow, its lines and rays), kept while that gap stays wide,
 * so a name never sits on a line and never jumps about.
 */
/** The bearings of the lines that leave a place: its North arrow, its lines, its rays. */
function lineDirs(S: Scene, n: string): number[] {
  const dirs: number[] = []
  if (S.norths.includes(n)) dirs.push(0)
  if (S.souths.includes(n)) dirs.push(180)
  for (const s of S.segs) {
    if (s.a === n && S.P[s.b]) dirs.push(brgOf(S.D[n] ?? S.P[n], S.D[s.b] ?? S.P[s.b]))
    if (s.b === n && S.P[s.a]) dirs.push(brgOf(S.D[n] ?? S.P[n], S.D[s.a] ?? S.P[s.a]))
  }
  for (const r of S.rays) if (r.at === n) dirs.push(norm(r.d))
  for (const r of S.rays) if (r.to === n) dirs.push(brgOf(S.D[n] ?? S.P[n], S.D[r.at] ?? S.P[r.at]))
  return dirs
}

/**
 * Where an angle's label goes: in the widest gap between the lines inside
 * the angle (two bearings from one North line would otherwise put both
 * labels on the same line), and not in a gap another label at that place
 * has taken.
 */
function arcLabelSpot(S: Scene, at: string, from: number, sweep: number, r: number, size: number, tex: string, used: number[]): Vec {
  const c = ptS(S, at)
  const inside = lineDirs(S, at).map(d => norm(d - from)).filter(d => d > 1 && d < sweep - 1).sort((x, y) => x - y)
  if (sweep < 44 && !inside.length) return arcLabelAt(c, from, sweep, r, size, tex)
  const cuts = [0, ...inside, sweep]
  const gaps = cuts.slice(1).map((y, i) => ({ mid: from + (cuts[i] + y) / 2, w: y - cuts[i] }))
  gaps.sort((x, y) => y.w - x.w)
  const free = gaps.find(g => used.every(u => Math.abs(diff(u, g.mid)) > 24)) ?? gaps[0]
  used.push(free.mid)
  const w = labelWidth(tex, size)
  const need = (w * 0.5 + 5) / Math.max(0.2, Math.sin((Math.min(90, free.w / 2) * Math.PI) / 180))
  return add(c, mul(dirS(free.mid), Math.min(r + Math.max(size * 0.95, need), r + size * 2.2)))
}

function nameDir(S: Scene, n: string): number {
  const dirs = lineDirs(S, n)
  // an angle's whole span is taken (a name inside its wedge reads as part of it)
  for (const a of S.arcs) if (a.at === n) for (let k = 0; k <= Math.ceil(a.sweep / 24); k++) dirs.push(norm(a.from + Math.min(a.sweep, k * 24)))
  for (const r of S.rays) if (r.at === n && r.arc) for (let k = 0; k <= Math.ceil(norm(r.d) / 24); k++) dirs.push(norm(Math.min(norm(r.d), k * 24)))
  const key = `L-${n}`
  if (!dirs.length) { const d = S.labSide[key] ?? 225; S.labSide[key] = d; return d }
  const sorted = [...new Set(dirs.map(d => Math.round(norm(d) * 10) / 10))].sort((a, b) => a - b)
  let best = 225, gap = -1
  for (let i = 0; i < sorted.length; i++) {
    const a = sorted[i], b = i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360
    if (b - a > gap) { gap = b - a; best = norm(a + (b - a) / 2) }
  }
  // keep the old place while it is still well clear of every line
  const prev = S.labSide[key]
  if (prev !== undefined && sorted.every(d => Math.abs(diff(d, prev)) > 38)) return prev
  S.labSide[key] = best
  return best
}

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  if (S.vis.letters.v > 0.01) {
    for (const [n, tex] of Object.entries(S.names)) {
      if (!tex || !S.P[n]) continue
      const p = ptS(S, n)
      const d = nameDir(S, n)
      const word = tex.startsWith("\\text")
      const off = word ? labelWidth(tex, size) * 0.5 * Math.abs(dirS(d)[0]) + size * 0.95 : size * 0.95 + 4
      out.push({ key: `L-${n}`, tex, col: CHALK, at: add(p, mul(dirS(d), off)), anchor: p, size: size + 1, op: S.vis.letters.v })
    }
  }
  if (S.vis.fig.v > 0.01) {
    // the word North at the top of each North arrow
    const np = northPx(S, L)
    for (const n of S.norths) {
      if (!S.P[n] || S.rose?.at === n) continue
      const p = ptS(S, n)
      out.push({ key: `NW-${n}`, tex: "North", col: CHALK, at: [p[0], p[1] - np - size * 0.75], anchor: p, size: size - 3, op: S.vis.fig.v * 0.85, word: true })
    }
    for (const s of S.segs) {
      if (!s.lab || !S.P[s.a] || !S.P[s.b] || s.grow.v < 0.95) continue
      const A = ptS(S, s.a), B = ptS(S, s.b), m = lerpV(A, B, 0.5)
      const d = sub(B, A), l = Math.hypot(d[0], d[1]) || 1
      let nrm: Vec = [-d[1] / l, d[0] / l]
      // to the side away from the middle of the figure
      const mid = toScreen(S, S.fitD?.c ?? [0, 0])
      if (dot(nrm, sub(mid, m)) > 0) nrm = mul(nrm, -1)
      const w = labelWidth(s.lab.tex, size)
      out.push({ key: `S-${s.a}${s.b}`, tex: s.lab.tex, col: s.lab.col ?? CHALK, at: add(m, mul(nrm, Math.max(size * 0.8, Math.abs(nrm[0]) * (w / 2 + 8) + Math.abs(nrm[1]) * size * 0.7))), anchor: m, size, op: S.vis.fig.v })
    }
  }
  // a clock's numbers, and North, East, South and West, round the place they are drawn at
  const ringR = (at: string) => { const ray = S.rays.find(r => r.at === at); return ray ? dist(rayEnd(S, ray), ptS(S, at)) : 110 }
  if (S.clock && S.P[S.clock.at]) {
    const c = ptS(S, S.clock.at), R = ringR(S.clock.at) * 1.12
    for (const [h, b] of [[12, 0], [3, 90], [6, 180], [9, 270]] as const) out.push({ key: `CL-${h}`, tex: String(h), col: QUIET, at: add(c, mul(dirS(b), R * 0.72)), anchor: c, size: size - 2, op: 0.9 })
  }
  if (S.rose && S.P[S.rose.at]) {
    const c = ptS(S, S.rose.at), R = ringR(S.rose.at) + size * 1.3
    const age = clamp((S.time - S.rose.t0) / 0.5, 0, 1)
    for (const [w, b] of [["N", 0], ["E", 90], ["S", 180], ["W", 270]] as const) {
      const d = dirS(b)
      out.push({ key: `RO-${w}`, tex: `\\mathrm{${w}}`, col: CHALK, at: add(c, mul(d, R)), anchor: c, size: size + 2, op: age })
      // each value sits just outside its letter: above N, under the others (never off the side of a phone)
      const vt = `${brgText(b, S.rose.three)}^\\circ`
      const at = add(c, mul(d, R))
      out.push({ key: `RV-${w}`, tex: vt, col: BLUE, at: [at[0], at[1] + (b === 0 ? -size * 1.15 : size * 1.15)], anchor: c, size: size - 2, op: age })
    }
  }
  if (S.vis.marks.v > 0.01) {
    const used: Record<string, number[]> = {}
    for (const a of S.arcs) {
      if (!a.tex || !S.P[a.at]) continue
      const g = a.grow ? a.grow.v : 1
      if (g < 0.6) continue
      const c = ptS(S, a.at)
      const r = L.arcPx * (a.r ?? 1)
      out.push({ key: `A-${a.id}`, tex: a.tex, col: a.col, at: arcLabelSpot(S, a.at, a.from, a.sweep, r, size, a.tex, (used[a.at] ??= [])), anchor: c, size, op: S.vis.marks.v * clamp((g - 0.6) / 0.4, 0, 1), pulse: a.pulse })
    }
    for (const r of S.rays) {
      if (!r.arc || !S.P[r.at]) continue
      const c = ptS(S, r.at)
      const sw = norm(r.d)
      if (sw < 0.5) continue
      const tex = `${brgText(r.d, !!S.readout?.three)}^\\circ`
      // the turning line itself is not a line to keep clear of here: its label follows the arc
      out.push({ key: `RA-${r.id}`, tex, col: BLUE, at: arcLabelAt(c, 0, sw, L.arcPx * 1.15, size, tex), anchor: c, size, op: S.vis.marks.v })
    }
  }
  return unclash(out)
}

/**
 * Keep labels off each other: places' names and the word North stay put;
 * an angle's or a line's label that lands on one moves out, away from what
 * it belongs to, until it is clear (a few steps at most).
 */
function unclash(labs: Lab[]): Lab[] {
  const box = (l: Lab) => {
    const w = l.word ? l.tex.length * l.size * 0.55 : labelWidth(l.tex, l.size) + l.size * 0.3
    return { x0: l.at[0] - w / 2, x1: l.at[0] + w / 2, y0: l.at[1] - l.size * 0.62, y1: l.at[1] + l.size * 0.62 }
  }
  const hit = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1
  const fixed = labs.filter(l => l.key.startsWith("L-") || l.key.startsWith("NW-"))
  const placed = [...fixed]
  for (const l of labs) {
    if (fixed.includes(l)) continue
    const d = sub(l.at, l.anchor), n = Math.hypot(d[0], d[1]) || 1
    const u: Vec = [d[0] / n, d[1] / n]
    for (let k = 0; k < 5 && placed.some(p => hit(box(p), box(l))); k++) l.at = add(l.at, mul(u, l.size * 0.7))
    placed.push(l)
  }
  return labs
}

// ── animation ────────────────────────────────────────────────────────────

/** Play the acts in turn: each runs for its time, then the next begins. */
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

  const fp = k(S.drag?.kind === "point" ? 0.5 : 0.14)
  for (const [n, p] of Object.entries(S.P)) {
    const d = S.D[n]
    S.D[n] = d ? lerpV(d, p, fp) : [p[0], p[1]]
  }
  for (const n of Object.keys(S.D)) if (!S.P[n]) delete S.D[n]
  for (const r of S.rays) {
    const dd = diff(r.d, r.brg)
    r.d = S.drag?.kind === "ray" && S.drag.id === r.id ? r.brg : Math.abs(dd) < 0.05 ? r.brg : r.d + dd * k(0.18)
  }
  for (const s of S.segs) { s.grow.v += (s.grow.t - s.grow.v) * k(0.09); if (Math.abs(s.grow.t - s.grow.v) < 0.003) s.grow.v = s.grow.t }
  for (const a of S.arcs) if (a.grow) { a.grow.v += (a.grow.t - a.grow.v) * k(0.07); if (Math.abs(a.grow.t - a.grow.v) < 0.003) a.grow.v = a.grow.t }

  const L = layout(S)
  // the view holds still while a place is being dragged (else it would slide away under the finger)
  if (S.drag?.kind !== "point" || !S.fit) S.fit = fitFor(S, L)
  if (!S.fitD) S.fitD = { ...S.fit, c: [...S.fit.c] as Vec }
  const ff = k(0.1)
  const A = S.fitD, B = S.fit
  S.fitD = { cx: A.cx + (B.cx - A.cx) * ff, cy: A.cy + (B.cy - A.cy) * ff, u: A.u + (B.u - A.u) * ff, c: lerpV(A.c, B.c, ff) }

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
  const keep = new Set<string>()
  for (const l of S.labs) {
    keep.add(l.key)
    const want = sub(l.at, l.anchor)
    const o = S.labOff[l.key]
    S.labOff[l.key] = o ? lerpV(o, want, k(0.25)) : want
    S.labD[l.key] = add(l.anchor, S.labOff[l.key])
  }
  for (const key of Object.keys(S.labD)) if (!keep.has(key)) { delete S.labD[key]; delete S.labOff[key] }

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

/** Clear everything a beat sets; the places stay where they are, so a new board glides from the old. */
export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drag = null
  S.names = {}
  S.dots = []
  S.norths = []
  S.souths = []
  S.northGlow = []
  S.parallel = false
  S.northLen = null
  S.segs = []
  S.rays = []
  S.arcs = []
  S.markers = []
  S.curls = []
  S.clock = null
  S.rose = null
  S.readout = null
  S.magnets = []
  S.dragPts = []
  S.dragRing = null
  S.turned = 0
  S.fitPad = 1
  S.tapPoints = null
  S.onPoint = null
  S.tapArcs = null
  S.onArc = null
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
  S.got = new Set()
  S.vals = {}
  S.touched = null
  S.note = null
}

/** Set the places for a board (old ones not named go). */
export function places(S: Scene, pts: Record<string, Vec>) {
  for (const n of Object.keys(S.P)) if (!pts[n]) delete S.P[n]
  for (const [n, p] of Object.entries(pts)) S.P[n] = [p[0], p[1]]
}

/** A place this bearing and distance from another. */
export const along = (from: Vec, brg: number, d: number): Vec => add(from, mul(dirW(brg), d))

export function addSeg(S: Scene, a: string, b: string, o: { col?: string; dash?: boolean; grown?: boolean; lab?: { tex: string; col?: string } } = {}) {
  S.segs = [...S.segs.filter(s => !((s.a === a && s.b === b) || (s.a === b && s.b === a))), { a, b, col: o.col, dash: o.dash, grow: { v: o.grown === false ? 0 : 1, t: 1 }, lab: o.lab }]
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

const tol = (S: Scene) => (S.touch ? 34 : 22)

function pointAt(S: Scene, p: Vec, names: string[]): string | null {
  let best: string | null = null, bd = Infinity
  for (const n of names) {
    if (!S.P[n]) continue
    const d = Math.min(dist(p, ptS(S, n)), S.labD[`L-${n}`] ? dist(p, S.labD[`L-${n}`]) + 4 : Infinity)
    if (d < bd) { bd = d; best = n }
  }
  return best && bd < tol(S) + 12 ? best : null
}

/** Where an arc can be tapped: the middle of its wedge. */
export function arcSpot(S: Scene, a: Arc, L = layout(S)): Vec {
  return add(ptS(S, a.at), mul(dirS(a.from + a.sweep / 2), L.arcPx * (a.r ?? 1) * 0.72))
}

/** The bearing the finger is at, seen from a place. */
const fingerBrg = (S: Scene, at: string, p: Vec) => { const A = ptS(S, at); return norm((Math.atan2(p[0] - A[0], A[1] - p[1]) * 180) / Math.PI) }

/** Turn a ray to where the finger is, clicking onto a magnet when close. */
function turnRay(S: Scene, r: Ray, p: Vec) {
  let b = fingerBrg(S, r.at, p)
  const near = S.magnets.find(m => Math.abs(diff(b, m)) < 3.5)
  if (near !== undefined) b = norm(near)
  else b = Math.round(b)
  const d = S.drag
  if (d?.kind === "ray") { S.turned += Math.abs(diff(d.last, b)); d.last = b }
  r.brg = b
}

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  // the end of a line that turns
  for (const r of S.rays) {
    if (!r.handle) continue
    if (dist(p, rayEnd(S, r)) < tol(S) + 14) { S.drag = { kind: "ray", id: r.id, last: r.brg, moved: 0 }; return true }
  }
  if (S.dragPts.length) {
    const n = pointAt(S, p, S.dragPts)
    if (n) { S.drag = { kind: "point", n, off: sub(ptS(S, n), p), moved: 0 }; return true }
  }
  S.drag = { kind: "pan", start: p, moved: 0 }
  return true
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  if (d.kind === "ray") {
    const r = S.rays.find(x => x.id === d.id)
    if (!r) return
    d.moved += 1
    turnRay(S, r, p)
    return
  }
  if (d.kind === "point") {
    d.moved += 1
    let w = toWorld(S, add(p, d.off))
    const ring = S.dragRing
    if (ring && S.P[ring.at]) {
      const c = S.P[ring.at], v = sub(w, c), l = Math.hypot(v[0], v[1]) || 1e-6
      w = add(c, mul(v, clamp(l, ring.min, ring.max) / l))
    }
    S.P[d.n] = w
    return
  }
  d.moved = Math.max(d.moved, dist(p, d.start))
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  if (d.kind !== "pan" || d.moved > 10) return
  tapAt(S, d.start)
}

function tapAt(S: Scene, p: Vec) {
  if (S.mode === "tapPoint" && S.tapPoints) {
    const n = pointAt(S, p, S.tapPoints)
    if (n) S.onPoint?.(S, n)
    return
  }
  if (S.mode === "tapArc" && S.tapArcs) {
    const L = layout(S)
    let best: string | null = null, bd = Infinity
    for (const id of S.tapArcs) {
      const a = S.arcs.find(x => x.id === id)
      if (!a) continue
      const dd = Math.min(dist(p, arcSpot(S, a, L)), ...arcPts(ptS(S, a.at), a.from, a.sweep, L.arcPx * (a.r ?? 1)).map(q => dist(p, q)))
      if (dd < bd) { bd = dd; best = id }
    }
    if (best && bd < tol(S) + 14) S.onArc?.(S, best)
  }
}

// ── typed answers ────────────────────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "go") { check(S); return }
  if ((inp.state === "wrong" || inp.fresh) && key !== "back") inp.value = ""
  inp.fresh = false
  if (key === "back") inp.value = inp.value.slice(0, -1)
  else if (/^\d$/.test(key) && inp.value.length < (inp.max ?? 3)) inp.value += key
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const v = Number(inp.value)
  if (v === inp.answer) {
    // a bearing has three figures: 70 is right, but must be written 070
    if (inp.three && inp.value.length < 3) {
      inp.fresh = true
      say(S, `Nearly. A bearing has three figures: $${String(inp.answer).padStart(3, "0")}^\\circ$.`, "calm", 4)
      return
    }
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
  if (inp.three && v >= 360) { say(S, "That's more than a full turn. A bearing is less than $360^\\circ$.", "wrong", 4.5); return }
  const slip = inp.slips?.find(s => s.v === v)
  if (slip) say(S, slip.say, "wrong", 4.5)
}

export { dist, lerpV, clamp, add, sub, mul, dot }
