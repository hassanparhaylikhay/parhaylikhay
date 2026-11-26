"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, unit } from "../geometry"
import {
  type Scene, type Layout, type Poly, CHALK, GREEN, YELLOW, QUIET,
  PD, ptS, toScreen, marksOf, handleAt, polyPts, dragAt, slicePolys, RAD,
} from "./scene"

/**
 * Draws the terms board. Pure: everything comes from the scene. Lines,
 * shapes, marks and the circle are SVG; every letter and number is KaTeX
 * laid over them.
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h || !S.fitD) return null
  const v = (k: keyof Scene["vis"]) => S.vis[k].v
  const b = L.board
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden>
        <defs>
          <filter id="tl-soft" filterUnits="userSpaceOnUse" x={0} y={0} width={S.w} height={S.h}>
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <clipPath id="tl-board"><rect x={b.x0 - 12} y={b.y0 - 12} width={b.x1 - b.x0 + 24} height={b.y1 - b.y0 + 24} /></clipPath>
        </defs>
        <g opacity={v("board")}>
          <g opacity={v("grid")}><Grid S={S} /></g>
          <g opacity={v("shapes")}>
            <CellsView S={S} />
            <SlicesView S={S} />
            <Shades S={S} />
            {S.polys.map(pl => <PolyView key={pl.id} S={S} pl={pl} />)}
            <g clipPath="url(#tl-board)">{S.segs.map(sg => <SegView key={sg.id} S={S} id={sg.id} />)}</g>
            <CircleView S={S} />
            <ArcsView S={S} />
          </g>
          <g opacity={v("marks")}><Marks S={S} /></g>
          <Dots S={S} />
          <Stroke S={S} />
          <Handles S={S} />
        </g>
      </svg>
      <Labels S={S} />
      <EquationView B={S.eq} time={S.time} opacity={v("eq")} />
      <Carried S={S} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px`, ...(L.keypadCx !== undefined ? { right: "auto", width: 2 * L.midX } : {}) }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const poly = (Q: Vec[]) => Q.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)

/** Grid lines one unit apart (dotted, as on the papers), and the axes. */
function Grid({ S }: { S: Scene }) {
  const g = S.grid
  if (!g) return null
  const out: React.ReactNode[] = []
  for (let x = Math.ceil(g.x0); x <= g.x1; x++) {
    const a = toScreen(S, [x, g.y0]), c = toScreen(S, [x, g.y1])
    const axis = g.axes && x === 0
    out.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke={axis ? QUIET : "#2a2e31"} strokeWidth={axis ? 1.6 : 1} />)
  }
  for (let y = Math.ceil(g.y0); y <= g.y1; y++) {
    const a = toScreen(S, [g.x0, y]), c = toScreen(S, [g.x1, y])
    const axis = g.axes && y === 0
    out.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={c[0]} y2={c[1]} stroke={axis ? QUIET : "#2a2e31"} strokeWidth={axis ? 1.6 : 1} />)
  }
  return <>{out}</>
}

/** Unit squares counted: whole rows as one strip, then the start of the next, each square's edges faint. */
function CellsView({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const c of S.cells) {
    const n = Math.max(0, Math.min(c.lit, c.nx * c.ny)), rows = Math.floor(n / c.nx), rest = n - rows * c.nx
    const top = c.y0 + c.ny
    const rect = (x0: number, y0: number, x1: number, y1: number, key: string) => {
      const a = toScreen(S, [x0, y1]), b = toScreen(S, [x1, y0])
      out.push(<rect key={key} x={a[0]} y={a[1]} width={b[0] - a[0]} height={b[1] - a[1]} fill={c.col} fillOpacity={c.op ?? 0.3} stroke="none" />)
    }
    if (rows) rect(c.x0, top - rows, c.x0 + c.nx, top, `${c.id}r`)
    if (rest) rect(c.x0, top - rows - 1, c.x0 + rest, top - rows, `${c.id}s`)
  }
  return <>{out}</>
}

