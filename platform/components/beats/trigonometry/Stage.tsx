"use client"

import styles from "../beats.module.css"
import { Tex, Phrase } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type SideId, type Corner, type Machine, CHALK, GREEN, YELLOW, BLUE, ORANGE, PINK, QUIET, RAD, graphGeom,
  toScreen, toWorld, layout, cornerS, poseMap, rgbCss, cardRects, chipRects, CARD_TEX, RULE, ROLE_COL, turnHandle, slideHandle, dragAt,
  angGeom, sightEnd, sightBaseEnd, sightDeg, MACHINE_LEG, MACHINE_HOLD,
} from "./scene"
import { measure } from "../equation"

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
          <ExtraAngles S={S} L={L} />
          <Reach S={S} />
          <Arms S={S} op={vis("arms")} />
          <Family S={S} />
          <Outline S={S} />
          <Triangle S={S} />
          <Marks S={S} />
          <Door S={S} />
          <TanLine S={S} />
          <Mirror S={S} />
          <ZoomInset S={S} />
          <Light S={S} />
          <Halves S={S} />
          <Ghost S={S} />
          <Sight S={S} />
          <ZPath S={S} />
          <Handles S={S} />
        </g>
      </svg>
      <Machines S={S} L={L} />
      <Tenth S={S} L={L} op={vis("tenth")} />
      <Labels S={S} L={L} />
      <GraphLabels S={S} L={L} op={vis("graph")} />
      <CircleLabels S={S} L={L} />
      <PartNumbers S={S} L={L} />
      <ZoomLabels S={S} L={L} />
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
  if (S.mode === "sight") { const e = sightEnd(S); if (e) out.push(halo(e, "hsight", d?.kind === "sight")) }
  if (S.mode === "tapPoint") for (const n of S.tapPts ?? []) {
    const p = cornerS(S, n)
    out.push(
      <circle key={`tp${n}`} cx={p[0]} cy={p[1]} r={14} fill="none" stroke={YELLOW} strokeWidth={1.8}>
        <animate attributeName="r" values="10;26;10" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.1;0.9" dur="2s" repeatCount="indefinite" />
      </circle>,
    )
  }
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
      {(e.arrows ?? []).map(([a, b], k) => <Chevron key={`a${k}`} a={at(a)} b={at(b)} />)}
    </g>
  )
}

/** A parallel mark: an arrowhead at a line's middle, pointing from a to b. */
function Chevron({ a, b, col = CHALK }: { a: Vec; b: Vec; col?: string }) {
  const m = lerpV(a, b, 0.5), u = unitV(sub(b, a)), n: Vec = [-u[1], u[0]]
  const tip = add(m, mul(u, 6)), p1 = add(sub(m, mul(u, 4)), mul(n, 6)), p2 = add(sub(m, mul(u, 4)), mul(n, -6))
  return <path d={`M ${p1[0]} ${p1[1]} L ${tip[0]} ${tip[1]} L ${p2[0]} ${p2[1]}`} fill="none" stroke={col} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
}

// ── angles on the figure, the line of sight, alternate angles ────────────

