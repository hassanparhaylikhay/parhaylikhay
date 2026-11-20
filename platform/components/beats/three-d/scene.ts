/**
 * The 3D board (6.4, Pythagoras and trigonometry in 3D): solids the student
 * turns any way, from any side, at any time (Hassan, 16 Nov 2026: "he should
 * be able to manipulate the shape as he wishes. we don't ever limit the
 * student").
 *
 * World: x right, y back (away from the eye), z up; the floor is z = 0.
 * `P3` is where points are, `D3` what is drawn, eased toward it. The view
 * turns round the up axis (yaw) and tips (pitch: how far above the floor
 * the eye is, below it too), with a mild perspective, and is fitted into the
 * room the board has by the solid's bounding sphere, so it never grows or
 * shrinks as it turns.
 *
 * Colours follow direction, the same in every beat: heights orange, lines on
 * the floor blue, sloping lines pink; the solid chalk; yellow only for what
 * the student can drag or tap; green for a right answer.
 *
 * The one move of the lesson: a right-angled triangle that stands up inside
 * the solid is LIFTED OUT and laid flat beside it, at its true shape (a
 * `Flat`). The working happens on the flat copy; then it goes back in.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp, turn, DEG, RAD } from "../geometry"
import { createBoard, eqSet, eqStep, eqHit, eqCentre, eqSlow, extent, measure, row, frac, type EqBoard, type ENode } from "../equation"
import { calcType, calcTex, judge, isCalculation, slipMatches, setAns, calcValue, roundedAns, ansReminder, INV_KEY } from "../calc"
import type { Curved, Net } from "./solids"
import type { Sheet } from "./sheet"

export const CHALK = "#e8e6e0"
export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const QUIET = "#7a7875"
export { DEG, RAD }

// ── 3D vectors ───────────────────────────────────────────────────────────

export type V3 = [number, number, number]
export const v3 = (x: number, y: number, z: number): V3 => [x, y, z]
export const vadd = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const vsub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const vmul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k]
export const vdot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const vcross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const vlen = (a: V3) => Math.hypot(a[0], a[1], a[2])
export const vunit = (a: V3): V3 => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
export const vlerp = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
export const vdist = (a: V3, b: V3) => vlen(vsub(a, b))

/** The key for a line between two points, the same either way round. */
export const segKey = (a: string, b: string) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// ── what a board can hold ────────────────────────────────────────────────

type Spring = { v: number; t: number }

export type VisKey = "board" | "floor" | "solid" | "letters" | "lens" | "marks" | "flats" | "eq" | "keypad" | "chips" | "hint" | "line"
const VIS_KEYS: VisKey[] = ["board", "floor", "solid", "letters", "lens", "marks", "flats", "eq", "keypad", "chips", "hint", "line"]

/** A line between two points that is not an edge of the solid (a diagonal, a height). */
export interface Seg {
  a: string
  b: string
  col?: string
  /** how much of it is drawn, from a toward b (it grows when made) */
  grow: Spring
  glow?: boolean
  /** a faint guide rather than a line of the figure */
  faint?: boolean
}

/** A triangle lit up inside the figure. */
export interface Tri {
  id: string
  pts: [string, string, string]
  col: string
  /** an upright sheet through the solid, more strongly lit */
  sheet?: boolean
  pulse?: boolean
}

/** An angle arc at a point, between the lines to two others. */
export interface Arc3 { at: string; a: string; b: string; tex?: string; col?: string; pulse?: boolean }

/** A right-angle mark at a point, between the lines to two others. */
export interface Right { at: string; a: string; b: string; col?: string; pulse?: boolean }

/** A handle the student drags: it moves along one direction in the world. */
export interface Handle {
  id: string
  at: (S: Scene) => V3
  axis: V3
  /** the finger has moved `amount` world units along the axis since it took hold */
  move: (S: Scene, amount: number) => void
  start?: (S: Scene) => void
  /** a handle that goes anywhere (not along one axis): put it where the finger is */
  place?: (S: Scene, finger: Vec) => void
  /** the way its arrows point, when that changes as it moves (a knob going round a circle) */
  axisAt?: (S: Scene) => V3
}

/** A stick standing on the floor at `base`: `r` long, turned `phi` round, tipped `th` up from the floor (radians). */
export interface Stick { base: V3; r: number; phi: number; th: number; moved: number }

/**
 * A triangle lifted out of the figure and laid flat beside it, at its true
 * shape: the right angle stays square, the upright leg stays upright.
 */
export interface Flat {
  id: string
  pts: [string, string, string]
  /** the corner with the right angle */
  right: string
  /** 0: in the figure, 1: laid flat beside it */
  t: Spring
  /** what each side says, by segKey (missing: nothing) */
  lens: Record<string, { tex: string; col?: string; pulse?: boolean }>
  /** the corner whose angle is marked, and what it says */
  angle?: { at: string; tex?: string; col?: string }
  /** where each corner is drawn this frame (screen) */
  pos: Record<string, Vec>
  /** where each corner would be, laid flat (screen) */
  target: Record<string, Vec>
  /** which way the flat faces: +1 the right angle on the right */
  hand: number
  /** true lengths from the right angle to the other two corners, for a figure drawn not to scale */
  legs?: Record<string, number>
  /** on its way out of the figure or back into it: where it set off from (screen), and how far it has got (0 to 1) */
  fly?: { from: Record<string, Vec>; e: number; home: boolean } | null
  /** put it straight at its place the first time it is placed (a board opened cold) */
  snap?: boolean
}

/**
 * A timed piece of choreography (the view turns to face a triangle, the
 * triangle comes out, the view turns back): acts play one after another. A
 * locked act holds the view still under the student's finger; an unlocked one
 * gives way the moment the student takes hold.
 */
export interface Act {
  dur: number
  lock?: boolean
  begin?: (S: Scene) => void
  /** e: eased progress, t: plain progress, both 0 to 1 */
  run?: (S: Scene, e: number, t: number) => void
  end?: (S: Scene) => void
}

/** A label: where it belongs (`at`) and the point on the figure it is attached to (`anchor`), which it follows exactly. */
export interface Lab { key: string; tex: string; col: string; at: Vec; anchor: Vec; size: number; op: number; pulse?: boolean }

export interface CalcInput {
  value: string
  answer: number
  sf?: number
  dp?: number
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  slips?: { v: number; say: string }[]
  shift?: boolean
  fresh?: boolean
  calcOnly?: string
  max?: number
  /** the keys that answer it, for test scripts */
  typed?: string
  /** what Ans holds (EG), when the answer is meant to use it */
  ansName?: string
  onRight?: (S: Scene) => void
  help?: (S: Scene, tries: number) => void
}

export type Mode = "none" | "tapPoint" | "join" | "tapSeg" | "tapArc" | "tapRegion" | "tapFlatSide" | "tapFloor" | "solve"

