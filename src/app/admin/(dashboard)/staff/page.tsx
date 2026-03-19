import { getProjectStaffs } from '@/app/actions/staff'
import { StaffList } from '@/components/staff-list'
import { cookies } from 'next/headers'

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const cookieStore = await cookies()
  const projectId = (resolvedSearchParams.projectId as string) || cookieStore.get('project_uuid')?.value || '67597e81-db17-4ff0-8479-56f737d9482a'

  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1
  const keyword = typeof resolvedSearchParams.keyword === 'string' ? resolvedSearchParams.keyword : ''

  const result = await getProjectStaffs(projectId, page, 20, keyword)
  const data = result.data || { items: [], total_pages: 1, page: 1, limit: 20, total_items: 0 }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Staff Management</h1>
          <p className="text-muted-foreground mt-1 font-sans">
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
