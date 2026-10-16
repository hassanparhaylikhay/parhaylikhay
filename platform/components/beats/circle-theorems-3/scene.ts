/**
 * The board for "Circle theorems III" (built on the lesson II board). One
 * circle, drawn by the student like a compass, stays for the whole lesson.
 * Points on the circle live as angles, so they ride along when the circle
 * slides or resizes. Points inside it (a chord's midpoint, a point sliding
 * along a chord) are worked out from the points they belong to, every frame.
 *
 * Every angle on screen comes from `S.angles` through one `angleList`.
 * Lengths are in the lesson's centimetres: the radius is always 5 cm.
 *
 * Targets (`O`, `R`, `pts`) are where things ARE; `OD`, `RD`, `ptsD` are
 * what is drawn, eased toward the targets every frame.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp, clampToRect, turn, DEG, RAD } from "../geometry"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const GREY = "#7a7875"
export const CHALK = "#e8e6e0"
export const NEUTRAL = "#c9c7bf"

/** The radius, in the lesson's centimetres. */
export const RADIUS_CM = 5

export type Mode =
  | "none" | "place" | "compass" | "slide" | "join" | "drawChord" | "tapMid" | "drawPerp" | "drawSym"
export type VisKey = "board" | "arcs" | "values" | "letters" | "line" | "keypad" | "hint" | "ticks"
const VIS_KEYS: VisKey[] = ["board", "arcs", "values", "letters", "line", "keypad", "hint", "ticks"]

type Spring = { v: number; t: number }

const TAU = Math.PI * 2
export const dirOf = (a: number): Vec => [Math.cos(a), Math.sin(a)]
export const norm = (a: number) => ((a % TAU) + TAU) % TAU

/** One angle the beat wants on the board. */
export interface AngSpec {
  id: string
  /** vertex and the two points its arms go to ("O" is the centre) */
  at: string
  from: string
  to: string
  /** take the wedge that does not contain the direction to this point (angles at the centre) */
  avoid?: string
  value: (S: Scene) => number
  /** arc radius, as a share of the usual one */
  r?: number
}

export interface Seg { id: string; a: string; b: string }
export interface Chip { tex: string; test: (S: Scene) => boolean }

/**
 * The perpendicular bisector of chord a-b. It grows out from the chord's
 * middle: `stub` is the short piece the student drew, `grow` the time it
 * started to grow right across the circle (null: already across).
 */
export interface Bisector {
  a: string
  b: string
  colour: string
  dashed?: boolean
  stub?: boolean
  grow: number | null
  pulse?: boolean
  /** the centre lights up when the growing line reaches it */
  ringOnReach?: boolean
}

export type EqPart = string | { box: true }
export interface InputState {
  parts: EqPart[]
  answer: number
  value: string
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  hints: string[]
  guess?: boolean
  deg?: boolean
  onRight?: (S: Scene) => void
  help?: (S: Scene, tries: number) => void
}

