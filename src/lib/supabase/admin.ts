import { createClient } from "@supabase/supabase-js"

/**
 * Service-role Supabase client. SERVER-ONLY — never import this from a client
 * component or anything that ships to the browser; the key bypasses RLS.
 *
 * Used for trusted server work: caching videos/study_notes (whose RLS insert
 * policies require auth), daily quota tracking, and the admin dashboard.
 *
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset, so callers can fall
 * back to best-effort behaviour in environments where it isn't configured.
 */
export function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
