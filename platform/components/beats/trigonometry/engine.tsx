"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { CALC_KEYS, ANGLE_KEYS, ANGLE_KEYS_SHIFT, calcKeyOf, angleKeyOf } from "../calc"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import { pick } from "./common"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  cornerS, toScreen, turnHandle, slideHandle, cardRects, chipRects, sideOf, sightEnd, angGeom,
} from "./scene"

/** The trigonometry board, for the shared runner (BeatRunner.tsx). Both trig lessons run on it. */
export const trigEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "tapSide" || S.mode === "tapCard" || S.mode === "tapRegion" || S.mode === "tapAngle" || S.mode === "tapPoint" ? "pointer" : S.mode === "solve" ? "grab" : "default"),
  debug: {
    layout, cornerS, toScreen, turnHandle, slideHandle, cardRects, chipRects, sideOf, sightEnd,
    angAt: (S: Scene, id: string) => { const g = S.angs.find(a => a.id === id); return g ? angGeom(S, g, layout(S).labelSize).labelAt : null },
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
  },
  // only what the student just made or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  keypadKeys: () => CALC_KEYS,
  keyOf: calcKeyOf,
  controls: (S, L) => S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null,
}

/** The same board for finding angles: the calculator has SHIFT, for sin⁻¹, cos⁻¹ and tan⁻¹. */
export const angleEngine: BeatEngine<Scene, Layout> = {
  ...trigEngine,
  keypadKeys: S => (S.input?.shift ? ANGLE_KEYS_SHIFT : ANGLE_KEYS),
  keyOf: angleKeyOf,
  keypadLit: S => (S.input?.shift ? ["SHIFT"] : []),
}
