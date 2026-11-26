/**
 * Measuring and drawing bearings (4.3, lesson 3 of 3). One small job per
 * frame, each with its cue on the map: put the protractor's centre on the
 * place (a ring waits there), turn it until the end that glows lies on the
 * glowing North line, use the row of numbers that starts at 0 on North and
 * read where the line crosses the edge (that part of the edge glows). Past
 * 180° the protractor runs out, so the angle on the left of North is
 * measured: it and the bearing make a full turn. Drawing works the other
 * way: mark the number, rule the line, and see the place slide along it
 * until a second line pins it down. Exam questions: 4024/11/O/N/22 Q4(b)(c),
 * 4024/12/M/J/24 Q10(a). The teaching maps are 4024/12/M/J/25 Q6 and
 * 4024/12/M/J/23 Q6(a).
 */

import { applyParts } from "../chapter"
import { row, op, atom } from "../equation"
import type { Vec } from "../geometry"
import { type Scene, BLUE, ORANGE, along, addSeg } from "./scene"
import {
  type Beat, type MapSpec, look, mapBoard, withProt, watch, askNum, protBeat, markBeat, crossBeat, protWalk, pulseArcs,
  brgArc, leftArc, slideOn, nameBetween, S25, S25_C, W22, W22_C, S23, S24,
} from "./scale-kit"

/** A line ruled from a place on a bearing, as far as the map leaves room for. */
function line(S: Scene, at: string, brg: number, far: number) {
  S.P[`${at}${brg}`] = along(S.P[at], brg, far)
  addSeg(S, at, `${at}${brg}`, { col: BLUE })
}

/** The coloured sum under a full turn: the blue part, the orange part, and 360°. */
const fullTurn = (blue: string, orange: string) =>
  row([atom("fb", blue, { col: BLUE }), op("fp", "+"), atom("fo", orange, { col: ORANGE }), op("fe", "="), atom("f360", "360^\\circ")])

/** Read a bearing on a protractor already in place: the row from North lit, the crossing glowing. */
function readBeat(id: string, say0: string, M: MapSpec, on: string, rot: 0 | 180, brg: number, o: {
  name?: string; answer: number; three?: boolean; other: number; line: string; more?: (S: Scene) => void
}) {
  return askNum(id, say0, S => {
    mapBoard(S, M, { prot: on })
    o.more?.(S)
    withProt(S, M, { on, rot, fixed: true, lit: true, spot: brg })
  }, {
    name: o.name ?? "\\text{Bearing}", answer: o.answer, three: o.three, measured: true,
    nearSay: `Close. Look again where $${o.line}$ crosses the edge.`,
    slips: [{ v: o.other, say: "That's the other row. Use the row that starts at $0$ on the North line." }],
    walk: protWalk(o.line),
  })
}

// ── 1. Measuring a bearing (4024/12/M/J/25 Q6) ──
const PART_A: Beat[] = [
  watch("brg-q", "Let's measure the bearing of $B$ from $A$.", S => { mapBoard(S, S25); brgArc(S, "A", 110, "?", { grow: true }); look(S) }, 2.2),
  protBeat("prot-on", "Put the protractor's centre on $A$.", S25, "A", 0, { job: "place" }),
  protBeat("prot-turn", "Now turn it, so its $0$ lies on the North line.", S25, "A", 0, { job: "turn" }),
  {
    id: "two-rows",
    say: "A protractor has two rows of numbers.",
    enter: S => {
      mapBoard(S, S25, { prot: "A" })
      withProt(S, S25, { on: "A", rot: 0, fixed: true, lit: true })
      // one row lights, then the other
      const t0 = S.time
      S.tick = S2 => { if (S2.prot) S2.prot.lit = Math.floor((S2.time - t0) / 1.3) % 2 ? "inner" : "outer" }
      look(S)
    },
    cta: "", ctaAfter: 2.8,
  },
  watch("which-row", "Use the row that starts at $0$ on the North line.", S => {
    mapBoard(S, S25, { prot: "A" })
    withProt(S, S25, { on: "A", rot: 0, fixed: true, lit: true, find: 0 })
    look(S)
  }, 2.4),
  readBeat("read-110", "Follow that row round to the line $AB$. What number is there?", S25, "A", 0, 110, { answer: 110, three: true, other: 70, line: "AB" }),
  watch("is-110", "So the bearing of $B$ from $A$ is $110^\\circ$.", S => { mapBoard(S, S25); brgArc(S, "A", 110, "110^\\circ"); look(S) }, 2.2),
]

