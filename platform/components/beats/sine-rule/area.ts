/**
 * The area of a triangle, ½ab sin C: its questions, the rule filled in by
 * the student, and working backwards from an area to a side.
 *
 * As in the cosine rule, the angle in the rule is always at corner C inside
 * a question, between a (yellow) and b (blue), whatever the paper calls
 * them.
 *
 *  - an area: Area = ½ × 7 × 9 × sin 50°, typed as it is written (× 0.5 for
 *    the half).
 *  - a side from an area: 30 = ½ × 8 × x × sin 40°. The student taps every
 *    piece that multiplies x and moves them across the = together (Hassan,
 *    2 Nov 2026: moving across is the technique when the algebra is messy),
 *    then works out the bottom and divides, so no brackets are needed.
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { type ENode, atom, op, row, frac } from "../equation"
import { sigText, setAns } from "../calc"
import {
  type Scene, type Corner, PAIR_COL, CHALK, GREEN, RAD, DEG,
  say, startInput, boxNode, numText,
} from "./scene"
import { type Look, pc, stack, dots, startCross, degT } from "./cos"

// ── a question ───────────────────────────────────────────────────────────

export interface AQ {
  id: string
  /** finding the area, or a side from the area */
  find: "area" | "side"
  side: Record<Corner, number>
  angle: Record<Corner, number>
  /** for a side: which of a and b is unknown, and what it is called */
  unknown?: "A" | "B"
  name?: string
  /** the area as the question gives it */
  area?: number
  unit?: string
  /** how a number is written when it is not its true size (10.0 from part (a)) */
  given?: Partial<Record<string, number>>
  /** the final answer: decimal places or significant figures asked (a "show that" asks one more) */
  dp?: number
  sf?: number
  P: Record<Corner, Vec>
  names?: Partial<Record<string, string>>
  pts?: Record<string, Vec>
  extra?: Scene["extra"]
  regions?: { id: string; pts: string[] }[]
  region?: string
  /** other angles written on the figure (not used by the rule) */
  angles?: Partial<Record<Corner, number>>
  inside?: Corner[]
}

/** C at the origin, CA along the floor (b), CB at angle C (a). */
const triPts = (a: number, b: number, C: number): Record<Corner, Vec> => ({ C: [0, 0], A: [b, 0], B: [a * Math.cos(C * RAD), a * Math.sin(C * RAD)] })

/** A triangle from a, b and the angle C between them. */
export function areaQ(id: string, a: number, b: number, C: number, more: Partial<AQ> = {}): AQ {
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * RAD))
  const A = Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)))) * DEG
  return { id, find: "area", side: { A: a, B: b, C: c }, angle: { A, B: 180 - A - C, C }, P: triPts(a, b, C), ...more }
}

export const sv = (q: AQ, k: Corner) => q.given?.[`side-${k}`] ?? q.side[k]
export const av = (q: AQ, k: Corner) => q.given?.[`ang-${k}`] ?? q.angle[k]
export const nameOf = (q: AQ) => q.name ?? "x"
export const unitTex = (q: AQ) => (q.unit ? `\\text{ ${q.unit}}` : "")
export const unit2Tex = (q: AQ) => (q.unit ? `\\text{ ${q.unit}}^{2}` : "")
const sinD = (d: number) => Math.sin(d * RAD)

/** The area from the numbers as the question writes them. */
export const areaOf = (q: AQ) => 0.5 * sv(q, "A") * sv(q, "B") * sinD(av(q, "C"))
/** Working backwards: everything multiplying the unknown (½ × the known side × sin C). */
export const blockOf = (q: AQ) => 0.5 * sv(q, q.unknown === "A" ? "B" : "A") * sinD(av(q, "C"))
export const sideOf = (q: AQ) => (q.area ?? areaOf(q)) / blockOf(q)
export const answerOf = (q: AQ) => (q.find === "area" ? areaOf(q) : sideOf(q))
export function answerText(q: AQ): string {
  const v = answerOf(q)
  if (q.dp !== undefined) return v.toFixed(q.dp)
  return sigText(v, q.sf ?? 3)
}

