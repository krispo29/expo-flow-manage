'use client'

import { useSearchParams } from 'next/navigation'
import { ProjectSettings } from '@/components/settings/general-settings'
import { Suspense } from 'react'

function SettingsContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to configure settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Project Settings</h1>
        <p className="text-muted-foreground mt-1 font-sans">
          Configure the project details, dates, and assets.
        </p>
      </div>

      <ProjectSettings projectUuid={projectId} />
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  )
}
