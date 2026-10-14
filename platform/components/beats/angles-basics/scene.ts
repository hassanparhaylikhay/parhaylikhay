/**
 * The board for "Angles": the first lesson in the angles series.
 *
 * It moves through several kinds of board: one line turning about a point;
 * a few separate angles to tap; a named angle; a straight line with rays
 * from a point on it; rays round a point; two crossing lines; two parallel
 * lines with a line across them; an exam-style figure.
 *
 * Every angle on screen is computed each frame into one list with a stable
 * id (`turn`, `W0`.. on a line, `P0`.. round a point, `C0`..`C3` at a
 * crossing, `A0`..`A3` / `B0`..`B3` at the two crossings of a transversal,
 * `F0`.. separate figures, `PQR` named, exam ids). Drawing, taps, sums,
 * hints and colours all work from that list.
 *
 * Targets (`theta`, `lines`, `rays`) are where things ARE; the `...D`
 * copies are what is drawn, eased toward the targets every frame.
 */

import {
  type Vec, type Rect, add, sub, mul, dot, dist, len, lerp, lerpV, clamp, clampToRect, turn, DEG, RAD,
} from "../geometry"
import {
  type Line, type Ray, type Wedge, dirOf, norm, clipLine, intersect, rightDir, upDir, lineGap,
  wedgeBetween, quadrants, quadSides, wholeShare, TAU,
} from "./lines"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const GREY = "#7a7875"
export const CHALK = "#e8e6e0"
export const NEUTRAL = "#c9c7bf"
export const PALETTE = [BLUE, ORANGE, PINK, YELLOW, NEUTRAL, "#97958e"]

export type Board = "none" | "turn" | "figs" | "named" | "line" | "point" | "cross" | "parallel" | "exam"
export type Mode = "none" | "draw" | "turn" | "rays" | "rotLine" | "tap" | "tapPair" | "addRay"
export type DrawGoal = "line" | "ray" | "twoCross" | "parallel" | "trans"
export type ColourMode = "palette" | "neutral" | "size" | "group" | "pairs"
export type VisKey =
  | "board" | "arcs" | "values" | "sum" | "line" | "keypad" | "hint" | "choices"
  | "arrows" | "shape" | "letters" | "half" | "full" | "ghost" | "handles"

const VIS_KEYS: VisKey[] = ["board", "arcs", "values", "sum", "line", "keypad", "hint", "choices", "arrows", "shape", "letters", "half", "full", "ghost", "handles"]

type Spring = { v: number; t: number }

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

export interface Choices {
  options: string[]
  answer: number
  tries: number
  picked: number | null
  state: "idle" | "wrong" | "right"
  wrongAt: number
  help?: (S: Scene, tries: number) => void
  onRight?: (S: Scene) => void
}

export interface ExamWedge { id: string; line: number; trans: number; q: number }

/** One angle on screen. */
export interface AngleInfo {
  id: string
  c: Vec
  start: number
  sweep: number
  /** the number shown (whole degrees, consistent with its neighbours) */
  value: number
  r: number
  label: Vec
}

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  board: Board
  mode: Mode

  // drawing
  drawGoal: DrawGoal | null
  stroke: { from: Vec; to: Vec } | null
  fading: { a: Vec; b: Vec; life: number }[]
  temp: { line: Line; until: number } | null
  drewOnce: boolean

  // the turning line (degrees, anticlockwise from the fixed arm)
  theta: number
  thetaD: number
  snaps: number[]

  // lines and rays
  lines: Line[]
  linesD: Line[]
  rays: Ray[]
  raysD: Ray[]
  rotLine: number
  pivot: Vec | null
  tilt: { base: number; max: number } | null
  parSnap: number | null
  transMin: number
  magnet: number | null
  exam: ExamWedge[]

  /** `raw` is where the finger has turned the line to, before any snap */
  drag: { kind: "turn" | "ray" | "line"; i: number; last: number; raw: number } | null
  touch: boolean
  moved: number
  turned: number
  releases: number
  snapped: boolean
  locked: boolean

  // looks
  vis: Record<VisKey, Spring>
  show: Set<string> | "all"
  label: Record<string, string>
  colourMode: ColourMode
  fixed: Record<string, string>
  pulse: Set<string>
  sel: string | null
  onTap: ((S: Scene, id: string) => void) | null
  tapIds: string[] | null
  sum: { ids: string[]; total: number } | null
  sumShownAt: number
  termPos: Record<string, Vec>
  halfIds: string[] | null
  fullAt: boolean
  /** F, Z or C over a pair: quadrants at the upper and lower crossing, and which lines (default: 0, 1, and 2 across) */
  shape: { kind: "F" | "Z" | "C"; q: [number, number]; on?: [number, number, number] } | null
  /** angles tapped right this beat */
  got: Set<string>
  /** a line turning by itself: line i from angle `from` to `to` */
  tween: { i: number; from: number; to: number; start: number; dur: number } | null
  slide: number | null
  meet: boolean
  letters: boolean
  lineTex: string | null
  lineWords: string | null

  input: InputState | null
  choices: Choices | null

  flashGood: number
  /** the line or ray the student last drew or moved: the only one a success flash lights */
  touched: { kind: "line" | "ray"; i: number } | null
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, board: "none", mode: "none",
    drawGoal: null, stroke: null, fading: [], temp: null, drewOnce: false,
    theta: 40, thetaD: 40, snaps: [],
    lines: [], linesD: [], rays: [], raysD: [], rotLine: 1, pivot: null, tilt: null, parSnap: null, transMin: 20, magnet: null, exam: [],
    drag: null, touch: false, moved: 0, turned: 0, releases: 0, snapped: false, locked: false,
    vis, show: "all", label: {}, colourMode: "palette", fixed: {}, pulse: new Set(), sel: null, onTap: null, tapIds: null,
    sum: null, sumShownAt: 0, termPos: {}, halfIds: null, fullAt: false, shape: null, got: new Set(), tween: null, slide: null, meet: false, letters: false,
    lineTex: null, lineWords: null, input: null, choices: null, flashGood: 0, touched: null, note: null,
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
  arm: number
  /** arc radius for an angle, in step with the figure */
  arcR: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 132
  let y = h - (compact ? 84 : 96)
  let keypadTop = y
  if (on(S, "keypad")) { y -= 112; keypadTop = y }
  else if (on(S, "choices")) { y -= 64; keypadTop = y }
  const lineSize = compact ? 22 : 27
  let lineY = y
  if (on(S, "sum") || on(S, "line")) { lineY = y - lineSize; y -= lineSize * 2.4 }
  let hintY = y
  if (on(S, "hint")) { hintY = y - 16; y -= 40 }
  const side = compact ? 18 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 18, y1: Math.max(phraseBottom + 160, y - 18) }
  const centre: Vec = [(board.x0 + board.x1) / 2, (board.y0 + board.y1) / 2]
  const arm = Math.min(board.x1 - board.x0, board.y1 - board.y0) * 0.36
  // arcs follow the screen, not the room left over, so they keep their size when the keypad shows
  const arcR = clamp(Math.min(w, h) * 0.055, 26, 46)
  return { compact, phraseBottom, board, lineY, lineSize, hintY, keypadTop, labelSize: compact ? 17 : 21, centre, arm, arcR }
}

