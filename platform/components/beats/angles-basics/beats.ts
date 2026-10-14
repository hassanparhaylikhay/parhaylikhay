/**
 * Angles, one tiny idea per beat. An angle is a turn: full turn, half turn,
 * quarter turn. Then sizes and names, angles on a straight line and round
 * a point, crossing lines, parallel lines, the line across them and the
 * three pairs it makes, using it all, and one thing that cannot be done.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold. A board the student built is kept when the next beat can use
 * it.
 */

import { type Vec, RAD } from "../geometry"
import {
  type Scene, type EqPart, type Board, type VisKey,
  BLUE, ORANGE, PINK, GREEN, YELLOW, NEUTRAL,
  resetBeat, show, say, startInput, startChoices, ensureLine, raysOnLine, raysRound, crossingAt, parallelAt,
  setTransAcute, layout, screenScale, lineGap, intersect, rightDir, examLines,
} from "./scene"

export interface Beat {
  id: string
  /** The one phrase on screen. $...$ is KaTeX. */
  say: string
  enter: (S: Scene) => void
  /** A doing beat finishes itself when this turns true. */
  done?: (S: Scene) => boolean
  /** Continue button: "" is a plain arrow; undefined means none. */
  cta?: string
  /** Seconds before the button appears. */
  ctaAfter?: number
  /** A playing beat: when done, the arrow appears and the student chooses when to go on. */
  free?: boolean
  /** Seconds of play before a playing beat offers to move on. */
  minPlay?: number
  restart?: boolean
}

const deg = (n: number) => `${n}^\\circ`
const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const Q = c(PINK, "?")

// ── small builders ───────────────────────────────────────────────────────

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

const inputRight = (S: Scene) => S.input?.state === "right"
const guessIn = (S: Scene) => S.input?.state === "right" || S.input?.state === "guessed"
const turnedEnough = (d: number) => (S: Scene) => !S.drag && S.turned >= d
const movedEnough = (px: number) => (S: Scene) => !S.drag && S.moved >= px * screenScale(S)
const val = (S: Scene) => Math.round(S.theta)

/** Switch to a board. A new board fades in rather than jumping. */
function board(S: Scene, b: Board): boolean {
  if (S.board === b) return false
  S.board = b
  for (const k of ["board", "arcs", "values", "letters", "arrows"] as VisKey[]) S.vis[k].v = 0
  return true
}

function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

function ask(S: Scene, parts: EqPart[], answer: number, opts: { deg?: boolean; guess?: boolean; onRight?: (S: Scene) => void; help?: (S: Scene, tries: number) => void } = {}) {
  startInput(S, { parts, answer, hints: [], deg: opts.deg, guess: opts.guess, onRight: opts.onRight, help: opts.help })
}

/** A reminder line under the equation, never the worked answer. */
function remind(S: Scene, tex: string) {
  if (S.input) S.input.hints = [tex]
}

/** Only these angles are on the board. */
function only(S: Scene, ids: string[]) {
  S.show = new Set(ids)
}
function reveal(S: Scene, id: string) {
  if (S.show !== "all") S.show.add(id)
}

/** Givens in their colours, the unknown pink and breathing. */
function given(S: Scene, known: Record<string, string>, unknown: string, mark = "?") {
  only(S, [...Object.keys(known), unknown])
  S.fixed = { ...known, [unknown]: PINK }
  S.label = { [unknown]: mark }
  S.pulse = new Set([unknown])
}

/** The unknown, answered: its number shows, green. */
function solved(S: Scene, id: string) {
  delete S.label[id]
  S.fixed[id] = GREEN
  S.pulse = new Set()
}

/**
 * Tap the right angle. A wrong tap gets a word from `wrong`; the right one
 * goes green.
 */
function tapOne(S: Scene, answer: string, ids: string[] | null, wrong: (S: Scene, id: string, tries: number) => void, onRight?: (S: Scene) => void) {
  S.mode = "tap"
  S.tapIds = ids
  let tries = 0
  S.onTap = (S2, id) => {
    if (S2.got.has(answer)) return
    if (id === answer) {
      S2.got.add(id)
      S2.fixed[id] = GREEN
      S2.flashGood = 1
      S2.note = null
      onRight?.(S2)
      return
    }
    tries++
    wrong(S2, id, tries)
  }
}
const tapped = (id: string) => (S: Scene) => S.got.has(id)

// ── the turning line ─────────────────────────────────────────────────────

function turnBoard(S: Scene, theta?: number) {
  board(S, "turn")
  S.lines = []; S.linesD = []; S.rays = []; S.raysD = []
  if (theta !== undefined) S.theta = theta
}
function turning(S: Scene, theta?: number) {
  turnBoard(S, theta)
  S.mode = "turn"
}

// ── a straight line with lines from a point on it ────────────────────────

function lineBoard(S: Scene, degs?: number[]) {
  board(S, "line")
  ensureLine(S)
  if (degs) raysOnLine(S, degs)
  else if (S.rays.length !== 1 || !S.lines[0]) raysOnLine(S, [65, 115])
}

// ── lines round a point ──────────────────────────────────────────────────

function pointBoard(S: Scene, degs: number[], keepCount?: number) {
  const fresh = board(S, "point")
  S.lines = []; S.linesD = []
  if (fresh || keepCount === undefined || S.rays.length !== keepCount) raysRound(S, degs, 15)
}

// ── two crossing lines ───────────────────────────────────────────────────

function crossBoard(S: Scene) {
  board(S, "cross")
  S.rays = []; S.raysD = []
  const L = layout(S)
  const X = S.lines.length === 2 ? intersect(S.lines[0], S.lines[1]) : null
  const inside = X && X[0] > L.board.x0 + 40 && X[0] < L.board.x1 - 40 && X[1] > L.board.y0 + 30 && X[1] < L.board.y1 - 30
  if (!inside || lineGap(S.lines[0].a, S.lines[1].a) < 15 * RAD) crossingAt(S, 60)
}

