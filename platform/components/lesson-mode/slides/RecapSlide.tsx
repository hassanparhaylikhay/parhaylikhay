"use client"

import Visual from "../Visual"
import UnderstoodButton from "./_UnderstoodButton"
import { AltPanel, MixedText } from "../interactions/_shared"
import type { RecapSlide as RecapSlideT } from "@/lib/lesson-mode/types"

/**
 * RecapSlide — closes a section. Visual + small bullets. Student-led advance.
 */
export default function RecapSlide({
  slide,
  onAdvance,
  altText,
}: {
  slide: RecapSlideT
  onAdvance?: () => void
  altText?: string
}) {
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
          className="block text-[17px] sm:text-[19px] text-[#c8c6be] text-center max-w-[680px] leading-relaxed"
        />
      )}

      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="flex flex-col gap-2.5 mt-2 max-w-[560px] w-full">
          {slide.bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[16px] sm:text-[17px] text-[#c8c6be] pl-reveal leading-relaxed"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <span className="text-[#0fee89] mt-1">·</span>
              <MixedText text={b} />
            </li>
          ))}
        </ul>
      )}

      <AltPanel text={altText} className="max-w-[600px] w-full" />
      <UnderstoodButton onClick={onAdvance} label="got it" />
    </div>
  )
}
