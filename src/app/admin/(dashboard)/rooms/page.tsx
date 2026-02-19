'use client'

import { useSearchParams } from 'next/navigation'
import { RoomSettings } from '@/components/settings/room-settings'

export default function RoomsPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Rooms</h1>
        <p className="text-muted-foreground">
          Manage conference rooms and locations for this project.
        </p>
      </div>
      <RoomSettings projectUuid={projectId} />
    </div>
  )
}
