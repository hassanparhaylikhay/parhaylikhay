/**
 * Scale drawings (4.3, lesson 2 of 2). A map is the real place drawn smaller
 * by the same amount: its scale says what 1 cm stands for. The student lays
 * a ruler along a line and reads it (a lens shows the end close up), turns
 * map lengths into real ones and back, writes a scale as 1 : n, measures a
 * bearing with a two-scale protractor (and past 180°, the angle to the left
 * of North taken from 360°), marks a bearing and rules the line, and finds
 * a place from two bearings. Exam questions from the papers: 4024/12/M/J/25
 * Q6, 4024/11/O/N/22 Q4, 4024/12/M/J/23 Q6(a), 4024/12/M/J/24 Q10(a),
 * 4024/11/M/J/23 Q13(b).
 *
 * The drawing is in cm: one world unit is one centimetre of the map, so the
 * ruler measures it exactly at any screen size.
 */

import { applyParts } from "../chapter"
import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import { row, op, atom, frac, type ENode } from "../equation"
import type { Vec } from "../geometry"
import {
  type Scene, type VisKey, BLUE, GREEN, ORANGE,
  resetBeat, show, later, say, places, along, addSeg, startInput, boxNode, dirW, brgText, dist, ptS,
} from "./scene"

type Beat = BeatOf<Scene>

const LOOK: VisKey[] = ["board", "fig", "letters", "marks"]
const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
const DEC_KEYS = [["1", "2", "3", "4", "5", "6", "back"], ["7", "8", "9", "0", ".", "go"]]

/** Where a line from p on bearing b1 crosses a line from q on bearing b2. */
function cross(p: Vec, b1: number, q: Vec, b2: number): Vec {
  const d1 = dirW(b1), d2 = dirW(b2)
  const det = d1[0] * -d2[1] - d1[1] * -d2[0]
  const r: Vec = [q[0] - p[0], q[1] - p[1]]
  const t = (r[0] * -d2[1] - r[1] * -d2[0]) / det
  return [p[0] + d1[0] * t, p[1] + d1[1] * t]
}

// ── the maps (one world unit is a centimetre of the drawing) ─────────────

interface MapSpec {
  pts: Record<string, Vec>
  names: Record<string, string>
  norths: string[]
  segs: [string, string][]
  scale: string
  ruler: { zero: Vec; len: number }
  /** where the protractor lies before it is picked up (inside the page) */
  prot: Vec
  /** more room on the page: where lines the student will rule end */
  room?: Vec[]
}

/** 4024/12/M/J/25 Q6: villages A and B, 6.0 cm apart on a bearing of 110°; scale 1 cm to 5 km. */
const S25_B = along([0, 0], 110, 6)
const S25_C = cross([0, 0], 60, S25_B, 320)
const S25: MapSpec = {
  pts: { A: [0, 0], B: S25_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }5\\text{ km}",
  ruler: { zero: [-1, -3.9], len: 8 },
  prot: [3.2, -1.0],
  room: [along([0, 0], 60, 4.2), along(S25_B, 320, 5.4)],
}
/** 4024/11/O/N/22 Q4: ships A and B, 5.6 cm apart on a bearing of 125°; scale 1 cm to 30 m. */
const W22_B = along([0, 0], 125, 5.6)
const W22_C = cross([0, 0], 164, W22_B, 252)
const W22: MapSpec = {
  pts: { A: [0, 0], B: W22_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }30\\text{ m}",
  ruler: { zero: [-1.6, -5.1], len: 8 },
  prot: [2.0, -2.4],
  room: [along([0, 0], 164, 5.2), along(W22_B, 252, 4.6)],
}
/** 4024/12/M/J/23 Q6: villages A and B; B is 9.5 cm from A on a bearing of 240°; scale 1 cm to 2 km. */
const S23_B = along([0, 0], 240, 9.5)
const S23: MapSpec = {
  pts: { A: [0, 0], B: S23_B }, names: { A: "A", B: "B" }, norths: ["A", "B"], segs: [["A", "B"]],
  scale: "\\text{Scale: }1\\text{ cm to }2\\text{ km}",
  ruler: { zero: [-9.0, -6.0], len: 11 },
  prot: [-3.6, -1.2],
}
/** 4024/12/M/J/24 Q10: A due South of B (4 cm), C 7.07 cm from B on a bearing of 070°; scale 1 cm to 50 m. */
const S24: MapSpec = {
  pts: { A: [0, -4], B: [0, 0], C: along([0, 0], 70, 7.07) }, names: { A: "A", B: "B", C: "C" }, norths: ["B"], segs: [["A", "B"], ["B", "C"]],
  scale: "\\text{Scale: }1\\text{ cm to }50\\text{ m}",
  ruler: { zero: [1.0, -4.6], len: 8 },
  prot: [3.4, -1.8],
}

