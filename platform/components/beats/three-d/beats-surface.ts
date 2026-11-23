/**
 * Surface area (5.4, lesson 2 of 3), one tiny idea per beat, on the 3D
 * board.
 *
 * Surface area is the area of every face: a box opens out flat, its faces in
 * pairs. A prism's net is its two ends and one strip of rectangles, as long
 * as the prism and as wide as the way round its end. A cylinder's curved
 * face unrolls into a rectangle 2πr by h, its circles swinging out above
 * and below. Questions from 4024/11/O/N/11 Q16, 4024/21/O/N/12 Q7(b)(ii)
 * and 4024/22/O/N/24 Q3(b) (a tank with an open top).
 *
 * Colours: the ends (a prism's ends, a cylinder's circles) blue, the faces
 * round the sides orange, a total green, an unknown pink.
 */

import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import { type Scene, type V3, BLUE, ORANGE, GREEN, PINK, CHALK, segKey, addSeg, goodView, resetBeat } from "./scene"
import { type Beat, look, watch, askBeat, lens, num, c } from "./kit"
import { type Net, stripNet, foldNet } from "./solids"

const SIDE: [number, number] = [-30, 24]
const FLAT: [number, number] = [-16, 58]
const UNIT: Record<string, string> = { cm: "\\text{ cm}", cm2: "\\text{ cm}^2" }

function ask(id: string, text: string, board: (S: Scene) => void, o: {
  lead: string; col?: string; unit?: keyof typeof UNIT; answer: number; shown?: string; typed?: string
  sf?: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[]
}): Beat {
  const unit = o.unit ? UNIT[o.unit] : ""
  return askBeat(id, text, S => { board(S); S.keyRows = 3 }, {
    name: o.lead, col: o.col ?? CHALK, answer: o.answer, shown: `${o.shown ?? num(o.answer)}${unit}`, typed: o.typed ?? String(o.answer),
    exact: !o.sf, sf: o.sf, slips: o.slips, walk: o.walk, after: unit || undefined,
  })
}
const over = (S: Scene, dur: number, set: (S: Scene, e: number) => void, wait = 0.5, end?: (S: Scene) => void) =>
  S.acts.push({ dur: wait }, { dur, run: (S2, _e, t) => set(S2, t), end: S2 => { set(S2, 1); end?.(S2) } })

// ── nets ─────────────────────────────────────────────────────────────────

/** A label on a net's edge: from corner i to corner j of a face; `name` puts a letter at corner i instead. */
interface NetLab { key: string; face: string; i: number; j: number; tex: string; col?: string; at?: number }

/**
 * A net folded `t` of the way (1: the solid), its faces in their colours,
 * the view fitted round it as it is. Labels on its edges and letters at its
 * corners ride along as it folds.
 */
function netBoard(S: Scene, net: Net, o: { t: number; cols?: Record<string, string>; labs?: NetLab[]; names?: Record<string, [string, number]> }) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  S.faces = null
  S.net = { def: net, t: o.t, tD: o.t, cols: o.cols }
  fitNet(S, net, o.t)
  goodView(S, ...(o.t > 0.5 ? SIDE : FLAT))
  S.fitRect = o.t > 0.5 ? SIDE : FLAT
  const place = (S2: Scene, t: number) => {
    const F = foldNet(net, t)
    for (const L of o.labs ?? []) {
      const a = F[L.face][L.i], b = F[L.face][L.j]
      S2.P3[`${L.key}a`] = a; S2.D3[`${L.key}a`] = a; S2.P3[`${L.key}b`] = b; S2.D3[`${L.key}b`] = b
      S2.lens[segKey(`${L.key}a`, `${L.key}b`)] = { ...lens(L.tex, L.col), ...(L.at !== undefined ? { along: L.at } : {}) }
    }
    for (const [n, [face, i]] of Object.entries(o.names ?? {})) { S2.P3[n] = F[face][i]; S2.D3[n] = F[face][i] }
  }
  place(S, o.t)
  S.names = Object.fromEntries(Object.keys(o.names ?? {}).map(n => [n, n]))
  S.tick = S2 => { if (S2.net) place(S2, S2.net.tD) }
}
/** The view fits the net as it is at t (folded: the solid; flat: the whole net). */
function fitNet(S: Scene, net: Net, t: number) {
  for (const n of Object.keys(S.P3)) if (n.startsWith("_n")) delete S.P3[n]
  const P = Object.values(foldNet(net, t > 0.5 ? 1 : 0)).flat()
  P.forEach((p, i) => { S.P3[`_n${i}`] = p })
  S.fitPts = P.map((_, i) => `_n${i}`)
}
/** Open a folded net out flat (or fold it up), the view turning and easing to fit it. */
function unfold(S: Scene, to: number, dur = 2.8) {
  const net = S.net!.def
  S.acts.push({ dur: 0.8, begin: S2 => { fitNet(S2, net, to); goodView(S2, ...(to > 0.5 ? SIDE : FLAT)); S2.fitRect = to > 0.5 ? SIDE : FLAT } }, { dur, run: (S2, e) => { if (S2.net) S2.net.t = to > 0.5 ? e : 1 - e } })
}

