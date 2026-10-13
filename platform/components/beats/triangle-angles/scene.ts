/**
 * The board for "angles in a triangle".
 *
 * One scene lives for the whole lesson. The student draws a triangle in the
 * first beat and every later beat works on THAT triangle: its corners glow,
 * its angles appear, its angles tear off. Practice beats morph it into new
 * shapes rather than swapping in a new picture, so the board never resets.
 *
 * `P` is where the triangle IS. `D` is what is drawn, eased toward `P`
 * every frame, so every change on the board moves instead of jumping.
 */

import {
  type Vec, type Rect,
  add, sub, mul, dot, cross, dist, len, unit, lerp, lerpV, clamp, clampToRect, ease, DEG, RAD,
  anglesOf, wholeAngles, wedgeAt, area, centroid, fitInto, centreIn, triFromAngles,
  projectOnLine, rotateAbout, turn, apexFor, bbox,
} from "../geometry"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const GREY = "#7a7875"
export const CHALK = "#e8e6e0"

export type Mode = "none" | "draw" | "free" | "iso" | "equi" | "tap"
export type SnapKind = "none" | "iso" | "equi" | "targets"
export type VisKey =
  | "tri" | "nodes" | "arcs" | "values" | "sum" | "ticks"
  | "fan" | "fan180" | "line" | "keypad" | "hint" | "helpFan"

type Spring = { v: number; t: number }
type RGB = [number, number, number]

export type EqPart = string | { box: true }

export interface InputState {
  parts: EqPart[]
  answer: number
  value: string
  tries: number
  state: "idle" | "wrong" | "right"
  wrongAt: number
  /** corners whose "?" turns into the answer once it is right */
  unknown: number[]
  /** hint line shown after the second and third wrong try (TeX) */
  hints: string[]
  /** the known angles, drawn as wedges on a straight line with a gap */
  known: { deg: number; color: string }[]
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

  // the triangle
  P: Vec[] | null
  D: Vec[] | null
  mode: Mode
  snapKind: SnapKind
  apex: number
  drag: { i: number; off: Vec } | null
  touch: boolean
  moved: number
  movedCorners: Set<number>
  snapped: boolean
  locked: boolean
  releases: number
  lastRelease: number

  // looks
  vis: Record<VisKey, Spring>
  colT: string[]
  colD: RGB[]
  label: (string | null)[]
  pulse: boolean[]
  glow: boolean[]
  tickKind: "none" | "iso" | "equi"
  pulseLine: boolean
  sumShownAt: number
  termPos: Vec[]
  tear: { on: boolean; t: number }[]
  tearOrder: number[]
  onTap: ((S: Scene, i: number) => void) | null
  lineTex: string | null

  // practice
  input: InputState | null
  targets: number[] | null
  chipLit: boolean[]

  // feedback
  flashGood: number
  shakeAt: number[]
  note: { text: string; until: number } | null
}

const VIS_KEYS: VisKey[] = ["tri", "nodes", "arcs", "values", "sum", "ticks", "fan", "fan180", "line", "keypad", "hint", "helpFan"]

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0,
    chain: [], stroke: null, fading: [], drewOnce: false,
    P: null, D: null, mode: "none", snapKind: "none", apex: 2,
    drag: null, touch: false, moved: 0, movedCorners: new Set(), snapped: false, locked: false,
    releases: 0, lastRelease: -1,
    vis,
    colT: [BLUE, ORANGE, PINK],
    colD: [hexRgb(BLUE), hexRgb(ORANGE), hexRgb(PINK)],
    label: [null, null, null],
    pulse: [false, false, false],
    glow: [false, false, false],
    tickKind: "none",
    pulseLine: false,
    sumShownAt: 0,
    termPos: [[0, 0], [0, 0], [0, 0]],
    tear: [{ on: false, t: 0 }, { on: false, t: 0 }, { on: false, t: 0 }],
    tearOrder: [],
    onTap: null,
    lineTex: null,
    input: null,
    targets: null,
    chipLit: [false, false, false],
    flashGood: 0,
    shakeAt: [-9, -9, -9],
    note: null,
  }
}

// ── colours ──────────────────────────────────────────────────────────────

