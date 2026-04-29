"use client"

import { useEffect, useRef, useState } from "react"

export default function WidgetFrame({
  src,
  title,
  initialHeight = 600,
}: {
  src: string
  title: string
  initialHeight?: number
}) {
  const [height, setHeight] = useState(initialHeight)
  const ref = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== ref.current?.contentWindow) return
      const data = e.data as { type?: string; height?: number } | undefined
      if (data?.type === "pl-widget-resize" && typeof data.height === "number") {
        // Add a few px of padding so nothing is clipped
        setHeight(Math.max(data.height + 8, 300))
      }
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [])

  return (
    <div className="my-8 rounded-xl border border-[#141e2a] overflow-hidden bg-[#07090d]">
      <iframe
        ref={ref}
        src={src}
        className="w-full block"
        style={{ height, border: 0 }}
        title={title}
      />
    </div>
  )
}