function ExtraAngles({ S, L }: { S: Scene; L: Layout }) {
  if (!S.angs.length) return null
  const out: React.ReactNode[] = []
  for (const g of S.angs) {
    const G = angGeom(S, g, L.labelSize)
    const col = g.col ?? CHALK
    if (g.square) {
      const r = Math.min(15, G.r * 0.7)
      const u: Vec = [Math.cos(G.a1), Math.sin(G.a1)], v: Vec = [Math.cos(G.a1 + G.sweep), Math.sin(G.a1 + G.sweep)]
      const p1 = add(G.C, mul(u, r)), p2 = add(add(G.C, mul(u, r)), mul(v, r)), p3 = add(G.C, mul(v, r))
      out.push(<path key={g.id} d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={g.col ?? QUIET} strokeWidth={2} strokeLinejoin="round" />)
      if (g.pulse) out.push(<polygon key={`${g.id}-p`} points={poly([G.C, p1, p2, p3])} fill={col} fillOpacity={0.3} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></polygon>)
      continue
    }
    const tappable = S.mode === "tapAngle" && (!S.tapAngs || S.tapAngs.includes(g.id))
    out.push(
      <g key={g.id}>
        <path d={sectorPath(G.C, G.a1, G.sweep, G.r, 40)} fill={col} fillOpacity={g.quiet ? 0.1 : 0.14} />
        {tappable && <path d={sectorPath(G.C, G.a1, G.sweep, G.r + 6, 40)} fill={YELLOW} fillOpacity={0.12}><animate attributeName="fill-opacity" values="0.06;0.3;0.06" dur="2s" repeatCount="indefinite" /></path>}
        {tappable && <path d={arcPath(G.C, G.a1, G.sweep, G.r + 6, 40)} fill="none" stroke={YELLOW} strokeWidth={2} strokeLinecap="round"><animate attributeName="stroke-opacity" values="0.35;1;0.35" dur="2s" repeatCount="indefinite" /></path>}
        {!g.quiet && <path d={arcPath(G.C, G.a1, G.sweep, G.r, 40)} fill="none" stroke={col} strokeWidth={2.2} strokeLinecap="round" />}
        {g.pulse && <path d={sectorPath(G.C, G.a1, G.sweep, G.r + 3, 40)} fill={YELLOW} fillOpacity={0.25} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></path>}
      </g>,
    )
  }
  return <>{out}</>
}

/** A little eye at a point, looking along a direction (screen radians). */
function Eye({ at, dir }: { at: Vec; dir: number }) {
  // an almond on the point itself, its pupil turned the way it looks
  const u: Vec = [Math.cos(dir), Math.sin(dir)], n: Vec = [-u[1], u[0]]
  const back = sub(at, mul(u, 13)), front = add(at, mul(u, 13))
  const top = add(at, mul(n, 10)), bot = sub(at, mul(n, 10))
  const d = `M ${back[0]} ${back[1]} Q ${top[0]} ${top[1]} ${front[0]} ${front[1]} Q ${bot[0]} ${bot[1]} ${back[0]} ${back[1]} Z`
  const pupil = add(at, mul(u, 4))
  return (
    <g>
      <path d={d} fill="#0d1216" stroke={YELLOW} strokeWidth={1.8} strokeLinejoin="round" />
      <circle cx={pupil[0]} cy={pupil[1]} r={4} fill={YELLOW} />
    </g>
  )
}

function Sight({ S }: { S: Scene }) {
  const g = S.sight
  if (!g) return null
  const C = cornerS(S, g.from)
  const B = sightBaseEnd(S)!
  const out: React.ReactNode[] = []
  if (g.pulseBase) {
    out.push(
      <line key="bg" x1={C[0]} y1={C[1]} x2={B[0]} y2={B[1]} stroke={YELLOW} strokeWidth={8} strokeLinecap="round" filter="url(#pl-soft)">
        <animate attributeName="stroke-opacity" values="0.1;0.7;0.1" dur="1.6s" repeatCount="indefinite" />
      </line>,
    )
  }
  out.push(ln(C, B, "base", { strokeWidth: 2, strokeOpacity: 0.8, strokeDasharray: "6 7" }))
  if (g.arrows) out.push(<Chevron key="ch" a={C} b={B} />)
  if (g.ray) {
    const E = sightEnd(S)!
    const a1 = -g.base * RAD, sweep = turn(a1, -sightDeg(g) * RAD)
    out.push(<path key="sec" d={sectorPath(C, a1, sweep, 46, 40)} fill={CHALK} fillOpacity={0.12} />)
    out.push(<path key="arc" d={arcPath(C, a1, sweep, 46, 40)} fill="none" stroke={CHALK} strokeWidth={2.2} strokeLinecap="round" />)
    if (g.pulseArc) out.push(<path key="arcp" d={sectorPath(C, a1, sweep, 49, 40)} fill={YELLOW} fillOpacity={0.25} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></path>)
    const lit = S.flashGood > 0 && S.touched?.kind === "tri"
    out.push(ln(C, E, "ray", { stroke: lit ? GREEN : CHALK, strokeWidth: 2.8, strokeOpacity: lit ? flashOp(S) : 1 }))
  }
  if (g.eye) out.push(<Eye key="eye" at={C} dir={g.ray ? -sightDeg(g) * RAD : -g.base * RAD} />)
  return <>{out}</>
}

