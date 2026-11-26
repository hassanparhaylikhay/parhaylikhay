"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, type Rect, add, sub, mul, clamp, lerpV, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, type V3, CHALK, GREEN, YELLOW, QUIET, PINK, ORANGE, BLUE,
  ptS, proj, p3, toCam, faceFront, segHidden, edgesOf, segKey, dirCol, arcGeom, arcPx, chipRects, dragAt,
  vsub, vadd, vmul, vunit, vdot, vcross, vlerp, facesEye,
} from "./scene"
import { curvedCloud, curvedRings, hull, foldNet, ring, unrollGeom, frustumApex } from "./solids"
import { normalOf, sideOf, upOf, cutOf, curvedMesh, mirror3 } from "./sheet"
import { cubeBoxes, boxFaces, type Box, type Ladder } from "./mens"

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
          <MensFloor S={S} L={L} op={vis("solid")} />
          <NetView S={S} op={vis("solid")} />
          <CurvedView S={S} op={vis("solid")} />
          <UnrollView S={S} op={vis("solid")} />
          <SheetView S={S} op={vis("solid")} />
          <WaterView S={S} op={vis("solid")} />
          <CubesView S={S} op={vis("solid")} />
          <Solid S={S} op={vis("solid")} />
          <SheetCopy S={S} op={vis("solid")} />
          <Light S={S} />
          <Marks S={S} op={vis("marks")} />
          <Targets S={S} />
          <Handles S={S} />
          <Flats S={S} op={vis("flats")} />
        </g>
      </svg>
      <Labels S={S} />
      <LadderView S={S} L={L} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      <Chips S={S} L={L} op={vis("chips")} />
      <Carried S={S} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px`, ...(L.keypadCx !== undefined ? { right: "auto", width: 2 * L.midX } : {}) }}><Tex tex={S.walkTex} /></div> : null}
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
  // the faces and edges a phrase is about breathe in their colour
  for (const k of S.faceGlow) {
    const f = faces[k]
    if (!f) continue
    const col = S.faceLit[k] ?? YELLOW
    out.push(<polygon key={`fg${k}`} points={poly(f.map(n => ptS(S, n)))} fill={col} fillOpacity={0.12} stroke={col} strokeWidth={6} strokeLinejoin="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.7;0.15" dur="1.6s" repeatCount="indefinite" /><animate attributeName="fill-opacity" values="0.06;0.3;0.06" dur="1.6s" repeatCount="indefinite" /></polygon>)
  }
  for (const [key, col] of Object.entries(S.edgeGlow)) {
    const [a, b] = key.split("-")
    if (!S.P3[a] || !S.P3[b]) continue
    const A = ptS(S, a), B = ptS(S, b)
    out.push(<line key={`eg${key}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.7;0.15" dur="1.6s" repeatCount="indefinite" /></line>)
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
  // a frustum: the cone cut off its top, dashed, up to where its tip was
  if (c.ghost && c.kind === "frustum") {
    const Z = frustumApex(c), r2 = c.r2 ?? c.r / 2
    const G = hull([...ring(r2, c.h).map(p => proj(S, p)), proj(S, [0, 0, Z])])
    out.push(<polygon key="ghost" points={poly(G)} fill={CHALK} fillOpacity={0.03} stroke={CHALK} strokeOpacity={0.55} strokeWidth={1.8} strokeDasharray="6 6" strokeLinejoin="round" />)
  }
  // its flat circle ends filled
  if (c.ends && c.kind !== "sphere") {
    const caps: [number, number][] = c.kind === "cylinder" ? [[c.r, 0], [c.r, c.h]] : c.kind === "frustum" ? [[c.r, 0], [c.r2 ?? c.r / 2, c.h]] : [[c.r, 0]]
    caps.forEach(([r, z], i) => {
      const Q = poly(ring(r, z).map(p => proj(S, p)))
      out.push(<polygon key={`end${i}`} points={Q} fill={c.ends} fillOpacity={0.24} stroke={c.ends} strokeWidth={2.4} strokeLinejoin="round">{c.pulse && <animate attributeName="fill-opacity" values="0.14;0.4;0.14" dur="1.6s" repeatCount="indefinite" />}</polygon>)
    })
  }
  // its cross-section lit: the top filled
  if (c.lit && c.kind === "cylinder") {
    const Q = poly(ring(c.r, c.h).map(p => proj(S, p)))
    if (c.pulse) out.push(<polygon key="litg" points={Q} fill="none" stroke={c.lit} strokeWidth={8} filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.75;0.15" dur="1.6s" repeatCount="indefinite" /></polygon>)
    out.push(<polygon key="lit" points={Q} fill={c.lit} fillOpacity={0.3} stroke={c.lit} strokeWidth={2.4} strokeLinejoin="round">{c.pulse && <animate attributeName="fill-opacity" values="0.2;0.45;0.2" dur="1.6s" repeatCount="indefinite" />}</polygon>)
  }
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
  // a cone's tip, marked
  if (c.tip && c.kind === "cone") {
    const T = proj(S, [0, 0, c.h])
    out.push(<circle key="tip" cx={T[0]} cy={T[1]} r={10} fill="none" stroke={c.tip} strokeWidth={3} filter="url(#pl-soft)"><animate attributeName="r" values="7;15;7" dur="1.6s" repeatCount="indefinite" /><animate attributeName="stroke-opacity" values="0.9;0.3;0.9" dur="1.6s" repeatCount="indefinite" /></circle>)
    out.push(<circle key="tipd" cx={T[0]} cy={T[1]} r={4.5} fill={c.tip} />)
  }
  return <g opacity={op}>{out}</g>
}

