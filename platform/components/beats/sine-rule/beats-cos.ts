/**
 * The cosine rule, one tiny idea per beat.
 *
 * Two sides and the angle between them, or three sides: no full pair, so the
 * sine rule can't help. Back to Pythagoras: with angle C at 90° the squares
 * on a and b make the square on c. Turn C past 90° and c² is bigger; below,
 * smaller. The gap between a² + b² and c² is always 2ab cos C, which the
 * student checks on the calculator. So c² = a² + b² − 2ab cos C.
 *
 * Using it: the student taps the angle and the two sides that make it, drags
 * them into the empty rule (a side dropped in once flies on to its second
 * place by itself), types the right side as it is written, then moves the
 * square across the = (it becomes a square root, not ÷ 2). For an angle the
 * rule is rearranged once by moving things across the = (Hassan, 2 Nov 2026:
 * the main technique when the algebra is messy), then worked out in short
 * steps: the top, the bottom, top ÷ bottom, and cos moved across to become
 * cos⁻¹. A negative top means an obtuse angle, with no second answer. Then:
 * sine rule or cosine rule? Five real exam questions finish it.
 *
 * The board, its pieces and its colours are the sine rule's (scene.ts,
 * Stage.tsx); the cosine rule's own moves are in cos.ts.
 */

import type { BeatOf } from "../beat"
import type { Vec, Rect } from "../geometry"
import { applyParts } from "../chapter"
import { type ENode, op, row, frac, eqnNode, eqSlow } from "../equation"
import { setAns, sigText } from "../calc"
import {
  type Scene, type Corner, type VisKey, type BarSpec, CORNERS, CHALK, GREEN, YELLOW, BLUE, RED, RAD, DEG,
  resetBeat, show, later, say, angleAt, numText, choose, figFrame, labAt, startInput, boxNode, layout,
} from "./scene"
import {
  type CRQ, type Look, sideQ, angleQ, sv, av, nameOf, unitTex, sideTex, angTex, answerText, answerOf, topValue, degT, dots, pc, stack,
  startCosFill, cosFilled, startCross, crossDone, askSquare, crossSquare, askRoot, askTop, askBottom, askDivide, crossCos, askAngle,
  sideRule,
  squareWalk, rootWalk, topWalk, bottomWalk, divideWalk, angleWalk,
} from "./cos"
import { type SRQ, startFill, filledHalf, filledEqn, sideFac, sinFac, numbersFirst, askSide, sideWalk } from "./solve"

export type Beat = BeatOf<Scene>

const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat => ({ id, say: text, enter, cta: "", ctaAfter })
const inputRight = (S: Scene) => S.input?.state === "right"
const look = (S: Scene, keys: VisKey[]) => show(S, ["board", ...keys])
const QLOOK: VisKey[] = ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]
const cosD = (d: number) => Math.cos(d * RAD)
const at = (r: number, deg: number): Vec => [r * Math.cos(deg * RAD), r * Math.sin(deg * RAD)]

function setTri(S: Scene, P: Record<Corner, Vec>) {
  for (const k of CORNERS) S.P[k] = [P[k][0], P[k][1]]
}

// ── the squares board: a = 3 and b = 4, angle C turning ──────────────────

const SA = 3, SB = 4
const sqTri = (deg: number): Record<Corner, Vec> => ({ C: [0, 0], A: [SB, 0], B: at(SA, deg) })
/** Angle C as shown: whole degrees, and every number on this board is worked out from it. */
const shownC = (S: Scene) => Math.round(angleAt(S, "C"))
const c2Of = (deg: number) => SA * SA + SB * SB - 2 * SA * SB * cosD(deg)
const c2Text = (S: Scene) => numText(c2Of(shownC(S)), 1)
const gapOf = (S: Scene) => SA * SA + SB * SB - c2Of(shownC(S))

/** A side's full square, world units (as it will be once grown). */
function fullSquare(p: Vec, q: Vec, k: Vec): Vec[] {
  const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy)
  let n: Vec = [-dy / l, dx / l]
  const m: Vec = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  if ((k[0] - m[0]) * n[0] + (k[1] - m[1]) * n[1] > 0) n = [-n[0], -n[1]]
  return [p, q, [q[0] + n[0] * l, q[1] + n[1] * l], [p[0] + n[0] * l, p[1] + n[1] * l]]
}

/** Room for the triangle and, if it has them, its squares as they will be once grown, with a margin for labels. */
function sqFrame(S: Scene): Rect {
  const P = { A: S.P.A, B: S.P.B, C: S.P.C }
  const pts: Vec[] = [P.A, P.B, P.C]
  if (S.squares) for (const s of [fullSquare(P.B, P.C, P.A), fullSquare(P.C, P.A, P.B), fullSquare(P.A, P.B, P.C)]) pts.push(...s)
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const m = 0.08 * Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, y0: Math.min(...ys) - m, y1: Math.max(...ys) + m }
}

/** The squares board. `deg` sets angle C; "keep" leaves it where the student put it. */
function squaresBoard(S: Scene, deg: number | "keep", o: { squares?: boolean; grown?: boolean; areas?: boolean } = {}) {
  const keep = deg === "keep" && S.P.B && Math.abs(Math.hypot(S.P.B[0], S.P.B[1]) - SA) < 0.01 && Math.abs(S.P.A[0] - SB) < 0.01
  const d0 = keep ? Math.atan2(S.P.B[1], S.P.B[0]) * DEG : deg === "keep" ? 65 : deg
  resetBeat(S)
  setTri(S, sqTri(d0))
  S.coloured = new Set(CORNERS)
  S.sideText = { A: () => String(SA), B: () => String(SB), C: () => "c" }
  S.angText = { C: s => `${shownC(s)}^\\circ` }
  S.frameFn = sqFrame
  S.frame = sqFrame(S)
  // only angle C matters here
  S.arcsOnly = ["C"]
  if (o.squares) {
    // the squares' areas (and their unit grids) say the lengths; side labels would crowd the small triangle
    S.sideText = {}
    const g = o.grown === false ? 0 : 1
    S.squares = {
      on: ["A", "B", "C"],
      grow: { A: { v: g, t: 1 }, B: { v: g, t: 1 }, C: { v: g, t: 1 } },
      area: o.areas === false ? {} : { A: () => String(SA * SA), B: () => String(SB * SB), C: c2Text },
      grid: true,
    }
  }
}

/** B turns about C, keeping CB = 3. With `want`, it clicks onto that angle and stays. */
function turnB(S: Scene, want?: number) {
  S.mode = "rule"
  S.lockOnSnap = want !== undefined
  const place = (_S: Scene, w: Vec): Vec => {
    let a = Math.atan2(w[1], w[0]) * DEG
    if (a < -90) a += 360
    a = Math.min(Math.max(a, 40), 140)
    return at(SA, a)
  }
  S.rule = {
    pt: "B", place,
    snap: want === undefined ? undefined : (_S, p) => (Math.abs(Math.atan2(p[1], p[0]) * DEG - want) < 2.5 ? at(SA, want) : null),
  }
  if (want !== undefined) {
    S.releaseNote = S2 => {
      const a = shownC(S2)
      return Math.abs(a - want) < 9 ? `Close. Make angle $C$ exactly $${want}^\\circ$.` : a > want ? "Too big. Turn it back a little." : "Too small. Turn it out a little."
    }
  }
}

/** Keep track of how far angle C has been turned from where the beat began (degrees, as shown). */
function trackTurn(S: Scene) {
  const start = shownC(S)
  let far = 0
  S.tick = S2 => { far = Math.max(far, Math.abs(shownC(S2) - start)); if (far >= 20) S2.got.add("turned") }
}

/** The bars: a² and b² end to end, c² under them, the gap marked; `fill` slides 2ab cos C into it. */
function bars(fill?: (S: Scene) => { t: number; tex: string } | null) {
  return (S: Scene): BarSpec => {
    const c2 = c2Of(shownC(S))
    const gap = gapOf(S)
    return {
      top: [{ v: SA * SA, col: YELLOW, tex: String(SA * SA) }, { v: SB * SB, col: BLUE, tex: String(SB * SB) }],
      bottom: [{ v: c2, col: RED, tex: numText(c2, 1) }],
      max: 46,
      gap: Math.abs(gap) < 0.05 ? null : numText(gap, 1),
      fill: fill?.(S) ?? null,
      names: ["a^2 + b^2", "c^2"],
    }
  }
}

/** 9 + 16 against c², with =, < or > between them, live. */
const compareLine = (S: Scene): ENode => {
  const g = gapOf(S)
  const rel = Math.abs(g) < 0.05 ? "=" : g > 0 ? ">" : "<"
  return row([pc("a2", String(SA * SA), YELLOW), op("pl", "+"), pc("b2", String(SB * SB), BLUE), op("rel", rel), pc("c2", c2Text(S), RED)])
}
/** 9 + 16 − c² = the gap, live. */
const gapLine = (S: Scene): ENode =>
  row([pc("a2", String(SA * SA), YELLOW), op("pl", "+"), pc("b2", String(SB * SB), BLUE), op("mi", "-"), pc("c2", c2Text(S), RED), op("eq", "="), pc("gap", numText(gapOf(S), 1), CHALK)])
