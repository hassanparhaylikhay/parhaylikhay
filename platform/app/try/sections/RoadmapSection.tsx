"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"

/**
 * Section 7 — Roadmap.
 *
 * Two tiers on a horizontal rail. The rail scales in from left to right
 * as the section enters view; tier markers and their items stagger in
 * left-to-right with the rail. Mobile stacks vertically and the rail
 * becomes a vertical line on the left.
 */

const TIERS = [
  {
    label: "Available now",
    accent: "#0fee89",
    items: [
      { name: "Cambridge O-Level Mathematics", code: "4024" },
    ],
  },
  {
    label: "Coming soon · within 6 months",
    accent: "#fff067",
    items: [
      { name: "IGCSE Mathematics", code: "AQA · Edexcel · Cambridge" },
      { name: "Physics", code: "O-Level · 5054" },
      { name: "Chemistry", code: "O-Level · 5070" },
      { name: "Homework system for teachers", code: "live class flow" },
      { name: "A-Level Mathematics", code: "9709" },
    ],
  },
]

export default function RoadmapSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
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
    <Section ref={sectionRef} id="roadmap" ariaLabel="Roadmap">
      <div className="max-w-[1100px] mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div
          className="text-center mb-16 md:mb-20 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#3a4a5a] mb-3">
            roadmap
          </p>
          <h2 className="font-sans text-[26px] sm:text-[32px] md:text-[38px] leading-[1.2] tracking-[-0.022em] text-[#f0eeea] max-w-[28ch] mx-auto font-medium">
            Parhaylikhay is being built <span className="text-[#ff822c]">subject by subject</span>, the right way.<br className="hidden sm:block" />
            Here&apos;s what&apos;s ready, and what&apos;s coming.
          </h2>
        </div>

        {/* Desktop: two columns of tiers. Mobile: stacked tiers.
            No horizontal rail — the markers (coloured dots) and the
            kicker labels carry enough structure on their own. */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12">
          {TIERS.map((t, ti) => (
            <DesktopTier key={t.label} tier={t} index={ti} visible={visible} />
          ))}
        </div>

        <div className="md:hidden flex flex-col gap-12">
          {TIERS.map((t, ti) => (
            <MobileTier key={t.label} tier={t} index={ti} visible={visible} />
          ))}
        </div>
      </div>
    </Section>
  )
}

function DesktopTier({
  tier, index, visible,
}: {
  tier: typeof TIERS[number]
  index: number
  visible: boolean
}) {
  const baseDelay = index * 380
  return (
    <div>
      {/* Marker on the rail */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-4 h-4 rounded-full flex-shrink-0 transition-all duration-[700ms]"
          style={{
            background: tier.accent,
            boxShadow: `0 0 16px ${tier.accent}88`,
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: `${baseDelay + 400}ms`,
          }}
        />
        <p
          className="font-mono text-[11px] tracking-[2.5px] uppercase transition-all duration-[700ms]"
          style={{
            color: tier.accent,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateX(0)" : "translateX(-8px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: `${baseDelay + 500}ms`,
          }}
        >
          {tier.label}
        </p>
      </div>

      {/* Items, staggered */}
      <ul className="flex flex-col gap-3.5">
        {tier.items.map((it, i) => (
          <li
            key={it.name}
            className="rounded-lg border border-[#141e2a] bg-[#0b1118] px-4 py-3.5 transition-all duration-[700ms]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: `${baseDelay + 700 + i * 90}ms`,
            }}
          >
            <p className="text-[15px] text-[#f0eeea] font-medium leading-tight">
              {it.name}
            </p>
            <p className="font-mono text-[10.5px] text-[#7a7875] tracking-[0.4px] mt-1">
              {it.code}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}

function MobileTier({
  tier, index, visible,
}: {
  tier: typeof TIERS[number]
  index: number
  visible: boolean
}) {
  const baseDelay = index * 280
  return (
    <div className="pl-7 relative">
      {/* Marker */}
      <div
        className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full transition-all duration-[700ms]"
        style={{
          background: tier.accent,
          boxShadow: `0 0 12px ${tier.accent}88`,
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0)",
          transitionDelay: `${baseDelay + 400}ms`,
        }}
      />
      <p
        className="font-mono text-[11px] tracking-[2.5px] uppercase mb-4 transition-all duration-[700ms]"
        style={{
          color: tier.accent,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateX(0)" : "translateX(-6px)",
          transitionDelay: `${baseDelay + 500}ms`,
        }}
      >
        {tier.label}
      </p>
      <ul className="flex flex-col gap-3">
        {tier.items.map((it, i) => (
          <li
            key={it.name}
            className="rounded-lg border border-[#141e2a] bg-[#0b1118] px-4 py-3 transition-all duration-[700ms]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transitionDelay: `${baseDelay + 700 + i * 90}ms`,
            }}
          >
            <p className="text-[14px] text-[#f0eeea] font-medium leading-tight">
              {it.name}
            </p>
            <p className="font-mono text-[10px] text-[#7a7875] tracking-[0.4px] mt-0.5">
              {it.code}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
