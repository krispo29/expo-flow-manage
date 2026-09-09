'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Calendar, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { HourlyTrafficPoint, TrafficChart } from '@/app/actions/lead-scanner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

function parseDateAndHour(point: { date?: string; label: string; hour?: number | string }) {
  if (point.date && /^\d{4}-\d{2}-\d{2}$/.test(point.date)) {
    const rawTime = point.label.replace(point.date, '').trim()
    return {
      dateStr: point.date,
      timeStr: rawTime || String(point.hour ?? point.label),
    }
  }

  const match = point.label.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/)
  if (match) {
    return {
      dateStr: match[1],
      timeStr: match[2] || String(point.hour ?? ''),
    }
  }

  return {
    dateStr: undefined,
    timeStr: point.label,
  }
}

function formatFriendlyDate(dateStr?: string, formatType: 'full' | 'short' = 'short') {
  if (!dateStr) return ''
  try {
    const parsed = parseISO(dateStr)
    if (isNaN(parsed.getTime())) return dateStr
    return formatType === 'full' ? format(parsed, 'EEE, d MMM yyyy') : format(parsed, 'd MMM')
  } catch {
    return dateStr
  }
}

function formatHourRange(timeStr: string) {
  const match12 = timeStr.match(/^(\d{1,2})\s*(AM|PM)$/i)
  if (match12) {
    const hour = parseInt(match12[1], 10)
    const meridian = match12[2].toUpperCase()
    let nextHour = hour + 1
    let nextMeridian = meridian

    if (hour === 11) {
      nextHour = 12
      nextMeridian = meridian === 'AM' ? 'PM' : 'AM'
    } else if (hour === 12) {
      nextHour = 1
    }

    return `${hour}:00 ${meridian} – ${nextHour}:00 ${nextMeridian}`
  }

  const match24 = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (match24) {
    const h = parseInt(match24[1], 10)
    const nextH = (h + 1) % 24
    return `${timeStr} – ${String(nextH).padStart(2, '0')}:${match24[2]}`
  }

  return timeStr
}

function parsePeakDisplay(rawPeak: string) {
  if (!rawPeak || rawPeak === '-') {
    return { time: '-', date: null }
  }

  const match = rawPeak.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/)
  if (match) {
    const dateStr = match[1]
    const timeStr = match[2] || rawPeak
    return {
      time: timeStr,
      date: formatFriendlyDate(dateStr, 'full'),
    }
  }

  return {
    time: rawPeak,
    date: null,
  }
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  pointMap?: Map<string, { dateStr?: string; timeStr: string }>
}

function CustomTooltip({ active, payload, label, pointMap }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const value = payload[0].value
    const meta = label ? pointMap?.get(label) : undefined
    const displayTime = meta ? meta.timeStr : label || ''
    const displayDate = meta?.dateStr ? formatFriendlyDate(meta.dateStr, 'full') : null
    const timeRange = formatHourRange(displayTime)

    return (
      <div className="rounded-xl border border-border/80 bg-popover/95 p-3 shadow-xl backdrop-blur text-xs min-w-[180px]">
        {displayDate && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground mb-1.5">
            <Calendar className="size-3 text-muted-foreground/70" />
            <span>{displayDate}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
          <Clock className="size-3.5 text-primary" />
          <span>{timeRange}</span>
        </div>
        <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500 shadow-sm" />
            Total Scans
          </span>
          <span className="font-extrabold text-foreground text-sm">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        </div>
      </div>
    )
  }
  return null
}

interface CustomXAxisTickProps {
  x?: number
  y?: number
  payload?: { value: string; index: number }
  pointMap?: Map<string, { dateStr?: string; timeStr: string; index: number }>
  firstDateMap?: Map<string, number>
  isMultiDay?: boolean
}

function CustomXAxisTick({
  x,
  y,
  payload,
  pointMap,
  firstDateMap,
  isMultiDay,
}: CustomXAxisTickProps) {
  if (!payload) return null
  const meta = pointMap?.get(payload.value)
  const timeStr = meta ? meta.timeStr : payload.value
  const dateStr = meta?.dateStr
  const isFirstOfDate = Boolean(
    isMultiDay && dateStr && firstDateMap && firstDateMap.get(dateStr) === meta?.index,
  )

  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        className="fill-muted-foreground/70 text-[11px] font-medium"
      >
        {timeStr}
      </text>
      {isFirstOfDate && dateStr && (
        <g>
          <rect
            x={-20}
            y={17}
            width={40}
            height={16}
            rx={4}
            className="fill-primary/10 stroke-primary/25"
            strokeWidth={1}
          />
          <text
            x={0}
            y={0}
            dy={29}
            textAnchor="middle"
            className="fill-primary text-[10px] font-bold"
          >
            {formatFriendlyDate(dateStr, 'short')}
          </text>
        </g>
      )}
    </g>
  )
}