export function screenScale(S: Scene) {
  return clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
}

export function resize(S: Scene, w: number, h: number) {
  if (S.w === 0 || S.h === 0) { S.w = w; S.h = h; return }
  const k = Math.min(w, h) / Math.min(S.w, S.h)
  const oc: Vec = [S.w / 2, S.h / 2], nc: Vec = [w / 2, h / 2]
  const map = (p: Vec): Vec => add(mul(sub(p, oc), k), nc)
  S.lines = S.lines.map(l => ({ ...l, p: map(l.p) }))
  S.linesD = S.linesD.map(l => ({ ...l, p: map(l.p) }))
  S.rays = S.rays.map(r => ({ ...r, from: map(r.from), len: r.len * k }))
  S.raysD = S.raysD.map(r => ({ ...r, from: map(r.from), len: r.len * k }))
  if (S.pivot) S.pivot = map(S.pivot)
  S.w = w
  S.h = h
}

// ── the angle list ───────────────────────────────────────────────────────

/** Arc radius and label spot for a wedge. */
function finish(id: string, w: Wedge, value: number, L: Layout, r = L.arcR): AngleInfo {
  const bis = w.start + w.sweep / 2
  const half = Math.abs(w.sweep) / 2
  const size = L.labelSize
  const d = Math.min(130, Math.max(r + size * 1.15, (size * 0.95) / Math.max(0.12, Math.sin(Math.min(half, Math.PI / 2)))))
  return { id, c: w.c, start: w.start, sweep: w.sweep, value, r, label: add(w.c, mul(dirOf(bis), d)) }
}

/** The turning line's centre and arm, which follow the layout. */
export function turnGeom(S: Scene, L: Layout) {
  const arm = Math.min(L.arm * 1.22, (L.board.y1 - L.board.y0) * 0.44, (L.board.x1 - L.board.x0) * 0.46)
  const O: Vec = [L.centre[0], L.centre[1] + arm * 0.06]
  return { O, arm }
}

/** Positions of the separate angle figures (acute, obtuse, reflex). */
export const FIG_ANGLES = [50, 125, 250]
export function figGeom(S: Scene, L: Layout) {
  const n = FIG_ANGLES.length
  const wide = (L.board.x1 - L.board.x0) > 640
  const arm = Math.min(L.arm * 0.8, wide ? 125 : 80)
  return FIG_ANGLES.map((_, k) => {
    const c: Vec = wide
      ? [L.board.x0 + ((k + 0.5) * (L.board.x1 - L.board.x0)) / n - arm * 0.3, L.centre[1] + arm * 0.35]
      : [L.centre[0] - arm * 0.35, L.board.y0 + ((k + 0.5) * (L.board.y1 - L.board.y0)) / n + arm * 0.25]
    return { c, arm }
  })
}

/** The named-angle figure: corner Q with arms to P, R and S. */
export function namedGeom(S: Scene, L: Layout) {
  const Q: Vec = [L.centre[0] - L.arm * 0.5, L.centre[1] + L.arm * 0.3]
  const a = { P: -125 * RAD, R: -25 * RAD, S: 40 * RAD }
  const arm = L.arm * 1.15
  return { Q, arm, a, pts: { P: add(Q, mul(dirOf(a.P), arm)), R: add(Q, mul(dirOf(a.R), arm)), S: add(Q, mul(dirOf(a.S), arm)) } }
}

