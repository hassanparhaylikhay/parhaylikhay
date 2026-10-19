/**
 * Solving a trig equation on the board, one move at a time, by the student.
 *
 * A question is a right-angled triangle with one angle, one side known and
 * one side wanted. Its rule gives an equation like sin 30° = x / 10 (x on
 * top) or sin 65° = 9 / x (x underneath). The student gets x on its own by
 * doing the same thing to both sides: a chip (× 10, ÷ sin 65°) is dragged
 * onto the equation and drops onto both sides; the pieces that cancel are
 * struck out and leave; the fraction closes up. A wrong move plays out (x
 * gets more buried) and then undoes itself. When x is underneath, x and the
 * sin can also simply be swapped, once the long way has been seen.
 */

import type { Vec } from "../geometry"
import { type Fac, type Eqn, type EqnLook, type ENode, eqnNode, mulBoth, divBoth, cancelPairs, removeFacs, pieceIds } from "../equation"
import { sigText } from "../calc"
import { type Scene, type Role, type Fn, type Pose, type Chip, RULE, ROLE_COL, PINK, later, say, chipRects, layout, labAt, sideLabelAt, sideOf } from "./scene"

const RAD = Math.PI / 180

// ── a question ───────────────────────────────────────────────────────────

export interface Question {
  id: string
  /** the angle we use, in degrees */
  th: number
  /** the corner it sits at, in the triangle's flat frame */
  at: "V" | "P"
  known: Role
  kv: number
  unknown: Role
  /** what the unknown is called ("x", "PQ") */
  name?: string
  pose?: Pose
  letters?: Partial<Record<string, string>>
  extra?: Scene["extra"]
  regions?: { id: string; pts: string[] }[]
  unit?: string
}

export const fnOf = (q: Question): Fn => {
  const r = new Set([q.known, q.unknown])
  return r.has("H") ? (r.has("O") ? "sin" : "cos") : "tan"
}

/** The hypotenuse, from the side we know. */
export function hypOf(q: Question): number {
  const m = q.th * RAD
  return q.known === "H" ? q.kv : q.known === "O" ? q.kv / Math.sin(m) : q.kv / Math.cos(m)
}

/** The wanted side's true length. */
export function answerOf(q: Question): number {
  const h = hypOf(q), m = q.th * RAD
  return q.unknown === "H" ? h : q.unknown === "O" ? h * Math.sin(m) : h * Math.cos(m)
}

/** Whether the unknown is on the bottom of its rule. */
export const isUnder = (q: Question) => RULE[fnOf(q)][1] === q.unknown

export const nameOf = (q: Question) => q.name ?? "x"
export const angTex = (q: Question) => `${q.th}^\\circ`
export const fnTex = (fn: Fn) => `\\${fn}`
const numTex = (v: number) => String(v)

/** The rule's own factor, drawn as two pieces ("sin" and "30°") so each can move. */
export function fnFac(q: Question): Fac {
  const fn = fnOf(q)
  const v = fn === "sin" ? Math.sin(q.th * RAD) : fn === "cos" ? Math.cos(q.th * RAD) : Math.tan(q.th * RAD)
  return { id: "F", tex: `${fnTex(fn)} ${angTex(q)}`, key: "F", v, parts: [{ id: "fn", tex: fnTex(fn) }, { id: "ang", tex: angTex(q) }] }
}
export const xFac = (q: Question): Fac => ({ id: "x", tex: nameOf(q), col: PINK, key: "x", v: answerOf(q) })
export const kFac = (q: Question): Fac => ({ id: "k", tex: numTex(q.kv), col: ROLE_COL[q.known], key: "k", v: q.kv })

/** The equation with the numbers in: sin 30° = x / 10. */
export function startEqn(q: Question): Eqn {
  const top = RULE[fnOf(q)][0] === q.unknown ? xFac(q) : kFac(q)
  const bot = isUnder(q) ? xFac(q) : kFac(q)
  return { L: { num: [fnFac(q)], den: [] }, R: { num: [top], den: [bot] } }
}

