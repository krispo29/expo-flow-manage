import { cookies } from 'next/headers'
import { getAllAttendeeTypes } from '@/app/actions/participant'
import { getUpgradeRequests } from '@/app/actions/upgrade-request'
import { UpgradeRequestQueue } from '@/components/upgrade-request-queue'
import { Card, CardContent } from '@/components/ui/card'
import { FolderSearch } from 'lucide-react'

export default async function UpgradeRequestsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ projectId?: string }>
}>) {
  const resolvedSearchParams = await searchParams
  const cookieStore = await cookies()
  const projectId =
    resolvedSearchParams.projectId || cookieStore.get('project_uuid')?.value || ''

  if (!projectId) {
    return (
      <Card className="glass rounded-3xl border-dashed border-white/10">
        <CardContent className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
          <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
            <FolderSearch className="size-8" />
          </div>
          <h1 className="mt-5 text-2xl font-black">Select a project</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Choose a project from the sidebar to review questionnaire-triggered
            attendee upgrades.
          </p>
        </CardContent>
      </Card>
    )
  }

  const [requestsResult, attendeeTypesResult] = await Promise.all([
    getUpgradeRequests(projectId),
    getAllAttendeeTypes(projectId),
  ])

  return (
    <UpgradeRequestQueue
      projectId={projectId}
      initialRequests={requestsResult.data}
      attendeeTypes={attendeeTypesResult.data || []}
      initialError={
        requestsResult.success
          ? attendeeTypesResult.error
          : requestsResult.error
      }
    />
  )
}