export function hexRgb(h: string): RGB {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

// ── layout: where everything sits on this screen ─────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  tri: Rect
  lineY: number
  lineSize: number
  hintY: number
  fanO: Vec
  fanR: number
  keypadTop: number
  labelSize: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

/**
 * Stack the bottom of the screen from the floor up, and give the triangle
 * whatever is left. Uses the TARGET visibility, so the triangle starts
 * moving out of the way as soon as something is about to appear.
 */
export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 132
  let y = h - (compact ? 84 : 96)                       // continue button
  let keypadTop = y
  if (on(S, "keypad")) { y -= 112; keypadTop = y }
  const lineSize = compact ? 22 : 27
  let lineY = y
  if (on(S, "sum") || on(S, "line")) { lineY = y - lineSize; y -= lineSize * 2.4 }
  let hintY = y
  if (on(S, "hint")) { hintY = y - 16; y -= 40 }
  let fanR = 0
  let fanO: Vec = [w / 2, y]
  if (on(S, "fan") || on(S, "helpFan")) {
    fanR = clamp((y - phraseBottom) * 0.2, 38, compact ? 62 : 80)
    fanO = [w / 2, y - 12]
    y -= fanR + 46
  }
  const side = compact ? 18 : 28
  return {
    compact,
    phraseBottom,
    tri: { x0: side, x1: w - side, y0: phraseBottom + 22, y1: Math.max(phraseBottom + 140, y - 22) },
    lineY,
    lineSize,
    hintY,
    fanO,
    fanR,
    keypadTop,
    labelSize: compact ? 19 : 23,
  }
}

/**
 * How big this screen is compared with a laptop. Distances a student is
 * asked to drag shrink with it, so a phone asks for the same gesture.
 */
export function screenScale(S: Scene) {
  return clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
}

/** Keep the triangle inside its room, easing it there. */
export function refit(S: Scene, minSize = 120) {
  if (!S.P) return
  const L = layout(S)
  S.P = fitInto(S.P, L.tri, { minSize })
}

/** The screen changed size: carry everything across proportionally. */
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
  if (S.D && S.P) S.D = S.P.map(p => [p[0], p[1]] as Vec)
}

// ── per-corner geometry used by both the renderer and the logic ──────────

export function arcRadius(D: Vec[], i: number, compact: boolean): number {
  const m = Math.min(dist(D[i], D[(i + 1) % 3]), dist(D[i], D[(i + 2) % 3]))
  return clamp(m * 0.26, 14, compact ? 34 : 42)
}

/**
 * Where a corner's angle label sits. Inside the corner, just past the arc,
 * when it fits there; otherwise just outside the corner, on the same line.
 * A narrow corner has no room inside, and labels squeezed into it end up
 * on top of each other or far from the angle they name.
 */
export function valuePos(D: Vec[], i: number, compact: boolean, size: number): Vec {
  const w = wedgeAt(D, i)
  const bis = w.start + w.sweep / 2
  const u: Vec = [Math.cos(bis), Math.sin(bis)]
  const r = arcRadius(D, i, compact)
  const j = (i + 1) % 3, k = (i + 2) % 3
  const q = add(D[i], mul(u, r + size * 1.05))
  const room = Math.min(lineDist(q, D[i], D[j]), lineDist(q, D[i], D[k]), lineDist(q, D[j], D[k]))
  if (insideTri(q, D) && room >= size * 0.78) return q
  return add(D[i], mul(u, -(size * 1.45 + 4)))
}

function lineDist(q: Vec, a: Vec, b: Vec) {
  const d = sub(b, a)
  return Math.abs(d[0] * (q[1] - a[1]) - d[1] * (q[0] - a[0])) / (len(d) || 1)
}

function insideTri(q: Vec, D: Vec[]) {
  const s = (a: Vec, b: Vec) => Math.sign((b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]))
  const s1 = s(D[0], D[1]), s2 = s(D[1], D[2]), s3 = s(D[2], D[0])
  return s1 === s2 && s2 === s3
}

/** Centre x of each item in the sum line: a + b + c = 180. */
export function sumSlots(S: Scene, L: Layout): { terms: number[]; ops: number[]; total: number } {
  const em = L.lineSize
  const TERM = 2.5 * em, OP = 1.15 * em, TOT = 2.7 * em
  const width = 3 * TERM + 3 * OP + TOT
  let x = S.w / 2 - width / 2
  const terms: number[] = [], ops: number[] = []
  for (let i = 0; i < 3; i++) {
    terms.push(x + TERM / 2); x += TERM
    ops.push(x + OP / 2); x += OP
  }
  return { terms, ops, total: x + TOT / 2 }
}