export type Drag =
  | { kind: "orbit"; start: Vec; last: Vec; moved: number }
  | { kind: "handle"; id: string; start: Vec; moved: number; at0: V3; off: Vec }
  | { kind: "join"; from: string; start: Vec; p: Vec; moved: number }
  | { kind: "atom"; id: string; p: Vec }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  P3: Record<string, V3>
  D3: Record<string, V3>
  /** the letter shown at each point */
  names: Partial<Record<string, string>>
  /** a letter that sits a set way from its point (screen direction), where the usual place is taken */
  letterDir: Partial<Record<string, Vec>>
  /** the solid's faces, by point names (a convex solid; null: no solid) */
  faces: string[][] | null
  /** faces lit in a colour, by their place in `faces` (counted by tapping) */
  faceLit: Record<number, string>
  /** a solid with a curved surface, drawn smooth (null: none) */
  curved: Curved | null
  /** a net, and how far it is folded: `t` where it is going, `tD` as drawn (0 flat, 1 closed); faces in a colour of their own */
  net: { def: Net; t: number; tD: number; cols?: Record<string, string> } | null
  /** a net being made on the floor's grid: faces `k` cm square, and the squares where one can be added (they breathe) */
  netEdit: { k: number; cand: [number, number][] } | null
  /** a tap on the floor (world x, y), in tapFloor mode */
  onFloor: ((S: Scene, w: [number, number]) => void) | null
  /** a sheet through the solid, for its planes of symmetry (null: none) */
  sheet: Sheet | null
  /** edges of the solid in a colour, or lit, by segKey */
  edgeCol: Record<string, string>
  segs: Record<string, Seg>
  /** what a line or edge says, by segKey (`along`: how far from its first point, when the middle is taken) */
  lens: Record<string, { tex: string; col?: string; pulse?: boolean; along?: number; keep?: boolean }>
  tris: Tri[]
  rights: Right[]
  arcs: Arc3[]
  /** points shown as a dot (the middle of a base) */
  dots: string[]
  /** small marks across a line, splitting it into equal parts (fractions of the way from a to b) */
  ticks: { a: string; b: string; at: number[]; pulse?: boolean }[]
  /** numbers a beat keeps on the board (how far a fold has turned, where a point sits on a line) */
  vals: Record<string, number>
  /** numbers carried from beat to beat (not cleared between beats: the net the student made) */
  keep: Record<string, number>
  /** points the phrase is about: they glow */
  glowPts: string[]
  /** a stick on the floor (its top is the point T, its shadow's end Tf) */
  stick: Stick | null
  /** points with a light straight above them: a dashed drop from each down to the floor */
  light: string[]
  /** the box being built: its sizes, and the points it makes */
  box: { l: number; w: number; h: number } | null
  /** a pyramid on a rectangle: its base and height */
  pyr: { l: number; w: number; h: number } | null
  handles: Handle[]
  /** the floor's grid spacing (0: no grid) */
  floorGrid: number

  /** the view: turned round the up axis, tipped toward the eye (degrees), and as drawn */
  yaw: number
  pitch: number
  yawD: number
  pitchD: number
  /** a slow turn by itself, degrees a second, until the student takes hold */
  spin: number
  /** the turn carrying on after the finger lets go */
  fling: { yaw: number; pitch: number }
  lastTouch: number
  /** how much the student has turned it this beat (degrees) */
  turned: number
  /** the points the view keeps in room (null: every point) */
  fitPts: string[] | null
  fit: { cx: number; cy: number; u: number; c: V3; R: number } | null
  fitD: { cx: number; cy: number; u: number; c: V3; R: number } | null

  flats: Flat[]
  /** where each flat was last drawn, so the next beat's copy starts there (no slide between beats) */
  flatMem: Record<string, Record<string, Vec>>
  acts: Act[]
  act: { a: Act; t0: number } | null
  /** how far the board has made room for the flat triangles beside the solid (0 to 1) */
  split: Spring
  /** the solid fades back while a triangle is lifted out of it */
  dim: Spring
  /** how far it fades: back a little for a lift, right out when the rest of the solid goes */
  dimMax: number
  /** the triangle being lifted: lit in the solid while it turns to face the student */
  liftLit: string[] | null
  /** which of two triangles the student picked in a beat (by beat id), so later beats carry on with theirs */
  picked: Record<string, string>
  /** which way each lifted triangle faces, kept from when it was first lifted (so it never flips between beats) */
  hands: Record<string, number>
  /** parts of the figure the student can tap (a triangle, a face), by point names */
  regions: { id: string; pts: string[] }[] | null
  onRegion: ((S: Scene, id: string) => void) | null
  regionLit: string | null
  tapPoints: string[] | null
  onPoint: ((S: Scene, n: string) => void) | null
  joinFrom: string | null
  onJoin: ((S: Scene, a: string, b: string) => void) | null
  tapSegs: string[] | null
  onSeg: ((S: Scene, key: string) => void) | null
  tapArcs: Arc3[] | null
  onArc: ((S: Scene, i: number) => void) | null
  tapFlat: string | null
  onFlatSide: ((S: Scene, key: string) => void) | null

  eq: EqBoard
  eqFn: ((S: Scene) => ENode | null) | null
  solve: unknown
  dragAtoms: string[]
  onAtomDrop: ((S: Scene, id: string, onto: string | null, at: Vec) => void) | null
  dragTex: Record<string, string>
  eqRoom: Spring
  keyRows: number

  choice: { options: string[]; answer: number; picked: number | null; state: "idle" | "wrong" | "right"; wrongAt: number; guess: boolean; onPick?: (S: Scene, k: number, right: boolean) => void } | null
  /** small cards at the bottom of the board (the build targets) */
  chipsOn: { tex: string; lit: boolean }[] | null

  tick: ((S: Scene) => void) | null
  timers: { at: number; fn: (S: Scene) => void }[]
  vis: Record<VisKey, Spring>
  labs: Lab[]
  labD: Record<string, Vec>
  /** each label's offset from its anchor, eased (so a label sticks to its line, and only its side moves smoothly) */
  labOff: Record<string, Vec>
  /** which side of its line a length sits, and which way from its point a letter sits (screen), kept while the evidence is weak */
  labSide: Record<string, Vec>
  /** labels that move slowly to their place (a number flying across) */
  labSlow: Record<string, number>
  walkTex: string | null
  input: CalcInput | null
  drag: Drag | null
  touch: boolean
  got: Set<string>
  /** what the student just made, to light it green */
  touched: string | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    P3: {}, D3: {}, names: {}, letterDir: {}, faces: null, faceLit: {}, curved: null, net: null, netEdit: null, onFloor: null, sheet: null, edgeCol: {}, segs: {}, lens: {}, tris: [], rights: [], arcs: [], dots: [], ticks: [], vals: {}, keep: {}, glowPts: [],
    stick: null, light: [], box: null, pyr: null, handles: [], floorGrid: 1,
    yaw: -32, pitch: 22, yawD: -32, pitchD: 22, spin: 0, fling: { yaw: 0, pitch: 0 }, lastTouch: -9, turned: 0, fitPts: null, fit: null, fitD: null,
    flats: [], flatMem: {}, acts: [], act: null, split: { v: 0, t: 0 }, dim: { v: 0, t: 0 }, dimMax: 0.62, liftLit: null, picked: {}, hands: {}, regions: null, onRegion: null, regionLit: null, tapPoints: null, onPoint: null, joinFrom: null, onJoin: null,
    tapSegs: null, onSeg: null, tapArcs: null, onArc: null, tapFlat: null, onFlatSide: null,
    eq: createBoard(), eqFn: null, solve: null, dragAtoms: [], onAtomDrop: null, dragTex: {}, eqRoom: { v: 0, t: 0 }, keyRows: 4,
    choice: null, chipsOn: null, tick: null, timers: [], vis, labs: [], labD: {}, labOff: {}, labSide: {}, labSlow: {}, walkTex: null, input: null, drag: null, touch: false,
    got: new Set(), touched: null, flashGood: 0, note: null,
  }
}

// ── solids ───────────────────────────────────────────────────────────────

/** The box's corners (E at the front left of the floor, as in the exam papers): its middle is over the origin. */
export function boxPts(l: number, w: number, h: number): Record<string, V3> {
  const x0 = -l / 2, x1 = l / 2, y0 = -w / 2, y1 = w / 2
  return {
    E: [x0, y0, 0], H: [x1, y0, 0], G: [x1, y1, 0], F: [x0, y1, 0],
    A: [x0, y0, h], D: [x1, y0, h], C: [x1, y1, h], B: [x0, y1, h],
  }
}
export const BOX_FACES = [["E", "H", "G", "F"], ["A", "D", "C", "B"], ["E", "H", "D", "A"], ["H", "G", "C", "D"], ["G", "F", "B", "C"], ["F", "E", "A", "B"]]

/** A pyramid on a rectangle (A front left, B front right, C back right, D back left), its top E above X, the middle. */
export function pyramidPts(l: number, w: number, h: number): Record<string, V3> {
  return {
    A: [-l / 2, -w / 2, 0], B: [l / 2, -w / 2, 0], C: [l / 2, w / 2, 0], D: [-l / 2, w / 2, 0],
    E: [0, 0, h], X: [0, 0, 0],
  }
}
export const PYRAMID_FACES = [["A", "B", "C", "D"], ["E", "A", "B"], ["E", "B", "C"], ["E", "C", "D"], ["E", "D", "A"]]

/** Where a stick's top is. */
export function stickTop(k: Stick): V3 {
  return [k.base[0] + k.r * Math.cos(k.th) * Math.cos(k.phi), k.base[1] + k.r * Math.cos(k.th) * Math.sin(k.phi), k.base[2] + k.r * Math.sin(k.th)]
}

/**
 * Tip and turn a stick so its top lands under the finger (the top moves on a
 * dome over its foot). A few damped steps from where it is; it clicks flat
 * on the floor and straight up within 3°.
 */
export function placeStick(S: Scene, k: Stick, finger: Vec) {
  const at = (phi: number, th: number) => proj(S, stickTop({ ...k, phi, th }))
  let { phi, th } = k
  const before = [phi, th]
  for (let i = 0; i < 8; i++) {
    const e = 0.004
    const p0 = at(phi, th), pA = at(phi + e, th), pB = at(phi, th + e)
    const J = [[(pA[0] - p0[0]) / e, (pB[0] - p0[0]) / e], [(pA[1] - p0[1]) / e, (pB[1] - p0[1]) / e]]
    const r = [finger[0] - p0[0], finger[1] - p0[1]]
    // damped least squares: (JᵀJ + λI) δ = Jᵀ r
    const a = J[0][0] ** 2 + J[1][0] ** 2 + 40, b = J[0][0] * J[0][1] + J[1][0] * J[1][1], d = J[0][1] ** 2 + J[1][1] ** 2 + 40
    const g0 = J[0][0] * r[0] + J[1][0] * r[1], g1 = J[0][1] * r[0] + J[1][1] * r[1]
    const det = a * d - b * b
    if (Math.abs(det) < 1e-9) break
    phi += clamp((d * g0 - b * g1) / det, -0.5, 0.5)
    th = clamp(th + clamp((a * g1 - b * g0) / det, -0.5, 0.5), 0, Math.PI / 2)
  }
  if (th < 3 * RAD) th = 0
  if (th > 87 * RAD) th = Math.PI / 2
  k.moved += Math.abs(turn(before[0], phi)) * DEG * Math.cos(th) + Math.abs(th - before[1]) * DEG
  k.phi = phi
  k.th = th
}

/** The point on the floor under a screen point (the view's perspective undone, a few Newton steps). */
export function floorAt(S: Scene, p: Vec): [number, number] | null {
  const f = S.fitD ?? S.fit
  if (!f) return null
  let x = f.c[0], y = f.c[1]
  for (let i = 0; i < 8; i++) {
    const e = 1e-3, q = proj(S, [x, y, 0]), qx = proj(S, [x + e, y, 0]), qy = proj(S, [x, y + e, 0])
    const a = (qx[0] - q[0]) / e, b = (qy[0] - q[0]) / e, c = (qx[1] - q[1]) / e, d = (qy[1] - q[1]) / e
    const det = a * d - b * c
    if (Math.abs(det) < 1e-9) return null
    const rx = p[0] - q[0], ry = p[1] - q[1]
    x += (d * rx - b * ry) / det
    y += (a * ry - c * rx) / det
  }
  return [x, y]
}

/** A point, true or as drawn. */
export const p3 = (S: Scene, n: string, drawn = true): V3 => (drawn ? S.D3[n] ?? S.P3[n] : S.P3[n]) ?? [0, 0, 0]

/** Length in the world between two named points (true). */
export const len3 = (S: Scene, a: string, b: string, drawn = false) => vdist(p3(S, a, drawn), p3(S, b, drawn))

/** The colour of a line by its direction: upright orange, flat on the floor blue, sloping pink. */
export function dirCol(S: Scene, a: string, b: string): string {
  const A = p3(S, a, false), B = p3(S, b, false)
  const d = vsub(B, A), l = vlen(d) || 1
  if (Math.abs(d[2]) / l > 0.999) return ORANGE
  if (Math.abs(d[2]) / l < 0.001 && Math.abs(A[2]) < 1e-6) return BLUE
  return PINK
}

