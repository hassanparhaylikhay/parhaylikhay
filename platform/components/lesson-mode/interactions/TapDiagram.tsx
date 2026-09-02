"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AltDemoOverlay, ContextCanvas, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Region = {
  id: string
  isCorrect?: boolean
  /** Shown in the aside when this region is tapped by mistake. */
  whyWrong?: string
}

/**
 * One stage of a given-then-find sequence. Hassan's classroom method, which
 * he reports worked every time: get the student to point at what they are
 * GIVEN and what they need to FIND, mark both on the diagram, and only then
 * look for the formula that covers those two things.
 */
type SeqStep = {
  /** The instruction while this stage is live. */
  prompt: string
  /** Which region must be tapped. */
  regionId: string
  /** Tag written on the diagram once tapped, e.g. "given" or "find". */
  tag: string
  /** Where the tag sits, in the figure's own 480x320 coordinates. */
  tagAt: [number, number]
  /** Stage-level hint. Multi-stage frames put help on the stage, not the slide. */
  hint?: string
}

export type StageInfo = { hint?: string; demo?: string }

export type TapDiagramConfig = {
  prompt?: string
  /**
   * When present the student works through these stages in order instead of
   * making one tap. The slide prompt stays as the question; the stage prompt
   * says what to point at right now.
   */
  sequence?: SeqStep[]
  /**
   * The figure. Every tappable part is a `<g data-region="id">` holding a
   * `.pl-tap-vis` highlight shape and a fat invisible `.pl-tap-hit` shape
   * (`pointer-events="all"`) so the target is comfortable on a phone.
   */
  contextHtml: string
  regions: Region[]
  successText?: string
  /** Verify slides: no show-me. Injected by InteractionSlide. */
  noHelp?: boolean
  /** Animated demonstration, injected by LessonRunner. Sits ON the canvas. */
  altDemo?: string
}

/**
 * TapDiagram — the student answers by tapping the actual part of the figure.
 *
 * When the answer is a thing you can point at (a side, an angle, a mirror
 * line, a region), naming it in a list of words is the wrong interaction:
 * the student translates the picture into prose, picks the prose, and never
 * touches the picture. Here the figure IS the answer surface. Every tappable
 * part breathes gently until the first tap, so the invitation needs no
 * instruction line.
 */
