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

  // [M1 for xyz], [B2 for ...], [A1 — both correct] → mark pills
  // Letter classes: M → blue, B → yellow, A → green
  out = out.replace(
    /\[((?:M|B|A)\d)(\s+[^\]]+)?\]/g,
    (_full, code: string, rest: string | undefined) => {
      const letter = code[0].toLowerCase() // m | b | a
      const body = rest ? rest.trim() : ""
      return `<span class="mark-pill mark-${letter}"><b>${code}</b>${body ? ` ${body}` : ""}</span>`
    },
  )

  // **Working.** → a small green chip preceding the paragraph
  out = out.replace(/\*\*Working\.\*\*/g, '<span class="working-chip">Working</span>')

  // Full marks = N at the start of a line → accent chip
  out = out.replace(
    /^Full marks \$= (\d+)\$\.(\s*)/gm,
    (_, n: string) => `<span class="full-marks-chip">Full marks · ${n}</span>\n\n`,
  )

  // Past paper references: s25_13, w25_22, s24_21, etc. → monospace tint
  // Match e.g. "s25_13 Q11" or just "w25_22 Q14(a)" — but only when clearly a paper code
  out = out.replace(
    /\b([sw]\d{2}_\d{2})(\s+Q\d+(?:\([a-z](?:\)\([ivx]+\))?\))?)?/g,
    (_full, code: string, ref: string | undefined) =>
      `<span class="paper-ref">${code}${ref || ""}</span>`,
  )

  return out
}

// ─────────────────────────────────────────────────────────────
// Section header metadata — maps H2 text to section number and colour.
// ─────────────────────────────────────────────────────────────

type SectionMeta = { num: string; color: string }
const SECTION_META: Record<string, SectionMeta> = {
  "Why this matters":                { num: "01", color: "#fff067" },
  "The core idea":                   { num: "02", color: "#00abfa" },
  "The mathematics":                 { num: "03", color: "#00abfa" },
  "Worked examples":                 { num: "04", color: "#0fee89" },
  "How Cambridge marks this":        { num: "05", color: "#ff4670" },
  "Common mistakes and exam traps":  { num: "06", color: "#ff822c" },
  "Try it yourself":                 { num: "07", color: "#00abfa" },
  "Quick summary":                   { num: "08", color: "#fff067" },
}

// Extract plain text from ReactMarkdown's children prop (may be nodes)
function toText(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map(c => (typeof c === "string" ? c : typeof c === "number" ? String(c) : ""))
    .join("")
    .trim()
}

const components: Components = {
  h2({ children }) {
    const text = toText(children)
    const meta = SECTION_META[text]
    if (!meta) return <h2>{children}</h2>
    return (
      <div className="section-h2">
        <div className="section-kicker">
          <span className="section-num">{meta.num}</span>
          <span className="section-dash" style={{ background: meta.color }} />
          <span className="section-eyebrow">SECTION</span>
        </div>
        <h2 className="section-title">{text}</h2>
      </div>
    )
  },

  h3({ children }) {
    const text = toText(children)
    const m = text.match(/^Example\s+(\d+)\s*[—\-–]\s*(.+?)(?:\s*\((.+)\))?$/)
    if (m) {
      const [, num, title, flavour] = m
      return (
        <div className="example-h3">
          <span className="example-num">EX {num.padStart(2, "0")}</span>
          <div className="example-titles">
            <h3>{title}</h3>
            {flavour && <span className="example-flavour">{flavour}</span>}
          </div>
        </div>
      )
    }
    // "Mistake 1: ..." pattern in the Common mistakes section (it's h3 material
    // even though we authored it as bold paragraphs). Keep normal h3 otherwise.
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
