'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, Download, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  exportBusinessMatchingCsv,
  getBusinessMatchingDetails,
  type BusinessMatchingDetailType,
  type BusinessMatchingRole,
} from '@/app/actions/business-matching-report'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

export type AdminReportDetailKey =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'cancelled'
  | 'expired-closed'
  | 'success'
  | 'stamps-issued'
  | 'stamps-redeemed'
  | 'surveys'

export type ReportDetailState = {
  key: AdminReportDetailKey
  title: string
  expectedValue: string
  status: 'loading' | 'ready' | 'error'
  items?: Record<string, unknown>[]
  total?: number
  message?: string
  singleRecord?: boolean
}

type Props = {
  role: BusinessMatchingRole
  projectId?: string
  eventId: string
  detail: ReportDetailState
  onClose: () => void
}

const REPORT_DETAIL_PAGE_SIZE = 25

export const satisfactionLabels: Record<string, string> = {
  very_helpful: 'Very helpful',
  average: 'Average',
  needs_improvement: 'Needs improvement',
}

export function statusBadgeClass(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'success':
    case 'redeemed':
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
    case 'requested':
    case 'issued':
      return 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
    case 'rejected':
      return 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
    case 'cancelled':
      return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    case 'expired':
    case 'closed':
      return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
    default:
      return 'bg-muted text-muted-foreground border border-border'
  }
}

export function getReportExportTargetAndFilters(key: AdminReportDetailKey): {
  target: BusinessMatchingDetailType
  filters?: {
    status?: string
    outcome?: string
    rating?: number
    ratingMax?: number
    satisfactionLevel?: string
  }
} {
  if (key === 'stamps-issued') {
    return {
      target: 'redemption-stamps',
      filters: { status: 'Issued,Redeemed' },
    }
  }
  if (key === 'stamps-redeemed') {
    return {
      target: 'redemption-stamps',
      filters: { status: 'Redeemed' },
    }
  }
  if (key === 'surveys') {
    return {
      target: 'surveys',
    }
  }
  if (key === 'cancelled') {
    return {
      target: 'match-requests',
      filters: { outcome: 'cancelled' },
    }
  }
  if (key === 'expired-closed') {
    return {
      target: 'match-requests',
      filters: { outcome: 'expired,closed' },
    }
  }
  return {
    target: 'match-requests',
    filters: { status: key[0].toUpperCase() + key.slice(1) },
  }
}

