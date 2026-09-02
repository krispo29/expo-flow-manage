'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronRight,
  Clock,
  Download,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  UserCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  exportBusinessMatchingCsv,
  getBusinessMatchingDetails,
  getBusinessMatchingReport,
  type BusinessMatchingReportResult,
  type BusinessMatchingRole,
} from '@/app/actions/business-matching-report'
import {
  AdminReportDetailModal,
  formatReportDate,
  statusBadgeClass,
  type AdminReportDetailKey,
  type ReportDetailState,
} from './admin-report-detail-modal'
import { MeetingStatusDonutChart } from './charts/meeting-status-donut-chart'
import { StampRedemptionBarChart } from './charts/stamp-redemption-bar-chart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  role: BusinessMatchingRole
  result: BusinessMatchingReportResult
  basePath?: string
  projectId?: string
}

type NeedsAttentionItem = {
  request: Record<string, unknown>
  reason: string
  priority: number
}

function buildNeedsAttention(requests: Record<string, unknown>[], now = Date.now()): NeedsAttentionItem[] {
  return requests
    .map((request): NeedsAttentionItem | null => {
      const outcome = String(request.workflow_outcome || '').toLowerCase()
      const status = String(request.status || '')
      if (outcome === 'expired' || outcome === 'closed') {
        return { request, reason: 'Expired or closed', priority: 2 }
      }
      if (status === 'Accepted' && !request.confirmed_start_at) {
        return { request, reason: 'Missing confirmed time', priority: 2 }
      }

      const visitorSatisfaction = request.visitor_survey_satisfaction_level
      const exhibitorSatisfaction = request.exhibitor_survey_satisfaction_level
      const recipientSatisfaction = request.recipient_exhibitor_survey_satisfaction_level
      const ratings = [request.visitor_survey_rating, request.exhibitor_survey_rating, request.recipient_exhibitor_survey_rating].filter(
        (r): r is number => typeof r === 'number',
      )
      const satisfactionLevels = [visitorSatisfaction, exhibitorSatisfaction, recipientSatisfaction]
      if (ratings.some((r) => r <= 2) || satisfactionLevels.includes('needs_improvement')) {
        return { request, reason: 'Needs improvement feedback', priority: 1 }
      }

      const createdAtStr = String(request.created_at || '')
      const createdAt = createdAtStr ? new Date(createdAtStr).getTime() : NaN
      if (status === 'Requested' && !Number.isNaN(createdAt) && now - createdAt >= 24 * 60 * 60 * 1000) {
        return { request, reason: 'Waiting over 24 hours', priority: 1 }
      }
      return null
    })
    .filter((item): item is NeedsAttentionItem => Boolean(item))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 6)
}

function getRequestRecordLabel(request: Record<string, unknown>): string {
  const recipientExhibitorUUID = String(request.recipient_exhibitor_uuid || '')
  if (request.requester_type === 'exhibitor' && recipientExhibitorUUID) {
    const requester = String(request.exhibitor_company_name || request.exhibitor_company || '')
    const recipient = String(request.recipient_exhibitor_name || '')
    return [requester && `Requester: ${requester}`, recipient && `Recipient: ${recipient}`].filter(Boolean).join(' → ') || 'Exhibitor request'
  }

  const regCode = String(request.registration_code || request.visitor_registration_code || '')
  const firstName = String(request.visitor_first_name || '')
  const lastName = String(request.visitor_last_name || '')
  const name = [firstName, lastName].filter(Boolean).join(' ')
  const company = String(request.visitor_company_name || request.visitor_company || '')
  return [regCode, name, company].filter(Boolean).join(' - ') || String(request.match_request_uuid || 'Request record')
}

function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (diffSeconds < 45) return 'Just now'
  if (diffSeconds < 90) return '1 min ago'
  const mins = Math.floor(diffSeconds / 60)
  if (mins < 60) return `${mins} mins ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''} ago`
  return ''
}

