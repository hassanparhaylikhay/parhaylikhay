"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type AngleInfo, CHALK, GREEN, YELLOW, BLUE,
  angleList, posOf, angOf, dirOf, norm, compassR, distToSeg,
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
          <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <Tints S={S} vis={vis} />
        <Fills S={S} />
        <CircleLayer S={S} L={L} />
        <g opacity={vis("board")}>
          <SegLayer S={S} />
          <Ticks S={S} vis={vis} />
        </g>
        <Arcs S={S} shown={shown} vis={vis} />
        <Flying S={S} list={list} />
        <Half S={S} L={L} vis={vis} />
        <Points S={S} />
        <DrawLayer S={S} L={L} />
      </svg>
      <Labels S={S} L={L} list={list} shown={shown} vis={vis} />
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

// ── the circle ───────────────────────────────────────────────────────────

function CircleLayer({ S, L }: { S: Scene; L: Layout }) {
  if (!S.OD) return null
  const O = S.OD
  const out: React.ReactNode[] = []
  const lit = S.flashGood > 0 && S.touched?.kind === "circle"
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
    if (S.pulseCircle) {
      out.push(
        <circle key="cp" cx={O[0]} cy={O[1]} r={S.RD} fill="none" stroke={YELLOW} strokeWidth={5} filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.75;0.1" dur="1.8s" repeatCount="indefinite" />
        </circle>,
      )
    }
  }
  // the centre
  out.push(<circle key="O" cx={O[0]} cy={O[1]} r={S.mode === "place" ? 6 : 4} fill={S.mode === "place" || S.mode === "compass" ? YELLOW : CHALK} filter={S.mode === "compass" && !S.drawn ? "url(#pl-soft)" : undefined} />)
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
        <polygon key={k} points={f.pts.map(n => posOf(S, n).map(v => v.toFixed(1)).join(",")).join(" ")} fill={f.color} fillOpacity={0.12} stroke="none" />
      ))}
    </g>
  )
}

