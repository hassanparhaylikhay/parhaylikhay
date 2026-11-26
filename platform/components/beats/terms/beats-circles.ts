/**
 * Circles (5.3, lesson 1 of 2): circumference and area, one tiny idea per
 * beat, on the terms board.
 *
 * The student rolls a circle one full turn along a line: its edge paints
 * the line, and three diameters laid along it fall a little short (π).
 * Circumference = πd = 2πr. Working backwards: π moved across the = (a pie
 * chart's circumference), and a running track's two curved ends put
 * together into one circle. Area: the circle cut into 8, 16 and 32 slices
 * laid head to tail makes a near-rectangle πr long and r high. In terms of
 * π, or with the π key to 3 significant figures. Questions from
 * 4024/11/M/J/10 Q3(b), 4024/22/O/N/14 Q5(a) and 4024/11/O/N/25 Q10.
 *
 * Colours: the diameter blue, the radius orange, the circumference (the
 * edge) green, an unknown pink, what can be dragged yellow.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import { type Scene, type CrossState, BLUE, ORANGE, GREEN, PINK, CHALK, place, startCross, crossDone, lerpV, RAD, DEG } from "./scene"
import { type Beat, look, watch, c, board, ask, glide, over, keys, glowOn, pulseLabs, pulseShades, putLab } from "./kit"

const TAU = 2 * Math.PI

// ── a circle on its own ──────────────────────────────────────────────────

/** A circle of radius r about the origin, with its diameter, a radius and its edge marked as asked (their labels). */
function circleBoard(S: Scene, r: number, o: { d?: string; dCol?: string; r?: string; rim?: string; rimCol?: string; radii?: boolean; fill?: boolean } = {}) {
  board(S, [-r - 1.8, -r - 1.2, r + 1.8, r + 1.2])
  place(S, { O: [0, 0], E1: [-r, 0], E2: [r, 0], R: [r * Math.cos(40 * RAD), r * Math.sin(40 * RAD)] })
  S.circle = { c: "O", r }
  S.dots = [{ pt: "O", col: CHALK, r: 3.5 }]
  if (o.fill) S.shades = [{ id: "in", kind: "ring", c: "O", r1: 0, r2: r, a1: 0, a2: 360, col: BLUE, op: 0.18 }]
  if (o.d !== undefined) {
    S.segs.push({ id: "d", a: "E1", b: "E2", col: o.dCol ?? BLUE, w: 3.4 })
    S.freeLabs.push({ key: "d", at: [0, 0], tex: o.d, col: o.dCol ?? BLUE, dy: 20, dx: 18 })
  }
  if (o.radii) {
    S.segs.push({ id: "r1", a: "E1", b: "O", col: ORANGE, w: 3.4 }, { id: "r2", a: "O", b: "E2", col: ORANGE, w: 3.4 })
    S.freeLabs.push({ key: "r1", at: [-r / 2, 0], tex: "r", col: ORANGE, dy: -18 }, { key: "r2", at: [r / 2, 0], tex: "r", col: ORANGE, dy: -18 })
  }
  if (o.r !== undefined) {
    S.segs.push({ id: "r", a: "O", b: "R", col: ORANGE, w: 3.4 })
    S.freeLabs.push({ key: "r", at: [r * 0.5 * Math.cos(40 * RAD), r * 0.5 * Math.sin(40 * RAD)], tex: o.r, col: ORANGE, dx: -16, dy: -16 })
  }
  if (o.rim !== undefined) {
    S.arcs.push({ id: "rim", a1: 0, a2: 360, col: o.rimCol ?? GREEN, w: 4 })
    S.freeLabs.push({ key: "rim", at: [(r + 0.2) * Math.cos(135 * RAD), (r + 0.2) * Math.sin(135 * RAD)], tex: o.rim, col: o.rimCol ?? GREEN, dx: -22, dy: -14 })
  }
}

// ── rolling ──────────────────────────────────────────────────────────────

