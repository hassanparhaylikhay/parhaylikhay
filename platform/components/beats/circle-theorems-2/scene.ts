/**
 * The board for "Circle theorems II" (built on the lesson I board). One circle, drawn by the student like
 * a compass, stays for the whole lesson. Points live ON the circle as
 * angles, so they ride along when the circle slides or resizes.
 *
 * Every angle on screen comes from `S.angles` (an id, a vertex, two arms
 * and a value rule) through one `angleList`. Values come from arcs, so
 * related angles always read consistently: the angle at the centre is
 * exactly twice the shown angle at the circumference, and two points in
 * one segment always read the same.
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

export type Mode =
  | "none" | "place" | "compass" | "slide" | "tapPoint" | "join" | "drawDiam" | "drawChord" | "drawThrough"
  | "tapAngle" | "tapLine" | "tapRegion" | "tapPts" | "drawTan"
export type VisKey = "board" | "arcs" | "values" | "letters" | "line" | "keypad" | "hint" | "tints" | "ticks" | "half"
const VIS_KEYS: VisKey[] = ["board", "arcs", "values", "letters", "line", "keypad", "hint", "tints", "ticks", "half"]

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
  /** custom geometry, for pieces not drawn between two named points */
  geom?: (S: Scene) => { c: Vec; start: number; sweep: number } | null
  /** arc radius, as a share of the usual one */
  r?: number
  /** draw just a dashed outline (a gap waiting to be filled) */
  outline?: boolean
  /** a colour that follows the board (Q changes colour in the other segment) */
  colour?: (S: Scene) => string
}

export interface Seg { id: string; a: string; b: string }
/** A tinted part of the circle cut off by chord a-b: `side` is "minor", "major", or the name of a point in that part. */
export interface Tint { a: string; b: string; side: string; color: string }
export interface Chip { tex: string; test: (S: Scene) => boolean }

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

export interface AngleInfo { id: string; c: Vec; start: number; sweep: number; value: number; r: number; label: Vec; outline?: boolean }

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

  // points on the circle, as angles (screen radians)
  pts: Record<string, number>
  ptsD: Record<string, number>
  /** points worked out from others (the far end of the diameter through P) */
  derived: Record<string, (S: Scene, drawn: boolean) => number>
  showPts: string[]
  letters: Set<string>
  movable: string[]
  /** points that may pass every other point */
  crossOK: Set<string>
  /** points that others may pass (P and Q pass each other; A and B, the chord ends, stay walls) */
  passable: Set<string>
  diamLock: boolean
  snaps: { name: string; at: number[] } | null
  lockOnSnap: boolean
  /** limits on the arc AB away from P, in degrees */
  arcLimit: { min: number; max: number } | null
  /** keep the centre inside angle APB (the proof needs it) */
  proofLimit: boolean
  tapName: string | null

  // lines
  segs: Seg[]
  showSegs: Set<string> | "all"
  joinNeed: [string, string][]
  joinHint: string
  stroke: { from: Vec; to: Vec } | null
  fading: { a: Vec; b: Vec; life: number }[]
  drewOnce: boolean

  // looks
  vis: Record<VisKey, Spring>
  angles: AngSpec[]
  show: Set<string> | "all"
  label: Record<string, string>
  fixed: Record<string, string>
  pulse: Set<string>
  pulseSegs: Set<string>
  segColour: Record<string, string>
  pulseCircle: boolean
  /** points that glow: the two points an angle is made from */
  pulsePts: Set<string>
  /** which way the letter O sits from the centre, kept steady between frames */
  oDir: number | null
  /** a worked step shown on the bottom line during "Show me how" */
  walkTex: string | null

  /** points off the circle, in radii from the centre (so they scale with it) */
  free: Record<string, Vec>
  freeD: Record<string, Vec>
  /** points that may be pulled off the circle, and snap back on near it */
  offOK: Set<string>
  /** how far from the centre a free point may go, in radii */
  freeLimit: { min: number; max: number }
  /**
   * A straight line: its foot is `d` radii from O in direction `t`, it runs
   * square to that direction, turned `tilt` about the foot.
   */
  tline: { t: number; d: number; tilt: number } | null
  tlineD: { t: number; d: number; tilt: number } | null
  tlineMode: "none" | "slide" | "tilt"
  /** the line stays the tangent at this point */
  tlineFollow: string | null
  /** text written along a line, worked out every frame (lengths in cm) */
  segText: Record<string, (S: Scene) => string>
  /** a ring round the centre with 360 beside it */
  ringAt: boolean
  /** triangle OAP folding over OP onto OBP: when it started */
  foldAt: number | null
  /** tangents drawn from this outside point so far ("A", "B") */
  tanFrom: string | null
  tanMade: string[]
  /** tap several points in a row; once all are down they are lettered in order round the circle */
  tapQueue: string[]
  /** a tap that lands in the wrong place gets this note (null: fine) */
  tapCheck: ((S: Scene, a: number) => string | null) | null
  /** closest two points on the circle may come, in degrees */
  minGap: number
  /** leave room for the straight line this far out from the centre, in radii (0: none) */
  lineRoom: number
  ticks: string[]
  tints: Tint[]
  /** shaded triangles, by their corner names */
  fills: { pts: string[]; color: string }[]
  half: { at: string; from: string; to: string; via: string } | null
  /** angle copies flying to the centre: id of the original, start time */
  fly: Record<string, number>
  lineTex: string | null
  lineFn: ((S: Scene) => string) | null
  chips: Chip[]

  // taps
  tapIds: string[] | null
  onTap: ((S: Scene, id: string) => void) | null
  onTapLine: ((S: Scene, id: string) => void) | null
  onTapRegion: ((S: Scene, side: "minor" | "major") => void) | null
  onTapPt: ((S: Scene, name: string) => void) | null
  regionChord: [string, string] | null
  got: Set<string>
  tapRing: Vec | null

  // input and feedback
  input: InputState | null
  /** a point by name, or "@line" for the straight line */
  drag: { name: string } | null
  touch: boolean
  moved: number
  movedBy: Record<string, number>
  releases: number
  snapped: boolean
  locked: boolean
  touched: { kind: "seg"; id: string } | { kind: "pt"; name: string } | { kind: "circle" } | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    O: null, OD: null, Rwant: 0, R: 0, RD: 0, drawn: false, sweep: null, compass: null,
    pts: {}, ptsD: {}, derived: {}, showPts: [], letters: new Set(), movable: [], crossOK: new Set(), passable: new Set(), diamLock: false,
    snaps: null, lockOnSnap: true, arcLimit: null, proofLimit: false, tapName: null,
    segs: [], showSegs: "all", joinNeed: [], joinHint: "", stroke: null, fading: [], drewOnce: false,
    vis, angles: [], show: "all", label: {}, fixed: {}, pulse: new Set(), pulseSegs: new Set(), segColour: {}, pulseCircle: false, pulsePts: new Set(), oDir: null, walkTex: null,
    free: {}, freeD: {}, offOK: new Set(), freeLimit: { min: 1.25, max: 2.4 }, tline: null, tlineD: null, tlineMode: "none", tlineFollow: null,
    segText: {}, ringAt: false, foldAt: null, tanFrom: null, tanMade: [], tapQueue: [], tapCheck: null, minGap: 10, lineRoom: 0,
    ticks: [], tints: [], fills: [], half: null, fly: {}, lineTex: null, lineFn: null, chips: [],
    tapIds: null, onTap: null, onTapLine: null, onTapRegion: null, onTapPt: null, regionChord: null, got: new Set(), tapRing: null,
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
  // letters sit just outside the circle, so leave them room
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
  if (S.derived[name]) return S.derived[name](S, drawn)
  return (drawn ? S.ptsD[name] : S.pts[name]) ?? S.pts[name] ?? 0
}

