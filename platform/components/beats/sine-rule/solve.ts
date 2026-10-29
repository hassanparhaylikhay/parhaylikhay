/**
 * The sine rule's algebra, one visible move at a time.
 *
 * A question is a triangle with a full pair known (a side and the angle
 * across from it) and half of another pair: either its side is wanted
 * (finding a side) or its angle (finding an angle).
 *
 * The student fills the empty rule themselves: they drag the unknown's pair
 * into the left fraction, then the full pair into the right, each piece to
 * its place (a side on top, its angle with sin). Then the moves:
 *
 *  - a side: x / sin 75° = 8 / sin 40°. × sin 75° goes onto both sides, the
 *    two sin 75°s cancel, and x = 8 × sin 75° ÷ sin 40°.
 *  - an angle: 6 / sin θ = 9 / sin 70°. Both fractions turn over (equal
 *    fractions turned over are still equal), × 6 onto both sides, the 6s
 *    cancel: sin θ = 6 sin 70° ÷ 9. The right side is worked out first, then
 *    the sin is undone with sin⁻¹ (SHIFT sin Ans on the calculator).
 *
 * Every move is slow: new pieces fly in on a timed path from where the chip
 * was let go, cancelled pieces are struck out (tapped by the student), and
 * what is left glides together slowly (equation.ts eqSlow).
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import {
  type ENode, type EAtom, type Eqn, type Side, type Fac, type EqnLook,
  atom, op, row, frac, paren, eqnNode, mulBoth, divBoth, cancelPairs, removeFacs, pieceIds, eqSlow, eqCentre,
} from "../equation"
import { sigText, setAns } from "../calc"
import {
  type Scene, type Corner, type Chip, PAIR_COL, CHALK, GREEN, RED, RAD, DEG,
  later, say, chipRects, layout, labAt, startInput, boxNode, numText,
} from "./scene"

// ── a question ───────────────────────────────────────────────────────────

export interface SRQ {
  id: string
  /** the corner of the pair with the unknown in it */
  want: Corner
  /** what is unknown: that pair's side or its angle */
  find: "side" | "angle"
  /** the corner of the full pair (side and angle both known) */
  pair: Corner
  /** the triangle's sides and angles, true sizes, by corner */
  side: Record<Corner, number>
  angle: Record<Corner, number>
  /** what the unknown is called ("x", "PS", "\\theta") */
  name?: string
  unit?: string
  /** how a given number is written when it is not its true size (124.3 from part (a)) */
  given?: Partial<Record<string, number>>
}

export const nameOf = (q: SRQ) => q.name ?? (q.find === "side" ? "x" : "\\theta")
const sinD = (d: number) => Math.sin(d * RAD)

/** The number a known side or angle is written as (the paper's own, if given). */
export const sideVal = (q: SRQ, c: Corner) => q.given?.[`side-${c}`] ?? q.side[c]
export const angVal = (q: SRQ, c: Corner) => q.given?.[`ang-${c}`] ?? q.angle[c]

/** The answer, from the numbers as the question gives them. */
export function answerOf(q: SRQ): number {
  const k = sideVal(q, q.pair), K = angVal(q, q.pair)
  if (q.find === "side") return (k * sinD(angVal(q, q.want))) / sinD(K)
  return Math.asin(clampU((sideVal(q, q.want) * sinD(K)) / k)) * DEG
}
const clampU = (x: number) => Math.max(-1, Math.min(1, x))
/** sin θ, for an angle question: the right side once θ is alone under sin. */
export const sinValue = (q: SRQ) => (sideVal(q, q.want) * sinD(angVal(q, q.pair))) / sideVal(q, q.pair)

export const answerText = (q: SRQ) => (q.find === "side" ? sigText(answerOf(q), 3) : answerOf(q).toFixed(1))
export const unitTex = (q: SRQ) => (q.unit ? `\\text{ ${q.unit}}` : "")

// ── pieces ───────────────────────────────────────────────────────────────

const col = (c: Corner) => PAIR_COL[c]
const degTex = (d: number) => `${numText(d, 1)}^\\circ`

/** A side as a factor: its number (or the unknown's name). */
export function sideFac(q: SRQ, c: Corner, id = `s-${c}`): Fac {
  const unknown = q.find === "side" && c === q.want
  return { id, tex: unknown ? nameOf(q) : numText(sideVal(q, c), 2), col: col(c), key: `s-${c}`, v: q.side[c] }
}

