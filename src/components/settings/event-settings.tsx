"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getEvents, createEvent, updateEvent, type Event } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Edit, Plus, Loader2, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface EventSettingsProps {
  projectUuid: string
}

export function EventSettings({ projectUuid }: Readonly<EventSettingsProps>) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

  // Create form state
  const [newEvent, setNewEvent] = useState({ event_name: '', is_active: true, order_index: 1 })

  async function fetchEvents() {
    setLoading(true)
    const result = await getEvents(projectUuid)
    if (result.success) setEvents(result.events)
    setLoading(false)
  }

  useEffect(() => {
    fetchEvents()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])

  async function handleCreate() {
    if (!newEvent.event_name) {
      toast.error("Please fill in Event Name")
      return
    }
    setSaving(true)
    const result = await createEvent(projectUuid, newEvent)
    setSaving(false)
    if (result.success) {
      toast.success("Event created")
      setIsCreateOpen(false)
      setNewEvent({ event_name: '', is_active: true, order_index: 1 })
      fetchEvents()
    } else {
      toast.error(result.error || "Failed to create event")
    }
  }

  async function handleUpdate() {
    if (!editingEvent) return
    setSaving(true)
    const result = await updateEvent(projectUuid, {
      event_uuid: editingEvent.event_uuid,
      event_name: editingEvent.event_name,
      is_active: editingEvent.is_active,
      order_index: editingEvent.order_index,
    })
    setSaving(false)
    if (result.success) {
      toast.success("Event updated")
      setEditingEvent(null)
      fetchEvents()
    } else {
      toast.error(result.error || "Failed to update event")
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Management</CardTitle>
            <CardDescription>Manage events for this project.</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Event
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No events found. Click &quot;Add Event&quot; to create one.
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.event_uuid} className="group relative border p-4 rounded-xl hover:border-primary/50 transition-all hover:shadow-sm bg-background">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="size-5" />
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {event.event_name}
                        <Badge variant={event.is_active ? "default" : "secondary"} className="text-xs">
                          {event.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                        <span>Code: <code className="bg-muted px-1 py-0.5 rounded">{event.event_code || 'N/A'}</code></span>
                        <span>Order: {event.order_index}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEditingEvent(event)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Event</DialogTitle>
            <DialogDescription>Create a new event for this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Event Name</Label>
              <Input value={newEvent.event_name} onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })} placeholder="e.g. ILDEX Vietnam 2026" />
            </div>
            <div className="grid gap-2">
              <Label>Order Index</Label>
              <Input type="number" value={newEvent.order_index} onChange={(e) => setNewEvent({ ...newEvent, order_index: parseInt(e.target.value) || 1 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newEvent.is_active} onCheckedChange={(v) => setNewEvent({ ...newEvent, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>Update event details.</DialogDescription>
          </DialogHeader>
          {editingEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Event Name</Label>
                <Input value={editingEvent.event_name} onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Order Index</Label>
                <Input type="number" value={editingEvent.order_index} onChange={(e) => setEditingEvent({ ...editingEvent, order_index: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingEvent.is_active} onCheckedChange={(v) => setEditingEvent({ ...editingEvent, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
