'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  type BMVisitorCampaignData,
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

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown, Clock, Info, Loader2, Mail, Pause, Play, RefreshCw, Send, Settings2, Zap } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface BMVisitorReadyCampaignCardProps {
  projectId: string
  readyCount?: number
  onBatchExecuted?: () => void
}

export function BMVisitorReadyCampaignCard({ projectId, readyCount, onBatchExecuted }: BMVisitorReadyCampaignCardProps) {
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
    const targetNextRun = campaign?.next_run_at || rawC?.NextRunAt || rawC?.next_run_at || null
    if (!targetNextRun || (status !== 'active' && status !== 'sending' && status !== 'completed')) {
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
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
    }

    updateTimer()
    const timerInterval = setInterval(updateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [campaign?.next_run_at, (campaign as any)?.NextRunAt, status, fetchStatus])

  if (isEnabled === false) return null
  if (loading && isEnabled === null) return null

  const handleStart = async () => {
    setActionLoading(true)
    const res = await startBMVisitorCampaign(projectId, batchSize, intervalMinutes)
    setActionLoading(false)
    if (res.success) {
      toast.success(`Scheduled visitor campaign started! Sends ${batchSize} emails every ${intervalMinutes} mins.`)
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
      toast.success('Batch queued! The worker will execute sending immediately.')
      fetchStatus()
      if (onBatchExecuted) onBatchExecuted()
    } else {
      toast.error(res.error || 'Failed to trigger batch')
    }
  }

  const rawCampaign = campaign as any
  const totalEligible = campaign?.total_eligible ?? rawCampaign?.TotalEligible ?? 0
  const totalSent = campaign?.total_sent ?? rawCampaign?.TotalSent ?? 0
  const totalFailed = campaign?.total_failed ?? rawCampaign?.TotalFailed ?? 0
  const configBatchSize = campaign?.batch_size ?? rawCampaign?.BatchSize ?? 50
  const configIntervalMinutes = campaign?.interval_minutes ?? rawCampaign?.IntervalMinutes ?? 10
  const progressPercent = totalEligible > 0 ? Math.min(100, Math.round((totalSent / totalEligible) * 100)) : 0

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold px-2.5 py-0.5">Active ({configBatchSize}/{configIntervalMinutes}m)</Badge>
      case 'sending':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2.5 py-0.5 animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin inline" /> Sending...</Badge>
      case 'paused':
        return <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-semibold px-2.5 py-0.5">Paused</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-semibold px-2.5 py-0.5">Completed</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Idle</Badge>
    }
  }

  return (
    <TooltipProvider>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="border border-border/80 bg-card/60 backdrop-blur-md shadow-xs mb-6 rounded-xl overflow-hidden transition-all duration-200"
      >
      {/* Compact Header Bar */}
      <div className="px-4 py-3 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
        {/* Left side: Icon + Title */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground hidden sm:block">Business Matching Visitor Ready Email</h3>
            <h3 className="font-bold text-sm text-foreground sm:hidden">BM Visitor Ready</h3>
          </div>
        </div>

        {/* Center: Pill-shaped Progress Bar */}
        <div className="flex-1 max-w-xs sm:max-w-sm flex items-center gap-3 bg-muted/40 px-3 py-1.5 rounded-full border border-border/40">
          <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] font-bold tracking-tight text-muted-foreground whitespace-nowrap">
            {totalSent.toLocaleString()} / {totalEligible.toLocaleString()} <span className="text-primary font-extrabold ml-1">({progressPercent}%)</span>
          </span>
        </div>

        {/* Right side: Badge + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {timeLeft && (
            <span className="text-[11px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse text-emerald-500" />
              {timeLeft.includes('Sending') ? 'Sending...' : timeLeft}
            </span>
          )}
          {getStatusBadge()}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); fetchStatus(); }} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1.5 text-muted-foreground hover:text-foreground px-2.5">
              <Settings2 className="h-3.5 w-3.5 text-primary" />
              <span>Config</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
      </div>

      {/* Expanded Drawer Area */}
      <CollapsibleContent className="border-t border-border/60 bg-muted/20 backdrop-blur-sm data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
        <div className="p-4 space-y-3">
          
          {/* Top Sub-bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/30">
            <p className="text-xs text-muted-foreground">
              Automated server-side batch sending: 50 emails every 10 minutes for Thailand LAB 2026.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              {typeof readyCount === 'number' && (
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 text-[10px] font-bold px-2 py-0.5">
                  ⚡ Ready for next batch: {readyCount.toLocaleString()}
                </Badge>
              )}
              {totalFailed > 0 && (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold px-2 py-0.5">
                  Failed: {totalFailed.toLocaleString()}
                </Badge>
              )}
            </div>
          </div>

          {/* Main Grid Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
            
            {/* Left Box: Batch Controls (Span 7) */}
            <div className="lg:col-span-7 flex flex-col justify-between p-3.5 rounded-xl bg-card border border-border/60 shadow-xs gap-3">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
                Schedule & Batch Controls
              </span>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Inputs Group */}
                <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border/50">
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      Batch Size
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Number of emails to send per batch (Recommended: 50)</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Input 
                      type="number" 
                      min={1} max={500} 
                      value={batchSize} 
                      onChange={(e) => setBatchSize(parseInt(e.target.value) || 50)} 
                      className="h-8 w-20 text-xs text-center font-semibold bg-background"
                    />
                  </div>
                  <div className="text-muted-foreground text-xs font-bold pt-4">:</div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-1">
                      Interval (min)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Interval between each batch in minutes (Recommended: 10)</p>
                        </TooltipContent>
                      </Tooltip>
                    </label>
                    <Input 
                      type="number" 
                      min={1} max={60} 
                      value={intervalMinutes} 
                      onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 10)} 
                      className="h-8 w-20 text-xs text-center font-semibold bg-background"
                    />
                  </div>
                </div>

                {/* Buttons Group */}
                <div className="flex items-center gap-2">
                  {status === 'idle' || status === 'paused' ? (
                    <Button
                      size="sm"
                      className="h-9 px-4 font-bold text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      onClick={handleStart}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      Start Schedule
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 px-4 font-bold text-xs gap-1.5 text-amber-600 border-amber-500/40 hover:bg-amber-500/10"
                      onClick={handlePause}
                      disabled={actionLoading}
                    >
                      {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5 fill-current" />}
                      Pause Schedule
                    </Button>
                  )}

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-9 px-3 text-xs font-bold gap-1.5"
                        onClick={handleTriggerBatch}
                        disabled={actionLoading}
                      >
                        {actionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
                        Send 1 Batch Now
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send 1 batch immediately based on the configured Batch Size</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Right Box: Countdown & Test Dispatcher (Span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3">
              {/* Next Run Countdown Timer (if active or sending) */}
              {(status === 'active' || status === 'sending') && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-pulse text-emerald-600" />
                    <span className="text-xs font-bold">{status === 'sending' ? 'Sending Batch...' : 'Next Batch in:'}</span>
                  </div>
                  <div className="font-mono text-sm font-extrabold bg-background/80 px-2.5 py-0.5 rounded border border-emerald-500/30">
                    {status === 'sending' ? '00:00' : (timeLeft || '10:00')}
                  </div>
                </div>
              )}

              {/* Send Test Email Section */}
              <div className="p-3.5 rounded-xl bg-card border border-border/60 shadow-xs flex-1 flex flex-col justify-between gap-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Send Test Email
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help ml-1" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Send a test email to the specified address to verify delivery and format</p>
                    </TooltipContent>
                  </Tooltip>
                </span>
                <div className="flex items-center gap-2">
                  <Input 
                    type="email" 
                    placeholder="Enter email address..." 
                    className="flex-1 h-8 text-xs bg-background"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-8 text-xs font-semibold px-3 whitespace-nowrap"
                    disabled={sendingTest || !testEmail}
                    onClick={async () => {
                      setSendingTest(true)
                      const res = await sendTestBMVisitorCampaign(projectId, testEmail)
                      setSendingTest(false)
                      if (res.success) toast.success(res.message)
                      else toast.error(res.error)
                    }}
                  >
                    {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                    Test
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Failed Logs Section */}
          {failedLogs.length > 0 && (
            <div className="pt-3 border-t border-border/40 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-destructive flex items-center gap-1.5">
                  Failed Deliveries ({failedLogs.length})
                </h4>
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs px-2.5"
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
                  {retrying ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                  Retry Failed
                </Button>
              </div>
              <ScrollArea className="h-[100px] rounded-lg border border-destructive/20 bg-destructive/5 p-2">
                <div className="space-y-1">
                  {failedLogs.map((log) => (
                    <div key={log.uuid} className="text-xs flex items-center justify-between p-1.5 hover:bg-destructive/10 rounded transition-colors">
                      <span className="font-semibold truncate mr-2" title={log.name}>{log.name || 'Unknown'}</span>
                      <span className="text-muted-foreground truncate font-mono text-[11px]" title={log.contact_info}>{log.contact_info}</span>
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
