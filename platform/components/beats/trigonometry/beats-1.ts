/**
 * Trigonometry I: sin, cos and tan, one tiny idea per beat.
 *
 * The student opens an angle and pulls a line straight down from its top
 * arm: a right-angled triangle. The sides get their names from where the
 * angle θ is (opposite, adjacent, hypotenuse), and swap when θ moves to the
 * other corner. With θ kept at 30°, sliding the triangle bigger and smaller
 * never changes opposite ÷ hypotenuse: the opposite, laid twice along the
 * hypotenuse, always covers it exactly. Only turning θ changes the number,
 * so it belongs to the angle: its sine. Then cosine and tangent, SOH CAH
 * TOA, the calculator, and where the calculator's numbers come from: with
 * the hypotenuse at 1, turning θ draws the sine and cosine curves.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { applyParts } from "../chapter"
import { type ENode, atom, op, row, frac } from "../equation"
import { isCalculation, sigText } from "../calc"
import type { WalkStep } from "../walk"
import {
  type Scene, type Role, type SideId, type Pose, type Fn,
  GREEN, ORANGE,
  say, later, startInput, boxNode, clamp, sideOf, roleOf, thShown, thText, graphFrame,
} from "./scene"
import {
  type Beat, watch, look, base, madeTri, armsBoard, triBoard, names, lengths, UPRIGHT, inputRight,
  lettersFrac, valuesFrac, valueAtom, namedRule, liveValue, cardsTap, choose, picked, c,
} from "./common"

// ── the student's angle and triangle ─────────────────────────────────────

/** Just the angle: two arms from a corner, nothing dropped yet. */
function angleOnly(S: Scene, th = 35) {
  base(S)
  armsBoard(S)
  const t = S.tri
  t.drop = 0
  t.at = "V"
  t.pose = { ...UPRIGHT, at: [0, 0] }
  t.th = th
  t.h = 6.5
  S.angText = thText
}

/**
 * The student's triangle inside its angle, the arms showing. `framed`: no
 * arms, and the view fits the triangle itself (beats where nothing slides,
 * so it stays big beside the cards or the keypad).
 */
function angleTri(S: Scene, o: { th?: number; h?: number; framed?: boolean } = {}) {
  base(S)
  armsBoard(S)
  madeTri(S, { th: o.th, h: o.h ?? clamp(S.tri.h, 4.5, 8.8) })
  if (o.framed) triBoard(S)
  S.angText = thText
}

const ALL: ("arms" | "tri" | "fill" | "rt" | "arc" | "labels")[] = ["arms", "tri", "fill", "rt", "arc", "labels"]
/** The triangle without its arms. */
const TRI: ("tri" | "fill" | "rt" | "arc" | "labels")[] = ["tri", "fill", "rt", "arc", "labels"]

/** One side named, by its role, in its colour. */
function nameRole(S: Scene, r: Role) {
  S.roleLabels[r] = () => ({ tex: r })
  S.roleColours.add(r)
}

/** Tap a side: the right one lights and is named. */
function tapFor(S: Scene, want: Role, wrong: (got: Role) => string, after?: (S: Scene) => void) {
  S.mode = "tapSide"
  S.onSide = (S2, side) => {
    if (S2.got.has("tap")) return
    const r = roleOf(S2.tri.at, side)
    if (r === want) {
      S2.got.add("tap")
      nameRole(S2, want)
      S2.touched = { kind: "side", id: side }
      S2.flashGood = 1.2
      S2.note = null
      after?.(S2)
      return
    }
    say(S2, wrong(r), "wrong", 3.4)
    S2.light = want === "H" ? { from: "F", side: "VP", since: S2.time } : { from: S2.tri.at, side: sideOf(S2.tri.at, "O"), since: S2.time }
  }
}

// ── turned and flipped: tap the side ─────────────────────────────────────

