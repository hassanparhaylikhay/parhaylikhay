/**
 * Volume of prisms and cylinders (5.4, lesson 1 of 3), one tiny idea per
 * beat, on the 3D board.
 *
 * Volume counts the 1 cm cubes inside: one layer is length × width, and
 * there are as many layers as the height. The student builds a box of a
 * given volume (any way that works). A prism is the same shape all the way
 * through: its cross-section slides along its length and sweeps it out, so
 * its volume is the cross-section's area × the length; a cuboid is one, and
 * so is a cylinder (πr²h). Questions from 4024/11/O/N/25 Q12 and Q17(a),
 * 4024/21/M/J/22 Q4(a) and (c), 4024/12/M/J/23 Q9(b), 4024/21/O/N/12
 * Q7(b)(i) and 4024/22/O/N/24 Q3(a).
 *
 * Colours: the cross-section (a layer, the end, the circle) blue, the length
 * or height orange, a volume green, an unknown pink, what can be dragged
 * yellow.
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import { type Scene, type V3, BLUE, ORANGE, GREEN, PINK, CHALK, segKey, addSeg, goodView, resetBeat, say, type CrossState } from "./scene"
import { type Beat, look, watch, askBeat, crossBeat, lens, num, c, boxBoard, solidBoard } from "./kit"
import { curvedBounds } from "./solids"

const SIDE: [number, number] = [-30, 24]
const UNIT: Record<string, string> = { cm: "\\text{ cm}", cm2: "\\text{ cm}^2", cm3: "\\text{ cm}^3", m: "\\text{ m}", m3: "\\text{ m}^3", s: "\\text{ s}", min: "\\text{ min}", ml: "\\text{ ml}" }

/** A number typed on the calculator keys: `lead = [box] unit`, right only exactly unless it asks for figures or π. */
function ask(id: string, text: string, board: (S: Scene) => void, o: {
  lead: string; col?: string; unit?: keyof typeof UNIT; answer: number; shown?: string; typed?: string
  sf?: number; dp?: number; piForm?: boolean; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[]; then?: (S: Scene) => void
}): Beat {
  const unit = o.unit ? UNIT[o.unit] : ""
  return askBeat(id, text, S => { board(S); S.keyRows = 3 }, {
    name: o.lead, col: o.col ?? CHALK, answer: o.answer, shown: `${o.shown ?? num(o.answer)}${unit}`, typed: o.typed ?? String(o.answer),
    exact: !o.sf && o.dp === undefined && !o.piForm, sf: o.sf, dp: o.dp, piForm: o.piForm, slips: o.slips, walk: o.walk, after: unit || undefined, then: o.then,
  })
}

/** Run something over time: `set(S, e)` with e from 0 to 1. */
const over = (S: Scene, dur: number, set: (S: Scene, e: number) => void, wait = 0.5, end?: (S: Scene) => void) =>
  S.acts.push({ dur: wait }, { dur, run: (S2, _e, t) => set(S2, t), end: S2 => { set(S2, 1); end?.(S2) } })

// ── boxes and cubes ──────────────────────────────────────────────────────

/** A glass box l by w by h (its middle over the origin): cubes in it as far as `n` says, its edges labelled, water to a level. */
function cubeBox(S: Scene, l: number, w: number, h: number, o: { n?: number; lens?: [string, string, string]; cols?: [string, string, string]; water?: number } = {}) {
  boxBoard(S, { l, w, h, letters: false })
  if (o.n !== undefined) S.cubes = [{ o: [-l / 2, -w / 2, 0], s: 1, nx: l, ny: w, nz: h, count: o.n, col: BLUE }]
  if (o.lens) {
    const cols = o.cols ?? [BLUE, BLUE, ORANGE]
    S.lens[segKey("E", "H")] = lens(o.lens[0], cols[0])
    S.lens[segKey("H", "G")] = lens(o.lens[1], cols[1])
    S.lens[segKey("G", "C")] = lens(o.lens[2], cols[2])
  }
  if (o.water !== undefined) S.water = { x0: -l / 2, y0: -w / 2, z0: 0, x1: l / 2, y1: w / 2, z1: h, level: o.water, col: BLUE }
  goodView(S, ...SIDE)
}
const volLine = (l: string, w: string, h: string, v?: string) => row([atom("v", "\\text{Volume}"), op("e", "="), atom("l", l, { col: BLUE }), op("x1", "\\times"), atom("w", w, { col: BLUE }), op("x2", "\\times"), atom("h", h, { col: ORANGE }), ...(v ? [op("e2", "="), atom("t", v, { col: GREEN })] : [])])

