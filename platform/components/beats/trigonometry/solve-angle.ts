/**
 * Finding an angle on the board, one move at a time, by the student.
 *
 * A question is a right-angled triangle with two sides known and an angle
 * θ wanted. Its rule, with the numbers in, is an equation like
 * sin θ = 5 / 11. To get θ on its own the sin has to be undone: sin⁻¹ is
 * dragged onto the equation and lands on both sides, so
 * sin⁻¹(sin θ) = sin⁻¹(5 / 11); sin⁻¹ and sin cancel (the student taps them
 * the first time) and θ = sin⁻¹(5 / 11) is left. A wrong inverse plays out
 * and goes back. Once the long way has been seen there is a shortcut: drag
 * the sin across the = and it becomes sin⁻¹ on the other side.
 *
 * The calculator then gives the angle, to 1 decimal place.
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { type ENode, type EAtom, atom, op, row, frac, paren, eqCentre } from "../equation"
import { sigText } from "../calc"
import {
  type Scene, type Role, type Fn, type Pose, type Chip,
  RULE, ROLE_COL, PINK, GREEN, CHALK, RAD,
  later, say, chipRects, layout, labAt, sideLabelAt, sideOf, startInput, boxNode, cardRects, angleRoom,
} from "./scene"

// ── a question ───────────────────────────────────────────────────────────

export interface AngleQ {
  id: string
  /** the corner of the flat triangle the angle is at */
  at: "V" | "P"
  /** the two sides we know, by role */
  known: Partial<Record<Role, number>>
  /** the angle's name on the board (TeX) */
  name?: string
  pose?: Pose
  letters?: Partial<Record<string, string>>
  extra?: Scene["extra"]
  regions?: { id: string; pts: string[] }[]
  unit?: string
  /** these sides have their lengths written inside the triangle (other lines crowd the outside) */
  inside?: Role[]
  /** the triangle as drawn, when the paper's figure is not to scale: its angle at the corner */
  drawTh?: number
  /** a side's length as written, when it is not the number the sum uses */
  label?: Partial<Record<Role, string>>
  /** more slips this question invites */
  slips?: { v: number; say: string }[]
}

const DEGS = 180 / Math.PI

/** The rule for the two known sides. */
export function fnA(q: AngleQ): Fn {
  const k = q.known
  if (k.H !== undefined) return k.O !== undefined ? "sin" : "cos"
  return "tan"
}

/** The rule's top and bottom: roles and numbers. */
export function topBot(q: AngleQ): [[Role, number], [Role, number]] {
  const [a, b] = RULE[fnA(q)]
  return [[a, q.known[a]!], [b, q.known[b]!]]
}

export const ratioA = (q: AngleQ) => { const [[, t], [, b]] = topBot(q); return t / b }

/** The angle itself, in degrees. */
export function truthA(q: AngleQ): number {
  const r = ratioA(q), fn = fnA(q)
  return (fn === "sin" ? Math.asin(r) : fn === "cos" ? Math.acos(r) : Math.atan(r)) * DEGS
}

/** The answer as written: 1 decimal place. */
export const answerTextA = (q: AngleQ) => truthA(q).toFixed(1)

export const nameA = (q: AngleQ) => q.name ?? "\\theta"

/** The flat triangle for a question: its angle at V and its hypotenuse. */
export function triOf(q: AngleQ): { th: number; h: number } {
  const t = truthA(q)
  const thV = q.drawTh ?? (q.at === "V" ? t : 90 - t)
  const k = q.known
  const h = k.H ?? Math.hypot(k.O ?? 0, k.A ?? 0)
  return { th: thV, h }
}

// ── the equation ─────────────────────────────────────────────────────────

/** Where the angle is being got on its own. */
export interface AngleSolve {
  q: AngleQ
  stage: "start" | "wrapped" | "done"
  /** the inverse wrapped round both sides (it may be the wrong one, for a moment) */
  inv: Fn | null
  /** the id the inverse on the right ends up with: "invR" the long way, "fn" by the shortcut */
  invId: "invR" | "fn"
  strike: Record<string, number>
  pulse: Set<string>
  from: Record<string, Vec>
  busy: boolean
  wrongs: number
  tapCancel: boolean
  single: boolean
  shortcut: boolean
  hintChip: string | null
  /** when the sin was dragged across (it lands as sin, then becomes sin⁻¹) */
  crossAt: number | null
}

