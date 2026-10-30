/**
 * The sine rule, one tiny idea per beat.
 *
 * It starts with a triangle with no right angle. The student moves its
 * corners and finds that the biggest angle always faces the longest side,
 * the smallest the shortest. Each angle and the side across from it become a
 * pair, coloured alike, and get their names (a across from A, as on the
 * exam's formula page). Does a side double when its angle doubles? No: but
 * each side divided by the sin of its angle gives the same number, for all
 * three pairs, however the triangle is dragged. That is the sine rule.
 *
 * Why: a height from C makes two right-angled triangles; h = b sin A and
 * h = a sin B, so b sin A = a sin B, and two divisions give the rule.
 *
 * Using it: the student finds the angle across from the unknown, finds a
 * full pair, and drags each number off the triangle into an empty rule.
 * Then the algebra, slowly, one move at a time (solve.ts). For an angle the
 * fractions turn over first, and the calculator works in two steps (the
 * right side, then SHIFT sin Ans). An angle could be obtuse: sin 30° and
 * sin 150° are the same, and a side swinging from a corner can meet a line
 * in two places, making two triangles. Five real exam questions finish it.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { type ENode, type Eqn, type Fac, atom, op, row, frac, paren, eqnNode, eqSlow } from "../equation"
import { setAns, sigText } from "../calc"
import {
  type Scene, type Corner, type VisKey, CORNERS, ENDS, PAIR_COL, CHALK, GREEN, YELLOW, RED, BLUE, RAD, DEG,
  resetBeat, show, later, say, angText, lenText, numText, sideLen, angleAt, shownAngles, biggestCorner, labAt, startInput, boxNode,
  heightFoot, choose, pt, figFrame,
} from "./scene"
import {
  type SRQ, nameOf, answerOf, answerText, sinValue, sideVal, angVal, unitTex,
  startFill, filledHalf, filledEqn, startMoves, movesDone, sideMoves, angleMoves, startFlip, askSide, askSinValue, startInverse, askAngle,
  sideWalk, sinValueWalk, angleWalk, sideFac, sinFac, solveOf, flipBoth, numbersFirst, turnRound, type Move,
} from "./solve"

export type Beat = BeatOf<Scene>

const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat => ({ id, say: text, enter, cta: "", ctaAfter })
const inputRight = (S: Scene) => S.input?.state === "right"
const look = (S: Scene, keys: VisKey[]) => show(S, ["board", ...keys])

// ── triangles ────────────────────────────────────────────────────────────

/** Corners from two angles and the side between them: A at the origin, AB along the floor. */
function triFrom(A: number, B: number, c0: number): Record<Corner, Vec> {
  const C = 180 - A - B
  const b = (c0 * Math.sin(B * RAD)) / Math.sin(C * RAD)
  return { A: [0, 0], B: [c0, 0], C: [b * Math.cos(A * RAD), b * Math.sin(A * RAD)] }
}

function setTri(S: Scene, P: Record<Corner, Vec>) {
  for (const k of CORNERS) S.P[k] = [P[k][0], P[k][1]]
}

/** The student's own triangle, as they left it (or a fair one to start). */
const START: Record<Corner, Vec> = { A: [0, 0], B: [9, 0], C: [3.4, 4.8] }
/** The board's room for moving corners about: fixed, so the triangle moves and the view does not. */
const FREE_FRAME = { x0: -1.5, x1: 11, y0: -1.2, y1: 7.2 }

/** A fresh beat with the triangle on the board; free corners if `free`. */
function base(S: Scene, o: { free?: boolean; P?: Record<Corner, Vec>; keep?: boolean } = {}) {
  resetBeat(S)
  if (o.P) setTri(S, o.P)
  else if (!o.keep) {
    // the student's triangle carries on, unless it has been squeezed too thin to read
    const ok = CORNERS.every(k => angleAt(S, k) > 18)
    if (!ok) setTri(S, START)
  }
  S.frame = FREE_FRAME
  S.frameFn = () => FREE_FRAME
  if (o.free) { S.mode = "drag"; S.movable = [...CORNERS] }
}

/** Show the angles live (whole degrees, adding to 180). */
const liveAngles = (S: Scene) => { for (const k of CORNERS) S.angText[k] = s => angText(s, k) }
/** Show the lengths live. */
const liveSides = (S: Scene) => { for (const k of CORNERS) S.sideText[k] = s => lenText(s, k) }
const allColoured = (S: Scene) => { S.coloured = new Set(CORNERS) }
const letterNames = (S: Scene) => { for (const k of CORNERS) S.sideText[k] = () => k.toLowerCase() }

const SMALL: Record<Corner, string> = { A: "a", B: "b", C: "c" }

// ── part 1: tapping angles and sides ─────────────────────────────────────

