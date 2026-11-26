/**
 * Scale drawings (4.3, lesson 2 of 3). A map is the real place drawn smaller
 * by the same amount: its scale says what 1 cm stands for. The student lays
 * a ruler along a line and reads it (a lens shows the end close up), turns
 * a map length into a real one (multiply) and a real one onto the map
 * (divide), and writes a scale as 1 : n one small step at a time. Exam
 * questions from the papers: 4024/12/M/J/25 Q6(a), 4024/11/O/N/22 Q4(a),
 * 4024/12/M/J/23 Q6(a), 4024/11/M/J/23 Q13(b).
 */

import { applyParts } from "../chapter"
import { row, op, atom, frac } from "../equation"
import type { Vec } from "../geometry"
import { type Scene, BLUE, GREEN, PINK, resetBeat, later, places, addSeg } from "./scene"
import { type Beat, look, mapBoard, withRuler, watch, askNum, layBeat, readWalk, realWalk, S25, W22, S23 } from "./scale-kit"

// ── the beats ────────────────────────────────────────────────────────────

/** The two villages in km, 30 km apart, as they really are. */
function realBoard(S: Scene) {
  resetBeat(S)
  places(S, { A: [-15, 0], B: [15, 0] })
  S.names = { A: "A", B: "B" }
  S.fitPts = ["A", "B"]
  S.fitPad = 5
  addSeg(S, "A", "B", { lab: { tex: "30\\text{ km}" } })
}
/** The same two villages on a map: 6 cm apart on a page, with the scale written on it. */
function pageBoard(S: Scene, o: { caption?: boolean } = {}) {
  resetBeat(S)
  places(S, { A: [-3, 0], B: [3, 0], p0: [-4.6, -2.2], p1: [4.6, 2.2] })
  S.names = { A: "A", B: "B" }
  S.fitPts = ["p0", "p1"]
  S.fitPad = 0.15
  S.page = { x0: -4.6, y0: -2.2, x1: 4.6, y1: 2.2, caption: o.caption === false ? undefined : "\\text{Scale: }1\\text{ cm to }5\\text{ km}" }
  addSeg(S, "A", "B")
}
/** A page with one line to read or draw on (lengths in cm). */
function plainPage(S: Scene, pts: Record<string, Vec>, segs: [string, string][], names: Record<string, string>, caption = "\\text{Scale: }1\\text{ cm to }5\\text{ km}") {
  resetBeat(S)
  places(S, { ...pts, p0: [-4.6, -2.6], p1: [4.6, 2.6] })
  S.names = names
  S.fitPts = ["p0", "p1"]
  S.fitPad = 0.15
  S.page = { x0: -4.6, y0: -2.6, x1: 4.6, y1: 2.6, caption }
  for (const [a, b] of segs) addSeg(S, a, b)
}

