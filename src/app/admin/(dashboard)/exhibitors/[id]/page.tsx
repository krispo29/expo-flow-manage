'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useParams } from 'next/navigation' // Corrected import
import Link from 'next/link'
import { getExhibitorById } from '@/app/actions/exhibitor'
import { ExhibitorForm } from '@/components/exhibitor-form'
import { StaffManagement } from '@/components/staff-management'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditExhibitorPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const id = params?.id as string
  
  const [exhibitor, setExhibitor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchExhibitor() {
      if (!id) return
      const result = await getExhibitorById(id)
      if (result.success) {
        setExhibitor(result.exhibitor)
      }
      setLoading(false)
    }
    fetchExhibitor()
  }, [id])

  if (!projectId) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/exhibitors?projectId=${projectId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Edit Exhibitor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exhibitor Details</CardTitle>
        </CardHeader>
        <CardContent>
          {exhibitor && (
            <ExhibitorForm initialData={exhibitor} projectId={projectId} />
          )}
        </CardContent>
      </Card>
      
      {exhibitor && (
        <StaffManagement exhibitorId={exhibitor.id} />
      )}
    </div>
  )
}
