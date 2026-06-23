"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { extractVideoId, thumbnailUrl } from "@/lib/youtube"
import { CATEGORIES, type Category, isCategory } from "@/lib/categories"
import { cn } from "@/lib/utils"

export interface GalleryVideo {
  youtube_id: string
  title: string | null
  author_name: string | null
  thumbnail_url: string | null
  cefr_level: string | null
  category: string | null
}

const ORDER = ["a1", "a2", "b1", "b2", "c1"]

export function HomeFeed({ videos }: { videos: GalleryVideo[] }) {
  const { cefrLevel, hydrated, t } = useLanguage()
  const [active, setActive] = useState<Category | "all">("all")

  // Show every video on first paint (server + first client render agree, so the
  // grid fills the screen immediately). Once hydrated we know the learner's
  // level and narrow to videos at their level and above.
  const shown = useMemo(() => {
    if (!hydrated) return videos
    const min = ORDER.indexOf(cefrLevel)
    return videos.filter((v) => v.cefr_level && ORDER.indexOf(v.cefr_level) >= min)
  }, [videos, hydrated, cefrLevel])

  // Only surface tabs for topics that actually have videos at this level,
  // in the canonical taxonomy order.
  const tabs = useMemo(() => {
    const present = new Set(shown.map((v) => v.category).filter(isCategory))
    return CATEGORIES.filter((c) => present.has(c))
  }, [shown])

  // If a level change drops the active tab's videos, fall back to All for this
  // render (derived, so no effect/extra render needed).
  const effective = active !== "all" && tabs.includes(active) ? active : "all"
  const filtered = effective === "all" ? shown : shown.filter((v) => v.category === effective)

  return (
    <main className="relative flex-1 overflow-y-auto">
      {/* Sticky topic filter bar */}
      <div className="sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-x-auto px-6 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill label={t.gallery.all} active={effective === "all"} onClick={() => setActive("all")} />
          {tabs.map((c) => (
            <Pill
              key={c}
              label={t.gallery.categories[c]}
              active={effective === c}
              onClick={() => setActive(c)}
            />
          ))}
        </div>
      </div>

      {/* Video grid — full width, larger cards */}
      <div className="grid grid-cols-1 gap-x-5 gap-y-9 px-6 pb-44 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((v) => (
          <Link key={v.youtube_id} href={`/watch/${v.youtube_id}`} className="group block">
            <div className="relative overflow-hidden rounded-xl bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.thumbnail_url || thumbnailUrl(v.youtube_id)}
                alt=""
                className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              {v.cefr_level && (
                <span className="absolute left-2 top-2 rounded bg-white/85 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-800 backdrop-blur-sm">
                  {v.cefr_level}
                </span>
              )}
            </div>
            <p className="mt-2.5 line-clamp-2 text-[15px] font-medium leading-snug text-stone-800 group-hover:text-stone-950">
              {v.title || v.youtube_id}
            </p>
            {v.author_name && (
              <p className="mt-1 truncate text-[13px] text-stone-500">{v.author_name}</p>
            )}
          </Link>
        ))}
      </div>

      <PasteBar />
    </main>
  )
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
        active
          ? "bg-stone-900 text-white"
          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      )}
    >
      {label}
    </button>
  )
}

const OUTER = { tl: "#d6d3d1", tr: "#a8a29e", br: "#78716c", bl: "#c4bfbb" }
const MAIN = { tl: "#e7e5e4", tr: "#d6d3d1", br: "#a8a29e", bl: "#dbd8d5" }
const conic = (c: typeof OUTER) =>
  `conic-gradient(from 0deg at 50% 50%, ${c.tl} 0deg, ${c.tr} 90deg, ${c.br} 180deg, ${c.bl} 270deg, ${c.tl} 360deg)`

// Floating paste bar pinned to the bottom of the viewport. A gradient fades the
// background up so the grid scrolls underneath it.
function PasteBar() {
  const router = useRouter()
  const { t } = useLanguage()
  const [value, setValue] = useState("")
  const [error, setError] = useState("")

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    setError("")
    const videoId = extractVideoId(value)
    if (!videoId) { setError(t.landing.invalidUrl); return }
    router.push(`/watch/${videoId}`)
  }

  const canSubmit = value.trim().length > 0

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent px-4 pb-6 pt-20">
      <div className="pointer-events-auto w-full max-w-xl">
        <div className="relative">
          {/* Outer thin border */}
          <div className="absolute inset-0 rounded-[20px] p-px" style={{ background: conic(OUTER) }}>
            {/* Main thick border */}
            <div className="h-full w-full rounded-[19px] p-0.5" style={{ background: conic(MAIN) }}>
              <div className="h-full w-full rounded-[17px] bg-white/95 backdrop-blur-sm" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center gap-3 px-4 py-3">
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError("") }}
              placeholder={t.landing.placeholder}
              className="flex-1 bg-transparent py-1 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all duration-150",
                canSubmit ? "bg-stone-900 text-white hover:bg-stone-700" : "text-stone-300 cursor-not-allowed"
              )}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* Drop shadow */}
          <div
            className="pointer-events-none absolute -bottom-3 left-4 right-4 h-6 rounded-full blur-md"
            style={{ background: "linear-gradient(to bottom, rgba(28,25,23,0.07) 0%, transparent 100%)" }}
          />
        </div>

        {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}
