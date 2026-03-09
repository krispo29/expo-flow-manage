'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChevronLeft, ChevronRight, CheckSquare, RefreshCw, Printer, CheckCircle2, XCircle } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getPrintLogs, getPrintedNoAttendance, generateAttendanceLogs } from '@/app/actions/participant'
import { getRooms, type Room } from '@/app/actions/settings'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export function PrintLogs({ projectId }: Readonly<{ projectId: string }>) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending'>('pending')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  
  // Pagination & Search
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)

  // Selection
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  
  // History Dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [historyLogs, setHistoryLogs] = useState<{created_at: string, created_by: string}[]>([])
  const [historyTargetName, setHistoryTargetName] = useState('')

  // Generate Attendance Dialog
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')

  // Fetch Rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const res = await getRooms(projectId)
      if (res.success) {
        setRooms(res.rooms)
      }
    }
    fetchRooms()
  }, [projectId])

  // Fetch Logs
  useEffect(() => {
    let active = true
    const doFetch = async () => {
      setLoading(true)
      const res = filterStatus === 'all' 
        ? await getPrintLogs(page, limit, keyword)
        : await getPrintedNoAttendance(page, limit, keyword)
        
      if (!active) return
      
      if (res.success) {
        setLogs(res.items || [])
        setTotal(res.total || 0)
        // Only clear selection if fetching a different view or page changes
        setSelectedCodes([])
      } else {
        toast.error(res.error || 'Failed to fetch logs')
      }
      setLoading(false)
    }
    
    doFetch()
    return () => { active = false }
  }, [page, limit, keyword, filterStatus, refreshCounter])

  // Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setKeyword(searchInput)
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  // Selection Handlers
  const toggleAll = () => {
    if (selectedCodes.length === logs.length && logs.length > 0) {
      setSelectedCodes([])
    } else {
      setSelectedCodes(logs.map(l => l.registration_code).filter(Boolean))
    }
  }

  const toggleOne = (code: string) => {
    setSelectedCodes(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  // Generate Handler
  const handleGenerate = async () => {
    if (!selectedRoom) {
      toast.error('Please select a room')
      return
    }
    if (!date || !startTime || !endTime) {
      toast.error('Please fill in date and time fields')
      return
    }
    if (selectedCodes.length === 0) {
      toast.error('No participants selected')
      return
    }

    setGenerating(true)
    const result = await generateAttendanceLogs({
      registration_codes: selectedCodes,
      room_uuid: selectedRoom,
      date,
      start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
      end_time: endTime.length === 5 ? `${endTime}:00` : endTime
    })

    setGenerating(false)
    if (result.success) {
      toast.success('Successfully generated attendance logs')
      setIsGenerateDialogOpen(false)
      setRefreshCounter(prev => prev + 1) // refetch
    } else {
      toast.error(result.error || 'Failed to generate logs')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader className="bg-muted/10 border-b pb-4">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Printer className="h-5 w-5 text-primary" />
                Print Logs
              </CardTitle>
              <CardDescription className="mt-1">
                View participants who printed badges and manage their check-in statuses.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 sm:p-6">
            
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 px-4 pt-4 sm:px-0 sm:pt-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by code, keyword..." 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 bg-background focus-visible:ring-primary shadow-sm"
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <Select 
                value={filterStatus} 
                onValueChange={(val: 'all' | 'pending') => {
                  setFilterStatus(val)
                  setPage(1)
                  setSearchInput('')
                  setKeyword('')
                }}
              >
                <SelectTrigger className="w-[220px] shadow-sm font-medium">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    Show All Printed Badges
                  </SelectItem>
                  <SelectItem value="pending">
                    Show Only Missing Attendance
                  </SelectItem>
                </SelectContent>
              </Select>

              {filterStatus === 'pending' && (
                <Button 
                  onClick={() => setIsGenerateDialogOpen(true)}
                  disabled={selectedCodes.length === 0}
                  className="shadow-sm shrink-0"
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Generate Check-in ({selectedCodes.length})
                </Button>
              )}

              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setRefreshCounter(prev => prev + 1)}
                title="Refresh"
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Unified Table */}
          <div className="border rounded-lg bg-background overflow-hidden relative shadow-sm mx-4 sm:mx-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {filterStatus === 'pending' && (
                      <TableHead className="w-12">
                        <Checkbox 
                          checked={logs.length > 0 && selectedCodes.length === logs.length}
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                    )}
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Company</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Position</TableHead>
                    {filterStatus === 'pending' && (
                      <>
                        <TableHead className="font-semibold text-center">Attendance</TableHead>
                        <TableHead className="font-semibold text-center">Hall</TableHead>
                        <TableHead className="font-semibold text-center">Conf</TableHead>
                        <TableHead className="font-semibold text-center">Active</TableHead>
                        <TableHead className="font-semibold text-center">Email</TableHead>
                        <TableHead className="font-semibold text-center">Conf Count</TableHead>
                      </>
                    )}
                    <TableHead className="font-semibold text-right">Print Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={filterStatus === 'pending' ? 12 : 5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary/60" />
                          <span className="text-sm text-muted-foreground">Loading logs...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={filterStatus === 'pending' ? 12 : 5} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <Printer className="h-10 w-10 opacity-20" />
                          <p>No print logs found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log, i) => {
                      return (
                        <TableRow key={log.print_log_uuid || log.registration_uuid || i} className="hover:bg-muted/30">
                          {filterStatus === 'pending' && (
                            <TableCell>
                              <Checkbox 
                                checked={selectedCodes.includes(log.registration_code)}
                                onCheckedChange={() => toggleOne(log.registration_code)}
                                aria-label={`Select ${log.registration_code}`}
                              />
                            </TableCell>
                          )}
                          <TableCell className="font-medium">{log.registration_code}</TableCell>
                          <TableCell>
                            <span className="font-medium text-foreground">{log.first_name} {log.last_name}</span>
                            <div className="text-xs text-muted-foreground md:hidden mt-0.5">{log.company_name}</div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{log.company_name}</TableCell>
                          <TableCell className="text-muted-foreground hidden lg:table-cell">{log.job_position || '-'}</TableCell>
                          {filterStatus === 'pending' && (
                            <>
                              <TableCell className="text-center">
                                {log.has_attendance ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-50" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.has_hall ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-50" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.has_conference ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-50" />
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.is_active ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] py-0">Active</Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-slate-50 text-slate-400 border-slate-200 text-[10px] py-0">Inactive</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.is_email_sent ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-50" />
                                )}
                              </TableCell>
                              <TableCell className="text-center font-mono text-xs">
                                {log.conference_count || 0}
                              </TableCell>
                            </>
                          )}
                          <TableCell className="text-right">
                            <Badge 
                              variant="secondary" 
                              className={`bg-slate-100 text-slate-700 border-0 font-medium ${filterStatus === 'all' ? 'hover:bg-slate-200 cursor-pointer' : ''}`}
                              onClick={() => {
                                if (filterStatus === 'all') {
                                  setHistoryLogs(log.print_history || [])
                                  setHistoryTargetName(`${log.first_name} ${log.last_name}`)
                                  setIsHistoryDialogOpen(true)
                                }
                              }}
                            >
                              <Printer className="w-3 h-3 mr-1 opacity-70" />
                              Printed ({log.print_count || 1})
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {!loading && logs.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t bg-muted/5 gap-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(page - 1) * limit + 1}</span> to{' '}
                  <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
                  <span className="font-medium text-foreground">{total}</span> logs
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </Button>
                  
                  <div className="flex items-center gap-1 min-w-[3rem] justify-center px-2">
                    <span className="text-sm font-medium">{page}</span>
                    <span className="text-sm text-muted-foreground mx-0.5">/</span>
                    <span className="text-sm text-muted-foreground">{totalPages || 1}</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages || totalPages === 0}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Print History</DialogTitle>
              <DialogDescription>
                Badge printing timeline for <strong>{historyTargetName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 py-4">
              {historyLogs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">No detailed history found</div>
              ) : (
                [...historyLogs].reverse().map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{format(new Date(h.created_at), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(h.created_at), 'hh:mm:ss a')}</span>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {h.created_by || 'System'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setIsHistoryDialogOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Generate Check-in Logs</DialogTitle>
              <DialogDescription>
                Create attendance logs for {selectedCodes.length} selected participant(s).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Room</label>
                <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.map(room => (
                      <SelectItem key={room.room_uuid} value={room.room_uuid}>
                        {room.room_name} 
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Time</label>
                  <Input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Time</label>
                  <Input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsGenerateDialogOpen(false)} disabled={generating}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                Confirm Generate
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  )
}
