/**
 * The board for "angles in polygons".
 *
 * Same idea as the triangle lesson: one board for the whole lesson, the
 * student's own shape carried from beat to beat. What is new here: any
 * number of corners (convex only), lines drawn corner to corner, corners
 * added by tapping a side, sides stretched past a corner, a walker that
 * goes round the shape, and a dial that collects the turns.
 *
 * `P` is where the shape IS; `D` is what is drawn, eased toward `P`.
 */

import {
  type Vec, type Rect,
  add, sub, mul, dot, dist, len, unit, lerp, lerpV, clamp, clampToRect, ease, centreIn, fitInto, rotateAbout, turn,
} from "../geometry"
import {
  nxt, prv, interiors, isConvex, polyArea, centroidOf, regularFlat, diagonalsFrom, fan, signedArea,
  fromInteriors, radialResample, segDist, shownInteriors, angleSum, wedgeOut, heading, cornerRadius, labelSpot,
} from "./poly"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const GREY = "#7a7875"
export const CHALK = "#e8e6e0"
/** Corner colours, in order. Past four, neutrals: colour only for what needs telling apart. */
export const PALETTE = [BLUE, ORANGE, PINK, YELLOW, "#c9c7bf", "#97958e"]
export const cornerColour = (i: number) => PALETTE[i % PALETTE.length]
export const TRI_COLOURS = [BLUE, ORANGE, PINK, YELLOW, "#c9c7bf", "#97958e", BLUE, ORANGE]

export type Mode = "none" | "draw" | "free" | "regular" | "addCorner" | "diag" | "extend" | "walk"
export type VisKey =
  | "shape" | "nodes" | "arcs" | "values" | "sum" | "ticks" | "diags" | "tris" | "triLabels" | "split"
  | "line" | "keypad" | "hint" | "ext" | "extValues" | "dial" | "walker" | "table" | "overlay" | "stepper"

const VIS_KEYS: VisKey[] = [
  "shape", "nodes", "arcs", "values", "sum", "ticks", "diags", "tris", "triLabels", "split",
  "line", "keypad", "hint", "ext", "extValues", "dial", "walker", "table", "overlay", "stepper",
]

type Spring = { v: number; t: number }
type RGB = [number, number, number]

export type EqPart = string | { box: true }

export interface InputState {
  parts: EqPart[]
  answer: number
  value: string
  tries: number
  /** "guessed": a guess went in. Only a right guess turns green. */
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  /** hint lines (TeX), one per wrong try from the first */
  hints: string[]
  /** a guess: any number is accepted */
  guess?: boolean
  /** the answer is an angle, so the box shows a degree sign */
  deg?: boolean
  /** what changes on the board when it is right */
  onRight?: (S: Scene) => void
  /** what lights up on the board after each wrong try: a reminder, never the answer */
  help?: (S: Scene, tries: number) => void
}

