"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  angleList, posOf, angOf,
} from "./scene"

/** Circle theorems II: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing"
    : ["join", "drawDiam", "drawChord", "drawThrough", "drawTan", "compass"].includes(S.mode) ? "crosshair"
    : ["tapAngle", "tapLine", "tapRegion", "tapPoint", "tapPts", "place"].includes(S.mode) ? "pointer" : "default"),
  debug: { layout, angleList, posOf, angOf },
  // only what the student just drew or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
}

export default function CircleTheorems2Lesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
