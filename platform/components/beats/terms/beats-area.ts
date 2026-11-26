/**
 * Perimeter and area (5.2), one tiny idea per beat, on the terms board.
 *
 * Perimeter: a walker goes round a rectangle and each side adds on. Area:
 * the student drags a corner to make a rectangle on a 1 cm grid, counts its
 * squares, sees the rows, and makes one of a given area (any way round).
 * A triangle is half a rectangle (one half turns onto the other; any
 * triangle's two pieces turn into the rest of its rectangle), and its top
 * corner slides without changing the area. A parallelogram has a triangle
 * cut off one end and slid to the other: a rectangle. Two copies of a
 * trapezium, one turned half a turn, make a parallelogram with base a + b.
 * Questions from 4024/12/M/J/24 Q5, 4024/12/O/N/24 Q17(b),
 * 4024/11/M/J/14 Q3 and 4024/13/M/J/25 Q13.
 *
 * Colours: a base, a length and the parallel sides blue; a height and a
 * width orange (a height dashed, with its right angle); an unknown pink; a
 * total green; what can be dragged yellow.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { atom, row, op, paren, type ENode } from "../equation"
import { type Scene, type FreeLab, type CrossState, BLUE, ORANGE, GREEN, PINK, CHALK, YELLOW, P, place, say, startCross, crossDone, labelWidth, add, dist, lerpV } from "./scene"
import { type Beat, look, watch, c, cm, cm2, HALF, board, edgeLab, mid, segTaps, tapBeat, ask, glide, turned, glowOn, pulseLabs, pulseShades, putLab } from "./kit"

// ── 1. Perimeter ─────────────────────────────────────────────────────────

const RECT: Record<string, Vec> = { A: [0, 0], B: [5, 0], C: [5, 3], D: [0, 3] }

function perimBoard(S: Scene) {
  board(S, [-1.4, -1.4, 6.4, 4.4], [-1, -1, 6, 4])
  place(S, RECT)
  S.polys = [{ id: "r", pts: ["A", "B", "C", "D"] }]
  const cen = mid(RECT.A, RECT.C)
  S.freeLabs = [edgeLab("ab", RECT.A, RECT.B, cm(5), CHALK, cen), edgeLab("bc", RECT.B, RECT.C, cm(3), CHALK, cen), edgeLab("cd", RECT.C, RECT.D, cm(5), CHALK, cen), edgeLab("da", RECT.D, RECT.A, cm(3), CHALK, cen)]
}

/** A walker goes round the corners; each side it walks lights green and joins the sum below. */
function walkRound(S: Scene, corners: string[], sides: string[], total: string) {
  place(S, { W: P(S, corners[0]) })
  S.pts.W.D = P(S, corners[0])
  S.vals.walked = 0
  S.dots = [{ pt: "W", col: YELLOW, r: 6 }]
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length]
    S.acts.push({ dur: i ? 0.3 : 0.8 }, {
      dur: 0.22 * dist(P(S, a), P(S, b)) + 0.4,
      begin: S2 => { S2.segs.push({ id: `w${i}`, a, b: "W", col: GREEN, w: 4 }) },
      run: (S2, e) => { const q = lerpV(P(S2, a), P(S2, b), e); S2.pts.W.p = q; S2.pts.W.D = q },
      end: S2 => { S2.segs = S2.segs.map(s => (s.id === `w${i}` ? { ...s, b } : s)); S2.vals.walked = i + 1 },
    })
  })
  S.acts.push({ dur: 0.2, end: S2 => { S2.dots = [] } })
  S.eqFn = S2 => {
    const k = S2.vals.walked ?? 0
    if (!k) return null
    const items: ENode[] = []
    for (let i = 0; i < k; i++) { if (i) items.push(op(`p${i}`, "+")); items.push(atom(`s${i}`, sides[i])) }
    if (k === sides.length) items.push(op("pe", "="), atom("pt", cm(total), { col: GREEN }))
    return row(items)
  }
}

/** 4024/12/M/J/24 Q5(a): a parallelogram, 11 along the top and 6 up the left side. */
const PQ: Record<string, Vec> = { P1: [0, 0], P2: [11, 0], P3: [13.1, 5.62], P4: [2.1, 5.62] }
function pqBoard(S: Scene, o: { bottom?: boolean; right?: boolean } = {}) {
  board(S, [-1.8, -1.6, 14.6, 7.2])
  place(S, PQ)
  const cen = mid(PQ.P1, PQ.P3)
  // its equal sides (ticks) and parallel sides (arrows) marked
  S.polys = [{ id: "pq", pts: ["P1", "P2", "P3", "P4"], marks: true }]
  S.freeLabs = [edgeLab("top", PQ.P4, PQ.P3, "11", CHALK, cen), edgeLab("lft", PQ.P1, PQ.P4, "6", CHALK, cen)]
  if (o.bottom) S.freeLabs.push(edgeLab("bot", PQ.P1, PQ.P2, "11", BLUE, cen))
  if (o.right) S.freeLabs.push(edgeLab("rgt", PQ.P2, PQ.P3, "6", BLUE, cen))
  S.taps = segTaps([["top", "P4", "P3"], ["bot", "P1", "P2"], ["lft", "P1", "P4"], ["rgt", "P2", "P3"]])
}

const PART_1: Beat[] = [
  {
    id: "perim",
    say: "Perimeter is the distance all the way round.",
    enter: S => { perimBoard(S); walkRound(S, ["A", "B", "C", "D"], ["5", "3", "5", "3"], "16"); look(S, ["eq"]) },
    cta: "", ctaAfter: 6.6,
  },
  watch("q5a-look", "Opposite sides of a parallelogram are equal.", S => { pqBoard(S); look(S) }, 2.4),
  tapBeat("q5a-11", "The top is $11$ cm. Tap the other side that is $11$ cm.", S => pqBoard(S), {
    want: "bot", wrong: "Look for the side across from the top.",
    notes: { top: "That's the top itself. Tap the side across from it.", lft: "That one is $6$ cm. Tap the side across from the top.", rgt: "That one is across from the $6$. Tap the side across from the top." },
    then: S => { S.freeLabs.push(edgeLab("bot", PQ.P1, PQ.P2, "11", BLUE, mid(PQ.P1, PQ.P3))) },
  }),
  tapBeat("q5a-6", "Now tap the other side that is $6$ cm.", S => pqBoard(S, { bottom: true }), {
    want: "rgt", wrong: "Look for the side across from the $6$.",
    notes: { lft: "That's the $6$ itself. Tap the side across from it.", top: "That one is $11$ cm.", bot: "That one is $11$ cm." },
    then: S => { S.freeLabs.push(edgeLab("rgt", PQ.P2, PQ.P3, "6", BLUE, mid(PQ.P1, PQ.P3))) },
  }),
  // 4024/12/M/J/24 Q5(a)
  ask("q5a", "Find the perimeter of the parallelogram.", S => pqBoard(S, { bottom: true, right: true }), {
    lead: "\\text{Perimeter}", unit: "cm", answer: 34,
    slips: [
      { v: 17, say: "That's two sides. There are four." },
      { v: 66, say: "That's $11 \\times 6$. Perimeter adds the sides all the way round." },
    ],
    walk: [
      { say: "Go round the shape, one side at a time.", tex: "11 + 6", show: S => { S.segs = [{ id: "g1", a: "P4", b: "P3", col: GREEN, w: 4 }, { id: "g2", a: "P3", b: "P2", col: GREEN, w: 4 }] } },
      { say: "Then along the bottom and up the left side.", tex: "11 + 6 + 11 + 6", show: S => { S.segs.push({ id: "g3", a: "P2", b: "P1", col: GREEN, w: 4 }, { id: "g4", a: "P1", b: "P4", col: GREEN, w: 4 }) } },
    ],
  }),
]

// ── 2. Area of a rectangle ───────────────────────────────────────────────