/** The two crossings of the transversal, and the "up" and "right" directions. */
export function parallelGeom(lines: Line[]) {
  if (lines.length < 3) return null
  const X1 = intersect(lines[0], lines[2]), X2 = intersect(lines[1], lines[2])
  if (!X1 || !X2) return null
  const u = Math.atan2(X1[1] - X2[1], X1[0] - X2[0])
  return { X1, X2, u, r1: rightDir(lines[0].a), r2: rightDir(lines[1].a) }
}

/** Three parallel lines and two lines across them, like a past paper figure. */
export function examLines(L: Layout): Line[] {
  const H = L.board.y1 - L.board.y0
  const w = L.board.x1 - L.board.x0
  const gap = Math.min(H * 0.3, 125)
  const b = -4 * RAD
  const n: Vec = [Math.sin(b), -Math.cos(b)]
  const c = L.centre
  const at = (k: number): Vec => add(c, mul(n, k * gap))
  return [
    { p: at(1), a: b },
    { p: at(0), a: b },
    { p: at(-1), a: b },
    { p: add(c, [-w * 0.14, 0]), a: b - 68 * RAD },
    { p: add(c, [w * 0.22, 0]), a: b - 58 * RAD },
  ]
}

/** Values of the four angles at a crossing: q0 and q2 equal, q1 and q3 make it up to 180. */
function crossingValues(u: number, r: number): number[] {
  const q0 = Math.abs(turn(u, r)) * DEG
  const acute = Math.round(Math.min(q0, 180 - q0))
  const v0 = q0 <= 90 ? acute : 180 - acute
  return [v0, 180 - v0, v0, 180 - v0]
}

export function angleList(S: Scene, L: Layout): AngleInfo[] {
  const out: AngleInfo[] = []
  if (S.board === "turn") {
    const { O, arm } = turnGeom(S, L)
    const sw = -S.thetaD * RAD
    out.push(finish("turn", { c: O, start: 0, sweep: sw }, Math.round(S.theta), L, clamp(arm * 0.3, 36, 68)))
  } else if (S.board === "figs") {
    figGeom(S, L).forEach((f, k) => out.push(finish(`F${k}`, { c: f.c, start: 0, sweep: -FIG_ANGLES[k] * RAD }, FIG_ANGLES[k], L, clamp(f.arm * 0.34, 24, 40))))
  } else if (S.board === "named") {
    const g = namedGeom(S, L)
    out.push(finish("PQR", wedgeBetween(g.Q, g.a.P, g.a.R), 100, L, L.arcR * 1.1))
    out.push(finish("RQS", wedgeBetween(g.Q, g.a.R, g.a.S), 65, L, L.arcR * 0.9))
  } else if (S.board === "line" && S.linesD[0] && S.raysD.length) {
    const rd = rightDir(S.linesD[0].a)
    const foot = S.raysD[0].from
    const sideOf = (rays: Ray[], line: Line) => Math.sign(Math.sin(rays[0].a - rightDir(line.a))) || -1
    const phis = (rays: Ray[], line: Line) => {
      const r0 = rightDir(line.a), s = sideOf(rays, line)
      return [0, ...rays.map(r => norm(s * (r.a - r0))), Math.PI].sort((a, b) => a - b)
    }
    const pD = phis(S.raysD, S.linesD[0]), pT = phis(S.rays, S.lines[0])
    const s = sideOf(S.raysD, S.linesD[0])
    const raw = pT.slice(1).map((x, k) => (x - pT[k]) * DEG)
    const vals = wholeShare(raw, 180)
    for (let k = 0; k + 1 < pD.length; k++) {
      out.push(finish(`W${k}`, { c: foot, start: rd + s * pD[k], sweep: s * (pD[k + 1] - pD[k]) }, vals[k], L))
    }
  } else if (S.board === "point" && S.raysD.length >= 2) {
    const c = S.raysD[0].from
    const order = (rs: Ray[]) => rs.map(r => norm(r.a)).sort((a, b) => a - b)
    const aD = order(S.raysD), aT = order(S.rays)
    const raw = aT.map((x, k) => (k + 1 < aT.length ? aT[k + 1] - x : aT[0] + TAU - x) * DEG)
    const vals = wholeShare(raw, 360)
    aD.forEach((x, k) => {
      const nx = k + 1 < aD.length ? aD[k + 1] : aD[0] + TAU
      out.push(finish(`P${k}`, { c, start: x, sweep: nx - x }, vals[k], L))
    })
  } else if (S.board === "cross" && S.linesD.length >= 2) {
    const X = intersect(S.linesD[0], S.linesD[1])
    if (X) {
      const qs = quadrants(X, rightDir(S.linesD[0].a), upDir(S.linesD[1].a))
      const vals = crossingValues(upDir(S.lines[1].a), rightDir(S.lines[0].a))
      qs.forEach((w, q) => out.push(finish(`C${q}`, w, vals[q], L)))
    }
  } else if (S.board === "parallel") {
    const gD = parallelGeom(S.linesD), gT = parallelGeom(S.lines)
    if (gD && gT) {
      const v1 = crossingValues(gT.u, gT.r1)
      const v2 = lineGap(S.lines[0].a, S.lines[1].a) < 1e-4 ? v1 : crossingValues(gT.u, gT.r2)
      quadrants(gD.X1, gD.r1, gD.u).forEach((w, q) => out.push(finish(`A${q}`, w, v1[q], L)))
      quadrants(gD.X2, gD.r2, gD.u).forEach((w, q) => out.push(finish(`B${q}`, w, v2[q], L)))
    }
  } else if (S.board === "exam") {
    for (const e of S.exam) {
      const A = S.linesD[e.line], T = S.linesD[e.trans]
      const X = A && T ? intersect(A, T) : null
      if (!X) continue
      const vals = crossingValues(upDir(S.lines[e.trans].a), rightDir(S.lines[e.line].a))
      out.push(finish(e.id, quadrants(X, rightDir(A.a), upDir(T.a))[e.q], vals[e.q], L))
    }
  }
  return out
}

