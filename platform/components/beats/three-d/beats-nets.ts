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

/** The floor seen from straight above (the net as a drawing on squared paper), and leaning back to watch it fold. */
const TOP: [number, number] = [0, 89]
const SIDE: [number, number] = [-30, 32]

type Cell = [number, number]
/** A cross: the net of a cube most people draw first. */
const CROSS: Cell[] = [[1, 1], [0, 1], [2, 1], [3, 1], [1, 0], [1, 2]]

/** A net on the floor: the view fits round `area` (cells of `k` cm, as [i0, j0, i1, j1]), so it holds still while faces come and go. */
function netBoard(S: Scene, net: Net, o: { k: number; area: [number, number, number, number]; t?: number; view?: [number, number]; cols?: Record<string, string> }) {
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
        netBoard(S2, netFromCells(cells, o.k), { k: o.k, area: o.area })
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
const PAIRS: Record<string, string> = { mid: BLUE, end: BLUE, right: ORANGE, left: ORANGE, top: PINK, bottom: PINK }
/** Points at the net's corners, so its lengths can be written on it (flat on the floor). */
function w25Labels(S: Scene, which: ("a" | "b" | "h")[] = ["a", "b", "h"]) {
  const a = 3, b = 5.2, h = 4.7, x = -a / 2, y = -h / 2
  // as the paper writes them: 3 across the top face's top, 5.2 down its side, 4.7 down the right-hand face
  Object.assign(S.P3, { tA: [x, y + h + b, 0], tB: [x + a, y + h + b, 0], mB: [x + a, y + h, 0], r1: [x + a + b, y, 0], r2: [x + a + b, y + h, 0] } as Record<string, V3>)
  if (which.includes("a")) S.lens[segKey("tA", "tB")] = lens("3")
  if (which.includes("b")) S.lens[segKey("mB", "tB")] = lens("5.2")
  if (which.includes("h")) S.lens[segKey("r1", "r2")] = lens("4.7")
}
function w25Board(S: Scene, cols?: Record<string, string>) {
  netBoard(S, w25Net(), { k: 1, area: [-10, -8, 6, 7], cols })
  w25Labels(S)
}
const areaWalk = (what: string, l: string, w: string): WalkStep<Scene>[] => [
  { say: `Each ${what} face is a rectangle, $${l}$ by $${w}$.` },
  { say: "Its area is its length times its width.", tex: `${l} \\times ${w}` },
]

// ── the lesson ───────────────────────────────────────────────────────────

const AREA: [number, number, number, number] = [-1, -1, 4, 3]

const PART_1: Beat[] = [
  watch("net-hi", "This is the net of a cube, drawn on squared paper.", S => { netBoard(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2] }); look(S) }, 2.6),
  {
    id: "fold",
    say: "Let's fold it up.",
    enter: S => {
      netBoard(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2] })
      S.acts.push({ dur: 0.5, begin: S2 => { goodView(S2, ...SIDE); fitFolded(S2, S2.net!.def) } }, { dur: 2.6, run: (S2, e) => { if (S2.net) S2.net.t = e } })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  watch("six", "Six squares make the six faces of the cube.", S => { netBoard(S, netFromCells(CROSS, 2), { k: 2, area: [0, 0, 3, 2], t: 1, view: SIDE }); fitFolded(S, S.net!.def); look(S) }, 2.4),
  makeBeat("make", "Now make your own. Tap a square next to this face to add one.", { k: 2, area: AREA, start: [1, 1] }),
  {
    id: "not-every",
    say: "Not every six squares fold into a cube.",
    enter: S => {
      const block: Cell[] = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]
      netBoard(S, netFromCells(block, 2), { k: 2, area: [0, 0, 2, 1] })
      S.acts.push({ dur: 0.6, begin: S2 => { goodView(S2, ...SIDE); fitFolded(S2, S2.net!.def) } }, { dur: 2.4, run: (S2, e) => { if (S2.net) S2.net.t = e } }, { dur: 0.1, end: S2 => { if (S2.net) S2.net.cols = Object.fromEntries(clashes(S2.net.def).map(f => [f, PINK])) } })
      look(S)
    },
    cta: "", ctaAfter: 3.8,
  },
  watch("eleven", "A cube has $11$ different nets.", S => { netBoard(S, elevenNet(), { k: 1, area: [0, -9, 23, 3] }); look(S) }, 3.0),
]

