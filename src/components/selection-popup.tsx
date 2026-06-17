"use client"

import { useEffect, useRef } from "react"
import { Languages } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface Props {
  text: string
  anchorRect: DOMRect
  onClose: () => void
  onTranslate: (text: string) => void
}

export function SelectionPopup({ text, anchorRect, onClose, onTranslate }: Props) {
  const { t } = useLanguage()
  const ref = useRef<HTMLDivElement>(null)

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

  const gap = 6
  const bottomFromViewport = window.innerHeight - anchorRect.top + gap
  const left = anchorRect.left + anchorRect.width / 2

  return (
    <div
      ref={ref}
      style={{ bottom: bottomFromViewport, left, transform: "translateX(-50%)" }}
      className="fixed z-50 rounded-xl border border-stone-200 bg-white shadow-lg overflow-hidden"
    >
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => { onTranslate(text); onClose() }}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap"
      >
        <Languages className="w-3.5 h-3.5 shrink-0" />
        {t.watch.aiTranslate}
      </button>
    </div>
  )
}
