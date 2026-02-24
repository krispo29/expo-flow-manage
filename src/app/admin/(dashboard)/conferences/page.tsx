'use server'

import { ConferenceList } from '@/components/conference-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getConferences } from '@/app/actions/conference'
import { getOrganizerConferences } from '@/app/actions/organizer-conference'
import { ConferenceExcelOperations } from '@/components/conference-excel'
import { getUserRole } from '@/app/actions/auth'

export default async function ConferencesPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ projectId?: string }>;
}>) {
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId || "horti-agri";
  const userRole = await getUserRole();

  // Use organizer endpoint if role is ORGANIZER
  const { data: conferences } = userRole === 'ORGANIZER'
    ? await getOrganizerConferences()
    : await getConferences(projectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
          <p className="text-muted-foreground">
            Manage sessions and conference schedule.
          </p>
        </div>
        <div className="flex gap-2">
          <ConferenceExcelOperations conferences={conferences || []} projectId={projectId} />
          <Button asChild>
            <Link href={`/admin/conferences/new?projectId=${projectId}`}>
              <Plus className="mr-2 h-4 w-4" />
              Add Conference
            </Link>
          </Button>
        </div>
      </div>

      <ConferenceList conferences={conferences || []} projectId={projectId} userRole={userRole} />
    </div>
  )
}