/**
 * Put a map on the board: its places, North arrows, lines, and the page
 * wrapped round them (with room where the ruler starts), its scale written
 * on it. `prot`: room round a place for the protractor to sit there.
 */
function mapBoard(S: Scene, M: MapSpec, o: { prot?: string } = {}) {
  resetBeat(S)
  const z = M.ruler.zero
  const pts: Record<string, Vec> = { ...M.pts, r0: z, r1: [z[0] + M.ruler.len, z[1]] }
  ;(M.room ?? []).forEach((q, i) => { pts[`m${i}`] = q })
  if (o.prot) {
    // a phone draws the protractor bigger for the map, so it needs more room
    const c = M.pts[o.prot], k = S.w < 560 ? 3.8 : 2.9
    Object.assign(pts, { q0: [c[0], c[1] + k], q1: [c[0] + k, c[1]], q2: [c[0], c[1] - k], q3: [c[0] - k, c[1]] })
  }
  places(S, pts)
  S.names = { ...M.names }
  S.norths = [...M.norths]
  S.fitPts = Object.keys(pts)
  S.fitPad = 0.25
  S.page = { caption: M.scale }
  for (const [a, b] of M.segs) addSeg(S, a, b)
}

/** The ruler, ready to be laid along a line (it starts off the figure). */
function withRuler(S: Scene, M: MapSpec, o: { on?: string; along?: string; fixed?: boolean } = {}) {
  if (o.on && o.along) {
    const z = S.P[o.on], t = S.P[o.along]
    const b = (Math.atan2(t[0] - z[0], t[1] - z[1]) * 180) / Math.PI
    S.ruler = { zero: [...z] as Vec, dir: ((b % 360) + 360) % 360, len: M.ruler.len, on: o.on, along: o.along, pen: null, turn: !o.fixed, move: !o.fixed }
    return
  }
  S.ruler = { zero: [...M.ruler.zero] as Vec, dir: 90, len: M.ruler.len, on: null, along: null, pen: null, turn: true, move: true }
}

/** The protractor: placed on a place with its 0 along a bearing, or lying off the figure. */
function withProt(S: Scene, M: MapSpec, o: { on?: string; rot?: number; fixed?: boolean; pen?: number; lit?: boolean } = {}) {
  const on = o.on ?? null
  const rot = o.rot ?? 40
  S.prot = {
    c: on ? ([...S.P[on]] as Vec) : ([...M.prot] as Vec), rot, on, pen: o.pen ?? null,
    lit: o.lit ? (rot === 0 ? "outer" : "inner") : null, turn: !o.fixed, move: !o.fixed, magnets: [0, 180],
  }
}

// ── beat makers ──────────────────────────────────────────────────────────

function watch(id: string, say0: string, enter: (S: Scene) => void, after = 1.8): Beat {
  return { id, say: say0, enter, cta: "", ctaAfter: after }
}