/** Where a point is on screen ("O" is the centre). */
export function posOf(S: Scene, ref: string, drawn = true): Vec {
  const c = (drawn ? S.OD : S.O) ?? [S.w / 2, S.h / 2]
  if (ref === "O") return c
  const R = drawn ? S.RD : S.R
  const f = drawn ? S.freeD[ref] ?? S.free[ref] : S.free[ref]
  if (f && S.free[ref]) return add(c, mul(f, R))
  return add(c, mul(dirOf(angOf(S, ref, drawn)), R))
}

/** The two points where tangents from an outside point P touch the circle (angles). */
export function tangentAngles(S: Scene, P: string, drawn = true): [number, number] {
  const f = (drawn ? S.freeD[P] : null) ?? S.free[P] ?? [2, 0]
  const k = Math.max(1.0001, Math.hypot(f[0], f[1]))
  const phi = Math.atan2(f[1], f[0])
  const w = Math.acos(1 / k)
  return [phi - w, phi + w]
}

/** Tangent length from P, in the lesson's centimetres (radius 5 cm), to 1 decimal place. */
export function tangentCm(S: Scene, P: string): number {
  const f = S.free[P] ?? [2, 0]
  const k = Math.hypot(f[0], f[1])
  return Math.round(Math.sqrt(Math.max(0, k * k - 1)) * 5 * 10) / 10
}

/** The straight line on screen: a point on it and its direction. */
export function lineGeom(S: Scene, drawn = true): { F: Vec; u: Vec; n: Vec } | null {
  const l = drawn ? S.tlineD ?? S.tline : S.tline
  const O = drawn ? S.OD : S.O
  if (!l || !O) return null
  const R = drawn ? S.RD : S.R
  const n = dirOf(l.t)
  const F = add(O, mul(n, l.d * R))
  const u = dirOf(l.t + Math.PI / 2 + l.tilt)
  return { F, u, n }
}

