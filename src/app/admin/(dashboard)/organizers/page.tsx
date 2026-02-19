'use client'

import { useSearchParams } from 'next/navigation'
import { OrganizerList } from '@/components/organizer-list'

export default function OrganizersPage() {
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
        <h1 className="text-3xl font-bold tracking-tight">Organizer Management</h1>
        <p className="text-muted-foreground">
          Manage user accounts for event organizers.
        </p>
      </div>

      <OrganizerList projectUuid={projectId} />
    </div>
  )
}
