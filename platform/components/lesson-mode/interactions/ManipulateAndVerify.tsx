"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import katex from "katex"
import { COLOR, Prompt, AltDemoCard, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Handle = {
  id: string
  /** Initial math coords */
  x: number
  y: number
  /** Snap step in math units (default 1) */
  snap?: number
  /** Range constraint */
  xRange?: [number, number]
  yRange?: [number, number]
  color?: string
}

export type ManipulateAndVerifyConfig = {
  prompt?: string
  xRange: [number, number]
  yRange: [number, number]
  handles: Handle[]
  /**
   * SVG-generator function body. Receives current positions and returns SVG markup
   * for the static scene (everything except the draggable handles, which the
   * component renders itself). Form: (handles, color) => string
   */
  renderScene: string
  /**
   * Success-test function body. Receives current positions, returns boolean.
   * Form: (handles) => boolean
   */
  successTest: string
  /** Live readouts to show (e.g. "mirror: x = " + h.M.x). Form: (handles) => string[] */
  readoutHtml?: string
  successText?: string
  /** Animated demonstration of the method, injected by LessonRunner when the
   *  student taps "explain another way". Shown ON the canvas, never in place
   *  of the question. */
  altDemo?: string
}

/**
 * ManipulateAndVerify — multi-handle drag with a custom success condition.
 * Use cases: drag a mirror line until it bisects two shapes; place a centre
 * AND set an angle until rotation lands; etc.
 *
 * The lesson author provides three small functions in JSON (renderScene,
 * successTest, readoutHtml). Each is `new Function`-compiled at mount.
 */
export default function ManipulateAndVerify({ config, onComplete, onDismissAlt }: InteractionProps<ManipulateAndVerifyConfig>) {
  const [handles, setHandles] = useState<Record<string, { x: number; y: number }>>(
    Object.fromEntries(config.handles.map(h => [h.id, { x: h.x, y: h.y }]))
  )
  const [done, setDone] = useState(false)
  const wrapRef = useRef<SVGSVGElement | null>(null)
  const dragRef = useRef<{ handleId: string; startMouse: [number, number]; startMath: [number, number] } | null>(null)

  // Compile the config functions during render (memoised). Compiling in a
  // useEffect ran after the first paint, so the scene was empty for one frame.
  type Handles = Record<string, { x: number; y: number }>
  const { sceneFn, successFn, readoutFn } = useMemo(() => {
    let scene: (h: Handles, c: typeof COLOR) => string = () => ""
    let success: (h: Handles) => boolean = () => false
    let readout: (h: Handles) => string = () => ""
    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      scene = new Function("h", "color", `return (${config.renderScene})(h, color)`) as typeof scene
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
      success = new Function("h", `return (${config.successTest})(h)`) as typeof success
      if (config.readoutHtml) {
        // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
        readout = new Function("h", `return (${config.readoutHtml})(h)`) as typeof readout
      }
    } catch (e) { void e }
    return { sceneFn: scene, successFn: success, readoutFn: readout }
  }, [config.renderScene, config.successTest, config.readoutHtml])

  // Check success on every handle change
  useEffect(() => {
    if (done) return
    try {
      if (successFn(handles)) {
        setDone(true)
        onComplete({ handles })
      }
    } catch { /* ignore */ }
  }, [handles, done, onComplete, successFn])

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

  function startDrag(e: React.PointerEvent, handleId: string) {
    if (done) return
    e.preventDefault()
    e.stopPropagation()
    const svg = wrapRef.current!
    svg.setPointerCapture(e.pointerId)
    const r = svg.getBoundingClientRect()
    const scale = SVG_W / r.width
    const curr = handles[handleId]
    dragRef.current = {
      handleId,
      startMouse: [e.clientX * scale, e.clientY * scale],
      startMath: [curr.x, curr.y],
    }
  }

  function onMove(e: React.PointerEvent) {
    if (!dragRef.current) return
    const svg = wrapRef.current!
    const r = svg.getBoundingClientRect()
    const scale = SVG_W / r.width
    const dx = (e.clientX * scale - dragRef.current.startMouse[0]) / u
    const dy = -(e.clientY * scale - dragRef.current.startMouse[1]) / u
    const handleSpec = config.handles.find(h => h.id === dragRef.current!.handleId)!
    const snap = handleSpec.snap ?? 1
    let nx = Math.round((dragRef.current.startMath[0] + dx) / snap) * snap
    let ny = Math.round((dragRef.current.startMath[1] + dy) / snap) * snap
    if (handleSpec.xRange) nx = Math.max(handleSpec.xRange[0], Math.min(handleSpec.xRange[1], nx))
    if (handleSpec.yRange) ny = Math.max(handleSpec.yRange[0], Math.min(handleSpec.yRange[1], ny))
    setHandles(h => ({ ...h, [dragRef.current!.handleId]: { x: nx, y: ny } }))
  }

  function endDrag() {
    dragRef.current = null
  }

  // Grid
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

  const scene = (() => {
    try { return sceneFn(handles, COLOR) } catch { return "" }
  })()
  const readout = (() => {
    if (!config.readoutHtml) return ""
    try { return readoutFn(handles) } catch { return "" }
  })()

  // Render KaTeX on the readout string (it may contain $...$)
  const readoutRendered = readout.replace(/\$([^$]+)\$/g, (_, tex) => {
    try { return katex.renderToString(tex, { throwOnError: false, displayMode: false, output: "html" }) } catch { return tex }
  })

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>
      <AltDemoCard svg={config.altDemo} onDismiss={onDismissAlt} />

      <div className="relative w-full max-w-[520px]">
        <svg
          ref={wrapRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className={`block w-full h-auto rounded-xl border touch-none ${done ? "pl-success-pulse" : ""}`}
          style={{ background: COLOR.card, borderColor: done ? COLOR.green : COLOR.border, transition: "border-color 300ms" }}
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <g>{gridLines}</g>
          <g dangerouslySetInnerHTML={{ __html: scene }} />
          {config.handles.map(h => {
            const p = handles[h.id]
            const [cx, cy] = toPx(p.x, p.y)
            return (
              <g key={h.id}>
                <circle cx={cx} cy={cy} r={11} fill="transparent" stroke="none" style={{ cursor: done ? "default" : "grab" }} onPointerDown={e => startDrag(e, h.id)} />
                <circle cx={cx} cy={cy} r={6} fill={h.color ?? COLOR.yellow} stroke={COLOR.bg} strokeWidth={2} style={{ pointerEvents: "none" }}>
                  {!done && <animate attributeName="r" values="6;8;6" dur="2s" repeatCount="indefinite" />}
                </circle>
              </g>
            )
          })}
        </svg>

        {readout && (
          <p
            className="absolute top-3 left-3 text-[11px] font-mono pointer-events-none transition-colors duration-300"
            style={{ color: done ? COLOR.green : COLOR.faint }}
            dangerouslySetInnerHTML={{ __html: readoutRendered }}
          />
        )}
      </div>

      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-5 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"
        />
      )}

      <HelperRow />
    </div>
  )
}
