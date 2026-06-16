"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useLanguage } from "@/contexts/language-context"
import { thumbnailUrl } from "@/lib/youtube"

export interface GalleryVideo {
  youtube_id: string
  title: string | null
  author_name: string | null
  thumbnail_url: string | null
  cefr_level: string | null
}

const ORDER = ["a1", "a2", "b1", "b2", "c1"]

export function VideoGallery({ videos }: { videos: GalleryVideo[] }) {
  const { user, loading } = useAuth()
  const { cefrLevel } = useLanguage()
  // Filtering depends on auth + the localStorage level, so it must run on the
  // client after mount (avoids SSR/hydration mismatch from random ordering).
  const [shown, setShown] = useState<GalleryVideo[]>([])

  useEffect(() => {
    if (loading) return
    if (user) {
      // Logged in → only videos at the user's level and above (harder).
      const min = ORDER.indexOf(cefrLevel)
      setShown(
        videos.filter((v) => v.cefr_level && ORDER.indexOf(v.cefr_level) >= min)
      )
    } else {
      // Not logged in → a random selection.
      setShown([...videos].sort(() => Math.random() - 0.5))
    }
  }, [videos, user, loading, cefrLevel])

  if (shown.length === 0) return null

  return (
    <section className="max-w-5xl mx-auto w-full pb-16">
      <h2 className="text-sm font-semibold text-stone-700 mb-3">
        {user ? "适合你水平的视频" : "已加载的视频"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {shown.map((v) => (
          <Link key={v.youtube_id} href={`/watch/${v.youtube_id}`} className="group block">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.thumbnail_url || thumbnailUrl(v.youtube_id)}
                alt=""
                className="aspect-video w-full object-cover rounded-lg bg-stone-100 transition-transform group-hover:scale-[1.02]"
              />
              {v.cefr_level && (
                <span className="absolute top-1.5 left-1.5 rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800 backdrop-blur-sm">
                  {v.cefr_level}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-stone-800 line-clamp-2 group-hover:text-stone-900">
              {v.title || v.youtube_id}
            </p>
            {v.author_name && (
              <p className="mt-0.5 text-xs text-stone-500 truncate">{v.author_name}</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
