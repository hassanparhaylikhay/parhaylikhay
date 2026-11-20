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

/**
 * A ruler lying on the drawing: its 0 at `zero` (world, drawing cm), its
 * measuring edge running along a bearing, `len` cm long. `on` is the place
 * its 0 has clicked onto, `along` the place its edge points at; `pen` a
 * pencil point slid along its edge (cm), for drawing a length.
 */
export interface Ruler { zero: Vec; dir: number; len: number; on: string | null; along: string | null; pen: number | null; turn: boolean; move: boolean; penAt?: number }

/**
 * A protractor: its centre at `c` (world), the 0 end of its outer scale
 * pointing along bearing `rot`, its half circle running clockwise from there
 * through 180°. The inner scale reads the other way. `on` is the place its
 * centre has clicked onto; `pen` a pencil mark on its edge (a bearing);
 * `lit` the scale to read (the one that starts at 0 on North).
 */
export interface Prot {
  c: Vec; rot: number; on: string | null; pen: number | null; lit: "outer" | "inner" | null; turn: boolean; move: boolean; magnets: number[]; penAt?: number
  /** the place its centre should go on (a ring shows where) */
  goal?: string
  /** the turn the beat wants: the end that sits on North then glows while it is turned */
  want?: number
  /** where a line crosses its edge (a bearing): that part of the edge glows, to read there */
  spot?: number
  /** a number on the row being read that breathes (the one to find) */
  find?: number
  /** the line its glowing end goes onto, as a bearing (North when not set: an arm of an angle otherwise) */
  aim?: number
  /** a reading lens over where the line crosses its edge (`spot`), on the row being read */
  lens?: boolean
  /** a number on the row NOT being read, shown pink (the wrong reading) */
  warn?: number
}

/**
 * Compasses on the page: the point at `point` (world), clicked onto a place
 * (`on`); the pencil `open` cm away on bearing `dir`. One job at a time:
 * `canOpen` (they lie on the ruler, the point on its 0, and the pencil leg
 * slides along it), `move` (carried by the top onto a place), `draw` (the
 * pencil turned round the point, drawing an arc as it goes).
 */
export interface Comp {
  point: Vec
  on: string | null
  open: number
  dir: number
  canOpen: boolean
  move: boolean
  draw: boolean
  /** the opening asked for: it clicks there from close by */
  openAt?: number
  /** the place a ring waits at for the point */
  goal?: string
  /** the arc being drawn now, as bearings carried on past 360 (from where the pencil started to where it is) */
  drawing: { from: number; to: number } | null
}

/** An arc the compasses drew on the page: round `at` (world), radius `r` (cm), from a bearing, clockwise `sweep` degrees (or back, negative). */
export interface PenArc { id: string; at: Vec; r: number; from: number; sweep: number; col?: string; pulse?: boolean }

/** Marks along a line at every `step` (world units), each piece labelled; `lit` pieces glow. */
export interface Along { a: string; b: string; step: number; tex?: string; under?: string; lit: number }

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
  /** a decimal number may be typed */
  dec?: boolean
  /** a measured answer: right within this much; "Close" within `near` */
  tol?: number
  near?: number
  nearSay?: string
  onRight?: (S: Scene) => void
}

export type Mode = "none" | "tapPoint" | "tapArc" | "tapAny"

