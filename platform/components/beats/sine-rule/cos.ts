/**
 * The cosine rule: its questions, the rule filled in by the student, and the
 * moves that solve it.
 *
 * Inside a question the angle in the cos is always at C, so the rule always
 * reads c² = a² + b² − 2ab cos C in the pairs' colours (c and C red, a
 * yellow, b blue), whatever the paper calls the corners.
 *
 *  - a side: the two sides that make angle C and the angle itself are known.
 *    x² = 5² + 7² − 2 × 5 × 7 × cos 40° is typed as it is written, then the
 *    square moves across the = and becomes a square root.
 *  - an angle: all three sides are known. cos θ = (5² + 6² − 7²) / (2 × 5 × 6):
 *    the top, the bottom, then top ÷ bottom, then cos moves across and
 *    becomes cos⁻¹ (SHIFT cos Ans).
 *
 * Moving across the = is THE way things move here (Hassan, 2 Nov 2026: with
 * this much algebra it beats doing the same to both sides). The student drags
 * the piece over the =, then picks what it becomes there.
 */

import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { type ENode, type EAtom, atom, op, row, frac, paren, eqSlow, eqCentre } from "../equation"
import { sigText, setAns } from "../calc"
import {
  type Scene, type Corner, PAIR_COL, CHALK, GREEN, RAD, DEG,
  later, say, startInput, boxNode, numText, choose,
} from "./scene"

// ── a question ───────────────────────────────────────────────────────────

export interface CRQ {
  id: string
  /** finding the side across C, or angle C itself */
  find: "side" | "angle"
  /** true sizes, by corner (a side named by the corner across from it) */
  side: Record<Corner, number>
  angle: Record<Corner, number>
  /** what the unknown is called ("x", "BC", "\\theta") */
  name?: string
  unit?: string
  /** how a number is written when it is not its true size (5.6 from part (b)) */
  given?: Partial<Record<string, number>>
  /** decimal places the final length is asked to (a "show that" wants one more) */
  dp?: number
  /** the board */
  P: Record<Corner, Vec>
  names?: Partial<Record<string, string>>
  pts?: Record<string, Vec>
  extra?: Scene["extra"]
  /** parts of the figure to tap, and which one is this triangle */
  regions?: { id: string; pts: string[] }[]
  region?: string
  /** other angles written on the figure (not used by the rule) */
  shownAngles?: Partial<Record<Corner, number>>
  /** sides whose length is written inside the triangle (its outside is taken) */
  inside?: Corner[]
}

/** C at the origin, CA along the floor (b), CB at angle C (a). */
export function triPts(a: number, b: number, C: number): Record<Corner, Vec> {
  return { C: [0, 0], A: [b, 0], B: [a * Math.cos(C * RAD), a * Math.sin(C * RAD)] }
}

/** A side question: sides a and b, the angle C between them; c is wanted. */
export function sideQ(id: string, a: number, b: number, C: number, more: Partial<CRQ> = {}): CRQ {
  const c = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(C * RAD))
  const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * DEG
  return { id, find: "side", side: { A: a, B: b, C: c }, angle: { A, B: 180 - A - C, C }, P: triPts(a, b, C), ...more }
}

/** An angle question: all three sides; angle C (across c) is wanted. */
export function angleQ(id: string, a: number, b: number, c: number, more: Partial<CRQ> = {}): CRQ {
  const C = Math.acos((a * a + b * b - c * c) / (2 * a * b)) * DEG
  const A = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * DEG
  return { id, find: "angle", side: { A: a, B: b, C: c }, angle: { A, B: 180 - A - C, C }, P: triPts(a, b, C), ...more }
}

export const sv = (q: CRQ, k: Corner) => q.given?.[`side-${k}`] ?? q.side[k]
export const av = (q: CRQ, k: Corner) => q.given?.[`ang-${k}`] ?? q.angle[k]
export const nameOf = (q: CRQ) => q.name ?? (q.find === "side" ? "x" : "\\theta")
export const unitTex = (q: CRQ) => (q.unit ? `\\text{ ${q.unit}}` : "")
const cosD = (d: number) => Math.cos(d * RAD)
const clampU = (x: number) => Math.max(-1, Math.min(1, x))

