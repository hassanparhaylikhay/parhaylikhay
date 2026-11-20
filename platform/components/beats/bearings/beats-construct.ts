/**
 * Constructing triangles (4.2, lesson 2 of 3), one tiny idea per beat.
 *
 * Compasses draw circles: every point on one is the same distance from its
 * centre. So to find C, 4 cm from A and 5 cm from B, the student first drags
 * C round and finds all the places 4 cm from A lie on a circle; then draws
 * arcs with the compasses (opened against the ruler, carried by the top,
 * turned round) and C is where the arcs cross. Then triangles from the
 * papers, a triangle that cannot be made, and shapes made of two triangles:
 * a rhombus, 4024/21/M/J/21 Q4(a) and the field in 4024/12/M/J/24 Q10(b).
 * Questions: 4024/11/M/J/24 Q4, 4024/22/O/N/25 Q4, 4024/12/O/N/19 Q19(a).
 *
 * Colours: the student's pencil (arcs and lines) blue, a place not found
 * yet pink, a length that fits green, what can be dragged yellow.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { type Scene, BLUE, GREEN, PINK, along, addSeg, say, dist, add, sub, mul, brgOf, norm } from "./scene"
import { type Beat, type MapSpec, look, watch, askNum, mapBoard, S24, layBeat, withRuler, readWalk } from "./scale-kit"
import { fig, angleProtBeat, readAngleBeat, markAngleBeat, penBeat, angArcTo } from "./angle-kit"
import { circlesCross, keepArcs, compBeat, tapCrossBeat, type ArcSpec } from "./compass-kit"

// ── the figures (one world unit is a centimetre) ─────────────────────────

const RULER = (x: number, y: number, len = 10) => ({ zero: [x, y] as Vec, len })

/** A point on its own, for the compasses' first circle. */
const DOT = fig({ pts: { A: [0, 0] }, segs: [], prot: [0, -8], noProt: true, ruler: RULER(-3.5, -4.8, 8), room: [[-3.6, -3.6], [3.6, 3.6]] })
/** C, 4 cm from A and 5 cm from B, with AB = 6 cm. */
const AB6 = fig({ pts: { A: [0, 0], B: [6, 0] }, segs: [["A", "B"]], prot: [3, -8], noProt: true, ruler: RULER(-1, -4.4, 8), room: [[-4.2, 4.6], [10.6, 4.6], [-4.2, -1]] })
const [C6, C6b] = circlesCross([0, 0], 4, [6, 0], 5)
/** 4024/11/M/J/24 Q4: AB 8 cm drawn; AC 5 cm, BC 10 cm. */
const S24A = fig({ pts: { A: [0, 0], B: [8, 0] }, segs: [["A", "B"]], prot: [4, -3.0], ruler: RULER(-1.5, -6.6, 11), room: [[-1.6, 6.2], [8.4, 6.2]] })
const [C24] = circlesCross([0, 0], 5, [8, 0], 10)
/** 4024/22/O/N/25 Q4: AB 8.5 cm drawn; AC 6 cm, BC 7 cm. */
const W25A = fig({ pts: { A: [0, 0], B: [8.5, 0] }, segs: [["A", "B"]], prot: [4.2, -3.0], ruler: RULER(-0.6, -6.6, 9), room: [[0, 6.2], [8.5, 6.2]] })
const [C25] = circlesCross([0, 0], 6, [8.5, 0], 7)
/** 4024/12/O/N/19 Q19(a): AB 8 cm, sloping down to the right; C above it, AC 5 cm, BC 7 cm. */
const W19_B = along([0, 0], 110, 8)
const [C19, C19b] = circlesCross([0, 0], 5, W19_B, 7)
const W19A = fig({ pts: { A: [0, 0], B: W19_B }, segs: [["A", "B"]], prot: [0, -9], noProt: true, ruler: RULER(-0.5, -7.6, 8), room: [C19, C19b, add(C19, [0, 1.2])] })
/** A triangle that can't be made: AB 10 cm, AC 3 cm, BC 4 cm. */
const NO = fig({ pts: { A: [0, 0], B: [10, 0] }, segs: [["A", "B"]], prot: [5, -9], noProt: true, ruler: RULER(0, -4.4, 10), room: [[0, 4.4], [10, 4.4]] })
/** A rhombus with sides 5 cm and its diagonal AC 8 cm. */
const RH = fig({ pts: { A: [0, 0], C: [8, 0] }, segs: [["A", "C"]], prot: [4, -9], noProt: true, ruler: RULER(-1.2, -6.2, 8), room: [[4, 4.4], [4, -4.4]] })
const [RB, RD] = circlesCross([0, 0], 5, [8, 0], 5)
/** 4024/21/M/J/21 Q4(a): AC 10 cm drawn, A at the top; B with AB 8 cm and BC 6 cm; D with AD 4.5 cm and angle DAC 50°. */
const S21A: Vec = [0, 10], S21C: Vec = [0, 0]
const [S21B] = circlesCross(S21A, 8, S21C, 6)
const S21D = along(S21A, 230, 4.5)
const S21 = fig({ pts: { A: S21A, C: S21C }, segs: [["A", "C"]], prot: [-5, 2.5], ruler: RULER(1.2, -1.4, 10), room: [S21B, add(S21B, [1.2, 0]), along(S21A, 230, 6.2)] })
const S21Q: MapSpec = { ...S21, pts: { A: S21A, C: S21C, B: S21B, D: S21D }, names: { A: "A", B: "B", C: "C", D: "D" }, segs: [["A", "C"], ["A", "B"], ["B", "C"], ["A", "D"], ["D", "C"]] }
/** 4024/12/M/J/24 Q10(b): the field; D is 250 m from C and 300 m from A (5 cm and 6 cm at 1 cm to 50 m). */
const [FD, FDb] = circlesCross(S24.pts.C, 5, S24.pts.A, 6)
const FIELD: MapSpec = { ...S24, room: [FD, add(FD, [1.4, -1.2]), FDb] }

