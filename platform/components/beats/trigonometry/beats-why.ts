/**
 * Why trigonometry works: an optional tour, nothing to type or work out.
 *
 * It opens on a question: your calculator says sin 35° is about 0.574, but
 * where does that number come from? The student makes a right-angled
 * triangle inside an angle and slides it; then a whole family of them
 * appears in the same angle, flies out, and the triangles land exactly on
 * top of each other: same angle, same shape. Ten marks along the
 * hypotenuse, and the opposite swung down onto it like a door, show that
 * the opposite always stops in the same place for the same angle, whatever
 * the size. That place is the angle's sine.
 *
 * Shrink the hypotenuse to 1 and the opposite IS sin θ. Turning it all the
 * way round draws the circle and, carried across, the sine wave; the
 * adjacent draws the cosine wave. At 35° the calculator's answer is the
 * height of the point. A tangent to the circle shows why tan is called
 * tangent (and why there is no tan 90°), and two points at the same height
 * show sin 150° = sin 30°.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { applyParts } from "../chapter"
import {
  type Scene, type CalcLine,
  RAD, say, clamp, thShown, thText, graphFrame, circleFrame, armsFrame,
} from "./scene"
import { type Beat, watch, look, base, madeTri, triBoard, names, lengths, angleOnly, angleTri, ALL } from "./common"

// ── the boards ───────────────────────────────────────────────────────────

const R = 10

/** A calculator's answer the way its screen shows it: seven figures. */
function shown(x: number): string {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x))
  return String(Number(x.toPrecision(7)))
}
const sinLine = (deg: number): CalcLine => ({ q: `\\sin ${deg}`, a: shown(Math.sin(deg * RAD)) })

/** The waves, with every degree already drawn (a beat opened cold). */
function fullGraph(fn: "sin" | "cos", sin = true, cos = false): NonNullable<Scene["graph"]> {
  return { fn, seen: Array(361).fill(sin), seenCos: Array(361).fill(cos), last: null }
}
const seenCount = (a: boolean[]) => a.filter(Boolean).length

/**
 * The hypotenuse at 1, so it is a radius of a circle, and the angle can go
 * all the way round. With `graph`, the waves sit beside (or under) it.
 */
function circleBoard(S: Scene, o: { graph?: Scene["graph"]; th?: number; frame?: Scene["frame"] } = {}) {
  base(S)
  triBoard(S)
  S.fullTurn = true
  S.armR = 1
  S.thMin = 0
  S.thMax = 360
  madeTri(S, { h: 1, th: o.th })
  S.graph = o.graph ?? null
  const fr = o.frame
  S.frameFn = o.graph ? graphFrame : fr ? () => fr : circleFrame
  S.angText = thText
  S.roleLabels = { H: () => ({ tex: "1" }), O: () => ({ tex: "\\sin\\theta" }) }
  S.roleColours = new Set(["O", "A", "H"])
}

const CIRCLE = ["tri", "fill", "rt", "arc", "labels"] as const

/** The family of triangles in one angle (and room for them to fly out and stack). */
const FAMILY = [2.5, 4, 5.5, 7, 8.4]
const STACK_AT: [number, number] = [11.6, 0]
const STACK_SIZE = 5.2
function familyFrame(S: Scene) {
  const th = S.tri.th * RAD
  return { x0: -1, x1: STACK_AT[0] + STACK_SIZE * Math.cos(th) + 1, y0: -1, y1: Math.max(4, R * 0.86 * Math.sin(th) + 1.2) }
}

