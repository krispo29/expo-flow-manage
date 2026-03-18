"use client"

import { cn } from "@/lib/utils"

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

  const maxCount = Math.max(...data.map(d => d.count)) || 1

  return (
    <div className="space-y-4">
      {data.map((item, i) => {
        const pct = total > 0 ? Math.round((item.count / total) * 100) : 0
        const barWidth = Math.round((item.count / maxCount) * 100)
        
        return (
          <div key={item.country} className="group/item relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="flex size-5 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary transition-colors group-hover/item:bg-primary/20">
                  {i + 1}
                </div>
                <span className="text-sm font-bold tracking-tight truncate max-w-[140px] group-hover/item:text-primary transition-colors">
                  {item.country}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                  {pct}%
                </span>
                <span className="text-sm font-black tabular-nums text-right min-w-[40px]">
                  {item.count.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
              <div
                className="absolute top-0 left-0 h-full bg-aurora-gradient rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(45,212,191,0.3)]"
                style={{ width: `${barWidth}%` }}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 shimmer" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
