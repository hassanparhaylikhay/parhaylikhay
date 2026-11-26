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
 * Every part a phrase or a Show me how step names breathes on the figure,
 * and every area the student works out is written on its face and stays
 * there, so a total is the sum of what is on the board.
 *
 * Colours: the ends (a prism's ends, a cylinder's circles) blue, the faces
 * round the sides orange, a total green, an unknown pink.
 */

import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import { type Scene, type V3, BLUE, ORANGE, GREEN, PINK, CHALK, YELLOW, segKey, addSeg, goodView, resetBeat } from "./scene"
import { type Beat, look, watch, askBeat, lens, num, c } from "./kit"
import { stripNet } from "./solids"
import { type NetLab, netBoard, glowFaces, glowEdges, tagFaces, addLab, dropLab, unfold } from "./netkit"
const cm2 = (v: string | number) => `${v}\\text{ cm}^2`

/** A number typed on the calculator keys: `lead = [box] cm²`; `then` writes the result on the figure. */
function ask(id: string, text: string, board: (S: Scene) => void, o: {
  lead: string; col?: string; unit?: "cm" | "cm2" | ""; answer: number; shown?: string; typed?: string
  sf?: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[]; then?: (S: Scene) => void
}): Beat {
  const unit = o.unit === "" ? "" : o.unit === "cm" ? "\\text{ cm}" : "\\text{ cm}^2"
  return askBeat(id, text, S => { board(S); S.keyRows = 3 }, {
    name: o.lead, col: o.col ?? CHALK, answer: o.answer, shown: `${o.shown ?? num(o.answer)}${unit}`, typed: o.typed ?? String(o.answer),
    exact: !o.sf, sf: o.sf, slips: o.slips, walk: o.walk, after: unit || undefined, then: o.then,
  })
}
const over = (S: Scene, dur: number, set: (S: Scene, e: number) => void, wait = 0.5, end?: (S: Scene) => void) =>
  S.acts.push({ dur: wait }, { dur, run: (S2, _e, t) => set(S2, t), end: S2 => { set(S2, 1); end?.(S2) } })
/** Things to do in turn, a pause before each. */
const inTurn = (S: Scene, steps: [number, (S: Scene) => void][]) => { for (const [wait, fn] of steps) S.acts.push({ dur: wait, end: fn }) }

// ── the box ──────────────────────────────────────────────────────────────

/** The box: 4 long, 3 deep, 2 high, as a strip of four faces (bottom, end, top, end) with the front and back. */
const BOX = stripNet([[0, 0], [4, 0], [4, 2], [0, 2]], 3)
const BOX_PAIRS = { r0: BLUE, r2: BLUE, endA: ORANGE, endB: ORANGE, r1: GREEN, r3: GREEN }
const TOPS = ["r0", "r2"], FRONTS = ["endA", "endB"], ENDS = ["r1", "r3"]
/** Each face's sides, labelled once it is the one asked about. */
const BOX_TOP: NetLab[] = [{ key: "tl", face: "r2", i: 0, j: 1, tex: "4", col: BLUE }, { key: "tw", face: "r2", i: 1, j: 2, tex: "3", col: BLUE }]
const BOX_FRONT: NetLab[] = [{ key: "fl", face: "endA", i: 0, j: 1, tex: "4", col: ORANGE }, { key: "fh", face: "endA", i: 1, j: 2, tex: "2", col: ORANGE }]
const BOX_END: NetLab[] = [{ key: "el", face: "r1", i: 0, j: 1, tex: "2", col: GREEN }, { key: "ew", face: "r1", i: 1, j: 2, tex: "3", col: GREEN }]
/** The box flat, with the areas found so far written on their faces. */
function boxFlat(S: Scene, found: ("top" | "front" | "end")[], labs: NetLab[] = [], glow: string[] = []) {
  const tags: Record<string, string> = {}
  if (found.includes("top")) for (const f of TOPS) tags[f] = cm2(12)
  if (found.includes("front")) for (const f of FRONTS) tags[f] = cm2(8)
  if (found.includes("end")) for (const f of ENDS) tags[f] = cm2(6)
  netBoard(S, BOX, { t: 0, cols: BOX_PAIRS, labs, tags, glow })
}

// ── the trapezium prism, 4024/11/O/N/11 Q16 ──────────────────────────────

