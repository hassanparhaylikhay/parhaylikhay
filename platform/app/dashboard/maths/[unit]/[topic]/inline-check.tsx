"use client"

import { useState } from "react"
import type { Check } from "@/lib/lesson-loader"

export default function InlineCheck({ checks }: { checks: Check[] }) {
  const [idx, setIdx] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [done, setDone] = useState(false)

  if (done) {
    return (
      <div className="check-card check-done">
        <p className="check-kicker">CHECK COMPLETE</p>
        <p className="check-result">{correct} <span className="check-result-total">/ {checks.length}</span></p>
        <p className="check-result-msg">
          {correct === checks.length
            ? "Solid — the ideas in this part are locked in."
            : correct >= checks.length - 1
            ? "Almost there. Review the one you missed before moving on."
            : "Worth re-reading this part before continuing."}
        </p>
        <button
          className="check-retry"
          onClick={() => { setIdx(0); setChosen(null); setCorrect(0); setDone(false) }}
        >
          Try again
        </button>
      </div>
    )
  }

  const q = checks[idx]
  const isRight = chosen !== null && chosen === q.correct

  function pick(i: number) {
    if (chosen !== null) return
    setChosen(i)
    if (i === q.correct) setCorrect(c => c + 1)
  }

  function next() {
    if (idx + 1 >= checks.length) {
      setDone(true)
    } else {
      setIdx(idx + 1)
      setChosen(null)
    }
  }

  return (
    <div className="check-card">
      <div className="check-head">
        <span className="check-kicker">QUICK CHECK</span>
        <span className="check-progress">{idx + 1} / {checks.length}</span>
      </div>

      <p className="check-question">{q.q}</p>

      <div className="check-options">
        {q.options.map((opt, i) => {
          const reveal = chosen !== null
          const isCorrectOpt = i === q.correct
          const isChosenOpt = i === chosen
          let cls = "check-option"
          if (reveal && isCorrectOpt) cls += " correct"
          else if (reveal && isChosenOpt && !isCorrectOpt) cls += " wrong"
          return (
            <button
              key={i}
              className={cls}
              onClick={() => pick(i)}
              disabled={chosen !== null}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {chosen !== null && (
        <div className={`check-feedback ${isRight ? "ok" : "bad"}`}>
          <p className="check-feedback-line">
            {isRight ? "✓ Correct." : "✗ Not quite."}
          </p>
          {q.explain && <p className="check-explain">{q.explain}</p>}
          <button className="check-next" onClick={next}>
            {idx + 1 >= checks.length ? "Finish check" : "Next"}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
