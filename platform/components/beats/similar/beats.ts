/**
 * Similar shapes (4.4, lesson 1 of 2), one tiny idea per beat.
 *
 * The student grows a triangle and watches its angles stay put while every
 * side is multiplied by the same number (the scale factor); stretches it one
 * way to see that is not similar; sees congruent as the same size. Then the
 * scale factor from a matching pair of sides, and a length from it; a turned
 * triangle turned back to line up its matching corners; the order of the
 * letters; showing two triangles are similar from their angles (a common
 * angle, corresponding angles with an F, vertically opposite, alternate with
 * a Z). Exam questions: 4024/12/O/N/25 Q17(a), 4024/11/O/N/22 Q15(a),
 * 4024/22/O/N/24 Q8(a)(b), 4024/21/M/J/24 Q3(b), 4024/12/M/J/24 Q15.
 *
 * Colours: the pair of sides that gives the scale factor is blue, the pair
 * that gives the length is orange, an unknown pink, what can be dragged or
 * tapped yellow, a right answer green.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { op, row, atom, frac, type ENode } from "../equation"
import {
  type Scene, type VisKey, type Shape, type Pose, type Mark, type SideLab, BLUE, ORANGE, PINK, GREEN, CHALK,
  pose, setShapes, resetBeat, show, later, say, startInput, boxNode, choose, shapeOf, angleAt, sideLen, numText, sideKey, at,
} from "./scene"

export type Beat = BeatOf<Scene>
const RAD = Math.PI / 180

const LOOK: VisKey[] = ["board", "shapes", "letters", "marks", "sides", "lines"]
export const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
export const watch = (id: string, say0: string, enter: (S: Scene) => void, after = 2.0): Beat => ({ id, say: say0, enter, cta: "", ctaAfter: after })
const inputRight = (S: Scene) => S.input?.state === "right"
/** A point at a distance and direction (degrees from the x axis, anticlockwise). */
export const dirP = (d: number, deg: number): Vec => [d * Math.cos(deg * RAD), d * Math.sin(deg * RAD)]
export const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
/** A phone held upright: two shapes go one above the other, and a long figure stands up. */
export const tall = (S: Scene) => S.h > S.w * 1.25
/** The world box round every shape where it is going, with a margin. */
function boxOfShapes(S: Scene, m: number) {
  const P = S.shapes.flatMap(sh => sh.order.map(n => at(sh, n, false)))
  const xs = P.map(p => p[0]), ys = P.map(p => p[1])
  return { x0: Math.min(...xs) - m, y0: Math.min(...ys) - m, x1: Math.max(...xs) + m, y1: Math.max(...ys) + m }
}

export type ShapeSpec = Omit<Shape, "D"> & { from?: Pose }
export const tri = (id: string, pts: Record<string, Vec>, order: string[], names: Record<string, string>, p: Partial<Pose> = {}, more: Partial<ShapeSpec> = {}): ShapeSpec =>
  ({ id, pts, order, names, pose: pose(p), ...more })

// ── the beat makers ──────────────────────────────────────────────────────

/** A unit after a number: "cm", or "cm^2" for square centimetres. */
const unitTex = (u: string) => { const m = /^(.*)\^(\d)$/.exec(u); return m ? `\\text{ ${m[1]}}^${m[2]}` : `\\text{ ${u}}` }
/** How many decimal places a number has (2.25 has 2). */
const placesOf = (x: number) => (String(+x.toFixed(6)).split(".")[1] ?? "").length

/** A number typed: the equation is "lead = □", with the step just made above it. */
export function askNum(id: string, text: string, board: (S: Scene) => void, o: {
  lead: string
  answer: number
  unit?: string
  dp?: number
  sf?: number
  /** how the answer is written once it is right (else the number) */
  shownTex?: string
  /** a way to type it on the keypad (for the play tests), when it is not the number itself */
  typed?: string
  keys?: string[][]
  slips?: { v: number; say: string }[]
  walk: WalkStep<Scene>[]
  above?: () => ENode
  then?: (S: Scene) => void
  rightNote?: string
  after?: number
}): Beat {
  const shown = numText(o.answer, 2)
  const written = o.shownTex ?? shown
  return {
    id, say: text,
    enter: S => {
      board(S)
      if (o.keys) S.keyRows = o.keys
      startInput(S, {
        // an exact answer needs all its decimal places: with none asked for, the judge takes anything within 0.5
        answer: o.answer, dp: o.dp ?? (o.sf ? undefined : placesOf(o.answer)), sf: o.sf, slips: o.slips, typed: o.typed ?? shown,
        onRight: S2 => { o.then?.(S2); if (o.rightNote) later(S2, 0.6, S3 => { if (!S3.note) say(S3, o.rightNote!, "calm", 600) }) },
      })
      const unit = o.unit ? [atom("u", unitTex(o.unit))] : []
      S.eqFn = S2 => {
        const done = S2.input?.state === "right"
        const line = row([atom("lead", o.lead), op("eq", "="), done ? atom("ans", `${written}${o.unit ? unitTex(o.unit) : ""}`, { col: GREEN }) : boxNode(S2), ...(done ? [] : unit)])
        return o.above ? frac("work", o.above(), line, "rgba(0,0,0,0)") : line
      }
      look(S, ["eq", "keypad", ...(S.bars ? (["bars"] as VisKey[]) : [])])
    },
    done: inputRight,
    advanceAfter: o.after ?? 2200,
    walk: o.walk,
  }
}

/** Tap sides: all of `want` in any order; any other side gets its note (or the general one). */
export function tapSides(id: string, text: string, board: (S: Scene) => void, o: {
  want: string[]
  among: string[]
  col: string
  notes?: Record<string, string>
  wrong: string
}): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.mode = "tapSide"
      S.tapSides = o.among
      S.onSide = (S2, key) => {
        if (S2.got.has("done")) return
        if (o.want.includes(key)) {
          const [sh, ab] = key.split(":")
          S2.sideCol[sideKey(sh, ab[0], ab[1])] = o.col
          S2.got.add(key)
          S2.note = null
          S2.flashGood = 0.6
          if (o.want.every(k => S2.got.has(k))) S2.got.add("done")
          else say(S2, "Now tap the other one.", "calm", 600)
          return
        }
        say(S2, o.notes?.[key] ?? o.wrong, "wrong", 3.8)
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1500,
  }
}

/** Tap an angle; the others get their own notes. */
export function tapAngle(id: string, text: string, board: (S: Scene) => void, o: { want: string; among: string[]; notes?: Record<string, string>; wrong: string; then?: (S: Scene) => void }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.mode = "tapAngle"
      S.tapAngles = o.among
      S.onAngle = (S2, key) => {
        if (S2.got.has("done")) return
        if (key === o.want) { S2.got.add("done"); S2.note = null; S2.flashGood = 0.8; o.then?.(S2); return }
        say(S2, o.notes?.[key] ?? o.wrong, "wrong", 3.8)
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1600,
  }
}

