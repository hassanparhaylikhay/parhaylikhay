/**
 * One beat of a lesson: one phrase, one idea, one thing to do or watch.
 * Every lesson's beats have this shape; only the board (`S`) differs.
 */

import type { WalkStep } from "./walk"

export interface BeatOf<S> {
  id: string
  /** This beat starts a new part of the lesson: its title comes up first (chapter.ts). */
  chapter?: string
  /** The one phrase on screen. $...$ is KaTeX; *word* is a word to learn, in yellow. */
  say: string
  /** Set the whole board for this beat, so any beat can be opened cold (?beat=N). */
  enter: (S: S) => void
  /** A doing beat finishes itself when this turns true. */
  done?: (S: S) => boolean
  /** Continue button: "" is a plain arrow; a word is a word button; undefined means none. */
  cta?: string
  /** Seconds before the button appears. */
  ctaAfter?: number
  /** A playing beat: when done, the arrow appears and the student chooses when to go on. */
  free?: boolean
  /** Seconds of play before a playing beat offers to move on. */
  minPlay?: number
  /** Milliseconds a finished doing beat waits before moving on (default 1800). */
  advanceAfter?: number
  /** The continue button goes back to the first beat. */
  restart?: boolean
  /** "Show me how": the worked solution, one step at a time, for a student who is stuck. */
  walk?: WalkStep<S>[]
}
