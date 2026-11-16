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
  later, say, segKey, addSeg, liftOut, putBack, clamp, choose, goodView, acting, turnAct, holdAct, proj, dist,
  vsub, vadd, vmul, vunit, vcross, vlerp, type CrossState,
} from "./scene"
import {
  type Beat, look, num, sig, c, pc, sq, stack, lens, boxBoard, boxLens, ecBoard, pyrBoard, solidBoard,
  turnBeat, watch, joinBeat, rightBeat, liftBeat, missingBeat, askBeat, crossBeat, pythWalk, lightFlat, given,
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
/** The floor triangle the student lifted (E H G, or E F G: the same shape turned over). */
function floorFlat(S: Scene, o: { eg?: string } = {}) {
  const mid = S.picked["floor-tri"] === "EFG" ? "F" : "H"
  liftOut(S, "floor", ["E", mid, "G"], mid, {
    [segKey("E", mid)]: lens(mid === "H" ? "12" : "9", CHALK),
    [segKey(mid, "G")]: lens(mid === "H" ? "9" : "12", CHALK),
    [segKey("E", "G")]: lens(o.eg ?? "?", BLUE),
  }, true)
  S.tris = [...S.tris, { id: `E${mid}G`, pts: ["E", mid, "G"], col: BLUE }]
}
/** The sides of either floor triangle, for lighting them up in a walkthrough. */
const BOX_FLOOR_SIDES = [segKey("E", "H"), segKey("H", "G"), segKey("E", "F"), segKey("F", "G")]
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
  const mid = S.picked["pyr-floor"] === "ADC" ? "D" : "B"
  liftOut(S, "floor", ["A", mid, "C"], mid, {
    [segKey("A", mid)]: lens("6", CHALK),
    [segKey(mid, "C")]: lens("6", CHALK),
    [segKey("A", "C")]: lens(o.ac ?? "?", BLUE),
  }, true)
  S.tris = [...S.tris, { id: `A${mid}C`, pts: ["A", mid, "C"], col: BLUE }]
}
const BASE_SIDES = [segKey("A", "B"), segKey("B", "C"), segKey("A", "D"), segKey("D", "C")]
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
    const mid = S.picked["x1-floor"] === "EFG" ? "F" : "H"
    liftOut(S, "floor", ["E", mid, "G"], mid, { [segKey("E", mid)]: lens(mid === "H" ? "12" : "10", CHALK), [segKey(mid, "G")]: lens(mid === "H" ? "10" : "12", CHALK), [segKey("E", "G")]: lens(o.eg ?? "?", BLUE) }, true)
    S.tris = [...S.tris, { id: `E${mid}G`, pts: ["E", mid, "G"], col: BLUE }]
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
  const mid = S.picked["x3-floor"] === "ADC" ? "D" : "B"
  liftOut(S, "floor", ["A", mid, "C"], mid, { [segKey("A", mid)]: lens(mid === "B" ? "6.2" : "4.3", CHALK), [segKey(mid, "C")]: lens(mid === "B" ? "4.3" : "6.2", CHALK), [segKey("A", "C")]: lens(o.ac ?? "?", BLUE) }, true)
  S.tris = [...S.tris, { id: `A${mid}C`, pts: ["A", mid, "C"], col: BLUE }]
}

/**
 * 4024/23/M/J/25 Q22: a pyramid ABCV on an equilateral triangle with sides
 * 34; VA = VB = VC = 82 (drawn not to scale, as in the paper); M the middle
 * of AC, O on MB with MO : OB = 1 : 2, straight under V. Part (b)(i): show
 * that OB = 19.6 cm.
 */
const X4_R = 34 / Math.sqrt(3)
const X4_MB = Math.sqrt(34 * 34 - 17 * 17)
const X4_OB = (2 / 3) * X4_MB
const x4At = (deg: number): V3 => [X4_R * Math.cos(deg * Math.PI / 180), X4_R * Math.sin(deg * Math.PI / 180), 0]
const X4_A = x4At(210), X4_C = x4At(330), X4_B = x4At(90)
const X4_M: V3 = [(X4_A[0] + X4_C[0]) / 2, (X4_A[1] + X4_C[1]) / 2, 0]
const X4_BASE: [string, string][] = [["A", "B"], ["B", "C"], ["C", "A"]]

/** The paper's figure: the whole pyramid, every side of the base 34 and every sloping edge 82 (as the question says). */
function x4Board(S: Scene, o: { mo?: boolean } = {}) {
  solidBoard(S, { A: X4_A, B: X4_B, C: X4_C, V: [0, 0, 44], O: [0, 0, 0], M: X4_M },
    [["A", "C", "B"], ["V", "A", "C"], ["V", "C", "B"], ["V", "B", "A"]], { A: "A", B: "B", C: "C", V: "V" })
  S.fitPts = ["A", "B", "C", "V"]
  for (const [a, b] of X4_BASE) S.lens[segKey(a, b)] = lens("34")
  for (const n of ["A", "B", "C"]) { S.lens[segKey("V", n)] = lens("82", PINK); S.edgeCol[segKey("V", n)] = PINK }
  if (o.mo) {
    // M is the middle of AC: its 34 moves along, out of M's way
    S.lens[segKey("C", "A")] = lens("34", undefined, 0.27)
    S.names = { ...S.names, M: "M", O: "O" }
    S.dots = ["M", "O"]
    addSeg(S, "M", "B", { grown: true })
    addSeg(S, "O", "V", { grown: true, col: ORANGE })
    S.rights = [{ at: "O", a: "V", b: "B" }]
    S.lens[segKey("O", "B")] = lens("?", BLUE)
  }
}

