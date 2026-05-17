"use client"

import { useEffect, useRef, useState, type RefObject } from "react"
import katex from "katex"

/**
 * Common bits used by every interaction component.
 */

export type InteractionProps<Config = Record<string, unknown>> = {
  config: Config
  savedData?: Record<string, unknown>
  onComplete: (data?: Record<string, unknown>) => void
}

/** Brand colours, single source of truth across all interactions. */
export const COLOR = {
  bg:       "#07090d",
  card:     "#0b1118",
  border:   "#141e2a",
  faint:    "#3a4a5a",
  grey:     "#7a7875",
  text:     "#c8c6be",
  white:    "#f0eeea",
  blue:     "#00abfa",
  yellow:   "#fff067",
  orange:   "#ff822c",
  green:    "#0fee89",
  pink:     "#ff4670",
  grid:     "#1a3350",
}

/**
 * MixedText — renders a string that may contain inline $...$ KaTeX. Drop-in for
 * any user-facing label, prompt, success message, or option text. Catches both
 * single-dollar inline math and plain prose in the same render pass.
 */
export function MixedText({
  text,
  className,
  style,
}: {
  text: string | undefined | null
  className?: string
  style?: React.CSSProperties
}) {
  if (!text) return null
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <span className={className} style={style}>
      {parts.map((p, i) => {
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          try {
            const html = katex.renderToString(p.slice(1, -1), {
              throwOnError: false,
              displayMode: false,
              output: "html",
            })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
          } catch {
            return <span key={i}>{p}</span>
          }
        }
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}

/**
 * The single instructional sentence above each interaction's canvas.
 * Big, soft-white, centered. Inline math via MixedText.
 */
export function Prompt({ children }: { children: React.ReactNode }) {
  if (!children) return null
  if (typeof children === "string") {
    return (
      <p className="text-[18px] sm:text-[22px] text-[#c8c6be] leading-snug max-w-[720px] text-center mb-6">
        <MixedText text={children} />
      </p>
    )
  }
  return (
    <p className="text-[18px] sm:text-[22px] text-[#c8c6be] leading-snug max-w-[720px] text-center mb-6">
      {children}
    </p>
  )
}

/**
 * Tiny "show me" + "explain another way" link row that lives just under the
 * interactive canvas. Each is optional.
 */
export function HelperRow({
  showMeLabel = "show me",
  onShowMe,
}: {
  showMeLabel?: string
  onShowMe?: () => void
}) {
  if (!onShowMe) return null
  return (
    <div className="mt-4 flex items-center justify-center">
      <button
        onClick={onShowMe}
        className="text-[11px] font-mono text-[#3a4a5a] hover:text-[#7a7875] transition-colors"
      >
        {showMeLabel}
      </button>
    </div>
  )
}

/**
 * Animated success ring that appears briefly after a correct answer.
 * Caller sets `visible` true; component handles the fade.
 */
export function SuccessFlash({ visible }: { visible: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        boxShadow: visible ? "inset 0 0 0 1px rgba(15,238,137,0.6), 0 0 40px -10px rgba(15,238,137,0.5)" : "none",
      }}
    />
  )
}

/**
 * useWidgetReadout — listens for `pl-lesson-readout` postMessages from the
 * embedded widget and returns the latest { label, tex } pair. Used in the
 * side panel so the column-vector / scale-factor / mirror-equation readout
 * lives next to the prompt, not below the manipulative.
 */
export function useWidgetReadout(iframeRef: RefObject<HTMLIFrameElement | null>): { label: string; tex: string } | null {
  const [state, setState] = useState<{ label: string; tex: string } | null>(null)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (d.type !== "pl-lesson-readout") return
      if (iframeRef.current?.contentWindow !== e.source) return
      setState({ label: String(d.label ?? ""), tex: String(d.tex ?? "") })
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [iframeRef])
  return state
}

/**
 * ReadoutPanel — the side-panel widget showing the live state of the widget
 * (e.g. "column vector  ⟨3, −2⟩"). Renders KaTeX.
 */
export function ReadoutPanel({ readout, solved }: { readout: { label: string; tex: string } | null; solved?: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!ref.current || !readout) return
    try {
      // Inline mode (displayMode: false) lets KaTeX break the line between
      // \text blocks. Display mode produced one unbreakable inline-block that
      // overflowed the 320 px side panel when the readout was long.
      katex.render(readout.tex, ref.current, { throwOnError: false, displayMode: false, output: "html" })
    } catch {
      if (ref.current) ref.current.textContent = readout.tex
    }
  }, [readout])
  if (!readout) return null
  return (
    <div
      className="rounded-lg border px-4 py-3 transition-colors duration-300"
      style={{
        borderColor: solved ? "rgba(15,238,137,0.45)" : COLOR.border,
        background: solved ? "rgba(15,238,137,0.05)" : "transparent",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
      }}
    >
      <p
        className="text-[10.5px] font-mono uppercase tracking-[2px] mb-1.5"
        style={{ color: solved ? COLOR.green : COLOR.yellow }}
      >
        {readout.label}
      </p>
      <div
        ref={ref}
        className="text-[15px] sm:text-[16px] leading-relaxed"
        style={{ color: solved ? COLOR.green : COLOR.white, whiteSpace: "normal" }}
      />
    </div>
  )
}

/**
 * useShake — returns [isShaking, fire()] so a parent can briefly shake an
 * element when the student answers wrong.
 */
export function useShake() {
  const [shaking, setShaking] = useState(false)
  function fire() {
    setShaking(true)
    setTimeout(() => setShaking(false), 220)
  }
  return [shaking, fire] as const
}

/**
 * Hook returning a smoothed value via spring lerp. Pass a target, get the
 * displayed value (lerps every frame until close).
 */
export function useSpring(target: number, factor = 0.22, eps = 0.001): number {
  const [display, setDisplay] = useState(target)
  useEffect(() => {
    let raf = 0
    let alive = true
    function tick() {
      setDisplay(prev => {
        const next = prev + (target - prev) * factor
        if (Math.abs(target - next) < eps) {
          return target
        }
        if (alive) raf = requestAnimationFrame(tick)
        return next
      })
    }
    raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [target, factor, eps])
  return display
}

/**
 * Standard CSS keyframes used across interactions. Inject once in the
 * runner; all interactions share them.
 */
export const interactionStyles = `
@keyframes pl-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.pl-shake { animation: pl-shake 220ms ease-in-out; }

@keyframes pl-success-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(15,238,137,0.45); }
  60%  { box-shadow: 0 0 0 16px rgba(15,238,137,0); }
  100% { box-shadow: 0 0 0 0 rgba(15,238,137,0); }
}
.pl-success-pulse { animation: pl-success-pulse 600ms ease-out; }

@keyframes pl-reveal {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pl-reveal { animation: pl-reveal 520ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }
`
