/**
 * Plane geometry for beat lessons. Screen coordinates: x right, y DOWN, in
 * CSS pixels of the stage. Angles in radians unless a name says Deg.
 */

export type Vec = [number, number]
export type Rect = { x0: number; y0: number; x1: number; y1: number }

export const DEG = 180 / Math.PI
export const RAD = Math.PI / 180

export const add = (a: Vec, b: Vec): Vec => [a[0] + b[0], a[1] + b[1]]
export const sub = (a: Vec, b: Vec): Vec => [a[0] - b[0], a[1] - b[1]]
export const mul = (a: Vec, k: number): Vec => [a[0] * k, a[1] * k]
export const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1]
export const cross = (a: Vec, b: Vec) => a[0] * b[1] - a[1] * b[0]
export const len = (a: Vec) => Math.hypot(a[0], a[1])
export const dist = (a: Vec, b: Vec) => Math.hypot(a[0] - b[0], a[1] - b[1])
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const lerpV = (a: Vec, b: Vec, t: number): Vec => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
export const unit = (a: Vec): Vec => { const l = len(a) || 1; return [a[0] / l, a[1] / l] }
export const dir = (t: number): Vec => [Math.cos(t), Math.sin(t)]
export const clampToRect = (p: Vec, r: Rect): Vec => [clamp(p[0], r.x0, r.x1), clamp(p[1], r.y0, r.y1)]

/** Smooth start and stop, for timed animations. */
export const ease = (t: number) => { const x = clamp(t, 0, 1); return x * x * (3 - 2 * x) }

/** Interior angle at corner i of a triangle, in degrees. */
export function angleAt(P: Vec[], i: number): number {
  const a = P[i]
  const u = sub(P[(i + 1) % 3], a)
  const v = sub(P[(i + 2) % 3], a)
  return Math.abs(Math.atan2(cross(u, v), dot(u, v))) * DEG
}

export const anglesOf = (P: Vec[]) => [angleAt(P, 0), angleAt(P, 1), angleAt(P, 2)]

/**
 * Whole-degree angles that still add up to exactly 180. Rounding each one
 * on its own can show 61 + 48 + 70 = 179, which would wreck the one fact
 * this lesson exists to teach. Largest-remainder rounding never does.
 */
export function wholeAngles(P: Vec[]): number[] {
  const a = anglesOf(P)
  const fl = a.map(Math.floor)
  const rem = 180 - fl.reduce((s, x) => s + x, 0)
  const order = a.map((x, i) => [x - fl[i], i] as const).sort((p, q) => q[0] - p[0])
  for (let k = 0; k < rem && k < 3; k++) fl[order[k][1]]++
  return fl
}

/** The wedge at corner i: where it starts and how far it sweeps (always positive). */
export function wedgeAt(P: Vec[], i: number): { c: Vec; start: number; sweep: number } {
  const a = P[i]
  const u = sub(P[(i + 1) % 3], a)
  const v = sub(P[(i + 2) % 3], a)
  const au = Math.atan2(u[1], u[0])
  const s = Math.atan2(cross(u, v), dot(u, v))
  return s >= 0 ? { c: a, start: au, sweep: s } : { c: a, start: au + s, sweep: -s }
}

/** Filled sector as a sampled path. Never SVG arc flags. */
export function sectorPath(c: Vec, start: number, sweep: number, r: number, steps = 28): string {
  let d = `M ${c[0].toFixed(1)} ${c[1].toFixed(1)}`
  for (let k = 0; k <= steps; k++) {
    const t = start + (sweep * k) / steps
    d += ` L ${(c[0] + r * Math.cos(t)).toFixed(1)} ${(c[1] + r * Math.sin(t)).toFixed(1)}`
  }
  return d + " Z"
}

/** Just the curved edge of a sector. */
export function arcPath(c: Vec, start: number, sweep: number, r: number, steps = 28): string {
  let d = ""
  for (let k = 0; k <= steps; k++) {
    const t = start + (sweep * k) / steps
    d += `${k ? " L" : "M"} ${(c[0] + r * Math.cos(t)).toFixed(1)} ${(c[1] + r * Math.sin(t)).toFixed(1)}`
  }
  return d
}

export function area(P: Vec[]): number {
  return Math.abs(cross(sub(P[1], P[0]), sub(P[2], P[0]))) / 2
}

export function bbox(P: Vec[]): Rect {
  const xs = P.map(p => p[0]), ys = P.map(p => p[1])
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) }
}

