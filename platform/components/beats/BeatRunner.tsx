"use client"

import "katex/dist/katex.min.css"
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type ReactNode } from "react"
import styles from "./beats.module.css"
import Shell, { Keypad } from "./Shell"
import type { BeatOf } from "./beat"
import { offerShowMe, applyStep, endWalk, SHOW_ME_LABEL, TYPE_IT_IN, STEP_READ, type WalkScene } from "./walk"
import { cardFor, cardView, CARD_HOLD, CARD_OUT, type Card } from "./chapter"

/** What the runner needs from a lesson's board. */
export interface RunnerScene extends WalkScene {
  flashGood: number
  drag: unknown
  note: { text: string; until: number; tone?: "wrong" | "calm" } | null
}

type Point = [number, number]

/**
 * A lesson's board and how to drive it: the runner owns the beats, the
 * timing, the title cards, "Show me how", the keypad and the keyboard; the
 * engine owns everything on the board.
 */
export interface BeatEngine<S extends RunnerScene, L extends { keypadTop: number }> {
  createScene: () => S
  layout: (S: S) => L
  step: (S: S, dt: number) => void
  resize: (S: S, w: number, h: number) => void
  pointerDown: (S: S, p: Point, touch: boolean) => boolean
  pointerMove: (S: S, p: Point) => void
  pointerUp: (S: S) => void
  typeKey: (S: S, key: string) => void
  Stage: ComponentType<{ S: S; L: L }>
  /** the pointer over the board for the beat's task */
  cursor: (S: S) => string
  /** what `window.__beatApi` offers test scripts, beside the beat list (with ?debug) */
  debug?: Record<string, unknown>
  /** controls beside the keypad (a stepper, word choices); their handlers act on `S`, the live board */
  controls?: (S: S, L: L) => ReactNode
  /** a key the lesson handles before the runner does; true when it did */
  onKey?: (S: S, e: KeyboardEvent) => boolean
  /** what lights up when a doing beat is done (default: the board flashes green) */
  onDone?: (S: S) => void
  /** seconds past `minPlay` after which a playing beat offers the arrow anyway (null: never) */
  freeFallback?: number | null
  /** the keypad's keys, when not just digits (a calculator) */
  keypadKeys?: (S: S) => string[][]
  /** the keypad key a keyboard key stands for (default: digits, Backspace, Enter) */
  keyOf?: (key: string) => string | null
  /** keys shown pressed down (SHIFT) */
  keypadLit?: (S: S) => string[]
}

/**
 * Runs a lesson's beats over one board. A doing beat finishes itself, a
 * playing beat offers the arrow once its goal is met, a watching beat waits
 * for the arrow. `?beat=N` opens beat N directly, for review; a new part of
 * the lesson shows its title first.
 *
 * The board is a mutable object owned by a ref. The animation loop and the
 * pointer handlers write to it; once a frame, React gets a fresh view of it.
 */
