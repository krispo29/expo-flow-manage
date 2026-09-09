import { BadgeLayoutEditor } from '@/components/settings/badge-layout-editor'
import { requireServerAuthContext } from '@/lib/server-auth'

export default async function BadgeLayoutPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  await requireServerAuthContext()
  const { projectId } = await searchParams
  if (!projectId)
    return <p className="p-8">Select a project to edit its badge layout.</p>
  return <BadgeLayoutEditor key={projectId} projectUuid={projectId} />
}
