"use client"

import Visual from "../Visual"
import InteractionSlide from "./InteractionSlide"
import { MixedText } from "../interactions/_shared"
import type { ExamLinkSlide as ExamLinkSlideT, InteractionSlide as InteractionSlideT } from "@/lib/lesson-mode/types"

/**
 * ExamLinkSlide — ties the current idea back to what earns a mark on the exam.
 * Shows a small mark pill (B1 / M1 / A1) at the top, then either a visual
 * (callout style) or an embedded interaction.
 */
export default function ExamLinkSlide({
  slide,
  onComplete,
  onAdvance,
  savedData,
  onShowMeUsed,
}: {
  slide: ExamLinkSlideT
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance?: () => void
  savedData?: Record<string, unknown>
  onShowMeUsed?: () => void
}) {
  // Suppress unused — non-interaction examLink doesn't need onAdvance yet.
  void onAdvance
  return (
    <div className="w-full flex flex-col items-center gap-5">
      {slide.markCode && (
        <span className="text-[10.5px] font-mono uppercase tracking-[2px] px-2.5 py-1 rounded border border-[#00abfa55] text-[#00abfa] bg-[#00abfa08]">
          earns · {slide.markCode}
        </span>
      )}

      {slide.title && (
        <h2 className="text-[24px] sm:text-[30px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[760px] leading-tight">
          <MixedText text={slide.title} />
        </h2>
      )}

      {slide.interaction ? (
        <InteractionSlide
          slide={{
            ...slide,
            kind: "interaction",
            interaction: slide.interaction,
            advance: slide.advance,
          } as InteractionSlideT}
          onComplete={onComplete}
          savedData={savedData}
          onShowMeUsed={onShowMeUsed}
        />
      ) : (
        <>
          {slide.visual && <Visual spec={slide.visual} />}
          {slide.prompt && (
            <MixedText
              text={slide.prompt}
              className="block text-[17px] sm:text-[19px] text-[#c8c6be] text-center max-w-[680px] leading-relaxed"
            />
          )}
        </>
      )}
    </div>
  )
}
