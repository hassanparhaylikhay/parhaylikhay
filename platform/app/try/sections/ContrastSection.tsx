"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import { COLOR } from "@/components/lesson-mode/interactions/_shared"

/**
 * Section 2 — The Contrast.
 *
 * Split-screen. Left side renders a "textbook" — a static, low-saturation
 * card with frozen equations and an unmoving parabola, made of pure CSS/SVG.
 * Right side renders the SAME parabola, alive: drag the vertex, drag a
 * coefficient slider, watch the curve shift. The eye reads the contrast
 * before the visitor reads the captions.
 *
 * Mounted live on the right: a small, self-contained interactive parabola
 * widget rendered inline (no iframe — we want this to feel embedded in the
 * narrative, not separated by a frame). Drag the green vertex; the curve
 * lerps to match.
 */
export default function ContrastSection() {
  return (
    <Section id="contrast" ariaLabel="Reading versus doing" tall className="overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 sm:px-8 lg:px-12 py-24 md:py-32">
        <FadeIn>
          <p className="text-center font-mono text-[10.5px] tracking-[3px] uppercase text-[#3a4a5a] mb-3">
            the difference
          </p>
          <h2 className="text-center font-sans text-[26px] sm:text-[34px] md:text-[40px] leading-[1.18] tracking-[-0.02em] text-[#f0eeea] max-w-[18ch] mx-auto mb-16 md:mb-24 font-medium">
            One side of this is how maths is taught.<br className="hidden sm:block" />
            <span className="text-[#00abfa]"> The other side is what we built.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <FadeIn delay={0}>
            <TextbookCard />
          </FadeIn>
          <FadeIn delay={520}>
            <ManipulativeCard />
          </FadeIn>
        </div>

        <FadeIn delay={1000}>
          <p className="text-center text-[18px] sm:text-[22px] md:text-[26px] leading-[1.4] text-[#c8c6be] mt-20 md:mt-28 max-w-[28ch] mx-auto">
            Most platforms give students <span className="text-[#7a7875]">more textbook on a screen.</span>{" "}
            <span className="text-[#fff067]">Parhaylikhay gives them maths they can move with their hands.</span>
          </p>
        </FadeIn>
      </div>
    </Section>
  )
}

/* ─────────────────── Left half: dead textbook ─────────────────── */