// ── prisms ───────────────────────────────────────────────────────────────

/**
 * A prism lying along y: its cross-section `end` (points in x and z) at the
 * front (F0, F1, ...) and again at the back (K0, ...), `len` behind, swept
 * as far as `s` says. Its front face is lit when asked.
 */
function prismBoard(S: Scene, end: Vec[], len: number, o: { s?: number; lit?: boolean; slice?: boolean; view?: [number, number] } = {}) {
  const n = end.length, y0 = -len / 2, s = Math.max(0.02, o.s ?? 1)
  const pts: Record<string, V3> = {}
  end.forEach((p, i) => { pts[`F${i}`] = [p[0], y0, p[1]]; pts[`K${i}`] = [p[0], y0 + len * s, p[1]]; pts[`Z${i}`] = [p[0], y0 + len, p[1]] })
  if (o.slice) end.forEach((p, i) => { pts[`M${i}`] = [p[0], 0, p[1]] })
  const F = end.map((_, i) => `F${i}`), K = end.map((_, i) => `K${i}`)
  const faces = [F, [...K].reverse(), ...end.map((_, i) => [`F${i}`, `F${(i + 1) % n}`, `K${(i + 1) % n}`, `K${i}`])]
  solidBoard(S, pts, faces, {})
  // the view fits the whole prism, even while it is being swept out
  S.fitPts = [...F, ...end.map((_, i) => `Z${i}`)]
  if (o.lit) S.faceLit = { 0: BLUE }
  if (o.slice && n === 3) S.tris = [{ id: "slice", pts: ["M0", "M1", "M2"], col: BLUE }]
  goodView(S, ...(o.view ?? SIDE))
}
/** The prism's back sweeps out along its length, from nothing. */
function sweep(S: Scene, end: Vec[], len: number, dur = 2.6) {
  over(S, dur, (S2, e) => {
    end.forEach((p, i) => { const q: V3 = [p[0], -len / 2 + len * Math.max(0.02, e), p[1]]; S2.P3[`K${i}`] = q; S2.D3[`K${i}`] = q })
  }, 0.7)
}

/** 4024/12/M/J/23 Q9: a right-angled isosceles triangle, 3 by 3, 8 long. */
const S23: Vec[] = [[0, 0], [3, 0], [0, 3]]
function s23Board(S: Scene, o: { lit?: boolean } = {}) {
  prismBoard(S, S23, 8, { lit: o.lit })
  S.lens[segKey("F0", "F1")] = lens("3\\text{ cm}", o.lit ? BLUE : CHALK)
  S.lens[segKey("F0", "F2")] = lens("3\\text{ cm}", o.lit ? BLUE : CHALK)
  S.lens[segKey("F1", "K1")] = lens("8\\text{ cm}", ORANGE)
  S.rights = [{ at: "F0", a: "F1", b: "F2" }]
}

/** 4024/11/O/N/25 Q17: an isosceles triangle 13, 13, 10, the prism 3 long (drawn a little longer). */
const W25: Vec[] = [[-5, 0], [5, 0], [0, 12]]
function w25Board(S: Scene, o: { height?: boolean; lit?: boolean; hLab?: string } = {}) {
  prismBoard(S, W25, 3, { lit: o.lit, view: [-22, 14] })
  S.lens[segKey("F0", "F1")] = lens("10", BLUE)
  S.lens[segKey("F0", "F2")] = lens("13")
  S.lens[segKey("F1", "F2")] = lens("13")
  S.lens[segKey("F1", "K1")] = lens("3", ORANGE)
  if (o.height) {
    S.P3.FM = [0, -1.5, 0]
    addSeg(S, "F2", "FM", { col: PINK, grown: true })
    S.rights = [{ at: "FM", a: "F1", b: "F2" }]
    S.lens[segKey("FM", "F2")] = lens(o.hLab ?? "?", o.hLab && o.hLab !== "?" ? GREEN : PINK)
    S.lens[segKey("F0", "FM")] = lens("5", BLUE)
    delete S.lens[segKey("F0", "F1")]
  }
}

