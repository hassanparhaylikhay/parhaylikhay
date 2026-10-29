"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, CORNERS, ENDS, PAIR_COL, CHALK, GREEN, YELLOW, QUIET, RED,
  toScreen, ptS, pt, pairCol, angCol, arcRadius, chipRects, dragAt, swingEnd, heightFoot, biggestCorner, extraArcGeom, layout,
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
          <Extra S={S} op={vis("extra")} L={L} />
          <Ghost S={S} />
          <Triangle S={S} />
          <Height S={S} />
          <Light S={S} />
          <SwingRod S={S} />
          <Handles S={S} />
        </g>
      </svg>
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

/** The line from C straight down to AB; once down, its right angle and the two triangles it makes. */
function Height({ S }: { S: Scene }) {
  const h = S.height
  if (!h) return null
  const C = ptS(S, "C"), H = toScreen(S, heightFoot(S))
  const end = lerpV(C, H, h.drop)
  const out: React.ReactNode[] = []
  if (h.drop >= 1 && h.glow) {
    const other = h.glow === "left" ? ptS(S, "A") : ptS(S, "B")
    out.push(
      <polygon key="half" points={poly([C, H, other])} fill={YELLOW} fillOpacity={0.12}>
        <animate attributeName="fill-opacity" values="0.06;0.2;0.06" dur="1.8s" repeatCount="indefinite" />
      </polygon>,
    )
  }
  out.push(ln(C, end, "h", { strokeWidth: 2.6, strokeDasharray: h.drop >= 1 ? undefined : "1 7" }))
  if (h.drop >= 1) {
    out.push(square(H, ptS(S, "B"), C, "hrt"))
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
  return (
    <g opacity={op}>
      {(e.fills ?? []).map((f, k) => <polygon key={`f${k}`} points={poly(f.pts.map(at))} fill={f.col} fillOpacity={f.op ?? 0.1} stroke="none" />)}
      {e.segs.map(([a, b], k) => ln(at(a), at(b), `s${k}`, { strokeWidth: 2.2, strokeOpacity: 0.85 }))}
      {(e.dash ?? []).map(([a, b], k) => ln(at(a), at(b), `d${k}`, { strokeWidth: 1.8, strokeOpacity: 0.6, strokeDasharray: "5 6" }))}
      {(e.rts ?? []).map((r, k) => square(at(r.at), at(r.a), at(r.b), `rt${k}`))}
      {(e.arcs ?? []).map((g, k) => {
        const G = extraArcGeom(S, g, L.labelSize)
        const col = g.col ?? CHALK
        return (
          <g key={`xa${k}`}>
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
    const C = ptS(S, "C")
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
    return <div className={`${styles.label} pl-eq-grab`} style={{ ...place(d.p), color: a.node.col ?? CHALK, fontSize: S.eq.size * 1.08, zIndex: 7 }}><Tex tex={a.node.tex} /></div>
  }
  if (d.kind === "label" && S.fill) {
    const it = S.fill.items[d.key]
    if (!it) return null
    return <div className={styles.label} style={{ ...place(d.p), color: it.col, fontSize: layout(S).labelSize * 1.25, zIndex: 7, filter: "drop-shadow(0 0 8px rgba(240,238,234,0.35))" }}><Tex tex={it.tex} /></div>
  }
  return null
}

export { pt, RED }