/** The box used to show it: 4 long, 3 deep, 2 high, as a strip of four faces with the two ends. */
const BOX = stripNet([[0, 0], [4, 0], [4, 2], [0, 2]], 3)
const BOX_PAIRS = { r0: BLUE, r2: BLUE, endA: ORANGE, endB: ORANGE, r1: GREEN, r3: GREEN }
const BOX_LABS: NetLab[] = [
  { key: "bl", face: "r0", i: 0, j: 1, tex: "4", col: BLUE },
  { key: "bw", face: "r0", i: 1, j: 2, tex: "3", col: BLUE },
  { key: "bh", face: "endA", i: 1, j: 2, tex: "2", col: ORANGE },
]

/** 4024/11/O/N/11 Q16: a prism 20 cm long, its cross-section the trapezium ABCD (DC = 6, CB = 5, BA = 2, AD = 3, a right angle at D). */
const W11 = stripNet([[0, 0], [6, 0], [2, 3], [0, 3]], 9)
const W11_LABS: NetLab[] = [
  { key: "dc", face: "endA", i: 0, j: 1, tex: "6", col: BLUE },
  { key: "cb", face: "endA", i: 1, j: 2, tex: "5", col: BLUE },
  { key: "ba", face: "endA", i: 2, j: 3, tex: "2", col: BLUE },
  { key: "ad", face: "endA", i: 3, j: 0, tex: "3", col: BLUE },
  { key: "ln", face: "r0", i: 1, j: 2, tex: "20", col: ORANGE },
]
const W11_NAMES: Record<string, [string, number]> = { D: ["endA", 0], C: ["endA", 1], B: ["endA", 2], A: ["endA", 3] }
const W11_COLS = { endA: BLUE, endB: BLUE, r0: ORANGE, r1: ORANGE, r2: ORANGE, r3: ORANGE }

/** 4024/22/O/N/24 Q3(b): the open tank, ends the trapezium ABCD (AB = 110, DC = 80, AD = BC = 70), a square base, no top. */
const TH = Math.sqrt(70 * 70 - 15 * 15)
const TANK = stripNet([[0, 0], [80, 0], [95, TH], [-15, TH]], 80, 2)
const TANK_LABS: NetLab[] = [
  { key: "ab", face: "endA", i: 2, j: 3, tex: "110" },
  { key: "dc", face: "endA", i: 0, j: 1, tex: "80" },
  { key: "ad", face: "endA", i: 3, j: 0, tex: "70" },
  { key: "dh", face: "r0", i: 1, j: 2, tex: "80" },
]
const TANK_NAMES: Record<string, [string, number]> = { D: ["endA", 0], C: ["endA", 1], B: ["endA", 2], A: ["endA", 3], H: ["endB", 0], G: ["endB", 1], F: ["endB", 2], E: ["endB", 3] }
const TANK_COLS = { endA: BLUE, endB: BLUE, r0: ORANGE, r1: ORANGE, r3: ORANGE }
const tankBoard = (S: Scene, t = 1, labs = TANK_LABS) => netBoard(S, TANK, { t, cols: TANK_COLS, labs, names: t > 0.5 ? TANK_NAMES : {} })
/** The tank with A's height drawn down to the floor, and how far A is past D. */
function tankHeight(S: Scene, o: { gap?: string; h?: string } = {}) {
  tankBoard(S, 1)
  const A: V3 = [-15, 0, TH]
  Object.assign(S.P3, { Ap: [-15, 0, 0] as V3, Dd: [0, 0, 0] as V3, Aa: A })
  addSeg(S, "Aa", "Ap", { col: ORANGE, grown: true })
  addSeg(S, "Ap", "Dd", { col: o.gap === "15" ? GREEN : PINK, grown: true })
  S.lens[segKey("Ap", "Dd")] = lens(o.gap ?? "?", o.gap === "15" ? GREEN : PINK)
  S.lens[segKey("Aa", "Ap")] = lens(o.h ?? "h", ORANGE)
  S.rights = [{ at: "Ap", a: "Aa", b: "Dd" }]
  // face the end, so the trapezium is seen at its true shape
  goodView(S, -6, 10)
}

