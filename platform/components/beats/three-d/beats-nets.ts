/**
 * Drawing nets (4.2, lesson 3 of 3), one tiny idea per beat.
 *
 * A net is drawn on squared paper: the 3D board looks straight down on its
 * floor grid. The student makes a cube's net by tapping squares next to it,
 * and it folds up to check itself: faces that would land on the same side
 * turn pink and it opens out again. Then 4024/12/M/J/25 Q3 (a cube whose face
 * has area 9 cm², its net drawn on a 1 cm grid) and 4024/21/O/N/25 Q3(a)
 * (the total surface area of a cuboid from its net, face by face in pairs).
 *
 * Colours: the net chalk, faces that clash pink, the pairs of equal faces
 * blue, orange and pink, a net that folds green; where a face can go yellow.
 */

import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { type Scene, type V3, BLUE, ORANGE, PINK, GREEN, resetBeat, say, goodView, segKey } from "./scene"
import { type Beat, look, watch, askBeat, lens } from "./kit"
import { type Net, netFromCells, clashes, w25Net, foldNet } from "./solids"
import { type NetLab, netBoard, glowFaces, glowEdges, tagFaces, addLab, unfold } from "./netkit"

/** The floor seen from straight above (the net as a drawing on squared paper), and leaning back to watch it fold. */
const TOP: [number, number] = [0, 89]
const SIDE: [number, number] = [-30, 32]

type Cell = [number, number]
/** A cross: the net of a cube most people draw first. */
const CROSS: Cell[] = [[1, 1], [0, 1], [2, 1], [3, 1], [1, 0], [1, 2]]

/** A net on the floor: the view fits round `area` (cells of `k` cm, as [i0, j0, i1, j1]), so it holds still while faces come and go. */
function netBoard0(S: Scene, net: Net, o: { k: number; area: [number, number, number, number]; t?: number; view?: [number, number]; cols?: Record<string, string> }) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  const [i0, j0, i1, j1] = o.area, k = o.k
  const room: V3[] = [[i0 * k, j0 * k, 0], [(i1 + 1) * k, j0 * k, 0], [i0 * k, (j1 + 1) * k, 0], [(i1 + 1) * k, (j1 + 1) * k, 0], [(i0 + i1 + 1) * k / 2, (j0 + j1 + 1) * k / 2, k]]
  room.forEach((p, i) => { S.P3[`_a${i}`] = p })
  S.faces = null
  S.net = { def: net, t: o.t ?? 0, tD: o.t ?? 0, cols: o.cols }
  S.fitPts = Object.keys(S.P3)
  S.floorGrid = 1
  goodView(S, ...(o.view ?? TOP))
}

/** The view eases in to fit the net folded up (a solid is small on the sheet it was cut from). */
function fitFolded(S: Scene, net: Net) {
  const P = Object.values(foldNet(net, 1)).flat()
  const lo = [0, 1, 2].map(i => Math.min(...P.map(p => p[i]))), hi = [0, 1, 2].map(i => Math.max(...P.map(p => p[i])))
  const m = 0.6 * Math.max(hi[0] - lo[0], hi[1] - lo[1])
  const box: V3[] = [[lo[0] - m, lo[1] - m, 0], [hi[0] + m, lo[1] - m, 0], [lo[0] - m, hi[1] + m, 0], [hi[0] + m, hi[1] + m, 0], [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, hi[2]]]
  box.forEach((p, i) => { S.P3[`_f${i}`] = p })
  S.fitPts = box.map((_, i) => `_f${i}`)
}

/** The squares next to a net (inside the area) where a face can be added. */
function candidates(cells: Cell[], area: [number, number, number, number]): Cell[] {
  const has = new Set(cells.map(c => `${c[0]},${c[1]}`)), out: Cell[] = []
  for (const [i, j] of cells) for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n: Cell = [i + di, j + dj]
    if (n[0] < area[0] || n[0] > area[2] || n[1] < area[1] || n[1] > area[3] || has.has(`${n[0]},${n[1]}`)) continue
    has.add(`${n[0]},${n[1]}`)
    out.push(n)
  }
  return out
}