export interface AngleInfo { id: string; c: Vec; start: number; sweep: number; value: number; r: number; label: Vec }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  // the circle
  O: Vec | null
  OD: Vec | null
  /** the radius the student chose; the board uses it wherever it fits */
  Rwant: number
  R: number
  RD: number
  drawn: boolean
  sweep: { t0: number; a0: number } | null
  compass: { to: Vec } | null
  /** the centre's dot and letter fade out while the centre is "lost" */
  oVis: Spring
  /** when the centre came back (a ring spreads out from it) */
  oRing: number | null
  /** the centre breathes */
  pulseO: boolean

  // points
  /** points on the circle, as angles (screen radians) */
  pts: Record<string, number>
  ptsD: Record<string, number>
  /** points worked out from others, anywhere on the board (a midpoint, a point on a chord) */
  at: Record<string, (S: Scene, drawn: boolean) => Vec>
  /** a point that slides along chord a-b, `t` of the way from a */
  slider: { name: string; a: string; b: string; t: number; tD: number; snapMid: boolean } | null
  showPts: string[]
  letters: Set<string>
  movable: string[]
  /** points that may pass every other point */
  crossOK: Set<string>
  /** two ends of one chord that move together, so the chord keeps its length */
  linked: Record<string, string>
  /** a magnet for the dragged point: the angle to click to, or null */
  snapFn: ((S: Scene, name: string, a: number) => number | null) | null
  lockOnSnap: boolean
  /** closest two points on the circle may come, in degrees */
  minGap: number
  /** the chord turns back and forth by itself between two lengths */
  breathe: { a: string; b: string; mid: number; min: number; max: number; t0: number } | null

  // lines
  segs: Seg[]
  showSegs: Set<string> | "all"
  segDash: Set<string>
  segColour: Record<string, string>
  /** text along a line, worked out every frame (lengths in cm) */
  segText: Record<string, (S: Scene) => string>
  segTextColour: Record<string, string>
  /** where along its line a length sits (0 to 1; the middle when not given) */
  segTextAt: Record<string, number>
  /** lengths written on the centre's side of their line (a chord near the edge has no room outside) */
  segTextIn: Set<string>
  bisectors: Bisector[]
  /** the line of symmetry, once found: its direction */
  symLine: number | null
  joinNeed: [string, string][]
  joinHint: string
  stroke: { from: Vec; to: Vec } | null
  fading: { a: Vec; b: Vec; life: number }[]
  blips: { p: Vec; life: number }[]
  drewOnce: boolean
  /** a drawn chord gets these names */
  chordNames: [string, string]
  /** the centre is hidden: any chord across will do */
  chordFree: boolean
  /** the new chord must point a different way from this one */
  chordDiffer: [string, string] | null
  /** the chord whose middle is tapped, or whose perpendicular is drawn */
  chordOf: [string, string] | null
  /** the line of symmetry the student is asked to draw: its direction */
  symWant: number | null

  // looks
  vis: Record<VisKey, Spring>
  angles: AngSpec[]
  show: Set<string> | "all"
  label: Record<string, string>
  fixed: Record<string, string>
  pulse: Set<string>
  pulseSegs: Set<string>
  /** which way the letter O sits from the centre, kept steady between frames */
  oDir: number | null
  /** a worked step shown on the bottom line during "Show me how" */
  walkTex: string | null
  /** equal-length marks: "AB" one dash, "AB:2" two */
  ticks: string[]
  /** shaded shapes, by their corner names */
  fills: { pts: string[]; color: string }[]
  /** triangle `tri` folds over the line `axis`, carrying `moving` across */
  fold: { axis: [string, string]; tri: [string, string, string]; moving: string; colour: string } | null
  foldAt: number | null
  lineTex: string | null
  lineFn: ((S: Scene) => string) | null
  chips: Chip[]

  got: Set<string>

  // input and feedback
  input: InputState | null
  drag: { name: string } | null
  touch: boolean
  moved: number
  movedBy: Record<string, number>
  releases: number
  snapped: boolean
  locked: boolean
  touched: { kind: "seg"; id: string } | { kind: "pt"; name: string } | { kind: "circle" } | { kind: "bis"; id: string } | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    O: null, OD: null, Rwant: 0, R: 0, RD: 0, drawn: false, sweep: null, compass: null,
    oVis: { v: 1, t: 1 }, oRing: null, pulseO: false,
    pts: {}, ptsD: {}, at: {}, slider: null, showPts: [], letters: new Set(), movable: [], crossOK: new Set(), linked: {},
    snapFn: null, lockOnSnap: true, minGap: 10, breathe: null,
    segs: [], showSegs: "all", segDash: new Set(), segColour: {}, segText: {}, segTextColour: {}, segTextAt: {}, segTextIn: new Set(), bisectors: [], symLine: null,
    joinNeed: [], joinHint: "", stroke: null, fading: [], blips: [], drewOnce: false,
    chordNames: ["A", "B"], chordFree: false, chordDiffer: null, chordOf: null, symWant: null,
    vis, angles: [], show: "all", label: {}, fixed: {}, pulse: new Set(), pulseSegs: new Set(), oDir: null, walkTex: null,
    ticks: [], fills: [], fold: null, foldAt: null, lineTex: null, lineFn: null, chips: [],
    got: new Set(),
    input: null, drag: null, touch: false, moved: 0, movedBy: {}, releases: 0, snapped: false, locked: false,
    touched: null, flashGood: 0, note: null,
  }
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  lineY: number
  lineSize: number
  hintY: number
  keypadTop: number
  labelSize: number
  centre: Vec
  arcR: number
  Rmin: number
  Rmax: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 132
  let y = h - (compact ? 84 : 96)
  let keypadTop = y
  if (on(S, "keypad")) { y -= 112; keypadTop = y }
  const lineSize = compact ? 22 : 27
  let lineY = y
  if (on(S, "line") || S.chips.length) { lineY = y - lineSize; y -= lineSize * 2.4 }
  let hintY = y
  if (on(S, "hint")) { hintY = y - 16; y -= 40 }
  const side = compact ? 18 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 18, y1: Math.max(phraseBottom + 160, y - 18) }
  const centre: Vec = [(board.x0 + board.x1) / 2, (board.y0 + board.y1) / 2]
  const bw = board.x1 - board.x0, bh = board.y1 - board.y0
  // letters and lengths sit just outside the circle, so leave them room
  const Rmax = Math.max(40, Math.min(bw, bh) / 2 - 34)
  const Rmin = Math.min(Rmax, Math.max(60, Math.min(w, h) * 0.13))
  const arcR = clamp(Math.min(w, h) * 0.05, 24, 42)
  return { compact, phraseBottom, board, lineY, lineSize, hintY, keypadTop, labelSize: compact ? 17 : 21, centre, arcR, Rmin, Rmax }
}

