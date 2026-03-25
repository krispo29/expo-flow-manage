'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clearClientAuthState } from '@/lib/client-auth'

/**
 * Client-side component that listens for auth expiration events.
 * When a server action detects an expired token, it returns a special flag.
 * This component should be placed in the admin layout to handle redirects.
 */
export function AuthErrorHandler() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthExpired = () => {
      clearClientAuthState()
      router.push('/login')
    }

    globalThis.addEventListener('auth:expired', handleAuthExpired)
    return () => globalThis.removeEventListener('auth:expired', handleAuthExpired)
  }, [router])

  return null
}
