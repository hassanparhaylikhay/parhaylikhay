/**
 * Line and rotational symmetry (4.5, lesson 1 of 2), one tiny idea per beat.
 *
 * The student folds a shape along its line of symmetry, turns a line through
 * a shape until it clicks where the halves match (and sees a diagonal that
 * does not), finds all the lines of a square, and turns a shape round its
 * middle over its outline, counting how often it fits: the order. Every
 * click comes from the figure itself (sym.ts), never from a list. Questions
 * from 4024/12/O/N/19 Q7(a), 4024/23/M/J/25 Q4, 4024/11/M/J/22 Q2,
 * 4024/12/M/J/21 Q2 and 4024/11/O/N/21 Q4(a).
 *
 * Colours: lines of symmetry blue (dashed), a folded copy green where it
 * matches and pink where it does not, what can be dragged or tapped yellow.
 */

import type { BeatOf } from "../beat"
import type { Vec } from "../geometry"
import type { WalkStep } from "../walk"
import { applyParts } from "../chapter"
import { atom, row, op } from "../equation"
import {
  type Scene, type VisKey, BLUE, GREEN, PINK, CHALK, ORANGE,
  P, place, resetBeat, show, say, choose, startInput, boxNode, ptS, inPoly, add, mul, sub, RAD,
} from "./scene"
import { type Item, reflect, rotate, fits, axesOf, orderOf } from "./sym"

type Beat = BeatOf<Scene>

const LOOK: VisKey[] = ["board", "grid", "shapes", "letters", "marks", "labels"]
const look = (S: Scene, more: VisKey[] = []) => show(S, [...LOOK, ...more])
const watch = (id: string, say0: string, enter: (S: Scene) => void, after = 2.0): Beat => ({ id, say: say0, enter, cta: "", ctaAfter: after })
const dirOf = (deg: number): Vec => [Math.cos(deg * RAD), Math.sin(deg * RAD)]
const reg = (n: number, r: number, start: number, c: Vec = [0, 0]): Vec[] => Array.from({ length: n }, (_, i) => add(c, mul(dirOf(start + (360 * i) / n), r)))
const tall = (S: Scene) => S.h > S.w * 1.25
const SHADE = 0.55

// ── figures ──────────────────────────────────────────────────────────────

/** A figure: its parts (for drawing and for checking), its middle, and how far it reaches from it. */
interface Fig { items: Item[]; c: Vec; R: number }
const poly = (pts: Vec[], fill = false): Item => ({ kind: "poly", pts, fill })
const seg = (a: Vec, b: Vec): Item => ({ kind: "seg", a, b })
const one = (pts: Vec[]): Fig => ({ items: [poly(pts)], c: [0, 0], R: Math.max(...pts.map(p => Math.hypot(p[0], p[1]))) })

const HOUSE: Vec[] = [[-1.5, -1.5], [1.5, -1.5], [1.5, 0.8], [0, 2.3], [-1.5, 0.8]]
const RECT = one([[-2, -1.2], [2, -1.2], [2, 1.2], [-2, 1.2]])
const SQUARE = one([[-1.5, -1.5], [1.5, -1.5], [1.5, 1.5], [-1.5, 1.5]])
const TRI = one(reg(3, 2, 90))
const HEX = one(reg(6, 2, 90))
const PARA = one([[-2, -1.2], [1.2, -1.2], [2, 1.2], [-1.2, 1.2]])
const ARROW = one([[-2, -0.4], [0.6, -0.4], [0.6, -1.1], [2, 0], [0.6, 1.1], [0.6, 0.4], [-2, 0.4]])

/** 4024/12/O/N/19 Q7(a): a circle, its centre and two equal chords (symmetric about the line at 27°). */
const W19 = (() => { const p = (d: number): Vec => mul(dirOf(d), 3); return { items: [seg(p(150), p(54)), seg(p(-96), p(0))], c: [0, 0] as Vec, R: 3 } })()
/** 4024/11/M/J/22 Q2: the T diagram (one line), and the hexagon with a cross (order 2). */
const S22T: Fig = { items: [seg([0, -2], [0, 2]), seg([-0.9, 2], [0.9, 2]), seg([-0.9, -2], [0.9, -2]), seg([-3, 0], [3, 0]), seg([-3, 0], [-3, 0.4]), seg([3, 0], [3, 0.4])], c: [0, 0], R: 3 }
const S22H: Fig = { items: [poly(reg(6, 3, 90)), seg([-0.8, 0], [0.8, 0]), seg([0, -0.8], [0, 0.8])], c: [0, 0], R: 3 }
/** 4024/12/M/J/21 Q2: a hexagon with every other triangle shaded, and a square pattern. */
const S21H: Fig = (() => { const v = reg(6, 2, 90); return { items: [poly(v), ...v.map((p, i) => poly([[0, 0], p, v[(i + 1) % 6]], i % 2 === 0))], c: [0, 0] as Vec, R: 2 } })()
const S21S: Fig = { items: [poly([[0, 0], [4, 0], [4, 4], [0, 4]]), poly([[2, 2], [4, 2], [4, 4], [2, 4]], true), poly([[0, 0], [2, 0], [2, 2], [0, 2]], true), poly([[0, 4], [1, 4], [1, 3]], true), poly([[4, 0], [3, 0], [3, 1]], true), seg([0, 4], [4, 0])], c: [2, 2], R: 2.9 }

