/**
 * The equation board: maths that moves.
 *
 * An equation is a small tree (rows, fractions, single pieces). Every piece
 * has an id, and the board lays the tree out itself, piece by piece, so when
 * the equation changes each piece glides from where it was to where it now
 * belongs: a number flies up from a triangle into a fraction, a factor drops
 * onto both sides, two equal factors cancel and the fraction closes up, the
 * two sides swap. Pieces that are no longer there fade (or fly back to where
 * they came from); new ones fade in or fly in from a point.
 *
 * Every piece is KaTeX, measured once in the DOM so the layout is exact.
 * The board can tip like a balance when its two sides are not equal.
 *
 * The algebra half (`Fac`, `Side`, `Eqn`) keeps an equation as two sides,
 * each a product of factors over a product of factors. That is all the
 * O-level rearranging in trigonometry needs, and its moves (multiply or
 * divide both sides, cancel, swap) map one to one onto what the student
 * sees.
 *
 * Shared by any beat lesson; nothing here knows about triangles.
 */

import type { Vec } from "./geometry"
import { texHtml } from "./Tex"

// ── the tree ─────────────────────────────────────────────────────────────

export interface EAtom {
  k: "a"
  id: string
  tex: string
  col?: string
  /** an operator (=, ×, ÷): a little more room either side */
  op?: boolean
  /** a new piece flies in from this screen point */
  from?: Vec
  /** breathing: the student should look here */
  pulse?: boolean
  /** glowing yellow: the student can drag this */
  grab?: boolean
  /** scene time it started being struck out (it cancels) */
  strike?: number
  /** smaller, for working that sits beside the main line */
  scale?: number
}

/** The answer box: what the student has typed, inside a dashed box. */
export interface EBox {
  k: "box"
  id: string
  tex: string
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
}

export interface ERow { k: "row"; items: ENode[]; /** em between plain pieces (default 0.17) */ gap?: number }
export interface EFrac { k: "frac"; id: string; num: ENode; den: ENode; col?: string }
export type ENode = EAtom | EBox | ERow | EFrac

export const atom = (id: string, tex: string, more: Partial<EAtom> = {}): EAtom => ({ k: "a", id, tex, ...more })
export const op = (id: string, tex: string, more: Partial<EAtom> = {}): EAtom => ({ k: "a", id, tex, op: true, ...more })
export const row = (items: ENode[], gap?: number): ERow => ({ k: "row", items, gap })
export const frac = (id: string, num: ENode, den: ENode, col?: string): EFrac => ({ k: "frac", id, num, den, col })

// ── measuring ────────────────────────────────────────────────────────────

/** The class every piece is drawn with; measuring uses the same, so sizes match. */
export const ATOM_CLASS = "pl-eq-atom"

let styled = false
/** The few global rules the pieces need (a CSS module cannot style a class used outside it). */
export function ensureEqStyle() {
  if (styled || typeof document === "undefined") return
  styled = true
  const s = document.createElement("style")
  s.textContent = `
.${ATOM_CLASS}{position:absolute;left:0;top:0;white-space:nowrap;line-height:1;pointer-events:none;will-change:transform;
  text-shadow:0 0 4px #0d1216,0 0 8px #0d1216,0 0 12px #0d1216}
.${ATOM_CLASS} .katex{font-size:1em}
.pl-eq-pulse{animation:plEqPulse 1.4s ease-in-out infinite}
@keyframes plEqPulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.8) drop-shadow(0 0 7px currentColor)}}
.pl-eq-grab{animation:plEqGrab 1.8s ease-in-out infinite}
@keyframes plEqGrab{0%,100%{filter:drop-shadow(0 0 0 rgba(255,240,103,0))}50%{filter:drop-shadow(0 0 9px rgba(255,240,103,.85))}}
`
  document.head.appendChild(s)
}

interface Metric { w: number; base: number; h: number }
const mcache = new Map<string, Metric>()
let host: HTMLDivElement | null = null

/**
 * Width, and where the baseline sits, of one piece of KaTeX at a size, as
 * the board will draw it. Cached: the board lays itself out every frame.
 */