export interface ALook {
  strike?: Record<string, number>
  pulse?: Set<string>
  grab?: Set<string>
  from?: Record<string, Vec>
  fly?: number
  tail?: ENode[]
}

const fnTex = (fn: Fn) => `\\${fn}`
const invTex = (fn: Fn) => `\\${fn}^{-1}`

function piece(id: string, tex: string, look: ALook, more: Partial<EAtom> = {}): EAtom {
  return atom(id, tex, {
    strike: look.strike?.[id], pulse: look.pulse?.has(id), grab: look.grab?.has(id),
    from: look.from?.[id], fly: look.from?.[id] ? look.fly : undefined, ...more,
  })
}

/** The fraction with the numbers in: 5 / 11, each in its side's colour. */
function numbersFrac(q: AngleQ, look: ALook): ENode {
  const [[tr, tv], [br, bv]] = topBot(q)
  return frac("bar-R", piece("kt", String(tv), look, { col: ROLE_COL[tr] }), piece("kb", String(bv), look, { col: ROLE_COL[br] }))
}

const theta = (q: AngleQ, look: ALook) => piece("th", nameA(q), look, { col: PINK })

/** sin θ = 5 / 11 */
export function startNode(q: AngleQ, look: ALook = {}): ENode {
  return row([piece("fn", fnTex(fnA(q)), look), theta(q, look), op("eq", "="), numbersFrac(q, look), ...(look.tail ?? [])])
}

/** sin⁻¹(sin θ) = sin⁻¹(5 / 11), with `inv` the inverse dropped on. */
export function wrappedNode(q: AngleQ, inv: Fn, look: ALook = {}, wrong = false): ENode {
  const col = wrong ? PINK : undefined
  // the brackets are drawn to fit what they hold, so each side sits in the middle of its own
  return row([
    piece("invL", invTex(inv), look, { col }), paren("pL", row([piece("fn", fnTex(fnA(q)), look), theta(q, look)]), col),
    op("eq", "="),
    piece("invR", invTex(inv), look, { col }), paren("pR", numbersFrac(q, look), col),
    ...(look.tail ?? []),
  ], 0.06)
}

/**
 * θ = sin⁻¹(5 / 11). `invId` keeps the inverse the same piece it was on the
 * board; `landing` draws it still as sin (it has just been dragged across).
 */
export function solvedNodeA(q: AngleQ, look: ALook = {}, invId: "invR" | "fn" = "invR", landing = false): ENode {
  const f = landing ? fnTex(fnA(q)) : invTex(fnA(q))
  return row([theta(q, look), op("eq", "="), piece(invId, f, look), paren("pR", numbersFrac(q, look)), ...(look.tail ?? [])], 0.06)
}

/** The equation as the solve has it now. */
export function solveNodeA(S: Scene, tail?: ENode[]): ENode {
  const v = S.asolve!
  const grab = v.shortcut && v.stage === "start" && !v.busy ? new Set(["fn"]) : undefined
  const look: ALook = { strike: v.strike, pulse: v.pulse, from: v.from, grab, tail }
  if (v.stage === "start") return startNode(v.q, look)
  if (v.stage === "wrapped") return wrappedNode(v.q, v.inv!, look, v.inv !== fnA(v.q))
  return solvedNodeA(v.q, look, v.invId, v.crossAt !== null && S.time - v.crossAt < 0.75)
}

/** The rule as it comes off its card: sin θ = O / H, with θ in pink. */
function ruleWithLetters(q: AngleQ, stage: number, look: ALook): ENode {
  const fn = fnA(q)
  const [[tr], [br]] = topBot(q)
  const top = stage >= 1 ? piece("kt", String(q.known[tr]), look, { col: ROLE_COL[tr] }) : piece("r0", tr, look, { col: ROLE_COL[tr] })
  const bot = stage >= 2 ? piece("kb", String(q.known[br]), look, { col: ROLE_COL[br] }) : piece("r1", br, look, { col: ROLE_COL[br] })
  return row([piece("fn", fnTex(fn), look), theta(q, look), op("eq", "="), frac("bar-R", top, bot)])
}