export function screenScale(S: Scene) {
  return clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
}

export function resize(S: Scene, w: number, h: number) {
  if (S.w && S.h && S.O && (S.mode === "place" || S.mode === "compass")) {
    const k = Math.min(w, h) / Math.min(S.w, S.h)
    const map = (p: Vec): Vec => add(mul(sub(p, [S.w / 2, S.h / 2]), k), [w / 2, h / 2])
    S.O = map(S.O)
    S.OD = S.OD ? map(S.OD) : S.O
  }
  S.w = w
  S.h = h
}

// ── where things are ─────────────────────────────────────────────────────

/** A point's angle on the circle (target, or drawn). */
export function angOf(S: Scene, name: string, drawn = true): number {
  return (drawn ? S.ptsD[name] : S.pts[name]) ?? S.pts[name] ?? 0
}

/** Where a point is on screen ("O" is the centre). */
export function posOf(S: Scene, ref: string, drawn = true): Vec {
  const c = (drawn ? S.OD : S.O) ?? [S.w / 2, S.h / 2]
  if (ref === "O") return c
  const f = S.at[ref]
  if (f) return f(S, drawn)
  const R = drawn ? S.RD : S.R
  return add(c, mul(dirOf(angOf(S, ref, drawn)), R))
}

/** Is this a point on the circle (not the centre, not worked out from others)? */
export const onCircle = (S: Scene, n: string) => n !== "O" && !S.at[n] && S.pts[n] !== undefined

/** The middle of a and b. */
export const midOf = (a: string, b: string) => (S: Scene, drawn: boolean): Vec =>
  lerpV(posOf(S, a, drawn), posOf(S, b, drawn), 0.5)

/** Put a point on chord a-b that the student can slide along it. */
export function slideOn(S: Scene, name: string, a: string, b: string, t: number, snapMid = false) {
  const keep = S.slider && S.slider.name === name ? S.slider.tD : t
  S.slider = { name, a, b, t, tD: keep, snapMid }
  S.at[name] = (S2, drawn) => {
    const sl = S2.slider
    const k = sl && sl.name === name ? (drawn ? sl.tD : sl.t) : t
    return lerpV(posOf(S2, a, drawn), posOf(S2, b, drawn), k)
  }
}

/** The angle chord XY makes at the centre, the small way round (radians, true positions). */
export function chordArc(S: Scene, X: string, Y: string): number {
  return Math.abs(turn(angOf(S, X, false), angOf(S, Y, false)))
}
/** Chord XY's length in cm. */
export const chordCm = (S: Scene, X: string, Y: string) => 2 * RADIUS_CM * Math.sin(chordArc(S, X, Y) / 2)
/** Chord XY's distance from the centre in cm. */
export const distCm = (S: Scene, X: string, Y: string) => RADIUS_CM * Math.cos(chordArc(S, X, Y) / 2)
/** The centre angle of a chord with this length (cm), in radians. */
export const arcForLength = (cm: number) => 2 * Math.asin(clamp(cm / (2 * RADIUS_CM), 0, 1))
/** The centre angle of a chord this far (cm) from the centre, in radians. */
export const arcForDist = (cm: number) => 2 * Math.acos(clamp(cm / RADIUS_CM, 0, 1))
/** The distance between two points in cm (true positions). */
export function cmBetween(S: Scene, a: string, b: string): number {
  return (dist(posOf(S, a, false), posOf(S, b, false)) / Math.max(1, S.R)) * RADIUS_CM
}
/**
 * A length for the board. A whole number only when it IS one; otherwise one
 * decimal place, or more when one would look whole (7.96, never 8.0), so the
 * board never shows a target the lesson has not accepted.
 */
