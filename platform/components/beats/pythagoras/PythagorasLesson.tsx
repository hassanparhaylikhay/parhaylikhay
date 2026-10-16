"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import styles from "../beats.module.css"
import Shell, { Keypad } from "../Shell"
import Stage from "./Stage"
import { BEATS } from "./beats"
import { offerShowMe, applyStep, endWalk, SHOW_ME_LABEL, TYPE_IT_IN, STEP_READ } from "../walk"
import { cardFor, cardView, CARD_HOLD, CARD_OUT, type Card } from "../chapter"
import {
  type Scene, createScene, layout, step, resize, pointerDown, pointerMove, pointerUp, typeKey,
  posOf, wOf, sq2, toScreen, proofAt, proofAB,
} from "./scene"

/**
 * Runs the Pythagoras beats over one board. Same runner as the triangle
 * lesson: a doing beat finishes itself, a playing beat offers the arrow
 * once its goal is met, a watching beat waits for the arrow. `?beat=N`
 * opens beat N directly, for review.
 */
export default function PythagorasLesson({ closeHref }: { closeHref: string }) {
  const sceneRef = useRef<Scene | null>(null)
  if (sceneRef.current === null) sceneRef.current = createScene()
  const [view, setView] = useState<{ S: Scene; idx: number; frame: number; doneAt: number | null; walk: number; walkSince: number; card: ReturnType<typeof cardView> } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const idxRef = useRef(0)
  const doneFired = useRef(false)
  // When a playing beat's goal was first met (scene time), or null.
  const doneAt = useRef<number | null>(null)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // "Show me how": -1 before it starts, then the step on screen, then the number of steps once done
  const walkAt = useRef(-1)
  const walkSince = useRef(0)
  // the title of a new part of the lesson, while it is up (chapter.ts)
  const card = useRef<Card | null>(null)

  const go = useCallback((n: number, titled = false) => {
    const S = sceneRef.current!
    if (advanceTimer.current) { clearTimeout(advanceTimer.current); advanceTimer.current = null }
    const next = Math.max(0, Math.min(BEATS.length - 1, n))
    idxRef.current = next
    doneFired.current = false
    doneAt.current = null
    walkAt.current = -1
    // a new part of the lesson: its title first, and the beat starts as the title leaves
    card.current = titled ? cardFor(BEATS, next, S.time) : null
    if (card.current) { S.note = null; return }
    S.beatStart = S.time
    BEATS[next].enter(S)
  }, [])

  // The title leaves (on its own, or because the student tapped): the beat starts.
  const liftCard = useCallback(() => {
    const S = sceneRef.current!
    const c = card.current
    if (!c || c.leaving !== null) return
    c.leaving = S.time
    S.beatStart = S.time
    BEATS[idxRef.current].enter(S)
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
      (window as unknown as { __beatApi?: unknown }).__beatApi = { layout, posOf, wOf, sq2, toScreen, proofAt, proofAB, beats: BEATS.map(b => ({ id: b.id, walk: b.walk?.length ?? 0 })) }
    }
    let raf = 0
    let last = performance.now()
    let started = false
    let frame = 0
    const loop = (t: number) => {
      if (!started) {
        started = true
        const n = Number(new URLSearchParams(window.location.search).get("beat"))
        const cold = Number.isFinite(n) && n >= 1
        go(cold ? n - 1 : 0, !cold)
      }
      const dt = Math.min(0.05, (t - last) / 1000)
      last = t
      S.time += dt
      step(S, dt)
      const c = card.current
      if (c && c.leaving === null && S.time - c.start >= CARD_HOLD) liftCard()
      if (c && c.leaving !== null && S.time - c.leaving >= CARD_OUT) card.current = null
      const waiting = !!card.current && card.current.leaving === null
      const b = BEATS[idxRef.current]
      if (!waiting && b.done && !doneFired.current && b.done(S)) {
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
            if (idxRef.current === from) go(from + 1, true)
          }, b.advanceAfter ?? 1800)
        }
      }
      frame = (frame + 1) % 1_000_000
      setView({ S, idx: idxRef.current, frame, doneAt: doneAt.current, walk: walkAt.current, walkSince: walkSince.current, card: cardView(card.current) })
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
    }
  }, [go, liftCard])

  const ctaNow = useCallback(
    () => ctaFor(BEATS[idxRef.current], sceneRef.current!, doneAt.current, walkAt.current, walkSince.current),
    [],
  )

  const ctaReady = useCallback(() => ctaNow() !== null, [ctaNow])

  const onCta = useCallback(() => {
    const S = sceneRef.current!
    const b = BEATS[idxRef.current]
    const c = ctaNow()
    const steps = b.walk
    if (c?.act === "showMe" && steps) {
      // start from the question as it was asked: hints from wrong answers go,
      // and each step then adds one thing
      b.enter(S)
      walkAt.current = 0
      walkSince.current = S.time
      applyStep(S, steps[0])
      return
    }
    if (c?.act === "step" && steps) {
      const nx = walkAt.current + 1
      walkAt.current = nx
      walkSince.current = S.time
      if (nx < steps.length) applyStep(S, steps[nx])
      else endWalk(S)
      return
    }
    go(b.restart ? 0 : idxRef.current + 1, true)
  }, [go, ctaNow])

  // Keyboard: digits for answers, Enter or the right arrow to continue,
  // the left arrow to step back.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const S = sceneRef.current!
      if (card.current && card.current.leaving === null) {
        if (e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); liftCard() }
        return
      }
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
  }, [go, onCta, ctaReady, liftCard])

  const local = (e: React.PointerEvent): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const S = view?.S
  const beat = BEATS[view?.idx ?? 0]
  const L = S ? layout(S) : null
  const w = view?.walk ?? -1
  // while a title is up, the board waits: no phrase, no button
  const waiting = !!view?.card && !view.card.leaving
  const cta = S && !waiting ? ctaFor(beat, S, view?.doneAt ?? null, w, view?.walkSince ?? 0) : null
  const steps = beat.walk
  const walking = !!steps && w >= 0
  const phrase = !S || waiting ? "" : walking && w < steps.length ? steps[w].say : walking ? TYPE_IT_IN : beat.say

  return (
    <Shell
      progress={(view?.idx ?? 0) / (BEATS.length - 1)}
      phrase={phrase}
      phraseKey={!S ? "-" : waiting ? `card-${view?.card?.key}` : `${beat.id}${walking ? `~${w}` : ""}`}
      note={waiting ? null : S?.note?.text ?? null}
      noteKey={String(S?.note?.until ?? 0)}
      noteTone={S?.note?.tone ?? "wrong"}
      cta={cta ? cta.label : null}
      onCta={onCta}
      closeHref={closeHref}
      card={view?.card ?? null}
      onSkipCard={liftCard}
    >
      <div
        ref={rootRef}
        className={styles.stage}
        style={{ cursor: S?.drag ? "grabbing" : S?.mode === "join" ? "crosshair" : S?.mode === "tapSeg" || S?.mode === "tapProof" ? "pointer" : "default" }}
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

/** What the button at the bottom does right now, if it is up. */
function ctaFor(b: (typeof BEATS)[number], S: Scene, doneAt: number | null, w: number, walkSince: number): { label: string; act: "next" | "showMe" | "step" } | null {
  const steps = b.walk
  if (steps && w >= 0 && w < steps.length) return S.time - walkSince >= STEP_READ ? { label: "", act: "step" } : null
  if (offerShowMe(S, steps, w)) return { label: SHOW_ME_LABEL, act: "showMe" }
  return showsCta(b, S, doneAt) ? { label: b.free ? "" : b.cta ?? "", act: "next" } : null
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
