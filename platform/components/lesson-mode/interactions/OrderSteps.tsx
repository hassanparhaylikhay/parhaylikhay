"use client"

import { useEffect, useRef, useState } from "react"
import { COLOR, Prompt, AltDemoCard, HelperRow, MixedText, type InteractionProps } from "./_shared"

type Step = {
  id: string
  /** Tile text (may include $...$). */
  text: string
}

export type OrderStepsConfig = {
  prompt?: string
  /** Steps in the CORRECT order. Order is what the student must reproduce. */
  steps: Step[]
  /** Optional caption above the slot rail. */
  goalLabel?: string
  /** Optional ordering direction. */
  direction?: "horizontal" | "vertical"
  successText?: string
  /** Verify slides: no show-me reveal. Injected by InteractionSlide. */
  noHelp?: boolean
  /** Animated demonstration of the method, injected by LessonRunner when the
   *  student taps "explain another way". Shown ON the canvas, never in place
   *  of the question. */
  altDemo?: string
}

/**
 * Deterministic tray order that is guaranteed to differ from both the
 * correct order and its exact reverse. The previous approach (sort by id,
 * then reverse) put the tray in the exact reverse of the correct order
 * every time, which students learn to exploit after two slides.
 */
function trayOrder(steps: Step[]): Step[] {
  const n = steps.length
  if (n < 3) return [...steps].reverse()
  // Interleave from the middle outwards: for [a,b,c,d] gives [c,b,d,a].
  const out: Step[] = []
  let lo = Math.floor((n - 1) / 2)
  let hi = lo + 1
  let takeLow = true
  while (out.length < n) {
    if (takeLow && lo >= 0) out.push(steps[lo--])
    else if (hi < n) out.push(steps[hi++])
    else if (lo >= 0) out.push(steps[lo--])
    takeLow = !takeLow
  }
  const same = (a: Step[], b: Step[]) => a.every((s, i) => s.id === b[i].id)
  if (same(out, steps) || same(out, [...steps].reverse())) {
    out.push(out.shift()!)
  }
  return out
}

/**
 * OrderSteps — student drags tiles into the correct sequence.
 *
 * Layout: a numbered slot rail (1, 2, 3, …) at the top; an unordered tray
 * at the bottom. Drag a tile from anywhere (tray or another slot) onto a
 * slot to assign it. Tiles automatically rearrange so each slot holds one
 * tile at a time.
 */
