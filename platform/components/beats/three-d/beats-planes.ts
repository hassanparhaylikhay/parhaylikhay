/**
 * Symmetry of solids (4.5, lesson 2 of 2), one tiny idea per beat.
 *
 * A round sheet of glass stands through the middle of a solid. The student
 * turns it (a knob on its side) or tips it over (a knob on its top); it
 * clicks into a plane, and the solid's mirror image in the sheet goes
 * through it: green where it lands on the solid (a plane of symmetry, kept
 * as a dashed blue cut), pink where it sticks out. Every click comes from
 * the solid itself (sheet.ts), never from a list. Questions from
 * 4024/21/O/N/25 Q3(b), 4024/12/M/J/23 Q9(a) and 4024/23/M/J/25 Q22(a).
 *
 * Colours: planes found blue (dashed), the sheet chalk while it is free and
 * green or pink when it clicks, the knobs yellow.
 */

import type { WalkStep } from "../walk"
import { atom, row, op } from "../equation"
import { applyParts } from "../chapter"
import { type Scene, type V3, BLUE, GREEN, BOX_FACES, boxPts, resetBeat, say, startInput, boxNode, segKey, addSeg, goodView, vadd, vmul } from "./scene"
import { type Beat, look, watch, solidBoard, lens } from "./kit"
import { type Curved, type Net, curvedBounds, netBounds, w25Net } from "./solids"
import { type Sheet, makeSheet, sheetHandles, anglesOf, angGap, samePlane, curvedFits } from "./sheet"

// ── the solids ───────────────────────────────────────────────────────────

type Def = { pts: Record<string, V3>; faces: string[][]; names?: Partial<Record<string, string>>; lens?: Record<string, string>; rights?: { at: string; a: string; b: string }[] }

const CUBOID: Def = { pts: boxPts(3.4, 2.2, 1.6), faces: BOX_FACES }
const CUBE: Def = { pts: boxPts(2.4, 2.4, 2.4), faces: BOX_FACES }
/** 4024/21/O/N/25 Q3: the cuboid its net folds into (all lengths in centimetres). */
const W25: Def = { pts: boxPts(3, 4.7, 5.2), faces: BOX_FACES, lens: { "E-H": "3", "G-H": "4.7", "C-G": "5.2" } }
/** 4024/12/M/J/23 Q9: a prism whose cross-section is a right-angled isosceles triangle, lying on one of its short sides. */
const PRISM: Def = {
  pts: { A: [-1.5, -4, 0], B: [1.5, -4, 0], C: [-1.5, -4, 3], D: [-1.5, 4, 0], E: [1.5, 4, 0], F: [-1.5, 4, 3] },
  faces: [["A", "B", "C"], ["D", "F", "E"], ["A", "D", "E", "B"], ["A", "C", "F", "D"], ["B", "E", "F", "C"]],
  lens: { "A-C": "3\\,\\text{cm}", "A-B": "3\\,\\text{cm}", "B-E": "8\\,\\text{cm}" },
  rights: [{ at: "A", a: "B", b: "C" }, { at: "D", a: "E", b: "F" }],
}
/** Where A, C and B sit round the middle of the pyramid's base (degrees). */
const PYR_AT = [200, 320, 80]
/** 4024/23/M/J/25 Q22: a pyramid ABCV on an equilateral triangle, V straight above its middle. */
const PYR: Def = (() => {
  const s = 3.4, r = s / Math.sqrt(3), at = (deg: number): V3 => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180), 0]
  return {
    // turned as in the paper from the usual view: A on the left, C at the front, B at the back on the right
    pts: { A: at(PYR_AT[0]), C: at(PYR_AT[1]), B: at(PYR_AT[2]), V: [0, 0, 5.4] },
    faces: [["A", "C", "B"], ["V", "A", "C"], ["V", "C", "B"], ["V", "B", "A"]],
    names: { A: "A", B: "B", C: "C", V: "V" },
    lens: { "B-V": "82", "B-C": "34" },
  }
})()
const CYL: Curved = { kind: "cylinder", r: 1.4, h: 3 }
const CONE: Curved = { kind: "cone", r: 1.5, h: 3.2 }

/** The turn at which an upright sheet faces the student from the usual view (goodView): a turn beat starts near it, so the sheet is never seen edge on and its knob sits out to the left. */
const FACING = 124

