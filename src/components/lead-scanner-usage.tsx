'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Download, Loader2, RefreshCw, ScanLine, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { exportLeadScannerUsage, getLeadScannerUsage, type LeadScannerUsage as LeadScannerUsageData } from '@/app/actions/lead-scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LeadScannerPeakHours } from '@/components/lead-scanner-peak-hours'

type Props = { projectId?: string }

function formatReportDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? date : format(parsed, 'MMM d, yyyy')
}

export function LeadScannerUsage({ projectId }: Props) {
  const [report, setReport] = useState<LeadScannerUsageData | null>(null)
  const [query, setQuery] = useState('')
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

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase()
    return (report?.overall ?? [])
      .filter((item) => item.companyName.toLowerCase().includes(search))
      .sort((a, b) => b.totalScanned - a.totalScanned)
  }, [query, report])

  const totals = useMemo(() => (report?.overall ?? []).reduce(
    (result, item) => ({ scanned: result.scanned + item.totalScanned, contacts: result.contacts + item.totalContact }),
    { scanned: 0, contacts: 0 },
  ), [report])

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
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>

          <LeadScannerPeakHours
            data={report?.hourlyTraffic}
            totalScanned={totals.scanned}
            peakTime={report?.peakTime}
          />

          <Card>
            <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><CardTitle>Company usage</CardTitle><CardDescription>{report?.overall.length.toLocaleString()} companies in this report</CardDescription></div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search companies..." className="pl-9" />
              </div>
            </CardHeader>
            <CardContent>
              {report?.overall.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No Lead Scanner usage found for this reporting period.</p> : rows.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No companies match your search.</p> : (
                <Table>
                  <TableHeader><TableRow><TableHead>Company</TableHead><TableHead className="text-right">Scanned</TableHead><TableHead className="text-right">Contacts</TableHead></TableRow></TableHeader>
                  <TableBody>{rows.map((item) => <TableRow key={item.companyName}><TableCell className="font-medium">{item.companyName}</TableCell><TableCell className="text-right">{item.totalScanned.toLocaleString()}</TableCell><TableCell className="text-right">{item.totalContact.toLocaleString()}</TableCell></TableRow>)}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
