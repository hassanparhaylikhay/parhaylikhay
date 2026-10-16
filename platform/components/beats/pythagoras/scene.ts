/**
 * The board for "Pythagoras' theorem". Everything lives in grid units on a
 * square grid (x right, y UP), and the view fits whatever the beat wants to
 * show into the room the board has.
 *
 * The student's right-angled triangle is three named points, C (the right
 * angle), A and B. Squares grow out from its sides; their areas are counted
 * in grid squares, so with corners on whole units every area is a whole
 * number. The four-triangle proof lives on the same board.
 *
 * Targets (`pts`, `view`) are where things ARE; `ptsD`, `viewD` are what is
 * drawn, eased toward the targets every frame.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp, clampToRect, turn, DEG } from "../geometry"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const CHALK = "#e8e6e0"
export const NEUTRAL = "#c9c7bf"

export type Mode = "none" | "slide" | "join" | "tapSeg" | "tapProof"
export type VisKey = "board" | "grid" | "letters" | "lengths" | "areas" | "arcs" | "line" | "keypad" | "hint" | "sum"
const VIS_KEYS: VisKey[] = ["board", "grid", "letters", "lengths", "areas", "arcs", "line", "keypad", "hint", "sum"]

type Spring = { v: number; t: number }

export interface Seg { id: string; a: string; b: string; colour?: string; dash?: boolean }

/** A square standing on segment a-b, on the side away from point `away`. */
export interface Sq {
  id: string
  a: string
  b: string
  away: string
  colour: string
  grow: Spring
}

/** One angle on the board. */
export interface AngSpec {
  id: string
  at: string
  from: string
  to: string
  value: (S: Scene) => number
  colour: string
  /** a right-angle mark with no number */
  mark?: boolean
}

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
  onRight?: (S: Scene) => void
  help?: (S: Scene, tries: number) => void
}

/**
 * The proof: a big square of side a + b holding four copies of the triangle.
 * In the first arrangement they leave the square on the hypotenuse in the
 * middle; moved, they leave the two small squares.
 */
export interface Proof {
  a: number
  b: number
  /** world point of the big square's bottom-left corner */
  at: Vec
  /** when each triangle started to move (null: still in the first arrangement) */
  moved: (number | null)[]
  /** a and b breathe by themselves (the "it always works" beat) */
  breathe: boolean
}

export interface View { cx: number; cy: number; wx: number; wy: number; u: number }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  /** the world rectangle the beat wants in view */
  frame: Rect
  /** worked out again whenever no finger is down (the figure grows, the view follows) */
  frameFn: ((S: Scene) => Rect) | null
  view: View | null
  viewD: View | null

  pts: Record<string, Vec>
  ptsD: Record<string, Vec>
  showPts: string[]
  letters: Set<string>
  /** where a letter sits: away from this world point (the figure's middle when not given) */
  letterAway: Record<string, Vec>
  movable: string[]
  /** where a dragged point may go: the allowed spot for the finger, in world units */
  constrain: Record<string, (S: Scene, w: Vec) => Vec>

  segs: Seg[]
  squares: Sq[]
  /** text on a square, worked out every frame (its area by default) */
  areaText: Record<string, (S: Scene) => string>
  /** text along a line (a length, a letter, a "?") */
  segText: Record<string, (S: Scene) => string>
  segTextColour: Record<string, string>
  angles: AngSpec[]
  fills: { pts: string[]; color: string }[]
  /** the two pieces of the proof board */
  proof: Proof | null
  /** a second proof square beside the first, already rearranged */
  proofTwin: boolean

  /** the sum of the two small squares, at the bottom: when the numbers started to fly down */
  sumFly: number | null
  sumVals: ((S: Scene) => [number, number, number]) | null

  joinNeed: [string, string][]
  joinHint: string
  stroke: { from: Vec; to: Vec } | null
  fading: { a: Vec; b: Vec; life: number }[]
  drewOnce: boolean
  tapIds: string[] | null
  onTapSeg: ((S: Scene, id: string) => void) | null
  /** the corners of a turned triangle breathe: tap a side */
  breatheTri: boolean

  vis: Record<VisKey, Spring>
  pulse: Set<string>
  pulseSegs: Set<string>
  pulseSquares: Set<string>
  walkTex: string | null
  lineTex: string | null
  lineFn: ((S: Scene) => string) | null
  chips: Chip[]
  got: Set<string>

  input: InputState | null
  drag: { name: string } | null
  touch: boolean
  moved: number
  movedBy: Record<string, number>
  releases: number
  snapped: boolean
  locked: boolean
  /** the drag has a goal: when the board meets it, the point clicks and stays */
  lockWhen: ((S: Scene) => boolean) | null
  /** a word after letting go short of the goal (null: nothing to say) */
  releaseNote: ((S: Scene) => string | null) | null
  touched: { kind: "seg"; id: string } | { kind: "pt"; name: string } | { kind: "sq"; id: string } | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    frame: { x0: -1, y0: -1, x1: 6, y1: 6 }, frameFn: null, view: null, viewD: null,
    pts: {}, ptsD: {}, showPts: [], letters: new Set(), letterAway: {}, movable: [], constrain: {},
    segs: [], squares: [], areaText: {}, segText: {}, segTextColour: {}, angles: [], fills: [], proof: null, proofTwin: false,
    sumFly: null, sumVals: null,
    joinNeed: [], joinHint: "", stroke: null, fading: [], drewOnce: false, tapIds: null, onTapSeg: null, breatheTri: false,
    vis, pulse: new Set(), pulseSegs: new Set(), pulseSquares: new Set(), walkTex: null, lineTex: null, lineFn: null, chips: [], got: new Set(),
    input: null, drag: null, touch: false, moved: 0, movedBy: {}, releases: 0, snapped: false, locked: false, lockWhen: null, releaseNote: null,
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
  if (on(S, "line") || on(S, "sum") || S.chips.length) { lineY = y - lineSize; y -= lineSize * 2.4 }
  let hintY = y
  if (on(S, "hint")) { hintY = y - 16; y -= 40 }
  const side = compact ? 18 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 18, y1: Math.max(phraseBottom + 160, y - 18) }
  return { compact, phraseBottom, board, lineY, lineSize, hintY, keypadTop, labelSize: compact ? 16 : 20 }
}

