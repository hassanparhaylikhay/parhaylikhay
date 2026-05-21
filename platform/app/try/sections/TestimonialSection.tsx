"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"

/**
 * Testimonial — a single, quiet moment. One real student voice, full
 * stop. No card stack, no quotes carousel. Just the line, the student,
 * and the school.
 */
export default function TestimonialSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Section ref={sectionRef} id="testimonial" ariaLabel="Student testimonial">
      <div className="max-w-[820px] mx-auto px-5 sm:px-8 py-20 md:py-28 text-center">
        <p
          className="font-mono text-[10.5px] tracking-[3px] uppercase text-[#3a4a5a] mb-6 transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          from a student
        </p>

        {/* Opening quote glyph — large, faint, off-axis */}
        <div
          aria-hidden
          className="text-[#ff4670] text-[64px] sm:text-[88px] leading-none mb-2 transition-all duration-[900ms]"
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
          className="font-sans text-[28px] sm:text-[40px] md:text-[48px] leading-[1.18] tracking-[-0.022em] text-[#f0eeea] font-medium max-w-[20ch] mx-auto transition-all duration-[1100ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(18px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "240ms",
          }}
        >
          This is a <span className="text-[#ff4670]">game changer</span>.
        </blockquote>

        <div
          className="mt-10 transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "600ms",
          }}
        >
          <p className="font-mono text-[13px] tracking-[1px] text-[#c8c6be]">
            Ayaan
          </p>
          <p className="font-mono text-[10.5px] tracking-[2px] uppercase text-[#3a4a5a] mt-1">
            Year 10 · Foundation Public School
          </p>
        </div>
      </div>
    </Section>
  )
}