/** Draw a figure on the board: its shapes and lines, as named points (`key` keeps two figures apart). */
function drawFig(S: Scene, f: Fig, key = "f", o: { at?: Vec; ghost?: boolean } = {}) {
  const at = o.at ?? [0, 0]
  const pts: Record<string, Vec> = {}
  f.items.forEach((it, i) => {
    if (it.kind === "poly") {
      it.pts.forEach((p, j) => { pts[`${key}${i}_${j}`] = add(p, at) })
      S.polys.push({ id: `${key}${i}`, pts: it.pts.map((_, j) => `${key}${i}_${j}`), fill: it.fill ? CHALK : undefined, fillOp: it.fill ? SHADE : undefined, ghost: o.ghost })
    } else {
      pts[`${key}${i}_a`] = add(it.a, at); pts[`${key}${i}_b`] = add(it.b, at)
      S.segs.push({ id: `${key}${i}`, a: `${key}${i}_a`, b: `${key}${i}_b`, dash: o.ghost, col: o.ghost ? "rgba(232,230,224,0.45)" : undefined })
    }
  })
  place(S, pts)
}
/** The names of a drawn figure's points. */
const figNames = (f: Fig, key: string) => f.items.flatMap((it, i) => (it.kind === "poly" ? it.pts.map((_, j) => `${key}${i}_${j}`) : [`${key}${i}_a`, `${key}${i}_b`]))
/** Where every point of a drawn figure is, moved by f (set at once, drawn there too). */
function moveFig(S: Scene, fg: Fig, key: string, f: (p: Vec) => Vec, at: Vec = [0, 0]) {
  fg.items.forEach((it, i) => {
    const set = (n: string, p: Vec) => { const q = add(f(p), at); if (S.pts[n]) { S.pts[n].p = q; S.pts[n].D = q } }
    if (it.kind === "poly") it.pts.forEach((p, j) => set(`${key}${i}_${j}`, p))
    else { set(`${key}${i}_a`, it.a); set(`${key}${i}_b`, it.b) }
  })
}
/** A line of symmetry drawn through the figure (dashed blue; a fold that fails is drawn in another colour). */
function axisLine(S: Scene, id: string, c: Vec, deg: number, R: number, col = BLUE) {
  const d = dirOf(deg)
  place(S, { [`${id}a`]: add(c, mul(d, R + 0.7)), [`${id}b`]: sub(c, mul(d, R + 0.7)) })
  S.segs.push({ id, a: `${id}a`, b: `${id}b`, col, w: 2.4, dash: true })
}
/** Take a drawn figure (or line) off the board, so a step can draw it again. */
function clearKey(S: Scene, key: string) {
  S.polys = S.polys.filter(pl => !pl.id.startsWith(key))
  S.segs = S.segs.filter(sg => !sg.id.startsWith(key))
}

const figBoard = (S: Scene, f: Fig) => {
  resetBeat(S)
  const m = f.R + 1.1
  S.frame = { x0: f.c[0] - m, y0: f.c[1] - m, x1: f.c[0] + m, y1: f.c[1] + m }
  drawFig(S, f)
}

// ── beat makers ──────────────────────────────────────────────────────────

/**
 * Turn a line through the middle of a figure. It clicks at the angles given;
 * there a copy of the figure folds over the line, green where it matches,
 * pink where it does not. Done when `need` lines are found (or, with
 * `probe`, when the fold at a click is over, matching or not).
 */
