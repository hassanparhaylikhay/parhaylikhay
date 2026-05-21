import { NextResponse } from "next/server"

/**
 * POST /api/try-signup
 *
 * Stub endpoint for the /try sales page form. For now it accepts the
 * payload, logs it to the server console, and returns 200. When the
 * real onboarding flow (Supabase row + WhatsApp template + trial token)
 * is wired up, that work goes here.
 *
 * The client-side form ALSO writes the payload to localStorage so we
 * never lose a signup if the server is down — the next deploy can
 * harvest the queued entries.
 */
type Payload = {
  parent_name?: unknown
  child_name?: unknown
  school?: unknown
  email?: unknown
  whatsapp?: unknown
}

export async function POST(req: Request) {
  let body: Payload = {}
  try {
    body = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parent   = String(body.parent_name ?? "").trim().slice(0, 80)
  const child    = String(body.child_name  ?? "").trim().slice(0, 80)
  const school   = String(body.school      ?? "").trim().slice(0, 120)
  const email    = String(body.email       ?? "").trim().slice(0, 120)
  const whatsapp = String(body.whatsapp    ?? "").trim().slice(0, 40)

  if (!email || !whatsapp) {
    return NextResponse.json({ ok: false, error: "Missing email or WhatsApp" }, { status: 400 })
  }

  console.log("[try-signup]", JSON.stringify({
    parent, child, school, email, whatsapp,
    receivedAt: new Date().toISOString(),
  }))

  return NextResponse.json({ ok: true })
}
