"use client"

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import katex from "katex"

/**
 * Common bits used by every interaction component.
 */

export type InteractionProps<Config = Record<string, unknown>> = {
  config: Config
  savedData?: Record<string, unknown>
  onComplete: (data?: Record<string, unknown>) => void
  /**
   * Signal up to LessonRunner that the student tapped "show me". Used to gate
   * the more-prominent "explain another way" surface so it only appears once
   * the student has admitted they're stuck.
   */
  onShowMeUsed?: () => void
  /** Closes the "explain another way" demonstration. */
  onDismissAlt?: () => void
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
 * AltDemoOverlay — "explain another way" as a VISUAL DEMONSTRATION.
 *
 * The alternative explanation is never a re-wording of the prompt: it is a
 * short animated demonstration of the method, drawn on the same grid the
 * student is working on, with the notation highlighted in time with the
 * movement it describes. It sits ON the canvas (the question stays in the
 * aside) and steps aside when the student is ready to try.
 */
export function AltDemoOverlay({ svg, onDismiss }: { svg?: string; onDismiss?: () => void }) {
  if (!svg) return null
  return (
    <div
      className="absolute inset-0 z-20 rounded-xl overflow-hidden pl-fade-in"
      style={{ background: COLOR.card }}
    >
      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: svg }} />
      {/* ring painted AFTER the svg: an inset shadow on the wrapper sits under
          its own content, so the demo's headline bar covered the top edge */}
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,240,103,0.45)" }} />
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute bottom-2.5 right-3 rounded-md border px-3 py-1.5 text-[11px] font-mono uppercase tracking-[1.5px] transition-colors"
          style={{
            borderColor: "rgba(255,240,103,0.45)",
            background: "rgba(11,17,24,0.85)",
            color: COLOR.yellow,
            cursor: "pointer",
          }}
        >
          my turn
        </button>
      )}
    </div>
  )
}