/** sin of an angle, drawn as two pieces ("sin" and "40°" or "θ") so each can move. */
export function sinFac(q: SRQ, c: Corner, tag = ""): Fac {
  const unknown = q.find === "angle" && c === q.want
  const p = tag ? `${tag}.` : ""
  return {
    id: `${p}F-${c}`, tex: "", key: `F-${c}`, v: sinD(q.angle[c]),
    parts: [{ id: `${p}fn-${c}`, tex: "\\sin" }, { id: `${p}ang-${c}`, tex: unknown ? nameOf(q) : degTex(angVal(q, c)), col: col(c) }],
  }
}

/** The rule with the numbers in: x / sin 75° = 8 / sin 40° (the unknown's pair on the left). */
export function filledEqn(q: SRQ): Eqn {
  return {
    L: { num: [sideFac(q, q.want)], den: [sinFac(q, q.want)] },
    R: { num: [sideFac(q, q.pair)], den: [sinFac(q, q.pair)] },
  }
}

/** Both fractions turned over. */
export const flipBoth = (e: Eqn): Eqn => ({ L: { num: e.L.den, den: e.L.num }, R: { num: e.R.den, den: e.R.num } })

// ── filling the empty rule ───────────────────────────────────────────────

/** Which piece of the triangle goes in each place of the rule. */
const WANTS = (q: SRQ): Record<string, string> => ({ sL: `side-${q.want}`, aL: `ang-${q.want}`, sR: `side-${q.pair}`, aR: `ang-${q.pair}` })

/** The empty rule (or as filled so far): □ / sin □ = □ / sin □. */
export function templateNode(S: Scene, q: SRQ, from: Record<string, Vec> = {}): ENode {
  const f = S.fill
  const filled = f?.filled ?? {}
  const slot = (id: string, kind: "side" | "angle", c: Corner): ENode => {
    if (!filled[id]) return { k: "box", id, tex: "", state: "idle", wrongAt: -9, slot: true }
    const fl = from[id] ? { from: from[id], fly: 0.7 } : {}
    if (kind === "side") { const fc = sideFac(q, c); return atom(fc.id, fc.tex, { col: fc.col, ...fl }) }
    const fc = sinFac(q, c)
    return atom(fc.parts![1].id, fc.parts![1].tex, { col: fc.parts![1].col, ...fl })
  }
  const half = (s: string, a: string, c: Corner, bar: string) =>
    frac(bar, slot(s, "side", c), row([atom(`fn-${c}`, "\\sin"), slot(a, "angle", c)]))
  return row([half("sL", "aL", q.want, "bar-L"), op("eq", "="), half("sR", "aR", q.pair, "bar-R")])
}

/**
 * Fill the rule's left fraction (the unknown's pair) or its right (the full
 * pair). The pieces are dragged off the triangle; a piece in the wrong place
 * goes back with a note on why.
 */
export function startFill(S: Scene, q: SRQ, half: "left" | "right" | "both", labels: Record<string, string>) {
  const want = WANTS(q)
  const slots = half === "left" ? ["sL", "aL"] : half === "right" ? ["sR", "aR"] : ["sL", "aL", "sR", "aR"]
  const prev = S.fill?.filled ?? {}
  const filled: Record<string, string> = half === "right" ? { sL: want.sL, aL: want.aL, ...prev } : {}
  const from: Record<string, Vec> = {}
  const items: NonNullable<Scene["fill"]>["items"] = {}
  for (const [key, tex] of Object.entries(labels)) {
    const c = key.slice(-1) as Corner
    items[key] = { id: key, kind: key.startsWith("side") ? "side" : "angle", tex, col: col(c) }
  }
  S.fill = {
    slots: slots.map(id => ({ id, want: want[id], kind: id.startsWith("s") ? "side" : "angle" })),
    filled,
    items,
    onDrop: (S2, item, slot, at) => {
      if (!slot) return
      const f = S2.fill!
      if (want[slot] === item) {
        f.filled[slot] = item
        from[slot] = at
        S2.touched = { kind: "eq" }
        S2.flashGood = 0.5
        S2.note = null
        return
      }
      // where should it have gone?
      const theirs = Object.entries(want).find(([, v]) => v === item)?.[0]
      const isSide = item.startsWith("side")
      let msg: string
      if (!theirs) msg = "That one isn't in these two pairs."
      else if (slots.includes(theirs)) msg = isSide ? "A side goes on top. Its angle goes with $\\sin$." : "An angle goes with $\\sin$, under its side."
      else msg = half === "right" ? "This fraction is for the full pair." : `Put $${nameOf(q)}$'s pair on the left, the full pair on the right.`
      say(S2, msg, "wrong", 3.6)
    },
  }
  S.mode = "fill"
  S.eqFn = S2 => templateNode(S2, q, from)
}

