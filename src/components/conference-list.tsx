'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Conference, getConferenceLogs, ConferenceLog } from '@/app/actions/conference'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, Clock, Users, Pencil, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, History, Loader2, CalendarDays, User, ArrowRight, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator'

interface ConferenceListProps {
  conferences: Conference[]
  projectId: string
}

export function ConferenceList({ conferences: initialConferences, projectId }: Readonly<ConferenceListProps>) {
  
  // Deduplicate conferences based on conference_uuid to prevent key collisions
  const conferences = Array.from(
    new Map(initialConferences.map(c => [c.conference_uuid, c])).values()
  )

  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewConference, setPreviewConference] = useState<Conference | null>(null)
  
  // Logs state
  const [logsConference, setLogsConference] = useState<Conference | null>(null)
  const [logs, setLogs] = useState<ConferenceLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

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
      const result = await getConferenceLogs(conference.conference_uuid)
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

  if (conferences.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No Conferences found. Click &quot;Add Conference&quot; to create a new one.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="search" className="text-sm font-semibold flex items-center gap-2">
              <Search className="size-4 text-primary" />
              Search Conference
            </Label>
            <Input 
              id="search"
              placeholder="Topic, Room, Details..." 
              className="h-10 bg-background border-border/50 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-sm font-semibold">Start Date</Label>
            <Input 
              id="startDate"
              type="date"
              className="h-10 bg-background border-border/50 focus-visible:ring-primary"
              value={startDate}
              onChange={(e) => handleDateChange('start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-sm font-semibold">End Date</Label>
            <Input 
              id="endDate"
              type="date"
              className="h-10 bg-background border-border/50 focus-visible:ring-primary"
              value={endDate}
              onChange={(e) => handleDateChange('end', e.target.value)}
            />
          </div>
        </div>
        
        {(searchQuery || startDate || endDate) && (
          <div className="flex justify-end pt-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearFilters} 
              className="h-9 px-4 text-sm hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <X className="size-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{filteredConferences.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredConferences.length)}</span> of <span className="font-medium">{filteredConferences.length}</span> results
        </div>
        {filteredConferences.length > itemsPerPage && (
          <div className="flex items-center gap-1 text-sm">
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
                      className="h-8 w-8 text-xs font-medium"
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
        )}
      </div>

      {filteredConferences.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No results found for your search.
        </div>
      ) : (
        <div className="space-y-8">
        {sortedDates.map((dateKey) => (
          <div key={dateKey} className="space-y-4">
            <h2 className="text-xl font-semibold sticky top-0 bg-background py-2 z-10 border-b">
              {format(new Date(dateKey), 'EEEE, MMMM do, yyyy')}
            </h2>
            <div className="grid gap-4">
              {groupedConferences[dateKey].map((conference) => {
                return (
                  <Card key={conference.conference_uuid} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{conference.title}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {conference.start_time?.substring(0, 5)} - {conference.end_time?.substring(0, 5)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {conference.remaining_seats}/{conference.quota} seats
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                <Badge variant={conference.conference_type === 'public' ? 'secondary' : 'outline'}>
                                  {conference.conference_type}
                                </Badge>
                                <Badge variant={conference.status === 'available' ? 'default' : 'destructive'}>
                                  {conference.status}
                                </Badge>
                                {conference.can_book && <Badge variant="outline">Can Book</Badge>}
                              </div>
                            </div>

                            <div className="pt-3 space-y-3">
                              {conference.speaker_name && (
                                <div className="text-sm">
                                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-1">Speaker</p>
                                  <p className="text-foreground/90 line-clamp-1">{conference.speaker_name}</p>
                                </div>
                              )}
                              {conference.speaker_info && (
                                <div className="text-sm">
                                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-1">Speaker Information</p>
                                  <p className="text-foreground/90 line-clamp-2">{conference.speaker_info}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleViewLogs(conference)}
                              className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-300"
                            >
                              <History className="h-4 w-4 mr-2" />
                              Logs
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPreviewConference(conference)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/conferences/${conference.conference_uuid}?projectId=${projectId}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </Button>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {previewConference && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start pr-8">
                  <div>
                    <DialogTitle className="text-2xl font-bold">{previewConference.title}</DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {previewConference.start_time?.substring(0, 5)} - {previewConference.end_time?.substring(0, 5)}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={previewConference.conference_type === 'public' ? 'secondary' : 'outline'}>
                          {previewConference.conference_type}
                        </Badge>
                        <Badge variant={previewConference.status === 'available' ? 'default' : 'destructive'}>
                          {previewConference.status}
                        </Badge>
                        {previewConference.can_book && <Badge variant="outline">Can Book</Badge>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Capacity</p>
                      <p className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {previewConference.remaining_seats}/{previewConference.quota} seats available
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Reserved: {previewConference.reserved_count}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Schedule</p>
                      <p className="flex items-center gap-2 text-sm">
                        {format(new Date(previewConference.show_date), 'EEEE, MMMM do, yyyy')}
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        {previewConference.start_time?.substring(0, 5)} - {previewConference.end_time?.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Speaker</p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-foreground font-medium">
                      {previewConference.speaker_name || 'No speaker assigned'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Speaker Information</p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {previewConference.speaker_info || 'No speaker information provided.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setPreviewConference(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/conferences/${previewConference.conference_uuid}?projectId=${projectId}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Conference
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Logs Modal */}
      <Dialog open={!!logsConference} onOpenChange={(open) => !open && setLogsConference(null)}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-full">
                <History className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Conference Logs</DialogTitle>
                <DialogDescription className="text-sm font-medium text-slate-500 line-clamp-1">
                  {logsConference?.title}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Separator className="mx-6 w-auto" />

          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Fetching history...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto border border-slate-100 mb-2">
                  <History className="h-8 w-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium">No activity logs found for this conference.</p>
                <p className="text-xs text-slate-400">Activity will appear here when participants register or cancel.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                {logs.map((log, index) => (
                  <div key={log.log_id || index} className="relative">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[31px] top-1 h-5 w-5 rounded-full border-4 border-white shadow-sm z-10 ${
                      log.action === 'RESERVE' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    
                    <div className="space-y-3">
                      {/* Meta Info */}
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3 w-3" />
                          {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                        </div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] ${
                          log.action === 'RESERVE' 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-rose-100 text-rose-700 border border-rose-200'
                        }`}>
                          {log.action}
                        </div>
                      </div>

                      {/* Content Card */}
                      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="bg-slate-100 p-1.5 rounded-lg">
                              <User className="h-4 w-4 text-slate-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-none mb-1">
                                {log.attendee_name || 'Unknown Attendee'}
                              </p>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Performed by: <span className="font-semibold text-slate-700">{log.performed_by}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {log.details && (
                          <div className="bg-slate-50/80 rounded-lg p-2.5 border border-dashed border-slate-200 flex items-start gap-2">
                            <ArrowRight className="h-3 w-3 mt-0.5 text-slate-400 shrink-0" />
                            <p className="text-xs text-slate-600 italic leading-relaxed">
                              {log.details}
                            </p>
                          </div>
                        )}
                        
                        <div className="text-[10px] text-slate-400 font-mono overflow-hidden text-ellipsis whitespace-nowrap">
                          ID: {log.registration_uuid}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <Button variant="ghost" className="h-9 px-6 font-semibold text-slate-600" onClick={() => setLogsConference(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