export function BusinessMatchingSummary({ role, result: initialResult, basePath, projectId }: Props) {
  const router = useRouter()
  const [result, setResult] = useState(initialResult)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(() => (initialResult.success ? initialResult.summary.generated_at : new Date().toISOString()))
  const [refreshing, setRefreshing] = useState(false)
  const [exportingMeetings, setExportingMeetings] = useState(false)
  const [exportingStamps, setExportingStamps] = useState(false)

  // Detail Modal State
  const [reportDetail, setReportDetail] = useState<ReportDetailState | null>(null)

  // Global search state & ref
  const searchContainerRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchStatus, setSearchStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [searchResults, setSearchResults] = useState<Record<string, unknown>[]>([])
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchRequestRef = useRef(0)

  // Recent requests for needs attention
  const isMountedRef = useRef(true)
  const [recentRequests, setRecentRequests] = useState<Record<string, unknown>[]>([])
  const [attentionOpeningId, setAttentionOpeningId] = useState<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setResult(initialResult)
    if (initialResult.success) {
      setLastUpdatedAt(initialResult.summary.generated_at || new Date().toISOString())
    }
  }, [initialResult])

  const loadRecentRequests = useCallback(async (selectedEventId?: string) => {
    if (!result.success) return
    try {
      const response = await getBusinessMatchingDetails({
        role,
        projectId,
        eventId: selectedEventId || result.eventUuid,
        type: 'match-requests',
        limit: 50,
        offset: 0,
      })
      if (isMountedRef.current && response.success) {
        setRecentRequests(response.items)
      }
    } catch {
      // Non-blocking background fetch
    }
  }, [projectId, result, role])

  useEffect(() => {
    if (result.success) {
      void loadRecentRequests(result.eventUuid)
    }
  }, [loadRecentRequests, result])

  const refresh = async (isManual = false) => {
    setRefreshing(true)
    try {
      const next = await getBusinessMatchingReport({
        role,
        projectId,
        eventId: result.success ? result.eventUuid : undefined,
      })
      if (isMountedRef.current) {
        setResult(next)
        if (next.success) {
          setLastUpdatedAt(next.summary.generated_at || new Date().toISOString())
          void loadRecentRequests(next.eventUuid)
          if (isManual) toast.success('Report data updated')
        }
      }
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false)
      }
    }
  }

  // Auto-refresh every 60s
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(false)
    }, 60_000)
    return () => window.clearInterval(interval)
  }, [projectId, result, role])

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Global request search debounce
  useEffect(() => {
    const query = searchQuery.trim()
    if (!result.success || query.length < 2) {
      setSearchStatus('idle')
      setSearchResults([])
      setIsSearchOpen(false)
      setSelectedSuggestionIndex(-1)
      return
    }

    const requestId = ++searchRequestRef.current
    setSearchStatus('loading')
    setIsSearchOpen(true)
    setSelectedSuggestionIndex(-1)

    const timer = window.setTimeout(async () => {
      try {
        const response = await getBusinessMatchingDetails({
          role,
          projectId,
          eventId: result.eventUuid,
          type: 'match-requests',
          q: query,
          limit: 8,
        })
        if (requestId === searchRequestRef.current && isMountedRef.current) {
          if (response.success) {
            setSearchResults(response.items)
            setSearchStatus('ready')
            setIsSearchOpen(true)
          } else {
            setSearchStatus('error')
          }
        }
      } catch {
        if (requestId === searchRequestRef.current && isMountedRef.current) {
          setSearchStatus('error')
        }
      }
    }, 300)

    return () => window.clearTimeout(timer)
  }, [projectId, result, role, searchQuery])

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Matching</CardTitle>
          <CardDescription>{result.error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const totals = result.summary.totals || {}
  const needsAttention = buildNeedsAttention(recentRequests)
  const relativeTime = formatRelativeTime(lastUpdatedAt)

  const changeEvent = (eventId: string) => {
    if (basePath) {
      router.push(`${basePath}?${new URLSearchParams({ ...(projectId ? { projectId } : {}), eventId })}`)
    }
  }

  const exportMeetings = async () => {
    setExportingMeetings(true)
    try {
      const file = await exportBusinessMatchingCsv({
        role,
        projectId,
        eventId: result.eventUuid,
        type: 'match-requests',
      })
      if (!file.success) return toast.error(file.error)
      const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: 'text/csv' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.filename
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Meetings CSV exported')
    } finally {
      if (isMountedRef.current) setExportingMeetings(false)
    }
  }

  const exportStamps = async () => {
    setExportingStamps(true)
    try {
      const file = await exportBusinessMatchingCsv({
        role,
        projectId,
        eventId: result.eventUuid,
        type: 'redemption-stamps',
      })
      if (!file.success) return toast.error(file.error)
      const url = URL.createObjectURL(new Blob([new Uint8Array(file.bytes)], { type: 'text/csv' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = file.filename
      anchor.click()
      URL.revokeObjectURL(url)
      toast.success('Stamps CSV exported')
    } finally {
      if (isMountedRef.current) setExportingStamps(false)
    }
  }

  const openCardDetail = (key: AdminReportDetailKey, title: string, expectedValue: string) => {
    setReportDetail({
      key,
      title,
      expectedValue,
      status: 'loading',
    })
  }

  const openRequestRecord = (request: Record<string, unknown>) => {
    const regCode = String(request.registration_code || request.visitor_registration_code || request.match_request_uuid?.toString().slice(0, 8) || 'record')
    setReportDetail({
      key: 'requested',
      title: `Request ${regCode}`,
      expectedValue: '1',
      status: 'ready',
      singleRecord: true,
      items: [request],
      total: 1,
    })
    setSearchQuery('')
    setSearchResults([])
    setIsSearchOpen(false)
  }

  const openAttentionReview = async (request: Record<string, unknown>) => {
    const id = String(request.match_request_uuid || '')
    setAttentionOpeningId(id)
    try {
      openRequestRecord(request)
    } finally {
      if (isMountedRef.current) setAttentionOpeningId(null)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) {
      if (e.key === 'Escape') setIsSearchOpen(false)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const targetIndex = selectedSuggestionIndex >= 0 ? selectedSuggestionIndex : 0
      if (searchResults[targetIndex]) {
        openRequestRecord(searchResults[targetIndex])
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }

  const metricCards: {
    key: AdminReportDetailKey
    label: string
    value: number
    hint: string
    icon: React.ComponentType<{ className?: string }>
    isSuccess?: boolean
  }[] = [
    {
      key: 'requested',
      label: 'Requested',
      value: totals.requested ?? 0,
      hint: 'Waiting for exhibitor action',
      icon: Clock,
    },
    {
      key: 'accepted',
      label: 'Accepted',
      value: totals.accepted ?? 0,
      hint: 'Confirmed meeting requests',
      icon: Check,
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: totals.rejected ?? 0,
      hint: 'Declined by exhibitor or buyer',
      icon: X,
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: totals.cancelled ?? 0,
      hint: 'Cancelled before completion',
      icon: Clock,
    },
    {
      key: 'expired-closed',
      label: 'Expired/closed',
      value: (totals.expired ?? 0) + (totals.closed ?? 0),
      hint: 'No longer actionable',
      icon: RefreshCw,
    },
    {
      key: 'success',
      label: 'Success',
      value: totals.success ?? 0,
      hint: 'Both sides marked success',
      icon: Star,
      isSuccess: true,
    },
    {
      key: 'stamps-issued',
      label: 'Stamps issued',
      value: totals.redemption_stamps_issued ?? 0,
      hint: 'Codes ready for redemption',
      icon: Sparkles,
    },
    {
      key: 'stamps-redeemed',
      label: 'Stamps redeemed',
      value: totals.redemption_stamps_redeemed ?? 0,
      hint: 'Codes already redeemed',
      icon: UserCheck,
    },
    {
      key: 'surveys',
      label: 'Surveys',
      value: totals.surveys_submitted ?? 0,
      hint: 'Submitted meeting surveys',
      icon: BarChart3,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header section */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">
            {role === 'ADMIN' ? 'ADMIN REPORT' : 'ORGANIZER REPORT'}
          </p>
          <h2 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-foreground">
            Business matching event report
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            An authenticated event-level report source is required before system-wide metrics can be displayed.
          </p>
          <p className="mt-2 text-xs font-semibold text-muted-foreground">
            Last updated {formatReportDate(lastUpdatedAt)} {relativeTime ? `(${relativeTime})` : ''} · Auto-refreshes every minute
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {result.events && result.events.length > 0 && (
            <Select value={result.eventUuid} onValueChange={changeEvent}>
              <SelectTrigger aria-label="Event" className="w-[180px] font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-slate-900 shadow-xl border border-border/80">
                <SelectItem value="all">All events</SelectItem>
                {result.events.map((event) => (
                  <SelectItem key={event.event_uuid} value={event.event_uuid}>
                    {event.event_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            variant="outline"
            onClick={() => void refresh(true)}
            disabled={refreshing}
            className="font-bold shadow-sm"
          >
            <RefreshCw className={`mr-2 size-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            variant="default"
            onClick={exportMeetings}
            disabled={exportingMeetings}
            className="font-bold shadow-sm"
          >
            {exportingMeetings ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
            Export meetings
          </Button>

          <Button
            variant="default"
            onClick={exportStamps}
            disabled={exportingStamps}
            className="font-bold shadow-sm"
          >
            {exportingStamps ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
            Export stamps
          </Button>
        </div>
      </div>

      {/* Find a request card with keyboard navigation & click outside */}
      <Card className="shadow-sm !overflow-visible relative z-30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-foreground">Find a request</CardTitle>
          <CardDescription className="text-xs">
            Search by request ID, registration code, name, company, email, exhibitor, or booth.
          </CardDescription>
        </CardHeader>
        <CardContent className="!overflow-visible">
          <div ref={searchContainerRef} className="relative">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsSearchOpen(true)
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="e.g. VI170067439 or request UUID"
              className="h-11 pl-10 pr-9 font-semibold text-sm bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchOpen(false)
                }}
                aria-label="Clear request search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}

            {/* Suggestions dropdown with 100% solid opaque background */}
            {isSearchOpen && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border/80 bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
                {searchStatus === 'loading' ? (
                  <div className="flex items-center justify-center p-4 text-xs font-semibold text-muted-foreground gap-2">
                    <RefreshCw className="size-3.5 animate-spin" /> Searching records...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item, idx) => {
                    const statusLabel = String(item.report_status || item.status || 'Requested')
                    const isSelected = selectedSuggestionIndex === idx
                    return (
                      <button
                        key={String(item.match_request_uuid || idx)}
                        type="button"
                        onClick={() => openRequestRecord(item)}
                        onMouseEnter={() => setSelectedSuggestionIndex(idx)}
                        className={`flex w-full items-start justify-between gap-3 border-b border-border/40 p-3 text-left last:border-b-0 transition-colors ${
                          isSelected ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">{getRequestRecordLabel(item)}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {String(item.exhibitor_company_name || 'Exhibitor')} · Booth {String(item.booth_no || '-')}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass(statusLabel)}`}>
                          {statusLabel}
                        </span>
                      </button>
                    )
                  })
                ) : (
                  <p className="p-4 text-center text-sm font-semibold text-muted-foreground">No requests found.</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Needs attention card with color-coded priority */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-500" />
              <CardTitle className="text-base font-bold text-foreground">Needs attention</CardTitle>
            </div>
            <CardDescription className="mt-1 text-xs">
              Requests that may need staff follow-up, ordered by urgency.
            </CardDescription>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
            {needsAttention.length} shown
          </span>
        </CardHeader>
        <CardContent>
          {needsAttention.length > 0 ? (
            <div className="grid gap-2.5">
              {needsAttention.map(({ request, reason, priority }, idx) => {
                const isUrgent = priority === 1
                return (
                  <div
                    key={String(request.match_request_uuid || idx)}
                    className={`flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between transition-colors ${
                      isUrgent
                        ? 'border-rose-300/80 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/20'
                        : 'border-amber-300/80 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/20'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{getRequestRecordLabel(request)}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {reason}
                        </span>
                        {Boolean(request.created_at) && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(String(request.created_at))}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={attentionOpeningId === String(request.match_request_uuid)}
                      onClick={() => void openAttentionReview(request)}
                      className="h-8 shrink-0 font-bold bg-background shadow-xs hover:bg-muted"
                    >
                      {attentionOpeningId === String(request.match_request_uuid) ? (
                        <RefreshCw className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Search className="mr-1 size-3.5" />
                      )}
                      Review
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200/60 bg-emerald-50/70 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
              No requests need attention right now.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event performance overview - 9 status metric cards */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold text-foreground">Event performance overview</CardTitle>
            <CardDescription className="mt-1 text-xs">
              Click any metric card to inspect the people and records behind that number.
            </CardDescription>
          </div>
          <span className="rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-bold text-muted-foreground">
            9 live metrics
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {metricCards.map(({ key, label, value, hint, icon: Icon, isSuccess }) => (
              <button
                key={label}
                type="button"
                onClick={() => openCardDetail(key, label, value.toLocaleString())}
                aria-label={`View ${label} details`}
                className={`group relative flex min-h-[144px] flex-col justify-between overflow-hidden rounded-xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSuccess
                    ? 'border-emerald-300/80 bg-card hover:border-emerald-500/80 dark:border-emerald-800'
                    : 'border-border/70 bg-card hover:border-primary/50'
                }`}
              >
                {/* Top accent bar */}
                <span
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isSuccess ? 'bg-emerald-500' : 'bg-primary'
                  }`}
                />

                {/* Icon */}
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${
                    isSuccess
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                {/* Bottom info & view link */}
                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-4xl font-extrabold tracking-tight text-foreground">
                      {value.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm font-bold text-foreground">{label}</p>
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{hint}</p>
                  </div>
                  <span
                    className={`mb-1 inline-flex shrink-0 items-center gap-0.5 text-xs font-bold ${
                      isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'
                    }`}
                  >
                    View
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution & Performance Charts Row with interactive click shortcuts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Chart 1: Donut Chart for Meeting Status */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Meeting Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <MeetingStatusDonutChart
              summary={result.summary}
              onSelectStatus={(key, label, value) => openCardDetail(key, label, value)}
            />
          </CardContent>
        </Card>

        {/* Chart 2: Bar Chart for Redemption Rates */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-foreground">Stamp Redemption Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <StampRedemptionBarChart
              summary={result.summary}
              onSelectStampType={(key, label, value) => openCardDetail(key, label, value)}
            />
          </CardContent>
        </Card>
      </div>

      {/* Detail Inspection Modal */}
      {reportDetail && (
        <AdminReportDetailModal
          role={role}
          projectId={projectId}
          eventId={result.eventUuid}
          detail={reportDetail}
          onClose={() => setReportDetail(null)}
        />
      )}
    </div>
  )
}