/** Its cross-section ABCD (DC = 6, CB = 5, BA = 2, AD = 3, a right angle at D); 20 cm long, drawn 9 (not to scale). */
const W11 = stripNet([[0, 0], [6, 0], [2, 3], [0, 3]], 9)
const W11_END: NetLab[] = [
  { key: "dc", face: "endA", i: 0, j: 1, tex: "6", col: BLUE },
  { key: "cb", face: "endA", i: 1, j: 2, tex: "5", col: BLUE },
  { key: "ba", face: "endA", i: 2, j: 3, tex: "2", col: BLUE },
  { key: "ad", face: "endA", i: 3, j: 0, tex: "3", col: BLUE },
]
const W11_LEN: NetLab = { key: "ln", face: "r0", i: 1, j: 2, tex: "20", col: ORANGE }
const W11_NAMES: Record<string, [string, number]> = { D: ["endA", 0], C: ["endA", 1], B: ["endA", 2], A: ["endA", 3] }
const W11_COLS = { endA: BLUE, endB: BLUE, r0: ORANGE, r1: ORANGE, r2: ORANGE, r3: ORANGE }
const STRIP = ["r0", "r1", "r2", "r3"], W11_ENDS = ["endA", "endB"]
/**
 * The bottom edge of each rectangle in the strip: as long as the side of the
 * trapezium it folds onto. Written inside its rectangle, so the strip's whole
 * width, 16, can sit under the edge (and the 6 is clear of the end's area).
 * The orange 6 is the trapezium's DC too, so DC's own 6 gives way to it.
 */
const STRIP_W: NetLab[] = [
  { key: "w0", face: "r0", i: 0, j: 1, tex: "6", col: ORANGE, in: true },
  { key: "w1", face: "r1", i: 0, j: 1, tex: "5", col: ORANGE, in: true },
  { key: "w2", face: "r2", i: 0, j: 1, tex: "2", col: ORANGE, in: true },
  { key: "w3", face: "r3", i: 0, j: 1, tex: "3", col: ORANGE, in: true },
]
/** The prism, folded or flat, its ends' area written on them once found (and the strip's). */
function w11Board(S: Scene, t: number, o: { ends?: boolean; strip?: boolean; widths?: boolean; glow?: string[] } = {}) {
  const tags: Record<string, string> = {}
  if (o.ends) for (const f of W11_ENDS) tags[f] = cm2(12)
  if (o.strip) tags.r1 = cm2(320)
  const end = o.widths ? W11_END.filter(L => L.key !== "dc") : W11_END
  netBoard(S, W11, { t, cols: W11_COLS, labs: [...end, W11_LEN, ...(o.widths ? STRIP_W : [])], names: t > 0.5 ? W11_NAMES : {}, tags, glow: o.glow })
}

// ── the open tank, 4024/22/O/N/24 Q3(b) ──────────────────────────────────