const R0 = 1
/**
 * A circle of radius 1 standing on a line, rolled `s` along it: the part of
 * its edge that has touched the line is green, and so is the line it has
 * covered. K marks the point that started on the line.
 */
function rollBoard(S: Scene, s: number, o: { roll?: boolean } = {}) {
  board(S, [-1.4, -1.3, 7.9, 2.5])
  place(S, { O: [s, R0], G1: [-1.4, 0], G2: [7.9, 0], Z: [0, 0], P0: [s, 0], K: [s, 0] })
  S.circle = { c: "O", r: R0 }
  if (o.roll) S.handles = [{ id: "roll", kind: "slide", pts: ["O"], grab: "O", dir: [1, 0], min: 0, max: TAU * R0, snaps: [TAU * R0], lock: true }]
  S.tick = S2 => {
    const x = S2.pts.O.D[0], phi = x / R0, k = -90 - phi * DEG
    const K: Vec = [x + R0 * Math.cos(k * RAD), R0 + R0 * Math.sin(k * RAD)]
    S2.pts.K.p = K; S2.pts.K.D = K
    S2.pts.P0.p = [x, 0]; S2.pts.P0.D = [x, 0]
    const rolled = x > 0.01
    S2.segs = [
      ...S2.segs.filter(g => !["ground", "spoke", "paint"].includes(g.id)),
      { id: "ground", a: "G1", b: "G2", col: CHALK, w: 1.6 },
      { id: "spoke", a: "O", b: "K", col: CHALK, w: 1.4 },
      ...(rolled ? [{ id: "paint", a: "Z", b: "P0", col: GREEN, w: 4.5 }] : []),
    ]
    S2.arcs = [...S2.arcs.filter(a => a.id !== "rim"), ...(rolled ? [{ id: "rim", c: "O", r: R0, a1: k, a2: -90, col: GREEN, w: 4.5 }] : [])]
    S2.dots = [{ pt: "Z", col: CHALK, r: 3.5 }, { pt: "K", col: ORANGE, r: 5 }]
  }
}

/** Three diameters laid along the rolled line, below it, and the bit left over. */
function laidDiameters(S: Scene, animate: boolean) {
  const at = (k: number, e: number): Record<string, Vec> => {
    // from the circle's upright diameter, turned flat and carried to its place under the line
    const m = lerpV([TAU * R0, R0], [2 * k + 1, -0.45], e), t = (90 - 90 * e) * RAD
    return { [`Q${k}a`]: [m[0] - Math.cos(t), m[1] - Math.sin(t)], [`Q${k}b`]: [m[0] + Math.cos(t), m[1] + Math.sin(t)] }
  }
  for (let k = 0; k < 3; k++) {
    place(S, at(k, animate ? 0 : 1))
    S.segs.push({ id: `q${k}`, a: `Q${k}a`, b: `Q${k}b`, col: BLUE, w: 4 })
    const lab = () => S.freeLabs.push({ key: `q${k}`, at: [2 * k + 1, -0.45], tex: "d", col: BLUE, dy: 18 })
    if (animate) glide(S, 1.1, e => at(k, e), k ? 0.3 : 0.8, () => lab())
    else lab()
  }
  place(S, { GA: [6, -0.45], GB: [TAU * R0, -0.45] })
  const gap = () => { S.segs.push({ id: "gap", a: "GA", b: "GB", col: PINK, w: 4 }) }
  if (animate) S.acts.push({ dur: 0.3, end: () => gap() })
  else gap()
}

// ── the running track ────────────────────────────────────────────────────

