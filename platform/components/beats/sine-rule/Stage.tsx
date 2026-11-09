"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, CORNERS, ENDS, PAIR_COL, CHALK, GREEN, YELLOW, QUIET, RED,
  toScreen, ptS, pt, pairCol, angCol, arcRadius, chipRects, dragAt, swingEnd, heightFoot, heightFrom, heightT, biggestCorner, extraArcGeom, layout, squarePts, sideLen,
} from "./scene"

/**
 * Draws the sine rule board. Pure: everything comes from the scene. Shapes
 * are SVG; every number and letter is KaTeX laid over the SVG at the same
 * pixel coordinates.
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h || !S.viewD) return null
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden>
        <defs>
          <filter id="pl-soft" filterUnits="userSpaceOnUse" x={0} y={0} width={S.w} height={S.h}>
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="pl-light">
            <stop offset="0%" stopColor={YELLOW} stopOpacity={0.5} />
            <stop offset="100%" stopColor={YELLOW} stopOpacity={0.04} />
          </radialGradient>
        </defs>
        <g opacity={vis("board")}>
          <Squares S={S} op={vis("squares")} />
          <Regions S={S} />
          <Extra S={S} op={vis("extra")} L={L} />
          <Ghost S={S} />
          <Triangle S={S} />
          <Height S={S} />
          <Light S={S} />
          <SwingRod S={S} />
          <Handles S={S} />
        </g>
      </svg>
      <Bars S={S} L={L} op={vis("bars")} />
      <Labels S={S} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      <Chips S={S} L={L} op={vis("chips")} />
      <Ghosts S={S} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px` }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const poly = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const ln = (a: Vec, b: Vec, key: string, extra: React.SVGProps<SVGLineElement> = {}) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" {...extra} />
)
const unitV = (a: Vec): Vec => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l] }
const dist2 = (a: Vec, b: Vec) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)

/** A right-angle square at a point between two directions. */
function square(C: Vec, a: Vec, b: Vec, key: string, r = 13, col = QUIET) {
  const u = unitV(sub(a, C)), v = unitV(sub(b, C))
  const p1 = add(C, mul(u, r)), p2 = add(add(C, mul(u, r)), mul(v, r)), p3 = add(C, mul(v, r))
  return <path key={key} d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={col} strokeWidth={2} strokeLinejoin="round" />
}