/** The grid rectangles are made on: corner A at the origin, C dragged onto grid points. */
const RG: [number, number, number, number] = [0, 0, 12, 6]

/** A rectangle w by h from the origin, its length blue along the bottom and its width orange up the left; C draggable. */
function rectBoard(S: Scene, w: number, h: number, o: { drag?: boolean; words?: boolean; cells?: number } = {}) {
  // close round a still rectangle; the whole grid while a corner can move
  if (o.drag) board(S, [-1.6, -1.4, 12.6, 6.6], RG)
  else board(S, [-1.8, -1.4, w + 1.8, h + 1.2], [-1, -1, w + 1, h + 1])
  place(S, { A: [0, 0], B: [w, 0], C: [w, h], D: [0, h] })
  S.polys = [{ id: "r", pts: ["A", "B", "C", "D"] }]
  S.segs = [{ id: "len", a: "A", b: "B", col: BLUE, w: 3.4 }, { id: "wid", a: "A", b: "D", col: ORANGE, w: 3.4 }]
  if (o.cells !== undefined) S.cells = [{ id: "c", x0: 0, y0: 0, nx: w, ny: h, lit: o.cells, col: BLUE }]
  // B and D follow C, so it stays a rectangle; its sides say how long they are
  S.tick = S2 => {
    const C = S2.pts.C
    S2.pts.B.p = [C.p[0], 0]; S2.pts.B.D = [C.D[0], 0]
    S2.pts.D.p = [0, C.p[1]]; S2.pts.D.D = [0, C.D[1]]
    const L = Math.round(C.p[0]), H = Math.round(C.p[1]), cen = mid(S2.pts.A.D, C.D)
    S2.freeLabs = [
      ...S2.freeLabs.filter(f => f.key !== "len" && f.key !== "wid"),
      edgeLab("len", S2.pts.A.D, S2.pts.B.D, o.words ? "\\text{length}" : cm(L), BLUE, cen),
      edgeLab("wid", S2.pts.A.D, S2.pts.D.D, o.words ? "\\text{width}" : cm(H), ORANGE, cen),
    ]
  }
  if (o.drag) S.handles = [{ id: "C", kind: "point", pt: "C", grid: true, ok: S2 => { const q = P(S2, "C"); return q[0] >= 1 && q[1] >= 1 && q[0] <= RG[2] && q[1] <= RG[3] } }]
}
const sizeOf = (S: Scene): [number, number] => [Math.round(P(S, "C")[0]), Math.round(P(S, "C")[1])]

/** The rows of a rectangle light one at a time, the running count at the end of each. */
function lightRows(S: Scene, w: number, h: number, wait = 0.6) {
  for (let r = 0; r < h; r++) {
    S.acts.push({ dur: r ? 0.45 : wait }, {
      dur: 0.5,
      run: (S2, e) => { if (S2.cells[0]) S2.cells[0].lit = Math.round(r * w + w * e) },
      end: S2 => { S2.freeLabs.push({ key: `row${r}`, at: [w, h - r - 0.5], tex: String((r + 1) * w), col: BLUE, dx: 22 }) },
    })
  }
}

