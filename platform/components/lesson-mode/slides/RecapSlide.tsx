"use client"

import Visual from "../Visual"
import type { RecapSlide as RecapSlideT } from "@/lib/lesson-mode/types"

/**
 * RecapSlide — closes a section. Visual + small bullets. Advance manual.
 */
export default function RecapSlide({ slide }: { slide: RecapSlideT }) {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      {slide.title && (
        <h2 className="text-[22px] sm:text-[26px] font-semibold text-[#f0eeea] tracking-tight text-center max-w-[640px]">
          {slide.title}
        </h2>
      )}

      {slide.visual && <Visual spec={slide.visual} />}

      {slide.prompt && (
        <p className="text-[14.5px] text-[#c8c6be] text-center max-w-[560px]">{slide.prompt}</p>
      )}

      {slide.bullets && slide.bullets.length > 0 && (
        <ul className="flex flex-col gap-2 mt-2 max-w-[480px] w-full">
          {slide.bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[13.5px] sm:text-[14px] text-[#c8c6be] pl-reveal"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <span className="text-[#0fee89] mt-1.5">·</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
