"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import katex from "katex"
import { CanvasLabels, type CanvasLabel } from "./interactions/_shared"
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
  if (spec.kind === "html")   return <HtmlVisual content={spec.content} labels={spec.labels} />
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
  // Widgets whose lesson-mode rendering includes visible chrome below the
  // SVG (step-explorers — prev/next, footer text) opt in via ?chrome=1 in
  // the iframe URL. That's a STABLE signal we can read once. The previous
  // attempt to detect via reportedHeight caused a feedback loop: setting
  // a smaller width changed the widget's reported height, which re-
  // triggered the detection, which set yet another size.
  const hasChrome = /[?&]chrome=1\b/.test(src)
  // For chrome widgets we also listen for pl-widget-resize and use the
  // reported total height instead of aspect-fit.
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

      const widthByHeight = SVG_ASPECT * availableH
      const aspectW = Math.max(320, Math.min(availableW, widthByHeight))
      const aspectH = aspectW / SVG_ASPECT

      let w: number
      let h: number
      if (hasChrome) {
        // Step-explorer-style: cap width at 720 so the SVG + chrome below
        // don't blow past the slide-frame bottom on wide viewports. Use
        // the widget's reported height when it arrives; until then start
        // at aspect-fit height plus a small chrome estimate so the
        // controls don't briefly clip on the first paint.
        w = Math.max(320, Math.min(availableW, 720))
        const estimatedChrome = 130
        h = reportedHeight != null
          ? Math.min(reportedHeight, availableH)
          : Math.min(w / SVG_ASPECT + estimatedChrome, availableH)
      } else {
        // SVG-only widget (free-explore in lesson mode). Reported height
        // matches aspect-fit, so we just use aspect-fit and ignore the
        // postMessage entirely — no resize when it arrives.
        w = aspectW
        h = aspectH
      }
      ifr.style.width  = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => { window.removeEventListener("resize", fit) }
  }, [reportedHeight, hasChrome])

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

function HtmlVisual({ content, labels }: { content: string; labels?: CanvasLabel[] }) {
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
  // A 480x320 diagram with width:100% took the whole 1200px column and came
  // out 800px tall, which pushed the slide past the viewport. Cap it against
  // the viewport height as well, so the figure fits next to a title, a
  // paragraph and a button without the student ever scrolling.
  const isDiagram = /<svg[^>]*viewBox=['"]0 0 480 320/.test(content)
  return (
    <div
      ref={ref}
      className="relative w-full mx-auto"
      style={{
        containerType: "inline-size",
        ...(isDiagram
          ? {
              aspectRatio: "480 / 320",
              maxHeight: "calc(100dvh - 360px)",
              maxWidth: "calc((100dvh - 360px) * 1.5)",
            }
          : null),
      }}
    >
      <div className={isDiagram ? "w-full h-full" : undefined} dangerouslySetInnerHTML={{ __html: content }} />
      <CanvasLabels labels={labels} />
    </div>
  )
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
