import type { VocabTerm } from "@/app/api/vocab/[videoId]/route"
import { tokenize, shouldHighlight, getWordLevel, type CefrLevel } from "@/data/cefr-words"

export type VocabToken =
  | { type: "text"; text: string }
  | { type: "vocab"; text: string; term: VocabTerm }

export function tokenizeWithVocab(
  text: string,
  vocab: VocabTerm[],
  cefrFallback?: CefrLevel,
): VocabToken[] {
  // No AI vocab yet — fall back to static CEFR list so highlighting is visible immediately
  if (!vocab.length && cefrFallback) {
    return tokenize(text).map((token) => {
      if (/^[a-zA-Z'-]+$/.test(token) && shouldHighlight(token, cefrFallback)) {
        return {
          type: "vocab" as const,
          text: token,
          term: { term: token, definition_zh: "", level: getWordLevel(token) ?? cefrFallback, pos: "", example: "", zh_example: "" },
        }
      }
      return { type: "text" as const, text: token }
    })
  }

  if (!vocab.length) return [{ type: "text", text }]

  type Match = { start: number; end: number; term: VocabTerm }
  const matches: Match[] = []
  const lower = text.toLowerCase()

  for (const term of vocab) {
    const tLower = term.term.toLowerCase()
    let idx = 0
    while ((idx = lower.indexOf(tLower, idx)) !== -1) {
      const before = idx === 0 || /\W/.test(text[idx - 1])
      const after = idx + tLower.length >= text.length || /\W/.test(text[idx + tLower.length])
      if (before && after) {
        matches.push({ start: idx, end: idx + tLower.length, term })
      }
      idx += 1
    }
  }

  // Sort by start position; prefer longer matches at the same position
  matches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start))

  // Greedy: drop overlapping matches
  const kept: Match[] = []
  let cursor = 0
  for (const m of matches) {
    if (m.start >= cursor) {
      kept.push(m)
      cursor = m.end
    }
  }

  const tokens: VocabToken[] = []
  let pos = 0
  for (const m of kept) {
    if (m.start > pos) tokens.push({ type: "text", text: text.slice(pos, m.start) })
    tokens.push({ type: "vocab", text: text.slice(m.start, m.end), term: m.term })
    pos = m.end
  }
  if (pos < text.length) tokens.push({ type: "text", text: text.slice(pos) })

  return tokens
}