// ── animation ────────────────────────────────────────────────────────────

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  if (S.P && S.D) {
    const f = k(S.drag ? 0.42 : 0.16)
    for (let i = 0; i < 3; i++) S.D[i] = lerpV(S.D[i], S.P[i], f)
  }
  for (let i = 0; i < 3; i++) {
    const t = hexRgb(S.colT[i])
    S.colD[i] = [lerp(S.colD[i][0], t[0], k(0.1)), lerp(S.colD[i][1], t[1], k(0.1)), lerp(S.colD[i][2], t[2], k(0.1))]
  }
  for (const f of S.fading) f.life -= dt * 1.4
  S.fading = S.fading.filter(f => f.life > 0)
  for (const t of S.tear) if (t.on) t.t = Math.min(1, t.t + dt / 1.05)
  S.flashGood = Math.max(0, S.flashGood - dt)
  if (S.note && S.time > S.note.until) S.note = null

  // Equal-side marks appear the moment two sides lock equal, not before.
  if (S.mode === "free" && S.snapKind === "iso") S.vis.ticks.t = S.snapped ? 1 : 0
  if (S.snapKind === "equi") S.tickKind = S.snapped ? "equi" : "iso"

  // The three sum terms start where the angle labels are and fly down.
  if (S.D) {
    const L = layout(S)
    const slots = sumSlots(S, L)
    for (let i = 0; i < 3; i++) {
      const from = valuePos(S.D, i, L.compact, L.labelSize)
      if (S.vis.sum.t < 0.5 || S.vis.sum.v < 0.02) S.termPos[i] = from
      else S.termPos[i] = lerpV(S.termPos[i], [slots.terms[i], L.lineY], k(0.085))
    }
  }
}

// ── visibility helpers for beats ─────────────────────────────────────────

/** Show exactly these layers; everything else fades out. */
export function show(S: Scene, keys: VisKey[]) {
  const wasSum = S.vis.sum.t > 0.5
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
  if (!wasSum && S.vis.sum.t > 0.5) S.sumShownAt = S.time
}

/** Wipe everything a beat might have set, so any beat can be entered cold. */
export function resetBeat(S: Scene) {
  S.mode = "none"
  S.snapKind = "none"
  S.drag = null
  S.stroke = null
  S.moved = 0
  S.movedCorners = new Set()
  S.snapped = false
  S.locked = false
  S.releases = 0
  S.lastRelease = -1
  S.label = [null, null, null]
  S.pulse = [false, false, false]
  S.glow = [false, false, false]
  S.tickKind = "none"
  S.pulseLine = false
  S.onTap = null
  S.lineTex = null
  S.input = null
  S.targets = null
  S.chipLit = [false, false, false]
  S.note = null
}

export function say(S: Scene, text: string, seconds = 2.8) {
  S.note = { text, until: S.time + seconds }
}

export function colours(S: Scene, c: string[]) {
  S.colT = c.slice()
}

// ── shapes the lesson can ask for ────────────────────────────────────────

const ORDER_BASE = { left: 0, right: 1, apex: 2 }

/** Morph the board's triangle into one with these angles (corner 2 on top). */
export function morphTo(S: Scene, deg: number[], order = ORDER_BASE, maxSize?: number) {
  const L = layout(S)
  const max = maxSize ?? (L.compact ? 300 : 400)
  const P = centreIn(triFromAngles(deg, order), L.tri, max)
  S.P = P
  if (!S.D) S.D = P.map(p => [p[0], p[1]] as Vec)
  S.chain = []
  S.stroke = null
}

/** Any beat after the first needs a triangle. Make one if we arrived cold. */
export function ensureTriangle(S: Scene) {
  if (S.P) return
  morphTo(S, [64, 48, 68], ORDER_BASE)
  S.D = S.P!.map(p => [p[0], p[1]] as Vec)
}

