"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getEvents, createEvent, updateEvent, type Event } from "@/app/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Edit, Plus, Loader2, Calendar, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ShieldCheck, Power, Hash, Filter, X, Eye, Image as ImageIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

interface EventSettingsProps {
  projectUuid: string
}

interface EventFormState {
  event_name: string
  event_color_code: string
  event_logo_url: string
  event_registration_confirmed_message_html: string
  is_active: boolean
  order_index: number
}

const emptyEventForm = (): EventFormState => ({
  event_name: '',
  event_color_code: '',
  event_logo_url: '',
  event_registration_confirmed_message_html: '',
  is_active: true,
  order_index: 1,
})

const normalizeColor = (value?: string | null) =>
  /^#[0-9a-fA-F]{6}$/.test(value || '') ? value || '#000000' : '#000000'

function EventColorField({
  id,
  value,
  onChange,
}: Readonly<{
  id: string
  value: string
  onChange: (value: string) => void
}>) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Color Code</Label>
      <div className="flex h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3">
        <input
          id={id}
          type="color"
          value={normalizeColor(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 cursor-pointer rounded-md border border-white/10 bg-transparent p-0"
          aria-label="Event color code"
        />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#1D4ED8"
          className="h-10 flex-1 border-0 bg-transparent px-0 font-mono text-xs shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}

function EventLogoUrlField({
  id,
  value,
  onChange,
  onPreview,
}: Readonly<{
  id: string
  value: string
  onChange: (value: string) => void
  onPreview: (value: string) => void
}>) {
  const previewUrl = value.trim()

  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Logo URL</Label>
      <div className="flex gap-3">
        <div className="relative min-w-0 flex-1">
          <ImageIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/40" />
          <Input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://..."
            className="h-12 bg-white/5 border-white/10 rounded-xl pl-11"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={!previewUrl}
          onClick={() => onPreview(previewUrl)}
          className="h-12 w-12 shrink-0 rounded-xl border-white/10 bg-white/5 p-0 hover:bg-primary/10 hover:text-primary"
          title="Preview logo"
          aria-label="Preview event logo"
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EventHtmlField({
  id,
  value,
  onChange,
}: Readonly<{
  id: string
  value: string
  onChange: (value: string) => void
}>) {
  return (
    <div className="space-y-2.5">
      <Label htmlFor={id} className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
        Registration Confirmed Message HTML
      </Label>
      <div id={id} className="event-rich-text min-h-64 rounded-xl border border-white/10 bg-white">
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={{
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ align: [] }],
              ["link", "clean"],
            ],
          }}
        />
      </div>
      <style jsx global>{`
        .event-rich-text .ql-toolbar {
          border: 0;
          border-bottom: 1px solid hsl(var(--border));
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
          background: hsl(var(--muted) / 0.25);
        }
        .event-rich-text .ql-container {
          min-height: 14rem;
          border: 0;
          font-size: 0.875rem;
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
        }
        .event-rich-text .ql-editor {
          min-height: 14rem;
          color: hsl(var(--foreground));
        }
        .event-rich-text .ql-editor *,
        .event-rich-text .ql-editor a {
          color: hsl(var(--foreground)) !important;
        }
      `}</style>
    </div>
  )
}