/** A cylinder unrolling: the strips of its curved face and its two circles, drawn from the back forward. */
function UnrollView({ S, op }: { S: Scene; op: number }) {
  const U = S.unroll
  if (!U) return null
  const G = unrollGeom(U.r, U.h, U.u, U.cap)
  const depth = (P: V3[]) => P.reduce((s, p) => s + toCam(S, p)[2], 0) / P.length
  const side = U.cols?.side ?? CHALK, ends = U.cols?.ends ?? CHALK
  const glow = new Set(U.glow ?? [])
  const parts: { P: V3[]; col: string; strip: boolean; lit: boolean }[] = [
    ...G.strips.map(P => ({ P, col: side, strip: true, lit: glow.has("side") })),
    { P: G.top, col: ends, strip: false, lit: glow.has("top") },
    { P: G.bottom, col: ends, strip: false, lit: glow.has("bottom") },
  ]
  parts.sort((a, b) => depth(a.P) - depth(b.P))
  const out: React.ReactNode[] = parts.map((pt, i) => {
    const Q = poly(pt.P.map(p => proj(S, p)))
    const op = pt.strip ? 0.05 : 0.22
    return (
      <g key={i}>
        {pt.lit && !pt.strip && <polygon points={Q} fill="none" stroke={pt.col} strokeWidth={8} strokeLinejoin="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.75;0.15" dur="1.6s" repeatCount="indefinite" /></polygon>}
        <polygon points={Q} fill={pt.col} fillOpacity={op} stroke={pt.strip ? "none" : pt.col} strokeWidth={2} strokeLinejoin="round">
          {pt.lit && <animate attributeName="fill-opacity" values={`${op};${pt.strip ? 0.22 : 0.42};${op}`} dur="1.6s" repeatCount="indefinite" />}
        </polygon>
      </g>
    )
  })
  // the curved face's outline: its top and bottom edges and its two free sides
  const edge = (z: number) => G.strips.map(P => P[z ? 3 : 0]).concat([G.strips[G.strips.length - 1][z ? 2 : 1]])
  const path = (Q: V3[]) => Q.map((p, k) => { const q = proj(S, p); return `${k ? "L" : "M"} ${q[0].toFixed(1)} ${q[1].toFixed(1)}` }).join(" ")
  const first = G.strips[0], last = G.strips[G.strips.length - 1]
  // the curved face breathing: a soft glow all round its outline
  if (glow.has("side")) {
    const ring = [...edge(0), last[2], ...[...edge(1)].reverse(), first[0]]
    out.push(<path key="sideglow" d={path(ring)} fill="none" stroke={side} strokeWidth={8} strokeLinejoin="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.75;0.15" dur="1.6s" repeatCount="indefinite" /></path>)
  }
  out.push(<path key="e0" d={path(edge(0))} fill="none" stroke={side} strokeWidth={2.2} />, <path key="e1" d={path(edge(1))} fill="none" stroke={side} strokeWidth={2.2} />)
  out.push(<path key="s0" d={path([first[0], first[3]])} fill="none" stroke={side} strokeWidth={2.2} />, <path key="s1" d={path([last[1], last[2]])} fill="none" stroke={side} strokeWidth={2.2} />)
  return <g opacity={op}>{out}</g>
}

