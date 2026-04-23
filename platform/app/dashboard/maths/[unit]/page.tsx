import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { UNITS } from "../data"
import SignOutButton from "../../sign-out-button"

export default async function UnitPage({
  params,
}: {
  params: Promise<{ unit: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { unit: unitSlug } = await params
  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()

  const unitIndex = UNITS.indexOf(unit)
  const prevUnit = unitIndex > 0 ? UNITS[unitIndex - 1] : null
  const nextUnit = unitIndex < UNITS.length - 1 ? UNITS[unitIndex + 1] : null

  return (
    <div className="min-h-screen bg-[#07090d]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#141e2a] bg-[#07090d]/90 backdrop-blur-md">
        <div className="max-w-[1080px] mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/PL-LOGO.png" alt="Parhaylikhay" style={{ height: 26 }} />
          </a>
          <div className="flex items-center gap-5">
            <span className="hidden sm:block text-[12px] font-mono text-[#3a4a5a]">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <main className="max-w-[1080px] mx-auto px-6 py-12">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] font-mono text-[#3a4a5a] mb-10">
          <Link href="/dashboard" className="hover:text-[#7a7875] transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-[#7a7875]">{unit.title}</span>
        </div>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[11px] font-mono tracking-[2.5px] uppercase mb-3" style={{ color: unit.color }}>
            Unit {unit.slug}
          </p>
          <h1 className="text-[28px] font-bold text-[#f0eeea] tracking-tight">{unit.title}</h1>
          <p className="text-[14px] text-[#7a7875] mt-1.5">{unit.topics.length} topics · Cambridge 4024</p>
        </div>

        {/* Topic list */}
        <div className="rounded-xl border border-[#141e2a] overflow-hidden mb-12">
          {unit.topics.map((topic, i) => (
            <Link
              key={topic.slug}
              href={`/dashboard/maths/${unit.slug}/${topic.slug}`}
              className={`flex items-center gap-5 px-6 py-4 hover:bg-[#0b1118] transition-colors group${i < unit.topics.length - 1 ? " border-b border-[#141e2a]" : ""}`}
            >
              <span className="text-[12px] font-mono text-[#3a4a5a] w-8 shrink-0">{topic.code}</span>
              <span className="text-[15px] text-[#f0eeea] font-medium flex-1">{topic.title}</span>
              <svg className="w-4 h-4 text-[#3a4a5a] group-hover:text-[#00abfa] transition-colors shrink-0" fill="none" viewBox="0 0 16 16">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ))}
        </div>

        {/* Unit prev/next */}
        <div className="flex justify-between items-center">
          {prevUnit ? (
            <Link href={`/dashboard/maths/${prevUnit.slug}`} className="flex items-center gap-2.5 text-[13px] text-[#7a7875] hover:text-[#c8c6be] transition-colors group">
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="shrink-0">
                <path d="M13 8H3M7 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{prevUnit.title}</span>
            </Link>
          ) : <div />}
          {nextUnit ? (
            <Link href={`/dashboard/maths/${nextUnit.slug}`} className="flex items-center gap-2.5 text-[13px] text-[#7a7875] hover:text-[#c8c6be] transition-colors group">
              <span>{nextUnit.title}</span>
              <svg width="14" height="14" fill="none" viewBox="0 0 16 16" className="shrink-0">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          ) : <div />}
        </div>

      </main>
    </div>
  )
}
