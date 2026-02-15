'use server'

import { ConferenceForm } from '@/components/conference-form'
import { getConferenceById } from '@/app/actions/conference'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ projectId?: string }>;
}

export default async function EditConferencePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId || "horti-agri";
  
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
