/**
 * The board for the trigonometry lessons.
 *
 * A right-angled triangle lives inside an angle. The angle's corner V sits
 * at the origin, one arm runs along the floor, the other is turned up by θ.
 * A line dropped straight down from a point P on the top arm meets the floor
 * at F, with a right angle there. So the triangle is V, F, P: VP is the
 * hypotenuse, and which of VF and FP is "opposite" depends on whether the
 * angle we look from sits at V or at P (`tri.at`).
 *
 * That triangle is kept in its own flat frame (V at the origin, F along +x,
 * P up) and a pose (a turn, a mirror, a shift) puts it anywhere on the
 * board, so practice turns and flips the student's own triangle rather than
 * showing a new one. World units, y UP; a view fits what the beat wants to
 * show into the room the board has.
 *
 * Under the figure sits an equation board (../equation.ts) where the
 * algebra happens, and below that, when asked, the rule cards, the move
 * chips, and a calculator keypad (../calc.ts).
 *
 * Targets (`tri`, `view`) are where things ARE; `triD`, `viewD` are what is
 * drawn, eased toward the targets every frame.
 */

import { type Vec, type Rect, add, sub, mul, dot, dist, lerpV, clamp, turn, DEG, RAD } from "../geometry"
import { createBoard, eqSet, eqStep, eqHit, eqCentre, measure, extent, type EqBoard, type ENode, type Eqn, type Fac } from "../equation"
import type { Solve } from "./solve"
import { calcType, calcTex, judge } from "../calc"

export const BLUE = "#00abfa"
export const ORANGE = "#ff822c"
export const PINK = "#ff4670"
export const YELLOW = "#fff067"
export const GREEN = "#0fee89"
export const CHALK = "#e8e6e0"
export const NEUTRAL = "#c9c7bf"
export const QUIET = "#7a7875"

export type Role = "O" | "A" | "H"
export type Corner = "V" | "F" | "P"
export type SideId = "VF" | "FP" | "VP"
export type Fn = "sin" | "cos" | "tan"
export const SIDES: SideId[] = ["VF", "FP", "VP"]

/** Opposite orange, adjacent blue, hypotenuse green (as in Pythagoras). */
export const ROLE_COL: Record<Role, string> = { O: ORANGE, A: BLUE, H: GREEN }
/** The two sides each rule uses: top over bottom. */
export const RULE: Record<Fn, [Role, Role]> = { sin: ["O", "H"], cos: ["A", "H"], tan: ["O", "A"] }

export type VisKey = "board" | "arms" | "tri" | "fill" | "rt" | "arc" | "labels" | "letters" | "extra" | "eq" | "keypad" | "cards" | "chips" | "hint" | "line" | "graph" | "tenth"
const VIS_KEYS: VisKey[] = ["board", "arms", "tri", "fill", "rt", "arc", "labels", "letters", "extra", "eq", "keypad", "cards", "chips", "hint", "line", "graph", "tenth"]

type Spring = { v: number; t: number }

/** Where the flat triangle goes on the board: turned by `phi` degrees, mirrored when `s` is -1, moved to `at`. */
export interface Pose { phi: number; s: number; at: Vec }

export interface Tri {
  /** the angle at V, in degrees */
  th: number
  /** the hypotenuse's length */
  h: number
  /** the corner we look from */
  at: "V" | "P"
  /** how far the line from P has come down (1: the triangle is made) */
  drop: number
  pose: Pose
}

export interface SideLabel { tex: string; col?: string; pulse?: boolean }

/** A label laid over the board this frame. */
export interface Lab { key: string; tex: string; col: string; at: Vec; size: number; op: number; pulse?: boolean }

export interface Card { fn: Fn; lit: boolean }
/** One sum on a calculator's screen: what was typed (left) and its answer (right). */
export interface CalcLine { q: string; a: string }
export interface Chip { id: string; tex: string; kind: "mul" | "div"; fac: Fac }

export interface CalcInput {
  value: string
  answer: number
  sf?: number
  dp?: number
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  hints: string[]
  /** known slips: a value a student may get, and what to say about it */
  slips?: { v: number; say: string }[]
  /** the next key starts a fresh answer (after "give it to 3 figures") */
  fresh?: boolean
  onRight?: (S: Scene) => void
  help?: (S: Scene, tries: number) => void
}

export type Mode = "none" | "turn" | "slide" | "turnSlide" | "drop" | "tapSide" | "tapCard" | "solve" | "tapRegion"

export type Drag =
  | { kind: "turn" }
  | { kind: "slide" }
  | { kind: "drop" }
  | { kind: "chip"; id: string; p: Vec }
  | { kind: "atom"; id: string; p: Vec; start: Vec }

export interface View { cx: number; cy: number; wx: number; wy: number; u: number }

export interface Scene {
  w: number
  h: number
  time: number
  beatStart: number
  mode: Mode

  frame: Rect
  frameFn: ((S: Scene) => Rect) | null
  view: View | null
  viewD: View | null

  tri: Tri
  triD: Tri
  /** the arms' length, world units */
  armR: number
  /** the arms grow out from the corner (scene time they started) */
  growArms: number | null
  thMin: number
  thMax: number
  hMin: number
  hMax: number
  /** an angle that clicked onto a target that is not whole (shown to 1 place) */
  thExact: number | null

