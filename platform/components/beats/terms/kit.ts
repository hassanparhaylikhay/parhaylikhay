/**
 * Pieces shared by the terms board's mensuration lessons (perimeter and
 * area, circles, arcs and sectors): a clean board on a grid, labels beside
 * lines, tap targets on lines, a tap-one-line beat, a typed answer on the
 * calculator keys (exact, to a number of figures, or in terms of π), and
 * points gliding or turning over time.
 */

import type { BeatOf } from "../beat"
import type { WalkStep } from "../walk"
import type { Vec } from "../geometry"
import { atom, row, op } from "../equation"
import { type Scene, type VisKey, type Tap, type FreeLab, GREEN, resetBeat, show, say, startInput, boxNode, ptS, distToSeg, labelWidth, add, sub, mul, dot, lerpV, len } from "./scene"

export type Beat = BeatOf<Scene>
export type Walk = WalkStep<Scene>[]

const LOOK: VisKey[] = ["board", "grid", "shapes", "letters", "marks", "labels"]
export const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
export const watch = (id: string, say0: string, enter: (S: Scene) => void, after = 2.2): Beat => ({ id, say: say0, enter, cta: "", ctaAfter: after })
export const c = (col: string, tex: string) => `{\\color{${col}}${tex}}`
export const cm = (x: number | string) => `${x}\\text{ cm}`
export const cm2 = (x: number | string) => `${x}\\text{ cm}^2`
export const HALF = "\\tfrac{1}{2}"

/** A clean board fitted round [x0, x1] by [y0, y1], with a 1 cm grid over `grid` when asked. */
export function board(S: Scene, frame: [number, number, number, number], grid?: [number, number, number, number], axes = false) {
  resetBeat(S)
  S.frame = { x0: frame[0], y0: frame[1], x1: frame[2], y1: frame[3] }
  S.grid = grid ? { x0: grid[0], y0: grid[1], x1: grid[2], y1: grid[3], axes } : null
}

/** A label beside the line from a to b, on the side away from `from` (pixels clear of the line by its own size). */
export function edgeLab(key: string, a: Vec, b: Vec, tex: string, col: string, from: Vec, gap = 10): FreeLab {
  const m = lerpV(a, b, 0.5), d = sub(b, a), l = len(d) || 1
  let n: Vec = [-d[1] / l, d[0] / l]
  if (dot(n, sub(m, from)) < 0) n = mul(n, -1)
  const off = gap + Math.abs(n[0]) * (labelWidth(tex, 20) / 2 + 2) + Math.abs(n[1]) * 12
  return { key, at: m, tex, col, dx: n[0] * off, dy: -n[1] * off }
}
export const mid = (...ps: Vec[]): Vec => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length]

/** Tap targets on lines between named points. */
export const segTaps = (pairs: [string, string, string][]): Tap[] => pairs.map(([id, a, b]) => ({
  id,
  hit: (S, p) => distToSeg(p, ptS(S, a), ptS(S, b)),
  spot: S => lerpV(ptS(S, a), ptS(S, b), 0.5),
}))

/** Tap one target; the others get their notes. */
export function tapBeat(id: string, text: string, board0: (S: Scene) => void, o: { want: string; notes: Record<string, string>; wrong: string; then?: (S: Scene) => void }): Beat {
  return {
    id, say: text,
    enter: S => {
      board0(S)
      S.onTap = (S2, key) => {
        if (S2.got.has("done")) return
        if (key === o.want) { S2.got.add("done"); S2.note = null; S2.flashGood = 1; o.then?.(S2); return }
        say(S2, o.notes[key] ?? o.wrong, "wrong", 4.2)
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 1800,
  }
}

export const UNIT = { cm: "\\text{cm}", cm2: "\\text{cm}^2", m: "\\text{m}", m2: "\\text{m}^2", deg: "{}^\\circ" }

/**
 * A number typed on the calculator keys: `lead = [box] unit`. Right only
 * exactly, unless it asks for significant figures or decimal places; with
 * `piForm` it must keep π in it (`shown` is how the answer is written).
 */
export function ask(id: string, text: string, board0: (S: Scene) => void, o: {
  lead: string
  leadCol?: string
  unit?: keyof typeof UNIT
  answer: number
  shown?: string
  typed?: string
  sf?: number
  dp?: number
  piForm?: boolean
  slips?: { v: number; say: string }[]
  walk: Walk
  then?: (S: Scene) => void
}): Beat {
  const after = o.unit ? UNIT[o.unit] : ""
  const val = o.shown ?? String(o.answer)
  const shown = after ? `${val}${o.unit === "deg" ? "" : "\\,"}${after}` : val
  return {
    id, say: text,
    enter: S => {
      board0(S)
      S.keyRows = 3
      startInput(S, {
        answer: o.answer, slips: o.slips, typed: o.typed ?? String(o.answer), calc: true,
        sf: o.sf, dp: o.dp, piForm: o.piForm, exact: !o.sf && o.dp === undefined && !o.piForm,
        onRight: S2 => o.then?.(S2),
      })
      S.eqFn = S2 => {
        const right = S2.input?.state === "right"
        return row([atom("ql", o.lead, o.leadCol ? { col: o.leadCol } : {}), op("eq", "="), right ? atom("qa", shown, { col: GREEN }) : boxNode(S2), ...(after && !right ? [atom("qu", after)] : [])])
      }
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 1900,
    walk: o.walk,
  }
}

/** Glide points along a path over time: each to where `at(e)` puts it (e from 0 to 1, eased). */
export function glide(S: Scene, dur: number, at: (e: number) => Record<string, Vec>, wait = 0.5, end?: (S: Scene) => void) {
  S.acts.push({ dur: wait }, {
    dur,
    run: (S2, e) => { for (const [n, p] of Object.entries(at(e))) if (S2.pts[n]) { S2.pts[n].p = p; S2.pts[n].D = p } },
    end: S2 => { for (const [n, p] of Object.entries(at(1))) if (S2.pts[n]) { S2.pts[n].p = p; S2.pts[n].D = p }; end?.(S2) },
  })
}
/** Points turned about a centre by `deg`. */
export const turned = (pts: Record<string, Vec>, cen: Vec, deg: number): Record<string, Vec> => {
  const t = (deg * Math.PI) / 180, co = Math.cos(t), si = Math.sin(t)
  return Object.fromEntries(Object.entries(pts).map(([n, p]) => { const q = sub(p, cen); return [n, add(cen, [q[0] * co - q[1] * si, q[0] * si + q[1] * co])] }))
}
/** Run something over time (a count, a level): `set(S, e)` with e from 0 to 1. */
export const over = (S: Scene, dur: number, set: (S: Scene, e: number) => void, wait = 0.5, end?: (S: Scene) => void) =>
  S.acts.push({ dur: wait }, { dur, run: (S2, e) => set(S2, e), end: S2 => { set(S2, 1); end?.(S2) } })
