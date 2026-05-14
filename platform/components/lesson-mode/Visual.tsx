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
  const wrapRef = useRef<HTMLDivElement | null>(null)
  // Suppress unused — height is now derived from container size, not the prop.
  void height

  useEffect(() => {
    function fit() {
      const ifr = ref.current
      const wrap = wrapRef.current
      if (!ifr || !wrap) return
      // Transformation widgets are SVG viewBox 480x320 (aspect 1.5) plus a
      // vector / mark-scheme strip below (~70px in lesson mode). We size the
      // iframe so the widget's intrinsic height fits exactly — no clipping,
      // no postMessage-after-load flash.
      const SVG_ASPECT = 480 / 320
      const STRIP = 70
      // chrome only: brand bar 44 + progress 44 + nav 56 + section padding 24
      // + safety = 200. The slide layout puts title/prompt/button in a side
      // panel beside the manipulative, so they don't eat the vertical budget.
      const RESERVED = 200
      const availableW = wrap.clientWidth
      const availableH = Math.max(320, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * (availableH - STRIP)
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT + STRIP
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener("resize", fit)
    return () => { ro.disconnect(); window.removeEventListener("resize", fit) }
  }, [])

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <iframe
        ref={ref}
        src={src}
        loading="lazy"
        className="block"
        style={{ border: 0, background: "transparent" }}
      />
    </div>
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