/** The equation solved: x = 10 × sin 30°, or x = 9 / sin 65°. */
export function solvedEqn(q: Question): Eqn {
  return isUnder(q)
    ? { L: { num: [xFac(q)], den: [] }, R: { num: [kFac(q)], den: [fnFac(q)] } }
    : { L: { num: [xFac(q)], den: [] }, R: { num: [kFac(q), fnFac(q)], den: [] } }
}

/** The right-hand side of the solved line, as KaTeX, and what to press. */
export function solvedTex(q: Question): { rhs: string; keys: string } {
  const k = numTex(q.kv), f = `${fnTex(fnOf(q))} ${angTex(q)}`
  if (isUnder(q)) return { rhs: `\\dfrac{${k}}{${f}}`, keys: `$${k}$, $\\div$, $${fnTex(fnOf(q))}$, $${q.th}$` }
  return { rhs: `${k} \\times ${f}`, keys: `$${k}$, $\\times$, $${fnTex(fnOf(q))}$, $${q.th}$` }
}

/** The rule as it comes off its card: sin θ = O / H. */
export function ruleNode(fn: Fn, from?: Vec): ENode {
  const [a, b] = RULE[fn]
  return eqnNode(
    { L: { num: [{ id: "F", tex: "", key: "F", v: 1, parts: [{ id: "fn", tex: fnTex(fn) }, { id: "th", tex: "\\theta" }] }], den: [] },
      R: { num: [{ id: "r0", tex: a, col: ROLE_COL[a], key: "r0", v: 1 }], den: [{ id: "r1", tex: b, col: ROLE_COL[b], key: "r1", v: 1 }] } },
    from ? { from: { fn: from, th: from, r0: from, r1: from, eq: from } } : {},
  )
}

/** Where a side's label is (for numbers that fly up from it). */
export function fromSide(S: Scene, role: Role): Vec {
  return labAt(S, `role-${role}`) ?? sideLabelAt(S, sideOf(S.tri.at, role), layout(S).labelSize)
}

// ── the moves ────────────────────────────────────────────────────────────

export interface Solve {
  q: Question
  /** 0: the first move; 1: the second (x underneath); 2: done */
  stage: number
  strike: Record<string, number>
  wrongs: number
  /** the first time: the student taps the pair that cancels */
  tapCancel: boolean
  /** the first time: only the right chip is offered */
  single: boolean
  /** x and the sin can be swapped by dragging one onto the other */
  allowSwap: boolean
  busy: boolean
  /** where new pieces fly in from (the chip's drop point) */
  from: Record<string, Vec>
  pulse: Set<string>
  /** a chip that breathes harder: the hint after two wrong moves */
  hintChip: string | null
  moves: number
}

export const solved = (S: Scene) => S.solve?.stage === 2 && !S.solve.busy

/** How the equation looks while being solved. */
export function solveLook(S: Scene): EqnLook {
  const v = S.solve
  return { strike: v?.strike, from: v?.from, pulse: v?.pulse, grab: v && v.allowSwap && v.stage === 0 && !v.busy ? new Set(["x", "fn", "ang"]) : undefined }
}

/** The move each stage needs, and its wrong twin. */
function movesFor(v: Solve): { right: Chip; wrong: Chip } | null {
  const q = v.q
  const k = kFac(q), x = xFac(q), f = fnFac(q)
  const chip = (kind: "mul" | "div", fac: Fac, tex: string): Chip => ({ id: `${kind}-${fac.id}`, kind, fac, tex: `${kind === "mul" ? "\\times" : "\\div"} ${tex}` })
  const kT = `\\textcolor{${ROLE_COL[q.known]}}{${numTex(q.kv)}}`
  const xT = `\\textcolor{${PINK}}{${nameOf(q)}}`
  const fT = `${fnTex(fnOf(q))} ${angTex(q)}`
  if (!isUnder(q)) return v.stage === 0 ? { right: chip("mul", k, kT), wrong: chip("div", k, kT) } : null
  if (v.stage === 0) return { right: chip("mul", x, xT), wrong: chip("div", x, xT) }
  if (v.stage === 1) return { right: chip("div", f, fT), wrong: chip("mul", f, fT) }
  return null
}