/** A net, folded as far as it has got: its faces drawn from the back forward. */
function NetView({ S, op }: { S: Scene; op: number }) {
  const n = S.net
  if (!n) return null
  const F = foldNet(n.def, n.tD)
  const depth = (P: V3[]) => P.reduce((s, p) => s + toCam(S, p)[2], 0) / P.length
  const order = Object.entries(F).sort((a, b) => depth(a[1]) - depth(b[1]))
  const E = S.netEdit
  return (
    <g opacity={op}>
      {order.map(([id, P]) => {
        const col = n.cols?.[id]
        // orange and pink go muddy over the dark board when filled strongly: their edges carry the colour
        const op = !col ? 0.1 : col === ORANGE || col === PINK ? 0.05 : 0.28
        const Q = poly(P.map(p => proj(S, p)))
        // a face a phrase is about breathes: a soft edge and a fill that comes and goes
        if (n.glow?.includes(id)) {
          const g = col ?? YELLOW
          return (
            <g key={id}>
              <polygon points={Q} fill={g} fillOpacity={op} stroke={g} strokeWidth={7} strokeLinejoin="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.75;0.15" dur="1.6s" repeatCount="indefinite" /></polygon>
              <polygon points={Q} fill={g} fillOpacity={op} stroke={g} strokeWidth={3} strokeLinejoin="round"><animate attributeName="fill-opacity" values={`${op};${Math.max(0.3, op * 2)};${op}`} dur="1.6s" repeatCount="indefinite" /></polygon>
            </g>
          )
        }
        return <polygon key={id} points={Q} fill={col ?? CHALK} fillOpacity={op} stroke={col ?? CHALK} strokeWidth={2} strokeLinejoin="round" />
      })}
      {/* where a face can be added: breathing yellow squares */}
      {E && n.tD < 0.02 && E.cand.map(([i, j]) => {
        const k = E.k, P: V3[] = [[i * k, j * k, 0], [(i + 1) * k, j * k, 0], [(i + 1) * k, (j + 1) * k, 0], [i * k, (j + 1) * k, 0]]
        return (
          <polygon key={`cand${i}_${j}`} points={poly(P.map(p => proj(S, p)))} fill={YELLOW} fillOpacity={0.06} stroke={YELLOW} strokeWidth={1.6} strokeDasharray="5 5" strokeLinejoin="round">
            <animate attributeName="stroke-opacity" values="0.25;0.9;0.25" dur="1.8s" repeatCount="indefinite" />
          </polygon>
        )
      })}
    </g>
  )
}

/** The solid as corners and edges (as drawn), for where a sheet cuts it. */
function solidMesh(S: Scene): { P: V3[]; edges: [number, number][] } | null {
  if (S.curved) return curvedMesh(S.curved)
  if (!S.faces) return null
  const names = [...new Set(S.faces.flat())], at = Object.fromEntries(names.map((n, i) => [n, i]))
  return { P: names.map(n => p3(S, n)), edges: edgesOf(S).map(([a, b]) => [at[a], at[b]] as [number, number]) }
}

/**
 * A sheet through the solid: the planes of symmetry found so far (their
 * cuts, dashed blue), then the sheet itself, a round pane, with the outline
 * of its cut. Chalk while it is free; green where the halves match, pink
 * where they do not.
 */
function SheetView({ S, op }: { S: Scene; op: number }) {
  const sh = S.sheet, mesh = solidMesh(S)
  if (!sh || !mesh) return null
  const out: React.ReactNode[] = []
  // with more than three: while the sheet is going through them the older ones step back so the newest
  // can be seen; once it stops they all stay, a little faint
  const many = sh.found.length > 3, going = !!S.act || S.acts.length > 0
  sh.found.forEach((m, i) => {
    const cut = cutOf(mesh.P, mesh.edges, sh.c, m)
    const back = many && (!going || i < sh.found.length - 1)
    if (cut.length) out.push(<polygon key={`found${i}`} points={poly(cut.map(p => proj(S, p)))} fill={BLUE} fillOpacity={back ? 0.03 : 0.1} stroke={BLUE} strokeOpacity={back ? 0.4 : 1} strokeWidth={back ? 1.6 : 2} strokeDasharray="7 5" strokeLinejoin="round" />)
  })
  if (!sh.hidden) {
    const n = normalOf(sh.phiD, sh.tauD), side = sideOf(sh.phiD), up = upOf(sh.phiD, sh.tauD)
    const match = sh.live ? sh.fits(n) : sh.at ? sh.fits(sh.at) : null
    const col = match === null ? CHALK : match ? GREEN : PINK
    const disc = Array.from({ length: 72 }, (_, i) => { const t = (2 * Math.PI * i) / 72; return proj(S, vadd(sh.c, vadd(vmul(side, sh.r * Math.cos(t)), vmul(up, sh.r * Math.sin(t))))) })
    out.push(<polygon key="disc" points={poly(disc)} fill={col} fillOpacity={match === null ? 0.07 : 0.12} stroke={col} strokeOpacity={0.5} strokeWidth={1.4} strokeLinejoin="round" />)
    const cut = cutOf(mesh.P, mesh.edges, sh.c, n)
    if (cut.length) out.push(<polygon key="cut" points={poly(cut.map(p => proj(S, p)))} fill={col} fillOpacity={0.12} stroke={col} strokeOpacity={0.95} strokeWidth={2.4} strokeLinejoin="round" />)
  }
  return <g opacity={op}>{out}</g>
}

