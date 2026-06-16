"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

interface AuthContextValue {
  user: User | null
  loading: boolean
  signInWithGoogle: (next?: string) => Promise<void>
  signInWithEmail: (email: string, next?: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** Call to require login before an action. Opens modal if not authed, returns true if already authed. */
  requireAuth: (onSuccess?: () => void) => boolean
  showAuthModal: () => void
  hideAuthModal: () => void
  authModalOpen: boolean
  pendingAction: (() => void) | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      if (session?.user && authModalOpen) {
        setAuthModalOpen(false)
        pendingAction?.()
        setPendingAction(null)
      }
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const signInWithGoogle = useCallback(async (next = "/") => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
  }, [])

  const signInWithEmail = useCallback(async (email: string, next = "/") => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
  }, [])

  const requireAuth = useCallback((onSuccess?: () => void): boolean => {
    if (user) {
      onSuccess?.()
      return true
    }
    setPendingAction(onSuccess ? () => onSuccess : null)
    setAuthModalOpen(true)
    return false
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, loading,
      signInWithGoogle, signInWithEmail, signOut,
      requireAuth,
      showAuthModal: () => setAuthModalOpen(true),
      hideAuthModal: () => { setAuthModalOpen(false); setPendingAction(null) },
      authModalOpen,
      pendingAction,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
  return ctx
}
