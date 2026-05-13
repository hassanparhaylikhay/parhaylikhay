"use client"

import Visual from "../Visual"
import InteractionSlide from "./InteractionSlide"
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
}: {
  slide: ExamLinkSlideT
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance?: () => void
  savedData?: Record<string, unknown>
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
        <h2 className="text-[20px] sm:text-[24px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[640px]">
          {slide.title}
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
        />
      ) : (
        <>
          {slide.visual && <Visual spec={slide.visual} />}
          {slide.prompt && (
            <p className="text-[14.5px] text-[#c8c6be] text-center max-w-[560px] leading-relaxed">
              {slide.prompt}
            </p>
          )}
        </>
      )}
    </div>
  )
}
