'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { InvitationExcelOperations } from '@/components/invitation-excel'
import { InvitationCodeSettings } from '@/components/settings/invitation-codes'
import { useAuthStore } from '@/store/useAuthStore'

function OrganizerInvitationCodesContent() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const projectId = searchParams.get('projectId') || user?.projectId || ''

  if (!projectId) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl p-12 glass">
        <h2 className="mb-2 text-2xl font-display font-bold">No Project Selected</h2>
        <p className="mb-6 text-center text-muted-foreground/80">
          Please select a project from the dashboard to view invitation codes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-display font-extrabold tracking-tight text-transparent">
            Invitation Codes
          </h1>
          <p className="mt-1 font-sans text-muted-foreground">
            View invitation codes for your project.
          </p>
        </div>
        <InvitationExcelOperations projectId={projectId} userRole="ORGANIZER" />
      </div>

      <InvitationCodeSettings projectUuid={projectId} userRole="ORGANIZER" />
    </div>
  )
}

export default function OrganizerInvitationCodesPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <OrganizerInvitationCodesContent />
    </Suspense>
  )
}
