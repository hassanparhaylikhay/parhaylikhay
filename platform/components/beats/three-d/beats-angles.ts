/**
 * Angles in 3D (6.4, lesson 2 of 2). A stick on the floor and a light
 * straight above it: the angle between a line and the floor is the angle
 * between the line and its shadow. Then the box and the pyramid from lesson
 * 1, heights above a point seen from two places, and exam questions from the
 * papers: 4024/21/O/N/25 Q25(b), 4024/23/M/J/25 Q22(b)(ii), 4024/21/O/N/21
 * Q10(b)(iii), 4024/22/O/N/22 Q7(b), 4024/02/O/N/05 Q8(b).
 *
 * Colours as in lesson 1: the stick (any sloping line) pink, its shadow on
 * the floor blue, the drop from its top orange.
 */

import { applyParts } from "../chapter"
import type { WalkStep } from "../walk"
import { row } from "../equation"
import {
  type Scene, type V3, type Arc3, CHALK, BLUE, ORANGE, PINK, GREEN,
  segKey, addSeg, liftOut, later, say, choose, placeStick, stickTop, resetBeat, goodView, RAD, DEG,
} from "./scene"
import {
  type Beat, look, num, sig, c, pc, lens, boxBoard, boxLens, ecBoard, pyrBoard, solidBoard,
  watch, rightBeat, liftBeat, askBeat,
} from "./kit"

// ── the stick ────────────────────────────────────────────────────────────

/** A stick on the floor (P its foot, T its top, Tf where its shadow ends), on a floor with room round it. */
function stickBoard(S: Scene, o: { th?: number; phi?: number; keep?: boolean; light?: boolean; handle?: boolean; arc?: boolean } = {}) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  S.faces = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  if (!(o.keep && S.stick)) S.stick = { base: [0, 0, 0], r: 6, phi: (o.phi ?? -25) * RAD, th: (o.th ?? 52) * RAD, moved: 0 }
  else S.stick.moved = 0
  const T = stickTop(S.stick)
  // the view keeps room for the stick turned any way (no more): it is the whole picture
  Object.assign(S.P3, { P: [0, 0, 0], T, Tf: [T[0], T[1], 0], f1: [-3.6, -3.6, 0], f2: [3.6, 3.6, 0], f3: [0, 0, 6.2] } as Record<string, V3>)
  S.fitPts = ["f1", "f2", "f3"]
  if (o.light) { S.light = ["T"]; addSeg(S, "P", "Tf", { grown: true, col: BLUE }) }
  addSeg(S, "P", "T", { grown: true, col: PINK })
  if (o.handle) goodView(S, -30, 22)
  if (o.handle) S.handles = [{ id: "top", at: S2 => stickTop(S2.stick!), axis: [0, 0, 1], move: () => {}, place: (S2, f) => placeStick(S2, S2.stick!, f) }]
  if (o.arc) {
    // the angle between the stick and its shadow, live (none when the stick is flat or upright)
    const live = (S2: Scene) => {
      const th = Math.round(S2.stick!.th * DEG)
      S2.arcs = th > 1 && th < 89 ? [{ at: "P", a: "T", b: "Tf", tex: `${th}^\\circ`, col: CHALK }] : []
    }
    S.tick = live
    live(S)
  }
}

const stickTilt = (S: Scene) => (S.stick ? S.stick.th * DEG : 0)

/** A tilting beat: the arrow comes once the stick has moved this many degrees. */
function tiltBeat(id: string, say0: string, o: Parameters<typeof stickBoard>[1], degrees = 40, minPlay = 4): Beat {
  return { id, say: say0, enter: S => { stickBoard(S, { ...o, keep: true, handle: true }); look(S) }, done: S => (S.stick?.moved ?? 0) >= degrees, free: true, minPlay }
}

// ── angle walkthroughs ───────────────────────────────────────────────────

/** Finding an angle from two sides of a right-angled triangle: which rule, then the inverse. */
function angleWalk(rule: "tan" | "sin" | "cos", top: [string, string], bottom: [string, string], value: number, name = "\\theta"): WalkStep<Scene>[] {
  const roles = { tan: "the opposite and the adjacent", sin: "the opposite and the hypotenuse", cos: "the adjacent and the hypotenuse" }[rule]
  const ans = c(GREEN, `${value.toFixed(1)}^\\circ`)
  return [
    { say: `We know ${roles}. So we use $\\${rule}$.`, tex: `\\${rule}\\,${name} = \\dfrac{${c(top[1], top[0])}}{${c(bottom[1], bottom[0])}}` },
    { say: `Undo the $\\${rule}$ with SHIFT $\\${rule}$.`, tex: `${name} = \\${rule}^{-1}\\!\\left(\\dfrac{${top[0]}}{${bottom[0]}}\\right) = ${ans}` },
  ]
}

/** The slips for an angle typed from tan, sin or cos: the other angle, radians, forgetting the inverse. */
function angleSlips(value: number, ratio: number, other = "the other corner") {
  return [
    { v: 90 - value, say: `That's the angle at ${other}. We want the one at the bottom of the line.` },
    { v: value * RAD, say: "Your calculator is in radians. Set it to degrees." },
    { v: ratio, say: "That's the ratio. Now press SHIFT and the rule, to undo it." },
  ]
}

// ── the box and the pyramid from lesson 1 ────────────────────────────────

function boxWithEC(S: Scene, o: { eg?: boolean; light?: boolean; tri?: boolean; right?: boolean } = {}) {
  ecBoard(S, { eg: o.eg, tri: o.tri, right: o.right, ecTex: "17" })
  if (o.eg) S.lens[segKey("E", "G")] = lens("15", BLUE)
  if (o.light) S.light = ["C"]
}

