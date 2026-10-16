"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  angleList, posOf, angOf, chordCm, distCm, sliderAngle,
} from "./scene"

/** Circle theorems III: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing"
    : ["join", "drawChord", "drawPerp", "drawSym", "compass"].includes(S.mode) ? "crosshair"
    : ["tapMid", "place"].includes(S.mode) ? "pointer" : "default"),
  debug: { layout, angleList, posOf, angOf, chordCm, distCm, sliderAngle },
  // only what the student just drew or moved lights up
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
}

export default function CircleTheorems3Lesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
