'use server'

import { ConferenceForm } from '@/components/conference-form'

export default async function NewConferencePage() {
  // TODO: dynamic project ID
  const projectId = 'cm6x20a8h00010clc2p180c42'
  
  return (
    <div className="py-6">
      <ConferenceForm projectId={projectId} />
    </div>
  )
}