/** Where the straight line meets the circle (0, 1 or 2 points). */
export function lineHits(S: Scene): Vec[] {
  const g = lineGeom(S)
  if (!g || !S.OD) return []
  const R = S.RD
  const w = sub(g.F, S.OD)
  const b = dot(w, g.u), cc = dot(w, w) - R * R
  const disc = b * b - cc
  if (disc < -1e-6) return []
  if (disc < R * R * 0.0004) return [add(g.F, mul(g.u, -b))]
  const r = Math.sqrt(disc)
  return [add(g.F, mul(g.u, -b - r)), add(g.F, mul(g.u, -b + r))]
}

/** The angles of quadrilateral ABCD: on the circle, opposite angles add to exactly 180. */
export function quadVals(S: Scene, q: [string, string, string, string]): Record<string, number> {
  const [A, B, C, D] = q
  const onCircle = q.every(n => !S.free[n])
  if (onCircle) {
    const a = Math.round(arcDeg(S, D, B, A) / 2 + 1e-9)
    const b = Math.round(arcDeg(S, A, C, B) / 2 + 1e-9)
    return { [A]: a, [C]: 180 - a, [B]: b, [D]: 180 - b }
  }
  // off the circle: the true corner angles, whole degrees adding to 360
  const P = q.map(n => posOf(S, n, false))
  const raw = P.map((p, i) => {
    const u = sub(P[(i + 3) % 4], p), v = sub(P[(i + 1) % 4], p)
    return Math.abs(Math.atan2(u[0] * v[1] - u[1] * v[0], dot(u, v))) * DEG
  })
  const fl = raw.map(x => Math.floor(x + 1e-9))
  const rem = Math.round(360 - fl.reduce((x, y) => x + y, 0))
  const order = raw.map((x, i) => [x - fl[i], i] as const).sort((p2, q2) => q2[0] - p2[0])
  for (let k = 0; k < rem && k < 4; k++) fl[order[k][1]]++
  return { [A]: fl[0], [B]: fl[1], [C]: fl[2], [D]: fl[3] }
}

/** Is angle t on the arc that runs from x the way that does not pass through v, to y? */
export function onArc(x: number, y: number, notV: number, t: number): boolean {
  const len = norm(y - x)
  const vIn = norm(notV - x) < len
  const tIn = norm(t - x) < len
  return vIn ? !tIn : tIn
}

/** The arc from X to Y that does not contain V, in degrees (from the true positions). */
export function arcDeg(S: Scene, X: string, Y: string, V: string): number {
  const x = angOf(S, X, false), y = angOf(S, Y, false), v = angOf(S, V, false)
  const len = norm(y - x)
  return (norm(v - x) < len ? TAU - len : len) * DEG
}

/** The angle at V (on the circle) between chords to X and Y, in whole degrees. */
export function insc(S: Scene, V: string, X: string, Y: string): number {
  return Math.round(arcDeg(S, X, Y, V) / 2 + 1e-9)
}

/** The angles of triangle VXY drawn in the circle, in whole degrees adding to exactly 180. */
export function triVals(S: Scene, V: string, X: string, Y: string): Record<string, number> {
  const raw = [arcDeg(S, X, Y, V) / 2, arcDeg(S, V, Y, X) / 2, arcDeg(S, V, X, Y) / 2]
  const fl = raw.map(x => Math.floor(x + 1e-9))
  const rem = Math.round(180 - fl.reduce((s, x) => s + x, 0))
  const order = raw.map((x, i) => [x - fl[i], i] as const).sort((p, q) => q[0] - p[0])
  for (let k = 0; k < rem && k < 3; k++) fl[order[k][1]]++
  return { [V]: fl[0], [X]: fl[1], [Y]: fl[2] }
}

/** Do V and W lie in the same segment cut off by chord XY? */
export function sameSide(S: Scene, X: string, Y: string, V: string, W: string): boolean {
  const x = angOf(S, X, false), y = angOf(S, Y, false)
  return onArc(x, y, angOf(S, V, false), angOf(S, W, false)) === false
}

// ── the angle list ───────────────────────────────────────────────────────

export function angleList(S: Scene, L: Layout): AngleInfo[] {
  const out: AngleInfo[] = []
  if (!S.OD) return out
  for (const sp of S.angles) {
    let g: { c: Vec; start: number; sweep: number } | null
    let sideMin = Infinity
    if (sp.geom) g = sp.geom(S)
    else {
      const c = posOf(S, sp.at), pf = posOf(S, sp.from), pt = posOf(S, sp.to)
      const lf = dist(c, pf), lt = dist(c, pt)
      if (lf < 3 || lt < 3) continue
      sideMin = Math.min(lf, lt)
      const a1 = Math.atan2(pf[1] - c[1], pf[0] - c[0]), a2 = Math.atan2(pt[1] - c[1], pt[0] - c[0])
      let sweep = turn(a1, a2)
      if (sp.avoid) {
        const pv = posOf(S, sp.avoid)
        const av = Math.atan2(pv[1] - c[1], pv[0] - c[0])
        const rel = turn(a1, av)
        const inside = Math.sign(rel) === Math.sign(sweep) && Math.abs(rel) < Math.abs(sweep)
        if (inside) sweep = sweep - Math.sign(sweep) * TAU
      }
      g = { c, start: a1, sweep }
    }
    if (!g || Math.abs(g.sweep) < 0.01) continue
    const r = Math.min(L.arcR * (sp.r ?? 1), sideMin * 0.42)
    out.push(finish(sp.id, g, sp.value(S), r, L, sp.outline))
  }
  return out
}