/** 4024/22/O/N/14 Q5: a track 100 m straight, a semicircle of diameter d at each end; 1 unit is 10 m. */
const TD = 200 / Math.PI / 10, TR = TD / 2
function trackBoard(S: Scene, o: { join?: boolean; joined?: boolean; whole?: boolean } = {}) {
  board(S, [-TR - 0.8, -1.4, 10 + TR + 0.8, TD + 1.4])
  place(S, { T1: [0, 0], T2: [10, 0], T3: [10, TD], T4: [0, TD], LC: [0, TR], RC: [o.joined ? 0 : 10, TR] })
  S.segs = [{ id: "bot", a: "T1", b: "T2", col: CHALK }, { id: "top", a: "T4", b: "T3", col: CHALK }, { id: "d", a: "T2", b: "T3", col: PINK, dash: true, w: 2 }]
  S.arcs = [{ id: "l", c: "LC", r: TR, a1: 90, a2: 270, col: GREEN, w: 4 }, { id: "rt", c: "RC", r: TR, a1: -90, a2: 90, col: GREEN, w: 4 }]
  S.freeLabs = [
    { key: "top", at: [5, TD], tex: "100\\text{ m}", col: CHALK, dy: -18 },
    { key: "d", at: [10, TR], tex: "d", col: PINK, dx: -16 },
    // inside each curved end, so they stay on a phone's screen
    { key: "l", at: [-TR * 0.5, TR], tex: "100\\text{ m}", col: GREEN },
    { key: "rt", at: [10 + TR * 0.5, TR], tex: "100\\text{ m}", col: GREEN },
  ]
  // joined, each half keeps its own 100 m (the student adds them); `whole`: the circle's 200 m, once found
  const halves = (S2: Scene) => {
    S2.freeLabs = S2.freeLabs.filter(f => f.key !== "l" && f.key !== "rt")
    S2.freeLabs.push({ key: "l", at: [-TR * 0.5, TR], tex: "100\\text{ m}", col: GREEN }, { key: "rt", at: [TR * 0.5, TR], tex: "100\\text{ m}", col: GREEN })
  }
  if (o.joined) halves(S)
  if (o.whole) S.freeLabs = S.freeLabs.filter(f => f.key !== "l" && f.key !== "rt").concat({ key: "c", at: [0, TR], tex: "200\\text{ m}", col: GREEN })
  if (o.join) {
    // the right-hand end glides over onto the left-hand one: a whole circle, its label riding with it
    glide(S, 1.6, e => ({ RC: [10 - 10 * e, TR] }), 0.9, S2 => { halves(S2); S2.flashGood = 1 })
    S.tick = S2 => { const f = S2.freeLabs.find(g => g.key === "rt"); if (f && S2.pts.RC.p[0] > 0.01) f.at = [S2.pts.RC.p[0] + TR * 0.5, TR] }
  }
}

// ── slices ───────────────────────────────────────────────────────────────

const SR = 2, SC: Vec = [3.6, 1]
/** The circle of radius 2 cut into n slices, laid as far as t toward a strip centred under where it was. */
function sliceBoard(S: Scene, n: number, t: number) {
  board(S, [-0.6, -1.4, 7.8, 3.4])
  const w = Math.PI * SR + (Math.PI * SR) / n
  S.slices = { c: SC, r: SR, n, t, x0: SC[0] - w / 2, y0: 0, col: BLUE }
}
const stripX0 = (n: number) => SC[0] - (Math.PI * SR + (Math.PI * SR) / n) / 2

