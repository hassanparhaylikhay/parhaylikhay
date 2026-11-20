/**
 * What the construction lessons (4.2) share, on the map board: figures on a
 * page (one world unit is a centimetre, so the ruler and the protractor
 * measure them exactly at any screen size), the protractor laid on an angle
 * (its 0 along either arm, its half circle over the angle), an angle read off
 * it, an angle marked with its pencil and a line ruled through the mark, and
 * a length marked along a line with the ruler's pencil.
 */

import type { Vec } from "../geometry"
import { type Scene, BLUE, GREEN, norm, diff, brgOf, along, addSeg, say, choose, toWorld, protGeom } from "./scene"
import { type Beat, type MapSpec, look, askNum, mapBoard } from "./scale-kit"

export type Fig = MapSpec

/** A figure on a page: its places, its lines, and where the protractor (and the ruler) rest before they are picked up. */
export function fig(o: { pts: Record<string, Vec>; names?: Record<string, string>; segs: [string, string][]; prot: Vec; up?: boolean; noProt?: boolean; ruler?: { zero: Vec; len: number }; room?: Vec[] }): Fig {
  // the protractor rests with its half circle hanging below its centre (or standing up, `up`): room for it on the page
  const p = o.prot, k = o.up ? -2.9 : 2.9
  return {
    pts: o.pts, names: o.names ?? Object.fromEntries(Object.keys(o.pts).map(n => [n, n])), norths: [], segs: o.segs, scale: "",
    ruler: o.ruler ?? { zero: [p[0] - 4, p[1] - 3.2], len: 10 }, prot: p,
    room: [...(o.room ?? []), ...(o.noProt ? [] : [[p[0] - Math.abs(k), p[1]], [p[0] + Math.abs(k), p[1]], [p[0], p[1] - k]] as Vec[])],
  }
}

/** Room round a place for the protractor to lie there (a board rebuilt by a beat's `more` loses mapBoard's own). */
export function protRoom(S: Scene, at: string) {
  const c = S.P[at]
  if (!c) return
  const k = S.w < 560 ? 3.8 : 2.9
  const q: Record<string, Vec> = { q0: [c[0], c[1] + k], q1: [c[0] + k, c[1]], q2: [c[0], c[1] - k], q3: [c[0] - k, c[1]] }
  Object.assign(S.P, q)
  S.fitPts = [...S.fitPts.filter(n => !(n in q)), ...Object.keys(q)]
}

/** The protractor rests with its half circle below its centre. */
export const REST_ROT = 90

// ── a protractor on an angle ─────────────────────────────────────────────

export interface Way { rot: number; arm: number; row: "outer" | "inner" }

/**
 * The ways a protractor can lie on the angle between two lines from its
 * corner (bearings b1 and b2): its straight edge along either line, its half
 * circle over the angle. Along the first line clockwise, the outer row starts
 * at 0 there; along the second, the inner row does. `wrong`: the edge along a
 * line but the half circle over the other side.
 */
export function protWays(b1: number, b2: number) {
  let first = b1, second = b2, sweep = norm(b2 - b1)
  if (sweep > 180) { first = b2; second = b1; sweep = 360 - sweep }
  const ways: Way[] = [{ rot: norm(first), arm: first, row: "outer" }, { rot: norm(second - 180), arm: second, row: "inner" }]
  return { sweep, first, second, ways, wrong: [norm(first + 180), norm(second)] }
}
export const armBrg = (S: Scene, at: string, to: string) => brgOf(S.P[at], S.P[to])
const waysAt = (S: Scene, at: string, a: string, b: string) => protWays(armBrg(S, at, a), armBrg(S, at, b))

/** The angle at a place, between the lines to two others: its arc (`tex` its label). */
export function angArc(S: Scene, at: string, a: string, b: string, col: string, o: { tex?: string; id?: string; pulse?: boolean; grow?: boolean; r?: number } = {}) {
  const W = waysAt(S, at, a, b)
  S.arcs.push({ id: o.id ?? `ang-${at}`, at, from: W.first, sweep: W.sweep, col, tex: o.tex, pulse: o.pulse, r: o.r ?? 1.3, grow: o.grow ? { v: 0, t: 1 } : undefined })
}
/** An angle not drawn yet: from a line at a place, the way a new line will go. */
export function angArcTo(S: Scene, at: string, arm: string, target: number, col: string, o: { tex?: string; id?: string; pulse?: boolean } = {}) {
  const W = protWays(armBrg(S, at, arm), target)
  S.arcs.push({ id: o.id ?? `ang-${at}`, at, from: W.first, sweep: W.sweep, col, tex: o.tex, pulse: o.pulse, r: 1.3 })
}
/** A right-angle square laid on an angle, from its first line (to compare the angle with 90°). */
export function squareOn(S: Scene, at: string, a: string, b: string, col = GREEN) {
  S.squares.push({ at, from: waysAt(S, at, a, b).first, col })
}