/** An opposite that wants to be longer than the hypotenuse: the height it would need, dashed in pink. */
function Reach({ S }: { S: Scene }) {
  const r = S.reach
  if (!r) return null
  const t = S.triD
  const op = clamp((S.time - r.since) / 0.5, 0, 1)
  const a = toScreen(S, poseMap(t.pose, [-t.h * 0.15, r.want])), b = toScreen(S, poseMap(t.pose, [t.h * 1.1, r.want]))
  return <g opacity={op}>{ln(a, b, "reach", { stroke: PINK, strokeWidth: 2.4, strokeDasharray: "7 7" })}</g>
}

/** A Z along three lines: two parallels and the line across them, drawn on and glowing. */
function ZPath({ S }: { S: Scene }) {
  const z = S.zpath
  if (!z) return null
  const P = z.pts.map(n => cornerS(S, n))
  const lens = P.slice(1).map((p, i) => Math.hypot(p[0] - P[i][0], p[1] - P[i][1]))
  const total = lens.reduce((a, b) => a + b, 0) || 1
  const e = ease((S.time - z.since) / 1.6)
  let left = e * total
  let d = `M ${P[0][0]} ${P[0][1]}`
  for (let i = 1; i < P.length && left > 0; i++) {
    const f = Math.min(1, left / lens[i - 1])
    const q = lerpV(P[i - 1], P[i], f)
    d += ` L ${q[0]} ${q[1]}`
    left -= lens[i - 1]
  }
  return (
    <g>
      <path d={d} fill="none" stroke={YELLOW} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.35} filter="url(#pl-soft)">
        {e >= 1 && <animate attributeName="stroke-opacity" values="0.15;0.55;0.15" dur="1.6s" repeatCount="indefinite" />}
      </path>
      <path d={d} fill="none" stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
}

// ── function machines ────────────────────────────────────────────────────

const LEG = MACHINE_LEG
const HOLD = MACHINE_HOLD
const PER_BOX = 2 * LEG + HOLD

/**
 * Function machines: a value waits at one end, goes into a box, and comes
 * out changed at the other end. Running backwards it starts at the right.
 */
function Machines({ S, L }: { S: Scene; L: Layout }) {
  const ms = S.machines
  if (!ms.length) return null
  const size = L.eqSize * (S.machinesAt === "board" ? 1.15 : ms.length > 1 ? 0.85 : 1)
  const rowH = size * (S.machinesAt === "board" ? 3.2 : 2.6)
  const cy0 = S.machinesAt === "eq" ? L.eqY : (L.board.y0 + L.board.y1) / 2
  const out: React.ReactNode[] = []
  ms.forEach((m, mi) => {
    const cy = cy0 + (mi - (ms.length - 1) / 2) * rowH
    out.push(<MachineRow key={mi} S={S} m={m} cy={cy} size={size} k={mi} />)
  })
  return <>{out}</>
}