/** Shaded regions of the circle, or shapes. */
function Shades({ S }: { S: Scene }) {
  return (
    <>
      {S.shades.map(sh => {
        let Q: Vec[] = []
        if (sh.kind === "poly" && sh.pts) Q = sh.pts.map(n => ptS(S, n))
        else if (sh.kind === "ring" && sh.c && S.pts[sh.c]) {
          // between two radii about its own centre: out along the far arc, back along the near one (or to the centre)
          const c = PD(S, sh.c), r1 = sh.r1 ?? 0, r2 = sh.r2 ?? 1, a1 = sh.a1 ?? 0
          const span = ((((sh.a2 ?? 360) - a1) % 360) + 360) % 360 || 360
          const at = (r: number, a: number): Vec => toScreen(S, [c[0] + r * Math.cos(a * RAD), c[1] + r * Math.sin(a * RAD)])
          for (let i = 0; i <= 64; i++) Q.push(at(r2, a1 + (span * i) / 64))
          if (r1 > 0) for (let i = 64; i >= 0; i--) Q.push(at(r1, a1 + (span * i) / 64))
          else if (span < 360) Q.push(toScreen(S, c))
        } else if (S.circle && sh.a1 !== undefined && sh.a2 !== undefined) {
          const c = PD(S, S.circle.c), r = S.circle.r
          const span = (((sh.a2 - sh.a1) % 360) + 360) % 360 || 360
          const arc: Vec[] = []
          for (let i = 0; i <= 48; i++) { const a = (sh.a1 + (span * i) / 48) * RAD; arc.push(toScreen(S, [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)])) }
          Q = sh.kind === "sector" ? [toScreen(S, c), ...arc] : arc
        }
        if (Q.length < 3) return null
        return (
          <polygon key={sh.id} points={poly(Q)} fill={sh.col} fillOpacity={sh.op ?? 0.28} stroke="none">
            {sh.pulse && <animate attributeName="fill-opacity" values={`${(sh.op ?? 0.28) * 0.4};${sh.op ?? 0.28};${(sh.op ?? 0.28) * 0.4}`} dur="1.6s" repeatCount="indefinite" />}
          </polygon>
        )
      })}
    </>
  )
}

/** A shape: a faint fill and its sides (lit green when it has just been made). */
function PolyView({ S, pl }: { S: Scene; pl: Poly }) {
  const Q = pl.pts.map(n => ptS(S, n))
  if (pl.ghost) return <polygon points={poly(Q)} fill="none" stroke={CHALK} strokeOpacity={0.45} strokeWidth={1.8} strokeDasharray="6 6" strokeLinejoin="round" />
  const lit = S.flashGood > 0 && S.touched === pl.id
  return (
    <g>
      {pl.glow && <polygon points={poly(Q)} fill={pl.glow} fillOpacity={0.12} stroke={pl.glow} strokeWidth={9} strokeLinejoin="round" filter="url(#tl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.6;0.1" dur="1.6s" repeatCount="indefinite" /></polygon>}
      <polygon points={poly(Q)} fill={pl.fill ?? CHALK} fillOpacity={pl.fill ? pl.fillOp ?? 0.25 : 0.05} stroke={lit ? GREEN : pl.col ?? CHALK} strokeOpacity={lit ? flashOp(S) : 1} strokeWidth={2.4} strokeLinejoin="round" />
    </g>
  )
}

/** A line between two points, carried on to the board's edge when it is a line that goes on for ever. */
function SegView({ S, id }: { S: Scene; id: string }) {
  const sg = S.segs.find(x => x.id === id)!
  let a = ptS(S, sg.a), b = ptS(S, sg.b)
  if (sg.ext) {
    const u = unit(sub(b, a))
    a = sub(a, mul(u, 3000)); b = add(b, mul(u, 3000))
  }
  const col = sg.col ?? CHALK
  return (
    <g>
      {sg.glow && <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={10} strokeLinecap="round" filter="url(#tl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.6;0.1" dur="1.6s" repeatCount="indefinite" /></line>}
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={sg.w ?? 2.4} strokeLinecap="round" strokeDasharray={sg.dash ? "7 7" : undefined} />
    </g>
  )
}

function CircleView({ S }: { S: Scene }) {
  if (!S.circle) return null
  const c = ptS(S, S.circle.c), r = S.circle.r * (S.fitD?.u ?? 30)
  return <circle cx={c[0]} cy={c[1]} r={r} fill={CHALK} fillOpacity={0.04} stroke={CHALK} strokeWidth={2.4} />
}

