"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import { boxFor, spread, overlaps, type LabelBox } from "../labels"
import { type Vec, add, sub, mul, dot, lerpV, clamp, ease, sectorPath, arcPath } from "../geometry"
import {
  type Scene, type Layout, type AngleInfo, CHALK, GREEN, YELLOW, BLUE, PINK, NEUTRAL,
  angleList, posOf, dirOf, norm, compassR, compassMax, distToSeg, bisectorEnds,
} from "./scene"

/**
 * Draws the board. Pure: everything comes from the scene. Lines, arcs and
 * the circle are SVG; every number and letter is KaTeX laid over the SVG at
 * the same pixel coordinates.
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h) return null
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v
  const list = angleList(S, L)
  const shown = list.filter(a => S.show === "all" || S.show.has(a.id))
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden>
        <defs>
          <filter id="pl-soft" filterUnits="userSpaceOnUse" x={0} y={0} width={S.w} height={S.h}>
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <Fills S={S} />
        <CircleLayer S={S} L={L} />
        <g opacity={vis("board")}>
          <Bisectors S={S} />
          <SymLine S={S} />
          <SegLayer S={S} />
          <Ticks S={S} vis={vis} />
          <Fold S={S} />
        </g>
        <Arcs S={S} shown={shown} vis={vis} />
        <Points S={S} />
        <DrawLayer S={S} L={L} />
      </svg>
      <Labels S={S} L={L} shown={shown} vis={vis} />
      <BottomLine S={S} L={L} />
    </>
  )
}

type VisFn = (k: keyof Scene["vis"]) => number
const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const seg = (a: Vec, b: Vec, key: string, extra: React.SVGProps<SVGLineElement> = {}) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" {...extra} />
)
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)

// ── the circle and its centre ────────────────────────────────────────────

function CircleLayer({ S, L }: { S: Scene; L: Layout }) {
  if (!S.OD) return null
  const O = S.OD
  const out: React.ReactNode[] = []
  const lit = S.flashGood > 0 && S.touched?.kind === "circle"
  // how big the circle can be: a faint ring to pull the compass out to
  if (S.mode === "compass" && !S.drawn && !S.sweep) {
    const max = compassMax(S, L)
    const reached = S.compass && compassR(S, L) >= max
    out.push(<circle key="ring" cx={O[0]} cy={O[1]} r={max} fill="none" stroke={YELLOW} strokeOpacity={reached ? 0.55 : 0.18} strokeWidth={reached ? 2 : 1.4} strokeDasharray="3 7" />)
  }
  // the compass, while the student drags it out
  if (S.compass) {
    const R = compassR(S, L)
    const a = Math.atan2(S.compass.to[1] - O[1], S.compass.to[0] - O[0])
    const tip = add(O, mul(dirOf(a), R))
    out.push(<circle key="pre" cx={O[0]} cy={O[1]} r={R} fill="none" stroke={CHALK} strokeOpacity={0.28} strokeWidth={1.6} strokeDasharray="5 6" />)
    out.push(seg(O, tip, "arm", { stroke: YELLOW, strokeOpacity: 0.8, strokeWidth: 2 }))
    out.push(<circle key="pen" cx={tip[0]} cy={tip[1]} r={7} fill={YELLOW} filter="url(#pl-soft)" />)
  } else if (S.sweep && !S.drawn) {
    // the pencil goes round once
    const t = ease(clamp((S.time - S.sweep.t0) / 1.0, 0, 1))
    const sw = t * Math.PI * 2
    out.push(<path key="sweep" d={arcPath(O, S.sweep.a0, sw, S.RD, 96)} fill="none" stroke={CHALK} strokeWidth={2.6} strokeLinecap="round" />)
    const tip = add(O, mul(dirOf(S.sweep.a0 + sw), S.RD))
    out.push(seg(O, tip, "arm", { stroke: YELLOW, strokeOpacity: 0.6, strokeWidth: 1.6 }))
    out.push(<circle key="pen" cx={tip[0]} cy={tip[1]} r={6} fill={YELLOW} filter="url(#pl-soft)" />)
  } else if (S.drawn) {
    out.push(<circle key="c" cx={O[0]} cy={O[1]} r={S.RD} fill="rgba(240,238,234,0.025)" stroke={lit ? GREEN : CHALK} strokeOpacity={lit ? flashOp(S) : 1} strokeWidth={2.6} />)
  }
  // the centre: it can fade out while it is "lost", and comes back with a ring
  const ov = S.mode === "place" || S.mode === "compass" ? 1 : S.oVis.v
  if (ov > 0.01) {
    out.push(<circle key="O" cx={O[0]} cy={O[1]} r={S.mode === "place" ? 6 : 4} opacity={ov} fill={S.mode === "place" || S.mode === "compass" ? YELLOW : CHALK} filter={S.mode === "compass" && !S.drawn ? "url(#pl-soft)" : undefined} />)
  }
  if (S.pulseO && ov > 0.01) {
    out.push(
      <circle key="Op" cx={O[0]} cy={O[1]} r={9} fill={GREEN} fillOpacity={0.25} stroke={GREEN} strokeWidth={2} filter="url(#pl-soft)" opacity={ov}>
        <animate attributeName="r" values="7;14;7" dur="1.6s" repeatCount="indefinite" />
      </circle>,
    )
  }
  if (S.oRing !== null) {
    const t = S.time - S.oRing
    for (const k of [0, 0.35]) {
      const u = clamp((t - k) / 1.3, 0, 1)
      if (u > 0 && u < 1) out.push(<circle key={`ring${k}`} cx={O[0]} cy={O[1]} r={8 + u * 46} fill="none" stroke={GREEN} strokeWidth={2.4} strokeOpacity={1 - u} />)
    }
  }
  if (S.mode === "compass" && !S.compass && !S.sweep) {
    out.push(
      <circle key="Oh" cx={O[0]} cy={O[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
        <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
      </circle>,
    )
  }
  return <>{out}</>
}

function Fills({ S }: { S: Scene }) {
  if (!S.OD || !S.fills.length) return null
  return (
    <g>
      {S.fills.map((f, k) => (
        <polygon key={k} points={f.pts.map(n => posOf(S, n).map(v => v.toFixed(1)).join(",")).join(" ")} fill={f.color} fillOpacity={0.13} stroke="none" />
      ))}
    </g>
  )
}

// ── perpendicular bisectors and the line of symmetry ─────────────────────

function Bisectors({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const b of S.bisectors) {
    const e = bisectorEnds(S, b)
    if (!e) continue
    const id = b.a + b.b
    const lit = S.flashGood > 0 && S.touched?.kind === "bis" && S.touched.id === id
    out.push(seg(e.q, e.p, `bis${id}`, { stroke: lit ? GREEN : b.colour, strokeOpacity: lit ? flashOp(S) : 0.95, strokeWidth: 2.4, strokeDasharray: b.dashed ? "8 7" : undefined }))
    if (b.pulse) {
      out.push(
        <line key={`bp${id}`} x1={e.q[0]} y1={e.q[1]} x2={e.p[0]} y2={e.p[1]} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.7;0.1" dur="1.6s" repeatCount="indefinite" />
        </line>,
      )
    }
  }
  return <>{out}</>
}

function SymLine({ S }: { S: Scene }) {
  if (S.symLine === null || !S.OD) return null
  const u = dirOf(S.symLine)
  const a = add(S.OD, mul(u, S.RD * 1.15)), b = add(S.OD, mul(u, -S.RD * 1.15))
  const lit = S.flashGood > 0 && S.touched?.kind === "seg" && S.touched.id === "@sym"
  return seg(a, b, "sym", { stroke: lit ? GREEN : YELLOW, strokeOpacity: lit ? flashOp(S) : 0.9, strokeDasharray: "9 7" })
}

/** The triangle folds over its axis and lands on its mirror image, again and again. */
function Fold({ S }: { S: Scene }) {
  if (S.foldAt === null || !S.fold || !S.OD) return null
  const cyc = (S.time - S.foldAt) % 3.4
  const t = ease(clamp(cyc / 1.5, 0, 1))
  const op = cyc < 2.6 ? 1 : 1 - (cyc - 2.6) / 0.8
  const [p, q] = S.fold.axis.map(n => posOf(S, n))
  const d = sub(q, p), l2 = dot(d, d)
  if (l2 < 9) return null
  const X = posOf(S, S.fold.moving)
  const foot = add(p, mul(d, dot(sub(X, p), d) / l2))
  const X2 = add(foot, mul(sub(X, foot), Math.cos(Math.PI * t)))
  const pts = S.fold.tri.map(n => (n === S.fold!.moving ? X2 : posOf(S, n))).map(v => v.map(x => x.toFixed(1)).join(",")).join(" ")
  return <polygon points={pts} fill={S.fold.colour} fillOpacity={0.28 * op} stroke={S.fold.colour} strokeWidth={2} strokeOpacity={op} strokeLinejoin="round" />
}

