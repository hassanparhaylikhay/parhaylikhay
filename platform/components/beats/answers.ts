/**
 * Typed answers on the keypad. Digits fill the box, Enter checks it. A
 * guess is never wrong ("Spot on." or "Let's see."); a real answer that is
 * wrong is counted, shakes, and calls the beat's help for that try.
 *
 * Shared by the lessons whose answers are whole numbers in one box.
 */

export interface Answer<S> {
  answer: number
  value: string
  tries: number
  state: "idle" | "wrong" | "right" | "guessed"
  wrongAt: number
  hints: string[]
  guess?: boolean
  onRight?: (S: S) => void
  help?: (S: S, tries: number) => void
}

interface AnswerScene<S> {
  input: Answer<S> | null
  time: number
  vis: { hint: { t: number } }
  note: { text: string; until: number; tone: "wrong" | "calm" } | null
}

export function typeKey<S extends AnswerScene<S>>(S: S, key: string) {
  const inp = S.input
  if (!inp || inp.state === "right" || inp.state === "guessed") return
  if (key === "back") { inp.value = inp.value.slice(0, -1); inp.state = "idle"; return }
  if (key === "go") { check(S); return }
  if (/^\d$/.test(key) && inp.value.length < 4) {
    if (inp.state === "wrong") inp.value = ""
    inp.value += key
    inp.state = "idle"
  }
}

function check<S extends AnswerScene<S>>(S: S) {
  const inp = S.input!
  if (!inp.value) return
  const v = Number(inp.value)
  if (inp.guess) {
    const hit = v === inp.answer
    inp.state = hit ? "right" : "guessed"
    S.note = { text: hit ? "Spot on." : "Let's see.", until: S.time + 2.4, tone: "calm" }
    inp.onRight?.(S)
    return
  }
  if (v === inp.answer) {
    inp.state = "right"
    inp.onRight?.(S)
    return
  }
  inp.tries++
  inp.state = "wrong"
  inp.wrongAt = S.time
  inp.help?.(S, inp.tries)
  if (inp.hints.length) S.vis.hint.t = 1
}
