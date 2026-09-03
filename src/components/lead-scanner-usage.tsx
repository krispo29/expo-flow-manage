'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ArrowUpDown, Download, Loader2, Percent, RefreshCw, ScanLine, Search, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { exportLeadScannerUsage, getLeadScannerUsage, type LeadScannerUsage as LeadScannerUsageData } from '@/app/actions/lead-scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeadScannerPeakHours } from '@/components/lead-scanner-peak-hours'

type Props = { projectId?: string }
type SortField = 'company' | 'scanned' | 'contacts'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

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
        comparison = a.totalScanned - b.totalScanned
      } else if (sortField === 'contacts') {
        comparison = a.totalContact - b.totalContact
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [query, activeUsage, sortField, sortOrder])

  const totals = useMemo(() => activeUsage.reduce(
    (result, item) => ({ scanned: result.scanned + item.totalScanned, contacts: result.contacts + item.totalContact }),
    { scanned: 0, contacts: 0 },
  ), [activeUsage])

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
          <Button onClick={() => void handleExport()} disabled={exporting}>
            {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Export Excel
          </Button>
        </div>
      </div>

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
            <Tabs value={selectedDay} onValueChange={setSelectedDay} className="w-full">
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

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-primary/10 p-3 text-primary"><ScanLine className="size-5" /></div>
                <div><p className="text-sm text-muted-foreground">Total scanned</p><p className="text-3xl font-bold">{totals.scanned.toLocaleString()}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><Users className="size-5" /></div>
                <div><p className="text-sm text-muted-foreground">Total contacts</p><p className="text-3xl font-bold">{totals.contacts.toLocaleString()}</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400"><Percent className="size-5" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Contact rate</p>
                  <p className="text-3xl font-bold">{contactRate}%</p>
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
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search companies..."
                  className="pl-9 pr-8"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
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
                  <Button variant="ghost" size="sm" onClick={() => setQuery('')}>Clear search</Button>
                </div>
              ) : (
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((item, index) => (
                      <TableRow key={item.companyName}>
                        <TableCell className="text-center font-mono text-xs">
                          {sortField === 'scanned' && sortOrder === 'desc' && index === 0 ? (
                            <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs">
                              1
                            </span>
                          ) : sortField === 'scanned' && sortOrder === 'desc' && index === 1 ? (
                            <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-slate-400/15 text-slate-500 font-bold text-xs">
                              2
                            </span>
                          ) : sortField === 'scanned' && sortOrder === 'desc' && index === 2 ? (
                            <span className="inline-flex items-center justify-center size-5.5 rounded-full bg-amber-700/15 text-amber-700 font-bold text-xs">
                              3
                            </span>
                          ) : (
                            <span className="text-muted-foreground">{index + 1}</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{item.companyName}</TableCell>
                        <TableCell className="text-right font-medium">{item.totalScanned.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {item.totalContact.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
