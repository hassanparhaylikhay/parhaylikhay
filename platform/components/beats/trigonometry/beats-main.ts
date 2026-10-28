/**
 * Trigonometry II: finding a side, one tiny idea per beat.
 *
 * The student builds the triangle again (θ = 30°, hypotenuse 10) and the
 * opposite is missing. They pick the rule off its card; it comes down to
 * the equation board and the numbers fly into it from the triangle:
 * sin 30° = x / 10. Then the algebra happens where they can see it. x is
 * divided by 10, so they multiply by 10: the equation is a balance, and a
 * move made on one side only tips it, so the × 10 is dragged onto the
 * equation and drops onto both sides. Why the two 10s cancel is shown with
 * a bar cut into tenths; then they tap them and the fraction closes up.
 * The calculator gives 5, half of 10, as the triangle showed in lesson I.
 *
 * Next, x underneath (sin 65° = 9 / x): bring x up first (× x, both
 * sides), then undo the sin (÷ sin 65°, both sides). Multiplying by
 * mistake is shown as a hypotenuse too short to reach its corner. Then the
 * shortcut (x and the sin swap), mixed questions on the turned and flipped
 * triangle, four real exam questions, and building a triangle worked out
 * first.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { applyParts } from "../chapter"
import { type ENode, type Eqn, atom, op, row, eqnNode, mulOne, sideVal } from "../equation"
import { sigText } from "../calc"
import type { Vec } from "../geometry"
import {
  type Scene, type Role, type Fn,
  GREEN, PINK, CHALK, ROLE_COL, RAD, DEG, RULE, sideOf,
  say, later, thText, hText, legText, ratioOf, chipRects, layout, boxNode, triFrame, numText, cornerW,
} from "./scene"
import {
  type Beat, watch, look, base, madeTri, armsBoard, triBoard, UPRIGHT, inputRight, c, TRI, names,
  cardsTap, qBoard, putNumbers, numbersIn, askCalc, calcWalk, showAnswer,
  nameRole, tapFor, tapRole, askValue, typeWalk,
} from "./common"
import {
  type Question, fnOf, answerOf, answerText, kFac, xFac, fnFac, startEqn, solvedEqn,
  startSolve, solved, afterFirstMove, nameOf,
} from "./solve"

// ── the questions ────────────────────────────────────────────────────────

const q = (id: string, th: number, at: "V" | "P", known: Role, kv: number, unknown: Role, more: Partial<Question> = {}): Question =>
  ({ id, th, at, known, kv, unknown, ...more })

const Q30 = q("q30", 30, "V", "H", 10, "O")
const Q40 = q("q40", 40, "V", "H", 9, "O")
const Q55 = q("q55", 55, "V", "H", 8, "A")
const Q35 = q("q35", 35, "V", "A", 6, "O")
const Q65 = q("q65", 65, "V", "O", 9, "H")
const QU1 = q("qu1", 40, "V", "A", 7, "H")
const QU2 = q("qu2", 25, "V", "O", 3, "A")
/** θ = 40°, the opposite must be 6: the hypotenuse is worked out first. */
const MAKE = q("make", 40, "V", "O", 6, "H")

/** Mixed questions on the triangle turned and flipped (θ sometimes at the top). */
const ANY: Question[] = [
  q("any-a", 48, "V", "H", 11, "O", { pose: { phi: 180, s: -1, at: [0, 0] } }),
  q("any-b", 62, "P", "O", 5, "A", { pose: { phi: 0, s: -1, at: [0, 0] } }),
  q("any-c", 21, "V", "A", 14, "H", { pose: { phi: 90, s: -1, at: [0, 0] } }),
  q("any-d", 33, "P", "H", 7.5, "A", { pose: { phi: -25, s: 1, at: [0, 0] } }),
]

// ── exam questions (from the past papers) ────────────────────────────────

/** A point given on the board (world units) put into the triangle's flat frame. */
function flat(pose: { phi: number; s: number }, w: Vec): Vec {
  const a = pose.phi * RAD
  const x = w[0] * Math.cos(a) + w[1] * Math.sin(a)
  const y = (-w[0] * Math.sin(a) + w[1] * Math.cos(a)) / pose.s
  return [x, y]
}

/** 4024/22/M/J/17 Q6(a): right angle at P, angle PRQ = 38°, RQ = 12 cm. Calculate PQ. */
const EX1: Question = q("ex1", 38, "V", "H", 12, "O", {
  name: "PQ", unit: "cm", pose: { phi: 90, s: -1, at: [0, 0] },
  letters: { V: "R", F: "P", P: "Q" },
})

/** 4024/21/M/J/19 Q5(b)(i): trapezium PQRS, angle SPQ = 90°, SQ = 15 cm, QR = 11 cm, angle PSQ = 58°. Calculate PS. */
const EX2: Question = (() => {
  const pose = { phi: 90, s: -1, at: [0, 0] as Vec }
  const PS = 15 * Math.cos(58 * RAD), PQ = 15 * Math.sin(58 * RAD)
  const Rx = PQ - Math.sqrt(11 * 11 - PS * PS)
  return q("ex2", 58, "V", "H", 15, "A", {
    name: "PS", unit: "cm", pose, inside: true,
    letters: { V: "S", F: "P", P: "Q", R: "R" },
    extra: { pts: { R: flat(pose, [Rx, 0]) }, segs: [["V", "R"], ["R", "P"]], fills: [], labels: [{ a: "R", b: "P", tex: "11" }] },
    regions: [{ id: "PQS", pts: ["V", "F", "P"] }, { id: "QRS", pts: ["V", "R", "P"] }],
  })
})()

/** 4024/22/M/J/14 Q5(a): a frame on a wall; angle BAC = 35°, angle BCA = 90°, AC = 64 cm. Calculate AB. */
const EX3: Question = (() => {
  const pose = { phi: -55, s: -1, at: [0, 0] as Vec }
  const AB = 64 / Math.cos(35 * RAD)
  const C: Vec = [64 * Math.sin(35 * RAD), -64 * Math.cos(35 * RAD)]
  // the paper's figure is not to scale: the sign is drawn narrower than its 80 cm, so the triangle that matters is bigger
  const D: Vec = [C[0] + 52, C[1]]
  const pts: Record<string, Vec> = {
    D: flat(pose, D),
    E: flat(pose, [D[0] - 4, D[1] - 30]),
    G: flat(pose, [C[0] + 8, C[1] - 30]),
    W0: flat(pose, [0, 8]),
    W1: flat(pose, [0, -AB - 6]),
  }
  return q("ex3", 35, "V", "A", 64, "H", {
    name: "AB", unit: "cm", pose, inside: true,
    letters: { V: "A", F: "C", P: "B", D: "D" },
    regions: [{ id: "ABC", pts: ["V", "F", "P"] }, { id: "ACD", pts: ["V", "F", "D"] }, { id: "sign", pts: ["F", "D", "E", "G"] }],
    extra: {
      pts, segs: [["W0", "W1"], ["F", "D"], ["V", "D"], ["D", "E"], ["E", "G"], ["G", "F"]],
      fills: [{ pts: ["F", "D", "E", "G"], col: CHALK, op: 0.1 }],
      labels: [{ a: "F", b: "D", tex: "80" }],
    },
  })
})()

