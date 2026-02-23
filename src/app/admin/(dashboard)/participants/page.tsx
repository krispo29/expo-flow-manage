import { ScannerImport } from '@/components/scanner-import'
import { getParticipants } from '@/app/actions/participant'
import { ParticipantList } from '@/components/participant-list'
import { redirect } from 'next/navigation'

import { cookies } from 'next/headers'
 
export default async function ParticipantsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; type?: string; projectId?: string }> 
}) {
  const resolvedSearchParams = await searchParams
  const cookieStore = await cookies()
  const projectId = resolvedSearchParams.projectId || cookieStore.get('project_uuid')?.value || 'horti-agri'
  const query = resolvedSearchParams.q || ''
  const type = resolvedSearchParams.type || 'ALL'

  // Fetch data
  const result = await getParticipants(projectId, query, type)
  const participants = result.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Participant Management</h1>
          <p className="text-muted-foreground">
            Manage all attendees, VIPs, and groups.
          </p>
        </div>
      </div>

      {/* Scanner Import Section */}
      <ScannerImport projectId={projectId} />

      <ParticipantList 
        participants={participants} 
        projectId={projectId}
        currentType={type}
        onSearch={async (q) => {
          'use server'
          redirect(`/admin/participants?q=${q}&type=${type}&projectId=${projectId}`)
        }}
        onTypeFilter={async (t) => {
            'use server'
            redirect(`/admin/participants?q=${query}&type=${t}&projectId=${projectId}`)
        }}
      />
    </div>
  )
}