/**
 * The protractor and the angle at `at` between the lines to `a` and `b`, one
 * job at a time. "place": put its centre on the corner. "turn": it sits on
 * the corner; turn it until its straight edge lies along an arm with the half
 * circle over the angle (either arm counts; `arm` names the one the phrase
 * asks for, whose end glows). "both": the two in turn. The way it was laid is
 * kept for the reading after (`keep["rot-" + at]`).
 */
export function angleProtBeat(id: string, say0: string, M: Fig, at: string, a: string, b: string, o: { job?: "place" | "turn" | "both"; arm?: string; only?: string; startRot?: number; more?: (S: Scene) => void; wrongSay?: string; next?: string; target?: number } = {}): Beat {
  const job = o.job ?? "both"
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: at })
      o.more?.(S)
      protRoom(S, at)
      // a drawing beat has only one line yet: the angle runs to where the new line will go
      const W = o.target === undefined ? waysAt(S, at, a, b) : protWays(armBrg(S, at, a), o.target)
      const along = (r: number) => Math.abs(diff(r, armBrg(S, at, a))) < 0.01 || Math.abs(diff(r + 180, armBrg(S, at, a))) < 0.01
      const ways = o.target === undefined ? W.ways : W.ways.filter(w => along(w.arm))
      const wrong = o.target === undefined ? W.wrong : W.wrong.filter(along)
      const way = o.arm ? ways.find(w => Math.abs(diff(w.arm, armBrg(S, at, o.arm!))) < 0.01) : undefined
      // `only`: the phrase asks for one arm; laid along the other, it gets a note
      const ok = o.only && way ? [way] : ways
      const others = ways.filter(w => !ok.includes(w))
      const r0 = o.startRot ?? 40
      const placed = job === "turn"
      S.prot = {
        c: placed ? ([...S.P[at]] as Vec) : ([...M.prot] as Vec), rot: r0, on: placed ? at : null, pen: null, lit: null,
        turn: job !== "place", move: !placed, magnets: [...ways.map(w => w.rot), ...wrong],
        goal: placed ? undefined : at, want: way?.rot, aim: way?.arm,
      }
      // the line its 0 is to go along glows while it is being turned
      const cue = way ? S.segs.find(sg => (sg.a === at && sg.b === o.arm) || (sg.b === at && sg.a === o.arm)) : undefined
      let turned = false
      S.tick = S2 => {
        const P = S2.prot
        if (cue) cue.glow = !!P && P.on === at && job !== "place" && !S2.got.has("laid")
        S2.got.delete("laid")
        if (!P || S2.drag || P.on !== at) return
        if (job === "place") { S2.got.add("laid"); return }
        if (P.rot !== r0) turned = true
        const w = ok.find(x => x.rot === P.rot)
        if (w) { S2.keep[`rot-${at}`] = w.rot; S2.got.add("laid"); return }
        if (job === "both" && !S2.got.has("next")) { S2.got.add("next"); if (o.next) say(S2, o.next, "calm", 3.6) }
        const wrongNow = turned && wrong.includes(P.rot), otherNow = others.some(x => x.rot === P.rot)
        if ((wrongNow || otherNow) && !S2.got.has("said")) {
          S2.got.add("said")
          say(S2, otherNow ? o.only! : o.wrongSay ?? "Turn it round, so it covers the angle.", "wrong", 4)
        }
        if (!wrongNow && !otherNow) S2.got.delete("said")
      }
      look(S)
    },
    done: S => S.got.has("laid") && S.drag === null,
    advanceAfter: 1400,
  }
}

/** The protractor lying on an angle the way the student laid it (or along `arm`), its row to read lit, a lens over the crossing. */
export function protOnAngle(S: Scene, at: string, a: string, b: string, o: { arm?: string; lens?: boolean } = {}) {
  const W = waysAt(S, at, a, b)
  const kept = S.keep[`rot-${at}`]
  const byArm = o.arm ? W.ways.find(w => Math.abs(diff(w.arm, armBrg(S, at, o.arm!))) < 0.01) : undefined
  const way = byArm ?? W.ways.find(w => w.rot === kept) ?? W.ways[1]
  // the reading is where the other line crosses the edge
  const other = way === W.ways[0] ? W.second : W.first
  S.prot = { c: [...S.P[at]] as Vec, rot: way.rot, on: at, pen: null, lit: way.row, turn: false, move: false, magnets: [], spot: other, lens: o.lens !== false }
  return way
}

/**
 * Read an angle off the protractor and type it. A measured angle is right
 * within a degree of the true one; the other row's reading gets its own
 * note. Show me how lays the protractor along `a` and walks the row round.
 */
