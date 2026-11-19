/**
 * Naming shapes (4.1, lesson 1 of 2), one tiny idea per beat.
 *
 * Lines: the student turns one line until it never meets another (parallel),
 * then until they meet at a right angle (perpendicular), and slides a line
 * to cut AB in half (the perpendicular bisector). Triangles: dragged until
 * they click into equilateral, isosceles and right-angled; scalene. On a
 * grid, a quadrilateral's corners click onto points, its marks show equal
 * sides, parallel sides and right angles, and the student makes each
 * special one. Polygons by their sides, regular and irregular. Circles: the
 * student draws a radius, a diameter and a chord, taps a segment and the
 * major arc, sees a sector, and slides a line until it is a tangent.
 * Questions from 4024/11/M/J/20 Q18(a), 4024/12/M/J/20 Q2(b) and
 * 4024/12/M/J/23 Q2.
 *
 * Colours: what can be dragged or tapped is yellow, equal-side ticks yellow,
 * a tapped part blue, a right answer green.
 */

import type { BeatOf } from "../beat"
import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { atom } from "../equation"
import {
  type Scene, type VisKey, type Tap, BLUE, ORANGE, GREEN, CHALK,
  P, PD, place, resetBeat, show, later, say, choose, onCircle, angleOn, onArc, ptS, toScreen, unitPx,
  quadName, triName, simpleShape, numText, distToSeg, inPoly,
  add, sub, mul, dot, cross, dist, lerpV, unit, len, RAD, DEG,
} from "./scene"

type Beat = BeatOf<Scene>

const LOOK: VisKey[] = ["board", "grid", "shapes", "letters", "marks", "labels"]
const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
const watch = (id: string, say0: string, enter: (S: Scene) => void, after = 2.0): Beat => ({ id, say: say0, enter, cta: "", ctaAfter: after })
const dirOf = (deg: number): Vec => [Math.cos(deg * RAD), Math.sin(deg * RAD)]
const tall = (S: Scene) => S.h > S.w * 1.25

/** A dashed example after a while, for a student who is stuck making a shape. */
function hintAfter(S: Scene, seconds: number, pts: Vec[], text = "Try one like this.") {
  later(S, seconds, S2 => {
    if (S2.got.has("done")) return
    place(S2, Object.fromEntries(pts.map((p, i) => [`hint${i}`, p])))
    S2.polys.push({ id: "hint", pts: pts.map((_, i) => `hint${i}`), ghost: true })
    say(S2, text, "calm", 600)
  })
}

/** Pick one of a few words; wrong picks get their own notes. */
function pickBeat(id: string, text: string, board: (S: Scene) => void, o: { options: string[]; answer: number; notes: Record<number, string>; right: string; onPick?: (S: Scene, k: number) => void }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      choose(S, o.options, o.answer, (S2, k, right) => {
        o.onPick?.(S2, k)
        if (right) { S2.got.add("done"); say(S2, o.right, "calm", 600); return }
        say(S2, o.notes[k] ?? "Look again.", "wrong", 4.5)
      })
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2200,
  }
}

/** Tap one of the board's tap targets; the others get their notes. */
function tapBeat(id: string, text: string, board: (S: Scene) => void, o: { want: string; notes: Record<string, string>; wrong: string; then?: (S: Scene) => void }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.onTap = (S2, key) => {
        if (S2.got.has("done")) return
        if (key === o.want) { S2.got.add("done"); S2.note = null; S2.flashGood = 1; o.then?.(S2); return }
        say(S2, o.notes[key] ?? o.wrong, "wrong", 4)
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1700,
  }
}

/** Tap targets for shapes: inside one, or near its sides. */
const polyTaps = (S: Scene, ids: string[]): Tap[] => ids.map(id => ({
  id,
  hit: (S2, p) => {
    const pl = S2.polys.find(x => x.id === id)!
    const Q = pl.pts.map(n => ptS(S2, n))
    if (inPoly(p, Q)) return 0
    return Math.min(...Q.map((a, i) => distToSeg(p, a, Q[(i + 1) % Q.length])))
  },
  spot: S2 => { const pl = S2.polys.find(x => x.id === id)!; const Q = pl.pts.map(n => ptS(S2, n)); return [Q.reduce((s, q) => s + q[0], 0) / Q.length, Q.reduce((s, q) => s + q[1], 0) / Q.length] },
}))

// ── 1. Parallel and perpendicular lines ──────────────────────────────────

const PIV: Vec = [0, 1.2]
const ARM = 3.2
const LOW = -1.5

/** The turning line's direction now, in degrees (0 to 360, from its first end to its second). */
function lineDeg(S: Scene): number {
  if (!S.pts.L1) return 35
  const d = sub(P(S, "L2"), P(S, "L1"))
  return ((Math.atan2(d[1], d[0]) * DEG) % 360 + 360) % 360
}

/** Two lines: one along the bottom, one through a point that can be turned. */
function linesBoard(S: Scene, deg: number, o: { turn?: number[]; arrows?: boolean; square?: boolean; cross?: boolean } = {}) {
  resetBeat(S)
  const d = dirOf(deg)
  place(S, { A1: [-7, LOW], B1: [7, LOW], M: PIV, L1: sub(PIV, mul(d, ARM)), L2: add(PIV, mul(d, ARM)), X: [0, LOW] })
  S.frame = { x0: -6, y0: -4, x1: 6, y1: 4 }
  S.segs = [
    { id: "l1", a: "A1", b: "B1", ext: true, arrows: o.arrows ? 1 : 0 },
    { id: "l2", a: "L1", b: "L2", ext: true, arrows: o.arrows ? 1 : 0 },
  ]
  if (o.turn) S.handles = [{ id: "turn", kind: "turn", pivot: "M", pts: ["L1", "L2"], grab: "L2", snaps: o.turn, lock: true }]
  // where the two lines cross (none when they run side by side)
  S.tick = S2 => {
    const a = PD(S2, "L1"), b = PD(S2, "L2"), v = sub(b, a)
    const X = S2.pts.X
    if (Math.abs(v[1]) < 1e-4) { S2.dots = []; S2.squares = []; return }
    const t = (LOW - a[1]) / v[1]
    const x = add(a, mul(v, t))
    X.p = x; X.D = x
    const inView = Math.abs(x[0]) < 5.6
    S2.dots = o.cross && inView ? [{ pt: "X", col: BLUE, r: 5, pulse: true }] : []
    const up = PD(S2, "L2")[1] > PD(S2, "L1")[1] ? "L2" : "L1"
    const right = Math.abs(((lineDeg(S2) % 180) + 180) % 180 - 90) < 0.5
    S2.squares = (o.square || (S2.locked.has("turn") && o.turn?.includes(90))) && right ? [{ at: "X", a: "B1", b: up }] : []
  }
}

