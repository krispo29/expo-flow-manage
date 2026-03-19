'use client'

import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { RoomSettings } from '@/components/settings/room-settings'
import { Suspense } from 'react'

function RoomsContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const projectId = searchParams.get('projectId') || user?.projectId || ''

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to manage rooms.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Rooms</h1>
        <p className="text-muted-foreground mt-1 font-sans">
          Manage conference rooms and locations for this project.
        </p>
      </div>
      <RoomSettings projectUuid={projectId} />
    </div>
  )
}

export default function RoomsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <RoomsContent />
    </Suspense>
  )
}
