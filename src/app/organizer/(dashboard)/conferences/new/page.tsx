'use server'

import { ConferenceForm } from '@/components/conference-form'
import { getUserRole } from '@/app/actions/auth'

export default async function NewConferencePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId || "horti-agri";
  const userRole = await getUserRole();
  
  return (
    <div className="py-6">
      <ConferenceForm projectId={projectId} userRole={userRole} />
    </div>
  )
}