function pyrWithEC(S: Scene, o: { light?: boolean; shadow?: boolean } = {}) {
  pyrBoard(S, { diags: !!o.shadow, height: !!o.shadow })
  S.edgeCol[segKey("E", "C")] = PINK
  S.lens[segKey("A", "B")] = lens("6")
  S.lens[segKey("B", "C")] = lens("6")
  if (o.light) S.light = ["E"]
  if (o.shadow) { S.lens[segKey("E", "X")] = lens("8", ORANGE); S.dots = ["X"] }
}

// ── heights above the ground ─────────────────────────────────────────────

/** Our own hall: B on the floor, a light L above it; C is 20 from B, A is 12 from B; from C the light is 25° up. */
const H_LB = 20 * Math.tan(25 * RAD)
const H_ANG = Math.atan(H_LB / 12) * DEG
function hallBoard(S: Scene, o: { fromC?: boolean; fromA?: boolean; lb?: string } = {}) {
  const at = (r: number, deg: number): V3 => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD), 0]
  // A to the front left of B and C to the front right, so the two triangles fan out either side of the light
  solidBoard(S, { B: [0, 0, 0], C: at(20, -40), A: at(12, 215), L: [0, 0, H_LB] }, [], { A: "A", B: "B", C: "C", L: "L" })
  S.faces = null
  S.dots = ["A", "B", "C"]
  S.light = []
  addSeg(S, "B", "L", { grown: true })
  addSeg(S, "B", "C", { grown: true })
  addSeg(S, "B", "A", { grown: true })
  S.lens[segKey("B", "C")] = lens("20", BLUE)
  S.lens[segKey("B", "A")] = lens("12", BLUE)
  if (o.lb) S.lens[segKey("B", "L")] = lens(o.lb, ORANGE)
  S.rights = [{ at: "B", a: "L", b: "C" }]
  if (o.fromC) { addSeg(S, "C", "L", { grown: true }); S.arcs = [...S.arcs, { at: "C", a: "B", b: "L", tex: "25^\\circ" }] }
  if (o.fromA) { addSeg(S, "A", "L", { grown: true }); S.rights = [...S.rights, { at: "B", a: "L", b: "A" }]; S.arcs = [...S.arcs, { at: "A", a: "B", b: "L", tex: "?" }] }
}

// ── exam figures ─────────────────────────────────────────────────────────

/** 4024/21/O/N/25 Q25: the cuboid 12 by 10 by 7, CE = 17.1. */
const X1_EG = Math.hypot(12, 10)
const X1_ANG = Math.atan(7 / X1_EG) * DEG
function x1Board(S: Scene, o: { light?: boolean; eg?: boolean } = {}) {
  ecBoard(S, { l: 12, w: 10, h: 7, eg: o.eg, ecTex: "17.1" })
  S.lens[segKey("E", "H")] = lens("12")
  S.lens[segKey("H", "G")] = lens("10")
  S.lens[segKey("G", "C")] = lens("7")
  if (o.light) S.light = ["C"]
  if (o.eg) { S.rights = [{ at: "G", a: "E", b: "C" }]; S.edgeCol[segKey("C", "G")] = ORANGE }
}

/**
 * 4024/23/M/J/25 Q22: a pyramid on an equilateral triangle, sides 34, edges
 * 82. Drawn not to scale (as in the paper: at its true height the base is a
 * sliver); the triangle lifted out of it has its true shape.
 */
const X2_R = 34 / Math.sqrt(3)
const X2_H = Math.sqrt(82 * 82 - 19.6 * 19.6)
const X2_DRAWN = 40
function x2Board(S: Scene, o: { light?: boolean; shadow?: boolean } = {}) {
  const at = (deg: number): V3 => [X2_R * Math.cos(deg * RAD), X2_R * Math.sin(deg * RAD), 0]
  const A = at(210), C = at(330), B = at(90)
  solidBoard(S, { A, B, C, V: [0, 0, X2_DRAWN], O: [0, 0, 0] }, [["A", "C", "B"], ["V", "A", "C"], ["V", "C", "B"], ["V", "B", "A"]], { A: "A", B: "B", C: "C", V: "V", O: "O" })
  S.lens[segKey("B", "C")] = lens("34")
  S.lens[segKey("V", "B")] = lens("82", PINK)
  S.edgeCol[segKey("V", "B")] = PINK
  S.dots = ["O"]
  if (o.light) S.light = ["V"]
  if (o.shadow) { addSeg(S, "O", "B", { grown: true }); addSeg(S, "O", "V", { grown: true }); S.lens[segKey("O", "B")] = lens("19.6", BLUE); S.rights = [{ at: "O", a: "V", b: "B" }] }
}

/** 4024/21/O/N/21 Q10(b): square base 12, EX = 17, EC = 19. */
function x3Board(S: Scene, o: { face?: boolean; em?: boolean } = {}) {
  pyrBoard(S, { l: 12, w: 12, h: 17, diags: true, height: true })
  S.lens[segKey("E", "X")] = lens("17", ORANGE)
  S.lens[segKey("E", "C")] = lens("19", PINK)
  S.lens[segKey("B", "C")] = lens("12")
  S.edgeCol[segKey("E", "C")] = PINK
  S.edgeCol[segKey("E", "B")] = PINK
  S.arcs = [{ at: "B", a: "C", b: "E", tex: "?" }]
  if (o.face) S.tris = [{ id: "EBC", pts: ["E", "B", "C"], col: CHALK, sheet: true }]
  if (o.em) {
    S.P3.M = [6, 0, 0]
    S.names = { ...S.names, M: "M" }
    S.dots = [...S.dots, "M"]
    addSeg(S, "E", "M", { grown: true })
    S.rights = [...S.rights, { at: "M", a: "E", b: "B" }]
  }
}

