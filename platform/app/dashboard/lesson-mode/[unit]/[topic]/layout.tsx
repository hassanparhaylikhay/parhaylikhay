import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UNITS } from "../../../maths/data"
import Sidebar from "../../../maths/[unit]/[topic]/sidebar"

/**
 * Lesson Mode layout — covers an entire topic (e.g. 7.1 Transformations)
 * as one continuous lesson. A subunit, not a single part.
 *
 * Chrome: slim brand strip on top, sidebar on the left, full-bleed slide
 * canvas everywhere else.
 */
export default async function LessonModeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ unit: string; topic: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { unit: unitSlug, topic: topicSlug } = await params
  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()
  const topic = unit.topics.find(t => t.slug === topicSlug)
  if (!topic) notFound()

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090d] flex flex-col">
      <header className="h-11 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#0f161f]">
        <a href="/dashboard" className="flex items-center" aria-label="Parhaylikhay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/PL-LOGO.png" alt="Parhaylikhay" style={{ height: 22 }} />
        </a>
        <p className="hidden sm:block text-[10.5px] font-mono uppercase tracking-[2px] text-[#3a4a5a]">
          Lesson Mode · {topic.code} {topic.title}
        </p>
        <span className="hidden sm:block text-[11px] font-mono text-[#3a4a5a] truncate max-w-[180px]">
          {user.email}
        </span>
      </header>
      <div className="flex-1 min-h-0 flex">
        <Sidebar />
        <main className="flex-1 min-w-0 h-full overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