const nt = (q: AQ, k: Corner) => numText(sv(q, k), 2)
/** What a side says on the figure: its number, or the unknown's name. */
export const sideTex = (q: AQ, k: Corner) => (q.find === "side" && q.unknown === k ? nameOf(q) : `${nt(q, k)}${unitTex(q)}`)
export const knownOf = (q: AQ): Corner => (q.unknown === "A" ? "B" : "A")

/** Which of a and b the student put first in the rule (later beats keep their order). */
const ORDER: Record<string, [Corner, Corner]> = {}
export const orderOf = (q: AQ): [Corner, Corner] => ORDER[q.id] ?? ["A", "B"]

// ── the rule ─────────────────────────────────────────────────────────────

const HALF = "\\tfrac{1}{2}"
const RED = PAIR_COL.C
const slotBox = (id: string): ENode => ({ k: "box", id, tex: "", state: "idle", wrongAt: -9, slot: true })

/** One of a or b in the rule: its number, or the unknown. */
const sidePiece = (q: AQ, k: Corner, id: string, L: Look) => pc(id, q.find === "side" && q.unknown === k ? nameOf(q) : nt(q, k), PAIR_COL[k], L)

/** Area = ½ × 7 × 9 × sin 50° (or 30 = ½ × 8 × x × sin 40° working backwards). */
export function areaRule(q: AQ, L: Look = {}, tail: ENode[] = []): ENode {
  const [p1, p2] = orderOf(q)
  const left = q.find === "side" ? pc("ar", numText(q.area!, 2), CHALK, L) : pc("ar", "\\text{Area}", CHALK, L)
  return row([
    left, op("eq", "="), pc("half", HALF, undefined, L), op("t0", "\\times"), sidePiece(q, p1, "s1v", L), op("t1", "\\times"),
    sidePiece(q, p2, "s2v", L), op("t2", "\\times"), pc("sin", "\\sin", undefined, L), pc("angv", degT(av(q, "C")), RED, L), ...tail,
  ])
}

/** The ids of the pieces that multiply the unknown (working backwards). */
export function blockIds(q: AQ): string[] {
  const [p1] = orderOf(q)
  return ["half", p1 === q.unknown ? "s2v" : "s1v", "sin", "angv"]
}

/** x = 30 / (½ × 8 × sin 40°): the block moved across, under the area. */
export function sideLine(q: AQ, o: { bottom?: ENode; tail?: ENode[] } = {}): ENode {
  const k = knownOf(q)
  const bottom = o.bottom ?? row([pc("half", HALF), op("t0", "\\times"), pc(blockIds(q)[1], nt(q, k), PAIR_COL[k]), op("t2", "\\times"), pc("sin", "\\sin"), pc("angv", degT(av(q, "C")), RED)])
  const x = pc(orderOf(q)[0] === q.unknown ? "s1v" : "s2v", nameOf(q), PAIR_COL[q.unknown!])
  return row([x, op("eq", "="), frac("bar", pc("ar", numText(q.area!, 2), CHALK), bottom), ...(o.tail ?? [])])
}

// ── filling it ───────────────────────────────────────────────────────────

/**
 * Drag the two sides and the angle off the figure into Area = ½ × □ × □ × sin □.
 * The sides go either way round; the angle must be the one between them.
 */
