"use client"

import styles from "../beats.module.css"
import { Tex, Phrase } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type SideId, type Corner, CHALK, GREEN, YELLOW, BLUE, ORANGE, PINK, QUIET, RAD, graphGeom,
  toScreen, toWorld, layout, cornerS, poseMap, rgbCss, cardRects, chipRects, CARD_TEX, RULE, ROLE_COL, turnHandle, slideHandle, dragAt,
} from "./scene"

/**
 * Draws the trigonometry board. Pure: everything comes from the scene.
 * Shapes are SVG; every number and letter is KaTeX laid over the SVG at the
 * same pixel coordinates.
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
        <g opacity={vis("graph")}><Graph S={S} /></g>
        <g opacity={vis("board")}>
          <UnitCircle S={S} />
          <Extra S={S} op={vis("extra")} />
          <Arms S={S} op={vis("arms")} />
          <Family S={S} />
          <Outline S={S} />
          <Triangle S={S} />
          <Marks S={S} />
          <Door S={S} />
          <TanLine S={S} />
          <Mirror S={S} />
          <Light S={S} />
          <Halves S={S} />
          <Ghost S={S} />
          <Handles S={S} />
        </g>
      </svg>
      <Tenth S={S} L={L} op={vis("tenth")} />
      <Labels S={S} L={L} />
      <GraphLabels S={S} L={L} op={vis("graph")} />
      <CircleLabels S={S} L={L} />
      <CalcScreen S={S} L={L} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      <Cards S={S} L={L} op={vis("cards")} />
      <Chips S={S} L={L} op={vis("chips")} />
      <AtomGhost S={S} />
      <StepsCard S={S} L={L} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px` }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const poly = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const ln = (a: Vec, b: Vec, key: string, extra: React.SVGProps<SVGLineElement> = {}) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" {...extra} />
)
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)
const ends = (S: Scene, side: SideId): [Vec, Vec] => [cornerS(S, side[0]), cornerS(S, side.slice(1))]

// ── the angle and its triangle ───────────────────────────────────────────

function Arms({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01) return null
  const t = S.triD
  const V = cornerS(S, "V")
  const g = S.growArms === null ? 1 : ease((S.time - S.growArms) / 0.9)
  const B = lerpV(V, toScreen(S, poseMap(t.pose, [S.armR, 0])), g)
  const T = lerpV(V, turnHandle(S), g)
  return (
    <g opacity={op}>
      {ln(V, B, "armB", { strokeWidth: 2, strokeOpacity: 0.75 })}
      {ln(V, T, "armT", { strokeWidth: 2, strokeOpacity: 0.75 })}
      <circle cx={V[0]} cy={V[1]} r={3.5} fill={CHALK} />
    </g>
  )
}

function Triangle({ S }: { S: Scene }) {
  const t = S.triD
  const tv = S.vis.tri.v
  const out: React.ReactNode[] = []
  const V = cornerS(S, "V"), F = cornerS(S, "F"), P = cornerS(S, "P")
  const made = t.drop > 0.97
  if (made && S.vis.fill.v > 0.01) out.push(<polygon key="fill" points={poly([V, F, P])} fill={CHALK} fillOpacity={0.05 * S.vis.fill.v} stroke="none" />)
  if (tv > 0.01 && made) {
    for (const side of ["VF", "FP", "VP"] as SideId[]) {
      const [a, b] = ends(S, side)
      const lit = S.flashGood > 0 && ((S.touched?.kind === "side" && S.touched.id === side) || S.touched?.kind === "tri")
      const col = lit ? GREEN : rgbCss(S.sideColD[side])
      // the glow goes under the side, so the side keeps its colour
      if (S.glow.has(side)) {
        out.push(
          <line key={`g${side}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" filter="url(#pl-soft)">
            <animate attributeName="stroke-opacity" values="0.1;0.75;0.1" dur="1.6s" repeatCount="indefinite" />
          </line>,
        )
      }
      out.push(ln(a, b, side, { stroke: col, strokeOpacity: tv * (lit ? flashOp(S) : 1), strokeWidth: 3 }))
    }
    for (const side of S.ticks) {
      const [a, b] = ends(S, side)
      // a third of the way along, clear of the length written by the middle
      const m = lerpV(a, b, 0.3), d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
      const n: Vec = [-d[1] / l * 7, d[0] / l * 7]
      out.push(ln(add(m, n), sub(m, n), `t${side}`, { stroke: YELLOW, strokeWidth: 2.2 }))
    }
  } else if (tv > 0.01 && t.drop > 0.01) {
    // the line coming down from P
    const top = cornerS(S, "P")
    const foot = toScreen(S, poseMap(t.pose, [t.h * Math.cos(t.th * RAD), t.h * Math.sin(t.th * RAD) * (1 - t.drop)]))
    out.push(ln(top, foot, "drop", { strokeWidth: 3 }))
  }
  // the right angle at F
  const rv = S.vis.rt.v * (made ? 1 : 0)
  if (rv > 0.01) {
    const r = Math.min(15, Math.hypot(V[0] - F[0], V[1] - F[1]) * 0.28, Math.hypot(P[0] - F[0], P[1] - F[1]) * 0.28)
    const u = unitV(sub(V, F)), v = unitV(sub(P, F))
    const p1 = add(F, mul(u, r)), p2 = add(add(F, mul(u, r)), mul(v, r)), p3 = add(F, mul(v, r))
    out.push(<path key="rt" d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={QUIET} strokeWidth={2} strokeLinejoin="round" opacity={rv} />)
    if (S.pulseRt) out.push(<polygon key="rtp" points={poly([F, p1, p2, p3])} fill={CHALK} fillOpacity={0.3} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></polygon>)
  }
  // the angle we look from
  const av = S.vis.arc.v
  if (av > 0.01) {
    for (const [c, sp] of [["V", S.arcV.v], ["P", S.arcP.v]] as [Corner, number][]) {
      // before the triangle is made there is only the angle at V
      if (sp < 0.02 || (c === "P" && !made)) continue
      const C = cornerS(S, c)
      const p = cornerS(S, c === "V" ? "F" : "V"), q = cornerS(S, c === "V" ? "P" : "F")
      const full = S.fullTurn && c === "V"
      // all the way round: measured from the floor, however far it has turned
      const a1 = full ? 0 : Math.atan2(p[1] - C[1], p[0] - C[0]), a2 = Math.atan2(q[1] - C[1], q[0] - C[0])
      const sweep = full ? -t.th * RAD : turn(a1, a2)
      const lp = Math.hypot(p[0] - C[0], p[1] - C[1]), lq = Math.hypot(q[0] - C[0], q[1] - C[1])
      const r = full ? 30 : Math.min(40, lp * 0.3, lq * 0.3) * (0.4 + 0.6 * sp)
      out.push(
        <g key={`arc${c}`} opacity={av * sp}>
          <path d={sectorPath(C, a1, sweep, r, 40)} fill={CHALK} fillOpacity={0.12} />
          <path d={arcPath(C, a1, sweep, r, 40)} fill="none" stroke={CHALK} strokeWidth={2.2} strokeLinecap="round" />
          {S.pulseArc && <path d={sectorPath(C, a1, sweep, r + 3, 40)} fill={YELLOW} fillOpacity={0.25} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></path>}
        </g>,
      )
    }
  }
  return <>{out}</>
}

const unitV = (a: Vec): Vec => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l] }

/** Light spreading from a corner across to a side: "across from". */
function Light({ S }: { S: Scene }) {
  const lt = S.light
  if (!lt || S.triD.drop < 0.97) return null
  const C = cornerS(S, lt.from)
  const [a, b] = ends(S, lt.side)
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

/** The opposite, copied twice, lying along the hypotenuse (at 30° it covers it exactly). */
function Halves({ S }: { S: Scene }) {
  if (S.halves === null || S.triD.drop < 0.97) return null
  const t = S.time - S.halves
  const V = cornerS(S, "V"), F = cornerS(S, "F"), P = cornerS(S, "P")
  const M = lerpV(V, P, 0.5)
  const d = unitV(sub(P, V))
  let n: Vec = [-d[1], d[0]]
  const mid = lerpV(lerpV(V, F, 0.5), P, 0.33)
  // the copies lie just inside the triangle, clear of the hypotenuse's label
  if ((mid[0] - M[0]) * n[0] + (mid[1] - M[1]) * n[1] < 0) n = mul(n, -1)
  const out: React.ReactNode[] = []
  const OFF = 7
  // copy one swings about P like a door, from P-F onto P-M
  const ta = ease((t - 0.2) / 1.0)
  {
    const a0 = Math.atan2(F[1] - P[1], F[0] - P[0]), a1 = Math.atan2(M[1] - P[1], M[0] - P[0])
    const ang = a0 + turn(a0, a1) * ta
    const L = Math.hypot(F[0] - P[0], F[1] - P[1])
    const o = mul(n, OFF * ta)
    const e = add(P, [Math.cos(ang) * L, Math.sin(ang) * L])
    out.push(ln(add(P, o), add(e, o), "h1", { stroke: ORANGE, strokeWidth: 3.4 }))
  }
  // copy two slides down onto V-M
  if (t > 1.3) {
    const tb = ease((t - 1.4) / 1.1)
    const c0 = lerpV(F, P, 0.5), c1 = lerpV(V, M, 0.5)
    const a0 = Math.atan2(P[1] - F[1], P[0] - F[0]), a1 = Math.atan2(M[1] - V[1], M[0] - V[0])
    const ang = a0 + turn(a0, a1) * tb
    const L = Math.hypot(F[0] - P[0], F[1] - P[1]) / 2
    const c = add(lerpV(c0, c1, tb), mul(n, OFF * tb))
    const u: Vec = [Math.cos(ang) * L, Math.sin(ang) * L]
    out.push(ln(sub(c, u), add(c, u), "h2", { stroke: ORANGE, strokeWidth: 3.4 }))
    if (tb >= 1) out.push(ln(add(M, mul(n, 2)), add(M, mul(n, 13)), "hm", { stroke: CHALK, strokeWidth: 2 }))
  }
  return <>{out}</>
}

/** A hypotenuse that is too short: it stops before it reaches the corner. */
function Ghost({ S }: { S: Scene }) {
  const g = S.ghost
  if (!g) return null
  const t = S.triD
  const V = cornerS(S, "V"), P = cornerS(S, "P")
  const tip = toScreen(S, poseMap(t.pose, [g.h * Math.cos(t.th * RAD), g.h * Math.sin(t.th * RAD)]))
  const grow = ease((S.time - S.beatStart - 0.3) / 0.9)
  const e = lerpV(V, tip, grow)
  // the true hypotenuse stays as a faint dashed line; the short one is solid pink and stops at a bar
  const d = unitV(sub(P, V)), n: Vec = [-d[1] * 9, d[0] * 9]
  return (
    <g>
      {ln(V, P, "true", { stroke: CHALK, strokeOpacity: 0.35, strokeWidth: 2, strokeDasharray: "4 7" })}
      {ln(V, e, "ghost", { stroke: PINK, strokeWidth: 4 })}
      {grow >= 1 && ln(add(tip, n), sub(tip, n), "end", { stroke: PINK, strokeWidth: 3 })}
      {grow >= 1 && (
        <circle cx={P[0]} cy={P[1]} r={9} fill="none" stroke={PINK} strokeWidth={2}>
          <animate attributeName="r" values="6;16;6" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.6s" repeatCount="indefinite" />
        </circle>
      )}
    </g>
  )
}

/** What the student can take hold of: a glowing point that breathes. */
function Handles({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  const halo = (p: Vec, key: string, held: boolean) => (
    <g key={key}>
      {!held && (
        <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
          <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={p[0]} cy={p[1]} r={held ? 10 : 7} fill={YELLOW} filter="url(#pl-soft)" />
    </g>
  )
  if (S.locked) return null
  const d = S.drag
  if (S.mode === "turn" || S.mode === "turnSlide") out.push(halo(turnHandle(S), "ht", d?.kind === "turn"))
  if (S.mode === "slide" || S.mode === "turnSlide" || S.mode === "drop") out.push(halo(slideHandle(S), "hs", d?.kind === "slide" || d?.kind === "drop"))
  // a faint finger showing which way to pull the line down
  if (S.mode === "drop" && !d && S.tri.drop < 1) {
    const t = S.time - S.beatStart - 1
    if (t > 0) {
      const top = slideHandle(S)
      const foot = cornerS(S, "F")
      const cyc = t % 2.8
      const p = lerpV(top, foot, ease(cyc / 1.3))
      const fade = cyc < 1.5 ? 1 : 1 - clamp((cyc - 1.5) / 0.6, 0, 1)
      out.push(
        <g key="dropHint" opacity={fade * 0.6}>
          <line x1={top[0]} y1={top[1]} x2={p[0]} y2={p[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx={p[0]} cy={p[1]} r={13} fill={YELLOW} fillOpacity={0.16} stroke={YELLOW} strokeOpacity={0.6} strokeWidth={1.5} />
        </g>,
      )
    }
  }
  return <>{out}</>
}

function Extra({ S, op }: { S: Scene; op: number }) {
  const e = S.extra
  if (!e || op < 0.01) return null
  const at = (n: string) => cornerS(S, n)
  return (
    <g opacity={op}>
      {e.fills.map((f, k) => <polygon key={`f${k}`} points={poly(f.pts.map(at))} fill={f.col} fillOpacity={f.op ?? 0.12} stroke="none" />)}
      {S.regionLit && S.regions.filter(r => r.id === S.regionLit).map(r => <polygon key={`r${r.id}`} points={poly(r.pts.map(at))} fill={GREEN} fillOpacity={0.14} stroke="none" />)}
      {e.segs.map(([a, b], k) => ln(at(a), at(b), `s${k}`, { strokeWidth: 2.2, strokeOpacity: 0.85 }))}
      {(e.dash ?? []).map(([a, b], k) => ln(at(a), at(b), `d${k}`, { strokeWidth: 1.6, strokeOpacity: 0.6, strokeDasharray: "5 6" }))}
    </g>
  )
}

// ── the unit circle all the way round, and the waves it draws ───────────

/** The circle, its floor and its upright; with the waves, the part the point has been round is solid. */
function UnitCircle({ S }: { S: Scene }) {
  if (!S.fullTurn) return null
  const W = (p: Vec) => toScreen(S, p)
  const O = W([0, 0]), R = W([1, 0])[0] - O[0]
  const out: React.ReactNode[] = []
  out.push(<circle key="c" cx={O[0]} cy={O[1]} r={R} fill="none" stroke={QUIET} strokeWidth={1.4} strokeDasharray={S.graph ? "3 6" : undefined} />)
  out.push(ln(W([-1.22, 0]), W([1.22, 0]), "fx", { stroke: QUIET, strokeWidth: 1.2 }))
  out.push(ln(W([0, -1.22]), W([0, 1.22]), "fy", { stroke: QUIET, strokeWidth: 1.2, strokeOpacity: 0.55 }))
  const g = S.graph
  if (g) {
    let d = ""
    for (let k = 0; k <= 360; k++) {
      if (!g.seen[k] && !g.seenCos[k]) continue
      const p = W([Math.cos(k * RAD), Math.sin(k * RAD)])
      d += `${d && (g.seen[k - 1] || g.seenCos[k - 1]) ? " L" : " M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    }
    if (d) out.push(<path key="trace" d={d} fill="none" stroke={CHALK} strokeWidth={2} strokeLinecap="round" />)
  }
  return <>{out}</>
}

const gxOf = (S: Scene) => { const G = graphGeom(S); return (deg: number) => G.x0 + (deg / 360) * G.w }

function Graph({ S }: { S: Scene }) {
  const g = S.graph
  if (!g) return null
  const G = graphGeom(S)
  const gx = gxOf(S)
  const W = (p: Vec) => toScreen(S, p)
  const out: React.ReactNode[] = []
  out.push(ln(W([G.x0, G.y0]), W([G.x0 + G.w + 0.12, G.y0]), "gx", { stroke: QUIET, strokeWidth: 1.6 }))
  out.push(ln(W([G.x0, G.y0 - 1.15]), W([G.x0, G.y0 + 1.15]), "gy", { stroke: QUIET, strokeWidth: 1.6 }))
  for (const v of [1, -1]) out.push(ln(W([G.x0, G.y0 + v]), W([G.x0 + G.w, G.y0 + v]), `g${v}`, { stroke: QUIET, strokeWidth: 1, strokeDasharray: "3 6" }))
  for (const deg of [90, 180, 270, 360]) { const p = W([gx(deg), G.y0]); out.push(ln(p, add(p, [0, 6]), `t${deg}`, { stroke: QUIET, strokeWidth: 1.6 })) }
  const curve = (arr: boolean[], f: (a: number) => number, col: string, key: string) => {
    let d = ""
    for (let k = 0; k <= 360; k++) {
      if (!arr[k]) continue
      const p = W([gx(k), G.y0 + f(k * RAD)])
      d += `${d && arr[k - 1] ? " L" : " M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    }
    if (d) out.push(<path key={key} d={d} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)
  }
  curve(g.seen, Math.sin, ORANGE, "csin")
  curve(g.seenCos, Math.cos, BLUE, "ccos")
  // the side being carried across, standing on the wave's floor at this angle
  const th = S.triD.th * RAD
  const x = gx(S.triD.th)
  const v = g.fn === "sin" ? Math.sin(th) : Math.cos(th)
  const col = g.fn === "sin" ? ORANGE : BLUE
  const top = W([x, G.y0 + v])
  if (g.fn === "sin" && !G.below) out.push(ln(W([Math.cos(th), Math.sin(th)]), top, "carry", { stroke: ORANGE, strokeWidth: 1.4, strokeDasharray: "4 5", strokeOpacity: 0.8 }))
  out.push(ln(W([x, G.y0]), top, "bar", { stroke: col, strokeWidth: 3.4 }))
  out.push(<circle key="dot" cx={top[0]} cy={top[1]} r={4.5} fill={col} />)
  return <>{out}</>
}

function GraphLabels({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (!S.graph || op < 0.01) return null
  const G = graphGeom(S)
  const gx = gxOf(S)
  const W = (p: Vec) => toScreen(S, p)
  const size = L.labelSize - 3
  const put = (p: Vec, tex: string, key: string, col = QUIET) => (
    <div key={key} className={styles.label} style={{ ...place(p), color: col, fontSize: size, opacity: op }}><Tex tex={tex} /></div>
  )
  return (
    <>
      {[0, 90, 180, 270, 360].map(d => put(add(W([gx(d), G.y0]), [0, size * 1.1]), `${d}^\\circ`, `l${d}`))}
      {put(add(W([G.x0, G.y0 + 1]), [-size * 0.9, 0]), "1", "l1")}
      {put(add(W([G.x0, G.y0 - 1]), [-size * 1.1, 0]), "-1", "lm1")}
      {put(add(W([G.x0 + G.w * 0.5, G.y0 + 1.12]), [0, -4]), S.graph.fn === "sin" ? "\\sin\\theta" : "\\cos\\theta", "lf", S.graph.fn === "sin" ? ORANGE : BLUE)}
    </>
  )
}

// ── many triangles in one angle ──────────────────────────────────────────

/** The family: every triangle shares the corner and the angle; then they fly out and sit on each other. */
function Family({ S }: { S: Scene }) {
  const f = S.family
  if (!f) return null
  const t = S.triD, th = t.th * RAD
  const out: React.ReactNode[] = []
  f.hs.forEach((h, i) => {
    const op = clamp((S.time - f.since - i * 0.3) / 0.45, 0, 1)
    if (op <= 0) return
    let hh = h
    let at: Vec = [0, 0]
    if (f.stack !== null) {
      const e = ease((S.time - f.stack - i * 0.22) / 1.15)
      hh = h + (f.size - h) * e
      at = [f.at[0] * e, f.at[1] * e]
    }
    const P = [at, [at[0] + hh * Math.cos(th), at[1]], [at[0] + hh * Math.cos(th), at[1] + hh * Math.sin(th)]].map(q => toScreen(S, poseMap(t.pose, q as Vec)))
    out.push(<polygon key={i} points={poly(P)} fill={CHALK} fillOpacity={0.06 * op} stroke={CHALK} strokeOpacity={0.85 * op} strokeWidth={2} strokeLinejoin="round" />)
  })
  return <>{out}</>
}

/** A faint outline of the triangle where it started, to compare sizes against. */
function Outline({ S }: { S: Scene }) {
  if (S.outline === null || S.triD.drop < 0.97) return null
  const t = S.triD, th = t.th * RAD, h = S.outline
  const P = [[0, 0], [h * Math.cos(th), 0], [h * Math.cos(th), h * Math.sin(th)]].map(q => toScreen(S, poseMap(t.pose, q as Vec)))
  return <polygon points={poly(P)} fill="none" stroke={CHALK} strokeOpacity={0.4} strokeWidth={1.6} strokeDasharray="5 6" strokeLinejoin="round" />
}

/** Ten marks along the hypotenuse, counted from the top corner. */
function Marks({ S }: { S: Scene }) {
  if (S.marks === null || S.triD.drop < 0.97) return null
  const V = cornerS(S, "V"), P = cornerS(S, "P")
  const d = unitV(sub(V, P)), n: Vec = [-d[1] * 7, d[0] * 7]
  const out: React.ReactNode[] = []
  for (let k = 0; k <= 10; k++) {
    const op = clamp((S.time - S.marks - k * 0.1) / 0.3, 0, 1)
    if (op <= 0) continue
    const m = lerpV(P, V, k / 10)
    out.push(ln(add(m, n), sub(m, n), `m${k}`, { stroke: CHALK, strokeWidth: 1.8, strokeOpacity: op }))
  }
  return <>{out}</>
}

/** The opposite, swung about the top corner like a door, lying along the hypotenuse. */
function Door({ S }: { S: Scene }) {
  if (S.door === null || S.triD.drop < 0.97) return null
  const V = cornerS(S, "V"), F = cornerS(S, "F"), P = cornerS(S, "P")
  const e = ease((S.time - S.door) / 1.1)
  const a0 = Math.atan2(F[1] - P[1], F[0] - P[0]), a1 = Math.atan2(V[1] - P[1], V[0] - P[0])
  const ang = a0 + turn(a0, a1) * e
  const len = Math.hypot(F[0] - P[0], F[1] - P[1])
  // once down, it sits just inside the triangle, clear of the hypotenuse itself
  const mid = lerpV(lerpV(V, F, 0.5), P, 0.33)
  const dv = unitV(sub(V, P))
  let n: Vec = [-dv[1], dv[0]]
  if ((mid[0] - P[0]) * n[0] + (mid[1] - P[1]) * n[1] < 0) n = mul(n, -1)
  const o = mul(n, 6 * e)
  const end = add(P, [Math.cos(ang) * len, Math.sin(ang) * len])
  return (
    <g>
      {ln(add(P, o), add(end, o), "door", { stroke: ORANGE, strokeWidth: 3.6 })}
      {e >= 1 && <circle cx={end[0] + o[0]} cy={end[1] + o[1]} r={4.5} fill={ORANGE} />}
    </g>
  )
}

// ── the tangent, and two angles at the same height ───────────────────────

function TanLine({ S }: { S: Scene }) {
  const tl = S.tanLine
  if (!tl) return null
  const W = (p: Vec) => toScreen(S, p)
  const th = S.triD.th * RAD
  const out: React.ReactNode[] = []
  const grow = ease((S.time - tl.since) / 0.9)
  // the tangent runs the height of the board, and no further (never through the phrase)
  const L = layout(S)
  const yTop = toWorld(S, [0, L.board.y0])[1], yBot = toWorld(S, [0, L.board.y1])[1]
  out.push(ln(W([1, yBot * grow]), W([1, yTop * grow]), "tl", { stroke: CHALK, strokeWidth: 2, strokeOpacity: 0.7 }))
  const touch = W([1, 0])
  out.push(<circle key="touch" cx={touch[0]} cy={touch[1]} r={4} fill={CHALK} />)
  if (tl.stretch !== null) {
    const e = ease((S.time - tl.stretch) / 1.0)
    const tip = W([Math.cos(th), Math.sin(th)])
    if (Math.cos(th) > 1e-3) {
      const tanV = Math.tan(th)
      // where the radius, stretched, meets the tangent; above the board it is off screen,
      // so both lines keep their true paths up to the top edge, and an arrow shows they go on
      const off = tanV > yTop
      const meet: Vec = off ? [yTop / tanV, yTop] : [1, tanV]
      out.push(ln(tip, lerpV(tip, W(meet), e), "ext", { stroke: CHALK, strokeWidth: 2, strokeDasharray: "5 6" }))
      if (e >= 1) {
        const T = W([1, Math.min(tanV, yTop)])
        out.push(ln(W([0, 0]), touch, "big-a", { stroke: BLUE, strokeWidth: 3.2, strokeOpacity: 0.9 }))
        out.push(ln(touch, T, "tan", { stroke: ORANGE, strokeWidth: 3.8 }))
        if (!off) out.push(<circle key="T" cx={T[0]} cy={T[1]} r={4.5} fill={ORANGE} />)
        else {
          // as in the angles lesson: an arrow at the edge, pointing at where they meet
          const a = add(T, [-8, 12]), b = add(T, [8, 12]), up = add(T, [0, -2])
          out.push(<path key="T-far" d={`M ${a[0]} ${a[1]} L ${up[0]} ${up[1]} L ${b[0]} ${b[1]} Z`} fill={ORANGE} opacity={0.95} />)
          // and a small one on the stretched radius: it carries on too
          const E = W(meet), u = unitV(sub(E, tip)), nn: Vec = [-u[1], u[0]]
          const ra = add(sub(E, mul(u, 10)), mul(nn, 6)), rb = add(sub(E, mul(u, 10)), mul(nn, -6))
          out.push(<path key="E-far" d={`M ${ra[0]} ${ra[1]} L ${E[0]} ${E[1]} L ${rb[0]} ${rb[1]}`} fill="none" stroke={CHALK} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)
        }
      }
    } else {
      // straight up: the radius runs alongside the tangent and never meets it
      out.push(ln(tip, W([0, yTop]), "ext", { stroke: CHALK, strokeWidth: 2, strokeDasharray: "5 6" }))
    }
  }
  return <>{out}</>
}

function Mirror({ S }: { S: Scene }) {
  const m = S.mirror
  if (!m) return null
  const W = (p: Vec) => toScreen(S, p)
  const out: React.ReactNode[] = []
  const tips = m.map(a => [Math.cos(a * RAD), Math.sin(a * RAD)] as Vec)
  tips.forEach((p, i) => {
    out.push(ln(W([0, 0]), W(p), `r${i}`, { stroke: GREEN, strokeWidth: 2.6 }))
    out.push(ln(W([p[0], 0]), W(p), `h${i}`, { stroke: ORANGE, strokeWidth: 3.6 }))
    out.push(<circle key={`d${i}`} cx={W(p)[0]} cy={W(p)[1]} r={5} fill={ORANGE} />)
  })
  out.push(ln(add(W(tips[1]), [-14, 0]), add(W(tips[0]), [14, 0]), "level", { stroke: ORANGE, strokeWidth: 1.6, strokeDasharray: "4 6", strokeOpacity: 0.9 }))
  return <>{out}</>
}

/** Labels for the tangent and the mirror pair. */
function CircleLabels({ S, L }: { S: Scene; L: Layout }) {
  const W = (p: Vec) => toScreen(S, p)
  const size = L.labelSize
  const out: React.ReactNode[] = []
  const put = (p: Vec, tex: string, key: string, col: string) => out.push(<div key={key} className={styles.label} style={{ ...place(p), color: col, fontSize: size }}><Tex tex={tex} /></div>)
  const tl = S.tanLine
  if (tl && tl.stretch !== null && S.time - tl.stretch > 1) {
    const th = S.triD.th * RAD
    if (Math.cos(th) > 1e-3) {
      const yTop = toWorld(S, [0, L.board.y0])[1]
      const top = Math.min(Math.tan(th), yTop - 0.2)
      put(add(W([1, top / 2]), [size * 1.9, 0]), "\\tan\\theta", "lt", ORANGE)
      put(add(W([0.5, 0]), [0, size * 0.95]), "1", "l1", BLUE)
    }
  }
  if (S.mirror) {
    S.mirror.forEach((a, i) => {
      const r = 0.42, h = a * RAD
      put(W([r * Math.cos(h) + (i ? -0.12 : 0.12), r * Math.sin(h) + 0.14]), `${a}^\\circ`, `ma${i}`, CHALK)
    })
  }
  return <>{out}</>
}

/** A calculator's screen: a small D for degrees, the answer on the right, as a calculator shows it. */
function CalcScreen({ S, L }: { S: Scene; L: Layout }) {
  const cs = S.calcScreen
  if (!cs) return null
  const lines = typeof cs === "function" ? cs(S) : cs
  const centre = S.vis.board.t < 0.5
  const y = centre ? (L.board.y0 + L.board.y1) / 2 : L.eqY
  const size = L.compact ? 21 : 27
  return (
    <div style={{ position: "absolute", left: "50%", top: y, transform: "translate(-50%, -50%)", pointerEvents: "none", animation: "none" }}>
      <div style={{ position: "relative", padding: `${size * 0.85}px ${size * 0.8}px ${size * 0.45}px`, minWidth: size * 8, borderRadius: 14, border: "1.5px solid rgba(240,238,234,0.18)", background: "rgba(240,238,234,0.04)", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: size * 0.3, fontSize: size, color: CHALK }}>
        <span style={{ position: "absolute", left: 10, top: 6, fontSize: 10, color: QUIET, fontWeight: 600 }}>D</span>
        {lines.map((l, k) => (
          <div key={k} style={{ display: "flex", alignSelf: "stretch", alignItems: "baseline", justifyContent: "space-between", gap: size * 1.2 }}>
            <span style={{ fontSize: size * 0.8, color: "#c8c6be" }}><Tex tex={l.q} /></span>
            <span><Tex tex={l.a} /></span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── one tenth of x ───────────────────────────────────────────────────────

function Tenth({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  const t = S.tenth
  if (!t || op < 0.01) return null
  const w = Math.min(520, (L.board.x1 - L.board.x0) * 0.86)
  const x0 = S.w / 2 - w / 2
  const y = (L.board.y0 + L.board.y1) / 2
  const hgt = 30
  const sl = w / 10
  const size = L.labelSize + 4
  const lit = t.ten === null ? 1 : clamp(Math.floor((S.time - t.ten) / 0.2) + 1, 1, 10)
  const all = lit >= 10
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: op }}>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h}>
        {Array.from({ length: 10 }, (_, k) => (
          <rect key={k} x={x0 + k * sl + 1.5} y={y - hgt / 2} width={sl - 3} height={hgt} rx={4}
            fill={PINK} fillOpacity={k < lit ? (all ? 0.55 : 0.45) : 0.06} stroke={PINK} strokeOpacity={k < lit ? 0.9 : 0.35} strokeWidth={1.5} />
        ))}
      </svg>
      <div className={styles.label} style={{ ...place([S.w / 2, y - hgt / 2 - size * 1.1]), color: PINK, fontSize: size }}><Tex tex="x" /></div>
      {t.ten === null && <div className={styles.label} style={{ ...place([x0 + sl / 2, y + hgt / 2 + size * 1.25]), color: PINK, fontSize: size }}><Tex tex="\dfrac{x}{10}" /></div>}
      {t.ten !== null && <div className={styles.label} style={{ ...place([S.w / 2, y + hgt / 2 + size * 1.3]), color: all ? GREEN : CHALK, fontSize: size }}><Tex tex={`${lit} \\times \\dfrac{x}{10}${all ? " = x" : ""}`} /></div>}
    </div>
  )
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L }: { S: Scene; L: Layout }) {
  void L
  return (
    <>
      {S.labs.map(l => {
        const p = S.labD[l.key] ?? l.at
        return (
          <div key={l.key} className={`${styles.label} ${l.pulse ? styles.pulse : ""}`} style={{ ...place(p), color: l.col, fontSize: l.size, opacity: l.op }}>
            <Tex tex={l.tex} />
          </div>
        )
      })}
    </>
  )
}

// ── the rule cards and the move chips ────────────────────────────────────

function Cards({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (op < 0.01 || !S.cards.length) return null
  const rects = cardRects(S, L)
  const tappable = S.mode === "tapCard"
  return (
    <>
      {rects.map(({ fn, r, size }, i) => {
        const pick = S.cardPick?.fn === fn ? S.cardPick : null
        const lit = S.cards[i].lit
        const border = pick?.state === "right" ? GREEN : pick?.state === "wrong" ? PINK : lit ? YELLOW : "rgba(240,238,234,0.16)"
        const sohOp = S.soh === null ? 0 : clamp((S.time - S.soh - i * 0.35) / 0.5, 0, 1)
        const [a, b] = RULE[fn]
        const first = fn === "sin" ? "S" : fn === "cos" ? "C" : "T"
        return (
          <div key={`${fn}-${pick?.at ?? 0}`}>
            <div className={pick?.state === "wrong" ? styles.choiceWrong : undefined}
              style={{ position: "absolute", left: r.x0, top: r.y0, width: r.x1 - r.x0, height: r.y1 - r.y0, borderRadius: 14, border: `1.5px solid ${border}`,
                background: pick?.state === "right" ? "rgba(15,238,137,0.07)" : "rgba(240,238,234,0.03)", opacity: op,
                boxShadow: lit || pick?.state === "right" ? `0 0 22px ${pick?.state === "right" ? "rgba(15,238,137,0.2)" : "rgba(255,240,103,0.16)"}` : "none",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: size, color: CHALK, cursor: tappable ? "pointer" : "default",
                transition: "border-color 260ms, box-shadow 260ms, background 260ms" }}>
              <Tex tex={CARD_TEX[fn]} />
            </div>
            {sohOp > 0 && (
              <div className={styles.label} style={{ ...place([(r.x0 + r.x1) / 2, r.y1 + size * 1.15 - (1 - sohOp) * 8]), fontSize: size * 1.15, opacity: sohOp * op, letterSpacing: "0.08em" }}>
                <Tex tex={`\\text{${first}}\\textcolor{${ROLE_COL[a]}}{\\text{${a}}}\\textcolor{${ROLE_COL[b]}}{\\text{${b}}}`} />
              </div>
            )}
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
  const out: React.ReactNode[] = []
  for (const { id, r } of chipRects(S, L)) {
    const c = S.chips.find(x => x.id === id)!
    const style: React.CSSProperties = {
      position: "absolute", left: 0, top: 0, width: r.x1 - r.x0, height: r.y1 - r.y0, borderRadius: (r.y1 - r.y0) / 2,
      border: `1.5px solid ${YELLOW}`, background: "rgba(255,240,103,0.06)", color: CHALK, fontSize: size, opacity: op,
      display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none",
    }
    // the chip in its place stays as a faint outline while a copy is carried
    // after two wrong moves the right one glows harder (a reminder, not the answer said out loud)
    const hint = S.solve?.hintChip === id
    out.push(<div key={id} className={held === id ? undefined : hint ? styles.pulse : styles.chipBreathe} style={{ ...style, transform: `translate(${r.x0}px, ${r.y0}px)`, opacity: held === id ? op * 0.25 : op, boxShadow: hint ? "0 0 24px rgba(255,240,103,0.45)" : undefined }}><Tex tex={c.tex} /></div>)
    if (held === id && at) out.push(<div key={`${id}-held`} style={{ ...style, transform: `translate(${at[0] - (r.x1 - r.x0) / 2}px, ${at[1] - (r.y1 - r.y0) / 2}px) scale(1.08)`, boxShadow: "0 0 26px rgba(255,240,103,0.35)", zIndex: 7 }}><Tex tex={c.tex} /></div>)
  }
  return <>{out}</>
}

/** A piece of the equation being carried by the finger (the swap shortcut). */
function AtomGhost({ S }: { S: Scene }) {
  const d = S.drag
  if (!d || d.kind !== "atom") return null
  const a = S.eq.atoms[d.id]
  if (!a || a.node.k !== "a") return null
  return (
    <div className={`${styles.label} pl-eq-grab`} style={{ ...place(d.p), color: a.node.col ?? CHALK, fontSize: S.eq.size * 1.08, zIndex: 7 }}>
      <Tex tex={a.node.tex} />
    </div>
  )
}

export const STEPS = [
  "Name the sides.",
  "Pick the rule.",
  "Put the numbers in.",
  "Get $x$ on its own.",
  "Use the calculator.",
]

/** The steps of the method, one line each, over the board. */
function StepsCard({ S, L }: { S: Scene; L: Layout }) {
  if (S.stepsCard === null) return null
  const size = L.compact ? 19 : 25
  const top = L.board.y0 + Math.max(10, (L.board.y1 - L.board.y0 - STEPS.length * size * 1.75) / 2)
  return (
    <div className={styles.stepsCard} style={{ top, fontSize: size }}>
      {STEPS.map((t, k) => (
        <div key={k} style={{ animationDelay: `${(k * 0.35).toFixed(2)}s`, display: "flex", gap: "0.7em", alignItems: "baseline" }}>
          <span style={{ color: GREEN, fontWeight: 600, minWidth: "1em" }}><Tex tex={String(k + 1)} /></span>
          <span style={{ color: CHALK, fontWeight: 500 }}><Phrase text={t} /></span>
        </div>
      ))}
    </div>
  )
}