/** Where a side's label is (for numbers that fly up from it). */
function fromSide(S: Scene, role: Role): Vec {
  return labAt(S, `role-${role}`) ?? sideLabelAt(S, sideOf(S.tri.at, role), layout(S).labelSize)
}

/**
 * The rule comes down off its card, then the two numbers go into it one at
 * a time, slowly: each lights up on its side, then flies to the letter it
 * replaces, and the letter fades as it lands. θ stays: it is what we want.
 * Returns how long it all takes.
 */
export function putNumbersA(S: Scene, q: AngleQ, delay = 0.9, slow = false): number {
  const fn = fnA(q)
  const [[tr], [br]] = topBot(q)
  const card = cardRects(S, layout(S)).find(r => r.fn === fn)?.r
  const cardAt: Vec | undefined = card ? [(card.x0 + card.x1) / 2, (card.y0 + card.y1) / 2] : undefined
  const fly = slow ? 1.35 : 1.0
  const lead = slow ? 0.6 : 0.4
  const rest = slow ? 0.3 : 0.15
  let stage = 0
  let pulse = new Set<string>()
  const from: Record<string, Vec> = {}
  if (cardAt) for (const id of ["fn", "th", "r0", "r1", "eq"]) from[id] = cardAt
  S.asolve = null
  S.vis.cards.t = 0
  S.vis.eq.t = 1
  S.eqFn = () => ruleWithLetters(q, stage, { from, pulse, fly })
  const step = (t: number, n: number, role: Role, letter: string, id: string) => {
    later(S, t, S2 => { S2.pulseLabs = new Set([role]); pulse = new Set([letter]) })
    later(S, t + lead, S2 => {
      from[id] = fromSide(S2, role)
      S2.eq.goneFade[letter] = fly
      stage = n
      later(S2, fly, S3 => { S3.pulseLabs = new Set(); pulse = new Set() })
    })
  }
  let t = delay
  step(t, 1, tr, "r0", "kt")
  t += lead + fly + rest
  step(t, 2, br, "r1", "kb")
  t += lead + fly + rest
  later(S, t, S2 => { S2.eqFn = () => startNode(q) })
  return t
}

/** The equation with the numbers in (a beat opened cold, or a later question). */
export function numbersInA(S: Scene, q: AngleQ) {
  S.eqFn = () => startNode(q)
}

// ── the moves ────────────────────────────────────────────────────────────

const invChip = (fn: Fn): Chip => ({ id: `inv-${fn}`, kind: "inv", tex: invTex(fn), fac: { id: `inv-${fn}`, tex: invTex(fn), key: fn, v: 1 } })

/** The inverses on offer: the right one, and (after the first time) one that undoes a different rule. */
function dealChips(S: Scene) {
  const v = S.asolve!
  if (v.stage !== "start") { S.chips = []; return }
  const fn = fnA(v.q)
  if (v.single) { S.chips = [invChip(fn)]; return }
  const other: Fn = fn === "sin" ? "cos" : "sin"
  S.chips = v.q.id.length % 2 ? [invChip(other), invChip(fn)] : [invChip(fn), invChip(other)]
}

/** Start getting θ on its own: the equation with the numbers in is on the board. */
export function startSolveA(S: Scene, q: AngleQ, opts: { single?: boolean; tapCancel?: boolean; shortcut?: boolean; wrapped?: boolean } = {}) {
  S.asolve = {
    q, stage: "start", inv: null, invId: "invR", strike: {}, pulse: new Set(), from: {}, busy: false, wrongs: 0,
    tapCancel: !!opts.tapCancel, single: !!opts.single, shortcut: !!opts.shortcut, hintChip: null, crossAt: null,
  }
  S.mode = "solve"
  S.eqFn = S2 => solveNodeA(S2)
  S.onChip = onChipA
  S.onAtomDrop = onAtomDropA
  if (opts.wrapped) {
    // opened with sin⁻¹ already on both sides: straight to the cancel
    const v = S.asolve
    v.stage = "wrapped"
    v.inv = fnA(q)
    v.busy = true
    S.chips = []
    S.dragAtoms = []
    markCancel(S)
    return
  }
  dealChips(S)
  S.dragAtoms = opts.shortcut ? ["fn"] : []
}

