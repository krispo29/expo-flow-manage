'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  getQuotaRequests, 
  approveQuotaRequest, 
  rejectQuotaRequest, 
  undoQuotaRequest,
  QuotaRequest 
} from '@/app/actions/quota-request'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  CheckCircle2, 
  XCircle, 
  Undo2, 
  Loader2, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export default function QuotaRequestsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  
  const [requests, setRequests] = useState<QuotaRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<QuotaRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter requests based on search
  const filteredRequests = requests.filter(item => 
    item.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.requested_by?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const fetchRequests = async () => {
    if (!projectId) return
    setLoading(true)
    const result = await getQuotaRequests(projectId)
    if (result.success && result.data) {
      setRequests(result.data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRequests()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const handleApprove = async (requestUuid: string) => {
    if (!projectId) return
    setActionLoading(requestUuid)
    const result = await approveQuotaRequest(projectId, requestUuid)
    setActionLoading(null)
    
    if (result.success) {
      toast.success('Quota request approved')
      fetchRequests()
    } else {
      toast.error(result.error || 'Failed to approve request')
    }
  }

  const handleReject = async () => {
    if (!projectId || !selectedRequest) return
    setActionLoading(selectedRequest.request_uuid)
    const result = await rejectQuotaRequest(projectId, selectedRequest.request_uuid, rejectNote)
    setActionLoading(null)
    
    if (result.success) {
      toast.success('Quota request rejected')
      setRejectDialogOpen(false)
      setRejectNote('')
      fetchRequests()
    } else {
      toast.error(result.error || 'Failed to reject request')
    }
  }

  const handleUndo = async (requestUuid: string) => {
    if (!projectId) return
    setActionLoading(requestUuid)
    const result = await undoQuotaRequest(projectId, requestUuid)
    setActionLoading(null)
    
    if (result.success) {
      toast.success('Action undone successfully')
      fetchRequests()
    } else {
      toast.error(result.error || 'Failed to undo action')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 gap-1 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-xl font-semibold">No Project Selected</h2>
        <p className="text-muted-foreground">Please select a project from the dashboard.</p>
      </div>
    )
  }

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quota Requests</h1>
          <p className="text-muted-foreground">Manage additional quota requests from exhibitors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-yellow-50/50 dark:bg-yellow-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50/50 dark:bg-green-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-red-50/50 dark:bg-red-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-none shadow-md">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold">Request List</CardTitle>
              <CardDescription>View and process all quota requests.</CardDescription>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search company or requester..."
                className="pl-9 bg-background border-border/50 focus-visible:ring-primary"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No quota requests found for this project.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Company Name</TableHead>
                    <TableHead className="font-semibold">Requested By</TableHead>
                    <TableHead className="font-semibold text-center">Amount</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Requested At</TableHead>
                    <TableHead className="font-semibold">Note</TableHead>
                    <TableHead className="text-right font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        No results matching &quot;{searchQuery}&quot;
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedRequests.map((item) => (
                      <TableRow key={item.request_uuid} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-medium">{item.company_name}</TableCell>
                        <TableCell>{item.requested_by}</TableCell>
                        <TableCell className="text-center font-bold text-primary">{item.requested_amount}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'PPP p')}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate italic text-muted-foreground text-xs">
                          {item.note || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.status === 'pending' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={() => handleApprove(item.request_uuid)}
                                  disabled={!!actionLoading}
                                >
                                  {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                                  Approve
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedRequest(item)
                                    setRejectDialogOpen(true)
                                  }}
                                  disabled={!!actionLoading}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {item.status !== 'pending' && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleUndo(item.request_uuid)}
                                disabled={!!actionLoading}
                              >
                                {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4 mr-1" />}
                                Undo
                              </Button>
                            )}
                          </div>
                          {/* Mobile visibility for actions */}
                          <div className="group-hover:hidden flex justify-end gap-1">
                             {item.status === 'pending' ? (
                               <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground/50 border-muted">Actions Hidden</Badge>
                             ) : (
                               <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground/50 border-muted">Action Taken</Badge>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border-t bg-muted/10">
            <div className="text-xs text-muted-foreground italic">
              Showing <span className="font-medium">{filteredRequests.length > 0 ? startIndex + 1 : 0}</span> to <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredRequests.length)}</span> of <span className="font-medium">{filteredRequests.length}</span> results
            </div>
            {filteredRequests.length > itemsPerPage && (
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
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
                          className="h-8 w-8 text-xs font-semibold"
                          onClick={() => goToPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      )
                    }
                    return null
                  })}
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quota Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the quota request from {selectedRequest?.company_name}? 
              This will notify the exhibitor that their request for {selectedRequest?.requested_amount} extra badges was denied.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="note">Rejection Note (Optional)</Label>
              <Input 
                id="note" 
                value={rejectNote} 
                onChange={e => setRejectNote(e.target.value)} 
                placeholder="Reason for rejection..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!!actionLoading}>
              {actionLoading === selectedRequest?.request_uuid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
