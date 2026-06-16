interface FreeDictEntry {
  phonetic?: string
  phonetics?: { text?: string }[]
}

export function extractPhonetic(entries: FreeDictEntry[]): string | null {
  for (const entry of entries) {
    if (entry.phonetic) return entry.phonetic
    const withText = entry.phonetics?.find((p) => p.text)
    if (withText?.text) return withText.text
  }
  return null
}

// Free Dictionary API has no phrase entries — only worth calling for single words
export async function fetchPhonetic(word: string): Promise<string | null> {
  if (word.includes(" ")) return null
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`)
    if (!res.ok) return null
    return extractPhonetic(await res.json())
  } catch {
    return null
  }
}