/** Pick one of a few words; wrong picks get their own notes. */
export function pickBeat(id: string, text: string, board: (S: Scene) => void, o: { options: string[]; answer: number; notes: Record<number, string>; right: string; then?: (S: Scene) => void }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      choose(S, o.options, o.answer, false, (S2, k, right) => {
        if (right) { S2.got.add("done"); say(S2, o.right, "calm", 600); o.then?.(S2); return }
        say(S2, o.notes[k] ?? "Look again.", "wrong", 4)
      })
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2000,
  }
}

// ── 1. Same shape, different size ────────────────────────────────────────

/** The first triangle: sides 4, 6 and 7, its pivot at the bottom-left corner. */
const T_PTS: Record<string, Vec> = (() => {
  const cx = (49 + 36 - 16) / 14
  return { A: [0, 0], B: [7, 0], C: [cx, Math.sqrt(36 - cx * cx)] }
})()
const T_ORDER = ["A", "B", "C"]
/** On an upright phone the triangle stands point up (A at the top), so it can grow downwards. */
const tRot = (S: Scene) => (tall(S) ? -107.4 : 0)

/** The triangle's sides and angles, written from its shape as it is now. */
function liveLabels(S: Scene, id: string, tag?: (S: Scene) => string | undefined) {
  const sh = shapeOf(S, id)
  if (!sh) return
  const t = tag?.(S)
  S.sideLabs = [["A", "B"], ["B", "C"], ["C", "A"]].map(([a, b]) => ({ sh: id, a, b, tex: numText(sideLen(sh, a, b, false), 1), tag: t }))
  S.marks = T_ORDER.map((n, i) => ({ sh: id, at: n, count: i + 1, tex: `${Math.round(angleAt(sh, n, false))}^\\circ`, pulse: S.vals.pulseAngles === 1 }))
}

/** Both triangles' sides and angles: the first as it was, the copy with its tag. */
function liveBoth(S: Scene, tag?: string, pulse = false) {
  liveLabels(S, "T", tag ? () => tag : undefined)
  const sides = S.sideLabs, marks = S.marks
  liveLabels(S, "T0")
  S.sideLabs = [...S.sideLabs, ...sides]
  S.marks = [...S.marks, ...marks].map(m => ({ ...m, pulse: pulse || m.pulse }))
}
/** The first triangle and its copy side by side. */
function pairBoard(S: Scene, k: number, tag?: string, pulse = false) {
  resetBeat(S)
  const rot = tRot(S)
  setShapes(S, tall(S)
    ? [tri("T0", T_PTS, T_ORDER, {}, { rot }), tri("T", T_PTS, T_ORDER, {}, { y: -8.9, k, rot })]
    : [tri("T0", T_PTS, T_ORDER, {}, { x: -1 }), tri("T", T_PTS, T_ORDER, {}, { x: 8.2, k })])
  S.tick = S2 => liveBoth(S2, tag, pulse)
  S.tick(S)
}

/** The first triangle at a scale factor (and stretch), its labels live. */
function triBoard(S: Scene, o: { k?: number; sx?: number; handle?: "scale" | "stretch"; snap?: number[]; ghost?: boolean } = {}) {
  resetBeat(S)
  const rot = tRot(S)
  // the room it needs at its biggest
  const big = { id: "", pts: T_PTS, order: T_ORDER, names: {}, pose: pose({ k: 2.25, rot }), D: pose({ k: 2.25, rot }) }
  const P = T_ORDER.map(n => at(big, n, false))
  const room = { x0: Math.min(...P.map(p => p[0])), y0: Math.min(...P.map(p => p[1])), x1: Math.max(...P.map(p => p[0])) + 0.6, y1: Math.max(...P.map(p => p[1])) + 0.6 }
  const shapes: ShapeSpec[] = []
  if (o.ghost) shapes.push(tri("T0", T_PTS, T_ORDER, {}, { rot }, { ghost: true }))
  shapes.push(tri("T", T_PTS, T_ORDER, {}, { k: o.k ?? 1, sx: o.sx ?? 1, rot }))
  setShapes(S, shapes)
  S.frame = { x0: Math.min(room.x0, 0) - 0.6, y0: Math.min(room.y0, 0) - 0.6, x1: room.x1, y1: room.y1 }
  if (o.handle === "scale") S.handles = [{ id: "grow", sh: "T", at: "C", kind: "scale", snap: o.snap, min: 0.7, max: 2.25, lock: !!o.snap }]
  if (o.handle === "stretch") S.handles = [{ id: "stretch", sh: "T", at: "B", kind: "stretch", min: 0.6, max: 2.2 }]
  const tag = (S2: Scene) => {
    const sh = shapeOf(S2, "T")!
    return S2.vals.tags && Math.abs(sh.pose.sx - 1) < 1e-6 ? `\\times ${numText(sh.pose.k, 1)}` : undefined
  }
  S.tick = S2 => liveLabels(S2, "T", tag)
  liveLabels(S, "T", tag)
}

/** How far the triangle has been grown or stretched this beat (its biggest change). */
function trackChange(S: Scene, what: "k" | "sx") {
  const sh = shapeOf(S, "T")!
  const start = sh.pose[what]
  const before = S.tick
  S.tick = S2 => { before?.(S2); const now = shapeOf(S2, "T")!.pose[what]; if (Math.abs(now - start) > 0.35) S2.got.add("played") }
}

