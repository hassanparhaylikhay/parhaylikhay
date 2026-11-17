"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul } from "../geometry"
import {
  type Scene, type Layout, CHALK, GREEN, YELLOW, BLUE, QUIET,
  ptS, toScreen, dirS, arcPts, rayEnd, northPx, norm, brgText, layout, arcSpot,
  rulerGeom, protGeom, lensGeom, inLens, pageRect, protCanTurn, protCue,
} from "./scene"

/**
 * Draws the map. Pure: everything comes from the scene. Lines and marks are
 * SVG; every letter and number is KaTeX laid over it (the word North in the
 * page's own font, as the papers print it).
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h || !S.fitD) return null
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden>
        <defs>
          <filter id="pl-soft" filterUnits="userSpaceOnUse" x={0} y={0} width={S.w} height={S.h}>
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <g opacity={vis("board")}>
          <Page S={S} L={L} />
          <Clock S={S} />
          <g opacity={vis("fig")}>
            <Norths S={S} L={L} />
            <Segs S={S} />
          </g>
          <g opacity={vis("marks")}>
            <Arcs S={S} L={L} />
          </g>
          <g opacity={vis("fig")}>
            <Rays S={S} L={L} />
            <Markers S={S} />
            <Dots S={S} />
          </g>
          <Targets S={S} L={L} />
          <Along S={S} />
          <RulerTool S={S} />
          <ProtTool S={S} L={L} />
          <Lens S={S} L={L} />
        </g>
      </svg>
      <Labels S={S} />
      <Readout S={S} L={L} op={vis("readout")} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px` }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const path = (P: Vec[]) => P.map((p, k) => `${k ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
const breathe = (dur = "1.8s") => <animate attributeName="opacity" values="0.25;1;0.25" dur={dur} repeatCount="indefinite" />
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)

/** An arrowhead at `tip`, pointing along `d` (a unit vector on the screen). */
function head(tip: Vec, d: Vec, size = 9): string {
  const n: Vec = [-d[1], d[0]]
  const b = sub(tip, mul(d, size))
  const l = add(b, mul(n, size * 0.55)), r = sub(b, mul(n, size * 0.55))
  return `M ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} L ${r[0]} ${r[1]} Z`
}

/** A sheet of paper under the drawing: the map is drawn on it. */
function Page({ S, L }: { S: Scene; L: Layout }) {
  const r = pageRect(S, L)
  if (!r) return null
  return <rect x={r.x0} y={r.y0} width={r.x1 - r.x0} height={r.y1 - r.y0} rx={6} fill={CHALK} fillOpacity={0.035} stroke={CHALK} strokeOpacity={0.3} strokeWidth={1.4} opacity={S.vals.pageOp ?? 1} />
}

