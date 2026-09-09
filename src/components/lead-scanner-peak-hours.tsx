'use client'

import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { HourlyTrafficPoint, TrafficChart } from '@/app/actions/lead-scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  chart?: TrafficChart
  data?: HourlyTrafficPoint[]
  peakTime?: string
}

const ZERO_HOURS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`,
  scans: 0,
}))

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

export function LeadScannerPeakHours({ chart, data, peakTime: propPeakTime }: Props) {
  const chartData = useMemo(() => {
    if (chart?.data.length) return chart.data
    if (data?.length) return data
    return ZERO_HOURS
  }, [chart, data])

  const peakDisplay = useMemo(() => {
    if (propPeakTime) return propPeakTime
    if (chart?.peakHour !== undefined) {
      return chartData.find((point) => String(point.hour) === String(chart.peakHour))?.label ?? '-'
    }

    const maxPoint = chartData.reduce(
      (max, curr) => (curr.scans > max.scans ? curr : max),
      chartData[0] ?? { label: '-', scans: 0 },
    )

    return maxPoint.scans > 0 ? maxPoint.label : '-'
  }, [chart, chartData, propPeakTime])

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
                ticks={chartData.length === 24 ? TICK_HOURS : undefined}
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
