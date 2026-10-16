"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import { Stepper } from "../Shell"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, walkTap, stepSides,
} from "./scene"

/** Angles in polygons: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "draw" ? "crosshair" : S.mode === "walk" || S.mode === "addCorner" ? "pointer" : "default"),
  // the walk round the shape steps on with the space bar or Enter too
  onKey: (S, e) => {
    if (S.mode === "walk" && (e.key === " " || e.key === "Enter")) { e.preventDefault(); walkTap(S); return true }
    return false
  },
  // fewer or more sides: the stepper sits where the keypad would
  controls: (S, L) => (S.stepper && S.vis.stepper.t > 0.5
    ? <Stepper top={L.keypadTop} n={S.stepper.n} onStep={d => stepSides(S, d)} />
    : null),
  // built before the "never stuck" rule: a playing beat waits for its goal
  freeFallback: null,
}

export default function PolygonAnglesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