/** The colour of an angle under the current colouring rule. */
export function angleColour(S: Scene, a: AngleInfo, all: AngleInfo[]): string {
  if (S.fixed[a.id]) return S.fixed[a.id]
  switch (S.colourMode) {
    case "neutral": return NEUTRAL
    case "size": return a.value <= 90 ? BLUE : ORANGE
    case "pairs": return /[02]$/.test(a.id) ? BLUE : ORANGE
    case "group": {
      const vals = [...new Set(all.map(x => x.value))].sort((p, q) => p - q)
      return PALETTE[vals.indexOf(a.value) % PALETTE.length]
    }
    default: {
      const k = Number(a.id.replace(/\D/g, "")) || 0
      return a.id === "turn" ? BLUE : PALETTE[k % PALETTE.length]
    }
  }
}

// ── animation ────────────────────────────────────────────────────────────

/** Room for the parallels: the gap between them, with no line across. */
function baseGap(L: Layout) {
  const halfW = (L.board.x1 - L.board.x0) / 2
  return Math.min((L.board.y1 - L.board.y0) * 0.42, 210, halfW * 0.8)
}

/** How flat the line across may lie before its crossings leave a narrow screen. */
export function minAcross(L: Layout) {
  const halfW = (L.board.x1 - L.board.x0) / 2
  return Math.max(20 * RAD, Math.atan(baseGap(L) / 2 / Math.max(40, halfW - 70)))
}

/**
 * The gap between the parallels. A line across that lies flat pushes its
 * crossings far apart sideways, so the parallels close up to keep both
 * crossings (and their labels) on the screen.
 */
function parGap(S: Scene, L: Layout) {
  const halfW = (L.board.x1 - L.board.x0) / 2
  let g = baseGap(L)
  if (S.lines[2] && S.lines[0]) {
    const acute = Math.max(lineGap(S.lines[2].a, S.lines[0].a), 5 * RAD)
    g = Math.min(g, 2 * Math.max(40, halfW - 70) * Math.tan(acute))
  }
  return Math.max(g, 56)
}

/**
 * Keep the figure in the middle of the room it has. When the keypad, a
 * hint or the sum line takes space, the figure slides to make way; the
 * student's angles never change, only where the figure sits.
 */
function fit(S: Scene, L: Layout) {
  if (S.mode === "draw" || S.stroke) return
  const c = L.centre
  const shift = (from: Vec, to: Vec) => {
    const d = sub(to, from)
    if (Math.hypot(d[0], d[1]) < 0.5) return
    S.lines = S.lines.map(l => ({ ...l, p: add(l.p, d) }))
    S.rays = S.rays.map(r => ({ ...r, from: add(r.from, d) }))
  }
  if (S.board === "line" && S.lines[0]) {
    const foot = S.rays[0]?.from ?? projectOn(c, S.lines[0])
    // rays above the line: the foot sits below the middle, and the other way round
    const side = S.rays.length ? Math.sign(S.rays.reduce((s, r) => s + Math.sin(r.a), 0)) || -1 : 0
    shift(foot, [c[0], c[1] - side * L.arm * 0.45])
  } else if (S.board === "point" && S.rays[0]) {
    shift(S.rays[0].from, c)
  } else if (S.board === "cross" && S.lines.length === 2) {
    const X = intersect(S.lines[0], S.lines[1])
    if (X) shift(X, c)
  } else if (S.board === "parallel" && S.lines.length >= 2) {
    const l0 = S.lines[0]
    const n: Vec = [-Math.sin(l0.a), Math.cos(l0.a)]
    const s = Math.sign(dot(sub(S.lines[1].p, l0.p), n)) || 1
    const gap = parGap(S, L)
    const p0 = add(c, mul(n, -s * gap / 2)), p1 = add(c, mul(n, s * gap / 2))
    // line 1 turns about its own point, so that point stays in the middle
    S.lines[0] = { ...l0, p: p0 }
    S.lines[1] = { ...S.lines[1], p: p1 }
    if (S.lines[2]) S.lines[2] = { ...S.lines[2], p: c }
  } else if (S.board === "exam") {
    S.lines = examLines(L)
  }
}

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  fit(S, layout(S))
  const f = k(S.drag ? 0.45 : 0.16)
  S.thetaD += (S.theta - S.thetaD) * f
  const syncLen = <T,>(D: T[], T_: T[], copy: (x: T) => T) => {
    if (D.length !== T_.length) return T_.map(copy)
    return D
  }
  S.linesD = syncLen(S.linesD, S.lines, l => ({ p: [l.p[0], l.p[1]] as Vec, a: l.a }))
  S.raysD = syncLen(S.raysD, S.rays, r => ({ from: [r.from[0], r.from[1]] as Vec, a: r.a, len: r.len }))
  S.linesD = S.linesD.map((d, i) => {
    const t = S.lines[i]
    // a line has no front or back, so turn the short way round mod 180
    let da = turn(d.a, t.a)
    if (da > Math.PI / 2) da -= Math.PI
    if (da < -Math.PI / 2) da += Math.PI
    // keep the drawn point at the target's nearest point, so a turning line pivots in place
    return { p: lerpV(d.p, t.p, f), a: d.a + da * f }
  })
  S.raysD = S.raysD.map((d, i) => {
    const t = S.rays[i]
    return { from: lerpV(d.from, t.from, f), a: d.a + turn(d.a, t.a) * f, len: lerp(d.len, t.len, f) }
  })
  for (const fd of S.fading) fd.life -= dt * 1.4
  S.fading = S.fading.filter(fd => fd.life > 0)
  if (S.temp && S.time > S.temp.until) {
    const L = layout(S)
    const seg = clipLine(S.temp.line, L.board)
    if (seg) S.fading.push({ a: seg[0], b: seg[1], life: 1 })
    S.temp = null
  }
  if (S.tween) {
    const T = S.tween
    const t = clamp((S.time - T.start) / T.dur, 0, 1)
    const e = t * t * (3 - 2 * t)
    if (S.lines[T.i]) S.lines[T.i] = { ...S.lines[T.i], a: T.from + (T.to - T.from) * e }
    if (t >= 1) S.tween = null
  }
  S.flashGood = Math.max(0, S.flashGood - dt)
  if (S.note && S.time > S.note.until) S.note = null

  // the sum line: each term starts at its angle's label and flies down
  if (S.sum) {
    const L = layout(S)
    const list = angleList(S, L)
    const slots = sumSlots(S, L)
    S.sum.ids.forEach((id, j) => {
      const a = list.find(x => x.id === id)
      if (!a) return
      if (S.vis.sum.t < 0.5 || S.vis.sum.v < 0.02 || !S.termPos[id]) S.termPos[id] = a.label
      else S.termPos[id] = lerpV(S.termPos[id], [slots.terms[j], L.lineY], k(0.085))
    })
  }
}