function finish(id: string, w: { c: Vec; start: number; sweep: number }, value: number, r: number, L: Layout, outline?: boolean): AngleInfo {
  const bis = w.start + w.sweep / 2
  const half = Math.abs(w.sweep) / 2
  const size = L.labelSize
  // narrow angles push their label out just far enough to clear both arms
  const d = Math.min(100, Math.max(r + size * 1.05, (size * 0.62) / Math.max(0.14, Math.sin(Math.min(half, Math.PI / 2)))))
  return { id, c: w.c, start: w.start, sweep: w.sweep, value, r, label: add(w.c, mul(dirOf(bis), d)), outline }
}

// ── animation ────────────────────────────────────────────────────────────

/** Keep the circle in the middle of the room it has, as big as the student made it where it fits. */
function fit(S: Scene, L: Layout) {
  if (!S.O || !S.drawn) return
  if (S.mode === "place" || S.mode === "compass") return
  // a point being dragged off the circle keeps the figure still under the finger
  if (S.drag && (S.free[S.drag.name] || S.drag.name === "@line")) return
  // the circle and any outside points, in radii; points pulled just off the circle do not count
  let x0 = -1, x1 = 1, y0 = -1, y1 = 1
  for (const [n, f] of Object.entries(S.free)) {
    if (S.offOK.has(n)) continue
    x0 = Math.min(x0, f[0]); x1 = Math.max(x1, f[0]); y0 = Math.min(y0, f[1]); y1 = Math.max(y1, f[1])
  }
  if (S.lineRoom && S.tline) {
    const f = mul(dirOf(S.tline.t), S.lineRoom)
    x0 = Math.min(x0, f[0]); x1 = Math.max(x1, f[0]); y0 = Math.min(y0, f[1]); y1 = Math.max(y1, f[1])
  }
  const bw = L.board.x1 - L.board.x0 - 68, bh = L.board.y1 - L.board.y0 - 68
  const R = Math.min(S.Rwant, L.Rmax, bw / (x1 - x0), bh / (y1 - y0))
  S.R = Math.max(R, 30)
  S.O = [L.centre[0] - ((x0 + x1) / 2) * S.R, L.centre[1] - ((y0 + y1) / 2) * S.R]
}

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  const L = layout(S)
  fit(S, L)
  const f = k(0.16)
  if (S.O) {
    if (!S.OD) S.OD = [S.O[0], S.O[1]]
    S.OD = lerpV(S.OD, S.O, f)
    S.RD += (S.R - S.RD) * f
  }
  const fp = k(S.drag ? 0.45 : 0.16)
  for (const n of Object.keys(S.pts)) {
    if (S.ptsD[n] === undefined) { S.ptsD[n] = S.pts[n]; continue }
    S.ptsD[n] += turn(S.ptsD[n], S.pts[n]) * fp
  }
  for (const n of Object.keys(S.free)) {
    const t = S.free[n]
    const d = S.freeD[n]
    S.freeD[n] = d ? lerpV(d, t, fp) : [t[0], t[1]]
  }
  for (const n of Object.keys(S.freeD)) if (!S.free[n]) delete S.freeD[n]
  if (S.tlineFollow && S.tline && S.pts[S.tlineFollow] !== undefined) S.tline = { ...S.tline, t: S.pts[S.tlineFollow], d: 1 }
  if (S.tline) {
    const D0 = S.tlineD ?? S.tline
    const fl = k(S.drag?.name === "@line" ? 0.45 : 0.16)
    S.tlineD = { t: D0.t + turn(D0.t, S.tline.t) * fp, d: D0.d + (S.tline.d - D0.d) * fl, tilt: D0.tilt + (S.tline.tilt - D0.tilt) * fl }
  } else S.tlineD = null
  if (S.sweep && !S.drawn && S.time - S.sweep.t0 >= 1.05) S.drawn = true
  for (const fd of S.fading) fd.life -= dt * 1.4
  S.fading = S.fading.filter(fd => fd.life > 0)
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
  S.passable = new Set()
  S.diamLock = false
  S.snaps = null
  S.lockOnSnap = true
  S.arcLimit = null
  S.proofLimit = false
  S.tapName = null
  S.joinNeed = []
  S.joinHint = ""
  S.angles = []
  S.show = "all"
  S.showSegs = "all"
  S.label = {}
  S.fixed = {}
  S.pulse = new Set()
  S.pulseSegs = new Set()
  S.segColour = {}
  S.pulseCircle = false
  S.pulsePts = new Set()
  S.walkTex = null
  S.offOK = new Set()
  S.freeLimit = { min: 1.25, max: 2.4 }
  S.tlineMode = "none"
  S.tlineFollow = null
  S.segText = {}
  S.ringAt = false
  S.foldAt = null
  S.tanFrom = null
  S.tapQueue = []
  S.tapCheck = null
  S.minGap = 10
  S.lineRoom = 0
  S.ticks = []
  S.tints = []
  S.fills = []
  S.half = null
  S.fly = {}
  S.lineTex = null
  S.lineFn = null
  S.chips = []
  S.tapIds = null
  S.onTap = null
  S.onTapLine = null
  S.onTapRegion = null
  S.onTapPt = null
  S.regionChord = null
  S.got = new Set()
  S.tapRing = null
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
  S.Rwant = 1e6
  S.R = L.Rmax
  S.RD = L.Rmax
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
    // the dot lands where they tapped, then glides to the middle so the circle has room to be big
    S.O = [L.centre[0], L.centre[1]]
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
  if (S.mode === "slide" && S.tlineMode !== "none" && !S.locked) {
    const g = lineGeom(S)
    if (g) {
      const h = lineHandle(S)
      if (h && dist(p, h) < tol(S) + 8) {
        S.drag = { name: "@line" }
        S.touched = { kind: "seg", id: "@line" }
        return true
      }
    }
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
  if (S.mode === "join" || S.mode === "drawDiam" || S.mode === "drawChord" || S.mode === "drawThrough" || S.mode === "drawTan") {
    S.stroke = { from: p, to: p }
    S.drewOnce = true
    return true
  }
  if (S.mode === "tapPoint" && S.OD && (S.tapName || S.tapQueue.length)) {
    if (Math.abs(dist(p, S.OD) - S.RD) > tol(S)) { say(S, "Tap on the circle itself.", "calm", 2); return false }
    const a = Math.atan2(p[1] - S.OD[1], p[0] - S.OD[0])
    const gap = S.tapQueue.length ? 25 : 15
    const near = S.showPts.some(n => n !== S.tapName && !S.free[n] && Math.abs(turn(angOf(S, n), a)) < gap * RAD)
    if (near) { say(S, "A little further from the other points.", "calm", 2); return false }
    const bad = S.tapCheck?.(S, a)
    if (bad) { say(S, bad); return false }
    if (S.tapQueue.length) {
      const name = S.tapQueue.find(n => !S.showPts.includes(n))
      if (!name) return false
      S.pts[name] = a
      S.ptsD[name] = a
      S.showPts = [...S.showPts, name]
      S.letters.add(name)
      S.touched = { kind: "pt", name }
      S.flashGood = 0.8
      // all down: letter them in order round the circle, starting from the first
      if (S.tapQueue.every(n => S.showPts.includes(n))) {
        const first = S.pts[S.tapQueue[0]]
        const order = [...S.tapQueue].sort((x, y) => norm(S.pts[x] - first) - norm(S.pts[y] - first))
        const angs = order.map(n => S.pts[n])
        S.tapQueue.forEach((n, i) => { S.pts[n] = angs[i]; S.ptsD[n] = angs[i] })
      }
      return false
    }
    const name = S.tapName!
    S.pts[name] = a
    S.ptsD[name] = a
    if (!S.showPts.includes(name)) S.showPts = [...S.showPts, name]
    S.letters.add(name)
    S.touched = { kind: "pt", name }
    S.flashGood = 0.8
    return false
  }
  if (S.mode === "tapAngle") {
    const hit = hitAngle(S, L, p)
    if (hit) S.onTap?.(S, hit)
    return false
  }
  if (S.mode === "tapLine") {
    let best: string | null = null, bd = Infinity
    for (const s of S.segs) {
      if (S.tapIds && !S.tapIds.includes(s.id)) continue
      const d = distToSeg(p, posOf(S, s.a), posOf(S, s.b))
      if (d < bd) { bd = d; best = s.id }
    }
    if (best && bd < (S.touch ? 30 : 20)) S.onTapLine?.(S, best)
    return false
  }
  if (S.mode === "tapPts") {
    let best: string | null = null, bd = Infinity
    for (const n of S.showPts) {
      if (S.derived[n]) continue
      const d = dist(p, posOf(S, n))
      if (d < bd) { bd = d; best = n }
    }
    if (best && bd < tol(S) + 4) S.onTapPt?.(S, best)
    return false
  }
  if (S.mode === "tapRegion" && S.OD && S.regionChord) {
    if (dist(p, S.OD) > S.RD) return false
    const [X, Y] = S.regionChord
    const a = posOf(S, X), b = posOf(S, Y)
    const crossP = (q: Vec) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0])
    // the centre is always in the bigger part
    const side = Math.sign(crossP(p)) === Math.sign(crossP(S.OD)) ? "major" : "minor"
    S.onTapRegion?.(S, side)
    return false
  }
  return false
}

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

