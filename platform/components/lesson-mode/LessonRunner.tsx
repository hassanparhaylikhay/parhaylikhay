"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Lesson, Slide, LessonProgress } from "@/lib/lesson-mode/types"
import { loadProgress, saveProgress, updateSlideState } from "@/lib/lesson-mode/storage"
import SlideFrame, { type ChapterInfo } from "./SlideFrame"
import HookSlide from "./slides/HookSlide"
import ConceptSlide from "./slides/ConceptSlide"
import InteractionSlide from "./slides/InteractionSlide"
import RecapSlide from "./slides/RecapSlide"
import ExamLinkSlide from "./slides/ExamLinkSlide"
import { interactionStyles } from "./interactions/_shared"
import type { StepNav } from "./interactions/StepThrough"

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
  // Tracks whether the student has tapped "show me a hint" on the current slide.
  // The more prominent "explain another way" link only appears once they have —
  // so it surfaces as the natural next step after a hint, not before the student
  // has even tried.
  const [showMeUsed, setShowMeUsed] = useState(false)
  // Small "welcome back" toast shown when a returning student resumes mid-lesson.
  const [welcomeBack, setWelcomeBack] = useState<string | null>(null)
  const welcomeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Step-through slides register a nav delegate so the lesson's own prev/next
  // buttons (and arrow keys) walk the steps before they move between slides.
  const [stepNav, setStepNav] = useState<StepNav | null>(null)
  const registerStepNav = useCallback((nav: StepNav | null) => setStepNav(nav), [])

  // Chapter ranges, derived once from the slides' chapter tags.
  const chapters: ChapterInfo[] | null = useMemo(() => {
    if (!lesson.chapters?.length) return null
    const out: ChapterInfo[] = []
    for (const c of lesson.chapters) {
      let start = -1
      let end = -1
      lesson.slides.forEach((s, i) => {
        if (s.chapter !== c.id) return
        if (start < 0) start = i
        end = i
      })
      if (start >= 0) out.push({ id: c.id, title: c.title, start, end })
    }
    return out.length > 0 ? out : null
  }, [lesson])

  const totalMarks = useMemo(
    () => lesson.slides.reduce((sum, s) => sum + (s.marks ?? 0), 0),
    [lesson]
  )
  const bankedMarks = useMemo(() => {
    if (!progress) return 0
    return lesson.slides.reduce(
      (sum, s) => sum + ((s.marks && progress.slideStates[s.id]?.completed) ? s.marks : 0),
      0
    )
  }, [lesson, progress])

  useEffect(() => {
    let alive = true
    loadProgress(lesson.lessonId).then(p => {
      if (!alive) return
      setProgress(p)
      const resumeIdx = Math.min(p.currentSlideIdx, total - 1)
      setIdx(resumeIdx)
      setHydrated(true)
      // A returning student gets one quiet orientation beat instead of being
      // dropped silently onto slide 34.
      if (resumeIdx >= 3 && resumeIdx < total - 1) {
        const ch = lesson.chapters?.length
          ? lesson.chapters.find(c => lesson.slides[resumeIdx]?.chapter === c.id)
          : null
        setWelcomeBack(ch ? `Welcome back. You are in ${ch.title}.` : "Welcome back. Carrying on where you left off.")
        welcomeTimer.current = setTimeout(() => setWelcomeBack(null), 4500)
      }
    })
    return () => {
      alive = false
      if (welcomeTimer.current) clearTimeout(welcomeTimer.current)
    }
  }, [lesson, total])

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
    setShowMeUsed(false)
    const nextIdx = idx + 1
    setIdx(nextIdx)
    if (progress) persist({ ...progress, currentSlideIdx: nextIdx })
  }, [canAdvance, idx, total, progress, persist, lesson.source])

  const goPrev = useCallback(() => {
    if (idx <= 0) return
    setShowAlt(false)
    setShowMeUsed(false)
    const prevIdx = idx - 1
    setIdx(prevIdx)
    if (progress) persist({ ...progress, currentSlideIdx: prevIdx })
  }, [idx, progress, persist])

  const handleShowMeUsed = useCallback(() => setShowMeUsed(true), [])

  // On step-through slides the bottom-bar buttons drive the steps first and
  // only cross slides once the walkthrough is exhausted in that direction.
  // A slide the student has ALREADY completed doesn't capture next: revisits
  // move on immediately (the aside's step button still replays the steps).
  const handleNext = useCallback(() => {
    if (!canAdvance && stepNav?.hasNext) { stepNav.next(); return }
    goNext()
  }, [canAdvance, stepNav, goNext])
  const handlePrev = useCallback(() => {
    if (stepNav?.hasPrev) { stepNav.prev(); return }
    goPrev()
  }, [stepNav, goPrev])

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
        canAdvance={canAdvance || Boolean(stepNav?.hasNext)}
        wide={wide}
        chapters={chapters}
        marks={totalMarks > 0 ? { banked: bankedMarks, total: totalMarks } : null}
        altAvailable={Boolean(slide.altExplain) && !showAlt}
        showMeUsed={showMeUsed}
        hintText={getHint(slide)}
        exitHref={exitHref}
        onPrev={handlePrev}
        onNext={handleNext}
        onExplainAgain={() => setShowAlt(true)}
      >
        <SlideDispatcher
          slide={showAlt && slide.altExplain ? applyAltExplain(slide) : slide}
          onComplete={markComplete}
          onAdvance={goNext}
          canAdvance={canAdvance}
          savedData={slideState?.data}
          onShowMeUsed={handleShowMeUsed}
          onRegisterStepNav={registerStepNav}
        />
      </SlideFrame>
      {welcomeBack && (
        <div
          className="pl-fade-in fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg border border-[#1a3350] bg-[#0b1118] text-[12px] font-mono text-[#7a7875] shadow-lg pointer-events-none"
        >
          {welcomeBack}
        </div>
      )}
    </>
  )
}

