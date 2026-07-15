"use client"

import { useEffect, useRef } from "react"
import type { InteractionSlide as InteractionSlideT } from "@/lib/lesson-mode/types"
import ClickToIdentify, { type ClickToIdentifyConfig } from "../interactions/ClickToIdentify"
import DragToPosition, { type DragToPositionConfig } from "../interactions/DragToPosition"
import ManipulateAndVerify, { type ManipulateAndVerifyConfig } from "../interactions/ManipulateAndVerify"
import SelectFromOptions, { type SelectFromOptionsConfig } from "../interactions/SelectFromOptions"
import PlaceLabel, { type PlaceLabelConfig } from "../interactions/PlaceLabel"
import OrderSteps, { type OrderStepsConfig } from "../interactions/OrderSteps"
import AdjustSlider, { type AdjustSliderConfig } from "../interactions/AdjustSlider"
import WidgetCanvas, { type WidgetCanvasConfig } from "../interactions/WidgetCanvas"
import ClickOnGrid, { type ClickOnGridConfig } from "../interactions/ClickOnGrid"
import AnswerBuilder, { type AnswerBuilderConfig } from "../interactions/AnswerBuilder"
import StepThrough, { type StepThroughConfig, type StepNav } from "../interactions/StepThrough"
import StepSolve, { type StepSolveConfig } from "../interactions/StepSolve"
import MarkScript, { type MarkScriptConfig } from "../interactions/MarkScript"

/**
 * InteractionSlide — routes a slide of kind="interaction" (or "verify") to the
 * right interaction component.
 *
 * The slide-level title is intentionally NOT rendered here. Every interaction
 * already shows its own prompt (centered above the canvas for vertical-stack
 * layouts, or in the side panel for widgetCanvas / clickOnGrid). A separate
 * h2 above was redundant — and on widget puzzles with tall pmatrix titles it
 * pushed the canvas below the fold and forced scroll. The title is still
 * announced via SlideFrame's sr-only span and shown in the chrome top strip,
 * so it remains accessible.
 */
export default function InteractionSlide({
  slide,
  onComplete,
  onAdvance,
  savedData,
  onShowMeUsed,
  onRegisterStepNav,
}: {
  slide: InteractionSlideT
  onComplete: (data?: Record<string, unknown>) => void
  onAdvance?: () => void
  savedData?: Record<string, unknown>
  onShowMeUsed?: () => void
  onRegisterStepNav?: (nav: StepNav | null) => void
}) {
  const inj = slide.interaction
  const baseConfig = {
    ...(inj.config as Record<string, unknown>),
    prompt: (inj.config as Record<string, unknown>).prompt ?? slide.prompt,
    // Verify slides run under exam conditions: interactions hide their
    // show-me / eliminate / reveal affordances. (LessonRunner already
    // suppresses the 20s hint banner for verify slides.)
    ...(slide.kind === "verify" ? { noHelp: true } : null),
  }

  // widgetCanvas / clickOnGrid handle their own post-success pause + auto-advance.
  // For every other interaction kind, wrap onComplete so the lesson auto-advances
  // 2800ms after the student lands on the correct/done state — same pause as the
  // manipulatives, so the student gets a beat to read the success text and see
  // the green pulse before the next slide loads.
  //
  // The pending timer MUST be cleared when the slide changes. onAdvance is a
  // useCallback in LessonRunner closing over idx — if the student manually
  // clicks next before the timer fires, the stale closure runs setIdx(oldIdx+1)
  // and bounces them backwards to where they already were. The unmount cleanup
  // on slide.id covers both manual nav and the slide being swapped out.
  // stepThrough manages its own flow: completion happens on reaching the
  // final step, and the student leaves via the explicit "continue" button
  // (or the bottom-bar next), never a timer.
  const SELF_ADVANCING = new Set(["widgetCanvas", "clickOnGrid", "stepThrough"])
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) {
        clearTimeout(advanceTimerRef.current)
        advanceTimerRef.current = null
      }
    }
  }, [slide.id])
  const wrappedComplete = (data?: Record<string, unknown>) => {
    onComplete(data)
    if (onAdvance && !SELF_ADVANCING.has(inj.kind) && advanceTimerRef.current === null) {
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        onAdvance()
      }, 2800)
    }
  }

  return (
    <div className="w-full flex flex-col items-center">
      {(() => {
        const baseProps = { config: baseConfig, onComplete: wrappedComplete, savedData, onShowMeUsed }
        const advProps = { config: baseConfig, onComplete, savedData, onShowMeUsed, onAdvance }
        switch (inj.kind) {
          case "clickToIdentify":     return <ClickToIdentify     {...(baseProps as { config: ClickToIdentifyConfig;     onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "dragToPosition":      return <DragToPosition      {...(baseProps as { config: DragToPositionConfig;      onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "manipulateAndVerify": return <ManipulateAndVerify {...(baseProps as { config: ManipulateAndVerifyConfig; onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "selectFromOptions":   return <SelectFromOptions   {...(baseProps as { config: SelectFromOptionsConfig;   onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "placeLabel":          return <PlaceLabel          {...(baseProps as { config: PlaceLabelConfig;          onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "orderSteps":          return <OrderSteps          {...(baseProps as { config: OrderStepsConfig;          onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "adjustSlider":        return <AdjustSlider        {...(baseProps as { config: AdjustSliderConfig;        onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "widgetCanvas":        return <WidgetCanvas        {...(advProps as { config: WidgetCanvasConfig;        onComplete: typeof onComplete; onAdvance?: () => void; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "clickOnGrid":         return <ClickOnGrid         {...(advProps as { config: ClickOnGridConfig;         onComplete: typeof onComplete; onAdvance?: () => void; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "answerBuilder":       return <AnswerBuilder       {...(baseProps as { config: AnswerBuilderConfig;       onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "stepThrough":         return <StepThrough         {...(advProps as unknown as { config: StepThroughConfig; onComplete: typeof onComplete; onAdvance?: () => void; savedData?: Record<string, unknown> })} onRegisterNav={onRegisterStepNav} />
          case "stepSolve":           return <StepSolve           {...(baseProps as unknown as { config: StepSolveConfig; onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
          case "markScript":          return <MarkScript          {...(baseProps as unknown as { config: MarkScriptConfig; onComplete: typeof onComplete; savedData?: Record<string, unknown>; onShowMeUsed?: () => void })} />
        }
      })()}
    </div>
  )
}
