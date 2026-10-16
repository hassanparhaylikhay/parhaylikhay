/**
 * Keeping labels off each other. A label is a box round its centre, sized
 * roughly from its text. Letters stay where they are; a number that would
 * land on a letter or on another number slides further out along the line
 * from its corner until it is clear.
 */

import type { Vec } from "./geometry"

export interface LabelBox { at: Vec; w: number; h: number }

/** A rough box for a KaTeX label: about 0.6 em per character, one line high. */
export function boxFor(tex: string, at: Vec, size: number): LabelBox {
  const chars = tex
    .replace(/\^\\circ/g, "°")
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+/g, "x")
    .replace(/[{}^\\]/g, "").length
  return { at, w: Math.max(0.75, chars * 0.6) * size, h: size * 1.05 }
}

export function overlaps(a: LabelBox, b: LabelBox, pad = 3): boolean {
  return Math.abs(a.at[0] - b.at[0]) < (a.w + b.w) / 2 + pad && Math.abs(a.at[1] - b.at[1]) < (a.h + b.h) / 2 + pad
}

/**
 * Where each label goes: its own spot if that is clear of everything already
 * placed, otherwise the first clear spot further out from its corner. One
 * that finds nothing clear close by stays on its own spot.
 */
export function spread(items: { key: string; from: Vec; box: LabelBox }[], taken: LabelBox[]): Record<string, Vec> {
  const out: Record<string, Vec> = {}
  const placed = [...taken]
  for (const it of items) {
    const d: Vec = [it.box.at[0] - it.from[0], it.box.at[1] - it.from[1]]
    const l = Math.hypot(d[0], d[1]) || 1
    const u: Vec = [d[0] / l, d[1] / l]
    let at = it.box.at
    for (let k = 0; k <= 12; k++) {
      const cand: Vec = [it.box.at[0] + u[0] * k * 5, it.box.at[1] + u[1] * k * 5]
      if (!placed.some(p => overlaps({ ...it.box, at: cand }, p))) { at = cand; break }
    }
    out[it.key] = at
    placed.push({ ...it.box, at })
  }
  return out
}
