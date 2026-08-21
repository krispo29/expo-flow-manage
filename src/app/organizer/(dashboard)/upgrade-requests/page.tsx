import { redirect } from 'next/navigation'
import { FolderSearch } from 'lucide-react'
import { getUserRole } from '@/app/actions/auth'
import { getAllAttendeeTypes } from '@/app/actions/participant'
import {
  getOrganizerUpgradeRequests,
  reviewOrganizerUpgradeRequest,
} from '@/app/actions/organizer-upgrade-request'
import { UpgradeRequestQueue } from '@/components/upgrade-request-queue'
import { Card, CardContent } from '@/components/ui/card'
import { getServerAuthContext } from '@/lib/server-auth'

export default async function OrganizerUpgradeRequestsPage() {
  const role = await getUserRole()
  if (role !== 'ORGANIZER') {
    redirect(role === 'ADMIN' ? '/admin' : '/login')
  }

  const authContext = await getServerAuthContext()
  const projectId = authContext?.projectUuid || ''

  if (!projectId) {
    return (
      <Card className="glass rounded-3xl border-dashed border-white/10">
        <CardContent className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
          <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <FolderSearch className="size-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Project unavailable</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Your Organizer account is not associated with a project.
          </p>
        </CardContent>
      </Card>
    )
  }

  const [requestsResult, attendeeTypesResult] = await Promise.all([
    getOrganizerUpgradeRequests(projectId),
    getAllAttendeeTypes(projectId),
  ])

  return (
    <UpgradeRequestQueue
      key={projectId}
      projectId={projectId}
      initialRequests={requestsResult.data}
      attendeeTypes={attendeeTypesResult.data || []}
      initialError={
        requestsResult.success
          ? attendeeTypesResult.error
          : requestsResult.error
      }
      loadRequests={getOrganizerUpgradeRequests}
      reviewRequest={reviewOrganizerUpgradeRequest}
    />
  )
}