/** 4024/22/O/N/22 Q7: the hall's floor plan ABCD (A the right angle), a light L above B; 8.2° up from C. */
const X4 = (() => {
  const B: [number, number] = [0, 95], D: [number, number] = [160, 0]
  // C: 107 from B and 165 from D, on the far side of BD from A
  const dx = D[0] - B[0], dy = D[1] - B[1], d = Math.hypot(dx, dy)
  const a = (107 * 107 - 165 * 165 + d * d) / (2 * d), h = Math.sqrt(107 * 107 - a * a)
  const mx = B[0] + (a * dx) / d, my = B[1] + (a * dy) / d
  const C1: [number, number] = [mx + (h * dy) / d, my - (h * dx) / d], C2: [number, number] = [mx - (h * dy) / d, my + (h * dx) / d]
  const C = C1[1] > C2[1] ? C1 : C2
  const LB = 107 * Math.tan(8.2 * RAD)
  return { B, D, C, LB, ang: Math.atan(LB / 95) * DEG }
})()
function x4Board(S: Scene, o: { fromA?: boolean; lb?: string } = {}) {
  // the plan with its middle near the origin, so it turns about itself
  const off = [-80, -60]
  const p = (q: [number, number], z = 0): V3 => [q[0] + off[0], q[1] + off[1], z]
  solidBoard(S, { A: p([0, 0]), B: p(X4.B), C: p(X4.C), D: p(X4.D), L: p(X4.B, X4.LB) }, [["A", "B", "C", "D"]], { A: "A", B: "B", C: "C", D: "D", L: "L" })
  S.floorGrid = 20
  S.lens[segKey("A", "B")] = lens("95")
  S.lens[segKey("B", "C")] = lens("107")
  S.lens[segKey("C", "D")] = lens("165")
  S.lens[segKey("A", "D")] = lens("160")
  addSeg(S, "B", "L", { grown: true })
  if (o.lb) S.lens[segKey("B", "L")] = lens(o.lb, ORANGE)
  addSeg(S, "C", "L", { grown: true })
  S.arcs = [{ at: "C", a: "B", b: "L", tex: "8.2^\\circ" }]
  S.rights = [{ at: "B", a: "L", b: "C" }]
  if (o.fromA) { addSeg(S, "A", "L", { grown: true }); S.arcs = [...S.arcs, { at: "A", a: "B", b: "L", tex: "?" }]; S.rights = [...S.rights, { at: "B", a: "L", b: "A" }] }
}

/** 4024/02/O/N/05 Q8: a field A, B, C (AB = 72, AC = 60, angle BAC = 75°), a kite K above A, the string BK at 24°. */
const X5_AK = 72 * Math.tan(24 * RAD)
const X5_ANG = Math.atan(X5_AK / 60) * DEG
function x5Board(S: Scene, o: { fromC?: boolean; ak?: string } = {}) {
  const at = (r: number, deg: number): V3 => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD), 0]
  solidBoard(S, { A: [0, 0, 0], B: at(72, 200), C: at(60, 275), K: [0, 0, X5_AK] }, [["A", "B", "C"]], { A: "A", B: "B", C: "C", K: "K" })
  S.floorGrid = 10
  S.lens[segKey("A", "B")] = lens("72")
  S.lens[segKey("A", "C")] = lens("60")
  addSeg(S, "A", "K", { grown: true })
  addSeg(S, "B", "K", { grown: true })
  if (o.ak) S.lens[segKey("A", "K")] = lens(o.ak, ORANGE)
  S.arcs = [{ at: "B", a: "A", b: "K", tex: "24^\\circ" }]
  S.rights = [{ at: "A", a: "K", b: "B" }]
  if (o.fromC) { addSeg(S, "C", "K", { grown: true }); S.arcs = [...S.arcs, { at: "C", a: "A", b: "K", tex: "?" }]; S.rights = [...S.rights, { at: "A", a: "K", b: "C" }] }
}

// ── beat makers ──────────────────────────────────────────────────────────

/** Where does a point's shadow land? Tap it (the light is on the point). */
function shadowBeat(id: string, say0: string, enter: (S: Scene) => void, of: string, foot: string, choices: string[], wrong: string): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.light = [of]
      S.mode = "tapPoint"
      S.tapPoints = choices
      S.onPoint = (S2, n) => {
        if (S2.got.has("tap")) return
        if (n !== foot) { say(S2, wrong, "wrong", 3.8); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.glowPts = [foot]
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1400,
  }
}