// planes by their normals
const X: V3 = [1, 0, 0], Y: V3 = [0, 1, 0], Z: V3 = [0, 0, 1]
const unit = (a: number, b: number, c: number): V3 => { const l = Math.hypot(a, b, c); return [a / l, b / l, c / l] }
/** The cuboid's corner-to-corner cuts: upright, through two opposite upright edges. */
const diagsOf = (l: number, w: number): V3[] => [unit(w, -l, 0), unit(w, l, 0)]
/** The cube's other four corner-to-corner cuts, tipped over, through two opposite level edges. */
const CUBE_TIPPED: V3[] = [unit(0, 1, 1), unit(0, 1, -1), unit(1, 0, 1), unit(1, 0, -1)]
/** The prism's second plane: through the right-angled edge and the middle of the sloping face. */
const PRISM_TILT = unit(1, 0, -1)
/** The pyramid's three planes: each through V, one corner and the middle of the side opposite it. */
const PYR_PLANES: V3[] = PYR_AT.map(d => [Math.cos(((d + 90) * Math.PI) / 180), Math.sin(((d + 90) * Math.PI) / 180), 0] as V3)

// ── boards ───────────────────────────────────────────────────────────────

/** Points round the sheet for the view to fit (so the sheet never runs off the board as it turns). */
function roomFor(S: Scene, sh: Sheet) {
  const dirs: V3[] = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  dirs.forEach((d, i) => { S.P3[`_r${i}`] = vadd(sh.c, vmul(d, sh.r)) })
  S.fitPts = [...(S.fitPts ?? []), ...dirs.map((_, i) => `_r${i}`)]
}

/** A solid with flat faces on the board, and a sheet through it (hidden until a beat shows it). */
function planeBoard(S: Scene, d: Def, o: { phi?: number; tau?: number; hidden?: boolean; found?: V3[] } = {}) {
  solidBoard(S, d.pts, d.faces, d.names ?? {})
  S.keyRows = 4
  for (const [k, tex] of Object.entries(d.lens ?? {})) { const [a, b] = k.split("-"); S.lens[segKey(a, b)] = lens(tex) }
  S.rights = (d.rights ?? []).map(r => ({ ...r }))
  const sh = makeSheet(Object.values(d.pts), { phi: o.phi ?? 0, tau: o.tau ?? 0 })
  sh.hidden = o.hidden
  sh.found = [...(o.found ?? [])]
  S.sheet = sh
  roomFor(S, sh)
}

/** A curved solid on the board, with a sheet through its axis that is green wherever the halves match. */
function curvedPlaneBoard(S: Scene, c: Curved, phi = 20) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  curvedBounds(c).forEach((p, i) => { S.P3[`_c${i}`] = p })
  S.faces = null
  S.curved = c
  S.fitPts = Object.keys(S.P3)
  const sh = makeSheet(curvedBounds(c), { phi, c: [0, 0, c.h / 2], r: 1.14 * Math.hypot(c.r, c.h / 2), fits: n => curvedFits(c, n) })
  sh.live = true
  S.sheet = sh
  roomFor(S, sh)
}

/** Send the sheet to a plane, whichever way round is nearer where it is. */
function goTo(sh: Sheet, n: V3) {
  const reps = anglesOf(n)
  const best = reps.reduce((a, b) => ((a.phi === null ? 0 : angGap(a.phi, sh.phi)) + Math.abs(a.tau - sh.tau) <= (b.phi === null ? 0 : angGap(b.phi, sh.phi)) + Math.abs(b.tau - sh.tau) ? a : b))
  if (best.phi !== null) sh.phi = best.phi
  sh.tau = best.tau
}

/** The sheet goes to each plane in turn and clicks in; each one that matches stays, blue. */
function showPlanes(S: Scene, list: V3[], each = 1.9) {
  for (const n of list) S.acts.push({
    dur: each,
    begin: S2 => { const sh = S2.sheet!; sh.hidden = false; goTo(sh, n); sh.snaps = [n] },
    end: S2 => { const sh = S2.sheet!; if (sh.fits(n) && !sh.found.some(m => samePlane(m, n))) sh.found.push(n) },
  })
}

/** The count under the figure. */
const countLine = (S: Scene, total?: number) => {
  S.eqFn = S2 => {
    const k = S2.sheet?.found.length ?? 0
    return row([atom("cl", "\\text{Planes of symmetry}"), op("ce", "="), atom("cn", String(k), { col: total !== undefined && k === total ? GREEN : undefined })])
  }
}

// ── beat makers ──────────────────────────────────────────────────────────