/** Put the chips for this stage on the board (right one first, or second: it varies by question). */
function dealChips(S: Scene) {
  const v = S.solve!
  const m = movesFor(v)
  if (!m) { S.chips = []; return }
  if (v.single) { S.chips = [m.right]; return }
  const flip = (v.q.id.length + v.stage) % 2 === 1
  S.chips = flip ? [m.wrong, m.right] : [m.right, m.wrong]
}

/** Start solving: the equation with the numbers in is on the board. */
export function startSolve(S: Scene, q: Question, opts: { single?: boolean; tapCancel?: boolean; allowSwap?: boolean; stage?: number } = {}) {
  // the swap is only a shortcut when x is underneath
  const allowSwap = !!opts.allowSwap && isUnder(q)
  S.solve = { q, stage: opts.stage ?? 0, strike: {}, wrongs: 0, tapCancel: !!opts.tapCancel, single: !!opts.single, allowSwap, busy: false, from: {}, pulse: new Set(), hintChip: null, moves: (opts.stage ?? 0) * 10 }
  if (!S.alg) S.alg = startEqn(q)
  S.mode = "solve"
  S.eqFn = S2 => eqnNode(S2.alg!, solveLook(S2))
  dealChips(S)
  S.onChip = onChip
  S.dragAtoms = S.solve.allowSwap ? ["x", "fn", "ang"] : []
  S.onAtomDrop = onAtomDrop
}

/** The second stage of an x-underneath question, ready to go (for a beat opened there). */
export function afterFirstMove(q: Question): Eqn {
  const x = xFac(q)
  return { L: { num: [{ ...x, id: "m1L.x" }, fnFac(q)], den: [] }, R: { num: [kFac(q)], den: [] } }
}

function chipHome(S: Scene, id: string): Vec {
  const r = chipRects(S, layout(S)).find(c => c.id === id)?.r
  return r ? [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2] : [S.w / 2, S.h - 120]
}

function onChip(S: Scene, id: string, at: Vec) {
  const v = S.solve
  if (!v || v.busy || v.stage === 2) return
  const m = movesFor(v)
  const chip = S.chips.find(c => c.id === id)
  if (!m || !chip) return
  const tag = `m${++v.moves}`
  const before = S.alg!
  const after = chip.kind === "mul" ? mulBoth(before, chip.fac, tag) : divBoth(before, chip.fac, tag)
  const fresh = newIds(before, after)
  v.from = Object.fromEntries(fresh.map(i => [i, at]))
  S.alg = after
  S.touched = { kind: "eq" }
  v.busy = true
  if (chip.id !== m.right.id) {
    v.wrongs++
    say(S, wrongNote(v), "wrong", 3.6)
    later(S, 2.2, S2 => {
      const home = chipHome(S2, id)
      S2.eq.goneTo = Object.fromEntries(fresh.map(i => [i, home]))
      S2.alg = before
      v.busy = false
      if (v.wrongs >= 2) v.hintChip = m.right.id
    })
    return
  }
  v.hintChip = null
  if (v.single && v.stage === 0 && !v.tapCancel) say(S, "Both sides get the same move.", "calm", 2.6)
  later(S, 0.7, S2 => strikePairs(S2))
}

/** The ids that are on the board after a move but were not before. */
function newIds(a: Eqn, b: Eqn): string[] {
  const ids = (e: Eqn) => new Set([...e.L.num, ...e.L.den, ...e.R.num, ...e.R.den].flatMap(pieceIds))
  const A = ids(a)
  return [...ids(b)].filter(i => !A.has(i))
}

function wrongNote(v: Solve): string {
  const q = v.q, n = nameOf(q)
  if (!isUnder(q)) return `Now $${n}$ is divided by $${q.kv}$ twice. That made it worse.`
  if (v.stage === 0) return `Now $${n}$ is underneath twice. That made it worse.`
  return `Now $${n}$ is multiplied by $${fnTex(fnOf(q))} ${angTex(q)}$ twice. That made it worse.`
}

