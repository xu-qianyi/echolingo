"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send } from "lucide-react"
import { extractVideoId } from "@/lib/youtube"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

const OUTER = { tl: "#d6d3d1", tr: "#a8a29e", br: "#78716c", bl: "#c4bfbb" }
const MAIN  = { tl: "#e7e5e4", tr: "#d6d3d1", br: "#a8a29e", bl: "#dbd8d5" }

function conic(c: typeof OUTER) {
  return `conic-gradient(from 0deg at 50% 50%, ${c.tl} 0deg, ${c.tr} 90deg, ${c.br} 180deg, ${c.bl} 270deg, ${c.tl} 360deg)`
}


export function UrlInput() {
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
    <div className="w-full max-w-xl">
      <div className="relative">
        {/* Outer thin border */}
        <div className="absolute inset-0 rounded-[20px] p-px" style={{ background: conic(OUTER) }}>
          {/* Main thick border */}
          <div className="h-full w-full rounded-[19px] p-0.5" style={{ background: conic(MAIN) }}>
            <div className="h-full w-full rounded-[17px] bg-white" />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative px-4 pt-4 pb-3">
          {/* Row 1: input + send */}
          <div className="flex items-center gap-3 mb-3">
            <input
              type="text"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError("") }}
              placeholder={t.landing.placeholder}
              autoFocus
              className="flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none py-1"
            />
            <button
              type="submit"
              disabled={!canSubmit}
              className={cn(
                "flex items-center justify-center w-7 h-7 rounded-full transition-all duration-150 shrink-0",
                canSubmit ? "bg-stone-900 text-white hover:bg-stone-700" : "text-stone-300 cursor-not-allowed"
              )}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Row 2: hint (text removed, height preserved) */}
          <p className="text-xs text-stone-400" aria-hidden>&nbsp;</p>
        </form>

        {/* Drop shadow */}
        <div
          className="absolute -bottom-3 left-4 right-4 h-6 rounded-full blur-md pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(28,25,23,0.07) 0%, transparent 100%)" }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-red-500 text-center">{error}</p>}
    </div>
  )
}
