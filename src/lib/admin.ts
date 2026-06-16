import { createClient } from "@/lib/supabase/server"

/** Admin email allowlist from ADMIN_EMAILS (comma-separated), lowercased. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails().includes(email.toLowerCase())
}

/**
 * Returns the current user's email if they are a logged-in admin, else null.
 * Used to gate admin pages and API routes server-side.
 */
export async function getAdminUser(): Promise<{ email: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.email && isAdminEmail(user.email)) return { email: user.email }
  return null
}
