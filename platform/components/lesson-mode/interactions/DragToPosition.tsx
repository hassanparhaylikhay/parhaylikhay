"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { COLOR, Prompt, AltPanelCentered, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Vertex = [number, number]

export type DragToPositionConfig = {
  prompt?: string
  /** Math coordinate system: xRange = [xMin, xMax], yRange = [yMin, yMax]. */
  xRange: [number, number]
  yRange: [number, number]
  /** Object triangle vertices in math units. */
  shape: Vertex[]
  /** Initial offset to apply to the shape (math units). */
  startOffset: Vertex
  /** Target offset that triggers success (math units). */
  targetOffset: Vertex
  /** Snap to nearest n units (default 1). */
  snap?: number
  /** Tolerance in math units for matching the target (default 0). */
  tolerance?: number
  /** Optional success line shown after the student lands it. */
  successText?: string
  /** When true, also show the target shape as a faint outline. */
  showTarget?: boolean
  /** Verify slides: no show-me reveal. Injected by InteractionSlide. */
  noHelp?: boolean
  /** Alternative explanation, injected by LessonRunner when the student
   *  taps "explain another way". Shown ALONGSIDE the prompt. */
  altText?: string
}

/**
 * DragToPosition — student drags the blue shape until it lands on the pink target.
 * Freeform, but snaps to integer grid for clean feel. Pointer-events; works on touch.
 */
