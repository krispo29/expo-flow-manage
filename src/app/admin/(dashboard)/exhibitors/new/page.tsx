'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ExhibitorForm } from '@/components/exhibitor-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function NewExhibitorPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  if (!projectId) {
    return <div>Project ID is required</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/exhibitors?projectId=${projectId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Add New Exhibitor</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exhibitor Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ExhibitorForm projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  )
}