const PART_1: Beat[] = [
  watch("tri", "Here is a triangle.", S => { triBoard(S); look(S) }, 1.8),
  {
    id: "grow",
    say: "Drag the corner to make it bigger.",
    enter: S => { triBoard(S, { handle: "scale" }); trackChange(S, "k"); look(S) },
    done: S => S.got.has("played"), free: true, minPlay: 4,
  },
  pickBeat("angles", "What happens to its angles as it grows?", S => { triBoard(S, { k: shapeOf(S, "T")?.pose.k, handle: "scale" }) }, {
    options: ["They get bigger", "They stay the same", "They get smaller"], answer: 1,
    notes: { 0: "Drag it and watch the three angles.", 2: "Drag it and watch the three angles." },
    right: "Yes. They don't change at all.",
  }),
  watch("stay", "The angles stay the same. Only the sides change.", S => {
    triBoard(S, { k: shapeOf(S, "T")?.pose.k, handle: "scale" })
    S.vals.pulseAngles = 1
    look(S)
  }, 2.6),
  {
    id: "make-2",
    say: "Make it $2$ times as big.",
    enter: S => {
      triBoard(S, { k: shapeOf(S, "T")?.pose.k, handle: "scale", snap: [2], ghost: true })
      const before = S.tick
      S.tick = S2 => { before?.(S2); if (S2.locked.has("grow")) S2.vals.tags = 1 }
      look(S)
    },
    done: S => S.locked.has("grow") && S.drag === null,
    advanceAfter: 1600,
  },
  watch("times", "Every side was multiplied by $2$.", S => { triBoard(S, { k: 2, ghost: true }); S.vals.tags = 1; look(S) }, 2.4),
  watch("sf", "That number is the *scale factor*.", S => { triBoard(S, { k: 2, ghost: true }); S.vals.tags = 1; look(S) }, 2.0),
  {
    id: "make-15",
    say: "Now make it $1.5$ times as big.",
    enter: S => {
      triBoard(S, { k: 2, handle: "scale", snap: [1.5], ghost: true })
      const before = S.tick
      S.tick = S2 => { before?.(S2); S2.vals.tags = S2.locked.has("grow") ? 1 : 0 }
      look(S)
    },
    done: S => S.locked.has("grow") && S.drag === null,
    advanceAfter: 1600,
  },
  watch("similar", "Shapes like these are *similar*.", S => { pairBoard(S, 1.5); look(S) }, 2.2),
  watch("same-ang", "They have the same angles.", S => { pairBoard(S, 1.5, undefined, true); look(S) }, 2.2),
  watch("same-k", "And every side is multiplied by the same scale factor, $1.5$.", S => { pairBoard(S, 1.5, "\\times 1.5"); look(S) }, 2.6),
  {
    id: "stretch",
    say: "Now stretch it one way only.",
    enter: S => { triBoard(S, { handle: "stretch", ghost: true }); trackChange(S, "sx"); look(S) },
    done: S => S.got.has("played"), free: true, minPlay: 4,
  },
  pickBeat("still", "Is it still similar to the first triangle?", S => {
    const sx = shapeOf(S, "T")?.pose.sx ?? 1.6
    triBoard(S, { sx: Math.abs(sx - 1) > 0.2 ? sx : 1.6, handle: "stretch", ghost: true })
  }, {
    options: ["Yes", "No"], answer: 1,
    notes: { 0: "Look at its angles. Are they still the same?" },
    right: "Right. Its angles changed, so it is not similar.",
  }),
  {
    id: "congruent",
    say: "This copy is the same shape and the same size. It is *congruent*.",
    enter: S => {
      resetBeat(S)
      // a copy, turned and moved away, comes back to land exactly on the triangle
      const rot = tRot(S)
      setShapes(S, [tri("T", T_PTS, T_ORDER, {}, { rot }), tri("Tc", T_PTS, T_ORDER, {}, tall(S) ? { x: 3, y: -9, rot: rot + 150 } : { x: 13, y: 4, rot: 150 })])
      S.frame = boxOfShapes(S, 0.8)
      S.tick = copyLabels
      S.tick(S)
      S.acts.push(
        { dur: 1.6 },
        { dur: 0.1, end: S2 => { shapeOf(S2, "Tc")!.pose = pose({ rot }) } },
        { dur: 2.2, end: S2 => { S2.flashGood = 1; S2.touched = "T"; S2.frame = null } },
      )
      look(S)
    },
    cta: "", ctaAfter: 4.2,
  },
  watch("cong-1", "Congruent shapes are similar, with a scale factor of $1$.", S => {
    resetBeat(S)
    const rot = tRot(S)
    setShapes(S, [tri("T", T_PTS, T_ORDER, {}, { rot }), tri("Tc", T_PTS, T_ORDER, {}, { rot })])
    S.tick = S2 => liveLabels(S2, "T")
    S.tick(S)
    look(S)
  }, 2.4),
]

/** The triangle's labels and its copy's, as each is now (once the copy has landed on it, one set). */
function copyLabels(S: Scene) {
  const a = shapeOf(S, "T")!.D, b = shapeOf(S, "Tc")!.D
  const landed = Math.hypot(a.x - b.x, a.y - b.y) < 0.15 && Math.abs(((a.rot - b.rot) % 360 + 540) % 360 - 180) < 2
  liveLabels(S, "Tc")
  const sides = landed ? [] : S.sideLabs, marks = landed ? [] : S.marks
  liveLabels(S, "T")
  S.sideLabs = [...S.sideLabs, ...sides]
  S.marks = [...S.marks, ...marks]
}

// ── 2. Using the scale factor: 4024/12/O/N/25 Q17(a) ─────────────────────

/** ABC: AB = 6, AC = 7, angle A 50°; PQR is it times 1.5. */
export const W25: Record<string, Vec> = { A: [0, 0], B: dirP(6, 44), C: dirP(7, -6) }
export const W25_ORDER = ["A", "B", "C"]
export function w25Board(S: Scene, o: { k?: boolean; pr?: string; col1?: boolean; col2?: boolean; pulse?: 0 | 1 | 2 } = {}) {
  resetBeat(S)
  setShapes(S, [
    tri("ABC", W25, W25_ORDER, { A: "A", B: "B", C: "C" }),
    tri("PQR", W25, W25_ORDER, { A: "P", B: "Q", C: "R" }, tall(S) ? { y: -9.2, k: 1.5 } : { x: 9.5, y: -0.6, k: 1.5 }),
  ])
  S.marks = [
    { sh: "ABC", at: "A", count: 1, pulse: o.pulse === 1 }, { sh: "PQR", at: "A", count: 1, pulse: o.pulse === 1 },
    { sh: "ABC", at: "B", count: 2, pulse: o.pulse === 2 }, { sh: "PQR", at: "B", count: 2, pulse: o.pulse === 2 },
  ]
  const labs: SideLab[] = [
    { sh: "ABC", a: "A", b: "B", tex: "6\\text{ cm}" }, { sh: "ABC", a: "A", b: "C", tex: "7\\text{ cm}" },
    { sh: "PQR", a: "A", b: "B", tex: "9\\text{ cm}" },
  ]
  if (o.pr) labs.push({ sh: "PQR", a: "A", b: "C", tex: o.pr, col: o.pr === "?" ? PINK : GREEN, pulse: o.pr === "?" })
  S.sideLabs = labs
  if (o.col1) { S.sideCol[sideKey("ABC", "A", "B")] = BLUE; S.sideCol[sideKey("PQR", "A", "B")] = BLUE }
  if (o.col2) { S.sideCol[sideKey("ABC", "A", "C")] = ORANGE; S.sideCol[sideKey("PQR", "A", "C")] = ORANGE }
}
const W25_SIDES = ["ABC:AB", "ABC:BC", "ABC:CA", "PQR:AB", "PQR:BC", "PQR:CA"]

