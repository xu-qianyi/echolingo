"use client"

import { useEffect, useRef, useState } from "react"
import type { WordDefinition } from "@/app/api/definition/[word]/route"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

interface Props {
  word: string
  anchorRect: DOMRect
  onClose: () => void
}

type State =
  | { status: "loading" }
  | { status: "ok"; data: WordDefinition }
  | { status: "error"; code: string }

const clientCache = new Map<string, WordDefinition>()

export function WordPopup({ word, anchorRect, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { requireAuth } = useAuth()
  const [state, setState] = useState<State>({ status: "loading" })
  const [saved, setSaved] = useState(false)

  // Fetch definition
  useEffect(() => {
    const lower = word.toLowerCase()
    if (clientCache.has(lower)) {
      setState({ status: "ok", data: clientCache.get(lower)! })
      return
    }
    setState({ status: "loading" })
    fetch(`/api/definition/${encodeURIComponent(lower)}`)
      .then((r) => r.json())
      .then((data: WordDefinition & { error?: string }) => {
        if (data.error) {
          setState({ status: "error", code: data.error })
        } else {
          clientCache.set(lower, data)
          setState({ status: "ok", data })
        }
      })
      .catch(() => setState({ status: "error", code: "network" }))
  }, [word])

  // Close on outside click or Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onDown)
    }
  }, [onClose])

  // Position: below the word, nudge left if near right edge
  const style = (() => {
    const popupW = 280
    const gap = 8
    let left = anchorRect.left
    let top = anchorRect.bottom + gap + window.scrollY

    if (left + popupW > window.innerWidth - 16) {
      left = window.innerWidth - popupW - 16
    }
    // If too low, place above
    if (top + 180 > window.innerHeight + window.scrollY) {
      top = anchorRect.top - 180 + window.scrollY
    }
    return { top, left, width: popupW }
  })()

  return (
    <div
      ref={ref}
      style={style}
      className="fixed z-50 rounded-xl border border-stone-200 bg-white shadow-lg p-4 text-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="font-semibold text-stone-900 text-base">{word}</span>
          {state.status === "ok" && (
            <span className="ml-2 text-xs text-stone-400">{state.data.pos}</span>
          )}
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {state.status === "loading" && (
        <div className="flex items-center gap-2 text-stone-400 py-2">
          <Spinner />
          <span>加载中…</span>
        </div>
      )}

      {state.status === "error" && (
        <p className="text-stone-400 py-2">
          {state.code === "no_api_key"
            ? "请在 .env.local 中配置 GOOGLE_GENERATIVE_AI_API_KEY"
            : "释义加载失败，请重试"}
        </p>
      )}

      {state.status === "ok" && (
        <div className="space-y-2">
          <p className="text-stone-900 font-medium">{state.data.zh_definition}</p>
          <div className="space-y-0.5">
            <p className="text-stone-600 italic leading-snug">"{state.data.example}"</p>
            <p className="text-stone-400 text-xs leading-snug">{state.data.zh_example}</p>
          </div>
        </div>
      )}

      {/* Save button */}
      <button
        disabled={state.status !== "ok" || saved}
        onClick={() => {
          if (state.status !== "ok") return
          requireAuth(() => {
            // TODO Phase 5: insert into saved_items table
            setSaved(true)
          })
        }}
        className={cn(
          "mt-3 w-full h-8 rounded-md text-xs font-medium transition-colors",
          saved
            ? "bg-stone-100 text-stone-400 cursor-default"
            : state.status === "ok"
            ? "bg-stone-900 text-white hover:bg-stone-700"
            : "bg-stone-100 text-stone-400 cursor-not-allowed"
        )}
      >
        {saved ? "已保存 ✓" : "保存到笔记"}
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  )
}
