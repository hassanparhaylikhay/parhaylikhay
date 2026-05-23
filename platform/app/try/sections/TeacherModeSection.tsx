"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import { COLOR } from "@/components/lesson-mode/interactions/_shared"

/**
 * Section 7.5 — Teacher Mode.
 *
 * Mirror of the "Try it yourself" section, retargeted at teachers. The
 * pitch: every manipulative is a blackboard. A teacher picks one,
 * projects it, and teaches the class through it. The transformation
 * widgets get one extra capability under ?teacher=1 — the source
 * triangle's vertices become draggable, so the teacher can reshape on
 * the fly.
 *
 * Four picker tabs:
 *   1. Plot graphs        (graph-explorer.html — 2.11 P4)
 *   2. Sketch from points (points-fit-explorer.html — 2.11 P4)
 *   3. Translation        (translation-explorer.html ?teacher=1)
 *   4. Reflection         (reflection-explorer.html  ?teacher=1)
 *
 * Below the picker: a quiet card noting the homework + grading
 * surface (coming soon) so visitors understand the teaching loop
 * extends beyond live class.
 */

type Tab = "graph" | "points" | "unit-circle" | "translation" | "reflection"

const TABS: { key: Tab; label: string; href: string; description: string }[] = [
  {
    key: "graph",
    label: "Plot graphs",
    href: "/widgets/graph-explorer.html",
    description:
      "Type any equation. The curve renders live. Layer multiple curves to compare. Teachers use this to walk a class through what changes when a coefficient flips sign or doubles.",
  },
  {
    key: "points",
    label: "Sketch from points",
    href: "/widgets/points-fit-explorer.html",
    description:
      "Drop points anywhere on the grid. The widget fits a smooth curve through them. Useful for showing how data turns into a model, or for sketching the shape of a cubic by feel before naming it.",
  },
  {
    key: "unit-circle",
    label: "Unit circle",
    href: "/widgets/unit-circle-trig.html",
    description:
      "Drag the point around the unit circle and the sine, cosine and tangent curves draw themselves in real time. Teachers use this to show a class why sin is a wave, why cos starts at 1, and why tan blows up at 90° — the closest thing to a live proof of where trigonometry comes from.",
  },
  {
    key: "translation",
    label: "Translation",
    href: "/widgets/translation-explorer.html?teacher=1",
    description:
      "The same manipulative students get, with one extra power: the blue source triangle's vertices are draggable. Reshape it into any triangle the lesson needs, then walk through the translation.",
  },
  {
    key: "reflection",
    label: "Reflection",
    href: "/widgets/reflection-explorer.html?teacher=1",
    description:
      "Drag the mirror line, drag the source vertices. Build the exact configuration the textbook is asking about, then show the reflection without redrawing anything by hand.",
  },
]

export default function TeacherModeSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState<Tab>("graph")

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
      id="teacher-mode"
      ariaLabel="Teacher Mode demonstration"
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
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#ff822c] mb-3">
            for teachers
          </p>
          <h2 className="font-sans text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] max-w-[24ch] mx-auto font-medium">
            Teach with the canvas. <span className="text-[#7a7875]">Not slides.</span>
          </h2>
          <p className="mt-5 text-[15px] sm:text-[16px] leading-[1.55] text-[#7a7875] max-w-[58ch] mx-auto">
            Every manipulative on Parhaylikhay is a blackboard a teacher can project, customise, and teach from. Pick any one. Reshape it on the fly. Walk the class through what changes when a number changes.
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
              background: active ? "rgba(255,130,44,0.10)" : "transparent",
              color: active ? "#ff822c" : "#7a7875",
              border: `1px solid ${active ? "rgba(255,130,44,0.45)" : "#141e2a"}`,
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
  const [height, setHeight] = useState<number>(560)
  const tabConfig = TABS.find(t => t.key === tab)!

  // Each tabbed widget posts pl-widget-resize on load + on every interaction.
  // For the transformations under ?lessonMode=1 the SVG fills the iframe so
  // the height is just the SVG's natural height (~360); for graph/points-fit
  // it's the full chrome height (~640+).
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (iframeRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        setHeight(Math.max(380, Math.min(900, Math.round(d.height))))
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
        title={`${tabConfig.label} manipulative`}
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

