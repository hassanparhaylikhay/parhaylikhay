"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import { COLOR } from "@/components/lesson-mode/interactions/_shared"

/**
 * WidgetFrame — embeds a production widget iframe inside the same card
 * shell the Lesson Mode runner uses. The widget is the demo's main
 * value-prop visual, so the chrome around it matches the real platform
 * exactly: same border, same surface colour, same green success pulse.
 *
 * Listens for `pl-lesson-success` from the widget (only meaningful in
 * lesson-mode puzzles) and for `pl-widget-resize` (when the widget
 * itself reports an intrinsic height). For demo embeds we drive height
 * from window.innerWidth math instead, so the canvas is always sized
 * to the visible viewport on first paint — no flash-then-clip.
 */
type Props = {
  src: string
  /** Aspect ratio width/height for the iframe. Widgets use 1.5 (480×320 SVG). */
  aspect?: number
  /** Caps the iframe width regardless of column width — keeps the demo from
   *  going edge to edge on ultra-wide monitors. */
  maxWidth?: number
  /** When true, brighten the border slightly on first user interaction. */
  highlightOnInteract?: boolean
  /** Optional success callback when the widget posts pl-lesson-success. */
  onSolved?: (value: unknown) => void
  className?: string
  style?: CSSProperties
  /** Optional title for accessibility. */
  title?: string
}

export default function WidgetFrame({
  src,
  aspect = 1.5,
  maxWidth = 960,
  highlightOnInteract,
  onSolved,
  className,
  style,
  title = "Interactive widget",
}: Props) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const [solved, setSolved] = useState(false)
  const [active, setActive] = useState(false)

  // Up-front sizing from window.innerWidth — matches the Lesson Mode
  // sizing helper in WidgetCanvas. No DOM clientWidth reads.
  useEffect(() => {
    function fit() {
      const ifr = ref.current
      if (!ifr) return
      const RESERVED = 220
      const vw = window.innerWidth
      const SLIDE_PAD = 48
      const availW = Math.min(vw - SLIDE_PAD, maxWidth)
      const availH = Math.max(320, window.innerHeight - RESERVED)
      const widthByHeight = aspect * availH
      const w = Math.max(320, Math.min(availW, widthByHeight))
      const h = w / aspect
      ifr.style.width = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [aspect, maxWidth])

  // Lesson-mode success + activity messages.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (ref.current?.contentWindow !== e.source) return
      if (d.type === "pl-lesson-success" && !solved) {
        setSolved(true)
        onSolved?.(d.value)
      }
      if (d.type === "pl-lesson-readout" || d.type === "pl-widget-resize") {
        // Treat ANY message from the widget as "the visitor is engaging"
        // so the highlight kicks in even before they solve anything.
        if (!active) setActive(true)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [solved, active, onSolved])

  const border = solved
    ? "rgba(15,238,137,0.9)"
    : active && highlightOnInteract
      ? "rgba(0,171,250,0.5)"
      : COLOR.border

  return (
    <div className="flex items-center justify-center w-full">
      <iframe
        ref={ref}
        src={src}
        title={title}
        loading="lazy"
        className={`block rounded-xl ${solved ? "pl-success-pulse" : ""} ${className ?? ""}`}
        style={{
          background: COLOR.card,
          border: `1px solid ${border}`,
          transition: "border-color 400ms cubic-bezier(0.16,1,0.3,1)",
          ...style,
        }}
      />
    </div>
  )
}
