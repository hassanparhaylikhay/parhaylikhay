"use client"

import { useEffect, useState } from "react"
import styles from "../try.module.css"

/**
 * DragHint — a single small downward-pointing arrow that bobs over the
 * top of a widget container as a quiet "this is interactive" cue.
 * Auto-fades after a few seconds, or can be force-hidden via `hidden`
 * once the host detects the visitor has interacted.
 *
 * The parent element must be position:relative.
 */
type Props = {
  /** Brand accent for the arrow stroke. Default brand yellow. */
  accent?: string
  /** Auto-fade timeout. */
  duration?: number
  /** Force-hide (e.g. visitor has already touched the widget). */
  hidden?: boolean
}

export default function DragHint({ accent = "#fff067", duration = 6000, hidden }: Props) {
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), duration)
    return () => clearTimeout(t)
  }, [duration])
  const visible = !hidden && !timedOut

  return (
    <div
      className={`${styles.pointerHint} absolute top-2 left-1/2 z-20 pointer-events-none`}
      style={{
        opacity: visible ? 0.7 : 0,
        transition: "opacity 700ms cubic-bezier(0.16,1,0.3,1)",
        color: accent,
      }}
      aria-hidden
    >
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3 L9 17 M3 11 L9 17 L15 11" />
      </svg>
    </div>
  )
}
