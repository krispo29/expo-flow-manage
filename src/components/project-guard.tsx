'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { setProjectCookie } from '@/app/actions/auth'
import { useAuthStore } from '@/store/useAuthStore'

interface ProjectGuardProps {
  children: React.ReactNode
  projects?: { id: string; name: string; url: string }[] 
}

export function ProjectGuard({ children, projects }: ProjectGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const lastProjectIdRef = useRef<string | null>(null)
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'ORGANIZER'

  useEffect(() => {
    // If we are on the projects page, do nothing
    if (pathname === '/admin/projects') return

    // Organizers don't need a project selection — backend knows from token
    if (isOrganizer) return

    // If no project ID is present
    if (!projectId) {
      // Check if user has only one project, if so redirect to it
      if (projects && projects.length === 1) {
        const singleProjectId = projects[0].id
        console.log('ProjectGuard: Auto-redirecting to single project', singleProjectId)
        router.replace(`${pathname}?projectId=${singleProjectId}`)
        return
      }

      // Otherwise redirect to projects list
      router.push('/admin/projects')
    } else if (projectId !== lastProjectIdRef.current) {
      // Only set cookie if projectId has changed
      lastProjectIdRef.current = projectId
      setProjectCookie(projectId).catch(err => {
        console.error('Failed to set project cookie:', err)
      })
    }
  }, [projectId, pathname, router, projects, isOrganizer])

  const isLoading = pathname !== '/admin/projects' && !projectId && !isOrganizer;

  return (
    <>
      {isLoading && (
        <div className="flex h-screen w-full items-center justify-center fixed inset-0 z-50 bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Redirecting...</span>
        </div>
      )}
      <div style={{ display: isLoading ? 'none' : 'contents' }}>
        {children}
      </div>
    </>
  )
}
