/**
 * A sheet through a solid (4.5, planes of symmetry): a round pane of glass
 * through the middle of the solid's corners. It turns round the up axis
 * (`phi`) and tips over (`tau`, 0 upright, 90 flat), each by its own knob on
 * its rim. Between them they reach every plane through the middle.
 *
 * A plane of symmetry is where the solid's mirror image in the sheet lands on
 * the solid itself. For a solid with flat faces that is where its corners
 * mirror onto its corners (it is the shape round them); a curved solid says
 * for itself (`curvedFits`).
 */

import type { Vec } from "../geometry"
import { type Scene, type V3, type Handle, vadd, vsub, vmul, vdot, vlen, vunit, vlerp, proj } from "./scene"
import type { Curved } from "./solids"

const RAD = Math.PI / 180

export interface Sheet {
  /** it always passes through here */
  c: V3
  /** its radius (it reaches a little past the solid all round) */
  r: number
  /** where it is going (degrees) */
  phi: number
  tau: number
  /** as drawn */
  phiD: number
  tauD: number
  /** the planes it clicks into, by their normals (some match, some do not) */
  snaps: V3[]
  /** the plane it is clicked into now (null: none) */
  at: V3 | null
  /** whether the solid mirrors onto itself in a plane */
  fits: (n: V3) => boolean
  /** a curved solid: the sheet is green wherever it matches, clicked or not */
  live?: boolean
  /** the mirror copy of the solid: how far it has gone through the sheet (0 to 1) */
  e: number
  /** planes of symmetry found so far, kept on the solid (their normals) */
  found: V3[]
  /** the knobs a beat lets the student drag */
  knobs: ("turn" | "tip")[]
  /** hide the sheet (only the planes found stay) */
  hidden?: boolean
}

// ── the sheet's directions ───────────────────────────────────────────────

/** The way the sheet faces (its normal). */
export const normalOf = (phi: number, tau: number): V3 => [Math.cos(tau * RAD) * Math.cos(phi * RAD), Math.cos(tau * RAD) * Math.sin(phi * RAD), -Math.sin(tau * RAD)]
/** Along the sheet, level with the floor: the turn knob sits this way. */
export const sideOf = (phi: number): V3 => [-Math.sin(phi * RAD), Math.cos(phi * RAD), 0]
/** Along the sheet, up it: the tip knob sits this way. */
export const upOf = (phi: number, tau: number): V3 => [Math.sin(tau * RAD) * Math.cos(phi * RAD), Math.sin(tau * RAD) * Math.sin(phi * RAD), Math.cos(tau * RAD)]

/** The same plane: normals along the same line. */
export const samePlane = (a: V3, b: V3, deg = 0.5) => Math.abs(vdot(vunit(a), vunit(b))) > Math.cos(deg * RAD)

/** A point's mirror image in the plane through c facing n. */
export function mirror3(p: V3, c: V3, n: V3): V3 {
  const u = vunit(n)
  return vsub(p, vmul(u, 2 * vdot(vsub(p, c), u)))
}

/** The middle of a set of points. */
export const middleOf = (P: V3[]): V3 => vmul(P.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / Math.max(1, P.length))

/** Whether a set of points mirrors onto itself in the plane through c facing n. */
export function pointsFit(P: V3[], c: V3, n: V3): boolean {
  const size = Math.max(1e-9, ...P.map(p => vlen(vsub(p, c))))
  return P.every(p => { const q = mirror3(p, c, n); return P.some(s => vlen(vsub(s, q)) < 1e-4 * size) })
}

/** Every plane of symmetry of a set of points (each mirrors some corner onto another), by its normal. */
export function planesOf(P: V3[]): V3[] {
  const c = middleOf(P), out: V3[] = []
  for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
    const d = vsub(P[j], P[i])
    if (vlen(d) < 1e-9) continue
    const n = vunit(d)
    if (out.some(m => samePlane(m, n, 0.05))) continue
    if (pointsFit(P, c, n)) out.push(n)
  }
  return out
}