  /** what each side says, by its role (the key, so a label flies when roles swap) */
  roleLabels: Partial<Record<Role, (S: Scene) => SideLabel | null>>
  /** sides drawn in their role's colour */
  roleColours: Set<Role>
  /** a side's colour, whatever its role */
  sideColour: Partial<Record<SideId, string>>
  sideColD: Record<SideId, [number, number, number]>
  /** what the angle says (θ, 30°, 47°) */
  angText: ((S: Scene) => string) | null
  /** letters at corners (exam figures) */
  letters: Partial<Record<string, string>>

  /** other lines on an exam figure, in the triangle's own flat frame */
  extra: {
    pts: Record<string, Vec>
    segs: [string, string][]
    fills: { pts: string[]; col: string; op?: number }[]
    dash?: [string, string][]
    /** lengths written by lines that are not the triangle's */
    labels?: { a: string; b: string; tex: string }[]
  } | null
  regions: { id: string; pts: string[] }[]
  onRegion: ((S: Scene, id: string) => void) | null
  regionLit: string | null

  /** light spreading from a corner across to a side */
  light: { from: Corner; side: SideId; since: number } | null
  glow: Set<SideId>
  pulseArc: boolean
  pulseRt: boolean
  pulseLabs: Set<string>
  /** the opposite laid twice along the hypotenuse (at 30°): when it started */
  halves: number | null
  /** a wrong hypotenuse drawn along the arm */
  ghost: { h: number; text: string } | null
  /** equal ticks on two sides */
  ticks: SideId[]
  /** the waves the unit circle draws as it turns: every whole degree it has passed through, 0 to 360 */
  graph: { fn: "sin" | "cos"; seen: boolean[]; seenCos: boolean[]; last: number | null } | null
  /** angles all the way round: 0° to 360°, the arc measured from the floor, the unit circle drawn */
  fullTurn: boolean
  /** many triangles in one angle: their hypotenuses, when they came, and when they flew out to sit on each other */
  family: { hs: number[]; since: number; stack: number | null; at: Vec; size: number } | null
  /** a faint outline of the triangle at this hypotenuse (where it started) */
  outline: number | null
  /** ten marks along the hypotenuse, counted from P (when they came) */
  marks: number | null
  /** the opposite swung down onto the hypotenuse about P (when it started) */
  door: number | null
  /** a calculator screen: what was typed and what it gives (KaTeX), fixed or worked out every frame */
  calcScreen: CalcLine[] | ((S: Scene) => CalcLine[]) | null
  /** the tangent at the floor, and the radius stretched out to meet it (when) */
  tanLine: { since: number; stretch: number | null } | null
  /** two angles whose points are at the same height */
  mirror: [number, number] | null
  /** one tenth of x, as a bar */
  tenth: { since: number; ten: number | null } | null

  eq: EqBoard
  eqFn: ((S: Scene) => ENode | null) | null
  /** the algebra under the equation, when a beat solves one */
  alg: Eqn | null
  /** the moves being made on it (solve.ts) */
  solve: Solve | null
  /** the beat's own logic, run every frame */
  tick: ((S: Scene) => void) | null
  /** a few words to pick from */
  choice: { options: string[]; answer: number; picked: number | null; state: "idle" | "wrong" | "right"; wrongAt: number; guess: boolean } | null
  /** the five steps, written over the board: when they came up */
  stepsCard: number | null

  cards: Card[]
  cardPick: { fn: Fn; state: "wrong" | "right"; at: number } | null
  onCard: ((S: Scene, fn: Fn) => void) | null
  /** SOH CAH TOA under the cards: when it came up */
  soh: number | null

  chips: Chip[]
  onChip: ((S: Scene, id: string, at: Vec) => void) | null
  /** pieces of the equation that can be tapped, and what a tap does */
  tapAtoms: string[]
  onAtom: ((S: Scene, id: string) => void) | null
  /** pieces that can be dragged onto another piece */
  dragAtoms: string[]
  onAtomDrop: ((S: Scene, id: string, onto: string | null) => void) | null

  tapSides: SideId[] | null
  onSide: ((S: Scene, side: SideId) => void) | null

  /** things to do later in this beat (scene time) */
  timers: { at: number; fn: (S: Scene) => void }[]

  vis: Record<VisKey, Spring>
  arcV: Spring
  arcP: Spring
  labs: Lab[]
  labD: Record<string, Vec>
  walkTex: string | null

