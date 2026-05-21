"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import DragHint from "../components/DragHint"
import styles from "../try.module.css"
import { COLOR } from "@/components/lesson-mode/interactions/_shared"

/**
 * Section 4 — Lesson Mode Preview.
 *
 * Three-slide carousel that walks the visitor through ONE conceptual
 * arc the way a real lesson does. Auto-advances every 4s; manual pause
 * + arrow controls; locks once the visitor interacts with the embedded
 * widget on slide 2.
 *
 * The slides are deliberately ordered to recreate the wrestle-then-reveal
 * pattern of real Lesson Mode:
 *  1) the question (curiosity)
 *  2) the doing (interaction)
 *  3) the naming (formal definition + ✓ on the student's earlier action)
 */

const SLIDE_MS = 4400
// Slide 2 holds the live puzzle, so it deserves more dwell-time than
// the other slides — the visitor needs a moment to read the prompt
// AND drag the triangle to land on the dashed outline.
const SLIDE_2_MS = 11000

export default function LessonModePreviewSection() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [solvedSlide2, setSolvedSlide2] = useState(false)
  // Increment whenever slide 3 newly becomes active so SlideThree
  // remounts with step=0 — preferred over resetting state inside an effect.
  const [slide3Epoch, setSlide3Epoch] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Auto-advance, but only while the section is visible AND not paused
  // AND the visitor hasn't started solving slide 2. Slide 2 gets the
  // extended dwell time so the visitor can actually try the puzzle.
  useEffect(() => {
    if (!visible || paused) return
    if (idx === 1 && solvedSlide2) return
    const hold = idx === 1 ? SLIDE_2_MS : SLIDE_MS
    const t = setTimeout(() => setIdx(i => (i + 1) % 3), hold)
    return () => clearTimeout(t)
  }, [idx, paused, visible, solvedSlide2])

  // Track each entry into slide 3 so it remounts with a fresh reveal.
  // The setState is intentional — we want SlideThree to mount under a
  // new key every time the carousel lands on it, so its internal step
  // reveal restarts from 0 instead of "remembering" the last completion.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (idx === 2) setSlide3Epoch(n => n + 1) }, [idx])

  return (
    <Section
      ref={sectionRef}
      id="lesson-mode"
      ariaLabel="Lesson Mode preview"
      tall
      className={`${styles.modeShift} overflow-hidden`}
    >
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-28">
        <div
          className="text-center mb-12 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#00abfa] mb-3">
            lesson mode
          </p>
          <h2 className="font-sans text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] max-w-[24ch] mx-auto font-medium">
            Inside every topic: a guided lesson that takes students from <span className="text-[#fff067]">confused</span> to <span className="text-[#0fee89]">clear</span>, one interaction at a time.
          </h2>
        </div>

        {/* The slide stage */}
        <div
          className="relative rounded-2xl border overflow-hidden transition-all duration-[1100ms]"
          style={{
            background: "#0b1118",
            borderColor: "#141e2a",
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.985)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "200ms",
            minHeight: "min(680px, 84svh)",
          }}
        >
          {/* Slim mock chrome — mimics SlideFrame top strip */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#141e2a]">
            <span className="font-mono text-[10.5px] tracking-[1.5px] uppercase text-[#3a4a5a]">
              Lesson Mode · 7.1 Transformations
            </span>
            <span className="font-mono text-[10.5px] tracking-[1.5px] text-[#3a4a5a]">
              {String(idx + 1).padStart(2, "0")} / 03
            </span>
          </div>

          {/* Slide stack — only one is active. Min-height matches the
              outer card so the slide gets enough room to lay out the
              widget without forcing a scrollbar. */}
          <div className="relative" style={{ minHeight: "min(600px, 76svh)" }}>
            <div className={`absolute inset-0 ${styles.lmSlide} ${idx === 0 ? styles.lmSlideActive : ""}`}>
              <SlideOne running={idx === 0 && visible && !paused} />
            </div>
            <div className={`absolute inset-0 ${styles.lmSlide} ${idx === 1 ? styles.lmSlideActive : ""}`}>
              <SlideTwo active={idx === 1} onSolved={() => setSolvedSlide2(true)} solved={solvedSlide2} />
            </div>
            <div className={`absolute inset-0 ${styles.lmSlide} ${idx === 2 ? styles.lmSlideActive : ""}`}>
              <SlideThree key={slide3Epoch} active={idx === 2} solvedSlide2={solvedSlide2} />
            </div>
          </div>

          {/* Footer controls */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#141e2a]">
            <button
              onClick={() => setIdx(i => (i + 2) % 3)}
              className="font-mono text-[10.5px] tracking-[1.5px] uppercase text-[#7a7875] hover:text-[#f0eeea] transition-colors"
              aria-label="Previous slide"
            >
              ← prev
            </button>
            <div className="flex items-center gap-3">
              {[0, 1, 2].map(i => (
                <button
                  key={i}
                  onClick={() => { setIdx(i); setPaused(true) }}
                  aria-label={`Slide ${i + 1}`}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    background: i === idx ? "#0fee89" : "#3a4a5a",
                    transform: i === idx ? "scale(1.6)" : "scale(1)",
                  }}
                />
              ))}
              <button
                onClick={() => setPaused(p => !p)}
                className="ml-3 font-mono text-[10px] tracking-[1.5px] uppercase text-[#7a7875] hover:text-[#f0eeea] transition-colors px-2 py-1 rounded border border-[#1a2330]"
                aria-label={paused ? "Play" : "Pause"}
              >
                {paused ? "play" : "pause"}
              </button>
            </div>
            <button
              onClick={() => setIdx(i => (i + 1) % 3)}
              className="font-mono text-[10.5px] tracking-[1.5px] uppercase text-[#7a7875] hover:text-[#f0eeea] transition-colors"
              aria-label="Next slide"
            >
              next →
            </button>
          </div>
        </div>

        <p className="text-center text-[16px] sm:text-[18px] leading-[1.55] text-[#c8c6be] mt-14 max-w-[36ch] mx-auto">
          Each lesson is <span className="text-[#f0eeea]">20–30 frames</span> of pure interactivity.{" "}
          <span className="text-[#7a7875]">No passive videos. No walls of text.</span>{" "}
          Just discovery, step by step.
        </p>
      </div>
    </Section>
  )
}