function mirrorBeat(id: string, text: string, f: Fig, o: { start: number; snaps: number[] | ((S: Scene) => number[]); need?: number; keep?: number[] | ((S: Scene) => number[]); probe?: boolean; count?: boolean; free?: boolean; extra?: (S: Scene) => void; remember?: string }): Beat {
  return {
    id, say: text,
    enter: S => {
      figBoard(S, f)
      o.extra?.(S)
      const snaps = typeof o.snaps === "function" ? o.snaps(S) : o.snaps
      const keep = typeof o.keep === "function" ? o.keep(S) : o.keep ?? []
      for (const k of keep) axisLine(S, `kept${k}`, f.c, k, f.R)
      const L = f.R + 0.9
      place(S, { C: f.c, La: sub(f.c, mul(dirOf(o.start), L)), Lb: add(f.c, mul(dirOf(o.start), L)) })
      S.segs.push({ id: "line", a: "La", b: "Lb", col: CHALK, w: 2.4 })
      S.handles = [{ id: "turn", kind: "turn", pivot: "C", pts: ["La", "Lb"], grab: "Lb", snaps: snaps.flatMap(a => [a, a + 180]) }]
      // the folded copy, made from the figure's own points
      drawFig(S, f, "fold")
      const foldPolys = new Set(S.polys.filter(pl => pl.id.startsWith("fold")).map(pl => pl.id))
      const found = new Set<number>()
      S.vals.e = 0
      S.tick = S2 => {
        const b = P(S2, "Lb"), deg = ((Math.atan2(b[1] - f.c[1], b[0] - f.c[0]) / RAD) % 180 + 180) % 180
        const at = S2.snapped === "turn" ? snaps.find(a => Math.abs(((deg - a) % 180 + 270) % 180 - 90) < 1) : undefined
        S2.vals.e = at === undefined ? Math.max(0, (S2.vals.e ?? 0) - 0.08) : Math.min(1, (S2.vals.e ?? 0) + 0.025)
        const e = S2.vals.e, a = at ?? deg
        moveFig(S2, f, "fold", p => add(p, mul(sub(reflect(p, f.c, a), p), e)))
        const match = at !== undefined && fits(f.items, p => reflect(p, f.c, at))
        const col = at === undefined ? CHALK : match ? GREEN : PINK
        // the copy only shows while it folds
        const none = "rgba(0,0,0,0)", seen = e > 0.02
        S2.polys = S2.polys.map(pl => (foldPolys.has(pl.id) ? { ...pl, col: seen ? col : none, fill: seen ? col : none, fillOp: seen ? 0.18 : 0 } : pl))
        S2.segs = S2.segs.map(sg => (sg.id.startsWith("fold") ? { ...sg, col: e > 0.02 ? col : "rgba(0,0,0,0)" } : sg))
        if (e < 1 || at === undefined || S2.got.has("done")) return
        if (match && !found.has(at)) {
          found.add(at)
          axisLine(S2, `found${at}`, f.c, at, f.R)
          if (o.remember) S2.mem[o.remember] = at
          S2.flashGood = 1
          if (found.size >= (o.need ?? 1)) S2.got.add("done")
          else say(S2, "Yes. Find another one.", "calm", 2.4)
        }
        if (!match && o.probe) { S2.got.add("done"); say(S2, "The halves don't match.", "calm", 600) }
      }
      if (o.count) S.eqFn = () => row([atom("cl", "\\text{Lines of symmetry}"), op("ce", "="), atom("cn", String(found.size + keep.length))])
      look(S, o.count ? ["eq"] : [])
    },
    done: S => S.got.has("done") && S.drag === null,
    advanceAfter: o.probe ? 2600 : 1800,
    free: o.free,
  }
}

/**
 * Turn a figure round its middle over its outline. It clicks wherever it
 * fits its outline again, and each new fit is counted. Done when `need` fits
 * have been found (the start counts as one).
 */
function turnBeat(id: string, text: string, f: Fig, o: { need: number; free?: boolean; minPlay?: number }): Beat {
  return {
    id, say: text,
    enter: S => {
      figBoard(S, f)
      drawFig(S, f, "out", { ghost: true })
      // the grab: a corner of the figure's first shape
      const first = f.items.find(it => it.kind === "poly") as Extract<Item, { kind: "poly" }>
      const g0 = first.pts[0], a0 = Math.atan2(g0[1] - f.c[1], g0[0] - f.c[0]) / RAD
      const n = orderOf(f.items, f.c)
      const names = figNames(f, "f")
      place(S, { C: f.c })
      S.handles = [{ id: "turn", kind: "turn", pivot: "C", pts: names, grab: "f0_0", snaps: Array.from({ length: n }, (_, k) => a0 + (360 * k) / n) }]
      const seen = new Set<number>([0])
      S.tick = S2 => {
        if (S2.snapped !== "turn") return
        const g = P(S2, "f0_0"), d = ((Math.atan2(g[1] - f.c[1], g[0] - f.c[0]) / RAD - a0) % 360 + 360) % 360
        const k = Math.round(d / (360 / n)) % n
        if (!seen.has(k)) { seen.add(k); S2.flashGood = 1; S2.touched = "f0"; if (seen.size >= o.need) S2.got.add("done") }
      }
      S.eqFn = () => row([atom("cl", "\\text{Fits}"), op("ce", "="), atom("cn", String(seen.size))])
      look(S, ["eq"])
    },
    done: S => S.got.has("done") && S.drag === null,
    advanceAfter: 1800,
    free: o.free,
    minPlay: o.minPlay,
  }
}

