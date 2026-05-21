"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import DragHint from "../components/DragHint"
import { COLOR, MixedText } from "@/components/lesson-mode/interactions/_shared"

/**
 * Section 3 — Interactive Moment.
 *
 * The single most important section on the page. The visitor TOUCHES
 * the platform: drags a shape, watches the transformation play out, sees
 * the live mark-scheme-style description appear in the side panel.
 *
 * We embed the four production transformation widgets behind a tab strip.
 * Each widget posts pl-lesson-readout on every state change, which we
 * surface in the side panel exactly the way Lesson Mode does. No
 * marketing simulation — this IS the platform.
 */

type Mode = "translation" | "reflection" | "rotation" | "enlargement"

const MODES: { key: Mode; label: string; href: string; meta: string }[] = [
  { key: "translation",  label: "Translation",   href: "/widgets/translation-explorer.html?lessonMode=1",  meta: "drag the pink triangle" },
  { key: "reflection",   label: "Reflection",    href: "/widgets/reflection-explorer.html?lessonMode=1",    meta: "drag the mirror line" },
  { key: "rotation",     label: "Rotation",      href: "/widgets/rotation-explorer.html?lessonMode=1",      meta: "drag the centre or A′" },
  { key: "enlargement",  label: "Enlargement",   href: "/widgets/enlargement-explorer.html?lessonMode=1",   meta: "drag a vertex of A′" },
]

const FALLBACK_LABEL: Record<Mode, string> = {
  translation: "column vector",
  reflection:  "mirror line",
  rotation:    "current",
  enlargement: "scale factor",
}

export default function InteractiveMomentSection() {
  const [mode, setMode] = useState<Mode>("translation")
  const sectionRef = useRef<HTMLElement | null>(null)

  // Section-level reveal — line-by-line "grid draws itself" feel achieved
  // via a thin border that scales in on the widget card.
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Section
      ref={sectionRef}
      id="interactive"
      ariaLabel="Interactive transformations demonstration"
      tall
      className="overflow-hidden"
    >
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-28">
        <div
          className="text-center mb-12 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#00abfa] mb-3">
            the moment
          </p>
          <h2 className="font-sans text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] max-w-[22ch] mx-auto font-medium">
            Try it yourself. <span className="text-[#7a7875]">This is what every lesson on Parhaylikhay feels like.</span>
          </h2>
        </div>

        {/* Tab strip + manipulative + side readout */}
        <div
          className="transition-all duration-[1100ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.985)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "180ms",
          }}
        >
          <ModeTabs mode={mode} setMode={setMode} />

          {/* Per-mode stage — key on mode so readout + touched state
              naturally reset to defaults when the visitor switches tabs. */}
          <ModeStage key={mode} mode={mode} />
        </div>
      </div>
    </Section>
  )
}