const PART_2: Beat[] = [
  watch("w25", "Triangle $ABC$ is similar to triangle $PQR$.", S => { w25Board(S); look(S) }, 2.2),
  {
    id: "w25-marks",
    say: "Matching angles have the same mark.",
    enter: S => {
      w25Board(S, { pulse: 1 })
      later(S, 1.8, S2 => { S2.marks = S2.marks.map(m => ({ ...m, pulse: m.count === 2 })) })
      look(S)
    },
    cta: "", ctaAfter: 3.4,
  },
  tapSides("w25-ab", "$AB$ and $PQ$ match. Tap them.", S => w25Board(S), {
    want: ["ABC:AB", "PQR:AB"], among: W25_SIDES, col: BLUE,
    wrong: "That isn't $AB$ or $PQ$. $AB$ goes from $A$ to $B$.",
  }),
  watch("w25-rule", "To find the scale factor, divide the big side by the small side.", S => {
    w25Board(S, { col1: true })
    S.eqFn = () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), frac("sff", atom("big", "\\text{big side}", { col: BLUE }), atom("small", "\\text{small side}", { col: BLUE }))])
    look(S, ["eq"])
  }, 3.0),
  askNum("w25-k", "What is the scale factor from $ABC$ to $PQR$?", S => w25Board(S, { col1: true }), {
    lead: "\\text{Scale factor}", answer: 1.5,
    slips: [
      { v: 3, say: "That's $9 - 6$. The scale factor multiplies: how many times bigger is $9$ than $6$?" },
      { v: 54, say: "That's $6 \\times 9$. How many times bigger is $9$ than $6$?" },
      { v: 0.67, say: "That's $6 \\div 9$, from the big triangle to the small one. We go from small to big." },
    ],
    walk: [
      { say: "$AB$ on the small triangle matches $PQ$ on the big one.", tex: "6 \\to 9", show: S => { S.sideLabs = S.sideLabs.map(l => (l.a === "A" && l.b === "B" ? { ...l, pulse: true } : l)) } },
      { say: "How many times bigger is it? Divide the big side by the small side.", tex: "9 \\div 6" },
    ],
  }),
  tapSides("w25-ac", "Which side of $PQR$ matches $AC$? Tap it.", S => { w25Board(S, { col1: true }); S.sideCol[sideKey("ABC", "A", "C")] = ORANGE }, {
    want: ["PQR:CA"], among: ["PQR:AB", "PQR:BC", "PQR:CA"], col: ORANGE,
    notes: { "PQR:AB": "$PQ$ already matches $AB$.", "PQR:BC": "Match the corners: $A$ goes with $P$, and $C$ goes with $R$." },
    wrong: "Match the corners: $A$ goes with $P$, and $C$ goes with $R$.",
  }),
  askNum("w25-pr", "So what is $PR$?", S => w25Board(S, { col1: true, col2: true, pr: "?" }), {
    lead: "PR", answer: 10.5, unit: "cm",
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "1.5")]),
    slips: [
      { v: 8.5, say: "That's $7 + 1.5$. The scale factor multiplies." },
      { v: 4.67, say: "That's $7 \\div 1.5$. $PR$ is on the big triangle, so multiply." },
    ],
    walk: [
      { say: "$PR$ matches $AC$, which is $7$ cm.", tex: "7 \\to PR", show: S => { S.sideLabs = S.sideLabs.map(l => (l.a === "A" && l.b === "C" ? { ...l, pulse: true } : l)) } },
      { say: "Every side of the big triangle is $1.5$ times its matching side.", tex: "7 \\times 1.5" },
    ],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "PQR" && l.a === "A" && l.b === "C" ? { ...l, tex: "10.5\\text{ cm}", col: GREEN, pulse: false } : l)) },
  }),
  watch("w25-steps", "Here are the steps.", S => {
    w25Board(S, { col1: true, col2: true, pr: "10.5\\text{ cm}" })
    S.eqFn = () => atom("steps", STEPS)
    look(S, ["eq"])
  }, 4.5),
]

/** The steps, numbered in the colours of the two pairs of sides. */
const STEPS = [
  "\\begin{array}{rl}",
  `${c(BLUE, "1")} & \\text{Find two matching sides you know.} \\\\`,
  `${c(BLUE, "2")} & \\text{Scale factor} = \\text{big side} \\div \\text{small side} \\\\`,
  `${c(ORANGE, "3")} & \\text{Find the side that matches the one you want.} \\\\`,
  `${c(ORANGE, "4")} & \\text{Multiply it by the scale factor.}`,
  "\\end{array}",
].join(" ")

// ── 3. When one triangle is turned: 4024/11/O/N/22 Q15(a) ────────────────

/** ABC: AB = 12, BC = 27, AC = 28, C at the crossing; DEC is it turned half a turn about C, times a quarter. */
const W22_B: Vec = (() => { const bx = (144 - 729 + 784) / 56; return [-28 + bx, Math.sqrt(144 - bx * bx)] })()
const W22: Record<string, Vec> = { A: [-28, 0], B: W22_B, C: [0, 0] }
const W22_ORDER = ["A", "B", "C"]
/** On an upright phone the long figure stands up. */
const w22Rot = (S: Scene) => (tall(S) ? -65 : 0)
export function w22Board(S: Scene, o: { turned?: boolean; col1?: boolean; col2?: boolean; ac?: string; pulse?: boolean; handle?: boolean } = {}) {
  resetBeat(S)
  // DEC has ABC's shape: D where A is, E where B is, a quarter of the size, turned half a turn
  const R = w22Rot(S)
  setShapes(S, [
    tri("ABC", W22, W22_ORDER, { A: "A", B: "B", C: "C" }, { rot: R }),
    tri("DEC", W22, W22_ORDER, { A: "D", B: "E", C: "" }, { k: 0.25, rot: o.turned ? R : 180 + R }),
  ])
  S.marks = [
    { sh: "ABC", at: "A", count: 2, pulse: o.pulse }, { sh: "DEC", at: "A", count: 2, pulse: o.pulse },
    { sh: "ABC", at: "B", count: 1, pulse: o.pulse }, { sh: "DEC", at: "B", count: 1, pulse: o.pulse },
  ]
  const labs: SideLab[] = [
    { sh: "ABC", a: "A", b: "B", tex: "12" }, { sh: "ABC", a: "B", b: "C", tex: "27" },
    { sh: "DEC", a: "C", b: "A", tex: "7" }, { sh: "DEC", a: "A", b: "B", tex: "3" },
  ]
  if (o.ac) labs.push({ sh: "ABC", a: "C", b: "A", tex: o.ac, col: o.ac === "?" ? PINK : GREEN, pulse: o.ac === "?" })
  S.sideLabs = labs
  if (o.col1) { S.sideCol[sideKey("ABC", "A", "B")] = BLUE; S.sideCol[sideKey("DEC", "A", "B")] = BLUE }
  if (o.col2) { S.sideCol[sideKey("ABC", "C", "A")] = ORANGE; S.sideCol[sideKey("DEC", "C", "A")] = ORANGE }
  if (o.handle) S.handles = [{ id: "turn", sh: "DEC", at: "A", kind: "turn", snap: [(R + 360) % 360], lock: true }]
}