/**
 * Turn or tip the sheet. It clicks into each plane in `snaps`; there the
 * solid's mirror copy goes through it, green where it matches, pink where it
 * does not. Done when `need` new planes are found (or, with `probe`, when a
 * copy has gone through, matching or not).
 */
function sheetBeat(id: string, text: string, board: (S: Scene) => void, o: { knob: "turn" | "tip"; phi: number; tau?: number; snaps: V3[]; need?: number; probe?: boolean; count?: boolean; total?: number; view?: [number, number] }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      const sh = S.sheet!
      sh.hidden = false
      sh.phi = sh.phiD = o.phi
      sh.tau = sh.tauD = o.tau ?? 0
      sh.snaps = o.snaps
      sh.knobs = [o.knob]
      S.handles = sheetHandles(S)
      goodView(S, ...(o.view ?? []))
      const before = sh.found.length
      let handled: V3 | null = null
      S.tick = S2 => {
        const s = S2.sheet!
        if (!s.at) { handled = null; return }
        if (s.e < 1 || S2.got.has("done") || (handled && samePlane(handled, s.at))) return
        handled = s.at
        if (!s.fits(s.at)) {
          if (o.probe) { S2.got.add("done"); say(S2, "The halves don't match.", "calm", 600) } else say(S2, "The halves don't match. Keep going.", "calm", 2.6)
          return
        }
        if (s.found.some(m => samePlane(m, s.at!))) return
        s.found.push(s.at)
        S2.flashGood = 1
        if (s.found.length - before >= (o.need ?? 1)) S2.got.add("done")
        else say(S2, "Yes. Find another one.", "calm", 2.4)
      }
      if (o.count) countLine(S, o.total)
      look(S, o.count ? ["eq"] : [])
    },
    done: S => S.got.has("done") && S.drag === null,
    advanceAfter: o.probe ? 2600 : 1800,
  }
}

/** A count typed in; Show me how sends the sheet to each plane in turn, counting in the box. */
function askBeat(id: string, text: string, board: (S: Scene) => void, o: { answer: number; slips?: { v: number; say: string }[]; walk: WalkStep<Scene>[] }): Beat {
  return {
    id, say: text,
    enter: S => {
      board(S)
      S.keyRows = 2
      startInput(S, { answer: o.answer, dp: 0, slips: o.slips, typed: String(o.answer), max: 3 })
      // during Show me how the box counts the planes found; it empties again for the student to type
      S.eqFn = S2 => row([atom("cl", "\\text{Planes of symmetry}"), op("ce", "="), S2.input?.state === "right" ? atom("cn", String(o.answer), { col: GREEN }) : S2.vis.keypad.t === 0 && S2.vals.wn !== undefined ? atom("cn", String(S2.vals.wn), { col: BLUE }) : boxNode(S2)])
      look(S, ["eq", "keypad"])
    },
    done: S => S.input?.state === "right",
    advanceAfter: 1800,
    walk: o.walk,
  }
}

/** Show me how, one plane: the sheet goes there and clicks in; the copy goes through; a match stays, blue. */
function planeStep(text: string, n: V3, count: number, first = false): WalkStep<Scene> {
  return {
    say: text,
    show: S => {
      const sh = S.sheet!
      // the first step starts clean (Show me how can be offered again)
      if (first) sh.found = []
      sh.hidden = false
      const match = sh.fits(n)
      S.vals.wn = count - (match ? 1 : 0)
      goTo(sh, n)
      sh.snaps = [n]
      S.acts.push({ dur: 1.6, end: S2 => { S2.vals.wn = count; if (match && !S2.sheet!.found.some(m => samePlane(m, n))) { S2.sheet!.found.push(n); S2.flashGood = 1 } } })
    },
  }
}

// ── a net folding up (4024/21/O/N/25 Q3) ─────────────────────────────────