export type Drag =
  | { kind: "ray"; id: string; last: number; moved: number }
  | { kind: "ruler" | "prot"; off: Vec; moved: number }
  | { kind: "rulerTurn" | "rulerPen" | "protPen"; moved: number }
  /** `off`: where on the protractor it was held, from its 0 end (its handle is at 0) */
  | { kind: "protTurn"; moved: number; off: number }
  | { kind: "point"; n: string; off: Vec; moved: number }
  | { kind: "compOpen" | "compDraw"; moved: number }
  | { kind: "compMove"; off: Vec; moved: number }
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
  /** a place's colour, if not chalk (a place not found yet is pink) */
  nameCol: Record<string, string>
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
  /** a tap anywhere (where two lines cross, with no ring to give it away) */
  onTap: ((S: Scene, p: Vec) => void) | null

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
  ruler: Ruler | null
  prot: Prot | null
  /** compasses on the page, and the arcs they have drawn */
  comp: Comp | null
  penArcs: PenArc[]
  /** the arcs the student drew, carried from beat to beat (not cleared between beats) */
  arcMem: PenArc[]
  /** right-angle squares at places, from a bearing turning clockwise (to compare an angle with $90^\circ$) */
  squares: { at: string; from: number; col: string }[]
  /** a sheet of paper under the drawing (world rect), and what is written at its corner */
  page: { x0?: number; y0?: number; x1?: number; y1?: number; caption?: string } | null
  along: Along | null
  /** the view holds where it is (so a drawing can be seen to shrink) */
  holdFit: boolean
  /** the keypad's keys (null: digits only) */
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
    P: {}, D: {}, names: {}, nameCol: {}, dots: [], norths: [], souths: [], northGlow: [], parallel: false, northLen: null,
    segs: [], rays: [], arcs: [], markers: [], curls: [], clock: null, rose: null, readout: null,
    magnets: [], dragPts: [], dragRing: null, turned: 0,
    fitPts: [], fitPad: 1, fit: null, fitD: null,
    tapPoints: null, onPoint: null, tapArcs: null, onArc: null, onTap: null,
    eq: createBoard(), eqFn: null, eqRoom: { v: 0, t: 0 }, input: null, choice: null,
    acts: [], act: null, tick: null, timers: [], vis, labs: [], labD: {}, labOff: {}, labSide: {}, walkTex: null,
    drag: null, touch: false, got: new Set(), vals: {}, keep: {}, touched: null, flashGood: 0, note: null,
    ruler: null, prot: null, page: null, along: null, holdFit: false, keyRows: null, squares: [], comp: null, penArcs: [], arcMem: [],
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
  let x0 = Math.min(...P.map(p => p[0])) - pad, x1 = Math.max(...P.map(p => p[0])) + pad
  let y0 = Math.min(...P.map(p => p[1])) - pad, y1 = Math.max(...P.map(p => p[1])) + pad
  // room above for a North arrow drawn on the screen, and for labels round the edge
  const top = S.northLen === null && S.norths.length ? L.northPx + L.labelSize * 1.6 : L.labelSize
  const edge = L.labelSize * 1.6
  const W = b.x1 - b.x0 - 2 * edge, H = b.y1 - b.y0 - top - edge
  const scale = () => Math.max(0.02, Math.min(W / Math.max(1e-6, x1 - x0), H / Math.max(1e-6, y1 - y0)))
  let u = scale()
  // an angle at a place, with its label outside it, needs that much room round the place
  let grew = false
  for (const a of S.arcs) {
    const p = S.P[a.at]
    if (!p) continue
    const m = (L.arcPx * (a.r ?? 1) + L.labelSize * 2.2 - edge) / u
    if (m <= 0) continue
    if (p[0] - m < x0) { x0 = p[0] - m; grew = true }
    if (p[0] + m > x1) { x1 = p[0] + m; grew = true }
    if (p[1] - m < y0) { y0 = p[1] - m; grew = true }
    if (p[1] + m > y1) { y1 = p[1] + m; grew = true }
  }
  if (grew) u = scale()
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
  // an angle's whole span is taken (a name inside its wedge reads as part of it); angles all the way
  // round leave no gap, so then only the lines count and the name goes outside the angles
  const here = S.arcs.filter(a => a.at === n)
  if (here.reduce((t, a) => t + a.sweep, 0) < 270) for (const a of here) for (let k = 0; k <= Math.ceil(a.sweep / 24); k++) dirs.push(norm(a.from + Math.min(a.sweep, k * 24)))
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
      let off = word ? labelWidth(tex, size) * 0.5 * Math.abs(dirS(d)[0]) + size * 0.95 : size * 0.95 + 4
      // a name on an angle, or squeezed beside one, goes out past its arc
      for (const a of S.arcs) {
        if (a.at !== n) continue
        const rel = norm(d - a.from)
        if (rel <= a.sweep + 25 || rel >= 335) off = Math.max(off, L.arcPx * (a.r ?? 1) + size * 0.8)
      }
      out.push({ key: `L-${n}`, tex, col: S.nameCol[n] ?? CHALK, at: add(p, mul(dirS(d), off)), anchor: p, size: size + 1, op: S.vis.letters.v })
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
  toolLabels(S, L, out)
  // the word North under the protractor is covered by it (its line still shows through)
  if (S.prot) {
    const G = protGeom(S, L)
    for (let i = out.length - 1; i >= 0; i--) if ((out[i].key.startsWith("NW-") || out[i].key === "PG") && dist(out[i].at, G.C) < G.R + out[i].size) out.splice(i, 1)
  }
  const lens = S.ruler ? lensGeom(S, L) : null
  const pl = S.prot ? protLensGeom(S, L) : null
  const seen = (l: Lab) => (!lens || l.key.startsWith("RL-") || dist(l.at, lens.c) > lens.r + l.size * 0.4) && (!pl || l.key.startsWith("PL-") || dist(l.at, pl.c) > pl.r + l.size * 0.4)
  return unclash(lens || pl ? out.filter(seen) : out)
}

