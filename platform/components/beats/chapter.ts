/**
 * Section titles. A beat that starts a new part of the lesson carries a
 * `chapter`. Before that beat, the part's name comes up alone on a plain board,
 * stays a moment, and leaves on its own; a tap sends it away sooner. The
 * beat itself starts as the title leaves, so its timers start then too.
 *
 * Shown when the student arrives by going forward. Going back, or opening a
 * beat directly with ?beat=N, skips it.
 */

/** seconds the title stays before it starts to leave */
export const CARD_HOLD = 1.9
/** seconds it takes to leave */
export const CARD_OUT = 0.45

export interface Card {
  text: string
  key: string
  /** scene time it came up */
  start: number
  /** scene time it started to leave, or null while it stays */
  leaving: number | null
}

/** The title card for beat `n`, or null when that beat starts no new part. */
export function cardFor(beats: { chapter?: string }[], n: number, now: number): Card | null {
  const text = beats[n]?.chapter
  if (!text) return null
  return { text, key: `${n}-${now.toFixed(3)}`, start: now, leaving: null }
}

/** What Shell needs to draw the card. */
export function cardView(c: Card | null) {
  return c ? { text: c.text, key: c.key, leaving: c.leaving !== null } : null
}