export function cmText(x: number): string {
  if (Math.abs(x - Math.round(x)) < 1e-6) return `${Math.round(x)}\\text{ cm}`
  for (let d = 1; d <= 3; d++) {
    const r = Math.round(x * 10 ** d) / 10 ** d
    if (Math.abs(r - Math.round(r)) > 1e-9) return `${r.toFixed(d)}\\text{ cm}`
  }
  return `${x.toFixed(3)}\\text{ cm}`
}
/** The rounded value a length shows as, for checking what the student sees. */
export const shown = (x: number) => Math.round(x * 10) / 10

// ── the angle list ───────────────────────────────────────────────────────

export function angleList(S: Scene, L: Layout): AngleInfo[] {
  const out: AngleInfo[] = []
  if (!S.OD) return out
  for (const sp of S.angles) {
    const c = posOf(S, sp.at), pf = posOf(S, sp.from), pt = posOf(S, sp.to)
    const lf = dist(c, pf), lt = dist(c, pt)
    if (lf < 3 || lt < 3) continue
    const a1 = Math.atan2(pf[1] - c[1], pf[0] - c[0]), a2 = Math.atan2(pt[1] - c[1], pt[0] - c[0])
    let sweep = turn(a1, a2)
    if (sp.avoid) {
      const pv = posOf(S, sp.avoid)
      const av = Math.atan2(pv[1] - c[1], pv[0] - c[0])
      const rel = turn(a1, av)
      const inside = Math.sign(rel) === Math.sign(sweep) && Math.abs(rel) < Math.abs(sweep)
      if (inside) sweep = sweep - Math.sign(sweep) * TAU
    }
    if (Math.abs(sweep) < 0.01) continue
    const r = Math.min(L.arcR * (sp.r ?? 1), Math.min(lf, lt) * 0.42)
    out.push(finish(sp.id, { c, start: a1, sweep }, sp.value(S), r, L))
  }
  return out
}

function finish(id: string, w: { c: Vec; start: number; sweep: number }, value: number, r: number, L: Layout): AngleInfo {
  const bis = w.start + w.sweep / 2
  const half = Math.abs(w.sweep) / 2
  const size = L.labelSize
  // narrow angles push their label out just far enough to clear both arms
  const d = Math.min(100, Math.max(r + size * 1.05, (size * 0.62) / Math.max(0.14, Math.sin(Math.min(half, Math.PI / 2)))))
  return { id, c: w.c, start: w.start, sweep: w.sweep, value, r, label: add(w.c, mul(dirOf(bis), d)) }
}

/** The angle at V between the lines to X and Y, from the true positions, in whole degrees. */
export function trueAngle(S: Scene, V: string, X: string, Y: string): number {
  const v = posOf(S, V, false), x = posOf(S, X, false), y = posOf(S, Y, false)
  const a = Math.atan2(x[1] - v[1], x[0] - v[0]), b = Math.atan2(y[1] - v[1], y[0] - v[0])
  return Math.round(Math.abs(turn(a, b)) * DEG)
}

// ── perpendicular bisectors ──────────────────────────────────────────────

/** How far out past the circle a bisector reaches, in radii. */
const BIS_REACH = 1.12