export const filledHalf = (S: Scene, half: "left" | "right" | "both") => {
  const f = S.fill
  if (!f) return false
  return (half === "left" ? ["sL", "aL"] : half === "right" ? ["sR", "aR"] : ["sL", "aL", "sR", "aR"]).every(id => f.filled[id])
}

// ── the moves ────────────────────────────────────────────────────────────

/** One move the student makes: this chip onto both sides (and its wrong twin). */
export interface Move {
  kind: "mul" | "div"
  fac: Fac
  /** a chip that looks right but is not (offered beside the right one) */
  wrong?: { kind: "mul" | "div"; fac: Fac; say: string }
  /** after the cancel: tidy the equation (order the factors, turn it round) */
  after?: (e: Eqn) => Eqn
  /** what to tap, said when the pair that cancels lights up */
  cancelNote?: string
}

export interface SolveSR {
  moves: Move[]
  stage: number
  busy: boolean
  wrongs: number
  hintChip: string | null
  strike: Record<string, number>
  from: Record<string, Vec>
  pulse: Set<string>
  /** the student taps the pair that cancels (always, here: it is how they see it go) */
  tapCancel: boolean
  done: boolean
}

export const solveOf = (S: Scene) => S.solve as SolveSR | null

const facTex = (f: Fac) => (f.parts ? f.parts.map(p => (p.col ? `\\textcolor{${p.col}}{${p.tex}}` : p.tex)).join("\\,") : f.col ? `\\textcolor{${f.col}}{${f.tex}}` : f.tex)
const chipOf = (kind: "mul" | "div", fac: Fac): Chip => ({ id: `${kind}-${fac.key}`, kind, fac, tex: `${kind === "mul" ? "\\times" : "\\div"} ${facTex(fac)}` })

/** How the equation is drawn while it is being solved: new pieces fly in slowly. */
export const solveLook = (S: Scene): EqnLook => {
  const v = solveOf(S)
  return { strike: v?.strike, from: v?.from, pulse: v?.pulse, fly: 1.1 }
}

function deal(S: Scene) {
  const v = solveOf(S)!
  const m = v.moves[v.stage]
  if (!m) { S.chips = []; return }
  const right = chipOf(m.kind, m.fac)
  if (!m.wrong) { S.chips = [right]; return }
  const wrong = chipOf(m.wrong.kind, m.wrong.fac)
  S.chips = (m.fac.key.length + v.stage) % 2 ? [wrong, right] : [right, wrong]
}

/** Start making moves on the equation already on the board (S.alg). */
export function startMoves(S: Scene, moves: Move[]) {
  S.solve = { moves, stage: 0, busy: false, wrongs: 0, hintChip: null, strike: {}, from: {}, pulse: new Set(), tapCancel: true, done: false } satisfies SolveSR
  S.mode = "solve"
  S.eqFn = S2 => eqnNode(S2.alg!, solveLook(S2))
  deal(S)
  S.onChip = onChip
}

export const movesDone = (S: Scene) => !!solveOf(S)?.done && !solveOf(S)!.busy

function newIds(a: Eqn, b: Eqn): string[] {
  const ids = (e: Eqn) => new Set([...e.L.num, ...e.L.den, ...e.R.num, ...e.R.den].flatMap(pieceIds))
  const A = ids(a)
  return [...ids(b)].filter(i => !A.has(i))
}

function chipHome(S: Scene, id: string): Vec {
  const r = chipRects(S, layout(S)).find(c => c.id === id)?.r
  return r ? [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2] : [S.w / 2, S.h - 120]
}

