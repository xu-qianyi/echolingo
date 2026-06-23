// The fixed content-topic taxonomy for videos. A single category is assigned
// once per video — by the AI pass in the vocab route on ingest, and by
// scripts/backfill-categories.ts for rows created before this field existed.
// Keep this list in sync with the `category` enum in the vocab route schema
// and the labels in src/lib/i18n.ts (gallery.categories).
export const CATEGORIES = [
  "education",
  "tech",
  "science",
  "business",
  "news",
  "vlog",
  "lifestyle",
  "food",
  "travel",
  "entertainment",
  "music",
  "sports",
  "kids",
  "other",
] as const

export type Category = (typeof CATEGORIES)[number]

export function isCategory(value: string | null | undefined): value is Category {
  return !!value && (CATEGORIES as readonly string[]).includes(value)
}