/** Arcs: part of the circle's edge, or of any circle about a point (an arc of a sector, an angle mark). */
function ArcsView({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const ar of S.arcs) {
    const cn = ar.c ?? S.circle?.c, r = ar.r ?? S.circle?.r
    if (!cn || r === undefined || !S.pts[cn]) continue
    const span = (((ar.a2 - ar.a1) % 360) + 360) % 360 || 360
    const pts: Vec[] = []
    const w = PD(S, cn)
    for (let i = 0; i <= 64; i++) { const a = (ar.a1 + (span * i) / 64) * RAD; pts.push(toScreen(S, [w[0] + r * Math.cos(a), w[1] + r * Math.sin(a)])) }
    const d = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
    if (ar.glow) out.push(<path key={`g${ar.id}`} d={d} fill="none" stroke={ar.col} strokeWidth={11} strokeLinecap="round" filter="url(#tl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.6;0.15" dur="1.6s" repeatCount="indefinite" /></path>)
    out.push(<path key={ar.id} d={d} fill="none" stroke={ar.col} strokeWidth={ar.w ?? 4} strokeLinecap="round" strokeDasharray={ar.dash ? "7 7" : undefined} />)
  }
  return <>{out}</>
}

/** A cut circle's slices, from the circle toward the strip: every other one a little brighter so they can be told apart. */
function SlicesView({ S }: { S: Scene }) {
  const sl = S.slices
  if (!sl) return null
  return (
    <>
      {slicePolys(sl).map((Q, i) => (
        <polygon key={i} points={poly(Q.map(p => toScreen(S, p)))} fill={sl.col} fillOpacity={i % 2 ? 0.14 : 0.3} stroke={CHALK} strokeOpacity={0.8} strokeWidth={1.3} strokeLinejoin="round" />
      ))}
    </>
  )
}