export function screenScale(S: Scene) {
  return clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
}

export function resize(S: Scene, w: number, h: number) {
  S.w = w
  S.h = h
}

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

/** A point's world position (target, or drawn). */
export function wOf(S: Scene, n: string, drawn = true): Vec {
  return (drawn ? S.ptsD[n] : S.pts[n]) ?? S.pts[n] ?? [0, 0]
}

/** A point on screen. */
export const posOf = (S: Scene, n: string, drawn = true) => toScreen(S, wOf(S, n, drawn), drawn)

/** Squared length of a-b in grid units (true positions): an area. */
export function sq2(S: Scene, a: string, b: string): number {
  const p = wOf(S, a, false), q = wOf(S, b, false)
  return (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2
}

/**
 * A whole number only when it IS one. Otherwise one decimal place, or more
 * when one place would look whole: √170 shows as 13.04, never 13.0, so a
 * student is never shown the target while the board says it is not there.
 */
export function numText(x: number): string {
  if (Math.abs(x - Math.round(x)) < 1e-6) return String(Math.round(x))
  for (let d = 1; d <= 4; d++) {
    const r = Math.round(x * 10 ** d) / 10 ** d
    if (Math.abs(r - Math.round(r)) > 1e-9) return r.toFixed(d)
  }
  return x.toFixed(4)
}

/** The square's four corners in world units (drawn), grown by its spring. */
export function squareCorners(S: Scene, s: Sq, drawn = true): Vec[] {
  const p = wOf(S, s.a, drawn), q = wOf(S, s.b, drawn), r = wOf(S, s.away, drawn)
  const d = sub(q, p), l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (dot(n, sub(r, p)) > 0) n = mul(n, -1)
  const g = drawn ? s.grow.v : 1
  return [p, q, add(q, mul(n, l * g)), add(p, mul(n, l * g))]
}

/** The angle at V between the lines to X and Y, from the true positions, in degrees. */
export function angleAt(S: Scene, V: string, X: string, Y: string): number {
  const v = wOf(S, V, false), x = wOf(S, X, false), y = wOf(S, Y, false)
  const a = Math.atan2(x[1] - v[1], x[0] - v[0]), b = Math.atan2(y[1] - v[1], y[0] - v[0])
  return Math.abs(turn(a, b)) * DEG
}

// ── the proof's triangles ────────────────────────────────────────────────

/**
 * The four copies in a big square of side a + b (bottom-left at the origin).
 * First arrangement: a triangle in each corner, the tilted square c² in the
 * middle. Second: the same triangles as two rectangles, leaving a² and b².
 * Each copy is a turn and a slide; the bottom-right one does not move.
 */
export function proofTriangles(a: number, b: number): { from: Vec[]; to: Vec[] }[] {
  const s = a + b
  // each copy listed as: its right angle, the end of side a, the end of side b
  return [
    { from: [[0, 0], [a, 0], [0, b]], to: [[0, a], [a, a], [0, s]] },
    { from: [[s, 0], [s, a], [a, 0]], to: [[s, 0], [s, a], [a, 0]] },
    { from: [[s, s], [b, s], [s, a]], to: [[a, a], [a, 0], [s, a]] },
    { from: [[0, s], [0, b], [b, s]], to: [[a, s], [0, s], [a, a]] },
  ]
}

/** Where the corners of proof triangle k are, t of the way through its move (0 to 1). */
export function proofAt(a: number, b: number, k: number, t: number): Vec[] {
  const T = proofTriangles(a, b)[k]
  if (t <= 0) return T.from
  if (t >= 1) return T.to
  // a rigid move: turn about the centroid while the centroid slides
  const c0 = centroid(T.from), c1 = centroid(T.to)
  const u0 = sub(T.from[1], T.from[0]), u1 = sub(T.to[1], T.to[0])
  const th = turn(Math.atan2(u0[1], u0[0]), Math.atan2(u1[1], u1[0]))
  const c = lerpV(c0, c1, t), r = th * t
  const cs = Math.cos(r), sn = Math.sin(r)
  return T.from.map(p => { const d = sub(p, c0); return add(c, [d[0] * cs - d[1] * sn, d[0] * sn + d[1] * cs]) })
}

const centroid = (P: Vec[]): Vec => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]