/** π d = 28 (a pie chart's circumference), with π (and its ×) to carry across. */
const piD = (st: CrossState) => {
  const g = (id: string) => ({ grab: st.grab.has(id) || undefined, pulse: st.pulse.has(id) || undefined })
  return row([atom("pi", "\\pi", g("pi")), op("x", "\\times", g("x")), atom("d", "d", { col: PINK }), op("eq", "="), atom("n28", "28", { col: GREEN })])
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  watch("d", "The *diameter* $d$ goes right across the circle, through its centre.", S => { circleBoard(S, 2, { d: "d" }); look(S) }, 2.4),
  watch("r", "It's two radii, so $d = 2r$.", S => { circleBoard(S, 2, { radii: true }); look(S) }, 2.4),
  watch("c", "The distance round the edge is the *circumference*.", S => { circleBoard(S, 2, { rim: "C" }); look(S) }, 2.4),
  {
    id: "roll",
    say: "Roll the circle along the line, one full turn.",
    enter: S => { rollBoard(S, 0, { roll: true }); look(S) },
    done: S => S.locked.has("roll"),
    advanceAfter: 1800,
  },
  watch("unrolled", "The green line is as long as the circumference.", S => { rollBoard(S, TAU * R0); look(S) }, 2.4),
  {
    id: "three-d",
    say: "Let's lay diameters along it. Three fit, with a little left over.",
    enter: S => { rollBoard(S, TAU * R0); laidDiameters(S, true); look(S) },
    cta: "", ctaAfter: 4.6,
  },
  watch("pi", "So the circumference is about $3.14$ diameters. That number is $\\pi$.", S => {
    rollBoard(S, TAU * R0)
    laidDiameters(S, false)
    S.eqFn = () => row([atom("pi", "\\pi", { col: GREEN }), op("e", "="), atom("v", "3.14159\\ldots")])
    look(S, ["eq"])
  }, 3),
  watch("c-pid", "Circumference $= \\pi \\times$ diameter.", S => {
    circleBoard(S, 2, { d: "d", rim: "C" })
    S.eqFn = () => row([atom("cc", "C", { col: GREEN }), op("e", "="), atom("pi", "\\pi"), op("x", "\\times"), atom("dd", "d", { col: BLUE })])
    look(S, ["eq"])
  }, 2.6),
  watch("c-2pir", "A diameter is two radii, so it's also $2\\pi r$.", S => {
    circleBoard(S, 2, { radii: true, rim: "C" })
    S.eqFn = () => row([atom("cc", "C", { col: GREEN }), op("e", "="), atom("two", "2"), atom("pi", "\\pi"), atom("rr", "r", { col: ORANGE })])
    look(S, ["eq"])
  }, 2.6),
]

