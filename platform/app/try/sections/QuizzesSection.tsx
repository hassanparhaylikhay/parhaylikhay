"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import { COLOR } from "@/components/lesson-mode/interactions/_shared"

/**
 * Section 4.5 — Quizzes.
 *
 * After Lesson Mode, before the mark scheme beat. The visitor sees that
 * checking understanding doesn't mean "answer 20 MCQs". Parhaylikhay
 * builds the quiz around the topic — shade a Venn region for set
 * notation, shade squares for an inequality, classify shapes on a 100
 * grid. The variety is the point.
 *
 * Three picker tabs, mirroring the InteractiveMoment + Teacher Mode
 * rhythm:
 *   1. Venn shader        (1.2 P3 — tap regions to match a set expression)
 *   2. Region shader      (inequalities — tap squares inside the region)
 *   3. Shape classifier   (five locked challenges on a 1-100 board)
 */

type Tab = "venn" | "classifier"

const TABS: { key: Tab; label: string; href: string; description: string }[] = [
  {
    key: "venn",
    label: "Venn shader",
    href: "/widgets/venn-shader.html",
    description:
      "An expression like A' ∩ B appears. You shade the matching region by tapping. Wrong taps go pink, right ones lock green. The whole quiz lives in a single diagram, with five expressions to clear.",
  },
  {
    key: "classifier",
    label: "Number classifier",
    href: "/widgets/shape-classifier-grid.html",
    description:
      "A 1-100 grid, five locked challenges. Tap every number that fits the rule: primes, squares, multiples of seven. Each cleared challenge unlocks the next.",
  },
]

export default function QuizzesSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState<Tab>("venn")

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.18 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Section
      ref={sectionRef}
      id="quizzes"
      ariaLabel="Interactive quizzes demonstration"
      tall
      className="overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-28">
        <div
          className="text-center mb-12 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#ff4670] mb-3">
            checked, not memorised
          </p>
          <h2 className="font-sans text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] max-w-[22ch] mx-auto font-medium">
            Quizzes built for the topic. <span className="text-[#7a7875]">Not lifted from a worksheet.</span>
          </h2>
          <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.55] text-[#7a7875] max-w-[58ch] mx-auto">
            We don&apos;t throw multiple-choice at every topic. Set theory gets a Venn you shade. Number patterns get a 1-100 grid you tap. The quiz fits the shape of the maths.
          </p>
        </div>

        <div
          className="transition-all duration-[1100ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.985)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "180ms",
          }}
        >
          <TabStrip tab={tab} setTab={setTab} />
          <Stage key={tab} tab={tab} />
        </div>

        <div
          className="text-center mt-16 md:mt-20 max-w-[42ch] mx-auto transition-all duration-[1000ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transitionDelay: "320ms",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="text-[17px] sm:text-[20px] leading-[1.5] text-[#c8c6be]">
            <span className="text-[#f0eeea]">A different quiz for every topic.</span>{" "}
            Built so a student can&apos;t bluff through with pattern-matching.
          </p>
        </div>
      </div>
    </Section>
  )
}

function TabStrip({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      {TABS.map(t => {
        const active = t.key === tab
        return (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="font-mono text-[11px] sm:text-[12px] uppercase tracking-[1.5px] px-4 py-2.5 rounded-full transition-all duration-300"
            style={{
              background: active ? "rgba(255,70,112,0.10)" : "transparent",
              color: active ? "#ff4670" : "#7a7875",
              border: `1px solid ${active ? "rgba(255,70,112,0.45)" : "#141e2a"}`,
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

function Stage({ tab }: { tab: Tab }) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState<number>(620)
  const tabConfig = TABS.find(t => t.key === tab)!

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (iframeRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        setHeight(Math.max(360, Math.min(960, Math.round(d.height))))
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  return (
    <div className="flex justify-center">
      <iframe
        ref={iframeRef}
        src={tabConfig.href}
        title={`${tabConfig.label} quiz`}
        loading="lazy"
        className="block rounded-xl"
        style={{
          width: "100%",
          maxWidth: 720,
          height: `${height}px`,
          background: COLOR.card,
          border: `1px solid ${COLOR.border}`,
          transition: "height 600ms cubic-bezier(0.16,1,0.3,1)",
          boxShadow: "0 24px 60px -42px rgba(0,0,0,0.6)",
        }}
      />
    </div>
  )
}