/** x², for a side question: the right side worked out. */
export const sqValue = (q: CRQ) => sv(q, "A") ** 2 + sv(q, "B") ** 2 - 2 * sv(q, "A") * sv(q, "B") * cosD(av(q, "C"))
/** For an angle question: the top (a² + b² − c²), the bottom (2ab), and cos θ. */
export const topValue = (q: CRQ) => sv(q, "A") ** 2 + sv(q, "B") ** 2 - sv(q, "C") ** 2
export const botValue = (q: CRQ) => 2 * sv(q, "A") * sv(q, "B")
export const cosValue = (q: CRQ) => topValue(q) / botValue(q)
export const answerOf = (q: CRQ) => (q.find === "side" ? Math.sqrt(sqValue(q)) : Math.acos(clampU(cosValue(q))) * DEG)
export const answerText = (q: CRQ) => (q.find === "side" ? (q.dp !== undefined ? answerOf(q).toFixed(q.dp) : sigText(answerOf(q), 3)) : answerOf(q).toFixed(1))

const nt = (q: CRQ, k: Corner) => numText(sv(q, k), 2)
export const degT = (d: number) => `${numText(d, 1)}^\\circ`
/** What a side says on the figure: its number, or the unknown's name. */
export const sideTex = (q: CRQ, k: Corner) => (q.find === "side" && k === "C" ? nameOf(q) : `${nt(q, k)}${unitTex(q)}`)
export const angTex = (q: CRQ) => (q.find === "angle" ? nameOf(q) : degT(av(q, "C")))

/** A worked-out value as the board shows it: exactly when it is short, else four figures and dots. */
export function dots(x: number): string {
  for (let d = 0; d <= 3; d++) if (Math.abs(x - Number(x.toFixed(d))) < 1e-9) return x.toFixed(d)
  if (Math.abs(x) >= 100) return `${x.toFixed(1)}\\ldots`
  return `${sigText(x, 4)}\\ldots`
}

/** Which of a and b the student put first in the rule (the next beats keep their order). */
const ORDER: Record<string, [Corner, Corner]> = {}
export const orderOf = (q: CRQ): [Corner, Corner] => ORDER[q.id] ?? ["A", "B"]

// ── pieces ───────────────────────────────────────────────────────────────

/** How pieces are drawn: lit to grab, breathing, struck out, flying in. */
export interface Look { grab?: Set<string>; pulse?: Set<string>; strike?: Record<string, number>; from?: Record<string, Vec>; fly?: number }

export function pc(id: string, tex: string, col?: string, L: Look = {}, more: Partial<EAtom> = {}): EAtom {
  const fl = L.from?.[id] ? { from: L.from[id], fly: L.fly ?? 1.0 } : {}
  return atom(id, tex, { col, grab: L.grab?.has(id) || undefined, pulse: L.pulse?.has(id) || undefined, strike: L.strike?.[id], ...fl, ...more })
}
const SQ = "{}^{2}"
/** A piece and its square, close together (the square is its own piece, so it can move). */
const sq = (base: EAtom, sup: string, col: string | undefined, L: Look) => row([base, pc(sup, SQ, col, L)], 0.02)
const slotBox = (id: string): ENode => ({ k: "box", id, tex: "", state: "idle", wrongAt: -9, slot: true })
const RED = PAIR_COL.C

/** The side rule with the numbers in: x² = 5² + 7² − 2 × 5 × 7 × cos 40°. */
export function sideRule(q: CRQ, L: Look = {}, tail: ENode[] = []): ENode {
  const [p1, p2] = orderOf(q)
  return row([
    sq(pc("x", nameOf(q), RED, L), "xq", RED, L), op("eq", "="),
    sq(pc("s1v", nt(q, p1), PAIR_COL[p1], L), "s1q", PAIR_COL[p1], L), op("pl", "+"),
    sq(pc("s2v", nt(q, p2), PAIR_COL[p2], L), "s2q", PAIR_COL[p2], L), op("mi", "-"),
    pc("two", "2", undefined, L), op("t1", "\\times"), pc("p1v", nt(q, p1), PAIR_COL[p1], L), op("t2", "\\times"),
    pc("p2v", nt(q, p2), PAIR_COL[p2], L), op("t3", "\\times"), pc("cos", "\\cos", undefined, L), pc("angv", degT(av(q, "C")), RED, L),
    ...tail,
  ])
}

