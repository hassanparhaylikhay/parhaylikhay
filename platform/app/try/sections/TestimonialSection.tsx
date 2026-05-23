"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"

/**
 * Testimonials — opening on the centrepiece line ("This is a game
 * changer.") which three independent students sent unprompted. The
 * repetition itself is the proof: three different Karachi schools, one
 * sentence. Below the centrepiece, three supporting cards in an
 * asymmetric row — different lines, different accent colours, real
 * students.
 */
export default function TestimonialSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.22 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Section ref={sectionRef} id="testimonial" ariaLabel="Student testimonials">
      <div className="max-w-[1080px] mx-auto px-5 sm:px-8 py-20 md:py-28">
        <p
          className="text-center font-mono text-[10.5px] tracking-[3px] uppercase text-[#3a4a5a] mb-6 transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          from real students
        </p>

        {/* CENTERPIECE — single line, three voices. */}
        <div className="text-center">
          <div
            aria-hidden
            className="text-[#ff4670] text-[56px] sm:text-[80px] leading-none mb-1 transition-all duration-[900ms]"
            style={{
              opacity: visible ? 0.5 : 0,
              transform: visible ? "translateY(0)" : "translateY(12px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: "120ms",
              fontFamily: "Georgia, serif",
            }}
          >
            “
          </div>

          <blockquote
            className="font-sans text-[28px] sm:text-[42px] md:text-[52px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] font-medium max-w-[20ch] mx-auto transition-all duration-[1100ms]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(18px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: "240ms",
            }}
          >
            This is a <span className="text-[#ff4670]">game changer</span>.
          </blockquote>

          {/* THREE NAMES below the centerpiece — three equal columns,
              divided by faint vertical hairlines on md+. Stacks on
              mobile (no dividers). */}
          <div
            className="mt-10 mx-auto max-w-[680px] grid grid-cols-1 sm:grid-cols-3 sm:divide-x sm:divide-[#1a2330] transition-all duration-[900ms]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(10px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              transitionDelay: "640ms",
            }}
          >
            <Attribution name="Ayaan"  school="Year 10 · Foundation Public" />
            <Attribution name="Maaz"   school="IBA" />
            <Attribution name="Moiz"   school="Tutor" />
          </div>

          <p
            className="mt-9 font-mono text-[10px] tracking-[2.5px] uppercase text-[#3a4a5a] transition-all duration-[900ms]"
            style={{
              opacity: visible ? 1 : 0,
              transitionDelay: "900ms",
            }}
          >
            three voices · one sentence
          </p>
        </div>

        {/* Hairline divider */}
        <div
          className="mx-auto mt-16 mb-14 h-px max-w-[420px] transition-all duration-[800ms]"
          style={{
            background: "linear-gradient(to right, transparent, #1a2330 25%, #1a2330 75%, transparent)",
            opacity: visible ? 1 : 0,
            transitionDelay: "1000ms",
          }}
        />

        {/* THREE supporting quotes — asymmetric, varying accent colours.
            Stacks on mobile, three across on lg. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          <QuoteCard
            visible={visible}
            delay={1100}
            accent="#fff067"
            quote={<>I just <em className="not-italic" style={{ color: "#fff067" }}>wish I had this</em> when I was giving my O Levels.</>}
            name="Abdul Ahad"
            school="Year 12 · Karachi Grammar"
          />
          <QuoteCard
            visible={visible}
            delay={1240}
            accent="#0fee89"
            quote={<>Always hated maths. Never thought math would look this <em className="not-italic" style={{ color: "#0fee89" }}>fun</em>.</>}
            name="Saaim"
            school="Private student"
          />
          <QuoteCard
            visible={visible}
            delay={1380}
            accent="#00abfa"
            quote={<>Forwarded to <em className="not-italic" style={{ color: "#00abfa" }}>all my school friends</em>. Sending to my former maths tutor too.</>}
            name="Bilal"
            school="Karachi Grammar School"
          />
        </div>
      </div>
    </Section>
  )
}

function Attribution({ name, school }: { name: string; school: string }) {
  return (
    <div className="text-center px-3 py-3 sm:py-1">
      <p className="font-mono text-[13.5px] tracking-[1px] text-[#f0eeea]">
        {name}
      </p>
      <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#3a4a5a] mt-1.5 leading-snug">
        {school}
      </p>
    </div>
  )
}

function QuoteCard({
  visible, delay, accent, quote, name, school,
}: {
  visible: boolean
  delay: number
  accent: string
  quote: React.ReactNode
  name: string
  school: string
}) {
  return (
    <figure
      className="rounded-2xl border border-[#141e2a] bg-[#0b1118] p-6 sm:p-7 flex flex-col gap-5 transition-all duration-[900ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span
        aria-hidden
        className="text-[28px] leading-none"
        style={{ color: accent, fontFamily: "Georgia, serif", opacity: 0.7 }}
      >
        “
      </span>
      <blockquote className="text-[15.5px] sm:text-[16px] leading-[1.55] text-[#c8c6be] flex-1">
        {quote}
      </blockquote>
      <figcaption className="pt-1">
        <p className="font-mono text-[12.5px] tracking-[0.5px] text-[#f0eeea]">
          {name}
        </p>
        <p className="font-mono text-[9.5px] tracking-[1.5px] uppercase text-[#3a4a5a] mt-1">
          {school}
        </p>
      </figcaption>
    </figure>
  )
}
