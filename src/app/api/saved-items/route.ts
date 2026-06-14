import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export interface SavedItem {
  id: string
  content: string
  type: string
  zh_definition: string | null
  example: string | null
  zh_example: string | null
  created_at: string
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const youtubeId = new URL(req.url).searchParams.get("youtubeId")
  if (!youtubeId) return NextResponse.json({ error: "missing youtubeId" }, { status: 400 })

  const { data: video } = await supabase
    .from("videos")
    .select("id")
    .eq("youtube_id", youtubeId)
    .single()

  if (!video) return NextResponse.json({ items: [] })

  const { data: items, error } = await supabase
    .from("saved_items")
    .select("id, content, type, zh_definition, example, zh_example, created_at")
    .eq("video_id", video.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: items ?? [] })
}

interface SaveBody {
  youtubeId: string
  content: string
  type: "word" | "phrase"
  zh_definition?: string
  example?: string
  zh_example?: string
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 })

  const body: SaveBody = await req.json()
  const { youtubeId, content, type, zh_definition, example, zh_example } = body
  if (!youtubeId || !content) return NextResponse.json({ error: "missing fields" }, { status: 400 })

  // Video row is inserted proactively by the transcript route; fall back to upsert here just in case
  let { data: video } = await supabase
    .from("videos")
    .select("id")
    .eq("youtube_id", youtubeId)
    .single()

  if (!video) {
    const { data: inserted, error: insertErr } = await supabase
      .from("videos")
      .upsert({ youtube_id: youtubeId }, { onConflict: "youtube_id" })
      .select("id")
      .single()
    if (insertErr || !inserted) {
      return NextResponse.json({ error: "video not found", detail: insertErr?.message }, { status: 500 })
    }
    video = inserted
  }

  const { data: item, error } = await supabase
    .from("saved_items")
    .insert({
      user_id: user.id,
      video_id: video.id,
      type,
      content,
      zh_definition: zh_definition ?? null,
      example: example ?? null,
      zh_example: zh_example ?? null,
    })
    .select("id, content, type, zh_definition, example, zh_example, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item })
}
