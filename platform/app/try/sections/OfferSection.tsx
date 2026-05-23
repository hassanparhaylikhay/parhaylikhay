"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import styles from "../try.module.css"

/**
 * Section 9 — The Offer.
 *
 * The form is the only place on the page that asks the visitor for
 * anything. So it stays calm: four fields, stacked, generous spacing,
 * brand-green primary CTA.
 *
 * Submission stores the payload in localStorage AND posts to
 * /api/try-signup (best-effort — if the API isn't wired yet the visitor
 * still sees the success state, and we never embarrass the demo).
 */

const ROLES = ["Student", "Parent", "Teacher", "School admin", "Tutor", "Other"] as const

export default function OfferSection() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (submitting) return
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(fd.entries())
    if (!payload.email || !payload.whatsapp || !payload.role) {
      setError("We need your name, role, email and WhatsApp number to set up your access.")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      localStorage.setItem("pl_try_signup", JSON.stringify({ ...payload, at: new Date().toISOString() }))
    } catch { /* ignore */ }
    try {
      await fetch("/api/try-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    } catch {
      // Don't surface errors — show the success state regardless. The
      // localStorage write is a backstop; we'll WhatsApp the visitor
      // when the API is wired.
    }
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <Section ref={sectionRef} id="offer" ariaLabel="Free trial offer">
      <div className="max-w-[640px] mx-auto px-5 sm:px-8 py-20 md:py-28">
        <FadeIn visible={visible}>
          <p className="text-center font-mono text-[10.5px] tracking-[3px] uppercase text-[#0fee89] mb-3">
            early access
          </p>
          <h2 className="text-center font-sans text-[28px] sm:text-[36px] md:text-[44px] leading-[1.15] tracking-[-0.022em] text-[#f0eeea] mb-3 font-medium">
            Get early access for free.
          </h2>
          <p className="text-center text-[15px] sm:text-[17px] text-[#c8c6be] mb-12 max-w-[36ch] mx-auto">
            Tell us who you are and we&apos;ll WhatsApp you your access link.
          </p>
        </FadeIn>

        {!submitted ? (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4"
          >
            <Field name="name"     label="Your name"        delay={120} visible={visible} required />
            <SelectField
              name="role"
              label="I am a"
              delay={220}
              visible={visible}
              required
              options={ROLES}
              placeholder="Choose one"
            />
            <Field name="email"    label="Email"            delay={320} visible={visible} type="email" required />
            <Field name="whatsapp" label="WhatsApp number"  delay={420} visible={visible} type="tel" required placeholder="+92 300 …" />

            {error && (
              <p className="text-[13px] text-[#ff4670] mt-1" role="alert">
                {error}
              </p>
            )}

            <div
              className="mt-3 transition-all duration-[800ms]"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(8px)",
                transitionDelay: "620ms",
                transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <button
                type="submit"
                disabled={submitting}
                className={`${styles.ctaGlow} group inline-flex items-center justify-center w-full gap-2.5 px-7 py-4 rounded-xl bg-[#0fee89] text-[#07090d] text-[16px] font-semibold tracking-[-0.01em] transition-transform duration-300 hover:scale-[1.04] hover:brightness-110 active:scale-[0.99] disabled:opacity-60`}
                style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
              >
                {submitting ? "Saving your details…" : "Get early access"}
                {!submitting && (
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden className="transition-transform group-hover:translate-x-0.5">
                    <path d="M2 7h9M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </form>
        ) : (
          <SuccessCard />
        )}

        <div
          className="mt-10 pt-8 border-t border-[#141e2a] text-center transition-all duration-[800ms]"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "800ms",
          }}
        >
          <p className="text-[13.5px] sm:text-[14px] leading-[1.65] text-[#7a7875] max-w-[44ch] mx-auto">
            Free for everyone during early access.
          </p>
        </div>
      </div>
    </Section>
  )
}

function Field({
  name, label, type = "text", required, placeholder, visible, delay,
}: {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  visible: boolean
  delay: number
}) {
  return (
    <label
      className="block transition-all duration-[800ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span className="block font-mono text-[10px] tracking-[2px] uppercase text-[#7a7875] mb-1.5">
        {label}{required ? " *" : ""}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        autoComplete={
          type === "email" ? "email" :
          type === "tel"   ? "tel"   :
          name === "name"  ? "name"  :
          "off"
        }
        className="w-full bg-[#0b1118] border border-[#141e2a] rounded-lg px-4 py-3 text-[15px] text-[#f0eeea] placeholder-[#3a4a5a] outline-none transition-colors focus:border-[#00abfa]"
        style={{ transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      />
    </label>
  )
}

function SelectField({
  name, label, required, placeholder, options, visible, delay,
}: {
  name: string
  label: string
  required?: boolean
  placeholder?: string
  options: readonly string[]
  visible: boolean
  delay: number
}) {
  return (
    <label
      className="block transition-all duration-[800ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <span className="block font-mono text-[10px] tracking-[2px] uppercase text-[#7a7875] mb-1.5">
        {label}{required ? " *" : ""}
      </span>
      <select
        name={name}
        required={required}
        defaultValue=""
        className="w-full bg-[#0b1118] border border-[#141e2a] rounded-lg px-4 py-3 text-[15px] text-[#f0eeea] outline-none transition-colors focus:border-[#00abfa] appearance-none"
        style={{
          transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1 L6 6 L11 1' stroke='%237a7875' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 16px center",
          paddingRight: "40px",
        }}
      >
        <option value="" disabled hidden>
          {placeholder ?? "Choose one"}
        </option>
        {options.map(opt => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  )
}

function SuccessCard() {
  return (
    <div
      className="rounded-2xl border p-7 sm:p-9 text-center"
      style={{
        background: "rgba(15,238,137,0.04)",
        borderColor: "rgba(15,238,137,0.35)",
      }}
    >
      <svg width="42" height="42" viewBox="0 0 42 42" className="mx-auto mb-5">
        <circle cx="21" cy="21" r="19" fill="rgba(15,238,137,0.12)" stroke="#0fee89" strokeWidth="1.5" />
        <path d="M13 22 L19 28 L30 16" fill="none" stroke="#0fee89" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-[20px] sm:text-[22px] text-[#0fee89] font-medium mb-3 leading-tight tracking-[-0.01em]">
        Got it.
      </p>
      <p className="text-[15px] text-[#c8c6be] leading-[1.6] max-w-[36ch] mx-auto">
        We&apos;ll WhatsApp you within 24 hours with your access link and a short note from Hassan.
      </p>
    </div>
  )
}

function FadeIn({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className="transition-all duration-[900ms]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  )
}
