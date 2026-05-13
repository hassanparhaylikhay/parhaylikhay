/**
 * Lesson Mode — schema
 *
 * A Lesson is a JSON file at /content/lessons/<lessonId>/lesson.json.
 * It is rendered slide-by-slide by LessonRunner. Every slide is one focused
 * baby step. Most slides require the student to physically interact.
 */

// ─── advance conditions ────────────────────────────────────────────────

export type AdvanceCondition =
  | "manual"                                // student clicks Next (default for concept/recap)
  | "onSuccess"                             // unlocks when success fires (interactions)
  | { kind: "timer"; afterMs: number }      // rarely used; for short auto-reveals

// ─── interactions ──────────────────────────────────────────────────────

export type InteractionKind =
  | "clickToIdentify"      // tap a region of a diagram
  | "dragToPosition"       // drag a shape/marker to a target location
  | "manipulateAndVerify"  // adjust values until a condition is met
  | "selectFromOptions"    // pick from N visual or text options
  | "placeLabel"           // drag labels onto slots
  | "orderSteps"           // arrange steps in order
  | "adjustSlider"         // change a parameter, watch the geometry, settle on a value

export interface InteractionSpec {
  kind: InteractionKind
  /** Free-form per-interaction config. Each interaction component validates its own shape. */
  config: Record<string, unknown>
  /** Pre-defined hint shown after the student has been stuck for ~20s (optional). */
  hint?: string
  /** What the "show me" button reveals — usually the correct end-state. */
  reveal?: Record<string, unknown>
}

// ─── visual primitives (for concept / recap / examLink slides) ─────────

export type VisualSpec =
  | { kind: "iframe"; src: string; height?: number }
  | { kind: "html"; content: string }                       // raw HTML/CSS diagram
  | { kind: "katex"; tex: string; display?: boolean }       // a single equation
  | { kind: "shape"; svg: string }                          // small inline SVG snippet
  | { kind: "stack"; children: VisualSpec[]; gap?: number } // vertical composition
  | { kind: "row"; children: VisualSpec[]; gap?: number }   // horizontal composition

// ─── slides ────────────────────────────────────────────────────────────

export type SlideKind = "hook" | "concept" | "interaction" | "verify" | "recap" | "examLink"

interface BaseSlide {
  id: string
  kind: SlideKind
  /** Small heading at the top of the slide. Keep it tight (3-7 words). */
  title?: string
  /** One-line instruction or question. NEVER more than a single sentence. */
  prompt?: string
  /** Tiny mono caption under the canvas. Optional, rarely used. */
  caption?: string
  /** How the slide advances to the next one. */
  advance: AdvanceCondition
  /** Re-explanation when the student taps "explain another way". */
  altExplain?: { prompt?: string; visual?: VisualSpec; interaction?: InteractionSpec }
}

export interface HookSlide extends BaseSlide {
  kind: "hook"
  visual: VisualSpec
}

export interface ConceptSlide extends BaseSlide {
  kind: "concept"
  visual?: VisualSpec
  /** Tap-to-reveal sequence. Each tap unlocks the next item. */
  reveals?: Array<{ visual?: VisualSpec; text?: string }>
}

export interface InteractionSlide extends BaseSlide {
  kind: "interaction" | "verify"
  interaction: InteractionSpec
}

export interface RecapSlide extends BaseSlide {
  kind: "recap"
  visual?: VisualSpec
  /** Short bullets — each ≤ 8 words. */
  bullets?: string[]
}

export interface ExamLinkSlide extends BaseSlide {
  kind: "examLink"
  /** e.g. "B1", "M1", "A1". Renders as a small mark pill. */
  markCode?: string
  visual?: VisualSpec
  /** Optional micro-interaction to ground the marking point. */
  interaction?: InteractionSpec
}

export type Slide =
  | HookSlide
  | ConceptSlide
  | InteractionSlide
  | RecapSlide
  | ExamLinkSlide

// ─── lesson ────────────────────────────────────────────────────────────

export interface Lesson {
  /** Stable identifier, used as the storage key (e.g. "07-01-p1"). */
  lessonId: string
  /** Maps the lesson back to the revision-notes route — used for the exit button. */
  source: { unit: string; topic: string; part: string }
  title: string
  /** Rough length for the entry card. */
  estimatedMinutes?: number
  slides: Slide[]
}

// ─── per-student progress ──────────────────────────────────────────────

export interface SlideState {
  /** True once this slide's advance condition has been satisfied at least once. */
  completed: boolean
  /** Free-form per-interaction state (last drag position, last selected option, etc.). */
  data?: Record<string, unknown>
}

export interface LessonProgress {
  lessonId: string
  currentSlideIdx: number
  slideStates: Record<string, SlideState>   // keyed by slide.id
  updatedAt: string
}
