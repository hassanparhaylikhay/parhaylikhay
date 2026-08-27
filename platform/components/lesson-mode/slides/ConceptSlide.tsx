"use client"

import { useEffect, useRef, useState } from "react"
import Visual from "../Visual"
import UnderstoodButton from "./_UnderstoodButton"
import { AltDemoCard, AltDemoOverlay, MixedText, ReadoutPanel, useWidgetReadout, ContextCanvas } from "../interactions/_shared"
import type { ConceptSlide as ConceptSlideT } from "@/lib/lesson-mode/types"

/**
 * ConceptSlide — introduces an idea.
 *
 * Two layouts based on the visual kind:
 *   - iframe visual (a live manipulative): side-by-side with title + prompt
 *     + understood button in a 320 px right panel, manipulative claims the
 *     remaining width AND full available height. Stacks on mobile.
 *   - any other visual: centered vertical stack, the original layout.
 *
 * The split exists so manipulative-driven concept slides feel like a canvas
 * rather than a centred card crammed between text blocks.
 */
export default function ConceptSlide({
  slide,
  onComplete,
  onAdvance,
  canAdvance,
  altDemo,
}: {
  slide: ConceptSlideT
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance?: () => void
  canAdvance?: boolean
  altDemo?: string
}) {
  const reveals = slide.reveals ?? []
  const [revealed, setRevealed] = useState(0)
  const hasReveals = reveals.length > 0
  const allRevealed = revealed >= reveals.length

  useEffect(() => {
    if (hasReveals && allRevealed && slide.advance === "onSuccess") {
      onComplete({ revealed: reveals.length })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReveals, allRevealed, slide.advance])

  const isIframe = slide.visual?.kind === "iframe"
  const isWideHtml = slide.visual?.kind === "html" && (slide.visual as { wide?: boolean }).wide === true

  if (isIframe) {
    return <ConceptIframeLayout slide={slide} onAdvance={onAdvance} canAdvance={canAdvance} altDemo={altDemo} />
  }

  if (isWideHtml) {
    return <ConceptWideHtmlLayout slide={slide} onAdvance={onAdvance} canAdvance={canAdvance} altDemo={altDemo} />
  }

  // Centered stack for non-iframe visuals (small inline diagrams, recaps, etc.)
  return (
    <div className="w-full flex flex-col items-center gap-4 sm:gap-5">
      {slide.title && (
        <h2 className="text-[24px] sm:text-[30px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[760px] leading-tight">
          <MixedText text={slide.title} />
        </h2>
      )}

      {slide.visual && <Visual spec={slide.visual} />}

      {slide.prompt && (
        <MixedText
          text={slide.prompt}
          className="block text-[17px] sm:text-[20px] text-[#c8c6be] leading-relaxed text-center max-w-[680px]"
        />
      )}

      <AltDemoCard svg={altDemo} />

      {hasReveals && (
        <div className="w-full flex flex-col items-center gap-3 mt-2">
          {reveals.slice(0, revealed).map((r, i) => (
            <div key={i} className="pl-reveal flex flex-col items-center gap-2 max-w-[560px]">
              {r.visual && <Visual spec={r.visual} />}
              {r.text && <p className="text-[14px] text-[#c8c6be] text-center">{r.text}</p>}
            </div>
          ))}
          {!allRevealed && (
            <button
              onClick={() => setRevealed(v => Math.min(reveals.length, v + 1))}
              className="mt-3 px-4 py-2 text-[12px] font-mono text-[#fff067] border border-[#fff06755] rounded hover:bg-[#fff06710] transition-colors"
            >
              tap to reveal {revealed === 0 ? "" : `(${revealed}/${reveals.length})`}
            </button>
          )}
        </div>
      )}

      {slide.advance === "manual" && canAdvance && !hasReveals && (
        <UnderstoodButton onClick={onAdvance} />
      )}
    </div>
  )
}

/**
 * Side-by-side layout for concept slides whose visual is a wide HTML canvas
 * (a 480×320 viewBox SVG sized via the same ContextCanvas wrapper the wide
 * MCQ slides use). Canvas claims the main column; title + plenty-of-words
 * prompt + "I understood" sit in a 320 px aside on the right. Long
 * explanatory prose has vertical room without the slide ever scrolling.
 */
function ConceptWideHtmlLayout({
  slide,
  onAdvance,
  canAdvance,
  altDemo,
}: {
  slide: ConceptSlideT
  onAdvance?: () => void
  canAdvance?: boolean
  altDemo?: string
}) {
  const html = (slide.visual as { content?: string }).content ?? ""
  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-8 items-center xl:items-stretch">
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <ContextCanvas html={html} asideWidth={320} overlay={<AltDemoOverlay svg={altDemo} />} />
      </div>
      <aside className="pl-stagger w-full xl:w-[320px] shrink-0 flex flex-col gap-4 xl:gap-5 justify-center xl:py-4" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {slide.title && (
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#f0eeea] tracking-tight leading-tight">
            <MixedText text={slide.title} />
          </h2>
        )}
        {slide.prompt && (
          <MixedText
            text={slide.prompt}
            className="block text-[16px] sm:text-[18px] text-[#c8c6be] leading-relaxed"
          />
        )}
        {slide.advance === "manual" && canAdvance && (
          <div className="xl:mt-2">
            <UnderstoodButton onClick={onAdvance} />
          </div>
        )}
      </aside>
    </div>
  )
}

/**
 * Side-by-side layout for concept slides whose visual is a live widget.
 * The manipulative claims most of the canvas; a 320px right panel hosts
 * title + prompt + live readout + understood button. The readout comes
 * from the widget's pl-lesson-readout postMessage so the student sees
 * the column-vector / scale-factor / mirror-equation update next to the
 * prompt instead of inside a strip below the canvas.
 */
function ConceptIframeLayout({
  slide,
  onAdvance,
  canAdvance,
  altDemo,
}: {
  slide: ConceptSlideT
  onAdvance?: () => void
  canAdvance?: boolean
  altDemo?: string
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const readout = useWidgetReadout(iframeRef)

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-8 items-center xl:items-stretch">
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <div className="relative">
          {slide.visual && <Visual spec={slide.visual} iframeRef={iframeRef} />}
          <AltDemoOverlay svg={altDemo} />
        </div>
      </div>
      <aside className="pl-stagger w-full xl:w-[320px] shrink-0 flex flex-col gap-4 xl:gap-5 justify-center xl:py-4">
        {slide.title && (
          <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#f0eeea] tracking-tight leading-tight">
            <MixedText text={slide.title} />
          </h2>
        )}
        {slide.prompt && (
          <MixedText
            text={slide.prompt}
            className="block text-[16px] sm:text-[18px] text-[#c8c6be] leading-relaxed"
          />
        )}
        <ReadoutPanel readout={readout} />
        {slide.advance === "manual" && canAdvance && (
          <div className="xl:mt-2">
            <UnderstoodButton onClick={onAdvance} />
          </div>
        )}
      </aside>
    </div>
  )
}
