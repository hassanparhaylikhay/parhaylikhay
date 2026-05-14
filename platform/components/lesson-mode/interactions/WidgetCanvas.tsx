"use client"

import { useEffect, useRef, useState } from "react"
import { COLOR, MixedText, type InteractionProps } from "./_shared"

export type WidgetCanvasConfig = {
  /** Widget URL. The component appends `lessonMode=1` plus any target params. */
  src: string
  /** Optional target spec passed to the widget as `?target=...`. */
  target?: string
  /** One-line instruction shown in the side panel. */
  prompt?: string
  /** Text revealed in the side panel once the widget fires pl-lesson-success. */
  successText?: string
  /** Widget name (translation, enlargement, etc.). */
  widget?: string
}

/**
 * WidgetCanvas — embeds a polished HTML/Canvas widget and listens for the
 * `pl-lesson-success` postMessage. Sizes the iframe up-front (no flash) so the
 * widget renders at exactly the right size from initial paint.
 *
 * Layout: widget on the left (desktop) or top (mobile). Prompt + status panel
 * on the right (desktop) or below (mobile). Stacks at md (<768px).
 */
export default function WidgetCanvas({ config, onComplete }: InteractionProps<WidgetCanvasConfig>) {
  const [solved, setSolved] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const colRef = useRef<HTMLDivElement | null>(null)

  const params = new URLSearchParams()
  params.set("lessonMode", "1")
  if (config.target) params.set("target", config.target)
  const finalSrc = config.src + (config.src.includes("?") ? "&" : "?") + params.toString()

  // Up-front sizing — set iframe dimensions BEFORE the widget paints,
  // and again on container resize. The widget's natural height ≈ SVG + strip,
  // which we match so nothing clips and there's no postMessage flash.
  useEffect(() => {
    function fit() {
      const ifr = iframeRef.current
      const col = colRef.current
      if (!ifr || !col) return
      const SVG_ASPECT = 480 / 320
      const STRIP = 70
      // chrome (44 + 44 + 56) + section padding (24) + safety = 188
      const RESERVED = 200
      const availableW = col.clientWidth
      const availableH = Math.max(260, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * (availableH - STRIP)
      const w = Math.max(300, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT + STRIP
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (colRef.current) ro.observe(colRef.current)
    window.addEventListener("resize", fit)
    return () => { ro.disconnect(); window.removeEventListener("resize", fit) }
  }, [])

  // Only listen for success — height is fully owned by the React side.
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
    <div className="w-full flex flex-col md:flex-row gap-5 md:gap-7 items-center md:items-stretch">
      {/* manipulative — claims the canvas */}
      <div ref={colRef} className="flex-1 min-w-0 flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={finalSrc}
          loading="lazy"
          className="block"
          style={{ border: 0, background: "transparent" }}
        />
      </div>

      {/* side panel */}
      <aside className="md:w-[300px] shrink-0 flex flex-col gap-4 justify-center">
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug"
          />
        )}
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