/** 4024/22/M/J/20 Q3(b): a light L is 8 m up a wall; a ladder from Q makes 70° with the ground. Calculate QL. */
const EX4: Question = (() => {
  const h = 8 / Math.sin(70 * RAD)
  const Bx = h * Math.cos(70 * RAD)
  const pts: Record<string, Vec> = { G0: [-3, 0], B2: [Bx + 6, 0], B3: [Bx + 6, 11], B4: [Bx, 11] }
  return q("ex4", 70, "V", "O", 8, "H", {
    name: "QL", unit: "m", pose: { ...UPRIGHT, at: [0, 0] },
    letters: { V: "Q", F: "B", P: "L" },
    extra: { pts, segs: [["G0", "V"], ["F", "B2"], ["B2", "B3"], ["B3", "B4"], ["B4", "P"]], fills: [{ pts: ["F", "B2", "B3", "B4"], col: CHALK, op: 0.07 }] },
  })
})()

// ── boards ───────────────────────────────────────────────────────────────

/** The 6, 8, 10 triangle Pythagoras has just solved. */
function pythBoard(S: Scene) {
  base(S)
  triBoard(S)
  madeTri(S, { th: Math.atan2(6, 8) * DEG, h: 10 })
  S.angText = null
}

/** One side and one angle: the hypotenuse is 10, the angle 30°, the opposite missing. */
function oneAngleBoard(S: Scene) {
  base(S)
  triBoard(S)
  madeTri(S, { th: 30, h: 10 })
  S.angText = thText
  S.roleLabels = { H: () => ({ tex: "10" }), O: () => ({ tex: "?", col: PINK }) }
  S.roleColours = new Set(["H"])
}

/** The student's triangle inside its angle (θ = 30°, hypotenuse 10), for naming its sides. */
function nameBoard(S: Scene) {
  base(S)
  armsBoard(S, 12)
  madeTri(S, { th: 30, h: 10 })
  S.angText = thText
}

/** The triangle framed on its own, its sides named, with the rule cards beneath. */
function rulesBoard(S: Scene) {
  base(S)
  madeTri(S, { th: 30, h: 10 })
  triBoard(S)
  names(S)
  S.angText = () => "\\theta"
  S.cards = (["sin", "cos", "tan"] as Fn[]).map(fn => ({ fn, lit: false }))
}

/** The first question on the student's own triangle, inside its angle (θ = 30°, hypotenuse 10). */
function firstBoard(S: Scene, o: { x?: boolean } = {}) {
  base(S)
  armsBoard(S, 12)
  madeTri(S, { th: 30, h: 10 })
  S.angText = thText
  S.roleLabels = { H: () => ({ tex: "10" }) }
  if (o.x !== false) S.roleLabels.O = () => ({ tex: "x", col: PINK })
  S.roleColours = new Set(["O", "A", "H"])
}

/**
 * The shop-sign question, once the right-angled triangle is found: the view
 * closes in on triangle ABC and the rest of the frame fades to a faint
 * outline, so the triangle is big and its 64 cm is plainly on AC.
 */
function focusABC(S: Scene) {
  S.frameFn = s => {
    const ps = (["V", "F", "P"] as const).map(n => cornerW(s, n, false))
    const xs = ps.map(p => p[0]), ys = ps.map(p => p[1])
    const m = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) * 0.16
    return { x0: Math.min(...xs) - m, x1: Math.max(...xs) + m, y0: Math.min(...ys) - m, y1: Math.max(...ys) + m }
  }
  S.vis.extra.t = 0.13
  S.letters = { V: "A", F: "C", P: "B" }
  S.regionLit = null
}

/** A question's board: the triangle with its numbers. */
function board(S: Scene, Q: Question, o: { colours?: boolean } = {}) {
  base(S)
  qBoard(S, Q, { colours: o.colours })
}

// ── beat makers ──────────────────────────────────────────────────────────

/** Which rule? The cards come up; the right one comes down as the equation. */
function ruleBeat(id: string, text: string, Q: Question, o: { colours?: boolean; boardFn?: (S: Scene) => void; put?: boolean; after?: (S: Scene) => void } = {}): Beat {
  const fn = fnOf(Q)
  // put: false when the next beat puts the numbers in, slowly, on its own
  const put = o.put !== false
  return {
    id,
    say: text,
    enter: S => {
      if (o.boardFn) o.boardFn(S)
      else board(S, Q, { colours: o.colours })
      cardsTap(S, fn, S2 => {
        S2.roleColours = new Set(["O", "A", "H"])
        if (put) later(S2, 0.5, S3 => putNumbers(S3, Q, 0.9))
      }, S2 => { S2.roleColours = new Set(["O", "A", "H"]); S2.roleLabels = { ...S2.roleLabels, ...nameHints(Q) } })
      // the equation's band opens when the rule comes down (putNumbers), so the figure has the room till then
      look(S, [...TRI, "letters", "extra", "cards"])
      o.after?.(S)
    },
    done: S => S.got.has("rule") && (!put || !!S.alg),
    advanceAfter: put ? 1800 : 1200,
  }
}

/** After a wrong card: each side says its name beside its number. */
function nameHints(Q: Question): Scene["roleLabels"] {
  const unit = Q.unit ? `\\text{ ${Q.unit}}` : ""
  const out: Scene["roleLabels"] = {}
  out[Q.known] = () => ({ tex: `${c(ROLE_COL[Q.known], Q.known)}: ${Q.kv}${unit}` })
  out[Q.unknown] = () => ({ tex: `${c(ROLE_COL[Q.unknown], Q.unknown)}: ${c(PINK, nameOf(Q))}` })
  return out
}

