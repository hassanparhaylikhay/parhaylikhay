"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Section from "../components/Section"

/**
 * Section 8 — Founder + Proof.
 *
 * Quiet authority. Minimal motion. Photo + bio in the foreground, with
 * a "wall of schools" backdrop bleeding off the right edge — the
 * schools Hassan has actually taught at, rendered large in cycling
 * brand colours at low opacity. The visitor scans the proof without
 * having to read it.
 */

// Real list — same set Hassan uses on his existing instructor profile.
const SCHOOLS = [
  "St Paul's School",
  "All Saints Catholic",
  "Atherton High School",
  "Bishop Challoner",
  "Chadwell Heath Academy",
  "Cleeve Park School",
  "Elizabethan Academy",
  "Forest Academy",
  "George Mitchell School",
  "Harris Academy",
  "Harvey Grammar",
  "Hornsey School for Girls",
  "John Madejski Academy",
  "John Roan School",
  "Kensington Aldridge",
  "Manor High School",
  "Manningtree High",
  "Paddington Academy",
  "Park House School",
  "Patchway School",
  "Penwortham Priory",
  "Sacred Heart College",
  "Sherburn High",
]
const SCHOOL_TINTS = ["#00abfa", "#fff067", "#0fee89", "#ff822c", "#ff4670"]

export default function FounderSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
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
    <Section ref={sectionRef} id="founder" ariaLabel="Founder and proof" natural>
      <div className="relative overflow-hidden">
        <SchoolsWall visible={visible} />
        <div className="relative z-10 max-w-[1100px] mx-auto px-5 sm:px-8 py-20 md:py-28">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-10 md:gap-14 lg:gap-20 items-start">
          {/* Photo placeholder */}
          <div
            className="transition-all duration-[1000ms]"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(16px)",
              transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            <div
              className="rounded-2xl overflow-hidden border border-[#141e2a] relative"
              style={{
                aspectRatio: "4 / 5",
                background: "#0b1118",
              }}
            >
              <Image
                src="/founder-hassan.jpg"
                alt="Hassan Ahmad, founder of Parhaylikhay"
                fill
                sizes="(min-width: 768px) 36vw, 100vw"
                priority={false}
                className="object-cover"
              />
              {/* Bottom gradient + caption strip so the name reads even
                  if the photo has a busy lower edge. */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to top, rgba(11,17,24,0.85), rgba(11,17,24,0))",
                }}
              />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="font-mono text-[10px] tracking-[2px] uppercase text-[#c8c6be]">
                  hassan ahmad
                </span>
                <span className="font-mono text-[10px] tracking-[1px] lowercase text-[#7a7875]">
                  founder
                </span>
              </div>
            </div>
          </div>

          {/* Founder note + credentials */}
          <div className="flex flex-col">
            <FadeIn delay={120} visible={visible}>
              <p className="font-mono text-[10.5px] tracking-[2.5px] uppercase text-[#3a4a5a] mb-4">
                why this exists
              </p>
              <p className="text-[22px] sm:text-[25px] md:text-[28px] leading-[1.4] text-[#f0eeea] font-medium tracking-[-0.014em] mb-8 max-w-[42ch]">
                I&apos;m <span className="text-[#fff067]">Hassan</span>.<br />
                For years I watched brilliant students switch off in maths class — not because they couldn&apos;t do it, but because no one ever made them feel it.
              </p>
              <p className="text-[18px] leading-[1.6] text-[#c8c6be] max-w-[44ch]">
                I graduated in physics from <span className="text-[#f0eeea]">University College London</span>. Since then I&apos;ve taught more than <span className="text-[#f0eeea]">800 students</span>, one-to-one, in small groups, and in full classrooms. My students have come from <span className="text-[#f0eeea]">7 different countries</span>, including from world-renowned schools like <span className="text-[#f0eeea]">St Paul&apos;s School</span> in Hammersmith, London. I&apos;m also president and co-founder of <span className="text-[#f0eeea]">The Tribe</span>, a youth leadership ecosystem.
              </p>
              <p className="text-[18px] leading-[1.6] text-[#c8c6be] mt-5 max-w-[40ch]">
                This is the platform I wish my students had.
              </p>
            </FadeIn>
          </div>
        </div>
        </div>
      </div>
    </Section>
  )
}

/**
 * SchoolsWall — the colourful backdrop list of schools Hassan has
 * taught at. Pinned to the LEFT of the section and bleeding off the
 * left edge so the visitor reads "there are more than fit on screen".
 * The foreground photo + bio sit on top and partially obscure the
 * wall, which is intentional. Top + bottom edges fade so the wall
 * doesn't start or end abruptly against the section padding.
 */
function SchoolsWall({ visible }: { visible: boolean }) {
  // Top + bottom soft fades so the list doesn't cut hard at the
  // section's vertical edges.
  const vMask =
    "linear-gradient(to bottom, transparent 0%, black 14%, black 86%, transparent 100%)"
  return (
    <div
      className="absolute top-0 bottom-0 left-0 hidden md:flex pointer-events-none select-none"
      style={{
        width: "min(60%, 720px)",
        // Names start flush at the section's left edge (no negative
        // translate). Their right edges are still ragged (different
        // name lengths), and the photo on top of the wall partially
        // obscures the longer ones — that's the intended effect.
        zIndex: 0,
        maskImage: vMask,
        WebkitMaskImage: vMask,
        opacity: visible ? 1 : 0,
        transition: "opacity 1400ms cubic-bezier(0.16,1,0.3,1)",
      }}
      aria-hidden
    >
      <div className="flex flex-col items-start justify-center w-full py-20 md:py-28">
        {SCHOOLS.map((school, i) => (
          <div
            key={school}
            className="font-sans font-extrabold whitespace-nowrap leading-[1.05] tracking-[-0.02em]"
            style={{
              color: SCHOOL_TINTS[i % SCHOOL_TINTS.length],
              opacity: 0.18,
              fontSize: "clamp(24px, 3.4vw, 40px)",
              transform: visible
                ? "translateX(0)"
                : "translateX(-20px)",
              transition: `transform 1100ms cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 35, 600) + 200}ms, opacity 900ms cubic-bezier(0.16,1,0.3,1) ${Math.min(i * 35, 600) + 200}ms`,
            }}
          >
            {school}
          </div>
        ))}
      </div>
    </div>
  )
}

function FadeIn({
  visible, delay = 0, children,
}: {
  visible: boolean
  delay?: number
  children: React.ReactNode
}) {
  return (
    <div
      className="transition-all duration-[900ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  )
}