/**
 * Just the base, for part (b)(i), with what the student has found on it:
 * `am` AM and MC are 17; `mb` MB is drawn (its length when known);
 * `right` the right angles at M; `o` where O sits along MB (0 at M, 1 at B),
 * with MO and OB drawn as two parts and the thirds marked.
 */
function x4Base(S: Scene, o: { am?: boolean; mb?: boolean | string; right?: boolean; o?: number; view?: boolean } = {}) {
  const O = vlerp(X4_M, X4_B, o.o ?? 1 / 3)
  solidBoard(S, { A: X4_A, B: X4_B, C: X4_C, M: X4_M, O }, [["A", "C", "B"]], { A: "A", B: "B", C: "C", M: "M" })
  S.fitPts = ["A", "B", "C"]
  S.dots = ["M"]
  S.lens[segKey("A", "B")] = lens("34")
  S.lens[segKey("B", "C")] = lens("34")
  if (o.am) { S.lens[segKey("A", "M")] = lens("17"); S.lens[segKey("M", "C")] = lens("17") } else S.lens[segKey("C", "A")] = lens("34", undefined, 0.27)
  if (o.mb) {
    if (o.o === undefined) addSeg(S, "M", "B", { grown: true, col: BLUE })
    // with O on MB, its length goes up near B, out of O's way
    if (typeof o.mb === "string") S.lens[segKey("M", "B")] = lens(o.mb, BLUE, o.o === undefined ? undefined : 0.86)
  }
  if (o.o !== undefined) {
    S.names = { ...S.names, O: "O" }
    S.dots = ["M", "O"]
    addSeg(S, "M", "O", { grown: true, col: CHALK })
    addSeg(S, "O", "B", { grown: true, col: BLUE })
    S.ticks = [{ a: "M", b: "B", at: [1 / 3, 2 / 3] }]
  }
  if (o.right) S.rights = [{ at: "M", a: "B", b: "C" }, { at: "M", a: "B", b: "A" }]
  // a flat triangle seen from low down is a sliver: look down at it (the student can turn it any way after)
  if (o.view !== false && S.pitch < 45) S.acts.push(turnAct(S2 => ({ yaw: nearYaw(S2, 0), pitch: 80 }), 1.4, false))
}

/** The nearest yaw to the view's own that is this one (so a turn goes the short way round). */
const nearYaw = (S: Scene, yaw: number) => S.yaw + ((((yaw - S.yaw) % 360) + 540) % 360) - 180

/** Where A goes as the half ABM of the base is folded over along MB: turned `phi` about MB, rising up off the floor. */
function x4Fold(phi: number): V3 {
  const k = vunit(vsub(X4_B, X4_M)), v = vsub(X4_A, X4_M)
  let kv = vcross(k, v)
  if (kv[2] < 0) kv = vmul(kv, -1)
  return vadd(X4_M, vadd(vmul(v, Math.cos(phi)), vmul(kv, Math.sin(phi))))
}
/** The folding half: a copy of triangle ABM turned `S.vals.phi` about MB (A2 is where A has got to). */
function x4Folding(S: Scene, phi: number) {
  S.vals.phi = phi
  S.tick = S2 => { S2.P3.A2 = x4Fold(S2.vals.phi ?? 0) }
  S.tick(S)
  S.tris = [{ id: "fold", pts: ["A2", "M", "B"], col: YELLOW, sheet: true }]
}

/** MO : OB as it is now, when O sits on one of the marks (else just the names). */
function x4Ratio(t: number): ENode {
  const at = (f: number) => Math.abs(t - f) < 1e-9
  const head = [pc("mo", "MO"), op("r", ":"), pc("ob", "OB", BLUE)]
  const tail = (a: string, b: string, col: string) => [op("eq", "="), pc("ra", a, col), op("r2", ":"), pc("rb", b, col)]
  if (at(1 / 3)) return row([...head, ...tail("1", "2", GREEN)])
  if (at(2 / 3)) return row([...head, ...tail("2", "1", PINK)])
  if (at(1 / 2)) return row([...head, ...tail("1", "1", CHALK)])
  return row(head)
}

