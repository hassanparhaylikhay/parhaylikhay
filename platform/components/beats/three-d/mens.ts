/**
 * Mensuration pieces for the 3D board (Unit 5): a metre stick on the floor
 * (its cm and mm marks and numbers show as the view comes close enough to
 * read them), squares on the floor split into grids of smaller squares (lit
 * as they are counted), unit cubes filling a box layer by layer, water
 * rising in a box, and a ladder of units with the steps between them.
 *
 * All in world units (cm unless a beat says otherwise), the floor z = 0.
 */

import type { V3 } from "./scene"

/** A measuring stick lying on the floor from (x0, y0), `len` long and `w` wide, its marks along its far edge. */
export interface Meter {
  x0: number
  y0: number
  len: number
  w: number
  /** how many of its smallest marks make a cm (10: mm marks) */
  sub: number
  /** marks in a colour of their own (a length read off it), in cm from its 0 */
  marks?: { at: number; col: string; tex?: string }[]
  /** the stretch from its 0 to here glows (counting along it) */
  lit?: number
}

/** A square on the floor split into n by n smaller squares; the first `lit` of them (row by row, from the top) shaded. */
export interface SqGrid {
  x0: number
  y0: number
  size: number
  n: number
  col: string
  lit: number
  /** what is written in its middle (its area) */
  tex?: string
  /** the grid lines show (else just its outline) */
  lines: boolean
}

/** Unit cubes filling a box from `o`, each `s` across, nx by ny by nz of them: the first `count` are in (along x, then y, then up). */
export interface Cubes { o: V3; s: number; nx: number; ny: number; nz: number; count: number; col: string }

/** Water in a box, filled to `level` of its height. */
export interface Water { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number; level: number; col: string }

/**
 * A ladder of units, biggest at the top. Going down a step multiplies by its
 * factor; going up divides. `lit` lights the steps from one rung to another.
 */
export interface Ladder { units: string[]; factors: string[]; lit?: { from: number; to: number } | null; title?: string }

/** A box from its two far corners, as the boxes a count of cubes makes (full layers, then full rows, then the cubes of one row). */
export type Box = [V3, V3]
export function cubeBoxes(c: Cubes): Box[] {
  const per = c.nx * c.ny, n = Math.max(0, Math.min(c.count, per * c.nz))
  const layers = Math.floor(n / per), rest = n - layers * per
  const rows = Math.floor(rest / c.nx), last = rest - rows * c.nx
  const [ox, oy, oz] = c.o, s = c.s
  const out: Box[] = []
  if (layers) out.push([[ox, oy, oz], [ox + c.nx * s, oy + c.ny * s, oz + layers * s]])
  const z = oz + layers * s
  if (rows) out.push([[ox, oy, z], [ox + c.nx * s, oy + rows * s, z + s]])
  if (last) out.push([[ox, oy + rows * s, z], [ox + last * s, oy + (rows + 1) * s, z + s]])
  return out
}

/** A box's six faces: corners, outward normal, and the two directions along it (for grid lines). */
export function boxFaces(b: Box): { P: V3[]; n: V3; u: V3; v: V3 }[] {
  const [[x0, y0, z0], [x1, y1, z1]] = b
  const c = (x: number, y: number, z: number): V3 => [x, y, z]
  return [
    { P: [c(x0, y0, z0), c(x1, y0, z0), c(x1, y1, z0), c(x0, y1, z0)], n: [0, 0, -1], u: [1, 0, 0], v: [0, 1, 0] },
    { P: [c(x0, y0, z1), c(x1, y0, z1), c(x1, y1, z1), c(x0, y1, z1)], n: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },
    { P: [c(x0, y0, z0), c(x1, y0, z0), c(x1, y0, z1), c(x0, y0, z1)], n: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { P: [c(x0, y1, z0), c(x1, y1, z0), c(x1, y1, z1), c(x0, y1, z1)], n: [0, 1, 0], u: [1, 0, 0], v: [0, 0, 1] },
    { P: [c(x0, y0, z0), c(x0, y1, z0), c(x0, y1, z1), c(x0, y0, z1)], n: [-1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
    { P: [c(x1, y0, z0), c(x1, y1, z0), c(x1, y1, z1), c(x1, y0, z1)], n: [1, 0, 0], u: [0, 1, 0], v: [0, 0, 1] },
  ]
}