const PART_2: Beat[] = [
  // 4024/11/M/J/10 Q3(b)
  watch("s10", "A pie chart is a circle with a circumference of $28$ cm. So $\\pi \\times d = 28$.", S => {
    circleBoard(S, 2, { d: "d", dCol: PINK, rim: "28\\text{ cm}" })
    S.eqFn = () => piD({ stage: 0, pulse: new Set(), grab: new Set(), crossed: false, done: false })
    look(S, ["eq"])
  }, 3),
  {
    id: "s10-cross",
    say: "To find $d$, move the $\\pi$ across the $=$.",
    enter: S => {
      circleBoard(S, 2, { d: "d", dCol: PINK, rim: "28\\text{ cm}" })
      startCross(S, {
        ids: ["pi", "x"], label: "\\pi\\,\\times", from: "left",
        options: ["$\\div\\,\\pi$", "$-\\,\\pi$"], answer: 0,
        notes: { 1: "It was multiplying, so it comes across dividing." },
        before: st => piD(st),
        after: () => row([atom("d", "d", { col: PINK }), op("eq", "="), atom("n28", "28", { col: GREEN }), op("dv", "\\div"), atom("pi", "\\pi")]),
      })
      look(S, ["eq", "chips"])
    },
    done: S => crossDone(S),
    advanceAfter: 1200,
  },
  ask("s10-d", "So what is $d$? Keep $\\pi$ in your answer.", S => circleBoard(S, 2, { d: "d", dCol: PINK, rim: "28\\text{ cm}" }), {
    lead: "d", leadCol: PINK, unit: "cm", answer: 28 / Math.PI, shown: "\\dfrac{28}{\\pi}", typed: "28/p", piForm: true,
    above: () => row([atom("d0", "d", { col: PINK }), op("e0", "="), atom("n0", "28", { col: GREEN }), op("v0", "\\div"), atom("p0", "\\pi")]),
    slips: [{ v: 28 * Math.PI, say: "That multiplies by $\\pi$. Moving across, it divides." }],
    walk: [
      { say: "The circumference is $28$, and the $\\pi$ came across dividing.", tex: `${c(PINK, "d")} = 28 \\div \\pi`, show: S => { glowOn(S, "rim", "d"); pulseLabs(S, "rim") } },
      { say: "Type $28$, then $\\div$, then the $\\pi$ key.", show: S => { glowOn(S); pulseLabs(S); keys(S, "2", "8", "÷", "π") } },
    ],
  }),
  watch("track", "This running track has a semicircle at each end. Each curved end is $100$ m.", S => { trackBoard(S); look(S) }, 3),
  // 4024/22/O/N/14 Q5(a)
  watch("track-join", "Put the two ends together and they make a whole circle.", S => { trackBoard(S, { join: true }); look(S) }, 3.2),
  ask("track-c", "What is the circumference of the whole circle?", S => trackBoard(S, { joined: true }), {
    lead: "C", leadCol: GREEN, unit: "m", answer: 200,
    slips: [{ v: 100, say: "That's one end. The circle is both ends together." }],
    walk: [
      { say: "This half of the circle is one curved end, $100$ m.", show: S => { glowOn(S, "l"); pulseLabs(S, "l") } },
      { say: "This half is the other end, $100$ m. Together they go all the way round.", tex: "100 + 100", show: S => { glowOn(S, "rt"); pulseLabs(S, "rt") } },
    ],
    then: S => { S.freeLabs = S.freeLabs.filter(f => f.key !== "l" && f.key !== "rt"); putLab(S, { key: "c", at: [0, TR], tex: "200\\text{ m}", col: GREEN }) },
  }),
  ask("track-d", "Now find $d$, to $3$ significant figures.", S => trackBoard(S, { joined: true, whole: true }), {
    lead: "d", leadCol: PINK, unit: "m", answer: 200 / Math.PI, sf: 3, typed: "200/p",
    slips: [
      { v: 100 / Math.PI, say: "That's using one end. The whole circumference is $200$." },
      { v: 400 / Math.PI, say: "That's $2 \\times 200 \\div \\pi$. Circumference $= \\pi d$, so $d = 200 \\div \\pi$." },
      { v: 200 * Math.PI, say: "That multiplies by $\\pi$. Moving across, it divides." },
      { v: 63.6, say: "Nearly. $63.66\\ldots$ rounds up to $63.7$." },
    ],
    walk: [
      { say: "The circle goes $200$ m round, and circumference $= \\pi d$.", tex: `\\pi \\times ${c(PINK, "d")} = 200`, show: S => { glowOn(S, "l", "rt"); pulseLabs(S, "c") } },
      { say: "Move the $\\pi$ across: it divides. Type $200$, then $\\div$, then the $\\pi$ key.", tex: `${c(PINK, "d")} = 200 \\div \\pi`, show: S => { glowOn(S, "d"); pulseLabs(S, "d"); keys(S, "÷", "π") } },
    ],
  }),
]

