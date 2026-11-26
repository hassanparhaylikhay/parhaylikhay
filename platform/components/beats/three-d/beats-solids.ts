/**
 * Solids and nets (4.1, lesson 2 of 2), one tiny idea per beat.
 *
 * The student turns a cube and taps each face, each edge and each vertex to
 * count them. Then a cuboid, a triangular prism and a square-based pyramid,
 * counted by typing (Show me how lights them in groups); the curved solids by
 * name; a cube unfolded into its net and folded back; and the nets from
 * 4024/12/O/N/21 Q4 and 4024/11/O/N/19 Q3, each folded up by the student
 * before it is named.
 */

import type { WalkStep } from "../walk"
import { atom, row, op } from "../equation"
import { applyParts } from "../chapter"
import {
  type Scene, type V3, BLUE, ORANGE, PINK, GREEN, YELLOW,
  boxPts, BOX_FACES, pyramidPts, PYRAMID_FACES, resetBeat, say, startInput, boxNode, segKey, edgesOf, faceFront,
} from "./scene"
import { type Beat, look, watch, turnBeat as turnIt, solidBoard } from "./kit"
import { type Curved, type Net, curvedBounds, netBounds, foldNet, cubeNet, cuboidNet, pyramidNet, prismNet, frustumApex } from "./solids"

/** Turn the solid: the arrow comes once it has been turned this far. */
const turnBeat = (id: string, text: string, enter: (S: Scene) => void, degrees = 60): Beat => turnIt(id, text, S => { enter(S); look(S) }, degrees)

const LIT = [BLUE, ORANGE, PINK, GREEN, YELLOW, "#c9c7bf", "#97958e"]

// ── the solids ───────────────────────────────────────────────────────────

type Def = { pts: Record<string, V3>; faces: string[][] }
const CUBE: Def = { pts: boxPts(2, 2, 2), faces: BOX_FACES }
const CUBOID: Def = { pts: boxPts(3.2, 2, 1.4), faces: BOX_FACES }
const PRISM: Def = {
  pts: { P1: [-1.6, -1, 0], P2: [-1.6, 1, 0], P3: [-1.6, 0, 1.73], Q1: [1.6, -1, 0], Q2: [1.6, 1, 0], Q3: [1.6, 0, 1.73] },
  faces: [["P1", "P2", "P3"], ["Q1", "Q3", "Q2"], ["P1", "Q1", "Q2", "P2"], ["P2", "Q2", "Q3", "P3"], ["P3", "Q3", "Q1", "P1"]],
}
const PYRAMID: Def = { pts: (() => { const p = pyramidPts(2.4, 2.4, 2.2); delete (p as Record<string, V3>).X; return p })(), faces: PYRAMID_FACES }

const vertsOf = (d: Def) => [...new Set(d.faces.flat())]

/** A solid on the board, no letters; turned to a good view. */
function board(S: Scene, d: Def) {
  solidBoard(S, d.pts, d.faces, {})
  S.keyRows = 4
}

/** A curved solid on the board, with points round it for the view to fit. */
function curvedBoard(S: Scene, c: Curved) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  curvedBounds(c).forEach((p, i) => { S.P3[`_c${i}`] = p })
  S.faces = null
  S.curved = c
  S.fitPts = Object.keys(S.P3)
}

/**
 * A net on the board, folded a fraction t of the way. The view fits round
 * the flat net while it is being folded, and round the solid once it is
 * made, so it eases in as a beat about the solid opens.
 */
function netBoard(S: Scene, net: Net, t: number, fit: "flat" | "solid" = t === 1 ? "solid" : "flat") {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  const room = fit === "solid" ? Object.values(foldNet(net, 1)).flat() : netBounds(net)
  room.forEach((p, i) => { S.P3[`_n${i}`] = p })
  S.faces = null
  S.net = { def: net, t, tD: S.vals.keepFold ?? t }
  S.fitPts = Object.keys(S.P3)
  // looked at from above, so the flat net reads as a shape
  S.pitch = Math.max(S.pitch, 42)
}

// ── counting by tapping ──────────────────────────────────────────────────

type What = "faces" | "edges" | "vertices"
const NAME: Record<What, string> = { faces: "Faces", edges: "Edges", vertices: "Vertices" }

/** The count so far, under the figure. */
const countLine = (S: Scene, what: What, total?: number) => {
  S.eqFn = S2 => {
    const n = S2.vals.count ?? 0
    return row([atom("cl", `\\text{${NAME[what]}}`), op("ce", "="), atom("cn", String(n), { col: total !== undefined && n === total ? GREEN : undefined })])
  }
}