  input: CalcInput | null
  drag: Drag | null
  touch: boolean
  moved: number
  turned: number
  slid: number
  releases: number
  /** the dragged value has met the beat's goal; letting go locks it */
  snapped: boolean
  locked: boolean
  magnet: { th?: number; h?: number; within: number } | null
  lockWhen: ((S: Scene) => boolean) | null
  releaseNote: ((S: Scene) => string | null) | null
  got: Set<string>
  touched: { kind: "side"; id: SideId } | { kind: "tri" } | { kind: "eq" } | null
  flashGood: number
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function createScene(): Scene {
  const vis = {} as Record<VisKey, Spring>
  for (const k of VIS_KEYS) vis[k] = { v: 0, t: 0 }
  const tri: Tri = { th: 35, h: 6.5, at: "V", drop: 0, pose: { phi: 0, s: 1, at: [0, 0] } }
  const c = hexRgb(CHALK)
  return {
    w: 0, h: 0, time: 0, beatStart: 0, mode: "none",
    frame: { x0: -1, y0: -1, x1: 10, y1: 10 }, frameFn: null, view: null, viewD: null,
    tri, triD: copyTri(tri), armR: 10, growArms: null, thMin: 12, thMax: 78, hMin: 2.5, hMax: 9.4, thExact: null,
    roleLabels: {}, roleColours: new Set(), sideColour: {}, sideColD: { VF: [...c], FP: [...c], VP: [...c] }, angText: null, letters: {},
    extra: null, regions: [], onRegion: null, regionLit: null,
    light: null, glow: new Set(), pulseArc: false, pulseRt: false, pulseLabs: new Set(), halves: null, ghost: null, ticks: [], graph: null, tenth: null,
    fullTurn: false, family: null, outline: null, marks: null, door: null, calcScreen: null, tanLine: null, mirror: null,
    eq: createBoard(), eqFn: null, alg: null, solve: null, tick: null, choice: null, stepsCard: null,
    cards: [], cardPick: null, onCard: null, soh: null,
    chips: [], onChip: null, tapAtoms: [], onAtom: null, dragAtoms: [], onAtomDrop: null,
    tapSides: null, onSide: null, timers: [],
    vis, arcV: { v: 0, t: 0 }, arcP: { v: 0, t: 0 }, labs: [], labD: {}, walkTex: null,
    input: null, drag: null, touch: false, moved: 0, turned: 0, slid: 0, releases: 0, snapped: false, locked: false,
    magnet: null, lockWhen: null, releaseNote: null, got: new Set(), touched: null, flashGood: 0, note: null,
  }
}

export const copyTri = (t: Tri): Tri => ({ ...t, pose: { ...t.pose, at: [t.pose.at[0], t.pose.at[1]] } })

// ── the triangle ─────────────────────────────────────────────────────────

/** A point of the flat frame, put where the pose says. */
export function poseMap(p: Pose, c: Vec): Vec {
  const a = p.phi * RAD
  const ax: Vec = [Math.cos(a), Math.sin(a)]
  const ay: Vec = [-Math.sin(a) * p.s, Math.cos(a) * p.s]
  return [p.at[0] + ax[0] * c[0] + ay[0] * c[1], p.at[1] + ax[1] * c[0] + ay[1] * c[1]]
}

/** Back from the board to the flat frame. */
export function poseUnmap(p: Pose, w: Vec): Vec {
  const a = p.phi * RAD
  const d = sub(w, p.at)
  const x = d[0] * Math.cos(a) + d[1] * Math.sin(a)
  const y = (-d[0] * Math.sin(a) + d[1] * Math.cos(a)) / (p.s || 1)
  return [x, y]
}

/** A corner in the flat frame. */
export function flatCorner(t: Tri, c: Corner): Vec {
  const th = t.th * RAD
  if (c === "V") return [0, 0]
  if (c === "F") return [t.h * Math.cos(th), 0]
  return [t.h * Math.cos(th), t.h * Math.sin(th)]
}

/** A corner (or an extra point of an exam figure) on the board, world units. */
export function cornerW(S: Scene, c: string, drawn = true): Vec {
  const t = drawn ? S.triD : S.tri
  if (c === "V" || c === "F" || c === "P") return poseMap(t.pose, flatCorner(t, c))
  const e = S.extra?.pts[c]
  return e ? poseMap(t.pose, e) : [0, 0]
}

export const cornerS = (S: Scene, c: string, drawn = true) => toScreen(S, cornerW(S, c, drawn), drawn)

/** The side playing a role, looking from `at`. */
export function sideOf(at: "V" | "P", role: Role): SideId {
  if (role === "H") return "VP"
  if (at === "V") return role === "O" ? "FP" : "VF"
  return role === "O" ? "VF" : "FP"
}

export function roleOf(at: "V" | "P", side: SideId): Role {
  if (side === "VP") return "H"
  if (at === "V") return side === "FP" ? "O" : "A"
  return side === "VF" ? "O" : "A"
}

/** A side's length (true sizes). */
export function sideLen(t: Tri, side: SideId): number {
  const th = t.th * RAD
  if (side === "VP") return t.h
  if (side === "VF") return t.h * Math.cos(th)
  return t.h * Math.sin(th)
}

/** The marked angle's size in degrees (at V it is θ; at P it is 90 − θ). */
export const markedAngle = (t: Tri) => (t.at === "V" ? t.th : 90 - t.th)

/** The angle as shown: whole degrees, or one place when it clicked onto a target that is not whole. */
export function thShown(S: Scene): number {
  const a = S.thExact ?? markedAngle(S.tri)
  return S.thExact !== null ? Math.round(a * 10) / 10 : Math.round(a)
}

export function thText(S: Scene): string {
  const a = thShown(S)
  return `${Number.isInteger(a) ? a : a.toFixed(1)}^\\circ`
}

/** A ratio worked out from the angle as shown, so it never disagrees with it. */
export function ratioOf(S: Scene, fn: Fn): number {
  const a = (S.thExact ?? thShown(S)) * RAD
  return fn === "sin" ? Math.sin(a) : fn === "cos" ? Math.cos(a) : Math.tan(a)
}

/**
 * A number for the board: never made to look whole when it is not (13.04,
 * not 13.0), otherwise to `d` places with trailing zeros dropped.
 */
export function numText(x: number, d = 2): string {
  // a millionth off a whole number is that number; the rule is about what the shown digits suggest
  if (Math.abs(x - Math.round(x)) < 1e-6) return String(Math.round(x))
  const trim = (t: string) => t.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
  for (let k = d; k <= 6; k++) {
    const t = trim(x.toFixed(k))
    if (t.includes(".")) return t
  }
  return String(Math.round(x))
}

export const ratioText = (x: number) => numText(x, 2)

/** The hypotenuse as shown (one place). The other sides follow from it, so the numbers agree. */
export const hShown = (S: Scene) => Number(numText(S.tri.h, 1))
export const hText = (S: Scene) => numText(S.tri.h, 1)
/** The opposite or adjacent as shown: the shown hypotenuse times the ratio of the shown angle. */
export function legText(S: Scene, role: "O" | "A"): string {
  const fn: Fn = role === "O" ? "sin" : "cos"
  return numText(hShown(S) * ratioOf(S, fn), 2)
}

// ── layout ───────────────────────────────────────────────────────────────

export interface Layout {
  compact: boolean
  phraseBottom: number
  board: Rect
  eqY: number
  eqSize: number
  cardsY: number
  cardSize: number
  chipsY: number
  keypadTop: number
  lineY: number
  lineSize: number
  labelSize: number
}

const on = (S: Scene, k: VisKey) => S.vis[k].t > 0.5

export function layout(S: Scene): Layout {
  const { w, h } = S
  const compact = h < 700 || w < 560
  const phraseBottom = compact ? 112 : 136
  const eqSize = compact ? (w < 400 ? 22 : 24) : 30
  const cardSize = compact ? 17 : 21
  const lineSize = compact ? 20 : 24
  let y = h - (compact ? 80 : 94)
  let keypadTop = y
  if (on(S, "keypad")) { y -= 3 * 46 + 2 * 8 + 14; keypadTop = y }
  let lineY = y
  if (S.walkTex) { lineY = y - lineSize * 0.9; y -= lineSize * 2.2 }
  let chipsY = y
  if (on(S, "chips")) { chipsY = y - 26; y -= 62 }
  let cardsY = y
  if (on(S, "cards")) {
    const ch = cardSize * 3.3
    cardsY = y - ch / 2 - 4
    y -= ch + 14
    if (S.soh !== null) { cardsY -= cardSize * 1.6; y -= cardSize * 1.6 }
  }
  let eqY = y
  if (on(S, "eq")) { const band = eqSize * 3.5; eqY = y - band / 2; y -= band }
  const side = compact ? 16 : 28
  const board: Rect = { x0: side, x1: w - side, y0: phraseBottom + 14, y1: Math.max(phraseBottom + 150, y - 8) }
  return { compact, phraseBottom, board, eqY, eqSize, cardsY, cardSize, chipsY, keypadTop, lineY, lineSize, labelSize: compact ? 16 : 20 }
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

/** Room for the arms swinging from 0° to 90°, in the flat frame. */
export function armsFrame(S: Scene): Rect {
  const R = S.armR
  return { x0: -0.1 * R, x1: 1.04 * R, y0: -0.1 * R, y1: 1.02 * R }
}

/** Room for the posed triangle (and any extra lines), with space for labels. */
export function triFrame(S: Scene): Rect {
  const names = ["V", "F", "P", ...Object.keys(S.extra?.pts ?? {})]
  const ps = names.map(n => cornerW(S, n, false))
  const xs = ps.map(p => p[0]), ys = ps.map(p => p[1])
  const size = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 1)
  const m = size * 0.12
  return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, y0: Math.min(...ys) - m, y1: Math.max(...ys) + m }
}

