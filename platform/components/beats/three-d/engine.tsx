"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { COS_KEYS, COS_KEYS_SHIFT, cosKeyOf } from "../calc"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, proj, arcGeom, arcPx, segKey, stickTop, RAD,
} from "./scene"

/** The 3D board, for the shared runner (BeatRunner.tsx). The calculator has + − x² √ and SHIFT. */
export const solidEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag?.kind === "orbit" ? "grabbing" : S.drag ? "grabbing" : S.mode === "none" ? "grab" : "pointer"),
  debug: {
    layout,
    ptS,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    handleAt: (S: Scene, id: string) => { const h = S.handles.find(x => x.id === id); return h ? proj(S, h.at(S)) : null },
    /** where along a handle's axis the screen moves for one world unit */
    handleAxis: (S: Scene, id: string) => {
      const h = S.handles.find(x => x.id === id)
      if (!h) return null
      const at = h.at(S), a = proj(S, at), b = proj(S, [at[0] + h.axis[0], at[1] + h.axis[1], at[2] + h.axis[2]])
      return [b[0] - a[0], b[1] - a[1]]
    },
    segMid: (S: Scene, a: string, b: string) => { const A = ptS(S, a), B = ptS(S, b); return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] },
    flatSide: (S: Scene, id: string, a: string, b: string) => { const F = S.flats.find(f => f.id === id); if (!F) return null; const A = F.pos[a], B = F.pos[b]; return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2] },
    regionAt: (S: Scene, id: string) => {
      const r = S.regions?.find(x => x.id === id)
      if (!r) return null
      const P = r.pts.map(n => ptS(S, n))
      return [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length]
    },
    arcAt: (S: Scene, i: number) => { const g = S.tapArcs?.[i]; return g ? arcGeom(S, g, arcPx(S)).spot : null },
    segKey,
    /** where the stick's top would be, turned `phi` and tipped `th` (degrees) */
    stickAt: (S: Scene, phi: number, th: number) => (S.stick ? proj(S, stickTop({ ...S.stick, phi: phi * RAD, th: th * RAD })) : null),
    stickNow: (S: Scene) => (S.stick ? [S.stick.phi / RAD, S.stick.th / RAD] : null),
  },
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  keypadKeys: S => (S.input?.shift ? COS_KEYS_SHIFT : COS_KEYS),
  keypadLit: S => (S.input?.shift ? ["SHIFT"] : []),
  keyOf: cosKeyOf,
  controls: (S, L) => (S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null),
}