/** The top of the angle rule: 5² + 6² − 7². */
export function topRow(q: CRQ, L: Look = {}, pre = ""): ENode {
  const [p1, p2] = orderOf(q)
  return row([
    sq(pc(`${pre}s1v`, nt(q, p1), PAIR_COL[p1], L), `${pre}s1q`, PAIR_COL[p1], L), op(`${pre}pl`, "+"),
    sq(pc(`${pre}s2v`, nt(q, p2), PAIR_COL[p2], L), `${pre}s2q`, PAIR_COL[p2], L), op(`${pre}mi`, "-"),
    sq(pc(`${pre}sxv`, nt(q, "C"), RED, L), `${pre}sxq`, RED, L),
  ])
}
/** The bottom: 2 × 5 × 6. */
export function bottomRow(q: CRQ, L: Look = {}, pre = ""): ENode {
  const [p1, p2] = orderOf(q)
  return row([pc(`${pre}two`, "2", undefined, L), op(`${pre}t1`, "\\times"), pc(`${pre}p1v`, nt(q, p1), PAIR_COL[p1], L), op(`${pre}t2`, "\\times"), pc(`${pre}p2v`, nt(q, p2), PAIR_COL[p2], L)])
}

/** The angle rule with the numbers in: cos θ = (5² + 6² − 7²) / (2 × 5 × 6). */
export function angleRule(q: CRQ, L: Look = {}, o: { top?: ENode; bottom?: ENode; tail?: ENode[] } = {}): ENode {
  return row([pc("cos", "\\cos", undefined, L), pc("angv", nameOf(q), RED, L), op("eq", "="), frac("bar", o.top ?? topRow(q, L), o.bottom ?? bottomRow(q, L)), ...(o.tail ?? [])])
}

/** Two lines of maths, one under the other (a fraction with no bar). */
export const stack = (id: string, top: ENode, under: ENode): ENode => frac(id, top, under, "rgba(0,0,0,0)")

// ── filling the empty rule ───────────────────────────────────────────────

type Form = "side" | "angle"
/** The pieces of each place in the rule: its value's id, and its square's id (if squared). */
const IDS: Record<Form, Record<string, [string, string | null]>> = {
  side: { sx: ["x", "xq"], s1: ["s1v", "s1q"], s2: ["s2v", "s2q"], p1: ["p1v", null], p2: ["p2v", null], ang: ["angv", null] },
  angle: { sx: ["sxv", "sxq"], s1: ["s1v", "s1q"], s2: ["s2v", "s2q"], p1: ["p1v", null], p2: ["p2v", null], ang: ["angv", null] },
}
/** Which figure label each place wants (s1 and s2 take a and b either way round). */
const wantOf = (slot: string, item: string, filled: Record<string, string>) => {
  if (slot === "sx") return item === "side-C"
  if (slot === "ang") return item === "ang-C"
  if (slot === "s1" || slot === "s2") {
    const other = filled[slot === "s1" ? "s2" : "s1"]
    return (item === "side-A" || item === "side-B") && item !== other
  }
  return false
}

/** The rule as filled so far, empty places dashed. */
function templateNode(S: Scene, q: CRQ, form: Form, from: Record<string, Vec>): ENode {
  const f = S.fill!
  const val = (slot: string): ENode => {
    const key = f.filled[slot]
    if (!key) return slotBox(slot)
    const it = f.items[key]
    const [id] = IDS[form][slot]
    return atom(id, it.tex, { col: it.col, ...(from[slot] ? { from: from[slot], fly: slot.startsWith("p") ? 0.9 : 0.7 } : {}) })
  }
  const sup = (slot: string): ENode => {
    const key = f.filled[slot]
    return atom(IDS[form][slot][1]!, SQ, { col: key ? f.items[key].col : CHALK })
  }
  const sqd = (slot: string) => row([val(slot), sup(slot)], 0.02)
  if (form === "side") {
    return row([
      sqd("sx"), op("eq", "="), sqd("s1"), op("pl", "+"), sqd("s2"), op("mi", "-"),
      atom("two", "2"), op("t1", "\\times"), val("p1"), op("t2", "\\times"), val("p2"), op("t3", "\\times"), atom("cos", "\\cos"), val("ang"),
    ])
  }
  return row([
    atom("cos", "\\cos"), val("ang"), op("eq", "="),
    frac("bar", row([sqd("s1"), op("pl", "+"), sqd("s2"), op("mi", "-"), sqd("sx")]), row([atom("two", "2"), op("t1", "\\times"), val("p1"), op("t2", "\\times"), val("p2")])),
  ])
}

