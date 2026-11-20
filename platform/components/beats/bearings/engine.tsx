"use client"

import type { BeatEngine } from "../BeatRunner"
import { Choices, DIGIT_KEYS } from "../Shell"
import { eqCentre } from "../equation"
import Stage from "./Stage"
import {
  type Scene, type Layout, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, pick,
  ptS, rayEnd, arcSpot, toScreen, rulerGeom, protGeom, compGeom,
} from "./scene"

/** The map board for bearings, for the shared runner (BeatRunner.tsx). The keypad is plain digits. */
export const mapEngine: BeatEngine<Scene, Layout> = {
  createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey, Stage,
  cursor: S => (S.drag && S.drag.kind !== "pan" ? "grabbing" : S.mode !== "none" || S.rays.some(r => r.handle) || S.dragPts.length ? "pointer" : "default"),
  debug: {
    layout,
    ptS,
    atomAt: (S: Scene, id: string) => eqCentre(S.eq, id),
    labAt: (S: Scene, key: string) => S.labD[key] ?? null,
    /** where a turning line's end is */
    rayAt: (S: Scene, id: string) => { const r = S.rays.find(x => x.id === id); return r ? rayEnd(S, r) : null },
    /** a point on the screen this bearing from a place, this far out (px) */
    brgAt: (S: Scene, at: string, brg: number, px: number) => { const p = ptS(S, at), t = (brg * Math.PI) / 180; return [p[0] + Math.sin(t) * px, p[1] - Math.cos(t) * px] },
    arcAt: (S: Scene, id: string) => { const a = S.arcs.find(x => x.id === id); return a ? arcSpot(S, a) : null },
    /** a world point on the screen */
    projAt: (S: Scene, p: [number, number]) => toScreen(S, p),
    /** the ruler: its 0, the middle of its body (to drag it by), its turning end, its pencil */
    rulerAt: (S: Scene) => { if (!S.ruler) return null; const G = rulerGeom(S); return { zero: G.Z, body: [G.Z[0] + G.e[0] * G.u * 2 + G.n[0] * G.W * 0.5, G.Z[1] + G.e[1] * G.u * 2 + G.n[1] * G.W * 0.5], turn: G.turnAt, turnT: G.turnT, pen: G.penAt, u: G.u, e: G.e } },
    /** the protractor: its centre, its turning end, its pencil, its radius */
    protAt: (S: Scene) => { if (!S.prot) return null; const G = protGeom(S); return { c: G.C, turn: G.turnAt, pen: G.penAt, R: G.R } },
    /** the compasses: the point, the pencil, the hinge, the knob on top, the screen scale */
    compAt: (S: Scene) => { if (!S.comp) return null; const G = compGeom(S); return { P: G.P, Q: G.Q, H: G.H, knob: G.knob, u: G.u, e: G.e } },
  },
  onDone: S => { if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8) },
  // digits, and a decimal point where a length is measured
  keypadKeys: S => S.keyRows ?? DIGIT_KEYS,
  keyOf: k => (/^\d$/.test(k) ? k : k === "." ? "." : k === "Backspace" ? "back" : k === "Enter" ? "go" : null),
  controls: (S, L) => (S.choice && S.vis.chips.t > 0.5 ? (
    <Choices top={L.chipsY - 22} options={S.choice.options} picked={S.choice.picked} state={S.choice.state} wrongAt={S.choice.wrongAt} onPick={k => pick(S, k)} />
  ) : null),
}
