'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  type BMVisitorCampaignData,
  type BMCampaignDeliverySummary,
  getBMVisitorCampaignStatus,
  pauseBMVisitorCampaign,
  startBMVisitorCampaign,
  triggerBMVisitorCampaignBatchNow,
  sendTestBMVisitorCampaign,
  retryFailedBMVisitorCampaign,
  type FailedCampaignRecord,
} from '@/app/actions/bm-visitor-campaign'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  ChevronDown,
  Clock,
  Info,
  Loader2,
  Mail,
  Pause,
  Play,
  RefreshCw,
  Send,
  Settings2,
  Zap,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BMVisitorReadyCampaignCardProps {
  projectId: string
  readyCount?: number
  onBatchExecuted?: () => void
}

export function BMVisitorReadyCampaignCard({
  projectId,
  readyCount,
  onBatchExecuted,
}: BMVisitorReadyCampaignCardProps) {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [campaign, setCampaign] = useState<BMVisitorCampaignData | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [testEmail, setTestEmail] = useState('')
  const [batchSize, setBatchSize] = useState<number>(50)
  const [intervalMinutes, setIntervalMinutes] = useState<number>(10)
  const [sendingTest, setSendingTest] = useState(false)
  const [failedLogs, setFailedLogs] = useState<FailedCampaignRecord[]>([])
  const [deliverySummary, setDeliverySummary] =
    useState<BMCampaignDeliverySummary | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [isEnabled, setIsEnabled] = useState<boolean | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    const result = await getBMVisitorCampaignStatus(projectId)
    setLoading(false)
    if (result.success && result.data) {
      const resp = result.data as any
      setIsEnabled(true)
      setStatus(resp.campaign?.status || resp.status || resp.Status || 'idle')
      setCampaign(resp.campaign || resp)
      if (resp.failed_logs) setFailedLogs(resp.failed_logs)
      setDeliverySummary(resp.delivery_summary || null)
    } else {
      setIsEnabled(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      fetchStatus()
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  // Countdown timer calculation
  useEffect(() => {
    const rawC = campaign as any
    const targetNextRun =
      campaign?.next_run_at || rawC?.NextRunAt || rawC?.next_run_at || null
    if (!targetNextRun || (status !== 'active' && status !== 'sending')) {
      setTimeLeft('')
      return
    }

    const updateTimer = () => {
      const nextTime = new Date(targetNextRun).getTime()
      const now = new Date().getTime()
      const diff = Math.max(0, Math.floor((nextTime - now) / 1000))

      if (diff <= 0) {
        setTimeLeft('00:00 (Sending...)')
        fetchStatus()
        return
      }

      const mins = Math.floor(diff / 60)
      const secs = diff % 60
      setTimeLeft(
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      )
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [campaign?.next_run_at, (campaign as any)?.NextRunAt, status, fetchStatus])

  if (isEnabled === false) return null
  if (loading && isEnabled === null) return null

  const handleStart = async () => {
    setActionLoading(true)
    const res = await startBMVisitorCampaign(
      projectId,
      batchSize,
      intervalMinutes
    )
    setActionLoading(false)
    if (res.success) {
      toast.success(
        `Scheduled visitor campaign started! Sends ${batchSize} emails every ${intervalMinutes} mins.`
      )
      fetchStatus()
      if (onBatchExecuted) onBatchExecuted()
    } else {
      toast.error(res.error || 'Failed to start campaign')
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    const res = await pauseBMVisitorCampaign(projectId)
    setActionLoading(false)
    if (res.success) {
      toast.warning('Scheduled campaign paused.')
      fetchStatus()
    } else {
      toast.error(res.error || 'Failed to pause campaign')
    }
  }

  const handleTriggerBatch = async () => {
    setActionLoading(true)
    const res = await triggerBMVisitorCampaignBatchNow(projectId)
    setActionLoading(false)
    if (res.success) {
      toast.success(
        'Batch queued! The worker will execute sending immediately.'
      )
      fetchStatus()
      if (onBatchExecuted) onBatchExecuted()
    } else {
      toast.error(res.error || 'Failed to trigger batch')
    }
  }

  const rawCampaign = campaign as any
  const totalEligible =
    deliverySummary?.email_ready ??
    campaign?.total_eligible ??
    rawCampaign?.TotalEligible ??
    0
  const totalSent =
    deliverySummary?.sent ?? campaign?.total_sent ?? rawCampaign?.TotalSent ?? 0
  const totalFailed =
    deliverySummary?.failed ??
    campaign?.total_failed ??
    rawCampaign?.TotalFailed ??
    0
  const configBatchSize = campaign?.batch_size ?? rawCampaign?.BatchSize ?? 50
  const configIntervalMinutes =
    campaign?.interval_minutes ?? rawCampaign?.IntervalMinutes ?? 10
  const progressPercent =
    totalEligible > 0
      ? Math.min(100, Math.round((totalSent / totalEligible) * 100))
      : 0

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return (
          <Badge className="border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Active ({configBatchSize}/{configIntervalMinutes}m)
          </Badge>
        )
      case 'sending':
        return (
          <Badge className="animate-pulse border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Sending...
          </Badge>
        )
      case 'paused':
        return (
          <Badge className="border-amber-500/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            Paused
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            Completed
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Idle
          </Badge>
        )
    }
  }

  return (
    <TooltipProvider>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border-border/80 bg-card/60 mb-6 overflow-hidden rounded-xl border shadow-xs backdrop-blur-md transition-all duration-200"
      >
        {/* Compact Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:flex-nowrap">
          {/* Left side: Icon + Title */}
          <div className="flex shrink-0 items-center gap-3">
            <div className="bg-primary/10 text-primary rounded-lg p-2">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-foreground hidden text-sm font-bold sm:block">
                Business Matching Visitor Ready Email
              </h3>
              <h3 className="text-foreground text-sm font-bold sm:hidden">
                BM Visitor Ready
              </h3>
            </div>
          </div>

          {/* Center: Pill-shaped Progress Bar */}
          <div className="bg-muted/40 border-border/40 flex max-w-xs flex-1 items-center gap-3 rounded-full border px-3 py-1.5 sm:max-w-sm">
            <div className="bg-secondary h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-muted-foreground text-[11px] font-bold tracking-tight whitespace-nowrap">
              {totalSent.toLocaleString()} / {totalEligible.toLocaleString()}{' '}
              <span className="text-primary ml-1 font-extrabold">
                ({progressPercent}%)
              </span>
            </span>
          </div>

          {/* Right side: Badge + Actions */}
          <div className="flex shrink-0 items-center gap-2">
            {timeLeft && (
              <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3 w-3 animate-pulse text-emerald-500" />
                {timeLeft.includes('Sending') ? 'Sending...' : timeLeft}
              </span>
            )}
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              onClick={(e) => {
                e.stopPropagation()
                fetchStatus()
              }}
              disabled={loading}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground h-8 gap-1.5 px-2.5 text-xs font-semibold"
              >
                <Settings2 className="text-primary h-3.5 w-3.5" />
                <span>Config</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        {/* Expanded Drawer Area */}
        <CollapsibleContent className="border-border/60 bg-muted/20 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden border-t backdrop-blur-sm">
          <div className="space-y-3 p-4">
            {/* Top Sub-bar */}
            <div className="border-border/30 flex flex-col justify-between gap-2 border-b pb-1 sm:flex-row sm:items-center">
              <p className="text-muted-foreground text-xs">
                Automated server-side batch sending: 50 emails every 10 minutes
                for Thailand LAB 2026.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {deliverySummary && (
                  <Badge className="border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    Queued: {deliverySummary.queued.toLocaleString()}
                  </Badge>
                )}
                {deliverySummary && deliverySummary.missing_contact > 0 && (
                  <Badge
                    variant="outline"
                    className="px-2 py-0.5 text-[10px] font-bold"
                  >
                    Missing email:{' '}
                    {deliverySummary.missing_contact.toLocaleString()}
                  </Badge>
                )}
                {!deliverySummary && typeof readyCount === 'number' && (
                  <Badge className="border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                    ⚡ Ready for next batch: {readyCount.toLocaleString()}
                  </Badge>
                )}
                {totalFailed > 0 && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-2 py-0.5 text-[10px] font-bold">
                    Failed: {totalFailed.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>

            {/* Main Grid Section */}
            <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12">
              {/* Left Box: Batch Controls (Span 7) */}
              <div className="bg-card border-border/60 flex flex-col justify-between gap-3 rounded-xl border p-3.5 shadow-xs lg:col-span-7">
                <span className="text-foreground flex items-center gap-1.5 text-xs font-bold">
                  <Settings2 className="text-primary h-3.5 w-3.5" />
                  Schedule & Batch Controls
                </span>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Inputs Group */}
                  <div className="bg-muted/40 border-border/50 flex items-center gap-2 rounded-lg border p-1.5">
                    <div>
                      <label className="text-muted-foreground mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                        Batch Size
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-3 w-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Number of emails to send per batch (Recommended:
                              50)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={500}
                        value={batchSize}
                        onChange={(e) =>
                          setBatchSize(parseInt(e.target.value) || 50)
                        }
                        disabled={status !== 'idle' && status !== 'paused'}
                        className="bg-background h-8 w-20 cursor-not-allowed text-center text-xs font-semibold disabled:opacity-60"
                      />
                    </div>
                    <div className="text-muted-foreground pt-4 text-xs font-bold">
                      :
                    </div>
                    <div>
                      <label className="text-muted-foreground mb-1 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                        Interval (min)
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="text-muted-foreground h-3 w-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Interval between each batch in minutes
                              (Recommended: 10)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={60}
                        value={intervalMinutes}
                        onChange={(e) =>
                          setIntervalMinutes(parseInt(e.target.value) || 10)
                        }
                        disabled={status !== 'idle' && status !== 'paused'}
                        className="bg-background h-8 w-20 cursor-not-allowed text-center text-xs font-semibold disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Buttons Group */}
                  <div className="flex items-center gap-2">
                    {status === 'idle' || status === 'paused' ? (
                      <Button
                        size="sm"
                        className="h-9 gap-1.5 bg-emerald-600 px-4 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                        onClick={handleStart}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5 fill-current" />
                        )}
                        Start Schedule
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1.5 border-amber-500/40 px-4 text-xs font-bold text-amber-600 hover:bg-amber-500/10"
                        onClick={handlePause}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pause className="h-3.5 w-3.5 fill-current" />
                        )}
                        Pause Schedule
                      </Button>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 gap-1.5 px-3 text-xs font-bold"
                          onClick={handleTriggerBatch}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          )}
                          Send 1 Batch Now
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Send 1 batch immediately based on the configured Batch
                          Size
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Right Box: Countdown & Test Dispatcher (Span 5) */}
              <div className="flex flex-col justify-between gap-3 lg:col-span-5">
                {/* Next Run Countdown Timer (if active or sending) */}
                {(status === 'active' || status === 'sending') && (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-700 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 animate-pulse text-emerald-600" />
                      <span className="text-xs font-bold">
                        {status === 'sending'
                          ? 'Sending Batch...'
                          : 'Next Batch in:'}
                      </span>
                    </div>
                    <div className="bg-background/80 rounded border border-emerald-500/30 px-2.5 py-0.5 font-mono text-sm font-extrabold">
                      {status === 'sending' ? '00:00' : timeLeft || '10:00'}
                    </div>
                  </div>
                )}

                {/* Send Test Email Section */}
                <div className="bg-card border-border/60 flex flex-1 flex-col justify-between gap-2 rounded-xl border p-3.5 shadow-xs">
                  <span className="text-foreground flex items-center gap-1.5 text-xs font-bold">
                    <Mail className="text-primary h-3.5 w-3.5" />
                    Send Test Email
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="text-muted-foreground ml-1 h-3.5 w-3.5 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Send a test email to the specified address to verify
                          delivery and format
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="email"
                      placeholder="Enter email address..."
                      className="bg-background h-8 flex-1 text-xs"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs font-semibold whitespace-nowrap"
                      disabled={sendingTest || !testEmail}
                      onClick={async () => {
                        setSendingTest(true)
                        const res = await sendTestBMVisitorCampaign(
                          projectId,
                          testEmail
                        )
                        setSendingTest(false)
                        if (res.success) toast.success(res.message)
                        else toast.error(res.error)
                      }}
                    >
                      {sendingTest ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1 h-3.5 w-3.5" />
                      )}
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Logs Section */}
            {failedLogs.length > 0 && (
              <div className="border-border/40 space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-destructive flex items-center gap-1.5 text-xs font-bold">
                    Failed Deliveries ({failedLogs.length})
                  </h4>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-7 px-2.5 text-xs"
                    disabled={retrying}
                    onClick={async () => {
                      setRetrying(true)
                      const res = await retryFailedBMVisitorCampaign(projectId)
                      setRetrying(false)
                      if (res.success) {
                        toast.success(res.message)
                        fetchStatus()
                      } else {
                        toast.error(res.error)
                      }
                    }}
                  >
                    {retrying ? (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-1 h-3 w-3" />
                    )}
                    Retry Failed
                  </Button>
                </div>
                <ScrollArea className="border-destructive/20 bg-destructive/5 h-[100px] rounded-lg border p-2">
                  <div className="space-y-1">
                    {failedLogs.map((log) => (
                      <div
                        key={log.uuid}
                        className="hover:bg-destructive/10 flex items-center justify-between rounded p-1.5 text-xs transition-colors"
                      >
                        <span
                          className="mr-2 truncate font-semibold"
                          title={log.name}
                        >
                          {log.name || 'Unknown'}
                        </span>
                        <span
                          className="text-muted-foreground truncate font-mono text-[11px]"
                          title={log.contact_info}
                        >
                          {log.contact_info}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </TooltipProvider>
  )
}
