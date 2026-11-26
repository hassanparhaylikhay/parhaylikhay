/**
 * Constructions with compasses (4.2, lesson 2), on the map board: where two
 * circles cross, compasses opened against the ruler, carried onto a place
 * and turned to draw an arc, the student's own arcs carried from beat to
 * beat, a crossing tapped (the right one of two), and a point dragged until
 * it is a set distance from a place.
 */

import type { Vec } from "../geometry"
import { atom } from "../equation"
import { type Scene, type PenArc, PINK, norm, brgOf, along, addSeg, say, arcsCover, dist, ptS, compGeom } from "./scene"
import { type Beat, type MapSpec, look, mapBoard, nameBetween } from "./scale-kit"

/** Where the circle round `a` (radius r1) crosses the circle round `b` (radius r2): none, or two points (the one on the left of a→b first). */
export function circlesCross(a: Vec, r1: number, b: Vec, r2: number): Vec[] {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1])
  if (d < 1e-9 || d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9) return []
  const x = (d * d + r1 * r1 - r2 * r2) / (2 * d), h = Math.sqrt(Math.max(0, r1 * r1 - x * x))
  const e: Vec = [(b[0] - a[0]) / d, (b[1] - a[1]) / d], n: Vec = [-e[1], e[0]]
  const m: Vec = [a[0] + e[0] * x, a[1] + e[1] * x]
  return [[m[0] + n[0] * h, m[1] + n[1] * h], [m[0] - n[0] * h, m[1] - n[1] * h]]
}

/** An arc to keep on the page: round a place, a radius, through these bearings (the student's own, once drawn). */
export interface ArcSpec { at: string; r: number; through: number[] }
const same = (a: PenArc, c: Vec, r: number) => Math.abs(a.r - r) < 1e-6 && Math.hypot(a.at[0] - c[0], a.at[1] - c[1]) < 1e-6

/**
 * The arcs drawn in earlier beats: the student's own (kept in `S.arcMem`),
 * or, opened cold, one through the bearings it had to pass through.
 */
export function keepArcs(S: Scene, specs: ArcSpec[]) {
  for (const sp of specs) {
    const c = S.P[sp.at]
    if (!c) continue
    const mine = S.arcMem.filter(a => same(a, c, sp.r))
    if (mine.length) { S.penArcs.push(...mine.map(a => ({ ...a, pulse: false }))); continue }
    const lo = Math.min(...sp.through.map(b => norm(b - sp.through[0] + 180) - 180)) + sp.through[0]
    const hi = Math.max(...sp.through.map(b => norm(b - sp.through[0] + 180) - 180)) + sp.through[0]
    S.penArcs.push({ id: `k${sp.at}${sp.r}${S.penArcs.length}`, at: [...c] as Vec, r: sp.r, from: norm(lo - 24), sweep: hi - lo + 48 })
  }
}

/** If the pencil is off the screen (a phone, opened wide), turn it round the point, a little at a time, until it is on. */
function onScreen(S: Scene) {
  const C = S.comp
  if (!C) return
  const m = 30, seen = () => { const G = compGeom(S); return G.Q[0] > m && G.Q[0] < S.w - m && G.Q[1] > m + 100 && G.Q[1] < S.h - m }
  const d0 = C.dir
  for (let k = 0; k <= 12 && !seen(); k++) for (const sgn of [1, -1]) { C.dir = norm(d0 + sgn * k * 15); if (seen()) return }
  if (!seen()) C.dir = d0
}

/** The compasses lying on the ruler where it rests, the point on its 0, opened a little. */
function compOnRuler(S: Scene, M: MapSpec, open = 1.2) {
  S.ruler = { zero: [...M.ruler.zero] as Vec, dir: 90, len: M.ruler.len, on: null, along: null, pen: null, turn: false, move: false }
  S.comp = { point: [...M.ruler.zero] as Vec, on: null, open, dir: 90, canOpen: false, move: false, draw: false, drawing: null }
}

/**
 * Draw an arc with the compasses, one job at a time or all three in turn.
 * "open": they lie on the ruler; slide the pencil leg out to `r` (it clicks
 * there). "place": carry them by the point onto `at`. "draw":
 * turn the pencil round the point. "all": the three in turn, a calm note
 * naming each next job. The arc must pass through every bearing in `through`
 * (or go `round` degrees at least). Opened to a length in `wrongOpen`, a note.
 */
