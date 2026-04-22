import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen px-6 py-16 max-w-[1080px] mx-auto">
      <div className="mb-12">
        <p className="text-[11px] font-mono tracking-[2.5px] uppercase text-[#fff067] mb-3">Dashboard</p>
        <h1 className="text-[32px] font-bold text-[#f0eeea] tracking-tight">
          Welcome back{user.email ? `, ${user.email.split("@")[0]}` : ""}.
        </h1>
        <p className="text-[#7a7875] mt-2">Your courses and progress will appear here.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Maths — Full Course", unit: "9 units · 54 tools", color: "#00abfa", status: "Coming soon" },
          { title: "Physics — Full Course", unit: "Cambridge 5054", color: "#ff822c", status: "Coming soon" },
          { title: "Past Papers", unit: "2015–2025 · Worked solutions", color: "#0fee89", status: "Coming soon" },
        ].map(({ title, unit, color, status }) => (
          <div key={title} className="rounded-xl border border-[#141e2a] bg-[#0b1118] p-6 flex flex-col gap-3">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <h3 className="text-[16px] font-semibold text-[#f0eeea]">{title}</h3>
            <p className="text-[13px] text-[#7a7875]">{unit}</p>
            <span className="mt-auto inline-block text-[11px] font-mono text-[#3a4a5a] border border-[#141e2a] rounded px-2 py-1 self-start">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