/** A number typed: a length (a decimal, right to the nearest tenth) or a bearing (three figures). */
function askNum(id: string, say0: string, enter: (S: Scene) => void, o: {
  name: string
  answer: number
  unit?: string
  dec?: boolean
  three?: boolean
  measured?: boolean
  nearSay?: string
  max?: number
  slips?: { v: number; say: string }[]
  above?: () => ENode
  walk: WalkStep<Scene>[]
  then?: (S: Scene) => void
}): Beat {
  const shown = o.three ? `${brgText(o.answer)}^\\circ` : `${o.answer}${o.unit ? `\\text{ ${o.unit}}` : ""}`
  const lead = () => [atom("qn", o.name), op("qe", "=")]
  const tail = o.three ? [atom("qd", "{}^\\circ")] : o.unit ? [atom("qu", `\\text{${o.unit}}`)] : []
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      if (o.dec) S.keyRows = DEC_KEYS
      startInput(S, {
        answer: o.answer, three: o.three, dec: o.dec, max: o.max ?? (o.three ? 3 : 7), typed: o.three ? brgText(o.answer) : String(o.answer), slips: o.slips,
        tol: o.measured ? 0.05 : undefined, near: o.measured ? (o.three ? 2.5 : 0.25) : undefined, nearSay: o.nearSay,
        onRight: S2 => o.then?.(S2),
      })
      S.eqFn = S2 => {
        const line = row(S2.input?.state === "right" ? [...lead(), atom("ans", shown, { col: GREEN })] : [...lead(), boxNode(S2), ...tail])
        return o.above ? frac("work", o.above(), line, "rgba(0,0,0,0)") : line
      }
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 2000,
    walk: o.walk,
  }
}

/** Lay the ruler along a line, its 0 on one end. */
function layBeat(id: string, say0: string, M: MapSpec, on: string, to: string, more?: (S: Scene) => void): Beat {
  return {
    id, say: say0,
    enter: S => { mapBoard(S, M); more?.(S); withRuler(S, M); look(S) },
    done: S => S.ruler?.on === on && S.ruler?.along === to && S.drag === null,
    advanceAfter: 1400,
  }
}

/** Put the protractor on a place with its 0 along North (rot 0: on the right of North; 180: turned round to the left). */
function protBeat(id: string, say0: string, M: MapSpec, on: string, rot: 0 | 180, o: { start?: "off" | "on"; startRot?: number; more?: (S: Scene) => void } = {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: on })
      o.more?.(S)
      withProt(S, M, o.start === "on" ? { on, rot: o.startRot ?? 40 } : { rot: o.startRot ?? 40 })
      const start = { rot: S.prot!.rot, c: [...S.prot!.c] }
      // the side the place is on says which way round the protractor goes
      S.tick = S2 => {
        const P = S2.prot
        if (!P || S2.drag || S2.got.has("said")) return
        // only once the student has moved it (it may start the wrong way round)
        if (P.rot === start.rot && P.c[0] === start.c[0] && P.c[1] === start.c[1]) return
        if (P.on === on && P.rot === (rot === 0 ? 180 : 0)) {
          S2.got.add("said")
          say(S2, rot === 0 ? "That's on the left of North. The line goes off to the right: turn it back." : "The line goes off to the left of North. Turn the protractor round to that side.", "wrong", 4)
          later(S2, 4, S3 => S3.got.delete("said"))
        }
      }
      look(S)
    },
    done: S => S.prot?.on === on && S.prot.rot === rot && S.drag === null,
    advanceAfter: 1400,
  }
}

/** Mark a bearing on the placed protractor with the pencil; then the line is ruled through the mark. */
function markBeat(id: string, say0: string, M: MapSpec, at: string, rot: 0 | 180, target: number, far: number, extra: (S: Scene) => void = () => {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: at })
      extra(S)
      withProt(S, M, { on: at, rot, fixed: true, pen: rot + 15, lit: true })
      S.prot!.penAt = target
      S.tick = S2 => {
        if (S2.got.has("marked") || S2.drag || S2.prot?.pen !== target) return
        // marked: the protractor lifts away and the line is ruled from the place through the mark
        S2.got.add("marked")
        const end = `${at}${target}`
        S2.P[end] = along(S2.P[at], target, far)
        later(S2, 0.5, S3 => { S3.prot = null; addSeg(S3, at, end, { col: BLUE, grown: false }) })
      }
      look(S)
    },
    // done once the line through the mark has been ruled all the way
    done: S => S.got.has("marked") && (S.segs.find(sg => sg.b === `${at}${target}` && sg.grow.v > 0.97) !== undefined),
    advanceAfter: 1200,
  }
}

/** The lines from both places, ruled. */
function ruled(S: Scene, a: string, b1: number, l1: number, b: string, b2: number, l2: number) {
  S.P[`${a}${b1}`] = along(S.P[a], b1, l1)
  S.P[`${b}${b2}`] = along(S.P[b], b2, l2)
  addSeg(S, a, `${a}${b1}`, { col: BLUE })
  addSeg(S, b, `${b}${b2}`, { col: BLUE })
}

