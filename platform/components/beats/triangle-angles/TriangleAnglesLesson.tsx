"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
} from "./scene"

/** Angles in a triangle: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "draw" ? "crosshair" : "default"),
  // built before the "never stuck" rule: a playing beat waits for its goal
  freeFallback: null,
}

export default function TriangleAnglesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