export function hitAngle(S: Scene, L: Layout, p: Vec): string | null {
  const list = angleList(S, L).filter(a => (S.tapIds ? S.tapIds.includes(a.id) : S.show === "all" || S.show.has(a.id)))
  let best: string | null = null, bd = Infinity
  for (const a of list) {
    const d = dist(p, a.c)
    if (d > Math.max(90, a.r * 3)) continue
    const ang = Math.atan2(p[1] - a.c[1], p[0] - a.c[0])
    const rel = a.sweep >= 0 ? norm(ang - a.start) : norm(a.start - ang)
    const score = rel <= Math.abs(a.sweep) + 0.05 ? d : d + 200
    if (score < bd) { bd = score; best = a.id }
  }
  return bd < 200 ? best : null
}

/** How far from the centre the compass may reach without leaving the board. */
function maxFit(S: Scene, L: Layout) {
  if (!S.O) return 0
  const b = L.board
  return Math.min(S.O[0] - b.x0, b.x1 - S.O[0], S.O[1] - b.y0, b.y1 - S.O[1]) - 30
}

/** The biggest circle the board has room for. */
export function compassMax(S: Scene, L: Layout) {
  return Math.min(maxFit(S, L), L.Rmax)
}

/**
 * How far the compass reaches. Near the edge it clicks out to the biggest
 * circle: a small circle crowds every letter and number for the rest of
 * the lesson, so the lesson nudges the student to draw it big.
 */