export function compBeat(id: string, say0: string, M: MapSpec, at: string, r: number, o: {
  job: "open" | "place" | "draw" | "all"
  through?: number[]
  round?: number
  wrongOpen?: { v: number; say: string }[]
  more?: (S: Scene) => void
  /** where the pencil starts, for a draw (a bearing from the point) */
  startDir?: number
  /** what the student is to do once the point is on the place */
  drawSay?: string
  shortSay?: string
  /** the lengths the question gives, kept on the board under the drawing (the student picks which one this arc needs) */
  given?: string
}): Beat {
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M)
      o.more?.(S)
      // drawn again from here: the student's earlier try at this arc is gone
      const c0 = S.P[at]
      if (c0) S.arcMem = S.arcMem.filter(a => !same(a, c0, r))
      compOnRuler(S, M, o.job === "open" || o.job === "all" ? 1.2 : r)
      const C = S.comp!
      if (o.job === "open" || o.job === "all") { C.canOpen = true; C.openAt = r }
      if (o.job === "place") { C.move = true; C.goal = at }
      if (o.job === "draw") { S.ruler = null; C.point = [...S.P[at]] as Vec; C.on = at; C.draw = true; C.dir = norm(o.startDir ?? (o.through?.length ? o.through[0] - 35 : 45)); S.timers.push({ at: S.time + 0.05, fn: onScreen }) }
      const before = S.penArcs.length
      let stage = o.job === "all" ? "open" : o.job
      S.tick = S2 => {
        const K = S2.comp
        if (!K || S2.drag || S2.got.has("done")) return
        if (stage === "open") {
          const wrong = o.wrongOpen?.find(w => Math.abs(w.v - K.open) < 1e-6)
          if (wrong && !S2.got.has(`w${wrong.v}`)) { S2.got.add(`w${wrong.v}`); say(S2, wrong.say, "wrong", 4.5) }
          if (K.open !== r) return
          if (o.job === "open") { S2.got.add("done"); return }
          stage = "place"
          K.canOpen = false; K.move = true; K.goal = at
          say(S2, `Now put the point on $${at}$.`, "calm", 4)
          return
        }
        if (stage === "place") {
          if (K.on !== at) return
          if (o.job === "place") { S2.got.add("done"); return }
          stage = "draw"
          K.move = false; K.draw = true; K.goal = undefined
          // the pencil swings round to just before where the arc must go (opened wide, it would be off the screen)
          K.dir = norm(o.startDir ?? (o.through?.length ? o.through[0] - 35 : 45))
          onScreen(S2)
          S2.ruler = null
          say(S2, o.drawSay ?? "Now turn the pencil round to draw the arc.", "calm", 4)
          return
        }
        // drawing: done once the arcs drawn here pass through every bearing asked for
        const P = S2.P[at]
        const mine = S2.penArcs.slice(before)
        if (!mine.length) return
        // `round`: how far round all the strokes go between them (a student may lift the pencil part way)
        const ok = o.round !== undefined
          ? Array.from({ length: 72 }, (_, k) => k * 5).filter(b => arcsCover(mine, P, r, b, 2)).length * 5 >= o.round
          : (o.through ?? []).every(b => arcsCover(mine, P, r, b))
        if (ok) {
          S2.got.add("done")
          S2.arcMem = [...S2.arcMem.filter(a => !same(a, P, r)), ...mine.map(a => ({ ...a }))]
          S2.note = null
          return
        }
        if (!S2.got.has(`short${mine.length}`)) { S2.got.add(`short${mine.length}`); say(S2, o.shortSay ?? "Draw it further round.", "wrong", 3.4) }
      }
      if (o.given) S.eqFn = () => atom("given", o.given!)
      look(S, o.given ? ["eq"] : [])
    },
    done: S => S.got.has("done"),
    advanceAfter: 1400,
  }
}

/**
 * Tap where two arcs (or lines) cross: `pts` are the crossings; the ones in
 * `ok` are right (either, by default), the others get their own note. The
 * new place takes `name` where it was tapped.
 */
export function tapCrossBeat(id: string, say0: string, board: (S: Scene) => void, pts: Vec[], name: string, o: { ok?: number[]; wrongSay?: string; brgs?: (S: Scene, p: Vec) => number[]; arcs?: [string, number][] } = {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      board(S)
      S.mode = "tapAny"
      S.onTap = (S2, p) => {
        if (S2.got.has("tap")) return
        // a crossing counts only where the arcs drawn really cross (`arcs`: their centres and radii)
        const drawn = (q: Vec) => !o.arcs || o.arcs.every(([at, r]) => !S2.P[at] || arcsCover(S2.penArcs, S2.P[at], r, brgOf(S2.P[at], q)))
        let best = -1, bd = Infinity
        pts.forEach((q, k) => { if (!drawn(q)) return; S2.P[`_x${k}`] = q; const d = dist(p, ptS(S2, `_x${k}`)); delete S2.P[`_x${k}`]; if (d < bd) { bd = d; best = k } })
        if (best < 0 || bd > (S2.touch ? 40 : 28)) { say(S2, `$${name}$ is where they cross.`, "wrong", 3.4); return }
        if (o.ok && !o.ok.includes(best)) { say(S2, o.wrongSay ?? "Not that one.", "wrong", 4); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.keep[`cross-${id}`] = best
        S2.P[name] = [...pts[best]] as Vec
        S2.names = { ...S2.names, [name]: name }
        if (o.brgs) nameBetween(S2, name, o.brgs(S2, pts[best]))
        S2.note = null
      }
      look(S)
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1600,
  }
}

/** The lines from a new corner to the two it is joined to (they grow), with their lengths if given. */
export function joinTo(S: Scene, c: string, ends: [string, string?][], grow = false) {
  for (const [e, tex] of ends) addSeg(S, e, c, { grown: !grow, lab: tex ? { tex } : undefined })
}

/** The bearing of a crossing from a place (for arcs that must pass through it). */
export const brgTo = (from: Vec, to: Vec) => brgOf(from, to)
export { along, PINK }