/**
 * Fill some places of the rule by dragging labels off the figure. `pre`
 * places are already filled (an earlier beat did them); the rest wait. When
 * a or b goes into its square, a copy flies on to its place in 2 × □ × □.
 */
export function startCosFill(S: Scene, q: CRQ, form: Form, slots: string[], labels: Record<string, string>, pre: string[] = []) {
  const items: NonNullable<Scene["fill"]>["items"] = {}
  for (const [key, tex] of Object.entries(labels)) {
    const c = key.slice(-1) as Corner
    items[key] = { id: key, kind: key.startsWith("side") ? "side" : "angle", tex, col: PAIR_COL[c] }
  }
  const [p1, p2] = orderOf(q)
  const canon: Record<string, string> = { sx: "side-C", ang: "ang-C", s1: `side-${p1}`, s2: `side-${p2}`, p1: `side-${p1}`, p2: `side-${p2}` }
  const filled: Record<string, string> = {}
  for (const k of Object.keys(canon)) {
    const isCopy = k === "p1" || k === "p2"
    const owner = isCopy ? (k === "p1" ? "s1" : "s2") : k
    if (pre.includes(owner)) filled[k] = canon[k]
  }
  const from: Record<string, Vec> = {}
  const name = nameOf(q)
  S.fill = {
    slots: slots.map(id => ({ id, want: canon[id], kind: id === "ang" ? "angle" : "side" })),
    filled,
    items,
    onDrop: (S2, item, slot, at) => {
      if (!slot) return
      const f = S2.fill!
      if (wantOf(slot, item, f.filled)) {
        f.filled[slot] = item
        from[slot] = at
        S2.touched = { kind: "eq" }
        S2.flashGood = 0.5
        S2.note = null
        if (slot === "s1" || slot === "s2") {
          // the same side again, by itself, in 2 × □ × □
          const copy = slot === "s1" ? "p1" : "p2"
          later(S2, 0.45, S3 => {
            const c = eqCentre(S3.eq, IDS[form][slot][0])
            if (c) from[copy] = c
            S3.fill!.filled[copy] = item
            if (S3.fill!.filled.s1 && S3.fill!.filled.s2) ORDER[q.id] = [S3.fill!.filled.s1.slice(-1) as Corner, S3.fill!.filled.s2.slice(-1) as Corner]
          })
        }
        return
      }
      const isAng = item.startsWith("ang")
      let msg: string
      if (slot === "ang") msg = "Only an angle goes with $\\cos$."
      else if (isAng) msg = item === "ang-C" ? "The angle goes with $\\cos$." : "That angle isn't in this rule."
      else if (form === "side") msg = item === "side-C" ? `$${name}$ goes on the left, on its own.` : slot === "sx" ? "The side on the left is the one across from the angle." : "That side is in already."
      else msg = item === "side-C" ? `This side is across from $${name}$. It goes after the minus.` : slot === "sx" ? `The side taken away is the one across from $${name}$.` : "That side is in already."
      say(S2, msg, "wrong", 3.6)
    },
  }
  S.mode = "fill"
  S.eqFn = S2 => templateNode(S2, q, form, from)
}

/** Whether these places (and the copies they make) are filled. */
export function cosFilled(S: Scene, slots: string[]): boolean {
  const f = S.fill
  if (!f) return false
  const need = [...slots, ...(slots.includes("s1") ? ["p1"] : []), ...(slots.includes("s2") ? ["p2"] : [])]
  return need.every(k => f.filled[k])
}

// ── moving a piece across the = ──────────────────────────────────────────

