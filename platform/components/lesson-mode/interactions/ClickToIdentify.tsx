"use client"

import { useState } from "react"
import { COLOR, Prompt, HelperRow, MixedText, useShake, type InteractionProps } from "./_shared"

type Region = {
  id: string
  label: string
  isCorrect?: boolean
  /** Raw HTML/SVG to render inside the card. */
  content?: string
}

export type ClickToIdentifyConfig = {
  prompt?: string
  regions: Region[]
  /** Optional 1-line text that appears under the canvas after a correct click. */
  successText?: string
  /** What "show me" reveals — usually the id of the correct region. */
  revealId?: string
  /** Number of columns in the grid; defaults to regions.length. */
  cols?: number
  /** Verify slides: no show-me reveal. Injected by InteractionSlide. */
  noHelp?: boolean
}

/**
 * ClickToIdentify — student taps the correct region from a small grid.
 * Wrong taps shake. Correct tap green-pulses + fires onComplete.
 */
export default function ClickToIdentify({ config, onComplete, onShowMeUsed }: InteractionProps<ClickToIdentifyConfig>) {
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [shakeId, fireShake] = useShakeOn()

  const pickedRegion = picked !== null ? config.regions.find(r => r.id === picked) : null
  const isLocked = !!pickedRegion?.isCorrect

  function pick(id: string) {
    if (isLocked) return
    const r = config.regions.find(x => x.id === id)
    if (!r) return
    setPicked(id)
    if (r.isCorrect) {
      onComplete({ pickedId: id, attempts })
    } else {
      setAttempts(a => a + 1)
      fireShake(id)
    }
  }

  const cols = config.cols ?? config.regions.length

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>

      <div
        className="grid gap-3 sm:gap-4 w-full max-w-[720px]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {config.regions.map(r => {
          const isShakingThis = shakeId === r.id
          const isCorrectPick = picked === r.id && r.isCorrect
          const isWrongPick = picked === r.id && !r.isCorrect
          const isRevealedHit = revealed && r.id === config.revealId
          return (
            <button
              key={r.id}
              onClick={() => pick(r.id)}
              disabled={isLocked && !isCorrectPick}
              className={`relative rounded-xl border transition-all duration-300 p-3 sm:p-4 ${isShakingThis ? "pl-shake" : ""} ${isCorrectPick ? "pl-success-pulse" : ""}`}
              style={{
                borderColor: isCorrectPick || isRevealedHit
                  ? COLOR.green
                  : isWrongPick
                  ? COLOR.pink
                  : COLOR.border,
                background: isCorrectPick || isRevealedHit
                  ? "rgba(15,238,137,0.06)"
                  : isWrongPick
                  ? "rgba(255,70,112,0.04)"
                  : COLOR.card,
                cursor: isLocked && !isCorrectPick ? "default" : "pointer",
              }}
            >
              {r.content && (
                <div
                  className="aspect-square flex items-center justify-center mb-2"
                  dangerouslySetInnerHTML={{ __html: r.content }}
                />
              )}
              <p
                className="text-center text-[12px] sm:text-[13px] font-mono transition-colors duration-300"
                style={{
                  color: isCorrectPick || isRevealedHit
                    ? COLOR.green
                    : isWrongPick
                    ? COLOR.pink
                    : COLOR.text,
                }}
              >
                {r.label}
              </p>
            </button>
          )
        })}
      </div>

      {(isLocked || revealed) && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-6 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"
        />
      )}

      {!config.noHelp && (
        <HelperRow
          onShowMe={
            !isLocked && !revealed
              ? () => {
                  setRevealed(true)
                  onShowMeUsed?.()
                  onComplete({ revealed: true })
                }
              : undefined
          }
        />
      )}
    </div>
  )
}

function useShakeOn() {
  const [shakeId, setShakeId] = useState<string | null>(null)
  function fire(id: string) {
    setShakeId(id)
    setTimeout(() => setShakeId(null), 240)
  }
  return [shakeId, fire] as const
}

// suppress unused
void useShake
