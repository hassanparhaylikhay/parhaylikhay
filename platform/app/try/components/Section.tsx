"use client"

import { forwardRef, type ReactNode } from "react"

/**
 * Section — shared scroll-section wrapper. Min-height ensures the section
 * earns its place on the scroll narrative even when content is short.
 * The id attribute lets us anchor-scroll from the hero CTA.
 *
 * Tone: dark, full-bleed, generous internal padding. Sections never
 * touch each other — there's always breathing room.
 */
type Props = {
  id?: string
  className?: string
  /** When true, the section will be tall enough to feel deliberate
   *  even on a 16:9 viewport. Use for choreographed pinned sections. */
  tall?: boolean
  /** When true, no min-height — for sections (Section 8 founder) that
   *  prefer to size to content. */
  natural?: boolean
  ariaLabel?: string
  children: ReactNode
}

const SectionImpl = forwardRef<HTMLElement, Props>(function Section(
  { id, className, tall, natural, ariaLabel, children },
  ref,
) {
  const minH = natural
    ? ""
    : tall
      ? "min-h-[100svh] md:min-h-[100vh]"
      : "min-h-[80svh] md:min-h-[80vh]"
  return (
    <section
      ref={ref}
      id={id}
      aria-label={ariaLabel}
      className={`relative w-full ${minH} ${className ?? ""}`}
    >
      {children}
    </section>
  )
})

export default SectionImpl
