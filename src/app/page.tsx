import { HomeFeed, type GalleryVideo } from "@/components/home-feed"
import { createClient } from "@/lib/supabase/server"

async function loadedVideos(): Promise<GalleryVideo[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("videos")
      .select("youtube_id, title, author_name, thumbnail_url, cefr_level, category")
      .order("created_at", { ascending: false })
      .limit(48)
    return data ?? []
  } catch {
    return []
  }
}

export default async function Home() {
  const videos = await loadedVideos()
  return <HomeFeed videos={videos} />
}
