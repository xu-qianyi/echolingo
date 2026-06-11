"use client"

import { useEffect, useRef, useState } from "react"
import { locales } from "@/lib/i18n"
import { useLanguage } from "@/contexts/language-context"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = locales.find((l) => l.code === locale)!

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-md text-sm text-stone-600 hover:bg-stone-100 transition-colors"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg
          className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-36 rounded-lg border border-stone-200 bg-white shadow-sm py-1 z-50">
          {locales.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false) }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-stone-50 transition-colors",
                locale === l.code ? "text-stone-900 font-medium" : "text-stone-600"
              )}
            >
              <span>{l.flag}</span>
              <span>{l.label}</span>
              {locale === l.code && (
                <svg className="ml-auto w-3.5 h-3.5 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