function onChip(S: Scene, id: string, at: Vec) {
  const v = solveOf(S)
  if (!v || v.busy || v.done) return
  const m = v.moves[v.stage]
  const chip = S.chips.find(c => c.id === id)
  if (!m || !chip) return
  const tag = `m${v.stage + 1}`
  const before = S.alg!
  const after = chip.kind === "mul" ? mulBoth(before, chip.fac, tag) : divBoth(before, chip.fac, tag)
  const fresh = newIds(before, after)
  v.from = Object.fromEntries(fresh.map(i => [i, at]))
  S.alg = after
  S.touched = { kind: "eq" }
  v.busy = true
  S.chips = []
  const right = chip.kind === m.kind && chip.fac.key === m.fac.key
  if (!right) {
    v.wrongs++
    say(S, m.wrong?.say ?? "That made it worse.", "wrong", 4)
    later(S, 2.6, S2 => {
      const home = chipHome(S2, id)
      S2.eq.goneTo = Object.fromEntries(fresh.map(i => [i, home]))
      S2.alg = before
      v.from = {}
      v.busy = false
      deal(S2)
      if (v.wrongs >= 2) v.hintChip = chipOf(m.kind, m.fac).id
      later(S2, 0.7, S3 => { S3.eq.goneTo = {} })
    })
    return
  }
  v.hintChip = null
  say(S, "Both sides get the same move.", "calm", 3)
  // the pair that cancels lights up once the new pieces have landed; the student taps it
  later(S, 1.3, S2 => markCancel(S2))
}

function markCancel(S: Scene) {
  const v = solveOf(S)!
  const e = S.alg!
  const pairs = [...cancelPairs(e.L), ...cancelPairs(e.R)]
  const ids = pairs.flat().flatMap(pieceIds)
  if (!ids.length) { afterCancel(S); return }
  const note = v.moves[v.stage]?.cancelNote
  if (note) say(S, note, "calm", 600)
  v.pulse = new Set(ids)
  S.tapAtoms = ids
  S.onAtom = S2 => {
    S2.tapAtoms = []
    S2.onAtom = null
    S2.note = null
    v.pulse = new Set()
    for (const i of ids) v.strike[i] = S2.time
    S2.flashGood = Math.max(S2.flashGood, 0.6)
    later(S2, 0.85, S3 => {
      // what is left closes up slowly, so the student sees it
      eqSlow(S3.eq, 1.1)
      S3.alg = removeFacs(S3.alg!, new Set(pairs.flat().map(f => f.id)))
      v.strike = {}
      v.from = {}
      later(S3, 1.4, S4 => afterCancel(S4))
    })
  }
}

function afterCancel(S: Scene) {
  const v = solveOf(S)!
  const m = v.moves[v.stage]
  if (m?.after) {
    eqSlow(S.eq, 1.1)
    S.alg = m.after(S.alg!)
  }
  later(S, m?.after ? 1.3 : 0.1, S2 => {
    v.stage++
    if (v.stage >= v.moves.length) { v.done = true; v.busy = false; S2.chips = []; S2.flashGood = Math.max(S2.flashGood, 0.9); return }
    v.busy = false
    deal(S2)
  })
}

// ── tidying ──────────────────────────────────────────────────────────────

/** A side with its known numbers first and the sins after: 8 × sin 75°. */
export const numbersFirst = (s: Side): Side => ({ num: [...s.num].sort((a, b) => (a.parts ? 1 : 0) - (b.parts ? 1 : 0)), den: [...s.den].sort((a, b) => (a.parts ? 1 : 0) - (b.parts ? 1 : 0)) })
/** The two sides swapped, so what we want is on the left. */
export const turnRound = (e: Eqn): Eqn => ({ L: e.R, R: e.L })

/** The move for a side: × sin (the unknown's angle), then the numbers in order. */
export function sideMoves(q: SRQ): Move[] {
  const F = sinFac(q, q.want)
  return [{
    kind: "mul", fac: F,
    cancelNote: `Tap the two $\\sin ${degTex(angVal(q, q.want))}$s to cancel them.`,
    wrong: { kind: "div", fac: F, say: `Now $${nameOf(q)}$ is divided by $\\sin ${degTex(angVal(q, q.want))}$ twice. That made it worse.` },
    after: e => ({ L: e.L, R: numbersFirst(e.R) }),
  }]
}