export const solvedA = (S: Scene) => S.asolve?.stage === "done" && !S.asolve.busy

function chipHome(S: Scene, id: string): Vec {
  const r = chipRects(S, layout(S)).find(c => c.id === id)?.r
  return r ? [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2] : [S.w / 2, S.h - 120]
}

const WRAP_IDS = ["invL", "invR"]

function onChipA(S: Scene, id: string, at: Vec) {
  const v = S.asolve
  if (!v || v.busy || v.stage !== "start") return
  const chip = S.chips.find(c => c.id === id)
  if (!chip) return
  const fn = fnA(v.q)
  const inv = chip.fac.key as Fn
  v.from = Object.fromEntries(WRAP_IDS.map(i => [i, at]))
  v.inv = inv
  v.stage = "wrapped"
  v.busy = true
  S.chips = []
  S.touched = { kind: "eq" }
  if (inv !== fn) {
    v.wrongs++
    say(S, `$${invTex(inv)}$ only undoes $${fnTex(inv)}$. Here we need to undo $${fnTex(fn)}$.`, "wrong", 4)
    later(S, 2.4, S2 => {
      const home = chipHome(S2, id)
      S2.eq.goneTo = Object.fromEntries(WRAP_IDS.map(i => [i, home]))
      v.stage = "start"
      v.inv = null
      v.from = {}
      v.busy = false
      dealChips(S2)
      if (v.wrongs >= 2) v.hintChip = `inv-${fn}`
      later(S2, 0.6, S3 => { S3.eq.goneTo = {} })
    })
    return
  }
  v.hintChip = null
  if (v.single) say(S, `Both sides get $${invTex(fn)}$.`, "calm", 600)
  later(S, 0.8, S2 => markCancel(S2))
}

/** sin⁻¹ and sin cancel: the student taps them (the first time) or they go by themselves. */
function markCancel(S: Scene) {
  const v = S.asolve!
  const ids = ["invL", "fn"]
  if (v.tapCancel) {
    v.pulse = new Set(ids)
    S.tapAtoms = ids
    S.onAtom = S2 => {
      S2.tapAtoms = []
      S2.onAtom = null
      v.pulse = new Set()
      strikeNow(S2)
    }
    v.tapCancel = false
    return
  }
  strikeNow(S)
}

function strikeNow(S: Scene) {
  const v = S.asolve!
  for (const id of ["invL", "fn"]) v.strike[id] = S.time
  S.flashGood = Math.max(S.flashGood, 0.6)
  later(S, 0.8, S2 => {
    v.stage = "done"
    v.invId = "invR"
    v.strike = {}
    v.from = {}
    later(S2, 0.6, () => { v.busy = false })
  })
}

/** The shortcut: the sin dragged across the = becomes sin⁻¹ on the other side. */
function onAtomDropA(S: Scene, id: string, onto: string | null) {
  const v = S.asolve
  if (!v || v.busy || v.stage !== "start" || !v.shortcut || id !== "fn") return
  const eqX = eqCentre(S.eq, "eq")?.[0] ?? S.w / 2
  const at = S.dropAt
  const across = (onto && ["kt", "kb", "eq"].includes(onto)) || (at && at[0] > eqX)
  if (!across) { say(S, "Drag it across the $=$.", "calm", 2.4); return }
  v.stage = "done"
  v.invId = "fn"
  v.crossAt = S.time
  v.busy = true
  S.chips = []
  S.dragAtoms = []
  S.touched = { kind: "eq" }
  later(S, 1.2, () => { v.busy = false })
}

// ── the calculator ───────────────────────────────────────────────────────