/** Get x on its own: the chips are dealt and the student makes the moves. */
function solveBeat(id: string, text: string, Q: Question, o: { boardFn?: (S: Scene) => void; swap?: boolean; note?: string; after?: (S: Scene) => void } = {}): Beat {
  return {
    id,
    say: text,
    enter: S => {
      if (o.boardFn) o.boardFn(S)
      else board(S, Q)
      S.roleColours = new Set(["O", "A", "H"])
      // the same ids as the equation already on the board, so it carries on without a jump
      numbersIn(S, Q)
      startSolve(S, Q, { allowSwap: o.swap })
      if (o.note) say(S, o.note, "calm", 600)
      look(S, [...TRI, "letters", "extra", "eq", "chips"])
      o.after?.(S)
    },
    done: solved,
    advanceAfter: 1500,
  }
}

/** The solved line the student made, if that is what the board shows; otherwise a fresh one. */
function solvedOr(prev: Eqn | null, Q: Question): Eqn {
  const ok = prev && prev.L.num.length === 1 && !prev.L.den.length && prev.L.num[0].key === "x" && Math.abs(prev.L.num[0].v - answerOf(Q)) < 1e-9
  return ok ? prev : solvedEqn(Q)
}

/** Work it out on the calculator. */
function calcBeat(id: string, text: string, Q: Question, o: { boardFn?: (S: Scene) => void; after?: (S: Scene) => void; then?: (S: Scene) => void } = {}): Beat {
  return {
    id,
    say: text,
    enter: S => {
      const prev = S.alg
      if (o.boardFn) o.boardFn(S)
      else board(S, Q)
      // the triangle framed on its own, so it stays big beside the keypad
      S.frameFn = triFrame
      S.roleColours = new Set(["O", "A", "H"])
      S.alg = solvedOr(prev, Q)
      askCalc(S, Q, { keepAlg: true })
      const right = S.input!.onRight
      S.input!.onRight = S2 => { right?.(S2); o.after?.(S2) }
      look(S, [...TRI, "letters", "extra", "eq", "keypad"])
      o.then?.(S)
    },
    done: inputRight,
    advanceAfter: 2200,
    walk: calcWalk(Q),
  }
}

/** Three beats for one question: which rule, get x on its own, work it out. */
function question(prefix: string, Q: Question, ruleText: string, o: { swap?: boolean; colours?: boolean } = {}): Beat[] {
  return [
    ruleBeat(`${prefix}-rule`, ruleText, Q, { colours: o.colours }),
    solveBeat(`${prefix}-solve`, `Get $${nameOf(Q)}$ on its own.`, Q, { swap: o.swap }),
    calcBeat(`${prefix}-calc`, "Work it out.", Q),
  ]
}

// ── the first question, beat by beat ─────────────────────────────────────

/** The first question's equation as it is when a beat opens on it. */
function firstEqn(S: Scene, stage: "start" | "both" | "solved") {
  const Q = Q30
  if (stage === "start") S.alg = startEqn(Q)
  else if (stage === "both") {
    const k = kFac(Q)
    S.alg = { L: { num: [{ ...k, id: "m1L.k" }, fnFac(Q)], den: [] }, R: { num: [{ ...k, id: "m1R.k" }, xFac(Q)], den: [k] } }
  } else S.alg = solvedEqn(Q)
}

/** The × 10 chip, shown but not yet to be dragged. */
function showChip(S: Scene, Q: Question, kind: "mul" | "div" = "mul", fac = kFac(Q)) {
  const tex = fac.key === "x" ? c(PINK, nameOf(Q)) : fac.key === "k" ? c(ROLE_COL[Q.known], String(Q.kv)) : fac.tex
  S.chips = [{ id: `${kind}-${fac.id}`, kind, fac, tex: `${kind === "mul" ? "\\times" : "\\div"} ${tex}` }]
}

/** The middle of the chip tray, where a chip sits. */
function chipAt(S: Scene): Vec {
  const r = chipRects(S, layout(S))[0]?.r
  return r ? [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2] : [S.w / 2, S.h * 0.75]
}

/** The equation tips when its two sides are not equal. */
function balanceTick(S: Scene) {
  const e = S.alg
  if (!e) return
  const l = sideVal(e.L), r = sideVal(e.R)
  S.eq.tilt.t = Math.abs(l - r) < 1e-9 * Math.max(1, Math.abs(l)) ? 0 : r > l ? 7 : -7
}

