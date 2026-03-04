import { getProjectStaffs } from '@/app/actions/staff'
import { StaffList } from '@/components/staff-list'
import { cookies } from 'next/headers'

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const cookieStore = await cookies()
  const projectId = cookieStore.get('project_uuid')?.value || 'horti-agri'

  const resolvedSearchParams = await searchParams
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const keyword = typeof resolvedSearchParams.keyword === 'string' ? resolvedSearchParams.keyword : ''

  const result = await getProjectStaffs(projectId, page, 20, keyword)
  const data = result.data || { items: [], total_pages: 1, page: 1, limit: 20, total_items: 0 }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">
            Manage onsite staff and organizers for the event.
          </p>
        </div>
      </div>

      <StaffList 
        initialData={data} 
        projectId={projectId}
      />
    </div>
  )
}