// ── a cylinder unrolling ─────────────────────────────────────────────────

/** The view fits the cylinder round, or its net flat. */
function fitCyl(S: Scene, r: number, h: number, flat: boolean) {
  const W = Math.PI * r
  const room: V3[] = flat ? [[-W, -r, -2 * r], [W, -r, -2 * r], [-W, -r, h + 2 * r], [W, -r, h + 2 * r]] : [[-r, -r, 0], [r, r, 0], [-r, -r, h], [r, r, h]]
  for (const n of Object.keys(S.P3)) if (n.startsWith("_u")) delete S.P3[n]
  room.forEach((p, i) => { S.P3[`_u${i}`] = p })
  S.fitPts = room.map((_, i) => `_u${i}`)
}

/** A cylinder (radius r, height h) unrolled `u` of the way and its circles swung out `cap`; labels on the flat net when asked. */
function cylNet(S: Scene, r: number, h: number, u: number, cap: number, o: { w?: string; h?: string; r?: string; d?: string } = {}) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  S.faces = null
  S.unroll = { r, h, u, cap, cols: { side: ORANGE, ends: BLUE } }
  const W = Math.PI * r
  fitCyl(S, r, h, u > 0.5)
  Object.assign(S.P3, { U1: [-W, -r, 0], U2: [W, -r, 0], U3: [W, -r, h], TC: [0, -r, h + r], TR: [r, -r, h + r], O: [0, 0, h], R: [r, 0, h], RL: [-r, 0, h], B0: [r, 0, 0] } as Record<string, V3>)
  if (u > 0.99 && cap > 0.99) {
    if (o.w) S.lens[segKey("U1", "U2")] = lens(o.w, o.w === "?" ? PINK : ORANGE)
    if (o.h) S.lens[segKey("U2", "U3")] = lens(o.h, ORANGE)
    if (o.r) { addSeg(S, "TC", "TR", { col: BLUE, grown: true }); S.lens[segKey("TC", "TR")] = lens(o.r, BLUE) }
  } else {
    if (o.r) { addSeg(S, "O", "R", { col: BLUE, grown: true }); S.lens[segKey("O", "R")] = lens(o.r, BLUE) }
    if (o.d) { addSeg(S, "RL", "R", { col: BLUE, grown: true }); S.lens[segKey("RL", "R")] = lens(o.d, BLUE) }
    if (o.h) S.lens[segKey("R", "B0")] = lens(o.h, ORANGE)
  }
  goodView(S, -12, 16)
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  watch("sa", "*Surface area* is the total area of all the faces of a solid.", S => { netBoard(S, BOX, { t: 1, cols: BOX_PAIRS }); look(S) }, 2.6),
  {
    id: "open",
    say: "Let's open this box out flat.",
    enter: S => { netBoard(S, BOX, { t: 1, cols: BOX_PAIRS }); unfold(S, 0); look(S) },
    cta: "", ctaAfter: 4,
  },
  watch("pairs", "Its six faces come in pairs: top and bottom, front and back, and two ends.", S => { netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS }); look(S) }, 3),
  ask("top", "The top and the bottom are blue. What is the area of one of them?", S => netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS }), {
    lead: "\\text{top}", col: BLUE, unit: "cm2", answer: 12,
    slips: [{ v: 7, say: "That adds. Area is length $\\times$ width." }, { v: 24, say: "That's both of them. Just one." }],
    walk: [{ say: "The top is $4$ by $3$.", tex: "4 \\times 3" }, { say: "Multiply." }],
  }),
  ask("front", "The front and the back are orange. What is the area of one of them?", S => netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS }), {
    lead: "\\text{front}", col: ORANGE, unit: "cm2", answer: 8,
    slips: [{ v: 6, say: "That adds. Area is length $\\times$ height." }, { v: 12, say: "That's the top. The front is $4$ by $2$." }],
    walk: [{ say: "The front is $4$ by $2$.", tex: "4 \\times 2" }, { say: "Multiply." }],
  }),
  ask("end-face", "The two ends are green. What is the area of one of them?", S => netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS }), {
    lead: "\\text{end}", col: GREEN, unit: "cm2", answer: 6,
    slips: [{ v: 5, say: "That adds. Area is $3 \\times 2$." }],
    walk: [{ say: "An end is $3$ by $2$.", tex: "3 \\times 2" }, { say: "Multiply." }],
  }),
  ask("box-total", "So what is the total surface area of the box?", S => {
    netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS })
  }, {
    lead: "\\text{Total}", unit: "cm2", answer: 52,
    slips: [{ v: 26, say: "That's one of each. There are two of each." }, { v: 24, say: "That's the volume. Add the areas of all six faces." }],
    walk: [{ say: "Two of each face.", tex: `2 \\times ${c(BLUE, "12")} + 2 \\times ${c(ORANGE, "8")} + 2 \\times ${c(GREEN, "6")}` }, { say: "Add them up." }],
  }),
]