const PART_3: Beat[] = [
  watch("cut", "Now for the area. Let's cut the circle into $8$ slices.", S => { sliceBoard(S, 8, 0); look(S) }, 2.4),
  {
    id: "lay",
    say: "Let's lay them head to tail, one up, one down.",
    enter: S => { sliceBoard(S, 8, 0); over(S, 2.6, (S2, e) => { if (S2.slices) S2.slices.t = e }, 0.6); look(S) },
    cta: "", ctaAfter: 3.6,
  },
  {
    id: "more",
    say: "With more slices, it gets closer to a rectangle.",
    enter: S => {
      sliceBoard(S, 16, 0)
      over(S, 1.8, (S2, e) => { if (S2.slices) S2.slices.t = e }, 0.4)
      S.acts.push({ dur: 0.9, end: S2 => { S2.slices = { ...S2.slices!, n: 32, t: 0, x0: stripX0(32) } } })
      over(S, 1.8, (S2, e) => { if (S2.slices) S2.slices.t = e }, 0.2)
      look(S)
    },
    cta: "", ctaAfter: 5.6,
  },
  watch("strip-h", "Its height is a radius, $r$.", S => {
    sliceBoard(S, 32, 1)
    const x = stripX0(32) + (Math.PI * SR) / 32
    place(S, { H1: [x, 0], H2: [x, SR] })
    S.segs = [{ id: "h", a: "H1", b: "H2", col: ORANGE, w: 3.4 }]
    S.freeLabs = [{ key: "h", at: [x, SR / 2], tex: "r", col: ORANGE, dx: -16 }]
    look(S)
  }, 2.4),
  watch("strip-l", "Along the bottom is half the circumference, which is $\\pi r$.", S => {
    sliceBoard(S, 32, 1)
    const x0 = stripX0(32)
    place(S, { B1: [x0, -0.12], B2: [x0 + Math.PI * SR, -0.12] })
    S.segs = [{ id: "b", a: "B1", b: "B2", col: GREEN, w: 4 }]
    S.freeLabs = [{ key: "b", at: [x0 + (Math.PI * SR) / 2, -0.12], tex: "\\pi r", col: GREEN, dy: 20 }]
    look(S)
  }, 2.8),
  watch("strip-a", "So the area is $\\pi r \\times r$, which is $\\pi r^2$.", S => {
    sliceBoard(S, 32, 1)
    const x0 = stripX0(32), x = x0 + (Math.PI * SR) / 32
    place(S, { B1: [x0, -0.12], B2: [x0 + Math.PI * SR, -0.12], H1: [x, 0], H2: [x, SR] })
    S.segs = [{ id: "b", a: "B1", b: "B2", col: GREEN, w: 4 }, { id: "h", a: "H1", b: "H2", col: ORANGE, w: 3.4 }]
    S.freeLabs = [{ key: "b", at: [x0 + (Math.PI * SR) / 2, -0.12], tex: "\\pi r", col: GREEN, dy: 20 }, { key: "h", at: [x, SR / 2], tex: "r", col: ORANGE, dx: -16 }]
    S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("pr", "\\pi r", { col: GREEN }), op("x", "\\times"), atom("rr", "r", { col: ORANGE }), op("e2", "="), atom("t", "\\pi r^2", { col: BLUE })])
    look(S, ["eq"])
  }, 3),
  {
    id: "a-formula",
    say: "Area of a circle $= \\pi r^2$.",
    enter: S => {
      sliceBoard(S, 32, 1)
      over(S, 1.8, (S2, e) => { if (S2.slices) S2.slices.t = 1 - e }, 0.3, S2 => {
        S2.slices = null
        place(S2, { O: SC, R: [SC[0] + SR * Math.cos(40 * RAD), SC[1] + SR * Math.sin(40 * RAD)] })
        S2.circle = { c: "O", r: SR }
        S2.shades = [{ id: "in", kind: "ring", c: "O", r1: 0, r2: SR, a1: 0, a2: 360, col: BLUE, op: 0.18 }]
        S2.segs = [{ id: "r", a: "O", b: "R", col: ORANGE, w: 3.4 }]
        S2.freeLabs = [{ key: "r", at: lerpV(SC, S2.pts.R.p, 0.5), tex: "r", col: ORANGE, dx: -14, dy: -14 }]
      })
      S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("pi", "\\pi"), atom("rr", "r^2", { col: ORANGE })])
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3,
  },
]

