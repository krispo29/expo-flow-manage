'use server'

import { ConferenceList } from '@/components/conference-list'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { getConferences } from '@/app/actions/conference'
import { ConferenceExcelOperations } from '@/components/conference-excel'

export default async function ConferencesPage() {
  // TODO: dynamic project ID
  const projectId = 'cm6x20a8h00010clc2p180c42' 
  const { data: conferences } = await getConferences(projectId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conferences</h1>
          <p className="text-muted-foreground">
            Manage conference sessions and schedules.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/conferences/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Conference
          </Link>
        </Button>
      </div>

      <ConferenceList conferences={conferences || []} />
      
      <div className="pt-8 border-t">
        <h2 className="text-lg font-semibold mb-4">Data Management</h2>
        <ConferenceExcelOperations conferences={conferences || []} projectId={projectId} />
      </div>
    </div>
  )
}
