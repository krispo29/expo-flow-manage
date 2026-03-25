'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  getOrganizers,
  createOrganizer,
  updateOrganizer,
  forceResetPassword,
  toggleOrganizerStatus,
  type Organizer,
} from '@/app/actions/organizer'
import { Pencil, Loader2, KeyRound, Power, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, EyeOff, User, ShieldCheck, Calendar, Clock, Plus, Copy, Check, Filter, X } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface OrganizerListProps {
  projectUuid: string
}

export interface OrganizerListHandle {
  openCreateDialog: () => void
}

export const OrganizerList = forwardRef<OrganizerListHandle, OrganizerListProps>(
  ({ projectUuid }, ref) => {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = (text: string, id: string) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success('Password copied to clipboard')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Create dialog
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newOrg, setNewOrg] = useState({ username: '', full_name: '' })

  // Exposed handle for parent component
  useImperativeHandle(ref, () => ({
    openCreateDialog: () => {
      setShowPassword(false)
      setIsCreateOpen(true)
    }
  }))

  // Edit dialog
  const [editingOrg, setEditingOrg] = useState<Organizer | null>(null)

  const [resetOrg, setResetOrg] = useState<Organizer | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    username: '',
    passwordNote: '',
    fullName: '',
    isActive: 'all'
  })

  // Show/Hide password state
  const [showPassword, setShowPassword] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter organizers based on search and column filters
  const filteredOrganizers = organizers.filter(org => {
    // Global search
    const matchesSearch = !searchQuery ||
      (org.username && org.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (org.full_name && org.full_name.toLowerCase().includes(searchQuery.toLowerCase()))

    // Column specific filters
    const matchesUsername = !columnFilters.username ||
      (org.username && org.username.toLowerCase().includes(columnFilters.username.toLowerCase()))

    const matchesPassword = !columnFilters.passwordNote ||
      (org.password_note && org.password_note.toLowerCase().includes(columnFilters.passwordNote.toLowerCase()))

    const matchesName = !columnFilters.fullName ||
      (org.full_name && org.full_name.toLowerCase().includes(columnFilters.fullName.toLowerCase()))

    const matchesStatus = columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && org.is_active) ||
      (columnFilters.isActive === 'inactive' && !org.is_active)

    return matchesSearch && matchesUsername && matchesPassword && matchesName && matchesStatus
  })

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredOrganizers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrganizers = filteredOrganizers.slice(startIndex, startIndex + itemsPerPage)

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
      username: '',
      passwordNote: '',
      fullName: '',
      isActive: 'all'
    })
    setSearchQuery('')
    setCurrentPage(1)
    setShowFilters(false)
  }

  async function fetchOrganizers() {
    setLoading(true)
    const result = await getOrganizers(projectUuid)
    if (result.success) {
      setOrganizers(result.data || [])
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrganizers()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectUuid])


  async function handleCreate() {
    if (!newOrg.username || !newOrg.full_name) {
      toast.error('Please fill in all fields')
      return
    }
    setSaving(true)
    const result = await createOrganizer(projectUuid, newOrg)
    setSaving(false)
    if (result.success) {
      toast.success('Organizer created successfully')
      setIsCreateOpen(false)
      setNewOrg({ username: '', full_name: '' })
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to create organizer')
    }
  }

  async function handleUpdate() {
    if (!editingOrg) return
    setSaving(true)
    const result = await updateOrganizer(projectUuid, {
      organizer_uuid: editingOrg.organizer_uuid,
      full_name: editingOrg.full_name,
      is_active: editingOrg.is_active,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Organizer updated successfully')
      setEditingOrg(null)
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to update organizer')
    }
  }

  async function handleToggleStatus(org: Organizer) {
    const result = await toggleOrganizerStatus(projectUuid, org.organizer_uuid)
    if (result.success) {
      toast.success(`Organizer ${org.is_active ? 'deactivated' : 'activated'}`)
      fetchOrganizers()
    } else {
      toast.error(result.error || 'Failed to toggle status')
    }
  }

  async function handleResetPassword() {
    if (!resetOrg || !newPassword) {
      toast.error('Please enter a new password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setSaving(true)
    const result = await forceResetPassword(projectUuid, {
      organizer_uuid: resetOrg.organizer_uuid,
      new_password: newPassword,
    })
    setSaving(false)
    if (result.success) {
      toast.success('Password reset successfully')
      setResetOrg(null)
      setNewPassword('')
    } else {
      toast.error(result.error || 'Failed to reset password')
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <Card className="glass shadow-xl shadow-primary/5 border-white/10 overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/10 pb-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-display">All Organizers</CardTitle>
              <CardDescription className="font-medium">Manage user accounts and permissions for this project.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Search username or name..."
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
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="p-6 bg-primary/5 border-b border-white/5 md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Username</Label>
                  <Input
                    placeholder="Filter by username..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.username}
                    onChange={e => handleColumnFilterChange('username', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Password Note</Label>
                  <Input
                    placeholder="Filter by password..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.passwordNote}
                    onChange={e => handleColumnFilterChange('passwordNote', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider opacity-60 ml-1">Full Name</Label>
                  <Input
                    placeholder="Filter by name..."
                    className="h-10 bg-white/5 border-white/10 rounded-xl text-sm"
                    value={columnFilters.fullName}
                    onChange={e => handleColumnFilterChange('fullName', e.target.value)}
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
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground mt-4 animate-pulse">Loading organizers...</p>
            </div>
          ) : organizers.length === 0 ? (
            <div className="text-center p-20 glass m-6 rounded-3xl border-dashed">
              <User className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
              <p className="text-lg font-display font-bold">No organizers found</p>
              <p className="text-sm text-muted-foreground italic mt-2">Add your first organizer to start managing the project.</p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="md:hidden divide-y divide-white/5">
                {paginatedOrganizers.length === 0 ? (
                  <div className="text-center p-12 text-muted-foreground italic">No results matching your search.</div>
                ) : (
                  paginatedOrganizers.map((org) => (
                    <div key={org.organizer_uuid} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1.5">
                          <p className="font-bold text-lg text-foreground group-hover:text-primary transition-colors leading-tight">{org.full_name}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground font-mono">{org.username}</p>
                            <span className="text-muted-foreground/20 text-[10px]">|</span>
                            <div className="flex items-center gap-1">
                              <code className="text-[10px] font-bold text-primary font-mono">{org.password_note || '-'}</code>
                              {org.password_note && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-white/10"
                                  onClick={() => copyToClipboard(org.password_note!, org.organizer_uuid)}
                                >
                                  {copiedId === org.organizer_uuid ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-muted-foreground/60" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge className={cn("rounded-full px-3 text-[10px] font-bold", org.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5 text-xs">
                        <div className="flex items-center gap-3 text-muted-foreground/80 font-medium">
                          <Calendar className="h-3.5 w-3.5 shrink-0 opacity-40" />
                          <span>Created: {format(new Date(org.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground/80 font-medium italic">
                          <Clock className="h-3.5 w-3.5 shrink-0 opacity-40" />
                          <span>Last Login: {org.last_login ? format(new Date(org.last_login), 'MMM d, HH:mm') : 'Never'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 pt-2">
                        <Button variant="outline" size="sm" className="h-9 rounded-full bg-white/5 border-white/10 hover:bg-white/10 flex-1" onClick={() => setEditingOrg({ ...org })}>
                          <Pencil className="h-3.5 w-3.5 mr-2" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-full bg-white/5 border-white/10 hover:bg-blue-500/10 hover:text-blue-500 flex-1" onClick={() => { setResetOrg(org); setNewPassword(org.password_note || ''); setShowPassword(false); }}>
                          <KeyRound className="h-3.5 w-3.5 mr-2" /> Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn("h-9 w-9 rounded-full bg-white/5 border-white/10", org.is_active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500')}
                          onClick={() => handleToggleStatus(org)}
                        >
                          <Power className={cn("h-4 w-4", org.is_active ? 'text-emerald-500' : 'text-muted-foreground')} />
                        </Button>
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
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest pl-6">Username</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Password Note</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Full Name</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Status</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest">Last Login</TableHead>
                      <TableHead className="text-right font-bold text-[10px] uppercase tracking-widest pr-6">Actions</TableHead>
                    </TableRow>
                    {showFilters && (
                      <TableRow className="hover:bg-transparent border-white/5 bg-primary/5 animate-in fade-in duration-500">
                        <TableHead className="pl-6 py-2">
                          <Input
                            placeholder="Filter username..."
                            className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                            value={columnFilters.username}
                            onChange={e => handleColumnFilterChange('username', e.target.value)}
                          />
                        </TableHead>
                        <TableHead className="py-2">
                          <Input
                            placeholder="Filter password..."
                            className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                            value={columnFilters.passwordNote}
                            onChange={e => handleColumnFilterChange('passwordNote', e.target.value)}
                          />
                        </TableHead>
                        <TableHead className="py-2">
                          <Input
                            placeholder="Filter name..."
                            className="h-9 bg-white/5 border-white/10 rounded-lg text-xs"
                            value={columnFilters.fullName}
                            onChange={e => handleColumnFilterChange('fullName', e.target.value)}
                          />
                        </TableHead>
                        <TableHead className="py-2">
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
                        <TableHead className="py-2"></TableHead>
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
                    {filteredOrganizers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-24 italic text-muted-foreground font-medium">
                          No organizers found matching your matrix.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedOrganizers.map((org) => (
                        <TableRow key={org.organizer_uuid} className="border-white/5 hover:bg-white/5 transition-colors group">
                          <TableCell className="pl-6">
                            <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{org.username}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full font-mono uppercase tracking-tighter">{org.password_note || '-'}</code>
                              {org.password_note && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 rounded-full hover:bg-primary/10 group/copy"
                                  onClick={() => copyToClipboard(org.password_note!, org.organizer_uuid)}
                                >
                                  {copiedId === org.organizer_uuid ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/copy:text-primary transition-colors" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-bold text-foreground/80">{org.full_name}</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("rounded-full px-2 py-0 text-[9px] font-bold border", org.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20')}>
                              {org.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[10px] font-bold opacity-60">LOGIN: {org.last_login ? format(new Date(org.last_login), 'MMM d, HH:mm') : 'NEVER'}</span>
                              <span className="text-[9px] font-medium opacity-30 uppercase tracking-widest">INIT: {format(new Date(org.created_at), 'yyyy-MM-dd')}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-primary/10 hover:text-primary group-hover:scale-110 transition-all duration-300"
                                title="Edit"
                                onClick={() => setEditingOrg({ ...org })}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 hover:bg-blue-500/10 hover:text-blue-500 group-hover:scale-110 transition-all duration-300"
                                title="Reset Password"
                                onClick={() => { setResetOrg(org); setNewPassword(org.password_note || ''); setShowPassword(false); }}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-9 w-9 rounded-full bg-white/5 border border-white/10 group-hover:scale-110 transition-all duration-300", org.is_active ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-emerald-500/10 hover:text-emerald-500')}
                                title={org.is_active ? 'Deactivate' : 'Activate'}
                                onClick={() => handleToggleStatus(org)}
                              >
                                <Power className={cn("h-4 w-4", org.is_active ? 'text-emerald-500' : 'text-muted-foreground')} />
                              </Button>
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
              Showing <span className="text-foreground">{filteredOrganizers.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-foreground">{Math.min(startIndex + itemsPerPage, filteredOrganizers.length)}</span> of <span className="text-foreground font-bold">{filteredOrganizers.length}</span> records
            </div>
            {filteredOrganizers.length > itemsPerPage && (
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

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Add New Organizer</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Initialize a new administrative account for this project.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="create-username" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Username</Label>
              <Input
                id="create-username"
                value={newOrg.username}
                onChange={(e) => setNewOrg({ ...newOrg, username: e.target.value })}
                required
                className="h-12 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="create-fullname" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Full Name</Label>
              <Input
                id="create-fullname"
                value={newOrg.full_name}
                onChange={(e) => setNewOrg({ ...newOrg, full_name: e.target.value })}
                required
                className="h-12 bg-white/5 border-white/10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Create account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                <Pencil className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Edit Organizer</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Update administrative profile for <span className="text-foreground font-bold">{editingOrg?.username}</span>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {editingOrg && (
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <Label htmlFor="edit-fullname" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Full Name</Label>
                <Input
                  id="edit-fullname"
                  value={editingOrg.full_name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, full_name: e.target.value })}
                  className="h-12 bg-white/5 border-white/10 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-between p-4 glass rounded-2xl border-white/5">
                <Label className="text-xs font-bold uppercase tracking-tight">Account Status (Active)</Label>
                <Switch
                  checked={editingOrg.is_active}
                  onCheckedChange={(checked) => setEditingOrg({ ...editingOrg, is_active: checked })}
                />
              </div>
            </div>
          )}
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setEditingOrg(null)}>Cancel</Button>
            <Button className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOrg} onOpenChange={(open) => !open && setResetOrg(null)}>
        <DialogContent className="glass sm:max-w-[480px] border-white/10 rounded-3xl shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <KeyRound className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-display font-bold">Reset Password</DialogTitle>
                <DialogDescription className="font-medium italic">
                  Establish a new secure password for <span className="text-foreground font-bold">{resetOrg?.username}</span>.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label htmlFor="new-password" className="text-[10px] font-bold uppercase tracking-widest text-primary/60">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="pr-12 h-12 bg-white/5 border-white/10 rounded-xl"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-10 w-10 hover:bg-white/5 rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground italic font-medium">Minimum 6 characters required for security.</p>
            </div>
          </div>
          <DialogFooter className="p-8 bg-white/5 border-t border-white/10 flex sm:flex-row gap-3">
            <Button variant="ghost" className="rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest" onClick={() => setResetOrg(null)}>Cancel</Button>
            <Button className="btn-aurora rounded-2xl h-12 flex-1 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20" onClick={handleResetPassword} disabled={saving || newPassword.length < 6}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
})

OrganizerList.displayName = 'OrganizerList'