export interface CrossState { stage: 0 | 1; pulse: Set<string>; grab: Set<string>; crossed: boolean; done: boolean }
export const crossOf = (S: Scene) => S.solve as CrossState | null
export const crossDone = (S: Scene) => !!crossOf(S)?.done

/**
 * The student drags a piece (any of `ids`, all one term) over the =, then
 * picks what it becomes on the other side. Wrong picks get their own note.
 */
export function startCross(S: Scene, o: {
  ids: string[]
  /** what the carried term shows */
  label: string
  from: "left" | "right"
  options: string[]
  answer: number
  notes?: Record<number, string>
  before: (L: Look) => ENode
  after: () => ENode
  /** said once it has crossed, before the choice */
  ask?: string
  /** said once it lands */
  landed?: string
  /** pieces that fly to a place as they go (the square to its root) */
  goneTo?: (S: Scene) => Record<string, Vec>
}) {
  const st: CrossState = { stage: 0, pulse: new Set(), grab: new Set(o.ids), crossed: false, done: false }
  S.solve = st
  S.mode = "solve"
  S.dragAtoms = [...o.ids]
  for (const id of o.ids) S.dragTex[id] = o.label
  S.eqFn = () => (st.stage === 0 ? o.before({ pulse: st.pulse, grab: st.grab }) : o.after())
  S.onAtomDrop = (S2, _id, _onto, at) => {
    if (st.crossed) return
    const eq = eqCentre(S2.eq, "eq")
    if (!eq) return
    const over = o.from === "left" ? at[0] > eq[0] + 6 : at[0] < eq[0] - 6
    const near = Math.abs(at[1] - eq[1]) < S2.eq.size * 3.2
    if (!over || !near) { say(S2, "Drag it over the $=$, to the other side.", "calm", 3); return }
    st.crossed = true
    st.grab = new Set()
    st.pulse = new Set(o.ids)
    S2.dragAtoms = []
    say(S2, o.ask ?? "What does it become over there?", "calm", 600)
    choose(S2, o.options, o.answer, false, (S3, k, right) => {
      if (!right) { say(S3, o.notes?.[k] ?? "Moving across does the opposite.", "wrong", 4.2); return }
      S3.note = null
      later(S3, 0.5, S4 => {
        S4.choice = null
        if (o.goneTo) S4.eq.goneTo = o.goneTo(S4)
        eqSlow(S4.eq, 1.4)
        st.stage = 1
        st.pulse = new Set()
        S4.touched = { kind: "eq" }
        S4.flashGood = 0.6
        if (o.landed) say(S4, o.landed, "calm", 600)
        later(S4, 1.7, () => { st.done = true })
      })
    })
  }
}

// ── typing it in ─────────────────────────────────────────────────────────

const box = (S: Scene) => boxNode(S)

/** A side, step one: the right side as it is written. */
export function askSquare(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const a = sv(q, "A"), b = sv(q, "B"), C = av(q, "C")
  const v = sqValue(q)
  const [p1, p2] = orderOf(q)
  const s1 = numText(sv(q, p1), 2), s2 = numText(sv(q, p2), 2)
  startInput(S, {
    answer: v, sf: 3, max: 32, onRight,
    typed: `${s1}^+${s2}^-2*${s1}*${s2}*c${numText(C, 1)}`,
    slips: [
      { v: (a * a + b * b - 2 * a * b) * cosD(C), say: `That worked out $${s1}^2 + ${s2}^2 - 2 \\times ${s1} \\times ${s2}$ first. Multiply by $\\cos ${numText(C, 1)}^\\circ$ before taking away.` },
      { v: a * a + b * b + 2 * a * b * cosD(C), say: "That added. The rule takes it away." },
      { v: a * a + b * b - 2 * a * b * Math.cos(C), say: "Your calculator is in radians. Set it to degrees." },
      { v: a + b - 2 * a * b * cosD(C), say: "Square the two sides first." },
    ],
    help: (S2, t) => { if (t === 2) say(S2, "Type it just as it's written, from left to right.", "calm", 4) },
  })
  S.eqFn = S2 => (S2.input?.state === "right" ? row([pc("x", nameOf(q), RED), pc("xq", SQ, RED), op("eq", "="), pc("res", dots(v), GREEN)]) : sideRule(q, {}, [op("eq2", "="), box(S2)]))
}

