"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { COLOR, MixedText, type InteractionProps } from "./_shared"

type ScenePoint = { x: number; y: number; color?: string; label?: string; primed?: boolean }
type SceneLine  = { from: [number, number]; to: [number, number]; color?: string; dashed?: boolean; label?: string }

export type ClickOnGridConfig = {
  prompt?: string
  xRange: [number, number]
  yRange: [number, number]
  scene?: { points?: ScenePoint[]; lines?: SceneLine[] }
  target: { x: number; y: number }
  tolerance?: number
  successText?: string
  /** Verify slides: no show-me ring. Injected by InteractionSlide. */
  noHelp?: boolean
}

/**
 * ClickOnGrid — student taps a coordinate on the grid. Same layout and
 * sizing rules as WidgetCanvas so the click puzzles feel like a sibling
 * of the drag puzzles: grid takes the canvas on the left at xl (≥1280 px),
 * stacked above the side panel on smaller viewports.
 *
 * Visual styling (grid colour, axis weight, KaTeX tick labels, vertex
 * dot shape and label position) mirrors the transformation widgets.
 */
type ClickOnGridProps = InteractionProps<ClickOnGridConfig> & { onAdvance?: () => void }

export default function ClickOnGrid({ config, onComplete, onAdvance, onShowMeUsed }: ClickOnGridProps) {
  const [pick, setPick] = useState<{ x: number; y: number; correct: boolean } | null>(null)
  const [done, setDone] = useState(false)
  const [wrongFlashId, setWrongFlashId] = useState(0)
  const [hintShown, setHintShown] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const colRef = useRef<HTMLDivElement | null>(null)
  // Capture the auto-advance timer so unmount (slide change) can cancel it.
  // Otherwise a stale onAdvance closure firing after the student has manually
  // clicked next bounces them backwards (see InteractionSlide for the long
  // explanation). The wrong-flash timer gets the same treatment so a fast
  // slide change can't fire setState on an unmounted component.
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrongFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
      if (wrongFlashTimerRef.current !== null) {
        clearTimeout(wrongFlashTimerRef.current)
        wrongFlashTimerRef.current = null
      }
    }
  }, [])

  // Same sizing as WidgetCanvas: compute from window.innerWidth, no DOM reads.
  // useLayoutEffect (not useEffect) so the SVG is sized before the browser
  // paints — otherwise it briefly shows the browser-default size and the
  // grid visibly resizes after first paint.
  useLayoutEffect(() => {
    function fit() {
      const svg = svgRef.current
      if (!svg) return
      const ASPECT = 480 / 320
      const RESERVED = 200
      const vw = window.innerWidth
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide ? 320 + 28 : 0
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(300, window.innerHeight - RESERVED)
      const widthByHeight = ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / ASPECT
      svg.style.width  = `${Math.round(w)}px`
      svg.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => { window.removeEventListener("resize", fit) }
  }, [])

  const tol = config.tolerance ?? 0
  const [xMin, xMax] = config.xRange
  const [yMin, yMax] = config.yRange
  const SVG_W = 480
  const SVG_H = 320
  // 28 px inner padding so the grid sits inside the card with a small margin
  // (cleaner look than the grid running edge-to-edge). The transformation
  // widgets use the same padding in lesson mode so the two render identically.
  const PAD = 28
  const pxPerX = (SVG_W - 2 * PAD) / (xMax - xMin)
  const pxPerY = (SVG_H - 2 * PAD) / (yMax - yMin)
  const u = Math.min(pxPerX, pxPerY)
  const ORIG_X = (SVG_W - (xMax - xMin) * u) / 2 - xMin * u
  const ORIG_Y = SVG_H - (-yMin) * u - (SVG_H - (yMax - yMin) * u) / 2

  const toPx = (mx: number, my: number) => [ORIG_X + mx * u, ORIG_Y - my * u] as const

  function handleClick(e: React.PointerEvent<SVGSVGElement>) {
    if (done) return
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const scale = SVG_W / rect.width
    const px = (e.clientX - rect.left) * scale
    const py = (e.clientY - rect.top) * scale
    const mx = Math.round((px - ORIG_X) / u)
    const my = Math.round((ORIG_Y - py) / u)
    const correct = Math.abs(mx - config.target.x) <= tol && Math.abs(my - config.target.y) <= tol
    if (correct) {
      setPick({ x: mx, y: my, correct: true })
      setDone(true)
      onComplete({ pick: { x: mx, y: my }, attempts })
      // Auto-advance after a short pause. The SVG already locks further taps
      // via the `done` check at the top of this handler.
      if (onAdvance) {
        advanceTimerRef.current = setTimeout(() => {
          advanceTimerRef.current = null
          onAdvance()
        }, 2800)
      }
    } else {
      setAttempts(a => a + 1)
      setPick({ x: mx, y: my, correct: false })
      const id = wrongFlashId + 1
      setWrongFlashId(id)
      wrongFlashTimerRef.current = setTimeout(() => {
        wrongFlashTimerRef.current = null
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
    gridLines.push(<line key={`gx${x}`} x1={px} y1={py1} x2={px} y2={py2} stroke="#141e2a" strokeWidth={0.7} />)
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const [px1] = toPx(xMin, 0)
    const [px2] = toPx(xMax, 0)
    const [, py] = toPx(0, y)
    gridLines.push(<line key={`gy${y}`} x1={px1} y1={py} x2={px2} y2={py} stroke="#141e2a" strokeWidth={0.7} />)
  }

  // Tick numbers — plain SVG <text> in Geist Mono, matching the
  // transformation explorer widgets. Previously rendered via
  // foreignObject + KaTeX, which (a) drifted on iOS Safari and
  // (b) didn't match the widget grids' mono style.
  const ticks: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    if (x === 0) continue
    const [px, py0] = toPx(x, 0)
    ticks.push(
      <text
        key={`tx${x}`}
        x={px}
        y={py0 + 11}
        fontFamily="'Geist Mono', monospace"
        fontSize={12}
        fontWeight={600}
        fill={COLOR.grey}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {String(x)}
      </text>
    )
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    if (y === 0) continue
    const [px0, py] = toPx(0, y)
    ticks.push(
      <text
        key={`ty${y}`}
        x={px0 - 12}
        y={py}
        fontFamily="'Geist Mono', monospace"
        fontSize={12}
        fontWeight={600}
        fill={COLOR.grey}
        textAnchor="middle"
        dominantBaseline="middle"
        pointerEvents="none"
      >
        {String(y)}
      </text>
    )
  }

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
      {/* grid canvas — claims the canvas */}
      <div ref={colRef} className="flex-1 min-w-0 flex items-center justify-center">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          onPointerDown={handleClick}
          className={`block rounded-xl border touch-none ${done ? "pl-success-pulse" : ""}`}
          style={{
            background: COLOR.card,
            borderColor: done ? COLOR.green : COLOR.border,
            transition: "border-color 300ms",
            cursor: done ? "default" : "crosshair",
          }}
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
                  <text
                    x={mx}
                    y={my - 20}
                    fontFamily="'Geist Mono', monospace"
                    fontSize={12}
                    fontWeight={600}
                    fill={col}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {l.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* scene points — match widget vertex style */}
          {config.scene?.points?.map((p, i) => {
            const [px, py] = toPx(p.x, p.y)
            const col = p.color ?? COLOR.blue
            return (
              <g key={`sp${i}`}>
                <circle cx={px} cy={py} r={4} fill={col}>
                  {p.primed && <animate attributeName="r" values="4;6;4" dur="1.8s" repeatCount="indefinite" />}
                </circle>
                {p.label && (
                  <text
                    x={px + 10}
                    y={py - 10}
                    fontFamily="'Geist Mono', monospace"
                    fontSize={12}
                    fontWeight={600}
                    fill={col}
                    textAnchor="start"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {p.label}
                  </text>
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

          {/* show-me hint — a soft yellow ring near the target. Doesn't
              complete the slide. Student still has to tap the right cell. */}
          {hintShown && !pick && (() => {
            const [px, py] = toPx(config.target.x, config.target.y)
            return (
              <g>
                <circle cx={px} cy={py} r={u * 0.85} fill="rgba(255,240,103,0.06)" stroke={COLOR.yellow} strokeWidth={1.4} strokeDasharray="4 4" opacity="0.85">
                  <animate attributeName="r" values={`${u * 0.75};${u * 0.95};${u * 0.75}`} dur="1.8s" repeatCount="indefinite" />
                </circle>
              </g>
            )
          })()}
        </svg>
      </div>

      {/* side panel — same shape as WidgetCanvas */}
      <aside className="pl-stagger w-full xl:w-[320px] shrink-0 flex flex-col gap-4 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug max-w-full"
          />
        )}
        <div
          className="rounded-lg border px-4 py-3.5 transition-colors duration-300"
          style={{
            borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
            background: done ? "rgba(15,238,137,0.05)" : "transparent",
          }}
        >
          <p
            className="text-[10.5px] font-mono uppercase tracking-[2px] mb-1.5 transition-colors duration-300"
            style={{ color: done ? COLOR.green : COLOR.faint }}
          >
            {done ? "correct" : "your turn"}
          </p>
          <MixedText
            text={done ? config.successText ?? "Nicely done." : "Tap the grid square where the image should land."}
            className="block text-[15px] sm:text-[16px] leading-relaxed"
            style={{ color: done ? COLOR.green : COLOR.text }}
          />
        </div>
        {!done && !hintShown && !config.noHelp && (
          <button
            onClick={() => { setHintShown(true); onShowMeUsed?.() }}
            className="self-start text-[11px] font-mono text-[#3a4a5a] hover:text-[#7a7875] transition-colors"
          >
            show me a hint
          </button>
        )}
        {!done && hintShown && (
          <p className="self-start text-[13px] text-[#7a7875]">
            The ring marks the answer area. Tap inside it to confirm.
          </p>
        )}
      </aside>
    </div>
  )
}