/** Keep the crossing away from a right angle, where every angle matches. */
function notSquare(S: Scene) {
  const g = lineGap(S.lines[0].a, S.lines[1].a)
  if (g > 72 * RAD) S.lines[1] = { ...S.lines[1], a: rightDir(S.lines[0].a) - 58 * RAD }
}

// ── parallel lines ───────────────────────────────────────────────────────

function parBoard(S: Scene) {
  board(S, "parallel")
  S.rays = []; S.raysD = []
  if (S.lines.length < 2 || lineGap(S.lines[0].a, S.lines[1].a) > 0.001) parallelAt(S, 60, { withTrans: false })
  S.lines = S.lines.slice(0, 2)
  S.linesD = S.linesD.slice(0, 2)
}

/** Two parallel lines and one across them. Keeps the student's if they are good. */
function transBoard(S: Scene, acute?: number) {
  board(S, "parallel")
  S.rays = []; S.raysD = []
  const ok = S.lines.length === 3 && lineGap(S.lines[0].a, S.lines[1].a) < 0.001
  if (acute !== undefined) parallelAt(S, acute)
  else if (!ok) parallelAt(S, 60)
}

function tilted(S: Scene) {
  return S.lines.length >= 2 && lineGap(S.lines[0].a, S.lines[1].a) > 2 * RAD
}
function tilt(S: Scene, by = 10) {
  S.lines[1] = { ...S.lines[1], a: S.lines[0].a + by * RAD }
}

/** Turn one of the parallel lines, a little either way. */
function tiltable(S: Scene) {
  S.mode = "rotLine"
  S.rotLine = 1
  S.tilt = { base: S.lines[0].a, max: 14 * RAD }
  S.meet = true
}

function turnAcross(S: Scene) {
  S.mode = "rotLine"
  S.rotLine = 2
}

/** The quadrant pairs on two parallels: corresponding, alternate, co-interior. */
const CORR: [number, number] = [0, 0]
const ALT: [number, number] = [1, 3]
const COI: [number, number] = [1, 0]

/** Three parallel lines and two lines across them, like a past paper figure. */
function examBoard(S: Scene) {
  board(S, "exam")
  S.lines = examLines(layout(S))
  S.linesD = S.lines.map(l => ({ p: [l.p[0], l.p[1]] as Vec, a: l.a }))
  S.exam = [
    { id: "G", line: 0, trans: 3, q: 1 },
    { id: "p", line: 1, trans: 3, q: 0 },
    { id: "q", line: 2, trans: 3, q: 0 },
    { id: "D", line: 2, trans: 4, q: 1 },
  ]
}

// ── the beats ────────────────────────────────────────────────────────────

const FIGS = [
  { id: "F0", name: "acute" },
  { id: "F1", name: "obtuse" },
  { id: "F2", name: "reflex" },
]
const figTap = (k: number): Beat => ({
  id: `tap-${FIGS[k].name}`,
  say: `Tap the ${FIGS[k].name} angle.`,
  enter: S => {
    resetBeat(S); board(S, "figs")
    look(S, ["arcs", "values"])
    S.colourMode = "neutral"
    tapOne(S, FIGS[k].id, null, (S2, id) => {
      const f = FIGS.find(x => x.id === id)
      if (f) say(S2, `That one is ${f.name}.`)
    })
  },
  done: tapped(FIGS[k].id),
})

/** A pair on the parallels, for the student to name. */
const pairQuiz = (id: string, q: [number, number], answer: number): Beat => {
  const kinds = ["F", "Z", "C"] as const
  return {
    id,
    say: "Which pair is this?",
    enter: S => {
      resetBeat(S); transBoard(S)
      look(S, ["arcs", "values", "arrows", "choices"])
      only(S, [`A${q[0]}`, `B${q[1]}`])
      S.fixed = { [`A${q[0]}`]: BLUE, [`B${q[1]}`]: BLUE }
      S.pulse = new Set([`A${q[0]}`, `B${q[1]}`])
      const showShape = (S2: Scene) => { S2.shape = { kind: kinds[answer], q }; S2.vis.shape.t = 1 }
      startChoices(S, ["Corresponding", "Alternate", "Co-interior"], answer, showShape, showShape)
    },
    done: S => S.choices?.state === "right",
  }
}

