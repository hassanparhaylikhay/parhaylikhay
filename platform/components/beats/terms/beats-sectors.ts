/**
 * Arcs and sectors (5.3, lesson 2 of 2), one tiny idea per beat, on the
 * terms board.
 *
 * A sector is a slice between two radii; the student turns one radius and
 * watches the fraction of the circle (θ out of 360, on a bar under it). The
 * arc is that fraction of the circumference and the sector that fraction of
 * the area; the rest is the major sector. Then three questions: the band
 * between two 60° sectors (its perimeter aπ + b, and its area, big take
 * away small), a sector from its arc (the whole circumference first, then
 * the radius), and a major sector whose angle comes from another sector's
 * arc. Questions from 4024/13/M/J/25 Q20, 4024/11/O/N/24 Q15 and
 * 4024/12/M/J/25 Q23.
 *
 * Colours: the angle orange, the arc green, the sector blue, the major
 * sector orange, an unknown pink, what can be dragged yellow.
 */

import type { Vec } from "../geometry"
import { applyParts } from "../chapter"
import { atom, row, op, frac } from "../equation"
import { type Scene, BLUE, ORANGE, GREEN, PINK, CHALK, place, RAD, DEG } from "./scene"
import { type Beat, look, watch, c, board, ask, glide, glowOn, pulseLabs, pulseShades, putLab } from "./kit"

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
/** θ/360, and its simplest form when it is simpler. */
function fracTex(th: number): string {
  const t = Math.round(th), g = gcd(t, 360)
  const f = `\\dfrac{${t}}{360}`
  return g > 1 && t > 0 ? `${f} = \\dfrac{${t / g}}{${360 / g}}` : f
}
const at = (r: number, deg: number, o: Vec = [0, 0]): Vec => [o[0] + r * Math.cos(deg * RAD), o[1] + r * Math.sin(deg * RAD)]
const TH = "\\theta"

// ── the turning sector ───────────────────────────────────────────────────

const SR = 3
const SNAPS = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330]
/**
 * A circle of radius 3 with a sector from 0° anticlockwise to θ (radius OB
 * can be turned), its angle marked, and a bar under it filled to θ/360.
 */
function sectorBoard(S: Scene, th: number, o: { drag?: boolean; arc?: boolean; major?: boolean; bar?: boolean; quarters?: boolean; label?: boolean } = {}) {
  board(S, [-SR - 1.6, o.bar === false ? -SR - 1 : -SR - 3.4, SR + 1.6, SR + 1])
  place(S, { O: [0, 0], A: [SR, 0], B: at(SR, th), BL: [-SR, -SR - 1.4], BR: [SR, -SR - 1.4], BR2: [SR, -SR - 1.0], BL2: [-SR, -SR - 1.0], F1: [-SR, -SR - 1.4], F2: [-SR, -SR - 1.0] })
  S.circle = { c: "O", r: SR }
  if (o.quarters) for (const a of [90, 180, 270]) { place(S, { [`Q${a}`]: at(SR, a) }); S.segs.push({ id: `q${a}`, a: "O", b: `Q${a}`, col: CHALK, dash: true, w: 1.2 }) }
  if (o.drag) S.handles = [{ id: "B", kind: "turn", pivot: "O", pts: ["B"], grab: "B", snaps: SNAPS }]
  S.tick = S2 => {
    const B = S2.pts.B.D
    let t = ((Math.atan2(B[1], B[0]) * DEG) % 360 + 360) % 360
    if (t < 0.5) t = 360
    S2.vals.th = Math.round(t)
    S2.shades = [{ id: "sec", kind: "ring", c: "O", r1: 0, r2: SR, a1: 0, a2: t, col: BLUE, op: 0.24 }]
    // the major sector: a faint fill and an orange edge (a stronger orange fill goes brown on the dark board)
    if (o.major) S2.shades.push({ id: "maj", kind: "ring", c: "O", r1: 0, r2: SR, a1: t, a2: 360, col: ORANGE, op: 0.035 })
    S2.arcs = [{ id: "ang", c: "O", r: 0.6, a1: 0, a2: t, col: ORANGE, w: 2.2 }]
    if (o.arc) S2.arcs.push({ id: "arc", c: "O", r: SR, a1: 0, a2: t, col: GREEN, w: 4.5 })
    if (o.major) S2.arcs.push({ id: "mang", c: "O", r: 0.9, a1: t, a2: 360, col: ORANGE, w: 2, dash: true }, { id: "marc", c: "O", r: SR, a1: t, a2: 360, col: ORANGE, w: 3.4 })
    S2.segs = [...S2.segs.filter(g => !["oa", "ob", "bar", "barf"].includes(g.id)), { id: "oa", a: "O", b: "A", col: CHALK }, { id: "ob", a: "O", b: "B", col: CHALK }]
    const labs = S2.freeLabs.filter(f => !["th", "maj", "bar"].includes(f.key))
    labs.push({ key: "th", at: at(1.05, t / 2), tex: `${Math.round(t)}^\\circ`, col: ORANGE })
    if (o.major) labs.push({ key: "maj", at: at(1.35, t + (360 - t) / 2), tex: `${360 - Math.round(t)}^\\circ`, col: ORANGE })
    // the bar: the whole circle along it, the sector's share filled
    if (o.bar !== false) {
      const x = -SR + (2 * SR * t) / 360
      S2.pts.F1.p = S2.pts.F1.D = [x, -SR - 1.4]
      S2.pts.F2.p = S2.pts.F2.D = [x, -SR - 1.0]
      S2.polys = [{ id: "bar", pts: ["BL", "BR", "BR2", "BL2"], col: CHALK, fill: CHALK, fillOp: 0.03 }, { id: "barf", pts: ["BL", "F1", "F2", "BL2"], col: BLUE, fill: BLUE, fillOp: 0.35 }]
      if (o.label !== false) labs.push({ key: "bar", at: [0, -SR - 1.4], tex: fracTex(t), col: CHALK, size: 22, dy: 36 })
    }
    S2.freeLabs = labs
  }
}

