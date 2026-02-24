'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'
import { getExhibitorById } from '@/app/actions/exhibitor'
import { getOrganizerExhibitorById } from '@/app/actions/organizer-exhibitor'
import { useAuthStore } from '@/store/useAuthStore'
import { ExhibitorForm } from '@/components/exhibitor-form'
import { StaffManagement } from '@/components/staff-management'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditExhibitorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const id = params?.id as string
  const { user } = useAuthStore()
  const isOrganizer = user?.role === 'ORGANIZER'
  
  const [exhibitor, setExhibitor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExhibitor() {
      if (!id) return
      if (!isOrganizer && !projectId) return
      
      let result
      if (isOrganizer) {
        result = await getOrganizerExhibitorById(id)
      } else {
        result = await getExhibitorById(projectId!, id)
      }
      
      if (result.success) {
        setExhibitor(result.exhibitor)
      }
      setLoading(false)
    }
    fetchExhibitor()
  }, [id, projectId, isOrganizer])

  if (!isOrganizer && !projectId) {
    return <div>Project ID is required</div>
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // TODO: Add 404 handling if exhibitor not found

  const backUrl = isOrganizer ? '/admin/exhibitors' : `/admin/exhibitors?projectId=${projectId}`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={backUrl}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Exhibitor</h1>
      </div>

      <div className="bg-transparent">
        {exhibitor && (
          <ExhibitorForm initialData={exhibitor} projectId={projectId || ''} userRole={user?.role} />
        )}
      </div>
      
      {exhibitor && (
        <StaffManagement exhibitorId={exhibitor.id} projectId={projectId || ''} exhibitor={exhibitor} userRole={user?.role} />
      )}
    </div>
  )
}
