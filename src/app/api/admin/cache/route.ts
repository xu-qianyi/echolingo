import { NextResponse } from "next/server"
import { getAdminUser } from "@/lib/admin"
import { getAdminClient } from "@/lib/supabase/admin"

export interface CachedVideo {
  id: string
  youtube_id: string
  title: string | null
  author_name: string | null
  thumbnail_url: string | null
  cefr_level: string | null
  created_at: string
  notes: { cefr_level: string; term_count: number }[]
}

export interface AdminCacheData {
  videos: CachedVideo[]
  definitions: { word: string; pos: string | null; zh_definition: string | null; phonetic: string | null; created_at: string }[]
  translations: { text_hash: string; source_text: string; zh: string; created_at: string }[]
  counts: { videos: number; study_notes: number; definitions: number; translations: number }
  usageToday: { client_key: string; video_count: number }[]
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function GET() {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "no_service_role_key" }, { status: 503 })
  }

  const [videosRes, notesRes, defsRes, transRes, usageRes] = await Promise.all([
    admin.from("videos").select("id, youtube_id, title, author_name, thumbnail_url, cefr_level, created_at").order("created_at", { ascending: false }),
    admin.from("study_notes").select("video_id, cefr_level, content"),
    admin.from("definitions").select("word, pos, zh_definition, phonetic, created_at").order("created_at", { ascending: false }),
    admin.from("segment_translations").select("text_hash, source_text, zh, created_at").order("created_at", { ascending: false }),
    admin.from("daily_usage").select("client_key, video_count").eq("usage_date", today()),
  ])

  const notes = notesRes.data ?? []
  const notesByVideo = new Map<string, { cefr_level: string; term_count: number }[]>()
  for (const n of notes) {
    const terms = (n.content as { terms?: unknown[] })?.terms ?? []
    const list = notesByVideo.get(n.video_id) ?? []
    list.push({ cefr_level: n.cefr_level, term_count: Array.isArray(terms) ? terms.length : 0 })
    notesByVideo.set(n.video_id, list)
  }

  const videos: CachedVideo[] = (videosRes.data ?? []).map((v) => ({
    ...v,
    notes: notesByVideo.get(v.id) ?? [],
  }))

  const data: AdminCacheData = {
    videos,
    definitions: defsRes.data ?? [],
    translations: transRes.data ?? [],
    counts: {
      videos: videos.length,
      study_notes: notes.length,
      definitions: (defsRes.data ?? []).length,
      translations: (transRes.data ?? []).length,
    },
    usageToday: usageRes.data ?? [],
  }
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  if (!(await getAdminUser())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 })
  }
  const admin = getAdminClient()
  if (!admin) {
    return NextResponse.json({ error: "no_service_role_key" }, { status: 503 })
  }

  const url = new URL(req.url)
  const type = url.searchParams.get("type")
  const id = url.searchParams.get("id")
  const level = url.searchParams.get("level")
  if (!type || !id) {
    return NextResponse.json({ error: "missing_params" }, { status: 400 })
  }

  switch (type) {
    // Deletes the video and cascades its study_notes / saved_items.
    case "video":
      await admin.from("videos").delete().eq("id", id)
      break
    // Deletes one CEFR-level note for a video (id = video uuid).
    case "note":
      if (!level) return NextResponse.json({ error: "missing_level" }, { status: 400 })
      await admin.from("study_notes").delete().eq("video_id", id).eq("cefr_level", level)
      break
    case "definition":
      await admin.from("definitions").delete().eq("word", id)
      break
    case "translation":
      await admin.from("segment_translations").delete().eq("text_hash", id)
      break
    default:
      return NextResponse.json({ error: "unknown_type" }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