export interface Wedge { c: Vec; start: number; sweep: number; r: number; color: string; label?: string; labelColor?: string; pulse?: boolean; dashed?: boolean }
export interface Overlay {
  polys: { pts: Vec[]; stroke: string; fill: string }[]
  wedges: Wedge[]
  lines?: { a: Vec; b: Vec; dashed?: boolean }[]
  texts?: { p: Vec; tex: string; color: string; size?: number; pulse?: boolean }[]
}

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number

  // drawing
  chain: Vec[]
  stroke: { from: Vec; to: Vec; at: "head" | "tail" | "new"; closing: boolean } | null
  fading: { a: Vec; b: Vec; life: number }[]
  drewOnce: boolean
  drawSides: number

  // the shape
  P: Vec[] | null
  D: Vec[] | null
  pending: { P: Vec[]; at: number } | null
  mode: Mode
  drag: { i: number; off: Vec } | null
  touch: boolean
  moved: number
  movedCorners: Set<number>
  releases: number
  locked: boolean

  // looks
  vis: Record<VisKey, Spring>
  colT: string[]
  colD: RGB[]
  label: (string | null)[]
  pulse: boolean[]
  glow: boolean[]
  sidePulse: boolean
  ticks: boolean
  oneColour: string | null

  // lines from one corner
  diagFrom: number
  diags: number[]
  diagGrow: Record<number, number>
  diagAuto: { list: number[]; start: number } | null
  diagStroke: { to: Vec; snapK: number | null } | null

  // exterior angles
  extCorners: number[]
  extLen: number
  extCorner: number

  // the walk round the shape
  walk: { at: number; phase: "idle" | "walk" | "turn"; t: number; steps: number; turns: number; h: number; h0: number; h1: number } | null
  dial: {
    wedges: { deg: number; color: string; born: number }[]
    mode: "none" | "walk" | "live" | "regular" | "fill" | "impossible" | "known"
    fill?: { deg: number; start: number; every: number; max: number }
    /** "known": these angles round a full turn, and the gap left */
    known?: { deg: number; color: string }[]
  }
  /** help: the dial's turns light up one after another, from this time */
  dialPulse: number | null
  /** help: number the dial's turns so they can be counted */
  dialCount: boolean
  /** help: the straight line at this corner (inside + outside = 180) */
  lineAt: number | null
  /** help: a total written in the middle of the shape */
  centreText: { tex: string; color: string } | null
  /** help: the 180 inside each triangle breathes */
  triPulse: boolean

  // the sides and triangles table
  table: { cols: [number, number | null][]; start: number; gap: boolean; pulse?: boolean } | null

  lineTex: string | null
  lineWords: string | null
  lineScale: number
  names: { list: { n: number; name: string }[]; start: number; shown: number } | null
  stepper: { n: number; goal: number | null } | null
  overlay: Overlay | null

  input: InputState | null
  /** a worked step shown on the bottom line during "Show me how" */
  walkTex: string | null
  termPos: Vec[]
  sumShownAt: number

  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0,
    chain: [], stroke: null, fading: [], drewOnce: false, drawSides: 4,
    P: null, D: null, pending: null, mode: "none", drag: null, touch: false,
    moved: 0, movedCorners: new Set(), releases: 0, locked: false,
    vis, colT: [], colD: [], label: [], pulse: [], glow: [], sidePulse: false, ticks: false, oneColour: null,
    diagFrom: 0, diags: [], diagGrow: {}, diagAuto: null, diagStroke: null,
    extCorners: [], extLen: 0, extCorner: 1,
    walk: null, dial: { wedges: [], mode: "none" },
    dialPulse: null, dialCount: false, lineAt: null, centreText: null, triPulse: false,
    table: null, lineTex: null, lineWords: null, lineScale: 1, names: null, stepper: null, overlay: null,
    input: null, walkTex: null, termPos: [], sumShownAt: 0,
    flashGood: 0, note: null,
  }
}

// ── colours ──────────────────────────────────────────────────────────────

export function hexRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

/** Per-corner arrays must always match the number of corners. */
function syncCorners(S: Scene) {
  const n = S.P?.length ?? 0
  const fit = <T,>(arr: T[], make: (i: number) => T) => {
    const out = arr.slice(0, n)
    for (let i = out.length; i < n; i++) out.push(make(i))
    return out
  }
  S.colT = fit(S.colT, i => S.oneColour ?? cornerColour(i))
  S.colD = fit(S.colD, i => hexRgb(S.colT[i]))
  S.label = fit(S.label, () => null)
  S.pulse = fit(S.pulse, () => false)
  S.glow = fit(S.glow, () => false)
}

export function colours(S: Scene, list?: string[]) {
  const n = S.P?.length ?? 0
  S.colT = Array.from({ length: n }, (_, i) => list?.[i] ?? S.oneColour ?? cornerColour(i))
  syncCorners(S)
}

