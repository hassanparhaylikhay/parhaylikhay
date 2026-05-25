"use client"

import { useState, useRef, useEffect } from "react"
import katex from "katex"
import { COLOR, Prompt, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Slot = {
  id: string
  /** Small mono label shown inside the empty slot (e.g. "centre"). */
  hint: string
  /** Optional HTML/SVG rendered above the drop zone — turns the slot into a "what does this look like?" target. */
  visualHtml?: string
  /** ID of the label tile that's the correct fit. */
  correctLabelId: string
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
export default function PlaceLabel({ config, onComplete }: InteractionProps<PlaceLabelConfig>) {
  // Map of slotId -> assigned labelId (or null)
  const [placement, setPlacement] = useState<Record<string, string | null>>(
    Object.fromEntries(config.slots.map(s => [s.id, null]))
  )
  const [dragLabelId, setDragLabelId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [shakeLabelId, setShakeLabelId] = useState<string | null>(null)
  const slotRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const done = config.slots.every(s => placement[s.id] === s.correctLabelId)

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
    const next: Record<string, string | null> = {}
    for (const s of config.slots) next[s.id] = s.correctLabelId
    setPlacement(next)
  }

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>

      {config.contextHtml && (
        <div
          className="mb-7 w-full max-w-[720px] rounded-xl overflow-hidden"
          style={{ background: COLOR.card, border: `1px solid ${COLOR.border}` }}
          dangerouslySetInnerHTML={{ __html: config.contextHtml }}
        />
      )}

      {/* Slot row */}
      <div className={`flex ${config.slotsLayout === "column" ? "flex-col gap-2" : "flex-wrap gap-3 sm:gap-4 justify-center"} mb-7 max-w-[760px]`}>
        {config.slots.map(s => {
          const filledId = placement[s.id]
          const filledLabel = config.labels.find(l => l.id === filledId)
          const isCorrect = filledId === s.correctLabelId
          const hasVisual = !!s.visualHtml
          return (
            <div
              key={s.id}
              ref={el => { slotRefs.current[s.id] = el }}
              className={`relative rounded-xl border-[1.5px] flex flex-col items-center justify-end px-2 pt-2 pb-1.5 transition-all duration-300 ${isCorrect ? "pl-success-pulse" : ""} ${hasVisual ? "w-[140px] sm:w-[160px]" : "min-w-[120px] sm:min-w-[140px] h-12 sm:h-14 justify-center"}`}
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
                  <LabelText text={filledLabel.text} color={isCorrect ? COLOR.green : COLOR.text} />
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

      {/* Label tray */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center min-h-[52px]">
        {trayLabels.map(l => {
          const isDragging = dragLabelId === l.id
          const isShaking = shakeLabelId === l.id
          return (
            <div
              key={l.id}
              onPointerDown={e => pickup(e, l.id)}
              onPointerMove={move}
              onPointerUp={e => drop(e, l.id)}
              onPointerCancel={e => drop(e, l.id)}
              className={`h-11 sm:h-12 px-4 rounded-lg border-[1.5px] flex items-center cursor-grab active:cursor-grabbing select-none touch-none transition-opacity duration-200 ${isShaking ? "pl-shake" : ""}`}
              style={{
                borderColor: COLOR.blue,
                background: "rgba(0,171,250,0.06)",
                opacity: isDragging ? 0.3 : 1,
              }}
            >
              <LabelText text={l.text} color={COLOR.blue} />
            </div>
          )
        })}
      </div>

      {/* Ghost while dragging */}
      {dragLabelId && dragPos && (
        <div
          className="fixed pointer-events-none z-50 h-11 sm:h-12 px-4 rounded-lg border-[1.5px] flex items-center"
          style={{
            left: dragPos.x - 60,
            top: dragPos.y - 22,
            borderColor: COLOR.blue,
            background: COLOR.card,
            boxShadow: "0 6px 20px -8px rgba(0,171,250,0.6)",
          }}
        >
          <LabelText text={config.labels.find(l => l.id === dragLabelId)?.text ?? ""} color={COLOR.blue} />
        </div>
      )}

      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-6 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"
        />
      )}

      <HelperRow onShowMe={!done ? showMe : undefined} />
    </div>
  )
}

function LabelText({ text, color }: { text: string; color: string }) {
  const parts = text.split(/(\$[^$]+\$)/g)
  return (
    <span className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color }}>
      {parts.map((p, i) => {
        if (p.startsWith("$") && p.endsWith("$") && p.length > 2) {
          const html = katex.renderToString(p.slice(1, -1), { throwOnError: false, displayMode: false, output: "html" })
          return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        }
        return <span key={i}>{p}</span>
      })}
    </span>
  )
}