/** A whole number typed; Show me how draws the lines or turns the figure, one step at a time. */
function askBeat(id: string, text: string, board: (S: Scene) => void, o: { lead: string; answer: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[] }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      startInput(S, { answer: o.answer, slips: o.slips, typed: String(o.answer) })
      // during Show me how the box counts what the steps find; it empties again for the student to type
      S.eqFn = S2 => row([atom("cl", o.lead), op("ce", "="), S2.input?.state === "right" ? atom("cn", String(o.answer), { col: GREEN }) : S2.vis.keypad.t === 0 && S2.vals.wn !== undefined ? atom("cn", String(S2.vals.wn), { col: BLUE }) : boxNode(S2)])
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 1800,
    walk: o.walk,
  }
}
/** Where a line through the middle meets the outline: two corners, the middles of two sides, or one of each. */
function throughWhat(f: Fig, deg: number): "corners" | "sides" | "mixed" {
  const out = f.items.find(it => it.kind === "poly") as Extract<Item, { kind: "poly" }>
  const d = dirOf(deg), off = (p: Vec) => Math.abs((p[0] - f.c[0]) * d[1] - (p[1] - f.c[1]) * d[0])
  const n = out.pts.filter(p => off(p) < 1e-6).length
  return n === 2 ? "corners" : n === 1 ? "mixed" : "sides"
}
const THROUGH = {
  corners: ["goes through two opposite corners.", "goes through two more corners."],
  sides: ["goes through the middles of two opposite sides.", "goes through the middles of two more sides."],
  mixed: ["goes from a corner to the middle of the opposite side.", "goes from the next corner to the middle of the side opposite it."],
}
const ORD = ["One line", "A second", "A third", "A fourth", "A fifth", "A sixth", "A seventh", "An eighth"]

/**
 * Show me how, one fold: a copy of the figure folds over the line at `deg`,
 * green where it lands on the figure, pink where it does not. A line that
 * works stays (blue); one that fails goes when the next step comes. `count`
 * is the number of lines found once this step is done (the box shows it).
 */
function foldStep(f: Fig, deg: number, say0: string, count: number, first = false): WalkStep<Scene> {
  return {
    say: say0,
    show: S => {
      const match = fits(f.items, p => reflect(p, f.c, deg))
      // the first step starts clean (Show me how can be offered again)
      clearKey(S, "wf"); clearKey(S, "wtry"); clearKey(S, first ? "wl" : `wl${deg}`)
      S.vals.wn = count - (match ? 1 : 0)
      if (match) axisLine(S, `wl${deg}`, f.c, deg, f.R)
      else axisLine(S, "wtry", f.c, deg, f.R, CHALK)
      drawFig(S, f, "wf")
      // a shaded figure's copy carries only its shading, so you can see where the shading lands
      const col = match ? GREEN : PINK, shaded = f.items.some(it => it.kind === "poly" && it.fill)
      S.polys = S.polys.map(pl => (pl.id.startsWith("wf") ? { ...pl, col, fill: !shaded || pl.fill ? col : undefined, fillOp: shaded ? (pl.fill ? 0.5 : 0) : 0.18 } : pl))
      S.segs = S.segs.map(sg => (sg.id.startsWith("wf") ? { ...sg, col } : sg))
      S.acts.push({ dur: 1.1, run: (S2, e) => moveFig(S2, f, "wf", p => add(p, mul(sub(reflect(p, f.c, deg), p), e))), end: S2 => { S2.vals.wn = count; if (match) { S2.flashGood = 1; S2.touched = "wf0" } } })
    },
  }
}
/** Show me how: fold along each line of symmetry in turn, lines through corners first. `note` is added to the first step. */
function drawAxes(f: Fig, note = ""): WalkStep<Scene>[] {
  const rank = { corners: 0, mixed: 0, sides: 1 }
  const axes = axesOf(f.items, f.c).sort((a, b) => rank[throughWhat(f, a)] - rank[throughWhat(f, b)] || a - b)
  let last = ""
  return axes.map((a, k) => {
    const what = throughWhat(f, a), again = what === last
    last = what
    return foldStep(f, a, `${ORD[k]} ${THROUGH[what][again ? 1 : 0]}${k === 0 && note ? " " + note : ""}`, k + 1, k === 0)
  })
}
/** Show me how: turn the figure round over its outline, stopping each time it fits; the box counts the fits. */
function turnSteps(f: Fig, n: number): WalkStep<Scene>[] {
  const turn = (S: Scene, from: number, to: number, count?: number) =>
    S.acts.push({ dur: 1.0, run: (S2, e) => moveFig(S2, f, "f", p => rotate(p, f.c, from + (to - from) * e)), end: S2 => { if (count) { S2.vals.wn = count; S2.flashGood = 1; S2.touched = "f0" } } })
  return [
    // one corner is marked, so a turn onto itself can still be seen
    { say: "It fits its outline where it starts.", show: S => { clearKey(S, "out"); drawFig(S, f, "out", { ghost: true }); moveFig(S, f, "f", p => p); S.dots = [{ pt: "f0_0", col: ORANGE, r: 7 }]; S.vals.wn = 1; S.flashGood = 1; S.touched = "f0" } },
    ...Array.from({ length: n - 1 }, (_, i): WalkStep<Scene> => ({
      say: `Turned $${Math.round((360 * (i + 1)) / n)}^\\circ$, it fits again.`,
      show: S => turn(S, (360 * i) / n, (360 * (i + 1)) / n, i + 2),
    })),
    { say: `One more turn brings it back to the start. It fits $${n}$ times in a full turn.`, show: S => turn(S, (360 * (n - 1)) / n, 360) },
  ]
}