export function compassR(S: Scene, L: Layout) {
  if (!S.O || !S.compass) return 0
  const max = compassMax(S, L)
  const r = clamp(dist(S.compass.to, S.O), 0, max)
  return r >= max * BIG ? max : r
}

/** How close to the biggest circle the compass must reach before it clicks out. */
const BIG = 0.8

/** Where the straight line's handle sits. */
export function lineHandle(S: Scene): Vec | null {
  const g = lineGeom(S)
  if (!g || !S.tlineD) return null
  if (S.tlineMode === "tilt") return add(g.F, mul(g.u, S.RD * 0.85))
  return g.F
}

export function pointerMove(S: Scene, p: Vec) {
  const L = layout(S)
  if (S.compass) { S.compass.to = p; return }
  if (S.stroke) { S.stroke.to = clampToRect(p, L.board); return }
  if (!S.drag || !S.OD) return
  const name = S.drag.name
  if (name === "@line" && S.tline) {
    const n = dirOf(S.tline.t)
    S.snapped = false
    if (S.tlineMode === "slide") {
      let d = dot(sub(p, S.OD), n) / S.RD
      d = clamp(d, 0.35, 1.8)
      // the line just touching the circle: it clicks into place
      if (Math.abs(d - 1) < 0.045 && S.snaps) { d = 1; S.snapped = true }
      S.moved += Math.abs(d - S.tline.d) * 100
      S.tline = { ...S.tline, d }
    } else if (S.tlineMode === "tilt") {
      const F = add(S.OD, mul(n, S.tline.d * S.RD))
      const a = Math.atan2(p[1] - F[1], p[0] - F[0])
      const tilt = clamp(turn(S.tline.t + Math.PI / 2, a), -0.45, 0.45)
      S.moved += Math.abs(tilt - S.tline.tilt) * DEG
      S.tline = { ...S.tline, tilt }
    }
    return
  }
  if (S.free[name] || S.offOK.has(name)) {
    if (moveFree(S, name, p, L)) return
  }
  let a = Math.atan2(p[1] - S.OD[1], p[0] - S.OD[0])
  const snaps = S.snaps && S.snaps.name === name ? S.snaps.at : []
  for (const t of snaps) if (Math.abs(turn(a, t)) < 3 * RAD) a = t
  tryMove(S, name, a)
  // Clicked into place is decided by where the point IS, not by the last
  // finger move: a finger that runs on past a limit leaves the point against
  // it, and a point that ends close to a target goes onto it exactly.
  S.snapped = false
  for (const t of snaps) {
    if (Math.abs(turn(S.pts[name], t)) >= 3 * RAD) continue
    if (Math.abs(turn(S.pts[name], t)) > 1e-9) tryMove(S, name, t)
    if (Math.abs(turn(S.pts[name], t)) < 1e-6) S.snapped = true
  }
}

/**
 * A point off the circle follows the finger (within its limits). A point
 * that may leave the circle comes off when pulled away and clicks back on
 * when brought close. Returns true when it handled the move.
 */
