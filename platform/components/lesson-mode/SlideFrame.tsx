"use client"

import { useEffect, useRef, useState } from "react"
import { MixedText } from "./interactions/_shared"

/**
 * SlideFrame — the shared chrome around every slide.
 *
 * Layout (top to bottom):
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  •••••••○••  small-title (centered)            ☓ exit      │ ← top bar
 *   │                                                            │
 *   │                                                            │
 *   │                  ╭──────────────────╮                      │
 *   │                  │   slide content  │                      │ ← center (children)
 *   │                  ╰──────────────────╯                      │
 *   │                                                            │
 *   │  ←  prev          hint · explain again          next →     │ ← bottom bar
 *   └────────────────────────────────────────────────────────────┘
 *
 * Behaviour:
 *   - Top bar is tiny (44 px). Bottom bar is tiny (56 px). Centre owns the rest.
 *   - Next is enabled only when canAdvance is true. Disabled state is faint.
 *   - "Explain again" callback is shown only when the parent passes onExplainAgain.
 *   - Hint shows after the student has been on this slide for 20 s without advancing.
 *   - Keyboard: ←/→ navigate, Esc opens exit confirm.
 */
type Props = {
  slideIdx: number
  totalSlides: number
  title?: string
  canAdvance: boolean
  /** Last slide reads as "finish" instead of "next". */
  isFinish?: boolean
  /** When true, the slide content fills the canvas (no 920px max-width). */
  wide?: boolean
  showExplainAgain?: boolean
  hintText?: string
  exitHref: string
  onPrev: () => void
  onNext: () => void
  onExplainAgain?: () => void
  children: React.ReactNode
}

export default function SlideFrame({
  slideIdx,
  totalSlides,
  title,
  canAdvance,
  isFinish,
  wide,
  showExplainAgain,
  hintText,
  exitHref,
  onPrev,
  onNext,
  onExplainAgain,
  children,
}: Props) {
  const [showHint, setShowHint] = useState(false)
  const slideKey = `${slideIdx}-${title ?? ""}`
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 20-second stuck-timer per slide
  useEffect(() => {
    setShowHint(false)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    if (!hintText || canAdvance) return
    hintTimer.current = setTimeout(() => setShowHint(true), 20_000)
    return () => {
      if (hintTimer.current) clearTimeout(hintTimer.current)
    }
  }, [slideKey, hintText, canAdvance])

  // Keyboard nav
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowRight" && canAdvance) onNext()
      else if (e.key === "ArrowLeft") onPrev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [canAdvance, onNext, onPrev])

  return (
    <div className="h-full w-full flex flex-col bg-[#07090d]">
      {/* ── top bar ─────────────────────────────────────────────────── */}
      <header className="h-11 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#0f161f]">
        <ProgressDots current={slideIdx} total={totalSlides} />
        <span className="sr-only">{title}</span>
        <a
          href={exitHref}
          className="text-[#3a4a5a] hover:text-[#c8c6be] transition-colors"
          aria-label="Exit lesson mode"
          title="Exit"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </a>
      </header>

      {/* ── centre canvas ───────────────────────────────────────────── */}
      {/*
       * Two-layer scroll trick: outer section scrolls, inner wrapper is
       * min-h-full and centers via flex. This way content centers when it
       * fits and stays fully accessible when it overflows (no clipping of
       * top OR bottom on small viewports).
       */}
      <section className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-8 py-3 sm:py-4">
          <div
            key={slideKey}
            className={`w-full flex flex-col items-center pl-fade-in ${wide ? "max-w-[1200px]" : "max-w-[920px]"}`}
          >
            {children}
          </div>
        </div>
      </section>

      {/* ── bottom bar ──────────────────────────────────────────────── */}
      <footer className="h-14 shrink-0 flex items-center justify-between px-4 sm:px-6 border-t border-[#0f161f]">
        <button
          onClick={onPrev}
          disabled={slideIdx === 0}
          className="flex items-center gap-2 text-[12px] font-mono text-[#3a4a5a] hover:text-[#c8c6be] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="hidden sm:inline">previous</span>
        </button>

        <div className="flex items-center gap-5">
          {showHint && hintText && (
            <MixedText
              text={hintText}
              className="text-[11px] sm:text-[12px] font-mono text-[#fff067] opacity-80 pl-fade-in"
            />
          )}
          {showExplainAgain && onExplainAgain && (
            <button
              onClick={onExplainAgain}
              className="text-[12px] sm:text-[12.5px] font-mono uppercase tracking-[1.5px] text-[#fff067] hover:text-[#f0eeea] hover:bg-[#fff06714] transition-all duration-300 px-3 py-1.5 rounded-md border border-[#fff06744] bg-[#fff06708] pl-fade-in"
              style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              explain another way →
            </button>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={!canAdvance}
          className={`flex items-center gap-2 text-[12px] font-mono transition-all duration-300 ${
            canAdvance
              ? "text-[#0fee89]"
              : "text-[#3a4a5a] cursor-not-allowed"
          }`}
        >
          <span className="hidden sm:inline">{isFinish || slideIdx === totalSlides - 1 ? "finish" : "next"}</span>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </footer>

      <style jsx>{`
        /* Apple-style spring curve: fast out, slow settle. Not bouncy, just smooth. */
        :global(.pl-fade-in) {
          animation: pl-fade-in 520ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes pl-fade-in {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0)   scale(1);     }
        }
      `}</style>
    </div>
  )
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => {
        const state = i < current ? "done" : i === current ? "current" : "future"
        return (
          <span
            key={i}
            className={`block rounded-full transition-all duration-300 ${
              state === "current"
                ? "w-4 h-1.5 bg-[#00abfa]"
                : state === "done"
                ? "w-1.5 h-1.5 bg-[#1a3350]"
                : "w-1.5 h-1.5 bg-[#0f161f]"
            }`}
          />
        )
      })}
    </div>
  )
}
