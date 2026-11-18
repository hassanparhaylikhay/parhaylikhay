/**
 * Bearings (4.3, lesson 1 of 2). Why a direction is measured from North;
 * turning a line clockwise from North; due East, South and West; three
 * figures; the bearing of one place from another (stand at the "from"
 * place); the bearing back (turn round: half a turn, checked from North with
 * alternate angles); bearings from angle facts; exam questions from the
 * papers: 4024/11/M/J/21 Q15(c), 4024/11/M/J/23 Q13(a), 4024/11/O/N/20 Q13,
 * 4024/21/M/J/22 Q9(a), 4024/21/M/J/24 Q9(a).
 */

import { applyParts } from "../chapter"
import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import { row, op, atom } from "../equation"
import type { Vec } from "../geometry"
import {
  type Scene, type VisKey, type Arc, CHALK, BLUE, ORANGE, GREEN,
  resetBeat, show, later, say, places, along, addSeg, startInput, boxNode, choose, brgOf, brgText, norm, diff,
} from "./scene"

type Beat = BeatOf<Scene>

const LOOK: VisKey[] = ["board", "fig", "letters", "marks"]
const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])

/** A bearing as the board writes it, with its degree sign. */
const B3 = (b: number) => `${brgText(b, true)}^\\circ`

/**
 * Redraw a board for a step of "Show me how" without losing the question:
 * the boards start from a clean slate, which would also clear the answer box.
 */
const redraw = (board: (S: Scene) => void) => (S: Scene) => {
  const { input, eqFn, walkTex } = S
  board(S)
  S.input = input
  S.eqFn = eqFn
  S.walkTex = walkTex
}

// ── boards ───────────────────────────────────────────────────────────────

/** One place and a line from it the student turns, with room round it for the line any way. */
function dialBoard(S: Scene, o: { brg?: number; three?: boolean; handle?: boolean; magnets?: number[]; readout?: boolean } = {}) {
  // the line turns from where it was drawn last, never jumps
  const was = S.rays.find(r => r.id === "r")?.d
  resetBeat(S)
  places(S, { A: [0, 0], f1: [0, 4.5], f2: [4.5, 0], f3: [0, -4.5], f4: [-4.5, 0] })
  S.names = { A: "A" }
  S.norths = ["A"]
  S.northLen = 4
  S.fitPts = ["f1", "f2", "f3", "f4"]
  S.fitPad = 0.25
  const b = o.brg ?? S.keep.dial ?? 40
  S.rays = [{ id: "r", at: "A", brg: b, d: was ?? b, len: 4, handle: o.handle ?? true, arc: true, col: CHALK }]
  S.magnets = o.magnets ?? []
  S.readout = o.readout === false ? null : { ray: "r", three: !!o.three, col: BLUE }
  // where the student leaves the line, the next beat picks it up
  S.tick = S2 => { const r = S2.rays.find(x => x.id === "r"); if (r) S2.keep.dial = r.brg }
}

/** Two places: B is on a bearing of 072° from A. */
const AB_BRG = 72
function twoBoard(S: Scene, o: { norths?: string[]; seg?: boolean } = {}) {
  resetBeat(S)
  places(S, { A: [0, 0], B: along([0, 0], AB_BRG, 6) })
  S.names = { A: "A", B: "B" }
  S.norths = o.norths ?? ["A", "B"]
  S.fitPts = ["A", "B"]
  S.fitPad = 1.5
  if (o.seg) addSeg(S, "A", "B")
}

/** The bearing of one place from another, as an arc from North at the first with its value. */
function brgArc(S: Scene, at: string, to: string, o: Partial<Arc> = {}): Arc {
  const b = brgOf(S.P[at], S.P[to])
  return { id: `b-${at}${to}`, at, from: 0, sweep: b, col: BLUE, tex: B3(b), ...o }
}

/** The answer box: the bearing typed, then its degree sign. */
const askLine = (S: Scene) => row([atom("bl", "\\text{Bearing}"), op("beq", "="), boxNode(S), atom("bdeg", "{}^\\circ")])

/** Ask for a bearing, typed with three figures. */
function askBrg(id: string, say0: string, enter: (S: Scene) => void, o: {
  answer: number
  slips?: { v: number; say: string }[]
  walk: WalkStep<Scene>[]
  then?: (S: Scene) => void
}): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      startInput(S, {
        answer: o.answer, three: true, max: 3, typed: String(o.answer).padStart(3, "0"), slips: o.slips,
        onRight: S2 => { o.then?.(S2) },
      })
      S.eqFn = S2 => (S2.input?.state === "right" ? row([atom("bl", "\\text{Bearing}"), op("beq", "="), atom("ans", B3(o.answer), { col: GREEN })]) : askLine(S2))
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 2000,
    walk: o.walk,
  }
}

/** A watching beat. */
function watch(id: string, say0: string, enter: (S: Scene) => void, after = 1.8): Beat {
  return { id, say: say0, enter, cta: "", ctaAfter: after }
}