/** x² = 20.38…, as the next beats start. */
export const squareLine = (q: CRQ, L: Look = {}) => row([sq(pc("x", nameOf(q), RED, L), "xq", RED, L), op("eq", "="), pc("res", dots(sqValue(q)), CHALK, L)])
/** x = √20.38… */
export const rootLine = (q: CRQ, tail: ENode[] = []) => row([pc("x", nameOf(q), RED), op("eq", "="), pc("res", `\\sqrt{${dots(sqValue(q))}}`), ...tail])

/** The square crosses the = and becomes a square root (not ÷ 2). */
export function crossSquare(S: Scene, q: CRQ) {
  const n = nameOf(q)
  startCross(S, {
    ids: ["xq"], label: "{}^{2}", from: "left",
    options: ["$\\sqrt{\\phantom{x}}$", "$\\div\\,2$"], answer: 0,
    notes: { 1: "Halving doesn't undo a square. A square root does." },
    ask: "What does the square become over there?",
    before: L => squareLine(q, L),
    after: () => rootLine(q),
    landed: `$${n}$ is the square root of $${dots(sqValue(q))}$.`,
    goneTo: S2 => { const c = eqCentre(S2.eq, "res"); const out: Record<string, Vec> = {}; if (c) out.xq = c; return out },
  })
}

/** A side, step two: √ Ans. */
export function askRoot(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const v = sqValue(q)
  setAns(v)
  const dp = q.dp
  startInput(S, {
    answer: Math.sqrt(v), sf: dp === undefined ? 3 : undefined, dp, max: 32, onRight, typed: "ra",
    slips: [
      { v, say: `That's $${nameOf(q)}^2$. Take the square root.` },
      { v: v / 2, say: "Halving doesn't undo a square. A square root does." },
    ],
    help: (S2, t) => { if (t === 1) say(S2, "Press $\\sqrt{\\phantom{x}}$, then Ans.", "calm", 3.6) },
  })
  S.eqFn = S2 => rootLine(q, [op("eq2", "="), S2.input?.state === "right" ? pc("ans", `${answerText(q)}${unitTex(q)}`, GREEN) : box(S2)])
}

/** Where pieces of the equation are now (for copies that fly from them). */
function centres(S: Scene, ids: string[], pre: string): Record<string, Vec> {
  const out: Record<string, Vec> = {}
  for (const id of ids) { const p = eqCentre(S.eq, id); if (p) out[`${pre}${id}`] = p }
  return out
}

/** An angle, step one: the top comes down to a second line to be worked out, and its answer goes back up. */
export function askTop(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const a = sv(q, "A"), b = sv(q, "B"), c = sv(q, "C")
  const [p1, p2] = orderOf(q)
  const t = topValue(q)
  const ids = ["s1v", "s1q", "pl", "s2v", "s2q", "mi", "sxv", "sxq"]
  const from = centres(S, ids, "k.")
  const back: Record<string, Vec> = {}
  const look: Look = { pulse: new Set(ids) }
  startInput(S, {
    answer: t, sf: 3, max: 32,
    onRight: S2 => { const p = eqCentre(S2.eq, "box"); if (p) back.topv = p; onRight?.(S2) },
    typed: `${numText(sv(q, p1), 2)}^+${numText(sv(q, p2), 2)}^-${numText(c, 2)}^`,
    slips: [
      { v: a * a + b * b + c * c, say: `Take $${numText(c, 2)}^2$ away, don't add it.` },
      { v: a + b - c, say: "Square each side first." },
    ],
  })
  S.eqFn = S2 => {
    if (S2.input?.state === "right") return angleRule(q, {}, { top: pc("topv", dots(t), CHALK, { from: back, fly: 1.0 }) })
    return stack("stk", angleRule(q, look), row([topRow(q, { from, fly: 1.0 }, "k."), op("eq2", "="), box(S2)]))
  }
}

