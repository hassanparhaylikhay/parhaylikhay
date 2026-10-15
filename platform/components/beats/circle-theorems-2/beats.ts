/**
 * Circle theorems II, one tiny idea per beat. The student draws a circle,
 * puts four points on it and finds that opposite angles of a cyclic
 * quadrilateral add up to 180° (and see why, from lesson I's centre
 * angles). Then a line slid onto the circle becomes a tangent, meets the
 * radius at 90°, two tangents from a point come out equal (fold the kite),
 * and the alternate segment theorem is found by moving C, and explained by
 * sliding C into T. Practice from past papers, build to order, and two
 * angles that cannot both be true.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { type Vec, RAD, DEG } from "../geometry"
import type { WalkStep } from "../walk"
import {
  type Scene, type EqPart, type VisKey, type AngSpec,
  BLUE, ORANGE, PINK, GREEN, YELLOW, NEUTRAL,
  resetBeat, show, startInput, ensureCircle, place, setSegs, layout, insc, arcDeg, joined,
  angOf, posOf, norm, dirOf, turn, quadVals, tangentAngles, tangentCm,
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
  walk?: WalkStep<Scene>[]
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
const movedAll = (d: number) => (S: Scene) => !S.drag && S.moved >= d

function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

/** Start a beat: clean the board down, keep the student's circle. */
function base(S: Scene, letters: string[] = ["O"]) {
  resetBeat(S)
  ensureCircle(S)
  S.derived = {}
  S.free = {}
  S.tline = null
  S.tanMade = []
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

function solved(S: Scene, id: string) {
  delete S.label[id]
  S.fixed[id] = GREEN
  S.pulse = new Set()
}

/** Show the true value where the "?" was (the walkthrough's last step). */
function uncover(S: Scene, id: string) {
  delete S.label[id]
  S.pulse = new Set([id])
}

/** The two points an angle is made from glow, and the lines from them. */
function madeFrom(S: Scene, pts: string[], segs: string[]) {
  S.pulsePts = new Set(pts)
  S.pulseSegs = new Set(segs)
}

const atCirc = (id: string, V: string, X: string, Y: string, extra: Partial<AngSpec> = {}): AngSpec =>
  ({ id, at: V, from: X, to: Y, value: S => insc(S, V, X, Y), ...extra })

/** An angle measured off the true positions on screen, whole degrees. */
function trueAngle(S: Scene, V: string, X: string, Y: string): number {
  const v = posOf(S, V, false), x = posOf(S, X, false), y = posOf(S, Y, false)
  const a = Math.atan2(x[1] - v[1], x[0] - v[0]), b = Math.atan2(y[1] - v[1], y[0] - v[0])
  return Math.round(Math.abs(turn(a, b)) * DEG)
}

// ── the cyclic quadrilateral ─────────────────────────────────────────────

const QUAD: [string, string, string, string] = ["A", "B", "C", "D"]
const QUAD_SEGS: [string, string][] = [["A", "B"], ["B", "C"], ["C", "D"], ["D", "A"]]

function quadAngles(): AngSpec[] {
  const v = (n: string) => (S: Scene) => quadVals(S, QUAD)[n]
  return [
    { id: "A", at: "A", from: "D", to: "B", value: v("A") },
    { id: "B", at: "B", from: "A", to: "C", value: v("B") },
    { id: "C", at: "C", from: "B", to: "D", value: v("C") },
    { id: "D", at: "D", from: "C", to: "A", value: v("D") },
  ]
}

/** The four points in order round the circle, the student's if they are there. */
function ensureQuad(S: Scene) {
  delete S.free.D
  const ok = QUAD.every(n => S.pts[n] !== undefined)
    && QUAD.every((n, i) => {
      const a = S.pts[n], b = S.pts[QUAD[(i + 1) % 4]]
      return Math.abs(turn(a, b)) > 12 * RAD
    })
    && norm(S.pts.B - S.pts.A) < norm(S.pts.C - S.pts.A) && norm(S.pts.C - S.pts.A) < norm(S.pts.D - S.pts.A)
  if (!ok) place(S, { A: 200, B: 270, C: 10, D: 120 })
}

/** The quadrilateral on the board, its angles, and which pair is in focus. */
function quadBoard(S: Scene, focus: "none" | "AC" | "BD" | "all" = "all") {
  base(S, ["A", "B", "C", "D"])
  ensureQuad(S)
  S.showPts = [...QUAD]
  setSegs(S, QUAD_SEGS)
  S.angles = quadAngles()
  const dim = NEUTRAL
  const cols: Record<string, Record<string, string>> = {
    all: { A: BLUE, B: PINK, C: ORANGE, D: YELLOW },
    AC: { A: BLUE, B: dim, C: ORANGE, D: dim },
    BD: { A: dim, B: BLUE, C: dim, D: ORANGE },
    none: {},
  }
  S.fixed = { ...cols[focus] }
}

/** Live: the two opposite angles and their total. */
const pairLine = (x: string, y: string) => (S: Scene) => {
  const v = quadVals(S, QUAD)
  const t = v[x] + v[y]
  return `${c(BLUE, deg(v[x]))} + ${c(ORANGE, deg(v[y]))} = ${c(t === 180 ? GREEN : PINK, deg(t))}`
}

// ── tangents ─────────────────────────────────────────────────────────────

/** The tangent direction at T that points towards angle `toward` round the circle. */
function tangentDir(S: Scene, T: string, toward: number): number {
  const t = angOf(S, T)
  const O = posOf(S, "O"), Tp = posOf(S, T)
  const M: Vec = [O[0] + Math.cos(toward) * S.RD, O[1] + Math.sin(toward) * S.RD]
  const d1 = t + Math.PI / 2
  const d = dirOf(d1)
  return d[0] * (M[0] - Tp[0]) + d[1] * (M[1] - Tp[1]) >= 0 ? d1 : d1 + Math.PI
}

/** The arc from T to A on the angle's side: away from `other`, or the small one when there is none. */
function tcArc(S: Scene, T: string, A: string, other?: string): { deg: number; mid: number } {
  const t = angOf(S, T, false), a = angOf(S, A, false)
  const fwd = norm(a - t)
  let goFwd: boolean
  if (other && S.pts[other] !== undefined) goFwd = !(norm(angOf(S, other, false) - t) < fwd)
  else goFwd = fwd <= Math.PI
  const len = goFwd ? fwd : 2 * Math.PI - fwd
  const mid = goFwd ? t + len / 2 : t - len / 2
  return { deg: len * DEG, mid }
}

/** The angle between the tangent at T and chord TA, on the side away from `other`. */
function tanChord(id: string, T: string, A: string, other?: string, extra: Partial<AngSpec> = {}): AngSpec {
  return {
    id, at: T, from: T, to: A,
    value: S => Math.round(tcArc(S, T, A, other).deg / 2 + 1e-9),
    geom: S => {
      const Tp = posOf(S, T), Ap = posOf(S, A)
      const arc = tcArc(S, T, A, other)
      const a1 = tangentDir(S, T, arc.mid)
      const a2 = Math.atan2(Ap[1] - Tp[1], Ap[0] - Tp[0])
      return { c: Tp, start: a1, sweep: turn(a1, a2) }
    },
    ...extra,
  }
}

/** The angle at T between the radius and the straight line (90 when it is the tangent). */
function radiusLineAngle(): AngSpec {
  return {
    id: "rt", at: "T", from: "T", to: "O",
    value: S => {
      const tilt = Math.abs(S.tline?.tilt ?? 0) * DEG
      return Math.round(90 - tilt)
    },
    geom: S => {
      if (!S.tline) return null
      const Tp = posOf(S, "T"), O = posOf(S, "O")
      const a1 = Math.atan2(O[1] - Tp[1], O[0] - Tp[0])
      // The two sides of the line make 90 - tilt and 90 + tilt with the
      // radius. Pick the side from the tilt itself (the acute one, and one
      // fixed side when there is no tilt): comparing the two, which are
      // equal for a tangent, flipped the mark from side to side every frame.
      const tilt = S.tline.tilt
      return { c: Tp, start: a1, sweep: tilt >= 0 ? -Math.PI / 2 + tilt : Math.PI / 2 + tilt }
    },
  }
}

/** A tangent at T (a point on the circle at angle `deg`). */
function tangentAt(S: Scene, d: number) {
  place(S, { T: d })
  S.tline = { t: d * RAD, d: 1, tilt: 0 }
  S.tlineD = { ...S.tline }
  S.tlineFollow = "T"
}

/** P outside the circle, and where its two tangents touch, A and B. */
function outsidePoint(S: Scene, f: Vec) {
  S.free.P = f
  if (!S.freeD.P) S.freeD.P = f
  S.derived.A = (S2, drawn) => tangentAngles(S2, "P", drawn)[0]
  S.derived.B = (S2, drawn) => tangentAngles(S2, "P", drawn)[1]
  S.freeLimit = { min: 1.35, max: 2.4 }
}

/** Half the angle between the two tangents at P, from where P is. */
function halfAtP(S: Scene) {
  const f = S.free.P ?? [2, 0]
  return Math.asin(1 / Math.hypot(f[0], f[1])) * DEG
}
/** Base angle of the isosceles triangle PAB; the others follow from it so they always agree. */
const baseAngle = (S: Scene) => Math.round(90 - halfAtP(S))
const angleP = (S: Scene) => 180 - 2 * baseAngle(S)

/** A point at distance d along the tangent at circle angle t: right of T is +1, left is -1 (in radii). */
function onTangent(tDeg: number, along: number): Vec {
  const t = tDeg * RAD
  const n = dirOf(t), u = dirOf(t + Math.PI / 2)
  return [n[0] + u[0] * along, n[1] + u[1] * along]
}

// ── worked walkthroughs ──────────────────────────────────────────────────

function cyclicWalk(known: number, x: string, y: string): WalkStep<Scene>[] {
  return [
    { say: `$${x}$ and $${y}$ are opposite angles of a cyclic quadrilateral.`, show: S => { S.pulse = new Set([x, y]) } },
    { say: "Opposite angles add up to $180^\\circ$.", tex: `${c(BLUE, deg(known))} + ${Q} = ${c(GREEN, deg(180))}` },
    { say: `So the missing angle is $${180 - known}^\\circ$.`, tex: `${Q} = 180^\\circ - ${deg(known)} = ${c(GREEN, deg(180 - known))}`, show: S => uncover(S, y) },
  ]
}

// ── the beats ────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. Your circle ──
  {
    id: "place",
    say: "Tap to place the centre.",
    enter: S => {
      resetBeat(S)
      S.O = null; S.OD = null; S.drawn = false; S.sweep = null; S.R = 0; S.RD = 0
      S.pts = {}; S.ptsD = {}; S.free = {}; S.freeD = {}; S.showPts = []; S.segs = []; S.letters = new Set(); S.derived = {}; S.tline = null
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
      S.showPts = []; S.segs = []; S.letters = new Set(); S.free = {}; S.tline = null
      S.drewOnce = false
      S.mode = "compass"
      look(S, [])
    },
    done: S => S.drawn,
    advanceAfter: 900,
  },

  // ── 2. Cyclic quadrilateral ──
  {
    id: "four-points",
    say: "Tap the circle to put four points on it.",
    enter: S => {
      base(S, ["O"])
      S.showPts = []; S.segs = []
      for (const n of QUAD) { delete S.pts[n]; delete S.ptsD[n] }
      S.tapQueue = [...QUAD]
      S.mode = "tapPoint"
      look(S, ["letters"])
    },
    done: S => QUAD.every(n => S.showPts.includes(n)),
  },
  {
    id: "join-quad",
    say: "Join them in order: $A$, $B$, $C$, $D$, back to $A$.",
    enter: S => {
      base(S, ["A", "B", "C", "D"]); ensureQuad(S)
      S.showPts = [...QUAD]; S.segs = []
      S.joinNeed = QUAD_SEGS
      S.joinHint = "Join them in order round the circle."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters"])
    },
    done: joined,
  },
  watch("cyclic", "All four corners are on the circle. It's a cyclic quadrilateral.", S => {
    quadBoard(S)
    S.angles = []
    S.pulsePts = new Set(QUAD)
    look(S, ["letters"])
  }, 2.4),
  watch("corners", "Each corner has an angle.", S => {
    quadBoard(S)
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "move-quad",
    say: "Move the corners. Watch the angles.",
    enter: S => {
      quadBoard(S)
      S.movable = [...QUAD]; S.minGap = 14; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedAll(150), free: true, minPlay: 8,
  },
  watch("opposite", "$A$ and $C$ are opposite angles.", S => {
    quadBoard(S, "AC")
    S.pulse = new Set(["A", "C"])
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "guess-180",
    say: "Guess: what do $A$ and $C$ add up to?",
    enter: S => {
      quadBoard(S, "AC")
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      ask(S, [{ box: true }], 180, { guess: true, deg: true })
    },
    done: guessIn,
  },
  watch("add-AC", "Add them.", S => {
    quadBoard(S, "AC")
    S.lineFn = pairLine("A", "C")
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.2),
  {
    id: "still-180",
    say: "Move the corners. Still $180^\\circ$?",
    enter: S => {
      quadBoard(S, "AC")
      S.lineFn = pairLine("A", "C")
      S.movable = [...QUAD]; S.minGap = 14; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: movedAll(120), free: true, minPlay: 6,
  },
  watch("BD", "$B$ and $D$ are opposite too. They add up to $180^\\circ$ as well.", S => {
    quadBoard(S, "BD")
    S.lineFn = pairLine("B", "D")
    S.movable = [...QUAD]; S.minGap = 14; S.mode = "slide"
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  watch("cyclic-rule", "Opposite angles of a cyclic quadrilateral add up to $180^\\circ$.", S => {
    quadBoard(S)
    S.lineFn = S2 => `${pairLine("A", "C")(S2)}, \\quad ${pairLine("B", "D")(S2).replace(/#00abfa/g, "#ff4670").replace(/#ff822c/g, "#fff067")}`
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  {
    id: "pull-D",
    say: "Pull $D$ off the circle.",
    enter: S => {
      quadBoard(S, "AC")
      S.lineFn = pairLine("A", "C")
      S.movable = ["D"]; S.offOK = new Set(["D"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: S => !!S.free.D && !S.drag,
  },
  watch("off", "Off the circle, they don't add up to $180^\\circ$.", S => {
    const keep = S.free.D
    quadBoard(S, "AC")
    S.free.D = keep ?? [Math.cos(120 * RAD) * 0.7, Math.sin(120 * RAD) * 0.7]
    S.lineFn = pairLine("A", "C")
    S.movable = ["D"]; S.offOK = new Set(["D"]); S.mode = "slide"
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  {
    id: "D-back",
    say: "Put $D$ back on the circle.",
    enter: S => {
      const keep = S.free.D
      quadBoard(S, "AC")
      S.free.D = keep ?? [Math.cos(120 * RAD) * 0.7, Math.sin(120 * RAD) * 0.7]
      if (!S.free.D) S.free.D = [Math.cos(120 * RAD) * 0.7, Math.sin(120 * RAD) * 0.7]
      S.lineFn = pairLine("A", "C")
      S.movable = ["D"]; S.offOK = new Set(["D"]); S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: S => !S.free.D && !S.drag,
  },
  {
    id: "cyclic-q",
    say: "Find the missing angle.",
    enter: S => {
      quadBoard(S, "none")
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { A: 180, B: 238, C: 0, D: 122 })
      given(S, { A: BLUE }, "C")
      ask(S, [Q, "=", { box: true }], 58, {
        deg: true,
        help: (S2, t) => {
          S2.pulse = new Set(["A", "C"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(122))} + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "C"),
      })
    },
    done: inputRight,
    walk: cyclicWalk(122, "A", "C"),
  },

  // ── 3. Why 180 ──
  watch("from-BD", "$A$ and $C$ are both made from $B$ and $D$.", S => {
    quadBoard(S, "AC")
    only(S, ["A", "C"])
    madeFrom(S, ["B", "D"], ["AB", "DA", "BC", "CD"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("two-segments", "They're in different segments.", S => {
    quadBoard(S, "AC")
    only(S, ["A", "C"])
    S.segs = [...S.segs, { id: "BD", a: "B", b: "D" }]
    S.tints = [{ a: "B", b: "D", side: "A", color: BLUE }, { a: "B", b: "D", side: "C", color: ORANGE }]
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.2),
  {
    id: "join-BD-O",
    say: "Join $B$ and $D$ to the centre.",
    enter: S => {
      quadBoard(S, "AC")
      only(S, ["A", "C"])
      S.joinNeed = [["O", "B"], ["O", "D"]]
      S.joinHint = "Join $B$ to $O$, then $D$ to $O$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters", "arcs", "values"])
    },
    done: joined,
  },
  watch("A-centre", "$A$'s centre angle is twice $A$.", S => {
    whyBoard(S, ["A", "C", "cA"])
    S.pulse = new Set(["A", "cA"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("C-centre", "$C$'s centre angle is twice $C$.", S => {
    whyBoard(S, ["A", "C", "cA", "cC"])
    S.pulse = new Set(["C", "cC"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("full-turn", "Together they go all the way round: $360^\\circ$.", S => {
    whyBoard(S, ["A", "C", "cA", "cC"])
    S.ringAt = true
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("half-360", "So $A + C$ is half of $360^\\circ$: $180^\\circ$.", S => {
    whyBoard(S, ["A", "C", "cA", "cC"])
    S.lineTex = `2${c(BLUE, "A")} + 2${c(ORANGE, "C")} = ${deg(360)}, \\quad ${c(BLUE, "A")} + ${c(ORANGE, "C")} = ${c(GREEN, deg(180))}`
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.6),
  {
    id: "why-play",
    say: "Move $B$ and $D$. It always works.",
    enter: S => {
      whyBoard(S, ["A", "C", "cA", "cC"])
      S.lineFn = S2 => { const v = quadVals(S2, QUAD); return `${c(BLUE, deg(2 * v.A))} + ${c(ORANGE, deg(2 * v.C))} = ${c(GREEN, deg(360))}` }
      S.movable = ["B", "D"]; S.minGap = 14; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: movedAll(70), free: true, minPlay: 6,
  },

  // ── 4. Tangents ──
  {
    id: "slide-on",
    say: "Drag this line down onto the circle.",
    enter: S => {
      base(S, ["O"])
      S.showPts = []; S.segs = []
      S.tline = { t: -Math.PI / 2, d: 1.45, tilt: 0 }
      S.tlineD = { ...S.tline }
      S.lineRoom = 1.5
      S.tlineMode = "slide"; S.mode = "slide"
      look(S, ["letters"])
    },
    done: S => !!S.tline && S.tline.d < 0.9 && !S.drag,
  },
  watch("cuts", "Now it cuts the circle in two places.", S => {
    base(S, ["O"])
    S.showPts = []; S.segs = []
    S.tline = { t: -Math.PI / 2, d: 0.6, tilt: 0 }
    S.lineRoom = 1.5
    S.tlineMode = "slide"; S.mode = "slide"
    look(S, ["letters"])
  }),
  {
    id: "just-touch",
    say: "Slide it back until it just touches.",
    enter: S => {
      base(S, ["O"])
      S.showPts = []; S.segs = []
      S.tline = { t: -Math.PI / 2, d: 0.6, tilt: 0 }
      S.lineRoom = 1.5
      S.tlineMode = "slide"; S.mode = "slide"
      S.snaps = { name: "@line", at: [] }
      look(S, ["letters"])
    },
    done: S => S.locked,
  },
  watch("tangent", "It touches at one point. It's a tangent.", S => {
    base(S, ["O", "T"])
    tangentAt(S, -90)
    S.showPts = ["T"]; S.segs = []
    S.pulsePts = new Set(["T"])
    look(S, ["letters"])
  }, 2.2),
  {
    id: "join-T",
    say: "Join $T$ to the centre.",
    enter: S => {
      base(S, ["O", "T"])
      tangentAt(S, -90)
      S.showPts = ["T"]; S.segs = []
      S.joinNeed = [["T", "O"]]
      S.joinHint = "Join $T$ to $O$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters"])
    },
    done: joined,
  },
  {
    id: "guess-90",
    say: "Guess: what's the angle between them?",
    enter: S => {
      base(S, ["O", "T"])
      tangentAt(S, -90)
      S.showPts = ["T"]; setSegs(S, [["T", "O"]])
      S.angles = [radiusLineAngle()]
      only(S, [])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      ask(S, [{ box: true }], 90, { guess: true, deg: true, onRight: S2 => { reveal(S2, "rt"); S2.pulse = new Set(["rt"]) } })
    },
    done: guessIn,
  },
  {
    id: "ride-T",
    say: "Slide $T$ round the circle. Watch the angle.",
    enter: S => {
      base(S, ["O", "T"])
      tangentAt(S, S.pts.T !== undefined ? angOf(S, "T", false) / RAD : -90)
      S.showPts = ["T"]; setSegs(S, [["T", "O"]])
      S.angles = [radiusLineAngle()]
      S.movable = ["T"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("T", 120), free: true, minPlay: 6,
  },
  watch("tangent-rule", "A tangent meets the radius at $90^\\circ$.", S => {
    base(S, ["O", "T"])
    tangentAt(S, S.pts.T !== undefined ? angOf(S, "T", false) / RAD : -90)
    S.showPts = ["T"]; setSegs(S, [["T", "O"]])
    S.angles = [radiusLineAngle()]
    S.pulse = new Set(["rt"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "tilt",
    say: "Tilt the tangent a little.",
    enter: S => {
      base(S, ["O", "T"])
      tangentAt(S, S.pts.T !== undefined ? angOf(S, "T", false) / RAD : -90)
      S.tlineFollow = null
      S.showPts = ["T"]; setSegs(S, [["T", "O"]])
      S.angles = [radiusLineAngle()]
      S.tlineMode = "tilt"; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => !!S.tline && Math.abs(S.tline.tilt) > 3 * RAD && !S.drag,
  },
  watch("cuts-again", "Any tilt and it cuts the circle again.", S => {
    base(S, ["O", "T"])
    tangentAt(S, S.pts.T !== undefined ? angOf(S, "T", false) / RAD : -90)
    S.tlineFollow = null
    if (S.tline && Math.abs(S.tline.tilt) < 3 * RAD) S.tline = { ...S.tline, tilt: 0.18 }
    S.showPts = ["T"]; setSegs(S, [["T", "O"]])
    S.angles = [radiusLineAngle()]
    S.tlineMode = "tilt"; S.mode = "slide"
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "tangent-q",
    say: "Find the missing angle.",
    enter: S => {
      base(S, ["O", "T", "P"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      tangentAt(S, 90)
      S.tlineFollow = null
      S.free.P = onTangent(90, -Math.tan(52 * RAD))
      S.showPts = ["T", "P"]
      setSegs(S, [["O", "T"], ["O", "P"]])
      S.angles = [
        { id: "TOP", at: "O", from: "T", to: "P", value: S2 => trueAngle(S2, "O", "T", "P") },
        { id: "TPO", at: "P", from: "T", to: "O", value: S2 => 90 - trueAngle(S2, "O", "T", "P") },
        { id: "OTP", at: "T", from: "O", to: "P", value: () => 90 },
      ]
      given(S, { TOP: BLUE }, "TPO")
      ask(S, [Q, "=", { box: true }], 38, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "OTP"); S2.fixed.OTP = NEUTRAL; S2.pulse = new Set(["OTP"])
          if (t >= 2) remind(S2, `${c(BLUE, deg(52))} + 90^\\circ + ${Q} = ${c(GREEN, deg(180))}`)
        },
        onRight: S2 => solved(S2, "TPO"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$PT$ is a tangent and $OT$ is a radius. They meet at $90^\\circ$.", show: S => { reveal(S, "OTP"); S.fixed.OTP = NEUTRAL; S.pulse = new Set(["OTP"]) } },
      { say: "A triangle's angles add up to $180^\\circ$.", tex: `${c(BLUE, deg(52))} + 90^\\circ + ${Q} = ${c(GREEN, deg(180))}`, show: S => { S.fills = [{ pts: ["O", "T", "P"], color: BLUE }]; S.pulse = new Set(["TOP", "OTP", "TPO"]) } },
      { say: "So the missing angle is $38^\\circ$.", tex: `${Q} = 180^\\circ - 52^\\circ - 90^\\circ = ${c(GREEN, deg(38))}`, show: S => { S.fills = []; uncover(S, "TPO") } },
    ],
  },

  // ── 5. Two tangents from a point ──
  watch("outside", "Here's a point $P$ outside the circle.", S => {
    base(S, ["O", "P"])
    outsidePoint(S, [2, 0.15])
    S.showPts = ["P"]; S.segs = []
    S.pulsePts = new Set(["P"])
    look(S, ["letters"])
  }),
  {
    id: "tangent-1",
    say: "Draw a line from $P$ that just touches the circle.",
    enter: S => {
      base(S, ["O", "P", "A", "B"])
      outsidePoint(S, [2, 0.15])
      S.showPts = ["P"]; S.segs = []
      S.tanFrom = "P"; S.tanMade = []
      S.drewOnce = false
      S.mode = "drawTan"
      look(S, ["letters"])
    },
    done: S => S.tanMade.length >= 1,
  },
  {
    id: "tangent-2",
    say: "Now the other one.",
    enter: S => {
      const made = S.tanMade.length ? [...S.tanMade] : ["A"]
      base(S, ["O", "P", "A", "B"])
      outsidePoint(S, [2, 0.15])
      S.showPts = ["P", ...made]
      setSegs(S, made.map(n => ["P", n] as [string, string]))
      S.tanFrom = "P"; S.tanMade = made
      S.mode = "drawTan"
      look(S, ["letters"])
    },
    done: S => S.tanMade.length >= 2,
  },
  {
    id: "move-P",
    say: "Move $P$. Watch the two lengths.",
    enter: S => {
      twoTangents(S)
      S.segText = { PA: S2 => `${tangentCm(S2, "P").toFixed(1)}\\text{ cm}`, PB: S2 => `${tangentCm(S2, "P").toFixed(1)}\\text{ cm}` }
      S.movable = ["P"]; S.mode = "slide"
      look(S, ["letters"])
    },
    done: movedBy("P", 60), free: true, minPlay: 7,
  },
  watch("equal", "They're always equal.", S => {
    twoTangents(S)
    S.segText = { PA: S2 => `${tangentCm(S2, "P").toFixed(1)}\\text{ cm}`, PB: S2 => `${tangentCm(S2, "P").toFixed(1)}\\text{ cm}` }
    S.ticks = ["PA", "PB"]
    S.movable = ["P"]; S.mode = "slide"
    look(S, ["letters", "ticks"])
  }),
  watch("equal-rule", "Tangents from a point are equal in length.", S => {
    twoTangents(S)
    S.ticks = ["PA", "PB"]
    look(S, ["letters", "ticks"])
  }, 2.2),
  {
    id: "join-OABP",
    say: "Join $O$ to $A$, $B$ and $P$.",
    enter: S => {
      twoTangents(S)
      S.ticks = ["PA", "PB"]
      S.joinNeed = [["O", "A"], ["O", "B"], ["O", "P"]]
      S.joinHint = "Start at $O$. Join it to $A$, $B$ and $P$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters", "ticks"])
    },
    done: joined,
  },
  watch("why-equal", "Two right angles. Two radii. One shared side.", S => {
    kiteBoard(S)
    S.ticks = ["OA", "OB"]
    S.pulseSegs = new Set(["OP"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.6),
  watch("fold", "Fold along $OP$. The two halves match.", S => {
    kiteBoard(S)
    S.ticks = ["OA", "OB"]
    S.foldAt = S.time
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 3.6),
  watch("isosceles", "So triangle $PAB$ is isosceles.", S => {
    twoTangents(S)
    S.segs = [...S.segs, { id: "AB", a: "A", b: "B" }]
    S.ticks = ["PA", "PB"]
    S.fills = [{ pts: ["P", "A", "B"], color: BLUE }]
    S.angles = [
      { id: "PAB", at: "A", from: "P", to: "B", value: baseAngle },
      { id: "PBA", at: "B", from: "P", to: "A", value: baseAngle },
    ]
    S.fixed = { PAB: ORANGE, PBA: ORANGE }
    S.pulse = new Set(["PAB", "PBA"])
    look(S, ["letters", "arcs", "values", "ticks"])
  }, 2.2),
  {
    id: "two-q1",
    say: "Find angle $PAB$.",
    enter: S => {
      examTangents(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      given(S, { APB: BLUE }, "PAB")
      ask(S, [Q, "=", { box: true }], 71, {
        deg: true,
        help: (S2, t) => {
          S2.ticks = ["PA", "PB"]; S2.vis.ticks.t = 1
          if (t >= 2) { reveal(S2, "PBA"); S2.fixed.PBA = PINK; S2.label.PBA = "?"; remind(S2, `${c(BLUE, deg(38))} + ${Q} + ${Q} = ${c(GREEN, deg(180))}`) }
        },
        onRight: S2 => solved(S2, "PAB"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$PA$ and $PB$ are tangents from $P$. So they're equal.", show: S => { S.ticks = ["PA", "PB"]; S.vis.ticks.t = 1 } },
      { say: "So triangle $PAB$ is isosceles. Its base angles are equal.", show: S => { reveal(S, "PBA"); S.fixed.PBA = PINK; S.label.PBA = "?"; S.pulse = new Set(["PAB", "PBA"]) } },
      { say: "Together they make $180^\\circ - 38^\\circ = 142^\\circ$.", tex: `${Q} + ${Q} = 180^\\circ - ${c(BLUE, deg(38))} = ${deg(142)}` },
      { say: "So each one is $71^\\circ$.", tex: `${Q} = 142^\\circ \\div 2 = ${c(GREEN, deg(71))}`, show: S => { delete S.label.PBA; uncover(S, "PAB") } },
    ],
  },
  {
    id: "two-q2",
    say: "Now find angle $AOB$.",
    enter: S => {
      examTangents(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      S.segs = [...S.segs, { id: "OA", a: "O", b: "A" }, { id: "OB", a: "O", b: "B" }]
      given(S, { APB: BLUE }, "AOB")
      ask(S, [Q, "=", { box: true }], 142, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "OAP"); reveal(S2, "OBP"); S2.fixed.OAP = NEUTRAL; S2.fixed.OBP = NEUTRAL
          if (t >= 2) remind(S2, `${c(BLUE, deg(38))} + 90^\\circ + 90^\\circ + ${Q} = ${c(GREEN, deg(360))}`)
        },
        onRight: S2 => solved(S2, "AOB"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$OA$ and $OB$ are radii. Each meets a tangent at $90^\\circ$.", show: S => { reveal(S, "OAP"); reveal(S, "OBP"); S.fixed.OAP = NEUTRAL; S.fixed.OBP = NEUTRAL; S.pulse = new Set(["OAP", "OBP"]) } },
      { say: "The four angles of $PAOB$ add up to $360^\\circ$.", tex: `${c(BLUE, deg(38))} + 90^\\circ + 90^\\circ + ${Q} = ${c(GREEN, deg(360))}`, show: S => { S.fills = [{ pts: ["P", "A", "O", "B"], color: BLUE }] } },
      { say: "So angle $AOB$ is $142^\\circ$.", tex: `${Q} = 360^\\circ - 218^\\circ = ${c(GREEN, deg(142))}`, show: S => { S.fills = []; uncover(S, "AOB") } },
    ],
  },
  {
    id: "two-q3",
    say: "And the angle at $D$.",
    enter: S => {
      examTangents(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      place(S, { D: 180 })
      S.showPts = [...S.showPts, "D"]
      S.letters.add("D")
      S.segs = [...S.segs, { id: "OA", a: "O", b: "A" }, { id: "OB", a: "O", b: "B" }, { id: "DA", a: "D", b: "A" }, { id: "DB", a: "D", b: "B" }]
      given(S, { AOB: ORANGE }, "ADB")
      ask(S, [Q, "=", { box: true }], 71, {
        deg: true,
        help: (S2, t) => {
          madeFrom(S2, ["A", "B"], ["DA", "DB", "OA", "OB"])
          if (t >= 2) remind(S2, `${c(ORANGE, deg(142))} = 2 \\times ${Q}`)
        },
        onRight: S2 => solved(S2, "ADB"),
      })
    },
    done: inputRight,
    walk: [
      { say: "Angle $ADB$ and angle $AOB$ are both made from $A$ and $B$.", show: S => madeFrom(S, ["A", "B"], ["DA", "DB", "OA", "OB"]) },
      { say: "The angle at the centre is twice the angle at the circumference.", tex: `${c(ORANGE, deg(142))} = 2 \\times ${Q}`, show: S => { S.pulsePts = new Set(); S.pulseSegs = new Set(); S.pulse = new Set(["AOB", "ADB"]) } },
      { say: "So angle $ADB$ is $71^\\circ$.", tex: `${Q} = 142^\\circ \\div 2 = ${c(GREEN, deg(71))}`, show: S => uncover(S, "ADB") },
    ],
  },

  // ── 6. Alternate segment theorem ──
  {
    id: "put-A",
    say: "Here's a tangent at $T$. Tap the circle to put $A$ on it.",
    enter: S => {
      base(S, ["O", "T", "A"])
      tangentAt(S, 90)
      S.tlineFollow = null
      delete S.pts.A; delete S.pts.C
      S.showPts = ["T"]; S.segs = []
      S.tapName = "A"
      S.tapCheck = (S2, a) => (Math.abs(turn(a, S2.pts.T)) < 35 * RAD ? "A bit further from $T$." : Math.abs(turn(a, S2.pts.T + Math.PI)) < 12 * RAD ? "Not straight across from $T$. A bit to one side." : null)
      S.mode = "tapPoint"
      look(S, ["letters"])
    },
    done: S => S.showPts.includes("A"),
  },
  {
    id: "join-TA",
    say: "Join $T$ to $A$.",
    enter: S => {
      altBase(S, false)
      S.segs = []
      S.joinNeed = [["T", "A"]]
      S.joinHint = "Join $T$ to $A$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters"])
    },
    done: joined,
  },
  watch("tc-angle", "The tangent and the chord make an angle.", S => {
    altBase(S, false)
    S.angles = [tanChord("tc", "T", "A")]
    S.pulse = new Set(["tc"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  {
    id: "put-C",
    say: "Tap the circle on the other side of the chord to put $C$.",
    enter: S => {
      altBase(S, false)
      delete S.pts.C
      S.angles = [tanChord("tc", "T", "A")]
      S.tapName = "C"
      // the angle's own side is the small arc between T and A
      S.tapCheck = (S2, a) => {
        const arc = tcArc(S2, "T", "A")
        const t = angOf(S2, "T", false)
        const fwd = norm(arc.mid - t) < Math.PI
        const along = fwd ? norm(a - t) : norm(t - a)
        return along < arc.deg * RAD ? "That's on the same side as the angle. Try the other side of the chord." : null
      }
      S.letters.add("C")
      S.mode = "tapPoint"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.showPts.includes("C"),
  },
  {
    id: "join-C",
    say: "Join $C$ to $T$ and to $A$.",
    enter: S => {
      altBase(S, true)
      S.angles = [tanChord("tc", "T", "A", "C")]
      setSegs(S, [["T", "A"]])
      S.joinNeed = [["C", "T"], ["C", "A"]]
      S.joinHint = "Join $C$ to $T$, then $C$ to $A$."
      S.drewOnce = false
      S.mode = "join"
      look(S, ["letters", "arcs", "values"])
    },
    done: joined,
  },
  {
    id: "move-C",
    say: "Move $C$. Watch both angles.",
    enter: S => {
      altBoard(S)
      S.movable = ["C"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("C", 70), free: true, minPlay: 7,
  },
  watch("always-equal", "They're always equal.", S => {
    altBoard(S)
    S.pulse = new Set(["tc", "C"])
    S.movable = ["C"]; S.mode = "slide"
    look(S, ["letters", "arcs", "values"])
  }),
  {
    id: "move-A",
    say: "Move $A$. Still equal?",
    enter: S => {
      altBoard(S)
      S.movable = ["A"]; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: movedBy("A", 40), free: true, minPlay: 6,
  },
  watch("alternate", "$C$ is in the alternate segment: on the other side of the chord.", S => {
    altBoard(S)
    S.tints = [{ a: "T", b: "A", side: "C", color: BLUE }]
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.4),
  watch("alt-rule", "The angle between a tangent and a chord equals the angle in the alternate segment.", S => {
    altBoard(S)
    S.tints = [{ a: "T", b: "A", side: "C", color: BLUE }]
    S.pulse = new Set(["tc", "C"])
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.6),
  watch("alt-name", "This is the alternate segment theorem.", S => {
    altBoard(S)
    S.tints = [{ a: "T", b: "A", side: "C", color: BLUE }]
    look(S, ["letters", "arcs", "values", "tints"])
  }, 2.2),

  // ── 7. Why it works ──
  {
    id: "slide-C",
    say: "Slide $C$ towards $T$.",
    enter: S => {
      altBoard(S)
      S.movable = ["C"]; S.minGap = 2.5; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => !S.drag && Math.abs(turn(S.pts.C, S.pts.T)) < 9 * RAD,
  },
  watch("becomes", "As $C$ reaches $T$, the line $CT$ becomes the tangent.", S => {
    altBoard(S)
    if (Math.abs(turn(S.pts.C, S.pts.T)) > 9 * RAD) S.pts.C = S.pts.T + Math.sign(turn(S.pts.T, S.pts.C) || 1) * 5 * RAD
    S.pulseSegs = new Set(["CT"])
    look(S, ["letters", "arcs", "values"])
  }, 2.6),
  watch("never-changed", "The angle at $C$ never changed: same segment.", S => {
    altBoard(S)
    if (Math.abs(turn(S.pts.C, S.pts.T)) > 9 * RAD) S.pts.C = S.pts.T + Math.sign(turn(S.pts.T, S.pts.C) || 1) * 5 * RAD
    S.pulse = new Set(["C"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),
  watch("all-along", "So it was the tangent angle all along.", S => {
    altBoard(S)
    if (Math.abs(turn(S.pts.C, S.pts.T)) > 9 * RAD) S.pts.C = S.pts.T + Math.sign(turn(S.pts.T, S.pts.C) || 1) * 5 * RAD
    S.pulse = new Set(["tc", "C"])
    look(S, ["letters", "arcs", "values"])
  }, 2.2),

  // ── 8. Use it ──
  {
    id: "alt-q1",
    say: "Find $x$.",
    enter: S => {
      base(S, ["O", "T", "A", "C"])
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      tangentAt(S, 90)
      S.tlineFollow = null
      place(S, { A: -10, C: -150 })
      S.showPts = ["T", "A", "C"]
      setSegs(S, [["T", "A"], ["C", "T"], ["C", "A"]])
      S.angles = [tanChord("tc", "T", "A", "C"), atCirc("C", "C", "T", "A")]
      given(S, { C: BLUE }, "tc", "x")
      ask(S, ["x =", { box: true }], 50, {
        deg: true,
        help: (S2, t) => {
          S2.tints = [{ a: "T", b: "A", side: "C", color: BLUE }]; S2.vis.tints.t = 1
          S2.pulse = new Set(["tc", "C"])
          if (t >= 2) remind(S2, "\\text{Alternate segment theorem}")
        },
        onRight: S2 => solved(S2, "tc"),
      })
    },
    done: inputRight,
    walk: [
      { say: "$x$ is between the tangent and the chord $TA$.", show: S => { S.pulse = new Set(["tc"]); S.pulseSegs = new Set(["TA"]) } },
      { say: "Angle $C$ is in the alternate segment: on the other side of the chord.", show: S => { S.pulseSegs = new Set(); S.tints = [{ a: "T", b: "A", side: "C", color: BLUE }]; S.vis.tints.t = 1; S.pulse = new Set(["C"]) } },
      { say: "The alternate segment theorem says they're equal. So $x$ is $50^\\circ$.", tex: `x = ${c(GREEN, deg(50))}`, show: S => uncover(S, "tc") },
    ],
  },
  {
    id: "alt-q2",
    say: "Find angle $PQS$.",
    enter: S => {
      examPQRS(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      given(S, { SPB: BLUE, PSQ: ORANGE }, "PQS")
      ask(S, [Q, "=", { box: true }], 37, {
        deg: true,
        help: (S2, t) => {
          S2.tints = [{ a: "P", b: "S", side: "Q", color: BLUE }]; S2.vis.tints.t = 1
          S2.pulse = new Set(["SPB", "PQS"])
          if (t >= 2) remind(S2, "\\text{Alternate segment theorem}")
        },
        onRight: S2 => solved(S2, "PQS"),
      })
    },
    done: inputRight,
    walk: [
      { say: "Angle $SPB$ is between the tangent and the chord $PS$.", show: S => { S.pulse = new Set(["SPB"]); S.pulseSegs = new Set(["SP"]) } },
      { say: "Angle $PQS$ is in the alternate segment.", show: S => { S.pulseSegs = new Set(); S.tints = [{ a: "P", b: "S", side: "Q", color: BLUE }]; S.vis.tints.t = 1; S.pulse = new Set(["PQS"]) } },
      { say: "So they're equal: angle $PQS$ is $37^\\circ$.", tex: `\\angle PQS = ${c(GREEN, deg(37))}`, show: S => uncover(S, "PQS") },
    ],
  },
  {
    id: "alt-q3",
    say: "Now find angle $QRS$.",
    enter: S => {
      examPQRS(S)
      look(S, ["letters", "arcs", "values", "line", "keypad"])
      given(S, { SPB: BLUE, PSQ: ORANGE, PQS: BLUE }, "QRS")
      ask(S, [Q, "=", { box: true }], 122, {
        deg: true,
        help: (S2, t) => {
          reveal(S2, "QPS"); S2.fixed.QPS = NEUTRAL; S2.label.QPS = "?"
          S2.fills = [{ pts: ["P", "Q", "S"], color: BLUE }]
          if (t >= 2) { S2.pulse = new Set(["QPS", "QRS"]); remind(S2, `\\angle QPS + ${Q} = ${c(GREEN, deg(180))}`) }
        },
        onRight: S2 => solved(S2, "QRS"),
      })
    },
    done: inputRight,
    walk: [
      { say: "In triangle $PQS$, angle $QPS$ is what's left of $180^\\circ$.", tex: `\\angle QPS = 180^\\circ - 37^\\circ - 85^\\circ = 58^\\circ`, show: S => { reveal(S, "QPS"); S.fixed.QPS = NEUTRAL; delete S.label.QPS; S.fills = [{ pts: ["P", "Q", "S"], color: BLUE }]; S.pulse = new Set(["QPS"]) } },
      { say: "$PQRS$ is a cyclic quadrilateral. $P$ and $R$ are opposite.", show: S => { S.fills = []; S.pulse = new Set(["QPS", "QRS"]) } },
      { say: "Opposite angles add up to $180^\\circ$. So angle $QRS$ is $122^\\circ$.", tex: `\\angle QRS = 180^\\circ - 58^\\circ = ${c(GREEN, deg(122))}`, show: S => uncover(S, "QRS") },
    ],
  },

  // ── 9. Build to order ──
  {
    id: "make-40",
    say: "Make the tangent angle $40^\\circ$.",
    enter: S => {
      base(S, ["O", "T", "A"])
      tangentAt(S, 90)
      S.tlineFollow = null
      place(S, { A: 30 })
      S.showPts = ["T", "A"]; setSegs(S, [["T", "A"]])
      S.angles = [tanChord("tc", "T", "A")]
      S.movable = ["A"]; S.snaps = { name: "A", at: [10 * RAD, 170 * RAD] }; S.mode = "slide"
      look(S, ["letters", "arcs", "values"])
    },
    done: S => S.locked,
  },
  {
    id: "make-110",
    say: "Move $D$ to make angle $A$ $110^\\circ$. Watch $C$.",
    enter: S => {
      quadBoard(S, "AC")
      place(S, { A: 200, B: 270, C: 10, D: 100 })
      S.lineFn = pairLine("A", "C")
      S.movable = ["D"]; S.minGap = 14; S.snaps = { name: "D", at: [130 * RAD] }; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    done: S => S.locked,
  },

  // ── 10. One you can't do ──
  {
    id: "make-both",
    say: "Make $A$ and $C$ both $100^\\circ$.",
    enter: S => {
      quadBoard(S, "AC")
      S.chips = [
        { tex: `A = ${deg(100)}`, test: S2 => quadVals(S2, QUAD).A === 100 },
        { tex: `C = ${deg(100)}`, test: S2 => quadVals(S2, QUAD).C === 100 },
      ]
      S.movable = ["B", "D"]; S.minGap = 14; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    quadBoard(S, "AC")
    look(S, ["letters", "arcs", "values"])
  }),
  watch("too-much", "$100^\\circ + 100^\\circ = 200^\\circ$.", S => {
    quadBoard(S, "AC")
    S.lineTex = `${c(BLUE, deg(100))} + ${c(ORANGE, deg(100))} = ${c(PINK, deg(200))}`
    look(S, ["letters", "arcs", "values", "line"])
  }),
  watch("always-180", "Opposite angles of a cyclic quadrilateral add up to $180^\\circ$.", S => {
    quadBoard(S, "AC")
    S.lineFn = pairLine("A", "C")
    look(S, ["letters", "arcs", "values", "line"])
  }, 2.4),
  {
    id: "end",
    say: "Move anything. The rules always hold.",
    enter: S => {
      quadBoard(S)
      S.lineFn = S2 => `${pairLine("A", "C")(S2)}, \\quad ${pairLine("B", "D")(S2).replace(/#00abfa/g, "#ff4670").replace(/#ff822c/g, "#fff067")}`
      S.movable = [...QUAD]; S.minGap = 14; S.mode = "slide"
      look(S, ["letters", "arcs", "values", "line"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── boards used by several beats ─────────────────────────────────────────

/** The quadrilateral with B and D joined to the centre, and the two centre angles. */
function whyBoard(S: Scene, ids: string[]) {
  quadBoard(S, "AC")
  S.segs = [...S.segs, { id: "OB", a: "O", b: "B" }, { id: "OD", a: "O", b: "D" }]
  S.angles = [
    ...quadAngles(),
    { id: "cA", at: "O", from: "B", to: "D", avoid: "A", value: S2 => 2 * quadVals(S2, QUAD).A, r: 0.75 },
    { id: "cC", at: "O", from: "B", to: "D", avoid: "C", value: S2 => 2 * quadVals(S2, QUAD).C, r: 0.95 },
  ]
  S.fixed = { ...S.fixed, cA: BLUE, cC: ORANGE }
  only(S, ids)
}

/** P outside with both tangents drawn. */
function twoTangents(S: Scene) {
  const keep = S.free.P && Math.hypot(S.free.P[0], S.free.P[1]) <= 2.45 ? ([S.free.P[0], S.free.P[1]] as Vec) : null
  base(S, ["O", "P", "A", "B"])
  outsidePoint(S, keep ?? [2, 0.15])
  S.showPts = ["P", "A", "B"]
  setSegs(S, [["P", "A"], ["P", "B"]])
  S.tanMade = ["A", "B"]
}

/** The kite PAOB: both radii, the line OP, and the two right angles. */
function kiteBoard(S: Scene) {
  twoTangents(S)
  setSegs(S, [["P", "A"], ["P", "B"], ["O", "A"], ["O", "B"], ["O", "P"]])
  S.angles = [
    { id: "OAP", at: "A", from: "O", to: "P", value: () => 90 },
    { id: "OBP", at: "B", from: "O", to: "P", value: () => 90 },
  ]
  S.fixed = { OAP: NEUTRAL, OBP: NEUTRAL }
}

/** w23_11 Q15: tangents from P meeting at 38 degrees. */
function examTangents(S: Scene) {
  base(S, ["O", "P", "A", "B"])
  const k = 1 / Math.sin(19 * RAD)
  outsidePoint(S, [k, 0])
  S.showPts = ["P", "A", "B"]
  setSegs(S, [["P", "A"], ["P", "B"], ["A", "B"]])
  S.angles = [
    { id: "APB", at: "P", from: "A", to: "B", value: angleP },
    { id: "PAB", at: "A", from: "P", to: "B", value: baseAngle },
    { id: "PBA", at: "B", from: "P", to: "A", value: baseAngle },
    { id: "AOB", at: "O", from: "A", to: "B", value: S2 => 2 * baseAngle(S2) },
    { id: "OAP", at: "A", from: "O", to: "P", value: () => 90, r: 0.7 },
    { id: "OBP", at: "B", from: "O", to: "P", value: () => 90, r: 0.7 },
    atCirc("ADB", "D", "A", "B"),
  ]
}

/** The tangent at T, chord TA, and (when `withC`) C in the alternate segment. */
function altBase(S: Scene, withC: boolean) {
  base(S, ["O", "T", "A", "C"])
  tangentAt(S, 90)
  S.tlineFollow = null
  if (S.pts.A === undefined || Math.abs(turn(S.pts.A, S.pts.T)) < 30 * RAD) place(S, { A: -20 })
  if (withC) {
    const arc = tcArc(S, "T", "A")
    const t = angOf(S, "T", false)
    const fwd = norm(arc.mid - t) < Math.PI
    const onSide = S.pts.C !== undefined && (fwd ? norm(S.pts.C - t) : norm(t - S.pts.C)) < arc.deg * RAD
    if (S.pts.C === undefined || onSide) S.pts.C = arc.mid + Math.PI
    if (S.ptsD.C === undefined) S.ptsD.C = S.pts.C
  }
  S.showPts = withC ? ["T", "A", "C"] : ["T", "A"]
  setSegs(S, [["T", "A"]])
}

/** The full alternate-segment figure with both angles. */
function altBoard(S: Scene) {
  altBase(S, true)
  setSegs(S, [["T", "A"], ["C", "T"], ["C", "A"]])
  S.angles = [tanChord("tc", "T", "A", "C"), atCirc("C", "C", "T", "A")]
  S.fixed = { tc: BLUE, C: BLUE }
}

/** s25_22 Q14: cyclic PQRS, the tangent APB at P. */
function examPQRS(S: Scene) {
  base(S, ["O", "P", "Q", "R", "S", "A", "B"])
  tangentAt(S, 90)
  S.tlineFollow = null
  place(S, { P: 90, S: 16, R: -42, Q: -100 })
  S.free.A = onTangent(90, 1.15)
  S.free.B = onTangent(90, -1.15)
  S.showPts = ["P", "Q", "R", "S", "A", "B"]
  setSegs(S, [["P", "Q"], ["Q", "R"], ["R", "S"], ["S", "P"], ["Q", "S"]])
  S.angles = [
    { id: "SPB", at: "P", from: "B", to: "S", value: S2 => Math.round(arcDeg(S2, "P", "S", "Q") / 2) },
    atCirc("PSQ", "S", "P", "Q"),
    atCirc("PQS", "Q", "P", "S"),
    atCirc("QPS", "P", "Q", "S", { r: 0.75 }),
    atCirc("QRS", "R", "Q", "S"),
  ]
}