/** Centered-layout variant: the demonstration as a card under the prompt. */
export function AltDemoCard({ svg, onDismiss }: { svg?: string; onDismiss?: () => void }) {
  if (!svg) return null
  return (
    <div
      className="relative w-full max-w-[560px] mx-auto mb-6 rounded-xl overflow-hidden pl-fade-in"
      style={{ background: COLOR.card }}
    >
      <div dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1.5px rgba(255,240,103,0.45)" }} />
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute bottom-2.5 right-3 rounded-md border px-3 py-1.5 text-[11px] font-mono uppercase tracking-[1.5px] transition-colors"
          style={{
            borderColor: "rgba(255,240,103,0.45)",
            background: "rgba(11,17,24,0.85)",
            color: COLOR.yellow,
            cursor: "pointer",
          }}
        >
          my turn
        </button>
      )}
    </div>
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
  // ALWAYS render the container with reserved height. Before, this returned
  // null until the widget posted pl-lesson-readout (~200ms after the iframe
  // loaded) — and when the panel suddenly mounted, the aside's
  // justify-center recomputed and the title + prompt above shifted up
  // visibly. With the container always present at min-height 88, the
  // layout never moves; the border + content just fade in when the
  // readout arrives.
  const hasReadout = !!readout
  return (
    <div
      className="rounded-lg border px-4 py-3 transition-all duration-300"
      style={{
        borderColor: hasReadout ? (solved ? "rgba(15,238,137,0.45)" : COLOR.border) : "transparent",
        background: hasReadout ? (solved ? "rgba(15,238,137,0.05)" : "transparent") : "transparent",
        overflowWrap: "anywhere",
        wordBreak: "break-word",
        minHeight: 88,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <div
        style={{
          opacity: hasReadout ? 1 : 0,
          transition: "opacity 360ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {hasReadout && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

/**
 * ContextCanvas — wraps a contextHtml SVG inside a sized container that
 * matches the geometry of the iframe widgets on the left of widget
 * slides. Same window.innerWidth-based math as WidgetCanvas, same card
 * styling, same aspect (480/320). MCQ slides that need a big
 * manipulative diagram embed their SVG here so it sits in the canvas
 * slot at the identical size, density and look as the real widgets.
 */
export function ContextCanvas({ html, labels, asideWidth, overlay }: { html: string; labels?: CanvasLabel[]; asideWidth?: number; overlay?: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const aside = asideWidth ?? 360
  useLayoutEffect(() => {
    function fit() {
      const wrap = wrapRef.current
      if (!wrap) return
      const SVG_ASPECT = 480 / 320
      const RESERVED = 200
      const vw = window.innerWidth
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide ? aside + 28 : 0
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(300, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT
      wrap.style.width = `${Math.round(w)}px`
      wrap.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [aside])
  return (
    <div
      ref={wrapRef}
      className="relative block rounded-xl overflow-hidden"
      style={{
        background: COLOR.card,
        border: `1px solid ${COLOR.border}`,
        containerType: "inline-size",
      }}
    >
      <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: html }} />
      {overlay}
    </div>
  )
}

/**
 * CanvasStage — the figure WITH its teaching text, as one object.
 *
 * Hassan, September 2026: "ALL teaching text MUST render on CANVAS, not on
 * the side. It should be like a teacher guiding a student visually, not like
 * an AI chatbot generating text on the side."
 *
 * So the instruction, the correction and the explanation all live on the
 * board with the diagram, and the side panel keeps only things the student
 * operates: option buttons, inputs, tiles. The student's eye stays in one
 * place instead of ping-ponging between a picture and a column of prose.
 *
 * Layout is one card: a caption strip on top, the figure underneath at the
 * usual 480x320 aspect.
 */
/**
 * A label positioned on a figure, in the figure's own 480x320 coordinates.
 *
 * Math renders through KaTeX. It CANNOT go inside the SVG: iOS Safari places
 * <foreignObject> content at unscaled CSS coordinates, so KaTeX labels drift
 * away from their anchors (see the iOS foreignObject memory). So labels are
 * real DOM positioned over the figure instead, and they scale with it via
 * container query units: 1cqw is 1% of the figure's width, so a label sized
 * for the 480-wide viewBox stays correct at every rendered size, with no JS
 * and no resize listener.
 */
export type CanvasLabel = {
  x: number
  y: number
  /** Math, rendered via KaTeX. */
  tex?: string
  /** A word or phrase. Rendered in the UI face, never in KaTeX. */
  text?: string
  color?: string
  /** Font size in the figure's own units (as if it were an SVG font-size). */
  size?: number
  anchor?: "middle" | "start" | "end"
}

export function CanvasLabels({ labels }: { labels?: CanvasLabel[] }) {
  if (!labels?.length) return null
  return (
    <>
      {labels.map((l, i) => {
        const size = l.size ?? 14
        const style: React.CSSProperties = {
          left: `${(l.x / 480) * 100}%`,
          top: `${(l.y / 320) * 100}%`,
          transform:
            l.anchor === "start" ? "translate(0, -50%)"
              : l.anchor === "end" ? "translate(-100%, -50%)"
              : "translate(-50%, -50%)",
          fontSize: `${((size / 480) * 100).toFixed(3)}cqw`,
          color: l.color ?? COLOR.text,
          whiteSpace: "nowrap",
          lineHeight: 1.1,
        }
        if (l.tex) {
          let html = l.tex
          try {
            html = katex.renderToString(l.tex, { throwOnError: false, output: "html" })
          } catch { /* fall back to the raw source */ }
          return (
            <div
              key={i}
              className="absolute pointer-events-none pl-canvas-label"
              style={style}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )
        }
        // A phrase can still carry maths inside $...$, so route it through
        // MixedText rather than printing it raw.
        return (
          <div key={i} className="absolute pointer-events-none pl-canvas-label" style={{ ...style, fontWeight: 500 }}>
            <MixedText text={l.text} />
          </div>
        )
      })}
    </>
  )
}

/**
 * A figure plus its KaTeX labels. Use this anywhere a contextHtml SVG is
 * rendered, so labels come along with it.
 */
export function CanvasFigure({
  html,
  labels,
  children,
  className,
  style,
}: {
  html?: string
  labels?: CanvasLabel[]
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`relative w-full ${className ?? ""}`}
      style={{ containerType: "inline-size", ...style }}
    >
      {html !== undefined
        ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: html }} />
        : null}
      <CanvasLabels labels={labels} />
      {children}
    </div>
  )
}

export function CanvasStage({
  instruction,
  note,
  noteTone = "wrong",
  asideWidth,
  overlay,
  html,
  labels,
  children,
  shake,
}: {
  /** The question or current step. ALWAYS visible. */
  instruction?: React.ReactNode
  /** Correction or explanation. Appears BELOW the instruction, never instead of it. */
  note?: React.ReactNode
  noteTone?: "success" | "wrong"
  asideWidth?: number
  overlay?: React.ReactNode
  html?: string
  labels?: CanvasLabel[]
  children?: React.ReactNode
  shake?: boolean
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const figRef = useRef<HTMLDivElement | null>(null)
  const aside = asideWidth ?? 360
  useLayoutEffect(() => {
    function fit() {
      const wrap = wrapRef.current
      const fig = figRef.current
      if (!wrap || !fig) return
      const SVG_ASPECT = 480 / 320
      // Vertical budget. A student must never scroll inside a slide, so the
      // figure is sized from what is actually left after the chrome, the
      // slide padding and the caption block.
      const CHROME = 100          // SlideFrame header + footer
      const PAD = 44              // slide padding + breathing room
      const CAPTION = 108         // reserved for instruction + note
      const MAX_W = 900           // a manipulative gains nothing past this
      const vw = window.innerWidth
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide && aside > 0 ? aside + 28 : 0
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(200, window.innerHeight - CHROME - PAD - CAPTION)
      const w = Math.max(300, Math.min(availableW, SVG_ASPECT * availableH, MAX_W))
      wrap.style.width = `${Math.round(w)}px`
      fig.style.height = `${Math.round(w / SVG_ASPECT)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [aside])

  // No card frame. The figure sits on the page like work on a board, not
  // inside a panel.
  return (
    <div ref={wrapRef} className={`relative block ${shake ? "pl-shake" : ""}`}>
      {(instruction || note) && (
        <div className="pb-3.5" style={{ minHeight: 92 }}>
          {instruction && (
            <div className="text-[17px] sm:text-[19px] leading-snug" style={{ color: COLOR.white }}>
              {instruction}
            </div>
          )}
          {note && (
            <div
              key={String(note)}
              className="pl-reveal mt-2 text-[15px] sm:text-[16px] leading-relaxed"
              style={{ color: noteTone === "success" ? COLOR.green : COLOR.pink }}
            >
              {note}
            </div>
          )}
        </div>
      )}
      <div ref={figRef} className="relative w-full" style={{ containerType: "inline-size" }}>
        {html !== undefined
          ? <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: html }} />
          : children}
        <CanvasLabels labels={labels} />
        {overlay}
      </div>
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
    setTimeout(() => setShaking(false), 380)
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
  25% { transform: translateX(-2px); }
  50% { transform: translateX(2px); }
  75% { transform: translateX(-1.5px); }
}
.pl-shake { animation: pl-shake 380ms cubic-bezier(0.16, 1, 0.3, 1); }

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

/* Soft repeating glow that marks THE primary affordance on a slide until
   the student uses it once (step-through's next-step button). */
@keyframes pl-primed {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0,171,250,0); }
  50%      { box-shadow: 0 0 18px -4px rgba(0,171,250,0.55); }
}
.pl-primed { animation: pl-primed 2s ease-in-out infinite; }

/* tapDiagram — the figure itself is the answer surface.
   Each tappable part is a <g data-region="id"> holding a .pl-tap-vis
   highlight shape and a fat invisible .pl-tap-hit shape. The parts breathe
   until the first tap so the invitation needs no instruction line. */
.pl-tap [data-region] { cursor: pointer; }
.pl-tap [data-region] .pl-tap-vis {
  transition: stroke 260ms cubic-bezier(0.16, 1, 0.3, 1),
              stroke-width 260ms cubic-bezier(0.16, 1, 0.3, 1),
              fill 260ms ease, opacity 260ms ease;
}
.pl-tap:not(.pl-tap-locked) [data-region]:hover .pl-tap-vis {
  stroke: #fff067; stroke-width: 6; opacity: 1;
}
.pl-tap:not(.pl-tap-locked) [data-region]:hover .pl-tap-fill { fill: rgba(255,240,103,0.28); }
/* Same lift as :hover, but driven by JS while a label is being dragged over
   a part (CSS :hover does not fire during pointer capture). */
.pl-tap [data-region].pl-tap-over .pl-tap-vis { stroke: #fff067; stroke-width: 6; opacity: 1; }
.pl-tap [data-region].pl-tap-over .pl-tap-fill { fill: rgba(255,240,103,0.28); }
.pl-tap [data-region].pl-tap-right .pl-tap-vis { stroke: #0fee89; stroke-width: 6.5; opacity: 1; }
.pl-tap [data-region].pl-tap-right .pl-tap-fill { fill: rgba(15,238,137,0.22); }
.pl-tap [data-region].pl-tap-wrong .pl-tap-vis { stroke: #ff4670; stroke-width: 6; opacity: 1; }
.pl-tap [data-region].pl-tap-wrong .pl-tap-fill { fill: rgba(255,70,112,0.20); }
.pl-tap.pl-tap-locked [data-region] { cursor: default; }
@keyframes pl-tap-invite {
  0%, 100% { opacity: 0.28; }
  50%      { opacity: 0.85; }
}
.pl-tap.pl-tap-fresh [data-region] .pl-tap-vis {
  animation: pl-tap-invite 2.2s ease-in-out infinite;
}
.pl-tap.pl-tap-fresh [data-region]:hover .pl-tap-vis { animation: none; }

.pl-canvas-label .katex { font-size: 1em; color: inherit; }

/* Linear fill used as the auto-play pacing indicator on walkthroughs. */
@keyframes pl-autofill {
  from { width: 0; }
  to   { width: 100%; }
}
.pl-autofill { animation-name: pl-autofill; animation-timing-function: linear; animation-fill-mode: forwards; }

/* Staggered fade-in for the side-panel children — title, prompt,
   readout, status, button. Each child appears ~80ms after the previous
   one, settling in with a small upward translate on Apple's smooth
   ease curve. Applied to the aside on widgetCanvas, clickOnGrid and
   the concept-iframe layout. Keyed on slide transitions via the
   parent's pl-fade-in remount so the stagger replays per slide. */
@keyframes pl-stagger-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pl-stagger > * {
  opacity: 0;
  animation: pl-stagger-in 540ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.pl-stagger > *:nth-child(1) { animation-delay: 140ms; }
.pl-stagger > *:nth-child(2) { animation-delay: 240ms; }
.pl-stagger > *:nth-child(3) { animation-delay: 340ms; }
.pl-stagger > *:nth-child(4) { animation-delay: 440ms; }
.pl-stagger > *:nth-child(5) { animation-delay: 540ms; }
`