// ── the view ─────────────────────────────────────────────────────────────

/** A world point in the eye's frame: x right, y up, z toward the eye (world units, about the fitted middle). */
export function toCam(S: Scene, p: V3, drawn = true): V3 {
  const f = (drawn ? S.fitD : S.fit) ?? S.fit
  const c = f?.c ?? [0, 0, 0]
  const yaw = (drawn ? S.yawD : S.yaw) * RAD, pitch = (drawn ? S.pitchD : S.pitch) * RAD
  const q = vsub(p, c)
  const x1 = q[0] * Math.cos(yaw) - q[1] * Math.sin(yaw)
  const y1 = q[0] * Math.sin(yaw) + q[1] * Math.cos(yaw)
  const z1 = q[2]
  return [x1, y1 * Math.sin(pitch) + z1 * Math.cos(pitch), -y1 * Math.cos(pitch) + z1 * Math.sin(pitch)]
}

/** How far the eye is from the middle, in units of the solid's size: a mild perspective. */
const EYE = 6

/** Whether a surface at a world point, with an outward normal there, looks toward the eye. */
export function facesEye(S: Scene, p: V3, n: V3): boolean {
  const f = S.fitD ?? S.fit
  const a = toCam(S, p), b = toCam(S, vadd(p, n))
  const eye: V3 = [0, 0, EYE * (f?.R ?? 1)]
  return vdot(vsub(b, a), vsub(eye, a)) > 0
}

/** A world point on the screen. */
export function proj(S: Scene, p: V3, drawn = true): Vec {
  const f = (drawn ? S.fitD : S.fit) ?? S.fit
  if (!f) return [0, 0]
  const q = toCam(S, p, drawn)
  const F = EYE * f.R
  const s = F / Math.max(F * 0.2, F - q[2])
  return [f.cx + q[0] * f.u * s, f.cy - q[1] * f.u * s]
}
export const ptS = (S: Scene, n: string, drawn = true) => proj(S, p3(S, n, drawn), drawn)

/** Whether a face looks toward the eye. */
export function faceFront(S: Scene, face: string[]): boolean {
  const P = face.map(n => toCam(S, p3(S, n)))
  const n = faceNormal(S, face)
  const f = S.fitD ?? S.fit
  const eye: V3 = [0, 0, EYE * (f?.R ?? 1)]
  const mid = vmul(P.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / P.length)
  return vdot(n, vsub(eye, mid)) > 0
}

/** A face's normal pointing out of the solid, in the eye's frame. */
function faceNormal(S: Scene, face: string[]): V3 {
  const P = face.map(n => toCam(S, p3(S, n)))
  // Newell's method, then turned away from the middle of the solid
  let n: V3 = [0, 0, 0]
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length]
    n = vadd(n, [(a[1] - b[1]) * (a[2] + b[2]), (a[2] - b[2]) * (a[0] + b[0]), (a[0] - b[0]) * (a[1] + b[1])])
  }
  const mid = solidMiddle(S)
  const fm = vmul(P.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / P.length)
  if (vdot(n, vsub(fm, mid)) < 0) n = vmul(n, -1)
  return vunit(n)
}

/** The middle of the solid, in the eye's frame. */
function solidMiddle(S: Scene): V3 {
  const names = [...new Set((S.faces ?? []).flat())]
  if (!names.length) return [0, 0, 0]
  const P = names.map(n => toCam(S, p3(S, n)))
  return vmul(P.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / P.length)
}

/** Whether a world point is inside the solid (not on its surface). */
function insideSolid(S: Scene, p: V3): boolean {
  if (!S.faces) return false
  const q = toCam(S, p)
  for (const face of S.faces) {
    const n = faceNormal(S, face)
    const a = toCam(S, p3(S, face[0]))
    if (vdot(n, vsub(q, a)) > -1e-6 * (S.fitD?.R ?? 1)) return false
  }
  return true
}

/** The solid's faces that hold both points. */
function facesWith(S: Scene, a: string, b: string): string[][] {
  if (!S.faces) return []
  const A = p3(S, a), B = p3(S, b)
  return S.faces.filter(face => {
    const n = faceNormal(S, face)
    const o = toCam(S, p3(S, face[0]))
    const R = S.fitD?.R ?? 1
    return Math.abs(vdot(n, vsub(toCam(S, A), o))) < 1e-4 * R && Math.abs(vdot(n, vsub(toCam(S, B), o))) < 1e-4 * R
  })
}

/**
 * Whether a line between two points is hidden from the eye: an edge or a
 * line on a face is hidden when every face it lies on looks away; a line
 * through the inside is hidden behind the faces in front of it.
 */
export function segHidden(S: Scene, a: string, b: string): boolean {
  if (!S.faces) return false
  const on = facesWith(S, a, b)
  if (on.length) return on.every(f => !faceFront(S, f))
  return insideSolid(S, vlerp(p3(S, a), p3(S, b), 0.5))
}

