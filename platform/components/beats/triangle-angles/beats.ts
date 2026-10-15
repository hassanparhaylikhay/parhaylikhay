/**
 * Angles in a triangle, one tiny idea per beat.
 *
 * The student draws a triangle, plays with it, sees its angles, finds that
 * they always add to 180, sees why (the corners tear off onto a straight
 * line), meets the isosceles and equilateral cases the same way, then uses
 * the fact: missing angles first, then building triangles to order.
 *
 * Every `enter` sets the whole board for its beat from scratch, so any beat
 * can be opened cold (?beat=N) or returned to.
 */

import { anglesOf, thinness, diameter } from "../geometry"
import type { WalkStep } from "../walk"
import {
  type Scene, type EqPart,
  BLUE, ORANGE, PINK, GREEN, GREY,
  resetBeat, show, ensureTriangle, ensureIso, ensureEqui, refit, morphTo, colours,
  untear, tearAll, startInput, refreshChips, say, roomForEqui, roomToBuild, screenScale,
} from "./scene"

export interface Beat {
  id: string
  /** The one phrase on screen. $...$ is KaTeX. */
  /** This beat starts a new part of the lesson: its title comes up first (chapter.ts). */
  chapter?: string
  say: string
  enter: (S: Scene) => void
  /** A doing beat finishes itself when this turns true. */
  done?: (S: Scene) => boolean
  /** Continue button: "" is a plain arrow; undefined means none. */
  cta?: string
  /** Seconds before the button appears. */
  ctaAfter?: number
  /**
   * A playing beat: when `done` turns true the board does NOT move on.
   * The continue button appears instead, and the student keeps playing
   * until they choose to go on.
   */
  free?: boolean
  /** Seconds of play before a playing beat offers to move on. */
  minPlay?: number
  restart?: boolean
  /** "Show me how": the worked solution, one step at a time, for a student who is stuck */
  walk?: WalkStep<Scene>[]
}