// ── layout: from the floor up, the shape gets what is left ───────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  shape: Rect
  lineY: number
  lineSize: number
  hintY: number
  dialC: Vec
  dialR: number
  keypadTop: number
  labelSize: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 132
  let y = h - (compact ? 84 : 96)
  let keypadTop = y
  if (on(S, "keypad")) { y -= 112; keypadTop = y }
  else if (on(S, "stepper")) { y -= 70; keypadTop = y }
  const lineSize = (compact ? 22 : 27) * S.lineScale
  let lineY = y
  if (on(S, "table")) { lineY = y - lineSize * 1.8; y -= lineSize * 3.8 }
  else if (on(S, "sum") || on(S, "line")) { lineY = y - lineSize; y -= lineSize * 2.4 }
  let hintY = y
  if (on(S, "hint")) { hintY = y - 16; y -= 40 }
  let dialR = 0
  let dialC: Vec = [w / 2, y]
  if (on(S, "dial")) {
    dialR = clamp((y - phraseBottom) * 0.15, 30, compact ? 52 : 66)
    dialC = [w / 2, y - dialR - 14]
    y -= dialR * 2 + 34
  }
  const side = compact ? 18 : 28
  return {
    compact,
    phraseBottom,
    shape: { x0: side, x1: w - side, y0: phraseBottom + 22, y1: Math.max(phraseBottom + 140, y - 22) },
    lineY,
    lineSize,
    hintY,
    dialC,
    dialR,
    keypadTop,
    labelSize: compact ? 17 : 21,
  }
}

/** Keep the shape in its room. Only shrinks it, so the student's shape keeps its size where it fits. */
export function refit(S: Scene) {
  if (!S.P) return
  S.P = fitInto(S.P, layout(S).shape, { minSize: 120 })
}

export function resize(S: Scene, w: number, h: number) {
  if (S.w === 0 || S.h === 0) { S.w = w; S.h = h; return }
  const k = Math.min(w, h) / Math.min(S.w, S.h)
  const oc: Vec = [S.w / 2, S.h / 2], nc: Vec = [w / 2, h / 2]
  const map = (p: Vec): Vec => add(mul(sub(p, oc), k), nc)
  if (S.P) S.P = S.P.map(map)
  if (S.D) S.D = S.D.map(map)
  S.chain = S.chain.map(map)
  S.w = w
  S.h = h
  refit(S)
  if (S.P) S.D = S.P.map(p => [p[0], p[1]] as Vec)
}

/** Distances asked of the student shrink with the screen. */
export function screenScale(S: Scene) {
  return clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
}

// ── changing the shape ───────────────────────────────────────────────────

/**
 * Give the board a new shape. When the number of corners changes, the
 * drawn shape is rebuilt from the old outline so the new one grows out of
 * it rather than appearing.
 */
export function setShape(S: Scene, P: Vec[]) {
  if (S.D && S.D.length !== P.length) {
    const c = centroidOf(P)
    const angles = P.map(p => Math.atan2(p[1] - c[1], p[0] - c[0]))
    S.D = radialResample(S.D, centroidOf(S.D), angles)
  }
  if (!S.D) S.D = P.map(p => [p[0], p[1]] as Vec)
  S.P = P
  syncCorners(S)
}

/** Place a shape with these interior angles in the room, centred. */
export function shapeFromAngles(S: Scene, deg: number[], maxSize?: number) {
  const L = layout(S)
  setShape(S, centreIn(fromInteriors(deg), L.shape, maxSize ?? (L.compact ? 280 : 360)))
}

export function regularShape(S: Scene, n: number, maxSize?: number) {
  const L = layout(S)
  setShape(S, centreIn(regularFlat(n, [0, 0], 1), L.shape, maxSize ?? (L.compact ? 260 : 340)))
}

/**
 * Before a new idea, ease a shape the student has squashed (long and thin,
 * or with a needle-sharp corner) back toward a comfortable one. It keeps
 * its corners in the same order and facing the same way, and it moves
 * there rather than jumping, so it still reads as their shape.
 */
