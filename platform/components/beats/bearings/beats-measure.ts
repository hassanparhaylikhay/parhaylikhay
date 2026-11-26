/**
 * Measuring and drawing angles (4.2, lesson 1 of 3), one tiny idea per beat.
 *
 * The protractor goes on the corner, its 0 along one arm, its half circle
 * over the angle; the angle is read on the row that starts at 0 on that arm
 * (a lens shows where the other arm crosses, close up). The other row's
 * number is shown to be wrong by laying a right angle on the angle. Then an
 * angle is drawn by marking it with the protractor's pencil and ruling a
 * line through the mark, and triangles are drawn from the papers:
 * 4024/12/O/N/19 Q19(b) (a side and two angles) and 4024/21/M/J/23 Q7(a)
 * (two sides and the angle between, then measured for the perimeter).
 *
 * Colours: the angle being measured blue, an angle still to be drawn pink,
 * lines ruled by the student blue, what can be dragged yellow.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { type Scene, BLUE, GREEN, PINK, along, addSeg } from "./scene"
import { type Beat, type MapSpec, look, watch, askNum, mapBoard, cross, crossBeat, slideOn, layBeat, withRuler, readWalk } from "./scale-kit"
import { fig, angleProtBeat, protOnAngle, readAngleBeat, markAngleBeat, penBeat, guessBeat, angArc, angArcTo, squareOn } from "./angle-kit"

// ── the figures (one world unit is a centimetre) ─────────────────────────

/** A triangle to measure: angle A 30° (AB along the page), angle B 115°, angle C 35°. */
const ABC = fig({ pts: { A: [0, 0], B: [5, 0], C: cross([0, 0], 60, [5, 0], 25) }, segs: [["A", "B"], ["B", "C"], ["C", "A"]], prot: [2.0, -3.0] })
/** A line to draw angles on: QR along the page. */
const QR = fig({ pts: { Q: [0, 0], R: [6, 0] }, segs: [["Q", "R"]], prot: [3, -3.0], room: [along([0, 0], 50, 6), along([0, 0], 320, 6)] })
/** 4024/12/O/N/19 Q19: AB, 8 cm, sloping down to the right; D below it, with angle BAD 28° and angle ABD 96°. */
const W19_B = along([0, 0], 110, 8)
const W19_D = cross([0, 0], 138, W19_B, 194)
const W19 = fig({ pts: { A: [0, 0], B: W19_B }, segs: [["A", "B"]], prot: [4.4, 1.0], up: true, room: [W19_D, along([0, 0], 138, 10.4), along(W19_B, 194, 5.6)] })
/** 4024/21/M/J/23 Q7(a): AB, 9 cm, drawn; AC 8.3 cm and angle BAC 105°. */
const S23_C = along([0, 0], 345, 8.3)
const S23_ROOM: Vec[] = [S23_C, along([0, 0], 345, 9.5)]
const S23 = fig({ pts: { A: [0, 0], B: [9, 0] }, segs: [["A", "B"]], prot: [5.5, -3.0], ruler: { zero: [1.0, -4.4], len: 15 }, room: S23_ROOM })
const S23C: MapSpec = { ...S23, pts: { A: [0, 0], B: [9, 0], C: S23_C }, names: { A: "A", B: "B", C: "C" }, segs: [["A", "B"], ["A", "C"], ["C", "B"]] }

/** The protractor lying where it rests, not to be picked up yet. */
function restProt(S: Scene, M: MapSpec, up = false) {
  S.prot = { c: [...M.prot] as Vec, rot: up ? 270 : 40, on: null, pen: null, lit: null, turn: false, move: false, magnets: [] }
}

/** The triangle to measure, with angle BAC (and angle ABC) marked. */
function abcBoard(S: Scene, o: { a?: boolean; aTex?: string; b?: boolean; bTex?: string; pulse?: boolean } = {}) {
  mapBoard(S, ABC, { prot: "A" })
  if (o.a) angArc(S, "A", "B", "C", BLUE, { tex: o.aTex, pulse: o.pulse, id: "a" })
  if (o.b) angArc(S, "B", "A", "C", BLUE, { tex: o.bTex, pulse: o.pulse, id: "b" })
}

