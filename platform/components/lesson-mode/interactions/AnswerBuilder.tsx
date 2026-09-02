"use client"

import { useEffect, useState } from "react"
import { AltDemoCard, AltDemoOverlay, COLOR, CanvasStage, MixedText, Prompt, type InteractionProps } from "./_shared"

type BuilderOption = {
  id: string
  /** Chip text; may include $...$ for KaTeX. */
  text: string
  isCorrect?: boolean
  /** Shown when the student picks this chip. Every wrong chip should teach. */
  whyWrong?: string
}

type BuilderPart = {
  id: string
  /** What this piece of the answer is, shown under the empty slot (e.g. "the angle and direction"). */
  label: string
  /** Mark this part earns on the real paper, e.g. "B1". Lights up green when locked. */
  markCode?: string
  options: BuilderOption[]
}

export type AnswerBuilderConfig = {
  prompt?: string
  /** Optional manipulative-style diagram. When present, the slide uses the wide canvas + aside layout. */
  contextHtml?: string
  /** The parts of the examiner sentence, in the order they are assembled. */
  parts: BuilderPart[]
  successText?: string
  /**
   * Optional SVG snippet spliced into the contextHtml's <svg> when the whole
   * answer is locked, so the completed description draws itself onto the
   * diagram (the mirror line, the centre, the rays).
   */
  revealSvgInside?: string
  /** Set by the slide wrapper on verify slides: no help affordances. */
  noHelp?: boolean
  /** Animated demonstration of the method, injected by LessonRunner when the
   *  student taps "explain another way". Shown ON the canvas, never in place
   *  of the question. */
  altDemo?: string
}

/**
 * AnswerBuilder — the student assembles the full mark-scheme sentence one
 * part at a time. This is the production skill the exam actually pays for:
 * not recognising a correct description, but composing one. Each locked part
 * lights its B1 pill, so the mark structure of the answer is visible while
 * the answer is being built.
 *
 * Parts unlock strictly in order. One tray of chips is shown at a time (the
 * current part), which keeps the slide to a single decision at each moment.
 */