export function measure(tex: string, size: number): Metric {
  const key = `${size}|${tex}`
  const hit = mcache.get(key)
  if (hit) return hit
  if (typeof document === "undefined") return { w: tex.length * size * 0.5, base: size * 0.8, h: size }
  ensureEqStyle()
  if (!host) {
    host = document.createElement("div")
    host.style.cssText = "position:absolute;left:-10000px;top:0;visibility:hidden;pointer-events:none"
    document.body.appendChild(host)
  }
  const el = document.createElement("div")
  el.className = ATOM_CLASS
  el.style.fontSize = `${size}px`
  el.innerHTML = `${texHtml(tex)}<span style="display:inline-block;width:0;height:0"></span>`
  host.appendChild(el)
  const r = el.getBoundingClientRect()
  const k = el.querySelector(".katex") as HTMLElement | null
  const mark = el.lastChild as HTMLElement
  const w = k ? k.getBoundingClientRect().width : r.width
  const m = { w, base: mark.getBoundingClientRect().top - r.top, h: r.height }
  host.removeChild(el)
  if (mcache.size > 4000) mcache.clear()
  mcache.set(key, m)
  return m
}

// ── laying out ───────────────────────────────────────────────────────────

/** One piece where it belongs: `x` its left edge, `y` its baseline, both from the line's origin. */
export interface Placed { id: string; x: number; y: number; w: number; base: number; h: number; node: EAtom | EBox }
export interface PBar { id: string; x: number; y: number; w: number; col: string }
interface Laid { w: number; asc: number; desc: number; atoms: Placed[]; bars: PBar[] }

const BOX_H = 1.55

function boxMetric(b: EBox, size: number): Metric & { asc: number } {
  const inner = b.tex ? measure(b.tex, size).w : 0
  const w = Math.max(2.6 * size, inner + 0.7 * size)
  const h = BOX_H * size
  // the box sits on the maths axis, a quarter em above the baseline
  const asc = 0.25 * size + h / 2
  return { w, base: asc, h, asc }
}

function lay(n: ENode, size: number): Laid {
  if (n.k === "a") {
    const s = size * (n.scale ?? 1)
    const m = measure(n.tex, s)
    return { w: m.w, asc: m.base, desc: m.h - m.base, atoms: [{ id: n.id, x: 0, y: 0, w: m.w, base: m.base, h: m.h, node: n }], bars: [] }
  }
  if (n.k === "box") {
    const m = boxMetric(n, size)
    return { w: m.w, asc: m.asc, desc: m.h - m.asc, atoms: [{ id: n.id, x: 0, y: 0, w: m.w, base: m.base, h: m.h, node: n }], bars: [] }
  }
  if (n.k === "row") {
    const out: Laid = { w: 0, asc: 0, desc: 0, atoms: [], bars: [] }
    let x = 0
    n.items.forEach((it, i) => {
      const b = lay(it, size)
      if (i > 0) {
        const prev = n.items[i - 1]
        const isOp = (q: ENode) => q.k === "a" && !!q.op
        x += (isOp(prev) || isOp(it) ? 0.3 : n.gap ?? 0.17) * size
      }
      for (const a of b.atoms) out.atoms.push({ ...a, x: a.x + x })
      for (const r of b.bars) out.bars.push({ ...r, x: r.x + x })
      x += b.w
      out.asc = Math.max(out.asc, b.asc)
      out.desc = Math.max(out.desc, b.desc)
    })
    out.w = x
    return out
  }
  const N = lay(n.num, size), D = lay(n.den, size)
  const w = Math.max(N.w, D.w) + 0.3 * size
  const axis = -0.25 * size
  const nBase = axis - 0.17 * size - N.desc
  const dBase = axis + 0.2 * size + D.asc
  const out: Laid = { w, asc: N.asc - nBase, desc: dBase + D.desc, atoms: [], bars: [{ id: n.id, x: 0, y: axis, w, col: n.col ?? "#e8e6e0" }] }
  const nx = (w - N.w) / 2, dx = (w - D.w) / 2
  for (const a of N.atoms) out.atoms.push({ ...a, x: a.x + nx, y: a.y + nBase })
  for (const r of N.bars) out.bars.push({ ...r, x: r.x + nx, y: r.y + nBase })
  for (const a of D.atoms) out.atoms.push({ ...a, x: a.x + dx, y: a.y + dBase })
  for (const r of D.bars) out.bars.push({ ...r, x: r.x + dx, y: r.y + dBase })
  return out
}

