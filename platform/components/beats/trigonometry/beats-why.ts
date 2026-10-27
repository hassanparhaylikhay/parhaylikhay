/**
 * Why trigonometry works: an optional tour, nothing to type or work out.
 *
 * It opens on a question: your calculator says sin 35° is about 0.574, but
 * where does that number come from? The student makes a right-angled
 * triangle inside an angle and slides it; then a whole family of them
 * appears in the same angle, flies out, and the triangles land exactly on
 * top of each other: same angle, same shape. At 30° the hypotenuse is split
 * into ten numbered parts and the opposite swings down onto it like a door.
 * It covers 5 of the 10 parts, and still 5 however big the triangle is, so
 * sin 30° = 5/10 = 0.5. Turning the angle changes the count: each angle
 * covers its own fraction of the hypotenuse, and that fraction is its sine.
 *
 * Shrink the hypotenuse to 1 and the opposite IS sin θ. Turning it all the
 * way round draws the circle and, carried across, the sine wave; the
 * adjacent draws the cosine wave. At 35° a zoom onto the height reads off
 * 0.574, the calculator's answer. A tangent to the circle shows why tan is
 * called tangent (and why there is no tan 90°), and two points at the same
 * height show sin 150° = sin 30°.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { applyParts } from "../chapter"
import { type ENode, atom, op, row, frac } from "../equation"
import {
  type Scene, type CalcLine,
  RAD, ORANGE, GREEN, BLUE, say, later, clamp, thShown, thText, ratioOf, numText, graphFrame, circleFrame, armsFrame,
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

/** How many of the ten parts the opposite covers (to one place), and that as a fraction: from the angle as shown, so they agree. */
function partsOf(S: Scene): { parts: number; frac: number } {
  const parts = Math.round(ratioOf(S, "sin") * 100) / 10
  return { parts, frac: parts / 10 }
}

/** 5/10 = 0.5 (with "sin 30° =" in front once it has its name). */
function partsLine(S: Scene, named: boolean): ENode {
  const { parts, frac: f } = partsOf(S)
  const items: ENode[] = []
  if (named) items.push(atom("fn", "\\sin"), atom("ang", thText(S)), op("eq0", "="))
  items.push(frac("pf", atom("pn", numText(parts, 1), { col: ORANGE }), atom("pd", "10", { col: GREEN })), op("eq", "="), atom("pv", numText(f, 2), { col: ORANGE }))
  return row(items)
}

/**
 * Room for the arms only as high as the triangle needs: the angle stays
 * near 30° here, so the view sits closer and the ten parts are bigger. Held
 * still while a finger is down, so sizes still show as it slides.
 */
function partsFrame(S: Scene) {
  const top = Math.max(0.62 * R, S.tri.h * Math.sin(S.tri.th * RAD) + 0.16 * R, R * 0.86 * Math.sin(S.tri.th * RAD) + 0.08 * R)
  return { x0: -0.08 * R, x1: 1.04 * R, y0: -0.12 * R, y1: top }
}

