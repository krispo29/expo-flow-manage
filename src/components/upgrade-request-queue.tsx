'use client'

import { useMemo, useState, useTransition } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { AttendeeType } from '@/app/actions/participant'
import {
  getUpgradeRequests,
  reviewUpgradeRequest,
  type UpgradeRequest,
  type UpgradeRequestStatus,
} from '@/app/actions/upgrade-request'
import {
  buildReviewUpgradePayload,
  filterUpgradeRequests,
  getAttendeeTypeName,
  getDefaultTargetTypeCode,
  normalizeUpgradeStatus,
  type UpgradeRequestFilter,
} from '@/lib/upgrade-requests'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface UpgradeRequestQueueProps {
  projectId: string
  initialRequests: UpgradeRequest[]
  attendeeTypes: AttendeeType[]
  initialError?: string
}

const STATUS_META: Record<
  UpgradeRequestStatus,
  { label: string; icon: typeof Clock3; className: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock3,
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle2,
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    className: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  },
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = normalizeUpgradeStatus(status)
  const meta = STATUS_META[normalizedStatus]
  const Icon = meta.icon

  return (
    <Badge
      variant="outline"
      className={cn(
        'h-7 gap-1.5 rounded-full px-2.5 text-[10px] font-black uppercase tracking-wider',
        meta.className
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
    </Badge>
  )
}

function TypePill({
  code,
  attendeeTypes,
  highlighted = false,
}: {
  code: string
  attendeeTypes: AttendeeType[]
  highlighted?: boolean
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-2xl border px-3 py-2',
        highlighted
          ? 'border-primary/20 bg-primary/10 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.08)]'
          : 'border-white/10 bg-white/5 text-foreground/80'
      )}
    >
      <p className="truncate text-sm font-black">
        {getAttendeeTypeName(code, attendeeTypes)}
      </p>
      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] opacity-60">
        {code || 'N/A'}
      </p>
    </div>
  )
}

function formatTimestamp(value?: string) {
  if (!value) return 'Not available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return format(date, 'PPP p')
}

