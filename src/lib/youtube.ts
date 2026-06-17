export interface VideoMeta {
  title: string | null
  author_name: string | null
  thumbnail_url: string
}

/** Static thumbnail URL — always available, no API key or network call needed. */
export function thumbnailUrl(youtubeId: string): string {
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
}

/**
 * Fetch a video's title + thumbnail via YouTube's public oEmbed endpoint.
 * No API key required. Falls back to a null title + static thumbnail on any
 * failure, so callers always get a usable result.
 */
export async function fetchVideoMeta(youtubeId: string): Promise<VideoMeta> {
  const fallback: VideoMeta = { title: null, author_name: null, thumbnail_url: thumbnailUrl(youtubeId) }
  try {
    const target = `https://www.youtube.com/watch?v=${youtubeId}`
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(target)}&format=json`,
      { cache: "no-store" }
    )
    if (!res.ok) return fallback
    const data = (await res.json()) as { title?: string; author_name?: string; thumbnail_url?: string }
    return {
      title: data.title ?? null,
      author_name: data.author_name ?? null,
      thumbnail_url: data.thumbnail_url || fallback.thumbnail_url,
    }
  } catch {
    return fallback
  }
}

export function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url.trim())
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1) || null
    }
    if (parsed.hostname.includes("youtube.com")) {
      return parsed.searchParams.get("v")
    }
  } catch {
    // bare video ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim()
  }
  return null
}