/** The solid's edges, by segKey, with their two ends. */
export function edgesOf(S: Scene): [string, string][] {
  const out = new Map<string, [string, string]>()
  for (const f of S.faces ?? []) for (let i = 0; i < f.length; i++) {
    const a = f[i], b = f[(i + 1) % f.length]
    out.set(segKey(a, b), [a, b])
  }
  return [...out.values()]
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  /** where the solid is drawn, and where the flat triangles go */
  solidCell: Rect
  flatCell: Rect | null
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
  const padH = S.keyRows * 46 + (S.keyRows - 1) * 8
  const beside = on(S, "keypad") && w >= 960
  const side = compact ? 16 : 28
  let midX = w / 2, eqW = w, keypadCx: number | undefined
  if (beside) {
    const padW = 7 * 46 + 6 * 8
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
  if (on(S, "eq")) { const band = Math.max(eqSize * 3.6, S.eqRoom.v); eqY = y - band / 2; y -= band }
  const least = on(S, "keypad") ? 110 : 160
  const board: Rect = { x0: side, x1: beside ? side + eqW : w - side, y0: phraseBottom + 10, y1: Math.max(phraseBottom + least, y - 6) }
  // flat triangles beside the solid (a wide board) or under it (a tall one)
  // the solid makes room for the flats (as far as `split` says: it slides over as a triangle comes out)
  let solidCell = board, flatCell: Rect | null = null
  const sp = S.split.v
  if ((S.flats.length && on(S, "flats")) || sp > 0.001) {
    const bw = board.x1 - board.x0, bh = board.y1 - board.y0
    if (bw > bh * 1.1) {
      const cut = board.x0 + bw * 0.42
      solidCell = { ...board, x1: board.x1 + (cut - board.x1) * sp }
      flatCell = { ...board, x0: cut }
    } else {
      const cut = board.y0 + bh * 0.4
      solidCell = { ...board, y1: board.y1 + (cut - board.y1) * sp }
      flatCell = { ...board, y0: cut }
    }
  }
  return { compact, phraseBottom, board, solidCell, flatCell, eqY, eqSize, chipsY, keypadTop, lineY, lineSize, labelSize: compact ? 16 : 20, midX, eqW, keypadCx }
}

export const screenScale = (S: Scene) => clamp(Math.min(S.w, S.h) / 800, 0.45, 1)
export function resize(S: Scene, w: number, h: number) { S.w = w; S.h = h }

/** The view's fit: the middle of the points it keeps in room, and the sphere round them, filling the solid's cell. */
function fitFor(S: Scene, L: Layout) {
  const names = (S.fitPts ?? Object.keys(S.P3)).filter(n => S.P3[n])
  const P = names.map(n => S.P3[n])
  if (!P.length) return { cx: (L.solidCell.x0 + L.solidCell.x1) / 2, cy: (L.solidCell.y0 + L.solidCell.y1) / 2, u: 30, c: [0, 0, 0] as V3, R: 1 }
  const lo: V3 = [Math.min(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.min(...P.map(p => p[2]))]
  const hi: V3 = [Math.max(...P.map(p => p[0])), Math.max(...P.map(p => p[1])), Math.max(...P.map(p => p[2]))]
  const c = vlerp(lo, hi, 0.5)
  const R = Math.max(0.5, ...P.map(p => vdist(p, c)))
  const cell = L.solidCell
  const pad = L.compact ? 22 : 36
  const room = Math.min(cell.x1 - cell.x0, cell.y1 - cell.y0) - 2 * pad
  // the nearest corner can be drawn a little bigger than the sphere (perspective)
  // no zoom floor: a figure in metres (a hall 160 m across) needs about 1 px a unit
  const u = Math.max(0.02, room / (2 * R * (EYE / (EYE - 1))))
  return { cx: (cell.x0 + cell.x1) / 2, cy: (cell.y0 + cell.y1) / 2, u, c, R }
}

// ── flat triangles ───────────────────────────────────────────────────────

/** A flat's two legs: the one that lies along the bottom, and the one that stands up. */
function flatLegs(S: Scene, F: { pts: string[]; right: string; legs?: Record<string, number> }) {
  const [a, b] = F.pts.filter(n => n !== F.right)
  const R = p3(S, F.right, false), A = p3(S, a, false), B = p3(S, b, false)
  const la = F.legs?.[a] ?? vdist(R, A), lb = F.legs?.[b] ?? vdist(R, B)
  // the leg that stands upright in the figure stays upright; else the longer one lies along the bottom
  const upA = Math.abs(vsub(A, R)[2]) > 1e-6 && Math.abs(vunit(vsub(A, R))[2]) > 0.99
  const upB = Math.abs(vsub(B, R)[2]) > 1e-6 && Math.abs(vunit(vsub(B, R))[2]) > 0.99
  let flatLeg = a, upLeg = b
  if (upA) { flatLeg = b; upLeg = a } else if (!upB && lb > la) { flatLeg = b; upLeg = a }
  return { flatLeg, upLeg, lf: F.legs?.[flatLeg] ?? vdist(R, p3(S, flatLeg, false)), lu: F.legs?.[upLeg] ?? vdist(R, p3(S, upLeg, false)) }
}

/** The true shape of a flat triangle in its own plane: the right angle at the origin, legs along x and up y. */
function flatShape(S: Scene, F: Flat): Record<string, Vec> {
  const { flatLeg, upLeg, lf, lu } = flatLegs(S, F)
  return { [F.right]: [0, 0], [flatLeg]: [-lf * F.hand, 0], [upLeg]: [0, lu] }
}

/** Where each flat sits in its cell: all flats share one scale, so a side they share is the same length in both. */
function placeFlats(S: Scene, L: Layout) {
  const cell = L.flatCell
  if (!cell || !S.flats.length) return
  const n = S.flats.length
  const cw = cell.x1 - cell.x0, ch = cell.y1 - cell.y0
  const shapes = S.flats.map(F => flatShape(S, F))
  const pad = L.labelSize * 1.9
  // side by side or one above the other, whichever draws them bigger
  const cellsFor = (across: boolean): Rect[] => S.flats.map((_, i) => across
    ? { x0: cell.x0 + (cw / n) * i, x1: cell.x0 + (cw / n) * (i + 1), y0: cell.y0, y1: cell.y1 }
    : { x0: cell.x0, x1: cell.x1, y0: cell.y0 + (ch / n) * i, y1: cell.y0 + (ch / n) * (i + 1) })
  const scaleFor = (cs: Rect[]) => {
    let u = Infinity
    shapes.forEach((sh, i) => {
      const xs = Object.values(sh).map(p => p[0]), ys = Object.values(sh).map(p => p[1])
      const fw = Math.max(0.1, Math.max(...xs) - Math.min(...xs)), fh = Math.max(0.1, Math.max(...ys) - Math.min(...ys))
      u = Math.min(u, (cs[i].x1 - cs[i].x0 - 2 * pad) / fw, (cs[i].y1 - cs[i].y0 - 2 * pad) / fh)
    })
    return u
  }
  const A = cellsFor(true), B = cellsFor(false)
  const cells = n > 1 && scaleFor(B) > scaleFor(A) ? B : A
  const u = Math.max(0.02, scaleFor(cells))
  shapes.forEach((sh, i) => {
    const F = S.flats[i]
    const xs = Object.values(sh).map(p => p[0]), ys = Object.values(sh).map(p => p[1])
    const mx = (Math.max(...xs) + Math.min(...xs)) / 2, my = (Math.max(...ys) + Math.min(...ys)) / 2
    const cx = (cells[i].x0 + cells[i].x1) / 2, cy = (cells[i].y0 + cells[i].y1) / 2
    for (const [k, p] of Object.entries(sh)) F.target[k] = [cx + (p[0] - mx) * u, cy - (p[1] - my) * u]
  })
}

/**
 * A triangle carried from one place to another without changing its shape:
 * it turns, grows and slides as one piece (the best fit of the start onto the
 * end), rising a little toward the eye on the way, then settles exactly.
 */
export function rigidAt(P0: Vec[], P1: Vec[], e: number): Vec[] {
  const mid = (P: Vec[]): Vec => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]
  const c0 = mid(P0), c1 = mid(P1)
  const a = P0.map(p => sub(p, c0)), b = P1.map(p => sub(p, c1))
  let sd = 0, sc = 0, na = 0, nb = 0
  a.forEach((v, i) => { sd += dot(v, b[i]); sc += v[0] * b[i][1] - v[1] * b[i][0]; na += dot(v, v); nb += dot(b[i], b[i]) })
  const th = Math.atan2(sc, sd), k1 = Math.sqrt(nb / Math.max(1e-9, na))
  const rot = (v: Vec, ang: number, k: number): Vec => [k * (v[0] * Math.cos(ang) - v[1] * Math.sin(ang)), k * (v[0] * Math.sin(ang) + v[1] * Math.cos(ang))]
  // what the best fit leaves over (nothing when the start is the true shape, seen straight on)
  const rest = P1.map((p, i) => sub(p, add(c1, rot(a[i], th, k1))))
  const k = Math.exp(Math.log(k1) * e) * (1 + 0.07 * Math.sin(Math.PI * e))
  const c = add(lerpV(c0, c1, e), [0, -Math.sin(Math.PI * e) * 22])
  return a.map((v, i) => add(add(c, rot(v, th * e, k)), mul(rest[i], e)))
}

/** Where a flat's corners are drawn: in flight (out of the figure or back in), or at its place, gliding when the places change. */
function flatPos(S: Scene, F: Flat, k: (f: number) => number) {
  if (F.fly) {
    const P0 = F.pts.map(n => F.fly!.from[n])
    const P1 = F.pts.map(n => (F.fly!.home ? ptS(S, n) : F.target[n] ?? F.fly!.from[n]))
    const P = rigidAt(P0, P1, F.fly.e)
    F.pts.forEach((n, i) => { F.pos[n] = P[i] })
    return
  }
  if (F.t.v >= 0.999) {
    for (const n of F.pts) {
      const to = F.target[n]
      if (!to) continue
      F.pos[n] = F.snap || !F.pos[n] ? [to[0], to[1]] : lerpV(F.pos[n], to, k(0.12))
    }
    F.snap = false
    return
  }
  // a flat with no flight of its own (not used by the lessons now): straight from the figure
  const t = F.t.v, e = t * t * (3 - 2 * t)
  for (const n of F.pts) F.pos[n] = lerpV(ptS(S, n), F.target[n] ?? ptS(S, n), e)
}

/** Where the eye is, from the middle of the figure (a unit vector in the world), for a view. */
function eyeDir(yaw: number, pitch: number): V3 {
  const y = yaw * RAD, p = pitch * RAD
  return [-Math.cos(p) * Math.sin(y), -Math.cos(p) * Math.cos(y), Math.sin(p)]
}

/**
 * The view that looks straight at a triangle, from the side the eye is on
 * now: seen like this it shows its true shape. An upright triangle is seen
 * from level with the floor; one on the floor from straight above, turned so
 * its flat leg runs across and the other points up the screen.
 */
export function facingView(S: Scene, F: { pts: string[]; right: string; legs?: Record<string, number> }): { yaw: number; pitch: number } {
  const [A, B, C] = F.pts.map(n => p3(S, n, false))
  let n = vunit(vcross(vsub(B, A), vsub(C, A)))
  if (vdot(n, eyeDir(S.yawD, S.pitchD)) < 0) n = vmul(n, -1)
  const pitch = clamp(Math.asin(clamp(n[2], -1, 1)) * DEG, -89, 89)
  let yaw: number
  if (Math.abs(n[2]) > 0.995) {
    const { upLeg } = flatLegs(S, F)
    const u = vsub(p3(S, upLeg, false), p3(S, F.right, false))
    yaw = (n[2] > 0 ? Math.atan2(u[0], u[1]) : Math.atan2(-u[0], -u[1])) * DEG
  } else yaw = Math.atan2(-n[0], -n[1]) * DEG
  // the nearest equivalent, so it turns the short way round
  return { yaw: S.yaw + ((((yaw - S.yaw) % 360) + 540) % 360) - 180, pitch }
}

/**
 * Which way a flat faces: the way the triangle looks seen straight on (from
 * the side the eye is on), so it comes out as it is and never flips over.
 */
export function flatHand(S: Scene, F: { pts: string[]; right: string; legs?: Record<string, number> }): number {
  const v = facingView(S, F)
  const y = v.yaw * RAD, p = v.pitch * RAD
  // the eye's frame for that view (no perspective: only the turn matters)
  const cam = (q: V3): Vec => { const x1 = q[0] * Math.cos(y) - q[1] * Math.sin(y), y1 = q[0] * Math.sin(y) + q[1] * Math.cos(y); return [x1, -(y1 * Math.sin(p) + q[2] * Math.cos(p))] }
  const { flatLeg, upLeg } = flatLegs(S, F)
  const R = cam(p3(S, F.right, false)), Fl = cam(p3(S, flatLeg, false)), U = cam(p3(S, upLeg, false))
  const a = sub(Fl, R), b = sub(U, R)
  return a[0] * b[1] - a[1] * b[0] >= 0 ? 1 : -1
}

// ── labels ───────────────────────────────────────────────────────────────

/** Roughly how wide a short label is (what is seen, not the TeX). */
export function labelWidth(tex: string, size: number): number {
  const seen = tex.replace(/\\textcolor\{[^}]*\}/g, "").replace(/\\text\{([^}]*)\}/g, "$1").replace(/\\circ/g, "o").replace(/\\(sin|cos|tan)/g, "sin").replace(/\\[a-zA-Z]+/g, "x").replace(/[{}^_\\ ]/g, "")
  return seen.length * size * 0.5
}

/** A label beside a line: at a point along it, out to the side away from `mid` (or the side `side` points to), clear by half its own size. */
export function besideLine(a: Vec, b: Vec, size: number, tex: string, mid: Vec, along = 0.5, side?: Vec): Vec {
  const m = lerpV(a, b, along)
  const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (side ? dot(n, side) < 0 : dot(n, sub(mid, m)) > 0) n = mul(n, -1)
  const halfW = labelWidth(tex, size) / 2, halfH = size * 0.55
  const off = Math.max(size * 0.75 + 6, Math.abs(n[0]) * (halfW + 8) + Math.abs(n[1]) * (halfH + 7))
  return add(m, mul(n, off))
}

/**
 * Which side of a line its length sits on: away from the figure's middle,
 * but never decided by a near tie. A long diagonal runs right through the
 * middle, so "away from the middle" flips every frame as the view eases (the
 * 17 on EC jittered, Hassan 16 Nov 2026): when the evidence is weak the label
 * keeps the side it had, or else sits above the line (right of an upright one).
 */
