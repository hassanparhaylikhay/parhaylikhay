/**
 * Pythagoras in 3D (6.4, lesson 1 of 2). The student builds a box, finds the
 * length right across its inside by finding a right-angled triangle that
 * stands up inside it, lifting it out flat, and using Pythagoras twice. Then
 * the one-line rule, practice, pyramids, and exam questions from the papers:
 * 4024/21/O/N/25 Q25(a), 4024/21/O/N/21 Q10(b)(i), 4024/22/O/N/18 Q9(a),
 * 4024/23/M/J/25 Q22(b)(i).
 *
 * The discovery box is 12 × 9 × 8: its floor diagonal is 15 and its long
 * diagonal 17, both whole, and it is chunky enough that every triangle in it
 * reads clearly.
 */

import { applyParts } from "../chapter"
import { row, op, type ENode } from "../equation"
import {
  type Scene, type V3, CHALK, BLUE, ORANGE, PINK, GREEN, YELLOW,
  later, say, segKey, addSeg, liftOut, putBack, clamp, choose, goodView, type CrossState,
} from "./scene"
import {
  type Beat, look, num, sig, c, pc, sq, stack, lens, boxBoard, boxLens, ecBoard, pyrBoard, solidBoard,
  turnBeat, watch, joinBeat, rightBeat, liftBeat, missingBeat, askBeat, crossBeat, pythWalk,
} from "./kit"

// ── the discovery box: E G C lifted out, and E H G beside it ──────────────

const EG = Math.hypot(12, 9) // 15
const EC = Math.hypot(EG, 8) // 17

function upFlat(S: Scene, o: { eg?: string; ec?: string } = {}) {
  liftOut(S, "up", ["E", "G", "C"], "G", {
    [segKey("E", "G")]: lens(o.eg ?? "?", BLUE),
    [segKey("G", "C")]: lens("8", ORANGE),
    [segKey("E", "C")]: lens(o.ec ?? "?", PINK),
  }, true)
}
function floorFlat(S: Scene, o: { eg?: string } = {}) {
  liftOut(S, "floor", ["E", "H", "G"], "H", {
    [segKey("E", "H")]: lens("12", CHALK),
    [segKey("H", "G")]: lens("9", CHALK),
    [segKey("E", "G")]: lens(o.eg ?? "?", BLUE),
  }, true)
  S.tris = [...S.tris, { id: "EHG", pts: ["E", "H", "G"], col: BLUE }]
}
function liftedBoard(S: Scene, o: { floor?: boolean; eg?: string; ec?: string } = {}) {
  ecBoard(S, { eg: true, tri: true, right: true })
  upFlat(S, o)
  if (o.floor) floorFlat(S, o)
}

// ── the pyramid: E X C lifted out, and A B C beside it ────────────────────

const PY_AC = Math.hypot(6, 6)
const PY_XC = PY_AC / 2
const PY_EC = Math.hypot(PY_XC, 8)
const PY_EM = Math.hypot(3, 8)

function pyUpFlat(S: Scene, o: { xc?: string; ec?: string } = {}) {
  liftOut(S, "up", ["E", "X", "C"], "X", {
    [segKey("E", "X")]: lens("8", ORANGE),
    [segKey("X", "C")]: lens(o.xc ?? "?", BLUE),
    [segKey("E", "C")]: lens(o.ec ?? "?", PINK),
  }, true)
}
function pyFloorFlat(S: Scene, o: { ac?: string } = {}) {
  liftOut(S, "floor", ["A", "B", "C"], "B", {
    [segKey("A", "B")]: lens("6", CHALK),
    [segKey("B", "C")]: lens("6", CHALK),
    [segKey("A", "C")]: lens(o.ac ?? "?", BLUE),
  }, true)
  S.tris = [...S.tris, { id: "ABC", pts: ["A", "B", "C"], col: BLUE }]
}
function pyLiftedBoard(S: Scene, o: { floor?: boolean; ac?: string; xc?: string; ec?: string } = {}) {
  pyrBoard(S, { diags: true, height: true })
  S.edgeCol[segKey("E", "C")] = PINK
  S.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: CHALK }]
  pyUpFlat(S, o)
  if (o.floor) pyFloorFlat(S, o)
}

// ── exam figures ─────────────────────────────────────────────────────────

/** 4024/21/O/N/25 Q25: EH = 12, HG = 10, GC = 7. */
const X1_EG = Math.hypot(12, 10)
const X1_CE = Math.hypot(X1_EG, 7)
function x1Board(S: Scene, o: { eg?: boolean; tri?: boolean } = {}) {
  ecBoard(S, { l: 12, w: 10, h: 7, eg: o.eg, tri: o.tri, right: o.tri })
  S.lens[segKey("E", "H")] = lens("12")
  S.lens[segKey("H", "G")] = lens("10")
  S.lens[segKey("G", "C")] = lens("7")
}
function x1Flats(S: Scene, o: { eg?: string; ce?: string; floor?: boolean } = {}) {
  liftOut(S, "up", ["E", "G", "C"], "G", { [segKey("E", "G")]: lens(o.eg ?? "?", BLUE), [segKey("G", "C")]: lens("7", ORANGE), [segKey("E", "C")]: lens(o.ce ?? "?", PINK) }, true)
  if (o.floor) {
    liftOut(S, "floor", ["E", "H", "G"], "H", { [segKey("E", "H")]: lens("12", CHALK), [segKey("H", "G")]: lens("10", CHALK), [segKey("E", "G")]: lens(o.eg ?? "?", BLUE) }, true)
    S.tris = [...S.tris, { id: "EHG", pts: ["E", "H", "G"], col: BLUE }]
  }
}

/** 4024/21/O/N/21 Q10(b): square base, EX = 17, EC = 19; the base is 12. */
const X2_XC = Math.sqrt(19 * 19 - 17 * 17)
const X2_AC = 2 * X2_XC
function x2Board(S: Scene) {
  pyrBoard(S, { l: 12, w: 12, h: 17, diags: true, height: true })
  S.segs[segKey("B", "D")].faint = false
  S.lens[segKey("E", "X")] = lens("17", ORANGE)
  S.lens[segKey("E", "C")] = lens("19", PINK)
  S.edgeCol[segKey("E", "C")] = PINK
}
function x2Up(S: Scene, o: { xc?: string } = {}) {
  liftOut(S, "up", ["E", "X", "C"], "X", { [segKey("E", "X")]: lens("17", ORANGE), [segKey("X", "C")]: lens(o.xc ?? "?", BLUE), [segKey("E", "C")]: lens("19", PINK) }, true)
  S.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: CHALK }]
}

/** 4024/22/O/N/18 Q9: a rectangle 6.2 by 4.3, sloping edges 9.5; F the top above E, the middle. */
const X3_AC = Math.hypot(6.2, 4.3)
const X3_EC = X3_AC / 2
const X3_H = Math.sqrt(9.5 * 9.5 - X3_EC * X3_EC)
const X3_NAMES = { A: "A", B: "B", C: "C", D: "D", E: "F", X: "E" }
function x3Board(S: Scene) {
  pyrBoard(S, { l: 6.2, w: 4.3, h: X3_H, names: X3_NAMES, diags: true })
  S.segs[segKey("B", "D")].faint = false
  S.lens[segKey("A", "B")] = lens("6.2")
  S.lens[segKey("B", "C")] = lens("4.3")
  S.lens[segKey("E", "C")] = lens("9.5", PINK)
  S.edgeCol[segKey("E", "C")] = PINK
  addSeg(S, "X", "E", { grown: true })
  S.rights = [{ at: "X", a: "E", b: "C" }]
}
function x3Up(S: Scene, o: { ec?: string; h?: string } = {}) {
  liftOut(S, "up", ["E", "X", "C"], "X", { [segKey("E", "X")]: lens(o.h ?? "?", ORANGE), [segKey("X", "C")]: lens(o.ec ?? "?", BLUE), [segKey("E", "C")]: lens("9.5", PINK) }, true)
  S.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: CHALK }]
}
function x3Floor(S: Scene, o: { ac?: string } = {}) {
  liftOut(S, "floor", ["A", "B", "C"], "B", { [segKey("A", "B")]: lens("6.2", CHALK), [segKey("B", "C")]: lens("4.3", CHALK), [segKey("A", "C")]: lens(o.ac ?? "?", BLUE) }, true)
  S.tris = [...S.tris, { id: "ABC", pts: ["A", "B", "C"], col: BLUE }]
}

