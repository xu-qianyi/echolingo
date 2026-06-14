import { YoutubeTranscript } from "youtube-transcript"
import { NextResponse } from "next/server"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateObject } from "ai"
import { z } from "zod"

export interface VocabTerm {
  term: string
  definition_zh: string
  level: string
}

const schema = z.object({
  terms: z.array(z.object({
    term: z.string().describe("the exact word or phrase as it appears in the transcript, lowercase"),
    definition_zh: z.string().describe("concise Chinese definition, 4-12 characters"),
    level: z.enum(["a1", "a2", "b1", "b2", "c1"]).describe("CEFR difficulty level of this term"),
  })),
})

const cache = new Map<string, VocabTerm[]>()

const VALID_LEVELS = ["a1", "a2", "b1", "b2", "c1"]

interface Params {
  params: Promise<{ videoId: string }>
}

export async function GET(req: Request, { params }: Params) {
  const { videoId } = await params
  const url = new URL(req.url)
  const rawLevel = url.searchParams.get("level") ?? "b1"
  const level = VALID_LEVELS.includes(rawLevel) ? rawLevel : "b1"

  const cacheKey = `${videoId}:${level}`
  if (cache.has(cacheKey)) {
    return NextResponse.json({ terms: cache.get(cacheKey) })
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "no_api_key" }, { status: 503 })
  }

  try {
    const raw = await YoutubeTranscript.fetchTranscript(videoId)
    const fullText = raw
      .map((item) => item.text.replace(/\[.*?\]/g, "").trim())
      .filter(Boolean)
      .join(" ")

    const google = createGoogleGenerativeAI({ apiKey })
    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema,
      prompt: `You are an English teacher for Chinese learners at ${level.toUpperCase()} level.

Analyze this video transcript and pick 10–15 words and phrases most worth learning for a ${level.toUpperCase()} student.

Rules:
- Mix BOTH single words (at least 5) AND multi-word phrases (at least 4). Do not return only phrases.
- Single words: pick vocabulary that is useful but not too basic — words like "collagen", "inspire", "launch", "occasionally", "basically" are good candidates
- Multi-word phrases: collocations and chunks like "get out of", "take a break", "in advance"
- Each "term" must appear verbatim (case-insensitive) in the transcript
- definition_zh should be natural Chinese, not a dictionary gloss

Transcript:
${fullText.slice(0, 8000)}`,
    })

    cache.set(cacheKey, object.terms)
    return NextResponse.json({ terms: object.terms })
  } catch (err) {
    console.error("[vocab]", err)
    return NextResponse.json({ error: "ai_failed" }, { status: 500 })
  }
}
