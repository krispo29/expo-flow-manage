"use client"

import { useState } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"

interface AttendeeTypeData {
  name: string
  count: number
}

const COLORS = [
  "hsl(180 35% 22%)", // Deep Teal
  "hsl(180 60% 50%)", // Aurora Cyan
  "hsl(210 70% 60%)", // Aurora Blue
  "hsl(38 50% 55%)",  // Muted Gold
  "hsl(195 40% 45%)", // Slate Blue
  "hsl(180 15% 40%)", // Muted Teal
  "hsl(38 30% 75%)",  // Soft Sand
  "hsl(160 50% 45%)", // Emerald / Mint
  "hsl(280 40% 60%)", // Muted Purple
  "hsl(15 65% 55%)",  // Terracotta / Coral
]

interface Props {
  data: AttendeeTypeData[]
}

const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.08) return null
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor="middle" 
      dominantBaseline="central" 
      className="text-[10px] font-black uppercase tracking-tighter pointer-events-none select-none"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function AttendeeTypeChart({ data }: Props) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (!data || data.length === 0) return null

  const chartData = data.map(d => ({ name: d.name, value: d.count }))
  const total = chartData.reduce((acc, item) => acc + item.value, 0)

  return (
    <div className="flex flex-col w-full">
      {/* Donut Chart Area */}
      <div className="relative w-full h-[210px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              innerRadius={56}
              outerRadius={86}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, index) => {
                const isHovered = hoveredIndex === index
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    className={cn(
                      "transition-all duration-300 outline-none cursor-pointer",
                      hoveredIndex !== null && !isHovered ? "opacity-40" : "opacity-100",
                      isHovered && "filter drop-shadow-md"
                    )}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                )
              })}
            </Pie>
            <Tooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0]
                  const value = typeof item.value === 'number' ? item.value : 0
                  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0'

                  return (
                    <div className="glass-elevated border-white/10 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-1">
                        {item.name}
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-foreground">
                          {value.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          ({percent}%)
                        </span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="font-display text-xl font-black text-foreground tracking-tight">
            {total.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 -mt-0.5">
            Total
          </span>
        </div>
      </div>

      {/* Legend Area (wrapped cleanly in flexbox, never pushes/clips SVG) */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-3 px-1 text-center">
        {chartData.map((item, index) => {
          const isHovered = hoveredIndex === index
          return (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-default",
                isHovered
                  ? "text-primary scale-105"
                  : hoveredIndex !== null
                    ? "text-muted-foreground/40"
                    : "text-muted-foreground/70 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "size-2 rounded-full shrink-0 transition-transform duration-200",
                  isHovered && "scale-125"
                )}
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="truncate max-w-[140px]">{item.name}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