/** Corner `apex` is equidistant from the other two. */
export function isIso(P: Vec[], apex: number, tol = 0.004) {
  const a = dist(P[apex], P[(apex + 1) % 3]), b = dist(P[apex], P[(apex + 2) % 3])
  return Math.abs(a - b) / Math.max(a, b) < tol
}

export function isEqui(P: Vec[], tol = 0.004) {
  const s = [dist(P[0], P[1]), dist(P[1], P[2]), dist(P[2], P[0])]
  return (Math.max(...s) - Math.min(...s)) / Math.max(...s) < tol
}

export function ensureIso(S: Scene) {
  ensureTriangle(S)
  if (isIso(S.P!, S.apex)) return
  S.apex = 2
  morphTo(S, [65, 65, 50])
}

export function ensureEqui(S: Scene) {
  ensureTriangle(S)
  if (isEqui(S.P!)) return
  S.apex = 2
  morphTo(S, [60, 60, 60])
}

/**
 * Before asking for an equilateral on this base, make sure one fits on the
 * screen. Otherwise the top corner hits the edge before the sides can
 * match, and the task cannot be done.
 */
export function roomForEqui(S: Scene) {
  if (!S.P) return
  const L = layout(S)
  const j = (S.apex + 1) % 3, k = (S.apex + 2) % 3
  const m = lerpV(S.P[j], S.P[k], 0.5)
  const b = sub(S.P[k], S.P[j])
  let n = unit([-b[1], b[0]])
  if (dot(sub(S.P[S.apex], m), n) < 0) n = [-n[0], -n[1]]
  const Q = S.P.slice()
  Q[S.apex] = add(m, mul(n, (len(b) * Math.sqrt(3)) / 2))
  const pad: Rect = { x0: L.tri.x0 + 10, y0: L.tri.y0 + 10, x1: L.tri.x1 - 10, y1: L.tri.y1 - 10 }
  const F = fitInto(Q, pad, { maxSize: L.compact ? 300 : 430 })
  const kk = dist(F[j], F[k]) / (len(b) || 1)
  S.P = S.P.map(p => add(F[j], mul(sub(p, S.P![j]), kk)))
}

/** A mid-sized triangle in the middle of the board, for building to order. */
export function roomToBuild(S: Scene) {
  if (!S.P) return
  const L = layout(S)
  S.P = centreIn(S.P, L.tri, L.compact ? 220 : 300)
}

// ── input ────────────────────────────────────────────────────────────────

const draggable = (S: Scene, i: number) =>
  (S.mode === "free" || S.mode === "equi") || (S.mode === "iso" && i === S.apex)

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  if (S.mode === "draw") return startStroke(S, p)
  if (S.mode === "tap" && S.D) {
    const R = touch ? 64 : 50
    let best = -1, bd = Infinity
    for (let i = 0; i < 3; i++) {
      // Aim at the angle, not the bare corner: the wedge sits inside it.
      const L = layout(S)
      const target = lerpV(S.D[i], valuePos(S.D, i, L.compact, L.labelSize), 0.5)
      const d = Math.min(dist(p, S.D[i]), dist(p, target))
      if (d < bd) { bd = d; best = i }
    }
    if (best >= 0 && bd <= R) S.onTap?.(S, best)
    return false
  }
  if (!S.P || !S.D) return false
  // Once a shape goal is met, hold it still while the next beat arrives.
  if (S.locked && S.snapKind !== "none") return false
  const R = touch ? 42 : 28
  let best = -1, bd = Infinity
  for (let i = 0; i < 3; i++) {
    if (!draggable(S, i)) continue
    const d = dist(p, S.D[i])
    if (d < bd) { bd = d; best = i }
  }
  if (best < 0 || bd > R) return false
  S.drag = { i: best, off: sub(S.P[best], p) }
  return true
}