function TextbookCard() {
  return (
    <div className="flex flex-col">
      <div className="font-mono text-[10px] tracking-[2.5px] uppercase text-[#3a4a5a] mb-4">
        the old way
      </div>
      <div
        className="relative rounded-xl overflow-hidden border flex-1"
        style={{
          background: "#15171a",
          borderColor: "#1a1d22",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
          // Mobile: enough vertical room for the prose + circle diagram
          // without clipping. Desktop: items-stretch makes the card grow
          // to match the right column's live widget height, so this
          // floor is rarely the constraint there.
          minHeight: 480,
        }}
      >
        {/* Faint paper grain — repeating horizontal lines for a printed-page feel. */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 4px)",
          }}
        />
        {/* "Page" content — all gray, all static. Same theorem the live
            widget on the right teaches, but flattened into a textbook
            paragraph with one frozen example diagram. */}
        <div className="absolute inset-0 p-7 sm:p-9 flex flex-col gap-3 grayscale">
          <p className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#3a3d42]">
            chapter 7 · circle theorems
          </p>
          <p className="text-[#5a5e64] text-[13px] leading-[1.55]">
            The angle subtended at the <em className="text-[#7a7e84] not-italic">centre</em>{" "}
            of a circle by an arc is <em className="text-[#7a7e84] not-italic">twice</em>{" "}
            the angle subtended at any point on the major arc.
          </p>
          <p className="text-[#4a4d52] text-[13px] leading-[1.55]">
            In the figure, <span className="font-mono text-[#6a6e74]">∠AOB = 110°</span> at the
            centre, so <span className="font-mono text-[#6a6e74]">∠APB = 55°</span> at the
            circumference for any P on the major arc.
          </p>

          {/* Static circle diagram. No interaction — flat, frozen, the
              way it appears in an actual textbook page. Geometry:
                O = (110, 80)
                A = (64, 42)   B = (156, 42)   P = (128, 137)
              Angle arcs sit on the two rays at a small radius from the
              vertex and bulge into the interior of the angle (towards
              the opening), with the numeric label just outside the arc. */}
          <div className="flex-1 mt-1 flex items-center justify-center">
            <svg viewBox="0 0 220 165" className="w-full max-w-[240px] h-auto opacity-85">
              {/* The circle */}
              <circle cx="110" cy="80" r="60" fill="none" stroke="#5a5e64" strokeWidth="1.2" />

              {/* OA, OB — radii to A, B (upper arc) */}
              <line x1="110" y1="80" x2="64"  y2="42" stroke="#6a6e74" strokeWidth="1" />
              <line x1="110" y1="80" x2="156" y2="42" stroke="#6a6e74" strokeWidth="1" />

              {/* PA, PB — chord segments from P up to A, B */}
              <line x1="128" y1="137" x2="64"  y2="42" stroke="#6a6e74" strokeWidth="1" />
              <line x1="128" y1="137" x2="156" y2="42" stroke="#6a6e74" strokeWidth="1" />

              {/* ∠AOB — arc at O, radius 14 along OA and OB, bulging
                  AWAY from O (upward, into the open angle toward A & B).
                  Endpoints: O + 14·OA_unit ≈ (99.2, 71.1) and
                             O + 14·OB_unit ≈ (120.8, 71.1).
                  sweep-flag = 1 puts the arc on the upper side (away
                  from O). Earlier sweep-flag = 0 inverted it, bulging
                  the arc toward O instead. */}
              <path d="M 99.2 71.1 A 14 14 0 0 1 120.8 71.1"
                fill="none" stroke="#9a9ea4" strokeWidth="1" />

              {/* ∠APB — arc at P, radius 12 along PA and PB, bulging
                  AWAY from P (upward into the open angle).
                  Endpoints: P + 12·PA_unit ≈ (121.3, 127.0) and
                             P + 12·PB_unit ≈ (131.4, 125.6). */}
              <path d="M 121.3 127.0 A 12 12 0 0 1 131.4 125.6"
                fill="none" stroke="#9a9ea4" strokeWidth="1" />

              {/* Vertex dots */}
              <circle cx="110" cy="80"  r="2"   fill="#9a9ea4" />
              <circle cx="64"  cy="42"  r="2.5" fill="#9a9ea4" />
              <circle cx="156" cy="42"  r="2.5" fill="#9a9ea4" />
              <circle cx="128" cy="137" r="2.5" fill="#9a9ea4" />

              {/* Point labels */}
              <text x="55"  y="38"  fontSize="11" fill="#9a9ea4" fontFamily="ui-monospace" fontStyle="italic" textAnchor="end">A</text>
              <text x="165" y="38"  fontSize="11" fill="#9a9ea4" fontFamily="ui-monospace" fontStyle="italic">B</text>
              <text x="116" y="78"  fontSize="10" fill="#9a9ea4" fontFamily="ui-monospace" fontStyle="italic">O</text>
              <text x="135" y="151" fontSize="11" fill="#9a9ea4" fontFamily="ui-monospace" fontStyle="italic">P</text>

              {/* Angle value labels, placed inside the angle just past the arc */}
              <text x="110" y="62"  fontSize="9.5" fill="#9a9ea4" fontFamily="ui-monospace" textAnchor="middle">110°</text>
              <text x="125" y="118" fontSize="8.5" fill="#9a9ea4" fontFamily="ui-monospace" textAnchor="middle">55°</text>
            </svg>
          </div>

          <p className="font-mono text-[10px] tracking-[1px] text-[#3a3d42] mt-1">
            fig. 7.1: angle at centre = 2 × angle at circumference
          </p>
        </div>

        {/* Page-corner curl */}
        <div
          aria-hidden
          className="absolute bottom-3 right-3 w-9 h-9 rounded-tl-md"
          style={{
            background:
              "linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.04) 50%)",
            border: "1px solid rgba(255,255,255,0.03)",
            borderTop: 0,
            borderLeft: 0,
          }}
        />
      </div>
      <p className="text-center text-[15px] text-[#7a7875] mt-5">
        Reading. Watching. Hoping it sticks.
      </p>
    </div>
  )
}

