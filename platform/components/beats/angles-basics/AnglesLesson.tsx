"use client"

import BeatRunner, { type BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  choose, angleList, turnGeom, lineHandle,
} from "./scene"

/** Angles: its board, for the shared runner (BeatRunner.tsx). */
const engine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : S.mode === "draw" ? "crosshair" : S.mode === "tap" || S.mode === "addRay" ? "pointer" : "default"),
  debug: { layout, angleList, turnGeom, lineHandle },
  // a question whose answer is a name: word chips where the keypad would be
  controls: (S, L) => (S.choices && S.vis.choices.t > 0.5
    ? <Choices top={L.keypadTop} options={S.choices.options} picked={S.choices.picked} state={S.choices.state}
      wrongAt={S.choices.wrongAt} onPick={k => choose(S, k)} />
    : null),
}

export default function AnglesLesson({ closeHref }: { closeHref: string }) {
  return <BeatRunner engine={engine} beats={BEATS} closeHref={closeHref} />
}
