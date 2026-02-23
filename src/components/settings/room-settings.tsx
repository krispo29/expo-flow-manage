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
import { Edit, Plus, Loader2, MapPin, Users, Building, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter rooms based on search
  const filteredRooms = rooms.filter(room => 
    room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.location_detail && room.location_detail.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (room.scanner_id && room.scanner_id.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

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

  function fillMockData() {
    setNewRoom({
      event_uuid: events[0]?.event_uuid || '',
      room_name: 'Main Ballroom',
      location_detail: 'Level 2, East Wing',
      capacity: 500,
      is_active: true,
      scanner_id: 'SCAN-01'
    })
    toast.success('Mock data filled')
  }

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
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search rooms..."
                className="pl-9 h-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <Button onClick={() => setIsCreateOpen(true)} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Room
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {searchQuery ? "No matching results found." : "No rooms found. Click \"Add Room\" to create one."}
          </div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-7 gap-4 p-3 font-medium text-sm bg-muted/50 border-b">
              <div>Room Name</div>
              <div>Event</div>
              <div>Location</div>
              <div>Scanner ID</div>
              <div>Capacity</div>
              <div>Status</div>
              <div className="text-right">Actions</div>
            </div>
            {paginatedRooms.map((room) => (
              <div key={room.room_uuid} className="grid grid-cols-7 gap-4 p-3 text-sm items-center border-b last:border-0 hover:bg-muted/10 transition-colors">
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

        {filteredRooms.length > itemsPerPage && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredRooms.length)}</span> of <span className="font-medium">{filteredRooms.length}</span> results
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
            <div className="flex justify-between items-center pr-8">
              <DialogTitle>Add New Room</DialogTitle>
              <Button type="button" variant="outline" size="sm" onClick={fillMockData}>
                Fill Mock Data
              </Button>
            </div>
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