/** Pick a word; wrong picks get their own notes. */
export function pickBeat(id: string, text: string, board: (S: Scene) => void, o: { options: string[]; answer: number; notes: Record<number, string>; right: string }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      choose(S, o.options, o.answer, (S2, k, right) => { if (right) { S2.got.add("done"); say(S2, o.right, "calm", 600) } else say(S2, o.notes[k] ?? "Look again.", "wrong", 4.5) })
      look(S, ["chips"])
    },
    done: S => S.got.has("done"),
    advanceAfter: 2200,
  }
}

// ── shading a grid ───────────────────────────────────────────────────────

type Grid = number[][]
const cellPts = (r: number, c: number, n: number): Vec[] => [[c, n - 1 - r], [c + 1, n - 1 - r], [c + 1, n - r], [c, n - r]]
const gridItems = (g: Grid): Item[] => g.flatMap((row, r) => row.flatMap((v, c) => (v ? [poly(cellPts(r, c, g.length), true)] : [])))

/**
 * Shade squares on a grid by tapping them, until the pattern has the
 * symmetry asked for with `add` more squares shaded. The line of symmetry
 * (or the turn) shows once it has it.
 */
function shadeBeat(id: string, text: string, grid: Grid, o: { add: number; want: { lines?: number; order?: number } }): Beat {
  const n = grid.length, c: Vec = [n / 2, n / 2]
  return {
    id, say: text,
    enter: S => {
      resetBeat(S)
      S.frame = { x0: -0.8, y0: -0.8, x1: n + 0.8, y1: n + 0.8 }
      const on = grid.map(r => r.map(v => v === 1))
      const added = new Set<string>()
      const pts: Record<string, Vec> = {}
      grid.forEach((row, r) => row.forEach((_, cc) => cellPts(r, cc, n).forEach((p, j) => { pts[`g${r}_${cc}_${j}`] = p })))
      place(S, pts)
      const paint = () => {
        S.polys = grid.flatMap((row, r) => row.map((_, cc) => ({ id: `g${r}_${cc}`, pts: [0, 1, 2, 3].map(j => `g${r}_${cc}_${j}`), fill: on[r][cc] ? CHALK : undefined, fillOp: on[r][cc] ? SHADE : undefined, col: added.has(`${r}_${cc}`) ? GREEN : undefined })))
      }
      paint()
      S.taps = grid.flatMap((row, r) => row.map((_, cc) => ({
        id: `${r}_${cc}`,
        hit: (S2: Scene, p: Vec) => (inPoly(p, [0, 1, 2, 3].map(j => ptS(S2, `g${r}_${cc}_${j}`))) ? 0 : Infinity),
        spot: (S2: Scene) => { const Q = [0, 1, 2, 3].map(j => ptS(S2, `g${r}_${cc}_${j}`)); return [(Q[0][0] + Q[2][0]) / 2, (Q[0][1] + Q[2][1]) / 2] as Vec },
      })))
      S.onTap = (S2, key) => {
        if (S2.got.has("done")) return
        const [r, cc] = key.split("_").map(Number)
        if (grid[r][cc] && !added.has(key)) { say(S2, "That one is already shaded.", "calm", 2.4); return }
        if (added.has(key)) { added.delete(key); on[r][cc] = false; paint(); return }
        if (added.size >= o.add) { say(S2, o.add === 1 ? "Shade just one. Tap a square again to take it off." : `Shade just ${o.add}. Tap a square again to take it off.`, "wrong", 3.6); return }
        added.add(key); on[r][cc] = true; paint()
        if (added.size < o.add) return
        const items = gridItems(on.map(row => row.map(v => (v ? 1 : 0))))
        const lines = axesOf(items, c), order = orderOf(items, c)
        const ok = (o.want.lines === undefined || lines.length === o.want.lines) && (o.want.order === undefined || order === o.want.order)
        if (!ok) { say(S2, "Not with that one. Tap it again to take it off, and try another.", "wrong", 4); return }
        S2.got.add("done")
        S2.flashGood = 1
        if (o.want.lines) lines.forEach((a, k) => axisLine(S2, `ans${k}`, c, a, n / 2))
        if (o.want.order) {
          // a copy turns over it and fits
          drawFig(S2, { items, c, R: n / 2 }, "rot", { ghost: true })
          S2.acts.push({ dur: 1.4, run: (S3, e) => moveFig(S3, { items, c, R: n / 2 }, "rot", p => rotate(p, c, (360 / o.want.order!) * e)) })
        }
      }
      look(S)
    },
    done: S => S.got.has("done"),
    advanceAfter: 2600,
  }
}