// ── lines ────────────────────────────────────────────────────────────────

function SegLayer({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const s of S.segs) {
    if (S.showSegs !== "all" && !S.showSegs.has(s.id)) continue
    const a = posOf(S, s.a), b = posOf(S, s.b)
    const lit = S.flashGood > 0 && S.touched?.kind === "seg" && S.touched.id === s.id
    const col = lit ? GREEN : S.segColour[s.id] ?? CHALK
    out.push(seg(a, b, s.id, {
      stroke: col, strokeOpacity: lit ? flashOp(S) : 1, strokeWidth: S.segColour[s.id] ? 3 : 2.4,
      strokeDasharray: S.segDash.has(s.id) ? "6 6" : undefined,
    }))
    if (S.pulseSegs.has(s.id)) {
      out.push(
        <line key={`p${s.id}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="1.6s" repeatCount="indefinite" />
        </line>,
      )
    }
  }
  return <>{out}</>
}

/** Equal-length marks: one dash (or two) across the middle of each line. */
function Ticks({ S, vis }: { S: Scene; vis: VisFn }) {
  const tv = vis("ticks")
  if (tv < 0.01) return null
  return (
    <g opacity={tv}>
      {S.ticks.map(t => {
        const [id, n] = t.split(":")
        const s = S.segs.find(x => x.id === id)
        if (!s) return null
        const a = posOf(S, s.a), b = posOf(S, s.b)
        const m = lerpV(a, b, 0.5)
        const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
        const along: Vec = [d[0] / l, d[1] / l]
        const nrm: Vec = [-d[1] / l, d[0] / l]
        const count = n === "2" ? 2 : 1
        return (
          <g key={t}>
            {Array.from({ length: count }, (_, k) => {
              const c = add(m, mul(along, (k - (count - 1) / 2) * 6))
              const p1 = add(c, mul(nrm, 8)), p2 = add(c, mul(nrm, -8))
              return <line key={k} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" />
            })}
          </g>
        )
      })}
    </g>
  )
}

// ── angles ───────────────────────────────────────────────────────────────

function colourOf(S: Scene, id: string) {
  return S.fixed[id] ?? BLUE
}

function RightMark({ a, size, color }: { a: AngleInfo; size: number; color: string }) {
  const u = dirOf(a.start), v = dirOf(a.start + a.sweep)
  const p1 = add(a.c, mul(u, size)), p2 = add(add(a.c, mul(u, size)), mul(v, size)), p3 = add(a.c, mul(v, size))
  return <path d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
}

function Wedge({ a, col, pulsing, noSquare }: { a: AngleInfo; col: string; pulsing: boolean; noSquare?: boolean }) {
  // a right angle draws as a square, unless it is the unknown: the square would give it away
  const square = !noSquare && a.value === 90 && Math.abs(Math.abs(a.sweep) - Math.PI / 2) < 0.02
  return (
    <g>
      {square ? (
        <RightMark a={a} size={Math.min(a.r * 0.62, 18)} color={col} />
      ) : (
        <>
          <path d={sectorPath(a.c, a.start, a.sweep, a.r, 48)} style={{ fill: col, fillOpacity: 0.18, transition: "fill 400ms" }} />
          <path d={arcPath(a.c, a.start, a.sweep, a.r, 48)} fill="none" style={{ stroke: col, transition: "stroke 400ms" }} strokeWidth={2.2} strokeLinecap="round" />
        </>
      )}
      {pulsing && (
        <path d={sectorPath(a.c, a.start, a.sweep, a.r + 3, 48)} fill={col} fillOpacity={0.25} stroke={col} strokeWidth={3} filter="url(#pl-soft)">
          <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" />
        </path>
      )}
    </g>
  )
}

function Arcs({ S, shown, vis }: { S: Scene; shown: AngleInfo[]; vis: VisFn }) {
  const av = vis("arcs")
  if (av < 0.01) return null
  return (
    <g opacity={av}>
      {shown.map(a => <Wedge key={a.id} a={{ ...a, r: a.r * ease(av) }} col={colourOf(S, a.id)} pulsing={S.pulse.has(a.id)} noSquare={S.label[a.id] === "?"} />)}
    </g>
  )
}

// ── points ───────────────────────────────────────────────────────────────

function Points({ S }: { S: Scene }) {
  if (!S.OD || !S.drawn) return null
  const out: React.ReactNode[] = []
  for (const n of S.showPts) {
    const p = posOf(S, n)
    const live = S.mode === "slide" && S.movable.includes(n) && !S.locked
    const held = S.drag?.name === n
    const lit = S.flashGood > 0 && S.touched?.kind === "pt" && S.touched.name === n
    const pulsing = S.pulse.has(`pt:${n}`)
    out.push(
      <g key={n}>
        {live && !held && (
          <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
            <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {pulsing && (
          <circle cx={p[0]} cy={p[1]} r={11} fill={BLUE} fillOpacity={0.25} stroke={BLUE} strokeWidth={2} filter="url(#pl-soft)">
            <animate attributeName="r" values="8;15;8" dur="1.6s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={p[0]} cy={p[1]} r={held ? 10 : live ? 7 : 4} fill={lit ? GREEN : live ? YELLOW : CHALK} filter={live ? "url(#pl-soft)" : undefined} />
      </g>,
    )
  }
  return <>{out}</>
}

// ── a stroke being drawn, wrong taps, and the hint finger ────────────────

function DrawLayer({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(seg(f.a, f.b, `f${i}`, { stroke: PINK, strokeOpacity: Math.max(0, f.life) * 0.7 })))
  S.blips.forEach((b, i) => out.push(<circle key={`b${i}`} cx={b.p[0]} cy={b.p[1]} r={6 + (1 - b.life) * 10} fill="none" stroke={PINK} strokeWidth={2} strokeOpacity={Math.max(0, b.life)} />))
  if (S.stroke) out.push(seg(S.stroke.from, S.stroke.to, "s", { stroke: CHALK }))
  const t = S.time - S.beatStart - 1.2
  if (t > 0 && !S.drewOnce && !S.stroke && !S.compass) {
    const g = ghost(S, L)
    if (g?.kind === "tap") {
      out.push(
        <circle key="gt" cx={g.p[0]} cy={g.p[1]} r={14} fill={YELLOW} fillOpacity={0.12} stroke={YELLOW} strokeOpacity={0.55} strokeWidth={1.5}>
          <animate attributeName="r" values="8;20;8" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.15;0.8" dur="1.8s" repeatCount="indefinite" />
        </circle>,
      )
    } else if (g) {
      const cyc = t % 3.6
      const grow = ease(cyc / 1.3)
      const fade = cyc < 1.6 ? 1 : 1 - clamp((cyc - 1.6) / 0.7, 0, 1)
      const p = lerpV(g.a, g.b, grow)
      out.push(
        <g key="ghost" opacity={fade * 0.55}>
          <line x1={g.a[0]} y1={g.a[1]} x2={p[0]} y2={p[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx={p[0]} cy={p[1]} r={13} fill={YELLOW} fillOpacity={0.16} stroke={YELLOW} strokeOpacity={0.6} strokeWidth={1.5} />
        </g>,
      )
    }
  }
  return <>{out}</>
}

/** What the hint finger shows for the beat's task. */
function ghost(S: Scene, L: Layout): { kind: "tap"; p: Vec } | { kind: "drag"; a: Vec; b: Vec } | null {
  const O = S.OD, R = S.RD
  if (S.mode === "place" && !S.O) return { kind: "tap", p: L.centre }
  if (!O) return null
  if (S.mode === "compass" && !S.sweep) return { kind: "drag", a: O, b: add(O, mul(dirOf(-0.5), compassMax(S, L))) }
  if (S.mode === "drawChord") {
    // a chord on the side away from any chord already there
    const n = dirOf(S.chordDiffer ? -0.35 : Math.PI / 2 - 0.2), u: Vec = [-n[1], n[0]]
    const m = add(O, mul(n, R * 0.5)), h = R * 0.8
    return { kind: "drag", a: add(m, mul(u, h)), b: add(m, mul(u, -h)) }
  }
  if (S.mode === "join" && S.joinNeed.length) {
    const nx = S.joinNeed.find(([x, y]) => !S.segs.some(s => s.id === x + y)) ?? S.joinNeed[0]
    return { kind: "drag", a: posOf(S, nx[0]), b: posOf(S, nx[1]) }
  }
  if (S.mode === "drawPerp" && S.chordOf) {
    const A = posOf(S, S.chordOf[0]), B = posOf(S, S.chordOf[1])
    const M = lerpV(A, B, 0.5), d = sub(B, A), l = Math.hypot(d[0], d[1]) || 1
    const n: Vec = [-d[1] / l, d[0] / l]
    return { kind: "drag", a: add(M, mul(n, R * 0.28)), b: add(M, mul(n, -R * 0.28)) }
  }
  return null
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L, shown, vis }: { S: Scene; L: Layout; shown: AngleInfo[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const vv = vis("values")
  // where each number wants to sit; letters claim their spots first and the numbers keep clear of them
  const want = vv > 0.01 ? shown.filter(a => S.label[a.id] !== "").map(a => ({ key: a.id, from: a.c, box: boxFor(S.label[a.id] ?? `${a.value}^\\circ`, a.label, L.labelSize) })) : []
  const taken: LabelBox[] = []

  // letters
  const lv = vis("letters")
  if (lv > 0.01 && S.OD && S.drawn) {
    const placed: Vec[] = []
    for (const n of S.showPts) {
      if (!S.letters.has(n)) continue
      const at = posOf(S, n)
      // two points on the same spot (a chord turned onto another) show one letter
      if (placed.some(q => Math.hypot(q[0] - at[0], q[1] - at[1]) < 6)) continue
      placed.push(at)
      const away = sub(at, S.OD), al = Math.hypot(away[0], away[1])
      let off: Vec
      if (S.at[n]) {
        // a point inside the circle: its letter sits off to one side, clear of
        // the chord through it and the line from it to the centre
        const base = al > 4 ? Math.atan2(away[1], away[0]) : -Math.PI / 4
        off = mul(dirOf(base + Math.PI / 4), 21)
      } else off = mul(away, 19 / (al || 1))
      taken.push(boxFor(n, add(at, off), L.labelSize + 1))
      out.push(
        <div key={`L${n}`} className={styles.label} style={{ ...place(add(at, off)), color: CHALK, fontSize: L.labelSize + 1, opacity: lv }}>
          <Tex tex={n} />
        </div>,
      )
    }
    if (S.letters.has("O") && S.oVis.v > 0.01) {
      const oAt = add(S.OD, centreLetterOffset(S, shown, want.map(w => w.box), L.labelSize + 1))
      taken.push(boxFor("O", oAt, L.labelSize + 1))
      out.push(
        <div key="LO" className={styles.label} style={{ ...place(oAt), color: CHALK, fontSize: L.labelSize + 1, opacity: lv * S.oVis.v }}>
          <Tex tex="O" />
        </div>,
      )
    }
  }
  // the numbers, each on its own spot or nudged clear of the letters and of each other
  const spot = spread(want, taken)
  if (vv > 0.01) {
    for (const a of shown) {
      const ov = S.label[a.id]
      if (ov === "") continue
      out.push(
        <div key={`v${a.id}`} className={`${styles.label} ${S.pulse.has(a.id) && ov === "?" ? styles.pulse : ""}`}
          style={{ ...place(spot[a.id] ?? a.label), color: colourOf(S, a.id), fontSize: L.labelSize, opacity: vv, transition: "color 400ms" }}>
          <Tex tex={ov ?? `${a.value}^\\circ`} />
        </div>,
      )
    }
  }
  // lengths written along lines: a chord's on the side away from the centre
  for (const s of S.segs) {
    const fn = S.segText[s.id]
    if (!fn || (S.showSegs !== "all" && !S.showSegs.has(s.id)) || !S.OD) continue
    const t = fn(S)
    if (!t) continue
    const a = posOf(S, s.a), b = posOf(S, s.b), d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
    let n: Vec = [-d[1] / l, d[0] / l]
    const m = lerpV(a, b, S.segTextAt[s.id] ?? 0.5)
    const fromO = s.a === "O" || s.b === "O"
    // a chord's length sits outside it, or on the centre's side when asked
    const inward = S.segTextIn.has(s.id)
    const side = dot(n, sub(S.OD, m))
    // a diameter has no outside: its length sits above it, never flipping
    if (!fromO && Math.abs(side) < 3) { if (n[1] > 0) n = mul(n, -1) }
    else if (!fromO && (side > 0) !== inward) n = mul(n, -1)
    if (fromO && n[1] > 0.2) n = mul(n, -1)
    let p = add(m, mul(n, fromO ? 22 : 20))
    if (fromO && l < 50) {
      // a short line from the centre: its length goes just past its far end, clear of the letter O
      const far = s.a === "O" ? b : a
      const u = sub(far, S.OD), ul = Math.hypot(u[0], u[1])
      p = add(far, ul > 1 ? mul(u, 24 / ul) : [0, 24])
    }
    out.push(
      <div key={`sl${s.id}`} className={styles.label} style={{ ...place(p), color: S.segTextColour[s.id] ?? NEUTRAL, fontSize: L.labelSize - 1, opacity: vis("board") }}>
        <Tex tex={t} />
      </div>,
    )
  }
  return <>{out}</>
}

/**
 * Where the letter O sits: below the centre if that is clear, otherwise
 * the nearest clear spot round it. It stays where it is while that spot
 * stays clear, so it never hops from side to side as a line turns.
 */
const O_PREFS = [90, 112.5, 67.5, 135, 45, 157.5, 22.5, 180, 0, 202.5, 337.5, 225, 315, 247.5, 292.5, 270].map(d => (d * Math.PI) / 180)
function centreLetterOffset(S: Scene, shown: AngleInfo[], avoid: LabelBox[] = [], size = 20): Vec {
  const O = posOf(S, "O")
  const D = 20
  const segs = S.segs.filter(s => S.showSegs === "all" || S.showSegs.has(s.id)).map(s => [posOf(S, s.a), posOf(S, s.b)] as const)
  for (const b of S.bisectors) { const e = bisectorEnds(S, b); if (e) segs.push([e.q, e.p] as const) }
  if (S.symLine !== null) segs.push([add(O, mul(dirOf(S.symLine), S.RD)), add(O, mul(dirOf(S.symLine), -S.RD))] as const)
  const atO = shown.filter(a => Math.hypot(a.c[0] - O[0], a.c[1] - O[1]) < 1)
  const clearOfLines = (th: number) => {
    const q = add(O, mul(dirOf(th), D))
    return segs.every(([a, b]) => distToSeg(q, a, b) >= 10)
  }
  const outsideWedges = (th: number) => atO.every(w => {
    const rel = w.sweep >= 0 ? norm(th - w.start) : norm(w.start - th)
    return rel > Math.abs(w.sweep) + 0.15
  })
  // and off the numbers: an O on top of an angle's value hides it
  const clearOfLabels = (th: number) => { const b = boxFor("O", add(O, mul(dirOf(th), D)), size); return avoid.every(a => !overlaps(a, b)) }
  const ok = (th: number) => clearOfLines(th) && outsideWedges(th) && clearOfLabels(th)
  if (S.oDir !== null && ok(S.oDir)) return mul(dirOf(S.oDir), D)
  const pick = O_PREFS.find(ok) ?? (S.oDir !== null && clearOfLines(S.oDir) ? S.oDir : O_PREFS.find(clearOfLines)) ?? O_PREFS[0]
  S.oDir = pick
  return mul(dirOf(pick), D)
}

// ── the line near the bottom ─────────────────────────────────────────────

function AnswerBox({ S }: { S: Scene }) {
  const inp = S.input!
  const cls = [styles.box, inp.state === "wrong" ? styles.boxWrong : "", inp.state === "right" ? styles.boxRight : "", inp.state === "guessed" ? styles.boxGuessed : ""].join(" ")
  return (
    <span className={cls}>
      {inp.value
        ? <Tex tex={`\\textcolor{${inp.state === "right" ? GREEN : "#f0eeea"}}{${inp.value}${inp.deg ? "^\\circ" : ""}}`} />
        : <span className={styles.boxCaret} />}
    </span>
  )
}

function BottomLine({ S, L }: { S: Scene; L: Layout }) {
  const lv = S.vis.line.v
  const inp = S.input
  const hint = inp && inp.hints.length && inp.tries > 0 ? inp.hints[Math.min(inp.hints.length - 1, inp.tries - 1)] : null
  const style: React.CSSProperties = { top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, opacity: lv, ["--line-size" as string]: `${L.lineSize}px` }
  const tex = S.lineFn ? S.lineFn(S) : S.lineTex
  if (S.walkTex !== null) {
    if (!S.walkTex) return null
    return (
      <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={style}><Tex tex={S.walkTex} /></div>
    )
  }
  return (
    <>
      {lv > 0.01 && inp && (
        <div className={styles.line} style={style}>
          {inp.parts.map((p, k) => (typeof p === "string" ? <Tex key={k} tex={p} /> : <AnswerBox key={`${k}-${inp.wrongAt}`} S={S} />))}
        </div>
      )}
      {lv > 0.01 && !inp && S.chips.length > 0 && (
        <div className={styles.line} style={{ ...style, gap: "0.6em" }}>
          {S.chips.map((c, k) => (
            <span key={k} className={`${styles.chip} ${c.test(S) ? styles.chipLit : ""}`}><Tex tex={c.tex} /></span>
          ))}
        </div>
      )}
      {lv > 0.01 && !inp && !S.chips.length && tex && (
        <div className={styles.line} style={style}><Tex tex={tex} /></div>
      )}
      {hint && S.vis.hint.v > 0.01 && (
        <div className={styles.line} style={{ top: L.hintY - 16, height: 32, opacity: S.vis.hint.v, color: "#c8c6be", ["--line-size" as string]: `${Math.round(L.lineSize * 0.72)}px` }}>
          <Tex tex={hint} />
        </div>
      )}
    </>
  )
}
