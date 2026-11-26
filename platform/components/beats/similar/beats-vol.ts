/**
 * Areas and volumes of similar shapes (4.4, lesson 2 of 2), one tiny idea
 * per beat.
 *
 * The student grows a 1 cm square to 2 and 3 times its size and counts the
 * unit squares inside (4, 9): the area is multiplied by the scale factor
 * squared, the area factor. A triangle twice the size holds four copies.
 * Then a 1 cm cube grown the same way, filled with unit cubes (8, 27): the
 * volume factor is the scale factor cubed. Exam questions both ways, up and
 * down in size, and back from a volume to a length: 4024/12/O/N/25 Q17(b),
 * 4024/11/O/N/22 Q15(b), 4024/11/M/J/23 Q21, 4024/11/O/N/25 Q17(b),
 * 4024/12/O/N/24 Q19, 4024/11/M/J/24 Q21.
 *
 * The method is the same each time: the scale factor is the big length
 * divided by the small one; square it for areas, cube it for volumes;
 * multiply to go up to the big shape, divide to go down to the small one.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { op, row, atom, frac, type ENode } from "../equation"
import {
  type Scene, type SideLab, BLUE, ORANGE, PINK, GREEN, CHALK, setShapes, resetBeat, shapeOf, sideLen, numText, sideKey,
} from "./scene"
import { type Beat, type ShapeSpec, askNum, watch, look, tall, c, tri, tapSides, w25Board, w22Board } from "./beats"

const sq = (tex: string) => `${tex}\\text{ cm}^2`
type Side = [string, string, string]
/** Sides glow (by shape and end letters); the rest stop. */
const glowS = (S: Scene, ...sides: Side[]) => { S.sideGlow = new Set(sides.map(([sh, a, b]) => sideKey(sh, a, b))) }
/** Side labels pulse (either way round); the rest stop. */
const pulseS = (S: Scene, ...sides: Side[]) => { S.sideLabs = S.sideLabs.map(l => ({ ...l, pulse: sides.some(([sh, a, b]) => l.sh === sh && ((l.a === a && l.b === b) || (l.a === b && l.b === a))) })) }
/** The words inside shapes pulse (an area, a volume); the rest stop. */
const pulseIn = (S: Scene, ...shs: string[]) => { S.inLabs = S.inLabs.map(l => ({ ...l, pulse: shs.includes(l.sh) })) }
/** A shape's whole outline glows. */
const glowAll = (S: Scene, sh: string, letters: string[]) => { S.sideGlow = new Set(letters.map((a, i) => sideKey(sh, a, letters[(i + 1) % letters.length]))) }
const cu = (tex: string) => `${tex}\\text{ cm}^3`
/** A keypad with a square root, for going back from an area factor. */
const ROOT_KEYS = [["1", "2", "3", "4", "5", "back"], ["6", "7", "8", "9", "0", "."], ["×", "÷", "√", "go"]]

// ── 1. How areas grow ────────────────────────────────────────────────────

const SQ: Record<string, Vec> = { A: [0, 0], B: [1, 0], C: [1, 1], D: [0, 1] }
const SQ_ORDER = ["A", "B", "C", "D"]

/** The square (or cube) at a scale factor, a ghost of the first one, its edges labelled as it grows. */
function growBoard(S: Scene, o: { k?: number; snap?: number[]; grid?: boolean; cube?: boolean; area?: string; cubes?: number } = {}) {
  resetBeat(S)
  const k = o.k ?? 1
  const more: Partial<ShapeSpec> = o.cube ? { depth: 1 } : {}
  // the first square's outline shows only while it is being grown (over the grid it reads as a line to count)
  setShapes(S, [
    ...(o.snap ? [tri("G0", SQ, SQ_ORDER, {}, {}, { ghost: true })] : []),
    tri("G", SQ, SQ_ORDER, {}, { k }, { ...more, grid: o.grid, cubes: o.cubes }),
  ])
  // room for it at 3.3 times (a cube's back too)
  const big = 3.3, back = o.cube ? big * 0.5 : 0
  S.frame = { x0: -0.9, y0: -0.7, x1: big + back * Math.cos(40 * Math.PI / 180) + 0.6, y1: big + back * Math.sin(40 * Math.PI / 180) + 0.5 }
  if (o.snap) S.handles = [{ id: "grow", sh: "G", at: "C", kind: "scale", snap: o.snap, min: 0.8, max: 3.3, lock: true }]
  S.tick = S2 => {
    const sh = shapeOf(S2, "G")!
    const len = numText(sideLen(sh, "A", "B", false), 1)
    const labs: SideLab[] = [{ sh: "G", a: "A", b: "B", tex: `${len}\\text{ cm}` }, { sh: "G", a: "D", b: "A", tex: `${len}\\text{ cm}` }]
    if (o.cube) labs.push({ sh: "G", a: "B", b: "B'", tex: `${len}\\text{ cm}` })
    S2.sideLabs = labs
  }
  S.tick(S)
  if (o.area) S.inLabs = [{ sh: "G", tex: o.area }]
}

/** Make the square (or cube) n times as big: it clicks on at n. */
function makeBeat(id: string, text: string, from: number, n: number, cube = false): Beat {
  return {
    id, say: text,
    enter: S => { growBoard(S, { k: from, snap: [n], grid: true, cube }); look(S) },
    done: S => S.locked.has("grow") && S.drag === null,
    advanceAfter: 1400,
  }
}

