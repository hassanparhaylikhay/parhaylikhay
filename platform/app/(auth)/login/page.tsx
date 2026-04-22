"use client"

import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
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
          <h1 className="text-[22px] font-bold text-[#f0eeea] mb-1 tracking-tight">Welcome back</h1>
          <p className="text-[14px] text-[#7a7875] mb-7">Sign in to your account</p>

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
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-[#c8c6be]">Password</label>
                <Link href="/forgot-password" className="text-[12px] text-[#7a7875] no-underline hover:text-[#00abfa] transition-colors">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
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
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[#7a7875] mt-5">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#00abfa] no-underline hover:underline">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}