/** Tap the angle between a line and the floor among the angles it makes with lines on the floor. */
function angleTapBeat(id: string, say0: string, enter: (S: Scene) => void, arcs: Arc3[], right: number, notes: Record<number, string>): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.mode = "tapArc"
      S.tapArcs = arcs
      S.onArc = (S2, i) => {
        if (S2.got.has("tap")) return
        if (i !== right) { say(S2, notes[i] ?? "That's the angle with a line on the floor, not with the shadow.", "wrong", 4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.arcs = [...S2.arcs, { ...arcs[right], col: CHALK, pulse: true }]
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

// ── the beats ────────────────────────────────────────────────────────────

const PART_A: Beat[] = [
  // ── 1. The angle with the floor ──
  watch("stick", "This stick stands on the floor.", S => { stickBoard(S); look(S) }),
  tiltBeat("tilt", "Try tilting it. Drag its top.", {}, 40, 4),
  watch("light", "Let's shine a light straight down from above.", S => { stickBoard(S, { keep: true, light: true }); look(S) }, 2.2),
  tiltBeat("tilt-shadow", "Tilt it again. Watch its shadow.", { light: true }, 50, 5),
  {
    id: "flat",
    say: "Lay the stick flat on the floor.",
    enter: S => { stickBoard(S, { keep: true, light: true, handle: true }); look(S) },
    done: S => stickTilt(S) === 0 && S.drag === null,
    advanceAfter: 1500,
  },
  {
    id: "up",
    say: "Now stand it straight up.",
    enter: S => { stickBoard(S, { keep: true, light: true, handle: true }); look(S) },
    done: S => Math.abs(stickTilt(S) - 90) < 1e-6 && S.drag === null,
    advanceAfter: 1500,
  },
  watch("zero", "Lying flat, the stick makes $0^\\circ$ with the floor.", S => {
    stickBoard(S, { th: 0, light: true })
    S.eqFn = () => row([pc("a", "0^\\circ", PINK)])
    look(S, ["eq"])
  }, 2.2),
  watch("ninety", "Standing straight up, it makes $90^\\circ$.", S => {
    stickBoard(S, { th: 90, light: true })
    S.P3.Q = [3, 0, 0]
    S.rights = [{ at: "P", a: "T", b: "Q" }]
    S.eqFn = () => row([pc("a", "90^\\circ", PINK)])
    look(S, ["eq"])
  }, 2.2),
  {
    id: "between",
    say: "In between, we measure the angle from its shadow. Tilt it.",
    enter: S => { stickBoard(S, { th: 40, light: true, handle: true, arc: true }); look(S) },
    done: S => (S.stick?.moved ?? 0) >= 40,
    free: true,
    minPlay: 5,
  },
  watch("name", "This is the angle between the stick and the floor.", S => { stickBoard(S, { th: 40, light: true, arc: true }); S.spin = 14; look(S) }, 2.4),
  {
    id: "plane",
    say: "The exam calls the floor a *plane*.",
    enter: S => { stickBoard(S, { th: 40, light: true, arc: true }); later(S, 0.6, S2 => say(S2, "A plane is a flat surface, like this floor.", "calm", 600)); look(S) },
    cta: "", ctaAfter: 2.4,
  },
  watch("drop", "The light drops straight down from the top of the stick.", S => { stickBoard(S, { th: 40, light: true, arc: true }); look(S) }, 2.2),
  rightBeat("stick-right", "The stick, its shadow and the drop make a triangle. Tap its right angle.", S => { stickBoard(S, { th: 40, light: true }); look(S) },
    [{ at: "P", a: "T", b: "Tf" }, { at: "Tf", a: "T", b: "P" }, { at: "T", a: "P", b: "Tf" }], 1,
    { 0: "That's the angle we measure. Where does the drop meet the floor?", 2: "At the top they meet at a sharp point. Where does the drop meet the floor?" }),

  // ── 2. Back to the box ──
  watch("box", "Here is our box again.", S => { boxWithEC(S); look(S) }),
  watch("box-q", "What angle does $EC$ make with the floor?", S => { boxWithEC(S); S.segs[segKey("E", "C")].glow = true; look(S) }),
  shadowBeat("box-shadow", "Let's shine the light down. Where does $C$'s shadow land? Tap it.", S => boxWithEC(S), "C", "G", ["E", "F", "G", "H"], "Look straight down from $C$, along the dashed drop."),
  watch("box-shadow-line", "So the shadow of $EC$ is $EG$.", S => {
    boxWithEC(S, { eg: true, light: true })
    S.segs[segKey("E", "G")].glow = true
    look(S)
  }, 2.2),
  angleTapBeat("box-angle", "Tap the angle between $EC$ and the floor.", S => boxWithEC(S, { eg: true, light: true }),
    [{ at: "E", a: "C", b: "H" }, { at: "E", a: "C", b: "F" }, { at: "E", a: "C", b: "G" }], 2,
    { 0: "That's the angle with the edge $EH$. Use the shadow, $EG$.", 1: "That's the angle with the edge $EF$. Use the shadow, $EG$." }),
  liftBeat("box-lift", "It's our triangle from lesson one. Tap it to lift it out.", S => { boxWithEC(S, { eg: true, light: true, right: true }); S.arcs = [{ at: "E", a: "C", b: "G" }]; look(S) }, {
    regions: [{ id: "EGC", pts: ["E", "G", "C"] }],
    makes: { EGC: { pts: ["E", "G", "C"], right: "G", lens: { [segKey("E", "G")]: lens("15", BLUE), [segKey("G", "C")]: lens("8", ORANGE), [segKey("E", "C")]: lens("17", PINK) }, angle: { at: "E", tex: "\\theta" } } },
  }),
  askBeat("box-work", "Work out the angle.", S => {
    boxWithEC(S, { eg: true, right: true })
    S.arcs = [{ at: "E", a: "C", b: "G" }]
    liftOut(S, "up", ["E", "G", "C"], "G", { [segKey("E", "G")]: lens("15", BLUE), [segKey("G", "C")]: lens("8", ORANGE), [segKey("E", "C")]: lens("17", PINK) }, true).angle = { at: "E", tex: "\\theta" }
  }, {
    name: "\\theta", col: CHALK, answer: Math.atan(8 / 15) * DEG, dp: 1, shown: `${(Math.atan(8 / 15) * DEG).toFixed(1)}^\\circ`, typed: "T8/15",
    slips: angleSlips(Math.atan(8 / 15) * DEG, 8 / 15, "$C$, at the top"),
    angleOn: "up",
    walk: angleWalk("tan", ["8", ORANGE], ["15", BLUE], Math.atan(8 / 15) * DEG),
  }),
  {
    id: "box-turn",
    say: "Turn the box. From every side, the angle is $28.1^\\circ$.",
    enter: S => {
      boxWithEC(S, { eg: true, right: true })
      S.arcs = [{ at: "E", a: "C", b: "G", tex: "28.1^\\circ" }]
      look(S)
    },
    done: S => S.turned >= 70,
    free: true,
    minPlay: 4,
  },

  // ── 3. Find the shadow ──
  shadowBeat("ag-shadow", "Now the line $AG$. Where does $A$'s shadow land? Tap it.", S => { boxBoard(S); boxLens(S); addSeg(S, "A", "G", { grown: true }) }, "A", "E", ["E", "F", "G", "H"], "Look straight down from $A$."),
  angleTapBeat("ag-angle", "Tap the angle between $AG$ and the floor.", S => { boxBoard(S); boxLens(S); addSeg(S, "A", "G", { grown: true }); addSeg(S, "E", "G", { grown: true }); S.light = ["A"] },
    [{ at: "G", a: "A", b: "H" }, { at: "G", a: "A", b: "E" }, { at: "G", a: "A", b: "F" }], 1,
    { 0: "That's the angle with the edge $GH$. The shadow of $AG$ is $EG$.", 2: "That's the angle with the edge $GF$. The shadow of $AG$ is $EG$." }),
  shadowBeat("pyr-shadow", "Here is our pyramid again. Where does the top's shadow land? Tap it.", S => { pyrWithEC(S); S.dots = ["X"]; S.names = { ...S.names, X: "X" } }, "E", "X", ["A", "B", "C", "D", "X"], "The top is straight above the middle of the base."),
  angleTapBeat("pyr-angle", "Tap the angle between the edge $EC$ and the base.", S => { pyrWithEC(S, { light: true, shadow: true }) },
    [{ at: "C", a: "E", b: "B" }, { at: "C", a: "E", b: "X" }, { at: "C", a: "E", b: "D" }], 1,
    { 0: "That's the angle with the edge $CB$. The shadow of $EC$ is $XC$.", 2: "That's the angle with the edge $CD$. The shadow of $EC$ is $XC$." }),

  // ── 4. Working out the angle ──
  watch("q1", "What angle does this box's long diagonal make with the floor?", S => { ecBoard(S, { l: 8, w: 6, h: 5 }); S.light = ["C"]; look(S) }, 2.4),
  askBeat("q1-eg", "First, how long is its shadow, $EG$?", S => { ecBoard(S, { l: 8, w: 6, h: 5, eg: true }); S.light = ["C"]; look(S) }, {
    name: "EG", col: BLUE, answer: 10, sf: 3, shown: "10", typed: "r8^+6^",
    slips: [{ v: 14, say: "That's $8 + 6$. Square them first." }, { v: 100, say: "That's $EG^2$. Now take the square root." }],
    onFigure: segKey("E", "G"),
    walk: [{ say: "$EG$ is the long side of the floor triangle.", tex: `${c(BLUE, "EG")} = \\sqrt{8^2 + 6^2} = \\sqrt{100} = ${c(GREEN, "10")}` }],
  }),
  askBeat("q1-ang", "Now work out the angle.", S => {
    ecBoard(S, { l: 8, w: 6, h: 5, eg: true, right: true })
    S.lens[segKey("E", "G")] = lens("10", BLUE)
    S.arcs = [{ at: "E", a: "C", b: "G", tex: "\\theta" }]
    liftOut(S, "up", ["E", "G", "C"], "G", { [segKey("E", "G")]: lens("10", BLUE), [segKey("G", "C")]: lens("5", ORANGE), [segKey("E", "C")]: lens("?", PINK) }, true).angle = { at: "E", tex: "\\theta" }
  }, {
    name: "\\theta", col: CHALK, answer: Math.atan(0.5) * DEG, dp: 1, shown: `${(Math.atan(0.5) * DEG).toFixed(1)}^\\circ`, typed: "T5/10",
    slips: angleSlips(Math.atan(0.5) * DEG, 0.5, "$C$, at the top"),
    angleOn: "up",
    walk: angleWalk("tan", ["5", ORANGE], ["10", BLUE], Math.atan(0.5) * DEG),
  }),
  askBeat("q2", "What angle does the edge $EC$ make with the base?", S => {
    pyrWithEC(S, { shadow: true })
    S.lens[segKey("X", "C")] = lens("4.24", BLUE)
    S.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: CHALK }]
    liftOut(S, "up", ["E", "X", "C"], "X", { [segKey("E", "X")]: lens("8", ORANGE), [segKey("X", "C")]: lens("4.24", BLUE), [segKey("E", "C")]: lens("?", PINK) }, true).angle = { at: "C", tex: "\\theta" }
  }, {
    name: "\\theta", col: CHALK, answer: Math.atan(8 / Math.sqrt(18)) * DEG, dp: 1, shown: `${(Math.atan(8 / Math.sqrt(18)) * DEG).toFixed(1)}^\\circ`, typed: "T8/4.243",
    slips: angleSlips(Math.atan(8 / Math.sqrt(18)) * DEG, 8 / Math.sqrt(18), "the top"),
    angleOn: "up",
    walk: angleWalk("tan", ["8", ORANGE], ["4.24", BLUE], Math.atan(8 / Math.sqrt(18)) * DEG),
  }),
]

const PART_B: Beat[] = [
  // ── 5. Heights above the ground ──
  watch("hall", "A light hangs straight above $B$.", S => { hallBoard(S); S.segs[segKey("B", "L")].glow = true; look(S) }, 2.2),
  watch("hall-c", "From $C$, you look up at the light.", S => { hallBoard(S, { fromC: true }); S.segs[segKey("C", "L")].glow = true; look(S) }, 2.4),
  watch("hall-c2", "Its angle of elevation from $C$ is $25^\\circ$.", S => { hallBoard(S, { fromC: true }); S.arcs = S.arcs.map(a => ({ ...a, pulse: true })); look(S) }, 2.2),
  watch("hall-a", "Now look up at it from $A$.", S => { hallBoard(S, { fromC: true, fromA: true }); S.segs[segKey("A", "L")].glow = true; look(S) }, 2.4),
  {
    id: "hall-share",
    say: "Both triangles have one line in common. Tap it.",
    enter: S => {
      hallBoard(S, { fromC: true, fromA: true })
      S.tris = [{ id: "LBC", pts: ["L", "B", "C"], col: CHALK }, { id: "LBA", pts: ["L", "B", "A"], col: CHALK }]
      S.mode = "tapSeg"
      S.tapSegs = [segKey("B", "L"), segKey("B", "C"), segKey("B", "A"), segKey("C", "L"), segKey("A", "L")]
      S.onSeg = (S2, key) => {
        if (S2.got.has("tap")) return
        if (key !== segKey("B", "L")) { say(S2, "That line is in only one of the triangles. Which one do both share?", "wrong", 3.8); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.segs[key].glow = true
        S2.touched = key
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  },
  watch("hall-plan", "So find $LB$ from $C$'s triangle, then use it from $A$.", S => { hallBoard(S, { fromC: true, fromA: true }); S.segs[segKey("B", "L")].glow = true; look(S) }, 2.6),
  liftBeat("hall-lift-c", "Tap triangle $LBC$ to lift it out.", S => { hallBoard(S, { fromC: true, fromA: true }); look(S) }, {
    regions: [{ id: "LBC", pts: ["L", "B", "C"] }],
    makes: { LBC: { pts: ["L", "B", "C"], right: "B", lens: { [segKey("B", "C")]: lens("20", BLUE), [segKey("B", "L")]: lens("?", ORANGE) }, angle: { at: "C", tex: "25^\\circ" } } },
  }),
  askBeat("hall-lb", "Work out $LB$.", S => {
    hallBoard(S, { fromC: true, fromA: true })
    liftOut(S, "up", ["L", "B", "C"], "B", { [segKey("B", "C")]: lens("20", BLUE), [segKey("B", "L")]: lens("?", ORANGE) }, true).angle = { at: "C", tex: "25^\\circ" }
  }, {
    name: "LB", col: ORANGE, answer: H_LB, sf: 3, shown: sig(H_LB, 3), typed: "20*t25",
    slips: [{ v: 20 * Math.sin(25 * RAD), say: "$LB$ is opposite the $25^\\circ$, and $20$ is next to it. That's tan, not sin." }, { v: 20 / Math.tan(25 * RAD), say: "Multiply: $LB = 20 \\times \\tan 25^\\circ$." }],
    writes: [["up", segKey("B", "L")]],
    onFigure: segKey("B", "L"),
    walk: [
      { say: "$LB$ is opposite the $25^\\circ$, and $20$ is next to it. So tan.", tex: `\\tan 25^\\circ = \\dfrac{${c(ORANGE, "LB")}}{20}` },
      { say: "Move the $20$ across: it multiplies.", tex: `${c(ORANGE, "LB")} = 20 \\times \\tan 25^\\circ = ${c(GREEN, sig(H_LB, 3))}` },
    ],
  }),
  liftBeat("hall-lift-a", "Now tap triangle $LBA$ to lift it out.", S => {
    hallBoard(S, { fromC: true, fromA: true, lb: sig(H_LB, 3) })
    look(S)
  }, {
    regions: [{ id: "LBA", pts: ["L", "B", "A"] }],
    makes: { LBA: { pts: ["L", "B", "A"], right: "B", lens: { [segKey("B", "A")]: lens("12", BLUE), [segKey("B", "L")]: lens(sig(H_LB, 3), ORANGE) }, angle: { at: "A", tex: "?" } } },
  }),
  askBeat("hall-ang", "Work out the angle of elevation from $A$.", S => {
    hallBoard(S, { fromC: true, fromA: true, lb: sig(H_LB, 3) })
    liftOut(S, "up", ["L", "B", "A"], "B", { [segKey("B", "A")]: lens("12", BLUE), [segKey("B", "L")]: lens(sig(H_LB, 3), ORANGE) }, true).angle = { at: "A", tex: "?" }
  }, {
    name: "\\theta", col: CHALK, answer: H_ANG, dp: 1, shown: `${H_ANG.toFixed(1)}^\\circ`, ans: H_LB, typed: "Ta/12",
    slips: angleSlips(H_ANG, H_LB / 12, "$L$, at the top"),
    angleOn: "up",
    walk: angleWalk("tan", [sig(H_LB, 3), ORANGE], ["12", BLUE], H_ANG),
  }),
]

const PART_C: Beat[] = [
  // ── 6. Exam questions ──
  // 4024/21/O/N/25 Q25(b)
  watch("x1", "Back to the exam cuboid: $EH = 12$, $HG = 10$, $GC = 7$, and $CE = 17.1$ cm.", S => { x1Board(S); look(S) }, 2.8),
  watch("x1-q", "Calculate the angle between the line $CE$ and the base $EFGH$.", S => { x1Board(S); S.segs[segKey("E", "C")].glow = true; look(S) }, 2.6),
  shadowBeat("x1-shadow", "Where does $C$'s shadow land? Tap it.", S => x1Board(S), "C", "G", ["E", "F", "G", "H"], "Look straight down from $C$."),
  angleTapBeat("x1-angle", "Tap the angle between $CE$ and the base.", S => x1Board(S, { light: true, eg: true }),
    [{ at: "E", a: "C", b: "H" }, { at: "E", a: "C", b: "G" }, { at: "E", a: "C", b: "F" }], 1,
    { 0: "That's the angle with the edge $EH$. Use the shadow, $EG$.", 2: "That's the angle with the edge $EF$. Use the shadow, $EG$." }),
  liftBeat("x1-lift", "Tap the triangle to lift it out.", S => { x1Board(S, { eg: true }); S.arcs = [{ at: "E", a: "C", b: "G" }]; look(S) }, {
    regions: [{ id: "EGC", pts: ["E", "G", "C"] }],
    makes: { EGC: { pts: ["E", "G", "C"], right: "G", lens: { [segKey("G", "C")]: lens("7", ORANGE), [segKey("E", "C")]: lens("17.1", PINK) }, angle: { at: "E", tex: "\\theta" } } },
  }),
  askBeat("x1-work", "We know $CG$ and $CE$. Work out the angle.", S => {
    x1Board(S, { eg: true })
    S.arcs = [{ at: "E", a: "C", b: "G" }]
    liftOut(S, "up", ["E", "G", "C"], "G", { [segKey("G", "C")]: lens("7", ORANGE), [segKey("E", "C")]: lens("17.1", PINK) }, true).angle = { at: "E", tex: "\\theta" }
  }, {
    // the mark scheme takes 24.1 or 24.2
    name: "\\theta", col: CHALK, answer: 24.15, dp: 1, shown: "24.2^\\circ", typed: "S7/17.1",
    slips: [...angleSlips(X1_ANG, 7 / 17.1, "$C$, at the top"), { v: Math.atan(7 / 17.1) * DEG, say: "$17.1$ is the hypotenuse here, opposite the right angle. That's sin, not tan." }],
    angleOn: "up",
    walk: angleWalk("sin", ["7", ORANGE], ["17.1", PINK], Math.asin(7 / 17.1) * DEG),
  }),

  // 4024/23/M/J/25 Q22(b)(ii)
  watch("x2", "This pyramid stands on a triangle with sides $34$ cm. Its edges up are $82$ cm, and $OB = 19.6$ cm.", S => { x2Board(S); look(S) }, 3),
  watch("x2-q", "Calculate the angle between the edge $VB$ and the base.", S => { x2Board(S); look(S) }, 2.4),
  shadowBeat("x2-shadow", "Where does $V$'s shadow land? Tap it.", S => x2Board(S), "V", "O", ["A", "B", "C", "O"], "$V$ is straight above the middle of the base, $O$."),
  angleTapBeat("x2-angle", "Tap the angle between $VB$ and the base.", S => x2Board(S, { light: true, shadow: true }),
    [{ at: "B", a: "V", b: "A" }, { at: "B", a: "V", b: "O" }, { at: "B", a: "V", b: "C" }], 1,
    { 0: "That's the angle with the edge $BA$. The shadow of $VB$ is $OB$.", 2: "That's the angle with the edge $BC$. The shadow of $VB$ is $OB$." }),
  liftBeat("x2-lift", "Tap the triangle to lift it out.", S => { x2Board(S, { shadow: true }); S.arcs = [{ at: "B", a: "V", b: "O" }]; look(S) }, {
    regions: [{ id: "VOB", pts: ["V", "O", "B"] }],
    makes: { VOB: { pts: ["V", "O", "B"], right: "O", lens: { [segKey("O", "B")]: lens("19.6", BLUE), [segKey("V", "B")]: lens("82", PINK) }, angle: { at: "B", tex: "\\theta" }, legs: { B: 19.6, V: X2_H } } },
  }),
  askBeat("x2-work", "Work out the angle.", S => {
    x2Board(S, { shadow: true })
    S.arcs = [{ at: "B", a: "V", b: "O" }]
    const F = liftOut(S, "up", ["V", "O", "B"], "O", { [segKey("O", "B")]: lens("19.6", BLUE), [segKey("V", "B")]: lens("82", PINK) }, true)
    F.angle = { at: "B", tex: "\\theta" }
    F.legs = { B: 19.6, V: X2_H }
  }, {
    // the mark scheme takes 76.1 to 76.2
    name: "\\theta", col: CHALK, answer: 76.15, dp: 1, shown: "76.2^\\circ", typed: "C19.6/82",
    slips: [...angleSlips(Math.acos(19.6 / 82) * DEG, 19.6 / 82, "$V$, at the top"), { v: Math.atan(19.6 / 82) * DEG, say: "$82$ is the hypotenuse. We know the adjacent and the hypotenuse: cos." }],
    angleOn: "up",
    walk: angleWalk("cos", ["19.6", BLUE], ["82", PINK], Math.acos(19.6 / 82) * DEG),
  }),

  // 4024/21/O/N/21 Q10(b)(iii)
  watch("x3", "The square-based pyramid again: $EX = 17$, $EC = 19$, and the base is $12$ cm.", S => { x3Board(S); S.arcs = []; look(S) }, 2.8),
  {
    id: "x3-q",
    say: "Calculate angle $CBE$. Is it an angle with the base?",
    enter: S => {
      x3Board(S)
      choose(S, ["Yes", "No"], 1, false, (S2, k, right) => {
        if (right) { say(S2, "Right. Both its lines are in the face $BCE$.", "calm", 3.6); return }
        say(S2, "Look again: $BE$ and $BC$ are both edges of the face $BCE$. Neither is a shadow.", "wrong", 4.2)
      })
      look(S, ["chips"])
    },
    done: S => S.choice?.state === "right",
    advanceAfter: 2400,
  },
  watch("x3-face", "It's an angle inside the face $BCE$.", S => { x3Board(S, { face: true }); look(S) }, 2.2),
  watch("x3-em", "The face's height, $EM$, splits it into two right-angled triangles.", S => { x3Board(S, { face: true, em: true }); S.segs[segKey("E", "M")].glow = true; look(S) }, 2.6),
  liftBeat("x3-lift", "Tap triangle $EMB$ to lift it out.", S => { x3Board(S, { em: true }); look(S) }, {
    regions: [{ id: "EMB", pts: ["E", "M", "B"] }],
    makes: { EMB: { pts: ["E", "M", "B"], right: "M", lens: { [segKey("M", "B")]: lens("6", CHALK), [segKey("E", "B")]: lens("19", PINK) }, angle: { at: "B", tex: "?" } } },
  }),
  askBeat("x3-work", "$MB$ is half of $12$. Work out angle $CBE$.", S => {
    x3Board(S, { em: true })
    liftOut(S, "up", ["E", "M", "B"], "M", { [segKey("M", "B")]: lens("6", CHALK), [segKey("E", "B")]: lens("19", PINK) }, true).angle = { at: "B", tex: "?" }
  }, {
    name: "\\angle CBE", col: CHALK, answer: Math.acos(6 / 19) * DEG, dp: 1, shown: `${(Math.acos(6 / 19) * DEG).toFixed(1)}^\\circ`, typed: "C6/19",
    slips: [...angleSlips(Math.acos(6 / 19) * DEG, 6 / 19, "$E$, at the top"), { v: Math.acos(12 / 19) * DEG, say: "$MB$ is half of $12$: it's $6$." }],
    angleOn: "up",
    walk: angleWalk("cos", ["6", CHALK], ["19", PINK], Math.acos(6 / 19) * DEG, "\\angle CBE"),
  }),

  // 4024/22/O/N/22 Q7(b)
  watch("x4", "$ABCD$ is the floor plan of a hall. A light is straight above $B$.", S => { x4Board(S); look(S) }, 2.6),
  watch("x4-q", "From $C$ the light is $8.2^\\circ$ up. Calculate its angle of elevation from $A$.", S => { x4Board(S, { fromA: true }); look(S) }, 3),
  askBeat("x4-lb", "Find the height first. Work out $LB$.", S => {
    x4Board(S, { fromA: true })
    S.tris = [{ id: "LBC", pts: ["L", "B", "C"], col: CHALK }]
    liftOut(S, "up", ["L", "B", "C"], "B", { [segKey("B", "C")]: lens("107", BLUE), [segKey("B", "L")]: lens("?", ORANGE) }, true).angle = { at: "C", tex: "8.2^\\circ" }
  }, {
    name: "LB", col: ORANGE, answer: X4.LB, sf: 3, shown: sig(X4.LB, 3), typed: "107*t8.2",
    slips: [{ v: 107 * Math.sin(8.2 * RAD), say: "$LB$ is opposite the $8.2^\\circ$, and $107$ is next to it. That's tan." }, { v: 107 / Math.tan(8.2 * RAD), say: "Multiply: $LB = 107 \\times \\tan 8.2^\\circ$." }],
    writes: [["up", segKey("B", "L")]],
    onFigure: segKey("B", "L"),
    walk: [{ say: "$LB$ is opposite the $8.2^\\circ$, and $107$ is next to it. So tan.", tex: `${c(ORANGE, "LB")} = 107 \\times \\tan 8.2^\\circ = ${c(GREEN, sig(X4.LB, 3))}` }],
  }),
  askBeat("x4-ang", "Now the angle of elevation from $A$.", S => {
    x4Board(S, { fromA: true, lb: sig(X4.LB, 3) })
    S.tris = [{ id: "LBA", pts: ["L", "B", "A"], col: CHALK }]
    liftOut(S, "up", ["L", "B", "A"], "B", { [segKey("B", "A")]: lens("95", BLUE), [segKey("B", "L")]: lens(sig(X4.LB, 3), ORANGE) }, true).angle = { at: "A", tex: "?" }
  }, {
    name: "\\theta", col: CHALK, answer: X4.ang, dp: 1, shown: `${X4.ang.toFixed(1)}^\\circ`, ans: X4.LB, typed: "Ta/95",
    slips: angleSlips(X4.ang, X4.LB / 95, "$L$, at the top"),
    angleOn: "up",
    walk: angleWalk("tan", [sig(X4.LB, 3), ORANGE], ["95", BLUE], X4.ang),
  }),

  // 4024/02/O/N/05 Q8(b)
  watch("x5", "$A$, $B$ and $C$ are on a field. A kite is straight above $A$, flown from $B$.", S => { x5Board(S); look(S) }, 2.8),
  watch("x5-q", "The string $BK$ is at $24^\\circ$ to the ground. Calculate the angle of elevation of the kite from $C$.", S => { x5Board(S, { fromC: true }); look(S) }, 3.2),
  askBeat("x5-ak", "Find the kite's height, $AK$, first.", S => {
    x5Board(S, { fromC: true })
    S.tris = [{ id: "KAB", pts: ["K", "A", "B"], col: CHALK }]
    liftOut(S, "up", ["K", "A", "B"], "A", { [segKey("A", "B")]: lens("72", BLUE), [segKey("A", "K")]: lens("?", ORANGE) }, true).angle = { at: "B", tex: "24^\\circ" }
  }, {
    name: "AK", col: ORANGE, answer: X5_AK, sf: 3, shown: sig(X5_AK, 3), typed: "72*t24",
    slips: [{ v: 72 * Math.sin(24 * RAD), say: "$AK$ is opposite the $24^\\circ$, and $72$ is next to it. That's tan." }],
    writes: [["up", segKey("A", "K")]],
    onFigure: segKey("A", "K"),
    walk: [{ say: "$AK$ is opposite the $24^\\circ$, and $72$ is next to it. So tan.", tex: `${c(ORANGE, "AK")} = 72 \\times \\tan 24^\\circ = ${c(GREEN, sig(X5_AK, 3))}` }],
  }),
  askBeat("x5-ang", "Now the angle of elevation from $C$.", S => {
    x5Board(S, { fromC: true, ak: sig(X5_AK, 3) })
    S.tris = [{ id: "KAC", pts: ["K", "A", "C"], col: CHALK }]
    liftOut(S, "up", ["K", "A", "C"], "A", { [segKey("A", "C")]: lens("60", BLUE), [segKey("A", "K")]: lens(sig(X5_AK, 3), ORANGE) }, true).angle = { at: "C", tex: "?" }
  }, {
    name: "\\theta", col: CHALK, answer: X5_ANG, dp: 1, shown: `${X5_ANG.toFixed(1)}^\\circ`, ans: X5_AK, typed: "Ta/60",
    slips: angleSlips(X5_ANG, X5_AK / 60, "$K$, at the top"),
    angleOn: "up",
    walk: angleWalk("tan", [sig(X5_AK, 3), ORANGE], ["60", BLUE], X5_ANG),
  }),

  // ── free play ──
  {
    id: "free",
    say: "Tilt the stick any way you like. Its angle with the floor stays live.",
    enter: S => { stickBoard(S, { th: 40, light: true, handle: true, arc: true }); look(S) },
    cta: "Start again", ctaAfter: 3, restart: true,
  },
]

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C]

applyParts(BEATS, [
  ["stick", "The angle with the floor"],
  ["box", "Back to the box"],
  ["ag-shadow", "Find the shadow"],
  ["q1", "Working out the angle"],
  ["hall", "Heights above the ground"],
  ["x1", "Exam questions"],
])

export { num }
