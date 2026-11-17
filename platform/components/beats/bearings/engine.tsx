"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, rayEnd, arcSpot,
} from "./scene"

/** The map board for bearings, for the shared runner (BeatRunner.tsx). The keypad is plain digits. */
export const mapEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag && S.drag.kind !== "pan" ? "grabbing" : S.mode !== "none" || S.rays.some(r => r.handle) || S.dragPts.length ? "pointer" : "default"),
  debug: {
    layout,
    ptS,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    /** where a turning line's end is */
    rayAt: (S: Scene, id: string) => { const r = S.rays.find(x => x.id === id); return r ? rayEnd(S, r) : null },
    /** a point on the screen this bearing from a place, this far out (px) */
    brgAt: (S: Scene, at: string, brg: number, px: number) => { const p = ptS(S, at), t = (brg * Math.PI) / 180; return [p[0] + Math.sin(t) * px, p[1] - Math.cos(t) * px] },
    arcAt: (S: Scene, id: string) => { const a = S.arcs.find(x => x.id === id); return a ? arcSpot(S, a) : null },
  },
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  controls: (S, L) => (S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null),
}
