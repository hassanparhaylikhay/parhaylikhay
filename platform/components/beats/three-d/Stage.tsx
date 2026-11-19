"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, clamp, lerpV, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type V3, CHALK, GREEN, YELLOW, QUIET, PINK, ORANGE,
  ptS, proj, p3, toCam, faceFront, segHidden, edgesOf, segKey, dirCol, arcGeom, arcPx, chipRects, dragAt,
  vsub, vadd, vmul, vunit, vdot, vcross, facesEye,
} from "./scene"
import { curvedCloud, curvedRings, hull, foldNet } from "./solids"

/**
 * Draws the 3D board. Pure: everything comes from the scene. The solid is
 * glass: faces lightly shaded, the ones at the back drawn first, so a line
 * through the inside sits behind the front glass; edges at the back are
 * dashed. Every letter and number is KaTeX over the SVG.
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
          <Floor S={S} op={vis("floor")} />
          <NetView S={S} op={vis("solid")} />
          <CurvedView S={S} op={vis("solid")} />
          <Solid S={S} op={vis("solid")} />
          <Light S={S} />
          <Marks S={S} op={vis("marks")} />
          <Targets S={S} />
          <Handles S={S} />
          <Flats S={S} op={vis("flats")} />
        </g>
      </svg>
      <Labels S={S} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      <Chips S={S} L={L} op={vis("chips")} />
      <Carried S={S} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px` }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const poly = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)
const breathe = (dur = "1.8s") => <animate attributeName="opacity" values="0.25;1;0.25" dur={dur} repeatCount="indefinite" />

/** The floor: a faint grid round the solid's foot (fainter from below). */
function Floor({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01 || !S.floorGrid) return null
  const pts = Object.values(S.P3)
  if (!pts.length) return null
  const g = S.floorGrid
  const x0 = Math.floor(Math.min(...pts.map(p => p[0])) / g) * g - g * 2, x1 = Math.ceil(Math.max(...pts.map(p => p[0])) / g) * g + g * 2
  const y0 = Math.floor(Math.min(...pts.map(p => p[1])) / g) * g - g * 2, y1 = Math.ceil(Math.max(...pts.map(p => p[1])) / g) * g + g * 2
  const lines: React.ReactNode[] = []
  const below = S.pitchD < 0
  // lines fade out toward the edge of the patch
  const fade = (t: number) => 1 - Math.abs(t - 0.5) * 1.6
  let i = 0
  for (let x = x0; x <= x1 + 1e-6; x += g) {
    const a = proj(S, [x, y0, 0]), b = proj(S, [x, y1, 0])
    lines.push(<line key={`x${i++}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={0.07 * fade((x - x0) / (x1 - x0))} strokeWidth={1} />)
  }
  for (let y = y0; y <= y1 + 1e-6; y += g) {
    const a = proj(S, [x0, y, 0]), b = proj(S, [x1, y, 0])
    lines.push(<line key={`y${i++}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={0.07 * fade((y - y0) / (y1 - y0))} strokeWidth={1} />)
  }
  return <g opacity={op * (below ? 0.5 : 1)}>{lines}</g>
}

/** How much light a face catches (light from above, to the left): its glass is a little brighter. */
function shade(S: Scene, face: string[]): number {
  const P = face.map(n => toCam(S, p3(S, n)))
  let n = vunit(vcross(vsub(P[1], P[0]), vsub(P[2], P[0])))
  const mid = vmul(P.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / P.length)
  const all = [...new Set((S.faces ?? []).flat())].map(x => toCam(S, p3(S, x)))
  const c = vmul(all.reduce((a, b) => vadd(a, b), [0, 0, 0] as V3), 1 / Math.max(1, all.length))
  if (vdot(n, vsub(mid, c)) < 0) n = vmul(n, -1)
  const light = vunit([-0.45, 0.8, 0.4])
  return clamp(0.5 + 0.5 * vdot(n, light), 0, 1)
}

/**
 * The solid: faces at the back, then lines inside it and lit triangles,
 * then the front glass, then the edges (dashed where hidden).
 */
function Solid({ S, op }: { S: Scene; op: number }) {
  const out: React.ReactNode[] = []
  const faces = S.faces ?? []
  const depth = (f: string[]) => f.reduce((s, n) => s + toCam(S, p3(S, n))[2], 0) / f.length
  const front = faces.filter(f => faceFront(S, f)).sort((a, b) => depth(a) - depth(b))
  const back = faces.filter(f => !faceFront(S, f))
  // while a triangle is lifted out, the rest of the solid fades back
  const fade = 1 - S.dimMax * S.dim.v
  for (const [i, f] of back.entries()) out.push(<polygon key={`bf${i}`} points={poly(f.map(n => ptS(S, n)))} fill={CHALK} fillOpacity={0.025 * fade} stroke="none" />)

  // edges at the back: dashed
  const edges = edgesOf(S)
  for (const [a, b] of edges) {
    if (!segHidden(S, a, b)) continue
    const key = segKey(a, b), A = ptS(S, a), B = ptS(S, b)
    const col = S.edgeCol[key]
    out.push(<line key={`he${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col ?? CHALK} strokeOpacity={(col ? 0.9 : 0.45) * fade} strokeWidth={col ? 2.6 : 1.7} strokeDasharray="5 6" strokeLinecap="round" />)
  }

  // lit triangles and lines through the inside, behind the front glass
  for (const T of S.tris) {
    const P = T.pts.map(n => ptS(S, n))
    out.push(
      <polygon key={`tri${T.id}`} points={poly(P)} fill={T.col} fillOpacity={T.sheet ? 0.2 : 0.13} stroke={T.sheet ? T.col : "none"} strokeOpacity={0.35} strokeWidth={1.2} strokeLinejoin="round">
        {T.pulse && <animate attributeName="fill-opacity" values="0.06;0.26;0.06" dur="1.8s" repeatCount="indefinite" />}
      </polygon>,
    )
  }
  // the triangle being lifted, lit as the solid turns to face it
  if (S.liftLit && S.dim.v > 0.01) {
    const P = S.liftLit.map(n => ptS(S, n))
    out.push(<polygon key="lift" points={poly(P)} fill={YELLOW} fillOpacity={0.2 * S.dim.v} stroke={YELLOW} strokeOpacity={0.75 * S.dim.v} strokeWidth={2} strokeLinejoin="round" />)
  }
  if (S.regions && S.regionLit) {
    const r = S.regions.find(x => x.id === S.regionLit)
    if (r) out.push(<polygon key="rlit" points={poly(r.pts.map(n => ptS(S, n)))} fill={YELLOW} fillOpacity={0.12} stroke="none" />)
  }
  for (const [key, sg] of Object.entries(S.segs)) {
    if (sg.grow.v < 0.005) continue
    const A = ptS(S, sg.a), B0 = ptS(S, sg.b), B = lerpV(A, B0, sg.grow.v)
    const col = sg.col ?? dirCol(S, sg.a, sg.b)
    const lit = S.flashGood > 0 && S.touched === key
    const hidden = segHidden(S, sg.a, sg.b)
    if (sg.glow) out.push(<line key={`sgg${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.6;0.1" dur="1.6s" repeatCount="indefinite" /></line>)
    out.push(
      <line key={`sg${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={lit ? GREEN : col} strokeOpacity={(sg.faint ? 0.45 : 1) * (lit ? flashOp(S) : 1)} strokeWidth={sg.faint ? 1.6 : 3} strokeLinecap="round"
        strokeDasharray={sg.faint || (hidden && col === CHALK) ? "5 6" : undefined} />,
    )
  }

  // faces the student has counted, lit in their colour (fainter round the back)
  for (const [k, col] of Object.entries(S.faceLit)) {
    const f = faces[+k]
    if (!f) continue
    out.push(<polygon key={`lit${k}`} points={poly(f.map(n => ptS(S, n)))} fill={col} fillOpacity={(faceFront(S, f) ? 0.3 : 0.12) * fade} stroke="none" />)
  }
  for (const [i, f] of front.entries()) {
    const s = shade(S, f)
    out.push(<polygon key={`ff${i}`} points={poly(f.map(n => ptS(S, n)))} fill={CHALK} fillOpacity={(0.03 + 0.06 * s) * fade} stroke="none" />)
  }
  // edges in front: solid
  for (const [a, b] of edges) {
    if (segHidden(S, a, b)) continue
    const key = segKey(a, b), A = ptS(S, a), B = ptS(S, b)
    const col = S.edgeCol[key]
    out.push(<line key={`e${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col ?? CHALK} strokeOpacity={col ? 1 : fade} strokeWidth={col ? 3 : 2.2} strokeLinecap="round" />)
  }
  for (const n of S.dots) {
    const P = ptS(S, n)
    out.push(<circle key={`dot${n}`} cx={P[0]} cy={P[1]} r={3.6} fill={CHALK} />)
  }
  return <g opacity={op}>{out}</g>
}

/**
 * A solid with a curved surface: its outline (the shape round points all
 * over it), and its rings, solid where they can be seen and dashed round the back.
 */
function CurvedView({ S, op }: { S: Scene; op: number }) {
  const c = S.curved
  if (!c) return null
  const out: React.ReactNode[] = []
  const H = hull(curvedCloud(c).map(p => proj(S, p)))
  out.push(<polygon key="body" points={poly(H)} fill={CHALK} fillOpacity={0.07} stroke={CHALK} strokeWidth={2.4} strokeLinejoin="round" />)
  curvedRings(c).forEach((rg, i) => {
    const mid: V3 = [0, 0, rg.pts[0][2]]
    const capSeen = rg.cap ? facesEye(S, mid, rg.cap) : false
    const seen = rg.pts.map((p, j) => capSeen || facesEye(S, p, rg.side[j]))
    const P = rg.pts.map(p => proj(S, p))
    // runs of seen and unseen points, each drawn as one path
    const n = P.length
    let start = 0
    while (start < n && seen[start] === seen[(start + n - 1) % n]) start++
    if (start === n) start = 0
    let run: Vec[] = [], kind = seen[start]
    const flush = (key: string) => {
      if (run.length < 2) return
      const d = run.map((q, k) => `${k ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ")
      out.push(<path key={key} d={d} fill="none" stroke={CHALK} strokeOpacity={kind ? 1 : 0.45} strokeWidth={kind ? 2.2 : 1.6} strokeDasharray={kind ? undefined : "5 6"} strokeLinecap="round" />)
    }
    for (let k = 0; k <= n; k++) {
      const j = (start + k) % n
      if (seen[j] !== kind) { run.push(P[j]); flush(`r${i}-${k}`); run = [P[j]]; kind = seen[j] } else run.push(P[j])
    }
    flush(`r${i}-end`)
  })
  return <g opacity={op}>{out}</g>
}

/** A net, folded as far as it has got: its faces drawn from the back forward. */
function NetView({ S, op }: { S: Scene; op: number }) {
  const n = S.net
  if (!n) return null
  const F = foldNet(n.def, n.tD)
  const depth = (P: V3[]) => P.reduce((s, p) => s + toCam(S, p)[2], 0) / P.length
  const order = Object.entries(F).sort((a, b) => depth(a[1]) - depth(b[1]))
  return (
    <g opacity={op}>
      {order.map(([id, P]) => (
        <polygon key={id} points={poly(P.map(p => proj(S, p)))} fill={CHALK} fillOpacity={0.1} stroke={CHALK} strokeWidth={2} strokeLinejoin="round" />
      ))}
    </g>
  )
}

/** A light straight above: a soft beam down to each lit point, and a dashed drop from it to the floor. */
function Light({ S }: { S: Scene }) {
  if (!S.light.length) return null
  const out: React.ReactNode[] = []
  const R = S.fitD?.R ?? 5
  for (const n of S.light) {
    const P = p3(S, n)
    const top = proj(S, [P[0], P[1], P[2] + R * 0.45]), at = ptS(S, n), foot = proj(S, [P[0], P[1], 0])
    // a thin ray of light from a small lamp (not a rod: it must not look like another line of the figure)
    out.push(<line key={`beam${n}`} x1={top[0]} y1={top[1]} x2={at[0]} y2={at[1]} stroke={YELLOW} strokeOpacity={0.55} strokeWidth={1.4} strokeDasharray="2 5" strokeLinecap="round" />)
    out.push(<circle key={`glow${n}`} cx={top[0]} cy={top[1]} r={12} fill={YELLOW} fillOpacity={0.18} filter="url(#pl-soft)" />)
    out.push(<circle key={`lamp${n}`} cx={top[0]} cy={top[1]} r={4.5} fill={YELLOW} />)
    if (P[2] > 1e-6) out.push(<line key={`drop${n}`} x1={at[0]} y1={at[1]} x2={foot[0]} y2={foot[1]} stroke={ORANGE} strokeWidth={2.4} strokeDasharray="5 6" strokeLinecap="round" />)
  }
  return <>{out}</>
}

/** A right-angle square in 3D: in the plane of its two lines, drawn as it is seen. */
function rightPath(S: Scene, at: string, a: string, b: string, px = 13): string {
  const C = p3(S, at)
  const u = vunit(vsub(p3(S, a), C)), v = vunit(vsub(p3(S, b), C))
  const r = px / Math.max(1, S.fitD?.u ?? 30)
  const P1 = proj(S, vadd(C, vmul(u, r))), P2 = proj(S, vadd(vadd(C, vmul(u, r)), vmul(v, r))), P3 = proj(S, vadd(C, vmul(v, r)))
  return `M ${P1[0]} ${P1[1]} L ${P2[0]} ${P2[1]} L ${P3[0]} ${P3[1]}`
}

/** Right angles and angle arcs on the figure. */
function Marks({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01) return null
  const out: React.ReactNode[] = []
  for (const [i, r] of S.rights.entries()) {
    const d = rightPath(S, r.at, r.a, r.b)
    if (r.pulse) out.push(<path key={`rg${i}`} d={d} fill="none" stroke={YELLOW} strokeWidth={7} strokeLinejoin="round" filter="url(#pl-soft)">{breathe("1.4s")}</path>)
    out.push(<path key={`r${i}`} d={d} fill="none" stroke={r.col ?? CHALK} strokeWidth={2} strokeLinejoin="round" />)
  }
  // equal parts of a line: short marks across it
  for (const [i, tk] of S.ticks.entries()) {
    const A = p3(S, tk.a), B = p3(S, tk.b)
    const a = ptS(S, tk.a), b = ptS(S, tk.b), d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
    const n: Vec = [-d[1] / l, d[0] / l]
    tk.at.forEach((f, j) => {
      const P = proj(S, [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f])
      const p1 = add(P, mul(n, 8)), p2 = sub(P, mul(n, 8))
      out.push(<line key={`tk${i}-${j}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={tk.pulse ? YELLOW : CHALK} strokeWidth={2.4} strokeLinecap="round">{tk.pulse && breathe("1.4s")}</line>)
    })
  }
  for (const [i, g] of S.arcs.entries()) {
    const G = arcGeom(S, g, arcPx(S))
    const col = g.col ?? CHALK
    const fan = `M ${G.C[0]} ${G.C[1]} ` + G.pts.map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z"
    const edge = G.pts.map((p, k) => `${k ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
    out.push(
      <g key={`a${i}`}>
        <path d={fan} fill={col} fillOpacity={0.18} />
        <path d={edge} fill="none" stroke={col} strokeWidth={2.2} strokeLinecap="round" />
        {g.pulse && <path d={fan} fill={col} fillOpacity={0.3} filter="url(#pl-soft)">{breathe("1.4s")}</path>}
      </g>,
    )
  }
  return <g opacity={op}>{out}</g>
}

/** What the beat lets the student tap: points, lines, angles and triangles breathe until one is picked. */
function Targets({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const n of S.glowPts) {
    const P = ptS(S, n)
    out.push(<circle key={`gp${n}`} cx={P[0]} cy={P[1]} r={9} fill={YELLOW} fillOpacity={0.5} filter="url(#pl-soft)">{breathe("1.6s")}</circle>)
  }
  if ((S.mode === "tapPoint" || S.mode === "join") && S.tapPoints) {
    for (const n of S.tapPoints) {
      const P = ptS(S, n)
      const picked = S.joinFrom === n || (S.drag?.kind === "join" && S.drag.from === n)
      out.push(
        <g key={`tp${n}`}>
          {!picked && <circle cx={P[0]} cy={P[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="7;18;7" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
          <circle cx={P[0]} cy={P[1]} r={picked ? 8 : 5} fill={YELLOW} fillOpacity={picked ? 1 : 0.85} filter={picked ? "url(#pl-soft)" : undefined} />
        </g>,
      )
    }
    // the line being drawn, from the picked point to the finger
    const d = S.drag
    if (d?.kind === "join" && d.moved > 4) {
      const A = ptS(S, d.from)
      out.push(<line key="band" x1={A[0]} y1={A[1]} x2={d.p[0]} y2={d.p[1]} stroke={YELLOW} strokeWidth={2.6} strokeLinecap="round" strokeDasharray="2 7" />)
    }
  }
  if (S.mode === "tapSeg" && S.tapSegs) {
    for (const key of S.tapSegs) {
      const [a, b] = key.split("-"), A = ptS(S, a), B = ptS(S, b)
      out.push(<line key={`ts${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" strokeOpacity={0.35} filter="url(#pl-soft)">{breathe()}</line>)
    }
  }
  if (S.mode === "tapArc" && S.tapArcs) {
    for (const [i, g] of S.tapArcs.entries()) {
      const G = arcGeom(S, g, arcPx(S))
      const fan = `M ${G.C[0]} ${G.C[1]} ` + G.pts.map(p => `L ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z"
      const edge = G.pts.map((p, k) => `${k ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
      out.push(
        <g key={`ta${i}`}>
          <path d={fan} fill={YELLOW} fillOpacity={0.16}>{breathe()}</path>
          <path d={edge} fill="none" stroke={YELLOW} strokeWidth={2} strokeLinecap="round" />
        </g>,
      )
    }
  }
  if (S.mode === "tapRegion" && S.regions) {
    for (const r of S.regions) {
      if (S.regionLit === r.id) continue
      out.push(<polygon key={`tr${r.id}`} points={poly(r.pts.map(n => ptS(S, n)))} fill={YELLOW} fillOpacity={0.1} stroke={YELLOW} strokeOpacity={0.4} strokeWidth={1.2} strokeLinejoin="round">{breathe("2s")}</polygon>)
    }
  }
  return <>{out}</>
}

/** Handles: a yellow point with a breathing halo, and short arrows along the way it moves. */
function Handles({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const h of S.handles) {
    const at = h.at(S)
    const P = proj(S, at)
    const held = S.drag?.kind === "handle" && S.drag.id === h.id
    const ax = sub(proj(S, vadd(at, h.axis)), P), l = Math.hypot(ax[0], ax[1])
    if (l > 2) {
      const u: Vec = [ax[0] / l, ax[1] / l], n: Vec = [-u[1], u[0]]
      for (const s of [1, -1]) {
        const tip = add(P, mul(u, s * 30)), b1 = add(add(P, mul(u, s * 22)), mul(n, 6)), b2 = sub(add(P, mul(u, s * 22)), mul(n, 6))
        out.push(<path key={`ha${h.id}${s}`} d={`M ${add(P, mul(u, s * 14))[0]} ${add(P, mul(u, s * 14))[1]} L ${tip[0]} ${tip[1]} M ${b1[0]} ${b1[1]} L ${tip[0]} ${tip[1]} L ${b2[0]} ${b2[1]}`} fill="none" stroke={YELLOW} strokeOpacity={held ? 0.9 : 0.55} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)
      }
    }
    out.push(
      <g key={`h${h.id}`}>
        {!held && <circle cx={P[0]} cy={P[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="8;22;8" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
        <circle cx={P[0]} cy={P[1]} r={held ? 9.5 : 7.5} fill={YELLOW} filter="url(#pl-soft)" />
      </g>,
    )
  }
  return <>{out}</>
}

/** The triangles lifted out: a faint outline stays where each came from; the flat copy shows its true shape. */
function Flats({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01 || !S.flats.length) return null
  const out: React.ReactNode[] = []
  for (const F of S.flats) {
    if (F.t.v < 0.005 || F.pts.some(n => !F.pos[n])) continue
    const home = F.pts.map(n => ptS(S, n))
    out.push(<polygon key={`home${F.id}`} points={poly(home)} fill={CHALK} fillOpacity={0.06 * F.t.v} stroke={CHALK} strokeOpacity={0.35 * F.t.v} strokeWidth={1.4} strokeDasharray="4 5" strokeLinejoin="round" />)
    const P = F.pts.map(n => F.pos[n])
    // in flight it glows a little, lifted toward the eye
    if (F.fly) out.push(<polygon key={`glow${F.id}`} points={poly(P)} fill={YELLOW} fillOpacity={0.16 * Math.sin(Math.PI * F.fly.e)} stroke={YELLOW} strokeOpacity={0.5 * Math.sin(Math.PI * F.fly.e)} strokeWidth={8} strokeLinejoin="round" filter="url(#pl-soft)" />)
    out.push(<polygon key={`fill${F.id}`} points={poly(P)} fill={CHALK} fillOpacity={0.07} stroke="none" />)
    for (let i = 0; i < 3; i++) {
      const a = F.pts[i], b = F.pts[(i + 1) % 3], A = F.pos[a], B = F.pos[b]
      const key = segKey(a, b)
      const tappable = S.mode === "tapFlatSide" && S.tapFlat === F.id
      if (tappable) out.push(<line key={`ft${F.id}${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={YELLOW} strokeWidth={9} strokeLinecap="round" strokeOpacity={0.3} filter="url(#pl-soft)">{breathe()}</line>)
      const lit = S.flashGood > 0 && S.touched === `${F.id}:${key}`
      out.push(<line key={`fs${F.id}${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={lit ? GREEN : F.lens[key]?.col ?? dirCol(S, a, b)} strokeOpacity={lit ? flashOp(S) : 1} strokeWidth={3.2} strokeLinecap="round" />)
    }
    // the right angle, square in the flat
    const others = F.pts.filter(n => n !== F.right)
    const R = F.pos[F.right], u = unit2(sub(F.pos[others[0]], R)), v = unit2(sub(F.pos[others[1]], R)), r = 14
    const p1 = add(R, mul(u, r)), p2 = add(add(R, mul(u, r)), mul(v, r)), p3 = add(R, mul(v, r))
    out.push(<path key={`fr${F.id}`} d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={CHALK} strokeWidth={2} strokeLinejoin="round" />)
    if (F.angle) {
      const oth = F.pts.filter(n => n !== F.angle!.at)
      const C = F.pos[F.angle.at], A = F.pos[oth[0]], B = F.pos[oth[1]]
      const a1 = Math.atan2(A[1] - C[1], A[0] - C[0]), sw = turn(a1, Math.atan2(B[1] - C[1], B[0] - C[0]))
      const col = F.angle.col ?? CHALK
      out.push(<path key={`fa${F.id}`} d={sectorPath(C, a1, sw, 30, 30)} fill={col} fillOpacity={0.2} />)
      out.push(<path key={`fae${F.id}`} d={arcPath(C, a1, sw, 30, 30)} fill="none" stroke={col} strokeWidth={2.2} />)
    }
  }
  return <g opacity={op}>{out}</g>
}
const unit2 = (a: Vec): Vec => { const l = Math.hypot(a[0], a[1]) || 1; return [a[0] / l, a[1] / l] }

function Labels({ S }: { S: Scene }) {
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

/** Small cards under the figure (the sizes to build), lit when reached. */
function Chips({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (op < 0.01 || !S.chipsOn?.length) return null
  const size = L.eqSize * 0.8
  return (
    <>
      {chipRects(S, L).map((r, i) => {
        const c = S.chipsOn![i]
        return (
          <div key={i} style={{
            position: "absolute", left: 0, top: 0, width: r.x1 - r.x0, height: r.y1 - r.y0, borderRadius: (r.y1 - r.y0) / 2, transform: `translate(${r.x0}px, ${r.y0}px)`,
            border: `1.5px solid ${c.lit ? GREEN : QUIET}`, background: c.lit ? "rgba(15,238,137,0.1)" : "rgba(240,238,234,0.03)", color: c.lit ? GREEN : CHALK, fontSize: size, opacity: op,
            display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", transition: "border-color 300ms, color 300ms, background 300ms",
          }}><Tex tex={c.tex} /></div>
        )
      })}
    </>
  )
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

export { PINK }