function moveFree(S: Scene, name: string, p: Vec, L: Layout): boolean {
  if (!S.OD) return false
  const q = clampToRect(p, { x0: L.board.x0 + 12, x1: L.board.x1 - 12, y0: L.board.y0 + 12, y1: L.board.y1 - 12 })
  let f: Vec = mul(sub(q, S.OD), 1 / S.RD)
  const r = Math.hypot(f[0], f[1])
  if (S.offOK.has(name)) {
    if (!S.free[name]) {
      // still on the circle: pulled far enough off, it comes off
      if (Math.abs(r - 1) < 0.1) return false
    } else if (Math.abs(r - 1) < 0.05) {
      // close to the circle again: back on it
      const a = Math.atan2(f[1], f[0])
      delete S.free[name]
      S.pts[name] = a
      S.ptsD[name] = a
      S.snapped = true
      return true
    }
    f = mul(f, clamp(r, 0.6, 1.45) / Math.max(r, 1e-6))
    const old = S.free[name] ?? f
    S.moved += Math.hypot(f[0] - old[0], f[1] - old[1]) * 100
    S.free[name] = f
    if (!S.freeD[name]) S.freeD[name] = mul(dirOf(S.pts[name] ?? 0), 1)
    S.snapped = false
    return true
  }
  f = mul(f, clamp(r, S.freeLimit.min, S.freeLimit.max) / Math.max(r, 1e-6))
  const old = S.free[name]
  S.moved += Math.hypot(f[0] - old[0], f[1] - old[1]) * 100
  S.movedBy[name] = (S.movedBy[name] ?? 0) + Math.hypot(f[0] - old[0], f[1] - old[1]) * 100
  S.free[name] = f
  return true
}

/**
 * Move a point along the circle, unless that breaks a rule of the beat:
 * points keep their order round the circle (unless allowed to cross), a
 * chord stays within its limits, and the proof keeps the centre inside.
 */
function tryMove(S: Scene, name: string, a: number) {
  const d = turn(S.pts[name], a)
  if (Math.abs(d) < 1e-7) return
  if (moveBy(S, name, d)) return
  // the whole move breaks a rule of the beat: go as far as the rules allow,
  // so the point stops against the limit like a wall
  let lo = 0, hi = 1
  for (let k = 0; k < 14; k++) {
    const mid = (lo + hi) / 2
    if (moveBy(S, name, d * mid, true)) lo = mid
    else hi = mid
  }
  if (lo > 0) moveBy(S, name, d * lo)
}

/** Move a point (and its partner) by `d` if the beat's rules allow it; with `test`, only check. */
function moveBy(S: Scene, name: string, d: number, test = false): boolean {
  const old = S.pts[name]
  const moving: { n: string; from: number }[] = [{ n: name, from: old }]
  const partner = S.diamLock ? (name === "A" ? "B" : name === "B" ? "A" : null) : null
  if (partner) moving.push({ n: partner, from: S.pts[partner] })
  const others = S.showPts.filter(n => !moving.some(m => m.n === n) && !S.derived[n])
  for (const m of moving) {
    for (const o of others) {
      const cross = S.crossOK.has(m.n) || S.passable.has(o)
      const rel = turn(m.from, S.pts[o])
      const end = Math.abs(turn(m.from + d, S.pts[o]))
      if (end < (cross ? 5 : S.minGap) * RAD) return false
      if (!cross && Math.sign(rel) === Math.sign(d) && Math.abs(rel) <= Math.abs(d)) return false
    }
  }
  const before: Record<string, number> = {}
  for (const m of moving) { before[m.n] = S.pts[m.n]; S.pts[m.n] = m.from + d }
  const undo = () => { for (const m of moving) S.pts[m.n] = before[m.n] }
  if (S.arcLimit && S.pts.A !== undefined && S.pts.B !== undefined && S.pts.P !== undefined) {
    const arc = arcDeg(S, "A", "B", "P")
    if (arc > S.arcLimit.max + 1e-6 || arc < S.arcLimit.min) { undo(); return false }
  }
  if (S.proofLimit) {
    const x = S.pts.P + Math.PI
    const inArc = onArc(S.pts.A, S.pts.B, S.pts.P, x)
    const gap = Math.min(Math.abs(turn(x, S.pts.A)), Math.abs(turn(x, S.pts.B)))
    if (!inArc || gap < 10 * RAD) { undo(); return false }
  }
  if (test) { undo(); return true }
  const step = Math.abs(d) * DEG
  S.moved += step
  for (const m of moving) S.movedBy[m.n] = (S.movedBy[m.n] ?? 0) + step
  return true
}

