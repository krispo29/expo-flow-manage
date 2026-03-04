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
import { Loader2, Search, Upload, ChevronLeft, ChevronRight } from 'lucide-react'
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

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setKeyword(searchInput)
    setPage(1)
  }

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

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Attendance Logs
          </CardTitle>
          <CardDescription>
            Upload files to update attendance log records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              onChange={handleImport}
              disabled={importing}
              className="flex-1 max-w-md"
            />
            {importing && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
          </div>
        </CardContent>
      </Card>

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <Input 
              placeholder="Search keyword..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="max-w-md"
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>

        <div className="border rounded-lg bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Scanned At</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Device ID</TableHead>
                <TableHead>Room</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                if (loading) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  )
                }
                
                if (logs.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No attendance logs found.
                      </TableCell>
                    </TableRow>
                  )
                }
                
                return logs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell>
                      {log.scanned_at ? format(new Date(log.scanned_at), 'yyyy-MM-dd HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{log.registration_code}</TableCell>
                    <TableCell>
                      {log.first_name} {log.last_name}
                    </TableCell>
                    <TableCell>{log.company_name}</TableCell>
                    <TableCell>{log.job_position}</TableCell>
                    <TableCell>{log.device_id}</TableCell>
                    <TableCell>{log.room_name}</TableCell>
                  </TableRow>
                ))
              })()}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {!loading && logs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/5">
              <div className="text-sm text-muted-foreground italic">
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
                  Previous
                </Button>
                
                <div className="flex items-center gap-1 min-w-[3rem] justify-center">
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
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