export function pointerMove(S: Scene, p: Vec) {
  if (S.stroke) { moveStroke(S, p); return }
  if (!S.drag || !S.P) return
  const L = layout(S)
  const i = S.drag.i
  const q = clampToRect(add(p, S.drag.off), L.tri)
  const before = S.P[i]
  let next: Vec[] | null = null

  if (S.mode === "free") {
    // The corner follows the finger exactly. It only clicks into place for
    // a task: two sides becoming equal, or an angle reaching a target.
    const plain = S.P.slice()
    plain[i] = q
    const c = plain.slice()
    S.snapped = false
    if (S.snapKind === "iso") {
      const s = isoSnap(c, i)
      if (s) { c[i] = s.p; S.apex = s.apex; S.snapped = true }
    }
    if (S.snapKind === "targets" && S.targets) c[i] = targetMagnet(c, i, S.targets)
    if (healthy(c) && inside(c, L.tri)) next = c
    else {
      S.snapped = false
      if (healthy(plain)) next = plain
    }
  } else if (S.mode === "iso") {
    // The top corner slides along the line of symmetry, so the two base
    // angles are always exactly equal.
    const j = (S.apex + 1) % 3, k = (S.apex + 2) % 3
    const m = lerpV(S.P[j], S.P[k], 0.5)
    const b = sub(S.P[k], S.P[j])
    const n = unit([-b[1], b[0]])
    const sideNow = Math.sign(dot(sub(S.P[S.apex], m), n)) || 1
    let s = dot(sub(projectOnLine(q, m, n), m), n)
    if (Math.sign(s) !== sideNow || Math.abs(s) < 26) s = 26 * sideNow
    S.snapped = false
    if (S.snapKind === "equi") {
      const H = (len(b) * Math.sqrt(3)) / 2
      if (Math.abs(Math.abs(s) - H) / H < 0.075) { s = H * sideNow; S.snapped = true }
    }
    const c = S.P.slice()
    c[S.apex] = add(m, mul(n, s))
    if (inside(c, L.tri)) next = c
  } else if (S.mode === "equi") {
    const G = centroid(S.P)
    let v = sub(q, G)
    const r = clamp(len(v), 46, 10_000)
    v = mul(unit(v), r)
    const j = (i + 1) % 3, k = (i + 2) % 3
    // keep the corners going round the same way they already do
    const a0 = Math.atan2(S.P[i][1] - G[1], S.P[i][0] - G[0])
    const aj = Math.atan2(S.P[j][1] - G[1], S.P[j][0] - G[0])
    const sgn = Math.sign(turn(a0, aj)) || 1
    // The turn always follows the finger; near an edge the size stops
    // growing instead of the whole move being refused.
    for (let tries = 0; tries < 24; tries++) {
      const c = S.P.slice()
      c[i] = add(G, v)
      c[j] = rotateAbout(c[i], G, sgn * (2 * Math.PI) / 3)
      c[k] = rotateAbout(c[i], G, -sgn * (2 * Math.PI) / 3)
      if (inside(c, L.tri)) { next = c; break }
      v = mul(v, 0.94)
      if (len(v) < 46) break
    }
  }

  if (next) {
    S.moved += dist(before, next[i])
    S.movedCorners.add(i)
    S.P = next
    if (S.snapKind === "targets") litChips(S)
  }
}

export function pointerUp(S: Scene) {
  if (S.stroke) { endStroke(S); return }
  if (!S.drag || !S.P) { S.drag = null; return }
  S.drag = null
  S.releases++
  S.lastRelease = S.time
  if ((S.snapKind === "iso" || S.snapKind === "equi") && S.snapped) S.locked = true
  if (S.snapKind === "targets" && S.targets && S.chipLit.every(Boolean)) S.locked = true
}

/** A triangle the eye can still read: no sliver, no needle. */
function healthy(P: Vec[]) {
  return area(P) > 500 && Math.min(...anglesOf(P)) > 2.5
}

function inside(P: Vec[], r: Rect) {
  return P.every(p => p[0] >= r.x0 - 0.5 && p[0] <= r.x1 + 0.5 && p[1] >= r.y0 - 0.5 && p[1] <= r.y1 + 0.5)
}

/** The angle between two directions, in degrees. */
function angleBetween(u: Vec, v: Vec) {
  return Math.abs(Math.atan2(cross(u, v), dot(u, v))) * DEG
}

/**
 * While the student drags corner i, catch the moment two sides come close
 * to equal and lock them exactly. Three ways it can happen: i becomes the
 * corner between the equal sides, or one of the other corners does.
 */