/** The two parts of the circle a chord cuts off. */
function Tints({ S, vis }: { S: Scene; vis: VisFn }) {
  const tv = vis("tints")
  if (tv < 0.01 || !S.OD) return null
  return (
    <g opacity={tv}>
      {S.tints.map((t, k) => {
        const g = segmentPath(S, t.a, t.b, t.side)
        if (!g) return null
        // a faint fill, and the part's own stretch of the circle in its colour
        return (
          <g key={k}>
            <path d={g.area} fill={t.color} fillOpacity={t.color === BLUE || t.color === GREEN ? 0.13 : 0.06} stroke="none" />
            <path d={g.edge} fill="none" stroke={t.color} strokeWidth={3.2} strokeOpacity={0.9} strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
}

function segmentPath(S: Scene, A: string, B: string, side: string): { area: string; edge: string } | null {
  if (!S.OD) return null
  const a = angOf(S, A), b = angOf(S, B)
  const len = norm(b - a)
  const fwdMinor = len <= Math.PI
  let fwd: boolean
  if (side === "minor") fwd = fwdMinor
  else if (side === "major") fwd = !fwdMinor
  else fwd = norm(angOf(S, side) - a) < len
  const from = fwd ? a : b, sweep = fwd ? len : Math.PI * 2 - len
  const pts: string[] = []
  for (let k = 0; k <= 64; k++) {
    const t = from + (sweep * k) / 64
    const p = add(S.OD, mul(dirOf(t), S.RD))
    pts.push(`${k ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
  }
  return { area: pts.join(" ") + " Z", edge: pts.join(" ") }
}

// ── lines ────────────────────────────────────────────────────────────────

function SegLayer({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const s of S.segs) {
    if (S.showSegs !== "all" && !S.showSegs.has(s.id)) continue
    const a = posOf(S, s.a), b = posOf(S, s.b)
    const lit = S.flashGood > 0 && S.touched?.kind === "seg" && S.touched.id === s.id
    const col = lit ? GREEN : S.segColour[s.id] ?? CHALK
    out.push(seg(a, b, s.id, { stroke: col, strokeOpacity: lit ? flashOp(S) : 1, strokeWidth: S.segColour[s.id] ? 3 : 2.4 }))
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

/** Equal-length marks: one small dash across the middle of each line. */
function Ticks({ S, vis }: { S: Scene; vis: VisFn }) {
  const tv = vis("ticks")
  if (tv < 0.01) return null
  return (
    <g opacity={tv}>
      {S.ticks.map(id => {
        const s = S.segs.find(x => x.id === id)
        if (!s) return null
        const a = posOf(S, s.a), b = posOf(S, s.b)
        const m = lerpV(a, b, 0.5)
        const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
        const n: Vec = [-d[1] / l, d[0] / l]
        const p1 = add(m, mul(n, 8)), p2 = add(m, mul(n, -8))
        return <line key={id} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" />
      })}
    </g>
  )
}

// ── angles ───────────────────────────────────────────────────────────────

function colourOf(S: Scene, id: string) {
  return S.fixed[id] ?? S.angles.find(a => a.id === id)?.colour?.(S) ?? BLUE
}

function RightMark({ a, size, color }: { a: AngleInfo; size: number; color: string }) {
  const u = dirOf(a.start), v = dirOf(a.start + a.sweep)
  const p1 = add(a.c, mul(u, size)), p2 = add(add(a.c, mul(u, size)), mul(v, size)), p3 = add(a.c, mul(v, size))
  return <path d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
}

function Wedge({ a, col, pulsing }: { a: AngleInfo; col: string; pulsing: boolean }) {
  const square = a.value === 90 && Math.abs(Math.abs(a.sweep) - Math.PI / 2) < 0.02
  return (
    <g>
      {a.outline ? (
        <path d={sectorPath(a.c, a.start, a.sweep, a.r, 48)} fill="none" stroke={col} strokeWidth={1.8} strokeDasharray="5 4" />
      ) : square ? (
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
      {shown.map(a => <Wedge key={a.id} a={{ ...a, r: a.r * ease(av) }} col={colourOf(S, a.id)} pulsing={S.pulse.has(a.id)} />)}
    </g>
  )
}

/** Where a copy of an angle is on its way to the centre. */
export function flyingWedge(S: Scene, list: AngleInfo[], id: string): AngleInfo | null {
  const t0 = S.fly[id]
  const orig = list.find(a => a.id === id)
  if (t0 === undefined || !orig || !S.OD) return null
  const e = ease(clamp((S.time - t0) / 1.0, 0, 1))
  const spec = S.angles.find(x => x.id === id)
  // a base angle turns half a turn on the way; the angle at P only slides
  const rot = spec && spec.at !== "P" ? Math.PI : 0
  const c = lerpV(orig.c, S.OD, e)
  const start = orig.start + rot * e
  const bis = start + orig.sweep / 2
  return { ...orig, id: `${id}~`, c, start, label: add(c, mul(dirOf(bis), Math.max(orig.r + 16, Math.hypot(orig.label[0] - orig.c[0], orig.label[1] - orig.c[1])))) }
}

function Flying({ S, list }: { S: Scene; list: AngleInfo[] }) {
  return (
    <g>
      {Object.keys(S.fly).map(id => {
        const w = flyingWedge(S, list, id)
        return w ? <Wedge key={id} a={w} col={colourOf(S, id)} pulsing={S.pulse.has(`${id}~`)} /> : null
      })}
    </g>
  )
}

/** Half a turn round a point: the straight line, with 180° beside it. */
function halfGeom(S: Scene, L: Layout) {
  const h = S.half
  if (!h) return null
  const c = posOf(S, h.at)
  const ang = (r: string) => { const p = posOf(S, r); return Math.atan2(p[1] - c[1], p[0] - c[0]) }
  const a1 = ang(h.from), av = ang(h.via)
  const s = Math.sign(turn(a1, av)) || 1
  return { c, start: a1, sweep: s * Math.PI, r: L.arcR + 12 }
}

function Half({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const hv = vis("half")
  const g = halfGeom(S, L)
  if (hv < 0.01 || !g) return null
  return (
    <path d={arcPath(g.c, g.start, g.sweep, g.r, 64)} fill="none" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" opacity={hv}>
      <animate attributeName="stroke-opacity" values="0.35;1;0.35" dur="1.4s" repeatCount="indefinite" />
    </path>
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
    out.push(
      <g key={n}>
        {live && !held && (
          <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
            <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {S.pulsePts.has(n) && (
          <circle cx={p[0]} cy={p[1]} r={11} fill={BLUE} fillOpacity={0.25} stroke={BLUE} strokeWidth={2} filter="url(#pl-soft)">
            <animate attributeName="r" values="8;15;8" dur="1.6s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />
          </circle>
        )}
        {S.mode === "tapPts" && !S.pulsePts.has(n) && (
          <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.4}>
            <animate attributeName="r" values="8;20;8" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.55;0;0.55" dur="2.2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={p[0]} cy={p[1]} r={held ? 10 : live ? 7 : S.pulsePts.has(n) ? 5 : 4} fill={lit ? GREEN : live ? YELLOW : S.pulsePts.has(n) ? BLUE : CHALK} filter={live ? "url(#pl-soft)" : undefined} />
      </g>,
    )
  }
  return <>{out}</>
}

// ── a stroke being drawn, and the hint finger ────────────────────────────

function DrawLayer({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(seg(f.a, f.b, `f${i}`, { stroke: "#ff4670", strokeOpacity: Math.max(0, f.life) * 0.7 })))
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
  if (S.mode === "compass" && !S.sweep) return { kind: "drag", a: O, b: add(O, mul(dirOf(-0.5), Math.min(L.Rmax, 150) * 0.8)) }
  if (S.mode === "drawDiam") return { kind: "drag", a: add(O, mul(dirOf(Math.PI - 0.25), R * 0.92)), b: add(O, mul(dirOf(-0.25), R * 0.92)) }
  if (S.mode === "drawChord") {
    const n = dirOf(Math.PI / 2 - 0.2), u: Vec = [-n[1], n[0]]
    const m = add(O, mul(n, R * 0.5)), h = R * 0.8
    return { kind: "drag", a: add(m, mul(u, h)), b: add(m, mul(u, -h)) }
  }
  if (S.mode === "join" && S.joinNeed.length) {
    const nx = S.joinNeed.find(([x, y]) => !S.segs.some(s => s.id === x + y)) ?? S.joinNeed[0]
    return { kind: "drag", a: posOf(S, nx[0]), b: posOf(S, nx[1]) }
  }
  if (S.mode === "drawThrough") {
    const P = posOf(S, "P")
    return { kind: "drag", a: P, b: lerpV(P, O, 1.6) }
  }
  if (S.mode === "tapPoint") {
    // the middle of the widest gap between the points already there
    const as = S.showPts.map(n => norm(angOf(S, n))).sort((p, q) => p - q)
    if (!as.length) return { kind: "tap", p: add(O, mul(dirOf(-Math.PI / 2), R)) }
    let best = as[0], gap = -1
    as.forEach((x, k) => { const nx = k + 1 < as.length ? as[k + 1] : as[0] + Math.PI * 2; if (nx - x > gap) { gap = nx - x; best = x + (nx - x) / 2 } })
    return { kind: "tap", p: add(O, mul(dirOf(best), R)) }
  }
  return null
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L, list, shown, vis }: { S: Scene; L: Layout; list: AngleInfo[]; shown: AngleInfo[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const vv = vis("values")
  const tag = (a: AngleInfo, key: string, ov: string | undefined, col: string, op: number) => {
    if (ov === "") return
    out.push(
      <div key={key} className={`${styles.label} ${S.pulse.has(a.id) && ov === "?" ? styles.pulse : ""}`}
        style={{ ...place(a.label), color: col, fontSize: L.labelSize, opacity: op, transition: "color 400ms" }}>
        <Tex tex={ov ?? `${a.value}^\\circ`} />
      </div>,
    )
  }
  if (vv > 0.01) for (const a of shown) tag(a, `v${a.id}`, S.label[a.id], colourOf(S, a.id), vv)
  for (const id of Object.keys(S.fly)) {
    const w = flyingWedge(S, list, id)
    if (w) tag(w, `fl${id}`, S.label[id], colourOf(S, id), 1)
  }

  // letters
  const lv = vis("letters")
  if (lv > 0.01 && S.OD && S.drawn) {
    for (const n of S.showPts) {
      if (!S.letters.has(n)) continue
      const p = add(S.OD, mul(dirOf(angOf(S, n)), S.RD + 19))
      out.push(
        <div key={`L${n}`} className={styles.label} style={{ ...place(p), color: CHALK, fontSize: L.labelSize + 1, opacity: lv }}>
          <Tex tex={n} />
        </div>,
      )
    }
    if (S.letters.has("O")) {
      out.push(
        <div key="LO" className={styles.label} style={{ ...place(add(S.OD, centreLetterOffset(S, shown))), color: CHALK, fontSize: L.labelSize + 1, opacity: lv }}>
          <Tex tex="O" />
        </div>,
      )
    }
  }
  // a name written along a line (r on the radius)
  for (const s of S.segs) {
    const t = S.label[`seg:${s.id}`]
    if (!t || (S.showSegs !== "all" && !S.showSegs.has(s.id))) continue
    const a = posOf(S, s.a), b = posOf(S, s.b), d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
    const n: Vec = [-d[1] / l, d[0] / l]
    const m = add(lerpV(a, b, 0.5), mul(n, -16))
    out.push(
      <div key={`sl${s.id}`} className={styles.label} style={{ ...place(m), color: YELLOW, fontSize: L.labelSize + 1, opacity: vis("board") }}>
        <Tex tex={t} />
      </div>,
    )
  }
  // 180 on the straight line
  const hv = vis("half")
  const g = halfGeom(S, L)
  if (hv > 0.01 && g) {
    const p = add(g.c, mul(dirOf(g.start + g.sweep / 2), g.r + 46))
    out.push(
      <div key="h180" className={`${styles.label} ${styles.pulse}`} style={{ ...place(p), color: GREEN, fontSize: L.labelSize, opacity: hv }}>
        <Tex tex={"180^\\circ"} />
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
function centreLetterOffset(S: Scene, shown: AngleInfo[]): Vec {
  const O = posOf(S, "O")
  const D = 20
  const segs = S.segs.filter(s => S.showSegs === "all" || S.showSegs.has(s.id)).map(s => [posOf(S, s.a), posOf(S, s.b)] as const)
  const atO = shown.filter(a => Math.hypot(a.c[0] - O[0], a.c[1] - O[1]) < 1)
  const clearOfLines = (th: number) => {
    const q = add(O, mul(dirOf(th), D))
    return segs.every(([a, b]) => distToSeg(q, a, b) >= 10)
  }
  const outsideWedges = (th: number) => atO.every(w => {
    const rel = w.sweep >= 0 ? norm(th - w.start) : norm(w.start - th)
    return rel > Math.abs(w.sweep) + 0.15
  })
  const ok = (th: number) => clearOfLines(th) && outsideWedges(th)
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
