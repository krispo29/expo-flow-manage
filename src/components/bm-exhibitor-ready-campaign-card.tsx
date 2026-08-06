'use client'

import { useCallback, useEffect, useState } from 'react'
import { Clock, Loader2, Mail, Pause, Play, RefreshCw, Zap } from 'lucide-react'
import { toast } from 'sonner'

import {
  type BMExhibitorReadyCampaignStatus,
  getBMExhibitorCampaignStatus,
  pauseBMExhibitorCampaign,
  startBMExhibitorCampaign,
  triggerBMExhibitorCampaignBatchNow,
} from '@/app/actions/bm-exhibitor-campaign'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface BMExhibitorReadyCampaignCardProps {
  projectId: string
  readyCount?: number
  onBatchExecuted?: () => void
}

const THAILAB2026_PROJECT_ID = '07626a19-001d-4675-addd-3a92e3f46d47'

export function BMExhibitorReadyCampaignCard({ projectId, readyCount, onBatchExecuted }: BMExhibitorReadyCampaignCardProps) {
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [campaign, setCampaign] = useState<BMExhibitorReadyCampaignStatus | null>(null)
  const [status, setStatus] = useState<string>('idle')
  const [timeLeft, setTimeLeft] = useState<string>('')

  const fetchStatus = useCallback(async () => {
    if (projectId !== THAILAB2026_PROJECT_ID) return
    setLoading(true)
    const result = await getBMExhibitorCampaignStatus(projectId)
    setLoading(false)
    if (result.success && result.data) {
      setStatus(result.data.status || (result.data as any).Status || 'idle')
      setCampaign(result.data)
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
    if (!targetNextRun || status !== 'active') {
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

  if (projectId !== THAILAB2026_PROJECT_ID) {
    return null
  }

  const handleStart = async () => {
    setActionLoading(true)
    const res = await startBMExhibitorCampaign(projectId, 50, 10)
    setActionLoading(false)
    if (res.success) {
      toast.success('Scheduled exhibitor campaign started! Sends 50 emails every 10 mins.')
      fetchStatus()
      if (onBatchExecuted) onBatchExecuted()
    } else {
      toast.error(res.error || 'Failed to start campaign')
    }
  }

  const handlePause = async () => {
    setActionLoading(true)
    const res = await pauseBMExhibitorCampaign(projectId)
    setActionLoading(false)
    if (res.success) {
      toast.warning('Scheduled exhibitor campaign paused.')
      fetchStatus()
    } else {
      toast.error(res.error || 'Failed to pause campaign')
    }
  }

  const handleTriggerBatch = async () => {
    setActionLoading(true)
    const res = await triggerBMExhibitorCampaignBatchNow(projectId)
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
  const progressPercent = totalEligible > 0 ? Math.min(100, Math.round((totalSent / totalEligible) * 100)) : 0

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">Active (Running 50/10m)</Badge>
      case 'paused':
        return <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30">Paused</Badge>
      case 'completed':
        return <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30">Completed</Badge>
      default:
        return <Badge variant="outline">Idle</Badge>
    }
  }

  return (
    <Card className="glass border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-background shadow-lg mb-6">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">
              Business Matching Exhibitor Ready Email Schedule
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchStatus} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        <CardDescription>
          Automated server-side batch sending: 50 emails every 10 minutes for Thailand LAB 2026.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between text-xs font-semibold gap-2">
            <span>Progress: {totalSent.toLocaleString()} / {totalEligible.toLocaleString()} sent</span>
            <div className="flex items-center gap-2">
              {typeof readyCount === 'number' && (
                <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold px-2 py-0.5">
                  ⚡ Ready for next batch: {readyCount.toLocaleString()}
                </Badge>
              )}
              <span>{progressPercent}%</span>
            </div>
          </div>
          <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {totalFailed > 0 && (
            <p className="text-xs text-destructive font-medium">
              Failed recipients: {totalFailed.toLocaleString()}
            </p>
          )}
        </div>

        {/* Next Run Countdown Timer */}
        {status === 'active' && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-primary/10 to-teal-500/10 border border-emerald-500/30 text-primary shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Clock className="h-5 w-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-foreground">เวลานับถอยหลังรอบส่งถัดไป (50 อีเมล)</span>
                <span className="text-xs text-muted-foreground">ระบบจะส่งอีเมลอัตโนมัติทุกๆ 10 นาที</span>
              </div>
            </div>
            <div className="font-mono text-lg bg-background/90 px-4 py-1.5 rounded-lg border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-extrabold tracking-widest shadow-inner">
              {timeLeft || '10:00'}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {status !== 'active' ? (
            <Button
              size="sm"
              className="font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleStart}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Start Schedule (50/10m)
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="font-bold gap-1.5 text-amber-600 border-amber-500/50 hover:bg-amber-500/10"
              onClick={handlePause}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4 fill-current" />}
              Pause Campaign
            </Button>
          )}

          <Button
            size="sm"
            variant="secondary"
            className="font-bold gap-1.5"
            onClick={handleTriggerBatch}
            disabled={actionLoading}
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />}
            Send 1 Batch Now (50)
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
