/**
 * Units of measure (5.1), one tiny idea per beat, on the 3D board.
 *
 * A metre stick on the floor: 100 cm along it, and, coming close, 10 mm in
 * each cm. A ladder of units: going down to a smaller unit multiplies (there
 * are more of the small ones), going up divides. A 1 cm square splits into
 * 10 by 10 mm squares, so area steps by 100; a square metre is 100 by 100 cm
 * squares. A 1 cm cube holds 1 ml; a 10 cm cube fills with 1000 of them, and
 * holds a litre; a cubic metre holds 1000 litre cubes. Questions from
 * 4024/11/O/N/23 Q8, 4024/12/M/J/24 Q4, 4024/22/M/J/25 Q3(a) and Q5, and
 * 4024/23/M/J/25 Q5.
 *
 * Colours: what is being counted blue, a length read off the stick pink, a
 * total green; down the ladder (×) blue, up it (÷) orange.
 */

import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import { type Scene, type V3, BLUE, PINK, GREEN, resetBeat, goodView, segKey, choose, say } from "./scene"
import { type Beat, look, watch, askBeat, lens } from "./kit"
import type { Ladder, SqGrid } from "./mens"

/** Looking straight down on the floor, and from the side and above (for cubes). */
const TOP: [number, number] = [0, 89]
const SIDE: [number, number] = [-32, 26]

const LENGTH: Ladder = { units: ["\\text{km}", "\\text{m}", "\\text{cm}", "\\text{mm}"], factors: ["1000", "100", "10"] }
const MASS: Ladder = { units: ["\\text{kg}", "\\text{g}"], factors: ["1000"] }
const AREA: Ladder = { units: ["\\text{m}^2", "\\text{cm}^2", "\\text{mm}^2"], factors: ["10\\,000", "100"] }
const CAP: Ladder = { units: ["\\text{m}^3", "\\text{litres}", "\\text{ml} = \\text{cm}^3"], factors: ["1000", "1000"] }

/** A clean board: no solid, no floor grid; points to fit the view round (world, the floor). */
function bare(S: Scene, fit: V3[], view: [number, number] = TOP) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  fit.forEach((p, i) => { S.P3[`_f${i}`] = p })
  S.fitPts = fit.map((_, i) => `_f${i}`)
  S.faces = null
  S.floorGrid = 0
  goodView(S, ...view)
  S.fitRect = view
}

/** The metre stick, the view fitted round cm `a` to cm `b` of it (close up: just its marks and numbers). */
function stickBoard(S: Scene, a = 0, b = 100, o: { marks?: { at: number; col: string; tex?: string }[]; lit?: number; ladder?: Ladder } = {}) {
  const w = 2
  if (b - a < 8) { bare(S, [[a, -0.1, 0], [b, w + 0.8, 0]]); S.fitLeft = true }
  else bare(S, [[a - (b - a) * 0.03, -0.3, 0], [b + (b - a) * 0.03, w + 0.6, 0]])
  S.meter = { x0: 0, y0: 0, len: 100, w, sub: 10, marks: o.marks, lit: o.lit }
  // a long thin stick across the top, the ladder under it; a close-up beside it
  if (o.ladder) { S.ladder = o.ladder; S.splitBelow = b - a >= 8 }
}

/** Squares on the floor, the view fitted round [x0, y0]–[x1, y1]; sides labelled where asked. */
function gridBoard(S: Scene, grids: SqGrid[], box: [number, number, number, number], sides?: { a: V3; b: V3; tex: string }[], ladder?: Ladder) {
  bare(S, [[box[0], box[1], 0], [box[2], box[3], 0]])
  S.sqGrids = grids
  sides?.forEach((sd, i) => { S.P3[`s${i}a`] = sd.a; S.P3[`s${i}b`] = sd.b; S.lens[segKey(`s${i}a`, `s${i}b`)] = lens(sd.tex) })
  if (ladder) S.ladder = ladder
}