export function sumSlots(S: Scene, L: Layout) {
  const n = S.sum?.ids.length ?? 2
  const units = n * 2.5 + n * 1.15 + 2.9
  const size = Math.min(L.lineSize, (S.w - 32) / units)
  const TERM = 2.5 * size, OP = 1.15 * size, TOT = 2.9 * size
  let x = S.w / 2 - (n * (TERM + OP) + TOT) / 2
  const terms: number[] = [], ops: number[] = []
  for (let i = 0; i < n; i++) {
    terms.push(x + TERM / 2); x += TERM
    ops.push(x + OP / 2); x += OP
  }
  return { terms, ops, total: x + TOT / 2, size }
}

// ── beat helpers ─────────────────────────────────────────────────────────

export function show(S: Scene, keys: VisKey[]) {
  const wasSum = S.vis.sum.t > 0.5
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
  if (!wasSum && S.vis.sum.t > 0.5) { S.sumShownAt = S.time; S.termPos = {} }
}

export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drawGoal = null
  S.stroke = null
  S.drag = null
  S.moved = 0
  S.turned = 0
  S.releases = 0
  S.snapped = false
  S.locked = false
  S.snaps = []
  S.tilt = null
  S.parSnap = null
  S.magnet = null
  S.show = "all"
  S.label = {}
  S.colourMode = "palette"
  S.fixed = {}
  S.pulse = new Set()
  S.sel = null
  S.onTap = null
  S.tapIds = null
  S.sum = null
  S.halfIds = null
  S.fullAt = false
  S.shape = null
  S.got = new Set()
  S.tween = null
  S.touched = null
  S.slide = null
  S.meet = false
  S.letters = false
  S.lineTex = null
  S.lineWords = null
  S.input = null
  S.choices = null
  S.note = null
  S.temp = null
}

export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

