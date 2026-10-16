"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  posOf, wOf, sq2, toScreen, proofAt, proofAB,
} from "./scene"

/** Pythagoras' theorem: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "join" ? "crosshair" : S.mode === "tapSeg" || S.mode === "tapProof" ? "pointer" : "default"),
  debug: { layout, posOf, wOf, sq2, toScreen, proofAt, proofAB },
  // only what the student just drew or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
}

export default function PythagorasLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
