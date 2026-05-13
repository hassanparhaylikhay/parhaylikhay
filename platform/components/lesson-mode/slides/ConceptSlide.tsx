"use client"

import { useEffect, useState } from "react"
import Visual from "../Visual"
import UnderstoodButton from "./_UnderstoodButton"
import type { ConceptSlide as ConceptSlideT } from "@/lib/lesson-mode/types"

/**
 * ConceptSlide — introduces an idea.
 *
 * Two flavours:
 *   - Plain concept: title + visual + prompt + "I understood" button.
 *   - Tap-to-reveal: each tap unlocks the next item. With advance=onSuccess
 *     the slide reports complete once every reveal is shown.
 */
export default function ConceptSlide({
  slide,
  onComplete,
  onAdvance,
  canAdvance,
}: {
  slide: ConceptSlideT
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance?: () => void
  canAdvance?: boolean
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

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {slide.title && (
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[640px]">
          {slide.title}
        </h2>
      )}

      {slide.visual && <Visual spec={slide.visual} />}

      {slide.prompt && (
        <p className="text-[14.5px] sm:text-[15.5px] text-[#c8c6be] leading-relaxed text-center max-w-[560px]">
          {slide.prompt}
        </p>
      )}

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

      {/* Student-led advance: only show on manual-advance slides. */}
      {slide.advance === "manual" && canAdvance && (
        <UnderstoodButton onClick={onAdvance} />
      )}
    </div>
  )
}
