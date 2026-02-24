'use server'

import { ConferenceForm } from '@/components/conference-form'
import { getConferenceById } from '@/app/actions/conference'
import { getOrganizerConferenceById } from '@/app/actions/organizer-conference'
import { getUserRole } from '@/app/actions/auth'
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
  const userRole = await getUserRole();
  
  // Use organizer endpoint if role is ORGANIZER
  const { conference } = userRole === 'ORGANIZER'
    ? await getOrganizerConferenceById(id)
    : await getConferenceById(id)
  
  if (!conference) {
    notFound()
  }

  return (
    <div className="py-6">
      <ConferenceForm projectId={projectId} conference={conference} userRole={userRole} />
    </div>
  )
}
