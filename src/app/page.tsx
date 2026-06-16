import { UrlInput } from "@/components/url-input"
import { LandingHeadline } from "@/components/landing-headline"
import { VideoGallery, type GalleryVideo } from "@/components/video-gallery"
import { createClient } from "@/lib/supabase/server"

async function loadedVideos(): Promise<GalleryVideo[]> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("videos")
      .select("youtube_id, title, author_name, thumbnail_url, cefr_level")
      .order("created_at", { ascending: false })
      .limit(48)
    return data ?? []
  } catch {
    return []
  }
}

export default async function Home() {
  const videos = await loadedVideos()

  return (
    <main className="flex-1 overflow-y-auto px-4">
      <div className="flex flex-col items-center gap-8 w-full pt-16 pb-10">
        <LandingHeadline />
        <UrlInput />
      </div>

      <VideoGallery videos={videos} />
    </main>
  )
}
