"use client"

import katex from "katex"

/**
 * KaTeX for beat lessons. Every number, unit and symbol a student reads goes
 * through here. Rendered strings are cached because the stage re-renders on
 * every animation frame and labels rarely change between frames.
 */
const cache = new Map<string, string>()

export function texHtml(tex: string): string {
  let html = cache.get(tex)
  if (html === undefined) {
    html = katex.renderToString(tex, { throwOnError: false, output: "html" })
    if (cache.size > 2000) cache.clear()
    cache.set(tex, html)
  }
  return html
}

export function Tex({ tex, className, style }: { tex: string; className?: string; style?: React.CSSProperties }) {
  return <span className={className} style={style} dangerouslySetInnerHTML={{ __html: texHtml(tex) }} />
}

/** A phrase of plain words with $...$ maths inside it. */
export function Phrase({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter(Boolean)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("$") && p.endsWith("$")
          ? <Tex key={i} tex={p.slice(1, -1)} />
          : <span key={i}>{p}</span>,
      )}
    </>
  )
}