export function relax(S: Scene) {
  if (!S.P) return
  const P = S.P
  const n = P.length
  const a = interiors(P)
  const xs = P.map(p => p[0]), ys = P.map(p => p[1])
  const w = Math.max(...xs) - Math.min(...xs), h = Math.max(...ys) - Math.min(...ys)
  const ratio = Math.max(w, h) / Math.max(1, Math.min(w, h))
  if (ratio <= 1.9 && Math.min(...a) >= 40 && Math.max(...a) <= 150) return
  const L = layout(S)
  const c = centroidOf(P)
  const R = Math.min(L.shape.x1 - L.shape.x0, L.shape.y1 - L.shape.y0, L.compact ? 300 : 380) * 0.42
  const phase = Math.atan2(P[0][1] - c[1], P[0][0] - c[0])
  const wind = Math.sign(signedArea(P)) || 1
  const target = P.map((_, i) => add(c, mul([Math.cos(phase + wind * 2 * Math.PI * i / n), Math.sin(phase + wind * 2 * Math.PI * i / n)], R)))
  const mixed = P.map((p, i) => lerpV(p, target[i], 0.7))
  S.P = fitInto(isConvex(mixed, 0.03) ? mixed : target, L.shape, { minSize: 160 })
}

/** Make sure there is a shape with n corners (opening a beat cold). */
export function ensureShape(S: Scene, n: number, deg?: number[]) {
  if (S.P && S.P.length === n) return
  const defaults: Record<number, number[]> = {
    4: [95, 80, 110, 75],
    5: [100, 115, 105, 110, 110],
    6: [130, 110, 125, 115, 120, 120],
  }
  const angles = deg ?? defaults[n]
  if (angles) shapeFromAngles(S, angles)
  else regularShape(S, n)
  S.D = S.P!.map(p => [p[0], p[1]] as Vec)
}

/** Insert a corner on side (i, i+1), pushed out just enough to stay convex. */
function addCornerOnSide(S: Scene, i: number): boolean {
  if (!S.P || !S.D) return false
  const n = S.P.length
  const a = S.P[i], b = S.P[nxt(i, n)]
  const m = lerpV(a, b, 0.5)
  const e = sub(b, a)
  let nrm = unit([-e[1], e[0]])
  const c = centroidOf(S.P)
  if (dot(sub(m, c), nrm) < 0) nrm = [-nrm[0], -nrm[1]]
  for (let h = len(e) * 0.28; h > 2; h *= 0.7) {
    const cand = S.P.slice()
    cand.splice(i + 1, 0, add(m, mul(nrm, h)))
    if (isConvex(cand, 0.03) && interiors(cand).every(x => x < 172)) {
      // the new corner grows out of the middle of the side
      const Dn = S.D.slice()
      Dn.splice(i + 1, 0, lerpV(S.D[i], S.D[nxt(i, n)], 0.5))
      S.D = Dn
      S.P = cand
      S.label.splice(i + 1, 0, null)
      S.pulse.splice(i + 1, 0, false)
      S.glow.splice(i + 1, 0, false)
      S.colD.splice(i + 1, 0, hexRgb(CHALK))
      colours(S)
      S.flashGood = 0.8
      return true
    }
  }
  return false
}

// ── animation ────────────────────────────────────────────────────────────

