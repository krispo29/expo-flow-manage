'use client'

import { useSearchParams } from 'next/navigation'
import { EventSettings } from '@/components/settings/event-settings'

export default function EventsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No project selected. Please select a project first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground">
          Manage event configuration and timing.
        </p>
      </div>
      <EventSettings projectUuid={projectId} />
    </div>
  )
}
