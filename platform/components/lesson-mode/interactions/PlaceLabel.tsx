"use client"

import { useState, useRef, useEffect } from "react"
import { AltDemoCard, AltDemoOverlay, COLOR, Prompt, HelperRow, MixedText, CanvasStage, ContextCanvas, type InteractionProps } from "./_shared"

type Slot = {
  id: string
  /** Small mono label shown inside the empty slot (e.g. "centre"). */
  hint: string
  /** Optional HTML/SVG rendered above the drop zone — turns the slot into a "what does this look like?" target. */
  visualHtml?: string
  /** ID of the label tile that's the correct fit. */
  correctLabelId: string
  /**
   * Figure mode: this slot IS a part of the drawing. The value is the id of a
   * `<g data-region="...">` in contextHtml, and the tile is dropped straight
   * onto that part instead of into a box in the side panel.
   */
  region?: string
  /** Where the placed name sits, in the figure's own 480x320 coordinates. */
  labelAt?: [number, number]
  /** Brand colour for the placed name; defaults to green. */
  labelColour?: string
}

type LabelTile = {
  id: string
  /** Tile text; may include $...$ for KaTeX. */
  text: string
}

export type PlaceLabelConfig = {
  prompt?: string
  /** Optional raw-HTML scaffolding shown above the slots (a diagram, a problem statement). */
  contextHtml?: string
  slots: Slot[]
  labels: LabelTile[]
  successText?: string
  /** Layout direction for slots; defaults to row. */
  slotsLayout?: "row" | "column"
  /** Verify slides: no show-me reveal. Injected by InteractionSlide. */
  noHelp?: boolean
  /** Animated demonstration of the method, injected by LessonRunner when the
   *  student taps "explain another way". Shown ON the canvas, never in place
   *  of the question. */
  altDemo?: string
}

/**
 * PlaceLabel — student drags labels onto a row of slots. Each slot accepts
 * only its correct label. Wrong drop snaps back with a shake. Success when
 * every slot is filled with its correct label.
 *
 * Drag uses HTML5 pointer events. Each label tile sits in a tray below the
 * slot row; when picked up, a ghost follows the pointer. Drops onto slots
 * are detected by hit-testing the dragged element against the slot rects.
 */
