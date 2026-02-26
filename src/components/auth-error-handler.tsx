'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * Client-side component that listens for auth expiration events.
 * When a server action detects an expired token, it returns a special flag.
 * This component should be placed in the admin layout to handle redirects.
 */
export function AuthErrorHandler() {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    const handleAuthExpired = () => {
      logout()
      router.push('/login')
    }

    globalThis.addEventListener('auth:expired', handleAuthExpired)
    return () => globalThis.removeEventListener('auth:expired', handleAuthExpired)
  }, [logout, router])

  return null
}
