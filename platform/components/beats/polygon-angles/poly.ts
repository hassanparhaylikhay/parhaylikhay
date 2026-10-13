/**
 * Polygon geometry for the angles-in-polygons lesson. Screen coordinates
 * (y down). A polygon is a list of corners in order; this lesson only
 * allows convex polygons, so every interior angle is under 180°.
 */

import { type Vec, add, sub, mul, dot, cross, dist, unit, DEG, RAD } from "../geometry"

export const nxt = (i: number, n: number) => (i + 1) % n
export const prv = (i: number, n: number) => (i - 1 + n) % n

/** Interior angle at corner i, in degrees (convex polygons only). */
export function interior(P: Vec[], i: number): number {
  const n = P.length
  const a = P[i]
  const u = sub(P[nxt(i, n)], a), v = sub(P[prv(i, n)], a)
  return Math.abs(Math.atan2(cross(u, v), dot(u, v))) * DEG
}

export const interiors = (P: Vec[]) => P.map((_, i) => interior(P, i))

export const angleSum = (n: number) => (n - 2) * 180

/** Signed area: positive when the corners run clockwise on screen. */
export function signedArea(P: Vec[]): number {
  let s = 0
  for (let i = 0; i < P.length; i++) s += cross(P[i], P[nxt(i, P.length)])
  return s / 2
}

export const polyArea = (P: Vec[]) => Math.abs(signedArea(P))

export function centroidOf(P: Vec[]): Vec {
  let x = 0, y = 0
  for (const p of P) { x += p[0]; y += p[1] }
  return [x / P.length, y / P.length]
}

/**
 * Convex and simple: every turn goes the same way and the turns add up to
 * exactly one full turn (which rules out star shapes that wind twice).
 */
export function isConvex(P: Vec[], minTurn = 1e-4): boolean {
  const n = P.length
  if (n < 3) return false
  let sign = 0, total = 0
  for (let i = 0; i < n; i++) {
    const e1 = sub(P[nxt(i, n)], P[i])
    const e2 = sub(P[nxt(nxt(i, n), n)], P[nxt(i, n)])
    const t = Math.atan2(cross(e1, e2), dot(e1, e2))
    if (Math.abs(t) < minTurn) return false
    const s = Math.sign(t)
    if (sign === 0) sign = s
    else if (s !== sign) return false
    total += t
  }
  return Math.abs(Math.abs(total) - 2 * Math.PI) < 0.01
}

/** The wedge at corner i, inside the polygon: start direction and positive sweep. */
export function wedgeIn(P: Vec[], i: number): { c: Vec; start: number; sweep: number } {
  const n = P.length
  const a = P[i]
  const u = sub(P[nxt(i, n)], a), v = sub(P[prv(i, n)], a)
  const au = Math.atan2(u[1], u[0])
  const s = Math.atan2(cross(u, v), dot(u, v))
  return s >= 0 ? { c: a, start: au, sweep: s } : { c: a, start: au + s, sweep: -s }
}

/**
 * The exterior angle at corner i: between the incoming side carried on past
 * the corner, and the outgoing side. Positive sweep.
 */
export function wedgeOut(P: Vec[], i: number): { c: Vec; start: number; sweep: number; dirIn: Vec } {
  const n = P.length
  const a = P[i]
  const dirIn = unit(sub(a, P[prv(i, n)]))
  const out = unit(sub(P[nxt(i, n)], a))
  const ai = Math.atan2(dirIn[1], dirIn[0])
  const s = Math.atan2(cross(dirIn, out), dot(dirIn, out))
  return s >= 0 ? { c: a, start: ai, sweep: s, dirIn } : { c: a, start: ai + s, sweep: -s, dirIn }
}

/** Heading of the side from corner i to corner i+1, in radians. */
export function heading(P: Vec[], i: number): number {
  const d = sub(P[nxt(i, P.length)], P[i])
  return Math.atan2(d[1], d[0])
}

/** A regular polygon: n corners round c at radius R, first corner at `phase`. */
export function regular(n: number, c: Vec, R: number, phase = -Math.PI / 2): Vec[] {
  const out: Vec[] = []
  for (let k = 0; k < n; k++) {
    const t = phase + (2 * Math.PI * k) / n
    out.push([c[0] + R * Math.cos(t), c[1] + R * Math.sin(t)])
  }
  return out
}

/** A regular polygon standing on a flat bottom side, the way a textbook draws one. */
export function regularFlat(n: number, c: Vec, R: number): Vec[] {
  // a corner straight down for odd n would sit on a point; rotate so the
  // bottom side is horizontal
  return regular(n, c, R, Math.PI / 2 + Math.PI / n)
}

/** Corners that can be joined to f by a diagonal. */
export function diagonalsFrom(f: number, n: number): number[] {
  const out: number[] = []
  for (let k = 0; k < n; k++) if (k !== f && k !== nxt(f, n) && k !== prv(f, n)) out.push(k)
  return out
}

/** Fan of triangles from corner f: (f, k, k+1) going round. */
export function fan(f: number, n: number): [number, number, number][] {
  const out: [number, number, number][] = []
  for (let s = 1; s <= n - 2; s++) out.push([f, (f + s) % n, (f + s + 1) % n])
  return out
}

/**
 * A convex polygon with the given interior angles (which must add up to
 * (n − 2) × 180). Walk round turning by each exterior angle, choosing side
 * lengths so the walk closes. Returned in unit-ish space; place it with
 * centreIn.
 */
