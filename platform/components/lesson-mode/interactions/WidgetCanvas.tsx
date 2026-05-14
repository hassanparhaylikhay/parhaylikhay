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
 * `pl-lesson-success` postMessage that the widget fires when the target is met.
 *
 * Layout: widget on the left (desktop) or top (mobile). Prompt + status on the
 * right (desktop) or below (mobile). Side-by-side from md (768px) up, so iPad
 * landscape and small laptops also get the dominant-canvas feel.
 */
export default function WidgetCanvas({ config, onComplete }: InteractionProps<WidgetCanvasConfig>) {
  const [solved, setSolved] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const params = new URLSearchParams()
  params.set("lessonMode", "1")
  if (config.target) params.set("target", config.target)
  const finalSrc = config.src + (config.src.includes("?") ? "&" : "?") + params.toString()

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (iframeRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        // Hard cap so the slide chrome + side panel stay above the fold on small laptops.
        const cap = Math.max(320, Math.min(window.innerHeight - 220, 540))
        iframeRef.current.style.height = `${Math.min(d.height, cap)}px`
      } else if (d.type === "pl-lesson-success") {
        if (solved) return
        setSolved(true)
        onComplete({ widget: config.widget ?? "unknown", value: d.value })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [config.widget, onComplete, solved])

  return (
    <div className="w-full flex flex-col md:flex-row gap-5 md:gap-7 items-stretch">
      {/* manipulative — claims the canvas */}
      <div className="flex-1 min-w-0 flex items-center">
        <iframe
          ref={iframeRef}
          src={finalSrc}
          loading="lazy"
          className="w-full block"
          style={{ height: 460, border: 0, background: "transparent" }}
        />
      </div>

      {/* side panel */}
      <aside className="md:w-[300px] shrink-0 flex flex-col gap-4 justify-center">
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug"
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
            className="text-[15px] sm:text-[16px] leading-relaxed"
            style={{ color: solved ? COLOR.green : COLOR.text }}
          />
        </div>
      </aside>
    </div>
  )
}
