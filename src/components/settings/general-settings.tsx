"use client"

import { useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { updateSettings } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SystemSettings } from "@/lib/mock-service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface GeneralSettingsProps {
  initialSettings: SystemSettings
}

export function GeneralSettings({ initialSettings }: Readonly<GeneralSettingsProps>) {
  const [isPending, startTransition] = useTransition()

  async function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateSettings(formData)
      if (result.success) {
        toast.success("Settings updated successfully")
      } else {
        toast.error("Failed to update settings")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>
          Configure the general settings for the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="siteUrl">Site URL</Label>
            <Input
              id="siteUrl"
              name="siteUrl"
              defaultValue={initialSettings.siteUrl}
              placeholder="https://example.com"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventTitle">Event Title</Label>
            <Input
              id="eventTitle"
              name="eventTitle"
              defaultValue={initialSettings.eventTitle}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="eventSubtitle">Event Subtitle</Label>
            <Input
              id="eventSubtitle"
              name="eventSubtitle"
              defaultValue={initialSettings.eventSubtitle}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="eventDate">Event Date</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                defaultValue={initialSettings.eventDate ? format(new Date(initialSettings.eventDate), 'yyyy-MM-dd') : ''}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cutoffDate">Cutoff Date (Exhibitor Edit)</Label>
              <Input
                id="cutoffDate"
                name="cutoffDate"
                type="date"
                defaultValue={initialSettings.cutoffDate ? format(new Date(initialSettings.cutoffDate), 'yyyy-MM-dd') : ''}
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