/** The right-angled triangle on the base the student lifted (C M B, or A M B: the same shape turned over). */
function x4Lifted(S: Scene, o: { mb?: string } = {}) {
  x4Base(S, { am: true, mb: true, right: true })
  const end = S.picked["x4-tri"] === "AMB" ? "A" : "C"
  S.tris = [{ id: `${end}MB`, pts: [end, "M", "B"], col: CHALK }]
  liftOut(S, "up", [end, "M", "B"], "M", { [segKey(end, "B")]: lens("34", CHALK), [segKey(end, "M")]: lens("17", CHALK), [segKey("M", "B")]: lens(o.mb ?? "?", BLUE) }, true)
}
const X4_SIDES = { hyp: [segKey("C", "B"), segKey("A", "B")], half: [segKey("C", "M"), segKey("A", "M")] }
function x4Line(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t34", "34"), op("eq", "="), sq("mb", "MB", BLUE), op("p", "+"), sq("t17", "17", undefined, g("t17"))])
}
const x4Crossed = () => row([sq("t34", "34"), op("m", "-"), sq("t17", "17"), op("eq", "="), sq("mb", "MB", BLUE)])

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
  turnBeat("inside", "Turn it. This line goes through the inside.", S => { ecBoard(S); look(S) }, 60, 3),
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
    walk: pythWalk("EG", BLUE, ["12", CHALK, 12, BOX_FLOOR_SIDES], ["9", CHALK, 9], false, { flat: "floor", key: segKey("E", "G") }),
  }),
  askBeat("ec", "Now work out $EC$.", S => liftedBoard(S, { floor: true, eg: "15" }), {
    name: "EC", col: PINK, answer: EC, sf: 3, shown: "17", typed: "r15^+8^",
    slips: [
      { v: 23, say: "That's $15 + 8$. Square them first." },
      { v: 289, say: "That's $EC^2$. Now take the square root." },
      { v: Math.hypot(12, 8), say: "Use $EG = 15$, the side of this triangle on the floor." },
    ],
    writes: [["up", segKey("E", "C")]],
    walk: pythWalk("EC", PINK, ["15", BLUE, 15, segKey("E", "G")], ["8", ORANGE, 8, segKey("G", "C")], false, { key: segKey("E", "C") }),
  }),
  backBeat("back", S => liftedBoard(S, { floor: true, eg: "15", ec: "17" }), S => {
    S.lens[segKey("E", "C")] = lens("17", PINK)
    S.lens[segKey("E", "G")] = lens("15", BLUE)
  }),
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
    walk: boxWalk(6, 2, 3),
  }),
  askBeat("q2", "Now this one, to $3$ significant figures.", S => { ecBoard(S, { l: 8, w: 5, h: 4, ecTex: "?" }); look(S) }, {
    name: "EC", col: PINK, answer: Math.sqrt(105), sf: 3, shown: "10.2", typed: "r8^+5^+4^",
    slips: [{ v: 17, say: "That's $8 + 5 + 4$. Square them first." }, { v: 105, say: "That's $EC^2$. Now take the square root." }],
    onFigure: segKey("E", "C"),
    walk: boxWalk(8, 5, 4),
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
    // the line the student made by moving both across, so the working carries on from it
    above: () => q3Crossed(),
    walk: [
      { say: "We moved $12^2$ and $4^2$ across. They take away from $13^2$.", tex: `${c(ORANGE, "h")}^2 = 13^2 - 12^2 - 4^2`, show: S => { if (S.segs[segKey("E", "C")]) S.segs[segKey("E", "C")].glow = true } },
      { say: "Square each one, then take away.", tex: `${c(ORANGE, "h")}^2 = 169 - 144 - 16 = 9`, show: S => { S.edgeCol = { [segKey("E", "H")]: YELLOW, [segKey("H", "G")]: YELLOW } } },
      { say: "$h$ is its square root.", tex: `${c(ORANGE, "h")} = \\sqrt{9}`, show: S => { S.edgeCol = { [segKey("G", "C")]: ORANGE } } },
    ],
  }),
]

function backLine(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t13", "13", PINK), op("eq", "="), sq("t12", "12", undefined, g("t12")), op("p1", "+"), sq("t4", "4"), op("p2", "+"), sq("h", "h", ORANGE)])
}
const q3Crossed = () => row([sq("t13", "13", PINK), op("m1", "-"), sq("t12", "12"), op("m2", "-"), sq("t4", "4"), op("eq", "="), sq("h", "h", ORANGE)])

/**
 * The long diagonal of a box, walked through on the figure: the three
 * edges light up and are squared and added, then the square root. It stops
 * at what to press.
 */
function boxWalk(l: number, w: number, h: number) {
  const ec = c(PINK, "EC")
  const edges = { [segKey("E", "H")]: YELLOW, [segKey("H", "G")]: YELLOW, [segKey("G", "C")]: YELLOW }
  return [
    { say: "$EC$ goes across all three: the length, the width and the height.", tex: `${ec}^2 = ${l}^2 + ${w}^2 + ${h}^2`, show: (S: Scene) => { S.edgeCol = { ...edges } } },
    { say: "Square each edge, then add.", tex: `${ec}^2 = ${l * l} + ${w * w} + ${h * h} = ${l * l + w * w + h * h}`, show: (S: Scene) => { S.edgeCol = { ...edges } } },
    { say: "$EC$ is its square root.", tex: `${ec} = \\sqrt{${l * l + w * w + h * h}}`, show: (S: Scene) => { S.edgeCol = {}; if (S.segs[segKey("E", "C")]) S.segs[segKey("E", "C")].glow = true } },
  ]
}

/**
 * Put the flats back into the figure, slowly (the solid turns to face each
 * one's place, it flies in, then the solid turns back); the lengths found are
 * written on the figure once they are home. Moves on by itself.
 */