/** Marks across a line at every step, the lit pieces glowing. */
function Along({ S }: { S: Scene }) {
  const A = S.along
  if (!A || !S.P[A.a] || !S.P[A.b]) return null
  const a = ptS(S, A.a), b = ptS(S, A.b), l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
  const e: Vec = [(b[0] - a[0]) / l, (b[1] - a[1]) / l], n: Vec = [-e[1], e[0]]
  const f = S.fitD ?? S.fit, step = A.step * (f?.u ?? 30)
  // whole pieces only (a 4.5 cm line has four, and a half left over)
  const count = Math.floor(l / step + 0.05)
  const out: React.ReactNode[] = []
  for (let k = 0; k < A.lit && k < count; k++) {
    const p = add(a, mul(e, step * k)), q = add(a, mul(e, step * (k + 1)))
    out.push(<line key={`ag${k}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={BLUE} strokeWidth={5} strokeLinecap="round" strokeOpacity={0.55} />)
  }
  for (let k = 0; k <= count; k++) {
    const p = add(a, mul(e, step * k))
    out.push(<line key={`at${k}`} x1={p[0] - n[0] * 7} y1={p[1] - n[1] * 7} x2={p[0] + n[0] * 7} y2={p[1] + n[1] * 7} stroke={CHALK} strokeWidth={1.8} strokeLinecap="round" />)
  }
  return <g>{out}</g>
}

/** The ruler's ticks along its edge: a long one each cm, a middle one each half, a short one each mm. */
function rulerTicks(S: Scene, key: string, scale = 1): React.ReactNode[] {
  const G = rulerGeom(S), R = S.ruler!
  const out: React.ReactNode[] = []
  for (let i = 0; i <= R.len * 10; i++) {
    const p = add(G.Z, mul(G.e, (i / 10) * G.u))
    const t = i % 10 === 0 ? 14 : i % 5 === 0 ? 10 : 6
    const q = add(p, mul(G.n, t))
    out.push(<line key={`${key}${i}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={CHALK} strokeOpacity={i % 10 === 0 ? 0.95 : 0.7} strokeWidth={(i % 10 === 0 ? 1.4 : 1) / scale} />)
  }
  return out
}

/** The ruler: a see-through strip, its ticks on the measuring edge; its end turns it; a pencil slides along it. */
function RulerTool({ S }: { S: Scene }) {
  const R = S.ruler
  if (!R) return null
  const G = rulerGeom(S)
  const out: React.ReactNode[] = []
  out.push(<polygon key="body" points={G.body.map(p => p.join(",")).join(" ")} fill={CHALK} fillOpacity={0.08} stroke={CHALK} strokeOpacity={0.4} strokeWidth={1.2} strokeLinejoin="round" />)
  out.push(...rulerTicks(S, "t"))
  if (R.pen !== null && G.penAt) {
    out.push(<line key="drawn" x1={G.Z[0]} y1={G.Z[1]} x2={G.penAt[0]} y2={G.penAt[1]} stroke={BLUE} strokeWidth={3} strokeLinecap="round" />)
    out.push(handle(G.penAt, "pen", S.drag?.kind === "rulerPen"))
  }
  if (R.turn) out.push(handle(G.turnAt, "turn", S.drag?.kind === "rulerTurn"))
  return <g>{out}</g>
}

/**
 * The protractor: a see-through half circle with a tick at every degree; its
 * two rings of numbers are labels (the one to read lights up). Its 0 end
 * turns it; a pencil marks a point on its edge.
 */
function ProtTool({ S, L }: { S: Scene; L: Layout }) {
  const P = S.prot
  if (!P) return null
  const G = protGeom(S, L)
  const out: React.ReactNode[] = []
  const rim = arcPts(G.C, P.rot, 180, G.R)
  out.push(<path key="body" d={path(rim) + " Z"} fill={CHALK} fillOpacity={0.07} stroke={CHALK} strokeOpacity={0.45} strokeWidth={1.3} strokeLinejoin="round" />)
  for (let k = 0; k <= 180; k++) {
    const d = dirS(P.rot + k), t = k % 10 === 0 ? 11 : k % 5 === 0 ? 8 : 4
    const a = add(G.C, mul(d, G.R)), b = add(G.C, mul(d, G.R - t))
    out.push(<line key={`pt${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={k % 10 === 0 ? 0.9 : 0.6} strokeWidth={k % 10 === 0 ? 1.3 : 0.9} />)
  }
  // where the line crosses the edge: read the number there
  if (P.spot !== undefined) {
    const glow = arcPts(G.C, P.spot - 5, 10, G.R - 3)
    out.push(<path key="spot" d={path(glow)} fill="none" stroke={YELLOW} strokeWidth={9} strokeLinecap="round" filter="url(#pl-soft)">{breathe()}</path>)
  }
  // the end that goes on North, while it is being turned there (green once it is on)
  if (P.want !== undefined && P.on && protCanTurn(P)) {
    const tip = add(G.C, mul(dirS(P.rot + norm(-P.want)), G.R)), done = P.rot === norm(P.want)
    if (!done) out.push(<line key="endglow" x1={G.C[0]} y1={G.C[1]} x2={tip[0]} y2={tip[1]} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur="1.8s" repeatCount="indefinite" /></line>)
    out.push(<line key="end" x1={G.C[0]} y1={G.C[1]} x2={tip[0]} y2={tip[1]} stroke={done ? GREEN : YELLOW} strokeWidth={2.2} strokeLinecap="round" />)
  }
  // the centre: a small cross where the two ends' line crosses the middle
  out.push(<path key="cross" d={`M ${G.C[0] - 7} ${G.C[1]} L ${G.C[0] + 7} ${G.C[1]} M ${G.C[0]} ${G.C[1] - 7} L ${G.C[0]} ${G.C[1] + 7}`} stroke={P.move && !P.on ? YELLOW : CHALK} strokeWidth={P.move && !P.on ? 2 : 1.4} transform={`rotate(${P.rot} ${G.C[0]} ${G.C[1]})`} />)
  // to be moved: the centre is what the student holds, and a ring waits where it goes
  if (P.move && !P.on) {
    if (S.drag?.kind !== "prot") out.push(<circle key="cring" cx={G.C[0]} cy={G.C[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.9;0;0.9" dur="2s" repeatCount="indefinite" /></circle>)
    if (P.goal && S.P[P.goal]) { const g = ptS(S, P.goal); out.push(<circle key="goal" cx={g[0]} cy={g[1]} r={17} fill="none" stroke={YELLOW} strokeWidth={2.2} strokeDasharray="5 4">{breathe("1.4s")}</circle>) }
  }
  if (P.pen !== null && G.penAt) {
    const m = add(G.C, mul(dirS(P.pen), G.R - 2))
    out.push(<line key="penline" x1={G.C[0]} y1={G.C[1]} x2={m[0]} y2={m[1]} stroke={YELLOW} strokeOpacity={0.35} strokeWidth={1.4} strokeDasharray="3 5" />)
    out.push(handle(G.penAt, "ppen", S.drag?.kind === "protPen"))
  }
  if (protCanTurn(P)) out.push(handle(G.turnAt, "pturn", S.drag?.kind === "protTurn"))
  return <g>{out}</g>
}

/** A yellow handle with its breathing ring (the ring stops while it is held). */
function handle(p: Vec, key: string, held: boolean) {
  return (
    <g key={key}>
      {!held && <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="7;20;7" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
      <circle cx={p[0]} cy={p[1]} r={held ? 9 : 7} fill={YELLOW} filter="url(#pl-soft)" />
    </g>
  )
}

/** The reading lens: the far end of the line and the ruler there, close up. */
function Lens({ S, L }: { S: Scene; L: Layout }) {
  const lens = lensGeom(S, L)
  if (!lens) return null
  const t = `translate(${lens.c[0]} ${lens.c[1]}) scale(${lens.x}) translate(${-lens.at[0]} ${-lens.at[1]})`
  const toEdge = add(lens.c, mul([(lens.end[0] - lens.c[0]), (lens.end[1] - lens.c[1])], lens.r / (Math.hypot(lens.end[0] - lens.c[0], lens.end[1] - lens.c[1]) || 1)))
  const segs = S.segs.filter(sg => S.P[sg.a] && S.P[sg.b]).map(sg => { const A = ptS(S, sg.a), B = ptS(S, sg.b); return <line key={`ls${sg.a}${sg.b}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={sg.col ?? CHALK} strokeWidth={2.4 / lens.x} /> })
  void inLens
  return (
    <g>
      <line x1={lens.end[0]} y1={lens.end[1]} x2={toEdge[0]} y2={toEdge[1]} stroke={CHALK} strokeOpacity={0.35} strokeWidth={1.2} strokeDasharray="3 4" />
      <defs><clipPath id="pl-lens"><circle cx={lens.c[0]} cy={lens.c[1]} r={lens.r} /></clipPath></defs>
      <circle cx={lens.c[0]} cy={lens.c[1]} r={lens.r} fill="#0d1216" />
      <g clipPath="url(#pl-lens)">
        <g transform={t}>
          {segs}
          {rulerTicks(S, "lt", lens.x)}
          <circle cx={lens.end[0]} cy={lens.end[1]} r={4 / lens.x} fill={YELLOW} />
        </g>
      </g>
      <circle cx={lens.c[0]} cy={lens.c[1]} r={lens.r} fill="none" stroke={CHALK} strokeOpacity={0.7} strokeWidth={1.6} />
    </g>
  )
}

/** A faint clock face round a place, its hand going round the way a clock's does. */
function Clock({ S }: { S: Scene }) {
  if (!S.clock || !S.P[S.clock.at]) return null
  const c = ptS(S, S.clock.at)
  const ray = S.rays.find(r => r.at === S.clock!.at)
  const R = ray ? Math.hypot(...sub(rayEnd(S, ray), c) as [number, number]) * 1.12 : 120
  const t = (S.time - S.clock.t0) * 50
  const out: React.ReactNode[] = []
  out.push(<circle key="face" cx={c[0]} cy={c[1]} r={R} fill="none" stroke={QUIET} strokeOpacity={0.45} strokeWidth={1.4} />)
  for (let h = 0; h < 12; h++) {
    const d = dirS(h * 30), a = add(c, mul(d, R * 0.9)), b = add(c, mul(d, R))
    out.push(<line key={`t${h}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={QUIET} strokeOpacity={0.6} strokeWidth={h % 3 ? 1 : 2} />)
  }
  const tip = add(c, mul(dirS(t), R * 0.82))
  out.push(<line key="hand" x1={c[0]} y1={c[1]} x2={tip[0]} y2={tip[1]} stroke={QUIET} strokeOpacity={0.8} strokeWidth={2.2} strokeLinecap="round" />)
  return <g>{out}</g>
}

/** North arrows as the papers print them; the North line carried on down, dashed; parallel marks. */
function Norths({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  // a North arrow can grow up from its place
  const len = northPx(S, L) * (S.vals.northT ?? 1)
  for (const n of S.norths) {
    if (!S.P[n]) continue
    const p = ptS(S, n), tip: Vec = [p[0], p[1] - len]
    const lit = S.northGlow.includes(n) || protCue(S) === n
    if (lit) out.push(<line key={`ng${n}`} x1={p[0]} y1={p[1]} x2={tip[0]} y2={tip[1]} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.05;0.35;0.05" dur="1.8s" repeatCount="indefinite" /></line>)
    out.push(<line key={`n${n}`} x1={p[0]} y1={p[1]} x2={tip[0]} y2={tip[1] + 6} stroke={CHALK} strokeWidth={2.2} strokeLinecap="round" />)
    out.push(<path key={`nh${n}`} d={head(tip, [0, -1], 11)} fill={CHALK} />)
    if (S.parallel) {
      // two small chevrons on each North line: these lines are parallel
      for (const k of [0, 1]) {
        const m: Vec = [p[0], p[1] - len * 0.45 - k * 7]
        out.push(<path key={`pm${n}${k}`} d={`M ${m[0] - 6} ${m[1] + 5} L ${m[0]} ${m[1]} L ${m[0] + 6} ${m[1] + 5}`} fill="none" stroke={CHALK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)
      }
    }
  }
  for (const n of S.souths) {
    if (!S.P[n]) continue
    const p = ptS(S, n)
    out.push(<line key={`s${n}`} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] + len} stroke={CHALK} strokeOpacity={0.6} strokeWidth={1.8} strokeDasharray="5 6" strokeLinecap="round" />)
  }
  return <>{out}</>
}

function Segs({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const s of S.segs) {
    if (!S.P[s.a] || !S.P[s.b] || s.grow.v < 0.005) continue
    const A = ptS(S, s.a), B0 = ptS(S, s.b), B = add(A, mul(sub(B0, A), s.grow.v))
    const lit = S.flashGood > 0 && S.touched === `${s.a}-${s.b}`
    if (s.glow) out.push(<line key={`sg${s.a}${s.b}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={s.col ?? CHALK} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.6;0.1" dur="1.6s" repeatCount="indefinite" /></line>)
    out.push(<line key={`s${s.a}${s.b}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={lit ? GREEN : s.col ?? CHALK} strokeOpacity={lit ? flashOp(S) : 1} strokeWidth={2.4} strokeLinecap="round" strokeDasharray={s.dash ? "6 6" : undefined} />)
  }
  return <>{out}</>
}

/** Angle arcs: a faint wedge and its edge, sampled (so any size, reflex too, draws right). */
function Arcs({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  const wedge = (c: Vec, from: number, sweep: number, r: number) => `M ${c[0]} ${c[1]} ` + arcPts(c, from, sweep, r).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z"
  for (const a of S.arcs) {
    if (!S.P[a.at]) continue
    const g = a.grow ? a.grow.v : 1
    if (g < 0.005) continue
    const c = ptS(S, a.at), r = L.arcPx * (a.r ?? 1), sw = a.sweep * g
    out.push(
      <g key={`a${a.id}`}>
        <path d={wedge(c, a.from, sw, r)} fill={a.col} fillOpacity={0.16} />
        <path d={path(arcPts(c, a.from, sw, r))} fill="none" stroke={a.col} strokeWidth={2.2} strokeLinecap="round" />
        {a.pulse && <path d={wedge(c, a.from, sw, r + 3)} fill={a.col} fillOpacity={0.3} filter="url(#pl-soft)">{breathe("1.4s")}</path>}
      </g>,
    )
  }
  // a turning line's bearing, swept out clockwise from North
  for (const ray of S.rays) {
    if (!ray.arc || !S.P[ray.at]) continue
    const sw = norm(ray.d)
    if (sw < 0.3) continue
    const c = ptS(S, ray.at), r = L.arcPx * 1.15
    out.push(
      <g key={`ra${ray.id}`}>
        <path d={wedge(c, 0, sw, r)} fill={BLUE} fillOpacity={0.16} />
        <path d={path(arcPts(c, 0, sw, r))} fill="none" stroke={BLUE} strokeWidth={2.4} strokeLinecap="round" />
      </g>,
    )
  }
  return <>{out}</>
}

function Rays({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  for (const r of S.rays) {
    if (!S.P[r.at]) continue
    const A = ptS(S, r.at), E = rayEnd(S, r)
    const held = S.drag?.kind === "ray" && S.drag.id === r.id
    out.push(<line key={`r${r.id}`} x1={A[0]} y1={A[1]} x2={E[0]} y2={E[1]} stroke={r.col ?? CHALK} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={r.dash ? "6 6" : undefined} />)
    if (r.handle) {
      out.push(
        <g key={`rh${r.id}`}>
          {!held && <circle cx={E[0]} cy={E[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
          <circle cx={E[0]} cy={E[1]} r={held ? 9.5 : 7.5} fill={YELLOW} filter="url(#pl-soft)" />
        </g>,
      )
    }
  }
  void L
  return <>{out}</>
}

/** Ships and "you": a small arrowhead facing its heading; a curved arrow where one has turned. */
function Markers({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const m of S.markers) {
    const c = toScreen(S, m.at)
    const d = dirS(m.heading), n: Vec = [-d[1], d[0]]
    const s = m.size ?? 13
    const tip = add(c, mul(d, s)), back = sub(c, mul(d, s * 0.7))
    const l = add(back, mul(n, s * 0.62)), r = sub(back, mul(n, s * 0.62)), notch = sub(c, mul(d, s * 0.2))
    out.push(<path key={`m${m.id}`} d={`M ${tip[0]} ${tip[1]} L ${l[0]} ${l[1]} L ${notch[0]} ${notch[1]} L ${r[0]} ${r[1]} Z`}
      fill={m.ghost ? "none" : m.col ?? CHALK} fillOpacity={m.op ?? 1} stroke={m.col ?? CHALK} strokeOpacity={m.op ?? 1} strokeWidth={m.ghost ? 1.6 : 1} strokeDasharray={m.ghost ? "3 3" : undefined} strokeLinejoin="round" />)
  }
  for (const [i, k] of S.curls.entries()) {
    const m = S.markers.find(x => x.id === k.at)
    const c = m ? toScreen(S, m.at) : S.P[k.at] ? ptS(S, k.at) : null
    if (!c) continue
    const sweep = ((((k.to - k.from) % 360) + 360) % 360) || 360
    const P = arcPts(c, k.from, sweep * 0.86, k.r ?? 30)
    const end = P[P.length - 1], before = P[P.length - 2]
    const d = sub(end, before), l = Math.hypot(d[0], d[1]) || 1
    out.push(<path key={`c${i}`} d={path(P)} fill="none" stroke={k.col} strokeWidth={2.2} strokeLinecap="round" />)
    out.push(<path key={`ch${i}`} d={head(end, [d[0] / l, d[1] / l], 9)} fill={k.col} />)
  }
  return <>{out}</>
}

/** Every named place is a dot. */
function Dots({ S }: { S: Scene }) {
  return (
    <>
      {Object.keys(S.names).concat(S.dots).filter((n, i, all) => all.indexOf(n) === i && S.P[n]).map(n => {
        const p = ptS(S, n)
        return <circle key={`d${n}`} cx={p[0]} cy={p[1]} r={3.6} fill={S.nameCol[n] ?? CHALK} />
      })}
    </>
  )
}

/** What the student can tap or drag breathes yellow. */
function Targets({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  const ring = (p: Vec, key: string) => (
    <g key={key}>
      <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="7;18;7" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>
      <circle cx={p[0]} cy={p[1]} r={5} fill={YELLOW} fillOpacity={0.85} />
    </g>
  )
  if (S.mode === "tapPoint" && S.tapPoints) for (const n of S.tapPoints) if (S.P[n]) out.push(ring(ptS(S, n), `tp${n}`))
  for (const n of S.dragPts) {
    if (!S.P[n]) continue
    const held = S.drag?.kind === "point" && S.drag.n === n
    const p = ptS(S, n)
    out.push(held ? <circle key={`dp${n}`} cx={p[0]} cy={p[1]} r={9.5} fill={YELLOW} filter="url(#pl-soft)" /> : ring(p, `dp${n}`))
  }
  if (S.mode === "tapArc" && S.tapArcs) {
    for (const id of S.tapArcs) {
      const a = S.arcs.find(x => x.id === id)
      if (!a || !S.P[a.at]) continue
      const c = ptS(S, a.at), r = L.arcPx * (a.r ?? 1)
      const wedge = `M ${c[0]} ${c[1]} ` + arcPts(c, a.from, a.sweep, r).map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z"
      out.push(<path key={`ta${id}`} d={wedge} fill={YELLOW} fillOpacity={0.18}>{breathe()}</path>)
      void arcSpot
    }
  }
  return <>{out}</>
}

function Labels({ S }: { S: Scene }) {
  return (
    <>
      {S.labs.map(l => {
        const p = S.labD[l.key] ?? l.at
        return (
          <div key={l.key} data-k={l.key} className={`${styles.label} ${l.pulse ? styles.pulse : ""}`} style={{ ...place(p), color: l.col, fontSize: l.size, opacity: l.op }}>
            {l.word ? <span style={{ fontFamily: "inherit", letterSpacing: 0.2 }}>{l.tex}</span> : <Tex tex={l.tex} />}
          </div>
        )
      })}
    </>
  )
}

/**
 * The bearing on a three-digit display, as a ship's compass shows it. Plain
 * (just the angle) until three figures are introduced; then each digit has
 * its box and the leading zeros come in.
 */
function Readout({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  const r = S.readout
  if (!r || op < 0.01) return null
  const ray = r.ray ? S.rays.find(x => x.id === r.ray) : null
  const b = ray ? ray.d : r.brg ?? 0
  const digits = brgText(b, true).split("")
  // plain: just the angle (45°), its digits close together; three figures: each digit in its box, the zeros in front
  const lead = r.three ? 0 : digits[0] === "0" ? (digits[1] === "0" ? 2 : 1) : 0
  const size = L.readSize
  const slot = r.three ? size * 0.78 : size * 0.56, gap = r.three ? size * 0.14 : 0
  const ease = "450ms cubic-bezier(.2,.7,.2,1)"
  return (
    <div data-readout={digits.slice(lead).join("")} style={{ position: "absolute", left: L.midX, top: L.readY - size * 0.62, transform: "translateX(-50%)", opacity: op, display: "flex", alignItems: "center", pointerEvents: "none" }}>
      {digits.map((dg, i) => {
        const hidden = i < lead
        return (
          <div key={i} style={{
            width: hidden ? 0 : slot, marginRight: hidden ? 0 : gap, height: size * 1.24, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            border: `1.5px solid ${r.three ? QUIET : "transparent"}`, background: r.three ? "rgba(240,238,234,0.04)" : "transparent",
            color: r.col, fontSize: size, opacity: hidden ? 0 : 1,
            transition: `width ${ease}, margin ${ease}, opacity ${ease}, border-color ${ease}, background ${ease}`,
          }}><Tex tex={dg} /></div>
        )
      })}
      <div style={{ color: r.col, fontSize: size * 0.9, alignSelf: "flex-start" }}><Tex tex={"{}^\\circ"} /></div>
    </div>
  )
}

export { layout }