// ── cylinders ────────────────────────────────────────────────────────────

/** A cylinder of radius r and height h standing on the origin: its top lit, its radius and height labelled, grown to `s` of its height. */
function cylBoard(S: Scene, r: number, h: number, o: { lit?: boolean; rLab?: string; dLab?: string; hLab?: string; s?: number } = {}) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  const hs = h * Math.max(0.02, o.s ?? 1)
  S.curved = { kind: "cylinder", r, h: hs, lit: o.lit ? BLUE : undefined }
  curvedBounds({ kind: "cylinder", r, h }).forEach((p, i) => { S.P3[`_c${i}`] = p })
  S.fitPts = Object.keys(S.P3)
  Object.assign(S.P3, { O: [0, 0, hs], R: [r, 0, hs], RL: [-r, 0, hs], B0: [r, 0, 0] } as Record<string, V3>)
  S.faces = null
  if (o.rLab) { addSeg(S, "O", "R", { col: BLUE, grown: true }); S.lens[segKey("O", "R")] = lens(o.rLab, BLUE) }
  if (o.dLab) { addSeg(S, "RL", "R", { col: BLUE, grown: true }); S.lens[segKey("RL", "R")] = lens(o.dLab, BLUE) }
  if (o.hLab) S.lens[segKey("R", "B0")] = lens(o.hLab, ORANGE)
  goodView(S, -30, 22)
}