/** Mark what cancels; the student taps it (the first time) or it goes by itself. */
function strikePairs(S: Scene) {
  const v = S.solve!
  const e = S.alg!
  const pairs = [...cancelPairs(e.L), ...cancelPairs(e.R)]
  const ids = pairs.flat().flatMap(pieceIds)
  if (v.tapCancel) {
    v.pulse = new Set(ids)
    S.tapAtoms = ids
    S.onAtom = S2 => {
      S2.tapAtoms = []
      S2.onAtom = null
      v.pulse = new Set()
      strikeNow(S2, ids, pairs.flat().map(f => f.id))
    }
    v.tapCancel = false
    return
  }
  strikeNow(S, ids, pairs.flat().map(f => f.id))
}

function strikeNow(S: Scene, pieceIdsToStrike: string[], facIds: string[]) {
  const v = S.solve!
  for (const id of pieceIdsToStrike) v.strike[id] = S.time
  S.flashGood = Math.max(S.flashGood, 0.6)
  later(S, 0.75, S2 => {
    S2.alg = removeFacs(S2.alg!, new Set(facIds))
    v.strike = {}
    later(S2, 0.45, S3 => afterCancel(S3))
  })
}

function afterCancel(S: Scene) {
  const v = S.solve!
  const e = S.alg!
  const xOn = (side: "L" | "R") => e[side].num.length === 1 && !e[side].den.length && e[side].num[0].key === "x"
  if (!isUnder(v.q)) {
    // 10 × sin 30° = x: turn it round so x is on the left
    if (xOn("R")) {
      S.alg = { L: e.R, R: e.L }
      later(S, 0.6, S2 => finish(S2))
      return
    }
  }
  if (isUnder(v.q) && v.stage === 0) {
    v.stage = 1
    v.busy = false
    dealChips(S)
    S.dragAtoms = []
    return
  }
  finish(S)
}

function finish(S: Scene) {
  const v = S.solve!
  v.stage = 2
  v.busy = false
  S.chips = []
  S.dragAtoms = []
  S.flashGood = Math.max(S.flashGood, 0.9)
}

/** The shortcut: drag x onto the sin (or the sin onto x) and they swap. */
function onAtomDrop(S: Scene, id: string, onto: string | null) {
  const v = S.solve
  if (!v || v.busy || v.stage !== 0 || !v.allowSwap || !onto) return
  const fnIds = ["fn", "ang"]
  const ok = (id === "x" && fnIds.includes(onto)) || (fnIds.includes(id) && onto === "x")
  if (!ok) return
  S.alg = { L: { num: [xFac(v.q)], den: [] }, R: { num: [kFac(v.q)], den: [fnFac(v.q)] } }
  S.touched = { kind: "eq" }
  v.busy = true
  later(S, 0.9, S2 => finish(S2))
}

// ── the last step: the calculator ────────────────────────────────────────

/** A few things students often type instead, and what to tell them. */
export function slipsFor(q: Question): { v: number; say: string }[] {
  const fn = fnOf(q), k = q.kv, m = q.th * RAD
  const f = (a: number, g: Fn = fn) => (g === "sin" ? Math.sin(a) : g === "cos" ? Math.cos(a) : Math.tan(a))
  const fT = `$${fnTex(fn)} ${angTex(q)}$`
  const out: { v: number; say: string }[] = []
  if (isUnder(q)) {
    out.push({ v: k * f(m), say: `That multiplies. The line divides $${k}$ by ${fT}.` })
    out.push({ v: f(m) / k, say: `That is ${fT} divided by $${k}$. It is the other way round.` })
    out.push({ v: k / f(q.th), say: "Your calculator is in radians. Set it to degrees." })
  } else {
    out.push({ v: k / f(m), say: `That divides. The line multiplies $${k}$ by ${fT}.` })
    out.push({ v: k * f(q.th), say: "Your calculator is in radians. Set it to degrees." })
  }
  for (const g of ["sin", "cos", "tan"] as Fn[]) {
    if (g === fn) continue
    out.push({ v: isUnder(q) ? k / f(m, g) : k * f(m, g), say: `Check the rule. The line uses ${fT}.` })
  }
  return out
}

/** The answer as written on the board: 3 significant figures, or the whole number when it is exact. */
export function answerText(q: Question): string {
  const a = answerOf(q)
  return Math.abs(a - Math.round(a)) < 1e-9 ? String(Math.round(a)) : sigText(a, 3)
}

