'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HourlyTrafficPoint } from '@/app/actions/lead-scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  data?: HourlyTrafficPoint[]
  totalScanned?: number
  peakTime?: string
}

const DEFAULT_HOURS = [
  { hour: '00:00', label: '12AM', weight: 0 },
  { hour: '01:00', label: '1AM', weight: 0 },
  { hour: '02:00', label: '2AM', weight: 0 },
  { hour: '03:00', label: '3AM', weight: 0 },
  { hour: '04:00', label: '4AM', weight: 0.01 },
  { hour: '05:00', label: '5AM', weight: 0.05 },
  { hour: '06:00', label: '6AM', weight: 0.18 },
  { hour: '07:00', label: '7AM', weight: 0.24 },
  { hour: '08:00', label: '8AM', weight: 0.32 },
  { hour: '09:00', label: '9AM', weight: 0.54 },
  { hour: '10:00', label: '10AM', weight: 0.65 },
  { hour: '11:00', label: '11AM', weight: 0.70 },
  { hour: '12:00', label: '12PM', weight: 0.76 },
  { hour: '13:00', label: '1PM', weight: 0.88 },
  { hour: '14:00', label: '2PM', weight: 1.0 }, // Peak time at 2 PM
  { hour: '15:00', label: '3PM', weight: 0.94 },
  { hour: '16:00', label: '4PM', weight: 0.89 },
  { hour: '17:00', label: '5PM', weight: 0.78 },
  { hour: '18:00', label: '6PM', weight: 0.64 },
  { hour: '19:00', label: '7PM', weight: 0.55 },
  { hour: '20:00', label: '8PM', weight: 0.45 },
  { hour: '21:00', label: '9PM', weight: 0.32 },
  { hour: '22:00', label: '10PM', weight: 0.18 },
  { hour: '23:00', label: '11PM', weight: 0.05 },
]

const TICK_HOURS = ['1AM', '4AM', '7AM', '10AM', '1PM', '4PM', '7PM', '10PM']

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (active && payload && payload.length) {
    const value = payload[0].value
    return (
      <div className="rounded-lg border border-border/80 bg-popover/95 px-3 py-2 shadow-lg backdrop-blur text-xs">
        <p className="font-semibold text-popover-foreground">{label}</p>
        <p className="mt-1 font-bold text-primary">
          {typeof value === 'number' ? value.toLocaleString() : value}{' '}
          <span className="font-normal text-muted-foreground">scans</span>
        </p>
      </div>
    )
  }
  return null
}

export function LeadScannerPeakHours({ data, totalScanned = 0, peakTime: propPeakTime }: Props) {
  const chartData = useMemo(() => {
    if (data && data.length > 0) {
      return data
    }

    if (totalScanned <= 0) {
      return DEFAULT_HOURS.map((h) => ({ hour: h.hour, label: h.label, scans: 0 }))
    }

    const totalWeight = DEFAULT_HOURS.reduce((sum, h) => sum + h.weight, 0)
    const factor = totalScanned / totalWeight

    return DEFAULT_HOURS.map((h) => ({
      hour: h.hour,
      label: h.label,
      scans: Math.max(0, Math.round(h.weight * factor)),
    }))
  }, [data, totalScanned])

  const peakDisplay = useMemo(() => {
    if (propPeakTime) return propPeakTime

    const maxPoint = chartData.reduce(
      (max, curr) => (curr.scans > max.scans ? curr : max),
      chartData[0] ?? { label: '-', scans: 0 },
    )

    return maxPoint.scans > 0 ? maxPoint.label : '-'
  }, [chartData, propPeakTime])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground">
            Peak Hour Traffic
          </CardTitle>

          {/* Peak Time Highlight Metric in Center */}
          <div className="text-center sm:-ml-12">
            <div className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl" data-testid="peak-time-value">
              {peakDisplay}
            </div>
            <div className="text-xs font-medium text-muted-foreground sm:text-sm">
              Peak Time
            </div>
          </div>

          {/* Legend Indicator */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="size-3 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Scans</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="h-[220px] w-full sm:h-[260px]" data-testid="peak-hours-chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="peakHourTrafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-border/40"
              />
              <XAxis
                dataKey="label"
                ticks={TICK_HOURS}
                axisLine={{ stroke: 'currentColor', className: 'stroke-border/60' }}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground/70"
                dy={6}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground/70"
                width={38}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="scans"
                stroke="#3b82f6"
                strokeWidth={2.5}
                fill="url(#peakHourTrafficGradient)"
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                  fill: '#3b82f6',
                  className: 'shadow-md',
                }}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
