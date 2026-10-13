"use client"

import styles from "../beats.module.css"
import { Tex, Phrase } from "../Tex"
import { type Vec, add, sub, mul, unit, lerpV, clamp, ease, sectorPath, arcPath } from "../geometry"
import { nxt, wedgeIn, wedgeOut, fan, centroidOf, shownInteriors, angleSum } from "./poly"
import {
  type Scene, type Layout, CHALK, GREEN, YELLOW, PINK, GREY, TRI_COLOURS,
  rgb, hexRgb, arcR, labelAt, labelSizeFor, sumSlots, walkerPose, shownTurn, cornerColour,
} from "./scene"

/**
 * Draws the board. Pure: everything comes from the scene. Shapes are SVG;
 * every number is KaTeX laid over the SVG at the same pixel coordinates.
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h) return null
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v
  const D = S.D
  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${S.w} ${S.h}`} width={S.w} height={S.h} aria-hidden>
        <defs>
          <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <DrawLayer S={S} />
        {S.overlay && <OverlayLayer S={S} vis={vis} />}
        {D && <ShapeLayer S={S} L={L} D={D} vis={vis} />}
        {D && <ExteriorLayer S={S} L={L} D={D} vis={vis} />}
        <DialLayer S={S} L={L} vis={vis} />
        {D && <WalkerLayer S={S} D={D} vis={vis} />}
        {D && <Nodes S={S} D={D} vis={vis} />}
      </svg>
      {D && <Labels S={S} L={L} D={D} vis={vis} />}
      <OverlayLabels S={S} vis={vis} />
      <DialLabels S={S} L={L} vis={vis} />
      <BottomLine S={S} L={L} />
    </>
  )
}

type VisFn = (k: keyof Scene["vis"]) => number
const pts = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })

function mix(a: string, b: string, t: number) {
  const x = hexRgb(a), y = hexRgb(b)
  return rgb([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t])
}

// ── drawing strokes ──────────────────────────────────────────────────────

function DrawLayer({ S }: { S: Scene }) {
  const line = (a: Vec, b: Vec, key: string, op = 1, color = CHALK) => (
    <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeOpacity={op} strokeWidth={2.6} strokeLinecap="round" />
  )
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(line(f.a, f.b, `f${i}`, Math.max(0, f.life) * 0.7, PINK)))
  for (let i = 0; i + 1 < S.chain.length; i++) out.push(line(S.chain[i], S.chain[i + 1], `c${i}`))
  if (S.stroke) out.push(line(S.stroke.from, S.stroke.to, "s", 1, S.stroke.closing ? GREEN : CHALK))
  if (S.mode === "draw" && S.chain.length >= 2) {
    [S.chain[0], S.chain[S.chain.length - 1]].forEach((p, i) => out.push(
      <g key={`e${i}`}>
        <circle cx={p[0]} cy={p[1]} r={6} fill={YELLOW} />
        <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
          <animate attributeName="r" values="9;22;9" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>,
    ))
  }
  if (S.mode === "draw" && !S.drewOnce && S.chain.length === 0) {
    const t = S.time - S.beatStart - 1.2
    if (t > 0) {
      const cyc = t % 3.6
      const grow = ease(cyc / 1.3)
      const fade = cyc < 1.6 ? 1 : 1 - clamp((cyc - 1.6) / 0.7, 0, 1)
      const cx = S.w / 2, cy = (S.h + 120) / 2
      const a: Vec = [cx - 90, cy + 50], b: Vec = [cx + 70, cy - 40]
      const p = lerpV(a, b, grow)
      out.push(
        <g key="ghost" opacity={fade * 0.55}>
          <line x1={a[0]} y1={a[1]} x2={p[0]} y2={p[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 7" />
          <circle cx={p[0]} cy={p[1]} r={13} fill={YELLOW} fillOpacity={0.16} stroke={YELLOW} strokeOpacity={0.6} strokeWidth={1.5} />
        </g>,
      )
    }
  }
  return <>{out}</>
}

// ── the shape, its triangles, its corner angles ──────────────────────────

function ShapeLayer({ S, L, D, vis }: { S: Scene; L: Layout; D: Vec[]; vis: VisFn }) {
  const n = D.length
  const stroke = S.flashGood > 0 ? mix(CHALK, GREEN, Math.min(1, S.flashGood * 1.6)) : CHALK
  const shown = S.P ? shownInteriors(S.P) : []
  const out: React.ReactNode[] = []

  // triangles from one corner, shaded
  const tv = vis("tris")
  if (tv > 0.01) {
    fan(S.diagFrom % n, n).forEach((t, k) => {
      const c = TRI_COLOURS[k % TRI_COLOURS.length]
      out.push(<polygon key={`t${k}`} points={pts(t.map(i => D[i]))} fill={rgb(hexRgb(c), 0.13 * tv)} stroke="none" />)
    })
  }

  out.push(<polygon key="shape" points={pts(D)} fill="rgba(240,238,234,0.035)" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" opacity={vis("shape")} />)

  // sides breathe when the student can tap one to add a corner
  if (S.sidePulse) {
    for (let i = 0; i < n; i++) {
      const a = D[i], b = D[nxt(i, n)]
      out.push(
        <line key={`sp${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={4} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.05;0.55;0.05" dur="2s" repeatCount="indefinite" />
        </line>,
      )
    }
  }

  // lines from one corner
  const dv = vis("diags")
  if (dv > 0.01) {
    for (const k of S.diags) {
      const g = ease(S.diagGrow[k] ?? 1)
      const a = D[S.diagFrom % n], b = lerpV(a, D[k % n], g)
      out.push(<line key={`d${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2} strokeDasharray="7 6" strokeLinecap="round" opacity={dv} />)
    }
  }
  if (S.diagStroke) {
    const a = D[S.diagFrom % n], b = S.diagStroke.to
    out.push(<line key="dstroke" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={S.diagStroke.snapK !== null ? GREEN : YELLOW} strokeWidth={2.4} strokeLinecap="round" />)
  }

  // corner angles
  const av = vis("arcs") * (1 - vis("split"))
  if (av > 0.01) {
    for (let i = 0; i < n; i++) {
      const col = S.colD[i] ?? hexRgb(CHALK)
      const w = wedgeIn(D, i)
      const r = arcR(S, L, i) * ease(vis("arcs"))
      const square = shown[i] === 90 && Math.abs(w.sweep * 57.2958 - 90) < 1
      out.push(
        <g key={`a${i}`} opacity={av}>
          {square ? (
            <RightMark D={D} i={i} size={Math.min(r * 0.7, 22)} color={rgb(col)} />
          ) : (
            <>
              <path d={sectorPath(w.c, w.start, w.sweep, r)} fill={rgb(col, 0.17)} />
              <path d={arcPath(w.c, w.start, w.sweep, r)} fill="none" stroke={rgb(col)} strokeWidth={2.2} strokeLinecap="round" />
            </>
          )}
          {S.pulse[i] && (
            <path d={sectorPath(w.c, w.start, w.sweep, r + 2)} fill="none" stroke={rgb(col)} strokeWidth={3} filter="url(#pl-soft)">
              <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.6s" repeatCount="indefinite" />
            </path>
          )}
        </g>,
      )
    }
  }

  // each triangle's own corners, in the triangle's colour: they fill the
  // shape's corners exactly
  const sv = vis("split")
  if (sv > 0.01) {
    fan(S.diagFrom % n, n).forEach((t, k) => {
      const c = TRI_COLOURS[k % TRI_COLOURS.length]
      const T = t.map(i => D[i])
      for (let j = 0; j < 3; j++) {
        const w = wedgeIn(T, j)
        const r = Math.min(arcR(S, L, t[j]), 34) * (0.75 + 0.12 * (k % 2))
        out.push(
          <g key={`s${k}-${j}`} opacity={sv}>
            <path d={sectorPath(w.c, w.start, w.sweep, r)} fill={rgb(hexRgb(c), 0.3)} />
            <path d={arcPath(w.c, w.start, w.sweep, r)} fill="none" stroke={c} strokeWidth={2} />
          </g>,
        )
      }
    })
  }

  // equal-side marks on a regular polygon
  if (S.ticks) {
    const kv = vis("ticks")
    for (let i = 0; i < n; i++) {
      const a = D[i], b = D[nxt(i, n)]
      const m = lerpV(a, b, 0.5)
      const u = unit(sub(b, a))
      const nn: Vec = [-u[1], u[0]]
      const p1 = add(m, mul(nn, 7 * kv)), p2 = add(m, mul(nn, -7 * kv))
      out.push(<line key={`k${i}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={YELLOW} strokeWidth={2.2} strokeLinecap="round" opacity={kv} />)
    }
  }
  return <>{out}</>
}

function RightMark({ D, i, size, color }: { D: Vec[]; i: number; size: number; color: string }) {
  const n = D.length
  const c = D[i]
  const u = unit(sub(D[nxt(i, n)], c)), v = unit(sub(D[(i - 1 + n) % n], c))
  const a = add(c, mul(u, size)), b = add(add(c, mul(u, size)), mul(v, size)), d = add(c, mul(v, size))
  return <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${d[0]} ${d[1]}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
}

// ── exterior angles: sides carried on past their corners ─────────────────

function ExteriorLayer({ S, L, D, vis }: { S: Scene; L: Layout; D: Vec[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const ev = vis("ext")
  const full = 70 * (L.compact ? 0.8 : 1)
  const ext = (i: number, length: number, op: number, wedge: boolean) => {
    const w = wedgeOut(D, i)
    const tip = add(D[i], mul(w.dirIn, length))
    out.push(<line key={`x${i}`} x1={D[i][0]} y1={D[i][1]} x2={tip[0]} y2={tip[1]} stroke={CHALK} strokeWidth={1.8} strokeDasharray="6 5" strokeLinecap="round" opacity={op} />)
    if (wedge) {
      const col = hexRgb(cornerColour(i))
      const r = Math.min(length * 0.55, 30)
      out.push(
        <g key={`xw${i}`} opacity={op}>
          <path d={sectorPath(w.c, w.start, w.sweep, r)} fill={rgb(col, 0.3)} />
          <path d={arcPath(w.c, w.start, w.sweep, r)} fill="none" stroke={rgb(col)} strokeWidth={2.2} />
        </g>,
      )
    }
  }
  if (S.mode === "extend") {
    const i = S.extCorner % D.length
    // the side being stretched, and a ghost of where it goes
    const w = wedgeOut(D, i)
    const ghost = add(D[i], mul(w.dirIn, full))
    out.push(<line key="ghost" x1={D[i][0]} y1={D[i][1]} x2={ghost[0]} y2={ghost[1]} stroke={YELLOW} strokeOpacity={0.25} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" />)
    if (S.extLen > 1) ext(i, S.extLen, 1, false)
  }
  if (ev > 0.01) for (const i of S.extCorners) if (i < D.length) ext(i, full, ev, true)
  return <>{out}</>
}

// ── the dial that collects the turns ─────────────────────────────────────

/** Wedges in the dial right now: [degrees, colour, opacity, overflow]. */
function dialWedges(S: Scene): { deg: number; color: string; op: number; over?: boolean }[] {
  const d = S.dial
  const P = S.P
  if (d.mode === "live" && P) return P.map((_, i) => ({ deg: shownTurn(S, i), color: cornerColour(i), op: 1 }))
  if (d.mode === "regular" && P) return P.map((_, i) => ({ deg: 360 / P.length, color: cornerColour(i), op: 1 }))
  if (d.mode === "walk") return d.wedges.map(w => ({ deg: w.deg, color: w.color, op: clamp((S.time - w.born) / 0.4, 0, 1) }))
  if ((d.mode === "fill" || d.mode === "impossible") && d.fill) {
    const f = d.fill
    const count = Math.min(f.max, Math.floor((S.time - f.start) / f.every) + 1)
    const out = []
    for (let k = 0; k < Math.max(0, count); k++) {
      const born = f.start + k * f.every
      const over = (k + 1) * f.deg > 360 + 0.01
      out.push({ deg: f.deg, color: over ? PINK : cornerColour(k), op: clamp((S.time - born) / 0.35, 0, 1), over })
    }
    return out
  }
  return []
}