const PART_3: Beat[] = [
  watch("w22", "Triangle $ABC$ is similar to triangle $DEC$.", S => { w22Board(S); look(S) }, 2.2),
  {
    id: "w22-turn",
    say: "The small one is upside down. Turn it to sit like the big one.",
    enter: S => { w22Board(S, { handle: true }); look(S) },
    done: S => S.locked.has("turn") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("w22-line", "Now the matching corners line up.", S => { w22Board(S, { turned: true, pulse: true }); look(S) }, 2.4),
  tapSides("w22-de", "Tap the side of triangle $DEC$ that matches $AB$.", S => { w22Board(S, { turned: true }); S.sideCol[sideKey("ABC", "A", "B")] = BLUE }, {
    want: ["DEC:AB"], among: ["DEC:AB", "DEC:BC", "DEC:CA"], col: BLUE,
    wrong: "Match the corners: $A$ goes with $D$, and $B$ goes with $E$.",
  }),
  askNum("w22-k", "What is the scale factor from $DEC$ to $ABC$?", S => w22Board(S, { turned: true, col1: true }), {
    lead: "\\text{Scale factor}", answer: 4,
    slips: [
      { v: 9, say: "That's $12 - 3$. How many times bigger is $12$ than $3$?" },
      { v: 0.25, say: "That's $3 \\div 12$, from big to small. We go from $DEC$ to $ABC$." },
      { v: 36, say: "That's $12 \\times 3$. How many times bigger is $12$ than $3$?" },
    ],
    walk: [
      { say: "$DE$ is $3$, and its matching side $AB$ is $12$.", tex: "3 \\to 12" },
      { say: "How many times bigger? Divide the big side by the small side.", tex: "12 \\div 3" },
    ],
  }),
  tapSides("w22-cd", "Which side of triangle $ABC$ matches $CD$? Tap it.", S => { w22Board(S, { turned: true, col1: true }); S.sideCol[sideKey("DEC", "C", "A")] = ORANGE }, {
    want: ["ABC:CA"], among: ["ABC:AB", "ABC:BC", "ABC:CA"], col: ORANGE,
    notes: { "ABC:AB": "$AB$ already matches $DE$.", "ABC:BC": "$BC$ matches $EC$. Match the corners: $D$ goes with $A$." },
    wrong: "Match the corners: $D$ goes with $A$.",
  }),
  askNum("w22-ac", "So what is $AC$?", S => w22Board(S, { turned: true, col1: true, col2: true, ac: "?" }), {
    lead: "AC", answer: 28, unit: "cm",
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "4")]),
    slips: [{ v: 11, say: "That's $7 + 4$. The scale factor multiplies." }, { v: 1.75, say: "That's $7 \\div 4$. $AC$ is on the big triangle, so multiply." }],
    walk: [
      { say: "$AC$ matches $CD$, which is $7$ cm.", tex: "7 \\to AC" },
      { say: "Every side of $ABC$ is $4$ times its matching side.", tex: "7 \\times 4" },
    ],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "ABC" && l.a === "C" && l.b === "A" ? { ...l, tex: "28", col: GREEN, pulse: false } : l)) },
  }),
  watch("w22-letters", "The order of the letters says which corners match.", S => {
    w22Board(S, { turned: true, pulse: true })
    S.eqFn = () => atom("ord", `\\text{Triangle } ${c(BLUE, "A")}${c(ORANGE, "B")}C \\text{ is similar to triangle } ${c(BLUE, "D")}${c(ORANGE, "E")}C`)
    look(S, ["eq"])
  }, 3.0),
]

// ── 4. Showing triangles are similar: 4024/22/O/N/24 Q8(a), 4024/21/M/J/24 Q3(b) ──

/** ABC with A at the top; ADE is it times 4/7 about A (DE parallel to BC). */
const W24: Record<string, Vec> = { A: [0, 0], B: dirP(6.3, 235), C: dirP(9.1, 235 + 76.66) }
const W24_ORDER = ["A", "B", "C"]
const K24 = 4 / 7
/** Where ADE goes when it is pulled out: beside the figure, or under it on an upright phone. */
const w24Out = (S: Scene): Vec => (tall(S) ? [3.4, -8.2] : [8.6, -1.2])
/** D and E on the big triangle, for the trapezium DBCE. */
const W24_D = (): Vec => [W24.B[0] * K24, W24.B[1] * K24]
const W24_E = (): Vec => [W24.C[0] * K24, W24.C[1] * K24]
const W24_NAMES = { A: "A", B: "D", C: "E" }
/** Where the whole figure and the pulled-out ADE both have room. */
const w24Both = (S: Scene) => (tall(S) ? { x0: -4.2, y0: -12.7, x1: 7.6, y1: 0.4 } : { x0: -4.2, y0: -7.3, x1: 12.6, y1: 0.4 })
/**
 * ABC with D on AB, E on AC and DE parallel to BC. `out`: ADE pulled out to
 * the right. `inPlace`: angles marked on ADE where it sits in the figure
 * (for the F of the reason).
 */
function w24Board(S: Scene, o: { out?: boolean; handle?: boolean; marks?: number; pulse?: number[]; f?: "B" | "C"; inPlace?: number[] } = {}) {
  resetBeat(S)
  const D = W24_D(), E = W24_E(), OUT = w24Out(S)
  const shapes: ShapeSpec[] = [
    tri("ABC", W24, W24_ORDER, { A: "A", B: "B", C: "C" }),
    tri("DBCE", { D, B: W24.B, C: W24.C, E }, ["D", "B", "C", "E"], { D: "D", E: "E" }),
  ]
  if (o.handle) shapes.push(tri("ADEto", W24, W24_ORDER, {}, { k: K24, x: OUT[0], y: OUT[1] }, { ghost: true }))
  if (o.handle || o.out) shapes.push(tri("ADE", W24, W24_ORDER, o.out ? W24_NAMES : {}, { k: K24, x: o.out ? OUT[0] : 0, y: o.out ? OUT[1] : 0 }))
  if (o.inPlace) shapes.push(tri("ADEin", W24, W24_ORDER, {}, { k: K24 }, { hidden: true }))
  setShapes(S, shapes)
  if (o.handle) {
    S.frame = w24Both(S)
    // its letters come with it once it is out of the figure
    S.tick = S2 => { const sh = shapeOf(S2, "ADE"); if (sh) sh.names = Math.hypot(sh.D.x, sh.D.y) > 1.5 ? W24_NAMES : {} }
  }
  S.arrows = [{ sh: "DBCE", a: "D", b: "E", n: 1 }, { sh: "DBCE", a: "B", b: "C", n: 1 }]
  S.sideLabs = [
    { sh: "DBCE", a: "D", b: "B", tex: "2.7" }, { sh: "DBCE", a: "C", b: "E", tex: "3.9" },
    { sh: "DBCE", a: "B", b: "C", tex: "9.8" }, { sh: "DBCE", a: "E", b: "D", tex: "5.6" },
  ]
  if (o.out) S.sideLabs.push({ sh: "ADE", a: "B", b: "C", tex: "5.6" })
  const m = o.marks ?? 0, pul = new Set(o.pulse ?? [])
  const marks: Mark[] = []
  const pair = (n: string, count: number) => {
    marks.push({ sh: "ABC", at: n, count, pulse: pul.has(count) })
    if (o.out) marks.push({ sh: "ADE", at: n, count, pulse: pul.has(count) })
  }
  if (m >= 1) pair("A", 1)
  if (m >= 2) pair("B", 2)
  if (m >= 3) pair("C", 3)
  for (const count of o.inPlace ?? []) marks.push({ sh: "ADEin", at: count === 2 ? "B" : "C", count, pulse: true })
  S.marks = marks
  if (o.handle) S.handles = [{ id: "pull", sh: "ADE", at: "A", kind: "move", place: OUT, lock: true }]
  if (o.f) S.lines = w24F(o.f)
}
/** The F: the side through A and D (or A and E), with DE and BC off it on the same side. */
function w24F(along: "B" | "C") {
  return [{ pts: [W24.A, W24[along]], col: BLUE, glow: true }, { pts: [W24_D(), W24_E()], col: BLUE, glow: true }, { pts: [W24.B, W24.C], col: BLUE, glow: true }]
}

