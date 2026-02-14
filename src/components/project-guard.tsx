'use client'

import { useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function ProjectGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  useEffect(() => {
    // If we are on the projects page, do nothing
    if (pathname === '/admin/projects') return

    // If no project ID is present, redirect to projects page
    if (!projectId) {
      router.push('/admin/projects')
    }
  }, [projectId, pathname, router])

  // Show loader if we are NOT on projects page AND logic says we need a project but don't have one
  // Actually, we just want to block rendering children if we are redirecting.
  // If pathname is NOT /admin/projects AND no projectId, we show loader.
  if (pathname !== '/admin/projects' && !projectId) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return <>{children}</>
}