const WIDE_INTERACTION_KINDS = new Set(["widgetCanvas", "clickOnGrid", "stepThrough"])
// Interactions that go wide only when they carry a contextHtml diagram
// (canvas on the left, controls in the right aside).
const CONTEXT_WIDE_KINDS = new Set(["selectFromOptions", "placeLabel", "answerBuilder", "stepSolve"])

function interactionIsWide(interaction: { kind?: string; config?: Record<string, unknown> } | undefined): boolean {
  const k = interaction?.kind ?? ""
  if (WIDE_INTERACTION_KINDS.has(k)) return true
  if (CONTEXT_WIDE_KINDS.has(k)) {
    const ctx = (interaction?.config as { contextHtml?: string } | undefined)?.contextHtml
    if (ctx) return true
  }
  return false
}

function isWideSlide(slide: Slide): boolean {
  if (slide.kind === "interaction" || slide.kind === "verify") {
    return interactionIsWide(slide.interaction)
  }
  if (slide.kind === "examLink") {
    return interactionIsWide(slide.interaction)
  }
  if (slide.kind === "concept" || slide.kind === "hook" || slide.kind === "recap") {
    const v = (slide as { visual?: { kind?: string; wide?: boolean } }).visual
    if (v?.kind === "iframe") return true
    // html visuals opted in via wide=true also get the 1200px max-width so the
    // canvas-left + 320px-aside-right layout has room to breathe.
    if (v?.kind === "html" && v.wide) return true
  }
  return false
}

function SlideDispatcher({
  slide,
  onComplete,
  onAdvance,
  canAdvance,
  savedData,
  onShowMeUsed,
  onRegisterStepNav,
}: {
  slide: Slide
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance: () => void
  canAdvance: boolean
  savedData?: Record<string, unknown>
  onShowMeUsed?: () => void
  onRegisterStepNav?: (nav: StepNav | null) => void
}) {
  switch (slide.kind) {
    case "hook":
      return <HookSlide slide={slide} onAdvance={onAdvance} />
    case "concept":
      return <ConceptSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} canAdvance={canAdvance} />
    case "interaction":
    case "verify":
      return <InteractionSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} savedData={savedData} onShowMeUsed={onShowMeUsed} onRegisterStepNav={onRegisterStepNav} />
    case "recap":
      return <RecapSlide slide={slide} onAdvance={onAdvance} />
    case "examLink":
      return <ExamLinkSlide slide={slide} onComplete={onComplete} onAdvance={onAdvance} savedData={savedData} onShowMeUsed={onShowMeUsed} />
  }
}

function getHint(slide: Slide): string | undefined {
  // Verify slides are exam conditions: no hints, no show-me. The whyWrong
  // feedback after a wrong attempt still teaches, but there is no help
  // BEFORE the attempt, which is what makes the check honest.
  if (slide.kind === "verify") return undefined
  if (slide.kind === "interaction") {
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
  if (alt.prompt !== undefined) {
    next.prompt = alt.prompt
    // Interactions read their prompt from interaction.config.prompt first
    // (InteractionSlide falls back to slide.prompt only when the config has
    // none). Thread the alt prompt into the config too, otherwise "explain
    // another way" silently shows the original text on most puzzles.
    if ((next.kind === "interaction" || next.kind === "verify" || next.kind === "examLink") && next.interaction) {
      next.interaction = {
        ...next.interaction,
        config: { ...next.interaction.config, prompt: alt.prompt },
      }
    }
  }
  if (alt.visual !== undefined && "visual" in next) {
    (next as { visual?: unknown }).visual = alt.visual
  }
  if (alt.interaction !== undefined && (next.kind === "interaction" || next.kind === "verify" || next.kind === "examLink")) {
    next.interaction = alt.interaction
  }
  return next
}