/** A curved solid standing on the floor mirrors onto itself in every upright plane through its axis; a cylinder also in the level one halfway up. */
export function curvedFits(c: Curved, n: V3): boolean {
  const u = vunit(n)
  if (Math.abs(u[2]) < 1e-6) return true
  if (Math.abs(Math.abs(u[2]) - 1) < 1e-6) return c.kind === "cylinder" || c.kind === "sphere"
  return c.kind === "sphere"
}

/** The two ways the sheet can show a plane: turned and tipped (a level plane is either end of the tip, at any turn). */
export function anglesOf(n: V3): { phi: number | null; tau: number }[] {
  const u = vunit(n)
  if (Math.abs(u[2]) > 0.99999) return [{ phi: null, tau: 90 }, { phi: null, tau: -90 }]
  const phi = ((Math.atan2(u[1], u[0]) / RAD) % 360 + 360) % 360, tau = Math.asin(Math.max(-1, Math.min(1, -u[2]))) / RAD
  return [{ phi, tau }, { phi: (phi + 180) % 360, tau: -tau }]
}

/** Degrees between two turns, the short way round. */
export const angGap = (a: number, b: number) => Math.abs((((a - b) % 360) + 540) % 360 - 180)

// ── where the sheet cuts the solid ──────────────────────────────────────

/** Where the plane through c facing n crosses a solid's edges, in order round c (the outline of the cut). */
export function cutOf(P: V3[], edges: [number, number][], c: V3, n: V3): V3[] {
  const u = vunit(n), side = (p: V3) => vdot(vsub(p, c), u)
  const out: V3[] = []
  const size = Math.max(1e-9, ...P.map(p => vlen(vsub(p, c))))
  for (const [i, j] of edges) {
    const a = side(P[i]), b = side(P[j])
    if (Math.abs(a) < 1e-6 * size) { out.push(P[i]); continue }
    if (Math.abs(b) < 1e-6 * size) continue
    if ((a < 0) !== (b < 0)) out.push(vlerp(P[i], P[j], a / (a - b)))
  }
  // a corner on the plane is met by several edges: once is enough
  const pts = out.filter((p, k) => out.findIndex(q => vlen(vsub(p, q)) < 1e-6 * size) === k)
  if (pts.length < 3) return []
  // in order round their middle, in the sheet's own two directions
  const m = middleOf(pts)
  const e1 = vunit(Math.abs(u[2]) > 0.9 ? [1, 0, 0] : vsub([0, 0, 1], vmul(u, u[2])))
  const e2: V3 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]]
  return pts.map(p => ({ p, a: Math.atan2(vdot(vsub(p, m), e2), vdot(vsub(p, m), e1)) })).sort((x, y) => x.a - y.a).map(x => x.p)
}

/** A curved solid as corners and edges, for its cut: rings round it, joined up and down (a cone's top is one point). */
export function curvedMesh(c: Curved, n = 48): { P: V3[]; edges: [number, number][] } {
  const ringAt = (r: number, z: number): V3[] => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n), z])
  // turned half a step, so an upright cut through the axis never runs along an edge
  const P: V3[] = [...ringAt(c.r, 0)].map(p => turnZ(p, Math.PI / n)), edges: [number, number][] = []
  for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n])
  if (c.kind === "cone") {
    P.push([0, 0, c.h])
    for (let i = 0; i < n; i++) edges.push([i, n])
  } else {
    const top = c.kind === "frustum" ? c.r2 ?? c.r / 2 : c.r
    P.push(...ringAt(top, c.h).map(p => turnZ(p, Math.PI / n)))
    for (let i = 0; i < n; i++) { edges.push([n + i, n + ((i + 1) % n)]); edges.push([i, n + i]) }
  }
  return { P, edges }
}
const turnZ = (p: V3, a: number): V3 => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a), p[2]]

// ── the knobs ────────────────────────────────────────────────────────────

