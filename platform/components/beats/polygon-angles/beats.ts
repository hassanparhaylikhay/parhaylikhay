/**
 * Angles in polygons, one tiny idea per beat. Builds on the triangle
 * lesson: the student's own four-sided shape, then why (it splits into
 * triangles), then more corners and the pattern, regular polygons, the
 * walk round that gives exterior angles, using it all, and one shape that
 * cannot exist.
 *
 * Every `enter` sets the whole board for its beat, so `?beat=N` opens any
 * beat cold.
 */

import { type Vec, add, mul, centreIn, thinness } from "../geometry"
import type { WalkStep } from "../walk"
import { diagonalsFrom, regular, heading, wedgeIn, centroidOf } from "./poly"
import {
  type Scene, type EqPart, type Overlay,
  BLUE, ORANGE, PINK, GREEN, YELLOW, cornerColour,
  resetBeat, show, refit, relax, say, colours, clearLines, autoDiagonals, allDiagonals, startWalk,
  ensureShape, shapeFromAngles, regularShape, startInput, screenScale, layout, shownTurn,
} from "./scene"

export interface Beat {
  id: string
  /** The one phrase on screen. $...$ is KaTeX. */
  /** This beat starts a new part of the lesson: its title comes up first (chapter.ts). */
  chapter?: string
  say: string
  enter: (S: Scene) => void
  /** A doing beat finishes itself when this turns true. */
  done?: (S: Scene) => boolean
  /** Continue button: "" is a plain arrow; undefined means none. */
  cta?: string
  /** Seconds before the button appears. */
  ctaAfter?: number
  /** A playing beat: when done, the arrow appears and the student chooses when to go on. */
  free?: boolean
  /** Seconds of play before a playing beat offers to move on. */
  minPlay?: number
  restart?: boolean
  /** "Show me how": the worked solution, one step at a time, for a student who is stuck */
  walk?: WalkStep<Scene>[]
}

const deg = (n: number) => `${n}^\\circ`
const c = (col: string, tex: string) => `\\textcolor{${col}}{${tex}}`

// shapes used more than once, so cold opens and flowing play agree
const QUAD = [95, 80, 110, 75]
const PENT = [100, 120, 95, 115, 110]
const PENT_Q = [110, 95, 120, 100, 115]

// ── small builders ───────────────────────────────────────────────────────

function free(S: Scene) {
  S.mode = "free"
  S.glow = (S.P ?? []).map(() => true)
}

const movedEnough = (px: number, corners = 1) => (S: Scene) =>
  !S.drag && S.moved >= px * screenScale(S) && S.movedCorners.size >= corners

const watch = (id: string, text: string, enter: (S: Scene) => void, ctaAfter = 1.8): Beat =>
  ({ id, say: text, enter, cta: "", ctaAfter })

const inputRight = (S: Scene) => S.input?.state === "right"
const guessIn = (S: Scene) => S.input?.state === "right" || S.input?.state === "guessed"

/**
 * Cleans the board down to a plain shape, keeping the student's own shape.
 * The walking beats keep the walk, so the student carries on from where
 * they are.
 */
function base(S: Scene, keepWalk = false) {
  resetBeat(S)
  S.extCorners = []
  S.extLen = 0
  if (!keepWalk) {
    S.walk = null
    S.dial = { wedges: [], mode: "none" }
  }
  S.oneColour = null
}

function ask(S: Scene, parts: EqPart[], answer: number, opts: { deg?: boolean; guess?: boolean; onRight?: (S: Scene) => void; help?: (S: Scene, tries: number) => void } = {}) {
  startInput(S, { parts, answer, hints: [], deg: opts.deg, guess: opts.guess, onRight: opts.onRight, help: opts.help })
}

// ── help after a wrong answer: the idea lights up on the board ───────────

/** Equal angles share a total: they pulse together, the total sits in the middle. */
const shareHelp = (total: number, n: number) => (S: Scene, t: number) => {
  S.pulse = (S.P ?? []).map(() => true)
  S.centreText = { tex: c(GREEN, deg(total)), color: GREEN }
  if (t >= 2) remind(S, `${n} \\times ${c(BLUE, "?")} = ${c(GREEN, deg(total))}`)
}

/** Equal turns make one full turn: the dial lights them up one by one. */
const turnsHelp = (n: number) => (S: Scene, t: number) => {
  S.dialPulse = S.time
  if (t >= 2) remind(S, `${n} \\times ${c(YELLOW, "?")} = ${c(GREEN, deg(360))}`)
}

/** Inside and outside make a straight line at a corner. */
const lineHelp = (outside: number) => (S: Scene, t: number) => {
  S.lineAt = 0
  if (t >= 2) remind(S, `${c(BLUE, "?")} + ${deg(outside)} = ${c(GREEN, deg(180))}`)
}

/** Turns of the same size, counted round the dial. */
const countHelp = (S: Scene, t: number) => {
  S.dialPulse = S.time
  if (t >= 2) S.dialCount = true
}

const allExt = (S: Scene) => { S.extCorners = (S.P ?? []).map((_, i) => i) }

// ── "Show me how" walkthroughs ───────────────────────────────────────────

/** Equal angles sharing a total: each is total ÷ n. */
function shareWalk(total: number, n: number, name: string): WalkStep<Scene>[] {
  const each = total / n
  return [
    { say: `A ${name}'s angles add up to $${total}^\\circ$.`, show: S => shareHelp(total, n)(S, 1) },
    { say: `Its ${n} angles are all equal. So each one is $${total}^\\circ \\div ${n}$.`, tex: `\\dfrac{${c(GREEN, deg(total))}}{${n}} = ${c(GREEN, deg(each))}` },
  ]
}

/** Equal turns making one full turn: each is 360 ÷ n. */
function turnsWalk(n: number): WalkStep<Scene>[] {
  return [
    { say: `Going once round, the ${n} turns make one full turn of $360^\\circ$.`, show: S => turnsHelp(n)(S, 1) },
    { say: `They're all the same. So each turn is $360^\\circ \\div ${n}$.`, tex: `\\dfrac{${deg(360)}}{${n}} = ${c(GREEN, deg(360 / n))}` },
  ]
}