/** 4024/23/M/J/25 Q22: a pyramid on an equilateral triangle, sides 34; the edges up are 82 (drawn not to scale). */
const X4_R = 34 / Math.sqrt(3)
const X4_MB = Math.sqrt(34 * 34 - 17 * 17)
const X4_OB = (2 / 3) * X4_MB
function x4Board(S: Scene) {
  const at = (deg: number): V3 => [X4_R * Math.cos(deg * Math.PI / 180), X4_R * Math.sin(deg * Math.PI / 180), 0]
  const A = at(210), C = at(330), B = at(90)
  const M: V3 = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2, 0]
  solidBoard(S, { A, B, C, V: [0, 0, 44], O: [0, 0, 0], M }, [["A", "C", "B"], ["V", "A", "C"], ["V", "C", "B"], ["V", "B", "A"]], { A: "A", B: "B", C: "C", V: "V", O: "O", M: "M" })
  S.fitPts = ["A", "B", "C", "V"]
  S.lens[segKey("B", "C")] = lens("34")
  S.lens[segKey("V", "B")] = lens("82", PINK)
  S.dots = ["O", "M"]
  addSeg(S, "M", "B", { grown: true })
  addSeg(S, "O", "V", { grown: true, faint: true })
}

// ── the beats ────────────────────────────────────────────────────────────

