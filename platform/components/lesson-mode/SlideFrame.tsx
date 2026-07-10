"use client"

import { useEffect, useRef, useState } from "react"
import { MixedText } from "./interactions/_shared"

/**
 * SlideFrame — the shared chrome around every slide.
 *
 * Layout (top to bottom):
 *   ┌────────────────────────────────────────────────────────────┐
 *   │  ▮▮▮▯▯▯▯ chapter   (sr title)      7/29 marks    ☓ exit    │ ← top bar
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
 *   - Progress renders as chapter segments (a 75-slide lesson as 75 dots
 *     overflowed the header and read as noise). Lessons without chapters
 *     fall back to a single thin progress bar.
 *   - The marks ledger counts exam marks banked so far and pulses when it grows.
 *   - Next is enabled only when canAdvance is true. Disabled state is faint.
 *   - Hint shows after the student has been on this slide for 20 s without advancing.
 *   - Keyboard: ←/→ navigate.
 */

export type ChapterInfo = {
  id: string
  title: string
  /** First and last slide index of this chapter. */
  start: number
  end: number
}

type Props = {
  slideIdx: number
  totalSlides: number
  title?: string
  canAdvance: boolean
  /** Last slide reads as "finish" instead of "next". */
  isFinish?: boolean
  /** When true, the slide content fills the canvas (no 920px max-width). */
  wide?: boolean
  chapters?: ChapterInfo[] | null
  /** Exam-marks ledger. Null hides the ledger entirely. */
  marks?: { banked: number; total: number } | null
  /** The slide has an altExplain and it is not currently showing. */
  altAvailable?: boolean
  /** The student tapped a show-me affordance on this slide. */
  showMeUsed?: boolean
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
  chapters,
  marks,
  altAvailable,
  showMeUsed,
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

  // "Explain another way" escalates from either signal of being stuck: the
  // student tapped a show-me affordance, or the 20s hint timer fired. Many
  // interactions (widget puzzles, answer builders) have no show-me button,
  // so gating on show-me alone made their altExplain unreachable.
  const showExplainAgain = Boolean(altAvailable && onExplainAgain && (showMeUsed || showHint))

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
      <header className="h-11 shrink-0 flex items-center gap-3 sm:gap-5 px-4 sm:px-6 border-b border-[#0f161f]">
        <div className="flex-1 min-w-0">
          {chapters && chapters.length > 0 ? (
            <ChapterBar chapters={chapters} slideIdx={slideIdx} />
          ) : (
            <LinearProgress current={slideIdx} total={totalSlides} />
          )}
        </div>
        <span className="sr-only">{title}</span>
        {marks && marks.total > 0 && <MarksLedger banked={marks.banked} total={marks.total} />}
        <a
          href={exitHref}
          className="shrink-0 text-[#3a4a5a] hover:text-[#c8c6be] transition-colors"
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

/**
 * Segmented chapter progress. Finished chapters render dim blue, the current
 * chapter fills proportionally in bright blue, future chapters stay dark.
 * The current chapter's name sits to the right of the segments.
 */
function ChapterBar({ chapters, slideIdx }: { chapters: ChapterInfo[]; slideIdx: number }) {
  const current = chapters.find(c => slideIdx >= c.start && slideIdx <= c.end) ?? chapters[0]
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="flex items-center gap-1 flex-1 min-w-0 max-w-[280px]">
        {chapters.map(c => {
          const doneChapter = slideIdx > c.end
          const isCurrent = slideIdx >= c.start && slideIdx <= c.end
          const fill = doneChapter ? 1 : isCurrent ? (slideIdx - c.start + 1) / (c.end - c.start + 1) : 0
          return (
            <div
              key={c.id}
              className="relative h-1.5 flex-1 rounded-full overflow-hidden"
              style={{ background: "#0f161f", minWidth: 10 }}
              title={c.title}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                style={{
                  width: `${fill * 100}%`,
                  background: doneChapter ? "#1a3350" : "#00abfa",
                  transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </div>
          )
        })}
      </div>
      <span className="hidden md:block shrink-0 text-[10px] font-mono uppercase tracking-[1.5px] text-[#7a7875] truncate max-w-[140px]">
        {current.title}
      </span>
    </div>
  )
}

/** Fallback for lessons without chapters: one thin fill bar. */
function LinearProgress({ current, total }: { current: number; total: number }) {
  const pct = total <= 1 ? 100 : (current / (total - 1)) * 100
  return (
    <div className="relative h-1.5 w-full max-w-[280px] rounded-full overflow-hidden" style={{ background: "#0f161f" }}>
      <div
        className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: "#00abfa", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
      />
    </div>
  )
}

/**
 * Exam-marks ledger. Green once anything is banked; pulses each time the
 * count grows so a solved puzzle visibly pays out in the chrome.
 */
function MarksLedger({ banked, total }: { banked: number; total: number }) {
  const prev = useRef(banked)
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    if (banked > prev.current) setPulse(p => p + 1)
    prev.current = banked
  }, [banked])
  return (
    <span
      key={pulse}
      className={`shrink-0 flex items-baseline gap-1 text-[11px] font-mono rounded-md px-2 py-0.5 ${pulse > 0 ? "pl-success-pulse" : ""}`}
      title="Exam marks banked in this lesson"
    >
      <span style={{ color: banked > 0 ? "#0fee89" : "#3a4a5a", fontWeight: 600 }}>{banked}</span>
      <span style={{ color: "#3a4a5a" }}>/ {total} marks</span>
    </span>
  )
}
