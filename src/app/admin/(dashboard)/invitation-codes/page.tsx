'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/useAuthStore'
import { InvitationCodeSettings } from '@/components/settings/invitation-codes'
import { InvitationExcelOperations } from '@/components/invitation-excel'
import { Suspense } from 'react'
import { getEvents, type Event } from '@/app/actions/settings'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function InvitationCodesContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const projectId = searchParams.get('projectId') || user?.projectId || ''
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventUuid, setSelectedEventUuid] = useState('')

  useEffect(() => {
    let cancelled = false
    setSelectedEventUuid('')

    async function loadEvents() {
      if (!projectId) {
        setEvents([])
        return
      }

      const result = await getEvents(projectId)
      if (cancelled) return

      if (result.success) {
        setEvents(result.events)
      } else {
        setEvents([])
        toast.error(result.error || 'Failed to load events')
      }
    }

    void loadEvents()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to manage invitation codes.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Invitation Codes</h1>
          <p className="text-muted-foreground mt-1 font-sans">
            Manage invitation codes for your project.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select value={selectedEventUuid || 'all'} onValueChange={(value) => setSelectedEventUuid(value === 'all' ? '' : value)}>
            <SelectTrigger className="w-full rounded-full border-white/10 bg-white/5 sm:w-[240px]">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.event_uuid} value={event.event_uuid}>
                  {event.event_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <InvitationExcelOperations projectId={projectId} userRole="ADMIN" eventUuid={selectedEventUuid || undefined} />
        </div>
      </div>

      <InvitationCodeSettings
        projectUuid={projectId}
        userRole="ADMIN"
        events={events}
        selectedEventUuid={selectedEventUuid || undefined}
      />
    </div>
  )
}

export default function InvitationCodesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <InvitationCodesContent />
    </Suspense>
  )
}