export default function TapDiagram({
  config,
  onComplete,
  onDismissAlt,
  onShowMeUsed,
  onRegisterStageInfo,
}: InteractionProps<TapDiagramConfig> & { onRegisterStageInfo?: (i: StageInfo | null) => void }) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [touched, setTouched] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [shaking, setShaking] = useState(false)
  const [stage, setStage] = useState(0)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const seq = config.sequence
  const pickedRegion = picked ? config.regions.find(r => r.id === picked) : null
  const solved = seq
    ? (stage >= seq.length || revealed)
    : (!!pickedRegion?.isCorrect || revealed)
  const correctId = config.regions.find(r => r.isCorrect)?.id
  /** Regions already marked by the sequence, in order. */
  const doneSteps = seq ? seq.slice(0, revealed ? seq.length : stage) : []

  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])

  const fireShake = useCallback(() => {
    setShaking(true)
    if (shakeTimer.current) clearTimeout(shakeTimer.current)
    shakeTimer.current = setTimeout(() => setShaking(false), 400)
  }, [])

  const handleTap = useCallback((id: string) => {
    if (solved) return
    setTouched(true)
    const r = config.regions.find(x => x.id === id)
    if (!r) return

    if (seq) {
      const want = seq[stage]
      if (!want) return
      if (id === want.regionId) {
        setPicked(null)
        const next = stage + 1
        setStage(next)
        if (next >= seq.length) onComplete({ attempts })
      } else {
        setPicked(id)
        setAttempts(a => a + 1)
        fireShake()
      }
      return
    }

    setPicked(id)
    if (r.isCorrect) {
      onComplete({ pickedId: id, attempts })
    } else {
      setAttempts(a => a + 1)
      fireShake()
    }
  }, [solved, config.regions, onComplete, attempts, seq, stage, fireShake])

  // Multi-stage frames put help on the STAGE, never the slide, so the chrome
  // never offers the hint for a step the student already finished.
  const stageHint = seq && !solved ? seq[stage]?.hint : undefined
  useEffect(() => {
    if (!onRegisterStageInfo || !seq) return
    onRegisterStageInfo(solved ? null : { hint: stageHint })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, solved, stageHint])
  useEffect(() => {
    return () => { onRegisterStageInfo?.(null) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Delegated tap handling. The SVG is injected as raw HTML by ContextCanvas,
  // so listening on the wrapper and walking up to the nearest [data-region]
  // keeps this working without ContextCanvas needing to know about regions.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    function onClick(e: MouseEvent) {
      const el = (e.target as Element | null)?.closest?.("[data-region]")
      const id = el?.getAttribute("data-region")
      if (id) handleTap(id)
    }
    host.addEventListener("click", onClick)
    return () => host.removeEventListener("click", onClick)
  }, [handleTap])

  // Paint region state onto the injected SVG.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const marked = new Set(doneSteps.map(s => s.regionId))
    for (const el of Array.from(host.querySelectorAll("[data-region]"))) {
      const id = el.getAttribute("data-region")
      const right = seq ? (!!id && marked.has(id)) : (solved && id === correctId)
      el.classList.toggle("pl-tap-right", right)
      el.classList.toggle("pl-tap-wrong", !right && id === picked)
    }
  })

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
      <div
        ref={hostRef}
        className={`flex-1 min-w-0 flex items-center justify-center pl-tap ${shaking ? "pl-shake" : ""} ${solved ? "pl-tap-locked" : ""} ${touched ? "" : "pl-tap-fresh"}`}
      >
        <ContextCanvas
          html={config.contextHtml}
          asideWidth={360}
          overlay={
            <>
              {doneSteps.map(s => (
                <div
                  key={s.regionId}
                  className="absolute pointer-events-none pl-reveal"
                  style={{
                    left: `${(s.tagAt[0] / 480) * 100}%`,
                    top: `${(s.tagAt[1] / 320) * 100}%`,
                    transform: "translate(-50%, -50%)",
                    whiteSpace: "nowrap",
                    font: "600 12px 'Geist Mono', ui-monospace, monospace",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "#0fee89",
                    background: "rgba(15,238,137,0.12)",
                    border: "1px solid rgba(15,238,137,0.45)",
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  {s.tag}
                </div>
              ))}
              <AltDemoOverlay svg={config.altDemo} onDismiss={onDismissAlt} />
            </>
          }
        />
      </div>

      <aside
        className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3 justify-center"
        style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
      >
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug"
          />
        )}

        {seq && !solved && (
          <MixedText
            key={stage}
            text={seq[stage]?.prompt}
            className="block text-[16px] sm:text-[17px] text-[#fff067] leading-relaxed pl-reveal"
          />
        )}

        {!solved && !picked && !seq && (
          <p className="text-[14px] text-[#7a7875] leading-relaxed">
            Tap it on the diagram.
          </p>
        )}

        {!solved && pickedRegion?.whyWrong && (
          <MixedText
            key={picked}
            text={pickedRegion.whyWrong}
            className="block text-[14.5px] text-[#ff4670] leading-relaxed pl-reveal"
          />
        )}

        {solved && config.successText && (
          <MixedText
            text={config.successText}
            className="block text-[15px] sm:text-[16px] text-[#0fee89] leading-relaxed pl-reveal"
          />
        )}

        {!config.noHelp && (
          <HelperRow
            onShowMe={
              !solved
                ? () => {
                    setRevealed(true)
                    setTouched(true)
                    if (seq) setStage(seq.length)
                    onShowMeUsed?.()
                    onComplete({ revealed: true })
                  }
                : undefined
            }
          />
        )}
      </aside>
    </div>
  )
}
