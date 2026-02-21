'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import Link from 'next/link'
import { Conference } from '@/lib/mock-service'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search, X, Clock, MapPin, Users, Pencil, Trash2, Image as ImageIcon, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { deleteConference } from '@/app/actions/conference'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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

export function ConferenceList({ conferences, projectId }: Readonly<ConferenceListProps>) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [previewConference, setPreviewConference] = useState<Conference | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const filteredConferences = conferences.filter(conf => {
    const matchesSearch = 
      conf.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.room?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conf.detail?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const confDate = format(new Date(conf.date), 'yyyy-MM-dd')
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
    const dateKey = format(new Date(conf.date), 'yyyy-MM-dd')
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

  async function handleDelete(id: string) {
    toast("Delete this conference?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          const result = await deleteConference(id)
          if (result.success) {
            toast.success('Conference deleted')
            router.refresh()
          } else {
            toast.error('Failed to delete conference')
          }
        },
      },
    })
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
                  <Card key={conference.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="p-3 w-full md:w-52 shrink-0">
                          <div className="w-full md:w-48 aspect-video bg-muted relative overflow-hidden flex-shrink-0 border-r border-border/50">
                            {conference.photoUrl ? (
                              <img 
                                src={conference.photoUrl} 
                                alt={conference.topic}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                <ImageIcon className="size-8 opacity-20" />
                                <span className="text-xs font-medium opacity-50 uppercase tracking-wider">No Image</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{conference.topic}</h3>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {conference.startTime} - {conference.endTime}
                                  </span>
                                  {conference.room && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {conference.room}
                                    </span>
                                  )}
                                  {conference.capacity && (
                                    <span className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {conference.capacity} Limit Seats
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                {conference.isPublic ? (
                                  <Badge variant="secondary">Public</Badge>
                                ) : (
                                  <Badge variant="outline">Private</Badge>
                                )}
                                {conference.showOnReg && <Badge variant="default">Show on Registration</Badge>}
                                {conference.allowPreReg && <Badge variant="outline">Pre-Registration</Badge>}
                              </div>
                            </div>

                            <div className="pt-3 space-y-3">
                              {conference.detail && (
                                <div className="text-sm">
                                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-1">Description</p>
                                  <p className="text-foreground/90 line-clamp-2">{conference.detail}</p>
                                </div>
                              )}
                              {conference.speakerInfo && (
                                <div className="text-sm">
                                  <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wider mb-1">Speaker Information</p>
                                  <p className="text-foreground/90 line-clamp-1">{conference.speakerInfo}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setPreviewConference(conference)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/conferences/${conference.id}?projectId=${projectId}`}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(conference.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
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
                    <DialogTitle className="text-2xl font-bold">{previewConference.topic}</DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap gap-3">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {previewConference.startTime} - {previewConference.endTime}
                      </span>
                      {previewConference.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {previewConference.room}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {previewConference.photoUrl && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden border border-border bg-muted">
                    <img 
                      src={previewConference.photoUrl} 
                      alt={previewConference.topic}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
                      <div className="flex flex-wrap gap-2">
                        {previewConference.isPublic ? (
                          <Badge variant="secondary">Public</Badge>
                        ) : (
                          <Badge variant="outline">Private</Badge>
                        )}
                        {previewConference.showOnReg && <Badge variant="default">Show on Registration</Badge>}
                        {previewConference.allowPreReg && <Badge variant="outline">Pre-Registration</Badge>}
                      </div>
                    </div>

                    {previewConference.capacity && (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Capacity</p>
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-primary" />
                          {previewConference.capacity} Limit Seats
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location</p>
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {previewConference.room || 'Not specified'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Schedule</p>
                      <p className="flex items-center gap-2 text-sm">
                        {format(new Date(previewConference.date), 'EEEE, MMMM do, yyyy')}
                      </p>
                      <p className="flex items-center gap-2 font-medium">
                        {previewConference.startTime} - {previewConference.endTime}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <Separator />

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Description</p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {previewConference.detail || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Speaker Information</p>
                  <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {previewConference.speakerInfo || 'No speaker information provided.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setPreviewConference(null)}>
                  Close
                </Button>
                <Button asChild>
                  <Link href={`/admin/conferences/${previewConference.id}?projectId=${projectId}`}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Conference
                  </Link>
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

