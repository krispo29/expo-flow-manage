'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getExhibitors,
  toggleStatusExhibitor,
  forcePasswordResetExhibitor,
  sendExhibitorCredentials,
  testLoginExhibitor,
} from '@/app/actions/exhibitor'
import {
  getOrganizerExhibitors,
  toggleStatusOrganizerExhibitor,
  forceResetPasswordOrganizerExhibitor,
  sendMailCredentialOrganizerExhibitor,
  sendPendingBusinessMatchingReadyEmailsOrganizerExhibitor,
  testLoginOrganizerExhibitor,
} from '@/app/actions/organizer-exhibitor'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
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
  Plus,
  Pencil,
  KeyRound,
  Loader2,
  Mail,
  Power,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  EyeOff,
  LogIn,
  CheckCircle2,
  XCircle,
  Filter,
  X,
  Copy,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { copyTextToClipboard } from '@/lib/clipboard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ExhibitorsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')
  const { user, isAuthenticated, isHydrated } = useAuthStore()
  const isOrganizer = user?.role === 'ORGANIZER'

  const [exhibitors, setExhibitors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [businessMatchingReadyDialogOpen, setBusinessMatchingReadyDialogOpen] =
    useState(false)
  const [selectedExhibitor, setSelectedExhibitor] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [sendingBusinessMatchingReadyEmails, setSendingBusinessMatchingReadyEmails] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')

  const [testLoginDialogOpen, setTestLoginDialogOpen] = useState(false)
  const [testLoginPassword, setTestLoginPassword] = useState('')
  const [testingLogin, setTestingLogin] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Column filter state
  const [showFilters, setShowFilters] = useState(false)
  const [columnFilters, setColumnFilters] = useState({
    companyName: '',
    username: '',
    eventName: '',
    isActive: 'all', // 'all', 'active', 'inactive'
  })

  // Show/Hide password state
  const [showPassword, setShowPassword] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const copyToClipboard = async (text: string, id: string) => {
    if (!text) return

    try {
      await copyTextToClipboard(text)
      setCopiedId(id)
      toast.success('Password copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy exhibitor password:', error)
      toast.error('Failed to copy password')
    }
  }

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filter exhibitors based on search and column filters
  const filteredExhibitors = exhibitors.filter((item) => {
    // Global search
    const matchesSearch =
      !searchQuery ||
      (item.username &&
        item.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.companyName &&
        item.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.eventName &&
        item.eventName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.boothNo &&
        item.boothNo.toLowerCase().includes(searchQuery.toLowerCase()))

    // Column specific filters
    const matchesCompany =
      !columnFilters.companyName ||
      (item.companyName &&
        item.companyName
          .toLowerCase()
          .includes(columnFilters.companyName.toLowerCase()))

    const matchesUsername =
      !columnFilters.username ||
      (item.username &&
        item.username
          .toLowerCase()
          .includes(columnFilters.username.toLowerCase()))

    const matchesEvent =
      !columnFilters.eventName ||
      (item.eventName &&
        item.eventName
          .toLowerCase()
          .includes(columnFilters.eventName.toLowerCase()))

    const matchesStatus =
      columnFilters.isActive === 'all' ||
      (columnFilters.isActive === 'active' && item.isActive) ||
      (columnFilters.isActive === 'inactive' && !item.isActive)

    return (
      matchesSearch &&
      matchesCompany &&
      matchesUsername &&
      matchesEvent &&
      matchesStatus
    )
  })

  const pendingBusinessMatchingReadyExhibitors = exhibitors.filter(
    (item) =>
      !item.isBusinessMatchingReadyEmailSent &&
      item.canSendBusinessMatchingReadyEmail
  )

  // Calculate pagination based on FILTERED data
  const totalPages = Math.ceil(filteredExhibitors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedExhibitors = filteredExhibitors.slice(
    startIndex,
    startIndex + itemsPerPage
  )

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
    setColumnFilters((prev) => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setColumnFilters({
      companyName: '',
      username: '',
      eventName: '',
      isActive: 'all',
    })
    setSearchQuery('')
    setCurrentPage(1)
    setShowFilters(false)
  }

  // Wait for fetchExhibitors
  const fetchExhibitors = async () => {
    if (!isOrganizer && !projectId) return
    setLoading(true)

    let result
    if (isOrganizer) {
      result = await getOrganizerExhibitors()
    } else {
      result = await getExhibitors(projectId!)
    }

    if (result.success && result.exhibitors) {
      setExhibitors(result.exhibitors)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchExhibitors()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isOrganizer])

  async function handleToggleStatus(id: string) {
    let result
    if (isOrganizer) {
      result = await toggleStatusOrganizerExhibitor(id)
    } else {
      if (!projectId) return
      result = await toggleStatusExhibitor(projectId, id)
    }

    if (result.success) {
      toast.success('Status toggled successfully')
      fetchExhibitors()
    } else {
      toast.error('Failed to toggle status')
    }
  }

  function handleOpenPasswordDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setNewPassword(exhibitor.passwordNote || '')
    setShowPassword(false)
    setPasswordDialogOpen(true)
  }

  function handleOpenTestLoginDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setTestLoginPassword('')
    setShowPassword(false)
    setTestLoginDialogOpen(true)
  }

  function handleOpenEmailDialog(exhibitor: any) {
    setSelectedExhibitor(exhibitor)
    setTargetEmail(exhibitor.email || exhibitor.username || '')
    setEmailDialogOpen(true)
  }

  async function handleSendCredentials() {
    if (!selectedExhibitor) return

    setSendingEmail(true)
    let result
    if (isOrganizer) {
      result = await sendMailCredentialOrganizerExhibitor([
        {
          exhibitor_uuid: selectedExhibitor.id,
          email: targetEmail,
        },
      ])
    } else {
      if (!projectId) return
      result = await sendExhibitorCredentials(
        projectId,
        selectedExhibitor.id,
        targetEmail
      )
    }
    setSendingEmail(false)

    if (result.success) {
      toast.success('Credentials sent successfully')
      setEmailDialogOpen(false)
    } else {
      toast.error('Failed to send credentials')
    }
  }

  async function handleSendBusinessMatchingReadyEmails() {
    if (pendingBusinessMatchingReadyExhibitors.length === 0) return

    setSendingBusinessMatchingReadyEmails(true)
    try {
      const result = await sendPendingBusinessMatchingReadyEmailsOrganizerExhibitor(
        pendingBusinessMatchingReadyExhibitors.map((item) => item.id)
      )

      if (result.success) {
        toast.success(`Business Matching emails sent: ${result.sent_count || 0}`)
        if (result.skipped_count) toast.error(`Skipped: ${result.skipped_count}`)
        setBusinessMatchingReadyDialogOpen(false)
        fetchExhibitors()
      } else {
        toast.error('Failed to send Business Matching emails')
      }
    } finally {
      setSendingBusinessMatchingReadyEmails(false)
    }
  }

  async function handleResetPassword() {
    if (!selectedExhibitor) return
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setSavingPassword(true)
    let result
    if (isOrganizer) {
      result = await forceResetPasswordOrganizerExhibitor(
        selectedExhibitor.id,
        newPassword
      )
    } else {
      if (!projectId) return
      result = await forcePasswordResetExhibitor(
        projectId,
        selectedExhibitor.id,
        newPassword
      )
    }
    setSavingPassword(false)

    if (result.success) {
      toast.success('Password reset successfully')
      setPasswordDialogOpen(false)
    } else {
      toast.error(result.error || 'Failed to reset password')
    }
  }

  async function handleTestLogin() {
    if (!selectedExhibitor) return
    if (!testLoginPassword) {
      toast.error('Password is required')
      return
    }

    setTestingLogin(true)

    let result
    if (isOrganizer) {
      result = await testLoginOrganizerExhibitor({
        username: selectedExhibitor.username,
        password: testLoginPassword,
      })
    } else {
      if (!projectId) return
      result = await testLoginExhibitor(projectId, {
        username: selectedExhibitor.username,
        password: testLoginPassword,
      })
    }

    setTestingLogin(false)

    if (result.success) {
      toast.success('Login Successful! Credentials are valid.')
      setTestLoginDialogOpen(false)
    } else {
      toast.error(result.error || 'Invalid credentials')
    }
  }

  if (!isHydrated || !isAuthenticated || !user) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!isOrganizer && !projectId) {
    return (
      <div className="glass flex h-[50vh] flex-col items-center justify-center rounded-3xl p-12">
        <h2 className="font-display mb-2 text-2xl font-bold">
          No Project Selected
        </h2>
        <p className="text-muted-foreground/80 mb-6">
          Please select a project from the dashboard.
        </p>
        <Link href="/admin/projects">
          <Button variant="outline" className="rounded-full px-8">
            Select Project
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Exhibitors
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor all exhibitors in the system.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrganizer && pendingBusinessMatchingReadyExhibitors.length > 0 && (
            <Button
              variant="outline"
              className="rounded-full px-6 font-semibold"
              onClick={() => setBusinessMatchingReadyDialogOpen(true)}
              disabled={sendingBusinessMatchingReadyEmails}
            >
              {sendingBusinessMatchingReadyEmails ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Mail className="mr-2 h-5 w-5" />
              )}
              Send Business Matching Ready ({pendingBusinessMatchingReadyExhibitors.length})
            </Button>
          )}
          <Link
            href={
              isOrganizer
                ? `/organizer/exhibitors/new`
                : `/organizer/exhibitors/new?projectId=${projectId}`
            }
          >
            <Button className="btn-aurora rounded-full px-6 font-semibold">
              <Plus className="mr-2 h-5 w-5" /> Add Exhibitor
            </Button>
          </Link>
        </div>
      </div>

      <Dialog
        open={businessMatchingReadyDialogOpen}
        onOpenChange={setBusinessMatchingReadyDialogOpen}
      >
        <DialogContent className="glass rounded-3xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Send Business Matching is Ready!
            </DialogTitle>
            <DialogDescription>
              Send the Business Matching is Ready! email to the first staff
              member of {pendingBusinessMatchingReadyExhibitors.length}{' '}
              exhibitors.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setBusinessMatchingReadyDialogOpen(false)}
              disabled={sendingBusinessMatchingReadyEmails}
            >
              Cancel
            </Button>
            <Button
              className="btn-aurora rounded-full px-6"
              onClick={handleSendBusinessMatchingReadyEmails}
              disabled={sendingBusinessMatchingReadyEmails}
            >
              {sendingBusinessMatchingReadyEmails ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="glass shadow-primary/5 shadow-xl">
        <CardHeader className="border-b border-white/10 bg-white/5">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <CardTitle className="font-display text-2xl">
                All Exhibitors
              </CardTitle>
              <CardDescription>
                Manage exhibitor accounts and quotas
              </CardDescription>
            </div>
            <div className="flex w-full max-w-lg items-center gap-2 max-sm:max-w-none">
              <div className="group relative flex-1">
                <Search className="text-muted-foreground/60 group-focus-within:text-primary absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors" />
                <Input
                  placeholder="Search by company, booth, username..."
                  className="focus-visible:ring-primary/30 h-11 rounded-full border-white/10 bg-white/5 pl-11 transition-all focus:bg-white/10"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <Button
                variant={showFilters ? 'default' : 'outline'}
                size="icon"
                className={cn(
                  'h-11 w-11 shrink-0 rounded-full transition-all',
                  showFilters
                    ? 'shadow-primary/20 shadow-lg'
                    : 'border-white/10 bg-white/5'
                )}
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle Filters"
              >
                <Filter className="h-4 w-4" />
              </Button>
              {(showFilters ||
                searchQuery ||
                Object.values(columnFilters).some(
                  (v) => v !== '' && v !== 'all'
                )) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-11 w-11 shrink-0 rounded-full border border-red-500/10 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={clearFilters}
                  title="Clear All Filters"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {showFilters && (
            <div className="bg-primary/5 animate-in slide-in-from-top-2 space-y-4 border-b border-white/5 p-6 duration-300 md:hidden">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="ml-1 text-[10px] font-bold tracking-wider uppercase opacity-60">
                    Company Name
                  </Label>
                  <Input
                    placeholder="Filter by company..."
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-sm"
                    value={columnFilters.companyName}
                    onChange={(e) =>
                      handleColumnFilterChange('companyName', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-[10px] font-bold tracking-wider uppercase opacity-60">
                    Username
                  </Label>
                  <Input
                    placeholder="Filter by username..."
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-sm"
                    value={columnFilters.username}
                    onChange={(e) =>
                      handleColumnFilterChange('username', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-[10px] font-bold tracking-wider uppercase opacity-60">
                    Event Name
                  </Label>
                  <Input
                    placeholder="Filter by event..."
                    className="h-10 rounded-xl border-white/10 bg-white/5 text-sm"
                    value={columnFilters.eventName}
                    onChange={(e) =>
                      handleColumnFilterChange('eventName', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="ml-1 text-[10px] font-bold tracking-wider uppercase opacity-60">
                    Status
                  </Label>
                  <Select
                    value={columnFilters.isActive}
                    onValueChange={(v) =>
                      handleColumnFilterChange('isActive', v)
                    }
                  >
                    <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-sm">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent className="glass rounded-xl border-white/10">
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
              <Loader2 className="text-primary h-10 w-10 animate-spin" />
              <p className="text-muted-foreground mt-4 animate-pulse text-sm">
                Loading exhibitors...
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View: Cards */}
              <div className="divide-y divide-white/5 md:hidden">
                {paginatedExhibitors.length === 0 ? (
                  <div className="text-muted-foreground p-12 text-center italic">
                    {searchQuery
                      ? 'No results matching your search terms.'
                      : 'No exhibitors found.'}
                  </div>
                ) : (
                  paginatedExhibitors.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="space-y-4 p-6 transition-colors hover:bg-white/5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-lg font-bold">
                            {item.companyName}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <p className="text-muted-foreground font-mono text-xs">
                              {item.username || '-'}
                            </p>
                            <span className="text-muted-foreground/20 text-[10px]">
                              |
                            </span>
                            <div className="flex items-center gap-1">
                              <code className="text-primary font-mono text-[10px] font-bold">
                                {item.passwordNote || '-'}
                              </code>
                              {item.passwordNote && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 rounded-md hover:bg-white/10"
                                  onClick={() =>
                                    void copyToClipboard(
                                      item.passwordNote!,
                                      item.id
                                    )
                                  }
                                >
                                  {copiedId === item.id ? (
                                    <Check className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="text-muted-foreground/60 h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={item.isActive ? 'default' : 'secondary'}
                          className={cn(
                            'rounded-full px-3',
                            item.isActive
                              ? 'border-green-500/20 bg-green-500/10 text-green-500'
                              : 'bg-muted/50'
                          )}
                        >
                          {item.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                            Event / Booth
                          </p>
                          <p className="truncate font-medium">
                            {item.eventName || '-'}{' '}
                            {item.boothNo ? `(${item.boothNo})` : ''}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground text-[10px] font-semibold uppercase">
                            Quota
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {item.usedQuota} / {item.totalQuota || 0}
                            </span>
                            {item.is_quota_full || item.isQuotaFull ? (
                              <Badge
                                variant="destructive"
                                className="flex h-4 w-4 items-center justify-center rounded-full p-0"
                              >
                                <XCircle className="h-2.5 w-2.5" />
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="flex h-4 w-4 items-center justify-center rounded-full border-green-500/20 bg-green-500/10 p-0 text-green-500"
                              >
                                <CheckCircle2 className="h-2.5 w-2.5" />
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 rounded-full"
                          onClick={() => handleOpenTestLoginDialog(item)}
                        >
                          <LogIn className="mr-2 h-3.5 w-3.5 text-orange-500" />{' '}
                          Test
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1 rounded-full"
                          onClick={() => handleOpenEmailDialog(item)}
                        >
                          <Mail className="mr-2 h-3.5 w-3.5 text-purple-500" />{' '}
                          Send
                        </Button>
                        <Link
                          href={
                            isOrganizer
                              ? `/organizer/exhibitors/${item.id}`
                              : `/organizer/exhibitors/${item.id}?projectId=${projectId}`
                          }
                          className="flex-1"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 w-full rounded-full"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 shrink-0 rounded-full"
                          onClick={() => handleOpenPasswordDialog(item)}
                        >
                          <KeyRound className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            'h-9 w-9 shrink-0 rounded-full',
                            item.isActive
                              ? 'hover:text-red-500'
                              : 'hover:text-green-500'
                          )}
                          onClick={() => handleToggleStatus(item.id)}
                        >
                          <Power
                            className={cn(
                              'h-3.5 w-3.5',
                              item.isActive
                                ? 'text-green-500'
                                : 'text-muted-foreground'
                            )}
                          />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="py-5 pl-6 font-bold">
                        Company
                      </TableHead>
                      <TableHead className="font-bold">Username</TableHead>
                      <TableHead className="font-bold">Password</TableHead>
                      <TableHead className="font-bold">Event & Booth</TableHead>
                      <TableHead className="font-bold">Status</TableHead>
                      <TableHead className="text-center font-bold">
                        Quota
                      </TableHead>
                      <TableHead className="pr-6 text-right font-bold">
                        Actions
                      </TableHead>
                    </TableRow>
                    {showFilters && (
                      <TableRow className="bg-primary/5 animate-in fade-in border-white/5 duration-500 hover:bg-transparent">
                        <TableHead className="py-2 pl-6">
                          <Input
                            placeholder="Filter company..."
                            className="h-9 rounded-lg border-white/10 bg-white/5 text-xs"
                            value={columnFilters.companyName}
                            onChange={(e) =>
                              handleColumnFilterChange(
                                'companyName',
                                e.target.value
                              )
                            }
                          />
                        </TableHead>
                        <TableHead className="py-2">
                          <Input
                            placeholder="Filter username..."
                            className="h-9 rounded-lg border-white/10 bg-white/5 text-xs"
                            value={columnFilters.username}
                            onChange={(e) =>
                              handleColumnFilterChange(
                                'username',
                                e.target.value
                              )
                            }
                          />
                        </TableHead>
                        <TableHead className="py-2"></TableHead>
                        <TableHead className="py-2">
                          <Input
                            placeholder="Filter event..."
                            className="h-9 rounded-lg border-white/10 bg-white/5 text-xs"
                            value={columnFilters.eventName}
                            onChange={(e) =>
                              handleColumnFilterChange(
                                'eventName',
                                e.target.value
                              )
                            }
                          />
                        </TableHead>
                        <TableHead className="py-2">
                          <Select
                            value={columnFilters.isActive}
                            onValueChange={(v) =>
                              handleColumnFilterChange('isActive', v)
                            }
                          >
                            <SelectTrigger className="h-9 rounded-lg border-white/10 bg-white/5 text-xs">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent className="glass rounded-xl border-white/10">
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableHead>
                        <TableHead className="py-2"></TableHead>
                        <TableHead className="py-2 pr-6 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground h-8 text-[10px] font-bold tracking-tight uppercase transition-colors hover:text-red-500"
                            onClick={clearFilters}
                          >
                            Reset
                          </Button>
                        </TableHead>
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {filteredExhibitors.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-muted-foreground py-20 text-center italic"
                        >
                          {searchQuery
                            ? 'No results matching your search terms.'
                            : 'No exhibitors found.'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedExhibitors.map((item, index) => (
                        <TableRow
                          key={`${item.id}-${index}`}
                          className="group border-white/5 transition-colors hover:bg-white/5"
                        >
                          <TableCell className="pl-6">
                            <div className="text-foreground group-hover:text-primary font-bold transition-colors">
                              {item.companyName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground font-medium">
                              {item.username || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-primary/10 text-primary rounded-full px-2 py-0.5 font-mono text-[10px] font-bold">
                                {item.passwordNote || '-'}
                              </code>
                              {item.passwordNote && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-primary/10 group/copy h-7 w-7 rounded-full"
                                  onClick={() =>
                                    void copyToClipboard(
                                      item.passwordNote!,
                                      item.id
                                    )
                                  }
                                >
                                  {copiedId === item.id ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="text-muted-foreground/40 group-hover/copy:text-primary h-3.5 w-3.5 transition-colors" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[200px] truncate font-medium">
                              {item.eventName || '-'}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {item.boothNo
                                ? `Booth ${item.boothNo}`
                                : 'No booth info'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.isActive ? 'default' : 'secondary'}
                              className={cn(
                                'rounded-full px-3',
                                item.isActive
                                  ? 'border-green-500/20 bg-green-500/10 text-green-500'
                                  : 'bg-muted/50'
                              )}
                            >
                              {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="font-bold">
                                {item.usedQuota}{' '}
                                <span className="text-muted-foreground/40 font-normal">
                                  /
                                </span>{' '}
                                {item.totalQuota || 0}
                              </span>
                              {item.is_quota_full || item.isQuotaFull ? (
                                <Badge
                                  variant="destructive"
                                  className="h-1.5 w-10 animate-pulse rounded-full p-0"
                                />
                              ) : (
                                <div className="h-1.5 w-10 overflow-hidden rounded-full bg-green-500/20">
                                  <div
                                    className="h-full bg-green-500"
                                    style={{
                                      width: `${Math.min(100, (item.usedQuota / (item.totalQuota || 1)) * 100)}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:bg-orange-500/10 hover:text-orange-500"
                                title="Test Login"
                                onClick={() => handleOpenTestLoginDialog(item)}
                              >
                                <LogIn className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:bg-purple-500/10 hover:text-purple-500"
                                title="Send Credentials"
                                onClick={() => handleOpenEmailDialog(item)}
                              >
                                <Mail className="h-4 w-4" />
                              </Button>

                              <Link
                                href={
                                  isOrganizer
                                    ? `/organizer/exhibitors/${item.id}`
                                    : `/organizer/exhibitors/${item.id}?projectId=${projectId}`
                                }
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-primary/10 hover:text-primary h-9 w-9 rounded-full border border-white/10 bg-white/5 transition-all duration-300"
                                  title="Edit"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 rounded-full border border-white/10 bg-white/5 transition-all duration-300 hover:bg-blue-500/10 hover:text-blue-500"
                                title="Reset Password"
                                onClick={() => handleOpenPasswordDialog(item)}
                              >
                                <KeyRound className="h-4 w-4" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                  'h-9 w-9 rounded-full border border-white/10 bg-white/5 transition-all duration-300',
                                  item.isActive
                                    ? 'hover:bg-red-500/10 hover:text-red-500'
                                    : 'hover:bg-green-500/10 hover:text-green-500'
                                )}
                                title={
                                  item.isActive ? 'Deactivate' : 'Activate'
                                }
                                onClick={() => handleToggleStatus(item.id)}
                              >
                                <Power
                                  className={cn(
                                    'h-4 w-4',
                                    item.isActive
                                      ? 'text-green-500'
                                      : 'text-muted-foreground'
                                  )}
                                />
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

          <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 bg-white/5 p-6 sm:flex-row">
            <div className="text-muted-foreground text-sm font-medium italic">
              Showing{' '}
              <span className="text-foreground">
                {filteredExhibitors.length > 0 ? startIndex + 1 : 0}
              </span>{' '}
              to{' '}
              <span className="text-foreground">
                {Math.min(startIndex + itemsPerPage, filteredExhibitors.length)}
              </span>{' '}
              of{' '}
              <span className="text-foreground font-bold">
                {filteredExhibitors.length}
              </span>{' '}
              results
            </div>
            {filteredExhibitors.length > itemsPerPage && (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-white/10 bg-white/5"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-white/10 bg-white/5"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="mx-1 flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage
                    if (currentPage <= 3) pageNum = i + 1
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i
                    else pageNum = currentPage - 2 + i

                    if (pageNum > 0 && pageNum <= totalPages) {
                      return (
                        <Button
                          key={pageNum}
                          variant={
                            currentPage === pageNum ? 'default' : 'outline'
                          }
                          size="icon"
                          className={cn(
                            'h-9 w-9 rounded-full text-xs font-bold',
                            currentPage === pageNum
                              ? 'shadow-primary/20 shadow-lg'
                              : 'border-white/10 bg-white/5'
                          )}
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
                  className="h-9 w-9 rounded-full border-white/10 bg-white/5"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-white/10 bg-white/5"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialogs with Glass Styling */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="glass rounded-3xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for{' '}
              <span className="text-foreground font-semibold">
                {selectedExhibitor?.companyName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-white/10 bg-white/5 pr-12"
                  placeholder="Min 6 chars (A-Z, a-z, 0-9)"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-10 w-10 rounded-lg hover:bg-white/5"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <Eye className="text-muted-foreground h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground pl-1 text-[10px] italic">
                Minimum 6 characters (A-Z, a-z, 0-9 only)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setPasswordDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="btn-aurora rounded-full px-6"
              onClick={handleResetPassword}
              disabled={savingPassword || newPassword.length < 6}
            >
              {savingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              Save Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testLoginDialogOpen} onOpenChange={setTestLoginDialogOpen}>
        <DialogContent className="glass rounded-3xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Test Exhibitor Login
            </DialogTitle>
            <DialogDescription>
              Verify credentials for{' '}
              <span className="text-foreground font-semibold">
                {selectedExhibitor?.companyName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={selectedExhibitor?.username || ''}
                readOnly
                className="text-muted-foreground h-12 rounded-xl border-white/10 bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="testPassword">Password</Label>
              <div className="relative">
                <Input
                  id="testPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={testLoginPassword}
                  onChange={(e) => setTestLoginPassword(e.target.value)}
                  className="h-12 rounded-xl border-white/10 bg-white/5 pr-12"
                  placeholder="Enter password to test"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-10 w-10 rounded-lg hover:bg-white/5"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="text-muted-foreground h-4 w-4" />
                  ) : (
                    <Eye className="text-muted-foreground h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setTestLoginDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="btn-aurora rounded-full px-6"
              onClick={handleTestLogin}
              disabled={testingLogin || !testLoginPassword}
            >
              {testingLogin ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Test Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="glass rounded-3xl border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              Send Credentials
            </DialogTitle>
            <DialogDescription>
              Email login credentials to{' '}
              <span className="text-foreground font-semibold">
                {selectedExhibitor?.companyName}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="targetEmail">Recipient Email</Label>
              <Input
                id="targetEmail"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="h-12 rounded-xl border-white/10 bg-white/5"
                placeholder="example@email.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-full px-6"
              onClick={() => setEmailDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="btn-aurora rounded-full px-6"
              onClick={handleSendCredentials}
              disabled={sendingEmail}
            >
              {sendingEmail ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Send Credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