/** How far each proof triangle is through its move. */
export function proofT(S: Scene, k: number): number {
  const m = S.proof?.moved[k]
  if (m === null || m === undefined) return 0
  const t = clamp((S.time - m) / 1.1, 0, 1)
  return t * t * (3 - 2 * t)
}

/** The proof's a and b right now (they breathe in the last proof beat). */
export function proofAB(S: Scene): [number, number] {
  const p = S.proof!
  if (!p.breathe) return [p.a, p.b]
  const t = S.time - S.beatStart
  return [p.a + Math.sin(t * 0.9) * 0.9, p.b + Math.sin(t * 0.7 + 1.3) * 0.9]
}

// ── animation ────────────────────────────────────────────────────────────

/** Fit the frame into the board. */
function fitView(S: Scene, L: Layout): View {
  const f = S.frame
  const bw = L.board.x1 - L.board.x0 - 40, bh = L.board.y1 - L.board.y0 - 40
  const fw = Math.max(1, f.x1 - f.x0), fh = Math.max(1, f.y1 - f.y0)
  const u = Math.min(bw / fw, bh / fh, 70)
  return { cx: (L.board.x0 + L.board.x1) / 2, cy: (L.board.y0 + L.board.y1) / 2, wx: (f.x0 + f.x1) / 2, wy: (f.y0 + f.y1) / 2, u }
}

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  for (const s of S.squares) {
    s.grow.v += (s.grow.t - s.grow.v) * k(0.1)
    if (Math.abs(s.grow.t - s.grow.v) < 0.002) s.grow.v = s.grow.t
  }
  const L = layout(S)
  // the view follows the frame, but holds still under a dragging finger
  if (S.frameFn && !S.drag) S.frame = S.frameFn(S)
  if (!S.drag || !S.view) S.view = fitView(S, L)
  if (!S.viewD) S.viewD = { ...S.view }
  const f = k(0.12)
  const V = S.view, D = S.viewD
  S.viewD = { cx: D.cx + (V.cx - D.cx) * f, cy: D.cy + (V.cy - D.cy) * f, wx: D.wx + (V.wx - D.wx) * f, wy: D.wy + (V.wy - D.wy) * f, u: D.u + (V.u - D.u) * f }
  const fp = k(S.drag ? 0.45 : 0.16)
  for (const n of Object.keys(S.pts)) {
    const t = S.pts[n], d = S.ptsD[n]
    S.ptsD[n] = d ? lerpV(d, t, fp) : [t[0], t[1]]
  }
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
  S.stroke = null
  S.drag = null
  S.moved = 0
  S.movedBy = {}
  S.releases = 0
  S.snapped = false
  S.locked = false
  S.lockWhen = null
  S.releaseNote = null
  S.movable = []
  S.constrain = {}
  S.frameFn = null
  S.letterAway = {}
  S.joinNeed = []
  S.joinHint = ""
  S.tapIds = null
  S.onTapSeg = null
  S.breatheTri = false
  S.areaText = {}
  S.segText = {}
  S.segTextColour = {}
  S.angles = []
  S.fills = []
  S.proof = null
  S.proofTwin = false
  S.sumFly = null
  S.sumVals = null
  S.pulse = new Set()
  S.pulseSegs = new Set()
  S.pulseSquares = new Set()
  S.walkTex = null
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