/** Ticks on a side's middle (n of them), across it. */
function ticks(a: Vec, b: Vec, n: number, key: string, col = YELLOW, shift = 0): React.ReactNode[] {
  const u = unit(sub(b, a)), nn: Vec = [-u[1], u[0]], m = add(lerpV(a, b, 0.5), mul(u, shift)), out: React.ReactNode[] = []
  for (let j = 0; j < n; j++) {
    const c = add(m, mul(u, (j - (n - 1) / 2) * 6))
    const p = add(c, mul(nn, 7)), q = sub(c, mul(nn, 7))
    out.push(<line key={`${key}t${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={col} strokeWidth={2.2} strokeLinecap="round" />)
  }
  return out
}
/** Arrowheads on a side's middle (n of them), pointing from a to b. */
function arrows(a: Vec, b: Vec, n: number, key: string, flip = false): React.ReactNode[] {
  let u = unit(sub(b, a))
  if (flip) u = mul(u, -1)
  const nn: Vec = [-u[1], u[0]], m = lerpV(a, b, 0.5), out: React.ReactNode[] = []
  for (let j = 0; j < n; j++) {
    const c = add(m, mul(u, (j - (n - 1) / 2) * 9))
    const tip = add(c, mul(u, 6)), l = add(sub(c, mul(u, 4)), mul(nn, 6)), r = sub(sub(c, mul(u, 4)), mul(nn, 6))
    out.push(<path key={`${key}a${j}`} d={`M ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} L ${r[0]} ${r[1]}`} fill="none" stroke={CHALK} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />)
  }
  return out
}
/** A right-angle square at a corner, between its lines to two points. */
function square(at: Vec, a: Vec, b: Vec, key: string, col = CHALK, pulse = false): React.ReactNode {
  const s = 13, u = unit(sub(a, at)), w = unit(sub(b, at))
  const p = add(at, mul(u, s)), q = add(add(at, mul(u, s)), mul(w, s)), r = add(at, mul(w, s))
  return (
    <path key={key} d={`M ${p[0]} ${p[1]} L ${q[0]} ${q[1]} L ${r[0]} ${r[1]}`} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round">
      {pulse && <animate attributeName="stroke-opacity" values="0.3;1;0.3" dur="1.4s" repeatCount="indefinite" />}
    </path>
  )
}

/** Equal sides, parallel sides and right angles: worked out for shapes with marks, and given ones on lines. */
function Marks({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const pl of S.polys) {
    if (!pl.marks || pl.ghost) continue
    const Q = polyPts(S, pl), D = pl.pts.map(n => ptS(S, n)), n = Q.length
    const m = marksOf(Q)
    // a side's arrows point the same way as the side they are parallel to
    const firstDir: Record<number, Vec> = {}
    for (let i = 0; i < n; i++) {
      const a = D[i], b = D[(i + 1) % n]
      // a side with arrows too: its ticks step along it, clear of them
      if (m.ticks[i]) out.push(...ticks(a, b, m.ticks[i], `${pl.id}${i}`, YELLOW, m.arrows[i] && pl.marks !== "ticks" ? 18 : 0))
      if (pl.marks === "ticks") continue
      if (m.arrows[i]) {
        const g = m.arrows[i], d = sub(b, a)
        if (!firstDir[g]) firstDir[g] = d
        out.push(...arrows(a, b, g, `${pl.id}${i}`, d[0] * firstDir[g][0] + d[1] * firstDir[g][1] < 0))
      }
      if (m.rights[i]) out.push(square(D[i], D[(i + n - 1) % n], D[(i + 1) % n], `${pl.id}sq${i}`))
    }
  }
  for (const sg of S.segs) {
    const a = ptS(S, sg.a), b = ptS(S, sg.b)
    if (sg.arrows) out.push(...arrows(a, b, sg.arrows, `seg${sg.id}`))
    if (sg.ticks) out.push(...ticks(a, b, sg.ticks, `seg${sg.id}`))
  }
  for (const sq of S.squares) out.push(square(ptS(S, sq.at), ptS(S, sq.a), ptS(S, sq.b), `sq${sq.at}${sq.a}${sq.b}`, sq.col, sq.pulse))
  return <>{out}</>
}

function Dots({ S }: { S: Scene }) {
  return (
    <>
      {S.dots.map(d => {
        if (!S.pts[d.pt]) return null
        const p = ptS(S, d.pt)
        return (
          <g key={d.pt}>
            {d.pulse && <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={d.col ?? CHALK} strokeWidth={1.6}><animate attributeName="r" values="6;18;6" dur="1.8s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" repeatCount="indefinite" /></circle>}
            <circle cx={p[0]} cy={p[1]} r={d.r ?? 4.5} fill={d.col ?? CHALK} />
          </g>
        )
      })}
    </>
  )
}

/** A line being drawn from its point to the finger (onto the circle's edge once it is near). */
function Stroke({ S }: { S: Scene }) {
  const d = S.drag
  if (!d || d.kind !== "draw") return null
  const h = S.handles.find(x => x.id === d.id)
  if (!h || h.kind !== "draw") return null
  const a = ptS(S, h.from)
  const r = h.accept(S, d.end)
  const end = toScreen(S, r.ok && r.to ? r.to : d.end)
  return (
    <g>
      <line x1={a[0]} y1={a[1]} x2={end[0]} y2={end[1]} stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeDasharray={r.ok ? undefined : "7 6"} />
      <circle cx={end[0]} cy={end[1]} r={6} fill={YELLOW} />
    </g>
  )
}

/** What can be dragged: a yellow dot with a breathing ring (still while it is held). */
function Handles({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const h of S.handles) {
    if (S.locked.has(h.id)) continue
    const held = S.drag && S.drag.kind !== "pan" && S.drag.id === h.id
    const p = handleAt(S, h)
    out.push(
      <g key={h.id}>
        {!held && <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="7;20;7" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
        <circle cx={p[0]} cy={p[1]} r={held ? 9 : 7} fill={YELLOW} filter="url(#tl-soft)" />
      </g>,
    )
  }
  return <>{out}</>
}

/** A piece of the equation carried by the finger. */
function Carried({ S }: { S: Scene }) {
  const p = dragAt(S)
  const d = S.drag
  if (!p || d?.kind !== "atom") return null
  const a = S.eq.atoms[d.id]
  if (!a || a.node.k !== "a") return null
  const tex = S.dragTex[d.id] ?? a.node.tex
  return <div className={`${styles.label} pl-eq-grab`} style={{ ...place(p), color: a.node.col ?? CHALK, fontSize: S.eq.size * 1.08, zIndex: 7 }}><Tex tex={tex} /></div>
}

function Labels({ S }: { S: Scene }) {
  return (
    <>
      {S.labs.map(l => {
        const p = S.labD[l.key] ?? l.at
        return (
          <div key={l.key} data-k={l.key} className={`${styles.label} ${l.pulse ? styles.pulse : ""}`} style={{ ...place(p), color: l.col, fontSize: l.size, opacity: l.op }}>
            <Tex tex={l.tex} />
          </div>
        )
      })}
    </>
  )
}