/** An angle, step two: the bottom, the same way. */
export function askBottom(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const a = sv(q, "A"), b = sv(q, "B")
  const [p1, p2] = orderOf(q)
  const t = topValue(q), u = botValue(q)
  const ids = ["two", "t1", "p1v", "t2", "p2v"]
  const from = centres(S, ids, "k.")
  const back: Record<string, Vec> = {}
  startInput(S, {
    answer: u, sf: 3, max: 20,
    onRight: S2 => { const p = eqCentre(S2.eq, "box"); if (p) back.botv = p; onRight?.(S2) },
    typed: `2*${numText(sv(q, p1), 2)}*${numText(sv(q, p2), 2)}`,
    slips: [{ v: a * b, say: "Don't forget the $2$." }],
  })
  const look: Look = { pulse: new Set(ids) }
  S.eqFn = S2 => {
    const top = pc("topv", dots(t), CHALK)
    if (S2.input?.state === "right") return angleRule(q, {}, { top, bottom: pc("botv", dots(u), CHALK, { from: back, fly: 1.0 }) })
    return stack("stk", angleRule(q, look, { top }), row([bottomRow(q, { from, fly: 1.0 }, "k."), op("eq2", "="), box(S2)]))
  }
}

/** cos θ = 12/60, as the divide step and later beats show it. */
export const fracLine = (q: CRQ, L: Look = {}, tail: ENode[] = []) =>
  row([pc("cos", "\\cos", undefined, L), pc("angv", nameOf(q), RED, L), op("eq", "="), frac("bar", pc("topv", dots(topValue(q)), CHALK), pc("botv", dots(botValue(q)), CHALK)), ...tail])
/** cos θ = 0.2 */
export const cosLine = (q: CRQ, L: Look = {}) => row([pc("cos", "\\cos", undefined, L), pc("angv", nameOf(q), RED, L), op("eq", "="), pc("cv", dots(cosValue(q)), CHALK, L)])

/** An angle, step three: top ÷ bottom. */
export function askDivide(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const t = topValue(q), u = botValue(q)
  startInput(S, {
    answer: t / u, sf: 3, max: 24, onRight,
    typed: `${numText(t, 4)}/${numText(u, 4)}`.replace(/^-/, "-"),
    slips: [{ v: u / t, say: "It's the top divided by the bottom." }],
  })
  S.eqFn = S2 => (S2.input?.state === "right" ? cosLine(q) : fracLine(q, {}, [op("eq2", "="), box(S2)]))
}

/** cos crosses the = and becomes cos⁻¹ (cos θ is not cos × θ). */
export function crossCos(S: Scene, q: CRQ) {
  const n = nameOf(q)
  const v = dots(cosValue(q))
  startCross(S, {
    ids: ["cos"], label: "\\cos", from: "left",
    options: ["$\\cos^{-1}$", "$\\div \\cos$"], answer: 0,
    notes: { 1: `$\\cos${n}$ isn't $\\cos \\times ${n}$. Undo $\\cos$ with $\\cos^{-1}$.` },
    ask: "What does $\\cos$ become over there?",
    before: L => cosLine(q, L),
    after: () => row([pc("angv", n, RED), op("eq", "="), pc("cos", "\\cos^{-1}"), paren("pR", pc("cv", v, CHALK))]),
    landed: `$${n}$ is $\\cos^{-1}$ of $${v}$.`,
  })
}

/** θ = cos⁻¹(0.2), as the last step shows it. */
export const invLine = (q: CRQ, tail: ENode[] = []) => row([pc("angv", nameOf(q), RED), op("eq", "="), pc("cos", "\\cos^{-1}"), paren("pR", pc("cv", dots(cosValue(q)), CHALK)), ...tail])

/** An angle, the last step: SHIFT cos Ans. */
export function askAngle(S: Scene, q: CRQ, onRight?: (S: Scene) => void) {
  const v = cosValue(q)
  setAns(v)
  startInput(S, {
    answer: answerOf(q), dp: 1, onRight, typed: "Ca",
    slips: [
      { v, say: "That's $\\cos\\theta$ itself. Press SHIFT, $\\cos$, then Ans." },
      { v: Math.cos(v * RAD), say: "That is $\\cos$, not $\\cos^{-1}$. Press SHIFT first." },
      { v: Math.acos(clampU(v)), say: "Your calculator is in radians. Set it to degrees." },
      { v: Math.asin(clampU(v)) * DEG, say: "That's $\\sin^{-1}$. We're undoing $\\cos$." },
    ],
    help: (S2, t) => { if (t === 1) say(S2, "Press SHIFT, $\\cos$, then Ans.", "calm", 3.4) },
  })
  S.eqFn = S2 => invLine(q, [op("eq2", "="), S2.input?.state === "right" ? pc("ans", `${answerText(q)}^\\circ`, GREEN) : box(S2)])
}