/** Count what fits inside: squares, or cubes (which then stack in, one by one). */
function countBeat(id: string, text: string, n: number, cube: boolean, slips: { v: number; say: string }[]): Beat {
  const total = cube ? n ** 3 : n ** 2
  return askNum(id, text, S => {
    growBoard(S, { k: n, grid: true, cube })
  }, {
    lead: cube ? "\\text{Cubes}" : "\\text{Squares}", answer: total, slips,
    walk: cube ? [
      { say: `One layer is ${n} rows of ${n}.`, tex: `${n} \\times ${n} = ${n * n}`, show: S => { const g = shapeOf(S, "G"); if (g) g.cubes = n * n; glowS(S, ["G", "A", "B"], ["G", "D", "A"]) } },
      { say: `There are ${n} layers.`, tex: `${n} \\times ${n} \\times ${n}`, show: S => { const g = shapeOf(S, "G"); if (g) g.cubes = n ** 3; S.sideGlow = new Set() } },
    ] : [
      { say: `There are ${n} rows of ${n}.`, tex: `${n} \\times ${n}`, show: S => { glowS(S, ["G", "A", "B"], ["G", "D", "A"]); pulseS(S, ["G", "A", "B"], ["G", "D", "A"]) } },
    ],
    then: S => {
      if (cube) {
        // the unit cubes stack in, bottom layer first
        const sh = shapeOf(S, "G")!
        sh.cubes = 0
        const t0 = S.time, gap = Math.min(0.12, 1.6 / total)
        const before = S.tick
        S.tick = S2 => { before?.(S2); const g = shapeOf(S2, "G"); if (g) g.cubes = Math.min(total, Math.floor((S2.time - t0) / gap)) }
      } else S.inLabs = [{ sh: "G", tex: sq(String(total)), col: GREEN }]
    },
    after: cube ? 2600 : 2000,
  })
}

/** The first triangle (4, 6, 7) for the area of a triangle. */
const TRI: Record<string, Vec> = (() => {
  const cx = (49 + 36 - 16) / 14
  return { A: [0, 0], B: [7, 0], C: [cx, Math.sqrt(36 - cx * cx)] }
})()

function triBoard(S: Scene, k: number, o: { snap?: number[]; split?: boolean } = {}) {
  resetBeat(S)
  const rot = tall(S) ? -107.4 : 0
  setShapes(S, [tri("T0", TRI, ["A", "B", "C"], {}, { rot }, { ghost: true }), tri("T", TRI, ["A", "B", "C"], {}, { k, rot }, { split: o.split ? 2 : undefined })])
  // room for it at its biggest
  const r = rot * Math.PI / 180, P = [[0, 0], ...Object.values(TRI)].map(([x, y]) => [2.2 * (x * Math.cos(r) - y * Math.sin(r)), 2.2 * (x * Math.sin(r) + y * Math.cos(r))])
  S.frame = { x0: Math.min(...P.map(p => p[0])) - 0.6, y0: Math.min(...P.map(p => p[1])) - 0.6, x1: Math.max(...P.map(p => p[0])) + 0.6, y1: Math.max(...P.map(p => p[1])) + 0.6 }
  if (o.snap) S.handles = [{ id: "grow", sh: "T", at: "C", kind: "scale", snap: o.snap, min: 0.8, max: 2.2, lock: true }]
  S.tick = S2 => {
    const sh = shapeOf(S2, "T")!
    sh.split = o.split || S2.locked.has("grow") ? 2 : undefined
    S2.sideLabs = [["A", "B"], ["B", "C"], ["C", "A"]].map(([a, b]) => ({ sh: "T", a, b, tex: numText(sideLen(sh, a, b, false), 1) }))
  }
  S.tick(S)
}

const PART_1: Beat[] = [
  watch("sq", "Here is a square. Each side is $1$ cm.", S => { growBoard(S); look(S) }, 2.0),
  watch("sq-area", "Its area is $1\\text{ cm}^2$.", S => { growBoard(S, { area: sq("1") }); look(S) }, 2.0),
  makeBeat("sq-2", "Make it $2$ times as big.", 1, 2),
  countBeat("sq-4", "How many $1$ cm squares fit inside?", 2, false, [
    { v: 2, say: "That's one row. How many rows are there?" },
    { v: 8, say: "That's the four sides added up. Count the squares inside." },
  ]),
  makeBeat("sq-3", "Now make it $3$ times as big.", 2, 3),
  countBeat("sq-9", "How many squares now?", 3, false, [
    { v: 3, say: "That's one row. How many rows are there?" },
    { v: 6, say: "That's two rows. Count all the rows." },
    { v: 12, say: "That's the four sides added up. Count the squares inside." },
  ]),
  watch("sq-x4", "Scale factor $2$: the area is multiplied by $4$.", S => {
    growBoard(S, { k: 2, grid: true, area: sq("4") })
    S.eqFn = () => row([atom("a", c(BLUE, "2") + " \\times " + c(BLUE, "2")), op("e", "="), atom("b", c(ORANGE, "4"))])
    look(S, ["eq"])
  }, 2.6),
  watch("sq-x9", "Scale factor $3$: the area is multiplied by $9$.", S => {
    growBoard(S, { k: 3, grid: true, area: sq("9") })
    S.eqFn = () => row([atom("a", c(BLUE, "3") + " \\times " + c(BLUE, "3")), op("e", "="), atom("b", c(ORANGE, "9"))])
    look(S, ["eq"])
  }, 2.6),
  watch("af", "The area is multiplied by the scale factor squared. This is the *area factor*.", S => {
    growBoard(S, { k: 3, grid: true, area: sq("9") })
    S.eqFn = () => row([atom("a", `\\text{Area factor}`, { col: ORANGE }), op("e", "="), atom("b", `(\\text{scale factor})^2`, { col: BLUE })])
    look(S, ["eq"])
  }, 3.2),
  {
    id: "tri",
    say: "It works for a triangle too. Make this one $2$ times as big.",
    enter: S => { triBoard(S, 1, { snap: [2] }); look(S) },
    done: S => S.locked.has("grow") && S.drag === null,
    advanceAfter: 1600,
  },
  watch("tri-4", "Four copies of the small triangle fit inside. $2^2 = 4$.", S => { triBoard(S, 2, { split: true }); look(S) }, 2.8),
]