// ── 4024/13/M/J/25 Q20: two 60° sectors, radii 6 and 9 ────────────────────

const Q20 = { a1: 110, a2: 170 }
function q20Board(S: Scene, o: { lit?: "ab" | "cd" | "ac" | "big" | "small"; ac?: boolean; ab?: boolean; cd?: boolean } = {}) {
  board(S, [-10.4, -1.6, 2.4, 10])
  place(S, { O: [0, 0], A: at(6, Q20.a2), B: at(6, Q20.a1), C: at(9, Q20.a2), D: at(9, Q20.a1) })
  S.names = { O: "O", A: "A", B: "B", C: "C", D: "D" }
  S.nameFrom = { A: [0, 0], B: [0, 0], C: [0, 0], D: [0, 0], O: at(3, 140) }
  S.shades = [{ id: "band", kind: "ring", c: "O", r1: 6, r2: 9, a1: Q20.a1, a2: Q20.a2, col: CHALK, op: 0.14 }]
  if (o.lit === "big") S.shades.push({ id: "big", kind: "ring", c: "O", r1: 0, r2: 9, a1: Q20.a1, a2: Q20.a2, col: BLUE, op: 0.22, pulse: true })
  if (o.lit === "small") S.shades.push({ id: "small", kind: "ring", c: "O", r1: 0, r2: 6, a1: Q20.a1, a2: Q20.a2, col: PINK, op: 0.08, pulse: true })
  S.segs = [{ id: "oc", a: "O", b: "C", col: CHALK }, { id: "od", a: "O", b: "D", col: CHALK }]
  if (o.lit === "ac") S.segs.push({ id: "ac", a: "A", b: "C", col: BLUE, w: 4, glow: true }, { id: "bd", a: "B", b: "D", col: BLUE, w: 4, glow: true })
  S.arcs = [
    { id: "ab", c: "O", r: 6, a1: Q20.a1, a2: Q20.a2, col: o.lit === "ab" ? GREEN : CHALK, w: o.lit === "ab" ? 4.5 : 2.4, glow: o.lit === "ab" },
    { id: "cd", c: "O", r: 9, a1: Q20.a1, a2: Q20.a2, col: o.lit === "cd" ? GREEN : CHALK, w: o.lit === "cd" ? 4.5 : 2.4, glow: o.lit === "cd" },
    { id: "ang", c: "O", r: 1.4, a1: Q20.a1, a2: Q20.a2, col: ORANGE, w: 2 },
  ]
  S.freeLabs = [
    { key: "ang", at: at(2.1, 140), tex: "60^\\circ", col: ORANGE },
    { key: "ob", at: at(3, Q20.a1), tex: "6", col: CHALK, dx: 14, dy: 4 },
    { key: "oc", at: at(4.5, Q20.a2), tex: "9", col: CHALK, dy: 18 },
  ]
  if (o.ac) S.freeLabs.push({ key: "ac", at: at(7.5, Q20.a2), tex: "3", col: BLUE, dy: 18 })
  // the arcs the student has found, written on them
  if (o.ab) S.freeLabs.push(Q20_AB)
  if (o.cd) S.freeLabs.push(Q20_CD)
}
const Q20_AB = { key: "abl", at: at(6, 140), tex: "2\\pi", col: GREEN, dx: 18, dy: 12 }
const Q20_CD = { key: "cdl", at: at(9, 140), tex: "3\\pi", col: GREEN, dx: -22, dy: -14 }
/** The whole circle an arc is part of, dashed: the rest of the way round. */
/** The whole circle the arc is part of, dashed; the view grows to hold it and everything already there (D sat on the phrase). */
const wholeRound = (S: Scene, rad: number) => { S.arcs = [...S.arcs.filter(a => a.id !== "whole"), { id: "whole", c: "O", r: rad, a1: Q20.a2, a2: Q20.a1 + 360, col: GREEN, w: 2, dash: true }]; const f = S.frame; S.frame = { x0: Math.min(f.x0, -rad - 1.4), y0: Math.min(f.y0, -rad - 1.4), x1: Math.max(f.x1, rad + 1.4), y1: Math.max(f.y1, rad + 1.4) } }
/** A straight line from O to a point, lit. */
const radius = (S: Scene, id: string, to: string, col = PINK) => { S.segs = [...S.segs.filter(g => g.id !== id), { id, a: "O", b: to, col, w: 3.4, glow: true }] }

