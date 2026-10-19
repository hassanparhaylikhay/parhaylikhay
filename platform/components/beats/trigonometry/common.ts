/**
 * What the two trigonometry lessons' beats share: setting up the board,
 * the student's triangle, labels, the rule cards, word choices, the
 * equation lines, and the calculator questions.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import type { Vec } from "../geometry"
import { type ENode, atom, op, row, frac, eqnNode } from "../equation"
import { sigText } from "../calc"
import {
  type Scene, type VisKey, type Role, type Fn, type Pose, type SideLabel,
  GREEN, PINK, CHALK, ROLE_COL, RULE,
  resetBeat, show, say, startInput, boxNode, later, clamp,
  sideOf, thText, ratioOf, ratioText, hText, legText, labAt, armsFrame, triFrame, cardRects, layout,
} from "./scene"
import { type Question, fnOf, answerOf, answerText, hypOf, solvedEqn, solvedTex, slipsFor, startEqn, ruleNode, fromSide, nameOf } from "./solve"

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
  S.roleLabels[q.known] = s => ({ tex: `${q.kv}${unit}`, col: s.roleColours.has(q.known) ? undefined : CHALK })
  if (o.unknownLabel !== false) S.roleLabels[q.unknown] = () => ({ tex: nameOf(q), col: PINK })
  S.roleColours = o.colours === false ? new Set() : new Set([q.known, q.unknown])
}

/** The rule comes down off its card and the numbers fly into it (sin θ = O/H, then sin 30° = x/10). */
export function putNumbers(S: Scene, q: Question, delay = 0.9) {
  const fn = fnOf(q)
  const card = cardRects(S, layout(S)).find(r => r.fn === fn)?.r
  const from: Vec | undefined = card ? [(card.x0 + card.x1) / 2, (card.y0 + card.y1) / 2] : undefined
  S.alg = null
  S.eqFn = () => ruleNode(fn, from)
  S.vis.cards.t = 0
  later(S, delay, S2 => {
    S2.alg = startEqn(q)
    const from: Record<string, Vec> = {}
    const a = labAt(S2, "ang"); if (a) from.ang = a
    from.x = fromSide(S2, q.unknown)
    from.k = fromSide(S2, q.known)
    S2.eqFn = S3 => eqnNode(S3.alg!, { from })
  })
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

