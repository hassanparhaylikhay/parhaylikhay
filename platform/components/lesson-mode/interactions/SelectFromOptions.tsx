"use client"

import { useState } from "react"
import katex from "katex"
import { COLOR, Prompt, HelperRow, type InteractionProps } from "./_shared"

type Option = {
  id: string
  /** Plain text or text-with-inline-$math$ — math is rendered via KaTeX. */
  text: string
  /** Optional raw HTML rendered above the text (a small inline SVG diagram, etc.). */
  visualHtml?: string
  isCorrect?: boolean
  /** Optional "why this is wrong" text shown when the student picks it. */
  whyWrong?: string
}

export type SelectFromOptionsConfig = {
  prompt?: string
  /** Optional intro HTML (e.g. the source diagram). Rendered above the options. */
  contextHtml?: string
  options: Option[]
  layout?: "stack" | "row"
  /** Tap-after-correct success text. */
  successText?: string
}

/**
 * SelectFromOptions — pick one card from N. Cards can show math, prose, or a
 * tiny diagram. Wrong card shakes + shows whyWrong; correct card pulses green.
 */
export default function SelectFromOptions({ config, onComplete }: InteractionProps<SelectFromOptionsConfig>) {
  const [picked, setPicked] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)

  const correct = config.options.find(o => o.isCorrect)
  const isResolved = picked !== null && picked === correct?.id

  function pick(id: string) {
    if (isResolved) return
    const o = config.options.find(x => x.id === id)
    if (!o) return
    setPicked(id)
    if (o.isCorrect) {
      onComplete({ pickedId: id })
    } else {
      setShakeId(id)
      setTimeout(() => setShakeId(null), 240)
    }
  }

  const wrongPick = picked && !isResolved ? config.options.find(o => o.id === picked) : null
  const isRow = config.layout === "row"

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>

      {config.contextHtml && (
        <div className="mb-6 max-w-[560px]" dangerouslySetInnerHTML={{ __html: config.contextHtml }} />
      )}

      <div
        className={isRow ? "flex flex-wrap gap-3 justify-center max-w-[760px]" : "flex flex-col gap-3 w-full max-w-[560px]"}
      >
        {config.options.map(o => {
          const isThisPicked = picked === o.id
          const isCorrectPick = isThisPicked && o.isCorrect
          const isWrongPick = isThisPicked && !o.isCorrect
          const isShakingThis = shakeId === o.id
          return (
            <button
              key={o.id}
              onClick={() => pick(o.id)}
              disabled={isResolved && !isCorrectPick}
              className={`text-left rounded-xl border transition-all duration-300 px-4 py-3 sm:px-5 sm:py-4 ${isShakingThis ? "pl-shake" : ""} ${isCorrectPick ? "pl-success-pulse" : ""}`}
              style={{
                borderColor: isCorrectPick ? COLOR.green : isWrongPick ? COLOR.pink : COLOR.border,
                background: isCorrectPick
                  ? "rgba(15,238,137,0.06)"
                  : isWrongPick
                  ? "rgba(255,70,112,0.04)"
                  : COLOR.card,
                cursor: isResolved && !isCorrectPick ? "default" : "pointer",
                opacity: isResolved && !isCorrectPick ? 0.4 : 1,
              }}
            >
              {o.visualHtml && (
                <div className="mb-2" dangerouslySetInnerHTML={{ __html: o.visualHtml }} />
              )}
              <OptionText
                text={o.text}
                color={isCorrectPick ? COLOR.green : isWrongPick ? COLOR.pink : COLOR.text}
              />
            </button>
          )
        })}
      </div>

      {wrongPick?.whyWrong && (
        <p className="mt-4 text-[12.5px] text-[#ff4670] pl-reveal text-center max-w-[480px]">
          {wrongPick.whyWrong}
        </p>
      )}
      {isResolved && config.successText && (
        <p className="mt-6 text-[13px] text-[#0fee89] pl-reveal text-center max-w-[560px]">
          {config.successText}
        </p>
      )}

      <HelperRow
        onShowMe={
          !isResolved
            ? () => {
                const correctId = correct?.id
                if (correctId) {
                  setPicked(correctId)
                  onComplete({ revealed: true, pickedId: correctId })
                }
              }
            : undefined
        }
      />
    </div>
  )
}

function OptionText({ text, color }: { text: string; color: string }) {
  // Split on $...$ and render odd indices as KaTeX
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <span className="text-[13.5px] sm:text-[14.5px] leading-relaxed transition-colors duration-300" style={{ color }}>
      {parts.map((p, i) => {
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          const tex = p.slice(1, -1)
          try {
            const html = katex.renderToString(tex, { throwOnError: false, displayMode: false, output: "html" })
            return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
          } catch {
            return <span key={i}>{tex}</span>
          }
        }
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}
