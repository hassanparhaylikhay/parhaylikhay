"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { Lesson, Slide, LessonProgress } from "@/lib/lesson-mode/types"
import { loadProgress, saveProgress, updateSlideState } from "@/lib/lesson-mode/storage"
import SlideFrame from "./SlideFrame"
import HookSlide from "./slides/HookSlide"
import ConceptSlide from "./slides/ConceptSlide"
import InteractionSlide from "./slides/InteractionSlide"
import RecapSlide from "./slides/RecapSlide"
import ExamLinkSlide from "./slides/ExamLinkSlide"
import { interactionStyles } from "./interactions/_shared"

/**
 * LessonRunner — orchestrates slides, navigation, progress, persistence.
 */
type Props = { lesson: Lesson }

export default function LessonRunner({ lesson }: Props) {
  const total = lesson.slides.length
  const [idx, setIdx] = useState(0)
  const [progress, setProgress] = useState<LessonProgress | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [showAlt, setShowAlt] = useState(false)

  useEffect(() => {
    let alive = true
    loadProgress(lesson.lessonId).then(p => {
      if (!alive) return
      setProgress(p)
      setIdx(Math.min(p.currentSlideIdx, total - 1))
      setHydrated(true)
    })
    return () => { alive = false }
  }, [lesson.lessonId, total])

  const slide = lesson.slides[idx]
  const slideState = progress?.slideStates[slide?.id ?? ""]

  const canAdvance = useMemo(() => {
    if (!slide) return false
    if (slide.advance === "manual") return true
    if (slide.advance === "onSuccess") return slideState?.completed ?? false
    if (typeof slide.advance === "object" && slide.advance.kind === "timer") {
      return slideState?.completed ?? false
    }
    return false
  }, [slide, slideState])

  const persist = useCallback((next: LessonProgress) => {
    setProgress(next)
    void saveProgress(next)
  }, [])

  const goNext = useCallback(() => {
    if (!canAdvance) return
    if (idx >= total - 1) {
      if (typeof window !== "undefined") {
        window.location.href = `/dashboard/maths/${lesson.source.unit}/${lesson.source.topic}`
      }
      return
    }
    setShowAlt(false)
    const nextIdx = idx + 1
    setIdx(nextIdx)
    if (progress) persist({ ...progress, currentSlideIdx: nextIdx })
  }, [canAdvance, idx, total, progress, persist, lesson.source])

  const goPrev = useCallback(() => {
    if (idx <= 0) return
    setShowAlt(false)
    const prevIdx = idx - 1
    setIdx(prevIdx)
    if (progress) persist({ ...progress, currentSlideIdx: prevIdx })
  }, [idx, progress, persist])

  const markComplete = useCallback((data?: Record<string, unknown>) => {
    if (!progress || !slide) return
    const next = updateSlideState(progress, slide.id, { completed: true, data })
    next.currentSlideIdx = idx
    persist(next)
  }, [progress, slide, idx, persist])

  // Optional timer-based advance
  useEffect(() => {
    if (!slide) return
    if (typeof slide.advance !== "object" || slide.advance.kind !== "timer") return
    if (slideState?.completed) return
    const t = setTimeout(() => markComplete({ via: "timer" }), slide.advance.afterMs)
    return () => clearTimeout(t)
  }, [slide, slideState, markComplete])

  const exitHref = `/dashboard/maths/${lesson.source.unit}/${lesson.source.topic}`

  if (!hydrated || !slide || !progress) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <p className="text-[11px] font-mono text-[#3a4a5a] tracking-[2px] uppercase">loading…</p>
      </div>
    )
  }

  const wide = isWideSlide(slide)

  return (
    <>
      <style jsx global>{interactionStyles}</style>
      <SlideFrame
        slideIdx={idx}
        totalSlides={total}
        title={slide.title ?? lesson.title}
        canAdvance={canAdvance}
        wide={wide}
        showExplainAgain={Boolean(slide.altExplain) && !showAlt}
        hintText={getHint(slide)}
        exitHref={exitHref}
        onPrev={goPrev}
        onNext={goNext}
        onExplainAgain={() => setShowAlt(true)}
      >
        <SlideDispatcher
          slide={showAlt && slide.altExplain ? applyAltExplain(slide) : slide}
          onComplete={markComplete}
          onAdvance={goNext}
          canAdvance={canAdvance}
          savedData={slideState?.data}
        />
      </SlideFrame>
    </>
  )
}

const WIDE_INTERACTION_KINDS = new Set(["widgetCanvas", "clickOnGrid"])

function isWideSlide(slide: Slide): boolean {
  if (slide.kind === "interaction" || slide.kind === "verify") {
    return WIDE_INTERACTION_KINDS.has(slide.interaction?.kind ?? "")
  }
  if (slide.kind === "examLink") {
    return WIDE_INTERACTION_KINDS.has(slide.interaction?.kind ?? "")
  }
  if (slide.kind === "concept" || slide.kind === "hook" || slide.kind === "recap") {
    const v = (slide as { visual?: { kind?: string } }).visual
    if (v?.kind === "iframe") return true
  }
  return false
}

function SlideDispatcher({
  slide,
  onComplete,
  onAdvance,
  canAdvance,
  savedData,
}: {
  slide: Slide
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance: () => void
  canAdvance: boolean
  savedData?: Record<string, unknown>
}) {
  switch (slide.kind) {
    case "hook":
      return <HookSlide slide={slide} onAdvance={onAdvance} />
    case "concept":
      return <ConceptSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} canAdvance={canAdvance} />
    case "interaction":
    case "verify":
      return <InteractionSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} savedData={savedData} />
    case "recap":
      return <RecapSlide slide={slide} onAdvance={onAdvance} />
    case "examLink":
      return <ExamLinkSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} savedData={savedData} />
  }
}

function getHint(slide: Slide): string | undefined {
  if (slide.kind === "interaction" || slide.kind === "verify") {
    return slide.interaction?.hint
  }
  if (slide.kind === "examLink") {
    return slide.interaction?.hint
  }
  return undefined
}

/**
 * When the student taps "explain another way", we overlay the altExplain
 * fields onto a shallow copy of the current slide so the same dispatcher
 * can render it without a separate path.
 */
function applyAltExplain(slide: Slide): Slide {
  const alt = slide.altExplain
  if (!alt) return slide
  // shallow merge; interaction wins over visual if provided
  const next: Slide = { ...slide }
  if (alt.prompt !== undefined) next.prompt = alt.prompt
  if (alt.visual !== undefined && "visual" in next) {
    (next as { visual?: unknown }).visual = alt.visual
  }
  if (alt.interaction !== undefined && (next.kind === "interaction" || next.kind === "verify")) {
    next.interaction = alt.interaction
  }
  return next
}
