import { cookies } from 'next/headers'
import {
  getNotifications,
  getNotificationsCount,
} from '@/app/actions/notification'
import { NotificationCenter } from '@/components/notification-center'
import { Card, CardContent } from '@/components/ui/card'
import { FolderSearch } from 'lucide-react'

export default async function NotificationsPage({
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
      <Card className="border-dashed border-white/10">
        <CardContent className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
          <FolderSearch className="size-10 text-primary" />
          <h1 className="text-2xl font-black">Select a project</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            Choose a project from the sidebar to view its notifications.
          </p>
        </CardContent>
      </Card>
    )
  }

  const [notificationsResult, countResult] = await Promise.all([
    getNotifications(projectId),
    getNotificationsCount(projectId),
  ])

  return (
    <NotificationCenter
      key={projectId}
      projectId={projectId}
      initialNotifications={notificationsResult.data}
      initialUnreadCount={countResult.data}
      initialError={
        notificationsResult.success ? countResult.error : notificationsResult.error
      }
    />
  )
}