/** Tap where the two lines cross: that's the place. */
function crossBeat(id: string, say0: string, board: (S: Scene) => void, at: Vec, name = "C"): Beat {
  return {
    id, say: say0,
    enter: S => {
      board(S)
      S.mode = "tapAny"
      S.onTap = (S2, p) => {
        if (S2.got.has("tap")) return
        S2.P[`${name}x`] = at
        const near = dist(p, ptS(S2, `${name}x`)) < (S2.touch ? 40 : 28)
        delete S2.P[`${name}x`]
        if (!near) { say(S2, `$${name}$ is on both lines. Where do they cross?`, "wrong", 3.4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.P[name] = at
        S2.names = { ...S2.names, [name]: name }
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1600,
  }
}

// ── walkthroughs ─────────────────────────────────────────────────────────

/** Reading the ruler: its 0 is on one end; read the other end in the lens. */
const readWalk = (on: string, to: string): WalkStep<Scene>[] => [
  { say: `The ruler's $0$ is on $${on}$.`, tex: `${on} \\to 0\\text{ cm}` },
  { say: `Read the number at $${to}$ in the lens. Each small mark is a millimetre, $0.1$ cm.`, tex: `${to} \\to \\;?` },
]
/** Map to real: each cm stands for so much. */
const realWalk = (cm: string, per: string, unit: string): WalkStep<Scene>[] => [
  { say: `Each cm on the map stands for $${per}$ ${unit}.`, tex: `1\\text{ cm} \\to ${per}\\text{ ${unit}}` },
  { say: `So $${cm}$ cm stands for $${cm}$ lots of $${per}$.`, tex: `${cm} \\times ${per}` },
]
/** Reading the protractor: the scale that starts at 0 on North, up to where the line crosses. */
const protWalk = (line: string): WalkStep<Scene>[] => [
  { say: "Find the scale that starts at $0$ on the North line.", tex: "\\text{Start at } 0 \\text{ on North}" },
  { say: `Count up that scale to where $${line}$ crosses the edge.`, tex: `\\text{Read where } ${line} \\text{ crosses}` },
]

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
  layBeat("lay", "Lay the ruler along $AB$, with its $0$ on $A$.", S25, "A", "B"),
  askNum("read", "How long is $AB$ on the map?", S => { mapBoard(S, S25); withRuler(S, S25, { on: "A", along: "B", fixed: true }) }, {
    name: "AB", answer: 6, unit: "cm", dec: true, measured: true,
    slips: [{ v: 60, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk("A", "B"),
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
  askNum("road", "A road is $3.4$ cm long on this map. How long is it really?", S => plainPage(S, { R: [-1.7, -0.4], T: [1.7, -0.4] }, [["R", "T"]], {}), {
    name: "\\text{Real}", answer: 17, unit: "km", dec: true,
    slips: [{ v: 8.4, say: "That's $3.4 + 5$. Each cm stands for $5$ km: multiply." }, { v: 0.68, say: "That's $3.4 \\div 5$. The real road is longer: multiply." }],
    walk: realWalk("3.4", "5", "km"),
  }),
  askNum("path", "A path is $15$ km long. How long is it on this map?", S => plainPage(S, {}, [], {}), {
    name: "\\text{Map}", answer: 3, unit: "cm", dec: true,
    slips: [{ v: 75, say: "That's $15 \\times 5$. The map is smaller than real life: divide." }, { v: 20, say: "That's $15 + 5$. Each $5$ km is $1$ cm: how many fives in $15$?" }],
    walk: [
      { say: "Each $5$ km on the ground is $1$ cm on the map.", tex: "5\\text{ km} \\to 1\\text{ cm}" },
      { say: "So count the fives in $15$.", tex: "15 \\div 5" },
    ],
  }),
  {
    id: "draw",
    say: "Draw it: slide the pencil along the ruler to $3$ cm.",
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

  // ── 3. The scale as a ratio ──
  watch("ratio", "A scale can also be written as a ratio, like $1 : 50\\,000$.", S => {
    plainPage(S, { U: [-2, 0], V: [-1, 0] }, [["U", "V"]], {}, "\\text{Scale: }1 : 50\\,000")
    S.along = { a: "U", b: "V", step: 1, tex: "1\\text{ cm}", lit: 1 }
    look(S)
  }, 2.6),
  watch("ratio-means", "It means $1$ cm on the map is $50\\,000$ cm in real life.", S => {
    plainPage(S, { U: [-2, 0], V: [-1, 0] }, [["U", "V"]], {}, "\\text{Scale: }1 : 50\\,000")
    S.along = { a: "U", b: "V", step: 1, tex: "50\\,000\\text{ cm}", under: "1\\text{ cm}", lit: 1 }
    look(S)
  }, 2.8),
  askNum("km-cm", "How many cm are in $1$ km?", S => plainPage(S, {}, [], {}, "\\text{Scale: }1 : 50\\,000"), {
    name: "1\\text{ km}", answer: 100000, unit: "cm", max: 7,
    slips: [{ v: 1000, say: "That's the metres in $1$ km. Each metre is $100$ cm." }, { v: 100, say: "That's the cm in $1$ metre. A km is $1000$ metres." }, { v: 10000, say: "Count the zeros: $1000$ metres, each $100$ cm." }],
    above: () => frac("units", row([atom("u1", "1\\text{ km} = 1000\\text{ m}")]), row([atom("u2", "1\\text{ m} = 100\\text{ cm}")]), "rgba(0,0,0,0)"),
    walk: [
      { say: "$1$ km is $1000$ m, and each metre is $100$ cm.", tex: "1000 \\times 100" },
      { say: "Count the zeros: three from $1000$ and two from $100$.", tex: "1000 \\times 100" },
    ],
  }),
  watch("lm", "On a map, Lenton and Mingfield are $4.5$ cm apart. Really, they are $9$ km apart.", S => {
    plainPage(S, { L: [-2.25, -0.4], M: [2.25, -0.4] }, [["L", "M"]], { L: "\\text{Lenton}", M: "\\text{Mingfield}" }, "\\text{Scale: }1 : n")
    S.segs = S.segs.map(sg => ({ ...sg, lab: { tex: "4.5\\text{ cm}" } }))
    look(S)
  }, 3),
  askNum("lm-1", "How many km does $1$ cm stand for?", S => {
    plainPage(S, { L: [-2.25, -0.4], M: [2.25, -0.4] }, [["L", "M"]], { L: "\\text{Lenton}", M: "\\text{Mingfield}" }, "\\text{Scale: }1 : n")
    S.segs = S.segs.map(sg => ({ ...sg, lab: { tex: "4.5\\text{ cm} \\to 9\\text{ km}" } }))
  }, {
    name: "1\\text{ cm}", answer: 2, unit: "km", dec: true,
    slips: [{ v: 40.5, say: "That's $4.5 \\times 9$. Share the $9$ km between the $4.5$ cm." }, { v: 0.5, say: "That's $4.5 \\div 9$. It's the km shared between the cm: $9 \\div 4.5$." }],
    walk: [
      { say: "$4.5$ cm stands for $9$ km.", tex: "4.5\\text{ cm} \\to 9\\text{ km}" },
      { say: "Share the $9$ km between the $4.5$ cm.", tex: "9 \\div 4.5" },
    ],
  }),
  askNum("lm-n", "So write the scale as $1 : n$.", S => plainPage(S, { L: [-2.25, -0.4], M: [2.25, -0.4] }, [["L", "M"]], { L: "\\text{Lenton}", M: "\\text{Mingfield}" }, "\\text{Scale: }1 : n"), {
    name: "1 : n", answer: 200000, max: 7,
    slips: [{ v: 2, say: "That's in km. A ratio needs the same units both sides: $2$ km in cm." }, { v: 2000, say: "That's in metres. Both sides in cm: $2$ km in cm." }, { v: 20000, say: "Count the zeros: $2$ lots of $100\\,000$ cm." }],
    above: () => row([atom("q1", "1\\text{ cm}"), op("r", ":"), atom("q2", "2\\text{ km}")]),
    walk: [
      { say: "Both sides must be in cm. $1$ km is $100\\,000$ cm.", tex: "2\\text{ km} = 2 \\times 100\\,000\\text{ cm}" },
      { say: "So $1$ cm stands for that many cm.", tex: "1 : 2 \\times 100\\,000" },
    ],
  }),
]

const PART_B: Beat[] = [
  // ── 4. Measuring a bearing ──
  watch("brg-q", "Now let's measure the bearing of $B$ from $A$.", S => { mapBoard(S, S25); look(S) }),
  protBeat("prot-on", "Put the protractor's centre on $A$.", S25, "A", 0, { startRot: 0 }),
  protBeat("prot-turn", "Turn it so its $0$ lies along the North line.", S25, "A", 0, { start: "on", startRot: 40 }),
  watch("two-scales", "A protractor has two scales. Read the one that starts at $0$ on North.", S => { mapBoard(S, S25, { prot: "A" }); withProt(S, S25, { on: "A", rot: 0, fixed: true, lit: true }); look(S) }, 3),
  askNum("read-110", "Read the bearing of $B$ from $A$.", S => { mapBoard(S, S25, { prot: "A" }); withProt(S, S25, { on: "A", rot: 0, fixed: true, lit: true }) }, {
    name: "\\text{Bearing}", answer: 110, three: true, measured: true, nearSay: "Close. Look again where $AB$ crosses the edge.",
    slips: [{ v: 70, say: "That's the other scale. Count up from $0$ on the North line." }],
    walk: protWalk("AB"),
  }),
  watch("left-q", "Here $B$ is to the left of North.", S => { mapBoard(S, S23); look(S) }, 2.2),
  protBeat("left-turn", "Turn the protractor round to the left of North.", S23, "A", 180, { start: "on", startRot: 0 }),
  askNum("left-read", "Read the angle from North round to $AB$.", S => { mapBoard(S, S23, { prot: "A" }); withProt(S, S23, { on: "A", rot: 180, fixed: true, lit: true }) }, {
    name: "\\text{Angle}", answer: 120, measured: true, nearSay: "Close. Look again where $AB$ crosses the edge.",
    slips: [{ v: 60, say: "That's the other scale. Start from $0$ on the North line." }],
    walk: protWalk("AB"),
  }),
  askNum("left-brg", "A bearing turns clockwise, the long way round. So what is the bearing?", S => {
    mapBoard(S, S23)
    S.arcs = [{ id: "l120", at: "A", from: 240, sweep: 120, col: ORANGE, tex: "120^\\circ" }, { id: "long", at: "A", from: 0, sweep: 240, col: BLUE, r: 1.5 }]
  }, {
    name: "\\text{Bearing}", answer: 240, three: true,
    slips: [{ v: 120, say: "That's the angle on the left. A bearing goes clockwise: take it from $360^\\circ$." }, { v: 300, say: "That's $180^\\circ + 120^\\circ$. The whole turn is $360^\\circ$." }],
    walk: [
      { say: "All the way round is $360^\\circ$.", tex: "360^\\circ" },
      { say: "The $120^\\circ$ on the left is the part the bearing does not turn through.", tex: "360 - 120" },
    ],
  }),

  // ── 5. Drawing a bearing ──
  watch("c-q", "Village $C$ is on a bearing of $060^\\circ$ from $A$, and on $320^\\circ$ from $B$.", S => { mapBoard(S, S25); look(S) }, 3),
  markBeat("mark-60", "With the protractor on $A$, mark $60^\\circ$ with the pencil.", S25, "A", 0, 60, 4.2),
  askNum("left-40", "$320^\\circ$ is past $180^\\circ$. How far to the left of North is it?", S => { mapBoard(S, S25); ruled1(S) }, {
    name: "\\text{Angle}", answer: 40,
    slips: [{ v: 140, say: "That's $320^\\circ - 180^\\circ$. From North going left: $360^\\circ - 320^\\circ$." }, { v: 320, say: "That's the bearing, all the way round clockwise. How much is left to $360^\\circ$?" }],
    walk: [
      { say: "A whole turn is $360^\\circ$.", tex: "360^\\circ" },
      { say: "The bearing turns $320^\\circ$ of it. The rest is on the left of North.", tex: "360 - 320" },
    ],
  }),
  protBeat("b-turn", "Put the protractor on $B$, turned round to the left of North.", S25, "B", 180, { startRot: 0, more: S => ruled1(S) }),
  markBeat("mark-40", "Mark $40^\\circ$ on the scale that starts at $0$ on North.", S25, "B", 180, 320, 5.4, S => ruled1(S)),
  crossBeat("c-tap", "Where is $C$? Tap it.", S => { mapBoard(S, S25); ruled(S, "A", 60, 4.2, "B", 320, 5.4) }, S25_C),
]

/** The first ruled line: from A on 060°. */
function ruled1(S: Scene) {
  S.P.A60 = along(S.P.A, 60, 4.2)
  addSeg(S, "A", "A60", { col: BLUE })
}

// ── 6. Exam questions ──
const PART_C: Beat[] = [
  // 4024/11/O/N/22 Q4
  watch("x1", "The diagram shows two ships, $A$ and $B$. $1$ cm represents $30$ m.", S => { mapBoard(S, W22); look(S) }, 2.6),
  layBeat("x1-lay", "Find the distance of $B$ from $A$. Lay the ruler along $AB$.", W22, "A", "B"),
  askNum("x1-cm", "How long is $AB$ on the drawing?", S => { mapBoard(S, W22); withRuler(S, W22, { on: "A", along: "B", fixed: true }) }, {
    name: "AB", answer: 5.6, unit: "cm", dec: true, measured: true,
    slips: [{ v: 56, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk("A", "B"),
  }),
  askNum("x1-m", "So what is the actual distance of $B$ from $A$?", S => { mapBoard(S, W22) }, {
    name: "\\text{Actual}", answer: 168, unit: "m", dec: true,
    slips: [{ v: 35.6, say: "That's $5.6 + 30$. Each cm is $30$ m: multiply." }, { v: 0.19, say: "The actual distance is bigger: $5.6$ lots of $30$ m." }],
    above: () => row([atom("ab", "AB"), op("e", "="), atom("v", "5.6\\text{ cm}")]),
    walk: realWalk("5.6", "30", "m"),
  }),
  protBeat("x1-prot", "Now the bearing of $B$ from $A$. Put the protractor on $A$, with $0$ on North.", W22, "A", 0),
  askNum("x1-brg", "Measure the bearing of $B$ from $A$.", S => { mapBoard(S, W22, { prot: "A" }); withProt(S, W22, { on: "A", rot: 0, fixed: true, lit: true }) }, {
    name: "\\text{Bearing}", answer: 125, three: true, measured: true, nearSay: "Close. Look again where $AB$ crosses the edge.",
    slips: [{ v: 55, say: "That's the other scale. Count up from $0$ on the North line." }],
    walk: protWalk("AB"),
  }),
  markBeat("x1-164", "$C$ is on a bearing of $164^\\circ$ from $A$. Mark it with the pencil.", W22, "A", 0, 164, 5.2),
  askNum("x1-left", "$C$ is also on a bearing of $252^\\circ$ from $B$. How far to the left of North is that?", S => { mapBoard(S, W22); w22Ruled1(S) }, {
    name: "\\text{Angle}", answer: 108,
    slips: [{ v: 72, say: "That's $252^\\circ - 180^\\circ$. From North going left: $360^\\circ - 252^\\circ$." }],
    walk: [{ say: "A whole turn is $360^\\circ$; the bearing turns $252^\\circ$ of it.", tex: "360^\\circ" }, { say: "The rest is on the left of North.", tex: "360 - 252" }],
  }),
  protBeat("x1-bprot", "Put the protractor on $B$, turned round to the left of North.", W22, "B", 180, { startRot: 0, more: S => w22Ruled1(S) }),
  markBeat("x1-252", "Mark $108^\\circ$ on the scale that starts at $0$ on North.", W22, "B", 180, 252, 4.6, S => w22Ruled1(S)),
  crossBeat("x1-c", "Find and label $C$. Tap where the lines cross.", S => { mapBoard(S, W22); ruled(S, "A", 164, 5.2, "B", 252, 4.6) }, W22_C),

  // 4024/12/M/J/23 Q6(a)
  watch("x2", "Villages $A$ and $B$. The scale is $1$ cm to $2$ km.", S => { mapBoard(S, S23); look(S) }, 2.2),
  layBeat("x2-lay", "Find the actual distance $AB$. Lay the ruler along it.", S23, "A", "B"),
  askNum("x2-cm", "How long is $AB$ on the map?", S => { mapBoard(S, S23); withRuler(S, S23, { on: "A", along: "B", fixed: true }) }, {
    name: "AB", answer: 9.5, unit: "cm", dec: true, measured: true,
    slips: [{ v: 95, say: "That's in millimetres. $10$ mm make $1$ cm." }],
    walk: readWalk("A", "B"),
  }),
  askNum("x2-km", "So what is the actual distance $AB$?", S => mapBoard(S, S23), {
    name: "\\text{Actual}", answer: 19, unit: "km", dec: true,
    slips: [{ v: 11.5, say: "That's $9.5 + 2$. Each cm is $2$ km: multiply." }, { v: 4.75, say: "The actual distance is bigger: $9.5$ lots of $2$ km." }],
    above: () => row([atom("ab", "AB"), op("e", "="), atom("v", "9.5\\text{ cm}")]),
    walk: realWalk("9.5", "2", "km"),
  }),
  protBeat("x2-prot", "Find the bearing of $B$ from $A$. Put the protractor on $A$, on the side $B$ is.", S23, "A", 180),
  askNum("x2-read", "Read the angle from North round to $AB$.", S => { mapBoard(S, S23, { prot: "A" }); withProt(S, S23, { on: "A", rot: 180, fixed: true, lit: true }) }, {
    name: "\\text{Angle}", answer: 120, measured: true, nearSay: "Close. Look again where $AB$ crosses the edge.",
    slips: [{ v: 60, say: "That's the other scale. Start from $0$ on the North line." }],
    walk: protWalk("AB"),
  }),
  askNum("x2-brg", "So what is the bearing of $B$ from $A$?", S => { mapBoard(S, S23); S.arcs = [{ id: "l120", at: "A", from: 240, sweep: 120, col: ORANGE, tex: "120^\\circ" }] }, {
    name: "\\text{Bearing}", answer: 240, three: true,
    slips: [{ v: 120, say: "That's the angle on the left. A bearing goes clockwise: take it from $360^\\circ$." }],
    walk: [{ say: "All the way round is $360^\\circ$.", tex: "360^\\circ" }, { say: "Take away the $120^\\circ$ on the left.", tex: "360 - 120" }],
  }),

  // 4024/12/M/J/24 Q10(a)
  watch("x3", "Part of a field, $ABCD$. Measure the bearing of $C$ from $B$.", S => { mapBoard(S, S24); look(S) }, 2.6),
  protBeat("x3-prot", "Put the protractor on $B$, with $0$ on North.", S24, "B", 0),
  askNum("x3-brg", "Read the bearing of $C$ from $B$.", S => { mapBoard(S, S24, { prot: "B" }); withProt(S, S24, { on: "B", rot: 0, fixed: true, lit: true }) }, {
    name: "\\text{Bearing}", answer: 70, three: true, measured: true, nearSay: "Close. Look again where $BC$ crosses the edge.",
    slips: [{ v: 110, say: "That's the other scale. Count up from $0$ on the North line." }],
    walk: protWalk("BC"),
  }),

  // ── the end ──
  watch("end-scale", "To get the real length, multiply by the scale. To go back to the map, divide.", S => {
    mapBoard(S, S25)
    S.along = { a: "A", b: "B", step: 1, tex: "5\\text{ km}", lit: 6 }
    look(S)
  }, 2.6),
  {
    id: "end-brg",
    say: "Measure a bearing from North, clockwise. Past $180^\\circ$, measure on the left and take it from $360^\\circ$.",
    enter: S => {
      mapBoard(S, S23)
      S.arcs = [{ id: "l120", at: "A", from: 240, sweep: 120, col: ORANGE, tex: "120^\\circ" }, { id: "long", at: "A", from: 0, sweep: 240, col: BLUE, tex: "240^\\circ", r: 1.5 }]
      look(S)
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

/** The first ruled line of the ships question: from A on 164°. */
function w22Ruled1(S: Scene) {
  S.P.A164 = along(S.P.A, 164, 5.2)
  addSeg(S, "A", "A164", { col: BLUE })
}

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C]

applyParts(BEATS, [
  ["real", "Maps and scale"],
  ["lay", "Measuring on a map"],
  ["ratio", "The scale as a ratio"],
  ["brg-q", "Measuring a bearing"],
  ["c-q", "Drawing a bearing"],
  ["x1", "Exam questions"],
])