// ── the lesson ───────────────────────────────────────────────────────────

/** The house, its left half folding over the line onto the right. */
function houseBoard(S: Scene, fold = 0, o: { handle?: boolean } = {}) {
  resetBeat(S)
  S.frame = { x0: -3.2, y0: -2.6, x1: 3.2, y1: 3.4 }
  const half: Vec[] = [[0, -1.5], [-1.5, -1.5], [-1.5, 0.8], [0, 2.3]]
  place(S, Object.fromEntries(HOUSE.map((p, i) => [`h${i}`, p])))
  S.polys = [{ id: "house", pts: HOUSE.map((_, i) => `h${i}`) }]
  const at = (e: number) => half.map(p => [p[0] * (1 - 2 * e), p[1]] as Vec)
  place(S, Object.fromEntries(at(fold).map((p, i) => [`fh${i}`, p])))
  S.polys.push({ id: "half", pts: half.map((_, i) => `fh${i}`), fill: BLUE, fillOp: 0.25, col: BLUE })
  axisLine(S, "ax", [0, 0.4], 90, 2.2)
  if (o.handle) {
    place(S, { Fg: [-1.5, -0.35] })
    S.handles = [{ id: "fold", kind: "slide", pts: ["Fg"], grab: "Fg", dir: [1, 0], min: 0, max: 3, snaps: [3], lock: true }]
    S.tick = S2 => {
      const e = Math.min(1, (S2.vals["t-fold"] ?? 0) / 3)
      at(e).forEach((p, i) => { S2.pts[`fh${i}`].p = p; S2.pts[`fh${i}`].D = p })
      if (S2.locked.has("fold")) { S2.polys = S2.polys.map(pl => (pl.id === "half" ? { ...pl, fill: GREEN, col: GREEN } : pl)); S2.got.add("done") }
    }
  }
}