/** The eight corners of a box x by y by z from the origin, `pad` further out each way (room for its labels). */
const padCorners = (x: number, y: number, z: number, pad: number): V3[] =>
  [0, 1, 2, 3, 4, 5, 6, 7].map(i => [i & 1 ? x + pad : -pad, i & 2 ? y + pad : -pad, i & 4 ? z + pad : 0])

/** A box of side `n` cm (glass), seen from the side, with points for its edge labels. */
function cubeBoard(S: Scene, n: number, o: { label?: string } = {}) {
  bare(S, padCorners(n, n, n, n * 0.22), SIDE)
  const P: Record<string, V3> = { E: [0, 0, 0], H: [n, 0, 0], G: [n, n, 0], F: [0, n, 0], A: [0, 0, n], D: [n, 0, n], C: [n, n, n], B: [0, n, n] }
  Object.assign(S.P3, P)
  S.faces = [["E", "H", "G", "F"], ["A", "D", "C", "B"], ["E", "H", "D", "A"], ["H", "G", "C", "D"], ["G", "F", "B", "C"], ["F", "E", "A", "B"]]
  if (o.label) { S.lens[segKey("E", "H")] = lens(o.label); S.lens[segKey("H", "G")] = lens(o.label); S.lens[segKey("G", "C")] = lens(o.label) }
}

/** Litre cubes in a row of glass, as many litres of water in them as `L` says (2.5: two full and a half). */
function litresBoard(S: Scene, L: number) {
  const n = Math.ceil(L), full = Math.floor(L), x = 10 * n
  bare(S, padCorners(x, 10, 10, 10 * 0.22), SIDE)
  Object.assign(S.P3, { E: [0, 0, 0], H: [x, 0, 0], G: [x, 10, 0], F: [0, 10, 0], A: [0, 0, 10], D: [x, 0, 10], C: [x, 10, 10], B: [0, 10, 10] } as Record<string, V3>)
  S.faces = [["E", "H", "G", "F"], ["A", "D", "C", "B"], ["E", "H", "D", "A"], ["H", "G", "C", "D"], ["G", "F", "B", "C"], ["F", "E", "A", "B"]]
  S.lens[segKey("H", "G")] = lens("10\\text{ cm}")
  S.lens[segKey("G", "C")] = lens("10\\text{ cm}")
  if (full) S.cubes = [{ o: [0, 0, 0], s: 10, nx: n, ny: 1, nz: 1, count: full, col: BLUE }]
  if (L > full) S.water = { x0: 10 * full, y0: 0, z0: 0, x1: 10 * n, y1: 10, z1: 10, level: L - full, col: BLUE }
}

/** Run a number up over time on the board (a count, a level). */
const count = (S: Scene, dur: number, set: (S: Scene, e: number) => void, wait = 0.6) => S.acts.push({ dur: wait }, { dur, run: (S2, _e, t) => set(S2, t), end: S2 => set(S2, 1) })