export function formatReportDate(value?: unknown): string {
  if (!value || typeof value !== 'string') return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast.success(`Copied ${label ? label + ' ' : ''}to clipboard: ${text}`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label || 'text'}`}
      className="inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
    >
      {copied ? <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="size-3.5" />}
    </button>
  )
}

export function AdminReportDetailModal({ role, projectId, eventId, detail, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterState, setFilterState] = useState('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Record<string, unknown>[]>(detail.items || [])
  const [total, setTotal] = useState<number>(detail.total ?? 0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(detail.status)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(detail.message)
  const [exporting, setExporting] = useState(false)
  const pageRequestRef = useRef(0)

  const kind: 'requests' | 'stamps' | 'surveys' = useMemo(() => {
    if (detail.key === 'stamps-issued' || detail.key === 'stamps-redeemed') return 'stamps'
    if (detail.key === 'surveys') return 'surveys'
    return 'requests'
  }, [detail.key])

  const loadData = useCallback(async () => {
    if (detail.singleRecord) return

    const requestId = ++pageRequestRef.current
    setStatus('loading')
    setErrorMessage(undefined)

    const { target, filters } = getReportExportTargetAndFilters(detail.key)
    const activeFilters = {
      ...filters,
      status: detail.key === 'stamps-issued' && filterState !== 'all' ? filterState : filters?.status,
      rating:
        detail.key === 'surveys' && filterState !== 'all' && filterState !== 'below-3' && !(filterState in satisfactionLabels)
          ? Number(filterState)
          : undefined,
      ratingMax: detail.key === 'surveys' && filterState === 'below-3' ? 2 : undefined,
      satisfactionLevel:
        detail.key === 'surveys' && filterState === 'below-3'
          ? 'needs_improvement'
          : detail.key === 'surveys' && filterState in satisfactionLabels
          ? filterState
          : undefined,
    }

    try {
      const response = await getBusinessMatchingDetails({
        role,
        projectId,
        eventId,
        type: target,
        q: searchQuery.trim() || undefined,
        status: activeFilters.status,
        outcome: activeFilters.outcome,
        rating: activeFilters.rating,
        ratingMax: activeFilters.ratingMax,
        satisfactionLevel: activeFilters.satisfactionLevel,
        offset: (page - 1) * REPORT_DETAIL_PAGE_SIZE,
        limit: REPORT_DETAIL_PAGE_SIZE,
      })

      if (requestId === pageRequestRef.current) {
        if (response.success) {
          setItems(response.items)
          setTotal(response.total)
          setStatus('ready')
        } else {
          setErrorMessage(response.error)
          setStatus('error')
        }
      }
    } catch (error) {
      if (requestId === pageRequestRef.current) {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load details')
        setStatus('error')
      }
    }
  }, [detail.key, detail.singleRecord, eventId, filterState, page, projectId, role, searchQuery])

  useEffect(() => {
    if (detail.singleRecord) {
      setItems(detail.items || [])
      setTotal(detail.total ?? (detail.items?.length || 0))
      setStatus('ready')
      return
    }

    const timer = window.setTimeout(() => {
      void loadData()
    }, searchQuery ? 300 : 0)

    return () => window.clearTimeout(timer)
  }, [detail.items, detail.singleRecord, detail.total, loadData, searchQuery])

  const handleExportCsv = async () => {
    setExporting(true)
    try {
      const { target, filters } = getReportExportTargetAndFilters(detail.key)
      const activeFilters = {
        ...filters,
        status: detail.key === 'stamps-issued' && filterState !== 'all' ? filterState : filters?.status,
        rating:
          detail.key === 'surveys' && filterState !== 'all' && filterState !== 'below-3' && !(filterState in satisfactionLabels)
            ? Number(filterState)
            : undefined,
        ratingMax: detail.key === 'surveys' && filterState === 'below-3' ? 2 : undefined,
        satisfactionLevel:
          detail.key === 'surveys' && filterState === 'below-3'
            ? 'needs_improvement'
            : detail.key === 'surveys' && filterState in satisfactionLabels
            ? filterState
            : undefined,
      }

      const file = await exportBusinessMatchingCsv({
        role,
        projectId,
        eventId,
        type: target,
        q: searchQuery.trim() || undefined,
        status: activeFilters.status,
        outcome: activeFilters.outcome,
        rating: activeFilters.rating,
        ratingMax: activeFilters.ratingMax,
        satisfactionLevel: activeFilters.satisfactionLevel,
      })

      if (!file.success) {
        toast.error(file.error)
        return
      }

      const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: 'text/csv' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.filename
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success(`${detail.title} CSV exported`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / REPORT_DETAIL_PAGE_SIZE))

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-h-[92vh] max-w-5xl overflow-hidden p-0 flex flex-col sm:max-w-5xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-border/40 bg-muted/40 p-4 sm:p-6 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-4 pr-6">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase">Event report details</p>
              <DialogTitle className="mt-1 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {detail.title}
              </DialogTitle>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-bold text-muted-foreground">
                  Card total: <span className="text-foreground">{detail.expectedValue}</span>
                </span>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  Showing {(page - 1) * REPORT_DETAIL_PAGE_SIZE + (items.length ? 1 : 0)}–
                  {Math.min(page * REPORT_DETAIL_PAGE_SIZE, total)} of {total}
                </span>
              </div>
            </div>

            {!detail.singleRecord && (
              <Button
                variant="outline"
                size="sm"
                disabled={status === 'loading' || exporting}
                onClick={handleExportCsv}
                className="font-bold shadow-sm"
              >
                {exporting ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
                Export CSV
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Filter controls */}
        {!detail.singleRecord && (
          <div className="border-b border-border/30 bg-background px-4 py-3 sm:px-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                aria-label="Search report details"
                placeholder="Search report details..."
                className="pl-9 pr-8 font-semibold text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Sub-filter tabs */}
            {kind === 'surveys' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'All feedback', value: 'all' },
                  { label: 'Very helpful', value: 'very_helpful' },
                  { label: 'Average', value: 'average' },
                  { label: 'Needs improvement', value: 'needs_improvement' },
                  { label: '5 ★', value: '5' },
                  { label: '4 ★', value: '4' },
                  { label: '3 ★', value: '3' },
                  { label: 'Below 3 ★', value: 'below-3' },
                ].map((btn) => (
                  <Button
                    key={btn.value}
                    variant={filterState === btn.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilterState(btn.value)
                      setPage(1)
                    }}
                    className="h-8 text-xs font-bold"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            )}

            {kind === 'stamps' && detail.key === 'stamps-issued' && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'All Stamps', value: 'all' },
                  { label: 'Issued', value: 'Issued' },
                  { label: 'Redeemed', value: 'Redeemed' },
                ].map((btn) => (
                  <Button
                    key={btn.value}
                    variant={filterState === btn.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setFilterState(btn.value)
                      setPage(1)
                    }}
                    className="h-8 text-xs font-bold"
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            )}

            {kind === 'requests' && (
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex h-8 items-center rounded-md border border-primary/20 bg-primary/10 px-3 text-xs font-bold text-primary">
                  Status: {detail.title}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {status === 'loading' ? (
            <div className="flex h-48 items-center justify-center gap-2 text-sm font-semibold text-muted-foreground">
              <RefreshCw className="size-5 animate-spin text-primary" />
              Loading report details...
            </div>
          ) : status === 'error' ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm font-semibold text-destructive">
              {errorMessage || 'Failed to load details'}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center text-sm font-semibold text-muted-foreground gap-3">
              <p>No report records found{searchQuery ? ` matching "${searchQuery}"` : ''}.</p>
              {searchQuery && (
                <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="font-bold">
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3">
              {kind === 'requests' &&
                items.map((item, index) => {
                  const regCode = String(item.registration_code || item.visitor_registration_code || '')
                  const firstName = String(item.visitor_first_name || '')
                  const lastName = String(item.visitor_last_name || '')
                  const company = String(item.visitor_company_name || item.visitor_company || '')
                  const exhibitorName = String(item.exhibitor_company_name || item.exhibitor_company || '')
                  const booth = String(item.booth_no || '-')
                  const statusLabel = String(item.report_status || item.status || 'Requested')
                  const requestedStart = formatReportDate(item.requested_start_at)
                  const confirmedStart = formatReportDate(item.confirmed_start_at)
                  const stampCode = String(item.redemption_stamp_code || '')

                  return (
                    <div
                      key={String(item.match_request_uuid || index)}
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-display font-bold text-foreground">
                              {[regCode, [firstName, lastName].filter(Boolean).join(' '), company]
                                .filter(Boolean)
                                .join(' - ') || 'Visitor details unavailable'}
                            </span>
                            {regCode && <CopyButton text={regCode} label="registration code" />}
                          </div>
                          <p className="mt-1 text-xs font-semibold text-muted-foreground">
                            {exhibitorName} · Booth {booth}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-md px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass(statusLabel)}`}>
                          {statusLabel}
                        </span>
                      </div>

                      <div className="mt-3 grid gap-2 border-t border-border/40 pt-3 text-xs sm:grid-cols-2 lg:grid-cols-4 text-muted-foreground">
                        <div>
                          <span className="font-bold text-foreground">Requested: </span>
                          <span>{requestedStart}</span>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Confirmed: </span>
                          <span>{confirmedStart}</span>
                        </div>
                        <div>
                          <span className="font-bold text-foreground">Location: </span>
                          <span>{String(item.meeting_location || 'Exhibitor Booth')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-foreground">Stamp: </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {stampCode || '-'}
                          </span>
                          {stampCode && <CopyButton text={stampCode} label="stamp code" />}
                        </div>
                      </div>

                      {Boolean(item.message || item.visitor_message || item.exhibitor_note) && (
                        <div className="mt-3 rounded-lg bg-muted/40 p-2.5 text-xs text-muted-foreground">
                          {item.visitor_message || item.message ? (
                            <p>
                              <span className="font-bold text-foreground">Message: </span>
                              {String(item.visitor_message || item.message)}
                            </p>
                          ) : null}
                          {item.exhibitor_note ? (
                            <p className="mt-1">
                              <span className="font-bold text-foreground">Exhibitor note: </span>
                              {String(item.exhibitor_note)}
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })}

              {kind === 'stamps' &&
                items.map((item, index) => {
                  const stampCode = String(item.stamp_code || item.redemption_stamp_code || '')
                  const statusLabel = String(item.status || item.redemption_stamp_status || 'Issued')
                  const regCode = String(item.registration_code || item.visitor_registration_code || '')
                  const visitorName = String(item.visitor_name || [item.visitor_first_name, item.visitor_last_name].filter(Boolean).join(' ') || '')
                  const company = String(item.visitor_company_name || item.visitor_company || '')
                  const exhibitor = String(item.exhibitor_company_name || item.exhibitor_company || '')
                  const booth = String(item.booth_no || '-')

                  return (
                    <div
                      key={String(item.redemption_stamp_uuid || stampCode || index)}
                      className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-foreground">{stampCode}</span>
                          {stampCode && <CopyButton text={stampCode} label="stamp code" />}
                          <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${statusBadgeClass(statusLabel)}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                          {[regCode, visitorName, company].filter(Boolean).join(' - ')}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Exhibitor: {exhibitor} (Booth {booth})
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground shrink-0">
                        <p>Issued: {formatReportDate(item.issued_at || item.created_at)}</p>
                        {item.redeemed_at ? <p className="text-emerald-600 font-semibold">Redeemed: {formatReportDate(item.redeemed_at)}</p> : null}
                      </div>
                    </div>
                  )
                })}

              {kind === 'surveys' &&
                items.map((item, index) => {
                  const satisfaction = String(item.satisfaction_level || '')
                  const rating = item.rating
                  const label = satisfaction in satisfactionLabels ? satisfactionLabels[satisfaction] : rating ? `Legacy rating: ${rating}/5` : 'Submitted'
                  const respondentType = String(item.respondent_type || 'visitor')
                  const name = String(item.respondent_name || item.visitor_name || [item.visitor_first_name, item.visitor_last_name].filter(Boolean).join(' ') || item.exhibitor_company_name || 'Anonymous')
                  const company = String(item.visitor_company_name || item.exhibitor_company_name || '')

                  return (
                    <div
                      key={String(item.survey_uuid || index)}
                      className="rounded-xl border border-border/60 bg-card p-4 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-display font-bold text-foreground">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted by {respondentType} · {company} · {formatReportDate(item.created_at)}
                          </p>
                        </div>
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${
                          satisfaction === 'very_helpful' || rating === 5
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-muted text-foreground border border-border'
                        }`}>
                          {label}
                        </span>
                      </div>

                      {item.comments ? (
                        <div className="rounded-lg bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-bold text-foreground">Feedback comments: </span>
                          <span>{String(item.comments)}</span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
            </div>
          )}
        </div>

        {/* Footer pagination */}
        {!detail.singleRecord && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 bg-muted/30 px-4 py-3 sm:px-6">
            <span className="text-xs font-bold text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1 || status === 'loading'}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="h-8 text-xs font-bold"
              >
                <ChevronLeft className="mr-1 size-3.5" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages || status === 'loading'}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="h-8 text-xs font-bold"
              >
                Next <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
