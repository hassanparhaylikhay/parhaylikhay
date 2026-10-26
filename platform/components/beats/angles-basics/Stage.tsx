"use client"

import styles from "../beats.module.css"
import { Tex, Phrase } from "../Tex"
import { type Vec, add, sub, mul, unit, lerpV, clamp, ease, sectorPath, arcPath, RAD } from "../geometry"
import { type Line, quadrants, quadSides } from "./lines"
import {
  type Scene, type Layout, type AngleInfo, CHALK, GREEN, YELLOW, PINK, GREY, BLUE,
  angleList, angleColour, turnGeom, figGeom, namedGeom, parallelGeom, lineHandle, sumSlots,
  clipLine, intersect, dirOf, lineGap, rightDir,
} from "./scene"

/**
 * Draws the board. Pure: everything comes from the scene. Lines and arcs
 * are SVG; every number and letter is KaTeX laid over the SVG at the same
 * pixel coordinates.
 */
export default function Stage({ S, L }: { S: Scene; L: Layout }) {
  if (!S.w || !S.h) return null
  const vis = (k: keyof Scene["vis"]) => S.vis[k].v
  const list = angleList(S, L)
  const shown = list.filter(a => S.show === "all" || S.show.has(a.id))
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
          <BoardLayer S={S} L={L} />
        </g>
        <Arcs S={S} list={list} shown={shown} vis={vis} />
        <Extras S={S} L={L} list={list} vis={vis} />
        <Handles S={S} L={L} vis={vis} />
        <DrawLayer S={S} L={L} />
      </svg>
      <Labels S={S} L={L} list={list} shown={shown} vis={vis} />
      <BottomLine S={S} L={L} />
    </>
  )
}

type VisFn = (k: keyof Scene["vis"]) => number
const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const seg = (a: Vec, b: Vec, key: string, extra: React.SVGProps<SVGLineElement> = {}) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" {...extra} />
)

// ── what the board is made of: arms, lines, rays ─────────────────────────

function BoardLayer({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  const stroke = S.flashGood > 0 ? GREEN : CHALK
  const sop = S.flashGood > 0 ? 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5) : 1

  if (S.board === "turn") {
    const { O, arm } = turnGeom(S, L)
    const tip = add(O, mul(dirOf(-S.thetaD * RAD), arm))
    out.push(seg(O, add(O, [arm, 0]), "base"))
    out.push(seg(O, tip, "arm", { stroke, strokeOpacity: sop }))
    out.push(<circle key="O" cx={O[0]} cy={O[1]} r={4} fill={CHALK} />)
  } else if (S.board === "figs") {
    figGeom(S, L).forEach((f, k) => {
      const a = -[50, 125, 250][k] * RAD
      out.push(seg(f.c, add(f.c, [f.arm, 0]), `fb${k}`))
      out.push(seg(f.c, add(f.c, mul(dirOf(a), f.arm)), `fa${k}`))
      out.push(<circle key={`fo${k}`} cx={f.c[0]} cy={f.c[1]} r={3.5} fill={CHALK} />)
    })
  } else if (S.board === "named") {
    const g = namedGeom(S, L)
    for (const k of ["P", "R", "S"] as const) out.push(seg(g.Q, g.pts[k], `n${k}`))
    out.push(<circle key="Q" cx={g.Q[0]} cy={g.Q[1]} r={4} fill={CHALK} />)
  } else {
    // only the line or ray the student drew or moved lights up: a right
    // answer typed or tapped elsewhere must not light an unrelated line
    const lit = (kind: "line" | "ray", i: number) => S.flashGood > 0 && S.touched?.kind === kind && S.touched.i === i
    S.linesD.forEach((l, i) => {
      const s = clipLine(l, L.board)
      if (s) out.push(seg(s[0], s[1], `l${i}`, lit("line", i) ? { stroke, strokeOpacity: sop } : {}))
    })
    S.raysD.forEach((r, i) => {
      out.push(seg(r.from, add(r.from, mul(dirOf(r.a), r.len)), `r${i}`, lit("ray", i) ? { stroke, strokeOpacity: sop } : {}))
    })
    if (S.raysD.length) out.push(<circle key="foot" cx={S.raysD[0].from[0]} cy={S.raysD[0].from[1]} r={4} fill={CHALK} />)
  }
  return <>{out}</>
}