function MachineRow({ S, m, cy, size, k }: { S: Scene; m: Machine; cy: number; size: number; k: number }) {
  const n = m.boxes.length
  // the slots and boxes in travel order
  const slotW = m.vals.map(v => Math.max(measure(v.tex, size).w + size * 0.6, size * 2.4))
  const boxW = m.boxes.map(b => measure(b.tex, size).w + size * 1.5)
  const gap = size * 1.5
  let total = 0
  for (let i = 0; i <= n; i++) { total += slotW[i]; if (i < n) total += boxW[i] + 2 * gap }
  const sc = Math.min(1, (S.w - 24) / total)
  const W = (x: number) => x * sc
  // x centres, left to right for dir 1, right to left for dir -1
  const slotX: number[] = [], boxX: number[] = []
  let x = 0
  for (let i = 0; i <= n; i++) {
    slotX.push(x + slotW[i] / 2)
    x += slotW[i]
    if (i < n) { x += gap; boxX.push(x + boxW[i] / 2); x += boxW[i] + gap }
  }
  const left = S.w / 2 - W(total) / 2
  const place1 = (cx: number) => (m.dir === 1 ? left + W(cx) : left + W(total - cx))
  const sX = slotX.map(place1), bX = boxX.map(place1)
  const t = m.since === null ? -1 : S.time - m.since
  // where the value is: resting in a slot, on its way, or inside a box
  let pos = sX[0], inside = -1, shown = 0
  if (t >= 0) {
    const kk = Math.min(n, Math.floor(t / PER_BOX))
    const u = t - kk * PER_BOX
    if (kk >= n) { pos = sX[n]; shown = n }
    else if (u < LEG) { pos = sX[kk] + (bX[kk] - sX[kk]) * ease(u / LEG); shown = kk }
    else if (u < LEG + HOLD) { pos = bX[kk]; inside = kk; shown = kk }
    else { pos = bX[kk] + (sX[kk + 1] - bX[kk]) * ease((u - LEG - HOLD) / LEG); shown = kk + 1 }
  }
  const out: React.ReactNode[] = []
  const svg: React.ReactNode[] = []
  const bh = size * 1.7
  for (let i = 0; i < n; i++) {
    const lit = inside === i
    const bx = bX[i], bw = W(boxW[i])
    svg.push(<rect key={`b${i}`} x={bx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={12} fill={lit ? "rgba(255,240,103,0.08)" : "rgba(240,238,234,0.04)"} stroke={lit ? YELLOW : "rgba(240,238,234,0.35)"} strokeWidth={1.6} />)
    // arrows into and out of the box, the way the machine runs (or as asked)
    const legs: [number, number, number, number][] = [[sX[i], bx, W(slotW[i]), bw], [bx, sX[i + 1], bw, W(slotW[i + 1])]]
    legs.forEach(([a, b, wa, wb], j) => {
      const d = Math.sign(b - a)
      const s0 = a + d * (wa / 2 + 4), s1 = b - d * (wb / 2 + 4)
      const [p, q] = (m.arrows ?? m.dir) === m.dir ? [s0, s1] : [s1, s0]
      const dx = Math.sign(q - p)
      svg.push(<line key={`l${i}${j}`} x1={p} y1={cy} x2={q} y2={cy} stroke={QUIET} strokeWidth={1.8} strokeLinecap="round" />)
      svg.push(<path key={`h${i}${j}`} d={`M ${q - dx * 7} ${cy - 5} L ${q} ${cy} L ${q - dx * 7} ${cy + 5}`} fill="none" stroke={QUIET} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />)
    })
    const b = m.boxes[i]
    out.push(<div key={`bt${i}`} className={styles.label} style={{ ...place([bx, cy]), fontSize: size * sc, color: b.col ?? CHALK }}><Tex tex={b.tex} /></div>)
  }
  // values resting in the slots they have been through
  for (let i = 0; i <= n; i++) {
    const waiting = i === 0 && t < 0
    const v = m.vals[i]
    if (waiting) out.push(<div key={`v${i}`} className={styles.label} style={{ ...place([sX[i], cy]), fontSize: size * sc, color: v.col ?? CHALK }}><Tex tex={v.tex} /></div>)
    else if (t >= 0 && i < shown) out.push(<div key={`v${i}`} className={styles.label} style={{ ...place([sX[i], cy]), fontSize: size * sc, color: v.col ?? CHALK, opacity: 0.4 }}><Tex tex={v.tex} /></div>)
    if (i === n && t < 0 && m.ask) out.push(<div key="ask" className={styles.label} style={{ ...place([sX[n], cy]), fontSize: size * sc, color: PINK }}><Tex tex="?" /></div>)
  }
  if (t >= 0) {
    const v = m.vals[shown]
    out.push(<div key={`tok${k}`} className={styles.label} style={{ ...place([pos, cy]), fontSize: size * sc * (inside >= 0 ? 0.8 : 1), color: v.col ?? CHALK, opacity: inside >= 0 ? 0.55 : 1 }}><Tex tex={v.tex} /></div>)
  }
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} style={{ position: "absolute", left: 0, top: 0, pointerEvents: "none" }} aria-hidden>{svg}</svg>
      {out}
    </>
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

// ── the ten parts, counted; and a magnifier on a height ──────────────────

/** Numbers 1 to 10 beside the hypotenuse's parts, from the top corner; the ones the opposite covers light up. */
function PartNumbers({ S, L }: { S: Scene; L: Layout }) {
  const pr = S.parts
  if (!pr || S.marks === null || S.triD.drop < 0.97) return null
  const V = cornerS(S, "V"), F = cornerS(S, "F"), P = cornerS(S, "P")
  const mid: Vec = [(V[0] + F[0] + P[0]) / 3, (V[1] + F[1] + P[1]) / 3]
  const d = unitV(sub(V, P))
  let n: Vec = [-d[1], d[0]]
  if ((mid[0] - P[0]) * n[0] + (mid[1] - P[1]) * n[1] > 0) n = mul(n, -1)
  const size = Math.max(12, L.labelSize - 4)
  const covered = 10 * Math.sin(S.triD.th * RAD)
  const out: React.ReactNode[] = []
  for (let k = 1; k <= 10; k++) {
    const op = clamp((S.time - S.marks - k * 0.1) / 0.3, 0, 1)
    if (op <= 0) continue
    let lit = 0
    if (pr.count) {
      const upTo = Math.min(pr.count.n, Math.floor((S.time - pr.count.since) / 0.45) + 1)
      lit = S.time >= pr.count.since && k <= upTo ? 1 : 0
    } else if (pr.live) lit = clamp(covered - (k - 1), 0, 1)
    const p = add(lerpV(P, V, (k - 0.5) / 10), mul(n, size * 0.85 + 7))
    const col = lit >= 1 ? ORANGE : lit > 0 ? `color-mix(in srgb, ${ORANGE} ${Math.round(lit * 100)}%, ${QUIET})` : QUIET
    out.push(<div key={`pn${k}`} className={styles.label} style={{ ...place(p), color: col, fontSize: size, opacity: op, fontWeight: lit >= 1 ? 600 : 400 }}><Tex tex={String(k)} /></div>)
  }
  return <>{out}</>
}

/** Where the magnifier sits: in the waves' room, beside the circle or under it. */
function zoomBox(S: Scene) {
  const G = graphGeom(S)
  const a = toScreen(S, [G.x0, G.y0 + 1.1]), b = toScreen(S, [G.x0 + G.w, G.y0 - 1.1])
  const w = Math.min(b[0] - a[0], 250), h = b[1] - a[1]
  return { x0: (a[0] + b[0]) / 2 - w / 2, y0: a[1], w, h }
}
const zoomRange = (v: number) => { const lo = Math.floor((v - 0.045) * 100) / 100; return { lo, hi: lo + 0.09 } }

/** The magnifier: a lens on the point, and beside it the height against a scale in hundredths. */
function ZoomInset({ S }: { S: Scene }) {
  if (S.zoom === null || !S.fullTurn) return null
  const t = S.time - S.zoom
  const e = ease(t / 0.8), grow = ease((t - 0.7) / 0.9)
  const th = S.triD.th * RAD, v = Math.sin(th)
  const tip = toScreen(S, [Math.cos(th), Math.sin(th)])
  const box = zoomBox(S)
  const { lo, hi } = zoomRange(v)
  const Y = (val: number) => box.y0 + box.h - ((val - lo) / (hi - lo)) * box.h
  const sx = box.x0 + box.w * 0.34, bx = box.x0 + box.w * 0.62
  const s = 0.25 + 0.75 * e
  const out: React.ReactNode[] = []
  out.push(<circle key="lens" cx={tip[0]} cy={tip[1]} r={26 * e} fill="none" stroke={CHALK} strokeWidth={1.6} strokeOpacity={0.8} />)
  out.push(ln(add(tip, [0, -26]), [box.x0, box.y0 + 10], "c1", { stroke: CHALK, strokeWidth: 1, strokeOpacity: 0.3 * e, strokeDasharray: "3 5" }))
  out.push(ln(add(tip, [0, 26]), [box.x0, box.y0 + box.h - 10], "c2", { stroke: CHALK, strokeWidth: 1, strokeOpacity: 0.3 * e, strokeDasharray: "3 5" }))
  const inner: React.ReactNode[] = []
  inner.push(<rect key="box" x={box.x0} y={box.y0} width={box.w} height={box.h} rx={14} fill="#0d1216" stroke={CHALK} strokeOpacity={0.25} strokeWidth={1.4} />)
  inner.push(ln([sx, Y(lo) - 4], [sx, Y(hi) + 4], "scale", { stroke: QUIET, strokeWidth: 1.6 }))
  for (let k = 0; k <= 18; k++) {
    const val = lo + k * 0.005
    const len = k % 2 === 0 ? 11 : 5
    inner.push(ln([sx - len, Y(val)], [sx, Y(val)], `tk${k}`, { stroke: QUIET, strokeWidth: 1.4 }))
  }
  const top = Y(lo) + (Y(v) - Y(lo)) * grow
  inner.push(ln([bx, Y(lo) + 2], [bx, top], "bar", { stroke: ORANGE, strokeWidth: 5, strokeLinecap: "butt" }))
  if (grow >= 1) {
    inner.push(ln([sx, Y(v)], [bx, Y(v)], "level", { stroke: ORANGE, strokeWidth: 1.4, strokeDasharray: "4 4" }))
    inner.push(<circle key="topdot" cx={bx} cy={Y(v)} r={4.5} fill={ORANGE} />)
  }
  out.push(<g key="inset" opacity={e} transform={`translate(${tip[0]} ${tip[1]}) scale(${s}) translate(${-tip[0]} ${-tip[1]})`}>{inner}</g>)
  return <>{out}</>
}

function ZoomLabels({ S, L }: { S: Scene; L: Layout }) {
  if (S.zoom === null || !S.fullTurn) return null
  const t = S.time - S.zoom
  const e = ease(t / 0.8), grow = ease((t - 0.7) / 0.9)
  if (e < 0.98) return null
  const v = Math.sin(S.triD.th * RAD)
  const box = zoomBox(S)
  const { lo } = zoomRange(v)
  const Y = (val: number) => box.y0 + box.h - ((val - lo) / 0.09) * box.h
  const sx = box.x0 + box.w * 0.34, bx = box.x0 + box.w * 0.62
  const size = Math.max(11, L.labelSize - 5)
  const out: React.ReactNode[] = []
  for (let k = 0; k <= 9; k++) {
    const val = lo + k * 0.01
    out.push(<div key={`zl${k}`} className={styles.label} style={{ ...place([sx - 16 - size * 1.1, Y(val)]), color: QUIET, fontSize: size }}><Tex tex={val.toFixed(2)} /></div>)
  }
  if (grow >= 1) out.push(<div key="zv" className={styles.label} style={{ ...place([bx + size * 2.4, Y(v)]), color: ORANGE, fontSize: size + 5, fontWeight: 600 }}><Tex tex={v.toFixed(3)} /></div>)
  return <>{out}</>
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
  const put = (p: Vec, tex: string, key: string, col: string, pulse = false) => out.push(<div key={key} className={`${styles.label}${pulse ? ` ${styles.pulse}` : ""}`} style={{ ...place(p), color: col, fontSize: size }}><Tex tex={tex} /></div>)
  const tl = S.tanLine
  if (tl && tl.stretch !== null && S.time - tl.stretch > 1) {
    const th = S.triD.th * RAD
    if (Math.cos(th) > 1e-3) {
      const yTop = toWorld(S, [0, L.board.y0])[1]
      const top = Math.min(Math.tan(th), yTop - 0.2)
      put(add(W([1, top / 2]), [size * 1.9, 0]), tl.tex ?? "\\tan\\theta", "lt", ORANGE, S.pulseLabs.has("tan-side"))
      put(add(W([0.5, 0]), [0, size * 0.95]), "1", "l1", BLUE, S.pulseLabs.has("tan-1"))
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
            <span style={{ fontSize: size * 0.8, color: "#c8c6be", whiteSpace: "nowrap" }}><Tex tex={l.q} /></span>
            <span style={{ whiteSpace: "nowrap" }}><Tex tex={l.a} /></span>
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
  const steps = S.stepsList ?? STEPS
  const size = L.compact ? 19 : 25
  const top = L.board.y0 + Math.max(10, (L.board.y1 - L.board.y0 - steps.length * size * 1.75) / 2)
  return (
    <div className={styles.stepsCard} style={{ top, fontSize: size }}>
      {steps.map((t, k) => (
        <div key={k} style={{ animationDelay: `${(k * 0.35).toFixed(2)}s`, display: "flex", gap: "0.7em", alignItems: "baseline" }}>
          <span style={{ color: GREEN, fontWeight: 600, minWidth: "1em" }}><Tex tex={String(k + 1)} /></span>
          <span style={{ color: CHALK, fontWeight: 500 }}><Phrase text={t} /></span>
        </div>
      ))}
    </div>
  )
}
