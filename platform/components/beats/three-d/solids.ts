/**
 * Solids with curved surfaces, and nets that fold up into solids, for the
 * 3D board (4.1 Solids and nets).
 *
 * A curved solid stands on the floor with its axis straight up: a cylinder,
 * cone, frustum, sphere or hemisphere. It is drawn from rings of points:
 * its outline is the shape round all of them, and each ring is solid where
 * it can be seen and dashed where it is round the back.
 *
 * A net is a set of flat faces, each hinged to one other along a shared
 * edge. Unfolded (t = 0) they lie flat on the floor; folded (t = 1) each has
 * turned up about its hinge by its own angle, carried along by the faces it
 * hangs from, so they close into the solid.
 */

import type { Vec } from "../geometry"
import { type V3, vadd, vsub, vmul, vdot, vcross, vunit } from "./scene"

// ── curved solids ────────────────────────────────────────────────────────

export type CurvedKind = "cylinder" | "cone" | "frustum" | "sphere" | "hemisphere"
export interface Curved { kind: CurvedKind; r: number; h: number; r2?: number; /** its top filled in this colour (a cylinder's cross-section) */ lit?: string }

const N = 64

/** A ring round the up axis at a height, radius r. */
export const ring = (r: number, z: number, n = N): V3[] => Array.from({ length: n }, (_, i) => { const a = (2 * Math.PI * i) / n; return [r * Math.cos(a), r * Math.sin(a), z] as V3 })

/** The points that bound a curved solid (for fitting the view round it). */
export function curvedBounds(c: Curved): V3[] {
  if (c.kind === "sphere") return [[c.r, 0, c.r], [-c.r, 0, c.r], [0, c.r, c.r], [0, -c.r, c.r], [0, 0, 0], [0, 0, 2 * c.r]]
  if (c.kind === "hemisphere") return [[c.r, 0, 0], [-c.r, 0, 0], [0, c.r, 0], [0, -c.r, 0], [0, 0, c.r]]
  const top = c.kind === "cone" ? 0 : c.kind === "frustum" ? c.r2 ?? c.r / 2 : c.r
  return [[c.r, 0, 0], [-c.r, 0, 0], [0, c.r, 0], [0, -c.r, 0], [top, 0, c.h], [-top, 0, c.h], [0, top, c.h], [0, -top, c.h], [0, 0, c.h]]
}

/**
 * The rings a curved solid is drawn from, each with the outward normal of
 * the surface it bounds at each point (to tell the front of a ring from the
 * back) and the normal of its flat face (null: none).
 */
export function curvedRings(c: Curved): { pts: V3[]; side: V3[]; cap: V3 | null }[] {
  const side = (r: number, z: number, slope: number) => ring(r, z).map(p => vunit([p[0], p[1], slope * Math.hypot(p[0], p[1])] as V3))
  if (c.kind === "cylinder") return [{ pts: ring(c.r, 0), side: side(c.r, 0, 0), cap: [0, 0, -1] }, { pts: ring(c.r, c.h), side: side(c.r, c.h, 0), cap: [0, 0, 1] }]
  if (c.kind === "cone") return [{ pts: ring(c.r, 0), side: side(c.r, 0, c.r / c.h), cap: [0, 0, -1] }]
  if (c.kind === "frustum") {
    const r2 = c.r2 ?? c.r / 2, s = (c.r - r2) / c.h
    return [{ pts: ring(c.r, 0), side: side(c.r, 0, s), cap: [0, 0, -1] }, { pts: ring(r2, c.h), side: side(r2, c.h, s), cap: [0, 0, 1] }]
  }
  if (c.kind === "hemisphere") return [{ pts: ring(c.r, 0), side: side(c.r, 0, 0), cap: [0, 0, -1] }]
  // a sphere: its middle ring, on the sphere all round
  return [{ pts: ring(c.r, c.r), side: side(c.r, c.r, 0), cap: null }]
}

/** Points spread over a curved solid's surface: the shape round them on screen is its outline. */
export function curvedCloud(c: Curved): V3[] {
  const out: V3[] = []
  if (c.kind === "sphere" || c.kind === "hemisphere") {
    const z0 = c.kind === "sphere" ? c.r : 0
    for (let i = 0; i <= 16; i++) {
      const th = c.kind === "sphere" ? -Math.PI / 2 + (Math.PI * i) / 16 : (Math.PI / 2 * i) / 16
      out.push(...ring(c.r * Math.cos(th), z0 + c.r * Math.sin(th), 48))
    }
    return out
  }
  out.push(...ring(c.r, 0))
  if (c.kind === "cone") out.push([0, 0, c.h])
  else out.push(...ring(c.kind === "frustum" ? c.r2 ?? c.r / 2 : c.r, c.h))
  return out
}

