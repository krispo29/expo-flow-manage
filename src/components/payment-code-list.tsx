'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, Copy, Download, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { exportPaymentCodes, getPaymentCodes, type PaymentCodeListResponse, type PaymentCodeStatus } from '@/app/actions/payment-code'
import { copyTextToClipboard } from '@/lib/clipboard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const PAGE_SIZE = 25
const emptyData: PaymentCodeListResponse = {
  summary: { total: 0, unused: 0, used: 0 },
  items: [],
  page: 1,
  page_size: PAGE_SIZE,
  total: 0,
}

function readStatus(value: string | null): PaymentCodeStatus {
  return value === 'used' || value === 'unused' ? value : 'all'
}

function readPage(value: string | null) {
  const page = Number(value)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function PaymentCodeList({ projectId }: { projectId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const status = readStatus(searchParams.get('status'))
  const search = searchParams.get('search') || ''
  const page = readPage(searchParams.get('page'))
  const [searchValue, setSearchValue] = useState(search)
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const updateParams = (changes: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(changes).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.set('projectId', projectId)
    router.replace(`/admin/payment-codes?${params.toString()}`)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchValue !== search) updateParams({ search: searchValue, page: undefined })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchValue, search]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void getPaymentCodes(projectId, { status, search, page, pageSize: PAGE_SIZE }).then(result => {
      if (cancelled) return
      if (result.success) setData(result.data || emptyData)
      else {
        setData(emptyData)
        toast.error(result.error || 'Failed to load payment codes')
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [projectId, status, search, page])

  const copyCode = async (code: string) => {
    try {
      await copyTextToClipboard(code)
      setCopiedCode(code)
      toast.success('Payment code copied')
      window.setTimeout(() => setCopiedCode(null), 2000)
    } catch {
      toast.error('Failed to copy payment code')
    }
  }

  const exportCodes = async () => {
    setExporting(true)
    const result = await exportPaymentCodes(projectId, { status, search })
    setExporting(false)
    if (!result.success || !result.data) {
      toast.error(result.error || 'Failed to export payment codes')
      return
    }
    const url = URL.createObjectURL(new Blob([result.data], { type: result.contentType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'payment-codes.xlsx'
    link.click()
    URL.revokeObjectURL(url)
  }

  const totalPages = Math.max(1, Math.ceil(data.total / data.page_size))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Total', data.summary.total],
          ['Used', data.summary.used],
          ['Available', data.summary.unused],
        ].map(([label, value]) => (
          <Card key={String(label)} className="glass border-white/10">
            <CardContent className="p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-display font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/10">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchValue} onChange={event => setSearchValue(event.target.value)} placeholder="Search code, name, or email" className="pl-9" />
              </div>
              <Select value={status} onValueChange={value => updateParams({ status: value === 'all' ? undefined : value, page: undefined })}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="unused">Available</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={() => void exportCodes()} disabled={exporting}>
              {exporting ? <Loader2 className="animate-spin" /> : <Download />}
              Export
            </Button>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Payment Code</TableHead><TableHead>Status</TableHead><TableHead>Used At</TableHead><TableHead>Registration</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-16 text-center"><Loader2 className="mx-auto animate-spin" /></TableCell></TableRow>
              ) : data.items.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-16 text-center text-muted-foreground">No payment codes found.</TableCell></TableRow>
              ) : data.items.map(item => (
                <TableRow key={item.payment_code_uuid}>
                  <TableCell><div className="flex items-center gap-2"><code className="font-bold">{item.code}</code><Button size="icon" variant="ghost" className="size-7" onClick={() => void copyCode(item.code)} aria-label={`Copy ${item.code}`}>{copiedCode === item.code ? <Check className="text-emerald-500" /> : <Copy />}</Button></div></TableCell>
                  <TableCell><Badge variant={item.status === 'used' ? 'secondary' : 'default'}>{item.status === 'used' ? 'Used' : 'Available'}</Badge></TableCell>
                  <TableCell>{item.used_at ? format(new Date(item.used_at), 'dd MMM yyyy, HH:mm') : '—'}</TableCell>
                  <TableCell>{item.registration ? <Link className="font-medium text-primary hover:underline" href={`/admin/participants?projectId=${encodeURIComponent(projectId)}&registration_code=${encodeURIComponent(item.registration.registration_code)}`}>{item.registration.first_name} {item.registration.last_name}<span className="block text-xs text-muted-foreground">{item.registration.registration_code} · {item.registration.email}</span></Link> : item.status === 'used' ? 'Registration unavailable' : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t border-white/10 p-4 text-sm">
            <span className="text-muted-foreground">Page {data.page} of {totalPages}</span>
            <div className="flex gap-2"><Button size="icon" variant="outline" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })}><ChevronLeft /></Button><Button size="icon" variant="outline" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })}><ChevronRight /></Button></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