/** What students often type instead, and what to tell them. */
export function slipsForA(q: AngleQ): { v: number; say: string }[] {
  const fn = fnA(q), r = ratioA(q), t = truthA(q)
  const [[, top], [, bot]] = topBot(q)
  const fwd = (g: Fn, x: number) => (g === "sin" ? Math.sin(x) : g === "cos" ? Math.cos(x) : Math.tan(x))
  const inv = (g: Fn, x: number) => (g === "sin" ? Math.asin(x) : g === "cos" ? Math.acos(x) : Math.atan(x))
  const out: { v: number; say: string }[] = []
  // just the fraction, no inverse: first, because for a small angle it is almost the same number as the angle in radians
  out.push({ v: r, say: `That's just the fraction. Now find the angle with $${invTex(fn)}$: SHIFT, then $${fnTex(fn)}$.` })
  // SHIFT missed: sin of the fraction (on a calculator, or on this keypad: sin 5, then ÷ 11)
  const noShift = `That is $${fnTex(fn)}$, not $${invTex(fn)}$. Press SHIFT first.`
  out.push({ v: fwd(fn, r * RAD), say: noShift })
  out.push({ v: fwd(fn, top * RAD) / bot, say: noShift })
  out.push({ v: inv(fn, r), say: "Your calculator is in radians. Set it to degrees." })
  for (const g of ["sin", "cos", "tan"] as Fn[]) {
    if (g === fn) continue
    const x = inv(g, r)
    if (Number.isFinite(x)) out.push({ v: x * DEGS, say: `Check the rule. The line uses $${invTex(fn)}$.` })
  }
  if (fn === "tan") out.push({ v: Math.atan(1 / r) * DEGS, say: "Is the fraction the right way up? $\\tan$ is $\\frac{O}{A}$." })
  out.push(...(q.slips ?? []))
  return out.filter(s => Math.abs(s.v - t) > 0.06)
}

/** The angle found: it says its size, in green. */
export function showAnswerA(S: Scene, q: AngleQ) {
  const ans = answerTextA(q)
  // a thin angle has no room for the number: its θ turns green, and the line says the number
  S.angText = s => (angleRoom(s, `${ans}^\\circ`, layout(s).labelSize) ? `\\textcolor{${GREEN}}{${ans}^\\circ}` : `\\textcolor{${GREEN}}{${nameA(q)}}`)
  S.touched = { kind: "tri" }
  S.flashGood = 1.2
}

/** Work it out: the solved line with the answer box at its end. */
export function askCalcA(S: Scene, q: AngleQ, invId: "invR" | "fn" = "invR") {
  startInput(S, {
    answer: truthA(q), dp: 1, slips: slipsForA(q),
    onRight: S2 => showAnswerA(S2, q),
    help: (S2, t) => { if (t === 1) say(S2, "Type exactly what the line says.", "calm", 3) },
  })
  S.eqFn = S2 => {
    const inp = S2.input
    const tail: ENode[] = [op("eq3", "=")]
    if (inp?.state === "right") tail.push(atom("ans", `${answerTextA(q)}^\\circ`, { col: GREEN }))
    else tail.push(boxNode(S2))
    return solvedNodeA(q, { tail }, invId)
  }
  S.mode = "none"
}

const keysOf = (q: AngleQ) => {
  const [[, t], [, b]] = topBot(q)
  const digits = (n: number) => String(n).split("").map(d => `$${d}$`).join(", ")
  return `SHIFT, $${fnTex(fnA(q))}$, ${digits(t)}, $\\div$, ${digits(b)}`
}

/** "Show me how" for an angle on the calculator. */
export function calcWalkA(q: AngleQ): WalkStep<Scene>[] {
  const [[tr, t], [br, b]] = topBot(q)
  const rhs = `${invTex(fnA(q))}\\left(\\dfrac{\\textcolor{${ROLE_COL[tr]}}{${t}}}{\\textcolor{${ROLE_COL[br]}}{${b}}}\\right)`
  const n = nameA(q)
  const full = truthA(q)
  return [
    { say: `The line says $${n} = ${invTex(fnA(q))}$ of $\\frac{${t}}{${b}}$.`, tex: `\\textcolor{${PINK}}{${n}} = ${rhs}` },
    { say: `On the calculator, press ${keysOf(q)}, then $=$.` },
    { say: `That gives $${sigText(full, 6)}\\ldots$, which is $${answerTextA(q)}^\\circ$ to $1$ decimal place.`, tex: `\\textcolor{${PINK}}{${n}} = \\textcolor{${GREEN}}{${answerTextA(q)}^\\circ}` },
  ]
}

export { CHALK }