/** The shape round a set of screen points (convex hull, anticlockwise). */
export function hull(P: Vec[]): Vec[] {
  const pts = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (pts.length < 3) return pts
  const crossZ = (o: Vec, a: Vec, b: Vec) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: Vec[] = [], upper: Vec[] = []
  for (const p of pts) { while (lower.length >= 2 && crossZ(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p) }
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && crossZ(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p) }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)]
}

// ── a cylinder unrolling ─────────────────────────────────────────────────

/**
 * A cylinder's curved face as it unrolls about its front line (y = -r):
 * a point s along its edge from that line lies on a circle of radius
 * r / (1 - u), which grows until the face is flat (u = 1). Its circles turn
 * about their front edges, up and down, into the plane of the flat face.
 * Strips of the face (each four corners), the two circles, and where the
 * flat face's corners are.
 */
export function unrollGeom(r: number, h: number, u: number, cap: number, n = 48): { strips: V3[][]; top: V3[]; bottom: V3[] } {
  const at = (s: number, z: number): V3 => {
    if (u > 0.999) return [s, -r, z]
    const R = r / (1 - u), a = s / R
    return [R * Math.sin(a), -r + R - R * Math.cos(a), z]
  }
  const strips: V3[][] = []
  for (let i = 0; i < n; i++) {
    const s0 = -Math.PI * r + (2 * Math.PI * r * i) / n, s1 = -Math.PI * r + (2 * Math.PI * r * (i + 1)) / n
    strips.push([at(s0, 0), at(s1, 0), at(s1, h), at(s0, h)])
  }
  // a circle turned about the line along x through its front point, by `deg` (up for the top, down for the bottom)
  const disc = (z: number, deg: number): V3[] => ring(r, 0, 64).map(p => {
    const y = p[1] + r, t = (deg * Math.PI) / 180
    return [p[0], -r + y * Math.cos(t), z + y * Math.sin(t)] as V3
  })
  return { strips, top: disc(h, 90 * cap), bottom: disc(0, -90 * cap) }
}

// ── nets ─────────────────────────────────────────────────────────────────

/**
 * A face of a net: its corners where it lies flat (x, y on the floor), the
 * face it is hinged to and the two of its corners on that hinge, and how far
 * it turns up when folded (degrees).
 */
export interface NetFace { id: string; flat: Vec[]; parent?: string; hinge?: [number, number]; angle?: number }
export interface Net { faces: NetFace[] }

/** A turn about a line, then a move: where a point goes. */
type Xf = (p: V3) => V3
const rotateAbout = (a: V3, axis: V3, th: number): Xf => p => {
  // Rodrigues' formula about the line through a along axis
  const k = vunit(axis), v = vsub(p, a), c = Math.cos(th), s = Math.sin(th)
  return vadd(a, vadd(vadd(vmul(v, c), vmul(vcross(k, v), s)), vmul(k, vdot(k, v) * (1 - c))))
}

/**
 * Each face's corners in the world with the net folded a fraction t of the
 * way. A face turns about its hinge (where it lies flat), the way that takes
 * it up off its parent, then goes wherever its parent went.
 */
export function foldNet(net: Net, t: number): Record<string, V3[]> {
  const byId = Object.fromEntries(net.faces.map(f => [f.id, f]))
  const xf: Record<string, Xf> = {}
  const get = (id: string): Xf => {
    if (xf[id]) return xf[id]
    const f = byId[id]
    if (!f.parent || !f.hinge) return (xf[id] = p => p)
    const a: V3 = [...f.flat[f.hinge[0]], 0] as V3, b: V3 = [...f.flat[f.hinge[1]], 0] as V3
    const axis = vsub(b, a)
    const mid: V3 = [f.flat.reduce((s, p) => s + p[0], 0) / f.flat.length, f.flat.reduce((s, p) => s + p[1], 0) / f.flat.length, 0]
    // the way round that lifts the face up off the floor
    const up = rotateAbout(a, axis, 0.1)(mid)[2] > 0 ? 1 : -1
    const turn = rotateAbout(a, axis, up * ((f.angle ?? 90) * Math.PI / 180) * t)
    const parent = get(f.parent)
    return (xf[id] = p => parent(turn(p)))
  }
  const out: Record<string, V3[]> = {}
  for (const f of net.faces) { const T = get(f.id); out[f.id] = f.flat.map(p => T([p[0], p[1], 0])) }
  return out
}

/** Every corner a net reaches flat and folded (the folded solid sits on the flat net, so the view fits round both). */
export function netBounds(net: Net): V3[] {
  return [0, 1].flatMap(t => Object.values(foldNet(net, t)).flat())
}

// ── the nets in the lesson ───────────────────────────────────────────────