/** A line ruled from a place on a bearing (the student's pencil line), `far` long. */
function ruledLine(S: Scene, at: string, brg: number, far: number) {
  const end = `${at}${Math.round(brg)}`
  S.P[end] = along(S.P[at], brg, far)
  addSeg(S, at, end, { col: BLUE })
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  // it is shown at work first: lying on angle A, the row to read lit
  watch("prot-hi", "A protractor measures angles.", S => { abcBoard(S, { a: true }); protOnAngle(S, "A", "B", "C", { arm: "B", lens: false }); look(S) }, 2.4),
  watch("angle", "This is angle $BAC$.", S => { abcBoard(S, { a: true, pulse: true }); look(S) }, 2.2),
  watch("corner", "The middle letter, $A$, is the corner.", S => { abcBoard(S, { a: true }); S.nameCol.A = BLUE; look(S) }, 2.4),
  guessBeat("guess-a", "Is it more or less than $90^\\circ$?", S => abcBoard(S, { a: true }), "A", "B", "C", false),
  angleProtBeat("on-a", "Put the protractor's centre on $A$.", ABC, "A", "B", "C", { job: "place", more: S => angArc(S, "A", "B", "C", BLUE, { id: "a" }) }),
  angleProtBeat("turn-a", "Turn it, so its $0$ lies along $AB$.", ABC, "A", "B", "C", {
    job: "turn", arm: "B", only: "That lies along $AC$. This time, put its $0$ along $AB$.",
    more: S => angArc(S, "A", "B", "C", BLUE, { id: "a" }),
  }),
  watch("row-a", "Use the row that starts at $0$ on $AB$.", S => { abcBoard(S, { a: true }); protOnAngle(S, "A", "B", "C", { arm: "B", lens: false }); look(S) }, 2.6),
  readAngleBeat("read-a", "So what is angle $BAC$?", ABC, "A", "B", "C", {
    name: "BAC", answer: 30, more: S => angArc(S, "A", "B", "C", BLUE, { id: "a" }),
    walk: ["Find the row that starts at $0$ on $AB$.", "Follow that row round to where $AC$ crosses it."],
  }),
  watch("other-a", "The other row says $150^\\circ$ there.", S => { abcBoard(S, { a: true, aTex: "30^\\circ" }); protOnAngle(S, "A", "B", "C", { arm: "B", lens: false }); S.prot!.warn = 150; look(S) }, 2.6),
  watch("not-a", "That can't be right. Angle $BAC$ is less than $90^\\circ$.", S => { abcBoard(S, { a: true, aTex: "30^\\circ" }); squareOn(S, "A", "B", "C"); look(S) }, 2.8),

  guessBeat("guess-b", "Now angle $ABC$. Is it more or less than $90^\\circ$?", S => abcBoard(S, { a: true, aTex: "30^\\circ", b: true }), "B", "A", "C", true),
  angleProtBeat("on-b", "Put the protractor's centre on $B$.", ABC, "B", "A", "C", { job: "place", more: S => { angArc(S, "A", "B", "C", BLUE, { id: "a", tex: "30^\\circ" }); angArc(S, "B", "A", "C", BLUE, { id: "b" }) } }),
  angleProtBeat("turn-b", "Turn it, so its $0$ lies along $BA$ or $BC$.", ABC, "B", "A", "C", {
    job: "turn", more: S => { angArc(S, "A", "B", "C", BLUE, { id: "a", tex: "30^\\circ" }); angArc(S, "B", "A", "C", BLUE, { id: "b" }) },
  }),
  readAngleBeat("read-b", "What is angle $ABC$?", ABC, "B", "A", "C", {
    name: "ABC", answer: 115, more: S => { angArc(S, "A", "B", "C", BLUE, { id: "a", tex: "30^\\circ" }); angArc(S, "B", "A", "C", BLUE, { id: "b" }) },
    walk: ["Find the row that starts at $0$ on $BA$.", "Follow that row round to where $BC$ crosses it."],
  }),
  watch("rule", "Always read the row that starts at $0$ on one of the lines.", S => { abcBoard(S, { a: true, aTex: "30^\\circ", b: true, bTex: "115^\\circ" }); look(S) }, 2.8),
]