export function startAreaFill(S: Scene, q: AQ, labels: Record<string, string>) {
  const items: NonNullable<Scene["fill"]>["items"] = {}
  for (const [key, tex] of Object.entries(labels)) {
    const c = key.slice(-1) as Corner
    items[key] = { id: key, kind: key.startsWith("side") ? "side" : "angle", tex, col: PAIR_COL[c] }
  }
  const from: Record<string, Vec> = {}
  S.fill = {
    slots: [{ id: "s1", want: "side-A", kind: "side" }, { id: "s2", want: "side-B", kind: "side" }, { id: "ang", want: "ang-C", kind: "angle" }],
    filled: {},
    items,
    onDrop: (S2, item, slot, at) => {
      if (!slot) return
      const f = S2.fill!
      const other = f.filled[slot === "s1" ? "s2" : "s1"]
      const ok = slot === "ang" ? item === "ang-C" : (item === "side-A" || item === "side-B") && item !== other
      if (ok) {
        f.filled[slot] = item
        from[slot] = at
        S2.touched = { kind: "eq" }
        S2.flashGood = 0.5
        S2.note = null
        if (f.filled.s1 && f.filled.s2) ORDER[q.id] = [f.filled.s1.slice(-1) as Corner, f.filled.s2.slice(-1) as Corner]
        return
      }
      let msg: string
      if (slot === "ang") msg = item.startsWith("ang") ? "That angle isn't between the two sides." : "Only an angle goes with $\\sin$."
      else if (item.startsWith("ang")) msg = "The angle goes with $\\sin$."
      else if (item === "side-C") msg = "That side isn't one of the two that make the angle."
      else msg = "That side is in already."
      say(S2, msg, "wrong", 3.6)
    },
  }
  S.mode = "fill"
  S.eqFn = S2 => {
    const fl = S2.fill!.filled
    const val = (slot: string, id: string): ENode => {
      const key = fl[slot]
      if (!key) return slotBox(slot)
      const it = S2.fill!.items[key]
      return atom(id, it.tex, { col: it.col, ...(from[slot] ? { from: from[slot], fly: 0.7 } : {}) })
    }
    const left = q.find === "side" ? atom("ar", numText(q.area!, 2), { col: CHALK }) : atom("ar", "\\text{Area}")
    return row([left, op("eq", "="), atom("half", HALF), op("t0", "\\times"), val("s1", "s1v"), op("t1", "\\times"), val("s2", "s2v"), op("t2", "\\times"), atom("sin", "\\sin"), val("ang", "angv")])
  }
}

export const areaFilled = (S: Scene) => !!S.fill && ["s1", "s2", "ang"].every(k => S.fill!.filled[k])

// ── typing it in ─────────────────────────────────────────────────────────

/** An area: the rule typed as it is written, × 0.5 for the half. */
export function askArea(S: Scene, q: AQ, onRight?: (S: Scene) => void) {
  const a = sv(q, "A"), b = sv(q, "B"), C = av(q, "C")
  const [p1, p2] = orderOf(q)
  const v = areaOf(q)
  startInput(S, {
    answer: v, sf: q.sf ?? 3, max: 32, onRight,
    typed: `0.5*${numText(sv(q, p1), 2)}*${numText(sv(q, p2), 2)}*s${numText(C, 1)}`,
    slips: [
      { v: a * b * sinD(C), say: "Don't forget the half." },
      { v: 0.5 * a * b * Math.cos(C * RAD), say: "It's $\\sin$ in this rule, not $\\cos$." },
      { v: 0.5 * a * b, say: `Times by $\\sin ${numText(C, 1)}^\\circ$ too.` },
      { v: 0.5 * a * b * Math.sin(C), say: "Your calculator is in radians. Set it to degrees." },
    ],
    help: (S2, t) => { if (t === 2) say(S2, "Type it as it's written. The half is $\\times\\,0.5$.", "calm", 4) },
  })
  S.eqFn = S2 => (S2.input?.state === "right"
    ? row([pc("ar", "\\text{Area}"), op("eq", "="), pc("res", `${answerText(q)}${unit2Tex(q)}`, GREEN)])
    : areaRule(q, {}, [op("eq2", "="), boxNode(S2)]))
}

/** Working backwards, step one: the bottom (½ × 8 × sin 40°), on a second line. */
export function askBlock(S: Scene, q: AQ, onRight?: (S: Scene) => void) {
  const k = knownOf(q)
  const v = blockOf(q)
  startInput(S, {
    answer: v, sf: 3, max: 24, onRight,
    typed: `0.5*${nt(q, k)}*s${numText(av(q, "C"), 1)}`,
    slips: [{ v: sv(q, k) * sinD(av(q, "C")), say: "Don't forget the half." }],
  })
  const id = blockIds(q)[1]
  const line = row([pc("k.half", HALF), op("k.t0", "\\times"), pc(`k.${id}`, nt(q, k), PAIR_COL[k]), op("k.t2", "\\times"), pc("k.sin", "\\sin"), pc("k.angv", degT(av(q, "C")), RED), op("k.eq", "="), ])
  S.eqFn = S2 => (S2.input?.state === "right"
    ? sideLine(q, { bottom: pc("botv", dots(v), CHALK) })
    : stack("stk", sideLine(q), row([line, boxNode(S2)])))
}

