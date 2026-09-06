'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileDown,
  Loader2,
  Percent,
  PowerOff,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Users,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadScannerPeakHours } from '@/components/lead-scanner-peak-hours'

type Props = { projectId?: string }
type SortField = 'company' | 'scanned' | 'contacts' | 'exported' | 'downloads' | 'status'
type SortOrder = 'asc' | 'desc'

function formatReportDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'MMM d, yyyy')
}

export function LeadScannerUsage({ projectId }: Props) {
  const [report, setReport] = useState<LeadScannerUsageData | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('total')
  const [query, setQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('scanned')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [disabling, setDisabling] = useState(false)

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

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    const filtered = activeUsage.filter((item) =>
      item.companyName.toLowerCase().includes(search),
    )

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
  }, [query, activeUsage, sortField, sortOrder])

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

  const contactRate = totals.scanned > 0
    ? ((totals.contacts / totals.scanned) * 100).toFixed(1)
    : '0'

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
            <DialogDescription>
              Are you sure you want to disable Lead Scanner for all exhibitors in this project? This will immediately revoke scanner access for all exhibitors and staff members.
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
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> Loading Lead Scanner usage...
        </div>
      ) : (
        <>
          {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}

          {days.length > 0 && (
            <Tabs
              value={selectedDay}
              onValueChange={(val) => {
                setSelectedDay(val)
                setCurrentPage(1)
              }}
              className="w-full"
            >
              <TabsList className="h-auto p-1 flex flex-wrap w-full sm:w-auto justify-start gap-1">
                <TabsTrigger value="total" className="px-4 py-1.5 text-xs sm:text-sm">
                  Total
                </TabsTrigger>
                {days.map((day) => (
                  <TabsTrigger key={day.dayLabel} value={day.dayLabel} className="px-4 py-1.5 text-xs sm:text-sm">
                    {day.dayLabel}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <QrCode className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Scanner enabled</p>
                  <p className="text-2xl font-bold xl:text-3xl">{totals.enabledCount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-600 dark:text-blue-400">
                  <ScanLine className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total scanned</p>
                  <p className="text-2xl font-bold xl:text-3xl">{totals.scanned.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400">
                  <Users className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total contacts</p>
                  <p className="text-2xl font-bold xl:text-3xl">{totals.contacts.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-violet-500/10 p-3 text-violet-600 dark:text-violet-400">
                  <FileDown className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Exported contacts</p>
                  <p className="text-2xl font-bold xl:text-3xl">{totals.exportedContacts.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                  <Download className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Download count</p>
                  <p className="text-2xl font-bold xl:text-3xl">{totals.downloadCount.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
                  <Percent className="size-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact rate</p>
                  <p className="text-2xl font-bold xl:text-3xl">{contactRate}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <LeadScannerPeakHours
            data={report?.hourlyTraffic}
            totalScanned={totals.scanned}
            peakTime={report?.peakTime}
          />

          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Company usage</CardTitle>
                <CardDescription>
                  {selectedDay !== 'total' ? `${selectedDay} · ` : ''}
                  {query
                    ? `Showing ${rows.length} of ${activeUsage.length} companies`
                    : `${activeUsage.length.toLocaleString()} companies in this report`}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search companies..."
                  className="pl-9 pr-8"
                />
                {query && (
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
                )}
              </div>
            </CardHeader>
            <CardContent>
              {activeUsage.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No Lead Scanner usage found for this reporting period.</p>
              ) : rows.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm text-muted-foreground">No companies match &quot;{query}&quot;</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery('')
                      setCurrentPage(1)
                    }}
                  >
                    Clear search
                  </Button>
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
                            <TableCell className="font-medium">{item.companyName}</TableCell>
                            <TableCell className="text-right font-medium">{(item.totalScanned ?? 0).toLocaleString()}</TableCell>
                            <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                              {(item.totalContact ?? 0).toLocaleString()}
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
