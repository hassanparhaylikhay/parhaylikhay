"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import styles from "../try.module.css"

/**
 * Section 5 — The Marking Scheme Insight.
 *
 * A quieter, shorter section than 3 or 4. We show a real Cambridge-style
 * question, the model answer, and the three B1 marks land one by one
 * with a soft green glow. The point is to plant: "this platform knows
 * what examiners want."
 *
 * Intentionally NOT a climax. Spacing is tighter, tone is calmer.
 */
export default function MarkSchemeSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  // step: 0 nothing | 1 question | 2 answer written | 3 b1#1 | 4 b1#2 | 5 b1#3 | 6 total

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => {
        if (en.isIntersecting && !visible) setVisible(true)
      }),
      { threshold: 0.3 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [visible])

  useEffect(() => {
    if (!visible) return
    // Stagger the reveal: question, then answer, then three pills, then total.
    const t = [
      setTimeout(() => setStep(1), 300),
      setTimeout(() => setStep(2), 1300),
      setTimeout(() => setStep(3), 2400),
      setTimeout(() => setStep(4), 2900),
      setTimeout(() => setStep(5), 3400),
      setTimeout(() => setStep(6), 4100),
    ]
    return () => t.forEach(clearTimeout)
  }, [visible])

  return (
    <Section ref={sectionRef} id="mark-scheme" ariaLabel="Marking scheme insight">
      <div className="max-w-[940px] mx-auto px-5 sm:px-8 py-20 md:py-24">
        <div
          className="text-center mb-12 transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(14px)",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p className="font-mono text-[10px] tracking-[2.5px] uppercase text-[#3a4a5a] mb-2.5">
            and because cambridge marks are won and lost on specifics ·
          </p>
          <h2 className="font-sans text-[24px] sm:text-[30px] md:text-[34px] leading-[1.18] tracking-[-0.02em] text-[#c8c6be] max-w-[32ch] mx-auto font-normal">
            Every lesson teaches not just the maths, but exactly what examiners reward.
          </h2>
        </div>

        {/* Question + answer card */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 transition-all duration-[900ms]"
          style={{
            opacity: visible ? 1 : 0,
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
            transitionDelay: "100ms",
          }}
        >
          <QuestionCard show={step >= 1} />
          <AnswerCard step={step} />
        </div>

        <p
          className="text-center text-[14.5px] sm:text-[16px] text-[#7a7875] leading-[1.55] mt-14 max-w-[40ch] mx-auto transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(8px)",
            transitionDelay: "400ms",
            transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <span className="text-[#f0eeea]">15 years of Cambridge papers</span>, integrated into how we teach. Not as flash cards. As the working we walk students through, every time.
        </p>
      </div>
    </Section>
  )
}

/* ─────────────────── Question card ─────────────────── */

