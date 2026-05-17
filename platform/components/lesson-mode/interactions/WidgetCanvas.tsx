"use client"

import { useEffect, useRef, useState } from "react"
import { COLOR, MixedText, ReadoutPanel, useWidgetReadout, type InteractionProps } from "./_shared"

export type WidgetCanvasConfig = {
  src: string
  target?: string
  /** When true, the widget hides its dashed target outline so the student must compute the
   *  answer blind. Use for follow-up practice after one guided example. */
  noOutline?: boolean
  prompt?: string
  successText?: string
  widget?: string
}

/**
 * WidgetCanvas — embeds a polished HTML widget and listens for
 * `pl-lesson-success` (puzzle solved) and `pl-lesson-readout` (live state).
 *
 * Layout: side-by-side from lg (≥1024px), stacked below (iPad landscape and
 * narrower stacks so the manipulative is never squeezed thin). The iframe
 * is sized up-front from the column width + viewport height so the widget
 * renders at its right size from initial paint, no flash-then-clip.
 */
export default function WidgetCanvas({ config, onComplete }: InteractionProps<WidgetCanvasConfig>) {
  const [solved, setSolved] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const colRef = useRef<HTMLDivElement | null>(null)
  const readout = useWidgetReadout(iframeRef)

  const params = new URLSearchParams()
  params.set("lessonMode", "1")
  if (config.target) params.set("target", config.target)
  if (config.noOutline) params.set("noOutline", "1")
  const finalSrc = config.src + (config.src.includes("?") ? "&" : "?") + params.toString()

  // Up-front sizing: width is the SVG aspect (1.5) of usable height, capped
  // by column width. Strip is hidden in lesson mode so the iframe = SVG only.
  useEffect(() => {
    function fit() {
      const ifr = iframeRef.current
      const col = colRef.current
      if (!ifr || !col) return
      const SVG_ASPECT = 480 / 320
      // chrome (44 + 44 + 56) + section padding (24) + tiny safety = 180
      const RESERVED = 200
      const availableW = col.clientWidth
      const availableH = Math.max(300, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (colRef.current) ro.observe(colRef.current)
    window.addEventListener("resize", fit)
    return () => { ro.disconnect(); window.removeEventListener("resize", fit) }
  }, [])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (iframeRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-lesson-success") {
        if (solved) return
        setSolved(true)
        onComplete({ widget: config.widget ?? "unknown", value: d.value })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [config.widget, onComplete, solved])

  return (
    <div className="w-full flex flex-col lg:flex-row gap-5 lg:gap-7 items-center lg:items-stretch">
      <div ref={colRef} className="flex-1 min-w-0 flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={finalSrc}
          loading="lazy"
          className="block"
          style={{ border: 0, background: "transparent" }}
        />
      </div>

      <aside className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4 justify-center">
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug"
          />
        )}
        <ReadoutPanel readout={readout} solved={solved} />
        <div
          className="rounded-lg border px-4 py-3.5 transition-colors duration-300"
          style={{
            borderColor: solved ? "rgba(15,238,137,0.45)" : COLOR.border,
            background: solved ? "rgba(15,238,137,0.05)" : "transparent",
          }}
        >
          <p
            className="text-[10.5px] font-mono uppercase tracking-[2px] mb-1.5 transition-colors duration-300"
            style={{ color: solved ? COLOR.green : COLOR.faint }}
          >
            {solved ? "solved" : "your turn"}
          </p>
          <MixedText
            text={solved ? config.successText ?? "Nicely done." : "Drag the yellow handles until the shape matches the pink outline."}
            className="block text-[15px] sm:text-[16px] leading-relaxed"
            style={{ color: solved ? COLOR.green : COLOR.text }}
          />
        </div>
      </aside>
    </div>
  )
}
