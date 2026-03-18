"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

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
      className="text-[10px] font-black uppercase tracking-tighter"
      style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function AttendeeTypeChart({ data }: Props) {
  if (!data || data.length === 0) return null

  const chartData = data.map(d => ({ name: d.name, value: d.count }))

  return (
    <div className="w-full h-[280px] pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomizedLabel}
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((_, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[index % COLORS.length]} 
                className="transition-all duration-300 hover:opacity-80 outline-none"
              />
            ))}
          </Pie>
          <Tooltip
            cursor={{ fill: 'transparent' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="glass-elevated border-white/10 p-3 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">{payload[0].name}</p>
                    <p className="text-sm font-black text-foreground">
                      {typeof payload[0].value === 'number' ? payload[0].value.toLocaleString() : payload[0].value} 
                      <span className="ml-1 text-[10px] font-medium text-muted-foreground opacity-60 italic">Participants</span>
                    </p>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={6}
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 hover:text-primary transition-colors cursor-default">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