const NAMES_EVERY = 1.9

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  if (S.pending && S.time >= S.pending.at) { setShape(S, S.pending.P); S.pending = null }

  if (S.names) {
    const idx = Math.min(S.names.list.length - 1, Math.floor((S.time - S.names.start) / NAMES_EVERY))
    if (idx !== S.names.shown) {
      S.names.shown = idx
      regularShape(S, S.names.list[idx].n)
      S.lineWords = `${S.names.list[idx].name}: $${S.names.list[idx].n}$ sides`
    }
  }

  if (S.P && S.D && S.D.length === S.P.length) {
    const f = k(S.drag ? 0.42 : 0.16)
    for (let i = 0; i < S.P.length; i++) S.D[i] = lerpV(S.D[i], S.P[i], f)
  }
  for (let i = 0; i < S.colD.length; i++) {
    const t = hexRgb(S.colT[i] ?? CHALK)
    S.colD[i] = [lerp(S.colD[i][0], t[0], k(0.1)), lerp(S.colD[i][1], t[1], k(0.1)), lerp(S.colD[i][2], t[2], k(0.1))]
  }
  for (const f of S.fading) f.life -= dt * 1.4
  S.fading = S.fading.filter(f => f.life > 0)
  for (const key of Object.keys(S.diagGrow)) {
    const kk = Number(key)
    S.diagGrow[kk] = Math.min(1, S.diagGrow[kk] + dt / 0.4)
  }
  if (S.diagAuto) {
    const due = Math.floor((S.time - S.diagAuto.start) / 0.38)
    for (let q = 0; q <= due && q < S.diagAuto.list.length; q++) {
      const d = S.diagAuto.list[q]
      if (!S.diags.includes(d)) { S.diags.push(d); S.diagGrow[d] = 0 }
    }
    if (due >= S.diagAuto.list.length) S.diagAuto = null
  }

  // the walk
  if (S.walk && S.P) {
    const W = S.walk
    if (W.phase === "walk") {
      W.t = Math.min(1, W.t + dt / 0.75)
      if (W.t >= 1) { W.phase = "idle"; W.at = nxt(W.at, S.P.length); W.steps++ }
    } else if (W.phase === "turn") {
      W.t = Math.min(1, W.t + dt / 0.65)
      W.h = W.h0 + (W.h1 - W.h0) * ease(W.t)
      if (W.t >= 1) {
        W.phase = "idle"
        W.turns++
        W.h = W.h1
        const ext = shownTurn(S, W.at)
        S.dial.wedges.push({ deg: ext, color: cornerColour(W.at), born: S.time })
      }
    }
  }

  S.flashGood = Math.max(0, S.flashGood - dt)
  if (S.note && S.time > S.note.until) S.note = null

  // sum terms fly from the corner labels down into the line
  if (S.D && S.P) {
    const L = layout(S)
    const slots = sumSlots(S, L)
    const n = S.D.length
    if (S.termPos.length !== n) S.termPos = S.D.map(p => [p[0], p[1]] as Vec)
    for (let i = 0; i < n; i++) {
      const from = labelAt(S, L, i)
      if (S.vis.sum.t < 0.5 || S.vis.sum.v < 0.02) S.termPos[i] = from
      else S.termPos[i] = lerpV(S.termPos[i], [slots.terms[i], L.lineY], k(0.085))
    }
  }
}

/** The turn (exterior angle) shown at corner i, matching the shown interior. */
export function shownTurn(S: Scene, i: number) {
  return 180 - shownInteriors(S.P!)[i]
}

// ── geometry the renderer and the beats share ────────────────────────────

export function arcR(S: Scene, L: Layout, i: number) {
  return cornerRadius(S.D!, i, L.compact ? 30 : 38)
}

export function labelAt(S: Scene, L: Layout, i: number): Vec {
  return labelSpot(S.D!, i, arcR(S, L, i), labelSizeFor(S, L))
}

export function labelSizeFor(S: Scene, L: Layout) {
  const n = S.P?.length ?? 3
  return L.labelSize * (n > 6 ? 0.8 : 1)
}

/** Centre x of each item in the sum line, shrunk to fit the width. */
export function sumSlots(S: Scene, L: Layout): { terms: number[]; ops: number[]; total: number; size: number } {
  const n = S.P?.length ?? 3
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
  if (!wasSum && S.vis.sum.t > 0.5) S.sumShownAt = S.time
}

