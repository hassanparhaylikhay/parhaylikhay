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

  // Worked-example card.
  //
  // Authors typically bundle every M1/B1/A1 code at the end of the answer
  // line, e.g. `**[B1 for X; B1 for Y; A1 for Z]**`. We want them
  // distributed visually across the steps that earn them.
  //
  // Distribution rule (per annotation):
  //   * LAST code → the line the annotation was on (typically the answer).
  //     This is almost always the A1 / final-answer mark, but if the
  //     annotation is just `[B1]` for a 1-mark single-part question, the
  //     B1 stays on its home line — exactly where the user wrote it.
  //   * Earlier codes → step lines BEFORE the annotation, in source order
  //     (B1#1 → Step 1, B1#2 → Step 2, …). If there are more codes than
  //     steps, the extras pile up on the home line beside the last code.
  //
  // The mark-cluster regex later prepends each line's codes as a
  // float-right cluster, so the marks visually align with the line that
  // earned them.
  out = out.replace(
    /^## Worked example(?: *(\d+))?([^\n]*)\n([\s\S]*?)^Full marks \$= (\d+)\$\.\s*/gm,
    (_m, num: string | undefined, rest: string, body: string, marks: string) => {
      const n = (num || "1").padStart(2, "0")
      const headingText =
        (num ? `Worked example ${num}` : "Worked example") + (rest || "")
      const marksLabel = marks === "1" ? "MARK" : "MARKS"

      const lines = body.split("\n")
      const lineMarks: Record<number, string[]> = {}
      const annotationRe = /\*\*\s*((?:\[(?:M|B|A)\d(?:[^\]]*)\]\s*)+)\*\*/

      // Find all step lines, in order.
      const stepLineIdx: number[] = []
      lines.forEach((line, i) => {
        if (/^\*\*Step\s+\d+/.test(line)) stepLineIdx.push(i)
      })
      let stepCursor = 0

      // Process each annotation in source order.
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const match = line.match(annotationRe)
        if (!match) continue

        // Parse codes from the annotation.
        const brackets = [...match[1].matchAll(/\[((?:M|B|A)\d)([^\]]*)\]/g)]
        const codes: string[] = []
        for (const [, firstCode, firstRest] of brackets) {
          const parts = (firstCode + firstRest).split(/\s*;\s*/)
          for (const part of parts) {
            const cm = part.match(/^((?:M|B|A)\d)\b/)
            if (cm) codes.push(cm[1])
          }
        }
        if (codes.length === 0) continue

        // Strip the annotation from this line; we'll re-attach codes below.
        lines[i] = line.replace(annotationRe, "").replace(/\s+$/, "").replace(/\s+(?=[.!?])/g, "")

        // Distribute: LAST code stays on the home line; earlier codes flow
        // to step lines BEFORE this line, one per step in source order.
        // If there are more codes than steps, extras pile up on home.
        const homeIdx = i
        const lastCode = codes[codes.length - 1]
        const earlier = codes.slice(0, -1)

        for (const code of earlier) {
          // Find the next available step strictly before the home line.
          while (stepCursor < stepLineIdx.length && stepLineIdx[stepCursor] >= homeIdx) {
            stepCursor++
          }
          let target = homeIdx
          if (stepCursor < stepLineIdx.length) {
            target = stepLineIdx[stepCursor]
            stepCursor++
          }
          if (!lineMarks[target]) lineMarks[target] = []
          lineMarks[target].push(code)
        }
        // Last code → home line (typically the answer).
        if (!lineMarks[homeIdx]) lineMarks[homeIdx] = []
        lineMarks[homeIdx].push(lastCode)
      }

      // Re-insert codes as ONE **[code1] [code2] ...** annotation per line.
      // Single bold pair so the mark-cluster regex below picks up all codes
      // in one match — otherwise only the first pair becomes a pill cluster
      // and the rest leak as literal text.
      const newLines = lines.map((line, i) => {
        const codes = lineMarks[i]
        if (!codes) return line
        const annotation = " **" + codes.map(c => `[${c}]`).join(" ") + "**"
        return line.replace(/\s+$/, "") + annotation
      })
      const cleanBody = newLines
        .join("\n")
        .replace(/\n[ \t]*\n[ \t]*\n+/g, "\n\n")

      return (
        `<div class="we-card">\n\n` +
        `<div class="we-card-head">` +
          `<div class="we-card-meta"><span class="pill-status pill-status--ex">EX ${n}</span><span class="pill-status pill-status--marks">${marks} ${marksLabel}</span></div>` +
          `<p class="we-card-heading">${headingText}</p>` +
        `</div>\n\n` +
        `${cleanBody.trim()}\n\n` +
        `<div class="we-card-foot"><span class="pill-semantic pill-semantic--info">Full marks · ${marks}</span></div>\n\n` +
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

  // **Answer:** → strip. The boxed value that follows is itself the
  // answer indicator (rendered green via the global .boxed style).
  out = out.replace(/\*\*Answer:\*\*\s*/g, "")

  // **Working.** → green WORKING pill
  out = out.replace(
    /\*\*Working\.\*\*/g,
    '<span class="pill-semantic pill-semantic--success">WORKING</span>',
  )

  // Mark-scheme annotations: **[M1 for ...]**, **[B1]**, **[B1 ...; A1 ...]**.
  // Strip the bracketed annotation from wherever it sits in the paragraph,
  // and PREPEND a compact mark cluster to the start of that paragraph.
  // Inside a worked-example card the cluster is float:right, so each step's
  // marks sit at the right edge of that step's line — vertically aligned
  // with the corresponding working below.
  // Operates per-line (one paragraph per line in our markdown), so each
  // step gets its own correctly-placed cluster.
  out = out.replace(
    /^([^\n]*?)\*\*\s*((?:\[(?:M|B|A)\d(?:[^\]]*)\]\s*)+)\*\*([^\n]*)$/gm,
    (full, before: string, group: string, after: string) => {
      const brackets = [...group.matchAll(/\[((?:M|B|A)\d)([^\]]*)\]/g)]
      const codes: string[] = []
      for (const [, firstCode, firstRest] of brackets) {
        const parts = (firstCode + firstRest).split(/\s*;\s*/)
        for (const part of parts) {
          const m = part.match(/^((?:M|B|A)\d)\b/)
          if (m) codes.push(m[1])
        }
      }
      if (codes.length === 0) return full
      const pills = codes
        .map(c => `<span class="pill-semantic pill-semantic--mark">${c}</span>`)
        .join("")
      // Prepend cluster, then the rest of the line with the bracket gone.
      // Trim a trailing space left over from joining `before` + `after`.
      const rest = (before + after).replace(/\s+$/, "")
      return `<span class="we-marks">${pills}</span>${rest}`
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
    if (!rootRef.current) return
    renderMathInNode(rootRef.current)
    // KaTeX renders \boxed{X} as a `.fbox` border element + the content
    // X positioned alongside it inside a `.vlist`. Neither inherits a
    // class we can use directly. Walk every `.fbox` and tag its closest
    // `.katex` ancestor so CSS can colour the whole boxed expression
    // green (border, text, background).
    rootRef.current.querySelectorAll(".katex .fbox").forEach(fbox => {
      const katex = fbox.closest(".katex")
      if (katex) katex.classList.add("has-boxed-answer")
    })
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