export function EventSettings({ projectUuid }: Readonly<EventSettingsProps>) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('')

  // Create form state
  const [newEvent, setNewEvent] = useState<EventFormState>(emptyEventForm())

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    eventName: '',
    eventCode: '',
    isActive: 'all'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter events based on search and column filters
  const filteredEvents = events.filter(event => {
    // Global search
    const matchesSearch = !searchQuery ||
      event.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (event.event_code && event.event_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (event.event_color_code && event.event_color_code.toLowerCase().includes(searchQuery.toLowerCase()))

    // Column specific filters
    const matchesEventName = !columnFilters.eventName ||
      (event.event_name && event.event_name.toLowerCase().includes(columnFilters.eventName.toLowerCase()))

    const matchesEventCode = !columnFilters.eventCode ||
      (event.event_code && event.event_code.toLowerCase().includes(columnFilters.eventCode.toLowerCase()))

    const matchesStatus = columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && event.is_active) ||
      (columnFilters.isActive === 'inactive' && !event.is_active)

    return matchesSearch && matchesEventName && matchesEventCode && matchesStatus
  })

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

  // Handle column filter change and reset pagination
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setColumnFilters({
      eventName: '',
      eventCode: '',
      isActive: 'all'
    })
    setSearchQuery('')
    setCurrentPage(1)
    setShowFilters(false)
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
      setNewEvent(emptyEventForm())
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
      event_color_code: editingEvent.event_color_code || '',
      event_logo_url: editingEvent.event_logo_url || '',
      event_registration_confirmed_message_html: editingEvent.event_registration_confirmed_message_html || '',
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
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse font-bold tracking-widest uppercase">Syncing timeline...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Event Management</CardTitle>
              <CardDescription className="font-medium">Manage events for this project.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search events..."
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
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Event Name</Label>
                  <Input
                    placeholder="Filter by event name..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.eventName}
                    onChange={e => handleColumnFilterChange('eventName', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Event Code</Label>
                  <Input
                    placeholder="Filter by event code..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.eventCode}
                    onChange={e => handleColumnFilterChange('eventCode', e.target.value)}
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
            {filteredEvents.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">
                {searchQuery ? "No matching results found." : "No events found. Click \"Add Event\" to create one."}
              </div>
            ) : (
              paginatedEvents.map((event) => (
                <div key={event.event_uuid} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/40" />
                        {event.event_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-mono tracking-tighter">
                          {event.event_code || '---'}
                        </code>
                        <span className="text-[10px] font-mono font-bold text-primary/60">ORDER: {event.order_index}</span>
                      </div>
                      {(event.event_color_code || event.event_logo_url) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {event.event_color_code && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: normalizeColor(event.event_color_code) }} />
                              {event.event_color_code}
                            </span>
                          )}
                          {event.event_logo_url && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              <ImageIcon className="h-3 w-3" />
                              Logo
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <Badge className={cn("rounded-full px-3 text-[10px] font-bold", event.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                      {event.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 px-4" onClick={() => setEditingEvent(event)}>
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
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Event Name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Event Code</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Branding</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Order</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                    <TableHead className="pl-6 py-2">
                      <Input
                        placeholder="Filter event..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.eventName}
                        onChange={e => handleColumnFilterChange('eventName', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter code..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.eventCode}
                        onChange={e => handleColumnFilterChange('eventCode', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2"></TableHead>
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
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">
                      {searchQuery ? "No matching results found." : "No events found. Click \"Add Event\" to create one."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEvents.map((event) => (
                    <TableRow key={event.event_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary/40" />
                          {event.event_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">
                          {event.event_code || '---'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {event.event_color_code && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              <span className="h-2.5 w-2.5 rounded-full border border-white/20" style={{ backgroundColor: normalizeColor(event.event_color_code) }} />
                              {event.event_color_code}
                            </span>
                          )}
                          {event.event_logo_url && (
                            <span title={event.event_logo_url} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                              <ImageIcon className="h-3 w-3" />
                              Logo
                            </span>
                          )}
                          {!event.event_color_code && !event.event_logo_url && (
                            <span className="text-[10px] font-mono font-bold opacity-40">---</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-mono font-bold opacity-40">{event.order_index}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", event.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                          {event.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" onClick={() => setEditingEvent(event)}>
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
          {filteredEvents.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
              <div className="text-sm text-muted-foreground italic font-medium">
                Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredEvents.length)}</span> of <span className="text-foreground font-bold">{filteredEvents.length}</span> results
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
        <DialogContent className="glass max-h-[90vh] overflow-y-auto sm:max-w-[760px] border-white/10 rounded-3xl shadow-2xl p-0">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Add New Event</DialogTitle>
                <DialogDescription className="font-medium italic">Create a new event for this project.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 grid gap-6">
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Name</Label>
              <Input value={newEvent.event_name} onChange={(e) => setNewEvent({ ...newEvent, event_name: e.target.value })} placeholder="e.g. ILDEX Vietnam 2026" className="h-12 bg-white/5 border-white/10 rounded-xl" />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <EventColorField
                id="create-event-color-code"
                value={newEvent.event_color_code}
                onChange={(value) => setNewEvent({ ...newEvent, event_color_code: value })}
              />
              <EventLogoUrlField
                id="create-event-logo-url"
                value={newEvent.event_logo_url}
                onChange={(value) => setNewEvent({ ...newEvent, event_logo_url: value })}
                onPreview={setLogoPreviewUrl}
              />
            </div>
            <EventHtmlField
              id="create-event-registration-confirmed-message"
              value={newEvent.event_registration_confirmed_message_html}
              onChange={(value) => setNewEvent({ ...newEvent, event_registration_confirmed_message_html: value })}
            />
            <div className="space-y-2.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Order Index</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                <Input type="number" value={newEvent.order_index} onChange={(e) => setNewEvent({ ...newEvent, order_index: parseInt(e.target.value) || 1 })} className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
              <Label className="text-xs font-bold uppercase tracking-tight">Active Status</Label>
              <Switch checked={newEvent.is_active} onCheckedChange={(v) => setNewEvent({ ...newEvent, is_active: v })} />
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Create Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="glass max-h-[90vh] overflow-y-auto sm:max-w-[760px] border-white/10 rounded-3xl shadow-2xl p-0">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Edit className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Edit Event</DialogTitle>
                <DialogDescription className="font-medium italic">Update event details for <span className="text-foreground font-bold">{editingEvent?.event_name}</span>.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingEvent && (
            <div className="p-8 grid gap-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Name</Label>
                <Input value={editingEvent.event_name} onChange={(e) => setEditingEvent({ ...editingEvent, event_name: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <EventColorField
                  id="edit-event-color-code"
                  value={editingEvent.event_color_code || ''}
                  onChange={(value) => setEditingEvent({ ...editingEvent, event_color_code: value })}
                />
                <EventLogoUrlField
                  id="edit-event-logo-url"
                  value={editingEvent.event_logo_url || ''}
                  onChange={(value) => setEditingEvent({ ...editingEvent, event_logo_url: value })}
                  onPreview={setLogoPreviewUrl}
                />
              </div>
              <EventHtmlField
                id="edit-event-registration-confirmed-message"
                value={editingEvent.event_registration_confirmed_message_html || ''}
                onChange={(value) => setEditingEvent({ ...editingEvent, event_registration_confirmed_message_html: value })}
              />
              <div className="space-y-2.5">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Order Index</Label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                  <Input type="number" value={editingEvent.order_index} onChange={(e) => setEditingEvent({ ...editingEvent, order_index: parseInt(e.target.value) || 1 })} className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
                <Label className="text-xs font-bold uppercase tracking-tight">Active Status</Label>
                <Switch checked={editingEvent.is_active} onCheckedChange={(v) => setEditingEvent({ ...editingEvent, is_active: v })} />
              </div>
            </div>
          )}
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setEditingEvent(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Power className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!logoPreviewUrl} onOpenChange={(open) => !open && setLogoPreviewUrl('')}>
        <DialogContent className="glass sm:max-w-3xl border-white/10 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-bold">Event Logo Preview</DialogTitle>
            <DialogDescription className="break-all font-medium">{logoPreviewUrl}</DialogDescription>
          </DialogHeader>
          <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-6">
            {logoPreviewUrl ? (
              <img
                src={logoPreviewUrl}
                alt="Event logo preview"
                className="max-h-[60vh] w-auto max-w-full object-contain"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No logo URL to preview.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