/** The trapezium ABCD (AB parallel to DC), its diagonals meeting at E; triangles ABE and CDE. */
const TZ = { A: [0, 4] as Vec, B: [4, 4] as Vec, C: [8, 0] as Vec, D: [-1.5, 0] as Vec }
const TZ_E: Vec = (() => {
  // where AC meets BD
  const [a, b, cc, d] = [TZ.A, TZ.B, TZ.C, TZ.D]
  const r: Vec = [cc[0] - a[0], cc[1] - a[1]], s: Vec = [d[0] - b[0], d[1] - b[1]]
  const t = ((b[0] - a[0]) * s[1] - (b[1] - a[1]) * s[0]) / (r[0] * s[1] - r[1] * s[0])
  return [a[0] + r[0] * t, a[1] + r[1] * t]
})()
function tzBoard(S: Scene, o: { marks?: string[]; pulse?: string[]; lines?: "x" | "za" | "zb"; statements?: number } = {}) {
  resetBeat(S)
  setShapes(S, [
    tri("Q", TZ, ["A", "B", "C", "D"], { A: "A", B: "B", C: "C", D: "D" }),
    tri("T1", { A: TZ.A, B: TZ.B, E: TZ_E }, ["A", "B", "E"], {}),
    tri("T2", { C: TZ.C, D: TZ.D, E: TZ_E }, ["C", "D", "E"], {}),
    // E's letter goes beside the crossing, between the diagonals
    tri("T3", { A: TZ.A, E: TZ_E, D: TZ.D }, ["A", "E", "D"], { E: "E" }, {}, { hidden: true }),
  ])
  S.arrows = [{ sh: "Q", a: "A", b: "B", n: 1 }, { sh: "Q", a: "D", b: "C", n: 1 }]
  const have = new Set(o.marks ?? []), pul = new Set(o.pulse ?? [])
  const marks: Mark[] = []
  if (have.has("E")) marks.push({ sh: "T1", at: "E", count: 1, pulse: pul.has("E") }, { sh: "T2", at: "E", count: 1, pulse: pul.has("E") })
  if (have.has("A")) marks.push({ sh: "T1", at: "A", count: 2, pulse: pul.has("A") }, { sh: "T2", at: "C", count: 2, pulse: pul.has("A") })
  if (have.has("B")) marks.push({ sh: "T1", at: "B", count: 3, pulse: pul.has("B") }, { sh: "T2", at: "D", count: 3, pulse: pul.has("B") })
  S.marks = marks
  if (o.lines === "x") S.lines = [{ pts: [TZ.A, TZ.C], col: BLUE, glow: true }, { pts: [TZ.B, TZ.D], col: BLUE, glow: true }]
  if (o.lines === "za") S.lines = [{ pts: [TZ.B, TZ.A, TZ.C, TZ.D], col: BLUE, glow: true }]
  if (o.lines === "zb") S.lines = [{ pts: [TZ.A, TZ.B, TZ.D, TZ.C], col: BLUE, glow: true }]
}

/** The statements that show two triangles are similar, one under another, each with its reason. */
function statements(lines: [string, string][]): ENode {
  const rows = lines.map(([s, r], i) => row([atom(`s${i}`, s), atom(`r${i}`, `\\quad\\text{(${r})}`, { col: CHALK })]))
  return rows.slice(1).reduce<ENode>((acc, r, i) => frac(`st${i}`, acc, r, "rgba(0,0,0,0)"), rows[0])
}

/** The reasons, always in this order (the right one moves). */
const REASONS = ["Alternate angles", "Corresponding angles", "Vertically opposite angles"]