// ── 2. More than 180° (4024/12/M/J/23 Q6(a)) ──
const PART_B: Beat[] = [
  watch("left-q", "Now let's measure the bearing of $B$ from $A$ on this map.", S => { mapBoard(S, S23); brgArc(S, "A", 240, "?", { grow: true }); look(S) }, 2.4),
  watch("left-big", "It turns past South, so it is more than $180^\\circ$.", S => {
    mapBoard(S, S23)
    S.souths = ["A"]
    brgArc(S, "A", 240, "?", { pulse: true })
    look(S)
  }, 2.4),
  watch("left-half", "A protractor only goes up to $180^\\circ$. That's half a turn.", S => {
    mapBoard(S, S23, { prot: "A" })
    brgArc(S, "A", 240, "?")
    withProt(S, S23, { on: "A", rot: 0, fixed: true })
    look(S)
  }, 2.6),
  watch("left-angle", "So we measure the angle on the left of North instead.", S => {
    mapBoard(S, S23)
    brgArc(S, "A", 240, "?")
    leftArc(S, "A", 240, "?", { grow: true, pulse: true })
    look(S)
  }, 2.6),
  protBeat("left-turn", "Turn the protractor round to the left, so its $0$ lies on the North line.", S23, "A", 180, { job: "turn", startRot: 0 }),
  readBeat("left-read", "Use the row that starts at $0$. What number is at $AB$?", S23, "A", 180, 240, { name: "\\text{Angle}", answer: 120, other: 60, line: "AB" }),
  watch("left-full", "The two angles together make a full turn: $360^\\circ$.", S => {
    mapBoard(S, S23)
    brgArc(S, "A", 240, "?", { pulse: true })
    leftArc(S, "A", 240, "120^\\circ", { pulse: true })
    S.eqFn = () => fullTurn("?", "120^\\circ")
    look(S, ["eq"])
  }, 2.8),
  askNum("left-brg", "So what is the bearing of $B$ from $A$?", S => {
    mapBoard(S, S23)
    brgArc(S, "A", 240, "?")
    leftArc(S, "A", 240, "120^\\circ")
  }, {
    name: "\\text{Bearing}", answer: 240, three: true,
    slips: [
      { v: 120, say: "That's the angle on the left. The bearing is the blue part of the turn." },
      { v: 300, say: "That's $180^\\circ + 120^\\circ$. The two angles make $360^\\circ$." },
    ],
    above: () => fullTurn("?", "120^\\circ"),
    walk: [
      { say: "The blue part and the orange part make $360^\\circ$.", show: S => pulseArcs(S, "b-A", "l-A") },
      { say: "So take the orange part from $360^\\circ$.", tex: "360 - 120", show: S => pulseArcs(S, "l-A") },
    ],
    then: S => { S.arcs = S.arcs.map(a => (a.id === "b-A" ? { ...a, tex: "240^\\circ" } : a)) },
  }),
]

// ── 3. Drawing a bearing: finding C (4024/12/M/J/25 Q6(b)) ──
/** The line from A on 060°, ruled. */
const lineA = (S: Scene) => line(S, "A", 60, 4.2)
/** And the line from B on 320°. */
const lineB = (S: Scene) => line(S, "B", 320, 5.4)

