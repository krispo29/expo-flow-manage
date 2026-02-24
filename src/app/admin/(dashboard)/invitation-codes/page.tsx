'use client'

import { useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { InvitationCodeSettings } from '@/components/settings/invitation-codes'

export default function InvitationCodesPage() {
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const projectId = searchParams.get('projectId') || user?.projectId || ''

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
        <h1 className="text-3xl font-bold tracking-tight">Invitation Codes</h1>
        <p className="text-muted-foreground">
          Manage invitation codes for your project.
        </p>
      </div>

      <InvitationCodeSettings projectUuid={projectId} />
    </div>
  )
}