/** AB, and a line at right angles to it that slides along it. */
const BIS_X0 = -1.8
function bisBoard(S: Scene, x: number, o: { slide?: boolean; ticks?: boolean; glow?: boolean } = {}) {
  resetBeat(S)
  place(S, { A: [-3, -1], B: [3, -1], X: [x, -1], V1: [x, -4.6], V2: [x, 3.2] })
  S.frame = { x0: -4.6, y0: -3.6, x1: 4.6, y1: 3.4 }
  S.names = { A: "A", B: "B" }
  S.nameFrom = { A: "B", B: "A" }
  S.segs = [
    { id: "ax", a: "A", b: "X", ticks: o.ticks ? 1 : 0, w: 3 },
    { id: "xb", a: "X", b: "B", ticks: o.ticks ? 1 : 0, w: 3 },
    { id: "v", a: "V1", b: "V2", ext: true, glow: o.glow },
  ]
  S.squares = [{ at: "X", a: "B", b: "V2" }]
  S.dots = [{ pt: "A" }, { pt: "B" }]
  if (o.slide) S.handles = [{ id: "slide", kind: "slide", pts: ["V1", "V2", "X"], grab: "V2", dir: [1, 0], min: -2.6 - x, max: 2.6 - x, snaps: [-x], lock: true }]
  // the two parts of AB, measured as the line slides
  S.tick = S2 => {
    const A = PD(S2, "A"), X = PD(S2, "X"), B = PD(S2, "B")
    const half = S2.locked.has("slide") || o.ticks
    S2.segs = S2.segs.map(sg => (sg.id === "ax" || sg.id === "xb" ? { ...sg, ticks: half ? 1 : 0 } : sg))
    S2.freeLabs = [
      { key: "ax", at: lerpV(A, X, 0.5), tex: numText(dist(A, X)), dy: 22 },
      { key: "xb", at: lerpV(X, B, 0.5), tex: numText(dist(X, B)), dy: 22 },
    ]
  }
}

/** The line as the last task left it: parallel (or perpendicular) if it is, else set so. */
const parDeg = (S: Scene) => { const d = lineDeg(S); return Math.abs(Math.sin(d * RAD)) < 0.01 ? d : 0 }
const perpDeg = (S: Scene) => { const d = lineDeg(S); return Math.abs(Math.cos(d * RAD)) < 0.01 ? d : 90 }

