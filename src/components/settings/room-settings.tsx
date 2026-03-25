"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getRooms, createRoom, updateRoom, type Room } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Edit, Plus, Loader2, MapPin, Users, Building, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Monitor, ShieldCheck, Power, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface RoomSettingsProps {
  projectUuid: string
}

export function RoomSettings({ projectUuid }: Readonly<RoomSettingsProps>) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  // Create form state
  const [newRoom, setNewRoom] = useState({ room_name: '', location_detail: '', room_type: '', capacity: 0, is_active: true, device_id: '' })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    roomName: '',
    roomType: '',
    location: '',
    deviceId: '',
    isActive: 'all'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter rooms based on search and column filters
  const filteredRooms = rooms.filter(room => {
    // Global search
    const matchesSearch = !searchQuery ||
      room.room_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (room.location_detail?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (room.device_id?.toLowerCase().includes(searchQuery.toLowerCase()))

    // Column specific filters
    const matchesRoomName = !columnFilters.roomName ||
      (room.room_name && room.room_name.toLowerCase().includes(columnFilters.roomName.toLowerCase()))

    const matchesRoomType = !columnFilters.roomType || columnFilters.roomType === 'all' ||
      (room.room_type && room.room_type.toLowerCase().includes(columnFilters.roomType.toLowerCase()))

    const matchesLocation = !columnFilters.location ||
      (room.location_detail && room.location_detail.toLowerCase().includes(columnFilters.location.toLowerCase()))

    const matchesDeviceId = !columnFilters.deviceId ||
      (room.device_id && room.device_id.toLowerCase().includes(columnFilters.deviceId.toLowerCase()))

    const matchesStatus = columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && room.is_active) ||
      (columnFilters.isActive === 'inactive' && !room.is_active)

    return matchesSearch && matchesRoomName && matchesRoomType && matchesLocation && matchesDeviceId && matchesStatus
  })

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

  // Handle column filter change and reset pagination
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setColumnFilters({
      roomName: '',
      roomType: '',
      location: '',
      deviceId: '',
      isActive: 'all'
    })
    setSearchQuery('')
    setCurrentPage(1)
    setShowFilters(false)
  }

  async function fetchData() {
    setLoading(true)
    const roomsResult = await getRooms(projectUuid)
    if (roomsResult.success) setRooms(roomsResult.rooms)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])


  async function handleCreate() {
    if (!newRoom.room_name) {
      toast.error("Please fill in Room Name")
      return
    }
    setSaving(true)
    const result = await createRoom(projectUuid, {
      room_name: newRoom.room_name,
      location_detail: newRoom.location_detail,
      capacity: newRoom.capacity,
      is_active: newRoom.is_active,
      device_id: newRoom.device_id,
      room_type: newRoom.room_type,
    })
    setSaving(false)
    if (result.success) {
      toast.success("Room created")
      setIsCreateOpen(false)
      setNewRoom({ room_name: '', location_detail: '', room_type: '', capacity: 0, is_active: true, device_id: '' })
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
      room_name: editingRoom.room_name,
      location_detail: editingRoom.location_detail,
      capacity: editingRoom.capacity,
      is_active: editingRoom.is_active,
      device_id: editingRoom.device_id,
      room_type: editingRoom.room_type,
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
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse font-bold tracking-widest uppercase">Syncing zones...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Room Management</CardTitle>
              <CardDescription className="font-medium">Manage conference rooms for this project.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search rooms..."
                    className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  size="icon"
                  className={cn("h-11 w-11 rounded-2xl shrink-0 transition-all", showFilters ? "shadow-lg shadow-primary/20" : "bg-white/5 border-white/10")}
                  onClick={() => setShowFilters(!showFilters)}
                  title="Toggle Filters"
                >
                  <Filter className="h-4 w-4" />
                </Button>
                {(showFilters || searchQuery || Object.values(columnFilters).some(v => v !== '' && v !== 'all')) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-11 w-11 rounded-2xl shrink-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10"
                    onClick={clearFilters}
                    title="Clear All Filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="btn-aurora h-11 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20 w-full sm:w-auto">
                <Plus className="h-5 w-5 mr-2" />
                Add Room
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Room Name</Label>
                  <Input
                    placeholder="Filter by room name..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.roomName}
                    onChange={e => handleColumnFilterChange('roomName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Room Type</Label>
                  <Select value={columnFilters.roomType} onValueChange={v => handleColumnFilterChange('roomType', v)}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-sm">
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="hall">Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Location</Label>
                  <Input
                    placeholder="Filter by location..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.location}
                    onChange={e => handleColumnFilterChange('location', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Device ID</Label>
                  <Input
                    placeholder="Filter by device ID..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.deviceId}
                    onChange={e => handleColumnFilterChange('deviceId', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Status</Label>
                  <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-sm">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredRooms.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">
                {searchQuery ? "No matching results found." : "No rooms found. Click \"Add Room\" to create one."}
              </div>
            ) : (
              paginatedRooms.map((room) => (
                <div key={room.room_uuid} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight flex items-center gap-2">
                        <Building className="h-4 w-4 text-primary/40" />
                        {room.room_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{room.room_type || 'untyped'}</Badge>
                        <span className="text-[10px] font-mono font-bold text-primary/60">ID: {room.device_id || '---'}</span>
                      </div>
                    </div>
                    <Badge className={cn("rounded-full px-3 text-[10px] font-bold", room.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                      {room.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{room.location_detail || 'No location'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/80 font-medium italic">
                      <Users className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{room.capacity.toLocaleString()} Capacity</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 px-4" onClick={() => setEditingRoom(room)}>
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Room Name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Room Type</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Location</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Device ID</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Capacity</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                    <TableHead className="pl-6 py-2">
                      <Input
                        placeholder="Filter room..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.roomName}
                        onChange={e => handleColumnFilterChange('roomName', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Select value={columnFilters.roomType} onValueChange={v => handleColumnFilterChange('roomType', v)}>
                        <SelectTrigger className="h-9 bg-white/5 border-white/10 rounded-lg text-xs">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-xl">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="conference">Conference</SelectItem>
                          <SelectItem value="hall">Hall</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter location..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.location}
                        onChange={e => handleColumnFilterChange('location', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter device..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.deviceId}
                        onChange={e => handleColumnFilterChange('deviceId', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2"></TableHead>
                    <TableHead className="py-2 text-center">
                      <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                        <SelectTrigger className="h-9 bg-white/5 border-white/10 rounded-lg text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-xl">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="py-2 text-right pr-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-red-500 transition-colors"
                        onClick={clearFilters}
                      >
                        Reset
                      </Button>
                    </TableHead>
                  </TableRow>
                )}
              </TableHeader>
              <TableBody>
                {filteredRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 italic text-muted-foreground font-medium">
                      {searchQuery ? "No matching results found." : "No rooms found. Click \"Add Room\" to create one."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRooms.map((room) => (
                    <TableRow key={room.room_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <Building className="h-4 w-4 text-primary/40" />
                          {room.room_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5">{room.room_type || '---'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                          <MapPin className="h-3.5 w-3.5 opacity-40" />
                          {room.location_detail || '---'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-mono font-bold opacity-40 uppercase tracking-widest">{room.device_id || '---'}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                          <Users className="h-3.5 w-3.5 opacity-40" />
                          {room.capacity.toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", room.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                          {room.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" onClick={() => setEditingRoom(room)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredRooms.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
              <div className="text-sm text-muted-foreground italic font-medium">
                Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredRooms.length)}</span> of <span className="text-foreground font-bold">{filteredRooms.length}</span> results
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
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
                          className={cn("h-9 w-9 rounded-full text-xs font-bold", currentPage === pageNum ? 'shadow-lg shadow-primary/20' : 'bg-white/5 border-white/10')}
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
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass sm:max-w-[540px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Add New Room</DialogTitle>
                <DialogDescription className="font-medium italic">Create a new room for this project.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 grid gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Room Name</Label>
                <Input value={newRoom.room_name} onChange={(e) => setNewRoom({ ...newRoom, room_name: e.target.value })} placeholder="e.g. Room 1" className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Room Type</Label>
                <Select value={newRoom.room_type} onValueChange={(v) => setNewRoom({ ...newRoom, room_type: v })}>
                  <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/10">
                    <SelectItem value="conference" className="text-xs font-bold uppercase">Conference</SelectItem>
                    <SelectItem value="hall" className="text-xs font-bold uppercase">Hall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Location Detail</Label>
              <Input value={newRoom.location_detail} onChange={(e) => setNewRoom({ ...newRoom, location_detail: e.target.value })} placeholder="e.g. Hall 1" className="h-12 bg-white/5 border-white/10 rounded-xl" />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Device ID</Label>
                <Input value={newRoom.device_id} onChange={(e) => setNewRoom({ ...newRoom, device_id: e.target.value })} placeholder="e.g. A001" className="h-12 bg-white/5 border-white/10 rounded-xl font-mono" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Capacity</Label>
                <Input type="number" value={newRoom.capacity} onChange={(e) => setNewRoom({ ...newRoom, capacity: Number.parseInt(e.target.value) || 0 })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
              <Label className="text-xs font-bold uppercase tracking-tight">Active Status</Label>
              <Switch checked={newRoom.is_active} onCheckedChange={(v) => setNewRoom({ ...newRoom, is_active: v })} />
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Create Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRoom} onOpenChange={(open) => !open && setEditingRoom(null)}>
        <DialogContent className="glass sm:max-w-[540px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Edit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Edit Room</DialogTitle>
                <DialogDescription className="font-medium italic">Update room details for <span className="text-foreground font-bold">{editingRoom?.room_name}</span>.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingRoom && (
            <div className="p-8 grid gap-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Room Name</Label>
                  <Input value={editingRoom.room_name} onChange={(e) => setEditingRoom({ ...editingRoom, room_name: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Room Type</Label>
                  <Select value={editingRoom.room_type || ''} onValueChange={(v) => setEditingRoom({ ...editingRoom, room_type: v })}>
                    <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                      <SelectValue placeholder="Select room type" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10">
                      <SelectItem value="conference" className="text-xs font-bold uppercase">Conference</SelectItem>
                      <SelectItem value="hall" className="text-xs font-bold uppercase">Hall</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Location Detail</Label>
                <Input value={editingRoom.location_detail} onChange={(e) => setEditingRoom({ ...editingRoom, location_detail: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Device ID</Label>
                  <Input value={editingRoom.device_id || ''} onChange={(e) => setEditingRoom({ ...editingRoom, device_id: e.target.value })} placeholder="e.g. A001" className="h-12 bg-white/5 border-white/10 rounded-xl font-mono" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Capacity</Label>
                  <Input type="number" value={editingRoom.capacity} onChange={(e) => setEditingRoom({ ...editingRoom, capacity: Number.parseInt(e.target.value) || 0 })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
                <Label className="text-xs font-bold uppercase tracking-tight">Active Status</Label>
                <Switch checked={editingRoom.is_active} onCheckedChange={(v) => setEditingRoom({ ...editingRoom, is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setEditingRoom(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Power className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