/** 2 × 3 × 4 × cos C, live. */
const twoAbLine = (S: Scene): ENode =>
  row([pc("two", "2"), op("t1", "\\times"), pc("ta", String(SA), YELLOW), op("t2", "\\times"), pc("tb", String(SB), BLUE), op("t3", "\\times"), pc("tcos", "\\cos"), pc("tC", `${shownC(S)}^\\circ`, RED), op("eq", "="), pc("gap", numText(2 * SA * SB * cosD(shownC(S)), 1), CHALK)])

/** The rule in letters: c² = a² + b² − 2ab cos C (pieces by id, for the rearranging). */
const T = (p: string, L: Look = {}) => row([pc(`${p}2`, "2", undefined, L), pc(`${p}a`, "a", YELLOW, L), pc(`${p}b`, "b", BLUE, L), pc(`${p}cos`, "\\cos", undefined, L), pc(`${p}C`, "C", RED, L)], 0.1)
/** A number and its square, close together. */
const sqr = (id: string, tex: string, col: string, sup = `${id}q`) => row([pc(id, tex, col), pc(sup, "{}^{2}", col)], 0.02)
const tIds = (p: string) => [`${p}2`, `${p}a`, `${p}b`, `${p}cos`, `${p}C`]
const sgn = (id: string, tex: string, L: Look = {}) => pc(id, tex, undefined, L, { op: true })
const ruleLetters = (L: Look = {}) => row([pc("c2", "c^{2}", RED, L), op("eq", "="), pc("a2", "a^{2}", YELLOW, L), sgn("pl", "+", L), pc("b2", "b^{2}", BLUE, L), sgn("mT", "-", L), T("T", L)])
const TERM_TEX = `2${c(YELLOW, "a")}${c(BLUE, "b")}\\cos ${c(RED, "C")}`

// ── questions ────────────────────────────────────────────────────────────

/** A question's board: what it gives, the unknown in its pair's colour. */
function cqBoard(S: Scene, q: CRQ, o: { quiet?: boolean; hideX?: boolean } = {}) {
  resetBeat(S)
  setTri(S, q.P)
  S.coloured = new Set(CORNERS)
  if (q.names) S.names = { ...q.names }
  for (const [n, v] of Object.entries(q.pts ?? {})) S.P[n] = [v[0], v[1]]
  S.extra = q.extra ? { ...q.extra, quiet: o.quiet || undefined } : null
  for (const k of CORNERS) if (!(q.find === "side" && k === "C" && o.hideX)) S.sideText[k] = () => sideTex(q, k)
  if (!(q.find === "angle" && o.hideX)) S.angText.C = () => angTex(q)
  for (const [k, d] of Object.entries(q.shownAngles ?? {})) S.angText[k as Corner] = () => degT(d!)
  S.sideInside = new Set(q.inside ?? [])
  S.sideAlong = { ...(q.along ?? {}) }
  S.arcsOnly = q.arcsOnly ?? null
  if (o.quiet && q.regions && q.region) { S.regions = q.regions; S.regionLit = q.region }
  S.frameFn = () => figFrame(S)
}

/** Every label on the triangle that can be dragged into the rule. */
function cosLabels(q: CRQ): Record<string, string> {
  return { "side-A": numText(sv(q, "A"), 2), "side-B": numText(sv(q, "B"), 2), "side-C": q.find === "side" ? nameOf(q) : numText(sv(q, "C"), 2), "ang-C": angTex(q) }
}

