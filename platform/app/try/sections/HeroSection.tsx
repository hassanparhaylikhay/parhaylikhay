"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Section from "../components/Section"
import styles from "../try.module.css"

const HEADLINE = "Most Pakistani students learn maths by reading and watching."
const SUBHEAD  = "Parhaylikhay teaches them by doing."

const WORD_STAGGER_MS = 90   // gap between consecutive word reveals
const WORD_DURATION_MS = 700 // each word's fade-up duration
const SUBHEAD_DELAY_MS = 380
const CTA_DELAY_MS = 700

/**
 * Section 1 — Hero.
 *
 * Smooth per-word reveal: each word fades up with a 90 ms stagger.
 * Reads as a calm "writing emerging from the page", not a typewriter
 * machine-gun. Subhead and CTA follow in sequence.
 */
export default function HeroSection() {
  const words = HEADLINE.split(/(\s+)/)   // keep the whitespace tokens
  const wordCount = words.filter(w => !/^\s+$/.test(w)).length
  const headlineDuration = (wordCount - 1) * WORD_STAGGER_MS + WORD_DURATION_MS

  const [headStart, setHeadStart] = useState(false)
  const [showSub, setShowSub] = useState(false)
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const reduce = typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeadStart(true)
      setShowSub(true)
      setShowCta(true)
      return
    }
    const t = [
      setTimeout(() => setHeadStart(true), 220),
      setTimeout(() => setShowSub(true), 220 + headlineDuration + SUBHEAD_DELAY_MS),
      setTimeout(() => setShowCta(true), 220 + headlineDuration + SUBHEAD_DELAY_MS + 600 + CTA_DELAY_MS),
    ]
    return () => t.forEach(clearTimeout)
  }, [headlineDuration])

  function scrollToNext() {
    document.querySelector("#contrast")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  // Precompute word indices: each non-whitespace token gets a stable
  // 0-based index so the reveal stagger lines up with reading order.
  const wordIndices = (() => {
    const out: (number | null)[] = []
    let n = 0
    for (const w of words) out.push(/^\s+$/.test(w) ? null : n++)
    return out
  })()

  return (
    <Section ariaLabel="Introduction" tall className="overflow-hidden">
      {/* Soft radial glow behind the headline. */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 42%, rgba(0,171,250,0.06), transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-[100svh] md:min-h-[100vh] px-6 sm:px-10 text-center">
        {/* Parhaylikhay wordmark — centred above the headline, fades
            up in sync with the first word of the reveal so it lands
            with weight rather than blinking in. */}
        <div
          className="mb-10 sm:mb-12 md:mb-14 transition-all duration-[900ms]"
          style={{
            opacity: headStart ? 1 : 0,
            transform: headStart ? "translateY(0)" : "translateY(-6px)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <Image
            src="/parhaylikhay-logo.png"
            alt="Parhaylikhay"
            width={900}
            height={225}
            priority
            sizes="(max-width: 640px) 200px, (max-width: 1024px) 240px, 280px"
            className="block h-auto w-[200px] sm:w-[240px] md:w-[280px]"
          />
        </div>

        <h1
          className="font-sans text-[28px] sm:text-[40px] md:text-[52px] lg:text-[60px] leading-[1.12] tracking-[-0.025em] text-[#f0eeea] max-w-[18ch] font-medium"
          aria-label={HEADLINE}
        >
          {words.map((w, i) => {
            const idx = wordIndices[i]
            if (idx === null) return <span key={i}>{w}</span>
            const delay = headStart ? idx * WORD_STAGGER_MS : 0
            return (
              <span
                key={i}
                className="inline-block"
                style={{
                  opacity: headStart ? 1 : 0,
                  transform: headStart ? "translateY(0)" : "translateY(14px)",
                  transition: `opacity ${WORD_DURATION_MS}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform ${WORD_DURATION_MS}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
                }}
              >
                {w}
              </span>
            )
          })}
        </h1>

        <p
          className="font-sans text-[18px] sm:text-[24px] md:text-[28px] text-[#fff067] mt-6 sm:mt-8 max-w-[26ch] transition-all duration-[800ms]"
          style={{
            opacity: showSub ? 1 : 0,
            transform: showSub ? "translateY(0)" : "translateY(10px)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {SUBHEAD}
        </p>

        <div
          className="mt-12 sm:mt-14 transition-all duration-[800ms]"
          style={{
            opacity: showCta ? 1 : 0,
            transform: showCta ? "translateY(0) scale(1)" : "translateY(10px) scale(0.98)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <button
            onClick={scrollToNext}
            className={`${styles.ctaGlow} group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#0fee89] text-[#07090d] text-[15px] sm:text-[16px] font-semibold tracking-[-0.01em] transition-transform duration-300 hover:scale-[1.04] active:scale-[0.98]`}
            style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            aria-label="Scroll to the next section"
          >
            <span>Show me</span>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="transition-transform group-hover:translate-y-0.5">
              <path d="M7 2v9M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll cue at foot. */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: showCta ? 1 : 0 }}
      >
        <span className="font-mono text-[9.5px] tracking-[2.5px] uppercase text-[#3a4a5a]">
          scroll
        </span>
        <div className={styles.scrollCue} aria-hidden />
      </div>
    </Section>
  )
}
