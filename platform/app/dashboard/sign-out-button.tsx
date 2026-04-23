"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="text-[12px] font-mono text-[#7a7875] hover:text-[#c8c6be] transition-colors"
    >
      Sign out
    </button>
  )
}
