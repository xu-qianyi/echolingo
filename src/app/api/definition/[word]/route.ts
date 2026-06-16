import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { createModel, getProviderFromHeader } from "@/lib/ai-provider"
import { z } from "zod"

export interface WordDefinition {
  word: string
  pos: string
  zh_definition: string
  example: string
  zh_example: string
}

// In-memory cache — resets on cold start, fine for MVP
const cache = new Map<string, WordDefinition>()

const POS_ABBR: Record<string, string> = {
  noun: "n.", verb: "v.", adjective: "adj.", adverb: "adv.",
  preposition: "prep.", conjunction: "conj.", pronoun: "pron.",
  interjection: "int.", exclamation: "int.",
}

interface FreeDictMeaning {
  partOfSpeech: string
  definitions: { definition: string; example?: string }[]
}

function parseFreeDictResponse(data: { meanings: FreeDictMeaning[] }[]): { pos: string; definition: string; example: string } | null {
  for (const entry of data) {
    for (const meaning of entry.meanings) {
      for (const def of meaning.definitions) {
        if (def.example) {
          return { pos: POS_ABBR[meaning.partOfSpeech] ?? meaning.partOfSpeech, definition: def.definition, example: def.example }
        }
      }
    }
  }
  const m = data[0]?.meanings[0]
  const d = m?.definitions[0]
  if (!d) return null
  return { pos: POS_ABBR[m.partOfSpeech] ?? m.partOfSpeech, definition: d.definition, example: "" }
}

// AI translates only — used when Free Dictionary API succeeds
const zhSchema = z.object({
  zh_definition: z.string().describe("concise Chinese definition, 2–8 characters, natural Chinese, no brackets"),
  zh_example: z.string().describe("accurate Chinese translation of the example sentence"),
})

// AI generates everything — fallback for phrases, rare words, API failures
const fullSchema = z.object({
  pos: z.string().describe("abbreviated part of speech: n. / v. / adj. / adv. / prep. / phr."),
  zh_definition: z.string().describe("concise Chinese definition, 2–8 characters, natural Chinese, no brackets"),
  example: z.string().describe("one natural English example sentence using this word"),
  zh_example: z.string().describe("accurate Chinese translation of the example sentence"),
})

interface Params {
  params: Promise<{ word: string }>
}

export async function GET(req: Request, { params }: Params) {
  const { word } = await params
  const lower = word.toLowerCase()

  if (cache.has(lower)) return NextResponse.json(cache.get(lower))

  const apiKey = req.headers.get("X-User-Api-Key") || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return NextResponse.json({ error: "no_api_key" }, { status: 503 })

  // ── Path A: Free Dictionary API + AI translation ─────────────────────────
  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(lower)}`)
    if (dictRes.ok) {
      const parsed = parseFreeDictResponse(await dictRes.json())
      if (parsed) {
        const exampleText = parsed.example || `Use "${lower}" in a sentence.`
        const { object } = await generateObject({
          model: createModel(apiKey, getProviderFromHeader(req)),
          maxRetries: 0,
          schema: zhSchema,
          prompt: `Translate to Chinese for an English learner.
Definition: "${parsed.definition}"
Example: "${exampleText}"
zh_definition: 2–8 chars, natural Chinese. zh_example: accurate translation.`,
        })
        const result: WordDefinition = { word: lower, pos: parsed.pos, example: parsed.example, ...object }
        cache.set(lower, result)
        return NextResponse.json(result)
      }
    }
  } catch { /* fall through to Path B */ }

  // ── Path B: Full AI generation (phrases, rare words, API failures) ────────
  try {
    const { object } = await generateObject({
      model: createModel(apiKey, getProviderFromHeader(req)),
      maxRetries: 0,
      schema: fullSchema,
      prompt: `You are a concise English-Chinese dictionary for Chinese learners.
Define "${lower}":
- pos: abbreviated (n. / v. / adj. / adv. / prep. / phr.)
- zh_definition: 2–8 characters, natural Chinese, no brackets
- example: one natural example sentence
- zh_example: accurate Chinese translation`,
    })
    const result: WordDefinition = { word: lower, ...object }
    cache.set(lower, result)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "ai_failed" }, { status: 500 })
  }
}
