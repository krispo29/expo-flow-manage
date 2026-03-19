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
import { Loader2, Search, ChevronLeft, ChevronRight, CheckSquare, RefreshCw, Printer, CheckCircle2, XCircle, Clock, Building2, User, LayoutDashboard, Filter } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

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
    <div className="space-y-8 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Printer className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-2xl font-display">Print Intelligence</CardTitle>
                <CardDescription className="font-medium italic">Tracking badge emission and cross-referencing activity.</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3 p-1.5 glass rounded-2xl border-white/10 items-center">
              <div className="relative w-48 sm:w-64 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search logs..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 h-9 text-xs bg-white/5 border-white/5 rounded-xl focus:bg-white/10 transition-all"
                />
              </div>
              <Separator orientation="vertical" className="h-6 bg-white/10" />
              <Select 
                value={filterStatus} 
                onValueChange={(val: 'all' | 'pending') => {
                  setFilterStatus(val)
                  setPage(1)
                  setSearchInput('')
                  setKeyword('')
                }}
              >
                <SelectTrigger className="h-9 w-[180px] bg-white/5 border-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest px-3">
                  <SelectValue placeholder="Stream Mode" />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  <SelectItem value="all" className="text-[10px] font-bold">ALL EMISSIONS</SelectItem>
                  <SelectItem value="pending" className="text-[10px] font-bold">MISSING ACTIVITY</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setRefreshCounter(prev => prev + 1)}
                className="h-9 w-9 rounded-xl hover:bg-white/5"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
            
          {/* Action Bar for Pending */}
          {filterStatus === 'pending' && (
            <div className="bg-white/5 border-b border-white/5 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Selection: {selectedCodes.length} nodes</span>
                </div>
              </div>
              <Button 
                onClick={() => setIsGenerateDialogOpen(true)}
                disabled={selectedCodes.length === 0}
                className="btn-aurora h-10 px-6 rounded-xl font-bold text-xs shadow-lg shadow-primary/20"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Generate Check-in
              </Button>
            </div>
          )}

          {/* Mobile View: Stream Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {loading && logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase opacity-40">Syncing logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">No print artifacts found.</div>
            ) : (
              logs.map((log, i) => (
                <div key={log.print_log_uuid || log.registration_uuid || i} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      {filterStatus === 'pending' && (
                        <Checkbox 
                          checked={selectedCodes.includes(log.registration_code)}
                          onCheckedChange={() => toggleOne(log.registration_code)}
                          className="mt-1"
                        />
                      )}
                      <div className="space-y-1">
                        <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">{log.first_name} {log.last_name}</p>
                        <code className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{log.registration_code}</code>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[9px] font-black tracking-tighter border-0 bg-white/10 uppercase py-1 px-3 rounded-full cursor-pointer", filterStatus === 'all' && 'hover:bg-primary/20 transition-all')}
                      onClick={() => {
                        if (filterStatus === 'all') {
                          setHistoryLogs(log.print_history || [])
                          setHistoryTargetName(`${log.first_name} ${log.last_name}`)
                          setIsHistoryDialogOpen(true)
                        }
                      }}
                    >
                      <Printer className="w-2.5 h-2.5 mr-1.5 opacity-60" />
                      X{log.print_count || 1}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{log.company_name}</span>
                    </div>
                    {filterStatus === 'pending' && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Badge variant="outline" className={cn("text-[8px] font-bold uppercase", log.has_attendance ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-400 border-rose-400/20')}>Att: {log.has_attendance ? 'YES' : 'NO'}</Badge>
                        <Badge variant="outline" className={cn("text-[8px] font-bold uppercase", log.has_hall ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-400 border-rose-400/20')}>Hall: {log.has_hall ? 'YES' : 'NO'}</Badge>
                        <Badge variant="outline" className={cn("text-[8px] font-bold uppercase", log.has_conference ? 'text-emerald-500 border-emerald-500/20' : 'text-rose-400 border-rose-400/20')}>Conf: {log.has_conference ? 'YES' : 'NO'}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Grid */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  {filterStatus === 'pending' && (
                    <TableHead className="w-12 pl-6">
                      <Checkbox 
                        checked={logs.length > 0 && selectedCodes.length === logs.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className={cn("w-[120px] font-bold text-[10px] uppercase tracking-widest", filterStatus !== 'pending' && 'pl-6')}>Entry Code</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Attendee Matrix</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Org Reference</TableHead>
                  {filterStatus === 'pending' && (
                    <>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">ATT</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">HALL</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">CONF</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">ACTIVE</TableHead>
                    </>
                  )}
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Emission Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filterStatus === 'pending' ? 12 : 5} className="text-center py-24">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <span className="text-sm font-bold tracking-widest uppercase opacity-40">Compiling emission logs...</span>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={filterStatus === 'pending' ? 12 : 5} className="text-center py-24 italic text-muted-foreground font-medium">
                      No logs captured.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, i) => (
                    <TableRow key={log.print_log_uuid || log.registration_uuid || i} className="border-white/5 hover:bg-white/5 transition-colors group">
                      {filterStatus === 'pending' && (
                        <TableCell className="pl-6">
                          <Checkbox 
                            checked={selectedCodes.includes(log.registration_code)}
                            onCheckedChange={() => toggleOne(log.registration_code)}
                          />
                        </TableCell>
                      )}
                      <TableCell className={cn(filterStatus !== 'pending' && 'pl-6')}>
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{log.registration_code}</code>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{log.first_name} {log.last_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-foreground/80 line-clamp-1">{log.company_name}</p>
                        <div className="text-[10px] text-muted-foreground/60 uppercase font-mono mt-0.5 line-clamp-1">{log.job_position || '---'}</div>
                      </TableCell>
                      {filterStatus === 'pending' && (
                        <>
                          <TableCell className="text-center">
                            {log.has_attendance ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-30" />}
                          </TableCell>
                          <TableCell className="text-center">
                            {log.has_hall ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-30" />}
                          </TableCell>
                          <TableCell className="text-center">
                            {log.has_conference ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-rose-400 mx-auto opacity-30" />}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={cn("text-[9px] font-bold px-2 py-0", log.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                              {log.is_active ? 'ACTIVE' : 'OFF'}
                            </Badge>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right pr-6">
                        <Badge 
                          variant="secondary" 
                          className={cn("bg-white/5 text-foreground/80 border-white/5 font-bold text-[9px] uppercase tracking-tighter py-1 px-3 rounded-full", filterStatus === 'all' && 'hover:bg-primary/20 transition-all cursor-pointer')}
                          onClick={() => {
                            if (filterStatus === 'all') {
                              setHistoryLogs(log.print_history || [])
                              setHistoryTargetName(`${log.first_name} ${log.last_name}`)
                              setIsHistoryDialogOpen(true)
                            }
                          }}
                        >
                          <Printer className="w-2.5 h-2.5 mr-1.5 opacity-60" />
                          Printed ({log.print_count || 1})
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
            <div className="text-sm text-muted-foreground italic font-medium">
              Streaming <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground font-bold">{total}</span> artifacts
            </div>
            
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1 mx-2">
                <span className="text-sm font-bold text-foreground">{page}</span>
                <span className="text-sm text-muted-foreground/40 font-normal">/</span>
                <span className="text-sm text-muted-foreground font-bold">{totalPages || 1}</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages || totalPages === 0 || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Temporal Logs</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Emission timeline for <span className="text-foreground font-bold">{historyTargetName}</span>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 max-h-[400px] overflow-y-auto scrollbar-hide space-y-4">
            {historyLogs.length === 0 ? (
              <div className="text-center py-12 glass rounded-2xl border-dashed">
                <Printer className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm font-bold opacity-40">No detailed artifacts captured</p>
              </div>
            ) : (
              [...historyLogs].reverse().map((h, i) => (
                <div key={i} className="flex items-center justify-between p-4 glass rounded-2xl border-white/5 hover:bg-white/5 transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-foreground">{format(new Date(h.created_at), 'MMM dd, yyyy')}</p>
                    <p className="text-[10px] font-mono font-bold text-primary/60">{format(new Date(h.created_at), 'hh:mm:ss a')}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] font-black tracking-widest border-white/10 opacity-60 uppercase">
                    ID: {h.created_by || 'SYS'}
                  </Badge>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="p-6 bg-white/5 border-t border-white/10">
            <Button variant="ghost" className="rounded-2xl h-11 w-full font-bold text-xs uppercase tracking-widest" onClick={() => setIsHistoryDialogOpen(false)}>Close Timeline</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Attendance Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="glass sm:max-w-[520px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <CheckSquare className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Activity Generator</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Synthesizing attendance logs for <span className="text-foreground font-bold">{selectedCodes.length}</span> nodes.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Target Access Zone</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl">
                  <SelectValue placeholder="Select active room..." />
                </SelectTrigger>
                <SelectContent className="glass border-white/10">
                  {rooms.map(room => (
                    <SelectItem key={room.room_uuid} value={room.room_uuid} className="text-xs font-bold">
                      {room.room_name} 
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Event Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Start</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl px-2" />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">End</Label>
                  <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-12 bg-white/5 border-white/10 rounded-xl px-2" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsGenerateDialogOpen(false)} disabled={generating}>Cancel</Button>
            <Button onClick={handleGenerate} disabled={generating} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              Initiate Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