/** Tap the angle that is the biggest (or smallest) as shown. */
function tapExtremeAngle(id: string, text: string, which: "max" | "min"): Beat {
  return {
    id, say: text,
    enter: S => {
      base(S)
      liveAngles(S)
      S.mode = "tapAngle"
      S.onAngle = (S2, k) => {
        if (S2.got.has("tap")) return
        const a = shownAngles(S2)
        const want = a[biggestCorner(S2, which)]
        if (a[k] === want) { S2.got.add("tap"); S2.got.add(`c-${k}`); S2.glowAng = new Set([k]); S2.touched = { kind: "angle", c: k }; S2.flashGood = 1; S2.note = null; return }
        say(S2, which === "max" ? `That's $${a[k]}^\\circ$. Look for a bigger one.` : `That's $${a[k]}^\\circ$. Look for a smaller one.`, "wrong", 3.4)
      }
      look(S, ["tri", "fill", "arcs", "angLabs"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** Tap the side across from the angle just tapped (the extreme one). */
function tapAcross(id: string, text: string, which: "max" | "min"): Beat {
  return {
    id, say: text,
    enter: S => {
      base(S)
      liveAngles(S)
      const k = biggestCorner(S, which)
      S.glowAng = new Set([k])
      S.mode = "tapSide"
      S.onSide = (S2, s) => {
        if (S2.got.has("tap")) return
        if (s === k) { S2.got.add("tap"); S2.light = null; S2.glowSide = new Set([s]); S2.touched = { kind: "side", c: s }; S2.flashGood = 1; S2.note = null; return }
        say(S2, "That side touches the angle. Go across from it.", "wrong", 3.4)
        S2.light = { from: k, since: S2.time }
      }
      look(S, ["tri", "fill", "arcs", "angLabs"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** The lengths appear and the extreme side glows with its angle. */
function itIs(id: string, text: string, which: "max" | "min"): Beat {
  return watch(id, text, S => {
    base(S)
    liveAngles(S)
    liveSides(S)
    const k = biggestCorner(S, which)
    S.glowAng = new Set([k])
    S.glowSide = new Set([k])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.2)
}

// ── part 3: dividing each side by the sin of its angle ───────────────────

/** The 30°, 60°, 90° triangle the student makes (hypotenuse 10). */
const T306090 = triFrom(30, 60, 10)

/** a ÷ sin 30° = 5 ÷ 0.5 = 10, built a piece at a time. */
function ratioBuild(S: Scene, k: Corner, stage: number, from: Record<string, Vec>, keep: ENode[] = []): ENode {
  const len = numText(sideLen(S, k), 2), ang = angleAt(S, k)
  const sinV = numText(Math.sin(ang * RAD), 3)
  const col = PAIR_COL[k]
  const items: ENode[] = [...keep]
  const top = atom(`rt-${k}`, len, { col, from: from[`rt-${k}`], fly: 1.1 })
  const bot = row([atom(`rs-${k}`, "\\sin"), atom(`ra-${k}`, `${Math.round(ang)}^\\circ`, { col, from: from[`ra-${k}`], fly: 1.1 })])
  if (stage >= 1) items.push(frac(`rf-${k}`, top, stage >= 2 ? bot : atom(`rp-${k}`, "\\phantom{0}")))
  if (stage >= 3) items.push(op(`re-${k}`, "="), frac(`rg-${k}`, atom(`rt2-${k}`, len, { col }), atom(`rv-${k}`, sinV)))
  if (stage >= 4) items.push(op(`rq-${k}`, "="), atom(`rr-${k}`, numText(sideLen(S, k) / Math.sin(ang * RAD), 2), { col: GREEN }))
  return row(items)
}

/** The three ratios side by side, live: a / sin A = b / sin B = c / sin C = 10.2. */
function ratiosLive(S: Scene): ENode {
  const items: ENode[] = []
  CORNERS.forEach((k, i) => {
    if (i) items.push(op(`req${i}`, "="))
    items.push(frac(`lf-${k}`, atom(`lt-${k}`, lenText(S, k), { col: PAIR_COL[k] }), row([atom(`ls-${k}`, "\\sin"), atom(`la-${k}`, angText(S, k), { col: PAIR_COL[k] })])))
  })
  const r = sideLen(S, "A") / Math.sin(angleAt(S, "A") * RAD)
  items.push(op("reqv", "="), atom("lv", numText(r, 1), { col: GREEN }))
  return row(items)
}

/** The rule in letters: a / sin A = b / sin B = c / sin C, each pair in its colour. */
function ruleLetters(only?: Corner[], fade?: Corner[]): ENode {
  const items: ENode[] = []
  const ks = only ?? CORNERS
  ks.forEach((k, i) => {
    if (i) items.push(op(`ru${i}`, "="))
    const faint = fade?.includes(k)
    items.push(frac(`ruf-${k}`, atom(`rut-${k}`, SMALL[k], { col: faint ? "#3c4247" : PAIR_COL[k] }), row([atom(`rus-${k}`, "\\sin", { col: faint ? "#3c4247" : undefined }), atom(`rua-${k}`, k, { col: faint ? "#3c4247" : PAIR_COL[k] })]), faint ? "#3c4247" : undefined))
  })
  return row(items)
}

// ── turning and sliding a corner to a target angle ───────────────────────

/** C turns about A, keeping AC's length; it clicks onto angle A = want. */
function turnCAbout(S: Scene, want: number, len: number) {
  S.mode = "rule"
  S.lockOnSnap = true
  const place = (_S: Scene, w: Vec): Vec => {
    let a = Math.atan2(w[1], w[0]) * DEG
    a = Math.min(Math.max(a, 4), 150)
    return [len * Math.cos(a * RAD), len * Math.sin(a * RAD)]
  }
  S.rule = {
    pt: "C", place,
    snap: (_S, p) => {
      const a = Math.atan2(p[1], p[0]) * DEG
      return Math.abs(a - want) < 2.5 ? [len * Math.cos(want * RAD), len * Math.sin(want * RAD)] : null
    },
  }
  S.releaseNote = S2 => {
    const a = angleAt(S2, "A")
    return Math.abs(a - want) < 9 ? `Close. Make angle $A$ exactly $${want}^\\circ$.` : a > want ? "Too big. Turn it down a little." : "Too small. Turn it up a little."
  }
}

/** C slides along its line from A (A stays the same); it clicks onto angle B = want. */
function slideCAlong(S: Scene, aDeg: number, want: number) {
  S.mode = "rule"
  S.lockOnSnap = true
  const u: Vec = [Math.cos(aDeg * RAD), Math.sin(aDeg * RAD)]
  const Bx = S.P.B[0]
  // where on the line angle B is the target
  const tWant = (Bx * Math.sin(want * RAD)) / Math.sin((180 - aDeg - want) * RAD)
  S.rule = {
    pt: "C",
    place: (_S, w) => { const t = Math.min(Math.max(w[0] * u[0] + w[1] * u[1], 1.2), 13); return [u[0] * t, u[1] * t] },
    snap: (S2, p) => {
      const B = angleAt({ ...S2, P: { ...S2.P, C: p } } as Scene, "B")
      return Math.abs(B - want) < 2.5 ? [u[0] * tWant, u[1] * tWant] : null
    },
  }
  S.releaseNote = S2 => {
    const b = angleAt(S2, "B")
    return Math.abs(b - want) < 9 ? `Close. Make angle $B$ exactly $${want}^\\circ$.` : b > want ? "Too big. Slide it back a little." : "Too small. Slide it out a little."
  }
}

const PART_A: Beat[] = [
  // ── 1. Angles and the sides across from them ──
  {
    id: "open",
    say: "Here is a triangle with no right angle. Try dragging its corners.",
    enter: S => {
      base(S, { free: true, P: START })
      look(S, ["tri", "fill"])
    },
    done: S => S.moved > 260,
    free: true,
    minPlay: 3,
  },
  watch("angles", "Each corner has an angle.", S => {
    base(S)
    liveAngles(S)
    look(S, ["tri", "fill", "arcs", "angLabs"])
  }, 2.0),
  tapExtremeAngle("tap-big", "Tap the biggest angle.", "max"),
  tapAcross("tap-big-side", "Now tap the side across from it.", "max"),
  itIs("longest", "It's the longest side.", "max"),
  {
    id: "move-big",
    say: "Drag a corner until a different angle is the biggest.",
    enter: S => {
      base(S, { free: true })
      liveAngles(S)
      liveSides(S)
      S.biggest = "max"
      const first = biggestCorner(S, "max")
      S.tick = S2 => { if (biggestCorner(S2, "max") !== first) S2.got.add("changed") }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
    },
    done: S => S.got.has("changed"),
    free: true,
    minPlay: 3,
  },
  watch("faces", "The biggest angle always faces the longest side.", S => {
    base(S, { free: true })
    liveAngles(S)
    liveSides(S)
    S.biggest = "max"
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.6),
  tapExtremeAngle("tap-small", "Tap the smallest angle.", "min"),
  tapAcross("tap-small-side", "Tap the side across from it.", "min"),
  itIs("shortest", "It's the shortest side.", "min"),
  {
    id: "grow",
    say: "So the bigger the angle, the longer the side across from it.",
    enter: S => {
      base(S, { free: true })
      liveAngles(S)
      liveSides(S)
      S.biggest = "max"
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
    },
    done: S => S.moved > 200,
    free: true,
    minPlay: 3,
  },

  // ── 2. Pairs and their names ──
  watch("pair", "Each angle and the side across from it make a pair.", S => {
    base(S)
    // the light goes across from each angle in turn
    CORNERS.forEach((k, i) => later(S, 0.3 + i * 2.6, S2 => { S2.light = { from: k, since: S2.time } }))
    look(S, ["tri", "fill", "arcs"])
  }, 3.0),
  ...CORNERS.map((k, i): Beat => ({
    id: `colour-${k}`,
    say: i === 0 ? "Let's colour this pair yellow. Tap the side that goes with it." : i === 1 ? "This angle is blue. Tap its side." : "And this one is red. Tap its side.",
    enter: S => {
      base(S)
      for (const j of CORNERS.slice(0, i)) S.coloured.add(j)
      S.angColoured = new Set([k])
      S.pulseAng = new Set([k])
      S.mode = "tapSide"
      S.onSide = (S2, s) => {
        if (S2.got.has("tap")) return
        if (s === k) { S2.got.add("tap"); S2.coloured.add(k); S2.pulseAng = new Set(); S2.light = null; S2.touched = { kind: "side", c: s }; S2.flashGood = 1; S2.note = null; return }
        say(S2, "That side touches the angle. Go across from it.", "wrong", 3.4)
        S2.light = { from: k, since: S2.time }
      }
      look(S, ["tri", "fill", "arcs"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  })),
  watch("names", "We call the angles $A$, $B$ and $C$.", S => {
    base(S)
    allColoured(S)
    look(S, ["tri", "fill", "arcs", "letters"])
  }, 2.2),
  watch("small-a", "The side across from $A$ is called small $a$.", S => {
    base(S)
    allColoured(S)
    S.sideText.A = () => "a"
    S.pulseSide = new Set(["A"])
    look(S, ["tri", "fill", "arcs", "letters", "sideLabs"])
  }, 2.4),
  ...(["B", "C"] as Corner[]).map((k, i): Beat => ({
    id: `tap-side-${k}`,
    say: `Tap side $${SMALL[k]}$.`,
    enter: S => {
      base(S)
      allColoured(S)
      S.sideText.A = () => "a"
      if (i === 1) S.sideText.B = () => "b"
      S.mode = "tapSide"
      S.onSide = (S2, s) => {
        if (S2.got.has("tap")) return
        if (s === k) { S2.got.add("tap"); S2.sideText[k] = () => SMALL[k]; S2.touched = { kind: "side", c: s }; S2.flashGood = 1; S2.note = null; return }
        say(S2, `Side $${SMALL[k]}$ is across from angle $${k}$.`, "wrong", 3.4)
        S2.light = { from: k, since: S2.time }
      }
      look(S, ["tri", "fill", "arcs", "letters", "sideLabs"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1200,
  })),
  {
    id: "tap-ang-A",
    say: "Now tap angle $A$.",
    enter: S => {
      base(S)
      allColoured(S)
      letterNames(S)
      S.mode = "tapAngle"
      S.onAngle = (S2, k) => {
        if (S2.got.has("tap")) return
        if (k === "A") { S2.got.add("tap"); S2.glowAng = new Set(["A"]); S2.touched = { kind: "angle", c: k }; S2.flashGood = 1; S2.note = null; return }
        say(S2, `That's angle $${k}$. Angle $A$ is at corner $A$.`, "wrong", 3.4)
      }
      look(S, ["tri", "fill", "arcs", "letters", "sideLabs"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1200,
  },
  watch("formula-page", "The exam's formula page names a triangle the same way.", S => {
    // the page draws A at the top, B bottom left, C bottom right
    base(S, { P: { A: [3.2, 5.2], B: [0, 0], C: [9, 0] } })
    allColoured(S)
    letterNames(S)
    look(S, ["tri", "fill", "arcs", "letters", "sideLabs"])
  }, 2.6),

  // ── 3. How much longer? ──
  {
    id: "turn-30",
    say: "Turn angle $A$ to $30^\\circ$.",
    enter: S => {
      base(S, { P: { A: [0, 0], B: [10, 0], C: [6 * Math.cos(55 * RAD), 6 * Math.sin(55 * RAD)] } })
      allColoured(S)
      liveAngles(S)
      turnCAbout(S, 30, 6)
      look(S, ["tri", "fill", "arcs", "angLabs", "letters"])
    },
    done: S => S.locked,
    advanceAfter: 1400,
  },
  {
    id: "slide-60",
    say: "Now make angle $B$ $60^\\circ$.",
    enter: S => {
      base(S, { P: { A: [0, 0], B: [10, 0], C: [6 * Math.cos(30 * RAD), 6 * Math.sin(30 * RAD)] } })
      allColoured(S)
      liveAngles(S)
      slideCAlong(S, 30, 60)
      S.tick = S2 => { if (S2.locked && !S2.got.has("said")) { S2.got.add("said"); say(S2, "Angle $C$ is $90^\\circ$.", "calm", 600) } }
      look(S, ["tri", "fill", "arcs", "angLabs", "letters"])
    },
    done: S => S.locked,
    advanceAfter: 2400,
  },
  {
    id: "double",
    say: "$B$ is double $A$. Is side $b$ double side $a$?",
    enter: S => {
      base(S, { P: T306090 })
      allColoured(S)
      liveAngles(S)
      S.sideText.A = () => "a"
      S.sideText.B = () => "b"
      choose(S, ["Yes", "No"], 1)
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "chips"])
    },
    done: S => !!S.choice && S.choice.picked !== null,
    advanceAfter: 1500,
  },
  watch("see", "Let's see. $a$ is $5$ and $b$ is $8.66$.", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    S.sideText.A = s => lenText(s, "A")
    S.sideText.B = s => lenText(s, "B")
    S.pulseSide = new Set(["A", "B"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
  }, 2.4),
  watch("not-step", "$8.66$ isn't double $5$. The side doesn't grow in step with the angle.", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    S.sideText.A = s => lenText(s, "A")
    S.sideText.B = s => lenText(s, "B")
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
  }, 2.6),
  watch("divide", "What if we divide each side by the sin of its angle?", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    S.sideText.A = s => lenText(s, "A")
    S.sideText.B = s => lenText(s, "B")
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
  }, 2.2),
  ...(["A", "B"] as Corner[]).map((k): Beat => watch(`ratio-${k}`, k === "A" ? "$a \\div \\sin 30^\\circ = 5 \\div 0.5 = 10$" : "$b \\div \\sin 60^\\circ = 8.66 \\div 0.866 = 10$", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    S.sideText.A = s => lenText(s, "A")
    S.sideText.B = s => lenText(s, "B")
    let stage = 0
    const from: Record<string, Vec> = {}
    // a's line stays while b's is built
    const keep = (S2: Scene): ENode[] => (k === "B" ? [ratioBuild(S2, "A", 4, {}), atom("gap", "\\qquad")] : [])
    S.eqFn = S2 => ratioBuild(S2, k, stage, from, keep(S2))
    later(S, 0.5, S2 => { S2.pulseSide = new Set([k]) })
    later(S, 1.0, S2 => { from[`rt-${k}`] = labAt(S2, `side-${k}`) ?? [S2.w / 2, S2.h / 2]; stage = 1 })
    later(S, 2.2, S2 => { S2.pulseSide = new Set(); S2.pulseAng = new Set([k]) })
    later(S, 2.7, S2 => { from[`ra-${k}`] = labAt(S2, `ang-${k}`) ?? [S2.w / 2, S2.h / 2]; stage = 2 })
    later(S, 4.0, S2 => { S2.pulseAng = new Set(); stage = 3 })
    later(S, 5.2, () => { stage = 4 })
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 5.8)),
  watch("same", "Both give $10$.", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    S.sideText.A = s => lenText(s, "A")
    S.sideText.B = s => lenText(s, "B")
    S.eqFn = S2 => row([ratioBuild(S2, "A", 4, {}), atom("gap", "\\qquad"), ratioBuild(S2, "B", 4, {})])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.0),
  {
    id: "what-c",
    say: "What about $c$? Tap side $c$ and angle $C$.",
    enter: S => {
      base(S, { P: T306090 })
      allColoured(S)
      liveAngles(S)
      S.sideText.A = s => lenText(s, "A")
      S.sideText.B = s => lenText(s, "B")
      // either order: side c shows its length when tapped
      S.mode = "tapPair"
      const both = (S2: Scene) => { if (S2.got.has("side") && S2.got.has("ang")) { S2.got.add("tap"); S2.flashGood = 1 } }
      S.onSide = (S2, s) => {
        if (S2.got.has("tap") || S2.got.has("side")) return
        if (s === "C") { S2.got.add("side"); S2.sideText.C = s3 => lenText(s3, "C"); S2.glowSide = new Set(["C"]); S2.touched = { kind: "side", c: "C" }; S2.flashGood = 0.8; S2.note = null; both(S2); return }
        say(S2, "Side $c$ is across from angle $C$.", "wrong", 3)
      }
      S.onAngle = (S2, k) => {
        if (S2.got.has("tap") || S2.got.has("ang")) return
        if (k === "C") { S2.got.add("ang"); S2.glowAng = new Set(["C"]); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 0.8; S2.note = null; both(S2); return }
        say(S2, "Angle $C$ is the one across from side $c$.", "wrong", 3)
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("ratio-C", "$c \\div \\sin 90^\\circ = 10 \\div 1 = 10$", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    liveSides(S)
    let stage = 0
    const from: Record<string, Vec> = {}
    S.eqFn = S2 => ratioBuild(S2, "C", stage, from)
    later(S, 0.6, S2 => { from["rt-C"] = labAt(S2, "side-C") ?? [S2.w / 2, S2.h / 2]; stage = 1 })
    later(S, 1.9, S2 => { from["ra-C"] = labAt(S2, "ang-C") ?? [S2.w / 2, S2.h / 2]; stage = 2 })
    later(S, 3.1, () => { stage = 3 })
    later(S, 4.2, () => { stage = 4 })
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 4.8),
  watch("all-ten", "All three pairs give $10$.", S => {
    base(S, { P: T306090 })
    allColoured(S)
    liveAngles(S)
    liveSides(S)
    S.eqFn = S2 => ratiosLive(S2)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.2),
  {
    id: "drag-any",
    say: "Now drag any corner. Watch the three fractions.",
    enter: S => {
      base(S, { free: true, P: T306090 })
      allColoured(S)
      liveAngles(S)
      liveSides(S)
      S.eqFn = S2 => ratiosLive(S2)
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    done: S => S.moved > 300,
    free: true,
    minPlay: 5,
  },
  watch("always", "They always match each other.", S => {
    base(S, { free: true })
    allColoured(S)
    liveAngles(S)
    liveSides(S)
    S.eqFn = S2 => ratiosLive(S2)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.2),
  watch("sine-rule", "This is the *sine rule*.", S => {
    base(S)
    allColoured(S)
    letterNames(S)
    S.eqFn = () => ruleLetters()
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "eq"])
  }, 2.4),
  watch("on-page", "You'll find it on your exam's formula page.", S => {
    base(S)
    allColoured(S)
    letterNames(S)
    S.eqFn = () => ruleLetters()
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "eq"])
  }, 2.6),
]

// ── part 4: why it works ─────────────────────────────────────────────────

/** An acute triangle, its sides named, for the height. */
const PROOF: Record<Corner, Vec> = { A: [0, 0], B: [10, 0], C: [3.6, 5.6] }

function proofBoard(S: Scene, o: { dropped?: boolean; glow?: "left" | "right" | null } = {}) {
  base(S, { P: PROOF })
  allColoured(S)
  letterNames(S)
  S.height = { drop: o.dropped ? 1 : 0, since: S.time, glow: o.glow ?? null }
  if (o.dropped) {
    S.P.H = heightFoot(S, false)
    S.extra = { segs: [], labels: [{ a: "C", b: "H", tex: "h" }] }
  }
  S.frameFn = () => figFrame(S, ["A", "B", "C"])
}

/** Letters as factors for the proof: b, a, h and sin A, sin B. */
const L = {
  b: (S: Scene): Fac => ({ id: "s-B", tex: "b", col: BLUE, key: "s-B", v: sideLen(S, "B") }),
  a: (S: Scene): Fac => ({ id: "s-A", tex: "a", col: YELLOW, key: "s-A", v: sideLen(S, "A") }),
  h: (S: Scene): Fac => ({ id: "h", tex: "h", key: "h", v: Math.hypot(...(S.P.C.map((v, i) => v - heightFoot(S, false)[i]) as Vec)) }),
  sin: (S: Scene, k: Corner): Fac => ({ id: `F-${k}`, tex: "", key: `F-${k}`, v: Math.sin(angleAt(S, k) * RAD), parts: [{ id: `fn-${k}`, tex: "\\sin" }, { id: `ang-${k}`, tex: k, col: PAIR_COL[k] }] }),
}

/** sin A = h / b (or sin B = h / a): one right-angled triangle's rule. */
const sinEqn = (S: Scene, k: "A" | "B"): Eqn => ({ L: { num: [L.sin(S, k)], den: [] }, R: { num: [L.h(S)], den: [k === "A" ? L.b(S) : L.a(S)] } })
/** b sin A = a sin B. */
const bothEqn = (S: Scene): Eqn => ({ L: { num: [L.b(S), L.sin(S, "A")], den: [] }, R: { num: [L.a(S), L.sin(S, "B")], den: [] } })

function hMove(S: Scene, k: "A" | "B"): Move[] {
  const f = k === "A" ? L.b(S) : L.a(S)
  const n = k === "A" ? "b" : "a"
  return [{ kind: "mul", fac: f, wrong: { kind: "div", fac: f, say: `Now $h$ is divided by $${n}$ twice. That made it worse.` }, cancelNote: `Tap the two $${n}$s to cancel them.`, after: e => turnRound(e) }]
}

// ── parts 5 and 6: questions on a triangle ───────────────────────────────

interface QSpec extends SRQ {
  P: Record<Corner, Vec>
  names?: Partial<Record<string, string>>
  knownSides: Corner[]
  knownAngles: Corner[]
  /** other points of the figure, and how it is drawn */
  pts?: Record<string, Vec>
  extra?: Scene["extra"]
}

/** A question from two angles and a side: everything else follows. */
function q(id: string, o: { A: number; B: number; side: [Corner, number] }, want: Corner, find: "side" | "angle", pair: Corner, more: Partial<QSpec>): QSpec {
  const ang: Record<Corner, number> = { A: o.A, B: o.B, C: 180 - o.A - o.B }
  const r = o.side[1] / Math.sin(ang[o.side[0]] * RAD)
  const side: Record<Corner, number> = { A: r * Math.sin(ang.A * RAD), B: r * Math.sin(ang.B * RAD), C: r * Math.sin(ang.C * RAD) }
  return { id, want, find, pair, side, angle: ang, P: triFrom(ang.A, ang.B, side.C), knownSides: [], knownAngles: [], ...more }
}

const degTex = (d: number) => `${numText(d, 1)}^\\circ`

/** A question's triangle: what it gives, the unknown in its pair's colour, nothing else. */
function qBoard(S: Scene, Q: QSpec, o: { extraAngles?: Corner[] } = {}) {
  base(S, { P: Q.P })
  allColoured(S)
  if (Q.names) S.names = { ...Q.names }
  for (const [n, v] of Object.entries(Q.pts ?? {})) S.P[n] = [v[0], v[1]]
  S.extra = Q.extra ?? null
  const u = unitTex(Q)
  for (const k of Q.knownSides) S.sideText[k] = () => `${numText(sideVal(Q, k), 2)}${u}`
  for (const k of [...Q.knownAngles, ...(o.extraAngles ?? [])]) S.angText[k] = () => degTex(angVal(Q, k))
  if (Q.find === "side") S.sideText[Q.want] = () => nameOf(Q)
  else S.angText[Q.want] = () => nameOf(Q)
  S.frameFn = () => figFrame(S)
}

const QLOOK: VisKey[] = ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]

/** The labels that can be dragged into the rule: every side and angle written on the figure. */
function dragLabels(Q: QSpec, extraAngles: Corner[] = []): Record<string, string> {
  const out: Record<string, string> = {}
  const u = ""
  for (const k of Q.knownSides) out[`side-${k}`] = `${numText(sideVal(Q, k), 2)}${u}`
  for (const k of [...Q.knownAngles, ...extraAngles]) out[`ang-${k}`] = degTex(angVal(Q, k))
  if (Q.find === "side") out[`side-${Q.want}`] = nameOf(Q)
  else out[`ang-${Q.want}`] = nameOf(Q)
  return out
}

/** Tap the angle across from the unknown side (or the side across from the unknown angle). */
function tapUnknownPair(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      const k = Q.want
      if (Q.find === "side") {
        S.mode = "tapAngle"
        S.onAngle = (S2, a) => {
          if (S2.got.has("tap")) return
          if (a === k) { S2.got.add("tap"); S2.glowAng = new Set([k]); S2.touched = { kind: "angle", c: k }; S2.flashGood = 1; S2.note = null; S2.light = null; return }
          say(S2, `That angle touches $${nameOf(Q)}$. Go across from it.`, "wrong", 3.4)
          S2.light = { from: k, since: S2.time }
        }
      } else {
        S.mode = "tapSide"
        S.onSide = (S2, sd) => {
          if (S2.got.has("tap")) return
          if (sd === k) { S2.got.add("tap"); S2.glowSide = new Set([k]); S2.touched = { kind: "side", c: k }; S2.flashGood = 1; S2.note = null; S2.light = null; return }
          say(S2, `That side touches $${nameOf(Q)}$. Go across from it.`, "wrong", 3.4)
          S2.light = { from: k, since: S2.time }
        }
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** Find a full pair: tap a known side and the angle across from it, in either order. */
function tapFullPair(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.glowAng = Q.find === "side" ? new Set([Q.want]) : new Set()
      S.glowSide = Q.find === "angle" ? new Set([Q.want]) : new Set()
      S.mode = "tapPair"
      const k = Q.pair
      // the second tap: say which half of the pair is still to come
      const half = (S2: Scene) => {
        if (S2.got.has("side") && S2.got.has("ang")) { S2.got.add("tap"); S2.flashGood = 1; S2.note = null; S2.light = null; return }
        say(S2, S2.got.has("side") ? "Now tap the angle across from it." : "Now tap the side across from it.", "calm", 600)
      }
      S.onSide = (S2, sd) => {
        if (S2.got.has("tap") || S2.got.has("side")) return
        if (sd === k) {
          S2.got.add("side")
          S2.glowSide = new Set([...S2.glowSide, sd])
          S2.touched = { kind: "side", c: sd }
          S2.flashGood = 0.8
          half(S2)
          return
        }
        if (S2.got.has("ang")) { say(S2, "Go across from the angle you tapped.", "wrong", 3.4); S2.light = { from: k, since: S2.time }; return }
        if (sd === Q.want) say(S2, Q.find === "side" ? `That's $${nameOf(Q)}$. We don't know it yet.` : `That side goes with $${nameOf(Q)}$, which we don't know.`, "wrong", 3.6)
        else if (!Q.knownSides.includes(sd)) say(S2, "We don't know that side's length.", "wrong", 3.4)
        else say(S2, "We know that side, but not the angle across from it.", "wrong", 3.6)
      }
      S.onAngle = (S2, a) => {
        if (S2.got.has("tap") || S2.got.has("ang")) return
        if (a === k) {
          S2.got.add("ang")
          S2.glowAng = new Set([...S2.glowAng, a])
          S2.touched = { kind: "angle", c: a }
          S2.flashGood = 0.8
          half(S2)
          return
        }
        if (S2.got.has("side")) { say(S2, "Go across from the side you tapped.", "wrong", 3.4); S2.light = { from: k, since: S2.time }; return }
        if (a === Q.want) say(S2, Q.find === "angle" ? `That's $${nameOf(Q)}$. We don't know it yet.` : `That angle goes with $${nameOf(Q)}$, which we don't know.`, "wrong", 3.6)
        else if (!Q.knownAngles.includes(a)) say(S2, "We don't know that angle.", "wrong", 3.4)
        else say(S2, "We know that angle, but not the side across from it.", "wrong", 3.6)
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1400,
  }
}

/** Drag the numbers off the triangle into the empty rule. */
function fillBeat(id: string, text: string, Q: QSpec, half: "left" | "right" | "both", ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.glowAng = new Set([Q.want, Q.pair].filter(k => half !== "right" || k === Q.pair))
      startFill(S, Q, half, dragLabels(Q, ex))
      look(S, [...QLOOK, "eq"])
    },
    done: S => filledHalf(S, half),
    advanceAfter: 1300,
  }
}

/** The rule with the numbers in, on the board. */
const filledOn = (S: Scene, Q: QSpec) => { S.alg = filledEqn(Q); S.eqFn = S2 => eqnNode(S2.alg!, {}) }

/** What is dividing x (or sin θ)? Tap it. */
function tapDividing(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.alg = Q.find === "side" ? filledEqn(Q) : flipBoth(filledEqn(Q))
      const right = Q.find === "side" ? [`fn-${Q.want}`, `ang-${Q.want}`] : [`s-${Q.want}`]
      const self = Q.find === "side" ? [`s-${Q.want}`] : [`fn-${Q.want}`, `ang-${Q.want}`]
      S.eqFn = S2 => eqnNode(S2.alg!, { pulse: S2.got.has("tap") ? new Set(right) : undefined })
      S.mode = "tapEq"
      S.tapAtoms = [...right, ...self, `s-${Q.pair}`, `fn-${Q.pair}`, `ang-${Q.pair}`, "eq"]
      S.onAtom = (S2, a) => {
        if (S2.got.has("tap")) return
        if (right.includes(a)) {
          S2.got.add("tap"); S2.touched = { kind: "eq" }; S2.flashGood = 1
          say(S2, Q.find === "side" ? `$${nameOf(Q)}$ is divided by $\\sin ${degTex(angVal(Q, Q.want))}$.` : `$\\sin ${nameOf(Q)}$ is divided by $${numText(sideVal(Q, Q.want), 2)}$.`, "calm", 600)
          return
        }
        if (self.includes(a)) say(S2, Q.find === "side" ? `That's $${nameOf(Q)}$ itself. Tap what it is divided by.` : `That's $\\sin ${nameOf(Q)}$ itself. Tap what it is divided by.`, "wrong", 3.4)
        else say(S2, "That's on the other side. Look under it.", "wrong", 3)
      }
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1700,
  }
}

/** Make the move (and tap the cancel): x on its own, or sin θ on its own. */
function moveBeat(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.alg = Q.find === "side" ? filledEqn(Q) : flipBoth(filledEqn(Q))
      startMoves(S, Q.find === "side" ? sideMoves(Q) : angleMoves(Q))
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1500,
  }
}

/** Flip the rule: tap the = and both fractions turn over. */
function flipBeat(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.alg = filledEqn(Q)
      startFlip(S)
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("flipDone"),
    advanceAfter: 1200,
  }
}

/** The side, worked out. */
function sideCalc(id: string, text: string, Q: QSpec, ex: Corner[] = [], then?: (S: Scene) => void): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      const e = filledEqn(Q)
      S.alg = { L: { num: [sideFac(Q, Q.want)], den: [] }, R: numbersFirst({ num: [sinFac(Q, Q.want, "m1R"), sideFac(Q, Q.pair)], den: [sinFac(Q, Q.pair)] }) }
      void e
      askSide(S, Q, S2 => { S2.sideText[Q.want] = () => `${answerText(Q)}${unitTex(Q)}`; S2.touched = { kind: "side", c: Q.want }; S2.flashGood = 1.2; then?.(S2) })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: sideWalk(Q),
  }
}

/** An angle, step one: the right side. */
function sinCalc(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      S.alg = { L: { num: [sinFac(Q, Q.want)], den: [] }, R: numbersFirst({ num: [{ ...sideFac(Q, Q.want), id: `m1R.s-${Q.want}` }, sinFac(Q, Q.pair)], den: [sideFac(Q, Q.pair)] }) }
      askSinValue(S, Q)
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: sinValueWalk(Q),
  }
}

/** An angle, step two: undo the sin (both sides, then the cancel). */
function undoBeat(id: string, text: string, Q: QSpec, ex: Corner[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      startInverse(S, Q)
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1400,
  }
}

/** An angle, step three: SHIFT sin Ans. */
function angleCalc(id: string, text: string, Q: QSpec, ex: Corner[] = [], then?: (S: Scene) => void): Beat {
  return {
    id, say: text,
    enter: S => {
      qBoard(S, Q, { extraAngles: ex })
      askAngle(S, Q, S2 => { S2.angText[Q.want] = () => `${answerText(Q)}^\\circ`; S2.touched = { kind: "angle", c: Q.want }; S2.flashGood = 1.2; then?.(S2) })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: angleWalk(Q),
  }
}

/** A number typed in (a missing angle, a sum). */
function askNumber(S: Scene, answer: number, o: { dp?: number; slips?: { v: number; say: string }[]; onRight?: (S: Scene) => void; lead?: ENode[]; unit?: string } = {}) {
  startInput(S, { answer, dp: o.dp, slips: o.slips, onRight: o.onRight, max: 7 })
  S.eqFn = S2 => {
    const inp = S2.input
    const ans = o.dp ? answer.toFixed(o.dp) : String(answer)
    return row([...(o.lead ?? []), inp?.state === "right" ? atom("ans", `${ans}${o.unit ?? ""}`, { col: GREEN }) : boxNode(S2)])
  }
}

/** Something typed on the calculator, then its answer shown. */
function askTyped(S: Scene, answer: number, shown: string, o: { onRight?: (S: Scene) => void; typed?: string; calcOnly?: string } = {}) {
  startInput(S, { answer, sf: 3, onRight: o.onRight, typed: o.typed, calcOnly: o.calcOnly })
  S.eqFn = S2 => {
    const inp = S2.input
    const items: ENode[] = [boxNode(S2)]
    if (inp?.state === "right") items.push(op("eq", "="), atom("res", shown, { col: GREEN }))
    return row(items)
  }
}

// the questions
const Q1 = q("q1", { A: 40, B: 75, side: ["A", 8] }, "B", "side", "A", { knownSides: ["A"], knownAngles: ["A", "B"] })
const Q2 = q("q2", { A: 50, B: 70, side: ["A", 7] }, "B", "side", "A", { knownSides: ["A"], knownAngles: ["A", "C"] })
const Q3 = (() => {
  const A = 70, a = 9, b = 6
  const B = Math.asin((b * Math.sin(A * RAD)) / a) * DEG
  return q("q3", { A, B, side: ["A", a] }, "B", "angle", "A", { knownSides: ["A", "B"], knownAngles: ["A"] })
})()
const Q4 = (() => {
  const A = 105, a = 11, c0 = 8
  const C = Math.asin((c0 * Math.sin(A * RAD)) / a) * DEG
  return q("q4", { A, B: 180 - A - C, side: ["A", a] }, "C", "angle", "A", { knownSides: ["A", "C"], knownAngles: ["A"] })
})()

// ── part 7: the obtuse one ───────────────────────────────────────────────

/** 30° and 150° from one point, the same height up: with `both` false, 150° is only a faint line. */
function twoAngles(S: Scene, both: boolean) {
  base(S, { P: { A: [-0.01, -0.01], B: [0.01, -0.01], C: [0, 0.01] } })
  const r = 4
  S.P.O = [0, 0]
  S.P.X = [r * 1.25, 0]
  S.P.XL = [-r * 1.25, 0]
  S.P.U = [r * Math.cos(30 * RAD), r * Math.sin(30 * RAD)]
  S.P.V = [r * Math.cos(150 * RAD), r * Math.sin(150 * RAD)]
  S.names = {}
  S.extra = {
    segs: [["XL", "X"], ["O", "U"], ...(both ? [["O", "V"] as [string, string]] : [])],
    dash: both ? [["V", "U"]] : [["O", "V"]],
    arcs: [{ at: "O", a: "X", b: "U", tex: "30^\\circ", col: YELLOW }, ...(both ? [{ at: "O", a: "X", b: "V", tex: "150^\\circ", col: BLUE }] : [])],
  }
  S.frameFn = () => ({ x0: -r * 1.35, x1: r * 1.35, y0: -0.8, y1: r * 0.75 })
}

/** Angle A is 35°, AC is 8, and CB (5.5) swings from C to meet the line through A. */
const SW = (() => {
  const A: Vec = [0, 0], C: Vec = [8 * Math.cos(35 * RAD), 8 * Math.sin(35 * RAD)]
  const dx = Math.sqrt(5.5 * 5.5 - C[1] * C[1])
  return { A, C, near: [C[0] - dx, 0] as Vec, far: [C[0] + dx, 0] as Vec, len: 5.5 }
})()
const angAtB = (B: Vec) => {
  const u = [SW.A[0] - B[0], SW.A[1] - B[1]], v = [SW.C[0] - B[0], SW.C[1] - B[1]]
  return Math.acos((u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]))) * DEG
}
const B_FAR = angAtB(SW.far), B_NEAR = angAtB(SW.near)

/** The swing board: the line from A, AC drawn, CB still to swing. B is where it has landed (or off the board). */
function swingBoard(S: Scene, landed: ("far" | "near")[]) {
  base(S, { P: { A: SW.A, B: landed.length ? (landed[landed.length - 1] === "far" ? SW.far : SW.near) : [SW.far[0] + 30, 0], C: SW.C } })
  allColoured(S)
  S.names = { A: "A", C: "C", ...(landed.length ? { B: "B" } : {}) }
  S.P.X = [SW.far[0] + 2.2, 0]
  S.P.N = SW.near
  S.P.F = SW.far
  // until CB lands there is no triangle yet: the 35° is drawn on the line and AC
  S.extra = { segs: [["A", "X"], ...(landed.length ? [] : [["A", "C"] as [string, string]])], labels: [{ a: "A", b: "C", tex: "8", col: BLUE }], arcs: landed.length ? [] : [{ at: "A", a: "X", b: "C", tex: "35^\\circ", col: YELLOW }] }
  if (landed.length) S.angText.A = () => "35^\\circ"
  S.frameFn = () => ({ x0: -1.2, x1: SW.far[0] + 2.4, y0: -1.2, y1: SW.C[1] + 1.6 })
}

// ── part 8: exam questions (from the past papers) ────────────────────────

/** 4024/21/M/J/23 Q7(b)(i): quadrilateral PQRS; SQ = 15 cm, angle SPQ = 67°, angle PQS = 74°. Calculate PS. */
const EX1: QSpec = (() => {
  const Q = q("ex1", { A: 67, B: 180 - 67 - 74, side: ["A", 15] }, "C", "side", "A", {
    knownSides: ["A"], knownAngles: ["A", "C"], unit: "cm", name: "PS",
    names: { A: "P", B: "S", C: "Q", R: "R" },
  })
  Q.pts = { R: [Q.P.B[0] + 1.6, Q.P.C[1] * 0.86] }
  Q.extra = { segs: [["C", "R"], ["R", "B"]] }
  return Q
})()

/** 4024/22/O/N/20 Q9(a)(i): triangle ABC; AC = 6.4 cm, BC = 9.5 cm, angle BAC = 79°. Calculate angle ABC. */
const EX2: QSpec = (() => {
  const A = 79, a = 9.5, b = 6.4
  const B = Math.asin((b * Math.sin(A * RAD)) / a) * DEG
  const Q = q("ex2", { A, B, side: ["A", a] }, "B", "angle", "A", { knownSides: ["A", "B"], knownAngles: ["A"], unit: "cm" })
  // drawn as the paper does: A at the top, B on the left, C on the right
  const c0 = Q.side.C
  Q.P = { B: [0, 0], C: [a * Math.cos(-6 * RAD), a * Math.sin(-6 * RAD)], A: [c0 * Math.cos((B - 6) * RAD), c0 * Math.sin((B - 6) * RAD)] }
  return Q
})()

/** 4024/21/O/N/25 Q20(b): triangular field ABC; AB = 65 m, AC = 75 m, angle CAB = 125°, BC = 124.3 m from (a). Calculate angle ABC. */
const EX3: QSpec = (() => {
  const A = 125, b = 75, c0 = 65
  const a = Math.sqrt(b * b + c0 * c0 - 2 * b * c0 * Math.cos(A * RAD))
  const B = Math.asin((b * Math.sin(A * RAD)) / a) * DEG
  const Q = q("ex3", { A, B, side: ["A", a] }, "B", "angle", "A", { knownSides: ["A", "B", "C"], knownAngles: ["A"], unit: "m", given: { "side-A": 124.3 } })
  Q.P = { A: [0, 0], C: [b * Math.cos(-10 * RAD), b * Math.sin(-10 * RAD)], B: [c0 * Math.cos(-135 * RAD), c0 * Math.sin(-135 * RAD)] }
  return Q
})()

/** 4024/22/M/J/15 Q5(b): AB = 8, AC = 11, DC = 6.5 cm, angle BAD = 26°, angle DAC = 30°. Calculate the obtuse angle ADC. */
const EX4: QSpec = (() => {
  // the shaded triangle ADC: our A is the paper's A, our B the paper's C, our C the paper's D
  const A = 30, a = 6.5, c0 = 11
  const acute = Math.asin((c0 * Math.sin(A * RAD)) / a) * DEG
  const D = 180 - acute
  const Q = q("ex4", { A, B: 180 - A - D, side: ["A", a] }, "C", "angle", "A", { knownSides: ["A", "C"], knownAngles: ["A"], unit: "cm", names: { A: "A", B: "C", C: "D", Bp: "B" } })
  const tilt = -4
  const AD = Q.side.B
  Q.P = { A: [0, 0], B: [c0 * Math.cos(tilt * RAD), c0 * Math.sin(tilt * RAD)], C: [AD * Math.cos((tilt + 30) * RAD), AD * Math.sin((tilt + 30) * RAD)] }
  Q.pts = { Bp: [8 * Math.cos((tilt + 56) * RAD), 8 * Math.sin((tilt + 56) * RAD)] }
  Q.extra = { segs: [["A", "Bp"], ["Bp", "B"]], fills: [{ pts: ["A", "B", "C"], col: CHALK, op: 0.1 }], labels: [{ a: "A", b: "Bp", tex: "8" }], arcs: [{ at: "A", a: "C", b: "Bp", tex: "26^\\circ" }] }
  return Q
})()

/**
 * 4024/22/M/J/17 Q6(b): triangle PQR, right angle at P, angle PRQ = 38°,
 * RQ = 12 cm. S is such that angle PRS = 90° and QS = 10 cm. The two
 * possible values of angle QSR. Our triangle is QRS: A is R (52°), B is S,
 * C is Q; QR = 12 is across from S, QS = 10 across from R.
 */
const EX5 = (() => {
  const PR = 12 * Math.cos(38 * RAD), PQ = 12 * Math.sin(38 * RAD)
  const R: Vec = [0, 0], P: Vec = [0, PR], Qp: Vec = [PQ, PR]
  const dx = Math.sqrt(100 - PR * PR)
  const far: Vec = [PQ + dx, 0], near: Vec = [PQ - dx, 0]
  const acute = Math.asin((12 * Math.sin(52 * RAD)) / 10) * DEG
  const base0 = q("ex5", { A: 52, B: acute, side: ["A", 10] }, "B", "angle", "A", { knownSides: ["A", "B"], knownAngles: ["A"], unit: "cm", names: { A: "R", B: "S", C: "Q", Pp: "P" } })
  base0.P = { A: R, B: far, C: Qp }
  base0.pts = { Pp: P, X: [far[0] + 2, 0] }
  base0.extra = { segs: [["Pp", "C"], ["Pp", "A"], ["A", "X"]], rts: [{ at: "Pp", a: "A", b: "C" }, { at: "A", a: "Pp", b: "X" }], arcs: [{ at: "A", a: "Pp", b: "C", tex: "38^\\circ" }] }
  return { Q: base0, R, P, Qp, far, near, acute }
})()

/** The paper's figure, then S's line from R. Until triangle QRS is drawn, RQ is drawn as the paper does. */
const ex5Board = (S: Scene, o: { s?: "far" | "near" | null; lineR?: boolean } = {}) => {
  const Q = EX5.Q
  base(S, { P: { A: EX5.R, B: o.s === "near" ? EX5.near : EX5.far, C: EX5.Qp } })
  allColoured(S)
  S.names = { A: "R", C: "Q", Pp: "P", ...(o.s ? { B: "S" } : {}) }
  S.P.Pp = EX5.P
  S.P.X = [EX5.far[0] + 2, 0]
  S.extra = {
    segs: [["Pp", "C"], ["Pp", "A"], ...(o.s ? [] : [["A", "C"] as [string, string]]), ...(o.lineR ? [["A", "X"] as [string, string]] : [])],
    rts: [{ at: "Pp", a: "A", b: "C" }, ...(o.lineR ? [{ at: "A", a: "Pp", b: "X" }] : [])],
    arcs: [{ at: "A", a: "Pp", b: "C", tex: "38^\\circ" }],
    labels: o.s ? [] : [{ a: "A", b: "C", tex: "12\\text{ cm}", inside: true }],
  }
  S.frameFn = () => ({ x0: -1.6, x1: EX5.far[0] + 2.8, y0: -1.4, y1: EX5.P[1] + 1.4 })
  void Q
}

const PART_B: Beat[] = [
  // ── 4. Why it works ──
  {
    id: "drop-h",
    say: "Pull a line straight down from $C$.",
    enter: S => {
      proofBoard(S)
      S.mode = "drop"
      S.tick = S2 => { if (S2.height && S2.height.drop === 1 && !S2.got.has("rtPulse")) S2.got.add("rtPulse") }
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters"])
    },
    done: S => !!S.height && S.height.drop === 1,
    advanceAfter: 1600,
  },
  watch("two-tris", "Now there are two right-angled triangles.", S => {
    proofBoard(S, { dropped: true, glow: "left" })
    S.tick = S2 => { if (S2.height) S2.height.glow = Math.floor((S2.time - S2.beatStart) / 1.3) % 2 ? "right" : "left" }
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra"])
  }, 2.8),
  watch("left-tri", "In this one, $h$ is opposite $A$, and $b$ is the hypotenuse.", S => {
    proofBoard(S, { dropped: true, glow: "left" })
    S.pulseAng = new Set(["A"])
    S.pulseSide = new Set(["B"])
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra"])
  }, 2.8),
  watch("sinA", "So $\\sin A = \\frac{h}{b}$.", S => {
    proofBoard(S, { dropped: true, glow: "left" })
    S.alg = sinEqn(S, "A")
    const from: Record<string, Vec> = {}
    S.eqFn = S2 => eqnNode(S2.alg!, { from, fly: 1.2 })
    from["ang-A"] = labAt(S, "L-A") ?? [S.w / 2, S.h / 2]
    later(S, 0.05, S2 => { from.h = labAt(S2, "X-CH") ?? [S2.w / 2, S2.h / 2]; from["s-B"] = labAt(S2, "side-B") ?? [S2.w / 2, S2.h / 2] })
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq"])
  }, 2.8),
  {
    id: "div-h",
    say: "What is dividing $h$? Tap it.",
    enter: S => {
      proofBoard(S, { dropped: true, glow: "left" })
      S.alg = sinEqn(S, "A")
      S.eqFn = S2 => eqnNode(S2.alg!, { pulse: S2.got.has("tap") ? new Set(["s-B"]) : undefined })
      S.mode = "tapEq"
      S.tapAtoms = ["s-B", "h", "fn-A", "ang-A", "eq"]
      S.onAtom = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === "s-B") { S2.got.add("tap"); S2.touched = { kind: "eq" }; S2.flashGood = 1; say(S2, "$h$ is divided by $b$.", "calm", 600); return }
        say(S2, a === "h" ? "That's $h$ itself. Tap what it is divided by." : "That's on the other side. Look under $h$.", "wrong", 3.2)
      }
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1600,
  },
  {
    id: "mul-b",
    say: "Multiply both sides by $b$.",
    enter: S => {
      proofBoard(S, { dropped: true, glow: "left" })
      S.alg = sinEqn(S, "A")
      startMoves(S, hMove(S, "A"))
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1500,
  },
  watch("right-tri", "In the other one, $h$ is opposite $B$, and $a$ is the hypotenuse.", S => {
    proofBoard(S, { dropped: true, glow: "right" })
    S.pulseAng = new Set(["B"])
    S.pulseSide = new Set(["A"])
    S.alg = sinEqn(S, "B")
    S.eqFn = S2 => eqnNode(S2.alg!, {})
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq"])
  }, 2.8),
  {
    id: "mul-a",
    say: "Get $h$ on its own.",
    enter: S => {
      proofBoard(S, { dropped: true, glow: "right" })
      S.alg = sinEqn(S, "B")
      startMoves(S, hMove(S, "B"))
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1500,
  },
  watch("both-h", "Both are $h$, so they are equal.", S => {
    proofBoard(S, { dropped: true })
    let merged = false
    // the two lines use the same pieces as the one they become, so b sin A and a sin B glide together
    const line = (h: string, eqId: string, sId: string, sTex: string, sCol: string, k: Corner) =>
      row([atom(h, "h"), op(eqId, "="), atom(sId, sTex, { col: sCol }), atom(`fn-${k}`, "\\sin"), atom(`ang-${k}`, k, { col: PAIR_COL[k] })])
    S.eqFn = S2 => (merged ? eqnNode(bothEqn(S2), {}) : row([line("h1", "eq1", "s-B", "b", BLUE, "A"), atom("gap", "\\qquad"), line("h2", "eq2", "s-A", "a", YELLOW, "B")]))
    later(S, 1.2, S2 => { eqSlow(S2.eq, 1.4); merged = true })
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq"])
  }, 3.4),
  {
    id: "div-sinA",
    say: "Divide both sides by $\\sin A$.",
    enter: S => {
      proofBoard(S, { dropped: true })
      S.alg = bothEqn(S)
      const F = L.sin(S, "A")
      startMoves(S, [{ kind: "div", fac: F, wrong: { kind: "mul", fac: F, say: "Now $b$ is multiplied by $\\sin A$ twice. That made it worse." }, cancelNote: "Tap the two $\\sin A$s to cancel them." }])
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1500,
  },
  {
    id: "div-sinB",
    say: "Now divide both sides by $\\sin B$.",
    enter: S => {
      proofBoard(S, { dropped: true })
      S.alg = { L: { num: [L.b(S)], den: [] }, R: { num: [L.a(S), L.sin(S, "B")], den: [{ ...L.sin(S, "A"), id: "m1R.F-A", parts: [{ id: "m1R.fn-A", tex: "\\sin" }, { id: "m1R.ang-A", tex: "A", col: YELLOW }] }] } }
      const F = L.sin(S, "B")
      startMoves(S, [{ kind: "div", fac: F, wrong: { kind: "mul", fac: F, say: "Now there are two $\\sin B$s on top. That made it worse." }, cancelNote: "Tap the two $\\sin B$s to cancel them." }])
      look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: movesDone,
    advanceAfter: 1500,
  },
  watch("proof-done", "That's the sine rule.", S => {
    proofBoard(S, { dropped: true })
    S.eqFn = () => ruleLetters(["B", "A"])
    look(S, ["tri", "fill", "arcs", "sideLabs", "letters", "extra", "eq"])
  }, 2.2),

  // ── 5. Finding a side ──
  watch("x", "We want this side. Let's call it $x$.", S => {
    qBoard(S, Q1)
    S.pulseSide = new Set(["B"])
    look(S, QLOOK)
  }, 2.2),
  tapUnknownPair("x-angle", "Tap the angle across from $x$.", Q1),
  tapFullPair("x-pair", "Now find a full pair: a side and the angle across from it, both known.", Q1),
  watch("two-pairs", "The rule needs just these two pairs.", S => {
    qBoard(S, Q1)
    S.glowAng = new Set(["A", "B"])
    S.glowSide = new Set(["A", "B"])
    let faded = false
    S.eqFn = () => (faded ? ruleLetters(["B", "A", "C"], ["C"]) : ruleLetters(["B", "A", "C"]))
    later(S, 1.0, () => { faded = true })
    later(S, 2.4, S2 => { eqSlow(S2.eq, 1.0); S2.eqFn = () => ruleLetters(["B", "A"]) })
    look(S, [...QLOOK, "eq"])
  }, 3.4),
  fillBeat("fill-x", "Drag $x$ and its angle into the left fraction.", Q1, "left"),
  fillBeat("fill-pair", "Now drag the full pair into the right fraction.", Q1, "right"),
  tapDividing("x-dividing", "What is dividing $x$? Tap it.", Q1),
  moveBeat("x-mul", "Multiply both sides by $\\sin 75^\\circ$.", Q1),
  sideCalc("x-calc", "Type the right side into the calculator.", Q1),
  watch("x-zero", "Write $12.0$. The $0$ counts.", S => {
    qBoard(S, Q1)
    S.sideText.B = () => "12.0"
    S.alg = { L: { num: [sideFac(Q1, "B")], den: [] }, R: numbersFirst({ num: [sinFac(Q1, "B", "m1R"), sideFac(Q1, "A")], den: [sinFac(Q1, "A")] }) }
    S.eqFn = S2 => eqnNode(S2.alg!, { tail: [op("eq3", "="), atom("ans", "12.0", { col: GREEN })] })
    look(S, [...QLOOK, "eq"])
  }, 2.2),

  watch("b-missing", "Now we want $b$, but its angle isn't given.", S => {
    qBoard(S, Q2)
    S.angText.B = () => c(RED, "?")
    S.pulseAng = new Set(["B"])
    look(S, QLOOK)
  }, 2.4),
  {
    id: "find-B",
    say: "Find angle $B$ first.",
    enter: S => {
      qBoard(S, Q2)
      S.angText.B = () => c(RED, "?")
      askNumber(S, 70, {
        lead: [atom("ab", "B"), op("eq", "="), atom("t180", "180^\\circ"), op("m1", "-"), atom("t50", "50^\\circ", { col: YELLOW }), op("m2", "-"), atom("t60", "60^\\circ", { col: RED }), op("eq2", "=")],
        unit: "^\\circ",
        slips: [{ v: 110, say: "That's $50^\\circ + 60^\\circ$. Take it away from $180^\\circ$." }, { v: 290, say: "The three angles add up to $180^\\circ$." }],
        onRight: S2 => { S2.angText.B = () => "70^\\circ"; S2.touched = { kind: "angle", c: "B" }; S2.flashGood = 1 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1600,
    walk: [
      { say: "The angles of a triangle add up to $180^\\circ$.", tex: "50^\\circ + 60^\\circ + B = 180^\\circ" },
      { say: "So $B = 180^\\circ - 50^\\circ - 60^\\circ = 70^\\circ$.", tex: `B = ${c(GREEN, "70^\\circ")}` },
    ],
  },
  tapFullPair("b-pair", "Find a full pair.", Q2, ["B"]),
  fillBeat("b-fill-x", "Drag $x$'s pair into the left fraction.", Q2, "left", ["B"]),
  fillBeat("b-fill-pair", "Now the full pair into the right.", Q2, "right", ["B"]),
  moveBeat("b-mul", "Get $x$ on its own.", Q2, ["B"]),
  sideCalc("b-calc", "Work it out.", Q2, ["B"]),

  // ── 6. Finding an angle ──
  watch("theta", "Now an angle is missing. Let's call it $\\theta$.", S => {
    qBoard(S, Q3)
    S.pulseAng = new Set(["B"])
    look(S, QLOOK)
  }, 2.2),
  tapUnknownPair("t-side", "Tap the side across from $\\theta$.", Q3),
  tapFullPair("t-pair", "Find a full pair.", Q3),
  fillBeat("t-fill", "Drag $\\theta$'s pair into the left fraction.", Q3, "left"),
  fillBeat("t-fill-pair", "Now the full pair into the right.", Q3, "right"),
  watch("flip-why", "When the angle is missing, we turn both fractions over.", S => {
    qBoard(S, Q3)
    filledOn(S, Q3)
    look(S, [...QLOOK, "eq"])
  }, 2.4),
  watch("flip-demo", "Here's why we can. $\\frac{6}{3} = \\frac{4}{2}$, because both are $2$.", S => {
    base(S)
    S.alg = { L: { num: [{ id: "d6", tex: "6", key: "d6", v: 6 }], den: [{ id: "d3", tex: "3", key: "d3", v: 3 }] }, R: { num: [{ id: "d4", tex: "4", key: "d4", v: 4 }], den: [{ id: "d2", tex: "2", key: "d2", v: 2 }] } }
    S.eqFn = S2 => eqnNode(S2.alg!, {})
    show(S, ["eq"])
  }, 2.6),
  watch("flip-demo2", "Turned over, $\\frac{3}{6} = \\frac{2}{4}$. Both are $0.5$.", S => {
    base(S)
    S.alg = { L: { num: [{ id: "d6", tex: "6", key: "d6", v: 6 }], den: [{ id: "d3", tex: "3", key: "d3", v: 3 }] }, R: { num: [{ id: "d4", tex: "4", key: "d4", v: 4 }], den: [{ id: "d2", tex: "2", key: "d2", v: 2 }] } }
    S.eqFn = S2 => eqnNode(S2.alg!, {})
    later(S, 0.7, S2 => { eqSlow(S2.eq, 1.5); S2.alg = flipBoth(S2.alg!) })
    show(S, ["eq"])
  }, 3.0),
  watch("flip-keeps", "Turning both sides over keeps them equal.", S => {
    base(S)
    S.alg = { L: { num: [{ id: "d3", tex: "3", key: "d3", v: 3 }], den: [{ id: "d6", tex: "6", key: "d6", v: 6 }] }, R: { num: [{ id: "d2", tex: "2", key: "d2", v: 2 }], den: [{ id: "d4", tex: "4", key: "d4", v: 4 }] } }
    S.eqFn = S2 => eqnNode(S2.alg!, {})
    show(S, ["eq"])
  }, 2.0),
  flipBeat("t-flip", "Now turn the rule over. Tap the $=$.", Q3),
  tapDividing("t-dividing", "What is dividing $\\sin\\theta$? Tap it.", Q3),
  moveBeat("t-mul", "Multiply both sides by $6$.", Q3),
  sinCalc("t-sin", "Work out the right side.", Q3),
  undoBeat("t-undo", "Now undo the $\\sin$.", Q3),
  angleCalc("t-calc", "Press SHIFT, $\\sin$, then Ans.", Q3),

  tapUnknownPair("u-side", "One more. Tap the side across from $\\theta$.", Q4),
  tapFullPair("u-pair", "Find a full pair.", Q4),
  fillBeat("u-fill", "Fill the rule: $\\theta$'s pair on the left.", Q4, "both"),
  flipBeat("u-flip", "Turn the rule over.", Q4),
  moveBeat("u-mul", "Get $\\sin\\theta$ on its own.", Q4),
  sinCalc("u-sin", "Work out the right side.", Q4),
  undoBeat("u-undo", "Undo the $\\sin$.", Q4),
  angleCalc("u-calc", "Work it out.", Q4),

  // ── 7. When the angle could be obtuse ──
  {
    id: "sin30",
    say: "Type $\\sin 30$.",
    enter: S => {
      base(S)
      askTyped(S, 0.5, "0.5", { typed: "s30", calcOnly: "Type it on the calculator: $\\sin$, then $30$." })
      show(S, ["eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1400,
  },
  {
    id: "sin150",
    say: "Now type $\\sin 150$.",
    enter: S => {
      base(S)
      askTyped(S, 0.5, "0.5", { typed: "s150", calcOnly: "Type it on the calculator: $\\sin$, then $150$.", onRight: S2 => say(S2, "The same as $\\sin 30$.", "calm", 600) })
      show(S, ["eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
  },
  watch("two-angles", "Two different angles have the same $\\sin$.", S => {
    twoAngles(S, true)
    look(S, ["extra"])
  }, 2.6),
  watch("inv-only", "$\\sin^{-1} 0.5$ only gives $30^\\circ$.", S => {
    twoAngles(S, false)
    S.eqFn = () => row([atom("i", "\\sin^{-1}"), atom("v", "0.5"), op("eq", "="), atom("a", "30^\\circ", { col: GREEN })])
    look(S, ["extra", "eq"])
  }, 2.2),
  watch("other", "The other angle is $180^\\circ - 30^\\circ = 150^\\circ$.", S => {
    twoAngles(S, true)
    S.eqFn = () => row([atom("t", "180^\\circ"), op("m", "-"), atom("a", "30^\\circ", { col: GREEN }), op("eq", "="), atom("o", "150^\\circ", { col: BLUE })])
    look(S, ["extra", "eq"])
  }, 2.2),
  watch("matters", "Here's when it matters. Angle $A$ is $35^\\circ$, $AC$ is $8$ and $CB$ is $5.5$.", S => {
    swingBoard(S, [])
    look(S, ["extra", "letters", "angLabs"])
    S.vis.tri.t = 0
  }, 2.8),
  {
    id: "swing-1",
    say: "Swing side $CB$ down to the line.",
    enter: S => {
      swingBoard(S, [])
      S.swing = { pivot: "C", len: SW.len, ang: -15, lands: [SW.far, SW.near], landed: [], want: [0, 1] }
      S.mode = "swing"
      S.lockOnSnap = true
      S.releaseNote = () => "Swing it down until it meets the line."
      look(S, ["extra", "letters", "angLabs"])
      S.vis.tri.t = 0
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  {
    id: "swing-2",
    say: "Can it land anywhere else? Swing it further.",
    enter: S => {
      // still swinging: AC and the 35° stay as they were, and the first landing is left dashed
      swingBoard(S, [])
      S.extra!.dash = [["C", "F"]]
      S.swing = { pivot: "C", len: SW.len, ang: Math.atan2(SW.far[1] - SW.C[1], SW.far[0] - SW.C[0]) * DEG, lands: [SW.far, SW.near], landed: [0], want: [1] }
      S.mode = "swing"
      S.lockOnSnap = true
      S.releaseNote = () => "Keep swinging it round. It meets the line again."
      look(S, ["extra", "letters", "angLabs"])
      S.vis.tri.t = 0
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("two-fit", "Two different triangles fit.", S => {
    swingBoard(S, ["far", "near"])
    S.ghost = ["A", "F", "C"]
    look(S, ["tri", "fill", "arcs", "extra", "letters", "angLabs"])
  }, 2.2),
  watch("acute-obtuse", "One angle at $B$ is acute, and one is obtuse.", S => {
    swingBoard(S, ["far", "near"])
    S.ghost = ["A", "F", "C"]
    S.angText.B = () => degTex(Math.round(B_NEAR * 10) / 10)
    S.extra!.arcs = [{ at: "F", a: "A", b: "C", tex: degTex(Math.round(B_FAR * 10) / 10), col: BLUE }]
    look(S, ["tri", "fill", "arcs", "extra", "letters", "angLabs"])
  }, 2.6),
  watch("add-180", "They add up to $180^\\circ$.", S => {
    swingBoard(S, ["far", "near"])
    S.ghost = ["A", "F", "C"]
    S.angText.B = () => degTex(Math.round(B_NEAR * 10) / 10)
    S.extra!.arcs = [{ at: "F", a: "A", b: "C", tex: degTex(Math.round(B_FAR * 10) / 10), col: BLUE }]
    S.eqFn = () => row([atom("a", degTex(Math.round(B_FAR * 10) / 10), { col: BLUE }), op("p", "+"), atom("b", degTex(Math.round(B_NEAR * 10) / 10), { col: BLUE }), op("eq", "="), atom("t", "180^\\circ", { col: GREEN })])
    look(S, ["tri", "fill", "arcs", "extra", "letters", "angLabs", "eq"])
  }, 2.4),
  watch("which", "A question will tell you which one it wants.", S => {
    swingBoard(S, ["far", "near"])
    S.ghost = ["A", "F", "C"]
    look(S, ["tri", "fill", "arcs", "extra", "letters", "angLabs"])
  }, 2.2),

  // ── 8. Exam questions ──
  watch("ex1", "$PQRS$ is a quadrilateral. $SQ = 15$ cm, angle $SPQ = 67^\\circ$ and angle $PQS = 74^\\circ$.", S => {
    qBoard(S, EX1)
    S.sideText.C = () => ""
    look(S, QLOOK)
  }, 3.0),
  tapUnknownPair("ex1-angle", "We want $PS$. Tap the angle across from it.", EX1),
  tapFullPair("ex1-pair", "Find a full pair.", EX1),
  fillBeat("ex1-fill", "Fill the rule: $PS$'s pair on the left.", EX1, "both"),
  moveBeat("ex1-mul", "Get $PS$ on its own.", EX1),
  sideCalc("ex1-calc", "Work it out.", EX1),

  watch("ex2", "In triangle $ABC$, $AC = 6.4$ cm, $BC = 9.5$ cm and angle $BAC = 79^\\circ$.", S => {
    qBoard(S, EX2)
    S.angText.B = () => ""
    look(S, QLOOK)
  }, 3.0),
  tapUnknownPair("ex2-side", "We want angle $ABC$. Tap the side across from it.", EX2),
  tapFullPair("ex2-pair", "Find a full pair.", EX2),
  fillBeat("ex2-fill", "Fill the rule.", EX2, "both"),
  flipBeat("ex2-flip", "Turn the rule over.", EX2),
  moveBeat("ex2-mul", "Get $\\sin\\theta$ on its own.", EX2),
  sinCalc("ex2-sin", "Work out the right side.", EX2),
  undoBeat("ex2-undo", "Undo the $\\sin$.", EX2),
  angleCalc("ex2-calc", "Work it out.", EX2),

  watch("ex3", "A field $ABC$. $AB = 65$ m, $AC = 75$ m, angle $CAB = 125^\\circ$, and $BC = 124.3$ m from part (a).", S => {
    qBoard(S, EX3)
    S.angText.B = () => ""
    look(S, QLOOK)
  }, 3.2),
  tapUnknownPair("ex3-side", "We want angle $ABC$. Tap the side across from it.", EX3),
  tapFullPair("ex3-pair", "Find a full pair.", EX3),
  fillBeat("ex3-fill", "Fill the rule.", EX3, "both"),
  flipBeat("ex3-flip", "Turn the rule over.", EX3),
  moveBeat("ex3-mul", "Get $\\sin\\theta$ on its own.", EX3),
  sinCalc("ex3-sin", "Work out the right side.", EX3),
  undoBeat("ex3-undo", "Undo the $\\sin$.", EX3),
  angleCalc("ex3-calc", "Work it out.", EX3),

  watch("ex4", "$AB = 8$ cm, $AC = 11$ cm, $DC = 6.5$ cm, angle $BAD = 26^\\circ$ and angle $DAC = 30^\\circ$.", S => {
    qBoard(S, EX4)
    S.angText.C = () => ""
    look(S, QLOOK)
  }, 3.2),
  watch("ex4-want", "We want the obtuse angle $ADC$, in the shaded triangle.", S => {
    qBoard(S, EX4)
    S.pulseAng = new Set(["C"])
    look(S, QLOOK)
  }, 2.4),
  tapUnknownPair("ex4-side", "Tap the side across from it.", EX4),
  tapFullPair("ex4-pair", "Find a full pair.", EX4),
  fillBeat("ex4-fill", "Fill the rule.", EX4, "both"),
  flipBeat("ex4-flip", "Turn the rule over.", EX4),
  moveBeat("ex4-mul", "Get $\\sin\\theta$ on its own.", EX4),
  sinCalc("ex4-sin", "Work out the right side.", EX4),
  undoBeat("ex4-undo", "Undo the $\\sin$.", EX4),
  angleCalc("ex4-calc", "Work it out.", EX4),
  watch("ex4-acute", `$${answerText(EX4)}^\\circ$ is acute. The question wants the obtuse one.`, S => {
    qBoard(S, EX4)
    S.angText.C = () => c(RED, `${answerText(EX4)}^\\circ`)
    look(S, QLOOK)
  }, 2.4),
  {
    id: "ex4-obtuse",
    say: `Work out $180^\\circ - ${answerText(EX4)}^\\circ$.`,
    enter: S => {
      qBoard(S, EX4)
      const ac = Number(answerText(EX4))
      askNumber(S, 180 - answerOf(EX4), {
        dp: 1, unit: "^\\circ",
        lead: [atom("t", "180^\\circ"), op("m", "-"), atom("a", `${answerText(EX4)}^\\circ`), op("eq", "=")],
        slips: [{ v: ac, say: "That's the acute one. Take it away from $180^\\circ$." }],
        onRight: S2 => { S2.angText.C = () => `${(180 - answerOf(EX4)).toFixed(1)}^\\circ`; S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1.2 },
      })
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: [
      { say: "The obtuse angle and the acute one add up to $180^\\circ$.", tex: `180^\\circ - ${answerText(EX4)}^\\circ` },
      { say: `So it is $${(180 - answerOf(EX4)).toFixed(1)}^\\circ$.`, tex: `= \\textcolor{${GREEN}}{${(180 - answerOf(EX4)).toFixed(1)}^\\circ}` },
    ],
  },

  watch("ex5", "Triangle $PQR$ has a right angle at $P$, angle $PRQ = 38^\\circ$ and $RQ = 12$ cm.", S => {
    ex5Board(S)
    look(S, ["extra", "letters"])
    S.vis.tri.t = 0
  }, 2.8),
  watch("ex5-line", "$S$ is a point where angle $PRS$ is a right angle.", S => {
    ex5Board(S, { lineR: true })
    look(S, ["extra", "letters"])
    S.vis.tri.t = 0
  }, 2.6),
  {
    id: "ex5-52",
    say: "So angle $QRS$ is $90^\\circ - 38^\\circ$. Work it out.",
    enter: S => {
      ex5Board(S, { lineR: true })
      askNumber(S, 52, { unit: "^\\circ", lead: [atom("t", "90^\\circ"), op("m", "-"), atom("a", "38^\\circ"), op("eq", "=")], slips: [{ v: 128, say: "Take $38^\\circ$ away from $90^\\circ$." }] })
      look(S, ["extra", "letters", "eq", "keypad"])
      S.vis.tri.t = 0
    },
    done: inputRight,
    advanceAfter: 1600,
    walk: [{ say: "Angle $PRS$ is $90^\\circ$, and $38^\\circ$ of it is angle $PRQ$.", tex: "90^\\circ - 38^\\circ" }, { say: "That leaves $52^\\circ$.", tex: `= ${c(GREEN, "52^\\circ")}` }],
  },
  {
    id: "ex5-swing",
    say: "$QS$ is $10$ cm. Swing it down to the line.",
    enter: S => {
      ex5Board(S, { lineR: true })
      // starts pointing down to the right, its end still on a phone screen
      S.swing = { pivot: "C", len: 10, ang: -58, lands: [EX5.far, EX5.near], landed: [], want: [0, 1] }
      S.mode = "swing"
      S.lockOnSnap = true
      S.releaseNote = () => "Swing it down until it meets the line."
      look(S, ["extra", "letters"])
      S.vis.tri.t = 0
    },
    done: S => S.locked,
    advanceAfter: 1400,
  },
  {
    id: "ex5-swing-2",
    say: "It can land in one more place. Swing it further.",
    enter: S => {
      // still swinging: the first landing is left dashed
      ex5Board(S, { lineR: true })
      S.P.F = EX5.far
      S.extra!.dash = [["C", "F"]]
      S.swing = { pivot: "C", len: 10, ang: Math.atan2(EX5.far[1] - EX5.Qp[1], EX5.far[0] - EX5.Qp[0]) * DEG, lands: [EX5.far, EX5.near], landed: [0], want: [1] }
      S.mode = "swing"
      S.lockOnSnap = true
      S.releaseNote = () => "Keep swinging. It meets the line again."
      look(S, ["extra", "letters"])
      S.vis.tri.t = 0
    },
    done: S => S.locked,
    advanceAfter: 1400,
  },
  watch("ex5-two", "So there are two possible triangles $QRS$.", S => {
    ex5Board(S, { lineR: true, s: "far" })
    S.P.F = EX5.near
    S.ghost = ["A", "F", "C"]
    S.sideText.B = () => "12"
    S.sideText.A = () => "10"
    S.angText.A = () => "52^\\circ"
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "extra", "letters"])
  }, 2.4),
  {
    id: "ex5-fill",
    say: "Fill the rule for angle $QSR$.",
    enter: S => {
      ex5Board(S, { lineR: true, s: "far" })
      S.sideText.B = () => "12"
      S.sideText.A = () => "10"
      S.angText.A = () => "52^\\circ"
      S.angText.B = () => "\\theta"
      startFill(S, EX5.Q, "both", { "side-B": "12", "side-A": "10", "ang-A": "52^\\circ", "ang-B": "\\theta" })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "extra", "letters", "eq"])
    },
    done: S => filledHalf(S, "both"),
    advanceAfter: 1300,
  },
  flipBeat("ex5-flip", "Turn the rule over.", { ...EX5.Q }),
  moveBeat("ex5-mul", "Get $\\sin\\theta$ on its own.", { ...EX5.Q }),
  sinCalc("ex5-sin", "Work out the right side.", { ...EX5.Q }),
  undoBeat("ex5-undo", "Undo the $\\sin$.", { ...EX5.Q }),
  angleCalc("ex5-calc", "Work it out. That's the acute one.", { ...EX5.Q }),
  {
    id: "ex5-other",
    say: "Now the other one: $180^\\circ$ minus it.",
    enter: S => {
      ex5Board(S, { lineR: true, s: "near" })
      S.P.F = EX5.far
      S.ghost = ["A", "F", "C"]
      S.sideText.B = () => "12"
      S.sideText.A = () => "10"
      S.angText.A = () => "52^\\circ"
      S.angText.B = () => c(RED, "?")
      const ac = Number(answerText(EX5.Q))
      askNumber(S, 180 - ac, {
        dp: 1, unit: "^\\circ",
        lead: [atom("t", "180^\\circ"), op("m", "-"), atom("a", `${ac.toFixed(1)}^\\circ`), op("eq", "=")],
        slips: [{ v: ac, say: "That's the first one. Take it away from $180^\\circ$." }],
        onRight: S2 => { S2.angText.B = () => `${(180 - ac).toFixed(1)}^\\circ`; S2.touched = { kind: "angle", c: "B" }; S2.flashGood = 1.2 },
      })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "extra", "letters", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2400,
    walk: [
      { say: "The two angles at $S$ add up to $180^\\circ$.", tex: `180^\\circ - ${answerText(EX5.Q)}^\\circ` },
      { say: `So the other is $${(180 - Number(answerText(EX5.Q))).toFixed(1)}^\\circ$.`, tex: `= ${c(GREEN, `${(180 - Number(answerText(EX5.Q))).toFixed(1)}^\\circ`)}` },
    ],
  },

  // ── 9. Play ──
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      base(S, { free: true, P: START })
      allColoured(S)
      liveAngles(S)
      liveSides(S)
      S.eqFn = S2 => ratiosLive(S2)
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

export const BEATS: Beat[] = [...PART_A, ...PART_B]

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["open", "Angles and the sides across from them"],
  ["pair", "Pairs and their names"],
  ["turn-30", "How much longer?"],
  ["drop-h", "Why it works"],
  ["x", "Finding a side"],
  ["theta", "Finding an angle"],
  ["sin30", "When the angle could be obtuse"],
  ["ex1", "Exam questions"],
]
applyParts(BEATS, PARTS)

export { setAns, sigText, pt, ENDS, flipBoth as _flip, solveOf, sinValue, type WalkStep, frac, paren, eqSlow }
