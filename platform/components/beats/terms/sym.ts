/**
 * Symmetry of a figure on the terms board: whether a reflection in a line,
 * or a turn about a point, puts every part of it back where a part like it
 * was. A figure is a set of shapes (each shaded or not) and lines.
 */

import type { Vec } from "../geometry"

export type Item = { kind: "poly"; pts: Vec[]; fill?: boolean } | { kind: "seg"; a: Vec; b: Vec }

const RAD = Math.PI / 180

/** A point reflected in the line through c at an angle (degrees). */
export function reflect(p: Vec, c: Vec, deg: number): Vec {
  const t = 2 * deg * RAD, x = p[0] - c[0], y = p[1] - c[1]
  return [c[0] + x * Math.cos(t) + y * Math.sin(t), c[1] + x * Math.sin(t) - y * Math.cos(t)]
}
/** A point turned about c (degrees, anticlockwise). */
export function rotate(p: Vec, c: Vec, deg: number): Vec {
  const t = deg * RAD, x = p[0] - c[0], y = p[1] - c[1]
  return [c[0] + x * Math.cos(t) - y * Math.sin(t), c[1] + x * Math.sin(t) + y * Math.cos(t)]
}

/** A part, written so the same part reads the same whichever corner it starts from or way it goes round. */
function partKey(it: Item): string {
  const r = (p: Vec) => `${Math.round(p[0] * 200) / 200},${Math.round(p[1] * 200) / 200}`
  if (it.kind === "seg") return "s" + [r(it.a), r(it.b)].sort().join(" ")
  return (it.fill ? "F" : "p") + it.pts.map(r).sort().join(" ")
}
const figKey = (items: Item[]) => items.map(partKey).sort().join("|")

/** The figure moved point by point. */
export function moved(items: Item[], f: (p: Vec) => Vec): Item[] {
  return items.map(it => (it.kind === "seg" ? { kind: "seg", a: f(it.a), b: f(it.b) } : { kind: "poly", pts: it.pts.map(f), fill: it.fill }))
}
/** Whether moving the figure puts it back on itself. */
export const fits = (items: Item[], f: (p: Vec) => Vec) => figKey(moved(items, f)) === figKey(items)

/** Its lines of symmetry through c: angles from 0 up to 180 (to the half degree). */
export function axesOf(items: Item[], c: Vec): number[] {
  const out: number[] = []
  for (let k = 0; k < 360; k++) {
    const deg = k / 2
    if (fits(items, p => reflect(p, c, deg)) && !out.some(a => Math.abs(a - deg) < 1)) out.push(deg)
  }
  return out
}
/** Its order of rotational symmetry about c: how many turns of a whole number of degrees, up to a full turn, put it back. */
export function orderOf(items: Item[], c: Vec): number {
  let n = 0
  for (let d = 1; d <= 360; d++) if (fits(items, p => rotate(p, c, d))) n++
  return n
}