export default function OrderSteps({ config, onComplete, onDismissAlt, onShowMeUsed }: InteractionProps<OrderStepsConfig>) {
  const N = config.steps.length
  // Tray order computed once; deterministic but never the correct order
  // and never its exact reverse.
  const shuffled = useRef<Step[]>([])
  if (shuffled.current.length !== N) {
    shuffled.current = trayOrder(config.steps)
  }

  // slot[i] holds the id of the tile placed there, or null
  const [slots, setSlots] = useState<Array<string | null>>(Array(N).fill(null))
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const slotRefs = useRef<Array<HTMLDivElement | null>>([])
  const [done, setDone] = useState(false)

  // Done when every slot[i] == steps[i].id
  useEffect(() => {
    if (done) return
    const correct = slots.every((id, i) => id === config.steps[i].id)
    if (correct) {
      setDone(true)
      onComplete({ order: slots })
    }
  }, [slots, config.steps, done, onComplete])

  const trayTiles = shuffled.current.filter(t => !slots.includes(t.id))

  function pickup(e: React.PointerEvent, id: string) {
    if (done) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setDragId(id)
    setDragPos({ x: e.clientX, y: e.clientY })
    // remove this tile from whichever slot it was in (if any)
    setSlots(prev => prev.map(x => (x === id ? null : x)))
  }

  function onMove(e: React.PointerEvent) {
    if (dragId === null) return
    setDragPos({ x: e.clientX, y: e.clientY })
  }

  function drop(e: React.PointerEvent) {
    if (dragId === null) return
    const id = dragId
    setDragId(null)
    setDragPos(null)
    // hit-test slots
    for (let i = 0; i < N; i++) {
      const node = slotRefs.current[i]
      if (!node) continue
      const r = node.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
        setSlots(prev => {
          const next = [...prev]
          // if some other tile was here, kick it back to the tray (set to null)
          next[i] = id
          return next
        })
        return
      }
    }
    // dropped outside any slot — already removed; goes back to tray
  }

  function showMe() {
    onShowMeUsed?.()
    setSlots(config.steps.map(s => s.id))
  }

  const vertical = config.direction === "vertical"

  return (
    <div className="w-full flex flex-col items-center">
      <Prompt>{config.prompt}</Prompt>
      <AltDemoCard svg={config.altDemo} onDismiss={onDismissAlt} />

      {config.goalLabel && (
        <p className="text-[11px] font-mono uppercase tracking-[2px] mb-3" style={{ color: COLOR.faint }}>
          {config.goalLabel}
        </p>
      )}

      {/* Slot rail */}
      <div
        className={
          vertical
            ? "flex flex-col gap-2 mb-6 w-full max-w-[420px]"
            : "flex flex-wrap gap-2 sm:gap-3 mb-7 max-w-[720px] justify-center"
        }
      >
        {Array.from({ length: N }, (_, i) => {
          const filledId = slots[i]
          const filledTile = config.steps.find(s => s.id === filledId)
          const isCorrect = done
          return (
            <div
              key={i}
              ref={el => { slotRefs.current[i] = el }}
              className={`relative rounded-lg border-[1.5px] flex items-center transition-all duration-300 ${isCorrect ? "pl-success-pulse" : ""} ${vertical ? "h-12" : "h-11 sm:h-12"} ${vertical ? "" : "min-w-[110px]"}`}
              style={{
                borderColor: isCorrect ? COLOR.green : COLOR.border,
                borderStyle: filledTile ? "solid" : "dashed",
                background: isCorrect ? "rgba(15,238,137,0.06)" : COLOR.card,
                paddingLeft: 10,
                paddingRight: 14,
              }}
            >
              <span className="text-[10px] font-mono mr-3" style={{ color: COLOR.faint }}>
                {i + 1}
              </span>
              {filledTile ? (
                <button
                  onPointerDown={e => pickup(e, filledTile.id)}
                  onPointerMove={onMove}
                  onPointerUp={drop}
                  onPointerCancel={drop}
                  className="flex-1 text-left cursor-grab active:cursor-grabbing select-none touch-none"
                >
                  <MixedText text={filledTile.text} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: isCorrect ? COLOR.green : COLOR.text }} />
                </button>
              ) : (
                <span className="text-[11px] uppercase tracking-wider opacity-50" style={{ color: COLOR.faint }}>
                  drop here
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Tray */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center min-h-[52px] max-w-[720px]">
        {trayTiles.map(t => {
          const isDragging = dragId === t.id
          return (
            <div
              key={t.id}
              onPointerDown={e => pickup(e, t.id)}
              onPointerMove={onMove}
              onPointerUp={drop}
              onPointerCancel={drop}
              className="h-11 sm:h-12 px-4 rounded-lg border-[1.5px] flex items-center cursor-grab active:cursor-grabbing select-none touch-none"
              style={{
                borderColor: "#2e3f58",
                background: "#0f161f",
                opacity: isDragging ? 0.3 : 1,
              }}
            >
              <MixedText text={t.text} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: COLOR.white }} />
            </div>
          )
        })}
      </div>

      {dragId && dragPos && (
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
          <MixedText text={config.steps.find(s => s.id === dragId)?.text ?? ""} className="text-[14.5px] sm:text-[16px] font-medium transition-colors duration-300" style={{ color: COLOR.white }} />
        </div>
      )}

      {done && config.successText && (
        <MixedText
          text={config.successText}
          className="mt-6 block text-[16px] sm:text-[17px] text-[#0fee89] pl-reveal text-center max-w-[600px] leading-relaxed"
        />
      )}

      {!config.noHelp && <HelperRow onShowMe={!done ? showMe : undefined} />}
    </div>
  )
}