/** 2 × (y + 13)-style lines: a × b = c with a piece to move across. */
const g = (st: CrossState | undefined, id: string) => ({ grab: st?.grab.has(id) || undefined, pulse: st?.pulse.has(id) || undefined })

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  {
    id: "vol",
    say: "*Volume* is how many $1$ cm cubes fit inside.",
    enter: S => {
      cubeBox(S, 4, 3, 2, { n: 0 })
      S.eqFn = S2 => row([atom("c", "\\text{Cubes}"), op("e", "="), atom("n", String(S2.cubes[0]?.count ?? 0), (S2.cubes[0]?.count ?? 0) >= 24 ? { col: GREEN } : {})])
      over(S, 3.2, (S2, e) => { if (S2.cubes[0]) S2.cubes[0].count = Math.round(24 * e) }, 0.8)
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 4.4,
  },
  watch("layer", "One layer is $4 \\times 3 = 12$ cubes.", S => {
    cubeBox(S, 4, 3, 2, { n: 12, lens: ["4", "3", "2"] })
    S.eqFn = () => row([atom("c", "\\text{Layer}"), op("e", "="), atom("l", "4", { col: BLUE }), op("x", "\\times"), atom("w", "3", { col: BLUE }), op("e2", "="), atom("t", "12")])
    look(S, ["eq"])
  }, 2.6),
  {
    id: "layers",
    say: "There are $2$ layers, so the volume is $12 \\times 2 = 24$ cm$^3$.",
    enter: S => {
      cubeBox(S, 4, 3, 2, { n: 12, lens: ["4", "3", "2"] })
      over(S, 1.2, (S2, e) => { if (S2.cubes[0]) S2.cubes[0].count = Math.round(12 + 12 * e) }, 0.8)
      S.eqFn = () => volLine("4", "3", "2", "24\\text{ cm}^3")
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3,
  },
  {
    id: "build",
    say: "Drag the box's edges to make a volume of $36$ cm$^3$.",
    enter: S => {
      cubeBox(S, 3, 2, 2, { n: 12 })
      S.fitPts = ["_b0", "_b1", "_b2", "_b3"]
      Object.assign(S.P3, { _b0: [-3.5, -3, 0], _b1: [3.5, 3, 0], _b2: [-3.5, -3, 5], _b3: [3.5, 3, 5] } as Record<string, V3>)
      let l0 = 0, w0 = 0, h0 = 0
      const start = (S2: Scene) => { l0 = S2.box!.l; w0 = S2.box!.w; h0 = S2.box!.h }
      const cl = (x: number, hi: number) => Math.max(1, Math.min(hi, Math.round(x)))
      S.handles = [
        { id: "len", at: S2 => [S2.box!.l / 2, 0, S2.box!.h / 2], axis: [1, 0, 0], start, move: (S2, a) => { S2.box!.l = cl(l0 + 2 * a, 7) } },
        { id: "wid", at: S2 => [0, -S2.box!.w / 2, S2.box!.h / 2], axis: [0, -1, 0], start, move: (S2, a) => { S2.box!.w = cl(w0 + 2 * a, 6) } },
        { id: "hgt", at: S2 => [0, 0, S2.box!.h], axis: [0, 0, 1], start, move: (S2, a) => { S2.box!.h = cl(h0 + a, 5) } },
      ]
      S.tick = S2 => {
        const b = S2.box!
        S2.cubes = [{ o: [-b.l / 2, -b.w / 2, 0], s: 1, nx: b.l, ny: b.w, nz: b.h, count: b.l * b.w * b.h, col: BLUE }]
        S2.lens[segKey("E", "H")] = lens(String(b.l), BLUE)
        S2.lens[segKey("H", "G")] = lens(String(b.w), BLUE)
        S2.lens[segKey("G", "C")] = lens(String(b.h), ORANGE)
        const v = b.l * b.w * b.h
        if (v === 36 && !S2.drag && !S2.got.has(`b${b.l}${b.w}${b.h}`)) {
          S2.got.add(`b${b.l}${b.w}${b.h}`)
          S2.flashGood = 1
          say(S2, [...S2.got].filter(k => k.startsWith("b")).length === 1 ? "That works. Can you find another one?" : "That one works too.", "calm", 600)
        }
      }
      S.eqFn = S2 => { const b = S2.box!; const v = b.l * b.w * b.h; return volLine(String(b.l), String(b.w), String(b.h), `${v}\\text{ cm}^3`) }
      look(S, ["eq"])
    },
    done: S => [...S.got].some(k => k.startsWith("b")), free: true, minPlay: 4,
  },
  watch("cuboid", "Volume of a cuboid $=$ length $\\times$ width $\\times$ height.", S => {
    cubeBox(S, 4, 3, 2, { n: 24, lens: ["\\text{length}", "\\text{width}", "\\text{height}"] })
    S.eqFn = () => volLine("\\text{length}", "\\text{width}", "\\text{height}")
    look(S, ["eq"])
  }, 2.8),
  // 4024/11/O/N/25 Q12
  ask("w25", "This container is $10$ cm by $8$ cm by $9$ cm. What is its volume?", S => cubeBox(S, 10, 8, 9, { lens: ["10", "8", "9"] }), {
    lead: "\\text{Volume}", unit: "cm3", answer: 720,
    slips: [{ v: 27, say: "That adds them. Volume multiplies length, width and height." }],
    walk: [{ say: "Volume $=$ length $\\times$ width $\\times$ height.", tex: "10 \\times 8 \\times 9" }, { say: "Multiply all three." }],
  }),
  ask("w25-time", "Water drips in at $6$ ml a second. How many seconds does it take to fill?", S => {
    cubeBox(S, 10, 8, 9, { lens: ["10", "8", "9"], water: 0 })
    over(S, 6, (S2, e) => { if (S2.water) S2.water.level = 0.6 * e }, 0.5)
  }, {
    lead: "\\text{Time}", unit: "s", answer: 120,
    slips: [{ v: 4320, say: "That multiplies. Each second fills $6$ ml, so divide." }, { v: 720, say: "That's the volume, $720$ ml. Each second fills $6$ ml of it." }],
    walk: [{ say: "$720$ cm$^3$ is $720$ ml.", tex: "720\\text{ ml}" }, { say: "Each second fills $6$ ml of it.", tex: "720 \\div 6" }],
  }),
  // 4024/21/M/J/22 Q4(a)
  watch("s22", "A cuboid is $x$ by $x$ by $10$, and its volume is $62.5$ cm$^3$. So $x^2 \\times 10 = 62.5$.", S => {
    cubeBox(S, 2.5, 2.5, 10, { lens: ["x", "x", "10"], cols: [PINK, PINK, ORANGE] })
    S.eqFn = () => row([atom("xx", "x^2", { col: PINK }), op("x", "\\times"), atom("ten", "10", { col: ORANGE }), op("eq", "="), atom("v", "62.5", { col: GREEN })])
    look(S, ["eq"])
  }, 3.2),
  crossBeat("s22-cross", "Move the $10$ across the $=$.", S => cubeBox(S, 2.5, 2.5, 10, { lens: ["x", "x", "10"], cols: [PINK, PINK, ORANGE] }), {
    ids: ["x", "ten"], label: "\\times\\,10", from: "left",
    options: ["$\\div\\,10$", "$-\\,10$"], answer: 0,
    notes: { 1: "It was multiplying, so it comes across dividing." },
    before: st => row([atom("xx", "x^2", { col: PINK }), op("x", "\\times", g(st, "x")), atom("ten", "10", { col: ORANGE, ...g(st, "ten") }), op("eq", "="), atom("v", "62.5", { col: GREEN })]),
    after: () => row([atom("xx", "x^2", { col: PINK }), op("eq", "="), atom("v", "62.5", { col: GREEN }), op("dv", "\\div"), atom("ten", "10", { col: ORANGE })]),
  }),
  ask("s22-x2", "So what is $x^2$?", S => cubeBox(S, 2.5, 2.5, 10, { lens: ["x", "x", "10"], cols: [PINK, PINK, ORANGE] }), {
    lead: "x^2", col: PINK, answer: 6.25,
    slips: [{ v: 625, say: "That multiplies. The $10$ came across dividing." }],
    walk: [{ say: "The $10$ came across dividing.", tex: "62.5 \\div 10" }, { say: "Now work it out." }],
  }),
  ask("s22-x", "So what is $x$?", S => cubeBox(S, 2.5, 2.5, 10, { lens: ["x", "x", "10"], cols: [PINK, PINK, ORANGE] }), {
    lead: "x", col: PINK, unit: "cm", answer: 2.5,
    slips: [{ v: 3.125, say: "That halves it. $x$ times itself is $6.25$: take the square root." }, { v: 6.25, say: "That's $x^2$. Take the square root." }],
    walk: [{ say: "$x \\times x = 6.25$, so $x$ is its square root.", tex: "\\sqrt{6.25}" }, { say: "Use the $\\sqrt{\\;}$ key." }],
  }),
]

const PART_2: Beat[] = [
  watch("prism", "A *prism* is the same shape all the way through.", S => { s23Board(S); delete S.lens[segKey("F0", "F1")]; delete S.lens[segKey("F0", "F2")]; delete S.lens[segKey("F1", "K1")]; S.rights = []; look(S) }, 2.4),
  watch("xsec", "That shape is its *cross-section*. Cut it anywhere and you get the same shape.", S => { prismBoard(S, S23, 8, { lit: true, slice: true }); look(S) }, 3),
  {
    id: "sweep",
    say: "Slide the cross-section along. It sweeps out the prism.",
    enter: S => { prismBoard(S, S23, 8, { lit: true, s: 0 }); sweep(S, S23, 8); look(S) },
    cta: "", ctaAfter: 3.8,
  },
  watch("p-formula", "Volume of a prism $=$ area of the cross-section $\\times$ length.", S => {
    prismBoard(S, S23, 8, { lit: true })
    S.lens[segKey("F1", "K1")] = lens("\\text{length}", ORANGE)
    S.eqFn = () => row([atom("v", "\\text{Volume}"), op("e", "="), atom("a", "\\text{area}", { col: BLUE }), op("x", "\\times"), atom("l", "\\text{length}", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.8),
  watch("cuboid-prism", "A cuboid is a prism too. Its cross-section is a rectangle.", S => {
    prismBoard(S, [[0, 0], [4, 0], [4, 2], [0, 2]], 3, { lit: true })
    look(S)
  }, 2.6),
  // 4024/12/M/J/23 Q9(b)
  ask("s23-a", "This prism's cross-section is a right-angled triangle. What is its area?", S => s23Board(S, { lit: true }), {
    lead: "\\text{Area}", col: BLUE, unit: "cm2", answer: 4.5,
    slips: [{ v: 9, say: "That's the square round it. A triangle is half of it." }, { v: 6, say: "That adds the sides. Area is $\\tfrac{1}{2} \\times$ base $\\times$ height." }],
    walk: [{ say: "A triangle is $\\tfrac{1}{2} \\times$ base $\\times$ height.", tex: "\\tfrac{1}{2} \\times 3 \\times 3" }, { say: "Halve $3 \\times 3$." }],
  }),
  ask("s23-v", "Now work out the volume of the prism.", S => s23Board(S, { lit: true }), {
    lead: "\\text{Volume}", unit: "cm3", answer: 36,
    slips: [{ v: 72, say: "That used the whole square. Use the triangle's area, $4.5$." }, { v: 12.5, say: "That adds. Multiply the area by the length." }],
    walk: [{ say: "Volume $=$ area of the cross-section $\\times$ length.", tex: `${c(BLUE, "4.5")} \\times ${c(ORANGE, "8")}` }, { say: "Multiply them." }],
  }),
  // 4024/11/O/N/25 Q17(a)
  watch("w25p", "This prism's cross-section is a triangle with sides $13$, $13$ and $10$. It is $3$ cm long.", S => { w25Board(S); look(S) }, 3.2),
  ask("w25p-h", "First we need the triangle's height. How tall is it?", S => w25Board(S, { height: true, lit: true }), {
    lead: "\\text{height}", col: PINK, unit: "cm", answer: 12,
    slips: [{ v: 13, say: "That's the sloping side. The height is shorter." }, { v: 8, say: "Use Pythagoras: square, take away, then square root." }, { v: Math.sqrt(194), say: "Take away: the sloping side is the longest." }],
    walk: [
      { say: "The height cuts the triangle in two. Each half has a base of $5$.", tex: "13^2 = 5^2 + h^2" },
      { say: "Take $5^2$ away from $13^2$, then square root.", tex: "\\sqrt{13^2 - 5^2}" },
    ],
  }),
  ask("w25p-a", "What is the area of the cross-section?", S => w25Board(S, { height: true, lit: true, hLab: "12" }), {
    lead: "\\text{Area}", col: BLUE, unit: "cm2", answer: 60,
    slips: [{ v: 120, say: "That's the rectangle round it. A triangle is half." }, { v: 30, say: "The base is the whole $10$, not $5$." }],
    walk: [{ say: "Area $= \\tfrac{1}{2} \\times$ base $\\times$ height.", tex: "\\tfrac{1}{2} \\times 10 \\times 12" }, { say: "Halve $10 \\times 12$." }],
  }),
  ask("w25p-v", "So what is the volume of the prism?", S => w25Board(S, { height: true, lit: true, hLab: "12" }), {
    lead: "\\text{Volume}", unit: "cm3", answer: 180,
    slips: [{ v: 63, say: "That adds. Multiply the area by the length." }],
    walk: [{ say: "Area of the cross-section $\\times$ length.", tex: `${c(BLUE, "60")} \\times ${c(ORANGE, "3")}` }, { say: "Multiply them." }],
  }),
]

const PART_3: Beat[] = [
  watch("cyl", "A *cylinder* is a prism too. Its cross-section is a circle.", S => { cylBoard(S, 2, 4, { lit: true }); look(S) }, 2.6),
  {
    id: "cyl-sweep",
    say: "The circle slides up and sweeps out the cylinder.",
    enter: S => { cylBoard(S, 2, 4, { lit: true, s: 0 }); over(S, 2.4, (S2, e) => { if (S2.curved) S2.curved.h = 4 * Math.max(0.02, e); S2.P3.O = [0, 0, 4 * e]; S2.P3.R = [2, 0, 4 * e] }, 0.7); look(S) },
    cta: "", ctaAfter: 3.4,
  },
  watch("cyl-formula", "So its volume is $\\pi r^2 \\times h$.", S => {
    cylBoard(S, 2, 4, { lit: true, rLab: "r", hLab: "h" })
    S.eqFn = () => row([atom("v", "\\text{Volume}"), op("e", "="), atom("a", "\\pi r^2", { col: BLUE }), op("x", "\\times"), atom("h", "h", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.8),
  // 4024/21/O/N/12 Q7(b)(i)
  ask("tin", "A tin is a cylinder $11$ cm high with a diameter of $7$ cm. Calculate its volume, to $3$ significant figures.", S => cylBoard(S, 1.75, 2.75, { lit: true, dLab: "7", hLab: "11" }), {
    lead: "\\text{Volume}", unit: "cm3", answer: Math.PI * 3.5 * 3.5 * 11, sf: 3, typed: "p*3.5^*11",
    slips: [
      { v: Math.PI * 49 * 11, say: "That used the diameter. The radius is half of it, $3.5$." },
      { v: Math.PI * 7 * 11, say: "Square the radius: $3.5^2$." },
    ],
    walk: [
      { say: "The radius is half the diameter.", tex: `${c(BLUE, "r")} = 3.5`, show: S => { S.P3.O = [0, 0, 2.75]; addSeg(S, "O", "R", { col: BLUE, grown: true }); S.lens[segKey("O", "R")] = lens("3.5", BLUE) } },
      { say: "Volume $= \\pi r^2 h$.", tex: `\\pi \\times ${c(BLUE, "3.5")}^2 \\times ${c(ORANGE, "11")}` },
    ],
  }),
  // 4024/21/M/J/22 Q4(c)
  ask("barrel", "A barrel is a cylinder with radius $20$ cm and height $80$ cm. Find its volume, in terms of $\\pi$.", S => cylBoard(S, 2, 8, { lit: true, rLab: "20", hLab: "80" }), {
    lead: "\\text{Volume}", unit: "cm3", answer: 32000 * Math.PI, shown: "32\\,000\\pi", typed: "32000p", piForm: true,
    slips: [{ v: 3200 * Math.PI, say: "Square the radius: $20^2 = 400$." }, { v: 1600 * Math.PI, say: "That's $\\pi r^2$, one circle. Multiply by the height." }],
    walk: [{ say: "Volume $= \\pi r^2 h$.", tex: `\\pi \\times ${c(BLUE, "20")}^2 \\times ${c(ORANGE, "80")}` }, { say: "$20^2 = 400$, and $400 \\times 80 = 32\\,000$." }],
  }),
  ask("barrel-min", "It fills with water at $5500$ cm$^3$ a minute. How many minutes does it take? Give $2$ decimal places.", S => cylBoard(S, 2, 8, { lit: true, rLab: "20", hLab: "80" }), {
    lead: "\\text{Time}", unit: "min", answer: (32000 * Math.PI) / 5500, dp: 2, typed: "32000p/5500",
    slips: [{ v: (32000 * Math.PI * 5500) / 1e6, say: "Divide the volume by $5500$." }],
    walk: [{ say: "Each minute fills $5500$ cm$^3$.", tex: "32\\,000\\pi \\div 5500" }, { say: "Type it all in one go, with the $\\pi$ key." }],
  }),
  ask("barrel-s", "That's $18$ minutes and $0.28$ of a minute. How many seconds is $0.28$ of a minute, to the nearest second?", S => cylBoard(S, 2, 8, { lit: true, rLab: "20", hLab: "80" }), {
    lead: "0.28\\text{ min}", unit: "s", answer: ((32000 * Math.PI) / 5500 - 18) * 60, dp: 0, typed: "0.28*60",
    slips: [{ v: 28, say: "A minute has $60$ seconds, not $100$. Multiply $0.28$ by $60$." }],
    walk: [{ say: "A minute is $60$ seconds.", tex: "0.28 \\times 60" }, { say: "Round it to the nearest second." }],
    then: S => say(S, "So it takes $18$ minutes $17$ seconds.", "calm", 600),
  }),
]

const T = { l: 1.2, w: 0.6, h: 2.5 }
const tankBoard = (S: Scene, hLab = "h") => cubeBox(S, T.l, T.w, T.h, { lens: ["1.2", "0.6", hLab], cols: [BLUE, BLUE, hLab === "h" ? PINK : GREEN] })

const PART_4: Beat[] = [
  // 4024/22/O/N/24 Q3(a)
  watch("tank", "A tank is a cuboid $1.2$ m by $0.6$ m by $h$ m. Its volume is $1.8$ m$^3$.", S => {
    tankBoard(S)
    S.eqFn = () => row([atom("l", "1.2", { col: BLUE }), op("x1", "\\times"), atom("w", "0.6", { col: BLUE }), op("x2", "\\times"), atom("h", "h", { col: PINK }), op("eq", "="), atom("v", "1.8", { col: GREEN })])
    look(S, ["eq"])
  }, 3),
  ask("tank-072", "First, what is $1.2 \\times 0.6$?", S => tankBoard(S), {
    lead: "1.2 \\times 0.6", col: BLUE, answer: 0.72,
    slips: [{ v: 1.8, say: "That adds them. Multiply." }, { v: 7.2, say: "Count the decimal places: $12 \\times 6 = 72$, with two places." }],
    walk: [{ say: "$12 \\times 6 = 72$.", tex: "12 \\times 6 = 72" }, { say: "There are two decimal places in all." }],
  }),
  crossBeat("tank-cross", "So $0.72 \\times h = 1.8$. Move the $0.72$ across.", S => tankBoard(S), {
    ids: ["a", "x"], label: "0.72\\,\\times", from: "left",
    options: ["$\\div\\,0.72$", "$-\\,0.72$"], answer: 0,
    notes: { 1: "It was multiplying, so it comes across dividing." },
    before: st => row([atom("a", "0.72", { col: BLUE, ...g(st, "a") }), op("x", "\\times", g(st, "x")), atom("h", "h", { col: PINK }), op("eq", "="), atom("v", "1.8", { col: GREEN })]),
    after: () => row([atom("h", "h", { col: PINK }), op("eq", "="), atom("v", "1.8", { col: GREEN }), op("dv", "\\div"), atom("a", "0.72", { col: BLUE })]),
  }),
  ask("tank-h", "So what is $h$?", S => tankBoard(S), {
    lead: "h", col: PINK, unit: "m", answer: 2.5,
    slips: [{ v: 1.296, say: "That multiplies. The $0.72$ came across dividing." }],
    walk: [{ say: "The $0.72$ came across dividing.", tex: "1.8 \\div 0.72" }, { say: "Now work it out." }],
  }),
  ask("tank-90", "Fuel fills it to $90\\%$ of its volume. How many m$^3$ is that?", S => { tankBoard(S, "2.5"); S.water = { x0: -T.l / 2, y0: -T.w / 2, z0: 0, x1: T.l / 2, y1: T.w / 2, z1: T.h, level: 0.9, col: BLUE } }, {
    lead: "90\\%", unit: "m3", answer: 1.62,
    slips: [{ v: 162, say: "$90\\%$ is $0.9$ of it, not $90$ times." }, { v: 0.18, say: "That's the $10\\%$ left empty. $90\\%$ is $0.9$ of $1.8$." }],
    walk: [{ say: "$90\\%$ of something is $0.9$ times it.", tex: "0.9 \\times 1.8" }, { say: "Now work it out." }],
  }),
  ask("tank-min", "It goes in at $0.2$ m$^3$ a minute. How many minutes does that take?", S => { tankBoard(S, "2.5"); S.water = { x0: -T.l / 2, y0: -T.w / 2, z0: 0, x1: T.l / 2, y1: T.w / 2, z1: T.h, level: 0.9, col: BLUE } }, {
    lead: "\\text{Time}", unit: "min", answer: 8.1,
    slips: [{ v: 0.324, say: "That multiplies. Each minute puts in $0.2$ m$^3$, so divide." }, { v: 9, say: "That fills all of it. It only fills $1.62$ m$^3$." }],
    walk: [{ say: "Each minute puts in $0.2$ m$^3$.", tex: "1.62 \\div 0.2" }, { say: "Now work it out." }],
  }),
  ask("tank-s", "$8.1$ minutes is $8$ minutes and $0.1$ of a minute. How many seconds is $0.1$ of a minute?", S => { tankBoard(S, "2.5"); S.water = { x0: -T.l / 2, y0: -T.w / 2, z0: 0, x1: T.l / 2, y1: T.w / 2, z1: T.h, level: 0.9, col: BLUE } }, {
    lead: "0.1\\text{ min}", unit: "s", answer: 6,
    slips: [{ v: 10, say: "A minute has $60$ seconds, not $100$." }],
    walk: [{ say: "A minute is $60$ seconds.", tex: "0.1 \\times 60" }, { say: "Work it out." }],
    then: S => say(S, "So it takes $8$ minutes $6$ seconds.", "calm", 600),
  }),
  {
    id: "end",
    say: "Volume of a prism $=$ area of the cross-section $\\times$ length. For a cylinder, that's $\\pi r^2 h$.",
    enter: S => {
      cylBoard(S, 2, 4, { lit: true, rLab: "r", hLab: "h" })
      S.eqFn = () => row([atom("v", "V"), op("e", "="), atom("a", "\\text{area}", { col: BLUE }), op("x", "\\times"), atom("l", "\\text{length}", { col: ORANGE }), op("sp", "\\qquad"), atom("v2", "V"), op("e2", "="), atom("a2", "\\pi r^2", { col: BLUE }), atom("h", "h", { col: ORANGE })])
      look(S, ["eq"])
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["vol", "Volume"],
  ["prism", "Prisms"],
  ["cyl", "Cylinders"],
  ["tank", "A tank"],
])

