"use client"

import { useRef, useState } from "react"
import katex from "katex"
import { COLOR, Prompt, HelperRow, MixedText, type InteractionProps } from "./_shared"

type ScenePoint = { x: number; y: number; color?: string; label?: string; primed?: boolean }
type SceneLine  = { from: [number, number]; to: [number, number]; color?: string; dashed?: boolean; label?: string }

export type ClickOnGridConfig = {
  prompt?: string
  /** Coordinate bounds (in maths units). */
  xRange: [number, number]
  yRange: [number, number]
  /** Static scene shown before any click — points, mirror lines, centres, etc. */
  scene?: {
    points?: ScenePoint[]
    lines?: SceneLine[]
  }
  /** The grid point the student must click. */
  target: { x: number; y: number }
  /** Tolerance in maths units. Default 0. */
  tolerance?: number
  successText?: string
}

/**
 * ClickOnGrid — student taps a coordinate on the grid. Correct tap pulses green
 * and fires onComplete; wrong tap shakes + drops a brief red marker that fades.
 *
 * Visual styling mirrors the transformation widgets (translation-explorer etc.):
 * same grid colour, axis weight, KaTeX-rendered tick labels and vertex labels,
 * so the click puzzles feel like a sibling of the drag puzzles.
 */
export default function ClickOnGrid({ config, onComplete }: InteractionProps<ClickOnGridConfig>) {
  const [pick, setPick] = useState<{ x: number; y: number; correct: boolean } | null>(null)
  const [done, setDone] = useState(false)
  const [wrongFlashId, setWrongFlashId] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const tol = config.tolerance ?? 0
  const [xMin, xMax] = config.xRange
  const [yMin, yMax] = config.yRange
  const SVG_W = 480
  const SVG_H = 320
  const PAD = 28
  const ux = (SVG_W - 2 * PAD) / (xMax - xMin)
  const uy = (SVG_H - 2 * PAD) / (yMax - yMin)
  const u = Math.min(ux, uy)
  const ox = (SVG_W - u * (xMax - xMin)) / 2
  const oy = (SVG_H - u * (yMax - yMin)) / 2

  const toPx = (mx: number, my: number) => [ox + (mx - xMin) * u, oy + (yMax - my) * u] as const

  function handleClick(e: React.PointerEvent<SVGSVGElement>) {
    if (done) return
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const scale = SVG_W / rect.width
    const px = (e.clientX - rect.left) * scale
    const py = (e.clientY - rect.top) * scale
    const mx = Math.round((px - ox) / u + xMin)
    const my = Math.round(yMax - (py - oy) / u)
    const correct = Math.abs(mx - config.target.x) <= tol && Math.abs(my - config.target.y) <= tol
    if (correct) {
      setPick({ x: mx, y: my, correct: true })
      setDone(true)
      onComplete({ pick: { x: mx, y: my } })
    } else {
      setPick({ x: mx, y: my, correct: false })
      const id = wrongFlashId + 1
      setWrongFlashId(id)
      setTimeout(() => {
        setPick(curr => (curr && !curr.correct ? null : curr))
      }, 900)
    }
  }

  // ── grid + axes (same colours as the transformation widgets) ─────────
  const gridLines: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const [px] = toPx(x, 0)
    const [, py1] = toPx(0, yMin)
    const [, py2] = toPx(0, yMax)
    gridLines.push(<line key={`gx${x}`} x1={px} y1={py1} x2={px} y2={py2} stroke="#141e2a" strokeWidth={0.7} />)
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const [px1] = toPx(xMin, 0)
    const [px2] = toPx(xMax, 0)
    const [, py] = toPx(0, y)
    gridLines.push(<line key={`gy${y}`} x1={px1} y1={py} x2={px2} y2={py} stroke="#141e2a" strokeWidth={0.7} />)
  }

  // ── tick numbers via KaTeX foreignObject (matches widget look) ────────
  const ticks: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x === 0) continue
    const [px, py] = toPx(x, 0)
    ticks.push(
      <foreignObject key={`tx${x}`} x={px - 50} y={py + 4} width={100} height={18} style={{ overflow: "visible", pointerEvents: "none" }}>
        <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: COLOR.grey }}
          dangerouslySetInnerHTML={{ __html: tryKatex(String(x)) }} />
      </foreignObject>
    )
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y === 0) continue
    const [px, py] = toPx(0, y)
    ticks.push(
      <foreignObject key={`ty${y}`} x={px - 60} y={py - 9} width={50} height={18} style={{ overflow: "visible", pointerEvents: "none" }}>
        <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "flex-end", fontFamily: "'Geist Mono',monospace", fontSize: 11, color: COLOR.grey }}
          dangerouslySetInnerHTML={{ __html: tryKatex(String(y)) }} />
      </foreignObject>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>

      <div className="relative w-full max-w-[560px]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          onPointerDown={handleClick}
          className={`block w-full h-auto rounded-xl border touch-none ${done ? "pl-success-pulse" : ""}`}
          style={{ background: COLOR.card, borderColor: done ? COLOR.green : COLOR.border, transition: "border-color 300ms", cursor: done ? "default" : "crosshair" }}
        >
          <g>{gridLines}</g>

          {/* axes (slightly thicker, fainter) */}
          {(() => {
            const [, ay] = toPx(0, 0)
            const [a1] = toPx(xMin, 0)
            const [a2] = toPx(xMax, 0)
            return <line x1={a1} y1={ay} x2={a2} y2={ay} stroke={COLOR.faint} strokeWidth={1.2} />
          })()}
          {(() => {
            const [ax] = toPx(0, 0)
            const [, b1] = toPx(0, yMin)
            const [, b2] = toPx(0, yMax)
            return <line x1={ax} y1={b1} x2={ax} y2={b2} stroke={COLOR.faint} strokeWidth={1.2} />
          })()}

          <g>{ticks}</g>

          {/* scene lines */}
          {config.scene?.lines?.map((l, i) => {
            const [x1, y1] = toPx(l.from[0], l.from[1])
            const [x2, y2] = toPx(l.to[0], l.to[1])
            const col = l.color ?? COLOR.yellow
            const mx = (x1 + x2) / 2
            const my = (y1 + y2) / 2
            return (
              <g key={`sl${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={col} strokeWidth={1.6} strokeDasharray={l.dashed ? "5 4" : undefined} opacity={0.85} />
                {l.label && (
                  <foreignObject x={mx - 50} y={my - 30} width={100} height={20} style={{ overflow: "visible", pointerEvents: "none" }}>
                    <div style={{ height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Geist Mono',monospace", fontSize: 12, fontWeight: 600, color: col }}
                      dangerouslySetInnerHTML={{ __html: tryKatex(l.label) }} />
                  </foreignObject>
                )}
              </g>
            )
          })}

          {/* scene points — matches widget vertex style: small filled dot, KaTeX label */}
          {config.scene?.points?.map((p, i) => {
            const [px, py] = toPx(p.x, p.y)
            const col = p.color ?? COLOR.blue
            return (
              <g key={`sp${i}`}>
                <circle cx={px} cy={py} r={4} fill={col}>
                  {p.primed && <animate attributeName="r" values="4;6;4" dur="1.8s" repeatCount="indefinite" />}
                </circle>
                {p.label && (
                  <foreignObject x={px - 50 + 14} y={py - 11 - 10} width={100} height={22} style={{ overflow: "visible", pointerEvents: "none" }}>
                    <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "flex-start", fontFamily: "'Geist Mono',monospace", fontSize: 12, fontWeight: 600, color: col }}
                      dangerouslySetInnerHTML={{ __html: tryKatex(p.label) }} />
                  </foreignObject>
                )}
              </g>
            )
          })}

          {/* student's pick */}
          {pick && (() => {
            const [px, py] = toPx(pick.x, pick.y)
            const col = pick.correct ? COLOR.green : COLOR.pink
            return (
              <g key={`pick-${wrongFlashId}`} className={pick.correct ? "" : "pl-shake"}>
                <circle cx={px} cy={py} r={8} fill={col} fillOpacity={pick.correct ? 0.30 : 0.22} stroke={col} strokeWidth={1.8}>
                  {pick.correct && <animate attributeName="r" values="8;13;8" dur="0.6s" begin="0s" />}
                </circle>
                <circle cx={px} cy={py} r={3} fill={col} />
              </g>
            )
          })()}

          {/* show-me reveal */}
          {revealed && !pick && (() => {
            const [px, py] = toPx(config.target.x, config.target.y)
            return (
              <circle cx={px} cy={py} r={9} fill="none" stroke={COLOR.green} strokeWidth={1.8} strokeDasharray="4 4">
                <animate attributeName="r" values="7;11;7" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )
          })()}
        </svg>
      </div>

      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-5 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"
        />
      )}

      <HelperRow onShowMe={!done ? () => { setRevealed(true); setDone(true); onComplete({ revealed: true }) } : undefined} />
    </div>
  )
}

function tryKatex(tex: string): string {
  try {
    return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: "html" })
  } catch {
    return tex
  }
}
