"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import {
  type Vec, add, sub, mul, unit, lerpV, clamp, ease, sectorPath, arcPath, wedgeAt, wholeAngles,
} from "../geometry"
import {
  type Scene, type Layout, CHALK, GREEN, YELLOW, PINK, GREY,
  rgb, hexRgb, arcRadius, valuePos, sumSlots, tornWedge,
} from "./scene"

/**
 * Draws the board. Pure: everything it shows comes from the scene.
 * Shapes are SVG; every number and symbol is KaTeX laid over the SVG in
 * the same pixel coordinates (no foreignObject, which drifts on iOS).
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  const { w, h } = S
  if (!w || !h) return null
  const D = S.D
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v

  return (
    <>
      <svg className={styles.svg} viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden>
        <defs>
          <filter id="pl-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <DrawLayer S={S} />
        {D && <TriangleLayer S={S} L={L} D={D} vis={vis} />}
        {D && <FanLayer S={S} L={L} vis={vis} />}
        {D && <HelpFan S={S} L={L} vis={vis} />}
        {D && <Nodes S={S} D={D} vis={vis} />}
      </svg>

      {D && <Labels S={S} L={L} D={D} vis={vis} />}
      <BottomLine S={S} L={L} />
    </>
  )
}

type VisFn = (k: keyof Scene["vis"]) => number

// ── drawing: the strokes before there is a triangle ──────────────────────

function DrawLayer({ S }: { S: Scene }) {
  const line = (a: Vec, b: Vec, key: string, op = 1, color = CHALK) => (
    <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={color} strokeOpacity={op}
      strokeWidth={2.6} strokeLinecap="round" />
  )
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(line(f.a, f.b, `f${i}`, Math.max(0, f.life) * 0.7, PINK)))
  for (let i = 0; i + 1 < S.chain.length; i++) out.push(line(S.chain[i], S.chain[i + 1], `c${i}`))
  if (S.stroke) {
    out.push(line(S.stroke.from, S.stroke.to, "s", 1, S.stroke.closing ? GREEN : CHALK))
  }

  // The open ends of an unfinished drawing breathe, to show where to carry on.
  if (S.mode === "draw" && S.chain.length >= 2) {
    const ends = [S.chain[0], S.chain[S.chain.length - 1]]
    ends.forEach((p, i) => out.push(
      <g key={`e${i}`}>
        <circle cx={p[0]} cy={p[1]} r={6} fill={YELLOW} />
        <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
          <animate attributeName="r" values="9;22;9" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>,
    ))
  }

  // Before the first stroke: a faint finger drawing one line, on a loop,
  // so the student sees that dragging is how you draw.
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

// ── the triangle, its angle marks and its equal-side ticks ───────────────

function TriangleLayer({ S, L, D, vis }: { S: Scene; L: Layout; D: Vec[]; vis: VisFn }) {
  const flash = S.flashGood
  const stroke = flash > 0 ? mix(CHALK, GREEN, Math.min(1, flash * 1.6)) : CHALK
  const pts = D.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  const arcsV = vis("arcs")
  const whole = wholeAngles(D)

  const arcs: React.ReactNode[] = []
  if (arcsV > 0.01) {
    for (let i = 0; i < 3; i++) {
      const col = S.colD[i]
      const w = wedgeAt(D, i)
      const r = arcRadius(D, i, L.compact) * ease(arcsV)
      const torn = S.tear[i].on
      const op = torn ? 0.22 : 1
      const shake = S.time - S.shakeAt[i] < 0.45 ? Math.sin((S.time - S.shakeAt[i]) * 50) * 4 * (1 - (S.time - S.shakeAt[i]) / 0.45) : 0
      const g = mul(unit(sub(D[(i + 1) % 3], D[(i + 2) % 3])), shake)
      const square = Math.abs(whole[i] - 90) < 0.5 && Math.abs(w.sweep * 57.2958 - 90) < 0.8
      arcs.push(
        <g key={`a${i}`} opacity={op} transform={`translate(${g[0].toFixed(2)} ${g[1].toFixed(2)})`}>
          {square ? (
            <RightMark D={D} i={i} size={Math.min(r * 0.7, 24)} color={rgb(col)} />
          ) : (
            <>
              <path d={sectorPath(w.c, w.start, w.sweep, r)} fill={rgb(col, 0.17)} />
              <path d={arcPath(w.c, w.start, w.sweep, r)} fill="none" stroke={rgb(col)} strokeWidth={2.2} strokeLinecap="round" />
            </>
          )}
          {S.pulse[i] && !torn && (square ? (
            <g filter="url(#pl-soft)">
              <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.6s" repeatCount="indefinite" />
              <RightMark D={D} i={i} size={Math.min(r * 0.7, 24) + 2} color={rgb(col)} />
            </g>
          ) : (
            <path d={sectorPath(w.c, w.start, w.sweep, r + 2)} fill="none" stroke={rgb(col)} strokeWidth={3} filter="url(#pl-soft)">
              <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.6s" repeatCount="indefinite" />
            </path>
          ))}
        </g>,
      )
    }
  }

  const ticks: React.ReactNode[] = []
  const tv = vis("ticks")
  if (tv > 0.01 && S.tickKind !== "none") {
    const sides: [number, number][] =
      S.tickKind === "equi" ? [[0, 1], [1, 2], [2, 0]] : [[S.apex, (S.apex + 1) % 3], [S.apex, (S.apex + 2) % 3]]
    sides.forEach(([a, b], k) => {
      const m = lerpV(D[a], D[b], 0.5)
      const u = unit(sub(D[b], D[a]))
      const n: Vec = [-u[1], u[0]]
      const p1 = add(m, mul(n, 8 * tv)), p2 = add(m, mul(n, -8 * tv))
      ticks.push(<line key={`t${k}`} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" opacity={tv} />)
    })
  }

  return (
    <g opacity={vis("tri")}>
      <polygon points={pts} fill="rgba(240,238,234,0.035)" stroke={stroke} strokeWidth={2.4} strokeLinejoin="round" />
      {arcs}
      {ticks}
    </g>
  )
}

function RightMark({ D, i, size, color }: { D: Vec[]; i: number; size: number; color: string }) {
  const c = D[i]
  const u = unit(sub(D[(i + 1) % 3], c)), v = unit(sub(D[(i + 2) % 3], c))
  const a = add(c, mul(u, size)), b = add(add(c, mul(u, size)), mul(v, size)), d = add(c, mul(v, size))
  return (
    <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${d[0]} ${d[1]}`} fill="none" stroke={color} strokeWidth={2.2}
      strokeLinejoin="round" />
  )
}

// ── the straight line the torn corners land on ───────────────────────────

function FanLayer({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const fv = vis("fan")
  if (fv < 0.01 || !S.D) return null
  const { fanO: O, fanR: R } = L
  const half = R + 34
  const lineCol = S.pulseLine ? YELLOW : CHALK
  const wedges = [0, 1, 2].filter(i => S.tear[i].on).map(i => {
    const tw = tornWedge(S, i, L)
    const col = S.colD[i]
    return (
      <g key={i}>
        <path d={sectorPath(tw.c, tw.start, tw.sweep, tw.r)} fill={rgb(col, 0.22 + 0.2 * tw.e)} />
        <path d={arcPath(tw.c, tw.start, tw.sweep, tw.r)} fill="none" stroke={rgb(col)} strokeWidth={2.2} />
      </g>
    )
  })
  return (
    <g opacity={fv}>
      <line x1={O[0] - half} y1={O[1]} x2={O[0] + half} y2={O[1]} stroke={lineCol} strokeWidth={2.4} strokeLinecap="round"
        filter={S.pulseLine ? "url(#pl-soft)" : undefined}>
        {S.pulseLine && <animate attributeName="stroke-opacity" values="0.5;1;0.5" dur="1.6s" repeatCount="indefinite" />}
      </line>
      {wedges}
    </g>
  )
}

/** Help for a missing angle: the known angles on a straight line, and the gap. */
function HelpFan({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const hv = vis("helpFan")
  if (hv < 0.01 || !S.input) return null
  const { fanO: O, fanR: R } = L
  let start = Math.PI
  const parts: React.ReactNode[] = []
  for (const [k, seg] of S.input.known.entries()) {
    const sw = (seg.deg * Math.PI) / 180
    parts.push(
      <g key={k}>
        <path d={sectorPath(O, start, sw, R)} fill={rgb(hexRgb(seg.color), 0.3)} />
        <path d={arcPath(O, start, sw, R)} fill="none" stroke={seg.color} strokeWidth={2} />
      </g>,
    )
    start += sw
  }
  const gap = 2 * Math.PI - start
  parts.push(
    <path key="gap" d={sectorPath(O, start, gap, R)} fill="rgba(255,70,112,0.08)" stroke={PINK} strokeWidth={2}
      strokeDasharray="5 5" strokeLinejoin="round" />,
  )
  const half = R + 34
  return (
    <g opacity={hv}>
      <line x1={O[0] - half} y1={O[1]} x2={O[0] + half} y2={O[1]} stroke={CHALK} strokeWidth={2.2} strokeLinecap="round" />
      {parts}
    </g>
  )
}

// ── corners: the handles the student drags ───────────────────────────────

function Nodes({ S, D, vis }: { S: Scene; D: Vec[]; vis: VisFn }) {
  const nv = vis("nodes")
  if (nv < 0.01) return null
  return (
    <g opacity={nv}>
      {D.map((p, i) => {
        const live = S.glow[i]
        const held = S.drag?.i === i
        return (
          <g key={i}>
            {live && !held && (
              <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
                <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={p[0]} cy={p[1]} r={held ? 10 : live ? 7 : 3.5} fill={live ? YELLOW : CHALK}
              filter={live ? "url(#pl-soft)" : undefined} />
          </g>
        )
      })}
    </g>
  )
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L, D, vis }: { S: Scene; L: Layout; D: Vec[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const vv = vis("values")
  const whole = wholeAngles(D)
  const place = (p: Vec): React.CSSProperties => ({
    transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)`,
  })

  if (vv > 0.01) {
    for (let i = 0; i < 3; i++) {
      const ov = S.label[i]
      if (ov === "") continue
      const tex = ov ?? `${whole[i]}^\\circ`
      out.push(
        <div key={`v${i}`} className={styles.label}
          style={{ ...place(valuePos(D, i, L.compact, L.labelSize)), opacity: vv, color: rgb(S.colD[i]), fontSize: L.labelSize }}>
          <Tex tex={tex} />
        </div>,
      )
    }
  }

  // The sum line: each term is a copy of a corner's label that flies down.
  const sv = vis("sum")
  if (sv > 0.01) {
    const slots = sumSlots(S, L)
    const since = S.time - S.sumShownAt
    const opsOp = clamp((since - 0.75) / 0.45, 0, 1) * clamp(sv * 1.4, 0, 1)
    for (let i = 0; i < 3; i++) {
      out.push(
        <div key={`s${i}`} className={styles.label}
          style={{ ...place(S.termPos[i]), color: rgb(S.colD[i]), fontSize: L.lineSize, opacity: clamp(sv * 2, 0, 1) }}>
          <Tex tex={`${whole[i]}^\\circ`} />
        </div>,
      )
    }
    const ops = ["+", "+", "="]
    ops.forEach((o, k) => out.push(
      <div key={`o${k}`} className={styles.label} style={{ ...place([slots.ops[k], L.lineY]), color: GREY, fontSize: L.lineSize, opacity: opsOp }}>
        <Tex tex={o} />
      </div>,
    ))
    out.push(
      <div key="tot" className={styles.label} style={{ ...place([slots.total, L.lineY]), color: GREEN, fontSize: L.lineSize, opacity: opsOp }}>
        <Tex tex={"180^\\circ"} />
      </div>,
    )
  }

  // 180 above the straight line, once the corners are on it.
  const f180 = vis("fan180")
  if (f180 > 0.01) {
    out.push(
      <div key="f180" className={styles.label}
        style={{ ...place([L.fanO[0], L.fanO[1] - L.fanR - 22]), color: GREEN, fontSize: L.labelSize + 4, opacity: f180 }}>
        <Tex tex={"180^\\circ"} />
      </div>,
    )
  }

  // Help fan labels: each known angle in its wedge, a ? in the gap.
  const hv = vis("helpFan")
  if (hv > 0.01 && S.input) {
    let start = Math.PI
    const R = L.fanR
    for (const [k, seg] of S.input.known.entries()) {
      const sw = (seg.deg * Math.PI) / 180
      const mid = start + sw / 2
      out.push(
        <div key={`hk${k}`} className={styles.label}
          style={{ ...place(add(L.fanO, mul([Math.cos(mid), Math.sin(mid)], R * 0.62))), color: seg.color, fontSize: 14, opacity: hv }}>
          <Tex tex={`${seg.deg}^\\circ`} />
        </div>,
      )
      start += sw
    }
    const mid = (start + 2 * Math.PI) / 2
    out.push(
      <div key="hq" className={styles.label}
        style={{ ...place(add(L.fanO, mul([Math.cos(mid), Math.sin(mid)], R * 0.62))), color: PINK, fontSize: 18, opacity: hv }}>
        <Tex tex="?" />
      </div>,
    )
    out.push(
      <div key="h180" className={styles.label}
        style={{ ...place([L.fanO[0], L.fanO[1] - R - 20]), color: GREEN, fontSize: 15, opacity: hv }}>
        <Tex tex={"180^\\circ"} />
      </div>,
    )
  }

  // Torn-corner labels ride with their wedge.
  if (S.tear.some(t => t.on) && vis("fan") > 0.01) {
    for (const i of S.tearOrder) {
      const tw = tornWedge(S, i, L)
      const mid = tw.start + tw.sweep / 2
      const p = add(tw.c, mul([Math.cos(mid), Math.sin(mid)], tw.r * 0.64))
      out.push(
        <div key={`tw${i}`} className={styles.label}
          style={{ ...place(p), color: CHALK, fontSize: Math.max(12, 15 * tw.e), opacity: tw.e * vis("fan") }}>
          <Tex tex={`${whole[i]}^\\circ`} />
        </div>,
      )
    }
  }

  return <>{out}</>
}

/** The single line near the bottom: an equation to fill, target chips, or a sentence of maths. */
function BottomLine({ S, L }: { S: Scene; L: Layout }) {
  const lv = S.vis.line.v
  if (lv < 0.01) return null
  const top = L.lineY - L.lineSize * 0.85
  const style: React.CSSProperties = { top, height: L.lineSize * 1.7, opacity: lv, ["--line-size" as string]: `${L.lineSize}px` }

  if (S.input) {
    const inp = S.input
    const cls = [styles.box, inp.state === "wrong" ? styles.boxWrong : "", inp.state === "right" ? styles.boxRight : ""].join(" ")
    return (
      <>
        <div className={styles.line} style={style}>
          {inp.parts.map((p, k) =>
            typeof p === "string"
              ? <Tex key={k} tex={p} />
              : (
                <span key={`${k}-${inp.wrongAt}`} className={cls}>
                  {inp.value
                    ? <Tex tex={`\\textcolor{${inp.state === "right" ? GREEN : "#f0eeea"}}{${inp.value}^\\circ}`} />
                    : <span className={styles.boxCaret} />}
                </span>
              ),
          )}
        </div>
        {S.vis.hint.v > 0.01 && inp.hints.length > 0 && (
          <div className={styles.line} style={{ top: L.hintY - 16, height: 32, opacity: S.vis.hint.v, ["--line-size" as string]: `${Math.round(L.lineSize * 0.72)}px` }}>
            <Tex tex={inp.hints[Math.min(inp.hints.length - 1, Math.max(0, inp.tries - 2))]} />
          </div>
        )}
      </>
    )
  }

  if (S.targets) {
    return (
      <div className={styles.line} style={{ ...style, gap: "0.5em" }}>
        {S.targets.map((t, k) => (
          <span key={k} className={`${styles.chip} ${S.chipLit[k] ? styles.chipLit : ""}`}>
            <Tex tex={`${t}^\\circ`} />
          </span>
        ))}
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

function mix(a: string, b: string, t: number) {
  const x = hexRgb(a), y = hexRgb(b)
  return rgb([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t])
}