/** Whether squares are all joined edge to edge. */
function joinedUp(cells: Cell[]): boolean {
  if (!cells.length) return true
  const has = new Set(cells.map(c => `${c[0]},${c[1]}`)), seen = new Set<string>([`${cells[0][0]},${cells[0][1]}`]), stack = [cells[0]]
  while (stack.length) {
    const [i, j] = stack.pop()!
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const key = `${i + di},${j + dj}`
      if (has.has(key) && !seen.has(key)) { seen.add(key); stack.push([i + di, j + dj]) }
    }
  }
  return seen.size === cells.length
}

/**
 * Make a cube's net: tap a square next to the net to add a face there, tap a
 * face to take it off (if the rest stay joined). With six it folds up by
 * itself: faces that land on the same side turn pink and it opens out again.
 * Done when it folds into a cube. Kept: the student's net, for the next beat.
 */
function makeBeat(id: string, text: string, o: { k: number; area: [number, number, number, number]; start: Cell }): Beat {
  return {
    id, say: text,
    enter: S => {
      let cells: Cell[] = [o.start]
      let folding = false
      const show = (S2: Scene) => {
        netBoard0(S2, netFromCells(cells, o.k), { k: o.k, area: o.area })
        S2.netEdit = { k: o.k, cand: cells.length < 6 ? candidates(cells, o.area) : [] }
        S2.mode = "tapFloor"
        S2.onFloor = onFloor
        S2.eqFn = null
      }
      const fold = (S2: Scene) => {
        folding = true
        S2.netEdit = { k: o.k, cand: [] }
        goodView(S2, ...SIDE)
        const room = [...(S2.fitPts ?? [])]
        fitFolded(S2, S2.net!.def)
        S2.acts.push({ dur: 0.6 }, { dur: 2.4, run: (S3, e) => { if (S3.net) S3.net.t = e } }, {
          dur: 0.4,
          end: S3 => {
            const bad = clashes(S3.net!.def)
            if (!bad.length) {
              S3.net!.cols = Object.fromEntries(S3.net!.def.faces.map(f => [f.id, GREEN]))
              S3.flashGood = 1
              S3.got.add("done")
              S3.keep.netN = cells.length
              cells.forEach((c, i) => { S3.keep[`net${i}i`] = c[0]; S3.keep[`net${i}j`] = c[1] })
              say(S3, "It folds into a cube.", "calm", 600)
              return
            }
            S3.net!.cols = Object.fromEntries(bad.map(f => [f, PINK]))
            say(S3, "Two faces land in the same place. Tap a face to take it off, and try another square.", "wrong", 6)
            // it opens out again, its clashing faces still pink, ready to change
            S3.acts.push({ dur: 1.6 }, { dur: 1.8, begin: S4 => { goodView(S4, ...TOP); S4.fitPts = room }, run: (S4, e) => { if (S4.net) S4.net.t = 1 - e } }, { dur: 0.1, end: S4 => { folding = false; S4.netEdit = { k: o.k, cand: [] } } })
          },
        })
      }
      const onFloor = (S2: Scene, w: [number, number]) => {
        if (folding || S2.got.has("done")) return
        const c: Cell = [Math.floor(w[0] / o.k), Math.floor(w[1] / o.k)]
        const at = cells.findIndex(x => x[0] === c[0] && x[1] === c[1])
        if (at >= 0) {
          const rest = cells.filter((_, i) => i !== at)
          if (!rest.length) return
          if (!joinedUp(rest)) { say(S2, "That would split the net in two. Take off a face at an end.", "wrong", 3.6); return }
          cells = rest
        } else {
          if (cells.length >= 6) return
          if (!candidates(cells, o.area).some(x => x[0] === c[0] && x[1] === c[1])) { say(S2, "A face must join the net along a whole side.", "wrong", 3.2); return }
          cells = [...cells, c]
        }
        const cols = S2.net?.cols
        show(S2)
        // pink faces stay pink until the net is six faces again
        if (cols && cells.length < 6) S2.net!.cols = Object.fromEntries(Object.entries(cols).filter(([fid]) => S2.net!.def.faces.some(f => f.id === fid)))
        if (cells.length === 6) S2.timers.push({ at: S2.time + 0.7, fn: fold })
      }
      show(S)
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 2600,
  }
}

/** The student's net from the beat before (or a cross, opened cold). */
function keptNet(S: Scene): Cell[] {
  if (S.keep.netN !== 6) return CROSS
  return Array.from({ length: 6 }, (_, i) => [S.keep[`net${i}i`], S.keep[`net${i}j`]] as Cell)
}

/** The eleven nets of a cube, as squares (each a 1-4-1, 2-3-1, 2-2-2 or 3-3 pattern). */
const ELEVEN: Cell[][] = [
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [0, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [2, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [0, 0], [3, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [1, 2]],
  [[0, 1], [1, 1], [2, 1], [3, 1], [1, 0], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [1, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [2, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [3, 1], [3, 2]],
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
]
/** All eleven laid out side by side (4 a row), faces 1 cm, each its own net. */
function elevenNet(): Net {
  const faces: Net["faces"] = []
  ELEVEN.forEach((cells, n) => {
    const ox = (n % 4) * 6, oy = -Math.floor(n / 4) * 4.5
    const net = netFromCells(cells, 1)
    for (const f of net.faces) faces.push({ ...f, id: `${n}-${f.id}`, parent: f.parent ? `${n}-${f.parent}` : undefined, flat: f.flat.map(p => [p[0] + ox, p[1] + oy]) })
  })
  return { faces }
}

// ── 4024/21/O/N/25 Q3: the cuboid's net, its faces in pairs ──────────────

/** The net's faces in their pairs (3 by 4.7, 5.2 by 4.7, 3 by 5.2), coloured. */
const BLUES = { mid: BLUE, end: BLUE }, ORANGES = { right: ORANGE, left: ORANGE }, PINKS = { top: PINK, bottom: PINK }
const PAIRS: Record<string, string> = { ...BLUES, ...ORANGES, ...PINKS }
/** Its lengths as the paper writes them: 3 across the top face's top, 5.2 down its side, 4.7 down the right-hand face. */
const PAPER: NetLab[] = [
  { key: "pa", face: "top", i: 3, j: 2, tex: "3" },
  { key: "pb", face: "top", i: 1, j: 2, tex: "5.2" },
  { key: "ph", face: "right", i: 1, j: 2, tex: "4.7" },
]
/** The areas found so far, written on their faces. */
const FOUND = { blue: ["mid", "end"], orange: ["right", "left"], pink: ["top", "bottom"] } as const
const AREAS = { blue: "14.1", orange: "24.44", pink: "15.6" }
/** The cuboid's net flat on squared paper, its pairs coloured as far as asked, the areas found so far on their faces. */
function w25Board(S: Scene, cols: Record<string, string> = {}, found: (keyof typeof FOUND)[] = []) {
  const tags: Record<string, string> = {}
  for (const k of found) for (const f of FOUND[k]) tags[f] = onFace(AREAS[k])
  netBoard(S, w25Net(), { t: 0, cols, labs: PAPER, tags, flat: TOP })
  S.floorGrid = 1
}
const cm2 = (v: string) => `${v}\\text{ cm}^2`
/** An area written on a face: the number over its unit, so it fits a narrow face. */
const onFace = (v: string) => `\\begin{array}{c}${v}\\\\[-3pt]\\text{cm}^2\\end{array}`
/** A face area typed on the calculator keys; once right it is written on both faces of the pair. */
function pairAsk(id: string, text: string, what: keyof typeof FOUND, o: { cols: Record<string, string>; found: (keyof typeof FOUND)[]; col: string; answer: number; typed: string; sf: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[] }): Beat {
  return askBeat(id, text, S => { w25Board(S, o.cols, o.found); S.keyRows = 3; look(S, ["eq", "keypad"]) }, {
    name: `\\text{${what[0].toUpperCase()}${what.slice(1)}}`, col: o.col, answer: o.answer, shown: cm2(AREAS[what]), typed: o.typed, sf: o.sf, after: "\\text{ cm}^2",
    slips: o.slips, walk: o.walk,
    then: S => tagFaces(S, [...FOUND[what]], onFace(AREAS[what])),
  })
}

// ── 4024/12/M/J/25 Q3: one face of a cube, 9 cm² ─────────────────────────

/** The one face (3 cm square, on squared paper), its area written in it; its sides `?` until found. */
function faceBoard(S: Scene, sides?: string) {
  netBoard0(S, netFromCells([[1, 1]], 3), { k: 3, area: [1, 1, 1, 1], cols: { c1_1: BLUE } })
  S.tags = [{ key: "area", at: [4.5, 4.5, 0], tex: "9\\text{ cm}^2", col: GREEN }]
  if (sides) {
    Object.assign(S.P3, { s0: [3, 3, 0], s1: [6, 3, 0], s2: [6, 6, 0] } as Record<string, V3>)
    S.lens[segKey("s0", "s1")] = lens(sides, sides === "?" ? PINK : GREEN)
    S.lens[segKey("s1", "s2")] = lens(sides, sides === "?" ? PINK : GREEN)
  }
}

// ── the lesson ───────────────────────────────────────────────────────────

const AREA: [number, number, number, number] = [-1, -1, 4, 3]

const PART_1: Beat[] = [
  watch("net-hi", "This is the net of a cube, drawn on squared paper.", S => { netBoard0(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2] }); look(S) }, 2.6),
  {
    id: "fold",
    say: "Let's fold it up.",
    enter: S => {
      netBoard0(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2] })
      S.acts.push({ dur: 0.5, begin: S2 => { goodView(S2, ...SIDE); fitFolded(S2, S2.net!.def) } }, { dur: 2.6, run: (S2, e) => { if (S2.net) S2.net.t = e } })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  watch("six", "Six squares make the six faces of the cube.", S => { netBoard0(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2], t: 1, view: SIDE }); fitFolded(S, S.net!.def); look(S) }, 2.4),
  makeBeat("make", "Now make your own. Tap a square next to this face to add one.", { k: 2, area: AREA, start: [1, 1] }),
  {
    id: "not-every",
    say: "Not every six squares fold into a cube.",
    enter: S => {
      const block: Cell[] = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]
      netBoard0(S, netFromCells(block, 2), { k: 2, area: [0, 0, 2, 1] })
      S.acts.push({ dur: 0.6, begin: S2 => { goodView(S2, ...SIDE); fitFolded(S2, S2.net!.def) } }, { dur: 2.4, run: (S2, e) => { if (S2.net) S2.net.t = e } }, { dur: 0.1, end: S2 => { if (S2.net) S2.net.cols = Object.fromEntries(clashes(S2.net.def).map(f => [f, PINK])) } })
      look(S)
    },
    cta: "", ctaAfter: 3.8,
  },
  watch("eleven", "A cube has $11$ different nets.", S => { netBoard0(S, elevenNet(), { k: 1, area: [0, -9, 23, 3] }); look(S) }, 3.0),
]

