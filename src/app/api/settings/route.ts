import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const VALID_LEVEL = ["a1", "a2", "b1", "b2", "c1"]
const VALID_NATIVE = ["zh", "ko", "es", "fr"]

// GET → the logged-in user's saved settings, or { settings: null } when there's
// no session / no row yet. Anonymous callers get null (they rely on localStorage).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ settings: null })

  const { data } = await supabase
    .from("user_settings")
    .select("native_language, cefr_level")
    .eq("user_id", user.id)
    .maybeSingle()

  return NextResponse.json({ settings: data ?? null })
}

// PUT → upsert the logged-in user's settings. Used both to seed the row on first
// login (from their local choices) and to persist later changes.
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const level = body.cefr_level
  const native = body.native_language

  if (!VALID_LEVEL.includes(level) || !VALID_NATIVE.includes(native)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 })
  }

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: user.id,
      cefr_level: level,
      native_language: native,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
