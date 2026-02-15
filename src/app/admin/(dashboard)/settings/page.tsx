import { getSettings, getInvitationCodes } from "@/app/actions/settings"
import { getProjects } from "@/app/actions/project"
import { GeneralSettings } from "@/components/settings/general-settings"
import { RoomSettings } from "@/components/settings/room-settings"
import { EventSettings } from "@/components/settings/event-settings"
import { InvitationCodeSettings } from "@/components/settings/invitation-codes"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage() {
  const { settings } = await getSettings()
  const { projects } = await getProjects()
  const { codes } = await getInvitationCodes()

  if (!settings) return <div>Failed to load settings</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage system-wide configuration and preferences.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="invitations">Invitation Codes</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings initialSettings={settings} />
        </TabsContent>
        
        <TabsContent value="rooms">
          <RoomSettings rooms={settings.rooms || []} />
        </TabsContent>
        
        <TabsContent value="events">
          <EventSettings projects={projects || []} />
        </TabsContent>
        
        <TabsContent value="invitations">
          <InvitationCodeSettings codes={codes || []} siteUrl={settings.siteUrl} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
