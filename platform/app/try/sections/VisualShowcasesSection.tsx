"use client"

import { useEffect, useRef, useState } from "react"
import Section from "../components/Section"
import DragHint from "../components/DragHint"

/**
 * Visual Showcases — five rows that each pair a topic pitch with a
 * live production widget plus the mark-scheme phrasing card. The user
 * will direct specific tightening from here; this file restores the
 * pre-declutter layout as the working baseline.
 */

type Showcase = {
  topic: string
  unit: string
  title: string
  pitch: string
  widget: string
  iframeHeight: number
  flip: boolean
  accent: string
  /** Optional tab strip ABOVE the widget — used by the nets row. */
  tabs?: { label: string; src: string }[]
}

const SHOWS: Showcase[] = [
  {
    topic: "circle theorems",
    unit: "Cambridge 4024 · 4.7",
    title: "The hardest circle theorem, made obvious.",
    pitch: "The angle between a tangent and a chord equals the angle in the alternate segment. Most students memorise the name; few really understand it. Drag the points, watch the two angles stay in lock-step.",
    widget: "/widgets/circle-alternate-segment.html",
    iframeHeight: 560,
    flip: false,
    accent: "#ff4670",
  },
  {
    topic: "nets of solids",
    unit: "Cambridge 4024 · 4.2",
    title: "Unfold the solid. See the formula on every face.",
    pitch: "Cuboid, cone, cylinder, prism, pyramid. Pick a solid and watch it open flat. Every face carries its own area formula. A student who unfolds it won't forget which faces to count.",
    widget: "/widgets/net-unfolder.html?solid=cube",
    iframeHeight: 640,
    flip: true,
    accent: "#fff067",
    tabs: [
      { label: "Cube",     src: "/widgets/net-unfolder.html?solid=cube" },
      { label: "Cuboid",   src: "/widgets/net-unfolder.html?solid=cuboid" },
      { label: "Cylinder", src: "/widgets/net-unfolder.html?solid=cylinder" },
      { label: "Cone",     src: "/widgets/net-unfolder.html?solid=cone" },
      { label: "Prism",    src: "/widgets/net-unfolder.html?solid=prism" },
      { label: "Pyramid",  src: "/widgets/net-unfolder.html?solid=pyramid" },
    ],
  },
  {
    topic: "3-D symmetry",
    unit: "Cambridge 4024 · 4.5",
    title: "Every plane of symmetry, every axis of rotation.",
    pitch: "Rotate the solid by hand. Each plane and axis lights up where it exists. Cuboid: three planes. Triangular prism: two planes. Cube: nine planes. Students see the count before they write the count.",
    widget: "/widgets/solid-symmetry.html",
    iframeHeight: 720,
    flip: false,
    accent: "#00abfa",
  },
  {
    topic: "angles at a point",
    unit: "Cambridge 4024 · 4.6",
    title: "Angles all the way around add to 360°.",
    pitch: "Drag any vertex. The four wedges resize together, and their sum stays exactly 360°. The student doesn't memorise the rule; they watch it hold.",
    widget: "/widgets/angle-rules.html?rule=point",
    iframeHeight: 520,
    flip: true,
    accent: "#ff822c",
  },
  {
    topic: "centre of rotation",
    unit: "Cambridge 4024 · 7.1 · the hardest one",
    title: "The perpendicular bisectors meet at the centre. Every time.",
    pitch: "Cambridge's hardest transformation question: given the object and its rotated image, find the centre. Walk the construction in six steps. Then drag any vertex or the centre, and watch the two bisectors swivel but always cross at the same point.",
    widget: "/widgets/rotation-centre-step-explorer.html",
    iframeHeight: 540,
    flip: false,
    accent: "#fff067",
  },
]

export default function VisualShowcasesSection() {
  return (
    <Section id="showcases" ariaLabel="More visual topic showcases">
      <div className="max-w-[1240px] mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-28">
        <FadeIn>
          <p className="text-center font-mono text-[10.5px] tracking-[3px] uppercase text-[#3a4a5a] mb-3">
            this works for every visual topic
          </p>
          <h2 className="text-center font-sans text-[26px] sm:text-[34px] md:text-[40px] leading-[1.18] tracking-[-0.022em] text-[#f0eeea] max-w-[26ch] mx-auto mb-20 md:mb-28 font-medium">
            Transformations was one example. The platform teaches everything that&apos;s visual the same way.
          </h2>
        </FadeIn>

        <div className="flex flex-col gap-24 md:gap-32">
          {SHOWS.map(s => <ShowcaseRow key={s.topic} show={s} />)}
        </div>
      </div>
    </Section>
  )
}