/* ─────────────────── Slide 1 — the wordless hook ─────────────────── */

function SlideOne({ running }: { running: boolean }) {
  // A pristine square slides from one position to another. Wordless,
  // looping. The question text fades in beneath.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!running) return
    let raf = 0
    const start = performance.now()
    const loop = (t: number) => {
      setTick((t - start) / 1000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])

  // 4-second cycle: dwell 0.5s, slide 1.6s, dwell 0.5s, return 1.4s.
  const phase = (tick % 4)
  const ease = (t: number) => 1 - Math.pow(1 - t, 3)
  let progress = 0
  if (phase < 0.5)      progress = 0
  else if (phase < 2.1) progress = ease((phase - 0.5) / 1.6)
  else if (phase < 2.6) progress = 1
  else                  progress = 1 - ease((phase - 2.6) / 1.4)

  const offset = progress * 110     // px shift

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-12">
      <div className="relative" style={{ width: 320, height: 200 }}>
        {/* Coordinate grid */}
        <svg viewBox="0 0 320 200" className="absolute inset-0 w-full h-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={200}
              stroke={i === 4 ? "#243750" : "#141e2a"} strokeWidth={i === 4 ? 1 : 0.6} />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 40} x2={320} y2={i * 40}
              stroke={i === 2 ? "#243750" : "#141e2a"} strokeWidth={i === 2 ? 1 : 0.6} />
          ))}

          {/* Ghost square at start position */}
          <rect x={64} y={88} width={48} height={48}
            fill="none" stroke="#3a4a5a" strokeWidth="1" strokeDasharray="3 3" />

          {/* Moving square */}
          <rect
            x={64 + offset} y={88}
            width={48} height={48}
            fill="rgba(255,240,103,0.10)"
            stroke="#fff067"
            strokeWidth="1.8"
            style={{ filter: "drop-shadow(0 0 6px rgba(255,240,103,0.20))" }}
          />

          {/* Vector arrow showing the move */}
          {offset > 8 && (
            <g>
              <line
                x1={88} y1={112}
                x2={88 + offset - 4} y2={112}
                stroke="#0fee89"
                strokeWidth="1.4"
              />
              <polygon
                points={`${88 + offset},112 ${88 + offset - 6},108 ${88 + offset - 6},116`}
                fill="#0fee89"
              />
            </g>
          )}
        </svg>
      </div>
      <p className="text-center text-[18px] sm:text-[22px] md:text-[26px] text-[#f0eeea] leading-[1.35] mt-10 max-w-[24ch] font-medium tracking-[-0.015em]">
        What if every point moved the <span className="text-[#fff067]">same distance</span> in the <span className="text-[#fff067]">same direction</span>?
      </p>
    </div>
  )
}

/* ─────────────────── Slide 2 — guided interaction ─────────────────── */

