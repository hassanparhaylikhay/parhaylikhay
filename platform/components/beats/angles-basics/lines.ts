/**
 * Geometry for straight lines, rays and crossings. Screen coordinates
 * (y down); directions are angles in radians measured the screen way.
 */

import { type Vec, type Rect, add, sub, mul, cross, turn } from "../geometry"

/** An infinite straight line: a point on it and its direction. */
export interface Line { p: Vec; a: number }
/** A ray from a point, of a drawn length. */
export interface Ray { from: Vec; a: number; len: number }

export const dirOf = (a: number): Vec => [Math.cos(a), Math.sin(a)]
export const TAU = Math.PI * 2

/** An angle brought into [0, 2π). */
export const norm = (a: number) => ((a % TAU) + TAU) % TAU

/** The part of a line inside a rect, or null if it misses. */
export function clipLine(L: Line, r: Rect): [Vec, Vec] | null {
  const d = dirOf(L.a)
  let t0 = -1e9, t1 = 1e9
  for (const [p, dd, lo, hi] of [[L.p[0], d[0], r.x0, r.x1], [L.p[1], d[1], r.y0, r.y1]] as const) {
    if (Math.abs(dd) < 1e-9) { if (p < lo || p > hi) return null; continue }
    let a = (lo - p) / dd, b = (hi - p) / dd
    if (a > b) [a, b] = [b, a]
    t0 = Math.max(t0, a)
    t1 = Math.min(t1, b)
  }
  if (t0 > t1) return null
  return [add(L.p, mul(d, t0)), add(L.p, mul(d, t1))]
}

/** Where two lines cross, or null when they are parallel. */
export function intersect(A: Line, B: Line): Vec | null {
  const d1 = dirOf(A.a), d2 = dirOf(B.a)
  const den = cross(d1, d2)
  if (Math.abs(den) < 1e-9) return null
  const t = cross(sub(B.p, A.p), d2) / den
  return add(A.p, mul(d1, t))
}

/** The direction along a line that points right (or down when it is upright). */
export function rightDir(a: number): number {
  let x = norm(a)
  if (x >= Math.PI) x -= Math.PI
  if (x > Math.PI / 2 + 1e-9) x -= Math.PI
  return x
}

/** The direction along a line that points up the screen. */
export function upDir(a: number): number {
  const d = dirOf(a)
  return d[1] <= 0 ? a : a + Math.PI
}

/** The difference in direction between two lines, 0 when parallel (radians, 0..π/2). */
export function lineGap(a1: number, a2: number): number {
  let d = Math.abs(norm(a1) - norm(a2)) % Math.PI
  if (d > Math.PI / 2) d = Math.PI - d
  return d
}

export interface Wedge { c: Vec; start: number; sweep: number }

/** The wedge from direction a1 to direction a2 the short way round. */
export function wedgeBetween(c: Vec, a1: number, a2: number): Wedge {
  return { c, start: a1, sweep: turn(a1, a2) }
}

/**
 * The four angles where a line crosses a transversal, always in the same
 * order: q0 between up and right, q1 right and down, q2 down and left,
 * q3 left and up ("up" is along the transversal, "right" along the line).
 */
export function quadrants(X: Vec, r: number, u: number): Wedge[] {
  return [
    wedgeBetween(X, u, r),
    wedgeBetween(X, r, u + Math.PI),
    wedgeBetween(X, u + Math.PI, r + Math.PI),
    wedgeBetween(X, r + Math.PI, u),
  ]
}

/** Which way along the line, and which way along the transversal, a quadrant lies. */
export const quadSides = (q: number) => ({ line: q === 0 || q === 1 ? 1 : -1, trans: q === 0 || q === 3 ? 1 : -1 })

/** Whole-degree values that add up to `total`, rounded the largest-remainder way. */
export function wholeShare(raw: number[], total: number): number[] {
  const fl = raw.map(Math.floor)
  const rem = Math.round(total - fl.reduce((s, x) => s + x, 0))
  const order = raw.map((x, i) => [x - fl[i], i] as const).sort((p, q) => q[0] - p[0])
  for (let k = 0; k < rem && k < raw.length; k++) fl[order[k][1]]++
  return fl
}