function QuestionCard({ show }: { show: boolean }) {
  return (
    <div
      className="rounded-xl border p-6 sm:p-7 transition-all duration-[700ms]"
      style={{
        background: "#0b1118",
        borderColor: "#141e2a",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(8px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#ff4670]">
          cambridge 4024 · s24_22 q11
        </span>
        <span className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#7a7875]">
          [3 marks]
        </span>
      </div>
      <p className="text-[16px] leading-[1.55] text-[#f0eeea]">
        Describe fully the transformation that maps shape <span className="text-[#fff067]">A</span> onto shape <span className="text-[#00abfa]">B</span>.
      </p>

      {/* Diagram — match the Lesson Mode grid aesthetic. Grid units are
          a uniform 40 px; major axes are slightly brighter. Triangles
          render filled with mid-saturation stroke so the contrast with
          the mirror line is unmistakable. */}
      <div className="mt-5 rounded-lg border border-[#141e2a] p-3 bg-[#07090d]">
        <svg viewBox="0 0 360 240" className="w-full h-auto block" role="img" aria-label="Shape A reflected across the line x=1 onto shape B">
          {/* Coordinate grid — minor lines 0.5 stroke, major axes 1.2. */}
          <g stroke="#172230" strokeWidth="0.55">
            {[0,1,2,3,4,5,6,7,8].map(i => (
              <line key={`v${i}`} x1={i * 40} y1={0} x2={i * 40} y2={240} />
            ))}
            {[0,1,2,3,4,5,6].map(i => (
              <line key={`h${i}`} x1={0} y1={i * 40} x2={360} y2={i * 40} />
            ))}
          </g>
          {/* y-axis (x=0 → 160) and x-axis (y=0 → 120) */}
          <line x1={160} y1={0} x2={160} y2={240} stroke="#2a3a4a" strokeWidth="1.2" />
          <line x1={0}   y1={120} x2={360} y2={120} stroke="#2a3a4a" strokeWidth="1.2" />

          {/* Tick marks on the x-axis (only show at -3, -2, -1, 1, 2, 3, 4, 5) */}
          {[-3,-2,-1,1,2,3,4,5].map(n => (
            <g key={`xt${n}`}>
              <line x1={160 + n*40} y1={116} x2={160 + n*40} y2={124} stroke="#3a4a5a" strokeWidth="1" />
              <text x={160 + n*40} y={138} fontSize="9.5" fill="#3a4a5a" fontFamily="ui-monospace" textAnchor="middle">{n}</text>
            </g>
          ))}
          {/* y tick labels */}
          {[-2,-1,1,2].map(n => (
            <text key={`yt${n}`} x={154} y={120 - n*40 + 3} fontSize="9.5" fill="#3a4a5a" fontFamily="ui-monospace" textAnchor="end">{n}</text>
          ))}

          {/* Mirror line x = 1  →  SVG x = 200, with label */}
          <line x1={200} y1={4} x2={200} y2={236} stroke="#fff067"
            strokeWidth="1.6" strokeDasharray="5 4" opacity="0.85" />
          <text x={207} y={20} fontSize="11" fill="#fff067" fontFamily="ui-monospace" letterSpacing="0.4">x = 1</text>

          {/* Shape A — math vertices (2, 0.5), (3.5, 0.5), (3.5, 2.5).
              Triangle is asymmetric so the reflected B reads clearly. */}
          <polygon
            points="240,100 300,100 300,40"
            fill="rgba(255,240,103,0.14)"
            stroke="#fff067"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <text x={270} y={88} fontSize="14" fill="#fff067" fontFamily="ui-monospace" fontWeight="600" textAnchor="middle">A</text>

          {/* Shape B = reflection of A across x=1 — vertices (0, 0.5), (-1.5, 0.5), (-1.5, 2.5) */}
          <polygon
            points="160,100 100,100 100,40"
            fill="rgba(0,171,250,0.14)"
            stroke="#00abfa"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <text x={130} y={88} fontSize="14" fill="#00abfa" fontFamily="ui-monospace" fontWeight="600" textAnchor="middle">B</text>

          {/* Subtle mapping cue — three dashed pairs joining matching
              vertices, signalling "every point reflects to its partner". */}
          <g stroke="#3a4a5a" strokeWidth="0.7" strokeDasharray="2 3" opacity="0.7">
            <line x1={240} y1={100} x2={160} y2={100} />
            <line x1={300} y1={100} x2={100} y2={100} />
            <line x1={300} y1={40}  x2={100} y2={40}  />
          </g>

          {/* Axis end labels */}
          <text x={352} y={117} fontSize="10" fill="#3a4a5a" fontFamily="ui-monospace">x</text>
          <text x={166} y={12}  fontSize="10" fill="#3a4a5a" fontFamily="ui-monospace">y</text>
        </svg>
      </div>
    </div>
  )
}

/* ─────────────────── Answer card ─────────────────── */

function AnswerCard({ step }: { step: number }) {
  // Type out "Reflection in the line x = 1." as a slow write-on.
  const ANSWER = "Reflection in the line x = 1."
  const [typed, setTyped] = useState(0)
  useEffect(() => {
    if (step < 2) return                 // wait for the cue
    if (typed >= ANSWER.length) return   // done
    const t = setTimeout(() => setTyped(n => Math.min(n + 1, ANSWER.length)), 38)
    return () => clearTimeout(t)
  }, [step, typed])

  return (
    <div
      className="rounded-xl border p-6 sm:p-7 transition-all duration-[700ms]"
      style={{
        background: "#0b1118",
        // Per-side colours instead of shorthand borderColor — mixing
        // shorthand (borderColor) with the side-specific borderLeft
        // shorthand triggers a React DOM dev-mode warning.
        borderTopColor:    step >= 6 ? "rgba(15,238,137,0.35)" : "#141e2a",
        borderRightColor:  step >= 6 ? "rgba(15,238,137,0.35)" : "#141e2a",
        borderBottomColor: step >= 6 ? "rgba(15,238,137,0.35)" : "#141e2a",
        borderLeftColor:   "#fff067",   // worked-example yellow rail
        borderLeftWidth:   2.5,
        borderLeftStyle:   "solid",
        opacity: step >= 1 ? 1 : 0,
        transform: step >= 1 ? "translateY(0)" : "translateY(8px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        transitionDelay: "180ms",
      }}
    >
      <p className="text-[20px] sm:text-[22px] text-[#f0eeea] font-medium leading-[1.4] mb-5 min-h-[34px]">
        {ANSWER.slice(0, typed)}
        {step === 2 && typed < ANSWER.length && (
          <span className={styles.caret} aria-hidden />
        )}
      </p>

      {/* Mark codes land one by one. Mixing B1 / M1 / A1 mirrors the
          way Cambridge actually splits this question — independent
          recognition of the transformation type (B1), the method of
          spotting the mirror line (M1), and the accuracy of stating
          its equation (A1). */}
      <div className="flex flex-col gap-2.5">
        <MarkLine
          show={step >= 3}
          code="B1"
          text="for the transformation type, reflection."
        />
        <MarkLine
          show={step >= 4}
          code="M1"
          text="for identifying the vertical mirror line."
        />
        <MarkLine
          show={step >= 5}
          code="A1"
          text="for the correct equation $x = 1$."
        />
      </div>

      <div
        className="mt-5 pt-4 border-t border-[#141e2a] flex items-center justify-between transition-all"
        style={{
          opacity: step >= 6 ? 1 : 0,
          transform: step >= 6 ? "scale(1)" : "scale(0.94)",
          transitionDuration: "700ms",
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        <span className="font-mono text-[10.5px] tracking-[2px] uppercase text-[#0fee89]">
          full marks
        </span>
        <span className="font-mono text-[22px] text-[#0fee89] font-semibold tracking-tight">
          3 / 3
        </span>
      </div>
    </div>
  )
}

function MarkLine({ show, code, text }: { show: boolean; code: string; text: string }) {
  // Tiny glow ring that fires once when the pill becomes visible.
  const [fired, setFired] = useState(false)
  useEffect(() => {
    if (show && !fired) {
      const t = setTimeout(() => setFired(true), 60)
      return () => clearTimeout(t)
    }
  }, [show, fired])

  // Render text with inline $x = 1$ as soft yellow span (rendering KaTeX
  // for one inline expression is overkill; we want the text scan to be
  // fast). Replace $...$ with <span class="font-mono">...</span>.
  const parts = text.split(/(\$[^$]+\$)/g)

  return (
    <div className="flex items-start gap-3">
      <span
        className={`${styles.markPillIn} ${styles.markPillGlow} ${show ? styles.markPillInVisible : ""} ${fired ? styles.markPillGlowFired : ""}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(0,171,250,0.10)",
          border: "1px solid rgba(0,171,250,0.40)",
          color: "#00abfa",
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontWeight: 700,
          fontSize: "11px",
          letterSpacing: "1.2px",
          padding: "3px 9px",
          borderRadius: 4,
          minWidth: 32,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {code}
      </span>
      <p
        className="text-[14.5px] leading-[1.55] text-[#c8c6be] transition-opacity duration-[700ms]"
        style={{ opacity: show ? 1 : 0, transitionDelay: "200ms" }}
      >
        {parts.map((p, i) =>
          p.startsWith("$") && p.endsWith("$") ? (
            <span key={i} className="font-mono text-[#fff067]">{p.slice(1, -1)}</span>
          ) : (
            <span key={i}>{p}</span>
          ),
        )}
      </p>
    </div>
  )
}
