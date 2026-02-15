'use server'

import { ConferenceForm } from '@/components/conference-form'

export default async function NewConferencePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const projectId = resolvedSearchParams.projectId || "horti-agri";
  
  return (
    <div className="py-6">
      <ConferenceForm projectId={projectId} />
    </div>
  )
}