/** Tap each face (or edge, or vertex) once; each lights up as it is counted. Turn the solid to find the hidden ones. */
function countBeat(id: string, text: string, d: Def, what: What, total: number): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S, d)
      S.vals.count = 0
      const seen = new Set<string>()
      const hit = (S2: Scene, key: string, light: () => void) => {
        if (S2.got.has("done")) return
        if (seen.has(key)) { say(S2, `You have counted that one. Turn it to find the others.`, "calm", 3); return }
        seen.add(key)
        light()
        S2.vals.count = seen.size
        S2.note = null
        if (seen.size === total) { S2.got.add("done"); S2.flashGood = 1; S2.touched = "eq" }
      }
      if (what === "faces") {
        S.mode = "tapRegion"
        // only the faces looking at the student can be tapped (one at the back sits behind one in front)
        S.tick = S2 => { S2.regions = (S2.faces ?? []).map((f, i) => ({ id: String(i), pts: f })).filter(r => faceFront(S2, S2.faces![+r.id])) }
        S.onRegion = (S2, k) => hit(S2, k, () => { S2.faceLit[+k] = LIT[seen.size % LIT.length] })
      } else if (what === "edges") {
        S.mode = "tapSeg"
        S.tapSegs = edgesOf(S).map(([a, b]) => segKey(a, b))
        S.onSeg = (S2, k) => hit(S2, k, () => { S2.edgeCol[k] = ORANGE })
      } else {
        S.mode = "tapPoint"
        S.tapPoints = vertsOf(d)
        S.onPoint = (S2, n) => hit(S2, n, () => { S2.glowPts = [...S2.glowPts, n] })
      }
      countLine(S, what, total)
      look(S, ["eq"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 1800,
  }
}

/** Everything counted, lit (for the watching beat after a count, and a cold open). */
function allLit(S: Scene, d: Def, what: What) {
  board(S, d)
  if (what === "faces") d.faces.forEach((_, i) => { S.faceLit[i] = LIT[i % LIT.length] })
  if (what === "edges") for (const [a, b] of edgesOf(S)) S.edgeCol[segKey(a, b)] = ORANGE
  if (what === "vertices") S.glowPts = vertsOf(d)
  S.vals.count = what === "faces" ? d.faces.length : what === "edges" ? edgesOf(S).length : vertsOf(d).length
  countLine(S, what, S.vals.count)
}

// ── counting by typing ───────────────────────────────────────────────────

/** How many: typed on a keypad of digits. Show me how lights them up in groups. */
function askCount(id: string, text: string, d: Def, what: What, o: { answer: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[] }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S, d)
      S.keyRows = 2
      startInput(S, { answer: o.answer, dp: 0, slips: o.slips, typed: String(o.answer), max: 3 })
      S.eqFn = S2 => row([atom("cl", `\\text{${NAME[what]}}`), op("ce", "="), S2.input?.state === "right" ? atom("cn", String(o.answer), { col: GREEN }) : boxNode(S2)])
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 1800,
    walk: o.walk,
  }
}
const lightFaces = (idx: number[], col: string) => (S: Scene) => { for (const i of idx) S.faceLit[i] = col }
const lightEdges = (pairs: [string, string][], col: string) => (S: Scene) => { for (const [a, b] of pairs) S.edgeCol[segKey(a, b)] = col }
const lightPts = (pts: string[]) => (S: Scene) => { S.glowPts = [...new Set([...S.glowPts, ...pts])] }

// ── picking a name ───────────────────────────────────────────────────────

