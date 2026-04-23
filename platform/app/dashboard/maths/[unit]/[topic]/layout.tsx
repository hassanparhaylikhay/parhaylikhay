import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UNITS } from "../../data"
import Sidebar from "./sidebar"
import SignOutButton from "../../../sign-out-button"

export default async function LessonLayout({
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
  if (!unit.topics.find(t => t.slug === topicSlug)) notFound()

  return (
    <div className="min-h-screen bg-[#07090d]">

      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#141e2a] bg-[#07090d]/90 backdrop-blur-md">
        <div className="px-6 h-14 flex items-center justify-between">
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

      {/* Sidebar + content */}
      <div className="flex">
        <Sidebar currentUnitSlug={unitSlug} currentTopicSlug={topicSlug} />
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>

    </div>
  )
}