// ── 2. Areas in exam questions ───────────────────────────────────────────

/** Triangles ABC and PQR (4024/12/O/N/25 Q17): AB and PQ in blue, the areas inside. */
function w25Areas(S: Scene, pqr?: string) {
  w25Board(S, { col1: true })
  S.inLabs = [{ sh: "ABC", tex: sq("16") }]
  if (pqr) S.inLabs.push({ sh: "PQR", tex: pqr === "?" ? "?" : sq(pqr), col: pqr === "?" ? PINK : GREEN, pulse: pqr === "?" })
}
/** Triangles ABC and DEC (4024/11/O/N/22 Q15): AB and DE in blue, the areas inside. */
function w22Areas(S: Scene, dec?: string) {
  w22Board(S, { col1: true })
  S.inLabs = [{ sh: "ABC", tex: sq("160") }]
  // DEC is too small to hold its area: it goes in the open space beside it
  if (dec) S.inLabs.push({ sh: "DEC", tex: dec === "?" ? "?" : sq(dec), col: dec === "?" ? PINK : GREEN, pulse: dec === "?", loc: [-14, -14] })
}

/** Rectangles ABCD (12 by 9, shaded) and PQRS (PQ = 8) turned inside it (4024/11/M/J/23 Q21). */
const R_BIG: Record<string, Vec> = { A: [0, 9], B: [12, 9], C: [12, 0], D: [0, 0] }
const R_ROT = 18
const R_SMALL: Record<string, Vec> = { P: [0, 0], Q: [8, 0], R: [8, -6], S: [0, -6] }
function s23Board(S: Scene, o: { col1?: boolean; small?: string; pulse?: boolean } = {}) {
  resetBeat(S)
  setShapes(S, [
    tri("ABCD", R_BIG, ["A", "B", "C", "D"], { A: "A", B: "B", C: "C", D: "D" }, {}, { fill: CHALK, fillOp: o.pulse ? 0.34 : 0.22 }),
    tri("PQRS", R_SMALL, ["P", "Q", "R", "S"], { P: "P", Q: "Q", R: "R", S: "S" }, { x: 1.27, y: 6.12, rot: R_ROT }, { fill: "#0d1216", fillOp: 1 }),
  ])
  S.sideLabs = [{ sh: "ABCD", a: "A", b: "B", tex: "12" }, { sh: "ABCD", a: "B", b: "C", tex: "9" }, { sh: "PQRS", a: "P", b: "Q", tex: "8" }]
  if (o.col1) { S.sideCol[sideKey("ABCD", "A", "B")] = BLUE; S.sideCol[sideKey("PQRS", "P", "Q")] = BLUE }
  S.inLabs = []
  if (o.small) S.inLabs.push({ sh: "PQRS", tex: o.small === "?" ? "?" : sq(o.small), col: o.small === "?" ? PINK : GREEN, pulse: o.small === "?" })
}

/** The working so far, one line under another. */
const lines = (...rs: ENode[]) => rs.slice(1).reduce<ENode>((acc, r, i) => frac(`ln${i}`, acc, r, "rgba(0,0,0,0)"), rs[0])
const bigArea = () => row([atom("bal", "\\text{Area of } ABCD"), op("bae", "="), atom("bav", sq("108"))])

