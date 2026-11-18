"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, toScreen, handleAt, angleSpot, sideSpot, shapeOf, angleAt, sideLen,
} from "./scene"

/** A calculator for scale factors and lengths: digits, a point, × and ÷. */
export const SIM_KEYS: string[][] = [
  ["1", "2", "3", "4", "5", "back"],
  ["6", "7", "8", "9", "0", "."],
  ["×", "÷", "go"],
]

/** The similarity board, for the shared runner (BeatRunner.tsx). */
export const simEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag && S.drag.kind !== "pan" ? "grabbing" : S.mode !== "none" || S.handles.length ? "pointer" : "default"),
  debug: {
    layout,
    /** a corner on the screen: "shape:A" */
    ptS,
    projAt: (S: Scene, p: [number, number]) => toScreen(S, p),
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    handleAt: (S: Scene, id: string) => { const h = S.handles.find(x => x.id === id); return h ? handleAt(S, h) : null },
    angleAt: (S: Scene, key: string) => angleSpot(S, key),
    sideAt: (S: Scene, key: string) => sideSpot(S, key),
    /** a shape's angle at a corner, degrees: "shape:A" */
    angleOf: (S: Scene, key: string) => { const [id, n] = key.split(":"); const sh = shapeOf(S, id); return sh ? angleAt(sh, n) : null },
    /** a side's length where it is going: "shape:ab" */
    sideLen: (S: Scene, key: string) => { const [id, ab] = key.split(":"); const sh = shapeOf(S, id); return sh ? sideLen(sh, ab[0], ab[1], false) : null },
  },
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  keypadKeys: S => S.keyRows ?? SIM_KEYS,
  keyOf: k => (/^\d$/.test(k) ? k : k === "." ? "." : k === "*" || k === "x" ? "×" : k === "/" ? "÷" : k === "+" ? "+" : k === "-" ? "−" : k === "r" ? "√" : k === "Backspace" ? "back" : k === "Enter" || k === "=" ? "go" : null),
  controls: (S, L) => (S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null),
}