/** A number typed: exact, on the mensuration keypad; the board is set by `board`. */
function convert(id: string, text: string, board: (S: Scene) => void, o: { from: string; answer: number; unit: string; slips?: { v: number; say: string }[]; walk: { say: string; tex?: string; show?: (S: Scene) => void }[] }): Beat {
  const unit = `\\text{ ${o.unit}}`
  return askBeat(id, text, S => { board(S); S.keyRows = 3 }, {
    name: o.from, col: BLUE, answer: o.answer, shown: `${String(o.answer).replace(/\B(?=(\d{3})+(?!\d))/g, "\\,")}${unit}`, after: unit, typed: String(o.answer), exact: true, slips: o.slips, walk: o.walk,
  })
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  {
    id: "metre",
    say: "A metre is $100$ cm.",
    enter: S => { stickBoard(S); count(S, 2.6, (S2, e) => { if (S2.meter) S2.meter.lit = 100 * e }); look(S) },
    cta: "", ctaAfter: 3.4,
  },
  {
    id: "cm-mm",
    say: "Each cm has $10$ mm in it.",
    enter: S => {
      stickBoard(S, 0, 3)
      // the mm of the first cm counted, one by one
      const mm = (S2: Scene) => Math.round((S2.meter?.lit ?? 0) * 10)
      S.eqFn = S2 => row([atom("ml", "\\text{mm}"), op("me", "="), atom("mn", String(mm(S2)), { col: mm(S2) >= 10 ? GREEN : undefined })])
      count(S, 2.4, (S2, e) => {
        if (!S2.meter) return
        S2.meter.lit = Math.floor(10 * e) / 10
        if (e >= 1) S2.meter.marks = [{ at: 1, col: BLUE, tex: "1\\text{ cm} = 10\\text{ mm}" }]
      }, 1.0)
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 4.0,
  },
  watch("down", "Going down to a smaller unit, we multiply.", S => { stickBoard(S, 0, 100, { ladder: { ...LENGTH, lit: { from: 1, to: 2 } } }); look(S) }, 2.6),
  watch("why", "A mm is small, so it takes more of them: $1$ cm $= 10$ mm.", S => { stickBoard(S, 0, 3, { marks: [{ at: 1, col: BLUE, tex: "10\\text{ mm}" }], lit: 1, ladder: { ...LENGTH, lit: { from: 2, to: 3 } } }); look(S) }, 3.0),
  watch("up", "Going up to a bigger unit, we divide.", S => { stickBoard(S, 0, 3, { marks: [{ at: 1, col: BLUE, tex: "1\\text{ cm}" }], lit: 1, ladder: { ...LENGTH, lit: { from: 3, to: 2 } } }); look(S) }, 2.6),
  // 4024/11/O/N/23 Q8(a)
  convert("w23-78", "Convert $78$ mm to cm.", S => stickBoard(S, 0, 10, { marks: [{ at: 7.8, col: PINK, tex: "78\\text{ mm}" }], ladder: LENGTH }), {
    from: "78\\text{ mm}", answer: 7.8, unit: "cm",
    slips: [
      { v: 780, say: "That's multiplying. A cm is bigger than a mm, so there are fewer of them: divide." },
      { v: 0.78, say: "That's $\\div 100$. There are $10$ mm in a cm." },
    ],
    walk: [
      { say: "mm to cm is one step up the ladder: divide by $10$.", tex: "78 \\div 10", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 3, to: 2 } } } },
      { say: "On the stick, $78$ mm is just short of the $8$ cm mark." },
    ],
  }),
  // 4024/23/M/J/25 Q5(a)
  convert("s25-63", "Write $6300$ cm in metres.", S => stickBoard(S, 0, 100, { ladder: LENGTH }), {
    from: "6300\\text{ cm}", answer: 63, unit: "m",
    slips: [
      { v: 630000, say: "That's multiplying. A metre is bigger than a cm, so there are fewer of them: divide." },
      { v: 630, say: "That's $\\div 10$. There are $100$ cm in a metre." },
      { v: 6.3, say: "That's $\\div 1000$. There are $100$ cm in a metre." },
    ],
    walk: [{ say: "cm to m is one step up the ladder: divide by $100$.", tex: "6300 \\div 100", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 2, to: 1 } } } }],
  }),
  // 4024/12/M/J/24 Q4(a)
  convert("s24-kg", "Convert $4$ kg to grams.", S => { bare(S, []); S.ladder = MASS }, {
    from: "4\\text{ kg}", answer: 4000, unit: "g",
    slips: [
      { v: 0.004, say: "That's dividing. Grams are much smaller, so there are more of them." },
      { v: 400, say: "There are $1000$ g in a kg." },
    ],
    walk: [{ say: "kg to g is down the ladder: multiply by $1000$.", tex: "4 \\times 1000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 0, to: 1 } } } }],
  }),
]

/** The 1 cm square, split into mm squares as far as `n` says, `lit` of them counted. */
const cmSquare = (n: number, lit: number, tex?: string): SqGrid => ({ x0: 0, y0: 0, size: 1, n, col: BLUE, lit, lines: n > 1, tex })
const CM_BOX: [number, number, number, number] = [-0.7, -0.7, 1.7, 1.7]
const cmSides = (tex: string) => [{ a: [0, 0, 0] as V3, b: [1, 0, 0] as V3, tex }, { a: [1, 0, 0] as V3, b: [1, 1, 0] as V3, tex }]
/** The square metre, 100 by 100 cm squares. */
const mSquare = (lit: number, tex?: string): SqGrid => ({ x0: 0, y0: 0, size: 100, n: 100, col: BLUE, lit, lines: true, tex })
const M_BOX: [number, number, number, number] = [-18, -18, 118, 118]
const mSides = [{ a: [0, 0, 0] as V3, b: [100, 0, 0] as V3, tex: "100\\text{ cm}" }, { a: [100, 0, 0] as V3, b: [100, 100, 0] as V3, tex: "100\\text{ cm}" }]

const PART_2: Beat[] = [
  watch("cm2", "This square is $1$ cm by $1$ cm. Its area is $1$ cm$^2$.", S => { gridBoard(S, [cmSquare(1, 1, "1\\text{ cm}^2")], CM_BOX, cmSides("1\\text{ cm}")); look(S) }, 3.0),
  {
    id: "mm2",
    say: "How many mm$^2$ fit inside it?",
    enter: S => {
      gridBoard(S, [cmSquare(1, 0)], CM_BOX, cmSides("1\\text{ cm}"))
      choose(S, ["$10$", "$100$"], 1, true, (S2, _k, right) => {
        if (right) say(S2, "Yes. Let's count them.", "calm", 2.4)
        // it splits into 10 by 10 mm squares, counted row by row
        S2.sqGrids = [cmSquare(10, 0)]
        S2.lens = {}
        cmSides("10\\text{ mm}").forEach((sd, i) => { S2.lens[segKey(`s${i}a`, `s${i}b`)] = lens(sd.tex) })
        count(S2, 3.0, (S3, e) => { const k = Math.round(100 * e); S3.sqGrids = [cmSquare(10, k, `${k}`)]; if (e >= 1) S3.got.add("done") }, 0.4)
      })
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2400,
  },
  watch("x100", "It's $10$ rows of $10$, so $10 \\times 10 = 100$ mm$^2$.", S => { gridBoard(S, [cmSquare(10, 100, "100\\text{ mm}^2")], CM_BOX, cmSides("10\\text{ mm}")); look(S) }, 3.0),
  {
    id: "m2",
    say: "A square metre is $100$ by $100$ cm squares.",
    enter: S => {
      gridBoard(S, [mSquare(0)], M_BOX, mSides)
      count(S, 3.4, (S2, e) => { const k = Math.round(10000 * e); S2.sqGrids = [mSquare(k, e >= 1 ? "10\\,000\\text{ cm}^2" : `${k}`.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,"))] }, 0.8)
      look(S)
    },
    cta: "", ctaAfter: 4.6,
  },
  watch("area-ladder", "So m$^2$ to cm$^2$ is $\\times 10\\,000$, and cm$^2$ to mm$^2$ is $\\times 100$.", S => { gridBoard(S, [mSquare(10000, "10\\,000\\text{ cm}^2")], M_BOX, mSides, AREA); look(S) }, 3.0),
  // 4024/22/M/J/25 Q5
  convert("s25-61", "Convert $6.1$ m$^2$ to cm$^2$.", S => gridBoard(S, [mSquare(10000, "1\\text{ m}^2")], M_BOX, mSides, AREA), {
    from: "6.1\\text{ m}^2", answer: 61000, unit: "cm}^2\\text{",
    slips: [
      { v: 610, say: "That's $\\times 100$. A square metre is $100$ by $100$ cm squares, so it's $\\times 10\\,000$." },
      { v: 6100, say: "That's $\\times 1000$. A square metre is $100$ by $100$ cm squares, so it's $\\times 10\\,000$." },
    ],
    walk: [{ say: "m$^2$ to cm$^2$ is down the ladder: multiply by $10\\,000$.", tex: "6.1 \\times 10\\,000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 0, to: 1 } } } }],
  }),
  // 4024/11/O/N/23 Q8(b)
  convert("w23-3", "Convert $3$ m$^2$ to cm$^2$.", S => gridBoard(S, [mSquare(10000, "1\\text{ m}^2")], M_BOX, mSides, AREA), {
    from: "3\\text{ m}^2", answer: 30000, unit: "cm}^2\\text{",
    slips: [{ v: 300, say: "That's $\\times 100$. A square metre is $100$ by $100$ cm squares." }, { v: 3000, say: "That's $\\times 1000$. A square metre is $100$ by $100$ cm squares." }],
    walk: [{ say: "Down the ladder from m$^2$ to cm$^2$: multiply by $10\\,000$.", tex: "3 \\times 10\\,000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 0, to: 1 } } } }],
  }),
]

/** The count of cubes under the figure. */
const cubesLine = (S: Scene) => { S.eqFn = S2 => row([atom("cl", "\\text{Cubes}"), op("ce", "="), atom("cn", String(S2.cubes[0]?.count ?? 0), { col: (S2.cubes[0]?.count ?? 0) >= 1000 ? GREEN : undefined })]) }

const PART_3: Beat[] = [
  watch("cm3", "This cube is $1$ cm each way. Its volume is $1$ cm$^3$.", S => { cubeBoard(S, 1, { label: "1\\text{ cm}" }); S.cubes = [{ o: [0, 0, 0], s: 1, nx: 1, ny: 1, nz: 1, count: 1, col: BLUE }]; look(S) }, 3.0),
  {
    id: "ml",
    say: "It holds $1$ ml of water.",
    enter: S => { cubeBoard(S, 1, { label: "1\\text{ cm}" }); S.water = { x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1, level: 0, col: BLUE }; count(S, 2.0, (S2, e) => { if (S2.water) S2.water.level = e }); look(S) },
    cta: "", ctaAfter: 3.0,
  },
  {
    id: "thousand",
    say: "A cube $10$ cm each way holds $1000$ of them.",
    enter: S => {
      cubeBoard(S, 10, { label: "10\\text{ cm}" })
      S.cubes = [{ o: [0, 0, 0], s: 1, nx: 10, ny: 10, nz: 10, count: 0, col: BLUE }]
      cubesLine(S)
      count(S, 4.4, (S2, e) => { if (S2.cubes[0]) S2.cubes[0].count = Math.round(1000 * e) })
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 5.4,
  },
  {
    id: "litre",
    say: "That's $1000$ ml of water, which is $1$ litre.",
    enter: S => {
      cubeBoard(S, 10, { label: "10\\text{ cm}" })
      S.water = { x0: 0, y0: 0, z0: 0, x1: 10, y1: 10, z1: 10, level: 0, col: BLUE }
      S.eqFn = () => atom("eq1", "1000\\text{ cm}^3 = 1000\\text{ ml} = 1\\text{ litre}")
      count(S, 2.4, (S2, e) => { if (S2.water) S2.water.level = e })
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.4,
  },
  {
    id: "m3",
    say: "A cubic metre is $100$ cm each way. It holds $1000$ of those litre cubes.",
    enter: S => {
      cubeBoard(S, 100, { label: "100\\text{ cm}" })
      S.cubes = [{ o: [0, 0, 0], s: 10, nx: 10, ny: 10, nz: 10, count: 0, col: BLUE }]
      S.eqFn = S2 => row([atom("ll", "\\text{Litres}"), op("le", "="), atom("ln", String(S2.cubes[0]?.count ?? 0), { col: (S2.cubes[0]?.count ?? 0) >= 1000 ? GREEN : undefined })])
      count(S, 4.4, (S2, e) => { if (S2.cubes[0]) S2.cubes[0].count = Math.round(1000 * e) })
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 5.4,
  },
  watch("cap-ladder", "So m$^3$ to litres is $\\times 1000$, and litres to ml is $\\times 1000$ too.", S => {
    cubeBoard(S, 100, { label: "100\\text{ cm}" })
    S.cubes = [{ o: [0, 0, 0], s: 10, nx: 10, ny: 10, nz: 10, count: 1000, col: BLUE }]
    S.ladder = CAP
    look(S)
  }, 3.4),
  // 4024/12/M/J/24 Q4(b)
  convert("s24-250", "Convert $250$ cm$^3$ to litres.", S => { cubeBoard(S, 10, { label: "10\\text{ cm}" }); S.water = { x0: 0, y0: 0, z0: 0, x1: 10, y1: 10, z1: 10, level: 0.25, col: BLUE }; S.ladder = CAP }, {
    from: "250\\text{ cm}^3", answer: 0.25, unit: "litres",
    slips: [
      { v: 250000, say: "That's multiplying. A litre is bigger than a cm$^3$: divide." },
      { v: 2.5, say: "That's $\\div 100$. A litre is $1000$ cm$^3$." },
      { v: 25, say: "That's $\\div 10$. A litre is $1000$ cm$^3$." },
    ],
    walk: [
      { say: "cm$^3$ is the same as ml. Up the ladder to litres: divide by $1000$.", tex: "250 \\div 1000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 2, to: 1 } } } },
      { say: "The cube is a litre. $250$ cm$^3$ fills a quarter of it." },
    ],
  }),
  // 4024/23/M/J/25 Q5(b)
  convert("s25-450", "Write $450$ cm$^3$ in litres.", S => { cubeBoard(S, 10, { label: "10\\text{ cm}" }); S.water = { x0: 0, y0: 0, z0: 0, x1: 10, y1: 10, z1: 10, level: 0.45, col: BLUE }; S.ladder = CAP }, {
    from: "450\\text{ cm}^3", answer: 0.45, unit: "litres",
    slips: [{ v: 4.5, say: "That's $\\div 100$. A litre is $1000$ cm$^3$." }, { v: 450000, say: "That's multiplying. Litres are bigger: divide." }],
    walk: [{ say: "Up the ladder from cm$^3$ to litres: divide by $1000$.", tex: "450 \\div 1000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 2, to: 1 } } } }],
  }),
  // 4024/22/M/J/25 Q3(a)
  convert("ratio-ml", "Write the ratio $175$ ml : $2.5$ litres in its simplest form. First, change $2.5$ litres to ml.", S => { litresBoard(S, 2.5); S.ladder = CAP }, {
    from: "2.5\\text{ litres}", answer: 2500, unit: "ml",
    slips: [{ v: 250, say: "That's $\\times 100$. A litre is $1000$ ml." }, { v: 0.0025, say: "That's dividing. ml are smaller, so there are more of them." }],
    walk: [{ say: "Down the ladder from litres to ml: multiply by $1000$.", tex: "2.5 \\times 1000", show: S => { if (S.ladder) S.ladder = { ...S.ladder, lit: { from: 1, to: 2 } } } }],
  }),
  askBeat("ratio", "So it's $175 : 2500$. In its simplest form, that's $7 : ?$", S => { litresBoard(S, 2.5); S.keyRows = 3 }, {
    name: "175 : 2500 = 7", sep: ":", col: BLUE, answer: 100, shown: "100", typed: "100", exact: true,
    slips: [{ v: 2500, say: "Both parts must be divided by the same number." }],
    walk: [
      { say: "$175$ became $7$: it was divided by $25$.", tex: "175 \\div 25 = 7" },
      { say: "Divide $2500$ by $25$ too.", tex: "2500 \\div 25" },
    ],
  }),
  {
    id: "end",
    say: "To change to a smaller unit, multiply. To change to a bigger unit, divide.",
    enter: S => {
      bare(S, [])
      S.ladders = [{ ...LENGTH, title: "Length" }, { ...MASS, title: "Mass" }, { ...AREA, title: "Area" }, { ...CAP, title: "Capacity" }]
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3]

applyParts(BEATS, [
  ["metre", "Length and mass"],
  ["cm2", "Area"],
  ["cm3", "Volume and capacity"],
])

