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