function netBoard(S: Scene, net: Net) {
  resetBeat(S)
  S.box = null
  S.pyr = null
  for (const n of Object.keys(S.P3)) delete S.P3[n]
  netBounds(net).forEach((p, i) => { S.P3[`_n${i}`] = p })
  S.faces = null
  S.net = { def: net, t: 0, tD: 0 }
  S.fitPts = Object.keys(S.P3)
  S.pitch = Math.max(S.pitch, 42)
}

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  watch("cut", "This sheet cuts the cuboid into two halves.", S => { planeBoard(S, CUBOID, { phi: 0 }); goodView(S); look(S) }, 2.2),
  watch("mirror", "Each half is the mirror image of the other.", S => { planeBoard(S, CUBOID, { phi: 0 }); S.sheet!.snaps = [X]; look(S) }, 3.0),
  watch("name", "So the sheet is a *plane of symmetry*.", S => { planeBoard(S, CUBOID, { phi: 0 }); S.sheet!.snaps = [X]; S.sheet!.e = 1; look(S) }, 2.4),
  sheetBeat("turn-1", "Turn the sheet until it is another plane of symmetry.", S => planeBoard(S, CUBOID, { found: [X] }), { knob: "turn", phi: FACING + 16, snaps: [Y], count: true }),
  sheetBeat("diag", "What about corner to corner? Turn the sheet to it.", S => planeBoard(S, CUBOID, { found: [X, Y] }), { knob: "turn", phi: FACING + 36, snaps: diagsOf(3.4, 2.2), probe: true }),
  sheetBeat("flat", "Now tip the sheet over until it lies flat.", S => planeBoard(S, CUBOID, { found: [X, Y] }), { knob: "tip", phi: 0, snaps: [Z], count: true, total: 3 }),
  watch("three", "A cuboid has $3$ planes of symmetry.", S => { planeBoard(S, CUBOID, { hidden: true, found: [X, Y, Z] }); countLine(S, 3); look(S, ["eq"]) }, 2.6),

  // 4024/21/O/N/25 Q3(b)
  {
    id: "w25-net",
    say: "This net folds into a cuboid, $3$ by $4.7$ by $5.2$.",
    enter: S => {
      netBoard(S, w25Net())
      // folded, it is the cuboid itself (the same corners), which then shows its lengths
      S.acts.push({ dur: 1.0 }, { dur: 2.6, run: (S2, e) => { if (S2.net) S2.net.t = e } }, { dur: 0.5, end: S2 => { planeBoard(S2, W25, { hidden: true }); look(S2) } })
      look(S)
    },
    cta: "", ctaAfter: 4.8,
  },
  askBeat("w25", "How many planes of symmetry does this cuboid have?", S => planeBoard(S, W25, { hidden: true }), {
    answer: 3,
    slips: [
      { v: 9, say: "That's for a cube. This cuboid's edges are all different lengths." },
      { v: 2, say: "Don't forget the level cut, halfway up." },
      { v: 5, say: "A corner-to-corner cut doesn't match on this cuboid." },
    ],
    walk: [
      planeStep("One cuts each $3$ edge in half.", X, 1, true),
      planeStep("One cuts each $4.7$ edge in half.", Y, 2),
      planeStep("One cuts it halfway up.", Z, 3),
    ],
  }),
]