const PART_2: Beat[] = [
  // 4024/11/O/N/11 Q16
  watch("w11", "This prism is $20$ cm long. Its cross-section is the trapezium $ABCD$.", S => { netBoard(S, W11, { t: 1, cols: W11_COLS, labs: W11_LABS, names: W11_NAMES }); look(S) }, 3),
  ask("w11-a", "Calculate the area of the trapezium $ABCD$.", S => netBoard(S, W11, { t: 1, cols: W11_COLS, labs: W11_LABS, names: W11_NAMES }), {
    lead: "\\text{Area}", col: BLUE, unit: "cm2", answer: 12,
    slips: [{ v: 24, say: "That's the parallelogram of two of them. Halve it." }, { v: 18, say: "The parallel sides are $AB$ and $DC$: $2$ and $6$." }],
    walk: [{ say: "Area $= \\tfrac{1}{2}(a + b) \\times h$, with the parallel sides $2$ and $6$ and the height $3$.", tex: "\\tfrac{1}{2}(2 + 6) \\times 3" }, { say: "$2 + 6 = 8$. Halve $8 \\times 3$." }],
  }),
  {
    id: "w11-open",
    say: "Open it out. The ends are two trapeziums, and the sides make one strip.",
    enter: S => { netBoard(S, W11, { t: 1, cols: W11_COLS, labs: W11_LABS }); unfold(S, 0); look(S) },
    cta: "", ctaAfter: 4.2,
  },
  watch("w11-strip", "The strip is as wide as the way round the trapezium, $2 + 5 + 6 + 3 = 16$, and $20$ long.", S => {
    netBoard(S, W11, { t: 0, cols: W11_COLS, labs: [...W11_LABS.slice(0, 4), { key: "ln", face: "r0", i: 1, j: 2, tex: "20", col: ORANGE }] })
    Object.assign(S.P3, { s0: [0, -0.01, 0] as V3, s1: [16, -0.01, 0] as V3 })
    // (drawn 9 long: the diagram is not to scale)
    S.lens[segKey("s0", "s1")] = lens("16", ORANGE)
    S.eqFn = () => row([atom("s", "\\text{strip}"), op("e", "="), atom("w", "16", { col: ORANGE }), op("x", "\\times"), atom("l", "20", { col: ORANGE }), op("e2", "="), atom("t", "320")])
    look(S, ["eq"])
  }, 3.4),
  ask("w11-sa", "Calculate the total surface area of the prism.", S => netBoard(S, W11, { t: 0, cols: W11_COLS, labs: W11_LABS }), {
    lead: "\\text{Total}", unit: "cm2", answer: 344,
    slips: [{ v: 332, say: "That has one end. There are two." }, { v: 320, say: "That's the strip. Add the two ends too." }, { v: 240, say: "That's the volume. Add up the areas of the faces." }],
    walk: [{ say: "The strip is $16 \\times 20 = 320$.", tex: `${c(ORANGE, "320")}` }, { say: "Add the two ends, $12$ each.", tex: `${c(ORANGE, "320")} + 2 \\times ${c(BLUE, "12")}` }],
  }),
]