const PART_C: Beat[] = [
  watch("c-q", "Village $C$ is on a bearing of $060^\\circ$ from $A$.", S => { mapBoard(S, S25); brgArc(S, "A", 60, "060^\\circ", { grow: true }); look(S) }, 2.6),
  watch("c-where", "We don't know where $C$ is yet. Let's draw the line from $A$ first.", S => { mapBoard(S, S25); brgArc(S, "A", 60, "060^\\circ"); look(S) }, 2.6),
  protBeat("c-on", "Put the protractor's centre on $A$.", S25, "A", 0, { job: "place" }),
  protBeat("c-turn", "Turn it, so its $0$ lies on the North line.", S25, "A", 0, { job: "turn" }),
  markBeat("mark-60", "Find $60$ on the row that starts at $0$. Slide the pencil to it.", S25, "A", 0, 60, 4.2),
  watch("c-line", "$C$ is somewhere on this line.", S => { mapBoard(S, S25); lineA(S); slideOn(S, "A", "A60"); look(S) }, 3),
  watch("c-q2", "$C$ is also on a bearing of $320^\\circ$ from $B$.", S => { mapBoard(S, S25); lineA(S); brgArc(S, "B", 320, "320^\\circ", { grow: true }); look(S) }, 2.8),
  watch("c-left", "That's more than $180^\\circ$. So we use the angle on the left of North.", S => {
    mapBoard(S, S25)
    lineA(S)
    brgArc(S, "B", 320, "320^\\circ")
    leftArc(S, "B", 320, "?", { grow: true, pulse: true })
    look(S)
  }, 2.8),
  askNum("left-40", "The two angles make $360^\\circ$. What is the angle on the left?", S => {
    mapBoard(S, S25)
    lineA(S)
    brgArc(S, "B", 320, "320^\\circ")
    leftArc(S, "B", 320, "?")
  }, {
    name: "\\text{Angle}", answer: 40,
    slips: [
      { v: 140, say: "That's $320^\\circ - 180^\\circ$. The two angles make $360^\\circ$." },
      { v: 320, say: "That's the bearing. The angle on the left is the rest of the full turn." },
    ],
    above: () => fullTurn("320^\\circ", "?"),
    walk: [
      { say: "The blue part and the orange part make $360^\\circ$.", show: S => pulseArcs(S, "b-B", "l-B") },
      { say: "So take the blue part from $360^\\circ$.", tex: "360 - 320", show: S => pulseArcs(S, "b-B") },
    ],
    then: S => { S.arcs = S.arcs.map(a => (a.id === "l-B" ? { ...a, tex: "40^\\circ" } : a)) },
  }),
  protBeat("b-on", "Now put the protractor's centre on $B$.", S25, "B", 180, { job: "place", startRot: 0, more: lineA }),
  protBeat("b-turn", "Turn it round to the left, so its $0$ lies on the North line.", S25, "B", 180, { job: "turn", startRot: 0, more: lineA }),
  markBeat("mark-40", "Find $40$ on the row that starts at $0$. Slide the pencil to it.", S25, "B", 180, 320, 5.4, lineA),
  watch("c-line2", "$C$ is somewhere on this line too.", S => { mapBoard(S, S25); lineA(S); lineB(S); slideOn(S, "B", "B320"); look(S) }, 3),
  crossBeat("c-tap", "$C$ is on both lines. So where is $C$? Tap it.", S => { mapBoard(S, S25); lineA(S); lineB(S) }, S25_C, "C", [60, 320]),
  watch("c-found", "There's $C$: on $060^\\circ$ from $A$, and on $320^\\circ$ from $B$.", S => {
    mapBoard(S, S25)
    lineA(S)
    lineB(S)
    S.P.C = [...S25_C] as Vec
    S.names = { ...S.names, C: "C" }
    nameBetween(S, "C", [60, 320])
    brgArc(S, "A", 60, "060^\\circ")
    brgArc(S, "B", 320, "320^\\circ")
    look(S)
  }, 2.8),
]

// ── 4. Exam questions ──
/** The ships question's lines: from A on 164°, from B on 252°. */
const shipA = (S: Scene) => line(S, "A", 164, 5.2)
const shipB = (S: Scene) => line(S, "B", 252, 4.6)

