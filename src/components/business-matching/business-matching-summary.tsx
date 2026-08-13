'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BarChart3, CircleCheck, Download, RefreshCw, Search, Ticket, Users } from 'lucide-react'
import { exportBusinessMatchingCsv, getBusinessMatchingDetails, getBusinessMatchingReport, type BusinessMatchingDetailType, type BusinessMatchingReportResult, type BusinessMatchingRole } from '@/app/actions/business-matching-report'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from 'sonner'

type Props = { role: BusinessMatchingRole; result: BusinessMatchingReportResult; basePath?: string; projectId?: string }
const labels: Record<BusinessMatchingDetailType, string> = { 'match-requests': 'Match requests', 'redemption-stamps': 'Codes', surveys: 'Surveys' }

export function BusinessMatchingSummary({ role, result: initialResult, basePath, projectId }: Props) {
  const router = useRouter()
  const [result, setResult] = useState(initialResult)
  const [type, setType] = useState<BusinessMatchingDetailType>('match-requests')
  const [query, setQuery] = useState('')
  const [offset, setOffset] = useState(0)
  const [details, setDetails] = useState<{ items: Record<string, unknown>[]; total: number }>({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => { setResult(initialResult); setOffset(0) }, [initialResult])

  const refresh = async () => {
    const next = await getBusinessMatchingReport({ role, projectId, eventId: result.success ? result.eventUuid : undefined })
    setResult(next)
  }

  useEffect(() => {
    if (!result.success) return
    setLoading(true)
    void getBusinessMatchingDetails({ role, projectId, eventId: result.eventUuid, type, q: query || undefined, offset, limit: 25 }).then((next) => {
      if (next.success) setDetails(next)
      else toast.error(next.error)
      setLoading(false)
    })
  }, [offset, projectId, query, result, role, type])

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 60_000)
    return () => window.clearInterval(interval)
  }, [projectId, result, role])

  if (!result.success) return <Card><CardHeader><CardTitle>Business Matching</CardTitle><CardDescription>{result.error}</CardDescription></CardHeader></Card>

  const totals = result.summary.totals
  const metrics = [{ label: 'Requests', value: totals.requested ?? 0, icon: Users }, { label: 'Successful meetings', value: totals.success ?? 0, icon: CircleCheck }, { label: 'Codes issued', value: totals.redemption_stamps_issued ?? 0, icon: Ticket }, { label: 'Codes redeemed', value: totals.redemption_stamps_redeemed ?? 0, icon: BarChart3 }]
  const changeEvent = (eventId: string) => router.push(`${basePath}?${new URLSearchParams({ ...(projectId ? { projectId } : {}), eventId })}`)
  const exportCsv = async () => {
    const file = await exportBusinessMatchingCsv({ role, projectId, eventId: result.eventUuid, type, q: query || undefined })
    if (!file.success) return toast.error(file.error)
    const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: 'text/csv' }))
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.filename; anchor.click(); URL.revokeObjectURL(url)
  }

  return <div className="flex flex-col gap-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-3xl font-extrabold tracking-tight">Business Matching</h2><p className="text-sm text-muted-foreground">{role === 'ADMIN' ? 'Project-wide' : 'Your project'} matching activity.</p></div><div className="flex gap-2"><Select value={result.eventUuid} onValueChange={changeEvent}><SelectTrigger aria-label="Event"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All events</SelectItem>{result.events.map((event) => <SelectItem key={event.event_uuid} value={event.event_uuid}>{event.event_name}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon" aria-label="Refresh report" onClick={refresh}><RefreshCw className="size-4" /></Button></div></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</CardTitle><Icon className="size-4 text-primary" /></CardHeader><CardContent><div className="text-3xl font-extrabold">{value.toLocaleString()}</div></CardContent></Card>)}</div><Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><CardTitle>{labels[type]}</CardTitle><div className="flex gap-2"><Input aria-label="Search report details" value={query} onChange={(event) => { setOffset(0); setQuery(event.target.value) }} placeholder="Search" /><Button variant="outline" onClick={exportCsv}><Download className="mr-2 size-4" />Export CSV</Button></div></div><div className="flex gap-2 pt-3">{(Object.keys(labels) as BusinessMatchingDetailType[]).map((key) => <Button key={key} variant={type === key ? 'default' : 'outline'} onClick={() => { setOffset(0); setType(key) }}>{labels[key]}</Button>)}</div></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Record</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead></TableRow></TableHeader><TableBody>{details.items.map((item, index) => <TableRow key={String(item.match_request_uuid ?? item.redemption_stamp_uuid ?? item.survey_uuid ?? index)}><TableCell>{String(item.visitor_company_name ?? item.stamp_code ?? item.registration_code ?? '-')}</TableCell><TableCell>{String(item.report_status ?? item.status ?? item.satisfaction_level ?? '-')}</TableCell><TableCell>{String(item.created_at ?? item.issued_at ?? '-')}</TableCell></TableRow>)}{!loading && details.items.length === 0 && <TableRow><TableCell colSpan={3}>No report records found.</TableCell></TableRow>}</TableBody></Table><div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">{details.total} records</span><div className="flex gap-2"><Button variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 25))}>Previous</Button><Button variant="outline" disabled={offset + 25 >= details.total} onClick={() => setOffset(offset + 25)}>Next</Button></div></div></CardContent></Card></div>
}