/** The triangle at 30°, its hypotenuse split into ten numbered parts. */
function partsBoard(S: Scene, o: { door?: boolean; th?: number } = {}) {
  angleTri(S, { h: 7.5, th: o.th ?? 30 })
  S.frameFn = partsFrame
  names(S, ["O"])
  S.marks = S.time - 10
  S.parts = { count: null, live: false }
  if (o.door) S.door = S.time - 10
}

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
    say: "Start with an angle. Try opening and closing it.",
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
    say: "Now pull a line straight down to make a triangle.",
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
    say: "Try sliding it bigger and smaller.",
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
  watch("many", "What if we drew lots of them at once?", S => {
    angleTri(S, { th: clamp(S.tri.th, 28, 55) })
    S.family = { hs: FAMILY, since: S.time + 0.2, stack: null, at: STACK_AT, size: STACK_SIZE }
    look(S, ["arms", "arc", "labels"])
  }, 2.6),
  watch("stack", "Let's put them all on top of each other.", S => {
    angleTri(S, { th: clamp(S.tri.th, 28, 55) })
    S.family = { hs: FAMILY, since: S.time - 10, stack: S.time + 0.4, at: STACK_AT, size: STACK_SIZE }
    S.frameFn = familyFrame
    look(S, ["arms", "arc", "labels"])
  }, 3.6),
  watch("same-shape", "They fit exactly. They are all the same shape.", S => {
    angleTri(S, { th: clamp(S.tri.th, 28, 55) })
    S.family = { hs: FAMILY, since: S.time - 10, stack: S.time - 10, at: STACK_AT, size: STACK_SIZE }
    S.frameFn = familyFrame
    look(S, ["arms", "arc", "labels"])
  }, 2.2),
  {
    id: "turn-family",
    say: "Now turn the angle and watch them all change together.",
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
  {
    id: "set-30",
    say: "Let's turn the angle to $30^\\circ$.",
    enter: S => {
      // never open already done
      angleTri(S, { h: 7.5, th: Math.abs(S.tri.th - 30) < 5 ? 45 : clamp(S.tri.th, 15, 70) })
      S.frameFn = partsFrame
      S.mode = "turn"
      S.magnet = { th: 30, within: 2.5 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - 30) < 7 ? "Close. Make it exactly $30^\\circ$." : null)
      look(S, ALL)
    },
    done: S => S.locked,
    advanceAfter: 1200,
  },
  watch("split", "What if we split the hypotenuse into $10$ equal parts?", S => {
    partsBoard(S)
    S.marks = S.time + 0.2
    look(S, ALL)
  }, 2.6),
  watch("lay", "Now let's lay the opposite along it.", S => {
    partsBoard(S)
    S.door = S.time + 0.4
    look(S, ALL)
  }, 2.2),
  watch("count", "It covers exactly $5$ of the $10$ parts.", S => {
    partsBoard(S, { door: true })
    S.parts = { count: { n: 5, since: S.time + 0.3 }, live: false }
    look(S, ALL)
  }, 3),
  {
    id: "bigger",
    say: "Try making the triangle bigger or smaller.",
    enter: S => {
      partsBoard(S, { door: true })
      S.parts = { count: null, live: true }
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 2.5,
    free: true,
    minPlay: 4,
  },
  watch("still-five", "However big it is, it still covers $5$ parts.", S => {
    partsBoard(S, { door: true, th: 30 })
    S.tri.h = clamp(S.tri.h, 3, 8.4)
    S.parts = { count: null, live: true }
    look(S, ALL)
  }),
  watch("half", "So the opposite is always $\\frac{5}{10}$ of the hypotenuse.", S => {
    partsBoard(S, { door: true })
    S.parts = { count: null, live: true }
    S.eqFn = S2 => partsLine(S2, false)
    look(S, [...ALL, "eq"])
  }, 2.2),
  watch("means", "That is what $\\sin 30^\\circ = 0.5$ means.", S => {
    partsBoard(S, { door: true })
    S.parts = { count: null, live: true }
    S.eqFn = S2 => partsLine(S2, true)
    look(S, [...ALL, "eq"])
  }, 2.4),
  {
    id: "turn-other",
    say: "Now turn the angle. Watch how many parts it covers.",
    enter: S => {
      partsBoard(S, { door: true })
      S.parts = { count: null, live: true }
      S.eqFn = S2 => partsLine(S2, false)
      S.mode = "turn"
      look(S, [...ALL, "eq"])
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 4,
  },
  watch("own-count", "Each angle covers its own number of parts.", S => {
    partsBoard(S, { door: true, th: S.tri.th })
    S.parts = { count: null, live: true }
    S.eqFn = S2 => partsLine(S2, false)
    look(S, [...ALL, "eq"])
  }),
  watch("is-sine", "That fraction of the hypotenuse is the angle's *sine*.", S => {
    partsBoard(S, { door: true, th: S.tri.th })
    S.parts = { count: null, live: true }
    S.eqFn = S2 => partsLine(S2, true)
    look(S, [...ALL, "eq"])
  }, 2.4),

  // ── 4. Inside your calculator ──
  {
    id: "to-one",
    say: "Now slide the hypotenuse down to exactly $1$.",
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
  watch("opp-sin", "With a hypotenuse of $1$, the opposite's length is $\\sin\\theta$.", S => {
    circleBoard(S, { th: clamp(S.tri.th, 25, 60) })
    S.pulseLabs = new Set(["O"])
    look(S, [...CIRCLE])
  }, 2.6),
  {
    id: "round-sin",
    say: "Now turn it all the way round and watch what it draws.",
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
  watch("wave", "This wave shows the sine of every angle.", S => {
    const g = S.graph && seenCount(S.graph.seen) >= 330 ? S.graph : fullGraph("sin")
    circleBoard(S, { th: S.tri.th, graph: { ...g, fn: "sin" } })
    look(S, [...CIRCLE, "graph"])
  }, 2.4),
  {
    id: "round-cos",
    say: "The adjacent is $\\cos\\theta$. Turn it round once more.",
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
    say: "Now turn it to $35^\\circ$.",
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
      }
      look(S, [...CIRCLE, "graph", "eq"])
    },
    done: S => S.got.has("found"),
    advanceAfter: 2000,
  },
  watch("zoom", "Let's zoom in on its height.", S => {
    const g = S.graph ?? fullGraph("sin", true, true)
    circleBoard(S, { th: 35, graph: { ...g, fn: "sin" } })
    S.calcScreen = [sinLine(35)]
    S.zoom = S.time + 0.3
    look(S, [...CIRCLE, "eq"])
  }, 2.8),
  watch("answer", "The height is $0.574$, just what the calculator said.", S => {
    const g = S.graph ?? fullGraph("sin", true, true)
    circleBoard(S, { th: 35, graph: { ...g, fn: "sin" } })
    S.calcScreen = [sinLine(35)]
    S.zoom = S.time - 10
    look(S, [...CIRCLE, "eq"])
  }, 2.6),

  // ── 5. Why it is called tangent ──
  watch("tangent", "This line just touches the circle. It is a tangent.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time + 0.2, stretch: null }
    look(S, [...CIRCLE])
  }, 2.6),
  watch("stretch", "Let's stretch this radius until it meets the tangent.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time + 0.4, tex: "O" }
    look(S, [...CIRCLE])
  }, 2.4),
  watch("tan-one", "The bottom of this bigger triangle is a radius, so it is $1$.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time - 10, tex: "O" }
    S.pulseLabs = new Set(["tan-1"])
    S.eqFn = () => tanLine("A")
    later(S, 1.3, S2 => { S2.eqFn = () => tanLine("1") })
    look(S, [...CIRCLE, "eq"])
  }, 2.8),
  watch("tan-name", "So $\\tan\\theta$ is the length up the tangent.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time - 10, tex: "O" }
    S.eqFn = () => tanLine("1")
    // dividing by 1 leaves O, and the side takes its new name
    later(S, 0.9, S2 => { S2.eqFn = () => tanLine("O"); S2.pulseLabs = new Set(["tan-side"]) })
    later(S, 1.9, S2 => { S2.tanLine = { ...S2.tanLine!, tex: "\\tan\\theta" } })
    look(S, [...CIRCLE, "eq"])
  }, 3.2),
  watch("tan-called", "That's where tan gets its name.", S => {
    tanBoard(S, 35)
    S.tanLine = { since: S.time - 10, stretch: S.time - 10 }
    S.pulseLabs = new Set(["tan-side"])
    S.eqFn = () => tanLine("O")
    look(S, [...CIRCLE, "eq"])
  }, 2.2),
  {
    id: "tan-90",
    say: "Now turn it towards $90^\\circ$ and watch $\\tan\\theta$.",
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
        say(S2, "This radius never meets the tangent, so there is no $\\tan 90^\\circ$.", "calm", 600)
      }
      look(S, [...CIRCLE, "eq"])
    },
    done: S => S.got.has("ninety"),
    free: true,
    minPlay: 2,
  },

  // ── 6. Round the whole circle ──
  watch("mirror", "Look at $30^\\circ$ and $150^\\circ$. Their points are at the same height.", S => {
    circleBoard(S, { th: 30 })
    S.mirror = [30, 150]
    look(S, [])
  }, 2.6),
  watch("sin150", "So $\\sin 150^\\circ = \\sin 30^\\circ$. This comes in handy for the sine rule.", S => {
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

/**
 * tan θ for the bigger triangle: O over A, then the A read off as 1, then
 * the 1 gone, leaving tan θ = O.
 */
function tanLine(step: "A" | "1" | "O"): ENode {
  const top = atom("o", "O", { col: ORANGE })
  const rhs = step === "O" ? top : frac("f", top, step === "A" ? atom("a", "A", { col: BLUE }) : atom("one", "1", { col: BLUE }))
  return row([atom("fn", "\\tan\\theta"), op("eq", "="), rhs])
}

// ── the parts of the tour: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["q-calc", "How does your calculator know?"],
  ["open", "Triangles in an angle"],
  ["set-30", "What sine means"],
  ["to-one", "Inside your calculator"],
  ["tangent", "Why it is called tangent"],
  ["mirror", "Round the whole circle"],
]
applyParts(BEATS, PARTS)