function RequestCard({
  request,
  attendeeTypes,
  actionLoading,
  onApprove,
  onReject,
}: {
  request: UpgradeRequest
  attendeeTypes: AttendeeType[]
  actionLoading: boolean
  onApprove: (request: UpgradeRequest) => void
  onReject: (request: UpgradeRequest) => void
}) {
  const status = normalizeUpgradeStatus(request.status)
  const targetTypeCode =
    status === 'approved'
      ? request.approved_type_code || request.suggested_type_code
      : request.suggested_type_code
  const createdAt = new Date(request.created_at)
  const relativeCreatedAt = Number.isNaN(createdAt.getTime())
    ? 'Recently'
    : formatDistanceToNow(createdAt, { addSuffix: true })

  return (
    <article className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] shadow-lg shadow-black/5 backdrop-blur-xl transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5">
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <UserRound className="size-5" />
              </div>
              <div className="min-w-0">
                <h2 className="break-words text-base font-black leading-tight tracking-tight sm:text-lg">
                  {[request.first_name, request.last_name].filter(Boolean).join(' ') ||
                    'Unknown attendee'}
                </h2>
                <p className="truncate font-mono text-[11px] font-bold text-primary/70">
                  {request.registration_code || request.registration_uuid}
                </p>
              </div>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
          <div className="flex min-w-0 items-center gap-2">
            <Building2 className="size-3.5 shrink-0 text-primary/50" />
            <span className="truncate">{request.company_name || 'No company provided'}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Mail className="size-3.5 shrink-0 text-primary/50" />
            <span className="truncate">{request.email || 'No email provided'}</span>
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Clock3 className="size-3.5 shrink-0 text-primary/50" />
            <span title={formatTimestamp(request.created_at)}>
              Requested {relativeCreatedAt}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <TypePill code={request.from_type_code} attendeeTypes={attendeeTypes} />
          <div className="grid size-8 place-items-center justify-self-center rounded-full bg-primary/10 text-primary">
            <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
          </div>
          <TypePill
            code={targetTypeCode}
            attendeeTypes={attendeeTypes}
            highlighted
          />
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/[0.025] p-4 dark:bg-white/[0.035]">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Questionnaire trigger
          </div>
          <p className="text-sm font-semibold leading-6 text-foreground/80">
            {request.question_text || 'Question not available'}
          </p>
          <div className="mt-3 rounded-xl border border-primary/10 bg-primary/5 px-3 py-2.5">
            <p className="text-sm font-black text-primary">
              {request.option_label || request.trigger_option_value || 'Answer not available'}
            </p>
          </div>
        </div>

        {status !== 'pending' ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-bold text-foreground/70">
              <ShieldCheck className="size-4 text-primary" />
              Reviewed {request.reviewed_at ? formatTimestamp(request.reviewed_at) : ''}
            </div>
            {request.note ? <p className="mt-2 leading-5">{request.note}</p> : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              className="h-11 rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/15 hover:bg-emerald-700"
              disabled={actionLoading}
              onClick={() => onApprove(request)}
            >
              <BadgeCheck className="size-4" />
              Approve
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl border-red-500/20 bg-red-500/5 font-bold text-red-600 hover:bg-red-500/10 hover:text-red-700 dark:text-red-400"
              disabled={actionLoading}
              onClick={() => onReject(request)}
            >
              <XCircle className="size-4" />
              Reject
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}

export function UpgradeRequestQueue({
  projectId,
  initialRequests,
  attendeeTypes,
  initialError,
}: UpgradeRequestQueueProps) {
  const [requests, setRequests] = useState(initialRequests)
  const [statusFilter, setStatusFilter] = useState<UpgradeRequestFilter>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<UpgradeRequest | null>(null)
  const [dialogMode, setDialogMode] = useState<'approve' | 'reject' | null>(null)
  const [targetTypeCode, setTargetTypeCode] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [actionRequestUuid, setActionRequestUuid] = useState<string | null>(null)
  const [isRefreshing, startRefreshTransition] = useTransition()
  const [isReviewing, startReviewTransition] = useTransition()

  const attendeeTypeOptions = useMemo(
    () =>
      attendeeTypes
        .filter((type) => type.type_code)
        .slice()
        .sort(
          (a, b) =>
            (a.order_index ?? Number.MAX_SAFE_INTEGER) -
            (b.order_index ?? Number.MAX_SAFE_INTEGER)
        ),
    [attendeeTypes]
  )

  const counts = useMemo(() => {
    const result = { pending: 0, approved: 0, rejected: 0 }
    requests.forEach((request) => {
      result[normalizeUpgradeStatus(request.status)] += 1
    })
    return result
  }, [requests])

  const approvalRate = useMemo(() => {
    const reviewed = counts.approved + counts.rejected
    return reviewed === 0 ? 0 : Math.round((counts.approved / reviewed) * 100)
  }, [counts])

  const filteredRequests = useMemo(
    () => filterUpgradeRequests(requests, statusFilter, searchQuery),
    [requests, searchQuery, statusFilter]
  )

  const refreshRequests = (showSuccess = false) => {
    startRefreshTransition(async () => {
      const result = await getUpgradeRequests(projectId)
      if (result.success) {
        setRequests(result.data)
        if (showSuccess) toast.success('Upgrade requests refreshed')
      } else {
        toast.error(result.error)
      }
    })
  }

  const openReviewDialog = (
    request: UpgradeRequest,
    mode: 'approve' | 'reject'
  ) => {
    setSelectedRequest(request)
    setDialogMode(mode)
    setTargetTypeCode(getDefaultTargetTypeCode(request))
    setReviewNote('')
  }

  const closeReviewDialog = () => {
    if (isReviewing) return
    setDialogMode(null)
    setSelectedRequest(null)
    setReviewNote('')
  }

  const submitReview = () => {
    if (!selectedRequest || !dialogMode) return
    const approve = dialogMode === 'approve'

    if (approve && !targetTypeCode) {
      toast.error('Select a target profile category')
      return
    }

    setActionRequestUuid(selectedRequest.request_uuid)
    startReviewTransition(async () => {
      const result = await reviewUpgradeRequest(
        projectId,
        buildReviewUpgradePayload({
          requestUuid: selectedRequest.request_uuid,
          approve,
          targetTypeCode,
          note: reviewNote,
        })
      )

      setActionRequestUuid(null)

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success(approve ? 'Upgrade request approved' : 'Upgrade request rejected')
      setDialogMode(null)
      setSelectedRequest(null)
      setReviewNote('')
      refreshRequests()
    })
  }

  const tabs: Array<{ value: UpgradeRequestFilter; label: string; count: number }> = [
    { value: 'pending', label: 'Pending', count: counts.pending },
    { value: 'approved', label: 'Approved', count: counts.approved },
    { value: 'rejected', label: 'Rejected', count: counts.rejected },
    { value: 'all', label: 'All', count: requests.length },
  ]

  return (
    <>
      <div className="space-y-7 pb-10">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Sparkles className="size-3.5" />
              Questionnaire intelligence
            </div>
            <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-display text-3xl font-black tracking-tight text-transparent sm:text-4xl">
              Upgrade Review Queue
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Review visitors whose questionnaire answers qualify them for a new
              profile category.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-11 w-full rounded-xl border-white/10 bg-white/5 font-bold sm:w-auto"
            disabled={isRefreshing}
            onClick={() => refreshRequests(true)}
          >
            <RefreshCw className={cn('size-4', isRefreshing && 'animate-spin')} />
            Refresh queue
          </Button>
        </header>

        {initialError ? (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
            <p className="font-bold">The initial request list could not be loaded.</p>
            <p className="mt-1 opacity-80">{initialError}</p>
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              label: 'Awaiting decision',
              value: counts.pending,
              icon: Clock3,
              className: 'text-amber-600 dark:text-amber-400',
            },
            {
              label: 'Approved',
              value: counts.approved,
              icon: CheckCircle2,
              className: 'text-emerald-600 dark:text-emerald-400',
            },
            {
              label: 'Rejected',
              value: counts.rejected,
              icon: XCircle,
              className: 'text-red-600 dark:text-red-400',
            },
            {
              label: 'Approval rate',
              value: `${approvalRate}%`,
              icon: ShieldCheck,
              className: 'text-primary',
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="glass overflow-hidden rounded-2xl border-white/10 shadow-lg shadow-black/5"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4 pb-2 sm:p-5 sm:pb-2">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <stat.icon className={cn('size-4 shrink-0', stat.className)} />
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
                <p className="font-display text-3xl font-black tracking-tight">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="sticky top-3 z-20 rounded-3xl border border-white/10 bg-background/75 p-3 shadow-xl shadow-black/5 backdrop-blur-2xl">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as UpgradeRequestFilter)}
              className="scrollbar-hide min-w-0 overflow-x-auto"
            >
              <TabsList className="h-11 min-w-max rounded-xl bg-white/5 p-1">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-9 gap-2 rounded-lg px-3 text-xs font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {tab.label}
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-[10px] dark:bg-white/10">
                      {tab.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full xl:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search attendee, company or code..."
                className="h-11 rounded-xl border-white/10 bg-white/5 pl-10"
              />
            </div>
          </div>
        </section>

        {filteredRequests.length === 0 ? (
          <Card className="glass rounded-3xl border-dashed border-white/15">
            <CardContent className="flex flex-col items-center px-5 py-16 text-center">
              <div className="grid size-16 place-items-center rounded-3xl bg-primary/10 text-primary">
                {statusFilter === 'pending' ? (
                  <BadgeCheck className="size-8" />
                ) : (
                  <Search className="size-8" />
                )}
              </div>
              <h2 className="mt-5 text-xl font-black">
                {statusFilter === 'pending' && !searchQuery
                  ? 'The review queue is clear'
                  : 'No matching upgrade requests'}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                {statusFilter === 'pending' && !searchQuery
                  ? 'New questionnaire-triggered upgrade requests will appear here.'
                  : 'Try another status or search term.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {filteredRequests.map((request) => (
              <RequestCard
                key={request.request_uuid}
                request={request}
                attendeeTypes={attendeeTypeOptions}
                actionLoading={actionRequestUuid === request.request_uuid}
                onApprove={(item) => openReviewDialog(item, 'approve')}
                onReject={(item) => openReviewDialog(item, 'reject')}
              />
            ))}
          </section>
        )}
      </div>

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeReviewDialog()}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl border-white/10 bg-background/95 p-5 backdrop-blur-2xl sm:max-w-xl sm:p-7">
          <DialogHeader>
            <div
              className={cn(
                'mb-2 grid size-12 place-items-center rounded-2xl',
                dialogMode === 'approve'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              )}
            >
              {dialogMode === 'approve' ? (
                <BadgeCheck className="size-6" />
              ) : (
                <XCircle className="size-6" />
              )}
            </div>
            <DialogTitle className="font-display text-2xl font-black">
              {dialogMode === 'approve'
                ? 'Approve attendee upgrade'
                : 'Reject attendee upgrade'}
            </DialogTitle>
            <DialogDescription className="leading-6">
              {dialogMode === 'approve'
                ? 'Confirm the profile category this attendee should receive.'
                : 'The attendee will keep their current profile category.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest ? (
            <div className="space-y-5 py-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="font-black">
                  {[selectedRequest.first_name, selectedRequest.last_name]
                    .filter(Boolean)
                    .join(' ')}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedRequest.registration_code} ·{' '}
                  {selectedRequest.company_name || 'No company'}
                </p>
              </div>

              {dialogMode === 'approve' ? (
                <>
                  <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
                    <TypePill
                      code={selectedRequest.from_type_code}
                      attendeeTypes={attendeeTypeOptions}
                    />
                    <div className="grid size-8 place-items-center justify-self-center rounded-full bg-primary/10 text-primary sm:mb-2">
                      <ArrowRight className="size-4 rotate-90 sm:rotate-0" />
                    </div>
                    <TypePill
                      code={targetTypeCode}
                      attendeeTypes={attendeeTypeOptions}
                      highlighted
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-profile-category">
                      Target profile category
                    </Label>
                    <Select
                      value={targetTypeCode}
                      onValueChange={setTargetTypeCode}
                      disabled={isReviewing}
                    >
                      <SelectTrigger
                        id="target-profile-category"
                        className="h-12 rounded-xl border-white/10 bg-white/5"
                      >
                        <SelectValue placeholder="Select profile category" />
                      </SelectTrigger>
                      <SelectContent className="glass border-white/10">
                        {attendeeTypeOptions.map((type) => (
                          <SelectItem key={type.type_code} value={type.type_code}>
                            {type.type_name || type.badge_name || type.type_code} (
                            {type.type_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Suggested by questionnaire: {selectedRequest.suggested_type_code}
                    </p>
                  </div>
                </>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="review-note">
                  Review note <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id="review-note"
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder={
                    dialogMode === 'approve'
                      ? 'Add an internal approval note...'
                      : 'Explain why this request was rejected...'
                  }
                  className="min-h-24 rounded-xl border-white/10 bg-white/5"
                  disabled={isReviewing}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="h-11 rounded-xl"
              onClick={closeReviewDialog}
              disabled={isReviewing}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                'h-11 rounded-xl font-bold text-white',
                dialogMode === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              )}
              onClick={submitReview}
              disabled={isReviewing}
            >
              {isReviewing ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : dialogMode === 'approve' ? (
                <BadgeCheck className="size-4" />
              ) : (
                <XCircle className="size-4" />
              )}
              {dialogMode === 'approve' ? 'Confirm approval' : 'Confirm rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
