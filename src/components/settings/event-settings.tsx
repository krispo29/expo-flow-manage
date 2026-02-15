"use client"

import { useTransition, useRef, useState } from "react"
import { toast } from "sonner"
import { createProject, updateProject, deleteProject } from "@/app/actions/settings"
import { Project } from "@/lib/mock-service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { format } from "date-fns"
import { CalendarDays, Trash2, Edit } from "lucide-react"

interface EventSettingsProps {
  projects: Project[]
}

export function EventSettings({ projects }: Readonly<EventSettingsProps>) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

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

  async function handleUpdate(formData: FormData) {
    if (!editingProject) return
    startTransition(async () => {
      const result = await updateProject(editingProject.id, formData)
      if (result.success) {
        toast.success("Event updated")
        setEditingProject(null)
      } else {
        toast.error("Failed to update event")
      }
    })
  }

  async function handleDelete(id: string) {
    toast("Delete this event?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          startTransition(async () => {
            const result = await deleteProject(id)
            if (result.success) {
              toast.success("Event deleted")
            } else {
              toast.error("Failed to delete event")
            }
          })
        },
      },
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
                            <div className="flex gap-2">
                                <Dialog open={!!editingProject && editingProject.id === project.id} onOpenChange={(open) => !open && setEditingProject(null)}>
                                    <DialogTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => setEditingProject(project)}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Event</DialogTitle>
                                            <DialogDescription>
                                                Update the details for this event.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form action={handleUpdate} className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-name">Event Name</Label>
                                                <Input id="edit-name" name="name" defaultValue={project.name} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="edit-description">Description</Label>
                                                <Textarea id="edit-description" name="description" defaultValue={project.description} />
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button>
                                                <Button type="submit" disabled={isPending}>Save Changes</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDelete(project.id)}
                                    disabled={isPending}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
        </div>
      </CardContent>
    </Card>
  )
}

