import { SettingsForm } from '@/components/settings-form'
import { getSystemSettings } from '@/app/actions/settings'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function SettingsPage() {
  const result = await getSystemSettings()
  const settings = result.data || {
    siteUrl: '',
    eventDate: new Date(),
    cutoffDate: new Date(),
    eventTitle: '',
    eventSubtitle: ''
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage global event configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Configuration</CardTitle>
          <CardDescription>
            Basic details about the event and system behavior.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SettingsForm initialSettings={settings} />
        </CardContent>
      </Card>
    </div>
  )
}
