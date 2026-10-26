/**
 * What the trigonometry lessons' beats share: setting up the board, the
 * student's angle and triangle, naming its sides, labels, the rule cards,
 * word choices, the equation lines, and the calculator questions.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import type { Vec } from "../geometry"
import { type ENode, type Fac, atom, op, row, frac, eqnNode } from "../equation"
import { sigText } from "../calc"
import {
  type Scene, type VisKey, type Role, type Fn, type Pose, type SideLabel,
  GREEN, PINK, CHALK, ROLE_COL, RULE,
  resetBeat, show, say, startInput, boxNode, later, clamp,
  sideOf, roleOf, thText, ratioOf, ratioText, hText, legText, labAt, armsFrame, triFrame, cardRects, layout,
} from "./scene"
import { type Question, fnOf, answerOf, answerText, hypOf, solvedEqn, solvedTex, slipsFor, startEqn, fromSide, nameOf, xFac, kFac } from "./solve"

export type Beat = BeatOf<Scene>

export const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`

// ── small builders ───────────────────────────────────────────────────────

export const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

export const inputRight = (S: Scene) => S.input?.state === "right"

export function look(S: Scene, keys: VisKey[]) {
  show(S, ["board", ...keys])
}

/** Start a beat: the board cleaned down; the triangle and the equation stay to glide on. */
export function base(S: Scene) {
  resetBeat(S)
}

export const UPRIGHT: Pose = { phi: 0, s: 1, at: [0, 0] }

/** The student's triangle, made, upright, looking from V. Its size and angle are kept unless given. */
export function madeTri(S: Scene, o: { th?: number; h?: number; keepPose?: boolean; keepAt?: boolean } = {}) {
  const t = S.tri
  t.drop = 1
  if (!o.keepAt) t.at = "V"
  if (!o.keepPose) t.pose = { ...UPRIGHT, at: [0, 0] }
  if (o.th !== undefined) t.th = o.th
  if (o.h !== undefined) t.h = o.h
  t.th = clamp(t.th, S.thMin, S.thMax)
  t.h = clamp(t.h, S.hMin, S.hMax)
}

/** The angle and its arms, for building and for sliding (the view holds still so sizes show). */
export function armsBoard(S: Scene, R = 10) {
  S.armR = R
  S.thMin = 12
  S.thMax = 78
  S.hMin = R * 0.25
  // short of the arm's end, so the corner and the turning handle never sit on top of each other
  S.hMax = R * 0.84
  S.frameFn = armsFrame
}

/** A board that frames the triangle itself (practice, questions). */
export function triBoard(S: Scene) {
  S.thMin = 1
  S.thMax = 89
  S.hMin = 0.1
  S.hMax = 1000
  S.frameFn = triFrame
}

/** The three names on the sides, each in its colour. */
export function names(S: Scene, roles: Role[] = ["O", "A", "H"]) {
  S.roleLabels = {}
  for (const r of roles) S.roleLabels[r] = () => ({ tex: r })
  S.roleColours = new Set(roles)
}

/** Live lengths on the sides (as shown, so they always agree with each other). */
export function lengths(S: Scene, roles: Role[] = ["O", "A", "H"]) {
  S.roleLabels = {}
  for (const r of roles) S.roleLabels[r] = (s: Scene): SideLabel => ({ tex: r === "H" ? hText(s) : legText(s, r) })
  S.roleColours = new Set(["O", "A", "H"])
}

// ── equations for lesson I ───────────────────────────────────────────────

const FN_ID: Record<Fn, string> = { sin: "fn", cos: "fn-cos", tan: "fn-tan" }

/** O / H, with the letters in their colours. */
export const lettersFrac = (fn: Fn): ENode => {
  const [a, b] = RULE[fn]
  return frac(`rb-${fn}`, atom(`r0-${fn}`, a, { col: ROLE_COL[a] }), atom(`r1-${fn}`, b, { col: ROLE_COL[b] }))
}

/** 3.65 / 7.3, live, from the sides as shown. */
export function valuesFrac(S: Scene, fn: Fn, fly = false): ENode {
  const [a, b] = RULE[fn]
  const t = (r: Role) => (r === "H" ? hText(S) : legText(S, r as "O" | "A"))
  return frac(`vb-${fn}`, atom(`v0-${fn}`, t(a), { col: ROLE_COL[a], from: fly ? labAt(S, `role-${a}`) : undefined }), atom(`v1-${fn}`, t(b), { col: ROLE_COL[b], from: fly ? labAt(S, `role-${b}`) : undefined }))
}

