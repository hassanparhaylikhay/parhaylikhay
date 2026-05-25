"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
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
  // If the embedded widget reports its own height via pl-widget-resize, we
  // use that instead of the default 480/320 aspect — step-explorer widgets
  // have visible chrome (controls + footer) that pushes total height past
  // the SVG aspect, and we need to grow the iframe so nothing clips.
  const [reportedHeight, setReportedHeight] = useState<number | null>(null)

  // useLayoutEffect runs synchronously after DOM commit, BEFORE the browser
  // paints — so the iframe never flashes at the browser-default 300x150
  // before our explicit dimensions kick in.
  //
  // We size from window.innerWidth (computing the aside reserve ourselves)
  // instead of reading wrap.clientWidth. Reading clientWidth is race-prone:
  // on initial layout the wrap can briefly be the full row width before
  // the aside settles into its 320px slot, then ResizeObserver fires and
  // the iframe shrinks visibly ~250ms after load.
  useLayoutEffect(() => {
    function fit() {
      const ifr = internalRef.current
      if (!ifr) return
      const SVG_ASPECT = 480 / 320
      // App chrome reserves: SlideFrame top (44) + bottom (56) + padding etc.
      const RESERVED = 200
      const vw = window.innerWidth
      // Dashboard sidebar (256px) appears at md+ on the topic page chrome.
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64                                  // px-8 each side
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide ? 320 + 28 : 0           // panel + gap
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(280, window.innerHeight - RESERVED)

      // Single width formula whether or not the widget has reported its
      // natural height yet. Before, the aspect-fit path used availableW
      // (up to ~852px on wide screens) while the reportedHeight path
      // capped at 720 — so when the widget's pl-widget-resize arrived
      // ~200ms after load, the iframe visibly snapped narrower. Free-
      // explore widgets in lesson mode hid all their chrome, so the
      // reported height roughly matched the aspect-fit height anyway —
      // only the width was changing, which read as the "starts bigger,
      // shrinks abruptly" bug.
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      // Height: use the widget's report when present (step-explorers
      // need extra room for their chrome below the SVG); otherwise the
      // pure aspect-fit height.
      const h = reportedHeight != null
        ? Math.min(reportedHeight, availableH)
        : w / SVG_ASPECT
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => { window.removeEventListener("resize", fit) }
  }, [reportedHeight])

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (internalRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        setReportedHeight(Math.max(280, Math.min(900, Math.round(d.height))))
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
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