// ── the tour ─────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. The question ──
  watch("q-calc", "Your calculator says $\\sin 35^\\circ$ is about $0.574$.", S => {
    base(S)
    S.calcScreen = [sinLine(35)]
    look(S, [])
    S.vis.board.t = 0
  }, 2.2),
  watch("q-where", "Where does that number come from?", S => {
    base(S)
    S.calcScreen = [sinLine(35)]
    look(S, [])
    S.vis.board.t = 0
  }),

  // ── 2. Triangles in an angle ──
  {
    id: "open",
    say: "Open the angle.",
    enter: S => {
      angleOnly(S, clamp(S.tri.th, 25, 55))
      S.growArms = S.time
      S.mode = "turn"
      look(S, ["arms", "arc", "labels"])
    },
    done: S => S.turned > 25,
    free: true,
    minPlay: 4,
  },
  {
    id: "drop",
    say: "Pull a line straight down to make a triangle.",
    enter: S => {
      angleOnly(S, clamp(S.tri.th, 28, 55))
      S.mode = "drop"
      look(S, ["arms", "tri", "arc", "labels"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1400,
  },
  {
    id: "slide",
    say: "Slide it bigger and smaller.",
    enter: S => {
      angleTri(S, { th: clamp(S.tri.th, 28, 55) })
      S.outline = S.tri.h
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 2.5,
    free: true,
    minPlay: 4,
  },
  watch("many", "Here are lots of them at once.", S => {
    angleTri(S, { th: clamp(S.tri.th, 28, 55) })
    S.family = { hs: FAMILY, since: S.time + 0.2, stack: null, at: STACK_AT, size: STACK_SIZE }
    look(S, ["arms", "arc", "labels"])
  }, 2.6),
  watch("same-shape", "They are all the same shape.", S => {
    angleTri(S, { th: clamp(S.tri.th, 28, 55) })
    S.family = { hs: FAMILY, since: S.time - 10, stack: S.time + 0.4, at: STACK_AT, size: STACK_SIZE }
    S.frameFn = familyFrame
    look(S, ["arms", "arc", "labels"])
  }, 3.6),
  {
    id: "turn-family",
    say: "Turn the angle. They all change together.",
    enter: S => {
      angleTri(S, { th: clamp(S.tri.th, 28, 55) })
      S.family = { hs: FAMILY, since: S.time - 10, stack: null, at: STACK_AT, size: STACK_SIZE }
      S.frameFn = armsFrame
      S.mode = "turn"
      look(S, ["arms", "arc", "labels"])
    },
    done: S => S.turned > 25,
    free: true,
    minPlay: 4,
  },

  // ── 3. What sine means ──
  watch("marks", "The hypotenuse gets ten marks.", S => {
    angleTri(S, { h: 7.5, th: clamp(S.tri.th, 25, 60) })
    names(S, ["O", "H"])
    S.marks = S.time + 0.2
    look(S, ALL)
  }, 2.4),
  watch("lay", "Lay the opposite along it.", S => {
    angleTri(S, { h: 7.5, th: clamp(S.tri.th, 25, 60) })
    names(S, ["O", "H"])
    S.marks = S.time - 10
    S.door = S.time + 0.4
    look(S, ALL)
  }, 2.2),
  {
    id: "same-place",
    say: "Slide it. It always stops in the same place.",
    enter: S => {
      angleTri(S, { th: clamp(S.tri.th, 25, 60) })
      names(S, ["O", "H"])
      S.marks = S.time - 10
      S.door = S.time - 10
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 2.5,
    free: true,
    minPlay: 4,
  },
  {
    id: "else",
    say: "Turn the angle. Now it stops somewhere else.",
    enter: S => {
      angleTri(S, { th: clamp(S.tri.th, 25, 60) })
      names(S, ["O", "H"])
      S.marks = S.time - 10
      S.door = S.time - 10
      S.mode = "turn"
      look(S, ALL)
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 4,
  },
  watch("is-sine", "Every angle has its own place. That is its *sine*.", S => {
    angleTri(S, { th: clamp(S.tri.th, 25, 60) })
    names(S, ["O", "H"])
    S.marks = S.time - 10
    S.door = S.time - 10
    S.pulseArc = true
    look(S, ALL)
  }, 2.4),

  // ── 4. Inside your calculator ──
  {
    id: "to-one",
    say: "Shrink the hypotenuse to $1$.",
    enter: S => {
      angleTri(S, { h: 7.5, th: clamp(S.tri.th, 25, 60) })
      S.hMin = 0.6
      lengths(S, ["H"])
      S.mode = "slide"
      S.magnet = { h: 1, within: 0.28 }
      S.releaseNote = S2 => (S2.tri.h < 2.2 ? "Close. Make it exactly $1$." : null)
      look(S, ALL)
    },
    done: S => S.locked,
    advanceAfter: 1500,
  },
  watch("opp-sin", "Now the opposite is $\\sin\\theta$ itself.", S => {
    circleBoard(S, { th: clamp(S.tri.th, 25, 60) })
    S.pulseLabs = new Set(["O"])
    look(S, [...CIRCLE])
  }, 2.4),
  {
    id: "round-sin",
    say: "Turn it all the way round.",
    enter: S => {
      // from 0°, so turning once round draws the whole wave
      circleBoard(S, { th: 0, graph: fullGraph("sin", false) })
      S.mode = "turn"
      look(S, [...CIRCLE, "graph"])
    },
    done: S => !!S.graph && seenCount(S.graph.seen) >= 330,
    free: true,
    minPlay: 3,
  },
  watch("wave", "This wave holds the sine of every angle.", S => {
    const g = S.graph && seenCount(S.graph.seen) >= 330 ? S.graph : fullGraph("sin")
    circleBoard(S, { th: S.tri.th, graph: { ...g, fn: "sin" } })
    look(S, [...CIRCLE, "graph"])
  }, 2.4),
  {
    id: "round-cos",
    say: "The adjacent is $\\cos\\theta$. Turn it round again.",
    enter: S => {
      const g = S.graph ?? fullGraph("sin")
      circleBoard(S, { th: 0, graph: { ...g, fn: "cos", seenCos: Array(361).fill(false), last: null } })
      S.roleLabels = { H: () => ({ tex: "1" }), A: () => ({ tex: "\\cos\\theta" }) }
      S.mode = "turn"
      look(S, [...CIRCLE, "graph"])
    },
    done: S => !!S.graph && seenCount(S.graph.seenCos) >= 330,
    free: true,
    minPlay: 3,
  },
  {
    id: "to-35",
    say: "Turn to $35^\\circ$.",
    enter: S => {
      const g = S.graph ?? fullGraph("sin", true, true)
      circleBoard(S, { th: Math.abs(S.tri.th - 35) < 15 ? 140 : S.tri.th, graph: { ...g, fn: "sin" } })
      S.mode = "turn"
      S.magnet = { th: 35, within: 2.5 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - 35) < 8 ? "Close. Make it exactly $35^\\circ$." : null)
      S.tick = S2 => {
        if (!S2.locked || S2.got.has("found")) return
        S2.got.add("found")
        S2.calcScreen = [sinLine(35)]
        S2.roleLabels.O = () => ({ tex: "0.574" })
        S2.pulseLabs = new Set(["O"])
      }
      look(S, [...CIRCLE, "graph", "eq"])
    },
    done: S => S.got.has("found"),
    advanceAfter: 2600,
  },
  watch("answer", "Your calculator gives you this height.", S => {
    const g = S.graph ?? fullGraph("sin", true, true)
    circleBoard(S, { th: 35, graph: { ...g, fn: "sin" } })
    S.calcScreen = [sinLine(35)]
    S.roleLabels.O = () => ({ tex: "0.574" })
    S.pulseLabs = new Set(["O"])
    look(S, [...CIRCLE, "graph", "eq"])
  }, 2.6),

  // ── 5. Why it is called tangent ──
  watch("tangent", "This line touches the circle at one point. It is a tangent.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time + 0.2, stretch: null }
    look(S, [...CIRCLE])
  }, 2.6),
  watch("stretch", "Stretch the radius until it meets the tangent.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time + 0.4 }
    look(S, [...CIRCLE])
  }, 2.4),
  watch("tan-name", "The length up the tangent is $\\tan\\theta$. That is where the name comes from.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time - 10 }
    look(S, [...CIRCLE])
  }, 2.6),
  {
    id: "tan-90",
    say: "Turn towards $90^\\circ$. Watch $\\tan\\theta$.",
    enter: S => {
      tanBoard(S, 35)
      S.tanLine = { since: S.time - 10, stretch: S.time - 10 }
      S.thMin = 5
      S.thMax = 90
      S.mode = "turn"
      S.magnet = { th: 90, within: 1.2 }
      S.calcScreen = S2 => {
        const a = thShown(S2)
        return [{ q: `\\tan ${a}`, a: a >= 90 ? "\\text{Math ERROR}" : shown(Math.tan(a * RAD)) }]
      }
      S.tick = S2 => {
        if (thShown(S2) < 90) return
        // said on reaching 90°, and again once it has clicked in (letting go clears notes)
        const first = !S2.got.has("ninety"), again = S2.locked && !S2.got.has("held")
        if (!first && !again) return
        S2.got.add("ninety")
        if (S2.locked) S2.got.add("held")
        say(S2, "The radius never meets the tangent, so there is no $\\tan 90^\\circ$.", "calm", 600)
      }
      look(S, [...CIRCLE, "eq"])
    },
    done: S => S.got.has("ninety"),
    free: true,
    minPlay: 2,
  },

  // ── 6. Round the whole circle ──
  watch("mirror", "$30^\\circ$ and $150^\\circ$ are at the same height.", S => {
    circleBoard(S, { th: 30 })
    S.mirror = [30, 150]
    look(S, [])
  }, 2.6),
  watch("sin150", "So $\\sin 150^\\circ = \\sin 30^\\circ$. You will use this in the sine rule.", S => {
    circleBoard(S, { th: 30 })
    S.mirror = [30, 150]
    S.calcScreen = [sinLine(150), sinLine(30)]
    look(S, ["eq"])
  }, 2.6),
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      circleBoard(S, { th: 50, graph: fullGraph("sin", true, true) })
      S.roleLabels = { H: () => ({ tex: "1" }), O: () => ({ tex: "\\sin\\theta" }), A: () => ({ tex: "\\cos\\theta" }) }
      S.mode = "turn"
      look(S, [...CIRCLE, "graph"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

/** The unit circle with room up and to the right for the tangent and how far up it goes. */
function tanBoard(S: Scene, th: number) {
  circleBoard(S, { th, frame: { x0: -1.3, x1: 2.0, y0: -1.3, y1: 1.7 } })
  S.thMin = 5
  S.thMax = 85
  S.tri.th = clamp(S.tri.th, 5, 85)
  S.roleLabels = { H: () => ({ tex: "1" }) }
}

// ── the parts of the tour: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["q-calc", "How does your calculator know?"],
  ["open", "Triangles in an angle"],
  ["marks", "What sine means"],
  ["to-one", "Inside your calculator"],
  ["tangent", "Why it is called tangent"],
  ["mirror", "Round the whole circle"],
]
applyParts(BEATS, PARTS)