export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drag = null
  S.stroke = null
  S.moved = 0
  S.movedCorners = new Set()
  S.releases = 0
  S.locked = false
  S.label = S.label.map(() => null)
  S.pulse = S.pulse.map(() => false)
  S.glow = S.glow.map(() => false)
  S.sidePulse = false
  S.ticks = false
  S.diagStroke = null
  S.lineTex = null
  S.lineWords = null
  S.lineScale = 1
  S.names = null
  S.stepper = null
  S.overlay = null
  S.input = null
  S.walkTex = null
  S.table = null
  S.note = null
  S.pending = null
  S.dialPulse = null
  S.dialCount = false
  S.lineAt = null
  S.centreText = null
  S.triPulse = false
}

export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

export function clearLines(S: Scene) {
  S.diags = []
  S.diagGrow = {}
  S.diagAuto = null
}

export function autoDiagonals(S: Scene, from = 0) {
  if (!S.P) return
  S.diagFrom = from
  S.diagAuto = { list: diagonalsFrom(from, S.P.length).filter(d => !S.diags.includes(d)), start: S.time + 0.2 }
}

export function allDiagonals(S: Scene, from = 0) {
  if (!S.P) return
  S.diagFrom = from
  S.diags = diagonalsFrom(from, S.P.length)
  S.diagGrow = Object.fromEntries(S.diags.map(d => [d, 1]))
  S.diagAuto = null
}

export function startWalk(S: Scene) {
  if (!S.P) return
  const h = heading(S.P, 0)
  S.walk = { at: 0, phase: "idle", t: 0, steps: 0, turns: 0, h, h0: h, h1: h }
  S.dial = { wedges: [], mode: "walk" }
}

/** One tap: walk the next side, or turn at the corner just reached. */
export function walkTap(S: Scene) {
  const W = S.walk
  if (!W || !S.P || W.phase !== "idle") return
  const n = S.P.length
  if (W.turns >= n) return
  if (W.steps === W.turns) {
    W.phase = "walk"
    W.t = 0
  } else {
    W.phase = "turn"
    W.t = 0
    W.h0 = W.h
    // the walker turns through the exterior angle at this corner
    W.h1 = W.h + turn(W.h, heading(S.P, W.at))
  }
}

/** Where the walker is drawn right now. */
export function walkerPose(S: Scene): { p: Vec; h: number } | null {
  const W = S.walk
  if (!W || !S.D) return null
  const n = S.D.length
  if (W.phase === "walk") {
    return { p: lerpV(S.D[W.at], S.D[nxt(W.at, n)], ease(W.t)), h: W.h }
  }
  return { p: S.D[W.at], h: W.h }
}

// ── input ────────────────────────────────────────────────────────────────

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const L = layout(S)
  if (S.mode === "draw") return startStroke(S, p)
  if (S.mode === "walk") { walkTap(S); return false }
  if (!S.P || !S.D) return false
  const R = touch ? 42 : 28

  if (S.mode === "addCorner") {
    let best = -1, bd = Infinity
    for (let i = 0; i < S.P.length; i++) {
      const d = segDist(p, S.D[i], S.D[nxt(i, S.P.length)])
      if (d < bd) { bd = d; best = i }
    }
    if (best >= 0 && bd <= (touch ? 34 : 24)) addCornerOnSide(S, best)
    return false
  }

  if (S.mode === "diag") {
    if (dist(p, S.D[S.diagFrom]) <= R + 6) {
      S.diagStroke = { to: p, snapK: null }
      return true
    }
    say(S, "Start from the glowing corner.", "calm", 2.2)
    return false
  }

  if (S.mode === "extend") {
    const c = S.D[S.extCorner]
    const w = wedgeOut(S.D, S.extCorner)
    const tip = add(c, mul(w.dirIn, S.extLen))
    if (dist(p, c) <= R + 8 || dist(p, tip) <= R) {
      S.drag = { i: S.extCorner, off: [0, 0] }
      return true
    }
    return false
  }

  if (S.mode === "free" || S.mode === "regular") {
    if (S.locked) return false
    let best = -1, bd = Infinity
    for (let i = 0; i < S.D.length; i++) {
      if (!S.glow[i]) continue
      const d = dist(p, S.D[i])
      if (d < bd) { bd = d; best = i }
    }
    if (best < 0 || bd > R) return false
    S.drag = { i: best, off: sub(S.P[best], p) }
    return true
  }
  void L
  return false
}