const DEFAULT = [BLUE, ORANGE, PINK]
const deg = (n: number) => `${n}^\\circ`
const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`

const ALL = ["tri", "nodes", "arcs", "values"] as const

// ── small builders ───────────────────────────────────────────────────────

function free(S: Scene) {
  S.mode = "free"
  S.glow = [true, true, true]
}

const movedEnough = (px: number, corners = 1) => (S: Scene) =>
  !S.drag && S.moved >= px * screenScale(S) && S.movedCorners.size >= corners

const afterRelease = (test: (S: Scene) => boolean) => (S: Scene) =>
  !S.drag && S.releases > 0 && !!S.P && test(S)

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.6): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

/** The sum written as an equation with a box for the unknown. */
function equation(known: [number, string][], boxes: number): EqPart[] {
  const parts: EqPart[] = []
  known.forEach(([v, col], k) => {
    if (k) parts.push("+")
    parts.push(c(col, deg(v)))
  })
  for (let b = 0; b < boxes; b++) {
    parts.push("+")
    parts.push({ box: true })
  }
  parts.push("=", c(GREEN, deg(180)))
  return parts
}

/** A practice question: shape, labels, colours, and the sum to fill. */
function practice(S: Scene, spec: {
  angles: number[]
  order?: { left: number; right: number; apex: number }
  given: number[]
  unknown: number[]
  givenColours: string[]
  hints: string[]
  iso?: boolean
}) {
  resetBeat(S)
  untear(S)
  if (spec.iso) { S.apex = spec.order?.apex ?? 2; S.tickKind = "iso" }
  show(S, ["tri", "arcs", "values", "line", "keypad", ...(spec.iso ? ["ticks" as const] : [])])
  morphTo(S, spec.angles, spec.order)
  const cols = [GREY, GREY, GREY]
  const labels: (string | null)[] = ["", "", ""]
  spec.given.forEach((i, k) => { cols[i] = spec.givenColours[k]; labels[i] = deg(spec.angles[i]) })
  for (const i of spec.unknown) { cols[i] = PINK; labels[i] = "?" }
  colours(S, cols)
  S.label = labels
  S.pulse = [0, 1, 2].map(i => spec.unknown.includes(i))
  startInput(S, {
    parts: equation(spec.given.map((i, k) => [spec.angles[i], spec.givenColours[k]]), spec.unknown.length),
    answer: spec.angles[spec.unknown[0]],
    unknown: spec.unknown,
    hints: spec.hints,
    known: spec.given.map((i, k) => ({ deg: spec.angles[i], color: spec.givenColours[k] })),
  })
}

function targets(S: Scene, T: number[]) {
  resetBeat(S)
  untear(S)
  ensureTriangle(S)
  free(S)
  colours(S, DEFAULT)
  S.snapKind = "targets"
  S.targets = T
  show(S, [...ALL, "line"])
  // Start mid-sized and centred, so there is room to stretch the shape
  // whichever way the angles need.
  roomToBuild(S)
  refreshChips(S)
}

const inputRight = (S: Scene) => S.input?.state === "right"

/** A walkthrough for "two angles known, find the third". */
function thirdWalk(a: number, b: number, ca: string, cb: string, unknown: number): WalkStep<Scene>[] {
  const ans = 180 - a - b
  return [
    { say: "A triangle's angles always add up to $180^\\circ$.", tex: `${c(ca, deg(a))} + ${c(cb, deg(b))} + ${c(PINK, "?")} = ${c(GREEN, deg(180))}`, show: S => { S.vis.helpFan.t = 1; S.pulse = [true, true, true] } },
    { say: `The two you know make $${a + b}^\\circ$.`, tex: `${c(ca, deg(a))} + ${c(cb, deg(b))} = ${deg(a + b)}` },
    { say: `So the missing angle is $${ans}^\\circ$.`, tex: `${c(PINK, "?")} = 180^\\circ - ${deg(a + b)} = ${c(GREEN, deg(ans))}`, show: S => { S.label[unknown] = deg(ans); S.pulse = [0, 1, 2].map(i => i === unknown) } },
  ]
}

// ── the beats ────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // Make a triangle. Nothing about angles yet.
  {
    id: "draw",
    say: "Draw a triangle.",
    enter: S => {
      resetBeat(S)
      untear(S)
      S.P = null
      S.D = null
      S.chain = []
      S.drewOnce = false
      colours(S, DEFAULT)
      S.mode = "draw"
      show(S, ["tri"])
    },
    done: S => S.P !== null,
  },
  {
    id: "move",
    say: "Move the corners.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, ["tri", "nodes"]); refit(S) },
    done: movedEnough(420, 2),
    free: true,
    minPlay: 7,
  },
  {
    id: "flat",
    say: "Make it long and flat.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, ["tri", "nodes"]) },
    // any direction counts: a thin triangle at a slant is still long and flat
    done: afterRelease(S => thinness(S.P!) >= 3 && diameter(S.P!) > 150 * screenScale(S) && S.moved >= 120 * screenScale(S)),
    free: true,
    minPlay: 3,
  },
  {
    id: "tall",
    say: "Now make it tall and thin.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, ["tri", "nodes"]) },
    done: afterRelease(S => thinness(S.P!) >= 1.8 && diameter(S.P!) > 130 * screenScale(S) && S.moved >= 120 * screenScale(S)),
    free: true,
    minPlay: 3,
  },

  // Its angles.
  watch("angles", "Each corner has an angle.", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT); show(S, ["tri", "nodes", "arcs"])
  }, 1.8),
  {
    id: "watch-angles",
    say: "Move a corner. Watch the angles.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, ["tri", "nodes", "arcs"]) },
    done: movedEnough(380),
    free: true,
    minPlay: 7,
  },
  watch("sizes", "Each angle has a size.", S => {
    resetBeat(S); ensureTriangle(S); show(S, [...ALL])
  }, 1.8),
  {
    id: "big",
    say: "Make one angle really big.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, [...ALL]) },
    done: afterRelease(S => Math.max(...anglesOf(S.P!)) >= 120),
    free: true,
    minPlay: 3,
  },
  {
    id: "small",
    say: "Now make one really small.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, [...ALL]) },
    done: afterRelease(S => Math.min(...anglesOf(S.P!)) <= 15),
    free: true,
    minPlay: 3,
  },
  {
    id: "spot",
    say: "One thing never changes. Can you spot it?",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, [...ALL]) },
    cta: "Show me",
    ctaAfter: 10,
  },

  // The sum.
  watch("add", "Add the three angles.", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT); show(S, [...ALL, "sum"]); refit(S)
  }, 2.6),
  {
    id: "again",
    say: "Move the corners again.",
    enter: S => { resetBeat(S); ensureTriangle(S); free(S); show(S, [...ALL, "sum"]); refit(S) },
    done: movedEnough(420, 2),
    free: true,
    minPlay: 8,
  },
  watch("always", "The total is always $180^\\circ$.", S => {
    resetBeat(S); ensureTriangle(S); show(S, [...ALL, "sum"])
  }, 1.8),

  // Why: the corners fit together on a straight line.
  {
    id: "tear",
    say: "Tap each angle to tear it off.",
    enter: S => {
      resetBeat(S)
      ensureTriangle(S)
      untear(S)
      colours(S, DEFAULT)
      show(S, [...ALL, "fan"])
      refit(S)
      S.mode = "tap"
      S.pulse = [true, true, true]
      S.onTap = (S2, i) => {
        if (S2.tear[i].on) return
        S2.tear[i] = { on: true, t: 0 }
        S2.tearOrder.push(i)
        S2.pulse[i] = false
      }
    },
    done: S => S.tear.every(t => t.on && t.t >= 1),
  },
  watch("line", "Together they make a straight line.", S => {
    resetBeat(S); ensureTriangle(S)
    if (!S.tear.every(t => t.on)) tearAll(S)
    show(S, [...ALL, "fan"]); refit(S)
    S.pulseLine = true
  }, 2),
  watch("line-180", "A straight line is $180^\\circ$.", S => {
    resetBeat(S); ensureTriangle(S)
    if (!S.tear.every(t => t.on)) tearAll(S)
    show(S, [...ALL, "fan", "fan180"]); refit(S)
  }, 1.8),
  watch("rule", "So the angles in a triangle add up to $180^\\circ$.", S => {
    resetBeat(S); ensureTriangle(S)
    if (!S.tear.every(t => t.on)) tearAll(S)
    show(S, [...ALL, "fan", "fan180"]); refit(S)
  }, 2),

  // Isosceles: two equal sides.
  {
    id: "iso-make",
    say: "Make two sides the same length.",
    enter: S => {
      resetBeat(S); ensureTriangle(S); untear(S); colours(S, DEFAULT)
      free(S)
      S.snapKind = "iso"
      S.tickKind = "iso"
      show(S, ["tri", "nodes"])
      refit(S)
    },
    done: S => S.locked,
  },
  watch("iso-marks", "These marks mean the sides are equal.", S => {
    resetBeat(S); ensureIso(S); S.tickKind = "iso"; show(S, ["tri", "nodes", "ticks"])
  }, 1.8),
  watch("iso-name", "It is called an *isosceles* triangle.", S => {
    resetBeat(S); ensureIso(S); S.tickKind = "iso"; show(S, ["tri", "nodes", "ticks"])
  }, 1.8),
  watch("iso-angles", "Look at these two angles.", S => {
    resetBeat(S); ensureIso(S); S.tickKind = "iso"
    isoColours(S)
    S.pulse = [0, 1, 2].map(i => i !== S.apex)
    show(S, [...ALL, "ticks"])
  }, 2),
  {
    id: "iso-move",
    say: "Move the glowing corner.",
    enter: S => {
      resetBeat(S); ensureIso(S); S.tickKind = "iso"; isoColours(S)
      S.mode = "iso"
      S.glow = [0, 1, 2].map(i => i === S.apex)
      show(S, [...ALL, "ticks"])
    },
    done: movedEnough(300),
    free: true,
    minPlay: 7,
  },
  watch("iso-equal", "Those two angles always match.", S => {
    resetBeat(S); ensureIso(S); S.tickKind = "iso"; isoColours(S)
    S.pulse = [0, 1, 2].map(i => i !== S.apex)
    show(S, [...ALL, "ticks"])
  }, 1.8),
  watch("iso-sum", "They still add up to $180^\\circ$.", S => {
    resetBeat(S); ensureIso(S); S.tickKind = "iso"; isoColours(S)
    show(S, [...ALL, "ticks", "sum"]); refit(S)
  }, 2.6),

  // Equilateral: all three equal.
  {
    id: "equi-make",
    say: "Now make all three sides equal.",
    enter: S => {
      resetBeat(S); ensureIso(S); isoColours(S)
      S.mode = "iso"
      S.snapKind = "equi"
      S.tickKind = "iso"
      S.glow = [0, 1, 2].map(i => i === S.apex)
      show(S, ["tri", "nodes", "ticks"])
      roomForEqui(S)
    },
    done: S => S.locked,
  },
  watch("equi-name", "This is an *equilateral* triangle.", S => {
    resetBeat(S); ensureEqui(S); S.tickKind = "equi"; show(S, ["tri", "nodes", "ticks"])
  }, 1.8),
  watch("equi-60", "Every angle is $60^\\circ$.", S => {
    resetBeat(S); ensureEqui(S); S.tickKind = "equi"; colours(S, [BLUE, BLUE, BLUE])
    show(S, [...ALL, "ticks"])
  }, 1.8),
  watch("equi-why", "Three equal angles share $180^\\circ$.", S => {
    resetBeat(S); ensureEqui(S); S.tickKind = "equi"; colours(S, [BLUE, BLUE, BLUE])
    S.lineTex = `\\dfrac{${c(GREEN, deg(180))}}{3} = ${c(BLUE, deg(60))}`
    show(S, [...ALL, "ticks", "line"]); refit(S)
  }, 2),
  {
    id: "equi-move",
    say: "Move any corner.",
    enter: S => {
      resetBeat(S); ensureEqui(S); S.tickKind = "equi"; colours(S, [BLUE, BLUE, BLUE])
      S.mode = "equi"
      S.glow = [true, true, true]
      show(S, [...ALL, "ticks"])
      refit(S)
    },
    done: movedEnough(360),
    free: true,
    minPlay: 7,
  },
  watch("equi-stays", "Each angle stays $60^\\circ$.", S => {
    resetBeat(S); ensureEqui(S); S.tickKind = "equi"; colours(S, [BLUE, BLUE, BLUE])
    show(S, [...ALL, "ticks"])
  }, 1.8),

  // Using it: the missing angle.
  watch("p1-a", "This angle is $50^\\circ$.", S => {
    resetBeat(S); untear(S)
    show(S, ["tri", "arcs", "values"])
    morphTo(S, [50, 60, 70])
    colours(S, [BLUE, GREY, GREY])
    S.label = [deg(50), "", ""]
    S.pulse = [true, false, false]
  }, 1.8),
  watch("p1-b", "This one is $60^\\circ$.", S => {
    resetBeat(S); untear(S)
    show(S, ["tri", "arcs", "values"])
    morphTo(S, [50, 60, 70])
    colours(S, [BLUE, ORANGE, GREY])
    S.label = [deg(50), deg(60), ""]
    S.pulse = [false, true, false]
  }, 1.8),
  {
    id: "p1-c",
    say: "What is the third angle?",
    enter: S => practice(S, {
      angles: [50, 60, 70], given: [0, 1], unknown: [2], givenColours: [BLUE, ORANGE],
      hints: [],
    }),
    done: inputRight,
    walk: thirdWalk(50, 60, BLUE, ORANGE, 2),
  },
  {
    id: "p2",
    say: "Find the missing angle.",
    enter: S => practice(S, {
      angles: [40, 65, 75], given: [0, 2], unknown: [1], givenColours: [BLUE, ORANGE],
      hints: [],
    }),
    done: inputRight,
    walk: thirdWalk(40, 75, BLUE, ORANGE, 1),
  },
  watch("p3-square", "This square means $90^\\circ$.", S => {
    resetBeat(S); untear(S)
    show(S, ["tri", "arcs", "values"])
    morphTo(S, [90, 35, 55])
    colours(S, [BLUE, GREY, GREY])
    S.label = [deg(90), "", ""]
    S.pulse = [true, false, false]
  }, 1.8),
  {
    id: "p3",
    say: "Find the missing angle.",
    enter: S => practice(S, {
      angles: [90, 35, 55], given: [0, 1], unknown: [2], givenColours: [BLUE, ORANGE],
      hints: [],
    }),
    done: inputRight,
    walk: thirdWalk(90, 35, BLUE, ORANGE, 2),
  },
  {
    id: "p4",
    say: "Two sides are equal. Find the missing angles.",
    enter: S => practice(S, {
      angles: [70, 70, 40], given: [2], unknown: [0, 1], givenColours: [BLUE], iso: true,
      hints: [],
    }),
    done: inputRight,
    walk: [
      { say: "Two equal sides mean two equal angles.", show: S => { S.pulse = [true, true, false] } },
      { say: "Together they make what's left of $180^\\circ$.", tex: `${c(PINK, "?")} + ${c(PINK, "?")} = 180^\\circ - ${c(BLUE, deg(40))} = ${deg(140)}`, show: S => { S.vis.helpFan.t = 1 } },
      { say: "So each one is half of $140^\\circ$, which is $70^\\circ$.", tex: `${c(PINK, "?")} = 140^\\circ \\div 2 = ${c(GREEN, deg(70))}`, show: S => { S.label[0] = deg(70); S.label[1] = deg(70) } },
    ],
  },
  {
    id: "p5-tap",
    say: "Which angle is also $65^\\circ$?",
    enter: S => {
      resetBeat(S); untear(S)
      S.apex = 2
      S.tickKind = "iso"
      show(S, ["tri", "arcs", "values", "ticks"])
      morphTo(S, [65, 65, 50])
      colours(S, [ORANGE, GREY, GREY])
      S.label = [deg(65), "", ""]
      // Both unknown angles breathe: tap one of us. Which one is the task.
      S.pulse = [false, true, true]
      S.mode = "tap"
      S.onTap = (S2, i) => {
        if (S2.locked) return
        if (i === 1) {
          S2.label[1] = deg(65)
          S2.colT[1] = ORANGE
          S2.pulse = [false, false, false]
          S2.flashGood = 1
          S2.locked = true
        } else if (i === 0) {
          say(S2, "That is the one you know.")
        } else {
          S2.shakeAt[i] = S2.time
          say(S2, "Look at the two equal sides.")
        }
      }
    },
    done: S => S.locked,
  },
  {
    id: "p5",
    say: "Now find the top angle.",
    enter: S => practice(S, {
      angles: [65, 65, 50], given: [0, 1], unknown: [2], givenColours: [ORANGE, ORANGE], iso: true,
      hints: [],
    }),
    done: inputRight,
    walk: thirdWalk(65, 65, ORANGE, ORANGE, 2),
  },

  // Building triangles to order.
  {
    id: "make-1",
    say: "Make a triangle with these angles.",
    enter: S => { morphTo(S, [62, 50, 68]); targets(S, [40, 30, 110]) },
    done: S => S.locked,
  },
  {
    id: "make-2",
    say: "Now make these.",
    enter: S => targets(S, [90, 60, 30]),
    done: S => S.locked,
  },
  {
    id: "make-3",
    say: "Now try these.",
    enter: S => targets(S, [100, 50, 60]),
    cta: "I can't do it",
    ctaAfter: 14,
  },
  // The impossible task, explained one step at a time. Some students saw
  // "they add up to 210" and said "oh" without connecting it to the rule,
  // so the rule is now the last thing said, not assumed.
  watch("why-not", "Do you know why you couldn't do it?", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT)
    S.targets = [100, 50, 60]
    refreshChips(S)
    show(S, [...ALL, "line"]); refit(S)
  }, 1.8),
  watch("cannot-exist", "Because a triangle like this can't exist.", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT)
    S.targets = [100, 50, 60]
    show(S, [...ALL, "line"]); refit(S)
  }, 1.8),
  watch("adds-210", "These angles add up to $210^\\circ$.", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT)
    S.lineTex = `100^\\circ + 50^\\circ + 60^\\circ = ${c(PINK, deg(210))}`
    show(S, [...ALL, "line"]); refit(S)
  }, 1.8),
  watch("always-180", "A triangle's angles always add up to $180^\\circ$.", S => {
    resetBeat(S); ensureTriangle(S); colours(S, DEFAULT)
    show(S, [...ALL, "sum"]); refit(S)
  }, 2.6),
  {
    id: "end",
    say: "Move it however you like. The angles still add up to $180^\\circ$.",
    enter: S => { resetBeat(S); ensureTriangle(S); colours(S, DEFAULT); free(S); show(S, [...ALL, "sum"]); refit(S) },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

function isoColours(S: Scene) {
  const col = [ORANGE, ORANGE, ORANGE]
  col[S.apex] = BLUE
  colours(S, col)
}

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["draw", "Angles in a triangle"],
  ["tear", "Why they add up to $180^\\circ$"],
  ["iso-make", "Isosceles triangles"],
  ["equi-make", "Equilateral triangles"],
  ["p1-a", "Finding missing angles"],
  ["make-1", "Build a triangle"],
]
for (const [id, title] of PARTS) {
  const b = BEATS.find(x => x.id === id)
  if (!b) throw new Error(`no beat called ${id}`)
  b.chapter = title
}
