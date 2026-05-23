import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/try-signup
 *
 * Inserts the /try sales page form into the `try_signups` Supabase
 * table. The client-side form ALSO writes the payload to localStorage
 * so we never lose a signup if the API is unreachable — those
 * stranded entries can be harvested on the next deploy.
 */
type Payload = {
  name?: unknown
  role?: unknown
  email?: unknown
  whatsapp?: unknown
}

const ALLOWED_ROLES = new Set([
  "Student",
  "Parent",
  "Teacher",
  "School admin",
  "Tutor",
  "Other",
])

export async function POST(req: Request) {
  let body: Payload = {}
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const name     = String(body.name     ?? "").trim().slice(0, 80)
  const role     = String(body.role     ?? "").trim().slice(0, 40)
  const email    = String(body.email    ?? "").trim().slice(0, 120)
  const whatsapp = String(body.whatsapp ?? "").trim().slice(0, 40)

  if (!name || !role || !email || !whatsapp) {
    return NextResponse.json({ ok: false, error: "Missing required field" }, { status: 400 })
  }
  if (!ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 })
  }

  // Best-effort insert into Supabase. Errors are logged but the client
  // still sees a success response — the localStorage fallback covers
  // the rare case where Supabase is unreachable.
  try {
    const supabase = createAdminClient()
    const { error } = await supabase.from("try_signups").insert({
      name,
      role,
      email,
      whatsapp,
    })
    if (error) {
      console.error("[try-signup] insert failed:", error.message, JSON.stringify({ name, role, email, whatsapp }))
    } else {
      console.log("[try-signup] inserted:", JSON.stringify({ name, role, email }))
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error("[try-signup] supabase init failed:", msg, JSON.stringify({ name, role, email, whatsapp }))
  }

  return NextResponse.json({ ok: true })
}
