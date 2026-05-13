import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UNITS } from "../../../../maths/data"
import Sidebar from "../../../../maths/[unit]/[topic]/sidebar"

/**
 * Lesson Mode layout.
 *
 * Same chrome as the revision-notes layout (sidebar on the left, auth gate)
 * but the main content area is full-bleed: no max-width, no breadcrumb,
 * no top nav. The slide canvas claims every pixel that isn't sidebar.
 */
export default async function LessonModeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ unit: string; topic: string; part: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { unit: unitSlug, topic: topicSlug, part: partSlug } = await params
  const unit = UNITS.find(u => u.slug === unitSlug)
  if (!unit) notFound()
  const topic = unit.topics.find(t => t.slug === topicSlug)
  if (!topic) notFound()
  if (topic.parts && !topic.parts.find(p => p.slug === partSlug)) notFound()

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#07090d] flex flex-col">
      {/* Slim brand strip — keeps the platform identity without crowding the canvas. */}
      <header className="h-11 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b border-[#0f161f]">
        <a href="/dashboard" className="flex items-center" aria-label="Parhaylikhay">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/PL-LOGO.png" alt="Parhaylikhay" style={{ height: 22 }} />
        </a>
        <p className="hidden sm:block text-[10.5px] font-mono uppercase tracking-[2px] text-[#3a4a5a]">
          Lesson Mode
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