/** Its ends are the trapezium ABCD (AB = 110, DC = 80, AD = BC = 70), its base a square, no top. */
const TH = Math.sqrt(70 * 70 - 15 * 15)
const END_A = 95 * TH
const TANK = stripNet([[0, 0], [80, 0], [95, TH], [-15, TH]], 80, 2)
const TANK_LABS: NetLab[] = [
  { key: "ab", face: "endA", i: 2, j: 3, tex: "110" },
  { key: "dc", face: "endA", i: 0, j: 1, tex: "80" },
  { key: "ad", face: "endA", i: 3, j: 0, tex: "70" },
  { key: "dh", face: "r0", i: 1, j: 2, tex: "80" },
]
const TANK_NAMES: Record<string, [string, number]> = { D: ["endA", 0], C: ["endA", 1], B: ["endA", 2], A: ["endA", 3], H: ["endB", 0], G: ["endB", 1], F: ["endB", 2], E: ["endB", 3] }
const TANK_COLS = { endA: BLUE, endB: BLUE, r0: ORANGE, r1: ORANGE, r3: ORANGE }
const T_ENDS = ["endA", "endB"], T_SIDES = ["r1", "r3"]
/** The tank, folded or flat; the areas found so far written on their faces. */
function tankBoard(S: Scene, t: number, o: { found?: ("end" | "base" | "side")[]; labs?: NetLab[]; glow?: string[] } = {}) {
  const f = o.found ?? [], tags: Record<string, string> = {}
  if (f.includes("end")) for (const x of T_ENDS) tags[x] = cm2(Math.round(END_A))
  if (f.includes("base")) tags.r0 = cm2(6400)
  if (f.includes("side")) for (const x of T_SIDES) tags[x] = cm2(5600)
  netBoard(S, TANK, { t, cols: TANK_COLS, labs: o.labs ?? TANK_LABS, names: t > 0.5 ? TANK_NAMES : {}, tags, glow: o.glow })
}
/** The tank seen from its end: A's height drawn down to the floor, and how far A and B stick out past D and C. */
function tankEnd(S: Scene, o: { gap?: boolean; h?: string; found?: ("end")[] } = {}) {
  tankBoard(S, 1, { found: o.found })
  Object.assign(S.P3, { Ap: [-15, 0, 0] as V3, Dd: [0, 0, 0] as V3, Aa: [-15, 0, TH] as V3, Bp: [95, 0, 0] as V3, Cc: [80, 0, 0] as V3 })
  addSeg(S, "Aa", "Ap", { col: ORANGE, grown: true })
  addSeg(S, "Ap", "Dd", { col: o.gap ? GREEN : PINK, grown: true })
  S.lens[segKey("Ap", "Dd")] = lens(o.gap ? "15" : "?", o.gap ? GREEN : PINK)
  S.lens[segKey("Aa", "Ap")] = lens(o.h ?? "h", ORANGE)
  S.rights = [{ at: "Ap", a: "Aa", b: "Dd" }]
  // face the end, so the trapezium is seen at its true shape; D's letter below its corner, clear of the gap's label
  S.letterDir = { D: [0.4, 1] }
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

/** Where along the unrolled face's long edge its width is written: left of the circle on its middle. */
const W_ALONG = 0.2
/**
 * A cylinder (radius r, height h) unrolled `u` of the way and its circles
 * swung out `cap`. Flat: the rectangle's width and height, the circle's
 * radius, and words in the middle of each part (its area once found).
 */
function cylNet(S: Scene, r: number, h: number, u: number, cap: number, o: { w?: string; h?: string; r?: string; d?: string; side?: string; circles?: string; glow?: ("side" | "top" | "bottom")[] } = {}) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  S.faces = null
  S.unroll = { r, h, u, cap, cols: { side: ORANGE, ends: BLUE }, glow: o.glow }
  const W = Math.PI * r
  fitCyl(S, r, h, u > 0.5)
  // fitted tight to the view it is seen from (a loose fit leaves the tin's net too small to read)
  S.fitRect = [-12, 16]
  Object.assign(S.P3, { U1: [-W, -r, 0], U2: [W, -r, 0], U3: [W, -r, h], TC: [0, -r, h + r], TR: [r, -r, h + r], BC: [0, -r, -r], O: [0, 0, h], R: [r, 0, h], RL: [-r, 0, h], B0: [r, 0, 0], MID: [0, -r, h / 2] } as Record<string, V3>)
  if (u > 0.99 && cap > 0.99) {
    // the width is written off to the left, clear of the circle that sits on the middle of that edge
    if (o.w) S.lens[segKey("U1", "U2")] = lens(o.w, o.w === "?" ? PINK : ORANGE, W_ALONG)
    if (o.h) S.lens[segKey("U2", "U3")] = lens(o.h, ORANGE)
    if (o.r) { addSeg(S, "TC", "TR", { col: BLUE, grown: true }); S.lens[segKey("TC", "TR")] = lens(o.r, BLUE) }
    if (o.side) S.tags.push({ key: "side", at: "MID", tex: o.side, col: o.side.includes("cm") ? GREEN : ORANGE })
    if (o.circles) S.tags.push({ key: "top", at: [0, -r, h + 1.45 * r] as V3, tex: o.circles, col: o.circles.includes("cm") ? GREEN : BLUE }, { key: "bot", at: "BC", tex: o.circles, col: o.circles.includes("cm") ? GREEN : BLUE })
  } else {
    if (o.r) { addSeg(S, "O", "R", { col: BLUE, grown: true }); S.lens[segKey("O", "R")] = lens(o.r, BLUE) }
    if (o.d) { addSeg(S, "RL", "R", { col: BLUE, grown: true }); S.lens[segKey("RL", "R")] = lens(o.d, BLUE) }
    if (o.h) S.lens[segKey("R", "B0")] = lens(o.h, ORANGE)
  }
  goodView(S, -12, 16)
}
const glowCyl = (S: Scene, parts: ("side" | "top" | "bottom")[]) => { if (S.unroll) S.unroll.glow = parts }

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  {
    id: "sa",
    say: "*Surface area* is the total area of all the faces of a solid.",
    enter: S => {
      netBoard(S, BOX, { t: 1, cols: BOX_PAIRS })
      // every face breathes in turn, then all of them
      inTurn(S, [[0.8, S2 => glowFaces(S2, TOPS)], [1, S2 => glowFaces(S2, FRONTS)], [1, S2 => glowFaces(S2, ENDS)], [1, S2 => glowFaces(S2, [...TOPS, ...FRONTS, ...ENDS])]])
      look(S)
    },
    cta: "", ctaAfter: 4.2,
  },
  {
    id: "open",
    say: "Let's open this box out flat.",
    enter: S => { netBoard(S, BOX, { t: 1, cols: BOX_PAIRS }); unfold(S, 0); look(S) },
    cta: "", ctaAfter: 4,
  },
  {
    id: "pairs",
    say: "Its six faces come in pairs: top and bottom, front and back, and two ends.",
    enter: S => {
      boxFlat(S, [])
      inTurn(S, [[0.6, S2 => glowFaces(S2, TOPS)], [1.4, S2 => glowFaces(S2, FRONTS)], [1.4, S2 => glowFaces(S2, ENDS)], [1.4, S2 => glowFaces(S2, [])]])
      look(S)
    },
    cta: "", ctaAfter: 5,
  },
  ask("top", "The top and the bottom are blue. What is the area of one of them?", S => boxFlat(S, [], BOX_TOP, TOPS), {
    lead: "\\text{top}", col: BLUE, answer: 12,
    slips: [{ v: 7, say: "That adds. Area is length $\\times$ width." }, { v: 24, say: "That's both of them. Just one." }],
    walk: [
      { say: "This is the top. It's $4$ cm long and $3$ cm wide.", show: S => { glowFaces(S, ["r2"]); glowEdges(S, ["tl", "tw"], BLUE) } },
      { say: "A rectangle's area is its length times its width.", tex: `${c(BLUE, "4")} \\times ${c(BLUE, "3")}`, show: S => { glowFaces(S, ["r2"]); glowEdges(S, []) } },
    ],
    then: S => tagFaces(S, TOPS, cm2(12)),
  }),
  ask("front", "The front and the back are orange. What is the area of one of them?", S => boxFlat(S, ["top"], BOX_FRONT, FRONTS), {
    lead: "\\text{front}", col: ORANGE, answer: 8,
    slips: [{ v: 6, say: "That adds. Area is length $\\times$ height." }, { v: 12, say: "That's the top. The front is $4$ by $2$." }],
    walk: [
      { say: "This is the front. It's $4$ cm long and $2$ cm high.", show: S => { glowFaces(S, ["endA"]); glowEdges(S, ["fl", "fh"], ORANGE) } },
      { say: "Its area is its length times its height.", tex: `${c(ORANGE, "4")} \\times ${c(ORANGE, "2")}`, show: S => { glowFaces(S, ["endA"]); glowEdges(S, []) } },
    ],
    then: S => tagFaces(S, FRONTS, cm2(8)),
  }),
  ask("end-face", "The two ends are green. What is the area of one of them?", S => boxFlat(S, ["top", "front"], BOX_END, ENDS), {
    lead: "\\text{end}", col: GREEN, answer: 6,
    slips: [{ v: 5, say: "That adds. Area is $2 \\times 3$." }],
    walk: [
      { say: "This is an end. It's $2$ cm by $3$ cm.", show: S => { glowFaces(S, ["r1"]); glowEdges(S, ["el", "ew"], GREEN) } },
      { say: "Multiply its two sides.", tex: `${c(GREEN, "2")} \\times ${c(GREEN, "3")}`, show: S => { glowFaces(S, ["r1"]); glowEdges(S, []) } },
    ],
    then: S => tagFaces(S, ENDS, cm2(6)),
  }),
  ask("box-total", "Every face has its area on it now. What is the total surface area?", S => boxFlat(S, ["top", "front", "end"]), {
    lead: "\\text{Total}", answer: 52,
    slips: [{ v: 26, say: "That's one of each. Add all six faces." }, { v: 24, say: "That's the volume. Add the areas of all six faces." }],
    walk: [
      { say: "Add the areas of all six faces.", tex: "12 + 12 + 8 + 8 + 6 + 6", show: S => glowFaces(S, [...TOPS, ...FRONTS, ...ENDS]) },
      { say: "Or add each pair: the blue ones, the orange ones, the green ones.", tex: `${c(BLUE, "24")} + ${c(ORANGE, "16")} + ${c(GREEN, "12")}`, show: S => inTurn(S, [[0.1, S2 => glowFaces(S2, TOPS)], [1.1, S2 => glowFaces(S2, FRONTS)], [1.1, S2 => glowFaces(S2, ENDS)]]) },
    ],
  }),
]

