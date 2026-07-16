'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { businessMatchingEnabled, THAILAB2026_PROJECT_UUID } from '@/lib/features'
import { toast } from 'sonner'
import {
  approveBusinessMatchingCategoryRequest,
  getBusinessMatchingCategoryRequests,
  rejectBusinessMatchingCategoryRequest,
  type BusinessMatchingCategoryRequest,
  type BusinessMatchingCategoryRequestStatus,
} from '@/app/actions/business-matching-categories'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Check, Clock, Tags, X } from 'lucide-react'

type StatusFilter = BusinessMatchingCategoryRequestStatus | 'all'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

function formatDate(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getStatusClass(status: BusinessMatchingCategoryRequestStatus) {
  if (status === 'approved') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (status === 'rejected') {
    return 'border-red-200 bg-red-50 text-red-700'
  }
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function BusinessMatchingCategoriesContent() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId') || ''
  const isThailab2026 = projectId === THAILAB2026_PROJECT_UUID
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [requests, setRequests] = useState<BusinessMatchingCategoryRequest[]>(
    []
  )
  const [allRequests, setAllRequests] = useState<
    BusinessMatchingCategoryRequest[]
  >([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [actionUuid, setActionUuid] = useState<string | null>(null)
  const [pendingReview, setPendingReview] = useState<{
    request: BusinessMatchingCategoryRequest
    action: 'approve' | 'reject'
  } | null>(null)

  const loadRequests = useCallback(async () => {
    if (!isThailab2026) return

    setLoading(true)
    const resultRequest = getBusinessMatchingCategoryRequests(projectId, status)
    const allRequest =
      status === 'all'
        ? resultRequest
        : getBusinessMatchingCategoryRequests(projectId, 'all')
    const [result, allResult] = await Promise.all([resultRequest, allRequest])
    if (result.success) {
      setRequests(result.data)
    } else {
      toast.error(result.error)
      setRequests([])
    }
    if (allResult.success) {
      setAllRequests(allResult.data)
    }
    setLoading(false)
  }, [isThailab2026, projectId, status])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const counts = useMemo(
    () =>
      allRequests.reduce(
        (acc, request) => {
          acc[request.status] += 1
          return acc
        },
        { pending: 0, approved: 0, rejected: 0 }
      ),
    [allRequests]
  )

  async function handleReview() {
    if (!pendingReview) return
    const { request, action } = pendingReview
    setActionUuid(request.request_uuid)
    const note = notes[request.request_uuid] || ''
    const result =
      action === 'approve'
        ? await approveBusinessMatchingCategoryRequest(
            projectId,
            request.request_uuid,
            note
          )
        : await rejectBusinessMatchingCategoryRequest(
            projectId,
            request.request_uuid,
            note
          )

    if (result.success) {
      toast.success(
        action === 'approve'
          ? 'Category request approved'
          : 'Category request rejected'
      )
      await loadRequests()
    } else {
      toast.error(result.error)
    }
    setActionUuid(null)
    setPendingReview(null)
  }

  if (!isThailab2026) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center rounded-3xl p-12 glass">
        <h2 className="mb-2 text-2xl font-bold font-display">Not Available</h2>
        <p className="text-center text-muted-foreground/80">
          Business Matching Categories are available only for THAILAB2026.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 space-y-8 duration-700">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent font-display">
                Matching Categories
              </h1>
              <p className="mt-1 text-muted-foreground">
                Review exhibitor category requests before they become matching
                categories.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="rounded-full">
            THAILAB2026 only
          </Badge>
        </div>

        <Button variant="outline" onClick={loadRequests} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <Clock className="h-8 w-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{counts.pending}</p>
              <p className="text-sm text-muted-foreground">Pending review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <Check className="h-8 w-8 text-emerald-600" />
            <div>
              <p className="text-2xl font-bold">{counts.approved}</p>
              <p className="text-sm text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass">
          <CardContent className="flex items-center gap-4 p-5">
            <X className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold">{counts.rejected}</p>
              <p className="text-sm text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={status === option.value ? 'default' : 'outline'}
                onClick={() => setStatus(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              Loading category requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
              No category requests found.
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.request_uuid}
                  className="rounded-2xl border bg-background/75 p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold">
                          {request.requested_name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getStatusClass(request.status)}
                        >
                          {request.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Requested by{' '}
                        <span className="font-semibold text-foreground">
                          {request.company_name || 'Unknown exhibitor'}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="secondary">
                          {request.event_code || 'No event code'}
                        </Badge>
                        <span>{request.event_name || 'No event name'}</span>
                        <span>Created {formatDate(request.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {request.description ? (
                    <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm leading-6">
                      {request.description}
                    </p>
                  ) : (
                    <p className="mt-4 rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">
                      No description provided.
                    </p>
                  )}

                  {request.review_note ? (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Review note: {request.review_note}
                    </p>
                  ) : null}

                  {request.status === 'pending' ? (
                    <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-end">
                      <Textarea
                        placeholder="Optional review note for this request"
                        value={notes[request.request_uuid] || ''}
                        onChange={(event) =>
                          setNotes((current) => ({
                            ...current,
                            [request.request_uuid]: event.target.value,
                          }))
                        }
                      />
                      <Button
                        onClick={() =>
                          setPendingReview({ request, action: 'approve' })
                        }
                        disabled={actionUuid === request.request_uuid}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setPendingReview({ request, action: 'reject' })
                        }
                        disabled={actionUuid === request.request_uuid}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(pendingReview)}
        onOpenChange={(open) => {
          if (!open && !actionUuid) setPendingReview(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingReview?.action === 'approve'
                ? 'Approve category request?'
                : 'Reject category request?'}
            </DialogTitle>
            <DialogDescription>
              {pendingReview
                ? `This will ${pendingReview.action} "${pendingReview.request.requested_name}" for ${pendingReview.request.company_name || 'this exhibitor'}.`
                : ''}
            </DialogDescription>
          </DialogHeader>
          {pendingReview ? (
            <div className="rounded-xl bg-muted/60 p-4 text-sm">
              <div className="font-semibold">
                {pendingReview.request.requested_name}
              </div>
              <div className="mt-1 text-muted-foreground">
                {pendingReview.request.description || 'No description provided.'}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingReview(null)}
              disabled={Boolean(actionUuid)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={Boolean(actionUuid)}
              className={
                pendingReview?.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {pendingReview?.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function BusinessMatchingCategoriesPage() {
  return businessMatchingEnabled ? <BusinessMatchingCategoriesContent /> : null
}