function isoSnap(P: Vec[], i: number): { p: Vec; apex: number } | null {
  const TOL = 0.075
  const j = (i + 1) % 3, k = (i + 2) % 3
  const cands: { e: number; p: Vec; apex: number }[] = []
  {
    const a = dist(P[i], P[j]), b = dist(P[i], P[k])
    const m = lerpV(P[j], P[k], 0.5), d = sub(P[k], P[j])
    cands.push({ e: Math.abs(a - b) / Math.max(a, b), p: projectOnLine(P[i], m, [-d[1], d[0]]), apex: i })
  }
  for (const c of [j, k]) {
    const other = c === j ? k : j
    const R = dist(P[c], P[other]), r = dist(P[c], P[i])
    cands.push({ e: Math.abs(r - R) / Math.max(r, R), p: add(P[c], mul(unit(sub(P[i], P[c])), R)), apex: c })
  }
  cands.sort((a, b) => a.e - b.e)
  const best = cands[0]
  if (best.e > TOL) return null
  const test = P.slice()
  test[i] = best.p
  return healthy(test) ? { p: best.p, apex: best.apex } : null
}

/**
 * Building to order. Corner i follows the finger until one of the two
 * angles it controls comes within a couple of degrees of a target; then it
 * slides along the line that holds that angle exactly, and that chip
 * lights. When both come close, it clicks onto the exact triangle. The
 * dragged corner's own angle is whatever is left: two angles fix the third.
 */
function targetMagnet(c: Vec[], i: number, T: number[]): Vec {
  const PULL = 2.5
  const j = (i + 1) % 3, k = (i + 2) % 3
  const Pj = c[j], Pk = c[k], q = c[i]
  const aj = angleBetween(sub(Pk, Pj), sub(q, Pj))
  const ak = angleBetween(sub(Pj, Pk), sub(q, Pk))

  // both angles close: the exact triangle
  let full: { err: number; a: number; b: number } | null = null
  for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) {
    if (a === b || T[a] + T[b] >= 178) continue
    const err = Math.max(Math.abs(aj - T[a]), Math.abs(ak - T[b]))
    if (err <= PULL && (!full || err < full.err)) full = { err, a, b }
  }
  if (full) return apexFor(Pj, Pk, T[full.a], T[full.b], q)

  // one angle close: slide along the line that holds it
  let best: { err: number; p: Vec } | null = null
  for (const [from, to, ang] of [[Pj, Pk, aj], [Pk, Pj, ak]] as [Vec, Vec, number][]) {
    for (const t of T) {
      const err = Math.abs(ang - t)
      if (err > PULL || (best && err >= best.err)) continue
      const u = unit(sub(to, from))
      const side = Math.sign(cross(u, sub(q, from))) || 1
      const th = side * t * RAD
      const d: Vec = [u[0] * Math.cos(th) - u[1] * Math.sin(th), u[0] * Math.sin(th) + u[1] * Math.cos(th)]
      best = { err, p: add(from, mul(d, Math.max(12, dot(sub(q, from), d)))) }
    }
  }
  return best ? best.p : q
}

/** A chip lights when some corner shows exactly its number. */
function litChips(S: Scene) {
  if (!S.P || !S.targets) return
  const a = shownAngles(S.P)
  const used = new Set<number>()
  S.chipLit = S.targets.map(t => {
    const c = [0, 1, 2].find(i => !used.has(i) && a[i] === t)
    if (c === undefined) return false
    used.add(c)
    return true
  })
}

export function refreshChips(S: Scene) { litChips(S) }

/**
 * The angles as the student sees them: whole degrees that always add to
 * exactly 180, and angles that are truly equal always read the same. A
 * shown value may be a degree off the true one; nobody measures the screen
 * with a protractor, but a sum of 179 or base angles of 46 and 47 would
 * break the very thing being taught.
 */
export function shownAngles(P: Vec[]): number[] {
  const a = anglesOf(P)
  const EQ = 0.05
  const same = (x: number, y: number) => Math.abs(a[x] - a[y]) < EQ
  if (same(0, 1) && same(1, 2)) return [60, 60, 60]
  const pair = same(0, 1) ? [0, 1, 2] : same(1, 2) ? [1, 2, 0] : same(0, 2) ? [0, 2, 1] : null
  if (pair) {
    const [x, y, z] = pair
    const b = Math.round((a[x] + a[y]) / 2)
    const out = [0, 0, 0]
    out[x] = b
    out[y] = b
    out[z] = 180 - 2 * b
    return out
  }
  return wholeAngles(P)
}