const rect = (x: number, y: number, w: number, h: number): Vec[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

/** A cube's net: a cross of six squares. */
export function cubeNet(s = 2): Net {
  return {
    faces: [
      { id: "base", flat: rect(0, 0, s, s) },
      { id: "front", flat: rect(0, -s, s, s), parent: "base", hinge: [3, 2] },
      { id: "back", flat: rect(0, s, s, s), parent: "base", hinge: [0, 1] },
      { id: "left", flat: rect(-s, 0, s, s), parent: "base", hinge: [1, 2] },
      { id: "right", flat: rect(s, 0, s, s), parent: "base", hinge: [0, 3] },
      { id: "top", flat: rect(0, 2 * s, s, s), parent: "back", hinge: [0, 1] },
    ],
  }
}

/**
 * The cuboid's net from 4024/12/O/N/21 Q4: four long faces in a column (l by
 * w, l by h, l by w, l by h), one end off the top face's left side and the
 * other off the bottom face's right side.
 */
export function cuboidNet(l = 3, w = 1.6, h = 1): Net {
  return {
    faces: [
      { id: "f1", flat: rect(0, -w, l, w) },
      { id: "f2", flat: rect(0, -w - h, l, h), parent: "f1", hinge: [3, 2] },
      { id: "f3", flat: rect(0, -2 * w - h, l, w), parent: "f2", hinge: [3, 2] },
      { id: "f4", flat: rect(0, -2 * w - 2 * h, l, h), parent: "f3", hinge: [3, 2] },
      { id: "e1", flat: rect(-h, -w, h, w), parent: "f1", hinge: [1, 2] },
      { id: "e2", flat: rect(l, -2 * w - 2 * h, w, h), parent: "f4", hinge: [0, 3] },
    ],
  }
}

/** A square-based pyramid's net: a square with a triangle on each side. Its triangles meet at the top when folded. */
export function pyramidNet(s = 2, slant = 2.4): Net {
  const h2 = s / 2
  // each triangle turns up until its tip is over the middle of the square
  const ang = 180 - Math.acos(Math.min(1, h2 / slant)) * 180 / Math.PI
  return {
    faces: [
      { id: "base", flat: rect(0, 0, s, s) },
      { id: "t1", flat: [[0, 0], [s, 0], [h2, -slant]], parent: "base", hinge: [0, 1], angle: ang },
      { id: "t2", flat: [[s, 0], [s, s], [s + slant, h2]], parent: "base", hinge: [0, 1], angle: ang },
      { id: "t3", flat: [[s, s], [0, s], [h2, s + slant]], parent: "base", hinge: [0, 1], angle: ang },
      { id: "t4", flat: [[0, s], [0, 0], [-slant, h2]], parent: "base", hinge: [0, 1], angle: ang },
    ],
  }
}

/**
 * A triangular prism's net from 4024/12/O/N/21 Q4: three rectangles in a row
 * with a right-angled triangle on the middle one's top and bottom. The middle
 * one is the floor, the right one stands up and the left one leans over to
 * meet it.
 */
export function prismNet(a = 1.6, b = 1.4, len = 2.2): Net {
  const c = Math.hypot(a, b), lean = 180 - Math.atan2(b, a) * 180 / Math.PI
  return {
    faces: [
      { id: "mid", flat: rect(0, 0, a, len) },
      { id: "right", flat: rect(a, 0, b, len), parent: "mid", hinge: [0, 3], angle: 90 },
      { id: "left", flat: rect(-c, 0, c, len), parent: "mid", hinge: [1, 2], angle: lean },
      { id: "top", flat: [[0, len], [a, len], [a, len + b]], parent: "mid", hinge: [0, 1], angle: 90 },
      { id: "bottom", flat: [[a, 0], [0, 0], [a, -b]], parent: "mid", hinge: [0, 1], angle: 90 },
    ],
  }
}

/**
 * Any prism's net as a strip: its cross-section `end` (anticlockwise, in x
 * and z, its first side along the bottom from the origin) gives one
 * rectangle per side, `len` long, in a row along x; each folds up off the
 * last by the turn at that corner, and an end is hinged to each long edge
 * of the first. Folded, the prism lies along y with that first side on the
 * floor. Faces: r0, r1, ... and endA (at y = 0), endB (at y = len). With
 * `open`, that side has no face (an open top): the sides before it go off
 * to the right of the first and the ones after it off to the left.
 */
export function stripNet(end: Vec[], len: number, open?: number): Net {
  const n = end.length
  const side = (i: number) => Math.hypot(end[(i + 1) % n][0] - end[i][0], end[(i + 1) % n][1] - end[i][1])
  const dir = (i: number) => Math.atan2(end[(i + 1) % n][1] - end[i][1], end[(i + 1) % n][0] - end[i][0])
  // the turn at corner i, from side i - 1 to side i (degrees, 0 to 180)
  const turn = (i: number) => ((((dir(i) - dir((i + n - 1) % n)) * 180) / Math.PI) % 360 + 360) % 360
  const faces: NetFace[] = [{ id: "r0", flat: rect(0, 0, side(0), len) }]
  const stop = open ?? n
  let x = side(0)
  for (let i = 1; i < stop; i++) {
    faces.push({ id: `r${i}`, flat: rect(x, 0, side(i), len), parent: `r${i - 1}`, hinge: [0, 3], angle: turn(i) })
    x += side(i)
  }
  if (open !== undefined) {
    // the rest go the other way, each hinged by its right-hand edge to the one after it
    let xl = 0
    for (let i = n - 1; i > open; i--) {
      faces.push({ id: `r${i}`, flat: rect(xl - side(i), 0, side(i), len), parent: i === n - 1 ? "r0" : `r${i + 1}`, hinge: [1, 2], angle: turn((i + 1) % n) })
      xl -= side(i)
    }
  }
  // the ends, flat beside the first rectangle's two long edges: the cross-section as it is, mirrored for the near one
  faces.push({ id: "endA", flat: end.map(p => [p[0], -p[1]] as Vec), parent: "r0", hinge: [0, 1], angle: 90 })
  faces.push({ id: "endB", flat: end.map(p => [p[0], len + p[1]] as Vec), parent: "r0", hinge: [0, 1], angle: 90 })
  return { faces }
}

// ── nets made on a grid ──────────────────────────────────────────────────

/**
 * A net from squares on a grid (`cells` in face units, each `k` cm): every
 * face is hinged to one next to it that is nearer the first (a tree, found
 * outwards from `base`), and folds up 90°. Faces are named by their cell.
 */
export function netFromCells(cells: [number, number][], k: number, base = 0): Net {
  const key = (c: [number, number]) => `c${c[0]}_${c[1]}`
  const has = new Map(cells.map(c => [key(c), c] as const))
  const faces: NetFace[] = []
  const seen = new Set<string>()
  const queue: { c: [number, number]; parent?: [number, number] }[] = cells.length ? [{ c: cells[base] }] : []
  while (queue.length) {
    const { c, parent } = queue.shift()!
    if (seen.has(key(c))) continue
    seen.add(key(c))
    const [i, j] = c, x0 = i * k, y0 = j * k
    const flat: Vec[] = [[x0, y0], [x0 + k, y0], [x0 + k, y0 + k], [x0, y0 + k]]
    let hinge: [number, number] | undefined
    if (parent) {
      // the edge it shares with the face it hangs from
      if (parent[0] === i - 1) hinge = [0, 3]
      else if (parent[0] === i + 1) hinge = [1, 2]
      else if (parent[1] === j - 1) hinge = [0, 1]
      else hinge = [3, 2]
    }
    faces.push({ id: key(c), flat, parent: parent ? key(parent) : undefined, hinge, angle: 90 })
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const n: [number, number] = [i + d[0], j + d[1]]
      if (has.has(key(n)) && !seen.has(key(n))) queue.push({ c: n, parent: c })
    }
  }
  return { faces }
}