function lineSide(S: Scene, key: string, a: Vec, b: Vec, mid: Vec): Vec {
  const m = lerpV(a, b, 0.5)
  const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
  const n: Vec = [-d[1] / l, d[0] / l]
  const prev = S.labSide[key]
  const away = dot(n, sub(m, mid))
  let pick: Vec
  if (Math.abs(away) >= 12) pick = away > 0 ? n : mul(n, -1)
  else if (prev) pick = dot(n, prev) >= 0 ? n : mul(n, -1)
  else pick = Math.abs(n[1]) > 0.2 ? (n[1] < 0 ? n : mul(n, -1)) : n[0] > 0 ? n : mul(n, -1)
  S.labSide[key] = pick
  return pick
}

/** Which way a letter sits from its point: out from the middle, kept while the point is too near the middle to say. */
function letterSide(S: Scene, key: string, p: Vec, mid: Vec): Vec {
  const d = sub(p, mid), l = Math.hypot(d[0], d[1])
  if (l >= 16) { const u: Vec = [d[0] / l, d[1] / l]; S.labSide[key] = u; return u }
  return S.labSide[key] ?? [0.7071, 0.7071]
}

/** The middle of what is drawn of the solid, on screen. */
export function screenMiddle(S: Scene): Vec {
  const names = Object.keys(S.P3).filter(n => S.P3[n])
  if (!names.length) return [S.w / 2, S.h / 2]
  const f = S.fitD ?? S.fit
  return f ? proj(S, f.c) : [S.w / 2, S.h / 2]
}

/** An arc's geometry on screen: the corner, points round it (in the plane of its two lines), and where its label goes. */
export function arcGeom(S: Scene, g: { at: string; a: string; b: string }, rPx = 30, size = 18, tex = "x") {
  const C = p3(S, g.at), A = p3(S, g.a), B = p3(S, g.b)
  const u = vunit(vsub(A, C)), v0 = vsub(B, C)
  const w = vunit(vsub(v0, vmul(u, vdot(v0, u))))
  const ang = Math.acos(clamp(vdot(u, vunit(v0)), -1, 1))
  const f = S.fitD ?? S.fit
  const r = rPx / Math.max(1, f?.u ?? 30)
  const pts: Vec[] = []
  for (let k = 0; k <= 24; k++) {
    const t = (ang * k) / 24
    pts.push(proj(S, vadd(C, vadd(vmul(u, r * Math.cos(t)), vmul(w, r * Math.sin(t))))))
  }
  const Cs = proj(S, C)
  const bis = vadd(C, vadd(vmul(u, Math.cos(ang / 2)), vmul(w, Math.sin(ang / 2))))
  const dir = sub(proj(S, bis), Cs), dl = Math.hypot(dir[0], dir[1]) || 1
  const need = Math.max(size * 0.95, labelWidth(tex, size) * 0.55 + 4)
  const lr = Math.max(rPx + size * 0.9, need / Math.max(0.25, Math.sin(ang / 2)))
  return { C: Cs, pts, ang, labelAt: add(Cs, mul(dir, Math.min(lr, rPx * 3.2) / dl)), spot: add(Cs, mul(dir, (rPx * 0.75) / dl)) }
}

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  const mid = screenMiddle(S)
  // while a triangle is lifted out, what is not on it fades back with the rest of the solid
  const lit = new Set(S.liftLit ?? [])
  const back = (...pts: string[]) => (S.liftLit && !pts.every(n => lit.has(n)) ? 1 - S.dimMax * S.dim.v : 1)
  if (S.vis.letters.v > 0.01) {
    for (const [n, letter] of Object.entries(S.names)) {
      if (!letter || !S.P3[n]) continue
      const p = ptS(S, n)
      const dd = S.letterDir[n] ?? letterSide(S, `L-${n}`, p, mid)
      const ll = Math.hypot(dd[0], dd[1]) || 1
      out.push({ key: `L-${n}`, tex: letter, col: CHALK, at: add(p, mul(dd, (size * 0.95 + 5) / ll)), anchor: p, size: size + 1, op: S.vis.letters.v * back(n) })
    }
  }
  // while a triangle is out, its numbers are on the flat copy: the figure (now small) keeps only its
  // letters, and any number the question needs that is not on the flat (`keep`: BC = 12 when MB is asked)
  const flatsOut = S.flats.some(F => F.t.v > 0.5)
  if (S.vis.lens.v > 0.01) {
    for (const [key, lb] of Object.entries(S.lens)) {
      if (flatsOut && !lb.keep) continue
      const [a, b] = key.split("-")
      if (!S.P3[a] || !S.P3[b]) continue
      const sg = S.segs[key]
      if (sg && sg.grow.v < 0.95) continue
      const A = ptS(S, a), B = ptS(S, b), along = lb.along ?? 0.5
      out.push({ key: `N-${key}`, tex: lb.tex, col: lb.col ?? CHALK, at: besideLine(A, B, size, lb.tex, mid, along, lineSide(S, `N-${key}`, A, B, mid)), anchor: lerpV(A, B, along), size: size + 1, op: S.vis.lens.v * back(a, b), pulse: lb.pulse })
    }
  }
  if (S.vis.marks.v > 0.01 && !flatsOut) {
    S.arcs.forEach((g, i) => {
      if (!g.tex) return
      const G = arcGeom(S, g, arcPx(S), size, g.tex)
      out.push({ key: `A-${i}-${g.at}`, tex: g.tex, col: g.col ?? CHALK, at: G.labelAt, anchor: G.C, size, op: S.vis.marks.v, pulse: g.pulse })
    })
  }
  if (S.vis.flats.v > 0.01) {
    for (const F of S.flats) {
      if (F.t.v < 0.05 || F.pts.some(n => !F.pos[n])) continue
      const P = F.pts.map(n => F.pos[n])
      const m: Vec = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]
      // the letters ride along as it comes out; its numbers come once it has landed
      const op = S.vis.flats.v * clamp((F.t.v - 0.05) / 0.4, 0, 1)
      const numOp = S.vis.flats.v * clamp((F.t.v - 0.8) / 0.2, 0, 1)
      for (const n of F.pts) {
        const letter = S.names[n]
        if (!letter) continue
        const p = F.pos[n], d = sub(p, m), l = Math.hypot(d[0], d[1]) || 1
        out.push({ key: `FL-${F.id}-${n}`, tex: letter, col: CHALK, at: add(p, mul(d, (size * 0.95 + 5) / l)), anchor: p, size: size + 1, op })
      }
      for (const [key, lb] of Object.entries(F.lens)) {
        const [a, b] = key.split("-")
        if (!F.pos[a] || !F.pos[b]) continue
        out.push({ key: `FN-${F.id}-${key}`, tex: lb.tex, col: lb.col ?? dirCol(S, a, b), at: besideLine(F.pos[a], F.pos[b], size, lb.tex, m), anchor: lerpV(F.pos[a], F.pos[b], 0.5), size: size + 2, op: numOp, pulse: lb.pulse })
      }
      if (F.angle?.tex) {
        const others = F.pts.filter(n => n !== F.angle!.at)
        const C = F.pos[F.angle.at], a = F.pos[others[0]], b = F.pos[others[1]]
        const u1 = Math.atan2(a[1] - C[1], a[0] - C[0]), sw = turn(u1, Math.atan2(b[1] - C[1], b[0] - C[0]))
        const bis = u1 + sw / 2
        const r = Math.max(size * 2.4, (labelWidth(F.angle.tex, size) * 0.55 + 6) / Math.max(0.25, Math.sin(Math.abs(sw) / 2)))
        out.push({ key: `FA-${F.id}`, tex: F.angle.tex, col: F.angle.col ?? CHALK, at: add(C, mul([Math.cos(bis), Math.sin(bis)], Math.min(r, size * 5))), anchor: C, size, op: numOp })
      }
    }
  }
  return out
}

/** The arc radius on screen. */
export const arcPx = (S: Scene) => (S.w < 560 ? 24 : 30)