const PART_A: Beat[] = [
  // ── 1. Maps and scale ──
  watch("real", "Two villages are $30$ km apart.", S => { realBoard(S); look(S) }, 2.2),
  {
    id: "shrink",
    say: "A map draws everything smaller, by the same amount, so it fits on a page.",
    enter: S => {
      realBoard(S)
      S.holdFit = true
      // the road shrinks to its size on the map (a fifth here), the page comes, then the view moves in on it
      S.acts.push({ dur: 0.6 }, {
        dur: 2.4,
        run: (S2, e) => { const k = 1 + (0.2 - 1) * e; S2.P.A = [-15 * k, 0]; S2.P.B = [15 * k, 0] },
      }, {
        dur: 1.0,
        begin: S2 => { S2.page = { x0: -4.6, y0: -2.2, x1: 4.6, y1: 2.2 }; S2.vals.pageOp = 0 },
        run: (S2, e) => { S2.vals.pageOp = e },
      }, {
        dur: 0.1,
        end: S2 => {
          places(S2, { A: [-3, 0], B: [3, 0], p0: [-4.6, -2.2], p1: [4.6, 2.2] })
          S2.fitPts = ["p0", "p1"]
          S2.fitPad = 0.15
          S2.holdFit = false
        },
      })
      look(S)
    },
    cta: "", ctaAfter: 5,
  },
  {
    id: "one-cm",
    say: "On this map, $1$ cm stands for $5$ km.",
    enter: S => {
      pageBoard(S)
      S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", under: "1\\text{ cm}", lit: 1 }
      look(S)
    },
    cta: "", ctaAfter: 2.4,
  },
  watch("scale", "This is the map's *scale*.", S => { pageBoard(S); S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", under: "1\\text{ cm}", lit: 1 }; look(S) }, 2),

  // ── 2. Measuring on a map ──
  layBeat("lay", "Lay the ruler along $AB$, with its $0$ on one end.", S25, "A", "B"),
  askNum("read", "How long is $AB$ on the map?", S => { mapBoard(S, S25); withRuler(S, S25, { on: "A", along: "B", fixed: true, follow: true }) }, {
    name: "AB", answer: 6, unit: "cm", dec: true, measured: true,
    slips: [{ v: 60, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk(),
  }),
  {
    id: "pieces",
    say: "Each of those $6$ cm stands for $5$ km.",
    enter: S => {
      mapBoard(S, S25)
      S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", lit: 0 }
      for (let k = 0; k < 6; k++) later(S, 0.5 + k * 0.45, S2 => { if (S2.along) S2.along.lit = k + 1 })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  askNum("real-ab", "So how far apart are the villages really?", S => { mapBoard(S, S25); S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", lit: 6 } }, {
    name: "\\text{Real}", answer: 30, unit: "km", dec: true,
    slips: [{ v: 11, say: "That's $6 + 5$. Each cm stands for $5$ km: $6$ lots of $5$." }, { v: 1.2, say: "That's $6 \\div 5$. The real distance is bigger: $6$ lots of $5$ km." }],
    above: () => row([atom("ab", "AB"), op("e", "="), atom("six", "6\\text{ cm}")]),
    walk: realWalk("6", "5", "km"),
  }),
  watch("times", "So to get the real length, multiply by $5$.", S => {
    mapBoard(S, S25)
    S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", lit: 6 }
    S.eqFn = () => frac("card", atom("rule", MAP_REAL), atom("ex", "6\\text{ cm} \\times 5 = 30\\text{ km}"), "rgba(0,0,0,0)")
    look(S, ["eq"])
  }, 2.6),
  askNum("road", "A road is $3.4$ cm long on this map. How long is it really?", S => roadPage(S), {
    name: "\\text{Real}", answer: 17, unit: "km", dec: true,
    slips: [{ v: 8.4, say: "That's $3.4 + 5$. Each cm stands for $5$ km: multiply." }, { v: 0.68, say: "That's $3.4 \\div 5$. The real road is longer: multiply." }],
    above: () => atom("rule", MAP_REAL),
    walk: realWalk("3.4", "5", "km"),
  }),

  // ── 3. From real life to the map ──
  watch("path", "Now the other way. A path is really $15$ km long.", S => { pathReal(S, 0); look(S) }, 2.4),
  {
    id: "path-cut",
    say: "On the map, each $5$ km of it becomes $1$ cm.",
    enter: S => {
      pathReal(S, 0)
      for (let k = 0; k < 3; k++) later(S, 0.5 + k * 0.6, S2 => { if (S2.along) S2.along.lit = k + 1 })
      look(S)
    },
    cta: "", ctaAfter: 2.8,
  },
  askNum("path-map", "So how long is the path on the map?", S => pathReal(S, 3), {
    name: "\\text{Map}", answer: 3, unit: "cm", dec: true,
    slips: [
      { v: 75, say: "That's $15 \\times 5$. Each $5$ km becomes just $1$ cm." },
      { v: 20, say: "That's $15 + 5$. Count the $5$ km pieces: each one is $1$ cm." },
      { v: 10, say: "That's $15 - 5$. Count the $5$ km pieces: each one is $1$ cm." },
    ],
    walk: [
      { say: "Each $5$ km piece becomes $1$ cm.", tex: "5\\text{ km} \\to 1\\text{ cm}", show: S => { if (S.along) S.along = { ...S.along, lit: 1 } } },
      { say: "So count the $5$ km pieces in $15$ km.", tex: "15 \\div 5", show: S => { if (S.along) S.along = { ...S.along, lit: 3 } } },
    ],
    // the path shrinks onto the map: each piece is a centimetre now
    then: S => shrinkPath(S),
    after: 4600,
  }),
  watch("path-div", "So from real life to the map, divide by $5$.", S => {
    pathMap(S)
    S.eqFn = () => frac("card", atom("rule", BOTH_WAYS), atom("ex", "15\\text{ km} \\div 5 = 3\\text{ cm}"), "rgba(0,0,0,0)")
    look(S, ["eq"])
  }, 2.8),
  {
    id: "draw",
    say: "Draw the path: slide the pencil along the ruler to $3$ cm.",
    enter: S => {
      plainPage(S, { P: [-2.5, -0.6] }, [], { P: "P" })
      S.ruler = { zero: [-2.5, -0.6], dir: 90, len: 7, on: "P", along: null, pen: 0.6, turn: false, move: false, penAt: 3 }
      S.tick = S2 => {
        if (S2.got.has("drawn") || S2.drag || S2.ruler?.pen !== 3) return
        S2.got.add("drawn")
        S2.P.Q = [0.5, -0.6]
        later(S2, 0.4, S3 => { S3.ruler = null; addSeg(S3, "P", "Q", { col: BLUE, lab: { tex: "3\\text{ cm}", col: BLUE } }); S3.touched = "P-Q"; S3.flashGood = 1 })
      }
      look(S)
    },
    done: S => S.got.has("drawn") && !S.ruler,
    advanceAfter: 1600,
  },
  askNum("road2", "A road is really $8$ km long. How long is it on this map?", S => roadReal(S), {
    name: "\\text{Map}", answer: 1.6, unit: "cm", dec: true,
    slips: [
      { v: 40, say: "That's $8 \\times 5$. From real life to the map: divide." },
      { v: 13, say: "That's $8 + 5$. From real life to the map: divide by $5$." },
      { v: 3, say: "That's $8 - 5$. From real life to the map: divide by $5$." },
    ],
    above: () => atom("rule", BOTH_WAYS),
    walk: [
      { say: "Each $5$ km on the ground is $1$ cm on the map.", tex: "5\\text{ km} \\to 1\\text{ cm}", show: S => { if (S.along) S.along = { ...S.along, lit: 1 } } },
      { say: "So how many fives are in $8$? One five, and $3$ km more.", tex: "8 \\div 5", show: S => { S.P.F5 = [1, 0]; addSeg(S, "F5", "T", { col: PINK, lab: { tex: "3\\text{ km}", col: PINK } }); if (S.along) S.along = { ...S.along, lit: 1 } } },
    ],
  }),

  // ── 4. The scale as a ratio ──
  watch("ratio", "A scale can also be written as a ratio, like $1 : 50\\,000$.", S => { ratioPage(S, "1\\text{ cm}", false); look(S) }, 2.6),
  watch("ratio-means", "It means $1$ cm on the map is $50\\,000$ cm in real life.", S => { ratioPage(S, "50\\,000\\text{ cm}"); look(S) }, 2.8),
  askNum("cm-m", "Let's turn it into metres. How many cm are in $1$ m?", S => ratioPage(S, "50\\,000\\text{ cm}"), {
    name: "1\\text{ m}", answer: 100, unit: "cm", max: 7,
    slips: [{ v: 10, say: "That's the mm in $1$ cm. Count the cm in a metre." }, { v: 1000, say: "That's the mm in a metre. Count the cm." }],
    walk: [{ say: "Think of a metre ruler. What is the last number on it?", tex: "1\\text{ m} \\to \\;?\\text{ cm}", show: S => { if (S.along) S.along = { ...S.along, pulse: true } } }],
  }),
  askNum("m-500", "So how many metres is $50\\,000$ cm?", S => ratioPage(S, "50\\,000\\text{ cm}"), {
    name: "50\\,000\\text{ cm}", answer: 500, unit: "m", max: 7,
    slips: [
      { v: 5000000, say: "That's $50\\,000 \\times 100$. A metre is bigger than a cm, so there are fewer metres: divide." },
      { v: 5000, say: "That's dividing by $10$. There are $100$ cm in a metre." },
      { v: 50, say: "That's dividing by $1000$. There are $100$ cm in a metre." },
    ],
    above: () => atom("fact", "100\\text{ cm} = 1\\text{ m}"),
    walk: [{ say: "Every $100$ cm makes $1$ m, so count the hundreds in $50\\,000$.", tex: "50\\,000 \\div 100", show: S => { if (S.along) S.along = { ...S.along, pulse: true } } }],
    then: S => { if (S.along) S.along = { ...S.along, tex: "500\\text{ m}" } },
  }),
  watch("m-500-says", "So $1$ cm on this map stands for $500$ m.", S => { ratioPage(S, "500\\text{ m}"); look(S) }, 2.4),

  // 4024/11/M/J/23 Q13(b)
  watch("lm", "On a map, Lenton and Mingfield are $4.5$ cm apart. Really, they are $9$ km apart.", S => { lmPage(S); look(S) }, 3),
  askNum("lm-1", "We want $1 : n$. First, how many km does $1$ cm stand for?", S => lmPage(S, "?"), {
    name: "1\\text{ cm}", answer: 2, unit: "km", dec: true,
    slips: [
      { v: 40.5, say: "That's $4.5 \\times 9$. Share the $9$ km between the $4.5$ cm." },
      { v: 0.5, say: "That's $4.5 \\div 9$. Share the km between the cm: $9 \\div 4.5$." },
      { v: 4.5, say: "That's $9 - 4.5$. Share the $9$ km between the $4.5$ cm." },
    ],
    walk: [
      { say: "$4.5$ cm stands for $9$ km.", tex: "4.5\\text{ cm} \\to 9\\text{ km}", show: S => { S.segs = S.segs.map(sg => ({ ...sg, glow: true })) } },
      { say: "Share the $9$ km between the $4.5$ cm: what does each cm get?", tex: "9 \\div 4.5", show: S => { S.segs = S.segs.map(sg => ({ ...sg, glow: false })); if (S.along) S.along = { ...S.along, pulse: true } } },
    ],
    then: S => { if (S.along) S.along = { ...S.along, tex: "2\\text{ km}" } },
  }),
  watch("lm-2km", "So the scale is $1$ cm to $2$ km.", S => { lmPage(S, "2\\text{ km}"); S.eqFn = () => lmRatio("2\\text{ km}"); look(S, ["eq"]) }, 2.4),
  watch("lm-same", "A ratio needs the same units on both sides. Let's write $2$ km in cm.", S => { lmPage(S, "2\\text{ km}"); S.eqFn = () => lmRatio("2\\text{ km}", true); look(S, ["eq"]) }, 3),
  askNum("lm-m", "First, how many metres is $2$ km?", S => lmPage(S, "2\\text{ km}"), {
    name: "2\\text{ km}", answer: 2000, unit: "m", max: 7,
    slips: [{ v: 200, say: "$1$ km is $1000$ m. So $2$ km is two lots of $1000$ m." }, { v: 1000, say: "That's $1$ km. We have $2$ km." }, { v: 20, say: "$1$ km is $1000$ m. So $2$ km is two lots of $1000$ m." }],
    walk: [{ say: "$1$ km is $1000$ m, so $2$ km is two lots of that.", tex: "2 \\times 1000", show: S => { if (S.along) S.along = { ...S.along, pulse: true } } }],
    then: S => { if (S.along) S.along = { ...S.along, tex: "2000\\text{ m}", pulse: false } },
  }),
  askNum("lm-cm", "And how many cm is $2000$ m?", S => lmPage(S, "2000\\text{ m}"), {
    name: "2000\\text{ m}", answer: 200000, unit: "cm", max: 7,
    slips: [
      { v: 20000, say: "That's $2000 \\times 10$. There are $100$ cm in a metre." },
      { v: 20, say: "That's $2000 \\div 100$. A cm is smaller than a metre, so there are more of them: multiply." },
      { v: 2000000, say: "That's $2000 \\times 1000$. There are $100$ cm in a metre." },
    ],
    above: () => atom("km-m", "2\\text{ km} = 2000\\text{ m}"),
    walk: [{ say: "Each metre is $100$ cm, so $2000$ m is $2000$ lots of $100$ cm.", tex: "2000 \\times 100", show: S => { if (S.along) S.along = { ...S.along, pulse: true } } }],
  }),
  {
    id: "lm-n",
    say: "Both sides are in cm now, so the units can go. The scale is $1 : 200\\,000$.",
    enter: S => {
      lmPage(S, "2\\text{ km}")
      // the two units fade out and the numbers close up
      S.eqFn = S2 => (S2.vals.drop
        ? row([atom("one", "1"), op("r", ":"), atom("n", "200\\,000", { col: GREEN })])
        : row([atom("one", "1"), atom("u1", "\\text{ cm}"), op("r", ":"), atom("n", "200\\,000"), atom("u2", "\\text{ cm}")]))
      later(S, 1.6, S2 => { S2.vals.drop = 1 })
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.6,
  },
]

/** Map to real (and back), as a card. */
const MAP_REAL = "\\text{Map} \\xrightarrow{\\;\\textcolor{#00abfa}{\\times 5}\\;} \\text{Real}"
const BOTH_WAYS = "\\begin{array}{l}\\text{Map} \\xrightarrow{\\;\\textcolor{#00abfa}{\\times 5}\\;} \\text{Real} \\\\[4pt] \\text{Real} \\xrightarrow{\\;\\textcolor{#ff822c}{\\div 5}\\;} \\text{Map}\\end{array}"

/** The road on the map: 3.4 cm, its whole centimetres marked. */
function roadPage(S: Scene) {
  plainPage(S, { R: [-1.7, -0.4], T: [1.7, -0.4] }, [["R", "T"]], {})
  S.segs = S.segs.map(sg => ({ ...sg, lab: { tex: "3.4\\text{ cm}" } }))
  S.along = { a: "R", b: "T", step: 1, tex: "5\\text{ km}", lit: 3 }
}

/** The road as it really is: 8 km (world units are km), its 5 km pieces to mark. */
function roadReal(S: Scene) {
  resetBeat(S)
  places(S, { R: [-4, 0], T: [4, 0] })
  S.fitPts = ["R", "T"]
  S.fitPad = 3
  addSeg(S, "R", "T", { lab: { tex: "8\\text{ km}" } })
  S.along = { a: "R", b: "T", step: 5, tex: "5\\text{ km}", lit: 0 }
}
/** The path as it really is: 15 km, cut into 5 km pieces (`lit` of them marked). World units are km here. */
function pathReal(S: Scene, lit: number) {
  resetBeat(S)
  places(S, { P: [-7.5, 0], Q: [7.5, 0] })
  S.fitPts = ["P", "Q"]
  S.fitPad = 3
  addSeg(S, "P", "Q", { lab: { tex: "15\\text{ km}" } })
  S.along = { a: "P", b: "Q", step: 5, tex: "5\\text{ km}", lit }
}
/** The path on the map: 3 cm on the page, each centimetre a 5 km piece. */
function pathMap(S: Scene) {
  resetBeat(S)
  places(S, { P: [-1.5, 0], Q: [1.5, 0], p0: [-4.6, -2.2], p1: [4.6, 2.2] })
  S.fitPts = ["p0", "p1"]
  S.fitPad = 0.15
  S.page = { x0: -4.6, y0: -2.2, x1: 4.6, y1: 2.2, caption: "\\text{Scale: }1\\text{ cm to }5\\text{ km}" }
  addSeg(S, "P", "Q", { lab: { tex: "3\\text{ cm}" } })
  S.along = { a: "P", b: "Q", step: 1, tex: "5\\text{ km}", lit: 3 }
}
/** The real path shrinks by the scale onto a page; the view then moves in on the page. */
function shrinkPath(S: Scene) {
  S.holdFit = true
  S.acts.push({ dur: 0.4 }, {
    dur: 2.2,
    begin: S2 => { S2.segs = S2.segs.map(sg => ({ ...sg, lab: undefined })) },
    run: (S2, e) => {
      const k = 1 + (0.2 - 1) * e
      S2.P.P = [-7.5 * k, 0]; S2.P.Q = [7.5 * k, 0]
      if (S2.along) S2.along.step = 5 * k
    },
  }, {
    dur: 0.9,
    begin: S2 => { S2.page = { x0: -4.6, y0: -2.2, x1: 4.6, y1: 2.2, caption: "\\text{Scale: }1\\text{ cm to }5\\text{ km}" }; S2.vals.pageOp = 0 },
    run: (S2, e) => { S2.vals.pageOp = e },
  }, {
    dur: 0.1,
    end: S2 => {
      places(S2, { P: [-1.5, 0], Q: [1.5, 0], p0: [-4.6, -2.2], p1: [4.6, 2.2] })
      S2.fitPts = ["p0", "p1"]
      S2.fitPad = 0.15
      S2.holdFit = false
      if (S2.along) S2.along = { ...S2.along, step: 1 }
      S2.segs = S2.segs.map(sg => ({ ...sg, lab: { tex: "3\\text{ cm}" } }))
    },
  })
}

/** A page with a 1 : 50 000 scale and one centimetre on it, saying what it stands for (or, `means` false, just "1 cm"). */
function ratioPage(S: Scene, tex: string, means = true) {
  plainPage(S, { U: [-2, 0], V: [-1, 0] }, [["U", "V"]], {}, "\\text{Scale: }1 : 50\\,000")
  S.along = means ? { a: "U", b: "V", step: 1, tex, under: "1\\text{ cm}", lit: 1 } : { a: "U", b: "V", step: 1, tex, lit: 1 }
}

/** Lenton and Mingfield, 4.5 cm apart on the map and 9 km apart really; `each`: what each centimetre says. */
function lmPage(S: Scene, each?: string) {
  plainPage(S, { L: [-2.25, -0.4], M: [2.25, -0.4] }, [["L", "M"]], { L: "\\text{Lenton}", M: "\\text{Mingfield}" }, "\\text{Scale: }1 : n")
  S.segs = S.segs.map(sg => ({ ...sg, lab: { tex: "4.5\\text{ cm} \\to 9\\text{ km}" } }))
  if (each) S.along = { a: "L", b: "M", step: 1, tex: each, lit: 4 }
}
/** The scale as it stands: 1 cm : what it stands for (`pulse`: the side still to change). */
const lmRatio = (right: string, pulse = false) => row([atom("one", "1"), atom("u1", "\\text{ cm}"), op("r", ":"), atom("n", right, { pulse })])

// ── 5. Exam questions: measuring a distance ──
const PART_X: Beat[] = [
  // 4024/11/O/N/22 Q4(a)
  watch("x1", "The diagram shows two ships, $A$ and $B$. $1$ cm stands for $30$ m.", S => { mapBoard(S, W22); look(S) }, 2.6),
  layBeat("x1-lay", "Find how far $B$ really is from $A$. Lay the ruler along $AB$.", W22, "A", "B"),
  askNum("x1-cm", "How long is $AB$ on the drawing?", S => { mapBoard(S, W22); withRuler(S, W22, { on: "A", along: "B", fixed: true, follow: true }) }, {
    name: "AB", answer: 5.6, unit: "cm", dec: true, measured: true,
    slips: [{ v: 56, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk(),
  }),
  askNum("x1-m", "Each cm stands for $30$ m. So how far is $B$ from $A$ really?", S => { mapBoard(S, W22); addSeg(S, "A", "B", { lab: { tex: "5.6\\text{ cm}" } }) }, {
    name: "\\text{Real}", answer: 168, unit: "m", dec: true,
    slips: [{ v: 35.6, say: "That's $5.6 + 30$. Map to real: multiply." }, { v: 0.19, say: "The real distance is bigger: $5.6$ lots of $30$ m." }],
    above: () => row([atom("ab", "AB"), op("e", "="), atom("v", "5.6\\text{ cm}")]),
    walk: realWalk("5.6", "30", "m", ["A", "B"]),
  }),

  // 4024/12/M/J/23 Q6(a)
  watch("x2", "Villages $A$ and $B$ on a map. The scale is $1$ cm to $2$ km.", S => { mapBoard(S, S23); look(S) }, 2.4),
  layBeat("x2-lay", "Find the real distance $AB$. Lay the ruler along it.", S23, "A", "B"),
  askNum("x2-cm", "How long is $AB$ on the map?", S => { mapBoard(S, S23); withRuler(S, S23, { on: "A", along: "B", fixed: true, follow: true }) }, {
    name: "AB", answer: 9.5, unit: "cm", dec: true, measured: true,
    slips: [{ v: 95, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk(),
  }),
  askNum("x2-km", "Each cm stands for $2$ km. So what is the real distance?", S => { mapBoard(S, S23); addSeg(S, "A", "B", { lab: { tex: "9.5\\text{ cm}" } }) }, {
    name: "\\text{Real}", answer: 19, unit: "km", dec: true,
    slips: [{ v: 11.5, say: "That's $9.5 + 2$. Map to real: multiply." }, { v: 4.75, say: "The real distance is bigger: $9.5$ lots of $2$ km." }],
    above: () => row([atom("ab", "AB"), op("e", "="), atom("v", "9.5\\text{ cm}")]),
    walk: realWalk("9.5", "2", "km", ["A", "B"]),
  }),

  {
    id: "end-scale",
    say: "In summary, we multiply to get a real length, and divide to go back onto the map.",
    enter: S => {
      mapBoard(S, S25)
      S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", lit: 6 }
      S.eqFn = () => atom("rule", BOTH_WAYS)
      look(S, ["eq"])
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_A, ...PART_X]

applyParts(BEATS, [
  ["real", "Maps and scale"],
  ["lay", "Measuring on a map"],
  ["path", "From real life to the map"],
  ["ratio", "The scale as a ratio"],
  ["x1", "Exam questions"],
])
