"use client"

import Visual from "../Visual"
import UnderstoodButton from "./_UnderstoodButton"
import type { HookSlide as HookSlideT } from "@/lib/lesson-mode/types"

/**
 * HookSlide — wordless or near-wordless opener. Big visual, one optional line,
 * advance is always manual (the student decides when they've taken it in).
 */
export default function HookSlide({
  slide,
  onAdvance,
}: {
  slide: HookSlideT
  onAdvance?: () => void
}) {
  return (
    <div className="w-full flex flex-col items-center gap-8">
      {slide.title && (
        <h1 className="text-[24px] sm:text-[28px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[640px]">
          {slide.title}
        </h1>
      )}
      <Visual spec={slide.visual} />
      {slide.prompt && (
        <p className="text-[14px] sm:text-[15px] text-[#7a7875] text-center max-w-[560px]">{slide.prompt}</p>
      )}
      <UnderstoodButton onClick={onAdvance} label="let's go" />
    </div>
  )
}
