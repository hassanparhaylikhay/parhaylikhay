"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AltDemoOverlay, ContextCanvas, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Region = {
  id: string
  isCorrect?: boolean
  /** Shown in the aside when this region is tapped by mistake. */
  whyWrong?: string
}

export type TapDiagramConfig = {
  prompt?: string
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
}: InteractionProps<TapDiagramConfig>) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [picked, setPicked] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [touched, setTouched] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [shaking, setShaking] = useState(false)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pickedRegion = picked ? config.regions.find(r => r.id === picked) : null
  const solved = !!pickedRegion?.isCorrect || revealed
  const correctId = config.regions.find(r => r.isCorrect)?.id

  useEffect(() => () => { if (shakeTimer.current) clearTimeout(shakeTimer.current) }, [])

  const handleTap = useCallback((id: string) => {
    if (solved) return
    setTouched(true)
    const r = config.regions.find(x => x.id === id)
    if (!r) return
    setPicked(id)
    if (r.isCorrect) {
      onComplete({ pickedId: id, attempts })
    } else {
      setAttempts(a => a + 1)
      setShaking(true)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
      shakeTimer.current = setTimeout(() => setShaking(false), 400)
    }
  }, [solved, config.regions, onComplete, attempts])

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
    for (const el of Array.from(host.querySelectorAll("[data-region]"))) {
      const id = el.getAttribute("data-region")
      el.classList.toggle("pl-tap-right", solved && id === correctId)
      el.classList.toggle("pl-tap-wrong", !solved && id === picked)
    }
  }, [picked, solved, correctId, config.contextHtml])

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
      <div
        ref={hostRef}
        className={`flex-1 min-w-0 flex items-center justify-center pl-tap ${shaking ? "pl-shake" : ""} ${solved ? "pl-tap-locked" : ""} ${touched ? "" : "pl-tap-fresh"}`}
      >
        <ContextCanvas
          html={config.contextHtml}
          asideWidth={360}
          overlay={<AltDemoOverlay svg={config.altDemo} onDismiss={onDismissAlt} />}
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

        {!solved && !picked && (
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
