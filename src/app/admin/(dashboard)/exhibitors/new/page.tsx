'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/useAuthStore'
import { ExhibitorForm } from '@/components/exhibitor-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function NewExhibitorPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'ORGANIZER'

  if (!isOrganizer && !projectId) {
    return <div>Project ID is required</div>
  }

  const backUrl = isOrganizer ? '/admin/exhibitors' : `/admin/exhibitors?projectId=${projectId}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backUrl}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add New Exhibitor</h1>
      </div>

      <div className="bg-transparent">
        <ExhibitorForm projectId={projectId || ''} userRole={user?.role} />
      </div>
    </div>
  )
}
