"use client"

import React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkMath from "remark-math"
import remarkGfm from "remark-gfm"
import rehypeKatex from "rehype-katex"
import rehypeRaw from "rehype-raw"
import katex from "katex"
import "katex/dist/katex.min.css"

// ─────────────────────────────────────────────────────────────
// Markdown preprocessor — turns editorial patterns into styled HTML.
// Applied to the raw markdown string before parsing, so existing
// lesson.md files work with zero changes.
// ─────────────────────────────────────────────────────────────

function preprocess(md: string): string {
  let out = md

  // Common-mistakes list: wrap the bullets after a "## Common mistakes" or
  // "## Common mistakes and exam traps" heading in a .mistake-list container.
  // CSS renders each <li> with a pink left border (no icon).
  out = out.replace(
    /^(## Common mistakes(?: and exam traps)?\n\n)((?:- [^\n]+\n?)+)/gm,
    (_m, heading: string, bullets: string) =>
      `${heading}<div class="mistake-list">\n\n${bullets}\n</div>\n\n`,
  )

  // Worked-example card: wrap everything from "## Worked example [N][: TITLE]"
  // through "Full marks $= N$." in a bordered container with its own header
  // pill and footer chip. Runs first so the "Full marks" inside becomes the
  // card foot and doesn't leak to the standalone chip transform below.
  out = out.replace(
    /^## Worked example(?: *(\d+))?([^\n]*)\n([\s\S]*?)^Full marks \$= (\d+)\$\.\s*/gm,
    (_m, num: string | undefined, rest: string, body: string, marks: string) => {
      const n = (num || "1").padStart(2, "0")
      const headingText =
        (num ? `Worked example ${num}` : "Worked example") + (rest || "")
      const marksLabel = marks === "1" ? "mark" : "marks"
      return (
        `<div class="we-card">\n\n` +
        `<div class="we-card-head">` +
          `<div class="we-card-meta"><span class="pill-status pill-status--ex">EX ${n}</span><span class="pill-status pill-status--marks">${marks} ${marksLabel.toUpperCase()}</span></div>` +
          `<p class="we-card-heading">${headingText}</p>` +
        `</div>\n\n` +
        `${body.trim()}\n\n` +
        `<div class="we-card-foot"><span class="pill-semantic pill-semantic--success">Full marks · ${marks}</span></div>\n\n` +
        `</div>\n\n`
      )
    },
  )

  // **Step N: title.** at start of paragraph → numbered chip + bold title.
  // Step numbers are BLUE (methodical / scaffolding meaning).
  out = out.replace(
    /\*\*Step\s+(\d+)[:.]\s+([^*]+?)\*\*/g,
    (_full, n: string, title: string) =>
      `<span class="we-step-num">${n}</span><b>${title.trim()}</b>`,
  )

  // **Answer:** ... → green ANSWER pill (semantic / success)
  out = out.replace(
    /\*\*Answer:\*\*/g,
    '<span class="pill-semantic pill-semantic--success">ANSWER</span>',
  )

  // **Working.** → green WORKING pill
  out = out.replace(
    /\*\*Working\.\*\*/g,
    '<span class="pill-semantic pill-semantic--success">WORKING</span>',
  )

  // Mark-scheme annotations like [M1 for ...], [B1], [B1 for X; A1 for Y]
  // become a right-aligned cluster of unified green pills. Multiple codes
  // separated by ";" inside one bracket each become their own pill.
  out = out.replace(
    /(?:\s*\[(?:(?:M|B|A)\d)(?:[^\]]*)\])+/g,
    (full) => {
      const brackets = [...full.matchAll(/\[((?:M|B|A)\d)([^\]]*)\]/g)]
      const pills: string[] = []
      for (const [, firstCode, firstRest] of brackets) {
        // Split inside the bracket on ";" — each fragment may start with its
        // own M1/B1/A1 code, otherwise it continues the previous code.
        const parts = (firstCode + firstRest).split(/\s*;\s*/)
        for (const part of parts) {
          const m = part.match(/^((?:M|B|A)\d)\b\s*(.*)$/)
          if (!m) continue
          const code = m[1]
          const body = m[2].trim()
          pills.push(
            `<span class="pill-semantic pill-semantic--mark"><b>${code}</b>${body ? ` ${body}` : ""}</span>`,
          )
        }
      }
      return ` <span class="we-marks">${pills.join("")}</span>`
    },
  )

  // Any stray Full marks = N at the start of a line (outside a WE card) → chip
  out = out.replace(
    /^Full marks \$= (\d+)\$\.(\s*)/gm,
    (_, n: string) =>
      `<span class="pill-semantic pill-semantic--success">Full marks · ${n}</span>\n\n`,
  )

  // Past paper references: s25_13, w25_22, s24_21, etc. → status pill (paper)
  out = out.replace(
    /\b([sw]\d{2}_\d{2})(\s+Q\d+(?:\([a-z](?:\)\([ivx]+\))?\))?)?/g,
    (_full, code: string, ref: string | undefined) =>
      `<span class="pill-status pill-status--paper">${code}${ref || ""}</span>`,
  )

  return out
}