/** The unit circle, its quarter, and the graph to its right. */
/**
 * Where the waves sit: beside the unit circle on a wide screen, under it on
 * a tall one. `x0` is where 0° is, `w` the width for 360°, `y0` the wave's
 * floor; one unit of height is one unit, the same as the circle's radius.
 */
export function graphGeom(S: Scene): { x0: number; w: number; y0: number; below: boolean } {
  return S.h > S.w * 1.2 ? { x0: -1.2, w: 2.4, y0: -2.6, below: true } : { x0: 1.5, w: 3.0, y0: 0, below: false }
}
export function graphFrame(S: Scene): Rect {
  const g = graphGeom(S)
  return g.below
    ? { x0: -1.35, x1: 1.35, y0: g.y0 - 1.3, y1: 1.3 }
    : { x0: -1.3, x1: g.x0 + g.w + 0.3, y0: -1.3, y1: 1.3 }
}
/** The unit circle alone, with room round it. */
export const circleFrame = (): Rect => ({ x0: -1.35, x1: 1.35, y0: -1.3, y1: 1.3 })

function fitView(S: Scene, L: Layout): View {
  const f = S.frame
  // room for labels round the figure, less when the board is short
  const pad = Math.min(L.compact ? 30 : 44, (L.board.y1 - L.board.y0) * 0.12)
  const bw = L.board.x1 - L.board.x0 - 2 * pad, bh = L.board.y1 - L.board.y0 - 2 * pad
  const fw = Math.max(0.05, f.x1 - f.x0), fh = Math.max(0.05, f.y1 - f.y0)
  const u = Math.max(0.05, Math.min(bw / fw, bh / fh, 420))
  return { cx: (L.board.x0 + L.board.x1) / 2, cy: (L.board.y0 + L.board.y1) / 2, wx: (f.x0 + f.x1) / 2, wy: (f.y0 + f.y1) / 2, u }
}