export function fromInteriors(deg: number[]): Vec[] {
  const n = deg.length
  const ext = deg.map(d => (180 - d) * RAD)
  // heading of side k (corner k to k+1); turning at corner k+1 by ext[k+1]
  const h: number[] = [0]
  for (let k = 1; k < n; k++) h.push(h[k - 1] + ext[k])
  const dirs = h.map(t => [Math.cos(t), Math.sin(t)] as Vec)
  const hints = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1.2, 0.9, 1.1, 0.8, 1.15, 0.95, 1.05, 0.9, 1, 1, 1, 1],
    [0.8, 1.2, 0.9, 1.1, 0.85, 1.05, 1, 1, 1, 1, 1, 1],
    [1.4, 0.7, 1.3, 0.8, 1.2, 0.9, 1, 1, 1, 1, 1, 1],
    [0.6, 1.4, 0.7, 1.3, 0.8, 1.2, 1, 1, 1, 1, 1, 1],
  ]
  let best: { P: Vec[]; score: number } | null = null
  for (const hint of hints) {
    const L = hint.slice(0, n)
    // solve the last two lengths so the polygon closes
    let sx = 0, sy = 0
    for (let k = 0; k < n - 2; k++) { sx += L[k] * dirs[k][0]; sy += L[k] * dirs[k][1] }
    const a = dirs[n - 2], b = dirs[n - 1]
    const det = a[0] * b[1] - a[1] * b[0]
    if (Math.abs(det) < 1e-9) continue
    const la = (-sx * b[1] + sy * b[0]) / det
    const lb = (-a[0] * sy + a[1] * sx) / det
    if (la <= 0.05 || lb <= 0.05) continue
    L[n - 2] = la
    L[n - 1] = lb
    const P: Vec[] = [[0, 0]]
    for (let k = 0; k < n - 1; k++) P.push(add(P[k], mul(dirs[k], L[k])))
    // prefer evenly sized sides
    const score = Math.max(...L) / Math.min(...L)
    if (!best || score < best.score) best = { P, score }
  }
  if (!best) throw new Error(`no polygon for angles ${deg.join(", ")}`)
  return best.P
}

/**
 * Where an old outline crosses each ray from c. Used to morph between
 * polygons with different numbers of corners: the new shape grows out of
 * the old outline instead of jumping.
 */
export function radialResample(old: Vec[], c: Vec, angles: number[]): Vec[] {
  return angles.map(t => {
    const d: Vec = [Math.cos(t), Math.sin(t)]
    let best = Infinity
    for (let i = 0; i < old.length; i++) {
      const a = old[i], b = old[nxt(i, old.length)]
      const e = sub(b, a)
      const den = cross(d, e)
      if (Math.abs(den) < 1e-9) continue
      const w = sub(a, c)
      const s = cross(w, e) / den        // distance along the ray
      const u = cross(w, d) / den        // position along the edge
      if (s > 0 && u >= -1e-6 && u <= 1 + 1e-6 && s < best) best = s
    }
    return Number.isFinite(best) ? add(c, mul(d, best)) : c
  })
}

/** Distance from q to segment ab. */
export function segDist(q: Vec, a: Vec, b: Vec): number {
  const e = sub(b, a)
  const t = Math.max(0, Math.min(1, dot(sub(q, a), e) / (dot(e, e) || 1)))
  return dist(q, add(a, mul(e, t)))
}

/** Is q inside a convex polygon? */
export function insideConvex(q: Vec, P: Vec[]): boolean {
  let sign = 0
  for (let i = 0; i < P.length; i++) {
    const s = Math.sign(cross(sub(P[nxt(i, P.length)], P[i]), sub(q, P[i])))
    if (s === 0) continue
    if (sign === 0) sign = s
    else if (s !== sign) return false
  }
  return true
}

/**
 * The interior angles as the student sees them: whole degrees that add up
 * to exactly (n − 2) × 180, and a regular polygon's equal angles always
 * read the same. A shown value may be a degree off the true one.
 */
export function shownInteriors(P: Vec[]): number[] {
  const a = interiors(P)
  const n = P.length
  const total = angleSum(n)
  const mean = total / n
  if (a.every(x => Math.abs(x - mean) < 0.05)) return a.map(() => Math.round(mean))
  const fl = a.map(Math.floor)
  const rem = total - fl.reduce((s, x) => s + x, 0)
  const order = a.map((x, i) => [x - fl[i], i] as const).sort((p, q) => q[0] - p[0])
  for (let k = 0; k < rem && k < n; k++) fl[order[k][1]]++
  return fl
}

/** Exterior angles as shown: 180 minus each shown interior, so they add to 360. */
export const shownExteriors = (P: Vec[]) => shownInteriors(P).map(x => 180 - x)

/** Where a corner's angle label sits: inside when it fits, else just outside. */
export function labelSpot(D: Vec[], i: number, r: number, size: number): Vec {
  const w = wedgeIn(D, i)
  const bis = w.start + w.sweep / 2
  const u: Vec = [Math.cos(bis), Math.sin(bis)]
  const q = add(D[i], mul(u, r + size * 1.05))
  let room = Infinity
  for (let k = 0; k < D.length; k++) room = Math.min(room, segDist(q, D[k], D[nxt(k, D.length)]))
  if (insideConvex(q, D) && room >= size * 0.72) return q
  return add(D[i], mul(u, -(size * 1.4 + 4)))
}

/** Arc radius at a corner: a share of the shorter neighbouring side. */
export function cornerRadius(D: Vec[], i: number, max: number): number {
  const n = D.length
  const m = Math.min(dist(D[i], D[nxt(i, n)]), dist(D[i], D[prv(i, n)]))
  return Math.max(10, Math.min(max, m * 0.26))
}