// ─────────────────────────────────────────────────────────────
// Section headers — H2 renders plain (visual separation comes from
// CSS: thin divider 64px above + 24px below before content).
// ─────────────────────────────────────────────────────────────

function toText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map(c => (typeof c === "string" ? c : typeof c === "number" ? String(c) : ""))
    .join("")
    .trim()
}

const components: Components = {
  h3({ children }) {
    const text = toText(children)
    const m = text.match(/^Example\s+(\d+)\s*[—\-–]\s*(.+?)(?:\s*\((.+)\))?$/)
    if (m) {
      const [, num, title, flavour] = m
      return (
        <div className="example-h3">
          <span className="pill-status pill-status--ex">EX {num.padStart(2, "0")}</span>
          <div className="example-titles">
            <h3>{title}</h3>
            {flavour && <span className="example-flavour">{flavour}</span>}
          </div>
        </div>
      )
    }
    return <h3>{children}</h3>
  },
}

// ─────────────────────────────────────────────────────────────
// Post-render KaTeX pass — renders \(...\) and \[...\] delimiters
// that appear inside raw HTML diagrams (remark-math only sees
// markdown text nodes, not content inside raw HTML blocks).
// ─────────────────────────────────────────────────────────────

function renderMathInNode(root: HTMLElement) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      // Skip nodes already rendered by KaTeX (or inside code/script/style)
      if (p.closest(".katex, code, pre, script, style")) return NodeFilter.FILTER_REJECT
      return /\\[([]/.test(node.nodeValue || "") ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
    },
  })

  const targets: Text[] = []
  let n: Node | null
  while ((n = walker.nextNode())) targets.push(n as Text)

  const re = /\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g
  for (const textNode of targets) {
    const text = textNode.nodeValue || ""
    re.lastIndex = 0
    if (!re.test(text)) continue
    re.lastIndex = 0

    const frag = document.createDocumentFragment()
    let last = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text))) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)))
      const tex = m[1] ?? m[2]
      const display = m[2] !== undefined
      const span = document.createElement("span")
      try {
        katex.render(tex, span, { displayMode: display, throwOnError: false, output: "html" })
      } catch {
        span.textContent = m[0]
      }
      frag.appendChild(span)
      last = m.index + m[0].length
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)))
    textNode.parentNode?.replaceChild(frag, textNode)
  }
}

export default function LessonBody({ markdown }: { markdown: string }) {
  const processed = React.useMemo(() => preprocess(markdown), [markdown])
  const rootRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (rootRef.current) renderMathInNode(rootRef.current)
  }, [processed])

  return (
    <div className="lesson-prose" ref={rootRef}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
        components={components}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