const PART_2: Beat[] = [
  // 4024/12/M/J/25 Q3
  watch("s25", "The area of one face of a cube is $9$ cm$^2$.", S => { faceBoard(S); look(S) }, 2.6),
  askBeat("s25-side", "How long is each side of the face?", S => { faceBoard(S, "?"); S.keyRows = 3; look(S, ["eq", "keypad"]) }, {
    name: "\\text{Side}", col: BLUE, answer: 3, shown: "3\\text{ cm}", typed: "3", exact: true, after: "\\text{ cm}",
    slips: [{ v: 9, say: "That's the area. What length times itself makes $9$?" }, { v: 4.5, say: "That's half of $9$. What length times itself makes $9$?" }],
    walk: [
      { say: "The face is a square, so its sides are the same length.", show: S => { S.edgeGlow = { [segKey("s0", "s1")]: PINK, [segKey("s1", "s2")]: PINK } } },
      { say: "Its area, $9$, is the side times itself. What times itself makes $9$?", tex: "{?} \\times {?} = 9", show: S => { S.edgeGlow = {}; S.tags = S.tags.map(t => ({ ...t, pulse: true })) } },
    ],
    then: S => { S.lens[segKey("s0", "s1")] = lens("3\\text{ cm}", GREEN); S.lens[segKey("s1", "s2")] = lens("3\\text{ cm}", GREEN) },
  }),
  makeBeat("s25-draw", "Draw a net of the cube on the $1$ cm grid. Each face is $3$ cm square.", { k: 3, area: [-1, -1, 3, 2], start: [1, 1] }),
  watch("s25-done", "It folds into the cube, each edge $3$ cm.", S => {
    const cells = keptNet(S)
    netBoard0(S, netFromCells(cells, 3), { k: 3, area: [-1, -1, 3, 2], t: 1, view: SIDE, cols: Object.fromEntries(cells.map(c => [`c${c[0]}_${c[1]}`, GREEN])) })
    fitFolded(S, S.net!.def)
    look(S)
  }, 2.6),
]