export function startInput(S: Scene, spec: Omit<InputState, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

export function startChoices(S: Scene, options: string[], answer: number, help?: (S: Scene, tries: number) => void, onRight?: (S: Scene) => void) {
  S.choices = { options, answer, tries: 0, picked: null, state: "idle", wrongAt: -9, help, onRight }
}

// ── shapes the beats set up ──────────────────────────────────────────────

/** A straight line across the middle of the board (for opening a beat cold). */
function defaultLine(L: Layout, tiltDeg = -8): Line {
  return { p: [L.centre[0], L.centre[1] + L.arm * 0.35], a: tiltDeg * RAD }
}

export function ensureLine(S: Scene) {
  const L = layout(S)
  if (!S.lines[0]) S.lines = [defaultLine(L)]
  S.lines = S.lines.slice(0, 1)
  S.linesD = S.linesD.slice(0, 1)
}

/** Rays from one foot on the line so the angles from the right are `degs` (the last is what is left). */
export function raysOnLine(S: Scene, degs: number[], foot?: Vec) {
  ensureLine(S)
  const L = layout(S)
  const line = S.lines[0]
  const f = foot ?? (S.rays[0]?.from ?? projectOn(L.centre, line))
  const r0 = rightDir(line.a)
  const len = L.arm * 1.05
  let acc = 0
  const out: Ray[] = []
  for (const d of degs.slice(0, -1)) {
    acc += d
    out.push({ from: f, a: r0 - acc * RAD, len })
  }
  S.rays = out
}

export function projectOn(p: Vec, line: Line): Vec {
  const d = dirOf(line.a)
  return add(line.p, mul(d, dot(sub(p, line.p), d)))
}

/** Rays round one point so the angles between them (going round) are `degs`. */
export function raysRound(S: Scene, degs: number[], first = -90) {
  const L = layout(S)
  const c: Vec = [L.centre[0], L.centre[1]]
  const len = L.arm * 0.95
  let a = first
  S.rays = degs.map((d, k) => {
    const r = { from: c, a: a * RAD, len }
    a += d
    void k
    return r
  })
}

/** Two straight lines crossing in the middle at the given angle. */
export function crossingAt(S: Scene, deg: number) {
  const L = layout(S)
  const c = L.centre
  S.lines = [{ p: c, a: -6 * RAD }, { p: c, a: (-6 - deg) * RAD }]
}

/**
 * Two parallel lines and a line across them, the acute angle between them
 * `acute` degrees, leaning right going up.
 */
export function parallelAt(S: Scene, acute: number, opts: { tilt?: number; withTrans?: boolean } = {}) {
  const L = layout(S)
  const H = L.board.y1 - L.board.y0
  const gap = Math.min(H * 0.42, 210)
  const c = L.centre
  const base = (opts.tilt ?? -5) * RAD
  const n: Vec = [Math.sin(base), -Math.cos(base)]
  const l0: Line = { p: add(c, mul(n, gap / 2)), a: base }
  const l1: Line = { p: add(c, mul(n, -gap / 2)), a: base }
  S.lines = opts.withTrans === false ? [l0, l1] : [l0, l1, { p: c, a: base - acute * RAD }]
}

/** Turn the transversal so the acute angle it makes is exactly `acute`. */
export function setTransAcute(S: Scene, acute: number) {
  if (S.lines.length < 3) return
  const base = rightDir(S.lines[0].a)
  const cur = S.lines[2].a
  const opts = [base - acute * RAD, base + acute * RAD]
  S.lines[2] = { ...S.lines[2], a: opts.reduce((p, q) => (lineGap(q, cur) < lineGap(p, cur) ? q : p)) }
}

/** Where a turning line's handle sits: out along the line from its pivot, on the side inside the board. */
export function lineHandle(S: Scene, L: Layout, i: number): Vec | null {
  const line = S.linesD[i]
  if (!line) return null
  const pivot = S.pivot ?? line.p
  const reach = Math.min(L.arm * 1.1, 170)
  for (const sgn of [1, -1]) {
    const h = add(pivot, mul(dirOf(line.a), sgn * reach))
    if (h[0] > L.board.x0 + 10 && h[0] < L.board.x1 - 10 && h[1] > L.board.y0 + 10 && h[1] < L.board.y1 - 10) return h
  }
  return add(pivot, mul(dirOf(line.a), reach * 0.6))
}

// ── input ────────────────────────────────────────────────────────────────

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const L = layout(S)
  const R = touch ? 44 : 30

  if (S.mode === "draw") {
    S.stroke = { from: clampToRect(p, L.board), to: clampToRect(p, L.board) }
    S.drewOnce = true
    return true
  }
  if (S.mode === "turn" && S.board === "turn") {
    if (S.locked) return false
    const { O, arm } = turnGeom(S, L)
    const tip = add(O, mul(dirOf(-S.thetaD * RAD), arm))
    if (dist(p, tip) > R + 6) return false
    S.drag = { kind: "turn", i: 0, last: Math.atan2(p[1] - O[1], p[0] - O[0]), raw: S.theta }
    return true
  }
  if (S.mode === "rays") {
    let best = -1, bd = Infinity
    S.raysD.forEach((r, i) => {
      const tip = add(r.from, mul(dirOf(r.a), r.len))
      const d = dist(p, tip)
      if (d < bd) { bd = d; best = i }
    })
    if (best < 0 || bd > R) return false
    S.drag = { kind: "ray", i: best, last: 0, raw: 0 }
    S.touched = { kind: "ray", i: best }
    return true
  }
  if (S.mode === "rotLine") {
    if (S.locked) return false
    const h = lineHandle(S, L, S.rotLine)
    if (!h || dist(p, h) > R + 6) return false
    S.drag = { kind: "line", i: S.rotLine, last: 0, raw: 0 }
    S.touched = { kind: "line", i: S.rotLine }
    return true
  }
  if (S.mode === "addRay" && S.board === "point" && S.rays.length) {
    // one more line is the whole idea; the beats after this one expect four
    if (S.rays.length >= 4) return false
    const c = S.rays[0].from
    if (dist(p, c) < 24) return false
    const a = Math.atan2(p[1] - c[1], p[0] - c[0])
    const tooClose = S.rays.some(r => Math.abs(turn(r.a, a)) < 16 * RAD)
    if (tooClose) { say(S, "Tap a gap between the lines.", "calm", 2); return false }
    S.rays = [...S.rays, { from: c, a, len: S.rays[0].len }]
    S.raysD = [...S.raysD, { from: c, a, len: 4 }]
    S.touched = { kind: "ray", i: S.rays.length - 1 }
    S.flashGood = 0.6
    return false
  }
  if (S.mode === "tap" || S.mode === "tapPair") {
    const hit = hitAngle(S, L, p)
    if (hit) S.onTap?.(S, hit)
    return false
  }
  return false
}

