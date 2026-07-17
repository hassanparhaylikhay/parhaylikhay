"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import katex from "katex"
import { COLOR, MixedText, type InteractionProps } from "./_shared"

export type StepThroughConfig = {
  /** Widget URL. Must carry lessonMode=1 and extChrome=1 so the widget hides
   *  its internal stepper and takes step commands from the lesson instead. */
  src: string
  /** Heading shown in the aside (walkthrough slides carry their pedagogy in the title). */
  title?: string
  /** One quiet context line under the title. */
  prompt?: string
  /** Auto-play the steps like a video until the student takes over.
   *  Defaults to true; revisits of a completed slide never auto-play. */
  autoPlay?: boolean
  widget?: string
  noHelp?: boolean
}

/** Navigation delegate registered with LessonRunner so the lesson's own
 *  prev/next buttons (and arrow keys) drive the steps. */
export type StepNav = {
  hasNext: boolean
  hasPrev: boolean
  next: () => void
  prev: () => void
}

type StepThroughProps = InteractionProps<StepThroughConfig> & {
  onAdvance?: () => void
  onRegisterNav?: (nav: StepNav | null) => void
}

/**
 * StepThrough — a step-explorer walkthrough where the LESSON owns the stepper.
 *
 * The design rule this enforces: the lesson chrome owns all navigation, the
 * canvas owns all manipulation, the aside owns all words. The widgets used to
 * render their own tiny prev/next buttons inside the iframe, which competed
 * with the lesson's next arrow and the understood button, and put the step
 * caption in 12px text under the canvas. Now:
 *
 *   - the widget (with ?extChrome=1) hides its head, stepper and footer, and
 *     obeys `pl-step-go` postMessages, reporting `pl-step-state` back
 *   - the caption renders in the aside at reading size
 *   - one big primary button advances the step; the bottom-bar next arrow and
 *     the right-arrow key do the same thing via the registered StepNav
 *   - the slide completes only when the final step has been seen, so the
 *     walkthrough cannot be skipped
 */
