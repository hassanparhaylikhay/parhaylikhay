"use client"

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
  savedData,
}: {
  slide: InteractionSlideT
  onComplete: (data?: Record<string, unknown>) => void
  savedData?: Record<string, unknown>
}) {
  const inj = slide.interaction
  const baseConfig = { ...(inj.config as Record<string, unknown>), prompt: (inj.config as Record<string, unknown>).prompt ?? slide.prompt }

  return (
    <div className="w-full flex flex-col items-center">
      {(() => {
        const props = { config: baseConfig, onComplete, savedData }
        switch (inj.kind) {
          case "clickToIdentify":     return <ClickToIdentify     {...(props as { config: ClickToIdentifyConfig;     onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "dragToPosition":      return <DragToPosition      {...(props as { config: DragToPositionConfig;      onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "manipulateAndVerify": return <ManipulateAndVerify {...(props as { config: ManipulateAndVerifyConfig; onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "selectFromOptions":   return <SelectFromOptions   {...(props as { config: SelectFromOptionsConfig;   onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "placeLabel":          return <PlaceLabel          {...(props as { config: PlaceLabelConfig;          onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "orderSteps":          return <OrderSteps          {...(props as { config: OrderStepsConfig;          onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "adjustSlider":        return <AdjustSlider        {...(props as { config: AdjustSliderConfig;        onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "widgetCanvas":        return <WidgetCanvas        {...(props as { config: WidgetCanvasConfig;        onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
          case "clickOnGrid":         return <ClickOnGrid         {...(props as { config: ClickOnGridConfig;         onComplete: typeof onComplete; savedData?: Record<string, unknown> })} />
        }
      })()}
    </div>
  )
}
