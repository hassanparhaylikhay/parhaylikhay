/**
 * "Show me how": for a student who is stuck on a question. After 30 seconds
 * (or three wrong answers) a button offers the worked solution. Each step
 * says one thing, lights up one thing on the figure, and writes one line of
 * working under it; the arrow moves to the next step. At the end the
 * keypad comes back and the student types the answer in themselves.
 *
 * Shared by every beat lesson. A lesson's scene only needs the fields in
 * `WalkScene`, and its Stage draws `walkTex` on the bottom line.
 */

export interface WalkStep<S> {
  /** what the teacher says at this step */
  say: string
  /** the line of working under the figure (kept until a later step replaces it) */
  tex?: string
  /** what lights up or appears on the figure */
  show?: (S: S) => void
}

export const SHOW_ME_AFTER = 30
export const SHOW_ME_TRIES = 3
export const SHOW_ME_LABEL = "Show me how"
export const TYPE_IT_IN = "Now you type it in."
/** seconds a step stays before its arrow appears */
export const STEP_READ = 1.2

export interface WalkScene {
  time: number
  beatStart: number
  input: { state: string; tries: number; value: string } | null
  walkTex: string | null
  vis: { keypad: { t: number }; hint: { t: number }; line: { t: number } }
  note: unknown
}

/** Whether to offer the walkthrough now. `at` is the step the student is on (-1 before it starts). */
export function offerShowMe(S: WalkScene, steps: unknown[] | undefined, at: number): boolean {
  if (!steps?.length || at >= 0 || !S.input) return false
  if (S.input.state === "right" || S.input.state === "guessed") return false
  return S.time - S.beatStart >= SHOW_ME_AFTER || S.input.tries >= SHOW_ME_TRIES
}

/** Put one step on the board: its picture, its line of working; keypad away. */
export function applyStep<S extends WalkScene>(S: S, step: WalkStep<S>) {
  S.note = null
  step.show?.(S)
  // a step with no working of its own keeps the line before it; the
  // student's wrong answer never shows during the walkthrough
  S.walkTex = step.tex ?? S.walkTex ?? ""
  S.vis.keypad.t = 0
  S.vis.hint.t = 0
  S.vis.line.t = 1
}

/** Walkthrough over: the keypad comes back with an empty box. */
export function endWalk(S: WalkScene) {
  S.walkTex = null
  S.vis.keypad.t = 1
  if (S.input) {
    S.input.value = ""
    S.input.state = "idle"
  }
}