export const valueAtom = (S: Scene, fn: Fn) => atom(`val-${fn}`, ratioText(ratioOf(S, fn)), { col: GREEN })

/** sin θ = O / H = 0.5 (the name, the letters, the live value). */
export function namedRule(S: Scene, fn: Fn, withValue = true): ENode {
  const items: ENode[] = [atom(FN_ID[fn], `\\${fn}`), atom(`th-${fn}`, "\\theta"), op("eq", "="), lettersFrac(fn)]
  if (withValue) items.push(op("eq2", "="), valueAtom(S, fn))
  return row(items)
}

/** sin 47° = 0.73, live. */
export function liveValue(S: Scene, fn: Fn): ENode {
  return row([atom(FN_ID[fn], `\\${fn}`), atom("ang-live", thText(S)), op("eq", "="), valueAtom(S, fn)])
}

// ── the rule cards ───────────────────────────────────────────────────────

/** The three cards; a tap on the one that uses the lit sides. */
export function cardsTap(S: Scene, want: Fn, onRight?: (S: Scene) => void, wrongHelp?: (S: Scene, picked: Fn) => void) {
  S.cards = (["sin", "cos", "tan"] as Fn[]).map(fn => ({ fn, lit: false }))
  S.mode = "tapCard"
  S.onCard = (S2, fn) => {
    if (S2.cardPick?.state === "right") return
    if (fn === want) {
      S2.cardPick = { fn, state: "right", at: S2.time }
      S2.got.add("rule")
      S2.note = null
      S2.flashGood = Math.max(S2.flashGood, 0.6)
      onRight?.(S2)
      return
    }
    S2.cardPick = { fn, state: "wrong", at: S2.time }
    const [a, b] = RULE[fn]
    const [x, y] = RULE[want]
    say(S2, `$\\${fn}$ uses $${a}$ and $${b}$. Here we need $${x}$ and $${y}$.`, "wrong", 4)
    wrongHelp?.(S2, fn)
  }
}

// ── word choices ─────────────────────────────────────────────────────────

/** A few words to pick from. A guess is never wrong: "Spot on." or "Let's see." */
export function choose(S: Scene, options: string[], answer: number, guess = true) {
  S.choice = { options, answer, picked: null, state: "idle", wrongAt: -9, guess }
}

export function pick(S: Scene, k: number) {
  const ch = S.choice
  if (!ch || ch.state === "right" || (ch.guess && ch.picked !== null)) return
  ch.picked = k
  if (k === ch.answer) {
    ch.state = "right"
    say(S, ch.guess ? "Spot on." : "Yes.", "calm", 2.4)
    return
  }
  if (ch.guess) { ch.state = "wrong"; say(S, "Let's see.", "calm", 2.4); return }
  ch.state = "wrong"
  ch.wrongAt = S.time
}

export const picked = (S: Scene) => !!S.choice && S.choice.picked !== null && (S.choice.guess || S.choice.state === "right")

// ── questions on the student's triangle ──────────────────────────────────

/** Put a question's triangle on the board: its angle, its pose, the known side and the unknown. */
export function qBoard(S: Scene, q: Question, o: { colours?: boolean; unknownLabel?: boolean; letters?: boolean } = {}) {
  triBoard(S)
  const t = S.tri
  t.drop = 1
  t.at = q.at
  t.th = q.at === "V" ? q.th : 90 - q.th
  t.h = hypOf(q)
  t.pose = q.pose ? { ...q.pose, at: [q.pose.at[0], q.pose.at[1]] } : { ...UPRIGHT, at: [0, 0] }
  S.extra = q.extra ?? null
  S.regions = q.regions ?? []
  S.letters = o.letters !== false ? { ...(q.letters ?? {}) } : {}
  S.angText = () => `${q.th}^\\circ`
  S.roleLabels = {}
  const unit = q.unit ? `\\text{ ${q.unit}}` : ""
  // until the sides are named, a number is not in its side's colour (that would give the side away)
  S.roleLabels[q.known] = s => ({ tex: `${q.kv}${unit}`, col: s.roleColours.has(q.known) ? undefined : CHALK, inside: q.inside })
  if (o.unknownLabel !== false) S.roleLabels[q.unknown] = () => ({ tex: nameOf(q), col: PINK })
  S.roleColours = o.colours === false ? new Set() : new Set([q.known, q.unknown])
}

/**
 * The rule comes down off its card, then the numbers go into it one at a
 * time, slowly: the angle, then the top of the fraction, then the bottom.
 * Each one lights up on the triangle first, then flies down to the letter it
 * replaces, and the letter fades as it lands. `slow` is for the first time;
 * later questions go a little quicker. Returns how long it all takes.
 */
