"use client"

import styles from "../beats.module.css"
import { Tex, Phrase } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type SideId, type Corner, CHALK, GREEN, YELLOW, BLUE, ORANGE, PINK, QUIET, RAD, graphGeom,
  toScreen, cornerS, poseMap, rgbCss, cardRects, chipRects, CARD_TEX, RULE, ROLE_COL, turnHandle, slideHandle, dragAt,
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
          <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
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
          <Extra S={S} op={vis("extra")} />
          <Arms S={S} op={vis("arms")} />
          <Triangle S={S} />
          <Light S={S} />
          <Halves S={S} />
          <Ghost S={S} />
          <Handles S={S} />
        </g>
      </svg>
      <Tenth S={S} L={L} op={vis("tenth")} />
      <Labels S={S} L={L} />
      <GraphLabels S={S} L={L} op={vis("graph")} />
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
      out.push(ln(a, b, side, { stroke: col, strokeOpacity: tv * (lit ? flashOp(S) : 1), strokeWidth: 3 }))
      if (S.glow.has(side)) {
        out.push(
          <line key={`g${side}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" filter="url(#pl-soft)">
            <animate attributeName="stroke-opacity" values="0.1;0.75;0.1" dur="1.6s" repeatCount="indefinite" />
          </line>,
        )
      }
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
      const a1 = Math.atan2(p[1] - C[1], p[0] - C[0]), a2 = Math.atan2(q[1] - C[1], q[0] - C[0])
      const sweep = turn(a1, a2)
      const lp = Math.hypot(p[0] - C[0], p[1] - C[1]), lq = Math.hypot(q[0] - C[0], q[1] - C[1])
      const r = Math.min(40, lp * 0.3, lq * 0.3) * (0.4 + 0.6 * sp)
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

// ── the unit circle and its graph ────────────────────────────────────────


function Graph({ S }: { S: Scene }) {
  const g = S.graph
  if (!g) return null
  const GRAPH = graphGeom(S)
  const gx = (deg: number): number => GRAPH.x0 + (deg / 90) * GRAPH.w
  const W = (p: Vec) => toScreen(S, p)
  const out: React.ReactNode[] = []
  const O = W([0, 0])
  // the quarter circle, faint, and solid where the arm's tip has been
  const R = W([1, 0])[0] - O[0]
  out.push(<path key="qc" d={arcPath(O, 0, -Math.PI / 2, R, 60)} fill="none" stroke={QUIET} strokeWidth={1.4} strokeDasharray="3 6" />)
  const seen = g.fn === "sin" ? g.seen : g.seenCos
  let path = ""
  for (let d = 0; d <= 90; d++) {
    if (!g.seen[d] && !g.seenCos[d]) continue
    const p = W([Math.cos(d * RAD), Math.sin(d * RAD)])
    path += `${path && (g.seen[d - 1] || g.seenCos[d - 1]) ? " L" : " M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
  }
  if (path) out.push(<path key="trace" d={path} fill="none" stroke={CHALK} strokeWidth={2} strokeLinecap="round" />)
  // axes
  const a0 = W([GRAPH.x0, 0]), a1 = W([GRAPH.x0 + GRAPH.w + 0.12, 0]), y1 = W([GRAPH.x0, 1.1])
  out.push(ln(a0, a1, "gx", { stroke: QUIET, strokeWidth: 1.6 }))
  out.push(ln(a0, y1, "gy", { stroke: QUIET, strokeWidth: 1.6 }))
  const one0 = W([GRAPH.x0, 1]), one1 = W([GRAPH.x0 + GRAPH.w, 1])
  out.push(ln(one0, one1, "g1", { stroke: QUIET, strokeWidth: 1, strokeDasharray: "3 6" }))
  const n90 = W([gx(90), 0])
  out.push(ln(n90, add(n90, [0, 6]), "t90", { stroke: QUIET, strokeWidth: 1.6 }))
  // the curves drawn so far
  const curve = (arr: boolean[], f: (d: number) => number, col: string, key: string) => {
    let d = ""
    for (let k = 0; k <= 90; k++) {
      if (!arr[k]) continue
      const p = W([gx(k), f(k * RAD)])
      d += `${d && arr[k - 1] ? " L" : " M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    }
    if (d) out.push(<path key={key} d={d} fill="none" stroke={col} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />)
  }
  curve(g.seen, Math.sin, ORANGE, "csin")
  curve(g.seenCos, Math.cos, BLUE, "ccos")
  // the side being carried across, standing on the graph at this angle
  const th = S.triD.th
  const x = gx(th)
  if (g.fn === "sin") {
    const tip = W([Math.cos(th * RAD), Math.sin(th * RAD)])
    const top = W([x, Math.sin(th * RAD)])
    out.push(ln(tip, top, "carry", { stroke: ORANGE, strokeWidth: 1.4, strokeDasharray: "4 5", strokeOpacity: 0.8 }))
    out.push(ln(W([x, 0]), top, "bar", { stroke: ORANGE, strokeWidth: 3.4 }))
    out.push(<circle key="dot" cx={top[0]} cy={top[1]} r={4.5} fill={ORANGE} />)
  } else {
    const top = W([x, Math.cos(th * RAD)])
    out.push(ln(W([x, 0]), top, "bar", { stroke: BLUE, strokeWidth: 3.4 }))
    out.push(<circle key="dot" cx={top[0]} cy={top[1]} r={4.5} fill={BLUE} />)
  }
  void seen
  return <>{out}</>
}

function GraphLabels({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (!S.graph || op < 0.01) return null
  const GRAPH = graphGeom(S)
  const gx = (deg: number): number => GRAPH.x0 + (deg / 90) * GRAPH.w
  const W = (p: Vec) => toScreen(S, p)
  const size = L.labelSize - 2
  const put = (p: Vec, tex: string, key: string, col = QUIET) => (
    <div key={key} className={styles.label} style={{ ...place(p), color: col, fontSize: size, opacity: op }}><Tex tex={tex} /></div>
  )
  return (
    <>
      {put(add(W([GRAPH.x0, 0]), [0, size * 1.1]), "0^\\circ", "l0")}
      {put(add(W([gx(90), 0]), [0, size * 1.1]), "90^\\circ", "l90")}
      {put(add(W([GRAPH.x0, 1]), [-size * 0.9, 0]), "1", "l1")}
      {put(add(W([GRAPH.x0 + GRAPH.w * 0.5, 1.1]), [0, -4]), S.graph.fn === "sin" ? "\\sin\\theta" : "\\cos\\theta", "lf", S.graph.fn === "sin" ? ORANGE : BLUE)}
    </>
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
