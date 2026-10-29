"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { SINE_KEYS, SINE_KEYS_SHIFT, sineKeyOf } from "../calc"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, toScreen, chipRects, swingEnd, angleLabelAt, sideLabelAt, heightFoot,
} from "./scene"

/** The sine rule board, for the shared runner (BeatRunner.tsx). */
export const sineEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "tapAngle" || S.mode === "tapSide" || S.mode === "tapEq" ? "pointer" : S.mode === "solve" || S.mode === "fill" ? "grab" : "default"),
  debug: {
    layout, ptS, toScreen, chipRects,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    swingEnd: (S: Scene) => { const e = swingEnd(S); return e ? toScreen(S, e) : null },
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    angAt: (S: Scene, c: "A" | "B" | "C") => angleLabelAt(S, c, layout(S).labelSize, "x"),
    sideAt: (S: Scene, c: "A" | "B" | "C") => sideLabelAt(S, c, layout(S).labelSize, "x"),
    footAt: (S: Scene) => toScreen(S, heightFoot(S)),
  },
  // only what the student just made or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  keypadKeys: S => (S.input?.shift ? SINE_KEYS_SHIFT : SINE_KEYS),
  keypadLit: S => (S.input?.shift ? ["SHIFT"] : []),
  keyOf: sineKeyOf,
  controls: (S, L) => (S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null),
}
