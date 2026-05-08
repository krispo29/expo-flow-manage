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
import { Loader2, Search, Upload, ChevronLeft, ChevronRight, Building2, QrCode, Filter, X } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAttendanceLogs, importAttendanceLogs, type AttendanceLog } from '@/app/actions/participant'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function AttendanceLogs({ projectId }: Readonly<{ projectId: string }>) {
  const [logs, setLogs] = useState<AttendanceLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)

  const [importing, setImporting] = useState(false)

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    date: '',
    registrationCode: '',
    name: '',
    company: '',
    room: ''
  })

  useEffect(() => {
    let active = true
    const doFetch = async () => {
      setLoading(true)
      const res = await getAttendanceLogs(page, limit, keyword)
      if (!active) return

      if (res.success) {
        setLogs(res.items || [])
        setTotal(res.total || 0)
      } else {
        toast.error(res.error || 'Failed to fetch attendance logs')
      }
      setLoading(false)
    }
    doFetch()
    return () => { active = false }
  }, [page, limit, keyword, refreshCounter])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setKeyword(searchInput)
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File is too large (max 5MB)')
      return
    }

    setImporting(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', projectId)

    const response = await importAttendanceLogs(formData)

    setImporting(false)
    e.target.value = '' // Reset input

    if (response.success) {
      toast.success('Attendance logs imported successfully.')
      setPage(1)
      setRefreshCounter(prev => prev + 1)
    } else {
      toast.error(response.error || 'Failed to process file')
    }
  }

  // Filter logs based on column filters
  const filteredLogs = logs.filter(log => {
    const matchesDate = !columnFilters.date ||
      (log.scanned_at && format(new Date(log.scanned_at), 'yyyy-MM-dd').includes(columnFilters.date))

    const matchesCode = !columnFilters.registrationCode ||
      (log.registration_code && log.registration_code.toLowerCase().includes(columnFilters.registrationCode.toLowerCase()))

    const matchesName = !columnFilters.name ||
      ((log.first_name && log.first_name.toLowerCase().includes(columnFilters.name.toLowerCase())) ||
       (log.last_name && log.last_name.toLowerCase().includes(columnFilters.name.toLowerCase())))

    const matchesCompany = !columnFilters.company ||
      (log.company_name && log.company_name.toLowerCase().includes(columnFilters.company.toLowerCase()))

    const matchesRoom = !columnFilters.room ||
      (log.room_name && log.room_name.toLowerCase().includes(columnFilters.room.toLowerCase()))

    return matchesDate && matchesCode && matchesName && matchesCompany && matchesRoom
  })

  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setColumnFilters({
      date: '',
      registrationCode: '',
      name: '',
      company: '',
      room: ''
    })
    setSearchInput('')
    setKeyword('')
    setPage(1)
    setShowFilters(false)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Import Section */}
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-display">Import Scanner</CardTitle>
              <CardDescription className="font-medium italic">Upload external attendance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative flex-1 w-full group">
              <Input
                type="file"
                onChange={handleImport}
                disabled={importing}
                className="h-14 bg-white/5 border-white/10 rounded-2xl cursor-pointer file:bg-primary/10 file:text-primary file:border-0 file:rounded-xl file:px-4 file:py-1 file:mr-4 file:font-bold file:text-xs transition-all hover:bg-white/10"
              />
              {importing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-xs font-bold text-primary animate-pulse uppercase">Processing</span>
                </div>
              )}
            </div>
            <div className="text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest text-center sm:text-left">Max Payload: 5MB (XLSX/CSV)</div>
          </div>
        </CardContent>
      </Card>

      {/* List Section */}
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Import Scanner</CardTitle>
              <CardDescription className="font-medium">Monitoring real-time check-in events across all active zones.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search Identity or Room..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
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
                {(showFilters || searchInput || Object.values(columnFilters).some(v => v !== '')) && (
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">scanned at</Label>
                  <Input
                    type="date"
                    placeholder="Filter by date..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.date}
                    onChange={e => handleColumnFilterChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">registration code</Label>
                  <Input
                    placeholder="Filter by code..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.registrationCode}
                    onChange={e => handleColumnFilterChange('registrationCode', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">first name/last name</Label>
                  <Input
                    placeholder="Filter by name..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.name}
                    onChange={e => handleColumnFilterChange('name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">company name</Label>
                  <Input
                    placeholder="Filter by company..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.company}
                    onChange={e => handleColumnFilterChange('company', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">room name</Label>
                  <Input
                    placeholder="Filter by room..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.room}
                    onChange={e => handleColumnFilterChange('room', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Mobile View: Stream Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {loading && filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase opacity-40">Syncing stream...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">No activity captured.</div>
            ) : (
              filteredLogs.map((log, i) => (
                <div key={log.log_id || i} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                        {log.first_name} {log.last_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase">{log.registration_code}</code>
                        <Badge variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-bold py-0">{log.room_name}</Badge>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-[10px] font-mono font-bold text-primary/60">{log.scanned_at ? format(new Date(log.scanned_at), 'HH:mm:ss') : '--:--'}</span>
                      <span className="text-[9px] font-bold opacity-30 uppercase">{log.scanned_at ? format(new Date(log.scanned_at), 'MMM d') : '---'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
                      <Building2 className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{log.company_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground/80 font-medium italic">
                      <QrCode className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate font-mono text-[10px]">device id: {log.device_id || 'UNKNOWN'}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Analytics Grid */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="w-[180px] font-bold text-[10px] uppercase tracking-widest pl-6">scanned at</TableHead>
                  <TableHead className="w-[120px] font-bold text-[10px] uppercase tracking-widest">registration code</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">first name last name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">company name</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">room name</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">device id</TableHead>
                </TableRow>
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                    <TableHead className="pl-6 py-2">
                      <Input
                        type="date"
                        placeholder="Filter date..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.date}
                        onChange={e => handleColumnFilterChange('date', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter code..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.registrationCode}
                        onChange={e => handleColumnFilterChange('registrationCode', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter name..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.name}
                        onChange={e => handleColumnFilterChange('name', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter company..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.company}
                        onChange={e => handleColumnFilterChange('company', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter room..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.room}
                        onChange={e => handleColumnFilterChange('room', e.target.value)}
                      />
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
                {loading && filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <span className="text-sm font-bold tracking-widest uppercase opacity-40 italic">Decrypting stream data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">
                      No logs captured in the current filter window.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log, i) => (
                    <TableRow key={log.log_id || i} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-bold text-foreground/80">{log.scanned_at ? format(new Date(log.scanned_at), 'yyyy-MM-dd') : '---'}</span>
                          <span className="text-[10px] font-mono font-bold text-primary/60">{log.scanned_at ? format(new Date(log.scanned_at), 'HH:mm:ss') : '---'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">{log.registration_code}</code>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">{log.first_name} {log.last_name}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-foreground/80 line-clamp-1">{log.company_name}</p>
                        <div className="text-[10px] text-muted-foreground/60 uppercase font-mono mt-0.5 line-clamp-1">{log.job_position || '---'}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold text-[9px] border-white/10 uppercase bg-white/5 py-0 px-2">{log.room_name}</Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <span className="text-[10px] font-mono font-bold opacity-30 uppercase tracking-widest">{log.device_id || 'SYS_0'}</span>
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
              Streaming <span className="text-foreground">{(page - 1) * limit + 1}</span> to <span className="text-foreground">{Math.min(page * limit, total)}</span> of <span className="text-foreground font-bold">{total}</span> check-ins
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
    </div>
  )
}
