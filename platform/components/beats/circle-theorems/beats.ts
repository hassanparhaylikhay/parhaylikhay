/**
 * Circle theorems I, one tiny idea per beat. The student draws a circle
 * with a compass, names its parts, finds that the angle in a semicircle is
 * always 90°, that angles in the same segment are equal, and that the angle
 * at the centre is twice the angle at the circumference. A proof by tearing
 * (the isosceles triangle's base angles fill the angle at the centre) then
 * explains all three, and the lesson ends on two numbers that cannot both
 * be true.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold. The student's circle, diameter and points carry through until
 * a question needs a set figure; then the points glide there.
 */

import {
  type Scene, type EqPart, type VisKey, type AngSpec,
  BLUE, ORANGE, PINK, GREEN, NEUTRAL,
  resetBeat, show, say, startInput, ensureCircle, place, setSegs, layout, insc, triVals, arcDeg, sameSide, joined,
  angOf, turn, RAD,
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
  /** Milliseconds a finished doing beat waits before moving on (default 1800). */
  advanceAfter?: number
  restart?: boolean
  /** "Show me how": the worked solution, one step at a time, for a student who is stuck */
  walk?: WalkStep[]
}

export interface WalkStep {
  /** what the teacher says at this step */
  say: string
  /** the line of working under the figure */
  tex?: string
  /** what lights up or appears on the figure */
  show?: (S: Scene) => void
}

const deg = (n: number) => `${n}^\\circ`
const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
const Q = c(PINK, "?")

// ── small builders ───────────────────────────────────────────────────────

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

const inputRight = (S: Scene) => S.input?.state === "right"
const guessIn = (S: Scene) => S.input?.state === "right" || S.input?.state === "guessed"
const movedBy = (name: string, d: number) => (S: Scene) => !S.drag && (S.movedBy[name] ?? 0) >= d

function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

/** Start a beat: clean the board down, keep the student's circle. */
function base(S: Scene, letters: string[] = ["O"]) {
  resetBeat(S)
  ensureCircle(S)
  S.derived = {}
  S.letters = new Set(letters)
}

function ask(S: Scene, parts: EqPart[], answer: number, opts: { deg?: boolean; guess?: boolean; onRight?: (S: Scene) => void; help?: (S: Scene, tries: number) => void } = {}) {
  startInput(S, { parts, answer, hints: [], deg: opts.deg, guess: opts.guess, onRight: opts.onRight, help: opts.help })
}

/** A reminder line under the equation, never the worked answer. */
function remind(S: Scene, tex: string) {
  if (S.input) S.input.hints = [tex]
}

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

/** The two points an angle is made from glow, and the lines from them. */
function madeFrom(S: Scene, pts: string[], segs: string[]) {
  S.pulsePts = new Set(pts)
  S.pulseSegs = new Set(segs)
}

/** Show the true value where the "?" was (the walkthrough's last step). */
function uncover(S: Scene, id: string) {
  delete S.label[id]
  S.pulse = new Set([id])
}

/** Tap the two points an angle is made from. */
function tapTwo(S: Scene, want: string[], wrong: Record<string, string>) {
  S.mode = "tapPts"
  S.onTapPt = (S2, n) => {
    if (want.includes(n)) {
      if (!S2.got.has(n)) { S2.got.add(n); S2.pulsePts.add(n); S2.note = null }
      return
    }
    say(S2, wrong[n] ?? "Follow the angle's two lines.")
  }
}
const tappedAll = (want: string[]) => (S: Scene) => want.every(n => S.got.has(n))

function solved(S: Scene, id: string) {
  delete S.label[id]
  S.fixed[id] = GREEN
  S.pulse = new Set()
}

// angles, by what they are
const atCirc = (id: string, V: string, X = "A", Y = "B", extra: Partial<AngSpec> = {}): AngSpec =>
  ({ id, at: V, from: X, to: Y, value: S => insc(S, V, X, Y), ...extra })
const atCentre = (V: string, id = "C0", X = "A", Y = "B", extra: Partial<AngSpec> = {}): AngSpec =>
  ({ id, at: "O", from: X, to: Y, avoid: V, value: S => 2 * insc(S, V, X, Y), ...extra })
/** One angle of triangle VXY in the circle (they add to exactly 180). */
const inTri = (id: string, at: string, V: string, X: string, Y: string, extra: Partial<AngSpec> = {}): AngSpec => {
  const others = [V, X, Y].filter(n => n !== at)
  return { id, at, from: others[0], to: others[1], value: S => triVals(S, V, X, Y)[at], ...extra }
}

/** Live: the angle at the centre is twice the angle at P. */
const twiceLine = (S: Scene) => {
  const p = insc(S, "P", "A", "B")
  return `${c(ORANGE, deg(2 * p))} = 2 \\times ${c(BLUE, deg(p))}`
}