const PART_2: Beat[] = [
  // 4024/12/O/N/25 Q17(b)
  watch("w25", "Triangle $ABC$ is similar to triangle $PQR$.", S => { w25Areas(S); look(S) }, 2.2),
  askNum("w25-k", "What is the scale factor from $ABC$ to $PQR$?", S => w25Areas(S), {
    lead: "\\text{Scale factor}", answer: 1.5,
    slips: [{ v: 3, say: "That's $9 - 6$. How many times bigger is $9$ than $6$?" }, { v: 0.67, say: "That's $6 \\div 9$. Divide the big side by the small side." }],
    walk: [
      { say: "$PQ$ is $9$, and its matching side $AB$ is $6$.", tex: "6 \\to 9", show: S => { glowS(S, ["ABC", "A", "B"], ["PQR", "A", "B"]); pulseS(S, ["ABC", "A", "B"], ["PQR", "A", "B"]) } },
      { say: "Divide the big side by the small side.", tex: "9 \\div 6", show: S => pulseS(S, ["PQR", "A", "B"]) },
    ],
  }),
  watch("w25-area", "The area of triangle $ABC$ is $16\\text{ cm}^2$.", S => { w25Areas(S, "?"); look(S) }, 2.4),
  askNum("w25-af", "What is the area factor?", S => w25Areas(S, "?"), {
    lead: "\\text{Area factor}", answer: 2.25,
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "1.5")]),
    slips: [
      { v: 1.5, say: "That's the scale factor. The area factor is the scale factor squared." },
      { v: 3, say: "That's $1.5 \\times 2$. Squared means $1.5 \\times 1.5$." },
    ],
    walk: [{ say: "The area factor is the scale factor squared: $1.5$ times itself.", tex: "1.5 \\times 1.5", show: S => glowS(S, ["ABC", "A", "B"], ["PQR", "A", "B"]) }],
  }),
  askNum("w25-pqr", "So what is the area of triangle $PQR$?", S => w25Areas(S, "?"), {
    lead: "\\text{Area of } PQR", answer: 36, unit: "cm^2",
    above: () => row([atom("afl", "\\text{Area factor}"), op("afe", "="), atom("afv", "2.25")]),
    slips: [
      { v: 24, say: "That's $16 \\times 1.5$, the scale factor. An area uses the area factor." },
      { v: 18.25, say: "That's $16 + 2.25$. The area factor multiplies." },
      { v: 7.11, say: "That's $16 \\div 2.25$. $PQR$ is the big one, so multiply." },
    ],
    walk: [
      { say: "$ABC$'s area is $16$. $PQR$ is the big one, so its area is bigger.", tex: "16 \\to ?", show: S => { glowAll(S, "PQR", ["A", "B", "C"]); pulseIn(S, "ABC") } },
      { say: "Multiply by the area factor.", tex: "16 \\times 2.25", show: S => pulseIn(S, "PQR") },
    ],
    then: S => { S.inLabs = S.inLabs.map(l => (l.sh === "PQR" ? { ...l, tex: sq("36"), col: GREEN, pulse: false } : l)) },
  }),

  // 4024/11/O/N/22 Q15(b)
  watch("w22", "Triangle $ABC$ is similar to triangle $DEC$.", S => { w22Areas(S); S.inLabs = []; look(S) }, 2.2),
  watch("w22-area", "The area of triangle $ABC$ is $160\\text{ cm}^2$. Let's find the area of $DEC$.", S => { w22Areas(S, "?"); look(S) }, 3.0),
  askNum("w22-k", "What is the scale factor from $DEC$ to $ABC$?", S => w22Areas(S, "?"), {
    lead: "\\text{Scale factor}", answer: 4,
    slips: [{ v: 9, say: "That's $12 - 3$. How many times bigger is $12$ than $3$?" }, { v: 0.25, say: "That's $3 \\div 12$. Divide the big side by the small side." }],
    walk: [
      { say: "$AB$ is $12$, and its matching side $DE$ is $3$.", tex: "3 \\to 12", show: S => { glowS(S, ["ABC", "A", "B"], ["DEC", "A", "B"]); pulseS(S, ["ABC", "A", "B"], ["DEC", "A", "B"]) } },
      { say: "Divide the big side by the small side.", tex: "12 \\div 3", show: S => pulseS(S, ["ABC", "A", "B"]) },
    ],
  }),
  askNum("w22-af", "What is the area factor?", S => w22Areas(S, "?"), {
    lead: "\\text{Area factor}", answer: 16,
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "4")]),
    slips: [{ v: 8, say: "That's $4 \\times 2$. Squared means $4 \\times 4$." }, { v: 4, say: "That's the scale factor. Square it." }],
    walk: [{ say: "The area factor is the scale factor squared.", tex: "4^2 = 4 \\times 4", show: S => glowS(S, ["ABC", "A", "B"], ["DEC", "A", "B"]) }],
  }),
  watch("w22-small", "$DEC$ is the small one. So this time, divide.", S => {
    w22Areas(S, "?")
    S.sideGlow = new Set([sideKey("DEC", "A", "B"), sideKey("DEC", "B", "C"), sideKey("DEC", "C", "A")])
    S.eqFn = () => row([atom("afl", "\\text{Area factor}"), op("afe", "="), atom("afv", "16")])
    look(S, ["eq"])
  }, 2.6),
  askNum("w22-ans", "What is the area of triangle $DEC$?", S => w22Areas(S, "?"), {
    lead: "\\text{Area of } DEC", answer: 10, unit: "cm^2",
    above: () => row([atom("afl", "\\text{Area factor}"), op("afe", "="), atom("afv", "16")]),
    slips: [
      { v: 2560, say: "That's $160 \\times 16$. $DEC$ is the small one, so divide." },
      { v: 40, say: "That's $160 \\div 4$, the scale factor. An area uses the area factor, $16$." },
    ],
    walk: [
      { say: "$ABC$'s area is $160$. $DEC$ is the small one, so its area is smaller.", tex: "160 \\to ?", show: S => { glowAll(S, "DEC", ["A", "B", "C"]); pulseIn(S, "ABC") } },
      { say: "Divide by the area factor.", tex: "160 \\div 16", show: S => pulseIn(S, "DEC") },
    ],
    then: S => { S.inLabs = S.inLabs.map(l => (l.sh === "DEC" ? { ...l, tex: sq("10"), col: GREEN, pulse: false } : l)) },
  }),

  // 4024/11/M/J/23 Q21
  watch("s23", "Rectangle $ABCD$ is similar to rectangle $PQRS$.", S => { s23Board(S); look(S) }, 2.4),
  watch("s23-q", "Let's find the shaded area.", S => { s23Board(S, { pulse: true }); look(S) }, 2.0),
  askNum("s23-big", "First, what is the area of $ABCD$?", S => s23Board(S), {
    lead: "\\text{Area of } ABCD", answer: 108, unit: "cm^2",
    slips: [{ v: 21, say: "That's $12 + 9$. The area of a rectangle is length times width." }, { v: 42, say: "That's the four sides added up. The area is length times width." }],
    walk: [{ say: "The area of a rectangle is length times width: $12$ by $9$.", tex: "12 \\times 9", show: S => { glowS(S, ["ABCD", "A", "B"], ["ABCD", "B", "C"]); pulseS(S, ["ABCD", "A", "B"], ["ABCD", "B", "C"]) } }],
  }),
  tapSides("s23-pq", "Which side of $ABCD$ matches $PQ$? Tap it.", S => { s23Board(S); S.sideCol[sideKey("PQRS", "P", "Q")] = BLUE }, {
    want: ["ABCD:AB"], among: ["ABCD:AB", "ABCD:BC", "ABCD:CD", "ABCD:DA"], col: BLUE,
    notes: { "ABCD:BC": "Match the letters: $P$ goes with $A$, and $Q$ with $B$.", "ABCD:CD": "Match the letters: $P$ goes with $A$, and $Q$ with $B$.", "ABCD:DA": "Match the letters: $P$ goes with $A$, and $Q$ with $B$." },
    wrong: "Match the letters: $P$ goes with $A$, and $Q$ with $B$.",
  }),
  askNum("s23-k", "What is the scale factor from $PQRS$ to $ABCD$?", S => s23Board(S, { col1: true }), {
    lead: "\\text{Scale factor}", answer: 1.5, above: bigArea,
    slips: [{ v: 4, say: "That's $12 - 8$. How many times bigger is $12$ than $8$?" }, { v: 0.67, say: "That's $8 \\div 12$. Divide the big side by the small side." }],
    walk: [
      { say: "$AB$ is $12$, and its matching side $PQ$ is $8$.", tex: "8 \\to 12", show: S => { glowS(S, ["ABCD", "A", "B"], ["PQRS", "P", "Q"]); pulseS(S, ["ABCD", "A", "B"], ["PQRS", "P", "Q"]) } },
      { say: "Divide the big side by the small side.", tex: "12 \\div 8", show: S => pulseS(S, ["ABCD", "A", "B"]) },
    ],
  }),
  askNum("s23-af", "What is the area factor?", S => s23Board(S, { col1: true }), {
    lead: "\\text{Area factor}", answer: 2.25,
    above: () => lines(bigArea(), row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "1.5")])),
    slips: [{ v: 3, say: "That's $1.5 \\times 2$. Squared means $1.5 \\times 1.5$." }, { v: 1.5, say: "That's the scale factor. Square it." }],
    walk: [{ say: "The area factor is the scale factor squared.", tex: "1.5 \\times 1.5", show: S => glowS(S, ["ABCD", "A", "B"], ["PQRS", "P", "Q"]) }],
  }),
  askNum("s23-small", "$PQRS$ is the small one. What is its area?", S => s23Board(S, { col1: true, small: "?" }), {
    lead: "\\text{Area of } PQRS", answer: 48, unit: "cm^2",
    above: () => lines(bigArea(), row([atom("afl", "\\text{Area factor}"), op("afe", "="), atom("afv", "2.25")])),
    slips: [{ v: 243, say: "That's $108 \\times 2.25$. $PQRS$ is the small one, so divide." }, { v: 72, say: "That's $108 \\div 1.5$, the scale factor. An area uses the area factor." }],
    walk: [{ say: "$ABCD$ is $108$. $PQRS$ is the small one, so divide.", tex: "108 \\div 2.25", show: S => { glowAll(S, "PQRS", ["P", "Q", "R", "S"]); pulseIn(S, "PQRS") } }],
    then: S => { S.inLabs = S.inLabs.map(l => (l.sh === "PQRS" ? { ...l, tex: sq("48"), col: GREEN, pulse: false } : l)) },
  }),
  askNum("s23-shade", "So what is the shaded area?", S => s23Board(S, { col1: true, small: "48", pulse: true }), {
    lead: "\\text{Shaded area}", answer: 60, unit: "cm^2",
    above: () => lines(bigArea(), row([atom("pal", "\\text{Area of } PQRS"), op("pae", "="), atom("pav", sq("48"))])),
    slips: [{ v: 156, say: "That's $108 + 48$. The shaded part is $ABCD$ with $PQRS$ taken out." }],
    walk: [{ say: "The shaded part is $ABCD$ with $PQRS$ taken out.", tex: "108 - 48", show: S => { glowAll(S, "ABCD", ["A", "B", "C", "D"]); pulseIn(S, "PQRS") } }],
    keys: [["1", "2", "3", "4", "5", "back"], ["6", "7", "8", "9", "0", "."], ["+", "−", "go"]],
  }),
]