const PART_2: Beat[] = [
  // 4024/11/O/N/11 Q16
  {
    id: "w11",
    say: "This prism is $20$ cm long. Its cross-section is the trapezium $ABCD$.",
    enter: S => {
      w11Board(S, 1)
      inTurn(S, [[0.8, S2 => glowEdges(S2, ["ln"], ORANGE)], [1.6, S2 => { glowEdges(S2, []); glowFaces(S2, ["endA"]) }]])
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  ask("w11-a", "Calculate the area of the trapezium $ABCD$.", S => w11Board(S, 1, { glow: ["endA"] }), {
    lead: "\\text{Area}", col: BLUE, answer: 12,
    slips: [{ v: 24, say: "That's the parallelogram of two of them. Halve it." }, { v: 18, say: "The parallel sides are $AB$ and $DC$: $2$ and $6$." }],
    walk: [
      { say: "Its parallel sides are $AB = 2$ and $DC = 6$. Add them.", tex: "2 + 6 = 8", show: S => { glowFaces(S, []); glowEdges(S, ["ba", "dc"], BLUE) } },
      { say: "Its height is $AD = 3$, at right angles to them. Times the height, then halve.", tex: "8 \\times 3 \\div 2", show: S => glowEdges(S, ["ad"], ORANGE) },
    ],
    then: S => tagFaces(S, W11_ENDS, cm2(12)),
  }),
  {
    id: "w11-open",
    say: "Open it out. The two ends are trapeziums, and the sides make one strip.",
    enter: S => {
      w11Board(S, 1, { ends: true })
      unfold(S, 0)
      // flat, the corner letters go (the flat net is drawn without them from here; on a phone they sat on the 3 and the 2)
      S.acts.push({ dur: 0.01, end: S2 => { S2.names = {} } })
      inTurn(S, [[0.3, S2 => glowFaces(S2, W11_ENDS)], [1.4, S2 => glowFaces(S2, STRIP)], [1.6, S2 => glowFaces(S2, [])]])
      look(S)
    },
    cta: "", ctaAfter: 5,
  },
  {
    id: "w11-strip",
    say: "The strip is as wide as the way round the trapezium: $6 + 5 + 2 + 3 = 16$.",
    enter: S => {
      w11Board(S, 0, { ends: true })
      // each side of the trapezium lights, and the rectangle it folds onto gets its width
      STRIP_W.forEach((w, i) => {
        const side = ["dc", "cb", "ba", "ad"][i]
        S.acts.push({ dur: i ? 1.1 : 0.8, end: S2 => { if (!i) dropLab(S2, "dc"); addLab(S2, w); glowEdges(S2, [side, w.key], ORANGE); glowFaces(S2, [`r${i}`]) } })
      })
      S.acts.push({ dur: 1.2, end: S2 => {
        glowEdges(S2, []); glowFaces(S2, STRIP)
        Object.assign(S2.P3, { s0: [0, -0.02, 0] as V3, s1: [16, -0.02, 0] as V3 })
        S2.lens[segKey("s0", "s1")] = lens("16", ORANGE)
      } })
      S.eqFn = () => row([atom("w", "\\text{width}"), op("e", "="), atom("a", "6 + 5 + 2 + 3", { col: ORANGE }), op("e2", "="), atom("t", "16", { col: ORANGE })])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 6.4,
  },
  ask("w11-s", "The strip is $16$ cm by $20$ cm. What is its area?", S => {
    w11Board(S, 0, { ends: true, widths: true, glow: STRIP })
    Object.assign(S.P3, { s0: [0, -0.02, 0] as V3, s1: [16, -0.02, 0] as V3 })
    S.lens[segKey("s0", "s1")] = lens("16", ORANGE)
  }, {
    lead: "\\text{strip}", col: ORANGE, answer: 320,
    slips: [{ v: 36, say: "That adds. The strip is a rectangle: multiply." }],
    walk: [
      { say: "The strip is one long rectangle, $16$ wide.", show: S => { glowFaces(S, STRIP); S.edgeGlow = { [segKey("s0", "s1")]: ORANGE } } },
      { say: "It's $20$ long. Multiply.", tex: `${c(ORANGE, "16")} \\times ${c(ORANGE, "20")}`, show: S => glowEdges(S, ["ln"], ORANGE) },
    ],
    then: S => tagFaces(S, ["r1"], cm2(320)),
  }),
  ask("w11-sa", "Calculate the total surface area of the prism.", S => w11Board(S, 0, { ends: true, strip: true }), {
    lead: "\\text{Total}", answer: 344,
    slips: [{ v: 332, say: "That has one end. There are two." }, { v: 320, say: "That's the strip. Add the two ends too." }, { v: 240, say: "That's the volume. Add up the areas of the faces." }],
    walk: [
      { say: "The strip is $320$ cm$^2$.", show: S => glowFaces(S, STRIP) },
      { say: "Add the two ends, $12$ cm$^2$ each.", tex: `${c(ORANGE, "320")} + ${c(BLUE, "12")} + ${c(BLUE, "12")}`, show: S => glowFaces(S, W11_ENDS) },
    ],
  }),
]

const PART_3: Beat[] = [
  {
    id: "cyl",
    say: "A cylinder has two circles and a curved face.",
    enter: S => { cylNet(S, 1.6, 3.2, 0, 0); inTurn(S, [[0.8, S2 => glowCyl(S2, ["top", "bottom"])], [1.4, S2 => glowCyl(S2, ["side"])], [1.4, S2 => glowCyl(S2, [])]]); look(S) },
    cta: "", ctaAfter: 3.6,
  },
  {
    id: "peel",
    say: "Unroll the curved face, and fold the circles out.",
    enter: S => {
      cylNet(S, 1.6, 3.2, 0, 0, { glow: ["side"] })
      S.acts.push({ dur: 0.01, begin: S2 => fitCyl(S2, 1.6, 3.2, true) })
      over(S, 2.6, (S2, e) => { if (S2.unroll) S2.unroll.u = e }, 0.8)
      S.acts.push({ dur: 0.01, end: S2 => glowCyl(S2, ["top", "bottom"]) })
      over(S, 1.4, (S2, e) => { if (S2.unroll) S2.unroll.cap = e }, 0.2, S2 => glowCyl(S2, []))
      look(S)
    },
    cta: "", ctaAfter: 5.4,
  },
  {
    id: "peel-w",
    say: "The curved face is a rectangle. Its width is the circumference, $2\\pi r$.",
    enter: S => {
      cylNet(S, 1.6, 3.2, 1, 1, { h: "h", r: "r", glow: ["side"] })
      // the width lights with the circle's edge it came from
      inTurn(S, [[0.8, S2 => { S2.lens[segKey("U1", "U2")] = lens("2\\pi r", ORANGE, W_ALONG); S2.edgeGlow = { [segKey("U1", "U2")]: ORANGE }; glowCyl(S2, ["side", "top"]) }]])
      look(S)
    },
    cta: "", ctaAfter: 3.4,
  },
  watch("curved", "So the curved face is $2\\pi r \\times h$.", S => {
    cylNet(S, 1.6, 3.2, 1, 1, { w: "2\\pi r", h: "h", r: "r", side: "2\\pi r \\times h", glow: ["side"] })
    S.edgeGlow = { [segKey("U1", "U2")]: ORANGE, [segKey("U2", "U3")]: ORANGE }
    S.eqFn = () => row([atom("c", "\\text{Curved}"), op("e", "="), atom("w", "2\\pi r", { col: ORANGE }), op("x", "\\times"), atom("h", "h", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.8),
  watch("cyl-total", "Each circle is $\\pi r^2$. So the total surface area is $2\\pi rh + 2\\pi r^2$.", S => {
    cylNet(S, 1.6, 3.2, 1, 1, { w: "2\\pi r", h: "h", r: "r", side: "2\\pi rh", circles: "\\pi r^2", glow: ["top", "bottom"] })
    S.eqFn = () => row([atom("c", "\\text{Total}"), op("e", "="), atom("w", "2\\pi rh", { col: ORANGE }), op("p", "+"), atom("h", "2\\pi r^2", { col: BLUE })])
    look(S, ["eq"])
  }, 3.2),
  // 4024/21/O/N/12 Q7(b)(ii)
  ask("tin-curved", "A closed tin is $11$ cm high with a diameter of $7$ cm. What is the area of its curved face, to $3$ significant figures?", S => cylNet(S, 1.4, 2.6, 1, 1, { w: "?", h: "11", r: "3.5", glow: ["side"] }), {
    lead: "\\text{Curved}", col: ORANGE, answer: 2 * Math.PI * 3.5 * 11, sf: 3, typed: "2*p*3.5*11",
    slips: [{ v: 2 * Math.PI * 7 * 11, say: "That used the diameter. The radius is $3.5$." }, { v: Math.PI * 3.5 * 11, say: "The width is $2\\pi r$, not $\\pi r$." }],
    walk: [
      { say: "Its width is the circle's circumference, $2\\pi r$, with $r = 3.5$.", tex: "2 \\times \\pi \\times 3.5", show: S => { glowCyl(S, ["top"]); S.edgeGlow = { [segKey("U1", "U2")]: ORANGE, [segKey("TC", "TR")]: BLUE } } },
      { say: "Times its height, $11$.", tex: "2 \\times \\pi \\times 3.5 \\times 11", show: S => { glowCyl(S, ["side"]); S.edgeGlow = { [segKey("U2", "U3")]: ORANGE } } },
    ],
  }),
  ask("tin-circle", "The curved face is $242$ cm$^2$. Now, what is the area of one circle, to $3$ significant figures?", S => cylNet(S, 1.4, 2.6, 1, 1, { h: "11", r: "3.5", side: cm2(242), glow: ["top"] }), {
    lead: "\\text{circle}", col: BLUE, answer: Math.PI * 3.5 * 3.5, sf: 3, typed: "p*3.5^",
    slips: [{ v: Math.PI * 49, say: "That used the diameter. The radius is $3.5$." }, { v: 2 * Math.PI * 3.5, say: "That's its circumference. Its area is $\\pi r^2$." }],
    walk: [
      { say: "A circle's area is $\\pi r^2$. Its radius is $3.5$.", show: S => { glowCyl(S, ["top"]); S.edgeGlow = { [segKey("TC", "TR")]: BLUE } } },
      { say: "Square the radius, then times $\\pi$.", tex: "\\pi \\times 3.5^2", show: S => { glowCyl(S, ["top"]); S.edgeGlow = {} } },
    ],
  }),
  ask("tin-total", "Every part has its area on it now. What is the total surface area of the tin?", S => cylNet(S, 1.4, 2.6, 1, 1, { h: "11", r: "3.5", side: cm2(242), circles: cm2(38.5) }), {
    lead: "\\text{Total}", answer: 242 + 38.5 + 38.5, sf: 3, typed: "242+38.5+38.5",
    slips: [{ v: 242 + 38.5, say: "That has one circle. A closed tin has two, the top and the bottom." }, { v: 242, say: "Add the two circles too." }],
    walk: [
      { say: "The curved face.", show: S => glowCyl(S, ["side"]) },
      { say: "And the two circles.", tex: `${c(ORANGE, "242")} + ${c(BLUE, "38.5")} + ${c(BLUE, "38.5")}`, show: S => glowCyl(S, ["top", "bottom"]) },
    ],
  }),
]

const PART_4: Beat[] = [
  // 4024/22/O/N/24 Q3(b)
  {
    id: "tank",
    say: "This tank has an open top. Its ends are trapeziums and its base is a square.",
    enter: S => {
      tankBoard(S, 1)
      Object.assign(S.P3, { tA: [-15, 0, TH] as V3, tB: [95, 0, TH] as V3, tF: [95, 80, TH] as V3, tE: [-15, 80, TH] as V3 })
      const rim = { [segKey("tA", "tB")]: YELLOW, [segKey("tB", "tF")]: YELLOW, [segKey("tF", "tE")]: YELLOW, [segKey("tE", "tA")]: YELLOW }
      inTurn(S, [[0.6, S2 => { S2.edgeGlow = rim }], [1.6, S2 => { S2.edgeGlow = {}; glowFaces(S2, T_ENDS) }], [1.6, S2 => glowFaces(S2, ["r0"])], [1.4, S2 => glowFaces(S2, [])]])
      look(S)
    },
    cta: "", ctaAfter: 5.4,
  },
  ask("tank-n", "How many faces does the outside of the tank have?", S => tankBoard(S, 1), {
    lead: "\\text{Faces}", unit: "", answer: 5,
    slips: [{ v: 6, say: "It has an open top. There is no face there." }],
    walk: [
      { say: "Two ends.", tex: "2", show: S => glowFaces(S, T_ENDS) },
      { say: "The base and two sloping sides. There is no top.", tex: "2 + 1 + 2", show: S => glowFaces(S, ["r0", ...T_SIDES]) },
    ],
  }),
  ask("tank-15", "$AB$ is $110$ and $DC$ is $80$. How far does $A$ reach out past $D$?", S => tankEnd(S), {
    lead: "\\text{gap}", col: PINK, unit: "cm", answer: 15,
    slips: [{ v: 30, say: "That's both ends together. Each end gets half." }],
    walk: [
      { say: "$AB$ is $30$ longer than $DC$.", tex: "110 - 80 = 30", show: S => glowEdges(S, ["ab", "dc"]) },
      { say: "The extra is shared: half sticks out at each end.", tex: "30 \\div 2", show: S => { addSeg(S, "Cc", "Bp", { col: PINK, grown: true }); S.edgeGlow = { [segKey("Ap", "Dd")]: PINK, [segKey("Cc", "Bp")]: PINK } } },
    ],
  }),
  ask("tank-h", "Find the height of the trapezium, to $3$ significant figures.", S => tankEnd(S, { gap: true }), {
    lead: "h", col: ORANGE, unit: "cm", answer: TH, sf: 3, typed: "r70^-15^",
    slips: [{ v: Math.sqrt(70 * 70 + 15 * 15), say: "That adds the squares. $AD$ is the longest side: take away." }, { v: 55, say: "Use Pythagoras: square, take away, then square root." }],
    walk: [
      { say: "This right-angled triangle has $AD = 70$ as its longest side.", tex: "70^2 = 15^2 + h^2", show: S => { S.tris = [{ id: "t", pts: ["Aa", "Ap", "Dd"], col: ORANGE, pulse: true }]; glowEdges(S, ["ad"], ORANGE) } },
      { say: "Take $15^2$ away from $70^2$, then square root.", tex: "\\sqrt{70^2 - 15^2}", show: S => { S.edgeGlow = { [segKey("Aa", "Ap")]: ORANGE } } },
    ],
  }),
  ask("tank-end", "The height is $68.37$. Find the area of one end, $ABCD$, to $3$ significant figures.", S => tankEnd(S, { gap: true, h: "68.37" }), {
    lead: "\\text{end}", col: BLUE, unit: "cm2", answer: END_A, sf: 3, typed: "95*68.37",
    slips: [{ v: 2 * END_A, say: "That's two trapeziums. Take half." }],
    walk: [
      { say: "The parallel sides are $110$ and $80$. Add them.", tex: "110 + 80 = 190", show: S => glowEdges(S, ["ab", "dc"], BLUE) },
      { say: "Times the height, then halve it.", tex: "190 \\times 68.37 \\div 2", show: S => { S.edgeGlow = { [segKey("Aa", "Ap")]: ORANGE } } },
    ],
    then: S => tagFaces(S, T_ENDS, cm2(Math.round(END_A))),
  }),
  {
    id: "tank-open",
    say: "Open it out. There is no top, so there are five faces.",
    enter: S => { tankBoard(S, 1, { found: ["end"] }); unfold(S, 0); inTurn(S, [[3.8, S2 => glowFaces(S2, ["r0", ...T_SIDES, ...T_ENDS])], [1.6, S2 => glowFaces(S2, [])]]); look(S) },
    cta: "", ctaAfter: 5,
  },
  ask("tank-base", "The base is a square. What is its area?", S => tankBoard(S, 0, { found: ["end"], glow: ["r0"], labs: TANK_LABS.slice(1) }), {
    lead: "\\text{base}", col: ORANGE, unit: "cm2", answer: 6400,
    slips: [{ v: 160, say: "That adds. A square's area is side $\\times$ side." }],
    walk: [
      { say: "This is the base.", show: S => glowFaces(S, ["r0"]) },
      { say: "It's a square, $80$ by $80$.", tex: "80 \\times 80", show: S => glowEdges(S, ["dc", "dh"], ORANGE) },
    ],
    then: S => tagFaces(S, ["r0"], cm2(6400)),
  }),
  ask("tank-side", "Each sloping side is $70$ by $80$. What is its area?", S => tankBoard(S, 0, { found: ["end", "base"], glow: T_SIDES, labs: TANK_LABS.slice(1) }), {
    lead: "\\text{side}", col: ORANGE, unit: "cm2", answer: 5600,
    slips: [{ v: 150, say: "That adds. Multiply." }],
    walk: [
      { say: "These are the two sloping sides.", show: S => glowFaces(S, T_SIDES) },
      { say: "Each is a rectangle $70$ by $80$.", tex: "70 \\times 80", show: S => { glowFaces(S, ["r3"]); glowEdges(S, ["ad"], ORANGE) } },
    ],
    then: S => tagFaces(S, T_SIDES, cm2(5600)),
  }),
  ask("tank-total", "Every face has its area on it now. Calculate the total surface area of the outside, to $3$ significant figures.", S => tankBoard(S, 0, { found: ["end", "base", "side"], labs: [] }), {
    lead: "\\text{Total}", unit: "cm2", answer: 2 * Math.round(END_A) + 6400 + 2 * 5600, sf: 3, typed: `${2 * Math.round(END_A) + 6400 + 2 * 5600}`,
    slips: [
      { v: 2 * Math.round(END_A) + 6400 + 2 * 5600 + 110 * 80, say: "It has an open top. Leave the top out." },
      { v: Math.round(END_A) + 6400 + 2 * 5600, say: "There are two ends." },
      { v: 2 * Math.round(END_A) + 6400 + 5600, say: "There are two sloping sides." },
    ],
    walk: [
      { say: "Add the five faces: two ends, the base and two sloping sides.", tex: `${c(BLUE, "6496")} + ${c(BLUE, "6496")} + ${c(ORANGE, "6400")} + ${c(ORANGE, "5600")} + ${c(ORANGE, "5600")}`, show: S => glowFaces(S, ["r0", ...T_SIDES, ...T_ENDS]) },
      { say: "Then round your total to $3$ significant figures.", show: S => glowFaces(S, []) },
    ],
  }),
  {
    id: "end",
    say: "Surface area is the total area of every face. Open the solid out and add them up.",
    enter: S => { boxFlat(S, ["top", "front", "end"]); look(S) },
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