// ── 4024/11/O/N/24 Q15: a 60° sector with an arc of 4π ─────────────────────

function w24Board(S: Scene, o: { r?: string; whole?: boolean | string } = {}) {
  board(S, [-5.6, -5.4, 5.6, 5.6])
  place(S, { O: [0, 0], A: at(4, 60), B: at(4, 120) })
  S.shades = [{ id: "sec", kind: "ring", c: "O", r1: 0, r2: 4, a1: 60, a2: 120, col: BLUE, op: 0.24 }]
  S.segs = [{ id: "oa", a: "O", b: "A", col: o.r ? PINK : CHALK, w: o.r ? 3 : 2.4 }, { id: "ob", a: "O", b: "B", col: CHALK }]
  S.arcs = [{ id: "arc", c: "O", r: 4, a1: 60, a2: 120, col: GREEN, w: 4.5 }, { id: "ang", c: "O", r: 0.9, a1: 60, a2: 120, col: ORANGE, w: 2 }]
  if (o.whole) S.arcs.push({ id: "rest", c: "O", r: 4, a1: 120, a2: 420, col: GREEN, w: 2, dash: true })
  S.freeLabs = [{ key: "arc", at: at(4, 90), tex: "4\\pi\\text{ cm}", col: GREEN, dy: -18 }, { key: "ang", at: at(1.5, 90), tex: "60^\\circ", col: ORANGE }]
  if (o.r) S.freeLabs.push({ key: "r", at: at(2, 60), tex: o.r, col: o.r === "r" ? PINK : GREEN, dx: 16 })
  if (typeof o.whole === "string") S.freeLabs.push({ key: "C", at: at(4, 270), tex: o.whole, col: GREEN, dy: 18 })
}

// ── 4024/12/M/J/25 Q23: minor sector OAB (radius 9), major sector OCD (radius 6) ──