/** Where a bisector is drawn right now: its two ends, and how far it has grown towards the centre. */
export function bisectorEnds(S: Scene, b: Bisector): { p: Vec; q: Vec; M: Vec; n: Vec; toO: number; grownToO: number } | null {
  if (!S.OD) return null
  const A = posOf(S, b.a), B = posOf(S, b.b)
  const M = lerpV(A, B, 0.5)
  const d = sub(B, A), l = Math.hypot(d[0], d[1])
  if (l < 2) return null
  // the bisector's direction, pointing from the chord towards the centre
  let n: Vec = [-d[1] / l, d[0] / l]
  if (dot(n, sub(S.OD, M)) < 0) n = mul(n, -1)
  const R = S.RD
  const toO = dist(M, S.OD)
  // full reach on each side of M: through the centre and out past the far side, and out past the near side
  const far = toO + R * BIS_REACH
  const near = Math.max(0, R * BIS_REACH - toO)
  const stub = R * 0.32
  let k = 1
  if (b.stub) k = 0
  else if (b.grow !== null) k = easeOut(clamp((S.time - b.grow) / 1.5, 0, 1))
  const fl = stub + (far - stub) * k
  const nl = Math.min(near, stub) + (near - Math.min(near, stub)) * k
  return { p: add(M, mul(n, fl)), q: add(M, mul(n, -nl)), M, n, toO, grownToO: fl }
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

// ── animation ────────────────────────────────────────────────────────────

/** Keep the circle in the middle of the room it has, as big as the student made it where it fits. */
function fit(S: Scene, L: Layout) {
  if (!S.O || !S.drawn) return
  if (S.mode === "place" || S.mode === "compass") return
  const bw = L.board.x1 - L.board.x0 - 68, bh = L.board.y1 - L.board.y0 - 68
  const R = Math.min(S.Rwant, L.Rmax, bw / 2, bh / 2)
  S.R = Math.max(R, 30)
  S.O = [L.centre[0], L.centre[1]]
}

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  S.oVis.v += (S.oVis.t - S.oVis.v) * k(0.08)
  const L = layout(S)
  fit(S, L)
  const f = k(0.16)
  if (S.O) {
    if (!S.OD) S.OD = [S.O[0], S.O[1]]
    S.OD = lerpV(S.OD, S.O, f)
    S.RD += (S.R - S.RD) * f
  }
  if (S.breathe && !S.drag) {
    const b = S.breathe
    const t = 0.5 - 0.5 * Math.cos((TAU * (S.time - b.t0)) / 6)
    const arc = (b.min + (b.max - b.min) * t) * RAD
    S.pts[b.a] = b.mid + arc / 2
    S.pts[b.b] = b.mid - arc / 2
  }
  const fp = k(S.drag ? 0.45 : 0.16)
  for (const n of Object.keys(S.pts)) {
    if (S.ptsD[n] === undefined) { S.ptsD[n] = S.pts[n]; continue }
    S.ptsD[n] += turn(S.ptsD[n], S.pts[n]) * fp
  }
  if (S.slider) S.slider.tD += (S.slider.t - S.slider.tD) * fp
  // a bisector growing towards a hidden or quiet centre lights it when it gets there
  for (const b of S.bisectors) {
    if (!b.ringOnReach || b.grow === null || S.oRing !== null) continue
    const e = bisectorEnds(S, b)
    if (e && e.grownToO >= e.toO) { S.oRing = S.time; S.pulseO = true }
  }
  if (S.sweep && !S.drawn && S.time - S.sweep.t0 >= 1.05) S.drawn = true
  for (const fd of S.fading) fd.life -= dt * 1.4
  S.fading = S.fading.filter(fd => fd.life > 0)
  for (const b of S.blips) b.life -= dt * 1.1
  S.blips = S.blips.filter(b => b.life > 0)
  S.flashGood = Math.max(0, S.flashGood - dt)
  if (S.note && S.time > S.note.until) S.note = null
}

// ── beat helpers ─────────────────────────────────────────────────────────

export function show(S: Scene, keys: VisKey[]) {
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
}

export function resetBeat(S: Scene) {
  S.mode = "none"
  S.compass = null
  S.stroke = null
  S.drag = null
  S.moved = 0
  S.movedBy = {}
  S.releases = 0
  S.snapped = false
  S.locked = false
  S.movable = []
  S.crossOK = new Set()
  S.linked = {}
  S.snapFn = null
  S.lockOnSnap = true
  S.minGap = 10
  S.breathe = null
  S.oRing = null
  S.pulseO = false
  S.joinNeed = []
  S.joinHint = ""
  S.chordNames = ["A", "B"]
  S.chordFree = false
  S.chordDiffer = null
  S.chordOf = null
  S.symWant = null
  S.symLine = null
  S.angles = []
  S.show = "all"
  S.showSegs = "all"
  S.segDash = new Set()
  S.segColour = {}
  S.segText = {}
  S.segTextColour = {}
  S.segTextAt = {}
  S.segTextIn = new Set()
  S.label = {}
  S.fixed = {}
  S.pulse = new Set()
  S.pulseSegs = new Set()
  S.walkTex = null
  S.ticks = []
  S.fills = []
  S.fold = null
  S.foldAt = null
  S.lineTex = null
  S.lineFn = null
  S.chips = []
  S.got = new Set()
  S.input = null
  S.touched = null
  S.note = null
}

export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