// ── "Show me how" ────────────────────────────────────────────────────────

export function squareWalk(q: CRQ): WalkStep<Scene>[] {
  const [p1, p2] = orderOf(q)
  const s1 = numText(sv(q, p1), 2), s2 = numText(sv(q, p2), 2), C = numText(av(q, "C"), 1)
  const n = nameOf(q)
  return [
    { say: "Type the right side just as it's written.", tex: `${n}^2 = ${s1}^2 + ${s2}^2 - 2 \\times ${s1} \\times ${s2} \\times \\cos ${C}^\\circ` },
    { say: `Press $${s1}$, $x^2$, $+$, $${s2}$, $x^2$, $-$, $2$, $\\times$, $${s1}$, $\\times$, $${s2}$, $\\times$, $\\cos$, $${C}$, then $=$.` },
    { say: "The calculator does the multiplying before the taking away.", tex: `${n}^2 = \\textcolor{${GREEN}}{${dots(sqValue(q))}}` },
  ]
}

export function rootWalk(q: CRQ): WalkStep<Scene>[] {
  const n = nameOf(q)
  const ans = answerText(q)
  return [
    { say: `$${n}$ is the square root of $${dots(sqValue(q))}$.`, tex: `${n} = \\sqrt{${dots(sqValue(q))}}` },
    { say: "Press $\\sqrt{\\phantom{x}}$, Ans, then $=$." },
    { say: `That gives $${sigText(answerOf(q), 6)}\\ldots$, which is $${ans}$${q.dp !== undefined ? ` to $${q.dp}$ decimal places` : " to $3$ significant figures"}.`, tex: `${n} = \\textcolor{${GREEN}}{${ans}}` },
  ]
}

export function topWalk(q: CRQ): WalkStep<Scene>[] {
  const [p1, p2] = orderOf(q)
  const a = sv(q, p1), b = sv(q, p2), c = sv(q, "C")
  const sq2 = (x: number) => numText(x * x, 4)
  return [
    { say: "Square each side, then add the first two and take the third away.", tex: `${numText(a, 2)}^2 + ${numText(b, 2)}^2 - ${numText(c, 2)}^2` },
    { say: "Work out each square.", tex: `${sq2(a)} + ${sq2(b)} - ${sq2(c)}` },
    { say: "That gives the top.", tex: `= \\textcolor{${GREEN}}{${dots(topValue(q))}}` },
  ]
}

export function bottomWalk(q: CRQ): WalkStep<Scene>[] {
  const [p1, p2] = orderOf(q)
  return [
    { say: "Multiply $2$ by the two sides.", tex: `2 \\times ${numText(sv(q, p1), 2)} \\times ${numText(sv(q, p2), 2)}` },
    { say: "That gives the bottom.", tex: `= \\textcolor{${GREEN}}{${dots(botValue(q))}}` },
  ]
}

export function divideWalk(q: CRQ): WalkStep<Scene>[] {
  return [
    { say: "Divide the top by the bottom.", tex: `${dots(topValue(q))} \\div ${dots(botValue(q))}` },
    { say: `That gives $\\cos ${nameOf(q)}$.`, tex: `\\cos ${nameOf(q)} = \\textcolor{${GREEN}}{${dots(cosValue(q))}}` },
  ]
}

export function angleWalk(q: CRQ): WalkStep<Scene>[] {
  const n = nameOf(q)
  return [
    { say: `$${n}$ is $\\cos^{-1}$ of $${dots(cosValue(q))}$.`, tex: `${n} = \\cos^{-1}(${dots(cosValue(q))})` },
    { say: "Press SHIFT, $\\cos$, Ans, then $=$." },
    { say: `That gives $${answerOf(q).toFixed(4)}\\ldots^\\circ$, which is $${answerText(q)}^\\circ$ to $1$ decimal place.`, tex: `${n} = \\textcolor{${GREEN}}{${answerText(q)}^\\circ}` },
  ]
}