/** How much room a tree takes: width, and height above and below the maths axis. */
export function extent(n: ENode, size: number): { w: number; up: number; down: number } {
  const L = lay(n, size)
  return { w: L.w, up: L.asc - 0.25 * size, down: L.desc + 0.25 * size }
}

// ── the board ────────────────────────────────────────────────────────────

/** A piece as drawn: eased toward where it belongs. */
export interface Drawn { x: number; y: number; w: number; base: number; h: number; op: number; node: EAtom | EBox }
export interface DBar { x: number; y: number; w: number; op: number; col: string }

export interface EqBoard {
  node: ENode | null
  size: number
  /** where the middle of the line's maths axis sits on screen */
  cx: number
  cy: number
  atoms: Record<string, Drawn>
  bars: Record<string, DBar>
  /** pieces on their way out */
  gone: { d: Drawn; to: Vec | null; life: number }[]
  /** where pieces that leave should fly to, by id */
  goneTo: Record<string, Vec>
  /** degrees the line is tipped, like a balance (springs to `t`) */
  tilt: { v: number; t: number }
  /** draw a small stand under the equals sign */
  stand: { v: number; t: number }
  /** lay out with no glide next frame (a beat opened cold) */
  snap: boolean
}

export function createBoard(): EqBoard {
  return { node: null, size: 28, cx: 0, cy: 0, atoms: {}, bars: {}, gone: [], goneTo: {}, tilt: { v: 0, t: 0 }, stand: { v: 0, t: 0 }, snap: false }
}

/** Put a new equation on the board. Pieces with the same id glide; others come and go. */
export function eqSet(B: EqBoard, node: ENode | null, goneTo: Record<string, Vec> = {}) {
  B.node = node
  B.goneTo = goneTo
}

/** Clear the board at once (a beat opened cold should not see the last one leave). */
export function eqClear(B: EqBoard) {
  B.node = null
  B.atoms = {}
  B.bars = {}
  B.gone = []
  B.tilt = { v: 0, t: 0 }
  B.stand = { v: 0, t: 0 }
}

/** Lay out the current equation and ease every piece toward its place. */
export function eqStep(B: EqBoard, dt: number) {
  const k = (f: number) => 1 - Math.pow(1 - f, dt * 60)
  B.tilt.v += (B.tilt.t - B.tilt.v) * k(0.09)
  B.stand.v += (B.stand.t - B.stand.v) * k(0.12)
  for (const g of B.gone) {
    g.life -= dt / (g.to ? 0.55 : 0.32)
    if (g.to) {
      const c: Vec = [g.d.x + g.d.w / 2, g.d.y - g.d.base + g.d.h / 2]
      const f = k(0.16)
      g.d.x += (g.to[0] - c[0]) * f
      g.d.y += (g.to[1] - c[1]) * f
    }
  }
  B.gone = B.gone.filter(g => g.life > 0)
  const seen = new Set<string>()
  const seenBars = new Set<string>()
  if (B.node) {
    const L = lay(B.node, B.size)
    const x0 = B.cx - L.w / 2
    const y0 = B.cy + 0.25 * B.size
    const fp = k(0.17)
    for (const a of L.atoms) {
      seen.add(a.id)
      const tx = x0 + a.x, ty = y0 + a.y
      const d = B.atoms[a.id]
      if (!d) {
        const from = a.node.k === "a" ? a.node.from : undefined
        if (from && !B.snap) B.atoms[a.id] = { x: from[0] - a.w / 2, y: from[1] - a.h / 2 + a.base, w: a.w, base: a.base, h: a.h, op: 0.35, node: a.node }
        else B.atoms[a.id] = { x: tx, y: ty + (B.snap ? 0 : 0.35 * B.size), w: a.w, base: a.base, h: a.h, op: B.snap ? 1 : 0, node: a.node }
        continue
      }
      d.node = a.node
      d.w = a.w; d.base = a.base; d.h = a.h
      d.x += (tx - d.x) * fp
      d.y += (ty - d.y) * fp
      d.op += (1 - d.op) * k(0.14)
      if (Math.abs(tx - d.x) < 0.05) d.x = tx
      if (Math.abs(ty - d.y) < 0.05) d.y = ty
    }
    for (const r of L.bars) {
      seenBars.add(r.id)
      const tx = x0 + r.x, ty = y0 + r.y
      const d = B.bars[r.id]
      if (!d) { B.bars[r.id] = { x: tx + r.w / 2, y: ty, w: B.snap ? r.w : 0, op: B.snap ? 1 : 0, col: r.col }; if (B.snap) B.bars[r.id].x = tx; continue }
      d.x += (tx - d.x) * fp
      d.y += (ty - d.y) * fp
      d.w += (r.w - d.w) * fp
      d.op += (1 - d.op) * k(0.14)
      d.col = r.col
    }
  }
  for (const id of Object.keys(B.atoms)) {
    if (seen.has(id)) continue
    B.gone.push({ d: B.atoms[id], to: B.goneTo[id] ?? null, life: 1 })
    delete B.atoms[id]
  }
  for (const id of Object.keys(B.bars)) {
    if (seenBars.has(id)) continue
    const d = B.bars[id]
    // a fraction bar that is no longer needed shrinks into its middle
    d.op += (0 - d.op) * k(0.2)
    d.x += d.w * 0.5 * k(0.2)
    d.w -= d.w * k(0.2)
    if (d.op < 0.02) delete B.bars[id]
  }
  B.snap = false
}

