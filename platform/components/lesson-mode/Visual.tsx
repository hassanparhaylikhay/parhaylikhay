"use client"

import { useEffect, useRef } from "react"
import katex from "katex"
import type { VisualSpec } from "@/lib/lesson-mode/types"

/**
 * Visual — renders a VisualSpec union. Used by hook / concept / recap / examLink slides.
 */
export default function Visual({ spec }: { spec: VisualSpec }) {
  if (spec.kind === "iframe") return <IframeVisual src={spec.src} height={spec.height ?? 480} />
  if (spec.kind === "html")   return <HtmlVisual content={spec.content} />
  if (spec.kind === "katex")  return <KatexVisual tex={spec.tex} display={spec.display !== false} />
  if (spec.kind === "shape")  return <ShapeVisual svg={spec.svg} />
  if (spec.kind === "stack")  return (
    <div className="flex flex-col items-center" style={{ gap: spec.gap ?? 16 }}>
      {spec.children.map((c, i) => <Visual key={i} spec={c} />)}
    </div>
  )
  if (spec.kind === "row")    return (
    <div className="flex items-center justify-center flex-wrap" style={{ gap: spec.gap ?? 16 }}>
      {spec.children.map((c, i) => <Visual key={i} spec={c} />)}
    </div>
  )
  return null
}

function IframeVisual({ src, height }: { src: string; height: number }) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const data = e.data
      if (data?.type === "pl-widget-resize" && ref.current?.contentWindow === e.source) {
        // Cap so the slide chrome + understood button stay visible without scroll.
        const cap = Math.max(360, Math.min(window.innerHeight - 280, 520))
        ref.current.style.height = `${Math.min(data.height, cap)}px`
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])
  return (
    <iframe
      ref={ref}
      src={src}
      loading="lazy"
      className="w-full max-w-[820px] border-0 rounded-lg block mx-auto"
      style={{ height, background: "transparent" }}
    />
  )
}

function HtmlVisual({ content }: { content: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // post-render KaTeX walker for any \(...\) in the raw HTML
  useEffect(() => {
    if (!ref.current) return
    const walker = document.createTreeWalker(ref.current, NodeFilter.SHOW_TEXT)
    const re = /\\\((.+?)\\\)|\\\[(.+?)\\\]/g
    const toReplace: Array<{ node: Text; html: string }> = []
    let n: Node | null
    while ((n = walker.nextNode())) {
      const txt = (n as Text).nodeValue ?? ""
      if (!re.test(txt)) continue
      re.lastIndex = 0
      const html = txt.replace(re, (_m, inline, display) => {
        try {
          return katex.renderToString(inline ?? display, {
            throwOnError: false,
            displayMode: !!display,
            output: "html",
          })
        } catch { return _m }
      })
      toReplace.push({ node: n as Text, html })
    }
    for (const { node, html } of toReplace) {
      const wrapper = document.createElement("span")
      wrapper.innerHTML = html
      node.parentNode?.replaceChild(wrapper, node)
    }
  }, [content])
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: content }} />
}

function KatexVisual({ tex, display }: { tex: string; display: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(tex, ref.current, { throwOnError: false, displayMode: display, output: "html" })
    } catch {
      if (ref.current) ref.current.textContent = tex
    }
  }, [tex, display])
  return <div ref={ref} className="text-[#f0eeea]" />
}

function ShapeVisual({ svg }: { svg: string }) {
  return <div dangerouslySetInnerHTML={{ __html: svg }} />
}