function nameBeat(id: string, text: string, enter: (S: Scene) => void, o: { options: string[]; answer: number; notes: Record<number, string>; right: string }): Beat {
  return {
    id, say: text,
    enter: S => {
      enter(S)
      S.choice = {
        options: o.options, answer: o.answer, picked: null, state: "idle", wrongAt: -9, guess: false,
        onPick: (S2, k, right) => { if (right) { S2.got.add("done"); say(S2, o.right, "calm", 600) } else say(S2, o.notes[k] ?? "Look again.", "wrong", 4.5) },
      }
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2200,
  }
}

// ── folding a net ────────────────────────────────────────────────────────

/** The far corner of a face of the net, as drawn: where the fold handle sits. */
const tipOf = (S: Scene, face: string, corner: number): V3 => foldNet(S.net!.def, S.net!.tD)[face][corner]

/** Drag the handle up to fold the net (or down to unfold it); it clicks shut, or flat, at the end. */
function foldBeat(id: string, text: string, net: () => Net, o: { from: 0 | 1; to: 0 | 1; face: string; corner: number }): Beat {
  return {
    id, say: text,
    enter: S => {
      netBoard(S, net(), o.from, "flat")
      S.handles = [{
        id: "fold", axis: [0, 0, 1],
        at: S2 => tipOf(S2, o.face, o.corner),
        start: S2 => { S2.vals.t0 = S2.net!.t },
        move: (S2, amount) => {
          if (S2.got.has("done")) return
          let t = Math.max(0, Math.min(1, (S2.vals.t0 ?? 0) + amount / 2.4))
          if (Math.abs(t - o.to) < 0.06) { t = o.to; S2.got.add("done"); S2.flashGood = 1; S2.handles = [] }
          S2.net!.t = t
        },
      }]
      look(S)
    },
    done: S => S.got.has("done") && S.drag === null,
    advanceAfter: 1400,
  }
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  turnBeat("cube", "This is a cube. Turn it round.", S => board(S, CUBE), 90),
  watch("face", "Each flat surface is a *face*.", S => { board(S, CUBE); S.faceLit[2] = BLUE; look(S) }, 2.2),
  countBeat("faces-tap", "Tap each face once. Turn it to find them all.", CUBE, "faces", 6),
  watch("faces-6", "A cube has $6$ faces.", S => { allLit(S, CUBE, "faces"); look(S, ["eq"]) }, 2.0),
  watch("edge", "Where two faces meet is an *edge*.", S => { board(S, CUBE); S.faceLit[2] = BLUE; S.faceLit[3] = PINK; S.edgeCol[segKey("H", "D")] = ORANGE; look(S) }, 2.4),
  countBeat("edges-tap", "Tap each edge once.", CUBE, "edges", 12),
  watch("edges-12", "A cube has $12$ edges.", S => { allLit(S, CUBE, "edges"); look(S, ["eq"]) }, 2.0),
  {
    id: "vertex",
    say: "A corner is a *vertex*.",
    enter: S => { board(S, CUBE); S.glowPts = ["D"]; say(S, "More than one vertex are called vertices.", "calm", 600); look(S) },
    cta: "", ctaAfter: 2.4,
  },
  countBeat("verts-tap", "Tap each vertex once.", CUBE, "vertices", 8),
  watch("verts-8", "A cube has $8$ vertices.", S => {
    allLit(S, CUBE, "vertices")
    S.eqFn = () => atom("card", "\\begin{array}{rl}\\text{Faces} & 6 \\\\ \\text{Edges} & 12 \\\\ \\text{Vertices} & 8\\end{array}")
    look(S, ["eq"])
  }, 2.6),
]

const PART_2: Beat[] = [
  turnBeat("cuboid", "This is a *cuboid*. Its faces are rectangles.", S => board(S, CUBOID), 60),
  askCount("cuboid-v", "How many vertices does it have?", CUBOID, "vertices", {
    answer: 8,
    slips: [{ v: 4, say: "That's the top. Count the bottom too." }, { v: 6, say: "That's the faces. Vertices are the corners." }],
    walk: [
      { say: "Count the corners on top.", show: lightPts(["A", "B", "C", "D"]) },
      { say: "Then the corners at the bottom.", show: lightPts(["E", "F", "G", "H"]) },
    ],
  }),
  watch("cuboid-same", "It has $6$ faces, $12$ edges and $8$ vertices, like a cube.", S => { board(S, CUBOID); look(S) }, 3.0),
  turnBeat("prism", "This is a triangular *prism*. Its two ends are the same triangle.", S => { board(S, PRISM); S.faceLit[0] = BLUE; S.faceLit[1] = BLUE }, 60),
  askCount("prism-f", "How many faces does it have?", PRISM, "faces", {
    answer: 5,
    slips: [{ v: 6, say: "A cube has $6$. Count this one: its two ends, then its sides." }, { v: 3, say: "That's the sides. Add the two ends." }, { v: 2, say: "That's the ends. Add the sides." }],
    walk: [
      { say: "It has two triangle ends.", show: lightFaces([0, 1], BLUE) },
      { say: "And three rectangle sides.", show: lightFaces([2, 3, 4], ORANGE) },
    ],
  }),
  askCount("prism-e", "How many edges does it have?", PRISM, "edges", {
    answer: 9,
    slips: [{ v: 6, say: "That's the edges round the two ends. Add the ones that run along it." }, { v: 12, say: "A cube has $12$. Count this one." }],
    walk: [
      { say: "Each triangle end has $3$ edges.", show: lightEdges([["P1", "P2"], ["P2", "P3"], ["P3", "P1"], ["Q1", "Q2"], ["Q2", "Q3"], ["Q3", "Q1"]], BLUE) },
      { say: "And $3$ edges run along it, from one end to the other.", show: lightEdges([["P1", "Q1"], ["P2", "Q2"], ["P3", "Q3"]], ORANGE) },
    ],
  }),
  askCount("prism-v", "How many vertices does it have?", PRISM, "vertices", {
    answer: 6,
    slips: [{ v: 3, say: "That's one end. Count the other end too." }, { v: 5, say: "That's the faces. Vertices are the corners." }],
    walk: [
      { say: "Count the corners at one end.", show: lightPts(["P1", "P2", "P3"]) },
      { say: "Then at the other end.", show: lightPts(["Q1", "Q2", "Q3"]) },
    ],
  }),
  turnBeat("pyr", "This is a square-based *pyramid*. Its sides meet at the top.", S => { board(S, PYRAMID); S.faceLit[0] = BLUE }, 60),
  askCount("pyr-f", "How many faces does it have?", PYRAMID, "faces", {
    answer: 5,
    slips: [{ v: 4, say: "That's the triangles. Add the square at the bottom." }],
    walk: [
      { say: "The square at the bottom is one face.", show: lightFaces([0], BLUE) },
      { say: "Then the triangles round it.", show: lightFaces([1, 2, 3, 4], ORANGE) },
    ],
  }),
  askCount("pyr-e", "How many edges does it have?", PYRAMID, "edges", {
    answer: 8,
    slips: [{ v: 4, say: "That's round the bottom. Add the edges up to the top." }, { v: 5, say: "That's the faces. Edges are where faces meet." }],
    walk: [
      { say: "$4$ edges go round the square.", show: lightEdges([["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]], BLUE) },
      { say: "And $4$ go up to the top.", show: lightEdges([["A", "E"], ["B", "E"], ["C", "E"], ["D", "E"]], ORANGE) },
    ],
  }),
  askCount("pyr-v", "How many vertices does it have?", PYRAMID, "vertices", {
    answer: 5,
    slips: [{ v: 4, say: "That's the bottom. Don't forget the top." }, { v: 8, say: "That's the edges. Vertices are the corners." }],
    walk: [
      { say: "$4$ corners round the square.", show: lightPts(["A", "B", "C", "D"]) },
      { say: "And one at the top.", show: lightPts(["E"]) },
    ],
  }),
]

const CYL: Curved = { kind: "cylinder", r: 1.1, h: 2.6 }
const CONE: Curved = { kind: "cone", r: 1.3, h: 2.6 }
const SPHERE: Curved = { kind: "sphere", r: 1.4, h: 2.8 }
const HEMI: Curved = { kind: "hemisphere", r: 1.6, h: 1.6 }
const FRUSTUM: Curved = { kind: "frustum", r: 1.5, h: 1.6, r2: 0.8 }

const PART_3: Beat[] = [
  turnBeat("cyl", "This is a *cylinder*. Its two ends are circles.", S => curvedBoard(S, { ...CYL, ends: BLUE, pulse: true }), 60),
  turnBeat("cone", "This is a *cone*. It has a circle at the bottom and a point at the top.", S => curvedBoard(S, { ...CONE, ends: BLUE, pulse: true, tip: ORANGE }), 60),
  watch("sphere", "This is a *sphere*. It is round like a ball.", S => { curvedBoard(S, SPHERE); S.spin = 18; look(S) }, 2.4),
  turnBeat("hemi", "Half a sphere is a *hemisphere*.", S => curvedBoard(S, HEMI), 60),
  turnBeat("frustum", "A cone with its top cut off is a *frustum*.", S => { curvedBoard(S, { ...FRUSTUM, ghost: true }); S.P3._apex = [0, 0, frustumApex(FRUSTUM)]; S.fitPts = Object.keys(S.P3) }, 60),
  nameBeat("quiz-cone", "What is this solid called?", S => { curvedBoard(S, CONE); S.spin = 14 }, {
    options: ["Cylinder", "Pyramid", "Cone", "Frustum"], answer: 2,
    notes: { 0: "A cylinder has a circle at each end.", 1: "A pyramid has flat faces.", 3: "A frustum has its top cut off." },
    right: "Yes. A circle at the bottom and a point at the top.",
  }),
  nameBeat("quiz-frustum", "And this one?", S => { curvedBoard(S, FRUSTUM); S.spin = 14 }, {
    options: ["Frustum", "Cylinder", "Cone", "Hemisphere"], answer: 0,
    notes: { 1: "A cylinder's two ends are the same size.", 2: "A cone comes to a point.", 3: "A hemisphere is half a sphere." },
    right: "Yes. It is a cone with its top cut off.",
  }),
]

const PART_4: Beat[] = [
  watch("net-cube", "Here is a cube again.", S => { netBoard(S, cubeNet(), 1); look(S) }, 2.0),
  foldBeat("unfold", "Drag this corner down to open it out flat.", cubeNet, { from: 1, to: 0, face: "top", corner: 3 }),
  watch("net", "The flat shape is a *net* of the cube.", S => { netBoard(S, cubeNet(), 0); look(S) }, 2.4),
  foldBeat("fold", "Now drag it up to fold it back into a cube.", cubeNet, { from: 0, to: 1, face: "top", corner: 3 }),

  // 4024/12/O/N/21 Q4
  watch("w21", "Each of these nets folds into a solid.", S => { netBoard(S, cuboidNet(), 0); look(S) }, 2.2),
  foldBeat("w21-1", "Fold this net up.", cuboidNet, { from: 0, to: 1, face: "f3", corner: 0 }),
  nameBeat("w21-1n", "What is the solid called?", S => netBoard(S, cuboidNet(), 1), {
    options: ["Cube", "Cuboid", "Triangular prism", "Pyramid"], answer: 1,
    notes: { 0: "A cube's faces are all squares. These are not.", 2: "A triangular prism has triangle ends.", 3: "A pyramid's sides meet at a point." },
    right: "Yes. Its faces are rectangles.",
  }),
  foldBeat("w21-2", "Fold this one up.", () => pyramidNet(), { from: 0, to: 1, face: "t1", corner: 2 }),
  nameBeat("w21-2n", "What is it called?", S => netBoard(S, pyramidNet(), 1), {
    options: ["Square-based pyramid", "Triangular prism", "Cube", "Cone"], answer: 0,
    notes: { 1: "A triangular prism has two triangle ends and rectangle sides.", 2: "A cube's faces are all squares.", 3: "A cone has a curved surface." },
    right: "Yes. A square base, and triangles that meet at the top.",
  }),
  foldBeat("w21-3", "And this one.", () => prismNet(), { from: 0, to: 1, face: "left", corner: 0 }),
  nameBeat("w21-3n", "What is it called?", S => netBoard(S, prismNet(), 1), {
    options: ["Cuboid", "Triangular prism", "Square-based pyramid", "Cylinder"], answer: 1,
    notes: { 0: "A cuboid has no triangle faces.", 2: "A pyramid's faces meet at a point.", 3: "A cylinder has circle ends." },
    right: "Yes. Its two ends are the same triangle.",
  }),

  // 4024/11/O/N/19 Q3
  watch("w19", "This net is from another paper.", S => { netBoard(S, pyramidNet(2, 2.6), 0); look(S) }, 2.2),
  foldBeat("w19-fold", "Fold it up.", () => pyramidNet(2, 2.6), { from: 0, to: 1, face: "t1", corner: 2 }),
  {
    id: "w19-v",
    say: "How many vertices does this solid have?",
    enter: S => {
      netBoard(S, pyramidNet(2, 2.6), 1)
      S.keyRows = 2
      startInput(S, { answer: 5, dp: 0, typed: "5", max: 3, slips: [{ v: 4, say: "That's the bottom. Don't forget the top." }, { v: 8, say: "That's the edges. Vertices are the corners." }] })
      S.eqFn = S2 => row([atom("cl", "\\text{Vertices}"), op("ce", "="), S2.input?.state === "right" ? atom("cn", "5", { col: GREEN }) : boxNode(S2)])
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 1800,
    walk: [
      { say: "The square at the bottom has $4$ corners.", tex: "4", show: S => { const F = foldNet(pyramidNet(2, 2.6), 1); F.base.forEach((p, i) => { S.P3[`V${i}`] = p }); S.glowPts = ["V0", "V1", "V2", "V3"] } },
      { say: "The triangles meet at one more, at the top.", tex: "4 + 1", show: S => { S.P3.V4 = foldNet(pyramidNet(2, 2.6), 1).t1[2]; S.glowPts = [...S.glowPts, "V4"] } },
    ],
  },
  {
    id: "end",
    say: "In summary, a solid has faces, edges and vertices. A net is the flat shape that folds up into it.",
    enter: S => { allLit(S, CUBE, "faces"); S.eqFn = null; S.spin = 12; look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["cube", "Faces, edges and vertices"],
  ["cuboid", "Prisms and pyramids"],
  ["cyl", "Curved solids"],
  ["net-cube", "Nets"],
])