/** The move for an angle once the fractions are turned over: × the unknown's side. */
export function angleMoves(q: SRQ): Move[] {
  const K = sideFac(q, q.want)
  return [{
    kind: "mul", fac: K,
    cancelNote: `Tap the two $${numText(sideVal(q, q.want), 2)}$s to cancel them.`,
    wrong: { kind: "div", fac: K, say: `Now $\\sin ${nameOf(q)}$ is divided by $${numText(sideVal(q, q.want), 2)}$ twice. That made it worse.` },
    after: e => ({ L: e.L, R: numbersFirst(e.R) }),
  }]
}

/** The rule as the student filled it, ready to solve. */
export const solvedSide = (q: SRQ): Eqn => ({ L: { num: [sideFac(q, q.want)], den: [] }, R: numbersFirst({ num: [{ ...sinFac(q, q.want, "m1R") }, sideFac(q, q.pair)], den: [sinFac(q, q.pair)] }) })
export const sinAlone = (q: SRQ): Eqn => ({ L: { num: [sinFac(q, q.want)], den: [] }, R: numbersFirst({ num: [{ ...sideFac(q, q.want, "m1R.s-" + q.want) }, sinFac(q, q.pair)], den: [sideFac(q, q.pair)] }) })

// ── flipping both fractions ──────────────────────────────────────────────

/** Tap the = and both fractions turn over, slowly. */
export function startFlip(S: Scene) {
  S.mode = "tapEq"
  S.tapAtoms = ["eq"]
  S.eqFn = S2 => eqnNode(S2.alg!, { pulse: S2.got.has("flipped") ? undefined : new Set(["eq"]) })
  S.onAtom = S2 => {
    if (S2.got.has("flipped")) return
    S2.got.add("flipped")
    S2.tapAtoms = []
    eqSlow(S2.eq, 1.5)
    S2.alg = flipBoth(S2.alg!)
    S2.touched = { kind: "eq" }
    later(S2, 1.9, S3 => { S3.got.add("flipDone"); S3.flashGood = Math.max(S3.flashGood, 0.8) })
  }
}

// ── the calculator ───────────────────────────────────────────────────────

const fnTex = (c: Corner, q: SRQ) => `\\sin ${degTex(angVal(q, c))}`

/** What students often type instead, and what to say. */
export function slipsFor(q: SRQ): { v: number; say: string }[] {
  const out: { v: number; say: string }[] = []
  const W = angVal(q, q.want), K = angVal(q, q.pair), k = sideVal(q, q.pair)
  if (q.find === "side") {
    out.push({ v: (k * sinD(K)) / sinD(W), say: `That's the sins the wrong way round. It is $\\sin ${degTex(W)}$ on top.` })
    out.push({ v: k / sinD(K), say: "That's only the right side's fraction. Now multiply by the sin on top." })
    out.push({ v: (k * Math.sin(W)) / Math.sin(K), say: "Your calculator is in radians. Set it to degrees." })
  }
  return out.filter(s => Math.abs(s.v - answerOf(q)) > 0.006 * Math.max(1, answerOf(q)))
}

/** Work out a side: the solved line with the answer box at its end. */
export function askSide(S: Scene, q: SRQ, onRight?: (S: Scene) => void) {
  startInput(S, {
    answer: answerOf(q), sf: 3, slips: slipsFor(q), onRight,
    typed: `${numText(sideVal(q, q.pair), 2)}*s${numText(angVal(q, q.want), 1)}/s${numText(angVal(q, q.pair), 1)}`,
    help: (S2, t) => { if (t === 1) say(S2, "Type exactly what the line says.", "calm", 3) },
  })
  S.eqFn = S2 => {
    const inp = S2.input
    const tail: ENode[] = [op("eq3", "=")]
    tail.push(inp?.state === "right" ? atom("ans", `${answerText(q)}${unitTex(q)}`, { col: GREEN }) : boxNode(S2))
    return eqnNode(S2.alg ?? solvedSide(q), { tail })
  }
  S.mode = "none"
}