function backBeat(id: string, board: (S: Scene) => void, home: (S: Scene) => void, say0 = "Let's put them back."): Beat {
  return {
    id, say: say0,
    enter: S => { board(S); later(S, 0.5, S2 => putBack(S2, home)); look(S) },
    done: S => S.time - S.beatStart > 1 && !acting(S) && S.flats.length === 0,
    advanceAfter: 900,
  }
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
    walk: pythWalk("AC", BLUE, ["6", CHALK, 6, BASE_SIDES], ["6", CHALK, 6], false, { flat: "floor", key: segKey("A", "C") }),
  }),
  askBeat("pyr-xc", "So what is $XC$?", S => { pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3) }); look(S) }, {
    name: "XC", col: BLUE, answer: PY_XC, sf: 3, shown: sig(PY_XC, 3), ans: PY_AC, typed: "a/2",
    slips: [{ v: PY_AC, say: "That's all of $AC$. $X$ is halfway along it." }],
    writes: [["up", segKey("X", "C")]],
    ansName: "AC",
    walk: halfWalk("XC", "X", "AC", "the floor"),
  }),
  askBeat("pyr-ec", "Now work out $EC$.", S => { pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3), xc: sig(PY_XC, 3) }); look(S) }, {
    name: "EC", col: PINK, answer: PY_EC, sf: 3, shown: sig(PY_EC, 3), ans: PY_XC, typed: "ra^+8^",
    slips: [
      { v: PY_XC + 8, say: "Square them first." },
      { v: PY_EC * PY_EC, say: "That's $EC^2$. Now take the square root." },
      { v: Math.hypot(PY_AC, 8), say: "That used all of $AC$. Use $XC$, half of it." },
    ],
    writes: [["up", segKey("E", "C")]],
    ansName: "XC",
    walk: pythWalk("EC", PINK, [sig(PY_XC, 3), BLUE, PY_XC, segKey("X", "C")], ["8", ORANGE, 8, segKey("E", "X")], false, { key: segKey("E", "C") }),
  }),
  backBeat("pyr-back", S => pyLiftedBoard(S, { floor: true, ac: sig(PY_AC, 3), xc: sig(PY_XC, 3), ec: sig(PY_EC, 3) }), S => { S.lens[segKey("E", "C")] = lens(sig(PY_EC, 3), PINK) }),
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
    walk: [
      { say: "The base is $6$ across.", tex: `${c(CHALK, "AB")} = 6`, show: S => { S.edgeCol = { [segKey("A", "B")]: YELLOW } } },
      { say: "$X$ is in the middle, so $XM$ is half of it.", tex: `${c(BLUE, "XM")} = 6 \\div 2`, show: S => { S.edgeCol = {}; S.glowPts = ["X", "M"] } },
    ],
  }),
  askBeat("face-em", "Now work out $EM$.", S => { faceLifted(S, { xm: "3" }); look(S) }, {
    name: "EM", col: PINK, answer: PY_EM, sf: 3, shown: sig(PY_EM, 3), typed: "r3^+8^",
    slips: [{ v: 11, say: "That's $3 + 8$. Square them first." }, { v: 73, say: "That's $EM^2$. Now take the square root." }],
    writes: [["up", segKey("E", "M")]],
    walk: pythWalk("EM", PINK, ["3", BLUE, 3, segKey("X", "M")], ["8", ORANGE, 8, segKey("E", "X")], false, { key: segKey("E", "M") }),
  }),
]

/**
 * Half of a diagonal, walked through: the middle lights up on the figure,
 * then Ans (which holds the diagonal) is halved. It stops at what to press.
 */
