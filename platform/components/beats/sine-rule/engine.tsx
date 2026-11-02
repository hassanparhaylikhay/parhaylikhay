"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices } from "../Shell"
import { SINE_KEYS, SINE_KEYS_SHIFT, sineKeyOf, COS_KEYS, COS_KEYS_SHIFT, cosKeyOf } from "../calc"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, toScreen, chipRects, swingEnd, angleLabelAt, sideLabelAt, heightFoot, squarePts, angleSpot,
} from "./scene"

/** The sine rule board, for the shared runner (BeatRunner.tsx). */
export const sineEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag ? "grabbing" : ["tapAngle", "tapSide", "tapPair", "tapEq", "tapSquare", "tapRegion"].includes(S.mode) ? "pointer" : S.mode === "solve" || S.mode === "fill" ? "grab" : "default"),
  debug: {
    layout, ptS, toScreen, chipRects,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    swingEnd: (S: Scene) => { const e = swingEnd(S); return e ? toScreen(S, e) : null },
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    angAt: (S: Scene, c: "A" | "B" | "C") => angleLabelAt(S, c, layout(S).labelSize, "x"),
    sideAt: (S: Scene, c: "A" | "B" | "C") => sideLabelAt(S, c, layout(S).labelSize, "x"),
    footAt: (S: Scene) => toScreen(S, heightFoot(S)),
    arcAt: (S: Scene, c: "A" | "B" | "C") => angleSpot(S, c),
    squareAt: (S: Scene, c: "A" | "B" | "C") => { const P = squarePts(S, c).map(p => toScreen(S, p)); return [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2] },
    regionAt: (S: Scene, id: string) => {
      const r = S.regions?.find(x => x.id === id)
      if (!r) return null
      const P = r.pts.map(n => ptS(S, n))
      return [P.reduce((a, p) => a + p[0], 0) / P.length, P.reduce((a, p) => a + p[1], 0) / P.length]
    },
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

/** The cosine rule: the same board, with a four-row keypad (+ and −, x² and √). */
export const cosEngine: BeatEngine<Scene, Layout> = {
  ...sineEngine,
  createScene: () => { const S = createScene(); S.keyRows = 4; S.sidePad = true; S.wrapEq = true; return S },
  keypadKeys: S => (S.input?.shift ? COS_KEYS_SHIFT : COS_KEYS),
  keyOf: cosKeyOf,
}
