"use client"

import { useState } from "react"
import { COLOR, ContextCanvas, Prompt, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Option = {
  id: string
  /** Plain text or text-with-inline-$math$ — math is rendered via KaTeX. */
  text: string
  /** Optional raw HTML rendered above the text (a small inline SVG diagram, etc.). */
  visualHtml?: string
  isCorrect?: boolean
  /** Optional "why this is wrong" text shown when the student picks it. */
  whyWrong?: string
  /**
   * Optional SVG snippet appended INSIDE the contextHtml's <svg> element when
   * THIS option is picked correctly. Lets a "which mirror / which vector / which
   * transformation" MCQ visually confirm the answer by drawing the answer's
   * geometry on the diagram. The snippet must be in the same coordinate system
   * as the contextHtml SVG (typically 480×320 viewBox, sx/sy from the MCQ regen
   * script).
   */
  revealSvgInside?: string
}

export type SelectFromOptionsConfig = {
  prompt?: string
  /** Optional intro HTML (e.g. the source diagram). Rendered above the options. */
  contextHtml?: string
  options: Option[]
  layout?: "stack" | "row"
  /** Tap-after-correct success text. */
  successText?: string
  /** Verify slides: no elimination hint. Injected by InteractionSlide. */
  noHelp?: boolean
}

/**
 * SelectFromOptions — pick one card from N. Cards can show math, prose, or a
 * tiny diagram. Wrong card shakes + shows whyWrong; correct card pulses green.
 */
export default function SelectFromOptions({ config, onComplete, onShowMeUsed }: InteractionProps<SelectFromOptionsConfig>) {
  const [picked, setPicked] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [eliminated, setEliminated] = useState<Set<string>>(new Set())
  const [attempts, setAttempts] = useState(0)

  // Resolve against the PICKED option's own isCorrect flag, not against the
  // first correct option in the list. With more than one correct option the
  // old comparison treated every correct pick after the first as wrong.
  const pickedOption = picked !== null ? config.options.find(o => o.id === picked) : null
  const isResolved = !!pickedOption?.isCorrect
  const correct = pickedOption?.isCorrect ? pickedOption : config.options.find(o => o.isCorrect)

  function pick(id: string) {
    if (isResolved) return
    if (eliminated.has(id)) return
    const o = config.options.find(x => x.id === id)
    if (!o) return
    setPicked(id)
    if (o.isCorrect) {
      onComplete({ pickedId: id, attempts })
    } else {
      setAttempts(a => a + 1)
      setShakeId(id)
      setTimeout(() => setShakeId(null), 400)
    }
  }

  function showMe() {
    if (isResolved) return
    const wrongLeft = config.options.filter(o => !o.isCorrect && !eliminated.has(o.id))
    if (wrongLeft.length === 0) return
    const toRemove = wrongLeft[0]
    setEliminated(prev => {
      const s = new Set(prev)
      s.add(toRemove.id)
      return s
    })
    // Clear any "wrong pick" state so the eliminated option isn't double-styled.
    if (picked === toRemove.id) setPicked(null)
    onShowMeUsed?.()
  }

  const wrongPick = picked && !isResolved ? config.options.find(o => o.id === picked) : null
  const isRow = config.layout === "row"
  const wide = !!config.contextHtml

  const optionButtons = config.options.map(o => {
    const isThisPicked = picked === o.id
    const isCorrectPick = isThisPicked && o.isCorrect
    const isWrongPick = isThisPicked && !o.isCorrect
    const isShakingThis = shakeId === o.id
    const isEliminated = eliminated.has(o.id)
    return (
      <button
        key={o.id}
        onClick={() => pick(o.id)}
        disabled={(isResolved && !isCorrectPick) || isEliminated}
        className={`text-left rounded-xl border transition-all duration-300 px-4 py-3 sm:px-5 sm:py-3.5 ${isShakingThis ? "pl-shake" : ""} ${isCorrectPick ? "pl-success-pulse" : ""}`}
        style={{
          borderColor: isCorrectPick ? COLOR.green : isWrongPick ? COLOR.pink : isEliminated ? "#2a2a2a" : COLOR.border,
          background: isCorrectPick
            ? "rgba(15,238,137,0.06)"
            : isWrongPick
            ? "rgba(255,70,112,0.04)"
            : COLOR.card,
          cursor: (isResolved && !isCorrectPick) || isEliminated ? "default" : "pointer",
          opacity: isEliminated ? 0.28 : (isResolved && !isCorrectPick ? 0.4 : 1),
          textDecoration: isEliminated ? "line-through" : undefined,
          textDecorationColor: isEliminated ? COLOR.faint : undefined,
          textDecorationThickness: isEliminated ? "1.5px" : undefined,
        }}
      >
        {o.visualHtml && (
          <div className="mb-2" dangerouslySetInnerHTML={{ __html: o.visualHtml }} />
        )}
        <MixedText
          text={o.text}
          className="text-[15.5px] sm:text-[16.5px] leading-relaxed transition-colors duration-300"
          style={{ color: isCorrectPick ? COLOR.green : isWrongPick ? COLOR.pink : isEliminated ? COLOR.faint : COLOR.text }}
        />
      </button>
    )
  })

  const feedback = (
    <>
      {wrongPick?.whyWrong && (
        <MixedText
          text={wrongPick.whyWrong}
          className={wide ? "block text-[15px] sm:text-[16px] text-[#ff4670] pl-reveal leading-relaxed" : "mt-4 block text-[15px] text-[#ff4670] pl-reveal text-center max-w-[560px] leading-relaxed"}
        />
      )}
      {isResolved && config.successText && (
        <MixedText
          text={config.successText}
          className={wide ? "block text-[15px] sm:text-[16px] text-[#0fee89] pl-reveal leading-relaxed" : "mt-6 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"}
        />
      )}
    </>
  )

  const helper = config.noHelp ? null : (
    <HelperRow
      showMeLabel={
        eliminated.size === 0
          ? "show me a hint"
          : eliminated.size < (config.options.length - 1)
          ? "narrow it down further"
          : "show me a hint"
      }
      onShowMe={
        !isResolved && eliminated.size < (config.options.length - 1)
          ? showMe
          : undefined
      }
    />
  )

  // Wide layout: big manipulative canvas on the left, options column on
  // the right. Same shape as widgetCanvas / clickOnGrid slides so the
  // canvas matches the widget canvases in size, density and style.
  if (wide) {
    // When the student picks the correct option, splice its revealSvgInside
    // snippet into the canvas SVG just before </svg> so the answer's geometry
    // (the mirror line, the vector, the centre of rotation) draws onto the
    // diagram as visual confirmation. No-op if the correct option has no
    // revealSvgInside, or if not yet resolved.
    const correctReveal = correct?.revealSvgInside
    const effectiveContextHtml = (isResolved && correctReveal)
      ? config.contextHtml!.replace("</svg>", correctReveal + "</svg>")
      : config.contextHtml!
    return (
      <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <ContextCanvas html={effectiveContextHtml} asideWidth={360} />
        </div>
        <aside className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {config.prompt && (
            <MixedText
              text={config.prompt}
              className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug max-w-full mb-1"
            />
          )}
          <div className="flex flex-col gap-2.5">{optionButtons}</div>
          {feedback}
          {helper}
        </aside>
      </div>
    )
  }

  // Default centered layout (no contextHtml).
  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>
      <div className={isRow ? "flex flex-wrap gap-3 justify-center max-w-[760px]" : "flex flex-col gap-3 w-full max-w-[560px]"}>
        {optionButtons}
      </div>
      {feedback}
      {helper}
    </div>
  )
}

