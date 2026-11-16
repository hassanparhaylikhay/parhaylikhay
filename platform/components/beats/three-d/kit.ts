/**
 * The pieces both 3D lessons build their beats from: the boards (a box, a
 * pyramid, any solid), and the kinds of beat (turn it, join two corners, tap
 * the right angle, tap a triangle to lift it out, tap the missing side, work
 * out a length or an angle, move a piece across the =).
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import { row, op, atom, frac, type ENode, type EAtom } from "../equation"
import { setAns } from "../calc"
import {
  type Scene, type VisKey, type V3, type Arc3, CHALK, GREEN, PINK, ORANGE,
  BOX_FACES, PYRAMID_FACES, boxPts, pyramidPts, resetBeat, show, say, segKey, addSeg, liftOut, flyLabel,
  startInput, boxNode, startCross, crossDone,
} from "./scene"

export type Beat = BeatOf<Scene>

export const BOX = ["A", "B", "C", "D", "E", "F", "G", "H"]
export const PYR = ["A", "B", "C", "D", "E", "X"]
export const LOOK: VisKey[] = ["board", "floor", "solid", "letters", "lens", "marks", "flats"]
export const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
export const ASK: VisKey[] = ["eq", "keypad"]

/** A number for the board: whole when it is whole, else to `d` places. */
export function num(x: number, d = 2): string {
  if (Math.abs(x - Math.round(x)) < 1e-9) return String(Math.round(x))
  return x.toFixed(d).replace(/0+$/, "").replace(/\.$/, "")
}
export const sig = (x: number, n: number) => Number(x.toPrecision(n)).toString()
export const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`
export const pc = (id: string, tex: string, col?: string, more: Partial<EAtom> = {}): EAtom => atom(id, tex, { ...(col ? { col } : {}), ...more })
/** A piece and its square, close together (the square is its own piece, so it can move). */
export const sq = (id: string, tex: string, col?: string, more: Partial<EAtom> = {}): ENode => row([pc(id, tex, col, more), pc(`${id}q`, "{}^{2}", col, more)], 0.02)
export const stack = (id: string, top: ENode, under: ENode): ENode => frac(id, top, under, "rgba(0,0,0,0)")
export const lens = (tex: string, col?: string) => ({ tex, ...(col ? { col } : {}) })

// ── boards ───────────────────────────────────────────────────────────────

/** Clear the figure down to a fresh set of points. */
export function clearTo(S: Scene, pts: Record<string, V3>, keepNames: string[]) {
  for (const n of Object.keys(S.P3)) if (!keepNames.includes(n)) delete S.P3[n]
  Object.assign(S.P3, pts)
}

/** The box: its sizes (kept from the student's own box when `keep`), lettered unless told not to. */
export function boxBoard(S: Scene, o: { l?: number; w?: number; h?: number; letters?: boolean; keep?: boolean } = {}) {
  resetBeat(S)
  S.pyr = null
  if (!(o.keep && S.box)) S.box = { l: o.l ?? 12, w: o.w ?? 9, h: o.h ?? 8 }
  clearTo(S, boxPts(S.box.l, S.box.w, S.box.h), BOX)
  S.faces = BOX_FACES
  S.fitPts = BOX
  if (o.letters !== false) S.names = Object.fromEntries(BOX.map(n => [n, n]))
}

/** The box's length, width and height, written on its three edges (live while it is being built). */
export function boxLens(S: Scene) {
  const b = S.box
  if (!b) return
  S.lens[segKey("E", "H")] = lens(num(b.l))
  S.lens[segKey("H", "G")] = lens(num(b.w))
  S.lens[segKey("G", "C")] = lens(num(b.h))
}

/** A box with its long diagonal EC through it (and EG on the floor, the triangle, the right angle, once found). */
export function ecBoard(S: Scene, o: { l?: number; w?: number; h?: number; eg?: boolean; tri?: boolean; right?: boolean; ecTex?: string } = {}) {
  boxBoard(S, { l: o.l ?? 12, w: o.w ?? 9, h: o.h ?? 8 })
  boxLens(S)
  addSeg(S, "E", "C", { grown: true })
  if (o.ecTex) S.lens[segKey("E", "C")] = lens(o.ecTex, PINK)
  if (o.eg) addSeg(S, "E", "G", { grown: true })
  if (o.tri) S.tris = [{ id: "EGC", pts: ["E", "G", "C"], col: CHALK }]
  if (o.right) { S.rights = [{ at: "G", a: "E", b: "C" }]; S.edgeCol[segKey("C", "G")] = ORANGE }
}

/** A pyramid on a rectangle: A B C D the base, E the top, X the middle of the base. */
export function pyrBoard(S: Scene, o: { l?: number; w?: number; h?: number; names?: Partial<Record<string, string>>; diags?: boolean; height?: boolean } = {}) {
  resetBeat(S)
  S.box = null
  S.pyr = { l: o.l ?? 6, w: o.w ?? 6, h: o.h ?? 8 }
  clearTo(S, pyramidPts(S.pyr.l, S.pyr.w, S.pyr.h), PYR)
  S.faces = PYRAMID_FACES
  S.fitPts = PYR
  S.names = o.names ?? { A: "A", B: "B", C: "C", D: "D", E: "E", X: "X" }
  if (o.diags) { addSeg(S, "A", "C", { grown: true }); addSeg(S, "B", "D", { grown: true, faint: true }); S.dots = ["X"] }
  if (o.height) { addSeg(S, "X", "E", { grown: true }); S.rights = [{ at: "X", a: "E", b: "C" }] }
}

/** Any solid, from its points and faces. */
export function solidBoard(S: Scene, pts: Record<string, V3>, faces: string[][], names: Partial<Record<string, string>>) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  Object.assign(S.P3, pts)
  S.faces = faces
  S.fitPts = Object.keys(pts)
  S.names = names
}

// ── beat makers ──────────────────────────────────────────────────────────

/** Turn the figure: the arrow comes once it has been turned this far. */
export function turnBeat(id: string, say0: string, enter: (S: Scene) => void, degrees = 70, minPlay = 4): Beat {
  return { id, say: say0, enter, done: S => S.turned >= degrees, free: true, minPlay }
}

/** A watching beat: the arrow comes after `after` seconds. */
export function watch(id: string, say0: string, enter: (S: Scene) => void, after = 1.8): Beat {
  return { id, say: say0, enter, cta: "", ctaAfter: after }
}

/** Join two corners. Any other pair gets a note. */
export function joinBeat(id: string, say0: string, a: string, b: string, enter: (S: Scene) => void, wrong: (x: string, y: string) => string, o: { col?: string } = {}): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.mode = "join"
      S.tapPoints = Object.keys(S.names).filter(n => S.P3[n] && S.names[n])
      S.onJoin = (S2, x, y) => {
        if (S2.got.has("joined")) return
        if (segKey(x, y) !== segKey(a, b)) { say(S2, wrong(S2.names[x] ?? x, S2.names[y] ?? y), "wrong", 3.8); return }
        S2.got.add("joined")
        S2.mode = "none"
        S2.touched = addSeg(S2, a, b, { col: o.col })
        S2.note = null
      }
    },
    done: S => S.got.has("joined") && (S.segs[segKey(a, b)]?.grow.v ?? 0) > 0.95,
    advanceAfter: 1200,
  }
}

/** Tap the right angle among the arcs at a triangle's three corners. */
export function rightBeat(id: string, say0: string, enter: (S: Scene) => void, arcs: Arc3[], right: number, notes: Record<number, string>): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.mode = "tapArc"
      S.tapArcs = arcs
      S.onArc = (S2, i) => {
        if (S2.got.has("tap")) return
        if (i !== right) { say(S2, notes[i] ?? "Look for the corner where a line stands straight up.", "wrong", 4); return }
        S2.got.add("tap")
        S2.mode = "none"
        const g = arcs[right]
        S2.rights = [...S2.rights.filter(r => r.at !== g.at), { at: g.at, a: g.a, b: g.b, pulse: true }]
        S2.note = null
      }
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1500,
  }
}

/**
 * Tap a triangle in the figure; the right one lifts out flat beside it.
 * `right` is its right-angle corner, `flatLens` what its sides say.
 */
export function liftBeat(id: string, say0: string, enter: (S: Scene) => void, o: {
  regions: { id: string; pts: string[] }[]
  /** which regions are right, and the flat each one makes */
  makes: Record<string, { pts: [string, string, string]; right: string; lens: Record<string, { tex: string; col?: string }>; flat?: string; angle?: { at: string; tex?: string }; legs?: Record<string, number> }>
  notes?: Record<string, string>
}): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.mode = "tapRegion"
      S.regions = o.regions
      S.onRegion = (S2, rid) => {
        if (S2.got.has("tap")) return
        const m = o.makes[rid]
        if (!m) { say(S2, o.notes?.[rid] ?? "That one has no right angle.", "wrong", 4); return }
        S2.got.add("tap")
        S2.got.add(`r:${rid}`)
        S2.mode = "none"
        S2.regions = null
        S2.tris = [...S2.tris.filter(t => t.id !== rid), { id: rid, pts: m.pts, col: CHALK }]
        const F = liftOut(S2, m.flat ?? "up", m.pts, m.right, { ...m.lens })
        if (m.angle) F.angle = { ...m.angle }
        if (m.legs) F.legs = { ...m.legs }
        S2.note = null
      }
    },
    done: S => S.got.has("tap") && S.flats.length > 0 && S.flats[S.flats.length - 1].t.v > 0.97,
    advanceAfter: 700,
  }
}

/** On a flat triangle: tap the side we don't know yet. */
export function missingBeat(id: string, say0: string, enter: (S: Scene) => void, flat: string, want: string, notes: Record<string, string>): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      S.mode = "tapFlatSide"
      S.tapFlat = flat
      S.onFlatSide = (S2, key) => {
        if (S2.got.has("tap")) return
        if (key !== want) { say(S2, notes[key] ?? "We know that one.", "wrong", 3.6); return }
        S2.got.add("tap")
        S2.mode = "none"
        S2.touched = `${flat}:${key}`
        const F = S2.flats.find(f => f.id === flat)
        if (F?.lens[key]) F.lens[key].pulse = true
        S2.note = null
      }
    },
    done: S => S.got.has("tap"),
    advanceAfter: 1400,
  }
}

/**
 * Work out a length: "Name = [box]" on the board, the answer typed. When
 * right it is written on the flat (and flies to the others).
 */
export function askBeat(id: string, say0: string, enter: (S: Scene) => void, o: {
  name: string
  col: string
  answer: number
  sf?: number
  dp?: number
  shown: string
  typed: string
  slips?: { v: number; say: string }[]
  /** where the answer is written: [flat id, segKey] (the first is where it is worked out) */
  writes?: [string, string][]
  /** on the figure too */
  onFigure?: string
  /** an angle: written on this flat's angle mark */
  angleOn?: string
  /** what Ans holds as the question opens (the step before's answer), so a cold open works too */
  ans?: number
  walk: WalkStep<Scene>[]
}): Beat {
  return {
    id, say: say0,
    enter: S => {
      enter(S)
      if (o.ans !== undefined) setAns(o.ans)
      const first = o.writes?.[0]
      if (first) { const F = S.flats.find(f => f.id === first[0]); if (F?.lens[first[1]]) F.lens[first[1]].pulse = true }
      startInput(S, {
        answer: o.answer, sf: o.sf, dp: o.dp, max: 24, typed: o.typed, slips: o.slips,
        onRight: S2 => {
          ;(o.writes ?? []).forEach(([fid, key], i) => {
            const F = S2.flats.find(f => f.id === fid)
            if (!F) return
            F.lens[key] = { tex: o.shown, col: o.col }
            if (i > 0 && first) flyLabel(S2, `FN-${fid}-${key}`, `FN-${first[0]}-${first[1]}`)
          })
          if (o.onFigure) S2.lens[o.onFigure] = lens(o.shown, o.col)
          if (o.angleOn) { const F = S2.flats.find(f => f.id === o.angleOn); if (F?.angle) F.angle.tex = o.shown; S2.touched = "eq" }
          if (first) S2.touched = `${first[0]}:${first[1]}`
          S2.flashGood = 1
        },
      })
      S.eqFn = S2 => row([pc("nm", o.name, o.col), op("eq", "="), S2.input?.state === "right" ? pc("ans", o.shown, GREEN) : boxNode(S2)])
      look(S, ASK)
    },
    done: S => S.input?.state === "right",
    advanceAfter: 2000,
    walk: o.walk,
  }
}

/** Move a piece across the = (it does the opposite there). */
export function crossBeat(id: string, say0: string, enter: (S: Scene) => void, o: Parameters<typeof startCross>[1]): Beat {
  return {
    id, say: say0,
    enter: S => { enter(S); startCross(S, o); look(S, ["eq", "chips"]) },
    done: S => crossDone(S),
    advanceAfter: 900,
  }
}

/** A Pythagoras walkthrough: the longest side squared, square and add (or take away), then the root. */
export function pythWalk(name: string, col: string, a: [string, string, number], b: [string, string, number], minus = false): WalkStep<Scene>[] {
  const A = a[2], B = b[2]
  const r = minus ? A * A - B * B : A * A + B * B
  const nm = c(col, name)
  return minus
    ? [
      { say: `This time we know the longest side, $${a[0]}$.`, tex: `${c(a[1], a[0])}^2 = ${nm}^2 + ${c(b[1], b[0])}^2` },
      { say: `So $${name}^2$ is the longest side squared, take away the other.`, tex: `${nm}^2 = ${c(a[1], a[0])}^2 - ${c(b[1], b[0])}^2 = ${num(r, 3)}` },
      { say: "Now the square root.", tex: `${nm} = \\sqrt{${num(r, 3)}} = ${c(GREEN, sig(Math.sqrt(r), 3))}` },
    ]
    : [
      { say: `$${name}$ is the longest side of this triangle.`, tex: `${nm}^2 = ${c(a[1], a[0])}^2 + ${c(b[1], b[0])}^2` },
      { say: "Square each side, then add.", tex: `${nm}^2 = ${num(A * A, 3)} + ${num(B * B, 3)} = ${num(r, 3)}` },
      { say: "Now the square root.", tex: `${nm} = \\sqrt{${num(r, 3)}} = ${c(GREEN, sig(Math.sqrt(r), 3))}` },
    ]
}

