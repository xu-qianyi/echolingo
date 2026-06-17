import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"

export const DAILY_VIDEO_LIMIT = 3
const CID_COOKIE = "el_cid"

export interface QuotaResult {
  allowed: boolean
  remaining: number
  limit: number
}

/** Today's date as YYYY-MM-DD (UTC). */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Stable identifier for the current client: the auth user id when logged in,
 * otherwise a long-lived httpOnly cookie. The cookie is created on first use.
 */
async function getClientKey(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return `user:${user.id}`

  const store = await cookies()
  let cid = store.get(CID_COOKIE)?.value
  if (!cid) {
    cid = crypto.randomUUID()
    store.set(CID_COOKIE, cid, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    })
  }
  return `anon:${cid}`
}

/**
 * Consume one unit of the daily video-load quota for `youtubeId`. Call this
 * only when loading a brand-new (not-yet-cached) video; re-watching cached
 * videos should never reach here.
 *
 * Loading the same new video twice in one day (e.g. a retry) does not double
 * charge. If the service-role key is unavailable, quota can't be tracked and
 * the load is allowed (fail-open).
 */
export async function consumeQuotaForVideo(youtubeId: string): Promise<QuotaResult> {
  const admin = getAdminClient()
  if (!admin) return { allowed: true, remaining: DAILY_VIDEO_LIMIT, limit: DAILY_VIDEO_LIMIT }

  const clientKey = await getClientKey()

  // Atomic consume in a single DB call (row-locked) so concurrent loads can't
  // race past the limit. See consume_video_quota() in migration 002.
  const { data, error } = await admin.rpc("consume_video_quota", {
    p_client_key: clientKey,
    p_video_id: youtubeId,
    p_date: today(),
    p_limit: DAILY_VIDEO_LIMIT,
  })

  // Fail-open if the function is missing / errors, so a quota glitch never
  // blocks legitimate viewing.
  if (error || !data?.[0]) {
    return { allowed: true, remaining: DAILY_VIDEO_LIMIT, limit: DAILY_VIDEO_LIMIT }
  }

  const { allowed, remaining } = data[0] as { allowed: boolean; remaining: number }
  return { allowed, remaining, limit: DAILY_VIDEO_LIMIT }
}
