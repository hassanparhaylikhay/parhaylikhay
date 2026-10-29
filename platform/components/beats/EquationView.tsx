"use client"

import styles from "./beats.module.css"
import { texHtml } from "./Tex"
import { ATOM_CLASS, ensureEqStyle, eqPivot, type EqBoard, type Drawn } from "./equation"

const CHALK = "#e8e6e0"
const PINK = "#ff4670"
const GREEN = "#0fee89"

/**
 * Draws an equation board (equation.ts). Pure: every position comes from
 * the board, which the scene eases every frame. The whole line turns about
 * its equals sign when the board is tipped.
 */
export default function EquationView({ B, time, opacity = 1 }: { B: EqBoard; time: number; opacity?: number }) {
  ensureEqStyle()
  if (opacity < 0.01) return null
  const pivot = eqPivot(B)
  const tilted = Math.abs(B.tilt.v) > 0.4
  const out: React.ReactNode[] = []
  for (const [id, b] of Object.entries(B.bars)) {
    const th = Math.max(1.6, B.size * 0.055)
    out.push(<div key={`bar-${id}`} style={{ position: "absolute", left: 0, top: 0, width: b.w, height: th, background: b.col, opacity: b.op, borderRadius: th, transform: `translate(${b.x.toFixed(1)}px, ${(b.y - th / 2).toFixed(1)}px)` }} />)
  }
  for (const [id, q] of Object.entries(B.parens)) {
    // two curves, each bowing out from its ends, as tall as what they hold
    const H = q.bot - q.top, sw = Math.max(1.6, B.size * 0.06)
    const L = `M ${q.bw * 0.95} 0 Q ${-q.bw * 0.55} ${H / 2} ${q.bw * 0.95} ${H}`
    const R = `M ${q.w - q.bw * 0.95} 0 Q ${q.w + q.bw * 0.55} ${H / 2} ${q.w - q.bw * 0.95} ${H}`
    out.push(
      <svg key={`paren-${id}`} width={q.w} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: q.op, transform: `translate(${q.x.toFixed(1)}px, ${q.top.toFixed(1)}px)` }}>
        <path d={L} fill="none" stroke={q.col} strokeWidth={sw} strokeLinecap="round" />
        <path d={R} fill="none" stroke={q.col} strokeWidth={sw} strokeLinecap="round" />
      </svg>,
    )
  }
  for (const [id, d] of Object.entries(B.atoms)) out.push(piece(id, d, d.op, time, B.size, tilted))
  B.gone.forEach((g, k) => out.push(piece(`gone-${k}-${g.d.node.id}`, g.d, Math.max(0, g.life) * g.d.op, time, B.size, false)))
  // a small stand under the equals sign, when the line is shown as a balance
  if (B.stand.v > 0.01) {
    const s = B.size * 0.42
    out.push(
      <svg key="stand" width={s * 2} height={s * 1.6} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: B.stand.v, transform: `translate(${(pivot - s).toFixed(1)}px, ${(B.cy + B.size * 0.62).toFixed(1)}px)` }}>
        <polygon points={`${s},0 ${s * 1.75},${s * 1.3} ${s * 0.25},${s * 1.3}`} fill="none" stroke={tilted ? PINK : "#7a7875"} strokeWidth={2} strokeLinejoin="round" />
      </svg>,
    )
  }
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity, transformOrigin: `${pivot.toFixed(1)}px ${B.cy.toFixed(1)}px`, transform: `rotate(${B.tilt.v.toFixed(2)}deg)` }}>
      {out}
    </div>
  )
}

function piece(key: string, d: Drawn, op: number, time: number, size: number, tilted: boolean) {
  const n = d.node
  const top = d.y - d.base
  if (n.k === "box") {
    const cls = [styles.box, n.slot ? styles.boxSlot : "", n.state === "wrong" ? styles.boxWrong : "", n.state === "right" ? styles.boxRight : "", n.state === "guessed" ? styles.boxGuessed : ""].join(" ")
    return (
      <div key={`${key}-${n.wrongAt}`} style={{ position: "absolute", left: 0, top: 0, opacity: op, transform: `translate(${d.x.toFixed(1)}px, ${top.toFixed(1)}px)`, fontSize: size }}>
        <span className={cls} style={{ width: d.w, height: d.h, boxSizing: "border-box", minWidth: 0 }}>
          {n.tex
            ? <span className={ATOM_CLASS} style={{ position: "static", color: n.state === "right" ? GREEN : "#f0eeea" }} dangerouslySetInnerHTML={{ __html: texHtml(n.tex) }} />
            : n.slot ? null : <span className={styles.boxCaret} />}
        </span>
      </div>
    )
  }
  const col = n.id === "eq" && tilted ? PINK : n.col ?? CHALK
  const sc = n.scale ?? 1
  const cls = `${ATOM_CLASS} ${n.pulse ? "pl-eq-pulse" : ""} ${n.grab ? "pl-eq-grab" : ""}`
  const strike = n.strike !== undefined ? Math.min(1, Math.max(0, (time - n.strike) / 0.3)) : 0
  return (
    <div key={key}>
      <div className={cls} style={{ transform: `translate(${d.x.toFixed(1)}px, ${top.toFixed(1)}px)`, fontSize: size * sc, color: col, opacity: op }}
        dangerouslySetInnerHTML={{ __html: texHtml(n.tex) }} />
      {strike > 0 && (
        <svg width={d.w + 8} height={d.h} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", opacity: op, transform: `translate(${(d.x - 4).toFixed(1)}px, ${top.toFixed(1)}px)` }}>
          <line x1={0} y1={d.h * 0.85} x2={(d.w + 8) * strike} y2={d.h * 0.85 - d.h * 0.7 * strike} stroke={PINK} strokeWidth={2.6} strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}
