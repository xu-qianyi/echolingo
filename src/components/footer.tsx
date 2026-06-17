"use client"

import Link from "next/link"
import { useLanguage } from "@/contexts/language-context"

const REPO_URL = "https://github.com/xu-qianyi/echolingo"

export function Footer() {
  const { t } = useLanguage()

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
      </nav>
    </footer>
  )
}