const PART_2: Beat[] = [
  {
    id: "cube",
    say: "A cube has the same $3$ planes as a cuboid.",
    enter: S => { planeBoard(S, CUBE, { hidden: true }); goodView(S); countLine(S); showPlanes(S, [X, Y, Z]); look(S, ["eq"]) },
    cta: "", ctaAfter: 5.6,
  },
  sheetBeat("cube-diag", "On a cube, corner to corner works too. Turn the sheet to find both.", S => planeBoard(S, CUBE, { found: [X, Y, Z] }), { knob: "turn", phi: FACING + 41, snaps: diagsOf(2.4, 2.4), need: 2, count: true }),
  {
    id: "cube-why",
    say: "They work because the top of the cube is a square. A square's diagonal is a line of symmetry.",
    enter: S => {
      planeBoard(S, CUBE, { hidden: true, found: [X, Y, Z, ...diagsOf(2.4, 2.4)] })
      S.faceLit[1] = BLUE
      // the top square's two diagonals, where the two corner-to-corner sheets cut it
      addSeg(S, "A", "C", { col: BLUE, grown: true })
      addSeg(S, "B", "D", { col: BLUE, grown: true })
      S.edgeGlow = { [segKey("A", "C")]: BLUE, [segKey("B", "D")]: BLUE }
      countLine(S)
      look(S, ["eq"])
    },
    cta: "", ctaAfter: 3.4,
  },
  {
    id: "cube-tip",
    say: "Tipped over, $4$ more go corner to corner.",
    enter: S => { planeBoard(S, CUBE, { hidden: true, found: [X, Y, Z, ...diagsOf(2.4, 2.4)] }); countLine(S); showPlanes(S, CUBE_TIPPED); look(S, ["eq"]) },
    cta: "", ctaAfter: 7.4,
  },
  watch("cube-9", "So a cube has $9$ planes of symmetry.", S => { planeBoard(S, CUBE, { hidden: true, found: [X, Y, Z, ...diagsOf(2.4, 2.4), ...CUBE_TIPPED] }); countLine(S, 9); look(S, ["eq"]) }, 2.6),

  // 4024/12/M/J/23 Q9(a)
  watch("prism", "The cross-section of this prism is a right-angled isosceles triangle.", S => { planeBoard(S, PRISM, { hidden: true }); goodView(S); look(S) }, 2.8),
  sheetBeat("prism-1", "Turn the sheet to find a plane of symmetry.", S => planeBoard(S, PRISM), { knob: "turn", phi: FACING + 16, snaps: [Y, X], count: true }),
  sheetBeat("prism-2", "There is one more. Tip the sheet until the halves match.", S => planeBoard(S, PRISM, { found: [Y] }), { knob: "tip", phi: 0, tau: -20, snaps: [PRISM_TILT, unit(1, 0, 1), X, Z], count: true, total: 2, view: [45, 26] }),
  watch("prism-two", "So the prism has $2$ planes of symmetry.", S => { planeBoard(S, PRISM, { hidden: true, found: [Y, PRISM_TILT] }); countLine(S, 2); look(S, ["eq"]) }, 2.6),

  // 4024/23/M/J/25 Q22(a)
  watch("pyr", "The base of this pyramid is an equilateral triangle. $V$ is straight above its middle.", S => { planeBoard(S, PYR, { hidden: true }); goodView(S); look(S) }, 3.0),
  askBeat("pyr-q", "How many planes of symmetry does the pyramid have?", S => planeBoard(S, PYR, { hidden: true }), {
    answer: 3,
    slips: [
      { v: 4, say: "A level cut doesn't match: the top part comes to a point, the bottom part doesn't." },
      { v: 1, say: "There is one through each corner of the base." },
      { v: 6, say: "Only cuts through $V$ and a corner match." },
    ],
    walk: [
      planeStep("One goes through $V$, corner $A$ and the middle of $BC$.", PYR_PLANES[0], 1, true),
      planeStep("One goes through $V$, corner $C$ and the middle of $AB$.", PYR_PLANES[1], 2),
      planeStep("One goes through $V$, corner $B$ and the middle of $AC$.", PYR_PLANES[2], 3),
      planeStep("A level cut doesn't match: the top part comes to a point.", Z, 3),
    ],
  }),
]

/** Turned round by the student: the arrow comes once it has gone this far. */
const TURN_ROUND = 150

const PART_3: Beat[] = [
  {
    id: "cyl",
    say: "Turn the sheet round this cylinder.",
    enter: S => {
      curvedPlaneBoard(S, CYL, FACING + 16)
      S.sheet!.knobs = ["turn"]
      S.handles = sheetHandles(S)
      goodView(S)
      S.vals.sw = 0
      let last = S.sheet!.phi
      S.tick = S2 => { const p = S2.sheet!.phi; S2.vals.sw = (S2.vals.sw ?? 0) + angGap(p, last); last = p; if ((S2.vals.sw ?? 0) >= TURN_ROUND) S2.got.add("done") }
      look(S)
    },
    done: S => S.got.has("done") && S.drag === null,
    free: true, minPlay: 4,
  },
  {
    id: "cyl-inf",
    say: "Every upright cut through the middle matches. So a cylinder has an infinite number of planes of symmetry.",
    enter: S => { curvedPlaneBoard(S, CYL); S.acts.push({ dur: 14, run: (S2, _e, t) => { S2.sheet!.phi = 20 + 360 * t } }); look(S) },
    cta: "", ctaAfter: 4.2,
  },
  {
    id: "cone",
    say: "A cone has an infinite number too: any upright cut through its tip matches.",
    enter: S => { curvedPlaneBoard(S, CONE); goodView(S); S.acts.push({ dur: 14, run: (S2, _e, t) => { S2.sheet!.phi = 20 + 360 * t } }); look(S) },
    cta: "", ctaAfter: 3.8,
  },
  {
    id: "end",
    say: "In summary, a plane of symmetry cuts a solid into two halves that are mirror images. A cuboid has $3$ and a cube has $9$.",
    enter: S => { planeBoard(S, CUBE, { hidden: true, found: [X, Y, Z, ...diagsOf(2.4, 2.4), ...CUBE_TIPPED] }); S.spin = 10; look(S) },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3]

applyParts(BEATS, [
  ["cut", "Planes of symmetry"],
  ["cube", "Cubes, prisms and pyramids"],
  ["cyl", "Curved solids"],
])
