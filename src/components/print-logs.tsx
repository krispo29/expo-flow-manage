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
import { Loader2, Search, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function PrintLogs({ projectId }: Readonly<{ projectId: string }>) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Print Logs</TabsTrigger>
          <TabsTrigger value="no-attendance">Printed No Attendance</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <AllPrintLogs />
        </TabsContent>
        <TabsContent value="no-attendance" className="mt-4">
          <PrintedNoAttendance projectId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function AllPrintLogs() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')

  useEffect(() => {
    let active = true
    const doFetch = async () => {
      setLoading(true)
      const res = await getPrintLogs(page, limit, keyword)
      if (!active) return
      if (res.success) {
        setLogs(res.items || [])
        setTotal(res.total || 0)
      } else {
        toast.error(res.error || 'Failed to fetch print logs')
      }
      setLoading(false)
    }
    doFetch()
    return () => { active = false }
  }, [page, limit, keyword])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setKeyword(searchInput)
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Print Logs</CardTitle>
        <CardDescription>View all participants who have printed their badges.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search keyword..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-background focus-visible:ring-primary"
          />
        </div>

        <div className="border rounded-lg bg-background overflow-hidden relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow key={log.registration_uuid || i}>
                    <TableCell className="font-medium">{log.registration_code}</TableCell>
                    <TableCell>{log.first_name} {log.last_name}</TableCell>
                    <TableCell>{log.company_name}</TableCell>
                    <TableCell>{log.job_position}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/5">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
                   Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PrintedNoAttendance({ projectId }: { projectId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(50)
  const [keyword, setKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [refreshCounter, setRefreshCounter] = useState(0)

  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Form states for attendance generation
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')

  useEffect(() => {
    let active = true
    const doFetch = async () => {
      setLoading(true)
      const res = await getPrintedNoAttendance(page, limit, keyword)
      if (!active) return
      if (res.success) {
        setLogs(res.items || [])
        setTotal(res.total || 0)
        // Reset selection when changes
        setSelectedCodes([])
      } else {
        toast.error(res.error || 'Failed to fetch data')
      }
      setLoading(false)
    }
    doFetch()
    return () => { active = false }
  }, [page, limit, keyword, refreshCounter])

  useEffect(() => {
    const fetchRooms = async () => {
      const res = await getRooms(projectId)
      if (res.success) {
        setRooms(res.rooms)
      }
    }
    fetchRooms()
  }, [projectId])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (keyword !== searchInput) {
        setKeyword(searchInput)
        setPage(1)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, keyword])

  const toggleAll = () => {
    if (selectedCodes.length === logs.length) {
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
      setRefreshCounter(prev => prev + 1)
    } else {
      toast.error(result.error || 'Failed to generate logs')
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Printed No Attendance</CardTitle>
          <CardDescription>Participants who printed their badges but have not checked in.</CardDescription>
        </div>
        <Button 
          onClick={() => setIsGenerateDialogOpen(true)}
          disabled={selectedCodes.length === 0}
        >
          <CheckSquare className="h-4 w-4 mr-2" />
          Generate Check-in ({selectedCodes.length})
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search keyword..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 bg-background focus-visible:ring-primary"
          />
        </div>

        <div className="border rounded-lg bg-background overflow-hidden relative">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={logs.length > 0 && selectedCodes.length === logs.length}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No logs found.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log, i) => (
                  <TableRow key={log.registration_uuid || i}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedCodes.includes(log.registration_code)}
                        onCheckedChange={() => toggleOne(log.registration_code)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{log.registration_code}</TableCell>
                    <TableCell>{log.first_name} {log.last_name}</TableCell>
                    <TableCell>{log.company_name}</TableCell>
                    <TableCell>{log.job_position}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t bg-muted/5">
              <div className="text-sm text-muted-foreground">
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Check-in Logs</DialogTitle>
            <DialogDescription>
              This will create attendance logs for the {selectedCodes.length} selected participant(s).
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
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
