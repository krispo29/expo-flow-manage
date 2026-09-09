'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowUpDown,
  Ban,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Copy,
  Download,
  FileDown,
  LayoutGrid,
  Loader2,
  Percent,
  PowerOff,
  QrCode,
  RefreshCw,
  Rows3,
  ScanLine,
  Search,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  disableAllLeadScanners,
  exportLeadScannerUsage,
  getLeadScannerUsage,
  type LeadScannerUsage as LeadScannerUsageData,
} from '@/app/actions/lead-scanner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadScannerPeakHours } from '@/components/lead-scanner-peak-hours'

type Props = { projectId?: string }
type SortField = 'company' | 'scanned' | 'contacts' | 'exported' | 'downloads' | 'status'
type SortOrder = 'asc' | 'desc'
type StatusFilter = 'all' | 'downloaded' | 'not_downloaded' | 'inactive'

function formatReportDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'MMM d, yyyy')
}

export function LeadScannerUsage({ projectId }: Props) {
  const [report, setReport] = useState<LeadScannerUsageData | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('total')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('scanned')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disabling, setDisabling] = useState(false)
  const [copiedCompany, setCopiedCompany] = useState<string | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const target = e.target as HTMLElement
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          searchInputRef.current?.focus()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const loadUsage = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getLeadScannerUsage(projectId)
    if (result.success) {
      setReport(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }, [projectId])

  useEffect(() => {
    void loadUsage()
  }, [loadUsage])

  const days = useMemo(
    () => (report?.days ?? []).filter((d) => d.dayLabel.toLowerCase() !== 'overall'),
    [report],
  )

  const handlePrevDay = useCallback(() => {
    if (selectedDay === 'total') {
      if (days.length > 0) setSelectedDay(days[0].dayLabel)
    } else {
      const idx = days.findIndex((d) => d.dayLabel === selectedDay)
      if (idx > 0) setSelectedDay(days[idx - 1].dayLabel)
    }
    setCurrentPage(1)
  }, [days, selectedDay])

  const handleNextDay = useCallback(() => {
    if (selectedDay === 'total') {
      if (days.length > 0) setSelectedDay(days[0].dayLabel)
    } else {
      const idx = days.findIndex((d) => d.dayLabel === selectedDay)
      if (idx >= 0 && idx < days.length - 1) setSelectedDay(days[idx + 1].dayLabel)
    }
    setCurrentPage(1)
  }, [days, selectedDay])

  const activeDay = useMemo(() => {
    if (selectedDay === 'total') return null
    return report?.days?.find((d) => d.dayLabel === selectedDay) ?? null
  }, [report, selectedDay])

  const activeUsage = useMemo(() => {
    if (selectedDay === 'total') {
      if (report?.overall && report.overall.length > 0) {
        return report.overall
      }
      const overallDay = report?.days?.find((d) => d.dayLabel.toLowerCase() === 'overall')
      return overallDay ? overallDay.overall : (report?.overall ?? [])
    }
    const found = report?.days?.find((d) => d.dayLabel === selectedDay)
    return found ? found.overall : (report?.overall ?? [])
  }, [report, selectedDay])

  const handleSort = useCallback((field: SortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'))
        return currentField
      }
      setSortOrder(field === 'company' ? 'asc' : 'desc')
      return field
    })
    setCurrentPage(1)
  }, [])

  const filterCounts = useMemo(() => {
    let downloaded = 0
    let notDownloaded = 0
    let inactive = 0
    for (const item of activeUsage) {
      if (item.isDownloaded) downloaded++
      else notDownloaded++
      if ((item.totalScanned ?? 0) === 0) inactive++
    }
    return {
      all: activeUsage.length,
      downloaded,
      notDownloaded,
      inactive,
    }
  }, [activeUsage])

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    const filtered = activeUsage.filter((item) => {
      if (search && !item.companyName.toLowerCase().includes(search)) {
        return false
      }
      if (statusFilter === 'downloaded' && !item.isDownloaded) {
        return false
      }
      if (statusFilter === 'not_downloaded' && item.isDownloaded) {
        return false
      }
      if (statusFilter === 'inactive' && (item.totalScanned ?? 0) > 0) {
        return false
      }
      return true
    })

    return filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === 'company') {
        comparison = a.companyName.localeCompare(b.companyName)
      } else if (sortField === 'scanned') {
        comparison = (a.totalScanned ?? 0) - (b.totalScanned ?? 0)
      } else if (sortField === 'contacts') {
        comparison = (a.totalContact ?? 0) - (b.totalContact ?? 0)
      } else if (sortField === 'exported') {
        comparison = (a.totalExportedContact ?? 0) - (b.totalExportedContact ?? 0)
      } else if (sortField === 'downloads') {
        comparison = (a.totalDownloadCount ?? 0) - (b.totalDownloadCount ?? 0)
      } else if (sortField === 'status') {
        comparison = Number(Boolean(a.isDownloaded)) - Number(Boolean(b.isDownloaded))
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [query, activeUsage, statusFilter, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize))
  const validPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (validPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, rows.length)
  const paginatedRows = useMemo(
    () => rows.slice(startIndex, endIndex),
    [rows, startIndex, endIndex],
  )

  const totals = useMemo(() => {
    if (selectedDay === 'total') {
      const scanned = report?.totalScanned ?? activeUsage.reduce((acc, item) => acc + (item.totalScanned ?? 0), 0)
      const contacts = report?.totalContact ?? activeUsage.reduce((acc, item) => acc + (item.totalContact ?? 0), 0)
      const exportedContacts =
        report?.totalExportedContact ??
        activeUsage.reduce((acc, item) => acc + (item.totalExportedContact ?? 0), 0)
      const downloadCount =
        report?.totalDownloadCount ??
        activeUsage.reduce((acc, item) => acc + (item.totalDownloadCount ?? 0), 0)
      const enabledCount = report?.totalLeadScannerEnabledCount ?? 0
      return { scanned, contacts, exportedContacts, downloadCount, enabledCount }
    }

    const day = activeDay
    const scanned = day?.totalScanned ?? activeUsage.reduce((acc, item) => acc + (item.totalScanned ?? 0), 0)
    const contacts = day?.totalContact ?? activeUsage.reduce((acc, item) => acc + (item.totalContact ?? 0), 0)
    const exportedContacts =
      day?.totalExportedContact ??
      activeUsage.reduce((acc, item) => acc + (item.totalExportedContact ?? 0), 0)
    const downloadCount =
      day?.totalDownloadCount ??
      activeUsage.reduce((acc, item) => acc + (item.totalDownloadCount ?? 0), 0)
    const enabledCount = report?.totalLeadScannerEnabledCount ?? 0
    return { scanned, contacts, exportedContacts, downloadCount, enabledCount }
  }, [selectedDay, report, activeUsage, activeDay])

  const subMetrics = useMemo(() => {
    const activeWithScans = activeUsage.filter((item) => (item.totalScanned ?? 0) > 0).length
    const maxScans = activeUsage.reduce((max, item) => Math.max(max, item.totalScanned ?? 0), 0)
    const exportPct =
      totals.contacts > 0
        ? ((totals.exportedContacts / totals.contacts) * 100).toFixed(1)
        : '0'
    const downloadedExhibitors = activeUsage.filter((item) => Boolean(item.isDownloaded)).length
    return {
      activeWithScans,
      maxScans,
      exportPct,
      downloadedExhibitors,
    }
  }, [activeUsage, totals])

  const contactRate = totals.scanned > 0
    ? ((totals.contacts / totals.scanned) * 100).toFixed(1)
    : '0'

  const handleCopyCompany = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopiedCompany(name)
      toast.success(`Copied "${name}"`)
      setTimeout(() => setCopiedCompany(null), 1500)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const handleExport = async () => {
    setExporting(true)
    const result = await exportLeadScannerUsage(projectId)
    setExporting(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    const blob = new Blob([new Uint8Array(result.bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Lead Scanner usage exported')
  }

  const handleDisableAll = async () => {
    setDisabling(true)
    const result = await disableAllLeadScanners(projectId)
    setDisabling(false)
    if (result.success) {
      toast.success('Disabled all Lead Scanners successfully')
      setShowDisableDialog(false)
      await loadUsage()
    } else {
      toast.error(result.error || 'Failed to disable Lead Scanners')
    }
  }

  const reportRange = report ? `${formatReportDate(report.startDate)} – ${formatReportDate(report.endDate)}` : ''

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <ScanLine className="size-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">Lead Scanner</h1>
              <p className="mt-1 text-sm text-muted-foreground">Company usage report{reportRange ? ` · ${reportRange}` : ''}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadUsage()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : <RefreshCw className="mr-2 size-4" />}
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDisableDialog(true)}
            disabled={loading || disabling}
          >
            <PowerOff className="mr-2 size-4" />
            Disable All
          </Button>
          <Button onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Export Excel
          </Button>
        </div>
      </div>

      <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Disable All Lead Scanners
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <span>
                Are you sure you want to disable Lead Scanner for all exhibitors in this project? This will immediately revoke scanner access for all exhibitors and staff members.
              </span>
              {totals.enabledCount > 0 && (
                <span className="block font-medium text-foreground">
                  This will revoke access for all {totals.enabledCount.toLocaleString()} currently enabled exhibitors.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDisableDialog(false)}
              disabled={disabling}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleDisableAll()}
              disabled={disabling}
            >
              {disabling ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Disable All Scanners
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && !report ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-semibold text-destructive">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadUsage()} disabled={loading}>Retry</Button>
          </CardContent>
        </Card>
      ) : loading && !report ? (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="size-8 rounded-lg" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-4 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/60">
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3.5 w-64" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[220px] w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-10 w-full sm:w-72 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

          {days.length > 0 && (
            <div>
              {days.length <= 4 ? (
                <Tabs
                  value={selectedDay}
                  onValueChange={(val) => {
                    setSelectedDay(val)
                    setCurrentPage(1)
                  }}
                  className="w-full"
                >
                  <TabsList className="!h-auto min-h-9 p-1 bg-muted/60 dark:bg-muted/30 border border-border/40 rounded-xl gap-1 inline-flex flex-wrap">
                    <TabsTrigger
                      value="total"
                      data-value="total"
                      className="px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg shrink-0 gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                    >
                      <Calendar className="size-3.5 text-muted-foreground" />
                      Total
                    </TabsTrigger>
                    {days.map((day) => (
                      <TabsTrigger
                        key={day.dayLabel}
                        value={day.dayLabel}
                        data-value={day.dayLabel}
                        className="px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg shrink-0 data-[state=active]:bg-background data-[state=active]:shadow-xs"
                      >
                        {day.dayLabel}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-xl border border-border/60 bg-muted/30">
                  <Button
                    type="button"
                    variant={selectedDay === 'total' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedDay('total')
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "h-9 px-4 rounded-lg font-medium transition-all shadow-xs shrink-0 gap-2 cursor-pointer",
                      selectedDay === 'total' ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                    )}
                  >
                    <Calendar className="size-4" />
                    <span>Total (All {days.length} Days)</span>
                  </Button>

                  <div className="hidden sm:block h-5 w-px bg-border/60 mx-0.5" />

                  <div className="flex items-center gap-1.5 flex-1 min-w-[280px] max-w-[440px]">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-lg shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handlePrevDay}
                      disabled={selectedDay === 'total' || selectedDay === days[0]?.dayLabel}
                      title="Previous day"
                      aria-label="Previous day"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    <Select
                      value={selectedDay}
                      onValueChange={(val) => {
                        setSelectedDay(val)
                        setCurrentPage(1)
                      }}
                    >
                      <SelectTrigger className="h-9 flex-1 rounded-lg bg-background font-medium text-xs sm:text-sm">
                        <SelectValue placeholder="Select event day..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="total" className="font-semibold">
                          📊 All Days (Total)
                        </SelectItem>
                        {days.map((day, idx) => (
                          <SelectItem key={day.dayLabel} value={day.dayLabel}>
                            📅 Day {idx + 1} · {day.dayLabel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-lg shrink-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleNextDay}
                      disabled={selectedDay === days[days.length - 1]?.dayLabel}
                      title="Next day"
                      aria-label="Next day"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>

                  {selectedDay !== 'total' && (
                    <Badge variant="secondary" className="hidden md:inline-flex px-2.5 py-1 text-xs font-mono font-normal">
                      Day {days.findIndex((d) => d.dayLabel === selectedDay) + 1} of {days.length}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Scanner enabled
                  </span>
                  <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
                    <QrCode className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {totals.enabledCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <span className="font-semibold text-foreground">{subMetrics.activeWithScans}</span> active booths
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total scanned
                  </span>
                  <div className="rounded-lg bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400 shrink-0">
                    <ScanLine className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {totals.scanned.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Top booth: <span className="font-semibold text-foreground">{subMetrics.maxScans.toLocaleString()}</span> scans
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total contacts
                  </span>
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Users className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {totals.contacts.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    From {totals.scanned > 0 ? totals.scanned.toLocaleString() : 0} total scans
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Exported contacts
                  </span>
                  <div className="rounded-lg bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400 shrink-0">
                    <FileDown className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {totals.exportedContacts.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    <span className="font-semibold text-foreground">{subMetrics.exportPct}%</span> of contacts exported
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Download count
                  </span>
                  <div className="rounded-lg bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 shrink-0">
                    <Download className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {totals.downloadCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    by <span className="font-semibold text-foreground">{subMetrics.downloadedExhibitors}</span> exhibitors
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 transition-colors hover:border-border">
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    Contact rate
                  </span>
                  <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Percent className="size-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground font-display">
                    {contactRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Conversion ratio
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <LeadScannerPeakHours
            chart={selectedDay === 'total' ? report?.chart : activeDay?.chart}
            data={selectedDay === 'total' ? report?.hourlyTraffic : undefined}
            peakTime={selectedDay === 'total' ? report?.peakTime : undefined}
          />

          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between pb-3">
              <div>
                <CardTitle>Company usage</CardTitle>
                <CardDescription>
                  {selectedDay !== 'total' ? `${selectedDay} · ` : ''}
                  {query || statusFilter !== 'all'
                    ? `Showing ${rows.length} of ${activeUsage.length} companies`
                    : `${activeUsage.length.toLocaleString()} companies in this report`}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search companies... (/)"
                  className="pl-9 pr-8"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setCurrentPage(1)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Clear search"
                  >
                    <X className="size-3.5" />
                  </button>
                ) : (
                  <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border/70 bg-muted/60 px-1.5 font-mono text-[10px] font-medium text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2">
                    /
                  </kbd>
                )}
              </div>
            </CardHeader>

            <div className="flex flex-wrap items-center gap-2 border-y border-border/50 px-6 py-2.5 bg-muted/20">
              <span className="text-xs font-medium text-muted-foreground mr-1">Filter:</span>
              <Button
                variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-2.5"
                onClick={() => {
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
              >
                All
                <span className="ml-1.5 text-[10px] opacity-70 bg-background/60 px-1.5 py-0.5 rounded-full border border-border/40">
                  {filterCounts.all}
                </span>
              </Button>
              <Button
                variant={statusFilter === 'downloaded' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-2.5"
                onClick={() => {
                  setStatusFilter('downloaded')
                  setCurrentPage(1)
                }}
              >
                <CheckCircle2 className="mr-1.5 size-3.5 text-emerald-500" />
                Downloaded
                <span className="ml-1.5 text-[10px] opacity-70 bg-background/60 px-1.5 py-0.5 rounded-full border border-border/40">
                  {filterCounts.downloaded}
                </span>
              </Button>
              <Button
                variant={statusFilter === 'not_downloaded' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-2.5"
                onClick={() => {
                  setStatusFilter('not_downloaded')
                  setCurrentPage(1)
                }}
              >
                <Clock className="mr-1.5 size-3.5 text-amber-500" />
                Pending Download
                <span className="ml-1.5 text-[10px] opacity-70 bg-background/60 px-1.5 py-0.5 rounded-full border border-border/40">
                  {filterCounts.notDownloaded}
                </span>
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-7 text-xs rounded-lg px-2.5"
                onClick={() => {
                  setStatusFilter('inactive')
                  setCurrentPage(1)
                }}
              >
                <Ban className="mr-1.5 size-3.5 text-muted-foreground" />
                No Scans
                <span className="ml-1.5 text-[10px] opacity-70 bg-background/60 px-1.5 py-0.5 rounded-full border border-border/40">
                  {filterCounts.inactive}
                </span>
              </Button>
              {statusFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-foreground px-2 ml-auto"
                  onClick={() => {
                    setStatusFilter('all')
                    setCurrentPage(1)
                  }}
                >
                  Reset filter
                </Button>
              )}
            </div>

            <CardContent className="pt-4">
              {activeUsage.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No Lead Scanner usage found for this reporting period.</p>
              ) : rows.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    No companies match your search or filter criteria.
                  </p>
                  <div className="flex justify-center gap-2">
                    {query && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery('')
                          setCurrentPage(1)
                        }}
                      >
                        Clear search
                      </Button>
                    )}
                    {statusFilter !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter('all')
                          setCurrentPage(1)
                        }}
                      >
                        Reset filter
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16 text-center">No.</TableHead>
                        <TableHead>
                          <button
                            type="button"
                            onClick={() => handleSort('company')}
                            className="inline-flex items-center gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer"
                          >
                            Company
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('scanned')}
                            className="inline-flex items-center justify-end gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer w-full"
                          >
                            Scanned
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('contacts')}
                            className="inline-flex items-center justify-end gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer w-full"
                          >
                            Contacts
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('exported')}
                            className="inline-flex items-center justify-end gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer w-full"
                          >
                            Exported
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                        <TableHead className="text-right">
                          <button
                            type="button"
                            onClick={() => handleSort('downloads')}
                            className="inline-flex items-center justify-end gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer w-full"
                          >
                            Downloads
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                        <TableHead className="text-center">
                          <button
                            type="button"
                            onClick={() => handleSort('status')}
                            className="inline-flex items-center justify-center gap-1.5 font-medium hover:text-foreground transition-colors cursor-pointer w-full"
                          >
                            Downloaded
                            <ArrowUpDown className="size-3.5 opacity-60" />
                          </button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((item, index) => {
                        const rank = startIndex + index + 1
                        const companyRate = (item.totalScanned ?? 0) > 0
                          ? Math.round(((item.totalContact ?? 0) / (item.totalScanned ?? 1)) * 100)
                          : null

                        return (
                          <TableRow key={item.companyName}>
                            <TableCell className="text-center font-mono text-xs">
                              {sortField === 'scanned' && sortOrder === 'desc' && rank === 1 ? (
                                <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs">
                                  1
                                </span>
                              ) : sortField === 'scanned' && sortOrder === 'desc' && rank === 2 ? (
                                <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-slate-400/15 text-slate-500 font-bold text-xs">
                                  2
                                </span>
                              ) : sortField === 'scanned' && sortOrder === 'desc' && rank === 3 ? (
                                <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-amber-700/15 text-amber-700 font-bold text-xs">
                                  3
                                </span>
                              ) : (
                                <span className="text-muted-foreground">{rank}</span>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="group flex items-center gap-1.5">
                                <span>{item.companyName}</span>
                                <button
                                  type="button"
                                  onClick={() => void handleCopyCompany(item.companyName)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-foreground rounded cursor-pointer shrink-0"
                                  title="Copy company name"
                                  aria-label={`Copy ${item.companyName}`}
                                >
                                  {copiedCompany === item.companyName ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{(item.totalScanned ?? 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col items-end justify-center">
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                  {(item.totalContact ?? 0).toLocaleString()}
                                </span>
                                {companyRate !== null && (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {companyRate}%
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium text-violet-600 dark:text-violet-400">
                              {(item.totalExportedContact ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {(item.totalDownloadCount ?? 0).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-center">
                              {item.isDownloaded ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-medium normal-case tracking-normal">
                                  Downloaded
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground border-transparent font-normal normal-case tracking-normal">
                                  Not downloaded
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>

                  {rows.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50 text-sm text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-2">
                        <span data-testid="pagination-showing">
                          Showing <span className="font-semibold text-foreground">{startIndex + 1}</span> to{' '}
                          <span className="font-semibold text-foreground">{endIndex}</span> of{' '}
                          <span className="font-semibold text-foreground">{rows.length}</span> companies
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                          <span className="text-xs">Per page:</span>
                          <select
                            aria-label="Items per page"
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value))
                              setCurrentPage(1)
                            }}
                            className="h-8 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none cursor-pointer focus:ring-1 focus:ring-ring"
                          >
                            <option value={10} className="bg-background text-foreground">10</option>
                            <option value={25} className="bg-background text-foreground">25</option>
                            <option value={50} className="bg-background text-foreground">50</option>
                            <option value={100} className="bg-background text-foreground">100</option>
                          </select>
                        </div>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => setCurrentPage(1)}
                            disabled={validPage === 1}
                            title="First page"
                          >
                            <ChevronsLeft className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={validPage === 1}
                            title="Previous page"
                          >
                            <ChevronLeft className="size-4" />
                          </Button>
                          <div className="flex items-center gap-1 px-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum = validPage
                              if (validPage <= 3) pageNum = i + 1
                              else if (validPage >= totalPages - 2) pageNum = totalPages - 4 + i
                              else pageNum = validPage - 2 + i

                              if (pageNum > 0 && pageNum <= totalPages) {
                                return (
                                  <Button
                                    key={pageNum}
                                    variant={validPage === pageNum ? 'default' : 'outline'}
                                    size="icon"
                                    className="size-8 text-xs font-semibold"
                                    onClick={() => setCurrentPage(pageNum)}
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
                            className="size-8"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={validPage === totalPages}
                            title="Next page"
                          >
                            <ChevronRight className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={validPage === totalPages}
                            title="Last page"
                          >
                            <ChevronsRight className="size-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