function halfWalk(name: string, mid: string, whole: string, where: string, twice = false, midPt = mid) {
  const [w0, w1] = whole.split("")
  return [
    { say: `$${mid}$ is the middle of $${whole}$, on ${where}.`, tex: twice ? `${c(BLUE, whole)} = 2 \\times ${c(BLUE, name)}` : `${c(BLUE, name)} = ${c(BLUE, whole)} \\div 2`, show: (S: Scene) => { S.glowPts = [midPt]; if (S.segs[segKey(w0, w1)]) S.segs[segKey(w0, w1)].glow = true } },
    { say: `Ans still holds $${twice ? name : whole}$, with every digit.`, tex: twice ? `${c(BLUE, whole)} = 2 \\times \\text{Ans}` : `${c(BLUE, name)} = \\text{Ans} \\div 2`, show: (S: Scene) => { S.glowPts = [midPt] } },
  ]
}

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
  // the base is needed for XM, which is not on the lifted triangle: it stays on the figure
  S.lens[segKey("A", "B")] = given("6")
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
    walk: pythWalk("EG", BLUE, ["12", CHALK, 12, BOX_FLOOR_SIDES], ["10", CHALK, 10], false, { flat: "floor", key: segKey("E", "G") }),
  }),
  askBeat("x1-ce", "Now work out $CE$ to $4$ significant figures, one more than $17.1$ has.", S => { x1Board(S, { eg: true, tri: true }); x1Flats(S, { floor: true, eg: sig(X1_EG, 3) }); look(S) }, {
    name: "CE", col: PINK, answer: X1_CE, sf: 4, shown: sig(X1_CE, 4), ans: X1_EG, ansName: "EG", typed: "ra^+7^",
    slips: [{ v: X1_CE * X1_CE, say: "That's $CE^2$. Now take the square root." }, { v: X1_EG + 7, say: "Square them first." }],
    writes: [["up", segKey("E", "C")]],
    rightNote: `$${sig(X1_CE, 4)}$ is $17.1$ to $1$ decimal place.`,
    walk: [
      { say: "$CE$ is the longest side of this triangle.", tex: `${c(PINK, "CE")}^2 = ${c(BLUE, "EG")}^2 + ${c(ORANGE, "7")}^2`, show: S => lightFlat(S, "up", [segKey("E", "C")]) },
      { say: "$EG$ is $15.6$ rounded. Ans holds it with every digit.", tex: `${c(PINK, "CE")}^2 = \\text{Ans}^2 + 7^2`, show: S => lightFlat(S, "up", [segKey("E", "G")]) },
      { say: "$CE$ is the square root of that.", tex: `${c(PINK, "CE")} = \\sqrt{\\text{Ans}^2 + 7^2}`, show: S => lightFlat(S, "up", [segKey("E", "C")]) },
    ],
  }),

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
    after: () => x2Crossed(),
  }),
  askBeat("x2-xc", "Work out $XC$.", S => { x2Board(S); x2Up(S); look(S) }, {
    name: "XC", col: BLUE, answer: X2_XC, sf: 3, shown: sig(X2_XC, 3), typed: "r19^-17^",
    slips: [{ v: 72, say: "That's $XC^2$. Now take the square root." }, { v: Math.hypot(19, 17), say: "$19$ is the longest side. Take $17^2$ away." }, { v: 2, say: "Square them first." }],
    writes: [["up", segKey("X", "C")]],
    above: () => x2Crossed(),
    walk: pythWalk("XC", BLUE, ["19", PINK, 19, segKey("E", "C")], ["17", ORANGE, 17, segKey("E", "X")], true, { key: segKey("X", "C") }),
  }),
  askBeat("x2-ac", "$XC$ is half of the diagonal. So how long is $AC$?", S => { x2Board(S); x2Up(S, { xc: sig(X2_XC, 3) }); S.segs[segKey("A", "C")].glow = true; look(S) }, {
    name: "AC", col: BLUE, answer: X2_AC, sf: 3, shown: sig(X2_AC, 3), ans: X2_XC, ansName: "XC", typed: "a*2",
    slips: [{ v: X2_XC / 2, say: "$AC$ is the whole diagonal. It's twice $XC$." }],
    onFigure: segKey("A", "C"),
    walk: halfWalk("XC", "X", "AC", "the base", true),
  }),
  liftBeat("x2-floor", "Tap triangle $ABC$ to lift it out.", S => { x2Board(S); x2Up(S, { xc: sig(X2_XC, 3) }); look(S) }, {
    regions: [{ id: "ABC", pts: ["A", "B", "C"] }],
    makes: { ABC: { flat: "floor", pts: ["A", "B", "C"], right: "B", lens: { [segKey("A", "B")]: lens("s", CHALK), [segKey("B", "C")]: lens("s", CHALK), [segKey("A", "C")]: lens(sig(X2_AC, 3), BLUE) } } },
  }),
  watch("x2-s", "Its two short sides are the same. Let's call them $s$.", S => {
    x2Floor(S)
    S.eqFn = () => x2Sides()
    look(S, ["eq"])
  }, 2.6),
  askBeat("x2-side", "Work out $s$.", S => { x2Floor(S); look(S) }, {
    name: "s", col: CHALK, answer: 12, dp: 0, shown: "12", ans: X2_AC, ansName: "AC", typed: "ra^/2",
    slips: [{ v: X2_AC / 2, say: "Halving $AC$ gives $XC$. For the side, use $s^2 + s^2 = AC^2$." }, { v: 144, say: "That's $s^2$. Now take the square root." }],
    writes: [["floor", segKey("A", "B")], ["floor", segKey("B", "C")]],
    above: () => x2Sides(),
    walk: [
      { say: "Two $s^2$ make $AC^2$.", tex: `2s^2 = ${c(BLUE, "AC")}^2`, show: S => lightFlat(S, "floor", [segKey("A", "B"), segKey("B", "C")]) },
      { say: "So $s^2$ is half of $AC^2$. Ans holds $AC$.", tex: `s^2 = \\text{Ans}^2 \\div 2`, show: S => lightFlat(S, "floor", [segKey("A", "C")]) },
      { say: "$s$ is its square root.", tex: `s = \\sqrt{\\text{Ans}^2 \\div 2}`, show: S => lightFlat(S, "floor", [segKey("A", "B"), segKey("B", "C")]) },
    ],
  }),

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
    walk: pythWalk("AC", BLUE, ["6.2", CHALK, 6.2, BASE_SIDES], ["4.3", CHALK, 4.3], false, { flat: "floor", key: segKey("A", "C") }),
  }),
  askBeat("x3-ec", "So what is $EC$?", S => { x3Board(S); x3Up(S); x3Floor(S, { ac: sig(X3_AC, 3) }); look(S) }, {
    name: "EC", col: BLUE, answer: X3_EC, sf: 3, shown: sig(X3_EC, 3), ans: X3_AC, ansName: "AC", typed: "a/2",
    slips: [{ v: X3_AC, say: "That's all of $AC$. $E$ is halfway along it." }],
    writes: [["up", segKey("X", "C")]],
    // the middle is called E in this question (the point X of the board)
    walk: halfWalk("EC", "E", "AC", "the base", false, "X"),
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
    after: () => x3Crossed(),
  }),
  askBeat("x3-ef", "Work out $EF$ to $4$ significant figures, one more than $8.72$ has.", S => { x3Board(S); x3Up(S, { ec: sig(X3_EC, 3) }); look(S) }, {
    name: "EF", col: ORANGE, answer: X3_H, sf: 4, shown: sig(X3_H, 4), ans: X3_EC, ansName: "EC", typed: "r9.5^-a^",
    slips: [{ v: X3_H * X3_H, say: "That's $EF^2$. Now take the square root." }, { v: Math.hypot(9.5, X3_EC), say: "$9.5$ is the longest side. Take $EC^2$ away." }],
    writes: [["up", segKey("E", "X")]],
    above: () => x3Crossed(),
    rightNote: `$${sig(X3_H, 4)}$ is $8.72$ to $3$ significant figures.`,
    walk: [
      { say: "We moved $EC^2$ across. It takes away from $9.5^2$.", tex: `${c(ORANGE, "EF")}^2 = 9.5^2 - ${c(BLUE, "EC")}^2`, show: S => lightFlat(S, "up", [segKey("E", "C"), segKey("X", "C")]) },
      { say: "$EC$ is $3.77$ rounded. Ans holds it with every digit.", tex: `${c(ORANGE, "EF")}^2 = 9.5^2 - \\text{Ans}^2`, show: S => lightFlat(S, "up", [segKey("X", "C")]) },
      { say: "$EF$ is the square root of that.", tex: `${c(ORANGE, "EF")} = \\sqrt{9.5^2 - \\text{Ans}^2}`, show: S => lightFlat(S, "up", [segKey("E", "X")]) },
    ],
  }),

  // 4024/23/M/J/25 Q22(b)(i)
  watch("x4", "This pyramid stands on a triangle with sides $34$ cm. Its sloping edges are $82$ cm.", S => { x4Board(S); look(S) }, 3),
  watch("x4-q", "$M$ is the middle of $AC$, and $MO : OB = 1 : 2$. Show that $OB = 19.6$ cm.", S => { x4Board(S, { mo: true }); S.glowPts = ["M", "O"]; look(S) }, 3),
  {
    id: "x4-base",
    say: "$OB$ is on the base, so that's all we need. Let's look at it from above.",
    enter: S => {
      x4Board(S, { mo: true })
      // the rest of the pyramid fades right out, then the base turns to face us
      S.names = { A: "A", B: "B", C: "C", M: "M", O: "O" }
      for (const n of ["A", "B", "C"]) delete S.lens[segKey("V", n)]
      for (const [a, b] of X4_BASE) S.edgeCol[segKey(a, b)] = CHALK
      S.dimMax = 1
      S.dim.t = 1
      S.acts.push(holdAct(1.3, undefined, S2 => {
        x4Base(S2, { mb: true, view: false })
        S2.names = { ...S2.names, O: "O" }
        S2.dots = ["M", "O"]
        S2.lens[segKey("O", "B")] = lens("?", BLUE)
        S2.acts.push(turnAct(S3 => ({ yaw: nearYaw(S3, 0), pitch: 89 }), 2.4, false))
      }))
      look(S)
    },
    cta: "", ctaAfter: 4.4,
  },
  askBeat("x4-am", "$M$ is the middle of $AC$. How long is $AM$?", S => { x4Base(S); S.glowPts = ["M"]; look(S) }, {
    name: "AM", col: CHALK, answer: 17, sf: 3, shown: "17", typed: "34/2",
    slips: [{ v: 34, say: "That's all of $AC$. $M$ is halfway along it." }, { v: 68, say: "$AM$ is shorter than $AC$. It's half of it." }],
    then: S => { S.lens[segKey("A", "M")] = lens("17", GREEN); S.lens[segKey("M", "C")] = lens("17", GREEN); delete S.lens[segKey("C", "A")] },
    walk: [
      { say: "$AC$ is $34$.", tex: "AC = 34", show: S => { S.edgeCol = { [segKey("A", "C")]: YELLOW } } },
      { say: "$M$ is halfway along it, so $AM$ is half of $34$.", tex: "AM = 34 \\div 2", show: S => { S.edgeCol = {}; S.glowPts = ["A", "M"] } },
    ],
  }),
  joinBeat("x4-join", "Join $M$ to $B$.", "M", "B", S => { x4Base(S, { am: true }); look(S) }, (x, y) => `That joins $${x}$ and $${y}$. Join $M$ to $B$.`, { col: BLUE }),
  watch("x4-right-q", "Is the angle at $M$ a right angle? Let's check.", S => { x4Base(S, { am: true, mb: true }); S.glowPts = ["M"]; look(S) }, 2),
  {
    id: "x4-fold",
    say: "Fold the triangle over along $MB$. Drag $A$ across.",
    enter: S => {
      x4Base(S, { am: true, mb: true, view: false })
      x4Folding(S, 0)
      // tipped, so the fold is seen rising off the floor
      S.acts.push(turnAct(S2 => ({ yaw: nearYaw(S2, -18), pitch: 52 }), 1.6, false))
      S.handles = [{
        id: "fold", at: S2 => S2.P3.A2, axis: vunit(vsub(X4_C, X4_A)), move: () => {},
        place: (S2, f) => {
          let best = 0, bd = Infinity
          for (let i = 0; i <= 120; i++) { const ph = (Math.PI * i) / 120, d = dist(proj(S2, x4Fold(ph)), f); if (d < bd) { bd = d; best = ph } }
          // it clicks flat onto the other half, and back onto its own
          S2.vals.phi = best > Math.PI - 0.16 ? Math.PI : best < 0.06 ? 0 : best
        },
      }]
      look(S)
    },
    done: S => S.vals.phi === Math.PI && S.drag === null,
    advanceAfter: 1200,
  },
  {
    id: "x4-equal",
    say: "$A$ lands exactly on $C$. So the two angles at $M$ are equal.",
    enter: S => {
      x4Base(S, { am: true, mb: true })
      x4Folding(S, Math.PI)
      // it unfolds slowly, and the two angles it laid on each other light up
      S.acts.push(holdAct(0.9), {
        dur: 2.0, lock: true,
        run: (S2, e) => { S2.vals.phi = Math.PI * (1 - e) },
        end: S2 => { S2.tris = []; S2.tick = null; S2.arcs = [{ at: "M", a: "A", b: "B", pulse: true }, { at: "M", a: "C", b: "B", pulse: true }] },
      })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  askBeat("x4-ninety", "Together they make a straight line. How big is each one?", S => {
    x4Base(S, { am: true, mb: true })
    S.arcs = [{ at: "M", a: "A", b: "B" }, { at: "M", a: "C", b: "B" }]
    S.segs[segKey("A", "C")] = { a: "A", b: "C", col: CHALK, grow: { v: 1, t: 1 }, glow: true }
    look(S)
  }, {
    name: "\\angle AMB", col: CHALK, answer: 90, dp: 0, shown: "90^\\circ", typed: "180/2",
    slips: [{ v: 180, say: "$180^\\circ$ is the two together. Each is half of it." }, { v: 45, say: "The two together make $180^\\circ$, a straight line." }],
    above: () => row([pc("a1", "\\angle AMB"), op("p", "+"), pc("a2", "\\angle CMB"), op("eq", "="), pc("t", "180^\\circ")]),
    then: S => { S.arcs = []; S.segs = { ...S.segs }; delete S.segs[segKey("A", "C")]; S.rights = [{ at: "M", a: "B", b: "C", pulse: true }, { at: "M", a: "B", b: "A", pulse: true }] },
    walk: [
      { say: "$AMC$ is a straight line, so the two angles make $180^\\circ$.", tex: "\\angle AMB + \\angle CMB = 180^\\circ", show: S => { S.arcs = S.arcs.map(a => ({ ...a, pulse: true })) } },
      { say: "They are equal, so each one is half of $180^\\circ$.", tex: "\\angle AMB = 180^\\circ \\div 2" },
    ],
  }),
  liftBeat("x4-tri", "Tap a right-angled triangle with $MB$ in it.", S => { x4Base(S, { am: true, mb: true, right: true }); look(S) }, {
    regions: [{ id: "AMB", pts: ["A", "M", "B"] }, { id: "CMB", pts: ["C", "M", "B"] }],
    makes: {
      AMB: { pts: ["A", "M", "B"], right: "M", lens: { [segKey("A", "B")]: lens("34", CHALK), [segKey("A", "M")]: lens("17", CHALK), [segKey("M", "B")]: lens("?", BLUE) } },
      CMB: { pts: ["C", "M", "B"], right: "M", lens: { [segKey("C", "B")]: lens("34", CHALK), [segKey("C", "M")]: lens("17", CHALK), [segKey("M", "B")]: lens("?", BLUE) } },
    },
  }),
  watch("x4-long", "We know its longest side, $34$.", S => { x4Lifted(S); S.eqFn = () => x4Line(); look(S, ["eq"]) }, 2.4),
  crossBeat("x4-cross", "Move $17^2$ across the $=$.", S => { x4Lifted(S); look(S) }, {
    ids: ["t17", "t17q"], label: "17^2", from: "right",
    options: ["$-\\,17^2$", "$\\div\\,17^2$"], answer: 0,
    notes: { 1: "It was added, so it comes across as a take-away." },
    before: st => x4Line(st),
    after: () => x4Crossed(),
  }),
  askBeat("x4-mb", "Work out $MB$.", S => { x4Lifted(S); look(S) }, {
    name: "MB", col: BLUE, answer: X4_MB, sf: 3, shown: sig(X4_MB, 3), typed: "r34^-17^",
    slips: [{ v: Math.hypot(34, 17), say: "$34$ is the longest side here. Take $17^2$ away." }, { v: 867, say: "That's $MB^2$. Now take the square root." }, { v: 17, say: "Square them first." }],
    writes: [["up", segKey("M", "B")]],
    above: () => x4Crossed(),
    walk: pythWalk("MB", BLUE, ["34", CHALK, 34, X4_SIDES.hyp], ["17", CHALK, 17, X4_SIDES.half], true, { key: segKey("M", "B") }),
  }),
  backBeat("x4-back", S => x4Lifted(S, { mb: sig(X4_MB, 3) }), S => { S.lens[segKey("M", "B")] = lens(sig(X4_MB, 3), BLUE) }, "Let's put it back."),
  {
    id: "x4-slide",
    say: "Slide $O$ along $MB$ until $MO : OB = 1 : 2$.",
    enter: S => {
      x4Base(S, { am: true, mb: sig(X4_MB, 3), right: true, o: 0.5 })
      S.vals.t = 0.5
      S.tick = S2 => { S2.P3.O = vlerp(X4_M, X4_B, S2.vals.t) }
      S.handles = [{
        id: "O", at: S2 => S2.P3.O, axis: vunit(vsub(X4_B, X4_M)), move: () => {},
        place: (S2, f) => {
          let best = 0.5, bd = Infinity
          for (let i = 0; i <= 120; i++) { const t = 0.05 + (0.9 * i) / 120, d = dist(proj(S2, vlerp(X4_M, X4_B, t)), f); if (d < bd) { bd = d; best = t } }
          // it clicks onto the marks (and the middle), from far enough away for a finger on a phone
          const snap = [1 / 3, 1 / 2, 2 / 3].find(m => Math.abs(best - m) < 0.065)
          const was = S2.vals.t
          S2.vals.t = snap ?? best
          if (snap === 2 / 3 && was !== snap) say(S2, "That makes $MO$ twice as long as $OB$. We want $OB$ twice $MO$.", "wrong", 4.2)
          if (snap === 1 / 3 && was !== snap) S2.note = null
        },
      }]
      S.eqFn = S2 => x4Ratio(S2.vals.t)
      look(S, ["eq"])
    },
    done: S => S.drag === null && S.vals.t === 1 / 3,
    advanceAfter: 1500,
  },
  {
    id: "x4-frac",
    say: "So what fraction of $MB$ is $OB$?",
    enter: S => {
      x4Base(S, { am: true, mb: sig(X4_MB, 3), right: true, o: 1 / 3 })
      S.eqFn = () => x4Ratio(1 / 3)
      choose(S, ["$\\dfrac{1}{3}$", "$\\dfrac{1}{2}$", "$\\dfrac{2}{3}$"], 2, false, (S2, k, right) => {
        if (right) { say(S2, "Yes. $MB$ is $3$ equal parts, and $OB$ is $2$ of them.", "calm", 3.6); S2.segs[segKey("O", "B")].glow = true; return }
        say(S2, k === 0 ? "That's $MO$, the short part." : "$MB$ is $3$ equal parts. How many of them are $OB$?", "wrong", 4)
        S2.ticks = S2.ticks.map(t => ({ ...t, pulse: true }))
      })
      look(S, ["eq", "chips"])
    },
    done: S => S.choice?.state === "right",
    advanceAfter: 2400,
  },
  askBeat("x4-ob", "Work out $OB$ to $4$ significant figures, one more than $19.6$ has.", S => { x4Base(S, { am: true, mb: sig(X4_MB, 3), right: true, o: 1 / 3 }); S.lens[segKey("O", "B")] = lens("?", BLUE); look(S) }, {
    name: "OB", col: BLUE, answer: X4_OB, sf: 4, shown: sig(X4_OB, 4), ans: X4_MB, ansName: "MB", typed: "a*2/3",
    slips: [{ v: X4_MB / 3, say: "That's $MO$, one part. $OB$ is two parts." }, { v: X4_MB / 2, say: "$OB$ is $\\tfrac{2}{3}$ of $MB$, not half." }, { v: X4_MB * 3 / 2, say: "$OB$ is shorter than $MB$: $\\tfrac{2}{3}$ of it." }],
    onFigure: segKey("O", "B"),
    above: () => row([pc("ob", "OB", BLUE), op("eq", "="), pc("f", "\\tfrac{2}{3}"), op("x", "\\times"), pc("mb", "MB", BLUE)]),
    rightNote: `$${sig(X4_OB, 4)}$ is $19.6$ to $1$ decimal place.`,
    walk: [
      { say: "$MB$ is split into $3$ equal parts.", tex: "MO : OB = 1 : 2", show: S => { S.ticks = S.ticks.map(t => ({ ...t, pulse: true })) } },
      { say: "$OB$ is $2$ of those parts.", tex: `${c(BLUE, "OB")} = \\tfrac{2}{3} \\times ${c(BLUE, "MB")}`, show: S => { S.ticks = S.ticks.map(t => ({ ...t, pulse: false })); S.segs[segKey("O", "B")].glow = true } },
      { say: "Ans still holds $MB$, with every digit.", tex: `${c(BLUE, "OB")} = \\tfrac{2}{3} \\times \\text{Ans}`, show: S => { S.segs[segKey("O", "B")].glow = false; S.lens[segKey("M", "B")] = { ...S.lens[segKey("M", "B")], pulse: true } } },
      { say: "On the calculator, that's Ans, times $2$, divided by $3$.", tex: "\\text{Ans} \\times 2 \\div 3" },
    ],
  }),

  // ── the end ──
  watch("end-find", "In 3D, find a right-angled triangle with the length you want in it.", S => {
    ecBoard(S, { eg: true, right: true, ecTex: "?" })
    S.tris = [{ id: "EGC", pts: ["E", "G", "C"], col: YELLOW, sheet: true }]
    S.spin = 12
    look(S)
  }, 2.6),
  {
    id: "end-lift",
    say: "Then lift it out and use Pythagoras. Some lengths need it twice.",
    enter: S => { liftedBoard(S, { floor: true, eg: "15", ec: "17" }); look(S) },
    cta: "Finish", ctaAfter: 2.4, close: true,
  },
]

function x2Line(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t19", "19", PINK), op("eq", "="), sq("xc", "XC", BLUE), op("p", "+"), sq("t17", "17", ORANGE, g("t17"))])
}
const x2Crossed = () => row([sq("t19", "19", PINK), op("m", "-"), sq("t17", "17", ORANGE), op("eq", "="), sq("xc", "XC", BLUE)])
const x2Sides = () => row([sq("s1", "s"), op("p", "+"), sq("s2", "s"), op("eq", "="), sq("ac", "AC", BLUE)])
function x2Floor(S: Scene) {
  x2Board(S)
  x2Up(S, { xc: sig(X2_XC, 3) })
  liftOut(S, "floor", ["A", "B", "C"], "B", { [segKey("A", "B")]: lens("s", CHALK), [segKey("B", "C")]: lens("s", CHALK), [segKey("A", "C")]: lens(sig(X2_AC, 3), BLUE) }, true)
  S.tris = [...S.tris, { id: "ABC", pts: ["A", "B", "C"], col: BLUE }]
}
const x3Crossed = () => row([sq("t95", "9.5", PINK), op("m", "-"), sq("ec", "EC", BLUE), op("eq", "="), sq("h", "EF", ORANGE)])
function x3Line(st?: CrossState): ENode {
  const g = (id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })
  return row([sq("t95", "9.5", PINK), op("eq", "="), sq("h", "EF", ORANGE), op("p", "+"), sq("ec", "EC", BLUE, g("ec"))])
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