/** An angle, step one: work out the right side (sin θ = ...). */
export function askSinValue(S: Scene, q: SRQ, onRight?: (S: Scene) => void) {
  const v = sinValue(q)
  startInput(S, {
    answer: v, sf: 4, onRight,
    typed: `${numText(sideVal(q, q.want), 2)}*s${numText(angVal(q, q.pair), 1)}/${numText(sideVal(q, q.pair), 2)}`,
    slips: [
      { v: (sideVal(q, q.pair) * sinD(angVal(q, q.pair))) / sideVal(q, q.want), say: "That's upside down. The line divides by the side under $\\sin$ on the right." },
      { v: (sideVal(q, q.want) * Math.sin(angVal(q, q.pair))) / sideVal(q, q.pair), say: "Your calculator is in radians. Set it to degrees." },
    ],
    help: (S2, t) => { if (t === 1) say(S2, "Type exactly what the right side says.", "calm", 3) },
  })
  S.eqFn = S2 => {
    const inp = S2.input
    const tail: ENode[] = [op("eq3", "=")]
    tail.push(inp?.state === "right" ? atom("val", `${sigText(v, 4)}\\ldots`, { col: GREEN }) : boxNode(S2))
    return eqnNode(S2.alg ?? sinAlone(q), { tail })
  }
  S.mode = "none"
}

/** sin⁻¹(sin θ) = sin⁻¹(0.6265…), then θ = sin⁻¹(0.6265…). */
export function inverseNode(q: SRQ, stage: "wrapped" | "alone", look: { strike?: Record<string, number>; pulse?: Set<string>; from?: Record<string, Vec>; fly?: number } = {}, tail: ENode[] = []): ENode {
  const c = q.want
  const P = (id: string, tex: string, more: Partial<EAtom> = {}) => atom(id, tex, { strike: look.strike?.[id], pulse: look.pulse?.has(id), from: look.from?.[id], fly: look.from?.[id] ? look.fly : undefined, ...more })
  const val = P("val", `${sigText(sinValue(q), 4)}\\ldots`, { col: CHALK })
  const theta = P(`ang-${c}`, nameOf(q), { col: col(c) })
  if (stage === "wrapped") {
    return row([P("invL", "\\sin^{-1}"), paren("pL", row([P(`fn-${c}`, "\\sin"), theta])), op("eq", "="), P("invR", "\\sin^{-1}"), paren("pR", val), ...tail], 0.06)
  }
  return row([theta, op("eq", "="), P("invR", "\\sin^{-1}"), paren("pR", val), ...tail], 0.06)
}

/** sin θ = 0.6265… (the line before the sin is undone). */
export function sinValueNode(q: SRQ, look: { pulse?: Set<string> } = {}): ENode {
  const c = q.want
  return row([atom(`fn-${c}`, "\\sin", { pulse: look.pulse?.has(`fn-${c}`) }), atom(`ang-${c}`, nameOf(q), { col: col(c) }), op("eq", "="), atom("val", `${sigText(sinValue(q), 4)}\\ldots`, { col: CHALK })])
}

/** Undo the sin: sin⁻¹ dragged onto both sides, then sin⁻¹ and sin tapped to cancel. */
export function startInverse(S: Scene, q: SRQ) {
  const c = q.want
  const st = { stage: "start" as "start" | "wrapped" | "done", strike: {} as Record<string, number>, from: {} as Record<string, Vec>, pulse: new Set<string>() }
  S.solve = { moves: [], stage: 0, busy: false, wrongs: 0, hintChip: null, strike: {}, from: {}, pulse: new Set(), tapCancel: true, done: false } satisfies SolveSR
  const v = solveOf(S)!
  S.mode = "solve"
  S.eqFn = () => (st.stage === "start" ? sinValueNode(q) : inverseNode(q, st.stage === "wrapped" ? "wrapped" : "alone", { ...st, fly: 1.1 }))
  const inv: Chip = { id: "inv-sin", kind: "inv", tex: "\\sin^{-1}", fac: { id: "inv", tex: "\\sin^{-1}", key: "inv", v: 1 } }
  const wrong: Chip = { id: "inv-cos", kind: "inv", tex: "\\cos^{-1}", fac: { id: "invc", tex: "\\cos^{-1}", key: "invc", v: 1 } }
  S.chips = [inv, wrong]
  S.onChip = (S2, id, at) => {
    if (v.busy || st.stage !== "start") return
    if (id !== "inv-sin") {
      say(S2, "$\\cos^{-1}$ only undoes $\\cos$. Here we need to undo $\\sin$.", "wrong", 4)
      v.wrongs++
      if (v.wrongs >= 2) v.hintChip = "inv-sin"
      return
    }
    st.from = { invL: at, invR: at }
    st.stage = "wrapped"
    S2.chips = []
    v.busy = true
    say(S2, "Both sides get $\\sin^{-1}$.", "calm", 3)
    later(S2, 1.3, S3 => {
      st.pulse = new Set(["invL", `fn-${c}`])
      v.pulse = st.pulse
      S3.tapAtoms = ["invL", `fn-${c}`]
      S3.onAtom = S4 => {
        S4.tapAtoms = []
        st.pulse = new Set()
        v.pulse = st.pulse
        st.strike = { invL: S4.time, [`fn-${c}`]: S4.time }
        later(S4, 0.85, S5 => {
          eqSlow(S5.eq, 1.1)
          st.stage = "done"
          st.strike = {}
          st.from = {}
          later(S5, 1.3, () => { v.done = true; v.busy = false })
        })
      }
    })
  }
}