/** Working backwards, step two: the area ÷ the bottom. */
export function askSideFromArea(S: Scene, q: AQ, onRight?: (S: Scene) => void) {
  const v = blockOf(q)
  setAns(v)
  const A = q.area!
  startInput(S, {
    answer: sideOf(q), dp: q.dp, sf: q.dp === undefined ? q.sf ?? 3 : undefined, max: 24, onRight,
    typed: `${numText(A, 2)}/a`,
    slips: [
      { v: v / A, say: "It's the area divided by the bottom." },
      { v: A * v, say: "Divide by the bottom, don't multiply." },
    ],
    help: (S2, t) => { if (t === 1) say(S2, `Type $${numText(A, 2)}$, $\\div$, then Ans.`, "calm", 3.6) },
  })
  S.eqFn = S2 => sideLine(q, { bottom: pc("botv", dots(v), CHALK), tail: [op("eq2", "="), S2.input?.state === "right" ? pc("ans", `${answerText(q)}${unitTex(q)}`, GREEN) : boxNode(S2)] })
}

/** Everything multiplying the unknown crosses the = together and divides the area. */
export function crossBlock(S: Scene, q: AQ) {
  const k = knownOf(q)
  const blockTex = `\\tfrac{1}{2} \\times \\textcolor{${PAIR_COL[k]}}{${nt(q, k)}} \\times \\sin \\textcolor{${RED}}{${degT(av(q, "C"))}}`
  startCross(S, {
    ids: blockIds(q), label: blockTex, from: "right",
    options: [`$\\div \\left(${blockTex}\\right)$`, `$-\\,${blockTex}$`], answer: 0,
    notes: { 1: "It was multiplying. Across, it divides." },
    ask: "What does it all become over there?",
    before: L => areaRule(q, L),
    after: () => sideLine(q),
    landed: `So $${nameOf(q)}$ is the area divided by all of that.`,
  })
}

// ── "Show me how" ────────────────────────────────────────────────────────

export function areaWalk(q: AQ): WalkStep<Scene>[] {
  const [p1, p2] = orderOf(q)
  const s1 = nt(q, p1), s2 = nt(q, p2), C = numText(av(q, "C"), 1)
  return [
    { say: "Type the rule just as it's written. The half is $\\times\\,0.5$.", tex: `\\tfrac{1}{2} \\times ${s1} \\times ${s2} \\times \\sin ${C}^\\circ` },
    { say: `Press $0.5$, $\\times$, $${s1}$, $\\times$, $${s2}$, $\\times$, $\\sin$, $${C}$, then $=$.` },
    { say: `That gives $${sigText(areaOf(q), 6)}\\ldots$, which is $${answerText(q)}$ to $3$ significant figures.`, tex: `\\text{Area} = \\textcolor{${GREEN}}{${answerText(q)}${unit2Tex(q)}}` },
  ]
}

export function blockWalk(q: AQ): WalkStep<Scene>[] {
  const k = knownOf(q), C = numText(av(q, "C"), 1)
  return [
    { say: "Work out the bottom on its own.", tex: `\\tfrac{1}{2} \\times ${nt(q, k)} \\times \\sin ${C}^\\circ` },
    { say: `Press $0.5$, $\\times$, $${nt(q, k)}$, $\\times$, $\\sin$, $${C}$, then $=$.`, tex: `= \\textcolor{${GREEN}}{${dots(blockOf(q))}}` },
  ]
}

export function sideFromAreaWalk(q: AQ): WalkStep<Scene>[] {
  const A = numText(q.area!, 2)
  return [
    { say: "Divide the area by the bottom. Ans holds the bottom.", tex: `${A} \\div ${dots(blockOf(q))}` },
    { say: `Press $${A}$, $\\div$, Ans, then $=$.` },
    { say: `That gives $${sigText(sideOf(q), 6)}\\ldots$`, tex: `${nameOf(q)} = \\textcolor{${GREEN}}{${answerText(q)}${unitTex(q)}}` },
  ]
}
