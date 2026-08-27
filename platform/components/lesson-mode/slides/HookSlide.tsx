"use client"

import Visual from "../Visual"
import UnderstoodButton from "./_UnderstoodButton"
import { AltDemoCard, MixedText } from "../interactions/_shared"
import type { HookSlide as HookSlideT } from "@/lib/lesson-mode/types"

/**
 * HookSlide — wordless or near-wordless opener. Big visual, one optional line,
 * advance is always manual (the student decides when they've taken it in).
 */
export default function HookSlide({
  slide,
  onAdvance,
  altDemo,
}: {
  slide: HookSlideT
  onAdvance?: () => void
  altDemo?: string
}) {
  return (
    <div className="w-full flex flex-col items-center gap-5 sm:gap-6">
      {slide.title && (
        <h1 className="text-[26px] sm:text-[34px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[760px] leading-tight">
          <MixedText text={slide.title} />
        </h1>
      )}
      <Visual spec={slide.visual} />
      {slide.prompt && (
        <MixedText
          text={slide.prompt}
          className="block text-[17px] sm:text-[20px] text-[#c8c6be] text-center max-w-[680px] leading-relaxed"
        />
      )}
      <AltDemoCard svg={altDemo} />
      <UnderstoodButton onClick={onAdvance} label="let's go" />
    </div>
  )
}