/** The middle of the widest gap between these points. */
function widestGap(S: Scene, names: string[]): number {
  const as = names.map(n => ((angOf(S, n, false) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((p, q) => p - q)
  let best = as[0] ?? 0, gap = -1
  as.forEach((x, k) => { const nx = k + 1 < as.length ? as[k + 1] : as[0] + Math.PI * 2; if (nx - x > gap) { gap = nx - x; best = x + (nx - x) / 2 } })
  return best
}

/** The student's diameter, or one across the middle for a cold open. */
function ensureDiam(S: Scene) {
  const ok = S.pts.A !== undefined && S.pts.B !== undefined && Math.abs(turn(S.pts.A + Math.PI, S.pts.B)) < 0.02
  if (!ok) place(S, { A: 180, B: 0 })
}

/** P on the circle, away from A and B. */
function ensureP(S: Scene) {
  const ok = S.pts.P !== undefined && Math.abs(turn(S.pts.P, S.pts.A)) > 0.2 && Math.abs(turn(S.pts.P, S.pts.B)) > 0.2
  if (!ok) S.pts.P = S.pts.A + 110 * RAD
  if (S.ptsD.P === undefined) S.ptsD.P = S.pts.P
}

/** A chord AB (not a diameter) with P in one of its segments; the student's if it is usable. */
function ensureChord(S: Scene) {
  const has = S.pts.A !== undefined && S.pts.B !== undefined && S.pts.P !== undefined
  const ok = has && Math.abs(turn(S.pts.A + Math.PI, S.pts.B)) > 10 * RAD
    && Math.abs(turn(S.pts.P, S.pts.A)) > 10 * RAD && Math.abs(turn(S.pts.P, S.pts.B)) > 10 * RAD
    && arcDeg(S, "A", "B", "P") > 24
  if (!ok) place(S, { A: 160, B: 40, P: -100 })
}

/** P in the bigger segment of a comfortable chord, for the angle at the centre. */
function ensureMajor(S: Scene) {
  ensureChord(S)
  const arc = arcDeg(S, "A", "B", "P")
  if (arc < 50 || arc > 150) place(S, { A: 150, B: 50, P: -95 })
}

// ── the beats ────────────────────────────────────────────────────────────

const FIGURE_TAPS: Record<string, { say: string; answer: string; wrong: Record<string, string> }> = {
  radius: { say: "Tap a radius.", answer: "OT", wrong: { AB: "That's the diameter: two radii in a line.", EF: "That's a chord. It misses the centre." } },
  chord: { say: "Tap the chord.", answer: "EF", wrong: { OT: "That's a radius.", AB: "That's the diameter. It goes through $O$." } },
  diameter: { say: "Tap the diameter.", answer: "AB", wrong: { OT: "That's a radius.", EF: "That's a chord. It misses the centre." } },
}

/** The radius, the chord and the diameter together, for tapping. */
function partsFigure(S: Scene) {
  ensureDiam(S)
  if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
  S.pts.T = widestGap(S, ["A", "B", "E", "F"])
  if (S.ptsD.T === undefined) S.ptsD.T = S.pts.T
  S.showPts = ["A", "B", "E", "F", "T"]
  setSegs(S, [["A", "B"], ["E", "F"], ["O", "T"]])
}

const tapPart = (key: keyof typeof FIGURE_TAPS): Beat => {
  const t = FIGURE_TAPS[key]
  return {
    id: `tap-${key}`,
    say: t.say,
    enter: S => {
      base(S, [])
      partsFigure(S)
      look(S, [])
      S.mode = "tapLine"
      S.onTapLine = (S2, id) => {
        if (S2.got.size) return
        if (id === t.answer) { S2.got.add(id); S2.segColour[id] = GREEN; S2.note = null; return }
        say(S2, t.wrong[id] ?? "Not that one.")
      }
    },
    done: S => S.got.size > 0,
  }
}

export const BEATS: Beat[] = [
  // ── 1. Your circle ──
  {
    id: "place",
    say: "Tap to place the centre.",
    enter: S => {
      resetBeat(S)
      S.O = null; S.OD = null; S.drawn = false; S.sweep = null; S.R = 0; S.RD = 0
      S.pts = {}; S.ptsD = {}; S.showPts = []; S.segs = []; S.letters = new Set(); S.derived = {}
      S.mode = "place"
      look(S, [])
    },
    done: S => S.O !== null,
    advanceAfter: 700,
  },
  {
    id: "compass",
    say: "Now drag out to draw your circle.",
    enter: S => {
      resetBeat(S)
      const L = layout(S)
      if (!S.O) { S.O = [L.centre[0], L.centre[1]]; S.OD = [L.centre[0], L.centre[1]] }
      S.drawn = false; S.sweep = null; S.R = 0; S.RD = 0
      S.showPts = []; S.segs = []; S.letters = new Set()
      S.drewOnce = false
      S.mode = "compass"
      look(S, [])
    },
    done: S => S.drawn,
    advanceAfter: 900,
  },
  watch("centre", "This point is the centre, $O$.", S => {
    base(S); S.showPts = []; S.segs = []
    look(S, ["letters"])
  }),
  {
    id: "radius-play",
    say: "Drag this point round the circle.",
    enter: S => {
      base(S)
      if (S.pts.T === undefined) place(S, { T: -40 })
      S.showPts = ["T"]; setSegs(S, [["O", "T"]])
      S.movable = ["T"]; S.mode = "slide"
      look(S, ["letters"])
    },
    done: movedBy("T", 150), free: true, minPlay: 6,
  },
  watch("same-distance", "It always stays the same distance from $O$.", S => {
    base(S)
    if (S.pts.T === undefined) place(S, { T: -40 })
    S.showPts = ["T"]; setSegs(S, [["O", "T"]])
    S.pulseSegs = new Set(["OT"])
    S.movable = ["T"]; S.mode = "slide"
    look(S, ["letters"])
  }),
  watch("radius", "That distance is the radius.", S => {
    base(S)
    if (S.pts.T === undefined) place(S, { T: -40 })
    S.showPts = ["T"]; setSegs(S, [["O", "T"]])
    S.label["seg:OT"] = "r"
    S.movable = ["T"]; S.mode = "slide"
    look(S, ["letters"])
  }),

  // ── 2. Parts of a circle ──
  {
    id: "draw-diameter",
    say: "Draw a line across the circle, through $O$.",
    enter: S => {
      base(S); S.showPts = []; S.segs = []
      S.drewOnce = false
      S.mode = "drawDiam"
      look(S, ["letters"])
    },
    done: S => S.segs.some(s => s.id === "AB"),
  },
  watch("diameter", "That's a diameter. It's two radii in a line.", S => {
    base(S, []); ensureDiam(S)
    S.showPts = ["A", "B"]
    setSegs(S, [["A", "B"], ["O", "A"], ["O", "B"]])
    S.segColour = { OA: BLUE, OB: ORANGE }
    S.ticks = ["OA", "OB"]
    look(S, ["ticks"])
  }, 2.2),
  {
    id: "draw-chord",
    say: "Now draw a line across that misses $O$.",
    enter: S => {
      base(S); ensureDiam(S)
      S.showPts = ["A", "B"]; setSegs(S, [["A", "B"]])
      S.drewOnce = false
      S.mode = "drawChord"
      look(S, ["letters"])
    },
    done: S => S.segs.some(s => s.id === "EF"),
  },
  watch("chord", "A line joining two points on the circle is a chord.", S => {
    base(S, []); ensureDiam(S)
    if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
    S.showPts = ["A", "B", "E", "F"]; setSegs(S, [["A", "B"], ["E", "F"]])
    S.pulseSegs = new Set(["EF"])
    look(S, [])
  }, 2.2),
  watch("circumference", "The circle itself is the circumference.", S => {
    base(S, []); ensureDiam(S)
    if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
    S.showPts = ["A", "B", "E", "F"]; setSegs(S, [["A", "B"], ["E", "F"]])
    S.pulseCircle = true
    look(S, [])
  }, 2.2),
  watch("two-parts", "A chord cuts the circle into two parts.", S => {
    base(S, [])
    if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
    S.showPts = ["E", "F"]; setSegs(S, [["E", "F"]])
    S.tints = [{ a: "E", b: "F", side: "minor", color: BLUE }, { a: "E", b: "F", side: "major", color: ORANGE }]
    look(S, ["tints"])
  }),
  watch("segment", "Each part is a segment.", S => {
    base(S, [])
    if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
    S.showPts = ["E", "F"]; setSegs(S, [["E", "F"]])
    S.tints = [{ a: "E", b: "F", side: "minor", color: BLUE }, { a: "E", b: "F", side: "major", color: ORANGE }]
    look(S, ["tints"])
  }),
  {
    id: "tap-segment",
    say: "Tap the smaller segment.",
    enter: S => {
      base(S, [])
      if (S.pts.E === undefined || S.pts.F === undefined) place(S, { E: 25, F: 115 })
      S.showPts = ["E", "F"]; setSegs(S, [["E", "F"]])
      S.tints = [{ a: "E", b: "F", side: "minor", color: BLUE }, { a: "E", b: "F", side: "major", color: ORANGE }]
      S.mode = "tapRegion"
      S.regionChord = ["E", "F"]
      S.onTapRegion = (S2, side) => {
        if (S2.got.size) return
        if (side === "minor") {
          S2.got.add("minor")
          S2.tints = [{ a: "E", b: "F", side: "minor", color: GREEN }, { a: "E", b: "F", side: "major", color: ORANGE }]
          S2.note = null
          return
        }
        say(S2, "That's the bigger one.")
      }
      look(S, ["tints"])
    },
    done: S => S.got.has("minor"),
  },
  tapPart("radius"),
  tapPart("chord"),
  tapPart("diameter"),

  // ── 3. Angle in a semicircle ──
  watch("ends", "Here's your diameter. Its ends are $A$ and $B$.", S => {
    base(S, ["A", "B", "O"]); ensureDiam(S)
    S.showPts = ["A", "B"]; setSegs(S, [["A", "B"]])
    look(S, ["letters"])
  }),
  {
    id: "put-P",
    say: "Tap the circle to put a point $P$ on it.",
    enter: S => {
      base(S, ["A", "B", "O"]); ensureDiam(S)
      S.showPts = ["A", "B"]; setSegs(S, [["A", "B"]])
      S.mode = "tapPoint"; S.tapName = "P"
      look(S, ["letters"])
    },
    done: S => S.showPts.includes("P"),
  },
  {
    id: "join-P",
    say: "Join $P$ to $A$ and to $B$.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"]])
      S.joinNeed = [["P", "A"], ["P", "B"]]
      S.joinHint = "Join $P$ to $A$, then $P$ to $B$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters"])
    },
    done: joined,
  },
  watch("angle-P", "There's an angle at $P$.", S => {
    base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
    S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
    S.angles = [atCirc("P", "P")]
    look(S, ["letters", "arcs", "values"])
  }),
  watch("arms", "Its two lines go to $A$ and $B$.", S => {
    base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
    S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
    S.angles = [atCirc("P", "P")]
    madeFrom(S, ["A", "B"], ["PA", "PB"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("made-from", "We say the angle is made from $A$ and $B$.", S => {
    base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
    S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
    S.angles = [atCirc("P", "P")]
    madeFrom(S, ["A", "B"], [])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "move-P-90",
    say: "Move $P$ round the circle. Watch the angle.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      // either side of the diameter is a semicircle, so P may go anywhere
      S.movable = ["P"]; S.crossOK = new Set(["P"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("P", 120), free: true, minPlay: 8,
  },
  {
    id: "try-break",
    say: "Try to make it smaller than $90^\\circ$.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.movable = ["P"]; S.crossOK = new Set(["P"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    cta: "I can't", ctaAfter: 8,
  },
  watch("semicircle", "You can't. The angle in a semicircle is $90^\\circ$.", S => {
    base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
    S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
    S.angles = [atCirc("P", "P")]
    S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]
    S.movable = ["P"]; S.crossOK = new Set(["P"]); S.mode = "slide"
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.2),
  {
    id: "move-A",
    say: "Move $A$. $B$ stays opposite it.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.movable = ["A"]; S.diamLock = true; S.crossOK = new Set(["A", "B"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("A", 50), free: true, minPlay: 6,
  },
  {
    id: "semi-q",
    say: "Find the missing angle.",
    enter: S => {
      base(S, ["A", "B", "P", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 180, B: 0, P: -70 })
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [inTri("tA", "A", "P", "A", "B"), inTri("tB", "B", "P", "A", "B"), inTri("tP", "P", "P", "A", "B")]
      given(S, { tA: BLUE }, "tB")
      ask(S, [Q, "=", { box: true }], 55, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "tP"); S2.fixed.tP = NEUTRAL; S2.pulse = new Set(["tP", "tB"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(35))} + ${Q} + 90^\\circ = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "tB"),
      })
    },
    done: inputRight,
    walk: semiWalk(35, 55),
  },

  // ── 4. Angles in the same segment ──
  {
    id: "off-diameter",
    say: "Now move $B$ off the diameter.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureDiam(S); ensureP(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.movable = ["B"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => !S.drag && Math.abs(turn(S.pts.A + Math.PI, S.pts.B)) > 15 * RAD,
  },
  {
    id: "chord-P",
    say: "$AB$ is a chord now. Move $P$. What happens to the angle?",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureChord(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.movable = ["P"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("P", 100), free: true, minPlay: 8,
  },
  watch("stays", "It stays the same.", S => {
    base(S, ["A", "B", "P", "O"]); ensureChord(S)
    S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
    S.angles = [atCirc("P", "P")]
    S.pulse = new Set(["P"])
    S.movable = ["P"]; S.mode = "slide"
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "B-then-P",
    say: "Move $B$, then move $P$ again.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureChord(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.movable = ["B", "P"]; S.arcLimit = { min: 24, max: 336 }; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => movedBy("B", 20)(S) && movedBy("P", 50)(S), free: true, minPlay: 8,
  },
  watch("meet-Q", "Here's a second point, $Q$.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S)
    placeQ(S)
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "tap-Q-points",
    say: "Tap the two points $Q$'s angle is made from.",
    enter: S => {
      base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
      S.showPts = ["A", "B", "P", "Q"]
      setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
      S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
      S.pulse = new Set(["Q"])
      tapTwo(S, ["A", "B"], { P: "That's $P$. Follow $Q$'s two lines.", Q: "That's the corner. Follow its two lines." })
      look(S, ["letters", "arcs", "values"])
    },
    done: tappedAll(["A", "B"]),
  },
  watch("same-two", "$P$'s angle is made from the same two points.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
    madeFrom(S, ["A", "B"], ["PA", "PB", "QA", "QB"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "move-Q",
    say: "Move $Q$. Compare it with $P$.",
    enter: S => {
      base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
      S.showPts = ["A", "B", "P", "Q"]
      setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
      S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
      // Q may pass P, but not A or B: past them it would be in the other segment
      S.movable = ["Q"]; S.passable = new Set(["P"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("Q", 80), free: true, minPlay: 6,
  },
  watch("same-seg", "$P$ and $Q$ are in the same segment.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
    S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]
    look(S, ["letters", "arcs", "values", "tints"])
  }),
  watch("same-seg-rule", "Angles in the same segment are equal.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
    S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]
    S.pulse = new Set(["P", "Q"])
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.2),
  watch("same-two-rule", "Both angles must be made from the same two points.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
    S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]
    madeFrom(S, ["A", "B"], ["PA", "PB", "QA", "QB"])
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.4),
  {
    id: "Q-across",
    say: "Now move $Q$ into the other segment.",
    enter: S => {
      base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S); placeQ(S)
      S.showPts = ["A", "B", "P", "Q"]
      setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
      S.angles = [atCirc("P", "P"), atCirc("Q", "Q", "A", "B", { colour: qColour })]
      S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]
      S.movable = ["Q"]; S.crossOK = new Set(["Q"]); S.passable = new Set(["P"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values", "tints"])
    },
    done: S => !S.drag && !sameSide(S, "A", "B", "P", "Q"),
  },
  watch("other-seg", "In the other segment, the angle is different.", S => {
    base(S, ["A", "B", "P", "Q", "O"]); ensureChord(S)
    if (sameSide(S, "A", "B", "P", "Q") || S.pts.Q === undefined) S.pts.Q = midArc(S, "A", "B", "P", false)
    if (S.ptsD.Q === undefined) S.ptsD.Q = S.pts.Q
    S.showPts = ["A", "B", "P", "Q"]
    setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
    S.angles = [atCirc("P", "P"), atCirc("Q", "Q", "A", "B", { colour: qColour })]
    S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }, { a: "A", b: "B", side: "Q", color: NEUTRAL }]
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.2),
  {
    id: "seg-q",
    say: "Find the missing angle.",
    enter: S => {
      base(S, ["A", "B", "P", "Q", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 128, B: 52, P: -150, Q: -40 })
      S.showPts = ["A", "B", "P", "Q"]
      setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"]])
      S.angles = [atCirc("P", "P"), atCirc("Q", "Q")]
      given(S, { P: BLUE }, "Q")
      ask(S, [Q, "=", { box: true }], 38, {
        deg: true,
        help: (S2, t) => {
          S2.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]; S2.vis.tints.t = 1
          S2.pulse = new Set(["P", "Q"])
          if (t >= 2) remind(S2, "\\text{Angles in the same segment are equal.}")
        },
        onRight: S2 => solved(S2, "Q"),
      })
    },
    done: inputRight,
    walk: segmentWalk("P", "Q", 38),
  },

  // ── 5. Angle at the centre ──
  {
    id: "join-centre",
    say: "Join $A$ and $B$ to the centre.",
    enter: S => {
      base(S, ["A", "B", "P", "O"]); ensureMajor(S)
      S.showPts = ["A", "B", "P"]; setSegs(S, [["P", "A"], ["P", "B"]])
      S.angles = [atCirc("P", "P")]
      S.joinNeed = [["O", "A"], ["O", "B"]]
      S.joinHint = "Join $A$ to $O$, then $B$ to $O$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters", "arcs", "values"])
    },
    done: joined,
  },
  watch("centre-angle", "This is the angle at the centre.", S => {
    centreBoard(S)
    S.pulse = new Set(["C0"])
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "tap-O-points",
    say: "Tap the two points it's made from.",
    enter: S => {
      centreBoard(S)
      S.pulse = new Set(["C0"])
      tapTwo(S, ["A", "B"], { P: "That's $P$. Follow the lines from $O$." })
      look(S, ["letters", "arcs", "values"])
    },
    done: tappedAll(["A", "B"]),
  },
  watch("circ-angle", "The angle at $P$ is the angle at the circumference.", S => {
    centreBoard(S)
    S.pulse = new Set(["P"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("both-from", "Both angles are made from $A$ and $B$.", S => {
    centreBoard(S)
    madeFrom(S, ["A", "B"], ["PA", "PB", "OA", "OB"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "move-B-both",
    say: "Move $B$. Watch both angles.",
    enter: S => {
      centreBoard(S)
      S.movable = ["B"]; S.arcLimit = { min: 24, max: 170 }; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("B", 40), free: true, minPlay: 8,
  },
  {
    id: "guess-twice",
    say: "Guess: the centre angle is how many times the angle at $P$?",
    enter: S => {
      centreBoard(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      ask(S, [{ box: true }], 2, { guess: true })
    },
    done: guessIn,
  },
  watch("twice", "It's twice the angle at $P$.", S => {
    centreBoard(S)
    S.lineFn = twiceLine
    look(S, ["letters", "arcs", "values", "line"])
  }),
  {
    id: "still-twice",
    say: "Move $B$ and $P$. Still twice?",
    enter: S => {
      centreBoard(S)
      S.lineFn = twiceLine
      S.movable = ["B", "P"]; S.arcLimit = { min: 24, max: 170 }; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: S => !S.drag && S.moved >= 100, free: true, minPlay: 6,
  },
  watch("centre-rule", "The angle at the centre is twice the angle at the circumference.", S => {
    centreBoard(S)
    S.lineFn = twiceLine
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  watch("centre-same-two", "Both must be made from the same two points.", S => {
    centreBoard(S)
    S.lineFn = twiceLine
    madeFrom(S, ["A", "B"], ["PA", "PB", "OA", "OB"])
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.2),
  {
    id: "into-minor",
    say: "Move $P$ into the small segment.",
    enter: S => {
      centreBoard(S)
      // room in the small segment to put P
      if (arcDeg(S, "A", "B", "P") < 95) S.pts.B = S.pts.A + Math.sign(turn(S.pts.A, S.pts.B) || 1) * 110 * RAD
      S.lineFn = twiceLine
      S.movable = ["P"]; S.crossOK = new Set(["P"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: S => !S.drag && arcDeg(S, "A", "B", "P") > 180,
  },
  watch("reflex", "Now the centre angle is the reflex one. Still twice.", S => {
    centreBoard(S, false)
    if (arcDeg(S, "A", "B", "P") <= 180) place(S, { A: 145, B: 35, P: 95 })
    S.lineFn = twiceLine
    S.movable = ["P"]; S.mode = "slide"
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  {
    id: "centre-q1",
    say: "Find the angle at the centre.",
    enter: S => {
      centreBoard(S, false)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 132, B: 48, P: -100 })
      given(S, { P: BLUE }, "C0")
      ask(S, [Q, "=", { box: true }], 84, {
        deg: true,
        help: (S2, t) => {
          S2.pulse = new Set(["P", "C0"])
          if (t >= 2) remind(S2, `${Q} = 2 \\times ${c(BLUE, deg(42))}`)
        },
        onRight: S2 => solved(S2, "C0"),
      })
    },
    done: inputRight,
    walk: [
      { say: "Both angles are made from $A$ and $B$.", show: S => madeFrom(S, ["A", "B"], ["PA", "PB", "OA", "OB"]) },
      { say: "The angle at the centre is twice the angle at the circumference.", tex: `${Q} = 2 \\times ${c(BLUE, deg(42))}`, show: S => { S.pulseSegs = new Set(); S.pulse = new Set(["P", "C0"]) } },
      { say: "So the angle at the centre is $84^\\circ$.", tex: `${Q} = ${c(GREEN, deg(84))}`, show: S => uncover(S, "C0") },
    ],
  },
  {
    id: "centre-q2",
    say: "Find the angle at $P$.",
    enter: S => {
      centreBoard(S, false)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 155, B: 25, P: -95 })
      given(S, { C0: ORANGE }, "P")
      ask(S, [Q, "=", { box: true }], 65, {
        deg: true,
        help: (S2, t) => {
          S2.pulse = new Set(["P", "C0"])
          if (t >= 2) remind(S2, `${c(ORANGE, deg(130))} = 2 \\times ${Q}`)
        },
        onRight: S2 => solved(S2, "P"),
      })
    },
    done: inputRight,
    walk: [
      { say: "Both angles are made from $A$ and $B$.", show: S => madeFrom(S, ["A", "B"], ["PA", "PB", "OA", "OB"]) },
      { say: "The angle at the centre is twice the angle at $P$.", tex: `${c(ORANGE, deg(130))} = 2 \\times ${Q}`, show: S => { S.pulseSegs = new Set(); S.pulse = new Set(["P", "C0"]) } },
      { say: "So the angle at $P$ is half of $130^\\circ$: $65^\\circ$.", tex: `${Q} = 130^\\circ \\div 2 = ${c(GREEN, deg(65))}`, show: S => uncover(S, "P") },
    ],
  },

  // ── 6. Why twice ──
  {
    id: "draw-through",
    say: "Why twice? Draw a line from $P$ through $O$.",
    enter: S => {
      proofBoard(S, 0)
      S.angles = [atCirc("P", "P"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
      S.drewOnce = false
      S.mode = "drawThrough"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.segs.some(s => s.id === "PX"),
  },
  watch("split", "It splits the angle at $P$ into $a$ and $b$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("radii", "$OA$ and $OP$ are both radii.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP"])
    S.ticks = ["OA", "OP"]
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  watch("isosceles", "So triangle $OAP$ is isosceles. Its base angles are equal.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA"])
    S.ticks = ["OA", "OP"]
    S.fills = [{ pts: ["O", "A", "P"], color: BLUE }]
    S.pulse = new Set(["aA", "aP"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.4),
  {
    id: "tap-a",
    say: "Tap the two $a$ angles.",
    enter: S => {
      proofBoard(S, 1)
      only(S, ["aP", "bP", "aA", "gapA"])
      S.ticks = ["OA", "OP"]
      S.fills = [{ pts: ["O", "A", "P"], color: BLUE }]
      tapToFly(S, ["aA", "aP"])
      look(S, ["letters", "arcs", "values", "ticks"])
    },
    done: landed(["aA", "aP"]),
  },
  watch("fill", "They fill this angle exactly.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA"])
    S.ticks = ["OA", "OP"]
    flown(S, ["aA", "aP"])
    S.pulse = new Set(["aA~", "aP~"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  watch("in-triangle", "In the triangle, $a + a +$ this $= 180^\\circ$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA", "third"])
    S.ticks = ["OA", "OP"]
    S.fills = [{ pts: ["O", "A", "P"], color: BLUE }]
    flown(S, ["aA", "aP"])
    S.pulse = new Set(["aA", "aP", "third"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.6),
  watch("on-line", "On the straight line, this $+$ the gap $= 180^\\circ$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA", "third"])
    S.ticks = ["OA", "OP"]
    flown(S, ["aA", "aP"])
    S.half = { at: "O", from: "P", to: "X", via: "A" }
    S.pulse = new Set(["third", "aA~", "aP~"])
    look(S, ["letters", "arcs", "values", "ticks", "half"])
  }, 2.6),
  watch("gap-2a", "So the gap is exactly $a + a$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA"])
    S.ticks = ["OA", "OP"]
    flown(S, ["aA", "aP"])
    S.pulse = new Set(["aA~", "aP~"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  {
    id: "tap-b",
    say: "Tap the two $b$ angles.",
    enter: S => {
      proofBoard(S, 1)
      only(S, ["aP", "bP", "aA", "bB", "gapB"])
      S.ticks = ["OA", "OP", "OB"]
      S.fills = [{ pts: ["O", "B", "P"], color: ORANGE }]
      flown(S, ["aA", "aP"])
      tapToFly(S, ["bB", "bP"])
      look(S, ["letters", "arcs", "values", "ticks"])
    },
    done: landed(["bB", "bP"]),
  },
  watch("sum-both", "At $P$: $a + b$. At the centre: $2a + 2b$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA", "bB"])
    S.ticks = ["OA", "OP", "OB"]
    flown(S, ["aA", "aP", "bB", "bP"])
    S.lineTex = `\\angle APB = ${c(BLUE, "a")} + ${c(ORANGE, "b")}, \\quad \\angle AOB = 2${c(BLUE, "a")} + 2${c(ORANGE, "b")}`
    look(S, ["letters", "arcs", "values", "ticks", "line"])
  }, 2.6),
  watch("so-twice", "So the centre angle is twice the angle at $P$.", S => {
    proofBoard(S, 1)
    only(S, ["aP", "bP", "aA", "bB"])
    S.ticks = ["OA", "OP", "OB"]
    flown(S, ["aA", "aP", "bB", "bP"])
    S.lineTex = `2${c(BLUE, "a")} + 2${c(ORANGE, "b")} = 2(${c(BLUE, "a")} + ${c(ORANGE, "b")})`
    look(S, ["letters", "arcs", "values", "ticks", "line"])
  }, 2.2),
  {
    id: "proof-play",
    say: "Move $P$. It works wherever $P$ is.",
    enter: S => {
      proofBoard(S, 1)
      only(S, ["aP", "bP", "aA", "bB"])
      S.ticks = ["OA", "OP", "OB"]
      flown(S, ["aA", "aP", "bB", "bP"])
      S.lineFn = S2 => {
        const a = aVal(S2), b = bVal(S2)
        return `\\angle AOB = 2 \\times ${deg(a + b)} = ${deg(2 * (a + b))}`
      }
      S.movable = ["P"]; S.proofLimit = true; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "ticks", "line"])
    },
    done: movedBy("P", 30), free: true, minPlay: 6,
  },

  // ── 7. One idea, three rules ──
  {
    id: "make-diameter",
    say: "Drag $B$ until $AB$ is a diameter.",
    enter: S => {
      base(S, ["A", "B", "P", "O"])
      place(S, { A: 150, B: 30, P: -110 })
      S.showPts = ["A", "B", "P"]; setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
      S.angles = [atCirc("P", "P"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
      S.movable = ["B"]; S.snaps = { name: "B", at: [-30 * RAD] }; S.arcLimit = { min: 24, max: 180 }; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.locked,
  },
  watch("straight", "The angle at the centre is now a straight line: $180^\\circ$.", S => {
    diamBoard(S)
    S.pulse = new Set(["C0"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("half-of", "Half of $180^\\circ$ is $90^\\circ$: the angle in a semicircle.", S => {
    diamBoard(S)
    S.pulse = new Set(["P"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("share", "$P$ and $Q$ in one segment share one centre angle.", S => {
    shareBoard(S)
    S.pulse = new Set(["C0"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("halves", "Each is half of it. So they're equal.", S => {
    shareBoard(S)
    S.pulse = new Set(["P", "Q"])
    S.lineFn = S2 => {
      const p = insc(S2, "P", "A", "B")
      return `${c(BLUE, deg(p))} = ${c(BLUE, deg(p))} = \\tfrac{1}{2} \\times ${c(ORANGE, deg(2 * p))}`
    }
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.2),

  // ── 8. Use it ──
  {
    id: "use-semi",
    say: "Find the missing angle.",
    enter: S => {
      base(S, ["A", "B", "P", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 180, B: 0, P: -48 })
      S.showPts = ["A", "B", "P"]; setSegs(S, [["A", "B"], ["P", "A"], ["P", "B"]])
      S.angles = [inTri("tA", "A", "P", "A", "B"), inTri("tB", "B", "P", "A", "B"), inTri("tP", "P", "P", "A", "B")]
      given(S, { tA: BLUE }, "tB")
      ask(S, [Q, "=", { box: true }], 66, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "tP"); S2.fixed.tP = NEUTRAL; S2.pulse = new Set(["tP", "tB"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(24))} + ${Q} + 90^\\circ = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "tB"),
      })
    },
    done: inputRight,
    walk: semiWalk(24, 66),
  },
  {
    id: "use-bowtie",
    say: "Find the missing angle.",
    enter: S => {
      base(S, ["A", "B", "C", "D", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 122, B: 58, C: -150, D: -30 })
      S.showPts = ["A", "B", "C", "D"]
      setSegs(S, [["C", "A"], ["C", "B"], ["D", "A"], ["D", "B"]])
      S.angles = [atCirc("C", "C"), atCirc("D", "D")]
      given(S, { C: BLUE }, "D")
      ask(S, [Q, "=", { box: true }], 32, {
        deg: true,
        help: (S2, t) => {
          S2.tints = [{ a: "A", b: "B", side: "C", color: BLUE }]; S2.vis.tints.t = 1
          S2.pulse = new Set(["C", "D"])
          if (t >= 2) remind(S2, "\\text{Angles in the same segment are equal.}")
        },
        onRight: S2 => solved(S2, "D"),
      })
    },
    done: inputRight,
    walk: segmentWalk("C", "D", 32),
  },
  {
    id: "use-reflex",
    say: "Find $x$.",
    enter: S => {
      base(S, ["A", "B", "P", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 145, B: 35, P: 95 })
      S.showPts = ["A", "B", "P"]; setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
      S.angles = [atCirc("P", "P"), atCentre("P")]
      given(S, { C0: BLUE }, "P", "x")
      ask(S, ["x =", { box: true }], 125, {
        deg: true,
        help: (S2, t) => {
          S2.pulse = new Set(["C0", "P"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(250))} = 2 \\times ${c(PINK, "x")}`)
        },
        onRight: S2 => solved(S2, "P"),
      })
    },
    done: inputRight,
    walk: [
      { say: "Both angles are made from $A$ and $B$.", show: S => madeFrom(S, ["A", "B"], ["PA", "PB", "OA", "OB"]) },
      { say: "$P$ is in the small segment, so its centre angle is the reflex one.", show: S => { S.pulseSegs = new Set(); S.pulse = new Set(["C0"]) } },
      { say: "The angle at the centre is twice the angle at $P$.", tex: `${c(BLUE, deg(250))} = 2 \\times ${c(PINK, "x")}`, show: S => { S.pulse = new Set(["C0", "P"]) } },
      { say: "So $x$ is half of $250^\\circ$: $125^\\circ$.", tex: `x = 250^\\circ \\div 2 = ${c(GREEN, deg(125))}`, show: S => uncover(S, "P") },
    ],
  },
  {
    id: "use-OAB",
    say: "Find angle $OAB$.",
    enter: S => {
      base(S, ["A", "B", "C", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 125, B: 55, C: -90 })
      S.showPts = ["A", "B", "C"]
      setSegs(S, [["C", "A"], ["C", "B"], ["O", "A"], ["O", "B"], ["A", "B"]])
      S.angles = [
        atCirc("C", "C"),
        { id: "OAB", at: "A", from: "O", to: "B", value: S2 => 90 - insc(S2, "C", "A", "B") },
        atCentre("C", "C0", "A", "B", { r: 0.8 }),
      ]
      given(S, { C: BLUE }, "OAB")
      ask(S, [Q, "=", { box: true }], 55, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "C0"); S2.fixed.C0 = ORANGE; S2.label.C0 = ""
          if (t === 1) { S2.pulse = new Set(["C0", "C"]); remind(S2, "\\angle AOB = 2 \\times \\angle ACB") }
          if (t >= 2) {
            S2.ticks = ["OA", "OB"]; S2.vis.ticks.t = 1
            S2.pulse = new Set(["OAB"])
            remind(S2, `${Q} + ${Q} + \\angle AOB = ${c(GREEN, deg(180))}`)
          }
        },
        onRight: S2 => solved(S2, "OAB"),
      })
    },
    done: inputRight,
    walk: [
      {
        say: "Angles $ACB$ and $AOB$ are both made from $A$ and $B$.",
        show: S => { reveal(S, "C0"); S.fixed.C0 = ORANGE; S.label.C0 = ""; madeFrom(S, ["A", "B"], ["CA", "CB", "OA", "OB"]) },
      },
      {
        say: "So angle $AOB$ is twice angle $ACB$.",
        tex: `\\angle AOB = 2 \\times ${c(BLUE, deg(35))} = ${c(ORANGE, deg(70))}`,
        show: S => { S.pulsePts = new Set(); S.pulseSegs = new Set(); delete S.label.C0; S.pulse = new Set(["C0"]) },
      },
      {
        say: "$OA$ and $OB$ are radii. So triangle $OAB$ is isosceles.",
        show: S => { S.ticks = ["OA", "OB"]; S.vis.ticks.t = 1; S.fills = [{ pts: ["O", "A", "B"], color: ORANGE }]; S.pulse = new Set() },
      },
      {
        say: "Its two base angles are equal. They share what's left of $180^\\circ$.",
        tex: `${Q} + ${Q} = 180^\\circ - 70^\\circ = 110^\\circ`,
        show: S => { S.pulse = new Set(["OAB"]) },
      },
      {
        say: "So angle $OAB$ is $55^\\circ$.",
        tex: `\\angle OAB = 110^\\circ \\div 2 = ${c(GREEN, deg(55))}`,
        show: S => uncover(S, "OAB"),
      },
    ],
  },
  {
    id: "use-exam",
    say: "$AB$ is a diameter. Find angle $ADC$.",
    enter: S => {
      base(S, ["A", "B", "C", "D", "O"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 180, B: 0, C: -48, D: -115 })
      S.showPts = ["A", "B", "C", "D"]
      setSegs(S, [["A", "B"], ["A", "C"], ["A", "D"], ["D", "C"], ["D", "B"]])
      S.angles = [
        atCirc("BAC", "A", "B", "C"),
        atCirc("ADC", "D", "A", "C"),
        atCirc("ADB", "D", "A", "B", { r: 0.62 }),
        atCirc("BDC", "D", "B", "C", { r: 0.62 }),
      ]
      given(S, { BAC: BLUE }, "ADC")
      ask(S, [Q, "=", { box: true }], 114, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "ADB"); S2.fixed.ADB = NEUTRAL; S2.label.ADB = ""
          if (t === 1) S2.pulse = new Set(["ADB"])
          if (t >= 2) {
            reveal(S2, "BDC"); S2.fixed.BDC = BLUE; S2.label.BDC = ""
            S2.pulse = new Set(["BAC", "BDC"])
            remind(S2, "\\angle ADC = \\angle ADB + \\angle BDC")
          }
        },
        onRight: S2 => solved(S2, "ADC"),
      })
    },
    done: inputRight,
    walk: [
      {
        say: "$AB$ is a diameter. So angle $ADB$ is $90^\\circ$.",
        show: S => { reveal(S, "ADB"); S.fixed.ADB = NEUTRAL; delete S.label.ADB; S.tints = [{ a: "A", b: "B", side: "D", color: BLUE }]; S.vis.tints.t = 1; S.pulse = new Set(["ADB"]) },
      },
      {
        say: "Angles $BDC$ and $BAC$ are both made from $B$ and $C$.",
        show: S => { S.vis.tints.t = 0; reveal(S, "BDC"); S.fixed.BDC = BLUE; S.label.BDC = ""; madeFrom(S, ["B", "C"], ["DB", "DC", "AB", "AC"]); S.pulse = new Set(["BAC", "BDC"]) },
      },
      {
        say: "They're in the same segment. So angle $BDC$ is $24^\\circ$.",
        show: S => { S.pulsePts = new Set(); S.pulseSegs = new Set(); delete S.label.BDC; S.pulse = new Set(["BDC"]) },
      },
      {
        say: "So angle $ADC$ is $90^\\circ + 24^\\circ$.",
        tex: `\\angle ADC = 90^\\circ + 24^\\circ = ${c(GREEN, deg(114))}`,
        // only the answer keeps its number; the two parts keep their arcs
        show: S => { S.label.ADB = ""; S.label.BDC = ""; uncover(S, "ADC") },
      },
    ],
  },

  // ── 9. Build to order ──
  buildTo("make-30", "Make the angle at $P$ $30^\\circ$.", [90], 170),
  buildTo("make-140", "Now make the angle at the centre $140^\\circ$.", [10], 170),
  buildTo("make-90", "Make the angle at $P$ exactly $90^\\circ$.", [-30], 180),
  watch("only-way", "The only way: $AB$ must be a diameter.", S => {
    diamBoard(S)
    S.pulse = new Set(["P"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),

  // ── 10. One you can't do ──
  {
    id: "make-both",
    say: "Make $P$ $50^\\circ$ and the centre $120^\\circ$.",
    enter: S => {
      buildBoard(S, 60)
      S.chips = impossibleChipsFor()
      S.movable = ["B", "P"]; S.arcLimit = { min: 24, max: 170 }
      S.snaps = { name: "B", at: [50 * RAD, 30 * RAD] }; S.lockOnSnap = false
      S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    buildBoard(S, angOf(S, "B", false) / RAD)
    S.chips = impossibleChipsFor()
    look(S, ["letters", "arcs", "values", "line"])
  }),
  watch("must-100", "With $50^\\circ$ at $P$, the centre must be $100^\\circ$.", S => {
    buildBoard(S, 50)
    S.pulse = new Set(["P", "C0"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("not-twice", "And $120^\\circ$ is not twice $50^\\circ$.", S => {
    buildBoard(S, 50)
    S.lineTex = `2 \\times ${c(BLUE, deg(50))} = ${c(ORANGE, deg(100))} \\neq ${c(PINK, deg(120))}`
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.2),
  watch("always-twice", "The angle at the centre is always twice the angle at the circumference.", S => {
    buildBoard(S, 50)
    S.lineFn = twiceLine
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  {
    id: "end",
    say: "Move anything. The rules always hold.",
    enter: S => {
      buildBoard(S, 60)
      S.lineFn = twiceLine
      S.movable = ["A", "B", "P"]; S.crossOK = new Set(["P"]); S.arcLimit = { min: 24, max: 336 }
      S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── worked walkthroughs used by more than one question ───────────────────

/** Diameter AB, angle at A given, angle at B wanted. */
function semiWalk(atA: number, answer: number): WalkStep[] {
  return [
    {
      say: "$AB$ is a diameter. So the angle at $P$ is $90^\\circ$.",
      tex: "\\angle APB = 90^\\circ",
      show: S => { reveal(S, "tP"); S.fixed.tP = NEUTRAL; S.tints = [{ a: "A", b: "B", side: "P", color: BLUE }]; S.vis.tints.t = 1; S.pulse = new Set(["tP"]) },
    },
    {
      say: "A triangle's angles add up to $180^\\circ$.",
      tex: `${c(BLUE, deg(atA))} + ${Q} + 90^\\circ = ${c(GREEN, deg(180))}`,
      show: S => { S.vis.tints.t = 0; S.fills = [{ pts: ["A", "B", "P"], color: BLUE }]; S.pulse = new Set(["tA", "tB", "tP"]) },
    },
    {
      say: `So the missing angle is $${answer}^\\circ$.`,
      tex: `${Q} = 180^\\circ - ${deg(atA)} - 90^\\circ = ${c(GREEN, deg(answer))}`,
      show: S => { S.fills = []; uncover(S, "tB") },
    },
  ]
}

/** Two angles in the same segment on chord AB: the first given, the second wanted. */
function segmentWalk(V: string, W: string, v: number): WalkStep[] {
  return [
    {
      say: `The angles at $${V}$ and $${W}$ are both made from $A$ and $B$.`,
      show: S => madeFrom(S, ["A", "B"], [`${V}A`, `${V}B`, `${W}A`, `${W}B`]),
    },
    {
      say: "They're in the same segment.",
      show: S => { S.pulsePts = new Set(); S.pulseSegs = new Set(); S.tints = [{ a: "A", b: "B", side: V, color: BLUE }]; S.vis.tints.t = 1 },
    },
    {
      say: `Angles in the same segment are equal. So the angle at $${W}$ is $${v}^\\circ$.`,
      tex: `${Q} = ${c(BLUE, deg(v))}`,
      show: S => uncover(S, W),
    },
  ]
}

// ── boards used by several beats ─────────────────────────────────────────

function qColour(S: Scene) {
  return sameSide(S, "A", "B", "P", "Q") ? BLUE : NEUTRAL
}

/** The middle of the arc AB on P's side (`same`) or the other side. */
function midArc(S: Scene, A: string, B: string, P: string, same: boolean): number {
  const a = angOf(S, A, false), b = angOf(S, B, false), p = angOf(S, P, false)
  const len = ((b - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const pIn = (((p - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < len
  const fwd = pIn === same
  return fwd ? a + len / 2 : b + (2 * Math.PI - len) / 2
}

/** Q in P's segment, in the wider of the two gaps beside P. */
function placeQ(S: Scene) {
  const ok = S.pts.Q !== undefined && sameSide(S, "A", "B", "P", "Q")
    && Math.abs(turn(S.pts.Q, S.pts.P)) > 15 * RAD && Math.abs(turn(S.pts.Q, S.pts.A)) > 10 * RAD && Math.abs(turn(S.pts.Q, S.pts.B)) > 10 * RAD
  if (ok) return
  const a = S.pts.A, b = S.pts.B, p = S.pts.P
  const gapA = Math.abs(turn(p, a)), gapB = Math.abs(turn(p, b))
  const far = gapA > gapB ? a : b
  S.pts.Q = p + turn(p, far) / 2
  if (S.ptsD.Q === undefined) S.ptsD.Q = S.pts.Q
}

/** Chord, P, and the angles at P and at the centre. */
function centreBoard(S: Scene, keep = true) {
  base(S, ["A", "B", "P", "O"])
  if (keep) ensureMajor(S)
  S.showPts = ["A", "B", "P"]
  setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
  S.angles = [atCirc("P", "P"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
}

/**
 * The proof figure: chord AB, P placed so the centre is inside angle APB.
 * Stage 1 adds the line from P through O and the pieces a and b.
 */
function proofBoard(S: Scene, stage: number) {
  base(S, ["A", "B", "P", "O"])
  const ok = S.pts.A !== undefined && S.pts.B !== undefined && S.pts.P !== undefined && proofOK(S)
  // a = 32, b = 28: wide enough to see and to label
  if (!ok) place(S, { A: 150, B: 30, P: -94 })
  S.showPts = ["A", "B", "P"]
  setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
  if (stage < 1) return
  S.derived.X = (S2, drawn) => angOf(S2, "P", drawn) + Math.PI
  setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"], ["P", "X"], ["O", "P"]])
  S.angles = [
    { id: "aP", at: "P", from: "A", to: "X", value: aVal },
    { id: "bP", at: "P", from: "X", to: "B", value: bVal },
    { id: "aA", at: "A", from: "O", to: "P", value: aVal },
    { id: "bB", at: "B", from: "O", to: "P", value: bVal },
    { id: "gapA", at: "O", from: "A", to: "X", value: S2 => 2 * aVal(S2), outline: true },
    { id: "gapB", at: "O", from: "X", to: "B", value: S2 => 2 * bVal(S2), outline: true },
    { id: "third", at: "O", from: "A", to: "P", value: S2 => 180 - 2 * aVal(S2), r: 0.7 },
  ]
  S.fixed = { aP: BLUE, aA: BLUE, gapA: BLUE, bP: ORANGE, bB: ORANGE, gapB: ORANGE, third: NEUTRAL }
  S.label = { aP: "a", aA: "a", bP: "b", bB: "b", gapA: "", gapB: "", third: "" }
}

function proofOK(S: Scene) {
  const x = S.pts.P + Math.PI
  const a = S.pts.A, b = S.pts.B
  const len = ((b - a) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)
  const pIn = (((S.pts.P - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < len
  const xIn = (((x - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) < len
  return pIn !== xIn && Math.abs(turn(x, a)) > 10 * RAD && Math.abs(turn(x, b)) > 10 * RAD
}

/** a and b: the two parts of the angle at P either side of the line through O. */
function aVal(S: Scene) { return Math.round(arcDeg(S, "A", "X", "P") / 2) }
function bVal(S: Scene) { return Math.round(arcDeg(S, "X", "B", "P") / 2) }

function tapToFly(S: Scene, ids: string[]) {
  S.mode = "tapAngle"
  S.tapIds = ids
  S.onTap = (S2, id) => {
    if (S2.fly[id] !== undefined) return
    S2.fly[id] = S2.time
    S2.pulse.delete(id)
  }
  S.pulse = new Set(ids)
}
function flown(S: Scene, ids: string[]) {
  for (const id of ids) S.fly[id] = S.time - 5
}
function landed(ids: string[]) {
  return (S: Scene) => ids.every(id => S.fly[id] !== undefined && S.time - S.fly[id] > 1.1)
}

/** AB a diameter, P on the circle: the centre angle is a straight line. */
function diamBoard(S: Scene) {
  base(S, ["A", "B", "P", "O"])
  place(S, { A: 150, B: -30, P: -110 })
  S.showPts = ["A", "B", "P"]; setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
  S.angles = [atCirc("P", "P"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
}

/** Two points in one segment, both joined, and the centre angle they share. */
function shareBoard(S: Scene) {
  base(S, ["A", "B", "P", "Q", "O"])
  place(S, { A: 150, B: 30, P: -130, Q: -50 })
  S.showPts = ["A", "B", "P", "Q"]
  setSegs(S, [["P", "A"], ["P", "B"], ["Q", "A"], ["Q", "B"], ["O", "A"], ["O", "B"]])
  S.angles = [atCirc("P", "P"), atCirc("Q", "Q"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
}

/** A fixed, P at the top, B where the beat puts it (degrees). */
function buildBoard(S: Scene, bDeg: number) {
  base(S, ["A", "B", "P", "O"])
  place(S, { A: 150, B: bDeg, P: -90 })
  S.showPts = ["A", "B", "P"]; setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"]])
  S.angles = [atCirc("P", "P"), atCentre("P", "C0", "A", "B", { colour: () => ORANGE })]
}

/** Drag B until a target is met; B snaps there and stays. */
function buildTo(id: string, text: string, snapDeg: number[], maxArc: number): Beat {
  return {
    id,
    say: text,
    enter: S => {
      const start = S.pts.B !== undefined && S.pts.A !== undefined && Math.abs(turn(S.pts.A, 150 * RAD)) < 0.01 ? S.pts.B / RAD : 70
      buildBoard(S, snapDeg.some(t => Math.abs(turn(start * RAD, t * RAD)) < 6 * RAD) ? 70 : start)
      S.movable = ["B"]; S.arcLimit = { min: 24, max: maxArc }
      S.snaps = { name: "B", at: snapDeg.map(t => t * RAD) }
      S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.locked,
  }
}

function impossibleChipsFor() {
  return [
    { tex: `\\angle APB = ${deg(50)}`, test: (S: Scene) => insc(S, "P", "A", "B") === 50 },
    { tex: `\\angle AOB = ${deg(120)}`, test: (S: Scene) => 2 * insc(S, "P", "A", "B") === 120 },
  ]
}