// ── cards and chips: where they sit (Stage draws them, the pointer finds them) ──

export const CARD_TEX: Record<Fn, string> = {
  sin: `\\sin\\theta = \\dfrac{\\textcolor{${ORANGE}}{O}}{\\textcolor{${GREEN}}{H}}`,
  cos: `\\cos\\theta = \\dfrac{\\textcolor{${BLUE}}{A}}{\\textcolor{${GREEN}}{H}}`,
  tan: `\\tan\\theta = \\dfrac{\\textcolor{${ORANGE}}{O}}{\\textcolor{${BLUE}}{A}}`,
}

export function cardRects(S: Scene, L: Layout): { fn: Fn; r: Rect; size: number }[] {
  if (!S.cards.length) return []
  let size = L.cardSize
  const pad = size * 0.8, gap = L.compact ? 10 : 16
  const widths = () => S.cards.map(c => measure(CARD_TEX[c.fn], size).w + 2 * pad)
  let ws = widths()
  const total = () => ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)
  while (total() > S.w - 24 && size > 12) { size -= 1; ws = widths() }
  const hgt = size * 3.1
  let x = S.w / 2 - total() / 2
  return S.cards.map((c, i) => {
    const r = { x0: x, x1: x + ws[i], y0: L.cardsY - hgt / 2, y1: L.cardsY + hgt / 2 }
    x += ws[i] + gap
    return { fn: c.fn, r, size }
  })
}

export function chipRects(S: Scene, L: Layout): { id: string; r: Rect }[] {
  if (!S.chips.length) return []
  const size = L.eqSize * 0.9
  const gap = 18
  const ws = S.chips.map(c => measure(c.tex, size).w + size * 1.3)
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1)
  let x = S.w / 2 - total / 2
  const hgt = size * 1.9
  return S.chips.map((c, i) => {
    const r = { x0: x, x1: x + ws[i], y0: L.chipsY - hgt / 2, y1: L.chipsY + hgt / 2 }
    x += ws[i] + gap
    return { id: c.id, r }
  })
}

const inRect = (p: Vec, r: Rect, pad = 0) => p[0] >= r.x0 - pad && p[0] <= r.x1 + pad && p[1] >= r.y0 - pad && p[1] <= r.y1 + pad

// ── labels ───────────────────────────────────────────────────────────────

/** The middle of the triangle on screen. */
function triMiddle(S: Scene): Vec {
  const a = cornerS(S, "V"), b = cornerS(S, "F"), c = cornerS(S, "P")
  return [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3]
}

/** Where a side's label goes: just outside the triangle, by its middle. */
export function sideLabelAt(S: Scene, side: SideId, size: number, text = "x"): Vec {
  const a = cornerS(S, side[0]), b = cornerS(S, side.slice(1))
  const m = lerpV(a, b, 0.5)
  const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (dot(n, sub(triMiddle(S), m)) > 0) n = mul(n, -1)
  // wide labels need more room when the side is upright
  const wide = Math.max(1, text.length * 0.42)
  const off = size * (0.75 + 0.35 * Math.abs(n[0]) * (wide - 1)) + 6
  return add(m, mul(n, off))
}

/** Where the marked angle's label goes: inside its arc, along the bisector. */
export function angleLabelAt(S: Scene, size: number): Vec {
  if (S.fullTurn) {
    // measured from the floor, however far round it has gone
    const c = cornerS(S, "V"), h = S.triD.th * RAD / 2
    return add(c, [Math.cos(h) * size * 2.6, -Math.sin(h) * size * 2.6])
  }
  const at = S.triD.at
  const c = cornerS(S, at)
  const p = cornerS(S, at === "V" ? "F" : "V"), q = cornerS(S, at === "V" ? "P" : "F")
  const a1 = Math.atan2(p[1] - c[1], p[0] - c[0]), a2 = Math.atan2(q[1] - c[1], q[0] - c[0])
  const half = Math.abs(turn(a1, a2)) / 2
  const bis = a1 + turn(a1, a2) / 2
  const r = clamp(size * 0.95 / Math.max(0.2, Math.sin(half)), size * 1.9, size * 4.4)
  return add(c, mul([Math.cos(bis), Math.sin(bis)], r))
}

function computeLabels(S: Scene, L: Layout): Lab[] {
  const out: Lab[] = []
  const size = L.labelSize
  const lv = S.vis.labels.v
  const made = S.triD.drop > 0.97
  if (lv > 0.01 && made) {
    for (const role of ["O", "A", "H"] as Role[]) {
      const fn = S.roleLabels[role]
      const l = fn?.(S)
      if (!l) continue
      const side = sideOf(S.tri.at, role)
      out.push({ key: `role-${role}`, tex: l.tex, col: l.col ?? ROLE_COL[role], at: sideLabelAt(S, side, size, l.tex), size: size + 2, op: lv, pulse: l.pulse || S.pulseLabs.has(role) })
    }
  }
  if (S.angText && S.vis.arc.v > 0.01) {
    out.push({ key: "ang", tex: S.angText(S), col: CHALK, at: angleLabelAt(S, size), size, op: S.vis.arc.v, pulse: S.pulseArc })
  }
  if (S.extra?.labels && S.vis.extra.v > 0.01) {
    const mid = triMiddle(S)
    for (const e of S.extra.labels) {
      const a = cornerS(S, e.a), b = cornerS(S, e.b)
      const m = lerpV(a, b, 0.5)
      const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
      let n: Vec = [-d[1] / l, d[0] / l]
      if (dot(n, sub(mid, m)) > 0) n = mul(n, -1)
      out.push({ key: `X-${e.a}${e.b}`, tex: e.tex, col: CHALK, at: add(m, mul(n, size * 0.8 + 6)), size, op: S.vis.extra.v })
    }
  }
  const lt = S.vis.letters.v
  if (lt > 0.01) {
    const mid = triMiddle(S)
    for (const [n, letter] of Object.entries(S.letters)) {
      if (!letter) continue
      const p = cornerS(S, n)
      const d = sub(p, mid), l = Math.hypot(d[0], d[1]) || 1
      out.push({ key: `L-${n}`, tex: letter, col: CHALK, at: add(p, mul(d, (size * 0.95 + 4) / l)), size: size + 1, op: lt })
    }
  }
  return out
}