/** The angle under a tap: inside its wedge and near its corner. */
export function hitAngle(S: Scene, L: Layout, p: Vec): string | null {
  const list = angleList(S, L).filter(a => (S.tapIds ? S.tapIds.includes(a.id) : S.show === "all" || S.show.has(a.id)))
  let best: string | null = null, bd = Infinity
  for (const a of list) {
    const d = dist(p, a.c)
    if (d > Math.max(110, a.r * 3)) continue
    const ang = Math.atan2(p[1] - a.c[1], p[0] - a.c[0])
    const rel = a.sweep >= 0 ? norm(ang - a.start) : norm(a.start - ang)
    const inside = rel <= Math.abs(a.sweep) + 0.05
    const score = inside ? d : d + 200
    if (score < bd) { bd = score; best = a.id }
  }
  return bd < 200 ? best : null
}

export function pointerMove(S: Scene, p: Vec) {
  const L = layout(S)
  if (S.stroke) { S.stroke.to = clampToRect(p, L.board); return }
  const D = S.drag
  if (!D) return

  if (D.kind === "turn") {
    const { O } = turnGeom(S, L)
    const ang = Math.atan2(p[1] - O[1], p[0] - O[0])
    const dA = turn(D.last, ang)
    D.last = ang
    // screen angles grow clockwise; the angle grows anticlockwise. Follow
    // the finger, then snap: a snap never pushes the line ahead of the finger.
    D.raw = clamp(D.raw - dA * DEG, 0, 360)
    let th = D.raw
    S.snapped = false
    for (const t of [...S.snaps, ...(S.magnet !== null ? [S.magnet] : [])]) {
      if (Math.abs(th - t) <= (t === S.magnet ? 2.5 : 3.5)) { th = t; S.snapped = true }
    }
    S.turned += Math.abs(th - S.theta)
    S.moved += Math.abs(dA) * L.arm
    S.theta = th
    return
  }

  if (D.kind === "ray") {
    const r = S.rays[D.i]
    const a = Math.atan2(p[1] - r.from[1], p[0] - r.from[0])
    const minGap = 8 * RAD
    if (S.board === "line" && S.lines[0]) {
      const r0 = rightDir(S.lines[0].a)
      const s = Math.sign(Math.sin(S.rays[0].a - r0)) || -1
      const phi = norm(s * (a - r0))
      if (phi < 4 * RAD || phi > Math.PI - 4 * RAD) return
      const others = S.rays.filter((_, i) => i !== D.i).map(o => norm(s * (o.a - r0)))
      if (others.some(o => Math.abs(o - phi) < minGap)) return
      // keep the rays in the same order along the line
      const mine = norm(s * (r.a - r0))
      if (others.some(o => (o - mine) * (o - phi) < 0)) return
    } else {
      const others = S.rays.filter((_, i) => i !== D.i)
      if (others.some(o => Math.abs(turn(o.a, a)) < minGap)) return
      const crossed = others.some(o => Math.sign(turn(o.a, r.a)) !== Math.sign(turn(o.a, a)) && Math.abs(turn(o.a, a)) < Math.PI / 2)
      if (crossed) return
    }
    S.moved += Math.abs(turn(r.a, a)) * r.len
    S.rays[D.i] = { ...r, a }
    return
  }

  if (D.kind === "line") {
    const i = D.i
    const line = S.lines[i]
    const pivot = S.pivot ?? line.p
    if (dist(p, pivot) < 20) return
    let a = Math.atan2(p[1] - pivot[1], p[0] - pivot[0])
    if (S.tilt) {
      const d = clamp(turnLine(S.tilt.base, a), -S.tilt.max, S.tilt.max)
      a = S.tilt.base + d
    }
    // the line across (or the second of two crossing lines) never turns flat onto the first
    const across = i === 2 || (S.board === "cross" && i === 1)
    const flattest = S.board === "parallel" ? Math.max(S.transMin * RAD, minAcross(L)) : S.transMin * RAD
    if (across && S.lines[0] && lineGap(a, S.lines[0].a) < flattest) return
    S.snapped = false
    if (S.parSnap !== null && S.lines[S.parSnap] && lineGap(a, S.lines[S.parSnap].a) < 3 * RAD) {
      a = S.lines[S.parSnap].a
      S.snapped = true
    }
    if (S.magnet !== null && i === 2 && S.lines[0]) {
      const acute = lineGap(a, S.lines[0].a) * DEG
      if (Math.abs(acute - S.magnet) <= 2.5) {
        const base = rightDir(S.lines[0].a)
        const cand = [base - S.magnet * RAD, base + S.magnet * RAD]
        a = cand.reduce((x, y) => (lineGap(y, a) < lineGap(x, a) ? y : x))
        S.snapped = true
      }
    }
    S.moved += lineGap(line.a, a) * 120
    S.turned += lineGap(line.a, a) * DEG
    S.lines[i] = { p: pivot, a }
  }
}

/** The signed turn between two line directions, the short way mod 180. */
function turnLine(from: number, to: number) {
  let d = turn(from, to)
  if (d > Math.PI / 2) d -= Math.PI
  if (d < -Math.PI / 2) d += Math.PI
  return d
}

