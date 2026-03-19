'use client'

import { useSearchParams } from 'next/navigation'
import { OrganizerList, type OrganizerListHandle } from '@/components/organizer-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useRef, Suspense } from 'react'

function OrganizersContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''
  const listRef = useRef<OrganizerListHandle>(null)

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to manage organizers.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Organizer Management</h1>
          <p className="text-muted-foreground mt-1 font-sans">
            Manage user accounts for event organizers.
          </p>
        </div>
        <Button onClick={() => listRef.current?.openCreateDialog()} className="btn-aurora rounded-full px-6 font-semibold">
          <Plus className="mr-2 h-5 w-5" />
          Add Organizer
        </Button>
      </div>

      <OrganizerList ref={listRef} projectUuid={projectId} />
    </div>
  )
}

export default function OrganizersPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <OrganizersContent />
    </Suspense>
  )
}