// ── animation ────────────────────────────────────────────────────────────

function hexRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export const rgbCss = (c: [number, number, number]) => `rgb(${c.map(x => Math.round(x)).join(",")})`

/** The colour a side should be now. */
export function sideTarget(S: Scene, side: SideId): string {
  const o = S.sideColour[side]
  if (o) return o
  const r = roleOf(S.tri.at, side)
  return S.roleColours.has(r) ? ROLE_COL[r] : CHALK
}

export function step(S: Scene, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  for (const key of VIS_KEYS) {
    const s = S.vis[key]
    s.v += (s.t - s.v) * k(0.12)
    if (Math.abs(s.t - s.v) < 0.002) s.v = s.t
  }
  for (const s of [S.arcV, S.arcP]) s.v += (s.t - s.v) * k(0.14)
  S.arcV.t = S.tri.at === "V" ? 1 : 0
  S.arcP.t = S.tri.at === "P" ? 1 : 0

  // the triangle eases to where it is; quickly under a finger
  const ft = k(S.drag ? 0.5 : 0.14)
  const T = S.tri, D = S.triD
  D.th += (T.th - D.th) * ft
  D.h += (T.h - D.h) * ft
  D.drop += (T.drop - D.drop) * k(T.drop > D.drop ? 0.2 : 0.1)
  if (Math.abs(T.drop - D.drop) < 0.002) D.drop = T.drop
  D.at = T.at
  const fp = k(0.1)
  D.pose.phi += turn(D.pose.phi * RAD, T.pose.phi * RAD) * DEG * fp
  D.pose.s += (T.pose.s - D.pose.s) * fp
  D.pose.at = lerpV(D.pose.at, T.pose.at, fp)

  for (const side of SIDES) {
    const t = hexRgb(sideTarget(S, side)), c = S.sideColD[side]
    for (let i = 0; i < 3; i++) c[i] += (t[i] - c[i]) * k(0.12)
  }

  const L = layout(S)
  if (S.frameFn && !S.drag) S.frame = S.frameFn(S)
  if (!S.drag || !S.view) S.view = fitView(S, L)
  if (!S.viewD) S.viewD = { ...S.view }
  const f = k(0.1)
  const V = S.view, W = S.viewD
  S.viewD = { cx: W.cx + (V.cx - W.cx) * f, cy: W.cy + (V.cy - W.cy) * f, wx: W.wx + (V.wx - W.wx) * f, wy: W.wy + (V.wy - W.wy) * f, u: W.u + (V.u - W.u) * f }

  // the equation board: as big as fits across the screen
  const node = S.eqFn ? S.eqFn(S) : null
  let size = L.eqSize
  if (node) while (size > 14 && extent(node, size).w > S.w - 32) size -= 1
  S.eq.size = size
  S.eq.cx = S.w / 2
  S.eq.cy = L.eqY
  eqSet(S.eq, node, S.eq.goneTo)
  eqStep(S.eq, dt)
  S.tick?.(S)

  // labels glide to where they belong
  S.labs = computeLabels(S, L)
  const fl = k(S.drag ? 0.6 : 0.16)
  const keep = new Set<string>()
  for (const l of S.labs) {
    keep.add(l.key)
    const d = S.labD[l.key]
    S.labD[l.key] = d ? lerpV(d, l.at, fl) : [l.at[0], l.at[1]]
  }
  for (const key of Object.keys(S.labD)) if (!keep.has(key)) delete S.labD[key]

  // the graph remembers every degree the arm has passed through
  if (S.graph) {
    const now = Math.round(S.tri.th)
    const from = S.graph.last ?? now
    for (let d = Math.min(from, now); d <= Math.max(from, now); d++) {
      if (d < 0 || d > 360) continue
      if (S.graph.fn === "sin") S.graph.seen[d] = true
      else S.graph.seenCos[d] = true
    }
    S.graph.last = now
  }

  // things the beat asked to happen later
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
  for (const k of VIS_KEYS) S.vis[k].t = keys.includes(k) ? 1 : 0
}

export function later(S: Scene, seconds: number, fn: (S: Scene) => void) {
  S.timers.push({ at: S.time + seconds, fn })
}