// ── 3. How volumes grow ──────────────────────────────────────────────────

const PART_3: Beat[] = [
  watch("cube", "Here is a cube. Each edge is $1$ cm.", S => { growBoard(S, { cube: true }); look(S) }, 2.2),
  watch("cube-v", "Its volume is $1\\text{ cm}^3$.", S => { growBoard(S, { cube: true, cubes: 1 }); S.eqFn = () => row([atom("vl", "\\text{Volume}"), op("ve", "="), atom("vv", cu("1"))]); look(S, ["eq"]) }, 2.2),
  makeBeat("cube-2", "Make it $2$ times as big.", 1, 2, true),
  countBeat("cube-8", "How many $1$ cm cubes fit inside?", 2, true, [
    { v: 4, say: "That's one layer. How many layers are there?" },
    { v: 6, say: "A cube has $6$ faces, but count the cubes inside." },
  ]),
  makeBeat("cube-3", "Now make it $3$ times as big.", 2, 3, true),
  countBeat("cube-27", "How many cubes now?", 3, true, [
    { v: 9, say: "That's one layer. How many layers are there?" },
    { v: 18, say: "That's two layers. Count all the layers." },
  ]),
  watch("cube-x8", "Scale factor $2$: the volume is multiplied by $8$.", S => {
    growBoard(S, { k: 2, cube: true, cubes: 8 })
    S.eqFn = () => row([atom("a", `${c(BLUE, "2")} \\times ${c(BLUE, "2")} \\times ${c(BLUE, "2")}`), op("e", "="), atom("b", c(ORANGE, "8"))])
    look(S, ["eq"])
  }, 2.6),
  watch("cube-x27", "Scale factor $3$: the volume is multiplied by $27$.", S => {
    growBoard(S, { k: 3, cube: true, cubes: 27 })
    S.eqFn = () => row([atom("a", `${c(BLUE, "3")} \\times ${c(BLUE, "3")} \\times ${c(BLUE, "3")}`), op("e", "="), atom("b", c(ORANGE, "27"))])
    look(S, ["eq"])
  }, 2.6),
  watch("vf", "The volume is multiplied by the scale factor cubed. This is the *volume factor*.", S => {
    growBoard(S, { k: 3, cube: true, cubes: 27 })
    S.eqFn = () => row([atom("a", `\\text{Volume factor}`, { col: ORANGE }), op("e", "="), atom("b", `(\\text{scale factor})^3`, { col: BLUE })])
    look(S, ["eq"])
  }, 3.2),
  watch("both", "Lengths use the scale factor. Areas use it squared. Volumes use it cubed.", S => {
    growBoard(S, { k: 3, cube: true, cubes: 27 })
    S.eqFn = () => atom("card", [
      "\\begin{array}{rl}",
      `\\text{Lengths:} & \\times\\, ${c(BLUE, "\\text{scale factor}")} \\\\`,
      `\\text{Areas:} & \\times\\, (${c(BLUE, "\\text{scale factor}")})^2 \\\\`,
      `\\text{Volumes:} & \\times\\, (${c(BLUE, "\\text{scale factor}")})^3`,
      "\\end{array}",
    ].join(" "))
    look(S, ["eq"])
  }, 3.6),
]