const PART_2: Beat[] = [
  watch("draw-q", "Let's draw a $40^\\circ$ angle at $Q$, above $QR$.", S => { mapBoard(S, QR, { prot: "Q" }); angArcTo(S, "Q", "R", 50, PINK, { tex: "40^\\circ" }); restProt(S, QR); look(S) }, 2.6),
  angleProtBeat("d-on", "Put the protractor's centre on $Q$.", QR, "Q", "R", "R", { job: "place", target: 50, more: S => angArcTo(S, "Q", "R", 50, PINK, { tex: "40^\\circ" }) }),
  angleProtBeat("d-turn", "Turn it, so its $0$ lies along $QR$.", QR, "Q", "R", "R", {
    job: "turn", target: 50, arm: "R", wrongSay: "Turn it round, so it covers the side above $QR$.",
    more: S => angArcTo(S, "Q", "R", 50, PINK, { tex: "40^\\circ" }),
  }),
  markAngleBeat("d-mark", "Find $40$ on the row that starts at $0$. Slide the pencil to it.", QR, "Q", "R", 50, 40, { far: 6, end: "Q50", more: S => angArcTo(S, "Q", "R", 50, PINK, { tex: "40^\\circ" }) }),
  watch("d-done", "There's the $40^\\circ$ angle.", S => { mapBoard(S, QR); ruledLine(S, "Q", 50, 6); S.arcs.push({ id: "q40", at: "Q", from: 50, sweep: 40, col: BLUE, tex: "40^\\circ", r: 1.3 }); look(S) }, 2.2),
  markAngleBeat("d-130", "Now mark $130^\\circ$ at $Q$, above $QR$.", QR, "Q", "R", 320, 130, { far: 6, end: "Q320", more: S => angArcTo(S, "Q", "R", 320, PINK, { tex: "130^\\circ" }) }),
  watch("d-130-done", "It is more than $90^\\circ$, as it should be.", S => {
    mapBoard(S, QR); ruledLine(S, "Q", 320, 6)
    S.arcs.push({ id: "q130", at: "Q", from: 320, sweep: 130, col: BLUE, tex: "130^\\circ", r: 1.3 })
    S.squares.push({ at: "Q", from: 0, col: GREEN })
    look(S)
  }, 2.8),
]

/** 4024/12/O/N/19 Q19(b): the board, with the lines ruled so far. */
function w19Board(S: Scene, o: { a?: boolean; b?: boolean; arcs?: boolean } = {}) {
  mapBoard(S, W19, { prot: "A" })
  if (o.arcs !== false) {
    angArcTo(S, "A", "B", 138, o.a ? BLUE : PINK, { tex: "28^\\circ", id: "a28" })
    angArcTo(S, "B", "A", 194, o.b ? BLUE : PINK, { tex: "96^\\circ", id: "b96" })
  }
  if (o.a) ruledLine(S, "A", 138, 10.4)
  if (o.b) ruledLine(S, "B", 194, 5.6)
}

/** 4024/21/M/J/23 Q7(a): the board, with the 105° line, and C once it is marked. */
function s23Board(S: Scene, o: { line?: boolean; c?: boolean } = {}) {
  mapBoard(S, o.c ? S23C : S23, { prot: "A" })
  angArcTo(S, "A", "B", 345, o.line ? BLUE : PINK, { tex: "105^\\circ" })
  if (o.line && !o.c) ruledLine(S, "A", 345, 9.5)
}

/** The sides known so far, written on them: AC as given, and AB once it has been measured. */
function s23Known(S: Scene) {
  addSeg(S, "A", "C", { lab: { tex: "8.3\\text{ cm}" } })
  addSeg(S, "A", "B", { lab: { tex: "9\\text{ cm}" } })
}