const PART_2: Beat[] = [
  {
    id: "make",
    say: "Drag the corner to make a rectangle $5$ cm long and $3$ cm high.",
    enter: S => {
      rectBoard(S, 2, 2, { drag: true })
      // stood on its end: a word, once each time it is let go that way
      const base = S.tick!
      S.tick = S2 => {
        base(S2)
        const [w, h] = sizeOf(S2)
        if (S2.drag || w !== 3 || h !== 5) { S2.got.delete("tall"); return }
        if (S2.got.has("tall")) return
        S2.got.add("tall")
        say(S2, "That's $3$ long and $5$ high. Make it $5$ long and $3$ high.", "wrong", 4)
      }
      look(S)
    },
    done: S => !S.drag && sizeOf(S)[0] === 5 && sizeOf(S)[1] === 3,
    advanceAfter: 1600,
  },
  ask("count", "How many $1$ cm squares are inside it?", S => rectBoard(S, 5, 3, { cells: 0 }), {
    lead: "\\text{Squares}", answer: 15,
    slips: [
      { v: 16, say: "That's the perimeter, the distance round. Area counts the squares inside." },
      { v: 8, say: "That adds two sides. Count the squares inside." },
    ],
    walk: [
      { say: "Count the squares in the top row.", tex: "5", show: S => { if (S.cells[0]) S.cells[0].lit = 5 } },
      { say: "Every row has the same number. Count the rows.", tex: "5 + 5 + 5", show: S => { if (S.cells[0]) S.cells[0].lit = 15 } },
    ],
  }),
  {
    id: "rows",
    say: "It's $3$ rows of $5$, so the area is $5 \\times 3 = 15$ cm$^2$.",
    enter: S => {
      rectBoard(S, 5, 3, { cells: 0 })
      lightRows(S, 5, 3)
      S.eqFn = S2 => ((S2.cells[0]?.lit ?? 0) < 15 ? null : row([atom("a", "\\text{Area}"), op("e", "="), atom("l", "5", { col: BLUE }), op("x", "\\times"), atom("w", "3", { col: ORANGE }), op("e2", "="), atom("t", cm2(15), { col: GREEN })]))
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.6,
  },
  watch("rect-formula", "Area of a rectangle $=$ length $\\times$ width.", S => {
    rectBoard(S, 5, 3, { words: true })
    S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("l", "\\text{length}", { col: BLUE }), op("x", "\\times"), atom("w", "\\text{width}", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.6),
  {
    id: "make12",
    say: "Now make a rectangle with an area of $12$ cm$^2$.",
    enter: S => {
      rectBoard(S, 5, 3, { drag: true })
      S.eqFn = S2 => {
        const [L, H] = sizeOf(S2)
        return row([atom("a", "\\text{Area}"), op("e", "="), atom("l", String(L), { col: BLUE }), op("x", "\\times"), atom("w", String(H), { col: ORANGE }), op("e2", "="), atom("t", cm2(L * H), L * H === 12 ? { col: GREEN } : {})])
      }
      // every rectangle of 12 counts; a second one gets its own word
      const base = S.tick!
      S.tick = S2 => {
        base(S2)
        if (S2.drag) return
        const [L, H] = sizeOf(S2)
        if (L * H !== 12 || S2.got.has(`r${L}x${H}`)) return
        S2.got.add(`r${L}x${H}`)
        S2.flashGood = 1
        S2.touched = "r"
        say(S2, [...S2.got].filter(g => g.startsWith("r")).length === 1 ? "That works. Can you find another one?" : "That one works too.", "calm", 600)
      }
      look(S, ["eq"])
    },
    done: S => [...S.got].some(g => g.startsWith("r")), free: true, minPlay: 4,
  },
]

// ── 3. Area of a triangle ────────────────────────────────────────────────

const T6: Record<string, Vec> = { A: [0, 0], B: [6, 0], C: [6, 4], D: [0, 4] }
function halvesBoard(S: Scene) {
  board(S, [-1.2, -1.2, 7.2, 5.2], [-1, -1, 7, 5])
  place(S, T6)
  S.polys = [{ id: "r", pts: ["A", "B", "C", "D"] }]
}

/** A triangle with its base along the bottom and its top corner T; the height dashed from T. */
function triBoard(S: Scene, tx: number, o: { slide?: boolean; words?: boolean; nums?: boolean } = {}) {
  board(S, [-4.2, -1.4, 10.2, 5.4], [-4, -1, 10, 5])
  place(S, { A: [0, 0], B: [6, 0], T: [tx, 4], F: [tx, 0], L1: [-4, 4], L2: [10, 4] })
  S.polys = [{ id: "t", pts: ["A", "B", "T"] }]
  S.segs = [{ id: "base", a: "A", b: "B", col: BLUE, w: 3.4 }, { id: "h", a: "T", b: "F", col: ORANGE, dash: true }]
  if (o.slide) {
    S.segs.unshift({ id: "line", a: "L1", b: "L2", col: CHALK, dash: true, w: 1.2 })
    S.handles = [{ id: "T", kind: "slide", pts: ["T"], grab: "T", dir: [1, 0], min: -4 - tx, max: 10 - tx }]
  }
  // the foot of the height follows the top corner; past either end the base carries on, dashed, to meet it
  S.tick = S2 => {
    const T = S2.pts.T, x = T.D[0]
    S2.pts.F.p = [T.p[0], 0]; S2.pts.F.D = [x, 0]
    const end = x < 0 ? "A" : x > 6 ? "B" : null
    S2.segs = [...S2.segs.filter(s => s.id !== "ext"), ...(end ? [{ id: "ext", a: end, b: "F", col: BLUE, dash: true, w: 1.6 }] : [])]
    S2.squares = [{ at: "F", a: end ?? "B", b: "T", col: ORANGE }]
    if (Math.abs(x - 6) < 0.05) S2.squares = [{ at: "F", a: "A", b: "T", col: ORANGE }]
    const cen = mid(S2.pts.A.D, S2.pts.B.D, T.D)
    S2.freeLabs = [
      edgeLab("base", S2.pts.A.D, S2.pts.B.D, o.words ? "\\text{base}" : cm(6), BLUE, cen),
      // the height's label on the side away from the triangle (inside it, on the roomier side)
      { key: "h", at: lerpV(T.D, S2.pts.F.D, 0.5), tex: o.words ? "\\text{height}" : cm(4), col: ORANGE, dx: (x < 0 || (x > 3 && x <= 6) ? -1 : 1) * (labelWidth(o.words ? "height" : "4 cm", 20) / 2 + 12) },
    ]
  }
}

/** 4024/12/O/N/24 Q17: triangle ABC on a 1 cm grid, A(0, 1), B(4, 5), C(4, −5). */
const W24: Record<string, Vec> = { A: [0, 1], B: [4, 5], C: [4, -5], H: [4, 1] }
function w24Board(S: Scene, o: { base?: boolean; height?: boolean; taps?: boolean } = {}) {
  board(S, [-1.6, -6.4, 6.6, 6.4], [-1, -6, 6, 6], true)
  place(S, W24)
  S.names = { A: "A", B: "B", C: "C" }
  S.polys = [{ id: "abc", pts: ["A", "B", "C"], fill: CHALK, fillOp: 0.12 }]
  S.segs = []
  if (o.base) S.segs.push({ id: "bc", a: "B", b: "C", col: BLUE, w: 3.4 })
  if (o.height) { S.segs.push({ id: "h", a: "A", b: "H", col: ORANGE, dash: true }); S.squares = [{ at: "H", a: "B", b: "A", col: ORANGE }] }
  if (o.taps) S.taps = segTaps([["ab", "A", "B"], ["ac", "A", "C"], ["h", "A", "H"]])
}

const PART_3: Beat[] = [
  {
    id: "cut",
    say: "Cut a rectangle from corner to corner.",
    enter: S => {
      halvesBoard(S)
      place(S, { Q: T6.A })
      S.segs = [{ id: "diag", a: "A", b: "Q", col: CHALK }]
      glide(S, 1.2, e => ({ Q: lerpV(T6.A, T6.C, e) }), 0.6, S2 => {
        S2.polys.push({ id: "lo", pts: ["A", "B", "C"], col: BLUE, fill: BLUE, fillOp: 0.14 }, { id: "up", pts: ["A", "C", "D"], col: ORANGE, fill: ORANGE, fillOp: 0.06 })
      })
      look(S)
    },
    cta: "", ctaAfter: 2.6,
  },
  {
    id: "turn",
    say: "Turn one half round. It fits on the other exactly.",
    enter: S => {
      halvesBoard(S)
      S.segs = [{ id: "diag", a: "A", b: "C", col: CHALK }]
      const up = { U1: T6.A, U2: T6.C, U3: T6.D }
      place(S, up)
      S.polys.push({ id: "u", pts: ["U1", "U2", "U3"], fill: ORANGE, fillOp: 0.06, col: ORANGE })
      glide(S, 2.2, e => turned(up, [3, 2], 180 * e), 0.9, S2 => { S2.flashGood = 1; S2.touched = "u" })
      look(S)
    },
    cta: "", ctaAfter: 3.8,
  },
  ask("half", "This rectangle is $6 \\times 4 = 24$ cm$^2$. What is the area of one half?", S => {
    halvesBoard(S)
    S.segs = [{ id: "diag", a: "A", b: "C", col: CHALK }]
    S.polys.push({ id: "lo", pts: ["A", "B", "C"], col: BLUE, fill: BLUE, fillOp: 0.14 })
    S.freeLabs = [edgeLab("ab", T6.A, T6.B, cm(6), CHALK, [3, 2]), edgeLab("bc", T6.B, T6.C, cm(4), CHALK, [3, 2]), { key: "whole", at: [1.6, 3], tex: cm2(24), col: GREEN }]
  }, {
    lead: "\\text{Half}", unit: "cm2", answer: 12,
    slips: [{ v: 24, say: "That's the whole rectangle. Take half of it." }, { v: 48, say: "That's double. Take half of $24$." }],
    walk: [
      { say: "The line from corner to corner cuts the $24$ cm$^2$ into two halves the same size.", show: S => { S.shades = [{ id: "lo", kind: "poly", pts: ["A", "B", "C"], col: BLUE, op: 0.2, pulse: true }, { id: "up", kind: "poly", pts: ["A", "C", "D"], col: ORANGE, op: 0.06, pulse: true }]; pulseLabs(S, "whole") } },
      { say: "So one half is $24 \\div 2$.", tex: "24 \\div 2", show: S => { pulseShades(S, "lo"); pulseLabs(S) } },
    ],
  }),
  {
    id: "any",
    say: "Any triangle is half of the rectangle round it.",
    enter: S => {
      board(S, [-1.2, -1.2, 7.2, 5.2], [-1, -1, 7, 5])
      place(S, { A: [0, 0], B: [6, 0], T: [2, 4], F: [2, 0], R1: [6, 4], R2: [0, 4] })
      S.polys = [{ id: "box", pts: ["A", "B", "R1", "R2"], ghost: true }, { id: "t", pts: ["A", "B", "T"] }]
      S.segs = [{ id: "h", a: "T", b: "F", col: ORANGE, dash: true }]
      S.squares = [{ at: "F", a: "B", b: "T", col: ORANGE }]
      S.shades = [{ id: "l", kind: "poly", pts: ["A", "F", "T"], col: BLUE, op: 0.12 }, { id: "r", kind: "poly", pts: ["F", "B", "T"], col: ORANGE, op: 0.06 }]
      // each piece's copy turns half a turn about the middle of its sloping side, into the rest of the rectangle
      const left = { L1: [0, 0] as Vec, L2: [2, 0] as Vec, L3: [2, 4] as Vec }, right = { K1: [2, 0] as Vec, K2: [6, 0] as Vec, K3: [2, 4] as Vec }
      place(S, { ...left, ...right })
      S.polys.push({ id: "lc", pts: ["L1", "L2", "L3"], fill: BLUE, fillOp: 0.14, col: BLUE }, { id: "rc", pts: ["K1", "K2", "K3"], fill: ORANGE, fillOp: 0.06, col: ORANGE })
      glide(S, 1.8, e => turned(left, [1, 2], 180 * e), 1.0)
      glide(S, 1.8, e => turned(right, [4, 2], 180 * e), 0.3, S2 => { S2.flashGood = 1; S2.touched = "box" })
      look(S)
    },
    cta: "", ctaAfter: 5.8,
  },
  watch("tri-formula", `Area of a triangle $= ${HALF} \\times$ base $\\times$ height.`, S => {
    triBoard(S, 2, { words: true })
    S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("hf", HALF), op("x1", "\\times"), atom("b", "\\text{base}", { col: BLUE }), op("x2", "\\times"), atom("h", "\\text{height}", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.8),
  watch("right-angle", "The height is at right angles to the base.", S => {
    triBoard(S, 2, { words: true })
    S.squares = [{ at: "F", a: "B", b: "T", col: ORANGE, pulse: true }]
    const base = S.tick!
    S.tick = S2 => { base(S2); S2.squares = S2.squares.map(q => ({ ...q, pulse: true })) }
    look(S)
  }, 2.4),
  {
    id: "slide",
    say: "Slide the top corner along the dotted line. Watch the area.",
    enter: S => {
      triBoard(S, 2, { slide: true })
      S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("hf", HALF), op("x1", "\\times"), atom("b", "6", { col: BLUE }), op("x2", "\\times"), atom("h", "4", { col: ORANGE }), op("e2", "="), atom("t", cm2(12), { col: GREEN })])
      look(S, ["eq"])
    },
    done: S => S.moved > 160, free: true, minPlay: 5,
  },
  {
    id: "same",
    say: "The base and the height stay the same, so the area does too.",
    enter: S => {
      triBoard(S, 2)
      glide(S, 1.6, e => ({ T: [2 + 6 * e, 4] }), 0.6)
      glide(S, 2.4, e => ({ T: [8 - 10 * e, 4] }), 0.2)
      glide(S, 1.2, e => ({ T: [-2 + 4 * e, 4] }), 0.2)
      S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("hf", HALF), op("x1", "\\times"), atom("b", "6", { col: BLUE }), op("x2", "\\times"), atom("h", "4", { col: ORANGE }), op("e2", "="), atom("t", cm2(12), { col: GREEN })])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3,
  },
  watch("w24-base", "This triangle is on a $1$ cm grid. Let's use $BC$ as its base.", S => { w24Board(S, { base: true }); look(S) }, 2.4),
  // 4024/12/O/N/24 Q17(b)
  ask("w24-bc", "How long is $BC$?", S => w24Board(S, { base: true }), {
    lead: "BC", leadCol: BLUE, unit: "cm", answer: 10,
    slips: [{ v: 5, say: "That only reaches the $x$-axis. Count all the way from $C$ up to $B$." }, { v: 9, say: "Count the squares, not the grid lines." }],
    walk: [
      { say: "Count the squares from $C$ up to the $x$-axis.", tex: "5", show: S => { S.cells = [{ id: "c", x0: 3, y0: -5, nx: 1, ny: 5, lit: 5, col: BLUE }] } },
      { say: "Then keep counting up to $B$.", tex: "5 + 5", show: S => { S.cells = [{ id: "c", x0: 3, y0: -5, nx: 1, ny: 10, lit: 10, col: BLUE }] } },
    ],
  }),
  tapBeat("w24-tap", "The height meets $BC$ at right angles. Tap the height.", S => w24Board(S, { base: true, height: true, taps: true }), {
    want: "h", wrong: "Tap the dashed line.",
    notes: { ab: "That's a side. The height meets $BC$ at right angles.", ac: "That's a side. The height meets $BC$ at right angles." },
  }),
  ask("w24-h", "How long is the height?", S => w24Board(S, { base: true, height: true }), {
    lead: "\\text{height}", leadCol: ORANGE, unit: "cm", answer: 4,
    slips: [{ v: 5, say: "Count the squares from $A$ across to $BC$." }],
    walk: [
      { say: "The height goes from $A$ straight across to $BC$.", show: S => glowOn(S, "h") },
      { say: "Count the squares along it.", tex: "4", show: S => { S.cells = [{ id: "c", x0: 0, y0: 0, nx: 4, ny: 1, lit: 4, col: ORANGE }] } },
    ],
  }),
  ask("w24", "Work out the area of triangle $ABC$.", S => {
    w24Board(S, { base: true, height: true })
    S.freeLabs = [{ key: "bc", at: [4, 3], tex: cm(10), col: BLUE, dx: 40 }, { key: "h", at: [2, 1], tex: cm(4), col: ORANGE, dy: -18 }]
  }, {
    lead: "\\text{Area}", unit: "cm2", answer: 20,
    slips: [
      { v: 40, say: "That's the rectangle round it. A triangle is half of it." },
      { v: 14, say: "That adds them. Multiply the base by the height, then halve it." },
    ],
    walk: [
      { say: `Area $= ${HALF} \\times$ base $\\times$ height.`, tex: `${HALF} \\times ${c(BLUE, "10")} \\times ${c(ORANGE, "4")}`, show: S => { S.segs = S.segs.map(s => ({ ...s, glow: true })) } },
      { say: "Multiply the base by the height, then halve it for the triangle.", tex: `${c(BLUE, "10")} \\times ${c(ORANGE, "4")} \\div 2`, show: S => { glowOn(S); S.shades = [{ id: "t", kind: "poly", pts: ["A", "B", "C"], col: BLUE, op: 0.2, pulse: true }] } },
    ],
  }),
]

// ── 4. Area of a parallelogram ───────────────────────────────────────────

const PG: Record<string, Vec> = { A: [0, 0], B: [6, 0], C: [8, 4], D: [2, 4], F: [2, 0], G: [8, 0] }
/** The parallelogram, and the triangle off its left end (T1 T2 T3, its middle TG) slid `dx` to the right. */
function pgBoard(S: Scene, o: { cut?: boolean; dx?: number; slide?: boolean; words?: boolean } = {}) {
  board(S, [-1.2, -1.4, 9.2, 5.4], [-1, -1, 9, 5])
  const dx = o.dx ?? 0
  place(S, { ...PG, T1: [dx, 0], T2: [2 + dx, 0], T3: [2 + dx, 4], TG: [4 / 3 + dx, 4 / 3] })
  if (!o.cut) {
    S.polys = [{ id: "pg", pts: ["A", "B", "C", "D"] }]
    S.segs = [{ id: "base", a: "A", b: "B", col: BLUE, w: 3.4 }, { id: "h", a: "D", b: "F", col: ORANGE, dash: true }]
    S.squares = [{ at: "F", a: "B", b: "D", col: ORANGE }]
    S.freeLabs = [edgeLab("b", PG.A, PG.B, o.words ? "\\text{base}" : cm(6), BLUE, [4, 2]), { key: "h", at: [2, 2], tex: o.words ? "\\text{height}" : cm(4), col: ORANGE, dx: o.words ? 44 : 30 }]
    return
  }
  // cut: what is left, and the triangle
  S.polys = [{ id: "rest", pts: ["F", "B", "C", "D"] }, { id: "tri", pts: ["T1", "T2", "T3"], fill: BLUE, fillOp: 0.3, col: BLUE }]
  if (o.slide) S.handles = [{ id: "tri", kind: "slide", pts: ["T1", "T2", "T3", "TG"], grab: "TG", dir: [1, 0], min: 0, max: 6, snaps: [6], lock: true }]
}

/** 4024/11/M/J/14 Q3: a parallelogram, 9 along the top, 5.6 up the sloping side, 4.3 high. */
const S14: Record<string, Vec> = { A: [0, 0], B: [9, 0], C: [12.59, 4.3], D: [3.59, 4.3], F: [3.59, 0] }
function s14Board(S: Scene, o: { taps?: boolean; sides?: boolean } = {}) {
  board(S, [-1.4, -1.4, 13.8, 5.8])
  place(S, S14)
  const cen = mid(S14.A, S14.C)
  S.polys = [{ id: "pg", pts: ["A", "B", "C", "D"] }]
  S.segs = [{ id: "h", a: "D", b: "F", col: CHALK, dash: true, w: 1.8 }]
  S.squares = [{ at: "F", a: "B", b: "D" }]
  S.freeLabs = [edgeLab("top", S14.D, S14.C, "9", CHALK, cen), edgeLab("slope", S14.B, S14.C, "5.6", CHALK, cen), { key: "h", at: [3.59, 2.15], tex: "4.3", col: CHALK, dx: 26 }]
  if (o.sides) S.freeLabs.push(edgeLab("bot", S14.A, S14.B, "9", BLUE, cen), edgeLab("left", S14.A, S14.D, "5.6", BLUE, cen))
  if (o.taps) S.taps = segTaps([["top", "D", "C"], ["slope", "B", "C"], ["left", "A", "D"], ["bot", "A", "B"], ["h", "D", "F"]])
}

const PART_4: Beat[] = [
  {
    id: "pg-cut",
    say: "Cut a triangle off one end of this parallelogram.",
    enter: S => {
      board(S, [-1.2, -1.4, 9.2, 5.4], [-1, -1, 9, 5])
      place(S, { ...PG, Q: PG.D })
      S.polys = [{ id: "pg", pts: ["A", "B", "C", "D"] }]
      S.segs = [{ id: "cut", a: "D", b: "Q", col: CHALK, dash: true }]
      glide(S, 1.0, e => ({ Q: lerpV(PG.D, PG.F, e) }), 0.7, S2 => { S2.shades = [{ id: "t", kind: "poly", pts: ["A", "F", "D"], col: BLUE, op: 0.3 }] })
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  {
    id: "pg-slide",
    say: "Slide the triangle to the other end.",
    enter: S => { pgBoard(S, { cut: true, slide: true }); look(S) },
    done: S => S.locked.has("tri"),
    advanceAfter: 1600,
  },
  {
    id: "pg-rect",
    say: "Now it's a rectangle, $6$ cm by $4$ cm.",
    enter: S => {
      pgBoard(S, { cut: true, dx: 6 })
      S.polys.push({ id: "rect", pts: ["F", "G", "C", "D"], col: GREEN, fill: GREEN, fillOp: 0.04 })
      S.freeLabs = [edgeLab("b", PG.F, PG.G, cm(6), BLUE, [5, 2]), edgeLab("h", PG.F, PG.D, cm(4), ORANGE, [5, 2])]
      S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("b", "6", { col: BLUE }), op("x", "\\times"), atom("h", "4", { col: ORANGE }), op("e2", "="), atom("t", cm2(24), { col: GREEN })])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 2.6,
  },
  {
    id: "pg-formula",
    say: "Area of a parallelogram $=$ base $\\times$ height.",
    enter: S => {
      pgBoard(S, { words: true })
      S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("b", "\\text{base}", { col: BLUE }), op("x", "\\times"), atom("h", "\\text{height}", { col: ORANGE })])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 2.6,
  },
  // 4024/11/M/J/14 Q3
  ask("s14-perim", "All these lengths are in centimetres. Find the perimeter.", S => s14Board(S), {
    lead: "\\text{Perimeter}", unit: "cm", answer: 29.2,
    slips: [
      { v: 26.6, say: "The dashed line is the height, inside the shape. Go round the sides." },
      { v: 14.6, say: "That's two sides. There are four." },
    ],
    walk: [
      { say: "Opposite sides are equal: the bottom is $9$ and the left side is $5.6$.", show: S => { const cen = mid(S14.A, S14.C); S.freeLabs.push(edgeLab("bot", S14.A, S14.B, "9", BLUE, cen), edgeLab("left", S14.A, S14.D, "5.6", BLUE, cen)); S.segs.push({ id: "gb", a: "A", b: "B", col: BLUE, w: 3, glow: true }, { id: "gl", a: "A", b: "D", col: BLUE, w: 3, glow: true }) } },
      { say: "Add all four sides.", tex: "9 + 5.6 + 9 + 5.6", show: S => { S.segs = S.segs.filter(g => g.id !== "gb" && g.id !== "gl"); S.polys = [{ id: "pg", pts: ["A", "B", "C", "D"], col: GREEN, glow: GREEN }] } },
    ],
  }),
  tapBeat("s14-tap", "For the area we need the height. Tap it.", S => s14Board(S, { taps: true, sides: true }), {
    want: "h", wrong: "The height meets the base at right angles.",
    notes: { slope: "That's the sloping side. The height meets the base at right angles.", left: "That's the sloping side. The height meets the base at right angles." },
    then: S => { S.segs = [{ id: "h", a: "D", b: "F", col: ORANGE, dash: true }]; S.squares = [{ at: "F", a: "B", b: "D", col: ORANGE }]; S.freeLabs = S.freeLabs.map(f => (f.key === "h" ? { ...f, col: ORANGE } : f)) },
  }),
  ask("s14-area", "Now find its area.", S => {
    s14Board(S, { sides: true })
    S.segs = [{ id: "base", a: "D", b: "C", col: BLUE, w: 3.4 }, { id: "h", a: "D", b: "F", col: ORANGE, dash: true }]
    S.squares = [{ at: "F", a: "B", b: "D", col: ORANGE }]
    S.freeLabs = S.freeLabs.map(f => (f.key === "h" ? { ...f, col: ORANGE } : f.key === "top" ? { ...f, col: BLUE } : f))
  }, {
    lead: "\\text{Area}", unit: "cm2", answer: 38.7,
    slips: [
      { v: 50.4, say: "That used the sloping side. Use the height, at right angles to the base." },
      { v: 19.35, say: "That's half. A parallelogram is base $\\times$ height, with no half." },
    ],
    walk: [
      { say: "Area $=$ base $\\times$ height. The base is $9$.", show: S => { glowOn(S, "base"); pulseLabs(S, "top") } },
      { say: "The height is $4.3$, at right angles to it.", tex: `${c(BLUE, "9")} \\times ${c(ORANGE, "4.3")}`, show: S => { glowOn(S, "h"); pulseLabs(S, "h") } },
    ],
  }),
]

// ── 5. Area of a trapezium ───────────────────────────────────────────────

const TZ: Record<string, Vec> = { A: [0, 0], B: [8, 0], C: [6, 3], D: [2, 3] }
/** The copy starts 9 to the right; it turns about its own middle M, then slides 3 to the left onto the trapezium's end. */
const TZ_M: Vec = [13, 1.5]
const copyAt = (deg: number, slid = deg === 180 ? 1 : 0) => {
  const q = turned({ A2: add(TZ.A, [9, 0]), B2: add(TZ.B, [9, 0]), C2: add(TZ.C, [9, 0]), D2: add(TZ.D, [9, 0]) }, TZ_M, deg)
  return Object.fromEntries(Object.entries(q).map(([n, p]) => [n, add(p, [-3 * slid, 0])])) as Record<string, Vec>
}

/** A trapezium, a = 4 along the top and b = 8 along the bottom, 3 high; its copy turned `deg` (half a turn: slid into place). */
function tzBoard(S: Scene, o: { copy?: number; turn?: boolean; nums?: boolean; h?: boolean; words?: boolean } = {}) {
  // room for the copy to turn about its middle without leaving the board
  if (o.turn) board(S, [-1.2, -3.2, 18.4, 6.2], [-1, -3, 18, 6])
  else board(S, [-1.2, -1.4, 15.2, 4.6], [-1, -1, 15, 4])
  place(S, { ...TZ, H: [2, 0], M: TZ_M })
  S.polys = [{ id: "tz", pts: ["A", "B", "C", "D"] }]
  S.segs = [{ id: "a", a: "D", b: "C", col: BLUE, w: 3.4, arrows: 1 }, { id: "b", a: "A", b: "B", col: BLUE, w: 3.4, arrows: 1 }]
  const cen = mid(TZ.A, TZ.C)
  S.freeLabs = [edgeLab("a", TZ.D, TZ.C, o.nums ? "4" : "a", BLUE, cen), edgeLab("b", TZ.A, TZ.B, o.nums ? "8" : "b", BLUE, cen)]
  if (o.h) {
    S.segs.push({ id: "h", a: "D", b: "H", col: ORANGE, dash: true })
    S.squares = [{ at: "H", a: "B", b: "D", col: ORANGE }]
    S.freeLabs.push({ key: "h", at: [2, 1.5], tex: o.nums ? "3" : "h", col: ORANGE, dx: 18 })
  }
  if (o.copy !== undefined) {
    place(S, copyAt(o.copy))
    S.polys.push({ id: "cp", pts: ["A2", "B2", "C2", "D2"], fill: ORANGE, fillOp: 0.06, col: ORANGE })
    if (o.turn) {
      S.dots = [{ pt: "M", col: CHALK, r: 4.5, pulse: true }]
      // the corner held starts at (9, 0); half a turn about M puts it where the snap is
      const a0 = (Math.atan2(0 - TZ_M[1], 9 - TZ_M[0]) * 180) / Math.PI
      S.handles = [{ id: "cp", kind: "turn", pivot: "M", pts: ["A2", "B2", "C2", "D2"], grab: "A2", snaps: [(a0 + 180 + 360) % 360], lock: true }]
      // once it is upside down it slides onto the trapezium's end
      S.tick = S2 => {
        if (!S2.locked.has("cp") || S2.vals.slid) return
        S2.vals.slid = 1
        S2.dots = []
        const from = copyAt(180, 0)
        glide(S2, 1.1, e => Object.fromEntries(Object.entries(from).map(([n, p]) => [n, add(p, [-3 * e, 0])])), 0.3, S3 => { S3.got.add("joined"); S3.flashGood = 1; S3.touched = "cp" })
      }
    }
  }
}
/** The copy turned onto the end: its sides labelled too, so the parallelogram's base reads b + a. */
function joined(S: Scene, nums: boolean, o: { span?: boolean } = {}) {
  tzBoard(S, { copy: 180, nums, h: true })
  S.dots = []
  const q = copyAt(180)
  S.freeLabs.push(edgeLab("a2", q.D2, q.C2, nums ? "4" : "a", BLUE, [10, 1.5]), edgeLab("b2", q.A2, q.B2, nums ? "8" : "b", BLUE, [10, 1.5]))
  S.segs.push({ id: "a2", a: "D2", b: "C2", col: BLUE, w: 3.4 }, { id: "b2", a: "A2", b: "B2", col: BLUE, w: 3.4 })
  if (o.span) baseSpan(S)
}
/** The parallelogram's whole base, 12, under its two parts (once the student has found it). */
function baseSpan(S: Scene) {
  place(S, { Y1: [0, -1.15], Y2: [12, -1.15] })
  S.segs.push({ id: "span", a: "Y1", b: "Y2", col: GREEN, w: 2.4 })
  putLab(S, { key: "span", at: [6, -1.15], tex: "12", col: GREEN, dy: 18 })
  S.frame = { ...S.frame, y0: -2.4 }
}
/** The parallelogram's outline (its area, once found, beside it). */
const bigPara = (S: Scene) => { place(S, { P1: [0, 0], P2: [12, 0], P3: [14, 3], P4: [2, 3] }); S.polys.push({ id: "big", pts: ["P1", "P2", "P3", "P4"], col: GREEN, fill: GREEN, fillOp: 0.03 }) }

/** 4024/13/M/J/25 Q13: a trapezium 6 along the top, 9 along the bottom, 4 up its upright side. */
const S25: Record<string, Vec> = { A: [0, 0], B: [9, 0], C: [6, 4], D: [0, 4], F: [6, 0] }
function s25Board(S: Scene, o: { drop?: boolean; slope?: string } = {}) {
  board(S, [-1.6, -1.4, 10.4, 5.4])
  place(S, S25)
  const cen = mid(S25.A, S25.C)
  S.polys = [{ id: "tz", pts: ["A", "B", "C", "D"] }]
  S.segs = [{ id: "top", a: "D", b: "C", arrows: 1, w: 0.01 }, { id: "bot", a: "A", b: "B", arrows: 1, w: 0.01 }]
  S.squares = [{ at: "A", a: "B", b: "D" }]
  S.freeLabs = [edgeLab("top", S25.D, S25.C, "6", CHALK, cen), edgeLab("bot", S25.A, S25.B, "9", CHALK, cen), edgeLab("lft", S25.A, S25.D, "4", CHALK, cen)]
  if (o.drop) {
    S.polys.push({ id: "tri", pts: ["F", "B", "C"], col: PINK, fill: PINK, fillOp: 0.06 })
    S.segs.push({ id: "drop", a: "C", b: "F", col: CHALK, dash: true, w: 1.8 })
    S.squares.push({ at: "F", a: "B", b: "C" })
    S.freeLabs.push({ key: "drop", at: [6, 2], tex: "4", col: CHALK, dx: -18 })
  }
  if (o.slope) S.freeLabs.push(edgeLab("slope", S25.B, S25.C, o.slope, o.slope === "?" ? PINK : GREEN, cen))
}

/** 4024/12/M/J/24 Q5(b): a trapezium y along the top, 13 along the bottom, 4 high, with an area of 36 cm². */
const S24: Record<string, Vec> = { A: [0, 0], B: [13, 0], C: [10.9, 4], D: [5.9, 4], F: [10.9, 0] }
function s24Board(S: Scene, y = "y") {
  board(S, [-1.4, -1.4, 14.4, 5.6])
  place(S, S24)
  const cen = mid(S24.A, S24.C)
  S.polys = [{ id: "tz", pts: ["A", "B", "C", "D"] }]
  S.segs = [{ id: "top", a: "D", b: "C", col: PINK, w: 3.4, arrows: 1 }, { id: "bot", a: "A", b: "B", col: BLUE, w: 3.4, arrows: 1 }, { id: "h", a: "C", b: "F", col: ORANGE, dash: true }]
  S.squares = [{ at: "F", a: "A", b: "C", col: ORANGE }]
  S.freeLabs = [edgeLab("top", S24.D, S24.C, y, y === "y" ? PINK : GREEN, cen), edgeLab("bot", S24.A, S24.B, "13", BLUE, cen), { key: "h", at: [10.9, 2], tex: "4", col: ORANGE, dx: -18 }, { key: "area", at: [6, 1.6], tex: cm2(36), col: CHALK }]
}
/** ½ × (y + 13) × 4 = 36, and the lines it becomes. */
const yPlus = (st?: CrossState, grab = false): ENode => paren("pb", row([atom("y", "y", { col: PINK }), op("pl", "+", grab ? { grab: st?.grab.has("pl") || undefined, pulse: st?.pulse.has("pl") || undefined } : {}), atom("n13", "13", { col: BLUE, ...(grab ? { grab: st?.grab.has("n13") || undefined, pulse: st?.pulse.has("n13") || undefined } : {}) })]))

const PART_5: Beat[] = [
  watch("tz", "This is a trapezium. Its parallel sides are $a$ and $b$.", S => { tzBoard(S); look(S) }, 2.6),
  {
    id: "tz-turn",
    say: "Here is a copy. Turn it upside down about the dot.",
    enter: S => { tzBoard(S, { copy: 0, turn: true }); look(S) },
    done: S => S.got.has("joined"),
    advanceAfter: 1600,
  },
  {
    id: "tz-para",
    say: "Together they make a parallelogram.",
    enter: S => {
      joined(S, false)
      place(S, { P1: [0, 0], P2: [12, 0], P3: [14, 3], P4: [2, 3] })
      S.polys.push({ id: "big", pts: ["P1", "P2", "P3", "P4"], col: GREEN, fill: GREEN, fillOp: 0.03 })
      S.flashGood = 1.2
      S.touched = "big"
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  watch("tz-base", "Its base is $b + a$, and its height is $h$.", S => {
    joined(S, false)
    S.eqFn = () => row([atom("b", "\\text{base}"), op("e", "="), atom("bb", "b", { col: BLUE }), op("p", "+"), atom("aa", "a", { col: BLUE })])
    look(S, ["eq"])
  }, 2.6),
  ask("tz-b12", "Here $a = 4$ and $b = 8$. How long is the parallelogram's base?", S => joined(S, true), {
    lead: "\\text{base}", answer: 12,
    slips: [{ v: 8, say: "That's only the first trapezium's part. Add the copy's part too." }, { v: 32, say: "That multiplies them. The two parts lie end to end, so add them." }],
    walk: [
      { say: "Along the bottom, $8$ is from the trapezium.", show: S => { glowOn(S, "b"); pulseLabs(S, "b") } },
      { say: "Then $4$ is from the copy. Add them for the whole base.", tex: `${c(BLUE, "8")} + ${c(BLUE, "4")}`, show: S => { glowOn(S, "b", "a2"); pulseLabs(S, "a2") } },
    ],
    then: S => baseSpan(S),
  }),
  ask("tz-36", "The height is $3$. What is the area of the parallelogram?", S => joined(S, true, { span: true }), {
    lead: "\\text{Area}", answer: 36,
    slips: [{ v: 15, say: "That adds them. Area is base $\\times$ height." }, { v: 18, say: "That's half. The whole parallelogram is base $\\times$ height." }],
    walk: [
      { say: "A parallelogram is base $\\times$ height. You found its base: $12$.", show: S => { glowOn(S, "span"); pulseLabs(S, "span") } },
      { say: "Its height is $3$.", tex: `${c(BLUE, "12")} \\times ${c(ORANGE, "3")}`, show: S => { glowOn(S, "h"); pulseLabs(S, "h") } },
    ],
  }),
  ask("tz-18", "So what is the area of one trapezium?", S => { joined(S, true, { span: true }); bigPara(S) }, {
    lead: "\\text{Area}", answer: 18,
    above: () => row([atom("pw", "\\text{Parallelogram}"), op("pe", "="), atom("p36", "36", { col: GREEN })]),
    slips: [{ v: 36, say: "That's both of them. Take half." }],
    walk: [
      { say: "The parallelogram is $36$. It's two trapeziums the same size.", show: S => { S.polys = S.polys.map(p => (p.id === "big" ? { ...p, glow: GREEN } : p)) } },
      { say: "So one is half of $36$.", tex: "36 \\div 2", show: S => { S.polys = S.polys.map(p => (p.id === "big" ? { ...p, glow: undefined } : p.id === "tz" ? { ...p, glow: BLUE } : p)) } },
    ],
  }),
  watch("tz-formula", `Area of a trapezium $= ${HALF}(a + b) \\times h$.`, S => {
    tzBoard(S, { h: true })
    S.eqFn = () => row([atom("a0", "\\text{Area}"), op("e", "="), atom("hf", HALF), paren("pb", row([atom("aa", "a", { col: BLUE }), op("p", "+"), atom("bb", "b", { col: BLUE })])), op("x", "\\times"), atom("hh", "h", { col: ORANGE })])
    look(S, ["eq"])
  }, 3),
]

const PART_6: Beat[] = [
  // 4024/13/M/J/25 Q13(a)
  ask("s25-area", "Work out the area of this trapezium. Its lengths are in centimetres.", S => s25Board(S), {
    lead: "\\text{Area}", unit: "cm2", answer: 30,
    slips: [
      { v: 60, say: "That's two trapeziums. Take half." },
      { v: 15, say: "Multiply by the height, $4$, then halve it." },
      { v: 54, say: "Add the parallel sides first." },
    ],
    walk: [
      { say: "Add the parallel sides.", tex: `${c(BLUE, "6")} + ${c(BLUE, "9")} = 15`, show: S => { S.segs = [{ id: "top", a: "D", b: "C", col: BLUE, w: 3.4, arrows: 1, glow: true }, { id: "bot", a: "A", b: "B", col: BLUE, w: 3.4, arrows: 1, glow: true }] } },
      { say: "Multiply by the height, then halve it.", tex: `15 \\times ${c(ORANGE, "4")} \\div 2`, show: S => { S.segs.push({ id: "lft", a: "A", b: "D", col: ORANGE, w: 3.4, glow: true }) } },
    ],
  }),
  watch("s25-drop", "For the perimeter we need the sloping side. Draw a line straight down.", S => {
    s25Board(S)
    place(S, { Q: S25.C })
    S.segs.push({ id: "drop", a: "C", b: "Q", col: CHALK, dash: true, w: 1.8 })
    S.freeLabs.push(edgeLab("slope", S25.B, S25.C, "?", PINK, mid(S25.A, S25.C)))
    glide(S, 1.0, e => ({ Q: lerpV(S25.C, S25.F, e) }), 0.8, S2 => { s25Board(S2, { drop: true, slope: "?" }) })
    look(S)
  }, 2.8),
  ask("s25-gap", "How long is the bottom of this triangle?", S => s25Board(S, { drop: true, slope: "?" }), {
    lead: "\\text{bottom}", answer: 3,
    slips: [{ v: 9, say: "That's the whole bottom. Take away the part under the top, $6$." }, { v: 15, say: "Take the top away from the bottom." }],
    walk: [
      { say: "The whole bottom is $9$.", show: S => { S.segs.push({ id: "whole", a: "A", b: "B", col: BLUE, w: 3.4, glow: true }); pulseLabs(S, "bot") } },
      { say: "The part under the top is $6$. The triangle's bottom is what is left.", tex: "9 - 6", show: S => { S.segs = S.segs.filter(g => g.id !== "whole"); S.segs.push({ id: "under", a: "A", b: "F", col: BLUE, w: 3.4 }, { id: "left", a: "F", b: "B", col: PINK, w: 3.4, glow: true }); pulseLabs(S, "top") } },
    ],
    then: S => putLab(S, { key: "gap", at: [7.5, 0], tex: "3", col: GREEN, dy: -16 }),
  }),
  ask("s25-slope", "Use Pythagoras to find the sloping side.", S => { s25Board(S, { drop: true, slope: "?" }); S.freeLabs.push({ key: "gap", at: [7.5, 0], tex: "3", col: CHALK, dy: -16 }) }, {
    lead: "\\text{side}", leadCol: PINK, answer: 5,
    slips: [{ v: 7, say: "That adds them. Square both, add, then take the square root." }, { v: 25, say: "That's its square. Now take the square root." }],
    walk: [
      { say: "The sloping side is the longest side of this right-angled triangle. The other two are $3$ and $4$.", tex: "3^2 + 4^2", show: S => { S.shades = [{ id: "tri", kind: "poly", pts: ["F", "B", "C"], col: PINK, op: 0.18, pulse: true }]; S.segs.push({ id: "g3", a: "F", b: "B", col: CHALK, w: 2, glow: true }, { id: "g4", a: "C", b: "F", col: CHALK, w: 2, glow: true }); pulseLabs(S, "gap", "drop") } },
      { say: "Square both, add, then take the square root.", tex: "\\sqrt{3^2 + 4^2}", show: S => { S.segs = S.segs.filter(g => g.id !== "g3" && g.id !== "g4"); S.segs.push({ id: "sl", a: "B", b: "C", col: PINK, w: 3.4, glow: true }); pulseLabs(S, "slope"); pulseShades(S) } },
    ],
    then: S => { S.freeLabs = S.freeLabs.map(f => (f.key === "slope" ? { ...f, tex: "5", col: GREEN } : f)) },
  }),
  ask("s25-perim", "Now work out the perimeter of the trapezium.", S => s25Board(S, { slope: "5" }), {
    lead: "\\text{Perimeter}", unit: "cm", answer: 24,
    slips: [{ v: 19, say: "Every side counts, the sloping one too." }, { v: 22, say: "Use the sloping side, $5$, not the $3$." }],
    walk: [
      { say: "Go all the way round: the sloping side is the $5$ you found.", show: S => { S.polys = [{ id: "tz", pts: ["A", "B", "C", "D"], col: GREEN }]; pulseLabs(S, "slope") } },
      { say: "Add the four sides.", tex: "6 + 5 + 9 + 4", show: S => { S.polys = [{ id: "tz", pts: ["A", "B", "C", "D"], col: GREEN, glow: GREEN }]; pulseLabs(S, "top", "slope", "bot", "lft") } },
    ],
  }),
  watch("s24-fill", "This trapezium's area is $36$ cm$^2$. Put its numbers in the formula.", S => {
    s24Board(S)
    S.eqFn = () => row([atom("hf", HALF), yPlus(), op("x", "\\times"), atom("h4", "4", { col: ORANGE }), op("eq", "="), atom("n36", "36", { col: GREEN })])
    look(S, ["eq"])
  }, 3),
  // 4024/12/M/J/24 Q5(b)
  ask("s24-half", `First, what is ${"$"}${HALF} \\times 4$?`, S => s24Board(S), {
    lead: `${HALF} \\times ${c(ORANGE, "4")}`, answer: 2,
    above: () => row([atom("hf0", HALF), yPlus(), op("x0", "\\times"), atom("h40", "4", { col: ORANGE }), op("eq0", "="), atom("n360", "36", { col: GREEN })]),
    slips: [{ v: 8, say: "That's double. Take half of $4$." }],
    walk: [{ say: "The $4$ is the height. Half of it is $4 \\div 2$.", tex: "4 \\div 2", show: S => { glowOn(S, "h"); pulseLabs(S, "h") } }],
  }),
  {
    id: "s24-cross2",
    say: "So $2 \\times (y + 13) = 36$. Move the $2$ across the $=$.",
    enter: S => {
      s24Board(S)
      startCross(S, {
        ids: ["two"], label: "2", from: "left",
        options: ["$\\div\\,2$", "$-\\,2$"], answer: 0,
        notes: { 1: "It was multiplying, so it comes across dividing." },
        before: st => row([atom("two", "2", { grab: st.grab.has("two") || undefined, pulse: st.pulse.has("two") || undefined }), op("x", "\\times"), yPlus(), op("eq", "="), atom("n36", "36", { col: GREEN })]),
        after: () => row([atom("y", "y", { col: PINK }), op("pl", "+"), atom("n13", "13", { col: BLUE }), op("eq", "="), atom("n36", "36", { col: GREEN }), op("dv", "\\div"), atom("two", "2")]),
      })
      look(S, ["eq", "chips"])
    },
    done: S => crossDone(S),
    advanceAfter: 1200,
  },
  ask("s24-18", "Work out $36 \\div 2$.", S => s24Board(S), {
    lead: `${c(PINK, "y")} + ${c(BLUE, "13")}`, answer: 18,
    above: () => row([atom("y0", "y", { col: PINK }), op("p0", "+"), atom("t0", "13", { col: BLUE }), op("e0", "="), atom("a0", "36", { col: GREEN }), op("d0", "\\div"), atom("w0", "2")]),
    slips: [{ v: 72, say: "That multiplies. It's $36$ divided by $2$." }],
    walk: [{ say: "The area is $36$, and the $2$ came across dividing.", tex: "36 \\div 2", show: S => pulseLabs(S, "area") }],
  }),
  {
    id: "s24-cross13",
    say: "Now move the $13$ across.",
    enter: S => {
      s24Board(S)
      startCross(S, {
        ids: ["pl", "n13"], label: "+\\,13", from: "left",
        options: ["$-\\,13$", "$\\div\\,13$"], answer: 0,
        notes: { 1: "It was added, so it comes across as a take-away." },
        before: st => row([atom("y", "y", { col: PINK }), op("pl", "+", { grab: st.grab.has("pl") || undefined, pulse: st.pulse.has("pl") || undefined }), atom("n13", "13", { col: BLUE, grab: st.grab.has("n13") || undefined, pulse: st.pulse.has("n13") || undefined }), op("eq", "="), atom("n18", "18")]),
        after: () => row([atom("y", "y", { col: PINK }), op("eq", "="), atom("n18", "18"), op("mn", "-"), atom("n13", "13", { col: BLUE })]),
      })
      look(S, ["eq", "chips"])
    },
    done: S => crossDone(S),
    advanceAfter: 1200,
  },
  ask("s24-y", "So what is $y$?", S => s24Board(S), {
    lead: "y", leadCol: PINK, answer: 5,
    slips: [{ v: 31, say: "The $13$ came across as a take-away." }],
    above: () => row([atom("y0", "y", { col: PINK }), op("e0", "="), atom("a0", "18"), op("m0", "-"), atom("t0", "13", { col: BLUE })]),
    walk: [{ say: "The bottom's $13$ came across as a take-away. What is left is the top, $y$.", tex: "18 - 13", show: S => { glowOn(S, "bot", "top"); pulseLabs(S, "bot", "top") } }],
    then: S => { S.freeLabs = S.freeLabs.map(f => (f.key === "top" ? { ...f, tex: "5", col: GREEN } : f)) },
  }),
  {
    id: "end",
    say: "These are the four area formulas.",
    enter: S => {
      board(S, [-0.6, -8.2, 12.6, 3.4])
      place(S, {
        R1: [0, 0], R2: [5, 0], R3: [5, 3], R4: [0, 3],
        T1: [7, 0], T2: [12, 0], T3: [8.6, 3], TF: [8.6, 0],
        P1: [0, -6], P2: [4, -6], P3: [5, -3], P4: [1, -3], PF: [1, -6],
        Z1: [7, -6], Z2: [12, -6], Z3: [10.8, -3], Z4: [8.2, -3], ZF: [8.2, -6],
      })
      S.polys = [{ id: "r", pts: ["R1", "R2", "R3", "R4"] }, { id: "t", pts: ["T1", "T2", "T3"] }, { id: "p", pts: ["P1", "P2", "P3", "P4"] }, { id: "z", pts: ["Z1", "Z2", "Z3", "Z4"] }]
      S.segs = [
        { id: "rl", a: "R1", b: "R2", col: BLUE, w: 3.2 }, { id: "rw", a: "R1", b: "R4", col: ORANGE, w: 3.2 },
        { id: "tb", a: "T1", b: "T2", col: BLUE, w: 3.2 }, { id: "th", a: "T3", b: "TF", col: ORANGE, dash: true },
        { id: "pb", a: "P1", b: "P2", col: BLUE, w: 3.2 }, { id: "ph", a: "P4", b: "PF", col: ORANGE, dash: true },
        { id: "za", a: "Z4", b: "Z3", col: BLUE, w: 3.2 }, { id: "zb", a: "Z1", b: "Z2", col: BLUE, w: 3.2 }, { id: "zh", a: "Z4", b: "ZF", col: ORANGE, dash: true },
      ]
      // each formula under its shape
      const f = (key: string, x: number, y: number, tex: string): FreeLab => ({ key, at: [x, y], tex, size: 22, dy: 26 })
      S.freeLabs = [
        f("f1", 2.5, 0, `${c(BLUE, "l")} \\times ${c(ORANGE, "w")}`),
        f("f2", 9.5, 0, `${HALF} \\times ${c(BLUE, "b")} \\times ${c(ORANGE, "h")}`),
        f("f3", 2, -6, `${c(BLUE, "b")} \\times ${c(ORANGE, "h")}`),
        f("f4", 9.5, -6, `${HALF}(${c(BLUE, "a")} + ${c(BLUE, "b")}) \\times ${c(ORANGE, "h")}`),
      ]
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4, ...PART_5, ...PART_6]

applyParts(BEATS, [
  ["perim", "Perimeter"],
  ["make", "Area of a rectangle"],
  ["cut", "Area of a triangle"],
  ["pg-cut", "Area of a parallelogram"],
  ["tz", "Area of a trapezium"],
  ["s25-area", "Trapezium questions"],
])