export default function DragToPosition({ config, onComplete, onShowMeUsed }: InteractionProps<DragToPositionConfig>) {
  const snap = config.snap ?? 1
  const tol = config.tolerance ?? 0
  const showTarget = config.showTarget !== false

  const [offset, setOffset] = useState<Vertex>(config.startOffset)
  const [done, setDone] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const wrapRef = useRef<SVGSVGElement | null>(null)
  const draggingRef = useRef<{ startMouse: Vertex; startOffset: Vertex } | null>(null)

  // Scale: math units → SVG px
  const [xMin, xMax] = config.xRange
  const [yMin, yMax] = config.yRange
  const SVG_W = 480
  const SVG_H = 320
  const PAD = 24
  const ux = (SVG_W - 2 * PAD) / (xMax - xMin)
  const uy = (SVG_H - 2 * PAD) / (yMax - yMin)
  const u = Math.min(ux, uy) // keep square units
  const offsetX = (SVG_W - u * (xMax - xMin)) / 2
  const offsetY = (SVG_H - u * (yMax - yMin)) / 2

  const toPx = (mx: number, my: number) => [offsetX + (mx - xMin) * u, offsetY + (yMax - my) * u] as const
  const toMath = (px: number, py: number): Vertex => [
    (px - offsetX) / u + xMin,
    yMax - (py - offsetY) / u,
  ]

  // shape in math units (with offset applied)
  const placedShape: Vertex[] = config.shape.map(([x, y]) => [x + offset[0], y + offset[1]])
  const targetShape: Vertex[] = config.shape.map(([x, y]) => [x + config.targetOffset[0], y + config.targetOffset[1]])

  const pickup = useCallback((clientX: number, clientY: number, ptrId: number) => {
    if (done) return
    const svg = wrapRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const scale = SVG_W / r.width
    draggingRef.current = {
      startMouse: [clientX * scale, clientY * scale],
      startOffset: offset,
    }
    svg.setPointerCapture(ptrId)
  }, [done, offset])

  const move = useCallback((clientX: number, clientY: number) => {
    if (!draggingRef.current) return
    const svg = wrapRef.current
    if (!svg) return
    const r = svg.getBoundingClientRect()
    const scale = SVG_W / r.width
    const dx = clientX * scale - draggingRef.current.startMouse[0]
    const dy = clientY * scale - draggingRef.current.startMouse[1]
    // Convert px delta to math delta (note y inverted)
    const mdx = dx / u
    const mdy = -dy / u
    const so = draggingRef.current.startOffset
    const next: Vertex = [
      Math.round((so[0] + mdx) / snap) * snap,
      Math.round((so[1] + mdy) / snap) * snap,
    ]
    setOffset(next)
  }, [u, snap])

  const drop = useCallback(() => {
    if (!draggingRef.current) return
    draggingRef.current = null
    // check success against the current offset
    const [tx, ty] = config.targetOffset
    setOffset(curr => {
      const [cx, cy] = curr
      const hit = Math.abs(cx - tx) <= tol && Math.abs(cy - ty) <= tol
      if (hit && !done) {
        setDone(true)
        onComplete({ offset: curr })
      }
      return curr
    })
  }, [config.targetOffset, tol, done, onComplete])

  useEffect(() => {
    const svg = wrapRef.current
    if (!svg) return
    function onPointerDown(e: PointerEvent) {
      e.preventDefault()
      pickup(e.clientX, e.clientY, e.pointerId)
    }
    function onPointerMove(e: PointerEvent) {
      if (!draggingRef.current) return
      e.preventDefault()
      move(e.clientX, e.clientY)
    }
    function onPointerUp(e: PointerEvent) {
      if (!draggingRef.current) return
      e.preventDefault()
      drop()
    }
    svg.addEventListener("pointerdown", onPointerDown)
    svg.addEventListener("pointermove", onPointerMove)
    svg.addEventListener("pointerup", onPointerUp)
    svg.addEventListener("pointercancel", onPointerUp)
    return () => {
      svg.removeEventListener("pointerdown", onPointerDown)
      svg.removeEventListener("pointermove", onPointerMove)
      svg.removeEventListener("pointerup", onPointerUp)
      svg.removeEventListener("pointercancel", onPointerUp)
    }
  }, [pickup, move, drop])

  // ── grid ticks ────────────────────────────────────────────────────
  const gridLines: React.ReactElement[] = []
  for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
    const [px] = toPx(x, 0)
    const [, py1] = toPx(0, yMin)
    const [, py2] = toPx(0, yMax)
    gridLines.push(<line key={`gx${x}`} x1={px} y1={py1} x2={px} y2={py2} stroke={COLOR.grid} strokeWidth={x === 0 ? 1 : 0.5} opacity={x === 0 ? 0.5 : 0.25} />)
  }
  for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
    const [px1] = toPx(xMin, 0)
    const [px2] = toPx(xMax, 0)
    const [, py] = toPx(0, y)
    gridLines.push(<line key={`gy${y}`} x1={px1} y1={py} x2={px2} y2={py} stroke={COLOR.grid} strokeWidth={y === 0 ? 1 : 0.5} opacity={y === 0 ? 0.5 : 0.25} />)
  }

  function shapePath(verts: Vertex[]) {
    return verts.map(([x, y], i) => {
      const [px, py] = toPx(x, y)
      return `${i === 0 ? "M" : "L"} ${px} ${py}`
    }).join(" ") + " Z"
  }

  function revealAnswer() {
    onShowMeUsed?.()
    setOffset(config.targetOffset)
    setRevealed(true)
    if (!done) {
      setDone(true)
      onComplete({ revealed: true, offset: config.targetOffset })
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>
      <AltPanelCentered text={config.altText} />

      <div className="relative w-full max-w-[520px]">
        <svg
          ref={wrapRef}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className={`block w-full h-auto rounded-xl border touch-none ${done ? "pl-success-pulse" : ""}`}
          style={{ background: COLOR.card, borderColor: done ? COLOR.green : COLOR.border, transition: "border-color 300ms" }}
        >
          <g>{gridLines}</g>

          {/* Target outline (pink) */}
          {showTarget && (
            <path
              d={shapePath(targetShape)}
              fill="none"
              stroke={COLOR.pink}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              opacity={done ? 0.4 : 0.7}
              style={{ transition: "opacity 300ms" }}
            />
          )}

          {/* Movable shape (blue) */}
          <path
            d={shapePath(placedShape)}
            fill={done ? "rgba(15,238,137,0.18)" : "rgba(0,171,250,0.18)"}
            stroke={done ? COLOR.green : COLOR.blue}
            strokeWidth={1.75}
            style={{ cursor: done ? "default" : "grab", transition: "fill 300ms, stroke 300ms" }}
          />
        </svg>

        {/* Live offset readout */}
        <p
          className="absolute top-3 left-3 text-[10.5px] font-mono pointer-events-none transition-colors duration-300"
          style={{ color: done ? COLOR.green : COLOR.faint }}
        >
          shift &nbsp;⟨{offset[0]}, {offset[1]}⟩
        </p>
      </div>

      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-5 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[560px] leading-relaxed"
        />
      )}

      {!config.noHelp && <HelperRow onShowMe={!done && !revealed ? revealAnswer : undefined} />}
    </div>
  )
}