export function readAngleBeat(id: string, say0: string, M: Fig, at: string, a: string, b: string, o: { name: string; answer: number; walk: [string, string]; more?: (S: Scene) => void; then?: (S: Scene) => void; bigger?: boolean }): Beat {
  const ans = Math.round(o.answer), back = 180 - o.answer
  const otherSay = o.answer < 90 ? "That's the other row. This angle is less than $90^\\circ$." : "That's the other row. This angle is more than $90^\\circ$."
  return askNum(id, say0, S => { mapBoard(S, M, { prot: at }); o.more?.(S); protRoom(S, at); protOnAngle(S, at, a, b) }, {
    name: `\\text{Angle } ${o.name}`, answer: ans, deg: true, tol: Math.max(1, Math.abs(o.answer - ans) + 1), near: 4, max: 3,
    nearSay: "Close. Look again where the line crosses the row.",
    slips: [Math.floor(back) - 1, Math.floor(back), Math.ceil(back), Math.ceil(back) + 1].map(v => ({ v, say: otherSay })),
    walk: [
      { say: o.walk[0], show: S => { protOnAngle(S, at, a, b, { arm: a }); S.prot!.find = 0 } },
      { say: o.walk[1], show: S => { if (S.prot) S.prot.find = undefined } },
    ],
    then: o.then,
  })
}

/**
 * Mark an angle with the protractor's pencil: the protractor lies along `arm`
 * at `at`, over the side the new line goes; the pencil clicks on at the
 * angle on the row that starts at 0 there, and the line is ruled from the
 * corner through the mark. Stopping on the other row's number gets a note.
 */
export function markAngleBeat(id: string, say0: string, M: Fig, at: string, arm: string, target: number, value: number, o: { far: number; end?: string; more?: (S: Scene) => void; armName?: string }): Beat {
  const end = o.end ?? `${at}${Math.round(target)}`
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M, { prot: at })
      o.more?.(S)
      protRoom(S, at)
      const W = protWays(armBrg(S, at, arm), target)
      const way = W.ways.find(w => Math.abs(diff(w.arm, armBrg(S, at, arm))) < 0.01)!
      // the other row shows the same number here
      const wrongAt = way.row === "outer" ? norm(way.rot + 180 - value) : norm(way.rot + value)
      S.prot = { c: [...S.P[at]] as Vec, rot: way.rot, on: at, pen: Math.round(norm(way.row === "outer" ? way.rot + 4 : way.rot + 176)), penAt: target, lit: way.row, turn: false, move: false, magnets: [] }
      S.tick = S2 => {
        const P = S2.prot
        if (!P || P.pen === null || S2.drag || S2.got.has("marked")) return
        if (Math.abs(diff(P.pen, wrongAt)) < 1.5 && !S2.got.has("said")) {
          S2.got.add("said")
          say(S2, `That's $${value}$ on the other row. Use the row that starts at $0$ on $${o.armName ?? at + arm}$.`, "wrong", 4.5)
        }
        if (Math.abs(diff(P.pen, wrongAt)) >= 1.5) S2.got.delete("said")
        if (P.pen !== target) return
        // marked: the pencil's dot stays, the protractor lifts away, and the line is ruled through the mark
        S2.got.add("marked")
        S2.note = null
        const mark = `mk${end}`
        S2.P[mark] = toWorld(S2, protGeom(S2).penAt!)
        S2.dots = [...S2.dots, mark]
        S2.P[end] = along(S2.P[at], target, o.far)
        S2.timers.push({ at: S2.time + 0.5, fn: S3 => { S3.prot = null; addSeg(S3, at, end, { col: BLUE, grown: false }) } })
      }
      look(S)
    },
    done: S => S.got.has("marked") && S.segs.some(sg => sg.b === end && sg.grow.v > 0.97),
    advanceAfter: 1200,
  }
}

/** Mark a length along a line with the ruler's pencil (its 0 on `from`); the new place appears at the mark. */
export function penBeat(id: string, say0: string, M: Fig, from: string, brg: number, len: number, name: string, o: { rulerLen?: number; more?: (S: Scene) => void } = {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      mapBoard(S, M)
      o.more?.(S)
      S.ruler = { zero: [...S.P[from]] as Vec, dir: brg, len: o.rulerLen ?? Math.ceil(len + 1.5), on: from, along: null, pen: 0.5, turn: false, move: false, penAt: len }
      S.tick = S2 => {
        const R = S2.ruler
        if (!R || R.pen !== len || S2.drag || S2.got.has("done")) return
        S2.got.add("done")
        S2.P[name] = along(S2.P[from], brg, len)
        S2.names = { ...S2.names, [name]: name }
        S2.flashGood = 1
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1600,
  }
}

/** Guess first: is the angle more or less than 90°? Either way a right-angle square is laid on it. */
export function guessBeat(id: string, say0: string, board: (S: Scene) => void, at: string, a: string, b: string, more: boolean): Beat {
  return {
    id, say: say0,
    enter: S => {
      board(S)
      choose(S, ["Less", "More"], more ? 1 : 0, true, (S2, _k, right) => {
        squareOn(S2, at, a, b)
        const why = more ? "It is wider than a right angle." : "It fits inside a right angle."
        say(S2, right ? `Spot on. ${why}` : `Let's see. ${why}`, "calm", 600)
        S2.got.add("done")
      })
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2800,
  }
}