// ── animation ────────────────────────────────────────────────────────────

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  S.eqRoom.v += (S.eqRoom.t - S.eqRoom.v) * k(0.12)

  // the box and the pyramid make their points from their sizes (a box with no height yet is a rectangle on the floor)
  if (S.box) { Object.assign(S.P3, boxPts(S.box.l, S.box.w, S.box.h)); S.faces = S.box.h < 0.05 ? [BOX_FACES[0]] : BOX_FACES }
  if (S.pyr) { Object.assign(S.P3, pyramidPts(S.pyr.l, S.pyr.w, S.pyr.h)); S.faces = S.pyr.h < 0.05 ? [PYRAMID_FACES[0]] : PYRAMID_FACES }
  if (S.stick) { const T = stickTop(S.stick); S.P3.P = [...S.stick.base] as V3; S.P3.T = T; S.P3.Tf = [T[0], T[1], 0] }
  // a net folds smoothly to where it is going (at once under a finger)
  if (S.net) S.net.tD += (S.net.t - S.net.tD) * (S.drag?.kind === "handle" ? 1 : k(0.1))
  // a sheet through the solid: which plane it is clicked into; it follows the finger, glides into a
  // click and everywhere else; while it stays clicked the solid's mirror copy goes through it
  const sh = S.sheet
  if (sh) {
    const r = RAD, n: V3 = [Math.cos(sh.tau * r) * Math.cos(sh.phi * r), Math.cos(sh.tau * r) * Math.sin(sh.phi * r), -Math.sin(sh.tau * r)]
    sh.at = sh.snaps.find(m => Math.abs(vdot(vunit(m), n)) > Math.cos(0.5 * r)) ?? null
    const held = S.drag?.kind === "handle" && S.drag.id.startsWith("sheet")
    const f = held && !sh.at ? 1 : k(0.24)
    const gap = ((((sh.phi - sh.phiD) % 360) + 540) % 360) - 180
    sh.phiD += gap * f
    sh.tauD += (sh.tau - sh.tauD) * f
    const settled = !!sh.at && Math.abs(gap) < 0.6 && Math.abs(sh.tau - sh.tauD) < 0.6
    sh.e = settled ? Math.min(1, sh.e + dt * 1.5) : Math.max(0, sh.e - dt * 5)
  }
  const fp =k(S.drag?.kind === "handle" ? 0.35 : 0.14)
  for (const [n, p] of Object.entries(S.P3)) {
    const d = S.D3[n]
    S.D3[n] = d ? vlerp(d, p, fp) : [p[0], p[1], p[2]]
  }
  for (const n of Object.keys(S.D3)) if (!S.P3[n]) delete S.D3[n]
  for (const sg of Object.values(S.segs)) { sg.grow.v += (sg.grow.t - sg.grow.v) * k(0.09); if (Math.abs(sg.grow.t - sg.grow.v) < 0.003) sg.grow.v = sg.grow.t }

  // turning: by the finger, then carrying on a little, or slowly by itself
  if (!S.drag) {
    const fl = S.fling
    if (Math.abs(fl.yaw) > 0.5 || Math.abs(fl.pitch) > 0.5) {
      S.yaw += fl.yaw * dt
      S.pitch = clamp(S.pitch + fl.pitch * dt, -89, 89)
      const decay = Math.exp(-dt * 4)
      fl.yaw *= decay
      fl.pitch *= decay
    } else if (S.spin && S.time - S.lastTouch > 1.6) S.yaw += S.spin * dt
  }
  const tv = k(S.drag?.kind === "orbit" ? 0.55 : 0.12)
  S.yawD += (S.yaw - S.yawD) * tv
  S.pitchD += (S.pitch - S.pitchD) * tv

  // room for the flats, and the solid fading back while a triangle comes out of it (acts may hold these)
  // (a triangle still waiting to come out does not count)
  S.split.t = S.flats.some(F => F.t.t > 0 || F.fly) && S.vis.flats.t > 0.5 ? 1 : 0
  S.split.v += (S.split.t - S.split.v) * k(0.05)
  if (Math.abs(S.split.t - S.split.v) < 0.002) S.split.v = S.split.t
  S.dim.v += (S.dim.t - S.dim.v) * k(0.06)
  runActs(S)

  const L = layout(S)
  // the view holds still under a finger dragging a handle (else the box would grow away from it)
  if (S.drag?.kind !== "handle" || !S.fit) S.fit = fitFor(S, L)
  if (!S.fitD) S.fitD = { ...S.fit, c: [...S.fit.c] as V3 }
  const ff = k(0.1)
  const A = S.fitD, B = S.fit
  S.fitD = { cx: A.cx + (B.cx - A.cx) * ff, cy: A.cy + (B.cy - A.cy) * ff, u: A.u + (B.u - A.u) * ff, c: vlerp(A.c, B.c, ff), R: A.R + (B.R - A.R) * ff }

  placeFlats(S, L)
  for (const F of S.flats) {
    if (!F.fly) {
      F.t.v += (F.t.t - F.t.v) * k(0.05)
      if (Math.abs(F.t.t - F.t.v) < 0.002) F.t.v = F.t.t
    }
    flatPos(S, F, k)
    if (F.t.v >= 0.999 && !F.fly) S.flatMem[`${F.id}:${F.pts.join("")}`] = { ...F.pos }
  }

  let node = S.eqFn ? S.eqFn(S) : null
  let size = L.eqSize
  const fits = (n: ENode, sz: number) => extent(n, sz).w <= L.eqW - 32
  if (node) {
    while (size > 19 && !fits(node, size)) size -= 1
    if (!fits(node, size)) { const two = wrapRow(node, L.eqSize, L.eqW - 32); if (two) { node = two; size = L.eqSize } }
  }
  if (node) while (size > 14 && !fits(node, size)) size -= 1
  const typed = S.input?.value ?? ""
  if (node && !fits(node, size) && typed.length > 1) {
    for (let i = 1; i < typed.length; i++) {
      const n2 = withBoxTex(node, `\\cdots ${calcTex(typed.slice(i))}`)
      if (fits(n2, size)) { node = n2; break }
    }
  }
  if (node) { const e = extent(node, size); S.eqRoom.t = e.up + e.down + size * 1.1 } else S.eqRoom.t = 0
  S.eq.size = size
  S.eq.cx = L.midX
  S.eq.cy = L.eqY
  eqSet(S.eq, node, S.eq.goneTo)
  eqStep(S.eq, dt)
  S.tick?.(S)

  S.labs = computeLabels(S, L)
  const keep = new Set<string>()
  for (const l of S.labs) {
    keep.add(l.key)
    const d = S.labD[l.key]
    const want = sub(l.at, l.anchor)
    if ((S.labSlow[l.key] ?? 0) > S.time && d) {
      // a number flying to a new place: it travels slowly, on its own path
      S.labD[l.key] = lerpV(d, l.at, k(0.045))
      S.labOff[l.key] = sub(S.labD[l.key], l.anchor)
      continue
    }
    // stuck to its anchor (no lag as the figure turns); only a change of side eases
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

/** Play the acts in turn: each runs for its time, then the next begins (in the same frame). */
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

/** Whether choreography is still playing. */
export const acting = (S: Scene) => !!S.act || S.acts.length > 0

/** An act that turns the view, slowly, to a yaw and pitch (worked out as it begins, from wherever the view is then). */
export function turnAct(to: (S: Scene) => { yaw: number; pitch: number }, dur: number, lock = true): Act {
  let from = { yaw: 0, pitch: 0 }, goal = { yaw: 0, pitch: 0 }
  return {
    dur, lock,
    begin: S2 => {
      S2.fling = { yaw: 0, pitch: 0 }
      S2.spin = 0
      from = { yaw: S2.yawD, pitch: S2.pitchD }
      S2.yaw = S2.yawD
      S2.pitch = S2.pitchD
      goal = to(S2)
    },
    run: (S2, e) => {
      S2.yaw = S2.yawD = from.yaw + (goal.yaw - from.yaw) * e
      S2.pitch = S2.pitchD = from.pitch + (goal.pitch - from.pitch) * e
    },
  }
}

/** An act that only waits (something on the figure says its piece meanwhile). */
export const holdAct = (dur: number, begin?: (S: Scene) => void, end?: (S: Scene) => void): Act => ({ dur, lock: true, begin, end })

// ── beat helpers ─────────────────────────────────────────────────────────

export function show(S: Scene, keys: VisKey[]) {
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
}
export function later(S: Scene, seconds: number, fn: (S: Scene) => void) {
  S.timers.push({ at: S.time + seconds, fn })
}
export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

/** Clear everything a beat sets. The view keeps its turn (the student's own), and the solid keeps its points. */
export function resetBeat(S: Scene) {
  S.mode = "none"
  S.keyRows = 4
  S.faceLit = {}
  S.curved = null
  S.net = null
  S.netEdit = null
  S.onFloor = null
  S.sheet = null
  S.drag = null
  S.names = {}
  S.letterDir = {}
  S.edgeCol = {}
  S.segs = {}
  S.lens = {}
  S.tris = []
  S.rights = []
  S.arcs = []
  S.dots = []
  S.ticks = []
  S.vals = {}
  S.glowPts = []
  S.light = []
  S.handles = []
  S.flats = []
  S.regions = null
  S.onRegion = null
  S.regionLit = null
  S.tapPoints = null
  S.onPoint = null
  S.joinFrom = null
  S.onJoin = null
  S.tapSegs = null
  S.onSeg = null
  S.tapArcs = null
  S.onArc = null
  S.tapFlat = null
  S.onFlatSide = null
  S.eqFn = null
  S.solve = null
  S.dragAtoms = []
  S.onAtomDrop = null
  S.dragTex = {}
  S.eq.goneTo = {}
  S.eq.goneFade = {}
  S.eq.slow = null
  S.choice = null
  S.chipsOn = null
  S.tick = null
  S.timers = []
  S.walkTex = null
  S.input = null
  S.got = new Set()
  S.touched = null
  S.note = null
  S.spin = 0
  S.turned = 0
  S.fitPts = null
  S.labSlow = {}
  S.acts = []
  S.act = null
  S.dim.t = 0
  S.dimMax = 0.62
  S.liftLit = null
}

/**
 * Turn the view (gently) to one where every handle can be dragged: a beat
 * that asks for a pull starts here; the student can still turn it anywhere.
 */
export function goodView(S: Scene, yaw = -34, pitch = 24) {
  // the nearest equivalent of the yaw, so it turns the short way round
  S.yaw = S.yaw + ((((yaw - S.yaw) % 360) + 540) % 360) - 180
  S.pitch = pitch
  S.fling = { yaw: 0, pitch: 0 }
}

/** Add a line between two points (growing from a to b), in its direction's colour unless a colour is given. */
export function addSeg(S: Scene, a: string, b: string, o: { col?: string; grown?: boolean; glow?: boolean; faint?: boolean } = {}) {
  const key = segKey(a, b)
  const old = S.segs[key]
  S.segs[key] = { a, b, col: o.col, grow: { v: o.grown || old ? 1 : 0, t: 1 }, glow: o.glow, faint: o.faint }
  return key
}

/**
 * A triangle lifted out of the figure, laid flat beside it at its true
 * shape. `now`: already out (a board opened cold, or the beat after a lift);
 * it starts where the last beat drew it, so nothing slides between beats.
 */
export function liftOut(S: Scene, id: string, pts: [string, string, string], right: string, lens: Flat["lens"] = {}, now = false): Flat {
  const old = S.flats.find(F => F.id === id)
  const hk = `${id}:${pts.join("")}`
  const hand = S.hands[hk] ?? flatHand(S, { pts, right })
  S.hands[hk] = hand
  // it starts where the triangle is, or where it was last drawn (so it is never drawn before it has a place)
  const home = Object.fromEntries(pts.map(n => [n, ptS(S, n)])) as Record<string, Vec>
  const mem = S.flatMem[hk]
  const start = old ? { ...old.pos } : mem ? { ...mem } : { ...home }
  const F: Flat = { id, pts, right, t: { v: now ? 1 : old?.t.v ?? 0, t: now ? 1 : 0 }, lens, pos: start, target: old ? { ...old.target } : { ...start }, hand, snap: now && !old && !mem }
  S.flats = [...S.flats.filter(f => f.id !== id), F]
  S.vis.flats.t = 1
  if (now) S.split.v = S.split.t = 1
  return F
}

/**
 * Lift a triangle out, slowly, so the student sees what happens (Hassan, 16
 * Nov 2026: "it should first slowly turn the 3d shape in such a position
 * where that '2d shape' is being seen head on and then it should come out").
 * The solid turns until the triangle faces the student and everything else
 * fades back; its right angle shows square; the triangle comes away as one
 * piece and lies down beside the solid, which moves over to make room; then
 * the solid turns back to where the student had it.
 */
export function liftSlow(S: Scene, id: string, pts: [string, string, string], right: string, lens: Flat["lens"] = {}, then?: (F: Flat) => void): Flat {
  const F = liftOut(S, id, pts, right, lens)
  F.t = { v: 0, t: 0 }
  const was = { yaw: S.yawD, pitch: S.pitchD }
  let sp0 = 0
  const others = pts.filter(n => n !== right)
  const pulse = (S2: Scene, on: boolean) => {
    const has = S2.rights.some(r => r.at === right)
    S2.rights = has ? S2.rights.map(r => (r.at === right ? { ...r, pulse: on } : r)) : on ? [...S2.rights, { at: right, a: others[0], b: others[1], pulse: true }] : S2.rights
  }
  S.acts.push(
    turnAct(S2 => { S2.dim.t = 1; S2.liftLit = [...pts]; return facingView(S2, F) }, 2.2),
    holdAct(0.9, S2 => pulse(S2, true)),
    {
      dur: 2.6, lock: true,
      begin: S2 => {
        const hk = `${id}:${pts.join("")}`
        F.hand = flatHand(S2, F)
        S2.hands[hk] = F.hand
        F.fly = { from: Object.fromEntries(pts.map(n => [n, ptS(S2, n)])), e: 0, home: false }
        sp0 = S2.split.v
      },
      run: (S2, e) => {
        if (F.fly) F.fly.e = e
        F.t.v = F.t.t = e
        S2.split.v = S2.split.t = sp0 + (1 - sp0) * e
      },
      end: S2 => { F.fly = null; F.t.v = F.t.t = 1; pulse(S2, false); S2.liftLit = null; then?.(F) },
    },
    { ...turnAct(() => was, 2.0, false), end: S2 => { S2.dim.t = 0 } },
  )
  return F
}

/**
 * Put the flats back into the figure, one at a time and slowly: the solid
 * turns to face each triangle's place, the flat flies back into it, then the
 * solid takes its room back and turns to where it was.
 */
export function putBack(S: Scene, then?: (S: Scene) => void) {
  const was = { yaw: S.yawD, pitch: S.pitchD }
  for (const F of [...S.flats].reverse()) {
    S.acts.push(
      turnAct(S2 => { S2.dim.t = 1; S2.liftLit = [...F.pts]; return facingView(S2, F) }, 1.8),
      {
        dur: 2.2, lock: true,
        begin: () => { F.fly = { from: { ...F.pos }, e: 0, home: true } },
        run: (_S2, e) => { if (F.fly) F.fly.e = e; F.t.v = F.t.t = 1 - e },
        // home: no longer drawn, but it keeps its place so the others do not move or grow
        end: S2 => { F.fly = null; F.t.v = F.t.t = 0; S2.liftLit = null },
      },
    )
  }
  // the turn back and the solid taking its room back, together
  const back = turnAct(() => was, 2.0)
  let sp0 = 1
  S.acts.push({
    dur: 2.0, lock: true,
    begin: S2 => { back.begin?.(S2); sp0 = S2.split.v },
    run: (S2, e, t) => { back.run?.(S2, e, t); S2.split.v = S2.split.t = sp0 * (1 - e) },
    end: S2 => { S2.dim.t = 0; S2.flats = []; S2.vis.flats.t = 0; then?.(S2) },
  })
}

/** A number on one flat flies slowly to its place on another (or anywhere a label key is). */
export function flyLabel(S: Scene, toKey: string, fromKey: string, seconds = 1.3) {
  const from = S.labD[fromKey]
  if (from) S.labD[toKey] = [from[0], from[1]]
  S.labSlow[toKey] = S.time + seconds
}

export function startInput(S: Scene, spec: Omit<CalcInput, "value" | "tries" | "state" | "wrongAt">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9 }
}

