"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices, Stepper } from "../Shell"
import { eqCentre } from "../equation"
import { MENS_KEYS, mensKeyOf } from "../calc"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick, stepBy,
  ptS, toScreen, handleAt, polyOf, polyPts, quadName,
} from "./scene"

/** The geometrical terms board, for the shared runner (BeatRunner.tsx). */
export const termsEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag && S.drag.kind !== "pan" ? "grabbing" : S.taps || S.handles.length ? "pointer" : "default"),
  // digits, or the calculator (a decimal point, + − × ÷, x², √, π)
  keypadKeys: S => (S.keyRows === 3 ? MENS_KEYS : undefined),
  keypadLit: S => S.keyHint,
  keyOf: mensKeyOf,
  debug: {
    layout,
    /** a point on the screen */
    ptS,
    projAt: (S: Scene, p: [number, number]) => toScreen(S, p),
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    handleAt: (S: Scene, id: string) => { const h = S.handles.find(x => x.id === id); return h ? handleAt(S, h) : null },
    /** where to tap a tap target */
    tapAt: (S: Scene, id: string) => { const t = S.taps?.find(x => x.id === id); return t ? t.spot(S) : null },
    tapIds: (S: Scene) => (S.taps ?? []).map(t => t.id),
    quadOf: (S: Scene, id: string) => { const pl = polyOf(S, id); return pl ? quadName(polyPts(S, pl)) : null },
  },
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  controls: (S, L) => (
    <>
      {S.choice && S.vis.chips.t > 0.5 ? <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} /> : null}
      {S.stepper && S.vis.stepper.t > 0.5 ? <Stepper top={L.stepperY} n={S.stepper.n} onStep={d => stepBy(S, d)} /> : null}
    </>
  ),
}
