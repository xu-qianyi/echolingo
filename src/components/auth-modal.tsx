"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"

export function AuthModal() {
  const { authModalOpen, hideAuthModal, signInWithGoogle, signInWithEmail } = useAuth()
  const [email, setEmail] = useState("")
  const [linkSent, setLinkSent] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (authModalOpen) {
      setEmail("")
      setLinkSent(false)
      setEmailError("")
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [authModalOpen])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") hideAuthModal()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [hideAuthModal])

  if (!authModalOpen) return null

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setEmailLoading(true)
    setEmailError("")
    const { error } = await signInWithEmail(email.trim(), window.location.pathname)
    setEmailLoading(false)
    if (error) setEmailError(error)
    else setLinkSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-stone-900/30 backdrop-blur-sm"
        onClick={hideAuthModal}
      />

      {/* Card */}
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
        {/* Close */}
        <button
          onClick={hideAuthModal}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-stone-900">登录 EchoLingo</h2>
          <p className="mt-1 text-sm text-stone-500">保存词汇和笔记需要登录</p>
        </div>

        {linkSent ? (
          <div>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-stone-100">
              <svg className="h-5 w-5 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-stone-700 font-medium">登录链接已发送</p>
            <p className="mt-1 text-sm text-stone-500">
              我们向 <span className="text-stone-700 font-medium">{email}</span> 发送了一封邮件，点击其中的链接即可完成登录。链接 1 小时内有效。
            </p>
            <p className="mt-3 text-xs text-stone-400">
              没收到？请检查垃圾邮件文件夹。
            </p>
            <button
              onClick={() => { setLinkSent(false); setEmailError("") }}
              className="mt-4 w-full text-xs text-stone-400 hover:text-stone-600 transition-colors"
            >
              换一个邮箱 / 重新发送
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Google OAuth */}
            <button
              onClick={() => signInWithGoogle(window.location.pathname)}
              className="flex items-center justify-center gap-3 w-full h-11 rounded-lg border border-stone-200 bg-white text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-200" />
              <span className="text-xs text-stone-400">或用邮箱</span>
              <div className="flex-1 h-px bg-stone-200" />
            </div>

            {/* Email magic link */}
            <form onSubmit={handleEmailSubmit} className="space-y-2">
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full h-11 rounded-lg border border-stone-200 px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
              />
              {emailError && (
                <p className="text-xs text-red-500">{emailError}</p>
              )}
              <button
                type="submit"
                disabled={emailLoading || !email.trim()}
                className={cn(
                  "w-full h-11 rounded-lg text-sm font-medium transition-colors",
                  email.trim() && !emailLoading
                    ? "bg-stone-900 text-white hover:bg-stone-700"
                    : "bg-stone-100 text-stone-400 cursor-not-allowed"
                )}
              >
                {emailLoading ? "发送中…" : "发送登录链接"}
              </button>
            </form>

            {/* Consent */}
            <p className="pt-1 text-center text-xs leading-relaxed text-stone-400">
              继续即表示你同意我们的{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                服务条款
              </Link>{" "}
              和{" "}
              <Link
                href="/privacy"
                target="_blank"
                className="text-stone-500 underline underline-offset-2 hover:text-stone-700"
              >
                隐私政策
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
