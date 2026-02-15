"use client"

import { useTransition, useRef } from "react"
import { toast } from "sonner"
import { createProject } from "@/app/actions/settings"
import { Project } from "@/lib/mock-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"

interface EventSettingsProps {
  projects: Project[]
}

export function EventSettings({ projects }: Readonly<EventSettingsProps>) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createProject(formData)
      if (result.success) {
        toast.success("Event created")
        formRef.current?.reset()
      } else {
        toast.error("Failed to create event")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Management</CardTitle>
        <CardDescription>
          Create and manage events (projects).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form ref={formRef} action={handleCreate} className="space-y-4 border p-4 rounded-md bg-muted/20">
            <h3 className="font-semibold text-sm">Add New Event</h3>
            <div className="space-y-2">
                <Label htmlFor="name">Event Name</Label>
                <Input id="name" name="name" required placeholder="e.g. Expo 2025" />
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" name="description" placeholder="Short description..." />
            </div>
            <Button type="submit" disabled={isPending}>Create Event</Button>
        </form>

        <div className="space-y-4">
             <h3 className="font-semibold text-sm">Existing Events</h3>
             <div className="grid gap-4">
                {projects.map(project => (
                    <div key={project.id} className="border p-4 rounded-md flex justify-between items-start">
                        <div>
                            <div className="font-medium">{project.name}</div>
                            <div className="text-sm text-muted-foreground">{project.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Created: {format(new Date(project.createdAt), 'yyyy-MM-dd')}
                            </div>
                        </div>
                        {/* Add Edit/Delete buttons if needed, currently only Create demanded */}
                    </div>
                ))}
             </div>
        </div>
      </CardContent>
    </Card>
  )
}
