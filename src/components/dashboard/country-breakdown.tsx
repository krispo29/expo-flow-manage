"use client"

interface CountryData {
  country: string
  count: number
}

interface Props {
  data: CountryData[]
  total: number
}

export function CountryBreakdown({ data, total }: Props) {
  if (!data || data.length === 0) return null

  const maxCount = data[0]?.count || 1

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        const barWidth = Math.round((item.count / maxCount) * 100)
        return (
          <div key={item.country} className="group">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                <span className="text-sm font-medium truncate max-w-[150px]">{item.country}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-muted-foreground">{pct}%</span>
                <span className="text-sm font-semibold tabular-nums w-12 text-right">{item.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
