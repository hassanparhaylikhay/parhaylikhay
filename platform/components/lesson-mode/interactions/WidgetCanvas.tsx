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
 * Layout: side-by-side from xl (≥1280px), stacked below. iPad-landscape and
 * small-laptop viewports stack so the manipulative is never squeezed thin
 * next to the 320 px aside. The iframe is sized up-front from window.innerWidth
 * so the widget renders at its right size from initial paint, no flash-then-clip.
 */
type WidgetCanvasProps = InteractionProps<WidgetCanvasConfig> & { onAdvance?: () => void }

export default function WidgetCanvas({ config, onComplete, onAdvance }: WidgetCanvasProps) {
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
  // by the column width that's actually available after the aside takes its
  // 320 px. We read from the PARENT (the outer flex-row div) and subtract
  // the aside reserve explicitly — relying on col.clientWidth alone was
  // unreliable on first paint and let the iframe exceed the slide's max
  // width, pushing the aside off-screen.
  // Compute sizing from window.innerWidth directly. DOM clientWidth reads were
  // unreliable on first paint — sometimes returning a wider value than the flex
  // layout would settle on, letting the iframe push the aside off-screen.
  useEffect(() => {
    function fit() {
      const ifr = iframeRef.current
      if (!ifr) return
      const SVG_ASPECT = 480 / 320
      const RESERVED = 200
      const vw = window.innerWidth
      // App chrome: dashboard sidebar (256 px) appears at md (≥768).
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64                                  // px-8 each side
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide ? 320 + 28 : 0           // panel + gap when side-by-side
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(300, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => { window.removeEventListener("resize", fit) }
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
        // Auto-advance to the next slide after a brief "you got it" pause.
        // The widget locks input on its end (SOLVED check in pointerdown),
        // so the student can savour the success state but can't drag away.
        if (onAdvance) setTimeout(onAdvance, 2800)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [config.widget, onComplete, onAdvance, solved])

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
      <div ref={colRef} className="flex-1 min-w-0 flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={finalSrc}
          loading="lazy"
          className={`block rounded-xl ${solved ? "pl-success-pulse" : ""}`}
          style={{
            background: COLOR.card,
            border: `1px solid ${solved ? COLOR.green : COLOR.border}`,
            transition: "border-color 300ms",
          }}
        />
      </div>

      <aside className="w-full xl:w-[320px] shrink-0 flex flex-col gap-4 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug max-w-full"
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