/** The numbers on the ruler and the protractor, in the lens, on the page, and along a line. */
function toolLabels(S: Scene, L: Layout, all: Lab[]) {
  const small = L.compact ? 11 : 13
  // a tool can reach past the edge of the screen: its numbers there are not drawn
  const out = { push: (l: Lab) => { if (l.at[0] > 6 && l.at[0] < S.w - 6 && l.at[1] > 6 && l.at[1] < S.h - 6) all.push(l) } }
  if (S.ruler) {
    const G = rulerGeom(S)
    for (let k = 0; k <= S.ruler.len; k++) {
      const q = add(add(G.Z, mul(G.e, k * G.u)), mul(G.n, 15 + small * 0.6))
      out.push({ key: `RU-${k}`, tex: String(k), col: CHALK, at: q, anchor: q, size: small, op: 0.9 })
    }
    const lens = lensGeom(S, L)
    if (lens) {
      // the cm numbers the lens shows, bigger
      for (let k = Math.floor(lens.read - 0.6); k <= Math.ceil(lens.read + 0.6); k++) {
        if (k < 0 || k > S.ruler.len) continue
        const q = inLens(lens, add(add(G.Z, mul(G.e, k * G.u)), mul(G.n, 15 + small * 0.6)))
        if (dist(q, lens.c) > lens.r - small * 0.9) continue
        out.push({ key: `RL-${k}`, tex: String(k), col: CHALK, at: q, anchor: q, size: small + 6, op: 1 })
      }
    }
  }
  if (S.prot) {
    const G = protGeom(S, L)
    const P = S.prot
    const col = (scale: "outer" | "inner") => (P.lit === null ? CHALK : P.lit === scale ? BLUE : QUIET)
    for (let k = 0; k <= 180; k += 10) {
      const d = dirS(P.rot + k)
      const qo = add(G.C, mul(d, G.R - small * 1.55)), qi = add(G.C, mul(d, G.R - small * 3.0))
      const wo = P.lit === "inner" && P.warn === k, wi = P.lit === "outer" && P.warn === 180 - k
      out.push({ key: `PO-${k}`, tex: String(k), col: wo ? PINK : col("outer"), at: qo, anchor: qo, size: small - 1, op: P.lit === "inner" && !wo ? 0.55 : 1, pulse: (P.lit === "outer" && P.find === k) || wo })
      out.push({ key: `PI-${k}`, tex: String(180 - k), col: wi ? PINK : col("inner"), at: qi, anchor: qi, size: small - 2, op: P.lit === "outer" && !wi ? 0.55 : 0.9, pulse: (P.lit === "inner" && P.find === 180 - k) || wi })
    }
    // the reading lens: the numbers of the row being read near where the line crosses, bigger
    const pl = protLensGeom(S, L)
    if (pl) {
      for (let k = 0; k <= 180; k += 10) {
        if (Math.abs(diff(P.rot + k, P.spot!)) > 16) continue
        const d = dirS(P.rot + k), outer = P.lit === "outer"
        const q = inLens(pl, add(G.C, mul(d, G.R - small * (outer ? 1.55 : 3.0))))
        if (dist(q, pl.c) > pl.r - small * 0.9) continue
        out.push({ key: `PL-${k}`, tex: String(outer ? k : 180 - k), col: BLUE, at: q, anchor: q, size: small + 6, op: 1 })
      }
    }
  }
  if (S.comp && S.comp.canOpen) {
    const G = compGeom(S)
    const q = add(G.Q, mul(G.n, -(small + 14)))
    out.push({ key: "CO", tex: `${S.comp.open.toFixed(1)}\\text{ cm}`, col: YELLOW, at: q, anchor: q, size: small + 4, op: 1 })
  }
  const pr = pageRect(S, L)
  if (S.page?.caption && pr) {
    const at: Vec = [pr.x1 - labelWidth(S.page.caption, small + 1) * 0.55 - 10, pr.y1 - small * 1.2]
    out.push({ key: "PG", tex: S.page.caption, col: CHALK, at, anchor: at, size: small + 1, op: 0.85 })
  }
  const A = S.along
  if (A && S.P[A.a] && S.P[A.b] && A.tex) {
    const a = ptS(S, A.a), b = ptS(S, A.b)
    const l = dist(a, b), e = mul(sub(b, a), 1 / (l || 1))
    const f = S.fitD ?? S.fit, stepPx = A.step * (f?.u ?? 30)
    let nrm: Vec = [e[1], -e[0]]
    if (nrm[1] > 0) nrm = mul(nrm, -1)
    const count = Math.floor(l / stepPx + 0.05)
    for (let k = 0; k < A.lit && k < count; k++) {
      const m = add(a, mul(e, stepPx * (k + 0.5)))
      const q = add(m, mul(nrm, small * 1.5))
      out.push({ key: `AL-${k}`, tex: A.tex, col: BLUE, at: q, anchor: q, size: small, op: 1 })
      if (A.under) { const q2 = sub(m, mul(nrm, small * 1.5)); out.push({ key: `AU-${k}`, tex: A.under, col: CHALK, at: q2, anchor: q2, size: small, op: 1 }) }
    }
  }
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
  const fixed = labs.filter(l => !l.key.startsWith("A-") && !l.key.startsWith("RA-") && !l.key.startsWith("S-"))
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
  if ((S.drag?.kind !== "point" && !S.holdFit) || !S.fit) S.fit = fitFor(S, L)
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
  S.nameCol = {}
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
  S.onTap = null
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
  S.ruler = null
  S.prot = null
  S.page = null
  S.along = null
  S.holdFit = false
  S.keyRows = null
  S.squares = []
  S.comp = null
  S.penArcs = []
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

// ── the ruler and the protractor ─────────────────────────────────────────

/**
 * The sheet of paper on the screen: a set rectangle (world), or wrapped round
 * the fitted places with room for their North arrows and names.
 */
export function pageRect(S: Scene, L = layout(S)): { x0: number; y0: number; x1: number; y1: number } | null {
  const pg = S.page
  if (!pg) return null
  if (pg.x0 !== undefined && pg.y0 !== undefined && pg.x1 !== undefined && pg.y1 !== undefined) {
    const a = toScreen(S, [pg.x0, pg.y1]), b = toScreen(S, [pg.x1, pg.y0])
    return { x0: a[0], y0: a[1], x1: b[0], y1: b[1] }
  }
  const P = S.fitPts.filter(n => S.P[n]).map(n => toScreen(S, S.P[n]))
  if (!P.length) return null
  const f = S.fitD ?? S.fit, pad = S.fitPad * (f?.u ?? 30)
  const m = L.labelSize * 1.4
  const top = S.norths.length && S.northLen === null ? northPx(S, L) + L.labelSize * 1.3 : m
  const xs = P.map(p => p[0]), ys = P.map(p => p[1])
  return { x0: Math.min(...xs) - pad - m, y0: Math.min(...ys) - pad - top, x1: Math.max(...xs) + pad + m, y1: Math.max(...ys) + pad + m + L.labelSize }
}

/** How much the reading lens magnifies. */
export const LENS_X = 2.4

/**
 * The reading lens: when the ruler lies along a line with its 0 on one end,
 * a round window shows the other end close up, so the reading is easy on a
 * phone. It sits off to the side of the ruler, inside the board.
 */
export function lensGeom(S: Scene, L = layout(S)) {
  const R = S.ruler
  if (!R || !R.on || !R.along || S.drag?.kind === "ruler" || S.drag?.kind === "rulerTurn") return null
  const G = rulerGeom(S)
  const end = ptS(S, R.along)
  const r = L.compact ? 46 : 58
  const small = L.compact ? 11 : 13
  // what the lens shows: the end and the nearest cm number, both in view, as big as they fit
  const read = dist(G.Z, end) / G.u
  const k = clamp(Math.round(read), 0, R.len)
  const num = add(add(G.Z, mul(G.e, k * G.u)), mul(G.n, 15 + small * 0.6))
  const at = lerpV(end, num, 0.5)
  const x = clamp((r - small * 1.2) / Math.max(1, dist(end, num) / 2), 1.5, LENS_X)
  const b = L.board
  const np = northPx(S, L)
  // nothing it would hide: a North arrow, a place, the end itself
  const clear = (c: Vec) =>
    S.norths.every(n => { const p = ptS(S, n); return Math.abs(c[0] - p[0]) > r + 18 || c[1] > p[1] + r + 6 || c[1] < p[1] - np - r - 24 }) &&
    Object.keys(S.names).every(n => !S.P[n] || dist(c, ptS(S, n)) > r + 16)
  const fits = (c: Vec) => c[0] - r > b.x0 - 4 && c[0] + r < b.x1 + 4 && c[1] - r > b.y0 - 4 && c[1] + r < b.y1 + 4
  const tries: Vec[] = []
  for (const ang of [135, 225, 45, 315, 180, 90, 270, 0]) for (const k of [1.9, 2.5]) tries.push(add(end, mul(dirS(ang), r * k)))
  const c = tries.find(q => fits(q) && clear(q)) ?? tries.find(fits) ?? tries[0]
  return { c, r, at, end, read, x }
}

/** A screen point as the lens shows it. */
export const inLens = (lens: { c: Vec; at: Vec; x: number }, q: Vec): Vec => add(lens.c, mul(sub(q, lens.at), lens.x))

/** The ruler on the screen: its 0, the way its edge runs, its body's side, its size. */
export function rulerGeom(S: Scene) {
  const R = S.ruler!
  const f = S.fitD ?? S.fit
  const u = f?.u ?? 30
  const Z = toScreen(S, R.zero)
  const e = dirS(R.dir)
  // the body lies to the left of the edge, as you look along it
  const n: Vec = [e[1], -e[0]]
  const W = clamp(u * 1.15, 40, 62)
  const pad = 12
  const end = add(Z, mul(e, R.len * u))
  const body = [sub(Z, mul(e, pad)), add(end, mul(e, pad)), add(add(end, mul(e, pad)), mul(n, W)), add(sub(Z, mul(e, pad)), mul(n, W))]
  // the turning handle sits at the far end, or as far along as is still on the screen (always in reach)
  const m = 26
  let t = R.len
  for (const [lo, hi, z, d] of [[m, S.w - m, Z[0], e[0]], [m + 100, S.h - m, Z[1], e[1]]] as const) {
    if (d > 1e-6) t = Math.min(t, (hi - z) / (d * u))
    if (d < -1e-6) t = Math.min(t, (lo - z) / (d * u))
  }
  t = clamp(t, Math.min(1.5, R.len), R.len)
  const turnT = t
  return { Z, e, n, W, u, end, body, turnT, turnAt: add(add(Z, mul(e, turnT * u)), mul(n, W * 0.5)), penAt: R.pen === null ? null : add(Z, mul(e, R.pen * u)) }
}

/** The protractor on the screen: its centre, radius, and where a bearing meets its edge. */
export function protGeom(S: Scene, L = layout(S)) {
  const P = S.prot!
  const C = toScreen(S, P.c)
  // big enough on a phone for its two rings of numbers to stay apart
  const R = clamp(Math.min(S.w, S.h) * (S.w < 560 ? 0.33 : 0.2), 110, 150)
  void L
  // its turning handle is at its 0 end, or the other end, or the top of its rim: whichever is on the screen (always in reach)
  const m = 24
  const seen = (q: Vec) => q[0] > m && q[0] < S.w - m && q[1] > m + 90 && q[1] < S.h - m
  const turnOff = [0, 180, 90].find(k => seen(add(C, mul(dirS(P.rot + k), R + 14)))) ?? 0
  return { C, R, turnOff, turnAt: add(C, mul(dirS(P.rot + turnOff), R + 14)), penAt: P.pen === null ? null : add(C, mul(dirS(P.pen), R + 2)) }
}

/**
 * The protractor's reading lens: once it lies still with a row lit and a line
 * crossing its edge (`spot`), a round window shows that crossing and the
 * nearest number of the row close up (a degree is a hair's width on a
 * phone). It sits outside the protractor, beyond the crossing if there is room.
 */
export function protLensGeom(S: Scene, L = layout(S)) {
  const P = S.prot
  if (!P || !P.lens || P.spot === undefined || !P.lit || !P.on) return null
  if (S.drag?.kind === "prot" || S.drag?.kind === "protTurn") return null
  const G = protGeom(S, L)
  const r = L.compact ? 46 : 58
  const small = L.compact ? 11 : 13
  const cross = add(G.C, mul(dirS(P.spot), G.R))
  // the nearest number on the row being read
  const k = Math.round(norm(P.spot - P.rot) / 10) * 10
  const num = add(G.C, mul(dirS(P.rot + clamp(k, 0, 180)), G.R - small * (P.lit === "outer" ? 1.55 : 3.0)))
  const at = lerpV(cross, num, 0.5)
  const x = clamp((r - small * 1.4) / Math.max(1, dist(cross, num) / 2), 1.6, 3.2)
  const b = L.board
  const fits = (c: Vec) => c[0] - r > b.x0 - 4 && c[0] + r < b.x1 + 4 && c[1] - r > b.y0 - 4 && c[1] + r < b.y1 + 4
  // outside the protractor, clear of the places' letters, and off the lines of the figure if it can be
  const offLines = (c: Vec) => S.segs.every(sg => { if (!S.P[sg.a] || !S.P[sg.b]) return true; const A = ptS(S, sg.a), B = ptS(S, sg.b), d = sub(B, A), l2 = dot(d, d) || 1, t = clamp(dot(sub(c, A), d) / l2, 0, 1); return dist(c, add(A, mul(d, t))) > r + 6 })
  const clear = (c: Vec) => dist(c, G.C) > G.R + r * 0.75 && Object.keys(S.names).every(n => !S.P[n] || dist(c, ptS(S, n)) > r + 14)
  const tries: Vec[] = []
  for (const kk of [1.7, 2.3, 3.0]) for (const dd of [0, 25, -25, 50, -50, 80, -80, 120, -120, 180]) tries.push(add(cross, mul(dirS(P.spot + dd), r * kk)))
  const c = tries.find(q => fits(q) && clear(q) && offLines(q)) ?? tries.find(q => fits(q) && clear(q)) ?? tries.find(fits) ?? tries[0]
  return { c, r, at, cross, x }
}

/**
 * The compasses on the screen: the point, the pencil's tip, the hinge (above
 * the middle of the legs, lower as they open), the knob on top.
 */
export function compGeom(S: Scene) {
  const C = S.comp!
  const f = S.fitD ?? S.fit
  const u = f?.u ?? 30
  const P = toScreen(S, C.point)
  const e = dirS(C.dir)
  const Q = add(P, mul(e, C.open * u))
  // the hinge stands to the left of the legs, as you look from the point to the pencil
  const n: Vec = [e[1], -e[0]]
  const spread = C.open * u
  const H = add(lerpV(P, Q, 0.5), mul(n, clamp(spread * 0.55, 34, 90)))
  const knob = add(H, mul(n, 15))
  return { P, Q, H, knob, e, n, u }
}

/** Whether an arc the compasses drew round `at` with radius `r` passes through the bearing `b` (within `slack` degrees). */
export const arcCovers = (S: Scene, at: Vec, r: number, b: number, slack = 6) => arcsCover(S.penArcs, at, r, b, slack)
export function arcsCover(arcs: PenArc[], at: Vec, r: number, b: number, slack = 6): boolean {
  return arcs.some(a => {
    if (Math.abs(a.r - r) > 1e-6 || Math.hypot(a.at[0] - at[0], a.at[1] - at[1]) > 1e-6) return false
    if (Math.abs(a.sweep) >= 360 - slack) return true
    const lo = a.sweep >= 0 ? a.from : a.from + a.sweep, span = Math.abs(a.sweep)
    return norm(b - lo + slack) <= span + 2 * slack
  })
}

/** After the compasses are carried: their point clicks onto a place. */
function settleComp(S: Scene) {
  const C = S.comp!
  const on = placeNear(S, toScreen(S, C.point), S.touch ? 40 : 30)
  C.on = on
  if (on) C.point = [...S.P[on]] as Vec
}

/** Whether a bearing is on the protractor's half circle (clockwise from its 0 end through 180°). */
const onArc = (P: Prot, b: number) => norm(b - P.rot) <= 180

/** One job at a time: a protractor that is to be moved turns only once its centre is on a place. */
export const protCanTurn = (P: Prot) => P.turn && (P.on !== null || !P.move)

/** The place whose North line the protractor is being turned onto (it glows), if it is still to be turned. */
export function protCue(S: Scene): string | null {
  const P = S.prot
  if (!P || P.want === undefined || P.aim !== undefined || !P.on || !protCanTurn(P) || P.rot === norm(P.want)) return null
  return P.on
}

/** The named place under a screen point, if it is close enough to click onto. */
function placeNear(S: Scene, q: Vec, px = 18): string | null {
  let best: string | null = null, bd = Infinity
  for (const n of Object.keys(S.names)) { if (!S.P[n]) continue; const d = dist(q, ptS(S, n)); if (d < bd) { bd = d; best = n } }
  return best && bd < px ? best : null
}

/** After the ruler moves or turns: what its 0 is on, and what its edge points at (clicking onto them). */
function settleRuler(S: Scene) {
  const R = S.ruler!
  const on = placeNear(S, toScreen(S, R.zero), S.touch ? 26 : 18)
  R.on = on
  if (on) R.zero = [...S.P[on]] as Vec
  R.along = null
  if (!on) return
  for (const n of Object.keys(S.names)) {
    if (n === on || !S.P[n]) continue
    const b = brgOf(S.P[on], S.P[n])
    if (Math.abs(diff(R.dir, b)) < 3.5) { R.dir = b; R.along = n; return }
  }
}

/** After the protractor moves or turns: what its centre is on, and its 0 clicking onto North (either way round). */
function settleProt(S: Scene) {
  const P = S.prot!
  // a protractor's centre is aimed by eye under a big tool: it clicks on from further than a ruler's 0
  const on = placeNear(S, toScreen(S, P.c), S.touch ? 40 : 30)
  P.on = on
  if (on) P.c = [...S.P[on]] as Vec
  for (const m of P.magnets) if (Math.abs(diff(P.rot, m)) < 4) { P.rot = norm(m); break }
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 34 : 22)

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
  const t = tol(S)
  if (S.comp) {
    const C = S.comp, G = compGeom(S)
    if ((C.draw || C.canOpen) && dist(p, G.Q) < t + 16) {
      if (C.draw) { C.drawing = { from: C.dir, to: C.dir }; S.drag = { kind: "compDraw", moved: 0 } } else S.drag = { kind: "compOpen", moved: 0 }
      return true
    }
    // carried by the point (it goes where the finger is), the top, or a leg
    if (C.move && (dist(p, G.P) < t + 18 || dist(p, G.knob) < t + 18 || dist(p, G.H) < t + 12 || distToSeg(p, G.H, G.P) < t || distToSeg(p, G.H, G.Q) < t)) { S.drag = { kind: "compMove", off: sub(G.P, p), moved: 0 }; return true }
    // drawing can start from the top too (it turns round the point)
    if (C.draw && dist(p, G.knob) < t + 18) { C.drawing = { from: C.dir, to: C.dir }; S.drag = { kind: "compDraw", moved: 0 }; return true }
  }
  if (S.prot) {
    const P = S.prot, G = protGeom(S)
    const v = sub(p, G.C), d = Math.hypot(v[0], v[1])
    const b = norm((Math.atan2(v[0], -v[1]) * 180) / Math.PI)
    const centre = touch ? 40 : 30
    const onBody = d < G.R && (d < centre || onArc(P, b))
    if (P.pen !== null && G.penAt && dist(p, G.penAt) < t + 14) { S.drag = { kind: "protPen", moved: 0 }; return true }
    if (protCanTurn(P) && dist(p, G.turnAt) < t + 12) { S.drag = { kind: "protTurn", moved: 0, off: G.turnOff }; return true }
    if (P.move && onBody) { S.drag = { kind: "prot", off: sub(G.C, p), moved: 0 }; return true }
    // one that stays put turns from wherever it is held, as a protractor on paper is turned by hand
    if (!P.move && protCanTurn(P) && onBody && d > centre) { S.drag = { kind: "protTurn", moved: 0, off: norm(b - P.rot) }; return true }
  }
  if (S.ruler) {
    const G = rulerGeom(S)
    if (S.ruler.pen !== null && G.penAt && dist(p, G.penAt) < t + 14) { S.drag = { kind: "rulerPen", moved: 0 }; return true }
    if (S.ruler.turn && dist(p, G.turnAt) < t + 12) { S.drag = { kind: "rulerTurn", moved: 0 }; return true }
    if (S.ruler.move && inPoly(p, G.body)) { S.drag = { kind: "ruler", off: sub(G.Z, p), moved: 0 }; return true }
  }
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
  const L0 = layout(S), keep = (q: Vec): Vec => [clamp(q[0], L0.board.x0, L0.board.x1), clamp(q[1], L0.board.y0, L0.board.y1)]
  if (d.kind === "ruler" && S.ruler) { d.moved += 1; S.ruler.zero = toWorld(S, keep(add(p, d.off))); settleRuler(S); return }
  if (d.kind === "rulerTurn" && S.ruler) {
    d.moved += 1
    const Z = toScreen(S, S.ruler.zero), G = rulerGeom(S)
    // the finger holds the end's middle: turn the edge so that point is under it
    const back = sub(p, mul(G.n, G.W * 0.5))
    S.ruler.dir = Math.round(norm((Math.atan2(back[0] - Z[0], Z[1] - back[1]) * 180) / Math.PI) * 2) / 2
    settleRuler(S)
    return
  }
  if (d.kind === "rulerPen" && S.ruler) {
    d.moved += 1
    const G = rulerGeom(S)
    S.ruler.pen = clamp(Math.round((dot(sub(p, G.Z), G.e) / G.u) * 10) / 10, 0, S.ruler.len)
    // the length asked for clicks on from close by (a finger cannot place a millimetre exactly)
    if (S.ruler.penAt !== undefined && Math.abs(S.ruler.pen - S.ruler.penAt) <= 0.15) S.ruler.pen = S.ruler.penAt
    return
  }
  if (d.kind === "compOpen" && S.comp) {
    d.moved += 1
    const C = S.comp, G = compGeom(S)
    C.open = clamp(Math.round((dot(sub(p, G.P), G.e) / G.u) * 10) / 10, 0.5, S.ruler ? S.ruler.len : 12)
    // the opening asked for clicks on from close by (a millimetre is a hair's width under a finger)
    if (C.openAt !== undefined && Math.abs(C.open - C.openAt) <= (S.touch ? 0.3 : 0.2)) C.open = C.openAt
    return
  }
  if (d.kind === "compMove" && S.comp) { d.moved += 1; S.comp.point = toWorld(S, keep(add(p, d.off))); settleComp(S); return }
  if (d.kind === "compDraw" && S.comp?.drawing) {
    d.moved += 1
    const C = S.comp, P = toScreen(S, C.point), w = S.comp.drawing
    const b = norm((Math.atan2(p[0] - P[0], P[1] - p[1]) * 180) / Math.PI)
    // the arc carries on past a full turn without jumping back
    w.to += diff(w.to, b)
    C.dir = b
    return
  }
  if (d.kind === "prot" && S.prot) { d.moved += 1; S.prot.c = toWorld(S, keep(add(p, d.off))); settleProt(S); return }
  if (d.kind === "protTurn" && S.prot) {
    d.moved += 1
    const C = toScreen(S, S.prot.c)
    S.prot.rot = Math.round(norm((Math.atan2(p[0] - C[0], C[1] - p[1]) * 180) / Math.PI - d.off))
    settleProt(S)
    return
  }
  if (d.kind === "protPen" && S.prot) {
    d.moved += 1
    const C = toScreen(S, S.prot.c)
    const b = Math.round(norm((Math.atan2(p[0] - C[0], C[1] - p[1]) * 180) / Math.PI))
    // it stays on the half circle
    if (onArc(S.prot, b)) S.prot.pen = b
    else S.prot.pen = Math.abs(diff(b, S.prot.rot)) < Math.abs(diff(b, S.prot.rot + 180)) ? norm(S.prot.rot) : norm(S.prot.rot + 180)
    // the angle asked for clicks on from close by (a degree is a hair's width on a phone)
    if (S.prot.penAt !== undefined && Math.abs(diff(S.prot.pen, S.prot.penAt)) <= 2.5) S.prot.pen = norm(S.prot.penAt)
    return
  }
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
  if (d.kind === "pan") d.moved = Math.max(d.moved, dist(p, d.start))
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  if (d.kind === "compDraw" && S.comp?.drawing) {
    const C = S.comp, w = C.drawing!
    C.drawing = null
    const sweep = clamp(w.to - w.from, -360, 360)
    if (Math.abs(sweep) > 1.5) S.penArcs = [...S.penArcs, { id: `pa${S.penArcs.length}`, at: [...C.point] as Vec, r: C.open, from: norm(w.from), sweep }]
    return
  }
  if (d.kind !== "pan" || d.moved > 10) return
  tapAt(S, d.start)
}

function tapAt(S: Scene, p: Vec) {
  if (S.mode === "tapAny") { S.onTap?.(S, p); return }
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
  else if (key === "." && inp.dec && !inp.value.includes(".") && inp.value.length < (inp.max ?? 3)) inp.value += inp.value ? "." : "0."
  else if (/^\d$/.test(key) && inp.value.length < (inp.max ?? 3)) inp.value += key
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const v = Number(inp.value)
  if (!Number.isFinite(v)) return
  // a measured answer: right to the nearest tenth (the drawing is exact), close a little further off
  if (inp.tol !== undefined && v !== inp.answer && Math.abs(v - inp.answer) <= inp.tol + 1e-9) {
    inp.state = "right"; S.note = null; S.touched = "eq"; S.flashGood = 1; inp.onRight?.(S); return
  }
  if (inp.near !== undefined && Math.abs(v - inp.answer) <= inp.near + 1e-9 && v !== inp.answer) {
    inp.tries++; inp.state = "wrong"; inp.wrongAt = S.time
    say(S, inp.nearSay ?? "Close. Look again at where it ends.", "calm", 4)
    return
  }
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
