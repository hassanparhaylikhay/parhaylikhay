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
  | "tapDiagram"           // tap the actual part of the figure the question asks about
  | "clickToIdentify"      // pick one of N side-by-side mini-diagram cards
  | "dragToPosition"       // drag a shape/marker to a target location
  | "manipulateAndVerify"  // adjust values until a condition is met
  | "selectFromOptions"    // pick from N visual or text options
  | "placeLabel"           // drag labels onto slots
  | "orderSteps"           // arrange steps in order
  | "adjustSlider"         // change a parameter, watch the geometry, settle on a value
  | "widgetCanvas"         // embed a polished HTML widget; listens for pl-lesson-success
  | "clickOnGrid"          // tap a grid coordinate; verifies against a target point
  | "answerBuilder"        // assemble the full examiner sentence part by part; each part earns its mark pill
  | "stepThrough"          // step-explorer widget whose stepper lives in the LESSON chrome, not inside the iframe
  | "stepSolve"            // build the exam script line by line: pick method lines (M1), type values (A1)
  | "markScript"           // play examiner: award/withhold each mark on a candidate script, then tap the fault line

export interface InteractionSpec {
  kind: InteractionKind
  /** Free-form per-interaction config. Each interaction component validates its own shape. */
  config: Record<string, unknown>
  /** Pre-defined hint shown after the student has been stuck for ~20s (optional). */
  hint?: string
  /** What the "show me" button reveals — usually the correct end-state. */
  reveal?: Record<string, unknown>
}

/**
 * A label positioned over a figure, in the figure's own 480x320 units.
 * Maths renders through KaTeX as real DOM above the SVG, never as SVG
 * <text> and never inside a foreignObject (which drifts on iOS Safari).
 */
export type CanvasLabelSpec = {
  x: number
  y: number
  /** Maths, rendered via KaTeX. */
  tex?: string
  /** A word or phrase, rendered in the UI face. */
  text?: string
  color?: string
  /** Font size in the figure's own units. */
  size?: number
  anchor?: "middle" | "start" | "end"
}

// ─── visual primitives (for concept / recap / examLink slides) ─────────

export type VisualSpec =
  | { kind: "iframe"; src: string; height?: number }
  | {
      kind: "html"
      content: string
      /** wide=true routes the concept slide to canvas-left + aside-right layout */
      wide?: boolean
      /**
       * KaTeX labels positioned over the diagram, in its own 480x320 units.
       * Maths on a figure never renders as SVG <text>: see CanvasLabel.
       */
      labels?: CanvasLabelSpec[]
    }
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
  /**
   * "Explain another way": an animated DEMONSTRATION of the method, drawn on
   * the canvas the student is working on (never a re-wording of the prompt,
   * which stays visible). `demoSvg` is a self-contained animated SVG.
   */
  altExplain?: { demoSvg?: string; visual?: VisualSpec; interaction?: InteractionSpec }
  /** Chapter this slide belongs to. Must match an id in Lesson.chapters. */
  chapter?: string
  /**
   * Exam marks banked when this slide is completed. Only set on slides that
   * rehearse real mark-scheme work (past-paper puzzles, answer builders,
   * verify questions). The chrome ledger sums these.
   */
  marks?: number
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
  /** Stable identifier, used as the storage key (e.g. "07-01" for the whole topic). */
  lessonId: string
  /** Maps the lesson back to the topic page (used for the exit button). */
  source: { unit: string; topic: string }
  title: string
  /** Rough length for the entry card. */
  estimatedMinutes?: number
  /**
   * Ordered chapters. Each slide's `chapter` field points at one of these ids.
   * Drives the segmented progress bar in the chrome (75 dots was unreadable
   * and overflowed the header; chapters read as a journey).
   */
  chapters?: Array<{ id: string; title: string; color?: string }>
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
