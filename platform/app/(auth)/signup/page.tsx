"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/api/auth/confirm` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      // Email confirmation is off — session created immediately
      router.push("/dashboard")
      router.refresh()
    } else {
      // Email confirmation is on — ask user to check inbox
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 dot-grid">
        <div className="w-full max-w-[400px] text-center">
          <div className="w-14 h-14 rounded-full bg-[#0fee8918] border border-[#0fee8944] flex items-center justify-center mx-auto mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#0fee89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <h2 className="text-[22px] font-bold text-[#f0eeea] mb-2">Check your email</h2>
          <p className="text-[14px] text-[#7a7875]">
            We sent a confirmation link to <strong className="text-[#c8c6be]">{email}</strong>. Click it to activate your account.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 dot-grid">
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <Link href="/" className="flex justify-center mb-10 no-underline">
          <span style={{ fontFamily: "var(--font-geist-sans), sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.5px" }}>
            Parhay<span style={{ color: "#fff067" }}>likhay</span><span style={{ color: "#0fee89" }}>.</span>
          </span>
        </Link>

        <div className="rounded-xl border border-[#141e2a] bg-[#0b1118] p-8">
          <h1 className="text-[22px] font-bold text-[#f0eeea] mb-1 tracking-tight">Create your account</h1>
          <p className="text-[14px] text-[#7a7875] mb-7">Free to start. No credit card needed.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#c8c6be]">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-md border border-[#141e2a] bg-[#07090d] text-[#c8c6be] text-[14px] placeholder-[#3a4a5a] outline-none focus:border-[#00abfa] transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[13px] font-medium text-[#c8c6be]">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3.5 py-2.5 rounded-md border border-[#141e2a] bg-[#07090d] text-[#c8c6be] text-[14px] placeholder-[#3a4a5a] outline-none focus:border-[#00abfa] transition-colors"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#ff4670] bg-[#ff467012] border border-[#ff467033] rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-white text-black text-[14px] font-semibold rounded-md hover:opacity-85 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-[11px] text-[#3a4a5a] mt-4 text-center leading-relaxed">
            By signing up you agree to our terms and privacy policy.
          </p>
        </div>

        <p className="text-center text-[13px] text-[#7a7875] mt-5">
          Already have an account?{" "}
          <Link href="/login" className="text-[#00abfa] no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