export function pointerUp(S: Scene) {
  if (S.stroke) { endStroke(S); return }
  if (!S.drag) return
  S.drag = null
  S.releases++
  if (S.snapped && (S.snaps.length || S.magnet !== null || S.parSnap !== null)) S.locked = true
}

// ── drawing straight lines ───────────────────────────────────────────────

function endStroke(S: Scene) {
  const st = S.stroke!
  S.stroke = null
  const L = layout(S)
  const length = dist(st.from, st.to)
  if (length < 60 * screenScale(S)) return
  const a = Math.atan2(st.to[1] - st.from[1], st.to[0] - st.from[0])
  const mid = lerpV(st.from, st.to, 0.5)
  const g = S.drawGoal
  const fade = () => S.fading.push({ a: st.from, b: st.to, life: 1 })

  if (g === "line" || (g === "twoCross" && S.lines.length === 0) || (g === "parallel" && S.lines.length === 0)) {
    S.lines = [{ p: mid, a }]
    S.linesD = [{ p: mid, a }]
    S.touched = { kind: "line", i: 0 }
    S.flashGood = 0.6
    return
  }
  if (g === "ray" && S.lines[0]) {
    const foot = projectOn(st.from, S.lines[0])
    if (dist(foot, st.from) > (S.touch ? 40 : 28)) { fade(); say(S, "Start on the line."); return }
    const ra = Math.atan2(st.to[1] - foot[1], st.to[0] - foot[0])
    if (lineGap(ra, S.lines[0].a) < 12 * RAD) { fade(); say(S, "Draw it away from the line."); return }
    const ray = { from: foot, a: ra, len: clamp(dist(foot, st.to), 80, L.arm * 1.2) }
    S.rays = [ray]
    S.raysD = [{ ...ray }]
    S.touched = { kind: "ray", i: 0 }
    S.flashGood = 0.6
    return
  }
  if (g === "twoCross" && S.lines.length >= 1) {
    const cand: Line = { p: mid, a }
    const X = intersect(S.lines[0], cand)
    const inside = X && X[0] > L.board.x0 + 40 && X[0] < L.board.x1 - 40 && X[1] > L.board.y0 + 30 && X[1] < L.board.y1 - 30
    if (!X || !inside || lineGap(a, S.lines[0].a) < 20 * RAD) { fade(); say(S, "Make it cross the first line."); return }
    S.lines = [S.lines[0], { p: X, a }]
    S.linesD = [S.linesD[0], { p: X, a }]
    S.touched = { kind: "line", i: 1 }
    S.flashGood = 0.8
    return
  }
  if (g === "parallel" && S.lines.length >= 1) {
    const l0 = S.lines[0]
    if (lineGap(a, l0.a) <= 7 * RAD) {
      const gap = Math.abs(dot(sub(mid, l0.p), [-Math.sin(l0.a), Math.cos(l0.a)]))
      if (gap < 50 * screenScale(S)) { fade(); say(S, "Leave a gap between them."); return }
      S.lines = [l0, { p: mid, a: l0.a }]
      S.linesD = [S.linesD[0], { p: mid, a }]
      S.touched = { kind: "line", i: 1 }
      S.flashGood = 1
      return
    }
    // not parallel: show where they would meet, then let it go
    S.temp = { line: { p: mid, a }, until: S.time + 2.2 }
    const X = intersect(l0, { p: mid, a })
    const seen = X && X[0] > L.board.x0 && X[0] < L.board.x1 && X[1] > L.board.y0 && X[1] < L.board.y1
    say(S, seen ? "These two meet here." : "Stretch them out and they would meet.", "calm", 2.4)
    return
  }
  if (g === "trans" && S.lines.length >= 2) {
    const cand: Line = { p: mid, a }
    const X1 = intersect(S.lines[0], cand), X2 = intersect(S.lines[1], cand)
    const inB = (X: Vec | null) => !!X && X[0] > L.board.x0 + 30 && X[0] < L.board.x1 - 30 && X[1] > L.board.y0 + 20 && X[1] < L.board.y1 - 20
    if (!inB(X1) || !inB(X2) || lineGap(a, S.lines[0].a) < 20 * RAD) { fade(); say(S, "Draw it right across both lines."); return }
    const c = lerpV(X1!, X2!, 0.5)
    S.lines = [S.lines[0], S.lines[1], { p: c, a }]
    S.linesD = [S.linesD[0], S.linesD[1], { p: c, a }]
    S.touched = { kind: "line", i: 2 }
    S.flashGood = 1
    return
  }
}

// ── typed answers and choices ────────────────────────────────────────────

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
    if (hit) S.flashGood = 1
    say(S, hit ? "Spot on." : "Let's see.", "calm", 2.4)
    inp.onRight?.(S)
    return
  }
  if (v === inp.answer) {
    inp.state = "right"
    S.flashGood = 1
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  inp.help?.(S, inp.tries)
  if (inp.hints.length) S.vis.hint.t = 1
}

export function choose(S: Scene, k: number) {
  const c = S.choices
  if (!c || c.state === "right") return
  c.picked = k
  if (k === c.answer) { c.state = "right"; S.flashGood = 1; c.onRight?.(S); return }
  c.tries++
  c.state = "wrong"
  c.wrongAt = S.time
  c.help?.(S, c.tries)
}

export { lineGap, rightDir, upDir, intersect, clipLine, dirOf, quadSides, len }