export function startInput(S: Scene, spec: Omit<InputState, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

/** A circle for a beat opened cold: in the middle, a good size. */
export function ensureCircle(S: Scene) {
  if (S.O && S.drawn) return
  const L = layout(S)
  S.O = [L.centre[0], L.centre[1]]
  S.OD = [L.centre[0], L.centre[1]]
  S.Rwant = L.Rmin + (L.Rmax - L.Rmin) * 0.85
  S.R = S.Rwant
  S.RD = S.Rwant
  S.drawn = true
  S.sweep = { t0: S.time - 5, a0: 0 }
}

/** Put points at angles given in degrees (they glide there). */
export function place(S: Scene, at: Record<string, number>) {
  for (const [n, d] of Object.entries(at)) {
    S.pts[n] = d * RAD
    if (S.ptsD[n] === undefined) S.ptsD[n] = d * RAD
  }
}

export function setSegs(S: Scene, segs: [string, string][]) {
  S.segs = segs.map(([a, b]) => ({ id: a + b, a, b }))
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 44 : 30)

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const L = layout(S)
  if (S.mode === "place") {
    if (S.O) return false
    const inset = L.Rmin + 34
    const q = clampToRect(p, { x0: L.board.x0 + inset, x1: L.board.x1 - inset, y0: L.board.y0 + inset, y1: L.board.y1 - inset })
    S.O = [q[0], q[1]]
    S.OD = [q[0], q[1]]
    S.R = 0
    S.RD = 0
    S.drawn = false
    S.sweep = null
    S.flashGood = 0.6
    return false
  }
  if (S.mode === "compass") {
    if (!S.O || S.drawn || S.sweep) return false
    S.compass = { to: p }
    S.drewOnce = true
    return true
  }
  if (S.mode === "slide") {
    let best: string | null = null, bd = Infinity
    for (const n of S.movable) {
      const d = dist(p, posOf(S, n))
      if (d < bd) { bd = d; best = n }
    }
    if (!best || bd > tol(S) + 6 || S.locked) return false
    S.drag = { name: best }
    S.touched = { kind: "pt", name: best }
    return true
  }
  if (S.mode === "join" || S.mode === "drawChord" || S.mode === "drawPerp" || S.mode === "drawSym") {
    S.stroke = { from: p, to: p }
    S.drewOnce = true
    return true
  }
  if (S.mode === "tapMid" && S.chordOf) {
    if (S.got.has("mid")) return false
    const [a, b] = S.chordOf
    const A = posOf(S, a), B = posOf(S, b)
    const ab = sub(B, A), l = Math.hypot(ab[0], ab[1]) || 1
    if (distToSeg(p, A, B) > tol(S) + 6) { say(S, "Tap on the chord itself.", "calm", 2); return false }
    const t = clamp(dot(sub(p, A), ab) / (l * l), 0, 1)
    if (Math.abs(t - 0.5) * l > Math.max(tol(S) * 0.55, l * 0.07)) {
      S.blips.push({ p: add(A, mul(ab, t)), life: 1 })
      say(S, "Look at the two halves. Make them equal.")
      return false
    }
    S.got.add("mid")
    S.at.M = midOf(a, b)
    if (!S.showPts.includes("M")) S.showPts = [...S.showPts, "M"]
    S.letters.add("M")
    S.touched = { kind: "pt", name: "M" }
    S.flashGood = 1
    S.note = null
    return false
  }
  return false
}

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

/** How far from the centre the compass may reach without leaving the board. */
function maxFit(S: Scene, L: Layout) {
  if (!S.O) return 0
  const b = L.board
  return Math.min(S.O[0] - b.x0, b.x1 - S.O[0], S.O[1] - b.y0, b.y1 - S.O[1]) - 30
}

export function compassR(S: Scene, L: Layout) {
  if (!S.O || !S.compass) return 0
  return clamp(dist(S.compass.to, S.O), 0, Math.min(maxFit(S, L), L.Rmax))
}

/** The angle at the sliding point between the line to the centre and the chord, from where it is. */
export function sliderAngle(S: Scene, t: number): number {
  const sl = S.slider
  if (!sl) return 0
  const A = posOf(S, sl.a, false), B = posOf(S, sl.b, false), O = posOf(S, "O", false)
  const X = lerpV(A, B, t)
  const u = sub(O, X), v = sub(A, X)
  return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], dot(u, v))) * DEG
}

