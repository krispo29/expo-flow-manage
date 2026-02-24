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
import { Edit, Plus, Loader2, Calendar, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter events based on search
  const filteredEvents = events.filter(event => 
    event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (event.event_code && event.event_code.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEvents = filteredEvents.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

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
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchQuery ? "No matching results found." : "No events found. Click \"Add Event\" to create one."}
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-5 gap-4 p-3 font-medium text-sm bg-muted/50 border-b">
              <div>Event Name</div>
              <div>Event Code</div>
              <div>Order</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {paginatedEvents.map((event) => (
              <div key={event.event_uuid} className="grid grid-cols-5 gap-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                <div className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {event.event_name}
                </div>
                <div>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{event.event_code || '—'}</code>
                </div>
                <div className="text-muted-foreground">
                  {event.order_index}
                </div>
                <div>
                  <Badge variant={event.is_active ? "default" : "secondary"} className="text-xs">
                    {event.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditingEvent(event)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredEvents.length > itemsPerPage && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredEvents.length)}</span> of <span className="font-medium">{filteredEvents.length}</span> results
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = currentPage
                  if (currentPage <= 3) pageNum = i + 1
                  else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                  else pageNum = currentPage - 2 + i

                  if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 text-xs"
                        onClick={() => goToPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  }
                  return null
                })}
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
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
