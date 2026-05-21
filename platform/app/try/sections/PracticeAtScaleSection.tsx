"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import styles from "../try.module.css"
import { useGsap } from "../lib/useGsap"

/**
 * Section 6 — Practice at Scale.
 *
 * The grid of paper "cards" sits in CSS-3D space with a gentle perspective.
 * On scroll, each row drifts at a slightly different rate (parallax). On
 * hover, a paper lifts forward 12 px with a soft shadow.
 *
 * The big "4,800+" counter counts up from 0 to its target the first time
 * the section enters the viewport.
 */

type Paper = { code: string; season: string; year: number; tone: string }

function makePapers(): Paper[] {
  // 5 rows × 6 cols = 30 papers, spanning 2011 → 2025. Cycle through
  // Summer/Winter and variants 11/12/21/22 to feel real without
  // claiming any specific paper.
  const variants = ["11", "12", "21", "22"]
  const tones = ["#00abfa", "#fff067", "#0fee89", "#ff822c", "#ff4670"]
  const out: Paper[] = []
  let yr = 2011
  for (let i = 0; i < 30; i++) {
    const season = i % 2 === 0 ? "s" : "w"
    const seasonLabel = season === "s" ? "Summer" : "Winter"
    const v = variants[i % 4]
    const code = `${season}${String(yr % 100).padStart(2, "0")}_${v}`
    out.push({ code, season: seasonLabel, year: yr, tone: tones[i % tones.length] })
    if (i % 2 === 1) yr++
    if (yr > 2025) yr = 2011
  }
  return out
}

const PAPERS = makePapers()
const TARGET_COUNT = 4800

export default function PracticeAtScaleSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [count, setCount] = useState(0)
  const gsapBundle = useGsap()

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

  // Count up from 0 to 4,800 on first reveal.
  useEffect(() => {
    if (!visible) return
    const DURATION = 1500
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(TARGET_COUNT * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [visible])

  // Parallax — driven by GSAP ScrollTrigger. The grid tilts as the
  // section moves through the viewport; back rows drift further.
  // ScrollTrigger gives us hardware-batched scroll callbacks rather than
  // a raw scroll listener, and quickSetter is the cheapest way to update
  // transforms every frame.
  useEffect(() => {
    if (!gsapBundle) return
    const { gsap, ScrollTrigger } = gsapBundle
    const grid = gridRef.current
    const section = sectionRef.current
    if (!grid || !section) return

    const setRX = gsap.quickSetter(grid, "rotationX", "deg")
    const setRY = gsap.quickSetter(grid, "rotationY", "deg")

    const cards = grid.querySelectorAll<HTMLElement>(`.${styles.paperCard}`)
    const setters = Array.from(cards).map(c => ({
      x: gsap.quickSetter(c, "x", "px"),
      y: gsap.quickSetter(c, "y", "px"),
      z: gsap.quickSetter(c, "z", "px"),
    }))

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: self => {
        const p = (self.progress - 0.5) * 2   // -1 → +1
        setRX(10 - p * 4)
        setRY(-p * 1.5)
        setters.forEach((s, i) => {
          const row = Math.floor(i / 6)
          const col = i % 6
          s.x((col - 2.5) * 4 * p)
          s.y((row - 2) * 14 * p)
          s.z(-row * 18)
        })
      },
    })

    return () => { trigger.kill() }
  }, [gsapBundle])

  return (
    <Section ref={sectionRef} id="practice" ariaLabel="Practice at scale" tall className="overflow-hidden">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-28">
        <div
          className="text-center mb-16 md:mb-20 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#ff4670] mb-3">
            practice
          </p>
          <h2 className="font-sans text-[26px] sm:text-[34px] md:text-[42px] leading-[1.16] tracking-[-0.022em] text-[#f0eeea] max-w-[24ch] mx-auto font-medium">
            15 years of Cambridge papers. <span className="text-[#7a7875]">Topic-tagged. Mark-scheme-aware.</span>
          </h2>
        </div>

        {/* The 3D paper grid — transforms driven by GSAP ScrollTrigger
            (see useEffect above). The inline transformStyle: preserve-3d
            is required for the per-card translateZ values to compose. */}
        <div
          className="relative mx-auto"
          style={{
            perspective: "1400px",
            perspectiveOrigin: "50% 30%",
            maxWidth: 1100,
          }}
        >
          <div
            ref={gridRef}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5"
            style={{ transformStyle: "preserve-3d" }}
          >
            {PAPERS.map((p, i) => (
              <PaperCard
                key={p.code + i}
                paper={p}
                reveal={visible}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Centered counter + claim */}
        <div className="text-center mt-16 md:mt-20">
          <div
            className={`${styles.bigCounter} font-semibold text-[#fff067] text-[52px] sm:text-[68px] md:text-[88px] leading-none transition-all duration-[900ms]`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(8px)",
              transitionDelay: "200ms",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              letterSpacing: "-0.04em",
            }}
          >
            {count.toLocaleString()}
            <span className="text-[#fff067]">+</span>
          </div>
          <p
            className="text-[14px] sm:text-[16px] text-[#7a7875] mt-3 font-mono tracking-[1.5px] uppercase"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 800ms ease 300ms" }}
          >
            Cambridge-marked questions, organised by topic.
          </p>
          <p className="text-[16px] sm:text-[18px] leading-[1.55] text-[#c8c6be] mt-10 max-w-[42ch] mx-auto">
            <span className="text-[#f0eeea]">Topical practice. Full mock exams. Smart review of weak areas.</span>{" "}
            Spaced repetition built in. Students don&apos;t just learn. They prepare like the exam is tomorrow.
          </p>
        </div>
      </div>
    </Section>
  )
}

function PaperCard({
  paper, index, reveal,
}: {
  paper: Paper
  index: number
  reveal: boolean
}) {
  return (
    <div
      className={`${styles.paperCard} aspect-[5/7]`}
      style={{
        opacity: reveal ? 1 : 0,
        // Opacity transition only — transform is owned by GSAP.
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${Math.min(index * 35, 600)}ms`,
      }}
    >
      <div
        className={`${styles.paperCardInner} rounded-lg border bg-[#0b1118] h-full`}
        style={{ borderColor: "#1a2330" }}
      >
        <div className="h-full flex flex-col justify-between p-3 sm:p-3.5">
          <div className="flex items-center justify-between">
            <span
              className="font-mono text-[8.5px] tracking-[1px] uppercase"
              style={{ color: paper.tone, opacity: 0.85 }}
            >
              {paper.season.slice(0, 1)}
            </span>
            <span className="font-mono text-[8.5px] tracking-[0.5px] text-[#3a4a5a]">
              4024
            </span>
          </div>

          {/* Faux page lines */}
          <div className="flex-1 flex flex-col justify-center gap-1.5 px-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[1.5px] rounded-full"
                style={{
                  background: "#1a2330",
                  width: `${78 - (i % 3) * 14}%`,
                }}
              />
            ))}
          </div>

          <div className="text-center">
            <div className="font-mono text-[10.5px] sm:text-[11.5px] tracking-[0.4px] text-[#f0eeea] mb-0.5">
              {paper.code}
            </div>
            <div className="font-mono text-[8.5px] tracking-[1px] uppercase text-[#3a4a5a]">
              {paper.year}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