const PART_3: Beat[] = [
  // 4024/21/O/N/25 Q3(a)
  watch("w25", "This is the net of a cuboid. All the lengths are in cm.", S => { w25Board(S); look(S) }, 2.8),
  {
    id: "w25-fold",
    say: "Its faces come in pairs of the same size.",
    enter: S => {
      // it folds up, and the pairs are seen opposite each other (the paper's lengths stay on the flat drawing)
      netBoard(S, w25Net(), { t: 0, cols: PAIRS, flat: TOP })
      S.floorGrid = 1
      unfold(S, 1, 2.6, 0.8)
      look(S)
    },
    cta: "", ctaAfter: 4.0,
  },
  pairAsk("w25-blue", "What is the area of one blue face?", "blue", {
    cols: BLUES, found: [], col: BLUE, answer: 14.1, typed: "3*4.7", sf: 3,
    slips: [{ v: 7.7, say: "That adds the sides. Area is length times width." }],
    walk: [
      { say: "A blue face is as wide as the top face above it: $3$.", show: S => { glowFaces(S, ["mid", "end"]); glowEdges(S, ["pa"], BLUE); addLab(S, { key: "mw", face: "mid", i: 0, j: 1, tex: "3", col: BLUE }) } },
      { say: "And as tall as the face beside it: $4.7$.", tex: "3 \\times 4.7", show: S => { glowEdges(S, ["ph"], BLUE); addLab(S, { key: "mh", face: "mid", i: 3, j: 0, tex: "4.7", col: BLUE }) } },
    ],
  }),
  pairAsk("w25-orange", "And one orange face?", "orange", {
    cols: { ...BLUES, ...ORANGES }, found: ["blue"], col: ORANGE, answer: 24.44, typed: "5.2*4.7", sf: 4,
    slips: [{ v: 9.9, say: "That adds the sides. Area is length times width." }],
    walk: [
      { say: "An orange face is $4.7$ tall, written on its side.", show: S => { glowFaces(S, ["right", "left"]); glowEdges(S, ["ph"], ORANGE) } },
      { say: "It's as wide as the top face's side: $5.2$.", tex: "5.2 \\times 4.7", show: S => { glowEdges(S, ["pb"], ORANGE); addLab(S, { key: "ow", face: "right", i: 0, j: 1, tex: "5.2", col: ORANGE }) } },
    ],
  }),
  pairAsk("w25-pink", "And one pink face?", "pink", {
    cols: PAIRS, found: ["blue", "orange"], col: PINK, answer: 15.6, typed: "3*5.2", sf: 3,
    slips: [{ v: 8.2, say: "That adds the sides. Area is length times width." }],
    walk: [{ say: "The top face is pink. Its sides are written on it: $3$ by $5.2$.", tex: "3 \\times 5.2", show: S => { glowFaces(S, ["top", "bottom"]); glowEdges(S, ["pa", "pb"], PINK) } }],
  }),
  askBeat("w25-total", "So what is the total surface area of the cuboid?", S => { w25Board(S, PAIRS, ["blue", "orange", "pink"]); S.keyRows = 3; look(S, ["eq", "keypad"]) }, {
    name: "\\text{Total}", col: GREEN, answer: 108.28, shown: "108.28\\text{ cm}^2", typed: "2*14.1+2*24.44+2*15.6", sf: 3, after: "\\text{ cm}^2",
    slips: [{ v: 54.14, say: "That's one of each. There are two of each colour." }, { v: 54.1, say: "That's one of each. There are two of each colour." }],
    walk: [
      { say: "Two blue faces, $14.1$ each.", show: S => glowFaces(S, ["mid", "end"]) },
      { say: "Two orange faces, $24.44$ each.", show: S => glowFaces(S, ["right", "left"]) },
      { say: "Two pink faces, $15.6$ each. Add all six.", tex: "2 \\times 14.1 + 2 \\times 24.44 + 2 \\times 15.6", show: S => glowFaces(S, ["top", "bottom"]) },
    ],
  }),
  {
    id: "end",
    say: "In summary, a net is the faces of a solid laid flat. Its total area is the solid's surface area.",
    enter: S => { w25Board(S, PAIRS, ["blue", "orange", "pink"]); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3]

applyParts(BEATS, [
  ["net-hi", "Nets on squared paper"],
  ["s25", "A net to size"],
  ["w25", "Surface area from a net"],
])

