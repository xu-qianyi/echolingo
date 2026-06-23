// One-time backfill of videos.category for rows created before the category
// feature. Run AFTER migration 006:  npx tsx scripts/backfill-categories.ts
import { readFileSync } from "node:fs"
import { YoutubeTranscript } from "youtube-transcript"
import { generateObject } from "ai"
import { z } from "zod"
import { runWithModelFallback } from "@/lib/ai-provider"
import { CATEGORIES } from "@/lib/categories"
import { createClient } from "@supabase/supabase-js"

// Load .env.local (tsx doesn't do this automatically).
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m && !(m[1] in process.env)) process.env[m[1]] = m[2]
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function main() {
  const { data: videos } = await sb
    .from("videos")
    .select("id, youtube_id, title, author_name, category")
  for (const v of videos ?? []) {
    if (v.category) {
      console.log(`${v.youtube_id}  已有 ${v.category}，跳过`)
      continue
    }
    try {
      const raw = await YoutubeTranscript.fetchTranscript(v.youtube_id)
      const text = raw
        .map((r) => r.text.replace(/\[.*?\]/g, "").trim())
        .filter(Boolean)
        .join(" ")
        .slice(0, 4000)
      const { object } = await runWithModelFallback(process.env.GOOGLE_GENERATIVE_AI_API_KEY!, "google", (model) =>
        generateObject({
          model,
          schema: z.object({ category: z.enum(CATEGORIES) }),
          prompt: `Pick the single best content topic for this YouTube video, for use as a homepage filter tag. Use 'other' only when none clearly applies.\n\nTitle: ${v.title ?? "(unknown)"}\nChannel: ${v.author_name ?? "(unknown)"}\n\nTranscript excerpt:\n${text}`,
        }),
      )
      await sb.from("videos").update({ category: object.category }).eq("id", v.id)
      console.log(`${v.youtube_id}  => ${object.category}`)
    } catch (e) {
      console.log(`${v.youtube_id}  失败: ${e}`)
    }
  }
}

main()