export default function PlaceLabel({ config, onComplete, onDismissAlt, onShowMeUsed }: InteractionProps<PlaceLabelConfig>) {
  // Map of slotId -> assigned labelId (or null)
  const [placement, setPlacement] = useState<Record<string, string | null>>(
    Object.fromEntries(config.slots.map(s => [s.id, null]))
  )
  const [dragLabelId, setDragLabelId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [shakeLabelId, setShakeLabelId] = useState<string | null>(null)
  const [armedLabelId, setArmedLabelId] = useState<string | null>(null)
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const hostRef = useRef<HTMLDivElement | null>(null)

  const done = config.slots.every(s => placement[s.id] === s.correctLabelId)

  // Figure mode: the parts of the drawing ARE the slots. Naming a side by
  // dropping the word into a box called "SIDE 2" makes the student answer in
  // the side panel and never touch the triangle, which is the thing they are
  // supposed to be reading.
  const onFigure = !!config.contextHtml && config.slots.every(s => !!s.region)

  /** Place `labelId` on the part of the figure with this region id. */
  function placeOnRegion(regionId: string, labelId: string) {
    if (done) return
    const slot = config.slots.find(s => s.region === regionId)
    if (!slot) return
    if (slot.correctLabelId === labelId) {
      setPlacement(p => ({ ...p, [slot.id]: labelId }))
      setArmedLabelId(null)
    } else {
      setShakeLabelId(labelId)
      setTimeout(() => setShakeLabelId(null), 260)
    }
  }

  /** The region group under these client coordinates, if any. */
  function regionAt(x: number, y: number): string | null {
    const el = document.elementFromPoint(x, y) as Element | null
    return el?.closest?.("[data-region]")?.getAttribute("data-region") ?? null
  }

  /** Paint hover/placed state onto the injected SVG. */
  useEffect(() => {
    if (!onFigure) return
    const host = hostRef.current
    if (!host) return
    const hover = dragLabelId && dragPos ? regionAt(dragPos.x, dragPos.y) : null
    for (const el of Array.from(host.querySelectorAll("[data-region]"))) {
      const id = el.getAttribute("data-region")
      const slot = config.slots.find(s => s.region === id)
      const filled = slot ? placement[slot.id] === slot.correctLabelId : false
      el.classList.toggle("pl-tap-right", filled)
      el.classList.toggle("pl-tap-over", !filled && id === hover)
    }
  })

  // Tap a name, then tap the part. Works everywhere and is far more reliable
  // than drag on a phone; drag still works for anyone who reaches for it.
  useEffect(() => {
    if (!onFigure) return
    const host = hostRef.current
    if (!host) return
    function onClick(e: MouseEvent) {
      if (!armedLabelId) return
      const id = (e.target as Element | null)?.closest?.("[data-region]")?.getAttribute("data-region")
      if (id) placeOnRegion(id, armedLabelId)
    }
    host.addEventListener("click", onClick)
    return () => host.removeEventListener("click", onClick)
  })

  useEffect(() => {
    if (done) onComplete({ placement })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done])

  // Available labels: those not yet correctly placed
  const placedCorrect = new Set(
    config.slots
      .filter(s => placement[s.id] === s.correctLabelId)
      .map(s => placement[s.id]!)
  )
  const trayLabels = config.labels.filter(l => !placedCorrect.has(l.id))

  function pickup(e: React.PointerEvent, labelId: string) {
    if (done) return
    e.preventDefault()
    const tgt = e.currentTarget as HTMLElement
    tgt.setPointerCapture(e.pointerId)
    setDragLabelId(labelId)
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function move(e: React.PointerEvent) {
    if (dragLabelId === null) return
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function drop(e: React.PointerEvent, labelId: string) {
    if (dragLabelId === null) return
    setDragLabelId(null)
    setDragPos(null)
    if (onFigure) {
      const id = regionAt(e.clientX, e.clientY)
      if (id) placeOnRegion(id, labelId)
      // A drag that goes nowhere leaves the name armed, so the follow-up tap
      // on the figure still lands.
      else setArmedLabelId(labelId)
      return
    }
    // Find which slot we dropped on
    for (const s of config.slots) {
      const node = slotRefs.current[s.id]
      if (!node) continue
      const r = node.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        if (s.correctLabelId === labelId) {
          setPlacement(p => ({ ...p, [s.id]: labelId }))
        } else {
          setShakeLabelId(labelId)
          setTimeout(() => setShakeLabelId(null), 240)
        }
        return
      }
    }
  }

  function showMe() {
    onShowMeUsed?.()
    const next: Record<string, string | null> = {}
    for (const s of config.slots) next[s.id] = s.correctLabelId
    setPlacement(next)
  }

  const wide = !!config.contextHtml

  const slotRow = (
    <div className={
      wide
        ? "flex flex-col gap-2 w-full"
        : `flex ${config.slotsLayout === "column" ? "flex-col gap-2" : "flex-wrap gap-3 sm:gap-4 justify-center"} mb-7 max-w-[760px]`
    }>
      {config.slots.map(s => {
        const filledId = placement[s.id]
        const filledLabel = config.labels.find(l => l.id === filledId)
        const isCorrect = filledId === s.correctLabelId
        const hasVisual = !!s.visualHtml
        return (
          <div
            key={s.id}
            ref={el => { slotRefs.current[s.id] = el }}
            className={`relative rounded-xl border-[1.5px] flex flex-col items-center justify-end px-2 pt-2 pb-1.5 transition-all duration-300 ${isCorrect ? "pl-success-pulse" : ""} ${hasVisual ? "w-[140px] sm:w-[160px]" : wide ? "w-full h-12 justify-center" : "min-w-[120px] sm:min-w-[140px] h-12 sm:h-14 justify-center"}`}
            style={{
              borderColor: isCorrect ? COLOR.green : COLOR.border,
              borderStyle: filledLabel ? "solid" : "dashed",
              background: isCorrect ? "rgba(15,238,137,0.06)" : COLOR.card,
            }}
          >
            {hasVisual && (
              <div className="w-full mb-2" dangerouslySetInnerHTML={{ __html: s.visualHtml! }} />
            )}
            <div
              className={`w-full flex items-center justify-center ${hasVisual ? "h-9 rounded border-[1px] border-dashed" : ""}`}
              style={hasVisual ? { borderColor: isCorrect ? COLOR.green : "#1a3350" } : undefined}
            >
              {filledLabel ? (
                <MixedText text={filledLabel.text} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: isCorrect ? COLOR.green : COLOR.text }} />
              ) : (
                <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: COLOR.faint }}>
                  {s.hint}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )

  const tray = (
    <div className={`flex flex-wrap ${wide ? "gap-2 mt-1" : "gap-2 sm:gap-3"} justify-center min-h-[52px]`}>
      {trayLabels.map(l => {
        const isDragging = dragLabelId === l.id
        const isShaking = shakeLabelId === l.id
        const isArmed = armedLabelId === l.id
        return (
          <div
            key={l.id}
            onPointerDown={e => pickup(e, l.id)}
            onPointerMove={move}
            onPointerUp={e => drop(e, l.id)}
            onPointerCancel={e => drop(e, l.id)}
            className={`h-11 sm:h-12 px-4 rounded-lg border-[1.5px] flex items-center cursor-grab active:cursor-grabbing select-none touch-none transition-all duration-200 ${isShaking ? "pl-shake" : ""}`}
            style={{
              borderColor: isArmed ? COLOR.yellow : "#2e3f58",
              background: isArmed ? "rgba(255,240,103,0.08)" : "#0f161f",
              opacity: isDragging ? 0.3 : 1,
            }}
          >
            <MixedText text={l.text} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: COLOR.white }} />
          </div>
        )
      })}
    </div>
  )

  const successBlock = done && config.successText && (
    <MixedText
      text={config.successText}
      className={wide
        ? "block text-[15px] sm:text-[16px] text-[#0fee89] pl-reveal leading-relaxed"
        : "mt-6 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"}
    />
  )

  const ghost = dragLabelId && dragPos && (
    <div
      className="fixed pointer-events-none z-50 h-11 sm:h-12 px-4 rounded-lg border-[1.5px] flex items-center"
      style={{
        left: dragPos.x - 60,
        top: dragPos.y - 22,
        borderColor: "#46608a",
        background: COLOR.card,
        boxShadow: "0 8px 24px -8px rgba(0,0,0,0.85)",
      }}
    >
      <MixedText text={config.labels.find(l => l.id === dragLabelId)?.text ?? ""} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: COLOR.white }} />
    </div>
  )

  // Figure mode: names land on the drawing itself.
  if (onFigure) {
    const placedNames = (
      <>
        {config.slots.map(s => {
          const filledId = placement[s.id]
          if (filledId !== s.correctLabelId || !s.labelAt) return null
          const tile = config.labels.find(l => l.id === filledId)
          if (!tile) return null
          return (
            <div
              key={s.id}
              className="absolute pointer-events-none pl-reveal"
              style={{
                left: `${(s.labelAt[0] / 480) * 100}%`,
                top: `${(s.labelAt[1] / 320) * 100}%`,
                transform: "translate(-50%, -50%)",
                whiteSpace: "nowrap",
              }}
            >
              <MixedText
                text={tile.text}
                className="text-[13px] sm:text-[15px] font-medium"
                style={{ color: s.labelColour ?? COLOR.green }}
              />
            </div>
          )
        })}
      </>
    )
    // Teaching text on the board; the tray of names stays in the aside
    // because that is the thing the student picks up and moves.
    const instruction = (
      <span>
        <MixedText text={config.prompt} />
        {!done && (
          <span className="block mt-1.5 text-[14px] text-[#7a7875]">
            Drag a name onto the triangle, or tap the name then tap its side.
          </span>
        )}
      </span>
    )
    return (
      <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
        <div ref={hostRef} className={`flex-1 min-w-0 flex items-center justify-center pl-tap ${done ? "pl-tap-locked" : "pl-tap-fresh"}`}>
          <CanvasStage
            html={config.contextHtml!}
            asideWidth={360}
            instruction={instruction}
            note={done ? <MixedText text={config.successText} /> : undefined}
            noteTone="success"
            overlay={<>{placedNames}<AltDemoOverlay svg={config.altDemo} onDismiss={onDismissAlt} /></>}
          />
        </div>
        <aside className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {tray}
          {!config.noHelp && <HelperRow onShowMe={!done ? showMe : undefined} />}
        </aside>
        {ghost}
      </div>
    )
  }

  if (wide) {
    return (
      <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
        <div className="flex-1 min-w-0 flex items-center justify-center">
          <ContextCanvas html={config.contextHtml!} asideWidth={360} />
        </div>
        <aside className="pl-stagger w-full xl:w-[360px] shrink-0 flex flex-col gap-3 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
          {config.prompt && (
            <MixedText
              text={config.prompt}
              className="block text-[18px] sm:text-[20px] text-[#f0eeea] leading-snug max-w-full mb-1"
            />
          )}
          {slotRow}
          {tray}
          {successBlock}
          {!config.noHelp && <HelperRow onShowMe={!done ? showMe : undefined} />}
        </aside>
        {ghost}
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>
      <AltDemoCard svg={config.altDemo} onDismiss={onDismissAlt} />
      {slotRow}
      {tray}
      {ghost}
      {successBlock}
      {!config.noHelp && <HelperRow onShowMe={!done ? showMe : undefined} />}
    </div>
  )
}