/** The answer box, for an equation's tail. */
export function boxNode(S: Scene): ENode {
  const inp = S.input
  return { k: "box", id: "box", tex: inp ? calcTex(inp.value) : "", state: inp?.state ?? "idle", wrongAt: inp?.wrongAt ?? -9 }
}

/** A row of maths on two lines, broken at a + or −, or just after the =. */
function wrapRow(n: ENode, size0: number, maxW: number): ENode | null {
  if (n.k !== "row" || n.items.length < 4) return null
  let best: { cut: number; w: number } | null = null
  for (let i = 2; i < n.items.length - 1; i++) {
    const it = n.items[i]
    if (it.k !== "a" || !it.op || !["+", "-", "="].includes(it.tex)) continue
    const cut = it.tex === "=" ? i + 1 : i
    const w = Math.max(extent(row(n.items.slice(0, cut), n.gap), size0).w, extent(row(n.items.slice(cut), n.gap), size0).w)
    if (!best || w < best.w) best = { cut, w }
  }
  if (!best || best.w > maxW * 1.6) return null
  return frac("wrap", row(n.items.slice(0, best.cut), n.gap), row(n.items.slice(best.cut), n.gap), "rgba(0,0,0,0)")
}

function withBoxTex(n: ENode, tex: string): ENode {
  if (n.k === "box") return n.slot ? n : { ...n, tex }
  if (n.k === "row") return { ...n, items: n.items.map(i => withBoxTex(i, tex)) }
  if (n.k === "frac") return { ...n, num: withBoxTex(n.num, tex), den: withBoxTex(n.den, tex) }
  if (n.k === "paren") return { ...n, child: withBoxTex(n.child, tex) }
  return n
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

/** Screen units per world unit along an axis at a point (how a finger's move becomes a move in the world). */
function axisOnScreen(S: Scene, at: V3, axis: V3): Vec {
  return sub(proj(S, vadd(at, axis)), proj(S, at))
}

/** The handle under a finger, if any. */
function handleAt(S: Scene, p: Vec): Handle | null {
  let best: Handle | null = null, bd = Infinity
  for (const h of S.handles) { const d = dist(p, proj(S, h.at(S))); if (d < bd) { bd = d; best = h } }
  return best && bd < tol(S) + 14 ? best : null
}

/** The point nearest a finger, of those a beat lets the student tap. */
function pointAt(S: Scene, p: Vec, names: string[]): string | null {
  let best: string | null = null, bd = Infinity
  for (const n of names) {
    const d = Math.min(dist(p, ptS(S, n)), S.labD[`L-${n}`] ? dist(p, S.labD[`L-${n}`]) + 4 : Infinity)
    if (d < bd) { bd = d; best = n }
  }
  return best && bd < tol(S) + 10 ? best : null
}

let lastMove = { t: 0, dx: 0, dy: 0 }

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  S.lastTouch = S.time
  S.fling = { yaw: 0, pitch: 0 }
  // pieces of the equation, in a move across
  if (S.mode === "solve" && S.dragAtoms.length) {
    const id = eqHit(S.eq, p, S.dragAtoms)
    if (id) { S.drag = { kind: "atom", id, p }; return true }
  }
  const h = handleAt(S, p)
  if (h) {
    h.start?.(S)
    const at0 = h.at(S)
    S.drag = { kind: "handle", id: h.id, start: p, moved: 0, at0, off: sub(p, proj(S, at0)) }
    return true
  }
  if (S.mode === "join" && S.tapPoints) {
    const n = pointAt(S, p, S.tapPoints)
    if (n) { S.drag = { kind: "join", from: n, start: p, p, moved: 0 }; return true }
  }
  // anything else turns the figure; a tap without moving is a tap. A turn the
  // lesson is playing gives way to the student's hand, unless it is mid-lift.
  if (S.act && !S.act.a.lock) { const a = S.act.a; S.act = null; a.end?.(S) }
  S.drag = { kind: "orbit", start: p, last: p, moved: 0 }
  return true
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  S.lastTouch = S.time
  if (d.kind === "atom") { d.p = p; return }
  if (d.kind === "join") { d.moved += dist(p, d.p); d.p = p; return }
  if (d.kind === "handle") {
    const h = S.handles.find(x => x.id === d.id)
    if (!h) return
    d.moved = dist(p, d.start)
    if (h.place) { h.place(S, sub(p, d.off)); return }
    // how far along its axis puts the handle under the finger (perspective makes it a little uneven: a few small steps)
    const want = sub(p, d.off)
    let amount = 0
    for (let k = 0; k < 4; k++) {
      const q = vadd(d.at0, vmul(h.axis, amount))
      const ax = axisOnScreen(S, q, h.axis)
      amount += dot(sub(want, proj(S, q)), ax) / Math.max(1e-6, dot(ax, ax))
    }
    h.move(S, amount)
    return
  }
  const dx = p[0] - d.last[0], dy = p[1] - d.last[1]
  d.moved += Math.hypot(dx, dy)
  d.last = p
  if (d.moved < 6 || S.act?.a.lock) return
  const k = 0.42
  S.yaw += dx * k
  S.pitch = clamp(S.pitch + dy * k, -89, 89)
  S.turned += Math.hypot(dx, dy) * k
  lastMove = { t: S.time, dx: dx * k, dy: dy * k }
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  if (d.kind === "atom") {
    const onto = eqHit(S.eq, d.p, undefined, 6)
    S.onAtomDrop?.(S, d.id, onto && onto !== d.id ? onto : null, d.p)
    return
  }
  if (d.kind === "handle") return
  if (d.kind === "join") {
    // let go on another point: joined; a tap: that point is picked, waiting for the other end
    const to = d.moved > 10 && S.tapPoints ? pointAt(S, d.p, S.tapPoints.filter(n => n !== d.from)) : null
    if (to) { S.joinFrom = null; S.onJoin?.(S, d.from, to); return }
    if (d.moved <= 10) {
      if (S.joinFrom && S.joinFrom !== d.from) { const a = S.joinFrom; S.joinFrom = null; S.onJoin?.(S, a, d.from) } else S.joinFrom = S.joinFrom === d.from ? null : d.from
    }
    return
  }
  if (d.moved < 8) { tapAt(S, d.start); return }
  // let go while turning: it carries on a little
  if (S.time - lastMove.t < 0.08) S.fling = { yaw: lastMove.dx * 60, pitch: lastMove.dy * 60 }
}

