"use client"

import styles from "../beats.module.css"
import { Tex } from "../Tex"
import { type Vec, add, sub, mul, dot, lerpV, clamp, ease, sectorPath, arcPath, turn } from "../geometry"
import {
  type Scene, type Layout, CHALK, GREEN, YELLOW, BLUE, ORANGE, PINK, NEUTRAL,
  toScreen, toWorld, posOf, wOf, squareCorners, proofAt, proofT, proofAB, angleAt,
} from "./scene"

/**
 * Draws the board. Pure: everything comes from the scene. Shapes are SVG;
 * every number and letter is KaTeX laid over the SVG at the same pixel
 * coordinates.
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
        </defs>
        <Grid S={S} L={L} op={vis("grid")} />
        <g opacity={vis("board")}>
          <Fills S={S} />
          <Squares S={S} />
          <ProofBoard S={S} />
          <Segs S={S} />
          <Angles S={S} op={vis("arcs")} />
          <Points S={S} />
        </g>
        <DrawLayer S={S} />
      </svg>
      <Labels S={S} L={L} vis={vis} />
      <SumLine S={S} L={L} />
      <BottomLine S={S} L={L} />
    </>
  )
}

type VisFn = (k: keyof Scene["vis"]) => number
const place = (p: Vec): React.CSSProperties => ({ transform: `translate(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px) translate(-50%, -50%)` })
const line = (a: Vec, b: Vec, key: string, extra: React.SVGProps<SVGLineElement> = {}) => (
  <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CHALK} strokeWidth={2.4} strokeLinecap="round" {...extra} />
)
const flashOp = (S: Scene) => 0.5 + 0.5 * Math.min(1, S.flashGood * 1.5)
const poly = (P: Vec[]) => P.map(p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")

// ── the grid ─────────────────────────────────────────────────────────────

/** Whole-unit grid lines across the board, faint; inside a square they show the counting squares. */
function gridLines(S: Scene, x0: number, x1: number, y0: number, y1: number, key: string, stroke: string, width: number) {
  const out: React.ReactNode[] = []
  for (let x = Math.ceil(x0); x <= x1; x++) {
    const a = toScreen(S, [x, y0]), b = toScreen(S, [x, y1])
    out.push(<line key={`${key}x${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={width} />)
  }
  for (let y = Math.ceil(y0); y <= y1; y++) {
    const a = toScreen(S, [x0, y]), b = toScreen(S, [x1, y])
    out.push(<line key={`${key}y${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={stroke} strokeWidth={width} />)
  }
  return out
}

function Grid({ S, L, op }: { S: Scene; L: Layout; op: number }) {
  if (op < 0.01) return null
  const p = toWorld(S, [L.board.x0, L.board.y1]), q = toWorld(S, [L.board.x1, L.board.y0])
  return <g opacity={op}>{gridLines(S, p[0], q[0], p[1], q[1], "g", "#1a3350", 1)}</g>
}

// ── shapes ───────────────────────────────────────────────────────────────

function Fills({ S }: { S: Scene }) {
  return (
    <g>
      {S.fills.map((f, k) => <polygon key={k} points={poly(f.pts.map(n => posOf(S, n)))} fill={f.color} fillOpacity={0.14} stroke="none" />)}
    </g>
  )
}

function Squares({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const s of S.squares) {
    if (s.grow.v < 0.01) continue
    const W = squareCorners(S, s)
    const P = W.map(p => toScreen(S, p))
    const xs = W.map(p => p[0]), ys = W.map(p => p[1])
    const lit = (S.flashGood > 0 && S.touched?.kind === "sq" && S.touched.id === s.id)
    out.push(
      <g key={s.id}>
        <clipPath id={`sqclip-${s.id}`}><polygon points={poly(P)} /></clipPath>
        <polygon points={poly(P)} fill={s.colour} fillOpacity={0.12} stroke="none" />
        <g clipPath={`url(#sqclip-${s.id})`} opacity={0.55}>
          {gridLines(S, Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys), s.id, s.colour, 1)}
        </g>
        <polygon points={poly(P)} fill="none" stroke={lit ? GREEN : s.colour} strokeWidth={2.4} strokeLinejoin="round" strokeOpacity={lit ? flashOp(S) : 0.95} />
        {S.pulseSquares.has(s.id) && (
          <polygon points={poly(P)} fill={s.colour} fillOpacity={0.18} stroke={s.colour} strokeWidth={4} filter="url(#pl-soft)">
            <animate attributeName="opacity" values="0.15;0.9;0.15" dur="1.6s" repeatCount="indefinite" />
          </polygon>
        )}
      </g>,
    )
  }
  return <>{out}</>
}

/** The big square with its four triangles, and the gaps they leave. */
function ProofBoard({ S }: { S: Scene }) {
  const pr = S.proof
  if (!pr) return null
  const [a, b] = proofAB(S)
  const s = a + b
  const out: React.ReactNode[] = []
  const draw = (origin: Vec, tOf: (k: number) => number, key: string) => {
    const W = (p: Vec) => toScreen(S, add(origin, p))
    const all0 = [0, 1, 2, 3].every(k => tOf(k) === 0)
    const all1 = [0, 1, 2, 3].every(k => tOf(k) === 1)
    // the gaps: the tilted square first, the two small squares once everything has moved
    if (all0) out.push(<polygon key={`${key}gc`} points={poly([[a, 0], [s, a], [b, s], [0, b]].map(p => W(p as Vec)))} fill={GREEN} fillOpacity={0.16} stroke={GREEN} strokeWidth={2} />)
    if (all1) {
      out.push(<polygon key={`${key}ga`} points={poly([[0, 0], [a, 0], [a, a], [0, a]].map(p => W(p as Vec)))} fill={BLUE} fillOpacity={0.16} stroke={BLUE} strokeWidth={2} />)
      out.push(<polygon key={`${key}gb`} points={poly([[a, a], [s, a], [s, s], [a, s]].map(p => W(p as Vec)))} fill={ORANGE} fillOpacity={0.16} stroke={ORANGE} strokeWidth={2} />)
    }
    for (let k = 0; k < 4; k++) {
      const t = tOf(k)
      const T = proofAt(a, b, k, t).map(W)
      const waiting = S.mode === "tapProof" && k !== 1 && t === 0
      out.push(
        <g key={`${key}t${k}`}>
          <polygon points={poly(T)} fill={NEUTRAL} fillOpacity={0.2} stroke={CHALK} strokeWidth={2} strokeLinejoin="round" />
          {waiting && (
            <polygon points={poly(T)} fill={YELLOW} fillOpacity={0.14} stroke={YELLOW} strokeWidth={2.4} strokeLinejoin="round">
              <animate attributeName="opacity" values="0.2;0.9;0.2" dur="1.8s" repeatCount="indefinite" />
            </polygon>
          )}
        </g>,
      )
    }
    out.push(<polygon key={`${key}big`} points={poly([[0, 0], [s, 0], [s, s], [0, s]].map(p => W(p as Vec)))} fill="none" stroke={CHALK} strokeWidth={2.6} strokeLinejoin="round" />)
  }
  draw(pr.at, k => proofT(S, k), "p")
  if (S.proofTwin) draw(add(pr.at, [s + Math.max(1.2, s * 0.25), 0]), () => 1, "q")
  return <>{out}</>
}

function Segs({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const s of S.segs) {
    const a = posOf(S, s.a), b = posOf(S, s.b)
    const lit = S.flashGood > 0 && S.touched?.kind === "seg" && S.touched.id === s.id
    out.push(line(a, b, s.id, { stroke: lit ? GREEN : s.colour ?? CHALK, strokeOpacity: lit ? flashOp(S) : 1, strokeWidth: s.colour ? 3 : 2.4, strokeDasharray: s.dash ? "6 6" : undefined }))
    if (S.pulseSegs.has(s.id)) {
      out.push(
        <line key={`p${s.id}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={YELLOW} strokeWidth={7} strokeLinecap="round" filter="url(#pl-soft)">
          <animate attributeName="stroke-opacity" values="0.1;0.8;0.1" dur="1.6s" repeatCount="indefinite" />
        </line>,
      )
    }
  }
  return <>{out}</>
}

/** Arcs, and right angles as small squares. */
function Angles({ S, op }: { S: Scene; op: number }) {
  if (op < 0.01) return null
  const out: React.ReactNode[] = []
  for (const g of S.angles) {
    const c = posOf(S, g.at), p = posOf(S, g.from), q = posOf(S, g.to)
    const a1 = Math.atan2(p[1] - c[1], p[0] - c[0]), a2 = Math.atan2(q[1] - c[1], q[0] - c[0])
    const sweep = turn(a1, a2)
    const lf = Math.hypot(p[0] - c[0], p[1] - c[1]), lt = Math.hypot(q[0] - c[0], q[1] - c[1])
    if (lf < 4 || lt < 4) continue
    const right = g.mark || Math.abs(angleAt(S, g.at, g.from, g.to) - 90) < 1e-6
    const pulsing = S.pulse.has(g.id)
    if (right) {
      const r = Math.min(15, lf * 0.3, lt * 0.3)
      const u = [Math.cos(a1), Math.sin(a1)] as Vec, v = [Math.cos(a1 + sweep), Math.sin(a1 + sweep)] as Vec
      const p1 = add(c, mul(u, r)), p2 = add(add(c, mul(u, r)), mul(v, r)), p3 = add(c, mul(v, r))
      out.push(<path key={g.id} d={`M ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} L ${p3[0]} ${p3[1]}`} fill="none" stroke={g.colour} strokeWidth={2.2} strokeLinejoin="round" />)
      if (pulsing) out.push(<polygon key={`${g.id}p`} points={poly([c, p1, p2, p3])} fill={g.colour} fillOpacity={0.3} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></polygon>)
      continue
    }
    const r = Math.min(30, lf * 0.4, lt * 0.4)
    out.push(
      <g key={g.id}>
        <path d={sectorPath(c, a1, sweep, r, 40)} fill={g.colour} fillOpacity={0.18} />
        <path d={arcPath(c, a1, sweep, r, 40)} fill="none" stroke={g.colour} strokeWidth={2.2} strokeLinecap="round" />
        {pulsing && <path d={sectorPath(c, a1, sweep, r + 3, 40)} fill={g.colour} fillOpacity={0.25} filter="url(#pl-soft)"><animate attributeName="opacity" values="0.2;1;0.2" dur="1.4s" repeatCount="indefinite" /></path>}
      </g>,
    )
  }
  return <g opacity={op}>{out}</g>
}

function Points({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  for (const n of S.showPts) {
    const p = posOf(S, n)
    const live = S.mode === "slide" && S.movable.includes(n) && !S.locked
    const held = S.drag?.name === n
    const lit = S.flashGood > 0 && S.touched?.kind === "pt" && S.touched.name === n
    out.push(
      <g key={n}>
        {live && !held && (
          <circle cx={p[0]} cy={p[1]} r={12} fill="none" stroke={YELLOW} strokeWidth={1.5}>
            <animate attributeName="r" values="9;24;9" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.75;0;0.75" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        <circle cx={p[0]} cy={p[1]} r={held ? 10 : live ? 7 : 4} fill={lit ? GREEN : live ? YELLOW : CHALK} filter={live ? "url(#pl-soft)" : undefined} />
      </g>,
    )
  }
  return <>{out}</>
}

function DrawLayer({ S }: { S: Scene }) {
  const out: React.ReactNode[] = []
  S.fading.forEach((f, i) => out.push(line(f.a, f.b, `f${i}`, { stroke: PINK, strokeOpacity: Math.max(0, f.life) * 0.7 })))
  if (S.stroke) out.push(line(S.stroke.from, S.stroke.to, "s"))
  // the hint finger for a join: a dotted line from end to end
  const t = S.time - S.beatStart - 1.2
  if (S.mode === "join" && t > 0 && !S.drewOnce && !S.stroke && S.joinNeed.length) {
    const nx = S.joinNeed.find(([x, y]) => !S.segs.some(s => s.id === x + y)) ?? S.joinNeed[0]
    const a = posOf(S, nx[0]), b = posOf(S, nx[1])
    const cyc = t % 3.6
    const grow = ease(cyc / 1.3)
    const fade = cyc < 1.6 ? 1 : 1 - clamp((cyc - 1.6) / 0.7, 0, 1)
    const p = lerpV(a, b, grow)
    out.push(
      <g key="ghost" opacity={fade * 0.55}>
        <line x1={a[0]} y1={a[1]} x2={p[0]} y2={p[1]} stroke={YELLOW} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="1 7" />
        <circle cx={p[0]} cy={p[1]} r={13} fill={YELLOW} fillOpacity={0.16} stroke={YELLOW} strokeOpacity={0.6} strokeWidth={1.5} />
      </g>,
    )
  }
  return <>{out}</>
}

// ── KaTeX over the board ─────────────────────────────────────────────────

/** The middle of the figure, for putting letters and lengths on its outside. */
function figureMiddle(S: Scene): Vec {
  const ps = S.showPts.map(n => wOf(S, n))
  if (!ps.length) return [0, 0]
  return [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length]
}

function Labels({ S, L, vis }: { S: Scene; L: Layout; vis: VisFn }) {
  const out: React.ReactNode[] = []
  const mid = figureMiddle(S)
  const lv = vis("letters")
  if (lv > 0.01) {
    for (const n of S.showPts) {
      if (!S.letters.has(n)) continue
      const w = wOf(S, n)
      const from = S.letterAway[n] ?? mid
      const d = sub(w, from), l = Math.hypot(d[0], d[1])
      const off: Vec = l > 1e-6 ? [d[0] / l, -d[1] / l] : [0, -1]
      const p = add(posOf(S, n), mul(off, 20))
      out.push(<div key={`L${n}`} className={styles.label} style={{ ...place(p), color: CHALK, fontSize: L.labelSize + 1, opacity: lv }}><Tex tex={n} /></div>)
    }
  }
  // lengths along lines: outside the figure, or inside when a square stands on the line
  const ln = vis("lengths")
  if (ln > 0.01) {
    for (const s of S.segs) {
      const fn = S.segText[s.id]
      if (!fn) continue
      const t = fn(S)
      if (!t) continue
      const a = posOf(S, s.a), b = posOf(S, s.b)
      const d = sub(b, a), l = Math.hypot(d[0], d[1]) || 1
      let n: Vec = [-d[1] / l, d[0] / l]
      const m = lerpV(a, b, 0.5)
      const toMid = sub(toScreen(S, mid), m)
      const sq = S.squares.some(q => q.id === s.id && q.grow.v > 0.3)
      const out1 = dot(n, toMid) > 0 ? mul(n, -1) : n
      n = sq ? mul(out1, -1) : out1
      const p = add(m, mul(n, sq ? 16 : 20))
      out.push(<div key={`s${s.id}`} className={styles.label} style={{ ...place(p), color: S.segTextColour[s.id] ?? NEUTRAL, fontSize: L.labelSize, opacity: ln }}><Tex tex={t} /></div>)
    }
  }
  // areas in the middle of their squares
  const av = vis("areas")
  if (av > 0.01) {
    for (const s of S.squares) {
      if (s.grow.v < 0.6) continue
      const fly = flyT(S, s.id)
      if (fly !== null && fly > 0) continue
      const P = squareCorners(S, s).map(p => toScreen(S, p))
      const c: Vec = [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2]
      const t = S.areaText[s.id]?.(S) ?? String(Math.round((wOf(S, s.a, false)[0] - wOf(S, s.b, false)[0]) ** 2 + (wOf(S, s.a, false)[1] - wOf(S, s.b, false)[1]) ** 2))
      if (!t) continue
      out.push(<div key={`a${s.id}`} className={`${styles.label} ${S.pulseSquares.has(s.id) ? styles.pulse : ""}`} style={{ ...place(c), color: s.colour, fontSize: L.labelSize + 6, opacity: av * Math.min(1, (s.grow.v - 0.6) / 0.4) }}><Tex tex={t} /></div>)
    }
  }
  // angle values
  if (vis("arcs") > 0.01) {
    for (const g of S.angles) {
      if (g.mark) continue
      const c = posOf(S, g.at), p = posOf(S, g.from), q = posOf(S, g.to)
      const a1 = Math.atan2(p[1] - c[1], p[0] - c[0]), a2 = Math.atan2(q[1] - c[1], q[0] - c[0])
      const bis = a1 + turn(a1, a2) / 2
      const at = add(c, mul([Math.cos(bis), Math.sin(bis)], 46))
      out.push(<div key={`g${g.id}`} className={styles.label} style={{ ...place(at), color: g.colour, fontSize: L.labelSize }}><Tex tex={`${Math.round(g.value(S))}^\\circ`} /></div>)
    }
  }
  // the proof's labels: a and b along the big square, and the gaps
  if (S.proof) {
    const [a, b] = proofAB(S)
    const s = a + b
    const tag = (origin: Vec, allMoved: boolean, none: boolean, key: string) => {
      const W = (p: Vec) => toScreen(S, add(origin, p))
      const put = (p: Vec, tex: string, col: string, k: string, size = L.labelSize) =>
        out.push(<div key={`${key}${k}`} className={styles.label} style={{ ...place(p), color: col, fontSize: size }}><Tex tex={tex} /></div>)
      if (vis("lengths") > 0.5) {
        put(add(W([a / 2, 0]), [0, 16]), "a", BLUE, "la")
        put(add(W([a + b / 2, 0]), [0, 16]), "b", ORANGE, "lb")
        put(add(W([0, b / 2]), [-14, 0]), "b", ORANGE, "lb2")
        put(add(W([0, b + a / 2]), [-14, 0]), "a", BLUE, "la2")
      }
      if (none) put(W([s / 2, s / 2]), "c^2", GREEN, "gc", L.labelSize + 8)
      if (allMoved) {
        put(W([a / 2, a / 2]), "a^2", BLUE, "ga", L.labelSize + 6)
        put(W([a + b / 2, a + b / 2]), "b^2", ORANGE, "gb", L.labelSize + 8)
      }
    }
    const ts = [0, 1, 2, 3].map(k => proofT(S, k))
    tag(S.proof.at, ts.every(t => t === 1), [0, 2, 3].every(k => ts[k] === 0), "p")
    if (S.proofTwin) tag(add(S.proof.at, [s + Math.max(1.2, s * 0.25), 0]), true, false, "q")
  }
  return <>{out}</>
}

// ── the sum of the squares, at the bottom ────────────────────────────────

const SLOT_IDS = ["CA", "CB", "AB"]

/** How far a square's area is on its way down to the sum (null: not flying). */
function flyT(S: Scene, id: string): number | null {
  if (S.sumFly === null) return null
  const k = SLOT_IDS.indexOf(id)
  if (k < 0) return null
  const delay = [0, 0.3, 1.2][k]
  return clamp((S.time - S.sumFly - delay) / 0.9, 0, 1)
}

function slots(S: Scene, L: Layout): { at: Vec[]; ops: Vec[] } {
  const fs = L.lineSize, cx = S.w / 2, y = L.lineY
  return { at: [[cx - 3 * fs, y], [cx - 0.2 * fs, y], [cx + 2.6 * fs, y]], ops: [[cx - 1.6 * fs, y], [cx + 1.2 * fs, y]] }
}

function SumLine({ S, L }: { S: Scene; L: Layout }) {
  const sv = S.vis.sum.v
  if (sv < 0.01 || !S.sumVals) return null
  const vals = S.sumVals(S)
  const { at, ops } = slots(S, L)
  const equal = vals[0] + vals[1] === vals[2]
  const cols = [BLUE, ORANGE, equal ? GREEN : PINK]
  const out: React.ReactNode[] = []
  const size = L.lineSize * 1.05
  const opIn = S.sumFly === null ? 1 : clamp((S.time - S.sumFly - 0.9) / 0.4, 0, 1)
  for (let k = 0; k < 3; k++) {
    const t = flyT(S, SLOT_IDS[k])
    let p = at[k]
    if (t !== null && t < 1) {
      const sq = S.squares.find(q => q.id === SLOT_IDS[k])
      if (!sq) continue
      const P = squareCorners(S, sq).map(q => toScreen(S, q))
      const c: Vec = [(P[0][0] + P[2][0]) / 2, (P[0][1] + P[2][1]) / 2]
      const e = t * t * (3 - 2 * t)
      p = lerpV(c, at[k], e)
    }
    out.push(<div key={`v${k}`} className={styles.label} style={{ ...place(p), color: cols[k], fontSize: size, opacity: sv }}><Tex tex={String(vals[k])} /></div>)
  }
  out.push(<div key="o1" className={styles.label} style={{ ...place(ops[0]), color: CHALK, fontSize: size, opacity: sv * opIn }}><Tex tex="+" /></div>)
  out.push(<div key="o2" className={styles.label} style={{ ...place(ops[1]), color: equal ? CHALK : PINK, fontSize: size, opacity: sv * opIn }}><Tex tex={equal ? "=" : "\\neq"} /></div>)
  return <>{out}</>
}

// ── the line near the bottom ─────────────────────────────────────────────

function AnswerBox({ S }: { S: Scene }) {
  const inp = S.input!
  const cls = [styles.box, inp.state === "wrong" ? styles.boxWrong : "", inp.state === "right" ? styles.boxRight : "", inp.state === "guessed" ? styles.boxGuessed : ""].join(" ")
  return (
    <span className={cls}>
      {inp.value
        ? <Tex tex={`\\textcolor{${inp.state === "right" ? GREEN : "#f0eeea"}}{${inp.value}}`} />
        : <span className={styles.boxCaret} />}
    </span>
  )
}

function BottomLine({ S, L }: { S: Scene; L: Layout }) {
  const lv = S.vis.line.v
  const inp = S.input
  const hint = inp && inp.hints.length && inp.tries > 0 ? inp.hints[Math.min(inp.hints.length - 1, inp.tries - 1)] : null
  const style: React.CSSProperties = { top: L.lineY - L.lineSize * 0.85, height: L.lineSize * 1.7, opacity: lv, ["--line-size" as string]: `${L.lineSize}px` }
  const tex = S.lineFn ? S.lineFn(S) : S.lineTex
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
      {lv > 0.01 && !inp && S.chips.length > 0 && (
        <div className={styles.line} style={{ ...style, gap: "0.6em" }}>
          {S.chips.map((c, k) => <span key={k} className={`${styles.chip} ${c.test(S) ? styles.chipLit : ""}`}><Tex tex={c.tex} /></span>)}
        </div>
      )}
      {lv > 0.01 && !inp && !S.chips.length && tex && <div className={styles.line} style={style}><Tex tex={tex} /></div>}
      {hint && S.vis.hint.v > 0.01 && (
        <div className={styles.line} style={{ top: L.hintY - 16, height: 32, opacity: S.vis.hint.v, color: "#c8c6be", ["--line-size" as string]: `${Math.round(L.lineSize * 0.72)}px` }}>
          <Tex tex={hint} />
        </div>
      )}
    </>
  )
}
