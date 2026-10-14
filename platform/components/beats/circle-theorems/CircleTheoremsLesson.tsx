"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import styles from "../beats.module.css"
import Shell, { Keypad } from "../Shell"
import Stage from "./Stage"
import { BEATS } from "./beats"
import {
  type Scene, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  angleList, posOf, angOf,
} from "./scene"

/**
 * Runs the circle theorem beats over one board. Same runner as the triangle
 * lesson: a doing beat finishes itself, a playing beat offers the arrow
 * once its goal is met, a watching beat waits for the arrow. `?beat=N`
 * opens beat N directly, for review.
 */
export default function CircleTheoremsLesson({ closeHref }: { closeHref: string }) {
  const sceneRef = useRef<Scene | null>(null)
  if (sceneRef.current === null) sceneRef.current = createScene()
  const [view, setView] = useState<{ S: Scene; idx: number; frame: number; doneAt: number | null } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const doneFired = useRef(false)
  // When a playing beat's goal was first met (scene time), or null.
  const doneAt = useRef<number | null>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const go = useCallback((n: number) => {
    const S = sceneRef.current!
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null }
    const next = Math.max(0, Math.min(BEATS.length - 1, n))
    idxRef.current = next
    doneFired.current = false
    doneAt.current = null
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
      (window as unknown as { __beatScene?: Scene }).__beatScene = S;
      (window as unknown as { __beatApi?: unknown }).__beatApi = { layout, angleList, posOf, angOf }
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
        doneAt.current = S.time
        // only what the student just drew or moved lights up (S.touched)
        if (S.touched) S.flashGood = Math.max(S.flashGood, 0.8)
        // A playing beat stays put: the student keeps going and taps on
        // when ready. Every other doing beat moves on by itself.
        if (!b.free) {
          const from = idxRef.current
          advanceTimer.current = setTimeout(() => {
            advanceTimer.current = null
            if (idxRef.current === from) go(from + 1)
          }, b.advanceAfter ?? 1800)
        }
      }
      frame = (frame + 1) % 1_000_000
      setView({ S, idx: idxRef.current, frame, doneAt: doneAt.current })
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
    return showsCta(BEATS[idxRef.current], S, doneAt.current)
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
  const ctaShown = !!S && showsCta(beat, S, view?.doneAt ?? null)

  return (
    <Shell
      progress={(view?.idx ?? 0) / (BEATS.length - 1)}
      phrase={S ? beat.say : ""}
      phraseKey={S ? beat.id : "-"}
      note={S?.note?.text ?? null}
      noteKey={String(S?.note?.until ?? 0)}
      noteTone={S?.note?.tone ?? "wrong"}
      cta={ctaShown ? (beat.free ? "" : beat.cta ?? "") : null}
      onCta={onCta}
      closeHref={closeHref}
    >
      <div
        ref={rootRef}
        className={styles.stage}
        style={{ cursor: S?.drag ? "grabbing" : S?.mode === "join" || S?.mode === "drawDiam" || S?.mode === "drawChord" || S?.mode === "drawThrough" || S?.mode === "compass" ? "crosshair" : S?.mode === "tapAngle" || S?.mode === "tapLine" || S?.mode === "tapRegion" || S?.mode === "tapPoint" || S?.mode === "place" ? "pointer" : "default" }}
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

/**
 * Whether the continue button is up. A playing beat offers it once its goal
 * is met and the student has had at least `minPlay` seconds with the board.
 */
function showsCta(b: (typeof BEATS)[number], S: Scene, doneAt: number | null) {
  const elapsed = S.time - S.beatStart
  // a student who played a little and stopped is never left without a way on
  if (b.free) return (doneAt !== null && elapsed >= (b.minPlay ?? 0) && S.time - doneAt >= 0.8) || elapsed >= (b.minPlay ?? 0) + 14
  return b.cta !== undefined && elapsed >= (b.ctaAfter ?? 1)
}