// ── the lesson ───────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. Sides and angles ──
  {
    id: "pyth",
    say: "Pythagoras finds a missing side from the other two.",
    enter: S => {
      pythBoard(S)
      S.roleLabels = {
        O: () => ({ tex: "6", col: CHALK }),
        A: () => ({ tex: "8", col: CHALK }),
        H: s => (s.got.has("found") ? { tex: "10", col: GREEN } : { tex: "?", col: PINK }),
      }
      later(S, 1.2, S2 => { S2.got.add("found"); S2.roleColours = new Set(["H"]); S2.touched = { kind: "side", id: "VP" }; S2.flashGood = 1 })
      S.eqFn = s => (s.got.has("found") ? row([atom("sq", "\\sqrt{6^2 + 8^2}"), op("eq", "="), atom("ten", "10", { col: GREEN })]) : null)
      look(S, ["tri", "fill", "rt", "labels", "eq"])
    },
    cta: "",
    ctaAfter: 2.6,
  },
  watch("one-angle", "But what if we only know one side and an angle?", S => {
    oneAngleBoard(S)
    look(S, TRI)
  }, 2.4),
  watch("needs-two", "Pythagoras can't do this. It needs two sides.", S => {
    oneAngleBoard(S)
    S.pulseLabs = new Set(["H"])
    look(S, TRI)
  }, 2.2),
  watch("trig-uses", "*Trigonometry* uses the angle as well.", S => {
    oneAngleBoard(S)
    S.pulseArc = true
    look(S, TRI)
  }, 2.2),
  {
    id: "turn-30",
    say: "Let's make one. Turn the arm to $30^\\circ$.",
    enter: S => {
      base(S)
      armsBoard(S, 12)
      const t = S.tri
      t.drop = 0
      t.at = "V"
      t.pose = { ...UPRIGHT, at: [0, 0] }
      t.th = 48
      t.h = 10
      S.angText = thText
      S.mode = "turn"
      S.magnet = { th: 30, within: 2.5 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - 30) < 7 ? "Close. Make it exactly $30^\\circ$." : null)
      look(S, ["arms", "arc", "labels"])
    },
    done: S => S.locked,
    advanceAfter: 1200,
  },
  {
    id: "drop-30",
    say: "Pull a line straight down to make the triangle.",
    enter: S => {
      base(S)
      armsBoard(S, 12)
      const t = S.tri
      t.drop = 0
      t.at = "V"
      t.pose = { ...UPRIGHT, at: [0, 0] }
      t.th = 30
      t.h = 10
      S.angText = thText
      S.mode = "drop"
      look(S, ["arms", "tri", "arc", "labels"])
    },
    done: S => S.tri.drop === 1,
    advanceAfter: 1300,
  },

  // ── 2. Naming the sides ──
  {
    id: "tap-H",
    say: "The longest side is the hypotenuse. Tap it.",
    enter: S => {
      nameBoard(S)
      tapFor(S, "H", () => "That one is shorter. The hypotenuse is the longest side.")
      look(S, ["arms", ...TRI])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("theta", "We call the angle $\\theta$.", S => {
    nameBoard(S)
    nameRole(S, "H")
    S.angText = () => "\\theta"
    S.pulseArc = true
    say(S, "$\\theta$ is a Greek letter, said \"theta\".", "calm", 600)
    look(S, ["arms", ...TRI])
  }),
  {
    id: "tap-O",
    say: "The side across from $\\theta$ is the *opposite*. Tap it.",
    enter: S => {
      nameBoard(S)
      nameRole(S, "H")
      S.angText = () => "\\theta"
      S.light = { from: "V", side: "FP", since: S.time }
      tapFor(S, "O", got => (got === "H" ? "That's the hypotenuse. Go across from $\\theta$." : "That side touches $\\theta$. Go across."), S2 => { S2.light = null })
      look(S, ["arms", ...TRI])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  {
    id: "tap-A",
    say: "The side next to $\\theta$ is the *adjacent*. Tap it.",
    enter: S => {
      nameBoard(S)
      nameRole(S, "H")
      nameRole(S, "O")
      S.angText = () => "\\theta"
      say(S, "Adjacent means next to.", "calm", 600)
      tapFor(S, "A", got => (got === "H" ? "That's the hypotenuse. Find the other side next to $\\theta$." : "That's the opposite. Find the side next to $\\theta$."))
      look(S, ["arms", ...TRI])
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  },
  watch("hop", "Now look from the other angle.", S => {
    nameBoard(S)
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    look(S, TRI)
  }, 2.4),
  watch("swapped", "The opposite and the adjacent swap places.", S => {
    nameBoard(S)
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    S.pulseLabs = new Set(["O", "A"])
    look(S, TRI)
  }),
  watch("stays", "The hypotenuse stays where it is.", S => {
    nameBoard(S)
    names(S)
    S.angText = () => "\\theta"
    S.tri.at = "P"
    S.pulseLabs = new Set(["H"])
    S.glow = new Set(["VP"])
    look(S, TRI)
  }),
  tapRole("tap-1", 0, 10),
  tapRole("tap-2", 1, 10),
  tapRole("tap-3", 2, 10),
  tapRole("tap-4", 3, 10),

  // ── 3. The three rules ──
  watch("three-rules", "Trigonometry has three rules.", S => {
    rulesBoard(S)
    look(S, [...TRI, "cards"])
  }, 2.2),
  watch("two-sides", "Each rule uses two of the sides.", S => {
    rulesBoard(S)
    // each card lights in turn, and its two sides glow with it
    const fns: Fn[] = ["sin", "cos", "tan"]
    fns.forEach((fn, i) => later(S, 0.5 + i * 1.3, S2 => {
      S2.cards = S2.cards.map(c2 => ({ ...c2, lit: c2.fn === fn }))
      S2.glow = new Set(RULE[fn].map(r => sideOf("V", r)))
    }))
    later(S, 0.5 + 3 * 1.3, S2 => { S2.cards = S2.cards.map(c2 => ({ ...c2, lit: false })); S2.glow = new Set() })
    look(S, [...TRI, "cards"])
  }, 4.6),
  watch("soh", "Many students remember them as SOH CAH TOA.", S => {
    rulesBoard(S)
    S.soh = S.time + 0.3
    look(S, [...TRI, "cards"])
  }, 2.8),
  ...([["rule-OA", "O", "A", "tan"], ["rule-AH", "A", "H", "cos"], ["rule-OH", "O", "H", "sin"]] as [string, Role, Role, Fn][]).map(([id, a, b, fn]): Beat => ({
    id,
    say: `Which rule uses $${a}$ and $${b}$? Tap it.`,
    enter: S => {
      rulesBoard(S)
      S.glow = new Set([sideOf("V", a), sideOf("V", b)])
      cardsTap(S, fn)
      S.soh = S.time - 10
      look(S, [...TRI, "cards"])
    },
    done: S => S.got.has("rule"),
    advanceAfter: 1300,
  })),
  watch("calc-knows", "Your calculator knows sin, cos and tan for every angle.", S => {
    rulesBoard(S)
    look(S, TRI)
  }, 2.2),
  {
    id: "type-sin30",
    say: "Type $\\sin 30$ and press $=$.",
    enter: S => {
      rulesBoard(S)
      askValue(S, 0.5, S2 => { S2.touched = { kind: "tri" }; S2.flashGood = 1 })
      look(S, [...TRI, "eq", "keypad"])
    },
    done: inputRight,
    walk: typeWalk("sin", 30, "0.5"),
  },
  watch("degrees", "Check that your own calculator is in degrees.", S => {
    rulesBoard(S)
    say(S, "Look for a small D at the top of its screen.", "calm", 600)
    look(S, TRI)
  }, 2.2),

  // ── 4. Finding a side ──
  watch("hyp-10", "The hypotenuse is $10$ cm.", S => {
    firstBoard(S, { x: false })
    S.pulseLabs = new Set(["H"])
    look(S, ["arms", ...TRI])
  }),
  watch("call-x", "This side is missing. We call it $x$.", S => {
    firstBoard(S)
    S.pulseLabs = new Set(["O"])
    look(S, ["arms", ...TRI])
  }),
  {
    id: "rule-30",
    say: "Which rule uses $O$ and $H$? Tap it.",
    enter: S => {
      firstBoard(S)
      cardsTap(S, "sin")
      look(S, ["arms", ...TRI, "cards"])
    },
    done: S => S.got.has("rule"),
    advanceAfter: 1200,
  },
  watch("put-30", "Put the numbers into the rule.", S => {
    firstBoard(S)
    putNumbers(S, Q30, 1.1, true)
    look(S, ["arms", ...TRI, "eq"])
  }, 8.2),
  watch("own-30", "Now we get $x$ on its own.", S => {
    firstBoard(S)
    firstEqn(S, "start")
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x"]) })
    look(S, ["arms", ...TRI, "eq"])
  }),
  {
    id: "dividing-30",
    say: "What is dividing $x$? Tap it.",
    enter: S => {
      firstBoard(S)
      firstEqn(S, "start")
      S.eqFn = S2 => eqnNode(S2.alg!, { pulse: S2.got.has("tapped") ? new Set(["k"]) : undefined })
      S.mode = "solve"
      S.tapAtoms = ["x", "k", "fn", "ang", "eq"]
      S.onAtom = (S2, id) => {
        if (S2.got.has("tapped")) return
        if (id === "k") { S2.got.add("tapped"); S2.touched = { kind: "eq" }; S2.flashGood = 1; say(S2, "$x$ is divided by $10$.", "calm", 600); return }
        if (id === "x") say(S2, "That's $x$ itself. Tap the number it is divided by.", "wrong", 3.4)
        else say(S2, "That is on the other side. Look under $x$.", "wrong", 3)
      }
      look(S, ["arms", ...TRI, "eq"])
    },
    done: S => S.got.has("tapped"),
    advanceAfter: 1800,
  },
  watch("undo-30", "Multiplying by $10$ undoes dividing by $10$.", S => {
    firstBoard(S)
    firstEqn(S, "start")
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["k"]) })
    showChip(S, Q30)
    look(S, ["arms", ...TRI, "eq", "chips"])
  }, 2.2),
  watch("balance", "An equation is like a balance.", S => {
    firstBoard(S)
    firstEqn(S, "start")
    S.eqFn = S2 => eqnNode(S2.alg!)
    showChip(S, Q30)
    S.eq.stand.t = 1
    later(S, 0.5, S2 => { S2.eq.tilt.t = 4 })
    later(S, 1.0, S2 => { S2.eq.tilt.t = -3 })
    later(S, 1.5, S2 => { S2.eq.tilt.t = 0 })
    look(S, ["arms", ...TRI, "eq", "chips"])
  }, 2.2),
  watch("tip", "If only one side changes, it tips.", S => {
    firstBoard(S)
    firstEqn(S, "start")
    showChip(S, Q30)
    S.eq.stand.t = 1
    S.tick = balanceTick
    let from: Record<string, Vec> = {}
    S.eqFn = S2 => eqnNode(S2.alg!, { from })
    later(S, 0.7, S2 => {
      from = { "t1R.k": chipAt(S2) }
      S2.alg = mulOne(S2.alg!, kFac(Q30), "t1", "R")
      say(S2, "Now the two sides are not equal.", "wrong", 2.6)
    })
    later(S, 3.0, S2 => {
      S2.eq.goneTo = { "t1R.k": chipAt(S2) }
      firstEqn(S2, "start")
    })
    look(S, ["arms", ...TRI, "eq", "chips"])
  }, 3.6),
  {
    id: "drag-30",
    say: "Drag $\\times 10$ onto the equation.",
    enter: S => {
      firstBoard(S)
      firstEqn(S, "start")
      S.eq.stand.t = 1
      S.tick = balanceTick
      startSolve(S, Q30, { single: true, tapCancel: true })
      S.onChip = (S2, id, at) => {
        // the first time: the move lands on both sides, and stops there
        const k = kFac(Q30)
        S2.solve!.from = { "m1L.k": at, "m1R.k": at }
        S2.alg = { L: { num: [{ ...k, id: "m1L.k" }, fnFac(Q30)], den: [] }, R: { num: [{ ...k, id: "m1R.k" }, xFac(Q30)], den: [k] } }
        S2.chips = []
        S2.got.add("both")
        S2.touched = { kind: "eq" }
        say(S2, "Both sides get $\\times 10$. It stays level.", "calm", 600)
        void id
      }
      look(S, ["arms", ...TRI, "eq", "chips"])
    },
    done: S => S.got.has("both"),
    advanceAfter: 2400,
  },
  watch("why-cancel", "Why do the two $10$s cancel?", S => {
    firstBoard(S)
    firstEqn(S, "both")
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["m1R.k", "k"]) })
    look(S, ["arms", ...TRI, "eq"])
  }),
  watch("tenth", "$\\frac{x}{10}$ is one tenth of $x$.", S => {
    firstBoard(S)
    firstEqn(S, "both")
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x", "k"]) })
    S.tenth = { since: S.time, ten: null }
    show(S, ["eq", "tenth"])
  }, 2.2),
  watch("ten-tenths", "Ten tenths make the whole $x$ again.", S => {
    firstBoard(S)
    firstEqn(S, "both")
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["m1R.k"]) })
    S.tenth = { since: S.time - 5, ten: S.time + 0.5 }
    show(S, ["eq", "tenth"])
  }, 3.2),
  {
    id: "cancel-30",
    say: "Tap the two $10$s to cancel them.",
    enter: S => {
      firstBoard(S)
      firstEqn(S, "both")
      startSolve(S, Q30, { tapCancel: true })
      S.chips = []
      // straight to the tap: the pair breathes
      S.solve!.busy = true
      later(S, 0.1, S2 => {
        const v = S2.solve!
        v.pulse = new Set(["m1R.k", "k"])
        S2.tapAtoms = ["m1R.k", "k"]
        S2.onAtom = S3 => {
          S3.tapAtoms = []
          S3.onAtom = null
          v.pulse = new Set()
          for (const id of ["m1R.k", "k"]) v.strike[id] = S3.time
          S3.flashGood = 0.8
          later(S3, 0.75, S4 => {
            S4.alg = { L: S4.alg!.L, R: { num: [xFac(Q30)], den: [] } }
            v.strike = {}
            later(S4, 0.6, S5 => { S5.alg = { L: S5.alg!.R, R: S5.alg!.L }; later(S5, 0.6, () => { v.stage = 2; v.busy = false }) })
          })
        }
      })
      look(S, ["arms", ...TRI, "eq"])
    },
    done: solved,
    advanceAfter: 1400,
  },
  watch("alone-30", "Now $x$ is on its own.", S => {
    const prev = S.alg
    firstBoard(S)
    S.alg = solvedOr(prev, Q30)
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x", "m1L.x"]) })
    look(S, ["arms", ...TRI, "eq"])
  }),
  calcBeat("calc-30", "Type the right side into the calculator.", Q30, { boardFn: S => firstBoard(S) }),
  watch("half-30", "$5$ is half of $10$, just as we saw.", S => {
    const prev = S.alg
    firstBoard(S)
    showAnswer(S, Q30)
    S.alg = solvedOr(prev, Q30)
    S.eqFn = S2 => eqnNode(S2.alg!, { tail: [op("eq3", "="), atom("ans", "5", { col: GREEN })] })
    S.halves = S.time + 0.3
    look(S, ["arms", ...TRI, "eq"])
  }, 3.4),

  // the second: θ = 40°, hypotenuse 9
  {
    id: "turn-40",
    say: "Turn $\\theta$ to $40^\\circ$.",
    enter: S => {
      base(S)
      armsBoard(S, 12)
      madeTri(S, { th: 30, h: 9 })
      S.angText = thText
      S.roleLabels = { H: () => ({ tex: "9" }), O: () => ({ tex: "x", col: PINK }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "turn"
      S.magnet = { th: 40, within: 2.5 }
      S.releaseNote = S2 => (Math.abs(S2.tri.th - 40) < 7 ? "Close. Make it exactly $40^\\circ$." : null)
      look(S, ["arms", ...TRI])
    },
    done: S => S.locked,
    advanceAfter: 1200,
  },
  ruleBeat("rule-40", "The hypotenuse is $9$. Which rule do we need?", Q40, { colours: true }),
  solveBeat("solve-40", "Get $x$ on its own.", Q40),
  calcBeat("calc-40", "Now type it into the calculator.", Q40),
  {
    id: "round-40",
    say: "Lengths are given to $3$ significant figures.",
    enter: S => {
      base(S)
      qBoard(S, Q40)
      showAnswer(S, Q40)
      S.flashGood = 0
      const digits = "5.785088".split("")
      let phase = 0
      later(S, 0.9, S2 => { phase = 1; say(S2, "Keep the first three figures.", "calm", 2.4) })
      later(S, 2.4, S2 => { phase = 2; say(S2, "The next figure is $5$, so the $8$ rounds up.", "calm", 3) })
      later(S, 4.0, () => { phase = 3 })
      S.eqFn = () => {
        const items: ENode[] = []
        digits.forEach((d, i) => {
          const sig = i === 0 || i === 2 || i === 3
          const next = i === 4
          const gone = phase >= 3 && i >= 4
          if (gone) return
          let tex = d, col = CHALK
          if (phase >= 1 && sig) col = GREEN
          if (phase >= 2 && next) col = "#fff067"
          if (phase >= 3 && i === 3) tex = "9"
          items.push(atom(`d${i}`, tex, { col, pulse: phase === 2 && next }))
        })
        if (phase < 3) items.push(atom("dots", "\\ldots", { col: CHALK }))
        return row([atom("x", "x", { col: PINK }), op("eq", "="), row(items, 0)])
      }
      look(S, ["arms", ...TRI, "eq"])
    },
    cta: "",
    ctaAfter: 4.6,
  },

  // the third: the adjacent missing (cos)
  watch("adj-missing", "Now the adjacent is missing.", S => {
    board(S, Q55)
    S.roleColours = new Set(["O", "A", "H"])
    S.pulseLabs = new Set(["A"])
    look(S, TRI)
  }),
  ruleBeat("rule-55", "Which rule? Tap it.", Q55, { colours: true }),
  solveBeat("solve-55", "Get $x$ on its own.", Q55),
  calcBeat("calc-55", "Work it out.", Q55),

  // the fourth: the adjacent known (tan)
  ruleBeat("rule-35", "Now we know the adjacent. Which rule?", Q35, { colours: true }),
  solveBeat("solve-35", "Get $x$ on its own.", Q35),
  calcBeat("calc-35", "Work it out.", Q35, { after: S => say(S, "The $0$ in $4.20$ counts as a figure.", "calm", 4) }),

  watch("steps", "Questions like this all follow the same five steps.", S => {
    board(S, Q35)
    S.roleColours = new Set(["O", "A", "H"])
    S.stepsCard = S.time
    show(S, [])
  }, 3.2),

  // ── 5. When x is underneath ──
  watch("hyp-missing", "Now the hypotenuse is missing.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    S.pulseLabs = new Set(["H"])
    look(S, TRI)
  }),
  ruleBeat("rule-65", "Which rule? Tap it.", Q65, { colours: true, put: false }),
  watch("put-65", "Put the numbers in.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    putNumbers(S, Q65, 0.7, true)
    look(S, [...TRI, "eq"])
  }, 7.8),
  watch("under", "This time $x$ is underneath.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    S.alg = startEqn(Q65)
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x"]) })
    look(S, [...TRI, "eq"])
  }),
  watch("bring-up", "First we bring $x$ up from underneath.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    S.alg = startEqn(Q65)
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x"]) })
    showChip(S, Q65, "mul", xFac(Q65))
    look(S, [...TRI, "eq", "chips"])
  }),
  {
    id: "drag-x",
    say: "Drag $\\times x$ onto the equation.",
    enter: S => {
      board(S, Q65)
      S.roleColours = new Set(["O", "A", "H"])
      S.alg = startEqn(Q65)
      startSolve(S, Q65, { single: true })
      look(S, [...TRI, "eq", "chips"])
    },
    done: S => S.solve?.stage === 1 && !S.solve.busy,
    advanceAfter: 1200,
  },
  {
    id: "multiplying-65",
    say: "What is multiplying $x$ now? Tap it.",
    enter: S => {
      board(S, Q65)
      S.roleColours = new Set(["O", "A", "H"])
      if (!(S.alg && S.alg.L.num.length === 2 && !S.alg.R.den.length)) S.alg = afterFirstMove(Q65)
      const xId = S.alg.L.num.find(f => f.key === "x")!.id
      S.eqFn = S2 => eqnNode(S2.alg!, { pulse: S2.got.has("tapped") ? new Set(["fn", "ang"]) : undefined })
      S.mode = "solve"
      S.tapAtoms = [xId, "fn", "ang", "k", "eq"]
      S.onAtom = (S2, id) => {
        if (S2.got.has("tapped")) return
        if (id === "fn" || id === "ang") { S2.got.add("tapped"); S2.touched = { kind: "eq" }; S2.flashGood = 1; say(S2, "$x$ is multiplied by $\\sin 65^\\circ$.", "calm", 600); return }
        if (id === xId) say(S2, "That's $x$ itself. Tap what it is multiplied by.", "wrong", 3.4)
        else say(S2, "That is on the other side. Look next to $x$.", "wrong", 3)
      }
      look(S, [...TRI, "eq"])
    },
    done: S => S.got.has("tapped"),
    advanceAfter: 1800,
  },
  {
    id: "undo-65",
    say: "Now undo it.",
    enter: S => {
      board(S, Q65)
      S.roleColours = new Set(["O", "A", "H"])
      if (!(S.alg && S.alg.L.num.length === 2 && !S.alg.R.den.length)) S.alg = afterFirstMove(Q65)
      startSolve(S, Q65, { stage: 1 })
      look(S, [...TRI, "eq", "chips"])
    },
    done: solved,
    advanceAfter: 1500,
  },
  calcBeat("calc-65", "Work it out.", Q65),
  watch("longest", "$9.93$ is longer than $9$, just as the hypotenuse should be.", S => {
    const prev = S.alg
    board(S, Q65)
    showAnswer(S, Q65)
    S.flashGood = 0
    S.glow = new Set(["VP"])
    S.alg = solvedOr(prev, Q65)
    S.eqFn = S2 => eqnNode(S2.alg!, { tail: [op("eq3", "="), atom("ans", answerText(Q65), { col: GREEN })] })
    look(S, [...TRI, "eq"])
  }, 2.2),
  watch("mistake", "A common mistake is to multiply instead.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    const wrong = 9 * Math.sin(65 * RAD)
    S.eqFn = () => row([atom("x", "x", { col: PINK }), op("eq", "="), atom("k", "9", { col: ROLE_COL.O }), op("tm", "\\times"), atom("fn", "\\sin"), atom("ang", "65^\\circ"), op("eq3", "="), atom("bad", sigText(wrong, 3), { col: PINK })])
    look(S, [...TRI, "eq"])
  }, 2.2),
  watch("too-short", `A hypotenuse of $${sigText(9 * Math.sin(65 * RAD), 3)}$ is too short to reach.`, S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A"])
    S.sideColour = { VP: "#3a4046" }
    S.roleLabels = { O: () => ({ tex: "9" }) }
    S.ghost = { h: 9 * Math.sin(65 * RAD), text: "" }
    S.eqFn = () => row([atom("x", "x", { col: PINK }), op("eq", "="), atom("bad", sigText(9 * Math.sin(65 * RAD), 3), { col: PINK }), op("q", "?")])
    look(S, [...TRI, "eq"])
  }, 2.6),
  watch("shortcut", "Here is a shortcut for when $x$ is underneath.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    S.alg = startEqn(Q65)
    S.eqFn = S2 => eqnNode(S2.alg!)
    look(S, [...TRI, "eq"])
  }),
  watch("swap", "$x$ and $\\sin 65^\\circ$ swap places.", S => {
    board(S, Q65)
    S.roleColours = new Set(["O", "A", "H"])
    S.alg = startEqn(Q65)
    S.eqFn = S2 => eqnNode(S2.alg!, { pulse: new Set(["x", "fn", "ang"]) })
    later(S, 0.9, S2 => { S2.alg = { L: { num: [xFac(Q65)], den: [] }, R: { num: [kFac(Q65)], den: [fnFac(Q65)] } } })
    look(S, [...TRI, "eq"])
  }, 2.6),
  watch("same", "It gives the same answer as the two moves.", S => {
    board(S, Q65)
    showAnswer(S, Q65)
    S.flashGood = 0
    S.alg = solvedEqn(Q65)
    S.eqFn = S2 => eqnNode(S2.alg!, { tail: [op("eq3", "="), atom("ans", answerText(Q65), { col: GREEN })] })
    look(S, [...TRI, "eq"])
  }),
  ruleBeat("rule-u1", "Find $x$. Which rule?", QU1, { colours: true }),
  solveBeat("solve-u1", "Get $x$ on its own.", QU1, { swap: true, note: "Make the two moves, or drag $x$ onto $\\cos 40^\\circ$ to swap them." }),
  calcBeat("calc-u1", "Work it out.", QU1),
  ...question("u2", QU2, "Find $x$. Which rule?", { swap: true, colours: true }),

  // ── 6. Any side ──
  ...ANY.flatMap((Q, i) => question(`any${i + 1}`, Q, i === 0 ? "Find $x$. Which rule do you need?" : "Find $x$. Which rule?", { swap: true, colours: false })),

  // ── 7. Exam questions ──
  watch("ex1", "Triangle $PQR$ has a right angle at $P$.", S => {
    board(S, EX1, { colours: false })
    S.roleLabels = { H: () => ({ tex: "12\\text{ cm}" }) }
    look(S, [...TRI, "letters"])
  }, 2.2),
  ruleBeat("ex1-rule", "Calculate $PQ$. Which rule do you need?", EX1, { colours: false }),
  solveBeat("ex1-solve", "Get $PQ$ on its own.", EX1, { swap: true }),
  calcBeat("ex1-calc", "Work it out.", EX1),

  watch("ex2", "$PQRS$ is a trapezium. $SQ = 15$ cm and angle $PSQ = 58^\\circ$.", S => {
    board(S, EX2, { colours: false })
    S.roleLabels = { H: () => ({ tex: "15\\text{ cm}", inside: true }) }
    look(S, [...TRI, "letters", "extra"])
  }, 2.6),
  {
    id: "ex2-tri",
    say: "Tap the right-angled triangle.",
    enter: S => {
      board(S, EX2, { colours: false })
      S.roleLabels = { H: () => ({ tex: "15\\text{ cm}", inside: true }) }
      S.mode = "tapRegion"
      S.onRegion = (S2, id) => {
        if (S2.got.has("tri")) return
        if (id === "PQS") { S2.got.add("tri"); S2.regionLit = "PQS"; S2.pulseRt = true; S2.touched = { kind: "tri" }; S2.flashGood = 1; S2.note = null; return }
        say(S2, "That triangle has no right angle. Look for the square corner.", "wrong", 3.4)
        S2.pulseRt = true
      }
      look(S, [...TRI, "letters", "extra"])
    },
    done: S => S.got.has("tri"),
    advanceAfter: 1400,
  },
  ruleBeat("ex2-rule", "Calculate $PS$. Which rule?", EX2, { colours: false }),
  solveBeat("ex2-solve", "Get $PS$ on its own.", EX2, { swap: true }),
  calcBeat("ex2-calc", "Work it out.", EX2),

  watch("ex3", "A frame on a wall holds up a sign. Angle $BCA = 90^\\circ$.", S => {
    board(S, EX3, { colours: false })
    S.roleLabels = { A: () => ({ tex: "64\\text{ cm}", col: CHALK, inside: true }) }
    look(S, [...TRI, "letters", "extra"])
  }, 2.6),
  {
    id: "ex3-tri",
    say: "Tap the right-angled triangle.",
    enter: S => {
      board(S, EX3, { colours: false })
      S.roleLabels = { A: () => ({ tex: "64\\text{ cm}", col: CHALK, inside: true }) }
      S.mode = "tapRegion"
      S.onRegion = (S2, id) => {
        if (S2.got.has("tri")) return
        if (id === "ABC") { S2.got.add("tri"); S2.regionLit = "ABC"; S2.pulseRt = true; S2.touched = { kind: "tri" }; S2.flashGood = 1; S2.note = null; later(S2, 0.9, focusABC); return }
        say(S2, id === "sign" ? "That is the sign. Look for the square corner." : "That triangle has no right angle. Look for the square corner.", "wrong", 3.4)
        S2.pulseRt = true
      }
      look(S, [...TRI, "letters", "extra"])
    },
    done: S => S.got.has("tri"),
    advanceAfter: 2000,
  },
  ruleBeat("ex3-rule", "Calculate $AB$. Which rule?", EX3, { colours: false, after: focusABC }),
  solveBeat("ex3-solve", "Get $AB$ on its own.", EX3, { swap: true, after: focusABC }),
  calcBeat("ex3-calc", "Work it out.", EX3, { then: focusABC }),

  watch("ex4", "A ladder from $Q$ reaches a light $L$, $8$ m up a wall.", S => {
    board(S, EX4, { colours: false })
    S.roleLabels = { O: () => ({ tex: "8\\text{ m}" }) }
    look(S, [...TRI, "letters", "extra"])
  }, 2.6),
  ruleBeat("ex4-rule", "The ladder makes $70^\\circ$ with the ground. Calculate $QL$. Which rule?", EX4, { colours: false }),
  solveBeat("ex4-solve", "Get $QL$ on its own.", EX4, { swap: true }),
  calcBeat("ex4-calc", "Work it out.", EX4),

  // ── 8. Make the triangle ──
  watch("make", "Say $\\theta$ is $40^\\circ$ and we want the opposite to be $6$ cm.", S => {
    makeBoard(S)
    look(S, ["arms", ...TRI])
  }, 2.2),
  {
    id: "make-calc",
    say: "Work out the hypotenuse first.",
    enter: S => {
      makeBoard(S)
      const Q = MAKE
      S.alg = startEqn(Q)
      askCalc(S, Q, { keepAlg: true })
      // the line here is the rule with the numbers in; the answer box sits under it
      S.eqFn = S2 => {
        const inp = S2.input
        return row([eqnNode(S2.alg!), atom("gap", "\\quad"), atom("xl", "x", { col: PINK }), op("eq3", "="), inp?.state === "right" ? atom("ans", answerText(Q), { col: GREEN }) : boxNode(S2)])
      }
      look(S, ["arms", ...TRI, "eq", "keypad"])
    },
    done: inputRight,
    advanceAfter: 1800,
    walk: [
      { say: "The opposite and the hypotenuse: that is $\\sin$. So $\\sin 40^\\circ = \\frac{6}{x}$.", tex: `\\sin 40^\\circ = \\dfrac{${c(ROLE_COL.O, "6")}}{${c(PINK, "x")}}` },
      { say: "$x$ is underneath, so $x$ and $\\sin 40^\\circ$ swap.", tex: `${c(PINK, "x")} = \\dfrac{${c(ROLE_COL.O, "6")}}{\\sin 40^\\circ}` },
      { say: `That gives $${answerText(MAKE)}$.`, tex: `${c(PINK, "x")} = ${c(GREEN, answerText(MAKE))}` },
    ],
  },
  {
    id: "make-slide",
    say: "Now slide the triangle until the opposite is $6$.",
    enter: S => {
      base(S)
      armsBoard(S, 12)
      S.hMax = 11.4
      madeTri(S, { th: 40, h: 5 })
      S.angText = thText
      // from the true size (not the rounded hypotenuse), so the opposite reads 6 the moment it clicks in
      S.roleLabels = { O: s => ({ tex: numText(s.tri.h * Math.sin(40 * RAD), 2) }), H: s => ({ tex: numText(s.tri.h, 2) }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "slide"
      S.magnet = { h: 6 / Math.sin(40 * RAD), within: 0.35 }
      S.releaseNote = S2 => (Math.abs(S2.tri.h * Math.sin(40 * RAD) - 6) < 0.8 ? "Close. Make the opposite exactly $6$." : null)
      S.tick = S2 => {
        if (S2.locked && !S2.got.has("said")) {
          S2.got.add("said")
          S2.roleLabels.O = () => ({ tex: "6" })
          S2.roleLabels.H = () => ({ tex: answerText(MAKE), col: GREEN })
          say(S2, `The hypotenuse is $${answerText(MAKE)}$, as you worked out.`, "calm", 600)
        }
      }
      look(S, ["arms", ...TRI])
    },
    done: S => S.locked,
    advanceAfter: 3200,
  },
  {
    id: "end",
    say: "Play with it as long as you like.",
    enter: S => {
      base(S)
      armsBoard(S, 12)
      madeTri(S, { th: 40, h: 6 / Math.sin(40 * RAD) })
      S.angText = thText
      S.roleLabels = { O: s => ({ tex: legText(s, "O") }), A: s => ({ tex: legText(s, "A") }), H: s => ({ tex: hText(s) }) }
      S.roleColours = new Set(["O", "A", "H"])
      S.mode = "turnSlide"
      S.eqFn = S2 => row([atom("fn", "\\sin"), atom("ang", thText(S2)), op("eq", "="), atom("v", numText(ratioOf(S2, "sin"), 2), { col: GREEN })])
      look(S, ["arms", ...TRI, "eq"])
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

function makeBoard(S: Scene) {
  base(S)
  armsBoard(S, 12)
  madeTri(S, { th: 40, h: 6 / Math.sin(40 * RAD) })
  S.angText = thText
  S.roleLabels = { O: () => ({ tex: "6" }), H: () => ({ tex: "x", col: PINK }) }
  S.roleColours = new Set(["O", "A", "H"])
}

function show(S: Scene, keys: Parameters<typeof look>[1]) {
  look(S, keys)
  S.vis.board.t = 0
}

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["pyth", "Sides and angles"],
  ["tap-H", "Naming the sides"],
  ["three-rules", "The three rules"],
  ["hyp-10", "Finding a side"],
  ["hyp-missing", "When $x$ is underneath"],
  ["any1-rule", "Any side"],
  ["ex1", "Exam questions"],
  ["make", "Make the triangle"],
]
applyParts(BEATS, PARTS)