export const BEATS: Beat[] = [
  // ── 1. An angle is a turn ──
  {
    id: "turn",
    say: "Turn the line.",
    enter: S => { resetBeat(S); turning(S, 25); look(S, []) },
    done: turnedEnough(150), free: true, minPlay: 8,
  },
  {
    id: "how-far",
    say: "How far it turns is the angle.",
    enter: S => { resetBeat(S); turning(S); look(S, ["arcs", "values"]) },
    cta: "", ctaAfter: 2,
  },
  {
    id: "full",
    say: "Turn it all the way round.",
    enter: S => {
      resetBeat(S); turning(S)
      if (S.theta > 320) S.theta = 40
      S.snaps = [360]
      look(S, ["arcs", "values"])
    },
    done: S => S.locked && val(S) === 360,
  },
  watch("is-360", "One full turn is $360^\\circ$.", S => {
    resetBeat(S); turnBoard(S, 360); look(S, ["arcs", "values"])
  }),
  {
    id: "half",
    say: "Now turn it halfway.",
    enter: S => {
      resetBeat(S); turning(S)
      if (S.theta > 160) S.theta = 20
      S.snaps = [180]
      look(S, ["arcs", "values"])
    },
    done: S => S.locked && val(S) === 180,
  },
  watch("is-180", "Half a turn is $180^\\circ$. It makes a straight line.", S => {
    resetBeat(S); turnBoard(S, 180); look(S, ["arcs", "values"])
  }, 2.2),
  {
    id: "quarter",
    say: "Now a quarter turn.",
    enter: S => {
      resetBeat(S); turning(S)
      if (S.theta > 80) S.theta = 20
      S.snaps = [90]
      look(S, ["arcs", "values"])
    },
    done: S => S.locked && val(S) === 90,
  },
  watch("is-90", "A quarter turn is $90^\\circ$. It's a right angle.", S => {
    resetBeat(S); turnBoard(S, 90); look(S, ["arcs", "values"])
  }, 2.2),
  {
    id: "any",
    say: "Turn it to any angle you like.",
    enter: S => { resetBeat(S); turning(S); look(S, ["arcs", "values"]) },
    done: turnedEnough(200), free: true, minPlay: 8,
  },

  // ── 2. Sizes have names ──
  {
    id: "make-acute",
    say: "Make an angle smaller than a right angle.",
    enter: S => {
      resetBeat(S); turning(S)
      if (val(S) < 90) S.theta = 135
      look(S, ["arcs", "values"])
    },
    done: S => !S.drag && S.releases > 0 && val(S) > 0 && val(S) < 90,
  },
  watch("acute", "That's an acute angle.", S => {
    resetBeat(S); turnBoard(S)
    if (!(val(S) > 0 && val(S) < 90)) S.theta = 50
    S.lineTex = `${c(BLUE, "\\text{acute}")} < 90^\\circ`
    look(S, ["arcs", "values", "line"])
  }),
  {
    id: "make-obtuse",
    say: "Bigger than a right angle, less than straight.",
    enter: S => {
      resetBeat(S); turning(S)
      if (val(S) > 90) S.theta = 50
      look(S, ["arcs", "values"])
    },
    done: S => !S.drag && S.releases > 0 && val(S) > 90 && val(S) < 180,
  },
  watch("obtuse", "That's an obtuse angle.", S => {
    resetBeat(S); turnBoard(S)
    if (!(val(S) > 90 && val(S) < 180)) S.theta = 125
    S.lineTex = `90^\\circ < ${c(BLUE, "\\text{obtuse}")} < 180^\\circ`
    look(S, ["arcs", "values", "line"])
  }),
  {
    id: "make-reflex",
    say: "Now go past the straight line.",
    enter: S => {
      resetBeat(S); turning(S)
      if (val(S) > 180) S.theta = 125
      look(S, ["arcs", "values"])
    },
    done: S => !S.drag && S.releases > 0 && val(S) > 180 && val(S) < 360,
  },
  watch("reflex", "Bigger than $180^\\circ$ is a reflex angle.", S => {
    resetBeat(S); turnBoard(S)
    if (!(val(S) > 180 && val(S) < 360)) S.theta = 240
    S.lineTex = `${c(BLUE, "\\text{reflex}")} > 180^\\circ`
    look(S, ["arcs", "values", "line"])
  }),
  figTap(0),
  figTap(1),
  figTap(2),
  {
    id: "make-270",
    say: "Make an angle of $270^\\circ$.",
    enter: S => {
      resetBeat(S); turning(S)
      if (Math.abs(val(S) - 270) < 25) S.theta = 200
      S.magnet = 270
      look(S, ["arcs", "values"])
    },
    done: S => S.locked && val(S) === 270,
  },

  // ── 3. Naming an angle ──
  watch("letters", "Points get capital letters.", S => {
    resetBeat(S); turnBoard(S, 50); look(S, ["letters"])
  }),
  watch("abc", "This angle is called angle $ABC$.", S => {
    resetBeat(S); turnBoard(S, 50)
    S.pulse = new Set(["turn"])
    S.lineTex = "\\angle ABC"
    look(S, ["arcs", "letters", "line"])
  }, 2.2),
  watch("middle", "The middle letter is the corner.", S => {
    resetBeat(S); turnBoard(S, 50)
    S.pulse = new Set(["B"])
    S.lineTex = `\\angle A${c(YELLOW, "B")}C`
    look(S, ["arcs", "letters", "line"])
  }, 2.2),
  {
    id: "tap-pqr",
    say: "Tap angle $PQR$.",
    enter: S => {
      resetBeat(S); board(S, "named")
      S.colourMode = "neutral"
      look(S, ["arcs", "letters"])
      tapOne(S, "PQR", null, S2 => say(S2, "That's angle $RQS$."))
    },
    done: tapped("PQR"),
  },
  {
    id: "tap-rqs",
    say: "Tap angle $RQS$.",
    enter: S => {
      resetBeat(S); board(S, "named")
      S.colourMode = "neutral"
      look(S, ["arcs", "letters"])
      tapOne(S, "RQS", null, S2 => say(S2, "That's angle $PQR$."))
    },
    done: tapped("RQS"),
  },

  // ── 4. Angles on a straight line ──
  {
    id: "draw-line",
    say: "Draw a straight line.",
    enter: S => {
      resetBeat(S); board(S, "line")
      S.lines = []; S.linesD = []; S.rays = []; S.raysD = []
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "line"
      look(S, [])
    },
    done: S => S.lines.length >= 1,
  },
  {
    id: "draw-ray",
    say: "Now draw a line from a point on it.",
    enter: S => {
      resetBeat(S); board(S, "line"); ensureLine(S)
      S.rays = []; S.raysD = []
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "ray"
      look(S, [])
    },
    done: S => S.rays.length >= 1,
  },
  watch("share", "Two angles share the straight line.", S => {
    resetBeat(S); lineBoard(S); look(S, ["arcs", "values"])
  }),
  {
    id: "move-ray",
    say: "Move the new line.",
    enter: S => { resetBeat(S); lineBoard(S); S.mode = "rays"; look(S, ["arcs", "values"]) },
    done: movedEnough(250), free: true, minPlay: 8,
  },
  {
    id: "guess-180",
    say: "Guess: what do they add up to?",
    enter: S => {
      resetBeat(S); lineBoard(S)
      look(S, ["arcs", "values", "line", "keypad"])
      ask(S, [{ box: true }], 180, { guess: true, deg: true })
    },
    done: guessIn,
  },
  watch("add-line", "Add them.", S => {
    resetBeat(S); lineBoard(S); S.mode = "rays"
    S.sum = { ids: ["W0", "W1"], total: 180 }
    look(S, ["arcs", "values", "sum"])
  }, 2.6),
  watch("half-turn", "Together they make half a turn.", S => {
    resetBeat(S); lineBoard(S); S.mode = "rays"
    S.sum = { ids: ["W0", "W1"], total: 180 }
    S.halfIds = ["W0", "W1"]
    look(S, ["arcs", "values", "sum", "half"])
  }),
  {
    id: "line-q1",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); lineBoard(S, [130, 50])
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { W0: BLUE }, "W1")
      ask(S, [Q, "=", { box: true }], 50, {
        deg: true,
        help: (S2, t) => {
          S2.halfIds = ["W0", "W1"]; S2.vis.half.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(130))} + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "W1"),
      })
    },
    done: inputRight,
  },
  {
    id: "line-q2",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); lineBoard(S, [40, 75, 65])
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { W0: BLUE, W1: ORANGE }, "W2")
      ask(S, [Q, "=", { box: true }], 65, {
        deg: true,
        help: (S2, t) => {
          S2.halfIds = ["W0", "W1", "W2"]; S2.vis.half.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(40))} + ${c(ORANGE, deg(75))} + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "W2"),
      })
    },
    done: inputRight,
  },

  // ── 5. Angles round a point ──
  {
    id: "point",
    say: "Now three lines from one point.",
    enter: S => { resetBeat(S); pointBoard(S, [110, 120, 130], 3); S.mode = "rays"; look(S, ["arcs", "values"]) },
    done: movedEnough(250), free: true, minPlay: 8,
  },
  {
    id: "guess-360",
    say: "Guess: what do they add up to?",
    enter: S => {
      resetBeat(S); pointBoard(S, [110, 120, 130], 3)
      look(S, ["arcs", "values", "line", "keypad"])
      ask(S, [{ box: true }], 360, { guess: true, deg: true })
    },
    done: guessIn,
  },
  watch("add-point", "Add them.", S => {
    resetBeat(S); pointBoard(S, [110, 120, 130], 3); S.mode = "rays"
    S.sum = { ids: ["P0", "P1", "P2"], total: 360 }
    look(S, ["arcs", "values", "sum"])
  }, 2.6),
  watch("full-turn", "Together they make a full turn.", S => {
    resetBeat(S); pointBoard(S, [110, 120, 130], 3); S.mode = "rays"
    S.sum = { ids: ["P0", "P1", "P2"], total: 360 }
    S.fullAt = true
    look(S, ["arcs", "values", "sum", "full"])
  }),
  {
    id: "add-ray",
    say: "Tap to add another line.",
    enter: S => { resetBeat(S); pointBoard(S, [110, 120, 130], 3); S.mode = "addRay"; look(S, ["arcs", "values"]) },
    done: S => S.rays.length >= 4,
  },
  watch("still-360", "Four angles. Still $360^\\circ$.", S => {
    resetBeat(S); pointBoard(S, [80, 105, 95, 80], 4); S.mode = "rays"
    S.sum = { ids: ["P0", "P1", "P2", "P3"], total: 360 }
    S.fullAt = true
    look(S, ["arcs", "values", "sum", "full"])
  }, 2.6),
  {
    id: "point-q1",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); pointBoard(S, [90, 110, 85, 75])
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { P0: BLUE, P1: ORANGE, P2: YELLOW }, "P3")
      ask(S, [Q, "=", { box: true }], 75, {
        deg: true,
        help: (S2, t) => {
          S2.fullAt = true; S2.vis.full.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(90))} + ${c(ORANGE, deg(110))} + ${c(YELLOW, deg(85))} + ${Q} = ${c(GREEN, deg(360))}`)
        },
        onRight: S2 => solved(S2, "P3"),
      })
    },
    done: inputRight,
  },
  {
    id: "point-q2",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); pointBoard(S, [140, 95, 125])
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { P0: BLUE, P1: ORANGE }, "P2")
      ask(S, [Q, "=", { box: true }], 125, {
        deg: true,
        help: (S2, t) => {
          S2.fullAt = true; S2.vis.full.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(140))} + ${c(ORANGE, deg(95))} + ${Q} = ${c(GREEN, deg(360))}`)
        },
        onRight: S2 => solved(S2, "P2"),
      })
    },
    done: inputRight,
  },

  // ── 6. Crossing lines ──
  {
    id: "draw-cross",
    say: "Draw two straight lines that cross.",
    enter: S => {
      resetBeat(S); board(S, "cross")
      S.lines = []; S.linesD = []; S.rays = []; S.raysD = []
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "twoCross"
      look(S, [])
    },
    done: S => S.lines.length >= 2,
  },
  watch("four", "Four angles.", S => {
    resetBeat(S); crossBoard(S); look(S, ["arcs", "values"])
  }),
  {
    id: "turn-cross",
    say: "Turn one line.",
    enter: S => { resetBeat(S); crossBoard(S); S.mode = "rotLine"; S.rotLine = 1; look(S, ["arcs", "values"]) },
    done: turnedEnough(45), free: true, minPlay: 8,
  },
  {
    id: "tap-match",
    say: "Tap two angles that always match.",
    enter: S => {
      resetBeat(S); crossBoard(S); notSquare(S)
      look(S, ["arcs", "values"])
      S.mode = "tap"
      let first: string | null = null
      S.onTap = (S2, id) => {
        if (S2.got.size) return
        S2.halfIds = null
        S2.vis.half.t = 0
        if (!first || first === id) { first = id; S2.sel = id; return }
        const a = Number(first.slice(1)), b = Number(id.slice(1))
        if ((a + 2) % 4 === b) {
          S2.got = new Set([first, id])
          S2.fixed = { [first]: GREEN, [id]: GREEN }
          S2.sel = null
          S2.flashGood = 1
          S2.note = null
          return
        }
        // neighbours: they make a straight line between them
        S2.halfIds = b === (a + 1) % 4 ? [first, id] : [id, first]
        S2.vis.half.t = 1
        say(S2, "Those two add up to $180^\\circ$.", "calm")
        first = null
        S2.sel = null
      }
    },
    done: S => S.got.size === 2,
  },
  watch("opposite", "Opposite angles are equal.", S => {
    resetBeat(S); crossBoard(S); notSquare(S)
    S.colourMode = "pairs"
    S.mode = "rotLine"; S.rotLine = 1
    look(S, ["arcs", "values"])
  }),
  watch("vert-opp", "They're called vertically opposite angles.", S => {
    resetBeat(S); crossBoard(S)
    S.colourMode = "pairs"
    S.mode = "rotLine"; S.rotLine = 1
    look(S, ["arcs", "values"])
  }, 2.2),
  watch("why-ab", "Here's why. $a$ and $b$ make a straight line.", S => {
    resetBeat(S); crossBoard(S)
    only(S, ["C0", "C1", "C2"])
    S.fixed = { C0: BLUE, C1: ORANGE, C2: PINK }
    S.label = { C0: "a", C1: "b", C2: "c" }
    S.halfIds = ["C0", "C1"]
    S.lineTex = `${c(BLUE, "a")} + ${c(ORANGE, "b")} = ${c(GREEN, deg(180))}`
    S.mode = "rotLine"; S.rotLine = 1
    look(S, ["arcs", "values", "half", "line"])
  }, 2.2),
  watch("why-bc", "$b$ and $c$ make a straight line too.", S => {
    resetBeat(S); crossBoard(S)
    only(S, ["C0", "C1", "C2"])
    S.fixed = { C0: BLUE, C1: ORANGE, C2: PINK }
    S.label = { C0: "a", C1: "b", C2: "c" }
    S.halfIds = ["C1", "C2"]
    S.lineTex = `${c(ORANGE, "b")} + ${c(PINK, "c")} = ${c(GREEN, deg(180))}`
    S.mode = "rotLine"; S.rotLine = 1
    look(S, ["arcs", "values", "half", "line"])
  }, 2.2),
  watch("why-ac", "So $a$ and $c$ must be the same.", S => {
    resetBeat(S); crossBoard(S)
    only(S, ["C0", "C1", "C2"])
    S.fixed = { C0: BLUE, C1: ORANGE, C2: BLUE }
    S.label = { C0: "a", C1: "b", C2: "c" }
    S.pulse = new Set(["C0", "C2"])
    S.lineTex = `${c(BLUE, "a")} = ${c(BLUE, "c")}`
    S.mode = "rotLine"; S.rotLine = 1
    look(S, ["arcs", "values", "line"])
  }, 2.2),
  {
    id: "cross-q1",
    say: "This one is $70^\\circ$. Find the opposite one.",
    enter: S => {
      resetBeat(S); board(S, "cross"); S.rays = []; S.raysD = []; crossingAt(S, 70)
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { C0: BLUE }, "C2")
      ask(S, [Q, "=", { box: true }], 70, {
        deg: true,
        help: (S2, t) => {
          S2.pulse = new Set(["C0", "C2"])
          if (t >= 2) remind(S2, "\\text{Opposite angles are equal.}")
        },
        onRight: S2 => solved(S2, "C2"),
      })
    },
    done: inputRight,
  },
  {
    id: "cross-q2",
    say: "Now find this one.",
    enter: S => {
      resetBeat(S); board(S, "cross"); S.rays = []; S.raysD = []; crossingAt(S, 70)
      look(S, ["arcs", "values", "line", "keypad"])
      given(S, { C0: BLUE }, "C1")
      ask(S, [Q, "=", { box: true }], 110, {
        deg: true,
        help: (S2, t) => {
          S2.halfIds = ["C0", "C1"]; S2.vis.half.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(70))} + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "C1"),
      })
    },
    done: inputRight,
  },

  // ── 7. Parallel lines ──
  {
    id: "draw-first",
    say: "Draw a straight line.",
    enter: S => {
      resetBeat(S); board(S, "parallel")
      S.lines = []; S.linesD = []; S.rays = []; S.raysD = []
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "line"
      look(S, [])
    },
    done: S => S.lines.length >= 1,
  },
  {
    id: "draw-par",
    say: "Draw a line that will never meet it.",
    enter: S => {
      resetBeat(S); board(S, "parallel"); ensureLine(S)
      S.rays = []; S.raysD = []
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "parallel"
      look(S, [])
    },
    done: S => S.lines.length >= 2,
  },
  watch("parallel", "Lines that never meet are parallel.", S => {
    resetBeat(S); parBoard(S); look(S, [])
  }),
  watch("arrows", "These arrows mean parallel.", S => {
    resetBeat(S); parBoard(S); look(S, ["arrows"])
  }),
  {
    id: "tilt",
    say: "Tilt one line a little.",
    enter: S => { resetBeat(S); parBoard(S); tiltable(S); look(S, []) },
    done: S => !S.drag && S.releases > 0 && tilted(S), free: true, minPlay: 5,
  },
  {
    id: "par-again",
    say: "Make them parallel again.",
    enter: S => {
      resetBeat(S); board(S, "parallel")
      if (S.lines.length < 2) parallelAt(S, 60, { withTrans: false })
      S.lines = S.lines.slice(0, 2); S.linesD = S.linesD.slice(0, 2)
      if (!tilted(S)) tilt(S)
      tiltable(S)
      S.parSnap = 0
      look(S, [])
    },
    done: S => S.locked,
  },

  // ── 8. A line across them ──
  {
    id: "draw-trans",
    say: "Draw a line across both.",
    enter: S => {
      resetBeat(S); parBoard(S)
      S.drewOnce = false
      S.mode = "draw"; S.drawGoal = "trans"
      look(S, ["arrows"])
    },
    done: S => S.lines.length >= 3,
  },
  watch("eight", "That makes eight angles.", S => {
    resetBeat(S); transBoard(S); S.colourMode = "neutral"; look(S, ["arcs", "values", "arrows"])
  }),
  {
    id: "turn-trans",
    say: "Turn the crossing line.",
    enter: S => { resetBeat(S); transBoard(S); S.colourMode = "neutral"; turnAcross(S); look(S, ["arcs", "values", "arrows"]) },
    done: turnedEnough(45), free: true, minPlay: 8,
  },
  {
    id: "guess-sizes",
    say: "Guess: how many different sizes are there?",
    enter: S => {
      resetBeat(S); transBoard(S); S.colourMode = "neutral"
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      ask(S, [{ box: true }], 2, { guess: true })
    },
    done: guessIn,
  },
  watch("two-sizes", "Only two sizes. They add up to $180^\\circ$.", S => {
    resetBeat(S); transBoard(S); S.colourMode = "size"
    S.sum = { ids: ["A0", "A1"], total: 180 }
    look(S, ["arcs", "values", "arrows", "sum"])
  }, 2.4),
  {
    id: "still-two",
    say: "Turn it again. Still only two.",
    enter: S => {
      resetBeat(S); transBoard(S); S.colourMode = "size"; turnAcross(S)
      S.sum = { ids: ["A0", "A1"], total: 180 }
      look(S, ["arcs", "values", "arrows", "sum"])
    },
    done: turnedEnough(20), free: true, minPlay: 6,
  },
  watch("why-two", "Here's why.", S => {
    resetBeat(S); transBoard(S); S.colourMode = "size"
    S.slide = S.time
    look(S, ["arcs", "values", "arrows"])
  }, 4.4),
  watch("copies", "The two crossings are copies.", S => {
    resetBeat(S); transBoard(S); S.colourMode = "size"; turnAcross(S)
    look(S, ["arcs", "values", "arrows", "ghost"])
  }, 2.2),
  {
    id: "tilt-par",
    say: "Tilt one of the parallel lines.",
    enter: S => {
      resetBeat(S); transBoard(S); S.colourMode = "group"; tiltable(S)
      look(S, ["arcs", "values", "ghost"])
    },
    done: S => !S.drag && S.releases > 0 && lineGap(S.lines[0].a, S.lines[1].a) > 3 * RAD, free: true, minPlay: 6,
  },
  watch("only-par", "Only parallel lines make copies.", S => {
    resetBeat(S); board(S, "parallel")
    if (S.lines.length < 3) parallelAt(S, 60)
    if (!tilted(S)) tilt(S)
    S.colourMode = "group"; S.meet = true
    look(S, ["arcs", "values", "ghost"])
  }, 2.2),
  {
    id: "par-again-2",
    say: "Make them parallel again.",
    enter: S => {
      resetBeat(S); board(S, "parallel")
      if (S.lines.length < 3) parallelAt(S, 60)
      if (!tilted(S)) tilt(S)
      S.colourMode = "group"; tiltable(S); S.parSnap = 0
      look(S, ["arcs", "values", "ghost"])
    },
    done: S => S.locked,
  },

  // ── 9. Three pairs ──
  watch("corr", "These are corresponding angles.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A0", "B0"]); S.fixed = { A0: BLUE, B0: BLUE }; S.pulse = new Set(["A0", "B0"])
    look(S, ["arcs", "values", "arrows"])
  }, 2.2),
  watch("corr-f", "They make an F shape. They're equal.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A0", "B0"]); S.fixed = { A0: BLUE, B0: BLUE }
    S.shape = { kind: "F", q: CORR }
    look(S, ["arcs", "values", "arrows", "shape"])
  }, 2.2),
  {
    id: "tap-corr",
    say: "Tap the angle that corresponds to this one.",
    enter: S => {
      resetBeat(S); transBoard(S)
      S.colourMode = "neutral"; S.fixed = { A3: BLUE }; S.pulse = new Set(["A3"])
      look(S, ["arcs", "arrows"])
      const F = (S2: Scene) => { S2.shape = { kind: "F", q: [3, 3] }; S2.vis.shape.t = 1 }
      tapOne(S, "B3", ["B0", "B1", "B2", "B3"], (S2, _id, t) => {
        if (t === 1) say(S2, "Corresponding angles make an F shape.")
        else F(S2)
      }, F)
    },
    done: tapped("B3"),
  },
  watch("alt", "These are alternate angles.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A1", "B3"]); S.fixed = { A1: BLUE, B3: BLUE }; S.pulse = new Set(["A1", "B3"])
    look(S, ["arcs", "values", "arrows"])
  }, 2.2),
  watch("alt-z", "They make a Z shape. They're equal.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A1", "B3"]); S.fixed = { A1: BLUE, B3: BLUE }
    S.shape = { kind: "Z", q: ALT }
    look(S, ["arcs", "values", "arrows", "shape"])
  }, 2.2),
  {
    id: "tap-alt",
    say: "Tap the angle alternate to this one.",
    enter: S => {
      resetBeat(S); transBoard(S)
      S.colourMode = "neutral"; S.fixed = { A2: BLUE }; S.pulse = new Set(["A2"])
      look(S, ["arcs", "arrows"])
      const Z = (S2: Scene) => { S2.shape = { kind: "Z", q: [2, 0] }; S2.vis.shape.t = 1 }
      tapOne(S, "B0", ["B0", "B1", "B2", "B3"], (S2, _id, t) => {
        if (t === 1) say(S2, "Alternate angles make a Z shape.")
        else Z(S2)
      }, Z)
    },
    done: tapped("B0"),
  },
  watch("alt-why-1", "Why? These two are corresponding.", S => {
    resetBeat(S); transBoard(S)
    only(S, ["A2", "B2"]); S.fixed = { A2: BLUE, B2: BLUE }
    S.shape = { kind: "F", q: [2, 2] }
    look(S, ["arcs", "values", "arrows", "shape"])
  }, 2.2),
  watch("alt-why-2", "And these two are vertically opposite.", S => {
    resetBeat(S); transBoard(S)
    only(S, ["A2", "B2", "B0"]); S.fixed = { A2: BLUE, B2: BLUE, B0: BLUE }
    S.pulse = new Set(["B2", "B0"])
    look(S, ["arcs", "values", "arrows"])
  }, 2.2),
  watch("alt-why-3", "So alternate angles are equal.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A2", "B0"]); S.fixed = { A2: BLUE, B0: BLUE }
    S.shape = { kind: "Z", q: [2, 0] }
    look(S, ["arcs", "values", "arrows", "shape"])
  }, 2.2),
  watch("coi", "These are co-interior angles.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A1", "B0"]); S.colourMode = "size"; S.pulse = new Set(["A1", "B0"])
    look(S, ["arcs", "values", "arrows"])
  }, 2.2),
  watch("coi-c", "They make a C shape. They add up to $180^\\circ$.", S => {
    resetBeat(S); transBoard(S); turnAcross(S)
    only(S, ["A1", "B0"]); S.colourMode = "size"
    S.shape = { kind: "C", q: COI }
    S.sum = { ids: ["A1", "B0"], total: 180 }
    look(S, ["arcs", "values", "arrows", "shape", "sum"])
  }, 2.6),
  {
    id: "tap-coi",
    say: "Tap the angle co-interior to this one.",
    enter: S => {
      resetBeat(S); transBoard(S)
      S.colourMode = "neutral"; S.fixed = { A2: BLUE }; S.pulse = new Set(["A2"])
      look(S, ["arcs", "arrows"])
      const C = (S2: Scene) => { S2.shape = { kind: "C", q: [2, 3] }; S2.vis.shape.t = 1 }
      tapOne(S, "B3", ["B0", "B1", "B2", "B3"], (S2, _id, t) => {
        if (t === 1) say(S2, "Co-interior angles make a C shape.")
        else C(S2)
      }, C)
    },
    done: tapped("B3"),
  },
  pairQuiz("quiz-1", [1, 3], 1),
  pairQuiz("quiz-2", [2, 3], 2),
  pairQuiz("quiz-3", [1, 1], 0),
  {
    id: "rules-hold",
    say: "Turn the crossing line. The rules still hold.",
    enter: S => { resetBeat(S); transBoard(S); S.colourMode = "size"; turnAcross(S); look(S, ["arcs", "values", "arrows"]) },
    done: turnedEnough(20), free: true, minPlay: 6,
  },

  // ── 10. Using them ──
  {
    id: "par-q1",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); transBoard(S, 65)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      given(S, { A0: BLUE }, "B0")
      ask(S, [Q, "=", { box: true }], 65, {
        deg: true,
        help: (S2, t) => {
          S2.shape = { kind: "F", q: CORR }; S2.vis.shape.t = 1
          if (t >= 2) remind(S2, "\\text{Corresponding angles are equal.}")
        },
        onRight: S2 => solved(S2, "B0"),
      })
    },
    done: inputRight,
  },
  {
    id: "par-q2",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); transBoard(S, 65)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      given(S, { A2: BLUE }, "B0")
      ask(S, [Q, "=", { box: true }], 65, {
        deg: true,
        help: (S2, t) => {
          S2.shape = { kind: "Z", q: [2, 0] }; S2.vis.shape.t = 1
          if (t >= 2) remind(S2, "\\text{Alternate angles are equal.}")
        },
        onRight: S2 => solved(S2, "B0"),
      })
    },
    done: inputRight,
  },
  {
    id: "par-q3",
    say: "Find the missing angle.",
    enter: S => {
      resetBeat(S); transBoard(S, 65)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      given(S, { B0: BLUE }, "A1")
      ask(S, [Q, "=", { box: true }], 115, {
        deg: true,
        help: (S2, t) => {
          S2.shape = { kind: "C", q: COI }; S2.vis.shape.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(65))} + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "A1"),
      })
    },
    done: inputRight,
  },
  {
    id: "par-x1",
    say: "Find $x$.",
    enter: S => {
      resetBeat(S); transBoard(S, 72)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      given(S, { A0: BLUE }, "B1", "x")
      ask(S, ["x =", { box: true }], 108, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "B0"); S2.fixed.B0 = BLUE
          if (t === 1) { S2.shape = { kind: "F", q: CORR }; S2.vis.shape.t = 1 }
          if (t >= 2) {
            S2.vis.shape.t = 0
            S2.halfIds = ["B0", "B1"]; S2.vis.half.t = 1
            remind(S2, `${c(BLUE, deg(72))} + ${c(PINK, "x")} = ${c(GREEN, deg(180))}`)
          }
        },
        onRight: S2 => solved(S2, "B1"),
      })
    },
    done: inputRight,
  },
  {
    id: "par-x2",
    say: "Find $x$.",
    enter: S => {
      resetBeat(S); transBoard(S, 65)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      given(S, { A3: BLUE }, "B0", "x")
      ask(S, ["x =", { box: true }], 65, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "A1"); S2.fixed.A1 = BLUE
          if (t === 1) S2.pulse = new Set(["A3", "A1"])
          if (t >= 2) {
            S2.pulse = new Set(["B0"])
            S2.shape = { kind: "C", q: COI }; S2.vis.shape.t = 1
            remind(S2, `${c(BLUE, deg(115))} + ${c(PINK, "x")} = ${c(GREEN, deg(180))}`)
          }
        },
        onRight: S2 => solved(S2, "B0"),
      })
    },
    done: inputRight,
  },
  {
    id: "exam-p",
    say: "Three parallel lines, crossed by two more. Find $p$.",
    enter: S => {
      resetBeat(S)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      examBoard(S)
      S.fixed = { G: BLUE, D: NEUTRAL, p: PINK, q: NEUTRAL }
      S.label = { p: "p", q: "q" }
      S.pulse = new Set(["p"])
      ask(S, ["p =", { box: true }], 68, {
        deg: true,
        help: (S2, t) => {
          S2.shape = { kind: "C", q: COI, on: [0, 1, 3] }; S2.vis.shape.t = 1
          if (t >= 2) remind(S2, `${c(BLUE, deg(112))} + ${c(PINK, "p")} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "p"),
      })
    },
    done: inputRight,
  },
  {
    id: "exam-q",
    say: "Now find $q$.",
    enter: S => {
      resetBeat(S)
      look(S, ["arcs", "values", "arrows", "line", "keypad"])
      examBoard(S)
      S.fixed = { G: BLUE, D: NEUTRAL, p: BLUE, q: PINK }
      S.label = { q: "q" }
      S.pulse = new Set(["q"])
      ask(S, ["q =", { box: true }], 68, {
        deg: true,
        help: (S2, t) => {
          S2.shape = { kind: "F", q: CORR, on: [1, 2, 3] }; S2.vis.shape.t = 1
          if (t >= 2) remind(S2, "\\text{Corresponding angles are equal.}")
        },
        onRight: S2 => solved(S2, "q"),
      })
    },
    done: inputRight,
  },
  {
    id: "make-70",
    say: "Make all eight angles $70^\\circ$ or $110^\\circ$.",
    enter: S => {
      resetBeat(S); transBoard(S)
      if (Math.abs(lineGap(S.lines[2].a, S.lines[0].a) / RAD - 70) < 12) setTransAcute(S, 50)
      S.colourMode = "size"; turnAcross(S); S.magnet = 70
      look(S, ["arcs", "values", "arrows"])
    },
    done: S => S.locked,
  },
  {
    id: "make-45",
    say: "Now make them $45^\\circ$ and $135^\\circ$.",
    enter: S => {
      resetBeat(S); transBoard(S)
      if (Math.abs(lineGap(S.lines[2].a, S.lines[0].a) / RAD - 45) < 12) setTransAcute(S, 70)
      S.colourMode = "size"; turnAcross(S); S.magnet = 45
      look(S, ["arcs", "values", "arrows"])
    },
    done: S => S.locked,
  },

  // ── 11. One you can't do ──
  {
    id: "make-100",
    say: "Make these co-interior angles $100^\\circ$ and $100^\\circ$.",
    enter: S => {
      resetBeat(S); transBoard(S)
      only(S, ["A1", "B0"]); S.colourMode = "size"; turnAcross(S)
      S.shape = { kind: "C", q: COI }
      look(S, ["arcs", "values", "arrows", "shape"])
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    resetBeat(S); transBoard(S)
    only(S, ["A1", "B0"]); S.colourMode = "size"
    look(S, ["arcs", "values", "arrows"])
  }),
  watch("not-parallel", "The lines would stop being parallel.", S => {
    resetBeat(S); transBoard(S, 80)
    only(S, ["A1", "B0"]); S.fixed = { A1: BLUE, B0: BLUE }
    S.meet = true
    const a = S.lines[0].a
    S.tween = { i: 1, from: a, to: a + 20 * RAD, start: S.time + 0.7, dur: 2.4 }
    look(S, ["arcs", "values"])
  }, 3.6),
  watch("adds-200", "These angles add up to $200^\\circ$.", S => {
    resetBeat(S); transBoard(S, 80)
    S.lines[1] = { ...S.lines[1], a: S.lines[0].a + 20 * RAD }
    only(S, ["A1", "B0"]); S.fixed = { A1: BLUE, B0: BLUE }
    S.meet = true
    S.sum = { ids: ["A1", "B0"], total: 200 }
    look(S, ["arcs", "values", "sum"])
  }, 2.4),
  {
    id: "par-again-3",
    say: "Make them parallel again.",
    enter: S => {
      resetBeat(S); board(S, "parallel")
      if (S.lines.length < 3) parallelAt(S, 80)
      if (!tilted(S)) S.lines[1] = { ...S.lines[1], a: S.lines[0].a + 20 * RAD }
      only(S, ["A1", "B0"]); S.colourMode = "size"
      tiltable(S); S.tilt = { base: S.lines[0].a, max: 24 * RAD }; S.parSnap = 0
      look(S, ["arcs", "values"])
    },
    done: S => S.locked,
  },
  watch("always-180", "Co-interior angles always add up to $180^\\circ$.", S => {
    resetBeat(S); transBoard(S)
    only(S, ["A1", "B0"]); S.colourMode = "size"; turnAcross(S)
    S.shape = { kind: "C", q: COI }
    S.sum = { ids: ["A1", "B0"], total: 180 }
    look(S, ["arcs", "values", "arrows", "shape", "sum"])
  }, 2.6),
  {
    id: "end",
    say: "Turn it any way. Only two sizes, always.",
    enter: S => { resetBeat(S); transBoard(S); S.colourMode = "size"; turnAcross(S); look(S, ["arcs", "values", "arrows"]) },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]
