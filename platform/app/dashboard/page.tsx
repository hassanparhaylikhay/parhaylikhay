import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UNITS } from "./maths/data"
import SignOutButton from "./sign-out-button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const name = user.email?.split("@")[0] ?? "there"

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

      {/* Main */}
      <main className="max-w-[1080px] mx-auto px-6 py-14">

        {/* Header */}
        <div className="mb-12">
          <p className="text-[11px] font-mono tracking-[2.5px] uppercase text-[#fff067] mb-3">My learning</p>
          <h1 className="text-[28px] font-bold text-[#f0eeea] tracking-tight">
            Welcome back, {name}.
          </h1>
          <p className="text-[14px] text-[#7a7875] mt-1.5">Pick up where you left off.</p>
        </div>

        {/* Maths course */}
        <section className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00abfa]" />
            <h2 className="text-[14px] font-semibold text-[#f0eeea]">Cambridge 4024 Mathematics</h2>
            <span className="text-[10px] font-mono text-[#3a4a5a] border border-[#141e2a] rounded px-2 py-0.5 tracking-wider">O-LEVEL</span>
          </div>

          <div className="rounded-xl border border-[#141e2a] overflow-hidden">
            {UNITS.map((unit, i) => (
              <Link
                key={unit.slug}
                href={`/dashboard/maths/${unit.slug}`}
                className={`flex items-start gap-5 px-6 py-5 hover:bg-[#0b1118] transition-colors group${i < UNITS.length - 1 ? " border-b border-[#141e2a]" : ""}`}
              >
                <span className="text-[12px] font-mono text-[#3a4a5a] pt-0.5 w-5 shrink-0">{unit.slug}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-1.5">
                    <h3 className="text-[15px] font-semibold text-[#f0eeea]">{unit.title}</h3>
                    <span className="text-[11px] font-mono text-[#3a4a5a] shrink-0">{unit.topics.length} topics</span>
                  </div>
                  <p className="text-[13px] text-[#7a7875] leading-relaxed">
                    {unit.topics.map(t => t.title).join(" · ")}
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-[#3a4a5a] group-hover:text-[#00abfa] transition-colors mt-0.5 shrink-0"
                  fill="none" viewBox="0 0 16 16"
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ))}
          </div>
        </section>

        {/* Coming soon */}
        <section>
          <p className="text-[11px] font-mono tracking-[2.5px] uppercase text-[#3a4a5a] mb-5">Coming soon</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "Physics", sub: "Cambridge 5054 O-Level", color: "#ff822c" },
              { title: "Past Papers", sub: "2015–2025 · Worked solutions", color: "#0fee89" },
            ].map(({ title, sub, color }) => (
              <div
                key={title}
                className="rounded-xl border border-[#141e2a] bg-[#0b1118] px-6 py-5 flex items-center gap-4 opacity-40 select-none"
              >
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <div>
                  <p className="text-[14px] font-semibold text-[#f0eeea]">{title}</p>
                  <p className="text-[12px] text-[#7a7875] mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  )
}