function SlideTwo({ active, onSolved, solved }: { active: boolean; onSolved: () => void; solved: boolean }) {
  const ifrRef = useRef<HTMLIFrameElement | null>(null)

  // Fire onSolved when widget posts pl-lesson-success.
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (ifrRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-lesson-success") onSolved()
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [onSolved])

  // Resize iframe to fit the stage area. Depend on `active` so the
  // effect re-runs the moment the iframe is mounted (slide 2 becomes
  // visible). Previously this effect ran once on first mount when the
  // iframe wasn't yet in the DOM (rendered conditionally on `active`),
  // so the iframe stuck at the browser-default ~300×150 size until the
  // visitor happened to resize the window.
  useEffect(() => {
    if (!active) return
    function fit() {
      const ifr = ifrRef.current
      if (!ifr) return
      const vw = window.innerWidth
      // Slide stage = min(600, 76% of svh). Subtract chrome (prompt +
      // padding ≈ 90) for the iframe's max available height. Cap at
      // 460 so even on a 1200-tall desktop the widget stays compact.
      const stage = Math.min(600, window.innerHeight * 0.76)
      const maxW = Math.min(vw - 80, 720)
      const maxH = Math.max(280, Math.min(stage - 90, 460))
      const widthByHeight = (480 / 320) * maxH
      const w = Math.max(280, Math.min(maxW, widthByHeight))
      const h = w / (480 / 320)
      ifr.style.width = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    // Two ticks: synchronous (iframe just mounted) and after the next
    // animation frame (slide transition completes, layout settles).
    fit()
    const raf = requestAnimationFrame(fit)
    window.addEventListener("resize", fit)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", fit)
    }
  }, [active])

  return (
    <div className="absolute inset-0 flex flex-col p-4 sm:p-6 overflow-hidden">
      <p className="text-center text-[14px] sm:text-[16px] text-[#c8c6be] leading-snug max-w-[28ch] mx-auto mb-4">
        Drag the pink triangle until it lands on the dashed outline.
      </p>
      <div className="flex-1 flex items-center justify-center min-h-0 relative">
        {active && (
          <iframe
            ref={ifrRef}
            src="/widgets/translation-explorer.html?lessonMode=1&target=3,-2"
            title="Translation puzzle"
            loading="lazy"
            className={`block rounded-xl ${solved ? "pl-success-pulse" : ""}`}
            style={{
              background: COLOR.card,
              border: `1px solid ${solved ? "rgba(15,238,137,0.9)" : "#141e2a"}`,
              transition: "border-color 500ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        )}
        {active && <DragHint accent="#ff4670" duration={9000} hidden={solved} />}
      </div>
    </div>
  )
}

/* ─────────────────── Slide 3 — the naming + confirmation ─────────────────── */

function SlideThree({ active, solvedSlide2 }: { active: boolean; solvedSlide2: boolean }) {
  // Reveal each line in sequence when the slide becomes active. Parent
  // toggles a key whenever the slide goes active so the component
  // remounts with step=0 — no reset-setState-in-effect dance needed.
  const [step, setStep] = useState(0)
  useEffect(() => {
    if (!active) return
    const timers = [
      setTimeout(() => setStep(1), 240),
      setTimeout(() => setStep(2), 720),
      setTimeout(() => setStep(3), 1300),
      setTimeout(() => setStep(4), 1900),
    ]
    return () => timers.forEach(clearTimeout)
  }, [active])

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 sm:p-12">
      <Reveal show={step >= 1}>
        <p className="font-mono text-[10.5px] tracking-[2.5px] uppercase text-[#fff067] mb-4 text-center">
          this transformation has a name
        </p>
      </Reveal>

      <Reveal show={step >= 2}>
        <h3 className="text-center text-[26px] sm:text-[34px] md:text-[40px] tracking-[-0.022em] text-[#f0eeea] font-medium leading-tight mb-3">
          Translation
        </h3>
      </Reveal>

      <Reveal show={step >= 3}>
        <p className="text-center text-[16px] sm:text-[19px] text-[#c8c6be] leading-[1.55] max-w-[34ch] mx-auto mb-8">
          A transformation where every point of a shape moves the{" "}
          <span className="text-[#0fee89]">same distance</span> in the{" "}
          <span className="text-[#0fee89]">same direction</span>.
        </p>
      </Reveal>

      <Reveal show={step >= 4}>
        <div className="flex items-center gap-3 rounded-lg border border-[rgba(15,238,137,0.30)] bg-[rgba(15,238,137,0.05)] px-5 py-3.5 max-w-[420px]">
          <CheckIcon ok={solvedSlide2} />
          <p className="text-[14px] sm:text-[15px] leading-snug text-[#c8c6be]">
            {solvedSlide2
              ? <>Earlier, you slid the triangle by <span className="font-mono text-[#0fee89]">⟨3, −2⟩</span>. That was a translation.</>
              : <>On the previous slide, you would drag a triangle by a vector. That move is called a translation.</>}
          </p>
        </div>
      </Reveal>
    </div>
  )
}

function Reveal({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <div
      className="transition-all duration-[700ms]"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(8px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  )
}

function CheckIcon({ ok }: { ok: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" className="flex-shrink-0">
      <circle cx="11" cy="11" r="10"
        fill={ok ? "rgba(15,238,137,0.15)" : "rgba(15,238,137,0.05)"}
        stroke={ok ? "#0fee89" : "#1a3a26"} strokeWidth="1.4" />
      <path d="M6 11.5 L9.5 14.8 L16 8"
        fill="none" stroke="#0fee89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
