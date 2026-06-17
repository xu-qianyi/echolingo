"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Check, Copy, X } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

const REPO_URL = "https://github.com/xu-qianyi/echolingo"
const FEEDBACK_EMAIL = "martta.xu@outlook.com"

export function Footer() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  const linkClass =
    "text-stone-500 underline-offset-2 hover:text-stone-700 hover:underline"

  return (
    <footer className="mt-auto max-w-5xl mx-auto w-full pt-10 pb-10">
      <nav className="flex items-center justify-center gap-2 text-xs text-stone-400">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
        >
          {t.footer.openSource}
        </a>
        <span aria-hidden>•</span>
        <Link href="/terms" className={linkClass}>
          {t.footer.terms}
        </Link>
        <span aria-hidden>•</span>
        <Link href="/privacy" className={linkClass}>
          {t.footer.privacy}
        </Link>
        <span aria-hidden>•</span>
        <button type="button" onClick={() => setOpen(true)} className={linkClass}>
          {t.footer.feedback}
        </button>
      </nav>

      {open && <FeedbackPopup onClose={() => setOpen(false)} />}
    </footer>
  )
}

function FeedbackPopup({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(FEEDBACK_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — the address is still visible to copy by hand */
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/20 px-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-sm rounded-2xl bg-white p-6 text-left shadow-xl ring-1 ring-stone-900/5"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-base font-semibold text-stone-900">{t.footer.feedbackTitle}</h2>

        <p className="mt-4 text-sm leading-relaxed text-stone-500">{t.footer.feedbackDesc}</p>
        <div className="mt-4 flex items-center gap-2">
          <a
            href={`mailto:${FEEDBACK_EMAIL}`}
            className="rounded-lg bg-stone-100 px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-200 transition-colors"
          >
            {FEEDBACK_EMAIL}
          </a>
          <button
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-stone-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? t.footer.copied : t.footer.copy}
          </button>
        </div>
      </div>
    </div>
  )
}