const PART_3: Beat[] = [
  // 4024/12/O/N/19 Q19(b)
  watch("w19", "$D$ is below $AB$. Angle $BAD = 28^\\circ$ and angle $ABD = 96^\\circ$.", S => { w19Board(S); restProt(S, W19, true); look(S) }, 3.2),
  angleProtBeat("w19-a", "Put the protractor on $A$, with its $0$ along $AB$.", W19, "A", "B", "B", {
    job: "both", target: 138, arm: "B", startRot: 270, more: S => w19Board(S),
    next: "Now turn it, so its $0$ lies along $AB$.", wrongSay: "$D$ is below $AB$. Turn the protractor round to that side.",
  }),
  markAngleBeat("w19-a28", "Slide the pencil to $28$.", W19, "A", "B", 138, 28, { far: 10.4, end: "A138", more: S => w19Board(S) }),
  watch("w19-line", "$D$ is somewhere on this line.", S => { w19Board(S, { a: true }); slideOn(S, "A", "A138", "D"); look(S) }, 2.4),
  angleProtBeat("w19-b", "Now put it on $B$, with its $0$ along $BA$.", W19, "B", "A", "A", {
    job: "both", target: 194, arm: "A", startRot: 270, more: S => w19Board(S, { a: true }),
    next: "Now turn it, so its $0$ lies along $BA$.", wrongSay: "$D$ is below $AB$. Turn the protractor round to that side.",
  }),
  markAngleBeat("w19-b96", "Slide the pencil to $96$.", W19, "B", "A", 194, 96, { far: 5.6, end: "B194", armName: "BA", more: S => w19Board(S, { a: true }) }),
  crossBeat("w19-d", "$D$ is on both lines. Tap $D$.", S => w19Board(S, { a: true, b: true }), W19_D, "D", [138, 194]),
  watch("w19-done", "That's triangle $ABD$.", S => {
    w19Board(S, { a: true, b: true })
    S.P.D = [...W19_D] as Vec
    S.names = { ...S.names, D: "D" }
    addSeg(S, "A", "D", { col: GREEN }); addSeg(S, "B", "D", { col: GREEN })
    look(S)
  }, 2.4),

  // 4024/21/M/J/23 Q7(a)
  watch("s23", "$AC = 8.3$ cm and angle $BAC = 105^\\circ$. Let's draw triangle $ABC$.", S => { s23Board(S); restProt(S, S23); look(S) }, 3.2),
  angleProtBeat("s23-on", "Put the protractor on $A$, with its $0$ along $AB$.", S23, "A", "B", "B", {
    job: "both", target: 345, arm: "B", more: S => s23Board(S),
    next: "Now turn it, so its $0$ lies along $AB$.", wrongSay: "$C$ is above $AB$. Turn the protractor round to that side.",
  }),
  markAngleBeat("s23-105", "Slide the pencil to $105$.", S23, "A", "B", 345, 105, { far: 9.5, end: "A345", more: S => s23Board(S) }),
  penBeat("s23-83", "Now mark $8.3$ cm along this line with the ruler.", S23, "A", 345, 8.3, "C", { rulerLen: 10, more: S => s23Board(S, { line: true }) }),
  watch("s23-join", "Now join $C$ to $B$.", S => { s23Board(S, { line: true }); S.P.C = [...S23_C] as Vec; S.names = { ...S.names, C: "C" }; addSeg(S, "A", "C"); addSeg(S, "C", "B", { grown: false }); look(S) }, 2.2),
  watch("s23-q", "Let's find its perimeter. We need the length of every side.", S => { s23Board(S, { line: true, c: true }); look(S) }, 2.6),
  layBeat("s23-lay-ab", "Lay the ruler along $AB$, with its $0$ on one end.", S23C, "A", "B", S => s23Board(S, { line: true, c: true })),
  askNum("s23-ab", "How long is $AB$?", S => { s23Board(S, { line: true, c: true }); withRuler(S, S23C, { on: "A", along: "B", follow: true, fixed: true }) }, {
    name: "AB", answer: 9, unit: "cm", dec: true, tol: 0.1, near: 0.4, walk: readWalk(),
  }),
  layBeat("s23-lay-bc", "Now lay it along $BC$.", S23C, "B", "C", S => { s23Board(S, { line: true, c: true }); s23Known(S) }),
  askNum("s23-bc", "How long is $BC$?", S => { s23Board(S, { line: true, c: true }); s23Known(S); withRuler(S, S23C, { on: "B", along: "C", follow: true, fixed: true }) }, {
    name: "BC", answer: 13.7, unit: "cm", dec: true, tol: 0.1, near: 0.4, walk: readWalk(),
  }),
  askNum("s23-per", "So what is the perimeter of triangle $ABC$?", S => {
    s23Board(S, { line: true, c: true })
    addSeg(S, "A", "B", { lab: { tex: "9\\text{ cm}" } }); addSeg(S, "C", "B", { lab: { tex: "13.7\\text{ cm}" } }); addSeg(S, "A", "C", { lab: { tex: "8.3\\text{ cm}" } })
  }, {
    name: "\\text{Perimeter}", answer: 31, unit: "cm", dec: true, tol: 0.2, near: 1,
    walk: [
      { say: "The perimeter is the distance all the way round, so add the three sides.", tex: "9 + 13.7 + 8.3", show: S => { S.segs = S.segs.map(sg => ({ ...sg, glow: true })) } },
    ],
  }),
  {
    id: "end",
    say: "In summary, put the protractor's centre on the corner and its $0$ along one line. Read the row that starts at $0$ on that line.",
    enter: S => { abcBoard(S, { a: true, aTex: "30^\\circ", b: true, bTex: "115^\\circ" }); protOnAngle(S, "B", "A", "C", { arm: "A", lens: false }); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3]

applyParts(BEATS, [
  ["prot-hi", "Measuring an angle"],
  ["draw-q", "Drawing an angle"],
  ["w19", "Drawing triangles"],
])