const PART_4: Beat[] = [
  watch("show", "To show two triangles are similar, show their angles are equal.", S => { w24Board(S); look(S) }, 2.6),
  watch("w24-par", "Here, $DE$ is parallel to $BC$.", S => {
    w24Board(S)
    S.sideGlow = new Set([sideKey("DBCE", "E", "D"), sideKey("DBCE", "B", "C")])
    look(S)
  }, 2.2),
  {
    id: "w24-pull",
    say: "Pull triangle $ADE$ out.",
    enter: S => { w24Board(S, { handle: true }); look(S) },
    done: S => S.locked.has("pull") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("w24-a", "Angle $A$ is in both triangles.", S => { w24Board(S, { out: true, marks: 1, pulse: [1] }); look(S) }, 2.4),
  tapAngle("w24-d", "Tap the angle in triangle $ADE$ that equals angle $ABC$.", S => { w24Board(S, { out: true, marks: 1 }); S.marks.push({ sh: "ABC", at: "B", count: 2, pulse: true }) }, {
    want: "ADE:B", among: ["ADE:A", "ADE:B", "ADE:C"],
    notes: { "ADE:A": "That's angle $A$, which we've matched.", "ADE:C": "That one matches angle $ACB$. Angle $ABC$ is at $B$, on the same side as $D$." },
    wrong: "Tap an angle of triangle $ADE$.",
    then: S => { S.marks = [...S.marks.filter(m => !(m.sh === "ABC" && m.at === "B")), { sh: "ABC", at: "B", count: 2 }, { sh: "ADE", at: "B", count: 2 }] },
  }),
  watch("w24-in", "Angle $ADE$ is here too, in the figure.", S => { w24Board(S, { out: true, marks: 2, inPlace: [2] }); look(S) }, 2.4),
  pickBeat("w24-why", "Why is angle $ADE$ equal to angle $ABC$?", S => w24Board(S, { out: true, marks: 2, inPlace: [2] }), {
    options: REASONS, answer: 1,
    notes: { 0: "Alternate angles make a Z. Look for an F.", 2: "Vertically opposite angles are made by two lines crossing." },
    right: "Yes. $AB$ and the two parallel lines make an F.",
    then: S => { S.lines = w24F("B") },
  }),
  watch("w24-c", "Angle $AED$ equals angle $ACB$. This F is along $AC$.", S => { w24Board(S, { out: true, marks: 3, pulse: [3], inPlace: [3], f: "C" }); look(S) }, 2.8),
  watch("w24-c2", "So they are corresponding angles too.", S => { w24Board(S, { out: true, marks: 3, pulse: [3], inPlace: [3], f: "C" }); look(S) }, 2.0),
  watch("w24-all", "All three pairs are equal, so the triangles are similar.", S => {
    w24Board(S, { out: true, marks: 3 })
    S.eqFn = () => statements([
      ["\\angle BAC = \\angle DAE", "common angle"],
      ["\\angle ABC = \\angle ADE", "corresponding angles"],
      ["\\angle ACB = \\angle AED", "corresponding angles"],
    ])
    look(S, ["eq"])
  }, 3.4),

  // 4024/21/M/J/24 Q3(b)
  watch("tz", "The diagonals of trapezium $ABCD$ meet at $E$. $AB$ is parallel to $DC$.", S => { tzBoard(S); look(S) }, 2.8),
  watch("tz-q", "Show that triangle $ABE$ is similar to triangle $CDE$.", S => { tzBoard(S); S.sideGlow = new Set([sideKey("T1", "A", "B"), sideKey("T1", "B", "E"), sideKey("T1", "E", "A"), sideKey("T2", "C", "D"), sideKey("T2", "D", "E"), sideKey("T2", "E", "C")]); look(S) }, 2.4),
  tapAngle("tz-e", "Tap the angle in triangle $CDE$ that equals angle $AEB$.", S => { tzBoard(S); S.marks = [{ sh: "T1", at: "E", count: 1, pulse: true }] }, {
    want: "T2:E", among: ["T2:C", "T2:D", "T2:E"],
    wrong: "Angle $AEB$ is at $E$. Look across $E$.",
  }),
  pickBeat("tz-e-why", "Why are they equal?", S => tzBoard(S, { marks: ["E"], pulse: ["E"] }), {
    options: REASONS, answer: 2,
    notes: { 0: "Alternate angles need parallel lines. These angles are made by $AC$ and $BD$ crossing.", 1: "Corresponding angles need parallel lines. These are made by two lines crossing." },
    right: "Yes. $AC$ and $BD$ cross at $E$.",
    then: S => { S.lines = [{ pts: [TZ.A, TZ.C], col: BLUE, glow: true }, { pts: [TZ.B, TZ.D], col: BLUE, glow: true }] },
  }),
  tapAngle("tz-a", "Now tap the angle in triangle $CDE$ that equals angle $BAE$.", S => { tzBoard(S, { marks: ["E"] }); S.marks.push({ sh: "T1", at: "A", count: 2, pulse: true }) }, {
    want: "T2:C", among: ["T2:C", "T2:D", "T2:E"],
    notes: { "T2:E": "That's the one at $E$, done already.", "T2:D": "That one matches angle $ABE$. Angle $BAE$ is on $AC$, so look along $AC$." },
    wrong: "Look along $AC$.",
  }),
  pickBeat("tz-a-why", "Why are they equal?", S => tzBoard(S, { marks: ["E", "A"], pulse: ["A"] }), {
    options: REASONS, answer: 0,
    notes: { 1: "Corresponding angles make an F. Look for a Z.", 2: "These two aren't made by two lines crossing at one point." },
    right: "Yes. $AB$, $AC$ and $DC$ make a Z.",
    then: S => { S.lines = [{ pts: [TZ.B, TZ.A, TZ.C, TZ.D], col: BLUE, glow: true }] },
  }),
  watch("tz-b", "And angle $ABE$ equals angle $CDE$. They are alternate angles too.", S => { tzBoard(S, { marks: ["E", "A", "B"], pulse: ["B"], lines: "zb" }); look(S) }, 2.8),
  watch("tz-all", "Three pairs of equal angles, so the triangles are similar.", S => {
    tzBoard(S, { marks: ["E", "A", "B"] })
    S.eqFn = () => statements([
      ["\\angle AEB = \\angle CED", "vertically opposite"],
      ["\\angle BAE = \\angle DCE", "alternate angles"],
      ["\\angle ABE = \\angle CDE", "alternate angles"],
    ])
    look(S, ["eq"])
  }, 3.4),
]

// ── 5. Exam questions ────────────────────────────────────────────────────

/** The bars for AD and AB (or AE and AC): AB is AD and 0.75 of AD more, which is BD. */
function bars(S: Scene, which: "D" | "E", known: boolean) {
  const [small, big, extra, v] = which === "D" ? ["AD", "AB", "BD", "2.7"] : ["AE", "AC", "CE", "3.9"]
  S.bars = [
    { label: small, parts: [{ w: 1, col: BLUE, tex: small }] },
    { label: big, parts: [{ w: 1, col: BLUE, tex: small }, { w: 0.75, col: ORANGE, tex: known ? `${extra} = ${v}` : `0.75 \\times ${small}` }] },
  ]
  if (known) {
    const key = which === "D" ? sideKey("DBCE", "D", "B") : sideKey("DBCE", "C", "E")
    S.sideCol[key] = ORANGE
    S.sideGlow = new Set([key])
  }
}

/** 4024/12/M/J/24 Q15: ABC (AB = 5, AC = 7, BC = 8) and CBD on BC, similar with C, B, D matching A, B, C. */
const S24_C: Vec = [1, Math.sqrt(48)]
const S24_D: Vec = [5 + 12.8 * Math.cos(60 * RAD), 12.8 * Math.sin(60 * RAD)]
function s24Board(S: Scene, o: { col1?: boolean; col2?: boolean; bd?: string; letters?: boolean } = {}) {
  resetBeat(S)
  setShapes(S, [
    tri("ABC", { A: [0, 0], B: [5, 0], C: S24_C }, ["A", "B", "C"], { A: "A", B: "B", C: "C" }),
    tri("CBD", { C: S24_C, B: [5, 0], D: S24_D }, ["C", "B", "D"], { D: "D" }),
  ])
  S.marks = [
    { sh: "ABC", at: "A", count: 1, pulse: o.letters }, { sh: "CBD", at: "C", count: 1, pulse: o.letters },
    { sh: "ABC", at: "B", count: 2, pulse: o.letters }, { sh: "CBD", at: "B", count: 2, pulse: o.letters },
  ]
  S.sideLabs = [{ sh: "ABC", a: "A", b: "B", tex: "5" }, { sh: "ABC", a: "C", b: "A", tex: "7" }, { sh: "ABC", a: "B", b: "C", tex: "8" }]
  if (o.bd) S.sideLabs.push({ sh: "CBD", a: "B", b: "D", tex: o.bd, col: o.bd === "?" ? PINK : GREEN, pulse: o.bd === "?" })
  if (o.col1) { S.sideCol[sideKey("ABC", "A", "B")] = BLUE; S.sideCol[sideKey("CBD", "C", "B")] = BLUE }
  if (o.col2) { S.sideCol[sideKey("ABC", "B", "C")] = ORANGE; S.sideCol[sideKey("CBD", "B", "D")] = ORANGE }
}

const PART_X: Beat[] = [
  // 4024/22/O/N/24 Q8(b)
  watch("x1", "Back to the triangles with $DE$ parallel to $BC$. Show that $AD = 3.6$ cm.", S => { w24Board(S); look(S) }, 3.0),
  askNum("x1-k", "What is the scale factor from $ADE$ to $ABC$?", S => { w24Board(S); S.sideCol[sideKey("DBCE", "E", "D")] = BLUE; S.sideCol[sideKey("DBCE", "B", "C")] = BLUE }, {
    lead: "\\text{Scale factor}", answer: 1.75,
    slips: [
      { v: 4.2, say: "That's $9.8 - 5.6$. How many times bigger is $9.8$ than $5.6$?" },
      { v: 0.57, say: "That's $5.6 \\div 9.8$, from big to small. We go from $ADE$ to $ABC$." },
    ],
    walk: [
      { say: "$DE$ matches $BC$: $5.6$ and $9.8$.", tex: "5.6 \\to 9.8" },
      { say: "Divide the big side by the small side.", tex: "9.8 \\div 5.6" },
    ],
  }),
  watch("x1-bar", "So $AB$ is $1.75$ times as long as $AD$.", S => { w24Board(S); bars(S, "D", false); look(S, ["bars"]) }, 2.6),
  watch("x1-split", "That is all of $AD$, and $0.75$ of $AD$ more.", S => { w24Board(S); bars(S, "D", false); look(S, ["bars"]) }, 2.6),
  watch("x1-bd", "The extra $0.75$ of $AD$ is $BD$, which is $2.7$.", S => { w24Board(S); bars(S, "D", true); look(S, ["bars"]) }, 2.8),
  askNum("x1-ad", "So what is $AD$?", S => { w24Board(S); bars(S, "D", true) }, {
    lead: "AD", answer: 3.6, unit: "cm",
    slips: [
      { v: 2.025, say: "That's $2.7 \\times 0.75$. $0.75$ of $AD$ is $2.7$, so $AD$ is more than $2.7$." },
      { v: 3.45, say: "That's $2.7 + 0.75$. $0.75$ of $AD$ is $2.7$, so divide." },
    ],
    walk: [
      { say: "$0.75$ of $AD$ is $2.7$.", tex: "0.75 \\times AD = 2.7" },
      { say: "So $AD$ is $2.7$ divided by $0.75$.", tex: "AD = 2.7 \\div 0.75" },
    ],
    rightNote: "That's $AD = 3.6$ cm, as the question says.",
  }),
  watch("x1-ce", "$AE$ works the same way. The extra $0.75$ of $AE$ is $CE$, which is $3.9$.", S => { w24Board(S); bars(S, "E", true); look(S, ["bars"]) }, 2.8),
  askNum("x1-ae", "So what is $AE$?", S => { w24Board(S); bars(S, "E", true) }, {
    lead: "AE", answer: 5.2, unit: "cm",
    slips: [{ v: 2.925, say: "That's $3.9 \\times 0.75$. $0.75$ of $AE$ is $3.9$, so divide." }],
    walk: [
      { say: "$0.75$ of $AE$ is $3.9$.", tex: "0.75 \\times AE = 3.9" },
      { say: "So $AE$ is $3.9$ divided by $0.75$.", tex: "AE = 3.9 \\div 0.75" },
    ],
  }),

  // 4024/12/M/J/24 Q15
  watch("x2", "Triangle $ABC$ is similar to triangle $CBD$.", S => { s24Board(S); look(S) }, 2.4),
  watch("x2-letters", "The letters match in order: $A$ with $C$, $B$ with $B$, $C$ with $D$.", S => {
    s24Board(S, { letters: true })
    S.eqFn = () => atom("ord", `\\text{Triangle } ${c(BLUE, "A")}${c(ORANGE, "B")}C \\text{ is similar to triangle } ${c(BLUE, "C")}${c(ORANGE, "B")}D`)
    look(S, ["eq"])
  }, 3.2),
  tapSides("x2-ab", "Which side of triangle $CBD$ matches $AB$? Tap it.", S => { s24Board(S); S.sideCol[sideKey("ABC", "A", "B")] = BLUE }, {
    want: ["CBD:CB"], among: ["CBD:CB", "CBD:BD", "CBD:DC"], col: BLUE,
    notes: { "CBD:BD": "Match the letters: $A$ with $C$, $B$ with $B$. So $AB$ goes with $CB$.", "CBD:DC": "Match the letters: $A$ with $C$, $B$ with $B$. So $AB$ goes with $CB$." },
    wrong: "Match the letters: $A$ with $C$, $B$ with $B$.",
  }),
  askNum("x2-k", "What is the scale factor from $ABC$ to $CBD$?", S => s24Board(S, { col1: true }), {
    lead: "\\text{Scale factor}", answer: 1.6,
    slips: [{ v: 3, say: "That's $8 - 5$. How many times bigger is $8$ than $5$?" }, { v: 0.625, say: "That's $5 \\div 8$, from big to small." }],
    walk: [
      { say: "$AB$ is $5$, and its matching side $CB$ is $8$.", tex: "5 \\to 8" },
      { say: "Divide the big side by the small side.", tex: "8 \\div 5" },
    ],
  }),
  tapSides("x2-bd", "Which side of triangle $CBD$ matches $BC$? Tap it.", S => { s24Board(S, { col1: true }); S.sideCol[sideKey("ABC", "B", "C")] = ORANGE }, {
    want: ["CBD:BD"], among: ["CBD:CB", "CBD:BD", "CBD:DC"], col: ORANGE,
    notes: { "CBD:CB": "$CB$ already matches $AB$.", "CBD:DC": "Match the letters: $B$ with $B$, $C$ with $D$. So $BC$ goes with $BD$." },
    wrong: "Match the letters: $B$ with $B$, $C$ with $D$.",
  }),
  askNum("x2-ans", "So what is $BD$?", S => s24Board(S, { col1: true, col2: true, bd: "?" }), {
    lead: "BD", answer: 12.8, unit: "cm",
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "1.6")]),
    slips: [{ v: 9.6, say: "That's $8 + 1.6$. The scale factor multiplies." }, { v: 5, say: "That's $8 \\div 1.6$. $BD$ is on the big triangle, so multiply." }],
    walk: [
      { say: "$BD$ matches $BC$, which is $8$ cm.", tex: "8 \\to BD" },
      { say: "Every side of $CBD$ is $1.6$ times its matching side.", tex: "8 \\times 1.6" },
    ],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "CBD" ? { ...l, tex: "12.8", col: GREEN, pulse: false } : l)) },
  }),

  {
    id: "end",
    say: "In summary, similar shapes have the same angles, and every length is multiplied by the same scale factor.",
    enter: S => {
      pairBoard(S, 1.5, "\\times 1.5")
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4, ...PART_X]

applyParts(BEATS, [
  ["tri", "Same shape, different size"],
  ["w25", "Using the scale factor"],
  ["w22", "When a triangle is turned"],
  ["show", "Showing triangles are similar"],
  ["x1", "Exam questions"],
])