const PART_1: Beat[] = [
  watch("house", "This shape has a line of symmetry.", S => { houseBoard(S); look(S) }, 2.2),
  {
    id: "fold",
    say: "Fold it along the line.",
    enter: S => { houseBoard(S, 0, { handle: true }); look(S) },
    done: S => S.got.has("done") && S.drag === null,
    advanceAfter: 1500,
  },
  watch("line-name", "The two halves match. The line is a *line of symmetry*.", S => { houseBoard(S, 1); S.polys = S.polys.map(pl => (pl.id === "half" ? { ...pl, fill: GREEN, col: GREEN } : pl)); look(S) }, 2.8),
  mirrorBeat("rect-1", "Turn this line until it is a line of symmetry.", RECT, { start: 35, snaps: [0, 90], remember: "rect" }),
  mirrorBeat("rect-2", "Now find the other one.", RECT, {
    start: 35, count: true,
    keep: S => [S.mem.rect ?? 90],
    snaps: S => [(S.mem.rect ?? 90) === 0 ? 90 : 0],
  }),
  mirrorBeat("rect-diag", "What about the diagonal? Turn the line to it.", RECT, { start: 60, snaps: [Math.atan2(2.4, 4) / RAD], probe: true, keep: [0, 90] }),
  watch("rect-2-lines", "A rectangle has $2$ lines of symmetry.", S => { figBoard(S, RECT); axisLine(S, "a0", RECT.c, 0, RECT.R); axisLine(S, "a1", RECT.c, 90, RECT.R); look(S) }, 2.4),
  mirrorBeat("square-all", "Find all the lines of symmetry of this square.", SQUARE, { start: 20, snaps: [0, 45, 90, 135], need: 4, count: true }),
  askBeat("tri-lines", "How many lines of symmetry does an equilateral triangle have?", S => figBoard(S, TRI), {
    lead: "\\text{Lines of symmetry}", answer: 3,
    slips: [{ v: 1, say: "That's one. Each corner has a line through it." }, { v: 6, say: "That's for a hexagon. Count the corners." }],
    walk: drawAxes(TRI),
  }),
  askBeat("hex-lines", "And a regular hexagon?", S => figBoard(S, HEX), {
    lead: "\\text{Lines of symmetry}", answer: 6,
    slips: [{ v: 3, say: "That's the lines through the corners. Lines through the middles of the sides count too." }],
    walk: drawAxes(HEX),
  }),
  watch("regular", "A regular polygon has as many lines of symmetry as sides.", S => {
    resetBeat(S)
    const at = (i: number): Vec => (tall(S) ? [0, -i * 5] : [i * 5.2, 0])
    ;[SQUARE, TRI, HEX].forEach((f, i) => { drawFig(S, f, `r${i}`, { at: at(i) }); axesOf(f.items, f.c).forEach((a, k) => axisLine(S, `r${i}l${k}`, at(i), a, f.R)) })
    S.frame = tall(S) ? { x0: -3.2, y0: -13, x1: 3.2, y1: 3.2 } : { x0: -3.2, y0: -3.2, x1: 13.6, y1: 3.2 }
    look(S)
  }, 3.2),
  {
    ...mirrorBeat("para", "Try to find a line of symmetry on this parallelogram.", PARA, { start: 30, snaps: [] }),
    done: S => S.moved > 0 || S.time - S.beatStart > 6,
    free: true, minPlay: 7,
  },
  watch("para-none", "It has none. A parallelogram has no lines of symmetry.", S => { figBoard(S, PARA); drawFig(S, { items: PARA.items.map(it => (it.kind === "poly" ? { ...it, pts: it.pts.map(p => reflect(p, [0, 0], 0)) } : it)), c: [0, 0], R: PARA.R }, "flip", { ghost: true }); look(S) }, 3.0),

  // 4024/12/O/N/19 Q7(a)
  watch("w19", "This circle has its centre and two chords the same length.", S => { figBoard(S, W19); S.circle = { c: "O", r: 3 }; place(S, { O: [0, 0] }); S.dots = [{ pt: "O" }]; look(S) }, 2.6),
  mirrorBeat("w19-line", "It has one line of symmetry. Turn the line to it.", W19, { start: 110, snaps: [27], extra: S => { S.circle = { c: "O", r: 3 }; place(S, { O: [0, 0] }); S.dots = [{ pt: "O" }] } }),

  // 4024/23/M/J/25 Q4(b)
  shadeBeat("s25b", "Shade one more square so the pattern has one line of symmetry.", [[1, 0, 1, 0], [0, 1, 0, 1], [0, 1, 0, 1], [1, 0, 1, 1]], { add: 1, want: { lines: 1 } }),
]

/** A figure turned a fraction of the way round, with its outline (for the watching beats). */
function turnedBoard(S: Scene, f: Fig, deg: number) {
  figBoard(S, f)
  drawFig(S, f, "out", { ghost: true })
  moveFig(S, f, "f", p => rotate(p, f.c, deg))
}