export default function StepThrough({ config, savedData, onComplete, onAdvance, onRegisterNav }: StepThroughProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [step, setStep] = useState(0)
  const [total, setTotal] = useState(0)
  const [caption, setCaption] = useState<string>("")
  const [interacted, setInteracted] = useState(false)
  // Auto-play: the walkthrough advances itself on a reading-paced timer,
  // like a video, until the student touches any control. A slide the
  // student already completed replays only under manual control.
  const [auto, setAuto] = useState(() => config.autoPlay !== false && savedData == null)
  const completedRef = useRef(false)

  // ── listen for step state from the widget ─────────────────────────────
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object" || d.type !== "pl-step-state") return
      if (iframeRef.current?.contentWindow !== e.source) return
      const t = Math.max(0, Number(d.total) || 0)
      const s = Math.max(0, Math.min(t - 1, Number(d.step) || 0))
      setTotal(t)
      setStep(s)
      setCaption(String(d.caption ?? ""))
      if (t > 0 && s >= t - 1 && !completedRef.current) {
        completedRef.current = true
        onComplete({ steps: t })
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [onComplete])

  const goStep = (n: number) => {
    setInteracted(true)
    setAuto(false)
    iframeRef.current?.contentWindow?.postMessage({ type: "pl-step-go", step: n }, "*")
  }

  const hasNext = total > 0 && step < total - 1
  const hasPrev = step > 0
  const done = total > 0 && step >= total - 1

  // Reading-paced duration for the current step's caption; the first step
  // gets a little extra so the student can take the diagram in.
  const captionLen = caption.replace(/<[^>]*>/g, "").length
  const autoDur = Math.min(7000, Math.max(3200, 2400 + captionLen * 38)) + (step === 0 ? 800 : 0)

  useEffect(() => {
    if (!auto || done || total === 0) return
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: "pl-step-go", step: step + 1 }, "*")
    }, autoDur)
    return () => clearTimeout(t)
  }, [auto, step, total, done, autoDur])

  // ── register the nav delegate so the lesson chrome drives steps ───────
  useEffect(() => {
    if (!onRegisterNav) return
    onRegisterNav({
      hasNext,
      hasPrev,
      next: () => goStep(step + 1),
      prev: () => goStep(step - 1),
    })
    return () => onRegisterNav(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, total, hasNext, hasPrev])

  // ── iframe sizing: pure aspect fit (the widget has no internal chrome) ─
  useLayoutEffect(() => {
    function fit() {
      const ifr = iframeRef.current
      if (!ifr) return
      const SVG_ASPECT = 480 / 320
      const RESERVED = 200
      const vw = window.innerWidth
      const SIDEBAR_W = vw >= 768 ? 256 : 0
      const SLIDE_PAD = 64
      const SLIDE_MAX = 1200
      const slideW = Math.min(vw - SIDEBAR_W - SLIDE_PAD, SLIDE_MAX)
      const isWide = vw >= 1280
      const ASIDE_RESERVE = isWide ? 320 + 28 : 0
      const availableW = Math.max(280, slideW - ASIDE_RESERVE)
      const availableH = Math.max(300, window.innerHeight - RESERVED)
      const widthByHeight = SVG_ASPECT * availableH
      const w = Math.max(320, Math.min(availableW, widthByHeight))
      const h = w / SVG_ASPECT
      ifr.style.width = `${Math.round(w)}px`
      ifr.style.height = `${Math.round(h)}px`
    }
    fit()
    window.addEventListener("resize", fit)
    return () => window.removeEventListener("resize", fit)
  }, [])

  return (
    <div className="w-full flex flex-col xl:flex-row gap-5 xl:gap-7 items-center xl:items-stretch">
      <div className="flex-1 min-w-0 flex items-center justify-center">
        <iframe
          ref={iframeRef}
          src={config.src}
          loading="lazy"
          className="block rounded-xl"
          style={{
            background: COLOR.card,
            border: `1px solid ${done ? "rgba(15,238,137,0.45)" : COLOR.border}`,
            transition: "border-color 300ms",
          }}
        />
      </div>

      <aside className="pl-stagger w-full xl:w-[320px] shrink-0 flex flex-col gap-4 justify-center" style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}>
        {config.title && (
          <h2 className="text-[21px] sm:text-[24px] font-semibold text-[#f0eeea] tracking-tight leading-tight">
            <MixedText text={config.title} />
          </h2>
        )}
        {config.prompt && (
          <MixedText
            text={config.prompt}
            className="block text-[15.5px] sm:text-[16.5px] text-[#7a7875] leading-relaxed"
          />
        )}

        {/* step dots + counter */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.max(total, 1) }, (_, i) => (
              <span
                key={i}
                className="block rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 9 : 6,
                  height: i === step ? 9 : 6,
                  background: i === step ? COLOR.yellow : i < step ? "#3a4a5a" : "#1a2330",
                }}
              />
            ))}
          </div>
        </div>

        {/* caption card: the words for the current step, at reading size */}
        <div
          className="rounded-lg border px-4 py-3.5 transition-colors duration-300"
          style={{
            borderColor: done ? "rgba(15,238,137,0.45)" : COLOR.border,
            background: done ? "rgba(15,238,137,0.05)" : "transparent",
            minHeight: 96,
          }}
        >
          {auto && !done && total > 0 && (
            <div
              key={`fill-${step}`}
              className="pl-autofill"
              style={{ height: 2, background: COLOR.yellow, opacity: 0.5, borderRadius: 1, marginBottom: 10, animationDuration: `${autoDur}ms` }}
            />
          )}
          <CaptionHtml key={`${step}-${total}`} html={caption} />
        </div>

        {/* the one primary affordance */}
        <button
          onClick={() => (hasNext ? goStep(step + 1) : onAdvance?.())}
          disabled={total === 0}
          className={`w-full rounded-lg border-[1.5px] px-5 py-3 text-[13px] font-mono uppercase tracking-[1.5px] transition-all duration-300 disabled:opacity-40 ${!interacted && total > 0 ? "pl-primed" : ""}`}
          style={{
            borderColor: done ? "rgba(15,238,137,0.6)" : "#00abfa88",
            background: done ? "rgba(15,238,137,0.07)" : "rgba(0,171,250,0.07)",
            color: done ? COLOR.green : COLOR.blue,
            cursor: total === 0 ? "default" : "pointer",
          }}
        >
          {done ? "continue →" : "next step →"}
        </button>
        {hasPrev && (
          <button
            onClick={() => goStep(step - 1)}
            className="self-start text-[11px] font-mono text-[#3a4a5a] hover:text-[#7a7875] transition-colors"
          >
            ← previous step
          </button>
        )}
      </aside>
    </div>
  )
}

/**
 * Renders a step caption that mixes trusted HTML (colour-coded <b> terms from
 * the widget's STEPS array) with inline $...$ / \(...\) KaTeX.
 */
function CaptionHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.innerHTML = html
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
    const re = /\\\((.+?)\\\)|\$([^$]+)\$/g
    const toReplace: Array<{ t: Text; out: string }> = []
    let n: Node | null
    while ((n = walker.nextNode())) {
      const txt = (n as Text).nodeValue ?? ""
      if (!re.test(txt)) continue
      re.lastIndex = 0
      const out = txt.replace(re, (_m, paren, dollar) => {
        try {
          return katex.renderToString(paren ?? dollar, { throwOnError: false, displayMode: false, output: "html" })
        } catch {
          return _m
        }
      })
      toReplace.push({ t: n as Text, out })
    }
    for (const { t, out } of toReplace) {
      const span = document.createElement("span")
      span.innerHTML = out
      t.parentNode?.replaceChild(span, t)
    }
  }, [html])
  return (
    <div
      ref={ref}
      className="pl-reveal text-[15px] sm:text-[16px] leading-relaxed"
      style={{ color: COLOR.text }}
    />
  )
}