export const centroid = (P: Vec[]): Vec => [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3]

/**
 * Move and scale a shape so it sits inside a rect. Only shrinks it, unless
 * it is smaller than `minSize`, so the student's own triangle keeps the
 * size they drew wherever it fits.
 */
export function fitInto(P: Vec[], r: Rect, { minSize = 0, maxSize = Infinity } = {}): Vec[] {
  const b = bbox(P)
  const bw = Math.max(1, b.x1 - b.x0), bh = Math.max(1, b.y1 - b.y0)
  const rw = Math.max(1, r.x1 - r.x0), rh = Math.max(1, r.y1 - r.y0)
  let k = Math.min(1, rw / bw, rh / bh)
  const big = Math.max(bw, bh) * k
  if (big < minSize) k *= Math.min(minSize / big, rw / (bw * k), rh / (bh * k))
  if (Math.max(bw, bh) * k > maxSize) k = maxSize / Math.max(bw, bh)
  const c: Vec = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]
  let out = P.map(p => add(mul(sub(p, c), k), c))
  // then slide it in, without moving it if it already fits
  const nb = bbox(out)
  let dx = 0, dy = 0
  if (nb.x0 < r.x0) dx = r.x0 - nb.x0
  else if (nb.x1 > r.x1) dx = r.x1 - nb.x1
  if (nb.y0 < r.y0) dy = r.y0 - nb.y0
  else if (nb.y1 > r.y1) dy = r.y1 - nb.y1
  out = out.map(p => [p[0] + dx, p[1] + dy] as Vec)
  return out
}

/** Centre a shape in a rect and scale it to fill most of it. */
export function centreIn(P: Vec[], r: Rect, maxSize: number): Vec[] {
  const b = bbox(P)
  const bw = Math.max(1, b.x1 - b.x0), bh = Math.max(1, b.y1 - b.y0)
  const k = Math.min((r.x1 - r.x0) * 0.92 / bw, (r.y1 - r.y0) * 0.92 / bh, maxSize / Math.max(bw, bh))
  const c: Vec = [(b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2]
  const rc: Vec = [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2]
  return P.map(p => add(mul(sub(p, c), k), rc))
}

/**
 * A triangle with chosen angles. Corners `left` and `right` sit on a
 * horizontal base, `apex` above it. Returned in unit space; place it with
 * centreIn.
 */
export function triFromAngles(deg: number[], order: { left: number; right: number; apex: number }): Vec[] {
  const a = deg[order.left] * RAD, b = deg[order.right] * RAD
  const L: Vec = [0, 0], R: Vec = [1, 0]
  const side = Math.sin(b) / Math.sin(a + b)
  const A: Vec = [side * Math.cos(a), -side * Math.sin(a)]
  const out: Vec[] = [[0, 0], [0, 0], [0, 0]]
  out[order.left] = L
  out[order.right] = R
  out[order.apex] = A
  return out
}

/** Project p onto the line through a with direction d. */
export function projectOnLine(p: Vec, a: Vec, d: Vec): Vec {
  const u = unit(d)
  return add(a, mul(u, dot(sub(p, a), u)))
}

/** Rotate p about c by t radians. */
export function rotateAbout(p: Vec, c: Vec, t: number): Vec {
  const v = sub(p, c), cs = Math.cos(t), sn = Math.sin(t)
  return [c[0] + v[0] * cs - v[1] * sn, c[1] + v[0] * sn + v[1] * cs]
}

/** Shortest signed turn from angle a to angle b. */
export function turn(a: number, b: number): number {
  let d = (b - a) % (2 * Math.PI)
  if (d > Math.PI) d -= 2 * Math.PI
  if (d < -Math.PI) d += 2 * Math.PI
  return d
}

/**
 * Apex position on the far side of base j-k from a reference point, so the
 * corners at j and k get the requested angles.
 */
export function apexFor(Pj: Vec, Pk: Vec, angJDeg: number, angKDeg: number, sideRef: Vec): Vec {
  const base = sub(Pk, Pj)
  const L = len(base)
  const a = angJDeg * RAD, b = angKDeg * RAD
  const s = (L * Math.sin(b)) / Math.sin(a + b)
  const ub = unit(base)
  let n: Vec = [-ub[1], ub[0]]
  if (dot(sub(sideRef, Pj), n) < 0) n = [-n[0], -n[1]]
  return add(Pj, add(mul(ub, s * Math.cos(a)), mul(n, s * Math.sin(a))))
}