// ── 4. Volumes in exam questions ─────────────────────────────────────────

/** The prism with an isosceles cross-section, 13, 13 and 10, 3 long (4024/11/O/N/25 Q17), and one twice its size. */
const PR: Record<string, Vec> = { A: [0, 0], B: [10, 0], C: [5, 12] }
function prBoard(S: Scene, o: { big?: boolean; x?: string; small?: string; bigV?: string } = {}) {
  resetBeat(S)
  const shapes: ShapeSpec[] = [tri("P1", PR, ["A", "B", "C"], {}, {}, { depth: 3 })]
  if (o.big) shapes.push(tri("P2", PR, ["A", "B", "C"], {}, tall(S) ? { y: -27, k: 2 } : { x: 15, k: 2 }, { depth: 3 }))
  setShapes(S, shapes)
  S.sideLabs = [
    { sh: "P1", a: "A", b: "B", tex: "10" }, { sh: "P1", a: "C", b: "A", tex: "13" }, { sh: "P1", a: "B", b: "C", tex: "13" },
    { sh: "P1", a: "B", b: "B'", tex: "3" },
  ]
  if (o.big) S.sideLabs.push({ sh: "P2", a: "A", b: "B", tex: o.x ?? "x", col: o.x ? GREEN : PINK, pulse: !o.x })
  S.inLabs = [{ sh: "P1", tex: o.small ?? cu("180"), dy: 0.6 }]
  if (o.big) S.inLabs.push({ sh: "P2", tex: o.bigV ?? cu("1440"), dy: 0.6 })
}

/** Two similar mugs, 270 ml and 640 ml, the large one 8 cm wide (4024/12/O/N/24 Q19). */
const MUG_S: Record<string, Vec> = { A: [0, 0], B: [6, 0], C: [6, 7.5], D: [0, 7.5] }
function mugBoard(S: Scene, o: { ml?: boolean; w?: string; colW?: boolean } = {}) {
  resetBeat(S)
  setShapes(S, [
    tri("M1", MUG_S, ["A", "B", "C", "D"], {}, {}, { mug: true }),
    tri("M2", MUG_S, ["A", "B", "C", "D"], {}, tall(S) ? { y: -15, k: 4 / 3 } : { x: 11, k: 4 / 3 }, { mug: true }),
  ])
  S.sideLabs = [
    { sh: "M1", a: "A", b: "B", tex: o.w ?? "w\\text{ cm}", col: o.w ? GREEN : PINK, pulse: !o.w },
    { sh: "M2", a: "A", b: "B", tex: "8\\text{ cm}" },
  ]
  if (o.colW) { S.sideCol[sideKey("M1", "A", "B")] = BLUE; S.sideCol[sideKey("M2", "A", "B")] = BLUE }
  if (o.ml) S.inLabs = [{ sh: "M1", tex: "270\\text{ ml}", dy: 0.4 }, { sh: "M2", tex: "640\\text{ ml}", dy: 0.4 }]
  // the handles and round tops stand outside the rectangles
  S.frame = tall(S) ? { x0: -0.8, y0: -16.6, x1: 12, y1: 9.4 } : { x0: -0.8, y0: -1.6, x1: 23.6, y1: 11.6 }
}

/** Prisms A and B with a pentagon cross-section (4024/11/M/J/24 Q21): A is 50 long; B is 0.4 of its size. */
const PENT: Record<string, Vec> = { A: [0, 4.2], B: [2.2, 1.2], C: [6.5, 0], D: [9.5, 4.8], E: [4.5, 8] }
const PENT_ORDER = ["A", "B", "C", "D", "E"]
/** drawn about three times as long as it is wide, as on the paper */
const PX_LEN = 30
function pxBoard(S: Scene, o: { areaA?: string; areaB?: string; lenB?: string } = {}) {
  resetBeat(S)
  const shade = { fill: CHALK, fillOp: 0.3 }
  setShapes(S, [
    tri("PA", PENT, PENT_ORDER, {}, {}, { depth: PX_LEN, ...shade }),
    tri("PB", PENT, PENT_ORDER, {}, { ...(tall(S) ? { x: 4, y: -10 } : { x: 24, y: 4 }), k: 0.4 }, { depth: PX_LEN, ...shade }),
  ])
  S.sideLabs = [{ sh: "PA", a: "C", b: "C'", tex: "50\\text{ cm}" }]
  if (o.lenB) S.sideLabs.push({ sh: "PB", a: "C", b: "C'", tex: o.lenB, col: o.lenB === "?" ? PINK : GREEN, pulse: o.lenB === "?" })
  S.inLabs = []
  if (o.areaA) S.inLabs.push({ sh: "PA", tex: o.areaA, col: o.areaA === "?" ? PINK : CHALK, pulse: o.areaA === "?" })
  if (o.areaB) S.inLabs.push({ sh: "PB", tex: o.areaB, col: CHALK, loc: [2, -5] })
}
const pxNote = () => row([atom("pa", "\\text{Volume of } A"), op("pe", "="), atom("pv", cu("5000"))])