/** A tap (not a turn): what the beat is listening for. */
function tapAt(S: Scene, p: Vec) {
  if (S.mode === "tapFloor") { const w = floorAt(S, p); if (w) S.onFloor?.(S, w); return }
  if (S.mode === "tapPoint" && S.tapPoints) {
    const n = pointAt(S, p, S.tapPoints)
    if (n) S.onPoint?.(S, n)
    return
  }
  if (S.mode === "join" && S.tapPoints) {
    const n = pointAt(S, p, S.tapPoints)
    if (n) {
      if (S.joinFrom && S.joinFrom !== n) { const a = S.joinFrom; S.joinFrom = null; S.onJoin?.(S, a, n) } else S.joinFrom = n
    }
    return
  }
  if (S.mode === "tapSeg" && S.tapSegs) {
    let best: string | null = null, bd = Infinity
    for (const key of S.tapSegs) {
      const [a, b] = key.split("-")
      const dd = Math.min(distToSeg(p, ptS(S, a), ptS(S, b)), S.labD[`N-${key}`] ? dist(p, S.labD[`N-${key}`]) : Infinity)
      if (dd < bd) { bd = dd; best = key }
    }
    if (best && bd < tol(S)) S.onSeg?.(S, best)
    return
  }
  if (S.mode === "tapArc" && S.tapArcs) {
    let best = -1, bd = Infinity
    S.tapArcs.forEach((g, i) => {
      const G = arcGeom(S, g, arcPx(S))
      const dd = Math.min(dist(p, G.spot), ...G.pts.map(q => dist(p, q)))
      if (dd < bd) { bd = dd; best = i }
    })
    if (best >= 0 && bd < tol(S) + 12) S.onArc?.(S, best)
    return
  }
  if (S.mode === "tapRegion" && S.regions) {
    // of the regions under the finger, the one it is most in the middle of (for its size): a
    // triangle standing inside the solid and a face in front of it can overlap on screen, and
    // tapping the middle of the one you mean must get it, whichever is smaller from this side
    const hits = S.regions.filter(r => inPoly(p, r.pts.map(n => ptS(S, n))))
    if (!hits.length) return
    const score = (r: { pts: string[] }) => {
      const P = r.pts.map(n => ptS(S, n))
      let a = 0
      for (let i = 0; i < P.length; i++) { const q = P[(i + 1) % P.length]; a += P[i][0] * q[1] - q[0] * P[i][1] }
      const c: Vec = [P.reduce((t, q) => t + q[0], 0) / P.length, P.reduce((t, q) => t + q[1], 0) / P.length]
      return dist(p, c) / Math.sqrt(Math.max(1, Math.abs(a) / 2))
    }
    hits.sort((a, b) => score(a) - score(b))
    S.onRegion?.(S, hits[0].id)
    return
  }
  if (S.mode === "tapFlatSide" && S.tapFlat) {
    const F = S.flats.find(f => f.id === S.tapFlat)
    if (!F) return
    let best: string | null = null, bd = Infinity
    for (let i = 0; i < 3; i++) {
      const a = F.pts[i], b = F.pts[(i + 1) % 3], key = segKey(a, b)
      const lab = S.labD[`FN-${F.id}-${key}`]
      const dd = Math.min(distToSeg(p, F.pos[a], F.pos[b]), lab ? dist(p, lab) : Infinity)
      if (dd < bd) { bd = dd; best = key }
    }
    if (best && bd < tol(S) + 6) S.onFlatSide?.(S, best)
  }
}

// ── typed answers: the calculator ────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "go") { check(S); return }
  if (key === "SHIFT") { inp.shift = !inp.shift; return }
  if ((inp.state === "wrong" || inp.fresh) && key !== "back") inp.value = ""
  inp.fresh = false
  const k = inp.shift && INV_KEY[key] ? INV_KEY[key] : key
  inp.shift = false
  inp.value = calcType(inp.value, k, inp.max)
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const { verdict, v } = judge(inp.value, inp.answer, { sf: inp.sf, dp: inp.dp })
  if (verdict === "error") {
    inp.tries++; inp.state = "wrong"; inp.wrongAt = S.time
    say(S, "Math ERROR. Is something the wrong way round?", "wrong", 4.5)
    inp.help?.(S, inp.tries)
    return
  }
  if (verdict === "unfinished") { say(S, "That calculation is not finished.", "calm", 2.6); return }
  if (inp.calcOnly && !isCalculation(inp.value)) { inp.fresh = true; inp.tries++; say(S, inp.calcOnly, "calm", 3.4); return }
  if (verdict === "rough") {
    inp.fresh = true
    say(S, inp.sf ? `Nearly. Give it to $${inp.sf}$ significant figures.` : `Nearly. Give it to $${inp.dp ?? 1}$ decimal place.`, "calm", 3.4)
    return
  }
  if (verdict === "right") {
    inp.state = "right"
    const val = calcValue(inp.value)
    setAns(val ?? inp.answer)
    S.note = null
    S.touched = "eq"
    if (inp.typed?.includes("a") && !inp.value.includes("A") && isCalculation(inp.value)) say(S, "Right. Ans keeps every digit, so it's safer than typing the number.", "calm", 4)
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  inp.help?.(S, inp.tries)
  // a known slip first; else a rounded copy of Ans typed inside a calculation where Ans was
  // meant: the student cannot see its digits, so say so (never just "wrong")
  const slip = v !== null ? inp.slips?.find(s => slipMatches(inp.value, v, s.v)) : undefined
  if (slip) { say(S, slip.say, "wrong", 4.5); return }
  const rounded = inp.typed?.includes("a") && !inp.value.includes("A") && isCalculation(inp.value) ? roundedAns(inp.value) : null
  if (rounded) say(S, ansReminder(rounded, inp.ansName), "wrong", 6)
}

// ── word choices ─────────────────────────────────────────────────────────

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

// ── moving a piece across the = ──────────────────────────────────────────

export interface CrossState { stage: 0 | 1; pulse: Set<string>; grab: Set<string>; crossed: boolean; done: boolean }
export const crossOf = (S: Scene) => S.solve as CrossState | null
export const crossDone = (S: Scene) => !!crossOf(S)?.done

/**
 * The student drags a piece (any of `ids`, all one term) over the =, then
 * picks what it becomes on the other side. Wrong picks get their own note.
 */
export function startCross(S: Scene, o: {
  ids: string[]
  label: string
  from: "left" | "right"
  options: string[]
  answer: number
  notes?: Record<number, string>
  before: (st: CrossState) => ENode
  after: () => ENode
  ask?: string
  landed?: string
  goneTo?: (S: Scene) => Record<string, Vec>
}) {
  const st: CrossState = { stage: 0, pulse: new Set(), grab: new Set(o.ids), crossed: false, done: false }
  S.solve = st
  S.mode = "solve"
  S.dragAtoms = [...o.ids]
  for (const id of o.ids) S.dragTex[id] = o.label
  S.eqFn = () => (st.stage === 0 ? o.before(st) : o.after())
  S.onAtomDrop = (S2, _id, _onto, at) => {
    if (st.crossed) return
    const eq = eqCentre(S2.eq, "eq")
    if (!eq) return
    const over = o.from === "left" ? at[0] > eq[0] + 6 : at[0] < eq[0] - 6
    const near = Math.abs(at[1] - eq[1]) < S2.eq.size * 3.2
    if (!over || !near) { say(S2, "Drag it over the $=$, to the other side.", "calm", 3); return }
    st.crossed = true
    st.grab = new Set()
    st.pulse = new Set(o.ids)
    S2.dragAtoms = []
    say(S2, o.ask ?? "What does it become over there?", "calm", 600)
    choose(S2, o.options, o.answer, false, (S3, k, right) => {
      if (!right) { say(S3, o.notes?.[k] ?? "Moving across does the opposite.", "wrong", 4.2); return }
      S3.note = null
      later(S3, 0.5, S4 => {
        S4.choice = null
        if (o.goneTo) S4.eq.goneTo = o.goneTo(S4)
        eqSlow(S4.eq, 1.4)
        st.stage = 1
        st.pulse = new Set()
        S4.touched = "eq"
        S4.flashGood = 0.6
        if (o.landed) say(S4, o.landed, "calm", 600)
        later(S4, 1.7, () => { st.done = true })
      })
    })
  }
}

/** Where a piece being carried is (for drawing it under the finger). */
export function dragAt(S: Scene): Vec | null {
  const d = S.drag
  return d && d.kind === "atom" ? d.p : null
}

/** The chips at the bottom of the board: where each one is. */
export function chipRects(S: Scene, L: Layout): Rect[] {
  if (!S.chipsOn?.length) return []
  const size = L.eqSize * 0.8
  const gap = 14
  const ws = S.chipsOn.map(c => measure(c.tex, size).w + size * 1.4)
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)
  let x = L.midX - total / 2
  const hgt = size * 1.8
  return ws.map(wd => { const r = { x0: x, x1: x + wd, y0: L.chipsY - hgt / 2, y1: L.chipsY + hgt / 2 }; x += wd + gap; return r })
}

export { dist, lerpV, clamp, turn, add, sub, mul, dot }