function ShowcaseRow({ show }: { show: Showcase }) {
  return (
    <FadeIn>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Widget column */}
        <div className={`order-1 ${show.flip ? "lg:order-2" : "lg:order-1"}`}>
          <WidgetSlab src={show.widget} height={show.iframeHeight} accent={show.accent} tabs={show.tabs} />
        </div>
        {/* Copy column. Mark-scheme phrasing card removed — the
            remaining text is scaled up so the copy column keeps the
            same visual weight against the widget. */}
        <div className={`order-2 ${show.flip ? "lg:order-1" : "lg:order-2"}`}>
          <p className="font-mono text-[11px] tracking-[2.5px] uppercase mb-2.5" style={{ color: show.accent }}>
            {show.topic}
          </p>
          <p className="font-mono text-[11.5px] tracking-[1.5px] uppercase text-[#3a4a5a] mb-6">
            {show.unit}
          </p>
          <h3 className="text-[26px] sm:text-[32px] md:text-[38px] leading-[1.2] tracking-[-0.022em] text-[#f0eeea] font-medium mb-6 max-w-[22ch]">
            {show.title}
          </h3>
          <p className="text-[17px] sm:text-[19px] leading-[1.6] text-[#c8c6be] max-w-[40ch]">
            {show.pitch}
          </p>
        </div>
      </div>
    </FadeIn>
  )
}

function WidgetSlab({
  src, height, accent, tabs,
}: {
  src: string
  height: number
  accent: string
  tabs?: { label: string; src: string }[]
}) {
  const [active, setActive] = useState(false)
  const [intrinsicH, setIntrinsicH] = useState(height)
  const [currentSrc, setCurrentSrc] = useState(src)
  const ifrRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data
      if (!d || typeof d !== "object") return
      if (ifrRef.current?.contentWindow !== e.source) return
      if (d.type === "pl-widget-resize" && typeof d.height === "number") {
        setIntrinsicH(Math.max(400, Math.min(900, Math.round(d.height))))
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  return (
    <div className="flex flex-col gap-3">
      {tabs && tabs.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => {
            const isActive = t.src === currentSrc
            return (
              <button
                key={t.label}
                onClick={() => setCurrentSrc(t.src)}
                className="font-mono text-[10.5px] uppercase tracking-[1.5px] px-3 py-1.5 rounded transition-all duration-300"
                style={{
                  background: isActive ? `${accent}1a` : "transparent",
                  color: isActive ? accent : "#7a7875",
                  border: `1px solid ${isActive ? `${accent}66` : "#141e2a"}`,
                  transitionTimingFunction: "cubic-bezier(0.16,1,0.3,1)",
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      )}
      <div
        className="rounded-2xl border overflow-hidden relative"
        style={{
          background: "#0b1118",
          borderColor: active ? `${accent}66` : "#141e2a",
          transition: "border-color 700ms cubic-bezier(0.16,1,0.3,1), box-shadow 700ms cubic-bezier(0.16,1,0.3,1), height 500ms cubic-bezier(0.16,1,0.3,1)",
          boxShadow: active
            ? `0 30px 70px -40px ${accent}55`
            : "0 24px 50px -38px rgba(0,0,0,0.6)",
        }}
        onPointerEnter={() => setActive(true)}
      >
        <DragHint accent={accent} duration={6000} hidden={active} />
        <iframe
          ref={ifrRef}
          key={currentSrc}
          src={currentSrc}
          title="Showcase widget"
          loading="lazy"
          className="block w-full"
          style={{ height: `${intrinsicH}px`, border: 0, background: "#0b1118", transition: "height 500ms cubic-bezier(0.16,1,0.3,1)" }}
          onLoad={() => {
            // The widget reports its natural height via pl-widget-resize
            // on its own window.load. But on first paint, that measurement
            // can be taken before dynamic SVG/canvas content has finished
            // laying out — leaving the iframe stuck at the initial
            // `iframeHeight` guess until the visitor resizes the window
            // (which retriggers the widget's resize handler).
            //
            // Kick the iframe's window.resize a couple of times after
            // load to force the widget to remeasure. Same-origin iframes
            // allow this without security errors.
            try {
              const w = ifrRef.current?.contentWindow
              if (!w) return
              const fire = () => { try { w.dispatchEvent(new Event("resize")) } catch {} }
              setTimeout(fire, 80)
              setTimeout(fire, 320)
              setTimeout(fire, 700)
            } catch { /* cross-origin guard */ }
          }}
        />
      </div>
    </div>
  )
}

function FadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      e => e.forEach(en => en.isIntersecting && setVisible(true)),
      { threshold: 0.18 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 1000ms cubic-bezier(0.16,1,0.3,1), transform 1000ms cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {children}
    </div>
  )
}