function Triangle({ S }: { S: Scene }) {
  const tv = S.vis.tri.v
  if (tv < 0.01) return null
  const out: React.ReactNode[] = []
  const P = { A: ptS(S, "A"), B: ptS(S, "B"), C: ptS(S, "C") }
  if (S.vis.fill.v > 0.01) out.push(<polygon key="fill" points={poly([P.A, P.B, P.C])} fill={CHALK} fillOpacity={0.05 * S.vis.fill.v} stroke="none" />)
  const big = S.biggest ? biggestCorner(S, S.biggest) : null
  // the arcs, each in its pair's colour
  const av = S.vis.arcs.v
  if (av > 0.01) {
    for (const c of CORNERS) {
      if (S.arcsOnly && !S.arcsOnly.includes(c)) continue
      const [p, q] = ENDS[c]
      const C = P[c], a = P[p], b = P[q]
      const a1 = Math.atan2(a[1] - C[1], a[0] - C[0]), sw = turn(a1, Math.atan2(b[1] - C[1], b[0] - C[0]))
      const r = arcRadius(S, c)
      const col = angCol(S, c)
      const lit = S.flashGood > 0 && S.touched?.kind === "angle" && S.touched.c === c
      out.push(
        <g key={`arc${c}`} opacity={av}>
          <path d={sectorPath(C, a1, sw, r, 40)} fill={col} fillOpacity={S.coloured.has(c) || S.angColoured.has(c) ? 0.22 : 0.12} />
          <path d={arcPath(C, a1, sw, r, 40)} fill="none" stroke={lit ? GREEN : col} strokeWidth={2.2} strokeLinecap="round" />
          {(S.pulseAng.has(c) || S.glowAng.has(c) || big === c) && (
            <path d={sectorPath(C, a1, sw, r + 3, 40)} fill={S.coloured.has(c) || S.angColoured.has(c) ? col : YELLOW} fillOpacity={0.3} filter="url(#pl-soft)">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" />
            </path>
          )}
        </g>,
      )
    }
  }
  for (const c of CORNERS) {
    const [p, q] = ENDS[c]
    const a = P[p], b = P[q]
    const lit = S.flashGood > 0 && ((S.touched?.kind === "side" && S.touched.c === c) || S.touched?.kind === "tri")
    const col = lit ? GREEN : pairCol(S, c)
    if (S.glowSide.has(c) || big === c) {
      out.push(
        <line key={`g${c}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={S.coloured.has(c) ? PAIR_COL[c] : YELLOW} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.75;0.1" dur="1.6s" repeatCount="indefinite" />
        </line>,
      )
    }
    out.push(ln(a, b, `s${c}`, { stroke: col, strokeOpacity: tv * (lit ? flashOp(S) : 1), strokeWidth: S.coloured.has(c) ? 3.4 : 3 }))
  }
  return <>{out}</>
}

/** Light spreading from an angle across to the side it faces. */
function Light({ S }: { S: Scene }) {
  const lt = S.light
  if (!lt) return null
  const C = ptS(S, lt.from)
  const [p, q] = ENDS[lt.from]
  const a = ptS(S, p), b = ptS(S, q)
  const cyc = ((S.time - lt.since) % 2.6) / 2.6
  const g = ease(cyc / 0.55)
  const fade = cyc < 0.7 ? 1 : 1 - (cyc - 0.7) / 0.3
  const A = lerpV(C, a, g), B = lerpV(C, b, g)
  return (
    <g opacity={fade}>
      <polygon points={poly([C, A, B])} fill="url(#pl-light)" stroke="none" />
      {g > 0.95 && <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={6} strokeLinecap="round" strokeOpacity={0.6} filter="url(#pl-soft)" />}
    </g>
  )
}

/**
 * The line from a corner straight down to the side across from it; once
 * down, its right angle and the two triangles it makes. When the angle at
 * one end of that side is obtuse, the height lands past it, and the side
 * carries on to it as a dashed line.
 */
function Height({ S }: { S: Scene }) {
  const h = S.height
  if (!h) return null
  const f = heightFrom(S)
  const [p, q] = ENDS[f]
  const C = ptS(S, f), H = toScreen(S, heightFoot(S))
  const end = lerpV(C, H, h.drop)
  const out: React.ReactNode[] = []
  const t = heightT(S)
  if (t < -0.002 || t > 1.002) {
    const near = ptS(S, t < 0 ? p : q)
    out.push(ln(near, H, "ext", { strokeWidth: 1.8, strokeOpacity: 0.6, strokeDasharray: "5 6" }))
  }
  if (h.drop >= 1 && h.glow) {
    const other = ptS(S, h.glow === "left" ? p : h.glow === "right" ? q : h.glow)
    out.push(
      <polygon key="half" points={poly([C, H, other])} fill={YELLOW} fillOpacity={0.12}>
        <animate attributeName="fill-opacity" values="0.06;0.2;0.06" dur="1.8s" repeatCount="indefinite" />
      </polygon>,
    )
  }
  out.push(ln(C, end, "h", { strokeWidth: 2.6, strokeDasharray: h.drop >= 1 ? undefined : "1 7" }))
  if (h.drop >= 1) {
    // the square sits on the side, toward its far end
    const far = dist2(H, ptS(S, p)) > dist2(H, ptS(S, q)) ? ptS(S, p) : ptS(S, q)
    out.push(square(H, far, C, "hrt"))
    if (S.got.has("rtPulse")) out.push(<circle key="hp" cx={H[0]} cy={H[1]} r={10} fill="none" stroke={YELLOW} strokeWidth={2}><animate attributeName="r" values="6;20;6" dur="1.6s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.6s" repeatCount="indefinite" /></circle>)
  }
  return <>{out}</>
}

/** A faint second triangle (the other one that fits). */
function Ghost({ S }: { S: Scene }) {
  const g = S.ghost
  if (!g) return null
  const P = g.map(n => ptS(S, n))
  return <polygon points={poly(P)} fill={CHALK} fillOpacity={0.04} stroke={CHALK} strokeOpacity={0.45} strokeWidth={2} strokeDasharray="6 6" strokeLinejoin="round" />
}

/** The side that swings: from its corner to its free end, with where it has landed marked. */
function SwingRod({ S }: { S: Scene }) {
  const g = S.swing
  if (!g) return null
  const e = swingEnd(S)!
  const P0 = ptS(S, g.pivot), E = toScreen(S, e)
  const out: React.ReactNode[] = []
  for (const i of g.landed) {
    const L = toScreen(S, g.lands[i])
    out.push(<circle key={`ld${i}`} cx={L[0]} cy={L[1]} r={5} fill={CHALK} />)
  }
  out.push(ln(P0, E, "rod", { stroke: PAIR_COL.A, strokeWidth: 3.4 }))
  out.push(<circle key="end" cx={E[0]} cy={E[1]} r={4} fill={PAIR_COL.A} />)
  return <>{out}</>
}

function Extra({ S, op, L }: { S: Scene; op: number; L: Layout }) {
  const e = S.extra
  if (!e || op < 0.01) return null
  const at = (n: string) => ptS(S, n)
  // the figure's other lines go faint while the student looks at one triangle
  const lineOp = e.quiet ? 0.3 : 0.85
  return (
    <g opacity={op}>
      {(e.fills ?? []).map((f, k) => <polygon key={`f${k}`} points={poly(f.pts.map(at))} fill={f.col} fillOpacity={f.op ?? 0.1} stroke="none" />)}
      {e.segs.map(([a, b], k) => ln(at(a), at(b), `s${k}`, { strokeWidth: 2.2, strokeOpacity: lineOp }))}
      {(e.arrows ?? []).map(([a, b], k) => {
        // a parallel mark: a small arrowhead in the middle of the line
        const A = at(a), B = at(b), m = lerpV(A, B, 0.5), u = unitV(sub(B, A)), n: Vec = [-u[1], u[0]]
        const tip = add(m, mul(u, 6)), l = add(sub(m, mul(u, 4)), mul(n, 6)), r = sub(sub(m, mul(u, 4)), mul(n, 6))
        return <path key={`ar${k}`} d={`M ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} L ${r[0]} ${r[1]}`} fill="none" stroke={CHALK} strokeOpacity={lineOp} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      })}
      {(e.dash ?? []).map(([a, b], k) => ln(at(a), at(b), `d${k}`, { strokeWidth: 1.8, strokeOpacity: 0.6, strokeDasharray: "5 6" }))}
      {(e.rts ?? []).map((r, k) => square(at(r.at), at(r.a), at(r.b), `rt${k}`))}
      {(e.arcs ?? []).map((g, k) => {
        const G = extraArcGeom(S, g, L.labelSize)
        const col = g.col ?? CHALK
        return (
          <g key={`xa${k}`} opacity={e.quiet ? 0.4 : 1}>
            <path d={sectorPath(G.C, G.a1, G.sweep, G.r, 40)} fill={col} fillOpacity={0.14} />
            <path d={arcPath(G.C, G.a1, G.sweep, G.r, 40)} fill="none" stroke={col} strokeWidth={2.2} strokeLinecap="round" />
            {g.pulse && <path d={sectorPath(G.C, G.a1, G.sweep, G.r + 3, 40)} fill={YELLOW} fillOpacity={0.25} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></path>}
          </g>
        )
      })}
    </g>
  )
}

/** What the student can take hold of: a white point with a breathing halo (yellow belongs to side a here). */
function Handles({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  const halo = (p: Vec, key: string, held: boolean) => (
    <g key={key}>
      {!held && (
        <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={CHALK} strokeWidth={1.6}>
          <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={p[0]} cy={p[1]} r={held ? 9.5 : 7} fill={CHALK} filter="url(#pl-soft)" />
    </g>
  )
  if (S.locked) return null
  const d = S.drag
  if (S.mode === "drag") for (const n of S.movable) out.push(halo(ptS(S, n), `h${n}`, d?.kind === "corner" && d.pt === n))
  if (S.mode === "rule" && S.rule) out.push(halo(ptS(S, S.rule.pt), "hr", d?.kind === "corner"))
  if (S.mode === "swing") { const e = swingEnd(S); if (e) out.push(halo(toScreen(S, e), "hsw", d?.kind === "swing")) }
  if (S.mode === "drop" && S.height && S.height.drop < 1) {
    const C = ptS(S, heightFrom(S))
    out.push(halo(C, "hd", d?.kind === "drop"))
    // a faint finger showing which way to pull
    const t = S.time - S.beatStart - 1
    if (t > 0 && !d) {
      const H = toScreen(S, heightFoot(S))
      const cyc = t % 2.8
      const p = lerpV(C, H, ease(cyc / 1.3))
      const fade = cyc < 1.5 ? 1 : 1 - clamp((cyc - 1.5) / 0.6, 0, 1)
      out.push(
        <g key="hint" opacity={fade * 0.6}>
          <line x1={C[0]} y1={C[1]} x2={p[0]} y2={p[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx={p[0]} cy={p[1]} r={13} fill={CHALK} fillOpacity={0.12} stroke={CHALK} strokeOpacity={0.6} strokeWidth={1.5} />
        </g>,
      )
    }
  }
  return <>{out}</>
}

/** Squares on the sides, in their pair's colour, growing out from the side; unit squares inside a whole-number side. */
function Squares({ S, op }: { S: Scene; op: number }) {
  const q = S.squares
  if (!q || op < 0.01) return null
  const out: React.ReactNode[] = []
  for (const c of q.on) {
    const g = q.grow[c].v
    if (g < 0.005) continue
    const W = squarePts(S, c)
    const P = W.map(p => toScreen(S, p))
    const col = PAIR_COL[c]
    out.push(<polygon key={`sq${c}`} points={poly(P)} fill={col} fillOpacity={0.13} stroke={col} strokeOpacity={0.85} strokeWidth={2} strokeLinejoin="round" />)
    const len = sideLen(S, c)
    const n = Math.round(len)
    if (q.grid && Math.abs(len - n) < 0.02 && n >= 2 && n <= 12 && g > 0.98) {
      // lines across the square, one unit apart, each way
      for (let i = 1; i < n; i++) {
        const t = i / n
        const a1 = lerpV(P[0], P[1], t), b1 = lerpV(P[3], P[2], t)
        const a2 = lerpV(P[0], P[3], t), b2 = lerpV(P[1], P[2], t)
        out.push(<line key={`g${c}${i}a`} x1={a1[0]} y1={a1[1]} x2={b1[0]} y2={b1[1]} stroke={col} strokeOpacity={0.25} strokeWidth={1} />)
        out.push(<line key={`g${c}${i}b`} x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={col} strokeOpacity={0.25} strokeWidth={1} />)
      }
    }
    // a square that can be tapped breathes
    if (S.mode === "tapSquare" && !S.got.has(`sq-${c}`)) {
      out.push(
        <polygon key={`sqb${c}`} points={poly(P)} fill={col} fillOpacity={0.12} stroke="none">
          <animate attributeName="fill-opacity" values="0.04;0.22;0.04" dur="1.8s" repeatCount="indefinite" />
        </polygon>,
      )
    }
  }
  return <g opacity={op}>{out}</g>
}

/** Parts of a figure to tap: each breathes until one is picked, and the one picked stays lit. */
function Regions({ S }: { S: Scene }) {
  const R = S.regions
  if (!R) return null
  return (
    <>
      {R.map(r => {
        const P = r.pts.map(n => ptS(S, n))
        if (S.regionLit === r.id) return <polygon key={r.id} points={poly(P)} fill={YELLOW} fillOpacity={0.12} stroke="none" />
        if (S.mode !== "tapRegion") return null
        return (
          <polygon key={r.id} points={poly(P)} fill={CHALK} fillOpacity={0.06} stroke="none">
            <animate attributeName="fill-opacity" values="0.02;0.13;0.02" dur="1.9s" repeatCount="indefinite" />
          </polygon>
        )
      })}
    </>
  )
}

/** a² and b² end to end, c² under them, the gap between marked (and a piece that fills it). */
function Bars({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (!S.bars || op < 0.01) return null
  const B = S.bars(S)
  const nameW = L.compact ? 44 : 56
  const W = Math.min(620, S.w - 2 * (L.compact ? 16 : 40) - nameW)
  const x0 = (S.w - W) / 2 + nameW / 2
  const u = W / B.max
  const h = L.compact ? 20 : 24, gapY = L.compact ? 10 : 14
  const y1 = L.barsY + (L.compact ? 8 : 12), y2 = y1 + h + gapY
  const shapes: React.ReactNode[] = [], texts: React.ReactNode[] = []
  const run = (segs: BarSegs, y: number, row: string) => {
    let x = x0
    segs.forEach((g, i) => {
      const w = Math.max(0, g.v * u)
      shapes.push(<rect key={`${row}${i}`} x={x} y={y} width={w} height={h} rx={3} fill={g.col} fillOpacity={0.28} stroke={g.col} strokeWidth={1.6} />)
      if (w > 26) texts.push(<div key={`${row}t${i}`} className={styles.label} style={{ ...place([x + w / 2, y + h / 2]), color: g.col, fontSize: L.compact ? 13 : 15, opacity: op }}><Tex tex={g.tex} /></div>)
      x += w
    })
    return x
  }
  const e1 = run(B.top, y1, "t"), e2 = run(B.bottom, y2, "b")
  B.names.forEach((nm, i) => texts.push(<div key={`n${i}`} className={styles.label} style={{ ...place([x0 - nameW / 2, (i ? y2 : y1) + h / 2]), color: CHALK, fontSize: L.compact ? 14 : 16, opacity: op }}><Tex tex={nm} /></div>))
  if (B.gap !== null && Math.abs(e1 - e2) > 1.5) {
    // the gap: on the shorter bar's row, from its end to the longer one's
    const short = e2 < e1 ? y2 : y1, a = Math.min(e1, e2), b = Math.max(e1, e2)
    shapes.push(<rect key="gap" x={a} y={short} width={b - a} height={h} rx={3} fill="none" stroke={CHALK} strokeOpacity={0.8} strokeWidth={1.6} strokeDasharray="4 4" />)
    if (B.fill) {
      const t = clamp(B.fill.t, 0, 1)
      const fx = a + (b - a) * (1 - t) - (1 - t) * 40
      shapes.push(<rect key="fill" x={fx} y={short} width={(b - a) * t} height={h} rx={3} fill={CHALK} fillOpacity={0.32 * t} stroke={CHALK} strokeOpacity={t} strokeWidth={1.6} />)
    }
    const label = B.fill && B.fill.t > 0.95 ? B.fill.tex : B.gap
    const ly = short === y2 ? y2 + h + (L.compact ? 11 : 13) : y1 - (L.compact ? 11 : 13)
    texts.push(<div key="gl" className={styles.label} style={{ ...place([(a + b) / 2, ly]), color: CHALK, fontSize: L.compact ? 13 : 15, opacity: op }}><Tex tex={label} /></div>)
  }
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden style={{ opacity: op }}>{shapes}</svg>
      {texts}
    </>
  )
}
type BarSegs = { v: number; col: string; tex: string }[]

function Labels({ S }: { S: Scene }) {
  const breathe = S.mode === "fill"
  return (
    <>
      {S.labs.map(l => {
        const p = S.labD[l.key] ?? l.at
        // a piece that can be dragged into the rule breathes, and goes quiet once placed
        const placed = !!S.fill && Object.values(S.fill.filled).includes(l.key)
        const cls = `${styles.label} ${l.pulse ? styles.pulse : ""} ${breathe && l.drag && !placed ? styles.chipBreathe : ""}`
        return (
          <div key={l.key} className={cls} style={{ ...place(p), color: l.col, fontSize: l.size, opacity: l.op * (placed ? 0.45 : 1), borderRadius: 8, padding: breathe && l.drag && !placed ? "0 4px" : undefined }}>
            <Tex tex={l.tex} />
          </div>
        )
      })}
    </>
  )
}

function Chips({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (op < 0.01 || !S.chips.length) return null
  const size = L.eqSize * 0.9
  const held = S.drag?.kind === "chip" ? S.drag.id : null
  const at = dragAt(S)
  const hintChip = (S.solve as { hintChip?: string | null } | null)?.hintChip ?? null
  const out: React.ReactNode[] = []
  for (const { id, r } of chipRects(S, L)) {
    const c = S.chips.find(x => x.id === id)!
    const style: React.CSSProperties = {
      position: "absolute", left: 0, top: 0, width: r.x1 - r.x0, height: r.y1 - r.y0, borderRadius: (r.y1 - r.y0) / 2,
      border: `1.5px solid ${CHALK}`, background: "rgba(240,238,234,0.05)", color: CHALK, fontSize: size, opacity: op,
      display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
    }
    const hint = hintChip === id
    out.push(<div key={id} className={held === id ? undefined : hint ? styles.pulse : styles.chipBreathe} style={{ ...style, transform: `translate(${r.x0}px, ${r.y0}px)`, opacity: held === id ? op * 0.25 : op }}><Tex tex={c.tex} /></div>)
    if (held === id && at) out.push(<div key={`${id}-held`} style={{ ...style, transform: `translate(${at[0] - (r.x1 - r.x0) / 2}px, ${at[1] - (r.y1 - r.y0) / 2}px) scale(1.08)`, boxShadow: "0 0 26px rgba(240,238,234,0.3)", zIndex: 7 }}><Tex tex={c.tex} /></div>)
  }
  return <>{out}</>
}

/** A piece being carried by the finger: from the equation, or a number off the triangle. */
function Ghosts({ S }: { S: Scene }) {
  const d = S.drag
  if (!d) return null
  if (d.kind === "atom") {
    const a = S.eq.atoms[d.id]
    if (!a || a.node.k !== "a") return null
    // a piece of a term carries the whole term
    const tex = S.dragTex[d.id] ?? a.node.tex
    return <div className={`${styles.label} pl-eq-grab`} style={{ ...place(d.p), color: a.node.col ?? CHALK, fontSize: S.eq.size * 1.08, zIndex: 7 }}><Tex tex={tex} /></div>
  }
  if (d.kind === "label" && S.fill) {
    const it = S.fill.items[d.key]
    if (!it) return null
    return <div className={styles.label} style={{ ...place(d.p), color: it.col, fontSize: layout(S).labelSize * 1.25, zIndex: 7, filter: "drop-shadow(0 0 8px rgba(240,238,234,0.35))" }}><Tex tex={it.tex} /></div>
  }
  return null
}

export { pt, RED }