export function putNumbers(S: Scene, q: Question, delay = 0.9, slow = false): number {
  const fn = fnOf(q)
  const [topRole, botRole] = RULE[fn]
  const card = cardRects(S, layout(S)).find(r => r.fn === fn)?.r
  const cardAt: Vec | undefined = card ? [(card.x0 + card.x1) / 2, (card.y0 + card.y1) / 2] : undefined
  const fly = slow ? 1.35 : 1.0
  const lead = slow ? 0.6 : 0.4
  const rest = slow ? 0.3 : 0.15
  // the pieces each stage shows: letters until their number has come
  const num = (r: Role) => (r === q.unknown ? xFac(q) : kFac(q))
  const letter = (r: Role, id: string): Fac => ({ id, tex: r, col: ROLE_COL[r], key: id, v: 1 })
  let stage = 0
  let pulse = new Set<string>()
  const from: Record<string, Vec> = {}
  const node = () => eqnNode({
    L: { num: [{ id: "F", tex: "", key: "F", v: 1, parts: [{ id: "fn", tex: `\\${fn}` }, stage >= 1 ? { id: "ang", tex: `${q.th}^\\circ` } : { id: "th", tex: "\\theta" }] }], den: [] },
    R: { num: [stage >= 2 ? num(topRole) : letter(topRole, "r0")], den: [stage >= 3 ? num(botRole) : letter(botRole, "r1")] },
  }, { from, pulse, fly })
  S.alg = null
  S.vis.cards.t = 0
  S.vis.eq.t = 1
  // the rule itself comes down off its card
  if (cardAt) for (const id of ["fn", "th", "r0", "r1", "eq"]) from[id] = cardAt
  S.eqFn = node
  // one number: it lights up where it is, then flies to its letter
  const step = (t: number, n: number, light: (S: Scene) => void, go: (S: Scene) => void) => {
    later(S, t, S2 => light(S2))
    later(S, t + lead, S2 => { go(S2); stage = n })
  }
  let t = delay
  step(t, 1,
    S2 => { S2.pulseArc = true; pulse = new Set(["th"]) },
    S2 => { from.ang = labAt(S2, "ang") ?? cardAt ?? [S2.w / 2, S2.h / 2]; S2.eq.goneFade.th = fly; later(S2, fly, S3 => { S3.pulseArc = false; pulse = new Set() }) })
  t += lead + fly + rest
  const fact = (r: Role) => (r === q.unknown ? "x" : "k")
  step(t, 2,
    S2 => { S2.pulseLabs = new Set([topRole]); pulse = new Set(["r0"]) },
    S2 => { from[fact(topRole)] = fromSide(S2, topRole); S2.eq.goneFade.r0 = fly; later(S2, fly, S3 => { S3.pulseLabs = new Set(); pulse = new Set() }) })
  t += lead + fly + rest
  step(t, 3,
    S2 => { S2.pulseLabs = new Set([botRole]); pulse = new Set(["r1"]) },
    S2 => { from[fact(botRole)] = fromSide(S2, botRole); S2.eq.goneFade.r1 = fly; later(S2, fly, S3 => { S3.pulseLabs = new Set(); pulse = new Set() }) })
  t += lead + fly + rest
  // all in: the same pieces, now as the equation to solve
  later(S, t, S2 => {
    S2.alg = startEqn(q)
    S2.eqFn = S3 => eqnNode(S3.alg!, {})
  })
  return t
}

/** The equation with the numbers already in (a beat opened cold, or a later question). */
export function numbersIn(S: Scene, q: Question) {
  S.alg = startEqn(q)
  S.eqFn = S2 => eqnNode(S2.alg!, {})
}

/** The unknown found: its side says the answer, in green. */
export function showAnswer(S: Scene, q: Question) {
  const unit = q.unit ? `\\text{ ${q.unit}}` : ""
  S.roleLabels[q.unknown] = () => ({ tex: `${answerText(q)}${unit}`, col: GREEN })
  S.roleColours.add(q.unknown)
  S.touched = { kind: "side", id: sideOf(q.at, q.unknown) }
  S.flashGood = 1.2
}

/** Work it out: the solved line with the answer box at its end. */
export function askCalc(S: Scene, q: Question, o: { keepAlg?: boolean } = {}) {
  if (!o.keepAlg || !S.alg) S.alg = solvedEqn(q)
  startInput(S, {
    answer: answerOf(q), sf: 3, slips: slipsFor(q),
    onRight: S2 => showAnswer(S2, q),
    help: (S2, t) => {
      S2.solve = null
      if (t === 1) say(S2, "Type exactly what the line says.", "calm", 3)
    },
  })
  S.eqFn = S2 => {
    const inp = S2.input
    const tail: ENode[] = [op("eq3", "=")]
    if (inp?.state === "right") tail.push(atom("ans", answerText(q), { col: GREEN }))
    else tail.push(boxNode(S2))
    return eqnNode(S2.alg!, { tail })
  }
  S.mode = "none"
}

