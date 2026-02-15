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
import { CalendarDays } from "lucide-react"

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
             <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Existing Events</h3>
                <span className="text-xs text-muted-foreground">{projects.length} Total Events</span>
             </div>
             <div className="grid gap-4">
                {projects.map(project => (
                    <div key={project.id} className="group relative border p-4 rounded-xl hover:border-primary/50 transition-all hover:shadow-sm bg-background">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <div className="font-semibold flex items-center gap-2">
                                    {project.name}
                                    {project.id === 'ildex-vietnam-2026' && (
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase">Active</span>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">{project.description}</div>
                                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                    <span className="flex items-center gap-1">
                                        <CalendarDays className="h-3 w-3" />
                                        Created: {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        ID: {project.id.split('-')[0]}...
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                Edit Settings
                            </Button>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </CardContent>
    </Card>
  )
}