const Q23 = { b: -45, a: 55 }
function q23Board(S: Scene, o: { lit?: "ab" | "major" | "minor"; ang?: string; major?: string; full?: boolean | string } = {}) {
  board(S, o.full ? [-10.6, -10.4, 11.2, 10.4] : [-7.6, -8.4, 11, 9.2])
  place(S, { O: [0, 0], A: at(9, Q23.a), B: at(9, Q23.b), C: at(6, Q23.a), D: at(6, Q23.b) })
  S.names = { O: "O", A: "A", B: "B", C: "C", D: "D" }
  S.nameFrom = { A: [0, 0], B: [0, 0], C: at(8, 5), D: at(8, 5), O: [0, 3] }
  S.shades = [
    { id: "min", kind: "ring", c: "O", r1: 0, r2: 9, a1: Q23.b, a2: Q23.a, col: BLUE, op: o.lit === "minor" ? 0.26 : 0.1, pulse: o.lit === "minor" },
    { id: "maj", kind: "ring", c: "O", r1: 0, r2: 6, a1: Q23.a, a2: Q23.b + 360, col: ORANGE, op: o.lit === "major" ? 0.04 : 0.025 },
  ]
  S.segs = [{ id: "oa", a: "O", b: "A", col: CHALK }, { id: "ob", a: "O", b: "B", col: CHALK }]
  S.arcs = [
    { id: "ab", c: "O", r: 9, a1: Q23.b, a2: Q23.a, col: o.lit === "ab" ? GREEN : CHALK, w: o.lit === "ab" ? 4.5 : 2.4, glow: o.lit === "ab" },
    { id: "cd", c: "O", r: 6, a1: Q23.a, a2: Q23.b + 360, col: o.lit === "major" ? ORANGE : CHALK, w: o.lit === "major" ? 4 : 2.4, glow: o.lit === "major" },
  ]
  S.freeLabs = [
    { key: "oc", at: at(3, Q23.a), tex: "6", col: CHALK, dx: -14, dy: -6 },
    // OA's 9 on the side away from C's letter
    { key: "oa", at: at(7.5, Q23.a), tex: "9", col: CHALK, dx: 16, dy: 8 },
    { key: "ab", at: at(9, 5), tex: "5\\pi", col: GREEN, dx: 26 },
  ]
  if (o.ang) { S.arcs.push({ id: "ang", c: "O", r: 1.3, a1: Q23.b, a2: Q23.a, col: ORANGE, w: 2 }); S.freeLabs.push({ key: "ang", at: at(2.2, 5), tex: o.ang, col: ORANGE }) }
  if (o.major) { S.arcs.push({ id: "mang", c: "O", r: 1.1, a1: Q23.a, a2: Q23.b + 360, col: ORANGE, w: 2, dash: true }); S.freeLabs.push({ key: "mang", at: at(2.5, 200), tex: o.major, col: ORANGE }) }
  // the rest of the radius-9 circle, dashed: arc AB is part of all the way round
  if (o.full) S.arcs.push({ id: "full", c: "O", r: 9, a1: Q23.a, a2: Q23.b + 360, col: GREEN, w: 2, dash: true })
  if (typeof o.full === "string") S.freeLabs.push({ key: "full", at: at(9, 200), tex: o.full, col: GREEN, dx: -30 })
}

const thFrac = (id = "f") => frac(id, atom(`${id}t`, TH, { col: ORANGE }), atom(`${id}n`, "360"))

// ── the lesson ───────────────────────────────────────────────────────────

const PART_1: Beat[] = [
  watch("sector", "A *sector* is a slice of a circle between two radii.", S => { sectorBoard(S, 60, { bar: false }); look(S) }, 2.4),
  {
    id: "turn",
    say: "Turn the radius round. Watch what fraction of the circle it takes.",
    enter: S => { sectorBoard(S, 60, { drag: true }); look(S) },
    done: S => S.moved > 40, free: true, minPlay: 5,
  },
  {
    id: "quarter",
    say: "At $90^\\circ$ it's $\\tfrac{90}{360}$ of the circle, which is a quarter.",
    enter: S => { sectorBoard(S, 60, { quarters: true }); glide(S, 1.2, e => ({ B: at(SR, 60 + 30 * e) }), 0.5); look(S) },
    cta: "", ctaAfter: 2.8,
  },
  watch("angle-frac", "A sector with angle $\\theta$ is $\\tfrac{\\theta}{360}$ of the circle.", S => {
    sectorBoard(S, 60)
    S.eqFn = () => row([atom("s", "\\text{Sector}"), op("e", "="), thFrac(), op("x", "\\times"), atom("w", "\\text{circle}")])
    look(S, ["eq"])
  }, 2.8),
]

const PART_2: Beat[] = [
  watch("arc", "Its curved edge is an *arc*.", S => { sectorBoard(S, 60, { arc: true }); look(S) }, 2.2),
  watch("arc-formula", "The arc is $\\tfrac{\\theta}{360}$ of the circumference.", S => {
    sectorBoard(S, 60, { arc: true })
    S.eqFn = () => row([atom("a", "\\text{Arc}", { col: GREEN }), op("e", "="), thFrac(), op("x", "\\times"), atom("c", "2\\pi r")])
    look(S, ["eq"])
  }, 2.8),
  watch("area-formula", "The sector's area is $\\tfrac{\\theta}{360}$ of the circle's area.", S => {
    sectorBoard(S, 60)
    S.eqFn = () => row([atom("a", "\\text{Area}", { col: BLUE }), op("e", "="), thFrac(), op("x", "\\times"), atom("c", "\\pi r^2")])
    look(S, ["eq"])
  }, 2.8),
  watch("major", "The rest of the circle is the *major sector*. Its angle is $360^\\circ - \\theta$.", S => { sectorBoard(S, 60, { major: true, label: false }); look(S) }, 3),
]

