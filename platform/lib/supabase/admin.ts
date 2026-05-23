import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. Bypasses Row Level Security; only use
 * from server-side code (API routes / server actions / server components).
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY from the environment. This key MUST
 * NEVER be exposed to the client — it is unprefixed (no NEXT_PUBLIC_)
 * so Next.js won't bundle it into client code.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars."
    )
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