const PART_2: Beat[] = [
  turnBeat("rect-turn", "Turn this rectangle round its middle.", RECT, { need: 2, free: true, minPlay: 5 }),
  watch("rect-fits", "It fits its outline twice in a full turn.", S => { turnedBoard(S, RECT, 180); look(S) }, 2.4),
  watch("order-2", "So it has rotational symmetry of *order* $2$.", S => { turnedBoard(S, RECT, 180); S.eqFn = () => atom("o", "\\text{Order} = 2"); look(S, ["eq"]) }, 2.6),
  turnBeat("tri-turn", "Turn the triangle. How many times does it fit?", TRI, { need: 3 }),
  {
    id: "arrow",
    say: "This arrow only fits once, when it gets back to the start.",
    enter: S => {
      turnedBoard(S, ARROW, 0)
      S.acts.push({ dur: 0.6 }, { dur: 3.2, run: (S2, e) => moveFig(S2, ARROW, "f", p => rotate(p, [0, 0], 360 * e)), end: S2 => { S2.flashGood = 1; S2.touched = "f0" } })
      look(S)
    },
    cta: "", ctaAfter: 4.0,
  },
  watch("order-1", "It has order $1$. That means no rotational symmetry.", S => { turnedBoard(S, ARROW, 0); S.eqFn = () => atom("o", "\\text{Order} = 1"); look(S, ["eq"]) }, 2.8),
  turnBeat("square-turn", "Turn the square. How many times does it fit?", SQUARE, { need: 4 }),
  askBeat("hex-order", "What is the order of rotational symmetry of a regular hexagon?", S => figBoard(S, HEX), {
    lead: "\\text{Order}", answer: 6,
    slips: [{ v: 3, say: "It fits more often than that. Count every corner it can turn to." }, { v: 1, say: "It fits every time a corner reaches the top." }],
    walk: turnSteps(HEX, 6),
  }),
  {
    id: "para-turn",
    say: "A parallelogram has order $2$, but no lines of symmetry.",
    enter: S => {
      turnedBoard(S, PARA, 0)
      S.acts.push({ dur: 0.6 }, { dur: 2.4, run: (S2, e) => moveFig(S2, PARA, "f", p => rotate(p, [0, 0], 180 * e)), end: S2 => { S2.flashGood = 1; S2.touched = "f0" } })
      look(S)
    },
    cta: "", ctaAfter: 3.6,
  },

  // 4024/11/M/J/22 Q2
  askBeat("s22a", "How many lines of symmetry does this diagram have?", S => figBoard(S, S22T), {
    lead: "\\text{Lines of symmetry}", answer: 1,
    slips: [{ v: 2, say: "Fold it along the flat line: the little ends point up, so the halves don't match." }, { v: 4, say: "Try folding it each way. Only one fold matches." }],
    walk: [
      foldStep(S22T, 90, "Fold it down the upright line: the halves match.", 1, true),
      foldStep(S22T, 0, "Fold it along the flat line: the little ends point down, so the halves don't match.", 1),
    ],
  }),
  askBeat("s22b", "What is the order of rotational symmetry of this diagram?", S => figBoard(S, S22H), {
    lead: "\\text{Order}", answer: 2,
    slips: [{ v: 6, say: "The hexagon on its own has order $6$, but the cross has to fit too." }, { v: 4, say: "The cross on its own has order $4$, but the hexagon has to fit too." }],
    walk: turnSteps(S22H, 2),
  }),

  // 4024/12/M/J/21 Q2
  askBeat("s21h-l", "How many lines of symmetry does this shape have?", S => figBoard(S, S21H), {
    lead: "\\text{Lines of symmetry}", answer: 3,
    slips: [{ v: 6, say: "A plain hexagon has $6$. The shading has to match too." }],
    walk: drawAxes(S21H, "The shading matches across it."),
  }),
  askBeat("s21h-o", "What is its order of rotational symmetry?", S => figBoard(S, S21H), {
    lead: "\\text{Order}", answer: 3,
    slips: [{ v: 6, say: "The shading only fits every other turn." }],
    walk: turnSteps(S21H, 3),
  }),
  askBeat("s21s-l", "How many lines of symmetry does this shape have?", S => figBoard(S, S21S), {
    lead: "\\text{Lines of symmetry}", answer: 0,
    slips: [{ v: 1, say: "Try folding it along the diagonal: the small triangles don't match." }, { v: 2, say: "Try each fold: none of them match." }],
    walk: [
      foldStep(S21S, 90, "Fold it down the middle: the shading doesn't match.", 0, true),
      foldStep(S21S, 0, "Fold it across the middle: it doesn't match either.", 0),
      foldStep(S21S, 135, "Fold it along the drawn diagonal: the small triangles don't match.", 0),
      foldStep(S21S, 45, "Along the other diagonal, the small triangles don't match either.", 0),
    ],
  }),
  askBeat("s21s-o", "What is its order of rotational symmetry?", S => figBoard(S, S21S), {
    lead: "\\text{Order}", answer: 2,
    slips: [{ v: 1, say: "Turn it half way round: it fits." }, { v: 4, say: "A quarter turn doesn't fit. Only the half turn does." }],
    walk: turnSteps(S21S, 2),
  }),

  // 4024/11/O/N/21 Q4(a), 4024/23/M/J/25 Q4(a)
  shadeBeat("w21", "Shade one more square so the pattern has rotational symmetry of order $4$.", [[0, 1, 0, 0], [0, 1, 1, 1], [0, 1, 1, 0], [0, 0, 1, 0]], { add: 1, want: { order: 4 } }),
  shadeBeat("s25a", "Shade one more square so it has rotational symmetry of order $2$.", [[1, 1, 0, 1], [0, 1, 0, 1], [0, 0, 1, 0], [1, 0, 1, 1]], { add: 1, want: { order: 2 } }),
  {
    id: "end",
    say: "In summary, a line of symmetry folds a shape onto itself. The order is how many times it fits in one full turn.",
    enter: S => { figBoard(S, SQUARE); axesOf(SQUARE.items, SQUARE.c).forEach((a, k) => axisLine(S, `e${k}`, SQUARE.c, a, SQUARE.R)); look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2]

applyParts(BEATS, [
  ["house", "Lines of symmetry"],
  ["rect-turn", "Rotational symmetry"],
])