/** Inside and outside make a straight line at a corner. */
function lineWalk(outside: number, show?: (S: Scene) => void): WalkStep<Scene>[] {
  return [
    { say: "At each corner, inside and outside make a straight line.", show: S => { if (show) show(S); else lineHelp(outside)(S, 1) } },
    { say: `So the inside angle is $180^\\circ - ${outside}^\\circ$.`, tex: `${deg(180)} - ${deg(outside)} = ${c(GREEN, deg(180 - outside))}` },
  ]
}

/** Equal turns of `turn` degrees: how many make 360? */
function countWalk(turn: number): WalkStep<Scene>[] {
  return [
    { say: `Each turn is $${turn}^\\circ$. Together they make one full turn of $360^\\circ$.`, show: S => { S.dialPulse = S.time } },
    { say: `So there are $360 \\div ${turn}$ turns, one at each corner.`, tex: `\\dfrac{${deg(360)}}{${deg(turn)}} = ${c(GREEN, String(360 / turn))}`, show: S => { S.dialCount = true } },
  ]
}

/** Hint helper: a reminder line under the equation (TeX), never the worked answer. */
function remind(S: Scene, tex: string) {
  if (!S.input) return
  S.input.hints = [tex]
}

/** Walk state for a cold open: `steps` sides walked and `turns` corners turned. */
function walkTo(S: Scene, steps: number, turns: number) {
  ensureShape(S, 5, PENT)
  startWalk(S)
  const W = S.walk!
  const n = S.P!.length
  W.steps = steps
  W.turns = turns
  W.at = steps % n
  W.h = turns > 0 ? heading(S.P!, (turns) % n) : heading(S.P!, 0)
  for (let k = 1; k <= turns; k++) {
    const at = k % n
    S.dial.wedges.push({ deg: shownTurn(S, at), color: cornerColour(at), born: S.time - 1 })
  }
}

/** A corner on its own: inside and outside angles on one straight line. */
function straightLine(S: Scene, inside: number): Overlay {
  const L = layout(S)
  const O: Vec = [(L.shape.x0 + L.shape.x1) / 2, (L.shape.y0 + L.shape.y1) / 2 + 30]
  const len = L.compact ? 110 : 150
  const t = Math.PI + (inside * Math.PI) / 180
  const r = L.compact ? 34 : 42
  return {
    polys: [],
    lines: [
      { a: add(O, [-len, 0]), b: O },
      { a: O, b: add(O, [len, 0]), dashed: true },
      { a: O, b: add(O, mul([Math.cos(t), Math.sin(t)], len)) },
    ],
    wedges: [
      { c: O, start: Math.PI, sweep: (inside * Math.PI) / 180, r, color: BLUE, label: deg(inside) },
      { c: O, start: t, sweep: Math.PI - (inside * Math.PI) / 180, r, color: PINK, label: "?", pulse: true },
    ],
    texts: [{ p: add(O, [0, -(r + 62)]), tex: deg(180), color: GREEN, pulse: true }],
  }
}

/** A regular pentagon and a regular hexagon sharing a side; x is the gap round the shared corner. */
function pentHex(S: Scene, labels: { p?: string; h?: string; x?: string }, help: { helpPent?: boolean; helpHex?: boolean; helpPoint?: boolean } = {}): Overlay {
  const L = layout(S)
  // walk each polygon from the shared corner V up the shared side
  const side = 1
  const walk = (n: number, dirSign: number): Vec[] => {
    const pts: Vec[] = [[0, 0]]
    let h = -Math.PI / 2
    for (let k = 1; k < n; k++) {
      pts.push(add(pts[k - 1], mul([Math.cos(h), Math.sin(h)], side)))
      h += dirSign * (2 * Math.PI) / n
    }
    return pts
  }
  const pent = walk(5, -1)     // to the left of the shared side
  const hex = walk(6, 1)       // to the right
  const all = [...pent, ...hex]
  const placed = centreIn(all, L.shape, L.compact ? 300 : 420)
  const P5 = placed.slice(0, 5), P6 = placed.slice(5)
  const V = P5[0]
  const ang = (p: Vec) => Math.atan2(p[1] - V[1], p[0] - V[0])
  const up = ang(P5[1])                      // the shared side
  const pentOther = ang(P5[4]), hexOther = ang(P6[5])
  const r = L.compact ? 30 : 38
  const norm = (a: number) => { let x = a; while (x < 0) x += 2 * Math.PI; while (x >= 2 * Math.PI) x -= 2 * Math.PI; return x }
  // pentagon wedge: from its other side round to the shared side
  const pw = { start: pentOther, sweep: norm(up - pentOther) }
  const hw = { start: up, sweep: norm(hexOther - up) }
  const xw = { start: hexOther, sweep: norm(pentOther - hexOther) }
  const O: Overlay = {
    polys: [
      { pts: P5, stroke: "#e8e6e0", fill: "rgba(0,171,250,0.06)" },
      { pts: P6, stroke: "#e8e6e0", fill: "rgba(255,130,44,0.06)" },
    ],
    wedges: [
      { c: V, ...pw, r, color: BLUE, label: labels.p, pulse: help.helpPoint },
      { c: V, ...hw, r, color: ORANGE, label: labels.h, pulse: help.helpPoint },
      { c: V, ...xw, r: r * 0.8, color: PINK, label: labels.x, pulse: help.helpPoint },
    ],
    texts: [],
  }
  // help: every corner of the shape, equal, sharing the total in the middle
  const corners = (pts: Vec[], color: string, total: number) => {
    pts.forEach((_, i) => { if (i !== 0) O.wedges.push({ ...wedgeIn(pts, i), r: r * 0.7, color, pulse: true }) })
    O.texts!.push({ p: centroidOf(pts), tex: deg(total), color: GREEN, pulse: true })
  }
  if (help.helpPent) corners(P5, BLUE, 540)
  if (help.helpHex) corners(P6, ORANGE, 720)
  if (help.helpPoint) {
    // out past the x, in the open gap round the point
    const mid = xw.start + xw.sweep / 2
    O.texts!.push({ p: add(V, mul([Math.cos(mid), Math.sin(mid)], r * 0.8 + 56)), tex: deg(360), color: GREEN, pulse: true })
  }
  return O
}

// ── the beats ────────────────────────────────────────────────────────────