/** The two lines from a new corner, ruled. */
function joined(S: Scene, c: string, a: string, b: string, grow = false) {
  addSeg(S, a, c, { col: BLUE, grown: !grow }); addSeg(S, b, c, { col: BLUE, grown: !grow })
}
/** A place found: its letter, and the place itself. */
function found(S: Scene, n: string, p: Vec) { S.P[n] = [...p] as Vec; S.names = { ...S.names, [n]: n } }
/** Arcs through a corner from both ends (what each arc had to pass through). */
const arcsTo = (a: string, pa: Vec, ra: number, b: string, pb: Vec, rb: number, c: Vec): ArcSpec[] => [{ at: a, r: ra, through: [brgOf(pa, c)] }, { at: b, r: rb, through: [brgOf(pb, c)] }]

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  {
    id: "comp-hi",
    say: "These are compasses. They draw circles.",
    enter: S => {
      mapBoard(S, DOT)
      S.comp = { point: [0, 0], on: "A", open: 3, dir: 60, canOpen: false, move: false, draw: false, drawing: null }
      // they turn by themselves, drawing as they go
      S.acts.push({ dur: 0.6 }, {
        dur: 2.6,
        begin: S2 => { S2.comp!.drawing = { from: 60, to: 60 } },
        run: (S2, e) => { const C = S2.comp!; C.drawing!.to = 60 + 360 * e; C.dir = norm(60 + 360 * e) },
        end: S2 => { const C = S2.comp!; C.drawing = null; S2.penArcs = [{ id: "demo", at: [0, 0], r: 3, from: 60, sweep: 360 }] },
      })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  compBeat("open-3", "Open them to $3$ cm on the ruler.", DOT, "A", 3, { job: "open" }),
  compBeat("put-a", "Put the point on $A$.", DOT, "A", 3, { job: "place" }),
  compBeat("turn-a", "Now turn them all the way round.", DOT, "A", 3, { job: "draw", round: 340, shortSay: "Keep going, all the way round." }),
  {
    id: "all-3",
    say: "Every point on this circle is $3$ cm from $A$.",
    enter: S => {
      mapBoard(S, DOT)
      keepArcs(S, [{ at: "A", r: 3, through: [0, 120, 240] }])
      // a point runs round the circle, its distance from A always 3 cm
      S.P.X = along([0, 0], 30, 3)
      S.dots = ["X"]
      addSeg(S, "A", "X", { col: GREEN, lab: { tex: "3\\text{ cm}", col: GREEN } })
      S.tick = S2 => { const b = 30 + (S2.time - S2.beatStart) * 40; S2.P.X = along([0, 0], b, 3); S2.D.X = S2.P.X }
      look(S)
    },
    cta: "", ctaAfter: 3.0,
  },
  {
    id: "arc",
    say: "Part of a circle is called an *arc*.",
    enter: S => { mapBoard(S, DOT); S.penArcs = [{ id: "part", at: [0, 0], r: 3, from: 20, sweep: 80, pulse: true }]; look(S) },
    cta: "", ctaAfter: 2.4,
  },
]

/** The board for finding C: AB, and C (pink until found) with its live distances. */
function cBoard(S: Scene) {
  mapBoard(S, AB6)
}

const PART_2: Beat[] = [
  {
    id: "c-q",
    say: "We want a point $C$, $4$ cm from $A$ and $5$ cm from $B$.",
    enter: S => {
      cBoard(S)
      found(S, "C", [4.4, 2.6]); S.nameCol.C = PINK
      addSeg(S, "A", "C", { col: PINK, dash: true, lab: { tex: "4\\text{ cm}", col: PINK } })
      addSeg(S, "B", "C", { col: PINK, dash: true, lab: { tex: "5\\text{ cm}", col: PINK } })
      look(S)
    },
    cta: "", ctaAfter: 2.8,
  },
  dragC("c-4", "Drag $C$ until it is $4$ cm from $A$.", 1),
  { ...dragC("c-more", "Is that the only place? Try another.", 5), free: true, minPlay: 4 },
  {
    id: "c-circle",
    say: "All these places lie on a circle round $A$.",
    enter: S => {
      cBoard(S)
      trailDots(S)
      S.penArcs = [{ id: "circ", at: [0, 0], r: 4, from: 0, sweep: 0, col: PINK }]
      S.acts.push({ dur: 0.4 }, { dur: 1.8, run: (S2, e) => { S2.penArcs = [{ id: "circ", at: [0, 0], r: 4, from: 0, sweep: 360 * e, col: PINK }] } })
      look(S)
    },
    cta: "", ctaAfter: 3.0,
  },
  compBeat("c-open", "Let's draw it with the compasses. Open them to $4$ cm.", AB6, "A", 4, { job: "open" }),
  compBeat("c-put", "Put the point on $A$.", AB6, "A", 4, { job: "place" }),
  compBeat("c-draw", "Draw an arc above $AB$, where $C$ could be.", AB6, "A", 4, { job: "draw", through: [brgOf([0, 0], C6)], startDir: 0, shortSay: "Draw it further round, over where $C$ could be." }),
  {
    id: "c-on-arc",
    say: "$C$ is somewhere on this arc.",
    enter: S => {
      cBoard(S)
      keepArcs(S, [{ at: "A", r: 4, through: [brgOf([0, 0], C6)] }])
      found(S, "C", C6); S.nameCol.C = PINK
      const b0 = brgOf([0, 0], C6)
      S.tick = S2 => { const b = b0 + 14 * Math.sin((S2.time - S2.beatStart) * 1.4); S2.P.C = along([0, 0], b, 4); S2.D.C = S2.P.C }
      look(S)
    },
    cta: "", ctaAfter: 2.6,
  },
  compBeat("c-b", "Now the places $5$ cm from $B$. Draw that arc too.", AB6, "B", 5, {
    job: "all", through: [brgOf([6, 0], C6)], shortSay: "Draw it further round, over where $C$ could be.",
    wrongOpen: [{ v: 4, say: "From $B$ we need $5$ cm." }],
    more: S => keepArcs(S, [{ at: "A", r: 4, through: [brgOf([0, 0], C6)] }]),
  }),
  tapCrossBeat("c-tap", "$C$ is on both arcs. Tap $C$.", S => { cBoard(S); keepArcs(S, arcsTo("A", [0, 0], 4, "B", [6, 0], 5, C6)) }, [C6, C6b], "C", { arcs: [["A", 4], ["B", 5]] }),
  watch("c-join", "Now join $C$ to $A$ and to $B$.", S => {
    cBoard(S); keepArcs(S, arcsTo("A", [0, 0], 4, "B", [6, 0], 5, C6))
    found(S, "C", (S.keep["cross-c-tap"] ?? 0) === 1 ? C6b : C6)
    addSeg(S, "A", "C", { col: BLUE, grown: false, lab: { tex: "4\\text{ cm}" } }); addSeg(S, "B", "C", { col: BLUE, grown: false, lab: { tex: "5\\text{ cm}" } })
    look(S)
  }, 2.6),
  watch("c-leave", "Leave the arcs on the drawing. They show how you found $C$.", S => {
    cBoard(S); keepArcs(S, arcsTo("A", [0, 0], 4, "B", [6, 0], 5, C6))
    S.penArcs = S.penArcs.map(a => ({ ...a, pulse: true }))
    found(S, "C", (S.keep["cross-c-tap"] ?? 0) === 1 ? C6b : C6)
    joined(S, "C", "A", "B")
    look(S)
  }, 2.8),
]

/**
 * Drag C round: it clicks onto 4 cm from A, and slides along there while the
 * finger stays close. `need` places 4 cm from A, each leaving a dot (kept,
 * with where it is, for the beat after).
 */
function dragC(id: string, text: string, need: number): Beat {
  return {
    id, say: text,
    enter: S => {
      cBoard(S)
      found(S, "C", [4.6, 2.9]); S.nameCol.C = PINK
      S.dragPts = ["C"]
      S.keep.trail = 0
      addSeg(S, "A", "C", { col: PINK, dash: true, lab: { tex: "?", col: PINK } })
      S.tick = S2 => {
        const a = S2.P.A, c = S2.P.C, d = dist(a, c)
        // within a millimetre or so of 4 cm it clicks onto it
        if (Math.abs(d - 4) < 0.12 && d > 1e-6) S2.P.C = add(a, mul(sub(c, a), 4 / d))
        const d2 = dist(S2.P.A, S2.P.C), on = Math.abs(d2 - 4) < 1e-6
        const sg = S2.segs.find(x => x.a === "A" && x.b === "C")
        if (sg) { sg.lab = { tex: `${d2.toFixed(1)}\\text{ cm}`, col: on ? GREEN : PINK }; sg.col = on ? GREEN : PINK }
        // each new place 4 cm from A leaves a dot (a little way from the others)
        const n = S2.keep.trail ?? 0
        if (on && Array.from({ length: n }, (_, k) => S2.P[`t${k}`]).every(q => !q || dist(q, S2.P.C) > 1.0)) {
          S2.P[`t${n}`] = [...S2.P.C] as Vec
          S2.dots = [...S2.dots, `t${n}`]
          S2.keep[`t${n}`] = brgOf(a, S2.P.C)
          S2.keep.trail = n + 1
        }
        if (!S2.drag && on && (S2.keep.trail ?? 0) >= need) S2.got.add("done")
        if (need > 1 && (S2.keep.trail ?? 0) >= need && !S2.got.has("said")) { S2.got.add("said"); say(S2, "Look where the dots are.", "calm", 600) }
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1400,
  }
}
/** The dots where C was 4 cm from A (the student's, or spread round the circle for a board opened cold). */
function trailDots(S: Scene) {
  const n = S.keep.trail ?? 0
  const brgs = n >= 3 ? Array.from({ length: n }, (_, k) => S.keep[`t${k}`]) : [20, 82, 144, 206, 268, 330]
  brgs.forEach((b, k) => { S.P[`t${k}`] = along([0, 0], b, 4); S.dots = [...S.dots, `t${k}`] })
}

// ── constructing triangles ───────────────────────────────────────────────

/** The crossing the student tapped for a construction (either works, unless the question says which). */
const pickC = (S: Scene, id: string, C: Vec, Cb: Vec) => (S.keep[`cross-${id}-c`] === 1 ? Cb : C)

/** A triangle from three sides: the arc from A, the arc from B, the crossing tapped, the sides joined. */
function construct(id: string, M: MapSpec, ra: number, rb: number, C: Vec, Cb: Vec, o: { ask: string; ok?: number[]; wrongSay?: string }): Beat[] {
  const A = M.pts.A, B = M.pts.B
  const arcs = arcsTo("A", A, ra, "B", B, rb, C)
  const board = (S: Scene) => mapBoard(S, M)
  return [
    watch(id, o.ask, S => { board(S); look(S) }, 3.0),
    compBeat(`${id}-a`, "Draw the arc from $A$.", M, "A", ra, {
      job: "all", through: [brgOf(A, C)], shortSay: "Draw it further round, over where $C$ could be.",
      wrongOpen: [{ v: rb, say: `From $A$ we need $AC$, which is $${ra}$ cm.` }],
    }),
    compBeat(`${id}-b`, "Now the arc from $B$.", M, "B", rb, {
      job: "all", through: [brgOf(B, C)], shortSay: "Draw it further round, until it crosses the first arc.",
      wrongOpen: [{ v: ra, say: `From $B$ we need $BC$, which is $${rb}$ cm.` }],
      more: S => keepArcs(S, [arcs[0]]),
    }),
    tapCrossBeat(`${id}-c`, "$C$ is where the arcs cross. Tap $C$.", S => { board(S); keepArcs(S, arcs) }, [C, Cb], "C", { ok: o.ok, wrongSay: o.wrongSay, arcs: [["A", ra], ["B", rb]] }),
    watch(`${id}-join`, "Join $C$ to $A$ and to $B$.", S => { board(S); keepArcs(S, arcs); found(S, "C", pickC(S, id, C, Cb)); joined(S, "C", "A", "B", true); look(S) }, 2.2),
  ]
}

const C24b = circlesCross([0, 0], 5, [8, 0], 10)[1], C25b = circlesCross([0, 0], 6, [8.5, 0], 7)[1]
const s24Done = (S: Scene) => { mapBoard(S, S24A); keepArcs(S, arcsTo("A", [0, 0], 5, "B", [8, 0], 10, C24)); found(S, "C", pickC(S, "s24", C24, C24b)); joined(S, "C", "A", "B") }
const w25Done = (S: Scene) => { mapBoard(S, W25A); keepArcs(S, arcsTo("A", [0, 0], 6, "B", [8.5, 0], 7, C25)); found(S, "C", pickC(S, "w25", C25, C25b)); joined(S, "C", "A", "B") }

const PART_3: Beat[] = [
  // 4024/11/M/J/24 Q4
  ...construct("s24", S24A, 5, 10, C24, C24b, { ask: "$AC = 5$ cm and $BC = 10$ cm. $AB$ has been drawn." }),
  angleProtBeat("s24-prot", "Now measure angle $BAC$. Put the protractor on $A$, with its $0$ along a line.", S24A, "A", "B", "C", {
    job: "both", more: s24Done, next: "Now turn it, so its $0$ lies along $AB$ or $AC$.",
  }),
  readAngleBeat("s24-read", "What is angle $BAC$?", S24A, "A", "B", "C", {
    name: "BAC", answer: 97.9, more: s24Done,
    walk: ["Find the row that starts at $0$ on $AB$.", "Follow that row round to where $AC$ crosses it."],
  }),

  // 4024/22/O/N/25 Q4
  ...construct("w25", W25A, 6, 7, C25, C25b, { ask: "In triangle $ABC$, $AB = 8.5$ cm, $AC = 6$ cm and $BC = 7$ cm." }),
  angleProtBeat("w25-prot", "Measure angle $BAC$.", W25A, "A", "B", "C", { job: "both", more: w25Done, next: "Now turn it, so its $0$ lies along $AB$ or $AC$." }),
  readAngleBeat("w25-read", "What is angle $BAC$?", W25A, "A", "B", "C", {
    name: "BAC", answer: 54.5, more: w25Done,
    walk: ["Find the row that starts at $0$ on $AB$.", "Follow that row round to where $AC$ crosses it."],
  }),

  // 4024/12/O/N/19 Q19(a): above AB, so only one crossing will do
  ...construct("w19", W19A, 5, 7, C19, C19b, { ask: "$C$ is above $AB$, with $AC = 5$ cm and $BC = 7$ cm.", ok: [0], wrongSay: "That one is below $AB$. $C$ is above it." }),
]

const PART_4: Beat[] = [
  watch("no", "Let's try $AB = 10$ cm, $AC = 3$ cm and $BC = 4$ cm.", S => { mapBoard(S, NO); look(S) }, 2.8),
  compBeat("no-a", "Draw an arc of $3$ cm from $A$.", NO, "A", 3, { job: "all", round: 100, shortSay: "Draw it further round." }),
  compBeat("no-b", "Now an arc of $4$ cm from $B$.", NO, "B", 4, { job: "all", round: 100, shortSay: "Draw it further round.", more: S => keepArcs(S, [{ at: "A", r: 3, through: [20, 120] }]) }),
  watch("no-cross", "Where do they cross?", S => { mapBoard(S, NO); keepArcs(S, [{ at: "A", r: 3, through: [20, 120] }, { at: "B", r: 4, through: [240, 340] }]); look(S) }, 2.4),
  {
    id: "no-why",
    say: "They don't. $3 + 4$ is only $7$, less than $10$.",
    enter: S => {
      mapBoard(S, NO)
      keepArcs(S, [{ at: "A", r: 3, through: [20, 120] }, { at: "B", r: 4, through: [240, 340] }])
      // the two short sides lie down along AB, and fall short of each other
      S.P.X = [3, 0]; S.P.Y = [6, 0]
      addSeg(S, "A", "X", { col: BLUE, lab: { tex: "3" } }); addSeg(S, "Y", "B", { col: BLUE, lab: { tex: "4" } })
      addSeg(S, "X", "Y", { col: PINK, dash: true, lab: { tex: "3", col: PINK } })
      look(S)
    },
    cta: "", ctaAfter: 3.2,
  },
  watch("no-rule", "The two short sides can't reach. So there is no triangle.", S => {
    mapBoard(S, NO); keepArcs(S, [{ at: "A", r: 3, through: [20, 120] }, { at: "B", r: 4, through: [240, 340] }])
    S.P.X = [3, 0]; S.P.Y = [6, 0]
    addSeg(S, "A", "X", { col: BLUE }); addSeg(S, "Y", "B", { col: BLUE }); addSeg(S, "X", "Y", { col: PINK, dash: true })
    look(S)
  }, 2.8),
]

const rhArcs = (below = false): ArcSpec[] => [
  { at: "A", r: 5, through: [brgOf([0, 0], RB)] }, { at: "C", r: 5, through: [brgOf([8, 0], RB)] },
  ...(below ? [{ at: "A", r: 5, through: [brgOf([0, 0], RD)] }, { at: "C", r: 5, through: [brgOf([8, 0], RD)] }] : []),
]
const s21Arcs: ArcSpec[] = [{ at: "A", r: 8, through: [brgOf(S21A, S21B)] }, { at: "C", r: 6, through: [brgOf(S21C, S21B)] }]
const s21Board = (S: Scene, o: { b?: boolean; dLine?: boolean; d?: boolean } = {}) => {
  mapBoard(S, S21, { prot: "A" })
  keepArcs(S, s21Arcs)
  if (o.b) { found(S, "B", S21B); joined(S, "B", "A", "C") }
  if (o.dLine) { S.P.A230 = along(S21A, 230, 6.2); addSeg(S, "A", "A230", { col: BLUE }) }
  if (o.d) { found(S, "D", S21D); addSeg(S, "D", "C", { col: BLUE }) }
}
const fieldBoard = (S: Scene, o: { d?: boolean } = {}) => {
  mapBoard(S, FIELD)
  keepArcs(S, [{ at: "C", r: 5, through: [brgOf(S24.pts.C, FD)] }, { at: "A", r: 6, through: [brgOf(S24.pts.A, FD)] }])
  if (o.d) { found(S, "D", FD); addSeg(S, "C", "D", { col: BLUE, grown: false }); addSeg(S, "D", "A", { col: BLUE, grown: false }) }
}

const PART_5: Beat[] = [
  // a rhombus: two triangles on one diagonal
  watch("rh", "A rhombus has four equal sides. Let's construct one with sides $5$ cm.", S => {
    mapBoard(S, RH); found(S, "B", RB); found(S, "D", RD)
    for (const [a, b] of [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]]) addSeg(S, a, b, { col: GREEN, lab: { tex: "5", col: GREEN } })
    look(S)
  }, 3.0),
  watch("rh-ac", "Its diagonal $AC$ is $8$ cm. It splits the rhombus into two triangles.", S => { mapBoard(S, RH); look(S) }, 3.0),
  compBeat("rh-a", "Draw an arc of $5$ cm from $A$, above $AC$.", RH, "A", 5, { job: "all", through: [brgOf([0, 0], RB)] }),
  compBeat("rh-c", "Now an arc of $5$ cm from $C$.", RH, "C", 5, { job: "all", through: [brgOf([8, 0], RB)], more: S => keepArcs(S, [rhArcs()[0]]) }),
  tapCrossBeat("rh-b", "Tap $B$, where they cross.", S => { mapBoard(S, RH); keepArcs(S, rhArcs()) }, [RB, RD], "B", { ok: [0], wrongSay: "Take the one above $AC$ first.", arcs: [["A", 5], ["C", 5]] }),
  compBeat("rh-a2", "Now the same below $AC$. Draw an arc of $5$ cm from $A$.", RH, "A", 5, { job: "draw", through: [brgOf([0, 0], RD)], startDir: 140, more: S => { keepArcs(S, rhArcs()); found(S, "B", RB); joined(S, "B", "A", "C") } }),
  compBeat("rh-c2", "And from $C$.", RH, "C", 5, { job: "draw", through: [brgOf([8, 0], RD)], startDir: 220, more: S => { keepArcs(S, [...rhArcs(), rhArcs(true)[2]]); found(S, "B", RB); joined(S, "B", "A", "C") } }),
  tapCrossBeat("rh-d", "Tap $D$.", S => { mapBoard(S, RH); keepArcs(S, rhArcs(true)); found(S, "B", RB); joined(S, "B", "A", "C") }, [RD], "D"),
  watch("rh-done", "Two triangles make the rhombus $ABCD$.", S => { mapBoard(S, RH); keepArcs(S, rhArcs(true)); found(S, "B", RB); found(S, "D", RD); joined(S, "B", "A", "C"); joined(S, "D", "A", "C", true); look(S) }, 2.8),

  // 4024/21/M/J/21 Q4(a)
  watch("s21", "$AC = 10$ cm has been drawn. First make triangle $ABC$, with $AB = 8$ cm and $BC = 6$ cm.", S => { mapBoard(S, S21); look(S) }, 3.2),
  compBeat("s21-a", "Draw the arc from $A$.", S21, "A", 8, { job: "all", through: [brgOf(S21A, S21B)], wrongOpen: [{ v: 6, say: "From $A$ we need $AB$, which is $8$ cm." }] }),
  compBeat("s21-c", "Now the arc from $C$.", S21, "C", 6, { job: "all", through: [brgOf(S21C, S21B)], wrongOpen: [{ v: 8, say: "From $C$ we need $BC$, which is $6$ cm." }], more: S => keepArcs(S, [s21Arcs[0]]) }),
  tapCrossBeat("s21-b", "Tap $B$. It is on the right of $AC$.", S => { mapBoard(S, S21); keepArcs(S, s21Arcs) }, circlesCross(S21A, 8, S21C, 6), "B", { ok: [0], wrongSay: "That one is on the left. $B$ is on the right of $AC$.", arcs: [["A", 8], ["C", 6]] }),
  watch("s21-d", "Now for $D$, with $AD = 4.5$ cm and angle $DAC = 50^\\circ$.", S => { s21Board(S, { b: true }); angArcTo(S, "A", "C", 230, PINK, { tex: "50^\\circ" }); look(S) }, 3.0),
  angleProtBeat("s21-prot", "Put the protractor on $A$, with its $0$ along $AC$.", S21, "A", "C", "C", {
    job: "both", target: 230, arm: "C", startRot: 270, more: S => { s21Board(S, { b: true }); angArcTo(S, "A", "C", 230, PINK, { tex: "50^\\circ" }) },
    next: "Now turn it, so its $0$ lies along $AC$.", wrongSay: "$D$ is on the left of $AC$. Turn the protractor round to that side.",
  }),
  markAngleBeat("s21-50", "Slide the pencil to $50$.", S21, "A", "C", 230, 50, { far: 6.2, end: "A230", more: S => { s21Board(S, { b: true }); angArcTo(S, "A", "C", 230, PINK, { tex: "50^\\circ" }) } }),
  penBeat("s21-45", "Now mark $4.5$ cm along this line with the ruler.", S21, "A", 230, 4.5, "D", { rulerLen: 7, more: S => { s21Board(S, { b: true, dLine: true }); angArcTo(S, "A", "C", 230, BLUE, { tex: "50^\\circ" }) } }),
  watch("s21-join", "Join $D$ to $C$.", S => { s21Board(S, { b: true, dLine: true }); found(S, "D", S21D); addSeg(S, "D", "C", { col: BLUE, grown: false }); look(S) }, 2.2),
  angleProtBeat("s21-pd", "Now measure angle $ADC$. Put the protractor on $D$.", S21Q, "D", "A", "C", { job: "both", more: S => s21Board(S, { b: true, dLine: true, d: true }), next: "Now turn it, so its $0$ lies along $DA$ or $DC$." }),
  readAngleBeat("s21-adc", "What is angle $ADC$?", S21Q, "D", "A", "C", {
    name: "ADC", answer: 104.1, more: S => s21Board(S, { b: true, dLine: true, d: true }),
    walk: ["Find the row that starts at $0$ on $DA$.", "Follow that row round to where $DC$ crosses it."],
  }),
  layBeat("s21-lay", "Its perimeter needs $DC$ too. Lay the ruler along $DC$.", S21Q, "D", "C", S => s21Board(S, { b: true, dLine: true, d: true })),
  askNum("s21-dc", "How long is $DC$?", S => { s21Board(S, { b: true, dLine: true, d: true }); withRuler(S, S21Q, { on: "D", along: "C", follow: true, fixed: true }) }, {
    name: "DC", answer: 7.9, unit: "cm", dec: true, tol: 0.1, near: 0.4, walk: readWalk(),
  }),
  askNum("s21-per", "So what is the perimeter of $ABCD$?", S => {
    s21Board(S, { b: true, dLine: true, d: true })
    addSeg(S, "A", "B", { col: BLUE, lab: { tex: "8" } }); addSeg(S, "B", "C", { col: BLUE, lab: { tex: "6" } }); addSeg(S, "D", "C", { col: BLUE, lab: { tex: "7.9" } }); addSeg(S, "A", "D", { col: BLUE, lab: { tex: "4.5" } })
  }, {
    name: "\\text{Perimeter}", answer: 26.4, unit: "cm", dec: true, tol: 0.1, near: 1,
    walk: [
      { say: "The perimeter goes all the way round $ABCD$.", show: S => { S.segs = S.segs.map(sg => (["A-B", "B-C", "D-C", "A-D"].includes(`${sg.a}-${sg.b}`) ? { ...sg, glow: true } : sg)) } },
      { say: "So add the four sides.", tex: "8 + 6 + 7.9 + 4.5" },
    ],
  }),

  // 4024/12/M/J/24 Q10(b)
  watch("field", "This is part of a field, $ABCD$. $D$ is $250$ m from $C$ and $300$ m from $A$.", S => { mapBoard(S, FIELD); look(S) }, 3.0),
  askNum("field-5", "The scale is $1$ cm to $50$ m. How many cm is $250$ m?", S => mapBoard(S, FIELD), {
    name: "250\\text{ m}", answer: 5, unit: "cm", dec: true,
    walk: [{ say: "Each cm stands for $50$ m.", tex: "1\\text{ cm} \\to 50\\text{ m}" }, { say: "How many lots of $50$ m make $250$ m?", tex: "250 \\div 50" }],
  }),
  askNum("field-6", "And $300$ m?", S => mapBoard(S, FIELD), {
    name: "300\\text{ m}", answer: 6, unit: "cm", dec: true,
    walk: [{ say: "Each cm stands for $50$ m.", tex: "1\\text{ cm} \\to 50\\text{ m}" }, { say: "How many lots of $50$ m make $300$ m?", tex: "300 \\div 50" }],
  }),
  compBeat("field-c", "Draw an arc of $5$ cm from $C$.", FIELD, "C", 5, { job: "all", through: [brgOf(S24.pts.C, FD)], shortSay: "Draw it further round." }),
  compBeat("field-a", "Now an arc of $6$ cm from $A$.", FIELD, "A", 6, { job: "all", through: [brgOf(S24.pts.A, FD)], shortSay: "Draw it further round, until it crosses the first arc.", more: S => keepArcs(S, [{ at: "C", r: 5, through: [brgOf(S24.pts.C, FD)] }]) }),
  tapCrossBeat("field-d", "Tap $D$.", S => fieldBoard(S), [FD, FDb], "D", { ok: [0], wrongSay: "With $D$ there, the sides of $ABCD$ would cross. Try the other one.", arcs: [["C", 5], ["A", 6]] }),
  watch("field-done", "That's the field $ABCD$.", S => { fieldBoard(S, { d: true }); look(S) }, 2.4),
  {
    id: "end",
    say: "In summary, draw an arc from each end of the side you have. The third corner is where the arcs cross.",
    enter: S => { w25Done(S); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4, ...PART_5]

applyParts(BEATS, [
  ["comp-hi", "Compasses"],
  ["c-q", "Finding a point"],
  ["s24", "Constructing a triangle"],
  ["no", "When it can't be made"],
  ["rh", "Two triangles"],
])