const PART_3: Beat[] = [
  // 4024/13/M/J/25 Q20
  watch("q20", "$OAB$ and $OCD$ are sectors with angle $60^\\circ$. $OB = 6$ cm and $OC = 9$ cm.", S => { q20Board(S); look(S) }, 3),
  ask("q20-ab", "Find the length of arc $AB$, in terms of $\\pi$.", S => q20Board(S, { lit: "ab" }), {
    lead: "AB", leadCol: GREEN, unit: "cm", answer: 2 * Math.PI, shown: "2\\pi", typed: "2p", piForm: true,
    slips: [
      { v: 12 * Math.PI, say: "That's the whole circumference. Take $\\tfrac{60}{360}$ of it." },
      { v: 3 * Math.PI, say: "That's arc $CD$, on the big circle. $AB$ has radius $6$." },
      { v: 6 * Math.PI, say: "That's $\\tfrac{60}{360} \\times \\pi r^2$, an area. An arc is $\\tfrac{60}{360} \\times 2\\pi r$." },
    ],
    walk: [
      { say: "Arc $AB$ is on the circle with radius $OB = 6$.", show: S => { radius(S, "rb", "B"); pulseLabs(S, "ob") } },
      { say: "All the way round that circle is $2\\pi \\times 6 = 12\\pi$. The $60^\\circ$ arc is $\\tfrac{60}{360} = \\tfrac{1}{6}$ of it.", tex: "\\tfrac{1}{6} \\times 12\\pi", show: S => { S.segs = S.segs.filter(g => g.id !== "rb"); wholeRound(S, 6); pulseLabs(S, "ang") } },
    ],
    then: S => putLab(S, Q20_AB),
  }),
  ask("q20-cd", "Now find arc $CD$.", S => q20Board(S, { lit: "cd", ab: true }), {
    lead: "CD", leadCol: GREEN, unit: "cm", answer: 3 * Math.PI, shown: "3\\pi", typed: "3p", piForm: true,
    slips: [{ v: 18 * Math.PI, say: "That's the whole circumference. Take $\\tfrac{60}{360}$ of it." }, { v: 2 * Math.PI, say: "That's arc $AB$. $CD$ has radius $9$." }],
    walk: [
      { say: "Arc $CD$ is on the circle with radius $OC = 9$.", show: S => { radius(S, "rc", "C"); pulseLabs(S, "oc") } },
      { say: "All the way round is $2\\pi \\times 9 = 18\\pi$. Take $\\tfrac{1}{6}$ of it.", tex: "\\tfrac{1}{6} \\times 18\\pi", show: S => { S.segs = S.segs.filter(g => g.id !== "rc"); wholeRound(S, 9); pulseLabs(S, "ang") } },
    ],
    then: S => putLab(S, Q20_CD),
  }),
  ask("q20-ac", "How long is $AC$?", S => q20Board(S, { lit: "ac", ab: true, cd: true }), {
    lead: "AC", leadCol: BLUE, unit: "cm", answer: 3,
    slips: [{ v: 9, say: "That's $OC$. $AC$ is what is left after $OA$." }, { v: 15, say: "Take $OA$ away from $OC$." }],
    walk: [
      { say: "$OC$ is $9$.", show: S => { radius(S, "rc", "C", CHALK); pulseLabs(S, "oc") } },
      { say: "$OA$ is $6$, the same as $OB$. $AC$ is the part left over.", tex: "9 - 6", show: S => { S.segs = S.segs.filter(g => g.id !== "rc"); radius(S, "ra", "A", CHALK); pulseLabs(S, "ob") } },
    ],
    then: S => putLab(S, { key: "ac", at: at(7.5, Q20.a2), tex: "3", col: BLUE, dy: 18 }),
  }),
  ask("q20-a", "The perimeter is $a\\pi + b$. The two arcs make the $a\\pi$. What is $a$?", S => q20Board(S, { ac: true, ab: true, cd: true }), {
    lead: "a", answer: 5,
    slips: [{ v: 6, say: "That's $2 \\times 3$. Add the arcs: $2\\pi + 3\\pi$." }],
    walk: [{ say: "Add the two arcs: $2\\pi + 3\\pi$. How many lots of $\\pi$ is that?", tex: "2\\pi + 3\\pi", show: S => { S.arcs = S.arcs.map(a => (a.id === "ab" || a.id === "cd" ? { ...a, col: GREEN, w: 4.5, glow: true } : a)); pulseLabs(S, "abl", "cdl") } }],
  }),
  ask("q20-b", "The straight sides make the $b$. What is $b$?", S => { q20Board(S, { ac: true, lit: "ac", ab: true, cd: true }); S.freeLabs.push({ key: "bd", at: at(7.5, Q20.a1), tex: "3", col: BLUE, dx: 16 }) }, {
    lead: "b", answer: 6,
    above: () => row([atom("pa", "a\\pi"), op("pe", "="), atom("p5", "5\\pi", { col: GREEN })]),
    slips: [{ v: 3, say: "There are two straight sides, $AC$ and $BD$." }],
    walk: [{ say: "$AC$ and $BD$ are both $3$. Add them.", tex: "3 + 3", show: S => pulseLabs(S, "ac", "bd") }],
  }),
  watch("q20-take", "The shaded area is the big sector take away the small one.", S => {
    q20Board(S, { lit: "big" })
    // the big sector lights; then the small one is taken out of it, its edge pink, and the band is left
    S.acts.push({ dur: 1.6, end: S2 => {
      S2.shades = [{ id: "band", kind: "ring", c: "O", r1: 6, r2: 9, a1: Q20.a1, a2: Q20.a2, col: BLUE, op: 0.22 }]
      S2.arcs = S2.arcs.map(a => (a.id === "ab" ? { ...a, col: PINK, w: 4, glow: true } : a))
    } })
    look(S)
  }, 3.4),
  ask("q20-area", "Calculate the shaded area, in terms of $\\pi$.", S => q20Board(S), {
    lead: "\\text{Area}", unit: "cm2", answer: 7.5 * Math.PI, shown: "\\tfrac{15}{2}\\pi", typed: "7.5p", piForm: true,
    slips: [
      { v: 13.5 * Math.PI, say: "That's the big sector. Take the small one away." },
      { v: 6 * Math.PI, say: "That's the small sector. Take it away from the big one." },
      { v: 1.5 * Math.PI, say: "Square the radii: $\\pi \\times 9^2$ and $\\pi \\times 6^2$." },
    ],
    walk: [
      { say: "The big sector, radius $9$: $\\tfrac{60}{360} \\times \\pi \\times 9^2$.", tex: "\\tfrac{1}{6} \\times 81\\pi = 13.5\\pi", show: S => { S.shades.push({ id: "big", kind: "ring", c: "O", r1: 0, r2: 9, a1: Q20.a1, a2: Q20.a2, col: BLUE, op: 0.2, pulse: true }); putLab(S, { key: "bigA", at: at(7.6, 140), tex: "13.5\\pi", col: BLUE, pulse: true }) } },
      { say: "The small sector, radius $6$: $\\tfrac{60}{360} \\times \\pi \\times 6^2$.", tex: "\\tfrac{1}{6} \\times 36\\pi = 6\\pi", show: S => { S.shades = S.shades.filter(s => s.id !== "big"); S.shades.push({ id: "small", kind: "ring", c: "O", r1: 0, r2: 6, a1: Q20.a1, a2: Q20.a2, col: PINK, op: 0.08, pulse: true }); pulseLabs(S); putLab(S, { key: "smallA", at: at(4.3, 140), tex: "6\\pi", col: PINK, pulse: true }) } },
      { say: "Take the small one away from the big one. The band is what is left.", tex: "13.5\\pi - 6\\pi", show: S => { S.shades = [{ id: "band", kind: "ring", c: "O", r1: 6, r2: 9, a1: Q20.a1, a2: Q20.a2, col: BLUE, op: 0.24, pulse: true }]; pulseLabs(S, "bigA", "smallA") } },
    ],
  }),
]

