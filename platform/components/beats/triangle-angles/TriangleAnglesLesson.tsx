"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import styles from "../beats.module.css"
import Shell, { Keypad } from "../Shell"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
} from "./scene"

/**
 * Runs the beats over one board. A doing beat finishes itself when the
 * student has done the thing; a watching beat waits for the continue
 * button. `?beat=N` opens beat N directly, for review.
 *
 * The board is a mutable object owned by a ref. The animation loop and the
 * pointer handlers write to it; once a frame, React gets a fresh view of it.
 */
export default function TriangleAnglesLesson({ closeHref }: { closeHref: string }) {
  const sceneRef = useRef<Scene | null>(null)
  if (sceneRef.current === null) sceneRef.current = createScene()
  const [view, setView] = useState<{ S: Scene; idx: number; frame: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const doneFired = useRef(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const go = useCallback((n: number) => {
    const S = sceneRef.current!
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null }
    const next = Math.max(0, Math.min(BEATS.length - 1, n))
    idxRef.current = next
    doneFired.current = false
    S.beatStart = S.time
    BEATS[next].enter(S)
  }, [])

  // Size the board to the screen, and keep it sized.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => resize(sceneRef.current!, el.clientWidth, el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // The animation loop. Opens the first beat, and notices when a doing
  // beat is done.
  useEffect(() => {
    const S = sceneRef.current!
    // Handle for scripted play-throughs: always in development, and with
    // ?debug in production.
    if (process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __beatScene?: Scene }).__beatScene = S
    }
    let raf = 0
    let last = performance.now()
    let started = false
    let frame = 0
    const loop = (t: number) => {
      if (!started) {
        started = true
        const n = Number(new URLSearchParams(window.location.search).get("beat"))
        go(Number.isFinite(n) && n >= 1 ? n - 1 : 0)
      }
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      S.time += dt
      step(S, dt)
      const b = BEATS[idxRef.current]
      if (b.done && !doneFired.current && b.done(S)) {
        doneFired.current = true
        S.flashGood = Math.max(S.flashGood, 0.8)
        const from = idxRef.current
        advanceTimer.current = setTimeout(() => {
          advanceTimer.current = null
          if (idxRef.current === from) go(from + 1)
        }, b.id === "draw" ? 1200 : 1100)
      }
      frame = (frame + 1) % 1_000_000
      setView({ S, idx: idxRef.current, frame })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [go])

  const ctaReady = useCallback(() => {
    const S = sceneRef.current!
    const b = BEATS[idxRef.current]
    return b.cta !== undefined && S.time - S.beatStart >= (b.ctaAfter ?? 1)
  }, [])

  const onCta = useCallback(() => {
    const b = BEATS[idxRef.current]
    go(b.restart ? 0 : idxRef.current + 1)
  }, [go])

  // Keyboard: digits for answers, Enter or the right arrow to continue,
  // the left arrow to step back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const S = sceneRef.current!
      if (S.input && S.vis.keypad.t > 0.5) {
        if (/^\d$/.test(e.key)) { typeKey(S, e.key); return }
        if (e.key === "Backspace") { typeKey(S, "back"); return }
        if (e.key === "Enter") { typeKey(S, "go"); return }
      }
      if ((e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") && ctaReady()) { e.preventDefault(); onCta() }
      if (e.key === "ArrowLeft" && idxRef.current > 0) go(idxRef.current - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, onCta, ctaReady])

  const local = (e: React.PointerEvent): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const S = view?.S
  const beat = BEATS[view?.idx ?? 0]
  const L = S ? layout(S) : null
  const ctaShown = !!S && beat.cta !== undefined && S.time - S.beatStart >= (beat.ctaAfter ?? 1)

  return (
    <Shell
      progress={(view?.idx ?? 0) / (BEATS.length - 1)}
      phrase={S ? beat.say : ""}
      phraseKey={S ? beat.id : "-"}
      note={S?.note?.text ?? null}
      noteKey={String(S?.note?.until ?? 0)}
      cta={ctaShown ? beat.cta ?? "" : null}
      onCta={onCta}
      closeHref={closeHref}
    >
      <div
        ref={rootRef}
        className={styles.stage}
        style={{ cursor: S?.drag ? "grabbing" : S?.mode === "draw" ? "crosshair" : "default" }}
        onPointerDown={e => {
          if (pointerDown(sceneRef.current!, local(e), e.pointerType !== "mouse")) e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => pointerMove(sceneRef.current!, local(e))}
        onPointerUp={() => pointerUp(sceneRef.current!)}
        onPointerCancel={() => pointerUp(sceneRef.current!)}
      >
        {S && L && <Stage S={S} L={L} />}
      </div>
      {S && L && S.input && S.vis.keypad.t > 0.5 && (
        <Keypad top={L.keypadTop} onKey={k => typeKey(sceneRef.current!, k)} />
      )}
    </Shell>
  )
}
