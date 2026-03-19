'use client'

import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { EventSettings } from '@/components/settings/event-settings'
import { Suspense } from 'react'

function EventsContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const projectId = searchParams.get('projectId') || user?.projectId || ''

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to manage events.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Events</h1>
        <p className="text-muted-foreground mt-1 font-sans">
          Manage event configuration and timing.
        </p>
      </div>
      <EventSettings projectUuid={projectId} />
    </div>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <EventsContent />
    </Suspense>
  )
}