function ModeStage({ mode }: { mode: Mode }) {
  const [touched, setTouched] = useState(false)
  const [readout, setReadout] = useState<{ label: string; tex: string } | null>(null)
  // Hold a short "settle" delay after this stage first mounts before we
  // accept readout messages. Without it, the brand-new iframe sometimes
  // fires its initial state postMessage WHILE the placeholder is still
  // fading in — visitor reads a millisecond flash of the old mode's
  // last readout because the message bus is shared.
  const [armed, setArmed] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 220)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!armed) return
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (iframeRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-lesson-readout") {
        setTouched(true)
        setReadout({ label: String(d.label ?? FALLBACK_LABEL[mode]), tex: String(d.tex ?? "") })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [mode, armed])

  useEffect(() => {
    function fit() {
      const ifr = iframeRef.current
      if (!ifr) return
      const RESERVED = 380
      const vw = window.innerWidth
      const PAD = 48
      const MAX = 1100
      const isWide = vw >= 1024
      const ASIDE_RESERVE = isWide ? 340 : 0
      const availW = Math.min(vw - PAD, MAX) - ASIDE_RESERVE
      const availH = Math.max(360, window.innerHeight - RESERVED)
      const widthByHeight = (480 / 320) * availH
      const w = Math.max(320, Math.min(availW, widthByHeight))
      const h = w / (480 / 320)
      ifr.style.width = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-7 items-stretch">
        <div className="relative flex items-center justify-center">
          <iframe
            ref={iframeRef}
            src={MODES.find(m => m.key === mode)!.href}
            title={`${mode} explorer`}
            loading="lazy"
            className="block rounded-xl"
            style={{
              background: COLOR.card,
              border: `1px solid ${touched ? "rgba(0,171,250,0.45)" : COLOR.border}`,
              transition: "border-color 700ms cubic-bezier(0.16,1,0.3,1)",
              boxShadow: touched
                ? "0 30px 80px -40px rgba(0,171,250,0.35)"
                : "0 24px 60px -42px rgba(0,0,0,0.6)",
            }}
          />
          <DragHint accent="#00abfa" duration={7000} hidden={touched} />
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-[#141e2a] bg-[#0b1118] p-5 min-h-[260px] flex flex-col">
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[#00abfa] mb-3">
              what you just did
            </p>
            <div
              className="transition-opacity duration-300 flex-1 flex flex-col justify-center"
              style={{
                opacity: armed ? 1 : 0,
                transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {readout ? (
                <ReadoutLine label={readout.label} tex={readout.tex} />
              ) : (
                <p className="text-[14px] text-[#7a7875] leading-snug">
                  Move anything on the canvas. The mark-scheme description
                  appears here, live, the moment you change something.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#141e2a] bg-[#0b1118] p-5">
            <p className="font-mono text-[10px] tracking-[2px] uppercase text-[#3a4a5a] mb-2">
              this mode
            </p>
            <p className="text-[14.5px] text-[#c8c6be] leading-snug">
              {modeDescription(mode)}
            </p>
          </div>
        </aside>
      </div>

      <div
        className="text-center mt-16 md:mt-20 max-w-[36ch] mx-auto transition-all duration-[1000ms]"
        style={{
          opacity: touched ? 1 : 0.35,
          transform: touched ? "translateY(0)" : "translateY(6px)",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <p className="text-[17px] sm:text-[20px] leading-[1.5] text-[#c8c6be]">
          <span className="text-[#f0eeea]">Hundreds of manipulatives</span> like this. Every visual concept across O-Level Maths and Physics. Built so students learn by <span className="text-[#fff067]">feeling the maths</span>, not memorising it.
        </p>
      </div>
    </>
  )
}

function ModeTabs({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      {MODES.map(m => {
        const active = m.key === mode
        return (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[1.5px] px-4 py-2.5 rounded-full transition-all duration-300"
            style={{
              background: active ? "rgba(255,240,103,0.10)" : "transparent",
              color: active ? "#fff067" : "#7a7875",
              border: `1px solid ${active ? "rgba(255,240,103,0.40)" : "#141e2a"}`,
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

function ReadoutLine({ label, tex }: { label: string; tex: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  // Translation posts a `pmatrix`; the other widgets post `\text{}`-heavy
  // strings. Matrix renders display-style (large, centred, stacked);
  // text renders inline-style at a smaller size so it fits the panel
  // on one line.
  const isMatrix = /\\begin\{(pmatrix|bmatrix|vmatrix|Vmatrix|matrix)/.test(tex)

  useEffect(() => {
    if (!ref.current) return
    const t = setTimeout(() => {
      if (!ref.current) return
      try {
        import("katex").then(({ default: katex }) => {
          if (!ref.current) return
          katex.render(tex, ref.current, {
            throwOnError: false,
            displayMode: isMatrix,
            output: "html",
          })
        })
      } catch {
        if (ref.current) ref.current.textContent = tex
      }
    }, 0)
    return () => clearTimeout(t)
  }, [tex, isMatrix])
  return (
    <>
      <p className="text-[10px] font-mono uppercase tracking-[1.5px] text-[#0fee89] mb-3 text-center">
        {label}
      </p>
      <div
        ref={ref}
        className={`text-[#f0eeea] text-center ${
          isMatrix
            ? "text-[22px] leading-tight"
            : "text-[15.5px] leading-snug"
        }`}
        style={{
          // Keep math expressions together so `(0, 0)` doesn't break
          // between the comma and the closing paren on a narrow panel.
          whiteSpace: "nowrap",
          overflowWrap: "normal",
        }}
      />
    </>
  )
}

function modeDescription(m: Mode): string {
  switch (m) {
    case "translation": return "Drag the pink triangle to slide it. The column vector reads the move in (x, y) form, the way Cambridge marks it."
    case "reflection":  return "Drag the yellow handles on the mirror. The mirror's equation reads in real time: y = x, x = 1, whatever line you draw."
    case "rotation":    return "Drag the centre (green) and A′ (yellow). The rotation reads angle and centre, the two B1 marks examiners look for."
    case "enlargement": return "Drag any vertex of A′ to set the scale. Scale factor and centre read out together. That's the full mark-scheme answer."
  }
}

/* Keep MixedText reference so the import isn't tree-shaken accidentally
   in case we wire it in later for the closer line. */
void MixedText