const PART_4: Beat[] = [
  // 4024/11/O/N/24 Q15
  watch("w24", "A sector has angle $60^\\circ$ and an arc of $4\\pi$ cm. We want its area.", S => { w24Board(S); look(S) }, 3),
  ask("w24-c", "The arc is $\\tfrac{60}{360} = \\tfrac{1}{6}$ of the circumference. What is the whole circumference?", S => w24Board(S, { whole: true }), {
    lead: "C", leadCol: GREEN, unit: "cm", answer: 24 * Math.PI, shown: "24\\pi", typed: "24p", piForm: true,
    slips: [{ v: (4 * Math.PI) / 6, say: "The arc is one sixth. The whole circle is six times as long." }],
    walk: [
      { say: "This arc is $4\\pi$.", show: S => { glowOn(S, "arc"); pulseLabs(S, "arc") } },
      { say: "Six arcs like it go all the way round.", tex: "6 \\times 4\\pi", show: S => { glowOn(S, "rest"); pulseLabs(S) } },
    ],
    then: S => putLab(S, { key: "C", at: at(4, 270), tex: "24\\pi\\text{ cm}", col: GREEN, dy: 18 }),
  }),
  ask("w24-r", "So $2\\pi r = 24\\pi$. What is $r$?", S => w24Board(S, { r: "r", whole: "24\\pi\\text{ cm}" }), {
    lead: "r", leadCol: PINK, unit: "cm", answer: 12,
    slips: [{ v: 24, say: "That's $2r$. Halve it." }, { v: 48, say: "Divide by $2\\pi$, don't multiply." }],
    walk: [
      { say: "All the way round is $24\\pi$, and that's $2\\pi r$.", tex: `2\\pi ${c(PINK, "r")} = 24\\pi`, show: S => { glowOn(S, "rest", "arc"); pulseLabs(S, "C") } },
      { say: "Move the $2\\pi$ across: it divides. The $\\pi$s cancel, so it's $24 \\div 2$.", tex: `${c(PINK, "r")} = 24\\pi \\div 2\\pi`, show: S => { glowOn(S, "oa"); pulseLabs(S, "r") } },
    ],
  }),
  ask("w24-area", "Now find the area of the sector, in terms of $\\pi$.", S => w24Board(S, { r: "12" }), {
    lead: "\\text{Area}", unit: "cm2", answer: 24 * Math.PI, shown: "24\\pi", typed: "24p", piForm: true,
    slips: [
      { v: 144 * Math.PI, say: "That's the whole circle. Take $\\tfrac{60}{360}$ of it." },
      { v: 4 * Math.PI, say: "That's the arc. The area is $\\tfrac{60}{360} \\times \\pi r^2$." },
    ],
    walk: [
      { say: "The radius is the $12$ you found, and the angle is $60^\\circ$.", tex: "\\tfrac{60}{360} \\times \\pi \\times 12^2", show: S => { glowOn(S, "oa", "ang"); pulseLabs(S, "r", "ang") } },
      { say: "The sector is $\\tfrac{60}{360} = \\tfrac{1}{6}$ of the circle's area, $\\pi \\times 12^2 = 144\\pi$.", tex: "\\tfrac{1}{6} \\times 144\\pi", show: S => { glowOn(S); pulseLabs(S); pulseShades(S, "sec") } },
    ],
  }),
  // 4024/12/M/J/25 Q23
  watch("q23", "$OAB$ is a minor sector with $OA = 9$ cm. $OCD$ is a major sector with $OC = 6$ cm.", S => { q23Board(S); look(S) }, 3.2),
  watch("q23-plan", "Arc $AB$ is $5\\pi$. It tells us the angle at $O$.", S => { q23Board(S, { lit: "ab", ang: "?" }); look(S) }, 2.8),
  ask("q23-full", "What is the whole circumference of the circle with radius $9$?", S => q23Board(S, { lit: "ab", ang: "?", full: true }), {
    lead: "C", leadCol: GREEN, unit: "cm", answer: 18 * Math.PI, shown: "18\\pi", typed: "18p", piForm: true,
    slips: [{ v: 9 * Math.PI, say: "That's $\\pi r$. Circumference is $2\\pi r$." }, { v: 81 * Math.PI, say: "That's the area. Circumference is $2\\pi r$." }],
    walk: [
      { say: "Its radius is $OA = 9$.", show: S => { S.segs = S.segs.map(g => (g.id === "oa" ? { ...g, col: PINK, w: 3.4, glow: true } : g)); pulseLabs(S, "oa") } },
      { say: "All the way round is $2\\pi r$. Keep the $\\pi$ in it.", tex: "2 \\times \\pi \\times 9", show: S => { glowOn(S, "full"); pulseLabs(S) } },
    ],
    then: S => putLab(S, { key: "full", at: at(9, 200), tex: "18\\pi", col: GREEN, dx: -30 }),
  }),
  ask("q23-angle", "Arc $AB$ is $5\\pi$ out of $18\\pi$. What is angle $AOB$?", S => q23Board(S, { lit: "ab", ang: "?", full: "18\\pi" }), {
    lead: "\\angle AOB", leadCol: ORANGE, unit: "deg", answer: 100,
    slips: [{ v: 260, say: "That's the angle the other way round. $AOB$ is the small one." }, { v: 50, say: "It's $\\tfrac{5}{18}$ of the full turn, $360^\\circ$." }],
    walk: [
      { say: "Arc $AB$ is $5\\pi$ out of the whole $18\\pi$: $\\tfrac{5}{18}$ of the way round.", tex: "\\tfrac{5}{18}", show: S => { glowOn(S, "ab", "full"); pulseLabs(S, "ab", "full") } },
      { say: "So the angle at $O$ is $\\tfrac{5}{18}$ of the full turn, $360^\\circ$.", tex: "\\tfrac{5}{18} \\times 360", show: S => { glowOn(S, "ang"); pulseLabs(S, "ang") } },
    ],
  }),
  ask("q23-major", "What is the angle of the major sector $OCD$?", S => q23Board(S, { lit: "major", ang: "100^\\circ", major: "?" }), {
    lead: "\\text{angle}", leadCol: ORANGE, unit: "deg", answer: 260,
    slips: [{ v: 100, say: "That's the minor angle. The major sector is the rest of the turn." }, { v: 80, say: "A full turn is $360^\\circ$, not $180^\\circ$." }],
    walk: [
      { say: "The two angles at $O$ make a full turn, $360^\\circ$.", show: S => { S.arcs = S.arcs.map(a => (a.id === "mang" || a.id === "ang" ? { ...a, glow: true } : a)) } },
      { say: "Take the $100^\\circ$ away from $360^\\circ$.", tex: "360 - 100", show: S => { S.arcs = S.arcs.map(a => ({ ...a, glow: a.id === "ang" })); pulseLabs(S, "ang") } },
    ],
  }),
  ask("q23-area", "Work out the area of the major sector $OCD$, in terms of $\\pi$.", S => q23Board(S, { lit: "major", ang: "100^\\circ", major: "260^\\circ" }), {
    lead: "\\text{Area}", unit: "cm2", answer: 26 * Math.PI, shown: "26\\pi", typed: "26p", piForm: true,
    slips: [
      { v: 36 * Math.PI, say: "That's the whole circle. Take $\\tfrac{260}{360}$ of it." },
      { v: 10 * Math.PI, say: "That's the minor sector. $OCD$ is the major one, $260^\\circ$." },
      { v: 58.5 * Math.PI, say: "That used radius $9$. $OCD$ has radius $6$." },
    ],
    walk: [
      { say: "The major sector's angle is $260^\\circ$ and its radius is $OC = 6$.", tex: "\\tfrac{260}{360} \\times \\pi \\times 6^2", show: S => { S.segs.push({ id: "oc6", a: "O", b: "C", col: ORANGE, w: 3.4, glow: true }); S.arcs = S.arcs.map(a => ({ ...a, glow: a.id === "mang" })); pulseLabs(S, "mang", "oc") } },
      { say: "The whole circle is $\\pi \\times 6^2 = 36\\pi$. Take $\\tfrac{260}{360}$ of it.", tex: "\\tfrac{260}{360} \\times 36\\pi", show: S => { S.segs = S.segs.filter(g => g.id !== "oc6"); glowOn(S); pulseLabs(S); S.shades = S.shades.map(h => (h.id === "maj" ? { ...h, op: 0.08, pulse: true } : h)) } },
    ],
  }),
  {
    id: "end",
    say: "Arc $= \\tfrac{\\theta}{360} \\times 2\\pi r$, and sector area $= \\tfrac{\\theta}{360} \\times \\pi r^2$.",
    enter: S => {
      sectorBoard(S, 60, { arc: true, bar: false })
      S.eqFn = () => row([atom("a", "\\text{Arc}", { col: GREEN }), op("e", "="), thFrac("f1"), op("x", "\\times"), atom("c", "2\\pi r"), op("sp", "\\qquad"), atom("a2", "\\text{Area}", { col: BLUE }), op("e2", "="), thFrac("f2"), op("x2", "\\times"), atom("c2", "\\pi r^2")])
      look(S, ["eq"])
    },
    cta: "Finish", ctaAfter: 3, close: true,
  },
]

export const BEATS: Beat[] = [...PART_1, ...PART_2, ...PART_3, ...PART_4]

applyParts(BEATS, [
  ["sector", "Sectors"],
  ["arc", "Arc length and area"],
  ["q20", "Two sectors"],
  ["w24", "Working backwards"],
])
