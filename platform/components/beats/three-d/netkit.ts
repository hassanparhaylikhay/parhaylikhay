/**
 * Nets with words on them, shared by the 3D lessons that work with a
 * solid's faces (surface area, drawing nets): a net folded any part of the
 * way, labels on its edges and areas written in its faces riding along as
 * it folds, and faces and edges that breathe when a phrase names them.
 */

import { type Scene, type V3, GREEN, YELLOW, segKey, goodView, resetBeat } from "./scene"
import { lens } from "./kit"
import { type Net, foldNet } from "./solids"

export const SIDE: [number, number] = [-30, 24]
export const FLAT: [number, number] = [-16, 58]

/** A label on a net's edge: from corner i to corner j of a face. */
/** An edge label on a net: edge i to j of `face` (`in`: on the face's own side of the edge, not out from the middle). */
export interface NetLab { key: string; face: string; i: number; j: number; tex: string; col?: string; in?: boolean }
/** What a beat writes on its net as it folds: edge labels, and words in the middle of faces (an area). */
const NETLABS = new WeakMap<Scene, NetLab[]>()
const FACETAGS = new WeakMap<Scene, Record<string, { tex: string; col?: string }>>()

/**
 * A net folded `t` of the way (1: the solid), its faces in their colours,
 * the view fitted round it as it is. Edge labels, corner letters and the
 * words written on faces ride along as it folds; `glow` faces breathe.
 */
export function netBoard(S: Scene, net: Net, o: { t: number; cols?: Record<string, string>; labs?: NetLab[]; names?: Record<string, [string, number]>; tags?: Record<string, string | { tex: string; col?: string }>; glow?: string[]; flat?: [number, number] }) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  S.faces = null
  S.net = { def: net, t: o.t, tD: o.t, cols: o.cols, glow: o.glow }
  const flat = o.flat ?? FLAT
  fitNet(S, net, o.t)
  goodView(S, ...(o.t > 0.5 ? SIDE : flat))
  S.fitRect = o.t > 0.5 ? SIDE : flat
  NETLABS.set(S, [...(o.labs ?? [])])
  FACETAGS.set(S, Object.fromEntries(Object.entries(o.tags ?? {}).map(([f, t]) => [f, typeof t === "string" ? { tex: t } : t])))
  const place = (S2: Scene, t: number) => {
    const F = foldNet(net, t)
    for (const L of NETLABS.get(S2) ?? []) {
      const a = F[L.face][L.i], b = F[L.face][L.j]
      S2.P3[`${L.key}a`] = a; S2.D3[`${L.key}a`] = a; S2.P3[`${L.key}b`] = b; S2.D3[`${L.key}b`] = b
      S2.lens[segKey(`${L.key}a`, `${L.key}b`)] = lens(L.tex, L.col)
      if (L.in) {
        const P = F[L.face], c: V3 = [0, 1, 2].map(k => P.reduce((s, p) => s + p[k], 0) / P.length) as V3
        S2.P3[`${L.key}c`] = c; S2.D3[`${L.key}c`] = c
        S2.lens[segKey(`${L.key}a`, `${L.key}b`)].toward = `${L.key}c`
      }
    }
    for (const [n, [face, i]] of Object.entries(o.names ?? {})) { S2.P3[n] = F[face][i]; S2.D3[n] = F[face][i] }
    // words on faces sit in each face's middle
    S2.tags = Object.entries(FACETAGS.get(S2) ?? {}).map(([face, tg]) => {
      const P = F[face]
      const m: V3 = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length, P.reduce((s, p) => s + p[2], 0) / P.length]
      return { key: face, at: m, tex: tg.tex, col: tg.col ?? GREEN }
    })
  }
  place(S, o.t)
  S.names = Object.fromEntries(Object.keys(o.names ?? {}).map(n => [n, n]))
  S.tick = S2 => { if (S2.net) place(S2, S2.net.tD) }
}
/** Faces that breathe now (the rest stop). */
export const glowFaces = (S: Scene, faces: string[]) => { if (S.net) S.net.glow = faces }
/** Edges (by their label's key) that breathe now, in a colour. */
export const glowEdges = (S: Scene, keys: string[], col = YELLOW) => { S.edgeGlow = Object.fromEntries(keys.map(k => [segKey(`${k}a`, `${k}b`), col])) }
/** Write an area on faces (it stays for the rest of the beat; the next beats carry it on themselves). */
export const tagFaces = (S: Scene, faces: string[], tex: string, col = GREEN) => { const T = FACETAGS.get(S); if (T) for (const f of faces) T[f] = { tex, col } }
/** Add an edge label after the board is made. */
export const addLab = (S: Scene, L: NetLab) => { NETLABS.get(S)?.push(L) }
/** Takes an edge label off the net (another label now says it). */
export const dropLab = (S: Scene, key: string) => {
  const L = NETLABS.get(S)
  if (L) NETLABS.set(S, L.filter(l => l.key !== key))
  delete S.lens[segKey(`${key}a`, `${key}b`)]
}

/** The view fits the net as it is at t (folded: the solid; flat: the whole net). */
export function fitNet(S: Scene, net: Net, t: number) {
  for (const n of Object.keys(S.P3)) if (n.startsWith("_n")) delete S.P3[n]
  const P = Object.values(foldNet(net, t > 0.5 ? 1 : 0)).flat()
  P.forEach((p, i) => { S.P3[`_n${i}`] = p })
  S.fitPts = P.map((_, i) => `_n${i}`)
}
/** Open a folded net out flat (or fold it up), the view turning and easing to fit it. */
export function unfold(S: Scene, to: number, dur = 2.8, wait = 0.8) {
  const net = S.net!.def
  S.acts.push({ dur: wait, begin: S2 => { fitNet(S2, net, to); goodView(S2, ...(to > 0.5 ? SIDE : FLAT)); S2.fitRect = to > 0.5 ? SIDE : FLAT } }, { dur, run: (S2, e) => { if (S2.net) S2.net.t = to > 0.5 ? e : 1 - e } })
}