// ── the angles ───────────────────────────────────────────────────────────

function RightMark({ a, size, color }: { a: AngleInfo; size: number; color: string }) {
  const u = dirOf(a.start), v = dirOf(a.start + a.sweep)
  const p1 = add(a.c, mul(u, size)), p2 = add(add(a.c, mul(u, size)), mul(v, size)), p3 = add(a.c, mul(v, size))
  return <path d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={color} strokeWidth={2.2} strokeLinejoin="round" />
}

function Arcs({ S, list, shown, vis }: { S: Scene; list: AngleInfo[]; shown: AngleInfo[]; vis: VisFn }) {
  const av = vis("arcs")
  if (av < 0.01) return null
  return (
    <g opacity={av}>
      {shown.map(a => {
        const col = angleColour(S, a, list)
        const r = a.r * ease(av)
        const square = a.value === 90 && Math.abs(Math.abs(a.sweep) - Math.PI / 2) < 0.02
        const full = Math.abs(a.sweep) >= 2 * Math.PI - 0.003
        const pulsing = S.pulse.has(a.id) || S.sel === a.id
        return (
          <g key={a.id} style={{ transition: "opacity 300ms" }}>
            {square ? (
              <RightMark a={a} size={Math.min(r * 0.62, 20)} color={col} />
            ) : full ? (
              <circle cx={a.c[0]} cy={a.c[1]} r={r} fill={col} fillOpacity={0.17} stroke={col} strokeWidth={2.2} />
            ) : (
              <>
                <path d={sectorPath(a.c, a.start, a.sweep, r, 48)} style={{ fill: col, fillOpacity: 0.17, transition: "fill 400ms" }} />
                <path d={arcPath(a.c, a.start, a.sweep, r, 48)} fill="none" style={{ stroke: col, transition: "stroke 400ms" }} strokeWidth={2.2} strokeLinecap="round" />
              </>
            )}
            {pulsing && (
              <path d={sectorPath(a.c, a.start, a.sweep, r + 3, 48)} fill={col} fillOpacity={0.25} stroke={col} strokeWidth={3} filter="url(#pl-soft)">
                <animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" />
              </path>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ── the extra pictures: half turn, full turn, parallel marks, F Z C, slide ──

/** The F, Z or C a pair of angles makes on parallel lines. */
function pairPaths(S: Scene, shape: NonNullable<Scene["shape"]>): Vec[][] {
  const on = shape.on ?? [0, 1, 2]
  const g = parallelGeom(on.map(i => S.linesD[i]).filter(Boolean))
  if (!g) return []
  const kind = shape.kind
  const [q1, q2] = shape.q
  const len = Math.min(120, Math.hypot(g.X1[0] - g.X2[0], g.X1[1] - g.X2[1]) * 0.9)
  const r1 = dirOf(g.r1), r2 = dirOf(g.r2), u = dirOf(g.u)
  const side = (r: Vec, q: number) => mul(r, quadSides(q).line * len)
  if (kind === "F") {
    const t = quadSides(q1).trans
    const spine = t > 0 ? [g.X2, add(g.X1, mul(u, len * 0.75))] : [g.X1, add(g.X2, mul(u, -len * 0.75))]
    return [spine as Vec[], [g.X1, add(g.X1, side(r1, q1))], [g.X2, add(g.X2, side(r2, q2))]]
  }
  return [[add(g.X1, side(r1, q1)), g.X1, g.X2, add(g.X2, side(r2, q2))]]
}

function Extras({ S, L, list, vis }: { S: Scene; L: Layout; list: AngleInfo[]; vis: VisFn }) {
  const out: React.ReactNode[] = []

  // half a turn: the angles that share a straight line, together
  const hv = vis("half")
  if (hv > 0.01 && S.halfIds) {
    const parts = S.halfIds.map(id => list.find(a => a.id === id)).filter(Boolean) as AngleInfo[]
    if (parts.length) {
      const c = parts[0].c
      const start = parts[0].start
      const sweep = parts.reduce((s, a) => s + a.sweep, 0)
      const r = Math.max(...parts.map(a => a.r)) + 7
      out.push(
        <path key="half" d={arcPath(c, start, sweep, r, 64)} fill="none" stroke={GREEN} strokeWidth={2.6} strokeLinecap="round" opacity={hv}>
          <animate attributeName="stroke-opacity" values="0.35;1;0.35" dur="1.4s" repeatCount="indefinite" />
        </path>,
      )
    }
  }

  // a full turn round a point
  const fv = vis("full")
  if (fv > 0.01 && S.fullAt && S.raysD.length) {
    const c = S.raysD[0].from
    out.push(
      <circle key="full" cx={c[0]} cy={c[1]} r={L.arcR + 7} fill="none" stroke={GREEN} strokeWidth={2.6} opacity={fv}>
        <animate attributeName="stroke-opacity" values="0.35;1;0.35" dur="1.4s" repeatCount="indefinite" />
      </circle>,
    )
  }

  // parallel marks: the same arrow on both lines
  const pv = vis("arrows")
  if (pv > 0.01 && (S.board === "parallel" || S.board === "exam") && S.linesD.length >= 2) {
    const marked = S.board === "exam" ? [0, 1, 2] : [0, 1]
    marked.forEach(i => {
      const l = S.linesD[i]
      if (!l) return
      const d = dirOf(rightDir(l.a))
      const n: Vec = [-d[1], d[0]]
      // near the left end of the line, well away from any crossing
      const segm = clipLine(l, L.board)
      if (!segm) return
      const [e0, e1] = segm[0][0] <= segm[1][0] ? segm : [segm[1], segm[0]]
      const c = lerpV(e0, e1, S.board === "exam" ? 0.08 : 0.1)
      const tip = add(c, mul(d, 8)), a = add(add(c, mul(d, -4)), mul(n, 7)), b = add(add(c, mul(d, -4)), mul(n, -7))
      out.push(<path key={`pm${i}`} d={`M ${a[0]} ${a[1]} L ${tip[0]} ${tip[1]} L ${b[0]} ${b[1]}`} fill="none" stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={pv} />)
    })
  }

  // where two lines that are not parallel would meet
  const meetLine: Line | null = S.temp?.line ?? (S.meet && S.lines.length >= 2 && lineGap(S.lines[0].a, S.lines[1].a) > 0.002 ? S.linesD[1] : null)
  if (meetLine && S.linesD[0]) {
    if (S.temp) {
      const s = clipLine(S.temp.line, L.board)
      if (s) out.push(seg(s[0], s[1], "temp", { stroke: PINK, strokeDasharray: "8 6" }))
    }
    const X = intersect(S.linesD[0], meetLine)
    if (X) {
      const inside = X[0] > L.board.x0 && X[0] < L.board.x1 && X[1] > L.board.y0 && X[1] < L.board.y1
      if (inside) {
        out.push(
          <g key="meet">
            <circle cx={X[0]} cy={X[1]} r={6} fill={PINK} />
            <circle cx={X[0]} cy={X[1]} r={14} fill="none" stroke={PINK} strokeWidth={1.6}>
              <animate attributeName="r" values="10;24;10" dur="1.6s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1.6s" repeatCount="indefinite" />
            </circle>
          </g>,
        )
      } else {
        // an arrow at the edge, pointing at where they meet
        const c = L.centre
        const d = unit(sub(X, c))
        const hw = (L.board.x1 - L.board.x0) / 2 - 22, hh = (L.board.y1 - L.board.y0) / 2 - 22
        const t = Math.min(Math.abs(d[0]) > 1e-6 ? hw / Math.abs(d[0]) : Infinity, Math.abs(d[1]) > 1e-6 ? hh / Math.abs(d[1]) : Infinity)
        const edge = add(c, mul(d, t))
        const tip = add(edge, mul(d, 12)), n: Vec = [-d[1], d[0]]
        const a = add(edge, mul(n, 8)), b = add(edge, mul(n, -8))
        out.push(<path key="meet-far" d={`M ${a[0]} ${a[1]} L ${tip[0]} ${tip[1]} L ${b[0]} ${b[1]} Z`} fill={PINK} opacity={0.9} />)
      }
    }
  }

  // F, Z or C over the pair being looked at
  const sv = vis("shape")
  if (sv > 0.01 && S.shape) {
    pairPaths(S, S.shape).forEach((pts, k) => {
      const d = pts.map((p, j) => `${j ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
      out.push(
        <path key={`sh${k}`} d={d} fill="none" stroke={YELLOW} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.75 * sv}>
          <animate attributeName="stroke-opacity" values="0.55;1;0.55" dur="1.6s" repeatCount="indefinite" />
        </path>,
      )
    })
  }

  // one crossing's angles slid down onto the other: they are copies
  const g = parallelGeom(S.linesD)
  if (g && (S.slide !== null || vis("ghost") > 0.01)) {
    let at = g.X2, op = vis("ghost")
    if (S.slide !== null) {
      const t = ((S.time - S.slide) % 4.2) / 4.2
      const move = ease(clamp((t - 0.12) / 0.45, 0, 1))
      at = lerpV(g.X1, g.X2, move)
      op = t < 0.06 ? t / 0.06 : t > 0.9 ? (1 - t) / 0.1 : 1
    }
    const r = L.arcR + 4
    quadrants(at, g.r1, g.u).forEach((w, q) => {
      const a = list.find(x => x.id === `A${q}`)
      const col = a ? angleColour(S, a, list) : CHALK
      out.push(
        <path key={`gh${q}`} d={sectorPath(at, w.start, w.sweep, r, 40)} fill={col} fillOpacity={0.12 * op} stroke={col} strokeWidth={1.8} strokeDasharray="5 4" opacity={op} />,
      )
    })
  }
  return <>{out}</>
}

// ── what can be touched ──────────────────────────────────────────────────

function Glow({ p, held, k }: { p: Vec; held: boolean; k: string }) {
  return (
    <g key={k}>
      {!held && (
        <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
          <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={p[0]} cy={p[1]} r={held ? 10 : 7} fill={YELLOW} filter="url(#pl-soft)" />
    </g>
  )
}

function Handles({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const out: React.ReactNode[] = []
  if (S.mode === "turn" && S.board === "turn" && !S.locked) {
    const { O, arm } = turnGeom(S, L)
    out.push(<Glow key="t" k="t" p={add(O, mul(dirOf(-S.thetaD * RAD), arm))} held={S.drag?.kind === "turn"} />)
  }
  if (S.mode === "rays") {
    S.raysD.forEach((r, i) => out.push(<Glow key={`r${i}`} k={`r${i}`} p={add(r.from, mul(dirOf(r.a), r.len))} held={S.drag?.kind === "ray" && S.drag.i === i} />))
  }
  if (S.mode === "rotLine" && !S.locked) {
    const h = lineHandle(S, L, S.rotLine)
    if (h) out.push(<Glow key="h" k="h" p={h} held={S.drag?.kind === "line"} />)
  }
  void vis
  return <>{out}</>
}

// ── a stroke being drawn ─────────────────────────────────────────────────

function DrawLayer({ S, L }: { S: Scene; L: Layout }) {
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(seg(f.a, f.b, `f${i}`, { stroke: PINK, strokeOpacity: Math.max(0, f.life) * 0.7 })))
  if (S.stroke) {
    const a = Math.atan2(S.stroke.to[1] - S.stroke.from[1], S.stroke.to[0] - S.stroke.from[0])
    const near = S.drawGoal === "parallel" && S.lines[0] && lineGap(a, S.lines[0].a) <= 7 * RAD
    out.push(seg(S.stroke.from, S.stroke.to, "s", { stroke: near ? GREEN : CHALK }))
  }
  // before the first stroke: a faint finger drawing a line
  if (S.mode === "draw" && !S.drewOnce && !S.stroke) {
    const t = S.time - S.beatStart - 1.2
    if (t > 0) {
      const cyc = t % 3.6
      const grow = ease(cyc / 1.3)
      const fade = cyc < 1.6 ? 1 : 1 - clamp((cyc - 1.6) / 0.7, 0, 1)
      const [a, b] = ghostStroke(S, L)
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

/** The stroke the hint finger draws, for what the beat asks. */
function ghostStroke(S: Scene, L: Layout): [Vec, Vec] {
  const c = L.centre
  const span = Math.min(110, (L.board.x1 - L.board.x0) * 0.3)
  const l0 = S.lines[0]
  if (l0 && S.drawGoal === "ray") {
    const foot = projectOnLine(c, l0)
    return [foot, add(foot, mul(dirOf(rightDir(l0.a) - 62 * RAD), span * 1.1))]
  }
  if (l0 && S.drawGoal === "parallel") {
    const d = dirOf(l0.a)
    let n: Vec = [-d[1], d[0]]
    const foot = projectOnLine(c, l0)
    const off = Math.min(110, (L.board.y1 - L.board.y0) * 0.3)
    if (foot[1] + n[1] * off < L.board.y0 + 20 || foot[1] + n[1] * off > L.board.y1 - 20) n = mul(n, -1)
    const m = add(foot, mul(n, off))
    return [add(m, mul(d, -span)), add(m, mul(d, span))]
  }
  if (l0 && S.lines[1] && S.drawGoal === "trans") {
    const f0 = projectOnLine(c, l0), f1 = projectOnLine(c, S.lines[1])
    const u = unit(sub(f0, f1)), d = dirOf(rightDir(l0.a))
    const lean = unit(add(u, mul(d, 0.45)))
    const m = lerpV(f0, f1, 0.5), half = Math.hypot(f0[0] - f1[0], f0[1] - f1[1]) / 2 + 40
    return [add(m, mul(lean, -half)), add(m, mul(lean, half))]
  }
  if (l0 && S.drawGoal === "twoCross") {
    const foot = projectOnLine(c, l0)
    const d = dirOf(l0.a - 64 * RAD)
    return [add(foot, mul(d, -span)), add(foot, mul(d, span))]
  }
  return [[c[0] - span, c[1] + 40], [c[0] + span, c[1] - 10]]
}

function projectOnLine(p: Vec, l: Line): Vec {
  const d = dirOf(l.a)
  const t = (p[0] - l.p[0]) * d[0] + (p[1] - l.p[1]) * d[1]
  return add(l.p, mul(d, t))
}

/** A spot for a total, out past the labels of the widest angle it covers. */
function beyondLabels(parts: AngleInfo[], L: Layout): Vec {
  if (!parts.length) return L.centre
  const a = parts.reduce((p, q) => (Math.abs(q.sweep) > Math.abs(p.sweep) ? q : p))
  const bis = a.start + a.sweep / 2
  const d = Math.hypot(a.label[0] - a.c[0], a.label[1] - a.c[1]) + L.labelSize * 2.4
  return add(a.c, mul(dirOf(bis), d))
}

// ── KaTeX over the board ─────────────────────────────────────────────────

function Labels({ S, L, list, shown, vis }: { S: Scene; L: Layout; list: AngleInfo[]; shown: AngleInfo[]; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const vv = vis("values")
  if (vv > 0.01) {
    for (const a of shown) {
      const ov = S.label[a.id]
      if (ov === "") continue
      const col = angleColour(S, a, list)
      out.push(
        <div key={`v${a.id}`} className={`${styles.label} ${S.pulse.has(a.id) && ov === "?" ? styles.pulse : ""}`}
          style={{ ...place(a.label), color: col, fontSize: L.labelSize, opacity: vv, transition: "color 400ms" }}>
          <Tex tex={ov ?? `${a.value}^\\circ`} />
        </div>,
      )
    }
  }

  // letters on points
  const lv = vis("letters")
  if (lv > 0.01) {
    const letter = (p: Vec, t: string, k: string, pulse = false) => out.push(
      <div key={k} className={`${styles.label} ${pulse ? styles.pulse : ""}`} style={{ ...place(p), color: CHALK, fontSize: L.labelSize + 2, opacity: lv }}>
        <Tex tex={t} />
      </div>,
    )
    if (S.board === "turn") {
      const { O, arm } = turnGeom(S, L)
      const tip = add(O, mul(dirOf(-S.thetaD * RAD), arm + 22))
      letter(tip, "A", "A")
      letter(add(O, [-6, 24]), "B", "B", S.pulse.has("B"))
      letter(add(O, [arm + 22, 0]), "C", "C")
    } else if (S.board === "named") {
      const g = namedGeom(S, L)
      letter(add(g.Q, [-8, 24]), "Q", "Q")
      for (const k of ["P", "R", "S"] as const) letter(add(g.pts[k], mul(dirOf(g.a[k]), 22)), k, k)
    }
  }

  // 180 on a half turn, 360 on a full turn
  if (vis("half") > 0.01 && S.halfIds) {
    const parts = S.halfIds.map(id => list.find(a => a.id === id)).filter(Boolean) as AngleInfo[]
    if (parts.length) {
      out.push(
        <div key="h180" className={`${styles.label} ${styles.pulse}`} style={{ ...place(beyondLabels(parts, L)), color: GREEN, fontSize: L.labelSize, opacity: vis("half") }}>
          <Tex tex={"180^\\circ"} />
        </div>,
      )
    }
  }
  if (vis("full") > 0.01 && S.fullAt && S.raysD.length) {
    const parts = list.filter(a => a.id.startsWith("P"))
    out.push(
      <div key="f360" className={`${styles.label} ${styles.pulse}`} style={{ ...place(beyondLabels(parts, L)), color: GREEN, fontSize: L.labelSize, opacity: vis("full") }}>
        <Tex tex={"360^\\circ"} />
      </div>,
    )
  }

  // the sum line: each term flies down from its angle
  const sv = vis("sum")
  if (sv > 0.01 && S.sum) {
    const slots = sumSlots(S, L)
    const since = S.time - S.sumShownAt
    const opsOp = clamp((since - 0.75) / 0.45, 0, 1) * clamp(sv * 1.4, 0, 1)
    S.sum.ids.forEach((id, k) => {
      const a = list.find(x => x.id === id)
      if (!a) return
      const p = S.termPos[id] ?? a.label
      out.push(
        <div key={`s${id}`} className={styles.label} style={{ ...place(p), color: angleColour(S, a, list), fontSize: slots.size, opacity: clamp(sv * 2, 0, 1) }}>
          <Tex tex={`${a.value}^\\circ`} />
        </div>,
      )
      out.push(
        <div key={`o${k}`} className={styles.label} style={{ ...place([slots.ops[k], L.lineY]), color: GREY, fontSize: slots.size, opacity: opsOp }}>
          <Tex tex={k === S.sum!.ids.length - 1 ? "=" : "+"} />
        </div>,
      )
    })
    out.push(
      <div key="tot" className={styles.label} style={{ ...place([slots.total, L.lineY]), color: GREEN, fontSize: slots.size, opacity: opsOp }}>
        <Tex tex={`${S.sum.total}^\\circ`} />
      </div>,
    )
  }
  void BLUE
  return <>{out}</>
}

// ── the line near the bottom ─────────────────────────────────────────────

function AnswerBox({ S }: { S: Scene }) {
  const inp = S.input!
  const cls = [styles.box, inp.state === "wrong" ? styles.boxWrong : "", inp.state === "right" ? styles.boxRight : "", inp.state === "guessed" ? styles.boxGuessed : ""].join(" ")
  return (
    <span className={cls}>
      {inp.value
        ? <Tex tex={`\\textcolor{${inp.state === "right" ? GREEN : "#f0eeea"}}{${inp.value}${inp.deg ? "^\\circ" : ""}}`} />
        : <span className={styles.boxCaret} />}
    </span>
  )
}

function BottomLine({ S, L }: { S: Scene; L: Layout }) {
  const lv = S.vis.line.v
  const inp = S.input
  const hint = inp && inp.hints.length && inp.tries > 0 ? inp.hints[Math.min(inp.hints.length - 1, inp.tries - 1)] : null
  const style: React.CSSProperties = { top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, opacity: lv, ["--line-size" as string]: `${L.lineSize}px` }
  if (S.walkTex !== null) {
    if (!S.walkTex) return null
    return <div key={S.walkTex} className={`${styles.line} ${styles.walkLine}`} style={style}><Tex tex={S.walkTex} /></div>
  }
  return (
    <>
      {lv > 0.01 && inp && (
        <div className={styles.line} style={style}>
          {inp.parts.map((p, k) => (typeof p === "string" ? <Tex key={k} tex={p} /> : <AnswerBox key={`${k}-${inp.wrongAt}`} S={S} />))}
        </div>
      )}
      {lv > 0.01 && !inp && S.lineTex && (
        <div className={styles.line} style={style}><Tex tex={S.lineTex} /></div>
      )}
      {lv > 0.01 && !inp && !S.lineTex && S.lineWords && (
        <div className={styles.line} style={{ ...style, fontSize: L.lineSize * 0.85 }}><span><Phrase text={S.lineWords} /></span></div>
      )}
      {hint && S.vis.hint.v > 0.01 && (
        <div className={styles.line} style={{ top: L.hintY - 16, height: 32, opacity: S.vis.hint.v, color: "#c8c6be", ["--line-size" as string]: `${Math.round(L.lineSize * 0.72)}px` }}>
          <Tex tex={hint} />
        </div>
      )}
    </>
  )
}