export function resetBeat(S: Scene) {
  S.mode = "none"
  S.drag = null
  S.moved = 0
  S.turned = 0
  S.slid = 0
  S.releases = 0
  S.snapped = false
  S.locked = false
  S.magnet = null
  S.lockWhen = null
  S.releaseNote = null
  S.frameFn = null
  S.thExact = null
  S.growArms = null
  S.roleLabels = {}
  S.roleColours = new Set()
  S.sideColour = {}
  S.angText = null
  S.letters = {}
  S.extra = null
  S.regions = []
  S.onRegion = null
  S.regionLit = null
  S.light = null
  S.glow = new Set()
  S.pulseArc = false
  S.pulseRt = false
  S.pulseLabs = new Set()
  S.halves = null
  S.ghost = null
  S.ticks = []
  S.graph = null
  S.tenth = null
  S.fullTurn = false
  S.family = null
  S.outline = null
  S.marks = null
  S.door = null
  S.calcScreen = null
  S.tanLine = null
  S.mirror = null
  S.eqFn = null
  S.alg = null
  S.solve = null
  S.tick = null
  S.choice = null
  S.stepsCard = null
  S.eq.goneTo = {}
  S.eq.goneFade = {}
  S.eq.tilt.t = 0
  S.eq.stand.t = 0
  S.cards = []
  S.cardPick = null
  S.onCard = null
  S.soh = null
  S.chips = []
  S.onChip = null
  S.tapAtoms = []
  S.onAtom = null
  S.dragAtoms = []
  S.onAtomDrop = null
  S.tapSides = null
  S.onSide = null
  S.timers = []
  S.pulseRt = false
  S.walkTex = null
  S.input = null
  S.got = new Set()
  S.touched = null
  S.note = null
}

export function say(S: Scene, text: string, tone: "wrong" | "calm" = "wrong", seconds = 2.8) {
  S.note = { text, until: S.time + seconds, tone }
}

export function startInput(S: Scene, spec: Omit<CalcInput, "value" | "tries" | "state" | "wrongAt" | "hints">) {
  S.input = { ...spec, value: "", tries: 0, state: "idle", wrongAt: -9, hints: [] }
}

/** The answer box, for an equation's tail. */
export function boxNode(S: Scene): ENode {
  const inp = S.input
  return { k: "box", id: "box", tex: inp ? calcTex(inp.value) : "", state: inp?.state ?? "idle", wrongAt: inp?.wrongAt ?? -9 }
}

/** Set the triangle at once (no glide), e.g. when a beat opens cold onto it. */
export function snapTri(S: Scene) {
  S.triD = copyTri(S.tri)
}

/** A label's place on screen right now (for things that fly from it). */
export const labAt = (S: Scene, key: string): Vec | undefined => S.labD[key] ? [S.labD[key][0], S.labD[key][1]] : undefined

// ── input ────────────────────────────────────────────────────────────────

const tol = (S: Scene) => (S.touch ? 40 : 28)

export function distToSeg(p: Vec, a: Vec, b: Vec) {
  const ab = sub(b, a)
  const t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1)
  return dist(p, add(a, mul(ab, t)))
}