/** Tap the angle across from the unknown side (it is the one between the two known sides). */
function tapAngleAcross(id: string, text: string, q: CRQ, quiet = false): Beat {
  return {
    id, say: text,
    enter: S => {
      cqBoard(S, q, { quiet })
      S.mode = "tapAngle"
      S.onAngle = (S2, a) => {
        if (S2.got.has("tap")) return
        if (a === "C") { S2.got.add("tap"); S2.glowAng = new Set(["C"]); S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1; S2.note = null; S2.light = null; return }
        say(S2, `That angle touches $${nameOf(q)}$. Go across from it.`, "wrong", 3.4)
        S2.light = { from: "C", since: S2.time }
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** Tap the two sides that make angle C, in either order. */
function tapTwoSides(id: string, text: string, q: CRQ, quiet = false): Beat {
  return {
    id, say: text,
    enter: S => {
      cqBoard(S, q, { quiet })
      S.glowAng = new Set(["C"])
      S.mode = "tapSide"
      S.onSide = (S2, sd) => {
        if (S2.got.has("tap")) return
        if (sd === "C") { say(S2, `That's $${nameOf(q)}$. It's across from the angle.`, "wrong", 3.4); return }
        if (S2.got.has(`s-${sd}`)) return
        S2.got.add(`s-${sd}`)
        S2.glowSide = new Set([...S2.glowSide, sd])
        S2.touched = { kind: "side", c: sd }
        S2.flashGood = 0.8
        if (S2.got.has("s-A") && S2.got.has("s-B")) { S2.got.add("tap"); S2.note = null } else say(S2, "Now tap the other one.", "calm", 600)
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** Tap the side across from the unknown angle. */
function tapSideAcross(id: string, text: string, q: CRQ, quiet = false): Beat {
  return {
    id, say: text,
    enter: S => {
      cqBoard(S, q, { quiet })
      S.mode = "tapSide"
      S.onSide = (S2, sd) => {
        if (S2.got.has("tap")) return
        if (sd === "C") { S2.got.add("tap"); S2.glowSide = new Set(["C"]); S2.touched = { kind: "side", c: "C" }; S2.flashGood = 1; S2.note = null; S2.light = null; return }
        say(S2, `That side touches $${nameOf(q)}$. Go across from it.`, "wrong", 3.4)
        S2.light = { from: "C", since: S2.time }
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

/** Drag labels off the triangle into some places of the rule. */
function fillCos(id: string, text: string, q: CRQ, slots: string[], quiet = false, pre: string[] = []): Beat {
  return {
    id, say: text,
    enter: S => {
      cqBoard(S, q, { quiet })
      S.glowAng = new Set(["C"])
      startCosFill(S, q, q.find, slots, cosLabels(q), pre)
      look(S, [...QLOOK, "eq"])
    },
    done: S => cosFilled(S, slots),
    advanceAfter: 1500,
  }
}

const ALL = ["sx", "ang", "s1", "s2"]

/** The side questions' steps after the fill: type the right side, move the square, √ Ans. */
function sideSteps(p: string, q: CRQ, say1: string, quiet = false): Beat[] {
  const onBoard = (S: Scene) => cqBoard(S, q, { quiet })
  return [
    {
      id: `${p}-calc`, say: say1,
      enter: S => { onBoard(S); askSquare(S, q); look(S, [...QLOOK, "eq", "keypad"]) },
      done: inputRight, advanceAfter: 1700, walk: squareWalk(q),
    },
    {
      id: `${p}-cross`, say: "Now move the square across the $=$.",
      enter: S => { onBoard(S); crossSquare(S, q); look(S, [...QLOOK, "eq", "chips"]) },
      done: crossDone, advanceAfter: 900,
    },
    {
      id: `${p}-root`, say: q.dp !== undefined ? `A *show that* needs more figures than the answer it gives. Give $${q.dp}$ decimal places.` : "Work it out.",
      enter: S => {
        onBoard(S)
        askRoot(S, q, S2 => { S2.sideText.C = () => `${answerText(q)}${unitTex(q)}`; S2.touched = { kind: "side", c: "C" }; S2.flashGood = 1.2 })
        if (q.dp !== undefined) S.input!.help = (S2, t) => { if (t === 1) say(S2, `Press $\\sqrt{\\phantom{x}}$, then Ans. Give $${q.dp}$ decimal places.`, "calm", 3.6) }
        look(S, [...QLOOK, "eq", "keypad"])
      },
      done: inputRight, advanceAfter: 2200, walk: rootWalk(q),
    },
  ]
}

/** The angle questions' steps after the fill: the top, the bottom, divide, cos across, SHIFT cos Ans. */
function angleSteps(p: string, q: CRQ, quiet = false, o: { negNote?: string } = {}): Beat[] {
  const onBoard = (S: Scene) => cqBoard(S, q, { quiet })
  const out: Beat[] = [
    { id: `${p}-top`, say: "Work out the top.", enter: S => { onBoard(S); askTop(S, q); look(S, [...QLOOK, "eq", "keypad"]) }, done: inputRight, advanceAfter: 1700, walk: topWalk(q) },
  ]
  if (o.negNote) out.push(watch(`${p}-neg`, o.negNote, S => { onBoard(S); S.eqFn = () => row([pc("cos", "\\cos"), pc("angv", nameOf(q), RED), op("eq", "="), frac("bar", pc("topv", dots(topValue(q)), CHALK, {}, { pulse: true }), row([pc("two", "2"), op("t1", "\\times"), pc("p1v", numText(sv(q, "A"), 2), YELLOW), op("t2", "\\times"), pc("p2v", numText(sv(q, "B"), 2), BLUE)]))]); look(S, [...QLOOK, "eq"]) }, 2.2))
  out.push(
    { id: `${p}-bottom`, say: "Now work out the bottom.", enter: S => { onBoard(S); askBottom(S, q); look(S, [...QLOOK, "eq", "keypad"]) }, done: inputRight, advanceAfter: 1700, walk: bottomWalk(q) },
    { id: `${p}-divide`, say: "Now divide.", enter: S => { onBoard(S); askDivide(S, q); look(S, [...QLOOK, "eq", "keypad"]) }, done: inputRight, advanceAfter: 1700, walk: divideWalk(q) },
    { id: `${p}-cross`, say: "Now move the $\\cos$ across the $=$.", enter: S => { onBoard(S); crossCos(S, q); look(S, [...QLOOK, "eq", "chips"]) }, done: crossDone, advanceAfter: 900 },
    {
      id: `${p}-angle`, say: "Work it out.",
      enter: S => {
        onBoard(S)
        askAngle(S, q, S2 => { S2.angText.C = () => `${answerText(q)}^\\circ`; S2.touched = { kind: "angle", c: "C" }; S2.flashGood = 1.2 })
        look(S, [...QLOOK, "eq", "keypad"])
      },
      done: inputRight, advanceAfter: 2200, walk: angleWalk(q),
    },
  )
  return out
}

// ── is there a full pair? ────────────────────────────────────────────────

/** A figure for "is there a full pair?": what each side and angle says (null: nothing). */
interface Fig {
  P: Record<Corner, Vec>
  side: Partial<Record<Corner, string>>
  ang: Partial<Record<Corner, string>>
  /** the unknown, by kind and corner */
  unknown: { kind: "side" | "angle"; c: Corner }
  /** the corner of the full pair, if there is one */
  pair: Corner | null
}

/** A triangle from its three sides: C at the origin, CA along the floor. */
const fromSides = (a: number, b: number, c0: number) => angleQ("", a, b, c0).P
/** From two angles and the side across one of them. */
function fromAngles(A: number, B: number, side: [Corner, number]): Record<Corner, Vec> {
  const ang: Record<Corner, number> = { A, B, C: 180 - A - B }
  const r = side[1] / Math.sin(ang[side[0]] * RAD)
  return sideQ("", r * Math.sin(A * RAD), r * Math.sin(B * RAD), ang.C).P
}

/**
 * Is there a full pair? The student taps one (its side and its angle, either
 * order) or taps No pair. With `rule`, they then say which rule it calls for.
 */
function pairBeat(id: string, text: string, F: Fig, rule: boolean): Beat {
  return {
    id, say: text,
    enter: S => {
      resetBeat(S)
      setTri(S, F.P)
      S.coloured = new Set(CORNERS)
      S.names = {}
      for (const k of CORNERS) {
        const s = F.side[k], a = F.ang[k]
        if (s) S.sideText[k] = () => s
        if (a) S.angText[k] = () => a
      }
      S.frameFn = () => figFrame(S)
      S.mode = "tapPair"
      const unk = F.unknown
      const askRule = (S2: Scene) => {
        if (!rule) { S2.got.add("tap"); return }
        S2.mode = "none"
        later(S2, 0.6, S3 => {
          say(S3, "So which rule do we use?", "calm", 600)
          choose(S3, ["Sine rule", "Cosine rule"], F.pair ? 0 : 1, false, (S4, _k, right) => {
            if (right) { S4.got.add("tap"); say(S4, F.pair ? "Yes. There's a full pair, so it's the sine rule." : "Yes. There's no full pair, so it's the cosine rule.", "calm", 600); return }
            say(S4, F.pair ? "There's a full pair. That's the sine rule." : "There's no full pair. That's the cosine rule.", "wrong", 4)
          })
        })
      }
      const found = (S2: Scene) => { S2.choice = null; S2.flashGood = 1; S2.note = null; askRule(S2) }
      S.onSide = (S2, sd) => {
        if (S2.got.has("found")) return
        if (F.pair === sd) {
          S2.got.add("side"); S2.glowSide = new Set([sd]); S2.touched = { kind: "side", c: sd }; S2.flashGood = 0.8
          if (S2.got.has("ang")) { S2.got.add("found"); found(S2) } else say(S2, "Now tap the angle across from it.", "calm", 600)
          return
        }
        if (S2.got.has("ang")) { say(S2, "Go across from the angle you tapped.", "wrong", 3.4); return }
        const s = F.side[sd]
        if (unk.kind === "side" && unk.c === sd) say(S2, `That's $${s}$. We don't know it.`, "wrong", 3.4)
        else if (!s) say(S2, "We don't know that side.", "wrong", 3.4)
        else say(S2, `We know $${s}$, but not the angle across from it.`, "wrong", 3.8)
      }
      S.onAngle = (S2, a) => {
        if (S2.got.has("found")) return
        if (F.pair === a) {
          S2.got.add("ang"); S2.glowAng = new Set([a]); S2.touched = { kind: "angle", c: a }; S2.flashGood = 0.8
          if (S2.got.has("side")) { S2.got.add("found"); found(S2) } else say(S2, "Now tap the side across from it.", "calm", 600)
          return
        }
        if (S2.got.has("side")) { say(S2, "Go across from the side you tapped.", "wrong", 3.4); return }
        const t = F.ang[a]
        if (unk.kind === "angle" && unk.c === a) say(S2, `That's $${t}$. We don't know it.`, "wrong", 3.4)
        else if (!t) say(S2, "We don't know that angle.", "wrong", 3.4)
        else say(S2, `We know $${t}$, but not the side across from it.`, "wrong", 3.8)
      }
      choose(S, ["No pair"], F.pair ? -1 : 0, false, (S2, _k, right) => {
        if (right) { S2.got.add("found"); say(S2, "Right. There isn't one.", "calm", 600); later(S2, 0.4, S3 => { S3.choice = null; askRule(S3) }); return }
        say(S2, "Look again. One side has its angle known.", "wrong", 3.8)
      })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "chips"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

const figOf = (q: CRQ, hideX = false): Fig => ({
  P: q.P,
  side: { A: numText(sv(q, "A"), 2), B: numText(sv(q, "B"), 2), ...(q.find === "angle" ? { C: numText(sv(q, "C"), 2) } : hideX ? {} : { C: nameOf(q) }) },
  ang: q.find === "side" ? { C: degT(av(q, "C")) } : { C: nameOf(q) },
  unknown: q.find === "side" ? { kind: "side", c: "C" } : { kind: "angle", c: "C" },
  pair: null,
})

// ── the questions ────────────────────────────────────────────────────────

/** Two sides and the angle between them: the first triangle, and the first side found. */
const Q1 = sideQ("q1", 5, 7, 40)
const Q2 = sideQ("q2", 4, 6, 120)
/** Three sides: the second triangle, and the first angle found. */
const Q3 = angleQ("q3", 5, 6, 7)
const Q4 = angleQ("q4", 5, 5, 9)

/** 4024/21/O/N/25 Q20(a): field ABC, AB = 65 m, AC = 75 m, angle CAB = 125°. Show that BC = 124.3 m to 1 d.p. */
const EX1 = (() => {
  const q = sideQ("ex1", 65, 75, 125, { name: "BC", unit: "m", dp: 2, names: { C: "A", A: "C", B: "B" } })
  // drawn as the paper does: A at the top, C to the right, B down to the left
  q.P = { C: [0, 0], A: at(75, -10), B: at(65, -135) }
  return q
})()

/** 4024/22/M/J/25 Q22(a): field ABC, AB = 150 m, BC = 187 m, angle ABC = 112°; rolls of 20 m of fencing. */
const EX2 = (() => {
  const q = sideQ("ex2", 187, 150, 112, { name: "AC", unit: "m", names: { C: "B", A: "A", B: "C" } })
  q.P = { C: [0, 0], A: at(150, 176), B: at(187, 288) }
  return q
})()

/** 4024/22/O/N/24 Q8(c): AD = 3.6, AE = 5.2 (from (b)), DE = 5.6; DE parallel to BC. Calculate angle DAE. */
const EX3 = (() => {
  const q = angleQ("ex3", 5.2, 3.6, 5.6, { names: { C: "A", A: "D", B: "E", Bp: "B", Cp: "C" } })
  const C = q.angle.C
  q.P = { C: [0, 0], A: at(3.6, 216), B: at(5.2, 216 + C) }
  q.pts = { Bp: at(6.3, 216), Cp: at(9.1, 216 + C) }
  q.extra = {
    segs: [["A", "Bp"], ["B", "Cp"], ["Bp", "Cp"]],
    arrows: [["A", "B"], ["Bp", "Cp"]],
    labels: [{ a: "A", b: "Bp", tex: "2.7" }, { a: "B", b: "Cp", tex: "3.9" }, { a: "Bp", b: "Cp", tex: "9.8" }],
  }
  q.regions = [{ id: "ADE", pts: ["C", "A", "B"] }, { id: "DBCE", pts: ["A", "Bp", "Cp", "B"] }]
  q.region = "ADE"
  return q
})()

/** 4024/22/M/J/17 Q8(b): cross-section ABCDE; EA = 9, AB = 11, EB = 15.1, ED = 6, BC = 4. Calculate angle EAB. */
const EX4 = (() => {
  const q = angleQ("ex4", 11, 9, 15.1, { names: { C: "A", A: "E", B: "B", Dp: "D", Cp: "C" } })
  // D and C on the ground, E 6 up, B 4 up; A where EA = 9 and AB = 11
  const DC = Math.sqrt(15.1 * 15.1 - 4)
  const E: Vec = [0, 6], B: Vec = [DC, 4]
  const d = Math.hypot(B[0] - E[0], B[1] - E[1])
  const along = (81 - 121 + d * d) / (2 * d), up = Math.sqrt(81 - along * along)
  const u: Vec = [(B[0] - E[0]) / d, (B[1] - E[1]) / d]
  const A: Vec = [E[0] + u[0] * along - u[1] * up, E[1] + u[1] * along + u[0] * up]
  q.P = { C: A, A: E, B }
  q.pts = { Dp: [0, 0], Cp: [DC, 0] }
  q.extra = {
    segs: [["A", "Dp"], ["Dp", "Cp"], ["Cp", "B"]],
    rts: [{ at: "Dp", a: "A", b: "Cp" }, { at: "Cp", a: "Dp", b: "B" }],
    labels: [{ a: "A", b: "Dp", tex: "6" }, { a: "Cp", b: "B", tex: "4" }],
  }
  q.regions = [{ id: "EAB", pts: ["A", "C", "B"] }, { id: "EBCD", pts: ["A", "B", "Cp", "Dp"] }]
  q.region = "EAB"
  return q
})()

/**
 * 4024/23/M/J/25 Q19: AB = 12, BD = 7, AD = 6 cm; angle DAC = 32°, angle BCA = 48°.
 * (a) angle BAD (cosine rule, in triangle ABD), (b) AC (sine rule, in triangle ABC).
 */
const E5 = (() => {
  const bad = Math.acos((144 + 36 - 49) / 144) * DEG
  const bac = bad + 32, abc = 180 - bac - 48
  const AC = (12 * Math.sin(abc * RAD)) / Math.sin(48 * RAD)
  const A: Vec = [0, 0], D = at(6, 40), B = at(12, 40 + bad), Cpaper = at(AC, 8)
  return { bad, bac, abc, AC, A, D, B, C: Cpaper }
})()
const EX5 = (() => {
  // a busy figure: only the angle being found keeps its arc
  const q = angleQ("ex5", 12, 6, 7, { names: { C: "A", A: "D", B: "B", Cp: "C" }, arcsOnly: ["C"] })
  q.P = { C: E5.A, A: E5.D, B: E5.B }
  q.pts = { Cp: E5.C }
  q.extra = {
    segs: [["B", "Cp"], ["C", "Cp"]],
    arcs: [{ at: "C", a: "A", b: "Cp", tex: "32^\\circ" }, { at: "Cp", a: "C", b: "B", tex: "48^\\circ" }],
  }
  q.regions = [{ id: "ABD", pts: ["C", "A", "B"] }, { id: "ADBC", pts: ["C", "A", "B", "Cp"] }]
  q.region = "ABD"
  return q
})()
/** Part (b): triangle ABC with the paper's letters, for the sine rule. */
const EX5B: SRQ & { P: Record<Corner, Vec> } = (() => {
  const ang: Record<Corner, number> = { A: E5.bac, B: E5.abc, C: 48 }
  const r = 12 / Math.sin(48 * RAD)
  const side: Record<Corner, number> = { A: r * Math.sin(ang.A * RAD), B: r * Math.sin(ang.B * RAD), C: 12 }
  return { id: "ex5b", want: "B", find: "side", pair: "C", side, angle: ang, name: "AC", unit: "cm", given: { "ang-B": 75.5, "ang-A": 56.5 }, P: { A: E5.A, B: E5.B, C: E5.C } }
})()

function ex5bBoard(S: Scene, o: { bac?: boolean; abc?: boolean } = {}) {
  resetBeat(S)
  setTri(S, EX5B.P)
  S.coloured = new Set(CORNERS)
  S.P.Dp = E5.D
  S.names = { A: "A", B: "B", C: "C", Dp: "D" }
  S.extra = { segs: [["A", "Dp"], ["B", "Dp"]], quiet: true }
  S.sideText = { C: () => "12", B: () => "AC" }
  S.angText = { C: () => "48^\\circ" }
  if (o.bac) S.angText.A = () => "56.5^\\circ"
  if (o.abc) S.angText.B = () => "75.5^\\circ"
  S.frameFn = () => figFrame(S)
}

// ── the "which rule?" figures ────────────────────────────────────────────

const F1: Fig = { P: fromAngles(50, 65, ["B", 8]), side: { B: "8", A: "x" }, ang: { A: "50^\\circ", B: "65^\\circ" }, unknown: { kind: "side", c: "A" }, pair: "B" }
const F2: Fig = { P: sideQ("", 6, 9, 48).P, side: { A: "6", B: "9", C: "x" }, ang: { C: "48^\\circ" }, unknown: { kind: "side", c: "C" }, pair: null }
const F3: Fig = { P: fromSides(7, 8, 10), side: { A: "7", B: "8", C: "10" }, ang: { C: "\\theta" }, unknown: { kind: "angle", c: "C" }, pair: null }
const F4: Fig = (() => {
  // a = 7, b = 9, angle B = 40°: angle A is wanted
  const A = Math.asin((7 * Math.sin(40 * RAD)) / 9) * DEG
  return { P: fromAngles(A, 40, ["B", 9]), side: { A: "7", B: "9" }, ang: { B: "40^\\circ", A: "\\theta" }, unknown: { kind: "angle", c: "A" }, pair: "B" } as Fig
})()

// ── the beats ────────────────────────────────────────────────────────────

const PART_A: Beat[] = [
  // ── 1. When the sine rule can't help ──
  watch("open", "Here's a triangle. We know two sides and the angle between them.", S => {
    cqBoard(S, Q1, { hideX: true })
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.4),
  watch("x", "We want this side. Let's call it $x$.", S => {
    cqBoard(S, Q1)
    S.pulseSide = new Set(["C"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }),
  pairBeat("no-pair", "Is there a full pair? Tap it, or tap No pair.", figOf(Q1), false),
  watch("cant", "With no full pair, the sine rule can't help.", S => {
    cqBoard(S, Q1)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.2),
  watch("three", "Here's another. We know all three sides.", S => {
    cqBoard(S, Q3, { hideX: true })
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.2),
  watch("theta", "We want this angle. Let's call it $\\theta$.", S => {
    cqBoard(S, Q3)
    S.pulseAng = new Set(["C"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }),
  pairBeat("no-pair-2", "Is there a full pair this time?", figOf(Q3), false),
  watch("new-rule", "We need a new rule. It's called the *cosine rule*.", S => {
    cqBoard(S, Q3)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.2),

  // ── 2. Back to Pythagoras ──
  {
    id: "right",
    say: "Let's start with a right angle. Turn side $a$ until angle $C$ is $90^\\circ$.",
    enter: S => {
      squaresBoard(S, 62)
      turnB(S, 90)
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("grow", "Let's grow a square on each side.", S => {
    squaresBoard(S, 90, { squares: true, grown: false, areas: false })
    // one after another: a, then b, then c
    for (const k of CORNERS) S.squares!.grow[k].t = 0
    ;(["A", "B", "C"] as Corner[]).forEach((k, i) => later(S, 0.3 + i * 0.75, S2 => { S2.squares!.grow[k].t = 1 }))
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares"])
  }, 3.0),
  {
    id: "areas",
    say: "Tap each square to see its area.",
    enter: S => {
      squaresBoard(S, 90, { squares: true, areas: false })
      S.mode = "tapSquare"
      const area: Record<Corner, (s: Scene) => string> = { A: () => "9", B: () => "16", C: c2Text }
      S.onSide = (S2, k) => {
        if (S2.got.has(`sq-${k}`)) return
        S2.got.add(`sq-${k}`)
        S2.squares!.area[k] = area[k]
        if (k !== "C") say(S2, `${k === "A" ? "$3 \\times 3$" : "$4 \\times 4$"} is $${k === "A" ? 9 : 16}$.`, "calm", 2.2)
        else say(S2, "$5 \\times 5$ is $25$.", "calm", 2.2)
        if (CORNERS.every(c0 => S2.got.has(`sq-${c0}`))) S2.got.add("tap")
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1700,
  },
  watch("make", "The two small squares make the big one.", S => {
    squaresBoard(S, 90, { squares: true })
    const from: Record<string, Vec> = {}
    S.eqFn = () => row([pc("a2", "9", YELLOW, { from, fly: 1.1 }), op("pl", "+"), pc("b2", "16", BLUE, { from, fly: 1.1 }), op("eq", "="), pc("c2", "25", RED, { from, fly: 1.1 })])
    from.a2 = labAt(S, "sq-A") ?? [S.w / 2, S.h / 2]
    from.b2 = labAt(S, "sq-B") ?? [S.w / 2, S.h / 2]
    from.c2 = labAt(S, "sq-C") ?? [S.w / 2, S.h / 2]
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.6),
  watch("pythagoras", "This is Pythagoras' theorem, $c^2 = a^2 + b^2$.", S => {
    squaresBoard(S, 90, { squares: true })
    S.eqFn = () => row([pc("c2", "c^{2}", RED), op("eq", "="), pc("a2", "a^{2}", YELLOW), op("pl", "+"), pc("b2", "b^{2}", BLUE)])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.2),
  {
    id: "bigger",
    say: "What if angle $C$ is bigger? Turn it past $90^\\circ$.",
    enter: S => {
      squaresBoard(S, 90, { squares: true })
      turnB(S)
      S.eqFn = compareLine
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
    },
    // exactly what the phrase asks: any angle past 90° (it starts at 90°)
    done: S => shownC(S) > 90,
    free: true,
    minPlay: 3,
  },
  watch("is-bigger", "Now $c^2$ is bigger than $a^2 + b^2$.", S => {
    squaresBoard(S, "keep", { squares: true })
    if (shownC(S) <= 90) squaresBoard(S, 112, { squares: true })
    S.eqFn = compareLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.2),
  {
    id: "smaller",
    say: "Now make angle $C$ smaller than $90^\\circ$.",
    enter: S => {
      squaresBoard(S, "keep", { squares: true })
      turnB(S)
      S.eqFn = compareLine
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
    },
    done: S => shownC(S) < 90,
    free: true,
    minPlay: 3,
  },
  watch("is-smaller", "Now $c^2$ is smaller.", S => {
    squaresBoard(S, "keep", { squares: true })
    if (shownC(S) >= 90) squaresBoard(S, 68, { squares: true })
    S.eqFn = compareLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.0),
  watch("only-90", "So Pythagoras only works when $C$ is $90^\\circ$.", S => {
    squaresBoard(S, "keep", { squares: true })
    S.eqFn = compareLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.2),

  // ── 3. The gap ──
  watch("gap", "Let's look at the gap between $a^2 + b^2$ and $c^2$.", S => {
    squaresBoard(S, "keep", { squares: true })
    if (shownC(S) === 90) squaresBoard(S, 70, { squares: true })
    S.bars = bars()
    S.eqFn = gapLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
  }, 2.4),
  {
    id: "gap-play",
    say: "Turn angle $C$ and watch the gap.",
    enter: S => {
      squaresBoard(S, "keep", { squares: true })
      turnB(S)
      trackTurn(S)
      S.bars = bars()
      S.eqFn = gapLine
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
    },
    // a little turning (20°), the same on any screen
    done: S => S.got.has("turned"),
    free: true,
    minPlay: 4,
  },
  watch("gap-0", "At $90^\\circ$ the gap is $0$.", S => {
    squaresBoard(S, 90, { squares: true })
    S.bars = bars()
    S.eqFn = gapLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
  }, 2.2),
  {
    id: "make-60",
    say: "Make angle $C$ $60^\\circ$.",
    enter: S => {
      squaresBoard(S, 90, { squares: true })
      turnB(S, 60)
      S.bars = bars()
      S.eqFn = gapLine
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("gap-12", "The gap is $12$. Where does $12$ come from?", S => {
    squaresBoard(S, 60, { squares: true })
    S.bars = bars()
    S.eqFn = gapLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
  }, 2.4),
  {
    id: "type-gap",
    say: "Type $2 \\times 3 \\times 4 \\times \\cos 60$.",
    enter: S => {
      squaresBoard(S, 60, { squares: true })
      let fillAt = -1
      S.bars = bars(S2 => (fillAt < 0 ? null : { t: (S2.time - fillAt) / 1.2, tex: "2ab\\cos C" }))
      startInput(S, {
        answer: 12, sf: 3, max: 24, typed: "2*3*4*c60", calcOnly: "Type it on the calculator: $2 \\times 3 \\times 4 \\times \\cos 60$.",
        onRight: S2 => { fillAt = S2.time + 0.3; say(S2, "That's the gap.", "calm", 600) },
      })
      S.eqFn = S2 => row([boxNode(S2), ...(S2.input?.state === "right" ? [op("eq", "="), pc("res", "12", GREEN)] : [])])
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2400,
    walk: [{ say: "Press $2$, $\\times$, $3$, $\\times$, $4$, $\\times$, $\\cos$, $60$, then $=$.", tex: "2 \\times 3 \\times 4 \\times \\cos 60" }, { say: "It gives $12$.", tex: `= ${c(GREEN, "12")}` }],
  },
  {
    id: "fits",
    say: "It fills the gap. Try another angle.",
    enter: S => {
      squaresBoard(S, 60, { squares: true })
      turnB(S)
      trackTurn(S)
      S.bars = bars(() => ({ t: 1, tex: "2ab\\cos C" }))
      S.eqFn = twoAbLine
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
    },
    done: S => S.got.has("turned"),
    free: true,
    minPlay: 4,
  },
  watch("always", "The gap is always $2ab\\cos C$.", S => {
    squaresBoard(S, "keep", { squares: true })
    S.bars = bars(() => ({ t: 1, tex: "2ab\\cos C" }))
    S.eqFn = twoAbLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
  }, 2.2),
  watch("negative", "Past $90^\\circ$, $\\cos C$ is negative, so the gap is too.", S => {
    squaresBoard(S, "keep", { squares: true })
    S.P.B = at(SA, 120)
    S.bars = bars(() => ({ t: 1, tex: "2ab\\cos C" }))
    S.eqFn = twoAbLine
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
  }, 2.8),
  watch("so-rule", "So $c^2 = a^2 + b^2 - 2ab\\cos C$.", S => {
    squaresBoard(S, 120, { squares: true })
    S.bars = bars(() => ({ t: 1, tex: "2ab\\cos C" }))
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "bars", "eq"])
    // − 2ab cos C comes up out of the gap
    const from: Record<string, Vec> = {}
    const L = layout(S)
    for (const id of ["mT", ...tIds("T")]) from[id] = [S.w / 2, L.barsY + 30]
    S.eqFn = () => ruleLetters({ from, fly: 1.3 })
  }, 2.8),
  watch("named", "This is the *cosine rule*.", S => {
    squaresBoard(S, 120, { squares: true })
    S.eqFn = () => ruleLetters()
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.0),
  watch("page", "Your exam's formula page writes it for side $a$.", S => {
    squaresBoard(S, 120, { squares: true })
    const page = row([pc("fa2", "a^{2}", YELLOW), op("feq", "="), pc("fb2", "b^{2}", BLUE), op("fpl", "+"), pc("fc2", "c^{2}", RED), op("fmi", "-"), pc("f2", "2"), pc("fb", "b", BLUE), pc("fc", "c", RED), pc("fcos", "\\cos"), pc("fA", "A", YELLOW)], 0.1)
    S.eqFn = () => stack("stk", ruleLetters(), page)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
  }, 2.6),
  watch("own-pair", "The side on its own goes with the angle in the $\\cos$.", S => {
    squaresBoard(S, 120)
    S.eqFn = () => ruleLetters({ pulse: new Set(["c2", "TC"]) })
    S.pulseSide = new Set(["C"])
    S.pulseAng = new Set(["C"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.4),
  watch("other-two", "The other two sides make that angle.", S => {
    squaresBoard(S, 120)
    S.eqFn = () => ruleLetters({ pulse: new Set(["a2", "b2", "Ta", "Tb"]) })
    S.glowSide = new Set(["A", "B"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "eq"])
  }, 2.4),

  // ── 4. Finding a side ──
  watch("x-back", "Let's go back to this one. Now we can find $x$.", S => {
    cqBoard(S, Q1)
    look(S, QLOOK)
  }, 2.0),
  tapAngleAcross("x-angle", "Tap the angle across from $x$.", Q1),
  tapTwoSides("x-sides", "Now tap the two sides that make this angle.", Q1),
  fillCos("x-fill", "Drag $x$ and its angle into the rule.", Q1, ["sx", "ang"]),
  fillCos("x-fill-2", "Now drag in the two sides.", Q1, ["s1", "s2"], false, ["sx", "ang"]),
  watch("twice", "Each of them is in the rule twice.", S => {
    cqBoard(S, Q1)
    S.eqFn = S2 => {
      const odd = Math.floor((S2.time - S2.beatStart) / 1.3) % 2
      return sideRule(Q1, { pulse: new Set(odd ? ["s2v", "p2v"] : ["s1v", "p1v"]) })
    }
    look(S, [...QLOOK, "eq"])
  }, 2.8),
  ...sideSteps("x", Q1, "Type the right side into the calculator."),
  watch("y", "This time the angle is $120^\\circ$.", S => {
    cqBoard(S, Q2)
    look(S, QLOOK)
  }, 2.0),
  tapAngleAcross("y-angle", "Tap the angle across from $x$.", Q2),
  tapTwoSides("y-sides", "Tap the two sides that make it.", Q2),
  fillCos("y-fill", "Fill the rule.", Q2, ALL),
  {
    id: "y-cos",
    say: "What is $\\cos 120^\\circ$?",
    enter: S => {
      cqBoard(S, Q2)
      startInput(S, { answer: -0.5, sf: 3, max: 16, typed: "c120", calcOnly: "Type it on the calculator: $\\cos$, then $120$." })
      S.eqFn = S2 => row([pc("cos", "\\cos"), pc("angv", "120^\\circ", RED), op("eq", "="), S2.input?.state === "right" ? pc("res", "-0.5", GREEN) : boxNode(S2)])
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: [{ say: "Press $\\cos$, $120$, then $=$.", tex: "\\cos 120" }, { say: "It's negative.", tex: `= ${c(GREEN, "-0.5")}` }],
  },
  watch("y-adds", "Taking away a negative adds.", S => {
    cqBoard(S, Q2)
    let stage = 0
    later(S, 1.3, S2 => { eqSlow(S2.eq, 1.2); stage = 1 })
    S.eqFn = () => {
      const head = [sqr("x", "x", RED), op("eq", "="), sqr("s1v", "4", YELLOW, "s1q"), op("pl", "+"), sqr("s2v", "6", BLUE, "s2q")]
      if (stage === 0) return row([...head, op("mi", "-"), pc("two", "2"), op("t1", "\\times"), pc("p1v", "4", YELLOW), op("t2", "\\times"), pc("p2v", "6", BLUE), op("t3", "\\times"), pc("neg", "(-0.5)", CHALK, {}, { pulse: true })])
      return row([...head, op("mi", "+"), pc("neg", "24", GREEN)])
    }
    look(S, [...QLOOK, "eq"])
  }, 3.2),
  watch("y-more", "That's why $x^2$ is more than $4^2 + 6^2$.", S => {
    cqBoard(S, Q2)
    S.eqFn = () => row([sqr("x", "x", RED), op("eq", "="), sqr("s1v", "4", YELLOW, "s1q"), op("pl", "+"), sqr("s2v", "6", BLUE, "s2q"), op("mi", "+"), pc("neg", "24", GREEN)])
    S.pulseSide = new Set(["C"])
    look(S, [...QLOOK, "eq"])
  }, 2.2),
  ...sideSteps("y", Q2, "Work out the right side."),
]

// ── 5. Finding an angle: the rule rearranged, by moving things across ─────

/** c² + 2ab cos C = a² + b² − 2ab cos C + 2ab cos C, as the chip lands. */
const bothSides = (L: Look) => row([
  pc("c2", "c^{2}", RED, L), sgn("pL", "+", L), T("L", L), op("eq", "="),
  pc("a2", "a^{2}", YELLOW, L), sgn("pl", "+", L), pc("b2", "b^{2}", BLUE, L), sgn("mT", "-", L), T("T", L), sgn("pR", "+", L), T("R", L),
])
/** c² + 2ab cos C = a² + b² */
const r2 = (L: Look = {}) => row([pc("c2", "c^{2}", RED, L), sgn("pL", "+", L), T("L", L), op("eq", "="), pc("a2", "a^{2}", YELLOW, L), sgn("pl", "+", L), pc("b2", "b^{2}", BLUE, L)])
/** 2ab cos C = a² + b² − c² */
const r3 = (L: Look = {}) => row([T("L", L), op("eq", "="), pc("a2", "a^{2}", YELLOW, L), sgn("pl", "+", L), pc("b2", "b^{2}", BLUE, L), sgn("mC", "-", L), pc("c2", "c^{2}", RED, L)])
/** cos C = (a² + b² − c²) / 2ab */
const r4 = (L: Look = {}) => row([pc("Lcos", "\\cos", undefined, L), pc("LC", "C", RED, L), op("eq", "="),
  frac("bar", row([pc("a2", "a^{2}", YELLOW, L), sgn("pl", "+", L), pc("b2", "b^{2}", BLUE, L), sgn("mC", "-", L), pc("c2", "c^{2}", RED, L)]), row([pc("L2", "2", undefined, L), pc("La", "a", YELLOW, L), pc("Lb", "b", BLUE, L)], 0.1))])
const CANCEL = ["mT", ...tIds("T"), "pR", ...tIds("R")]

const PART_B: Beat[] = [
  watch("need-cos", "To find an angle, we need $\\cos C$ on its own.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => ruleLetters({ pulse: new Set(["Tcos", "TC"]) })
    look(S, [...QLOOK, "eq"])
  }, 2.2),
  watch("lots", "There's a lot here, so we move things across the $=$.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => ruleLetters()
    look(S, [...QLOOK, "eq"])
  }, 2.4),
  {
    id: "why-across",
    say: `Let's see why that works. Drag $+\\,${TERM_TEX}$ onto the $=$.`,
    enter: S => {
      cqBoard(S, Q3)
      const from: Record<string, Vec> = {}
      let stage = 0
      S.mode = "solve"
      S.chips = [{ id: "add-T", tex: `+\\,${TERM_TEX}`, kind: "mul", fac: { id: "T", tex: "", key: "T", v: 1 } }]
      S.onChip = (S2, _id, p) => {
        if (stage) return
        for (const id of ["pL", ...tIds("L"), "pR", ...tIds("R")]) from[id] = p
        stage = 1
        S2.chips = []
        S2.touched = { kind: "eq" }
        say(S2, "Both sides get it.", "calm", 600)
        later(S2, 1.6, S3 => { S3.got.add("both") })
      }
      S.eqFn = () => (stage ? bothSides({ from, fly: 1.1 }) : ruleLetters())
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: S => S.got.has("both"),
    advanceAfter: 800,
  },
  {
    id: "cancel-T",
    say: "These two cancel. Tap them.",
    enter: S => {
      cqBoard(S, Q3)
      const strike: Record<string, number> = {}
      let stage = 0
      S.mode = "tapEq"
      S.tapAtoms = [...CANCEL]
      S.onAtom = S2 => {
        if (stage) return
        stage = 1
        for (const id of CANCEL) strike[id] = S2.time
        S2.tapAtoms = []
        S2.touched = { kind: "eq" }
        later(S2, 0.9, S3 => { eqSlow(S3.eq, 1.2); stage = 2; later(S3, 1.4, S4 => { S4.got.add("gone") }) })
      }
      S.eqFn = () => (stage < 2 ? bothSides({ strike, pulse: stage ? undefined : new Set(CANCEL) }) : r2())
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("gone"),
    advanceAfter: 700,
  },
  watch("came-back", `It left the right side, and came back on the left as $+$.`, S => {
    cqBoard(S, Q3)
    S.eqFn = () => r2({ pulse: new Set(["pL", ...tIds("L")]) })
    look(S, [...QLOOK, "eq"])
  }, 2.6),
  watch("opposite", "Moving across the $=$ does the opposite.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => r2()
    look(S, [...QLOOK, "eq"])
  }, 2.0),
  watch("swaps", "$+$ and $-$ swap. $\\times$ and $\\div$ swap.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => r2()
    look(S, [...QLOOK, "eq"])
  }, 2.4),
  {
    id: "move-c2",
    say: "Now move $c^2$ across.",
    enter: S => {
      cqBoard(S, Q3)
      startCross(S, {
        ids: ["c2"], label: c(RED, "c^{2}"), from: "left",
        options: ["$-\\,c^2$", "$+\\,c^2$"], answer: 0,
        notes: { 1: "It was added on the left. Across, it's taken away." },
        ask: "What does $c^2$ become over there?",
        before: L => r2(L), after: () => r3(),
      })
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: crossDone,
    advanceAfter: 900,
  },
  {
    id: "multiplying",
    say: "What is multiplying $\\cos C$? Tap it.",
    enter: S => {
      cqBoard(S, Q3)
      let lit = false
      S.mode = "tapEq"
      S.tapAtoms = tIds("L")
      S.onAtom = (S2, id) => {
        if (lit) return
        if (id === "Lcos" || id === "LC") { say(S2, "That's $\\cos C$ itself. Tap what multiplies it.", "wrong", 3.4); return }
        lit = true
        S2.touched = { kind: "eq" }
        S2.flashGood = 0.6
        say(S2, "$2ab$ multiplies it.", "calm", 600)
        later(S2, 1.0, S3 => { S3.got.add("tap") })
      }
      S.eqFn = () => r3({ pulse: lit ? new Set(["L2", "La", "Lb"]) : undefined })
      look(S, [...QLOOK, "eq"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 800,
  },
  {
    id: "move-2ab",
    say: "Move $2ab$ across.",
    enter: S => {
      cqBoard(S, Q3)
      startCross(S, {
        ids: ["L2", "La", "Lb"], label: `2${c(YELLOW, "a")}${c(BLUE, "b")}`, from: "left",
        options: ["$\\div\\,2ab$", "$-\\,2ab$"], answer: 0,
        notes: { 1: "$2ab$ is multiplying. Across, it divides." },
        ask: "What does $2ab$ become over there?",
        before: L => r3(L), after: () => r4(),
      })
      look(S, [...QLOOK, "eq", "chips"])
    },
    done: crossDone,
    advanceAfter: 900,
  },
  watch("for-angle", "This is the cosine rule for an angle.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => r4()
    look(S, [...QLOOK, "eq"])
  }, 2.2),
  watch("taken-away", "The side across from $C$ is the one taken away.", S => {
    cqBoard(S, Q3)
    S.eqFn = () => r4({ pulse: new Set(["c2", "LC", "mC"]) })
    look(S, [...QLOOK, "eq"])
  }, 2.4),

  watch("t-back", "Let's go back to this one and find $\\theta$.", S => { cqBoard(S, Q3); look(S, QLOOK) }, 2.0),
  tapSideAcross("t-side", "Tap the side across from $\\theta$.", Q3),
  fillCos("t-fill", "Drag $\\theta$ and the side across from it into the rule.", Q3, ["ang", "sx"]),
  fillCos("t-fill-2", "Now drag in the two other sides.", Q3, ["s1", "s2"], false, ["ang", "sx"]),
  ...angleSteps("t", Q3),
  watch("u", "Here's one more. Two sides are $5$, and one is $9$.", S => { cqBoard(S, Q4); look(S, QLOOK) }, 2.2),
  tapSideAcross("u-side", "Tap the side across from $\\theta$.", Q4),
  fillCos("u-fill", "Fill the rule.", Q4, ALL),
  ...angleSteps("u", Q4, false, { negNote: "The top is negative." }),
  watch("obtuse", "A negative $\\cos$ gives an obtuse angle.", S => {
    cqBoard(S, Q4)
    S.angText.C = () => `${answerText(Q4)}^\\circ`
    S.glowAng = new Set(["C"])
    S.eqFn = () => row([pc("cos", "\\cos"), pc("angv", "\\theta", RED), op("eq", "="), pc("cv", "-0.62", CHALK)])
    look(S, [...QLOOK, "eq"])
  }, 2.4),
  watch("one-answer", "Your calculator gives it straight away. There's no second answer.", S => {
    cqBoard(S, Q4)
    S.angText.C = () => `${answerText(Q4)}^\\circ`
    look(S, QLOOK)
  }, 2.6),

  // ── 6. Sine rule or cosine rule? ──
  watch("use-sine", "If you know a full pair and one more thing, use the sine rule.", S => {
    pairBoardOnly(S, F1)
    S.glowSide = new Set(["B"])
    S.glowAng = new Set(["B"])
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.4),
  watch("use-cos", "If there's no full pair, use the cosine rule.", S => {
    pairBoardOnly(S, F2)
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs"])
  }, 2.4),
  pairBeat("which-1", "Is there a full pair? Tap it, or tap No pair.", F1, true),
  pairBeat("which-2", "Is there a full pair in this one?", F2, true),
  pairBeat("which-3", "Is there a full pair in this one?", F3, true),
  pairBeat("which-4", "Is there a full pair in this one?", F4, true),
]

/** A "which rule?" figure on its own (no tapping). */
function pairBoardOnly(S: Scene, F: Fig) {
  resetBeat(S)
  setTri(S, F.P)
  S.coloured = new Set(CORNERS)
  S.names = {}
  for (const k of CORNERS) { const s = F.side[k], a = F.ang[k]; if (s) S.sideText[k] = () => s; if (a) S.angText[k] = () => a }
  S.frameFn = () => figFrame(S)
}

// ── 7. Exam questions ────────────────────────────────────────────────────

/** Tap the triangle (inside a bigger figure) the question is about; then the rest of the figure goes faint. */
function tapTriangle(id: string, text: string, q: CRQ, wrong: string): Beat {
  return {
    id, say: text,
    enter: S => {
      cqBoard(S, q)
      S.regions = q.regions ?? null
      S.mode = "tapRegion"
      S.onRegion = (S2, r) => {
        if (S2.got.has("tap")) return
        if (r === q.region) {
          S2.got.add("tap"); S2.regionLit = r; S2.mode = "none"; S2.touched = { kind: "tri" }; S2.flashGood = 1; S2.note = null
          if (S2.extra) S2.extra = { ...S2.extra, quiet: true }
          return
        }
        say(S2, wrong, "wrong", 3.6)
      }
      look(S, QLOOK)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

const PART_C: Beat[] = [
  watch("ex1", "The diagram shows a triangular field $ABC$. $AB = 65\\text{ m}$, $AC = 75\\text{ m}$ and angle $CAB = 125^\\circ$.", S => { cqBoard(S, EX1, { hideX: true }); look(S, QLOOK) }, 3.0),
  watch("ex1-show", "Show that $BC = 124.3\\text{ m}$, correct to $1$ decimal place.", S => { cqBoard(S, EX1); S.pulseSide = new Set(["C"]); look(S, QLOOK) }, 2.4),
  tapAngleAcross("ex1-angle", "Tap the angle across from $BC$.", EX1),
  tapTwoSides("ex1-sides", "Tap the two sides that make it.", EX1),
  fillCos("ex1-fill", "Fill the rule.", EX1, ALL),
  ...sideSteps("ex1", EX1, "Work out the right side."),
  watch("ex1-shown", "$124.27$ is $124.3$ to $1$ decimal place. That shows it.", S => {
    cqBoard(S, EX1)
    S.sideText.C = () => "124.27\\text{ m}"
    S.eqFn = () => row([pc("x", "BC", RED), op("eq", "="), pc("ans", "124.27", GREEN), op("ap", "="), pc("r", "124.3\\text{ m}", GREEN)])
    look(S, [...QLOOK, "eq"])
  }, 2.6),

  watch("ex2", "The diagram shows a triangular field $ABC$. $AB = 150\\text{ m}$, $BC = 187\\text{ m}$ and angle $ABC = 112^\\circ$.", S => { cqBoard(S, EX2, { hideX: true }); look(S, QLOOK) }, 3.0),
  watch("ex2-rolls", "Fencing comes in rolls of $20\\text{ m}$. How many rolls go round the field?", S => { cqBoard(S, EX2, { hideX: true }); look(S, QLOOK) }, 2.6),
  watch("ex2-ac", "First we need $AC$.", S => { cqBoard(S, EX2); S.pulseSide = new Set(["C"]); look(S, QLOOK) }, 1.8),
  tapAngleAcross("ex2-angle", "Tap the angle across from $AC$.", EX2),
  tapTwoSides("ex2-sides", "Tap the two sides that make it.", EX2),
  fillCos("ex2-fill", "Fill the rule.", EX2, ALL),
  ...sideSteps("ex2", EX2, "Work out the right side."),
  {
    id: "ex2-perimeter",
    say: "Add the three sides to get the perimeter.",
    enter: S => {
      cqBoard(S, EX2)
      S.sideText.C = () => `${answerText(EX2)}\\text{ m}`
      setAns(answerOf(EX2))
      const per = 150 + 187 + answerOf(EX2)
      startInput(S, { answer: per, sf: 3, max: 24, typed: "150+187+a", slips: [{ v: 150 + 187, say: "Add $AC$ too: all three sides." }] })
      S.eqFn = S2 => row([pc("p1", "150", BLUE), op("pl", "+"), pc("p2", "187", YELLOW), op("pl2", "+"), pc("p3", "AC", RED), op("eq", "="), S2.input?.state === "right" ? pc("per", `${sigText(per, 4)}\\text{ m}`, GREEN) : boxNode(S2)])
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: [{ say: "Use Ans for $AC$, so no digits are lost.", tex: "150 + 187 + \\text{Ans}" }, { say: "That's the perimeter.", tex: `= ${c(GREEN, `${(150 + 187 + answerOf(EX2)).toFixed(2)}\\text{ m}`)}` }],
  },
  {
    id: "ex2-divide",
    say: "Each roll is $20\\text{ m}$. Divide by $20$.",
    enter: S => {
      cqBoard(S, EX2)
      S.sideText.C = () => `${answerText(EX2)}\\text{ m}`
      const per = 150 + 187 + answerOf(EX2)
      setAns(per)
      startInput(S, { answer: per / 20, sf: 3, max: 20, typed: "a/20", slips: [{ v: per * 20, say: "Divide by $20$, don't multiply." }] })
      S.eqFn = S2 => row([pc("per", `${per.toFixed(1)}\\ldots`, CHALK), op("dv", "\\div"), pc("twenty", "20"), op("eq", "="), S2.input?.state === "right" ? pc("rolls", (per / 20).toFixed(2), GREEN) : boxNode(S2)])
      look(S, [...QLOOK, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: [{ say: "Press Ans, $\\div$, $20$, then $=$.", tex: "\\text{Ans} \\div 20" }, { say: "That's how many rolls of $20$ m.", tex: `= ${c(GREEN, ((150 + 187 + answerOf(EX2)) / 20).toFixed(2))}` }],
  },
  {
    id: "ex2-buy",
    say: `That's $${((150 + 187 + answerOf(EX2)) / 20).toFixed(2)}$ rolls. How many do you buy?`,
    enter: S => {
      cqBoard(S, EX2)
      S.sideText.C = () => `${answerText(EX2)}\\text{ m}`
      choose(S, ["$30$", "$31$"], 1, false, (S2, _k, right) => {
        if (right) { S2.got.add("tap"); say(S2, "Yes. Round up, or the fence comes up short.", "calm", 600); return }
        say(S2, "$30$ rolls make only $600\\text{ m}$. The fence would be short.", "wrong", 4)
      })
      look(S, [...QLOOK, "chips"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 2000,
  },

  watch("ex3", "$ADB$ and $AEC$ are straight lines. $BC$ is parallel to $DE$.", S => { cqBoard(S, EX3, { hideX: true }); S.sideText.A = () => ""; S.sideText.B = () => ""; look(S, QLOOK) }, 2.6),
  watch("ex3-q", "From part (b), $AD = 3.6\\text{ cm}$ and $AE = 5.2\\text{ cm}$. Calculate angle $DAE$.", S => { cqBoard(S, EX3); look(S, QLOOK) }, 3.0),
  tapTriangle("ex3-tri", "Angle $DAE$ is in triangle $ADE$. Tap it.", EX3, "That's not $ADE$. Look for $D$, $A$ and $E$."),
  tapSideAcross("ex3-side", "Tap the side across from angle $DAE$.", EX3, true),
  fillCos("ex3-fill", "Fill the rule.", EX3, ALL, true),
  ...angleSteps("ex3", EX3, true),

  watch("ex4", "$ABCDE$ is the cross-section of a building. The lengths are in metres.", S => { cqBoard(S, EX4, { hideX: true }); look(S, QLOOK) }, 2.6),
  watch("ex4-q", "Calculate angle $EAB$.", S => { cqBoard(S, EX4); look(S, QLOOK) }, 1.8),
  tapTriangle("ex4-tri", "Tap the triangle that angle $EAB$ is in.", EX4, "Angle $EAB$ is at $A$. Find the triangle $E$, $A$, $B$."),
  tapSideAcross("ex4-side", "Tap the side across from angle $EAB$.", EX4, true),
  fillCos("ex4-fill", "Fill the rule.", EX4, ALL, true),
  ...angleSteps("ex4", EX4, true, { negNote: "The top is negative again." }),
  watch("ex4-obtuse", "It's obtuse, as the negative top told us.", S => {
    cqBoard(S, EX4, { quiet: true })
    S.angText.C = () => `${answerText(EX4)}^\\circ`
    S.glowAng = new Set(["C"])
    look(S, QLOOK)
  }, 2.0),

  watch("ex5", "$AB = 12\\text{ cm}$, $BD = 7\\text{ cm}$ and $AD = 6\\text{ cm}$. Angle $DAC = 32^\\circ$ and angle $BCA = 48^\\circ$.", S => { cqBoard(S, EX5, { hideX: true }); look(S, QLOOK) }, 3.2),
  watch("ex5-a", "First, calculate angle $BAD$.", S => { cqBoard(S, EX5); look(S, QLOOK) }, 1.8),
  tapTriangle("ex5-tri", "Angle $BAD$ is in triangle $ABD$. Tap it.", EX5, "That's not $ABD$. Look for $A$, $B$ and $D$."),
  tapSideAcross("ex5-side", "Tap the side across from angle $BAD$.", EX5, true),
  fillCos("ex5-fill", "Fill the rule.", EX5, ALL, true),
  ...angleSteps("ex5", EX5, true),
  watch("ex5-b", "Now calculate $AC$.", S => { ex5bBoard(S); S.pulseSide = new Set(["B"]); look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"]) }, 1.8),
  {
    id: "ex5-bac",
    say: "What is angle $BAC$?",
    enter: S => {
      ex5bBoard(S)
      // the two parts of angle BAC, on the figure: the student puts them together
      S.arcsOnly = ["C"]
      S.extra = { ...S.extra!, quiet: false, arcs: [{ at: "A", a: "B", b: "Dp", tex: "24.5^\\circ", pulse: true, far: true }, { at: "A", a: "Dp", b: "C", tex: "32^\\circ", pulse: true }] }
      // the 24.5° goes far out in its narrow wedge, where D's letter would be
      S.letterDir = { Dp: [0.9, 0.45] }
      startInput(S, {
        answer: 56.5, dp: 1, max: 12, typed: "24.5+32",
        slips: [
          { v: 24.5, say: "That's angle $BAD$. Angle $BAC$ goes all the way round to $AC$." },
          { v: 32, say: "That's angle $DAC$. Angle $BAC$ goes all the way round to $AB$." },
          { v: 7.5, say: "Angle $BAC$ is both parts together." },
        ],
        onRight: S2 => { S2.flashGood = 1 },
      })
      S.eqFn = S2 => row([pc("n", "\\angle BAC"), op("eq", "="), S2.input?.state === "right" ? pc("ans", "56.5^\\circ", GREEN) : boxNode(S2)])
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1700,
    walk: [{ say: "Angle $BAC$ is made of two parts. Add them.", tex: "24.5^\\circ + 32^\\circ" }, { say: "That gives angle $BAC$.", tex: `= ${c(GREEN, "56.5^\\circ")}` }],
  },
  {
    id: "ex5-abc",
    say: "What is angle $ABC$?",
    enter: S => {
      ex5bBoard(S, { bac: true })
      S.angText.B = () => "?"
      S.pulseAng = new Set(["B"])
      startInput(S, {
        answer: 75.5, dp: 1, max: 14, typed: "180-56.5-48",
        slips: [
          { v: 180 - 56.5, say: "Take $48^\\circ$ away too." },
          { v: 180 - 48, say: "Take $56.5^\\circ$ away too." },
          { v: 56.5 + 48, say: "That's the two angles added. Take them away from $180^\\circ$." },
        ],
        onRight: S2 => { S2.angText.B = () => "75.5^\\circ"; S2.pulseAng = new Set(); S2.touched = { kind: "angle", c: "B" }; S2.flashGood = 1 },
      })
      S.eqFn = S2 => row([pc("n", "\\angle ABC"), op("eq", "="), S2.input?.state === "right" ? pc("ans", "75.5^\\circ", GREEN) : boxNode(S2)])
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1700,
    walk: [{ say: "The three angles add up to $180^\\circ$.", tex: "180 - 56.5 - 48" }, { say: "That gives angle $ABC$.", tex: `= ${c(GREEN, "75.5^\\circ")}` }],
  },
  pairBeatOn("ex5-pair", "Is there a full pair in triangle $ABC$? Tap it."),
  {
    id: "ex5-fill-sine",
    say: "Fill the sine rule.",
    enter: S => {
      ex5bBoard(S, { bac: true, abc: true })
      startFill(S, EX5B, "both", { "side-B": "AC", "ang-B": "75.5^\\circ", "side-C": "12", "ang-C": "48^\\circ", "ang-A": "56.5^\\circ" })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq"])
    },
    done: S => filledHalf(S, "both"),
    advanceAfter: 1400,
  },
  {
    id: "ex5-move",
    say: "Move $\\sin 75.5^\\circ$ across the $=$.",
    enter: S => {
      ex5bBoard(S, { bac: true, abc: true })
      const e = filledEqn(EX5B)
      const sinB = sinFac(EX5B, "B")
      startCross(S, {
        ids: ["fn-B", "ang-B"], label: `\\sin ${c(BLUE, "75.5^\\circ")}`, from: "left",
        options: ["$\\times \\sin 75.5^\\circ$", "$\\div \\sin 75.5^\\circ$"], answer: 0,
        notes: { 1: "It was dividing $AC$. Across, it multiplies." },
        ask: "What does it become over there?",
        before: L => eqnNode(e, { pulse: L.pulse, grab: L.grab }),
        after: () => eqnNode({ L: { num: [sideFac(EX5B, "B")], den: [] }, R: numbersFirst({ num: [sideFac(EX5B, "C"), sinB], den: [sinFac(EX5B, "C")] }) }),
      })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "chips"])
    },
    done: crossDone,
    advanceAfter: 900,
  },
  {
    id: "ex5-calc",
    say: "Work it out.",
    enter: S => {
      ex5bBoard(S, { bac: true, abc: true })
      S.alg = { L: { num: [sideFac(EX5B, "B")], den: [] }, R: numbersFirst({ num: [sideFac(EX5B, "C"), sinFac(EX5B, "B")], den: [sinFac(EX5B, "C")] }) }
      askSide(S, EX5B, S2 => { S2.sideText.B = () => "15.6\\text{ cm}"; S2.touched = { kind: "side", c: "B" }; S2.flashGood = 1.2 })
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra", "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: sideWalk(EX5B),
  },
  watch("two-rules", "That question needed both rules. Look for a full pair each time.", S => {
    ex5bBoard(S, { bac: true, abc: true })
    S.sideText.B = () => "15.6\\text{ cm}"
    look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"])
  }, 2.4),

  // ── 8. The end ──
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      squaresBoard(S, 75, { squares: true })
      turnB(S)
      S.eqFn = S2 => row([pc("c2", "c^{2}", RED), op("eq", "="), pc("a2", "3^{2}", YELLOW), op("pl", "+"), pc("b2", "4^{2}", BLUE), op("mi", "-"), pc("two", "2 \\times 3 \\times 4"), pc("tcos", "\\cos"), pc("tC", `${shownC(S2)}^\\circ`, RED), op("eq2", "="), pc("res", c2Text(S2), RED)])
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "squares", "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

/** Is there a full pair in the exam's triangle ABC (part (b))? Tap its side and its angle, either order. */
function pairBeatOn(id: string, text: string): Beat {
  return {
    id, say: text,
    enter: S => {
      ex5bBoard(S, { bac: true, abc: true })
      S.mode = "tapPair"
      const done = (S2: Scene) => { if (S2.got.has("side") && S2.got.has("ang")) { S2.got.add("tap"); S2.flashGood = 1; say(S2, "There's a full pair, so it's the sine rule.", "calm", 600) } else say(S2, S2.got.has("side") ? "Now tap the angle across from it." : "Now tap the side across from it.", "calm", 600) }
      S.onSide = (S2, sd) => {
        if (S2.got.has("tap") || S2.got.has("side")) return
        if (sd === "C") { S2.got.add("side"); S2.glowSide = new Set(["C"]); S2.touched = { kind: "side", c: "C" }; done(S2); return }
        say(S2, sd === "B" ? "That's $AC$. We don't know it." : "We don't know that side.", "wrong", 3.4)
      }
      S.onAngle = (S2, a) => {
        if (S2.got.has("tap") || S2.got.has("ang")) return
        if (a === "C") { S2.got.add("ang"); S2.glowAng = new Set(["C"]); S2.touched = { kind: "angle", c: "C" }; done(S2); return }
        say(S2, a === "B" ? "We know $75.5^\\circ$, but not the side across from it." : "We know $56.5^\\circ$, but not the side across from it.", "wrong", 3.8)
      }
      look(S, ["tri", "fill", "arcs", "angLabs", "sideLabs", "letters", "extra"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 2000,
  }
}

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C]

const PARTS: [string, string][] = [
  ["open", "When the sine rule can't help"],
  ["right", "Back to Pythagoras"],
  ["gap", "The gap"],
  ["x-back", "Finding a side"],
  ["need-cos", "Finding an angle"],
  ["use-sine", "Sine rule or cosine rule?"],
  ["ex1", "Exam questions"],
]
applyParts(BEATS, PARTS)

