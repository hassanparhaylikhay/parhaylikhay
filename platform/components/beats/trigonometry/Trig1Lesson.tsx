"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { CALC_KEYS, calcKeyOf } from "../calc"
import Stage from "./Stage"
import { BEATS } from "./beats-1"
import { pick } from "./common"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  cornerS, toScreen, turnHandle, slideHandle, cardRects, chipRects, sideOf,
} from "./scene"
import { eqCentre } from "../equation"

/** The trigonometry board, for the shared runner (BeatRunner.tsx). */
export const trigEngine: Omit<BeatEngine<Scene, Layout>, "controls"> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "tapSide" || S.mode === "tapCard" || S.mode === "tapRegion" ? "pointer" : S.mode === "solve" ? "grab" : "default"),
  debug: {
    layout, cornerS, toScreen, turnHandle, slideHandle, cardRects, chipRects, sideOf,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
  },
  // only what the student just made or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  keypadKeys: () => CALC_KEYS,
  keyOf: calcKeyOf,
}

const engine: BeatEngine<Scene, Layout> = {
  ...trigEngine,
  controls: (S, L) => S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null,
}

export default function Trig1Lesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