const PRACTICE: { pose: Pose; at: "V" | "P"; want: Role }[] = [
  { pose: { phi: 180, s: 1, at: [0, 0] }, at: "V", want: "O" },
  { pose: { phi: 180, s: -1, at: [0, 0] }, at: "P", want: "A" },
  { pose: { phi: 90, s: -1, at: [0, 0] }, at: "V", want: "H" },
  { pose: { phi: -35, s: 1, at: [0, 0] }, at: "P", want: "O" },
]

const WORD: Record<Role, string> = { O: "opposite", A: "adjacent", H: "hypotenuse" }

function wrongTap(want: Role, got: Role): string {
  if (want === "H") return "The hypotenuse is across from the right angle."
  if (want === "O") return got === "H" ? "That's the hypotenuse. The opposite is across from $\\theta$." : "That side touches $\\theta$. The opposite is across from it."
  return got === "H" ? "That's the hypotenuse. Find the other side next to $\\theta$." : "That one is across from $\\theta$. The adjacent is next to it."
}

function tapRole(id: string, k: number): Beat {
  const P = PRACTICE[k]
  return {
    id,
    say: `Tap the ${WORD[P.want]}.`,
    enter: S => {
      base(S)
      triBoard(S)
      madeTri(S, { th: clamp(S.tri.th, 32, 58), h: 7 })
      S.tri.pose = { ...P.pose, at: [0, 0] }
      S.tri.at = P.at
      S.angText = () => "\\theta"
      tapFor(S, P.want, got => wrongTap(P.want, got))
      look(S, ["tri", "fill", "rt", "arc", "labels"])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

// ── the halves and the ratio ─────────────────────────────────────────────

/** θ kept at 30°: the opposite and the hypotenuse with their lengths. */
function at30(S: Scene, o: { halves?: boolean } = {}) {
  angleTri(S, { th: 30 })
  lengths(S, ["O", "H"])
  if (o.halves) S.halves = S.time - 10
}

/** O/H = 3.65/7.3 = 0.5, live. */
const ratioLine = (fly: boolean) => (S: Scene): ENode =>
  row([lettersFrac("sin"), op("eq", "="), valuesFrac(S, "sin", fly), op("eq2", "="), valueAtom(S, "sin")])

// ── the calculator ───────────────────────────────────────────────────────

/** Type a calculation on the calculator; the box shows it, then its value. */
function askValue(S: Scene, answer: number, onRight?: (S: Scene) => void, after?: (S: Scene) => ENode[]) {
  startInput(S, { answer, sf: 3, onRight })
  S.eqFn = S2 => {
    const inp = S2.input
    const items: ENode[] = [boxNode(S2)]
    if (inp?.state === "right" && isCalculation(inp.value)) items.push(op("eq", "="), atom("res", Math.abs(answer - Math.round(answer)) < 1e-9 ? String(Math.round(answer)) : sigText(answer, 3), { col: GREEN }))
    if (inp?.state === "right" && after) items.push(...after(S2))
    return row(items)
  }
}

function typeWalk(fn: Fn, deg: number, shows: string): WalkStep<Scene>[] {
  return [
    { say: `Press $\\${fn}$, then $${String(deg).split("").join("$, $")}$.`, tex: `\\${fn}\\ ${deg}` },
    { say: `Then press $=$. It shows $${shows}$.`, tex: `\\${fn}\\ ${deg} = ${c(GREEN, shows)}` },
  ]
}

// ── the unit circle and its graph ────────────────────────────────────────

function newGraph(fn: "sin" | "cos", full = false): NonNullable<Scene["graph"]> {
  return { fn, seen: Array(91).fill(full), seenCos: Array(91).fill(false), last: null }
}

const seenCount = (a: boolean[]) => a.filter(Boolean).length

/** The hypotenuse at 1, zoomed in so 1 is big; the graph to its right when asked. */
function unitBoard(S: Scene, graph: Scene["graph"] | null) {
  base(S)
  triBoard(S)
  S.armR = 1
  S.thMin = graph ? 0 : 10
  S.thMax = graph ? 90 : 80
  madeTri(S, { h: 1 })
  S.graph = graph
  S.frameFn = graph ? graphFrame : () => ({ x0: -0.25, x1: 1.25, y0: -0.28, y1: 1.12 })
  S.angText = thText
}

// ── make it ──────────────────────────────────────────────────────────────

function makeAngle(id: string, text: string, target: number, startTh: number, eq: (S: Scene) => ENode, labels: Role[], close: string): Beat {
  return {
    id,
    say: text,
    enter: S => {
      angleTri(S, { th: startTh })
      lengths(S, labels)
      S.eqFn = eq
      S.mode = "turn"
      S.magnet = { th: target, within: 2 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - target) < 6 ? close : null)
      look(S, [...ALL, "eq"])
    },
    done: S => S.locked,
    advanceAfter: 2000,
  }
}

// ── the lesson ───────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. The sides of a right-angled triangle ──
  watch("angle", "This is an angle.", S => {
    angleOnly(S)
    S.growArms = S.time
    look(S, ["arms", "arc", "labels"])
  }, 1.6),
  {
    id: "open",
    say: "Open and close it.",
    enter: S => {
      angleOnly(S, clamp(S.tri.th, 20, 60))
      S.mode = "turn"
      look(S, ["arms", "arc", "labels"])
    },
    done: S => S.turned > 25,
    free: true,
    minPlay: 4,
  },
  {
    id: "drop",
    say: "Pull a line straight down from this point.",
    enter: S => {
      angleOnly(S, clamp(S.tri.th, 28, 55))
      S.mode = "drop"
      look(S, ["arms", "tri", "arc", "labels"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1400,
  },
  watch("made", "You made a right-angled triangle.", S => {
    angleTri(S)
    S.pulseRt = true
    look(S, ALL)
  }),
  {
    id: "slide",
    say: "Slide the point along the arm.",
    enter: S => {
      angleTri(S)
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 2.5,
    free: true,
    minPlay: 4,
  },
  {
    id: "tap-H",
    say: "The longest side is the hypotenuse. Tap it.",
    enter: S => {
      angleTri(S)
      tapFor(S, "H", () => "That one is shorter. The hypotenuse is the longest side.")
      look(S, ALL)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("across-rt", "The hypotenuse is always across from the right angle.", S => {
    angleTri(S)
    nameRole(S, "H")
    S.light = { from: "F", side: "VP", since: S.time }
    S.pulseRt = true
    look(S, ALL)
  }, 2.6),
  watch("theta", "We call this angle $\\theta$.", S => {
    angleTri(S)
    nameRole(S, "H")
    S.angText = () => "\\theta"
    S.pulseArc = true
    say(S, "$\\theta$ is a Greek letter, said \"theta\".", "calm", 600)
    look(S, ALL)
  }),
  {
    id: "tap-O",
    say: "The side across from $\\theta$ is the *opposite*. Tap it.",
    enter: S => {
      angleTri(S)
      nameRole(S, "H")
      S.angText = () => "\\theta"
      S.light = { from: "V", side: "FP", since: S.time }
      tapFor(S, "O", got => (got === "H" ? "That's the hypotenuse. Go across from $\\theta$." : "That side touches $\\theta$. Go across."), S2 => { S2.light = null })
      look(S, ALL)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  {
    id: "tap-A",
    say: "The side next to $\\theta$ is the *adjacent*. Tap it.",
    enter: S => {
      angleTri(S)
      nameRole(S, "H")
      nameRole(S, "O")
      S.angText = () => "\\theta"
      say(S, "Adjacent means next to.", "calm", 600)
      tapFor(S, "A", got => (got === "H" ? "That's the hypotenuse. Find the other side next to $\\theta$." : "That's the opposite. Find the side next to $\\theta$."))
      look(S, ALL)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("names", "Now every side has a name.", S => {
    angleTri(S)
    names(S)
    S.angText = () => "\\theta"
    for (const [t, r] of [[0.3, "O"], [1.0, "A"], [1.7, "H"]] as [number, Role][]) later(S, t, S2 => { S2.pulseLabs = new Set([r]) })
    later(S, 2.5, S2 => { S2.pulseLabs = new Set() })
    look(S, ALL)
  }, 2.4),
  {
    id: "names-play",
    say: "Turn $\\theta$ and slide the triangle.",
    enter: S => {
      angleTri(S)
      names(S)
      S.angText = () => "\\theta"
      S.mode = "turnSlide"
      look(S, ALL)
    },
    done: S => S.turned > 12 && S.slid > 1.2,
    free: true,
    minPlay: 5,
  },
  watch("hop", "Now look from the other angle.", S => {
    angleTri(S, { th: clamp(S.tri.th, 30, 55) })
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    look(S, ["tri", "fill", "rt", "arc", "labels"])
  }, 2.4),
  watch("swapped", "The opposite and the adjacent swap places.", S => {
    angleTri(S, { th: clamp(S.tri.th, 30, 55) })
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    S.pulseLabs = new Set(["O", "A"])
    look(S, ["tri", "fill", "rt", "arc", "labels"])
  }),
  watch("stays", "The hypotenuse stays where it is.", S => {
    angleTri(S, { th: clamp(S.tri.th, 30, 55) })
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    S.pulseLabs = new Set(["H"])
    S.glow = new Set<SideId>(["VP"])
    look(S, ["tri", "fill", "rt", "arc", "labels"])
  }),
  tapRole("tap-1", 0),
  tapRole("tap-2", 1),
  tapRole("tap-3", 2),
  tapRole("tap-4", 3),

  // ── 2. Bigger and smaller ──
  watch("keep-30", "Let's keep $\\theta$ at $30^\\circ$.", S => {
    angleTri(S, { th: 30 })
    names(S)
    look(S, ALL)
  }, 2.2),
  watch("lengths", "These are the opposite and the hypotenuse.", S => {
    at30(S)
    look(S, ALL)
  }),
  {
    id: "watch-lengths",
    say: "Slide the triangle. Watch both lengths.",
    enter: S => {
      at30(S)
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 3,
    free: true,
    minPlay: 5,
  },
  {
    id: "which-part",
    say: "The opposite is always part of the hypotenuse. Which part?",
    enter: S => {
      at30(S)
      choose(S, ["a quarter", "a third", "a half"], 2)
      look(S, [...ALL, "chips"])
    },
    done: picked,
    advanceAfter: 1500,
  },
  watch("check-half", "Let's check.", S => {
    at30(S)
    S.halves = S.time + 0.2
    look(S, ALL)
  }, 3.2),
  {
    id: "half-play",
    say: "Slide it. It is always exactly half.",
    enter: S => {
      at30(S, { halves: true })
      S.mode = "slide"
      look(S, ALL)
    },
    done: S => S.slid > 2.5,
    free: true,
    minPlay: 4,
  },
  watch("ratio", "So the opposite divided by the hypotenuse is always $0.5$.", S => {
    at30(S, { halves: true })
    S.eqFn = ratioLine(true)
    look(S, [...ALL, "eq"])
  }, 2.6),
  {
    id: "ratio-play",
    say: "Slide it again. The answer stays $0.5$.",
    enter: S => {
      at30(S, { halves: true })
      S.eqFn = ratioLine(false)
      S.mode = "slide"
      look(S, [...ALL, "eq"])
    },
    done: S => S.slid > 2,
    free: true,
    minPlay: 4,
  },
  {
    id: "turn-watch",
    say: "Now turn $\\theta$. Watch the answer.",
    enter: S => {
      angleTri(S)
      lengths(S, ["O", "H"])
      S.eqFn = ratioLine(false)
      S.mode = "turnSlide"
      look(S, [...ALL, "eq"])
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 5,
  },
  {
    id: "what-changes",
    say: "What changes the answer?",
    enter: S => {
      angleTri(S)
      lengths(S, ["O", "H"])
      S.eqFn = ratioLine(false)
      choose(S, ["Turning $\\theta$", "Sliding the triangle"], 0)
      look(S, [...ALL, "eq", "chips"])
    },
    done: picked,
    advanceAfter: 1500,
  },
  watch("only-angle", "Only the angle changes it.", S => {
    angleTri(S)
    lengths(S, ["O", "H"])
    S.eqFn = ratioLine(false)
    S.pulseArc = true
    look(S, [...ALL, "eq"])
  }),
  watch("sine", "This number is called the *sine* of $\\theta$.", S => {
    angleTri(S)
    lengths(S, ["O", "H"])
    S.eqFn = S2 => namedRule(S2, "sin")
    say(S, "We write sine as $\\sin$.", "calm", 600)
    look(S, [...ALL, "eq"])
  }, 2.2),
  watch("sin30", "So $\\sin 30^\\circ = 0.5$.", S => {
    angleTri(S, { th: 30 })
    lengths(S, ["O", "H"])
    S.halves = S.time + 0.9
    S.eqFn = S2 => liveValue(S2, "sin")
    look(S, [...ALL, "eq"])
  }, 2.4),
  {
    id: "sin-play",
    say: "Turn $\\theta$ and watch $\\sin\\theta$.",
    enter: S => {
      angleTri(S)
      lengths(S, ["O", "H"])
      S.eqFn = S2 => liveValue(S2, "sin")
      S.mode = "turnSlide"
      look(S, [...ALL, "eq"])
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 5,
  },

  // ── 3. Cosine and tangent ──
  watch("more", "The other pairs of sides make numbers too.", S => {
    angleTri(S)
    lengths(S)
    look(S, ALL)
  }),
  watch("cosine", "The adjacent divided by the hypotenuse is the *cosine*.", S => {
    angleTri(S)
    lengths(S)
    S.pulseLabs = new Set(["A", "H"])
    S.eqFn = S2 => namedRule(S2, "cos")
    say(S, "We write cosine as $\\cos$.", "calm", 600)
    look(S, [...ALL, "eq"])
  }, 2.2),
  {
    id: "cos-play",
    say: "Slide and turn. Watch $\\cos\\theta$.",
    enter: S => {
      angleTri(S)
      lengths(S)
      S.eqFn = S2 => liveValue(S2, "cos")
      S.mode = "turnSlide"
      look(S, [...ALL, "eq"])
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 5,
  },
  watch("tangent", "The opposite divided by the adjacent is the *tangent*.", S => {
    angleTri(S)
    lengths(S)
    S.pulseLabs = new Set(["O", "A"])
    S.eqFn = S2 => namedRule(S2, "tan")
    say(S, "We write tangent as $\\tan$.", "calm", 600)
    look(S, [...ALL, "eq"])
  }, 2.2),
  {
    id: "tan-play",
    say: "Slide and turn. Watch $\\tan\\theta$.",
    enter: S => {
      angleTri(S)
      lengths(S)
      S.eqFn = S2 => liveValue(S2, "tan")
      S.mode = "turnSlide"
      look(S, [...ALL, "eq"])
    },
    done: S => S.turned > 20,
    free: true,
    minPlay: 5,
  },
  {
    id: "tan-big",
    say: "Can you make $\\tan\\theta$ bigger than $1$?",
    enter: S => {
      angleTri(S, { th: Math.min(S.tri.th, 32) })
      lengths(S)
      S.eqFn = S2 => liveValue(S2, "tan")
      S.mode = "turnSlide"
      S.tick = S2 => {
        if (S2.got.has("big") || thShown(S2) < 46) return
        S2.got.add("big")
        S2.touched = { kind: "tri" }
        say(S2, "The opposite is now longer than the adjacent.", "calm", 4)
      }
      look(S, [...ALL, "eq"])
    },
    done: S => S.got.has("big"),
    advanceAfter: 2800,
  },
  watch("three", "Here are all three rules.", S => {
    angleTri(S, { framed: true })
    names(S)
    S.angText = () => "\\theta"
    S.cards = (["sin", "cos", "tan"] as Fn[]).map(fn => ({ fn, lit: false }))
    look(S, [...TRI, "cards"])
  }, 2.2),
  watch("soh", "Many students remember them as SOH CAH TOA.", S => {
    angleTri(S, { framed: true })
    names(S)
    S.angText = () => "\\theta"
    S.cards = (["sin", "cos", "tan"] as Fn[]).map(fn => ({ fn, lit: false }))
    S.soh = S.time + 0.3
    look(S, [...TRI, "cards"])
  }, 2.8),
  ...([["rule-OA", "O", "A", "tan"], ["rule-AH", "A", "H", "cos"], ["rule-OH", "O", "H", "sin"]] as [string, Role, Role, Fn][]).map(([id, a, b, fn]): Beat => ({
    id,
    say: `Which rule uses $${a}$ and $${b}$? Tap it.`,
    enter: S => {
      angleTri(S, { framed: true })
      names(S)
      S.angText = () => "\\theta"
      S.glow = new Set([sideOf("V", a), sideOf("V", b)])
      cardsTap(S, fn)
      S.soh = S.time - 10
      look(S, [...TRI, "cards"])
    },
    done: S => S.got.has("rule"),
    advanceAfter: 1300,
  })),

  // ── 4. Your calculator ──
  watch("calc-knows", "Your calculator knows these numbers for every angle.", S => {
    angleTri(S, { th: 30, framed: true })
    lengths(S, ["O", "H"])
    S.eqFn = S2 => liveValue(S2, "sin")
    look(S, [...TRI, "eq"])
  }, 2.2),
  {
    id: "type-sin30",
    say: "Type $\\sin 30$ and press $=$.",
    enter: S => {
      angleTri(S, { th: 30, framed: true })
      lengths(S, ["O", "H"])
      askValue(S, 0.5, S2 => { S2.halves = S2.time - 10; S2.touched = { kind: "tri" }; S2.flashGood = 1 })
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    walk: typeWalk("sin", 30, "0.5"),
  },
  {
    id: "type-sin50",
    say: "Now type $\\sin 50$.",
    enter: S => {
      angleTri(S, { th: 50, framed: true })
      lengths(S, ["O", "H"])
      askValue(S, Math.sin(50 * Math.PI / 180), S2 => {
        S2.pulseLabs = new Set(["O", "H"])
        say(S2, "The triangle's sides give the same number.", "calm", 4)
      }, S2 => [op("eq2", "="), valuesFrac(S2, "sin", true)])
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 3200,
    walk: typeWalk("sin", 50, "0.766"),
  },
  watch("degrees", "Your own calculator must be in degrees.", S => {
    angleTri(S, { th: 50, framed: true })
    lengths(S, ["O", "H"])
    say(S, "Look for a small D at the top of its screen.", "calm", 600)
    look(S, TRI)
  }, 2.2),
  {
    id: "type-tan45",
    say: "Type $\\tan 45$.",
    enter: S => {
      angleTri(S, { th: 45, framed: true })
      lengths(S, ["O", "A"])
      askValue(S, 1, S2 => { S2.ticks = ["VF", "FP"]; S2.touched = { kind: "tri" }; S2.flashGood = 1 })
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    walk: typeWalk("tan", 45, "1"),
  },
  watch("tan45-why", "At $45^\\circ$ the opposite and the adjacent are equal.", S => {
    angleTri(S, { th: 45, framed: true })
    lengths(S, ["O", "A"])
    S.ticks = ["VF", "FP"]
    S.pulseLabs = new Set(["O", "A"])
    look(S, TRI)
  }, 2.2),

  // ── 5. Where the numbers come from ──
  watch("where", "Where does the calculator get these numbers?", S => {
    angleTri(S, { th: 40 })
    lengths(S, ["H"])
    look(S, ALL)
  }),
  {
    id: "to-one",
    say: "Slide until the hypotenuse is exactly $1$.",
    enter: S => {
      angleTri(S, { th: 40, h: 6 })
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
  watch("opp-is-sin", "Now the opposite is $\\sin\\theta$ itself.", S => {
    unitBoard(S, null)
    S.tri.th = 40
    S.roleLabels = { H: () => ({ tex: "1" }), O: () => ({ tex: "\\sin\\theta" }) }
    S.roleColours = new Set(["O", "A", "H"])
    S.eqFn = () => row([atom("fn", "\\sin"), atom("th-sin", "\\theta"), op("eq", "="), frac("rb-1", atom("r0-1", "O", { col: ORANGE }), atom("r1-1", "1", { col: GREEN })), op("eq2", "="), atom("O-is", "O", { col: ORANGE })])
    look(S, ["tri", "fill", "rt", "arc", "labels", "eq"])
  }, 2.4),
  {
    id: "draw-sin",
    say: "Turn $\\theta$ all the way from $0^\\circ$ to $90^\\circ$.",
    enter: S => {
      unitBoard(S, newGraph("sin"))
      S.tri.th = clamp(S.tri.th, 20, 50)
      S.roleLabels = { O: () => ({ tex: "\\sin\\theta" }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "turn"
      look(S, ["tri", "fill", "rt", "arc", "labels", "graph"])
    },
    done: S => !!S.graph && seenCount(S.graph.seen) >= 78,
    free: true,
    minPlay: 3,
  },
  watch("sin-curve", "This curve holds the sine of every angle up to $90^\\circ$.", S => {
    const g = S.graph && S.graph.fn === "sin" ? S.graph : newGraph("sin", true)
    unitBoard(S, g)
    S.roleLabels = { O: () => ({ tex: "\\sin\\theta" }) }
    S.roleColours = new Set(["O", "A", "H"])
    look(S, ["tri", "fill", "rt", "arc", "labels", "graph"])
  }, 2.4),
  {
    id: "draw-cos",
    say: "The adjacent is $\\cos\\theta$. Turn it again.",
    enter: S => {
      const g = S.graph ?? newGraph("sin", true)
      unitBoard(S, { ...g, fn: "cos", last: null })
      S.roleLabels = { A: () => ({ tex: "\\cos\\theta" }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "turn"
      look(S, ["tri", "fill", "rt", "arc", "labels", "graph"])
    },
    done: S => !!S.graph && seenCount(S.graph.seenCos) >= 78,
    free: true,
    minPlay: 3,
  },

  // ── 6. Make the triangle ──
  makeAngle("make-tan1", "Make $\\tan\\theta = 1$.", 45, 30, S => liveValue(S, "tan"), ["O", "A"], "Close. Make it exactly $1$."),
  makeAngle("make-half", "Make the adjacent exactly half the hypotenuse.", 60, 35, S => row([lettersFrac("cos"), op("eq", "="), valuesFrac(S, "cos"), op("eq2", "="), valueAtom(S, "cos")]), ["A", "H"], "Close. Exactly half."),
  makeAngle("make-06", "Make $\\sin\\theta = 0.6$.", Math.asin(0.6) * 180 / Math.PI, 55, S => liveValue(S, "sin"), ["O", "H"], "Close. Make it exactly $0.6$."),
  watch("later", "Later, your calculator will find angles like this for you.", S => {
    angleTri(S, { th: Math.asin(0.6) * 180 / Math.PI })
    S.thExact = S.tri.th
    lengths(S, ["O", "H"])
    S.eqFn = S2 => liveValue(S2, "sin")
    look(S, [...ALL, "eq"])
  }, 2.4),
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      angleTri(S)
      lengths(S)
      S.eqFn = S2 => liveValue(S2, "sin")
      S.mode = "turnSlide"
      look(S, [...ALL, "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["angle", "The sides of a right-angled triangle"],
  ["keep-30", "Bigger and smaller"],
  ["more", "Cosine and tangent"],
  ["calc-knows", "Your calculator"],
  ["where", "Where the numbers come from"],
  ["make-tan1", "Make the triangle"],
]
applyParts(BEATS, PARTS)