function inPoly(p: Vec, P: Vec[]) {
  let inside = false
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    if ((P[i][1] > p[1]) !== (P[j][1] > p[1]) && p[0] < ((P[j][0] - P[i][0]) * (p[1] - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) inside = !inside
  }
  return inside
}

/** The turning handle: the top arm's far end. */
export function turnHandle(S: Scene): Vec {
  const t = S.triD
  return toScreen(S, poseMap(t.pose, [S.armR * Math.cos(t.th * RAD), S.armR * Math.sin(t.th * RAD)]))
}

export const slideHandle = (S: Scene): Vec => cornerS(S, "P")

export function pointerDown(S: Scene, p: Vec, touch: boolean): boolean {
  S.touch = touch
  const L = layout(S)
  if (S.mode === "turn" || S.mode === "slide" || S.mode === "turnSlide" || S.mode === "drop") {
    if (S.locked) return false
    const reach = tol(S) + 10
    if (S.mode === "drop" && dist(p, slideHandle(S)) < reach) { S.drag = { kind: "drop" }; S.touched = { kind: "tri" }; return true }
    // both handles in reach (a small screen, a long triangle): the nearer one
    const ds = S.mode === "slide" || S.mode === "turnSlide" ? dist(p, slideHandle(S)) : Infinity
    const dt = S.mode === "turn" || S.mode === "turnSlide" ? dist(p, turnHandle(S)) : Infinity
    if (Math.min(ds, dt) < reach) { S.drag = { kind: ds <= dt ? "slide" : "turn" }; S.touched = { kind: "tri" }; return true }
    // grabbing the arm anywhere along it turns it too
    if (S.mode === "turn" || S.mode === "turnSlide") {
      const v = cornerS(S, "V"), e = turnHandle(S)
      if (distToSeg(p, v, e) < tol(S) && dist(p, v) > 50) { S.drag = { kind: "turn" }; S.touched = { kind: "tri" }; return true }
    }
    return false
  }
  if (S.mode === "tapSide") {
    let best: SideId | null = null, bd = Infinity
    for (const s of S.tapSides ?? SIDES) {
      const d = distToSeg(p, cornerS(S, s[0]), cornerS(S, s.slice(1)))
      if (d < bd) { bd = d; best = s }
    }
    if (best && bd < tol(S)) S.onSide?.(S, best)
    return false
  }
  if (S.mode === "tapCard") {
    for (const c of cardRects(S, L)) if (inRect(p, c.r, 6)) { S.onCard?.(S, c.fn); return false }
    return false
  }
  if (S.mode === "tapRegion") {
    for (const r of S.regions) if (inPoly(p, r.pts.map(n => cornerS(S, n)))) { S.onRegion?.(S, r.id); return false }
    return false
  }
  if (S.mode === "solve") {
    for (const c of chipRects(S, L)) if (inRect(p, c.r, 8)) { S.drag = { kind: "chip", id: c.id, p }; return true }
    if (S.dragAtoms.length) {
      const id = eqHit(S.eq, p, S.dragAtoms)
      if (id) { S.drag = { kind: "atom", id, p, start: p }; return true }
    }
    if (S.tapAtoms.length) {
      const id = eqHit(S.eq, p, S.tapAtoms)
      if (id) S.onAtom?.(S, id)
    }
    return false
  }
  return false
}

export function pointerMove(S: Scene, p: Vec) {
  const d = S.drag
  if (!d) return
  if (d.kind === "chip" || d.kind === "atom") { S.moved += dist(p, d.p); d.p = p; return }
  const w = poseUnmap(S.tri.pose, toWorld(S, p))
  const T = S.tri
  if (d.kind === "turn") {
    let raw = Math.atan2(w[1], w[0]) * DEG
    if (S.fullTurn) {
      // 0° to 360°, following the finger round past 180° without jumping
      if (raw < 0) raw += 360
      while (raw - T.th > 180) raw -= 360
      while (raw - T.th < -180) raw += 360
    }
    let th = clamp(raw, S.thMin, S.thMax)
    S.thExact = null
    S.snapped = false
    if (S.magnet?.th !== undefined && Math.abs(th - S.magnet.th) < S.magnet.within) { th = S.magnet.th; S.snapped = true; if (!Number.isInteger(th)) S.thExact = th }
    S.turned += Math.abs(th - T.th)
    S.moved += Math.abs(th - T.th) * RAD * T.h * (S.viewD?.u ?? 30)
    T.th = th
  } else if (d.kind === "slide") {
    const u: Vec = [Math.cos(T.th * RAD), Math.sin(T.th * RAD)]
    let h = clamp(dot(w, u), S.hMin, S.hMax)
    S.snapped = false
    if (S.magnet?.h !== undefined && Math.abs(h - S.magnet.h) < S.magnet.within) { h = S.magnet.h; S.snapped = true }
    S.slid += Math.abs(h - T.h)
    S.moved += Math.abs(h - T.h) * (S.viewD?.u ?? 30)
    T.h = h
  } else if (d.kind === "drop") {
    const top = T.h * Math.sin(T.th * RAD)
    const t = clamp((top - w[1]) / Math.max(0.01, top), 0, 1)
    T.drop = t > 0.9 ? 1 : t
    S.triD.drop = T.drop
  }
  if (S.lockWhen) S.snapped = S.lockWhen(S)
}

export function pointerUp(S: Scene) {
  const d = S.drag
  if (!d) return
  S.drag = null
  S.releases++
  if (d.kind === "chip") {
    const L = layout(S)
    // dropped anywhere above the chips: onto the equation
    if (d.p[1] < L.chipsY - 26) S.onChip?.(S, d.id, d.p)
    return
  }
  if (d.kind === "atom") {
    const onto = eqHit(S.eq, d.p, undefined, 6)
    S.onAtomDrop?.(S, d.id, onto && onto !== d.id ? onto : null)
    return
  }
  if (d.kind === "drop") {
    if (S.tri.drop < 1) { S.tri.drop = 0; say(S, "Pull it all the way down to the floor.", "calm", 3) }
    return
  }
  if (S.snapped && (S.magnet || S.lockWhen)) { S.locked = true; S.flashGood = 1; S.note = null; return }
  const n = S.releaseNote?.(S)
  if (n) say(S, n, "calm", 3.2)
}

/** Where a dragged chip or piece is drawn right now. */
export function dragAt(S: Scene): Vec | null {
  const d = S.drag
  return d && (d.kind === "chip" || d.kind === "atom") ? d.p : null
}

export { eqCentre }

// ── typed answers: the calculator ────────────────────────────────────────

export function typeKey(S: Scene, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "go") { check(S); return }
  if ((inp.state === "wrong" || inp.fresh) && key !== "back") inp.value = ""
  inp.fresh = false
  inp.value = calcType(inp.value, key)
  inp.state = "idle"
}

function check(S: Scene) {
  const inp = S.input!
  if (!inp.value) return
  const { verdict, v } = judge(inp.value, inp.answer, { sf: inp.sf, dp: inp.dp })
  if (verdict === "unfinished") { say(S, "That calculation is not finished.", "calm", 2.6); return }
  if (verdict === "rough") {
    inp.fresh = true
    say(S, inp.sf ? `Nearly. Give it to $${inp.sf}$ significant figures.` : `Nearly. Give it to $${inp.dp ?? 1}$ decimal place.`, "calm", 3.4)
    return
  }
  if (verdict === "right") {
    inp.state = "right"
    S.note = null
    S.touched = { kind: "eq" }
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  const slip = v !== null ? inp.slips?.find(s => Math.abs(s.v - v) <= Math.max(0.006, Math.abs(s.v) * 0.002)) : undefined
  if (slip) say(S, slip.say, "wrong", 4.5)
  inp.help?.(S, inp.tries)
}

export { dist, lerpV, clamp, turn, DEG, RAD, add, sub, mul }