export function pointerMove(S: Scene, p: Vec) {
  const L = layout(S)
  if (S.compass) { S.compass.to = p; return }
  if (S.stroke) { S.stroke.to = clampToRect(p, L.board); return }
  if (!S.drag || !S.OD) return
  const name = S.drag.name
  const sl = S.slider
  if (sl && name === sl.name) {
    const A = posOf(S, sl.a), B = posOf(S, sl.b)
    const ab = sub(B, A), l2 = Math.max(1e-9, dot(ab, ab))
    let t = clamp(dot(sub(p, A), ab) / l2, 0.06, 0.94)
    S.snapped = false
    // the right angle is a magnet: within a few degrees, it clicks to the middle
    if (sl.snapMid && Math.abs(sliderAngle(S, t) - 90) < 4) { t = 0.5; S.snapped = true }
    S.moved += Math.abs(t - sl.t) * Math.sqrt(l2)
    S.movedBy[name] = (S.movedBy[name] ?? 0) + Math.abs(t - sl.t) * Math.sqrt(l2)
    sl.t = t
    return
  }
  const a = Math.atan2(p[1] - S.OD[1], p[0] - S.OD[0])
  S.snapped = false
  const snap = S.snapFn?.(S, name, a)
  if (snap !== null && snap !== undefined) {
    // a magnet the beat chose: it may land a point exactly on another
    const d = turn(S.pts[name], snap)
    S.pts[name] = snap
    const partner = S.linked[name]
    if (partner) S.pts[partner] += d
    S.snapped = true
    S.moved += Math.abs(d) * DEG
    S.movedBy[name] = (S.movedBy[name] ?? 0) + Math.abs(d) * DEG
    return
  }
  tryMove(S, name, a)
}

/**
 * Move a point along the circle, unless that breaks a rule of the beat:
 * points keep their order round the circle unless allowed to cross, and
 * never sit on top of each other. A linked point moves with it.
 */
function tryMove(S: Scene, name: string, a: number) {
  const old = S.pts[name]
  const d = turn(old, a)
  if (Math.abs(d) < 1e-7) return
  const moving: { n: string; from: number }[] = [{ n: name, from: old }]
  const partner = S.linked[name]
  if (partner) moving.push({ n: partner, from: S.pts[partner] })
  const others = S.showPts.filter(n => !moving.some(m => m.n === n) && onCircle(S, n))
  for (const m of moving) {
    for (const o of others) {
      const cross = S.crossOK.has(m.n)
      const rel = turn(m.from, S.pts[o])
      const end = Math.abs(turn(m.from + d, S.pts[o]))
      if (end < (cross ? 4 : S.minGap) * RAD) return
      if (!cross && Math.sign(rel) === Math.sign(d) && Math.abs(rel) <= Math.abs(d)) return
    }
  }
  for (const m of moving) S.pts[m.n] = m.from + d
  const step = Math.abs(d) * DEG
  S.moved += step
  for (const m of moving) S.movedBy[m.n] = (S.movedBy[m.n] ?? 0) + step
}

export function pointerUp(S: Scene) {
  const L = layout(S)
  if (S.compass && S.O) {
    const R = compassR(S, L)
    const a0 = Math.atan2(S.compass.to[1] - S.O[1], S.compass.to[0] - S.O[0])
    S.compass = null
    if (R < L.Rmin * 0.92) { say(S, "Make it a bit bigger."); return }
    S.Rwant = R
    S.R = R
    S.RD = R
    S.sweep = { t0: S.time, a0 }
    S.touched = { kind: "circle" }
    return
  }
  if (S.stroke) { endStroke(S); return }
  if (!S.drag) return
  S.drag = null
  S.releases++
  if (S.snapped && S.lockOnSnap) S.locked = true
}

// ── strokes: chords, joins, the perpendicular, the line of symmetry ──────

/** The angle between two lines, ignoring which way they point (0 to 90 degrees). */
function lineGap(a: number, b: number) {
  const d = Math.abs(turn(a, b)) * DEG
  return Math.min(d, 180 - d)
}