const PART_4: Beat[] = [
  watch("in-pi", "With $r = 5$, the area is $\\pi \\times 5^2 = 25\\pi$. That's the area in terms of $\\pi$.", S => {
    circleBoard(S, 2, { r: "5", fill: true })
    S.eqFn = () => row([atom("a", "\\text{Area}"), op("e", "="), atom("pi", "\\pi"), op("x", "\\times"), atom("r", "5^2", { col: ORANGE }), op("e2", "="), atom("t", "25\\pi", { col: GREEN })])
    look(S, ["eq"])
  }, 3.2),
  watch("pi-key", "On a calculator paper, press the $\\pi$ key: $25\\pi = 78.5$ to $3$ significant figures.", S => {
    circleBoard(S, 2, { r: "5", fill: true })
    S.eqFn = () => row([atom("t", "25\\pi", { col: GREEN }), op("e", "="), atom("v", "78.539\\ldots"), op("e2", "\\approx"), atom("r", "78.5", { col: GREEN })])
    look(S, ["eq"])
  }, 3.2),
  // 4024/11/O/N/25 Q10
  ask("w25", "A circle has diameter $12$ cm. Find its area, in terms of $\\pi$.", S => circleBoard(S, 2, { d: "12\\text{ cm}", fill: true }), {
    lead: "\\text{Area}", unit: "cm2", answer: 36 * Math.PI, shown: "36\\pi", typed: "36p", piForm: true,
    slips: [
      { v: 144 * Math.PI, say: "That used the diameter. Halve it first: the radius is $6$." },
      { v: 12 * Math.PI, say: "That's the circumference. Area is $\\pi r^2$." },
      { v: 6 * Math.PI, say: "Square the radius: $6^2$." },
    ],
    walk: [
      { say: "The radius is half the diameter, $6$ cm.", tex: `${c(ORANGE, "r")} = 6`, show: S => { S.segs = [{ id: "r1", a: "E1", b: "O", col: ORANGE, w: 3.4, glow: true }]; S.freeLabs = [{ key: "r1", at: [-1, 0], tex: "6", col: ORANGE, dy: -18, pulse: true }] } },
      { say: "The area inside is $\\pi r^2$.", tex: `\\pi \\times ${c(ORANGE, "6")}^2`, show: S => { glowOn(S); pulseLabs(S); pulseShades(S, "in") } },
    ],
    then: S => putLab(S, { key: "area", at: [0, -1], tex: "36\\pi\\text{ cm}^2", col: GREEN }),
  }),
  ask("w25-calc", "On a calculator paper, it would be a number. Give it to $3$ significant figures.", S => { circleBoard(S, 2, { d: "12\\text{ cm}", fill: true }); putLab(S, { key: "area", at: [0, -1], tex: "36\\pi\\text{ cm}^2", col: GREEN }) }, {
    lead: "\\text{Area}", unit: "cm2", answer: 36 * Math.PI, sf: 3, typed: "36*p",
    slips: [{ v: 144 * Math.PI, say: "That used the diameter. The radius is $6$." }, { v: 36, say: "Multiply by $\\pi$ too: use the $\\pi$ key." }],
    walk: [
      { say: "You found the area: $36\\pi$. That's $36 \\times \\pi$.", tex: "36 \\times \\pi", show: S => { pulseLabs(S, "area"); pulseShades(S, "in") } },
      { say: "Type $36$, then $\\times$, then the $\\pi$ key.", show: S => { pulseLabs(S); pulseShades(S); keys(S, "3", "6", "×", "π") } },
    ],
  }),
  {
    id: "end",
    say: "Circumference $= \\pi d$, and area $= \\pi r^2$.",
    enter: S => {
      circleBoard(S, 2, { d: "d", r: "r", rim: "C", fill: true })
      S.eqFn = () => row([atom("cc", "C", { col: GREEN }), op("e", "="), atom("pi", "\\pi"), atom("dd", "d", { col: BLUE }), op("sp", "\\qquad"), atom("a", "A"), op("e2", "="), atom("pi2", "\\pi"), atom("rr", "r^2", { col: ORANGE })])
      look(S, ["eq"])
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["d", "Circumference"],
  ["s10", "Working backwards"],
  ["cut", "Area"],
  ["in-pi", "Exact and rounded answers"],
])