/** Put points at world positions (they glide there). */
export function place(S: Scene, at: Record<string, Vec>) {
  for (const [n, p] of Object.entries(at)) {
    S.pts[n] = [p[0], p[1]]
    if (!S.ptsD[n]) S.ptsD[n] = [p[0], p[1]]
  }
}

export function setSegs(S: Scene, segs: [string, string][], colours: Record<string, string> = {}) {
  S.segs = segs.map(([a, b]) => ({ id: a + b, a, b, colour: colours[a + b] }))
}

/** A square on a-b, away from `away`; it grows in unless `now`. */
export function squareOn(S: Scene, a: string, b: string, away: string, colour: string, now = false): Sq {
  const id = a + b
  const old = S.squares.find(s => s.id === id)
  const grow = old ? old.grow : { v: now ? 1 : 0, t: 1 }
  grow.t = 1
  if (now) grow.v = 1
  return { id, a, b, away, colour, grow }
}

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 44 : 30)

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

function inTri(p: Vec, T: Vec[]) {
  const s = (a: Vec, b: Vec, c: Vec) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
  const d1 = s(T[0], T[1], p), d2 = s(T[1], T[2], p), d3 = s(T[2], T[0], p)
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))
}

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
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
  if (S.mode === "join") {
    S.stroke = { from: p, to: p }
    S.drewOnce = true
    return true
  }
  if (S.mode === "tapSeg") {
    let best: string | null = null, bd = Infinity
    for (const s of S.segs) {
      if (S.tapIds && !S.tapIds.includes(s.id)) continue
      const d = distToSeg(p, posOf(S, s.a), posOf(S, s.b))
      if (d < bd) { bd = d; best = s.id }
    }
    if (best && bd < (S.touch ? 32 : 22)) S.onTapSeg?.(S, best)
    return false
  }
  if (S.mode === "tapProof" && S.proof) {
    const [a, b] = proofAB(S)
    for (let k = 0; k < 4; k++) {
      if (k === 1 || S.proof.moved[k] !== null) continue
      const T = proofAt(a, b, k, 0).map(q => toScreen(S, add(S.proof!.at, q)))
      if (inTri(p, T)) {
        S.proof.moved[k] = S.time
        S.touched = { kind: "sq", id: `T${k}` }
        S.flashGood = 0.6
        return false
      }
    }
    return false
  }
  return false
}

export function pointerMove(S: Scene, p: Vec) {
  const L = layout(S)
  if (S.stroke) { S.stroke.to = clampToRect(p, L.board); return }
  if (!S.drag) return
  const name = S.drag.name
  const w = toWorld(S, p)
  const c = S.constrain[name]
  const to = c ? c(S, w) : [Math.round(w[0]), Math.round(w[1])] as Vec
  const old = S.pts[name]
  if (to[0] === old[0] && to[1] === old[1]) return
  const step = Math.hypot(to[0] - old[0], to[1] - old[1])
  S.pts[name] = to
  S.moved += step
  S.movedBy[name] = (S.movedBy[name] ?? 0) + step
  S.snapped = !!S.lockWhen?.(S)
}

export function pointerUp(S: Scene) {
  if (S.stroke) { endStroke(S); return }
  if (!S.drag) return
  S.drag = null
  S.releases++
  if (S.snapped) { S.locked = true; S.flashGood = 1; S.note = null; return }
  const n = S.releaseNote?.(S)
  if (n) say(S, n, "calm", 3.2)
}

function endStroke(S: Scene) {
  const st = S.stroke!
  S.stroke = null
  const fade = () => S.fading.push({ a: st.from, b: st.to, life: 1 })
  if (dist(st.from, st.to) < 24) return
  if (S.mode === "join") {
    const refs = S.showPts
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
  }
}

/** Every join the beat asks for is drawn. */
export const joined = (S: Scene) => S.joinNeed.every(([a, b]) => S.segs.some(s => s.id === a + b))

// ── typed answers ────────────────────────────────────────────────────────

// shared with the other lessons (answers.ts)
export { typeKey } from "../answers"

export { dist, lerpV, clamp, turn, DEG }