export function pointerMove(S: Scene, p: Vec) {
  if (S.stroke) { moveStroke(S, p); return }
  const L = layout(S)
  if (S.mode === "diag" && S.diagStroke && S.D) {
    const R = S.touch ? 44 : 30
    let snap: number | null = null, bd = Infinity
    for (let k = 0; k < S.D.length; k++) {
      if (k === S.diagFrom) continue
      const d = dist(p, S.D[k])
      if (d < R && d < bd) { bd = d; snap = k }
    }
    S.diagStroke = { to: snap !== null ? S.D[snap] : p, snapK: snap }
    return
  }
  if (!S.drag || !S.P) return
  const i = S.drag.i

  if (S.mode === "extend") {
    const w = wedgeOut(S.P, i)
    S.extLen = clamp(dot(sub(p, S.P[i]), w.dirIn), 0, 150 * screenScale(S) + 30)
    return
  }

  const q = clampToRect(add(p, S.drag.off), L.shape)
  const before = S.P[i]
  let next: Vec[] | null = null

  if (S.mode === "free") {
    // Follow the finger; if that spot would fold a corner inwards, go as
    // far toward it as the shape allows.
    const sc = screenScale(S)
    const ok = (c: Vec[]) => isConvex(c, 0.035) && polyArea(c) > 9000 * sc * sc && interiors(c).every(a => a > 4 && a < 176)
    const c = S.P.slice()
    c[i] = q
    if (ok(c)) next = c
    else {
      let lo = 0, hi = 1
      for (let it = 0; it < 10; it++) {
        const mid = (lo + hi) / 2
        const t = S.P.slice()
        t[i] = lerpV(before, q, mid)
        if (ok(t)) lo = mid
        else hi = mid
      }
      if (lo > 0.001) { const t = S.P.slice(); t[i] = lerpV(before, q, lo); next = t }
    }
  } else if (S.mode === "regular") {
    // Turn and resize about the centre; the shape stays regular.
    const G = centroidOf(S.P)
    const v0 = sub(S.P[i], G)
    let v1 = sub(q, G)
    // big enough for six labels to sit apart, on any screen
    const minR = Math.max(118, 150 * screenScale(S))
    if (len(v1) < minR) v1 = mul(unit(v1), minR)
    const ang = Math.atan2(v1[1], v1[0]) - Math.atan2(v0[1], v0[0])
    let s = len(v1) / (len(v0) || 1)
    for (let tries = 0; tries < 24; tries++) {
      const c = S.P.map(pt => add(G, mul(sub(rotateAbout(pt, G, ang), G), s)))
      if (c.every(pt => pt[0] >= L.shape.x0 && pt[0] <= L.shape.x1 && pt[1] >= L.shape.y0 && pt[1] <= L.shape.y1)) { next = c; break }
      s *= 0.95
    }
  }

  if (next) {
    S.moved += dist(before, next[i])
    S.movedCorners.add(i)
    S.P = next
  }
}

export function pointerUp(S: Scene) {
  if (S.stroke) { endStroke(S); return }
  if (S.mode === "diag" && S.diagStroke && S.P) {
    const k = S.diagStroke.snapK
    S.diagStroke = null
    if (k === null) return
    const n = S.P.length
    if (k === nxt(S.diagFrom, n) || k === prv(S.diagFrom, n)) { say(S, "That's already a side. Go across."); return }
    if (!S.diags.includes(k)) { S.diags.push(k); S.diagGrow[k] = 0.15 }
    return
  }
  if (!S.drag) return
  S.drag = null
  S.releases++
}

// ── drawing a shape with straight strokes ────────────────────────────────

const snapR = (S: Scene) => (S.touch ? 46 : 32)

