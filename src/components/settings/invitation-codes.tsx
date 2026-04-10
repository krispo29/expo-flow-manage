"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { getInvitations, createInvitation, updateInvitation, type Invitation } from "@/app/actions/settings"
import { getOrganizerInvitations } from "@/app/actions/organizer-invitation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Copy, Edit, Plus, Loader2, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Building2, User, Link as LinkIcon, ShieldCheck, Power, Ticket, Filter, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { copyTextToClipboard } from "@/lib/clipboard"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InvitationCodeSettingsProps {
  projectUuid: string
  userRole?: string | null
}

export function InvitationCodeSettings({ projectUuid, userRole }: Readonly<InvitationCodeSettingsProps>) {
  const isReadOnly = userRole === 'ORGANIZER'
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null)

  // Create form state
  const [newInvite, setNewInvite] = useState({ company_name: '' })

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    company: '',
    code: '',
    isActive: 'all'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const emptyStateMessage = searchQuery
    ? "No matching results found."
    : isReadOnly
      ? "No invitation codes found for this project."
      : "No invitation codes found. Click \"Add Code\" to create one."

  // Filter invitations based on search and column filters
  const filteredInvitations = invitations.filter(invite => {
    // Global search
    const matchesSearch = !searchQuery ||
      invite.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invite.invite_code.toLowerCase().includes(searchQuery.toLowerCase())

    // Column specific filters
    const matchesCompany = !columnFilters.company ||
      (invite.company_name && invite.company_name.toLowerCase().includes(columnFilters.company.toLowerCase()))

    const matchesCode = !columnFilters.code ||
      (invite.invite_code && invite.invite_code.toLowerCase().includes(columnFilters.code.toLowerCase()))

    const matchesStatus = columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && invite.is_active) ||
      (columnFilters.isActive === 'inactive' && !invite.is_active)

    return matchesSearch && matchesCompany && matchesCode && matchesStatus
  })

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredInvitations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedInvitations = filteredInvitations.slice(startIndex, startIndex + itemsPerPage)

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle search change and reset pagination
  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  // Handle column filter change and reset pagination
  const handleColumnFilterChange = (key: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setColumnFilters({
      company: '',
      code: '',
      isActive: 'all'
    })
    setSearchQuery('')
    setCurrentPage(1)
    setShowFilters(false)
  }

  async function fetchInvitations() {
    setLoading(true)
    const result = isReadOnly
      ? await getOrganizerInvitations()
      : await getInvitations(projectUuid)
    if (result.success) setInvitations(result.invitations)
    setLoading(false)
  }

  useEffect(() => {
    fetchInvitations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])


  async function handleCreate() {
    if (isReadOnly) return
    if (!newInvite.company_name) {
      toast.error("Please fill in Company Name")
      return
    }
    setSaving(true)
    const result = await createInvitation(projectUuid, newInvite)
    setSaving(false)
    if (result.success) {
      toast.success("Invitation created")
      setIsCreateOpen(false)
      setNewInvite({ company_name: '' })
      fetchInvitations()
    } else {
      toast.error(result.error || "Failed to create invitation")
    }
  }

  async function handleUpdate() {
    if (isReadOnly || !editingInvite) return
    if (!editingInvite) return
    setSaving(true)
    const result = await updateInvitation(projectUuid, {
      invite_uuid: editingInvite.invite_uuid,
      company_name: editingInvite.company_name,
      invite_code: editingInvite.invite_code,
      is_active: editingInvite.is_active,
    })
    setSaving(false)
    if (result.success) {
      toast.success("Invitation updated")
      setEditingInvite(null)
      fetchInvitations()
    } else {
      toast.error(result.error || "Failed to update invitation")
    }
  }

  async function copyLink(link: string) {
    try {
      await copyTextToClipboard(link)
      toast.success("Link copied to clipboard")
    } catch (error) {
      console.error("Failed to copy invitation link:", error)
      toast.error("Failed to copy link")
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 glass rounded-3xl">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground mt-4 animate-pulse font-bold tracking-widest uppercase">Syncing tokens...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">Invitation Codes</CardTitle>
              <CardDescription className="font-medium">
                {isReadOnly ? 'View and export invitation codes for your project.' : 'Manage invitation codes for special access.'}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search company or code..."
                    className="pl-11 h-11 bg-white/5 border-white/10 rounded-2xl focus-visible:ring-primary/30 transition-all focus:bg-white/10"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
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
                {(showFilters || searchQuery || Object.values(columnFilters).some(v => v !== '' && v !== 'all')) && (
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
              {!isReadOnly && (
                <Button onClick={() => setIsCreateOpen(true)} className="btn-aurora h-11 px-6 rounded-2xl font-bold shadow-lg shadow-primary/20 w-full sm:w-auto">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Code
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Company</Label>
                  <Input
                    placeholder="Filter by company..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.company}
                    onChange={e => handleColumnFilterChange('company', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Code</Label>
                  <Input
                    placeholder="Filter by code..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.code}
                    onChange={e => handleColumnFilterChange('code', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Status</Label>
                  <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                    <SelectTrigger className="h-10 bg-white/5 border-white/10 rounded-xl text-sm">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="glass border-white/10 rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          
          {/* Mobile View: Cards */}
          <div className="md:hidden divide-y divide-white/5">
            {filteredInvitations.length === 0 ? (
              <div className="text-center p-12 text-muted-foreground italic font-medium">
                {emptyStateMessage}
              </div>
            ) : (
              paginatedInvitations.map((invite, index) => (
                <div key={`${invite.invite_uuid}-${index}`} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5">
                      <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
                        {invite.company_name}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase font-mono tracking-tighter">
                          {invite.invite_code}
                        </code>
                        <Badge variant="secondary" className="bg-white/5 border-white/5 text-[9px] font-bold py-0">USED: {invite.used_count ?? 0}</Badge>
                      </div>
                    </div>
                    <Badge className={cn("rounded-full px-3 text-[10px] font-bold", invite.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                      {invite.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground/80 font-medium italic">
                      <LinkIcon className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">{invite.invite_link}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground/80 font-medium">
                      <User className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      <span className="truncate">Creator: {invite.creator_name || '-'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" className="h-9 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 px-4" onClick={() => void copyLink(invite.invite_link)}>
                      <Copy className="h-3.5 w-3.5 mr-2" />
                      Copy
                    </Button>
                    {!isReadOnly && (
                      <Button variant="outline" size="sm" className="h-9 rounded-xl bg-white/5 border-white/10 hover:bg-white/10 px-4" onClick={() => setEditingInvite(invite)}>
                        <Edit className="h-3.5 w-3.5 mr-2" />
                        Edit
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
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Company</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Code</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Invite Link</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest">Metadata</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Used</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                </TableRow>
                {showFilters && (
                  <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                    <TableHead className="pl-6 py-2">
                      <Input
                        placeholder="Filter company..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.company}
                        onChange={e => handleColumnFilterChange('company', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2">
                      <Input
                        placeholder="Filter code..."
                        className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                        value={columnFilters.code}
                        onChange={e => handleColumnFilterChange('code', e.target.value)}
                      />
                    </TableHead>
                    <TableHead className="py-2"></TableHead>
                    <TableHead className="py-2"></TableHead>
                    <TableHead className="py-2"></TableHead>
                    <TableHead className="py-2 text-center">
                      <Select value={columnFilters.isActive} onValueChange={v => handleColumnFilterChange('isActive', v)}>
                        <SelectTrigger className="h-9 bg-white/5 border-white/10 rounded-lg text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="glass border-white/10 rounded-xl">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
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
                {filteredInvitations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-24 italic text-muted-foreground font-medium">
                      {emptyStateMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInvitations.map((invite, index) => (
                    <TableRow key={`${invite.invite_uuid}-${index}`} className="border-white/5 hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6">
                        <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-primary/40" />
                          {invite.company_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">
                          {invite.invite_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-[11px] font-medium text-foreground/60 italic max-w-[200px] truncate" title={invite.invite_link}>
                          <ExternalLink className="h-3 w-3 opacity-40 shrink-0" />
                          <span className="truncate">{invite.invite_link}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold opacity-60">SOURCE: {invite.source || '-'}</span>
                          <span className="text-[9px] font-medium opacity-30 uppercase tracking-widest">BY: {invite.creator_name || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-[10px] font-mono font-bold opacity-40">{invite.used_count ?? 0}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", invite.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                          {invite.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" 
                            onClick={() => void copyLink(invite.invite_link)}
                            title="Copy Link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {!isReadOnly && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300" 
                              onClick={() => setEditingInvite(invite)}
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredInvitations.length > itemsPerPage && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-4 border-t border-white/5 bg-white/5">
              <div className="text-sm text-muted-foreground italic font-medium">
                Showing <span className="text-foreground">{startIndex + 1}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredInvitations.length)}</span> of <span className="text-foreground font-bold">{filteredInvitations.length}</span> results
              </div>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1
                    if (totalPages > 5) {
                      if (currentPage <= 3) pageNum = i + 1
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                      else pageNum = currentPage - 2 + i
                    }

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
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-white/5 border-white/10"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isReadOnly && (
        <>
          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-display font-bold">Add Invitation Code</DialogTitle>
                    <DialogDescription className="font-medium italic">Create a new invitation code for a company.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="p-8 grid gap-6">
                <div className="space-y-2.5">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Company Name</Label>
                  <Input value={newInvite.company_name} onChange={(e) => setNewInvite({ ...newInvite, company_name: e.target.value })} placeholder="e.g. THE DEFT" className="h-12 bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
                <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Create Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={!!editingInvite} onOpenChange={(open) => !open && setEditingInvite(null)}>
            <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                    <Edit className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-display font-bold">Edit Invitation Code</DialogTitle>
                    <DialogDescription className="font-medium italic">Update the invitation code details.</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              {editingInvite && (
                <div className="p-8 grid gap-6">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Company Name</Label>
                    <Input value={editingInvite.company_name} onChange={(e) => setEditingInvite({ ...editingInvite, company_name: e.target.value })} className="h-12 bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Invite Code</Label>
                    <div className="relative">
                      <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                      <Input value={editingInvite.invite_code} onChange={(e) => setEditingInvite({ ...editingInvite, invite_code: e.target.value })} className="h-12 pl-11 bg-white/5 border-white/10 rounded-xl font-mono uppercase" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
                    <Label className="text-xs font-bold uppercase tracking-tight">Active Status</Label>
                    <Switch checked={editingInvite.is_active} onCheckedChange={(v) => setEditingInvite({ ...editingInvite, is_active: v })} />
                  </div>
                </div>
              )}
              <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
                <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setEditingInvite(null)}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={saving} className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Power className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