/* ─────────────────── Right half: alive manipulative ─────────────────── */

function ManipulativeCard() {
  // Embed the production `quadratic-roots-grapher` widget. The widget
  // self-reports its rendered height via `pl-widget-resize` postMessage;
  // we let the iframe grow to match.
  const ifrRef = useRef<HTMLIFrameElement | null>(null)
  // Initial guess sized for the widget's natural full-width rendering;
  // the widget's `pl-widget-resize` message then refines it. Ceiling
  // is generous so the in-canvas "110° = 2 × 55°" banner (rendered
  // inside the canvas, near its bottom) is never clipped.
  const [h, setH] = useState(520)
  // Drives the persistent "drag the nodes" cue — cleared the moment
  // the visitor presses anywhere inside the iframe, or after a long
  // fallback timeout.
  const [interacted, setInteracted] = useState(false)

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (ifrRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        // 8 px breathing room over the reported height so sub-pixel
        // rounding never trims the banner.
        setH(Math.max(360, Math.min(820, Math.round(d.height) + 8)))
      }
      // The widget posts this exactly once when the visitor presses
      // any node — bulletproof way to dismiss the "drag" cue without
      // depending on event bubbling through the iframe boundary.
      if (d.type === "pl-interaction") {
        setInteracted(true)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  // Fallback fade after 18 s so the hint never lingers indefinitely.
  useEffect(() => {
    if (interacted) return
    const t = setTimeout(() => setInteracted(true), 18000)
    return () => clearTimeout(t)
  }, [interacted])

  return (
    <div className="flex flex-col">
      <div className="font-mono text-[10px] tracking-[2.5px] uppercase text-[#00abfa] mb-4">
        the parhaylikhay way
      </div>
      <div
        className="relative rounded-xl overflow-hidden border"
        style={{
          background: COLOR.card,
          borderColor: "#1c2a3a",
          boxShadow: "0 24px 60px -32px rgba(0, 171, 250, 0.25)",
        }}
      >
        <iframe
          ref={ifrRef}
          src="/widgets/circle-angle-centre.html?accent=red"
          title="Angle at centre, angle at circumference"
          loading="lazy"
          className="block w-full"
          style={{ height: `${h}px`, border: 0, background: COLOR.card }}
          onLoad={() => {
            try {
              const w = ifrRef.current?.contentWindow
              if (!w) return
              // Force the widget to remeasure once layout settles.
              const fire = () => { try { w.dispatchEvent(new Event("resize")) } catch {} }
              setTimeout(fire, 80)
              setTimeout(fire, 320)
              setTimeout(fire, 700)
              // Hide the cue the first time the visitor presses
              // anywhere inside the iframe. Listen for mousedown,
              // touchstart AND pointerdown on the contentDocument so
              // we catch the widget's actual event whatever the
              // browser delivers (the canvas binds to mousedown +
              // touchstart specifically).
              const dismiss = () => setInteracted(true)
              const opts = { once: true } as AddEventListenerOptions
              const optsPassive = { once: true, passive: true } as AddEventListenerOptions
              w.document.addEventListener("mousedown",   dismiss, opts)
              w.document.addEventListener("pointerdown", dismiss, opts)
              w.document.addEventListener("touchstart",  dismiss, optsPassive)
            } catch { /* cross-origin guard */ }
          }}
        />
        <NodeArrowHint hidden={interacted} />
      </div>
      <p className="text-center text-[15px] text-[#00abfa] mt-5">
        Doing. Exploring. Understanding.
      </p>
    </div>
  )
}

/* ─────────────────── "Drag" directed cue ─────────────────── */

/**
 * NodeArrowHint — a small, subtle overlay positioned just to the LEFT
 * of point A in the circle widget's default state. A short right-
 * pointing arrow points at A; "drag" is the only word. Pulses softly
 * so the eye catches it, fades the instant the visitor presses any
 * node on the widget.
 *
 * Position is set via percentages of the container, so the cue stays
 * roughly anchored to A as the iframe scales to different widths.
 */
function NodeArrowHint({ hidden }: { hidden?: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none z-30"
      style={{
        opacity: hidden ? 0 : 1,
        transition: "opacity 500ms cubic-bezier(0.16,1,0.3,1)",
      }}
      aria-hidden
    >
      {/* Chip sits a little to the left of A (which lives at ~30 %
          across, ~32 % down in the default state). Tiny arrow inside
          the chip points right at A.
          Hidden on phone — the chip's %-anchored position drifts into
          A's label space when the iframe gets narrow, and the widget
          has its own footer hint ("drag A, B, or P:...") that covers
          the same beat. */}
      {/* DESKTOP chip: sits to the LEFT of A (which lives at ~30 %
          across, ~32 % down). Arrow inside the chip points right at A. */}
      <div
        className="absolute hidden sm:flex items-center gap-1.5"
        style={{
          left: "5%",
          top: "30%",
          animation: "pl-node-hint-pulse 2s ease-in-out infinite",
        }}
      >
        <span
          className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#ff4670] px-2 py-1 rounded"
          style={{
            background: "rgba(11, 17, 24, 0.82)",
            border: "1px solid rgba(255, 70, 112, 0.42)",
            boxShadow: "0 4px 14px -6px rgba(255, 70, 112, 0.4)",
          }}
        >
          drag
        </span>
        <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden>
          <line
            x1="0" y1="5" x2="16" y2="5"
            stroke="#ff4670" strokeWidth="1.5"
            strokeDasharray="3 3" strokeLinecap="round"
          />
          <path
            d="M 14 1.5 L 20 5 L 14 8.5"
            stroke="#ff4670" strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* PHONE chip: top-center of the iframe with a downward arrow.
          Anchored in pixels (top:44px) so it sits below the APB angle
          label at the top of the circle without colliding with it. */}
      <div
        className="absolute flex sm:hidden flex-col items-center gap-1.5"
        style={{
          left: "50%",
          top: "44px",
          transform: "translateX(-50%)",
          animation: "pl-node-hint-bob 2s ease-in-out infinite",
        }}
      >
        <span
          className="font-mono text-[10px] tracking-[1.5px] uppercase text-[#ff4670] px-2 py-1 rounded"
          style={{
            background: "rgba(11, 17, 24, 0.92)",
            border: "1px solid rgba(255, 70, 112, 0.55)",
            boxShadow: "0 4px 14px -6px rgba(255, 70, 112, 0.55)",
          }}
        >
          drag
        </span>
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" aria-hidden>
          <line
            x1="5" y1="0" x2="5" y2="9"
            stroke="#ff4670" strokeWidth="1.5"
            strokeDasharray="3 3" strokeLinecap="round"
          />
          <path
            d="M 1.5 7 L 5 11 L 8.5 7"
            stroke="#ff4670" strokeWidth="1.5"
            fill="none" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      <style jsx>{`
        @keyframes pl-node-hint-pulse {
          0%, 100% { transform: translateX(0);    opacity: 1;    }
          50%      { transform: translateX(-3px); opacity: 0.7;  }
        }
        @keyframes pl-node-hint-bob {
          0%, 100% { transform: translate(-50%, 0);    opacity: 1;    }
          50%      { transform: translate(-50%, 3px); opacity: 0.7;  }
        }
      `}</style>
    </div>
  )
}

/* ─────────────────── Local fade-in helper ─────────────────── */

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          obs.disconnect()
        }
      }),
      { threshold: 0.15 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: "opacity 900ms cubic-bezier(0.16,1,0.3,1), transform 900ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  )
}