const PART_3: Beat[] = [
  watch("cyl", "A cylinder has two circles and a curved face.", S => { cylNet(S, 1.6, 3.2, 0, 0); look(S) }, 2.4),
  {
    id: "peel",
    say: "Unroll the curved face, and fold the circles out.",
    enter: S => {
      cylNet(S, 1.6, 3.2, 0, 0)
      S.acts.push({ dur: 0.01, begin: S2 => fitCyl(S2, 1.6, 3.2, true) })
      over(S, 2.6, (S2, e) => { if (S2.unroll) S2.unroll.u = e }, 0.8)
      over(S, 1.4, (S2, e) => { if (S2.unroll) S2.unroll.cap = e }, 0.2)
      look(S)
    },
    cta: "", ctaAfter: 5.4,
  },
  watch("peel-w", "The curved face is a rectangle. Its width is the circumference, $2\\pi r$.", S => { cylNet(S, 1.6, 3.2, 1, 1, { w: "2\\pi r", h: "h", r: "r" }); look(S) }, 3),
  watch("curved", "So the curved face is $2\\pi r \\times h$.", S => {
    cylNet(S, 1.6, 3.2, 1, 1, { w: "2\\pi r", h: "h", r: "r" })
    S.eqFn = () => row([atom("c", "\\text{Curved}"), op("e", "="), atom("w", "2\\pi r", { col: ORANGE }), op("x", "\\times"), atom("h", "h", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.8),
  watch("cyl-total", "Add the two circles: total surface area $= 2\\pi rh + 2\\pi r^2$.", S => {
    cylNet(S, 1.6, 3.2, 1, 1, { w: "2\\pi r", h: "h", r: "r" })
    S.eqFn = () => row([atom("c", "\\text{Total}"), op("e", "="), atom("w", "2\\pi rh", { col: ORANGE }), op("p", "+"), atom("h", "2\\pi r^2", { col: BLUE })])
    look(S, ["eq"])
  }, 3),
  // 4024/21/O/N/12 Q7(b)(ii)
  ask("tin-curved", "A closed tin is $11$ cm high with a diameter of $7$ cm. What is the area of its curved face, to $3$ significant figures?", S => cylNet(S, 1.4, 2.6, 1, 1, { w: "?", h: "11", r: "3.5" }), {
    lead: "\\text{Curved}", col: ORANGE, unit: "cm2", answer: 2 * Math.PI * 3.5 * 11, sf: 3, typed: "2*p*3.5*11",
    slips: [{ v: 2 * Math.PI * 7 * 11, say: "That used the diameter. The radius is $3.5$." }, { v: Math.PI * 3.5 * 11, say: "The width is $2\\pi r$, not $\\pi r$." }],
    walk: [{ say: "Its width is the circumference, $2\\pi r$, with $r = 3.5$.", tex: "2 \\times \\pi \\times 3.5" }, { say: "Times the height, $11$.", tex: "2 \\times \\pi \\times 3.5 \\times 11" }],
  }),
  ask("tin-ends", "And the two circles together?", S => cylNet(S, 1.4, 2.6, 1, 1, { h: "11", r: "3.5" }), {
    lead: "\\text{Circles}", col: BLUE, unit: "cm2", answer: 2 * Math.PI * 3.5 * 3.5, sf: 3, typed: "2*p*3.5^",
    slips: [{ v: Math.PI * 3.5 * 3.5, say: "That's one circle. There are two, the top and the bottom." }, { v: 2 * Math.PI * 49, say: "That used the diameter. The radius is $3.5$." }],
    walk: [{ say: "Each circle is $\\pi r^2$.", tex: "\\pi \\times 3.5^2" }, { say: "There are two of them.", tex: "2 \\times \\pi \\times 3.5^2" }],
  }),
  ask("tin-total", "So what is the total surface area of the tin?", S => cylNet(S, 1.4, 2.6, 1, 1, { h: "11", r: "3.5" }), {
    lead: "\\text{Total}", unit: "cm2", answer: 2 * Math.PI * 3.5 * 11 + 2 * Math.PI * 3.5 * 3.5, sf: 3, typed: "242+77",
    slips: [{ v: 2 * Math.PI * 3.5 * 11, say: "That's the curved face. Add the two circles too." }],
    walk: [{ say: "The curved face and the two circles.", tex: `${c(ORANGE, "242")} + ${c(BLUE, "77.0")}` }, { say: "Add them." }],
  }),
]

const PART_4: Beat[] = [
  // 4024/22/O/N/24 Q3(b)
  watch("tank", "This tank has an open top. Its ends are trapeziums and its base is a square.", S => { tankBoard(S); look(S) }, 3),
  ask("tank-n", "How many faces does the outside of the tank have?", S => tankBoard(S), {
    lead: "\\text{Faces}", answer: 5,
    slips: [{ v: 6, say: "It has an open top. There is no face there." }],
    walk: [{ say: "Two ends, the base, and two sloping sides.", tex: "2 + 1 + 2" }, { say: "There is no top." }],
  }),
  ask("tank-15", "$AB$ is $110$ and $DC$ is $80$. How far does $A$ reach out past $D$?", S => tankHeight(S), {
    lead: "\\text{gap}", col: PINK, unit: "cm", answer: 15,
    slips: [{ v: 30, say: "That's both sides together. Each side gets half." }],
    walk: [{ say: "$AB$ is $30$ longer than $DC$.", tex: "110 - 80 = 30" }, { say: "That's shared between the two ends.", tex: "30 \\div 2" }],
  }),
  ask("tank-h", "Find the height of the trapezium, to $3$ significant figures.", S => tankHeight(S, { gap: "15" }), {
    lead: "h", col: ORANGE, unit: "cm", answer: TH, sf: 3, typed: "r70^-15^",
    slips: [{ v: Math.sqrt(70 * 70 + 15 * 15), say: "That adds the squares. $AD$ is the longest side: take away." }, { v: 55, say: "Use Pythagoras: square, take away, then square root." }],
    walk: [{ say: "$AD$ is the longest side of the right-angled triangle.", tex: "70^2 = 15^2 + h^2" }, { say: "Take $15^2$ away from $70^2$, then square root.", tex: "\\sqrt{70^2 - 15^2}" }],
  }),
  ask("tank-end", "Find the area of one end, $ABCD$, to $3$ significant figures.", S => tankHeight(S, { gap: "15", h: "68.37" }), {
    lead: "\\text{end}", col: BLUE, unit: "cm2", answer: 95 * TH, sf: 3, typed: "95*68.37",
    slips: [{ v: 190 * TH, say: "That's two trapeziums. Take half." }],
    walk: [{ say: "Area $= \\tfrac{1}{2}(a + b) \\times h$.", tex: "\\tfrac{1}{2}(110 + 80) \\times 68.37" }, { say: "Half of $190$ is $95$.", tex: "95 \\times 68.37" }],
  }),
  {
    id: "tank-open",
    say: "Open it out. There is no top, so there are five faces.",
    enter: S => { tankBoard(S); unfold(S, 0); look(S) },
    cta: "", ctaAfter: 4,
  },
  ask("tank-base", "The base is a square. What is its area?", S => tankBoard(S, 0, TANK_LABS.slice(1)), {
    lead: "\\text{base}", col: ORANGE, unit: "cm2", answer: 6400,
    slips: [{ v: 160, say: "That adds. A square's area is side $\\times$ side." }],
    walk: [{ say: "The base is $80$ by $80$.", tex: "80 \\times 80" }, { say: "Multiply." }],
  }),
  ask("tank-side", "Each sloping side is $70$ by $80$. What is its area?", S => tankBoard(S, 0, TANK_LABS.slice(1)), {
    lead: "\\text{side}", col: ORANGE, unit: "cm2", answer: 5600,
    slips: [{ v: 150, say: "That adds. Multiply." }],
    walk: [{ say: "A rectangle $70$ by $80$.", tex: "70 \\times 80" }, { say: "Multiply." }],
  }),
  ask("tank-total", "Calculate the total surface area of the outside of the tank, to $3$ significant figures.", S => tankBoard(S, 0, TANK_LABS.slice(1)), {
    lead: "\\text{Total}", unit: "cm2", answer: 2 * 95 * TH + 6400 + 2 * 5600, sf: 3, typed: "2*6496+6400+2*5600",
    slips: [
      { v: 2 * 95 * TH + 6400 + 2 * 5600 + 110 * 80, say: "It has an open top. Leave the top out." },
      { v: 95 * TH + 6400 + 2 * 5600, say: "There are two ends." },
      { v: 2 * 95 * TH + 6400 + 5600, say: "There are two sloping sides." },
    ],
    walk: [
      { say: "Two ends, the base, and two sloping sides.", tex: `2 \\times ${c(BLUE, "6496")} + ${c(ORANGE, "6400")} + 2 \\times ${c(ORANGE, "5600")}` },
      { say: "Add them, then round to $3$ significant figures." },
    ],
  }),
  {
    id: "end",
    say: "Surface area is the total area of every face. Open the solid out and add them up.",
    enter: S => { netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs: BOX_LABS }); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["sa", "Surface area"],
  ["w11", "Prisms"],
  ["cyl", "Cylinders"],
  ["tank", "An open tank"],
])

