"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import EquationView from "../EquationView"
import { type Vec, add, sub, mul, lerpV } from "../geometry"
import {
  type Scene, type Layout, type Shape, CHALK, GREEN, YELLOW, BACK,
  atS, shapeOf, markRadius, handleAt, toScreen, sideKey, localAt,
} from "./scene"

/**
 * Draws the similarity board. Pure: everything comes from the scene. Shapes,
 * arcs and lines are SVG; every letter and number is KaTeX laid over them.
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
          <g opacity={vis("shapes")}>{S.shapes.map(sh => <ShapeView key={sh.id} S={S} sh={sh} />)}</g>
          <g opacity={vis("marks")}><Marks S={S} /></g>
          <g opacity={vis("lines")}><Lines S={S} /></g>
          <Handles S={S} />
        </g>
      </svg>
      <Bars S={S} L={L} op={vis("bars")} />
      <Labels S={S} />
      <EquationView B={S.eq} time={S.time} opacity={vis("eq")} />
      {S.walkTex ? <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={{ top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, ["--line-size" as string]: `${L.lineSize}px` }}><Tex tex={S.walkTex} /></div> : null}
    </>
  )
}

const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const poly = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const unit = (v: Vec): Vec => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l] }
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)

/** A shape: a faint fill, each side in its colour (a matched side thick), glowing sides, parallel arrows. */
function ShapeView({ S, sh }: { S: Scene; sh: Shape }) {
  const P = sh.order.map(n => atS(S, sh, n))
  const out: React.ReactNode[] = []
  const op = sh.quiet ? 0.35 : 1
  const lit = S.flashGood > 0 && S.touched === sh.id
  if (sh.hidden) return null
  if (sh.ghost) {
    return <polygon points={poly(P)} fill={CHALK} fillOpacity={0.03} stroke={CHALK} strokeOpacity={0.4} strokeWidth={1.8} strokeDasharray="6 6" strokeLinejoin="round" />
  }
  if (sh.mug) return <g>{mugParts(S, sh, P, op)}{extraGlow(S, sh, false)}</g>
  const mid: Vec = [P.reduce((s, p) => s + p[0], 0) / P.length, P.reduce((s, p) => s + p[1], 0) / P.length]
  if (sh.depth) out.push(...prismParts(S, sh, P, mid, op))
  const full = sh.cubes !== undefined && sh.cubes >= 1
  if (!full) out.push(<polygon key="f" points={poly(P)} fill={sh.fill ?? CHALK} fillOpacity={(sh.fill ? sh.fillOp ?? 0.3 : 0.05) * op} stroke="none" />)
  if (sh.grid && !full) out.push(...gridParts(S, sh, P, mid, op))
  if (sh.split) out.push(...splitParts(P, sh.split, op))
  if (sh.cubes !== undefined) out.push(...cubeParts(S, sh, op))
  sh.order.forEach((n, i) => {
    const m = sh.order[(i + 1) % sh.order.length]
    const key = sideKey(sh.id, n, m)
    const col = S.sideCol[key]
    // a matched side sits just inside its own shape, so a side two triangles share shows both colours
    let a = P[i], b = P[(i + 1) % P.length]
    if (col) {
      const u = unit(sub(b, a))
      let nn: Vec = [-u[1], u[0]]
      if ((mid[0] - a[0]) * nn[0] + (mid[1] - a[1]) * nn[1] < 0) nn = mul(nn, -1)
      a = add(a, mul(nn, 1.8)); b = add(b, mul(nn, 1.8))
    }
    if (S.sideGlow.has(key)) {
      out.push(
        <line key={`g${key}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col ?? CHALK} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.7;0.1" dur="1.6s" repeatCount="indefinite" />
        </line>,
      )
    }
    out.push(<line key={`s${key}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={lit ? GREEN : col ?? CHALK} strokeOpacity={op * (lit ? flashOp(S) : 1)} strokeWidth={col ? 3.6 : 2.4} strokeLinecap="round" />)
  })
  for (const ar of S.arrows) {
    if (ar.sh !== sh.id) continue
    const A = atS(S, sh, ar.a), B = atS(S, sh, ar.b), u = unit(sub(B, A)), nrm: Vec = [-u[1], u[0]]
    for (let j = 0; j < ar.n; j++) {
      const m = add(lerpV(A, B, 0.5), mul(u, (j - (ar.n - 1) / 2) * 9))
      const tip = add(m, mul(u, 6)), l = add(sub(m, mul(u, 4)), mul(nrm, 6)), r = sub(sub(m, mul(u, 4)), mul(nrm, 6))
      out.push(<path key={`ar${ar.a}${ar.b}${j}`} d={`M ${l[0]} ${l[1]} L ${tip[0]} ${tip[1]} L ${r[0]} ${r[1]}`} fill="none" stroke={CHALK} strokeOpacity={op} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />)
    }
  }
  out.push(...extraGlow(S, sh, true))
  return <g>{out}</g>
}

/**
 * Glowing lines the outline loop does not draw: a prism's edges along its
 * length (to a primed corner), and a mug's sides (drawn as curves).
 */
function extraGlow(S: Scene, sh: Shape, skipOutline: boolean): React.ReactNode[] {
  const names = [...sh.order, ...(sh.depth ? sh.order.map(n => `${n}'`) : [])]
  const k = sh.order.length
  const out: React.ReactNode[] = []
  for (let i = 0; i < names.length; i++) for (let j = i + 1; j < names.length; j++) {
    const key = sideKey(sh.id, names[i], names[j])
    if (!S.sideGlow.has(key)) continue
    const outline = j < k && (j === i + 1 || (i === 0 && j === k - 1))
    if (skipOutline && outline) continue
    const a = atS(S, sh, names[i]), b = atS(S, sh, names[j]), col = S.sideCol[key] ?? CHALK
    out.push(<line key={`xg${key}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={col} strokeWidth={10} strokeLinecap="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.1;0.7;0.1" dur="1.6s" repeatCount="indefinite" /></line>)
  }
  return out
}

/** Which of a prism's side faces can be seen: those whose outside faces the way the prism goes back. */
function seenFaces(P: Vec[], mid: Vec, d: Vec): boolean[] {
  return P.map((a, i) => {
    const b = P[(i + 1) % P.length], u = unit(sub(b, a))
    let nn: Vec = [-u[1], u[0]]
    if ((mid[0] - a[0]) * nn[0] + (mid[1] - a[1]) * nn[1] > 0) nn = mul(nn, -1)
    return nn[0] * d[0] + nn[1] * d[1] > 1e-6
  })
}

/** A prism behind its front face: the side faces you can see, their edges, and the edges at the back you can't see, dashed. */
function prismParts(S: Scene, sh: Shape, P: Vec[], mid: Vec, op: number): React.ReactNode[] {
  const B = sh.order.map(n => atS(S, sh, n + "'"))
  const d = sub(B[0], P[0]), seen = seenFaces(P, mid, d), m = P.length
  const out: React.ReactNode[] = []
  const edge = (key: string, a: Vec, b: Vec, solid: boolean) => out.push(
    <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={op * (solid ? 1 : 0.45)} strokeWidth={solid ? 2.4 : 1.6} strokeDasharray={solid ? undefined : "6 6"} strokeLinecap="round" />,
  )
  P.forEach((a, i) => {
    if (!seen[i]) return
    const j = (i + 1) % m
    out.push(<polygon key={`pf${i}`} points={poly([a, P[j], B[j], B[i]])} fill={CHALK} fillOpacity={(i % 2 ? 0.08 : 0.12) * op} stroke="none" />)
  })
  P.forEach((a, i) => {
    const j = (i + 1) % m, h = (i + m - 1) % m
    edge(`pc${i}`, a, B[i], seen[i] || seen[h])
    edge(`pb${i}`, B[i], B[j], seen[i])
  })
  return out
}

/** Lines one unit apart across a shape's front face, and across the side faces of a prism you can see. */
function gridParts(S: Scene, sh: Shape, P: Vec[], mid: Vec, op: number): React.ReactNode[] {
  const out: React.ReactNode[] = []
  const k = sh.pose.k
  const ln = (key: string, a: Vec, b: Vec) => out.push(<line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={0.4 * op} strokeWidth={1.2} />)
  const steps = (len: number) => { const t: number[] = []; for (let m = 1; m / k < len - 1e-6; m++) t.push(m / k); return t }
  // the front face (a rectangle in its own coordinates, from the origin)
  const xs = Object.values(sh.pts).map(p => p[0]), ys = Object.values(sh.pts).map(p => p[1])
  const w = Math.max(...xs), h = Math.max(...ys)
  const sc = (l: Vec) => toScreen(S, localAt(sh, l))
  for (const x of steps(w)) ln(`gx${x}`, sc([x, 0]), sc([x, h]))
  for (const y of steps(h)) ln(`gy${y}`, sc([0, y]), sc([w, y]))
  if (!sh.depth) return out
  const B = sh.order.map(n => atS(S, sh, n + "'")), d = sub(B[0], P[0]), seen = seenFaces(P, mid, d), m = P.length
  P.forEach((a, i) => {
    if (!seen[i]) return
    const j = (i + 1) % m, len = Math.hypot(sh.pts[sh.order[j]][0] - sh.pts[sh.order[i]][0], sh.pts[sh.order[j]][1] - sh.pts[sh.order[i]][1])
    for (const t of steps(len)) { const p = lerpV(a, P[j], t / len); ln(`sa${i}-${t}`, p, add(p, d)) }
    for (const t of steps(sh.depth!)) { const f = t / sh.depth!; ln(`sb${i}-${t}`, add(a, mul(d, f)), add(P[j], mul(d, f))) }
  })
  return out
}

/** A triangle cut into n rows of small copies of itself: lines parallel to each side. */
function splitParts(P: Vec[], n: number, op: number): React.ReactNode[] {
  if (P.length !== 3) return []
  const [A, B, C] = P, out: React.ReactNode[] = []
  for (let i = 1; i < n; i++) {
    const t = i / n
    for (const [p, q, r, key] of [[A, B, C, "c"], [B, C, A, "a"], [C, A, B, "b"]] as [Vec, Vec, Vec, string][]) {
      // parallel to pq, a fraction t of the way to r
      const a = lerpV(p, r, t), b = lerpV(q, r, t)
      out.push(<line key={`sp${key}${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeOpacity={0.55 * op} strokeWidth={1.4} />)
    }
  }
  return out
}

/** A cube filled with unit cubes, bottom layer first and back to front, drawn so the nearer ones cover the further ones. */
function cubeParts(S: Scene, sh: Shape, op: number): React.ReactNode[] {
  const n = Math.round(sh.pose.k)
  if (n < 1 || Math.abs(sh.D.k - n) > 0.02) return []
  const all: [number, number, number][] = []
  for (let j = 0; j < n; j++) for (let l = n - 1; l >= 0; l--) for (let i = 0; i < n; i++) all.push([i, j, l])
  const shown = all.slice(0, Math.min(all.length, sh.cubes ?? 0))
  shown.sort((p, q) => q[2] - p[2] || p[1] - q[1] || p[0] - q[0])
  const out: React.ReactNode[] = []
  const back: Vec = [BACK[0], BACK[1]]
  for (const [i, j, l] of shown) {
    const w = (x: number, y: number): Vec => { const p = localAt(sh, [x / n, y / n]); return toScreen(S, [p[0] + back[0] * l, p[1] + back[1] * l]) }
    const wb = (x: number, y: number): Vec => { const p = localAt(sh, [x / n, y / n]); return toScreen(S, [p[0] + back[0] * (l + 1), p[1] + back[1] * (l + 1)]) }
    const F = [w(i, j), w(i + 1, j), w(i + 1, j + 1), w(i, j + 1)]
    const top = [w(i, j + 1), w(i + 1, j + 1), wb(i + 1, j + 1), wb(i, j + 1)]
    const right = [w(i + 1, j), wb(i + 1, j), wb(i + 1, j + 1), w(i + 1, j + 1)]
    const key = `${i}-${j}-${l}`
    const face = (k: string, pts: Vec[], f: number) => out.push(<polygon key={k + key} points={poly(pts)} fill="#22303a" fillOpacity={op} stroke={CHALK} strokeOpacity={0.7 * op} strokeWidth={1.1} strokeLinejoin="round" style={{ filter: `brightness(${f})` }} />)
    face("r", right, 0.8)
    face("t", top, 1.35)
    face("f", F, 1.05)
  }
  return out
}

/** A mug: its body, a round top, a curved bottom and a handle on the right. */
function mugParts(S: Scene, sh: Shape, P: Vec[], op: number): React.ReactNode[] {
  const [BL, BR, TR, TL] = P
  const rx = Math.hypot(TR[0] - TL[0], TR[1] - TL[1]) / 2, ry = rx * 0.28
  const top = lerpV(TL, TR, 0.5), h = Math.hypot(TL[0] - BL[0], TL[1] - BL[1])
  const body = `M ${TL[0]} ${TL[1]} L ${BL[0]} ${BL[1]} A ${rx} ${ry} 0 0 0 ${BR[0]} ${BR[1]} L ${TR[0]} ${TR[1]} Z`
  const h1: Vec = [TR[0], TR[1] + h * 0.2], h2: Vec = [BR[0], BR[1] - h * 0.3], reach = h * 0.42
  const handle = (o: number) => `M ${h1[0]} ${h1[1] + o} C ${h1[0] + reach - o} ${h1[1] + o} ${h2[0] + reach - o} ${h2[1] - o} ${h2[0]} ${h2[1] - o}`
  const st = { stroke: CHALK, strokeOpacity: op, strokeWidth: 2.4, strokeLinecap: "round" as const }
  return [
    <path key="mb" d={body} fill={CHALK} fillOpacity={0.06 * op} {...st} />,
    <ellipse key="mt" cx={top[0]} cy={top[1]} rx={rx} ry={ry} fill="#0d1216" {...st} />,
    <path key="mh1" d={handle(0)} fill="none" {...st} />,
    <path key="mh2" d={handle(h * 0.1)} fill="none" {...st} />,
  ]
}

/** Angle marks: one, two or three arcs, as the papers mark matching angles; a square for a right angle. */
function Marks({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const m of S.marks) {
    const sh = shapeOf(S, m.sh)
    if (!sh || sh.ghost) continue
    const i = sh.order.indexOf(m.at), k = sh.order.length
    const p = sh.order[(i + k - 1) % k], q = sh.order[(i + 1) % k]
    const C = atS(S, sh, m.at), u1 = unit(sub(atS(S, sh, p), C)), u2 = unit(sub(atS(S, sh, q), C))
    const r0 = markRadius(S, sh, m.at)
    const col = m.col ?? CHALK
    const op = sh.quiet ? 0.35 : 1
    if (m.square) {
      const s = 12, a = add(C, mul(u1, s)), b = add(add(C, mul(u1, s)), mul(u2, s)), c = add(C, mul(u2, s))
      out.push(<path key={`sq${m.sh}${m.at}`} d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]}`} fill="none" stroke={col} strokeOpacity={op} strokeWidth={2} />)
      continue
    }
    const a1 = Math.atan2(u1[1], u1[0])
    let sw = Math.atan2(u2[1], u2[0]) - a1
    while (sw > Math.PI) sw -= 2 * Math.PI
    while (sw < -Math.PI) sw += 2 * Math.PI
    const arc = (r: number) => {
      const n = 24, pts: Vec[] = []
      for (let j = 0; j <= n; j++) { const t = a1 + (sw * j) / n; pts.push([C[0] + Math.cos(t) * r, C[1] + Math.sin(t) * r]) }
      return pts
    }
    const wedge = [C, ...arc(r0)]
    out.push(<polygon key={`w${m.sh}${m.at}`} points={poly(wedge)} fill={col} fillOpacity={0.12 * op} stroke="none" />)
    if (m.pulse) out.push(<polygon key={`p${m.sh}${m.at}`} points={poly([C, ...arc(r0 + 4)])} fill={col} fillOpacity={0.3} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.15;1;0.15" dur="1.4s" repeatCount="indefinite" /></polygon>)
    for (let j = 0; j < Math.max(1, m.count); j++) {
      out.push(<polyline key={`a${m.sh}${m.at}${j}`} points={poly(arc(r0 + j * 5))} fill="none" stroke={col} strokeOpacity={op} strokeWidth={2} strokeLinecap="round" />)
    }
  }
  return <>{out}</>
}

/** Lines over the figure (an F or a Z, a line carried on): glowing under, solid or dashed over. */
function Lines({ S }: { S: Scene }) {
  return (
    <>
      {S.lines.map((ln, i) => {
        const P = ln.pts.map(p => toScreen(S, p))
        const d = P.map((p, k) => `${k ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
        return (
          <g key={i}>
            {ln.glow && <path d={d} fill="none" stroke={ln.col} strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" filter="url(#pl-soft)"><animate attributeName="stroke-opacity" values="0.15;0.6;0.15" dur="1.8s" repeatCount="indefinite" /></path>}
            <path d={d} fill="none" stroke={ln.col} strokeWidth={ln.w ?? 3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ln.dash ? "6 6" : undefined} />
          </g>
        )
      })}
    </>
  )
}

/** What the student can drag: a yellow handle with a breathing ring (the ring stops while it is held). */
function Handles({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const h of S.handles) {
    if (S.locked.has(h.id)) continue
    const held = S.drag?.kind === "handle" && S.drag.id === h.id
    const p = handleAt(S, h)
    if (h.kind === "move") {
      // the whole shape can be carried: it breathes
      const sh = shapeOf(S, h.sh)!
      const P = sh.order.map(n => atS(S, sh, n))
      if (!held) out.push(<polygon key={`m${h.id}`} points={poly(P)} fill={YELLOW} fillOpacity={0.1} stroke="none"><animate attributeName="fill-opacity" values="0.04;0.18;0.04" dur="1.8s" repeatCount="indefinite" /></polygon>)
      continue
    }
    out.push(
      <g key={h.id}>
        {!held && <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.6}><animate attributeName="r" values="7;20;7" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" /></circle>}
        <circle cx={p[0]} cy={p[1]} r={held ? 9 : 7} fill={YELLOW} filter="url(#pl-soft)" />
      </g>,
    )
  }
  return <>{out}</>
}

/** Bars of parts, one under another, sharing one scale, each part labelled. */
function Bars({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (!S.bars || op < 0.01) return null
  const rows = S.bars
  const total = Math.max(...rows.map(r => r.parts.reduce((s, p) => s + p.w, 0)))
  const nameW = L.compact ? 44 : 60
  const W = Math.min(600, S.w - 2 * (L.compact ? 16 : 40) - nameW)
  const x0 = (S.w - W) / 2 + nameW / 2
  const u = W / total
  const h = L.compact ? 26 : 32, gap = L.compact ? 8 : 10
  const shapes: React.ReactNode[] = [], texts: React.ReactNode[] = []
  rows.forEach((r, i) => {
    const y = L.barsY + 8 + i * (h + gap)
    let x = x0
    r.parts.forEach((pt, j) => {
      const w = pt.w * u
      shapes.push(<rect key={`b${i}${j}`} x={x} y={y} width={w} height={h} rx={3} fill={pt.col} fillOpacity={pt.dash ? 0 : 0.3} stroke={pt.col} strokeWidth={1.6} strokeDasharray={pt.dash ? "4 4" : undefined}>{pt.pulse && <animate attributeName="fill-opacity" values="0.2;0.6;0.2" dur="1.6s" repeatCount="indefinite" />}</rect>)
      if (pt.tex) texts.push(<div key={`t${i}${j}`} className={styles.label} style={{ ...place([x + w / 2, y + h / 2]), color: CHALK, fontSize: L.compact ? 15 : 18, opacity: op }}><Tex tex={pt.tex} /></div>)
      x += w
    })
    texts.push(<div key={`n${i}`} className={styles.label} style={{ ...place([x0 - nameW / 2, y + h / 2]), color: CHALK, fontSize: L.compact ? 16 : 19, opacity: op }}><Tex tex={r.label} /></div>)
  })
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden style={{ opacity: op }}>{shapes}</svg>
      {texts}
    </>
  )
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

