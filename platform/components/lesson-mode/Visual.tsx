"use client"

import { useEffect, useRef } from "react"
import katex from "katex"
import type { VisualSpec } from "@/lib/lesson-mode/types"

/**
 * Visual — renders a VisualSpec union. Used by hook / concept / recap / examLink slides.
 * iframeRef is optional; concept slides pass it through so they can listen for the
 * widget's pl-lesson-readout postMessage.
 */
export default function Visual({
  spec,
  iframeRef,
}: {
  spec: VisualSpec
  iframeRef?: React.RefObject<HTMLIFrameElement | null>
}) {
  if (spec.kind === "iframe") return <IframeVisual src={spec.src} externalRef={iframeRef} />
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

function IframeVisual({
  src,
  externalRef,
}: {
  src: string
  externalRef?: React.RefObject<HTMLIFrameElement | null>
}) {
  const internalRef = useRef<HTMLIFrameElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function fit() {
      const ifr = internalRef.current
      const wrap = wrapRef.current
      if (!ifr || !wrap) return
      // In lesson mode the widget's internal strip is hidden, so the iframe
      // hosts the SVG only. Pure aspect-ratio fit: width = min(containerW,
      // 1.5 × availableHeight). Height = width / 1.5.
      const SVG_ASPECT = 480 / 320
      // chrome (44 + 44 + 56) + section padding (24) + safety = 180
      const RESERVED = 200
      const availableW = wrap.clientWidth
      const availableH = Math.max(280, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    const ro = new ResizeObserver(fit)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener("resize", fit)
    return () => { ro.disconnect(); window.removeEventListener("resize", fit) }
  }, [])

  function setRefs(el: HTMLIFrameElement | null) {
    internalRef.current = el
    if (externalRef) externalRef.current = el
  }

  return (
    <div ref={wrapRef} className="w-full flex justify-center">
      <iframe
        ref={setRefs}
        src={src}
        loading="lazy"
        className="block rounded-xl"
        style={{ background: "#0b1118", border: "1px solid #141e2a" }}
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