/** The solid's mirror image in the sheet, going through it while the sheet stays clicked in: green if it lands on the solid, pink if it sticks out. */
function SheetCopy({ S, op }: { S: Scene; op: number }) {
  const sh = S.sheet
  if (!sh || !sh.at || sh.e < 0.02 || !S.faces) return null
  const m = sh.at, col = sh.fits(m) ? GREEN : PINK
  const at = (n: string) => proj(S, vlerp(p3(S, n), mirror3(p3(S, n), sh.c, m), sh.e))
  return (
    <g opacity={op * Math.min(1, sh.e * 4)}>
      {edgesOf(S).map(([a, b]) => { const A = at(a), B = at(b); return <line key={`mc${a}${b}`} x1={A[0]} y1={A[1]} x2={B[0]} y2={B[1]} stroke={col} strokeWidth={2.4} strokeLinecap="round" /> })}
    </g>
  )
}

/**
 * On the floor: the metre stick (its marks thin out as the view draws back,
 * so they never smear into a grey bar) and squares split into grids, the
 * counted ones shaded.
 */
function MensFloor({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (op < 0.01) return null
  const M = S.meter
  if (!M && !S.sqGrids.length) return null
  const out: React.ReactNode[] = []
  const f = S.fitD ?? S.fit, u = f?.u ?? 1
  const P = (x: number, y: number) => proj(S, [x, y, 0])
  const quad = (x0: number, y0: number, x1: number, y1: number) => poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)])
  if (M) {
    out.push(<polygon key="body" points={quad(M.x0, M.y0, M.x0 + M.len, M.y0 + M.w)} fill={CHALK} fillOpacity={0.06} stroke={CHALK} strokeOpacity={0.55} strokeWidth={1.4} strokeLinejoin="round" />)
    if (M.lit) out.push(<polygon key="lit" points={quad(M.x0, M.y0 + M.w * 0.72, M.x0 + M.lit, M.y0 + M.w)} fill={BLUE} fillOpacity={0.35} stroke="none" />)
    const top = M.y0 + M.w
    // every mark that has room on the screen: mm (when a mm is 4 px or more), cm, every 5 and every 10
    const subPx = (u / M.sub)
    for (let i = 0; i <= M.len * M.sub; i++) {
      const cm = i / M.sub, whole = i % M.sub === 0
      if (!whole && subPx < 4) continue
      if (whole && !(cm % 10 === 0) && u < 3) continue
      const len = cm % 10 === 0 && whole ? 0.25 : whole ? (cm % 5 === 0 ? 0.2 : 0.16) : i % (M.sub / 2) === 0 && M.sub % 2 === 0 ? 0.11 : 0.075
      const a = P(M.x0 + cm, top), b = P(M.x0 + cm, top - M.w * len)
      out.push(<line key={`t${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={whole ? 0.9 : 0.65} strokeWidth={whole ? 1.4 : 1} />)
    }
    for (const [i, mk] of (M.marks ?? []).entries()) {
      const a = P(M.x0 + mk.at, top + Math.max(0.15, 10 / u)), b = P(M.x0 + mk.at, M.y0)
      out.push(<line key={`mk${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={mk.col} strokeWidth={2.6} strokeLinecap="round" />)
    }
  }
  for (const [gi, g] of S.sqGrids.entries()) {
    const c = g.size / g.n, x1 = g.x0 + g.size, y1 = g.y0 + g.size
    // counted squares, row by row from the top: whole rows as one strip, then the start of the next
    const rows = Math.floor(g.lit / g.n), rest = g.lit - rows * g.n
    if (rows) out.push(<polygon key={`gl${gi}`} points={quad(g.x0, y1 - rows * c, x1, y1)} fill={g.col} fillOpacity={0.3} stroke="none" />)
    if (rest) out.push(<polygon key={`gr${gi}`} points={quad(g.x0, y1 - (rows + 1) * c, g.x0 + rest * c, y1 - rows * c)} fill={g.col} fillOpacity={0.3} stroke="none" />)
    if (g.lines) {
      // lines too close to tell apart fade out (a hundred to a side, from far off)
      const px = c * u, lineOp = Math.max(0, Math.min(1, (px - 1.5) / 4))
      if (lineOp > 0.02) for (let k = 1; k < g.n; k++) {
        const a = P(g.x0 + k * c, g.y0), b = P(g.x0 + k * c, y1), d = P(g.x0, g.y0 + k * c), e = P(x1, g.y0 + k * c)
        out.push(<line key={`gx${gi}-${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={0.4 * lineOp} strokeWidth={1} />)
        out.push(<line key={`gy${gi}-${k}`} x1={d[0]} y1={d[1]} x2={e[0]} y2={e[1]} stroke={CHALK} strokeOpacity={0.4 * lineOp} strokeWidth={1} />)
      }
    }
    out.push(<polygon key={`go${gi}`} points={quad(g.x0, g.y0, x1, y1)} fill="none" stroke={g.col} strokeWidth={2.2} strokeLinejoin="round" />)
  }
  // a close-up stick beside a ladder is cut off at the edge of its room, fading out
  if (M && S.ladderOn) {
    const c = L.solidCell, fade = 40
    return (
      <g opacity={op}>
        <defs>
          <linearGradient id="pl-mens-fade" gradientUnits="userSpaceOnUse" x1={c.x0} y1={0} x2={c.x1} y2={0}>
            <stop offset={0} stopColor="#fff" />
            <stop offset={Math.max(0, 1 - fade / Math.max(1, c.x1 - c.x0))} stopColor="#fff" />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </linearGradient>
          <mask id="pl-mens-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={S.w} height={S.h}>
            <rect x={0} y={0} width={c.x1} height={c.y1} fill="url(#pl-mens-fade)" />
          </mask>
        </defs>
        <g mask="url(#pl-mens-mask)">{out}</g>
      </g>
    )
  }
  return <g opacity={op}>{out}</g>
}

/** A box's faces that look toward the eye, back ones first, each with lines every `s` across it (the cubes it is made of). */
function boxView(S: Scene, b: Box, key: string, col: string, s?: number, fillOp = 0.2): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const faces = boxFaces(b).filter(F => facesEye(S, F.P.reduce((a, p) => vadd(a, vmul(p, 0.25)), [0, 0, 0] as V3), F.n))
  for (const [i, F] of faces.entries()) {
    out.push(<polygon key={`${key}f${i}`} points={poly(F.P.map(p => proj(S, p)))} fill={col} fillOpacity={fillOp} stroke={col} strokeWidth={1.6} strokeLinejoin="round" />)
    if (!s) continue
    // lines across the face at every cube
    const la = vdot(vsub(F.P[1], F.P[0]), F.u) || vdot(vsub(F.P[3], F.P[0]), F.u), lb = vdot(vsub(F.P[3], F.P[0]), F.v) || vdot(vsub(F.P[1], F.P[0]), F.v)
    const o = F.P[0]
    for (let k = 1; k < Math.round(Math.abs(la) / s); k++) {
      const a = vadd(o, vmul(F.u, k * s)), e = vadd(a, vmul(F.v, lb))
      const A = proj(S, a), E = proj(S, e)
      out.push(<line key={`${key}u${i}-${k}`} x1={A[0]} y1={A[1]} x2={E[0]} y2={E[1]} stroke={col} strokeOpacity={0.55} strokeWidth={1} />)
    }
    for (let k = 1; k < Math.round(Math.abs(lb) / s); k++) {
      const a = vadd(o, vmul(F.v, k * s)), e = vadd(a, vmul(F.u, la))
      const A = proj(S, a), E = proj(S, e)
      out.push(<line key={`${key}v${i}-${k}`} x1={A[0]} y1={A[1]} x2={E[0]} y2={E[1]} stroke={col} strokeOpacity={0.55} strokeWidth={1} />)
    }
  }
  return out
}

/** Unit cubes filling a box, layer by layer: drawn as the few boxes they make, with the lines between the cubes. */
function CubesView({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01 || !S.cubes.length) return null
  const out: React.ReactNode[] = []
  for (const [ci, c] of S.cubes.entries()) {
    // nearer boxes last
    const boxes = cubeBoxes(c).map(b => ({ b, d: toCam(S, vmul(vadd(b[0], b[1]), 0.5))[2] })).sort((a, b2) => a.d - b2.d)
    boxes.forEach((x, i) => out.push(...boxView(S, x.b, `c${ci}-${i}`, c.col, c.s, 0.22)))
  }
  return <g opacity={op}>{out}</g>
}

/** Water in a box, up to its level: see-through blue, its top a little brighter. */
function WaterView({ S, op }: { S: Scene; op: number }) {
  const W = S.water
  if (op < 0.01 || !W || W.level < 0.002) return null
  const z = W.z0 + (W.z1 - W.z0) * Math.min(1, W.level)
  return <g opacity={op}>{boxView(S, [[W.x0, W.y0, W.z0], [W.x1, W.y1, z]], "w", W.col, undefined, 0.28)}</g>
}

/** One ladder of units, biggest at the top: going down a step multiplies, going up divides; the steps asked for light up. */
function Rungs({ D, size }: { D: Ladder; size: number }) {
  const lit = D.lit, down = lit ? lit.to > lit.from : false
  const on = (i: number) => !!lit && i >= Math.min(lit.from, lit.to) && i < Math.max(lit.from, lit.to)
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {D.title && <div style={{ color: QUIET, fontSize: Math.max(13, size * 0.55), marginBottom: size * 0.3 }}>{D.title}</div>}
      {D.units.map((unit, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ color: lit && (i === lit.from || i === lit.to) ? (i === lit.to ? GREEN : CHALK) : CHALK, fontSize: size, opacity: lit && !(i >= Math.min(lit.from, lit.to) && i <= Math.max(lit.from, lit.to)) ? 0.45 : 1 }}><Tex tex={unit} /></div>
          {i < D.units.length - 1 && (
            <div style={{ display: "flex", gap: size * 0.9, alignItems: "center", margin: `${size * 0.12}px 0`, fontSize: size * 0.62 }}>
              <span style={{ color: BLUE, opacity: !lit ? 0.9 : on(i) && down ? 1 : 0.25, display: "flex", alignItems: "center", gap: 6 }}><Tex tex={`\\times ${D.factors[i]} \\;\\downarrow`} /></span>
              <span style={{ color: ORANGE, opacity: !lit ? 0.9 : on(i) && !down ? 1 : 0.25, display: "flex", alignItems: "center", gap: 6 }}><Tex tex={`\\uparrow\\; \\div ${D.factors[i]}`} /></span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

/** The ladder of units in the side of the board (or all of it, when it is all there is); several side by side for a summary. */
function LadderView({ S, L }: { S: Scene; L: Layout }) {
  const box = (cell: Rect, op: number): React.CSSProperties => ({ position: "absolute", left: cell.x0, top: cell.y0, width: cell.x1 - cell.x0, height: cell.y1 - cell.y0, display: "flex", alignItems: "center", justifyContent: "center", opacity: op, pointerEvents: "none" })
  if (S.ladders.length) {
    // four across on a wide board, two by two on a phone
    const cell = L.board, size = L.compact ? 20 : Math.max(18, Math.min(28, (cell.x1 - cell.x0) / 34))
    return (
      <div style={{ ...box(cell, S.vis.solid.v), flexWrap: "wrap", gap: `${size * 1.2}px ${size * (L.compact ? 1.4 : 2.2)}px`, alignContent: "center" }}>
        {S.ladders.map((D, i) => <Rungs key={i} D={D} size={size} />)}
      </div>
    )
  }
  const D = S.ladder
  // beside the figure, or the whole board when it is all there is
  const alone = !!D && !S.ladderOn, cell = alone ? L.board : L.flatCell
  if (!D || !cell || (!alone && S.split.v < 0.3)) return null
  return (
    <div style={box(cell, alone ? S.vis.solid.v : Math.min(1, S.split.v * 1.4))}>
      <Rungs D={D} size={(L.compact ? 24 : 30) * (alone ? 1.25 : 1)} />
    </div>
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
    const ax = sub(proj(S, vadd(at, h.axisAt ? h.axisAt(S) : h.axis)), P), l = Math.hypot(ax[0], ax[1])
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