const PART_2: Beat[] = [
  // 4024/12/M/J/25 Q3
  watch("s25", "The area of one face of a cube is $9$ cm$^2$.", S => {
    netBoard(S, netFromCells([[1, 1]], 3), { k: 3, area: [-1, -1, 3, 2], cols: { c1_1: BLUE } })
    look(S)
  }, 2.6),
  askBeat("s25-side", "How long is each side of the face?", S => { netBoard(S, netFromCells([[1, 1]], 3), { k: 3, area: [-1, -1, 3, 2], cols: { c1_1: BLUE } }); S.keyRows = 4; look(S, ["eq", "keypad"]) }, {
    name: "\\text{Side}", col: BLUE, answer: 3, shown: "3\\text{ cm}", typed: "3",
    slips: [{ v: 9, say: "That's the area. What length times itself makes $9$?" }, { v: 4.5, say: "That's half of $9$. What length times itself makes $9$?" }],
    walk: [
      { say: "The face is a square, so its sides are the same length." },
      { say: "Its area is the side times itself. What times itself makes $9$?", tex: "? \\times ? = 9" },
    ],
  }),
  makeBeat("s25-draw", "Draw a net of the cube on the $1$ cm grid. Each face is $3$ cm square.", { k: 3, area: [-1, -1, 3, 2], start: [1, 1] }),
  watch("s25-done", "It folds into the cube, each edge $3$ cm.", S => {
    const cells = keptNet(S)
    netBoard(S, netFromCells(cells, 3), { k: 3, area: [-1, -1, 3, 2], t: 1, view: SIDE, cols: Object.fromEntries(cells.map(c => [`c${c[0]}_${c[1]}`, GREEN])) })
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
      w25Board(S, PAIRS)
      // it folds up, and the pairs are seen opposite each other
      S.acts.push({ dur: 0.8, begin: S2 => { goodView(S2, ...SIDE); for (const n of ["tA", "tB", "mB", "r1", "r2"]) delete S2.P3[n]; S2.lens = {}; fitFolded(S2, S2.net!.def) } }, { dur: 2.6, run: (S2, e) => { if (S2.net) S2.net.t = e } })
      look(S)
    },
    cta: "", ctaAfter: 4.0,
  },
  askBeat("w25-blue", "What is the area of one blue face?", S => { w25Board(S, { mid: BLUE, end: BLUE }); look(S, ["eq", "keypad"]) }, {
    name: "\\text{Blue}", col: BLUE, answer: 14.1, shown: "14.1", typed: "3*4.7", sf: 3,
    walk: areaWalk("blue", "3", "4.7"),
  }),
  askBeat("w25-orange", "And one orange face?", S => { w25Board(S, { mid: BLUE, end: BLUE, right: ORANGE, left: ORANGE }); look(S, ["eq", "keypad"]) }, {
    name: "\\text{Orange}", col: ORANGE, answer: 24.44, shown: "24.44", typed: "5.2*4.7", sf: 4,
    walk: areaWalk("orange", "5.2", "4.7"),
  }),
  askBeat("w25-pink", "And one pink face?", S => { w25Board(S, PAIRS); look(S, ["eq", "keypad"]) }, {
    name: "\\text{Pink}", col: PINK, answer: 15.6, shown: "15.6", typed: "3*5.2", sf: 3,
    walk: areaWalk("pink", "3", "5.2"),
  }),
  askBeat("w25-total", "So what is the total surface area of the cuboid?", S => { w25Board(S, PAIRS); look(S, ["eq", "keypad"]) }, {
    name: "\\text{Total}", col: GREEN, answer: 108.28, shown: "108.28\\text{ cm}^2", typed: "2*14.1+2*24.44+2*15.6", sf: 3,
    slips: [{ v: 54.14, say: "That's one of each. There are two of each colour." }, { v: 54.1, say: "That's one of each. There are two of each colour." }],
    walk: [
      { say: "There are two faces of each colour." },
      { say: "So add one of each, and double it.", tex: "2 \\times (14.1 + 24.44 + 15.6)" },
    ],
  }),
  {
    id: "end",
    say: "In summary, a net is the faces of a solid laid flat. Its total area is the solid's surface area.",
    enter: S => { w25Board(S, PAIRS); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3]

applyParts(BEATS, [
  ["net-hi", "Nets on squared paper"],
  ["s25", "A net to size"],
  ["w25", "Surface area from a net"],
])