function startStroke(S: Scene, p0: Vec): boolean {
  const L = layout(S)
  const p = clampToRect(p0, L.shape)
  const R = snapR(S)
  let at: "head" | "tail" | "new" = "new"
  let from = p
  if (S.chain.length >= 2) {
    const head = S.chain[S.chain.length - 1], tail = S.chain[0]
    const dh = dist(p, head), dtl = dist(p, tail)
    if (Math.min(dh, dtl) <= R) {
      at = dh <= dtl ? "head" : "tail"
      from = at === "head" ? head : tail
    }
  }
  S.stroke = { from, to: from, at, closing: false }
  S.drewOnce = true
  return true
}

function moveStroke(S: Scene, p0: Vec) {
  if (!S.stroke) return
  const L = layout(S)
  let q = clampToRect(p0, L.shape)
  const st = S.stroke
  st.closing = false
  if (st.at !== "new" && S.chain.length >= 3) {
    const other = st.at === "head" ? S.chain[0] : S.chain[S.chain.length - 1]
    if (dist(q, other) <= snapR(S)) { q = other; st.closing = true }
  }
  st.to = q
}

function fadeChain(S: Scene) {
  for (let i = 0; i + 1 < S.chain.length; i++) S.fading.push({ a: S.chain[i], b: S.chain[i + 1], life: 1 })
  S.chain = []
}

function endStroke(S: Scene) {
  const st = S.stroke
  S.stroke = null
  if (!st) return
  if (dist(st.from, st.to) < 24) return
  if (st.at === "new") {
    if (S.chain.length) fadeChain(S)
    S.chain = [st.from, st.to]
    return
  }
  const want = S.drawSides
  if (st.closing) {
    const pts = S.chain.slice()
    S.chain = []
    const fade = () => { for (let i = 0; i < pts.length; i++) S.fading.push({ a: pts[i], b: pts[nxt(i, pts.length)], life: 1 }) }
    if (pts.length !== want) {
      fade()
      say(S, `That has ${pts.length === 3 ? "three" : pts.length} sides. Draw ${want === 4 ? "four" : want}.`)
      return
    }
    if (!isConvex(pts, 0.03)) { fade(); say(S, "Keep every corner pointing outwards."); return }
    if (polyArea(pts) < 4000 || interiors(pts).some(a => a < 8)) { fade(); say(S, "Draw it a bit bigger."); return }
    S.D = pts.map(p => [p[0], p[1]] as Vec)
    S.P = pts.map(p => [p[0], p[1]] as Vec)
    colours(S)
    S.flashGood = 1
    S.mode = "none"
    S.note = null
    return
  }
  const others = st.at === "head" ? S.chain.slice(0, -1) : S.chain.slice(1)
  if (others.some(c => dist(c, st.to) < snapR(S))) { S.fading.push({ a: st.from, b: st.to, life: 1 }); return }
  if (st.at === "head") S.chain.push(st.to)
  else S.chain.unshift(st.to)
  if (S.chain.length > want) {
    const dropped = st.at === "head" ? S.chain.pop()! : S.chain.shift()!
    S.fading.push({ a: st.from, b: dropped, life: 1 })
    say(S, "Join it back to where you started.")
  }
}

// ── typed answers ────────────────────────────────────────────────────────

export function startInput(S: Scene, spec: Omit<InputState, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right") return
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
    // a guess is never wrong, but only a right one looks right
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
  refit(S)
}

// ── the − and + stepper ──────────────────────────────────────────────────

export function stepSides(S: Scene, d: number) {
  if (!S.stepper || S.locked) return
  const n = clamp(S.stepper.n + d, 3, 12)
  if (n === S.stepper.n) return
  S.stepper.n = n
  regularShape(S, n)
  if (S.stepper.goal !== null && Math.abs(angleSum(n) / n - S.stepper.goal) < 0.01) {
    S.locked = true
    S.flashGood = 1
  }
}

export { shownInteriors, angleSum, fan, diagonalsFrom, isConvex, centroidOf, wedgeOut, interiors }