export default function BeatRunner<S extends RunnerScene, L extends { keypadTop: number }>({ engine, beats, closeHref }: {
  engine: BeatEngine<S, L>
  beats: BeatOf<S>[]
  closeHref: string
}) {
  const sceneRef = useRef<S | null>(null)
  if (sceneRef.current === null) sceneRef.current = engine.createScene()
  const [view, setView] = useState<{ S: S; idx: number; frame: number; doneAt: number | null; walk: number; walkSince: number; card: ReturnType<typeof cardView> } | null>(null)
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
    const next = Math.max(0, Math.min(beats.length - 1, n))
    idxRef.current = next
    doneFired.current = false
    doneAt.current = null
    walkAt.current = -1
    // a new part of the lesson: its title first, and the beat starts as the title leaves
    card.current = titled ? cardFor(beats, next, S.time) : null
    if (card.current) { S.note = null; return }
    S.beatStart = S.time
    beats[next].enter(S)
  }, [beats])

  // The title leaves (on its own, or because the student tapped): the beat starts.
  const liftCard = useCallback(() => {
    const S = sceneRef.current!
    const c = card.current
    if (!c || c.leaving !== null) return
    c.leaving = S.time
    S.beatStart = S.time
    beats[idxRef.current].enter(S)
  }, [beats])

  // Size the board to the screen, and keep it sized.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const measure = () => engine.resize(sceneRef.current!, el.clientWidth, el.clientHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [engine])

  // The animation loop. Opens the first beat, and notices when a doing
  // beat is done.
  useEffect(() => {
    const S = sceneRef.current!
    // Handle for scripted play-throughs: always in development, and with
    // ?debug in production.
    if (process.env.NODE_ENV !== "production" || new URLSearchParams(window.location.search).has("debug")) {
      (window as unknown as { __beatScene?: S }).__beatScene = S;
      (window as unknown as { __beatApi?: unknown }).__beatApi = { ...engine.debug, beats: beats.map(b => ({ id: b.id, walk: b.walk?.length ?? 0 })) }
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
      engine.step(S, dt)
      const c = card.current
      if (c && c.leaving === null && S.time - c.start >= CARD_HOLD) liftCard()
      if (c && c.leaving !== null && S.time - c.leaving >= CARD_OUT) card.current = null
      const waiting = !!card.current && card.current.leaving === null
      const b = beats[idxRef.current]
      if (!waiting && b.done && !doneFired.current && b.done(S)) {
        doneFired.current = true
        doneAt.current = S.time
        if (engine.onDone) engine.onDone(S)
        else S.flashGood = Math.max(S.flashGood, 0.8)
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
  }, [go, liftCard, beats, engine])

  const fallback = engine.freeFallback === undefined ? 14 : engine.freeFallback

  const ctaNow = useCallback(
    () => ctaFor(beats[idxRef.current], sceneRef.current!, doneAt.current, walkAt.current, walkSince.current, fallback),
    [beats, fallback],
  )

  const ctaReady = useCallback(() => ctaNow() !== null, [ctaNow])

  const onCta = useCallback(() => {
    const S = sceneRef.current!
    const b = beats[idxRef.current]
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
  }, [go, ctaNow, beats])

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
        if (engine.keyOf) {
          const k = engine.keyOf(e.key)
          if (k) { e.preventDefault(); engine.typeKey(S, k); return }
        } else {
          if (/^\d$/.test(e.key)) { engine.typeKey(S, e.key); return }
          if (e.key === "Backspace") { engine.typeKey(S, "back"); return }
          if (e.key === "Enter") { engine.typeKey(S, "go"); return }
        }
      }
      if (engine.onKey?.(S, e)) return
      if ((e.key === "Enter" || e.key === "ArrowRight" || e.key === " ") && ctaReady()) { e.preventDefault(); onCta() }
      if (e.key === "ArrowLeft" && idxRef.current > 0) go(idxRef.current - 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [go, onCta, ctaReady, liftCard, engine])

  const local = (e: React.PointerEvent): Point => {
    const r = e.currentTarget.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  const S = view?.S
  const beat = beats[view?.idx ?? 0]
  const L = S ? engine.layout(S) : null
  const w = view?.walk ?? -1
  // while a title is up, the board waits: no phrase, no button
  const waiting = !!view?.card && !view.card.leaving
  const cta = S && !waiting ? ctaFor(beat, S, view?.doneAt ?? null, w, view?.walkSince ?? 0, fallback) : null
  const steps = beat.walk
  const walking = !!steps && w >= 0
  const phrase = !S || waiting ? "" : walking && w < steps.length ? steps[w].say : walking ? TYPE_IT_IN : beat.say
  const { Stage } = engine

  return (
    <Shell
      progress={(view?.idx ?? 0) / (beats.length - 1)}
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
        style={{ cursor: S ? engine.cursor(S) : "default" }}
        onPointerDown={e => {
          if (engine.pointerDown(sceneRef.current!, local(e), e.pointerType !== "mouse")) e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => engine.pointerMove(sceneRef.current!, local(e))}
        onPointerUp={() => engine.pointerUp(sceneRef.current!)}
        onPointerCancel={() => engine.pointerUp(sceneRef.current!)}
      >
        {S && L && <Stage S={S} L={L} />}
      </div>
      {S && L && S.input && S.vis.keypad.t > 0.5 && (
        <Keypad top={L.keypadTop} rows={engine.keypadKeys?.(S)} lit={engine.keypadLit?.(S)} onKey={k => engine.typeKey(sceneRef.current!, k)} />
      )}
      {S && L && engine.controls?.(S, L)}
    </Shell>
  )
}

/** What the button at the bottom does right now, if it is up. */
function ctaFor<S extends RunnerScene>(b: BeatOf<S>, S: S, doneAt: number | null, w: number, walkSince: number, fallback: number | null): { label: string; act: "next" | "showMe" | "step" } | null {
  const steps = b.walk
  if (steps && w >= 0 && w < steps.length) return S.time - walkSince >= STEP_READ ? { label: "", act: "step" } : null
  if (offerShowMe(S, steps, w)) return { label: SHOW_ME_LABEL, act: "showMe" }
  return showsCta(b, S, doneAt, fallback) ? { label: b.free ? "" : b.cta ?? "", act: "next" } : null
}

/**
 * Whether the continue button is up. A playing beat offers it once its goal
 * is met and the student has had at least `minPlay` seconds with the board;
 * a student who played a little and stopped is never left without a way on.
 */
function showsCta<S extends RunnerScene>(b: BeatOf<S>, S: S, doneAt: number | null, fallback: number | null) {
  const elapsed = S.time - S.beatStart
  if (b.free) return (doneAt !== null && elapsed >= (b.minPlay ?? 0) && S.time - doneAt >= 0.8) || (fallback !== null && elapsed >= (b.minPlay ?? 0) + fallback)
  return b.cta !== undefined && elapsed >= (b.ctaAfter ?? 1)
}
