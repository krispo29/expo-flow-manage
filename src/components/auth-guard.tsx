'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2 } from 'lucide-react'
import { clearClientAuthState } from '@/lib/client-auth'
import { isSessionExpired } from '@/lib/auth-session'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user, isHydrated, expiresAt } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Wait for hydration to finish
    if (!isHydrated || !mounted) return

    if (isSessionExpired(expiresAt)) {
      clearClientAuthState()
      router.push('/login')
      return
    }

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/login')
    }
  }, [expiresAt, isAuthenticated, user, router, isHydrated, mounted])

  useEffect(() => {
    if (!isHydrated || !mounted || !expiresAt) return

    const remainingMs = expiresAt - Date.now()
    if (remainingMs <= 0) {
      clearClientAuthState()
      router.push('/login')
      return
    }

    const timeout = window.setTimeout(() => {
      clearClientAuthState()
      router.push('/login')
    }, remainingMs)

    return () => window.clearTimeout(timeout)
  }, [expiresAt, isHydrated, mounted, router])

  const isLoading = !mounted || !isHydrated || !isAuthenticated || !user

  return (
    <>
      {isLoading && (
        <div className="flex h-screen w-full items-center justify-center fixed inset-0 z-50 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div style={{ display: isLoading ? 'none' : 'contents' }}>
        {children}
      </div>
    </>
  )
}
