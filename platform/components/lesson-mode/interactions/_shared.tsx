"use client"

import { useEffect, useState } from "react"

/**
 * Common bits used by every interaction component.
 */

export type InteractionProps<Config = Record<string, unknown>> = {
  config: Config
  savedData?: Record<string, unknown>
  onComplete: (data?: Record<string, unknown>) => void
}

/** Brand colours, single source of truth across all interactions. */
export const COLOR = {
  bg:       "#07090d",
  card:     "#0b1118",
  border:   "#141e2a",
  faint:    "#3a4a5a",
  grey:     "#7a7875",
  text:     "#c8c6be",
  white:    "#f0eeea",
  blue:     "#00abfa",
  yellow:   "#fff067",
  orange:   "#ff822c",
  green:    "#0fee89",
  pink:     "#ff4670",
  grid:     "#1a3350",
}

/**
 * One-line prompt above the canvas. Geist text, soft white, single line.
 */
export function Prompt({ children }: { children: React.ReactNode }) {
  if (!children) return null
  return (
    <p className="text-[15px] sm:text-[16px] text-[#c8c6be] leading-snug max-w-[640px] text-center mb-6">
      {children}
    </p>
  )
}

/**
 * Tiny "show me" + "explain another way" link row that lives just under the
 * interactive canvas. Each is optional.
 */
export function HelperRow({
  showMeLabel = "show me",
  onShowMe,
}: {
  showMeLabel?: string
  onShowMe?: () => void
}) {
  if (!onShowMe) return null
  return (
    <div className="mt-4 flex items-center justify-center">
      <button
        onClick={onShowMe}
        className="text-[11px] font-mono text-[#3a4a5a] hover:text-[#7a7875] transition-colors"
      >
        {showMeLabel}
      </button>
    </div>
  )
}

/**
 * Animated success ring that appears briefly after a correct answer.
 * Caller sets `visible` true; component handles the fade.
 */
export function SuccessFlash({ visible }: { visible: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-xl transition-opacity duration-300"
      style={{
        opacity: visible ? 1 : 0,
        boxShadow: visible ? "inset 0 0 0 1px rgba(15,238,137,0.6), 0 0 40px -10px rgba(15,238,137,0.5)" : "none",
      }}
    />
  )
}

/**
 * useShake — returns [isShaking, fire()] so a parent can briefly shake an
 * element when the student answers wrong.
 */
export function useShake() {
  const [shaking, setShaking] = useState(false)
  function fire() {
    setShaking(true)
    setTimeout(() => setShaking(false), 220)
  }
  return [shaking, fire] as const
}

/**
 * Hook returning a smoothed value via spring lerp. Pass a target, get the
 * displayed value (lerps every frame until close).
 */
export function useSpring(target: number, factor = 0.22, eps = 0.001): number {
  const [display, setDisplay] = useState(target)
  useEffect(() => {
    let raf = 0
    let alive = true
    function tick() {
      setDisplay(prev => {
        const next = prev + (target - prev) * factor
        if (Math.abs(target - next) < eps) {
          return target
        }
        if (alive) raf = requestAnimationFrame(tick)
        return next
      })
    }
    raf = requestAnimationFrame(tick)
    return () => { alive = false; cancelAnimationFrame(raf) }
  }, [target, factor, eps])
  return display
}

/**
 * Standard CSS keyframes used across interactions. Inject once in the
 * runner; all interactions share them.
 */
export const interactionStyles = `
@keyframes pl-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-4px); }
  40% { transform: translateX(4px); }
  60% { transform: translateX(-3px); }
  80% { transform: translateX(3px); }
}
.pl-shake { animation: pl-shake 220ms ease-in-out; }

@keyframes pl-success-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(15,238,137,0.45); }
  60%  { box-shadow: 0 0 0 16px rgba(15,238,137,0); }
  100% { box-shadow: 0 0 0 0 rgba(15,238,137,0); }
}
.pl-success-pulse { animation: pl-success-pulse 600ms ease-out; }

@keyframes pl-reveal {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pl-reveal { animation: pl-reveal 400ms ease-out forwards; }
`
