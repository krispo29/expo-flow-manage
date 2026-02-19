'use client'

import { useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectSettings } from '@/components/settings/general-settings'
import { RoomSettings } from '@/components/settings/room-settings'
import { EventSettings } from '@/components/settings/event-settings'

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">No project selected. Please select a project first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage project settings, rooms, events, and invitation codes.
        </p>
      </div>

      <Tabs defaultValue="project" className="space-y-4">
        <TabsList>
          <TabsTrigger value="project">Project Settings</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="project">
          <ProjectSettings projectUuid={projectId} />
        </TabsContent>

        <TabsContent value="rooms">
          <RoomSettings projectUuid={projectId} />
        </TabsContent>

        <TabsContent value="events">
          <EventSettings projectUuid={projectId} />
        </TabsContent>
        </Tabs>
    </div>
  )
}