/** The middle of a piece on screen, if it is on the board. */
export function eqCentre(B: EqBoard, id: string): Vec | null {
  const d = B.atoms[id]
  if (!d) return null
  return [d.x + d.w / 2, d.y - d.base + d.h / 2]
}

/** The piece under a screen point, among `ids` if given. */
export function eqHit(B: EqBoard, p: Vec, ids?: string[], pad = 10): string | null {
  let best: string | null = null, bd = Infinity
  for (const [id, d] of Object.entries(B.atoms)) {
    if (ids && !ids.includes(id)) continue
    if (d.op < 0.5) continue
    const top = d.y - d.base
    if (p[0] < d.x - pad || p[0] > d.x + d.w + pad || p[1] < top - pad || p[1] > top + d.h + pad) continue
    const c: Vec = [d.x + d.w / 2, top + d.h / 2]
    const dd = Math.hypot(p[0] - c[0], p[1] - c[1])
    if (dd < bd) { bd = dd; best = id }
  }
  return best
}

/** The x of the equals sign on screen (the balance turns about it). */
export function eqPivot(B: EqBoard): number {
  const c = eqCentre(B, "eq")
  return c ? c[0] : B.cx
}

// ── algebra ──────────────────────────────────────────────────────────────

/**
 * One factor. `key` says which factors are the same thing (a 10 on top
 * cancels a 10 underneath); `v` is its value, so the board knows when the
 * two sides are equal. A factor drawn as two pieces ("sin" and "30°") lists
 * them in `parts`, so each can be animated on its own.
 */
export interface Fac {
  id: string
  tex: string
  col?: string
  key: string
  v: number
  parts?: { id: string; tex: string; col?: string }[]
}

/** A side: the product of `num` over the product of `den`. */
export interface Side { num: Fac[]; den: Fac[] }
export interface Eqn { L: Side; R: Side }

export const facVal = (fs: Fac[]) => fs.reduce((p, f) => p * f.v, 1)
export const sideVal = (s: Side) => facVal(s.num) / facVal(s.den)

/** What to do to pieces while drawing an equation. */
export interface EqnLook {
  strike?: Record<string, number>
  pulse?: Set<string>
  grab?: Set<string>
  from?: Record<string, Vec>
  /** pieces after the right-hand side ("=", the answer box ...) */
  tail?: ENode[]
}

function facNode(f: Fac, look: EqnLook): ENode {
  const more = (id: string): Partial<EAtom> => ({
    strike: look.strike?.[f.id] ?? look.strike?.[id],
    pulse: look.pulse?.has(f.id) || look.pulse?.has(id),
    grab: look.grab?.has(f.id) || look.grab?.has(id),
    from: look.from?.[id] ?? look.from?.[f.id],
  })
  if (f.parts) return row(f.parts.map(p => atom(p.id, p.tex, { col: p.col ?? f.col, ...more(p.id) })), 0.17)
  return atom(f.id, f.tex, { col: f.col, ...more(f.id) })
}

