'use client'

import { useState } from 'react'
import type { BusinessMatchingSummary } from '@/app/actions/business-matching-report'
import type { AdminReportDetailKey } from '../admin-report-detail-modal'

type Props = {
  summary?: BusinessMatchingSummary
  onSelectStatus?: (key: AdminReportDetailKey, label: string, expectedValue: string) => void
}

type SliceData = {
  key: AdminReportDetailKey
  label: string
  displayLabel: string
  value: number
  color: string
}

export function MeetingStatusDonutChart({ summary, onSelectStatus }: Props) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  if (!summary) {
    return <div className="p-4 text-sm font-semibold text-muted-foreground">No data available</div>
  }

  const totals = summary.totals || {}
  const requested = totals.requested || 0
  const accepted = totals.accepted || 0
  const rejected = totals.rejected || 0
  const cancelled = totals.cancelled || 0
  const success = totals.success || 0
  const total = requested + accepted + rejected + cancelled + success

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border/60 p-4 text-sm font-semibold text-muted-foreground">
        No match requests recorded yet.
      </div>
    )
  }

  const allSlices: SliceData[] = [
    { key: 'requested', label: 'Requested', displayLabel: 'Requested meetings', value: requested, color: '#087dbc' },
    { key: 'accepted', label: 'Accepted', displayLabel: 'Confirmed meetings', value: accepted, color: '#334155' },
    { key: 'success', label: 'Success', displayLabel: 'Completed meetings', value: success, color: '#16a34a' },
    { key: 'rejected', label: 'Rejected', displayLabel: 'Rejected meetings', value: rejected, color: '#dc2626' },
    { key: 'cancelled', label: 'Cancelled', displayLabel: 'Cancelled meetings', value: cancelled, color: '#94a3b8' },
  ]
  const data = allSlices.filter((d) => d.value > 0)

  // Donut SVG parameters
  const radius = 60
  const strokeWidth = 16
  const circumference = 2 * Math.PI * radius

  let currentOffset = 0

  return (
    <div className="flex w-full flex-col items-center gap-6 sm:flex-row">
      <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
        <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
          <circle cx="80" cy="80" r={radius} fill="transparent" stroke="currentColor" className="text-muted/30" strokeWidth={strokeWidth} />
          {data.map((item) => {
            const percentage = item.value / total
            const dashArray = `${percentage * circumference} ${circumference}`
            const offset = currentOffset
            currentOffset += percentage * circumference
            const isHovered = hoveredKey === item.key

            return (
              <circle
                key={item.key}
                cx="80"
                cy="80"
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-offset}
                onMouseEnter={() => setHoveredKey(item.key)}
                onMouseLeave={() => setHoveredKey(null)}
                onClick={() => onSelectStatus?.(item.key, item.label, item.value.toLocaleString())}
                className={`transition-all duration-300 ${
                  onSelectStatus ? 'cursor-pointer' : ''
                } ${isHovered ? 'brightness-110' : 'opacity-95'}`}
              />
            )
          })}
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">{total}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Meetings</span>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {data.map((item) => {
          const isHovered = hoveredKey === item.key
          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              onClick={() => onSelectStatus?.(item.key, item.label, item.value.toLocaleString())}
              className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 text-xs font-semibold transition-colors text-left ${
                isHovered ? 'bg-muted/70 text-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`size-2.5 shrink-0 rounded-full transition-transform ${isHovered ? 'scale-125' : ''}`}
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.displayLabel}</span>
              </div>
              <span className="shrink-0 font-bold text-foreground">
                {item.value} ({Math.round((item.value / total) * 100)}%)
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