function endStroke(S: Scene) {
  const st = S.stroke!
  S.stroke = null
  const fade = () => S.fading.push({ a: st.from, b: st.to, life: 1 })
  const length = dist(st.from, st.to)
  if (length < 24) return
  const O = S.OD!, R = S.RD
  const u: Vec = mul(sub(st.to, st.from), 1 / length)
  const ang = Math.atan2(u[1], u[0])
  const offFrom = (q: Vec) => Math.abs((q[0] - st.from[0]) * u[1] - (q[1] - st.from[1]) * u[0])
  const off = offFrom(O)

  if (S.mode === "drawChord") {
    if (length < R * 0.6) { fade(); say(S, "Draw it right across the circle."); return }
    if (!S.chordFree && off < R * 0.2) { fade(); say(S, "Miss the centre this time."); return }
    if (off > R * 0.86) { fade(); say(S, "Make it go right across the circle."); return }
    if (S.chordDiffer) {
      const [x, y] = S.chordDiffer.map(n => posOf(S, n))
      const other = Math.atan2(y[1] - x[1], y[0] - x[0])
      if (lineGap(ang, other) < 25) { fade(); say(S, "Try one that points a different way."); return }
    }
    const foot = add(st.from, mul(u, dot(sub(O, st.from), u)))
    const hc = Math.sqrt(Math.max(0, R * R - off * off))
    const e = sub(foot, mul(u, hc)), f = add(foot, mul(u, hc))
    const [n1, n2] = S.chordNames
    S.pts[n1] = Math.atan2(e[1] - O[1], e[0] - O[0])
    S.ptsD[n1] = S.pts[n1]
    S.pts[n2] = Math.atan2(f[1] - O[1], f[0] - O[0])
    S.ptsD[n2] = S.pts[n2]
    S.showPts = Array.from(new Set([...S.showPts, n1, n2]))
    if (!S.segs.some(s => s.id === n1 + n2)) S.segs = [...S.segs, { id: n1 + n2, a: n1, b: n2 }]
    S.touched = { kind: "seg", id: n1 + n2 }
    S.flashGood = 1
    return
  }
  if (S.mode === "drawPerp" && S.chordOf) {
    const [a, b] = S.chordOf
    const A = posOf(S, a), B = posOf(S, b)
    const M = lerpV(A, B, 0.5)
    const chord = Math.atan2(B[1] - A[1], B[0] - A[0])
    const passes = offFrom(M) < tol(S) + 4 && Math.min(dist(st.from, M), dist(st.to, M), distToSeg(M, st.from, st.to)) < length
    if (!passes) { fade(); say(S, "Make it pass through $M$."); return }
    if (lineGap(ang, chord) < 90 - 14) { fade(); say(S, "Make it meet the chord at $90^\\circ$."); return }
    S.bisectors = [...S.bisectors.filter(x => x.a + x.b !== a + b), { a, b, colour: CHALK, stub: true, grow: null }]
    S.touched = { kind: "bis", id: a + b }
    S.flashGood = 1
    S.got.add("perp")
    return
  }
  if (S.mode === "drawSym" && S.symWant !== null) {
    if (length < R * 0.8) { fade(); say(S, "Draw it right across the circle."); return }
    if (off > Math.max(18, R * 0.12)) { fade(); say(S, "A line of symmetry here goes through the centre."); return }
    if (lineGap(ang, S.symWant) > 8) { fade(); say(S, "Fold along your line in your head. One chord must land on the other."); return }
    S.symLine = S.symWant
    S.touched = { kind: "seg", id: "@sym" }
    S.flashGood = 1.2
    S.got.add("sym")
    return
  }
  if (S.mode === "join") {
    const refs = [...S.showPts, "O"]
    const nearest = (q: Vec) => {
      let best: string | null = null, bd = Infinity
      for (const r of refs) { const d = dist(q, posOf(S, r)); if (d < bd) { bd = d; best = r } }
      return bd < tol(S) + 8 ? best : null
    }
    const r1 = nearest(st.from), r2 = nearest(st.to)
    const need = r1 && r2 && r1 !== r2 ? S.joinNeed.find(([x, y]) => (x === r1 && y === r2) || (x === r2 && y === r1)) : null
    if (!need) { fade(); say(S, S.joinHint || "Start and end on the points."); return }
    const id = need[0] + need[1]
    if (S.segs.some(s => s.id === id)) return
    S.segs = [...S.segs, { id, a: need[0], b: need[1] }]
    S.touched = { kind: "seg", id }
    S.flashGood = 0.8
    return
  }
}

/** Every join the beat asks for is drawn. */
export const joined = (S: Scene) => S.joinNeed.every(([a, b]) => S.segs.some(s => s.id === a + b))

// ── typed answers ────────────────────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "back") { inp.value = inp.value.slice(0, -1); inp.state = "idle"; return }
  if (key === "go") { check(S); return }
  if (/^\d$/.test(key) && inp.value.length < 4) {
    if (inp.state === "wrong") inp.value = ""
    inp.value += key
    inp.state = "idle"
  }
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const v = Number(inp.value)
  if (inp.guess) {
    const hit = v === inp.answer
    inp.state = hit ? "right" : "guessed"
    say(S, hit ? "Spot on." : "Let's see.", "calm", 2.4)
    inp.onRight?.(S)
    return
  }
  if (v === inp.answer) {
    inp.state = "right"
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  inp.help?.(S, inp.tries)
  if (inp.hints.length) S.vis.hint.t = 1
}

export { dist, lerpV, clamp, turn, RAD, DEG }
