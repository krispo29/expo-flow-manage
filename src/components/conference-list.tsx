'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { Conference, getConferenceLogs, ConferenceLog, toggleConferenceActive, getRooms as getAdminRooms, Room } from '@/app/actions/conference'
import { getOrganizerConferenceLogs, toggleOrganizerConferenceActive, getOrganizerRooms } from '@/app/actions/organizer-conference'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, Clock, Users, Pencil, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, History, Loader2, CalendarDays, User, ArrowRight, ShieldCheck, Power, Info } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface ConferenceListProps {
  conferences: Conference[]
  projectId: string
  userRole?: string
}

export function ConferenceList({ conferences: initialConferences, projectId, userRole }: Readonly<ConferenceListProps>) {
  const isOrganizer = userRole === 'ORGANIZER'
  const router = useRouter()

  // Deduplicate conferences based on conference_uuid to prevent key collisions
  const conferences = Array.from(
    new Map(initialConferences.map(c => [c.conference_uuid, c])).values()
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewConference, setPreviewConference] = useState<Conference | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [rooms, setRooms] = useState<Room[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  
  // Logs state
  const [logsConference, setLogsConference] = useState<Conference | null>(null)
  const [logs, setLogs] = useState<ConferenceLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [togglingConferenceUuid, setTogglingConferenceUuid] = useState<string | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredConferences = conferences.filter(conf => {
    const matchesSearch = 
      conf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.speaker_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.speaker_info?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const confDate = conf.show_date
    const matchesStartDate = !startDate || confDate >= startDate
    const matchesEndDate = !endDate || confDate <= endDate

    return matchesSearch && matchesStartDate && matchesEndDate
  })

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredConferences.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedConferences = filteredConferences.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Group PAGINATED conferences by date
  const groupedConferences = paginatedConferences.reduce((acc, conf) => {
    const dateKey = conf.show_date
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(conf)
    return acc
  }, {} as Record<string, Conference[]>)

  // Sort dates
  const sortedDates = Object.keys(groupedConferences).sort((a, b) => a.localeCompare(b))
  
  function handleSearchChange(query: string) {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  function handleDateChange(type: 'start' | 'end', value: string) {
    if (type === 'start') setStartDate(value)
    else setEndDate(value)
    setCurrentPage(1)
  }

  function clearFilters() {
    setSearchQuery('')
    setStartDate('')
    setEndDate('')
  }

  async function handleViewLogs(conference: Conference) {
    setLogsConference(conference)
    setLoadingLogs(true)
    setLogs([])
    
    try {
      const result = isOrganizer
        ? await getOrganizerConferenceLogs(conference.conference_uuid)
        : await getConferenceLogs(conference.conference_uuid)
      if (result.success && result.data) {
        setLogs(result.data)
      } else {
        toast.error('Failed to load conference logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('An error occurred while fetching logs')
    } finally {
      setLoadingLogs(false)
    }
  }

  async function handleToggleActive(conferenceUuid: string, nextIsActive: boolean) {
    setTogglingConferenceUuid(conferenceUuid)

    try {
      const result = isOrganizer
        ? await toggleOrganizerConferenceActive(conferenceUuid, nextIsActive)
        : await toggleConferenceActive(conferenceUuid, nextIsActive)
      if (result.success) {
        toast.success('Conference active status updated')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to toggle active status')
      }
    } catch (error) {
      console.error('Error toggling conference active:', error)
      toast.error('Failed to toggle active status')
    } finally {
      setTogglingConferenceUuid(null)
    }
  }

  useEffect(() => {
    async function fetchRooms() {
      setLoadingRooms(true)
      try {
        const result = isOrganizer ? await getOrganizerRooms() : await getAdminRooms()
        if (result.success && result.data) {
          setRooms(result.data)
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [isOrganizer, projectId])

  if (conferences.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <CalendarDays className="h-10 w-10 text-primary/60" />
        </div>
        <h2 className="text-2xl font-display font-bold">No Conferences Found</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">Get started by creating your first session or schedule for the event.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2 group">
              <Label htmlFor="search" className="text-sm font-bold flex items-center gap-2 group-focus-within:text-primary transition-colors">
                <Search className="size-4" />
                Search Conference
              </Label>
              <Input 
                id="search"
                placeholder="Topic, Room, Details..." 
                className="h-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-bold">Start Date</Label>
              <Input 
                id="startDate"
                type="date"
                className="h-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-bold">End Date</Label>
              <Input 
                id="endDate"
                type="date"
                className="h-11 bg-white/5 border-white/10 rounded-xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>
          
          {(searchQuery || startDate || endDate) && (
            <div className="flex justify-end pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters} 
                className="rounded-full px-6 h-10 border-white/10 bg-white/5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
              >
                <X className="size-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
        <div className="text-sm text-muted-foreground italic font-medium">
          Showing <span className="text-foreground">{filteredConferences.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredConferences.length)}</span> of <span className="text-foreground font-bold">{filteredConferences.length}</span> results
        </div>
        {filteredConferences.length > itemsPerPage && (
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" onClick={() => goToPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1 mx-1">
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
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-full bg-white/5 border-white/10" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {filteredConferences.length === 0 ? (
        <div className="text-center py-20 glass rounded-3xl">
          <p className="text-muted-foreground font-medium italic">No results matching your search terms.</p>
        </div>
      ) : (
        <div className="space-y-12">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-6">
            <div className="sticky top-0 z-10 py-3 backdrop-blur-md bg-background/50 border-b border-white/10">
              <h2 className="text-2xl font-display font-bold bg-gradient-to-r from-primary/80 to-primary/40 bg-clip-text text-transparent">
                {format(new Date(dateKey), 'EEEE, MMMM do, yyyy')}
              </h2>
            </div>
            
            <div className="grid gap-6">
              {groupedConferences[dateKey].map((conference) => {
                return (
                  <Card key={conference.conference_uuid} className="glass overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 group/card">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row min-w-0">
                        <div className="flex-1 p-6 flex flex-col justify-between min-w-0">
                          <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 min-w-0">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-display font-bold text-xl leading-tight group-hover/card:text-primary transition-colors break-all">{conference.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2 font-medium">
                                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                    <Clock className="h-3.5 w-3.5 text-primary/60" />
                                    {conference.start_time?.substring(0, 5)} - {conference.end_time?.substring(0, 5)}
                                  </span>
                                  <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                                    <Users className="h-3.5 w-3.5 text-primary/60" />
                                    {conference.remaining_seats} <span className="opacity-40">/</span> {conference.quota} seats
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                <Badge variant="secondary" className="rounded-full px-3 py-0.5 capitalize border-white/5 font-bold text-[10px]">
                                  {conference.conference_type}
                                </Badge>
                                {conference.charge_type && (
                                  <Badge variant="outline" className="rounded-full px-3 py-0.5 capitalize border-white/10 font-bold text-[10px]">
                                    {conference.charge_type}
                                  </Badge>
                                )}
                                <Badge 
                                  variant={conference.status === 'available' ? 'default' : 'destructive'} 
                                  className={cn("rounded-full px-3 py-0.5 capitalize font-bold text-[10px]", conference.status === 'available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : '')}
                                >
                                  {conference.status}
                                </Badge>
                                <Badge
                                  className={cn(
                                    "rounded-full px-3 py-0.5 font-bold text-[10px] border",
                                    conference.is_active
                                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                      : 'bg-red-500/10 text-red-500 border-red-500/20'
                                  )}
                                >
                                  <span className={cn("inline-block size-1.5 rounded-full mr-1.5", conference.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500')} />
                                  {conference.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>

                            <div className="pt-2 space-y-4">
                              {conference.speakers && conference.speakers.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                  {conference.speakers.map((s, idx) => (
                                    <div key={idx} className="flex gap-4 items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                                      {s.speaker_image && (
                                        <div 
                                          className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-primary/20 bg-muted cursor-pointer hover:scale-110 transition-transform"
                                          onClick={() => setZoomedImage(s.speaker_image!)}
                                        >
                                          <img src={s.speaker_image} alt={s.speaker_name} className="h-full w-full object-cover" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="font-bold text-[10px] text-primary/60 uppercase tracking-widest">Speaker {conference.speakers!.length > 1 ? idx + 1 : ''}</p>
                                        <p className="text-foreground font-bold text-sm line-clamp-1 break-all">{s.speaker_name}</p>
                                        {s.speaker_info && (
                                          <p className="text-muted-foreground text-[11px] font-medium line-clamp-1 break-all">{s.speaker_info}</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {conference.speaker_name && (
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                      <p className="font-bold text-[10px] text-primary/60 uppercase tracking-widest">Speaker</p>
                                      <p className="text-foreground font-bold text-sm line-clamp-1">{conference.speaker_name}</p>
                                    </div>
                                  )}
                                  {conference.speaker_info && (
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                      <p className="font-bold text-[10px] text-primary/60 uppercase tracking-widest">Speaker Information</p>
                                      <p className="text-foreground font-medium text-xs line-clamp-2 break-all">{conference.speaker_info}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {conference.detail && (
                              <div className="mt-4 pt-4 border-t border-dashed border-white/10">
                                <p className="font-bold text-[10px] text-primary/40 uppercase tracking-widest mb-2">Description</p>
                                <div className="text-sm text-muted-foreground/80 leading-relaxed italic break-all">
                                  <div
                                    className="prose prose-sm max-w-none dark:prose-invert ql-editor !p-0 line-clamp-2 break-all"
                                    dangerouslySetInnerHTML={{ __html: conference.detail }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap justify-end gap-2 mt-6 pt-4 border-t border-white/5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleViewLogs(conference)}
                              className="rounded-full px-4 h-9 bg-amber-500/5 text-amber-500 hover:bg-amber-500/10"
                            >
                              <History className="h-3.5 w-3.5 mr-2" />
                              Logs
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setPreviewConference(conference)}
                              className="rounded-full px-4 h-9 bg-white/5 border border-white/10 hover:bg-primary/5 hover:text-primary"
                            >
                              <Eye className="h-3.5 w-3.5 mr-2" />
                              Details
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(conference.conference_uuid, !conference.is_active)}
                              disabled={togglingConferenceUuid === conference.conference_uuid}
                              className={cn(
                                "rounded-full px-4 h-9 transition-all duration-300",
                                conference.is_active
                                  ? 'bg-red-500/5 text-red-500 hover:bg-red-500/10'
                                  : 'bg-emerald-500/5 text-emerald-500 hover:bg-emerald-500/10'
                              )}
                            >
                              {togglingConferenceUuid === conference.conference_uuid ? (
                                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                              ) : (
                                <Power className={cn("h-3.5 w-3.5 mr-2", conference.is_active ? 'text-red-500' : 'text-emerald-500')} />
                              )}
                              {conference.is_active ? 'Deactivate' : 'Activate'}
                            </Button>

                            <Link href={`/${isOrganizer ? 'organizer' : 'admin'}/conferences/${conference.conference_uuid}?projectId=${conference.project_uuid || projectId}`}>
                              <Button variant="ghost" size="sm" className="rounded-full px-4 h-9 bg-primary/5 text-primary hover:bg-primary/10">
                                <Pencil className="h-3.5 w-3.5 mr-2" />
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!previewConference} onOpenChange={() => setPreviewConference(null)}>
        <DialogContent className="glass max-w-4xl max-h-[90vh] overflow-y-auto sm:max-w-4xl border-white/10 rounded-3xl shadow-2xl">
          {previewConference && (
            <>
              <DialogHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pr-8 min-w-0">
                  <div className="min-w-0">
                    <DialogTitle className="text-3xl font-display font-bold leading-tight break-all">{previewConference.title}</DialogTitle>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                        <CalendarDays className="h-4 w-4 text-primary/60" />
                        {format(new Date(previewConference.show_date), 'MMMM do, yyyy')}
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full">
                        <Clock className="h-4 w-4 text-primary/60" />
                        {previewConference.start_time?.substring(0, 5)} - {previewConference.end_time?.substring(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-8 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Status & Type</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary" className="rounded-full px-4 py-1 capitalize font-bold text-[10px]">
                            {previewConference.conference_type}
                          </Badge>
                          {previewConference.charge_type && (
                            <Badge variant="outline" className="rounded-full px-4 py-1 capitalize font-bold text-[10px]">
                              {previewConference.charge_type}
                            </Badge>
                          )}
                          <Badge 
                            variant={previewConference.status === 'available' ? 'default' : 'destructive'} 
                            className={cn("rounded-full px-4 py-1 capitalize font-bold text-[10px]", previewConference.status === 'available' ? 'bg-green-500/10 text-green-500' : '')}
                          >
                          {previewConference.status}
                        </Badge>
                        {previewConference.can_book && <Badge variant="outline" className="rounded-full px-4 py-1 font-bold text-[10px]">Can Book</Badge>}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Capacity Metrics</p>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="flex items-center gap-2 text-sm font-bold">
                            <Users className="h-4 w-4 text-primary/60" />
                            Remaining Seats
                          </p>
                          <p className="text-xl font-display font-bold text-primary">{previewConference.remaining_seats} <span className="text-sm font-sans text-muted-foreground opacity-40">/ {previewConference.quota}</span></p>
                        </div>
                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-primary h-full transition-all duration-500" 
                            style={{ width: `${Math.min(100, (1 - previewConference.remaining_seats / (previewConference.quota || 1)) * 100)}%` }} 
                          />
                        </div>
                        <p className="text-xs text-muted-foreground font-medium text-right">
                          {previewConference.reserved_count} reservations confirmed
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest">Location Info</p>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          {loadingRooms ? <Loader2 className="h-6 w-6 animate-spin" /> : <Info className="h-6 w-6" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-tight break-all">
                            {loadingRooms ? 'Loading room details...' : (rooms.find(r => r.room_uuid === previewConference.location)?.room_name || 'Session Room/Venue')}
                          </p>
                          <p className="text-muted-foreground text-sm font-medium mt-1 break-all">
                            {loadingRooms ? 'Please wait' : (rooms.find(r => r.room_uuid === previewConference.location)?.location_detail || 'Check event floor plan for directions.')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {previewConference.detail && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Separator className="flex-1 bg-white/10" />
                      <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest shrink-0">Session Details</p>
                      <Separator className="flex-1 bg-white/10" />
                    </div>
                    <div className="bg-white/5 rounded-3xl border border-white/5 p-6 shadow-inner break-all">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert ql-editor !p-0 font-medium leading-relaxed break-all"
                        dangerouslySetInnerHTML={{ __html: previewConference.detail }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1 bg-white/10" />
                    <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest shrink-0">Speaker Roster</p>
                    <Separator className="flex-1 bg-white/10" />
                  </div>
                  {previewConference.speakers && previewConference.speakers.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      {previewConference.speakers.map((s, idx) => (
                        <div key={idx} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex gap-4 transition-all hover:bg-white/10 group">
                          {s.speaker_image && (
                            <div 
                              className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted cursor-pointer hover:scale-105 transition-all"
                              onClick={() => setZoomedImage(s.speaker_image!)}
                            >
                              <img src={s.speaker_image} alt={s.speaker_name} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-foreground font-bold text-lg group-hover:text-primary transition-colors break-all">{s.speaker_name}</p>
                            {s.speaker_info && (
                              <p className="text-muted-foreground text-xs mt-1.5 whitespace-pre-wrap leading-relaxed line-clamp-3 font-medium italic break-all">
                                &ldquo;{s.speaker_info}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">Lead Speaker</p>
                        <p className="text-foreground font-bold italic break-all">
                          {previewConference.speaker_name || 'No speaker assigned'}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5 min-w-0">
                        <p className="text-[10px] font-bold text-primary/40 uppercase tracking-widest mb-1">Biography</p>
                        <p className="text-muted-foreground text-xs font-medium italic line-clamp-3 leading-relaxed break-all">
                          {previewConference.speaker_info || 'No speaker information provided.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-white/10">
                <Button variant="outline" className="rounded-full px-8 h-11 border-white/10 bg-white/5" onClick={() => setPreviewConference(null)}>
                  Close
                </Button>
                <Link href={`/${isOrganizer ? 'organizer' : 'admin'}/conferences/${previewConference.conference_uuid}?projectId=${previewConference.project_uuid || projectId}`}>
                  <Button className="btn-aurora rounded-full px-8 h-11 font-bold">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Session
                  </Button>
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={!!logsConference} onOpenChange={(open) => !open && setLogsConference(null)}>
        <DialogContent className="glass sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-white/10 rounded-3xl shadow-2xl">
          <DialogHeader className="p-8 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                <History className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Session Activity Logs</DialogTitle>
                <DialogDescription className="text-sm font-medium text-muted-foreground line-clamp-1 mt-0.5 italic">
                  Tracking events for: {logsConference?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="mx-8 w-auto bg-white/10" />

          <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-hide">
            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-bold tracking-widest uppercase">Fetching history...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-20 space-y-4 glass rounded-3xl mx-4">
                <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-white/10 mb-2">
                  <History className="h-8 w-8 text-primary/20" />
                </div>
                <p className="text-muted-foreground font-bold">No activity logs found for this session.</p>
                <p className="text-xs text-muted-foreground/60 italic px-10">Activity will be automatically recorded here when participants register, check-in, or cancel.</p>
              </div>
            ) : (
              <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                {logs.map((log, index) => (
                  <div key={log.log_id || index} className="relative group/log">
                    {/* Timeline Node */}
                    <div className={cn(
                      "absolute -left-[35px] top-1.5 h-6 w-6 rounded-full border-4 border-background shadow-lg z-10 transition-all group-hover/log:scale-125",
                      log.action === 'RESERVE' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                    )} />
                    
                    <div className="space-y-4">
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary/40">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {format(new Date(log.created_at), 'MMM d, yyyy • HH:mm:ss')}
                        </div>
                        <Badge className={cn(
                          "px-3 py-0.5 rounded-full text-[9px] font-black tracking-tighter border-0",
                          log.action === 'RESERVE' 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-rose-500/10 text-rose-500'
                        )}>
                          {log.action}
                        </Badge>
                      </div>

                      {/* Content Card */}
                      <div className="bg-white/5 rounded-2xl border border-white/5 p-5 space-y-4 hover:bg-white/10 transition-all shadow-lg hover:shadow-primary/5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">
                                {log.attendee_name || 'Unknown Attendee'}
                              </p>
                              <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck className="h-3 w-3 text-primary/40" />
                                Action by: <span className="font-bold text-primary/80 uppercase">{log.performed_by}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {log.details && (
                          <div className="bg-background/40 rounded-xl p-3 border border-white/5 flex items-start gap-3">
                            <ArrowRight className="h-3 w-3 mt-1 text-primary/40 shrink-0" />
                            <p className="text-xs text-muted-foreground/80 italic font-medium leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        )}
                        
                        <div className="text-[9px] text-muted-foreground/30 font-mono text-right tracking-tighter uppercase">
                          REC_ID: {log.registration_uuid}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-6 bg-white/5 border-t border-white/10 flex justify-end">
            <Button variant="outline" className="rounded-full h-10 px-8 font-bold text-xs uppercase tracking-widest bg-white/5 border-white/10" onClick={() => setLogsConference(null)}>
              Close History
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-3xl flex justify-center items-center bg-transparent border-none shadow-none p-0 overflow-hidden backdrop-blur-3xl" showCloseButton={false}>
          <div className="sr-only">
            <DialogTitle>Speaker Image Preview</DialogTitle>
            <DialogDescription>Full size preview of the speaker image.</DialogDescription>
          </div>
          {zoomedImage && (
            <div className="relative w-auto h-auto max-w-full max-h-[90vh] animate-in zoom-in-95 duration-300">
              <img src={zoomedImage} alt="Zoomed in" className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl border-4 border-white/10" />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/20 h-10 w-10 text-white"
                onClick={() => setZoomedImage(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