/** An angle, step two: SHIFT sin Ans. */
export function askAngle(S: Scene, q: SRQ, onRight?: (S: Scene) => void) {
  // Ans holds the right side, as it would on the calculator just used
  setAns(sinValue(q))
  startInput(S, {
    answer: answerOf(q), dp: 1, onRight, typed: "Sa",
    slips: [
      { v: sinValue(q), say: "That's the number under $\\sin^{-1}$. Press SHIFT, $\\sin$, then Ans." },
      { v: Math.sin(sinValue(q) * RAD), say: "That is $\\sin$, not $\\sin^{-1}$. Press SHIFT first." },
      { v: Math.asin(clampU(sinValue(q))), say: "Your calculator is in radians. Set it to degrees." },
    ],
    help: (S2, t) => { if (t === 1) say(S2, "Press SHIFT, $\\sin$, then Ans.", "calm", 3.4) },
  })
  S.eqFn = S2 => {
    const inp = S2.input
    const tail: ENode[] = [op("eq3", "=")]
    tail.push(inp?.state === "right" ? atom("ans", `${answerText(q)}^\\circ`, { col: GREEN }) : boxNode(S2))
    return inverseNode(q, "alone", {}, tail)
  }
  S.mode = "none"
}

// ── "Show me how" ────────────────────────────────────────────────────────

export function sideWalk(q: SRQ): WalkStep<Scene>[] {
  const k = numText(sideVal(q, q.pair), 2), W = numText(angVal(q, q.want), 1), K = numText(angVal(q, q.pair), 1)
  const n = nameOf(q)
  return [
    { say: `The line says $${n} = ${k} \\times \\sin ${W}^\\circ \\div \\sin ${K}^\\circ$.`, tex: `${n} = \\dfrac{${k} \\times \\sin ${W}^\\circ}{\\sin ${K}^\\circ}` },
    { say: `Press $${k}$, $\\times$, $\\sin$, $${W}$, $\\div$, $\\sin$, $${K}$, then $=$.` },
    { say: `That gives $${sigText(answerOf(q), 6)}\\ldots$, which is $${answerText(q)}$ to $3$ significant figures.`, tex: `${n} = \\textcolor{${GREEN}}{${answerText(q)}}` },
  ]
}

export function sinValueWalk(q: SRQ): WalkStep<Scene>[] {
  const kw = numText(sideVal(q, q.want), 2), K = numText(angVal(q, q.pair), 1), k = numText(sideVal(q, q.pair), 2)
  return [
    { say: `The right side is $${kw} \\times \\sin ${K}^\\circ \\div ${k}$.`, tex: `\\dfrac{${kw} \\times \\sin ${K}^\\circ}{${k}}` },
    { say: `Press $${kw}$, $\\times$, $\\sin$, $${K}$, $\\div$, $${k}$, then $=$.`, tex: `= \\textcolor{${GREEN}}{${sigText(sinValue(q), 4)}\\ldots}` },
  ]
}

export function angleWalk(q: SRQ): WalkStep<Scene>[] {
  return [
    { say: "Ans is the answer the calculator just gave.", tex: `\\text{Ans} = ${sigText(sinValue(q), 4)}\\ldots` },
    { say: "Press SHIFT, then $\\sin$, then Ans, then $=$.", tex: `\\sin^{-1}(\\text{Ans}) = \\textcolor{${GREEN}}{${answerText(q)}^\\circ}` },
  ]
}

export { RED, labAt, fnTex, eqCentre }
