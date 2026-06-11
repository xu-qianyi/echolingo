"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { type Locale, translations } from "@/lib/i18n"
import { type CefrLevel } from "@/data/cefr-words"

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (typeof translations)[Locale]
  cefrLevel: CefrLevel
  setCefrLevel: (level: CefrLevel) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const LOCALE_KEY = "echolingo-locale"
const CEFR_KEY = "echolingo-cefr"
const VALID_CEFR: CefrLevel[] = ["a1", "a2", "b1", "b2", "c1"]

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh")
  const [cefrLevel, setCefrLevelState] = useState<CefrLevel>("b1")

  useEffect(() => {
    const storedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (storedLocale === "zh" || storedLocale === "en") setLocaleState(storedLocale)

    const storedCefr = localStorage.getItem(CEFR_KEY) as CefrLevel | null
    if (storedCefr && VALID_CEFR.includes(storedCefr)) setCefrLevelState(storedCefr)
  }, [])

  function setLocale(next: Locale) {
    setLocaleState(next)
    localStorage.setItem(LOCALE_KEY, next)
  }

  function setCefrLevel(next: CefrLevel) {
    setCefrLevelState(next)
    localStorage.setItem(CEFR_KEY, next)
  }

  return (
    <LanguageContext.Provider
      value={{ locale, setLocale, t: translations[locale], cefrLevel, setCefrLevel }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider")
  return ctx
}
