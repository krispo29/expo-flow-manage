'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loader2 } from 'lucide-react'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, user, isHydrated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Wait for hydration to finish
    if (!isHydrated || !mounted) return

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router, isHydrated, mounted])

  const isLoading = !mounted || !isHydrated || !isAuthenticated || !user;

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