const PART_X: Beat[] = [
  // 4024/11/O/N/22 Q4(b)(c)
  watch("x1", "The diagram shows two ships, $A$ and $B$. Measure the bearing of $B$ from $A$.", S => { mapBoard(S, W22); brgArc(S, "A", 125, "?", { grow: true }); look(S) }, 2.8),
  protBeat("x1-on", "Put the protractor's centre on $A$.", W22, "A", 0, { job: "place" }),
  protBeat("x1-turn", "Turn it, so its $0$ lies on the North line.", W22, "A", 0, { job: "turn" }),
  readBeat("x1-brg", "Use the row that starts at $0$. What number is at $AB$?", W22, "A", 0, 125, { answer: 125, three: true, other: 55, line: "AB" }),
  watch("x1-c", "Ship $C$ is on a bearing of $164^\\circ$ from $A$. Let's draw that line.", S => { mapBoard(S, W22); brgArc(S, "A", 164, "164^\\circ", { grow: true }); look(S) }, 2.8),
  markBeat("x1-164", "Slide the pencil to $164$ on the row that starts at $0$.", W22, "A", 0, 164, 5.2),
  watch("x1-line", "$C$ is somewhere on this line.", S => { mapBoard(S, W22); shipA(S); slideOn(S, "A", "A164"); look(S) }, 2.6),
  watch("x1-c2", "$C$ is also on a bearing of $252^\\circ$ from $B$.", S => { mapBoard(S, W22); shipA(S); brgArc(S, "B", 252, "252^\\circ", { grow: true }); look(S) }, 2.6),
  askNum("x1-left", "That's more than $180^\\circ$. What is the angle on the left of North?", S => {
    mapBoard(S, W22)
    shipA(S)
    brgArc(S, "B", 252, "252^\\circ")
    leftArc(S, "B", 252, "?", { grow: true })
  }, {
    name: "\\text{Angle}", answer: 108,
    slips: [{ v: 72, say: "That's $252^\\circ - 180^\\circ$. The two angles make $360^\\circ$." }, { v: 252, say: "That's the bearing. The angle on the left is the rest of the full turn." }],
    above: () => fullTurn("252^\\circ", "?"),
    walk: [
      { say: "The blue part and the orange part make $360^\\circ$.", show: S => pulseArcs(S, "b-B", "l-B") },
      { say: "So take the blue part from $360^\\circ$.", tex: "360 - 252", show: S => pulseArcs(S, "b-B") },
    ],
    then: S => { S.arcs = S.arcs.map(a => (a.id === "l-B" ? { ...a, tex: "108^\\circ" } : a)) },
  }),
  protBeat("x1-bon", "Put the protractor's centre on $B$.", W22, "B", 180, { job: "place", startRot: 0, more: shipA }),
  protBeat("x1-bturn", "Turn it round to the left, so its $0$ lies on the North line.", W22, "B", 180, { job: "turn", startRot: 0, more: shipA }),
  markBeat("x1-252", "Slide the pencil to $108$ on the row that starts at $0$.", W22, "B", 180, 252, 4.6, shipA),
  crossBeat("x1-ctap", "$C$ is on both lines. Tap $C$.", S => { mapBoard(S, W22); shipA(S); shipB(S) }, W22_C, "C", [164, 252]),

  // 4024/12/M/J/24 Q10(a)
  watch("x3", "Part of a field, $ABCD$. Measure the bearing of $C$ from $B$.", S => { mapBoard(S, S24); brgArc(S, "B", 70, "?", { grow: true }); look(S) }, 2.6),
  protBeat("x3-on", "Put the protractor's centre on $B$.", S24, "B", 0, { job: "place" }),
  protBeat("x3-turn", "Turn it, so its $0$ lies on the North line.", S24, "B", 0, { job: "turn" }),
  readBeat("x3-brg", "What number is at $BC$, on the row that starts at $0$?", S24, "B", 0, 70, { answer: 70, three: true, other: 110, line: "BC" }),

  {
    id: "end-brg",
    say: "In summary, a bearing is measured clockwise from North. When it's more than $180^\\circ$, we measure the angle on the left of North and take it away from $360^\\circ$.",
    enter: S => {
      mapBoard(S, S23)
      brgArc(S, "A", 240, "240^\\circ")
      leftArc(S, "A", 240, "120^\\circ")
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C, ...PART_X]

applyParts(BEATS, [
  ["brg-q", "Measuring a bearing"],
  ["left-q", "When it turns past South"],
  ["c-q", "Drawing a bearing"],
  ["x1", "Exam questions"],
])