const PART_A: Beat[] = [
  // ── 1. Make a box ──
  {
    id: "make",
    say: "Let's make a box. Pull the top up.",
    enter: S => {
      boxBoard(S, { l: 6, w: 4, h: 0, letters: false })
      goodView(S, -34, 26)
      let h0 = 0
      S.handles = [{ id: "top", at: S2 => [0, 0, S2.box!.h], axis: [0, 0, 1], start: S2 => { h0 = S2.box!.h }, move: (S2, a) => { S2.box!.h = clamp(Math.round(h0 + a), 0, 8) } }]
      look(S)
    },
    done: S => (S.box?.h ?? 0) >= 2 && S.drag === null,
    advanceAfter: 1200,
  },
  turnBeat("turn", "Try turning it. Drag anywhere.", S => { boxBoard(S, { l: 6, w: 4, h: 5, letters: false, keep: true }); look(S) }),
  watch("cuboid", "This is a *cuboid*.", S => { boxBoard(S, { l: 6, w: 4, h: 5, letters: false, keep: true }); S.spin = 12; look(S) }),
  turnBeat("dashed", "Turn it. Watch which edges are dashed.", S => { boxBoard(S, { l: 6, w: 4, h: 5, letters: false, keep: true }); look(S) }, 90, 5),
  watch("dashed-why", "A dashed edge is at the back, hidden behind the box.", S => { boxBoard(S, { l: 6, w: 4, h: 5, letters: false, keep: true }); S.spin = 10; look(S) }, 2.2),
  {
    id: "letters",
    say: "Each corner has a letter.",
    enter: S => {
      boxBoard(S, { l: 6, w: 4, h: 5, letters: false, keep: true })
      // the letters come one at a time: the floor, then the top
      ;["E", "H", "G", "F", "A", "D", "C", "B"].forEach((n, i) => later(S, 0.25 + i * 0.22, S2 => { S2.names = { ...S2.names, [n]: n } }))
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  {
    id: "build",
    say: "Make it $12$ long, $9$ wide and $8$ tall.",
    enter: S => {
      boxBoard(S, { l: 6, w: 4, h: 5, keep: true })
      const b = S.box!
      let l0 = b.l, w0 = b.w, h0 = b.h
      const start = (S2: Scene) => { l0 = S2.box!.l; w0 = S2.box!.w; h0 = S2.box!.h }
      goodView(S)
      S.handles = [
        { id: "len", at: S2 => [S2.box!.l / 2, 0, S2.box!.h / 2], axis: [1, 0, 0], start, move: (S2, a) => { S2.box!.l = clamp(Math.round(l0 + 2 * a), 1, 14) } },
        { id: "wid", at: S2 => [0, -S2.box!.w / 2, S2.box!.h / 2], axis: [0, -1, 0], start, move: (S2, a) => { S2.box!.w = clamp(Math.round(w0 + 2 * a), 1, 14) } },
        { id: "hgt", at: S2 => [0, 0, S2.box!.h], axis: [0, 0, 1], start, move: (S2, a) => { S2.box!.h = clamp(Math.round(h0 + a), 1, 14) } },
      ]
      const chips = (S2: Scene) => {
        const bx = S2.box!
        S2.chipsOn = [{ tex: "12\\text{ long}", lit: bx.l === 12 }, { tex: "9\\text{ wide}", lit: bx.w === 9 }, { tex: "8\\text{ tall}", lit: bx.h === 8 }]
      }
      chips(S)
      S.tick = S2 => { boxLens(S2); chips(S2) }
      boxLens(S)
      look(S, ["chips"])
    },
    done: S => !!S.box && S.box.l === 12 && S.box.w === 9 && S.box.h === 8 && S.drag === null,
    advanceAfter: 1500,
  },

  // ── 2. Corner to corner ──
  watch("how-far", "How far is it from $E$ to $C$?", S => { boxBoard(S, { keep: true }); boxLens(S); S.glowPts = ["E", "C"]; look(S) }),
  joinBeat("join-EC", "Join $E$ and $C$.", "E", "C", S => { boxBoard(S, { keep: true }); boxLens(S); look(S) }, (x, y) => `That joins $${x}$ and $${y}$. Join $E$ to $C$.`),
  turnBeat("inside", "Turn it. This line goes through the inside.", S => { ecBoard(S); look(S) }, 70, 4),
  watch("need-right", "Pythagoras finds a length in a right-angled triangle.", S => {
    ecBoard(S)
    S.eqFn = () => row([pc("a", "a^2"), op("p", "+"), pc("b", "b^2"), op("eq", "="), pc("c", "c^2")])
    look(S, ["eq"])
  }, 2.2),
  joinBeat("join-EG", "Let's make one. Join $E$ and $G$ across the floor.", "E", "G", S => { ecBoard(S); look(S) }, (x, y) => `That joins $${x}$ and $${y}$. $G$ is the corner on the floor under $C$.`),
  watch("tri", "$E$, $G$ and $C$ make a triangle.", S => { ecBoard(S, { eg: true, tri: true }); S.tris[0].pulse = true; look(S) }),
  rightBeat("tap-right", "Where is its right angle? Tap it.", S => { ecBoard(S, { eg: true, tri: true }); look(S) },
    [{ at: "E", a: "G", b: "C" }, { at: "G", a: "E", b: "C" }, { at: "C", a: "E", b: "G" }], 1,
    { 0: "At $E$ the line slopes up. Look where $CG$ meets the floor.", 2: "At $C$ the lines meet at a sharp point. Look where $CG$ meets the floor." }),
  watch("upright", "$CG$ stands straight up from the floor.", S => {
    ecBoard(S, { eg: true, tri: true, right: true })
    S.segs[segKey("C", "G")] = { a: "G", b: "C", col: ORANGE, grow: { v: 1, t: 1 }, glow: true }
    look(S)
  }),
  {
    id: "every",
    say: "So it meets every line on the floor through $G$ at $90^\\circ$.",
    enter: S => {
      ecBoard(S, { right: true })
      // a line on the floor turns about G; the right angle turns with it
      S.tick = S2 => {
        const b = S2.box!, r = Math.min(b.l, b.w) * 0.85
        const t = (225 + 45 * Math.sin((S2.time - S2.beatStart) * 1.1)) * Math.PI / 180
        S2.P3.Q = [b.l / 2 + r * Math.cos(t), b.w / 2 + r * Math.sin(t), 0]
      }
      S.tick(S)
      S.segs[segKey("G", "Q")] = { a: "G", b: "Q", col: BLUE, grow: { v: 1, t: 1 } }
      S.rights = [{ at: "G", a: "Q", b: "C" }]
      look(S)
    },
    cta: "", ctaAfter: 2.6,
  },
  watch("stands", "This triangle stands up inside the box.", S => {
    ecBoard(S, { eg: true, right: true })
    S.tris = [{ id: "EGC", pts: ["E", "G", "C"], col: YELLOW, sheet: true }]
    S.spin = 14
    look(S)
  }, 2.4),
  liftBeat("lift", "Tap the triangle to lift it out.", S => { ecBoard(S, { eg: true, right: true }); look(S) }, {
    regions: [{ id: "EGC", pts: ["E", "G", "C"] }],
    makes: { EGC: { pts: ["E", "G", "C"], right: "G", lens: { [segKey("E", "G")]: lens("?", BLUE), [segKey("G", "C")]: lens("8", ORANGE), [segKey("E", "C")]: lens("?", PINK) } } },
  }),
  missingBeat("missing", "We want $EC$. Which other side don't we know? Tap it.", S => { liftedBoard(S); look(S) }, "up", segKey("E", "G"), {
    [segKey("E", "C")]: "That's the one we want. Which other side don't we know?",
    [segKey("G", "C")]: "We know that one. It's $8$.",
  }),
  liftBeat("floor-tri", "$EG$ is on the floor. Tap a right-angled triangle on the floor with $EG$ in it.", S => {
    liftedBoard(S)
    S.flats[0].lens[segKey("E", "G")].pulse = true
    look(S)
  }, {
    regions: [{ id: "EHG", pts: ["E", "H", "G"] }, { id: "EFG", pts: ["E", "F", "G"] }],
    makes: {
      EHG: { flat: "floor", pts: ["E", "H", "G"], right: "H", lens: { [segKey("E", "H")]: lens("12", CHALK), [segKey("H", "G")]: lens("9", CHALK), [segKey("E", "G")]: lens("?", BLUE) } },
      EFG: { flat: "floor", pts: ["E", "F", "G"], right: "F", lens: { [segKey("E", "F")]: lens("9", CHALK), [segKey("F", "G")]: lens("12", CHALK), [segKey("E", "G")]: lens("?", BLUE) } },
    },
  }),
  askBeat("eg", "Work out $EG$.", S => liftedBoard(S, { floor: true }), {
    name: "EG", col: BLUE, answer: EG, sf: 3, shown: "15", typed: "r12^+9^",
    slips: [
      { v: 21, say: "That's $12 + 9$. Square them first." },
      { v: 225, say: "That's $EG^2$. Now take the square root." },
      { v: 108, say: "That's $12 \\times 9$. Square each side, then add." },
    ],
    writes: [["floor", segKey("E", "G")], ["up", segKey("E", "G")]],
    walk: pythWalk("EG", BLUE, ["12", CHALK, 12], ["9", CHALK, 9]),
  }),
  askBeat("ec", "Now work out $EC$.", S => liftedBoard(S, { floor: true, eg: "15" }), {
    name: "EC", col: PINK, answer: EC, sf: 3, shown: "17", typed: "r15^+8^",
    slips: [
      { v: 23, say: "That's $15 + 8$. Square them first." },
      { v: 289, say: "That's $EC^2$. Now take the square root." },
      { v: Math.hypot(12, 8), say: "Use $EG = 15$, the side of this triangle on the floor." },
    ],
    writes: [["up", segKey("E", "C")]],
    walk: pythWalk("EC", PINK, ["15", BLUE, 15], ["8", ORANGE, 8]),
  }),
  {
    id: "back",
    say: "Let's put them back.",
    enter: S => {
      liftedBoard(S, { floor: true, eg: "15", ec: "17" })
      later(S, 0.4, S2 => {
        putBack(S2)
        S2.lens[segKey("E", "C")] = lens("17", PINK)
        S2.lens[segKey("E", "G")] = lens("15", BLUE)
      })
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  watch("so", "So it's $17$ from $E$ to $C$, right through the box.", S => {
    ecBoard(S, { eg: true, ecTex: "17" })
    S.segs[segKey("E", "C")].glow = true
    S.spin = 12
    look(S)
  }, 2.2),

  // ── 3. One rule for the box ──
  watch("two", "Here are our two steps.", S => {
    ecBoard(S, { eg: true, ecTex: "17" })
    S.eqFn = () => stack("two",
      row([sq("eg", "EG", BLUE), op("eq1", "="), sq("t12", "12"), op("p1", "+"), sq("t9", "9")]),
      row([sq("ec", "EC", PINK), op("eq", "="), sq("eg2", "EG", BLUE), op("p2", "+"), sq("t8", "8", ORANGE)]))
    look(S, ["eq"])
  }, 2.4),
  {
    id: "put-in",
    say: "What if we put the first line into the second?",
    enter: S => {
      ecBoard(S, { eg: true, ecTex: "17" })
      let merged = false
      S.eqFn = () => merged
        ? row([sq("ec", "EC", PINK), op("eq", "="), sq("t12", "12"), op("p1", "+"), sq("t9", "9"), op("p2", "+"), sq("t8", "8", ORANGE)])
        : stack("two",
          row([sq("eg", "EG", BLUE, { pulse: true }), op("eq1", "="), sq("t12", "12"), op("p1", "+"), sq("t9", "9")]),
          row([sq("ec", "EC", PINK), op("eq", "="), sq("eg2", "EG", BLUE, { pulse: true }), op("p2", "+"), sq("t8", "8", ORANGE)]))
      later(S, 1.6, S2 => { S2.eq.slow = { until: S2.time + 1.8, dur: 1.4 }; merged = true; S2.flashGood = 0.6; S2.touched = "eq" })
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.6,
  },
  {
    id: "all-three",
    say: "The length, the width and the height are all in it.",
    enter: S => {
      ecBoard(S, { eg: true, ecTex: "17" })
      const edges = [segKey("E", "H"), segKey("H", "G"), segKey("G", "C")]
      const ids = ["t12", "t9", "t8"]
      let k = -1
      S.tick = S2 => {
        const n = Math.floor((S2.time - S2.beatStart) / 1.1) % 4
        if (n === k) return
        k = n
        S2.edgeCol = n < 3 ? { [edges[n]]: YELLOW } : {}
      }
      S.eqFn = S2 => {
        const n = Math.floor((S2.time - S2.beatStart) / 1.1) % 4
        const p = (i: number) => (n === i ? { pulse: true } : {})
        return row([sq("ec", "EC", PINK), op("eq", "="), sq(ids[0], "12", undefined, p(0)), op("p1", "+"), sq(ids[1], "9", undefined, p(1)), op("p2", "+"), sq(ids[2], "8", ORANGE, p(2))])
      }
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.4,
  },
  {
    id: "change",
    say: "Change the box. Watch $EC$.",
    enter: S => {
      ecBoard(S, { eg: true })
      const b = S.box!
      let l0 = b.l, w0 = b.w, h0 = b.h
      const start = (S2: Scene) => { l0 = S2.box!.l; w0 = S2.box!.w; h0 = S2.box!.h; S2.got.add("held") }
      goodView(S)
      S.handles = [
        { id: "len", at: S2 => [S2.box!.l / 2, 0, S2.box!.h / 2], axis: [1, 0, 0], start, move: (S2, a) => { S2.box!.l = clamp(Math.round(l0 + 2 * a), 1, 14) } },
        { id: "wid", at: S2 => [0, -S2.box!.w / 2, S2.box!.h / 2], axis: [0, -1, 0], start, move: (S2, a) => { S2.box!.w = clamp(Math.round(w0 + 2 * a), 1, 14) } },
        { id: "hgt", at: S2 => [0, 0, S2.box!.h], axis: [0, 0, 1], start, move: (S2, a) => { S2.box!.h = clamp(Math.round(h0 + a), 1, 14) } },
      ]
      const live = (S2: Scene) => {
        boxLens(S2)
        const bx = S2.box!
        const d = Math.sqrt(bx.l ** 2 + bx.w ** 2 + bx.h ** 2)
        S2.lens[segKey("E", "C")] = lens(num(d, 2), PINK)
        S2.lens[segKey("E", "G")] = lens(num(Math.hypot(bx.l, bx.w), 2), BLUE)
        if (bx.l !== 12 || bx.w !== 9 || bx.h !== 8) S2.got.add("changed")
      }
      S.tick = live
      live(S)
      S.eqFn = S2 => {
        const bx = S2.box!
        const d = Math.sqrt(bx.l ** 2 + bx.w ** 2 + bx.h ** 2)
        return row([sq("ec", "EC", PINK), op("eq", "="), sq("t12", num(bx.l)), op("p1", "+"), sq("t9", num(bx.w)), op("p2", "+"), sq("t8", num(bx.h), ORANGE), op("eq2", "="), pc("v", num(d * d), CHALK)])
      }
      look(S, ["eq"])
    },
    done: S => S.got.has("changed"),
    free: true,
    minPlay: 6,
  },
  {
    id: "four-q",
    say: "This box has four long diagonals. Are they the same length?",
    enter: S => {
      ecBoard(S, { ecTex: "17" })
      S.box = { l: 12, w: 9, h: 8 }
      for (const [a, b] of [["A", "G"], ["B", "H"], ["D", "F"]]) addSeg(S, a, b, { grown: true, faint: true })
      choose(S, ["Yes", "No"], 0)
      look(S, ["chips"])
    },
    done: S => S.choice?.picked !== null && S.choice?.picked !== undefined,
    advanceAfter: 1400,
  },
  {
    id: "four",
    say: "They are all the same length.",
    enter: S => {
      ecBoard(S, { ecTex: "17" })
      for (const [a, b] of [["A", "G"], ["B", "H"], ["D", "F"]]) addSeg(S, a, b, { col: PINK })
      S.spin = 12
      S.eqFn = () => row([pc("ec", "EC", PINK), op("e1", "="), pc("ag", "AG", PINK), op("e2", "="), pc("bh", "BH", PINK), op("e3", "="), pc("df", "DF", PINK), op("e4", "="), pc("v", "17", GREEN)])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 2.6,
  },

  // ── 4. Finding a long diagonal ──
  askBeat("q1", "Find the long diagonal of this box.", S => { ecBoard(S, { l: 6, w: 2, h: 3, ecTex: "?" }); look(S) }, {
    name: "EC", col: PINK, answer: 7, sf: 3, shown: "7", typed: "r6^+2^+3^",
    slips: [{ v: 11, say: "That's $6 + 2 + 3$. Square them first." }, { v: 49, say: "That's $EC^2$. Now take the square root." }],
    onFigure: segKey("E", "C"),
    walk: [
      { say: "Square all three edges and add.", tex: `${c(PINK, "EC")}^2 = 6^2 + 2^2 + 3^2` },
      { say: "That makes $49$.", tex: `${c(PINK, "EC")}^2 = 36 + 4 + 9 = 49` },
      { say: "Now the square root.", tex: `${c(PINK, "EC")} = \\sqrt{49} = ${c(GREEN, "7")}` },
    ],
  }),
  askBeat("q2", "Now this one, to $3$ significant figures.", S => { ecBoard(S, { l: 8, w: 5, h: 4, ecTex: "?" }); look(S) }, {
    name: "EC", col: PINK, answer: Math.sqrt(105), sf: 3, shown: "10.2", typed: "r8^+5^+4^",
    slips: [{ v: 17, say: "That's $8 + 5 + 4$. Square them first." }, { v: 105, say: "That's $EC^2$. Now take the square root." }],
    onFigure: segKey("E", "C"),
    walk: [
      { say: "Square all three edges and add.", tex: `${c(PINK, "EC")}^2 = 8^2 + 5^2 + 4^2 = 105` },
      { say: "Now the square root, to $3$ significant figures.", tex: `${c(PINK, "EC")} = \\sqrt{105} = 10.24\\ldots = ${c(GREEN, "10.2")}` },
    ],
  }),
  watch("q3", "This box's long diagonal is $13$. How tall is it?", S => {
    ecBoard(S, { l: 12, w: 4, h: 3, ecTex: "13" })
    S.lens[segKey("G", "C")] = lens("h", ORANGE)
    S.edgeCol[segKey("G", "C")] = ORANGE
    S.eqFn = () => backLine()
    look(S, ["eq"])
  }, 2.4),
  crossBeat("q3-12", "Move $12^2$ across the $=$.", S => { q3Board(S); look(S) }, {
    ids: ["t12", "t12q"], label: "12^2", from: "right",
    options: ["$-\\,12^2$", "$\\div\\,12^2$"], answer: 0,
    notes: { 1: "It was added, so it comes across as a take-away." },
    before: st => backLine(st),
    after: () => row([sq("t13", "13", PINK), op("m1", "-"), sq("t12", "12"), op("eq", "="), sq("t4", "4"), op("p2", "+"), sq("h", "h", ORANGE)]),
  }),
  crossBeat("q3-4", "And $4^2$.", S => { q3Board(S); look(S) }, {
    ids: ["t4", "t4q"], label: "4^2", from: "right",
    options: ["$-\\,4^2$", "$\\div\\,4^2$"], answer: 0,
    notes: { 1: "It was added, so it comes across as a take-away." },
    before: st => row([sq("t13", "13", PINK), op("m1", "-"), sq("t12", "12"), op("eq", "="), sq("t4", "4", undefined, { grab: st.grab.has("t4") || undefined, pulse: st.pulse.has("t4") || undefined }), op("p2", "+"), sq("h", "h", ORANGE)]),
    after: () => row([sq("t13", "13", PINK), op("m1", "-"), sq("t12", "12"), op("m2", "-"), sq("t4", "4"), op("eq", "="), sq("h", "h", ORANGE)]),
  }),
  askBeat("q3-h", "Work out $h$.", S => { q3Board(S); look(S) }, {
    name: "h", col: ORANGE, answer: 3, sf: 3, shown: "3", typed: "r13^-12^-4^",
    slips: [{ v: 9, say: "That's $h^2$. Now take the square root." }, { v: Math.sqrt(169 + 144 + 16), say: "Take $12^2$ and $4^2$ away from $13^2$." }],
    onFigure: segKey("G", "C"),
    walk: [
      { say: "$h^2$ is what's left of $13^2$.", tex: `h^2 = 13^2 - 12^2 - 4^2 = 169 - 144 - 16 = 9` },
      { say: "Now the square root.", tex: `h = \\sqrt{9} = ${c(GREEN, "3")}` },
    ],
  }),
]

function backLine(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t13", "13", PINK), op("eq", "="), sq("t12", "12", undefined, g("t12")), op("p1", "+"), sq("t4", "4"), op("p2", "+"), sq("h", "h", ORANGE)])
}
function q3Board(S: Scene) {
  ecBoard(S, { l: 12, w: 4, h: 3, ecTex: "13" })
  S.lens[segKey("G", "C")] = lens("h", ORANGE)
  S.edgeCol[segKey("G", "C")] = ORANGE
}

const PART_B: Beat[] = [
  // ── 5. Pyramids ──
  {
    id: "pyr-make",
    say: "Now a pyramid. Pull its top up until it is $8$ high.",
    enter: S => {
      pyrBoard(S, { h: 0, names: {} })
      let h0 = 0
      goodView(S)
      S.handles = [{ id: "top", at: S2 => [0, 0, S2.pyr!.h], axis: [0, 0, 1], start: S2 => { h0 = S2.pyr!.h }, move: (S2, a) => { S2.pyr!.h = clamp(Math.round(h0 + a), 0, 12) } }]
      S.tick = S2 => {
        const h = S2.pyr!.h
        S2.chipsOn = [{ tex: "8\\text{ high}", lit: h === 8 }]
        if (h > 0) { if (!S2.segs[segKey("X", "E")]) addSeg(S2, "X", "E", { grown: true, faint: true }); S2.lens[segKey("E", "X")] = lens(num(h), ORANGE) }
      }
      S.tick(S)
      look(S, ["chips"])
    },
    done: S => S.pyr?.h === 8 && S.drag === null,
    advanceAfter: 1400,
  },
  turnBeat("pyr-turn", "Try turning it.", S => { pyrBoard(S); look(S) }, 70, 4),
  {
    id: "diags",
    say: "Where exactly is the middle? Draw both diagonals of the base.",
    enter: S => {
      pyrBoard(S, { names: { A: "A", B: "B", C: "C", D: "D", E: "E" } })
      S.mode = "join"
      S.tapPoints = ["A", "B", "C", "D"]
      S.onJoin = (S2, x, y) => {
        const k = segKey(x, y)
        if (k !== segKey("A", "C") && k !== segKey("B", "D")) { say(S2, `That joins $${x}$ and $${y}$, along a side. A diagonal goes across, corner to opposite corner.`, "wrong", 4); return }
        if (S2.segs[k]) return
        addSeg(S2, x, y, { col: BLUE })
        S2.touched = k
        if (S2.segs[segKey("A", "C")] && S2.segs[segKey("B", "D")]) { S2.got.add("both"); S2.mode = "none" }
      }
      look(S)
    },
    done: S => S.got.has("both") && (S.segs[segKey("B", "D")]?.grow.v ?? 0) > 0.95 && (S.segs[segKey("A", "C")]?.grow.v ?? 0) > 0.95,
    advanceAfter: 1000,
  },
  watch("x", "They cross at the middle. Let's call it $X$.", S => { pyrBoard(S, { diags: true }); S.glowPts = ["X"]; look(S) }),
  watch("above", "The top is straight above $X$.", S => {
    pyrBoard(S, { diags: true, height: true })
    S.segs[segKey("X", "E")].glow = true
    S.lens[segKey("E", "X")] = lens("8", ORANGE)
    look(S)
  }),
  watch("ec-q", "How long is this sloping edge, $EC$?", S => {
    pyrBoard(S, { diags: true, height: true })
    S.lens[segKey("E", "X")] = lens("8", ORANGE)
    S.lens[segKey("A", "B")] = lens("6")
    S.lens[segKey("B", "C")] = lens("6")
    S.edgeCol[segKey("E", "C")] = PINK
    S.lens[segKey("E", "C")] = lens("?", PINK)
    look(S)
  }),
  {
    id: "pyr-tri",
    say: "Tap the triangle with $EC$ and the height in it.",
    enter: S => {
      pyBase(S)
      S.mode = "tapRegion"
      S.regions = [{ id: "EXC", pts: ["E", "X", "C"] }, { id: "EBC", pts: ["E", "B", "C"] }, { id: "ECD", pts: ["E", "C", "D"] }]
      S.onRegion = (S2, id) => {
        if (S2.got.has("tap")) return
        if (id !== "EXC") { say(S2, "That's a face of the pyramid. It has $EC$, but not the height.", "wrong", 4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.regions = null
        S2.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: YELLOW, sheet: true }]
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  rightBeat("pyr-right", "Where is its right angle? Tap it.", S => { pyBase(S); S.tris = [{ id: "EXC", pts: ["E", "X", "C"], col: CHALK }]; S.rights = []; look(S) },
    [{ at: "E", a: "X", b: "C" }, { at: "X", a: "E", b: "C" }, { at: "C", a: "E", b: "X" }], 1,
    { 0: "At the top the lines meet at a sharp point. Which line stands straight up?", 2: "The edge slopes there. Which line stands straight up?" }),
  liftBeat("pyr-lift", "Tap the triangle to lift it out.", S => { pyBase(S); look(S) }, {
    regions: [{ id: "EXC", pts: ["E", "X", "C"] }],
    makes: { EXC: { pts: ["E", "X", "C"], right: "X", lens: { [segKey("E", "X")]: lens("8", ORANGE), [segKey("X", "C")]: lens("?", BLUE), [segKey("E", "C")]: lens("?", PINK) } } },
  }),
  missingBeat("pyr-missing", "We want $EC$. Which other side don't we know? Tap it.", S => { pyLiftedBoard(S); look(S) }, "up", segKey("X", "C"), {
    [segKey("E", "C")]: "That's the one we want. Which other side don't we know?",
    [segKey("E", "X")]: "We know that one. It's the height, $8$.",
  }),
  liftBeat("pyr-floor", "$XC$ is half of $AC$. Tap a triangle on the floor with $AC$ in it.", S => {
    pyLiftedBoard(S)
    S.flats[0].lens[segKey("X", "C")].pulse = true
    S.segs[segKey("A", "C")].glow = true
    look(S)
  }, {
    regions: [{ id: "ABC", pts: ["A", "B", "C"] }, { id: "ADC", pts: ["A", "D", "C"] }],
    makes: {
      ABC: { flat: "floor", pts: ["A", "B", "C"], right: "B", lens: { [segKey("A", "B")]: lens("6", CHALK), [segKey("B", "C")]: lens("6", CHALK), [segKey("A", "C")]: lens("?", BLUE) } },
      ADC: { flat: "floor", pts: ["A", "D", "C"], right: "D", lens: { [segKey("A", "D")]: lens("6", CHALK), [segKey("D", "C")]: lens("6", CHALK), [segKey("A", "C")]: lens("?", BLUE) } },
    },
  }),
  askBeat("pyr-ac", "Work out $AC$.", S => { pyLiftedBoard(S, { floor: true }); look(S) }, {
    name: "AC", col: BLUE, answer: PY_AC, sf: 3, shown: sig(PY_AC, 3), typed: "r6^+6^",
    slips: [{ v: 12, say: "That's $6 + 6$. Square them first." }, { v: 72, say: "That's $AC^2$. Now take the square root." }],
    writes: [["floor", segKey("A", "C")]],
    walk: pythWalk("AC", BLUE, ["6", CHALK, 6], ["6", CHALK, 6]),
  }),
  askBeat("pyr-xc", "So what is $XC$?", S => { pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3) }); look(S) }, {
    name: "XC", col: BLUE, answer: PY_XC, sf: 3, shown: sig(PY_XC, 3), ans: PY_AC, typed: "a/2",
    slips: [{ v: PY_AC, say: "That's all of $AC$. $X$ is halfway along it." }],
    writes: [["up", segKey("X", "C")]],
    walk: [
      { say: "$X$ is halfway along $AC$.", tex: `${c(BLUE, "XC")} = ${c(BLUE, "AC")} \\div 2` },
      { say: "Use Ans, so no digits are lost.", tex: `${c(BLUE, "XC")} = ${sig(PY_AC, 4)}\\ldots \\div 2 = ${c(GREEN, sig(PY_XC, 3))}` },
    ],
  }),
  askBeat("pyr-ec", "Now work out $EC$.", S => { pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3), xc: sig(PY_XC, 3) }); look(S) }, {
    name: "EC", col: PINK, answer: PY_EC, sf: 3, shown: sig(PY_EC, 3), ans: PY_XC, typed: "ra^+8^",
    slips: [
      { v: PY_XC + 8, say: "Square them first." },
      { v: PY_EC * PY_EC, say: "That's $EC^2$. Now take the square root." },
      { v: Math.hypot(PY_AC, 8), say: "That used all of $AC$. Use $XC$, half of it." },
    ],
    writes: [["up", segKey("E", "C")]],
    walk: pythWalk("EC", PINK, [sig(PY_XC, 3), BLUE, PY_XC], ["8", ORANGE, 8]),
  }),
  {
    id: "pyr-back",
    say: "Let's put them back.",
    enter: S => {
      pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3), xc: sig(PY_XC, 3), ec: sig(PY_EC, 3) })
      later(S, 0.4, S2 => { putBack(S2); S2.lens[segKey("E", "C")] = lens(sig(PY_EC, 3), PINK) })
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  watch("face", "This face has a height too, from $E$ to $M$, the middle of $BC$.", S => { faceBoard(S); S.segs[segKey("E", "M")].glow = true; look(S) }, 2.4),
  joinBeat("join-XM", "Join $X$ and $M$.", "X", "M", S => { faceBoard(S); look(S) }, (x, y) => `That joins $${x}$ and $${y}$. Join $X$ to $M$.`, { col: BLUE }),
  rightBeat("face-right", "Tap the right angle in triangle $EXM$.", S => { faceBoard(S, { xm: true }); look(S) },
    [{ at: "E", a: "X", b: "M" }, { at: "X", a: "E", b: "M" }, { at: "M", a: "E", b: "X" }], 1,
    { 0: "Which line stands straight up?", 2: "The face slopes there. Which line stands straight up?" }),
  liftBeat("face-lift", "Tap the triangle to lift it out.", S => { faceBoard(S, { xm: true, right: true }); look(S) }, {
    regions: [{ id: "EXM", pts: ["E", "X", "M"] }],
    makes: { EXM: { pts: ["E", "X", "M"], right: "X", lens: { [segKey("E", "X")]: lens("8", ORANGE), [segKey("X", "M")]: lens("?", BLUE), [segKey("E", "M")]: lens("?", PINK) } } },
  }),
  askBeat("face-xm", "How long is $XM$?", S => { faceLifted(S); look(S) }, {
    name: "XM", col: BLUE, answer: 3, sf: 3, shown: "3", typed: "3",
    slips: [{ v: 6, say: "That's the whole side. $X$ is in the middle." }],
    writes: [["up", segKey("X", "M")]],
    walk: [{ say: "$X$ is in the middle, halfway across the base.", tex: `${c(BLUE, "XM")} = 6 \\div 2 = ${c(GREEN, "3")}` }],
  }),
  askBeat("face-em", "Now work out $EM$.", S => { faceLifted(S, { xm: "3" }); look(S) }, {
    name: "EM", col: PINK, answer: PY_EM, sf: 3, shown: sig(PY_EM, 3), typed: "r3^+8^",
    slips: [{ v: 11, say: "That's $3 + 8$. Square them first." }, { v: 73, say: "That's $EM^2$. Now take the square root." }],
    writes: [["up", segKey("E", "M")]],
    walk: pythWalk("EM", PINK, ["3", BLUE, 3], ["8", ORANGE, 8]),
  }),
]

/** The pyramid with its diagonals, height, and EC marked. */
function pyBase(S: Scene) {
  pyrBoard(S, { diags: true, height: true })
  S.lens[segKey("E", "X")] = lens("8", ORANGE)
  S.lens[segKey("A", "B")] = lens("6")
  S.lens[segKey("B", "C")] = lens("6")
  S.edgeCol[segKey("E", "C")] = PINK
  S.lens[segKey("E", "C")] = lens("?", PINK)
}
/** The pyramid with M, the middle of BC, and the face's height EM. */
function faceBoard(S: Scene, o: { xm?: boolean; right?: boolean } = {}) {
  pyrBoard(S, { diags: false })
  S.P3.M = [3, 0, 0]
  S.names = { ...S.names, M: "M" }
  S.dots = ["X", "M"]
  addSeg(S, "X", "E", { grown: true })
  addSeg(S, "E", "M", { grown: true, col: PINK })
  S.lens[segKey("E", "X")] = lens("8", ORANGE)
  S.lens[segKey("A", "B")] = lens("6")
  if (o.xm) addSeg(S, "X", "M", { grown: true, col: BLUE })
  if (o.right) S.rights = [{ at: "X", a: "E", b: "M" }]
}
function faceLifted(S: Scene, o: { xm?: string } = {}) {
  faceBoard(S, { xm: true, right: true })
  S.tris = [{ id: "EXM", pts: ["E", "X", "M"], col: CHALK }]
  liftOut(S, "up", ["E", "X", "M"], "X", { [segKey("E", "X")]: lens("8", ORANGE), [segKey("X", "M")]: lens(o.xm ?? "?", BLUE), [segKey("E", "M")]: lens("?", PINK) }, true)
}

const PART_C: Beat[] = [
  // ── 6. Exam questions ──
  // 4024/21/O/N/25 Q25(a)
  watch("x1", "Here is an exam question. This cuboid has $EH = 12$, $HG = 10$ and $GC = 7$ cm.", S => { x1Board(S); S.lens[segKey("E", "C")] = lens("?", PINK); look(S) }, 2.8),
  watch("x1-q", "Show that $CE = 17.1$ cm, to $1$ decimal place.", S => { x1Board(S); S.lens[segKey("E", "C")] = lens("?", PINK); look(S) }, 2.4),
  joinBeat("x1-join", "Draw the line you need on the floor.", "E", "G", S => { x1Board(S); look(S) }, (x, y) => `That joins $${x}$ and $${y}$. $C$ is straight above $G$, so start from $E$.`),
  liftBeat("x1-lift", "Tap the triangle with $CE$ in it to lift it out.", S => { x1Board(S, { eg: true }); S.rights = [{ at: "G", a: "E", b: "C" }]; look(S) }, {
    regions: [{ id: "EGC", pts: ["E", "G", "C"] }],
    makes: { EGC: { pts: ["E", "G", "C"], right: "G", lens: { [segKey("E", "G")]: lens("?", BLUE), [segKey("G", "C")]: lens("7", ORANGE), [segKey("E", "C")]: lens("?", PINK) } } },
  }),
  liftBeat("x1-floor", "Now tap a triangle on the floor with $EG$ in it.", S => { x1Board(S, { eg: true, tri: true }); x1Flats(S); look(S) }, {
    regions: [{ id: "EHG", pts: ["E", "H", "G"] }, { id: "EFG", pts: ["E", "F", "G"] }],
    makes: {
      EHG: { flat: "floor", pts: ["E", "H", "G"], right: "H", lens: { [segKey("E", "H")]: lens("12", CHALK), [segKey("H", "G")]: lens("10", CHALK), [segKey("E", "G")]: lens("?", BLUE) } },
      EFG: { flat: "floor", pts: ["E", "F", "G"], right: "F", lens: { [segKey("E", "F")]: lens("10", CHALK), [segKey("F", "G")]: lens("12", CHALK), [segKey("E", "G")]: lens("?", BLUE) } },
    },
  }),
  askBeat("x1-eg", "Work out $EG$.", S => { x1Board(S, { eg: true, tri: true }); x1Flats(S, { floor: true }); look(S) }, {
    name: "EG", col: BLUE, answer: X1_EG, sf: 3, shown: sig(X1_EG, 3), typed: "r12^+10^",
    slips: [{ v: 22, say: "That's $12 + 10$. Square them first." }, { v: 244, say: "That's $EG^2$. Now take the square root." }],
    writes: [["floor", segKey("E", "G")], ["up", segKey("E", "G")]],
    walk: pythWalk("EG", BLUE, ["12", CHALK, 12], ["10", CHALK, 10]),
  }),
  askBeat("x1-ce", "Now $CE$. Give $4$ significant figures, to show it.", S => { x1Board(S, { eg: true, tri: true }); x1Flats(S, { floor: true, eg: sig(X1_EG, 3) }); look(S) }, {
    name: "CE", col: PINK, answer: X1_CE, sf: 4, shown: sig(X1_CE, 4), ans: X1_EG, typed: "ra^+7^",
    slips: [{ v: X1_CE * X1_CE, say: "That's $CE^2$. Now take the square root." }, { v: X1_EG + 7, say: "Square them first." }],
    writes: [["up", segKey("E", "C")]],
    walk: [
      { say: "$CE$ is the longest side of this triangle.", tex: `${c(PINK, "CE")}^2 = ${c(BLUE, "EG")}^2 + ${c(ORANGE, "7")}^2` },
      { say: "Use Ans for $EG$, so no digits are lost.", tex: `${c(PINK, "CE")} = \\sqrt{${sig(X1_EG, 4)}\\ldots^2 + 7^2} = ${c(GREEN, sig(X1_CE, 4))}` },
    ],
  }),
  watch("x1-shown", "$17.12$ is $17.1$ to $1$ decimal place. That shows it.", S => {
    x1Board(S, { eg: true })
    S.lens[segKey("E", "C")] = lens("17.12", PINK)
    S.eqFn = () => row([pc("ce", "CE", PINK), op("e1", "="), pc("v", "17.12", GREEN), op("e2", "="), pc("r", "17.1\\text{ cm}", GREEN)])
    look(S, ["eq"])
  }, 2.6),

  // 4024/21/O/N/21 Q10(b)(i)
  watch("x2", "Here is another. This pyramid has a square base, and $E$ is above its middle, $X$.", S => { x2Board(S); look(S) }, 2.8),
  watch("x2-q", "$EX = 17$ cm and $EC = 19$ cm. Show that the base is $12$ cm long.", S => { x2Board(S); look(S) }, 2.6),
  liftBeat("x2-tri", "Tap the triangle with $EX$ and $EC$ in it.", S => { x2Board(S); look(S) }, {
    regions: [{ id: "EXC", pts: ["E", "X", "C"] }, { id: "EBC", pts: ["E", "B", "C"] }, { id: "ECD", pts: ["E", "C", "D"] }],
    makes: { EXC: { pts: ["E", "X", "C"], right: "X", lens: { [segKey("E", "X")]: lens("17", ORANGE), [segKey("X", "C")]: lens("?", BLUE), [segKey("E", "C")]: lens("19", PINK) } } },
    notes: { EBC: "That's a face. It has $EC$, but not the height $EX$.", ECD: "That's a face. It has $EC$, but not the height $EX$." },
  }),
  watch("x2-long", "This time we know the longest side, $19$.", S => {
    x2Board(S); x2Up(S)
    S.eqFn = () => x2Line()
    look(S, ["eq"])
  }, 2.4),
  crossBeat("x2-cross", "Move $17^2$ across the $=$.", S => { x2Board(S); x2Up(S); look(S) }, {
    ids: ["t17", "t17q"], label: "17^2", from: "right",
    options: ["$-\\,17^2$", "$\\div\\,17^2$"], answer: 0,
    notes: { 1: "It was added, so it comes across as a take-away." },
    before: st => x2Line(st),
    after: () => row([sq("t19", "19", PINK), op("m", "-"), sq("t17", "17", ORANGE), op("eq", "="), sq("xc", "XC", BLUE)]),
  }),
  askBeat("x2-xc", "Work out $XC$.", S => { x2Board(S); x2Up(S); look(S) }, {
    name: "XC", col: BLUE, answer: X2_XC, sf: 3, shown: sig(X2_XC, 3), typed: "r19^-17^",
    slips: [{ v: 72, say: "That's $XC^2$. Now take the square root." }, { v: Math.hypot(19, 17), say: "$19$ is the longest side. Take $17^2$ away." }, { v: 2, say: "Square them first." }],
    writes: [["up", segKey("X", "C")]],
    walk: pythWalk("XC", BLUE, ["19", PINK, 19], ["17", ORANGE, 17], true),
  }),
  askBeat("x2-ac", "$XC$ is half of the diagonal. So how long is $AC$?", S => { x2Board(S); x2Up(S, { xc: sig(X2_XC, 3) }); S.segs[segKey("A", "C")].glow = true; look(S) }, {
    name: "AC", col: BLUE, answer: X2_AC, sf: 3, shown: sig(X2_AC, 3), ans: X2_XC, typed: "a*2",
    slips: [{ v: X2_XC / 2, say: "$AC$ is the whole diagonal. It's twice $XC$." }],
    onFigure: segKey("A", "C"),
    walk: [{ say: "$X$ is halfway along $AC$, so $AC$ is twice $XC$.", tex: `${c(BLUE, "AC")} = 2 \\times ${sig(X2_XC, 4)}\\ldots = ${c(GREEN, sig(X2_AC, 3))}` }],
  }),
  liftBeat("x2-floor", "Tap triangle $ABC$ to lift it out.", S => { x2Board(S); x2Up(S, { xc: sig(X2_XC, 3) }); look(S) }, {
    regions: [{ id: "ABC", pts: ["A", "B", "C"] }],
    makes: { ABC: { flat: "floor", pts: ["A", "B", "C"], right: "B", lens: { [segKey("A", "B")]: lens("s", CHALK), [segKey("B", "C")]: lens("s", CHALK), [segKey("A", "C")]: lens(sig(X2_AC, 3), BLUE) } } },
  }),
  watch("x2-s", "Its two short sides are the same. Let's call them $s$.", S => {
    x2Floor(S)
    S.eqFn = () => row([sq("s1", "s"), op("p", "+"), sq("s2", "s"), op("eq", "="), sq("ac", sig(X2_AC, 4), BLUE)])
    look(S, ["eq"])
  }, 2.6),
  askBeat("x2-side", "Work out $s$.", S => { x2Floor(S); look(S) }, {
    name: "s", col: CHALK, answer: 12, dp: 0, shown: "12", ans: X2_AC, typed: "ra^/2",
    slips: [{ v: X2_AC / 2, say: "Halving $AC$ gives $XC$. For the side, use $s^2 + s^2 = AC^2$." }, { v: 144, say: "That's $s^2$. Now take the square root." }],
    writes: [["floor", segKey("A", "B")], ["floor", segKey("B", "C")]],
    walk: [
      { say: "Two $s^2$ make $AC^2$.", tex: `2s^2 = ${c(BLUE, sig(X2_AC, 4))}\\ldots^2 = 288` },
      { say: "So $s^2$ is half of that.", tex: `s^2 = 288 \\div 2 = 144` },
      { say: "Now the square root.", tex: `s = \\sqrt{144} = ${c(GREEN, "12")}` },
    ],
  }),
  watch("x2-shown", "The base is $12$ cm long. That shows it.", S => { x2Board(S); S.lens[segKey("A", "B")] = lens("12", GREEN); look(S) }, 2.2),

  // 4024/22/O/N/18 Q9(a)
  watch("x3", "This pyramid's base is a rectangle, $6.2$ by $4.3$ cm. Each sloping edge is $9.5$ cm.", S => { x3Board(S); look(S) }, 3),
  watch("x3-q", "$F$ is above $E$, the middle. Show that the height $EF$ is $8.72$ cm.", S => { x3Board(S); S.segs[segKey("E", "X")].glow = true; look(S) }, 2.8),
  liftBeat("x3-tri", "Tap the triangle with the height and the edge $FC$ in it.", S => { x3Board(S); look(S) }, {
    regions: [{ id: "EXC", pts: ["E", "X", "C"] }, { id: "EBC", pts: ["E", "B", "C"] }, { id: "ECD", pts: ["E", "C", "D"] }],
    makes: { EXC: { pts: ["E", "X", "C"], right: "X", lens: { [segKey("E", "X")]: lens("?", ORANGE), [segKey("X", "C")]: lens("?", BLUE), [segKey("E", "C")]: lens("9.5", PINK) } } },
    notes: { EBC: "That's a face. It has $FC$, but not the height.", ECD: "That's a face. It has $FC$, but not the height." },
  }),
  liftBeat("x3-floor", "$EC$ is half of $AC$. Tap a triangle on the floor with $AC$ in it.", S => { x3Board(S); x3Up(S); look(S) }, {
    regions: [{ id: "ABC", pts: ["A", "B", "C"] }, { id: "ADC", pts: ["A", "D", "C"] }],
    makes: {
      ABC: { flat: "floor", pts: ["A", "B", "C"], right: "B", lens: { [segKey("A", "B")]: lens("6.2", CHALK), [segKey("B", "C")]: lens("4.3", CHALK), [segKey("A", "C")]: lens("?", BLUE) } },
      ADC: { flat: "floor", pts: ["A", "D", "C"], right: "D", lens: { [segKey("A", "D")]: lens("4.3", CHALK), [segKey("D", "C")]: lens("6.2", CHALK), [segKey("A", "C")]: lens("?", BLUE) } },
    },
  }),
  askBeat("x3-ac", "Work out $AC$.", S => { x3Board(S); x3Up(S); x3Floor(S); look(S) }, {
    name: "AC", col: BLUE, answer: X3_AC, sf: 3, shown: sig(X3_AC, 3), typed: "r6.2^+4.3^",
    slips: [{ v: 10.5, say: "That's $6.2 + 4.3$. Square them first." }, { v: X3_AC * X3_AC, say: "That's $AC^2$. Now take the square root." }],
    writes: [["floor", segKey("A", "C")]],
    walk: pythWalk("AC", BLUE, ["6.2", CHALK, 6.2], ["4.3", CHALK, 4.3]),
  }),
  askBeat("x3-ec", "So what is $EC$?", S => { x3Board(S); x3Up(S); x3Floor(S, { ac: sig(X3_AC, 3) }); look(S) }, {
    name: "EC", col: BLUE, answer: X3_EC, sf: 3, shown: sig(X3_EC, 3), ans: X3_AC, typed: "a/2",
    slips: [{ v: X3_AC, say: "That's all of $AC$. $E$ is halfway along it." }],
    writes: [["up", segKey("X", "C")]],
    walk: [{ say: "$E$ is halfway along $AC$.", tex: `${c(BLUE, "EC")} = ${sig(X3_AC, 4)}\\ldots \\div 2 = ${c(GREEN, sig(X3_EC, 3))}` }],
  }),
  watch("x3-long", "We know the longest side, $9.5$.", S => {
    x3Board(S); x3Up(S, { ec: sig(X3_EC, 3) })
    S.eqFn = () => x3Line()
    look(S, ["eq"])
  }, 2.2),
  crossBeat("x3-cross", "Move $EC^2$ across the $=$.", S => { x3Board(S); x3Up(S, { ec: sig(X3_EC, 3) }); look(S) }, {
    ids: ["ec", "ecq"], label: "EC^2", from: "right",
    options: ["$-\\,EC^2$", "$\\div\\,EC^2$"], answer: 0,
    notes: { 1: "It was added, so it comes across as a take-away." },
    before: st => x3Line(st),
    after: () => row([sq("t95", "9.5", PINK), op("m", "-"), sq("ec", "EC", BLUE), op("eq", "="), sq("h", "EF", ORANGE)]),
  }),
  askBeat("x3-ef", "Work out $EF$. Give $4$ significant figures.", S => { x3Board(S); x3Up(S, { ec: sig(X3_EC, 3) }); look(S) }, {
    name: "EF", col: ORANGE, answer: X3_H, sf: 4, shown: sig(X3_H, 4), ans: X3_EC, typed: "r9.5^-a^",
    slips: [{ v: X3_H * X3_H, say: "That's $EF^2$. Now take the square root." }, { v: Math.hypot(9.5, X3_EC), say: "$9.5$ is the longest side. Take $EC^2$ away." }],
    writes: [["up", segKey("E", "X")]],
    walk: [
      { say: "$EF^2$ is $9.5^2$ take away $EC^2$.", tex: `${c(ORANGE, "EF")}^2 = 9.5^2 - ${c(BLUE, sig(X3_EC, 4))}\\ldots^2` },
      { say: "Use Ans for $EC$, then the square root.", tex: `${c(ORANGE, "EF")} = ${c(GREEN, sig(X3_H, 4))}` },
    ],
  }),
  watch("x3-shown", "$8.719$ is $8.72$ to $3$ significant figures. That shows it.", S => {
    x3Board(S)
    S.lens[segKey("E", "X")] = lens("8.719", ORANGE)
    S.eqFn = () => row([pc("ef", "EF", ORANGE), op("e1", "="), pc("v", sig(X3_H, 4), GREEN), op("e2", "="), pc("r", "8.72\\text{ cm}", GREEN)])
    look(S, ["eq"])
  }, 2.6),

  // 4024/23/M/J/25 Q22(b)(i)
  watch("x4", "This pyramid stands on a triangle with sides $34$ cm. Each sloping edge is $82$ cm.", S => { x4Board(S); look(S) }, 3),
  watch("x4-q", "$M$ is the middle of $AC$, and $MO : OB = 1 : 2$. Show that $OB = 19.6$ cm.", S => { x4Board(S); S.glowPts = ["O", "M"]; look(S) }, 3),
  liftBeat("x4-tri", "Tap a right-angled triangle on the floor with $MB$ in it.", S => { x4Board(S); S.rights = [{ at: "M", a: "B", b: "C" }]; look(S) }, {
    regions: [{ id: "AMB", pts: ["A", "M", "B"] }, { id: "CMB", pts: ["C", "M", "B"] }],
    makes: {
      AMB: { flat: "up", pts: ["A", "M", "B"], right: "M", lens: { [segKey("A", "B")]: lens("34", CHALK), [segKey("A", "M")]: lens("17", CHALK), [segKey("M", "B")]: lens("?", BLUE) } },
      CMB: { flat: "up", pts: ["C", "M", "B"], right: "M", lens: { [segKey("C", "B")]: lens("34", CHALK), [segKey("C", "M")]: lens("17", CHALK), [segKey("M", "B")]: lens("?", BLUE) } },
    },
  }),
  askBeat("x4-mb", "Work out $MB$.", S => { x4Lifted(S); look(S) }, {
    name: "MB", col: BLUE, answer: X4_MB, sf: 3, shown: sig(X4_MB, 3), typed: "r34^-17^",
    slips: [{ v: Math.hypot(34, 17), say: "$34$ is the longest side here. Take $17^2$ away." }, { v: 867, say: "That's $MB^2$. Now take the square root." }, { v: 17, say: "Square them first." }],
    writes: [["up", segKey("M", "B")]],
    walk: pythWalk("MB", BLUE, ["34", CHALK, 34], ["17", CHALK, 17], true),
  }),
  {
    id: "x4-frac",
    say: "$MO : OB$ is $1 : 2$. What fraction of $MB$ is $OB$?",
    enter: S => {
      x4Board(S)
      S.lens[segKey("M", "B")] = lens(sig(X4_MB, 3), BLUE)
      // MB in three equal parts: MO one of them, OB two
      S.P3.T = [S.P3.O[0] + (S.P3.B[0] - S.P3.O[0]) / 2, S.P3.O[1] + (S.P3.B[1] - S.P3.O[1]) / 2, 0]
      S.dots = ["O", "M", "T"]
      choose(S, ["$\\tfrac{1}{2}$", "$\\tfrac{1}{3}$", "$\\tfrac{2}{3}$"], 2, false, (S2, k, right) => {
        if (right) { say(S2, "Yes. $MB$ is $3$ equal parts, and $OB$ is $2$ of them.", "calm", 3.6); return }
        say(S2, k === 1 ? "That's $MO$, the short part." : "$MB$ is split into $1 + 2 = 3$ equal parts. $OB$ is $2$ of them.", "wrong", 4)
      })
      look(S, ["chips"])
    },
    done: S => S.choice?.state === "right",
    advanceAfter: 2400,
  },
  askBeat("x4-ob", "Work out $OB$. Give $4$ significant figures.", S => { x4Board(S); S.lens[segKey("M", "B")] = lens(sig(X4_MB, 3), BLUE); look(S) }, {
    name: "OB", col: BLUE, answer: X4_OB, sf: 4, shown: sig(X4_OB, 4), ans: X4_MB, typed: "a*2/3",
    slips: [{ v: X4_MB / 3, say: "That's $MO$, one part. $OB$ is two parts." }, { v: X4_MB / 2, say: "$OB$ is $\\tfrac{2}{3}$ of $MB$, not half." }],
    onFigure: segKey("O", "B"),
    walk: [{ say: "$OB$ is two thirds of $MB$.", tex: `${c(BLUE, "OB")} = ${sig(X4_MB, 4)}\\ldots \\times \\tfrac{2}{3} = ${c(GREEN, sig(X4_OB, 4))}` }],
  }),
  watch("x4-shown", "$19.63$ is $19.6$ to $1$ decimal place. That shows it.", S => {
    x4Board(S)
    S.eqFn = () => row([pc("ob", "OB", BLUE), op("e1", "="), pc("v", sig(X4_OB, 4), GREEN), op("e2", "="), pc("r", "19.6\\text{ cm}", GREEN)])
    look(S, ["eq"])
  }, 2.6),

  // ── free play ──
  {
    id: "free",
    say: "Make any box you like. Turn it and change it.",
    enter: S => {
      boxBoard(S, { l: 12, w: 9, h: 8 })
      addSeg(S, "E", "C", { grown: true })
      const b = S.box!
      let l0 = b.l, w0 = b.w, h0 = b.h
      const start = (S2: Scene) => { l0 = S2.box!.l; w0 = S2.box!.w; h0 = S2.box!.h }
      goodView(S)
      S.handles = [
        { id: "len", at: S2 => [S2.box!.l / 2, 0, S2.box!.h / 2], axis: [1, 0, 0], start, move: (S2, a) => { S2.box!.l = clamp(Math.round(l0 + 2 * a), 1, 14) } },
        { id: "wid", at: S2 => [0, -S2.box!.w / 2, S2.box!.h / 2], axis: [0, -1, 0], start, move: (S2, a) => { S2.box!.w = clamp(Math.round(w0 + 2 * a), 1, 14) } },
        { id: "hgt", at: S2 => [0, 0, S2.box!.h], axis: [0, 0, 1], start, move: (S2, a) => { S2.box!.h = clamp(Math.round(h0 + a), 1, 14) } },
      ]
      S.tick = S2 => {
        boxLens(S2)
        const bx = S2.box!
        S2.lens[segKey("E", "C")] = lens(num(Math.sqrt(bx.l ** 2 + bx.w ** 2 + bx.h ** 2), 2), PINK)
      }
      S.tick(S)
      look(S)
    },
    cta: "Start again", ctaAfter: 3, restart: true,
  },
]

function x2Line(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t19", "19", PINK), op("eq", "="), sq("xc", "XC", BLUE), op("p", "+"), sq("t17", "17", ORANGE, g("t17"))])
}
function x2Floor(S: Scene) {
  x2Board(S)
  x2Up(S, { xc: sig(X2_XC, 3) })
  liftOut(S, "floor", ["A", "B", "C"], "B", { [segKey("A", "B")]: lens("s", CHALK), [segKey("B", "C")]: lens("s", CHALK), [segKey("A", "C")]: lens(sig(X2_AC, 3), BLUE) }, true)
  S.tris = [...S.tris, { id: "ABC", pts: ["A", "B", "C"], col: BLUE }]
}
function x3Line(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t95", "9.5", PINK), op("eq", "="), sq("h", "EF", ORANGE), op("p", "+"), sq("ec", "EC", BLUE, g("ec"))])
}
function x4Lifted(S: Scene) {
  x4Board(S)
  S.rights = [{ at: "M", a: "B", b: "C" }]
  S.tris = [{ id: "CMB", pts: ["C", "M", "B"], col: CHALK }]
  liftOut(S, "up", ["C", "M", "B"], "M", { [segKey("C", "B")]: lens("34", CHALK), [segKey("C", "M")]: lens("17", CHALK), [segKey("M", "B")]: lens("?", BLUE) }, true)
}

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C]

applyParts(BEATS, [
  ["make", "Make a box"],
  ["how-far", "Corner to corner"],
  ["two", "One rule for the box"],
  ["q1", "Finding a long diagonal"],
  ["pyr-make", "Pyramids"],
  ["x1", "Exam questions"],
])
