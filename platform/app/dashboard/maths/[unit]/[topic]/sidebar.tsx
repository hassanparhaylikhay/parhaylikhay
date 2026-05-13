"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { UNITS } from "../../data"

export default function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Parse /dashboard/maths/[unit]/[topic]/[part?]  OR  /dashboard/lesson-mode/[unit]/[topic]/[part]
  const segs = pathname.split("/").filter(Boolean)
  const anchorIdx = (() => {
    const m = segs.indexOf("maths"); if (m >= 0) return m
    const l = segs.indexOf("lesson-mode"); if (l >= 0) return l
    return -1
  })()
  const currentUnitSlug  = anchorIdx >= 0 ? segs[anchorIdx + 1] ?? null : null
  const currentTopicSlug = anchorIdx >= 0 ? segs[anchorIdx + 2] ?? null : null
  const currentPartSlug  = anchorIdx >= 0 ? segs[anchorIdx + 3] ?? null : null

  const content = (
    <nav className="py-4">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 px-4 py-2 mb-2 text-[12px] font-mono text-[#3a4a5a] hover:text-[#7a7875] transition-colors"
      >
        <svg width="12" height="12" fill="none" viewBox="0 0 16 16">
          <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Dashboard
      </Link>

      <div className="px-4 pt-2 pb-1">
        <p className="text-[10px] font-mono tracking-[2px] uppercase text-[#3a4a5a]">Cambridge 4024</p>
      </div>

      <div className="mt-2">
        {UNITS.map(unit => {
          const isCurrentUnit = unit.slug === currentUnitSlug

          if (!isCurrentUnit) {
            return (
              <Link
                key={unit.slug}
                href={`/dashboard/maths/${unit.slug}/${unit.topics[0].slug}`}
                className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#3a4a5a] hover:text-[#7a7875] hover:bg-[#0b1118] transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <span className="font-mono text-[10px] w-5 shrink-0">{unit.slug}</span>
                <span>{unit.title}</span>
              </Link>
            )
          }

          // Current unit — expand
          return (
            <div key={unit.slug} className="py-1">
              <div className="flex items-center gap-2 px-4 py-1.5">
                <span className="text-[10px] font-mono text-[#3a4a5a] w-5 shrink-0">{unit.slug}</span>
                <span className="text-[12px] font-semibold text-[#f0eeea]">{unit.title}</span>
              </div>

              <div className="ml-9 mr-3 mt-0.5 flex flex-col gap-0.5">
                {unit.topics.map(topic => {
                  const isCurrentTopic = topic.slug === currentTopicSlug

                  if (!isCurrentTopic) {
                    return (
                      <Link
                        key={topic.slug}
                        href={`/dashboard/maths/${unit.slug}/${topic.slug}`}
                        className="flex items-center gap-2 px-2 py-1.5 rounded text-[12px] text-[#7a7875] hover:text-[#c8c6be] hover:bg-[#0b1118] transition-colors"
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="font-mono text-[10px] shrink-0 w-6 opacity-60">{topic.code}</span>
                        <span className="leading-snug">{topic.title}</span>
                      </Link>
                    )
                  }

                  // Current topic
                  const topicRowActive = !currentPartSlug
                  const topicRowCls = topicRowActive
                    ? "text-[#00abfa] bg-[#00abfa12]"
                    : "text-[#f0eeea] hover:bg-[#0b1118]"

                  return (
                    <div key={topic.slug}>
                      <Link
                        href={`/dashboard/maths/${unit.slug}/${topic.slug}`}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-[12px] transition-colors ${topicRowCls}`}
                        onClick={() => setMobileOpen(false)}
                      >
                        <span className="font-mono text-[10px] shrink-0 w-6 opacity-60">{topic.code}</span>
                        <span className="leading-snug font-semibold">{topic.title}</span>
                      </Link>

                      {topic.parts && topic.parts.length > 0 && (
                        <div className="ml-7 mt-0.5 mb-1 flex flex-col gap-0.5 border-l border-[#141e2a] pl-2">
                          {topic.parts.map(part => {
                            const isActive = part.slug === currentPartSlug
                            const activeCls = isActive
                              ? (part.isReview ? "text-[#0fee89] bg-[#0fee8912]" : "text-[#00abfa] bg-[#00abfa12]")
                              : "text-[#7a7875] hover:text-[#c8c6be] hover:bg-[#0b1118]"
                            return (
                              <Link
                                key={part.slug}
                                href={`/dashboard/maths/${unit.slug}/${topic.slug}/${part.slug}`}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded text-[11.5px] transition-colors ${activeCls}`}
                                onClick={() => setMobileOpen(false)}
                              >
                                <span className="font-mono text-[9.5px] shrink-0 w-4 opacity-70">{part.label}</span>
                                <span className="leading-snug">{part.title}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </nav>
  )

  const inLessonMode = anchorIdx >= 0 && segs[anchorIdx] === "lesson-mode"
  const asideHeight = inLessonMode ? "h-[calc(100vh-44px)] top-11" : "h-[calc(100vh-56px)] top-14"

  return (
    <>
      <aside className={`hidden md:block w-64 shrink-0 border-r border-[#141e2a] sticky overflow-y-auto ${asideHeight}`}>
        {content}
      </aside>

      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="fixed bottom-5 right-5 z-50 w-11 h-11 rounded-full bg-[#0b1118] border border-[#141e2a] flex items-center justify-center shadow-lg"
          aria-label="Toggle course navigation"
        >
          {mobileOpen ? (
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path d="M4 4l8 8M12 4l-8 8" stroke="#c8c6be" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
              <path d="M2 4h12M2 8h8M2 12h10" stroke="#c8c6be" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </button>

        {mobileOpen && (
          <div className="fixed inset-0 z-40 flex">
            <div className="w-72 bg-[#07090d] border-r border-[#141e2a] overflow-y-auto">
              {content}
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}