/** "Show me how" for a calculator question. */
export function calcWalk(q: Question): WalkStep<Scene>[] {
  const { rhs, keys } = solvedTex(q)
  const n = nameOf(q)
  const full = answerOf(q)
  const ans = answerText(q)
  return [
    { say: `The line says $${n} = ${rhs}$.`, tex: `${c(PINK, n)} = ${rhs}` },
    { say: `On the calculator, press ${keys}, then $=$.` },
    { say: Math.abs(full - Number(ans)) < 1e-9 ? `That gives $${ans}$.` : `That gives $${sigText(full, 7)}\\ldots$, which is $${ans}$ to $3$ significant figures.`, tex: `${c(PINK, n)} = ${c(GREEN, ans)}` },
  ]
}


// ── the student's angle and triangle (building, naming the sides) ────────

/** Just the angle: two arms from a corner, nothing dropped yet. */
export function angleOnly(S: Scene, th = 35, h = 6.5, R = 10) {
  base(S)
  armsBoard(S, R)
  const t = S.tri
  t.drop = 0
  t.at = "V"
  t.pose = { ...UPRIGHT, at: [0, 0] }
  t.th = th
  t.h = h
  S.angText = thText
}

/**
 * The student's triangle inside its angle, the arms showing. `framed`: no
 * arms, and the view fits the triangle itself (beats where nothing slides,
 * so it stays big beside the cards or the keypad).
 */
export function angleTri(S: Scene, o: { th?: number; h?: number; framed?: boolean; R?: number } = {}) {
  base(S)
  armsBoard(S, o.R ?? 10)
  madeTri(S, { th: o.th, h: o.h ?? clamp(S.tri.h, 0.45 * (o.R ?? 10), 0.84 * (o.R ?? 10)) })
  if (o.framed) triBoard(S)
  S.angText = thText
}

export const ALL: VisKey[] = ["arms", "tri", "fill", "rt", "arc", "labels"]
/** The triangle without its arms. */
export const TRI: VisKey[] = ["tri", "fill", "rt", "arc", "labels"]

/** One side named, by its role, in its colour. */
export function nameRole(S: Scene, r: Role) {
  S.roleLabels[r] = () => ({ tex: r })
  S.roleColours.add(r)
}

/** Tap a side: the right one lights and is named. */
export function tapFor(S: Scene, want: Role, wrong: (got: Role) => string, after?: (S: Scene) => void) {
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

/** The student's triangle turned and flipped, for tapping a side by its name. */
export const PRACTICE: { pose: Pose; at: "V" | "P"; want: Role }[] = [
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

export function tapRole(id: string, k: number, size = 7): Beat {
  const P = PRACTICE[k]
  return {
    id,
    say: `Tap the ${WORD[P.want]}.`,
    enter: S => {
      base(S)
      triBoard(S)
      madeTri(S, { th: clamp(S.tri.th, 32, 58), h: size })
      S.tri.pose = { ...P.pose, at: [0, 0] }
      S.tri.at = P.at
      S.angText = () => "\\theta"
      tapFor(S, P.want, got => wrongTap(P.want, got))
      look(S, TRI)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1300,
  }
}

// ── a first press on the calculator ──────────────────────────────────────

/** Type a calculation on the calculator; the box shows it, then its value. */
export function askValue(S: Scene, answer: number, onRight?: (S: Scene) => void) {
  startInput(S, { answer, sf: 3, onRight })
  S.eqFn = S2 => {
    const inp = S2.input
    const items: ENode[] = [boxNode(S2)]
    if (inp?.state === "right" && /[×÷sctSCT]/.test(inp.value)) items.push(op("eq", "="), atom("res", Math.abs(answer - Math.round(answer)) < 1e-9 ? String(Math.round(answer)) : sigText(answer, 3), { col: GREEN }))
    return row(items)
  }
}

export function typeWalk(fn: Fn, deg: number, shows: string): WalkStep<Scene>[] {
  return [
    { say: `Press $\\${fn}$, then $${String(deg).split("").join("$, $")}$.`, tex: `\\${fn}\\ ${deg}` },
    { say: `Then press $=$. It shows $${shows}$.`, tex: `\\${fn}\\ ${deg} = ${c(GREEN, shows)}` },
  ]
}