/** Turn the line until it points this way (it clicks onto it). */
function aimBeat(id: string, say0: string, target: number, o: { three?: boolean; note?: string } = {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      dialBoard(S, { three: o.three, magnets: [target] })
      // never opens already pointing there
      const r = S.rays[0]
      if (Math.abs(diff(r.brg, target)) < 20) { r.brg = norm(target + 70); r.d = r.brg }
      if (o.note) later(S, 0.6, S2 => say(S2, o.note!, "calm", 600))
      look(S, ["readout"])
    },
    done: S => S.rays[0]?.brg === norm(target) && S.drag === null,
    advanceAfter: 1300,
  }
}

/** Where do you stand? Tap the "from" place. */
function standBeat(id: string, say0: string, at: string, other: string, board: (S: Scene) => void): Beat {
  return {
    id, say: say0,
    enter: S => {
      board(S)
      S.mode = "tapPoint"
      S.tapPoints = [at, other]
      S.onPoint = (S2, n) => {
        if (S2.got.has("tap")) return
        if (n !== at) { say(S2, `"From $${at}$" means you stand at $${at}$.`, "wrong", 3.6); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.markers = [{ id: "you", at: [...S2.P[at]] as Vec, heading: 0 }]
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1400,
  }
}

/** From a place, turn a line from North until it points at the other place; the marker turns with it. */
function faceBeat(id: string, say0: string, at: string, to: string): Beat {
  return {
    id, say: say0,
    enter: S => {
      twoBoard(S)
      const want = brgOf(S.P[at], S.P[to])
      const start = norm(want - 110)
      S.rays = [{ id: "r", at, to, brg: start, d: start, len: 0, handle: true, arc: true, col: CHALK }]
      // room for the line to point any way round its place
      const l = Math.hypot(S.P[to][0] - S.P[at][0], S.P[to][1] - S.P[at][1]), c = S.P[at]
      places(S, { ...S.P, g1: [c[0], c[1] + l], g2: [c[0] + l, c[1]], g3: [c[0], c[1] - l], g4: [c[0] - l, c[1]] })
      S.fitPts = ["A", "B", "g1", "g2", "g3", "g4"]
      S.fitPad = 0.4
      S.magnets = [want]
      S.markers = [{ id: "you", at: [...S.P[at]] as Vec, heading: start }]
      S.readout = { ray: "r", three: true, col: BLUE }
      S.tick = S2 => { const r = S2.rays[0], m = S2.markers[0]; if (r && m) m.heading = r.d }
      look(S, ["readout"])
    },
    done: S => { const r = S.rays[0]; return !!r && r.brg === norm(brgOf(S.P[r.at], S.P[r.to!])) && S.drag === null },
    advanceAfter: 1500,
  }
}

/**
 * The bearing back, walked through on the figure: you walked from one place
 * to the other facing the bearing; turning round to look back is half a
 * turn. It stops at what to work out.
 */
function backWalk(from: string, to: string, brg: number, board: (S: Scene) => void, names: [string, string]): WalkStep<Scene>[] {
  const big = brg >= 180
  return [
    {
      say: `Walking from $${names[0]}$ to $${names[1]}$, you face $${B3(brg)}$.`,
      tex: `${B3(brg)}`,
      show: S => { redraw(board)(S); S.markers = [{ id: "you", at: [...S.P[to]] as Vec, heading: brg }]; S.arcs = S.arcs.map(a => (a.at === from ? { ...a, pulse: true } : a)) },
    },
    {
      say: big ? "Turn round to look back. Adding half a turn would go past $360^\\circ$, so take $180^\\circ$ away." : "Turn round to look back: that's half a turn more.",
      tex: big ? `${brgText(brg)} - 180` : `${brgText(brg)} + 180`,
      show: S => {
        redraw(board)(S)
        S.markers = [{ id: "you", at: [...S.P[to]] as Vec, heading: norm(brg + 180) }]
        S.arcs = [...S.arcs, { id: "half", at: to, from: brg, sweep: 180, col: ORANGE, tex: "180^\\circ", r: 0.8 }]
      },
    },
  ]
}

/** The two bearings between A and B, live, and the line that shows they differ by 180°. */
function liveBoth(S: Scene) {
  const ab = brgOf(S.P.A, S.P.B), ba = brgOf(S.P.B, S.P.A)
  S.arcs = [
    { id: "ab", at: "A", from: 0, sweep: ab, col: BLUE, tex: B3(ab) },
    { id: "ba", at: "B", from: 0, sweep: ba, col: BLUE, tex: B3(ba), r: 1.25 },
  ]
  const [hi, lo] = Math.round(ab) >= Math.round(ba) ? [ab, ba] : [ba, ab]
  S.eqFn = () => row([atom("hi", B3(hi), { col: BLUE }), op("m", "-"), atom("lo", B3(lo), { col: BLUE }), op("eq", "="), atom("d", "180^\\circ", { col: ORANGE })])
}

// ── the beats ────────────────────────────────────────────────────────────

const PART_A: Beat[] = [
  // ── 1. Measuring from North ──
  watch("ships", "Two ships are at sea.", S => {
    resetBeat(S)
    places(S, { A: [-3.2, -0.8], B: [3.2, 1.2] })
    S.names = { A: "A", B: "B" }
    S.fitPts = ["A", "B"]
    S.fitPad = 1.6
    S.markers = [{ id: "a", at: [-3.2, -0.8], heading: 35, size: 22 }, { id: "b", at: [3.2, 1.2], heading: 250, size: 22 }]
    look(S)
  }),
  watch("right", "Ship $A$ tells ship $B$: head right.", S => {
    resetBeat(S)
    places(S, { A: [-3.2, -0.8], B: [3.2, 1.2] })
    S.names = { A: "A", B: "B" }
    S.fitPts = ["A", "B"]
    S.fitPad = 1.6
    S.markers = [{ id: "a", at: [-3.2, -0.8], heading: 35, size: 22 }, { id: "b", at: [3.2, 1.2], heading: 250, size: 22 }]
    // B turns to its own right; a ghost shows the right that A meant
    S.acts.push({ dur: 0.6 }, {
      dur: 1.6,
      run: (S2, e) => { S2.markers[1].heading = 250 + 90 * e },
      end: S2 => { S2.curls = [{ at: "b", from: 250, to: 340, col: ORANGE, r: 42 }] },
    }, {
      dur: 1.0,
      begin: S2 => { S2.markers.push({ id: "ghost", at: [3.2, 1.2], heading: 125, ghost: true, op: 0, size: 22 }) },
      run: (S2, e) => { const g = S2.markers.find(m => m.id === "ghost"); if (g) g.op = e },
    })
    look(S)
  }, 4.2),
  watch("depends", "Right depends on which way you are facing.", S => {
    resetBeat(S)
    places(S, { A: [-3.2, -0.8], B: [3.2, 1.2] })
    S.names = { A: "A", B: "B" }
    S.fitPts = ["A", "B"]
    S.fitPad = 1.6
    S.markers = [{ id: "a", at: [-3.2, -0.8], heading: 35, size: 22 }, { id: "b", at: [3.2, 1.2], heading: 340, size: 22 }, { id: "ghost", at: [3.2, 1.2], heading: 125, ghost: true, size: 22 }]
    S.curls = [{ at: "a", from: 35, to: 125, col: CHALK, r: 42 }, { at: "b", from: 250, to: 340, col: ORANGE, r: 42 }]
    look(S)
  }, 2.4),
  watch("north", "So we measure from one way that never changes: North.", S => {
    resetBeat(S)
    places(S, { A: [-3.2, -0.8], B: [3.2, 1.2] })
    S.names = { A: "A", B: "B" }
    S.fitPts = ["A", "B"]
    S.fitPad = 1.6
    S.markers = [{ id: "a", at: [-3.2, -0.8], heading: 35, op: 0.35, size: 22 }, { id: "b", at: [3.2, 1.2], heading: 340, op: 0.35, size: 22 }]
    S.norths = ["A", "B"]
    S.vals.northT = 0
    S.acts.push({ dur: 0.4 }, { dur: 1.4, run: (S2, e) => { S2.vals.northT = e } })
    S.northGlow = ["A", "B"]
    look(S)
  }, 2.6),
  {
    id: "turn",
    say: "Turn the line from $A$. Watch the angle from North.",
    enter: S => { dialBoard(S, { brg: 40 }); look(S, ["readout"]) },
    done: S => S.turned >= 150,
    free: true,
    minPlay: 4,
  },
  {
    id: "left",
    say: "Now turn it a little to the left of North.",
    enter: S => {
      dialBoard(S)
      // starts on the right, so it has to cross North
      const r = S.rays[0]
      if (r.brg > 200) { r.brg = 60; r.d = 60 }
      look(S, ["readout"])
    },
    done: S => { const b = S.rays[0]?.brg ?? 0; return b >= 320 && b <= 359 && S.drag === null },
    advanceAfter: 1600,
  },
  watch("clockwise", "It went the long way round. A bearing always turns clockwise, like a clock's hands.", S => {
    dialBoard(S, { brg: S.keep.dial !== undefined && S.keep.dial >= 300 ? S.keep.dial : 345, handle: false })
    S.clock = { at: "A", t0: S.time }
    look(S, ["readout"])
  }, 3),
  watch("bearing", "This angle is called a *bearing*.", S => {
    dialBoard(S, { brg: 130, handle: false })
    look(S, ["readout"])
  }, 2),
  aimBeat("east", "Point the line due East.", 90, { note: "*Due* East means exactly East." }),
  aimBeat("south", "Now due South.", 180),
  aimBeat("west", "And due West.", 270),
  watch("rose", "North, East, South and West are $0^\\circ$, $90^\\circ$, $180^\\circ$ and $270^\\circ$.", S => {
    dialBoard(S, { brg: 270, handle: false, readout: false })
    S.rays[0].arc = false
    S.rose = { at: "A", t0: S.time, three: false }
    // room round the line for the four letters and their values
    places(S, { ...S.P, f1: [0, 6.6], f2: [6.6, 0], f3: [0, -6.6], f4: [-6.6, 0] })
    look(S)
  }, 2.6),

  // ── 2. Three figures ──
  aimBeat("make-45", "Make a bearing of $45^\\circ$.", 45),
  watch("three", "A bearing always has three figures, so this is $045^\\circ$.", S => {
    dialBoard(S, { brg: 45, handle: false })
    later(S, 0.7, S2 => { if (S2.readout) S2.readout = { ...S2.readout, three: true } })
    look(S, ["readout"])
  }, 2.6),
  {
    id: "eight",
    say: "How is $8^\\circ$ written as a bearing?",
    enter: S => {
      dialBoard(S, { brg: 8, handle: false, readout: false })
      S.rays[0].arc = false
      S.arcs = [{ id: "e", at: "A", from: 0, sweep: 8, col: BLUE, tex: "8^\\circ", r: 1.15 }]
      choose(S, ["$8^\\circ$", "$080^\\circ$", "$008^\\circ$"], 2, false, (S2, k, right) => {
        if (right) { say(S2, "Yes. Two zeros make it three figures.", "calm", 3); S2.readout = { brg: 8, three: true, col: BLUE }; S2.vis.readout.t = 1; return }
        say(S2, k === 0 ? "A bearing needs three figures." : "$080^\\circ$ is eighty degrees. Eight needs two zeros in front.", "wrong", 4)
      })
      look(S, ["chips"])
    },
    done: S => S.choice?.state === "right",
    advanceAfter: 2200,
  },
  aimBeat("make-300", "Make a bearing of $300^\\circ$.", 300, { three: true }),
]

const PART_B: Beat[] = [
  // ── 3. The bearing from a place ──
  watch("two", "Here are two villages, $A$ and $B$.", S => { twoBoard(S); look(S) }),
  standBeat("stand-a", "For the bearing of $B$ from $A$, where do you stand? Tap it.", "A", "B", S => twoBoard(S)),
  faceBeat("face-b", "Face North, then turn until you face $B$.", "A", "B"),
  standBeat("stand-b", "Now the bearing of $A$ from $B$. Where do you stand?", "B", "A", S => { twoBoard(S); S.arcs = [brgArc(S, "A", "B")]; addSeg(S, "A", "B", { col: BLUE }) }),
  faceBeat("face-a", "Face North at $B$, then turn until you face $A$.", "B", "A"),
  watch("both", "From $B$ it's $252^\\circ$, not $072^\\circ$.", S => {
    twoBoard(S, { seg: true })
    S.arcs = [brgArc(S, "A", "B"), brgArc(S, "B", "A", { r: 1.25 })]
    look(S)
  }, 2.4),

  // ── 4. The bearing back ──
  {
    id: "walk",
    say: "Walk from $A$ to $B$.",
    enter: S => {
      twoBoard(S, { seg: true })
      S.arcs = [brgArc(S, "A", "B")]
      S.markers = [{ id: "you", at: [...S.P.A] as Vec, heading: AB_BRG }]
      const A = S.P.A, B = S.P.B
      S.acts.push({ dur: 0.5 }, { dur: 2.6, run: (S2, e) => { S2.markers[0].at = [A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e] } })
      look(S)
    },
    cta: "", ctaAfter: 3.4,
  },
  {
    id: "turn-round",
    say: "Now turn round to look back at $A$.",
    enter: S => {
      twoBoard(S, { seg: true })
      S.arcs = [brgArc(S, "A", "B")]
      S.markers = [{ id: "you", at: [...S.P.B] as Vec, heading: AB_BRG }]
      const half: Arc = { id: "half", at: "B", from: AB_BRG, sweep: 0, col: ORANGE, r: 0.8 }
      S.arcs.push(half)
      // the turn, slowly, clockwise: the orange arc grows with it
      S.acts.push({ dur: 0.6 }, {
        dur: 2.4,
        run: (S2, e) => { S2.markers[0].heading = AB_BRG + 180 * e; const h = S2.arcs.find(a => a.id === "half"); if (h) h.sweep = 180 * e },
        end: S2 => { const h = S2.arcs.find(a => a.id === "half"); if (h) h.tex = "180^\\circ" },
      })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },
  watch("half", "Turning round is half a turn, $180^\\circ$.", S => { turnedBoard(S); S.arcs = S.arcs.map(a => (a.id === "half" ? { ...a, pulse: true } : a)); look(S) }, 2.2),
  askBrg("back", "So what is the bearing of $A$ from $B$?", S => { turnedBoard(S) }, {
    answer: 252,
    slips: [{ v: 72, say: "That's the bearing of $B$ from $A$. Now you face the other way." }, { v: 108, say: "That's $180^\\circ - 72^\\circ$. Turning round adds $180^\\circ$." }, { v: 180, say: "That's the half turn. Add it to the $072^\\circ$ you were facing." }],
    walk: backWalk("A", "B", AB_BRG, S => turnedBoard(S, { bare: true }), ["A", "B"]),
  }),
  watch("check", "Let's check it from North at $B$. The two North lines are parallel.", S => {
    twoBoard(S, { seg: true })
    S.arcs = [brgArc(S, "A", "B")]
    S.parallel = true
    S.northGlow = ["A", "B"]
    S.souths = ["B"]
    look(S)
  }, 2.6),
  {
    id: "alt",
    say: "Tap the angle at $B$ that matches the $72^\\circ$ at $A$.",
    enter: S => {
      twoBoard(S, { seg: true })
      S.parallel = true
      S.souths = ["B"]
      S.arcs = [
        { id: "a72", at: "A", from: 0, sweep: AB_BRG, col: BLUE, tex: "72^\\circ" },
        { id: "alt", at: "B", from: 180, sweep: AB_BRG, col: CHALK },
        { id: "co", at: "B", from: 180 + AB_BRG, sweep: 180 - AB_BRG, col: CHALK },
      ]
      S.mode = "tapArc"
      S.tapArcs = ["alt", "co"]
      S.onArc = (S2, id) => {
        if (S2.got.has("tap")) return
        if (id !== "alt") { say(S2, "That one and the $72^\\circ$ make $180^\\circ$. Look on the other side of $AB$.", "wrong", 4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.arcs = S2.arcs.filter(a => a.id !== "co").map(a => (a.id === "alt" ? { ...a, col: BLUE, tex: "72^\\circ", pulse: true } : a.id === "a72" ? { ...a, pulse: true } : a))
        S2.segs = S2.segs.map(s => ({ ...s, glow: true }))
        S2.note = null
        say(S2, "They are *alternate angles*, like a Z.", "calm", 600)
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 2400,
  },
  watch("from-north", "From North at $B$: $180^\\circ$ round to South, then $72^\\circ$ more.", S => {
    twoBoard(S, { seg: true })
    S.souths = ["B"]
    S.arcs = [
      { id: "a72", at: "A", from: 0, sweep: AB_BRG, col: BLUE, tex: "72^\\circ" },
      { id: "s180", at: "B", from: 0, sweep: 0, col: ORANGE, tex: "180^\\circ", r: 0.8 },
      { id: "s72", at: "B", from: 180, sweep: 0, col: BLUE, tex: "72^\\circ", r: 1.25 },
    ]
    S.acts.push({ dur: 0.4 }, { dur: 1.6, run: (S2, e) => { S2.arcs[1].sweep = 180 * e } }, { dur: 1.0, run: (S2, e) => { S2.arcs[2].sweep = AB_BRG * e } })
    S.eqFn = () => row([atom("t1", "180^\\circ", { col: ORANGE }), op("p", "+"), atom("t2", "72^\\circ", { col: BLUE }), op("eq", "="), atom("t3", "252^\\circ", { col: GREEN })])
    look(S, ["eq"])
  }, 3.4),
  {
    id: "move-b",
    say: "Move $B$ anywhere. Watch both bearings.",
    enter: S => {
      twoBoard(S, { seg: true })
      S.dragPts = ["B"]
      S.dragRing = { at: "A", min: 3, max: 7 }
      S.vals.moved = 0
      let last: Vec = [...S.P.B] as Vec
      S.tick = S2 => {
        S2.vals.moved += Math.hypot(S2.P.B[0] - last[0], S2.P.B[1] - last[1])
        last = [...S2.P.B] as Vec
        S2.keep.bx = S2.P.B[0]
        S2.keep.by = S2.P.B[1]
        liveBoth(S2)
      }
      liveBoth(S)
      look(S, ["eq"])
    },
    done: S => (S.vals.moved ?? 0) >= 8,
    free: true,
    minPlay: 5,
  },
  watch("differ", "They always differ by $180^\\circ$.", S => {
    twoBoard(S, { seg: true })
    if (S.keep.bx !== undefined) places(S, { A: [0, 0], B: [S.keep.bx, S.keep.by] })
    liveBoth(S)
    look(S, ["eq"])
  }, 2.2),
  {
    id: "past-180",
    say: "Put $B$ so its bearing from $A$ is more than $180^\\circ$.",
    enter: S => {
      // starts at 072°, so the student has to move it round
      twoBoard(S, { seg: true })
      S.dragPts = ["B"]
      S.dragRing = { at: "A", min: 3, max: 7 }
      S.tick = S2 => { S2.keep.past = brgOf(S2.P.A, S2.P.B); liveBoth(S2) }
      liveBoth(S)
      look(S, ["eq"])
    },
    done: S => Math.round(brgOf(S.P.A, S.P.B)) > 180 && Math.round(brgOf(S.P.A, S.P.B)) < 360 && S.drag === null,
    advanceAfter: 1600,
  },
  watch("less", "Then the bearing back is $180^\\circ$ less.", S => {
    twoBoard(S, { seg: true })
    const b = S.keep.past ?? 240
    places(S, { A: [0, 0], B: along([0, 0], b, 6) })
    liveBoth(S)
    look(S, ["eq"])
  }, 2.4),
  askBrg("q40", "The bearing of $Q$ from $P$ is $040^\\circ$. Find the bearing of $P$ from $Q$.", S => pqBoard(S, 40), {
    answer: 220,
    slips: [{ v: 140, say: "That's $180^\\circ - 40^\\circ$. Turning round adds $180^\\circ$." }, { v: 320, say: "That's $360^\\circ - 40^\\circ$. Turning round is half a turn." }, { v: 40, say: "That's the bearing of $Q$ from $P$. Stand at $Q$ and look back." }],
    walk: backWalk("P", "Q", 40, S => pqBoard(S, 40), ["P", "Q"]),
  }),
  askBrg("q290", "The bearing of $Q$ from $P$ is $290^\\circ$. Find the bearing of $P$ from $Q$.", S => pqBoard(S, 290), {
    answer: 110,
    slips: [{ v: 470, say: "That's more than a full turn. Take $180^\\circ$ away instead." }, { v: 70, say: "That's $360^\\circ - 290^\\circ$. Turning round is half a turn." }, { v: 290, say: "That's the bearing of $Q$ from $P$. Stand at $Q$ and look back." }],
    walk: backWalk("P", "Q", 290, S => pqBoard(S, 290), ["P", "Q"]),
  }),
]

/** A and B after the turn: you stand at B facing back at A, the half turn in orange. */
function turnedBoard(S: Scene, o: { bare?: boolean } = {}) {
  twoBoard(S, { seg: true })
  S.arcs = [brgArc(S, "A", "B")]
  if (o.bare) return
  S.markers = [{ id: "you", at: [...S.P.B] as Vec, heading: AB_BRG + 180 }]
  S.arcs.push({ id: "half", at: "B", from: AB_BRG, sweep: 180, col: ORANGE, tex: "180^\\circ", r: 0.8 })
}

/** Q on a bearing from P, as a question draws it: North at both, the bearing given at P. */
function pqBoard(S: Scene, b: number) {
  resetBeat(S)
  places(S, { P: [0, 0], Q: along([0, 0], b, 6) })
  S.names = { P: "P", Q: "Q" }
  S.norths = ["P", "Q"]
  S.fitPts = ["P", "Q"]
  S.fitPad = 1.5
  addSeg(S, "P", "Q")
  S.arcs = [brgArc(S, "P", "Q")]
}

// ── 5. Bearings from angles: 4024/11/O/N/20 Q13 ──
/** O with North; OA and OC each 70° from North; B between, with x and y. */
function oBoard(S: Scene, o: { northA?: boolean } = {}) {
  resetBeat(S)
  const O: Vec = [0, 0]
  places(S, { O, A: along(O, 70, 5), B: along(O, 136, 5.6), C: along(O, 290, 5) })
  S.names = { O: "O", A: "A", B: "B", C: "C" }
  S.norths = o.northA ? ["O", "A"] : ["O"]
  S.fitPts = ["O", "A", "B", "C"]
  S.fitPad = 1.2
  addSeg(S, "O", "A")
  addSeg(S, "O", "B")
  addSeg(S, "O", "C")
  S.arcs = [
    { id: "r70", at: "O", from: 0, sweep: 70, col: CHALK, tex: "70^\\circ" },
    { id: "l70", at: "O", from: 290, sweep: 70, col: CHALK, tex: "70^\\circ" },
    { id: "x", at: "O", from: 70, sweep: 66, col: CHALK, tex: "x^\\circ", r: 0.85 },
    { id: "y", at: "O", from: 136, sweep: 154, col: CHALK, tex: "y^\\circ", r: 0.7 },
  ]
}

const PART_C: Beat[] = [
  watch("o-70", "$OA$ and $OC$ each make $70^\\circ$ with the North line.", S => { oBoard(S); look(S) }, 2.6),
  askBrg("o-a", "What is the bearing of $A$ from $O$?", S => oBoard(S), {
    answer: 70,
    slips: [{ v: 290, say: "That's round to $C$. Turn clockwise from North until you face $A$." }],
    walk: [
      { say: "Stand at $O$ and face North.", tex: "\\text{From North at } O", show: S => { redraw(oBoard)(S); S.markers = [{ id: "you", at: [0, 0], heading: 0 }] } },
      { say: "Turn clockwise until you face $A$. Three figures.", tex: "70^\\circ", show: S => { redraw(oBoard)(S); S.markers = [{ id: "you", at: [0, 0], heading: 70 }]; S.arcs = S.arcs.map(a => (a.id === "r70" ? { ...a, pulse: true, col: BLUE } : a)) } },
    ],
    then: S => { S.arcs = S.arcs.map(a => (a.id === "r70" ? { ...a, col: BLUE, tex: B3(70) } : a)) },
  }),
  askBrg("o-c", "And the bearing of $C$ from $O$?", S => { oBoard(S); S.arcs = S.arcs.map(a => (a.id === "r70" ? { ...a, col: BLUE, tex: B3(70) } : a)) }, {
    answer: 290,
    slips: [{ v: 70, say: "That's the angle to the left of North. A bearing turns clockwise, all the way round." }, { v: 250, say: "Turn clockwise from North past $A$ and $B$, all the way round to $C$." }],
    walk: [
      { say: "Face North at $O$, then turn clockwise.", show: S => { redraw(oBoard)(S); S.markers = [{ id: "you", at: [0, 0], heading: 0 }] }, tex: "\\text{Clockwise from North}" },
      { say: "You go past $A$ and $B$, nearly all the way round. Only $70^\\circ$ is left.", tex: "360 - 70", show: S => { redraw(oBoard)(S); S.markers = [{ id: "you", at: [0, 0], heading: 290 }]; S.arcs = [...S.arcs.map(a => (a.id === "l70" ? { ...a, pulse: true } : a)), { id: "long", at: "O", from: 0, sweep: 290, col: BLUE, r: 1.45 }] } },
    ],
    then: S => { S.arcs = [...S.arcs, { id: "long", at: "O", from: 0, sweep: 290, col: BLUE, r: 1.45, tex: B3(290) }] },
  }),
  askBrg("o-oa", "Now stand at $A$. What is the bearing of $O$ from $A$?", S => oBoard(S, { northA: true }), {
    answer: 250,
    slips: [{ v: 70, say: "That's the bearing of $A$ from $O$. Stand at $A$ and look back." }, { v: 110, say: "That's $180^\\circ - 70^\\circ$. Turning round adds $180^\\circ$." }, { v: 290, say: "That's $360^\\circ - 70^\\circ$. Turning round is half a turn." }],
    walk: backWalk("O", "A", 70, S => oBoard(S, { northA: true }), ["O", "A"]),
  }),
]

// ── 6. Exam questions ──

/** Two places named by words (Foxby, Glanton), the second on a bearing from the first, as a question draws them. */
function wordsBoard(S: Scene, a: string, b: string, brg: number, o: { northB?: boolean } = {}) {
  resetBeat(S)
  places(S, { F: [0, 0], G: along([0, 0], brg, 6) })
  S.names = { F: `\\text{${a}}`, G: `\\text{${b}}` }
  S.norths = o.northB === false ? ["F"] : ["F", "G"]
  S.fitPts = ["F", "G"]
  S.fitPad = 1.7
  addSeg(S, "F", "G")
  S.arcs = [brgArc(S, "F", "G")]
}

/** 4024/21/M/J/22 Q9: B on 072° and C on 150° from A; AB = 300, AC = 280 (not to scale). */
function s22Board(S: Scene, o: { northC?: boolean } = {}) {
  resetBeat(S)
  const A: Vec = [0, 0]
  places(S, { A, B: along(A, 72, 7.5), C: along(A, 150, 7) })
  S.names = { A: "A", B: "B", C: "C" }
  S.norths = o.northC ? ["A", "C"] : ["A"]
  S.fitPts = ["A", "B", "C"]
  S.fitPad = 1.4
  addSeg(S, "A", "B", { lab: { tex: "300" } })
  addSeg(S, "A", "C", { lab: { tex: "280" } })
  addSeg(S, "B", "C")
  S.arcs = [{ id: "b72", at: "A", from: 0, sweep: 72, col: BLUE, tex: B3(72) }, { id: "c150", at: "A", from: 0, sweep: 150, col: BLUE, tex: B3(150), r: 1.6 }]
}

/** 4024/21/M/J/24 Q9: B on 107° and C on 192° from A; AB = 176, AC = 132 (not to scale). */
function s24Board(S: Scene, o: { northB?: boolean } = {}) {
  resetBeat(S)
  const A: Vec = [0, 0]
  places(S, { A, B: along(A, 107, 8.8), C: along(A, 192, 6.6) })
  S.names = { A: "A", B: "B", C: "C" }
  S.norths = o.northB ? ["A", "B"] : ["A"]
  S.fitPts = ["A", "B", "C"]
  S.fitPad = 1.4
  addSeg(S, "A", "B", { lab: { tex: "176" } })
  addSeg(S, "A", "C", { lab: { tex: "132" } })
  S.arcs = [{ id: "b107", at: "A", from: 0, sweep: 107, col: BLUE, tex: B3(107) }, { id: "c192", at: "A", from: 0, sweep: 192, col: BLUE, tex: B3(192), r: 1.6 }]
}

const PART_D: Beat[] = [
  // 4024/11/M/J/21 Q15(c)
  watch("x1", "Here is an exam question. The bearing of Glanton from Foxby is $128^\\circ$.", S => { wordsBoard(S, "Foxby", "Glanton", 128, { northB: false }); look(S) }, 2.6),
  askBrg("x1-ask", "Calculate the bearing of Foxby from Glanton.", S => wordsBoard(S, "Foxby", "Glanton", 128), {
    answer: 308,
    slips: [{ v: 52, say: "That's $180^\\circ - 128^\\circ$. Turning round adds $180^\\circ$." }, { v: 232, say: "That's $360^\\circ - 128^\\circ$. Turning round is half a turn." }, { v: 128, say: "That's the bearing of Glanton from Foxby. Stand at Glanton and look back." }],
    walk: backWalk("F", "G", 128, S => wordsBoard(S, "Foxby", "Glanton", 128), ["\\text{Foxby}", "\\text{Glanton}"]),
  }),

  // 4024/11/M/J/23 Q13(a)
  watch("x2", "The bearing of Mingfield from Lenton is $156^\\circ$.", S => { wordsBoard(S, "Lenton", "Mingfield", 156, { northB: false }); look(S) }, 2.4),
  askBrg("x2-ask", "Calculate the bearing of Lenton from Mingfield.", S => wordsBoard(S, "Lenton", "Mingfield", 156), {
    answer: 336,
    slips: [{ v: 24, say: "That's $180^\\circ - 156^\\circ$. Turning round adds $180^\\circ$." }, { v: 204, say: "That's $360^\\circ - 156^\\circ$. Turning round is half a turn." }, { v: 156, say: "That's the bearing of Mingfield from Lenton. Stand at Mingfield and look back." }],
    walk: backWalk("F", "G", 156, S => wordsBoard(S, "Lenton", "Mingfield", 156), ["\\text{Lenton}", "\\text{Mingfield}"]),
  }),

  // 4024/21/M/J/22 Q9(a)
  watch("x3", "Three towns: $B$ is on a bearing of $072^\\circ$ from $A$, and $C$ is on a bearing of $150^\\circ$ from $A$.", S => { s22Board(S); look(S) }, 3),
  askBrg("x3-ask", "Find the bearing of $A$ from $C$.", S => s22Board(S, { northC: true }), {
    answer: 330,
    slips: [{ v: 30, say: "That's $180^\\circ - 150^\\circ$. Turning round adds $180^\\circ$." }, { v: 210, say: "That's $360^\\circ - 150^\\circ$. Turning round is half a turn." }, { v: 150, say: "That's the bearing of $C$ from $A$. Stand at $C$ and look back." }, { v: 252, say: "That's from $B$. This one is from $C$." }],
    walk: backWalk("A", "C", 150, S => s22Board(S, { northC: true }), ["A", "C"]),
  }),

  // 4024/21/M/J/24 Q9(a)
  watch("x4", "Three ports: $B$ is on a bearing of $107^\\circ$ from $A$, and $C$ is on a bearing of $192^\\circ$ from $A$.", S => { s24Board(S); look(S) }, 3),
  askBrg("x4-ask", "Find the bearing of $A$ from $B$.", S => s24Board(S, { northB: true }), {
    answer: 287,
    slips: [{ v: 73, say: "That's $180^\\circ - 107^\\circ$. Turning round adds $180^\\circ$." }, { v: 253, say: "That's $360^\\circ - 107^\\circ$. Turning round is half a turn." }, { v: 107, say: "That's the bearing of $B$ from $A$. Stand at $B$ and look back." }],
    walk: backWalk("A", "B", 107, S => s24Board(S, { northB: true }), ["A", "B"]),
  }),

  // ── the end ──
  watch("end-brg", "In summary, a bearing is measured clockwise from North and written with three figures.", S => {
    dialBoard(S, { brg: 72, handle: false, three: true })
    look(S, ["readout"])
  }, 2.6),
  {
    id: "end-back",
    say: "The bearing back is $180^\\circ$ more, or $180^\\circ$ less.",
    enter: S => { twoBoard(S, { seg: true }); liveBoth(S); look(S, ["eq"]) },
    cta: "Finish", ctaAfter: 2.4, close: true,
  },
]

export const BEATS: Beat[] = [...PART_A, ...PART_B, ...PART_C, ...PART_D]

applyParts(BEATS, [
  ["ships", "Measuring from North"],
  ["make-45", "Three figures"],
  ["two", "The bearing from a place"],
  ["walk", "The bearing back"],
  ["o-70", "Bearings from angles"],
  ["x1", "Exam questions"],
])

