'use client'

import { useSearchParams } from 'next/navigation'
import { OrganizerList, type OrganizerListHandle } from '@/components/organizer-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRef } from 'react'

export default function OrganizersPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''
  const listRef = useRef<OrganizerListHandle>(null)

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No project selected. Please select a project first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organizer Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts for event organizers.
          </p>
        </div>
        <Button onClick={() => listRef.current?.openCreateDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Organizer
        </Button>
      </div>

      <OrganizerList ref={listRef} projectUuid={projectId} />
    </div>
  )
}