/** Where each knob is (as drawn). */
export const turnKnob = (sh: Sheet): V3 => vadd(sh.c, vmul(sideOf(sh.phiD), sh.r))
export const tipKnob = (sh: Sheet): V3 => vadd(sh.c, vmul(upOf(sh.phiD, sh.tauD), sh.r))

/** How far a knob would be from the finger with the sheet at these angles (a small pull toward where it is, so it never jumps across). */
function bestAngle(S: Scene, finger: Vec, from: number, lo: number, hi: number, at: (a: number) => V3, wrap: boolean): number {
  const score = (a: number) => {
    const p = proj(S, at(a))
    return Math.hypot(p[0] - finger[0], p[1] - finger[1]) + 0.08 * (wrap ? angGap(a, from) : Math.abs(a - from))
  }
  let best = from, bs = score(from)
  for (let a = lo; a <= hi; a += 2) { const s = score(a); if (s < bs) { bs = s; best = a } }
  for (const step of [1, 0.5, 0.25]) for (const a of [best - step, best + step]) {
    const b = wrap ? ((a % 360) + 360) % 360 : Math.max(lo, Math.min(hi, a))
    const s = score(b)
    if (s < bs) { bs = s; best = b }
  }
  return best
}

/** Within this many degrees of a plane it clicks in. */
export const SNAP = 7

/**
 * The knobs on the board: the turn knob slides round the sheet's level line
 * (it turns round the up axis), the tip knob over its top (it tips over).
 * Each clicks into a plane in `snaps` that it can reach from where the other
 * one has left it.
 */
export function sheetHandles(S: Scene): Handle[] {
  const sh = S.sheet
  if (!sh) return []
  const out: Handle[] = []
  if (sh.knobs.includes("turn")) out.push({
    id: "sheet-turn",
    at: S2 => turnKnob(S2.sheet!),
    axis: [0, 0, 1],
    axisAt: S2 => vmul(normalOf(S2.sheet!.phiD, 0), -1),
    move: () => {},
    place: (S2, finger) => {
      const s = S2.sheet!
      let phi = bestAngle(S2, finger, s.phi, 0, 358, a => vadd(s.c, vmul(sideOf(a), s.r)), true)
      for (const m of s.snaps) for (const rep of anglesOf(m)) {
        if (rep.phi === null || Math.abs(rep.tau - s.tau) > 0.5) continue
        if (angGap(phi, rep.phi) < SNAP) phi = rep.phi
      }
      s.phi = phi
    },
  })
  if (sh.knobs.includes("tip")) out.push({
    id: "sheet-tip",
    at: S2 => tipKnob(S2.sheet!),
    axis: [0, 0, 1],
    axisAt: S2 => { const s = S2.sheet!; return vunit(vsub(upOf(s.phiD, s.tauD + 1), upOf(s.phiD, s.tauD - 1))) },
    move: () => {},
    place: (S2, finger) => {
      const s = S2.sheet!
      let tau = bestAngle(S2, finger, s.tau, -90, 90, a => vadd(s.c, vmul(upOf(s.phi, a), s.r)), false)
      for (const m of s.snaps) for (const rep of anglesOf(m)) {
        if (rep.phi !== null && angGap(rep.phi, s.phi) > 0.5) continue
        if (Math.abs(tau - rep.tau) < SNAP) tau = rep.tau
      }
      s.tau = tau
    },
  })
  return out
}

/** A new sheet through the middle of a solid's corners, reaching a little past the furthest one. */
export function makeSheet(P: V3[], o: { phi?: number; tau?: number; fits?: (n: V3) => boolean; c?: V3; r?: number; knobs?: ("turn" | "tip")[]; snaps?: V3[] } = {}): Sheet {
  const c = o.c ?? middleOf(P)
  const r = o.r ?? 1.14 * Math.max(...P.map(p => vlen(vsub(p, c))))
  const phi = o.phi ?? 0, tau = o.tau ?? 0
  return { c, r, phi, tau, phiD: phi, tauD: tau, snaps: o.snaps ?? [], at: null, fits: o.fits ?? (n => pointsFit(P, c, n)), e: 0, found: [], knobs: o.knobs ?? [] }
}