export function pointerUp(S: Scene) {
  const L = layout(S)
  if (S.compass && S.O) {
    const R = compassR(S, L)
    const a0 = Math.atan2(S.compass.to[1] - S.O[1], S.compass.to[0] - S.O[0])
    S.compass = null
    if (R < compassMax(S, L) * BIG) { say(S, "Make it bigger. Pull it right out to the ring."); return }
    // from now on the circle is as big as the board allows, whatever the screen does
    S.Rwant = 1e6
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

// ── strokes: diameters, chords, joins ────────────────────────────────────

function endStroke(S: Scene) {
  const st = S.stroke!
  S.stroke = null
  const fade = () => S.fading.push({ a: st.from, b: st.to, life: 1 })
  const length = dist(st.from, st.to)
  if (length < 24) return
  const O = S.OD!, R = S.RD
  const u: Vec = mul(sub(st.to, st.from), 1 / length)
  const off = Math.abs((O[0] - st.from[0]) * u[1] - (O[1] - st.from[1]) * u[0])

  if (S.mode === "drawDiam") {
    if (length < R * 0.6) { fade(); say(S, "Draw it right across the circle."); return }
    if (off > Math.max(16, R * 0.16)) { fade(); say(S, "Make it pass through the centre."); return }
    const a = Math.atan2(-u[1], -u[0])
    S.pts.A = a
    S.ptsD.A = a
    S.pts.B = a + Math.PI
    S.ptsD.B = a + Math.PI
    S.showPts = Array.from(new Set([...S.showPts, "A", "B"]))
    if (!S.segs.some(s => s.id === "AB")) S.segs = [...S.segs, { id: "AB", a: "A", b: "B" }]
    S.touched = { kind: "seg", id: "AB" }
    S.flashGood = 1
    return
  }
  if (S.mode === "drawChord") {
    if (off < R * 0.2) { fade(); say(S, "Miss the centre this time."); return }
    if (off > R * 0.84) { fade(); say(S, "Make it go right across the circle."); return }
    const foot = add(st.from, mul(u, dot(sub(O, st.from), u)))
    const hc = Math.sqrt(Math.max(0, R * R - off * off))
    const e = sub(foot, mul(u, hc)), f = add(foot, mul(u, hc))
    S.pts.E = Math.atan2(e[1] - O[1], e[0] - O[0])
    S.ptsD.E = S.pts.E
    S.pts.F = Math.atan2(f[1] - O[1], f[0] - O[0])
    S.ptsD.F = S.pts.F
    S.showPts = Array.from(new Set([...S.showPts, "E", "F"]))
    if (!S.segs.some(s => s.id === "EF")) S.segs = [...S.segs, { id: "EF", a: "E", b: "F" }]
    S.touched = { kind: "seg", id: "EF" }
    S.flashGood = 1
    return
  }
  if (S.mode === "drawThrough") {
    const P = posOf(S, "P")
    const offP = Math.abs((P[0] - st.from[0]) * u[1] - (P[1] - st.from[1]) * u[0])
    const startNear = dist(st.from, P) < tol(S) + 10 || dist(st.to, P) < tol(S) + 10
    if (off > Math.max(16, R * 0.16) || offP > tol(S) || !startNear) { fade(); say(S, "Start at $P$ and go through $O$."); return }
    S.derived.X = (S2, drawn) => angOf(S2, "P", drawn) + Math.PI
    if (!S.segs.some(s => s.id === "PX")) S.segs = [...S.segs, { id: "PX", a: "P", b: "X" }]
    S.touched = { kind: "seg", id: "PX" }
    S.flashGood = 1
    return
  }
  if (S.mode === "drawTan" && S.tanFrom) {
    const P = posOf(S, S.tanFrom)
    if (dist(st.from, P) > tol(S) + 14) { fade(); say(S, "Start at $P$."); return }
    const [a1, a2] = tangentAngles(S, S.tanFrom)
    const ang = Math.atan2(st.to[1] - P[1], st.to[0] - P[0])
    const towards = (a: number) => { const t = add(O, mul(dirOf(a), R)); return Math.atan2(t[1] - P[1], t[0] - P[0]) }
    const opts: [string, number][] = [["A", towards(a1)], ["B", towards(a2)]]
    const near = opts.filter(([n]) => !S.tanMade.includes(n)).map(([n, a]) => [n, Math.abs(turn(ang, a))] as const).sort((x, y) => x[1] - y[1])[0]
    const toO = Math.atan2(O[1] - P[1], O[0] - P[0])
    const half = Math.abs(turn(toO, opts[0][1]))
    if (!near || near[1] > 9 * RAD) {
      fade()
      say(S, Math.abs(turn(ang, toO)) < half ? "That cuts through the circle. Make it just touch." : "That misses the circle. Make it just touch.")
      return
    }
    const name = near[0]
    S.tanMade = [...S.tanMade, name]
    if (!S.showPts.includes(name)) S.showPts = [...S.showPts, name]
    S.letters.add(name)
    if (!S.segs.some(s => s.id === S.tanFrom + name)) S.segs = [...S.segs, { id: S.tanFrom + name, a: S.tanFrom, b: name }]
    S.touched = { kind: "seg", id: S.tanFrom + name }
    S.flashGood = 1
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

// shared with the other lessons (answers.ts)
export { typeKey } from "../answers"

export { dist, lerpV, clamp, turn, RAD, DEG }
