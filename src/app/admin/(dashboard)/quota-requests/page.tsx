'use client'

import { useEffect, useState, Suspense } from 'react'
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
  AlertCircle,
  Building2,
  User,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

function QuotaRequestsContent() {
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
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1.5 rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">
            <Clock className="w-3 h-3" />
            <span>Pending</span>
          </Badge>
        )
      case 'approved':
        return (
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1.5 rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">
            <CheckCircle className="w-3 h-3" />
            <span>Approved</span>
          </Badge>
        )
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 gap-1.5 rounded-full px-3 py-0.5 font-bold text-[10px] uppercase">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </Badge>
        )
      default:
        return <Badge variant="secondary" className="rounded-full px-3">{status}</Badge>
    }
  }

  if (!projectId) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] glass rounded-3xl p-12">
        <h2 className="text-2xl font-display font-bold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground/80 mb-6 text-center">Please select a project from the dashboard to manage quota requests.</p>
      </div>
    )
  }

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-display font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Quota Requests</h1>
        <p className="text-muted-foreground mt-1 font-sans">Manage additional quota requests from exhibitors.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="glass shadow-lg border-yellow-500/10 bg-yellow-500/5 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-yellow-500/60">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="glass shadow-lg border-emerald-500/10 bg-emerald-500/5 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-500/60">Approved Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-emerald-500">{stats.approved}</div>
          </CardContent>
        </Card>
        <Card className="glass shadow-lg border-red-500/10 bg-red-500/5 transition-all hover:scale-105">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-red-500/60">Rejected Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-red-500">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Request List</CardTitle>
              <CardDescription className="font-medium">View and process all quota requests from exhibition partners.</CardDescription>
            </div>
            <div className="relative w-full max-w-sm group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
              <Input
                placeholder="Search company or requester..."
                className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-4 animate-pulse font-bold tracking-widest uppercase">Fetching backlog...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center p-24 glass m-6 rounded-3xl border-dashed">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-primary" />
              <p className="text-lg font-display font-bold">No requests captured</p>
              <p className="text-sm text-muted-foreground italic mt-2">All incoming requests for this project have been cleared.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden divide-y divide-white/5">
                {paginatedRequests.length === 0 ? (
                  <div className="text-center p-12 text-muted-foreground italic font-medium">No records matching your search.</div>
                ) : (
                  paginatedRequests.map((item) => (
                    <div key={item.request_uuid} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                            {item.company_name}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-widest">AMOUNT: {item.requested_amount}</span>
                          </div>
                        </div>
                        {getStatusBadge(item.status)}
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
                          <User className="h-3.5 w-3.5 shrink-0 opacity-40 text-primary" />
                          <span>Req by: {item.requested_by}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground/80 font-medium italic">
                          <Clock className="h-3.5 w-3.5 shrink-0 opacity-40 text-primary" />
                          <span>{format(new Date(item.created_at), 'PPP p')}</span>
                        </div>
                        {item.note && (
                          <div className="bg-white/5 p-3 rounded-xl border border-white/5 mt-1">
                            <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40 mb-1">Requester Note:</p>
                            <p className="text-xs italic leading-relaxed">{item.note}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {item.status === 'pending' ? (
                          <>
                            <Button 
                              size="sm" 
                              className="flex-1 rounded-xl h-10 bg-emerald-500 text-white hover:bg-emerald-600 font-bold text-xs"
                              onClick={() => handleApprove(item.request_uuid)}
                              disabled={!!actionLoading}
                            >
                              {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1 rounded-xl h-10 border-red-500/20 text-red-500 hover:bg-red-500/10 font-bold text-xs"
                              onClick={() => {
                                setSelectedRequest(item)
                                setRejectDialogOpen(true)
                              }}
                              disabled={!!actionLoading}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1 rounded-xl h-10 border-white/10 hover:bg-white/10 font-bold text-xs"
                            onClick={() => handleUndo(item.request_uuid)}
                            disabled={!!actionLoading}
                          >
                            {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Undo2 className="h-4 w-4 mr-2" />}
                            Undo Action
                          </Button>
                        )}
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
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Company Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Requested By</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Amount</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Requested At</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Note</TableHead>
                      <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-24 italic text-muted-foreground font-medium">
                          No results matching &quot;{searchQuery}&quot;
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRequests.map((item) => (
                        <TableRow key={item.request_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell className="pl-6">
                            <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-primary/40" />
                              {item.company_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <User className="h-3.5 w-3.5 opacity-40" />
                              {item.requested_by}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-lg font-display font-black text-primary">{item.requested_amount}</span>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(item.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold opacity-60 uppercase">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                              <span className="text-[9px] font-mono font-medium opacity-30 tracking-widest">{format(new Date(item.created_at), 'HH:mm:ss')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[180px] truncate text-[11px] font-medium text-muted-foreground italic group-hover:whitespace-normal group-hover:overflow-visible transition-all" title={item.note || ''}>
                              {item.note || '—'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                              {item.status === 'pending' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 hover:scale-110 transition-all"
                                    onClick={() => handleApprove(item.request_uuid)}
                                    disabled={!!actionLoading}
                                    title="Approve"
                                  >
                                    {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:scale-110 transition-all"
                                    onClick={() => {
                                      setSelectedRequest(item)
                                      setRejectDialogOpen(true)
                                    }}
                                    disabled={!!actionLoading}
                                    title="Reject"
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {item.status !== 'pending' && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary hover:scale-110 transition-all"
                                  onClick={() => handleUndo(item.request_uuid)}
                                  disabled={!!actionLoading}
                                  title="Undo Action"
                                >
                                  {actionLoading === item.request_uuid ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                            <div className="group-hover:hidden flex justify-end">
                               <Badge variant="outline" className="text-[8px] font-black tracking-widest opacity-20 border-white/10">INTERACTIVE</Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
            <div className="text-sm text-muted-foreground italic font-medium">
              Showing <span className="text-foreground">{filteredRequests.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredRequests.length)}</span> of <span className="text-foreground font-bold">{filteredRequests.length}</span> results
            </div>
            {filteredRequests.length > itemsPerPage && (
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
        </CardContent>
      </Card>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Reject Quota Request</DialogTitle>
                <DialogDescription className="font-medium italic">Establishing rejection protocol for <span className="text-foreground font-bold">{selectedRequest?.company_name}</span>.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <p className="text-sm text-muted-foreground leading-relaxed italic">
              Are you sure you want to reject the quota request? This will notify the exhibitor that their request for <span className="text-foreground font-bold">{selectedRequest?.requested_amount} extra badges</span> was denied.
            </p>
            <div className="space-y-3">
              <Label htmlFor="note" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Rejection Note (Optional)</Label>
              <Input 
                id="note" 
                value={rejectNote} 
                onChange={e => setRejectNote(e.target.value)} 
                placeholder="Reason for rejection..."
                className="h-12 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setRejectDialogOpen(false)}>Abort</Button>
            <Button variant="destructive" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-red-500/20" onClick={handleReject} disabled={!!actionLoading}>
              {actionLoading === selectedRequest?.request_uuid ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function QuotaRequestsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    }>
      <QuotaRequestsContent />
    </Suspense>
  )
}