/** Faces of a folded net that land on the same place as another (the middles of their corners agree). */
export function clashes(net: Net): string[] {
  const F = foldNet(net, 1)
  const mid = (P: V3[]): V3 => [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length, P.reduce((s, p) => s + p[2], 0) / P.length]
  const ids = Object.keys(F), out = new Set<string>()
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
    const p = mid(F[ids[a]]), q = mid(F[ids[b]])
    if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-6) { out.add(ids[a]); out.add(ids[b]) }
  }
  return [...out]
}

/**
 * The net from 4024/21/O/N/25 Q3: a row of four faces (3, 5.2, 3 and 5.2
 * wide, 4.7 tall) with a 3 by 5.2 face above and below the third. Folded on
 * that third face, it is the cuboid W25 (3 by 4.7, 5.2 high).
 */
export function w25Net(a = 3, b = 5.2, h = 4.7): Net {
  const R = (x: number, y: number, w: number, hh: number) => rect(x - a / 2, y - h / 2, w, hh)
  return {
    faces: [
      { id: "mid", flat: R(0, 0, a, h) },
      { id: "right", flat: R(a, 0, b, h), parent: "mid", hinge: [0, 3] },
      { id: "left", flat: R(-b, 0, b, h), parent: "mid", hinge: [1, 2] },
      { id: "end", flat: R(-b - a, 0, a, h), parent: "left", hinge: [1, 2] },
      { id: "top", flat: R(0, h, a, b), parent: "mid", hinge: [0, 1] },
      { id: "bottom", flat: R(0, -b, a, b), parent: "mid", hinge: [3, 2] },
    ],
  }
}