export default function AnswerBuilder({ config, onComplete, onDismissAlt }: InteractionProps<AnswerBuilderConfig>) {
  const [locked, setLocked] = useState(0)
  const [wrongId, setWrongId] = useState<string | null>(null)
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)

  const parts = config.parts
  const done = locked >= parts.length
  const current = done ? null : parts[locked]
  const wrongOption = current && wrongId ? current.options.find(o => o.id === wrongId) : null

  // A misauthored slide with zero parts would otherwise sit "done" without
  // ever firing onComplete, hard-blocking an onSuccess advance.
  useEffect(() => {
    if (parts.length === 0) onComplete({ attempts: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pick(o: BuilderOption) {
    if (done || !current) return
    if (o.isCorrect) {
      setWrongId(null)
      const next = locked + 1
      setLocked(next)
      if (next >= parts.length) {
        onComplete({ attempts })
      }
    } else {
      setAttempts(a => a + 1)
      setWrongId(o.id)
      setShakeId(o.id)
      setTimeout(() => setShakeId(null), 400)
    }
  }

  // The sentence under construction. Locked parts show their chosen text with
  // a green mark pill; the active part shows a pulsing dashed slot; future
  // parts show a faint dashed slot with the part label.
  const sentence = (
    <div
      className={`flex flex-wrap items-stretch gap-2 rounded-xl border px-4 py-3.5 transition-colors duration-300 ${done ? "pl-success-pulse" : ""}`}
      style={{
        borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
        background: done ? "rgba(15,238,137,0.05)" : COLOR.card,
      }}
    >
      {parts.map((p, i) => {
        const isLocked = i < locked
        const isActive = i === locked && !done
        const chosen = isLocked ? p.options.find(o => o.isCorrect) : null
        return (
          <div key={p.id} className="flex flex-col items-center gap-1.5">
            <div
              className={`rounded-lg border-[1.5px] px-3 py-2 flex items-center justify-center transition-all duration-300 ${isLocked ? "pl-reveal" : ""}`}
              style={{
                borderColor: isLocked ? "rgba(15,238,137,0.5)" : isActive ? COLOR.yellow : COLOR.border,
                borderStyle: isLocked ? "solid" : "dashed",
                background: isLocked ? "rgba(15,238,137,0.06)" : "transparent",
                minWidth: 64,
                minHeight: 40,
              }}
            >
              {chosen ? (
                <MixedText
                  text={chosen.text}
                  className="text-[16px] sm:text-[17px] font-medium"
                  style={{ color: COLOR.white }}
                />
              ) : (
                <MixedText
                  text={p.label}
                  className="text-[12.5px] font-medium px-1"
                  style={{ color: isActive ? COLOR.yellow : COLOR.faint }}
                />
              )}
            </div>
            {p.markCode && (
              <span
                className="text-[9.5px] font-mono uppercase tracking-[1.5px] transition-colors duration-300"
                style={{ color: isLocked ? COLOR.green : COLOR.faint }}
              >
                {p.markCode}{isLocked ? " ✓" : ""}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )

  const tray = current && (
    <div className="flex flex-wrap gap-2.5 min-h-[52px]" key={current.id}>
      {current.options.map(o => {
        const isWrongPick = wrongId === o.id
        return (
          <button
            key={o.id}
            onClick={() => pick(o)}
            className={`rounded-lg border-[1.5px] px-4 py-2.5 transition-all duration-200 pl-reveal hover:border-[#46608a] ${shakeId === o.id ? "pl-shake" : ""}`}
            style={{
              borderColor: isWrongPick ? COLOR.pink : "#2e3f58",
              background: isWrongPick ? "rgba(255,70,112,0.05)" : "#0f161f",
              cursor: "pointer",
            }}
          >
            <MixedText
              text={o.text}
              className="text-[15.5px] sm:text-[17px] font-medium"
              style={{ color: isWrongPick ? COLOR.pink : COLOR.white }}
            />
          </button>
        )
      })}
    </div>
  )

  const feedback = (
    <>
      {wrongOption?.whyWrong && !done && (
        <MixedText
          key={wrongId}
          text={wrongOption.whyWrong}
          className="block text-[14.5px] sm:text-[15.5px] text-[#ff4670] pl-reveal leading-relaxed"
        />
      )}
      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="block text-[15px] sm:text-[16px] text-[#0fee89] pl-reveal leading-relaxed"
        />
      )}
    </>
  )

  // Wide layout when a diagram is present: canvas left, builder right.
  if (config.contextHtml) {
    const effectiveHtml = done && config.revealSvgInside
      ? config.contextHtml.replace("</svg>", config.revealSvgInside + "</svg>")
      : config.contextHtml
    // Teaching text on the board; the aside keeps the sentence being built
    // and the tiles, which are what the student operates.
    const caption = (wrongOption?.whyWrong && !done)
      ? <MixedText text={wrongOption.whyWrong} />
      : (done && config.successText)
      ? <MixedText text={config.successText} />
      : <MixedText text={config.prompt} />
    const tone = (wrongOption?.whyWrong && !done) ? "wrong" : done ? "success" : "instruct"
    return (
      <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <CanvasStage
            html={effectiveHtml}
            asideWidth={360}
            caption={caption}
            tone={tone}
            overlay={<AltDemoOverlay svg={config.altDemo} onDismiss={onDismissAlt} />}
          />
        </div>
        <aside className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3.5 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {sentence}
          {tray}
        </aside>
      </div>
    )
  }

  // Centered layout (no diagram).
  return (
    <div className="w-full flex flex-col items-center gap-4">
      <Prompt>{config.prompt}</Prompt>
      <AltDemoCard svg={config.altDemo} onDismiss={onDismissAlt} />
      <div className="w-full max-w-[640px] flex flex-col gap-4 items-center">
        {sentence}
        {tray}
        <div className="text-center max-w-[560px]">{feedback}</div>
      </div>
    </div>
  )
}
