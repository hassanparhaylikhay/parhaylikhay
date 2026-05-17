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
  /** Click-cursor crosshair colour. */
  cursorColor?: string
  successText?: string
}

/**
 * ClickOnGrid — student taps a coordinate on the grid. Correct tap pulses green
 * and fires onComplete; wrong tap shakes + drops a brief red marker that fades.
 *
 * Use whenever the answer is a single point: "where does (3,5) reflect to?",
 * "where does (3,0) rotate to?", "where does this point translate to?".
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
        // Only clear if still showing this same wrong pick
        setPick(curr => (curr && !curr.correct ? null : curr))
      }, 900)
    }
  }

  // grid
  const gridLines: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const [px] = toPx(x, 0)
    const [, py1] = toPx(0, yMin)
    const [, py2] = toPx(0, yMax)
    gridLines.push(<line key={`gx${x}`} x1={px} y1={py1} x2={px} y2={py2} stroke={COLOR.grid} strokeWidth={x === 0 ? 1 : 0.5} opacity={x === 0 ? 0.5 : 0.22} />)
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const [px1] = toPx(xMin, 0)
    const [px2] = toPx(xMax, 0)
    const [, py] = toPx(0, y)
    gridLines.push(<line key={`gy${y}`} x1={px1} y1={py} x2={px2} y2={py} stroke={COLOR.grid} strokeWidth={y === 0 ? 1 : 0.5} opacity={y === 0 ? 0.5 : 0.22} />)
  }

  // axis tick numbers
  const ticks: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x === 0) continue
    const [px, py] = toPx(x, 0)
    ticks.push(<text key={`tx${x}`} x={px} y={py + 14} textAnchor="middle" fontFamily="Geist Mono, monospace" fontSize={10} fill={COLOR.grey}>{x}</text>)
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y === 0) continue
    const [px, py] = toPx(0, y)
    ticks.push(<text key={`ty${y}`} x={px - 10} y={py + 3} textAnchor="end" fontFamily="Geist Mono, monospace" fontSize={10} fill={COLOR.grey}>{y}</text>)
  }

  // Pointer cursor crosshair on click area
  const cursorColor = config.cursorColor ?? COLOR.yellow

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
          <g>{ticks}</g>

          {/* scene lines */}
          {config.scene?.lines?.map((l, i) => {
            const [x1, y1] = toPx(l.from[0], l.from[1])
            const [x2, y2] = toPx(l.to[0], l.to[1])
            return (
              <g key={`sl${i}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={l.color ?? COLOR.yellow} strokeWidth={1.6} strokeDasharray={l.dashed ? "5 4" : undefined} opacity={0.85} />
                {l.label && (
                  <foreignObject x={(x1 + x2) / 2 - 40} y={(y1 + y2) / 2 - 22} width={80} height={20}>
                    <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 11, color: l.color ?? COLOR.yellow, textAlign: "center" }}
                      dangerouslySetInnerHTML={{ __html: tryKatex(l.label) }} />
                  </foreignObject>
                )}
              </g>
            )
          })}

          {/* scene points */}
          {config.scene?.points?.map((p, i) => {
            const [px, py] = toPx(p.x, p.y)
            const col = p.color ?? COLOR.blue
            return (
              <g key={`sp${i}`}>
                <circle cx={px} cy={py} r={5.5} fill={col} stroke={COLOR.bg} strokeWidth={2}>
                  {p.primed && <animate attributeName="r" values="5.5;7;5.5" dur="1.8s" repeatCount="indefinite" />}
                </circle>
                {p.label && (
                  <foreignObject x={px + 8} y={py - 22} width={100} height={20}>
                    <div style={{ fontFamily: "Geist Mono, monospace", fontSize: 12, color: col }}
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
                <circle cx={px} cy={py} r={9} fill={col} fillOpacity={pick.correct ? 0.35 : 0.25} stroke={col} strokeWidth={2}>
                  {pick.correct && <animate attributeName="r" values="9;14;9" dur="0.6s" begin="0s" />}
                </circle>
              </g>
            )
          })()}

          {/* show-me reveal */}
          {revealed && !pick && (() => {
            const [px, py] = toPx(config.target.x, config.target.y)
            return (
              <circle cx={px} cy={py} r={10} fill={COLOR.green} fillOpacity={0.25} stroke={COLOR.green} strokeWidth={2} strokeDasharray="4 4">
                <animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )
          })()}
        </svg>
        <span className="absolute top-3 right-3 text-[10.5px] font-mono pointer-events-none" style={{ color: done ? COLOR.green : COLOR.faint }}>
          {done ? "correct" : "tap a grid point"}
        </span>
        <span className="hidden" style={{ color: cursorColor }} />
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