export const BEATS: Beat[] = [
  // ── 1. Four corners ──
  {
    id: "draw",
    say: "Draw a shape with four straight sides.",
    enter: S => {
      base(S); clearLines(S)
      S.P = null; S.D = null; S.chain = []; S.drewOnce = false
      S.drawSides = 4
      S.mode = "draw"
      show(S, ["shape"])
    },
    done: S => S.P !== null,
  },
  watch("quad-name", "A shape with four straight sides is a *quadrilateral*.", S => {
    base(S); ensureShape(S, 4, QUAD); colours(S); show(S, ["shape", "nodes"])
  }),
  {
    id: "move",
    say: "Move the corners.",
    enter: S => { base(S); ensureShape(S, 4, QUAD); colours(S); free(S); show(S, ["shape", "nodes"]); refit(S) },
    done: movedEnough(320, 2), free: true, minPlay: 7,
  },
  {
    id: "thin",
    say: "Make it long and thin.",
    enter: S => { base(S); ensureShape(S, 4, QUAD); free(S); show(S, ["shape", "nodes"]) },
    // any direction counts: a thin shape at a slant is still long and thin
    done: S => !S.drag && S.releases > 0 && thinness(S.P!) >= 2.6 && S.moved >= 100 * screenScale(S), free: true, minPlay: 3,
  },
  watch("angles", "Each corner has an angle.", S => {
    base(S); ensureShape(S, 4, QUAD); colours(S); show(S, ["shape", "nodes", "arcs"]); relax(S)
  }),
  watch("sizes", "Each angle has a size.", S => {
    base(S); ensureShape(S, 4, QUAD); show(S, ["shape", "nodes", "arcs", "values"])
  }),
  {
    id: "watch-four",
    say: "Move a corner. Watch all four angles.",
    enter: S => { base(S); ensureShape(S, 4, QUAD); free(S); show(S, ["shape", "nodes", "arcs", "values"]) },
    done: movedEnough(300), free: true, minPlay: 7,
  },
  {
    id: "guess-sum",
    say: "Guess: what do all four add up to?",
    enter: S => {
      base(S); ensureShape(S, 4, QUAD)
      show(S, ["shape", "nodes", "arcs", "values", "line", "keypad"]); refit(S)
      ask(S, [{ box: true }], 360, { guess: true, deg: true })
    },
    done: guessIn,
  },
  watch("add", "Add the four angles.", S => {
    base(S); ensureShape(S, 4, QUAD); show(S, ["shape", "nodes", "arcs", "values", "sum"]); refit(S)
  }, 2.6),
  {
    id: "again",
    say: "Move the corners again.",
    enter: S => { base(S); ensureShape(S, 4, QUAD); free(S); show(S, ["shape", "nodes", "arcs", "values", "sum"]); refit(S) },
    done: movedEnough(320, 2), free: true, minPlay: 8,
  },
  watch("always-360", "A quadrilateral's angles always add up to $360^\\circ$.", S => {
    base(S); ensureShape(S, 4, QUAD); show(S, ["shape", "nodes", "arcs", "values", "sum"])
  }),

  // ── 2. Why 360 ──
  {
    id: "diagonal",
    say: "Draw a line to the opposite corner.",
    enter: S => {
      base(S); ensureShape(S, 4, QUAD); clearLines(S)
      S.diagFrom = 0
      S.mode = "diag"
      show(S, ["shape", "nodes", "diags"]); relax(S); refit(S)
    },
    done: S => S.diags.includes(2) && (S.diagGrow[2] ?? 0) >= 1,
  },
  watch("two-triangles", "One line makes two triangles.", S => {
    base(S); ensureShape(S, 4, QUAD); allDiagonals(S, 0); show(S, ["shape", "diags", "tris"])
  }),
  watch("each-180", "Each triangle's angles add up to $180^\\circ$.", S => {
    base(S); ensureShape(S, 4, QUAD); allDiagonals(S, 0); show(S, ["shape", "diags", "tris", "triLabels"])
  }),
  watch("two-180", "Two triangles make $2 \\times 180^\\circ = 360^\\circ$.", S => {
    base(S); ensureShape(S, 4, QUAD); allDiagonals(S, 0)
    S.lineTex = `2 \\times 180^\\circ = ${c(GREEN, deg(360))}`
    show(S, ["shape", "diags", "tris", "triLabels", "line"]); refit(S)
  }),
  watch("split", "Together their corners fill the shape's corners.", S => {
    base(S); ensureShape(S, 4, QUAD); allDiagonals(S, 0); show(S, ["shape", "diags", "tris", "split"])
  }, 2.2),
  {
    id: "always-two",
    say: "Move a corner. It's always two triangles.",
    enter: S => {
      base(S); ensureShape(S, 4, QUAD); allDiagonals(S, 0); free(S)
      S.lineTex = `2 \\times 180^\\circ = ${c(GREEN, deg(360))}`
      show(S, ["shape", "nodes", "diags", "tris", "triLabels", "line"]); refit(S)
    },
    done: movedEnough(300), free: true, minPlay: 6,
  },

  // ── 3. More corners ──
  {
    id: "add-5",
    say: "Tap a side to add a corner.",
    enter: S => {
      base(S); ensureShape(S, 4, QUAD); clearLines(S)
      S.mode = "addCorner"
      S.sidePulse = true
      show(S, ["shape"]); relax(S); refit(S)
    },
    done: S => (S.P?.length ?? 0) >= 5,
  },
  watch("pentagon", "It has five sides. It is called a pentagon.", S => {
    base(S); ensureShape(S, 5, PENT); clearLines(S); colours(S); show(S, ["shape", "nodes"]); relax(S)
  }),
  {
    id: "diags-5",
    say: "From this corner, draw lines to the other corners.",
    enter: S => {
      base(S); ensureShape(S, 5, PENT); clearLines(S)
      S.diagFrom = 0
      S.mode = "diag"
      show(S, ["shape", "nodes", "diags"]); relax(S)
    },
    done: S => S.P !== null && diagonalsFrom(0, S.P.length).every(k => S.diags.includes(k) && (S.diagGrow[k] ?? 0) >= 1),
  },
  watch("three-triangles", "That makes three triangles.", S => {
    base(S); ensureShape(S, 5, PENT); allDiagonals(S, 0); show(S, ["shape", "diags", "tris"])
  }),
  watch("sum-540", "So the angles add up to $3 \\times 180^\\circ = 540^\\circ$.", S => {
    base(S); ensureShape(S, 5, PENT); allDiagonals(S, 0)
    S.lineTex = `3 \\times 180^\\circ = ${c(GREEN, deg(540))}`
    show(S, ["shape", "diags", "tris", "triLabels", "line"]); refit(S)
  }),
  watch("check-540", "Check it. Add the five angles.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S); show(S, ["shape", "nodes", "arcs", "values", "sum"]); refit(S)
  }, 2.8),
  {
    id: "add-6",
    say: "Add one more corner.",
    enter: S => {
      base(S); ensureShape(S, 5, PENT); clearLines(S)
      S.mode = "addCorner"
      S.sidePulse = true
      show(S, ["shape"]); relax(S); refit(S)
    },
    done: S => (S.P?.length ?? 0) >= 6,
  },
  watch("hexagon", "It has six sides. It is called a hexagon.", S => {
    base(S); ensureShape(S, 6); clearLines(S); colours(S); show(S, ["shape", "nodes"]); relax(S)
  }),
  {
    id: "guess-tris",
    say: "Guess: how many triangles will it make?",
    enter: S => {
      base(S); ensureShape(S, 6); clearLines(S)
      S.diagFrom = 0
      show(S, ["shape", "nodes", "diags", "line", "keypad"]); refit(S)
      ask(S, [{ box: true }], 4, {
        guess: true,
        onRight: S2 => { autoDiagonals(S2, 0); S2.vis.tris.t = 1 },
      })
    },
    done: S => guessIn(S) && !S.diagAuto && S.diags.length === 3 && S.diags.every(k => (S.diagGrow[k] ?? 0) >= 1),
  },
  watch("sum-720", "Four triangles make $4 \\times 180^\\circ = 720^\\circ$.", S => {
    base(S); ensureShape(S, 6); allDiagonals(S, 0)
    S.lineTex = `4 \\times 180^\\circ = ${c(GREEN, deg(720))}`
    show(S, ["shape", "diags", "tris", "triLabels", "line"]); refit(S)
  }),
  watch("table", "Look at the sides and the triangles.", S => {
    base(S); ensureShape(S, 6); allDiagonals(S, 0)
    S.table = { cols: [[3, 1], [4, 2], [5, 3], [6, 4]], start: S.time + 0.3, gap: false }
    show(S, ["shape", "diags", "tris", "table"]); refit(S)
  }, 3),
  watch("minus-two", "There are always two fewer triangles than sides.", S => {
    base(S); ensureShape(S, 6); allDiagonals(S, 0)
    S.table = { cols: [[3, 1], [4, 2], [5, 3], [6, 4]], start: S.time - 5, gap: true }
    show(S, ["shape", "diags", "tris", "table"]); refit(S)
  }, 2.2),
  {
    id: "ten-sides",
    say: "A shape has $10$ sides. How many triangles?",
    enter: S => {
      base(S); clearLines(S)
      S.table = { cols: [[3, 1], [4, 2], [5, 3], [6, 4], [10, null]], start: S.time - 5, gap: true }
      show(S, ["shape", "table", "keypad"])
      regularShape(S, 10)
      S.diagFrom = 0
      colours(S)
      ask(S, [], 8, {
        help: (S2, t) => { if (S2.table) S2.table.pulse = true; if (t >= 2) { autoDiagonals(S2, 0); S2.vis.diags.t = 1; S2.vis.tris.t = 1 } },
        onRight: S2 => {
          S2.table!.cols[4] = [10, 8]
          autoDiagonals(S2, 0)
          S2.vis.diags.t = 1
          S2.vis.tris.t = 1
        },
      })
    },
    done: S => inputRight(S) && !S.diagAuto && S.diags.length === 7 && S.diags.every(k => (S.diagGrow[k] ?? 0) >= 1),
    walk: [
      { say: "Look at the table. There are always two fewer triangles than sides.", show: S => { if (S.table) S.table.pulse = true } },
      { say: "So $10$ sides make $10 - 2 = 8$ triangles." },
    ],
  },
  watch("sum-1440", "So its angles add up to $8 \\times 180^\\circ = 1440^\\circ$.", S => {
    base(S); ensureShape(S, 10); allDiagonals(S, 0)
    S.lineTex = `8 \\times 180^\\circ = ${c(GREEN, deg(1440))}`
    show(S, ["shape", "diags", "tris", "line"]); refit(S)
  }),
  watch("polygon", "Any shape with straight sides is a *polygon*.", S => {
    base(S); ensureShape(S, 10); clearLines(S); show(S, ["shape"])
  }),
  watch("rule", "With $n$ sides, the angles add up to $(n - 2) \\times 180^\\circ$.", S => {
    base(S); ensureShape(S, 10); clearLines(S)
    S.lineTex = `(n - 2) \\times 180^\\circ`
    S.lineScale = 1.3
    show(S, ["shape", "line"]); refit(S)
  }, 2.2),
  watch("names", "Here are some of their names.", S => {
    base(S); clearLines(S)
    show(S, ["shape", "line"])
    S.names = { list: [{ n: 5, name: "pentagon" }, { n: 6, name: "hexagon" }, { n: 8, name: "octagon" }, { n: 10, name: "decagon" }], start: S.time, shown: -1 }
  }, 7.6),

  // ── 4. Regular polygons ──
  watch("make-regular", "Watch this hexagon become *regular*.", S => {
    base(S); clearLines(S)
    show(S, ["shape"])
    shapeFromAngles(S, [130, 110, 125, 115, 120, 120])
    colours(S)
    const L = layout(S)
    S.pending = { P: centreIn(regular(6, [0, 0], 1, Math.PI / 2 + Math.PI / 6), L.shape, L.compact ? 260 : 340), at: S.time + 1.1 }
  }, 2.4),
  watch("equal-sides", "All six sides are equal.", S => {
    base(S); clearLines(S); regularShape(S, 6); colours(S)
    S.ticks = true
    show(S, ["shape", "ticks"])
  }),
  watch("equal-angles", "All six angles are equal too.", S => {
    base(S); regularShape(S, 6); S.oneColour = BLUE; colours(S)
    S.ticks = true
    show(S, ["shape", "ticks", "arcs"])
  }),
  watch("share-720", "The six angles share $720^\\circ$.", S => {
    base(S); regularShape(S, 6); S.oneColour = BLUE; colours(S)
    S.ticks = true
    S.lineTex = `${Array(6).fill(c(BLUE, "?")).join(" + ")} = ${c(GREEN, deg(720))}`
    show(S, ["shape", "ticks", "arcs", "line"]); refit(S)
  }),
  {
    id: "each-120",
    say: "Find each angle.",
    enter: S => {
      base(S); regularShape(S, 6); S.oneColour = BLUE; colours(S)
      S.ticks = true
      show(S, ["shape", "ticks", "arcs", "line", "keypad"]); refit(S)
      ask(S, [`\\dfrac{${c(GREEN, deg(720))}}{6} =`, { box: true }], 120, {
        help: shareHelp(720, 6),
        deg: true,
        onRight: S2 => { S2.vis.values.t = 1 },
      })
    },
    done: inputRight,
    walk: shareWalk(720, 6, "hexagon"),
  },
  {
    id: "turn-resize",
    say: "Turn it or resize it. Each angle is still $120^\\circ$.",
    enter: S => {
      base(S); regularShape(S, 6); S.oneColour = BLUE; colours(S)
      S.ticks = true
      S.mode = "regular"
      S.glow = S.P!.map(() => true)
      show(S, ["shape", "ticks", "arcs", "values"]); refit(S)
    },
    done: movedEnough(300), free: true, minPlay: 5,
  },
  {
    id: "each-108",
    say: "This is a regular pentagon. Find each angle.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "ticks", "arcs", "line", "keypad"])
      regularShape(S, 5); S.oneColour = BLUE; colours(S)
      S.ticks = true
      ask(S, [`\\dfrac{${c(GREEN, deg(540))}}{5} =`, { box: true }], 108, {
        help: shareHelp(540, 5),
        deg: true,
        onRight: S2 => { S2.vis.values.t = 1 },
      })
    },
    done: inputRight,
    walk: shareWalk(540, 5, "pentagon"),
  },

  // ── 5. Exterior angles ──
  watch("any-pentagon", "Now a pentagon that isn't regular.", S => {
    base(S); clearLines(S)
    show(S, ["shape", "arcs", "values"])
    shapeFromAngles(S, PENT); colours(S)
  }),
  {
    id: "stretch",
    say: "Stretch one side out past its corner.",
    enter: S => {
      base(S); ensureShape(S, 5, PENT); clearLines(S); colours(S)
      S.mode = "extend"
      S.extCorner = 1
      S.extLen = 0
      show(S, ["shape", "arcs"]); refit(S)
    },
    done: S => !S.drag && S.extLen >= 50 * screenScale(S),
  },
  watch("exterior", "This outside angle is an *exterior angle*.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    S.extCorners = [1]
    show(S, ["shape", "ext", "extValues"])
  }),
  watch("interior", "The angle inside is an *interior angle*.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    S.extCorners = [1]
    S.pulse = S.P!.map((_, i) => i === 1)
    show(S, ["shape", "arcs", "values", "ext", "extValues"])
  }),
  watch("straight-line", "The interior and exterior angles make a straight line.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    S.extCorners = [1]
    S.pulse = S.P!.map((_, i) => i === 1)
    const inside = 180 - shownTurn(S, 1)
    S.lineTex = `${c(ORANGE, deg(inside))} + ${c(ORANGE, deg(180 - inside))} = 180^\\circ`
    show(S, ["shape", "arcs", "values", "ext", "extValues", "line"]); refit(S)
  }, 2.2),
  watch("outside-rule", "So the exterior angle is $180^\\circ$ minus the interior angle.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    S.extCorners = [1]
    S.lineWords = "exterior $= 180^\\circ -$ interior"
    show(S, ["shape", "arcs", "values", "ext", "extValues", "line"]); refit(S)
  }),
  watch("all-five", "Here are all five exterior angles.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    allExt(S)
    show(S, ["shape", "ext", "extValues"]); refit(S)
  }),
  {
    id: "walk-1",
    say: "Now walk around the shape.",
    enter: S => {
      base(S); ensureShape(S, 5, PENT); colours(S)
      allExt(S)
      startWalk(S)
      S.mode = "walk"
      show(S, ["shape", "ext", "walker", "dial"]); refit(S)
    },
    done: S => !!S.walk && S.walk.steps >= 1 && S.walk.phase === "idle",
  },
  {
    id: "walk-turn",
    say: "At each corner, you turn.",
    enter: S => {
      base(S, true); colours(S)
      allExt(S)
      if (!S.walk || S.walk.steps < 1 || S.P?.length !== 5) walkTo(S, 1, 0)
      allExt(S)
      S.mode = "walk"
      show(S, ["shape", "ext", "walker", "dial"]); refit(S)
    },
    done: S => !!S.walk && S.walk.turns >= 1 && S.walk.phase === "idle",
  },
  {
    id: "walk-round",
    say: "Keep walking all the way round.",
    enter: S => {
      base(S, true); colours(S)
      if (!S.walk || S.walk.turns < 1 || S.P?.length !== 5) walkTo(S, 1, 1)
      allExt(S)
      S.mode = "walk"
      show(S, ["shape", "ext", "walker", "dial"]); refit(S)
    },
    done: S => !!S.walk && !!S.P && S.walk.turns >= S.P.length && S.walk.phase === "idle",
  },
  watch("once-round", "You turned all the way round, once.", S => {
    base(S, true); colours(S)
    if (!S.walk || S.walk.turns < 5 || S.P?.length !== 5) walkTo(S, 5, 5)
    allExt(S)
    show(S, ["shape", "ext", "walker", "dial"]); refit(S)
  }),
  watch("full-turn", "One full turn is $360^\\circ$.", S => {
    base(S, true); colours(S)
    if (!S.walk || S.walk.turns < 5 || S.P?.length !== 5) walkTo(S, 5, 5)
    allExt(S)
    show(S, ["shape", "ext", "walker", "dial"]); refit(S)
  }),
  watch("ext-360", "So the exterior angles always add up to $360^\\circ$.", S => {
    base(S); ensureShape(S, 5, PENT); colours(S)
    allExt(S)
    S.dial = { wedges: [], mode: "live" }
    show(S, ["shape", "ext", "extValues", "dial"]); refit(S)
  }, 2.2),
  {
    id: "turns-live",
    say: "Move the corners. Watch the turns.",
    enter: S => {
      base(S); ensureShape(S, 5, PENT); colours(S)
      allExt(S)
      S.dial = { wedges: [], mode: "live" }
      free(S)
      show(S, ["shape", "nodes", "ext", "extValues", "dial"]); refit(S)
    },
    done: movedEnough(320, 2), free: true, minPlay: 7,
  },

  // ── 6. The quick way for regular polygons ──
  watch("equal-turns", "In a regular hexagon, every turn is the same.", S => {
    base(S); clearLines(S)
    show(S, ["shape", "ticks", "ext", "extValues", "dial"])
    regularShape(S, 6); colours(S)
    S.ticks = true
    allExt(S)
    S.dial = { wedges: [], mode: "regular" }
  }),
  {
    id: "turn-60",
    say: "Find each turn.",
    enter: S => {
      base(S)
      show(S, ["shape", "ticks", "ext", "dial", "line", "keypad"])
      regularShape(S, 6); colours(S)
      S.ticks = true
      allExt(S)
      S.dial = { wedges: [], mode: "regular" }
      ask(S, [`\\dfrac{${deg(360)}}{6} =`, { box: true }], 60, {
        help: turnsHelp(6),
        deg: true,
        onRight: S2 => { S2.vis.extValues.t = 1 },
      })
    },
    done: inputRight,
    walk: turnsWalk(6),
  },
  {
    id: "inside-120",
    say: "Each angle inside is $180^\\circ$ minus that.",
    enter: S => {
      base(S)
      show(S, ["shape", "ticks", "ext", "extValues", "arcs", "line", "keypad"])
      regularShape(S, 6); S.oneColour = BLUE; colours(S)
      S.ticks = true
      allExt(S)
      ask(S, [`${deg(180)} - ${deg(60)} =`, { box: true }], 120, {
        help: lineHelp(60),
        deg: true,
        onRight: S2 => { S2.vis.values.t = 1; say(S2, "That's the same $120^\\circ$ as before.", "calm", 3) },
      })
    },
    done: inputRight,
    walk: lineWalk(60),
  },
  {
    id: "decagon-ext",
    say: "This is a regular decagon. Find each exterior angle.",
    enter: S => {
      base(S)
      show(S, ["shape", "ticks", "ext", "dial", "line", "keypad"])
      regularShape(S, 10); colours(S)
      S.ticks = true
      allExt(S)
      S.dial = { wedges: [], mode: "regular" }
      ask(S, [`\\dfrac{${deg(360)}}{10} =`, { box: true }], 36, {
        help: turnsHelp(10),
        deg: true,
      })
    },
    done: inputRight,
    walk: turnsWalk(10),
  },
  {
    id: "decagon-int",
    say: "Now each interior angle.",
    enter: S => {
      base(S)
      show(S, ["shape", "ticks", "arcs", "line", "keypad"])
      regularShape(S, 10); S.oneColour = BLUE; colours(S)
      S.ticks = true
      ask(S, [`${deg(180)} - ${deg(36)} =`, { box: true }], 144, {
        help: (S2, t) => { S2.extCorners = [0]; S2.vis.ext.t = 1; S2.vis.extValues.t = 1; lineHelp(36)(S2, t) },
        deg: true,
        onRight: S2 => { S2.vis.values.t = 1 },
      })
    },
    done: inputRight,
    walk: lineWalk(36, S => { S.extCorners = [0]; S.vis.ext.t = 1; S.vis.extValues.t = 1; lineHelp(36)(S, 1) }),
  },
  {
    id: "sides-12",
    say: "Every turn is $30^\\circ$. How many sides?",
    enter: S => {
      base(S)
      show(S, ["dial", "line", "keypad"])
      S.dial = { wedges: [], mode: "fill", fill: { deg: 30, start: S.time + 0.6, every: 0.32, max: 12 } }
      ask(S, [`\\dfrac{${deg(360)}}{${deg(30)}} =`, { box: true }], 12, {
        help: countHelp,
        onRight: S2 => { regularShape(S2, 12); colours(S2); S2.vis.shape.t = 1 },
      })
    },
    done: inputRight,
    walk: countWalk(30),
  },
  {
    id: "turn-40",
    say: "Every inside angle is $140^\\circ$. Find each turn.",
    enter: S => {
      base(S)
      show(S, ["line", "keypad"])
      ask(S, [`${deg(180)} - ${deg(140)} =`, { box: true }], 40, {
        help: (S2, t) => { S2.overlay = straightLine(S2, 140); S2.vis.overlay.t = 1; if (t >= 2) remind(S2, `${c(BLUE, deg(140))} + ${c(PINK, "?")} = ${c(GREEN, deg(180))}`) },
        deg: true,
      })
    },
    done: inputRight,
    walk: [
      { say: "At each corner, inside and outside make a straight line.", show: S => { S.overlay = straightLine(S, 140); S.vis.overlay.t = 1 } },
      { say: "So each turn is $180^\\circ - 140^\\circ$.", tex: `${deg(180)} - ${c(BLUE, deg(140))} = ${c(GREEN, deg(40))}` },
    ],
  },
  {
    id: "sides-9",
    say: "So how many sides?",
    enter: S => {
      base(S)
      show(S, ["dial", "line", "keypad"])
      S.dial = { wedges: [], mode: "fill", fill: { deg: 40, start: S.time + 0.4, every: 0.36, max: 9 } }
      ask(S, [`\\dfrac{${deg(360)}}{${deg(40)}} =`, { box: true }], 9, {
        help: countHelp,
        onRight: S2 => { regularShape(S2, 9); colours(S2); S2.vis.shape.t = 1 },
      })
    },
    done: inputRight,
    walk: countWalk(40),
  },

  // ── 7. Missing angles ──
  {
    id: "missing-quad",
    say: "Find the missing angle.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "arcs", "values", "line", "keypad"])
      shapeFromAngles(S, [100, 85, 70, 105])
      colours(S, [BLUE, ORANGE, YELLOW, PINK])
      S.label = [deg(100), deg(85), deg(70), "?"]
      S.pulse = [false, false, false, true]
      ask(S, [`${c(BLUE, deg(100))} + ${c(ORANGE, deg(85))} + ${c(YELLOW, deg(70))} +`, { box: true }, `= ${c(GREEN, deg(360))}`], 105, {
        help: (S2, t) => { allDiagonals(S2, 0); S2.vis.diags.t = 1; S2.vis.tris.t = 1; S2.vis.triLabels.t = 1; if (t >= 2) { S2.dial = { wedges: [], mode: "known", known: [{ deg: 100, color: BLUE }, { deg: 85, color: ORANGE }, { deg: 70, color: YELLOW }] }; S2.vis.dial.t = 1 } },
        deg: true,
        onRight: S2 => { S2.label[3] = deg(105); S2.colT[3] = GREEN; S2.pulse[3] = false },
      })
    },
    done: inputRight,
    walk: [
      { say: "One line cuts the shape into two triangles. That makes $360^\\circ$ in all.", show: S => { allDiagonals(S, 0); S.vis.diags.t = 1; S.vis.tris.t = 1; S.vis.triLabels.t = 1 } },
      { say: "The three angles you know make $255^\\circ$.", tex: `${c(BLUE, deg(100))} + ${c(ORANGE, deg(85))} + ${c(YELLOW, deg(70))} = ${deg(255)}` },
      { say: "So the missing angle is $360^\\circ - 255^\\circ$.", tex: `${c(PINK, "?")} = ${deg(360)} - ${deg(255)} = ${c(GREEN, deg(105))}`, show: S => { S.label[3] = deg(105) } },
    ],
  },
  {
    id: "pent-sum",
    say: "What do a pentagon's angles add up to?",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "line", "keypad"])
      shapeFromAngles(S, PENT_Q); colours(S)
      ask(S, [`(5 - 2) \\times 180^\\circ =`, { box: true }], 540, {
        help: (S2, t) => { allDiagonals(S2, 0); S2.vis.diags.t = 1; S2.vis.tris.t = 1; S2.vis.triLabels.t = 1; if (t >= 2) S2.triPulse = true },
        deg: true,
      })
    },
    done: inputRight,
    walk: [
      { say: "Lines from one corner cut a pentagon into $3$ triangles.", show: S => { allDiagonals(S, 0); S.vis.diags.t = 1; S.vis.tris.t = 1; S.vis.triLabels.t = 1 } },
      { say: "Each triangle's angles add up to $180^\\circ$.", tex: `3 \\times 180^\\circ = ${c(GREEN, deg(540))}`, show: S => { S.triPulse = true } },
    ],
  },
  {
    id: "missing-pent",
    say: "Find the missing angle.",
    enter: S => {
      base(S); clearLines(S)
      S.lineScale = 0.86
      show(S, ["shape", "arcs", "values", "line", "keypad"])
      shapeFromAngles(S, PENT_Q)
      colours(S, [BLUE, ORANGE, YELLOW, "#c9c7bf", PINK])
      S.label = [deg(110), deg(95), deg(120), deg(100), "?"]
      S.pulse = [false, false, false, false, true]
      ask(S, [`110^\\circ + 95^\\circ + 120^\\circ + 100^\\circ +`, { box: true }, `= ${c(GREEN, deg(540))}`], 115, {
        help: (S2, t) => { allDiagonals(S2, 0); S2.vis.diags.t = 1; S2.vis.tris.t = 1; S2.vis.triLabels.t = 1; if (t >= 2) { S2.triPulse = true; remind(S2, `3 \\times ${deg(180)} = ${c(GREEN, deg(540))}`) } },
        deg: true,
        onRight: S2 => { S2.label[4] = deg(115); S2.colT[4] = GREEN; S2.pulse[4] = false },
      })
    },
    done: inputRight,
    walk: [
      { say: "A pentagon's angles add up to $3 \\times 180^\\circ = 540^\\circ$.", show: S => { allDiagonals(S, 0); S.vis.diags.t = 1; S.vis.tris.t = 1; S.vis.triLabels.t = 1 } },
      { say: "The four angles you know make $425^\\circ$.", tex: `110^\\circ + 95^\\circ + 120^\\circ + 100^\\circ = ${deg(425)}` },
      { say: "So the missing angle is $540^\\circ - 425^\\circ$.", tex: `${c(PINK, "?")} = ${deg(540)} - ${deg(425)} = ${c(GREEN, deg(115))}`, show: S => { S.label[4] = deg(115) } },
    ],
  },
  watch("pent-hex", "Here are a regular pentagon and a regular hexagon, side by side.", S => {
    base(S); clearLines(S)
    S.P = null; S.D = null
    show(S, ["overlay"])
    S.overlay = pentHex(S, { x: "x" })
  }, 2.2),
  {
    id: "pent-108",
    say: "What is each angle of the pentagon?",
    enter: S => {
      base(S); S.P = null; S.D = null
      show(S, ["overlay", "line", "keypad"])
      S.overlay = pentHex(S, { p: "?", x: "x" })
      ask(S, [{ box: true }], 108, {
        help: (S2, t) => { S2.overlay = pentHex(S2, { p: "?", x: "x" }, { helpPent: true }); if (t >= 2) remind(S2, `5 \\times ${c(BLUE, "?")} = ${c(GREEN, deg(540))}`) },
        deg: true,
        onRight: S2 => { S2.overlay = pentHex(S2, { p: deg(108), x: "x" }) },
      })
    },
    done: inputRight,
    walk: [
      { say: "A pentagon's angles add up to $540^\\circ$.", show: S => { S.overlay = pentHex(S, { p: "?", x: "x" }, { helpPent: true }) } },
      { say: "Its five angles are equal. So each is $540^\\circ \\div 5$.", tex: `\\dfrac{${c(GREEN, deg(540))}}{5} = ${c(GREEN, deg(108))}`, show: S => { S.overlay = pentHex(S, { p: deg(108), x: "x" }, { helpPent: true }) } },
    ],
  },
  {
    id: "hex-120",
    say: "What is each angle of the hexagon?",
    enter: S => {
      base(S); S.P = null; S.D = null
      show(S, ["overlay", "line", "keypad"])
      S.overlay = pentHex(S, { p: deg(108), h: "?", x: "x" })
      ask(S, [{ box: true }], 120, {
        help: (S2, t) => { S2.overlay = pentHex(S2, { p: deg(108), h: "?", x: "x" }, { helpHex: true }); if (t >= 2) remind(S2, `6 \\times ${c(ORANGE, "?")} = ${c(GREEN, deg(720))}`) },
        deg: true,
        onRight: S2 => { S2.overlay = pentHex(S2, { p: deg(108), h: deg(120), x: "x" }) },
      })
    },
    done: inputRight,
    walk: [
      { say: "A hexagon's angles add up to $720^\\circ$.", show: S => { S.overlay = pentHex(S, { p: deg(108), h: "?", x: "x" }, { helpHex: true }) } },
      { say: "Its six angles are equal. So each is $720^\\circ \\div 6$.", tex: `\\dfrac{${c(GREEN, deg(720))}}{6} = ${c(GREEN, deg(120))}`, show: S => { S.overlay = pentHex(S, { p: deg(108), h: deg(120), x: "x" }, { helpHex: true }) } },
    ],
  },
  watch("round-point", "Angles round a point add up to $360^\\circ$.", S => {
    base(S); S.P = null; S.D = null
    show(S, ["overlay"])
    S.overlay = pentHex(S, { p: deg(108), h: deg(120), x: "x" })
  }, 2),
  {
    id: "find-x",
    say: "Find $x$.",
    enter: S => {
      base(S); S.P = null; S.D = null
      show(S, ["overlay", "line", "keypad"])
      S.overlay = pentHex(S, { p: deg(108), h: deg(120), x: "x" })
      ask(S, [`x = 360^\\circ - ${c(BLUE, deg(108))} - ${c(ORANGE, deg(120))} =`, { box: true }], 132, {
        help: (S2) => { S2.overlay = pentHex(S2, { p: deg(108), h: deg(120), x: "x" }, { helpPoint: true }) },
        deg: true,
        onRight: S2 => { S2.overlay = pentHex(S2, { p: deg(108), h: deg(120), x: deg(132) }) },
      })
    },
    done: inputRight,
    walk: [
      { say: "The three angles go all the way round the point.", show: S => { S.overlay = pentHex(S, { p: deg(108), h: deg(120), x: "x" }, { helpPoint: true }) } },
      { say: "Angles round a point add up to $360^\\circ$.", tex: `${c(BLUE, deg(108))} + ${c(ORANGE, deg(120))} + x = ${c(GREEN, deg(360))}` },
      { say: "So $x$ is $360^\\circ - 108^\\circ - 120^\\circ$.", tex: `x = ${c(GREEN, deg(132))}`, show: S => { S.overlay = pentHex(S, { p: deg(108), h: deg(120), x: deg(132) }) } },
    ],
  },

  // ── 8. Build to order, and the impossible one ──
  {
    id: "build-120",
    say: "Make a regular polygon with angles of $120^\\circ$.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "arcs", "line", "stepper"])
      regularShape(S, 4); S.oneColour = BLUE; colours(S)
      S.stepper = { n: 4, goal: 120 }
    },
    done: S => S.locked,
  },
  {
    id: "build-140",
    say: "Now one with angles of $140^\\circ$.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "arcs", "line", "stepper"])
      const n = S.P && S.P.length >= 3 ? S.P.length : 6
      regularShape(S, n); S.oneColour = BLUE; colours(S)
      S.stepper = { n, goal: 140 }
    },
    done: S => S.locked,
  },
  {
    id: "build-100",
    say: "Now one with angles of $100^\\circ$.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "arcs", "line", "stepper"])
      const n = S.P && S.P.length >= 3 ? S.P.length : 9
      regularShape(S, n); S.oneColour = BLUE; colours(S)
      S.stepper = { n, goal: 100 }
    },
    cta: "I can't do it",
    ctaAfter: 10,
  },
  watch("why-not", "Do you know why you couldn't do it?", S => {
    base(S); clearLines(S)
    show(S, ["shape", "arcs"])
    ensureShape(S, S.P?.length && S.P.length >= 3 ? S.P.length : 5)
    S.oneColour = BLUE; colours(S)
  }),
  watch("turn-80", "Each turn would have to be $80^\\circ$.", S => {
    base(S)
    S.lineTex = `180^\\circ - 100^\\circ = ${c(YELLOW, deg(80))}`
    show(S, ["line"])
  }),
  watch("must-360", "The turns must add up to $360^\\circ$.", S => {
    base(S)
    show(S, ["dial"])
    S.dial = { wedges: [], mode: "impossible", fill: { deg: 80, start: S.time + 0.5, every: 0.85, max: 5 } }
  }, 5),
  watch("too-few-many", "Four turns make $320^\\circ$. Five turns make $400^\\circ$.", S => {
    base(S)
    show(S, ["dial"])
    S.dial = { wedges: [], mode: "impossible", fill: { deg: 80, start: S.time - 10, every: 0.85, max: 5 } }
  }, 2.2),
  watch("half-side", "You can't have four and a half sides.", S => {
    base(S)
    S.lineTex = `\\dfrac{${deg(360)}}{${deg(80)}} = 4.5`
    show(S, ["dial", "line"])
    S.dial = { wedges: [], mode: "impossible", fill: { deg: 80, start: S.time - 10, every: 0.85, max: 5 } }
  }),
  watch("cannot-exist", "So a regular polygon like this can't exist.", S => {
    base(S)
    show(S, ["dial"])
    S.dial = { wedges: [], mode: "impossible", fill: { deg: 80, start: S.time - 10, every: 0.85, max: 5 } }
  }),
  {
    id: "end",
    say: "In any polygon, the turns add up to $360^\\circ$.",
    enter: S => {
      base(S); clearLines(S)
      show(S, ["shape", "nodes", "ext", "extValues", "dial"])
      shapeFromAngles(S, PENT); colours(S)
      allExt(S)
      S.dial = { wedges: [], mode: "live" }
      free(S)
    },
    cta: "Start again",
    ctaAfter: 4,
    restart: true,
  },
]

// ── the parts of the lesson: each title comes up before its first beat ──
const PARTS: [string, string][] = [
  ["draw", "Angles in a quadrilateral"],
  ["diagonal", "Why they add up to $360^\\circ$"],
  ["add-5", "More sides"],
  ["make-regular", "Regular polygons"],
  ["any-pentagon", "Exterior angles"],
  ["equal-turns", "The quick way for regular polygons"],
  ["missing-quad", "Finding missing angles"],
  ["build-120", "Build a regular polygon"],
]
for (const [id, title] of PARTS) {
  const b = BEATS.find(x => x.id === id)
  if (!b) throw new Error(`no beat called ${id}`)
  b.chapter = title
}