export function LeadScannerPeakHours({ chart, data, peakTime: propPeakTime }: Props) {
  const [selectedDay, setSelectedDay] = useState<string>('all')

  const baseChartData = useMemo(() => {
    if (chart?.data.length) return chart.data
    if (data?.length) return data
    return ZERO_HOURS
  }, [chart, data])

  // Extract date info from points
  const { availableDates } = useMemo(() => {
    const dates: string[] = []
    baseChartData.forEach((point) => {
      const { dateStr } = parseDateAndHour(point)
      if (dateStr && !dates.includes(dateStr)) {
        dates.push(dateStr)
      }
    })
    return { availableDates: dates }
  }, [baseChartData])

  // Active data based on selected day
  const activeChartData = useMemo(() => {
    if (selectedDay === 'all' || availableDates.length <= 1) {
      return baseChartData
    }
    const filtered = baseChartData.filter((point) => {
      const { dateStr } = parseDateAndHour(point)
      return dateStr === selectedDay
    })
    return filtered.length ? filtered : baseChartData
  }, [selectedDay, availableDates, baseChartData])

  const isMultiDay = availableDates.length > 1 && selectedDay === 'all'

  // Map points and first date indices for ticks & boundary reference lines
  const { pointMap, firstDateMap, dayBoundaries, tickLabels } = useMemo(() => {
    const map = new Map<string, { dateStr?: string; timeStr: string; index: number }>()
    const dateFirst = new Map<string, number>()
    const boundaries: string[] = []
    const ticks: string[] = []

    activeChartData.forEach((point, idx) => {
      const { dateStr, timeStr } = parseDateAndHour(point)
      map.set(point.label, { dateStr, timeStr, index: idx })

      if (dateStr) {
        if (!dateFirst.has(dateStr)) {
          dateFirst.set(dateStr, idx)
          if (idx > 0) {
            boundaries.push(point.label)
          }
        }
      }
    })

    if (activeChartData.length === 24) {
      // Pick representative hours when single day
      const hasTickHours = TICK_HOURS.every((h) => map.has(h))
      if (hasTickHours) {
        ticks.push(...TICK_HOURS)
      } else {
        activeChartData.forEach((point, idx) => {
          if (idx % 3 === 1) ticks.push(point.label)
        })
      }
    } else if (isMultiDay) {
      // Pick 3-4 evenly spaced ticks per day so labels stay uncluttered
      availableDates.forEach((date) => {
        const dayPoints = activeChartData.filter((p) => parseDateAndHour(p).dateStr === date)
        if (dayPoints.length <= 4) {
          dayPoints.forEach((p) => ticks.push(p.label))
        } else {
          const step = Math.floor(dayPoints.length / 3)
          ticks.push(dayPoints[0].label)
          if (step < dayPoints.length) ticks.push(dayPoints[step].label)
          if (step * 2 < dayPoints.length) ticks.push(dayPoints[step * 2].label)
        }
      })
    }

    return {
      pointMap: map,
      firstDateMap: dateFirst,
      dayBoundaries: boundaries,
      tickLabels: ticks.length ? ticks : undefined,
    }
  }, [activeChartData, availableDates, isMultiDay])

  // Compute peak time value
  const peakDisplay = useMemo(() => {
    if (selectedDay === 'all') {
      if (propPeakTime) return propPeakTime
      if (chart?.peakHour !== undefined) {
        return baseChartData.find((point) => String(point.hour) === String(chart.peakHour))?.label ?? '-'
      }
    }

    const maxPoint = activeChartData.reduce(
      (max, curr) => (curr.scans > max.scans ? curr : max),
      activeChartData[0] ?? { label: '-', scans: 0 },
    )

    return maxPoint.scans > 0 ? maxPoint.label : '-'
  }, [chart, baseChartData, activeChartData, propPeakTime, selectedDay])

  const parsedPeak = useMemo(() => parsePeakDisplay(peakDisplay), [peakDisplay])

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight text-foreground">
              Peak Hour Traffic
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hourly attendee & visitor activity
            </p>
          </div>

          {/* Peak Time Highlight Metric in Center */}
          <div className="text-center sm:-ml-12">
            <div
              className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl"
              data-testid="peak-time-value"
            >
              {parsedPeak.time}
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground sm:text-sm">
              {parsedPeak.date && (
                <>
                  <span className="font-semibold text-foreground/80">{parsedPeak.date}</span>
                  <span>•</span>
                </>
              )}
              <span>Peak Time</span>
            </div>
          </div>

          {/* Legend Indicator */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="size-3 rounded-full bg-blue-500 shadow-sm" />
            <span className="text-xs font-medium text-muted-foreground">Scans</span>
          </div>
        </div>

        {/* Day Switcher Filter Tabs (Only shown when data covers multiple days) */}
        {availableDates.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 mt-3 border-t border-border/40">
            <button
              type="button"
              onClick={() => setSelectedDay('all')}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer',
                selectedDay === 'all'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              All Days ({availableDates.length})
            </button>
            {availableDates.map((dateStr, idx) => (
              <button
                key={dateStr}
                type="button"
                onClick={() => setSelectedDay(dateStr)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer',
                  selectedDay === dateStr
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                Day {idx + 1} ({formatFriendlyDate(dateStr, 'short')})
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        <div
          className={cn('w-full', isMultiDay ? 'h-[240px] sm:h-[280px]' : 'h-[220px] sm:h-[260px]')}
          data-testid="peak-hours-chart-container"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={activeChartData}
              margin={{ top: 15, right: 15, left: -20, bottom: isMultiDay ? 15 : 5 }}
            >
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
                ticks={tickLabels}
                axisLine={{ stroke: 'currentColor', className: 'stroke-border/60' }}
                tickLine={false}
                tick={
                  <CustomXAxisTick
                    pointMap={pointMap}
                    firstDateMap={firstDateMap}
                    isMultiDay={isMultiDay}
                  />
                }
                height={isMultiDay ? 46 : 30}
                dy={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                domain={[0, (dataMax: number) => Math.max(5, dataMax)]}
                tick={{ fontSize: 11, fill: 'currentColor' }}
                className="text-muted-foreground/70"
                width={38}
              />
              <Tooltip content={<CustomTooltip pointMap={pointMap} />} />
              {isMultiDay &&
                dayBoundaries.map((boundaryLabel) => (
                  <ReferenceLine
                    key={boundaryLabel}
                    x={boundaryLabel}
                    stroke="currentColor"
                    strokeDasharray="4 4"
                    strokeOpacity={0.25}
                    className="stroke-muted-foreground"
                  />
                ))}
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