function product(fs: Fac[], look: EqnLook, tag: string): ENode {
  if (!fs.length) return atom(`one-${tag}`, "1")
  const items: ENode[] = []
  fs.forEach((f, i) => {
    if (i > 0) items.push(op(`times-${f.id}`, "\\times"))
    items.push(facNode(f, look))
  })
  return items.length === 1 ? items[0] : row(items)
}

/** A side as a tree: a product, or a fraction when something divides it. */
export function sideNode(s: Side, look: EqnLook = {}, tag = "s"): ENode {
  const top = product(s.num, look, `${tag}n`)
  if (!s.den.length) return top
  return frac(`bar-${s.den[0].id}`, top, product(s.den, look, `${tag}d`))
}

/** The whole equation as a tree, the equals sign's id is "eq". */
export function eqnNode(e: Eqn, look: EqnLook = {}): ENode {
  return row([sideNode(e.L, look, "L"), op("eq", "="), sideNode(e.R, look, "R"), ...(look.tail ?? [])])
}

/** A copy of a factor with new ids, for the other side or a new move. */
export function clone(f: Fac, tag: string): Fac {
  return { ...f, id: `${tag}.${f.id}`, parts: f.parts?.map(p => ({ ...p, id: `${tag}.${p.id}` })) }
}

/** Multiply both sides by `f` (it goes in front). */
export function mulBoth(e: Eqn, f: Fac, tag: string): Eqn {
  return {
    L: { num: [clone(f, `${tag}L`), ...e.L.num], den: [...e.L.den] },
    R: { num: [clone(f, `${tag}R`), ...e.R.num], den: [...e.R.den] },
  }
}

/** Multiply one side only (the balance tips). */
export function mulOne(e: Eqn, f: Fac, tag: string, side: "L" | "R"): Eqn {
  const s = e[side]
  const n = { num: [clone(f, `${tag}${side}`), ...s.num], den: [...s.den] }
  return side === "L" ? { L: n, R: e.R } : { L: e.L, R: n }
}

/** Divide both sides by `f` (it goes underneath). */
export function divBoth(e: Eqn, f: Fac, tag: string): Eqn {
  return {
    L: { num: [...e.L.num], den: [...e.L.den, clone(f, `${tag}L`)] },
    R: { num: [...e.R.num], den: [...e.R.den, clone(f, `${tag}R`)] },
  }
}

/** Factors on top and underneath that are the same thing, in pairs. */
export function cancelPairs(s: Side): [Fac, Fac][] {
  const out: [Fac, Fac][] = []
  const used = new Set<string>()
  for (const n of s.num) {
    const d = s.den.find(q => q.key === n.key && !used.has(q.id))
    if (d) { out.push([n, d]); used.add(d.id) }
  }
  return out
}

/** Every pair that cancels, on either side, as a list of factor ids. */
export function allCancels(e: Eqn): string[] {
  return [...cancelPairs(e.L), ...cancelPairs(e.R)].flat().map(f => f.id)
}

export function removeFacs(e: Eqn, ids: Set<string>): Eqn {
  const f = (s: Side): Side => ({ num: s.num.filter(x => !ids.has(x.id)), den: s.den.filter(x => !ids.has(x.id)) })
  return { L: f(e.L), R: f(e.R) }
}

export const swapSides = (e: Eqn): Eqn => ({ L: e.R, R: e.L })

/** The ids of every piece a factor draws (itself, or its parts). */
export function pieceIds(f: Fac): string[] {
  return f.parts ? f.parts.map(p => p.id) : [f.id]
}

/** Find a factor anywhere in the equation by id. */
export function findFac(e: Eqn, id: string): { f: Fac; side: "L" | "R"; where: "num" | "den" } | null {
  for (const side of ["L", "R"] as const) for (const where of ["num", "den"] as const) {
    const f = e[side][where].find(x => x.id === id || x.parts?.some(p => p.id === id))
    if (f) return { f, side, where }
  }
  return null
}
