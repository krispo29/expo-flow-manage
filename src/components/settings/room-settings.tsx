"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getRooms, createRoom, updateRoom, getEvents, type Room, type Event } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit, Plus, Loader2, MapPin, Users, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface RoomSettingsProps {
  projectUuid: string
}

export function RoomSettings({ projectUuid }: Readonly<RoomSettingsProps>) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // Create form state
  const [newRoom, setNewRoom] = useState({ event_uuid: '', room_name: '', location_detail: '', capacity: 0, is_active: true, scanner_id: '' })

  async function fetchData() {
    setLoading(true)
    const [roomsResult, eventsResult] = await Promise.all([
      getRooms(projectUuid),
      getEvents(projectUuid),
    ])
    if (roomsResult.success) setRooms(roomsResult.rooms)
    if (eventsResult.success) setEvents(eventsResult.events)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])

  async function handleCreate() {
    if (!newRoom.event_uuid || !newRoom.room_name) {
      toast.error("Please fill in Event and Room Name")
      return
    }
    setSaving(true)
    const result = await createRoom(projectUuid, newRoom)
    setSaving(false)
    if (result.success) {
      toast.success("Room created")
      setIsCreateOpen(false)
      setNewRoom({ event_uuid: '', room_name: '', location_detail: '', capacity: 0, is_active: true, scanner_id: '' })
      fetchData()
    } else {
      toast.error(result.error || "Failed to create room")
    }
  }

  async function handleUpdate() {
    if (!editingRoom) return
    setSaving(true)
    const result = await updateRoom(projectUuid, {
      room_uuid: editingRoom.room_uuid,
      event_uuid: editingRoom.event_uuid,
      room_name: editingRoom.room_name,
      location_detail: editingRoom.location_detail,
      capacity: editingRoom.capacity,
      is_active: editingRoom.is_active,
      scanner_id: editingRoom.scanner_id,
    })
    setSaving(false)
    if (result.success) {
      toast.success("Room updated")
      setEditingRoom(null)
      fetchData()
    } else {
      toast.error(result.error || "Failed to update room")
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
            <CardTitle>Room Management</CardTitle>
            <CardDescription>Manage conference rooms for this project.</CardDescription>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Room
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No rooms found. Click &quot;Add Room&quot; to create one.
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-6 gap-4 p-3 font-medium text-sm bg-muted/50 border-b">
              <div>Room Name</div>
              <div>Event</div>
              <div>Location</div>
              <div>Scanner ID</div>
              <div>Capacity</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {rooms.map((room) => (
              <div key={room.room_uuid} className="grid grid-cols-6 gap-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
                <div className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  {room.room_name}
                </div>
                <div className="text-muted-foreground">{room.event_name}</div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {room.location_detail || '—'}
                </div>
                <div className="text-muted-foreground">
                  {room.scanner_id || '—'}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {room.capacity.toLocaleString()}
                </div>
                <div>
                  <Badge variant={room.is_active ? "default" : "secondary"} className="text-xs">
                    {room.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRoom(room)}>
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
            <DialogTitle>Add New Room</DialogTitle>
            <DialogDescription>Create a new room for this project.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Event</Label>
              <Select value={newRoom.event_uuid} onValueChange={(v) => setNewRoom({ ...newRoom, event_uuid: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Room Name</Label>
              <Input value={newRoom.room_name} onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })} placeholder="e.g. Room 1" />
            </div>
            <div className="grid gap-2">
              <Label>Location Detail</Label>
              <Input value={newRoom.location_detail} onChange={(e) => setNewRoom({ ...newRoom, location_detail: e.target.value })} placeholder="e.g. Hall 1" />
            </div>
            <div className="grid gap-2">
              <Label>Scanner ID</Label>
              <Input value={newRoom.scanner_id} onChange={(e) => setNewRoom({ ...newRoom, scanner_id: e.target.value })} placeholder="e.g. A001" />
            </div>
            <div className="grid gap-2">
              <Label>Capacity</Label>
              <Input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={newRoom.is_active} onCheckedChange={(v) => setNewRoom({ ...newRoom, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>Update room details.</DialogDescription>
          </DialogHeader>
          {editingRoom && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Event</Label>
                <Select value={editingRoom.event_uuid} onValueChange={(v) => setEditingRoom({ ...editingRoom, event_uuid: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((e) => (
                      <SelectItem key={e.event_uuid} value={e.event_uuid}>{e.event_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Room Name</Label>
                <Input value={editingRoom.room_name} onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Location Detail</Label>
                <Input value={editingRoom.location_detail} onChange={(e) => setEditingRoom({ ...editingRoom, location_detail: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label>Scanner ID</Label>
                <Input value={editingRoom.scanner_id || ''} onChange={(e) => setEditingRoom({ ...editingRoom, scanner_id: e.target.value })} placeholder="e.g. A001" />
              </div>
              <div className="grid gap-2">
                <Label>Capacity</Label>
                <Input type="number" value={editingRoom.capacity} onChange={(e) => setEditingRoom({ ...editingRoom, capacity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editingRoom.is_active} onCheckedChange={(v) => setEditingRoom({ ...editingRoom, is_active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRoom(null)}>Cancel</Button>
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