const PART_4: Beat[] = [
  // 4024/11/O/N/25 Q17(b)
  watch("pr", "This prism has a volume of $180\\text{ cm}^3$.", S => { prBoard(S); look(S) }, 2.4),
  watch("pr2", "A similar prism has a volume of $1440\\text{ cm}^3$. Its base is $x$ cm.", S => { prBoard(S, { big: true }); look(S) }, 3.2),
  askNum("pr-vf", "What is the volume factor?", S => prBoard(S, { big: true }), {
    lead: "\\text{Volume factor}", answer: 8,
    slips: [{ v: 1260, say: "That's $1440 - 180$. How many times bigger is $1440$ than $180$?" }],
    walk: [{ say: "How many times bigger is the big volume? Divide.", tex: "1440 \\div 180", show: S => pulseIn(S, "P1", "P2") }],
  }),
  askNum("pr-k", "The volume factor is the scale factor cubed. What is the scale factor?", S => prBoard(S, { big: true }), {
    lead: "\\text{Scale factor}", answer: 2,
    above: () => row([atom("vfl", "\\text{Volume factor}"), op("vfe", "="), atom("vfv", "8")]),
    slips: [
      { v: 2.67, say: "That's $8 \\div 3$. Cubed means a number times itself, three times." },
      { v: 4, say: "$4 \\times 4 \\times 4 = 64$. Try a smaller number." },
    ],
    walk: [
      { say: "The scale factor is how many times longer the big prism is. Which number times itself three times makes $8$?", tex: "? \\times ? \\times ? = 8", show: S => glowS(S, ["P1", "A", "B"], ["P2", "A", "B"]) },
      { say: "Try $2$.", tex: "2 \\times 2 \\times 2 = 8", show: S => pulseS(S, ["P1", "A", "B"], ["P2", "A", "B"]) },
    ],
  }),
  askNum("pr-x", "So what is $x$?", S => prBoard(S, { big: true }), {
    lead: "x", answer: 20,
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "2")]),
    slips: [{ v: 80, say: "That's $10 \\times 8$, the volume factor. A length uses the scale factor." }, { v: 5, say: "That's $10 \\div 2$. The big prism's base is longer, so multiply." }],
    walk: [
      { say: "$x$ matches the small prism's base, $10$ cm.", tex: "10 \\to x", show: S => { glowS(S, ["P1", "A", "B"]); pulseS(S, ["P1", "A", "B"]) } },
      { say: "The big prism is the bigger one, so multiply by the scale factor.", tex: "10 \\times 2", show: S => { glowS(S, ["P1", "A", "B"], ["P2", "A", "B"]); pulseS(S, ["P2", "A", "B"]) } },
    ],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "P2" ? { ...l, tex: "20", col: GREEN, pulse: false } : l)) },
  }),

  // 4024/12/O/N/24 Q19
  watch("mug", "These two mugs are similar.", S => { mugBoard(S); look(S) }, 2.0),
  watch("mug-ml", "The small one holds $270$ ml. The large one holds $640$ ml.", S => { mugBoard(S, { ml: true }); look(S) }, 3.0),
  askNum("mug-vf", "What is the volume factor?", S => mugBoard(S, { ml: true }), {
    lead: "\\text{Volume factor}", answer: 640 / 270, sf: 3, shownTex: "\\dfrac{640}{270}", typed: "640÷270",
    slips: [{ v: 370, say: "That's $640 - 270$. How many times bigger is $640$ than $270$?" }, { v: 0.42, say: "That's $270 \\div 640$. Divide the big one by the small one." }],
    walk: [{ say: "Divide the big volume by the small one.", tex: "640 \\div 270", show: S => pulseIn(S, "M1", "M2") }],
  }),
  watch("mug-64", "$640 \\div 270$ is the same as $64 \\div 27$.", S => {
    mugBoard(S, { ml: true })
    S.eqFn = () => row([atom("vfl", "\\text{Volume factor}"), op("vfe", "="), frac("f1", atom("n1", "640"), atom("d1", "270")), op("e2", "="), frac("f2", atom("n2", "64", { col: ORANGE }), atom("d2", "27", { col: ORANGE }))])
    look(S, ["eq"])
  }, 3.0),
  askNum("mug-4", "Which number cubed makes $64$?", S => mugBoard(S, { ml: true }), {
    lead: "\\text{Number}", answer: 4,
    above: () => row([atom("q", "? \\times ? \\times ? = 64")]),
    slips: [{ v: 8, say: "$8 \\times 8 = 64$, but cubed needs three of them: $8 \\times 8 \\times 8$ is far more." }, { v: 21.33, say: "That's $64 \\div 3$. Cubed means a number times itself, three times." }],
    walk: [{ say: "Try $4$.", tex: "4 \\times 4 \\times 4", show: S => pulseIn(S, "M2") }],
  }),
  askNum("mug-3", "And which number cubed makes $27$?", S => mugBoard(S, { ml: true }), {
    lead: "\\text{Number}", answer: 3,
    above: () => row([atom("q", "? \\times ? \\times ? = 27")]),
    slips: [{ v: 9, say: "That's $27 \\div 3$. Which number times itself three times makes $27$?" }],
    walk: [{ say: "Try $3$.", tex: "3 \\times 3 \\times 3", show: S => pulseIn(S, "M1") }],
  }),
  watch("mug-k", "So the scale factor is $4 \\div 3$.", S => {
    mugBoard(S, { ml: true, colW: true })
    S.eqFn = () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), frac("f", atom("n", "4", { col: BLUE }), atom("d", "3", { col: BLUE }))])
    look(S, ["eq"])
  }, 2.6),
  askNum("mug-w", "The large mug is $8$ cm wide. What is $w$?", S => mugBoard(S, { ml: true, colW: true }), {
    lead: "w", answer: 6,
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "\\tfrac{4}{3}")]),
    slips: [
      { v: 10.67, say: "That's $8 \\times \\tfrac{4}{3}$. $w$ is on the small mug, so divide." },
      { v: 3.38, say: "That's $8 \\div 2.37$, the volume factor. A width uses the scale factor." },
    ],
    walk: [
      { say: "$w$ matches the large mug's $8$ cm. It's on the small mug, so divide.", tex: "8 \\div \\tfrac{4}{3}", show: S => { glowS(S, ["M1", "A", "B"], ["M2", "A", "B"]); pulseS(S, ["M2", "A", "B"]) } },
      { say: "Dividing by $\\tfrac{4}{3}$ is the same as $\\div 4$, then $\\times 3$.", tex: "8 \\div 4 \\times 3", show: S => pulseS(S, ["M1", "A", "B"]) },
    ],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "M1" ? { ...l, tex: "6\\text{ cm}", col: GREEN, pulse: false } : l)) },
  }),

  // 4024/11/M/J/24 Q21
  watch("px", "Prisms $A$ and $B$ are similar. Prism $A$ is $50$ cm long.", S => { pxBoard(S); look(S) }, 2.6),
  watch("px-v", "Prism $A$ has a volume of $5000\\text{ cm}^3$.", S => { pxBoard(S); S.eqFn = pxNote; look(S, ["eq"]) }, 2.4),
  askNum("px-a", "What is the area of its cross-section?", S => pxBoard(S, { areaA: "?" }), {
    lead: "\\text{Cross-section}", answer: 100, unit: "cm^2",
    above: pxNote,
    slips: [{ v: 250000, say: "That's $5000 \\times 50$. The volume is the cross-section times the length, so divide." }],
    walk: [
      { say: "A prism's volume is its cross-section times its length, $50$.", tex: "\\text{Volume} = \\text{cross-section} \\times \\text{length}", show: S => { glowS(S, ["PA", "C", "C'"]); pulseS(S, ["PA", "C", "C'"]) } },
      { say: "So divide the volume by the length.", tex: "5000 \\div 50", show: S => { S.sideGlow = new Set(); pulseS(S); pulseIn(S, "PA") } },
    ],
    then: S => { S.inLabs = [{ sh: "PA", tex: sq("100"), col: GREEN }] },
  }),
  watch("px-b", "Prism $B$'s cross-section is $16\\text{ cm}^2$.", S => { pxBoard(S, { areaA: sq("100"), areaB: sq("16") }); look(S) }, 2.6),
  askNum("px-af", "What is the area factor?", S => pxBoard(S, { areaA: sq("100"), areaB: sq("16") }), {
    lead: "\\text{Area factor}", answer: 6.25,
    slips: [{ v: 84, say: "That's $100 - 16$. How many times bigger is $100$ than $16$?" }, { v: 0.16, say: "That's $16 \\div 100$. Divide the big one by the small one." }],
    walk: [{ say: "Divide the big area by the small one.", tex: "100 \\div 16", show: S => pulseIn(S, "PA", "PB") }],
  }),
  askNum("px-k", "The area factor is the scale factor squared. What is the scale factor?", S => pxBoard(S, { areaA: sq("100"), areaB: sq("16") }), {
    lead: "\\text{Scale factor}", answer: 2.5, keys: ROOT_KEYS, typed: "√6.25",
    above: () => row([atom("afl", "\\text{Area factor}"), op("afe", "="), atom("afv", "6.25")]),
    slips: [{ v: 3.13, say: "That's $6.25 \\div 2$. Squared means a number times itself. Use $\\sqrt{\\;}$." }, { v: 39.06, say: "That's $6.25^2$. Go back the other way: square root." }],
    walk: [{ say: "Which number times itself makes $6.25$? That is its square root.", tex: "\\sqrt{6.25}", show: S => pulseIn(S, "PA", "PB") }],
  }),
  askNum("px-len", "So how long is prism $B$?", S => pxBoard(S, { areaA: sq("100"), areaB: sq("16"), lenB: "?" }), {
    lead: "\\text{Length of } B", answer: 20, unit: "cm",
    above: () => row([atom("sfl", "\\text{Scale factor}"), op("sfe", "="), atom("sfv", "2.5")]),
    slips: [
      { v: 125, say: "That's $50 \\times 2.5$. $B$ is the small one, so divide." },
      { v: 8, say: "That's $50 \\div 6.25$, the area factor. A length uses the scale factor." },
    ],
    walk: [{ say: "$A$ is $50$ cm long. $B$ is the small one, so divide.", tex: "50 \\div 2.5", show: S => { glowS(S, ["PA", "C", "C'"], ["PB", "C", "C'"]); pulseS(S, ["PA", "C", "C'"]) } }],
    then: S => { S.sideLabs = S.sideLabs.map(l => (l.sh === "PB" ? { ...l, tex: "20\\text{ cm}", col: GREEN, pulse: false } : l)) },
  }),

  {
    id: "end",
    say: "In summary, areas are multiplied by the scale factor squared, and volumes by the scale factor cubed.",
    enter: S => { growBoard(S, { k: 3, cube: true, cubes: 27 }); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["sq", "How areas grow"],
  ["w25", "Areas in exam questions"],
  ["cube", "How volumes grow"],
  ["pr", "Volumes in exam questions"],
])

