"use client"

import { useLanguage } from "@/contexts/language-context"

export function LandingHeadline() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
        {t.landing.title}
      </h1>
      <p className="text-stone-500 text-sm">{t.landing.subtitle}</p>
    </div>
  )
}
