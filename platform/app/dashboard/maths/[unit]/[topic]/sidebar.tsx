"use client"

import Link from "next/link"
import { useState } from "react"
import { UNITS } from "../../data"

export default function Sidebar({
  currentUnitSlug,
  currentTopicSlug,
}: {
  currentUnitSlug: string
  currentTopicSlug: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
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
          return (
            <div key={unit.slug}>
              {isCurrentUnit ? (
                <div className="py-1">
                  <div className="flex items-center gap-2 px-4 py-1.5">
                    <span className="text-[10px] font-mono text-[#3a4a5a] w-5 shrink-0">{unit.slug}</span>
                    <span className="text-[12px] font-semibold text-[#f0eeea]">{unit.title}</span>
                  </div>
                  <div className="ml-9 mr-3 mt-0.5 flex flex-col gap-0.5">
                    {unit.topics.map(topic => {
                      const isActive = topic.slug === currentTopicSlug
                      return (
                        <Link
                          key={topic.slug}
                          href={`/dashboard/maths/${unit.slug}/${topic.slug}`}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded text-[12px] transition-colors ${
                            isActive
                              ? "text-[#00abfa] bg-[#00abfa12]"
                              : "text-[#7a7875] hover:text-[#c8c6be] hover:bg-[#0b1118]"
                          }`}
                        >
                          <span className="font-mono text-[10px] shrink-0 w-6 opacity-60">{topic.code}</span>
                          <span className="leading-snug">{topic.title}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <Link
                  href={`/dashboard/maths/${unit.slug}/${unit.topics[0].slug}`}
                  className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-[#3a4a5a] hover:text-[#7a7875] hover:bg-[#0b1118] transition-colors"
                >
                  <span className="font-mono text-[10px] w-5 shrink-0">{unit.slug}</span>
                  <span>{unit.title}</span>
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-[#141e2a] sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile: toggle button + collapsible drawer */}
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
              {sidebarContent}
            </div>
            <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
          </div>
        )}
      </div>
    </>
  )
}