function DialLayer({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const dv = vis("dial")
  if (dv < 0.01 || L.dialR <= 0) return null
  const C = L.dialC, R = L.dialR
  let start = -Math.PI / 2
  const items = dialWedges(S)
  const total = items.reduce((s, w) => s + w.deg, 0)
  const out: React.ReactNode[] = []
  items.forEach((w, k) => {
    const sw = (w.deg * Math.PI) / 180
    const r = w.over ? R * 1.12 : R
    out.push(
      <g key={k} opacity={w.op * dv}>
        <path d={sectorPath(C, start, sw, r)} fill={rgb(hexRgb(w.color), w.over ? 0.25 : 0.32)} stroke={w.color} strokeWidth={w.over ? 2 : 1.2} strokeDasharray={w.over ? "4 4" : undefined} />
      </g>,
    )
    start += sw
  })
  // the gap still to fill, when the impossible case falls short
  if (S.dial.mode === "impossible" && total < 360 && items.length >= 4) {
    const gap = ((360 - total) * Math.PI) / 180
    out.push(<path key="gap" d={sectorPath(C, start, gap, R)} fill="rgba(255,70,112,0.08)" stroke={PINK} strokeWidth={1.6} strokeDasharray="4 4" opacity={dv} />)
  }
  return (
    <g>
      <circle cx={C[0]} cy={C[1]} r={R} fill="none" stroke={GREY} strokeWidth={1.4} opacity={0.6 * dv} />
      <line x1={C[0]} y1={C[1]} x2={C[0]} y2={C[1] - R - 6} stroke={GREY} strokeWidth={1.4} opacity={0.6 * dv} />
      {out}
    </g>
  )
}

function DialLabels({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const dv = vis("dial")
  if (dv < 0.01 || L.dialR <= 0) return null
  const items = dialWedges(S)
  const total = items.reduce((s, w) => s + w.deg * (w.op > 0.5 ? 1 : 0), 0)
  const full = Math.abs(total - 360) < 0.01 && S.dial.mode !== "impossible"
  if (!full) return null
  return (
    <div className={styles.label} style={{ ...place([L.dialC[0] + L.dialR + 34, L.dialC[1]]), color: GREEN, fontSize: L.labelSize, opacity: dv }}>
      <Tex tex={"360^\\circ"} />
    </div>
  )
}

// ── the walker going round ───────────────────────────────────────────────

function WalkerLayer({ S, D, vis }: { S: Scene; D: Vec[]; vis: VisFn }) {
  const wv = vis("walker")
  const pose = walkerPose(S)
  if (wv < 0.01 || !pose || !S.walk) return null
  const n = D.length
  const W = S.walk
  const trail: React.ReactNode[] = []
  for (let s = 0; s < W.steps; s++) {
    const a = D[s % n], b = D[(s + 1) % n]
    trail.push(<line key={s} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />)
  }
  if (W.phase === "walk") {
    const a = D[W.at]
    trail.push(<line key="now" x1={a[0]} y1={a[1]} x2={pose.p[0]} y2={pose.p[1]} stroke={YELLOW} strokeOpacity={0.45} strokeWidth={4} strokeLinecap="round" />)
  }
  const f: Vec = [Math.cos(pose.h), Math.sin(pose.h)]
  const sd: Vec = [-f[1], f[0]]
  const tip = add(pose.p, mul(f, 15)), l = add(add(pose.p, mul(f, -9)), mul(sd, 9)), r = add(add(pose.p, mul(f, -9)), mul(sd, -9))
  const idle = W.phase === "idle" && W.turns < n
  return (
    <g opacity={wv}>
      {trail}
      {idle && (
        <circle cx={pose.p[0]} cy={pose.p[1]} r={16} fill="none" stroke={YELLOW} strokeWidth={1.5}>
          <animate attributeName="r" values="14;26;14" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
        </circle>
      )}
      <path d={`M ${tip[0]} ${tip[1]} L ${l[0]} ${l[1]} L ${r[0]} ${r[1]} Z`} fill={YELLOW} filter="url(#pl-soft)" />
    </g>
  )
}

// ── corners ──────────────────────────────────────────────────────────────

function Nodes({ S, D, vis }: { S: Scene; D: Vec[]; vis: VisFn }) {
  const nv = vis("nodes")
  const diagCorner = S.mode === "diag" ? S.diagFrom % D.length : -1
  const extCorner = S.mode === "extend" ? S.extCorner % D.length : -1
  return (
    <g>
      {D.map((p, i) => {
        const live = S.glow[i] || i === diagCorner || i === extCorner
        const held = S.drag?.i === i
        if (!live && nv < 0.01) return null
        return (
          <g key={i} opacity={live ? 1 : nv}>
            {live && !held && (
              <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
                <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={p[0]} cy={p[1]} r={held ? 10 : live ? 7 : 3.5} fill={live ? YELLOW : CHALK} filter={live ? "url(#pl-soft)" : undefined} />
          </g>
        )
      })}
    </g>
  )
}

// ── a figure that is not the student's shape (the exam diagram) ──────────

function OverlayLayer({ S, vis }: { S: Scene; vis: VisFn }) {
  const ov = vis("overlay")
  const O = S.overlay!
  return (
    <g opacity={ov}>
      {O.polys.map((p, k) => <polygon key={k} points={pts(p.pts)} fill={p.fill} stroke={p.stroke} strokeWidth={2.4} strokeLinejoin="round" />)}
      {O.wedges.map((w, k) => (
        <g key={`w${k}`}>
          <path d={sectorPath(w.c, w.start, w.sweep, w.r)} fill={rgb(hexRgb(w.color), 0.22)} />
          <path d={arcPath(w.c, w.start, w.sweep, w.r)} fill="none" stroke={w.color} strokeWidth={2.2} />
        </g>
      ))}
    </g>
  )
}

function OverlayLabels({ S, vis }: { S: Scene; vis: VisFn }) {
  const ov = vis("overlay")
  if (!S.overlay || ov < 0.01) return null
  return (
    <>
      {S.overlay.wedges.filter(w => w.label).map((w, k) => {
        const mid = w.start + w.sweep / 2
        const p = add(w.c, mul([Math.cos(mid), Math.sin(mid)], w.r + 22))
        return (
          <div key={k} className={styles.label} style={{ ...place(p), color: w.labelColor ?? w.color, fontSize: 21, opacity: ov }}>
            <Tex tex={w.label!} />
          </div>
        )
      })}
    </>
  )
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L, D, vis }: { S: Scene; L: Layout; D: Vec[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const n = D.length
  const shown = S.P ? shownInteriors(S.P) : []
  const size = labelSizeFor(S, L)

  const vv = vis("values") * (1 - vis("split"))
  if (vv > 0.01) {
    for (let i = 0; i < n; i++) {
      const ov = S.label[i]
      if (ov === "") continue
      out.push(
        <div key={`v${i}`} className={styles.label} style={{ ...place(labelAt(S, L, i)), opacity: vv, color: rgb(S.colD[i] ?? hexRgb(CHALK)), fontSize: size }}>
          <Tex tex={ov ?? `${shown[i]}^\\circ`} />
        </div>,
      )
    }
  }

  // 180 inside each triangle
  const tl = vis("triLabels")
  if (tl > 0.01) {
    fan(S.diagFrom % n, n).forEach((t, k) => {
      const c = centroidOf(t.map(i => D[i]))
      out.push(
        <div key={`tl${k}`} className={styles.label} style={{ ...place(c), color: GREEN, fontSize: size * 0.9, opacity: tl }}>
          <Tex tex={"180^\\circ"} />
        </div>,
      )
    })
  }

  // exterior angle values, just outside each corner
  const ev = vis("extValues")
  if (ev > 0.01) {
    for (const i of S.extCorners) {
      if (i >= n) continue
      const w = wedgeOut(D, i)
      const mid = w.start + w.sweep / 2
      const p = add(D[i], mul([Math.cos(mid), Math.sin(mid)], 50))
      out.push(
        <div key={`x${i}`} className={styles.label} style={{ ...place(p), color: cornerColour(i), fontSize: size * 0.9, opacity: ev }}>
          <Tex tex={`${shownTurn(S, i)}^\\circ`} />
        </div>,
      )
    }
  }

  // the sum line: each term is a copy of a corner's label that flies down
  const sv = vis("sum")
  if (sv > 0.01 && S.P) {
    const slots = sumSlots(S, L)
    const since = S.time - S.sumShownAt
    const opsOp = clamp((since - 0.75) / 0.45, 0, 1) * clamp(sv * 1.4, 0, 1)
    for (let i = 0; i < n; i++) {
      out.push(
        <div key={`s${i}`} className={styles.label} style={{ ...place(S.termPos[i] ?? D[i]), color: rgb(S.colD[i] ?? hexRgb(CHALK)), fontSize: slots.size, opacity: clamp(sv * 2, 0, 1) }}>
          <Tex tex={S.label[i] && S.label[i] !== "" ? S.label[i]! : `${shown[i]}^\\circ`} />
        </div>,
      )
    }
    for (let k = 0; k < n; k++) {
      out.push(
        <div key={`o${k}`} className={styles.label} style={{ ...place([slots.ops[k], L.lineY]), color: GREY, fontSize: slots.size, opacity: opsOp }}>
          <Tex tex={k === n - 1 ? "=" : "+"} />
        </div>,
      )
    }
    out.push(
      <div key="tot" className={styles.label} style={{ ...place([slots.total, L.lineY]), color: GREEN, fontSize: slots.size, opacity: opsOp }}>
        <Tex tex={`${angleSum(n)}^\\circ`} />
      </div>,
    )
  }
  return <>{out}</>
}

/** The one line near the bottom: an equation to fill, the table, or a line of maths. */
function BottomLine({ S, L }: { S: Scene; L: Layout }) {
  const lv = Math.max(S.vis.line.v, S.vis.table.v)
  if (lv < 0.01) return null
  const top = L.lineY - L.lineSize * 0.85
  const style: React.CSSProperties = { top, height: L.lineSize * 1.7, opacity: S.vis.line.v, ["--line-size" as string]: `${L.lineSize}px` }
  const inp = S.input
  const hint = inp && inp.tries > 0 && inp.hints.length ? inp.hints[Math.min(inp.hints.length - 1, inp.tries - 1)] : null
  const hintLine = hint && S.vis.hint.v > 0.01 ? (
    <div className={styles.line} style={{ top: L.hintY - 16, height: 32, opacity: S.vis.hint.v, color: "#c8c6be", ["--line-size" as string]: `${Math.round(L.lineSize * 0.72)}px` }}>
      <Tex tex={hint} />
    </div>
  ) : null

  if (S.table && S.vis.table.v > 0.01) return <><Table S={S} L={L} />{hintLine}</>

  if (inp) {
    return (
      <>
        <div className={styles.line} style={style}>
          {inp.parts.map((p, k) => typeof p === "string" ? <Tex key={k} tex={p} /> : <AnswerBox key={`${k}-${inp.wrongAt}`} S={S} />)}
        </div>
        {hintLine}
      </>
    )
  }

  if (S.stepper && S.P) {
    const each = angleSum(S.P.length) / S.P.length
    const txt = Number.isInteger(each) ? `${each}` : each.toFixed(1)
    return (
      <div className={styles.line} style={style}>
        <span style={{ color: "#c8c6be", fontSize: "0.8em" }}>each angle</span>
        <Tex tex={`= \\textcolor{${S.locked ? GREEN : "#f0eeea"}}{${txt}^\\circ}`} />
      </div>
    )
  }

  if (S.lineWords) {
    return (
      <div className={styles.line} style={{ ...style, fontSize: L.lineSize * 0.85 }}>
        <span><Phrase text={S.lineWords} /></span>
      </div>
    )
  }
  if (S.lineTex) {
    return (
      <div className={styles.line} style={style}>
        <Tex tex={S.lineTex} />
      </div>
    )
  }
  return null
}

/** The box the student types into. */
function AnswerBox({ S }: { S: Scene }) {
  const inp = S.input!
  const cls = [styles.box, inp.state === "wrong" ? styles.boxWrong : "", inp.state === "right" ? styles.boxRight : ""].join(" ")
  return (
    <span className={cls}>
      {inp.value
        ? <Tex tex={`\\textcolor{${inp.state === "right" ? GREEN : "#f0eeea"}}{${inp.value}${inp.deg ? "^\\circ" : ""}}`} />
        : <span className={styles.boxCaret} />}
    </span>
  )
}

/** Sides against triangles, one column at a time. */
function Table({ S, L }: { S: Scene; L: Layout }) {
  const T = S.table!
  const tv = S.vis.table.v
  const size = L.lineSize * 0.85
  const cell: React.CSSProperties = { width: size * 2.3, textAlign: "center" }
  const head: React.CSSProperties = { width: size * 4.4, textAlign: "right", paddingRight: size * 0.6, color: "#a8a69e", fontSize: size * 0.62 }
  const visible = (k: number) => clamp((S.time - T.start - k * 0.55) / 0.35, 0, 1)
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: L.lineY - size * 1.9, display: "flex", justifyContent: "center", opacity: tv, fontSize: size, pointerEvents: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: size * 0.2 }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={head}>sides</span>
          {T.cols.map(([s], k) => <span key={k} style={{ ...cell, opacity: visible(k) }}><Tex tex={`${s}`} /></span>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", height: size * 0.9 }}>
          <span style={head} />
          {T.cols.map((_, k) => (
            <span key={k} style={{ ...cell, opacity: T.gap ? visible(k) : 0, color: GREEN, fontSize: size * 0.6, transition: "opacity 400ms" }}>
              <Tex tex={"\\downarrow -2"} />
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <span style={head}>triangles</span>
          {T.cols.map(([, t], k) => (
            <span key={k} style={{ ...cell, opacity: visible(k), color: t === null ? PINK : "#f0eeea", display: "flex", justifyContent: "center" }}>
              {t === null && S.input
                ? <span key={S.input.wrongAt} style={{ fontSize: "0.85em" }}><AnswerBox S={S} /></span>
                : <Tex tex={t === null ? "?" : `${t}`} />}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