// ── drawing a triangle with straight strokes ─────────────────────────────

const snapR = (S: Scene) => (S.touch ? 46 : 32)

function startStroke(S: Scene, p0: Vec): boolean {
  const L = layout(S)
  const p = clampToRect(p0, L.tri)
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
  let q = clampToRect(p0, L.tri)
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
  if (dist(st.from, st.to) < 24) return               // a tap, not a line

  if (st.at === "new") {
    // A fresh start somewhere else: the old lines go, this one stays.
    if (S.chain.length) fadeChain(S)
    S.chain = [st.from, st.to]
    return
  }

  if (st.closing) {
    const pts = S.chain.slice()
    S.chain = []
    if (area(pts) < 2400 || Math.min(...anglesOf(pts)) < 7) {
      for (let i = 0; i < 3; i++) S.fading.push({ a: pts[i], b: pts[(i + 1) % 3], life: 1 })
      say(S, "Draw it a bit bigger.")
      return
    }
    S.P = pts.map(p => [p[0], p[1]] as Vec)
    S.D = pts.map(p => [p[0], p[1]] as Vec)
    S.flashGood = 1
    S.mode = "none"
    S.note = null
    return
  }

  // Joining onto a corner that is already there would fold the line back.
  const others = st.at === "head" ? S.chain.slice(0, -1) : S.chain.slice(1)
  if (others.some(c => dist(c, st.to) < snapR(S))) {
    S.fading.push({ a: st.from, b: st.to, life: 1 })
    return
  }
  if (st.at === "head") S.chain.push(st.to)
  else S.chain.unshift(st.to)

  if (S.chain.length >= 4) {
    // Three lines that do not close: drop the last one and say how.
    const dropped = st.at === "head" ? S.chain.pop()! : S.chain.shift()!
    S.fading.push({ a: st.from, b: dropped, life: 1 })
    say(S, "Join it back to where you started.")
  }
}

// ── tearing the corners off onto a straight line ─────────────────────────

/** Where torn corner i sits right now: centre, start, sweep, radius. */
export function tornWedge(S: Scene, i: number, L: Layout) {
  const D = S.D!
  const w = wedgeAt(D, i)
  const r0 = arcRadius(D, i, L.compact)
  // Corners land side by side in the order they were torn, starting from
  // the left end of the line (pointing left is angle PI on screen).
  let start = Math.PI
  for (const j of S.tearOrder) {
    if (j === i) break
    start += wedgeAt(D, j).sweep
  }
  const e = ease(S.tear[i].t)
  return {
    c: lerpV(w.c, L.fanO, e),
    start: w.start + turn(w.start, start) * e,
    sweep: w.sweep,
    r: lerp(r0, L.fanR, e),
    e,
  }
}

export function tearAll(S: Scene) {
  S.tearOrder = [0, 1, 2]
  for (const t of S.tear) { t.on = true; t.t = 1 }
}

export function untear(S: Scene) {
  S.tearOrder = []
  for (const t of S.tear) { t.on = false; t.t = 0 }
}

// ── answers typed on the keypad ──────────────────────────────────────────

export function startInput(S: Scene, spec: Omit<InputState, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right") return
  if (key === "back") { inp.value = inp.value.slice(0, -1); inp.state = "idle"; return }
  if (key === "go") { checkInput(S); return }
  if (/^\d$/.test(key) && inp.value.length < 3) {
    if (inp.state === "wrong") inp.value = ""
    inp.value += key
    inp.state = "idle"
  }
}

function checkInput(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  if (Number(inp.value) === inp.answer) {
    inp.state = "right"
    for (const c of inp.unknown) S.label[c] = `${inp.answer}^\\circ`
    for (const c of inp.unknown) S.colT[c] = GREEN
    S.flashGood = 1
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  // Help adds to the board: first the picture, then the sum written out.
  if (inp.tries >= 1) S.vis.helpFan.t = 1
  if (inp.tries >= 2) S.vis.hint.t = 1
  refit(S)
}

// ── a few shape facts the beats test for ─────────────────────────────────

export function shapeRatio(P: Vec[]) {
  const b = bbox(P)
  return { w: b.x1 - b.x0, h: b.y1 - b.y0 }
}

export { anglesOf, wholeAngles }