const PART_1: Beat[] = [
  watch("lines", "These two lines cross here.", S => { linesBoard(S, lineDeg(S), { cross: true }); look(S) }, 2.2),
  {
    id: "par-turn",
    say: "Turn this line until the two lines never meet.",
    enter: S => { linesBoard(S, lineDeg(S), { turn: [0, 180], cross: true }); look(S) },
    done: S => S.locked.has("turn") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("par", "Lines that never meet are *parallel*.", S => { linesBoard(S, parDeg(S), { arrows: true }); look(S) }, 2.4),
  watch("par-arrows", "The arrows on them show they are parallel.", S => { linesBoard(S, parDeg(S), { arrows: true }); look(S) }, 2.4),
  {
    id: "perp-turn",
    say: "Now turn it so the lines meet at a right angle.",
    enter: S => { linesBoard(S, parDeg(S), { turn: [90, 270], cross: true }); look(S) },
    done: S => S.locked.has("turn") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("perp", "Lines that meet at a right angle are *perpendicular*.", S => { linesBoard(S, perpDeg(S), { square: true }); look(S) }, 2.6),
  watch("bis-ab", "Here is a line from $A$ to $B$.", S => { bisBoard(S, BIS_X0); S.segs = S.segs.filter(sg => sg.id !== "v"); S.squares = []; S.tick = null; look(S) }, 2.0),
  {
    id: "bis-slide",
    say: "Slide this line so it cuts $AB$ in half.",
    enter: S => { bisBoard(S, BIS_X0, { slide: true }); look(S) },
    done: S => S.locked.has("slide") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("bis-half", "It cuts $AB$ in half, at a right angle.", S => { bisBoard(S, 0, { ticks: true }); look(S) }, 2.4),
  watch("bis", "It is the *perpendicular bisector* of $AB$.", S => { bisBoard(S, 0, { ticks: true, glow: true }); look(S) }, 2.6),
]

// ── 2. Triangles ─────────────────────────────────────────────────────────

const TRI0: Record<string, Vec> = { TA: [0, 0], TB: [7, 0], TC: [2.2, 4.5] }
const TRI_NAMES = ["TA", "TB", "TC"]
type TriSnap = "equi" | "iso" | "right"

const angleAtV = (p: Vec, a: Vec, b: Vec) => Math.acos(Math.max(-1, Math.min(1, dot(unit(sub(a, p)), unit(sub(b, p)))))) * DEG
const projLine = (q: Vec, a: Vec, d: Vec): Vec => { const u = unit(d); return add(a, mul(u, dot(sub(q, a), u))) }

/** Where a dragged corner clicks to, for a task: an equilateral, isosceles or right-angled triangle. */
function triSnap(S: Scene, n: string, q: Vec, kind: TriSnap): Vec | null {
  const [j, k] = TRI_NAMES.filter(x => x !== n).map(x => P(S, x))
  const base = sub(k, j), bl = len(base), m = lerpV(j, k, 0.5), nn = unit([-base[1], base[0]])
  if (kind === "equi") {
    const h = (bl * Math.sqrt(3)) / 2
    const c = [add(m, mul(nn, h)), sub(m, mul(nn, h))].sort((a, b) => dist(a, q) - dist(b, q))[0]
    return dist(c, q) < 0.14 * bl ? c : null
  }
  if (kind === "iso") {
    const cands: { e: number; p: Vec }[] = []
    const a = dist(q, j), b = dist(q, k)
    cands.push({ e: Math.abs(a - b) / Math.max(a, b), p: projLine(q, m, nn) })
    for (const [c, other] of [[j, k], [k, j]]) {
      const r = dist(q, c)
      cands.push({ e: Math.abs(r - bl) / Math.max(r, bl), p: add(c, mul(unit(sub(q, c)), bl)) })
      void other
    }
    cands.sort((x, y) => x.e - y.e)
    if (cands[0].e > 0.075) return null
    const p = cands[0].p
    // just two equal: not the equilateral one
    const L = [dist(p, j), dist(p, k), bl]
    if (Math.max(...L) / Math.min(...L) < 1.08) return null
    return p
  }
  // a right angle at this corner (on the circle with jk as diameter) or at j or k (on the line at right angles to jk)
  const cands: { e: number; p: Vec }[] = []
  cands.push({ e: Math.abs(angleAtV(q, j, k) - 90), p: add(m, mul(unit(sub(q, m)), bl / 2)) })
  cands.push({ e: Math.abs(angleAtV(j, q, k) - 90), p: projLine(q, j, nn) })
  cands.push({ e: Math.abs(angleAtV(k, q, j) - 90), p: projLine(q, k, nn) })
  cands.sort((x, y) => x.e - y.e)
  return cands[0].e < 6 ? cands[0].p : null
}

/** A triangle the eye can still read: no sliver, no needle. */
function triOk(S: Scene) {
  const Q = TRI_NAMES.map(n => P(S, n))
  const area = Math.abs(cross(sub(Q[1], Q[0]), sub(Q[2], Q[0]))) / 2
  const angs = [0, 1, 2].map(i => angleAtV(Q[i], Q[(i + 1) % 3], Q[(i + 2) % 3]))
  return area > 1.2 && Math.min(...angs) > 8
}

function triBoard(S: Scene, o: { drag?: boolean; snap?: TriSnap; to?: Record<string, Vec> } = {}) {
  resetBeat(S)
  if (o.to) place(S, o.to)
  else if (!S.pts.TA) place(S, TRI0)
  S.frame = { x0: -1.4, y0: -1.2, x1: 8.6, y1: 6.8 }
  S.polys = [{ id: "tri", pts: TRI_NAMES, lens: true, marks: true }]
  if (o.drag) {
    const snap = o.snap
    S.handles = TRI_NAMES.map(n => ({ id: `h${n}`, kind: "point" as const, pt: n, snap: snap ? (S2: Scene, q: Vec) => triSnap(S2, n, q, snap) : undefined, ok: triOk, lock: !!snap }))
    // one corner clicked in: the triangle holds still
    if (snap) S.tick = S2 => { if (S2.locked.size && S2.locked.size < 3) for (const h of S2.handles) S2.locked.add(h.id) }
  }
}

/** A triangle task: drag a corner until it clicks into the shape. */
function makeTri(id: string, text: string, kind: TriSnap, hint: (S: Scene) => Vec[]): Beat {
  return {
    id, say: text,
    enter: S => {
      triBoard(S, { drag: true, snap: kind })
      later(S, 25, S2 => { if (!S2.locked.size) { const pts = hint(S2); place(S2, { hint0: pts[0], hint1: pts[1], hint2: pts[2] }); S2.polys.push({ id: "hint", pts: ["hint0", "hint1", "hint2"], ghost: true }); say(S2, "Try one like this.", "calm", 600) } })
      look(S)
    },
    done: S => S.locked.size > 0 && S.drag === null,
    advanceAfter: 1600,
  }
}

/** Four triangles to tap: equilateral, isosceles, scalene and right-angled. */
const TAP_TRIS: Record<string, Vec[]> = {
  equi: [[0, 0], [3, 0], [1.5, 2.598]],
  iso: [[0, 0], [2.4, 0], [1.2, 3.4]],
  scal: [[0, 0], [3.2, 0], [0.8, 2.4]],
  right: [[0, 0], [3, 0], [0, 2.2]],
}
function tapTrisBoard(S: Scene) {
  resetBeat(S)
  const order = ["scal", "iso", "right", "equi"]
  const at = (i: number): Vec => (tall(S) ? [(i % 2) * 4.2, -Math.floor(i / 2) * 4.4] : [i * 4.3, 0])
  const pts: Record<string, Vec> = {}
  order.forEach((k, i) => TAP_TRIS[k].forEach((p, j) => { pts[`${k}${j}`] = add(at(i), p) }))
  place(S, pts)
  S.frame = tall(S) ? { x0: -0.8, y0: -5.2, x1: 7.6, y1: 4 } : { x0: -0.8, y0: -1, x1: 16.2, y1: 4.2 }
  S.polys = order.map(k => ({ id: k, pts: [0, 1, 2].map(j => `${k}${j}`), marks: true }))
  S.taps = polyTaps(S, order)
}

/** The triangle as the last task made it, or made so for a cold open. */
function triAs(S: Scene, want: "equilateral" | "isosceles" | "right") {
  if (!S.pts.TA) place(S, TRI0)
  const Q = TRI_NAMES.map(n => P(S, n)), t = triName(Q)
  const ok = want === "right" ? t.right : t.sides === want
  if (ok) return
  const j = P(S, "TA"), k = P(S, "TB"), m = lerpV(j, k, 0.5), b = sub(k, j), up = unit([-b[1], b[0]])
  const c = want === "equilateral" ? add(m, mul(up, (len(b) * Math.sqrt(3)) / 2)) : want === "isosceles" ? add(m, mul(up, len(b) * 0.45)) : add(j, mul(up, len(b) * 0.6))
  place(S, { TC: c })
}

const PART_2: Beat[] = [
  {
    id: "tri",
    say: "Here is a triangle. Drag its corners.",
    enter: S => { triBoard(S, { drag: true, to: TRI0 }); look(S) },
    done: S => S.moved > 80, free: true, minPlay: 4,
  },
  makeTri("tri-equi", "Make all three sides the same length.", "equi", S => {
    const j = P(S, "TA"), k = P(S, "TB"), m = lerpV(j, k, 0.5), b = sub(k, j)
    return [j, k, add(m, mul(unit([-b[1], b[0]]), (len(b) * Math.sqrt(3)) / 2))]
  }),
  {
    id: "tri-equi-name",
    say: "All three sides are equal. It is *equilateral*.",
    enter: S => { triAs(S, "equilateral"); triBoard(S); say(S, "The little marks show which sides are equal.", "calm", 600); look(S) },
    cta: "", ctaAfter: 2.8,
  },
  makeTri("tri-iso", "Now make just two sides equal.", "iso", S => {
    const j = P(S, "TA"), k = P(S, "TB"), m = lerpV(j, k, 0.5), b = sub(k, j)
    return [j, k, add(m, mul(unit([-b[1], b[0]]), len(b) * 1.3))]
  }),
  watch("tri-iso-name", "Two equal sides make it *isosceles*.", S => { triAs(S, "isosceles"); triBoard(S); look(S) }, 2.4),
  makeTri("tri-right", "Now give it a right angle.", "right", S => {
    const j = P(S, "TA"), k = P(S, "TB"), b = sub(k, j)
    return [j, k, add(j, mul(unit([-b[1], b[0]]), len(b) * 0.6))]
  }),
  watch("tri-right-name", "A triangle with a right angle is *right-angled*.", S => { triAs(S, "right"); triBoard(S); look(S) }, 2.6),
  watch("tri-scal", "A triangle with no equal sides is *scalene*.", S => { triBoard(S, { to: TRI0 }); look(S) }, 2.6),
  tapBeat("tri-tap", "Tap the isosceles triangle.", tapTrisBoard, {
    want: "iso",
    notes: {
      equi: "That one has all three sides equal. Isosceles has just two.",
      scal: "That one has no equal sides.",
      right: "That one has a right angle, and no equal sides.",
    },
    wrong: "Look for just two equal sides.",
    then: S => { S.polys = S.polys.map(p => (p.id === "iso" ? { ...p, col: GREEN, fill: GREEN, fillOp: 0.12 } : p)); S.touched = "iso" },
  }),
]

// ── 3. Quadrilaterals ────────────────────────────────────────────────────

const QUAD0: Record<string, Vec> = { Q1: [-3, -2], Q2: [3, -3], Q3: [2, 2], Q4: [-1, 3] }
const QN = ["Q1", "Q2", "Q3", "Q4"]
const quadNow = (S: Scene) => quadName(QN.map(n => P(S, n)))

function quadBoard(S: Scene, o: { drag?: boolean; to?: Record<string, Vec> } = {}) {
  resetBeat(S)
  if (o.to) place(S, o.to)
  else if (!S.pts.Q1) place(S, QUAD0)
  // an upright phone gets a tall grid
  const r = tall(S) ? { x0: -4, x1: 4, y0: -5, y1: 5 } : { x0: -5, x1: 5, y0: -4, y1: 4 }
  S.grid = { ...r, dotted: true }
  S.frame = { x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1 }
  S.polys = [{ id: "quad", pts: QN, marks: true }]
  if (o.drag) S.handles = QN.map(n => ({ id: `h${n}`, kind: "point" as const, pt: n, grid: true, ok: (S2: Scene) => simpleShape(QN.map(x => P(S2, x))) }))
}

/** Make a special quadrilateral by dragging corners on the grid; a dashed example after a while. */
function makeQuad(id: string, text: string, want: string, hint: Vec[]): Beat {
  return {
    id, say: text,
    enter: S => {
      quadBoard(S, { drag: true })
      S.tick = S2 => {
        if (S2.got.has("done") || S2.drag || S2.moved < 20) return
        if (quadNow(S2) === want) { S2.got.add("done"); S2.flashGood = 1; S2.touched = "quad"; for (const h of S2.handles) S2.locked.add(h.id) }
      }
      hintAfter(S, 25, hint)
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1700,
  }
}

const SQUARE: Record<string, Vec> = { Q1: [-2, -2], Q2: [2, -2], Q3: [2, 2], Q4: [-2, 2] }
const RECT: Record<string, Vec> = { Q1: [-3, -2], Q2: [3, -2], Q3: [3, 2], Q4: [-3, 2] }

/** PQRS from 4024/11/M/J/20 Q18 on its grid. */
const PQRS: Record<string, Vec> = { Pp: [4, 3], Qp: [-2, -3], Rp: [-5, 2], Sp: [-2, 5] }
function s20Board(S: Scene, lit: string[] = []) {
  resetBeat(S)
  place(S, PQRS)
  S.grid = { x0: -6, x1: 6, y0: -4, y1: 6, dotted: true, axes: true }
  S.frame = { x0: -6, y0: -4, x1: 6, y1: 6 }
  S.names = { Pp: "P", Qp: "Q", Rp: "R", Sp: "S" }
  S.polys = [{ id: "pqrs", pts: ["Pp", "Qp", "Rp", "Sp"] }]
  const both = lit.length === 2
  S.segs = lit.map(k => ({ id: `lit${k}`, a: k === "PQ" ? "Qp" : "Rp", b: k === "PQ" ? "Pp" : "Sp", col: BLUE, w: 3.6, arrows: both ? 1 : 0 }))
}
const SIDE_ENDS: Record<string, [string, string]> = { PQ: ["Pp", "Qp"], QR: ["Qp", "Rp"], RS: ["Rp", "Sp"], SP: ["Sp", "Pp"] }

/** The four special shapes for 4024/12/M/J/20 Q2(b), each with its lines of symmetry (blue, dashed) and diagonals (orange). */
const SYM: Record<string, { pts: Vec[]; lines: [Vec, Vec][]; right: boolean }> = {
  rhombus: { pts: [[0, 3], [2, 0], [0, -3], [-2, 0]], lines: [[[0, 3.8], [0, -3.8]], [[2.8, 0], [-2.8, 0]]], right: true },
  kite: { pts: [[0, 3], [1.6, 1.4], [0, -3], [-1.6, 1.4]], lines: [[[0, 3.8], [0, -3.8]]], right: true },
  rectangle: { pts: [[-3, -2], [3, -2], [3, 2], [-3, 2]], lines: [[[0, 2.8], [0, -2.8]], [[3.8, 0], [-3.8, 0]]], right: false },
  square: { pts: [[-2.4, -2.4], [2.4, -2.4], [2.4, 2.4], [-2.4, 2.4]], lines: [[[0, 3.2], [0, -3.2]], [[3.2, 0], [-3.2, 0]], [[3.1, 3.1], [-3.1, -3.1]], [[-3.1, 3.1], [3.1, -3.1]]], right: true },
}
function symBoard(S: Scene, which: string | null) {
  S.polys = []
  S.segs = []
  S.squares = []
  if (!which) return
  const sh = SYM[which]
  const pts: Record<string, Vec> = {}
  sh.pts.forEach((p, i) => { pts[`k${i}`] = p })
  sh.lines.forEach(([a, b], i) => { pts[`s${i}a`] = a; pts[`s${i}b`] = b })
  // the diagonals cross where corner 0 to 2 meets corner 1 to 3
  const [a, b, c, d] = sh.pts, u = sub(c, a), v = sub(d, b)
  const t = cross(sub(b, a), v) / cross(u, v)
  pts.dx = add(a, mul(u, t))
  place(S, pts)
  S.polys = [{ id: "sym", pts: ["k0", "k1", "k2", "k3"] }]
  S.segs = [
    { id: "d1", a: "k0", b: "k2", col: ORANGE, w: 2 },
    { id: "d2", a: "k1", b: "k3", col: ORANGE, w: 2 },
    ...sh.lines.map((_, i) => ({ id: `sym${i}`, a: `s${i}a`, b: `s${i}b`, col: BLUE, w: 2, dash: true })),
  ]
  if (sh.right) S.squares = [{ at: "dx", a: "k1", b: "k2", col: ORANGE }]
}

const PART_3: Beat[] = [
  watch("quad", "A shape with four straight sides is a *quadrilateral*.", S => { quadBoard(S, { to: QUAD0 }); look(S) }, 2.6),
  {
    id: "quad-drag",
    say: "Drag its corners. They click onto the grid.",
    enter: S => { quadBoard(S, { drag: true }); say(S, "The marks show equal sides, parallel sides and right angles.", "calm", 600); look(S) },
    done: S => S.moved > 80, free: true, minPlay: 5,
  },
  makeQuad("q-square", "Make a square.", "square", Object.values(SQUARE)),
  watch("q-square-name", "It has four equal sides and four right angles. It is a *square*.", S => { quadBoard(S, quadNow(S) === "square" ? {} : { to: SQUARE }); look(S) }, 3.0),
  makeQuad("q-rect", "Now make a rectangle that is not a square.", "rectangle", [[-3, -2], [3, -2], [3, 2], [-3, 2]]),
  watch("q-rect-name", "A *rectangle* has four right angles. Its opposite sides are equal.", S => { quadBoard(S, quadNow(S) === "rectangle" ? {} : { to: RECT }); look(S) }, 3.0),
  watch("q-para-def", "A *parallelogram* has two pairs of parallel sides.", S => { quadBoard(S); look(S) }, 2.6),
  makeQuad("q-para", "Make one that has no right angles.", "parallelogram", [[-3, -2], [2, -2], [3, 2], [-2, 2]]),
  watch("q-rhom-def", "A *rhombus* is a parallelogram with four equal sides.", S => { quadBoard(S); look(S) }, 2.6),
  makeQuad("q-rhom", "Make a rhombus that is not a square.", "rhombus", [[0, -3], [2, 0], [0, 3], [-2, 0]]),
  watch("q-trap-def", "A *trapezium* has one pair of parallel sides.", S => { quadBoard(S); look(S) }, 2.6),
  makeQuad("q-trap", "Make a trapezium.", "trapezium", [[-3, -2], [3, -2], [1, 2], [-1, 2]]),
  watch("q-kite-def", "A *kite* has two pairs of equal sides, next to each other.", S => { quadBoard(S); look(S) }, 2.8),
  makeQuad("q-kite", "Make a kite.", "kite", [[0, 3], [2, 1], [0, -3], [-2, 1]]),
  watch("q-sq-rect", "A square has four right angles, so it is a rectangle too.", S => { quadBoard(S, { to: SQUARE }); look(S) }, 3.0),
  watch("q-sq-rhom", "It has four equal sides, so it is a rhombus too.", S => { quadBoard(S, { to: SQUARE }); look(S) }, 2.8),

  // 4024/11/M/J/20 Q18(a)
  watch("s20", "This quadrilateral $PQRS$ is drawn on a grid.", S => { s20Board(S); look(S) }, 2.4),
  {
    id: "s20-par",
    say: "Tap the two sides that are parallel.",
    enter: S => {
      s20Board(S)
      S.taps = Object.entries(SIDE_ENDS).map(([k, [a, b]]) => ({ id: k, hit: (S2, p) => distToSeg(p, ptS(S2, a), ptS(S2, b)), spot: S2 => lerpV(ptS(S2, a), ptS(S2, b), 0.5) }))
      S.onTap = (S2, k) => {
        if (S2.got.has("done")) return
        const lit = ["PQ", "RS"].filter(x => S2.got.has(x))
        if (k === "PQ" || k === "RS") {
          if (lit.includes(k)) return
          S2.got.add(k)
          const now = ["PQ", "RS"].filter(x => S2.got.has(x))
          const keep = { taps: S2.taps, onTap: S2.onTap }
          s20Board(S2, now)
          S2.taps = keep.taps; S2.onTap = keep.onTap
          for (const x of now) S2.got.add(x)
          if (now.length === 2) { S2.got.add("done"); S2.flashGood = 1; S2.note = null }
          else say(S2, "Now tap the side parallel to it.", "calm", 600)
          return
        }
        say(S2, "That one is not parallel to another side. Look at how steeply each side goes up.", "wrong", 4.5)
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1700,
  },
  pickBeat("s20-name", "Which special quadrilateral is it?", S => s20Board(S, ["PQ", "RS"]), {
    options: ["Parallelogram", "Kite", "Trapezium", "Rhombus"], answer: 2,
    notes: {
      0: "A parallelogram has two pairs of parallel sides. This has one pair.",
      1: "A kite has two pairs of equal sides next to each other.",
      3: "A rhombus has four equal sides.",
    },
    right: "Yes. It has one pair of parallel sides.",
  }),

  // 4024/12/M/J/20 Q2(b)
  {
    id: "s20b",
    say: "A quadrilateral has only one line of symmetry.",
    enter: S => { resetBeat(S); S.frame = { x0: -4, y0: -4, x1: 4, y1: 4 }; say(S, "A line of symmetry cuts a shape into two halves that match.", "calm", 600); look(S) },
    cta: "", ctaAfter: 2.6,
  },
  {
    id: "s20b-diag",
    say: "Its diagonals cross at right angles.",
    enter: S => { resetBeat(S); S.frame = { x0: -4, y0: -4, x1: 4, y1: 4 }; say(S, "A diagonal joins two opposite corners.", "calm", 600); look(S) },
    cta: "", ctaAfter: 2.4,
  },
  pickBeat("s20b-pick", "Which quadrilateral is it?", S => { resetBeat(S); S.frame = { x0: -4, y0: -4, x1: 4, y1: 4 } }, {
    options: ["Rhombus", "Rectangle", "Kite", "Square"], answer: 2,
    notes: {
      0: "A rhombus has two lines of symmetry.",
      1: "A rectangle has two lines of symmetry, and its diagonals don't cross at right angles.",
      3: "A square has four lines of symmetry.",
    },
    right: "Yes. A kite has one line of symmetry, and its diagonals cross at right angles.",
    // each pick draws that shape with its lines of symmetry and diagonals
    onPick: (S, k) => symBoard(S, ["rhombus", "rectangle", "kite", "square"][k]),
  }),
]

// ── 4. Polygons ──────────────────────────────────────────────────────────

const POLY_NAME: Record<number, string> = { 3: "Triangle", 4: "Quadrilateral", 5: "Pentagon", 6: "Hexagon", 8: "Octagon", 10: "Decagon" }
const vName = (i: number) => `V${i}`
const regular = (n: number, r = 3): Record<string, Vec> => Object.fromEntries(Array.from({ length: n }, (_, i) => [vName(i), dirOf(90 + (360 * i) / n).map(x => x * r) as Vec]))

/** A regular polygon with n sides (its new corners grow out of the last one), its name below. */
function polyBoard(S: Scene, n: number, o: { stepper?: (S: Scene, n: number) => void; ticks?: boolean; name?: boolean } = {}) {
  resetBeat(S)
  setPoly(S, n, o.ticks)
  S.frame = { x0: -4, y0: -3.8, x1: 4, y1: 3.8 }
  if (o.stepper) S.stepper = { n, min: 3, max: 10, onStep: (S2, k) => { setPoly(S2, k, o.ticks); o.stepper!(S2, k) } }
  if (o.name !== false) S.eqFn = S2 => { const k = S2.polys[0]?.pts.length ?? n; return atom("pn", POLY_NAME[k] ? `\\text{${POLY_NAME[k]}}` : `${k}\\text{ sides}`) }
}
function setPoly(S: Scene, n: number, ticks?: boolean) {
  const last = Object.keys(S.pts).filter(k => /^V\d+$/.test(k)).length
  const from: Record<string, Vec> = {}
  for (let i = last; i < n; i++) from[vName(i)] = last ? [...PD(S, vName(last - 1))] as Vec : [0, 0]
  for (let i = n; i < 12; i++) delete S.pts[vName(i)]
  place(S, regular(n), from)
  S.polys = [{ id: "poly", pts: Array.from({ length: n }, (_, i) => vName(i)), marks: ticks ? "ticks" : undefined }]
}
const polyN = (S: Scene) => S.polys.find(p => p.id === "poly")?.pts.length ?? 5

const PART_4: Beat[] = [
  watch("poly", "A flat shape with straight sides is a *polygon*.", S => { polyBoard(S, 5, { name: false }); look(S) }, 2.6),
  watch("poly-5", "This one has $5$ sides. It is a pentagon.", S => { polyBoard(S, 5); look(S, ["eq"]) }, 2.4),
  {
    id: "poly-add",
    say: "Add and take away sides.",
    enter: S => {
      polyBoard(S, polyN(S) === 5 ? 5 : polyN(S), { stepper: (S2, k) => { S2.got.add(`n${k}`) } })
      look(S, ["eq", "stepper"])
    },
    done: S => [...S.got].filter(g => g.startsWith("n")).length >= 3, free: true, minPlay: 3,
  },
  {
    id: "poly-8",
    say: "Make an octagon.",
    enter: S => {
      const start = polyN(S) === 8 ? 6 : polyN(S)
      polyBoard(S, start, { stepper: (S2, k) => { if (k === 8) { S2.got.add("done"); S2.flashGood = 1; S2.touched = "poly" } } })
      look(S, ["eq", "stepper"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 1500,
  },
  {
    id: "poly-10",
    say: "Now make a decagon.",
    enter: S => {
      const start = polyN(S) === 10 ? 8 : polyN(S)
      polyBoard(S, start, { stepper: (S2, k) => { if (k === 10) { S2.got.add("done"); S2.flashGood = 1; S2.touched = "poly" } } })
      look(S, ["eq", "stepper"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 1500,
  },
  watch("poly-reg", "All its sides and all its angles are equal. It is *regular*.", S => { polyBoard(S, 6, { ticks: true }); look(S, ["eq"]) }, 3.0),
  {
    id: "poly-pull",
    say: "Pull one corner out.",
    enter: S => {
      polyBoard(S, 6, { ticks: true })
      const home: Vec = [...P(S, "V0")] as Vec
      S.frame = { x0: -4.2, y0: -3.8, x1: 4.2, y1: 4.6 }
      S.handles = [{ id: "pull", kind: "point", pt: "V0", ok: S2 => simpleShape(Array.from({ length: 6 }, (_, i) => P(S2, vName(i)))) }]
      S.tick = S2 => { if (!S2.drag && dist(P(S2, "V0"), home) > 0.9) { S2.got.add("done"); S2.locked.add("pull") } }
      look(S, ["eq"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 1500,
  },
  watch("poly-irr", "Now its sides are not all equal. It is *irregular*.", S => {
    const V0: Vec = S.pts.V0 ? [P(S, "V0")[0], P(S, "V0")[1]] : [1.2, 4]
    polyBoard(S, 6, { ticks: true })
    place(S, { V0: dist(V0, [0, 3]) > 0.9 ? V0 : [1.2, 4] })
    S.frame = { x0: -4.2, y0: -3.8, x1: 4.2, y1: 4.6 }
    look(S, ["eq"])
  }, 2.8),
]

// ── 5. Circles ───────────────────────────────────────────────────────────

const R = 3
const RAD_AT = 35, DIA_AT = 205, CHORD_AT = 150
const near = (S: Scene, w: Vec) => Math.abs(dist(w, [0, 0]) - R) * unitPx(S) < (S.touch ? 34 : 24)

/** The circle with centre O; what the student has drawn stays (its points stay on the board). */
function circBoard(S: Scene, o: { radius?: boolean; diameter?: boolean; chord?: boolean; frame?: { x0: number; y0: number; x1: number; y1: number } } = {}) {
  resetBeat(S)
  place(S, { O: [0, 0] })
  S.circle = { c: "O", r: R }
  S.frame = o.frame ?? { x0: -4.4, y0: -3.8, x1: 4.4, y1: 3.8 }
  S.names = { O: "O" }
  S.nameFrom = { O: [-1, 1] }
  S.dots = [{ pt: "O" }]
  if (o.radius) { if (!S.pts.R1) place(S, { R1: onCircle(S, RAD_AT) }); S.segs.push({ id: "rad", a: "O", b: "R1", w: 2.6 }) }
  if (o.diameter) { place(S, { D1: onCircle(S, DIA_AT), D2: onCircle(S, DIA_AT - 180) }); S.segs.push({ id: "dia", a: "D1", b: "D2", w: 2.6 }) }
  if (o.chord) { if (!S.pts.C2) place(S, { C1: onCircle(S, CHORD_AT), C2: onCircle(S, 30) }); S.segs.push({ id: "chord", a: "C1", b: "C2", w: 2.6 }) }
}
/** The chord's ends as angles: the minor arc runs anticlockwise from m1 to m2. */
function minorArc(S: Scene): [number, number] {
  const a = angleOn(S, P(S, "C1")), b = angleOn(S, P(S, "C2"))
  return (((b - a) % 360) + 360) % 360 <= 180 ? [a, b] : [b, a]
}
/** Which side of the chord a world point is: the minor segment's side is +1. */
function chordSide(S: Scene, w: Vec): number {
  const a = P(S, "C1"), b = P(S, "C2"), [m1, m2] = minorArc(S)
  const mid = onCircle(S, m1 + ((((m2 - m1) % 360) + 360) % 360) / 2)
  return Math.sign(cross(sub(b, a), sub(w, a))) === Math.sign(cross(sub(b, a), sub(mid, a))) ? 1 : -1
}
const worldOf = (S: Scene, p: Vec): Vec => { const f = S.fitD ?? S.fit!; return [f.c[0] + (p[0] - f.cx) / f.u, f.c[1] - (p[1] - f.cy) / f.u] }

/** A draw beat: a line from a point to the circle's edge, accepted when it lands where it should. */
function drawBeat(id: string, text: string, board: (S: Scene) => void, from: string, accept: (S: Scene, to: Vec) => string | null, onto?: (S: Scene, to: Vec) => Vec, then?: (S: Scene, to: Vec) => void): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.handles = [{
        id: "draw", kind: "draw", from,
        accept: (S2, end) => {
          if (!near(S2, end)) return { ok: false, note: "Take it all the way to the edge." }
          const to = onto ? onto(S2, end) : onCircle(S2, angleOn(S2, end))
          const bad = accept(S2, to)
          return bad ? { ok: false, note: bad } : { ok: true, to }
        },
        then: (S2, to) => { then?.(S2, to); S2.got.add("done") },
      }]
      S.dots.push({ pt: from, col: CHALK })
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1500,
  }
}

const PART_5: Beat[] = [
  watch("circ", "This is a circle. Its centre is $O$.", S => { circBoard(S); look(S) }, 2.2),
  drawBeat("rad", "Drag from $O$ to the edge.", S => circBoard(S), "O", () => null, undefined, (S, to) => {
    place(S, { R1: to })
    S.segs.push({ id: "rad", a: "O", b: "R1", w: 2.6 })
  }),
  watch("rad-name", "A line from the centre to the edge is a *radius*.", S => { circBoard(S, { radius: true }); look(S) }, 2.6),
  drawBeat("dia", "Now draw from this point, through $O$, to the other side.", S => { circBoard(S); place(S, { D1: onCircle(S, DIA_AT) }) }, "D1",
    (S, to) => (Math.abs(((angleOn(S, to) - (DIA_AT - 180)) % 360 + 540) % 360 - 180) < 9 ? null : "Go through the centre, $O$."),
    (S, end) => { const a = angleOn(S, end); return Math.abs(((a - (DIA_AT - 180)) % 360 + 540) % 360 - 180) < 9 ? onCircle(S, DIA_AT - 180) : onCircle(S, a) },
    S => { place(S, { D2: onCircle(S, DIA_AT - 180) }); S.segs.push({ id: "dia", a: "D1", b: "D2", w: 2.6 }) }),
  {
    id: "dia-name",
    say: "A line across the circle through $O$ is a *diameter*.",
    enter: S => { circBoard(S, { diameter: true }); say(S, "It is two radii long. Radii means more than one radius.", "calm", 600); look(S) },
    cta: "", ctaAfter: 2.8,
  },
  {
    id: "circum",
    say: "The distance all the way round is the *circumference*.",
    enter: S => {
      circBoard(S)
      S.arcs = [{ id: "round", a1: 90, a2: 90.5, col: BLUE, w: 4, glow: true }]
      S.acts.push({ dur: 2.6, run: (S2, e) => { S2.arcs = [{ id: "round", a1: 90, a2: 90 + Math.max(0.5, 359.5 * e), col: BLUE, w: 4, glow: true }] } })
      look(S)
    },
    cta: "", ctaAfter: 3.0,
  },
  drawBeat("chord", "Now join two points on the edge.", S => { circBoard(S); place(S, { C1: onCircle(S, CHORD_AT) }) }, "C1",
    (S, to) => {
      const a = P(S, "C1")
      if (dist(a, to) < 1.6) return "Make it a bit longer."
      const d = Math.abs(cross(sub(to, a), sub([0, 0], a))) / dist(a, to)
      return d < 0.8 ? "That goes too close to $O$. Try a shorter one." : null
    }, undefined,
    (S, to) => { place(S, { C2: to }); S.segs.push({ id: "chord", a: "C1", b: "C2", w: 2.6 }) }),
  watch("chord-name", "A line joining two points on the edge is a *chord*.", S => { circBoard(S, { chord: true }); look(S) }, 2.6),
  watch("seg", "A chord cuts the circle into two *segments*.", S => {
    circBoard(S, { chord: true })
    const [m1, m2] = minorArc(S)
    S.shades = [{ id: "minor", kind: "segment", a1: m1, a2: m2, col: BLUE, op: 0.3 }, { id: "major", kind: "segment", a1: m2, a2: m1, col: ORANGE, op: 0.2 }]
    look(S)
  }, 2.6),
  tapBeat("seg-tap", "Tap the smaller segment.", S => {
    circBoard(S, { chord: true })
    const inCircle = (S2: Scene, p: Vec) => dist(worldOf(S2, p), [0, 0]) < R
    S.taps = [
      { id: "minor", hit: (S2, p) => (inCircle(S2, p) && chordSide(S2, worldOf(S2, p)) > 0 ? 0 : Infinity), spot: S2 => { const [m1, m2] = minorArc(S2); return toScreen(S2, mul(onCircle(S2, m1 + ((((m2 - m1) % 360) + 360) % 360) / 2), 0.92)) } },
      { id: "major", hit: (S2, p) => (inCircle(S2, p) && chordSide(S2, worldOf(S2, p)) < 0 ? 0 : Infinity), spot: S2 => ptS(S2, "O") },
    ]
  }, {
    want: "minor", notes: { major: "That's the bigger one." }, wrong: "Tap inside the circle.",
    then: S => { const [m1, m2] = minorArc(S); S.shades = [{ id: "minor", kind: "segment", a1: m1, a2: m2, col: BLUE, op: 0.32 }] },
  }),
  watch("arcs", "The chord's ends split the edge into two arcs.", S => {
    circBoard(S, { chord: true })
    const [m1, m2] = minorArc(S)
    S.arcs = [{ id: "minor", a1: m1, a2: m2, col: BLUE, w: 4.5 }, { id: "major", a1: m2, a2: m1, col: ORANGE, w: 4.5 }]
    look(S)
  }, 2.6),
  watch("arc-names", "The short one is the *minor arc*. The long one is the *major arc*.", S => {
    circBoard(S, { chord: true })
    const [m1, m2] = minorArc(S)
    S.arcs = [{ id: "minor", a1: m1, a2: m2, col: BLUE, w: 4.5 }, { id: "major", a1: m2, a2: m1, col: ORANGE, w: 4.5 }]
    look(S)
  }, 3.2),
  tapBeat("arc-tap", "Tap the major arc.", S => {
    circBoard(S, { chord: true })
    const ring = (S2: Scene, p: Vec, onIt: (a: number) => boolean) => {
      const w = worldOf(S2, p), off = Math.abs(dist(w, [0, 0]) - R) * unitPx(S2)
      return onIt(angleOn(S2, w)) ? off : Infinity
    }
    const mid = (S2: Scene, a1: number, a2: number) => toScreen(S2, onCircle(S2, a1 + ((((a2 - a1) % 360) + 360) % 360) / 2))
    S.taps = [
      { id: "minor", hit: (S2, p) => { const [m1, m2] = minorArc(S2); return ring(S2, p, a => onArc(a, m1, m2)) }, spot: S2 => { const [m1, m2] = minorArc(S2); return mid(S2, m1, m2) } },
      { id: "major", hit: (S2, p) => { const [m1, m2] = minorArc(S2); return ring(S2, p, a => onArc(a, m2, m1)) }, spot: S2 => { const [m1, m2] = minorArc(S2); return mid(S2, m2, m1) } },
    ]
  }, {
    want: "major", notes: { minor: "That's the minor arc, the short one." }, wrong: "Tap on the edge of the circle.",
    then: S => { const [m1, m2] = minorArc(S); S.arcs = [{ id: "major", a1: m2, a2: m1, col: ORANGE, w: 4.5, glow: true }] },
  }),
  watch("sector", "Two radii cut off a *sector*.", S => {
    circBoard(S)
    if (!S.pts.C2) place(S, { C1: onCircle(S, CHORD_AT), C2: onCircle(S, 30) })
    const [m1, m2] = minorArc(S)
    S.segs = [{ id: "r1", a: "O", b: "C1", w: 2.6 }, { id: "r2", a: "O", b: "C2", w: 2.6 }]
    S.shades = [{ id: "sector", kind: "sector", a1: m1, a2: m2, col: BLUE, op: 0.3 }]
    look(S)
  }, 2.6),
  {
    id: "tan",
    say: "Slide this line down until it just touches the circle.",
    enter: S => {
      circBoard(S, { frame: { x0: -4.4, y0: -3.8, x1: 4.4, y1: 5.2 } })
      place(S, { T1: [-3, 4.6], T2: [3, 4.6], Tt: [0, 4.6] })
      S.segs = [{ id: "tan", a: "T1", b: "T2", ext: true }]
      S.handles = [{ id: "slide", kind: "slide", pts: ["T1", "T2", "Tt"], grab: "Tt", dir: [0, -1], min: 0, max: 2.6, snaps: [1.6], lock: true }]
      look(S)
    },
    done: S => S.locked.has("slide") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("tan-name", "A line that touches the circle at one point is a *tangent*.", S => {
    circBoard(S, { frame: { x0: -4.4, y0: -3.8, x1: 4.4, y1: 5.2 } })
    place(S, { T1: [-3, 3], T2: [3, 3], Tt: [0, 3] })
    S.segs = [{ id: "tan", a: "T1", b: "T2", ext: true }]
    S.dots.push({ pt: "Tt", col: BLUE, pulse: true })
    look(S)
  }, 2.8),

  // 4024/12/M/J/23 Q2
  watch("s23", "This circle has centre $O$. A straight line touches it.", s23Board, 2.6),
  pickBeat("s23-shade", "What is the name of the shaded part?", S => { s23Board(S); S.shades = S.shades.map(sh => ({ ...sh, pulse: true })) }, {
    options: ["Segment", "Sector", "Chord", "Arc"], answer: 1,
    notes: {
      0: "A segment is cut off by a chord. This part is cut off by two radii.",
      2: "A chord is a line. This is a part of the circle.",
      3: "An arc is part of the edge.",
    },
    right: "Yes. It is between two radii.",
  }),
  pickBeat("s23-line", "What is the name of the straight line that touches the circle?", S => { s23Board(S); S.segs = S.segs.map(sg => (sg.id === "tan" ? { ...sg, glow: true, col: BLUE } : sg)) }, {
    options: ["Chord", "Diameter", "Radius", "Tangent"], answer: 3,
    notes: {
      0: "A chord joins two points on the edge. This line only touches it.",
      1: "A diameter goes across, through the centre.",
      2: "A radius goes from the centre to the edge.",
    },
    right: "Yes. It touches the circle at one point.",
  }),
  {
    id: "end",
    say: "In summary, the marks on a shape show its equal sides, parallel sides and right angles. They tell you its name.",
    enter: S => { quadBoard(S, { to: SQUARE }); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

/** The paper's circle: a shaded sector, a radius labelled, and a tangent. */
function s23Board(S: Scene) {
  circBoard(S, { frame: { x0: -4.6, y0: -3.8, x1: 5.6, y1: 4.4 } })
  const tq = 50, tp = onCircle(S, tq), along = dirOf(tq + 90)
  place(S, { S1: onCircle(S, 112), S2: onCircle(S, 238), Tq: tp, Ta: add(tp, mul(along, 2.6)), Tb: sub(tp, mul(along, 2.6)) })
  S.segs = [{ id: "s1", a: "O", b: "S1", w: 2.4 }, { id: "s2", a: "O", b: "S2", w: 2.4 }, { id: "tan", a: "Ta", b: "Tb" }]
  S.shades = [{ id: "sector", kind: "sector", a1: 112, a2: 238, col: CHALK, op: 0.28 }]
  const mid = lerpV([0, 0], P(S, "S2"), 0.55)
  S.freeLabs = [{ key: "radius", at: mid, tex: "\\text{radius}", dx: 46, dy: 10, size: 17 }]
  look(S)
}

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4, ...PART_5]

applyParts(BEATS, [
  ["lines", "Parallel and perpendicular lines"],
  ["tri", "Triangles"],
  ["quad", "Quadrilaterals"],
  ["poly", "Polygons"],
  ["circ", "Circles"],
])

