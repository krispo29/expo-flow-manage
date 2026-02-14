'use server'

import { ConferenceForm } from '@/components/conference-form'
import { getConferenceById } from '@/app/actions/conference'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditConferencePage({ params }: PageProps) {
  const { id } = await params
  // TODO: dynamic project ID
  const projectId = 'cm6x20a8h00010clc2p180c42'
  
  const { conference } = await getConferenceById(id)
  
  if (!conference) {
    notFound()
  }

  return (
    <div className="py-6">
      <ConferenceForm projectId={projectId} conference={conference} />
    </div>
  )
}
