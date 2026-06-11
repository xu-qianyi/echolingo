"use client"

import { type CefrLevel, shouldHighlight, tokenize } from "@/data/cefr-words"
import { cn } from "@/lib/utils"

interface Props {
  text: string
  startMs: number
  isActive: boolean
  userLevel: CefrLevel
  onSeek: (startMs: number) => void
  onWordClick: (word: string, rect: DOMRect) => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
  return `${m}:${String(sec).padStart(2, "0")}`
}

export function TranscriptSegment({ text, startMs, isActive, userLevel, onSeek, onWordClick }: Props) {
  const tokens = tokenize(text)

  return (
    <div
      onClick={() => onSeek(startMs)}
      className={cn(
        "group flex items-start gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer",
        isActive ? "bg-stone-100" : "hover:bg-stone-50"
      )}
    >
      {/* Timestamp — click to seek */}
      <button
        onClick={() => onSeek(startMs)}
        className="shrink-0 mt-0.5 text-[11px] text-stone-400 hover:text-stone-900 font-mono tabular-nums transition-colors"
      >
        {formatTime(startMs)}
      </button>

      {/* Text with per-word highlighting */}
      <p
        className={cn(
          "text-sm leading-relaxed",
          isActive ? "text-stone-900 font-medium" : "text-stone-500"
        )}
      >
        {tokens.map((token, i) => {
          const isWord = /^[a-zA-Z'-]+$/.test(token)
          if (!isWord) return <span key={i}>{token}</span>

          const highlight = shouldHighlight(token, userLevel)
          if (!highlight) return <span key={i}>{token}</span>

          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation()
                onWordClick(token, (e.currentTarget as HTMLElement).getBoundingClientRect())
              }}
              className="relative inline underline decoration-dotted decoration-stone-500 text-stone-900 hover:text-stone-700 hover:bg-stone-50 rounded px-0.5 transition-colors"
            >
              {token}
            </button>
          )
        })}
      </p>
    </div>
  )
}
